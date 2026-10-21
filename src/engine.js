// ===== Engine: pure game state, no DOM. Story beats live in story.js. =====
const DEVS = ["priya", "tom", "lea"];
const DAYNAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PRODUCT_GOAL = "Customers book and pay for bike repairs online, without calling the shop.";
const NEXT_PRODUCT_GOAL = "Returning customers manage their bikes and bookings in one account.";
const PG_ITEMS = ["form", "price", "pay", "cal"];
const DOD_BASE = ["Code reviewed", "Automated tests pass", "Tested on phone and desktop"];

const CATALOG = {
  form: ["Online booking form", 6], price: ["Repair price estimate", 5], email: ["Booking confirmation email", 4],
  map: ["Shop map and opening hours", 4], sms: ["SMS reminder before pickup", 3], card: ["Card payment when booking", 10],
  pay: ["Pay by card when booking", 7], saved: ["Saved cards for returning customers", 3], cal: ["Booking calendar", 12],
  acct: ["Customer accounts", 8], banner: ["Winter check-up banner", 1], vouch: ["Gift vouchers", 4],
  loyal: ["Loyalty stamps", 5], invoice: ["Pay later by invoice", 4]
};
const PERKS = {
  pairing: { n: "Pair on the payment provider", line: "Pair on the payment provider, so more than one of us knows it." },
  requests: { n: "Agree how requests reach Jonas", line: "Agree with Maya and Hans that new requests go to Jonas." },
  autotest: { n: "Automate the phone tests", line: "Automate the phone tests, so checking Done gets faster." },
  timer: { n: "Timer for the Daily Scrum", line: "Use a timer at the Daily Scrum and hold technical talks right after it." },
  dodwall: { n: "Definition of Done on the wall", line: "Print the Definition of Done and hang it next to the board." },
  agenda: { n: "Sprint Review invitations", line: "Send Maya and Hans a short note before each Sprint Review on what to look at." }
};
const NAMES = { jonas: "Jonas", priya: "Priya", tom: "Tom", lea: "Lea", you: "You", maya: "Maya", hans: "Hans" };

const clone = o => JSON.parse(JSON.stringify(o));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const val = (x, S) => (typeof x === "function" ? x(S) : x);

function newGame() {
  const S = {
    v: 2, sp: 0, pos: -1, ev: null, pending: [], phase: "read", day: 1, t: "09:00", worked: 1,
    items: {}, pb: [], sb: [], inc: [], goal: null, goalItems: [], pgoal: PRODUCT_GOAL, pgoalDone: false,
    dod: DOD_BASE.slice(), dodStruck: false, on: { priya: null, tom: null, lea: null }, absent: {},
    perks: {}, flags: {}, lost: {}, score: 0, max: 0, trust: 60, results: [], sprintRes: [], diary: [],
    fresh: [], dayLog: [], mark: null, ghost: null, res: null, step: false, mood: null, done: false
  };
  return S;
}

// ----- Items and boards -----
function mk(S, id, size) {
  const c = CATALOG[id];
  S.items[id] = { id, n: c[0], s: size === undefined ? c[1] : size, prog: 0, where: "out", owner: null, blocked: 0, badge: null, st: null, kind: "pbi", tasks: 0, sp: null };
  return S.items[id];
}
function mkImp(S, key) {
  const id = "imp-" + key;
  S.items[id] = { id, n: PERKS[key].n, s: 1, prog: 0, where: "out", owner: null, blocked: 0, badge: null, st: null, kind: "imp", tasks: 1, sp: null };
  return S.items[id];
}
const BOARD_NAME = { pb: "Product Backlog", sb: "Sprint Backlog", inc: "Increment", out: "off the board" };
function note(S, text, why, icon) {
  const e = { sp: S.sp, d: S.day, t: S.t, text, why: why || "", icon: icon || "move" };
  S.diary.push(e); S.fresh.push(e);
}
function detach(S, id) { for (const b of ["pb", "sb", "inc"]) { const i = S[b].indexOf(id); if (i >= 0) S[b].splice(i, 1); } }
function move(S, id, to, why, pos) {
  const it = S.items[id]; const from = it.where;
  detach(S, id);
  if (to !== "out") { const L = S[to]; pos === undefined || pos >= L.length ? L.push(id) : L.splice(Math.max(0, pos), 0, id); }
  it.where = to;
  if (to === "inc") it.sp = S.sp;
  note(S, `“${it.n}”: ${from === "out" ? "new on the " + BOARD_NAME[to] : BOARD_NAME[from] + " → " + BOARD_NAME[to]}`, why, to);
}
function reorder(S, prio, why) {
  const rank = id => { const i = prio.indexOf(id); return i < 0 ? 99 : i; };
  const before = S.pb.join();
  S.pb.sort((a, b) => rank(a) - rank(b));
  for (const id of S.pb) if (S.items[id].badge === "Jonas re-orders") S.items[id].badge = null;
  if (S.pb.join() !== before) note(S, "Product Backlog re-ordered", why, "order");
}
const inSB = id => S => S.items[id] && S.items[id].where === "sb";
const isOpen = it => it.where === "sb" && it.prog < it.s && !it.st;
const workable = it => isOpen(it) && !(it.blocked > 0);
const sbItems = S => S.sb.map(id => S.items[id]);
const workersOf = (S, id) => DEVS.filter(d => S.on[d] === id);
const N = (S, id) => (S.items[id] ? S.items[id].n : CATALOG[id][0]);

