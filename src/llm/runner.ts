import {
	InputTokenDetails,
	InferenceInput,
	InferenceOutput,
	InferenceRunner,
	ModelMessageItem,
	OutputTokenDetails,
	SemanticEvent,
	TokenUsage,
	supportedModels,
} from "@mozaik-ai/core"
import type { PitchRoomState } from "../room/state"
import type { Recording } from "./recording"
import { Throttle, isDailyQuota, isRetryable, retryDelayMs, sleep } from "./throttle"

// Every model call in the room goes through this runner. It is plugged into Mozaik
// through `inferenceRunnerConfig.runner`, so the agent loops stay untouched and
//   live   calls Gemini (throttled, retried) and records every answer,
//   replay answers from a recorded run with no API key,
//   mock   answers from small deterministic functions, for tests and offline demos.
// The model context id is the task id, which is how answers are tied back to a pair.
export class PitchRoomRunner implements InferenceRunner {
	private readonly inner: InferenceRunner
	private readonly throttle: Throttle

	constructor(
		private readonly state: () => PitchRoomState,
		private readonly recording: Recording,
		opts: { maxConcurrent: number; rpm: number; replaySpeed: number; fallbackModel?: string },
	) {
		// Same routing as Mozaik's default runner: pick the endpoint for the model name.
		this.inner = {
			run: async (input: InferenceInput) => {
				const model = supportedModels.find((m) => m.specification.name === input.model)
				if (!model) throw new Error(`Unsupported model: ${input.model}`)
				return model.endpoint.infer(input)
			},
			stream: async function* () {
				throw new Error("not used")
			},
		}
		this.throttle = new Throttle(opts.maxConcurrent, opts.rpm)
		this.replaySpeed = opts.replaySpeed
		this.fallbackModel = opts.fallbackModel
	}
	private readonly replaySpeed: number
	private readonly fallbackModel?: string

	async run(input: InferenceInput): Promise<InferenceOutput> {
		const key = input.context.id
		const st = this.state()
		const task = st.tasks.get(key)
		const agent = task?.agent ?? "unknown"
		const mode = st.config.mode
		const started = Date.now()

		if (mode === "mock") {
			await sleep(40 + (hash(key) % 120))
			const text = JSON.stringify(task?.mock ? task.mock() : { error: "no mock for task" })
			return this.output(text, 0, 0, 0, { mock: true })
		}

		if (mode === "replay") {
			const call = this.recording.calls[key]
			if (!call) {
				st.trace.log("replay.missing", agent, { key })
				return this.output(JSON.stringify({ __error: `no recorded answer for ${key}` }), 0, 0, 0, { replay: true })
			}
			await sleep(Math.min(4000, call.latencyMs * this.replaySpeed))
			return this.output(call.text, call.inputTokens, call.outputTokens, call.reasoningTokens, { replay: true })
		}

		// Resuming a run that stopped half way (free tier quotas): reuse answers already recorded.
		const cached = this.recording.calls[key]
		if (cached) {
			st.trace.log("model.cached", agent, { key })
			return this.output(cached.text, cached.inputTokens, cached.outputTokens, cached.reasoningTokens, { cached: true })
		}

		let lastError: unknown
		for (let attempt = 0; attempt < 7; attempt++) {
			await this.throttle.acquire()
			let out: InferenceOutput
			try {
				out = await this.inner.run(input)
			} catch (error) {
				this.throttle.release()
				lastError = error
				st.trace.log("model.retry", agent, { key, attempt, error: String((error as any)?.message ?? error).slice(0, 300) })
				if (!isRetryable(error)) break
				// Busy or out of quota on the bigger model: fall back to the light one.
				const daily = isDailyQuota(error)
				if ((attempt >= 1 || daily) && this.fallbackModel && input.model !== this.fallbackModel) {
					st.trace.log("model.fallback", agent, { key, from: input.model, to: this.fallbackModel, reason: daily ? "daily quota" : "busy" })
					input = { ...input, model: this.fallbackModel }
					continue
				}
				if (daily) break
				await sleep(retryDelayMs(error, attempt))
				continue
			}
			this.throttle.release()
			const text = out.items
				.filter((i): i is ModelMessageItem => i instanceof ModelMessageItem)
				.map((i) => i.content.text)
				.join("")
			const u = out.tokenUsage
			const reasoning = u?.outputTokenDetails?.reasoning_tokens ?? 0
			this.recording.calls[key] = {
				agent,
				model: input.model,
				text,
				inputTokens: u?.inputTokens ?? 0,
				outputTokens: u?.outputTokens ?? 0,
				reasoningTokens: reasoning,
				latencyMs: Date.now() - started,
			}
			return this.output(text, u?.inputTokens ?? 0, u?.outputTokens ?? 0, reasoning, { live: true })
		}
		return this.output(JSON.stringify({ __error: String((lastError as any)?.message ?? lastError).slice(0, 300) }), 0, 0, 0, { failed: true })
	}

	private output(text: string, inTok: number, outTok: number, reasoning: number, raw: unknown): InferenceOutput {
		return {
			items: [ModelMessageItem.rehydrate({ text })],
			tokenUsage: new TokenUsage(inTok, outTok, inTok + outTok, new InputTokenDetails(0), new OutputTokenDetails(reasoning)),
			rowResponse: raw,
		}
	}

	async *stream(input: InferenceInput): AsyncGenerator<SemanticEvent> {
		yield SemanticEvent.create("inference.output", input.model, await this.run(input))
	}
}

function hash(s: string): number {
	let h = 0
	for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0
	return Math.abs(h)
}
