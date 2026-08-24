# Chee Skool Guided Learning Workspace V2 — Design

## Purpose

Chee Skool already has useful RLA interaction engines, but the first Main Idea active-learning path exposed a learner-experience problem: the interface asks learners to process too many controls, labels, statements, and instructions at once. The result is extraneous difficulty caused by the UI rather than by the reading skill.

V2 keeps the existing question models and scoring/storage architecture, but replaces the learner-facing Practice renderer for guided activities with a calmer workspace built around one rule:

> **One task. One obvious action. One place to look.**

The first production target is **Reading → Core Meaning → Main Idea / Central Idea → Main Idea – Active Learning Path**. The renderer must then be reusable for later guided-learning sets without forcing every skill into the same interaction type.

## Product goals

The Practice experience should make a learner feel:

- I immediately know what I am supposed to do.
- I can focus on the passage, not on learning the interface.
- The difficulty rises because the reasoning becomes deeper, not because controls become harder to understand.
- I always know whether I am in a guided, apply, or independent stage.
- I can recover from mistakes without being overloaded with explanations.
- I can use the activity with mouse, touch, or keyboard.

The design must remain appropriate for adult GED learners: calm, academic, modern, and supportive without looking childish or game-heavy.

## Research-derived principles

The design follows these evidence-backed patterns already reviewed for Chee Skool:

1. **Segment complex tasks into learner-paced steps.** Guided learning should present one cognitive decision at a time rather than several parallel micro-tasks.
2. **Reduce extraneous processing.** Remove redundant instructions, repeated labels, and controls that do not help the current decision.
3. **Keep related information together.** Category explanations belong on the category control; selection instructions belong near the passage selection state.
4. **Use progressive disclosure.** Hints, confidence, explanations, and mistake reflection appear only when they become relevant.
5. **Preserve a stable shell.** Interaction type may change, but the learner should not have to relearn the page layout from question to question.
6. **Do not use novelty as pedagogy.** Matching, sorting, selecting, dropdowns, ordering, and MCQ are used only where the learning objective benefits from them.
7. **Provide non-drag alternatives.** Dragging is optional; tap/click/keyboard controls complete the same task.
8. **Keep learning mode distinct from exam mode.** Practice may scaffold; Mock stays neutral, timed, and exam-like.

## Scope

### In scope

- New guided Practice workspace for interaction-rich learning sets.
- Main Idea active-learning path redesign.
- Single-card classification flow for `drag_sort` in guided Practice.
- Clear passage selection mode for `select_text`.
- Cleaner MCQ presentation inside guided Practice.
- Progressive disclosure of hints, confidence, explanations, and mistake reflection.
- Guided → Apply → Independent stage metadata and presentation.
- Responsive desktop and mobile behavior.
- Accessibility and keyboard behavior.
- Persistence of unfinished interaction drafts and submitted answers.
- Regression tests for the new renderer and the Main Idea reference set.

### Not in scope

- Redesigning Mock/Test V1.
- Adding new question types beyond those already supported.
- Rewriting every RLA title into active-learning format.
- Adding XP, streak pressure, animations, mascots, confetti, or other gamification.
- Adding analytics or a backend.
- Turning the passage into a chunk-locked Guided Reading mode. That may be evaluated later as an optional mode.
- Mass-converting existing strong MCQ content merely to increase interaction variety.

## Existing architecture to preserve

The project remains static HTML/CSS/JavaScript.

- `module.html` + `js/module.js` render untimed Practice.
- `js/question-interactions.js` provides canonical answer handling for dropdown, select-text, drag-sort, and drag-order.
- `js/storage.js` persists answers, drafts, notes, and highlights locally.
- `js/learning.js` records objective attempts and review signals.
- `test.html` + `js/test.js` remain the separate Mock workspace.
- Content continues to be authored under `content-src`, validated, then compiled.

The interaction engines from V1 stay intact unless a renderer-specific bug is found. V2 is primarily a **presentation and learning-flow redesign**, not a replacement of the answer model.

## Guided-set activation

The new workspace applies only when the module is explicitly authored as active/guided learning.

A module qualifies when its tags include:

- `active-learning`

