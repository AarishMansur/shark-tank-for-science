import {
	Agent,
	DeveloperMessageItem,
	ModelContext,
	ModelMessageItem,
	SituationContext,
	SituationHandler,
	SituationSpecification,
	StructuredOutputFormat,
} from "@mozaik-ai/core"
import { room, runLoop } from "../runtime"

// Each model call gets a fresh context whose id is a deterministic task id
// (agent, purpose, pair, version). Agents can then run many loops at once
// without their memories bleeding into each other, and replays line up.
export function ask(
	agent: Agent,
	opts: {
		purpose: string
		pairId?: string
		prompt: string
		schema: StructuredOutputFormat
		model?: string
		mock: () => unknown
		onAnswer: (parsed: any, raw: string) => void
	},
): string {
	const st = room()
	const name = agent.getManifest().name
	const id = [name, opts.purpose, opts.pairId].filter(Boolean).join(":")
	st.tasks.set(id, { id, agent: name, purpose: opts.purpose, pairId: opts.pairId, startedAt: st.trace.elapsed(), mock: opts.mock, onAnswer: opts.onAnswer })
	st.inFlight++
	st.trace.log("agent.thinking", name, { task: id, purpose: opts.purpose, promptChars: opts.prompt.length }, opts.pairId)
	const context = ModelContext.rehydrate({ id, items: [DeveloperMessageItem.create(agent.getDeveloperMessage())] })
	runLoop(agent.getId(), opts.prompt, {
		model: opts.model ?? st.config.model,
		context,
		structuredOutput: opts.schema,
	})
	return id
}

class OwnLoopStarted extends SituationSpecification {
	isSatisfiedBy({ event, participant }: SituationContext): boolean {
		return event.type === "message_received.started" && event.producerId === participant.getId()
	}
}

class OwnInferenceCompleted extends SituationSpecification {
	isSatisfiedBy({ event, participant }: SituationContext): boolean {
		return event.type === "inference.completed" && event.producerId === participant.getId()
	}
}

class OwnAnswer extends SituationSpecification {
	isSatisfiedBy({ event, participant }: SituationContext): boolean {
		return event.type === "model.answer" && event.producerId === participant.getId()
	}
}

export function parseJson(raw: string): any {
	const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "")
	try {
		return JSON.parse(trimmed)
	} catch {
		const start = trimmed.indexOf("{")
		const end = trimmed.lastIndexOf("}")
		if (start >= 0 && end > start) {
			try {
				return JSON.parse(trimmed.slice(start, end + 1))
			} catch {}
		}
		return { __error: "could not parse model output as JSON" }
	}
}

// Handlers every model-backed participant registers so its own loops are tied back to tasks.
export const taskHandlers: SituationHandler[] = [
	{
		specification: new OwnLoopStarted(),
		processor: {
			apply({ event }) {
				const p = event.payload as { loopId: string; input: { context: ModelContext } }
				room().loopToTask.set(p.loopId, p.input.context.id)
			},
		},
	},
	{
		specification: new OwnInferenceCompleted(),
		processor: {
			apply({ event, participant }) {
				const p = event.payload as { loopId: string; tokenUsage?: { inputTokens: number; outputTokens: number; outputTokenDetails?: { reasoning_tokens: number } } }
				const st = room()
				const task = st.tasks.get(st.loopToTask.get(p.loopId) ?? "")
				st.addUsage(participant.getManifest().name, {
					calls: 1,
					inputTokens: p.tokenUsage?.inputTokens ?? 0,
					outputTokens: p.tokenUsage?.outputTokens ?? 0,
					reasoningTokens: p.tokenUsage?.outputTokenDetails?.reasoning_tokens ?? 0,
					ms: task ? st.trace.elapsed() - task.startedAt : 0,
				})
				st.trace.log(
					"model.usage",
					participant.getManifest().name,
					{ task: task?.id, inputTokens: p.tokenUsage?.inputTokens ?? 0, outputTokens: p.tokenUsage?.outputTokens ?? 0, ms: task ? st.trace.elapsed() - task.startedAt : 0 },
					task?.pairId,
				)
			},
		},
	},
	{
		specification: new OwnAnswer(),
		processor: {
			apply({ event, participant }) {
				const p = event.payload as { loopId: string; answer: ModelMessageItem }
				const st = room()
				const taskId = st.loopToTask.get(p.loopId)
				const task = taskId ? st.tasks.get(taskId) : undefined
				if (!task) return
				const raw = p.answer.content.text
				const parsed = parseJson(raw)
				if (parsed?.__error) {
					st.addUsage(participant.getManifest().name, { errors: 1 })
					st.trace.log("model.error", task.agent, { task: task.id, error: parsed.__error }, task.pairId)
				}
				try {
					task.onAnswer(parsed, raw)
				} catch (err) {
					st.trace.log("agent.crash", task.agent, { task: task.id, error: String(err) }, task.pairId)
				} finally {
					st.inFlight--
					st.tasks.delete(task.id)
					// Settlement check runs after this event finishes fanning out.
					setImmediate(() => room().onSettle?.())
				}
			},
		},
	},
]
