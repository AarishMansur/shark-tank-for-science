import { tokenize } from "./text"

export type Hit = { id: string; score: number }

// Plain Okapi BM25. Used so that only short, relevant shortlists ever reach a model.
export class BM25 {
	private readonly docs: { id: string; tf: Map<string, number>; len: number }[] = []
	private readonly df = new Map<string, number>()
	private avgLen = 0

	constructor(
		entries: { id: string; text: string }[],
		private readonly k1 = 1.4,
		private readonly b = 0.75,
	) {
		let total = 0
		for (const { id, text } of entries) {
			const tokens = tokenize(text)
			const tf = new Map<string, number>()
			for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1)
			for (const t of tf.keys()) this.df.set(t, (this.df.get(t) ?? 0) + 1)
			this.docs.push({ id, tf, len: tokens.length })
			total += tokens.length
		}
		this.avgLen = this.docs.length ? total / this.docs.length : 0
	}

	size(): number {
		return this.docs.length
	}

	idf(term: string): number {
		const n = this.docs.length
		const df = this.df.get(term) ?? 0
		return Math.log(1 + (n - df + 0.5) / (df + 0.5))
	}

	search(query: string, limit = 10, filter?: (id: string) => boolean): Hit[] {
		const terms = [...new Set(tokenize(query))]
		if (!terms.length) return []
		const idf = new Map(terms.map((t) => [t, this.idf(t)]))
		const hits: Hit[] = []
		for (const doc of this.docs) {
			if (filter && !filter(doc.id)) continue
			let score = 0
			for (const t of terms) {
				const f = doc.tf.get(t)
				if (!f) continue
				const norm = f + this.k1 * (1 - this.b + (this.b * doc.len) / (this.avgLen || 1))
				score += idf.get(t)! * ((f * (this.k1 + 1)) / norm)
			}
			if (score > 0) hits.push({ id: doc.id, score })
		}
		hits.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
		return hits.slice(0, limit)
	}
}
