# Phase 5.5 Learner-Facing UI Cleanup

**Date:** 2026-08-25
**Release:** `0.7.0-alpha.30`
**Scope:** Extended Response discoverability, Mock scalability, Progress readability, responsive phone behavior

## Changes

- Extended Response practice modes are visible together on desktop in a two-column layout. Full ER Practice is intentionally first on phone, with jump links for Full ER Practice, Production Lab, and Learning units.
- Mock has a future-safe auto-fitting test library instead of a fixed two-column composition. Full Mock, Objective Practice Test, and focused practice are visually separate decisions.
- Progress skill evidence separates Correct, Practice signal, and Status. Tablet/phone layouts convert skill rows into stacked cards so percentages and status labels cannot overlap.
- First-screen phone spacing is reduced, important mobile actions keep usable touch targets, and long section selectors scroll horizontally instead of compressing.

## Preserved boundaries

- No Phase 5 content, scoring, form rotation, ER isolation, or evidence behavior changed.
- Practice, Train, Skill Check, Quick Review, Mock, and Progress remain role-separated.
- Public alpha remains disabled until real-device/browser/accessibility QA and the learner pilot are signed off.

## Automated evidence

- `npm test` includes `scripts/phase55-ui-quality.test.mjs`.
- `npm run content:validate` reports 0 errors / 0 warnings.
- Clean content/public builds retain 133 modules / 945 questions and the dedicated Phase 5 Mock bank.
