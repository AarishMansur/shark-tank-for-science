import type { Dataset } from "../data/dataset"
import type { Researcher } from "../data/types"

export type Candidate = { key: string; researcherId: string; challengeId: string; score: number; reason: string }

export type Lens = {
	id: "problems" | "fresh-papers" | "untapped" | "bridges"
	scout: string
	brief: string
	shortlist: (ds: Dataset, size: number, challengeIds: string[]) => Candidate[]
}

// Researchers with no stated openness and no industry record are still matched,
// but we never pitch someone whose profile says they are out of reach.
function pitchable(ds: Dataset, r: Researcher | undefined): r is Researcher {
	if (!r) return false
	return !ds.availability(r.id).some((f) => f.includes("retired") || f.includes("left"))
}

function pickDistinct(cands: Omit<Candidate, "key">[], size: number, ds: Dataset): Candidate[] {
	const usedR = new Set<string>()
	const usedC = new Set<string>()
	const out: Candidate[] = []
	for (const c of cands) {
		const company = ds.challenges.get(c.challengeId)?.company.id ?? ""
		if (usedR.has(c.researcherId) || (company !== "USER" && usedC.has(company))) continue
		usedR.add(c.researcherId)
		usedC.add(company)
		out.push({ ...c, key: `K${out.length + 1}` })
		if (out.length >= size) break
	}
	return out
}

const byScore = <T extends { score: number; researcherId: string; challengeId: string }>(a: T, b: T) =>
	b.score - a.score || a.researcherId.localeCompare(b.researcherId) || a.challengeId.localeCompare(b.challengeId)

// Lens 1: start from what companies say hurts, find the closest researcher.
const problems: Lens = {
	id: "problems",
	scout: "Problem Hunter",
	brief: "You start from company challenges and look for the researcher whose published work most directly attacks the problem.",
	shortlist(ds, size, challengeIds) {
		if (challengeIds.length <= 3) {
			// Reverse search: the closest profiles to the one problem.
			const cands = challengeIds.flatMap((cid) =>
				ds.researcherIndex
					.search(ds.challengeDoc(ds.challenges.get(cid)!), size * 3)
					.filter((h) => pitchable(ds, ds.researchers.get(h.id)))
					.map((h) => ({ researcherId: h.id, challengeId: cid, score: h.score, reason: `close profile to the problem text (BM25 ${h.score.toFixed(1)})` })),
			)
			return pickDistinct(cands.sort(byScore), size, ds)
		}
		const cands = challengeIds.flatMap((cid) => {
			const ref = ds.challenges.get(cid)!
			const hit = ds.researcherIndex
				.search(ds.challengeDoc(ref), 3)
				.find((h) => pitchable(ds, ds.researchers.get(h.id)))
			return hit ? [{ researcherId: hit.id, challengeId: cid, score: hit.score, reason: `closest profile to the challenge text (BM25 ${hit.score.toFixed(1)})` }] : []
		})
		return pickDistinct(cands.sort(byScore), size, ds)
	},
}

