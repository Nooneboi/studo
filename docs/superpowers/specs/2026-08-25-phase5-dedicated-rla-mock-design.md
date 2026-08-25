# Phase 5 Dedicated RLA Mock Design

**Date:** 2026-08-25
**Status:** Approved design draft for user review
**Baseline:** Chee Skool `0.7.0-alpha.29`
**Scope:** Phase 5 only — dedicated unseen full-length RLA Mock system

## Goal

Replace the temporary Practice-bank full-mock fallback with a dedicated, unseen, mock-only RLA bank that can deliver at least three substantially non-overlapping full forms while preserving Chee Skool's learner-mode separation:

> Learn → Practice → Train → Skill Check → Mock → Progress

Mock measures broad independent performance. It does not teach during the attempt, reuse Practice/Skill Check content, estimate a GED scaled score, predict pass/fail, or claim psychometric equivalence with an official GED form.

## Official public guidance used as the external design constraint

The design is based on current GED public guidance checked on 2026-08-25:

- RLA duration: 150 minutes, 3 sections, one 45-minute Extended Response, and a 10-minute break between Parts 2 and 3.
- A current GED article describes the RLA test as about 46 objective questions plus one essay.
- RLA is composed of passage sets; reading texts are 400–900 words with 6–8 associated questions and no standalone objective items.
- Published reporting categories are approximately:
  - Category 1 — Analyzing and creating text features and technique: 35%
  - Category 2 — Using evidence to understand, analyze and create arguments: 45%
  - Category 3 — Applying knowledge of English language conventions and usage: 20%
- Informational/literary stimulus balance is approximately 75% / 25%.
- U.S. founding documents and the broader “Great American Conversation” are required study/assessment content.
- Editing passages do not exceed 450 words.
- ER uses two source texts, no more than 650 words total, and 45 minutes.
- Public item-type guidance includes multiple choice, drag-and-drop, select-area/hot-spot style interactions, embedded drop-down editing, and Extended Response.

These constraints guide Chee Skool's original GED-style mock design. They do **not** establish official item counts by reporting category, official form equivalence, or official scoring.

## Core design decision: three fixed forms, not random assembly

Phase 5 will ship three deliberately authored and QA'd forms internally identified as:

- `rla-mock-form-a`
- `rla-mock-form-b`
- `rla-mock-form-c`

Learners do not need to see the A/B/C labels. The fixed-form model is chosen over random generation because it allows every form to be reviewed for source coherence, difficulty, reporting-category coverage, item types, text-type balance, civics/GAC coverage, editing quality, ER quality, and timing.

The source format must remain extensible so future forms can be added without rewriting the engine.

## Form structure

Each form preserves the current full-mock timing model:

| Stage | Time | Objective items |
| --- | ---: | ---: |
| Part 1 | 27 min | 14 |
| Part 2 — ER | 45 min | 1 writing task |
| Break | 10 min | — |
| Part 3 | 65 min | 32 |
| **Total objective** |  | **46** |

### Objective source-set structure

No standalone filler questions are allowed in the dedicated bank.

Each form contains **7 coherent objective source sets**:

**Part 1**
- Set 1: 7 questions
- Set 2: 7 questions

**Part 3**
- Set 3: 8 questions
- Set 4: 6 questions
- Set 5: 6 questions
- Set 6: 6 questions
- Set 7: 6 questions

This yields `14 + 32 = 46` objective questions while keeping every item attached to a 6–8-question source set.

### Source-set roles per form

Each fixed form must contain:

- **2 literary sets**
- **5 informational/editing sets**
- at least **1 Great American Conversation / U.S. civics set**
- at least **1 science or technical informational set**
- at least **1 workplace/community informational set**
- at least **1 argument/data or multi-format set**
- exactly **1 dedicated editing set**
- at least **1 reading source of 600+ words** for stamina

With 2 literary and 5 informational/editing sets, the form is close to the published 75% informational / 25% literary balance without pretending to reproduce an undisclosed official operational-form blueprint.

### Passage length

- Literary, informational, argument, civics, and mixed-format objective source sets: **400–900 words** total source text per set.
- Dedicated editing set: **≤450 words**.
- Mock ER paired sources: **550–650 words total**, never above 650.

## Reporting-category blueprint

Chee Skool's current internal tracks (`reading`, `arguments`, `language_conventions`) are learning architecture, not official GED reporting categories. Phase 5 must stop using those internal track totals as the Mock blueprint.

Every mock-only objective question receives explicit authoring metadata:

```json
"reportingCategory": 1
```

or `2` / `3`.

The field is carried into learner-safe generated metadata for scoring and QA.

