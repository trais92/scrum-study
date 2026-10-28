const fs = require("fs");
const path = require("path");
const { getQuestions, pageHtml } = require("../build-exam-pdfs.js");

const root = path.resolve(__dirname, "../..");
const courseSets = [
  { slug: "scrum-course-1", course: "Scrum Course 1", file: "data/exams.json", expected: [80, 80, 80, 80, 80, 80] },
  { slug: "scrum-course-2", course: "Scrum Course 2", file: "data/imported/psm_1000_fragen.json", expected: [180, 181, 180, 181, 180, 100] },
  { slug: "product-owner-course", course: "Product Owner Course", file: "data/imported/pspo_1000_fragen.json", expected: [179, 181, 180, 180, 180, 100] }
];
const issues = [];
let totalBytes = 0;

for (const course of courseSets) {
  const source = JSON.parse(fs.readFileSync(path.join(root, course.file), "utf8"));
  for (let exam = 1; exam <= 6; exam++) {
    const questions = source.filter(question => question.test === exam);
    if (questions.length !== course.expected[exam - 1]) {
      issues.push(`${course.slug} exam ${exam}: source has ${questions.length} questions`);
    }
    const normalized = getQuestions(course, exam);
    const questionPaper = pageHtml({ course: course.course, examNumber: exam, questions: normalized });
    const answerKey = pageHtml({ course: course.course, examNumber: exam, questions: normalized, answerKey: true });
    if ((questionPaper.match(/class="question"/g) || []).length !== questions.length) {
      issues.push(`${course.slug} exam ${exam}: question paper template has the wrong number of questions`);
    }
    const directions = [...questionPaper.matchAll(/<div class="question-heading">[\s\S]*?<span>(.*?)<\/span>/g)].map(([, text]) => text);
    if (directions.length !== questions.length || directions.some(text => text !== "Choose every correct option")) {
      issues.push(`${course.slug} exam ${exam}: question paper reveals the keyed answer count`);
    }
    if (!questionPaper.includes("class=\"box\"") || questionPaper.includes("class=\"answer-key\"")) {
      issues.push(`${course.slug} exam ${exam}: question paper does not keep answers separate`);
    }
    if (!questionPaper.includes(`<h1>${course.course} · Exam ${exam}</h1>`) ||
        questionPaper.includes("class=\"candidate\"") || questionPaper.includes("class=\"instructions\"") ||
        answerKey.includes("class=\"instructions\"")) {
      issues.push(`${course.slug} exam ${exam}: course title or clean print layout is missing`);
    }
    if ((answerKey.match(/class="answer-key"/g) || []).length !== questions.reduce((sum, question) => sum + question.answers.filter(answer => answer.correct).length, 0)) {
      issues.push(`${course.slug} exam ${exam}: answer key template omits keyed answers`);
    }
    for (const suffix of ["", "-answer-key"]) {
      const filename = `${course.slug}-exam-${exam}${suffix}.pdf`;
      const published = path.join(root, "downloads", "exams", filename);
      const built = path.join(root, "dist", "downloads", "exams", filename);
      if (!fs.existsSync(published) || !fs.existsSync(built)) {
        issues.push(`${filename}: generated PDF is missing`);
        continue;
      }
      const pdf = fs.readFileSync(published);
      const builtPdf = fs.readFileSync(built);
      const sourceText = pdf.toString("latin1");
      const pages = sourceText.match(/\/Type\s*\/Page\b/g) || [];
      if (pdf.subarray(0, 5).toString() !== "%PDF-" || !sourceText.includes("%%EOF") || pages.length < 1) {
        issues.push(`${filename}: does not look like a complete PDF with pages`);
      }
      if (!pdf.equals(builtPdf)) issues.push(`${filename}: published and dist copies differ`);
      totalBytes += pdf.length;
    }
  }
}

if (issues.length) {
  console.error(`Exam PDF validation failed with ${issues.length} issue(s):`);
  for (const issue of issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log(`Exam PDF validation passed (18 question papers, 18 answer keys, ${(totalBytes / 1024 / 1024).toFixed(1)} MiB).`);
}
