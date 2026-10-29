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

    const homeExam = page.locator('#v-home [data-home="exam"]');
    assert.match(await homeExam.innerText(), /80 questions.*choose a mode/i, "home entry should disclose both exam modes");
    await homeExam.click();
    assert.match(await page.locator("#pmain h2").first().innerText(), /choose your exam mode/i);
    assert.equal(await page.locator('#pmain [data-p="exam-study"]').innerText().then(text => text.includes("no timer") && text.includes("feedback after each answer")), true);
    await page.click('#pmain [data-p="exam-back"]');
    await page.click('#pmain [data-p="exam"]');
    assert.match(await page.locator("#pmain h2").first().innerText(), /choose your exam mode/i, "practice dashboard should offer the same mode choice");
    await page.click('#pmain [data-p="exam-study"]');

    const study = await page.evaluate(() => ({
      mode: P.mode,
      label: P.label,
      count: P.items.length,
      unique: new Set(P.items.map(item => item.q.id)).size,
      hasEnd: Object.prototype.hasOwnProperty.call(P, "end"),
      hasTimer: !!P.timer,
      questionCountLabel: document.querySelector("#pmain .qhead .hint").textContent
    }));
    assert.deepEqual(
      { mode: study.mode, label: study.label, count: study.count, unique: study.unique, hasEnd: study.hasEnd, hasTimer: study.hasTimer },
      { mode: "study-exam", label: "Study an exam", count: 80, unique: 80, hasEnd: false, hasTimer: false },
      "learning mode should start an untimed randomized 80-question exam"
    );
    assert.match(study.questionCountLabel, /Question 1 of 80/);
    assert.equal(await page.locator("#pmain #qtimer").count(), 0, "learning mode must not render a timer");
    assert.equal(await page.locator("#pmain .qhead .mode").innerText(), "Study an exam");

    const multiAnswers = await page.evaluate(() => {
      const index = P.items.findIndex((item, i) => i < P.items.length - 1 && item.q.a.length > 1);
      if (index < 0) throw new Error("No multi-select question found in the selected exam");
      P.i = index;
      renderPQ();
      return P.items[P.i].q.a;
    });
    for (const answer of multiAnswers) await page.click(`#pmain [data-oi="${answer}"]`);
    assert.equal((await page.locator('#pmain [data-pact="act"]').textContent()).trim(), "Check answer");
    assert.equal(await page.locator('#pmain [data-pact="act"]').isEnabled(), true);
    assert.equal(await page.locator("#pmain .pfb").count(), 0, "selecting all multi-select answers must not reveal feedback");
    await page.click('#pmain [data-pact="act"]');
    assert.match(await page.locator("#pmain .pfb strong").innerText(), /correct/i);
    assert.ok(await page.locator("#pmain .pfb p").textContent(), "feedback should include the question explanation");
    assert.match(await page.locator("#pmain .pquote .ref").textContent(), /Scrum Guide 2020/, "feedback should include the Guide reference");
    assert.equal((await page.locator('#pmain [data-pact="act"]').textContent()).trim(), "Next question");

    await page.click(".brand");
    await page.click('#v-home [data-home="exam"]');
    await page.click('#pmain [data-p="exam-timed"]');
    const timed = await page.evaluate(() => ({
      mode: P.mode,
      label: P.label,
      count: P.items.length,
      unique: new Set(P.items.map(item => item.q.id)).size,
      remaining: P.end - Date.now()
    }));
    assert.deepEqual(
      { mode: timed.mode, label: timed.label, count: timed.count, unique: timed.unique },
      { mode: "exam", label: "Mock exam", count: 80, unique: 80 },
      "timed mock exam must retain its existing exam state and randomized 80-question length"
    );
    assert.ok(timed.remaining > 59 * 60 * 1000 && timed.remaining <= 60 * 60 * 1000, "timed mock exam should retain its 60-minute deadline");
    assert.ok(await page.locator("#pmain #qtimer").isVisible(), "timed mock exam should show its timer");
    await page.locator("#pmain [data-oi]").first().click();
    assert.equal(await page.locator("#pmain .pfb").count(), 0, "timed mock exam should not show per-answer feedback");
    assert.equal((await page.locator('#pmain [data-pact="act"]').textContent()).trim(), "Next", "timed mock exam should keep its next-question flow");

    assert.deepEqual(errors, [], "browser should report no page errors");
    console.log("Exam mode regression checks passed (learning and timed modes).");
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
  }
})();
