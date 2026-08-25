# Phase 3D Language Calibration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the selected Language difficulty calibration by making Agreement & Pronouns and Parallelism & Sentence Connections genuinely progress from foundation to application to harder multi-constraint editing, then decide whether the other four focused Language units need any Phase 3 change.

**Architecture:** Keep the existing 7-unit / 13-skill Language architecture, resource PDFs, focused module count, and six mixed editing passages. Change only canonical source-set questions and release/test metadata; generated data remains build output. A dedicated regression test proves substantive 2 Easy / 4 Medium / 2 Hard progressions for the two priority units.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js ESM tests, JSON canonical content under `content-src/`, existing content validator/build pipeline.

**Spec:** `docs/superpowers/specs/2026-08-25-phase3-closeout-design.md`

## Global Constraints

- Practice teaches. Train strengthens. Mock measures.
- Difficulty must come from reasoning, not labels or confusing controls.
- Do not add Language modules or PDFs.
- Do not alter the six mixed editing passages.
- Do not add flashcards, Skill Checks, or Mock-only content.
- Canonical authoring remains in `content-src/`; never hand-edit `data/generated/` as source.
- Stop if audit finds a genuine blocking gap in Word Choice, Modifiers, Concision, or Capitalization rather than silently widening scope.

---

### Task 1: Agreement & Pronouns calibration

**Files:**
- Modify: `content-src/sets/set-rla-lang-agreement.json`
- Create: `scripts/language-priority-calibration-quality.test.mjs`

**Interfaces:**
- Consumes: existing schema-v2 focused Language set contract (`grammar_edit`, `difficulty`, `dok`, `difficultyProfile`).
- Produces: an eight-question set with ordered difficulty `easy,easy,medium,medium,medium,medium,hard,hard`; hard questions require combined agreement + pronoun-reference/scope reasoning.

- [ ] **Step 1: Write the failing Agreement regression test**

Create `scripts/language-priority-calibration-quality.test.mjs` with helpers that read canonical JSON and assert:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const agreement = JSON.parse(fs.readFileSync('content-src/sets/set-rla-lang-agreement.json', 'utf8'));

function profile(set) {
  return set.questions.map((q) => `${q.difficulty}:${q.dok}`);
}

test('Agreement & Pronouns has a real 2 easy / 4 medium / 2 hard progression', () => {
  assert.deepEqual(profile(agreement), [
    'easy:1','easy:1',
    'medium:2','medium:2','medium:2','medium:2',
    'hard:3','hard:3',
  ]);
  assert.equal(agreement.questions.length, 8);
  assert.ok(agreement.questions.slice(6).every((q) => q.difficultyProfile.reasoningDepth >= 3));
});

test('Agreement hard items require multiple grammar constraints rather than relabeling old items', () => {
  const hardText = agreement.questions.slice(6).map((q) => `${q.prompt} ${q.options.map((o) => o.text).join(' ')}`).join(' ').toLowerCase();
  assert.match(hardText, /pronoun|their|its|they|it/);
  assert.match(hardText, /manager|team|committee|each|neither|either|one of|series|group/);
});
```

- [ ] **Step 2: Run the new test and verify RED**

Run: `node --test scripts/language-priority-calibration-quality.test.mjs`

Expected: FAIL because Alpha 23 Agreement is still flat Medium/DOK2.

- [ ] **Step 3: Rewrite the canonical Agreement progression**

Keep eight questions and the existing skills/families. Reorder/rewrite so:

```text
q1 Easy/DOK1: direct subject-verb agreement with no misleading attractor
q2 Easy/DOK1: clear singular/plural pronoun match
q3 Medium/DOK2: prepositional/agreement attractor
q4 Medium/DOK2: ambiguous pronoun reference in context
q5 Medium/DOK2: interrupting phrase / true subject
q6 Medium/DOK2: compound/indefinite agreement or antecedent distance
q7 Hard/DOK3: one sentence where the learner must preserve subject-verb agreement and choose an unambiguous pronoun reference
q8 Hard/DOK3: dense sentence with an indefinite/collective subject plus pronoun-number/scope constraint; close distractors each fix only one problem
```

For q7/q8 set `difficultyProfile.reasoningDepth` and `distractorSimilarity` to at least 3 and make explanations explicitly name both constraints.

- [ ] **Step 4: Run targeted test and validator**

Run:

```bash
node --test scripts/language-priority-calibration-quality.test.mjs
npm run content:validate
```

Expected: targeted Agreement test passes; validator remains 0 errors / 0 warnings.

- [ ] **Step 5: Commit in a Git checkout**

```bash
git add content-src/sets/set-rla-lang-agreement.json scripts/language-priority-calibration-quality.test.mjs
git commit -m "content: calibrate agreement and pronouns difficulty"
```

---

### Task 2: Parallelism & Sentence Connections calibration

**Files:**
- Modify: `content-src/sets/set-rla-lang-parallel.json`
- Modify: `scripts/language-priority-calibration-quality.test.mjs`

**Interfaces:**
- Consumes: the test helper created in Task 1.
- Produces: an eight-question set with ordered 2 Easy / 4 Medium / 2 Hard progression; final items preserve both parallel structure and logical relationship.

- [ ] **Step 1: Add the failing Parallelism regression tests**

Append:

```js
const parallel = JSON.parse(fs.readFileSync('content-src/sets/set-rla-lang-parallel.json', 'utf8'));

