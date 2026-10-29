// ===== App: start page, Scrum Guide reader, exam practice, and the routes between them =====
const TOPIC_SUB = { theory: "Empiricism, pillars, values", team: "Accountabilities and self-management", events: "Sprint, Planning, Daily, Review, Retro", artifacts: "Backlogs, Increment, commitments", sm: "Coaching, impediments, real situations" };
const PPKEY = "smod-practice-v1", GKEY = "smod-guide-v1";
let pstore = { stats: {}, exams: [] };
try { const raw = JSON.parse(localStorage.getItem(PPKEY)); if (raw && raw.stats) pstore = Object.assign(pstore, raw); } catch (e) {}
pstore.timedExams = pstore.timedExams === true;
const psave = () => { try { localStorage.setItem(PPKEY, JSON.stringify(pstore)); } catch (e) {} };
let gprefs = { lang: "en" };
try { const raw = JSON.parse(localStorage.getItem(GKEY)); if (raw) gprefs = Object.assign(gprefs, raw); } catch (e) {}
const gsave = () => { try { localStorage.setItem(GKEY, JSON.stringify(gprefs)); } catch (e) {} };
const sameSet = (x, y) => x.length === y.length && x.every(v => y.includes(v));
const QS = QB.questions;
const EXAM_QUESTIONS = EXAM_DATA.map(source => {
  const section = String(source.section || "");
  const lower = section.toLowerCase();
  const t = /event|cancel/.test(lower) ? "events"
    : /team|accountabilit/.test(lower) ? "team"
    : /artifact|commitment/.test(lower) ? "artifacts"
    : /theory|values|definition|evidence/.test(lower) ? "theory" : "sm";
  return {
    id: "platform-" + source.id, t, q: source.question,
    o: source.answers.map(answer => answer.text),
    a: source.answers.reduce((ids, answer, index) => { if (answer.correct) ids.push(index); return ids; }, []),
    x: source.explanation || "", r: section, g: [], tf: true,
    examSource: true, examTest: source.test, examNr: source.nr
  };
});
const EXAM_SETS = Array.from({ length: 6 }, (_, index) => {
  const test = index + 1;
  return { id: "exam-" + test, label: "Exam " + test, questions: EXAM_QUESTIONS.filter(q => q.examTest === test).sort((a, b) => a.examNr - b.examNr) };
});
const importedExamGroup = (topic, course, prefix) => ({
  id: prefix === "psm" ? "scrum-course-2" : "product-owner-course",
  label: course,
  exams: Array.from({ length: 6 }, (_, index) => {
    const test = index + 1;
    return {
      id: `exam-${prefix}-${test}`,
      label: `${course} · Exam ${test}`,
      shortLabel: `Exam ${test}`,
      pdfUrl: `downloads/exams/${prefix === "psm" ? "scrum-course-2" : "product-owner-course"}-exam-${test}.pdf`,
      answerKeyUrl: `downloads/exams/${prefix === "psm" ? "scrum-course-2" : "product-owner-course"}-exam-${test}-answer-key.pdf`,
      questions: QS.filter(q => q.t === topic && q.sourceTest === test).sort((a, b) => a.sourceNr - b.sourceNr)
    };
  })
});
const EXAM_GROUPS = [
  {
    id: "scrum-course-1",
    label: "Scrum Course 1",
    exams: EXAM_SETS.map((set, index) => ({
      ...set,
      shortLabel: set.label,
      label: `Scrum Course 1 · ${set.label}`,
      pdfUrl: `downloads/exams/scrum-course-1-exam-${index + 1}.pdf`,
      answerKeyUrl: `downloads/exams/scrum-course-1-exam-${index + 1}-answer-key.pdf`
    }))
  },
  importedExamGroup("psm", "Scrum Course 2", "psm"),
  importedExamGroup("po", "Product Owner Course", "po")
];
const COURSE_EXAMS = EXAM_GROUPS.flatMap(group => group.exams);
const EXAM_BY_ID = Object.fromEntries(COURSE_EXAMS.map(exam => [exam.id, exam]));
const ALL_EXAM_QUESTIONS = COURSE_EXAMS.flatMap(set => set.questions);
const EXAM_SECONDS_PER_QUESTION = 45;
function examDurationLabel(questionCount) {
  const minutes = Math.ceil(questionCount * EXAM_SECONDS_PER_QUESTION / 60);
  const hours = Math.floor(minutes / 60), remainder = minutes % 60;
  return hours ? `${hours} hr${hours === 1 ? "" : "s"}${remainder ? ` ${remainder} min` : ""}` : `${minutes} min`;
}
function examTimerChoiceHtml(id) {
  return `<label class="exam-timing" for="${id}">
    <input id="${id}" type="checkbox" data-exam-timer ${pstore.timedExams ? "checked" : ""}>
    <span><strong>Timed exams</strong><small>45 seconds per question · 60 minutes for 80 questions</small></span>
  </label>`;
}
function savedExamStatus(examId, label) {
  const legacyLabels = examId === "exam-bank" ? [label, "Question bank mock"] : [label];
  const attempts = pstore.exams.filter(result => result.examId === examId || (!result.examId && legacyLabels.includes(result.label)));
  if (!attempts.length) return null;
  const best = Math.max(...attempts.map(result => result.score));
  return best >= 85
    ? { state: "passed", text: `Passed · ${best}%` }
    : { state: "failed", text: `Failed · ${attempts[attempts.length - 1].score}%` };
}
function examTileHtml(exam, attr, index) {
  const status = savedExamStatus(exam.id, exam.label);
  return `<div class="exam-card">
    <button class="exam-tile${status ? ` is-${status.state}` : ""}" type="button" ${attr}="${exam.id}">
      <span class="exam-number">${String(index + 1).padStart(2, "0")}</span><span class="exam-copy"><b>${esc(exam.shortLabel)}</b><small data-exam-time="${exam.questions.length}">${exam.questions.length} questions · ${pstore.timedExams ? examDurationLabel(exam.questions.length) : "Untimed"}</small>${status ? `<small class="exam-result ${status.state}">${esc(status.text)}</small>` : ""}</span><span class="exam-arrow" aria-hidden="true">→</span>
    </button>
    <button class="exam-study" type="button" ${attr}="study-${exam.id}">Study · immediate feedback</button>
    <div class="exam-downloads"><a href="${exam.pdfUrl}" download="${exam.pdfUrl.split("/").pop()}" aria-label="Download ${esc(exam.label)} question PDF">Exam PDF</a><a href="${exam.answerKeyUrl}" download="${exam.answerKeyUrl.split("/").pop()}" aria-label="Download ${esc(exam.label)} answer key PDF">Answer key</a></div>
  </div>`;
}
function examGroupsHtml(attr) {
  return EXAM_GROUPS.map(group => {
    const questionCount = group.exams.reduce((sum, exam) => sum + exam.questions.length, 0);
    return `<details class="exam-group">
      <summary><span>${esc(group.label)}</span><small>${group.exams.length} exams · ${questionCount} questions</small></summary>
      <div class="exam-grid">${group.exams.map((exam, examIndex) => examTileHtml(exam, attr, examIndex)).join("")}</div>
    </details>`;
  }).join("");
}
function examBankTileHtml(attr) {
  const status = savedExamStatus("exam-bank", "Exam 7 · Question bank");
  return `<div class="exam-card exam-bank-card">
    <button class="exam-tile exam-bank${status ? ` is-${status.state}` : ""}" type="button" ${attr}="exam-bank">
      <span class="exam-number">↻</span><span class="exam-copy"><b>Question bank mock</b><small data-exam-time="80">Random 80 questions · ${pstore.timedExams ? examDurationLabel(80) : "Untimed"}</small>${status ? `<small class="exam-result ${status.state}">${esc(status.text)}</small>` : ""}</span><span class="exam-arrow" aria-hidden="true">→</span>
    </button>
    <button class="exam-study" type="button" ${attr}="study-exam-bank">Study · immediate feedback</button>
    <p class="exam-note">The mock is randomized each time, so printable PDFs are available for the 18 fixed course exams.</p>
  </div>`;
}
const ICON = {
  book: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M2 3h4.5a2 2 0 0 1 2 2v8.5a1.5 1.5 0 0 0-1.5-1.5H2zM14 3H9.5a2 2 0 0 0-1 .3"/><path d="M14 3v9H9a1.5 1.5 0 0 0-1.5 1.5"/></svg>',
  search: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>',
  bolt: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M9 1.5L3.5 9H8l-1 5.5L12.5 7H8z"/></svg>',
  clock: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="8" cy="8.5" r="5.5"/><path d="M8 5.5v3l2 1.5M6 1.5h4"/></svg>',
  redo: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 8a5 5 0 1 0 1.5-3.6M3 2.5v2.8h2.8"/></svg>',
  who: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="5.5" cy="5.5" r="2.3"/><circle cx="11" cy="6" r="1.9"/><path d="M1.5 13.5c.4-2.4 2-3.6 4-3.6s3.6 1.2 4 3.6M10 9.8c1.9 0 3.6.9 4 3.2"/></svg>',
  play: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4.5 2.8v10.4L13 8z"/></svg>',
  eye: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/></svg>',
  q: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M6.2 6.3a1.9 1.9 0 1 1 2.6 1.8c-.5.2-.8.6-.8 1.1v.4M8 11.4v.2"/></svg>'
};

