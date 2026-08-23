# RLA Interaction Engines V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add reusable embedded-dropdown, select-text, drag-sort, and drag-order interactions to Chee Skool Practice and Mock, then prove the system with a Main Idea Active Practice set that stays out of randomized Mock forms until device QA is complete.

**Architecture:** Add one browser-safe pure helper module, `js/question-interactions.js`, as the canonical layer for answer serialization, completeness, correctness, labels, select-target segmentation, sort state, and order movement. Extend the V2 content schema/validator/compiler to carry explicit interaction metadata. Practice and Mock render their own UI from the same question contract and store only canonical string answers, preserving existing local storage, learning signals, attempt recovery, and progress code.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js built-in test runner, JSON content/schema, existing Chee Skool build/validation pipeline.

**Spec:** `docs/superpowers/specs/2026-08-23-rla-interaction-engines-v1-design.md`

## Global Constraints

- Keep the site backend-free and local-first.
- Preserve existing `Store`, `Learning`, Mock attempt, Progress, and spaced-review data formats by storing every new learner response as a string.
- V1 grammar editing supports either zero `{{blank}}` tokens (whole-revision dropdown) or exactly one `{{blank}}` token (inline dropdown); multi-blank editing remains out of scope. Select-text supports one correct target, drag sort supports 2–8 items and 2–4 zones, and drag order supports 3–8 items.
- Dragging must never be the only completion method; sort gets explicit destination controls and order gets Up/Down controls.
- Practice may reveal correctness after **Check answer**; Mock must not reveal correctness before section/test completion.
- New Main Idea Active Practice content must be tagged `mock-excluded` and must not appear in generated Mock forms until later browser/device QA removes that tag.
- Do not replace designed visual learning sheets with code-rendered diagrams; these tasks build question interactions only.
- No new third-party runtime dependencies.

---

## File Structure

**Create**
- `js/question-interactions.js` — pure canonical interaction model shared by Practice, Mock, and tests.
- `scripts/interaction-engines-quality.test.mjs` — pure helper, validation/compiler, wiring, accessibility-contract, Mock-exclusion, and Main Idea active-set regression tests.
- `content-src/passages/p-rla-mainidea-active-shade-route.json` — original adult/GED-appropriate source passage for the reference active set.
- `content-src/sets/set-rla-mainidea-active-methods-v1.json` — first interaction-rich Main Idea practice set.

**Modify**
- `package.json` — add the new test file to the normal `npm test` chain.
- `schemas/studo-content-v2.schema.json` — add `select_text`, `drag_sort`, `drag_order`, and interaction metadata definitions/conditions.
- `scripts/validate-content.mjs` — enforce interaction-specific authoring rules.
- `scripts/build-content.mjs` — preserve `interaction` metadata in generated learner modules.
- `module.html` — load `question-interactions.js` before `module.js`.
- `js/module.js` — render/submit the four auto-graded interaction families in Practice and render select-text targets inside the passage.
- `test.html` — load `question-interactions.js` before Mock code.
- `js/test.js` — render/persist new interaction types without feedback and format post-test review through the shared helper.
- `js/mock-engine.js` — use shared correctness and exclude modules tagged `mock-excluded` from random selection.
- `scripts/mock-test-quality.test.mjs` — prove scoring and generation behavior with the new types/exclusion tag.
- `css/site.css` — accessible interaction states, controls, reflow, and minimum target sizing.
- `release.json`, `js/app.js`, `sw.js`, learner HTML release meta tags, `scripts/navigation-library-quality.test.mjs` — bump the completed candidate to `0.7.0-alpha.6` only after all behavior is green.
- `STUDO_MASTER_STATUS.md` — record the new interaction capability and its Mock-exclusion status.

---

### Task 1: Shared canonical interaction model

**Files:**
- Create: `js/question-interactions.js`
- Create: `scripts/interaction-engines-quality.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `globalThis.QuestionInteractions` / `window.QuestionInteractions`
- Produces: `SUPPORTED_TYPES: Set<string>`
- Produces: `canonicalizeAnswer(question, answer): string`
- Produces: `hasCompleteAnswer(question, answer): boolean`
- Produces: `isCorrect(question, answer): boolean`
- Produces: `formatAnswer(question, answer): string`
- Produces: `parseSort(answer): Record<string,string>` and `serializeSort(assignments): string`
- Produces: `parseOrder(answer): string[]` and `serializeOrder(ids): string`
- Produces: `moveOrder(ids, itemId, delta): string[]`
- Produces: `segmentTextTargets(text, targets): Array<{kind:'text',text:string}|{kind:'target',id:string,text:string}>`

- [ ] **Step 1: Write pure-helper tests first**

Create `scripts/interaction-engines-quality.test.mjs` with these initial tests:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();

async function loadInteractions() {
  delete globalThis.QuestionInteractions;
  await import(`${pathToFileURL(path.join(ROOT, 'js/question-interactions.js')).href}?t=${Date.now()}`);
  return globalThis.QuestionInteractions;
}

test('interaction helper canonicalizes and scores every V1 objective type', async () => {
  const I = await loadInteractions();
  const mc = { type:'multiple_choice', options:[{id:'a',text:'A'},{id:'b',text:'B'}], correct:'b' };
  const select = { type:'select_text', interaction:{targets:[{id:'s1',text:'One.'},{id:'s2',text:'Two.'}]}, correct:'s2' };
  const sort = { type:'drag_sort', interaction:{items:[{id:'d2',text:'Two'},{id:'d1',text:'One'}],zones:[{id:'yes',label:'Yes'},{id:'no',label:'No'}]}, correct:'d1=yes|d2=no' };
  const order = { type:'drag_order', interaction:{items:[{id:'o1',text:'One'},{id:'o2',text:'Two'},{id:'o3',text:'Three'}]}, correct:'o2|o1|o3' };

  assert.equal(I.canonicalizeAnswer(mc, 'b'), 'b');
  assert.equal(I.canonicalizeAnswer(select, 's2'), 's2');
  assert.equal(I.canonicalizeAnswer(sort, 'd2=no|d1=yes'), 'd1=yes|d2=no');
  assert.equal(I.canonicalizeAnswer(order, ['o2','o1','o3']), 'o2|o1|o3');
  assert.equal(I.isCorrect(sort, 'd2=no|d1=yes'), true);
  assert.equal(I.isCorrect(order, 'o2|o1|o3'), true);
  assert.equal(I.isCorrect(select, 's1'), false);
});

test('interaction helper detects completeness without changing storage away from strings', async () => {
  const I = await loadInteractions();
  const sort = { type:'drag_sort', interaction:{items:[{id:'d1'},{id:'d2'}],zones:[{id:'yes'},{id:'no'}]} };
  const order = { type:'drag_order', interaction:{items:[{id:'o1'},{id:'o2'},{id:'o3'}]} };
  assert.equal(I.hasCompleteAnswer(sort, 'd1=yes'), false);
  assert.equal(I.hasCompleteAnswer(sort, 'd1=yes|d2=no'), true);
  assert.equal(I.hasCompleteAnswer(order, 'o1|o2'), false);
  assert.equal(I.hasCompleteAnswer(order, 'o1|o2|o3'), true);
});

test('select-text segmentation requires authored targets and never guesses sentence boundaries', async () => {
  const I = await loadInteractions();
  const text = 'First sentence. Second sentence. Third sentence.';
  const segments = I.segmentTextTargets(text, [
    { id:'s1', text:'First sentence.' },
    { id:'s3', text:'Third sentence.' }
  ]);
  assert.deepEqual(segments.filter((x) => x.kind === 'target').map((x) => x.id), ['s1','s3']);
  assert.equal(segments.map((x) => x.text).join(''), text);
});

test('order movement is deterministic and preserves all ids', async () => {
  const I = await loadInteractions();
  assert.deepEqual(I.moveOrder(['o1','o2','o3'], 'o2', -1), ['o2','o1','o3']);
  assert.deepEqual(I.moveOrder(['o1','o2','o3'], 'o1', -1), ['o1','o2','o3']);
  assert.deepEqual(I.moveOrder(['o1','o2','o3'], 'o2', 1), ['o1','o3','o2']);
});
```

