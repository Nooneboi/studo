# Studo Phase 3 Closeout Design

**Date:** 2026-08-25  
**Status:** Approved in chat; written spec awaiting user review  
**Base:** Chee Skool / Studo `0.7.0-alpha.23`

## Goal

Finish Phase 3 without turning the product into a content dump. Close the remaining high-value Language difficulty gap, add genuine Extended Response production practice, add a small amount of denser full-ER source practice, and then run one whole-RLA closeout review. Stop Phase 3 when the learner system is sufficiently complete; do not deepen more skills merely for symmetry or question-count balance.

## Non-negotiable product principles

- Practice teaches. Train strengthens. Mock measures.
- One task, one obvious action, one place to look.
- Preserve good existing guides, workbooks, focused modules, mixed practice, and ER prompts.
- Difficulty must come from reasoning, not labels or confusing controls.
- Different skills may use different learning methods; do not force identical module structures.
- Do not add PDFs unless an audit identifies a missing learner job that web practice cannot fill.
- Do not add flashcards, Skill Checks, or Mock-only content during Phase 3 closeout.
- Production writing must not receive a fake AI score or GED-equivalent score.
- Canonical authoring remains in `content-src/`; generated learner files remain build output.

# Checkpoint A — Finish Language calibration

## Scope

Calibrate only the two remaining high-value focused Language units already selected by the Phase 3D review:

1. **Agreement & Pronouns**
2. **Parallelism & Sentence Connections**

Keep their existing Study Guides, Workbook 1, Workbook 2, and focused eight-question modules. Keep all mixed editing passages unchanged.

## Agreement & Pronouns target

Turn the current flat focused set into a genuine progression:

- **2 Easy / DOK1** — direct subject-verb agreement and clear singular/plural pronoun matching;
- **4 Medium / DOK2** — agreement attractors, compound subjects, antecedent distance, and reference clarity in context;
- **2 Hard / DOK3** — dense sentences requiring more than one constraint to be held at once, such as agreement plus pronoun reference/scope, with close distractors that are grammatically plausible in isolation but wrong in the sentence.

Hard items must be substantively rewritten where needed. Merely changing metadata is prohibited.

## Parallelism & Sentence Connections target

Turn the current focused set into a genuine progression:

- **2 Easy / DOK1** — direct parallel form and straightforward logical connector choice;
- **4 Medium / DOK2** — parallel clauses/series plus contrast, cause, addition, or subordination in context;
- **2 Hard / DOK3** — combine structural parallelism with the intended logical relationship, so the learner must preserve both grammar and meaning.

Hard items must be substantively rewritten where needed. Merely changing metadata is prohibited.

## Remaining Language units

Audit but do not automatically rewrite:

- Word Choice & Standard Usage
- Modifiers & Sentence Logic
- Concision & Transitions
- Capitalization & Possessives

If the whole-Language review finds a genuine blocking learner gap in one of these four, stop and report it rather than silently widening the batch. Do not force every Language unit into the same difficulty distribution.

## Language success criteria

- Existing 7-unit / 13-skill learner structure remains intact.
- Existing six mixed editing passages remain in their intended 350–450-word range.
- No new Language modules or PDFs are added.
- Language validator reports 0 errors and 0 warnings.
- New regression tests prove the two calibrated modules contain real difficulty progression and substantively harder final items.
- Whole-Language review concludes either “sufficient for Phase 3” or names a concrete blocking gap.

# Checkpoint B — Extended Response production depth

## Problem being solved

The current ER system already has strong full-response architecture and eight paired-source prompts, but focused ER component practice is overwhelmingly selected-response recognition. Learners need to produce the actual building blocks of a response before full timed writing.

## Architecture decision

Do **not** add free-response questions to the normal quiz/module engine.

Extend the existing Extended Response workspace with a focused **Production Lab** mode so writing remains in the writing environment. Reuse the existing source-panel, local-save, focus-mode, and safe-storage patterns.

### Canonical data

Add a dedicated canonical source directory:

`content-src/er-tasks/`

Each published production task contains at least:

- stable `id`;
- learner-facing `title`;
- `promptId` referencing an existing full ER prompt;
- one or more canonical `W1.*` skill IDs;
- controlled `taskType`;
- learner instruction;
- optional task-specific source focus/context;
- success criteria shown only after submission;
- one concise model response/example;
- one or more revision prompts;
- reviewer/status metadata.

Authoring-only notes must not ship to the learner build.

### Generated learner data

The content build writes a learner-safe:

`data/generated/er-production-tasks.json`

The generated curriculum exposes learner-safe Production Lab card metadata. `build-public` includes the generated file but not canonical task sources.

### Workspace routing

Reuse:

`extended-response.html`

Full ER remains:

`extended-response.html?prompt=<promptId>&mode=untimed|timed`

Production Lab uses:

`extended-response.html?task=<taskId>`

Task mode is untimed and has no Mock attempt integration.

### Production Lab learner flow

1. Open a focused Production Lab task.
2. Read Source A / Source B in the existing source panel.
3. Read one specific writing instruction.
4. Write the requested response in one focused text area.
5. Submit for review.
6. Only after submission, reveal:
   - 3–5 concrete self-check criteria;
   - one concise model/example;
   - one or more revision prompts.
7. Learner may revise and mark the task complete.

No automatic score, percentage, trait level, pass/fail prediction, or AI rewrite is shown.

### Storage and progress semantics

- Save Production Lab drafts locally with a task-specific safe-storage key.
- Production Lab completion is **Practice**, not independent mastery evidence.
- Do not mix Production Lab completion into Skill Check evidence or Mock evidence.
- Do not add Production Lab to adaptive Train during Phase 3.
- Progress may show full ER history as it does now; Production Lab mastery/progress weighting is deferred to Phase 4 rather than inventing a new evidence hierarchy during this batch.

## Initial Production Lab task set

Create six original focused production tasks using existing paired-source prompts where possible:

1. **Evaluative thesis** — `W1.4`
   - write or revise one thesis naming the better-supported argument and bounded reasons.
2. **Exact evidence** — `W1.5`
   - select/use specific source evidence and preserve source qualifiers.
3. **Evidence → analysis** — `W1.6`, optionally `W1.7`
   - write the sentence that explains why a quoted/paraphrased fact matters.
4. **Summary → analysis** — `W1.6`
   - revise a summary-only sentence/mini-paragraph into source-based analysis.
5. **Body-paragraph development** — `W1.8`, `W1.9`
   - produce a compact Point → Evidence → Analysis → Comparison paragraph or paragraph plan.
6. **Revision for focus and clarity** — `W1.10`, `W1.11`
   - revise a weak passage for organization, precision, and conventions without changing the source-based claim.

The tasks should be short enough to practice deliberately; they are not mini full essays.

## Denser full ER source practice

Keep the existing eight full ER prompts unchanged unless QA finds a defect.

Add **two** new original paired-source full ER prompts with:

- combined source-text target around **550–650 words**;
- two genuinely defensible positions;
- neither side written as an obvious straw man;
- a real difference in evidence quality, reasoning, assumptions, or source fit;
- one documented stronger source for authoring/QA only;
- full model response, annotations, and revision prompts matching the existing ER prompt contract;
- varied stronger-source position so the bank does not create an A/B pattern.

These prompts remain full Practice prompts. They are not `mock-only` content.

## ER navigation

On the Extended Response domain page:

1. Keep the six existing ER learning units/resources.
2. Add one clearly labeled **Production Lab** section for the six focused writing tasks.
3. Keep **Full Extended Response Practice** as a separate section with untimed/timed actions.

The learner should understand the difference without explanation-heavy UI:

- **Production Lab** = practice one part of the response.
- **Full Extended Response** = write the complete response.

Do not place the Production Lab in Resources, Train, or Mock.

## ER error handling

- Missing/invalid task data shows a plain recovery message and link back to Extended Response practice.
- Missing referenced prompt fails validation before publication.
- Corrupt local draft state falls back to a clean task state rather than blocking the page.
- Submission with an empty response keeps focus on the writing field and does not reveal the model.
- Full timed ER behavior remains unchanged.

