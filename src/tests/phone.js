const { chromium } = require("playwright");
const { appUrl, shotsDir } = require("./paths.js");
(async () => {
  const b = await chromium.launch();
  const scheme = process.argv[2] || "light";
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: scheme })).newPage();
  await p.goto(appUrl + "#game"); await p.waitForTimeout(300);
  await p.screenshot({ path: `${shotsDir}/ph-${scheme}-title.png` });
  await p.click('[data-act="new"]');
  for (let i = 0; i < 3; i++) { await p.evaluate(() => autoBest(S)); }
  await p.evaluate(() => { saveGame(); renderAll(false); });
  await p.screenshot({ path: `${shotsDir}/ph-${scheme}-scene.png` });
  await p.click("#handle"); await p.waitForTimeout(500);
  await p.screenshot({ path: `${shotsDir}/ph-${scheme}-sheet.png` });
  await b.close();
})();
