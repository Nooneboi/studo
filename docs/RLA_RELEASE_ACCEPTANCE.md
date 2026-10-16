# Chee Skool — RLA release acceptance checklist

**Candidate:** [Draft PR #36](https://github.com/Nooneboi/studo/pull/36) to `main`  
**Status:** Automated checks green on the candidate branch; **human acceptance not yet complete**.  
**Rule:** Keep PR in draft; do not merge or deploy until the release reviewer signs off on the items below.

## Automated evidence (not a substitute for user testing)

- [x] Node regressions, canonical content generation, Myanmar content consistency and published-asset audit.
- [x] Real headless Chrome Learn / Practice / Skill Check interaction smoke testing.
- [x] Skill Check with six MCQs: keyboard Space selects, no pre-submission correctness, incomplete submission blocked, post-submit result and missed-question review, focus moves to heading.
- [x] Mobile passage/question jump anchors and answer persistence during navigation.
- [x] Guided sorting keyboard selection, first-miss hint and persisted retry after reload.
- [x] Myanmar explanation dialog: modal semantics, Escape closes and focus returns to the trigger in practice and results.
- [x] Cross-device screenshot/layout audit at 1280px, 768px, 390px and 320px, including visible passage/question jumps at 320px.

**Scope caution:** Browser checks exercise representative routes and question types; they do not certify every question, real screen-reader output, native touch ergonomics, Myanmar editorial tone, or actual hardware.

## Manual student-device walkthrough (release blocker)

Device combinations: Android Chrome at 320–390 CSS px, iOS Safari where available, tablet portrait, desktop Chrome/Firefox/Safari. Test with a real keyboard on desktop and external keyboard on one phone/tablet where available.

- [ ] Home → Practice Tests → skill → Learn → Practice → Skill Check works without confusing or broken navigation.
- [ ] At 200% text zoom and narrow width, no body text or controls are cut off or concealed by sticky headers/footers. Inspect every question type encountered.
- [ ] Reading passage is selectable/readable, while “Go to question” and “Back to passage” land at the relevant content. Return to the selected answer without losing it.
- [ ] Guided sorting, passage evidence selection, multiple choice and text/table questions are workable with touch and keyboard, with visible focus and ≥44 CSS-px targets where practical.
- [ ] Incorrect guided attempt shows a helpful hint without leaking the key; second attempt finalizes; refresh retains a first-miss hint and selected draft.
- [ ] Skill Check never reveals correctness, Myanmar explanations, or scores until the full assessment is submitted. Abandoning the check should not update ordinary practice mastery.
- [ ] Results meaningfully distinguish missed questions, support study next steps, and avoid giving recommendations for the wrong skill.

## Screen-reader & keyboard walkthrough (release blocker)

Use NVDA + Firefox (Windows) and/or VoiceOver + Safari (iOS/macOS), and ideally TalkBack + Chrome (Android). Record software/version and issue reproduction steps.

- [ ] Page title, headings, main landmark and primary navigation are announced in logical order.
- [ ] Tab/Shift+Tab reaches each active study action in a predictable order; focus is visible and never lost during question transitions.
- [ ] Radio choices are announced with question grouping and selected state; classification and passage-selection buttons report pressed/unpressed state.
- [ ] Partial-answer changes and retry hint announcements are useful but not excessively repetitive.
- [ ] Myanmar dialog announces its label and content, constrains focus while open, closes with Escape/Close, and restores trigger focus.
- [ ] Incomplete Skill Check submission announces the unanswered count and positions the learner at the first unanswered question.
- [ ] Result heading receives focus after submission; correct/incorrect reviews are readable; no hints or answers were accessible prematurely.

## Myanmar content editorial acceptance (release blocker)

At least one proficient Myanmar editor familiar with GED terminology should read every newly authored explanation in the proposed teaching batches (including Explicit Meaning, Inference, Supporting Details, Summary, Conclusions, Claims & Argument Structure, Finding Evidence). Compare copy to the actual passage, question, correct key and distractors rather than editing in isolation.

- [ ] Terminology is consistent, natural and understandable to local GED students; language is neither too formal nor slangy.
- [ ] Explanation teaches the reasoning and evidence rather than merely translating the answer.
- [ ] Every distractor rationale is supported; no invented facts or excessive certainty.
- [ ] Hints do not disclose correct options before a learner attempts the question.
- [ ] Corrected text is rebuilt from `content-src`; generated content matches.
- [ ] Reviewer names/date, revisions and remaining exceptions are recorded.

## Release decision

- [ ] Record the tested commit SHA, CI run, reviewer and device matrix.
- [ ] Fix all high-severity blockers and rerun the complete CI on the final SHA.
- [ ] Confirm `main` and site remain unchanged until explicit merge/deploy authorization.
- [ ] Merge only the consolidated PR if approved; earlier stacked PRs overlap and **must not be merged separately afterward**.

**Go/no-go rule:** Automated CI passing is necessary but **not sufficient**. Leave the candidate in draft while any manual release-blocking items are unverified.
