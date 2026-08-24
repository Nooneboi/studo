# Chee Skool — Master Project Status

**Date:** 2026-08-23  
**Current release:** `0.7.0-alpha.7`  
**Current stage:** Interaction Engines V1 candidate; real-browser/device QA remains before new interactions enter randomized Mock forms

This is the current high-level source of truth for the Chee Skool RLA alpha candidate. Older Studo phase reports remain project history and should not override this status.

## Product goal

Chee Skool is a calm, focused GED Reasoning Through Language Arts learning and practice site. A feature is only considered useful if it helps a learner understand, practice, review, or evaluate an RLA skill; the presence of a page or file alone is not the quality bar.

## Current learner system

### Reading & Comprehension

Baseline is complete and hardened.

- Core Meaning
- Relationships & Inference
- Words, Tone & Style
- Structure, Purpose & POV
- mixed Passage Practice grouped by Science, Workplace, Community & Civics, and Literary
- 400–900 word passage safeguards
- stamina passages
- transfer-oriented question families
- answer-pattern, feedback, file-reference, and passage-length QA

The five Reading transfer families that previously had only one published example now have at least three canonical variants each.

### Arguments & Sources

Nine learner-facing units remain the stable baseline:

1. Claims & Argument Structure
2. Finding Evidence
3. Evidence Quality
4. Supported vs. Unsupported Claims
5. Reasoning & Assumptions
6. Credibility & Counterarguments
7. Compare Sources & Arguments
8. Text, Data & Different Formats
9. Synthesize Across Sources

`R5.4 Evidence relevance` now has at least four canonical objective questions.

### Language & Editing

Seven learner-facing units remain complete, with focused practice and six 350–450 word mixed editing passages.

### Extended Response

The learner system includes:

- six learning units;
- eight original paired-source prompts;
- timed and untimed modes;
- 45-minute simulation;
- source tabs, planner, editor, autosave, and word count;
- three-trait rubric self-review;
- annotated models after submission;
- revision workflow;
- no fake automatic GED scaled score.

W1.8 Organization, W1.9 Development, W1.10 Revision, and W1.11 Editing now have at least four canonical objective questions each through an additional transfer/revision check.

### Practice discovery and Resources

- Practice search uses learner-facing units where appropriate.
- Passage Practice stays separate from focused skill pages.
- Resources are grouped by track → domain → topic → files.
- Individual resource-topic rows no longer use repetitive horizontal separators; main sections retain stronger visual structure.
- Search placement is optimized for desktop and remains responsive.
- All 159 learner PDFs are now branded Chee Skool.


### Active-learning interaction system

Interaction Engines V1 adds a shared learner-response model used by Practice and Mock-compatible rendering:

- two deliberate grammar-edit modes: whole-revision dropdown and single inline dropdown;
- authored select-text/phrase/paragraph targets rather than guessed sentence boundaries;
- drag-sort with explicit tap/click destination controls;
- drag-order with Up/Down controls as a non-drag alternative;
- canonical string answers so existing local storage, Progress, Train, and Mock recovery remain compatible;
- a six-step Main Idea reference path that rises from supported recognition to qualified whole-passage reasoning;
- `mock-excluded` protection for the reference active set until real-device QA is complete.

The Main Idea reference path uses one 483-word original informational passage and a deliberate progression: easy sort → easy evidence selection → medium central idea → medium scope/trap sorting → hard evidence selection → hard qualified central idea.

### Progress and Train Me

- objective mastery is evidence-based;
- confidence, mistakes, and review timing remain local learner signals;
- ER self-review is kept separate from objective mastery;
- Mock history is kept separate from skill mastery;
- dead/empty shortcuts are not shown when corresponding history does not exist;
- learner-facing copy does not imply an official GED score.

### Mock/Test V1

Full RLA Mock:

- 14-question Part 1 / 27 minutes
- 45-minute Extended Response
- 10-minute break
- 32-question Part 3 / 65 minutes
- 46 objective questions total
- Reading 25 / Arguments 10 / Language 11
- fixed refresh-safe attempt
- flags and unanswered review
- strict section timing
- stamina/source-set requirements
- raw/domain/skill results
- post-completion explanations
- ER self-review kept separate
- no fake GED scaled score

