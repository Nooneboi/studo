# Phase 5 Dedicated RLA Mock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the temporary Practice-bank full-mock fallback with three fixed, unseen, mock-only RLA forms containing 46 objective items plus one unique 45-minute ER each, while preserving Practice/Train/Skill Check/Quick Review isolation.

**Architecture:** Keep Objective RLA Practice Test on the existing Practice bank, but route Full RLA Mock through an explicit V2 form manifest. Compile mock-only sets through the existing canonical set/passage pipeline, compile three mock-only ER prompts to a separate learner-safe payload, validate all form/content contracts at build time, and store `formId` in attempts/history so rotation can use all three forms before repeating.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js ESM build/validation scripts, Node test runner, JSON canonical content, localStorage/StudoSafeStorage.

**Spec:** `docs/superpowers/specs/2026-08-25-phase5-dedicated-rla-mock-design.md`

## Global Constraints

- Full RLA Mock timing stays 27 min Part 1, 45 min ER, 10 min break, 65 min Part 3.
- Each fixed form has exactly 14 Part 1 objective items, 32 Part 3 objective items, 46 objective items total, and 7 complete 6–8-question source sets.
- Each form targets reporting categories 16 / 21 / 9 and item types 34 MC / 8 `grammar_edit` / 2 `select_text` / 2 drag interactions.
- Each form has 2 literary and 5 informational/editing sets, at least one GAC/civics set, one science/technical set, one workplace/community set, one argument/data or multi-format set, one editing set, and one 600+ word source.
- Mock modules use exactly `deliveryRoles: ["mock"]` and may not leak into Practice, Train, Skill Check, Quick Review, passage browsing, resources, or Objective Practice Test.
- Mock ER prompts are separate from ordinary ER Practice and compile to `data/generated/mock-er-prompts.json` with authoring keys removed.
- No scaled score, pass/fail prediction, College Ready claim, official percentile/equating language, or psychometric-equivalence claim.
- `allowPracticeFallback` becomes `false` only after all three forms and mock-only ER prompts pass validation.

---

### Task 1: Add Phase 5 contract tests

