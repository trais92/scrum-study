const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } }); const p = await ctx.newPage();
  const errs = []; p.on("pageerror", e => errs.push(e.message)); p.on("console", m => m.type() === "error" && errs.push(m.text()));
  await p.goto("file://" + __dirname + "/../v2/index.html#game"); await p.waitForTimeout(500);
  await p.click('#scene [data-act="new"]'); await p.click('#scene [data-act="cont"]'); await p.waitForTimeout(300);
  const before = await p.evaluate(() => localStorage.getItem("smod-game-v1"));
  await p.click('.brand'); await p.waitForTimeout(300);
  await p.click('[data-home="watch"]'); await p.waitForTimeout(500);
  await p.evaluate(() => { watch.speed = 40; });
  let last = "";
  for (let i = 0; i < 400; i++) {
    await p.waitForTimeout(250);
    const st = await p.evaluate(() => ({ sp: S.sp, day: S.day, pos: S.pos, ph: S.phase, k: S.done ? "done" : beat(S).k, paused: watch.paused, on: watch.on, score: S.score, max: S.max }));
    const k = JSON.stringify(st); if (k !== last) last = k;
    if (st.paused) { console.log("paused at", k); break; }
  }
  await p.screenshot({ path: __dirname + "/shots/watch-end.png" });
  const after = await p.evaluate(() => localStorage.getItem("smod-game-v1"));
  console.log("save untouched:", before === after);
  await p.click('[data-act="wmore"]'); await p.waitForTimeout(3000);
  console.log("sprint2:", await p.evaluate(() => [S.sp, S.day, watch.on]));
  await p.click('.nav a[data-nav="guide"]'); await p.waitForTimeout(300);
  console.log("paused on leave:", await p.evaluate(() => watch.paused));
  await p.click('.nav a[data-nav="game"]'); await p.waitForTimeout(300);
  await p.click('[data-act="wstop"]'); await p.waitForTimeout(300);
  console.log("after stop:", await p.evaluate(() => [mode, S.sp, S.day, S.pos, watch.on, !!document.querySelector('#scene [data-act="resume"]')]));
  console.log("ERR", errs);
  await b.close();
})();
