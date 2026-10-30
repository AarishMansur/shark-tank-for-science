export type Researcher = {
	id: string
	name: string
	title: string
	institution: string
	faculty: string
	department: string
	fields: string[]
	keywords: string[]
	bio: string
	publications: string[]
	projects: string[]
	patents: string[]
	open_to: string[]
	industry_experience: string
	notes: string
	language: string
}

export type Challenge = { id: string; text: string; detail: string }

export type Company = {
	id: string
	name: string
	sector: string
	employees: number
	founded: number
	location: string
	about: string
	products: string[]
	tech: string[]
	challenges: Challenge[]
	plans: string
	rd_capacity: string
	past_collaborations: string
	language: string
}

export type Author = { name: string; researcher_id: string | null; affiliation?: string }

export type Publication = {
	id: string
	title: string
	abstract?: string
	year: number
	venue?: string
	type?: string
	keywords?: string[]
	authors: Author[]
}

export type Project = {
	id: string
	acronym?: string
	title: string
	programme?: string
	years?: string
	summary?: string
	partners?: unknown[]
	participants?: { researcher_id: string; role?: string }[]
}

export type Patent = {
	id: string
	title: string
	status?: string
	abstract?: string
	inventors?: { name: string; researcher_id?: string | null }[]
	[key: string]: unknown
}

// Anything a claim can cite. `text` is what the critic reads when it checks a claim.
export type SourceRecord = {
	id: string
	kind: "researcher" | "company" | "challenge" | "publication" | "project" | "patent" | "user_problem"
	title: string
	text: string
	owners: string[] // researcher or company ids this record belongs to
}