### Per-form objective coverage target

For the 46 objective questions, each form targets:

- Category 1: **16 questions** (~34.8%)
- Category 2: **21 questions** (~45.7%)
- Category 3: **9 questions** (~19.6%)

This is an **approximation derived from published reporting percentages**, not a claim that an official GED form contains exactly 16/21/9 objective items. ER separately exercises all three reporting-category families through argument/evidence, organization/development, and conventions.

The dedicated editing set contributes **8 Category 3 questions**. One additional conventions/usage question appears naturally inside another source set so the form reaches 9 without creating a standalone item.

## Item-type blueprint

No new interaction engine is required for Phase 5. Forms use existing tested Chee Skool interactions.

Target per form:

- **34 multiple-choice** items
- **8 embedded editing drop-down (`grammar_edit`)** items
- **2 select-text** items
- **2 drag-sort or drag-order** items

Total: **46**.

This provides technology-enhanced coverage without adding interaction complexity merely to imitate the official interface.

All multiple-choice items retain four answer options.

## Difficulty and DOK calibration

The GED guide supports DOK 1–3 but does not publish a public operational-form DOK percentage blueprint. Therefore Chee Skool will not invent one.

Instead:

- each form must contain DOK 1, 2, and 3;
- DOK 2 must be the largest band;
- DOK 3 must be meaningfully represented across reading/evidence/argument reasoning;
- no form may be made “hard” through confusing UI or trivia;
- the three forms must be reviewed side-by-side so one form is not obviously easier or harder than the others;
- per-form DOK counts may differ only modestly and will be recorded in QA.

Difficulty labels remain Chee Skool authoring metadata and are not presented as official GED difficulty levels.

## Dedicated mock-only content bank

### Objective modules

Phase 5 authors **21 new source-set modules**:

- 7 for Form A
- 7 for Form B
- 7 for Form C

Each module must use:

```json
"deliveryRoles": ["mock"]
```

Mock-role content remains mock-only and is excluded from Practice, adaptive Train, Skill Check, passage browsing, learner resource listings, and ordinary curriculum practice cards.

No objective module, source passage, or question is reused across Forms A/B/C.

Expected new objective content:

- **21 modules**
- **138 questions**

The pre-Phase-5 objective/component bank is 112 modules / 807 questions. If no other module counts change, the final generated inventory is expected to become approximately **133 modules / 945 questions**. This is an expected planning count, not a release claim until verified.

### Originality and source policy

- Mock questions are original Chee Skool GED-style items.
- Do not copy commercial prep-book questions.
- Informational, science, workplace, literary, and argument passages should be original unless a deliberate public-domain source is required.
- Great American Conversation sets may include short, accurately reproduced public-domain U.S. founding/civic excerpts plus original contextual or companion material.
- Historical text must not be silently modernized or paraphrased while presented as a quotation.
- Source notes/attribution remain available where appropriate.

## Great American Conversation coverage

Every form must include one civics/GAC set so this coverage is not left to chance.

Across the three forms, the three civics sets should use different source contexts, for example:

- a Bill of Rights / First Amendment context;
- a Fourth Amendment / privacy or government-power context;
- another public-domain founding/civic text or later public civic argument connected to American citizenship/liberties.

The exact texts are chosen during content authoring after readability and question-quality review. The design does not require copying long historical passages.

## Mock-only Extended Response bank

The existing 10 ER prompts are Practice/learning assets and must **not** be reused in Mock.

Phase 5 adds **3 dedicated mock-only ER prompts**, one unique prompt per fixed form.

Requirements:

- two original source texts;
- combined source length **550–650 words**, never above 650;
- two defensible positions with one argument better supported through evidence/reasoning, but not trivially so;
- diverse contexts across the three forms (e.g. science/public policy, workplace/community, social studies/civic issue);
- no authoring `strongerSource` or scoring key in learner payloads;
- existing three-trait self-review remains separate from the objective raw score;
- no automated GED score, pass prediction, or official rubric score claim.

### ER isolation architecture

Mock ER prompts must not be listed in ordinary Extended Response Practice.

Canonical mock-only prompts are compiled to a separate learner-safe payload, for example:

`data/generated/mock-er-prompts.json`

The timed ER workspace loads the mock-only payload only when launched with a valid active mock attempt. Ordinary ER Practice continues to use the existing learner prompt bank.

This prevents learners from seeing a future Mock ER prompt before taking that form.

## Fixed-form manifest and engine

Phase 5 replaces random full-mock pool assembly with an explicit manifest in canonical source.

The canonical configuration should move to a new version such as:

`content-src/config/rla-mock-v2.json`

It contains:

- timing and disclaimers;
- `objectiveQuestionCount: 46`;
- reporting-category target metadata;
- passage/item-type constraints;
- `allowPracticeFallback` state;
- three form manifests;
- each form's Part 1 module IDs;
- each form's Part 3 module IDs;
- each form's mock-only ER prompt ID.

Example shape:

```json
{
  "version": "rla-mock-v2",
  "selection": {
    "allowPracticeFallback": false,
    "rotation": "least-recently-used"
  },
  "forms": [
    {
      "id": "rla-mock-form-a",
      "part1ModuleIds": ["...", "..."],
      "erPromptId": "mock-er-a",
      "part3ModuleIds": ["...", "...", "...", "...", "..."]
    }
  ]
}
```

Exact IDs are supplied in implementation/content plans.

## Form validation

A form is considered complete only if automated validation confirms:

- exactly 14 Part 1 questions;
- exactly 32 Part 3 questions;
- exactly 46 objective questions total;
- 7 complete source sets;
- every source set contains 6–8 associated questions;
- no standalone/filler items;
- every referenced module has `deliveryRoles: ["mock"]`;
- no objective question/module/source repeats across forms;
- one unique mock-only ER prompt per form;
- reporting-category target = 16/21/9;
- item-type target is satisfied;
- 2 literary / 5 informational-editing source-set balance;
- at least one GAC/civics set;
- at least one multi-format/data set;
- required passage lengths;
- no hint, retry, confidence, or learning-stage scaffolding;
- no Practice/Train/Skill Check role leakage;
- no authoring answer-key fields in mock ER learner payloads.

`allowPracticeFallback` may not be switched to `false` until **all three** forms pass the full completeness contract.

## Form rotation and retakes

The engine chooses the form; learners do not cherry-pick A/B/C.

Rules:

1. An active incomplete mock always resumes the same fixed form.
2. A learner's first three completed/new attempts receive all three forms before a repeat, unless local history has been cleared.
3. After all forms have been used, choose the **least recently used** form.
4. Avoid an immediate repeat when another valid form exists.
5. Store the internal `formId` in mock history for rotation and QA, but the learner-facing UI may simply say `Full RLA Mock`.

Rotation is not random question assembly. Each selected form remains fixed and validated.

## Objective Practice Test remains separate

The existing shorter Objective RLA Practice Test is **not** converted into a mock-only consumer.

It may continue using the Practice bank because its purpose is format/timing practice, not unseen broad measurement. Its learner copy must remain explicit about that distinction.

The dedicated mock bank is reserved for full Mock so learners do not burn unseen forms during routine objective practice.

## Learner-facing Mock experience

### Landing page

Once Phase 5 is complete, replace fallback wording such as `RLA Format & Timing Practice` for the full test with a clearer but still bounded label such as:

**Full RLA Mock**

Supporting copy:

> Full-length original GED-style RLA practice using unseen Chee Skool source sets. Results are raw practice evidence, not an official GED score or pass prediction.

The Objective RLA Practice Test remains visibly separate.

### During the attempt

Preserve the strong V1 behavior:

- strict Part 1 → ER → break → Part 3 flow;
- fixed section timers;
- refresh-safe recovery;
- flag for review;
- section navigator/review;
- no correctness/explanations until completion;
- no hints/retries/confidence checks;
- focus mode;
- ER draft scoped to the mock attempt.

### Results

Replace the current internal `Reading / Arguments / Language` mock-domain breakdown with the published-style reporting-category coverage labels:

- **Text Features & Technique**
- **Evidence & Arguments**
- **Language Conventions**

Show raw correct/total and percentage for each. Keep skill-level breakdown underneath where metadata supports it.

Do not show:

- GED scaled-score estimate;
- pass/fail prediction;
- College Ready claim;
- official percentile/equating language;
- psychometric-equivalence language.

ER remains explicitly labeled **Self-review** and separate from objective results.

## Progress behavior

Mock history remains separate from Practice and Skill Check evidence.

Progress may show:

- date;
- raw objective score;
- reporting-category breakdown;
- ER self-review status;
- time used;
- completion status.

Do not silently fold Mock raw scores into the existing per-skill mastery model.

## Fallback removal

The current V1 full mock can use `practice_fallback`. Phase 5 ends that temporary behavior.

Sequence:

1. Build fixed-form engine and validators while fallback remains enabled.
2. Complete and validate Form A.
3. Complete and validate Form B.
4. Complete and validate Form C.
5. Verify all three forms and mock-only ER payloads in a clean build.
6. Set:

```json
"allowPracticeFallback": false
```

7. Add a regression test proving a full Mock cannot silently draw Practice content.
8. Remove learner fallback disclaimers from full-Mock results/landing copy.

If the dedicated bank becomes incomplete later, the build/test gate must fail. It must **not** silently re-enable Practice fallback.

## Implementation checkpoints

### Phase 5A — fixed-form architecture

- V2 canonical blueprint/manifest schema;
- fixed-form selection and validation engine;
- reporting-category metadata pipeline;
- form rotation/history behavior;
- separate mock-only ER payload support;
- no learner behavior switch until valid form content exists.

### Phase 5B — Form A

- 7 new mock-only objective source sets / 46 questions;
- 1 new mock-only ER prompt;
- complete form QA.

### Phase 5C — Form B

- another 7 / 46 / 1;
- no overlap with A;
- cross-form equivalence review.

### Phase 5D — Form C

- another 7 / 46 / 1;
- no overlap with A/B;
- three-form equivalence review.

### Phase 5E — fallback removal and closeout

- turn Practice fallback off;
- learner copy upgrade;
- reporting-category result UI;
- full isolation and rotation tests;
- whole-system Mock review;
- final build/public-artifact/device-readiness gate.

## Testing strategy

TDD is required for runtime/behavior changes.

Tests must cover at minimum:

### Engine/form contracts

- three forms exist;
- fixed form IDs and manifests are valid;
- exact 14/32/46 counts;
- 7 full source sets per form;
- no partial/filler questions;
- no cross-form objective overlap;
- unique ER prompt per form;
- rotation uses all three before repeating;
- least-recently-used behavior after all three;
- active attempt resumes same form.

### Content contracts

- 21 mock-only modules / 138 questions;
- delivery role exactly `["mock"]`;
- no hints, learning stages, retry scaffolding, or Practice/Train/Check roles;
- source lengths and text-type balance;
- GAC/civics and multi-format coverage;
- 16/21/9 reporting-category totals per form;
- target item-type counts;
- MC items have four options;
- DOK 1–3 present and forms reasonably comparable;
- no duplicate prompts/questions/passages across forms.

### ER contracts

- three mock-only prompt IDs;
- 550–650 combined source words;
- learner payload strips authoring keys;
- prompts are absent from ordinary ER Practice listings;
- mock attempt can load the correct prompt and resume its draft.

### Isolation contracts

- Mock content absent from Practice;
- absent from adaptive Train;
- absent from Skill Check;
- absent from Quick Review;
- absent from ordinary passage/resource browsing;
- objective Practice Test does not consume mock-only forms;
- full Mock never consumes Practice once fallback is disabled.

### Result/copy contracts

- full Mock uses reporting-category breakdown;
- no scaled-score/pass-prediction language;
- ER remains self-review;
- fallback copy is gone only after fallback is actually disabled.

## Release verification

Before Phase 5 can be called complete, run fresh:

```bash
npm test
npm run content:validate
npm run content:build
npm run public:build -- --out <fresh-dir>
```

Then verify:

- source and public JavaScript syntax;
- module/question/form/prompt counts;
- public artifact references;
- no internal authoring/source leakage;
- no demo/sample leakage;
- no mock-only content in Practice/Train/Check/Quick Review UI;
- release metadata synchronization;
- service-worker/cache consistency;
- desktop and phone-width full-form smoke tests;
- refresh recovery in each timed stage;
- form rotation across at least four new mock starts/completions;
- keyboard/focus/accessibility behavior for mock interactions.

The public-alpha release gate remains off until real-device/browser QA and the broader final release checklist are complete.

## Non-goals

Phase 5 does **not** add:

- official GED questions;
- official scaled scoring;
- pass probability;
- College Ready prediction;
- automatic ER grading;
- adaptive question selection inside a full form;
- random question assembly;
- new PDFs;
- extra flashcards;
- more Skill Checks;
- more Practice content unless a Phase 5 QA blocker genuinely requires it.

## Success criteria

Phase 5 is complete when a learner can take a full 150-minute Chee Skool RLA Mock that:

1. uses only dedicated unseen mock content;
2. contains 46 objective questions in coherent 6–8-question source sets plus one unique 45-minute ER;
3. rotates across three substantially non-overlapping fixed forms before repeating;
4. reflects published RLA source, reporting-category, item-type, text-type, editing, civics/GAC, and ER constraints without claiming official equivalence;
5. gives raw independent practice evidence only after completion;
6. cannot silently fall back to Practice content;
7. leaves Practice, Train, Skill Check, Quick Review, and ER Practice roles intact.
