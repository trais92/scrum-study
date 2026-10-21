const { chromium } = require("playwright");
const OUT = __dirname + "/shots/app-";
(async () => {
  const browser = await chromium.launch();
  const mode = process.argv[2] || "desktop", scheme = process.argv[3] || "light";
  const vp = mode === "phone" ? { width: 390, height: 844 } : { width: 1366, height: 900 };
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: mode === "phone" ? 2 : 1, colorScheme: scheme });
  const page = await ctx.newPage();
  const errs = [];
  page.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
  page.on("pageerror", e => errs.push("PAGEERROR " + e.message));
  const tag = `${mode}-${scheme}`;
  const ov = async n => { const o = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); if (o[0] > o[1] + 1) errs.push(`OVERFLOW ${n} ${o}`); };
  await page.goto("file://" + __dirname + "/../v2/index.html");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: OUT + tag + "-home.png", fullPage: true }); await ov("home");
  // guide search
  await page.fill("#hq", "Definition of Done"); await page.press("#hq", "Enter");
  await page.waitForTimeout(600);
  console.log("guide hash", await page.evaluate(() => location.hash), "count", await page.textContent("#gcount"));
  await page.screenshot({ path: OUT + tag + "-guide-search.png" }); await ov("guide");
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
  await page.screenshot({ path: OUT + tag + "-practice-dash.png", fullPage: true }); await ov("pdash");
  // exam
  await page.click('#pmain [data-p="exam"]'); await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + tag + "-exam.png", fullPage: mode === "phone" }); await ov("exam");
  await page.click('#pmain [data-pact="submit"]'); await page.click('#pmain [data-pact="submityes"]'); await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + tag + "-exam-res.png" });
  // game + watch
  await page.click('.nav a[data-nav="game"]'); await page.waitForTimeout(800);
  await page.screenshot({ path: OUT + tag + "-game-title.png" }); await ov("gtitle");
  await page.click('#scene [data-act="watch"]'); await page.waitForTimeout(2500);
  await page.screenshot({ path: OUT + tag + "-watch-1.png" });
  await page.evaluate(() => { watch.speed = 3; });
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
})();
