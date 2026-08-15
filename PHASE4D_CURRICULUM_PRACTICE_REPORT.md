# Studo Phase 4D — Curriculum-driven Practice

## Goal
Expose the RLA curriculum to learners without overwhelming them with the full 8-domain taxonomy on the Practice homepage.

## Learner hierarchy

Practice now uses four calm tracks:

1. Reading & Comprehension
   - Core Meaning
   - Relationships & Inference
   - Words, Tone & Style
   - Structure, Purpose & POV
2. Arguments & Sources
   - Argument Analysis
   - Multiple Texts & Formats
3. Language & Editing
   - Language & Editing
4. Extended Response
   - Extended Response

The full skill registry remains underneath these tracks.

## Progressive disclosure

The learner sees:

`Practice track → Domain → Skill → Available set`

The homepage does not show all 62 mapped skills at once.

## Generated curriculum

`npm run content:build` now also produces:

`data/generated/curriculum.json`

This file is built from:

- `content-src/skills/rla.skills.json`
- `content-src/config/rla.curriculum.json`
- published source sets and their curriculum attachments

It contains availability counts and the published sets attached to each skill.

## New learner page

`curriculum.html?track=reading`

The page:

- shows the selected track
- reveals domains with `<details>` disclosure
- shows all mapped skills inside each domain
- keeps unavailable skills quiet but visible
- expands available skills into real practice sets
- shows simple learning states such as `Review due`, `Needs practice`, `Building`, and `Strong`
- avoids showing mastery percentages inside the curriculum browser

## Design rule

The authoring taxonomy may stay detailed. The learner interface should reveal only the amount of structure needed for the current choice.

## Validation

Phase 4 content validation remains at 0 blocking errors. The two existing transfer-family singleton warnings remain intentionally unresolved until new writing transfer content is authored.
