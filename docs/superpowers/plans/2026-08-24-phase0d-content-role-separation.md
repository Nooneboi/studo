# Phase 0D Content Role Separation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make learner-mode eligibility explicit and prevent accidental Practice/Train/Skill Check/Mock sharing.

**Architecture:** Add `curriculum.deliveryRoles` to canonical content and propagate it into generated runtime metadata. Practice and Train consume their own roles; Skill Check remains empty until dedicated sets exist; Mock tries dedicated `mock` content first and uses a clearly marked temporary Practice fallback only because the dedicated bank is a later phase.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js content build/validation scripts, JSON canonical content, Node test runner.

**Spec:** `docs/superpowers/specs/2026-08-24-phase0d-content-role-separation-design.md`

## Global Constraints
- `content-src/` remains the source of truth.
- Never hand-maintain `data/generated/` as canonical content.
- Practice teaches; Train strengthens; Mock measures.
- Skill Check content must not later be reused in Mock.
- Current ordinary Practice content must not be relabeled as dedicated Mock content.

---

### Task 1: Canonical delivery-role schema and migration
**Files:** `schemas/studo-content-v2.schema.json`, `scripts/validate-content.mjs`, `content-src/sets/*.json`, `content-src/config/legacy-index.json`, `scripts/phase0-content-roles.test.mjs`

- [ ] Write tests requiring valid explicit delivery roles on published learner modules.
- [ ] Run tests and verify failure on missing roles.
- [ ] Add schema/validator role rules and migrate current ordinary modules to `practice + train`.
- [ ] Run targeted tests until green.

### Task 2: Build Practice and Skill Check collections independently
**Files:** `scripts/build-content.mjs`, `js/skill.js`, `scripts/phase0-content-roles.test.mjs`

- [ ] Write a failing test proving `sets` uses `practice` while `checks` uses only `skill_check`.
- [ ] Update curriculum build filtering and Interactive Practice rendering.
- [ ] Rebuild and verify no current fake Skill Checks are exposed.

### Task 3: Restrict Train to Train-role content
**Files:** `js/learning.js`, `scripts/phase0-content-roles.test.mjs`

- [ ] Write a failing behavior test with one train-eligible and one practice-only module.
- [ ] Add role filtering at the candidate boundary.
- [ ] Verify Train never selects a module lacking `train`.

### Task 4: Mock-only preference with explicit temporary fallback
**Files:** `content-src/config/rla-mock-v1.json`, `js/mock-engine.js`, `js/quiz.js`, `js/test.js`, `scripts/mock-test-quality.test.mjs`, `scripts/phase0-content-roles.test.mjs`

- [ ] Write failing tests that dedicated `mock` content wins and Practice requires an explicit fallback flag.
- [ ] Add `allowPracticeFallback: true` to the current alpha blueprint.
- [ ] Refactor generation to try `mock` role first, then Practice fallback only when permitted.
- [ ] Persist `bankMode` into attempts/history and surface a plain results note for fallback attempts.
- [ ] Verify existing blueprint counts/timing still pass.

### Task 5: Public artifact follows learner index exactly
**Files:** `scripts/build-public.mjs`, `scripts/alpha-release-hardening.test.mjs`

- [ ] Write a failing test that an unindexed generated module is not copied publicly.
- [ ] Copy only module files referenced by `data/generated/index.json`.
- [ ] Verify every local learner HTML runtime reference exists in the public artifact.

### Task 6: Full verification and release artifact
**Files:** generated outputs, release report if needed

- [ ] Run `npm test`.
- [ ] Run `npm run content:validate`.
- [ ] Run `npm run content:build`.
- [ ] Run learner-only public build and scan local references.
- [ ] Confirm 0 orphan/missing PDFs, no sample demo in index, and no missing runtime JS.
- [ ] Package the corrected source and learner build for handoff.
