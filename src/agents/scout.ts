import { createAgent, type Agent } from "@mozaik-ai/core"
import { ask, taskHandlers } from "../llm/ask"
import { challengeBlock, relevantPublications, researcherBlock } from "../room/evidence"
import { emit, on, pairIdOf } from "../room/events"
import type { Candidate, Lens } from "../room/lenses"
import { pitchSchema, revisedPitchSchema } from "../room/schemas"
import type { Pitch } from "../room/types"
import { room } from "../runtime"
import { HOUSE_RULES, listClaims, toClaims } from "./common"

export function createScout(lens: Lens): Agent {
	const name = lens.scout
	let shortlist: Candidate[] = []

	const agent: Agent = createAgent({
		name,
		capabilities: ["scout", lens.id],
		instruction: `You are ${name}, a scout in a pitch room that finds researcher and company pairs worth a joint project or an industrial PhD for the EINSTEIN network in Novi Sad.
${lens.brief}
You get a shortlist that a search engine built from a dataset far too large to read at once. Pick the pairs a company and a researcher would actually sit down over, and pitch them honestly. Skip a candidate when the challenge is not a research problem (a hiring, sales or pure engineering task) or the fit is only word overlap.
${HOUSE_RULES}`,
		tools: [],
		handlers: [
			...taskHandlers,
			on("room.opened", ({ challengeIds }) => {
				const st = room()
				shortlist = lens.shortlist(st.dataset, st.config.shortlistSize, challengeIds)
				st.trace.log("scout.shortlist", name, { lens: lens.id, candidates: shortlist.map((c) => ({ key: c.key, researcherId: c.researcherId, challengeId: c.challengeId, score: +c.score.toFixed(2), reason: c.reason })) })
				if (!shortlist.length) {
					emit("scout.done", agent.getId(), { scout: name, pitched: 0 })
					return
				}
				const blocks = shortlist
					.map((c) => `### ${c.key} (search note: ${c.reason})\n${researcherBlock(st.dataset, c.researcherId, c.challengeId, "short")}\n${challengeBlock(st.dataset, c.challengeId, "short")}`)
					.join("\n\n")
				ask(agent, {
					purpose: "pitch",
					prompt: `Shortlist:\n\n${blocks}\n\nPitch at most ${st.config.pitchesPerScout} candidates. For each, give 3 to 5 claims, each with the record ids that prove it. Return fewer pitches if fewer deserve it.`,
					schema: pitchSchema,
					mock: () => mockPitches(shortlist, st.config.pitchesPerScout),
					onAnswer: (out) => {
						let pitched = 0
						for (const p of Array.isArray(out?.pitches) ? out.pitches : []) {
							const cand = shortlist.find((c) => c.key === String(p.candidate).trim())
							if (!cand) {
								st.trace.log("scout.invalid", name, { candidate: p.candidate, reason: "not on the shortlist" })
								continue
							}
							const pairId = pairIdOf(cand.researcherId, cand.challengeId)
							const pitch: Pitch = {
								pairId,
								researcherId: cand.researcherId,
								challengeId: cand.challengeId,
								companyId: st.dataset.challenges.get(cand.challengeId)!.company.id,
								scout: name,
								lens: lens.id,
								headline: String(p.headline ?? ""),
								why: String(p.why ?? ""),
								claims: toClaims(p.claims, name, "c"),
								version: 1,
								secondedBy: [],
							}
							emit("pitch.proposed", agent.getId(), { pitch })
							pitched++
						}
						emit("scout.done", agent.getId(), { scout: name, pitched })
					},
				})
			}),
			on("pitch.returned", ({ pairId, scout, kills }) => {
				if (scout !== name) return
				const st = room()
				const card = st.board.get(pairId)
				if (!card) return
				const pitch = card.pitch
				ask(agent, {
					purpose: "revise",
					pairId,
					prompt: `The critic sent your pitch back. Fix it using only supported claims, or withdraw it.

Your pitch: ${pitch.headline}
${pitch.why}
Claims:
${listClaims(pitch.claims)}

Critic's kills:
${kills.map((k) => `- ${k.claim}: ${k.reason}`).join("\n")}

Evidence for this pair:
${researcherBlock(st.dataset, pitch.researcherId, pitch.challengeId, "full")}
${challengeBlock(st.dataset, pitch.challengeId, "full")}`,
					schema: revisedPitchSchema,
					mock: () => mockRevision(pitch),
					onAnswer: (out) => {
						if (out?.withdraw || out?.__error) {
							emit("pair.killed", agent.getId(), { pairId, by: name, reason: out?.__error ? `model error: ${out.__error}` : "scout withdrew the pitch after the critic's review" })
							return
						}
						const revised: Pitch = {
							...pitch,
							headline: String(out.headline ?? pitch.headline),
							why: String(out.why ?? pitch.why),
							claims: toClaims(out.claims, name, "r"),
							version: pitch.version + 1,
						}
						emit("pitch.proposed", agent.getId(), { pitch: revised })
					},
				})
			}),
		],
	})
	return agent
}

// Offline answers, built only from the shortlist's real records. The first pitch carries
// one deliberately wrong citation so the critic has something to catch in demos and tests.
function mockPitches(shortlist: Candidate[], n: number) {
	const st = room()
	const ds = st.dataset
	return {
		pitches: shortlist.slice(0, n).map((c, i) => {
			const r = ds.researchers.get(c.researcherId)!
			const ref = ds.challenges.get(c.challengeId)!
			const pub = relevantPublications(ds, r.id, c.challengeId, 1)[0]
			const claims = [
				{ text: `${r.name} works on ${r.fields.slice(0, 2).join(" and ")}.`, sources: [r.id] },
				{ text: `${ref.company.name} says: ${ref.challenge.text.slice(0, 120)}`, sources: [ref.challenge.id] },
			]
			if (pub) claims.push({ text: `${r.name} published ${pub.title}.`, sources: [pub.id] })
			if (i === 0) {
				const foreign = [...ds.publications.values()].find((p) => !(p.authors ?? []).some((a) => a.researcher_id === r.id))!
				claims.push({ text: `${r.name} also wrote ${foreign.title}.`, sources: [foreign.id] })
			}
			return { candidate: c.key, headline: `${r.name} x ${ref.company.name}`, why: `[MOCK] ${c.reason}.`, claims }
		}),
	}
}

function mockRevision(pitch: Pitch) {
	const kept = pitch.claims.filter((c) => c.status === "supported")
	return { withdraw: kept.length < 2, headline: pitch.headline, why: pitch.why, claims: kept.map((c) => ({ text: c.text, sources: c.sourceIds })) }
}