// ---------- Scrum Guide sections and the questions that belong to them ----------
const SECTIONS = (() => {
  const t = document.createElement("template"); t.innerHTML = GUIDE.en;
  return [...t.content.querySelectorAll("h3[id],h4[id],h5[id]")].map(h => ({ id: h.id, name: h.textContent.trim() }));
})();
const clean = s => s.toLowerCase().replace(/^the /, "").trim();
function sectionIdsFor(r) {
  const ids = [];
  for (const part of String(r || "").split(";")) {
    const p = part.trim(); if (!p) continue;
    let hit = SECTIONS.find(s => clean(s.name) === clean(p));
    if (!hit) { const last = p.split(":").pop(); hit = SECTIONS.find(s => clean(s.name) === clean(last) || clean(s.name) === "commitment: " + clean(last)); }
    if (hit && !ids.includes(hit.id)) ids.push(hit.id);
  }
  return ids;
}
const SEC_Q = {};
for (const q of QS) for (const id of sectionIdsFor(q.r)) (SEC_Q[id] = SEC_Q[id] || []).push(q.id);
const QBYID = Object.fromEntries([...QS, ...ALL_EXAM_QUESTIONS].map(q => [q.id, q]));

// ---------- Routing ----------
let view = "home", guideReturn = null, gscroll = 0;
function parseHash() {
  const h = decodeURIComponent(location.hash.slice(1));
  const [path, query] = h.split("?");
  const [v, sub] = (path || "home").split("/");
  return { v: ["home", "guide", "practice", "game"].includes(v) ? v : "home", sub: sub || "", q: query && query.startsWith("q=") ? query.slice(2) : "" };
}
let afterRoute = null;
function go(hash, after) { afterRoute = after || null; if (location.hash === "#" + hash) route(); else location.hash = hash; }
function route() {
  const r = parseHash();
  const prev = view; view = r.v;
  if (prev === "guide" && view !== "guide") { gscroll = window.scrollY; guideReturn = null; }
  for (const v of ["home", "guide", "practice", "game"]) $("v-" + v).hidden = v !== view;
  document.querySelectorAll(".nav a").forEach(a => a.toggleAttribute("aria-current", a.dataset.nav === view) || (a.dataset.nav === view && a.setAttribute("aria-current", "page")));
  document.querySelectorAll(".nav a").forEach(a => a.dataset.nav === view ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
  hideTip();
  if (view === "home") { renderHome(); window.scrollTo({ top: 0 }); }
  if (view === "guide") openGuideView(r.sub, r.q, prev !== "guide");
  if (view !== "game" && watch.on) watchPause(true);
  const after = afterRoute; afterRoute = null;
  if (view === "practice") { if (after) after(); else if (P && P.done && P.timedOut) showPResults(true); else if (!P || P.done || prev !== "practice") renderPractice(); window.scrollTo({ top: 0 }); }
  if (view === "game") { if (after) after(); else if (prev !== "game") renderAll(false); window.scrollTo({ top: 0 }); }
  document.title = { home: "Scrum Master on Duty", guide: "Scrum Guide · Scrum Master on Duty", practice: "Exam practice · Scrum Master on Duty", game: "Game · Scrum Master on Duty" }[view];
}
window.addEventListener("hashchange", route);

// ---------- Start page ----------
function readiness() {
  let tot = 0, ok = 0, seen = 0;
  for (const q of QS) { const s = pstore.stats[q.id]; if (s && s.h && s.h.length) { seen++; tot += s.h.length; ok += s.h.reduce((a, b) => a + b, 0); } }
  return { pct: tot ? Math.round(ok / tot * 100) : null, seen };
}
const mistakes = () => QS.filter(q => { const s = pstore.stats[q.id]; return s && s.h && s.h[s.h.length - 1] === 0; });
function renderHome() {
  const rd = readiness(), mk = mistakes().length;
  const saved = loadGame(); const canResume = saved && !saved.done && (saved.pos > 0 || saved.sp > 0);
  $("v-home").innerHTML = `<div class="wrap home">
    <div class="home-main">
      <div class="home-left">
      <section class="entry guide-entry" aria-labelledby="h-guide">
        <h2 id="h-guide">${ICON.book}Scrum Guide 2020</h2>
        <form class="bigsearch" id="homeSearch" role="search">${ICON.search}<input id="hq" type="search" placeholder="Search the Scrum Guide" aria-label="Search the Scrum Guide" autocomplete="off"><button class="primary" type="submit"><span>Search</span>${ICON.search.replace('aria-hidden="true"', 'aria-hidden="true" style="width:16px;height:16px"')}</button></form>
        <div class="row"><a class="primary" href="#guide" data-lang-go="en">Read in English</a><a class="primary alt" href="#guide" data-lang-go="de" lang="de">Auf Deutsch lesen</a></div>
      </section>
      <section class="home-quick" aria-label="More practice options">
        <span class="quick-label">More practice</span>
        <div class="quick-actions">
          <button class="quick-chip" type="button" data-home="smart">${ICON.bolt}<span>Smart round</span></button>
          <button class="quick-chip" type="button" data-home="mistakes" ${mk ? "" : "disabled"}>${ICON.redo}<span>My mistakes${mk ? ` · ${mk}` : ""}</span></button>
          <button class="quick-chip" type="button" data-home="blitz">${ICON.who}<span>Who decides?</span></button>
        </div>
      </section>
      </div>
      <section class="entry exam-entry" aria-labelledby="h-prac">
        <div class="exam-heading"><div><span class="exam-kicker">Optional timer</span><h2 id="h-prac">Choose an exam</h2></div><span class="exam-count">18 exams</span></div>
        <p>Choose a course and decide whether you want to take the exam with a countdown.</p>
        ${examTimerChoiceHtml("homeExamTimer")}
        <div class="exam-groups">${examGroupsHtml("data-home")}</div>
        <div class="exam-random"><span class="exam-kicker">Mix it up</span>${examBankTileHtml("data-home")}</div>
      </section>
    </div>
    <section class="entry game-entry" aria-labelledby="h-game">
      <div class="game-copy">
        <span class="game-kicker">Three-sprint simulation</span>
        <h2 id="h-game">${ICON.play.replace('fill="currentColor"', 'fill="var(--accent)"')}The game</h2>
        <p>Step into the Scrum Master role, guide a team through three Sprints, and see the impact of your decisions.</p>
        <div class="row"><a class="primary" href="#game">${canResume ? `Continue Sprint ${saved.sp + 1}` : "Play"}</a><button class="primary alt" type="button" data-home="watch">${ICON.eye}Watch a Sprint</button></div>
      </div>
      <div class="gamepreview" id="gpreview">${officePreviewHtml()}</div>
    </section>
    <footer class="foot"><span>Scrum Guide 2020 © Ken Schwaber &amp; Jeff Sutherland, <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>, from <a href="https://scrumguides.org" target="_blank" rel="noopener">scrumguides.org</a>. German: GermanScrumTranslators. Questions are study material, not official Scrum.org questions.</span></footer>
  </div>`;
  $("homeSearch").onsubmit = e => { e.preventDefault(); const v = $("hq").value.trim(); go("guide" + (v ? "?q=" + encodeURIComponent(v) : "")); };
}
document.addEventListener("click", e => {
  const lg = e.target.closest("[data-lang-go]"); if (lg) { gprefs.lang = lg.dataset.langGo; gsave(); }
  const h = e.target.closest("[data-home]"); if (!h || h.disabled) return;
  const k = h.dataset.home;
  if (k === "smart") go("practice", () => guardExam(() => startPractice({})));
  if (k === "exam") go("practice", () => guardExam(showExamStart));
  if (k === "exam-bank") go("practice", () => guardExam(() => startExam()));
  if (k === "study-exam-bank") go("practice", () => guardExam(() => startExam(null, "study")));
  if (k.startsWith("study-") && EXAM_BY_ID[k.slice(6)]) go("practice", () => guardExam(() => startExam(EXAM_BY_ID[k.slice(6)], "study")));
  if (EXAM_BY_ID[k]) go("practice", () => guardExam(() => startExam(EXAM_BY_ID[k])));
  if (k === "mistakes") go("practice", () => guardExam(() => startPractice({ ids: mistakes().map(q => q.id), label: "My mistakes" })));
  if (k === "blitz") go("game", () => { if (watch.on) watchStop(); startBlitz("title"); });
  if (k === "watch") go("game", watchStart);
});
function updateExamTimerChoices() {
  document.querySelectorAll("[data-exam-timer]").forEach(input => { input.checked = pstore.timedExams; });
  document.querySelectorAll("[data-exam-time]").forEach(label => {
    const count = Number(label.dataset.examTime);
    const random = label.closest(".exam-bank");
    label.textContent = `${random ? "Random " : ""}${count} questions · ${pstore.timedExams ? examDurationLabel(count) : "Untimed"}`;
  });
}
document.addEventListener("change", e => {
  if (!e.target.matches("[data-exam-timer]")) return;
  pstore.timedExams = e.target.checked;
  psave();
  updateExamTimerChoices();
});

// ---------- Scrum Guide reader ----------
let gmarks = [], gcur = -1, gtimer = null, glang = null, gquery = "";
function openGuideView(sub, q, fresh) {
  if (glang !== gprefs.lang) renderGuideBody(gprefs.lang);
  if (q && q !== gquery) { $("gq").value = q; runSearch(q, false); }
  $("guideBackBtn") && $("guideBackBtn").remove();
  if (guideReturn) {
    const b = document.createElement("button"); b.className = "primary backtop"; b.id = "guideBackBtn"; b.type = "button";
    b.textContent = "← Back to your question";
    b.onclick = () => { const r = guideReturn; guideReturn = null; b.remove(); go(r, () => { if (P && P.done && P.resultsHtml) { $("pmain").innerHTML = P.resultsHtml; } else renderPractice(); }); };
    $("v-guide").appendChild(b);
  }
  if (sub) {
    requestAnimationFrame(() => guideJump(sub, true, true));
    // Web fonts can change the layout after the first jump: jump again once they have loaded.
    if (document.fonts && document.fonts.status !== "loaded") document.fonts.ready.then(() => { if (view === "guide" && parseHash().sub === sub) guideJump(sub, false, true); });
  } else if (fresh) requestAnimationFrame(() => window.scrollTo({ top: q ? 0 : gscroll }));
}
function renderGuideBody(lang) {
  glang = lang;
  const body = $("sgBody"); body.innerHTML = GUIDE[lang]; body.lang = lang;
  document.querySelectorAll(".lang button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  $("gq").placeholder = lang === "de" ? "Im Scrum Guide suchen" : "Search the Scrum Guide";
  for (const h of body.querySelectorAll("h3[id],h4[id],h5[id]")) {
    const ids = SEC_Q[h.id]; if (!ids) continue;
    const b = document.createElement("button"); b.type = "button"; b.className = "secq"; b.dataset.secq = h.id;
    b.innerHTML = `${ICON.q}Practice (${ids.length})`; b.title = "Practice questions on this section";
    h.after(b);
  }
  $("toc").innerHTML = [...body.querySelectorAll("h3[id],h4[id],h5[id]")].map(h => `<a href="#guide/${h.id}" data-jump="${h.id}" class="l${h.tagName[1]}">${esc(h.textContent)}</a>`).join("");
  if (gquery) runSearch(gquery, false);
  markToc();
}
function guideJump(id, flash, instant) {
  const h = document.getElementById(id);
  $("toc").classList.remove("open"); $("tocBtn").setAttribute("aria-expanded", "false");
  if (!h) return;
  const off = $("gtools").getBoundingClientRect().bottom + 14;
  window.scrollTo({ top: Math.max(0, window.scrollY + h.getBoundingClientRect().top - off), behavior: reduced || instant ? "auto" : "smooth" });
  if (flash) { h.classList.remove("flash"); void h.offsetWidth; h.classList.add("flash"); }
}
function currentSection() {
  const hs = [...$("sgBody").querySelectorAll("h3[id],h4[id],h5[id],h6[id]")];
  let cur = hs[0];
  for (const h of hs) { if (h.getBoundingClientRect().top < $("gtools").getBoundingClientRect().bottom + 40) cur = h; else break; }
  return cur;
}
function markToc() {
  if (view !== "guide") return;
  const cur = currentSection(); const id = cur && cur.id;
  $("toc").querySelectorAll("a").forEach(a => a.classList.toggle("on", a.dataset.jump === id));
}
let tocRaf = 0;
window.addEventListener("scroll", () => { if (view === "guide" && !tocRaf) tocRaf = requestAnimationFrame(() => { tocRaf = 0; markToc(); }); hideTip(); }, { passive: true });
document.querySelectorAll(".lang button").forEach(b => b.onclick = () => {
  if (b.dataset.lang === glang) return;
  const cur = currentSection(); const id = cur && cur.id; const off = cur ? cur.getBoundingClientRect().top : 0;
  gprefs.lang = b.dataset.lang; gsave(); renderGuideBody(gprefs.lang);
  const h = id && document.getElementById(id);
  if (h) window.scrollTo({ top: window.scrollY + h.getBoundingClientRect().top - off });
});
$("tocBtn").onclick = () => { const o = !$("toc").classList.contains("open"); $("toc").classList.toggle("open", o); $("tocBtn").setAttribute("aria-expanded", String(o)); };
$("toc").addEventListener("click", e => { const a = e.target.closest("[data-jump]"); if (!a) return; e.preventDefault(); history.replaceState(null, "", "#guide/" + a.dataset.jump); guideJump(a.dataset.jump, true, false); });
$("sgBody").addEventListener("click", e => {
  const b = e.target.closest("[data-secq]"); if (b) { const h = document.getElementById(b.dataset.secq); guideReturn = null; go("practice", () => startPractice({ ids: SEC_Q[b.dataset.secq], label: h ? h.textContent : "This section" })); return; }
  const t = e.target.closest(".term");
  if (!t) { hideTip(); return; }
  // Focus (on tap) or hover already opened this tip: a click right after must not close it again.
  if (tipFor === t && !$("tip").hidden && (matchMedia("(hover: hover)").matches || Date.now() - tipAt < 600)) return;
  tipFor === t && !$("tip").hidden ? hideTip() : showTip(t);
});

// Search: highlight every match in the text, even across underlined terms
$("gq").addEventListener("input", () => { clearTimeout(gtimer); gtimer = setTimeout(() => runSearch($("gq").value, true), 160); });
$("gq").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); stepMatch(e.shiftKey ? -1 : 1); } if (e.key === "Escape") { $("gq").value = ""; runSearch("", false); } });
$("gnext").onclick = () => stepMatch(1);
$("gprev").onclick = () => stepMatch(-1);
function clearMarks() {
  for (const m of [...$("sgBody").querySelectorAll("mark")]) { m.replaceWith(document.createTextNode(m.textContent)); }
  $("sgBody").normalize();
}
function runSearch(raw, scroll) {
  const q = raw.trim(); gquery = q;
  clearMarks(); gmarks = []; gcur = -1;
  const res = $("gresults");
  if (q.length < 2) { $("gcount").textContent = ""; res.hidden = true; if (view === "guide") history.replaceState(null, "", "#guide"); return; }
  if (view === "guide") history.replaceState(null, "", "#guide?q=" + encodeURIComponent(q));
  const body = $("sgBody");
  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement.closest(".secq") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  const nodes = []; let full = "";
  for (let n; (n = walker.nextNode());) { nodes.push([n, full.length]); full += n.nodeValue; }
  const hay = full.toLowerCase(), needle = q.toLowerCase().replace(/\s+/g, " ");
  const hits = [];
  for (let i = hay.indexOf(needle); i >= 0 && hits.length < 500; i = hay.indexOf(needle, i + needle.length)) hits.push([i, i + needle.length]);
  // wrap pieces, last node first so offsets stay valid
  for (let k = nodes.length - 1; k >= 0; k--) {
    const [node, start] = nodes[k], end = start + node.nodeValue.length;
    const segs = hits.map((h, idx) => [Math.max(h[0], start) - start, Math.min(h[1], end) - start, idx]).filter(s => s[0] < s[1]);
    for (let j = segs.length - 1; j >= 0; j--) {
      const [a, b, idx] = segs[j];
      const mid = node.splitText(a); mid.splitText(b - a);
      const m = document.createElement("mark"); m.dataset.m = idx; m.textContent = mid.nodeValue; mid.replaceWith(m);
    }
  }
  gmarks = hits.map((_, i) => body.querySelector(`mark[data-m="${i}"]`));
  $("gcount").textContent = hits.length ? `1 / ${hits.length}` : (glang === "de" ? "keine Treffer" : "no matches");
  // result list with the section of each match
  const heads = [...body.querySelectorAll("h2,h3,h4,h5,h6")];
  const secOf = m => { let s = null; for (const h of heads) { if (h.compareDocumentPosition(m) & Node.DOCUMENT_POSITION_FOLLOWING) s = h; else break; } return s ? s.textContent : (glang === "de" ? "Einleitung" : "Introduction"); };
  if (!hits.length) { res.hidden = false; res.innerHTML = `<span class="lbl">${glang === "de" ? "Keine Treffer für" : "No matches for"} “${esc(q)}”</span><span class="hint">${glang === "de" ? "Tipp: ein kürzeres Wort probieren, oder auf Englisch umschalten." : "Tip: try a shorter word, or switch to Deutsch."}</span>`; }
  else {
    res.hidden = false;
    const shown = hits.slice(0, 40);
    res.innerHTML = `<span class="lbl">${hits.length} ${glang === "de" ? (hits.length > 1 ? "Treffer" : "Treffer") : (hits.length > 1 ? "matches" : "match")} · ${glang === "de" ? "zum Springen antippen" : "tap one to jump"}</span>` + shown.map(([a, b], i) => {
      const s = Math.max(0, a - 50), e2 = Math.min(full.length, b + 60);
      return `<button class="gres" type="button" data-hit="${i}"><b>${esc(secOf(gmarks[i]))}</b><span>${s > 0 ? "…" : ""}${esc(full.slice(s, a))}<mark>${esc(full.slice(a, b))}</mark>${esc(full.slice(b, e2))}${e2 < full.length ? "…" : ""}</span></button>`;
    }).join("") + (hits.length > shown.length ? `<span class="hint">${hits.length - shown.length} more in the text; use ▼ to step through.</span>` : "");
  }
  if (hits.length) setMatch(0, scroll && false);
}
function setMatch(i, scroll) {
  if (!gmarks.length) return;
  gcur = (i + gmarks.length) % gmarks.length;
  $("sgBody").querySelectorAll("mark.cur").forEach(m => m.classList.remove("cur"));
  $("sgBody").querySelectorAll(`mark[data-m="${gcur}"]`).forEach(m => m.classList.add("cur"));
  $("gcount").textContent = `${gcur + 1} / ${gmarks.length}`;
  if (scroll) gmarks[gcur].scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
}
function stepMatch(d) { if (!gmarks.length) return; setMatch(gcur < 0 ? 0 : gcur + d, true); }
$("gresults").addEventListener("click", e => { const b = e.target.closest("[data-hit]"); if (b) setMatch(+b.dataset.hit, true); });

