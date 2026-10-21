const fs = require("fs"), vm = require("vm");
const dir = __dirname + "/../v2/";
const code = fs.readFileSync(dir + "engine.js", "utf8").replace(/if \(typeof module[^\n]*\n/g, "") + "\n" + fs.readFileSync(dir + "story.js", "utf8").replace(/if \(typeof module[^\n]*\n/g, "") + "\n;globalThis.API={newGame,start,cont,answer,beat,forecast,goalStatus,whoOptions,SPRINTS,EVENTS,BLITZ,Q,val};";
function load() { const ctx = { console, JSON, Math }; vm.createContext(ctx); vm.runInContext(code, ctx); return ctx.API; }
const A = load();
// policy: "best" | "random" | "worst"
function play(policy, verbose) {
  const S = A.newGame(); A.start(S);
  const trace = [];
  let steps = 0;
  while (!S.done && steps++ < 2000) {
    const b = A.beat(S);
    const tag = `S${S.sp + 1} D${S.day} ${S.t} ${b.k} ${A.val(b.label, S) || ""}`;
    // invariants
    for (const id of S.sb) if (S.items[id].where !== "sb") throw new Error("where mismatch " + id);
    for (const id of S.pb) if (S.items[id].where !== "pb") throw new Error("where mismatch " + id);
    for (const id of S.inc) if (S.items[id].where !== "inc") throw new Error("where mismatch " + id);
    const all = [...S.pb, ...S.sb, ...S.inc]; if (new Set(all).size !== all.length) throw new Error("dup " + all);
    for (const id of S.pb) if (S.items[id].s == null && S.sp > 0) throw new Error("unsized " + id);
    for (const [w, t] of S.view.lines) if (!/^(jonas|priya|tom|lea|you|maya|hans)$/.test(w) || typeof t !== "string" || /undefined|NaN/.test(t)) throw new Error("bad line " + w + t + " @" + tag);
    if (/undefined|NaN/.test(S.view.q + S.view.act + S.view.n)) throw new Error("undefined text @" + tag);
    if (S.phase === "read" || S.phase === "end") { if (verbose && b.k === "day") trace.push(tag + " | " + S.dayLog.join(" ")); A.cont(S); continue; }
    const pickIdx = (opts) => {
      const gs = opts.map(o => o.g);
      if (policy === "best") return gs.indexOf(2);
      if (policy === "worst") { const i = gs.indexOf(0); return i < 0 ? gs.indexOf(1) : i; }
      return Math.floor(Math.random() * opts.length);
    };
    let r;
    if (S.phase === "call") {
      let x;
      if (policy === "best") x = b.ok ? "allow" : "step";
      else if (policy === "worst") x = b.ok ? "step" : "allow";
      else x = Math.random() < 0.5 ? "allow" : "step";
      r = A.answer(S, x);
      if (!r) r = A.answer(S, pickIdx(A.val(b.opts, S)));
    } else if (b.k === "who") { const o = A.whoOptions(b); r = A.answer(S, policy === "best" ? o.findIndex(x => x.key === b.ans) : policy === "worst" ? o.findIndex(x => x.key !== b.ans) : Math.floor(Math.random() * o.length)); }
    else if (b.k === "retro") r = A.answer(S, policy === "random" ? Math.floor(Math.random() * 3) : 0);
    else r = A.answer(S, pickIdx(A.val(b.opts, S)));
    if (r.lines) for (const [w, t] of r.lines) if (/undefined|NaN/.test(t)) throw new Error("bad then " + t + " @" + tag);
    if (verbose) trace.push(`${tag} -> g${r.g} ${S.fresh.map(f => f.text + " [" + f.why + "]").join("; ")}`);
    A.cont(S);
  }
  return { S, trace };
}
module.exports = { play, A };
if (require.main === module) {
  const pol = process.argv[2] || "best";
  const { S, trace } = play(pol, true);
  console.log(trace.join("\n"));
  console.log("score", S.score, "/", S.max, "trust", S.trust, "sprints", JSON.stringify(S.sprintRes.map(r => ({ goal: r.goal, met: r.met, back: r.back }))), "pg", S.pgoalDone);
  console.log("PB", S.pb.join(","), "| INC", S.inc.join(","));
}
