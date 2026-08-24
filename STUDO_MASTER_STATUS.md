# Chee Skool — Master Project Status

**Date:** 2026-08-24  
**Current release:** `0.7.0-alpha.17`  
**Current stage:** Phase 2 high-priority Reading depth — Inference complete; Conclusions / Generalizations is next  
**Public alpha gate:** `publicAlphaEnabled: false` until real-browser/device QA and a small learner pilot are signed off

This file is the current high-level source of truth for Chee Skool. Newer decisions in this file and the current canonical source override older phase reports when they conflict.

## Product goal

Chee Skool is a calm, focused GED Reasoning Through Language Arts learning and practice system. A feature or content item earns a place only when it helps a learner understand, apply, strengthen, or honestly measure an RLA skill.

Core learner flow:

**Learn → Practice → Skill Check → Train → Mock → Progress**

The modes do not need identical content or interactions. Each mode has a distinct job.

## Non-negotiable product rules

- Do not add features because other learning sites have them.
- Do not put every learning method in every skill.
- Do not bulk-convert old material merely because a new interaction exists.
- Do not make reasoning harder by making controls confusing.
- Do not copy Main Idea's exact UI pattern into every skill; transfer the learning philosophy, not the mechanics.
- Do not create fake Skill Checks or pretend ordinary Practice is independent assessment.
- Do not treat Practice-bank Mock fallback as an independent readiness measure.
- Do not reuse dedicated Skill Check questions as Mock questions.
- Do not claim Chee Skool is official GED material, uses live GED questions, predicts an official scaled score, or guarantees pass/fail outcomes.
- Do not copy copyrighted prep-book passages/questions into the learner bank.
- Do not expose unfinished or duplicate material just to make the product look larger.
- Do not hand-edit `data/generated/` as canonical content; edit `content-src/`, validate, and rebuild.

## Current content baseline

Chee Skool currently covers four RLA tracks and **62 canonical skills**:

1. Reading & Comprehension
2. Arguments & Sources
3. Language & Editing
4. Extended Response

Current generated learner bank:

- **99 learner modules**
- **729 objective/component questions**
- **152 registered learner PDFs**
- **152 physical PDFs in `assets/resources`**
- **0 unregistered/orphan learner PDFs**

The old internal `sample-quiz` remains development/demo material and is no longer part of the learner catalog.

## Reference-skill strategy

### Reference skill #1 — Main Idea

Main Idea is the first complete active-learning reference skill.

Its design principle is:

**Learn → Guided → Apply → Independent → Transfer**

The learner difficulty should rise through reasoning demand rather than gimmicky controls. Main Idea remains a reference for quality and progression, not a template that every skill must copy mechanically.

### Reference skill #2 — Supporting Details

Supporting Details is now the second complete reference skill. Existing PDFs were reused rather than replaced.

Implemented progression:

1. Learn — existing Supporting Details Study Guide.
2. Guided — direct support vs related/background evidence and exact-sentence selection.
3. Apply — strongest-vs-some support and evidence-strength comparison.
4. Independent — close evidence choices and qualified/two-part claims with no hints.
5. Transfer — existing four-context independent drill remains available after the guided path.
6. Skill Check later — still intentionally absent until the dedicated Skill Check phase.

The new 494-word original community/civics passage, **A Saturday Market Street Pilot**, is used only for the reference guided path and remains `mock-excluded`.

### Phase 2 depth skill — Explicit Meaning

Explicit Meaning now uses the existing guide and two workbooks plus a new skill-specific active-learning path. The new path does not manufacture difficulty by turning explicit-detail questions into inference questions. It increases challenge through target matching, true-but-wrong details, paraphrase precision, qualifiers/conditions, evidence distance, and explicit rule application.

Implemented progression:

1. Learn — existing Explicit Meaning Study Guide.
2. Guided — directly stated vs not stated, then exact-sentence location.
3. Apply — reject true-but-wrong details and identify a condition that changes a rule.
4. Independent — preserve meaning through paraphrase and apply an explicitly stated exception with no hints.
5. Follow-up — existing four-context drill is retained as **Explicit Meaning - Independent Practice**.
6. Passage transfer — mixed Passage Practice continues to expose Explicit Meaning in longer reading sets.

The new 489-word original workplace passage, **A New Equipment Checkout Procedure**, remains `mock-excluded`. No new PDF, flashcard deck, Skill Check, Mock item, or interaction engine was added.

### Phase 2 depth skill — Summary

Summary now reuses the existing guide and two workbooks plus a new skill-specific active-learning path. The progression teaches compression and scope directly instead of treating Summary as only another best-answer MCQ skill. Difficulty stays centered on DOK 2 summary reasoning rather than drifting into inference.

Implemented progression:

