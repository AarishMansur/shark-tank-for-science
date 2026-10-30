// Cuts a small slice of the EINSTEIN dataset for the offline end to end test.
// Usage: node scripts/make-fixture.mjs [dataDir] [outDir]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"

const src = process.argv[2] ?? "data"
const out = process.argv[3] ?? "tests/fixtures/data"
mkdirSync(out, { recursive: true })
const read = (f) => JSON.parse(readFileSync(join(src, f), "utf8"))

const R = read("researchers.json")
const C = read("companies.json")
const companies = C.companies.slice(0, 14)
const researchers = R.researchers.filter((_, i) => i % 25 === 0).slice(0, 42)
const keep = new Set(researchers.flatMap((r) => [...r.publications.slice(-8), ...r.projects, ...r.patents]))
const pubs = readFileSync(join(src, "publications.jsonl"), "utf8")
	.split("\n")
	.filter(Boolean)
	.map((l) => JSON.parse(l))
	.filter((p) => keep.has(p.id))
const trim = (file, key) => {
	const all = read(file)
	return { ...all, [key]: all[key].filter((x) => keep.has(x.id)) }
}
writeFileSync(join(out, "researchers.json"), JSON.stringify({ ...R, researchers }))
writeFileSync(join(out, "companies.json"), JSON.stringify({ ...C, companies }))
writeFileSync(join(out, "publications.jsonl"), pubs.map((p) => JSON.stringify(p)).join("\n") + "\n")
writeFileSync(join(out, "projects.json"), JSON.stringify(trim("projects.json", "projects")))
writeFileSync(join(out, "patents.json"), JSON.stringify(trim("patents.json", "patents")))
console.log(`${researchers.length} researchers, ${companies.length} companies, ${pubs.length} publications -> ${out}`)
