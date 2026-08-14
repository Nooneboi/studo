# Studo Phase 4B — Existing Content Migration

## Status

Phase 4B migrates the remaining learner-facing RLA practice content into the Phase 4 source → validation → build pipeline while keeping the current runtime IDs stable for Progress, review scheduling, and Train Me.

### Migrated in Phase 4A
- Evidence-Based Reading — The Night Shift

### Migrated in Phase 4B
- Evidence & Inference — The Last Bus
- Grammar Edit — Sentence Repair
- Grammar Transfer — Precision Check
- Organizing an Argument

### Intentionally left as legacy
- Sample Quiz — How This Works

The Sample Quiz is product orientation/demo content rather than part of the RLA knowledge map, so it remains outside the RLA source registry for now.

## New source assets

### Passages
- `content-src/passages/p-rla-last-bus.json`
- `content-src/passages/p-rla-library-sunday-hours.json`

### Sets
- `content-src/sets/set-rla-evidence-last-bus.json`
- `content-src/sets/set-rla-grammar-sentence-repair.json`
- `content-src/sets/set-rla-grammar-precision-check.json`
- `content-src/sets/set-rla-writing-library-hours.json`

## Runtime compatibility

The source registry uses the new RLA IDs (`R2.4`, `R5.3`, `R5.4`, `L1.1`, `L1.2`, `W1.5`). During migration, the compiler still emits selected legacy runtime IDs so existing local learning history remains meaningful.

Examples:

- `R2.4` → `reading.inference.from_details`
- `R5.3` → `reading.evidence.matching`
- `L1.2` → `language.grammar.subject_verb_agreement`
- `L1.1` → `language.usage.word_choice`
- `R5.4` → `writing.evidence.relevance`
- `W1.5` → `writing.argument.short_response`

This compatibility layer can be removed after the learning-data migration is designed.

## Validation result

`npm run content:check`

- 0 blocking errors
- 5 generated Phase 4 modules
- 6 total runtime index entries (including the legacy orientation sample)
- 2 expected quality warnings: the two writing families currently have only one published question each, so transfer cannot yet be measured for those skills

The validator warning location bug was also fixed so family warnings point to the actual source set.

## UI refinement included with 4B

Phase 4B also simplifies practice feedback after reviewing current learning/test product patterns:

1. The visible `Confidence` label was removed. Only `Sure`, `Unsure`, and `Guessing` remain as quiet optional signals.
2. The certainty choices disappear after an answer is submitted.
3. Immediate feedback is now one simple correction:
   - Correct / Not quite
   - correct answer when needed
   - one short `Why` explanation
4. Deeper material is grouped into one `See answer breakdown` disclosure:
   - why the learner's choice fails
   - evidence from the passage when available
   - one short tip
5. Duplicate review/status text in Train Me was reduced.

This keeps the main mental task clear while preserving deeper review for learners who need it.
