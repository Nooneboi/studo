# Phase 3E Extended Response Production Depth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deliberate writing production practice to the existing Extended Response workspace and add two denser paired-source full ER prompts without creating fake scoring, a second writing engine, or Mock-only content.

**Architecture:** Add canonical `content-src/er-tasks/*.json` files, validate/build them into learner-safe `data/generated/er-production-tasks.json`, expose task cards in the ER domain, and route `extended-response.html?task=<id>` into a focused Production Lab rendering mode inside `js/extended-response.js`. Full ER prompt mode remains unchanged. Production tasks save local drafts under task-specific keys and reveal criteria/model/revision prompts only after learner submission.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js ESM tests, JSON canonical authoring, local `StudoSafeStorage`, existing ER workspace and build/public pipeline.

**Spec:** `docs/superpowers/specs/2026-08-25-phase3-closeout-design.md`

## Global Constraints

- Production writing stays in the Extended Response workspace, not the normal quiz engine.
- Production Lab is untimed Practice only; no Mock/Skill Check/Train evidence.
- No automatic score, percentage, trait level, pass/fail prediction, or AI rewrite.
- Success criteria/model/revision prompts are hidden until submission.
- Keep the existing eight full ER prompts unchanged unless QA finds a defect.
- Add exactly six focused production tasks and two denser full ER prompts.
- New full ER source pairs target roughly 550–650 combined source words.
- Canonical authoring-only keys must not ship publicly.

---

### Task 1: Canonical ER Production Task contract and validation

**Files:**
- Create: `content-src/er-tasks/er-task-evaluative-thesis.json`
- Create: `content-src/er-tasks/er-task-exact-evidence.json`
- Create: `content-src/er-tasks/er-task-evidence-analysis.json`
- Create: `content-src/er-tasks/er-task-summary-to-analysis.json`
- Create: `content-src/er-tasks/er-task-body-development.json`
- Create: `content-src/er-tasks/er-task-revision-focus-clarity.json`
- Modify: `scripts/validate-content.mjs`
- Create: `scripts/er-production-lab-quality.test.mjs`

**Interfaces:**
- Consumes: existing ER prompt IDs and canonical W1.* skill IDs.
- Produces: validated `validation.erTasks` objects with fields `id,title,promptId,skillIds,taskType,instruction,successCriteria,modelResponse,revisionPrompts,status,version,author,reviewer`; optional `sourceFocus`; optional authoring-only `authoringNotes`.

- [ ] **Step 1: Write RED tests for the six-task canonical contract**

Create test assertions equivalent to:

```js
const TASK_DIR = path.join(ROOT, 'content-src', 'er-tasks');
const tasks = fs.readdirSync(TASK_DIR).filter((f) => f.endsWith('.json')).map((f) => readJson(path.join(TASK_DIR, f)));
assert.equal(tasks.length, 6);
assert.deepEqual(new Set(tasks.map((t) => t.taskType)), new Set([
  'evaluative_thesis','exact_evidence','evidence_analysis',
  'summary_to_analysis','body_development','revision_focus_clarity'
]));
for (const task of tasks) {
  assert.equal(task.status, 'published');
  assert.ok(task.promptId);
  assert.ok(task.skillIds.length >= 1);
  assert.ok(task.instruction.length >= 30);
  assert.ok(task.successCriteria.length >= 3 && task.successCriteria.length <= 5);
  assert.ok(task.modelResponse.length >= 40);
  assert.ok(task.revisionPrompts.length >= 1);
}
```

Also assert that authoring-only notes are absent from generated learner data once build support exists.

- [ ] **Step 2: Run and verify RED**

Run: `node --test scripts/er-production-lab-quality.test.mjs`

Expected: FAIL because `content-src/er-tasks/` does not yet exist.

- [ ] **Step 3: Add six original canonical tasks**

Use existing prompts to avoid duplicating full source text. Required skill mapping:

```text
evaluative_thesis -> W1.4
exact_evidence -> W1.5
evidence_analysis -> W1.6 (+ W1.7 if appropriate)
summary_to_analysis -> W1.6
body_development -> W1.8 + W1.9
revision_focus_clarity -> W1.10 + W1.11
```

Each task must contain specific learner instruction, 3–5 success criteria, one concise model response, and revision prompts. Model responses must demonstrate rather than over-explain.

- [ ] **Step 4: Extend `validate-content.mjs`**

Add `erTaskFiles = await jsonFiles(path.join(SRC, 'er-tasks'))`. Validate:

```text
stable unique id
published status
promptId exists in canonical ER prompts
all skillIds exist and start with W1.
taskType is one of the six controlled values
instruction non-empty
successCriteria array length 3–5
modelResponse non-empty
revisionPrompts non-empty
```

Return `erTasks` alongside `erPrompts` from `validateContent`.

- [ ] **Step 5: Run validator/test GREEN**

```bash
node --test scripts/er-production-lab-quality.test.mjs
npm run content:validate
```

Expected: canonical task contract passes and validation remains 0 errors / 0 warnings.

