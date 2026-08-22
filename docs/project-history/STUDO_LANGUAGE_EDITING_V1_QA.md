# Studo Language & Editing V1 - QA Report

**Date:** 2026-08-22  
**Scope:** Language & Editing V1 built on the verified Reading + Arguments Studo baseline.

## Release status

Language & Editing is now **published** in normal learner navigation. Extended Response / Writing remains preview-hidden.

The build keeps all **13 internal Language skill IDs** for progress tracking while presenting **7 learner-facing units**:

1. Word Choice & Standard Usage
2. Agreement & Pronouns
3. Modifiers & Sentence Logic
4. Parallelism & Sentence Connections
5. Concision & Transitions
6. Sentence Boundaries & Punctuation
7. Capitalization & Possessives

## Learning inventory

- 7 learner units
- 13 internal L1/L2 skills, each mapped exactly once
- 7 Study Guides
- 14 Workbooks (Workbook 1 + Workbook 2 for every unit)
- 7 focused Interactive Practice modules
- 56 focused questions (8 per unit)
- 6 mixed GED-style editing passages
- 36 mixed editing questions (6 per passage)
- **92 new Language questions total**

The two old four-question grammar prototypes were retired instead of being mixed into the new learner bank.

## Mixed Editing Practice

| Passage | Words | Questions |
| --- | ---: | ---: |
| Updating the Clinic Reminder System | 392 | 6 |
| Reporting a School Energy Audit | 382 | 6 |
| Coordinating the Community Garden | 391 | 6 |
| A Safer Makerspace Check-In | 396 | 6 |
| Revising the Lost-and-Found Policy | 393 | 6 |
| Improving the Warehouse Handoff | 385 | 6 |

All six passages are within the intended **350-450 word** editing-practice range and collectively cover all 13 internal Language skills.

Mixed practice includes grammar, agreement, pronoun reference, modifiers, parallelism, sentence connections, concision, transitions, fragments/run-ons, punctuation, capitalization, possessives, and standard usage in workplace/informational contexts.

## Assessment QA

The Language bank currently produces:

- **0 blocking validation errors**
- **0 Language-specific quality warnings**
- no predictable answer-position pattern warnings
- no long same-answer-position run warnings
- no excessive generic `whyWrong` feedback warnings
- no Language transfer-family singleton warnings

A validator regression was also fixed during this phase: capitalization-only answer choices such as `March` vs. `march` are now treated as meaningfully different editing options rather than false duplicate answers.

Editorial review also removed ambiguous cases involving:

- a semicolon competing with comma + `and` when both could otherwise be grammatical;
- capitalization of generic subject names versus formal titles;
- modifier placement where two revisions could be read as defensible.

## PDF QA

Generated learner PDFs:

- **21 PDFs**
- **56 pages total**
- 14 Study Guide pages (2 pages per guide)
- 42 Workbook pages (3 pages per workbook)

Checks performed:

- all 21 PDFs rendered at **200 DPI** after final generation;
- all 56 rendered pages visually inspected through contact sheets;
- no visible clipping, overlap, broken glyphs, or orphaned one-line final pages found;
- Inter is embedded in every PDF;
- selectable/extractable text confirmed in every PDF;
- learner blanks render as readable underscores instead of authoring placeholders.

Each Study Guide contains:

1. Learning goal
2. Plain-language explanation
3. Confused-idea contrast
4. GED-style wording
5. Repeatable method
6. Worked example
7. Common traps
8. Diagnostic help
9. Quick check

A short `Why this matters in ER` note connects editing skills to Extended Response without turning the Language unit into a writing course.

## Clean-build verification

The release gate deleted `data/generated/` completely and rebuilt it from canonical sources.

Fresh results:

- content validation: **0 errors, 7 warnings**
- the 7 warnings are pre-existing Reading/Writing transfer-family reminders; **none are Language warnings**
- build: **PASS**
- generated learner index: **86 module entries**
- full automated suite: **27/27 tests passed**
  - 2 build regression tests
  - 7 Foundation QA tests
  - 4 Reading quality tests
  - 7 Arguments quality tests
  - 7 Language quality tests
- JavaScript/Node syntax: **32 files checked, 0 failures**
- missing Language module/resource references: **0**
- published tracks: `reading`, `arguments`, `language`
- Writing/ER remains preview-hidden

## Local HTTP smoke test

10 representative requests were served locally and all returned **HTTP 200**, including:

- Language curriculum page
- Language domain page
- Language unit page
- focused Language module
- mixed editing module
- generated curriculum JSON
- Study Guide PDF
- Workbook PDF
- `domain.js`

## Known remaining work outside Language V1

The project still has 7 non-blocking transfer-family warnings outside this Language release:

- 5 Reading transfer-family reminders
- 2 Writing-preview transfer-family reminders

These are intentionally left visible for later coverage work rather than silenced artificially.

## Conclusion

Language & Editing V1 now has a complete learner baseline rather than a placeholder track: teaching resources, focused practice, contextual mixed editing, QA protection, and canonical build integration all exist together. It is suitable to keep published while the next major phase builds Extended Response / Writing and, later, the realistic mock-test blueprint.
