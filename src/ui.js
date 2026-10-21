// ===== UI: renders the scene, the boards and the extra modes. =====
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const narrow = () => matchMedia("(max-width: 960px)").matches;
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const KEY = "smod-game-v1", PKEY = "smod-prefs-v1";

let S = null, mode = "title", quiz = null, blitz = null, lastKey = "", menuConfirm = false;
let prefs = { sound: false, seen: {}, blitzBest: 0 };
try { const p = JSON.parse(localStorage.getItem(PKEY)); if (p) prefs = Object.assign(prefs, p); } catch (e) {}
const savePrefs = () => { try { localStorage.setItem(PKEY, JSON.stringify(prefs)); } catch (e) {} };
const saveGame = () => { try { if (S && !watch.on) localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
function loadGame() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 2 && s.items) return s; } catch (e) {} return null; }

// ---------- People ----------
const ROLE = { jonas: "Product Owner", priya: "Developer", tom: "Developer", lea: "Developer", you: "Scrum Master", maya: "Shop manager", hans: "Head of department" };
const LOOK = {
  jonas: { skin: "#e2ae84", hair: "#3b2a20", style: "short", beard: true, shirt: "var(--c-po)", mouth: "#f6dcc8" },
  priya: { skin: "#b97a52", hair: "#1f1612", style: "long", shirt: "var(--c-dev1)" },
  tom: { skin: "#f1c8a5", hair: "#c0602b", style: "curly", shirt: "var(--c-dev2)" },
  lea: { skin: "#f3d0b2", hair: "#d4a03a", style: "bun", shirt: "var(--c-dev3)" },
  you: { skin: "#c98e62", hair: "#2b2b2b", style: "cap", shirt: "var(--c-you)" },
  maya: { skin: "#8d5a3b", hair: "#2a1a14", style: "afro", shirt: "var(--c-stake)" },
  hans: { skin: "#efc7a8", hair: "#b9b9b9", style: "bald", glasses: true, tie: true, shirt: "var(--c-mgr)" }
};
let faceN = 0;
function face(id, mood) {
  const L = LOOK[id]; const k = "f" + (++faceN);
  const hair = (d, extra) => `<path d="${d}" fill="${L.hair}" ${extra || ""}/>`;
  let back = "", front = "";
  switch (L.style) {
    case "short": front = hair("M11.8 15.5C11.5 9 15 7.6 20 7.6S28.5 9 28.2 15.5C26.5 12 23.5 11.2 20 11.2S13.5 12 11.8 15.5Z"); break;
    case "long": back = hair("M10.8 17C10 8 14.5 6.8 20 6.8S30 8 29.2 17L30.5 30C27 29 25.5 27 25.5 24H14.5C14.5 27 13 29 9.5 30Z"); front = hair("M11.6 15.8C12 9.5 15.5 8.3 20 8.3S28 9.5 28.4 15.8C25 12.2 21 11.5 17.5 12.3 15 12.8 13 14 11.6 15.8Z"); break;
    case "curly": front = [[12.8, 12.5, 3.3], [16.2, 9.6, 3.5], [20.5, 8.6, 3.6], [24.6, 9.8, 3.4], [27.6, 13, 3.1], [12, 16, 2.4], [28.3, 16.4, 2.3]].map(c => `<circle cx="${c[0]}" cy="${c[1]}" r="${c[2]}" fill="${L.hair}"/>`).join(""); break;
    case "bun": back = `<circle cx="20" cy="6.4" r="3.9" fill="${L.hair}"/>`; front = hair("M11.8 16C11.6 10 15 8.4 20 8.4S28.4 10 28.2 16C27 12.6 24 11 20 11S13 12.6 11.8 16Z"); break;
    case "cap": front = `<path d="M11.4 15C11.6 9.2 15.2 7.4 20 7.4S28.4 9.2 28.6 15Z" fill="#23415a"/><path d="M18 14.2L33.2 15.3C32.5 16.8 30 17 27 16.3Z" fill="#23415a"/>`; break;
    case "afro": back = `<circle cx="20" cy="14.2" r="11.6" fill="${L.hair}"/>`; break;
    case "bald": front = hair("M11.8 18.5C11 13.5 12 11.2 13.8 10.4L14.2 16.5Z") + hair("M28.2 18.5C29 13.5 28 11.2 26.2 10.4L25.8 16.5Z"); break;
  }
  const m = mood || "neutral", mc = L.mouth || "#5a2a1c";
  const mouth = m === "happy" ? `<path d="M16.6 21.1Q20 24.4 23.4 21.1" stroke="${mc}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`
    : m === "worried" ? `<path d="M16.9 23.2Q20 20.7 23.1 23.2" stroke="${mc}" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M15.2 14.6L18.2 15.4M24.8 14.6L21.8 15.4" stroke="#3a2a20" stroke-width="1" stroke-linecap="round"/>`
    : `<path d="M17.3 22.1H22.7" stroke="${mc}" stroke-width="1.5" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 40 40" role="img" aria-label="${esc(NAMES[id])}"><defs><clipPath id="${k}"><circle cx="20" cy="20" r="19.5"/></clipPath></defs><g clip-path="url(#${k})"><rect width="40" height="40" fill="var(--panel-2)"/>${back}<path d="M5 41C5 31 11 27.6 20 27.6S35 31 35 41Z" fill="${L.shirt}"/><rect x="17" y="22.5" width="6" height="6" fill="${L.skin}"/>${L.tie ? `<path d="M16.4 27.8L20 31.2 23.6 27.8Z" fill="#f2f2f2"/><path d="M19 30.4H21L21.8 36.5 20 38.4 18.2 36.5Z" fill="#7a1f1f"/>` : ""}${id === "you" ? `<path d="M16.2 28.2L20 34 23.8 28.2" stroke="#fff" stroke-width="1.1" fill="none"/><rect x="18.3" y="33.4" width="3.4" height="4.2" rx=".6" fill="#fff"/>` : ""}<ellipse cx="20" cy="17" rx="8.1" ry="8.9" fill="${L.skin}"/>${front}${L.beard ? hair("M12.6 18.5C13 24.8 16.5 26.2 20 26.2S27 24.8 27.4 18.5C26 22 23.5 22.8 20 22.8S14 22 12.6 18.5Z", 'opacity=".92"') : ""}<circle cx="16.9" cy="17.6" r="1.15" fill="#1b1b1b"/><circle cx="23.1" cy="17.6" r="1.15" fill="#1b1b1b"/>${L.glasses ? `<g fill="none" stroke="#2a2a2a" stroke-width="1"><circle cx="16.9" cy="17.6" r="2.7"/><circle cx="23.1" cy="17.6" r="2.7"/><path d="M19.6 17.6H20.4"/></g>` : ""}${mouth}</g></svg>`;
}
function moodOf(id) {
  if (!S) return "happy";
  if (S.phase === "fb" && S.mood && id !== "maya" && id !== "hans") return S.mood;
  if (id === "maya" || id === "hans") return "neutral";
  return S.trust >= 65 ? "happy" : S.trust >= 40 ? "neutral" : "worried";
}

