# Studo RLA Mock/Test V1 Design

**Status:** Approved design, implementation pending
**Date:** 2026-08-22

## Goal

Replace Studo's legacy "load every matching question into one test" Quiz system with a realistic, blueprint-driven GED-style RLA mock experience that uses the existing Reading, Arguments, Language, and Extended Response content without pretending to reproduce secure live GED questions or official psychometric scoring.

## Product promise

Studo Mock/Test V1 is a **GED-style simulation**, not an official GED test and not an exact clone of a live form.

The public GED format currently establishes the core constraints we will model:

- 150 minutes total for RLA.
- Three parts/sections.
- One 45-minute Extended Response.
- A 10-minute break between Parts 2 and 3.
- About 46 objective questions plus one essay is a current public GED approximation, not a fixed guaranteed form length.
- Passage sets use source-based questions; reading passages are generally 400-900 words, with about 75% informational and 25% literary text.
- The test includes multiple-choice and technology-enhanced item types such as drop-down, drag-and-drop, and select-an-area.

Studo will state clearly that its question count and blueprint are designed to approximate the public format and coverage rather than claim exact live-test composition.

## V1 exam blueprint

### Total structure

Studo Full RLA Mock V1 contains:

1. **Part 1 — Objective RLA**
   - 27-minute working section.
   - 14 objective questions.
   - Mix of Reading, Arguments, and Language.
   - Whole source sets are selected together where applicable.

2. **Part 2 — Extended Response**
   - 45 minutes.
   - One of the eight canonical Studo paired-source ER prompts.
   - Uses the existing Extended Response workspace and rubric self-review model.
   - No automatic essay score.

3. **Break**
   - 10-minute break screen.
   - Learner can continue early, but the UI explains the intended exam-simulation break.

4. **Part 3 — Objective RLA**
   - 65-minute working section.
   - 32 objective questions.
   - Mix of Reading, Arguments, and Language.

5. **Instructions/final review allowance**
   - The product labels the full experience as approximately 150 minutes, reflecting the public GED total including instructions/final review.

### Objective-question target

- **46 objective questions total**: 14 in Part 1 + 32 in Part 3.
- This is a Studo blueprint based on current public GED guidance that test takers answer "about 46 questions"; it is not represented as a fixed official count for every live form.

## Content-selection rules

### Source-set integrity

- Passage/source sets are atomic selection units wherever practical.
- A mock must never take Question 2 from one passage while silently dropping the rest solely to hit a count, unless the source module is explicitly authored as a standalone/partial-compatible set.
- No passage/source set may repeat within the same attempt.
- No question ID may repeat within the same attempt.

### Coverage mix

Across the 46 objective questions, the blueprint targets:

- Reading for Meaning: approximately 55-60%.
- Identifying/Analyzing Arguments: approximately 20-25%.
- Grammar and Language: approximately 20-25%.

Exact counts can vary slightly when preserving whole source sets, but every generated mock must include all three areas.

### Reading stimulus balance

For Reading source sets selected into a full mock:

- Target approximately 75% informational and 25% literary stimulus sets.
- Informational contexts should span science, social studies/civics/community, and workplace where available.
- Include at least one stamina-length Reading passage of 600+ words when a valid set is available.

### Language/editing

- Prefer mixed editing passage modules over isolated sentence drills in the full mock.
- V1 supports existing `grammar_edit`/dropdown-style interactions where authored.
- The full mock should not be dominated by focused beginner drills.

### Arguments

- Prefer mixed-source Arguments sets over isolated focused drills in the full mock.
- Include paired-source or text+data/different-format reasoning when available.

### Extended Response

- Select one of the eight published canonical ER prompts.
- Do not expose authoring keys before submission.
- Do not send self-review trait scores into objective mastery.

## Attempt generation

### New attempt

When a learner starts a new full mock:

- Generate a valid blueprint once.
- Store the exact selected module/question IDs, section assignment, ER prompt ID, and order in local storage.
- Store a unique attempt ID and creation timestamp.
- The selected test remains fixed for the life of that attempt.

### Deterministic recovery

Refreshing or reopening an in-progress mock must restore:

- the same attempt ID;
- the same selected questions;
- the same section/order;
- answers and review flags;
- current location;
- remaining section time;
- ER draft through the existing ER persistence model;
- submission state.

A refresh must never silently generate a different test.

### Retake behavior

- "New mock" creates a new attempt with a new valid randomized blueprint.
- Completed attempts remain in history.
- When bank size permits, generation should reduce immediate reuse from the learner's most recent mock, but this is a preference rather than a hard V1 guarantee.

## Timing

### Section timing

- Part 1: 27:00.
- Part 2 ER: 45:00.
- Break: 10:00.
- Part 3: 65:00.

### Expiration

- When an objective section timer reaches zero, that section becomes read-only and advances to the appropriate next stage.
- Learners cannot move backward into an expired objective section to change answers.
- ER follows the existing timed-mode expiration/revision behavior, with post-submission revision clearly separated from the simulated exam attempt.

### Pause policy

- Full Mock exam mode has no arbitrary pause button during active timed sections.
- Browser refresh/reopen recovers elapsed time from timestamps rather than stopping the clock.
- Practice/untimed modes remain available elsewhere in Studo; Full Mock is intentionally strict.

## Test workspace UX

### Quiz landing page

