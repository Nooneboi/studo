# Studo Foundation QA V1 Design

**Date:** 2026-08-22
**Status:** Approved and implemented

## Goal

Make Studo's RLA content pipeline safe enough for large-scale refinement: one canonical source of truth, deterministic clean builds, stronger assessment QA, and honest learner-facing availability for unfinished tracks.

## Scope

Foundation QA V1 changes infrastructure and publication rules only. It does **not** rewrite Reading questions, redesign the learner UI, or add new GED content.

It has four deliverables:

1. `content-src/` becomes the complete canonical input for learner content.
2. Validation catches high-risk assessment defects before publication.
3. Unfinished tracks no longer appear as fully available curriculum.
4. Clean builds preserve all intended learner content without reading previously generated output as input.

## 1. Canonical content source

### Current problem

The build currently reads `data/generated/index.json` and `data/generated/curriculum.json` as fallback/baseline input while newer content comes from `content-src/`. This means a clean build can differ from an incremental build and generated output is partially acting as source data.

### Design

Create `content-src/legacy-modules/` for the existing runtime-format modules that do not yet have schema-v2 source sets. These files are canonical transitional source files, not generated output.

The build will consume only:

- `content-src/skills/`
- `content-src/passages/`
- `content-src/sets/`
- `content-src/resources/`
- `content-src/legacy-modules/`
- `content-src/config/`

`data/generated/` becomes disposable output. A clean build must be reproducible after deleting it.

We will **not** mass-convert every legacy module to schema-v2 in this phase. That would mix structural migration with educational rewriting. Legacy modules stay supported through a clearly bounded adapter/validator path until each domain is refined later.

### Invariant

Deleting `data/generated/` and running the build must recreate the same published learner inventory from `content-src/` alone.

## 2. Validation and assessment QA

### Existing validation retained

Keep current checks for IDs, source rights, reviewer/status, curriculum skill mapping, distractor metadata, explanations, DOK, difficulty, resource paths, and transfer-family coverage.

### New release-blocking checks

For published content, add errors for defects that can make an item objectively unsafe to publish:

- correct answer references a missing option;
- explanation explicitly names an answer letter that conflicts with the actual correct display position;
- duplicate answer-option text within a question;
- duplicate question IDs across canonical modules;
- learner module references an unknown curriculum skill;
- `passage_practice`/`quiz` content is attached to skill-level checks/sets;
- published canonical legacy module is missing required core metadata after normalization.

### New QA warnings

Warnings identify likely quality problems that require human review but cannot be proven wrong automatically:

- suspiciously repeated correct-answer position sequences across modules;
- long runs or strong bank-level answer-position bias;
- identical/generic `whyWrong` explanations reused excessively;
- hard questions with low reasoning/distractor profiles;
- very short items classified as GED Passage Practice;
- passage-practice length outside the intended training range;
- tracks/skills with too little published assessment coverage.

Warnings do not silently rewrite educational content.

### QA report

Build/validation output will include a machine-readable QA summary grouped by code and affected file so future bulk refinement can be measured rather than guessed.

## 3. Honest learner-facing availability

### Current problem

Reading has substantial content, while Arguments & Sources, Language & Editing, and Extended Response are largely prototypes. The curriculum currently presents all tracks similarly, which can imply equal readiness.

### Design

Add explicit track publication state to curriculum configuration:

- `published` — learner-facing and included normally;
- `preview` — may exist internally but is not presented as a complete learner track;
- `hidden` — excluded from normal learner discovery.

For Foundation QA V1:

- Reading & Comprehension: `published`
- Arguments & Sources: `preview`
- Language & Editing: `preview`
- Extended Response: `preview`

Normal curriculum navigation and search must not present preview tracks as completed learning paths. Prototype modules remain available to developers and can be promoted later without recreating them.

We will prefer clear absence/preview labeling over fake completeness.

## 4. Build behavior

The build will follow this sequence:

1. Load and validate canonical source inputs.
2. Normalize schema-v2 sets and transitional legacy modules to learner runtime records.
3. Apply publication-state filtering.
4. Generate modules, index, curriculum, Passage Practice, resource data, and QA/build reports.
5. Never merge from a previous `data/generated/` snapshot.

A clean build and a second build without source changes must produce equivalent learner data except for intentionally variable build timestamps.

## 5. Tests

Foundation QA V1 must add automated regression coverage for:

- clean-build reproducibility;
- no dependency on pre-existing generated index/curriculum;
- legacy canonical modules survive a clean build;
- mixed Passage Practice never leaks into skill pages;
- preview tracks do not appear as normal published curriculum/search results;
- known answer-letter/explanation mismatch fixture fails validation;
- repeated answer-position pattern is reported;
- missing/invalid canonical metadata fails validation.

The existing passage-placement regression test remains and is incorporated into the normal test command.

## 6. Non-goals

This phase does **not**:

- rewrite weak distractors;
- fix every ambiguous RLA question;
- create new long passages;
- rebuild all PDFs;
- build the real GED mock-test blueprint;
- complete Arguments, Language, or Extended Response;
- add server-side accounts or cloud progress sync.

Those depend on this safer foundation and will follow in later content/product phases.

## Success criteria

Foundation QA V1 is complete only when:

1. `data/generated/` can be deleted and fully rebuilt from `content-src/`.
2. The intended Reading learner inventory survives the clean rebuild.
3. Existing published resources resolve without missing files.
4. Passage Practice remains separated from skill-level practice.
5. Unfinished tracks are no longer presented as complete learner tracks.
6. New QA checks detect seeded bad fixtures.
7. `npm run content:check` exits successfully on the corrected real content.
8. All Foundation QA regression tests pass from a clean working tree.

## Follow-on order

After Foundation QA V1:

1. Whole-Reading content refinement and assessment QA.
2. Arguments & Sources baseline.
3. Language & Editing baseline.
4. Extended Response system.
5. GED-style mock-test blueprint and exam simulation.
6. Full learner QA and Alpha release gate.