- [ ] **Step 2: Run the new test and verify RED**

Run:

```bash
node --test scripts/interaction-engines-quality.test.mjs
```

Expected: FAIL because `js/question-interactions.js` does not exist.

- [ ] **Step 3: Implement the minimal pure helper**

Create `js/question-interactions.js` using this public shape:

```js
(function (root) {
  'use strict';

  const SUPPORTED_TYPES = new Set([
    'multiple_choice', 'evidence_based', 'grammar_edit',
    'select_text', 'drag_sort', 'drag_order'
  ]);

  function parseSort(answer) {
    const out = {};
    String(answer || '').split('|').filter(Boolean).forEach((part) => {
      const split = part.indexOf('=');
      if (split > 0) out[part.slice(0, split)] = part.slice(split + 1);
    });
    return out;
  }

  function serializeSort(assignments) {
    return Object.entries(assignments || {})
      .filter(([item, zone]) => item && zone)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([item, zone]) => `${item}=${zone}`)
      .join('|');
  }

  function parseOrder(answer) {
    if (Array.isArray(answer)) return answer.map(String).filter(Boolean);
    return String(answer || '').split('|').map((x) => x.trim()).filter(Boolean);
  }

  function serializeOrder(ids) { return parseOrder(ids).join('|'); }

  function canonicalizeAnswer(question, answer) {
    if (question?.type === 'drag_sort') return serializeSort(typeof answer === 'string' ? parseSort(answer) : answer);
    if (question?.type === 'drag_order') return serializeOrder(answer);
    return String(answer ?? '').trim();
  }

  function hasCompleteAnswer(question, answer) {
    const canonical = canonicalizeAnswer(question, answer);
    if (!canonical) return false;
    if (question?.type === 'drag_sort') {
      const assignments = parseSort(canonical);
      return (question.interaction?.items || []).every((item) => Boolean(assignments[item.id]));
    }
    if (question?.type === 'drag_order') {
      const expected = (question.interaction?.items || []).map((item) => item.id);
      const actual = parseOrder(canonical);
      return actual.length === expected.length && new Set(actual).size === expected.length && expected.every((id) => actual.includes(id));
    }
    return true;
  }

  function isCorrect(question, answer) {
    return canonicalizeAnswer(question, answer) === canonicalizeAnswer(question, question?.correct);
  }

  function optionText(question, id) {
    return (question?.options || []).find((option) => String(option.id) === String(id))?.text || String(id || '');
  }

  function formatAnswer(question, answer) {
    const value = canonicalizeAnswer(question, answer);
    if (!value) return 'No answer';
    if (['multiple_choice','evidence_based','grammar_edit'].includes(question?.type)) return optionText(question, value);
    if (question?.type === 'select_text') return (question.interaction?.targets || []).find((target) => target.id === value)?.text || value;
    if (question?.type === 'drag_sort') {
      const zones = new Map((question.interaction?.zones || []).map((zone) => [zone.id, zone.label]));
      const items = new Map((question.interaction?.items || []).map((item) => [item.id, item.text]));
      return Object.entries(parseSort(value)).map(([item, zone]) => `${items.get(item) || item} → ${zones.get(zone) || zone}`).join('; ');
    }
    if (question?.type === 'drag_order') {
      const items = new Map((question.interaction?.items || []).map((item) => [item.id, item.text]));
      return parseOrder(value).map((id, index) => `${index + 1}. ${items.get(id) || id}`).join(' · ');
    }
    return value;
  }

  function moveOrder(ids, itemId, delta) {
    const next = parseOrder(ids);
    const index = next.indexOf(itemId);
    const target = index + Number(delta || 0);
    if (index < 0 || target < 0 || target >= next.length) return next;
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  }

  function segmentTextTargets(text, targets) {
    const source = String(text || '');
    const located = (targets || []).map((target) => ({ ...target, index: source.indexOf(target.text) })).filter((target) => target.index >= 0).sort((a,b) => a.index - b.index);
    const segments = [];
    let cursor = 0;
    for (const target of located) {
      if (target.index > cursor) segments.push({ kind:'text', text:source.slice(cursor, target.index) });
      segments.push({ kind:'target', id:target.id, text:target.text });
      cursor = target.index + target.text.length;
    }
    if (cursor < source.length) segments.push({ kind:'text', text:source.slice(cursor) });
    return segments;
  }

  root.QuestionInteractions = { SUPPORTED_TYPES, parseSort, serializeSort, parseOrder, serializeOrder, canonicalizeAnswer, hasCompleteAnswer, isCorrect, formatAnswer, moveOrder, segmentTextTargets };
})(typeof globalThis !== 'undefined' ? globalThis : window);
```

