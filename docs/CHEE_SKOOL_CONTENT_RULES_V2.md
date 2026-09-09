# Chee Skool Content Rules v2

## Purpose

These rules govern learner-facing RLA content across Study Guides, Workbooks, Interactive Practice, Train, Skill Check, Passage Practice, Extended Response, and Mock.

The aim is not to maximize content volume. The aim is to help a learner understand a skill, apply it, transfer it to fresh material, and measure progress honestly.

## Non-negotiable rules

### 1. Canonical source is the truth
All content corrections must exist in `content-src/` before release. `data/generated/` is build output and must never become the only place where a correction lives.

### 2. Every asset has one job
A Study Guide teaches. A Workbook supports guided application. Interactive Practice applies the skill. Train revisits and transfers. Skill Check measures independently. Mock simulates broader exam conditions. Do not make several formats that perform the same learner job.

### 3. Teach before testing unless the activity is explicitly diagnostic
Learners must know whether they are learning, practising, reviewing, or being independently checked.

### 4. Difficulty rises through reasoning
Harder work should come from deeper reasoning, more distant evidence, closer distractors, multiple constraints, or source integration. Do not manufacture difficulty with confusing instructions or unnecessary vocabulary.

### 5. Scaffold, then remove the scaffold
Hints, classification supports, worked examples, and guided prompts should decrease as the learner moves toward independent performance.

### 6. Fresh transfer is required
A learner should prove a skill on new material. Repeating an old answer is weaker evidence than applying the same reasoning pattern to a fresh passage.

### 7. Explanations must teach the reasoning
Do not write generic feedback such as “the passage supports this choice.” Explain why the correct answer fits the task and, when useful, why a tempting wrong answer fails.

### 8. Distractors represent realistic mistakes
Use misconception-based distractors such as too broad, too narrow, true-but-irrelevant, unsupported inference, reversed relationship, wrong scope, summary-not-analysis, or evidence for another claim. Do not use filler choices.

### 9. Tips are conditional strategies, not hacks
Prefer `Quick rule`, `Common trap`, and `Fast check`. Never teach shortcuts that can replace reading and reasoning.

### 10. Interaction must serve the mental task
Use sorting, select-text, drag-order, editing dropdowns, matching, or recall cards only when the interaction helps the learner perform the target reasoning. Variety alone is not a reason.

### 11. Repeat the skill, not the content
Rotate topic, genre, structure, evidence pattern, tone, passage organization, and distractor logic. Do not create a new passage by changing names and surface details around the same skeleton.

### 12. Authentic passages stay authentic
A passage must not contain test-prep commentary that tells the reader what the passage “shows,” what evidence limitation to notice, or how to judge the argument merely to create question opportunities.

### 13. Resource progression must be visible
A learner should understand the intended sequence:
`Learn -> Guided -> Apply -> Independent -> Transfer -> Check`

Not every skill needs every interaction, but the next useful step should be clear.

### 14. Every unit ends with transfer
The final learning step should use fresh material with reduced support.

### 15. No dead ends
After a learner finishes a resource or practice set, give one clear next action: continue, transfer, review mistakes, Train, or Skill Check.

## Content-authoring quality gate

Before publication, confirm:

- The asset has a distinct learner job.
- The target skill is clear.
- The learner can answer using the provided source.
- There is one best answer where an objective item requires one.
- Correct reasoning has an explicit evidence path.
- Distractors are plausible and diagnostic.
- Explanations are specific rather than boilerplate.
- Difficulty comes from reasoning, not wording.
- The material is fresh relative to nearby resources.
- The passage does not reveal the intended analysis artificially.
- The learner knows what to do next.
- Canonical source and generated output match.
- The PDF/resource registry has no orphan or missing learner files.

## Release principle

More content is not automatically better.

When an existing skill already has enough coverage, improve:
- progression,
- transfer,
- explanation quality,
- passage authenticity,
- learner guidance,
- and variety of reasoning demand

before adding additional questions or files.
