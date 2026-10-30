import type { Dataset } from "../data/dataset"
import type { Publication } from "../data/types"

const cut = (s: string | undefined, n: number) => {
	const t = (s ?? "").replace(/\s+/g, " ").trim()
	return t.length > n ? t.slice(0, n - 3) + "..." : t
}

// The researcher's own publications that best match a challenge, newest first on ties.
export function relevantPublications(ds: Dataset, researcherId: string, challengeId: string, limit = 4): Publication[] {
	const r = ds.researchers.get(researcherId)
	const ref = ds.challenges.get(challengeId)
	if (!r || !ref) return []
	const own = new Set(r.publications)
	const hits = ds.publicationIndex.search(ds.challengeDoc(ref), limit, (id) => own.has(id))
	const pubs = hits.map((h) => ds.publications.get(h.id)!).filter(Boolean)
	if (pubs.length < limit) {
		const rest = r.publications
			.map((id) => ds.publications.get(id))
			.filter((p): p is Publication => !!p && !pubs.includes(p))
			.sort((a, b) => b.year - a.year)
		pubs.push(...rest.slice(0, limit - pubs.length))
	}
	return pubs
}

export function researcherBlock(ds: Dataset, researcherId: string, challengeId: string, depth: "short" | "full"): string {
	const r = ds.researchers.get(researcherId)
	if (!r) return `[${researcherId}] unknown researcher`
	const flags = ds.availability(r.id)
	const lines = [
		`RESEARCHER [${r.id}] ${r.name}, ${r.title}, ${r.department}, ${ds.faculty.get(r.id)}`,
		`  fields: ${r.fields.join("; ")}`,
		`  keywords: ${r.keywords.join("; ")}`,
		`  open to: ${r.open_to.join("; ") || "(not stated)"}`,
		`  industry experience: ${cut(r.industry_experience, depth === "full" ? 400 : 160) || "(none listed)"}`,
	]
	if (depth === "full") {
		lines.push(`  bio: ${cut(r.bio, 500)}`)
		lines.push(`  notes: ${cut(r.notes, 300) || "(none)"}`)
	}
	if (flags.length) lines.push(`  availability flags: ${flags.join("; ")}`)
	const pubs = relevantPublications(ds, researcherId, challengeId, depth === "full" ? 4 : 2)
	if (pubs.length) {
		lines.push(`  publications most relevant to this challenge:`)
		for (const p of pubs) {
			lines.push(`    [${p.id}] ${p.title} (${p.year}, ${cut(p.venue, 60)})${depth === "full" ? `\n      abstract: ${cut(p.abstract, 450) || "(no abstract)"}` : ""}`)
		}
	}
	if (depth === "full") {
		for (const id of r.projects.slice(0, 3)) {
			const p = ds.projects.get(id)
			if (p) lines.push(`  project [${p.id}] ${p.title} (${p.years ?? ""}): ${cut(p.summary, 220)}`)
		}
		for (const id of r.patents.slice(0, 2)) {
			const p = ds.patents.get(id)
			if (p) lines.push(`  patent [${p.id}] ${p.title} (${p.status ?? "status unknown"})`)
		}
	}
	return lines.join("\n")
}

export function challengeBlock(ds: Dataset, challengeId: string, depth: "short" | "full"): string {
	const ref = ds.challenges.get(challengeId)
	if (!ref) return `[${challengeId}] unknown challenge`
	const { company: c, challenge: ch } = ref
	const lines = [
		`CHALLENGE [${ch.id}] ${depth === "full" ? ch.text : cut(ch.text, 260)}`,
		depth === "full" ? `  detail: ${cut(ch.detail, 900)}` : "",
		`COMPANY [${c.id}] ${c.name}, ${c.sector}, ${c.employees || "?"} employees, ${c.location || "location not stated"}`,
	]
	if (depth === "full" && c.id !== "USER") {
		lines.push(`  about: ${cut(c.about, 450)}`)
		lines.push(`  tech: ${c.tech.slice(0, 8).join("; ")}`)
		lines.push(`  R&D capacity: ${cut(c.rd_capacity, 300)}`)
		lines.push(`  past collaborations: ${cut(c.past_collaborations, 250) || "(none listed)"}`)
	}
	return lines.filter(Boolean).join("\n")
}

export function evidencePack(ds: Dataset, researcherId: string, challengeId: string): string {
	return `${researcherBlock(ds, researcherId, challengeId, "full")}\n\n${challengeBlock(ds, challengeId, "full")}`
}
