import { createAgent, type Agent } from "@mozaik-ai/core"
import { ask, taskHandlers } from "../llm/ask"
import { relevantPublications } from "../room/evidence"
import { evidencePack } from "../room/evidence"
import { emit, on } from "../room/events"
import { proposalSchema } from "../room/schemas"
import type { PairCard, ProposalDraft } from "../room/types"
import { room } from "../runtime"
import { HOUSE_RULES, listClaims, toClaims } from "./common"

const NAME = "Writer"

const EXAMPLE_SHAPE = `A good proposal (from the EINSTEIN example) names the bottleneck with numbers from the company's own words, asks two or three research questions that can be measured, gives a three phase plan (year by year for an industrial PhD) with a concrete result per phase, lists exactly what each side brings, says why neither side could do it alone, and fixes IP and publication terms up front.`

export function createWriter(): Agent {
	const agent: Agent = createAgent({
		name: NAME,
		capabilities: ["writer", "proposal"],
		instruction: `You are the Writer. You turn a pair that survived the pitch room into a proposal a company and a researcher would actually sit down over: an industrial PhD topic when there is a three year research question and the researcher can supervise, otherwise a one page joint project.
${EXAMPLE_SHAPE}
Answer every shark objection honestly in risks_and_rebuttals. If an objection cannot be answered, say what would have to be true and how the first meeting would check it.
Plans, research questions and the agenda are proposals, so they need no citations. Facts about the people and the company go in why_this_pair as claims with record ids.
${HOUSE_RULES}`,
		tools: [],
		handlers: [
			...taskHandlers,
			on("pair.survived", ({ pairId }) => write(agent, pairId, 1, [])),
			on("proposal.returned", ({ pairId, version, kills }) => write(agent, pairId, version + 1, kills)),
		],
	})
	return agent
}

function write(agent: Agent, pairId: string, version: number, kills: { claim: string; reason: string }[]): void {
	const st = room()
	const card = st.board.get(pairId)
	if (!card) return
	const verdictText = Object.values(card.verdicts)
		.map((v) => {
			const ok = (xs: typeof v.strengths) => xs.filter((c) => c.status === "supported")
			return `${v.shark}: ${v.verdict} (${v.confidence}/10). Question: ${v.question}
  strengths:\n${listClaims(ok(v.strengths)) || "  (none survived)"}
  objections:\n${v.objections.filter((o) => o.status === "supported").map((o) => `- [${o.severity}] ${o.text} [${o.sourceIds.join(", ")}]`).join("\n") || "  (none survived)"}`
		})
		.join("\n\n")
	const fixNote = kills.length
		? `\nThe critic rejected these statements in your previous draft. Drop or fix them:\n${kills.map((k) => `- ${k.claim}: ${k.reason}`).join("\n")}\n`
		: ""
	ask(agent, {
		purpose: `write-v${version}`,
		pairId,
		model: st.config.writerModel,
		prompt: `Write the proposal for this pair.${card.wildcard ? " Note: this pair had a split decision in the room; be explicit about what must be checked first." : ""}
${fixNote}
Pitch (${card.pitch.scout}, lens ${card.pitch.lens}): ${card.pitch.headline}
${card.pitch.why}
Claims the critic accepted:
${listClaims(card.pitch.claims.filter((c) => c.status === "supported"))}

What the sharks said (only claims the critic accepted):
${verdictText}

Evidence:
${evidencePack(st.dataset, card.pitch.researcherId, card.pitch.challengeId)}`,
		schema: proposalSchema,
		mock: () => mockProposal(card),
		onAnswer: (out) => {
			if (out?.__error) {
				emit("pair.killed", agent.getId(), { pairId, by: NAME, reason: `model error while writing: ${out.__error}` })
				return
			}
			const arr = (x: unknown) => (Array.isArray(x) ? x.map(String) : [])
			const proposal: ProposalDraft = {
				title: String(out.title ?? card.pitch.headline),
				kind: out.kind === "industrial_phd" ? "industrial_phd" : "joint_project",
				summary: String(out.summary ?? ""),
				problem: String(out.problem ?? ""),
				researchQuestions: arr(out.research_questions),
				plan: Array.isArray(out.plan) ? out.plan.map((p: any) => ({ phase: String(p.phase ?? ""), work: String(p.work ?? ""), result: String(p.result ?? "") })) : [],
				companyBrings: arr(out.company_brings),
				facultyBrings: arr(out.faculty_brings),
				whyThisPair: toClaims(out.why_this_pair, NAME, `w${version}.`),
				risks: Array.isArray(out.risks_and_rebuttals) ? out.risks_and_rebuttals.map((r: any) => ({ objection: String(r.objection ?? ""), raisedBy: String(r.raised_by ?? ""), rebuttal: String(r.rebuttal ?? "") })) : [],
				agreedUpFront: arr(out.agreed_up_front),
				firstMeetingAgenda: arr(out.first_meeting_agenda),
			}
			card.proposal = proposal
			card.proposalVersion = version
			emit("proposal.drafted", agent.getId(), { pairId, version })
		},
	})
}

function mockProposal(card: PairCard) {
	const ds = room().dataset
	const r = ds.researchers.get(card.pitch.researcherId)!
	const ref = ds.challenges.get(card.pitch.challengeId)!
	const pub = relevantPublications(ds, r.id, ref.challenge.id, 1)[0]
	const objections = Object.values(card.verdicts).flatMap((v) => v.objections.filter((o) => o.status === "supported").map((o) => ({ objection: o.text, raised_by: v.shark, rebuttal: "[MOCK] To be answered in the first meeting." })))
	return {
		title: `[MOCK] ${card.pitch.headline}`,
		kind: r.open_to.some((o) => /phd/i.test(o)) ? "industrial_phd" : "joint_project",
		summary: `[MOCK] Offline proposal skeleton for ${r.name} and ${ref.company.name}. Run with a Gemini key for a written proposal.`,
		problem: ref.challenge.text,
		research_questions: ["[MOCK] What can be measured on the company's own data in the first three months?"],
		plan: [
			{ phase: "Phase 1", work: "[MOCK] Scope and data access", result: "Agreed baseline" },
			{ phase: "Phase 2", work: "[MOCK] Method development", result: "Prototype" },
			{ phase: "Phase 3", work: "[MOCK] Trial at the company", result: "Decision on rollout" },
		],
		company_brings: [ref.company.rd_capacity.slice(0, 160)],
		faculty_brings: [`${r.fields.slice(0, 2).join(" and ")} expertise`],
		why_this_pair: [
			{ text: `${ref.company.name} needs: ${ref.challenge.text.slice(0, 100)}`, sources: [ref.challenge.id] },
			...(pub ? [{ text: `${r.name} published ${pub.title}.`, sources: [pub.id] }] : []),
		],
		risks_and_rebuttals: objections,
		agreed_up_front: ["[MOCK] Publication after a 60 day company review."],
		first_meeting_agenda: ["[MOCK] Walk through the challenge with the data owner."],
	}
}