- [ ] **Step 4: Run helper tests and verify GREEN**

Run:

```bash
node --test scripts/interaction-engines-quality.test.mjs
```

Expected: all four tests PASS.

- [ ] **Step 5: Add the test to the project test chain**

In `package.json`, insert:

```json
"test": "node --test scripts/build-content-regression.test.mjs && node --test scripts/foundation-qa.test.mjs && node --test scripts/reading-quality.test.mjs && node --test scripts/arguments-quality.test.mjs && node --test scripts/language-quality.test.mjs && node --test scripts/extended-response-quality.test.mjs && node --test scripts/navigation-library-quality.test.mjs && node --test scripts/interaction-engines-quality.test.mjs && node --test scripts/alpha-release-hardening.test.mjs && node --test scripts/mock-test-quality.test.mjs"
```

- [ ] **Step 6: Commit**

```bash
git add js/question-interactions.js scripts/interaction-engines-quality.test.mjs package.json
git commit -m "feat: add canonical RLA interaction model"
```

---

### Task 2: Schema, validator, and compiler contract

**Files:**
- Modify: `schemas/studo-content-v2.schema.json`
- Modify: `scripts/validate-content.mjs`
- Modify: `scripts/build-content.mjs`
- Modify: `scripts/interaction-engines-quality.test.mjs`

**Interfaces:**
- Consumes: `question.interaction`
- Produces generated learner question objects with `interaction` unchanged except for JSON serialization.
- Validation error codes: `INTERACTION_MISSING`, `GRAMMAR_BLANK_INVALID`, `SELECT_TARGET_INVALID`, `SELECT_TARGET_TEXT_INVALID`, `DRAG_ITEM_INVALID`, `DRAG_ZONE_INVALID`, `DRAG_CORRECT_INVALID`.

- [ ] **Step 1: Add failing validator/compiler tests**

Append tests that create temporary invalid set records through the existing validator test style, and a compile assertion after `node scripts/build-content.mjs`. At minimum cover:

```js
test('content contract rejects malformed V1 interactions', async () => {
  const source = fs.readFileSync(path.join(ROOT, 'scripts/validate-content.mjs'), 'utf8');
  assert.match(source, /INTERACTION_MISSING/);
  assert.match(source, /GRAMMAR_BLANK_INVALID/);
  assert.match(source, /SELECT_TARGET_TEXT_INVALID/);
  assert.match(source, /DRAG_CORRECT_INVALID/);
});

test('build compiler preserves interaction metadata', () => {
  const source = fs.readFileSync(path.join(ROOT, 'scripts/build-content.mjs'), 'utf8');
  assert.match(source, /if \(q\.interaction\) out\.interaction =/);
});
```

Also add fixture-based tests using a temporary copy of an authored set to prove a duplicate select target and an incomplete drag mapping cause `content:validate` to exit non-zero.

- [ ] **Step 2: Run the interaction test and verify RED**

```bash
node --test scripts/interaction-engines-quality.test.mjs
```

Expected: FAIL because validator/compiler do not know the new contract.

- [ ] **Step 3: Extend the JSON schema**

In `$defs.question.properties.type.enum`, add:

```json
"select_text",
"drag_sort",
"drag_order"
```

Add `$defs.selectTarget`, `$defs.dragItem`, `$defs.dragZone`, and an `interaction` property to questions:

```json
"interaction": {
  "type": "object",
  "properties": {
    "selectionMode": {"type":"string","enum":["sentence","phrase","paragraph"]},
    "targets": {"type":"array","items":{"$ref":"#/$defs/selectTarget"}},
    "items": {"type":"array","items":{"$ref":"#/$defs/dragItem"}},
    "zones": {"type":"array","items":{"$ref":"#/$defs/dragZone"}}
  },
  "additionalProperties": false
}
```

with:

```json
"selectTarget": {
  "type":"object",
  "required":["id","text"],
  "properties":{"id":{"type":"string","pattern":"^[a-z0-9_-]+$"},"text":{"type":"string","minLength":1}},
  "additionalProperties":false
},
"dragItem": {
  "type":"object",
  "required":["id","text"],
  "properties":{"id":{"type":"string","pattern":"^[a-z0-9_-]+$"},"text":{"type":"string","minLength":1}},
  "additionalProperties":false
},
"dragZone": {
  "type":"object",
  "required":["id","label"],
  "properties":{"id":{"type":"string","pattern":"^[a-z0-9_-]+$"},"label":{"type":"string","minLength":1}},
  "additionalProperties":false
}
```

- [ ] **Step 4: Add validator helpers**

In `scripts/validate-content.mjs`, keep `SELECTED_TYPES` for option-based answer-position QA and add:

```js
const INTERACTION_TYPES = new Set(['select_text','drag_sort','drag_order']);

function duplicateIds(items) {
  const seen = new Set();
  return (items || []).filter((item) => item?.id && (seen.has(item.id) || !seen.add(item.id))).map((item) => item.id);
}

function occurrences(haystack, needle) {
  if (!needle) return 0;
  let count = 0, from = 0;
  while ((from = String(haystack || '').indexOf(needle, from)) >= 0) { count += 1; from += needle.length; }
  return count;
}
```

Add `validateInteractionQuestion({issues,file,location,question,passage})` with these exact rules:

