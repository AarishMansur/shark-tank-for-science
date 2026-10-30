import type { Claim } from "../room/types"

export const HOUSE_RULES = `House rules of the pitch room:
- Every factual statement about a person, a company or a challenge must cite record ids that appear in the evidence you were given (R0001, C001, C001-CH1, SYN-PUB-00001, SYN-PRJ-0001, SYN-PAT-001, Q-1).
- Never invent a paper, project, patent, skill, number or name. If the evidence does not say it, do not say it.
- A claim may only cite records of this researcher or this company. Citing someone else's paper gets the claim killed.
- We propose collaborations. We never judge or rank a person's worth.
- The data mixes English and Serbian (Latin and Cyrillic). Read both; write in English.
- Do not use em dashes.`

export function toClaims(raw: unknown, by: string, prefix: string): Claim[] {
	if (!Array.isArray(raw)) return []
	return raw
		.filter((c) => c && typeof c.text === "string" && c.text.trim())
		.map((c, i) => ({
			id: `${prefix}${i + 1}`,
			text: String(c.text).trim(),
			sourceIds: Array.isArray(c.sources) ? [...new Set(c.sources.map((s: unknown) => String(s).replace(/[\[\]\s]/g, "")).filter(Boolean))] as string[] : [],
			by,
			status: "pending" as const,
		}))
}

export function listClaims(claims: Claim[]): string {
	// No claim labels here: models copied them into their own citations.
	return claims.map((c) => `- ${c.text} [${c.sourceIds.join(", ")}]`).join("\n")
}
