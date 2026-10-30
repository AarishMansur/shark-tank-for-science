// Critic accuracy eval: hand labelled true claims plus planted false ones, run through
// the same two layers the room uses (rules in code, then the model check with the
// exact production prompt). Model answers are saved, so a run without a key replays them.
import "dotenv/config"
import { createHash } from "node:crypto"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { DeveloperMessageItem, ModelContext, ModelMessageItem, UserMessageItem, supportedModels } from "@mozaik-ai/core"
import { CRITIC_INSTRUCTION, checkPrompt } from "../agents/critic"
import { parseJson } from "../llm/ask"
import { isRetryable, retryDelayMs, sleep } from "../llm/throttle"
import { Dataset } from "../data/dataset"
import { checkClaimRules, lexicalSupport } from "../room/citations"
import { supportSchema } from "../room/schemas"

type Case = { id: string; pair: string; label: "true" | "false"; category: string; text: string; sourceIds: string[]; why: string }
type Pair = { researcherId: string; companyId: string; challengeId: string }
type Verdict = { killed: boolean; layer: "rule" | "model" | "none"; reason: string }

const args = process.argv.slice(2)
const flag = (n: string, d: string) => (args.includes(n) ? args[args.indexOf(n) + 1] : d)
const MODEL = flag("--model", "gemini-3.5-flash-lite")
const REPS = Number(flag("--reps", "3"))
const BATCH = 8
const ANSWERS = "eval/critic-answers.json"

const ds = Dataset.load(flag("--data", "data"))
const spec = JSON.parse(readFileSync("eval/critic-cases.json", "utf8")) as { pairs: Record<string, Pair>; cases: Case[] }
const answers: Record<string, { model: string; text: string }> = existsSync(ANSWERS) ? JSON.parse(readFileSync(ANSWERS, "utf8")) : {}
process.env.GEMINI_API_KEY ||= process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY || ""
const live = !args.includes("--offline") && !!process.env.GEMINI_API_KEY

// Seeded shuffle so true and false claims are mixed in each batch, like a real pitch.
function shuffle<T>(xs: T[], seed: number): T[] {
	const a = [...xs]
	let s = seed
	for (let i = a.length - 1; i > 0; i--) {
		s = (s * 1103515245 + 12345) % 2147483648
		const j = s % (i + 1)
		;[a[i], a[j]] = [a[j], a[i]]
	}
	return a
}

async function askModel(prompt: string, rep: number): Promise<{ text: string; source: "live" | "saved" } | null> {
	const key = createHash("sha256").update(`${MODEL}\n${rep}\n${CRITIC_INSTRUCTION}\n${prompt}`).digest("hex").slice(0, 16)
	if (answers[key]) return { text: answers[key].text, source: "saved" }
	if (!live) return null
	const model = supportedModels.find((m) => m.specification.name === MODEL)
	if (!model) throw new Error(`Unsupported model ${MODEL}`)
	for (let attempt = 0; attempt < 6; attempt++) {
		try {
			const out = await model.endpoint.infer({
				model: MODEL,
				context: ModelContext.rehydrate({ id: `eval:${key}`, items: [DeveloperMessageItem.create(CRITIC_INSTRUCTION), UserMessageItem.create(prompt)] }),
				structuredOutput: supportSchema,
			})
			const text = out.items.filter((i): i is ModelMessageItem => i instanceof ModelMessageItem).map((i) => i.content.text).join("")
			answers[key] = { model: MODEL, text }
			writeFileSync(ANSWERS, JSON.stringify(answers, null, 1) + "\n")
			await sleep(5000) // stay well under the free tier per-minute limit
			return { text, source: "live" }
		} catch (error) {
			console.error(`  model error (attempt ${attempt + 1}): ${String((error as any)?.message ?? error).slice(0, 160)}`)
			if (!isRetryable(error)) return null
			await sleep(retryDelayMs(error, attempt))
		}
	}
	return null
}

async function main() {
	const cases = spec.cases
	const runs: Record<string, Verdict>[] = []
	let sources = new Set<string>()
	for (let rep = 0; rep < REPS; rep++) {
		const v: Record<string, Verdict> = {}
		const pending: Case[] = []
		for (const c of cases) {
			const res = checkClaimRules(ds, { text: c.text, sourceIds: c.sourceIds }, spec.pairs[c.pair])
			if (!res.ok) v[c.id] = { killed: true, layer: "rule", reason: res.reason }
			else pending.push(c)
		}
		for (const pair of Object.keys(spec.pairs)) {
			const mine = shuffle(pending.filter((c) => c.pair === pair), 7 + rep * 101 + pair.length)
			for (let i = 0; i < mine.length; i += BATCH) {
				const batch = mine.slice(i, i + BATCH)
				const keyed = batch.map((c, k) => ({ key: `c${k + 1}`, claim: { by: "Problem Hunter", text: c.text, sourceIds: c.sourceIds } }))
				const ans = await askModel(checkPrompt(ds, keyed), rep)
				if (!ans) {
					console.error(`No model answer for ${pair} batch ${i / BATCH + 1}, rep ${rep + 1}. Set GEMINI_API_KEY or drop --offline.`)
					process.exit(1)
				}
				sources.add(ans.source)
				const out = parseJson(ans.text)
				const checks = new Map<string, any>()
				for (const ch of Array.isArray(out?.checks) ? out.checks : []) checks.set(String(ch.claim).replace(/[()]/g, ""), ch)
				batch.forEach((c, k) => {
					const ch = checks.get(`c${k + 1}`)
					// Same fail-closed behaviour as the room: no verdict means killed.
					if (!ch) v[c.id] = { killed: true, layer: "model", reason: "no verdict returned" }
					else v[c.id] = { killed: !ch.supported, layer: ch.supported ? "none" : "model", reason: String(ch.reason ?? "") }
				})
			}
		}
		runs.push(v)
		console.log(`rep ${rep + 1}: done`)
	}
	report(cases, runs, [...sources])
}

