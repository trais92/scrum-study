const assert = require("assert");
const { chromium } = require("playwright");
const { appUrl } = require("./paths.js");

(async () => {
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(appUrl);

    await page.click('#v-home [data-home="smart"]');
    const smart = await page.evaluate(() => ({ mode: P.mode, label: P.label, count: P.items.length }));
    assert.deepEqual(smart, { mode: "practice", label: "Smart round", count: 10 }, "Smart round should retain its existing practice flow");
    await page.click('#pmain [data-pact="quit"]');
    await page.click('#pmain [data-pact="quityes"]');
    await page.click(".brand");

    await page.click('.nav a[data-nav="practice"]');
    assert.equal(await page.locator('#pmain [data-p^="exam-"]').count(), 19, "practice should keep all 18 course exams and the question-bank mock");
    assert.equal(await page.locator('#pmain [data-p^="study-exam-"]').count(), 19, "every exam should offer untimed study with immediate feedback");
    await page.locator("#pmain .exam-group").first().locator("summary").click();
    await page.click('#pmain [data-p="study-exam-1"]');

    const study = await page.evaluate(() => ({
      mode: P.mode,
      label: P.label,
      count: P.items.length,
      unique: new Set(P.items.map(item => item.q.id)).size,
      deadline: P.deadline,
      timer: !!document.querySelector("#pmain #examTimer"),
      title: document.querySelector("#pmain .qhead .mode").textContent
    }));
    assert.deepEqual(
      { mode: study.mode, label: study.label, count: study.count, unique: study.unique, deadline: study.deadline, timer: study.timer },
      { mode: "study-exam", label: "Scrum Course 1 · Exam 1", count: 80, unique: 80, deadline: null, timer: false },
      "study mode should use the selected exam without a timer"
    );
    assert.match(study.title, /Study · Scrum Course 1 · Exam 1/);

    const answers = await page.evaluate(() => P.items[0].q.a);
    for (const answer of answers) await page.click(`#pmain [data-oi="${answer}"]`);
    assert.equal(await page.locator("#pmain .pfb").count(), 0, "study feedback should wait until the learner checks an answer");
    await page.click('#pmain [data-pact="act"]');
    assert.equal(await page.locator("#pmain .pfb").count(), 1, "study mode should show immediate feedback after checking");
    assert.equal((await page.locator('#pmain [data-pact="act"]').textContent()).trim(), "Next question");

    await page.click(".brand");
    await page.locator("#homeExamTimer").check();
    await page.click('#v-home [data-home="exam-bank"]');
    const timed = await page.evaluate(() => ({
      mode: P.mode,
      label: P.label,
      count: P.items.length,
      unique: new Set(P.items.map(item => item.q.id)).size,
      remaining: P.deadline - Date.now()
    }));
    assert.deepEqual(
      { mode: timed.mode, label: timed.label, count: timed.count, unique: timed.unique },
      { mode: "exam", label: "Exam 7 · Question bank", count: 80, unique: 80 },
      "timed mock should keep the randomized question-bank exam"
    );
    assert.ok(timed.remaining > 59 * 60 * 1000 && timed.remaining <= 60 * 60 * 1000, "timed mock should retain the 60-minute deadline");
    assert.ok(await page.locator("#pmain #examTimer").isVisible(), "timed mock should show its timer");
    await page.locator("#pmain [data-oi]").first().click();
    assert.equal(await page.locator("#pmain .pfb").count(), 0, "timed mock should not show per-answer feedback");
    assert.equal((await page.locator('#pmain [data-pact="act"]').textContent()).trim(), "Next", "timed mock should keep its next-question flow");

    assert.deepEqual(errors, [], "browser should report no page errors");
    console.log("Exam mode regression checks passed (Smart round, mock, and study modes).");
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
  }
})();
