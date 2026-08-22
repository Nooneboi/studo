# Language & Editing V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a complete seven-unit Language & Editing baseline with contextual editing practice and six mixed GED-style editing passages.

**Architecture:** Extend the existing curriculum unit mechanism already used by Arguments. Keep L1/L2 skills as internal canonical IDs while attaching resources and focused modules to seven learner-facing units. Store all authored content in `content-src/`, build generated learner modules through the existing pipeline, and protect the new behavior with Language-specific regression tests.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js content build/validation, JSON content sources, Python + WeasyPrint for PDF authoring.

**Spec:** `docs/superpowers/specs/2026-08-22-language-editing-v1-design.md`

## Global Constraints
- Seven learner-facing units map all thirteen L1/L2 skills exactly once.
- Each unit has one Study Guide, two workbooks, one focused module, and eight questions.
- Six mixed editing passages must each be 350-450 words and contain six questions.
- All published Language content must have one defensible best answer and specific wrong-answer reasoning.
- PDFs use Inter, #51439C, single-column layout, 13.5-14 pt body text, and selectable text.
- Language remains preview until all release checks pass.

---

### Task 1: Curriculum unit contract and tests
**Files:**
- Modify: `content-src/config/rla.curriculum.json`
- Create: `scripts/language-quality.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces seven `domain.units[]` records with `id`, `label`, `summary`, `skillIds`.
- Test suite consumes generated `curriculum.json` after build.

- [ ] Add failing tests asserting seven units, all thirteen skills mapped exactly once, and Language remains preview until publication.
- [ ] Run `node --test scripts/language-quality.test.mjs` and verify RED.
- [ ] Add seven unit definitions to Language curriculum config.
- [ ] Rebuild and verify unit mapping test passes while content-completeness tests remain RED.

### Task 2: Focused interactive modules
**Files:**
- Create: seven `content-src/passages/p-rla-lang-*.json`
- Create: seven `content-src/sets/set-rla-lang-*.json`

**Interfaces:**
- Each set uses `curriculum.unitId` matching one Language unit and `contentKind: "skill_drill"`.
- Each set contains eight questions and collectively covers all thirteen internal skills.

- [ ] Extend tests to require one focused module and eight questions per unit.
- [ ] Verify RED.
- [ ] Author seven focused modules with balanced answer positions, contextual distractors, specific `whyWrong`, and shared meaningful family IDs.
- [ ] Run validator and Language tests; fix objective errors before continuing.

### Task 3: Mixed editing practice
**Files:**
- Create: six `content-src/passages/p-rla-lang-mixed-*.json`
- Create: six `content-src/sets/set-rla-lang-mixed-*.json`
- Modify: `scripts/build-content.mjs` only if a dedicated Language mixed-practice collection is not already supported.
- Modify: `js/domain.js` only if learner rendering needs a Language-specific mixed-practice block.

**Interfaces:**
- Mixed sets use `contentKind: "editing_practice"` and `practiceTags` describing passage editing coverage.
- Generated curriculum exposes a dedicated Language mixed-practice collection.

- [ ] Add tests requiring six mixed sets, 350-450 words each, six questions each, and all thirteen skills covered across the collection.
- [ ] Verify RED.
- [ ] Author six mixed editing passages and 36 questions.
- [ ] Implement the smallest builder/UI change required to expose Mixed Editing Practice.
- [ ] Run validator and Language tests until GREEN.

### Task 4: PDF teaching layer and resources
**Files:**
- Create: `scripts/language_pdf_content.py`
- Create: `scripts/generate_language_pdfs.py`
- Create: 21 PDFs under `assets/resources/`
- Modify: `content-src/resources/rla.resources.json`

**Interfaces:**
- Resource records use `unitId` so the builder attaches them to the correct learner unit.

- [ ] Add tests requiring one Study Guide and two worksheets per Language unit and resolving every resource href.
- [ ] Verify RED.
- [ ] Author seven Study Guides and fourteen Workbooks using the Studo PDF standard.
- [ ] Generate 21 PDFs with Inter and selectable text.
- [ ] Register all 21 resources with correct unit IDs.
- [ ] Render every changed PDF at 200 DPI and inspect for clipping, overlap, broken glyphs, and bad spacing.

### Task 5: Publish and release verification
**Files:**
- Modify: `content-src/config/rla.curriculum.json`
- Modify: `scripts/foundation-qa.test.mjs` only if its published-track contract must recognize Language.
- Create: `LANGUAGE_EDITING_V1_QA.md`

**Interfaces:**
- Language changes from `preview` to `published` only after all content and QA checks pass.

- [ ] Add/adjust tests so published Reading, Arguments, and Language appear while Writing remains preview-hidden.
- [ ] Verify RED before publication.
- [ ] Set Language to `published`.
- [ ] Delete `data/generated/`, run `npm run content:validate`, `npm run content:build`, and `npm test`.
- [ ] Run syntax checks on JS/Node files.
- [ ] Verify all generated module/resource references resolve.
- [ ] Serve locally and smoke-test curriculum, Language domain/unit pages, a focused module, mixed editing practice, and representative PDFs.
- [ ] Write `LANGUAGE_EDITING_V1_QA.md` with counts and remaining warnings.
