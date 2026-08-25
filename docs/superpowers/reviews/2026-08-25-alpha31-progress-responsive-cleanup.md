# Alpha 31 Progress Responsive Cleanup

**Date:** 2026-08-25
**Release:** `0.7.0-alpha.31`
**Scope:** Progress skill status readability, responsive overflow, learner-facing evidence wording, grouped review list

## Changes

- Status owns its own label, percentage, and progress bar instead of competing with a separate signal meter.
- `Signal / Practice signal` is replaced in learner UI by `Evidence / Practice`; Latest Skill Check remains a separate piece of evidence.
- Skill rows become two-column cards on tablet and true one-column cards on phones. Progress containers and row children can shrink to the viewport and the Progress page clips accidental horizontal overflow.
- Review items are grouped by skill and route to the canonical skill page, reducing repetitive rows while preserving the underlying active-mistake count.

## Preserved boundaries

- No learning-score formula changed.
- No Practice, Train, Skill Check, Quick Review, Mock, or ER role changed.
- No Phase 5 mock content, form rotation, scoring, or isolation changed.
- Public alpha remains gated on real-device/browser/accessibility QA and a learner pilot.
