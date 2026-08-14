# Studo Phase 4A — Migration Proof of Concept

## What changed

Phase 4A introduces a source → validate → build → runtime pipeline without rewriting the learner app.

```text
content-src/
  skills/
  passages/
  sets/
      ↓
scripts/validate-content.mjs
      ↓
scripts/build-content.mjs
      ↓
data/generated/
      ↓
current Studo pages
```

## Proof module

`Evidence-Based Reading — The Night Shift` was migrated first.

Source assets:
- `content-src/passages/p-rla-night-shift.json`
- `content-src/sets/set-rla-evidence-night-shift.json`

Generated learner module:
- `data/generated/modules/evidence-practice.json`

The source question uses the new knowledge-map skill IDs:
- `R2.4` — Inference from details
- `R5.3` — Evidence identification

The compiler currently emits legacy runtime skill IDs for these mapped skills so Phase 3C Progress / Train Me remains compatible with the still-unmigrated transfer module.

## Validation currently checks

Hard errors include:
- duplicate IDs
- unknown skill IDs
- unknown passage references
- missing question families
- missing/invalid correct answers
- invalid difficulty or DOK
- published content without a reviewer
- missing source/rights status
- missing distractor type/rationale on published wrong options
- incomplete explanations

Quality warnings include:
- overlong question stems
- overlong explanations
- generic AI-like explanation openings
- answer-position bias
- hard questions with low reasoning depth
- question families with only one published source question

## Compatibility strategy

`data/generated/index.json` is now the runtime manifest.

During migration it combines:
- generated Phase 4 modules
- untouched legacy modules

This lets modules be migrated one at a time.

## Commands

```bash
npm run content:validate
npm run content:build
npm run content:check
```

Generated files should not be hand-edited.

## Next migration step

Migrate the transfer partner `Evidence & Inference — The Last Bus` next. Once both members of those families are in `content-src`, the validator can verify transfer coverage entirely inside the new source system.
