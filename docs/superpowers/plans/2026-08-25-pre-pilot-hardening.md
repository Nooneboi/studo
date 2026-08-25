# Pre-Pilot Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the supplied alpha.32 tree into a clean alpha.33 pre-pilot candidate with isolated learning evidence, stronger fixed-form Mock QA, targeted Practice/Train depth, and clean source/release artifacts.

**Architecture:** Keep the existing learner modes and canonical content pipeline. Change only the evidence filter used by learning summaries, add QA around complete Mock form answer positions, add two focused Practice/Train transfer sets for selected thin skills, and clean the source/release packaging. Generated learner data continues to come only from canonical `content-src`.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js built-in test runner, JSON canonical content pipeline, service worker.

**Spec:** `docs/superpowers/specs/2026-08-25-pre-pilot-hardening-design.md`

## Global Constraints

- Preserve `Learn → Practice → Train → Skill Check → Mock → Progress` separation.
- Practice/Train signals use only `practice` and `train` attempt modes.
- Skill Check and Mock stay separate evidence surfaces.
- Full Mock stays fixed-form with exactly 3 forms / 21 mock-only modules / 138 mock-only objective questions / 3 mock-only ER prompts.
- No official GED score/pass/psychometric-equivalence claims.
- No new PDFs.
- New learning content is original and uses only `practice` / `train` delivery roles.
- Release target is `0.7.0-alpha.33`.

---

### Task 1: Clean source and package leftovers

**Files:**
- Remove: eight unregistered PDFs under `assets/resources/`
- Remove: all `*.bak` and `*.bak4e` files
- Modify/Test: `scripts/alpha-release-hardening.test.mjs`

**Interfaces:**
- Consumes: published resource registry in canonical content.
- Produces: physical learner resource directory that exactly matches published resource references.

- [ ] Add/extend a hardening assertion that backup artifacts are absent from the source tree.
- [ ] Run `node --test scripts/alpha-release-hardening.test.mjs` and confirm RED because the supplied tree has orphan PDFs/backups.
- [ ] Remove the eight orphan PDFs and 12 backup artifacts.
- [ ] Re-run the hardening test and confirm GREEN.

### Task 2: Isolate Practice/Train evidence from Skill Check arithmetic

**Files:**
- Modify: `js/learning.js`
- Modify/Test: `scripts/phase25-learning-system-integration.test.mjs`
- Modify/Test: `scripts/skill-check-runtime-quality.test.mjs`

**Interfaces:**
- Produces: `isLearningEvidenceAttempt(attempt)` semantics used by `getSkillSummary()`, `getSkillSummaries()`, and `getSummary()` metrics.
- Skill Check storage/history remains unchanged.

- [ ] Add a failing test with one Practice attempt and one Skill Check attempt on the same skill; assert the Practice skill score/attempt count/accuracy are unchanged by the Skill Check result.
- [ ] Add a failing test asserting Skill Check history still records the independent result.
- [ ] Run the focused tests and confirm RED.
- [ ] Implement a learning-evidence filter accepting only `practice` and `train` for summary arithmetic while leaving `recordAttempt`, mistakes, and review scheduling intact.
- [ ] Re-run focused tests and confirm GREEN.

### Task 3: Add complete-form Mock answer-position QA and rebalance forms

**Files:**
- Modify: `scripts/validate-content.mjs`
- Modify/Test: `scripts/phase5-mock-quality.test.mjs`
- Modify: canonical Mock set JSON files under `content-src/sets/set-rla-mock-{a,b,c}-*.json` only where option order changes are required.

**Interfaces:**
- Validator derives displayed correct-option positions from the options array and `correct` IDs for `multiple_choice` and `grammar_edit` items.
- Form-level QA rejects a longest same-position run >= 3, a single-position share > 40%, or pairwise exact-position similarity > 60% across complete forms.