- `grammar_edit`: zero blanks for deliberate whole-revision items or exactly one `{{blank}}` for inline editing; more than one blank is invalid; at least two options; existing selected-response validation still runs.
- `select_text`: `interaction.selectionMode` in sentence/phrase/paragraph; 2–8 targets; unique ids; every target text occurs exactly once in the referenced passage; `correct` is one known target id.
- `drag_sort`: 2–8 unique items; 2–4 unique zones; parse `correct` on `|` and `=`; every item appears exactly once; every zone reference exists.
- `drag_order`: 3–8 unique items; `correct` contains every item id exactly once and no unknown id.

Call it inside the published-set question loop immediately after prompt checks:

```js
if (question.type === 'grammar_edit' || INTERACTION_TYPES.has(question.type)) {
  validateInteractionQuestion({ issues, file, location: qloc, question, passage: set.passageRefs?.[0] ? passages.get(set.passageRefs[0]) : null });
}
```

- [ ] **Step 5: Preserve interaction metadata in compilation**

In `compileQuestion` inside `scripts/build-content.mjs`, add:

```js
if (q.interaction) out.interaction = JSON.parse(JSON.stringify(q.interaction));
```

immediately after copying options/correct.

- [ ] **Step 6: Verify content-contract tests GREEN**

```bash
node --test scripts/interaction-engines-quality.test.mjs
npm run content:validate
```

Expected: interaction tests PASS and the existing bank remains `0 error(s), 0 warning(s)`.

- [ ] **Step 7: Commit**

```bash
git add schemas/studo-content-v2.schema.json scripts/validate-content.mjs scripts/build-content.mjs scripts/interaction-engines-quality.test.mjs
git commit -m "feat: validate interaction-rich RLA content"
```

---

### Task 3: Practice renderer and accessible controls

**Files:**
- Modify: `module.html`
- Modify: `js/module.js`
- Modify: `css/site.css`
- Modify: `scripts/interaction-engines-quality.test.mjs`

**Interfaces:**
- Consumes: `window.QuestionInteractions`
- Practice-specific helper functions to add: `renderPassageForQuestion(q, savedAnswer)`, `renderInteractiveAnswer(q, container, savedAnswer)`, `submitInteractiveAnswer(q, answer, container)`, `bindSelectTextTargets(q, savedAnswer)`, `bindDragSort(q, container, savedAnswer)`, `bindDragOrder(q, container, savedAnswer)`.

- [ ] **Step 1: Add failing Practice wiring/accessibility tests**

Append source-contract tests:

```js
test('Practice loads the shared interaction model before module code', () => {
  const html = fs.readFileSync(path.join(ROOT, 'module.html'), 'utf8');
  assert.ok(html.indexOf('js/question-interactions.js') < html.indexOf('js/module.js'));
});

test('Practice implements select text and non-drag alternatives', () => {
  const source = fs.readFileSync(path.join(ROOT, 'js/module.js'), 'utf8');
  assert.match(source, /select_text/);
  assert.match(source, /data-select-target/);
  assert.match(source, /data-sort-destination/);
  assert.match(source, /data-order-up/);
  assert.match(source, /data-order-down/);
  assert.match(source, /Check answer/);
});

test('interaction controls expose a live status and 44px practical targets', () => {
  const css = fs.readFileSync(path.join(ROOT, 'css/site.css'), 'utf8');
  assert.match(css, /\.interaction-live-status/);
  assert.match(css, /min-height:\s*44px/);
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --test scripts/interaction-engines-quality.test.mjs
```

Expected: FAIL on missing Practice wiring.

- [ ] **Step 3: Load the helper before Practice**

In `module.html`, add:

```html
<script src="js/question-interactions.js"></script>
```

between `js/learning.js` and `js/module.js`.

- [ ] **Step 4: Make prompt and passage rendering question-aware**

In `renderCurrentQuestion`, use plain escaped prompt for all types except grammar. Grammar rendering branches by authored mode: one `{{blank}}` reserves an embedded dropdown position in the prompt; zero blanks leaves the prompt intact and renders one compact revision dropdown directly beneath it. Neither mode renders duplicate radio choices.

Add `renderPassageForQuestion(q, savedAnswer)` that:

1. re-renders `.passage-text` from `currentQuiz.passage` each time the question changes;
2. for `select_text`, calls `QuestionInteractions.segmentTextTargets` per paragraph and renders authored target segments as:

```html
<button type="button" class="select-text-target" data-select-target="s2" aria-pressed="false">...</button>
```

3. marks the saved target with `.selected` and `aria-pressed="true"`;
4. rebinds normal highlight handlers after rendering;
5. prevents the highlighter from saving a selection whose common ancestor is inside `.select-text-target`.

- [ ] **Step 5: Render embedded grammar dropdown with explicit Check answer**

For `grammar_edit`, render the prompt inside the answer area using:

```html
<div class="embedded-edit-question">
  <p class="embedded-edit-prompt">BEFORE<select class="practice-edit-select" aria-label="Choose the best edit">...</select>AFTER</p>
  <button class="btn interaction-check" type="button" disabled>Check answer</button>
</div>
```

Build `BEFORE` and `AFTER` by splitting `q.prompt` on the single `{{blank}}`. Enable Check answer only when a value is selected. On Check answer, call the generic `submitInteractiveAnswer` below.

- [ ] **Step 6: Add one generic Practice submit path for non-MC auto-graded interactions**

Implement:

```js
function submitInteractiveAnswer(q, answer, container) {
  const I = window.QuestionInteractions;
  const canonical = I.canonicalizeAnswer(q, answer);
  if (!I.hasCompleteAnswer(q, canonical)) return;
  Store.setAnswer(currentQuiz.id, q.id, canonical);
  const correct = I.isCorrect(q, canonical);
  const learningResult = typeof Learning !== 'undefined' ? Learning.recordAttempt({
    module: { ...currentQuiz, file: currentModuleFile },
    question: q,
    answer: canonical,
    correct,
    mode: 'practice',
    elapsedMs: Date.now() - questionOpenedAt,
    file: currentModuleFile,
    confidence: confidenceSelections[q.id] || null,
  }) : null;
  showExplanation(canonical);
  showLearningFeedback(learningResult, correct);
  setupMistakeReason(q, correct, learningResult);
  finalizeConfidenceUi(q.id);
  container.classList.add('answer-locked');
  container.querySelectorAll('button,select').forEach((control) => control.disabled = true);
  questionOpenedAt = Date.now();
  updateAnswerStatus();
}
```

