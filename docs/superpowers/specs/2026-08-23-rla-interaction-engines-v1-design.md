# Chee Skool RLA Interaction Engines V1 — Design

## Purpose

Chee Skool currently teaches and tests RLA mainly through multiple-choice questions, with a limited grammar-edit dropdown in Mock. V1 adds three reusable interaction families that match the learning-method matrix and better approximate the public GED RLA interaction mix:

1. **Embedded dropdown** for editing/language items.
2. **Select text / select area** for evidence, detail, tone, purpose, and main-idea support.
3. **Drag-and-drop** in two modes: **sort** and **order**.

The first content proving the system will be **Reading → Core Meaning → Main Idea / Central Idea**. The engines must be reusable by later Reading, Arguments, Language, and ER-support activities without reimplementing page-specific widgets.

## Product principles

- The interaction must teach the skill, not merely add novelty.
- Every graded interaction must preserve Chee Skool's existing local-first answer, confidence, explanation, mistake-book, spaced-review, and progress behavior.
- Learner answers remain local; no backend is introduced.
- Practice may provide feedback after answering. Mock hides feedback until section/test completion.
- All new interactions must work with mouse, touch, and keyboard.
- Dragging may never be the only way to complete a drag task. WCAG 2.2 requires a non-dragging single-pointer alternative for drag operations. Therefore each draggable item also supports explicit move/place controls.
- Finished graphic organizers remain image/PDF assets. The interaction engines are web controls, not replacements for the designed visual learning sheets.
- V1 stays deliberately small: grammar editing supports two intentional modes—(a) a whole-sentence/whole-phrase revision dropdown with no blank token and (b) one GED-style inline dropdown blank. One correct selectable text target per select-area question and drag sort/order only are supported. Multi-blank dropdowns and freeform region drawing are later features.

## Existing architecture to preserve

The current project is static HTML/CSS/JavaScript. Source content is authored in `content-src`, validated by `scripts/validate-content.mjs`, compiled by `scripts/build-content.mjs`, and consumed by:

- `module.html` + `js/module.js` for untimed practice;
- `test.html` + `js/test.js` + `js/mock-engine.js` for timed Mock;
- `js/storage.js` for local answers/notes/highlights;
- `js/learning.js` for objective practice signals and spaced review.

The current `grammar_edit` bank contains two pedagogically different editing jobs. Some items ask learners to revise a complete sentence or phrase (parallelism, sentence boundaries, clarity, capitalization, concision); other items are local edits that naturally fit an embedded blank (agreement, punctuation, transitions, local word choice). V1 keeps one content type but renders the mode that matches the editing job: whole-revision dropdown when no `{{blank}}` token is authored, inline dropdown when exactly one token is authored. We do not rewrite strong whole-sentence items merely to force a visual format.

## Architecture

### Shared pure interaction model

Create `js/question-interactions.js` as a browser-safe global module exposing pure helpers under `window.QuestionInteractions`. Both Practice and Mock will use it for:

- supported type detection;
- answer completeness;
- canonical answer serialization;
- correctness checks;
- human-readable answer labels;
- drag sort/order parsing and serialization;
- interaction metadata validation helpers used by tests.

Answers remain **strings**, even for drag interactions, so existing `Store`, `Learning.recordAttempt`, Mock answer persistence, and history remain compatible.

Canonical formats:

- `grammar_edit`: option id, e.g. `"b"`.
- `select_text`: target id, e.g. `"s3"`.
- `drag_sort`: sorted assignments, e.g. `"d1=important|d2=irrelevant|d3=important"`.
- `drag_order`: ordered ids, e.g. `"step2|step1|step3"`.

### Content schema additions

Extend the V2 question schema with three types:

- existing `grammar_edit` (behavior tightened, no type rename);
- `select_text`;
- `drag_sort`;
- `drag_order`.

Add optional `interaction` metadata to a question.

#### `grammar_edit`

Uses existing fields:

- `prompt` contains exactly one `{{blank}}` token.
- `options` contains two or more choices.
- `correct` is one option id.

The learner-facing renderer inserts a native `<select>` directly where `{{blank}}` appears. Native select is preferred for accessibility and mobile reliability.

#### `select_text`

```json
{
  "type": "select_text",
  "prompt": "Select the sentence that best supports the main idea.",
  "interaction": {
    "selectionMode": "sentence",
    "targets": [
      { "id": "s1", "text": "..." },
      { "id": "s2", "text": "..." }
    ]
  },
  "correct": "s2"
}
```