- [ ] Add failing form-level tests for the current >80% pairwise answer-position sequence similarity.
- [ ] Add corresponding canonical validator errors/warnings so the rule is enforced outside the test file.
- [ ] Run Phase 5 quality/validation and confirm RED.
- [ ] Deterministically reorder options in the affected Mock questions and update `explanation.answer` letters to match displayed position; keep `correct` option IDs/content unchanged.
- [ ] Rebuild and assert every form remains 46 objective questions, 16/21/9 reporting categories, 34 MC + 8 grammar + 2 select-text + 2 drag, 2 literary/5 informational-editing, and no content overlap.
- [ ] Re-run validation/Phase 5 tests and confirm GREEN.

### Task 4: Enforce role-specific learning-bank depth and add targeted transfer content

**Files:**
- Create: `content-src/passages/p-rla-args-transfer-evidence-cooling-plaza.json`
- Create: `content-src/sets/set-rla-args-transfer-evidence-relevance.json`
- Create: `content-src/passages/p-rla-args-transfer-assumptions-flex-start.json`
- Create: `content-src/sets/set-rla-args-transfer-assumptions.json`
- Create: `content-src/passages/p-rla-lang-transfer-agreement-pronouns.json`
- Create: `content-src/sets/set-rla-lang-transfer-agreement-pronouns.json`
- Modify: curriculum configuration as needed to expose the new sets within existing relevant units without creating a new learner category.
- Modify/Test: `scripts/alpha-release-hardening.test.mjs` or a focused new `scripts/pre-pilot-hardening.test.mjs`
- Modify: `package.json` test chain if a new focused test file is created.

**Interfaces:**
- All three new sets publish with `deliveryRoles: ["practice", "train"]`.
- Evidence Relevance adds 4 transfer questions for `R5.4`.
- Assumptions & Premises adds 4 transfer questions for `R5.8`.
- Agreement & Pronouns adds 8 transfer questions: 3 `L1.2`, 3 `L1.3`, and 2 `L1.7`.

- [ ] Add failing role-specific coverage tests requiring `R5.4 >= 8`, `R5.8 >= 8`, `L1.2 >= 7`, `L1.3 >= 9`, and `L1.7 >= 7` Practice/Train questions, while excluding Skill Check/Mock from the count.
- [ ] Run the focused test and confirm RED on the current bank.
- [ ] Author the three original transfer passages/sets with varied contexts and close distractors, reusing existing interaction types and question-family IDs.
- [ ] Attach them to existing Arguments and Language learner units; do not add new navigation modes or PDFs.
- [ ] Run content validation/build and the role-specific test until GREEN with zero validation warnings.

### Task 5: Synchronize documentation and alpha.33 release metadata

**Files:**
- Modify: `STUDO_MASTER_STATUS.md`
- Modify: `release.json`
- Modify: `sw.js`
- Modify: learner/internal HTML release meta occurrences and any release-count assertions.
- Modify: release/build count metadata affected by the three new modules / 16 new questions.

**Interfaces:**
- Public/source release identity is consistently `0.7.0-alpha.33`.
- Master status describes dedicated Mock as current, fallback disabled, and Practice/Train evidence isolated from Skill Check.

- [ ] Replace stale fallback/future-Mock statements with current architecture wording while preserving historical phase context where useful.
- [ ] Bump all release/cache identifiers to alpha.33.
- [ ] Update expected module/question counts from the clean build output rather than guessing.
- [ ] Run metadata/phase guard tests and fix only assertions intentionally superseded by this hardening pass.

### Task 6: Whole-project verification and packaging

**Files:**
- Generated: `data/generated/**`
- Output: fresh learner-only public directory and source/public ZIPs.

**Interfaces:**
- Canonical source → validated generated data → learner-only public build.

- [ ] Run `npm test` and require 0 failures.
- [ ] Run `npm run content:validate` and require 0 errors / 0 warnings.
- [ ] Run `npm run content:build` from canonical source.
- [ ] Run `npm run public:build -- --out /mnt/data/studo-alpha33-public`.
- [ ] Audit public artifact for no authoring/backups/orphan PDFs, synchronized alpha.33 release/cache metadata, valid JS syntax, and unchanged dedicated Mock counts.
- [ ] Package `/mnt/data/studo-alpha33-source.zip` and `/mnt/data/studo-alpha33-public.zip`.
