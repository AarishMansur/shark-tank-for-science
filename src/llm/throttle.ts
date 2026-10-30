// Keeps live runs inside the Gemini free tier: a cap on parallel requests and
// a minimum gap between request starts (requests per minute).
export class Throttle {
	private active = 0
	private lastStart = 0
	private readonly queue: (() => void)[] = []

	constructor(
		private readonly maxConcurrent: number,
		private readonly rpm: number,
	) {}

	async acquire(): Promise<void> {
		if (this.active >= this.maxConcurrent) {
			await new Promise<void>((r) => this.queue.push(r))
		}
		this.active++
		const gap = this.rpm > 0 ? 60_000 / this.rpm : 0
		const wait = Math.max(0, this.lastStart + gap - Date.now())
		this.lastStart = Math.max(Date.now(), this.lastStart + gap)
		if (wait > 0) await sleep(wait)
	}

	release(): void {
		this.active--
		const next = this.queue.shift()
		if (next) next()
	}
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

// Reads the retry hint Gemini puts in 429 errors ("retryDelay": "17s"), if any.
export function retryDelayMs(error: unknown, attempt: number): number {
	const text = String((error as any)?.message ?? error)
	const m = text.match(/retryDelay"?\s*[:=]\s*"?(\d+(?:\.\d+)?)s/)
	if (m) return Math.ceil(parseFloat(m[1]) * 1000) + 500
	return Math.min(60_000, 2_000 * 2 ** attempt)
}

export function isRetryable(error: unknown): boolean {
	const text = String((error as any)?.message ?? error)
	const status = (error as any)?.status ?? (error as any)?.code
	return [429, 500, 502, 503, 504].includes(Number(status)) || /429|RESOURCE_EXHAUSTED|UNAVAILABLE|overloaded|503|500|fetch failed|ECONNRESET|ETIMEDOUT/i.test(text)
}
