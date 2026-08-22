# Extended Response V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a six-unit GED RLA Extended Response training system with focused component practice, eight original paired-source prompts, a 45-minute writing simulation, persistent local drafts, and transparent self-review against the three 0-2 rubric traits.

**Architecture:** Keep `W1.1`-`W1.12` as internal tracking skills while adding six learner-facing units in the existing curriculum config. Objective component exercises remain normal generated modules; full ER prompts use a dedicated canonical prompt registry compiled to `data/generated/er-prompts.json`, and a new `extended-response.html` + `js/extended-response.js` workspace handles sources, planning, timed/untimed drafting, local persistence, and self-review without claiming an automatic score.

**Tech Stack:** Static HTML/CSS/vanilla JS, Node.js content builder/validator/tests, JSON canonical content under `content-src/`, Python + ReportLab for resource PDFs.

**Spec:** `docs/superpowers/specs/2026-08-22-extended-response-v1-design.md`

## Global Constraints

- Extended Response V1 must not claim AI, official, or machine-verified essay scoring.
- All twelve `W1.*` skills remain available for tracking underneath six learner-facing units.
- Full simulation uses a 45:00 timer; untimed practice remains available.
- Self-assigned trait scores are stored separately from objective quiz mastery.
- `content-src/` remains canonical; `data/generated/` must be reproducible after deletion.
- Extended Response remains preview until all publication gates in the spec pass.
- No server accounts, database sync, plagiarism detection, grammar auto-rewrite, or official-score prediction.
- PDFs follow the current Studo Inter/lavender/single-column accessibility standard and must be rendered at 200 DPI for visual QA.

---

### Task 1: Learner Unit Model and ER Build Outputs

**Files:**
- Modify: `content-src/config/rla.curriculum.json`
- Modify: `scripts/build-content.mjs`
- Create: `scripts/extended-response-quality.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: existing curriculum `tracks[].domains[].units` builder behavior.
- Produces: six `extended-response` units plus `curriculum.extendedResponsePractice` entries for full prompts.

- [ ] **Step 1: Write failing unit/build tests** asserting exactly six learner units map all twelve W1 skills once, preview remains hidden before publication, and the builder recognizes `contentKind: "extended_response_practice"` without placing those prompts under unit checks.
- [ ] **Step 2: Run `node --test scripts/extended-response-quality.test.mjs`** and confirm failure because units/output do not exist.
- [ ] **Step 3: Add six units to curriculum config** with IDs `understand-map-sources`, `choose-stronger-argument`, `thesis-evidence`, `analyze-not-summarize`, `organize-develop-revise`, and `full-extended-response`.
- [ ] **Step 4: Extend `buildCurriculum()`** with an `extendedResponsePractice` collection and exclude `extended_response_practice` from focused skill/unit checks.
- [ ] **Step 5: Re-run the ER test** and confirm the model/build assertions pass while later content assertions remain red.

### Task 2: Focused ER Component Practice

**Files:**
- Create: `content-src/sets/set-rla-er-*.json` (six focused sets)
- Create: `content-src/passages/p-rla-er-*.json` as needed for short paired-source excerpts
- Modify: `content-src/config/rla.question-families.v1.json`
- Test: `scripts/extended-response-quality.test.mjs`

**Interfaces:**
- Consumes: standard schema-v2 set/passages and `unitId` routing.
- Produces: one eight-question focused module per learner unit (48 objective questions total) covering all W1 skills, with the W1.12 unit using planning/review recognition tasks rather than pretending to grade prose.

- [ ] **Step 1: Add failing tests** for six focused modules, eight questions per unit, all W1 skills covered, no answer-position/generic-feedback warnings, and one defensible answer per objective item.
- [ ] **Step 2: Run the ER tests** and verify those assertions fail on missing sets.
- [ ] **Step 3: Author six focused modules** using task families such as task interpretation, argument mapping, stronger-argument selection, thesis quality, evidence selection, summary-vs-analysis, reasoning/assumption analysis, paragraph organization, revision, and editing.
- [ ] **Step 4: Run `npm run content:validate` and the ER tests**; fix only content defects exposed by evidence.

### Task 3: Eight Canonical Full ER Prompts

**Files:**
- Create: `content-src/er-prompts/er-*.json` (eight files)
- Create: `content-src/er-prompts/index.json`
- Modify: `scripts/validate-content.mjs`
- Modify: `scripts/build-content.mjs`
- Test: `scripts/extended-response-quality.test.mjs`

**Interfaces:**
- Each prompt JSON contains `id`, `title`, `topic`, `status`, `sourceA`, `sourceB`, `prompt`, `strongerSource`, `authoringKey`, `modelResponse`, `annotations`, and `revisionPrompts`.
- Builder produces `data/generated/er-prompts.json` containing learner-safe source/prompt data plus post-submission exemplars; authoring keys are retained only where needed for QA, not exposed before submission by UI.

- [ ] **Step 1: Add failing tests** requiring eight published prompts, alternating stronger source distribution (4 A / 4 B), non-empty paired sources, documented authoring keys, model responses, and topic diversity.
- [ ] **Step 2: Run tests** and confirm missing-prompt failure.
- [ ] **Step 3: Extend validator** to reject incomplete prompt records, identical/near-identical source positions, missing authoring rationale, missing models, and prompt IDs duplicated across files.
- [ ] **Step 4: Author eight original paired-source prompts** across transportation, renewable energy, workplace automation, school policy, environmental regulation, infrastructure, public health, and community development.
- [ ] **Step 5: Build `er-prompts.json`** from canonical sources and re-run tests/validator.

### Task 4: ER Resource PDFs

**Files:**
- Create: `scripts/extended_response_pdf_content.py`
- Create: `scripts/generate_extended_response_pdfs.py`
- Create: `assets/resources/er-*.pdf` (18 PDFs)
- Modify: `content-src/resources/rla.resources.json`
- Test: `scripts/extended-response-quality.test.mjs`

**Interfaces:**
- Produces one Study Guide + two Workbooks per learner unit.
- Resource entries use `trackId: "extended-response"`, matching `unitId`, published status only after PDF QA.

- [ ] **Step 1: Add failing tests** requiring exactly 18 ER PDFs/resources and the 1-guide/2-workbook structure for every unit.
- [ ] **Step 2: Run tests** and verify missing-resource failure.
- [ ] **Step 3: Author PDF content** following Learning goal -> explanation -> contrast -> exam wording -> method -> worked example -> traps -> diagnostic help -> quick check.
- [ ] **Step 4: Generate PDFs** with Inter, lavender `#51439C`, readable single-column layout, and selectable text.
- [ ] **Step 5: Render all PDFs at 200 DPI** with `/home/oai/skills/pdfs/scripts/render_pdf.py`, inspect every page, and correct clipping/overlap/glyph issues.
- [ ] **Step 6: Register all 18 resources** and re-run resource-resolution tests.

