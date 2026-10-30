// Text normalisation shared by search and the citation checker.
// The dataset mixes English with Serbian in Latin and Cyrillic script, so
// everything is folded to plain lowercase Latin before tokenising.

const CYRILLIC: Record<string, string> = {
	а: "a", б: "b", в: "v", г: "g", д: "d", ђ: "dj", е: "e", ж: "z", з: "z", и: "i",
	ј: "j", к: "k", л: "l", љ: "lj", м: "m", н: "n", њ: "nj", о: "o", п: "p", р: "r",
	с: "s", т: "t", ћ: "c", у: "u", ф: "f", х: "h", ц: "c", ч: "c", џ: "dz", ш: "s",
}

const LATIN_EXTRA: Record<string, string> = { đ: "dj", ß: "ss", æ: "ae", ø: "o", ł: "l" }

export function fold(text: string): string {
	let out = ""
	for (const ch of text.toLowerCase()) {
		out += CYRILLIC[ch] ?? LATIN_EXTRA[ch] ?? ch
	}
	return out.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

const STOP = new Set(
	(
		"a an and are as at be been but by can could do does for from had has have how i if in into is it its " +
		"just more most no not of on or our over so such than that the their them then there these they this " +
		"to too under up us very was we were what when where which while who why will with within without would " +
		"you your also any all each other only one two three use used using based new need needs want make " +
		"i u na za od do se je su sa da ili kao koji koja koje nije"
	).split(/\s+/),
)

export function tokenize(text: string): string[] {
	const folded = fold(text)
	const raw = folded.match(/[a-z0-9]+/g) ?? []
	return raw.filter((t) => t.length > 1 && !STOP.has(t)).map(stem)
}

// A very small suffix stripper. Enough to make "networks" meet "network"
// and "detection" meet "detecting" without pulling in a stemming library.
export function stem(token: string): string {
	if (token.length <= 4) return token
	for (const suffix of ["ations", "ation", "ings", "ing", "ies", "ed", "es", "s"]) {
		if (token.endsWith(suffix) && token.length - suffix.length >= 4) {
			return suffix === "ies" ? token.slice(0, -3) + "y" : token.slice(0, -suffix.length)
		}
	}
	return token
}

export function sanitizeDashes(text: string): string {
	return text.replace(/\s*\u2014\s*/g, ", ").replace(/\u2013/g, "-")
}