---

### Task 2: Build learner-safe ER Production data and curriculum cards

**Files:**
- Modify: `scripts/build-content.mjs`
- Modify: `scripts/build-public.mjs`
- Modify: `scripts/er-production-lab-quality.test.mjs`

**Interfaces:**
- Consumes: `validation.erTasks` from Task 1.
- Produces: `data/generated/er-production-tasks.json` with learner-safe tasks and `curriculum.extendedResponseProduction` card metadata.

- [ ] **Step 1: Add RED generated-data assertions**

Assert after `npm run content:build`:

```js
const generated = readJson('data/generated/er-production-tasks.json');
assert.equal(generated.tasks.length, 6);
assert.ok(generated.tasks.every((t) => !('authoringNotes' in t)));
const curriculum = readJson('data/generated/curriculum.json');
assert.equal(curriculum.extendedResponseProduction.length, 6);
```

- [ ] **Step 2: Run and verify RED**

Run: `npm run content:build && node --test scripts/er-production-lab-quality.test.mjs`

Expected: FAIL because generated task data/cards do not exist.

- [ ] **Step 3: Implement learner build support**

In `build-content.mjs`:

```js
curriculum.extendedResponseProduction = (validation.erTasks || []).map((task) => ({
  id: task.id,
  title: task.title,
  taskType: task.taskType,
  promptId: task.promptId,
  skillIds: task.skillIds,
}));

const learnerErTasks = (validation.erTasks || []).map(({ authoringNotes, ...task }) => task);
await fs.writeFile(
  path.join(OUT, 'er-production-tasks.json'),
  JSON.stringify({ schemaVersion: 1, builtAt: new Date().toISOString(), tasks: learnerErTasks }, null, 2) + '\n',
  'utf8'
);
```

Add `er-production-tasks.json` to `PUBLIC_GENERATED_FILES` in `build-public.mjs` next to `er-prompts.json`.

- [ ] **Step 4: Run GREEN checks**

```bash
npm run content:build
node --test scripts/er-production-lab-quality.test.mjs
```

Expected: generated tasks and curriculum cards exist; authoring notes absent.

---

### Task 3: Production Lab workspace mode

**Files:**
- Modify: `js/extended-response.js`
- Modify: `css/site.css`
- Modify: `scripts/er-production-lab-quality.test.mjs`

**Interfaces:**
- Consumes: URL `?task=<taskId>` and generated `er-production-tasks.json` + `er-prompts.json`.
- Produces: untimed focused writing mode with task draft persistence, gated review reveal, revision, and completion; existing `?prompt=<promptId>&mode=...` behavior stays unchanged.

- [ ] **Step 1: Add RED source-contract assertions**

Read `js/extended-response.js` and assert it references:

```text
er-production-tasks.json
URLSearchParams(...).get("task")
production task-specific storage prefix
successCriteria only in post-submit review rendering
```

Also assert no Production Lab code calls `upsertHistory()` or mock attempt integration.

- [ ] **Step 2: Run and verify RED**

Run: `node --test scripts/er-production-lab-quality.test.mjs`

Expected: FAIL because task mode does not exist.

- [ ] **Step 3: Add task-mode bootstrap**

At startup, resolve:

```js
const taskId = params.get('task');
if (taskId) {
  await initProductionTask(taskId);
  return;
}
```

`initProductionTask(taskId)` fetches both generated task and ER prompt data, resolves the referenced prompt, sets appbar copy to `Production Lab`, timer text to `Untimed`, and renders the existing source tabs plus one task textarea.

- [ ] **Step 4: Add task storage and review state**

Use a task-specific key such as:

```js
const key = `studo.er.production.${task.id}`;
```

Persist only:

```js
{ draft, submittedAt, revisionComplete }
```

On initial view, do not render criteria/model/revision prompts. On `Submit for review`, lock nothing permanently; render criteria/model/revision prompts below the task, then offer `Revise response`. Revision reopens editing and preserves the prior draft.

- [ ] **Step 5: Add focused CSS without changing full ER layout**

Add classes such as:

```css
.er-production-instruction { ... }
.er-production-criteria { ... }
.er-production-model { ... }
.er-production-actions { ... }
```

Reuse existing `.er-workspace`, `.er-source-panel`, `.er-editor-block`, and responsive behavior. Do not create a separate page shell.

- [ ] **Step 6: Run GREEN tests**

```bash
node --test scripts/er-production-lab-quality.test.mjs
node --test scripts/extended-response-quality.test.mjs
```

Expected: Production Lab contract passes; existing full ER workspace tests remain green.

---

### Task 4: ER domain navigation

**Files:**
- Modify: `js/domain.js`
- Modify: `css/site.css`
- Modify: `scripts/er-production-lab-quality.test.mjs`

**Interfaces:**
- Consumes: `curriculum.extendedResponseProduction` and existing `extendedResponsePractice`.
- Produces: two clearly separated learner sections: `Production Lab` and `Full Extended Response Practice`.

- [ ] **Step 1: Add RED navigation assertions**

