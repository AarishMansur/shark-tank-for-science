import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"

const tsx = (args: string[]) => execFileSync(process.execPath, ["--import", "tsx", "src/main.ts", ...args], { encoding: "utf8", env: { ...process.env, GEMINI_API_KEY: "", GOOGLE_GENERATIVE_AI_API_KEY: "" }, timeout: 120_000 })

test("a mock run on the fixture dataset produces proposals, a trace and critic kills", () => {
	const out = mkdtempSync(join(tmpdir(), "stfs-"))
	tsx(["--mock", "--data", "tests/fixtures/data", "--out", out, "--quiet"])
	const proposals = readdirSync(join(out, "proposals"))
	assert.ok(proposals.length >= 3, `expected at least 3 proposals, got ${proposals.length}`)
	const trace = readFileSync(join(out, "trace.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l))
	assert.ok(trace.some((l) => l.type === "critic.kill"), "the critic should kill the planted foreign citation")
	assert.ok(trace.some((l) => l.type === "room.closed"))
	// Concurrency: at some moment at least two different agents have a model call open.
	const open = new Map<string, string>()
	let overlap = false
	for (const l of trace) {
		if (l.type === "bus.inference.started") open.set(l.data.loopId, l.agent)
		if (l.type === "bus.inference.completed") open.delete(l.data.loopId)
		if (new Set(open.values()).size >= 2) overlap = true
	}
	assert.ok(overlap, "agents should think at the same time")
	for (const f of proposals) {
		const md = readFileSync(join(out, "proposals", f), "utf8")
		assert.ok(md.includes("## Risks and rebuttals"))
		assert.ok(!md.includes("\u2014"), "no em dashes in proposals")
	}
	assert.ok(existsSync(join(out, "pitch-room.html")))
})

test("a reverse search mock run pairs researchers with a free text problem", () => {
	const out = mkdtempSync(join(tmpdir(), "stfs-"))
	tsx(["--mock", "--data", "tests/fixtures/data", "--out", out, "--quiet", "--problem", "We mill wheat and need to predict flour quality and moisture from sensor data before it leaves the plant"])
	const board = JSON.parse(readFileSync(join(out, "board.json"), "utf8"))
	assert.ok(board.length >= 1)
	assert.ok(board.every((c: any) => c.pitch.challengeId === "Q-1"))
})

test("the committed recording replays without a key", { skip: !existsSync("data/researchers.json") && "full dataset not downloaded (npm run data)" }, () => {
	if (!existsSync("recordings/main-run.json")) return
	const out = mkdtempSync(join(tmpdir(), "stfs-"))
	tsx(["--replay", "recordings/main-run.json", "--out", out, "--quiet", "--speed", "0"])
	const trace = readFileSync(join(out, "trace.jsonl"), "utf8")
	assert.ok(!trace.includes('"replay.missing"'), "every model call should be in the recording")
	assert.ok(readdirSync(join(out, "proposals")).length >= 3)
})

test("--approve asks a human before writing and a rejection stops the pair", () => {
	const out = mkdtempSync(join(tmpdir(), "stfs-"))
	const log = execFileSync(process.execPath, ["--import", "tsx", "src/main.ts", "--mock", "--approve", "--data", "tests/fixtures/data", "--out", out, "--quiet"], {
		encoding: "utf8",
		input: "n not now\n" + "y\n".repeat(40),
		env: { ...process.env, GEMINI_API_KEY: "", GOOGLE_GENERATIVE_AI_API_KEY: "" },
		timeout: 120_000,
	})
	assert.match(log, /APPROVAL NEEDED/)
	const lines = readFileSync(join(out, "trace.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l))
	const decisions = lines.filter((l) => l.type === "human.decision")
	assert.ok(decisions.length >= 2)
	const rejected = decisions.find((d) => !d.data.approved)!
	assert.equal(rejected.data.note, "not now")
	const board = JSON.parse(readFileSync(join(out, "board.json"), "utf8"))
	const card = board.find((c: any) => c.pairId === rejected.pairId)
	assert.equal(card.status, "killed")
	assert.equal(card.killedBy, "Human reviewer")
	// Every proposal was approved first.
	for (const c of board.filter((c: any) => c.status === "proposed")) assert.equal(c.human?.approved, true)
})

test("a replay reads human decisions from the recording", { skip: !existsSync("data/researchers.json") && "full dataset not downloaded (npm run data)" }, () => {
	if (!existsSync("recordings/reverse-run.json")) return
	const dir = mkdtempSync(join(tmpdir(), "stfs-"))
	const rec = JSON.parse(readFileSync("recordings/reverse-run.json", "utf8"))
	rec.args = [...rec.args, "--approve"]
	rec.humanDecisions = { "R0774xQ-1": { approved: true, note: "" }, "R0863xQ-1": { approved: false, note: "already working with them" } }
	writeFileSync(join(dir, "rec.json"), JSON.stringify(rec))
	tsx(["--replay", join(dir, "rec.json"), "--out", join(dir, "out"), "--quiet", "--speed", "0"])
	const board = JSON.parse(readFileSync(join(dir, "out", "board.json"), "utf8"))
	assert.equal(board.find((c: any) => c.pairId === "R0774xQ-1").status, "proposed")
	const rejected = board.find((c: any) => c.pairId === "R0863xQ-1")
	assert.equal(rejected.status, "killed")
	assert.match(rejected.killReason, /already working with them/)
	assert.ok(readFileSync(join(dir, "out", "pitch-room.html"), "utf8").includes("human"))
})
