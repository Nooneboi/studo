# Studo Reading & Comprehension Quality Refinement V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Calibrate the full published Reading track so existing material teaches useful skills, Passage Practice provides realistic transfer, and Foundation QA can measure the result.

**Architecture:** Keep canonical content in `content-src/`; improve legacy Reading runtime modules in place as transitional canonical sources, add new schema-v2 transfer passages/sets, and rebuild generated output from source only. Preserve the learner UI and curriculum structure while changing content quality, placement classification, diagnostics, and QA coverage.

**Tech Stack:** Node.js ES modules, JSON content registries, static HTML/JS, ReportLab/PDF tooling for changed Study Guides, Node built-in test runner.

**Spec:** `docs/superpowers/specs/2026-08-22-reading-quality-refinement-v1-design.md`

## Global Constraints

- Preserve useful existing Reading content; do not rewrite for activity alone.
- Skill drills stay focused; Passage Practice is the 400-900 word mixed-transfer layer.
- One defensible best answer per selected-response item.
- Difficulty comes from reasoning/evidence/distractor similarity, not confusing wording.
- Mixed Passage Practice must never be duplicated onto skill pages.
- Preview Arguments/Language/ER remain preview.
- All changed PDFs must be rendered and visually checked.

---

### Task 1: Add Reading quality regression tests

**Files:**
- Create/Modify: `scripts/reading-quality.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes canonical Reading modules/sets and generated curriculum.
- Produces release checks for answer patterns, feedback reuse, passage lengths, long-passage coverage, placement, and resource existence.

- [ ] Write tests that fail on the current 68-warning Reading bank.
- [ ] Verify failure reasons match known audit defects.
- [ ] Add the Reading suite to `npm test` only after the red tests are proven.

### Task 2: Calibrate existing skill-practice modules

**Files:**
- Modify: `content-src/legacy-modules/rla-*-practice-*.json` for published Reading skills.

**Interfaces:**
- Consumes existing passage/question content.
- Produces calibrated focused practice with non-cyclic answer positions, specific feedback, corrected metadata, and targeted distractor improvements.

- [ ] Reorder options to remove authored key cycles without changing correct content.
- [ ] Replace heavily reused generic `whyWrong` text with misconception-specific feedback.
- [ ] Strengthen clearly absurd distractors in priority modules.
- [ ] Calibrate difficulty/DOK metadata to actual demand.
- [ ] Run validator and Reading tests.

### Task 3: Repair and normalize existing Passage Practice

**Files:**
- Modify: published Reading passage modules under `content-src/legacy-modules/`.
- Modify: `content-src/sets/set-rla-evidence-last-bus.json` and `set-rla-evidence-night-shift.json` publication/classification as needed.

**Interfaces:**
- Consumes current Passage Practice bank.
- Produces learner-visible Reading Passage Practice with all texts >=400 words, balanced answer positions, useful feedback, and no preview-skill prototypes.

- [ ] Remove tiny cross-track prototypes from published Reading Passage Practice.
- [ ] Expand 250-399 word Reading passage texts to >=400 while preserving coherent meaning and existing evidence paths, or reclassify if expansion would be artificial.
- [ ] Rebalance option positions and feedback.
- [ ] Manually review questions that are trivial/ambiguous and correct them.
- [ ] Run validation/tests.

### Task 4: Add four long Level 3 transfer passages

**Files:**
- Create: `content-src/passages/p-rla-reading-transfer-*.json` (4 files)
- Create: `content-src/sets/set-rla-reading-transfer-*.json` (4 files)
- Modify: resource registry only if learner PDF practice versions are added.

**Interfaces:**
- Produces four original 650-850 word mixed Reading sets, 7 questions each, 3 informational + 1 literary.

- [ ] Author civics/social-studies passage + 7 questions.
- [ ] Author science passage + 7 questions.
- [ ] Author workplace/public-policy passage + 7 questions.
- [ ] Author literary passage + 7 questions.
- [ ] Validate keys, distractors, evidence, skill IDs, DOK, difficulty, rights/reviewer/status metadata.
- [ ] Run content validation and Reading tests.

### Task 5: Add diagnostic help to all skill Study Guides

**Files:**
- Modify: 22 skill Study Guide PDFs in `assets/resources/`.
- Create temporary PDF generation artifacts outside deliverable tree only.

**Interfaces:**
- Consumes existing guides.
- Produces guides with concise skill-specific diagnostic help while preserving existing instruction.

- [ ] Generate one diagnostic-help page per skill using the Studo visual standard.
- [ ] Merge it into each corresponding Study Guide.
- [ ] Render every changed guide at 200 dpi.
- [ ] Inspect for clipping, glyph, contrast, and spacing defects.

### Task 6: Final clean rebuild and editorial QA

**Files:**
- Modify: `data/generated/*` via build only.
- Create: `READING_REFINEMENT_V1_QA.md`.

**Interfaces:**
- Produces release evidence and review package.

- [ ] Delete `data/generated/` and run `npm run content:check`.
- [ ] Run full `npm test`.
- [ ] Run JavaScript syntax checks.
- [ ] Verify resource/module references.
- [ ] Serve locally and smoke-test learner pages and representative practice/module/PDF URLs.
- [ ] Compare warning counts against Foundation QA baseline.
- [ ] Package complete project without temporary artifacts/Git metadata for GitHub Desktop review.
