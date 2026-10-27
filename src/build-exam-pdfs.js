const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const pdfDir = path.join(root, "downloads", "exams");
const distPdfDir = path.join(root, "dist", "downloads", "exams");
const examSources = [
  { file: "data/exams.json", topic: null, course: "Scrum Course 1", slug: "scrum-course-1" },
  { file: "data/imported/psm_1000_fragen.json", topic: "psm", course: "Scrum Course 2", slug: "scrum-course-2" },
  { file: "data/imported/pspo_1000_fragen.json", topic: "po", course: "Product Owner Course", slug: "product-owner-course" }
];

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
  })[char]);
}

function normalizePdfMetadata(file) {
  const pdf = fs.readFileSync(file).toString("latin1");
  const stable = pdf.replace(/\/(?:CreationDate|ModDate) \(D:\d{14}[+-]\d{2}'\d{2}'\)/g, match => " ".repeat(match.length));
  fs.writeFileSync(file, Buffer.from(stable, "latin1"));
}

function getQuestions(source, test) {
  const records = JSON.parse(fs.readFileSync(path.join(root, source.file), "utf8"))
    .filter(question => question.test === test)
    .sort((a, b) => a.nr - b.nr);
  return records.map(question => ({
    number: question.nr,
    text: question.question,
    answers: question.answers.map(answer => answer.text),
    correct: question.answers.reduce((indices, answer, index) => {
      if (answer.correct) indices.push(index);
      return indices;
    }, [])
  }));
}

function pageHtml({ course, examNumber, questions, answerKey = false }) {
  const title = `${course} · Exam ${examNumber}`;
  const titleBlock = `<header class="cover">
    <div class="eyebrow">SCRUM STUDY · PRINT EDITION</div>
    <h1>${escapeHtml(title)}${answerKey ? " · Answer key" : ""}</h1>
    <p class="meta">${questions.length} questions <span>·</span> Untimed <span>·</span> ${answerKey ? "Answer key" : "Question paper"}</p>
  </header>`;
  const content = answerKey
    ? `<div class="key-list">${questions.map(question => {
         const answers = question.correct.map(index => `<span class="answer-key">${String.fromCharCode(65 + index)}</span> <span>${escapeHtml(question.answers[index])}</span>`);
         return `<section class="key-item"><b>Question ${question.number}</b><div>${answers.join("<br>")}</div></section>`;
       }).join("")}</div>`
    : `<main class="questions">${questions.map(question => `<section class="question">
         <div class="question-heading"><b>Question ${question.number}</b><span>${question.correct.length > 1 ? `Choose ${question.correct.length} answers` : "Choose 1 answer"}</span></div>
         <p class="stem">${escapeHtml(question.text)}</p>
         <ul class="options">${question.answers.map((answer, index) => `<li><span class="box" aria-hidden="true"></span><b>${String.fromCharCode(65 + index)}.</b><span>${escapeHtml(answer)}</span></li>`).join("")}</ul>
       </section>`).join("")}</main>`;

  return `<!doctype html>
  <html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(title)}${answerKey ? " · Answer key" : ""}</title>
  <style>
    * { box-sizing: border-box; }
    html { color: #111; background: #fff; font-family: Arial, Helvetica, sans-serif; font-size: 10pt; line-height: 1.42; }
    body { margin: 0; }
    .cover { margin: 0 0 10mm; padding: 0 0 5mm; border-bottom: 2px solid #111; }
    .eyebrow { margin-bottom: 2mm; font-size: 8pt; font-weight: 700; letter-spacing: .14em; }
    h1 { margin: 0; font-size: 22pt; line-height: 1.15; }
    .meta { margin: 2mm 0 0; font-size: 9pt; font-weight: 700; }
    .meta span { padding: 0 2mm; }
    .question { break-inside: avoid; padding: 4mm 0; border-bottom: 1px solid #aaa; }
    .question-heading { display: flex; justify-content: space-between; gap: 5mm; align-items: baseline; }
    .question-heading b { font-size: 11pt; }
    .question-heading span { font-size: 8.5pt; font-weight: 700; }
    .stem { margin: 2mm 0 3mm; font-size: 10.5pt; font-weight: 700; white-space: pre-wrap; }
    .options { display: grid; gap: 2mm; margin: 0; padding: 0; list-style: none; }
    .options li { display: grid; grid-template-columns: 4mm 7mm minmax(0, 1fr); gap: 2mm; align-items: start; break-inside: avoid; }
    .box { width: 3.5mm; height: 3.5mm; margin-top: .5mm; border: 1px solid #111; }
    .options li b { font-size: 9pt; }
    .options li span:last-child { white-space: pre-wrap; }
    .key-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 3mm 6mm; }
    .key-item { break-inside: avoid; padding: 2mm 0; border-bottom: 1px solid #aaa; }
    .key-item > b { display: inline-block; min-width: 24mm; }
    .answer-key { font-weight: 700; }
    @media print {
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      html { color: #000; background: #fff; }
      .question, .key-item { border-color: #777; }
    }
  </style></head><body>${titleBlock}${content}</body></html>`;
}

async function main() {
  fs.mkdirSync(pdfDir, { recursive: true });
  fs.mkdirSync(distPdfDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let total = 0;
  try {
    for (const source of examSources) {
      for (let test = 1; test <= 6; test++) {
        const questions = getQuestions(source, test);
        if (!questions.length) throw new Error(`${source.course} exam ${test} has no questions`);
        for (const answerKey of [false, true]) {
          const suffix = answerKey ? "-answer-key" : "";
          const filename = `${source.slug}-exam-${test}${suffix}.pdf`;
          const title = `${source.course} · Exam ${test}${answerKey ? " · Answer key" : ""}`;
          const html = pageHtml({ course: source.course, examNumber: test, questions, answerKey });
          await page.setContent(html, { waitUntil: "load" });
          const headerTemplate = `<div style="width:100%;padding:0 14mm 2mm;border-bottom:1px solid #777;font:8px Arial,sans-serif;color:#333">${escapeHtml(title)}</div>`;
          const footerTemplate = `<div style="width:100%;padding:2mm 14mm 0;border-top:1px solid #777;font:8px Arial,sans-serif;color:#333;text-align:right">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`;
          const output = path.join(pdfDir, filename);
          await page.pdf({
            path: output,
            format: "A4",
            documentTitle: title,
            printBackground: false,
            displayHeaderFooter: true,
            headerTemplate,
            footerTemplate,
            margin: { top: "20mm", right: "14mm", bottom: "19mm", left: "14mm" }
          });
          normalizePdfMetadata(output);
          fs.copyFileSync(output, path.join(distPdfDir, filename));
          total++;
        }
      }
    }
  } finally {
    await browser.close();
  }
  console.log(`Generated ${total} A4 PDFs (18 question papers and 18 separate answer keys).`);
}

if (require.main === module) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { getQuestions, pageHtml };