// ---------- Icons ----------
const IC = {
  move: '<path d="M2 8h10M9 4.5L12.5 8 9 11.5" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  goal: '<circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="8" cy="8" r="2" fill="currentColor"/>',
  order: '<path d="M4 3v10M2 11l2 2 2-2M9 4h5M9 8h4M9 12h3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
  block: '<circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M4.2 11.8l7.6-7.6" stroke="currentColor" stroke-width="1.5"/>',
  unblock: '<path d="M3 8.5l3 3 7-7" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  plan: '<path d="M3 4h10M3 8h10M3 12h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  size: '<path d="M2 12L12 2l2 2L4 14z" stroke="currentColor" stroke-width="1.3" fill="none"/><path d="M5 9l1.5 1.5M7 7l1 1M9 5l1.5 1.5" stroke="currentColor" stroke-width="1.2"/>',
  dod: '<rect x="3" y="2.5" width="10" height="11" rx="1.5" stroke="currentColor" stroke-width="1.4" fill="none"/><path d="M5.5 6.5h5M5.5 9.5h3" stroke="currentColor" stroke-width="1.4"/>',
  imp: '<path d="M8 2v4M8 10v4M2 8h4M10 8h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  note: '<path d="M3 3h10v7l-3 3H3z" stroke="currentColor" stroke-width="1.4" fill="none"/>',
  live: '<path d="M8 2l1.8 4 4.2.4-3.2 2.8 1 4.3L8 11.2 4.2 13.5l1-4.3L2 6.4 6.2 6z" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linejoin="round"/>',
  pb: '<path d="M2 8h10M9 4.5L12.5 8 9 11.5" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  sb: '<path d="M2 8h10M9 4.5L12.5 8 9 11.5" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  inc: '<path d="M3 8.5l3 3 7-7" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  out: '<path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'
};
const ic = k => `<svg viewBox="0 0 16 16" aria-hidden="true">${IC[k] || IC.move}</svg>`;
const PLACES = {
  workshop: ["Workshop", '<rect x="2" y="6" width="14" height="5" rx="1" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M4 11v4M14 11v4" stroke="currentColor" stroke-width="1.6"/>'],
  team: ["Team room", '<rect x="2" y="3" width="14" height="9" rx="1" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M6 15h6M9 12v3" stroke="currentColor" stroke-width="1.6"/>'],
  shop: ["Shop floor", '<circle cx="5" cy="12" r="3.2" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="13" cy="12" r="3.2" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M5 12l3-6h4l1 6M8 6H6" stroke="currentColor" stroke-width="1.5" fill="none"/>'],
  lounge: ["Lounge", '<path d="M3 7h9v4a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M12 8h1.5a2 2 0 0 1 0 4H12" stroke="currentColor" stroke-width="1.6" fill="none"/>'],
  hans: ["Hans's office", '<rect x="3" y="2" width="12" height="14" rx="1" stroke="currentColor" stroke-width="1.6" fill="none"/><circle cx="12" cy="9" r="1" fill="currentColor"/>'],
  jonas: ["Jonas's desk", '<path d="M2 8h14M4 8v7M14 8v7" stroke="currentColor" stroke-width="1.6"/><rect x="6" y="3" width="6" height="5" rx=".5" stroke="currentColor" stroke-width="1.4" fill="none"/>']
};

// ---------- Sound ----------
let actx = null;
function beep(kind) {
  if (!prefs.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const seq = { good: [[660, .07], [880, .12]], bad: [[220, .16], [165, .2]], move: [[520, .04]], day: [[392, .05], [523, .06]], tick: [[880, .03]] }[kind] || [[440, .05]];
    let t = actx.currentTime;
    for (const [f, d] of seq) {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = kind === "bad" ? "sawtooth" : "triangle"; o.frequency.value = f;
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.12, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + d + .02); t += d * .9;
    }
  } catch (e) {}
}

// ---------- Header ----------
const DAYSHORT = ["M", "T", "W", "T", "F", "M", "T", "W", "T", "F"];
const DAYMARK = { 1: ["P", "Sprint Planning"], 6: ["Ref", "Product Backlog refinement (an ongoing activity, not an event)"], 10: ["R+R", "Sprint Review and Sprint Retrospective"] };
function renderHeader() {
  const live = S && mode !== "title";
  const sp = live && !S.done ? S.sp : -1;
  let cells = "";
  for (let d = 1; d <= 10; d++) {
    const cls = sp < 0 ? "" : d < S.day ? "past" : d === S.day ? "now" : "";
    const mk = DAYMARK[d];
    cells += `<div class="dcell ${cls}" title="Day ${d}, ${DAYNAMES[d - 1]}${mk ? ": " + mk[1] : ""}. Daily Scrum at 13:30.">${mk ? `<i>${mk[0]}</i>` : ""}<span>${DAYSHORT[d - 1]}<b>${d}</b></span></div>`;
  }
  $("strip").innerHTML = `<span class="sprintlbl">${sp < 0 ? (S && S.done ? "Campaign done" : "3 Sprints") : `Sprint ${sp + 1}<span class="hint"> of 3</span>`}</span><div class="days" aria-label="Sprint days">${cells}</div>`;
  const st = live && !S.done ? goalStatus(S) : "none";
  const stTxt = { none: S && S.goal ? "Being planned" : "Not set yet", track: "On track", risk: "At risk", done: "Met", missed: "Missed" }[st];
  const tr = S ? S.trust : 60;
  $("meters").innerHTML = `
    <div class="meter"><span class="k">Scrum points</span><span class="v">${S ? S.score : 0}<span class="hint"> / ${S ? S.max : 0}</span></span></div>
    <div class="meter"><span class="k">Team trust</span><span class="trust"><span class="bar"><span style="width:${tr}%"></span></span><span class="v">${tr}</span></span></div>
    <div class="meter"><span class="k">Sprint Goal</span><span class="pill ${st}">${stTxt}</span></div>`;
}

