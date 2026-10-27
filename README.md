# Scrum Master on Duty

A free PSM I study kit that runs in any browser, with no sign-up:

- **Scrum Guide 2020**: the full text in English and in the official German translation, searchable, with explained terms.
- **Practice**: smart rounds, rounds by topic, mistakes review, plus separate Product Owner and Scrum Master question banks.
- **Exams**: six fixed 80-question exams and a random 80-question mock from the practice bank.
- **Game**: three Sprints as the Scrum Master of a small web team, with an animated office and a "Watch a Sprint" mode.

Open it: https://trais92.github.io/scrum-study/

Everything is in one file, `index.html`. Progress is saved only in your own browser.

## Build

The live page is `index.html` in the repo root, served by GitHub Pages from `main`. It is built from `src/`:

```
python3 src/build.py          # writes dist/index.html and dist/scrum-master-on-duty.html
cp dist/index.html index.html # publish: commit and push to main
```

Python 3.10 or newer, no packages needed. Open `dist/index.html` in a browser to try a build before publishing.

## Tests

Install Node.js and npm, then install the pinned test tools and Chromium once:

```
npm ci
npx playwright install chromium
```

Run `npm test` to validate all question banks and six exam sets, rebuild `dist/`, check the Guide quotes, simulate a game, and run browser smoke checks on desktop and phone-sized viewports.

CI reports two separate checks:

- **Test suite** is red if the build, question-bank or exam-set validation, Guide quote check, game simulation, or desktop/phone browser smoke checks fail.
- **Live-page freshness** is red if rebuilding `dist/index.html` produces a different file from the committed `index.html`. Rebuild and copy `dist/index.html` to `index.html` before committing.

`npm test` runs only the checks listed above. `src/tests/batch.js`, `e2e.js`, `inv2.js`, `phone.js`, `qa-fix.js`, and `watch.js` are legacy/manual investigation scripts; they are not part of the automated test suite. `paths.js` is a helper used by browser scripts.

| Path | What it is |
|---|---|
| `index.html` | The live page (built file, do not edit by hand) |
| `src/shell.html`, `src/app.css` | Page layout and styles |
| `src/app.js`, `src/ui.js` | Start page, Guide reader, practice and exam |
| `src/engine.js`, `src/story.js`, `src/office.js` | The game: rules, story and animated office |
| `src/guide/` | Scrum Guide 2020: English, official German (from the PDF) and term explanations |
| `data/questions.json` | The practice question bank, each answer with its Scrum Guide quote |
| `data/exams.json` | Six fixed, 80-question exam sets |
| `data/imported/` | Separate Product Owner (1,000) and Scrum Master (1,002) question banks |
| `src/tests/` | Quote, game simulation, and Playwright checks |
| `docs/` | Backlog and notes for working with agents in Delta |

The state before the Delta setup is kept on the branch `pre-delta-2026-10-21`.

## Licence and credits

The Scrum Guide 2020 © Ken Schwaber and Jeff Sutherland, offered under the [Creative Commons Attribution Share-Alike 4.0 licence](https://creativecommons.org/licenses/by-sa/4.0/). Original text: [scrumguides.org](https://scrumguides.org/). The German text is the official translation by the GermanScrumTranslators (version 3.5) and is unchanged. The explanations added to underlined terms are not part of the Scrum Guide.

The original practice questions and the game are study material based on the Guide. They are not official Scrum.org exam questions. This adapted material is shared under the same CC BY-SA 4.0 licence. The six fixed exam sets in `data/exams.json` and the two imported question banks in `data/imported/` were supplied separately from learning-platform exports and are not part of that original question-bank licence statement.