// Tooltips on underlined terms
let tipFor = null, tipAt = 0;
function showTip(el) {
  const tip = $("tip"), i = +el.dataset.tip;
  if (tipFor !== el) tipAt = Date.now();
  tipFor = el; document.querySelectorAll(".term.on").forEach(t => t.classList.remove("on")); el.classList.add("on");
  tip.innerHTML = `<b>${glang === "de" ? "English: " + esc(TIP_EN[i]) : "Deutsch: " + esc(TIP_DE[i])}</b>${esc(TIPS[i])}`; tip.hidden = false;
  const r = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
  const left = Math.min(Math.max(16, r.left + r.width / 2 - w / 2), window.innerWidth - w - 16);
  let top = r.bottom + 8; if (top + h > window.innerHeight - 8) top = r.top - h - 8;
  tip.style.left = left + "px"; tip.style.top = Math.max(8, top) + "px";
}
function hideTip() { const t = $("tip"); if (t) t.hidden = true; if (tipFor) tipFor.classList.remove("on"); tipFor = null; }
$("sgBody").addEventListener("mouseover", e => { const t = e.target.closest(".term"); if (t && matchMedia("(hover: hover)").matches) showTip(t); });
$("sgBody").addEventListener("mouseout", e => { const t = e.target.closest(".term"); if (t && !t.contains(e.relatedTarget) && matchMedia("(hover: hover)").matches) hideTip(); });
$("sgBody").addEventListener("focusin", e => { const t = e.target.closest(".term"); if (t) showTip(t); });
$("sgBody").addEventListener("focusout", hideTip);

