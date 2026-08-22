# Studo RLA Mock/Test V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy all-questions quiz with a blueprint-driven three-part GED-style RLA mock containing exactly 46 objective questions plus one timed Extended Response.

**Architecture:** A canonical mock blueprint lives under `content-src/config/` and is copied to generated learner data by the existing build. A pure `js/mock-engine.js` module owns selection, attempt state, timing, and scoring so the DOM layer stays small and testable. `quiz.html` becomes the mock landing page; `test.html` becomes the objective/break/results shell; the existing `extended-response.html` is reused with attempt-scoped persistence for Part 2.

**Tech Stack:** Static HTML/CSS/vanilla JS, Node `node:test`, JSON content pipeline, browser localStorage via StudoSafeStorage.

**Spec:** `docs/superpowers/specs/2026-08-22-rla-mock-test-v1-design.md`

## Global Constraints

- Full mock: 14 objective questions in Part 1, one 45-minute ER, 10-minute break, 32 objective questions in Part 3.
- Exactly 46 auto-gradable objective questions total.
- Reading/Arguments/Language all appear; target distribution is 25 Reading / 10 Arguments / 11 Language questions.
- Preserve whole mixed source sets wherever practical; use focused standalone questions only as bounded fillers.
- Reading selected source sets target approximately 75% informational / 25% literary and include at least one 600+ word passage when available.
- No duplicate question IDs or module/source-set IDs in one attempt.
- Attempt generation is fixed after start and recovers from timestamps/local storage after refresh.
- No explanations before final completion.
- ER self-review stays separate from objective score.
- No fake GED scaled score, pass/fail, or College Ready label.
- Existing Reading, Arguments, Language, ER, Foundation, and Navigation behavior must remain green.

---

### Task 1: Canonical blueprint + deterministic generator

**Files:**
- Create: `content-src/config/rla-mock-v1.json`
- Create: `js/mock-engine.js`
- Create: `scripts/mock-test-quality.test.mjs`
- Modify: `scripts/build-content.mjs`
- Modify: `package.json`

**Interfaces:**
- `MockEngine.generateFullMock({ modules, prompts, blueprint, seed }) -> attemptBlueprint`
- `MockEngine.scoreObjectiveAttempt(attempt, moduleMap) -> summary`
- `data/generated/mock-blueprint.json` is the browser-readable canonical config.

- [ ] Write failing tests for exact counts, domain distribution, duplicate prevention, reading balance, 600+ passage inclusion, ER prompt selection, and hidden-key absence.
- [ ] Run `node --test scripts/mock-test-quality.test.mjs` and verify RED.
- [ ] Add `content-src/config/rla-mock-v1.json` with full/mock-objective timing and selection targets.
- [ ] Implement pure seeded selection in `js/mock-engine.js` using whole Reading/Arguments/Language mixed sets plus bounded focused fillers to reach 14/32 exactly.
- [ ] Extend build to copy the canonical blueprint to `data/generated/mock-blueprint.json`.
- [ ] Run mock tests and existing content build until GREEN.
- [ ] Add the mock test file to `npm test`.

### Task 2: Attempt persistence, timers, flags, and scoring

**Files:**
- Modify: `js/mock-engine.js`
- Modify: `scripts/mock-test-quality.test.mjs`

**Interfaces:**
- `MockEngine.createAttempt(blueprint, now)`
- `MockEngine.remainingSeconds(stageState, now)`
- `MockEngine.serializeAttempt(attempt)` / JSON-safe state
- `MockEngine.scoreObjectiveAttempt(attempt, moduleMap)`

- [ ] Add failing tests proving fixed recovery, timestamp countdown, answer/flag persistence, expired-section locks, ER exclusion from objective scoring, and no scaled-score fields.
- [ ] Run tests and verify RED.
- [ ] Implement the minimal pure state/timer/scoring helpers.
- [ ] Run tests and verify GREEN.

### Task 3: Replace Quiz landing + objective mock workspace

**Files:**
- Modify: `quiz.html`
- Modify: `js/quiz.js`
- Modify: `test.html`
- Replace: `js/test.js`
- Modify: `css/site.css`
- Modify: `scripts/mock-test-quality.test.mjs`

**Interfaces:**
- `quiz.html` starts/resumes a full mock and offers a bounded objective practice test.
- `test.html?attempt=<id>` restores the stored attempt.

- [ ] Add failing static/UI-contract tests proving the old “every matching question” copy/links are absent and new Full Mock controls exist.
- [ ] Run tests and verify RED.
- [ ] Rebuild quiz landing around Full RLA Mock, Objective Practice Test, Resume Attempt, and links to normal section practice.
- [ ] Replace legacy `js/test.js` with stage-aware objective section UI: section label, persistent countdown, answer selection, flags, navigator/review screen, section submission, and hidden explanations.
- [ ] Add responsive mock styles using existing Studo tokens.
- [ ] Run mock + navigation tests and verify GREEN.

### Task 4: Integrate existing ER workspace + break + final results/progress

**Files:**
- Modify: `js/extended-response.js`
- Modify: `extended-response.html` only if needed for mock-return UI
- Modify: `js/test.js`
- Modify: `js/progress.js`
- Modify: `scripts/mock-test-quality.test.mjs`

**Interfaces:**
- ER mock URL: `extended-response.html?prompt=<id>&mode=timed&attempt=<mockAttemptId>&return=test.html?attempt=<mockAttemptId>`
- Mock-scoped ER state key: `sq:er:mock:<attemptId>:<promptId>`
- Mock history key: `sq:rlaMockAttempts`

- [ ] Add failing tests for attempt-scoped ER state, model-answer lock, return-to-mock link, break state, results labels, progress history, and no objective/self-review score mixing.
- [ ] Run tests and verify RED.
- [ ] Make ER persistence attempt-scoped when `attempt` is supplied and expose a clear return-to-mock action after submission.
- [ ] Implement 10-minute break screen with continue-early confirmation.
- [ ] Implement Part 3 completion + raw objective results/domain breakdown/time/unanswered/flagged + separate ER self-review status.
- [ ] Store bounded mock history and add a clearly labeled Mock Tests section to Progress.
- [ ] Run mock + ER + Progress tests and verify GREEN.

### Task 5: Clean-build release gate + documentation

**Files:**
- Create: `STUDO_RLA_MOCK_TEST_V1_QA.md`
- Create: `STUDO_MASTER_STATUS.md`
- Modify: `release.json` / `release-gate.json` only if current conventions require it.

**Interfaces:** None beyond the release artifact.

- [ ] Delete `data/generated/`, run `npm run content:check`, then `npm test`.
- [ ] Run syntax checks across all JS/MJS files.
- [ ] Run repeated seeded generation (>=100 seeds) and assert every mock satisfies blueprint invariants.
- [ ] Serve locally and smoke-check `quiz.html`, Part 1, ER launch, break, Part 3, final results, Progress, and normal Practice/Resources navigation.
- [ ] Verify the legacy 683-question behavior is unreachable and no learner-facing text claims an official/scaled GED score.
- [ ] Write `STUDO_RLA_MOCK_TEST_V1_QA.md` with exact evidence and remaining warnings.
- [ ] Write `STUDO_MASTER_STATUS.md` summarizing current/published/deprecated/remaining work.
- [ ] Package the exact verified Studo tree without transient work directories and run ZIP integrity validation.
