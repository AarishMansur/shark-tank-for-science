import { appendFileSync, mkdirSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"

export type TraceLine = {
	t: string // ISO timestamp
	ms: number // since the room opened
	type: string
	agent: string
	pairId?: string
	data?: unknown
}

// Append-only JSONL trace of one run. Every line is also kept in memory for the report.
export class Trace {
	readonly lines: TraceLine[] = []
	private readonly start = Date.now()
	onLine?: (line: TraceLine) => void

	constructor(private readonly file?: string) {
		if (file) {
			mkdirSync(dirname(file), { recursive: true })
			writeFileSync(file, "")
		}
	}

	elapsed(): number {
		return Date.now() - this.start
	}

	log(type: string, agent: string, data?: unknown, pairId?: string): TraceLine {
		const line: TraceLine = { t: new Date().toISOString(), ms: this.elapsed(), type, agent, ...(pairId ? { pairId } : {}), ...(data === undefined ? {} : { data }) }
		this.lines.push(line)
		if (this.file) appendFileSync(this.file, JSON.stringify(line) + "\n")
		this.onLine?.(line)
		return line
	}
}
