# Studo — how to publish it

Everything here is free — no card, no paid plan. You'll use GitHub's
website only (no commands, no terminal).

## What's in this folder

```
index.html          Home page
practice.html         Practice page — untimed drills, sidebar filters + module grid
module.html            The passage -> questions -> explanations flow (untimed)
quiz.html              Quiz page — pick a skill area or full test
test.html               The timed test runner (one countdown, submit for results)
resources.html        Resources page — sidebar filters + list
builder.html            Your private module-builder tool (don't share this link)
manifest.json, sw.js  Make the site installable + work offline
css/style.css           All the styling
js/                          The code that runs each page
data/                       Module JSON files + index.json (modules) + resources.json (resources)
icons/                       App icons
```

## Subjects
The subject bar under the header (Mathematical Reasoning / Science /
Social Studies / Reasoning Through Language Arts) is site-wide. Only
RLA is live — the other three show a "Soon" pill and aren't
clickable. To turn one on later, open `js/subjectbar.js` and flip its
`enabled` flag to `true`, then start adding modules with that
`subject` value.

## Step 1 — Create a free GitHub account
Go to github.com → Sign up → confirm your email. That's it, no payment info needed.

## Step 2 — Create a repository (a project folder on GitHub)
1. Click the **+** in the top-right → **New repository**.
2. Name it something like `study-ledger`.
3. Set it to **Public** (so the link works for anyone).
4. Leave everything else as default → **Create repository**.

## Step 3 — Upload this site
1. On your new (empty) repo page, click **uploading an existing file**.
2. Drag every file and folder from this project into the upload box
   (yes, you can drag whole folders like `css/`, `js/`, `data/`, `icons/`).
3. Scroll down → **Commit changes**.

## Step 4 — Turn on GitHub Pages
1. In your repo, go to **Settings** → **Pages** (left sidebar).
2. Under "Build and deployment" → Source: **Deploy from a branch**.
3. Branch: **main**, folder: **/ (root)** → **Save**.
4. Wait about a minute, then refresh — GitHub shows your live link at
   the top, something like:
   `https://yourusername.github.io/study-ledger/`

That link is what you send to learners. It works forever, for free,
and after their first visit it keeps working offline too.

## Step 5 — Bookmark your Builder page for yourself
Your private editing tool lives at:
`https://yourusername.github.io/study-ledger/builder.html`

Don't put this link in anything you share publicly — it has no
password, it's just "not listed" anywhere. (If you want it fully
hidden later, we can talk about a simple password gate.)

## How to add a new module (do this whenever you want to publish one)
1. Open your **Builder** page.
2. Fill in the title, description, subject, skill area (category),
   topic, difficulty, source credit, and questions.
   - Skill area maps to the Practice sidebar: Reading, Writing and
     Analysis, or Language Conventions. Topic is the sub-heading
     within it (e.g. "Main Idea & Details") — modules sharing a topic
     get grouped together, sorted by difficulty.
   - Question types: multiple choice, evidence-based (options are
     quoted excerpts), grammar edit (write the sentence with
     `{{blank}}` where the editable word goes), fill in the blank,
     open ended, extended response.
3. Click **Download quiz JSON** — this saves a `.json` file to your
   computer.
4. Go to your GitHub repo → open the `data` folder → **Add file** →
   **Upload files** → upload that `.json` file.
5. Open `data/index.json` in the repo (click it, then the pencil/edit
   icon) and add an entry for your new module, e.g.:
   ```json
   {
     "file": "your-new-module.json",
     "title": "Your Module Title",
     "description": "One line about it"
   }
   ```
   (Don't forget the comma between entries if there's more than one.)
6. Commit changes. Give it a minute — the new module now shows up on
   both the Practice page (under its skill area/topic) and the Quiz
   page (folded into that skill area's timed test).

## How to add a Resources entry
Open `data/resources.json` in the repo (pencil icon) and add an entry:
```json
{ "kind": "guide", "title": "Your resource title", "url": "https://..." }
```
`kind` must be one of: `phrase_bank`, `reading`, `guide`, `book`.

## How to edit the Home page text
It's plain text inside `index.html`. Open the file in GitHub (pencil
icon to edit), change the words between the `<p>` and `<h1>` tags,
and commit. No code knowledge required beyond "don't delete the
`<...>` tags."

## What learners can and can't do
- They **can**: answer questions, change their answers, delete
  (hide) questions they've mastered, highlight text, and take notes
  — all saved automatically to their own device.
- They **can't**: send anything back to you, or affect what other
  learners see. Every learner's copy is independent and private to
  them.

## If you want to update the design or add features later
Everything is plain HTML/CSS/JavaScript with comments explaining
each part — bring this whole folder back to a fresh conversation
and describe what you want changed.

## Phase 3C additions

- `train.html` + `js/train.js`: builds a short reasoned training session from local learning history.
- Skill review timing is stored locally and spaced after successful retrieval.
- Mistakes now prefer fresh parallel questions (same family/skill) before immediate exact repeats.
- New transfer modules provide alternate Reading and Language Convention questions so transfer can be demonstrated with current sample content.
- The Home and Progress surfaces can send returning learners directly into Train Me while manual Practice remains available.

## Phase 4A content pipeline

The learner-facing app no longer needs the source-of-truth content to live directly in `data/*.json`.

Authoring source:

```text
content-src/
  skills/
  passages/
  sets/
```

Validation and build:

```bash
npm run content:validate
npm run content:build
# or both
npm run content:check
```

Generated files are written to `data/generated/` and should not be hand-edited.

During migration, `content-src/config/legacy-index.json` keeps legacy modules available while migrated sets replace their matching runtime file in the generated index. This lets Studo move to the new content model one module at a time without breaking the learner app.


## Phase 4C — authoring

For production RLA content, run:

```bash
npm run studio
```

Then open `http://localhost:4173/content-studio.html`. Content Studio can save Phase 4 passage + question-set source files directly into `content-src/` in supported browsers. The bulk planning/review workbook lives in `authoring/STUDO_RLA_AUTHORING_WORKBOOK_V1.xlsx`.

After authoring, always run:

```bash
npm run content:check
```

Do not manually edit `data/generated/`.

## Resource Studio

Phase 5A adds `resource-studio.html` for attaching PDFs, worksheets, study guides, notes, DOCX files, references, and external links to exact RLA skills. Connected-folder saves update `content-src/resources/rla.resources.json` and copy local files into `assets/resources/`.