function pickNext(S, dev) {
  const c = sbItems(S).filter(workable);
  if (!c.length) return null;
  const free = c.find(it => workersOf(S, it.id).filter(x => x !== dev).length === 0);
  if (free) return free;
  return c.slice().sort((a, b) => (b.s - b.prog) - (a.s - a.prog))[0];
}

function finish(S, it, log, sim) {
  if (it.kind === "imp") { it.st = "done"; if (!sim) note(S, `Improvement “${it.n}” done`, "The team planned it at the last Retrospective", "imp"); return; }
  if (!sim && S.flags.dodDropped && S.sp === 1) it.untested = true;
  if (sim) { detach(S, it.id); S.inc.push(it.id); it.where = "inc"; return; }
  move(S, it.id, "inc", S.flags.dodDropped && S.sp === 1 ? "Marked Done without the phone tests" : "Meets the Definition of Done");
  if (S.sp >= 1 && S.flags.release === "early" && !it.untested) it.live = true;
  if (S.sp === 1 && !S.flags.release && !S.flags.dodDropped && !S.pending.includes("release")) { S.flags.release = "asked"; S.flags.releaseItem = it.id; S.pending.push("release"); }
  log && log.push(`“${it.n}” meets the Definition of Done and joins the Increment.`);
}

function work(S, d, log, sim) {
  for (const dev of DEVS) {
    if ((S.absent[dev] || []).includes(d)) { log && log.push(`${NAMES[dev]} is off sick.`); continue; }
    if (S.lost && (S.lost[dev] || []).includes(d)) { log && log.push(S.flags.stopped ? `${NAMES[dev]} stops work, as the Scrum Master said.` : `${NAMES[dev]} spends the day switching to new work.`); continue; }
    let it = S.items[S.on[dev]];
    if (!it || !workable(it)) {
      const nx = pickNext(S, dev);
      if (log && nx && (!it || nx.id !== it.id)) log.push(`${NAMES[dev]} picks up “${nx.n}”.`);
      it = nx; S.on[dev] = it ? it.id : null;
    }
    if (!it) continue;
    it.prog = Math.min(it.s, it.prog + 1);
  }
  for (const it of sbItems(S)) {
    if (it.prog >= it.s && !it.st) {
      if (!sim && it.trap && !S.flags[it.trap]) { it.st = "testing"; it.badge = "Testing"; S.flags[it.trap] = "pending"; S.pending.push(it.trap); }
      else finish(S, it, log, sim);
    }
  }
  for (const it of sbItems(S)) {
    if (it.blocked > 0 && it.blocked < 90) {
      it.blocked--;
      if (!it.blocked) { it.badge = null; if (it.owner && (S.absent[it.owner] || []).indexOf(d + 1) < 0) S.on[it.owner] = it.id; log && log.push(`“${it.n}” is unblocked${it.owner ? `; ${NAMES[it.owner]} is back on it` : ""}.`); }
    }
  }
  for (const dev of DEVS) { const it = S.items[S.on[dev]]; if (it && !workable(it)) S.on[dev] = null; }
}

// Which Sprint Backlog items would still be unfinished after day 9, if nothing else happens?
function forecast(S) {
  const T = clone({ items: S.items, sb: S.sb, inc: S.inc, pb: S.pb, on: S.on, absent: S.absent, flags: S.flags, pending: [], sp: S.sp, diary: [], fresh: [] });
  for (const it of Object.values(T.items)) if (it.st === "testing") { it.st = null; it.prog = Math.max(0, it.s - 1); }
  for (let d = S.worked + 1; d <= 9; d++) work(T, d, null, true);
  return T.sb.filter(id => T.items[id].kind === "pbi" && T.items[id].where === "sb");
}
function goalStatus(S) {
  if (S.goalResult) return S.goalResult;
  if (!S.goal || S.goalItems.some(id => S.items[id].where === "pb" && S.day === 1)) return "none";
  if (S.goalItems.every(id => S.items[id].where === "inc" && !S.items[id].bad && !S.items[id].untested)) return "done";
  if (S.goalItems.some(id => S.items[id].blocked >= 90)) return "risk";
  const f = forecast(S);
  return S.goalItems.some(id => f.includes(id)) ? "risk" : "track";
}

