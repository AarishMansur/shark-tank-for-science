import type { StructuredOutputFormat } from "@mozaik-ai/core"

const claim = {
	type: "object",
	properties: {
		text: { type: "string", description: "One factual statement about the researcher, the company or the challenge." },
		sources: { type: "array", items: { type: "string" }, description: "Record ids from the evidence that support this exact statement, e.g. SYN-PUB-00123, R0042, C017-CH2." },
	},
	required: ["text", "sources"],
}

export const pitchSchema: StructuredOutputFormat = {
	name: "pitches",
	schema: {
		type: "object",
		properties: {
			pitches: {
				type: "array",
				items: {
					type: "object",
					properties: {
						candidate: { type: "string", description: "Candidate key from the shortlist, e.g. K3." },
						headline: { type: "string", description: "One line: what these two would do together." },
						why: { type: "string", description: "Two or three sentences on why this pair, in plain language." },
						claims: { type: "array", items: claim },
					},
					required: ["candidate", "headline", "why", "claims"],
				},
			},
		},
		required: ["pitches"],
	},
}

export const revisedPitchSchema: StructuredOutputFormat = {
	name: "revised_pitch",
	schema: {
		type: "object",
		properties: {
			withdraw: { type: "boolean", description: "True if the pitch cannot stand on supported claims and you withdraw it." },
			headline: { type: "string" },
			why: { type: "string" },
			claims: { type: "array", items: claim },
		},
		required: ["withdraw", "headline", "why", "claims"],
	},
}

export const verdictSchema: StructuredOutputFormat = {
	name: "shark_verdict",
	schema: {
		type: "object",
		properties: {
			verdict: { type: "string", enum: ["invest", "pass"] },
			confidence: { type: "integer", description: "1 to 10." },
			strengths: { type: "array", items: claim },
			objections: {
				type: "array",
				items: {
					type: "object",
					properties: {
						text: { type: "string" },
						sources: { type: "array", items: { type: "string" } },
						severity: { type: "string", enum: ["dealbreaker", "concern"] },
					},
					required: ["text", "sources", "severity"],
				},
			},
			question: { type: "string", description: "The one question you would ask the pair in the room." },
		},
		required: ["verdict", "confidence", "strengths", "objections", "question"],
	},
}

export const supportSchema: StructuredOutputFormat = {
	name: "support_check",
	schema: {
		type: "object",
		properties: {
			checks: {
				type: "array",
				items: {
					type: "object",
					properties: {
						claim: { type: "string", description: "The claim id, e.g. c3." },
						supported: { type: "boolean" },
						reason: { type: "string", description: "Short reason. For unsupported claims say what is missing or wrong." },
					},
					required: ["claim", "supported", "reason"],
				},
			},
		},
		required: ["checks"],
	},
}

export const proposalSchema: StructuredOutputFormat = {
	name: "proposal",
	schema: {
		type: "object",
		properties: {
			title: { type: "string" },
			kind: { type: "string", enum: ["industrial_phd", "joint_project"] },
			summary: { type: "string", description: "Three sentences a busy CTO and a professor would both read." },
			problem: { type: "string" },
			research_questions: { type: "array", items: { type: "string" } },
			plan: {
				type: "array",
				items: {
					type: "object",
					properties: { phase: { type: "string" }, work: { type: "string" }, result: { type: "string" } },
					required: ["phase", "work", "result"],
				},
			},
			company_brings: { type: "array", items: { type: "string" } },
			faculty_brings: { type: "array", items: { type: "string" } },
			why_this_pair: { type: "array", items: claim },
			risks_and_rebuttals: {
				type: "array",
				items: {
					type: "object",
					properties: { objection: { type: "string" }, raised_by: { type: "string" }, rebuttal: { type: "string" } },
					required: ["objection", "raised_by", "rebuttal"],
				},
			},
			agreed_up_front: { type: "array", items: { type: "string" } },
			first_meeting_agenda: { type: "array", items: { type: "string" } },
		},
		required: [
			"title", "kind", "summary", "problem", "research_questions", "plan", "company_brings", "faculty_brings",
			"why_this_pair", "risks_and_rebuttals", "agreed_up_front", "first_meeting_agenda",
		],
	},
}
