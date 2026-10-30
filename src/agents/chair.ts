import { createHuman, type Human } from "@mozaik-ai/core"
import { emit, on } from "../room/events"
import type { PairCard } from "../room/types"
import { room } from "../runtime"

const NAME = "Chair"

// Combined decision after the critic has struck unsupported shark claims.
export function decide(card: PairCard): { survive: boolean; reason: string; by: string } {
	const verdicts = Object.values(card.verdicts)
	for (const v of verdicts) {
		const deal = v.objections.find((o) => o.severity === "dealbreaker" && o.status === "supported")
		if (deal) return { survive: false, by: v.shark, reason: `dealbreaker: ${deal.text}` }
	}
	const invest = verdicts.filter((v) => v.verdict === "invest")
	if (invest.length === verdicts.length && verdicts.length > 0) return { survive: true, by: NAME, reason: "both sharks invest" }
	if (invest.length && Math.max(...invest.map((v) => v.confidence)) >= 7) {
		const passer = verdicts.find((v) => v.verdict === "pass")
		return { survive: true, by: NAME, reason: `split decision carried by ${invest[0].shark} at ${invest[0].confidence}/10 (${passer?.shark} passed without a supported dealbreaker)` }
	}
	const passer = verdicts.find((v) => v.verdict === "pass")
	return { survive: false, by: passer?.shark ?? NAME, reason: invest.length ? "split decision without a strong investor" : "both sharks pass" }
}

export function pairScore(card: PairCard): number {
	return Object.values(card.verdicts).reduce((s, v) => s + (v.verdict === "invest" ? v.confidence : -v.confidence / 2), 0)
}

// The Chair writes no text. It keeps the board, merges duplicate pitches, applies the
// decision rule, and closes the room when every agent has gone quiet.
export function createChair(): Human {
	const chair: Human = createHuman({
		name: NAME,
		capabilities: ["orchestrator"],
		handlers: [
			on("pitch.proposed", ({ pitch }) => {
				const st = room()
				const existing = st.board.get(pitch.pairId)
				if (existing && pitch.version === 1) {
					if (existing.pitch.scout !== pitch.scout && !existing.pitch.secondedBy.includes(pitch.scout)) {
						existing.pitch.secondedBy.push(pitch.scout)
						st.trace.log("pair.seconded", NAME, { scout: pitch.scout }, pitch.pairId)
					}
					return
				}
				if (existing) {
					existing.pitch = { ...pitch, secondedBy: existing.pitch.secondedBy }
					st.setStatus(existing, "pitched", `revised pitch v${pitch.version} from ${pitch.scout}`, NAME)
				} else {
					const card: PairCard = { pairId: pitch.pairId, pitch, status: "pitched", history: [], verdicts: {}, proposalVersion: 0, removedProposalClaims: [], pitchedAt: st.trace.elapsed() }
					st.board.set(pitch.pairId, card)
					st.trace.log("pitch.card", pitch.scout, { researcherId: pitch.researcherId, challengeId: pitch.challengeId, headline: pitch.headline, why: pitch.why, lens: pitch.lens, claims: pitch.claims.map((c) => ({ id: c.id, text: c.text, sources: c.sourceIds })) }, pitch.pairId)
					st.setStatus(card, "pitched", `pitched by ${pitch.scout}`, NAME)
				}
				emit("pitch.posted", chair.getId(), { pairId: pitch.pairId, version: pitch.version })
			}),
			on("pitch.returned", ({ pairId, kills }) => {
				const card = room().board.get(pairId)
				if (card) room().setStatus(card, "returned", `critic returned the pitch (${kills.length} claims killed)`, NAME)
			}),
			on("pitch.cleared", ({ pairId }) => {
				const card = room().board.get(pairId)
				if (card) room().setStatus(card, "cleared", "critic cleared the pitch; sharks are grilling", NAME)
			}),
			on("pair.killed", ({ pairId, by, reason }) => {
				const card = room().board.get(pairId)
				if (!card || card.status === "killed") return
				card.killedBy = by
				card.killReason = reason
				room().setStatus(card, "killed", `${by}: ${reason}`, NAME)
			}),
			on("verdicts.checked", ({ pairId }) => {
				const st = room()
				const card = st.board.get(pairId)
				if (!card || card.status === "killed") return
				st.setStatus(card, "grilled", Object.values(card.verdicts).map((v) => `${v.shark} ${v.verdict} ${v.confidence}/10`).join(", "), NAME)
				const d = decide(card)
				if (d.survive) {
					st.setStatus(card, "survived", d.reason, NAME)
					emit("pair.survived", chair.getId(), { pairId })
				} else {
					emit("pair.killed", chair.getId(), { pairId, by: d.by, reason: d.reason })
				}
			}),
			on("pair.survived", ({ pairId }) => {
				const card = room().board.get(pairId)
				if (card && !room().config.approve) room().setStatus(card, "writing", "writer drafting", NAME)
			}),
			on("pair.approved", ({ pairId }) => {
				const card = room().board.get(pairId)
				if (card) room().setStatus(card, "writing", "writer drafting", NAME)
			}),
			on("scout.done", ({ scout }) => {
				room().scoutsDone.add(scout)
				setImmediate(() => room().onSettle?.())
			}),
			on("proposal.final", ({ pairId }) => {
				const card = room().board.get(pairId)
				if (card) room().setStatus(card, "proposed", `proposal ready: ${card.proposal?.title}`, NAME)
			}),
		],
	})
	room().onSettle = () => settle(chair.getId())
	return chair
}

function settle(chairId: string): void {
	const st = room()
	if (st.closed || st.inFlight > 0 || st.scoutsDone.size < st.scoutCount) return
	const cards = [...st.board.values()]
	const proposed = cards.filter((c) => c.status === "proposed").length
	if (proposed < st.config.minProposals) {
		// Fewer proposals than the brief asks for: promote the strongest split decisions,
		// labelled as wildcards. Never pairs the critic killed or that hold a dealbreaker.
		const wild = cards
			.filter((c) => c.status === "killed" && Object.keys(c.verdicts).length === 2 && !/dealbreaker|critic|human|withdrew|error|both sharks pass/i.test(`${c.killedBy} ${c.killReason}`))
			.sort((a, b) => pairScore(b) - pairScore(a) || a.pairId.localeCompare(b.pairId))
			.slice(0, st.config.minProposals - proposed)
		if (wild.length) {
			for (const c of wild) {
				c.wildcard = true
				st.setStatus(c, "wildcard", `promoted as a wildcard: the room asked for ${st.config.minProposals} proposals and this split decision had no supported dealbreaker`, NAME)
				emit("pair.survived", chairId, { pairId: c.pairId, wildcard: true })
			}
			return
		}
	}
	st.trace.log("room.closed", NAME, { proposals: proposed, pairs: cards.length })
	emit("room.closed", chairId, { proposals: proposed })
	st.markClosed()
}
