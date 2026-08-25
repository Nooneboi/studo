# Pre-Pilot Hardening Design

**Date:** 2026-08-25  
**Baseline:** Chee Skool `0.7.0-alpha.32` as supplied in `studo(5).rar`  
**Status:** Approved by user for one-pass implementation

## Goal

Harden the existing alpha without adding a new learner mode. Preserve the core learner sequence:

> Learn → Practice → Train → Skill Check → Mock → Progress

The pass fixes source/package hygiene, evidence semantics, fixed-form answer-position quality, and thin Practice/Train transfer coverage before a small learner pilot.

## Scope

### 1. Source/package cleanup
- Remove the eight PDF files physically present in `assets/resources/` but not registered as learner resources.
- Remove all `.bak` / `.bak4e` source artifacts.
- Do not register duplicate/retired files simply to make counts pass.

### 2. Evidence isolation
- Practice/Train skill signals and the Progress `Answered`, `Accuracy`, and skill percentages use only learning-evidence attempts from `practice` and `train`.
- Skill Check attempts remain stored and continue to have their own Skill Check history/results.
- Skill Check may still reveal a review need; this change is about mastery/signal arithmetic, not suppressing useful review follow-up.
- Mock remains separate from both systems.

### 3. Fixed-form Mock answer-position quality
- Keep all 21 Mock modules, 138 objective questions, passages, correct answers, reporting categories, item types, DOK, and ER prompts unchanged in substance.
- Reorder selected-response options only where needed so each complete form has balanced displayed answer positions and the three form-level position sequences are not suspiciously similar.
- Add form-level validation for answer-position dominance, long same-position runs, and pairwise sequence similarity across fixed forms.
- These are Chee Skool QA heuristics, not claims about an official GED psychometric blueprint.

### 4. Role-specific Practice/Train depth
- Add automated QA that counts question coverage by `deliveryRoles` rather than treating Mock/Skill Check questions as interchangeable with learning-bank depth.
- Deepen only selected thin Practice/Train skills identified in the review:
  - `R5.4` Evidence relevance
  - `R5.8` Assumptions & premises
  - `L1.2` Basic subject–verb agreement
  - `L1.3` Pronoun agreement, reference & case
  - `L1.7` Complex agreement
- New questions must be original Chee Skool content, use existing interaction engines, and be available only to `practice`/`train`.
- No new PDF is required.

### 5. Documentation/release hygiene
- Remove stale master-status statements that describe Practice fallback or the dedicated Mock bank as future behavior.
- Record the evidence-isolation and role-specific coverage rules.
- Bump learner/cache metadata to `0.7.0-alpha.33` so the hardened build cannot be confused with alpha.32.

## Non-goals

- No new learner mode.
- No official GED scaled-score or pass prediction.
- No automatic ER grading.
- No random full-Mock assembly.
- No new PDFs.
- No Mock highlight/scratch-pad feature in this pre-pilot pass; that remains a later exam-interface-familiarity candidate.
- No broad content expansion outside the selected thin skills.

## Success criteria

The pass is complete when:
1. source/resource hardening tests report no orphan PDFs or backup artifacts;
2. Skill Check attempts cannot change Practice/Train skill percentages or practice accuracy/answered counts;
3. three fixed Mock forms keep all Phase 5 structural contracts and pass new form-level answer-position QA;
4. selected Practice/Train skills meet the new role-specific minimum coverage contract with original transfer questions;
5. `npm test`, `npm run content:validate`, `npm run content:build`, and a fresh learner-only `public:build` all pass;
6. public output contains no authoring/backups/orphan resources and release/cache metadata are synchronized at `0.7.0-alpha.33`.
