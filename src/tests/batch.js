const { play } = require("./sim.js");
let n = 0, errs = {}, goals = [0, 0, 0], pg = 0, negs = 0, labels = {};
for (let i = 0; i < 3000; i++) {
  try {
    const { S, trace } = play(i % 3 === 0 ? "worst" : "random", true);
    n++; S.sprintRes.forEach((r, k) => { if (r.met) goals[k]++; }); if (S.pgoalDone) pg++;
    for (const t of trace) { const m = t.match(/^(S\d) D\d+ \S+ (\w+) ([^-|]*)/); if (m) labels[m[1] + " " + m[3].trim()] = (labels[m[1] + " " + m[3].trim()] || 0) + 1; }
  } catch (e) { errs[e.message.slice(0, 120)] = (errs[e.message.slice(0, 120)] || 0) + 1; if (Object.keys(errs).length < 3 && errs[e.message.slice(0,120)]===1) console.log(e.stack.split("\n").slice(0,4).join("\n")); }
}
console.log("ok", n, "errors", JSON.stringify(errs, null, 1), "goals met", goals, "pg", pg);
console.log(Object.entries(labels).filter(([k]) => !k.endsWith(" ")).map(([k, v]) => k + ": " + v).join("\n"));
