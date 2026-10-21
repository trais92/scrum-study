// ---------- Office map: people walk to where each moment happens; days play as a short fast-forward ----------
// Coordinates are map units on a 1000 × 600 floor plan.
const ROOMS = [
  { id: "jonas", name: "Product Owner", cls: "office", x: 8, y: 8, w: 222, h: 232, door: 175 },
  { id: "workshop", name: "Workshop", cls: "meet", x: 240, y: 8, w: 400, h: 232, door: 440 },
  { id: "hans", name: "Head of department", cls: "office", x: 650, y: 8, w: 342, h: 232, door: 720 },
  { id: "team", name: "Team room", cls: "work", x: 8, y: 330, w: 492, h: 262, door: 250 },
  { id: "lounge", name: "Lounge", cls: "lounge", x: 510, y: 330, w: 210, h: 262, door: 615 },
  { id: "shop", name: "Shop floor", cls: "shop", x: 730, y: 330, w: 262, h: 262, door: 800 }
];
const ROOM = Object.fromEntries(ROOMS.map(r => [r.id, r]));
const CORR_Y = 285;
const HOME = { jonas: [110, 112, "jonas"], hans: [840, 108, "hans"], maya: [905, 432, "shop"], priya: [80, 420, "team"], tom: [190, 420, "team"], lea: [300, 420, "team"], you: [420, 420, "team"] };
const SEATS = {
  workshop: [[365, 76], [440, 76], [515, 76], [590, 76], [365, 192], [440, 192], [515, 192], [590, 192]],
  lounge: [[565, 420], [665, 420], [565, 525], [665, 525], [615, 395], [615, 555], [540, 472], [690, 472]],
  team: [[180, 500], [260, 500], [340, 500]],
  shop: [[790, 540], [860, 545], [935, 540]],
  hans: [[770, 190], [850, 195], [930, 190]],
  jonas: [[60, 192], [130, 198], [200, 190]]
};
const DAILY = { priya: [110, 528], tom: [200, 540], lea: [290, 528] };
const office = { el: null, pos: {}, room: {}, anims: [], timers: [], key: "", hidden: false };

