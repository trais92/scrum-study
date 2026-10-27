const { chromium } = require("playwright");
const { appUrl, shotsDir } = require("./paths.js");
const fs = require("fs");
const path = require("path");
const examData = JSON.parse(fs.readFileSync(path.join(__dirname, "../../data/exams.json"), "utf8"));
const OUT = shotsDir + "/app-";
(async () => {
  const browser = await chromium.launch();
  const mode = process.argv[2] || "desktop", scheme = process.argv[3] || "light";
  const vp = mode === "phone" ? { width: 390, height: 844 } : { width: 1366, height: 900 };
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: mode === "phone" ? 2 : 1, colorScheme: scheme });
  const page = await ctx.newPage();
  const errs = [];
  await page.route("https://fonts.googleapis.com/**", route => route.fulfill({ status: 200, contentType: "text/css", body: "" }));
  page.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
  page.on("pageerror", e => errs.push("PAGEERROR " + e.message));
  const tag = `${mode}-${scheme}`;
  const ov = async n => { const o = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); if (o[0] > o[1] + 1) errs.push(`OVERFLOW ${n} ${o}`); };
  await page.goto(appUrl);
  await page.waitForTimeout(1500);
  const bankCounts = await page.evaluate(() => ({
    total: QB.questions.length,
    po: QB.questions.filter(question => question.t === "po").length,
    psm: QB.questions.filter(question => question.t === "psm").length
  }));
  if (bankCounts.total !== 2111 || bankCounts.po !== 1000 || bankCounts.psm !== 1002) {
    errs.push(`IMPORTED BANK COUNTS are wrong: ${JSON.stringify(bankCounts)}`);
  }
  await page.screenshot({ path: OUT + tag + "-home.png", fullPage: true }); await ov("home");
  if (await page.locator('#v-home [data-home^="exam-"]').count() !== 19) errs.push("HOME EXAM HIGHLIGHT does not show 18 course exams plus the question-bank mock");
  await page.click('#v-home [data-home="exam-1"]'); await page.waitForTimeout(300);
  if ((await page.locator("#pmain .qhead .mode").textContent()).trim() !== "Scrum Course 1 · Exam 1") errs.push("HOME SCRUM COURSE 1 EXAM 1 did not start");
  if (await page.locator("#pmain .qmap button").count() !== 80) errs.push("HOME EXAM 1 does not contain 80 questions");
  if (await page.locator("#pmain .exam-untimed").textContent() !== "Untimed" || await page.locator("#pmain #qtimer").count()) errs.push("HOME EXAM 1 is not untimed");
  await page.click('#pmain [data-pact="quit"]'); await page.click('#pmain [data-pact="quityes"]'); await page.waitForTimeout(200);
  await page.click(".brand"); await page.waitForTimeout(300);
  for (const [groupIndex, examId, count, label] of [[1, "exam-psm-1", 180, "Scrum Course 2"], [2, "exam-po-1", 179, "Product Owner Course"]]) {
    await page.locator("#v-home .exam-group").nth(groupIndex).locator("summary").click();
    await page.click(`#v-home [data-home="${examId}"]`); await page.waitForTimeout(250);
    if ((await page.locator("#pmain .qhead .mode").textContent()).trim() !== `${label} · Exam 1`) errs.push(`${label} exam did not start with its course label`);
    if (await page.locator("#pmain .qmap button").count() !== count) errs.push(`${label} exam 1 expected ${count} questions`);
    if (await page.locator("#pmain .exam-untimed").count() !== 1) errs.push(`${label} exam is not untimed`);
    await page.click('#pmain [data-pact="quit"]'); await page.click('#pmain [data-pact="quityes"]'); await page.waitForTimeout(200);
    await page.click(".brand"); await page.waitForTimeout(200);
  }
  // guide search
  await page.fill("#hq", "Definition of Done"); await page.press("#hq", "Enter");
  await page.waitForTimeout(600);
  console.log("guide hash", await page.evaluate(() => location.hash), "count", await page.textContent("#gcount"));
  await page.screenshot({ path: OUT + tag + "-guide-search.png" }); await ov("guide");
  if (mode === "phone") {
    const bounds = await page.evaluate(() => {
      const search = document.querySelector(".search").getBoundingClientRect();
      const next = document.querySelector("#gnext").getBoundingClientRect();
      return {
        searchLeft: search.left, searchRight: search.right, searchTop: search.top, searchBottom: search.bottom,
        nextLeft: next.left, nextRight: next.right, nextTop: next.top, nextBottom: next.bottom
      };
    });
    if (bounds.nextLeft < bounds.searchLeft - 1 || bounds.nextRight > bounds.searchRight + 1 || bounds.nextTop < bounds.searchTop - 1 || bounds.nextBottom > bounds.searchBottom + 1) {
      errs.push(`GUIDE SEARCH NEXT OUTSIDE .search ${JSON.stringify(bounds)}`);
    }
  }
  await page.click("#gnext"); await page.waitForTimeout(500);
  await page.screenshot({ path: OUT + tag + "-guide-next.png" });
  // toggle German
  await page.click('.lang button[data-lang="de"]'); await page.waitForTimeout(400);
  console.log("de count", await page.textContent("#gcount"), "lang", await page.evaluate(() => $("sgBody").lang));
  await page.fill("#gq", ""); await page.dispatchEvent("#gq", "input"); await page.waitForTimeout(300);
  await page.evaluate(() => location.hash = "#guide/sg-scrum-master"); await page.waitForTimeout(900);
  const t = page.locator("#sgBody .term").first();
  await t.scrollIntoViewIfNeeded(); if (mode === "phone") await t.tap ? await t.click() : 0; else await t.hover();
  await page.waitForTimeout(300);
  console.log("tip", await page.evaluate(() => !$("tip").hidden && $("tip").textContent.slice(0, 80)));
  await page.screenshot({ path: OUT + tag + "-guide-de.png" }); await ov("guide-de");
  await page.click('.lang button[data-lang="en"]'); await page.waitForTimeout(300);
  // section practice
  const sq = page.locator("#sgBody .secq").first(); await sq.scrollIntoViewIfNeeded(); await sq.click(); await page.waitForTimeout(400);
  console.log("practice hash", await page.evaluate(() => location.hash));
  await page.screenshot({ path: OUT + tag + "-practice-q.png", fullPage: mode === "phone" }); await ov("pq");
  await page.locator("#pmain [data-oi]").first().click();
  const act = page.locator('#pmain [data-pact="act"]'); if (await act.isEnabled()) await act.click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: OUT + tag + "-practice-fb.png", fullPage: mode === "phone" });
  await page.click('.nav a[data-nav="practice"]'); await page.waitForTimeout(300);
  await page.click('#pmain [data-pact="quit"]').catch(() => {}); await page.click('#pmain [data-pact="quityes"]').catch(() => {});
  await page.waitForTimeout(300);
  const practiceTopics = await page.locator("#pmain .ptopic .nm").allTextContents();
  for (const [topic, label] of [["po", "Product Owner questions"], ["psm", "Scrum Master questions"]]) {
    if (!practiceTopics.includes(label)) errs.push(`TOPIC ${label} is missing`);
    await page.click(`#pmain [data-topic="${topic}"]`); await page.waitForTimeout(250);
    if ((await page.locator("#pmain .qmeta").textContent()).trim() !== label) errs.push(`TOPIC ${label} did not start`);
    const sourceLabel = await page.evaluate(() => P.items[0].q.sourceLabel);
    if (!sourceLabel || !sourceLabel.startsWith("Udemy")) errs.push(`TOPIC ${label} lost its source label`);
    await page.click('#pmain [data-pact="quit"]'); await page.click('#pmain [data-pact="quityes"]'); await page.waitForTimeout(200);
  }
  await page.screenshot({ path: OUT + tag + "-practice-dash.png", fullPage: true }); await ov("pdash");
  // exam
  if (await page.locator('#pmain [data-p^="exam-"]').count() !== 19) errs.push("EXAM SELECTOR COUNT is not 19");
  await page.click('#pmain [data-p="exam-1"]'); await page.waitForTimeout(300);
  if (await page.locator('#pmain .qmap button').count() !== 80) errs.push("EXAM 1 does not contain 80 questions");
  if ((await page.locator('#pmain .qhead .mode').textContent()).trim() !== "Scrum Course 1 · Exam 1") errs.push("EXAM 1 title is missing");
  if (await page.locator("#pmain .exam-untimed").textContent() !== "Untimed" || await page.locator("#pmain #qtimer").count()) errs.push("EXAM 1 displays a timer");
  const firstExamQuestion = examData.find(question => question.test === 1 && question.nr === 1);
  for (const [index, answer] of firstExamQuestion.answers.entries()) if (answer.correct) await page.click(`#pmain [data-oi="${index}"]`);
  await page.screenshot({ path: OUT + tag + "-exam.png", fullPage: mode === "phone" }); await ov("exam");
  await page.click('#pmain [data-pact="submit"]'); await page.click('#pmain [data-pact="submityes"]'); await page.waitForTimeout(300);
  if (!(await page.locator("#pmain").innerText()).includes("1 of 80 correct")) errs.push("EXAM 1 did not score the keyed first answer as correct");
  await page.screenshot({ path: OUT + tag + "-exam-res.png" });
  await page.click('#pmain [data-pact="home"]'); await page.waitForTimeout(200);
  await page.click('#pmain [data-p="exam-bank"]'); await page.waitForTimeout(300);
  if ((await page.locator('#pmain .qhead .mode').textContent()).trim() !== "Exam 7 · Question bank") errs.push("QUESTION BANK MOCK title is missing");
  if (await page.locator('#pmain .qmap button').count() !== 80) errs.push("EXAM 7 does not contain 80 questions");
  if (await page.locator("#pmain .exam-untimed").count() !== 1) errs.push("QUESTION BANK MOCK is not untimed");
  await page.click('#pmain [data-pact="submit"]'); await page.click('#pmain [data-pact="submityes"]'); await page.waitForTimeout(200);
  // game + watch
  await page.click('.nav a[data-nav="game"]'); await page.waitForTimeout(800);
  await page.screenshot({ path: OUT + tag + "-game-title.png" }); await ov("gtitle");
  await page.click('#scene [data-act="watch"]'); await page.waitForTimeout(2500);
  const speedMap = [[1, 0.5], [2, 1], [3, 2], [1, 0.5]];
  for (const [index, [label, rate]] of speedMap.entries()) {
    const actual = await page.evaluate(() => [watch.speed, watchRate()]);
    if (actual[0] !== label || actual[1] !== rate) errs.push(`WATCH SPEED ${index ? "cycle" : "default"} expected ${label}×/${rate}x, got ${actual}`);
    if (index < speedMap.length - 1) await page.click('[data-act="wspeed"]');
  }
  await page.click('[data-act="wspeed"]'); await page.click('[data-act="wspeed"]');
  await page.screenshot({ path: OUT + tag + "-watch-1.png" });
  for (let i = 0; i < 8; i++) { await page.waitForTimeout(2500); if (i % 3 === 2) await page.screenshot({ path: OUT + tag + `-watch-${i + 2}.png` }); }
  console.log("watch at", await page.evaluate(() => [S.sp, S.day, S.pos, S.phase, watch.caption, localStorage.getItem("smod-game-v1") ? "saved!" : "nosave"]));
  await page.click('[data-act="wstop"]'); await page.waitForTimeout(400);
  await page.click('#scene [data-act="new"]'); await page.waitForTimeout(2200);
  await page.screenshot({ path: OUT + tag + "-game-1.png" }); await ov("game");
  await page.click('#scene [data-act="cont"]').catch(e => errs.push("nocont")); await page.waitForTimeout(1500);
  await page.screenshot({ path: OUT + tag + "-game-2.png" });
  await page.click('.brand'); await page.waitForTimeout(800);
  await page.screenshot({ path: OUT + tag + "-home2.png" });
  console.log(tag, "ERRORS", errs.length ? errs : "none");
  await browser.close();
  if (errs.length) process.exitCode = 1;
})();
