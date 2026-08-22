# Studo Foundation QA V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Studo's learner content pipeline reproducible from `content-src/` alone, strengthen assessment QA, and stop unfinished RLA tracks from appearing as complete learner paths.

**Architecture:** Keep schema-v2 sets/passages/resources as the preferred authoring source. Move older runtime-format learner modules into a transitional canonical `content-src/legacy-modules/` directory and rebuild learner output from canonical config plus those modules, never from a previous `data/generated/` snapshot. Publication-state filtering is driven by `content-src/config/rla.curriculum.json`; validation emits blocking errors for objectively unsafe content and warnings for quality risks.

**Tech Stack:** Node.js ES modules, JSON content registries, static HTML/JS learner app, Node built-in test runner.

**Spec:** `docs/superpowers/specs/2026-08-22-foundation-qa-v1-design.md`

## Global Constraints

- Do not rewrite Reading questions in this phase.
- Do not redesign learner UI.
- Do not add new GED content.
- `data/generated/` must be disposable output.
- Reading & Comprehension is `published`.
- Arguments & Sources, Language & Editing, and Extended Response are `preview`.
- Preview tracks must not appear as normal published curriculum/search paths.
- Existing Passage Practice must remain separated from skill-level practice.
- Existing learner resources must continue to resolve after a clean build.

---

### Task 1: Canonicalize legacy learner modules

**Files:**
- Create: `content-src/legacy-modules/*.json`
- Modify: `content-src/config/legacy-index.json`
- Test: `scripts/foundation-qa.test.mjs`

**Interfaces:**
- Consumes: current checked-in learner inventory from `data/generated/index.json` and `data/generated/modules/*.json` as a one-time migration input.
- Produces: canonical transitional runtime modules and a canonical learner index baseline in `content-src/`.

- [x] **Step 1: Write a failing clean-source inventory test**

Create a Node test that asserts every non-schema-v2 learner index entry has a matching canonical file under `content-src/legacy-modules/`, and that canonical legacy index entries do not point back into `data/generated/` as source files.

- [x] **Step 2: Run the test and verify it fails**

Run: `node --test scripts/foundation-qa.test.mjs`

Expected: FAIL because `content-src/legacy-modules/` does not yet contain the current legacy learner bank.

- [x] **Step 3: Migrate legacy runtime modules without rewriting content**

Copy current runtime module JSON for learner entries not owned by schema-v2 source sets into `content-src/legacy-modules/`. Expand `legacy-index.json` so it records each canonical legacy module's learner file path, title, description, and curriculum metadata needed by the builder.

- [x] **Step 4: Run the test and verify canonical inventory passes**

Run: `node --test scripts/foundation-qa.test.mjs`

Expected: canonical inventory subtest PASS.

### Task 2: Make builds independent of previous generated output

**Files:**
- Modify: `scripts/build-content.mjs`
- Modify: `package.json`
- Test: `scripts/build-content-regression.test.mjs`
- Test: `scripts/foundation-qa.test.mjs`

**Interfaces:**
- Consumes: schema-v2 validated sets, canonical legacy modules/index, resource registry, skill registry, curriculum config.
- Produces: `data/generated/modules/*.json`, `data/generated/index.json`, `data/generated/curriculum.json`, `data/generated/build-report.json`.

- [x] **Step 1: Add failing clean-build reproducibility tests**

Tests must temporarily remove `data/generated/`, run the builder, and assert the intended Reading inventory, Passage Practice inventory, and resource references are recreated without a previous generated index/curriculum.

- [x] **Step 2: Verify the clean-build test fails against the old builder**

Run: `node --test scripts/foundation-qa.test.mjs`

Expected: FAIL because the old builder reads generated index/curriculum as compatibility input.

- [x] **Step 3: Refactor build input loading**

Remove reads of previous `data/generated/index.json` and `data/generated/curriculum.json`. Load legacy canonical modules and index from `content-src/`; compile schema-v2 sets; copy canonical legacy runtime modules to output; replace legacy index entries with schema-v2 builds when runtime files overlap; construct curriculum from canonical config, skills, resources, and canonical module/index metadata.

- [x] **Step 4: Preserve placement behavior**

Ensure `passage_practice` and `quiz` records go only to `curriculum.passagePractice`, never to individual skill `sets`/`checks`.

- [x] **Step 5: Add normal test command**

