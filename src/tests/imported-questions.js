const fs = require("fs");
const path = require("path");

const banks = [
  ["pspo_1000_fragen.json", 1000, "Product Owner"],
  ["psm_1000_fragen.json", 1002, "Scrum Master"]
];
const issues = [];
let typeCountMismatches = 0;

for (const [file, expectedCount, label] of banks) {
  const filePath = path.join(__dirname, "../../data/imported", file);
  const questions = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const ids = new Set();

  if (!Array.isArray(questions)) {
    issues.push(`${label}: expected an array of questions`);
    continue;
  }
  if (questions.length !== expectedCount) {
    issues.push(`${label}: expected ${expectedCount} questions, found ${questions.length}`);
  }

  for (const [index, question] of questions.entries()) {
    const name = `${label} question ${index + 1}`;
    if (!question || typeof question !== "object" || Array.isArray(question)) {
      issues.push(`${name}: must be an object`);
      continue;
    }
    if (question.id === undefined || question.id === null || !String(question.id).trim()) {
      issues.push(`${name}: id must be nonblank`);
    } else if (ids.has(String(question.id))) {
      issues.push(`${name}: id "${question.id}" is duplicated`);
    } else {
      ids.add(String(question.id));
    }
    if (typeof question.question !== "string" || !question.question.trim()) {
      issues.push(`${name}: question must be nonblank`);
    }
    if (!["multiple-choice", "multi-select"].includes(question.type)) {
      issues.push(`${name}: type must be multiple-choice or multi-select`);
    }
    if (!Array.isArray(question.answers) || question.answers.length < 2) {
      issues.push(`${name}: answers must contain at least two options`);
      continue;
    }

    const answerKeys = new Set();
    let invalidAnswer = false;
    for (const answer of question.answers) {
      if (!answer || typeof answer !== "object" ||
          typeof answer.key !== "string" || !answer.key.trim() ||
          typeof answer.text !== "string" || !answer.text.trim() ||
          typeof answer.correct !== "boolean") {
        issues.push(`${name}: each answer needs a key, text, and boolean correct flag`);
        invalidAnswer = true;
        continue;
      }
      if (answerKeys.has(answer.key)) issues.push(`${name}: answer key "${answer.key}" is duplicated`);
      answerKeys.add(answer.key);
    }
    if (invalidAnswer) continue;

    const flagged = question.answers.filter(answer => answer.correct).map(answer => answer.key).sort();
    if (!Array.isArray(question.correct) || question.correct.length === 0) {
      issues.push(`${name}: correct must be a nonempty array`);
    } else {
      const declared = question.correct.map(String).sort();
      if (flagged.join("|") !== declared.join("|")) {
        issues.push(`${name}: correct disagrees with answers[].correct`);
      }
      if (question.correct.some(key => !answerKeys.has(String(key)))) {
        issues.push(`${name}: correct contains an unknown answer key`);
      }
    }
    if ((question.type === "multiple-choice" && flagged.length !== 1) ||
        (question.type === "multi-select" && flagged.length < 2)) typeCountMismatches++;
  }
}

if (issues.length) {
  console.error(`Imported question validation failed with ${issues.length} issue(s):`);
  for (const issue of issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log("Imported question validation passed (1,000 Product Owner and 1,002 Scrum Master questions).");
  if (typeCountMismatches) {
    console.log(`Note: ${typeCountMismatches} source type labels do not match the number of keyed answers; keyed answers are retained as supplied.`);
  }
}
