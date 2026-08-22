# Arguments & Sources V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a complete learner-usable Arguments & Sources baseline with 9 learner-facing units, 15 internal R5/R6 skills, focused learning resources, and six mixed GED-style source sets.

**Architecture:** Keep R5/R6 skill IDs canonical for analytics while adding `units` to the Arguments curriculum configuration. The build step aggregates skill resources and focused modules into unit records; `domain.js` and `skill.js` render unit navigation without removing raw skills from generated curriculum. New content remains canonical under `content-src/` and assets under `assets/resources/`.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js content validator/build scripts, JSON schema-v2 content, ReportLab PDFs.

**Spec:** `docs/superpowers/specs/2026-08-22-arguments-sources-v1-design.md`

## Global Constraints
- Preserve all 15 R5/R6 internal skill IDs for analytics and progress tracking.
- Learners see exactly 9 Arguments units.
- Each unit has one Study Guide, Workbook 1, Workbook 2, and an 8-question focused interactive module.
- Mixed practice contains at least 6 source sets with paired-source, text+data, different-format, and argument-strength coverage.
- One defensible best answer only; no predictable answer-position cycles or long runs.
- `whyWrong` feedback diagnoses the actual misconception.
- Preserve qualifier strength and separate evidence relevance from sufficiency.
- Study Guide PDFs follow the 9-part Studo teaching structure and readable Inter-based visual standard.
- Arguments stays preview until all QA gates pass, then changes to published.

---

### Task 1: Learner-unit curriculum layer

**Files:**
- Modify: `content-src/config/rla.curriculum.json`
- Modify: `scripts/build-content.mjs`
- Modify: `js/domain.js`
- Modify: `js/skill.js`
- Test: `scripts/arguments-quality.test.mjs`

**Interfaces:**
- Consumes: track/domain skill records already produced by `buildCurriculum`.
- Produces: `domain.units[]` with `id`, `label`, `summary`, `skillIds`, aggregated `resources`, `checks`, counts, and availability.

- [ ] Add a failing test asserting exactly 9 Arguments units and complete one-to-one mapping of all 15 R5/R6 skills.
- [ ] Run the test and verify it fails because no unit layer exists.
- [ ] Add unit definitions to Arguments domains in `rla.curriculum.json`.
- [ ] Aggregate units in `build-content.mjs` without removing `domain.skills`.
- [ ] Update `domain.js` to render units when present and raw skills otherwise.
- [ ] Update `skill.js` so `?unit=` pages aggregate unit resources/checks while existing `?skill=` pages still work.
- [ ] Build and rerun the unit test until green.

### Task 2: Focused Arguments baseline

**Files:**
- Create: `content-src/passages/p-rla-args-unit-*.json` (9)
- Create: `content-src/sets/set-rla-args-unit-*.json` (9)
- Modify: `content-src/resources/rla.resources.json`
- Create: `assets/resources/arguments-*-study-guide.pdf` (9)
- Create: `assets/resources/arguments-*-workbook-1.pdf` (9)
- Create: `assets/resources/arguments-*-workbook-2.pdf` (9)
- Test: `scripts/arguments-quality.test.mjs`

**Interfaces:**
- Consumes: unit definitions from Task 1 and R5/R6 skill metadata.
- Produces: 27 PDFs, 9 focused modules, 72 focused questions.

- [ ] Add failing coverage assertions: each unit must resolve one guide, two workbooks, one focused module, and exactly 8 focused questions.
- [ ] Verify red state.
- [ ] Author nine original focused passages and eight questions per unit with varied contexts and non-cyclic answer positions.
- [ ] Generate 27 PDFs from unit teaching/workbook source content using the current Studo PDF standard.
- [ ] Register the resources as published and map each to the unit's internal skill IDs.
- [ ] Run validator/build and make the coverage test green.
- [ ] Render all 27 PDFs at 200 DPI and inspect for clipping, overlap, broken glyphs, and unreadable text.

### Task 3: Mixed GED-style source practice

**Files:**
- Create: `content-src/passages/p-rla-args-mixed-*.json` (6)
- Create: `content-src/sets/set-rla-args-mixed-*.json` (6)
- Modify: `scripts/build-content.mjs`
- Modify: `js/domain.js`
- Test: `scripts/arguments-quality.test.mjs`

**Interfaces:**
- Consumes: schema-v2 source sets tagged `contentKind: "argument_practice"`.
- Produces: `curriculum.argumentPractice[]` and a learner-visible Arguments mixed-practice section.

- [ ] Add failing assertions for 6 mixed sets, 3 paired-source sets, 1 text+data set, 1 different-format set, and 2 argument-strength bridge sets.
- [ ] Verify red state.
- [ ] Author six 400-900 word-total source sets with 6-8 questions each and 36-48 questions total.
- [ ] Add `argumentPractice` collection in generated curriculum so mixed sets never duplicate under individual units.
- [ ] Render a simple Arguments mixed-practice section on the Arguments domain page.
- [ ] Build and rerun coverage tests until green.

### Task 4: Arguments QA and publication gate

**Files:**
- Modify: `scripts/arguments-quality.test.mjs`
- Modify: `package.json`
- Modify: `content-src/config/rla.curriculum.json`

**Interfaces:**
- Consumes: validator warnings, generated curriculum, modules, resources.
- Produces: publication confidence and automated regression coverage.

- [ ] Add failing checks for answer-position warnings, generic whyWrong reuse, source-length targets, resource/module resolution, and published navigation visibility.
- [ ] Resolve objective content defects revealed by QA without weakening the tests.
- [ ] Add the Arguments test file to `npm test`.
- [ ] Change Arguments track from `preview` to `published` only after all gates are green.
- [ ] Delete `data/generated/`, run validate/build/full tests, JS syntax checks, and local HTTP smoke checks.
- [ ] Produce a QA summary and package a review ZIP without Git metadata.
