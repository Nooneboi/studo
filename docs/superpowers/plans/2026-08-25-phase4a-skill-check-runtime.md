# Phase 4A Skill Check Runtime and Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated learner-facing Skill Check runtime that stores independent evidence separately from Practice and exposes latest Check results in Progress.

**Architecture:** Add `check.html` + `js/check.js` rather than branching Practice runtime behavior. Reuse `Data`, `Learning`, `QuestionInteractions`, and existing focus-shell styles. Persist question-level attempts in `sq:learning:v1` as `mode: skill_check` and store bounded session summaries in `sq:skill-check-history:v1` for learner-facing display.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js ESM tests, localStorage/StudoSafeStorage, canonical JSON build pipeline.

**Spec:** `docs/superpowers/specs/2026-08-25-phase4-skill-check-train-design.md`

## Global Constraints

- Skill Check feedback appears only after full submission.
- No hints, retries, confidence prompt, timer, or immediate right/wrong state.
- Only modules with `curriculum.deliveryRoles: ["skill_check"]` may open in Check mode.
- Check attempts use `mode: "skill_check"`, `assistance: "none"`, `attemptCount: 1`, `learningStage: null`.
- Check questions remain `mock-excluded` and never enter Train.
- Practice and Check signals remain visibly distinct in Progress.
- No pass/fail, mastery badge, GED-equivalent score, or readiness claim.

---

### Task 1: RED runtime contract

**Files:**
- Create: `scripts/skill-check-runtime-quality.test.mjs`
- Read: `js/module.js`, `js/learning.js`, `js/skill.js`, `js/progress.js`, `scripts/build-public.mjs`

**Interfaces:**
- Produces regression assertions for the dedicated runtime, independent attempt mode, history key, skill-page Check section, Progress distinction, and public-build inclusion.

- [ ] **Step 1: Write the failing test**

Create source assertions equivalent to:

```js
const checkHtml = read('check.html');
const checkJs = read('js/check.js');
const learningJs = read('js/learning.js');
const skillJs = read('js/skill.js');
const progressJs = read('js/progress.js');
const buildPublic = read('scripts/build-public.mjs');

assert.match(checkHtml, /js\/check\.js/);
assert.match(checkJs, /deliveryRoles/);
assert.match(checkJs, /skill_check/);
assert.doesNotMatch(checkHtml, /confidence/i);
assert.doesNotMatch(checkHtml, /hint/i);
assert.match(checkJs, /sq:skill-check-history:v1/);
assert.match(checkJs, /mode:\s*["']skill_check["']/);
assert.match(learningJs, /skill_check/);
assert.match(skillJs, /item\.checks/);
assert.match(progressJs, /Latest Skill Check/);
assert.match(buildPublic, /check\.html/);
assert.match(buildPublic, /check\.js/);
```

Also test `Learning.recordAttempt()` in a tiny VM/browser shim so `mode: skill_check` survives normalization and receives a dedicated mode/evidence weight.

- [ ] **Step 2: Run RED**

Run: `node --test scripts/skill-check-runtime-quality.test.mjs`

Expected: FAIL because `check.html` and `js/check.js` do not exist and learning/progress integration is absent.

---

### Task 2: Independent evidence + session history

**Files:**
- Modify: `js/learning.js`
- Create: `js/check.js`
- Create: `check.html`

**Interfaces:**
- Consumes: `Learning.recordAttempt({ module, question, answer, correct, mode, ... })`.
- Produces: `modeWeight("skill_check")`, check-session history stored under `sq:skill-check-history:v1`, and one recorded attempt per submitted question.

- [ ] **Step 1: Extend learning normalization/weighting minimally**

Implement:

```js
function modeWeight(mode) {
  if (mode === "test") return 1.1;
  if (mode === "skill_check") return 1.12;
  if (mode === "train") return 1.08;
  return 1;
}
```

Keep `learningStage: null`; independent strength comes from mode weight + no assistance + first-try correctness. Update comments to state that a short Check is stronger than ordinary Practice but not a psychometric mastery claim.

- [ ] **Step 2: Implement dedicated Check bootstrap**

