# Chee Skool — RLA Interaction Engines V1 Report

**Release:** `0.7.0-alpha.6`  
**Date:** 2026-08-23  
**Status:** Code/content candidate verified; real-device interaction QA still required before the new active-learning set can enter randomized Mock forms.

## Purpose

This pass adds interaction types only where they improve RLA learning or reproduce a real test behavior. The goal is not to make Chee Skool look more interactive. The goal is to move learners from supported understanding to independent reasoning without abrupt difficulty jumps.

## Research principles used

- GED public RLA materials describe multiple-choice, dropdown, drag-and-drop, select-area, and Extended Response interaction families.
- GED educator guidance describes RLA dropdowns as editing choices embedded within text.
- IES adolescent-literacy guidance supports explicit comprehension-strategy instruction that moves from explanation/modeling to guided practice and then independent practice.
- IES guidance on gist/main-idea work emphasizes separating important information from irrelevant information and integrating key ideas.
- Khan Academy's central-idea materials emphasize summarizing in the learner's own words and rejecting choices that are too narrow, too broad/unsupported, contradictory, or outside the text.
- Accessibility design follows the WCAG 2.2 principle that dragging must not be the only way to complete a task.

Reference pages used during this pass:
- https://www.ged.com/en/curriculum.html
- https://www.ged.com/content/dam/websites/ged/resources/assessment-guide-for-educators-all-subjects.pdf
- https://ies.ed.gov/ncee/wwc/docs/practiceguide/adlit_pg_082608.pdf
- https://ies.ed.gov/ncee/WWC/Docs/PracticeGuide/WWC-SummaryReadingInterven4-9.pdf
- https://www.khanacademy.org/test-prep/sat-reading-and-writing/x0d47bcec73eb6c4b%3Aadvanced-information-and-ideas/x0d47bcec73eb6c4b%3Acentral-ideas-and-details-3/a/central-ideas-and-details-lesson
- https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/

## Interaction architecture

A shared runtime, `js/question-interactions.js`, now defines canonical string answers, completeness, correctness, answer formatting, sort/order parsing, and authored text-target segmentation. Practice and Mock use the same answer contract while retaining separate learner behavior:

- **Practice:** learner manipulates an answer, then explicitly chooses **Check answer** before correctness/explanation is shown.
- **Mock:** changes save immediately for recovery, but correctness and explanations stay hidden until the section/test is finished.

Existing storage, Progress, Train, and Mock attempt formats remain string-based and compatible.

## Grammar editing: two deliberate modes

Existing high-quality editing questions were not rewritten merely to force a single visual format.

1. **Whole-revision dropdown** — used when the learner must choose the best complete sentence/phrase revision, including concision, parallelism, modifier placement, and similar whole-sentence decisions.
2. **Inline dropdown** — used when a local edit naturally belongs inside a sentence, such as agreement, punctuation, transitions, or word choice.

V1 intentionally rejects more than one `{{blank}}` in a grammar question until multi-blank editing has its own design and QA.

## Select text / area

`select_text` uses explicitly authored sentence, phrase, or paragraph targets. Chee Skool never guesses sentence boundaries at runtime. This supports evidence identification, tone/purpose language, and other passage-based reasoning while keeping content reviewable.

## Drag sort

`drag_sort` supports 2–8 authored cards and 2–4 zones. Every draggable card also has explicit destination buttons, so dragging is optional rather than required.

## Drag order

`drag_order` supports 3–8 authored items. Every row has Up/Down controls as a non-drag alternative. The validator now rejects items that are authored in the already-correct order; an ordering task must require an actual decision.

No drag-order question was added to Main Idea simply to demonstrate the engine. Ordering is available for future skills where sequence/structure genuinely calls for it.

## Main Idea reference learning path

A new original 483-word informational passage, **A Shadier Route to Transit**, supports a six-question reference path under Main Idea / Central Idea only.

The sequence is deliberately authored and preserved:

1. **Easy / DOK 1 — Drag sort:** distinguish information that helps explain the whole passage from contextual details.
2. **Easy / DOK 1 — Select text:** identify the sentence that states what the first measurements taught planners.
3. **Medium / DOK 2 — Multiple choice:** identify the central idea across the study and pilot.
4. **Medium / DOK 2 — Drag sort:** classify candidate central ideas as too narrow, too broad/unsupported, or well scoped.
5. **Hard / DOK 3 — Select text:** choose among several relevant sentences for the one that best supports a qualified whole-passage idea.
6. **Hard / DOK 3 — Multiple choice:** preserve both the main conclusion and its conditions/limitations among close distractors.

The progression raises difficulty through reasoning depth, evidence distance, and distractor similarity rather than through confusing controls.

The set is tagged:

- `active-learning`
- `mock-excluded`

It appears only under **Main Idea / Central Idea**. Supporting-detail reasoning is used as a means to understand the main idea, but the module is not indexed under Supporting Details.

## Mock compatibility without premature exposure

Mock can now render and recover:

- multiple choice / evidence-based
- both grammar dropdown modes
- select text
- drag sort
- drag order

Section review counts only **complete** responses. Results format the learner and correct answer through the shared interaction model. No correctness feedback is shown during the timed objective sections.

The first active-learning Main Idea set remains excluded from randomized Mock generation until deployed browser/device QA is complete.

## Deployment fixes

The learner-only builder now ships:

- `test.html` (the actual Mock workspace; this was missing from the previous public-builder list)
- `js/question-interactions.js`

The service-worker shell also includes the shared interaction runtime.

Internal authoring pages remain excluded from the public artifact.

## Verification on the final tree

Fresh verification for `0.7.0-alpha.6`:

- **101 automated tests passed / 0 failed**
- **Content validation: 0 errors / 0 warnings**
- **96 generated learner modules**
- **708 generated objective/component questions**
- **41 first-party source JS/MJS files syntax-checked**
- **21 public runtime JS files syntax-checked**
- learner-only public build completed successfully
- `dist/test.html` present
- `dist/js/question-interactions.js` present
- shared interaction runtime loaded by both Practice and Mock
- internal authoring pages absent from public build
- Main Idea reference set retained `mock-excluded`
- Main Idea authored order verified as `easy → easy → medium → medium → hard → hard`

## Still requires real-device QA

Do not remove `mock-excluded` yet. Test the deployed build for:

- mouse drag and drop
- touch drag behavior on a phone/tablet
- destination-button sort alternative
- keyboard Up/Down order alternative
- select-text target behavior on narrow mobile layouts
- refresh before Practice submission and after Practice submission
- Mock refresh/recovery with partial sort assignments
- inline grammar dropdown at 200% zoom and narrow widths
- native browser focus behavior and screen-reader announcements
- Light/dark theme states

Only after those behaviors are observed on real browsers should new interaction-rich items be allowed into randomized Mock forms.
