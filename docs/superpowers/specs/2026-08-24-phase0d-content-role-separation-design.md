# Phase 0D Content Role Separation Design

## Goal
Make Practice, Train, Skill Check, and Mock eligibility explicit in canonical content so learner modes cannot accidentally reuse inappropriate material.

## Content contract
Every published learner question module declares `curriculum.deliveryRoles`, using only:

- `practice` — learner-facing guided/focused/mixed application.
- `train` — eligible for adaptive/spaced retrieval and transfer review.
- `skill_check` — dedicated short independent proof; no hints/retries; excluded from Mock.
- `mock` — dedicated unseen exam-simulation measurement bank.

Current ordinary RLA modules migrate to `practice + train`. No current ordinary module is relabeled `skill_check` or `mock`; those banks are created later with dedicated unseen content.

## Mode behavior
- Practice pages list only `practice` modules.
- Curriculum `checks` contains only `skill_check` modules. Interactive Practice continues to render from `sets`, not from `checks`.
- Train selects only modules with the `train` role.
- Mock prefers only `mock` modules. Alpha 12 has no dedicated Mock bank yet, so the blueprint explicitly allows a temporary Practice-bank fallback. Generated attempts record `bankMode: "practice_fallback"`; this remains a simulation signal, not a readiness estimate.
- Existing `mock-excluded` remains an extra compatibility exclusion during the fallback period.

## Build/public integrity
- Canonical source is `content-src/`; generated data is rebuilt.
- Public build copies only runtime modules referenced by generated `index.json`, preventing stale/unindexed modules from shipping.
- Internal/demo content is not in the learner index.

## Validation
Validation rejects missing/invalid roles on published schema-v2 sets and learner legacy-index entries. `skill_check` and `mock` roles are explicit opt-ins; no inferred role can silently promote Practice content into those modes.

## Non-goals
- Do not create Skill Check content in Phase 0D.
- Do not create the dedicated Mock-only bank in Phase 0D.
- Do not add flashcards or new learner features.
- Do not redesign the Practice UI beyond correcting Practice-vs-Check data usage.