// ---------- Boards ----------
function workerFaces(id) { return DEVS.filter(d => S.on[d] === id).map(d => face(d, moodOf(d))).join(""); }
function freshIds() { const s = new Set(); for (const f of S.fresh) { const m = f.text.match(/^“(.+?)”/); if (m) for (const it of Object.values(S.items)) if (it.n === m[1]) s.add(it.id); } return s; }
function tagHtml(it, where, i, marks, fresh) {
  const marked = marks.has(it.id) ? " marked" : "";
  const fr = fresh.has(it.id) ? " fresh" : "";
  let stamp = "";
  if (where === "sb") {
    if (it.blocked) stamp = `<span class="stampsm red">${esc(it.badge || "Blocked")}</span>`;
    else if (it.st === "testing") stamp = `<span class="stampsm amber">Testing</span>`;
    else if (it.st === "done") stamp = `<span class="stampsm green">Done</span>`;
  }
  if (where === "inc") stamp = it.live ? `<span class="stampsm blue">Live</span>` : `<span class="stampsm green">Done</span>`;
  const label = marked && marks.first === it.id && S.mark && S.mark.label ? `<span class="marklbl">${esc(S.mark.label)}</span>` : "";
  let meta = "";
  if (where === "pb") meta = `<span class="meta">size ${it.s == null ? "?" : it.s}${it.notReady ? (it.id === "cal" ? " · waits for IT" : " · on hold") : ""}</span>`;
  if (where === "sb") {
    const boxes = it.s <= 12 ? `<span class="prog" aria-hidden="true">${Array.from({ length: it.s }, (_, k) => `<i class="${k < it.prog ? "f" : ""}"></i>`).join("")}</span>` : "";
    meta = `<span class="meta">${boxes}<span>${it.prog}/${it.s}</span>${it.tasks ? `<span>· ${it.tasks} tasks</span>` : ""}${it.detail ? "<span>· detail added</span>" : ""}<span class="faces">${workerFaces(it.id)}</span></span>`;
  }
  if (where === "inc") meta = `<span class="meta">size ${it.s}</span>`;
  return `${label}<div class="tag ${where}${it.kind === "imp" ? " imp" : ""}${stamp ? " has-stamp" : ""}${marked}${fr}" data-key="${it.id}">${where === "pb" ? `<span class="rank">${i + 1}</span>` : ""}${stamp}<span class="ttl">${esc(it.n)}</span>${meta}</div>`;
}
function ghostHtml(where) {
  const g = S.ghost; if (!g || g.where !== where) return "";
  return `<span class="marklbl">${esc(g.label)}</span><div class="tag ghost" data-key="ghost"><span class="ttl">${esc(g.n)}</span><span class="meta">not on the board yet</span></div>`;
}
function renderBoard(animate) {
  if (!S) return;
  const before = animate && !reduced ? rects() : null;
  const marks = new Set(S.mark && S.mark.ids ? S.mark.ids : []);
  marks.first = S.mark && S.mark.ids ? S.mark.ids.find(id => S.items[id] && S.items[id].where !== "out") : null;
  const fresh = freshIds();
  const pbCards = S.pb.map((id, i) => tagHtml(S.items[id], "pb", i, marks, fresh));
  if (S.ghost && S.ghost.where === "pb") pbCards.splice(S.ghost.pos || 0, 0, ghostHtml("pb"));
  const sbCards = S.sb.map((id, i) => tagHtml(S.items[id], "sb", i, marks, fresh)).join("") + ghostHtml("sb");
  let incCards = "";
  for (let k = 0; k < 3; k++) {
    const ids = S.inc.filter(id => S.items[id].sp === k);
    if (ids.length) incCards += `<div class="grp">Sprint ${k + 1}</div>` + ids.map((id, i) => tagHtml(S.items[id], "inc", i, marks, fresh)).join("");
  }
  const dodMarked = S.mark && S.mark.dod ? " marked" : "";
  const dodList = S.dod.map((d, i) => `<li class="${S.dodStruck && (i === 0 || i === 2) ? "struck" : ""}${i >= 3 ? " added" : ""}">${esc(d)}</li>`).join("");
  $("board").innerHTML = `
    <div class="col" id="col-pb"><div class="colhead"><h2>Product Backlog</h2><span class="cnt">${S.pb.length}</span></div>
      <p class="colsub">Ordered by Jonas, the Product Owner</p>
      <div class="pin"><span class="lbl">Commitment · Product Goal</span>${esc(S.pgoal)}</div>
      <div class="cards">${pbCards.join("") || `<p class="empty-col">Empty</p>`}</div></div>
    <div class="col" id="col-sb"><div class="colhead"><h2>Sprint Backlog</h2><span class="cnt">${S.sb.length}</span></div>
      <p class="colsub">A plan by and for the Developers</p>
      <div class="pin${S.goal ? "" : " empty"}"><span class="lbl">Commitment · Sprint Goal</span>${S.goal ? esc(S.goal) : "Defined in Sprint Planning"}</div>
      <div class="cards">${sbCards || `<p class="empty-col">${S.day === 1 && !S.goalResult ? "Filled in Sprint Planning" : "Nothing left in this Sprint"}</p>`}</div></div>
    <div class="col" id="col-inc"><div class="colhead"><h2>Increment</h2><span class="cnt">${S.inc.length}</span></div>
      <p class="colsub">Everything that meets the Definition of Done</p>
      <div class="pin${dodMarked}"><span class="lbl">Commitment · Definition of Done</span>${S.mark && S.mark.dod ? `<span class="marklbl" style="margin:2px 0 4px;display:inline-block">${esc(S.mark.label)}</span>` : ""}<ul>${dodList}</ul></div>
      <div class="cards">${incCards || `<p class="empty-col">Nothing is Done yet</p>`}</div></div>`;
  if (before) flip(before);
  renderCounts();
  if (animate && S.fresh.length) {
    floatWhy();
    if (narrow() && !$("boards").classList.contains("open")) { const b = $("boards"); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); }
  }
}
function rects() { const m = {}; document.querySelectorAll("#board [data-key]").forEach(el => { m[el.dataset.key] = el.getBoundingClientRect(); }); return m; }
function flip(before) {
  document.querySelectorAll("#board [data-key]").forEach(el => {
    const a = before[el.dataset.key]; const b = el.getBoundingClientRect();
    if (!a) { el.animate([{ transform: "scale(.85)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" }); return; }
    const dx = a.left - b.left, dy = a.top - b.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 650, easing: "cubic-bezier(.2,.8,.2,1)" });
  });
}
function floatWhy() {
  if (narrow() || reduced) return;
  let n = 0;
  for (const f of S.fresh) {
    if (!f.why || n >= 3) continue;
    const m = f.text.match(/^“(.+?)”/); if (!m) continue;
    const it = Object.values(S.items).find(x => x.n === m[1]); if (!it) continue;
    const el = document.querySelector(`#board [data-key="${it.id}"]`); if (!el) continue;
    const r = el.getBoundingClientRect(); if (r.top < 60 || r.top > innerHeight) continue;
    const t = document.createElement("div"); t.className = "whyfloat"; t.textContent = f.why;
    t.style.left = Math.max(8, Math.min(innerWidth - 250, r.left)) + "px"; t.style.top = (r.top - 26) + "px"; t.style.animationDelay = (n * .25) + "s";
    document.body.appendChild(t); setTimeout(() => t.remove(), 3200); n++;
  }
}
function renderCounts() {
  $("counts").innerHTML = S ? `<span class="c">Product Backlog <b>${S.pb.length}</b></span><span class="c">Sprint Backlog <b>${S.sb.length}</b></span><span class="c">Increment <b>${S.inc.length}</b></span>` : "";
}
function renderDiary() {
  if (!S) return;
  let h = "", lastSp = -1;
  const list = S.diary.slice().reverse();
  if (!list.length) h = `<p class="hint">Every move on the boards is logged here, with who moved it and why.</p>`;
  for (const e of list) {
    if (e.sp !== lastSp) { h += `<h3>Sprint ${e.sp + 1}</h3>`; lastSp = e.sp; }
    h += `<div class="dentry"><span class="tm">Day ${e.d} ${esc(e.t)}</span>${ic(e.icon)}<span>${esc(e.text)}${e.why ? `<em>${esc(e.why)}</em>` : ""}</span></div>`;
  }
  $("diary").innerHTML = h;
}

// ---------- Scene ----------
function placeBar(at, when) { const p = PLACES[at] || PLACES.team; return `<div class="place"><span class="where"><svg viewBox="0 0 18 18" aria-hidden="true">${p[1]}</svg>${p[0]}</span><span class="when">${when}</span></div>`; }
function linesHtml(lines, animate, startDelay) {
  return `<div class="lines">${lines.map(([w, t], i) => `<div class="line${w === "you" ? " you" : ""}" style="${animate ? `animation-delay:${(startDelay || 0) + i * .38}s` : "animation:none"}">${face(w, moodOf(w))}<div class="bubble"><span class="nm" style="color:${LOOK[w].shirt}">${esc(NAMES[w])}${w !== "you" ? ` <span class="hint">· ${ROLE[w]}</span>` : ""}</span>${esc(t)}</div></div>`).join("")}</div>`;
}
function quotesHtml(g) {
  if (!g || !g.length) return "";
  return `<div class="guide"><span class="lbl">From the Scrum Guide 2020</span>${g.map(([q, r]) => `<blockquote>“${esc(q.replace(/[;,]\s*(and,)?$/, "").replace(/;$/, ""))}${/[.!?]$/.test(q) ? "" : "."}”<cite>${esc(r)}</cite></blockquote>`).join("")}</div>`;
}
function movesHtml() {
  if (!S.fresh.length) return "";
  return `<div class="moves"><span class="lbl">On the board</span>${S.fresh.map(f => `<div class="mv">${ic(f.icon)}<span>${esc(f.text)}${f.why ? `<em>${esc(f.why)}</em>` : ""}</span></div>`).join("")}${narrow() ? `<button class="primary alt" type="button" data-act="openboards" style="justify-self:start;padding:7px 12px;font-size:13px">See the boards</button>` : ""}</div>`;
}
const LETTERS = ["A", "B", "C", "D"];
function whenStr() { return `<span class="f">Sprint ${S.sp + 1} · Day ${S.day} · ${DAYNAMES[S.day - 1]} ${S.t}</span><span class="s">Day ${S.day} · ${DAYNAMES[S.day - 1].slice(0, 3)} ${S.t}</span>`; }
const ROLEFACE = { po: ["jonas"], dev: ["priya", "tom", "lea"], team: ["jonas", "priya", "tom", "lea", "you"], sm: ["you"], same: ["priya", "tom", "lea"], own: ["tom"], hans: ["hans"] };

