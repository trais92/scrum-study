const fs = require("fs");
const path = require("path");

const bankPath = path.join(__dirname, "../../data/questions.json");
const bank = JSON.parse(fs.readFileSync(bankPath, "utf8"));
const issues = [];

if (!bank || !Array.isArray(bank.questions)) {
  console.error("Question bank must contain a questions array.");
  process.exit(1);
}

const ids = new Set();
for (const [index, question] of bank.questions.entries()) {
  const label = `Question ${index + 1}${question && question.id ? ` (${question.id})` : ""}`;
  if (!question || typeof question !== "object" || Array.isArray(question)) {
    issues.push(`${label}: must be an object`);
    continue;
  }

  if (typeof question.id !== "string" || !question.id.trim()) {
    issues.push(`${label}: id must be a nonblank string`);
  } else if (ids.has(question.id)) {
    issues.push(`${label}: id "${question.id}" is duplicated`);
  } else {
    ids.add(question.id);
  }

  if (typeof question.q !== "string" || !question.q.trim()) {
    issues.push(`${label}: q must be a nonblank string`);
  }

  if (!Array.isArray(question.o) || question.o.length < 2) {
    issues.push(`${label}: o must contain at least two options`);
  }

  if (!Array.isArray(question.a) || question.a.length === 0) {
    issues.push(`${label}: a must be a nonempty array of option indexes`);
  } else {
    for (const answer of question.a) {
      if (!Number.isInteger(answer) || !Array.isArray(question.o) || answer < 0 || answer >= question.o.length) {
        issues.push(`${label}: answer index ${JSON.stringify(answer)} must be an integer index in o`);
      }
    }
  }

  if (typeof question.r !== "string" || !question.r.trim()) {
    issues.push(`${label}: r must be a nonblank string`);
  }

  if (!Array.isArray(question.g) || question.g.length === 0 ||
      question.g.some(quote => typeof quote !== "string" || !quote.trim())) {
    issues.push(`${label}: g must contain at least one nonblank quote`);
  }
}

if (issues.length) {
  console.error(`Question bank validation failed with ${issues.length} issue(s):`);
  for (const issue of issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log(`Question bank validation passed (${bank.questions.length} questions).`);
}
