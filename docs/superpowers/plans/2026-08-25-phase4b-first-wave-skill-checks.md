# Phase 4B First-Wave Skill Check Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish nine six-question unseen Skill Checks for mature Reading/Arguments skills without reusing Practice/Train questions or leaking them into Mock/Train.

**Architecture:** Author nine original passages and nine canonical schema-v2 sets under `content-src/`. Every set has exactly six questions, only `deliveryRoles: ["skill_check"]`, includes `mock-excluded`, and contains no Guided/Apply hints or learning stages. Build attaches the sets through existing `curriculum.checks` logic.

**Tech Stack:** Canonical JSON authoring, Node content validator/build, existing question family registry and interaction engine.

**Spec:** `docs/superpowers/specs/2026-08-25-phase4-skill-check-train-design.md`

## Global Constraints

- Exactly nine first-wave Check modules and 54 new questions.
- Questions/passages must be new original learner content, not lightly rewritten Practice items.
- Six questions per Check; no hints, no `learningStage`, no Practice/Train/Mock role.
- Every set includes `practiceTags: ["mock-excluded"]` and `deliveryRoles: ["skill_check"]`.
- Reading Checks measure one mature canonical skill each.
- Arguments unit Checks may cover the unit's paired canonical skills where the unit itself is the learner-facing skill.
- No new PDFs.

---

### Task 1: RED first-wave content contract

**Files:**
- Create: `scripts/skill-check-content-quality.test.mjs`

**Interfaces:**
- Produces exact count/role/family/unseen/passage assertions for the nine canonical Check sets.

- [ ] **Step 1: Write failing inventory assertions**

Define expected set IDs:

```js
const expected = [
  'set-rla-check-explicit-meaning-v1',
  'set-rla-check-main-idea-v1',
  'set-rla-check-supporting-details-v1',
  'set-rla-check-summary-v1',
  'set-rla-check-inference-v1',
  'set-rla-check-conclusions-v1',
  'set-rla-check-claims-structure-v1',
  'set-rla-check-finding-evidence-v1',
  'set-rla-check-credibility-counterarguments-v1',
];
```

For each set assert:

```js
assert.equal(set.questions.length, 6);
assert.deepEqual(set.curriculum.deliveryRoles, ['skill_check']);
assert.ok(set.curriculum.practiceTags.includes('mock-excluded'));
assert.ok(!set.curriculum.practiceTags.includes('active-learning'));
assert.ok(set.questions.every((q) => !q.hint && !q.learningStage));
```

Build an existing Practice/Train question fingerprint set from all non-Check canonical sets using normalized `prompt + options/interaction text`; assert no Check fingerprint matches.

- [ ] **Step 2: Run RED**

Run: `node --test scripts/skill-check-content-quality.test.mjs`

Expected: FAIL because nine Check sets do not yet exist.

---

### Task 2: Author six Reading Checks

**Files:**
- Create passages:
  - `content-src/passages/p-rla-check-explicit-tool-room.json`
  - `content-src/passages/p-rla-check-mainidea-flood-alerts.json`
  - `content-src/passages/p-rla-check-supporting-library-hours.json`
  - `content-src/passages/p-rla-check-summary-marsh-restoration.json`
  - `content-src/passages/p-rla-check-inference-workshop-lights.json`
  - `content-src/passages/p-rla-check-conclusions-cooling-materials.json`
- Create matching set files in `content-src/sets/` with IDs from Task 1.

**Interfaces:**
- Produces 36 unseen questions measuring `R1.1`, `R1.2`, `R1.3`, `R1.4`, `R2.4`, `R2.5`.

- [ ] **Step 1: Author original passages**

Target roughly 430–620 words each. Use varied contexts: workplace, community/civics, informational/science, and literary where appropriate. Keep the answerable evidence inside each passage.

- [ ] **Step 2: Author six questions per passage**

Use canonical family IDs already registered for the target skill. Prefer 4–5 MCQ plus one existing technology-enhanced interaction where it genuinely measures the skill; interaction variety is not a quota.

Each Check should move from direct/medium transfer to close-choice independent reasoning without `guided/apply/independent` labels.

- [ ] **Step 3: Run validation/content RED→GREEN loop**

```bash
node --test scripts/skill-check-content-quality.test.mjs
npm run content:validate
```

Fix only genuine schema/family/content warnings; do not suppress warnings.

---

### Task 3: Author three Arguments unit Checks

**Files:**
- Create passages:
  - `content-src/passages/p-rla-check-args-bike-storage.json`
  - `content-src/passages/p-rla-check-args-volunteer-shifts.json`
  - `content-src/passages/p-rla-check-args-school-lunch-data.json`
- Create matching set files:
  - `set-rla-check-claims-structure-v1.json`
  - `set-rla-check-finding-evidence-v1.json`
  - `set-rla-check-credibility-counterarguments-v1.json`

**Interfaces:**
- Claims set: primary `R5.1`, secondary `R5.2`, `unitId: claims-argument-structure`.
- Finding Evidence: primary `R5.3`, `unitId: finding-evidence`.
- Credibility/Counterarguments: primary `R5.9`, secondary `R5.10`, `unitId: credibility-counterarguments`.

- [ ] **Step 1: Author three original argument passages**

Target roughly 450–600 words. Use concrete claims, reasons, evidence sources, source limitations, and an opposing view where relevant.

- [ ] **Step 2: Author six questions per unit**

Claims: claim identification + argument chain/role reasoning.
Finding Evidence: exact-claim evidence match + direct-vs-related evidence.
Credibility/Counterarguments: claim-specific source fit + source limitation + fair objection + response quality.

- [ ] **Step 3: Run quality/validator GREEN**

```bash
node --test scripts/skill-check-content-quality.test.mjs
npm run content:validate
npm run content:build
```

Expected: 9 dedicated Checks / 54 Check questions; validation 0 errors / 0 warnings.

---

### Task 4: Build-isolation and Alpha 28 checkpoint

**Files:**
- Modify tests only if a stale exact-count assertion legitimately expects pre-Check counts.
- Do not change Train or Mock content selection to accommodate failures; Check role isolation should make them ignore these modules already.

- [ ] **Step 1: Verify generated curriculum attachment**

After build assert the nine intended skill/unit pages each have exactly one `checks` entry and that every Check module remains absent from `sets`.

- [ ] **Step 2: Verify role isolation**

Assert Check files are absent from adaptive Train candidate catalog and from Mock dedicated/fallback candidate pools because of role + `mock-excluded` rules.

- [ ] **Step 3: Run full checkpoint**

```bash
npm test
npm run content:validate
npm run content:build
rm -rf /mnt/data/phase4_alpha28_public_verify
npm run public:build -- --out /mnt/data/phase4_alpha28_public_verify
```

Expected: 112 generated learner modules, 807 objective questions, 152 PDFs, 9 dedicated Checks.
