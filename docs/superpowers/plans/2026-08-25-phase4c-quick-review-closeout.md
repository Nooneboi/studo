# Phase 4C Quick Review and Phase 4 Closeout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a selective Quick Review mode under Train that schedules discrete recall without altering mastery evidence, then verify and close Phase 4.

**Architecture:** Add one canonical curated card registry built to `data/generated/quick-review.json`. Keep adaptive `train.js` behavior intact; route `train.html?mode=quick-review` to a focused `js/quick-review.js` controller. Store card scheduling separately under `sq:quick-review:v1`; never call `Learning.recordAttempt` from Quick Review.

**Tech Stack:** Static HTML/CSS/JavaScript, JSON canonical config, Node.js build/tests, local safe storage.

**Spec:** `docs/superpowers/specs/2026-08-25-phase4-skill-check-train-design.md`

## Global Constraints

- 25–30 cards only; no global flashcard library.
- Cards cover discrete terms/rules, not passage reasoning for Main Idea, Summary, Inference, synthesis, etc.
- `Again` / `Got it` control only Quick Review scheduling.
- Quick Review never calls `Learning.recordAttempt`, never updates mistake/mastery/skill signal state, and never enters Mock.
- Adaptive Train remains reasoned 8-question sessions and does not silently mix cards into them.

---

### Task 1: RED Quick Review contract

**Files:**
- Create: `scripts/quick-review-quality.test.mjs`

**Interfaces:**
- Produces canonical card, build, runtime, and evidence-isolation assertions.

- [ ] **Step 1: Write failing assertions**

Assert canonical registry `content-src/config/rla.quick-review.v1.json` has 25–30 cards and controlled categories:

```text
argument_terms
transitions
text_structure
word_tone
language_rules
punctuation
extended_response
```

Assert prohibited reasoning labels/topics are absent from card prompts/titles: Main Idea, Summary, Inference, synthesis-as-a-passage-task.

Assert `js/quick-review.js` does not contain `Learning.recordAttempt` or `Learning.setMistakeReason`.

- [ ] **Step 2: Run RED**

Run: `node --test scripts/quick-review-quality.test.mjs`

Expected: FAIL because registry/runtime/generated data do not exist.

---

### Task 2: Canonical registry and learner build

**Files:**
- Create: `content-src/config/rla.quick-review.v1.json`
- Modify: `scripts/validate-content.mjs`
- Modify: `scripts/build-content.mjs`
- Modify: `scripts/build-public.mjs`

**Interfaces:**
- Produces `data/generated/quick-review.json` containing learner-safe card objects `{id,category,front,back,example?}`.

- [ ] **Step 1: Author 28 curated cards**

Recommended distribution:

```text
argument_terms: 5
transitions: 5
text_structure: 3
word_tone: 3
language_rules: 5
punctuation: 4
extended_response: 3
```

Each card has one recall target only. Examples must be short and original.

- [ ] **Step 2: Validate registry**

Add validation for schema version, unique IDs, controlled category, non-empty front/back, max practical text lengths, and total card count 25–30.

- [ ] **Step 3: Build learner-safe file**

`build-content.mjs` writes:

```js
await fs.writeFile(
  path.join(OUT, 'quick-review.json'),
  JSON.stringify({ schemaVersion: 1, builtAt: new Date().toISOString(), cards: quickReview.cards }, null, 2) + '\n'
);
```

Add `quick-review.json` to public generated data.

- [ ] **Step 4: Run GREEN build checks**

```bash
npm run content:validate
npm run content:build
node --test scripts/quick-review-quality.test.mjs
```

---

### Task 3: Quick Review runtime under Train

**Files:**
- Create: `js/quick-review.js`
- Modify: `js/train.js`
- Modify: `train.html`
- Modify: `css/site.css`
- Modify: `scripts/build-public.mjs`

**Interfaces:**
- URL: `train.html?mode=quick-review`.
- Storage key: `sq:quick-review:v1`.
- Produces a short card queue ordered by due/again/new status and stores only card scheduling state.

- [ ] **Step 1: Branch Train landing without changing adaptive session behavior**

At `train.js` bootstrap:

```js
const mode = new URLSearchParams(location.search).get('mode');
if (mode === 'quick-review' && window.QuickReview) {
  window.QuickReview.init({ mount: trainView });
  return;
}
```

On ordinary Train landing/plan, add a secondary `Quick Review` link to `train.html?mode=quick-review`.

- [ ] **Step 2: Implement scheduler**

State shape:

```js
{ version: 1, cards: { [id]: { status, dueAt, seen, correctStreak } } }
```

`Again`: due immediately/next session, streak 0.
`Got it`: increment streak and schedule 1, 3, 7, then 14 days.
Queue maximum: 10 cards per Quick Review session, with due cards first, then unseen.

- [ ] **Step 3: Implement card flow**

Show front → `Reveal` → back/example → `Again` / `Got it`. No score percentage and no learner-skill language. Completion copy reports cards reviewed and cards still due only.

- [ ] **Step 4: Run evidence-isolation tests**

```bash
node --test scripts/quick-review-quality.test.mjs
npm test
```

Expected: Quick Review never mutates Learning state and adaptive Train tests stay green.

---

### Task 4: Phase 4 whole-system closeout

**Files:**
- Create: `docs/superpowers/reviews/2026-08-25-phase4-closeout-review.md`
- Modify: `STUDO_MASTER_STATUS.md`
- Modify: `release.json`, release meta tags, service worker/cache release references only after final GREEN.
- Create: `scripts/phase4-closeout-quality.test.mjs`

- [ ] **Step 1: Add cross-mode isolation test**

Assert:

```text
Practice modules have practice role
Train candidate modules have train role
Skill Checks have only skill_check role + mock-excluded
Quick Review has no Learning.recordAttempt path
Mock still has no dedicated mock-only bank
Skill Check modules do not enter Practice sets, Train, or Mock
Progress shows Practice signal separately from latest Check
```

- [ ] **Step 2: Review learner flow**

Trace fresh and experienced learners through:

```text
Learn/Practice -> Train -> Skill Check -> Progress
Train -> Quick Review (optional recall lane)
```

Ensure no disabled/empty Check section appears, no hidden flashcard library leaks into unrelated pages, and Check completion routes back to the canonical skill.

- [ ] **Step 3: Write closeout review**

Explicitly document what Phase 4 proves, what it intentionally does not prove, why only nine Checks exist, why Quick Review is selective, and that Phase 5 remains the dedicated unseen Mock bank.

- [ ] **Step 4: Synchronize final release**

Use `0.7.0-alpha.29` for the Phase 4 closeout release if Alpha 27/28 are used as internal checkpoints.

- [ ] **Step 5: Run exact final gate**

```bash
npm test
npm run content:validate
npm run content:build
rm -rf /mnt/data/phase4_closeout_public_verify
npm run public:build -- --out /mnt/data/phase4_closeout_public_verify
```

Then run JS syntax checks, broken local-reference scan, learner-only artifact scan, expected inventory check (`112 modules / 807 questions / 152 PDFs / 9 Checks / 28 Quick Review cards`), release metadata consistency, no source/authoring/demo leakage, and Check/QuickReview isolation.

- [ ] **Step 6: Package verified handoff**

Create:

```text
/mnt/data/chee-skool-0.7.0-alpha.29-source.zip
/mnt/data/chee-skool-0.7.0-alpha.29-public.zip
```

SOURCE excludes `.git`, `node_modules`, temporary verify output. PUBLIC comes only from the fresh verified public build.