`check.js` must:

```js
const params = new URLSearchParams(location.search);
const file = params.get('file');
const returnHref = safeReturn(params.get('return'));
const module = await Data.loadQuiz(file);
const roles = module.contentMeta?.curriculum?.deliveryRoles || [];
if (!roles.includes('skill_check')) return renderRecovery();
```

Render all questions without grading state. Store draft answers in memory for the active attempt, not Practice answer storage. Use `QuestionInteractions` helpers for supported non-MCQ interactions and local Check renderer logic for MCQ.

- [ ] **Step 3: Implement final-submit grading**

On `Finish Check`:

```js
if (unanswered.length) {
  showAccessibleError(`${unanswered.length} question(s) still need an answer.`);
  return;
}
const attemptId = crypto.randomUUID?.() || `check-${Date.now()}`;
for (const item of questions) {
  Learning.recordAttempt({
    module,
    question: item.question,
    answer: answers[item.question.id],
    correct,
    mode: 'skill_check',
    file,
    confidence: null,
    firstTryCorrect: correct,
    attemptCount: 1,
    assistance: 'none',
    learningStage: null,
  });
}
```

Only after all records are written, reveal result + per-question answer/explanation/evidence. Focus the result heading.

- [ ] **Step 4: Add bounded history helper inside Check runtime**

Use:

```js
const HISTORY_KEY = 'sq:skill-check-history:v1';
const MAX_HISTORY = 60;
```

Each summary stores `attemptId,moduleId,skillId,skillLabel,moduleTitle,attemptedAt,correct,total,percentage` and newest-first history is truncated to 60.

- [ ] **Step 5: Run GREEN runtime test**

Run: `node --test scripts/skill-check-runtime-quality.test.mjs`

Expected: runtime/evidence assertions pass.

---

### Task 3: Skill-page and Progress integration

**Files:**
- Modify: `js/skill.js`
- Modify: `js/progress.js`
- Modify: `css/site.css`
- Modify: `scripts/skill-check-runtime-quality.test.mjs`

**Interfaces:**
- Consumes: generated curriculum `item.checks`; Check history key.
- Produces: optional Check section on skill/unit page and separate latest Check result in Progress.

- [ ] **Step 1: Add Check section below the existing 3-column resource grid**

After the current grid render:

```js
${renderSkillChecks(item.checks || [], track, domain, item, Boolean(unitId))}
```

`renderSkillChecks` returns `""` when empty. Each card routes to:

```text
check.html?file=<set.file>&return=<encoded current skill URL>
```

Visible conditions: `Independent · no hints · answers after finishing`.

- [ ] **Step 2: Add Progress history reader**

Read `sq:skill-check-history:v1`, group by `skillId`, and attach latest summary to matching `Learning.getSummary().skills` rows without altering Practice counts.

Render compact distinction:

```text
Practice signal 82%
Latest Skill Check 5/6
```

Do not add Pass/Fail/Mastered.

- [ ] **Step 3: Fix mistake routing for Check-origin mistakes**

In `progress.js`, if a mistake's module has `skill_check` origin or `moduleFile` corresponds to a Check, route `Review this skill` to the canonical skill route instead of reopening `check.html` as ordinary Practice. Preserve current Practice mistake routes.

- [ ] **Step 4: Run GREEN**

Run:

```bash
node --test scripts/skill-check-runtime-quality.test.mjs
npm test
```

Expected: all runtime and existing tests pass.

---

### Task 4: Public build + Alpha 27 checkpoint

**Files:**
- Modify: `scripts/build-public.mjs`
- Modify release metadata only after GREEN.

- [ ] **Step 1: Add learner files**

Add `check.html` to `learnerPages` and `check.js` to `learnerJs`.

- [ ] **Step 2: Run canonical/public checkpoint**

```bash
npm run content:validate
npm run content:build
rm -rf /mnt/data/phase4_alpha27_public_verify
npm run public:build -- --out /mnt/data/phase4_alpha27_public_verify
node --test scripts/skill-check-runtime-quality.test.mjs
```

Expected: zero validation errors/warnings; Check runtime exists in fresh public build.
