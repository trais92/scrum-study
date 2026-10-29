const fs = require("fs");
const path = require("path");

const examPath = path.join(__dirname, "../../data/exams.json");
const exams = JSON.parse(fs.readFileSync(examPath, "utf8"));
const issues = [];
const ids = new Set();
const counts = new Map();

if (!Array.isArray(exams)) {
  console.error("Exam data must be an array.");
  process.exit(1);
}

for (const [index, question] of exams.entries()) {
  const label = `Exam record ${index + 1}${question && question.id ? ` (${question.id})` : ""}`;
  if (!question || typeof question !== "object" || Array.isArray(question)) {
    issues.push(`${label}: must be an object`);
    continue;
  }

  if (!Number.isInteger(question.test) || question.test < 1 || question.test > 6) {
    issues.push(`${label}: test must be an integer from 1 to 6`);
  } else {
    counts.set(question.test, (counts.get(question.test) || 0) + 1);
  }
  if (!["multiple-choice", "multi-select"].includes(question.type)) {
    issues.push(`${label}: type must be multiple-choice or multi-select`);
  }
  if (!Number.isInteger(question.nr) || question.nr < 1 || question.nr > 80) {
    issues.push(`${label}: nr must be an integer from 1 to 80`);
  }
  if (question.id === undefined || question.id === null || !String(question.id).trim()) {
    issues.push(`${label}: id must be nonblank`);
  } else if (ids.has(String(question.id))) {
    issues.push(`${label}: id "${question.id}" is duplicated`);
  } else {
    ids.add(String(question.id));
  }
  if (typeof question.question !== "string" || !question.question.trim()) {
    issues.push(`${label}: question must be nonblank`);
  }
  if (!Array.isArray(question.answers) || question.answers.length < 2) {
    issues.push(`${label}: answers must contain at least two options`);
    continue;
  }

  const answerKeys = new Set();
  for (const answer of question.answers) {
    if (!answer || typeof answer !== "object" ||
        typeof answer.key !== "string" || !answer.key.trim() ||
        typeof answer.text !== "string" || !answer.text.trim() ||
        typeof answer.correct !== "boolean") {
      issues.push(`${label}: each answer needs a key, text, and boolean correct flag`);
      continue;
    }
    if (answerKeys.has(answer.key)) issues.push(`${label}: answer key "${answer.key}" is duplicated`);
    answerKeys.add(answer.key);
  }

  if (!Array.isArray(question.correct) || question.correct.length === 0) {
    issues.push(`${label}: correct must be a nonempty array`);
  } else {
    const flagged = question.answers.filter(answer => answer && answer.correct).map(answer => answer.key).sort();
    const declared = question.correct.map(String).sort();
    if (flagged.join("|") !== declared.join("|")) {
      issues.push(`${label}: correct disagrees with answers[].correct`);
    }
    if (question.correct.some(key => !answerKeys.has(String(key)))) {
      issues.push(`${label}: correct contains an unknown answer key`);
    }
    if ((question.type === "multiple-choice" && flagged.length !== 1) ||
        (question.type === "multi-select" && flagged.length < 2)) {
      issues.push(`${label}: ${question.type} format does not match ${flagged.length} keyed answer(s)`);
    }
  }
  if (typeof question.section !== "string" || !question.section.trim()) {
    issues.push(`${label}: section must be nonblank`);
  }
}

for (let test = 1; test <= 6; test++) {
  if (counts.get(test) !== 80) issues.push(`Test ${test}: expected 80 questions, found ${counts.get(test) || 0}`);
}

for (const question of exams) {
  if (!Number.isInteger(question.test) || !Number.isInteger(question.nr)) continue;
  const occurrences = exams.filter(other => other.test === question.test && other.nr === question.nr).length;
  if (occurrences !== 1) issues.push(`Test ${question.test}, question ${question.nr}: appears ${occurrences} times`);
}

if (issues.length) {
  console.error(`Exam data validation failed with ${issues.length} issue(s):`);
  for (const issue of issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log(`Exam data validation passed (6 exams, ${exams.length} questions).`);
}
