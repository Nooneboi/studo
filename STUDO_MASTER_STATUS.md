# Studo — Master Project Status

**Date:** 2026-08-22  
**Current stage:** Feature-complete RLA baseline / pre-alpha review candidate

This file is the current high-level source for what Studo has, what is considered solid enough for review, what is still incomplete, and what should happen next. Older phase reports remain useful history but should not override this status.

## Product goal

Studo is a calm, focused GED RLA learning and practice site. Its quality bar is not "a file exists"; a feature should actually help a learner improve the skill it claims to teach.

## Current learner system

### 1. Reading & Comprehension — baseline complete

Learner areas:

- Core Meaning
- Relationships & Inference
- Words, Tone & Style
- Structure, Purpose & POV

Current strengths:

- skill-specific Study Guides / Workbooks / Interactive Practice;
- mixed Passage Practice;
- close-choice and transfer-oriented questions;
- 400–900 word learner Passage Practice range;
- stamina passages of 600+ words;
- 75% informational / 25% literary Passage Practice bank;
- passage library grouped by Science, Workplace, Community & Civics, Literary;
- answer-pattern and generic-feedback QA protections.

Remaining quality reminders:

- five Reading transfer-family singleton warnings should eventually receive another context/example.

### 2. Arguments & Sources — baseline complete

Learner-facing units:

1. Claims & Argument Structure
2. Finding Evidence
3. Evidence Quality
4. Supported vs. Unsupported Claims
5. Reasoning & Assumptions
6. Credibility & Counterarguments
7. Compare Sources & Arguments
8. Text, Data & Different Formats
9. Synthesize Across Sources

Internal R5/R6 skills remain available for detailed tracking.

Remaining reminder:

- `R5.4 Evidence relevance` has only three canonical objective questions and should gain additional transfer coverage later.

### 3. Language & Editing — baseline complete

Learner-facing units:

1. Word Choice & Standard Usage
2. Agreement & Pronouns
3. Modifiers & Sentence Logic
4. Parallelism & Sentence Connections
5. Concision & Transitions
6. Sentence Boundaries & Punctuation
7. Capitalization & Possessives

Includes focused practice plus six 350–450 word mixed editing passages.

### 4. Extended Response — baseline complete

Learner-facing units:

1. Understand & Map the Sources
2. Choose the Stronger Argument
3. Thesis & Evidence
4. Analyze, Don't Just Summarize
5. Organize, Develop & Revise
6. Full Extended Response

Full ER system includes:

- eight original paired-source prompts;
- timed and untimed modes;
- 45-minute simulation;
- source tabs, planner, essay editor, autosave, word count;
- three-trait rubric self-review;
- annotated model responses after submission;
- revision workflow;
- no fake automatic 6/6 score.

Remaining objective-coverage reminders:

- W1.8 Organization
- W1.9 Development
- W1.10 Revision
- W1.11 Editing

These skills are practiced in workbooks/full essays but have only two canonical objective items each.

### 5. Practice discovery / Resources — baseline complete

- Extended Response routing fixed.
- Invalid curriculum track IDs no longer silently fall back to Reading.
- Practice search uses learner-facing units for unit-based tracks.
- Passage Practice is grouped into four topic columns with search.
- Resources are organized by track → domain → topic → files.
- Current library contains the previously audited **151 unique learner resources across 44 learner topics**.

### 6. Progress / Train Me — functional baseline

- objective mastery remains evidence-based;
- confidence/mistake/review data are tracked;
- ER self-review remains separate from objective mastery;
- Mock Tests have separate history and raw results.

These should receive final learner-journey QA before public alpha.

### 7. Mock/Test V1 — review build complete

Full RLA Mock:

- 14-question Part 1 / 27 minutes
- 45-minute Extended Response
- 10-minute break
- 32-question Part 3 / 65 minutes
- 46 objective questions total
- Reading 25 / Arguments 10 / Language 11
- fixed refresh-safe attempt
- flags / unanswered review
- strict section timing
- 2 informational + 1 literary Reading source sets
- 600+ word stamina requirement
- raw/domain/skill results
- post-completion objective answer explanations
- ER Self-review kept separate
- no fake GED scaled score

