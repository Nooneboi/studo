# Arguments & Sources V1 Design

## Goal
Build a complete, learner-usable Arguments & Sources track that teaches and tests GED RLA argument evaluation and multi-source reasoning at the same quality bar as the refined Reading track, while keeping the detailed R5/R6 skill taxonomy for analytics and progress tracking.

## Why this track exists
Official GED RLA targets require learners to delineate and evaluate arguments and claims, identify evidence, judge relevance and sufficiency, distinguish supported from unsupported claims, assess reasoning and assumptions, compare argumentative texts, analyze text with data/visual information, compare formats, and synthesize across sources. The Extended Response also depends on these same skills because the learner must decide which position is better supported and explain why.

## Learner-facing structure
The current 15 internal skills remain canonical for tagging, QA, progress, recommendations, and authoring. Learners see 9 larger units so the course does not feel fragmented.

### Domain: Argument Analysis
1. **Claims & Argument Structure**
   - Internal skills: R5.1 Claim identification; R5.2 Argument chain / structure
   - Learner outcome: identify the main claim, supporting claims, and how the argument is built.

2. **Finding Evidence**
   - Internal skill: R5.3 Evidence identification
   - Learner outcome: identify which specific evidence supports a claim or conclusion.

3. **Evidence Quality**
   - Internal skills: R5.4 Evidence relevance; R5.5 Evidence sufficiency
   - Learner outcome: decide whether evidence actually relates to the claim and whether it is enough to support it.

4. **Supported vs. Unsupported Claims**
   - Internal skill: R5.6
   - Learner outcome: distinguish evidence-backed claims from assertions, predictions, or unsupported conclusions.

5. **Reasoning & Assumptions**
   - Internal skills: R5.7 Reasoning validity / fallacies; R5.8 Assumptions & premises
   - Learner outcome: identify reasoning gaps, hidden assumptions, and why a flaw weakens an argument. Do not require memorization of fallacy names.

6. **Credibility & Counterarguments**
   - Internal skills: R5.9 Source credibility; R5.10 Counterargument & response
   - Learner outcome: judge whether a source is appropriate for the claim and analyze how a writer acknowledges, concedes, rebuts, or ignores an opposing view.
   - Note: R5.9 remains a Studo extension supporting GED argument evaluation, not a standalone official GED target.

### Domain: Multiple Texts & Formats
7. **Compare Sources & Arguments**
   - Internal skills: R6.1 Compare texts on same topic; R6.2 Opposing arguments
   - Learner outcome: compare perspective, evidence emphasis, interpretation of facts, and overall argument strength across two texts.

8. **Text, Data & Different Formats**
   - Internal skills: R6.3 Text + data / visuals; R6.4 Different genres / formats
   - Learner outcome: determine whether data or another format supports, extends, clarifies, or contradicts a text, and compare differences in purpose, scope, audience, or emphasis.

9. **Synthesize Across Sources**
   - Internal skill: R6.5
   - Learner outcome: combine information from multiple sources to draw a new supported conclusion or apply information to a new situation.

## Curriculum architecture
Add a learner-unit layer to the generated curriculum rather than inventing duplicate skill IDs.

Each Arguments domain in `content-src/config/rla.curriculum.json` will define `units` with:
- `id`
- `label`
- `summary`
- `skillIds`

The build step will aggregate resources, focused practice, question counts, and availability from the internal skills into each learner unit. Detailed skill records remain in generated curriculum for progress/analytics, but the Arguments domain page renders the 9 units rather than 15 raw skills.

The learner unit page will display:
1. Study Guide
2. Workbook 1 - Learn
3. Workbook 2 - Apply
4. Focused Interactive Practice

Mixed multi-skill source sets do not appear under every unit. They live in an Arguments-specific mixed practice area, using the same placement principle established for Reading Passage Practice.

## Content progression
### Level 1 - Learn
- Short argument excerpts, generally 120-250 words.
- One reasoning target at a time.
- Clear but non-trivial distractors.
- Explicit method and worked examples.

