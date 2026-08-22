# Studo Reading & Comprehension Quality Refinement V1 - QA Report

**Date:** 2026-08-22  
**Scope:** Published Reading & Comprehension only. Arguments & Sources, Language & Editing, Extended Response, and final mock-test blueprint remain outside this phase.

## Result

**Status: ready for learner review.**

The published Reading track now has a cleaner progression from focused skill practice to mixed Passage Practice. This phase did not rebuild the learner UI. It improved assessment quality, passage realism, diagnostics, and QA coverage while preserving useful existing content.

## Before -> after QA

Foundation QA baseline had **68 warnings**. The final Reading build has **8 warnings** and **0 errors**.

| QA issue | Foundation baseline | Final Reading build |
| --- | ---: | ---: |
| Answer-position cycles | 44 | 0 |
| Long same-answer runs | 2 | 0 |
| Reused generic wrong-answer feedback | 9 | 0 |
| Short Passage Practice warnings | 9 total / 8 Reading-related | 1 total / 0 Reading-related |
| Transfer-family singleton warnings | 4 | 7 |
| Blocking errors | 0 | 0 |

The remaining warnings are not learner-facing Reading defects:

- 1 short Passage Practice warning is the existing **Writing-preview** prototype.
- 2 singleton warnings are Writing-preview families.
- 5 singleton warnings are new Reading schema-v2 transfer families that currently have only one published schema-v2 example. The underlying Reading skills still have legacy practice; these warnings mark future transfer-coverage opportunities rather than broken questions.

## Reading bank after refinement

- **22 published Reading skills** preserved.
- **77 skill-page resources** preserved.
- **33 focused Interactive Practice modules** preserved.
- **264 focused skill-practice questions**.
- **24 learner Passage Practice sets**.
- **168 Passage Practice questions**.
- **432 interactive Reading questions total** across focused practice + Passage Practice.

### Passage Practice balance

- **18 informational / 6 literary = 75% / 25%**.
- Context distribution includes science, workplace, community, literary, and a new social-studies/civics passage.
- Final learner-visible passage range: **407-723 words**.
- **4 passages are 600+ words**, adding a real stamina layer that did not exist before.

New long transfer passages:

1. **A Wider Door for Public Comment** - 723 words - social studies/civics.
2. **Reading a River from Traces of DNA** - 679 words - science.
3. **When a Machine Starts to Sound Different** - 674 words - workplace.
4. **The Plan That Would Not Stay on the Screen** - 698 words - literary.

The two tiny Evidence/Argument prototypes, **The Last Bus** and **The Night Shift**, no longer appear as learner Reading Passage Practice.

## Assessment-quality work

Published Reading practice was recalibrated to remove authored answer-position patterns and heavily reused generic feedback. High-priority practice was manually strengthened, including:

- inference;
- conclusions/generalizations;
- relationships among ideas/events/people;
- author purpose;
- point of view/perspective;
- tone;
- paragraph/section function;
- text structure;
- transitions/signal words;
- rhetorical technique;
- connotation;
- figurative language;
- meaning in context;
- impact of word choice.

The four new long passage sets received a second editorial pass specifically to replace filler distractors with plausible but unsupported, too broad, too narrow, reversed, or over-certain alternatives.

## Study Guides / PDF QA

All **22 Reading skill Study Guides** contain a **Diagnostic help** section.

- The 5 Core Meaning guides already had diagnostic help and were preserved.
- **17 other skill guides were changed** by appending a skill-specific diagnostic page.
- All 17 changed PDFs were rendered at **200 dpi** for QA (**79 rendered pages total**).
- All 17 added diagnostic pages were visually inspected together for clipping, spacing, contrast, and glyph problems.
- Diagnostic text uses Inter, readable sizing, dark text on white, and Studo lavender accents.
- Searchable/selectable text is preserved.

## Final destructive rebuild verification

A clean source-only rebuild was performed after deleting `data/generated/`.

Results:

- `npm run content:check` -> **0 errors**, build completed.
- Full automated suite -> **13/13 tests passed**:
  - 2 build-content regression tests;
  - 7 Foundation QA tests;
  - 4 Reading quality tests.
- JavaScript/Node syntax -> **31 files checked, 0 failures**.
- Published Reading module/resource references -> **0 missing references**.
- Local HTTP smoke test -> representative curriculum, Practice, Passage Practice, skill, module, generated JSON, JS/CSS, and PDF URLs all returned **HTTP 200**.
- Passage Practice placement regression remains protected: mixed passage sets do not appear as focused skill checks.

## Files changed relative to Foundation QA V1

Excluding generated output:

- **11 new files**.
- **74 existing files changed**.
- **0 source files deleted**.

The changes are concentrated in canonical Reading content, 17 Study Guide PDFs, Reading QA tests, and the Reading design/implementation documentation.

## What this phase intentionally does not claim

Reading is now a stronger **baseline**, but Studo is not yet a complete GED RLA product. The next major work still includes:

1. learner QA of the Reading bank in actual use;
2. Arguments & Sources;
3. Language & Editing;
4. Extended Response training;
5. real timed GED-style mock-test blueprint;
6. broader transfer-family coverage as the newer schema-v2 bank grows.

