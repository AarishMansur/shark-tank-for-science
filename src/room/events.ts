import { SemanticEvent, SituationContext, SituationHandler, SituationSpecification } from "@mozaik-ai/core"
import { room, sendEvent } from "../runtime"

// Domain events on the Mozaik bus. Every agent reacts to these; nobody calls another agent directly.
export type RoomEvents = {
	"room.opened": { challengeIds: string[]; problem?: string }
	"pitch.proposed": { pitch: import("./types").Pitch }
	"pitch.posted": { pairId: string; version: number }
	"pitch.returned": { pairId: string; scout: string; version: number; kills: { claim: string; reason: string }[] }
	"pitch.cleared": { pairId: string; version: number }
	"shark.verdict": { pairId: string; shark: string }
	"verdicts.checked": { pairId: string }
	"pair.killed": { pairId: string; by: string; reason: string }
	"pair.survived": { pairId: string; wildcard?: boolean }
	"pair.approved": { pairId: string; note: string }
	"proposal.drafted": { pairId: string; version: number }
	"proposal.returned": { pairId: string; version: number; kills: { claim: string; reason: string }[] }
	"proposal.final": { pairId: string }
	"scout.done": { scout: string; pitched: number }
	"room.closed": { proposals: number }
}

export type RoomEventType = keyof RoomEvents

export function emit<T extends RoomEventType>(type: T, producerId: string, payload: RoomEvents[T]): void {
	sendEvent(SemanticEvent.create(type, producerId, payload), producerId)
}

class EventIs extends SituationSpecification {
	constructor(private readonly type: string) {
		super()
	}
	isSatisfiedBy({ event }: SituationContext): boolean {
		return event.type === this.type && !room().closed
	}
}

export function on<T extends RoomEventType>(type: T, fn: (payload: RoomEvents[T], ctx: SituationContext) => void): SituationHandler {
	return {
		specification: new EventIs(type),
		processor: {
			apply(ctx) {
				try {
					fn(ctx.event.payload as RoomEvents[T], ctx)
				} catch (err) {
					room().trace.log("agent.crash", ctx.participant.getManifest().name, { on: type, error: String((err as Error)?.stack ?? err).slice(0, 500) })
				}
			},
		},
	}
}

export const pairIdOf = (researcherId: string, challengeId: string) => `${researcherId}x${challengeId}`
