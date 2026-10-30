import assert from "node:assert/strict"
import { test } from "node:test"
import { decide, pairScore } from "../src/agents/chair"
import type { Objection, PairCard, SharkVerdict } from "../src/room/types"

const obj = (severity: Objection["severity"], status: Objection["status"]): Objection => ({ id: "o", text: "x", sourceIds: ["C001"], by: "s", status, severity })
const v = (shark: string, verdict: "invest" | "pass", confidence: number, objections: Objection[] = []): SharkVerdict => ({ shark, verdict, confidence, strengths: [], objections, question: "?" })
const card = (...vs: SharkVerdict[]) => ({ pairId: "R0001xC001-CH1", verdicts: Object.fromEntries(vs.map((x) => [x.shark, x])) }) as unknown as PairCard

test("both sharks invest: the pair survives", () => {
	assert.equal(decide(card(v("CTO Shark", "invest", 6), v("Professor Shark", "invest", 5))).survive, true)
})

test("a supported dealbreaker kills the pair even if both invest", () => {
	const d = decide(card(v("CTO Shark", "invest", 9), v("Professor Shark", "invest", 8, [obj("dealbreaker", "supported")])))
	assert.equal(d.survive, false)
	assert.equal(d.by, "Professor Shark")
})

test("a dealbreaker the critic killed does not count", () => {
	assert.equal(decide(card(v("CTO Shark", "invest", 9), v("Professor Shark", "invest", 8, [obj("dealbreaker", "killed")]))).survive, true)
})

test("a split decision survives only with a confident investor", () => {
	assert.equal(decide(card(v("CTO Shark", "invest", 8), v("Professor Shark", "pass", 6))).survive, true)
	assert.equal(decide(card(v("CTO Shark", "invest", 6), v("Professor Shark", "pass", 6))).survive, false)
})

test("both pass: the pair is out", () => {
	const d = decide(card(v("CTO Shark", "pass", 7), v("Professor Shark", "pass", 7)))
	assert.equal(d.survive, false)
	assert.match(d.reason, /both sharks pass/)
})

test("pair score orders wildcards by investor confidence", () => {
	assert.ok(pairScore(card(v("a", "invest", 6), v("b", "pass", 4))) > pairScore(card(v("a", "invest", 5), v("b", "pass", 6))))
})
