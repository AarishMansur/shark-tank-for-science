import { createHuman, SituationSpecification, type Human, type SituationContext } from "@mozaik-ai/core"
import { room } from "../runtime"

const LOOP_EVENTS = new Set(["inference.started", "inference.completed"])
const SKIP = new Set(["message_received.started", "message_received.completed", "model.answer", "participant.joined", "participant.left"])

class AnyEvent extends SituationSpecification {
	isSatisfiedBy(_: SituationContext): boolean {
		return true
	}
}

// An observer: it never speaks. It writes every bus event to the trace, which is
// what proves the agents overlap in time (see inference.started / completed).
export function createRecorder(): Human {
	return createHuman({
		name: "Recorder",
		capabilities: ["observer"],
		handlers: [
			{
				specification: new AnyEvent(),
				processor: {
					apply({ event }) {
						const st = room()
						if (SKIP.has(event.type)) return
						const producer = st.getParticipant(event.producerId)?.getManifest().name ?? event.producerId
						const payload = event.payload as any
						if (LOOP_EVENTS.has(event.type)) {
							const task = st.loopToTask.get(payload.loopId)
							st.trace.log(`bus.${event.type}`, producer, { task, loopId: payload.loopId }, task?.split(":")[2])
							return
						}
						st.trace.log(`bus.${event.type}`, producer, compact(payload), payload?.pairId ?? payload?.pitch?.pairId)
					},
				},
			},
		],
	})
}

function compact(payload: any): unknown {
	if (payload?.pitch) return { pairId: payload.pitch.pairId, version: payload.pitch.version, scout: payload.pitch.scout }
	return payload
}
