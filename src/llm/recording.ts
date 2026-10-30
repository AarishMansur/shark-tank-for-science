import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { dirname } from "node:path"

export type RecordedCall = {
	agent: string
	model: string
	text: string
	inputTokens: number
	outputTokens: number
	reasoningTokens: number
	latencyMs: number
}

export type Recording = {
	recordedAt: string
	model: string
	writerModel: string
	args: string[]
	note: string
	calls: Record<string, RecordedCall>
}

export function loadRecording(file: string): Recording {
	return JSON.parse(readFileSync(file, "utf8"))
}

export function saveRecording(file: string, rec: Recording): void {
	mkdirSync(dirname(file), { recursive: true })
	const sorted = Object.fromEntries(Object.entries(rec.calls).sort(([a], [b]) => a.localeCompare(b)))
	writeFileSync(file, JSON.stringify({ ...rec, calls: sorted }, null, 1) + "\n")
}