function renderScene() { sceneInner(); if (watch.on) renderWatchbar(); else $("scene").classList.remove("watching"); officeUpdate(); }
function sceneInner() {
  const el = $("scene");
  if (mode === "title") { el.innerHTML = titleHtml(); return; }
  if (mode === "blitz") { el.innerHTML = blitzHtml(); return; }
  if (mode === "quiz") { el.innerHTML = quizHtml(); return; }
  if (S.done) { el.innerHTML = finalHtml(); return; }
  const b = beat(S);
  const key = `${S.sp}-${S.pos}-${S.ev}-${S.day}`;
  const fresh = key !== lastKey; lastKey = key;
  const anim = fresh && !reduced;
  const v = S.view;
  let body = "";
  if (b.k === "day") { el.innerHTML = placeBar("team", whenStr()) + `<div class="scene-body">${dayHtml()}</div>`; return; }
  if (b.k === "end") { el.innerHTML = placeBar("lounge", whenStr()) + `<div class="scene-body">${endHtml()}</div>`; return; }
  const speakers = new Set(v.lines.map(l => l[0]));
  const cast = (b.cast || []).filter(Boolean);
  body += `<div class="cast">${cast.map(c => `<div class="who${speakers.has(c) ? " speaking" : ""}">${face(c, moodOf(c))}<span>${esc(NAMES[c])}</span></div>`).join("")}</div>`;
  if (v.n) body += `<p class="narr">${esc(v.n)}</p>`;
  if (v.lines.length) body += linesHtml(v.lines, anim);
  const after = anim ? v.lines.length * .38 : 0;
  const ph = S.phase;
  if (b.k === "say") {
    body += quotesHtml(b.g);
    body += `<div class="row"><button class="primary" type="button" data-main data-act="cont">Continue</button><span class="hint">Enter</span></div>`;
  } else if (ph === "call") {
    body += `<div class="act" style="animation:rise .35s ${after}s both"><span class="lbl">On the board, right now</span><p>${esc(v.act)}</p>
      <div class="callbtns"><button class="cbtn allow" type="button" data-act="allow">Let it happen<small>Nothing wrong here</small></button><button class="cbtn step" type="button" data-act="step">Step in<small>This breaks Scrum</small></button></div></div>
      <p class="hint">Some actions are perfectly fine. Stepping in on those costs the team's trust.</p>`;
  } else if (ph === "step") {
    body += `<div class="act"><span class="lbl">You step in</span><p>${esc(v.act)}</p></div><h2 class="q">How do you step in?</h2>${optsHtml(v, null)}`;
  } else if (ph === "ask") {
    body += `<h2 class="q" style="animation:rise .35s ${after}s both">${esc(v.q)}</h2>${optsHtml(v, null, b.k === "who" ? b : null)}`;
  } else if (ph === "fb") {
    const r = S.res;
    if (b.k === "call" && r.call === "step" && !r.falseAlarm) body += `<div class="act"><span class="lbl">You stepped in</span><p>${esc(v.act)}</p></div>`;
    else if (b.k === "call") body += `<div class="act" style="opacity:.8"><span class="lbl">${r.call === "allow" ? "You let it happen" : "You stepped in"}</span><p>${esc(v.act)}</p></div>`;
    if (b.k !== "call" || (r.call === "step" && !r.falseAlarm)) { if (b.k !== "call") body += `<h2 class="q">${esc(v.q)}</h2>`; body += optsHtml(v, r, b.k === "who" ? b : null); }
    body += verdictHtml(b, r);
    body += `<p class="fbtext">${esc(r.fb)}</p>`;
    if (r.lines && r.lines.length) body += linesHtml(r.lines, fresh || true, .1);
    body += movesHtml();
    body += quotesHtml(b.g);
    body += `<div class="row"><button class="primary" type="button" data-main data-act="cont">Continue</button><span class="hint">Enter</span></div>`;
  }
  el.innerHTML = placeBar(b.at, whenStr()) + `<div class="scene-body">${body}</div>`;
  if (fresh) { const sb = el.querySelector(".scene-body"); if (sb) sb.scrollTop = 0; }
}
function optsHtml(v, r, whoBeat) {
  return `<div class="opts">${v.order.map((i, n) => {
    const t = v.opts[i];
    let cls = "";
    if (r && !r.nograde) cls = i === r.ans ? " right" : i === r.pick ? " wrong" : " dim";
    if (r && r.nograde) cls = i === r.pick ? " right" : " dim";
    const fc = whoBeat ? (() => { const o = whoOptions(whoBeat)[i]; const fs = (ROLEFACE[o.key] || []).slice(0, 3); return `<span class="fs n${fs.length}">${fs.map(f => face(f, "neutral")).join("")}</span>`; })() : "";
    return `<button class="opt${whoBeat ? " face" : ""}${cls}" type="button" data-opt="${i}" data-k="${n + 1}" ${r ? "disabled" : ""}>${whoBeat ? fc : `<span class="key">${LETTERS[n]}</span>`}<span>${esc(t)}</span></button>`;
  }).join("")}</div>`;
}
function verdictHtml(b, r) {
  let cls = "g" + r.g, big, pts;
  if (r.nograde) return `<div class="verdict info"><span class="big">Into the next Sprint</span></div>`;
  if (b.k === "call") {
    if (r.call === "allow") { big = b.ok ? "Right call" : "Missed it"; pts = b.ok ? 10 : 0; }
    else if (r.falseAlarm) { big = "False alarm"; pts = 0; cls = "g0"; }
    else { big = r.g === 2 ? "Good catch" : r.g === 1 ? "Caught it, so-so fix" : "Caught it, wrong fix"; pts = [4, 7, 10][r.g]; cls = r.g === 0 ? "g1" : cls; }
  } else { big = r.g === 2 ? "Great call" : r.g === 1 ? "Partly right" : "Not quite"; pts = [0, 5, 10][r.g]; }
  return `<div class="verdict ${cls}"><span class="big">${big}</span><span class="pts">+${pts} pts</span></div>`;
}
function dayHtml() {
  const d = S.day;
  const log = S.dayLog.length ? S.dayLog : ["A steady day of work on the Sprint Backlog."];
  const st = goalStatus(S);
  const today = d === 10 ? "Today: Sprint Review at 10:00, Daily Scrum at 13:30, Sprint Retrospective at 14:00." : d === 6 ? "Today: Daily Scrum at 13:30, Product Backlog refinement at 14:00." : "Today: Daily Scrum at 13:30, as every working day.";
  return `<div class="dayhead"><span class="n">${d}</span><span class="t">${DAYNAMES[d - 1]}<small>Sprint ${S.sp + 1}, day ${d} of 10${d < 10 ? ` · ${10 - d} working days left after today` : " · the last day of the Sprint"}</small></span></div>
    <div><span class="lbl hint" style="text-transform:uppercase;letter-spacing:.1em;font-weight:700;font-size:11px">Since yesterday</span>
    <ul class="loglist">${log.map(l => `<li${S.dayLog.length ? "" : ' class="quiet"'}>${esc(l)}</li>`).join("")}</ul></div>
    <p class="fbtext">${esc(today)}</p>
    <p class="fbtext"><span class="pill ${st}">${{ none: "No Sprint Goal yet", track: "Sprint Goal on track", risk: "Sprint Goal at risk", done: "Sprint Goal met", missed: "Sprint Goal missed" }[st]}</span> <span class="hint">Forecast from the work left on the Sprint Backlog.</span></p>
    <div class="row"><button class="primary" type="button" data-main data-act="cont">Start the day</button><span class="hint">Enter</span></div>`;
}
function sprintPoints(sp) { const r = S.results.filter(x => x.sp === sp); return { n: r.length, good: r.filter(x => x.g === 2).length, list: r }; }
function endHtml() {
  const res = S.sprintRes[S.sp] || { met: goalMet(S), goal: S.goal, back: [] };
  const p = sprintPoints(S.sp);
  const sp = SPRINTS[S.sp];
  const qn = (S.bridge && S.bridge[S.sp]) || null;
  return `<div class="hero"><p class="hint" style="text-transform:uppercase;letter-spacing:.1em;font-weight:700">${sp.title} complete · ${esc(sp.name)}</p>
    <div class="row"><span class="stamp ${res.met ? "ok" : "no"}">${res.met ? "Goal met" : "Goal missed"}</span></div>
    <p><b>Sprint Goal:</b> ${esc(res.goal || "none")}</p>
    ${res.back && res.back.length ? `<p class="hint">Back to the Product Backlog: ${res.back.map(id => esc(N(S, id))).join(", ")}. Jonas decided their new place.</p>` : ""}
    <p><b>${p.good} of ${p.n}</b> calls were spot on this Sprint.</p>
    <ul class="reslist">${p.list.map(x => `<li class="g${x.g}"><span class="m">${x.g === 2 ? "✓" : x.g === 1 ? "~" : "✗"}</span><span>${esc(x.label)}</span></li>`).join("")}</ul>
    <div class="moves"><span class="lbl">Exam bridge</span><span>${qn ? `You answered ${qn[0]} of ${qn[1]} real-style PSM I questions about this Sprint correctly.` : "Four real-style PSM I questions about what just happened. Proof-read against the 2020 Scrum Guide."}</span>
      <div class="row"><button class="primary${qn ? " alt" : ""}" type="button" data-act="quiz">${qn ? "Four more questions" : "Answer 4 exam questions"}</button></div></div>
    <div class="row"><button class="primary${qn ? "" : " alt"}" type="button" ${qn ? "data-main" : ""} data-act="cont">${S.sp < 2 ? `Start Sprint ${S.sp + 2}` : "See your final report"}</button></div></div>`;
}

// ---------- Title ----------
function titleHtml() {
  const saved = loadGame();
  const canResume = saved && !saved.done && (saved.pos > 0 || saved.sp > 0);
  return `<div class="place"><span class="where">Spoke Repairs</span><span class="when">PSM I practice · no sign-up</span></div><div class="scene-body"><div class="hero">
    <h1>Scrum Master<span>on Duty</span></h1>
    <div class="row">${canResume ? `<button class="primary" type="button" data-main data-act="resume">Continue Sprint ${saved.sp + 1}, day ${saved.day}</button><button class="primary alt" type="button" data-act="new">New game</button>` : `<button class="primary" type="button" data-main data-act="new">Start Sprint 1</button>`}<button class="primary alt" type="button" data-act="watch">Watch a Sprint</button><button class="primary alt" type="button" data-act="blitz">Who decides? Rapid round</button></div>
  </div></div>`;
}

