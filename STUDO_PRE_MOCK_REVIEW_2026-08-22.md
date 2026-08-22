# Studo Pre-Mock System Review

Date: 2026-08-22

## Bottom line
Studo now has a credible RLA learning foundation. The earlier problem of "we technically have it, but it is not useful" has been reduced substantially in Reading, Arguments, Language, Extended Response, Practice discovery, and Resources.

It is **not yet a complete GED RLA preparation product**, because the Quiz/Test layer is still legacy behavior and does not simulate the real exam.

## Strong now

### Curriculum and learning progression
Four published RLA tracks now form a coherent path:
1. Reading & Comprehension
2. Arguments & Sources
3. Language & Editing
4. Extended Response

The learner-facing curriculum is simplified while detailed internal skills remain available for tracking.

### Reading
- 24 mixed Passage Practice sets.
- 400–900 word learner passage range enforced.
- 75% informational / 25% literary baseline.
- Longer stamina practice included.
- Distractor and feedback QA is materially stronger than V1.

### Arguments & Sources
- 9 learner units / 15 internal skills.
- 72 focused questions + 36 mixed-source questions.
- Paired sources, evidence strength, credibility, assumptions, counterarguments, data and synthesis.

### Language & Editing
- 7 learner units / 13 internal skills.
- 56 focused questions + 36 mixed editing questions.
- Editing practice uses 350–450 word contexts rather than only isolated grammar rules.

### Extended Response
- 6 learner units / 12 internal writing skills.
- 48 focused component questions.
- 8 paired-source full prompts.
- Timed 45-minute and untimed writing workspace.
- Planner, autosave, rubric-based self-review, revision, and exemplars.
- No fake automatic 6/6 score.

### Progress and Train Me
- Objective mastery signals and review timing are retained locally.
- Confidence and mistake signals feed adaptive short sessions.
- ER self-review is kept separate from objective mastery.
- Local learning-data backup/restore exists.

### Engineering/content QA
- `content-src/` is the canonical source.
- Clean builds are reproducible.
- Validators catch key/explanation mismatch, duplicate options, answer patterns, weak coverage signals, placement errors, and resource/module reference failures.
- Completed content tracks can publish without dragging preview/prototype content into learner navigation.

### Discovery after this cleanup
- Practice search now understands learner units.
- Passage Practice is organized into four meaningful reading contexts.
- Resources is organized by what the learner studies, not by file extension.
- 151 resources map to 44 learner topics without duplication.
- Invalid explicit track routes fail visibly rather than silently opening Reading.

## Weak / unfinished

### 1. Quiz / Full RLA Test — critical remaining issue
This is the biggest product problem.

Current legacy behavior intentionally loads **every matching question** into a test.

Current generated bank produces approximately:
- Reading: 435 questions / ~528 min
- Arguments: 108 questions / ~110 min
- Language: 92 questions / ~69 min
- Writing component questions: 48 questions / ~56 min
- Full bank: **683 questions / ~762 minutes (12 h 42 min)**

Therefore the current "Full RLA Test" is not a mock exam. It is a bulk question dump with a timer.

**Next priority:** replace this system with a real blueprint-driven mock/test engine.

### 2. ER recommendations are not fully adaptive yet
Full ER self-review history is displayed correctly, but those self-reviewed trait signals are intentionally not treated as objective mastery. Later, Studo could use them as clearly-labeled recommendations (not verified scores), e.g. suggest "Analyze, Don't Just Summarize" after repeated low Trait 1 self-reviews.

### 3. Manual accessibility / real-device QA still needed
Automated structure, file, syntax, and content checks are good, but final alpha should still include:
- keyboard-only navigation;
- screen-reader landmark/form-label review;
- actual phone/tablet tests;
- zoom at 200%;
- dark-mode visual pass;
- slow/mobile connection check.

### 4. Release/product polish later
Before public alpha:
- update the release/version label;
- remove or clearly label developer/authoring pages not intended for learners;
- decide what the Quiz nav item says while the real mock engine is being built;
- run one final end-to-end learner journey from Home -> study -> practice -> Train -> Progress -> Mock.

## Recommended order from here
1. Build the real GED-style Mock/Test system.
2. Run full real-device/accessibility QA.
3. Fix remaining content coverage warnings where they materially improve transfer.
4. Final alpha polish/versioning/deployment review.

## Product judgement
The learning-content foundation is now close to the original Studo goal: calm, skill-focused, evidence-driven RLA preparation with useful practice rather than decorative features.

The site should **not** be called complete until the legacy Quiz/Test behavior is replaced. Once the mock engine is realistic and the final device/accessibility pass is completed, Studo can reasonably move toward an alpha candidate.