function officeInit() {
  const el = $("office"); office.el = el;
  let h = `<div class="corr" style="left:0;top:${240 / 6}%;width:100%;height:${90 / 6}%"></div>`;
  for (const r of ROOMS) {
    h += `<div class="room ${r.cls}" id="room-${r.id}" style="left:${r.x / 10}%;top:${r.y / 6}%;width:${r.w / 10}%;height:${r.h / 6}%"><span class="rname">${r.name}</span></div>`;
    h += `<div class="door" style="left:${(r.door - 30) / 10}%;top:${(r.y < 240 ? 232 : 322) / 6}%;width:6%;height:${16 / 6}%"></div>`;
  }
  const box = (x, y, w, hh, cls) => `<div class="${cls || "furn"}" style="left:${x / 10}%;top:${y / 6}%;width:${w / 10}%;height:${hh / 6}%"></div>`;
  h += box(60, 138, 100, 22) + box(26, 40, 40, 56, "furn shelf");      // PO desk and shelf
  h += box(790, 134, 100, 22) + box(948, 30, 32, 60, "furn shelf");    // Hans desk and cabinet
  h += box(310, 104, 280, 58, "furn table");                           // Workshop table
  h += box(254, 30, 7, 110, "furn screen");                            // Workshop screen
  for (const k of ["priya", "tom", "lea", "you"]) h += box(HOME[k][0] - 40, 446, 80, 22);
  h += `<div class="sboard" id="sboard" style="left:${30 / 10}%;top:${566 / 6}%;width:${360 / 10}%;height:${22 / 6}%"></div>`;
  h += box(580, 450, 70, 50, "furn round");                            // Lounge table
  h += box(545, 362, 150, 14);                                         // Kitchen counter
  h += box(840, 470, 130, 18);                                         // Shop counter
  h += `<div class="wheel" style="left:${752 / 10}%;top:${392 / 6}%;width:3.4%;aspect-ratio:1"></div><div class="wheel" style="left:${795 / 10}%;top:${392 / 6}%;width:3.4%;aspect-ratio:1"></div>`;
  h += `<span class="ftag" style="left:${210 / 10}%;top:${545 / 6}%">Scrum board</span>`;
  h += `<span class="ftag" style="left:${790 / 10}%;top:${452 / 6}%">repair stand</span>`;
  for (const id of Object.keys(HOME)) h += `<div class="tok${id === "you" ? " you" : ""}" id="tok-${id}"><span class="fc"></span><span class="nm">${esc(NAMES[id])}</span><span class="bub" aria-hidden="true"></span></div>`;
  h += `<div class="oclock" id="oclock" hidden><b id="oclock-t"></b><span id="oclock-l"></span></div>`;
  h += `<button class="otoggle" id="otoggle" type="button" data-act="toggleoffice">Hide office</button>`;
  el.innerHTML = h;
  for (const id of Object.keys(HOME)) { office.pos[id] = HOME[id].slice(0, 2); office.room[id] = HOME[id][2]; place(id); }
  office.hidden = !!prefs.officeHidden; officeShow();
}
function officeShow() {
  $("leftcol").classList.toggle("nooffice", office.hidden);
  $("otoggle").textContent = office.hidden ? "Show office" : "Hide office";
}
function place(id) { const t = $("tok-" + id), [x, y] = office.pos[id]; t.style.left = x / 10 + "%"; t.style.top = y / 6 + "%"; }
const roomAt = (x, y) => (ROOMS.find(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) || {}).id || "corr";
function pathFor(from, fromRoom, to, toRoom) {
  if (fromRoom === toRoom) return [from, to];
  const pts = [from];
  const A = ROOM[fromRoom], B = ROOM[toRoom];
  if (A) { const dy = A.y < 240 ? 220 : 345; pts.push([A.door, dy], [A.door, CORR_Y]); }
  if (B) { const dy = B.y < 240 ? 220 : 345; pts.push([B.door, CORR_Y], [B.door, dy]); }
  pts.push(to);
  return pts;
}
function walk(id, to, toRoom, delay) {
  const t = $("tok-" + id);
  const from = office.pos[id];
  if (from[0] === to[0] && from[1] === to[1]) return 0;
  const r0 = office.room[id] === undefined ? roomAt(from[0], from[1]) : office.room[id];
  const pts = pathFor(from, r0, to, toRoom);
  office.pos[id] = to; office.room[id] = toRoom;
  if (reduced || !t.animate) { place(id); return 0; }
  const segs = []; let len = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(d); len += d; }
  const dur = Math.max(450, Math.min(1900, len * 1.5));
  let acc = 0;
  const frames = pts.map((p, i) => { if (i) acc += segs[i - 1]; return { left: p[0] / 10 + "%", top: p[1] / 6 + "%", offset: len ? acc / len : i / (pts.length - 1) }; });
  place(id);
  const a = t.animate(frames, { duration: dur, delay: delay || 0, easing: "ease-in-out", fill: "backwards" });
  t.classList.add("walk");
  a.onfinish = a.oncancel = () => t.classList.remove("walk");
  office.anims.push(a);
  return dur + (delay || 0);
}
function officeStop() {
  for (const a of office.anims) { try { a.commitStyles && a.commitStyles(); } catch (e) {} a.cancel(); }
  office.anims = [];
  for (const t of office.timers) clearTimeout(t);
  office.timers = [];
  document.querySelectorAll("#office .tok").forEach(t => t.classList.remove("speak", "work", "walk", "daily"));
  $("oclock").hidden = true;
  // A walk cut short leaves its token mid-step: the next walk starts from there.
  for (const id of Object.keys(HOME)) {
    const t = $("tok-" + id), x = parseFloat(t.style.left) * 10, y = parseFloat(t.style.top) * 6;
    if (isFinite(x) && isFinite(y)) { office.pos[id] = [x, y]; const r = roomAt(x, y); if (r !== office.room[id]) office.room[id] = r === "corr" ? null : r; }
  }
}
const later = (ms, f) => office.timers.push(setTimeout(f, ms));