### Task 5: Full Extended Response Workspace

**Files:**
- Create: `extended-response.html`
- Create: `js/extended-response.js`
- Modify: `css/style.css`
- Modify: `js/domain.js`
- Test: `scripts/extended-response-quality.test.mjs`

**Interfaces:**
- URL: `extended-response.html?prompt=<id>&mode=timed|untimed&return=<relative-url>`.
- Local state key: `sq:er:<promptId>:<mode>` containing `{essay, planner, startedAt, remainingSeconds, submittedAt, selfScores, revisionComplete}`.
- Prompt data source: `data/generated/er-prompts.json`.

- [ ] **Step 1: Add failing source-contract tests** asserting the page/script exist; timer constant is 2700 seconds; source switching does not recreate editor state; local-storage key is prompt/mode scoped; and UI copy contains no `AI Score`/`Official GED Score` claims.
- [ ] **Step 2: Run tests** and confirm missing workspace failure.
- [ ] **Step 3: Build page shell** with Source A/B tabs, optional planner, essay textarea, word count, timed/untimed mode label, submit action, and accessible keyboard navigation.
- [ ] **Step 4: Implement state persistence** using `window.StudoSafeStorage` when available, with recovery on refresh.
- [ ] **Step 5: Implement timer** so timed mode starts at 45:00, survives source/planner interactions and refresh, and clearly locks editing at zero; untimed mode has no countdown.
- [ ] **Step 6: Implement post-submit review** with three learner-selected 0/1/2 trait scores, observable checklists, revision questions, and revealable model/annotations only after submission.
- [ ] **Step 7: Add domain links** that route full prompt cards to this workspace instead of normal `module.html`.

### Task 6: ER Attempt History and Separation from Objective Mastery

**Files:**
- Modify: `js/extended-response.js`
- Modify: `js/progress.js`
- Test: `scripts/extended-response-quality.test.mjs`

**Interfaces:**
- History key: `sq:er:history` array of `{promptId, mode, submittedAt, selfScores, revisionComplete}`.
- Objective W1 quiz attempts continue through existing Learning/Store APIs; self-scores are displayed separately and never fed to objective skill percentages.

- [ ] **Step 1: Add failing tests** for separate history storage and absence of calls that record self-scores as objective quiz answers.
- [ ] **Step 2: Run tests** and confirm failure.
- [ ] **Step 3: Save submitted attempts** into bounded local history and allow prompt revisit/revision.
- [ ] **Step 4: Add an Extended Response section on Progress** showing attempt count, timed/untimed labels, provisional trait self-scores, and revision status with explicit `Self-review` wording.
- [ ] **Step 5: Re-run tests** and confirm objective mastery separation.

### Task 7: Publish, Clean Build, and Release QA

**Files:**
- Modify: `content-src/config/rla.curriculum.json`
- Modify: `scripts/foundation-qa.test.mjs`
- Create: `EXTENDED_RESPONSE_V1_QA.md`

**Interfaces:**
- Publication state changes from `preview` to `published` only after Tasks 1-6 are green.

- [ ] **Step 1: Keep ER preview and run all tests**; verify it is absent from learner navigation while development is incomplete.
- [ ] **Step 2: Change ER to `published`** only after all content/UI/resource tests pass.
- [ ] **Step 3: Update Foundation publication contract** so Reading, Arguments, Language, and Extended Response are published and no obsolete prototype Writing module leaks into navigation.
- [ ] **Step 4: Delete `data/generated/` and run `npm run content:check`** to prove canonical-source rebuild.
- [ ] **Step 5: Run `npm test`** and require zero failures across all suites.
- [ ] **Step 6: Run `node --check` on every JS/MJS file** and require zero syntax failures.
- [ ] **Step 7: Serve locally and smoke-test** curriculum, ER unit pages, focused module, full ER timed/untimed workspace, generated prompt data, and representative PDFs; all requests must return HTTP 200.
- [ ] **Step 8: Write `EXTENDED_RESPONSE_V1_QA.md`** with counts, warnings, prompt balance, PDF/render results, timer/persistence tests, and known non-blocking gaps.
- [ ] **Step 9: Package the complete project review ZIP** without Git metadata and verify ZIP integrity before handoff.
