import type { Dataset } from "../data/dataset"
import { fold, tokenize } from "../data/text"
import type { Claim } from "./types"

export const ID_PATTERN = /\b(R\d{4}|C\d{3}-CH\d+|C\d{3}|SYN-PUB-\d{5}|SYN-PRJ-\d{4}|SYN-PAT-\d{3}|Q-\d+)\b/g

export function idsIn(text: string): string[] {
	return [...new Set(text.match(ID_PATTERN) ?? [])]
}

export type RuleResult = { ok: true } | { ok: false; reason: string }

// The deterministic half of the critic. A claim survives only if every source it
// cites exists, belongs to this researcher or this company, and any quoted text is
// really in those sources. The model never gets a say on these checks.
export function checkClaimRules(ds: Dataset, claim: Pick<Claim, "text" | "sourceIds">, pair: { researcherId: string; companyId: string; challengeId: string }): RuleResult {
	const sources = [...new Set([...claim.sourceIds, ...idsIn(claim.text)])]
	if (!claim.sourceIds.length) return { ok: false, reason: "no source cited" }
	const owners = new Set([pair.researcherId, pair.companyId])
	for (const id of sources) {
		const rec = ds.sources.get(id)
		if (!rec) return { ok: false, reason: `cites ${id}, which does not exist in the dataset` }
		if (id === pair.challengeId) continue
		if (!rec.owners.some((o) => owners.has(o))) {
			return { ok: false, reason: `cites ${id}, which belongs to ${rec.owners.join(", ") || "nobody in this pair"}, not to ${pair.researcherId} or ${pair.companyId}` }
		}
	}
	for (const quote of claim.text.match(/["\u201c\u201e]([^"\u201c\u201d\u201e]{20,})["\u201d]/g) ?? []) {
		const inner = fold(quote.slice(1, -1)).replace(/[^a-z0-9 ]/g, "").trim()
		const found = claim.sourceIds.some((id) => fold(ds.sources.get(id)?.text ?? "").replace(/[^a-z0-9 ]/g, "").includes(inner))
		if (!found) return { ok: false, reason: `quotes "${quote.slice(1, 60)}..." but that text is not in the cited records` }
	}
	return { ok: true }
}

// Offline stand-in for the model's support check: enough of the claim's content
// words must appear in what it cites. Used in mock mode and as a tie-breaker.
export function lexicalSupport(ds: Dataset, claim: Pick<Claim, "text" | "sourceIds">): number {
	const words = [...new Set(tokenize(claim.text.replace(ID_PATTERN, " ")))]
	if (!words.length) return 0
	const pool = new Set(claim.sourceIds.flatMap((id) => tokenize(ds.sources.get(id)?.text ?? "")))
	return words.filter((w) => pool.has(w)).length / words.length
}

export function sourceExcerpts(ds: Dataset, ids: string[], max = 4000): string {
	return ids
		.map((id) => {
			const rec = ds.sources.get(id)
			if (!rec) return `[${id}] (does not exist)`
			const t = rec.text.replace(/\s+/g, " ")
			// Authorship lives in the dataset links, not in the abstract text, so state it.
			const linked = rec.kind === "researcher" || rec.kind === "company" ? "" : ` (${rec.kind}; linked in the dataset to ${rec.owners.map((o) => `${ds.researchers.get(o)?.name ?? ds.companies.get(o)?.name ?? o} [${o}]`).join(", ") || "nobody"})`
			return `[${id}]${linked} ${t.length > max ? t.slice(0, max) + "..." : t}`
		})
		.join("\n")
}
