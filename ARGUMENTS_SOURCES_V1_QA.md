# Studo Arguments & Sources V1 - QA Report

Date: 2026-08-22

## Result

Arguments & Sources V1 is published in the learner curriculum after passing the current Studo content, build, regression, PDF, syntax, and local HTTP checks.

## Learner structure

- 9 learner-facing units
- 15 internal R5/R6 skills preserved for progress tracking
- 2 domains: Argument Analysis; Multiple Texts & Formats
- 9 focused interactive modules
- 6 mixed GED-style source sets
- Mixed Source Practice appears only in the multi-source Arguments domain and does not duplicate into focused unit practice

## Learning resources

Each learner unit contains:

- 1 Study Guide
- 1 Workbook 1 - Learn
- 1 Workbook 2 - Apply
- 1 focused 8-question interactive module

Totals:

- 27 new Arguments PDFs
- 74 PDF pages
- 72 focused interactive questions
- 36 mixed-source questions
- 108 interactive Arguments questions total

All 27 PDFs were generated with embedded Inter fonts, retain selectable text, and were rendered at 200 DPI for visual inspection. The 74 rendered pages showed no visible clipping, overlapping text, broken glyphs, or unreadable page layouts.

## Mixed-source practice

1. Should the Weekend Bus Pilot Expand? - 500 words
2. Two Plans for Residential Food-Waste Collection - 422 words
3. Should Meridian Automate the First Inspection? - 447 words
4. How Strong Is the Case for Cooler Schoolyards? - 421 words
5. A Device-Lending Program: Article and Fact Sheet - 400 words
6. Choosing a Riverfront Flood Strategy - 418 words

Coverage includes paired sources, argument-strength comparison, text + data, different formats, evidence sufficiency, assumptions, credibility, counterarguments, and synthesis.

## Assessment QA

Arguments-specific validation currently reports:

- 0 blocking errors
- 0 predictable answer-position warnings
- 0 long same-answer run warnings
- 0 excessive generic `whyWrong` warnings
- 0 low-coverage warnings for published R5/R6 skills

Overall Arguments answer distribution across the 108 interactive questions:

- A: 29
- B: 31
- C: 32
- D: 16

The distribution is intentionally non-cyclic; correctness is not forced into equal quotas.

## Publication behavior

- Reading remains published.
- Arguments is now published.
- Language remains preview and hidden from normal learner navigation.
- Extended Response/Writing remains preview and hidden from normal learner navigation.
- The old short Writing prototype was reclassified as an ER skill drill so publishing Arguments does not accidentally expose it as Arguments Passage Practice.

## Fresh verification

### Content

`npm run content:validate`

- 0 errors
- 7 non-blocking warnings

The 7 remaining warnings are not Arguments defects: five are Reading transfer-family reminders and two are Writing-preview transfer-family reminders.

### Clean build

`data/generated/` was deleted before the final build.

`npm run content:build`

- 50 canonical legacy modules rebuilt
- 26 schema-v2 modules compiled
- 73 learner index entries generated
- 7 quality warnings preserved

### Automated tests

`npm test`

- Build regressions: 2/2
- Foundation QA: 7/7
- Reading quality: 4/4
- Arguments quality: 7/7
- Total: 20/20 passing

### JavaScript / Node syntax

- 31 `.js` / `.mjs` files checked
- 0 syntax failures

### PDF checks

- 27 Arguments PDFs
- 74 pages
- 0 missing selectable-text failures
- 0 Inter-embedding failures
- largest Arguments PDF under 60 KB
- all pages rendered at 200 DPI and visually inspected

### Local HTTP smoke test

Representative requests returned HTTP 200 for:

- Practice
- Arguments curriculum
- both Arguments domain pages
- a learner unit page
- a focused module
- a mixed-source module
- generated curriculum JSON
- generated mixed-source JSON
- an Arguments Study Guide PDF
- domain and skill JavaScript

## Quality note

This is a baseline, not a claim that every future Arguments item is finished forever. The section now has enough complete teaching, focused practice, mixed-source transfer, automated QA, and learner navigation to justify publication. Later Extended Response work should reuse these argument-analysis skills rather than duplicate them.
