import { defineRuntime } from "@mozaik-ai/core"
import type { PitchRoomState } from "./room/state"

export const { initializeRuntime, resolveRuntime, resolveParticipant, join, leave, sendMessage, sendEvent, runLoop } =
	defineRuntime<PitchRoomState>()

export const room = () => resolveRuntime().state
