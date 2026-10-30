import type { Dataset } from "../data/dataset"
import { fold, sanitizeDashes } from "../data/text"
import type { AgentUsage, PitchRoomState } from "../room/state"
import type { PairCard } from "../room/types"

const bullet = (xs: string[]) => xs.map((x) => `- ${x}`).join("\n")

export function slug(s: string): string {
	return fold(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60)
}

export function renderProposal(ds: Dataset, card: PairCard, mode: string): string {
	const p = card.proposal!
	const r = ds.researchers.get(card.pitch.researcherId)!
	const ref = ds.challenges.get(card.pitch.challengeId)!
	const flags = ds.availability(r.id)
	const verdicts = Object.values(card.verdicts)
	const killedInRoom = [
		...card.pitch.claims.filter((c) => c.status === "killed"),
		...verdicts.flatMap((v) => [...v.strengths, ...v.objections].filter((c) => c.status === "killed")),
		...card.removedProposalClaims,
	]
	const md = `# ${p.title}

${mode !== "live" && mode !== "replay" ? "> Generated in mock mode: structure only, no model was called.\n\n" : ""}**Type:** ${p.kind === "industrial_phd" ? "Industrial PhD topic" : "Joint project"}${card.wildcard ? " (wildcard: split decision in the room, see risks)" : ""}
**Company:** ${ref.company.name} [${ref.company.id}], ${ref.company.sector}${ref.company.employees ? `, ${ref.company.employees} employees` : ""}${ref.company.location ? `, ${ref.company.location}` : ""}
**Challenge:** [${ref.challenge.id}] ${ref.challenge.text}
**Researcher:** ${r.name} [${r.id}], ${r.title}, ${r.department}, ${ds.faculty.get(r.id)}
**Found by:** ${card.pitch.scout} (lens: ${card.pitch.lens})${card.pitch.secondedBy.length ? `, seconded by ${card.pitch.secondedBy.join(", ")}` : ""}
**Room verdict:** ${verdicts.map((v) => `${v.shark} ${v.verdict} ${v.confidence}/10`).join(", ")}
${flags.length ? `**Availability caveats from the profile:** ${flags.join("; ")}\n` : ""}
${p.summary}

## The problem
${p.problem}

## Research questions
${p.researchQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

## Plan
| Phase | Work | Result |
| --- | --- | --- |
${p.plan.map((x) => `| ${x.phase} | ${x.work.replace(/\|/g, "/")} | ${x.result.replace(/\|/g, "/")} |`).join("\n")}

## What each side brings
**Company**
${bullet(p.companyBrings)}

**Faculty**
${bullet(p.facultyBrings)}

## Why this pair (every line checked by the critic)
${p.whyThisPair.map((c) => `- ${c.text} [${c.sourceIds.join(", ")}]`).join("\n") || "- (no claims survived the critic)"}

## Risks and rebuttals
${p.risks.map((x) => `- **${x.raisedBy}:** ${x.objection}\n  **Rebuttal:** ${x.rebuttal}`).join("\n")}

## The sharks' questions for the first meeting
${verdicts.map((v) => `- **${v.shark}:** ${v.question}`).join("\n")}

## Agreed up front
${bullet(p.agreedUpFront)}

## First meeting agenda
${p.firstMeetingAgenda.map((x, i) => `${i + 1}. ${x}`).join("\n")}

## Claims the critic removed on the way
${killedInRoom.length ? killedInRoom.map((c) => `- ~~${c.text}~~ (${c.by}, cited ${c.sourceIds.join(", ") || "nothing"}): ${c.killReason}`).join("\n") : "- None."}

---
Records cited here are from the synthetic EINSTEIN hackathon dataset. The pitch room proposes a conversation; it does not rate people.
`
	return sanitizeDashes(md)
}

export function usageTable(usage: Map<string, AgentUsage>): string {
	const rows = [...usage.entries()].sort((a, b) => a[0].localeCompare(b[0]))
	const total = rows.reduce((s, [, u]) => ({ calls: s.calls + u.calls, inp: s.inp + u.inputTokens, out: s.out + u.outputTokens }), { calls: 0, inp: 0, out: 0 })
	return `| Agent | Model calls | Input tokens | Output tokens | Errors |
| --- | ---: | ---: | ---: | ---: |
${rows.map(([a, u]) => `| ${a} | ${u.calls} | ${u.inputTokens} | ${u.outputTokens} | ${u.errors} |`).join("\n")}
| **Total** | **${total.calls}** | **${total.inp}** | **${total.out}** | |`
}

export function renderSummary(st: PitchRoomState, files: Map<string, string>, args: string[]): string {
	const ds = st.dataset
	const cards = [...st.board.values()].sort((a, b) => a.pitchedAt - b.pitchedAt)
	const kills = st.trace.lines.filter((l) => l.type === "critic.kill")
	const span = st.trace.elapsed()
	return sanitizeDashes(`# Pitch room run

- Mode: **${st.config.mode}**${st.config.mode === "mock" ? " (deterministic stand-in answers, no model called)" : ""}
- Models: ${st.config.model} (scouts, sharks, critic), ${st.config.writerModel} (writer)
- Command: \`npm start -- ${args.join(" ")}\`
- Scope: ${st.config.problem ? `reverse search for: "${st.config.problem}"` : `${ds.challenges.size} challenges, ${ds.researchers.size} researchers, ${ds.publications.size} publications indexed`}
- Wall time: ${(span / 1000).toFixed(1)} s
- Pairs pitched: ${cards.length}, proposals written: ${cards.filter((c) => c.status === "proposed").length}, killed: ${cards.filter((c) => c.status === "killed").length}
- Critic interventions: ${kills.length} claims killed (${kills.filter((k) => (k.data as any).layer === "rule").length} by hard rules, ${kills.filter((k) => (k.data as any).layer === "critic").length} by the model check)

## Board
| Pair | Scout | Fate | Why |
| --- | --- | --- | --- |
${cards
	.map((c) => {
		const r = ds.researchers.get(c.pitch.researcherId)
		const ch = ds.challenges.get(c.pitch.challengeId)
		const fate = c.status === "proposed" ? `proposal${c.wildcard ? " (wildcard)" : ""}: [${files.get(c.pairId)}](proposals/${files.get(c.pairId)})` : c.status
		const why = c.status === "killed" ? `${c.killedBy}: ${c.killReason}` : Object.values(c.verdicts).map((v) => `${v.shark} ${v.verdict} ${v.confidence}/10`).join(", ")
		return `| ${r?.name} [${c.pitch.researcherId}] x ${ch?.company.name} [${c.pitch.challengeId}] | ${c.pitch.scout} | ${fate} | ${why.replace(/\|/g, "/").replace(/\n/g, " ")} |`
	})
	.join("\n")}

## Critic interventions
${kills.map((k) => `- **${k.pairId}** ${(k.data as any).by}: "${(k.data as any).text}" [${(k.data as any).sources.join(", ")}]: ${(k.data as any).reason}`).join("\n") || "- None."}

## Tokens per agent
${usageTable(st.usage)}

Gemini free tier: no charge. The full event log is in \`trace.jsonl\`; open \`pitch-room.html\` to watch the run.
`)
}
