import { RuntimeState } from "@mozaik-ai/core"
import type { Dataset } from "../data/dataset"
import type { Trace } from "./trace"
import type { PairCard, PairStatus } from "./types"

export type RunConfig = {
	mode: "live" | "replay" | "mock"
	model: string
	writerModel: string
	pitchesPerScout: number
	shortlistSize: number
	problem?: string // reverse search
	minProposals: number
	outDir: string
	quiet: boolean
}

export type Task = {
	id: string
	agent: string
	purpose: string
	pairId?: string
	startedAt: number
	mock?: () => unknown
	onAnswer: (parsed: any, raw: string) => void
}

export type AgentUsage = { calls: number; inputTokens: number; outputTokens: number; reasoningTokens: number; ms: number; errors: number }

// The shared state every participant in the pitch room reads and writes.
export class PitchRoomState extends RuntimeState {
	readonly board = new Map<string, PairCard>()
	readonly tasks = new Map<string, Task>()
	readonly loopToTask = new Map<string, string>()
	readonly usage = new Map<string, AgentUsage>()
	readonly scoutsDone = new Set<string>()
	inFlight = 0
	onSettle?: () => void
	closed = false
	private resolveClosed!: () => void
	readonly closedPromise: Promise<void>

	constructor(
		readonly dataset: Dataset,
		readonly config: RunConfig,
		readonly trace: Trace,
		readonly scoutCount: number,
	) {
		super()
		this.closedPromise = new Promise((r) => (this.resolveClosed = r))
	}

	setStatus(card: PairCard, status: PairStatus, note: string, by: string): void {
		card.status = status
		card.history.push({ at: this.trace.elapsed(), status, note })
		this.trace.log("pair.status", by, { status, note }, card.pairId)
	}

	addUsage(agent: string, delta: Partial<AgentUsage>): void {
		const u = this.usage.get(agent) ?? { calls: 0, inputTokens: 0, outputTokens: 0, reasoningTokens: 0, ms: 0, errors: 0 }
		for (const [k, v] of Object.entries(delta)) (u as any)[k] += v ?? 0
		this.usage.set(agent, u)
	}

	markClosed(): void {
		if (this.closed) return
		this.closed = true
		this.resolveClosed()
	}
}
