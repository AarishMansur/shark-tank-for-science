import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { BM25 } from "./bm25"
import { availabilityFlags, canonicalFaculty } from "./faculty"
import type { Challenge, Company, Patent, Project, Publication, Researcher, SourceRecord } from "./types"

function asList(v: unknown): string[] {
	return Array.isArray(v) ? v.map(String) : []
}

export type ChallengeRef = { challenge: Challenge; company: Company }

export class Dataset {
	readonly researchers = new Map<string, Researcher>()
	readonly companies = new Map<string, Company>()
	readonly challenges = new Map<string, ChallengeRef>()
	readonly publications = new Map<string, Publication>()
	readonly projects = new Map<string, Project>()
	readonly patents = new Map<string, Patent>()
	readonly sources = new Map<string, SourceRecord>()
	readonly faculty = new Map<string, string>()

	researcherIndex!: BM25
	challengeIndex!: BM25
	publicationIndex!: BM25

	constructor(input: {
		researchers: Researcher[]
		companies: Company[]
		publications: Publication[]
		projects: Project[]
		patents: Patent[]
	}) {
		for (const r of input.researchers) {
			r.fields = asList(r.fields)
			r.keywords = asList(r.keywords)
			r.publications = asList(r.publications)
			r.projects = asList(r.projects)
			r.patents = asList(r.patents)
			r.open_to = asList(r.open_to)
			r.bio ??= ""
			r.notes ??= ""
			r.industry_experience ??= ""
			this.researchers.set(r.id, r)
			this.faculty.set(r.id, canonicalFaculty(r.faculty))
		}
		for (const c of input.companies) {
			c.challenges = Array.isArray(c.challenges) ? c.challenges : []
			c.tech = asList(c.tech)
			c.products = asList(c.products)
			this.companies.set(c.id, c)
			for (const ch of c.challenges) this.challenges.set(ch.id, { challenge: ch, company: c })
		}
		for (const p of input.publications) this.publications.set(p.id, p)
		for (const p of input.projects) this.projects.set(p.id, p)
		for (const p of input.patents) this.patents.set(p.id, p)
		this.buildSources()
		this.buildIndexes()
	}

	static load(dir = process.env.EINSTEIN_DATA ?? "data"): Dataset {
		const need = ["researchers.json", "companies.json", "publications.jsonl", "projects.json", "patents.json"]
		for (const f of need) {
			if (!existsSync(join(dir, f))) {
				throw new Error(`Missing ${join(dir, f)}. Run "npm run data" first to download the EINSTEIN dataset.`)
			}
		}
		const read = (f: string) => JSON.parse(readFileSync(join(dir, f), "utf8"))
		const publications = readFileSync(join(dir, "publications.jsonl"), "utf8")
			.split("\n")
			.filter((l) => l.trim())
			.map((l) => JSON.parse(l) as Publication)
		return new Dataset({
			researchers: read("researchers.json").researchers,
			companies: read("companies.json").companies,
			publications,
			projects: read("projects.json").projects,
			patents: read("patents.json").patents,
		})
	}