1. Learn — existing Summary Study Guide.
2. Guided — decide what is essential vs omittable, then control section scope.
3. Apply — diagnose too-narrow/added-claim summary traps and identify the developments that must survive compression.
4. Independent — choose a whole-passage summary and preserve a result + limitation relationship with no hints.
5. Follow-up — existing four-context drill is retained as **Summary - Independent Practice**.
6. Passage transfer — mixed Passage Practice continues to expose Summary inside longer reading sets.

The new 549-word original social-studies passage, **From Freight Yard to Shared Space**, remains `mock-excluded`. No new PDF, flashcard deck, Skill Check, Mock item, or interaction engine was added.

### Phase 2 depth skill — Inference

Inference now reuses the existing guide and two workbooks plus a new skill-specific active-learning path. The progression teaches learners to separate what the text states from what the clues support and from what is merely possible. Difficulty rises through evidence distance, competing interpretations, cautious wording, and unsupported-assumption traps rather than through vagueness.

Implemented progression:

1. Learn — existing Inference Study Guide.
2. Guided — classify stated information vs supported inference vs guess, then locate the strongest sentence supporting an inference.
3. Apply — choose the smallest supported conclusion and reject an attractive but unsupported motive explanation.
4. Independent — infer what a character/director likely considers possible, then identify the strongest evidence pair with no hints.
5. Follow-up — existing four-context drill is retained as **Inference - Independent Practice**.
6. Passage transfer — mixed Passage Practice continues to expose Inference inside longer informational and literary reading sets.

The new 588-word original literary passage, **The Spare Script**, remains `mock-excluded`. No new PDF, flashcard deck, Skill Check, Mock item, or interaction engine was added.

## Learning-mode ownership

Phase 0D introduced explicit canonical delivery roles:

- `practice` — guided/focused/mixed application
- `train` — adaptive/spaced retrieval and transfer review
- `skill_check` — dedicated short independent proof
- `mock` — dedicated unseen exam-simulation measurement

Current ordinary learner modules are intentionally `practice + train`.

Current dedicated banks:

- Practice: populated
- Train: populated from modules explicitly carrying `train`
- Skill Check: **0 dedicated sets by design**
- Mock-only: **0 dedicated sets by design**

### Temporary Mock behavior

The current alpha Mock first looks for dedicated `mock` content. Because a dedicated Mock bank has not been built yet, the blueprint explicitly permits a temporary Practice-bank fallback with:

`bankMode: "practice_fallback"`

Fallback attempts are for format/timing simulation and are **not an independent readiness measure**. Existing `mock-excluded` protection remains an additional exclusion during this period.

## Phase 0 — content integrity before expansion

### Phase 0A — Question-family integrity: complete

- canonical family registry is the source of truth;
- legacy family aliases preserve historical learner data where required;
- published content is validated against the canonical family system;
- `question-families.js` is regenerated from canonical config rather than treated as hand-maintained generated data.

### Phase 0B — Progress evidence integrity: complete

Learner evidence now preserves distinctions including:

- first-try correctness;
- retries;
- hint assistance;
- learning stage;
- question-level difficulty.

Guided/hinted success remains useful learning evidence but is not treated as equal to independent first-try performance.

### Phase 0C — Resource cleanup: complete

The previous 8 unregistered/duplicate PDFs were reconciled in canonical source rather than only in an exported public build.

Current result:

- 152 registered learner PDFs;
- 152 physical learner PDFs;
- no orphan/missing registered learner PDFs;
- unique Core Meaning transfer material retained/consolidated rather than duplicated.

### Phase 0D — Content-role separation: complete

- Practice uses only `practice` content.
- Train uses only `train` content.
- Skill Check uses only `skill_check` content.
- Mock prefers `mock` content and may use the explicitly enabled temporary Practice fallback during alpha.
- learner public builds copy only modules referenced by the generated learner index.
- internal/demo modules cannot silently hitch a ride in the learner artifact.

## Current learner systems

### Practice

- focused practice remains separated from mixed Passage Practice;
- learner-facing categories and domains use canonical RLA structure;
- current active-learning interactions include multiple choice, embedded/whole-revision dropdown editing, authored select-text, drag-sort, and drag-order where instructionally justified;
- Main Idea uses the Guided Learning Workspace progression;
- alternate interaction types are used only when they improve the reasoning task.

### Train

Train is for strengthening and revisiting, not for duplicating the whole curriculum. It uses explicitly Train-eligible content, learner weaknesses/mistakes, review timing, and transfer opportunities.

Selective flashcards belong here later under Quick Review only where discrete retrieval genuinely helps, such as transition meanings, tone/connotation vocabulary, commonly confused words, selected grammar/rhetorical terms, or ER planning/rubric vocabulary. Reasoning-heavy skills such as Main Idea, Supporting Details, Inference, Summary, synthesis, and full ER reasoning should not become flashcard decks.

### Progress

- objective mastery remains evidence-based;
- Guided/hinted/retry evidence is distinguishable from independent performance;
- confidence, mistakes, and review timing remain local learner signals;
- ER self-review remains separate from objective mastery;
- Mock history remains separate from ordinary skill mastery;
- learner-facing copy does not imply an official GED scaled score.

