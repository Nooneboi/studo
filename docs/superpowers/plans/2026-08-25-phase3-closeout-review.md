# Phase 3 Whole-System Closeout Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decide whether Phase 3 is learner-complete after the Language and ER checkpoints, fix only objective blocking defects discovered by the review, and produce one verified Phase 3 closeout release.

**Architecture:** Treat this as a review/release gate rather than a content-expansion phase. Analyze canonical/generated/public layers independently, preserve track-specific teaching methods, and only create a final content/code patch if a testable blocker is found. Otherwise update status/release metadata and package the verified source/public artifacts.

**Tech Stack:** Existing Node test suite, content validator/build, public build, static artifact scans.

**Spec:** `docs/superpowers/specs/2026-08-25-phase3-closeout-design.md`

## Global Constraints

- Do not add content for count symmetry.
- Do not add Skill Checks, flashcards, or Mock-only content.
- Do not bulk-rewrite Reading or Arguments after their completed audits.
- Production Lab remains Practice only.
- Any defect fixed during closeout must get a failing regression test first.
- Release only after fresh full verification.

---

### Task 1: Canonical RLA inventory and role review

**Files:**
- Read: `content-src/config/rla.curriculum.json`
- Read: `content-src/sets/*.json`
- Read: `content-src/er-tasks/*.json`
- Read: `content-src/er-prompts/*.json`
- Read: `content-src/resources/rla.resources.json`
- Modify only if a concrete defect is found.

- [ ] **Step 1: Build a machine-readable inventory**

Run a one-off Node script that reports by track:

```text
module count
question count
difficulty distribution
DOK distribution
interaction distribution
role distribution
canonical skill/family coverage
resource count
ER task/prompt count and source word counts
```

- [ ] **Step 2: Review learner-role boundaries**

Verify:

```text
Guided modules: practice/train + mock-excluded
Independent Practice: practice/train unless intentionally otherwise
Production Lab: Practice only, not Skill Check/Mock
Skill Check: still absent in Phase 3
Mock-only: still absent until Phase 5
Resources: support learning rather than duplicate interactive practice
```

- [ ] **Step 3: Review overlap/redundancy**

Specifically check Reading vs Arguments evidence skills, Language focused vs mixed editing roles, and ER focused recognition vs Production Lab vs full response. If overlap has different learner jobs, leave it. If a duplicate has no distinct learner job, report/fix only that duplicate.

---

### Task 2: Generated and public integrity review

**Files:**
- Generated: `data/generated/*`
- Public build: fresh output directory
- Test: existing release/public tests

- [ ] **Step 1: Run canonical validation/build**

```bash
npm run content:validate
npm run content:build
```

Expected: 0 errors / 0 warnings.

- [ ] **Step 2: Run full test suite**

Run: `npm test`

Expected: all tests pass sequentially.

- [ ] **Step 3: Build fresh public artifact**

Run: `npm run public:build -- --out /mnt/data/phase3_closeout_public_verify`

Verify learner-only generated files, referenced PDFs/modules, release metadata, no authoring-only directories, no demo/sample quiz leakage, and no broken local HTML/CSS/JS/data links.

---

### Task 3: Learner-flow closeout review

**Files:**
- Read: `js/domain.js`, `js/skill.js`, `js/module.js`, `js/train.js`, `js/progress.js`, `js/extended-response.js`, `js/test.js`
- Modify only with a failing regression test if a Phase 3 blocker is found.

- [ ] **Step 1: Verify the intended flow**

Trace:

```text
Learn/resource -> Guided/Practice -> Independent/transfer
Practice history -> adaptive Train after enough evidence
ER units -> Production Lab -> Full Extended Response Practice
Mock remains format/timing fallback, not readiness claim
```

- [ ] **Step 2: Check fresh-user dead ends and misleading CTAs**

Verify no page tells a fresh learner to start Train before Practice, no unfinished Check surface is exposed, and Production Lab/full ER labels are distinct.

- [ ] **Step 3: Check mobile/focus/accessibility contracts covered by automation**

Confirm focus-mode page set includes active Practice/Train/Mock/ER surfaces; keyboard-visible controls remain native/button/link/form controls; no new task UI hides review criteria before submission via CSS only without state logic.

---

### Task 4: Phase 3 closeout decision and release

**Files:**
- Modify: `STUDO_MASTER_STATUS.md`
- Modify release/version metadata
- Create: `docs/superpowers/reviews/2026-08-25-phase3-closeout-review.md`

- [ ] **Step 1: Write the closeout review**

The review must explicitly answer:

```text
What is strong enough and should stop changing?
What intentional gaps remain for Phase 4/5?
Is there any blocking Phase 3 learner gap?
What was deliberately NOT added and why?
```

If a blocking gap exists, stop before release and design that bounded fix. If none exists, declare Phase 3 complete.

- [ ] **Step 2: Update status/release metadata**

Use `0.7.0-alpha.26` as the Phase 3 closeout release if Alpha 24 and Alpha 25 checkpoints were used as designed. Record next stage as Phase 4A Skill Check runtime/UI/evidence.

- [ ] **Step 3: Run final fresh gate**

```bash
npm test
npm run content:validate
npm run content:build
rm -rf /mnt/data/phase3_closeout_public_verify
npm run public:build -- --out /mnt/data/phase3_closeout_public_verify
```

Read complete output and verify 0 test failures, 0 validation errors/warnings, and 0 public artifact contract errors before making any completion claim.

- [ ] **Step 4: Package handoff**

Create:

```text
/mnt/data/chee-skool-0.7.0-alpha.26-source.zip
/mnt/data/chee-skool-0.7.0-alpha.26-public.zip
```

Exclude `.git`, `node_modules`, temporary verification output, and other non-source caches from SOURCE. PUBLIC must come from the fresh verified public-build output.
