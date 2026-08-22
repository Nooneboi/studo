# Navigation & Library Cleanup V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix Studo navigation defects and reorganize Practice discovery, Passage Practice, and Resources for the current full RLA library.

**Architecture:** Add small pure data-model helpers for learner search, passage grouping, and resource grouping; keep page scripts responsible for DOM rendering. Preserve canonical curriculum/content and change only presentation/discovery behavior plus regression coverage.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js built-in test runner, generated JSON curriculum.

**Spec:** `docs/superpowers/specs/2026-08-22-navigation-library-cleanup-v1-design.md`

## Global Constraints
- Do not change assessment content or learner PDFs.
- Keep existing URLs for modules/resources stable.
- Reading uses skill-level learner topics; unit-based tracks use learner units.
- Passage Practice must group every learner-visible passage exactly once.
- Resources must expose every unique learner resource exactly once.
- Responsive layout: four/two/one passage columns and stackable resource rows.

---

### Task 1: Navigation and learner-discovery regression tests
**Files:**
- Create: `scripts/navigation-library-quality.test.mjs`
- Modify: `package.json`

- [ ] Write failing tests for homepage published-track links, learner-facing Practice search items, passage grouping coverage, and resource grouping coverage.
- [ ] Run the new test and confirm failures match current behavior.
- [ ] Add the new test file to `npm test`.

### Task 2: Shared library data model
**Files:**
- Create: `js/library-model.js`

- [ ] Implement pure helpers for learner search items, passage groups/filter text, and grouped resource topics.
- [ ] Re-run Task 1 tests until green.

### Task 3: Fix homepage routing and Practice search
**Files:**
- Modify: `index.html`
- Modify: `practice.html`
- Modify: `js/practice.js`

- [ ] Fix Extended Response track href.
- [ ] Load `js/library-model.js` before Practice script.
- [ ] Render unit-based search results with `unit=` and skill-based results with `skill=`.
- [ ] Verify navigation/search regression tests.

### Task 4: Passage Practice grouped library
**Files:**
- Modify: `passages.html`
- Modify: `js/passages.js`
- Modify: `css/site.css`

- [ ] Add accessible search control and results summary.
- [ ] Render four responsive topic columns with counts.
- [ ] Show compact title + text type/difficulty/question count metadata.
- [ ] Verify all 24 published passage sets appear exactly once when unfiltered.

### Task 5: Resource library reorganization
**Files:**
- Modify: `resources.html`
- Modify: `js/resources.js`
- Modify: `css/site.css`

- [ ] Replace file-type-first filter UI with search + published track chips.
- [ ] Render track/domain sections and topic rows using learner unit/skill names.
- [ ] Render Study Guide and flexible Workbook columns; preserve domain-level general resources.
- [ ] Ensure every unique curriculum resource appears exactly once for All.
- [ ] Add responsive stacked layout.

### Task 6: Final whole-site verification
**Files:**
- Create: `STUDO_NAVIGATION_LIBRARY_CLEANUP_V1_QA.md`

- [ ] Run `npm run content:validate`.
- [ ] Delete `data/generated/` and run `npm run content:build`.
- [ ] Run `npm test` and require zero failures.
- [ ] Run JS/MJS syntax checks.
- [ ] Audit internal HTML href/query track IDs against generated published tracks.
- [ ] Serve locally and smoke-test Home, Practice, ER curriculum/domain, Passage Practice, Resources, representative module/PDF.
- [ ] Package the verified full project and integrity-check the ZIP.