Move the nested `showExplanation` logic to a question-scoped helper or pass a callback so this function can reveal the existing explanation box without duplicating explanation markup.

- [ ] **Step 7: Render and bind select-text Practice**

The answer area contains only:

```html
<div class="select-text-instructions">Select one highlighted sentence or phrase in the passage.</div>
<button class="btn interaction-check" type="button" disabled>Check answer</button>
<div class="interaction-live-status" aria-live="polite"></div>
```

Click/Enter/Space on `[data-select-target]` must set exactly one selected id, update `aria-pressed`, enable Check answer, and announce `Selected: …`. It must not store/grade until Check answer is pressed.

- [ ] **Step 8: Render and bind drag-sort Practice**

Render each item as a movable card plus explicit destination buttons:

```html
<article class="drag-card" draggable="true" data-drag-item="d1">
  <p>...</p>
  <div class="drag-card-destinations" aria-label="Move this statement">
    <button type="button" data-sort-destination="important">Supports the main idea</button>
    <button type="button" data-sort-destination="irrelevant">Interesting but not central</button>
  </div>
</article>
```

Render labeled zone containers with `data-sort-zone`. Both HTML drag events and destination-button clicks update one in-memory assignment object, visually move cards, serialize with `QuestionInteractions.serializeSort`, and enable Check answer only when complete. Announce each move in `.interaction-live-status`.

- [ ] **Step 9: Render and bind drag-order Practice**

Initialize order from saved answer when complete; otherwise author item order. Each row must be draggable and also contain:

```html
<button type="button" data-order-up aria-label="Move ... up">↑</button>
<button type="button" data-order-down aria-label="Move ... down">↓</button>
```

Use `QuestionInteractions.moveOrder` for button movement, preserve focus on the moved item, serialize every changed order, and enable Check answer when all authored ids remain present.

- [ ] **Step 10: Route correctness and explanation labels through the shared helper**

Change `isAutoGraded` to include the four V1 interaction types and change `isCorrectAnswer` to:

```js
function isCorrectAnswer(q, answer) {
  if (window.QuestionInteractions?.SUPPORTED_TYPES.has(q.type)) return window.QuestionInteractions.isCorrect(q, answer);
  if (q.type === 'fill_blank' && typeof q.correct === 'string') return String(answer || '').trim().toLowerCase() === String(q.correct).trim().toLowerCase();
  return false;
}
```

In `buildExplanationHtml`, use `QuestionInteractions.formatAnswer(q, selectedAnswer)` and `QuestionInteractions.formatAnswer(q, q.correct)` for new types instead of requiring `q.options`.

- [ ] **Step 11: Add CSS for restrained, learner-first interactions**

Add classes with these requirements:

```css
.select-text-target,
.drag-card-destinations button,
.order-control,
.interaction-check {
  min-height: 44px;
}
.select-text-target { font: inherit; color: inherit; background: transparent; border: 1px solid transparent; text-align: left; border-radius: 8px; }
.select-text-target:hover,
.select-text-target:focus-visible { border-color: var(--accent); background: var(--accent-soft); }
.select-text-target.selected { border-color: var(--accent); background: var(--accent-soft); box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 20%, transparent); }
.interaction-live-status { min-height: 1.25rem; font-size: .875rem; color: var(--muted); }
.drag-card { border: 1px solid var(--line); border-radius: 12px; padding: 14px; background: var(--surface); }
.drag-card[aria-grabbed="true"] { border-color: var(--accent); }
.drag-zone { border: 1px dashed var(--line-strong); border-radius: 14px; padding: 12px; min-width: 0; }
.drag-card-destinations { display: flex; flex-wrap: wrap; gap: 8px; }
.drag-order-list { display: grid; gap: 10px; }
.drag-order-row { display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 10px; align-items: center; }
@media (max-width: 700px) {
  .drag-card-destinations { flex-direction: column; }
  .drag-card-destinations button { width: 100%; }
}
```

Use existing Chee Skool CSS variables; if `--accent-soft`/`--line-strong` do not exist, substitute existing theme variables rather than introducing broken variables.

- [ ] **Step 12: Verify Practice wiring GREEN**

```bash
node --test scripts/interaction-engines-quality.test.mjs
node --check js/module.js
npm test
```

Expected: all tests pass.

- [ ] **Step 13: Commit**

```bash
git add module.html js/module.js css/site.css scripts/interaction-engines-quality.test.mjs
git commit -m "feat: add accessible interaction controls to Practice"
```

---

### Task 4: Mock rendering, persistence, scoring, and review

**Files:**
- Modify: `test.html`
- Modify: `js/test.js`
- Modify: `js/mock-engine.js`
- Modify: `scripts/mock-test-quality.test.mjs`
- Modify: `scripts/interaction-engines-quality.test.mjs`

**Interfaces:**
- Consumes: `window.QuestionInteractions`
- `MockEngine.scoreObjectiveAttempt` must delegate canonical correctness to `QuestionInteractions.isCorrect` when available.
- `mock-excluded` is read from `module.curriculum.practiceTags`.

- [ ] **Step 1: Write failing Mock tests**

In `scripts/mock-test-quality.test.mjs`, make `loadEngine` import `question-interactions.js` before `mock-engine.js`, then add:

