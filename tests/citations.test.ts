import assert from "node:assert/strict"
import { test } from "node:test"
import { Dataset } from "../src/data/dataset"
import { checkClaimRules, idsIn, lexicalSupport } from "../src/room/citations"

const ds = Dataset.load("tests/fixtures/data")
const r = [...ds.researchers.values()].find((x) => x.publications.length > 0)!
const other = [...ds.researchers.values()].find((x) => x.id !== r.id && x.publications.length > 0)!
const ref = [...ds.challenges.values()][0]
const pair = { researcherId: r.id, companyId: ref.company.id, challengeId: ref.challenge.id }
const ownPub = r.publications.find((id) => ds.sources.has(id))!
const foreignPub = other.publications.find((id) => ds.sources.has(id) && !ds.sources.get(id)!.owners.includes(r.id))!

test("idsIn finds every dataset id format", () => {
	assert.deepEqual(idsIn("R0001 with C001-CH2, C001, SYN-PUB-00001, SYN-PRJ-0001, SYN-PAT-001 and Q-1").sort(), ["C001", "C001-CH2", "Q-1", "R0001", "SYN-PAT-001", "SYN-PRJ-0001", "SYN-PUB-00001"].sort())
})

test("a claim with no source is killed", () => {
	const res = checkClaimRules(ds, { text: `${r.name} is great`, sourceIds: [] }, pair)
	assert.equal(res.ok, false)
})

test("a claim citing a record that does not exist is killed", () => {
	const res = checkClaimRules(ds, { text: "made up", sourceIds: ["SYN-PUB-99999"] }, pair)
	assert.equal(res.ok, false)
	assert.match((res as any).reason, /does not exist/)
})

test("a claim citing someone else's paper is killed", () => {
	const res = checkClaimRules(ds, { text: `${r.name} wrote this`, sourceIds: [foreignPub] }, pair)
	assert.equal(res.ok, false)
	assert.match((res as any).reason, /belongs to/)
})

test("a claim citing the researcher's own paper and the challenge passes the rules", () => {
	assert.deepEqual(checkClaimRules(ds, { text: "relevant work", sourceIds: [ownPub, ref.challenge.id] }, pair), { ok: true })
})

test("an id smuggled into the claim text is checked too", () => {
	const res = checkClaimRules(ds, { text: `see also ${foreignPub}`, sourceIds: [ownPub] }, pair)
	assert.equal(res.ok, false)
})

test("a quote that is not in the cited record is killed, a real one passes", () => {
	const real = ref.challenge.text.split(/\s+/).slice(0, 6).join(" ")
	assert.equal(checkClaimRules(ds, { text: `The company says "${real}"`, sourceIds: [ref.challenge.id] }, pair).ok, true)
	assert.equal(checkClaimRules(ds, { text: `The company says "we urgently need quantum blockchain drones"`, sourceIds: [ref.challenge.id] }, pair).ok, false)
})

test("lexical support is high for a paraphrase of the source and low for an invention", () => {
	const words = ref.challenge.text.split(/\s+/).slice(0, 12).join(" ")
	assert.ok(lexicalSupport(ds, { text: words, sourceIds: [ref.challenge.id] }) > 0.6)
	assert.ok(lexicalSupport(ds, { text: "quantum blockchain drones for celebrity marketing", sourceIds: [ref.challenge.id] }) < 0.3)
})

test("reverse search problems become a citable source owned by the user", () => {
	const d2 = Dataset.load("tests/fixtures/data")
	d2.addUserProblem("Q-1", "We need to predict wheat moisture before milling")
	assert.ok(d2.sources.get("Q-1"))
	assert.equal(checkClaimRules(d2, { text: "the company needs moisture prediction", sourceIds: ["Q-1"] }, { researcherId: r.id, companyId: "USER", challengeId: "Q-1" }).ok, true)
})