**Files:**
- Create: `scripts/phase5-mock-quality.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: canonical V2 config, generated modules, mock ER payload, `MockEngine` exports.
- Produces: executable contracts for architecture, form counts, content isolation, rotation, ER isolation, UI copy, reporting categories, and fallback removal.

- [ ] Write failing tests that require `content-src/config/rla-mock-v2.json`, three form manifests, exact 14/32/46 counts, unique module IDs, exact reporting-category and item-type totals, 2/5 text-type balance, civics/multi-format/stamina/editing coverage, 21 mock-only modules/138 questions, three mock-only ER prompts, no scaffolding fields, and no cross-form overlap.
- [ ] Add runtime tests for first-three-form rotation, least-recently-used selection, immediate-repeat avoidance, active-attempt form persistence, and Objective Practice staying on Practice content.
- [ ] Add learner-copy/UI tests for `Full RLA Mock`, reporting-category labels, absence of fallback/scaled-score claims, ER self-review separation, and Progress history fields.
- [ ] Add the new test file to `npm test` and run it once to confirm it fails for missing Phase 5 artifacts.

### Task 2: Implement V2 build/validation pipeline and mock-only ER payload

**Files:**
- Create: `content-src/config/rla-mock-v2.json`
- Create: `content-src/mock-er-prompts/` canonical prompt files in Tasks 4–6
- Modify: `scripts/validate-content.mjs`
- Modify: `scripts/build-content.mjs`

**Interfaces:**
- Consumes: canonical passages/sets, `rla-mock-v2.json`, mock ER prompt files.
- Produces: generated `mock-blueprint.json`, generated `mock-er-prompts.json`, question runtime metadata containing `reportingCategory`, and validation failures for incomplete/invalid forms.

- [ ] Add failing validation/build assertions in Task 1 before implementation.
- [ ] Teach validation to load/validate mock-only ER prompts separately from ordinary ER Practice prompts and to enforce 550–650 combined source words plus unique IDs.
- [ ] Carry `reportingCategory` into compiled runtime question metadata.
- [ ] Load `rla-mock-v2.json` in build output and emit learner-safe mock ER prompts with authoring keys/`strongerSource` stripped.
- [ ] Add V2 completeness validation: manifest module existence, exact counts, mock-only roles, reporting totals, item-type totals, source-set/text-type/context/length constraints, no form overlap, unique ER IDs, and `allowPracticeFallback:false` gating.
- [ ] Run `npm run content:validate` and the Phase 5 test file to confirm architecture tests advance to content-missing failures rather than schema/build failures.

### Task 3: Replace random full-mock assembly with fixed-form selection and rotation

**Files:**
- Modify: `js/mock-engine.js`
- Modify: `js/quiz.js`
- Modify: `js/test.js`

**Interfaces:**
- Produces: `selectFullMockForm({ modules, prompts, blueprint, history, activeAttempt })`, fixed `formId`, fixed Part 1/Part 3 arrays, and unchanged Objective Practice generation from Practice modules.

- [ ] Write failing runtime tests for fixed manifest assembly and form rotation.
- [ ] Implement manifest lookup and full-form materialization without shuffling questions/source sets.
- [ ] Implement rotation: active incomplete attempt resumes same form; first three completed/new attempts use all three; later attempts choose least recently used and avoid immediate repeats where possible.
- [ ] Store `formId` on full attempts and sanitized history entries.
- [ ] Split Objective Practice selection from Full Mock so Objective Practice always consumes Practice-role content and never burns mock-only forms.
- [ ] Run runtime-focused Phase 5 tests and existing mock tests; update old V1 expectations only where Phase 5 intentionally changes behavior.

### Task 4: Author and validate Form A

**Files:**
- Create: 7 `content-src/passages/p-rla-mock-a-*.json`
- Create: 7 `content-src/sets/set-rla-mock-a-*.json`
- Create: `content-src/mock-er-prompts/mock-er-a.json`
- Modify: `content-src/config/rla-mock-v2.json`

**Interfaces:**
- Produces: Form A with 46 objective items and unique mock ER prompt.

- [ ] Author two 7-question Part 1 sets and five Part 3 sets sized 8/6/6/6/6.
- [ ] Meet 16/21/9 reporting totals and 34/8/2/2 item-type totals across the form.
- [ ] Include two literary sets; civics/GAC, science/technical, workplace/community, multi-format/data, and exactly one ≤450-word editing set; include at least one 600+ word source.
- [ ] Author ER A with two 550–650-word-total sources and no learner-visible answer key.
- [ ] Run validation/Phase 5 tests and correct all Form A content-contract failures.

### Task 5: Author and validate Form B

**Files:**
- Create: 7 `content-src/passages/p-rla-mock-b-*.json`
- Create: 7 `content-src/sets/set-rla-mock-b-*.json`
- Create: `content-src/mock-er-prompts/mock-er-b.json`
- Modify: `content-src/config/rla-mock-v2.json`

**Interfaces:**
- Produces: Form B with no objective/source/ER overlap with Form A.

- [ ] Author the full B form to the same count, reporting, type, text-balance, context, and passage-length contracts.
- [ ] Use a distinct GAC/civics context and distinct source topics from A.
- [ ] Author unique ER B and run cross-form overlap/equivalence tests.
- [ ] Fix any DOK/item-type/reporting-category imbalance revealed by tests.

### Task 6: Author and validate Form C

**Files:**
- Create: 7 `content-src/passages/p-rla-mock-c-*.json`
- Create: 7 `content-src/sets/set-rla-mock-c-*.json`
- Create: `content-src/mock-er-prompts/mock-er-c.json`
- Modify: `content-src/config/rla-mock-v2.json`

**Interfaces:**
- Produces: Form C with no objective/source/ER overlap with A/B and completes the dedicated bank.

- [ ] Author the full C form to the same contracts with a third distinct civics/GAC context.
- [ ] Author unique ER C.
- [ ] Run all content/form/equivalence tests and verify 21 modules / 138 questions / 3 mock ER prompts.
- [ ] Set `selection.allowPracticeFallback` to `false` only after all three forms validate.

### Task 7: Complete learner UI, ER isolation, results, and Progress behavior

**Files:**
- Modify: `quiz.html`
- Modify: `js/quiz.js`
- Modify: `js/test.js`
- Modify: `js/extended-response.js`
- Modify: `js/progress.js`
- Modify CSS only if required for existing layouts.

**Interfaces:**
- Consumes: fixed attempts with `formId`, generated mock ER payload, score reporting categories.
- Produces: learner-visible Full RLA Mock, hidden mock ER bank, reporting-category results, separate ER self-review, richer mock history.

- [ ] Change full-test landing/resume/result labels to `Full RLA Mock` with bounded GED-style disclaimer; keep Objective RLA Practice Test separate.
- [ ] Load mock ER prompts from `mock-er-prompts.json` only for a valid saved mock attempt whose prompt ID matches the attempt; ordinary ER Practice continues using `er-prompts.json`.
- [ ] Remove authoring/model/revision materials from mock ER learner review if those would reveal scoring keys beyond self-review requirements.
- [ ] Score/report `Text Features & Technique`, `Evidence & Arguments`, and `Language Conventions` from `reportingCategory`, while keeping skill breakdown underneath.
- [ ] Persist date, raw objective score, reporting-category breakdown, ER self-review status, time used, completion status, and internal `formId` in mock history without feeding mastery.
- [ ] Remove Practice fallback wording and add a regression assertion that Full Mock cannot consume Practice when fallback is disabled.

### Task 8: Restore release gate and verify Phase 5 closeout

**Files:**
- Modify: release metadata/cache files only if the project’s existing release process requires synchronization.
- Modify: `STUDO_MASTER_STATUS.md` or add a Phase 5 closeout report if consistent with project history.
- Potential baseline cleanup: remove retired scratch-drawing implementation only if required to restore the already-failing pre-Phase-5 navigation test.

**Interfaces:**
- Produces: clean source build/public artifact and a packaged Phase 5 project snapshot.

- [ ] Run `npm test`; if the pre-existing scratch-drawing baseline failure remains, fix that isolated retired-code issue without changing learner behavior and rerun the suite.
- [ ] Run `npm run content:validate`.
- [ ] Run `npm run content:build`.
- [ ] Run `npm run public:build -- --out /mnt/data/studo-phase5-public`.
- [ ] Check source/public JavaScript syntax, generated counts, mock-only role isolation, ER payload separation, no authoring/demo leakage, release metadata/cache consistency, and static artifact references.
- [ ] Run a scripted browser-independent smoke of four new full-mock selections to prove A/B/C-before-repeat and least-recently-used behavior; note that true real-device manual QA remains a human release gate.
- [ ] Archive the completed worktree as `/mnt/data/studo-phase5-complete.zip` and report verification results and any remaining manual device/browser checks.