```js
test('mock scoring handles canonical select, sort, order, and dropdown answers', async () => {
  const engine = await loadEngine();
  const moduleMap = new Map([['m1', {
    questions: [
      {id:'q1',type:'select_text',correct:'s2',skill:{id:'R1.2',label:'Main idea'}},
      {id:'q2',type:'drag_sort',correct:'d1=yes|d2=no',interaction:{items:[{id:'d1'},{id:'d2'}]},skill:{id:'R1.2',label:'Main idea'}},
      {id:'q3',type:'drag_order',correct:'o2|o1|o3',interaction:{items:[{id:'o1'},{id:'o2'},{id:'o3'}]},skill:{id:'R1.2',label:'Main idea'}},
      {id:'q4',type:'grammar_edit',correct:'b',options:[{id:'a',text:'was'},{id:'b',text:'were'}],skill:{id:'L1.1',label:'Agreement'}}
    ]
  }]]);
  const items = [1,2,3,4].map((n) => ({moduleId:'m1',questionId:`q${n}`,category:'reading'}));
  const attempt = { mode:'objective', objective:{items,answers:{'m1:q1':'s2','m1:q2':'d2=no|d1=yes','m1:q3':'o2|o1|o3','m1:q4':'b'},flags:{}} };
  assert.equal(engine.scoreObjectiveAttempt(attempt, moduleMap).correct, 4);
});
```

Add a generation test with a fake `skill_drill` module whose `curriculum.practiceTags` contains `mock-excluded`, then assert none of 100 seeded generated forms contain it.

In `scripts/interaction-engines-quality.test.mjs`, add source assertions for `select_text`, `drag_sort`, `drag_order`, `data-sort-destination`, and `data-order-up` inside `js/test.js`.

- [ ] **Step 2: Run Mock tests and verify RED**

```bash
node --test scripts/mock-test-quality.test.mjs
node --test scripts/interaction-engines-quality.test.mjs
```

Expected: FAIL because Mock still supports only MC/evidence/grammar and scoring uses direct string equality.

- [ ] **Step 3: Load shared helper before Mock**

In `test.html`, add:

```html
<script src="js/question-interactions.js"></script>
```

before `js/mock-engine.js`.

- [ ] **Step 4: Exclude tagged active-learning modules from random Mock selection**

In `js/mock-engine.js`, add:

```js
function isMockEligible(module) {
  return !(module?.curriculum?.practiceTags || []).includes('mock-excluded');
}
```

and include `isMockEligible(m)` in candidate filters for focused/mixed selection. Do not change normal published question-module behavior otherwise.

- [ ] **Step 5: Use shared scoring**

Inside `scoreObjectiveAttempt`, replace direct equality with:

```js
const correct = root.QuestionInteractions?.isCorrect
  ? root.QuestionInteractions.isCorrect(question, value)
  : String(value) === String(question.correct);
```

- [ ] **Step 6: Render all V1 types in Mock without immediate feedback**

Refactor `answerAreaHtml(q, saved, index)` into type branches:

- MC/evidence: preserve radio rendering.
- grammar: render its `<select>` inline at `{{blank}}` when a single blank is authored; for zero-blank revision items, render one compact dropdown immediately below the unchanged revision prompt.
- select-text: render authored target buttons in the passage and a quiet instruction in the answer area.
- drag-sort: same visual cards/zones and destination buttons as Practice, but every move writes `stage.answers[key]` immediately and never shows correctness.
- drag-order: same drag + Up/Down behavior, writing the current canonical order immediately.

For select-text, make `passageHtml(module, q, saved)` question-aware and wrap only authored targets using `QuestionInteractions.segmentTextTargets`.

- [ ] **Step 7: Preserve answers on refresh and count them correctly**

Every Mock interaction change must set or delete `stage.answers[key]`, call `saveAttempt()`, then `updateObjectiveHeader()`. Use `QuestionInteractions.hasCompleteAnswer(q, value)` in section Review instead of treating every non-empty drag string as complete.

- [ ] **Step 8: Format post-test review through the shared helper**

In `objectiveAnswerReviewHtml`, replace option-only lookup for new types with:

```js
const I = window.QuestionInteractions;
const isCorrect = value != null && I.isCorrect(q, value);
const selectedDisplay = I.formatAnswer(q, value);
const correctDisplay = I.formatAnswer(q, q.correct);
```

Retain `whyWrong` only for option-based selected responses; new interaction types fall back to `q.explanation` plus the readable answer labels.

- [ ] **Step 9: Verify Mock GREEN**

```bash
node --test scripts/mock-test-quality.test.mjs
node --test scripts/interaction-engines-quality.test.mjs
node --check js/test.js
node --check js/mock-engine.js
npm test
```

Expected: all tests pass and existing 100-seed Mock blueprint tests remain green.

- [ ] **Step 10: Commit**

```bash
git add test.html js/test.js js/mock-engine.js scripts/mock-test-quality.test.mjs scripts/interaction-engines-quality.test.mjs
git commit -m "feat: support RLA interactions in Mock engine"
```

---

### Task 5: Main Idea Active Practice reference content

**Files:**
- Create: `content-src/passages/p-rla-mainidea-active-shade-route.json`
- Create: `content-src/sets/set-rla-mainidea-active-methods-v1.json`
- Modify: `scripts/interaction-engines-quality.test.mjs`

**Interfaces:**
- Produces learner module: `data/generated/modules/set-rla-mainidea-active-methods-v1.json`
- Attaches to Reading → Core Meaning → `R1.2` through normal curriculum compilation.
- Carries `curriculum.practiceTags: ["active-methods-v1","mock-excluded"]`.

- [ ] **Step 1: Add a failing content-publication test**

Append:

```js
test('Main Idea Active Practice builds with all three reference interactions and stays mock-excluded', () => {
  execFileSync(process.execPath, ['scripts/build-content.mjs'], { cwd: ROOT, stdio:'pipe' });
  const module = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/generated/modules/set-rla-mainidea-active-methods-v1.json'), 'utf8'));
  assert.deepEqual(module.questions.map((q) => q.type), ['drag_sort','select_text','multiple_choice']);
  assert.ok(module.curriculum.practiceTags.includes('mock-excluded'));
  assert.equal(module.questions[0].interaction.items.length, 4);
  assert.equal(module.questions[1].interaction.targets.length, 3);
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --test scripts/interaction-engines-quality.test.mjs
```

