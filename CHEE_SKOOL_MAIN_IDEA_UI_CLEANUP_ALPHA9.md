# Chee Skool Main Idea UI Cleanup — 0.7.0-alpha.9

## Purpose
Reduce learner-facing friction in the Main Idea Active Learning Path without weakening the academic progression or adding decorative features.

## Learner-facing changes
- Removed the pre-answer **Need help?** control from active-learning questions.
- Authored hints still exist, but appear only after a learner's first incorrect Guided attempt.
- Removed **Sure / Unsure / Guessing** from the active-learning unanswered flow. Confidence collection remains available in Train and is not required to complete these Guided activities.
- Removed the visible `1 sentence selected` / `No selection yet` counter from single-select passage questions. Selection is communicated by the selected passage state, with a screen-reader-only live announcement retained for accessibility.
- Disabled **Next / Finish** until the current active-learning question has been checked. This leaves one obvious primary action while answering.
- Kept Previous available for review after the learner has moved beyond the first question.
- Refined Q1 language from a potentially muddy `main point vs supporting detail` distinction to an importance/scope distinction:
  - `Key to main idea`
  - `Specific detail`
- Q1 prompt is now: **How important is each statement to the passage’s main point?**

## Learning progression retained
1. Guided: distinguish key information from specific detail.
2. Guided: select the sentence that states what the evidence taught the city.
3. Apply: identify the central idea in MCQ form.
4. Apply: distinguish too narrow, too broad, and whole-passage statements.
5. Independent: select the strongest evidence for a qualified idea.
6. Independent: identify the qualified central idea in GED-style MCQ form.

## Product rule reinforced
A feature stays in the learner workspace only if it helps the learner understand, answer, receive feedback, navigate, or access the material. Helpful data collection must not interrupt the core reading-and-reasoning loop.

## Verification
- 111 automated tests passed.
- Content validation: 0 errors, 0 warnings.
- 96 generated learner modules.
- Source JS/MJS syntax: 42 checked, 0 failures.
- Public JS syntax: 21 checked, 0 failures.
- Learner-only public build completed successfully.
- Main Idea remains tagged `mock-excluded` while the new interaction UX is being manually tested on real devices.
