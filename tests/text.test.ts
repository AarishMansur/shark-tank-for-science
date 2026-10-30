import assert from "node:assert/strict"
import { test } from "node:test"
import { BM25 } from "../src/data/bm25"
import { canonicalFaculty } from "../src/data/faculty"
import { fold, sanitizeDashes, tokenize } from "../src/data/text"

test("fold maps Serbian Cyrillic and Latin diacritics to plain Latin", () => {
	assert.equal(fold("Ђорђевић"), "djordjevic")
	assert.equal(fold("Đorđević"), "djordjevic")
	assert.equal(fold("Факултет техничких наука"), "fakultet tehnickih nauka")
	assert.equal(fold("Šećer Čačak Žabalj"), "secer cacak zabalj")
})

test("tokenize drops stopwords and stems plurals", () => {
	const t = tokenize("The forecasting of loads and the forecasts")
	assert.ok(!t.includes("the"))
	assert.ok(t.includes("forecast"))
})

test("both scripts of a faculty name land on the same canonical name", () => {
	assert.equal(canonicalFaculty("Faculty of Technical Sciences"), canonicalFaculty("Факултет техничких наука"))
})

test("sanitizeDashes removes em dashes", () => {
	assert.equal(sanitizeDashes("a \u2014 b"), "a, b")
	assert.ok(!sanitizeDashes("x\u2014y").includes("\u2014"))
})

test("BM25 ranks the on-topic document first and honours the filter", () => {
	const idx = new BM25([
		{ id: "a", text: "solar photovoltaic forecasting for distribution feeders" },
		{ id: "b", text: "wheat milling quality and flour moisture" },
		{ id: "c", text: "photovoltaic inverter firmware" },
	])
	const hits = idx.search("photovoltaic forecasting", 3)
	assert.equal(hits[0].id, "a")
	assert.ok(!hits.some((h) => h.id === "b"))
	assert.deepEqual(idx.search("photovoltaic", 3, (id) => id !== "a").map((h) => h.id), ["c"])
})

test("BM25 understands Cyrillic queries against Latin text", () => {
	const idx = new BM25([{ id: "x", text: "Novi Sad navodnjavanje" }, { id: "y", text: "Beograd" }])
	assert.equal(idx.search("Нови Сад", 1)[0].id, "x")
})