// When the Developers run out of planned work, they pull in more with Jonas, as long as the Sprint Goal stays safe.
function pull(S, d, log) {
  if (d > 8 || sbItems(S).some(workable)) return;
  if (S.goal && goalStatus(S) === "risk") return;
  const devs = DEVS.filter(x => !(S.absent[x] || []).includes(d)).length;
  const room = devs * (9 - d + 1);
  const ok = it => !it.notReady && it.droppedSp !== S.sp && (it.holdSp || 0) <= S.sp && it.s && it.s <= room;
  const id = S.pb.find(id => ok(S.items[id]));
  if (!id) return;
  move(S, id, "sb", "Pulled in by the Developers with Jonas; the Sprint Goal is safe");
  S.items[id].tasks = Math.max(2, Math.round(S.items[id].s * 0.7));
  log && log.push(`Everything planned is Done or in progress, so the Developers agree with Jonas to pull in “${S.items[id].n}”.`);
}
function runDays(S, upTo) {
  const log = [];
  for (let d = S.worked + 1; d <= upTo - 1; d++) { if (d >= 2) { pull(S, d, log); work(S, d, log); } S.worked = d; }
  return log;
}

// ----- Beat flow -----
function beat(S) { return S.ev ? EVENTS[S.ev] : SPRINTS[S.sp].beats[S.pos]; }
function enter(S, b) {
  if (b.d) S.day = val(b.d, S); else if (S.ev) S.t = "09:15";
  if (b.t) S.t = b.t;
  if (b.k === "day") { S.t = "09:00"; S.clipFrom = S.worked + 1; S.dayLog = runDays(S, S.day); }
  if (b.pre) b.pre(S);
  const opts = b.k === "who" ? whoOptions(b) : (val(b.opts, S) || []);
  const order = opts.map((o, i) => i);
  if (b.k !== "retro") for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  S.view = { n: val(b.n, S) || "", lines: val(b.lines, S) || [], act: val(b.act, S) || "", q: val(b.q, S) || "", opts: opts.map(o => o.t), order };
  if (b.k === "say" && b.post) b.post(S);
  S.phase = { say: "read", day: "read", who: "ask", choice: "ask", call: "call", retro: "ask", end: "end" }[b.k];
  S.res = null; S.step = false; S.mood = null;
}
function cont(S) {
  S.fresh = []; S.mark = null; S.ghost = null;
  if (S.phase === "end") { nextSprint(S); if (S.done) return; }
  for (let guard = 0; guard < 200; guard++) {
    if (S.pending.length) S.ev = S.pending.shift();
    else { S.ev = null; S.pos++; }
    const b = beat(S);
    if (b.if && !b.if(S)) continue;
    enter(S, b); return;
  }
}
function nextSprint(S) {
  S.sp++; S.pos = -1;
  if (S.sp >= SPRINTS.length) { S.done = true; S.phase = "final"; return; }
  S.day = 1; S.t = "09:00"; S.worked = 1; S.goal = null; S.goalItems = []; S.goalResult = null;
  S.on = { priya: null, tom: null, lea: null }; S.absent = {}; S.lost = {}; S.pending = [];
  if (SPRINTS[S.sp].setup) SPRINTS[S.sp].setup(S);
}
function start(S) { SPRINTS[0].setup(S); cont(S); }

const PTS = [0, 5, 10];
function grade(S, g, label, kind) {
  S.score += PTS[g]; S.max += 10;
  S.trust = clamp(S.trust + (g === 2 ? 4 : g === 1 ? 0 : -6), 0, 100);
  S.results.push({ sp: S.sp, label, g, kind });
  S.mood = g === 2 ? "happy" : g === 1 ? "neutral" : "worried";
}

