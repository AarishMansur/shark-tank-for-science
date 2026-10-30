import type { Dataset } from "../data/dataset"
import type { TraceLine } from "../room/trace"

const c = (code: number) => (s: string) => (process.stdout.isTTY ? `\x1b[${code}m${s}\x1b[0m` : s)
const dim = c(2), red = c(31), green = c(32), yellow = c(33), blue = c(34), magenta = c(35), cyan = c(36)

// A readable live view of the room, built from the same trace lines that go to disk.
export function printLine(l: TraceLine, ds: Dataset): void {
	const d = l.data as any
	const t = dim(`${(l.ms / 1000).toFixed(1).padStart(6)}s`)
	const who = (s: string) => cyan(s.padEnd(16))
	const pair = l.pairId ? describe(l.pairId, ds) : ""
	switch (l.type) {
		case "room.opened":
			return console.log(`${t} ${who(l.agent)} room open: ${d.challenges} challenges, ${d.researchers} researchers, mode ${d.mode}, agents: ${d.agents.join(", ")}`)
		case "scout.shortlist":
			return console.log(`${t} ${who(l.agent)} shortlisted ${d.candidates.length} pairs (${d.lens})`)
		case "pitch.card":
			return console.log(`${t} ${who(l.agent)} ${blue("PITCH")} ${pair}: ${d.headline}`)
		case "pair.seconded":
			return console.log(`${t} ${who(l.agent)} seconds ${pair}`)
		case "critic.kill":
			return console.log(`${t} ${who(l.agent)} ${red("KILL")} ${d.by}: "${String(d.text).slice(0, 90)}" ${dim(`(${d.reason})`)}`)
		case "shark.verdict":
			return console.log(`${t} ${who(l.agent)} ${d.verdict === "invest" ? green("INVEST") : yellow("PASS")} ${d.confidence}/10 ${pair}`)
		case "pair.status":
			if (d.status === "killed") return console.log(`${t} ${who(l.agent)} ${red("OUT")} ${pair}: ${d.note}`)
			if (d.status === "survived" || d.status === "wildcard") return console.log(`${t} ${who(l.agent)} ${green(d.status.toUpperCase())} ${pair}: ${d.note}`)
			if (d.status === "proposed") return console.log(`${t} ${who(l.agent)} ${magenta("PROPOSAL")} ${pair}: ${d.note}`)
			if (d.status === "review") return console.log(`${t} ${who(l.agent)} ${yellow("REVIEW")} ${pair}: ${d.note}`)
			if (d.status === "returned") return console.log(`${t} ${who(l.agent)} ${yellow("RETURNED")} ${pair}: ${d.note}`)
			return
		case "human.decision":
			return console.log(`${t} ${who(l.agent)} ${d.approved ? green("APPROVED") : red("REJECTED")} ${pair}${d.note ? `: ${d.note}` : ""}`)
		case "model.retry":
			return console.log(`${t} ${who(l.agent)} ${dim(`retry ${d.attempt + 1}: ${String(d.error).slice(0, 80)}`)}`)
		case "agent.crash":
		case "replay.missing":
			return console.log(`${t} ${who(l.agent)} ${red(l.type)} ${JSON.stringify(d).slice(0, 160)}`)
		case "room.closed":
			return console.log(`${t} ${who(l.agent)} room closed with ${d.proposals} proposals`)
	}
}

function describe(pairId: string, ds: Dataset): string {
	const [r, ch] = pairId.split("x")
	const name = ds.researchers.get(r)?.name ?? r
	const company = ds.challenges.get(ch)?.company.name ?? ch
	return `${name} x ${company}`
}
