import "dotenv/config"
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { Dataset } from "./data/dataset"
import { loadRecording, saveRecording, type Recording } from "./llm/recording"
import { renderHtml } from "./report/html"
import { renderProposal, renderSummary, slug } from "./report/markdown"
import { printLine } from "./report/terminal"
import { runRoom, type RunOptions } from "./room/run"
import { Trace } from "./room/trace"

// Mozaik's cloud SDK warns once per agent loop when telemetry is off. Say it once.
const warn = console.warn.bind(console)
let warnedCloud = false
console.warn = (...a: unknown[]) => {
	if (typeof a[0] === "string" && a[0].startsWith("mozaik cloud:")) {
		if (warnedCloud) return
		warnedCloud = true
	}
	warn(...a)
}

const HELP = `Shark Tank for Science: a Mozaik pitch room for EINSTEIN

  npm start                         live run over every challenge (needs GEMINI_API_KEY)
  npm start -- --problem "text"     reverse search: a company describes a problem
  npm run replay                    replay the committed recording, no key needed
  npm run mock                      offline run with deterministic stand-in answers

Options
  --replay <file>      answer every model call from a recording
  --record <file>      where a live run saves its recording (default recordings/last-run.json)
  --mock               no model calls at all
  --problem "<text>"   reverse search mode
  --sector <name>      only challenges from companies in this sector
  --pitches <n>        pitches per scout (default 3)
  --out <dir>          output folder (default runs/<timestamp>)
  --data <dir>         dataset folder (default data)
  --rpm <n>            model calls per minute across the room (default 12)
  --concurrency <n>    model calls in flight at once (default 4)
  --speed <x>          replay speed factor, 0 for instant (default 0.25)
  --quiet              no live log
`

function parseArgs(argv: string[]): Map<string, string | true> {
	const m = new Map<string, string | true>()
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i]
		if (!a.startsWith("--")) continue
		const next = argv[i + 1]
		if (next !== undefined && !next.startsWith("--")) {
			m.set(a.slice(2), next)
			i++
		} else m.set(a.slice(2), true)
	}
	return m
}

async function main() {
	const argv = process.argv.slice(2)
	let args = parseArgs(argv)
	if (args.has("help")) return console.log(HELP)

	let recording: Recording
	let mode: RunOptions["mode"] = "live"
	const replayFile = args.get("replay")
	if (typeof replayFile === "string") {
		recording = loadRecording(replayFile)
		mode = "replay"
		// A replay reruns the exact room that was recorded.
		const recorded = parseArgs(recording.args)
		for (const k of ["replay", "out", "quiet", "speed", "data"]) recorded.delete(k)
		for (const k of ["out", "quiet", "speed", "data"]) if (args.has(k)) recorded.set(k, args.get(k)!)
		args = recorded
	} else {
		recording = { recordedAt: new Date().toISOString(), model: "", writerModel: "", args: argv, note: "", calls: {} }
		if (args.has("mock")) mode = "mock"
	}

	if (mode === "live") {
		process.env.GEMINI_API_KEY ||= process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY || ""
		if (!process.env.GEMINI_API_KEY) {
			console.error("No GEMINI_API_KEY set. Add it to .env, or try `npm run replay` (recorded run) or `npm run mock` (offline).")
			process.exit(1)
		}
	}

	const str = (k: string, d: string) => (typeof args.get(k) === "string" ? (args.get(k) as string) : d)
	const num = (k: string, d: number) => (typeof args.get(k) === "string" ? Number(args.get(k)) : d)
	const model = mode === "replay" ? recording.model : process.env.MODEL || "gemini-3.5-flash-lite"
	const writerModel = mode === "replay" ? recording.writerModel : process.env.WRITER_MODEL || "gemini-3.5-flash"
	const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
	const outDir = str("out", join("runs", `${stamp}-${mode}`))
	const quiet = args.has("quiet") || (args.get("quiet") === true)

	const opts: RunOptions = {
		mode,
		model,
		writerModel,
		pitchesPerScout: num("pitches", 3),
		shortlistSize: num("shortlist", 8),
		problem: typeof args.get("problem") === "string" ? (args.get("problem") as string) : undefined,
		sector: typeof args.get("sector") === "string" ? (args.get("sector") as string) : undefined,
		maxChallenges: num("max-challenges", 0) || undefined,
		minProposals: num("min-proposals", 3),
		outDir,
		quiet,
		rpm: num("rpm", 12),
		maxConcurrent: num("concurrency", 4),
		replaySpeed: num("speed", 0.25),
		timeoutMs: num("timeout", 45) * 60_000,
	}

	const dataDir = str("data", "data")
	if (!existsSync(join(dataDir, "researchers.json"))) {
		console.error(`Dataset not found in ${dataDir}/. Run \`npm run data\` first.`)
		process.exit(1)
	}
	const ds = Dataset.load(dataDir)
	if (existsSync(outDir)) rmSync(outDir, { recursive: true })
	mkdirSync(join(outDir, "proposals"), { recursive: true })
	const trace = new Trace(join(outDir, "trace.jsonl"))
	if (!quiet) trace.onLine = (l) => printLine(l, ds)

	const recFile = str("record", "recordings/last-run.json")
	const saveRec = () => {
		recording.model = model
		recording.writerModel = writerModel
		recording.note = `Live run against ${model} / ${writerModel}. Replay with: npm start -- --replay ${recFile}`
		saveRecording(recFile, recording)
	}
	// Free tier runs are slow; keep the recording on disk as it grows.
	if (mode === "live") setInterval(saveRec, 15_000).unref()

	const state = await runRoom(ds, opts, recording, trace)

	// Outputs
	const files = new Map<string, string>()
	const proposed = [...state.board.values()].filter((c) => c.status === "proposed" && c.proposal).sort((a, b) => a.pairId.localeCompare(b.pairId))
	proposed.forEach((c, i) => {
		const name = `${String(i + 1).padStart(2, "0")}-${slug(c.proposal!.title)}.md`
		files.set(c.pairId, name)
		writeFileSync(join(outDir, "proposals", name), renderProposal(ds, c, mode))
	})
	writeFileSync(join(outDir, "board.json"), JSON.stringify([...state.board.values()], null, 1))
	writeFileSync(join(outDir, "summary.md"), renderSummary(state, files, mode === "replay" ? recording.args : argv))
	writeFileSync(join(outDir, "pitch-room.html"), renderHtml(state, files))

	if (mode === "live") {
		saveRec()
		console.log(`\nRecording saved to ${recFile} (${Object.keys(recording.calls).length} model calls)`)
	}
	console.log(`\nDone: ${proposed.length} proposals. Outputs in ${outDir}/`)
	console.log(`  summary.md, trace.jsonl, board.json, pitch-room.html, proposals/`)
	process.exit(0)
}

main().catch((e) => {
	console.error(e)
	process.exit(1)
})