Rules:

- `selectionMode` is `sentence`, `phrase`, or `paragraph`.
- Every target text must occur exactly once in the referenced passage.
- Target ids are unique.
- `correct` must name exactly one target id in V1.
- The passage renderer wraps only authored targets in interactive selectable spans/buttons; it does not guess sentence boundaries.
- Selecting a target stores its id and visibly marks it.

This explicit-target approach avoids fragile text-offset logic and keeps authored evidence reviewable.

#### `drag_sort`

```json
{
  "type": "drag_sort",
  "prompt": "Sort each statement by its role.",
  "interaction": {
    "items": [
      { "id": "d1", "text": "..." },
      { "id": "d2", "text": "..." }
    ],
    "zones": [
      { "id": "important", "label": "Supports the main idea" },
      { "id": "irrelevant", "label": "Does not support it" }
    ]
  },
  "correct": "d1=important|d2=irrelevant"
}
```

Rules:

- 2–8 items, 2–4 zones.
- Item and zone ids are unique.
- Every item appears exactly once in the canonical correct mapping.
- Learners may drag an item to a zone.
- Learners may also click/tap an item and choose a destination using explicit buttons/select controls; this is the non-dragging equivalent.
- Keyboard users can focus an item, choose a destination, and move it without drag gestures.

#### `drag_order`

```json
{
  "type": "drag_order",
  "prompt": "Put the ideas in the order used by the author.",
  "interaction": {
    "items": [
      { "id": "o1", "text": "..." },
      { "id": "o2", "text": "..." },
      { "id": "o3", "text": "..." }
    ]
  },
  "correct": "o2|o1|o3"
}
```

Rules:

- 3–8 items.
- Learners may drag to reorder.
- Each row also has Up/Down controls, making the task fully operable without dragging.
- Keyboard focus remains on the moved item after reordering.

## Rendering behavior

### Practice

Practice continues to show one question at a time.

#### Embedded dropdown

The prompt itself contains the `<select>`. The learner selects an option, then presses **Check answer**. This prevents accidental submission while scrolling a mobile select menu and makes the behavior consistent with drag/select-area interactions.

#### Select text

The reading passage remains in the left reading panel. Authored target text is visibly hoverable/focusable but should not resemble a bright button before selection. The learner selects one target and presses **Check answer**.

When a `select_text` question is active, regular freeform highlighting remains available only outside the selectable targets. Selecting answer text and highlighting must not conflict.

#### Drag sort/order

The answer area contains movable cards. A persistent instruction says that cards can be dragged **or moved using controls**. A **Check answer** button stays disabled until the response is complete.

### Mock

Mock supports the same question types, but:

- no immediate correctness feedback;
- no explanations before completion;
- answers can be changed until the section is submitted;
- answers survive refresh exactly like current MC/dropdown answers;
- the section Review screen counts the new string answers as answered;
- post-test review renders readable "Your answer" and "Correct answer" text through the shared formatter.

## Scoring and learning signals

`window.QuestionInteractions.isCorrect(q, answer)` becomes the canonical objective correctness helper for the new types and existing selected-response types.

Practice passes the same boolean result to `Learning.recordAttempt`. The learner's serialized string answer is stored in the existing attempt history. For drag/select questions, distractor-pattern analytics are omitted in V1 unless the authored interaction later defines a specific misconception code.

Mock scoring must use the same shared correctness helper rather than string equality assumptions.

## Difficulty and scaffolding progression

Interaction novelty must never become the source of random difficulty. Chee Skool authors the learning sequence so cognitive demand rises deliberately while interface demand stays familiar:

1. **Model / obvious recognition** — explicit example or highly visible relationship; interaction teaches the mechanic without hiding the skill.
2. **Guided application** — same skill with plausible distractors and a visible reasoning cue.
3. **Independent application** — support is removed; learner must identify the relationship from the text.
4. **Qualified / close-choice reasoning** — distractors are partially true, too broad, too narrow, or supported by the wrong evidence.
5. **Transfer / mixed conditions** — unfamiliar context or mixed skill demand, followed later by spaced review.

The sequence follows gradual release: explain/model → guided practice → independent use. It also preserves Chee Skool's existing rule that difficulty is driven by reasoning depth, passage complexity, and distractor quality—not by deliberately awkward controls. New interaction engines therefore need predictable controls, persistent instructions, and accessible non-drag alternatives at every difficulty level.