### Mock

Full RLA Mock baseline:

- Part 1: 14 questions / 27 minutes
- Extended Response: 45 minutes
- break: 10 minutes
- Part 3: 32 questions / 65 minutes
- 46 objective questions total
- Reading 25 / Arguments 10 / Language 11
- fixed refresh-safe attempt
- flags/unanswered review
- section timing and recovery
- post-completion explanations
- ER self-review kept separate
- no fake official GED scaled score

The final Mock-quality milestone is still a **dedicated unseen Mock bank**, including appropriately authentic interaction types and heavier ER source pairs. That is a later roadmap phase, not Phase 0D.

### Resources

Resources support the learning system; they are not a second curriculum.

- Study guide PDF → Learn + Resources
- Focused workbook → Practice / printable + Resources
- Mixed transfer workbook → Passage Practice / printable when unique and useful
- duplicate/obsolete workbook → archive rather than presenting multiple near-identical choices

## Source and public-build architecture

### Canonical source

`content-src/` is the learning-content source of truth.

`data/generated/` is disposable build output.

Canonical workflow:

`content-src/ → validation → content build → data/generated/ → public build`

### Public learner boundary

`npm run public:build` creates the learner-only artifact in `dist/`.

The public build contains only learner runtime HTML/CSS/JS, generated learner data, icons/branding, and registered learner resources. Internal authoring/development material remains outside the learner artifact.

Alpha 13 source/build reconciliation also restores the runtime packaging contract for files such as:

- `js/test.js`
- `js/rla-browse.js`
- generated `data/generated/question-families.js`

and prevents stale/unindexed module JSON from being copied into the public artifact.

## Current quality protections

Automated validation/regression coverage protects against problems including:

- canonical learner-content loss during rebuild;
- invalid/missing delivery roles;
- Practice/Train/Skill Check/Mock role leakage;
- internal/demo content entering the learner catalog;
- stale/unindexed modules entering the public artifact;
- missing required public runtime references;
- Passage Practice leaking into focused skill pages;
- answer/explanation mismatches;
- duplicate or invalid options;
- problematic answer-position patterns;
- excessive generic feedback;
- invalid passage lengths;
- broken resource references;
- invalid curriculum/navigation routes;
- learner-library organization regressions;
- Mock count/coverage/timing/scoring regressions;
- reappearance of resolved content-depth warning classes;
- accidental inclusion of internal authoring surfaces in public builds.

## Roadmap from here

### Phase 1 — Supporting Details reference skill: complete

Supporting Details now uses the existing strong PDF material plus a skill-specific Guided → Apply → Independent path, followed by the existing multi-context independent practice.

### Phase 2 — Complete high-priority Reading depth

Status/order:

1. Explicit Meaning — **complete in Alpha 15**
2. Summary — **complete in Alpha 16**
3. Inference — **complete in Alpha 17**
4. Conclusions / Generalizations — **next**
5. thinner P1 Reading skills such as Sequence, Compare & Contrast, and Relationships

Add more clearly social-studies/civic informational passage contexts as the bank deepens.

### Phase 3 — Deepen Arguments, Language, and Extended Response

Arguments priorities:

- Claims & Argument Structure
- Finding Evidence
- Credibility & Counterarguments

Language priority:

- real easy → medium → hard progression rather than more flat medium dropdowns.

Extended Response priority:

- production microtasks: thesis writing/revision, exact evidence selection, reasoning completion, organization, paragraph development, and revision — not only recognition MCQs.

### Phase 4 — Train Quick Review + dedicated Skill Checks

- add flashcards only for discrete knowledge where retrieval is useful;
- create short independent Skill Checks only after skills are mature;
- Skill Check items remain Mock-excluded;
- use Skill Check/Train evidence to strengthen Progress without faking mastery.

### Phase 5 — Dedicated unseen Mock bank

- Mock-only passages/questions not exposed in ordinary Practice/Train;
- authentic select-text/area, drag/drop, and embedded editing only where natural;
- heavier ER source pairs;
- independent exam-simulation evidence rather than Practice-bank reuse.

## Release gate after content work

Automated correctness is necessary but not the final public-release gate. Before enabling a public alpha:

1. test the deployed production URL end-to-end in a real desktop browser;
2. test a real phone/tablet, including touch selection and mobile navigation;
3. test refresh/back/two-tab/offline/service-worker recovery;
4. verify print/PDF behavior;
5. perform keyboard-only, 200% zoom, and basic screen-reader checks;
6. have a small number of learners use the product with minimal guidance;
7. fix high-impact learner/content/accessibility/reliability issues;
8. explicitly enable the release gate only after that review.

## Immediate next build

> **Phase 2 — Conclusions / Generalizations.**

Audit and reuse the existing Conclusions / Generalizations guide/workbooks/practice first. Add only the learning progression that this skill genuinely needs, while preserving the learning-mode separation, GED-style transfer, and learner-first interaction rules.
