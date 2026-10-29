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

    const completeResult = async ({ examId = "exam-1", timed = false, passed = true, mode = "exam", rerender = false } = {}) => page.evaluate(options => {
      clearExamConfetti();
      const bank = options.examId === "exam-bank" ? QS : EXAM_BY_ID[options.examId].questions;
      const q = bank.find(question => question.a.length === 1);
      const pickAnswer = () => { P.items[0].picked = options.passed ? q.a.slice() : [q.o.findIndex((_, index) => !q.a.includes(index))]; };
      if (options.mode === "exam") {
        const wasTimed = pstore.timedExams;
        pstore.timedExams = options.timed;
        startExam({ id: options.examId, label: "Regression exam", questions: [q] }, "mock");
        pstore.timedExams = wasTimed;
        pickAnswer();
        finishExam();
        if (options.rerender) showPResults(true);
      } else {
        P = { mode: options.mode, label: options.mode === "practice" ? "Smart round" : "Regression exam", examId: options.examId, items: [makeItem(q)], i: 0, flags: new Set() };
        pickAnswer();
        showPResults(false);
      }
      return {
        result: document.querySelector("#pmain .pverdict")?.textContent.trim(),
        celebration: !!P.celebrationStarted,
        timed: !!P.deadline,
        canvasCount: document.querySelectorAll("canvas.exam-confetti").length,
        waves: document.querySelector("canvas.exam-confetti")?.dataset.waves,
        pointerEvents: document.querySelector("canvas.exam-confetti") && getComputedStyle(document.querySelector("canvas.exam-confetti")).pointerEvents
      };
    }, { examId, timed, passed, mode, rerender });
    for (const examId of ["exam-1", "exam-psm-1", "exam-po-1", "exam-bank"]) {
      const passed = await completeResult({ examId, timed: examId === "exam-psm-1" || examId === "exam-bank", rerender: true });
      assert.equal(passed.result, "Pass", `${examId} should preserve the passing exam result`);
      assert.equal(passed.celebration, true, `${examId} should mark its pass celebration as started`);
      assert.equal(passed.timed, examId === "exam-psm-1" || examId === "exam-bank", `${examId} should respect its timed or untimed exam setting`);
      assert.equal(passed.canvasCount, 1, `${examId} should create exactly one confetti canvas on result rerender`);
      assert.equal(passed.waves, "3", `${examId} should use multiple confetti waves`);
      assert.equal(passed.pointerEvents, "none", `${examId} confetti should not block controls`);
    }
    await completeResult({ examId: "exam-1" });
    await page.waitForTimeout(3800);
    const cleanedConfetti = await page.evaluate(() => ({ canvases: document.querySelectorAll("canvas.exam-confetti").length, activeCleanup: !!examConfettiCleanup }));
    assert.deepEqual(cleanedConfetti, { canvases: 0, activeCleanup: false }, "confetti canvas and animation cleanup should be removed after the burst");
    const failed = await completeResult({ examId: "exam-bank", passed: false });
    assert.equal(failed.result, "Below pass mark", "failed exam should preserve its failure result");
    assert.equal(failed.celebration, false, "failed exam should not celebrate");
    assert.equal(failed.canvasCount, 0, "failed exam should not create confetti");
    for (const mode of ["practice", "study-exam"]) {
      const notExam = await completeResult({ mode });
      assert.equal(notExam.canvasCount, 0, `${mode} results should not trigger an exam celebration`);
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    const reducedMotionPass = await completeResult({ examId: "exam-1" });
    assert.equal(reducedMotionPass.result, "Pass", "reduced-motion users should retain the passing result text");
    assert.equal(reducedMotionPass.celebration, true, "reduced-motion pass should be handled without restarting on rerender");
    assert.equal(reducedMotionPass.canvasCount, 0, "reduced-motion preference should suppress animated confetti");
    await page.emulateMedia({ reducedMotion: "no-preference" });

    assert.deepEqual(errors, [], "browser should report no page errors");
    console.log("Exam mode regression checks passed (pass/fail celebrations, timed/untimed exam banks, reduced motion, Smart round, and study modes).");
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
  }
})();
