# Studo RLA Mock/Test V1 — QA & Release Report

**Date:** 2026-08-22  
**Status:** Review build ready for learner-side testing  
**Blueprint:** `rla-mock-v1`

## What changed

Mock/Test V1 replaces the legacy behavior that assembled every available question into one enormous test. The new system uses a source-controlled blueprint and creates a fixed, recoverable exam-style attempt from the existing Studo content bank.

### Full RLA Mock

- Part 1: **14 objective questions / 27 minutes**
- Part 2: **1 Extended Response / 45 minutes**
- Break: **10 minutes**
- Part 3: **32 objective questions / 65 minutes**
- Total objective questions: **46**
- Objective domain target:
  - Reading: **25**
  - Arguments: **10**
  - Language: **11**
- Reading selection uses three whole source sets with **2 informational + 1 literary** and requires at least one **600+ word** passage.

### Objective RLA Practice Test

- **30 questions / 60 minutes**
- Reading: **17**
- Arguments: **6**
- Language: **7**
- Uses a bounded blueprint rather than every question in the bank.

## Learner behavior implemented

- fixed question/source selection once an attempt starts;
- refresh-safe attempt recovery from stored IDs and timestamps;
- no duplicate objective question IDs in a full form;
- passage/source-set integrity preserved where the blueprint uses mixed sets;
- strict Part 1 → ER → break → Part 3 flow;
- no arbitrary pause during timed objective sections;
- flag-for-review controls;
- answered/unanswered/flagged section navigator;
- section review before submission;
- section timer remains active during review;
- grammar-edit items use a dropdown interaction;
- ER draft is scoped to the mock attempt and does not reuse a standalone ER draft;
- 10-minute break with an explicit early-continue confirmation;
- objective answers and explanations remain hidden until the attempt is complete;
- post-test objective answer review includes learner answer, correct answer, and explanation/why-wrong feedback;
- raw overall objective score plus Reading/Arguments/Language breakdown;
- objective skill breakdown where question metadata supports it;
- section time-used reporting;
- ER Trait 1 / Trait 2 / Trait 3 remains explicitly labeled **Self-review** and separate from objective scoring;
- mock history is stored separately and displayed on Progress;
- no GED scaled-score estimate, pass/fail prediction, or College Ready claim.

## Canonical architecture

- Blueprint source: `content-src/config/rla-mock-v1.json`
- Generated learner blueprint: `data/generated/mock-blueprint.json`
- Pure selection/timing/scoring engine: `js/mock-engine.js`
- Mock landing: `quiz.html` + `js/quiz.js`
- Objective/mock workspace: `test.html` + `js/test.js`
- ER integration: `js/extended-response.js`
- Progress integration: `js/progress.js`
- Regression suite: `scripts/mock-test-quality.test.mjs`

## Fresh release verification

The exact tree used for this report was rebuilt from canonical source before the final test run.

### Content pipeline

- Validation errors: **0**
- Quality warnings: **10**
- Canonical legacy modules built: **50**
- Schema-v2 modules built: **42**
- Generated module index: **92 modules**

The ten warnings are existing coverage reminders rather than Mock V1 failures:

- 5 `TRANSFER_FAMILY_SINGLETON` Reading warnings;
- 1 low-coverage Arguments skill warning (`R5.4`);
- 4 low-coverage ER objective-skill warnings (`W1.8`–`W1.11`).

No warning was suppressed to make the release report look cleaner.

### Automated tests

Full project suite: **66 / 66 passed**

- build regression: 2 / 2
- Foundation QA: 7 / 7
- Reading quality: 4 / 4
- Arguments quality: 7 / 7
- Language quality: 7 / 7
- Extended Response quality: 14 / 14
- Navigation/library quality: 9 / 9
- Mock/Test quality: **16 / 16**

The Mock/Test suite additionally generates **100 seeded full mocks** and verifies every one satisfies counts, domain coverage, reading text balance, uniqueness, ER-prompt safety, and stamina requirements. It also checks **40 seeded objective-practice forms**.

### JavaScript syntax

- JS/MJS files checked: **38**
- Syntax failures: **0**

### Local HTTP smoke test

**19 / 19** representative URLs returned HTTP 200, including:

- Home
- Mock Tests
- Test workspace
- Extended Response
- Progress
- Practice
- Resources
- Passage Practice
- Category page
- generated mock blueprint
- generated ER prompts
- generated curriculum/index/QA report
- mock/test/progress JavaScript
- site CSS

### Learner-data safety

Generated ER prompt payloads contain **no authoring answer key / stronger-source field**. Objective answer keys remain in the local module data because Studo is a static client-side learning site, but the mock UI does not expose explanations or correct answers before completion.

## Known limits / manual checks still required

The container's automated Chromium interaction attempt did not complete reliably, so this report **does not claim a full browser E2E pass**. The pure engine, regression suite, syntax checks, static navigation checks, and HTTP smoke tests are green, but learner-side browser testing is still required before committing/publishing.

Recommended manual checks:

1. start a new Full RLA Mock;
2. answer/flag several Part 1 questions and refresh;
3. verify the same questions, answers, flags, and reduced timer return;
4. use the Part 1 review navigator;
5. open ER, type a draft, refresh, submit, and return to the mock;
6. verify the break screen and early-continue confirmation;
7. complete Part 3;
8. inspect raw/domain/skill results and post-test answer review;
9. confirm ER is shown only as Self-review;
10. open Progress and confirm Mock Tests history;
11. repeat with the 30-question Objective RLA Practice Test;
12. test desktop and phone-width layouts.

## Release decision

Mock/Test V1 is **ready for review testing**, not yet declared public-alpha-ready. The next gate is learner-side browser QA plus the final site-wide accessibility/responsive/release review documented in `STUDO_MASTER_STATUS.md`.
