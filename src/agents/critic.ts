import { createAgent, type Agent } from "@mozaik-ai/core"
import { ask, taskHandlers } from "../llm/ask"
import { checkClaimRules, idsIn, lexicalSupport, sourceExcerpts } from "../room/citations"
import { emit, on } from "../room/events"
import { supportSchema } from "../room/schemas"
import type { Claim, PairCard } from "../room/types"
import { room } from "../runtime"

const NAME = "Critic"

// Two layers. First hard rules in code (the source exists, it belongs to this pair,
// quotes are verbatim). Then a model reads each surviving claim next to the text of
// what it cites and says whether that text really supports it. Every kill is traced.
export function createCritic(): Agent {
	const agent: Agent = createAgent({
		name: NAME,
		capabilities: ["critic", "fact-check"],
		instruction: `You are the Critic of a pitch room. You check claims against the records they cite and nothing else.
A claim is supported only if the cited record text states it or directly implies it. Being on the same topic is not enough.
Unsupported: invented papers, skills, numbers or experience; a record that says something different; a claim that stretches a keyword into expertise; any statement about a person's worth.
Be strict but fair: paraphrase is fine, and claims about what a company needs are supported by the challenge text.
Do not use em dashes.`,
		tools: [],
		handlers: [
			...taskHandlers,
			on("pitch.posted", ({ pairId, version }) => {
				const card = room().board.get(pairId)
				if (!card) return
				review(agent, card, card.pitch.claims, `check-pitch-v${version}`, (killed) => {
					const st = room()
					const alive = card.pitch.claims.filter((c) => c.status === "supported")
					const enough = alive.length >= 2 && alive.length * 2 >= card.pitch.claims.length
					if (enough) {
						emit("pitch.cleared", agent.getId(), { pairId, version })
					} else if (version === 1) {
						emit("pitch.returned", agent.getId(), { pairId, scout: card.pitch.scout, version, kills: killed.map((k) => ({ claim: k.text, reason: k.killReason! })) })
					} else {
						emit("pair.killed", agent.getId(), { pairId, by: NAME, reason: `only ${alive.length} of ${card.pitch.claims.length} claims survived the second review` })
					}
					st.trace.log("critic.summary", NAME, { stage: `pitch v${version}`, supported: alive.length, killed: killed.length }, pairId)
				})
			}),
			on("shark.verdict", ({ pairId }) => {
				const card = room().board.get(pairId)
				if (!card || Object.keys(card.verdicts).length < 2) return
				const claims = Object.values(card.verdicts).flatMap((v) => [...v.strengths, ...v.objections])
				review(agent, card, claims, "check-verdicts", (killed) => {
					room().trace.log("critic.summary", NAME, { stage: "shark verdicts", supported: claims.length - killed.length, killed: killed.length }, pairId)
					emit("verdicts.checked", agent.getId(), { pairId })
				})
			}),
			on("proposal.drafted", ({ pairId, version }) => {
				const st = room()
				const card = st.board.get(pairId)
				if (!card?.proposal) return
				const p = card.proposal
				// IDs mentioned anywhere in the prose must exist and belong to the pair as well.
				const prose = [p.title, p.summary, p.problem, ...p.researchQuestions, ...p.plan.flatMap((x) => [x.work, x.result]), ...p.companyBrings, ...p.facultyBrings, ...p.risks.flatMap((r) => [r.objection, r.rebuttal])].join("\n")
				const strayIds = idsIn(prose).filter((id) => checkClaimRules(st.dataset, { text: id, sourceIds: [id] }, card.pitch).ok === false)
				const strayClaims: Claim[] = strayIds.map((id, i) => ({ id: `s${i + 1}`, text: `Proposal text mentions ${id}`, sourceIds: [id], by: "Writer", status: "pending" }))
				review(agent, card, [...p.whyThisPair, ...strayClaims], `check-proposal-v${version}`, (killed) => {
					st.trace.log("critic.summary", NAME, { stage: `proposal v${version}`, supported: p.whyThisPair.filter((c) => c.status === "supported").length, killed: killed.length }, pairId)
					if (killed.length && version === 1) {
						emit("proposal.returned", agent.getId(), { pairId, version, kills: killed.map((k) => ({ claim: k.text, reason: k.killReason! })) })
						return
					}
					card.removedProposalClaims.push(...p.whyThisPair.filter((c) => c.status === "killed"))
					p.whyThisPair = p.whyThisPair.filter((c) => c.status === "supported")
					if (strayIds.length) st.trace.log("critic.redact", NAME, { ids: strayIds }, pairId)
					emit("proposal.final", agent.getId(), { pairId })
				})
			}),
		],
	})
	return agent
}

function kill(card: PairCard, claim: Claim, reason: string, by: "rule" | "critic"): void {
	claim.status = "killed"
	claim.killReason = reason
	claim.killedBy = by
	room().trace.log("critic.kill", NAME, { claim: claim.id, by: claim.by, text: claim.text, sources: claim.sourceIds, reason, layer: by }, card.pairId)
}

function review(agent: Agent, card: PairCard, claims: Claim[], purpose: string, done: (killed: Claim[]) => void): void {
	const st = room()
	const pending: Claim[] = []
	for (const c of claims) {
		const res = checkClaimRules(st.dataset, c, card.pitch)
		if (res.ok) pending.push(c)
		else kill(card, c, res.reason, "rule")
	}
	const finish = () => done(claims.filter((c) => c.status === "killed"))
	if (!pending.length) {
		finish()
		return
	}
	const keyed = pending.map((c, i) => ({ key: `c${i + 1}`, claim: c }))
	const ids = [...new Set(pending.flatMap((c) => c.sourceIds))]
	ask(agent, {
		purpose,
		pairId: card.pairId,
		prompt: `Check each claim against the records it cites.

Claims:
${keyed.map((k) => `- (${k.key}) [by ${k.claim.by}] ${k.claim.text}  cites: ${k.claim.sourceIds.join(", ")}`).join("\n")}

Cited records:
${sourceExcerpts(st.dataset, ids)}

Return one check per claim id.`,
		schema: supportSchema,
		mock: () => ({
			checks: keyed.map((k) => {
				const s = lexicalSupport(st.dataset, k.claim)
				return { claim: k.key, supported: s >= 0.3, reason: `[MOCK] ${(s * 100).toFixed(0)}% of the claim's words appear in the cited records` }
			}),
		}),
		onAnswer: (out) => {
			if (out?.__error) {
				// Fail closed: if the check could not run, nothing is accepted on trust.
				for (const k of keyed) kill(card, k.claim, `could not be checked (${out.__error})`, "critic")
				finish()
				return
			}
			const checks = new Map<string, { supported: boolean; reason: string }>()
			for (const c of Array.isArray(out?.checks) ? out.checks : []) checks.set(String(c.claim).replace(/[()]/g, ""), c)
			for (const k of keyed) {
				const c = checks.get(k.key)
				if (!c) kill(card, k.claim, "the critic returned no verdict for this claim", "critic")
				else if (!c.supported) kill(card, k.claim, String(c.reason || "not supported by the cited records"), "critic")
				else k.claim.status = "supported"
			}
			finish()
		},
	})
}
