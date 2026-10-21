# Working on this repo in Delta

## Setup (once)

1. Clone the repo, for example into `C:\Users\kaiol\Projects\scrum-study`:
   `git clone https://github.com/trais92/scrum-study.git`
2. In Delta: **Add Project** → *Add Project to Thread* → choose the `scrum-study` folder → *Open Git Project*. The repo already has a GitHub remote, which Delta needs.
3. **Ctrl+N** for a new thread (the "Welcome to Delta" thread can't change files), paste the first prompt below, send with **Ctrl+Enter**.
4. Review the plan by commenting inline. Then one thread per backlog item.
5. To edit by hand or run a build, open that thread's folder `.delta\worktrees\<thread-id>\scrum-study` in Zed or IntelliJ, not the main folder. Run the build in WSL: `python3 src/build.py`, then open `dist/index.html`.

## Safety rules

- `main` is live: whatever lands in `index.html` on `main` is what the group sees at https://trais92.github.io/scrum-study/. Land changes to `src/` freely; copy `dist/index.html` to `index.html` only after checking the build in a browser.
- Fallback: the branch `pre-delta-2026-10-21` holds the state before Delta. To go back, copy its `index.html` onto `main`.

## Definition of Done (used by every prompt)

- The answer, explanation and any German text match the 2020 Scrum Guide (official German translation).
- `python3 src/build.py` runs without errors and the page works in a desktop and a phone-sized browser window.
- Screens stay clean: no new intro or how-to text.
- Only the files the item needs are changed; nothing is deleted without Kai's OK.

## Thread prompts

### 1. Read and plan (no code)

```
Read README.md, docs/backlog.md, docs/delta.md and the code in src/ (start with src/build.py).
This is a PSM I study app: one self-contained HTML page with the 2020 Scrum Guide (English and the official German translation), exam practice, and a Scrum Master game. It is live on GitHub Pages from index.html on main.

Do not write or change any code yet. Reply with:
1. A short description of how the app is built today (files, build step, where the questions and Guide text come from).
2. What you would keep and what, if anything, you would change in the structure, with a reason for each. Keep it small: no framework, no server, it must stay one file that opens in any browser.
3. A plan for the open backlog items, in order, each small enough to review in one sitting, each with how you would test it.
4. Any risks to the live page.
I will comment on your plan inline before you start.
```

### 2. Make the tests run again

```
Backlog item 2 in docs/backlog.md. The Playwright scripts in src/tests/ point at old folders (../v2/, ../guide/guide.md).
Change them to use dist/ (after python3 src/build.py) and the Guide text in src/guide/. Add a package.json with an "npm test" script that builds and runs the checks.
Do not change the app itself. Show me the test output, including the quote check. Follow the Definition of Done in docs/delta.md.
```

### 3. Live page check

```
Backlog item 3 in docs/backlog.md. Add a GitHub Action that runs on every push and pull request: run python3 src/build.py and fail if dist/index.html differs from index.html.
Keep it to one small workflow file. Do not change the app. Follow the Definition of Done in docs/delta.md.
```

### 4. Add new questions (when Kai has them)

```
Backlog item 1 in docs/backlog.md. Here are questions from old tests: <paste>.
Rewrite each in your own words around the same trap; never copy the original wording. Add them to data/questions.json in the existing format, each with a verbatim quote from the 2020 Scrum Guide that proves the answer.
Check every quote with a script against src/guide/scrum-guide-2020-en.md and show me the result. Skip duplicates of existing questions and tell me which ones. Then rebuild. Follow the Definition of Done in docs/delta.md.
```

### 5. Publish a build

```
Run python3 src/build.py and list what changed in dist/index.html compared with index.html (in words, not a raw diff).
Once I confirm, copy dist/index.html to index.html and land it on main.
```