## ER success criteria

- Six published Production Lab tasks exist and validate.
- Two denser full ER prompts exist and validate.
- Existing eight prompts remain usable.
- Production Lab reveals criteria/model only after submission.
- Production Lab provides revision without automatic scoring.
- Task drafts persist locally.
- Full timed and untimed ER modes remain regression-green.
- Production tasks do not enter Train, Skill Check, or Mock.
- Public build contains only learner-safe ER task data.

# Phase 3 whole-system closeout review

After Checkpoint A and Checkpoint B are green, audit the entire RLA system before declaring Phase 3 complete.

## Review dimensions

### Reading
- guided vs independent progression;
- passage practice depth and transfer;
- duplicate/redundant content;
- interaction usefulness.

### Arguments
- three reference paths;
- six remaining focused units;
- six mixed-source sets;
- coverage, family balance, DOK, and overlap.

### Language
- calibrated difficulty progression;
- editing authenticity;
- focused vs mixed-passage roles;
- whether any of the four audited non-priority units has a real blocking gap.

### Extended Response
- recognition → production → full-response progression;
- source-pair depth;
- full timed/untimed workspace behavior;
- no fake scoring.

### Cross-system
- curriculum/source-of-truth integrity;
- roles (`practice`, `train`, `mock-excluded`) where applicable;
- question-family coverage and singleton warnings;
- difficulty/DOK distributions;
- Resources vs Practice separation;
- learner navigation and focus mode;
- generated/public artifact integrity;
- no demo/source/authoring leakage.

## Closeout rule

If the review finds no blocking learner/content/system gap, mark **Phase 3 complete** and move to Phase 4.

If it finds a genuine gap that requires new scope or architecture, stop and present the evidence before implementing it. Do not silently create more Phase 3 content.

# Testing strategy

Use test-driven development for all production changes.

## Checkpoint A tests

Add a Language Phase 3D calibration regression test that proves:

- Agreement & Pronouns has the approved difficulty/DOK progression;
- Parallelism & Sentence Connections has the approved difficulty/DOK progression;
- final hard items contain genuinely higher reasoning/distractor demand;
- no Language module/PDF count expansion occurred;
- mixed editing passage constraints remain intact.

## Checkpoint B tests

Add an ER Production Lab regression test that proves:

- canonical tasks validate and reference existing prompts/skills;
- generated task data is learner-safe;
- the ER domain exposes Production Lab separately from full ER prompts;
- task mode saves drafts and gates model/criteria until submission;
- no automated score language is introduced;
- full timed/untimed ER paths still satisfy existing tests;
- two new full prompts meet the intended source-length and authoring requirements;
- Production Lab content is absent from Mock/Train banks.

## Final verification gate

Before packaging the final Phase 3 handoff, run fresh:

- `npm test`
- `npm run content:validate`
- `npm run content:build`
- `npm run public:build -- --out <fresh-public-dir>`
- source/generated/public count checks
- broken local-reference scan
- internal-source/authoring leakage scan
- release/version consistency checks
- direct Phase 3 closeout contract test

Package only after all are green.

# Release sequencing

Use two internal checkpoints during the batch:

- **Alpha 24 checkpoint:** Language calibration complete and whole-Language review green.
- **Alpha 25 final Phase 3 handoff:** ER Production Lab + two denser ER prompts + whole Phase 3 closeout review green.

The user-facing handoff may package the final Alpha 25 source/public snapshots after the full closeout gate. An Alpha 24 artifact is optional unless needed for debugging/recovery.

# Explicitly out of scope

- Phase 4 Skill Check runtime/content;
- Train Quick Review/flashcards;
- Progress mastery weighting changes for Production Lab;
- dedicated unseen Mock bank;
- disabling Practice fallback in Mock;
- AI essay grading or rewriting;
- official GED score conversion/pass prediction;
- rewriting already-good Reading/Arguments content without closeout evidence;
- mass regeneration of existing PDFs.