## Main Idea reference content

Add one small, clearly labeled **Main Idea Active Practice** source set rather than rewriting the entire Main Idea bank immediately. It proves the interaction system with original content:

1. `drag_sort`: classify statements as **Supports the main idea** vs **Interesting but not central**.
2. `select_text`: select the sentence that best supports a stated main idea.
3. existing `multiple_choice`: identify the best main idea after the active tasks.

The sequence is intentional: manipulate → locate evidence → independent recognition.

The source set remains GED-appropriate in tone and adult reading level. It is not included in the full Mock blueprint until the interaction engine has passed browser/device QA; Practice is the first proving ground.

## Accessibility requirements

- No task requires dragging to complete.
- All interactive targets are keyboard-focusable.
- Focus states remain visible.
- Minimum practical target size follows the existing Chee Skool 44px control convention, exceeding WCAG 2.2's 24×24px minimum target criterion.
- Drag status/placement changes use an `aria-live="polite"` status region.
- Sort zones and ordering instructions have explicit labels; meaning is never conveyed by color alone.
- Native `<select>` is used for dropdown editing.
- Touch users can complete sort/order with tap controls even if HTML drag behavior is unreliable on their browser.
- At 200% zoom, controls reflow vertically rather than requiring horizontal page scrolling.

## Validation rules

`scripts/validate-content.mjs` must reject:

- unsupported interaction types;
- missing `interaction` metadata where required;
- duplicate item/zone/target ids;
- `select_text` target text absent from or repeated in its passage;
- `correct` referencing unknown targets/items/zones;
- incomplete drag-sort mappings;
- drag-order answers that omit or duplicate items;
- `grammar_edit` questions with more than one `{{blank}}` token; zero blanks deliberately means a whole-revision dropdown, while one blank means an inline dropdown;
- selected-response questions without explanations.

Validation should report errors, not warnings, for malformed published interactions.

## Styling

Add focused interaction styles to `css/site.css` using the existing Chee Skool design language:

- quiet white/soft-surface cards;
- existing navy text and blue focus/accent colors;
- no arcade/game styling;
- selected state stronger than hover state;
- correct/incorrect states only after checking in Practice;
- clear drag handles are optional visual affordances, not required controls;
- responsive stack on narrow screens.

## Testing strategy

### Pure interaction tests

Create `scripts/question-interactions.test.mjs` covering:

- canonical drag serialization order;
- drag-order parsing;
- answer completeness;
- correctness for all four interaction families;
- readable answer formatting.

The shared helper file must be importable in Node for tests without requiring a browser DOM.

### Content validation tests

Extend foundation/content tests with valid and invalid fixtures for the new schema/validator rules.

### Practice contract tests

Assert `module.js`:

- delegates correctness to shared helpers;
- renders/handles `grammar_edit`, `select_text`, `drag_sort`, `drag_order`;
- uses explicit Check Answer for active interactions;
- records Learning attempts only after checking;
- provides non-drag controls for sort/order.

### Mock contract tests

Assert `test.js` and `mock-engine.js`:

- support all new types;
- persist string answers;
- do not reveal correctness during timed sections;
- use readable answer labels in post-test review;
- count complete drag responses as answered.

### Full verification

Before release:

- `npm test`
- `npm run content:validate`
- `npm run content:build`
- syntax-check first-party JS/MJS
- build the public deployment artifact
- manual browser QA on desktop and phone for mouse, touch, keyboard, refresh recovery, 200% zoom, light/dark themes, and the non-drag alternatives.

## Rollout

V1 is considered complete when:

1. the three engines work in Practice;
2. Mock can render/score/persist them even if only existing Language dropdowns appear in the current mock pool;
3. Main Idea Active Practice proves select-text and drag-sort with real learner content;
4. all automated validation is green;
5. real-device QA confirms drag alternatives, touch selection, and dropdown behavior.

Only after this reference implementation is stable should the method matrix be used to expand interaction-rich content across other RLA titles.

## Out of scope for V1

- multi-select text answers;
- arbitrary rectangle/image hotspot selection;
- multi-blank editing passages;
- drawing/connecting lines;
- freeform matching canvas;
- drag interactions inside Extended Response writing;
- animation/gamification rewards;
- converting every existing question to a new interaction type.
