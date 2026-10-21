const { chromium } = require("playwright");
const fs = require("fs");
const page_ = fs.readFileSync(__dirname + "/../v2/scrum-master-on-duty.html", "utf8");
fs.writeFileSync(__dirname + "/page.html", `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>${page_}</body></html>`);
(async () => {
  const b = await chromium.launch();
  const scheme = process.argv[2] || "light";
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: scheme })).newPage();
  await p.goto("file://" + __dirname + "/page.html#game"); await p.waitForTimeout(300);
  await p.screenshot({ path: `shots/ph-${scheme}-title.png` });
  await p.click('[data-act="new"]');
  for (let i = 0; i < 3; i++) { await p.evaluate(() => autoBest(S)); }
  await p.evaluate(() => { saveGame(); renderAll(false); });
  await p.screenshot({ path: `shots/ph-${scheme}-scene.png` });
  await p.click("#handle"); await p.waitForTimeout(500);
  await p.screenshot({ path: `shots/ph-${scheme}-sheet.png` });
  await b.close();
})();