// ---------- Final report ----------
function badgeList() {
  const R = S.results;
  const g = l => R.filter(r => r.label === l);
  const allGood = ls => { const x = ls.flatMap(g); return x.length > 0 && x.every(r => r.g === 2); };
  const legit = ["Refinement splits card payment", "A Developer changes the plan", "Scope talk with Jonas", "Jonas clarifies a detail", "Maya advises at Sprint Planning", "Priya picks her own next task", "A company Definition of Done"];
  const br = Object.values(S.bridge || {}); const bq = br.reduce((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0]);
  return [
    ["Impediment remover", "Handled every blocker the right way", allGood(["IT blocks the booking form", "Tom is off sick", "Priya and Lea disagree"])],
    ["Guardian of Done", "Never let undone work into the Increment", allGood(["Lea wants to call the email Done", "Hans wants to skip the tests"])],
    ["Hands off", "Let every healthy action happen", allGood(legit)],
    ["Goal getter", "Met all three Sprint Goals", S.sprintRes.length === 3 && S.sprintRes.every(r => r.met)],
    ["Product Goal", "Customers book and pay online", !!S.pgoalDone],
    ["Exam-ready", "85% or more in the exam bridge", bq[1] >= 8 && bq[0] / bq[1] >= .85]
  ];
}
function finalHtml() {
  const pct = S.max ? Math.round(S.score / S.max * 100) : 0;
  const title = pct >= 90 ? "Exam-ready Scrum Master" : pct >= 75 ? "Trusted servant leader" : pct >= 55 ? "Promising Scrum Master" : "Scrum Master in training";
  const missed = S.results.filter(r => r.g < 2);
  return `<div class="place"><span class="where">Final report</span><span class="when">3 Sprints played</span></div><div class="scene-body"><div class="hero">
    <p class="hint" style="text-transform:uppercase;letter-spacing:.1em;font-weight:700">Your rating</p>
    <h1 style="font-size:44px">${esc(title)}</h1>
    <div class="row" style="gap:24px"><span class="bigscore">${pct}<small>%</small></span><span>${S.score} of ${S.max} Scrum points<br><span class="hint">PSM I needs 85% to pass</span></span></div>
    <div class="badges">${badgeList().map(([n, d, on]) => `<div class="badge ${on ? "on" : "off"}"><b>${on ? "★ " : ""}${esc(n)}</b>${esc(d)}</div>`).join("")}</div>
    ${missed.length ? `<div class="moves"><span class="lbl">Worth another look</span>${missed.map(r => `<div class="mv">${ic(r.g === 1 ? "note" : "block")}<span>Sprint ${r.sp + 1}: ${esc(r.label)}</span></div>`).join("")}</div>` : `<p>A flawless campaign. Try the rapid round, or play again: the options are shuffled and the team reacts differently to different calls.</p>`}
    <div class="row"><button class="primary" type="button" data-main data-act="new">Play again</button><button class="primary alt" type="button" data-act="blitz">Who decides? Rapid round</button></div>
    <p class="hint">Keep practising with all ${QB.questions.length} questions in <a href="#practice">Exam practice</a>, or look anything up in the <a href="#guide">Scrum Guide</a>.</p>
  </div></div>`;
}

// ---------- Exam bridge (questions from the shared bank) ----------
const QIDX = Object.fromEntries(QB.questions.map(q => [q.id, q]));
const PEOPLE_KEYS = { maya: "maya", jonas: "jonas", priya: "priya", tom: "tom", lea: "lea", hans: "hans" };
function startQuiz() {
  const ids = SPRINTS[S.sp].quiz.filter(id => QIDX[id]);
  const fresh = ids.filter(id => !prefs.seen[id]);
  const pickFrom = fresh.length >= 4 ? fresh : ids;
  const pick = shuffle(pickFrom).slice(0, 4);
  quiz = { ids: pick, i: 0, sel: [], done: false, right: 0, order: null };
  prepQ(); mode = "quiz"; renderScene(); window.scrollTo({ top: 0 });
}
function prepQ() { const q = QIDX[quiz.ids[quiz.i]]; quiz.order = q.tf ? q.o.map((_, i) => i) : shuffle(q.o.map((_, i) => i)); quiz.sel = []; quiz.done = false; }
function quizHtml() {
  const q = QIDX[quiz.ids[quiz.i]];
  const multi = q.a.length > 1;
  let h = `<div class="place"><span class="where">Exam bridge</span><span class="when">Question ${quiz.i + 1} of ${quiz.ids.length}</span></div><div class="scene-body">`;
  if (q.s) h += linesHtml(q.s.filter(l => PEOPLE_KEYS[l[0]]), false);
  h += `<h2 class="q">${esc(q.q)}</h2>${multi ? `<p class="hint">Choose ${q.a.length}.</p>` : ""}<div class="opts">`;
  quiz.order.forEach((i, n) => {
    let cls = "";
    if (quiz.done) cls = q.a.includes(i) ? " right" : quiz.sel.includes(i) ? " wrong" : " dim";
    else if (quiz.sel.includes(i)) cls = " right";
    h += `<button class="opt${cls}" type="button" data-q="${i}" data-k="${n + 1}" ${quiz.done ? "disabled" : ""}><span class="key">${LETTERS[n]}</span><span>${esc(q.o[i])}</span></button>`;
  });
  h += `</div>`;
  if (!quiz.done && multi) h += `<div class="row"><button class="primary" type="button" data-main data-act="qcheck" ${quiz.sel.length === q.a.length ? "" : "disabled"}>Check answer</button></div>`;
  if (quiz.done) {
    const ok = quiz.sel.length === q.a.length && quiz.sel.every(i => q.a.includes(i));
    h += `<div class="verdict ${ok ? "g2" : "g0"}"><span class="big">${ok ? "Correct" : "Not quite"}</span></div><p class="fbtext">${esc(q.x)}</p>${quotesHtml(q.g.map(t => [t, q.r]))}
      <div class="row"><button class="primary" type="button" data-main data-act="qnext">${quiz.i + 1 < quiz.ids.length ? "Next question" : "Back to the Sprint"}</button></div>`;
  }
  return h + `</div>`;
}
function quizPick(i) {
  const q = QIDX[quiz.ids[quiz.i]];
  if (quiz.done) return;
  if (q.a.length > 1) { quiz.sel = quiz.sel.includes(i) ? quiz.sel.filter(x => x !== i) : quiz.sel.length < q.a.length ? [...quiz.sel, i] : quiz.sel; renderScene(); return; }
  quiz.sel = [i]; quizCheck();
}
function quizCheck() {
  const q = QIDX[quiz.ids[quiz.i]];
  quiz.done = true;
  const ok = quiz.sel.length === q.a.length && quiz.sel.every(i => q.a.includes(i));
  if (ok) quiz.right++;
  prefs.seen[q.id] = ok ? 1 : 0; savePrefs(); beep(ok ? "good" : "bad");
  renderScene();
}
function quizNext() {
  if (quiz.i + 1 < quiz.ids.length) { quiz.i++; prepQ(); renderScene(); window.scrollTo({ top: 0 }); return; }
  S.bridge = S.bridge || {};
  const prev = S.bridge[S.sp] || [0, 0];
  S.bridge[S.sp] = [prev[0] + quiz.right, prev[1] + quiz.ids.length];
  saveGame(); mode = "game"; renderScene(); window.scrollTo({ top: 0 });
}

