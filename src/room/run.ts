import { Dataset } from "../data/dataset"
import { createChair } from "../agents/chair"
import { createCritic } from "../agents/critic"
import { createRecorder } from "../agents/recorder"
import { createScout } from "../agents/scout"
import { SHARKS, createShark } from "../agents/shark"
import { createWriter } from "../agents/writer"
import { PitchRoomRunner } from "../llm/runner"
import type { Recording } from "../llm/recording"
import { initializeRuntime, join, resolveRuntime } from "../runtime"
import { emit } from "./events"
import { LENSES } from "./lenses"
import { PitchRoomState, type RunConfig } from "./state"
import { Trace } from "./trace"

export type RunOptions = RunConfig & {
	sector?: string
	maxChallenges?: number
	rpm: number
	maxConcurrent: number
	replaySpeed: number
	timeoutMs: number
}

export const USER_PROBLEM_ID = "Q-1"

export async function runRoom(ds: Dataset, opts: RunOptions, recording: Recording, trace: Trace): Promise<PitchRoomState> {
	const state = new PitchRoomState(ds, opts, trace, LENSES.length)
	initializeRuntime({
		state,
		inferenceRunnerConfig: {
			runner: new PitchRoomRunner(() => resolveRuntime().state, recording, { maxConcurrent: opts.maxConcurrent, rpm: opts.rpm, replaySpeed: opts.replaySpeed }),
		},
	})

	let challengeIds: string[]
	if (opts.problem) {
		ds.addUserProblem(USER_PROBLEM_ID, opts.problem)
		challengeIds = [USER_PROBLEM_ID]
	} else {
		challengeIds = [...ds.challenges.keys()].filter((id) => {
			if (!opts.sector) return true
			return ds.challenges.get(id)!.company.sector.toLowerCase().includes(opts.sector.toLowerCase())
		})
		if (opts.maxChallenges) challengeIds = challengeIds.slice(0, opts.maxChallenges)
	}

	const recorder = createRecorder()
	const chair = createChair()
	join(recorder)
	join(chair)
	join(createCritic())
	for (const s of SHARKS) join(createShark(s))
	join(createWriter())
	for (const lens of LENSES) join(createScout(lens))

	trace.log("room.opened", "Chair", {
		mode: opts.mode,
		model: opts.model,
		writerModel: opts.writerModel,
		challenges: challengeIds.length,
		researchers: ds.researchers.size,
		publications: ds.publications.size,
		problem: opts.problem,
		sector: opts.sector,
		agents: state.getParticipants().map((p) => p.getManifest().name),
	})
	emit("room.opened", chair.getId(), { challengeIds, problem: opts.problem })

	const timeout = new Promise<"timeout">((r) => setTimeout(() => r("timeout"), opts.timeoutMs).unref())
	const result = await Promise.race([state.closedPromise.then(() => "closed" as const), timeout])
	if (result === "timeout") {
		trace.log("room.timeout", "Chair", { inFlight: state.inFlight, scoutsDone: [...state.scoutsDone] })
		state.markClosed()
	}
	return state
}