Normal practice modules continue using the existing compact Practice renderer. This avoids forcing every existing module into a new visual system and lets Chee Skool expand the guided model deliberately title by title.

## Learning-stage metadata

Each guided question may include:

```json
{
  "learningStage": "guided",
  "hint": "Look for information that affected the city's decision."
}
```

Allowed stages:

- `guided`
- `apply`
- `independent`

Rules:

- `guided` may expose an optional learner-requested hint before submission.
- `apply` may expose one concise hint when authored, but no step-by-step answer reveal.
- `independent` shows no pre-answer hint.
- Difficulty labels such as Easy/Medium/Hard may exist in metadata, but the primary learner-facing stage label is Guided / Apply / Independent because it explains the expected level of support.

## Desktop workspace

### Overall structure

Desktop remains a two-pane reading workspace:

- **Reading pane:** approximately 54%.
- **Task pane:** approximately 46%.

The passage is the visual anchor. The task pane is the decision area.

Both panes begin near the top of the workspace rather than visually centering the question content vertically.

### Reading pane

The reading pane contains:

1. compact module title;
2. passage metadata only when useful;
3. passage card;
4. source credit.

The long module subtitle is removed from the repeated question view. If instructional framing is needed, it appears once on module entry or in the first guided question, not above every task.

The passage pane maintains its own scroll position when the learner changes answers inside the same question.

### Task pane

The task pane uses this fixed hierarchy:

1. stage/progress line;
2. short question prompt;
3. optional one-line helper;
4. interaction area;
5. response-dependent confidence;
6. primary Check Answer action;
7. post-check feedback/explanation;
8. question navigation footer.

The task content is left-aligned.

There is no generic centered block of controls.

## Information-density rules

To prevent the "dizzy" state seen in Alpha 6:

- The unanswered screen shows at most **one primary instruction sentence** plus one short helper line.
- Category labels are never duplicated under every sortable item.
- No empty drop-zone grid is displayed while the learner is still classifying individual cards.
- Confidence controls are hidden until a response is complete enough to submit.
- Mistake-reason reflection is hidden until an incorrect checked answer exists.
- Explanations are hidden until Check Answer.
- Hints are hidden behind **Need help?** and never open automatically.
- Navigation remains visually separate from the interaction area.
- Decorative images do not appear in the working area unless they are instructional content.

## Stage/progress line

Example:

`2 of 6 · GUIDED`

Rules:

- Question progress appears first.
- Stage appears as quiet text or a restrained tag, not a large badge.
- The stage label must not use alarming or competitive language.
- When moving from Apply to Independent, a one-time short transition message may say: `Independent practice — no hints on these questions.`

## Question wording

Guided-workspace prompts should be rewritten for directness when necessary.

Preferred:

> **Which sentence best shows what the measurements taught the city?**

Helper:

> Choose one highlighted sentence in the passage.

Avoid:

> Select the sentence that most directly explains what the first round of measurements taught the city about choosing improvements.

Content editing rules:

- Preserve academic meaning.
- Remove operational wording that the interface already communicates.
- Avoid adding clues that reduce the intended reasoning demand.
- Shorten interface instructions, not the evidence or reasoning required by the question.

## Guided drag-sort: single-card classification

### Why the V1 board is replaced in guided Practice

The V1 renderer displays every item, repeated destination controls, destination headings, and empty zones simultaneously. This increases visual search and makes the learner reason about the interface before the reading skill.

### V2 behavior

Only **one item card at a time** is active.

Above the card:

`1 of 4`

Card:

> The city studied both heat conditions and where pedestrians actually spent time.

Below it, 2–4 large category controls are visible once each.

For Main Idea Q1:

- **Helps explain the main point**
- **Supporting context**

For scope sorting:

- **Too narrow** — Just one detail
- **Too broad** — Adds or overstates
- **Fits the passage** — Covers the whole text

### Input methods

A learner may:

- drag the current card onto a category;
- tap/click a category;
- focus the card/categories and choose with keyboard.

Tap/click is the primary fallback and is never visually hidden.

### Card progression

After categorizing a card:

- the assignment is saved immediately to the interaction draft;
- the next card replaces it;
- a compact progress indicator updates;
- the learner may use **Back** within the card sorter to revise an earlier assignment before checking.

