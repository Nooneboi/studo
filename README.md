# Chee Skool

Chee Skool is a static GED Reasoning Through Language Arts learning and practice site. The current release candidate focuses on Reading & Comprehension, Arguments & Sources, Language & Editing, Extended Response, progress tracking, and GED-style mock practice.

## Development structure

- `content-src/` is the canonical learning-content source.
- `data/generated/` is generated learner content. Do not hand-edit it.
- `assets/resources/` contains learner PDFs.
- `builder.html`, `content-studio.html`, and `resource-studio.html` are internal authoring tools. They are intentionally excluded from the public learner deployment.
- `dist/` is the disposable learner-only build produced by `npm run public:build`.

## Local quality checks

```bash
npm test
npm run content:validate
npm run public:build
```

`npm run public:build` rebuilds canonical content first, then creates `dist/` with only learner-facing pages and assets.

## Publishing with GitHub Desktop + GitHub Pages

1. Open the project repository in GitHub Desktop.
2. Commit the project changes and push `main`.
3. On GitHub, open **Settings -> Pages**.
4. Under **Build and deployment**, set **Source** to **GitHub Actions**.
5. The workflow in `.github/workflows/pages.yml` runs the automated tests, validates content, builds the learner-only `dist/` folder, and deploys that artifact.
6. Check the Actions run before treating the deployment as ready.

Do not switch Pages back to **Deploy from a branch**. Branch-root deployment would expose internal authoring pages that are not intended for learners.

## Internal authoring tools

Run the local server:

```bash
npm run studio
```

Then use the local authoring pages such as:

- `http://localhost:4173/content-studio.html`
- `http://localhost:4173/resource-studio.html`
- `http://localhost:4173/builder.html`

These pages remain in the repository for development, but the public Pages artifact does not contain them.

## Learner data and privacy

Learner answers, notes, highlights, confidence choices, mock history, and progress are stored locally in the learner's browser. The current static alpha has no learner account database and does not send learner answers to Chee Skool servers.

## Current release gate

`release-gate.json` remains disabled until the release candidate passes real-browser/device QA and a small learner pilot. Automated checks are necessary, but they do not replace testing touch selection, clipboard/share permissions, print behavior, accessibility, and recovery flows on actual devices.

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
  resources/
  config/
  legacy-modules/   # transitional canonical source for older runtime modules
```

Validation and build:

```bash
npm run content:validate
npm run content:build
# or both
npm run content:check
```

Generated files are written to `data/generated/` and should not be hand-edited. The folder is disposable: deleting it and running `npm run content:build` recreates learner output from `content-src/` alone.

During migration, older runtime-format modules live canonically in `content-src/legacy-modules/` and are registered by `content-src/config/legacy-index.json`. Schema-v2 sets replace matching legacy runtime files during the build. Do not use a previous `data/generated/` snapshot as authoring input.

Track visibility is controlled by `publicationState` in `content-src/config/rla.curriculum.json`. Only `published` tracks appear in normal learner curriculum/search; `preview` tracks can still build developer modules without pretending the learning path is complete.

Foundation QA can be run with:

```bash
npm test
npm run content:check
```

The build also writes `data/generated/qa-report.json` so recurring assessment-quality warnings can be measured during later refinement.


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


## RLA item-writing standard

See `docs/RLA_ITEM_WRITING_STANDARD_V1.md` and `content-src/config/rla.question-families.v1.json` before authoring new exam-style RLA items.