Add `npm test` to run both regression suites, while keeping `content:check` as validate + build.

- [x] **Step 6: Run clean-build and placement tests**

Run: `npm test`

Expected: all tests PASS.

### Task 3: Add legacy-module validation and assessment QA

**Files:**
- Modify: `scripts/validate-content.mjs`
- Create: `scripts/fixtures/foundation-qa/*.json`
- Test: `scripts/foundation-qa.test.mjs`

**Interfaces:**
- Consumes: canonical schema-v2 content plus canonical legacy runtime modules.
- Produces: blocking `errors`, review `warnings`, normalized published legacy records, machine-readable QA summary.

- [x] **Step 1: Add failing seeded-fixture tests**

Seed temporary fixture modules covering: missing correct option, duplicate option text, answer-letter/explanation mismatch, duplicate question ID, unknown curriculum skill, and missing legacy core metadata. Assert validation reports the expected error codes.

- [x] **Step 2: Implement legacy normalization and blocking checks**

Validate required legacy fields (`id`, `title`, `subject`, `questions`, `contentMeta.curriculum` where learner-published), question IDs, selected-response options/correct answers, duplicate option text, curriculum skill IDs, and answer-letter mentions in explanations when the letter conflicts with the correct display position.

- [x] **Step 3: Implement quality warnings**

Add warnings for repeated correct-position sequences, long same-position runs/bank bias, heavily reused generic `whyWrong` strings, hard questions with weak difficulty profiles, very short Passage Practice, passage lengths outside 400–900 words, and low published assessment coverage by track/skill.

- [x] **Step 4: Add grouped QA summary**

Return and write warning/error counts grouped by code so future content passes can measure remaining defects.

- [x] **Step 5: Run fixture tests and real validation**

Run: `npm test && npm run content:validate`

Expected: seeded bad fixtures fail only inside isolated tests; real canonical content has 0 blocking errors.

### Task 4: Add honest publication-state filtering

**Files:**
- Modify: `content-src/config/rla.curriculum.json`
- Modify: `scripts/build-content.mjs`
- Test: `scripts/foundation-qa.test.mjs`

**Interfaces:**
- Consumes: `publicationState` on each curriculum track.
- Produces: learner curriculum/index containing published tracks only; preview modules remain buildable but are not normal learner discovery paths.

- [x] **Step 1: Add publication state to track config**

Set Reading to `published`; Arguments, Language, and Extended Response to `preview`.

- [x] **Step 2: Add failing learner-visibility test**

Assert generated learner curriculum exposes Reading normally and excludes preview tracks from `tracks`. Assert learner index excludes modules whose primary skill belongs only to a preview track, while the compiled module files can still exist for developer access.

- [x] **Step 3: Implement filtering in the builder**

Resolve each skill/domain to its track, filter learner curriculum and index by primary track publication state, and preserve cross-skill secondary metadata without promoting a preview track.

- [x] **Step 4: Verify search/navigation inputs**

Because learner search/navigation consume generated curriculum/index, verify no additional UI code change is needed and the preview items are absent from those inputs.

### Task 5: Final clean rebuild and release evidence

**Files:**
- Modify: `data/generated/*` via build only
- Modify: `README.md` or build report notes only if needed to document canonical-source workflow

**Interfaces:**
- Consumes: corrected canonical source tree.
- Produces: final reproducible learner output and Foundation QA evidence.

- [x] **Step 1: Delete generated output and run full verification**

Run:

```bash
rm -rf data/generated
npm run content:check
npm test
```

Expected: validate/build/tests all exit 0.

- [x] **Step 2: Run a second build and compare stable learner data**

Normalize/remove `builtAt`/`compiledAt` timestamps and compare first-build vs second-build JSON trees. Expected: no semantic differences.

- [x] **Step 3: Verify learner inventory**

Assert Reading skills/resources remain available, mixed passage sets remain only in Passage Practice, published resource files exist, and preview tracks are absent from normal learner curriculum/index.

- [x] **Step 4: Run syntax and static serving smoke tests**

Check all learner JS files with `node --check`; start the static server and request main learner pages plus generated curriculum/index and representative module/resource files.

- [x] **Step 5: Package the complete updated project**

Create one ZIP containing the whole Studo repo copy with Foundation QA V1 changes and generated output, ready for GitHub Desktop review.