After all items are assigned:

`4 of 4 sorted`

Then **Check answer** becomes available.

The learner does not see correctness item-by-item before checking the full task.

### Post-check feedback

After Check Answer:

- category choices lock;
- the card stack may show a compact review list;
- incorrect assignments are explained by role, not merely colored red;
- feedback remains concise.

Example:

> **The half-mile distance is true, but it is background context. It does not explain the city's final decision rule.**

## Select-text: explicit passage selection mode

### Problem to solve

In Alpha 6, the task pane told learners to select a highlighted sentence even though candidate sentences did not look clearly selectable. This is an affordance failure.

### V2 behavior

When a `select_text` question becomes active:

1. The passage enters **Selection mode**.
2. A quiet bar appears above the passage:
   - `Selection mode · Choose one highlighted sentence`
3. Only authored candidate targets receive a soft selection background.
4. Non-target passage text remains normal.
5. Candidate targets have visible hover, focus, and touch states.
6. A selected target receives:
   - stronger background;
   - clear border or inset outline;
   - checkmark indicator where feasible without disturbing line flow.
7. The task pane status updates to:
   - `1 sentence selected`
8. Check Answer becomes enabled.

### Selection visual rules

- Candidate highlighting must be visible in Light, Dark, and Sepia themes.
- The candidate state must not look identical to the learner's freeform yellow highlighter tool.
- Selection color must have sufficient contrast without turning whole paragraphs into bright buttons.
- Touch does not depend on hover.
- Focus indicators remain visible at 200% zoom.

### Highlight-tool interaction

While Selection mode is active:

- authored answer targets take precedence over freeform answer highlighting when tapped/clicked;
- regular highlighting remains available on non-target text;
- the Tools menu does not need a new mode switch.

## Multiple choice inside guided Practice

MCQ remains intentionally simple.

Unanswered state:

- short question;
- four visible vertically stacked radio-style answer rows;
- no extra cards inside answer rows;
- no decorative icons;
- no correctness colors before checking.

MCQ is not redesigned merely to look more interactive.

## Dropdown inside guided Practice

The two V1 grammar modes remain:

- inline dropdown for local edits;
- revision dropdown for whole-sentence/phrase revision.

Guided-workspace rules:

- inline dropdown stays embedded where the edit occurs;
- helper copy appears only if the editing action is not obvious;
- at 200% zoom the dropdown may reflow to its own line rather than overflow;
- Check Answer remains separate from selecting the option.

## Drag-order inside guided Practice

Drag-order remains available but is **not used for Main Idea V2**.

When later used for Sequence, Structure, or ER organization:

- the learner sees a short ordered list;
- each row has Up / Down controls;
- drag is optional;
- the initial order is deterministically shuffled so it cannot start already correct;
- no additional board/zone chrome is introduced.

## Progressive disclosure

### Before a response exists

Visible:

- prompt;
- helper if needed;
- interaction;
- optional Need help? when allowed.

Hidden:

- confidence;
- explanation;
- mistake reason;
- correctness summary.

### When a response is complete

Reveal:

`How sure are you?`

- Sure
- Unsure
- Guessing

Confidence remains optional. The learner can still check without selecting one.

### After Check Answer

Reveal in this order:

1. Correct / Not quite.
2. One concise reason.
3. Evidence/rule explanation where relevant.
4. Optional **Why did I miss this?** only after an incorrect answer.

Long feedback is collapsed behind **See full explanation** if more than a short paragraph is needed.

## Hints

Hints are authored content, not generated from the correct answer at runtime.

Rules:

- `guided`: hint allowed.
- `apply`: hint allowed only when it preserves the target reasoning.
- `independent`: no hint.
- Hint control text: **Need help?**
- Opening a hint must not automatically mark the question wrong or alter scoring.
- Hints should orient attention, not reveal the answer.

Good:

> Look for information that affected the city's decision about where an improvement would help the most people.

Bad:

> The answer is in paragraph 2, sentence 5.

## Feedback by stage

### Guided

If incorrect:

- `Not quite.`
- one reasoning cue;
- learner may retry once before the full explanation is revealed.

### Apply