Replace the current legacy category cards with:

1. **Full RLA Mock** — approximately 150 minutes, three parts, 46 objective questions + ER.
2. **Objective RLA Practice Test** — a shorter blueprint-driven test without ER, intended for focused exam practice.
3. **Section Practice** links for Reading, Arguments, and Language may remain only if they use bounded blueprint selection rather than every question in the bank.

The page must never advertise a 683-question "Full RLA Test."

### Objective section workspace

Retain the current focused split-pane test UI where useful, but add:

- section label (Part 1 / Part 3);
- question number and total within the current objective part;
- persistent countdown;
- **Flag for review** control;
- previous/next navigation within the active part;
- question navigator/review panel showing answered, unanswered, and flagged status;
- explicit section review screen before submitting the part;
- no answer explanations before the full mock is completed.

### Break screen

After ER submission:

- show a dedicated 10-minute break screen;
- show countdown;
- allow "Continue to Part 3 now" with a confirmation;
- explain that continuing early shortens only the break, not Part 3.

### Final review/results

After Part 3 submission:

- lock objective answers;
- score objective questions;
- show overall raw objective accuracy;
- show breakdown by Reading, Arguments, and Language;
- show skill/domain weaknesses where metadata supports it;
- show unanswered count and time used per part;
- show ER as a separate self-review component;
- do not convert the result into a fake GED 100-200 scaled score.

## Scoring

### Objective score

For auto-gradable items:

- Correct / attempted / total.
- Percentage accuracy.
- Domain breakdown.
- Skill-family breakdown where reliable.

Written/self-review ER data is excluded from the objective numerator and denominator.

### ER score

Display separately:

- Trait 1 self-review: 0-2.
- Trait 2 self-review: 0-2.
- Trait 3 self-review: 0-2.
- Clearly label as **Self-review**, not official or machine-scored.

### No scaled GED score

V1 must not display:

- GED scaled score estimates (100-200);
- "Pass/Fail" claims based on an invented score mapping;
- "College Ready" labels based on Studo raw percentages.

A later validated calibration project would be required before any such feature.

## Results and Progress integration

Completed mocks store a separate `rlaMockAttempts` history structure containing:

- attempt ID;
- blueprint version;
- started/completed timestamps;
- selected content IDs;
- objective responses and raw scoring summary;
- domain breakdown;
- section timing;
- unanswered/flagged counts;
- ER prompt ID and link/reference to ER self-review history.

Mock results may inform recommendations, but the product must preserve the difference between objective answer evidence and ER self-review.

## Data architecture

### Canonical blueprint

Create a source-controlled Mock V1 blueprint configuration under `content-src/` or a dedicated source config consumed by the build/runtime. It defines:

- version: `rla-mock-v1`;
- section timing;
- target question counts;
- domain/category targets;
- source-set requirements;
- stimulus-balance preferences;
- allowed module/content kinds.

### Runtime generation

Runtime selection uses only published canonical/generated learner content. It must not depend on hidden authoring keys.

Pure selection/scoring helpers should live in a separate testable module rather than be embedded entirely inside page DOM code.

## Technology-enhanced items

V1 requirement:

- Existing multiple-choice and `grammar_edit`/dropdown interactions must work in mocks.
- Architecture should permit future drag-and-drop/select-area items.
- Do not invent low-value drag-and-drop merely to increase visual similarity to GED.

V1 can ship without newly authored drag/select-area content if the existing bank does not have defensible items of those types.

## Validation and regression requirements

The release gate must prove:

1. Full mock contains exactly 46 objective questions + 1 ER prompt.
2. Part 1 contains 14 objective questions; Part 3 contains 32.
3. All three objective domains appear.
4. No duplicate question IDs.
5. No duplicate source-set/module IDs unless explicitly allowed.
6. Reading stimulus balance remains within an acceptable tolerance around 75/25 informational/literary when selected Reading sets permit it.
7. At least one 600+ word Reading passage appears when available.
8. One published ER prompt is selected and hidden keys are absent from learner payload.
9. Refresh recovery restores the exact attempt rather than regenerating it.
10. Section timers use timestamp-based recovery.
11. Flag/review state persists.
12. Explanations remain hidden until final completion.
13. Objective scoring excludes ER self-review.
14. No fake scaled score or pass/fail language exists in the mock results UI.
15. Legacy "every question" test behavior is removed.
16. Whole-site navigation still passes existing Foundation, Reading, Arguments, Language, ER, and Navigation tests.

## Content changes

Mock/Test V1 is primarily an **engine and selection phase**.

- Do not rewrite the current Reading/Arguments/Language/ER banks as part of this work unless a mock-selection blocker exposes an objective defect.
- Do not create dozens of filler questions just to satisfy blueprint counts.
- If the current bank cannot support a defensible full mock, stop and report the exact coverage gap rather than weakening the blueprint.

## Release criteria

Mock/Test V1 is ready for learner review only when:

- destructive clean rebuild passes;
- all legacy and new automated tests pass;
- full mock blueprint tests pass repeatedly across many generated seeds;
- JS syntax checks pass;
- local HTTP smoke tests pass;
- an end-to-end simulated attempt can move Part 1 -> ER -> break -> Part 3 -> final results;
- refresh recovery is tested at each stage;
- the legacy 12+ hour Full RLA behavior is no longer reachable from learner navigation.
