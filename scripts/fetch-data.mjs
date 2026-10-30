// Downloads the EINSTEIN synthetic dataset into ./data (about 28 MB).
// Source: https://github.com/jigjoy-ai/einstein-matchmaker-data
import { mkdirSync, existsSync, writeFileSync, statSync } from "node:fs"

const BASE = "https://raw.githubusercontent.com/jigjoy-ai/einstein-matchmaker-data/main/data/"
const FILES = ["researchers.json", "companies.json", "publications.jsonl", "projects.json", "patents.json"]

mkdirSync("data", { recursive: true })
for (const file of FILES) {
	const target = `data/${file}`
	if (existsSync(target) && statSync(target).size > 0 && !process.argv.includes("--force")) {
		console.log(`ok    ${target} (already there)`)
		continue
	}
	process.stdout.write(`fetch ${file} ... `)
	const res = await fetch(BASE + file)
	if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`)
	const buf = Buffer.from(await res.arrayBuffer())
	writeFileSync(target, buf)
	console.log(`${(buf.length / 1e6).toFixed(1)} MB`)
}
console.log("Dataset ready in ./data")
