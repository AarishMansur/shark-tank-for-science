import { createAgent, type Agent } from "@mozaik-ai/core"
import { ask, taskHandlers } from "../llm/ask"
import { lexicalSupport } from "../room/citations"
import { evidencePack } from "../room/evidence"
import { emit, on } from "../room/events"
import { verdictSchema } from "../room/schemas"
import type { Objection, SharkVerdict } from "../room/types"
import { room } from "../runtime"
import { HOUSE_RULES, listClaims, toClaims } from "./common"

type Persona = { name: string; capabilities: string[]; persona: string }

export const SHARKS: Persona[] = [
	{
		name: "CTO Shark",
		capabilities: ["shark", "industry"],
		persona: `You are the CTO Shark: a skeptical CTO of a 60 person company at NTP Novi Sad.
You ask: will this make or save the company money within two years? Can the company absorb it (people, data, R&D capacity as stated)? Is this a research problem at all, or just a hire, a contractor job or a product feature? What does it cost the company and what do they get?`,
	},
	{
		name: "Professor Shark",
		capabilities: ["shark", "academic"],
		persona: `You are the Professor Shark: a demanding full professor who sits on doctoral committees at the University of Novi Sad.
You ask: is there a real, publishable research question here, or is this consulting dressed up as research? Does the researcher's record show depth in exactly this, or only a keyword? Could it carry an industrial PhD (three years, a candidate, a thesis)? Do the availability notes allow it?`,
	},
]

export function createShark(p: Persona): Agent {
	const agent: Agent = createAgent({
		name: p.name,
		capabilities: p.capabilities,
		instruction: `${p.persona}
You grill pitches in a pitch room. Be tough but fair: invest when the pair is genuinely good. Give strengths and objections as claims with record ids. Mark an objection "dealbreaker" only if it alone should stop the pair.
${HOUSE_RULES}`,
		tools: [],
		handlers: [
			...taskHandlers,
			on("pitch.cleared", ({ pairId }) => {
				const st = room()
				const card = st.board.get(pairId)
				if (!card) return
				const pitch = card.pitch
				ask(agent, {
					purpose: "grill",
					pairId,
					prompt: `Pitch from ${pitch.scout}: ${pitch.headline}
${pitch.why}
Claims the critic accepted:
${listClaims(pitch.claims.filter((c) => c.status === "supported"))}

Full evidence for the pair:
${evidencePack(st.dataset, pitch.researcherId, pitch.challengeId)}

Give your verdict.`,
					schema: verdictSchema,
					mock: () => mockVerdict(p.name, pairId),
					onAnswer: (out) => {
						if (out?.__error) {
							emit("pair.killed", agent.getId(), { pairId, by: p.name, reason: `model error: ${out.__error}` })
							return
						}
						const verdict: SharkVerdict = {
							shark: p.name,
							verdict: out.verdict === "invest" ? "invest" : "pass",
							confidence: Math.max(1, Math.min(10, Math.round(Number(out.confidence) || 5))),
							strengths: toClaims(out.strengths, p.name, `${p.name[0]}s`),
							objections: toClaims(out.objections, p.name, `${p.name[0]}o`).map((c, i): Objection => ({
								...c,
								severity: out.objections[i]?.severity === "dealbreaker" ? "dealbreaker" : "concern",
							})),
							question: String(out.question ?? ""),
						}
						card.verdicts[p.name] = verdict
						st.trace.log("shark.verdict", p.name, { verdict: verdict.verdict, confidence: verdict.confidence, question: verdict.question, objections: verdict.objections.map((o) => ({ text: o.text, severity: o.severity })) }, pairId)
						emit("shark.verdict", agent.getId(), { pairId, shark: p.name })
					},
				})
			}),
		],
	})
	return agent
}

function mockVerdict(shark: string, pairId: string) {
	const st = room()
	const card = st.board.get(pairId)!
	const fit = lexicalSupport(st.dataset, { text: st.dataset.sources.get(card.pitch.challengeId)!.text, sourceIds: [card.pitch.researcherId, ...card.pitch.claims.flatMap((c) => c.sourceIds)] })
	const confidence = Math.max(2, Math.min(9, Math.round(fit * 14) - (shark.startsWith("Professor") ? 3 : 0)))
	const ch = st.dataset.challenges.get(card.pitch.challengeId)!
	return {
		verdict: confidence >= 5 ? "invest" : "pass",
		confidence,
		strengths: [{ text: `[MOCK] The challenge says: ${ch.challenge.text.split(/\s+/).slice(0, 14).join(" ")}`, sources: [card.pitch.challengeId] }],
		objections: [{ text: `[MOCK] R&D capacity is limited: ${ch.company.rd_capacity.split(/\s+/).slice(0, 12).join(" ")}`, sources: [card.pitch.companyId], severity: "concern" }],
		question: "[MOCK] Who on each side owns this for the first six months?",
	}
}