Objective RLA Practice Test:

- 30 questions / 60 minutes
- Reading 17 / Arguments 6 / Language 7

Technology-enhanced interaction engines now support inline/whole-revision dropdown editing, authored select-text targets, drag-sort, and drag-order. The first Main Idea active-learning set remains tagged `mock-excluded` until touch, keyboard, refresh, and deployed-browser QA are complete; randomized Mock forms therefore do not yet claim full GED interaction parity.

## Current technical health

Alpha-hardening status:

- content validation errors: **0**
- content validation warnings: **0**
- generated learner modules: **96**
- total generated objective/component questions: **708**
- learner PDFs: **159 / 159 Chee Skool-branded**
- release metadata/service-worker version: **0.7.0-alpha.7**
- learner-only deployment builder: **implemented**
- GitHub Pages workflow: **learner-only artifact via GitHub Actions**
- internal authoring pages: **kept in source repo, excluded from public `dist/`**
- `publicAlphaEnabled`: **false** until real-browser/device QA and pilot sign-off

## Architecture state

### Canonical source

`content-src/` is the learning-content source of truth. `data/generated/` is disposable output created by the build pipeline.

### Public deployment boundary

`npm run public:build` creates `dist/`, which contains learner-facing HTML, runtime JS/CSS, generated learner data, icons, the Chee Skool logo, and learner PDFs.

The public artifact intentionally excludes internal authoring/development material including:

- `builder.html`
- `content-studio.html`
- `resource-studio.html`
- `content-src/`
- `authoring/`
- `scripts/`
- project documentation and development-only files

GitHub Pages must use **GitHub Actions**, not branch-root deployment.

### Quality protections

Automated validation/regression coverage protects against problems including:

- canonical learner-content loss during rebuild;
- Passage Practice leaking into focused skill pages;
- answer/explanation mismatches;
- duplicate or invalid options;
- problematic answer-position patterns;
- excessive generic feedback;
- invalid passage lengths;
- broken resource references;
- invalid curriculum/navigation routes;
- learner-library organization regressions;
- Mock count/coverage/timing/scoring regressions;
- reappearance of the resolved content-depth warning classes;
- reintroduction of old PDF-generator branding;
- accidental inclusion of internal authoring surfaces in the public build.

## Claims Chee Skool must not make

Chee Skool is **not** an official GED product and must not claim:

- official/live GED questions;
- official GED scaled-score prediction;
- guaranteed pass/fail outcome;
- psychometric equivalence to an official GED form.

ER uses structured learner self-review rather than pretending to provide validated automatic official scoring.

## Remaining release gate

Automated hardening is not the final release gate. Before enabling a public alpha:

1. Test the deployed production URL end-to-end in a real desktop browser.
2. Test a real phone/tablet, especially touch text selection and highlighting.
3. Verify native Share/clipboard permissions and fallbacks.
4. Verify actual print preview/output.
5. Test refresh/back/two-tab/offline/service-worker recovery behavior.
6. Perform keyboard-only, 200% zoom, and basic screen-reader checks.
7. Open a representative sample of PDFs from the production deployment.
8. Have a small number of real learners use the product with minimal guidance.
9. Fix only high-impact learner, content, accessibility, or reliability issues found by those tests.
10. Then explicitly change the release gate rather than treating deployment alone as approval.

## Recommended next phase

> **Real-browser Release Candidate QA → small learner alpha**

Do not start another large content or visual redesign batch unless the real-browser QA or learner pilot identifies a concrete need.

## Guided Learning Workspace V2 — 2026-08-24

- Current release: **0.7.0-alpha.7**.
- Main Idea active-learning Practice now uses the Guided Learning Workspace V2 renderer.
- Guided drag-sort is single-card classification instead of a full board.
- Select Text has explicit passage selection mode.
- Confidence/hints/feedback use progressive disclosure.
- Main Idea remains `mock-excluded` until real-device QA.
