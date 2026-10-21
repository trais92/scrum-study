const fs = require("fs"), path = require("path");
const { A } = require("./sim.js");
const norm = s => s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\*/g, "").replace(/\s+/g, " ").trim();
const guidePath = path.join(__dirname, "../guide/scrum-guide-2020-en.md");
const guideText = fs.readFileSync(guidePath, "utf8");
const guide = norm(guideText.replace(/^#+ .*$/gm, " "));
const quotes = [];
const walk = (b, where) => { for (const q of (b.g || [])) quotes.push([q[0], q[1], where]); };
A.SPRINTS.forEach((sp, i) => sp.beats.forEach((b, j) => walk(b, `S${i + 1}#${j} ${b.label || b.k}`)));
Object.entries(A.EVENTS).forEach(([k, b]) => walk(b, "EV " + k));
A.BLITZ.forEach(b => quotes.push([b[2], b[3], "BLITZ " + b[0]]));
const bank = JSON.parse(fs.readFileSync(path.join(__dirname, "../../data/questions.json"), "utf8"));
for (const q of bank.questions) for (const quote of (Array.isArray(q.g) ? q.g : [q.g])) quotes.push([quote, q.r, `Question ${q.id}`]);
let bad = 0;
// section headings in the guide, to check the section labels too
const md = guideText.split("\n");
let sec = "", secOf = [];
for (const line of md) { const m = line.match(/^#+ (.*)/); if (m) sec = m[1].replace("Commitment: ", "Commitment: ").trim(); else secOf.push([norm(line), sec]); }
for (const [q, s, w] of quotes) {
  const n = norm(q);
  if (!guide.includes(n)) { bad++; console.log("NOT FOUND:", w, "|", q); continue; }
  const hit = secOf.find(([l]) => l.includes(n.slice(0, 60)));
  if (hit && hit[1].replace(/^The (?=Scrum Team|Product Owner|Scrum Master)/, "") !== s) console.log("SECTION?", w, "| labelled", s, "| guide:", hit[1], "|", q.slice(0, 60));
}
console.log(quotes.length, "quotes,", bad, "not found");
if (bad) process.exitCode = 1;
