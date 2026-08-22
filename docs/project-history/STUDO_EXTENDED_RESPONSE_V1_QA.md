# Studo — Extended Response V1 QA Report

**Release:** Extended Response / Writing V1 review build  
**Date:** 2026-08-22  
**Base:** Reading + Arguments & Sources + Language & Editing refined Studo build

## Release scope

Extended Response V1 adds a complete learner-facing writing pathway while keeping detailed `W1.*` progress metadata underneath.

### Learner-facing units

1. Understand & Map the Sources
2. Choose the Stronger Argument
3. Thesis & Evidence
4. Analyze, Don’t Just Summarize
5. Organize, Develop & Revise
6. Full Extended Response

All 12 internal `W1.1–W1.12` skills are mapped exactly once across the six units.

## Objective training layer

- 6 focused ER modules
- 48 objective component questions
- 8 questions per unit
- all 12 W1 skills represented
- answer distribution: **A 12 / B 12 / C 12 / D 12**

The focused layer trains task interpretation, source mapping, stronger-argument selection, thesis construction, evidence selection, evidence analysis, reasoning analysis, organization, development, revision, editing, and full-response planning.

## Full paired-source ER bank

- **8 original paired-source prompts**
- stronger source balanced: **4 Source A / 4 Source B**
- total paired-source length range: **448–510 words**
- model response range: **291–326 words**
- every prompt includes:
  - Source A and Source B
  - a learner prompt
  - hidden authoring key
  - model response
  - at least 4 annotations
  - at least 3 revision prompts

Topics include transportation, renewable energy, workplace automation, school policy, stormwater infrastructure, bridge planning, clinic reminders, and community redevelopment.

### Editorial QA added at release gate

The final editorial pass caught templated model-response defects such as awkward openings (`Both sources address should...`) and doubled punctuation. These were corrected across all eight exemplars and are now protected by regression tests.

## Full writing workspace

`extended-response.html` now supports:

- timed and untimed modes
- **45:00 timed mode** (`2700` seconds)
- Source A / Source B reading area
- optional planning panel
- essay editor
- persistent local draft recovery scoped by prompt + mode
- remaining-time persistence
- explicit submission state
- post-submission self-review
- revision mode after submission
- model response locked until submission
- ER attempt history on Progress

Timed mode warns learners that the clock starts immediately. Normal timed editing locks at `00:00`; a learner who intentionally starts revision after submission can continue revising without the expired timer re-locking the draft after refresh.

## Scoring integrity

Studo does **not** present a fake AI score, official GED score, or guaranteed score.

Post-submission review uses three transparent self-review traits:

1. Argument & Evidence
2. Development & Organization
3. Clarity & Standard English

Each trait uses:

- `0 — Not yet`
- `1 — Partly`
- `2 — Clear`

The interface includes observable checks and weak-vs-stronger examples. Self-review values are stored separately from objective mastery and are labeled **Self-review** in Progress.

## Teaching resources

- **18 ER PDFs**
  - 6 Study Guides
  - 12 Workbooks
- **36 total PDF pages**
- embedded Inter: PASS
- selectable text: PASS
- all PDFs previously rendered at 200 DPI and visually checked during production
- final structural PDF verification: PASS

## Clean source-of-truth rebuild

The final release gate deleted `data/generated/` and rebuilt it from canonical source.

Result:

- validation: **0 errors**
- build: PASS
- generated canonical legacy modules: 50
- generated schema-v2 modules: 42
- generated index entries: 92
- learner ER prompts: 8
- authoring-key / stronger-source spoilers in learner prompt data: **0**

## Automated verification

### Full project test suite

**41/41 subtests passed** across:

- Build regression: 2
- Foundation QA: 7
- Reading quality: 4
- Arguments quality: 7
- Language quality: 7
- Extended Response quality: 14

### Syntax

- JS/MJS files checked: **34**
- syntax failures: **0**

### Local HTTP smoke test

**10/10 returned HTTP 200**, including:

- home
- practice
- Extended Response curriculum
- Extended Response domain
- timed workspace
- untimed workspace
- generated ER prompt data
- generated curriculum data
- ER JavaScript
- ER study-guide PDF

## Remaining non-blocking warnings

Project validation currently reports **10 warnings and 0 errors**.

### Existing Reading transfer reminders

5 singleton question-family warnings remain for Reading transfer families.

### Arguments

- `R5.4 Evidence relevance` has 3 canonical objective questions.

### Extended Response

The following skills each have 2 canonical objective questions:

- `W1.8 Organize the response`
- `W1.9 Develop ideas`
- `W1.10 Revise for focus & clarity`
- `W1.11 Edit conventions`

These skills also receive workbook and full-response practice. The warnings remain visible because the QA system deliberately asks for more **objective transfer coverage** rather than counting non-objective writing practice as equivalent evidence.

## Release assessment

Extended Response V1 is suitable for learner review testing as a structured GED-style writing trainer. It deliberately avoids pretending that a static client-side site can automatically grade an essay accurately.

Recommended learner QA before commit:

1. open several ER units and inspect Guide / Workbook / Interactive Practice placement;
2. complete one untimed full prompt;
3. submit and check that the model response appears only afterward;
4. complete the three-trait self-review;
5. refresh and confirm the draft/review state persists;
6. open a timed prompt and confirm the 45-minute behavior;
7. inspect Progress and confirm ER history is labeled Self-review rather than objective mastery.