function report(cases: Case[], runs: Record<string, Verdict>[], sources: string[]) {
	const F = cases.filter((c) => c.label === "false")
	const T = cases.filter((c) => c.label === "true")
	const pct = (a: number, b: number) => `${((100 * a) / b).toFixed(0)}%`
	const caught = runs.map((v) => F.filter((c) => v[c.id].killed).length)
	const falseKills = runs.map((v) => T.filter((c) => v[c.id].killed).length)
	const ruleCaught = F.filter((c) => runs[0][c.id].layer === "rule").length
	// Offline stand-in used by mock mode, for comparison: lexical overlap >= 0.3.
	const lex = (c: Case) => !checkClaimRules(ds, c, spec.pairs[c.pair]).ok || lexicalSupport(ds, c) < 0.3
	const lexCaught = F.filter(lex).length
	const lexFalse = T.filter(lex).length
	const cats = [...new Set(F.map((c) => c.category))]
	const lines: string[] = []
	lines.push(`# Critic eval results`, ``)
	lines.push(`Generated by \`npm run eval:critic\`. ${F.length} planted false claims and ${T.length} hand labelled true claims (eval/critic-cases.json), checked against the synthetic EINSTEIN dataset.`)
	lines.push(`Model layer: ${MODEL}, the production critic prompt, ${runs.length} repetitions, batches of up to ${BATCH} mixed claims per call. Model answers: ${sources.map((x) => (x === "live" ? "live Gemini calls" : "replayed from the saved answers of a live run")).join(" and ")}, kept in ${ANSWERS}.`, ``)
	lines.push(`| | Caught (false claims killed) | False kills (true claims killed) |`, `| --- | --- | --- |`)
	runs.forEach((_, r) => lines.push(`| Rules + model, run ${r + 1} | ${caught[r]}/${F.length} (${pct(caught[r], F.length)}) | ${falseKills[r]}/${T.length} (${pct(falseKills[r], T.length)}) |`))
	lines.push(`| Rules only (no model) | ${ruleCaught}/${F.length} (${pct(ruleCaught, F.length)}) | 0/${T.length} (0%) |`)
	lines.push(`| Rules + lexical stand-in (mock mode) | ${lexCaught}/${F.length} (${pct(lexCaught, F.length)}) | ${lexFalse}/${T.length} (${pct(lexFalse, T.length)}) |`, ``)
	lines.push(`## By category (false claims caught, all runs)`, ``, `| Category | Caught | Layer |`, `| --- | --- | --- |`)
	for (const cat of cats) {
		const cs = F.filter((c) => c.category === cat)
		const n = runs.reduce((a, v) => a + cs.filter((c) => v[c.id].killed).length, 0)
		const layers = [...new Set(cs.flatMap((c) => runs.map((v) => v[c.id].layer)))].join(", ")
		lines.push(`| ${cat} | ${n}/${cs.length * runs.length} | ${layers} |`)
	}
	lines.push(``, `## Every case`, ``, `| Case | Label | Claim | ${runs.map((_, r) => `Run ${r + 1}`).join(" | ")} |`, `| --- | --- | --- | ${runs.map(() => "---").join(" | ")} |`)
	for (const c of cases) {
		const cell = (v: Record<string, Verdict>) => {
			const x = v[c.id]
			const ok = (c.label === "false") === x.killed
			return `${ok ? "ok" : "**WRONG**"}: ${x.killed ? `killed (${x.layer})` : "kept"}`
		}
		lines.push(`| ${c.id} | ${c.label === "false" ? c.category : "true"} | ${c.text.replace(/\|/g, "/")} | ${runs.map(cell).join(" | ")} |`)
	}
	const misses = cases.flatMap((c) => runs.map((v, r) => ({ c, r, x: v[c.id] }))).filter(({ c, x }) => (c.label === "false") !== x.killed)
	if (misses.length) {
		lines.push(``, `## Mistakes, with the model's reason`, ``)
		for (const { c, r, x } of misses) lines.push(`- ${c.id} run ${r + 1}: ${x.killed ? "killed a true claim" : "kept a false claim"}. Claim: "${c.text}" Truth: ${c.why}. Model said: ${x.reason.replace(/\n/g, " ")}`)
	}
	const md = lines.join("\n").replace(/\u2014/g, "-") + "\n"
	writeFileSync("eval/critic-results.md", md)
	writeFileSync("eval/critic-results.json", JSON.stringify({ model: MODEL, reps: runs.length, falseTotal: F.length, trueTotal: T.length, caught, falseKills, ruleCaught, lexical: { caught: lexCaught, falseKills: lexFalse }, runs }, null, 1) + "\n")
	console.log(lines.slice(0, 10).join("\n"))
}

main()
