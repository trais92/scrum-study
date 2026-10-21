const { chromium } = require("playwright");
const { appUrl, shotsDir } = require("./paths.js");
const URL = appUrl;
const OUT = shotsDir + "/fix-";
(async () => {
  const b = await chromium.launch();
  const errs = [];
  const mk = async (phone) => { const c = await b.newContext(phone ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true } : { viewport: { width: 1366, height: 900 } }); const p = await c.newPage(); p.on("pageerror", e => errs.push(e.message)); p.on("console", m => m.type() === "error" && errs.push(m.text())); return p; };
  // H1 phone tap tooltip + M1 heading visible + H4 deep link fresh
  let p = await mk(true);
  await p.goto(URL + "#guide/sg-daily-scrum"); await p.waitForTimeout(2500);
  const pos = await p.evaluate(() => [Math.round(document.getElementById("sg-daily-scrum").getBoundingClientRect().top), Math.round($("gtools").getBoundingClientRect().bottom)]);
  console.log("deep link heading top vs toolbar bottom", pos);
  await p.screenshot({ path: OUT + "deep.png" });
  const t = p.locator("#sg-daily-scrum ~ p .term").first(); await t.scrollIntoViewIfNeeded(); await t.tap(); await p.waitForTimeout(300);
  console.log("tap tip shown:", await p.evaluate(() => !$("tip").hidden));
  await p.screenshot({ path: OUT + "tap.png" });
  await p.tap("#sgBody h4"); await p.waitForTimeout(200);
  console.log("tap elsewhere hides:", await p.evaluate(() => $("tip").hidden));
  // chip jump
  await p.click(".brand"); await p.waitForTimeout(400); await p.click('.chip[href="#guide/sg-sprint-planning"]'); await p.waitForTimeout(1200);
  console.log("chip heading top vs toolbar", await p.evaluate(() => [Math.round(document.getElementById("sg-sprint-planning").getBoundingClientRect().top), Math.round($("gtools").getBoundingClientRect().bottom)]));
  // M3 guide keeps place
  await p.evaluate(() => window.scrollTo(0, 3000)); await p.waitForTimeout(200);
  await p.click('.nav a[data-nav="practice"]'); await p.waitForTimeout(300); await p.click('.nav a[data-nav="guide"]'); await p.waitForTimeout(500);
  console.log("guide scroll kept:", await p.evaluate(() => window.scrollY));
  // M2 search from scrolled home
  await p.click(".brand"); await p.waitForTimeout(300); await p.evaluate(() => window.scrollTo(0, 400));
  await p.fill("#hq", "Increment"); await p.press("#hq", "Enter"); await p.waitForTimeout(600);
  console.log("search from scrolled home scrollY:", await p.evaluate(() => window.scrollY));
  // M10 exam on phone
  await p.click('.nav a[data-nav="practice"]'); await p.waitForTimeout(300); await p.click('#pmain [data-p="exam"]'); await p.waitForTimeout(300);
  await p.locator("#pmain [data-oi]").first().click(); await p.click('#pmain [data-pact="act"]'); await p.waitForTimeout(200);
  await p.screenshot({ path: OUT + "exam-phone.png" });
  // M7 exam survives reload; guard on home tile
  await p.reload(); await p.waitForTimeout(800);
  await p.click(".brand"); await p.waitForTimeout(300); await p.click('[data-home="smart"]'); await p.waitForTimeout(400);
  console.log("exam kept + confirm:", await p.evaluate(() => [P && P.mode, P && P.i, P && P.items[0].picked.length, !!document.querySelector('[data-pact="leaveyes"]')]));
  await p.click('[data-pact="cancel"]'); await p.click('#pmain [data-pact="submit"]'); await p.click('#pmain [data-pact="submityes"]'); await p.waitForTimeout(300);
  console.log("stats after 1-answer exam:", await p.evaluate(() => [Object.keys(pstore.stats).length, mistakes().length, pstore.exams.slice(-1)[0], pstore.exam]));
  // M4 back to results
  const rb = p.locator('#pmain details').first(); await rb.locator("summary").click(); await rb.locator('[data-pact="readguide"]').click(); await p.waitForTimeout(600);
  await p.click("#guideBackBtn"); await p.waitForTimeout(400);
  console.log("back shows results:", await p.evaluate(() => !!document.querySelector("#pmain .bigpct")));
  await p.screenshot({ path: OUT + "results-phone.png", fullPage: true });
  // M5 stale back button
  await p.evaluate(() => document.querySelector("#pmain details").open = true);
  await p.locator('#pmain [data-pact="readguide"]').first().click(); await p.waitForTimeout(400);
  await p.goBack(); await p.waitForTimeout(300); await p.click('.nav a[data-nav="guide"]'); await p.waitForTimeout(400);
  console.log("stale back button gone:", await p.evaluate(() => !document.getElementById("guideBackBtn")));
  await p.context().close();
  // H2/H3 desktop
  p = await mk(false);
  await p.goto(URL + "#game"); await p.waitForTimeout(400);
  await p.click('#scene [data-act="new"]'); await p.click('#scene [data-act="cont"]'); await p.click('#scene [data-act="cont"]').catch(() => {}); await p.waitForTimeout(200);
  const save0 = await p.evaluate(() => localStorage.getItem("smod-game-v1"));
  await p.click('#btnMenu'); await p.click('#drawer [data-act="new"]'); await p.waitForTimeout(200);
  console.log("menu new asks:", await p.evaluate(() => !!document.querySelector('#drawer [data-sure]')));
  await p.click('#drawer [data-act="cancelrestart"]'); await p.click('#drawer [data-act="closedrawer"]');
  await p.click('.brand'); await p.click('[data-home="watch"]'); await p.waitForTimeout(1500);
  await p.click('#btnMenu'); await p.click('#drawer [data-act="blitz"]'); await p.waitForTimeout(200);
  await p.click('[data-act="blitzexit"]'); await p.waitForTimeout(200);
  console.log("after watch->blitz->stop: mode", await p.evaluate(() => [mode, watch.on]), "save untouched", save0 === await p.evaluate(() => localStorage.getItem("smod-game-v1")));
  await p.click('#scene [data-act="watch"]'); await p.evaluate(() => { watch.speed = 40; });
  for (let i = 0; i < 300; i++) { await p.waitForTimeout(250); if (await p.evaluate(() => watch.paused)) break; }
  await p.screenshot({ path: OUT + "watch-end.png" });
  await p.click('[data-act="wplay"]'); await p.waitForTimeout(200);
  console.log("wplay asks:", await p.evaluate(() => !!document.querySelector('#drawer [data-sure]')), "save untouched", save0 === await p.evaluate(() => localStorage.getItem("smod-game-v1")));
  await p.click('#drawer [data-sure]'); await p.waitForTimeout(300);
  console.log("after yes: new game", await p.evaluate(() => [mode, S.sp, S.pos, watch.on, JSON.parse(localStorage.getItem("smod-game-v1")).pos]));
  console.log("ERRORS", errs.length ? errs : "none");
  await b.close();
})();
