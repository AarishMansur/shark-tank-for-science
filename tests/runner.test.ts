import assert from "node:assert/strict"
import { test } from "node:test"
import { ModelMessageItem } from "@mozaik-ai/core"
import { PitchRoomRunner } from "../src/llm/runner"
import type { Recording } from "../src/llm/recording"
import { retryDelayMs, isRetryable, Throttle } from "../src/llm/throttle"
import { Trace } from "../src/room/trace"

const trace = new Trace()
const fakeState = (mode: string) => () => ({ config: { mode }, tasks: new Map([["Critic:check:R1xC1-CH1", { agent: "Critic", mock: () => ({ ok: 1 }) }]]), trace }) as any
const recording: Recording = {
	recordedAt: "",
	model: "m",
	writerModel: "w",
	args: [],
	note: "",
	calls: { "Critic:check:R1xC1-CH1": { agent: "Critic", model: "m", text: '{"checks":[]}', inputTokens: 10, outputTokens: 5, reasoningTokens: 0, latencyMs: 1 } },
}
const input = (id: string) => ({ model: "gemini-3.5-flash-lite", context: { id } }) as any
const textOf = (out: any) => (out.items[0] as ModelMessageItem).content.text

test("replay answers by task id with the recorded text and tokens", async () => {
	const r = new PitchRoomRunner(fakeState("replay"), recording, { maxConcurrent: 2, rpm: 1000, replaySpeed: 0 })
	const out = await r.run(input("Critic:check:R1xC1-CH1"))
	assert.equal(textOf(out), '{"checks":[]}')
	assert.equal(out.tokenUsage?.inputTokens, 10)
})

test("replay of an unknown task returns an error answer instead of throwing", async () => {
	const r = new PitchRoomRunner(fakeState("replay"), recording, { maxConcurrent: 2, rpm: 1000, replaySpeed: 0 })
	const out = await r.run(input("Writer:write-v1:nope"))
	assert.match(JSON.parse(textOf(out)).__error, /no recorded answer/)
	assert.ok(trace.lines.some((l) => l.type === "replay.missing"))
})

test("mock mode answers from the task's mock function", async () => {
	const r = new PitchRoomRunner(fakeState("mock"), recording, { maxConcurrent: 2, rpm: 1000, replaySpeed: 0 })
	assert.deepEqual(JSON.parse(textOf(await r.run(input("Critic:check:R1xC1-CH1")))), { ok: 1 })
})

test("retry helpers read Gemini's retry hint and know what is worth retrying", () => {
	const err = new Error('{"error":{"code":429,"details":[{"retryDelay":"17s"}]}}')
	assert.ok(isRetryable(err))
	assert.ok(retryDelayMs(err, 0) >= 17_000)
	assert.equal(isRetryable(new Error('{"error":{"code":400,"message":"bad request"}}')), false)
})

test("throttle never lets more than maxConcurrent calls in", async () => {
	const t = new Throttle(2, 10_000)
	let now = 0
	let peak = 0
	await Promise.all(
		Array.from({ length: 6 }, async () => {
			await t.acquire()
			peak = Math.max(peak, ++now)
			await new Promise((r) => setTimeout(r, 10))
			now--
			t.release()
		}),
	)
	assert.equal(peak, 2)
})
