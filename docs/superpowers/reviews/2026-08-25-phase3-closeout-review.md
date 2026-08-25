# Phase 3 Whole-System Closeout Review

**Date:** 2026-08-25  
**Closeout release target:** `0.7.0-alpha.26`  
**Decision:** Phase 3 is learner-complete. Move next to Phase 4A Skill Check runtime/UI/evidence.

## Executive decision

Phase 3 has reached the point where more content would mostly increase volume rather than improve the learning system. Reading and Arguments already have sufficient guided/independent/transfer structure; Language now has real difficulty calibration in its highest-leverage units; Extended Response now progresses from component recognition to focused writing production to full paired-source responses.

The closeout review found one learner-flow defect: a learner with no history was sent from Progress to Train even though Train correctly sends new learners back to Practice. That detour was fixed test-first so the empty Progress state now has one primary action: **Start Practice**.

No other blocking Phase 3 learner/content/system gap was found.

## Current learner bank

- 103 learner objective/component modules
- 753 objective/component questions
- 152 registered learner PDFs and 152 physical learner PDFs
- 10 full original Extended Response paired-source prompts
- 6 focused Extended Response Production Lab tasks
- 0 dedicated Skill Check modules (intentional until Phase 4)
- 0 dedicated Mock-only modules (intentional until Phase 5)

### Objective/component distribution by track

| Track | Modules | Questions | Difficulty | DOK | Main interactions |
| --- | ---: | ---: | --- | --- | --- |
| Reading & Comprehension | 65 | 478 | 32 Easy / 362 Medium / 84 Hard | 33 DOK1 / 332 DOK2 / 113 DOK3 | 455 MCQ, 11 classify/sort, 7 select-text, 5 evidence-based |
| Arguments & Sources | 18 | 127 | 71 Medium / 56 Hard | 71 DOK2 / 56 DOK3 | 120 MCQ, 4 classify/sort, 3 select-text |
| Language & Editing | 13 | 92 | 7 Easy / 79 Medium / 6 Hard | 7 DOK1 / 79 DOK2 / 6 DOK3 | 91 embedded grammar edits, 1 MCQ |
| Extended Response components | 7 | 56 | 44 Medium / 12 Hard | 2 DOK1 / 38 DOK2 / 16 DOK3 | 56 MCQ |

The distributions are not intended to be symmetrical. They reflect different learner jobs and item formats.

## Reading closeout

### Strong enough; stop changing for Phase 3

The active reference paths now cover Main Idea, Supporting Details, Explicit Meaning, Summary, Inference, and Conclusions & Generalizations. They use guided/application/independent progression without forcing identical mechanics across skills. The separate passage-practice bank remains the transfer/stamina layer.

Reading validation continues to enforce 400–900-word learner Passage Practice texts, resource/module integrity, answer-pattern quality, and learner-safe builds.

### Intentional future work

Reading does not need more Phase 3 modules merely to equalize skill counts. Any later gap should be evidenced by Skill Checks, Mock results, or learner testing.

## Arguments closeout

### Strong enough; stop changing for Phase 3

The track contains 18 modules / 127 questions plus 27 scoped PDFs. Three reference paths now explicitly teach:

- Claims & Argument Structure: claim → reasons → evidence → argument chain
- Finding Evidence: exact claim → direct evidence → verify the match
- Credibility & Counterarguments: claim-specific source fit/limits + objection → direct response

The remaining focused units and six mixed-source sets were audited and already provide sufficient transfer. Thin individual skill counts are not a reason to manufacture extra content.

### Intentional future work

Do not add more Arguments depth until independent evidence shows a need.

## Language closeout

### What changed in Phase 3D

Language remains 13 modules / 92 questions and keeps the existing guides, workbooks, and six 350–450-word mixed editing passages.

Three high-leverage focused units now have substantive difficulty progression rather than flat Medium labeling:

- Sentence Boundaries & Punctuation
- Agreement & Pronouns
- Parallelism & Sentence Connections