// ---------- Exam practice ----------
let P = null; // { mode, label, items:[{q, order, picked, checked}], i, flags:Set, done }
function topicScore(t) {
  let tot = 0, ok = 0, seen = 0; const qs = QS.filter(q => q.t === t);
  qs.forEach(q => { const s = pstore.stats[q.id]; if (s && s.h && s.h.length) { seen++; tot += s.h.length; ok += s.h.reduce((a, b) => a + b, 0); } });
  return { pct: tot ? Math.round(ok / tot * 100) : null, seen, total: qs.length };
}
function record(qid, ok) {
  const s = pstore.stats[qid] || { n: 0, c: 0, h: [] };
  s.n++; if (ok) s.c++; s.h = (s.h || []).concat(ok ? 1 : 0).slice(-3);
  pstore.stats[qid] = s;
}
function renderPractice() {
  if (P && !P.done) { renderPQ(); return; }
  const mk = mistakes().length;
  $("pmain").innerHTML = `
    <div class="sechead"><h1 class="ptitle">Exam practice</h1><a class="chip" href="#guide">${ICON.book.replace('aria-hidden="true"', 'aria-hidden="true" style="width:14px;height:14px;vertical-align:-2px"')} Scrum Guide</a></div>
    <section class="pcard save-help"><h2>How to have my progress saved</h2>${examSaveHelp()}</section>
    <div class="practice-row">
      <button class="ptile" type="button" data-p="smart"><b>${ICON.bolt}Smart round</b><span>10 questions</span></button>
      <button class="ptile" type="button" data-p="mistakes" ${mk ? "" : "disabled"}><b>${ICON.redo}My mistakes</b><span>${mk ? `${mk} to redo` : "None yet"}</span></button>
      <button class="ptile" type="button" data-p="blitz"><b>${ICON.who}Who decides?</b><span>Rapid round</span></button>
    </div>
    <section class="pcard exam-entry" aria-labelledby="examPracticeHeading">
      <div class="exam-heading"><div><span class="exam-kicker">Optional timer</span><h2 id="examPracticeHeading">Course exams</h2></div><span class="exam-count">18 exams</span></div>
      <p>Pick an exam from one of your three course collections. Your answers are saved as you go.</p>
      ${examTimerChoiceHtml("practiceExamTimer")}
      <div class="exam-groups">${examGroupsHtml("data-p")}</div>
      <div class="exam-random"><span class="exam-kicker">Mix it up</span>${examBankTileHtml("data-p")}</div>
    </section>
    <section class="pcard"><h2>By topic</h2><div class="ptopics">${Object.entries(QB.topics).map(([k, name]) => {
      const s = topicScore(k); const pt = s.pct === null ? "not started" : s.pct + "%";
      return `<div class="ptopic"><div><div class="nm">${esc(name)}</div><div class="sb">${s.seen}/${s.total} seen</div></div><div class="meterbar" role="img" aria-label="${pt}"><i style="width:${s.pct || 0}%"></i></div><div class="row" style="flex-wrap:nowrap"><span class="pct">${pt}</span><button class="pbtn" type="button" data-topic="${k}">Practise</button></div></div>`;
    }).join("")}</div></section>
    <section class="pcard"><h2>Recent results</h2><div class="histrow">${pstore.exams.length ? pstore.exams.slice(-14).map(e => `<span class="hchip ${e.score >= 85 ? "pass" : "fail"}">${esc(e.date)} · ${esc(e.label || "Mock exam")} · ${e.score}%</span>`).join("") : `<span class="hint">No mock exams yet.</span>`}</div>
      <div class="row" id="presetRow"><button class="pbtn" type="button" data-p="askreset">Reset my progress</button></div></section>`;
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-p],[data-topic],[data-oi],[data-go],[data-pact]"); if (!b || b.disabled || view !== "practice") return;
  if (b.dataset.topic) return guardExam(() => startPractice({ topics: [b.dataset.topic] }));
  if (b.dataset.oi !== undefined) return pPick(+b.dataset.oi);
  if (b.dataset.go !== undefined) { P.i = +b.dataset.go; renderPQ(); return; }
  const k = b.dataset.p || b.dataset.pact;
  if (k === "smart") guardExam(() => startPractice({}));
  if (k === "exam-bank") guardExam(() => startExam());
  if (k === "study-exam-bank") guardExam(() => startExam(null, "study"));
  if (k.startsWith("study-") && EXAM_BY_ID[k.slice(6)]) guardExam(() => startExam(EXAM_BY_ID[k.slice(6)], "study"));
  if (EXAM_BY_ID[k]) guardExam(() => startExam(EXAM_BY_ID[k]));
  if (k === "mistakes") guardExam(() => startPractice({ ids: mistakes().map(q => q.id), label: "My mistakes" }));
  if (k === "leaveyes") { const f = P.pending; clearExamTimer(); P = null; saveExam(); f(); return; }
  if (k === "blitz") go("game", () => { if (watch.on) watchStop(); startBlitz("title"); });
  if (k === "askreset") $("presetRow").innerHTML = `<div class="confirm"><span>Clear all practice answers and mock exam results in this browser?</span><div class="row"><button class="pbtn" type="button" data-p="reset">Yes, reset</button><button class="pbtn" type="button" data-p="noreset">Cancel</button></div></div>`;
  if (k === "reset") { pstore = { stats: {}, exams: [], timedExams: pstore.timedExams }; psave(); renderPractice(); }
  if (k === "noreset") renderPractice();
  if (k === "act") pAct();
  if (k === "prev") { if (P.i > 0) { P.i--; renderPQ(); } }
  if (k === "flag") { P.flags.has(P.i) ? P.flags.delete(P.i) : P.flags.add(P.i); saveExam(); renderPQ(); }
  if (k === "quit") { P.confirm = "quit"; renderPQ(); }
  if (k === "submit") { P.confirm = "submit"; renderPQ(); }
  if (k === "cancel") { P.confirm = null; P.pending = null; renderPQ(); }
  if (k === "quityes") { clearExamTimer(); P = null; saveExam(); renderPractice(); window.scrollTo({ top: 0 }); }
  if (k === "submityes") finishExam();
  if (k === "home") { clearExamTimer(); P = null; renderPractice(); window.scrollTo({ top: 0 }); }
  if (k === "again") {
    const again = P.again;
    if (again && Object.prototype.hasOwnProperty.call(again, "examSet")) startExam(again.examSet, again.mode);
    else startPractice(again);
  }
  if (k === "redo") startPractice({ ids: P.wrongIds, label: "Your mistakes from this round" });
  if (k === "readguide") { if (P && P.done) P.resultsHtml = $("pmain").innerHTML; guideReturn = "practice"; go("guide/" + b.dataset.sec); }
});
// A running mock exam is never thrown away without asking, and survives a reload.
function guardExam(f) {
  if (P && P.mode === "exam" && !P.done) { P.confirm = "leave"; P.pending = f; renderPQ(); window.scrollTo({ top: 0 }); return; }
  f();
}
function showExamStart() {
  if (P && P.mode !== "exam" && !P.done) P = null;
  renderPractice();
  window.scrollTo({ top: 0 });
}
function examSaveHelp() {
  return `<div class="save-copy">
    <p>Your in-progress exam and completed results are saved in this browser on this device—not online.</p>
    <p>Use a normal browser window; private browsing may not save progress. Clearing browser data deletes all saved progress and results.</p>
  </div>`;
}
function saveExam() {
  pstore.exam = P && P.mode === "exam" && !P.done ? { ids: P.items.map(it => it.q.id), order: P.items.map(it => it.order), picked: P.items.map(it => it.picked), flags: [...P.flags], i: P.i, label: P.label, examId: P.examId, deadline: P.deadline || null } : null;
  psave();
}
function restoreExam() {
  const e = pstore.exam; if (!e || !e.ids) return;
  const items = e.ids.map((id, k) => QBYID[id] && { q: QBYID[id], order: e.order[k], picked: e.picked[k] || [], checked: false });
  if (items.some(x => !x)) { pstore.exam = null; psave(); return; }
  const examId = e.examId || "exam-bank";
  P = { mode: "exam", label: EXAM_BY_ID[examId]?.label || e.label || "Question bank mock", examId, items, i: e.i || 0, flags: new Set(e.flags || []), deadline: e.deadline || null };
  if (P.deadline) startExamTimer();
}
function pickWeighted(pool, n) {
  const w = q => { const s = pstore.stats[q.id]; if (!s) return 3; const last = s.h[s.h.length - 1]; return last === 0 ? 5 : 1 + (s.h.length < 2 ? 1 : 0); };
  const chosen = []; const cand = pool.slice();
  while (chosen.length < Math.min(n, pool.length)) {
    const sum = cand.reduce((a, q) => a + w(q), 0); let r = Math.random() * sum;
    const idx = cand.findIndex(q => (r -= w(q)) <= 0); chosen.push(cand.splice(idx < 0 ? 0 : idx, 1)[0]);
  }
  return chosen;
}
const makeItem = q => ({ q, order: q.tf ? q.o.map((_, i) => i) : shuffle(q.o.map((_, i) => i)), picked: [], checked: false });
function startPractice(opt) {
  let pool, label;
  if (opt.ids) { pool = opt.ids.map(id => QBYID[id]).filter(Boolean); label = opt.label; }
  else if (opt.topics) { pool = QS.filter(q => opt.topics.includes(q.t)); label = opt.topics.map(t => QB.topics[t]).join(" + "); }
  else { pool = QS; label = "Smart round"; }
  const items = (opt.ids ? shuffle(pool).slice(0, 12) : pickWeighted(pool, 10)).map(makeItem);
  P = { mode: "practice", label, items, i: 0, again: opt, flags: new Set() };
  renderPQ(); window.scrollTo({ top: 0 });
}
function startExam(examSet, mode = "mock") {
  const questions = examSet ? examSet.questions : shuffle(QS).slice(0, 80);
  const study = mode === "study";
  const deadline = !study && pstore.timedExams ? Date.now() + questions.length * EXAM_SECONDS_PER_QUESTION * 1000 : null;
  P = {
    mode: study ? "study-exam" : "exam",
    label: examSet ? examSet.label : "Exam 7 · Question bank",
    examId: examSet ? examSet.id : "exam-bank",
    items: questions.map(makeItem),
    i: 0,
    flags: new Set(),
    deadline,
    ...(study ? { again: { examSet: examSet || null, mode } } : {})
  };
  if (!study) { saveExam(); startExamTimer(); }
  renderPQ(); window.scrollTo({ top: 0 });
}
function chatHtml(s) {
  return `<div class="qchat"><span class="lbl">Team chat</span>${linesHtml(s.filter(l => LOOK[l[0]]), false)}</div>`;
}
function pquoteHtml(q) {
  const external = q.sourceLabel || q.examSource;
  const sec = external ? null : sectionIdsFor(q.r)[0];
  const ref = q.sourceLabel ? esc(q.sourceLabel) : q.examSource ? esc(q.r) : `Scrum Guide 2020 · ${esc(q.r)}`;
  return `<div class="pquote"><span class="ref">${ref}</span>${(q.g || []).map(g => `<q>${esc(g)}</q>`).join("")}${sec ? `<button type="button" class="linkbtn" data-pact="readguide" data-sec="${sec}">Read this section in the Guide</button>` : ""}</div>`;
}
let examTimerInterval = null;
function clearExamTimer() {
  if (examTimerInterval !== null) clearInterval(examTimerInterval);
  examTimerInterval = null;
}
function formatExamTime(milliseconds) {
  const total = Math.ceil(Math.max(0, milliseconds) / 1000);
  const hours = Math.floor(total / 3600), minutes = Math.floor(total % 3600 / 60), seconds = total % 60;
  return [hours, minutes, seconds].map(value => String(value).padStart(2, "0")).join(":");
}
function examTimerHtml() {
  if (!P.deadline) return `<span class="exam-status exam-untimed">Untimed</span>`;
  const remaining = Math.max(0, P.deadline - Date.now());
  const urgency = remaining <= 60_000 ? "urgent" : remaining <= 300_000 ? "warning" : "";
  return `<span class="exam-status exam-timer ${urgency}" id="examTimer" role="timer" aria-label="Time remaining ${formatExamTime(remaining)}">${formatExamTime(remaining)}</span>`;
}
function startExamTimer() {
  clearExamTimer();
  if (!P || P.mode !== "exam" || P.done || !P.deadline) return;
  const tick = () => {
    if (!P || P.mode !== "exam" || P.done || !P.deadline) { clearExamTimer(); return; }
    const remaining = P.deadline - Date.now(), timer = document.getElementById("examTimer");
    if (timer) {
      timer.textContent = formatExamTime(remaining);
      timer.setAttribute("aria-label", `Time remaining ${formatExamTime(remaining)}`);
      timer.classList.toggle("warning", remaining <= 300_000 && remaining > 60_000);
      timer.classList.toggle("urgent", remaining <= 60_000);
    }
    if (remaining <= 0) {
      P.timedOut = true;
      finishExam();
    }
  };
  tick();
  if (P && !P.done) examTimerInterval = setInterval(tick, 1000);
}
function renderPQ() {
  const it = P.items[P.i], q = it.q, ex = P.mode === "exam", study = P.mode === "study-exam", multi = q.a.length > 1;
  const saveHelpOpen = !!$("pmain").querySelector(".save-help-disclosure[open]");
  const answered = P.items.filter(x => x.picked.length > 0).length;
  let h = `<div class="pcard">
    <div class="qhead"><span class="mode">${ex ? esc(P.label) : study ? `Study · ${esc(P.label)}` : "Practice · " + esc(P.label)}</span><span class="hint">Question ${P.i + 1} of ${P.items.length}</span><span class="sp"></span>${ex ? examTimerHtml() : ""}<button class="pbtn" type="button" data-pact="quit">Quit</button></div>
    ${ex ? `<details class="save-help-disclosure"${saveHelpOpen ? " open" : ""}><summary>How to have my progress saved</summary>${examSaveHelp()}</details>` : ""}
    <div class="qbar"><i style="width:${(ex ? answered : P.i + (it.checked ? 1 : 0)) / P.items.length * 100}%"></i></div>
    <div class="qmeta"><span>${esc(QB.topics[q.t])}</span>${multi ? `<span class="choose">Choose every correct option</span>` : ""}</div>
    ${q.s ? chatHtml(q.s) : ""}
    <p class="qtext">${esc(q.q)}</p>
    <div class="popts">${it.order.map((oi, n) => {
      const on = it.picked.includes(oi); let cls = "popt " + (multi ? "check" : "radio"), mk = on ? "✓" : "";
      if (it.checked && !ex) { if (q.a.includes(oi)) { cls += on ? " right" : " right missed"; mk = "✓"; } else if (on) { cls += " wrong"; mk = "✕"; } }
      return `<button type="button" class="${cls}" data-oi="${oi}" data-pk="${n + 1}" aria-pressed="${on}" ${it.checked && !ex ? "disabled" : ""}><span class="mk">${mk}</span><span>${esc(q.o[oi])}${it.checked && !ex && q.a.includes(oi) && !on ? `<small class="misslbl">Correct answer you didn't pick</small>` : ""}</span></button>`;
    }).join("")}</div>`;
  if (it.checked && !ex) {
    const ok = sameSet(it.picked, q.a);
    h += `<div class="pfb ${ok ? "ok" : "no"}"><strong>${ok ? "Correct" : "Not quite"}</strong>${q.x ? `<p>${esc(q.x)}</p>` : ""}${pquoteHtml(q)}</div>`;
  }
  if (P.confirm === "leave") h += `<div class="confirm"><span>Your ${esc(P.label)} is still running. Leave it? It won't be scored.</span><div class="row"><button class="pbtn" type="button" data-pact="leaveyes">Leave the exam</button><button class="pbtn" type="button" data-pact="cancel">Keep going</button></div></div>`;
  if (P.confirm === "quit") h += `<div class="confirm"><span>${ex ? `Quit ${esc(P.label)}? It won't be scored.` : study ? `Quit studying ${esc(P.label)}?` : "Quit this round? Answers you already checked are saved."}</span><div class="row"><button class="pbtn" type="button" data-pact="quityes">Quit</button><button class="pbtn" type="button" data-pact="cancel">Keep going</button></div></div>`;
  if (P.confirm === "submit") { const open = P.items.length - answered; h += `<div class="confirm"><span>${open ? `${open} question${open > 1 ? "s are" : " is"} unanswered and ${P.flags.size} flagged. Submit anyway?` : `All questions answered${P.flags.size ? `, ${P.flags.size} still flagged` : ""}. Submit your exam?`}</span><div class="row"><button class="pbtn" type="button" data-pact="submityes">Submit</button><button class="pbtn" type="button" data-pact="cancel">Not yet</button></div></div>`; }
  const actLbl = ex ? (P.i === P.items.length - 1 ? "Review and submit" : "Next") : it.checked ? (P.i === P.items.length - 1 ? "See results" : "Next question") : "Check answer";
  const actDis = !ex && !it.checked && it.picked.length === 0;
  h += `<div class="qnav">${ex ? `<button class="pbtn" type="button" data-pact="prev" ${P.i === 0 ? "disabled" : ""}>Back</button><button class="pbtn" type="button" data-pact="flag">${P.flags.has(P.i) ? "Remove flag" : "Flag for review"}</button>` : ""}<span class="sp"></span>${ex ? `<button class="pbtn" type="button" data-pact="submit">Submit exam</button>` : ""}<button class="primary" type="button" data-pact="act" ${actDis ? "disabled" : ""}>${actLbl}</button></div>`;
  if (ex) h += `<div><span class="hint">${answered} of ${P.items.length} answered · ${P.flags.size} flagged</span><div class="qmap" style="margin-top:6px">${P.items.map((x, i) => `<button type="button" class="${[x.picked.length > 0 ? "done" : "", P.flags.has(i) ? "flag" : "", i === P.i ? "cur" : ""].join(" ")}" data-go="${i}" aria-label="Question ${i + 1}">${i + 1}</button>`).join("")}</div></div>`;
  h += `</div>`;
  $("pmain").innerHTML = h;
}
function pPick(oi) {
  const it = P.items[P.i], q = it.q;
  if (it.checked && P.mode !== "exam") return;
  if (q.a.length === 1) it.picked = [oi];
  else if (it.picked.includes(oi)) it.picked = it.picked.filter(x => x !== oi);
  else it.picked = it.picked.concat(oi);
  if (P.mode === "exam") saveExam();
  renderPQ();
}
function pAct() {
  const it = P.items[P.i];
  if (P.mode === "exam") { if (P.i < P.items.length - 1) { P.i++; saveExam(); renderPQ(); } else { P.confirm = "submit"; renderPQ(); } return; }
  if (!it.checked) { it.checked = true; record(it.q.id, sameSet(it.picked, it.q.a)); psave(); renderPQ(); return; }
  if (P.i < P.items.length - 1) { P.i++; renderPQ(); window.scrollTo({ top: 0 }); } else finishPractice();
}
function finishPractice() { showPResults(false); }
function finishExam() {
  if (!P || P.done) return;
  clearExamTimer();
  P.items.forEach(it => { if (it.picked.length) record(it.q.id, sameSet(it.picked, it.q.a)); });
  const ok = P.items.filter(it => sameSet(it.picked, it.q.a)).length;
  const d = new Date(); pstore.exams.push({ date: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), score: Math.round(ok / P.items.length * 100), label: P.label, examId: P.examId });
  P.done = true; saveExam();
  showPResults(true);
}
function showPResults(exam) {
  P.done = true;
  const ok = P.items.filter(it => sameSet(it.picked, it.q.a)).length, n = P.items.length, pct = Math.round(ok / n * 100), pass = pct >= 85;
  const by = {}; P.items.forEach(it => { const t = it.q.t; by[t] = by[t] || [0, 0]; by[t][1]++; if (sameSet(it.picked, it.q.a)) by[t][0]++; });
  const wrong = P.items.filter(it => !sameSet(it.picked, it.q.a)); P.wrongIds = wrong.map(it => it.q.id);
  $("pmain").innerHTML = `<div class="pcard">
    <span class="hint" style="text-transform:uppercase;letter-spacing:.1em;font-weight:700">${exam ? `${esc(P.label)} · exam result` : P.mode === "study-exam" ? `Study result · ${esc(P.label)}` : "Practice result · " + esc(P.label)}</span>
    ${exam && P.timedOut ? `<p class="exam-timeup">Time is up. Unanswered questions count as incorrect.</p>` : ""}
    <div class="row" style="gap:18px"><span class="bigpct">${pct}%</span><span class="pverdict ${pass ? "pass" : "fail"}">${exam ? (pass ? "Pass" : "Below pass mark") : (pass ? "Exam level" : "Keep practising")}</span></div>
    <span>${ok} of ${n} correct · PSM I pass mark is 85%</span>
    <div class="ptopics">${Object.entries(by).map(([t, [a, m]]) => { const p = Math.round(a / m * 100); return `<div class="ptopic"><div><div class="nm">${esc(QB.topics[t])}</div><div class="sb">${a} of ${m} correct</div></div><div class="meterbar"><i style="width:${p}%"></i></div><span class="pct">${p}%</span></div>`; }).join("")}</div>
    <div class="row">${wrong.length ? `<button class="primary" type="button" data-pact="redo">${wrong.length > 1 ? `Practise these ${wrong.length} again` : "Practise this one again"}</button>` : ""}${!exam ? `<button class="primary alt" type="button" data-pact="again">Another round</button>` : ""}<button class="primary alt" type="button" data-pact="home">Back to practice</button></div>
  </div>
  ${wrong.length ? `<section class="pcard review"><h2>Review your mistakes (${wrong.length})</h2>${wrong.map(it => { const q = it.q; return `<details><summary>${esc(q.q)}</summary>${q.s ? chatHtml(q.s) : ""}<p class="ans"><span class="w">Your answer:</span> ${it.picked.length ? it.picked.map(i => esc(q.o[i])).join("; ") : "No answer"}</p><p class="ans"><span class="r">Correct:</span> ${q.a.map(i => esc(q.o[i])).join("; ")}</p>${q.x ? `<p>${esc(q.x)}</p>` : ""}${pquoteHtml(q)}</details>`; }).join("")}</section>` : ""}`;
  window.scrollTo({ top: 0 });
}
document.addEventListener("keydown", e => {
  if (view !== "practice" || !P || P.done || e.altKey || e.ctrlKey || e.metaKey) return;
  if (/input|textarea|select/i.test(e.target.tagName)) return;
  if (/^[1-6]$/.test(e.key)) { const b = document.querySelector(`#pmain [data-pk="${e.key}"]:not([disabled])`); if (b) { e.preventDefault(); b.click(); } }
  if (e.key === "Enter" && e.target.tagName !== "BUTTON") { const b = document.querySelector('#pmain [data-pact="act"]:not([disabled])'); if (b) { e.preventDefault(); b.click(); } }
});

// ---------- Start ----------
restoreExam();
window.claude?.hot?.snapshot?.(() => ({ S: watch.on ? watch.saved : S, mode: mode === "game" && !watch.on ? "game" : "title" }));
window.claude?.hot?.ready ? window.claude.hot.ready(boot) : boot(window.claude?.hot?.data ?? {});
