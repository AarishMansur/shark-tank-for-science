import { sanitizeDashes } from "../data/text"
import type { PitchRoomState } from "../room/state"

// One self-contained HTML file: a playback of the run with agent lanes (who was
// thinking when) and the board, where pairs move from pitched to proposed or killed.
export function renderHtml(st: PitchRoomState, files: Map<string, string>): string {
	const ds = st.dataset
	const cards = [...st.board.values()].map((c) => ({
		id: c.pairId,
		researcher: `${ds.researchers.get(c.pitch.researcherId)?.name} [${c.pitch.researcherId}]`,
		faculty: ds.faculty.get(c.pitch.researcherId),
		company: `${ds.challenges.get(c.pitch.challengeId)?.company.name} [${c.pitch.challengeId}]`,
		challenge: ds.challenges.get(c.pitch.challengeId)?.challenge.text.slice(0, 220),
		scout: c.pitch.scout,
		seconded: c.pitch.secondedBy,
		headline: c.pitch.headline,
		history: c.history,
		verdicts: Object.values(c.verdicts).map((v) => ({ shark: v.shark, verdict: v.verdict, confidence: v.confidence, question: v.question })),
		file: files.get(c.pairId) ?? null,
		wildcard: !!c.wildcard,
	}))
	const lanes: Record<string, { start: number; end: number; task: string }[]> = {}
	const open = new Map<string, { agent: string; start: number; task: string }>()
	for (const l of st.trace.lines) {
		const d = l.data as any
		if (l.type === "bus.inference.started") open.set(d.loopId, { agent: l.agent, start: l.ms, task: d.task ?? "" })
		if (l.type === "bus.inference.completed") {
			const o = open.get(d.loopId)
			if (o) (lanes[o.agent] ??= []).push({ start: o.start, end: l.ms, task: o.task })
		}
	}
	const kills = st.trace.lines.filter((l) => l.type === "critic.kill").map((l) => ({ ms: l.ms, pair: l.pairId, ...(l.data as any) }))
	const feed = st.trace.lines
		.filter((l) => ["pair.status", "critic.kill", "shark.verdict", "scout.shortlist", "room.opened", "room.closed", "pair.seconded"].includes(l.type))
		.map((l) => ({ ms: l.ms, type: l.type, agent: l.agent, pair: l.pairId ?? "", text: feedText(l.type, l.data) }))
	const data = { mode: st.config.mode, model: st.config.model, problem: st.config.problem ?? null, total: st.trace.elapsed(), cards, lanes, kills, feed, usage: Object.fromEntries(st.usage) }
	return sanitizeDashes(TEMPLATE.replace("__DATA__", JSON.stringify(data).replace(/</g, "\\u003c")))
}

function feedText(type: string, d: any): string {
	switch (type) {
		case "pair.status":
			return `${d.status}: ${d.note}`
		case "critic.kill":
			return `killed ${d.by}'s claim "${String(d.text).slice(0, 140)}": ${d.reason}`
		case "shark.verdict":
			return `${d.verdict} ${d.confidence}/10. ${d.question}`
		case "scout.shortlist":
			return `shortlisted ${d.candidates.length} candidates with the ${d.lens} lens`
		case "room.opened":
			return `room opened in ${d.mode} mode: ${d.challenges} challenges, ${d.researchers} researchers, ${d.publications} publications`
		case "room.closed":
			return `room closed with ${d.proposals} proposals`
		case "pair.seconded":
			return `seconded by ${d.scout}`
		default:
			return ""
	}
}