	private buildSources(): void {
		for (const r of this.researchers.values()) {
			this.sources.set(r.id, {
				id: r.id,
				kind: "researcher",
				title: `${r.name}, ${r.title}, ${r.faculty}`,
				text: [
					`${r.name}. ${r.title}, ${r.department}, ${r.faculty}.`,
					`Fields: ${r.fields.join("; ")}.`,
					`Keywords: ${r.keywords.join("; ")}.`,
					r.bio,
					`Open to: ${r.open_to.join("; ") || "not stated"}.`,
					`Industry experience: ${r.industry_experience || "none listed"}.`,
					`Notes: ${r.notes || "none"}.`,
				].join("\n"),
				owners: [r.id],
			})
		}
		for (const c of this.companies.values()) {
			this.sources.set(c.id, {
				id: c.id,
				kind: "company",
				title: `${c.name} (${c.sector})`,
				text: [
					`${c.name}, ${c.sector}, ${c.employees} employees, ${c.location}, founded ${c.founded}.`,
					c.about,
					`Products: ${c.products.join("; ")}.`,
					`Tech: ${c.tech.join("; ")}.`,
					`Plans: ${c.plans}`,
					`R&D capacity: ${c.rd_capacity}`,
					`Past collaborations: ${c.past_collaborations}`,
				].join("\n"),
				owners: [c.id],
			})
			for (const ch of c.challenges) {
				this.sources.set(ch.id, {
					id: ch.id,
					kind: "challenge",
					title: `${c.name}: ${ch.text.slice(0, 90)}`,
					text: `${ch.text}\n${ch.detail ?? ""}`,
					owners: [c.id],
				})
			}
		}
		for (const p of this.publications.values()) {
			this.sources.set(p.id, {
				id: p.id,
				kind: "publication",
				title: `${p.title} (${p.year})`,
				text: `${p.title}. ${p.venue ?? ""}, ${p.year}. Keywords: ${(p.keywords ?? []).join("; ")}.\n${p.abstract ?? "(no abstract)"}`,
				owners: (p.authors ?? []).map((a) => a.researcher_id).filter((x): x is string => !!x),
			})
		}
		for (const p of this.projects.values()) {
			const owners = Array.isArray(p.participants) ? p.participants.map((x) => x.researcher_id) : []
			this.sources.set(p.id, {
				id: p.id,
				kind: "project",
				title: `${p.title} (${p.years ?? ""})`,
				text: `${p.title}. ${p.programme ?? ""}, ${p.years ?? ""}.\n${p.summary ?? ""}`,
				owners,
			})
		}
		for (const p of this.patents.values()) {
			const owners = Array.isArray(p.inventors) ? p.inventors.map((x) => x.researcher_id ?? "").filter(Boolean) : []
			this.sources.set(p.id, {
				id: p.id,
				kind: "patent",
				title: `${p.title} (${p.status ?? "status unknown"})`,
				text: `${p.title}. Status: ${p.status ?? "unknown"}.\n${p.abstract || "(no abstract)"}`,
				owners,
			})
		}
		// Researchers list their own publications, projects and patents too. Merge both directions.
		for (const r of this.researchers.values()) {
			for (const id of [...r.publications, ...r.projects, ...r.patents]) {
				const s = this.sources.get(id)
				if (s && !s.owners.includes(r.id)) s.owners.push(r.id)
			}
		}
	}

	researcherDoc(r: Researcher): string {
		const pubs = r.publications
			.map((id) => this.publications.get(id))
			.filter((p): p is Publication => !!p)
			.sort((a, b) => b.year - a.year)
			.slice(0, 25)
			.map((p) => `${p.title}. ${(p.keywords ?? []).join(" ")}`)
		return [r.fields.join(" "), r.keywords.join(" "), r.keywords.join(" "), r.bio, r.open_to.join(" "), ...pubs].join("\n")
	}

	challengeDoc(ref: ChallengeRef): string {
		return `${ref.challenge.text}\n${ref.challenge.text}\n${ref.challenge.detail ?? ""}\n${ref.company.sector}`
	}

	private buildIndexes(): void {
		this.researcherIndex = new BM25([...this.researchers.values()].map((r) => ({ id: r.id, text: this.researcherDoc(r) })))
		this.challengeIndex = new BM25([...this.challenges.values()].map((c) => ({ id: c.challenge.id, text: this.challengeDoc(c) })))
		this.publicationIndex = new BM25(
			[...this.publications.values()].map((p) => ({
				id: p.id,
				text: `${p.title}\n${p.title}\n${(p.keywords ?? []).join(" ")}\n${p.abstract ?? ""}`,
			})),
		)
	}

	availability(researcherId: string): string[] {
		const r = this.researchers.get(researcherId)
		return r ? availabilityFlags(r) : []
	}

	hasIndustryTies(r: Researcher): boolean {
		return r.industry_experience.trim().length > 0
	}

	// Register a free text problem from reverse search so claims can cite it like any record.
	addUserProblem(id: string, text: string): ChallengeRef {
		const company: Company = {
			id: "USER",
			name: "Company using reverse search",
			sector: "not stated",
			employees: 0,
			founded: 0,
			location: "",
			about: text,
			products: [],
			tech: [],
			challenges: [],
			plans: "",
			rd_capacity: "not stated",
			past_collaborations: "",
			language: "en",
		}
		const challenge: Challenge = { id, text: text.slice(0, 200), detail: text }
		company.challenges.push(challenge)
		const ref = { challenge, company }
		this.challenges.set(id, ref)
		this.companies.set("USER", company)
		this.sources.set(id, { id, kind: "user_problem", title: "Problem described by the company", text, owners: ["USER"] })
		this.sources.set("USER", { id: "USER", kind: "company", title: company.name, text, owners: ["USER"] })
		return ref
	}
}
