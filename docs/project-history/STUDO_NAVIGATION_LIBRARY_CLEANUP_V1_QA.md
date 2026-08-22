# Studo Navigation & Library Cleanup V1 — QA Report

Date: 2026-08-22

## Scope
This release changes learner navigation and library organization only. Assessment content, `content-src/`, and learner PDFs were intentionally left unchanged.

## Changes
- Fixed Home -> Extended Response route from `extended_response` to `extended-response`.
- Explicit invalid curriculum/domain track IDs now show an error instead of silently falling back to Reading.
- Practice Quick Find now uses learner-facing units for Arguments, Language, and Extended Response while retaining Reading's 22 learner-facing skills.
- Passage Practice reorganized into four responsive groups with search:
  - Science: 7
  - Workplace: 6
  - Community & Civics: 5
  - Literary: 6
- Passage entries now show compact text type, difficulty, and question-count metadata.
- Resources reorganized from file-type tiles into track -> domain -> learner topic rows.
- Resources now has track filters and search.
- Resources uses learner-facing unit labels for Arguments, Language, and Extended Response, not internal skill IDs/labels.
- Resource tables support Study Guide plus a flexible number of workbook columns (including Reading Workbook 3 where present).
- Mobile resource rows expose their exact file role labels.
- Added `js/library-model.js` as the shared discovery/grouping model.
- Added navigation/library regression coverage to the full `npm test` suite.

## Inventory after cleanup
- Published RLA tracks: 4
- Learner topics exposed in Resources: 44
  - Reading: 22
  - Arguments: 9
  - Language: 7
  - Extended Response: 6
- Unique learner resources: 151
  - Reading: 85
  - Arguments: 27
  - Language: 21
  - Extended Response: 18
- Passage Practice: 24 sets
  - Science: 7
  - Workplace: 6
  - Community & Civics: 5
  - Literary: 6

## Verification
- Content validation: 0 errors, 10 non-blocking coverage/transfer warnings.
- Clean source build: PASS; 92 generated module entries.
- Full automated suite: PASS.
- Navigation/library regression checks include:
  - all Home RLA track links resolve to published track IDs;
  - learner-unit search behavior;
  - all passage sets grouped exactly once;
  - all 151 resources grouped exactly once;
  - search/filter controls present;
  - invalid track IDs do not silently fall back;
  - mobile resource labels preserved;
  - all static local HTML links resolve to real files.
- JavaScript/MJS syntax: 37 files checked, 0 failures.
- Content/PDF integrity comparison against Extended Response V1 base: 318 files checked, 0 changed, 0 missing.
- Local HTTP smoke: Home, Practice, ER curriculum/domain, Passage Practice, Resources, Progress, Train, Quiz, ER workspace, generated curriculum/prompt data, shared library model, and representative ER PDF return HTTP 200.

## Known non-blocking warnings
The same 10 content QA warnings from the previous content release remain. This cleanup does not suppress them because no content was changed.

## Release judgement
Navigation/library cleanup is suitable as the base for the mock-test phase. Learner discovery is now aligned with the scale of the content bank; the remaining major product weakness is the legacy Quiz/Test system rather than curriculum/resource organization.