Objective RLA Practice Test:

- 30 questions / 60 minutes
- Reading 17 / Arguments 6 / Language 7

See `STUDO_RLA_MOCK_TEST_V1_QA.md` for verification details.

## Current technical health

Latest clean-build release gate:

- content validation errors: **0**
- known non-blocking warnings: **10**
- generated learning modules: **92**
- total objective/component questions in module bank: **683**
- automated tests: **66 / 66 passed**
- JavaScript/MJS syntax: **38 checked / 0 failures**
- local HTTP smoke checks: **19 / 19 passed**

The old behavior that placed all 683 questions into one enormous "Full RLA Test" has been removed. Mock V1 samples a bounded blueprint instead.

## Architecture state

### Canonical source

`content-src/` is the source of truth. Generated learner data belongs under `data/generated/` and must be rebuilt rather than hand-maintained.

### Quality system

Validators/regression tests currently protect against issues including:

- lost canonical learner content during rebuild;
- passage-practice leakage into individual skill pages;
- answer-key/explanation mismatches;
- duplicate/invalid options;
- answer-position patterns;
- excessive generic feedback;
- invalid passage lengths;
- missing files/resources;
- invalid track navigation;
- broken static local HTML links;
- learner-unit/resource organization regressions;
- mock count/coverage/duplicate/timing/scoring regressions.

## Not yet ready to claim

### Official GED equivalence

Studo is **not** an official GED product. It must not claim:

- official/live GED questions;
- official GED scaled-score prediction;
- guaranteed pass/fail outcome;
- psychometric equivalence to a GED form.

### Automatic ER grading

ER V1 intentionally uses rubric self-review. Reliable automatic essay scoring would require a separate validated backend/scoring project.

### Full technology-enhanced item parity

Mock V1 supports current Studo multiple-choice/evidence-based items and a dropdown editing interaction. It does not yet attempt to reproduce every possible GED interaction such as drag-and-drop or select-an-area. That is an optional later upgrade, not a blocker for initial alpha learning value.

## Pre-alpha gates still required

Before calling Studo public alpha-ready:

1. **Manual end-to-end learner test**
   - Home → curriculum → Study Guide → Workbook → Interactive → Passage/Mixed Practice → Train Me → Progress → Mock.
   - Complete at least one full mock flow in a real browser.

2. **Responsive QA**
   - desktop;
   - tablet;
   - narrow phone viewport;
   - long passage / long resource title / long answer-choice stress cases.

3. **Accessibility QA**
   - keyboard-only navigation;
   - visible focus states;
   - form labels and landmarks;
   - 200% browser zoom;
   - basic screen-reader pass;
   - contrast check;
   - timer/status announcements that do not overwhelm assistive technology.

4. **Appearance QA**
   - light mode;
   - dark mode if retained as a product feature;
   - PDF opening/download behavior.

5. **Resolve or consciously defer the 10 current QA warnings**
   - five Reading transfer families;
   - R5.4 Arguments coverage;
   - W1.8–W1.11 ER objective coverage.

6. **Deployment/release cleanup**
   - verify GitHub Pages paths from the production URL;
   - verify no obsolete prototype/test links remain;
   - confirm cache/service-worker behavior if used;
   - set an explicit alpha version/release note;
   - back up the known-good Git commit.

7. **Small learner pilot**
   - have a few real learners use Studo without guidance;
   - record where they get lost, what they ignore, and what feels too easy/hard;
   - fix high-impact navigation/content problems before wider promotion.

## Recommended next phase

Do **not** create another large content batch immediately.

The recommended next phase is:

> **Studo Alpha Readiness QA**

Focus on real-browser learner flow, responsive/accessibility testing, the remaining ten quality warnings, deployment checks, and small-pilot readiness. Only create new content when that QA identifies a specific coverage or difficulty need.
