const { play } = require("./sim.js");
let bad = {}, pulls = 0, best;
for (let i = 0; i < 1500; i++) {
  const { S } = play(i % 3 === 0 ? "worst" : "random", true);
  // diary entries: check pulled-in items
  const drop = {};
  for (const e of S.diary) {
    const t = e.text;
    const why = e.why || "";
    const sp = e.sp;
    const m = t.match(/“(.+?)”/);
    if (/Scope renegotiated/.test(why) && m) drop[sp + m[1]] = 1;
    if (/^Pulled in/.test(why)) { pulls++; if (m && drop[sp + m[1]]) bad.repull = (bad.repull || 0) + 1; }
  }
  if (S.diary.some(e => e.sp === 0 && /Pay by card.*Increment/.test(e.text))) bad.payS1 = (bad.payS1||0)+1;
}
const r = play("best", true);
console.log("pulls", pulls, "bad", bad, "best score", r.S.score, "/", r.S.max, "goals", r.S.sprintRes.map(x => x.met));
console.log(JSON.stringify(r.S.diary[0]));
