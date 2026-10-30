import { createHuman, type Human } from "@mozaik-ai/core"
import { createInterface } from "node:readline"
import type { Recording } from "../llm/recording"
import { emit, on } from "../room/events"
import type { PairCard } from "../room/types"
import { room } from "../runtime"

const NAME = "Human reviewer"

export type HumanDecision = { approved: boolean; note: string }

// With --approve, nothing reaches the Writer until a person says yes. The reviewer is a
// Mozaik human participant: it sits on the same bus, sees every surviving pair, and its
// decision goes into the trace like any other event. Live and mock runs ask on the
// terminal and store the answers in the recording; a replay reads them back.
export function createReviewer(recording: Recording): Human {
	const st = () => room()
	const decisions = (recording.humanDecisions ??= {})
	let queue: Promise<void> = Promise.resolve()
	const reviewer: Human = createHuman({
		name: NAME,
		capabilities: ["approval"],
		handlers: [
			on("pair.survived", ({ pairId, wildcard }) => {
				const card = st().board.get(pairId)
				if (!card) return
				st().inFlight++
				st().setStatus(card, "review", `waiting for a human decision${wildcard ? " (wildcard)" : ""}`, NAME)
				// One question at a time, in the order pairs survive.
				queue = queue.then(async () => {
					const d = await decide(card, decisions)
					card.human = d
					st().trace.log("human.decision", NAME, { approved: d.approved, note: d.note, source: st().config.mode === "replay" ? "recording" : "terminal" }, pairId)
					if (d.approved) {
						st().setStatus(card, "survived", `approved by a human${d.note ? `: ${d.note}` : ""}`, NAME)
						emit("pair.approved", reviewer.getId(), { pairId, note: d.note })
					} else {
						emit("pair.killed", reviewer.getId(), { pairId, by: NAME, reason: `rejected by a human${d.note ? `: ${d.note}` : ""}` })
					}
					st().inFlight--
					setImmediate(() => room().onSettle?.())
				})
			}),
		],
	})
	return reviewer
}

async function decide(card: PairCard, decisions: Record<string, HumanDecision>): Promise<HumanDecision> {
	if (room().config.mode === "replay") return decisions[card.pairId] ?? { approved: false, note: "no decision in the recording" }
	const ds = room().dataset
	const verdicts = Object.values(card.verdicts).map((v) => `${v.shark} ${v.verdict} ${v.confidence}/10`).join(", ")
	const who = `${ds.researchers.get(card.pitch.researcherId)?.name} x ${ds.challenges.get(card.pitch.challengeId)?.company.name}`
	process.stdout.write(`\n  APPROVAL NEEDED  ${who} [${card.pairId}]\n  ${card.pitch.headline}\n  ${verdicts}\n  Write a proposal for this pair? y/n, then an optional note: ${process.stdin.isTTY ? "" : "\n"}`)
	const line = await nextLine()
	const d: HumanDecision = line === null ? { approved: false, note: "no answer on the terminal" } : { approved: /^\s*y/i.test(line), note: line.trim().replace(/^(y(es)?|no?)\b[\s,:.-]*/i, "") }
	decisions[card.pairId] = d
	return d
}

// Lines from stdin, shared by every question. null once stdin has ended.
const lines: string[] = []
const waiting: ((l: string | null) => void)[] = []
let ended = false
let rl: ReturnType<typeof createInterface> | undefined
function nextLine(): Promise<string | null> {
	if (!rl) {
		rl = createInterface({ input: process.stdin, terminal: false })
		rl.on("line", (l) => (waiting.length ? waiting.shift()!(l) : lines.push(l)))
		rl.on("close", () => {
			ended = true
			while (waiting.length) waiting.shift()!(null)
		})
	}
	if (lines.length) return Promise.resolve(lines.shift()!)
	if (ended) return Promise.resolve(null)
	return new Promise((r) => waiting.push(r))
}