// ---------- Rapid round ----------
const BLITZ_TIME = 15000;
const ROLES = [["po", "Product Owner", ["jonas"]], ["dev", "Developers", ["priya", "tom", "lea"]], ["sm", "Scrum Master", ["you"]], ["team", "Whole Scrum Team", ["jonas", "priya", "tom", "lea", "you"]]];
function startBlitz(from) {
  blitz = { list: shuffle(BLITZ).slice(0, 10), i: 0, right: 0, pts: 0, streak: 0, done: false, pick: null, t0: 0, from, timer: null, finished: false };
  mode = "blitz"; nextBlitz(true);
}
function nextBlitz(first) {
  if (!first) blitz.i++;
  clearTimeout(blitz.timer);
  if (blitz.i >= blitz.list.length) { blitz.finished = true; prefs.blitzBest = Math.max(prefs.blitzBest || 0, blitz.pts); savePrefs(); renderScene(); return; }
  blitz.done = false; blitz.pick = null; blitz.t0 = performance.now();
  renderScene();
  const bar = document.querySelector(".timer span");
  if (bar) bar.animate([{ width: "100%" }, { width: "0%" }], { duration: BLITZ_TIME, easing: "linear", fill: "forwards" });
  blitz.timer = setTimeout(() => blitzPick(null), BLITZ_TIME);
}
function blitzPick(k) {
  if (blitz.done) return;
  clearTimeout(blitz.timer);
  const it = blitz.list[blitz.i];
  blitz.done = true; blitz.pick = k;
  const ok = k === it[1];
  if (ok) { blitz.right++; blitz.streak++; const left = Math.max(0, BLITZ_TIME - (performance.now() - blitz.t0)); blitz.pts += Math.round((10 + left / 300) * (1 + Math.min(blitz.streak - 1, 4) * .25)); }
  else blitz.streak = 0;
  beep(ok ? "good" : "bad");
  renderScene();
  if (narrow()) { const v = document.querySelector("#scene .verdict"); if (v) v.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" }); }
}
function blitzHtml() {
  const B = blitz;
  if (B.finished) {
    return `<div class="place"><span class="where">Who decides?</span><span class="when">Rapid round</span></div><div class="scene-body"><div class="hero">
      <h1 style="font-size:46px">${B.right} of ${B.list.length}<span>${B.pts} points</span></h1>
      <p>${B.right === B.list.length ? "Perfect round. The accountabilities are second nature." : B.right >= 8 ? "Strong. The ones you missed are worth a second look in the Field guide." : "Accountabilities are a big part of PSM I. Another round makes them stick."}</p>
      <p class="hint">Best round in this browser: ${prefs.blitzBest} points.</p>
      <div class="row"><button class="primary" type="button" data-main data-act="blitz">Play another round</button><button class="primary alt" type="button" data-act="blitzexit">${B.from === "game" ? "Back to the game" : "Back to the start"}</button></div></div></div>`;
  }
  const it = B.list[B.i];
  let h = `<div class="place"><span class="where">Who decides?</span><span class="when">${B.i + 1} / ${B.list.length} · <span class="streak">${B.streak > 1 ? `streak ×${B.streak}` : `${B.pts} pts`}</span></span></div><div class="scene-body">
    <p class="hint">Who does the Scrum Guide give this to? Answer before the bar runs out.</p>
    <div class="blitz-card">${esc(it[0])}</div><button class="linkbtn blitzstop" type="button" data-act="blitzexit">Stop the round</button><div class="timer"><span style="${B.done ? "width:0" : ""}"></span></div>
    <div class="roles">${ROLES.map(([k, n, fs], i) => {
      let cls = ""; if (B.done) cls = k === it[1] ? " right" : k === B.pick ? " wrong" : "";
      return `<button class="role${cls}" type="button" data-role="${k}" data-k="${i + 1}" ${B.done ? "disabled" : ""}><span class="faces">${fs.map(f => face(f, "neutral")).join("")}</span>${n}</button>`;
    }).join("")}</div>`;
  if (B.done) {
    const ok = B.pick === it[1];
    h += `<div class="verdict ${ok ? "g2" : "g0"}"><span class="big">${ok ? "Correct" : B.pick ? "Not quite" : "Time's up"}</span></div>${it[4] ? `<p class="fbtext">${esc(it[4])}</p>` : ""}${quotesHtml([[it[2], it[3]]])}
      <div class="row"><button class="primary" type="button" data-main data-act="bnext">${B.i + 1 < B.list.length ? "Next" : "See results"}</button><span class="hint">Enter</span></div>`;
  }
  return h + `</div>`;
}

// ---------- Field guide ----------
function guideHtml() {
  const rows = [["po", "Product Owner"], ["dev", "Developers"], ["sm", "Scrum Master"], ["team", "Whole Scrum Team"]].map(([k, n]) => `<tr><td><b>${n}</b></td><td>${BLITZ.filter(b => b[1] === k).map(b => esc(b[0])).join("<br>")}</td></tr>`).join("");
  return `<div class="row" style="justify-content:space-between"><h2 id="drawerTitle">Field guide</h2><button class="tbtn" type="button" data-act="closedrawer">Close</button></div>
  <p class="small">Everything here follows the 2020 Scrum Guide. Quotes are the Guide's own words.</p>
  <h3>How items move between the boards</h3>
  <div class="flow">
    <div class="flowstep"><span class="path">New idea <span>→ Product Backlog</span></span><p>Anyone can suggest an idea. The Product Owner is accountable for the Product Backlog and its order, and may delegate the work; others change it by convincing the Product Owner.</p><q>Those wanting to change the Product Backlog can do so by trying to convince the Product Owner.</q></div>
    <div class="flowstep"><span class="path"><span>Product Backlog</span> → <span>Sprint Backlog</span></span><p>In Sprint Planning, the Developers select the items, in discussion with the Product Owner.</p><q>Through discussion with the Product Owner, the Developers select items from the Product Backlog to include in the current Sprint.</q></div>
    <div class="flowstep"><span class="path"><span>Sprint Backlog</span> → <span>Increment</span></span><p>The moment an item meets the Definition of Done. Not a day earlier, and not only at the Sprint Review.</p><q>The moment a Product Backlog item meets the Definition of Done, an Increment is born.</q></div>
    <div class="flowstep"><span class="path"><span>Sprint Backlog</span> → <span>Product Backlog</span></span><p>An item that isn't Done when the Sprint ends is not presented and goes back. The Product Owner, accountable for ordering the Product Backlog, decides its new place; it doesn't jump to the top on its own. In this game, an item the Developers and the Product Owner take out of scope during the Sprint also goes back.</p><q>If a Product Backlog item does not meet the Definition of Done, it cannot be released or even presented at the Sprint Review. Instead, it returns to the Product Backlog for future consideration.</q></div>
    <div class="flowstep"><span class="path">Inside the <span>Sprint Backlog</span></span><p>The Developers change their own plan whenever they learn something. Scope is clarified and renegotiated with the Product Owner, without endangering the Sprint Goal.</p><q>Consequently, the Sprint Backlog is updated throughout the Sprint as more is learned.</q></div>
    <div class="flowstep"><span class="path"><span>Increment</span> → customers</span><p>A Done Increment may be released before the Sprint ends. The Sprint Review is not a gate.</p><q>The Sprint Review should never be considered a gate to releasing value.</q></div>
  </div>
  <h3>Artifacts and their commitments</h3>
  <table class="tbl"><tr><th>Artifact</th><th>Commitment</th></tr><tr><td>Product Backlog</td><td>Product Goal</td></tr><tr><td>Sprint Backlog</td><td>Sprint Goal</td></tr><tr><td>Increment</td><td>Definition of Done</td></tr></table>
  <h3>Events and timeboxes</h3>
  <table class="tbl"><tr><th>Event</th><th>Maximum</th></tr>
    <tr><td>Sprint</td><td>1 month</td></tr><tr><td>Sprint Planning</td><td>8 h *</td></tr><tr><td>Daily Scrum</td><td>15 min</td></tr><tr><td>Sprint Review</td><td>4 h *</td></tr><tr><td>Sprint Retrospective</td><td>3 h *</td></tr></table>
  <p class="small">* For a one-month Sprint. For shorter Sprints, the event is usually shorter. The Daily Scrum is 15 minutes whatever the Sprint length. The Spoke Repairs team runs two-week Sprints.</p>
  <h3>Who decides what</h3>
  <div style="overflow-x:auto"><table class="tbl">${rows}</table></div>
  <p class="small">Scrum Guide quotes © 2020 Ken Schwaber and Jeff Sutherland, offered under the <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a> licence. Story and characters are fictional.</p>`;
}
function menuHtml() {
  const inGame = S && mode === "game" && !S.done;
  return `<div class="row" style="justify-content:space-between"><h2 id="drawerTitle">Menu</h2><button class="tbtn" type="button" data-act="closedrawer">Close</button></div>
  <div class="opts">
    ${inGame ? `<button class="opt" type="button" data-act="closedrawer"><span class="key">▶</span><span><b>${watch.on ? "Back to watching" : "Back to the game"}</b><br><span class="hint">${watch.on ? "The Sprint that plays itself" : `Sprint ${S.sp + 1}, day ${S.day}`}</span></span></button>` : ""}
    <button class="opt" type="button" data-act="new"><span class="key">1</span><span><b>Start over from Sprint 1</b></span></button>
    <button class="opt" type="button" data-act="jump1"><span class="key">2</span><span><b>Jump to Sprint 2</b><br><span class="hint">Sprint 1 is played for you, with every call made well</span></span></button>
    <button class="opt" type="button" data-act="jump2"><span class="key">3</span><span><b>Jump to Sprint 3</b><br><span class="hint">Sprints 1 and 2 are played for you</span></span></button>
    <button class="opt" type="button" data-act="blitz"><span class="key">⚡</span><span><b>Who decides? Rapid round</b><br><span class="hint">10 statements against the clock</span></span></button>
    <button class="opt" type="button" data-act="guide"><span class="key">?</span><span><b>Field guide</b><br><span class="hint">How items move, timeboxes, who decides what</span></span></button>
  </div>
  ${menuConfirm ? (() => { const sv = loadGame(); return `<div class="confirm"><b>${menuConfirm === "new" || menuConfirm === "wplay" ? "Start a new game?" : `Jump to Sprint ${menuConfirm === "jump1" ? 2 : 3}?`}</b><span>Your saved game${sv ? ` (Sprint ${sv.sp + 1}, day ${sv.day})` : ""} will be replaced.</span><div class="row"><button class="primary" type="button" data-act="${menuConfirm}" data-sure="1">Yes, replace it</button><button class="primary alt" type="button" data-act="cancelrestart">Keep my game</button></div></div>`; })() : ""}
  <p class="small">Progress is saved in this browser only.</p>`;
}
function openDrawer(kind) { $("drawerPanel").innerHTML = kind === "menu" ? menuHtml() : guideHtml(); $("drawer").hidden = false; $("drawer").dataset.kind = kind; setTimeout(() => { const b = $("drawerPanel").querySelector("button"); b && b.focus(); }, 30); }
function closeDrawer() { $("drawer").hidden = true; menuConfirm = false; }

// ---------- Flow ----------
function renderAll(animate) { renderHeader(); renderScene(); renderBoard(animate); renderDiary(); }
function newGameUI() { S = newGame(); start(S); mode = "game"; lastKey = ""; saveGame(); closeDrawer(); renderAll(true); window.scrollTo({ top: 0 }); }
function autoBest(S) {
  const b = beat(S);
  if (S.phase === "read" || S.phase === "end") { cont(S); return; }
  if (S.phase === "call") { const r = answer(S, b.ok ? "allow" : "step"); if (!r) answer(S, val(b.opts, S).findIndex(o => o.g === 2)); }
  else if (b.k === "who") answer(S, whoOptions(b).findIndex(o => o.key === b.ans));
  else if (b.k === "retro") answer(S, 0);
  else answer(S, val(b.opts, S).findIndex(o => o.g === 2));
  cont(S);
}
function jumpTo(sp) {
  S = newGame(); start(S);
  let guard = 0;
  while (S.sp < sp && guard++ < 1000) autoBest(S);
  S.score = 0; S.max = 0; S.results = []; S.trust = 70; S.fresh = [];
  mode = "game"; lastKey = ""; saveGame(); closeDrawer(); renderAll(false); window.scrollTo({ top: 0 });
}
function doCont() {
  cont(S); saveGame();
  const b = S.done ? null : beat(S);
  beep(b && b.k === "day" ? "day" : "tick");
  renderAll(true);
  if (narrow()) window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  else { const sb = document.querySelector(".scene-body"); if (sb) sb.scrollTop = 0; }
}
function doAnswer(x) {
  const r = answer(S, x);
  saveGame();
  if (r) beep(r.g === 2 && !r.falseAlarm ? "good" : r.g === 1 ? "tick" : "bad");
  renderAll(true);
}

document.addEventListener("click", e => {
  const t = e.target.closest("[data-act],[data-opt],[data-q],[data-role]");
  if (!t || t.disabled) return;
  if (watch.on && (t.dataset.opt !== undefined) && t.closest("#scene")) return;
  if (t.dataset.opt !== undefined) return doAnswer(+t.dataset.opt);
  if (t.dataset.q !== undefined) return quizPick(+t.dataset.q);
  if (t.dataset.role !== undefined) return blitzPick(t.dataset.role);
  const a = t.dataset.act;
  if (a === "wpause") return watchPause(!watch.paused);
  if (a === "wspeed") { watch.speed = watch.speed === 1 ? 2 : watch.speed === 2 ? 3 : 1; renderWatchbar(); if (!watch.paused) watchNext(400); return; }
  if (a === "wstop") return watchStop(false);
  if (a === "wmore") { watch.paused = false; cont(S); afterWatchMove(); return; }
  if (a === "watch") return watchStart();
  if (watch.on && t.closest("#scene") && !t.closest("#watchbar")) return;
  // Never replace a saved game without asking.
  if (/^(new|jump1|jump2|wplay)$/.test(a) && !t.dataset.sure && hasSave()) { menuConfirm = a; openDrawer("menu"); return; }
  if (a === "wplay") return watchStop(true);
  if (watch.on && /^(new|resume|jump1|jump2|blitz)$/.test(a)) watchQuiet();
  if (a === "cont") return doCont();
  if (a === "allow") return doAnswer("allow");
  if (a === "step") { answer(S, "step"); saveGame(); if (S.phase === "fb") { beep("bad"); renderAll(true); } else { beep("tick"); renderScene(); } return; }
  if (a === "new") return newGameUI();
  if (a === "resume") { S = loadGame(); mode = "game"; lastKey = ""; renderAll(false); return; }
  if (a === "quiz") return startQuiz();
  if (a === "qcheck") return quizCheck();
  if (a === "qnext") return quizNext();
  if (a === "blitz") { closeDrawer(); startBlitz(mode === "game" || (mode === "blitz" && blitz && blitz.from === "game") ? "game" : "title"); window.scrollTo({ top: 0 }); return; }
  if (a === "bnext") return nextBlitz(false);
  if (a === "blitzexit") { clearTimeout(blitz && blitz.timer); mode = blitz.from === "game" && S ? "game" : "title"; renderAll(false); return; }
  if (a === "guide") return openDrawer("guide");
  if (a === "closedrawer") return closeDrawer();
  if (a === "askrestart") { menuConfirm = true; openDrawer("menu"); return; }
  if (a === "cancelrestart") { menuConfirm = false; openDrawer("menu"); return; }
  if (a === "jump1") return jumpTo(1);
  if (a === "jump2") return jumpTo(2);
  if (a === "openboards") return setSheet(true);
  if (a === "toggleoffice") { office.hidden = !office.hidden; prefs.officeHidden = office.hidden; savePrefs(); officeShow(); return; }
});
$("btnGuide").onclick = () => openDrawer("guide");
$("btnMenu").onclick = () => openDrawer("menu");
$("drawer").addEventListener("click", e => { if (e.target === $("drawer")) closeDrawer(); });
function renderSound() { $("btnSound").setAttribute("aria-pressed", String(!!prefs.sound)); $("sndl").textContent = prefs.sound ? "Sound on" : "Sound off"; $("snd-wave").style.opacity = prefs.sound ? 1 : .2; }
$("btnSound").onclick = () => { prefs.sound = !prefs.sound; savePrefs(); renderSound(); beep("good"); };
function setSheet(open) { $("boards").classList.toggle("open", open); $("handle").setAttribute("aria-expanded", String(open)); $("openl").innerHTML = open ? '<span class="tx">Hide boards </span>▼' : '<span class="tx">Show boards </span>▲'; }
$("handle").onclick = () => setSheet(!$("boards").classList.contains("open"));
function setTab(diary) { $("tab-board").setAttribute("aria-selected", String(!diary)); $("tab-diary").setAttribute("aria-selected", String(diary)); $("board").hidden = diary; $("diary").hidden = !diary; $("legend").hidden = diary; }
$("tab-board").onclick = () => setTab(false);
$("tab-diary").onclick = () => setTab(true);
document.addEventListener("keydown", e => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  if ($("v-game").hidden || /input|textarea|select/i.test(e.target.tagName || "")) return;
  if (watch.on) { if (e.key === " " && e.target.tagName !== "BUTTON") { e.preventDefault(); watchPause(!watch.paused); } if (e.key === "Escape") watchStop(false); return; }
  if (!$("drawer").hidden) { if (e.key === "Escape") closeDrawer(); return; }
  if (e.key === "Escape" && $("boards").classList.contains("open")) return setSheet(false);
  const tag = (e.target.tagName || "").toLowerCase();
  if (e.key === "Enter" && tag !== "button") { const m = document.querySelector("#scene [data-main]:not([disabled])"); if (m) { e.preventDefault(); m.click(); } return; }
  if (/^[1-4]$/.test(e.key)) { const b = document.querySelector(`#scene [data-k="${e.key}"]:not([disabled])`); if (b) { e.preventDefault(); b.click(); } return; }
  if (S && mode === "game" && S.phase === "call") { if (e.key === "a" || e.key === "A") doAnswer("allow"); if (e.key === "s" || e.key === "S") document.querySelector('[data-act="step"]').click(); }
});

