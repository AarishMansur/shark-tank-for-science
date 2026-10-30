import { fold } from "./text"

// The dataset spells the same faculty in English, Serbian Latin and Serbian Cyrillic.
// Fold every spelling to one English name so "same faculty" checks work.
const CANON: [RegExp, string][] = [
	[/tehnick.*nauk|technical sciences/, "Faculty of Technical Sciences"],
	[/prirodno|faculty of sciences/, "Faculty of Sciences"],
	[/mihajlo pupin/, "Technical Faculty Mihajlo Pupin Zrenjanin"],
	[/tehnolos|faculty of technology/, "Faculty of Technology"],
	[/poljoprivred|agricultur/, "Faculty of Agriculture"],
	[/medicin/, "Faculty of Medicine"],
	[/filozof|philosoph/, "Faculty of Philosophy"],
	[/biosen/, "BioSense Institute"],
	[/ekonomsk|economics/, "Faculty of Economics in Subotica"],
	[/gradjevinsk|civil engineering/, "Faculty of Civil Engineering Subotica"],
	[/prehramben|fins|food technology/, "Institute of Food Technology (FINS)"],
	[/pravni|faculty of law/, "Faculty of Law"],
	[/academy of arts|akademija/, "Academy of Arts"],
	[/sport/, "Faculty of Sport and Physical Education"],
	[/sombor|education/, "Faculty of Education in Sombor"],
	[/hungarian/, "Hungarian Language Teacher Training Faculty Subotica"],
]

export function canonicalFaculty(name: string): string {
	const f = fold(name)
	for (const [re, canon] of CANON) if (re.test(f)) return canon
	return name
}

// Signals in a profile that the person may not be available. They are shown to
// the sharks and in proposals as caveats; nobody is silently dropped or scored.
export function availabilityFlags(r: { title: string; notes: string; bio: string; industry_experience: string }): string[] {
	const text = fold(`${r.title} ${r.notes} ${r.bio}`)
	const flags: string[] = []
	if (/emerit|retired|penzion/.test(text)) flags.push("may be retired or emeritus")
	if (/left the university|no longer at|moved to|napustio|napustila/.test(text)) flags.push("may have left the university")
	if (/not available to supervise|capacity .*limited|limited capacity|ogranicen/.test(text)) flags.push("limited capacity noted in profile")
	if (/sabbatical|sabatic/.test(text) && !/no (planned )?sabbatical|nema sabati/.test(text)) flags.push("sabbatical mentioned")
	return flags
}
