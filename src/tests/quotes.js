const fs = require("fs");
const { A } = require("./sim.js");
const norm = s => s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\*/g, "").replace(/\s+/g, " ").trim();
const guide = norm(fs.readFileSync(__dirname + "/../guide/guide.md", "utf8").replace(/^#+ .*$/gm, " "));
const quotes = [];
const walk = (b, where) => { for (const q of (b.g || [])) quotes.push([q[0], q[1], where]); };
A.SPRINTS.forEach((sp, i) => sp.beats.forEach((b, j) => walk(b, `S${i + 1}#${j} ${b.label || b.k}`)));
Object.entries(A.EVENTS).forEach(([k, b]) => walk(b, "EV " + k));
A.BLITZ.forEach(b => quotes.push([b[2], b[3], "BLITZ " + b[0]]));
let bad = 0;
// section headings in the guide, to check the section labels too
const md = fs.readFileSync(__dirname + "/../guide/guide.md", "utf8").split("\n");
let sec = "", secOf = [];
for (const line of md) { const m = line.match(/^#+ (.*)/); if (m) sec = m[1].replace("Commitment: ", "Commitment: ").trim(); else secOf.push([norm(line), sec]); }
for (const [q, s, w] of quotes) {
  const n = norm(q);
  if (!guide.includes(n)) { bad++; console.log("NOT FOUND:", w, "|", q); continue; }
  const hit = secOf.find(([l]) => l.includes(n.slice(0, 60)));
  if (hit && hit[1].replace(/^The (?=Scrum Team|Product Owner|Scrum Master)/, "") !== s) console.log("SECTION?", w, "| labelled", s, "| guide:", hit[1], "|", q.slice(0, 60));
}
console.log(quotes.length, "quotes,", bad, "not found");
