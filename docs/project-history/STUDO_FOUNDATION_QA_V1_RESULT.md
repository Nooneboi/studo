# Foundation QA V1 — Verification Result

Date: 2026-08-22

## What changed

- `content-src/legacy-modules/` now contains 50 canonical transitional runtime modules.
- `content-src/resources/rla.resources.json` now canonically registers the 85 existing learner Reading resources.
- The builder no longer reads a previous `data/generated/index.json` or `data/generated/curriculum.json` as source input.
- Every build clears and recreates `data/generated/` from `content-src/`.
- Track `publicationState` is explicit: Reading is `published`; Arguments, Language, and Extended Response are `preview`.
- Preview modules still compile for development, but preview tracks/modules are removed from normal learner curriculum/index discovery.
- Assessment QA now blocks objective defects such as wrong answer references, duplicate option text, answer-letter/explanation mismatches, unknown canonical skills, and missing legacy core metadata.
- QA warnings now expose answer-position patterns, short Passage Practice, repeated generic feedback, transfer-family gaps, and suspicious answer-position runs.
- `data/generated/qa-report.json` is generated on every build.
- The known Compare & Contrast q4 explanation mismatch was corrected from A to D.

## Fresh verification

- `npm run content:check`: PASS
  - 0 validation errors
  - 68 quality warnings
  - 50 canonical legacy modules + 9 schema-v2 modules built
  - 56 learner index entries after preview filtering
- `npm test`: PASS
  - 2 existing build/placement regressions
  - 7 Foundation QA regressions
  - 9 total tests, 0 failures
- JavaScript/Node syntax: 29 files checked, 0 failures
- Static server smoke test: 27 requests, 0 failures
- Missing learner module/resource references: 0
- Generated modules on disk: 59
- Learner curriculum tracks: Reading only
- Reading skills: 22
- Reading resources: 85
- Learner Passage Practice sets: 22
- Preview modules confirmed buildable but absent from learner index
- Two consecutive source-only builds are semantically identical after removing build timestamps.

## Remaining QA warnings — intentionally not rewritten in Foundation QA V1

| Code | Count | Meaning |
|---|---:|---|
| `ANSWER_POSITION_PATTERN` | 44 | Many modules follow a predictable four-position answer cycle. |
| `PASSAGE_PRACTICE_SHORT` | 9 | Nine Passage Practice items are below the 400-word training target. |
| `WHY_WRONG_REUSED` | 9 | Generic wrong-answer feedback is reused heavily across the bank. |
| `TRANSFER_FAMILY_SINGLETON` | 4 | Four question families do not yet have enough published transfer items. |
| `ANSWER_POSITION_RUN` | 2 | Two modules contain at least three identical answer positions in a row. |

These warnings are the measurable backlog for the upcoming whole-Reading content refinement. They are warnings rather than automatic rewrites because fixing them requires educational judgment.