If incorrect:

- concise explanation appears after checking;
- retry behavior follows the module's existing scoring rules, but no additional step-by-step clue is injected automatically.

### Independent

- no pre-answer hint;
- standard answer check and explanation;
- interface remains identical to Apply so difficulty comes from reasoning rather than control changes.

## Question navigation

Navigation remains in a consistent footer:

- Previous
- current position
- Next / Finish

Rules:

- Navigation is visually separate from Check Answer.
- Next does not masquerade as Check Answer.
- Leaving an unfinished interactive question preserves draft state.
- Returning restores card position, assignments, selected target, or dropdown choice.

## Mobile design

Desktop split-screen must not simply shrink.

At narrow widths:

1. compact task header appears first;
2. passage follows;
3. interaction area follows or becomes the active focus depending on type;
4. a sticky bottom action area contains the state-dependent primary action.

### Select-text mobile

Sticky bottom status:

- before selection: `Choose one sentence`
- after selection: `1 selected · Check answer`

Candidate targets remain clearly visible while scrolling the passage.

### Single-card sort mobile

After the learner has read the passage:

- current statement card is prominent;
- category buttons stack vertically;
- one tap classifies the card;
- passage remains available above and may be revisited without losing the classification state.

The passage is not automatically collapsed in V2; automatic collapsing could hide necessary evidence and is deferred until real-device testing shows it is beneficial.

### Mobile action safety

- minimum interactive target size: 44px in Chee Skool's design standard;
- sticky controls never cover passage text or the last answer choice;
- browser zoom and text-size controls do not break the sticky footer.

## Accessibility

The renderer must meet these interaction requirements:

- All functionality available by keyboard.
- No drag-only completion.
- Clear focus-visible states.
- `aria-live` status for classification progress, selection count, and answer feedback.
- Category controls have descriptive accessible names.
- Selected passage targets expose selected state programmatically.
- No meaning conveyed by color alone.
- DOM order matches visual reading order.
- Stage labels and helpers are readable by screen readers without being repeated for every interaction control.
- At 200% zoom, no essential information is clipped or requires two-dimensional scrolling inside the task pane.
- Reduced-motion users receive no movement-dependent transitions; card replacement uses no required animation.

## Main Idea reference path V2

### Q1 — Guided

**Skill:** distinguish central information from contextual details.

**Interaction:** single-card 2-way classification.

**Cards:** four.

**Support:** Need help? available.

**Reasoning:** obvious-to-moderate distinctions; mechanic should be learned without guessing what the controls mean.

### Q2 — Guided

**Skill:** identify the sentence that expresses the key lesson from the city's first measurements.

**Interaction:** select-text.

**UI:** explicit Selection mode in passage.

**Support:** one optional hint.

### Q3 — Apply

**Skill:** identify the passage's central idea.

**Interaction:** clean MCQ.

**Reasoning:** plausible distractors, but one clearly covers the whole passage.

### Q4 — Apply

**Skill:** distinguish scope errors.

**Interaction:** single-card 3-way classification.

**Categories:** Too narrow / Too broad / Fits the passage.

**Support:** category descriptions attached directly to controls.

### Q5 — Independent

**Skill:** identify the strongest evidence among multiple relevant sentences.

**Interaction:** select-text.

**Support:** no hint.

### Q6 — Independent

**Skill:** choose a qualified central idea from close distractors.

**Interaction:** MCQ.

**Support:** no hint.

This creates a predictable progression:

**Guided mechanic + reasoning → Guided evidence selection → Apply central idea → Apply scope discrimination → Independent evidence judgment → Independent central idea judgment.**

## Content-quality rules for guided activities

- The interaction must have a pedagogical reason.
- Every distractor/category must map to a meaningful misconception or scope error.
- No item should become harder solely because wording is longer.
- No item should become easier solely because the correct option is more detailed.
- Select-text candidate sentences must all be plausible enough that selection requires reading.
- Sorting statements must be self-contained enough to classify, but classification must still depend on understanding the passage.
- Guided feedback must explain the reasoning relation, not merely repeat the category label.
- Difficulty progression is reviewed as a sequence, not only question-by-question.

## Data and persistence

The existing canonical answer formats remain unchanged.