The latter two were calibrated in the Alpha 24 checkpoint. Their Hard items require multiple constraints at once rather than merely changing metadata.

Word Choice & Standard Usage, Modifiers & Sentence Logic, Concision & Transitions, and Capitalization & Possessives were audited and deliberately left unchanged because no blocking learner gap justified artificial symmetry.

### Decision

Language is sufficient for Phase 3. Future changes should be driven by independent assessment/learner evidence, not a desire to make every unit share the same Easy/Medium/Hard ratio.

## Extended Response closeout

### Recognition → production → full response now exists

The existing 56 objective ER component questions remain useful for recognizing good thesis/evidence/analysis/organization/revision choices. They are no longer the only focused practice layer.

The new **Production Lab** adds six focused writing tasks:

1. evaluative thesis
2. exact evidence
3. evidence → analysis
4. summary → analysis
5. body-paragraph development
6. revision for focus and clarity

Production Lab uses the existing ER workspace, source panels, local draft persistence, submission/revision flow, and learner-safe generated data. Criteria/model responses remain hidden until submission. It provides no AI score, GED-equivalent score, pass/fail prediction, objective mastery history, Train entry, Skill Check evidence, or Mock integration.

### Full ER source depth

The full prompt bank now contains 10 original paired-source prompts. The two new denser pairs are:

- `er-night-delivery-window` — about 618 combined source words
- `er-vacant-lot-housing` — about 598 combined source words

They deliberately have opposite authoring-side stronger-source positions. Authoring keys do not ship to learners.

### Decision

ER is sufficient for Phase 3. Phase 4 should not invent automated essay mastery weighting; Skill Check architecture remains a separate decision.

## Cross-system role review

- Guided reference modules remain `practice + train` and `mock-excluded`.
- Independent Practice remains Practice/Train where intended.
- Production Lab is a writing Practice surface only.
- Dedicated Skill Check content remains absent.
- Dedicated Mock-only content remains absent.
- Current Mock continues to disclose Practice-bank format/timing fallback rather than pretending to be an independent readiness measure.
- Resources remain support material, not duplicated interactive practice.

## Learner-flow review

Confirmed flow:

**Learn/resources → Guided/Practice → Independent/transfer → adaptive Train after enough history**

Extended Response flow:

**ER learning units → Production Lab → Full Extended Response Practice**

The closeout defect in fresh Progress was fixed: the empty state now sends learners directly to **Start Practice** rather than Start Train.

Production Lab and Full Extended Response are separately labeled on the ER domain page. Active Practice/Mock/ER workspaces continue to use focus-mode/mobile contracts already covered by regression tests.

## What was deliberately NOT added

- no extra Reading/Arguments modules for count symmetry
- no new Language PDFs or extra mixed editing passages
- no forced 2/4/2 difficulty shape across every Language unit
- no flashcards
- no Skill Checks
- no Mock-only bank
- no Practice-fallback removal in Mock
- no fake ER/AI scoring
- no Production Lab mastery weighting
- no mass PDF regeneration

These are either unnecessary for Phase 3 or belong to later phases with different evidence semantics.

## Remaining intentional gaps

### Phase 4

- real `skill_check` runtime/UI/evidence handling
- first-wave unseen independent Skill Checks for mature skills
- Train Quick Review only where retrieval practice genuinely helps
- Progress evidence hierarchy that distinguishes independent checks from guided/practice success

### Phase 5

- official-category-informed Mock blueprint mapping
- dedicated unseen coherent Mock passage bank
- natural exam-interface variety
- disable Practice fallback only when dedicated Mock content can satisfy the full blueprint

### Release gate after feature phases

- real desktop/phone/tablet testing
- keyboard/screen-reader/200% zoom checks
- browser/offline/service-worker checks
- small real-learner pilot

## Final Phase 3 verdict

**No blocking Phase 3 learner gap remains.** The current system has enough teaching depth to stop content expansion and move to independent evidence architecture.

Next stage: **Phase 4A — Skill Check runtime/UI/evidence.**
