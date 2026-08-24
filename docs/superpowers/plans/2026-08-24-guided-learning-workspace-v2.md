# Guided Learning Workspace V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the crowded Alpha 6 guided Practice presentation with a calm, reusable active-learning workspace that shows one obvious task at a time while preserving the existing question engines, storage, scoring, and Mock behavior.

**Architecture:** Keep `module.html` + `js/module.js` as the Practice runtime and keep `js/question-interactions.js` as the canonical answer model. Activate the new renderer only for modules tagged `active-learning`; add authored `learningStage` and `hint` fields to content schema/compiler; render guided drag-sort as a single-card classifier and select-text as an explicit passage selection mode. Normal Practice and Mock remain unchanged except for shared content metadata.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js content compiler/validator, `node:test`, localStorage Store API.

**Spec:** `docs/superpowers/specs/2026-08-24-guided-learning-workspace-v2-design.md`

## Global Constraints

- One task. One obvious action. One place to look.
- V2 activates only for modules tagged `active-learning`.
- No new question types are introduced.
- Dragging must always have click/tap/keyboard alternatives.
- Mock remains neutral and does not expose guided hints or Practice feedback before submission.
- Main Idea active-learning content remains tagged `mock-excluded` until real-device QA.
- Difficulty rises through reasoning depth, evidence distance, and distractor similarity—not interaction complexity.
- Existing answer storage stays string-based and backward-compatible.

---

### Task 1: Author learning-stage metadata and direct Main Idea copy

**Files:**
- Modify: `schemas/studo-content-v2.schema.json`
- Modify: `scripts/build-content.mjs`
- Modify: `content-src/sets/set-rla-mainidea-active-methods-v1.json`
- Test/Create: `scripts/guided-learning-workspace-quality.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: existing question objects and content compiler.
- Produces: runtime question fields `learningStage: 'guided'|'apply'|'independent'` and optional `hint: string`.

- [ ] Write failing tests requiring schema/compiler support, the 2/2/2 stage progression, authored hints only on Guided/Apply, shortened Q1/Q2/Q4/Q5 prompts, and preserved `mock-excluded` tag.
- [ ] Run the focused test and verify RED.
- [ ] Add schema properties and compiler pass-through.
- [ ] Author Main Idea stage/hint metadata and direct learner-facing prompts without weakening reasoning.
- [ ] Run content build and focused test; verify GREEN.

### Task 2: Guided workspace shell and progressive disclosure

**Files:**
- Modify: `js/module.js`
- Modify: `css/site.css`
- Test: `scripts/guided-learning-workspace-quality.test.mjs`

**Interfaces:**
- Produces helpers `isGuidedLearningModule()`, `learningStageFor(q)`, `guidedHelperText(q)`, `updateGuidedResponseState(q, complete)`.
- Guided stage line renders `N of M · GUIDED/APPLY/INDEPENDENT`.

- [ ] Add failing tests for active-learning activation, guided workspace class, stage line, hidden confidence before response, `Need help?`, and no repeated long module description in guided question view.
- [ ] Run focused test and verify RED.
- [ ] Implement guided activation and stage/helper/hint rendering in `module.js`.
- [ ] Make confidence hidden until a complete response exists and preserve optional submission without confidence.
- [ ] Add calm desktop/mobile guided-workspace CSS with top-left task alignment and stable passage/task hierarchy.
- [ ] Run focused test and verify GREEN.

### Task 3: Single-card classification for guided drag-sort

**Files:**
- Modify: `js/module.js`
- Modify: `css/site.css`
- Test: `scripts/guided-learning-workspace-quality.test.mjs`

**Interfaces:**
- Guided sorter persists the same canonical `item=zone|...` answer string.
- Draft state also tracks current card index in memory/DOM by deriving first incomplete item and supports Back to revise prior assignments.

- [ ] Add failing tests that guided sorter does not render `Statements to sort`, `drag-zone-grid`, or repeated destination controls for all cards simultaneously.
- [ ] Require one active card, one category-control set, compact `x of y` progress, and a Back control.
- [ ] Run focused test and verify RED.
- [ ] Implement single-card classifier while leaving non-guided `drag_sort` renderer untouched.
- [ ] Persist each assignment immediately through existing interaction drafts; enable Check only when all items are classified.
- [ ] Add accessible category descriptions and 44px targets.
- [ ] Run focused test and verify GREEN.

### Task 4: Explicit select-text passage mode

**Files:**
- Modify: `js/module.js`
- Modify: `css/site.css`
- Test: `scripts/guided-learning-workspace-quality.test.mjs`

**Interfaces:**
- Passage exposes a `selection-mode-bar` only during guided `select_text` questions.
- Authored candidate targets remain `<button>` elements with `aria-pressed`; freeform highlighter still works on non-target text.

- [ ] Add failing tests for visible selection-mode bar, candidate styling class/state, selection count, and no redundant `Select one highlighted...` paragraph in the task pane.
- [ ] Run focused test and verify RED.
- [ ] Render selection-mode bar above the passage and concise helper in the task pane.
- [ ] Update target hover/focus/touch/selected states for Light/Dark/Sepia without using the yellow freeform-highlight appearance.
- [ ] Reveal confidence after selection and keep Check disabled until a target exists.
- [ ] Add narrow-screen sticky state/action behavior without covering passage content.
- [ ] Run focused test and verify GREEN.

### Task 5: Final regression, release bump, and packages

**Files:**
- Modify: `release.json`
- Modify: learner page release metadata and `sw.js` cache version as required by existing release tests.
- Modify: `scripts/navigation-library-quality.test.mjs` release expectation if version-pinned.
- Create: `CHEE_SKOOL_GUIDED_WORKSPACE_V2_REPORT.md`

- [ ] Run `npm test` and fix only genuine regressions.
- [ ] Run `npm run content:validate` and require 0 errors / 0 warnings.
- [ ] Run `npm run public:build` and verify learner-only build includes `module.html`, `js/module.js`, `js/question-interactions.js`, and the Main Idea generated module while excluding internal authoring pages.
- [ ] Syntax-check all first-party JS/MJS files.
- [ ] Bump to `0.7.0-alpha.7` consistently in release metadata/service worker/learner page meta tags.
- [ ] Re-run the entire test/validation/public-build gate after the version bump.
- [ ] Package full-source and learner-only public ZIPs; run archive integrity checks.
- [ ] Write the implementation report with remaining real-device QA items.