// ---------- Watch mode: a Sprint plays itself, with the Scrum Master's best calls ----------
// Runs on its own copy of the game, so it never touches the player's saved game.
const watch = { on: false, paused: false, speed: 1, timer: null, saved: null, savedMode: "title", caption: "", sp: 0, steps: 0 };
const textLen = (...a) => a.flat(3).filter(x => typeof x === "string").join(" ").length;
function watchStart() {
  clearTimeout(watch.timer);
  if (blitz) clearTimeout(blitz.timer);
  if (!watch.on) { watch.saved = mode === "game" && S && !S.preview ? S : loadGame(); watch.savedMode = mode; }
  closeDrawer();
  S = newGame(); start(S);
  Object.assign(watch, { on: true, paused: false, sp: 0, steps: 0, caption: "Sprint 1 begins" });
  mode = "game"; lastKey = ""; office.key = "";
  renderAll(true); window.scrollTo({ top: 0 });
  watchNext(1200);
}
function watchStop(play) {
  clearTimeout(watch.timer);
  watch.on = false; watch.paused = false;
  const saved = loadGame();
  if (play) { newGameUI(); return; }
  S = saved || watch.saved; mode = "title"; lastKey = ""; office.key = "";
  if (!S) { S = newGame(); SPRINTS[0].setup(S); S.view = { lines: [], opts: [], order: [] }; S.preview = true; }
  renderAll(false); window.scrollTo({ top: 0 });
}
// Leave Watch mode silently, putting the player's own game back first.
function watchQuiet() {
  clearTimeout(watch.timer); watch.on = false; watch.paused = false;
  S = loadGame() || watch.saved; mode = "title"; lastKey = ""; office.key = "";
  if (!S) { S = newGame(); SPRINTS[0].setup(S); S.view = { lines: [], opts: [], order: [] }; S.preview = true; }
  renderWatchbar();
}
function hasSave() { const sv = loadGame(); return !!(sv && !sv.done && (sv.pos > 0 || sv.sp > 0)); }
function watchPause(p) {
  if (!watch.on) return;
  watch.paused = p; clearTimeout(watch.timer);
  if (!p) watchNext(500);
  renderWatchbar();
}
function watchNext(ms) {
  clearTimeout(watch.timer);
  if (!watch.on || watch.paused) return;
  watch.timer = setTimeout(watchStep, Math.max(250, ms / watch.speed));
}
function bestPick(b) {
  if (S.phase === "call") return b.ok ? "allow" : "step";
  if (b.k === "who") return whoOptions(b).findIndex(o => o.key === b.ans);
  if (b.k === "retro" && S.phase !== "step") return 0;
  return val(b.opts, S).findIndex(o => o.g === 2);
}
function watchStep() {
  if (!watch.on || watch.paused || !S || S.done) return;
  const b = beat(S);
  watch.steps++;
  if (b.k === "end") {
    watch.paused = true;
    watch.caption = S.sp < 2 ? `Sprint ${S.sp + 1} is over. Play it yourself, or keep watching.` : "All three Sprints watched.";
    renderWatchbar(); return;
  }
  if (S.phase === "read" || b.k === "day") {
    cont(S); beep("tick"); afterWatchMove(); return;
  }
  if (S.phase === "fb") { cont(S); afterWatchMove(); return; }
  // A decision: show the Scrum Master thinking, then mark the pick, then make it.
  const pick = bestPick(b);
  const sel = typeof pick === "string" ? `#scene [data-act="${pick}"]` : `#scene [data-opt="${pick}"]`;
  const btn = document.querySelector(sel);
  watch.caption = typeof pick === "string" ? (pick === "allow" ? "The Scrum Master lets it happen." : "The Scrum Master steps in.") : "The Scrum Master picks: " + (btn ? btn.textContent.trim() : "the best response");
  if (btn) { btn.classList.add("picking"); btn.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" }); }
  renderWatchbar();
  watch.timer = setTimeout(() => {
    if (!watch.on || watch.paused) { btn && btn.classList.remove("picking"); return; }
    const r = answer(S, pick);
    if (r) beep(r.g === 2 && !r.falseAlarm ? "good" : "tick");
    renderAll(true);
    if (S.phase === "fb") { const v = document.querySelector("#scene .verdict"); v && v.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" }); }
    watch.caption = S.phase === "fb" ? "Why this is the Scrum way:" : "Choosing how to step in…";
    renderWatchbar();
    watchNext(S.phase === "fb" ? 2200 + Math.min(9000, textLen(S.res.fb, S.res.lines || [], b.g || []) * 22) : 2600);
  }, Math.max(350, 1300 / watch.speed));
}
function afterWatchMove() {
  renderAll(true);
  if (S.sp !== watch.sp) watch.sp = S.sp;
  if (narrow()) window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  else { const sb = document.querySelector(".scene-body"); if (sb) sb.scrollTop = 0; }
  if (S.done) { watch.paused = true; watch.caption = "All three Sprints watched."; renderWatchbar(); return; }
  const b = beat(S), v = S.view;
  if (b.k === "day") { watch.caption = `Day ${S.day}: the days since the last moment, fast-forward.`; renderWatchbar(); watchNext(reduced ? 2600 : 6200); return; }
  if (b.k === "end") { watch.caption = "The Sprint ends."; renderWatchbar(); watchNext(4200); return; }
  const talk = 1200 + v.lines.length * 380 + Math.min(9000, textLen(v.n || "", v.lines, v.act || "", v.q || "") * 24);
  watch.caption = S.phase === "call" ? "Someone acts on the board. Fine, or does it break Scrum?" : S.phase === "ask" ? "The Scrum Master thinks it over…" : b.k === "say" ? "Listen in." : "";
  renderWatchbar();
  watchNext(b.k === "say" ? talk + Math.min(6000, textLen(b.g || []) * 12) : talk);
}
function watchbarHtml() {
  const prog = Math.min(100, Math.round((S.sp * 10 + S.day) / 30 * 100));
  return `<div class="watchbar" id="watchbar" role="status"><b>${watch.paused ? "Paused" : "Watching"}</b><span>Sprint ${S.sp + 1}, day ${S.day}</span><span class="wprog" aria-hidden="true"><i style="width:${prog}%"></i></span><span class="wcap">${esc(watch.caption)}</span><span class="wbtns">${S.done || beat(S).k === "end" && watch.paused ? `${!S.done ? `<button type="button" data-act="wmore">Watch Sprint ${S.sp + 2}</button>` : ""}<button type="button" data-act="wplay">Play it yourself</button>` : `<button type="button" data-act="wpause" aria-pressed="${watch.paused}">${watch.paused ? "Resume" : "Pause"}</button><button type="button" data-act="wspeed" aria-label="Speed">${watch.speed}×</button>`}
<button type="button" data-act="wstop">Stop</button></span></div>`;
}
function renderWatchbar() {
  const old = $("watchbar");
  if (!watch.on || mode !== "game") { old && old.remove(); $("scene").classList.remove("watching"); return; }
  $("scene").classList.add("watching");
  if (old) old.outerHTML = watchbarHtml(); else $("scene").insertAdjacentHTML("afterbegin", watchbarHtml());
}

// ---------- Boot ----------
function boot(data) {
  renderSound(); officeInit();
  if (data && data.S && data.S.v === 2) { S = data.S; mode = data.mode === "game" ? "game" : "title"; }
  else {
    const saved = loadGame();
    if (saved) { S = saved; mode = "title"; }
    else { S = newGame(); SPRINTS[0].setup(S); S.view = { lines: [], opts: [], order: [] }; mode = "title"; S.preview = true; }
  }
  renderAll(false);
  route();
}