### Level 2 - Apply
- 250-450 word source material or paired short sources.
- Two related internal skills may be combined.
- Distractors reflect real misconceptions: relevant-but-insufficient, true-but-not-supporting, correlation/cause confusion, overstatement, unsupported assumption.

### Level 3 - GED Practice
- 400-900 words total source material per set, including paired texts where appropriate.
- Mixed R5/R6 skills.
- Close answer choices with one defensible best answer.
- No skill labels inside the question experience.
- Include workplace, science, civic/social-studies, consumer/community, and policy contexts.

### Level 4 - Later mock layer
Not part of Arguments V1. The future mock test will mix Reading, Arguments, Language, and Extended Response under real timing constraints.

## Minimum V1 deliverables
For each of the 9 learner units:
- 1 Study Guide PDF
- 2 Workbook PDFs
- 1 focused interactive module with 8 questions

Mixed practice:
- 6 GED-style mixed source sets, each 6-8 questions
- At least 3 paired-source sets
- At least 1 text + data/table set
- At least 1 different-format set (for example article + fact sheet/FAQ)
- At least 2 sets that explicitly compare argument strength and therefore bridge into Extended Response

Target focused questions: 72
Target mixed questions: 36-48
Target total interactive baseline: about 108-120 questions

## Assessment rules
- One defensible best answer only.
- No predictable answer-position cycles or long runs.
- Level 2/3 distractors must be plausible from the source.
- Difficulty comes from evidence distance, qualification, synthesis, and close distinctions, not obscure vocabulary.
- `whyWrong` must diagnose the actual misconception for each distractor.
- Preserve qualifier strength: may/some/suggests cannot become proves/all/causes.
- For evidence questions, distinguish relevance from sufficiency.
- For reasoning questions, explain the flaw rather than testing fallacy-name trivia.
- Source credibility questions must evaluate fit, expertise, evidence quality, or conflict with the claim; they must not reward superficial prestige.

## PDF teaching standard
Each Study Guide follows the established Studo structure:
1. Learning goal
2. Plain-language explanation
3. Contrast with confused ideas
4. GED-style question wording
5. Repeatable method
6. Worked example
7. Common traps
8. Diagnostic help
9. Quick check

Workbook rules:
- Workbook 1: focused Learn practice
- Workbook 2: harder Apply practice
- varied contexts
- answer reasoning
- mistake-check section
- no filler distractors
- actual selectable text

Visual rules remain the current Studo standard: Inter, dark text on white, dark lavender accent, readable 14-15 pt learner text, single clear reading column, generous spacing.

## Extended Response bridge
Arguments V1 will not build the essay editor yet, but Units 3, 4, 5, 7, and 9 should deliberately prepare learners for ER Trait 1 by training:
- relevant and specific evidence
- supported vs unsupported claims
- assumptions and reasoning validity
- comparison of opposing arguments
- evaluation of which position is better supported

At least two mixed sets should end with an analysis question asking which argument is better supported and why.

## Existing prototypes
Existing Night Shift, Last Bus, and Sunday library-hours prototypes are not protected merely because they already exist. They may be reclassified, replaced, or retired if they do not meet the new standard. Their useful ideas can be reused only if the final item remains original, accurate, and high quality.

## Publication strategy
Arguments remains `preview` during construction. It becomes `published` only when:
- all 9 units have required resources and focused practice;
- mixed-source baseline is present;
- validators report 0 blocking errors;
- Arguments-specific regression tests pass;
- PDFs render cleanly;
- local learner navigation and modules pass smoke tests.

## QA additions
Add Arguments-specific regression checks for:
- exactly 9 learner-facing units;
- all 15 R5/R6 internal skills mapped to one learner unit;
- no duplicate/unmapped internal skill IDs;
- minimum resource/practice coverage per unit;
- at least 6 mixed source sets;
- paired-source and text+data coverage;
- no answer-pattern QA warnings in published Arguments modules;
- no excessive generic wrong-answer feedback;
- mixed source material within intended Level 3 length range;
- resource/module references resolve after a clean rebuild.

## Out of scope
- Language & Editing build
- Extended Response essay editor/scoring UI
- full GED mock test
- user accounts/cloud sync
- unrelated UI redesign