Expected: FAIL because the Main Idea active source files do not exist.

- [ ] **Step 3: Create the original passage**

Create `content-src/passages/p-rla-mainidea-active-shade-route.json` with this content:

```json
{
  "schemaVersion": 1,
  "id": "p-rla-mainidea-active-shade-route",
  "title": "Shade Along the Walking Route",
  "text": "A neighborhood association reviewed the route between a bus stop, a public clinic, and two apartment buildings. The route was short, but much of it crossed an open paved area with almost no shade. Residents who walked to morning appointments said the trip was manageable in cooler months but uncomfortable during hot weather. Older residents were especially likely to pause under the few existing trees before continuing.\n\nThe association first considered installing one large covered waiting area beside the bus stop. That shelter would help people while they waited, but it would not improve most of the walk to the clinic. A second proposal suggested adding several smaller shade structures at points where people already tended to stop. The structures would cost more to maintain than a single shelter, but they would spread relief across the route.\n\nAfter observing foot traffic for two weeks, the association recommended the smaller structures. The plan placed shade near the bus stop, halfway to the clinic, and beside the apartment entrance used by many older residents. The association did not claim that shade alone would solve every problem with walking in hot weather. Instead, it argued that placing shade where people actually paused would make the existing route more usable without changing its location.",
  "textType": "informational",
  "context": "community",
  "source": {"type":"original","attribution":"Original content by Chee Skool"},
  "rights": {"status":"original","holder":"Chee Skool","note":"Original instructional passage."},
  "status": "published",
  "version": 1,
  "author": "Chee Skool",
  "reviewer": "Chee Skool RLA interaction-engine V1 review"
}
```

- [ ] **Step 4: Create the three-question active set**

Create `content-src/sets/set-rla-mainidea-active-methods-v1.json` using `schemaVersion: 2`, `status: published`, `difficulty: medium`, `passageRefs: ["p-rla-mainidea-active-shade-route"]`, and:

```json
"curriculum": {
  "domain": "Core Meaning",
  "primarySkillId": "R1.2",
  "secondarySkillIds": ["R1.3"],
  "contentKind": "skill_drill",
  "learningObjective": "Build a central idea by sorting relevant details, locating supporting text, and then answering independently.",
  "topicLabel": "Main Idea Active Practice",
  "practiceTags": ["active-methods-v1", "mock-excluded"]
}
```

Question 1:

```json
{
  "id":"q1",
  "type":"drag_sort",
  "prompt":"Sort each statement by whether it supports the passage's central idea.",
  "primarySkillId":"R1.2",
  "secondarySkillIds":["R1.3"],
  "familyId":"mainidea.whole.implied",
  "difficulty":"medium",
  "dok":2,
  "interaction":{
    "items":[
      {"id":"d1","text":"Residents often paused at the few existing trees during hot weather."},
      {"id":"d2","text":"The route connected a bus stop, a clinic, and apartment buildings."},
      {"id":"d3","text":"Several smaller shade structures could provide relief at multiple points along the walk."},
      {"id":"d4","text":"The association observed foot traffic for two weeks."}
    ],
    "zones":[
      {"id":"supports","label":"Supports the central idea"},
      {"id":"context","label":"Interesting context, but not central support"}
    ]
  },
  "correct":"d1=supports|d2=context|d3=supports|d4=context",
  "explanation":{
    "answer":"The strongest supporting details show why shade was needed and why several locations fit the route better.",
    "whyCorrect":"The central idea focuses on placing shade where walkers actually need relief. Residents pausing under trees shows the need, and distributed structures address that need. The route endpoints and observation length provide context but do not themselves explain the recommendation.",
    "quickTip":"A supporting detail should help explain or prove the passage's big point, not merely be true."
  }
}
```

Question 2:

```json
{
  "id":"q2",
  "type":"select_text",
  "prompt":"Select the sentence that best supports the idea that the final plan was based on how residents actually used the route.",
  "primarySkillId":"R1.2",
  "secondarySkillIds":["R1.3"],
  "familyId":"mainidea.whole.implied",
  "difficulty":"medium",
  "dok":2,
  "interaction":{
    "selectionMode":"sentence",
    "targets":[
      {"id":"s1","text":"The route was short, but much of it crossed an open paved area with almost no shade."},
      {"id":"s2","text":"After observing foot traffic for two weeks, the association recommended the smaller structures."},
      {"id":"s3","text":"The association did not claim that shade alone would solve every problem with walking in hot weather."}
    ]
  },
  "correct":"s2",
  "explanation":{
    "answer":"After observing foot traffic for two weeks, the association recommended the smaller structures.",
    "whyCorrect":"This sentence directly connects observation of real walking behavior to the recommendation. The other choices describe the route or limit the claim, but they do not show how use of the route shaped the decision.",
    "quickTip":"For evidence questions, prefer the sentence that directly connects the stated reason to the decision or conclusion."
  }
}
```

Question 3 is normal multiple choice:

```json
{
  "id":"q3",
  "type":"multiple_choice",
  "prompt":"Which statement best expresses the central idea of the passage?",
  "primarySkillId":"R1.2",
  "familyId":"mainidea.whole.implied",
  "difficulty":"medium",
  "dok":2,
  "options":[
    {"id":"a","text":"The neighborhood should replace walking routes with transportation during hot weather.","distractorType":"unsupported_extension","whyWrong":"The passage discusses improving an existing walking route, not replacing it."},
    {"id":"b","text":"A single large bus-stop shelter would be easier to maintain than several smaller structures.","distractorType":"too_narrow","whyWrong":"Maintenance is one trade-off, not the overall point of the passage."},
    {"id":"c","text":"Observing where people actually paused helped the association choose distributed shade that could make an existing hot-weather walking route more usable."},
    {"id":"d","text":"Older residents were the only people who found the walking route uncomfortable.","distractorType":"changed_condition","whyWrong":"Older residents were especially likely to pause, but other residents also described the route as uncomfortable."}
  ],
  "correct":"c",
  "explanation":{
    "answer":"C",
    "whyCorrect":"Choice C covers the observed need, the reasoning behind several shade locations, and the purpose of making the existing route more usable. It is broad enough to cover the whole passage without adding a claim the text does not make.",
    "quickTip":"The best central idea covers the passage's problem, response, and purpose without becoming too narrow or too broad."
  }
}
```