The guided renderer adds UI-state persistence only where needed:

- current sort-card index;
- draft category assignments;
- selected text target;
- optional hint-open state does **not** need persistence;
- submitted answer remains stored through the existing answer store.

If a learner refreshes:

- unfinished draft restores;
- submitted answer restores locked state and explanation according to existing Practice behavior;
- question position restores through the existing module position mechanism when available.

## Error handling

- If guided metadata is missing, render the interaction using the normal Practice renderer rather than breaking the module.
- If select-text target mapping fails, show a clear non-graded content error in development/QA rather than silently making unselectable text.
- If drag-sort draft data contains an unknown item/zone id, ignore the invalid assignment and keep the question answerable.
- If JavaScript interaction helpers fail to load, normal MCQ modules must remain unaffected.

## Testing strategy

### Automated behavior tests

Add regression coverage for:

- `active-learning` modules choose the guided renderer;
- normal modules keep the existing renderer;
- single-card sort shows one current item, not all cards/zones simultaneously;
- sorting can be completed by category button without drag;
- Back within sort restores the previous assignment;
- sort draft survives refresh;
- select-text activates passage Selection mode;
- candidate targets have programmatic selectable/selected state;
- selecting a target enables Check Answer;
- confidence is hidden before a response and revealed after a complete response;
- hints follow Guided/Apply/Independent rules;
- independent items expose no pre-answer hint;
- mistake-reason UI appears only after an incorrect checked answer;
- mobile/sticky classes are applied by the guided workspace contract;
- Main Idea V2 remains `mock-excluded` until manual device QA is complete.

### Content tests

Verify Main Idea reference path:

- six questions remain in the intended order;
- stages are exactly Guided, Guided, Apply, Apply, Independent, Independent;
- Q1/Q4 use `drag_sort`;
- Q2/Q5 use `select_text`;
- Q3/Q6 use MCQ;
- only Q1/Q2 may include Guided hints in V2 unless a reviewed Apply hint is explicitly justified;
- difficulty progression does not regress to easy/hard randomness.

### Manual desktop QA

Test Chrome/Edge at:

- 100% zoom;
- 125%;
- 200%;
- narrow desktop window;
- Light/Dark/Sepia.

Actions:

- classify with mouse drag;
- classify without dragging;
- complete with keyboard;
- select passage target by mouse and keyboard;
- open/close hint;
- answer with and without confidence;
- refresh unfinished interaction;
- refresh submitted interaction;
- navigate Previous/Next repeatedly.

### Manual mobile QA

Test at least one real touch device:

- portrait;
- landscape once;
- text selection interaction;
- category tapping;
- sticky action area;
- browser Back;
- refresh;
- A− / A+;
- Tools menu;
- native scroll without accidental drag.

### Learner usability acceptance test

A first-time learner should be able to begin each interaction **without verbal instruction from us**.

For each question ask:

1. What do you think you are supposed to do?
2. Where would you click first?
3. What part of the screen are you looking at most?
4. Is anything on screen unnecessary right now?

Failure condition:

- learner cannot identify the required action within a few seconds;
- learner mistakes category labels for feedback;
- learner does not notice selectable passage text;
- learner spends more effort describing controls than describing the reading decision.

## Release gate

The guided renderer may replace the current Main Idea active-learning UI only when:

- full automated suite passes;
- content validation remains 0 errors / 0 warnings;
- public learner build includes all guided runtime assets;
- no regression in normal Practice or Mock;
- Main Idea six-question manual desktop flow is clean;
- real-device mobile interaction is checked before removing `mock-excluded`.

The first release with this renderer should remain an Alpha candidate. The interaction types are not promoted broadly across RLA until the Main Idea reference path passes real learner/usability review.

## Future extensions after V2 proves itself

Potential later work, not part of this implementation:

- optional chunked Guided Reading mode for learners who need additional passage scaffolding;
- active-learning paths for Supporting Details and Inference;
- evidence ranking UI for Arguments;
- sentence-combining/rewrite interactions for Language/ER;
- designed visual organizer assets embedded contextually in Learn/Resources;
- removal of `mock-excluded` from selected interaction items after device and exam-fidelity QA.