// x: option index for who/choice/retro; "allow" | "step" | option index for call
function answer(S, x) {
  const b = beat(S);
  let res = { g: 2, fb: "", head: "" };
  if (b.k === "who") {
    const opts = whoOptions(b);
    const o = opts[x]; const ok = o.key === b.ans;
    res = { g: ok ? 2 : 0, fb: ok ? val(b.fb, S) : `${o.wrong || ""} ${val(b.fb, S)}`.trim(), pick: x, ans: opts.findIndex(o => o.key === b.ans) };
    grade(S, res.g, val(b.label, S), "who");
    b.fx && b.fx(S);
  } else if (b.k === "choice") {
    const o = val(b.opts, S)[x];
    res = { g: o.g, fb: o.fb, pick: x, ans: val(b.opts, S).findIndex(o => o.g === 2) };
    grade(S, o.g, val(b.label, S), "choice");
    o.fx && o.fx(S); b.fx && b.fx(S, o);
  } else if (b.k === "retro") {
    const o = val(b.opts, S)[x];
    res = { g: 2, fb: val(b.fb, S), pick: x, ans: x, nograde: true };
    o.fx && o.fx(S); b.fx && b.fx(S, o);
  } else if (b.k === "call") {
    if (S.phase === "call" && x === "allow") {
      res = { g: b.ok ? 2 : 0, fb: val(b.allowFb, S), call: "allow" };
      grade(S, res.g, val(b.label, S), "call");
      b.onAllow && b.onAllow(S);
    } else if (S.phase === "call" && x === "step") {
      if (b.ok) {
        res = { g: 0, fb: val(b.stepFb, S), call: "step", falseAlarm: true };
        grade(S, 0, val(b.label, S), "call");
        b.onAllow && b.onAllow(S);
      } else { S.phase = "step"; S.step = true; return null; }
    } else {
      const o = val(b.opts, S)[x];
      const g = o.g;
      res = { g, fb: o.fb, call: "step", pick: x, ans: val(b.opts, S).findIndex(o => o.g === 2) };
      S.score += [4, 7, 10][g]; S.max += 10; S.trust = clamp(S.trust + (g === 2 ? 4 : g === 1 ? 1 : -3), 0, 100);
      S.results.push({ sp: S.sp, label: val(b.label, S), g: g === 0 ? 1 : g, kind: "call" });
      S.mood = g === 2 ? "happy" : "neutral";
      o.fx && o.fx(S);
    }
    b.after && b.after(S, res);
  }
  if (b.post) b.post(S, res);
  S.res = res;
  res.lines = val(b.then, S) || null;
  S.phase = "fb";
  return res;
}
function whoOptions(b) {
  return b.opts || [
    { key: "po", t: "Jonas, the Product Owner", wrong: "Not the Product Owner alone." },
    { key: "dev", t: "Priya, Tom and Lea, the Developers", wrong: "Not the Developers alone." },
    { key: "team", t: "The whole Scrum Team", wrong: "Not the whole Scrum Team." },
    { key: "sm", t: "You, the Scrum Master", wrong: "Not the Scrum Master." }
  ];
}

// helpers used by story beats
function block(S, id, days, badge) { const it = S.items[id]; it.blocked = days; it.badge = badge || "Blocked"; note(S, `“${it.n}” is ${(badge || "blocked").toLowerCase()}`, "", "block"); }
function unblock(S, id, why) { const it = S.items[id]; if (!it.blocked) return; it.blocked = 0; it.badge = null; if (it.owner) S.on[it.owner] = id; note(S, `“${it.n}” is unblocked`, why, "unblock"); }
function assign(S, dev, id) { S.on[dev] = id; if (id && !S.items[id].owner) S.items[id].owner = dev; }
function select(S, cap, extra, why) {
  const picked = []; let sum = 0;
  for (const id of S.pb.slice()) {
    const it = S.items[id];
    if (it.notReady) continue;
    if (sum + it.s <= cap) { picked.push(id); sum += it.s; }
  }
  if (extra) {
    for (const id of S.pb) if (!picked.includes(id) && !S.items[id].notReady) { picked.push(id); break; }
  }
  for (const id of picked) move(S, id, "sb", why);
  return picked;
}
function returnUnfinished(S, why) {
  const out = [];
  for (const id of S.sb.slice()) {
    const it = S.items[id];
    if (it.kind === "imp") { move(S, id, "out", it.st === "done" ? "Improvement done; it leaves the board" : "Improvement not finished; the team can raise it again"); continue; }
    it.st = null; it.badge = null; it.blocked = 0; it.owner = null; it.deferred = false;
    move(S, id, "pb", why || "Not Done at the end of the Sprint: back to the Product Backlog");
    out.push(id);
  }
  S.on = { priya: null, tom: null, lea: null };
  return out;
}
function unfinishedPBIs(S) { return S.sb.filter(id => S.items[id].kind === "pbi" && S.items[id].where === "sb"); }
function goalMet(S) { return S.goalItems.every(id => S.items[id].where === "inc" && !S.items[id].bad && !S.items[id].untested); }

if (typeof module !== "undefined") module.exports = { newGame, start, cont, answer, beat, forecast, goalStatus, whoOptions };