// Lens 2: start from papers from the last two years and look for a company that needs them now.
const freshPapers: Lens = {
	id: "fresh-papers",
	scout: "Fresh Ink",
	brief: "You start from publications of the last two years and look for a company challenge that this new work could solve now.",
	shortlist(ds, size, challengeIds) {
		const allowed = new Set(challengeIds)
		const years = [...ds.publications.values()].map((p) => p.year)
		const latest = Math.max(...years)
		const best = new Map<string, Omit<Candidate, "key">>()
		if (allowed.size <= 3) {
			// Reverse search: rank recent papers against the one problem instead.
			const ref = ds.challenges.get(challengeIds[0])!
			for (const h of ds.publicationIndex.search(ds.challengeDoc(ref), 60, (id) => (ds.publications.get(id)?.year ?? 0) >= latest - 1)) {
				const pub = ds.publications.get(h.id)!
				for (const a of pub.authors ?? []) {
					const r = a.researcher_id ? ds.researchers.get(a.researcher_id) : undefined
					if (!pitchable(ds, r) || best.has(r.id)) continue
					best.set(r.id, { researcherId: r.id, challengeId: ref.challenge.id, score: h.score, reason: `recent paper ${pub.id} (${pub.year}) matches the problem (BM25 ${h.score.toFixed(1)})` })
				}
			}
			return pickDistinct([...best.values()].sort(byScore), size, ds)
		}
		for (const pub of ds.publications.values()) {
			if (pub.year < latest - 1) continue
			const authors = (pub.authors ?? []).map((a) => a.researcher_id).filter((x): x is string => !!x)
			const r = authors.map((id) => ds.researchers.get(id)).find((x) => pitchable(ds, x))
			if (!r) continue
			const hit = ds.challengeIndex.search(`${pub.title}\n${(pub.keywords ?? []).join(" ")}\n${pub.abstract ?? ""}`, 1, (id) => allowed.has(id))[0]
			if (!hit) continue
			const key = `${r.id}|${hit.id}`
			const prev = best.get(key)
			if (!prev || prev.score < hit.score) {
				best.set(key, { researcherId: r.id, challengeId: hit.id, score: hit.score, reason: `recent paper ${pub.id} (${pub.year}) matches this challenge (BM25 ${hit.score.toFixed(1)})` })
			}
		}
		return pickDistinct([...best.values()].sort(byScore), size, ds)
	},
}

// Lens 3: researchers with no industry experience on record, who said they are open to it.
const untapped: Lens = {
	id: "untapped",
	scout: "First Contact",
	brief: "You look only at researchers with no industry experience on record who say they are open to joint work, and find the company problem that fits them best. A first industry partner can matter more to them than to anyone else.",
	shortlist(ds, size, challengeIds) {
		const allowed = new Set(challengeIds)
		const cands: Omit<Candidate, "key">[] = []
		for (const r of ds.researchers.values()) {
			if (ds.hasIndustryTies(r) && r.industry_experience.trim().length >= 40) continue
			if (!pitchable(ds, r) || !r.open_to.length) continue
			const hit = ds.challengeIndex.search(ds.researcherDoc(r), 1, (id) => allowed.has(id))[0]
			if (hit) cands.push({ researcherId: r.id, challengeId: hit.id, score: hit.score, reason: `no industry experience on record, open to ${r.open_to.slice(0, 2).join(" and ")} (BM25 ${hit.score.toFixed(1)})` })
		}
		return pickDistinct(cands.sort(byScore), size, ds)
	},
}

// Lens 4: the best match from outside the faculty you would normally call.
const bridges: Lens = {
	id: "bridges",
	scout: "Bridge Builder",
	brief: "You look for unexpected matches: a researcher from a different faculty than the one a company would normally call, whose work still fits the problem. These are the pairs nobody would find by asking the usual department.",
	shortlist(ds, size, challengeIds) {
		const cands: Omit<Candidate, "key">[] = []
		for (const cid of challengeIds) {
			const ref = ds.challenges.get(cid)!
			const hits = ds.researcherIndex.search(ds.challengeDoc(ref), 12).filter((h) => pitchable(ds, ds.researchers.get(h.id)))
			if (hits.length < 4) continue
			const count = new Map<string, number>()
			for (const h of hits.slice(0, 5)) count.set(ds.faculty.get(h.id)!, (count.get(ds.faculty.get(h.id)!) ?? 0) + 1)
			const home = [...count.entries()].sort((a, b) => b[1] - a[1])[0][0]
			// One bridge per challenge, or every bridge when there is only one problem (reverse search).
			const bridges = hits.filter((h) => ds.faculty.get(h.id) !== home && h.score >= 0.6 * hits[0].score).slice(0, challengeIds.length <= 3 ? size : 1)
			for (const bridge of bridges) {
				const rel = bridge.score / hits[0].score
				cands.push({
					researcherId: bridge.id,
					challengeId: cid,
					score: rel * bridge.score,
					reason: `the usual faculty for this problem is ${home}; this researcher is from ${ds.faculty.get(bridge.id)} and still scores ${(rel * 100).toFixed(0)}% of the top match`,
				})
			}
		}
		return pickDistinct(cands.sort(byScore), size, ds)
	},
}

export const LENSES: Lens[] = [problems, freshPapers, untapped, bridges]
