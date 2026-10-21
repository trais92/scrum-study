# Backlog

Open items for the study app. Items marked **Suggestion** were proposed by Claude and are not decided yet; Kai accepts or rejects them.

Rules that apply to every item:
- Every answer and explanation must match the 2020 Scrum Guide. German text only from the official translation in `src/guide/`.
- Clean screens with very little explanation text.
- Runs in any browser, no sign-up, one self-contained file.
- Rebuild with `python3 src/build.py`, open `dist/index.html`, then copy it to `index.html` only when it is good.

## Open

### 1. Add questions from Kai's old tests
Kai will supply questions from real old tests. Real Scrum.org questions are confidential, so they are rewritten in our own words around the same trap.
- Each new question has a verbatim Scrum Guide quote that proves the answer.
- No duplicates of existing questions.
- Shows up in practice and in the mock exam after a rebuild.

### 2. Make the test scripts run again (Suggestion)
The Playwright scripts in `src/tests/` still point at old folders (`../v2/`, `../guide/guide.md`).
- Tests read `dist/` and `src/guide/`.
- One command runs them (for example `npm test`).
- The quote check reports 0 quotes not found.

### 3. Check that the live page matches the source (Suggestion)
- A small script or GitHub Action builds `src/` and fails if `dist/index.html` differs from `index.html`.

### 4. Product Owner (PSPO I) questions (deferred)
Kai decided PSM I first; PSPO I maybe later. Not started.