test('Parallelism & Sentence Connections has a real 2 easy / 4 medium / 2 hard progression', () => {
  assert.deepEqual(profile(parallel), [
    'easy:1','easy:1',
    'medium:2','medium:2','medium:2','medium:2',
    'hard:3','hard:3',
  ]);
  assert.equal(parallel.questions.length, 8);
  assert.ok(parallel.questions.slice(6).every((q) => q.difficultyProfile.reasoningDepth >= 3));
});

test('Parallelism hard items require form plus logical-relationship reasoning', () => {
  const hard = parallel.questions.slice(6);
  const text = hard.map((q) => `${q.prompt} ${q.options.map((o) => o.text).join(' ')}`).join(' ').toLowerCase();
  assert.match(text, /although|because|however|therefore|while|but|so|yet/);
  assert.ok(hard.every((q) => /parallel|relationship|contrast|cause|reason|meaning/i.test(q.explanation.whyCorrect)));
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test scripts/language-priority-calibration-quality.test.mjs`

Expected: Agreement tests pass; new Parallelism tests fail because the set is still flat Medium/DOK2.

- [ ] **Step 3: Rewrite Parallelism progression**

Keep eight questions and existing skill/family coverage. Target:

```text
q1 Easy/DOK1: obvious parallel series
q2 Easy/DOK1: straightforward connector matching an explicit relationship
q3 Medium/DOK2: clause-level parallelism
q4 Medium/DOK2: contrast connector in context
q5 Medium/DOK2: cause/result or addition relationship
q6 Medium/DOK2: subordination with preserved meaning
q7 Hard/DOK3: multiple coordinated items where only one revision is parallel AND preserves contrast/cause
q8 Hard/DOK3: sentence pair/compound-complex revision where punctuation/connector choice and parallel structure both matter
```

Final explanations must name both the grammatical form and the intended logical relationship.

- [ ] **Step 4: Run tests and validator**

Run:

```bash
node --test scripts/language-priority-calibration-quality.test.mjs
npm run content:validate
```

Expected: all priority Language calibration tests pass; validator 0 errors / 0 warnings.

- [ ] **Step 5: Commit in a Git checkout**

```bash
git add content-src/sets/set-rla-lang-parallel.json scripts/language-priority-calibration-quality.test.mjs
git commit -m "content: calibrate parallelism and connections difficulty"
```

---

### Task 3: Whole-Language audit and Alpha 24 checkpoint

**Files:**
- Modify: `package.json`
- Modify: `STUDO_MASTER_STATUS.md`
- Modify release/version metadata files discovered by `scripts/alpha-release-hardening.test.mjs`
- Test: `scripts/language-quality.test.mjs`
- Test: `scripts/language-priority-calibration-quality.test.mjs`

**Interfaces:**
- Consumes: calibrated focused sets from Tasks 1–2 plus unchanged other Language sets/mixed passages.
- Produces: a green Language subsystem and written status declaring either “sufficient for Phase 3” or a concrete blocker.

- [ ] **Step 1: Add the new test file to the sequential `npm test` command**

Insert `node --test scripts/language-priority-calibration-quality.test.mjs` immediately after the existing Sentence Boundaries quality test.

- [ ] **Step 2: Run the Language audit commands**

```bash
node --test scripts/language-quality.test.mjs
node --test scripts/sentence-boundaries-difficulty-quality.test.mjs
node --test scripts/language-priority-calibration-quality.test.mjs
npm run content:validate
```

Inspect Word Choice, Modifiers, Concision, and Capitalization canonical sets. Do not edit them unless a concrete learner-blocking flaw is demonstrated by the audit.

- [ ] **Step 3: Record the Alpha 24 checkpoint**

Update `STUDO_MASTER_STATUS.md` to record:

```text
Phase 3D Language calibration complete.
Sentence Boundaries, Agreement & Pronouns, and Parallelism & Sentence Connections now contain explicit difficulty progression.
The remaining focused Language units were audited and left unchanged unless a named blocking flaw was found.
Next checkpoint: Phase 3E Extended Response production depth.
```

Update release/version strings to `0.7.0-alpha.24` without changing module/question/PDF counts unless an audit-driven content change explicitly changed them.

- [ ] **Step 4: Run the full Alpha 24 gate**

```bash
npm test
npm run content:validate
npm run content:build
npm run public:build -- --out /mnt/data/alpha24_public_verify
```

Expected: all tests pass; validation 0/0; public artifact clean.

- [ ] **Step 5: Commit in a Git checkout**

```bash
git add package.json STUDO_MASTER_STATUS.md scripts/language-priority-calibration-quality.test.mjs content-src/sets/set-rla-lang-agreement.json content-src/sets/set-rla-lang-parallel.json
git commit -m "release: complete phase 3d language calibration"
```
