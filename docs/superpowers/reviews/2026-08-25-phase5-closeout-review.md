# Phase 5 Dedicated RLA Mock Closeout Review

**Date:** 2026-08-25
**Baseline:** `0.7.0-alpha.29`
**Status:** Code/content/automated-QA complete; real-browser/device public-release gate remains pending

## What Phase 5 now provides

- Three fixed full RLA Mock forms: `rla-mock-form-a`, `rla-mock-form-b`, and `rla-mock-form-c`.
- 21 dedicated mock-only source-set modules and 138 unseen objective questions.
- 46 objective questions per form: 14 in Part 1 and 32 in Part 3.
- Seven coherent source sets per form with no cross-form source/module reuse.
- Three unique mock-only Extended Response prompts compiled separately from ordinary ER Practice.
- Fixed-form rotation that uses all three forms before repeating, then selects the least recently used form.
- Practice fallback disabled; Full Mock cannot silently consume Practice-role modules.
- Objective RLA Practice Test remains separate and continues to use Practice content.
- Reporting-category result labels: Text Features & Technique, Evidence & Arguments, and Language Conventions.
- ER remains separate Self-review; no scaled score, pass prediction, College Ready claim, or official-equivalence claim.

## Verified inventory

- 133 generated learner modules total.
- 945 objective/component questions total.
- 21 mock-only modules / 138 mock questions.
- 3 fixed forms / 3 mock-only ER prompts.
- 9 Skill Check modules remain separate.
- 28 Quick Review cards remain separate.
- 152 registered/physical learner PDFs, with no orphan learner PDFs.

## Automated verification evidence

Fresh verification completed successfully:

- `npm test`
- `npm run content:validate` → 0 errors, 0 warnings
- `npm run content:build` → 133 generated module entries
- `npm run public:build -- --out /mnt/data/studo-phase5-public`
- source and public JavaScript syntax checks
- public artifact reference checks
- no `content-src`, authoring, scripts, docs, package metadata, sample, or demo leakage in the learner-only build
- release/service-worker cache metadata synchronized to `0.7.0-alpha.29`
- browser-independent four-attempt rotation smoke: `A → B → C → A`
- generated Mock role isolation and ER-bank separation checks

A deployment-only packaging defect found during closeout was fixed: `data/generated/mock-er-prompts.json` was initially omitted from the learner-only public build. A Phase 5 regression test now requires the public builder to ship that payload.

## Historical regression cleanup

Phase 5 intentionally invalidated several older frozen assumptions. Closeout tests were updated so they preserve the original Phase 3/4 baselines underneath the additive Mock bank rather than requiring zero Mock modules forever. The unused retired `js/subjectbar.js` source was also removed because its stale disabled “Soon” UI contradicted the current single-live-subject navigation source in `js/app.js`.

## Remaining public-release gate

The current execution environment has a machine-managed Chromium policy that blocks both local HTTP and `file://` pages, so a true browser/device smoke could not be completed here. This is not treated as product evidence either way.

Before `publicAlphaEnabled` is enabled, manually verify the built site on real desktop and mobile browsers, including:

- full Part 1 → ER → break → Part 3 → results flow;
- refresh recovery in each timed stage;
- touch behavior for select-text, editing, and drag controls;
- keyboard-only focus/order and 200% zoom;
- back/two-tab/offline/service-worker behavior;
- basic screen-reader semantics;
- a small learner pilot with minimal guidance.

## Verdict

Phase 5 is complete at the product-code, content-bank, build, isolation, and automated-QA level. The dedicated Mock system now performs its intended measurement role without reusing Practice content. The broader public-alpha release gate remains off until real-browser/device/accessibility QA and a learner pilot are signed off.