Assert `js/domain.js` reads `curriculum.extendedResponseProduction`, renders heading `Production Lab`, and builds links `extended-response.html?task=<id>&return=...`.

- [ ] **Step 2: Run RED test**

Run: `node --test scripts/er-production-lab-quality.test.mjs`

Expected: FAIL because the domain page only has full ER practice.

- [ ] **Step 3: Implement Production Lab cards**

Render Production Lab before Full Extended Response Practice with concise copy:

```text
Production Lab
Practice one part of the response at a time.
```

Each card shows task title and a single `Practice` action. Keep full ER cards and their Untimed/Timed actions unchanged.

- [ ] **Step 4: Run GREEN tests**

```bash
node --test scripts/er-production-lab-quality.test.mjs
node --test scripts/navigation-library-quality.test.mjs
```

---

### Task 5: Two denser full ER prompts

**Files:**
- Create: `content-src/er-prompts/er-night-delivery-window.json`
- Create: `content-src/er-prompts/er-vacant-lot-housing.json`
- Modify: `scripts/extended-response-quality.test.mjs`

**Interfaces:**
- Consumes: existing full ER prompt schema.
- Produces: ten total published full ER prompts, with the two new prompts each at 550–650 combined source words and opposite stronger-source positions across the pair.

- [ ] **Step 1: Add RED prompt-bank assertions**

Add tests:

```js
assert.equal(prompts.length, 10);
for (const id of ['er-night-delivery-window', 'er-vacant-lot-housing']) {
  const prompt = prompts.find((p) => p.id === id);
  assert.ok(prompt);
  const words = wordCount(prompt.sourceA.text) + wordCount(prompt.sourceB.text);
  assert.ok(words >= 550 && words <= 650);
  assert.ok(prompt.modelResponse.length >= 500);
  assert.ok(prompt.annotations.length >= 4);
  assert.ok(prompt.revisionPrompts.length >= 4);
}
assert.notEqual(
  prompts.find((p) => p.id === 'er-night-delivery-window').strongerSource,
  prompts.find((p) => p.id === 'er-vacant-lot-housing').strongerSource
);
```

- [ ] **Step 2: Run RED**

Run: `node --test scripts/extended-response-quality.test.mjs`

Expected: FAIL because only eight prompts exist.

- [ ] **Step 3: Author `er-night-delivery-window.json`**

Topic: downtown freight / business operations. Two defensible arguments about adopting a shared evening delivery window. One source should have better outcome measurements and implementation evidence; the other should still contain legitimate business/noise/safety concerns. Combined source target 550–650 words. Include strongerSource, authoringKey, modelResponse, annotations, revisionPrompts.

- [ ] **Step 4: Author `er-vacant-lot-housing.json`**

Topic: public land / modular housing. Two defensible arguments about leasing a vacant public parcel for a time-limited modular housing project versus retaining it for another planned public use. Use different stronger-source position from Task 3. Combined source target 550–650 words; avoid straw-man wording and preserve uncertainties/qualifiers.

- [ ] **Step 5: Run prompt/validator checks**

```bash
node --test scripts/extended-response-quality.test.mjs
npm run content:validate
npm run content:build
```

Expected: ten-prompt bank passes; authoringKey/strongerSource remain excluded from learner `er-prompts.json`.

---

### Task 6: Alpha 25 release checkpoint

**Files:**
- Modify: `package.json`
- Modify: `STUDO_MASTER_STATUS.md`
- Modify release/version metadata discovered by existing release tests

**Interfaces:**
- Consumes: Tasks 1–5.
- Produces: version-synchronized Alpha 25 checkpoint with ER Production Lab and ten full ER prompts.

- [ ] **Step 1: Add `scripts/er-production-lab-quality.test.mjs` to `npm test`**

Place after `scripts/extended-response-quality.test.mjs` so canonical/full ER tests run before Production Lab integration tests.

- [ ] **Step 2: Update status/version**

Record:

```text
Phase 3E Extended Response production depth complete.
Six focused Production Lab tasks added in the existing ER workspace.
Two denser full ER prompts added; full prompt bank now 10.
No automatic ER score introduced.
Next: Phase 3 whole-system closeout review.
```

Set release to `0.7.0-alpha.25`.

- [ ] **Step 3: Run full Alpha 25 verification**

```bash
npm test
npm run content:validate
npm run content:build
npm run public:build -- --out /mnt/data/alpha25_public_verify
```

Expected: 0 failures; 0 validation errors/warnings; learner build includes `er-production-tasks.json`; no canonical `content-src/er-tasks` directory in public output.

- [ ] **Step 4: Commit in a Git checkout**

```bash
git add content-src/er-tasks content-src/er-prompts scripts/validate-content.mjs scripts/build-content.mjs scripts/build-public.mjs scripts/er-production-lab-quality.test.mjs scripts/extended-response-quality.test.mjs js/extended-response.js js/domain.js css/site.css package.json STUDO_MASTER_STATUS.md
git commit -m "feat: add extended response production lab"
```