Give all three questions a normal `difficultyProfile`, `points: 1`, and `estimatedSeconds` values consistent with existing medium Core Meaning sets so validation remains clean.

- [ ] **Step 5: Validate and build**

```bash
npm run content:validate
npm run content:build
node --test scripts/interaction-engines-quality.test.mjs
```

Expected: `0 error(s), 0 warning(s)` and the Main Idea Active Practice module is generated and attached to `R1.2`.

- [ ] **Step 6: Verify it is visible in Main Idea but excluded from Mock**

Use Node assertions against `data/generated/curriculum.json` to confirm the `R1.2` skill checks include `set-rla-mainidea-active-methods-v1`, then run:

```bash
node --test scripts/mock-test-quality.test.mjs
```

Expected: active set is visible in skill practice, and no seeded Mock form selects it.

- [ ] **Step 7: Commit**

```bash
git add content-src/passages/p-rla-mainidea-active-shade-route.json content-src/sets/set-rla-mainidea-active-methods-v1.json scripts/interaction-engines-quality.test.mjs
git commit -m "content: add Main Idea active practice reference set"
```

---

### Task 6: Release integration, public build, and verification

**Files:**
- Modify: `release.json`
- Modify: `js/app.js`
- Modify: `sw.js`
- Modify: learner-facing `*.html` meta release values
- Modify: `scripts/navigation-library-quality.test.mjs`
- Modify: `STUDO_MASTER_STATUS.md`
- Test: all existing QA suites plus public build

**Interfaces:**
- Produces release: `0.7.0-alpha.6`
- Public build must include `js/question-interactions.js` because `module.html` and `test.html` depend on it.

- [ ] **Step 1: Add failing release/public-shell assertions**

Update `scripts/navigation-library-quality.test.mjs` to expect `0.7.0-alpha.6` and assert `sw.js` app shell includes `js/question-interactions.js` if the service worker caches dependency scripts explicitly.

- [ ] **Step 2: Run release test and verify RED**

```bash
node --test scripts/navigation-library-quality.test.mjs
```

Expected: FAIL on old `0.7.0-alpha.5` metadata/cache.

- [ ] **Step 3: Bump release metadata consistently**

Change:

```json
{"release":"0.7.0-alpha.6", ...}
```

in `release.json`, set:

```js
const STUDO_RELEASE = "0.7.0-alpha.6";
```

in `js/app.js`, update every learner `<meta name="studo-release">`, and regenerate/update `sw.js` cache name to `studo-shell-0.7.0-alpha.6` through the project's existing build path rather than hand-editing generated sections when possible.

- [ ] **Step 4: Update project status**

In `STUDO_MASTER_STATUS.md`, record:

```markdown
### RLA Interaction Engines V1
- Embedded dropdown: implemented in Practice + Mock.
- Select text: implemented with authored targets.
- Drag sort/order: implemented with drag plus non-drag controls.
- Main Idea Active Practice: published to Practice.
- Mock eligibility: active-practice set remains `mock-excluded` pending browser/device QA.
```

and set current release to `0.7.0-alpha.6`.

- [ ] **Step 5: Run the complete verification gate**

Run fresh:

```bash
npm test
npm run content:validate
npm run content:build
npm run public:build
find js scripts -type f \( -name '*.js' -o -name '*.mjs' \) -print0 | xargs -0 -n1 node --check
```

Expected:
- all automated tests PASS;
- content validation `0 error(s), 0 warning(s)`;
- generated content includes Main Idea Active Practice;
- public build exits 0;
- all JavaScript/MJS syntax checks exit 0.

- [ ] **Step 6: Inspect the public package contract**

Confirm the public build contains:

```text
module.html
test.html
js/question-interactions.js
js/module.js
js/test.js
js/mock-engine.js
```

and does not expose internal authoring pages already excluded by Alpha hardening.

- [ ] **Step 7: Manual browser/device QA checklist**

On deployed Chee Skool, test the exact Main Idea Active Practice on desktop and phone:

1. drag-sort with mouse/touch;
2. complete the same sort **without dragging**, using destination buttons;
3. keyboard through every sort control;
4. select-text by click/tap and keyboard;
5. turn Highlight on and verify highlighting outside answer targets still works without stealing select-text answers;
6. refresh before Check answer and after Check answer;
7. answer with Sure/Unsure/Guessing and verify Progress signal still records;
8. use 200% browser zoom and a narrow phone viewport;
9. test inline grammar dropdown in an existing Language practice;
10. create a temporary/manual Mock containing each new type and verify answer persistence, section review, and post-test readable answers;
11. verify the Main Idea active set does **not** appear in randomly generated Full Mock/Objective forms while tagged `mock-excluded`.

Record any browser-specific failure before removing the exclusion tag.

- [ ] **Step 8: Commit release candidate**

```bash
git add release.json js/app.js sw.js '*.html' scripts/navigation-library-quality.test.mjs STUDO_MASTER_STATUS.md
git commit -m "release: Chee Skool 0.7.0-alpha.6 interaction candidate"
```

---

## Plan Self-Review

- **Spec coverage:** Shared answer model, all four objective interaction families, Practice feedback, Mock persistence/review/scoring, accessible non-drag alternatives, explicit select targets, validation/compiler rules, Main Idea reference content, and Mock exclusion are each assigned to a task.
- **Scope:** Multi-blank dropdowns, arbitrary text offsets, image hotspots, freeform drawing, and broad conversion of the existing bank are intentionally excluded from V1.
- **Type consistency:** `QuestionInteractions` methods and canonical answer formats match the approved spec: option/target id strings, sorted `item=zone` mappings, and `id|id|id` order strings.
- **Release safety:** Main Idea Active Practice remains visible in Practice while `mock-excluded` prevents unverified interaction content from entering random Mock generation.