// Where everyone stands for one moment of the story.
function spotsFor(b) {
  const at = ROOM[b.at] ? b.at : "team";
  const cast = (b.cast || []).filter(c => HOME[c]);
  const out = {};
  for (const id of Object.keys(HOME)) out[id] = [HOME[id][0], HOME[id][1], HOME[id][2]];
  if (at === "workshop" || at === "lounge") {
    const seats = SEATS[at];
    const order = ["jonas", "priya", "tom", "lea", "maya", "hans", "you"].filter(c => cast.includes(c));
    order.forEach((c, i) => { const s = seats[i % seats.length]; out[c] = [s[0], s[1], at]; });
  } else {
    let v = 0;
    for (const c of cast) {
      if (HOME[c][2] === at) continue;
      const s = SEATS[at][v++ % SEATS[at].length]; out[c] = [s[0], s[1], at];
    }
  }
  return out;
}
function setMoods() {
  for (const id of Object.keys(HOME)) { const fc = document.querySelector(`#tok-${id} .fc`); const m = moodOf(id); if (fc.dataset.m !== m) { fc.innerHTML = face(id, m); fc.dataset.m = m; } }
}
function renderSboard() {
  const el = $("sboard");
  if (!S || mode !== "game" || S.done) { el.innerHTML = "<div></div><div></div><div></div>"; return; }
  const sb = S.sb.map(id => S.items[id]).filter(it => it.kind === "pbi" && it.where === "sb");
  const sq = it => `<i class="${it.blocked ? "blk" : ""}"></i>`;
  const todo = sb.filter(it => !it.prog), doing = sb.filter(it => it.prog);
  const done = S.inc.filter(id => S.items[id].sp === S.sp);
  el.innerHTML = `<div>${todo.map(sq).join("")}</div><div class="doing">${doing.map(sq).join("")}</div><div class="done">${done.map(() => "<i></i>").join("")}</div>`;
}
function speakSeq(lines, start) {
  const ids = lines.map(l => l[0]).filter(w => HOME[w]);
  ids.forEach((w, i) => later(start + i * 380, () => {
    document.querySelectorAll("#office .tok.speak").forEach(t => t.classList.remove("speak"));
    $("tok-" + w).classList.add("speak");
  }));
}
function setRoom(at) { document.querySelectorAll("#office .room").forEach(r => r.classList.toggle("on", r.id === "room-" + at)); }

// Called after every renderScene.
function officeUpdate() {
  if (!office.el) return;
  const show = mode === "title" || (mode === "game" && S && !S.done);
  $("leftcol").classList.toggle("officeoff", !show);
  setMoods(); renderSboard();
  if (!show) return;
  if (mode === "title" || !S) { officeIdle(); return; }
  const b = beat(S);
  const key = `${S.sp}-${S.pos}-${S.ev}-${S.day}-${S.phase}`;
  if (key === office.key) return;
  const sameBeat = office.key.split("-").slice(0, 4).join("-") === key.split("-").slice(0, 4).join("-");
  office.key = key;
  officeStop();
  if (b.k === "day") { dayClip(); return; }
  if (b.k === "end") { setRoom("lounge"); const sp = spotsFor({ at: "lounge", cast: ["jonas", "priya", "tom", "lea", "you"] }); for (const id in sp) walk(id, sp[id].slice(0, 2), sp[id][2], 0); return; }
  for (const d of DEVS) { $("tok-" + d).classList.toggle("off", (S.absent[d] || []).includes(S.day)); $("tok-" + d).classList.toggle("stuck", S.sb.some(id => S.items[id].blocked && S.items[id].owner === d)); }
  setRoom(b.at);
  const sp = spotsFor(b);
  let arrive = 0, n = 0;
  for (const id in sp) { const d = walk(id, sp[id].slice(0, 2), sp[id][2], (n++ % 4) * 70); arrive = Math.max(arrive, d); }
  const lines = S.phase === "fb" ? (S.res && S.res.lines) || [] : sameBeat ? [] : S.view.lines;
  speakSeq(lines, sameBeat ? 0 : Math.min(arrive, 900));
}
function officeIdle() {
  officeStop(); office.key = "";
  setRoom(null);
  for (const id of Object.keys(HOME)) walk(id, HOME[id].slice(0, 2), HOME[id][2], 0);
  for (const d of DEVS) $("tok-" + d).classList.add("work");
}

