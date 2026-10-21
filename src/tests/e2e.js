const { chromium } = require("playwright");
const { appUrl, shotsDir } = require("./paths.js");
const OUT = shotsDir + "/";
(async () => {
  const browser = await chromium.launch();
  const mode = process.argv[2] || "desktop";
  const policy = process.argv[3] || "random";
  const vp = mode === "phone" ? { width: 390, height: 844 } : { width: 1366, height: 900 };
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: mode === "phone" ? 2 : 1, colorScheme: process.argv[4] || "light", reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const errs = [];
  page.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
  page.on("pageerror", e => errs.push("PAGEERROR " + e.message));
  await page.goto(appUrl + "#game");
  await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + mode + "-00-title.png" });
  await page.click('[data-act="new"]');
  let shots = 0, steps = 0, overflow = [];
  const want = new Set([1, 3, 5, 8, 14, 22, 40, 70, 110, 160]);
  while (steps++ < 600) {
    const st = await page.evaluate(() => ({ done: S.done, phase: S.phase, k: S.done ? "final" : beat(S).k, ok: S.done ? null : beat(S).ok, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    if (st.sw > st.cw + 1) overflow.push(steps + ":" + st.k + ":" + st.sw);
    if (want.has(steps)) await page.screenshot({ path: OUT + `${mode}-${String(steps).padStart(3, "0")}-${st.k}-${st.phase}.png`, fullPage: mode === "phone" });
    if (st.done) break;
    if (st.phase === "call") {
      const pick = policy === "best" ? (st.ok ? "allow" : "step") : Math.random() < .5 ? "allow" : "step";
      await page.click(`[data-act="${pick}"]`);
      continue;
    }
    if (st.phase === "step" || st.phase === "ask") {
      const n = await page.locator("#scene [data-opt]").count();
      if (policy === "best") {
        const idx = await page.evaluate(() => { const b = beat(S); if (b.k === "who") return whoOptions(b).findIndex(o => o.key === b.ans); if (b.k === "retro") return 0; return val(b.opts, S).findIndex(o => o.g === 2); });
        await page.click(`#scene [data-opt="${idx}"]`);
      } else await page.locator("#scene [data-opt]").nth(Math.floor(Math.random() * n)).click();
      continue;
    }
    if (st.phase === "end" && steps % 2 === 0) {
      // play the exam bridge once per sprint
      await page.click('[data-act="quiz"]');
      for (let i = 0; i < 4; i++) {
        const multi = await page.evaluate(() => QIDX[quiz.ids[quiz.i]].a.length);
        for (let j = 0; j < multi; j++) await page.locator("#scene [data-q]").nth(j).click();
        if (multi > 1) await page.click('[data-act="qcheck"]');
        if (i === 1 && mode) await page.screenshot({ path: OUT + `${mode}-quiz-${steps}.png`, fullPage: mode === "phone" });
        await page.click('[data-act="qnext"]');
      }
    }
    await page.click('#scene [data-act="cont"]');
  }
  await page.screenshot({ path: OUT + mode + "-zz-final.png", fullPage: mode === "phone" });
  const res = await page.evaluate(() => ({ score: S.score, max: S.max, sprintRes: S.sprintRes.map(r => r.met), pg: S.pgoalDone }));
  // blitz
  await page.click('[data-act="blitz"]');
  await page.waitForTimeout(200);
  await page.screenshot({ path: OUT + mode + "-blitz.png", fullPage: mode === "phone" });
  for (let i = 0; i < 10; i++) { await page.locator("[data-role]").nth(i % 4).click(); if (i === 0) await page.screenshot({ path: OUT + mode + "-blitz-fb.png", fullPage: mode === "phone" }); await page.click('[data-act="bnext"]'); }
  await page.screenshot({ path: OUT + mode + "-blitz-end.png" });
  await page.click("#btnGuide"); await page.waitForTimeout(100); await page.screenshot({ path: OUT + mode + "-guide.png" });
  console.log(JSON.stringify({ mode, steps, res, errs, overflow: overflow.slice(0, 5) }));
  await browser.close();
})();
