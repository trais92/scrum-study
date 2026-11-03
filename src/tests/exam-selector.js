const assert = require("assert");
const { chromium } = require("playwright");
const { appUrl } = require("./paths.js");

async function checkCardActions(page, root, stacked) {
  const card = page.locator(`${root} .exam-group`).first().locator(".exam-card").first();
  const mock = card.locator(".exam-action-mock");
  const study = card.locator(".exam-action-study");
  assert.equal(await page.locator(`${root} [data-${root === "#v-home" ? "home" : "p"}^="exam-"]`).count(), 19,
    `${root} should expose mock and study actions for all fixed exams and the question-bank mock`);
  assert.equal(await mock.isVisible(), true, `${root} mock action should be visible`);
  assert.equal(await study.isVisible(), true, `${root} study action should be visible`);
  assert.match(await mock.getAttribute("aria-label"), /Start mock exam/);
  assert.match(await study.getAttribute("aria-label"), /untimed with immediate feedback after each answer/i);
  const layout = await page.evaluate(({ mock, study }) => {
    const m = document.querySelector(mock).getBoundingClientRect();
    const s = document.querySelector(study).getBoundingClientRect();
    return {
      viewport: document.documentElement.clientWidth,
      page: document.documentElement.scrollWidth,
      mock: { left: m.left, right: m.right, top: m.top, bottom: m.bottom, height: m.height },
      study: { left: s.left, right: s.right, top: s.top, bottom: s.bottom, height: s.height }
    };
  }, { mock: `${root} .exam-group:first-child .exam-card:first-child .exam-action-mock`,
    study: `${root} .exam-group:first-child .exam-card:first-child .exam-action-study` });
  assert.ok(layout.page <= layout.viewport + 1, `${root} should not cause horizontal overflow: ${JSON.stringify(layout)}`);
  assert.ok(layout.mock.height >= 44 && layout.study.height >= 44, `${root} actions should be tap-friendly`);
  assert.ok(layout.mock.left >= -1 && layout.study.right <= layout.viewport + 1, `${root} actions should fit the viewport`);
  if (stacked) assert.ok(layout.study.top >= layout.mock.bottom - 1, `${root} mobile actions should stack vertically`);
  else assert.ok(Math.abs(layout.mock.top - layout.study.top) < 2, `${root} desktop actions should align side by side`);
  return { card, mock, study };
}

(async () => {
  let browser;
  try {
    browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(appUrl);

    await page.locator("#v-home .exam-group").first().locator("summary").click();
    let home = await checkCardActions(page, "#v-home", true);
    assert.match(await home.mock.locator(".exam-action-detail").textContent(), /^Untimed · no countdown$/);
    await home.mock.click();
    let started = await page.evaluate(() => ({ mode: P.mode, label: P.label, count: P.items.length, deadline: P.deadline }));
    assert.deepEqual(started, { mode: "exam", label: "Scrum Course 1 · Exam 1", count: 80, deadline: null },
      "homepage mock action should start the selected fixed exam without a timer when timing is off");
    await page.click('#pmain [data-pact="quit"]');
    await page.click('#pmain [data-pact="quityes"]');
    await page.click(".brand");

    await page.locator('.nav a[data-nav="practice"]').click();
    await page.locator("#pmain .exam-group").first().locator("summary").click();
    let practice = await checkCardActions(page, "#pmain", true);
    assert.match(await practice.study.locator(".exam-action-detail").textContent(), /Feedback after each answer/);

    await page.setViewportSize({ width: 320, height: 800 });
    await page.click(".brand");
    await page.locator("#v-home .exam-group").first().locator("summary").click();
    home = await checkCardActions(page, "#v-home", true);
    await page.locator('.nav a[data-nav="practice"]').click();
    await page.locator("#pmain .exam-group").first().locator("summary").click();
    practice = await checkCardActions(page, "#pmain", true);

    await page.setViewportSize({ width: 1366, height: 900 });
    await page.locator("#practiceExamTimer").check();
    assert.match(await practice.mock.locator(".exam-action-detail").textContent(), /^Timed · 1 hr$/,
      "turning timing on should clearly label the mock action with its duration");
    await practice.mock.click();
    started = await page.evaluate(() => ({ mode: P.mode, label: P.label, count: P.items.length, remaining: P.deadline - Date.now() }));
    assert.equal(started.mode, "exam");
    assert.equal(started.label, "Scrum Course 1 · Exam 1");
    assert.equal(started.count, 80);
    assert.ok(started.remaining > 59 * 60 * 1000 && started.remaining <= 60 * 60 * 1000,
      "Practice-page mock action should start the selected exam with the saved optional timer");
    await page.click('#pmain [data-pact="quit"]');
    await page.click('#pmain [data-pact="quityes"]');
    await page.locator("#pmain .exam-group").first().locator("summary").click();
    practice = await checkCardActions(page, "#pmain", false);
    await practice.study.click();
    const studyMode = await page.evaluate(() => ({
      mode: P.mode,
      label: P.label,
      deadline: P.deadline,
      timer: !!document.querySelector("#pmain #examTimer")
    }));
    assert.deepEqual(studyMode, {
      mode: "study-exam",
      label: "Scrum Course 1 · Exam 1",
      deadline: null,
      timer: false
    }, "study remains untimed and starts the selected exam even when the optional mock timer is enabled");
    const answers = await page.evaluate(() => P.items[0].q.a);
    for (const answer of answers) await page.click(`#pmain [data-oi="${answer}"]`);
    await page.click('#pmain [data-pact="act"]');
    assert.equal(await page.locator("#pmain .pfb").count(), 1,
      "study mode should show per-answer feedback after the learner checks the answer");

    assert.deepEqual(errors, [], "selector flow should report no browser errors");
    console.log("Exam selector checks passed (homepage and Practice actions, 390px/320px phones, desktop layout, timer labels, and untimed study feedback).");
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
  }
})();