// The days since the last moment, played back fast: work at the desks, then the Daily Scrum at the Scrum board.
function dayClip() {
  setRoom("team");
  const last = S.day - 1, first = Math.min(last, S.clipFrom || last);
  const absent = d => (S.absent[d] || []).includes(last);
  const clock = $("oclock"), ct = $("oclock-t"), cl = $("oclock-l");
  for (const id of Object.keys(HOME)) walk(id, HOME[id].slice(0, 2), HOME[id][2], 0);
  for (const d of DEVS) $("tok-" + d).classList.toggle("off", absent(d));
  const blockedOwners = DEVS.filter(d => S.sb.some(id => S.items[id].blocked && S.items[id].owner === d));
  for (const d of DEVS) $("tok-" + d).classList.toggle("stuck", blockedOwners.includes(d));
  if (last < 1) return;
  clock.hidden = false;
  cl.textContent = first < last ? `Days ${first}–${last}, fast-forward` : "Yesterday, fast-forward";
  const hm = m => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const tick = (from, to, ms, t0) => { const steps = 8; for (let i = 0; i <= steps; i++) later(t0 + (ms * i) / steps, () => { const m = from + ((to - from) * i) / steps; ct.textContent = `Day ${last} · ${hm(m - (m % 15))}`; }); };
  if (reduced) { ct.textContent = `Day ${S.day} · 09:00`; cl.textContent = "New day"; return; }
  const devsIn = DEVS.filter(d => !absent(d));
  devsIn.forEach(d => $("tok-" + d).classList.add("work"));
  tick(540, 810, 1300, 200);
  later(1550, () => {
    cl.textContent = "Daily Scrum, 15 minutes";
    devsIn.forEach(d => { $("tok-" + d).classList.remove("work"); walk(d, DAILY[d], "team", 0); $("tok-" + d).classList.add("daily"); });
    $("sboard").classList.add("hot");
  });
  later(3000, () => {
    $("sboard").classList.remove("hot");
    cl.textContent = first < last ? `Days ${first}–${last}, fast-forward` : "Yesterday, fast-forward";
    devsIn.forEach(d => { $("tok-" + d).classList.remove("daily"); walk(d, HOME[d].slice(0, 2), "team", 0); });
  });
  later(3700, () => devsIn.forEach(d => $("tok-" + d).classList.add("work")));
  tick(825, 1020, 1200, 3700);
  later(5100, () => { devsIn.forEach(d => $("tok-" + d).classList.remove("work")); ct.textContent = `Day ${S.day} · 09:00`; cl.textContent = "Next morning"; for (const d of DEVS) $("tok-" + d).classList.toggle("off", (S.absent[d] || []).includes(S.day)); });
}

