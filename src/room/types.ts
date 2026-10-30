export type Claim = {
	id: string // stable within a pair, e.g. "P1.c2"
	text: string
	sourceIds: string[]
	by: string // agent name
	status: "pending" | "supported" | "killed"
	killReason?: string
	killedBy?: "rule" | "critic"
}

export type Pitch = {
	pairId: string
	researcherId: string
	challengeId: string
	companyId: string
	scout: string
	lens: string
	headline: string
	why: string
	claims: Claim[]
	version: number
	secondedBy: string[]
}

export type Objection = Claim & { severity: "dealbreaker" | "concern" }

export type SharkVerdict = {
	shark: string
	verdict: "invest" | "pass"
	confidence: number
	strengths: Claim[]
	objections: Objection[]
	question: string
}

export type PairStatus =
	| "pitched"
	| "returned"
	| "cleared"
	| "grilled"
	| "survived"
	| "wildcard"
	| "killed"
	| "writing"
	| "proposed"

export type ProposalDraft = {
	title: string
	kind: "industrial_phd" | "joint_project"
	summary: string
	problem: string
	researchQuestions: string[]
	plan: { phase: string; work: string; result: string }[]
	companyBrings: string[]
	facultyBrings: string[]
	whyThisPair: Claim[]
	risks: { objection: string; raisedBy: string; rebuttal: string }[]
	agreedUpFront: string[]
	firstMeetingAgenda: string[]
}

export type PairCard = {
	pairId: string
	pitch: Pitch
	status: PairStatus
	history: { at: number; status: PairStatus; note: string }[]
	verdicts: Record<string, SharkVerdict>
	killedBy?: string
	killReason?: string
	proposal?: ProposalDraft
	proposalVersion: number
	removedProposalClaims: Claim[]
	pitchedAt: number
	wildcard?: boolean
}