const TEMPLATE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Shark Tank for Science: pitch room</title>
<style>
:root{--bg:#0d1117;--panel:#161b22;--line:#30363d;--fg:#e6edf3;--mut:#8b949e;--ok:#3fb950;--bad:#f85149;--warn:#d29922;--acc:#58a6ff;--wr:#bc8cff}
*{box-sizing:border-box}body{margin:0;font:14px/1.45 system-ui,-apple-system,Segoe UI,sans-serif;background:var(--bg);color:var(--fg)}
header{padding:16px 22px;border-bottom:1px solid var(--line);display:flex;gap:18px;align-items:center;flex-wrap:wrap}
h1{font-size:19px;margin:0}.pill{border:1px solid var(--line);border-radius:999px;padding:2px 10px;color:var(--mut);font-size:12px}
.ctrl{display:flex;gap:10px;align-items:center;padding:10px 22px;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--bg);z-index:3}
button{background:var(--panel);color:var(--fg);border:1px solid var(--line);border-radius:6px;padding:5px 12px;cursor:pointer}
input[type=range]{flex:1}#clock{font-variant-numeric:tabular-nums;color:var(--mut);min-width:90px}
section{padding:12px 22px}h2{font-size:14px;color:var(--mut);text-transform:uppercase;letter-spacing:.06em;margin:6px 0 10px}
.lane{display:flex;align-items:center;gap:10px;margin:3px 0}.lane b{width:130px;font-weight:500;font-size:12px;color:var(--mut)}
.track{position:relative;flex:1;height:16px;background:var(--panel);border-radius:4px}
.bar{position:absolute;top:2px;height:12px;border-radius:3px;opacity:.35;background:var(--acc)}.bar.on{opacity:1}
.playhead{position:absolute;top:-3px;bottom:-3px;width:2px;background:var(--warn)}
.board{display:grid;grid-template-columns:repeat(6,minmax(170px,1fr));gap:10px}
.col{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:8px;min-height:120px}
.col h3{margin:0 0 8px;font-size:12px;color:var(--mut);display:flex;justify-content:space-between}
.card{border:1px solid var(--line);border-left:4px solid var(--acc);border-radius:6px;padding:7px 8px;margin-bottom:7px;background:#0d1117;font-size:12px;cursor:pointer;transition:all .3s}
.card.killed{border-left-color:var(--bad);opacity:.75}.card.proposed{border-left-color:var(--ok)}.card.writing,.card.survived{border-left-color:var(--wr)}.card.cleared,.card.grilled{border-left-color:var(--warn)}
.card .t{font-weight:600;margin-bottom:3px}.card .m{color:var(--mut)}.flash{animation:fl 1s}@keyframes fl{0%{background:#4b1b1b}100%{background:#0d1117}}
#feed{max-height:300px;overflow:auto;font:12px/1.5 ui-monospace,Menlo,monospace;background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:8px}
#feed div{opacity:.35}#feed div.on{opacity:1}#feed .k{color:var(--bad)}#feed .s{color:var(--acc)}
#detail{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:12px;display:none}
table{border-collapse:collapse;font-size:12px}td,th{border-bottom:1px solid var(--line);padding:4px 10px;text-align:left}
a{color:var(--acc)}
</style></head><body>
<header><h1>Shark Tank for Science</h1><span class="pill" id="mode"></span><span class="pill" id="stats"></span></header>
<div class="ctrl"><button id="play">Play</button><button id="end">Jump to end</button><input id="t" type="range" min="0" value="0"><span id="clock"></span></div>
<section><h2>Agents thinking (each bar is one model call; overlapping bars ran at the same time)</h2><div id="lanes"></div></section>
<section><h2>The board</h2><div class="board" id="board"></div></section>
<section id="detail"></section>
<section><h2>Room log</h2><div id="feed"></div></section>
<section><h2>Tokens per agent</h2><table id="usage"></table></section>
<script>
const D=__DATA__;
const COLS=[["pitched","Pitched",["pitched","returned"]],["critic","Cleared by critic",["cleared"]],["grill","Grilled",["grilled"]],["writing","Survived, writing",["survived","writing","wildcard"]],["proposed","Proposal",["proposed"]],["killed","Killed",["killed"]]];
const t=document.getElementById("t");t.max=D.total;const fmt=ms=>(ms/1000).toFixed(1)+" s";
document.getElementById("mode").textContent=D.mode+" mode, "+D.model+(D.problem?" | reverse search":"");
document.getElementById("stats").textContent=D.cards.length+" pairs, "+D.cards.filter(c=>c.file).length+" proposals, "+D.kills.length+" claims killed";
const lanes=document.getElementById("lanes");
for(const [agent,bars] of Object.entries(D.lanes)){const l=document.createElement("div");l.className="lane";l.innerHTML="<b>"+agent+"</b><div class=track></div>";const tr=l.querySelector(".track");
for(const b of bars){const e=document.createElement("div");e.className="bar";e.dataset.s=b.start;e.dataset.e=b.end;e.title=b.task+" ("+fmt(b.end-b.start)+")";e.style.left=(b.start/D.total*100)+"%";e.style.width=Math.max(.3,(b.end-b.start)/D.total*100)+"%";tr.appendChild(e)}
const c=document.createElement("div");c.className="playhead";tr.appendChild(c);lanes.appendChild(l)}
const board=document.getElementById("board");const colEls={};
for(const [k,label] of COLS){const c=document.createElement("div");c.className="col";c.innerHTML="<h3><span>"+label+"</span><span class=n></span></h3>";board.appendChild(c);colEls[k]=c}
const feed=document.getElementById("feed");
for(const f of D.feed){const d=document.createElement("div");d.dataset.ms=f.ms;d.className=f.type==="critic.kill"?"k":f.type==="shark.verdict"?"s":"";d.textContent="["+fmt(f.ms)+"] "+f.agent+(f.pair?" @ "+f.pair:"")+": "+f.text;feed.appendChild(d)}
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let last={};
function statusAt(c,ms){let s=null;for(const h of c.history){if(h.at<=ms)s=h.status}return s}
function render(ms){document.getElementById("clock").textContent=fmt(ms)+" / "+fmt(D.total);
document.querySelectorAll(".playhead").forEach(c=>c.style.left=(ms/D.total*100)+"%");
document.querySelectorAll(".bar").forEach(b=>b.classList.toggle("on",+b.dataset.s<=ms&&+b.dataset.e>=ms));
for(const [k] of COLS){colEls[k].querySelectorAll(".card").forEach(e=>e.remove())}
const counts={};
for(const c of D.cards){const s=statusAt(c,ms);if(!s)continue;const col=COLS.find(x=>x[2].includes(s));if(!col)continue;counts[col[0]]=(counts[col[0]]||0)+1;
const e=document.createElement("div");e.className="card "+s+(last[c.id]&&last[c.id]!==s&&s==="killed"?" flash":"");
e.innerHTML="<div class=t>"+esc(c.researcher)+"</div><div>x "+esc(c.company)+"</div><div class=m>"+esc(c.scout)+(c.seconded.length?" +"+c.seconded.length:"")+(c.wildcard?" | wildcard":"")+"</div>";
e.onclick=()=>detail(c);colEls[col[0]].appendChild(e);last[c.id]=s}
for(const [k] of COLS)colEls[k].querySelector(".n").textContent=counts[k]||0;
feed.querySelectorAll("div").forEach(d=>d.classList.toggle("on",+d.dataset.ms<=ms))}
function detail(c){const el=document.getElementById("detail");el.style.display="block";
el.innerHTML="<h2>"+esc(c.id)+"</h2><p><b>"+esc(c.headline)+"</b></p><p>"+esc(c.researcher)+", "+esc(c.faculty)+"<br>"+esc(c.company)+": "+esc(c.challenge)+"</p>"+
c.verdicts.map(v=>"<p><b>"+esc(v.shark)+"</b> "+esc(v.verdict)+" "+v.confidence+"/10: <i>"+esc(v.question)+"</i></p>").join("")+
"<ul>"+c.history.map(h=>"<li>"+fmt(h.at)+" "+esc(h.status)+": "+esc(h.note)+"</li>").join("")+"</ul>"+
D.kills.filter(k=>k.pair===c.id).map(k=>"<p style='color:var(--bad)'>Critic killed ("+esc(k.layer)+"): "+esc(k.text)+" ["+esc(k.sources.join(", "))+"]: "+esc(k.reason)+"</p>").join("")+
(c.file?"<p><a href='proposals/"+esc(c.file)+"'>Open the proposal</a></p>":"");el.scrollIntoView({behavior:"smooth"})}
const u=document.getElementById("usage");u.innerHTML="<tr><th>Agent</th><th>Calls</th><th>Input tokens</th><th>Output tokens</th></tr>"+Object.entries(D.usage).map(([a,x])=>"<tr><td>"+esc(a)+"</td><td>"+x.calls+"</td><td>"+x.inputTokens+"</td><td>"+x.outputTokens+"</td></tr>").join("");
t.oninput=()=>render(+t.value);let timer=null;
document.getElementById("play").onclick=function(){if(timer){clearInterval(timer);timer=null;this.textContent="Play";return}this.textContent="Pause";if(+t.value>=D.total)t.value=0;const step=D.total/600;timer=setInterval(()=>{t.value=Math.min(D.total,+t.value+step);render(+t.value);if(+t.value>=D.total){clearInterval(timer);timer=null;document.getElementById("play").textContent="Play"}},33)};
document.getElementById("end").onclick=()=>{t.value=D.total;render(D.total)};
t.value=D.total;render(D.total);
</script></body></html>`