// ---------- Start page preview: the same office, looping a short day (Sprint Planning, work, Daily Scrum) ----------
function officePreviewHtml() {
  const fill = { meet: "var(--o-meet)", work: "var(--o-room)", office: "var(--o-room)", lounge: "var(--o-lounge)", shop: "var(--o-shop)" };
  let h = `<svg viewBox="0 0 1000 600" role="img" aria-label="The Spoke Repairs office: the team walks to Sprint Planning, works, and meets at the Scrum board for the Daily Scrum."><rect width="1000" height="600" fill="var(--o-wall)"/><rect x="0" y="240" width="1000" height="90" fill="var(--o-floor)"/>`;
  for (const r of ROOMS) {
    h += `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="3" fill="${fill[r.cls]}"${r.id === "workshop" ? ' id="pv-ws"' : ""}/>`;
    h += `<rect x="${r.door - 30}" y="${r.y < 240 ? 232 : 322}" width="60" height="16" fill="var(--o-floor)"/>`;
    h += `<text x="${r.x + 8}" y="${r.y + 24}" font-size="22" font-weight="700" fill="var(--muted)" style="font-family:var(--f-mono);text-transform:uppercase;letter-spacing:.07em">${r.name.toUpperCase()}</text>`;
  }
  const furn = (x, y, w, hh, rx, f) => `<rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="${rx || 3}" fill="${f || "var(--o-furn)"}" stroke="var(--o-furn-line)"/>`;
  h += furn(60, 138, 100, 22) + furn(790, 134, 100, 22) + furn(310, 104, 280, 58) + furn(580, 450, 70, 50, 24) + furn(545, 362, 150, 14) + furn(840, 470, 130, 18);
  for (const k of ["priya", "tom", "lea", "you"]) h += furn(HOME[k][0] - 40, 446, 80, 22);
  const anim = !reduced;
  // Scrum board, glowing during the Daily Scrum
  h += `<rect x="30" y="566" width="360" height="22" rx="2" fill="var(--o-board)" stroke="var(--o-furn-line)"/>`;
  h += `<rect x="27" y="563" width="366" height="28" rx="4" fill="none" stroke="var(--accent)" stroke-width="5" opacity="0">${anim ? `<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;.72;.75;.88;.9;1" dur="16s" repeatCount="indefinite"/>` : ""}</rect>`;
  h += `<rect x="241" y="9" width="398" height="230" rx="3" fill="none" stroke="var(--accent)" stroke-width="5" opacity="0">${anim ? `<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;.26;.29;.46;.49;1" dur="16s" repeatCount="indefinite"/>` : ""}</rect>`;
  // Who walks where. Each list: [time 0..1, x, y]
  const ws = (x, y) => [[.08, ...HOMEPT], [.14, DOOR_T, 345], [.17, DOOR_T, 285], [.21, 440, 285], [.24, 440, 220], [.28, x, y], [.46, x, y], [.5, 440, 220], [.53, 440, 285], [.57, DOOR_T, 285], [.6, DOOR_T, 345]];
  const DOOR_T = 250; let HOMEPT;
  const plans = {};
  for (const [id, seat, daily] of [["priya", [365, 192], DAILY.priya], ["tom", [440, 192], DAILY.tom], ["lea", [515, 192], DAILY.lea], ["you", [590, 192], null]]) {
    HOMEPT = HOME[id].slice(0, 2);
    const p = [[0, ...HOMEPT], ...ws(...seat), [.64, ...HOMEPT]];
    if (daily) p.push([.72, ...HOMEPT], [.75, ...daily], [.88, ...daily], [.91, ...HOMEPT]);
    p.push([1, ...HOMEPT]);
    plans[id] = p;
  }
  const J = HOME.jonas.slice(0, 2);
  plans.jonas = [[0, ...J], [.1, ...J], [.15, 175, 220], [.18, 175, 285], [.21, 440, 285], [.24, 440, 220], [.28, 440, 76], [.46, 440, 76], [.5, 440, 220], [.53, 440, 285], [.56, 175, 285], [.59, 175, 220], [.64, ...J], [1, ...J]];
  plans.maya = [[0, ...HOME.maya.slice(0, 2)], [1, ...HOME.maya.slice(0, 2)]];
  plans.hans = [[0, ...HOME.hans.slice(0, 2)], [1, ...HOME.hans.slice(0, 2)]];
  for (const [id, p] of Object.entries(plans)) {
    const f = face(id, "happy").replace("<svg ", '<svg x="-21" y="-21" width="42" height="42" ');
    const mv = anim && p.length > 2 ? `<animateMotion dur="16s" repeatCount="indefinite" calcMode="linear" keyTimes="${p.map(q => q[0]).join(";")}" values="${p.map(q => q[1] + "," + q[2]).join(";")}"/>` : "";
    h += `<g transform="translate(0 0)"><g${mv ? "" : ` transform="translate(${p[0][1]} ${p[0][2]})"`}><circle r="24" fill="var(--panel)"/>${id === "you" ? '<circle r="27" fill="none" stroke="var(--c-you)" stroke-width="4"/>' : ""}${f}${mv}</g></g>`;
  }
  // Caption
  const cap = (txt, vals, kt) => `<text x="500" y="318" text-anchor="middle" font-size="25" class="pv-cap" fill="var(--ink)" opacity="${anim ? 0 : 1}">${txt}${anim ? `<animate attributeName="opacity" values="${vals}" keyTimes="${kt}" dur="16s" repeatCount="indefinite"/>` : ""}</text>`;
  h += anim ? cap("Sprint Planning in the workshop", "0;0;1;1;0;0", "0;.2;.24;.46;.5;1") + cap("Working on the Sprint Backlog", "1;1;0;0;1;1;0;0;1;1", "0;.06;.1;.6;.64;.7;.73;.9;.93;1") + cap("Daily Scrum at the board, 15 minutes", "0;0;1;1;0;0", "0;.71;.74;.88;.91;1")
    : cap("Spoke Repairs: the office of your Scrum Team");
  return h + "</svg>";
}
