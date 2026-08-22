# Studo Extended Response V1 Design

**Date:** 2026-08-22  
**Status:** Concept approved; written spec pending user review  
**Base:** Studo after Reading, Arguments & Sources, and Language & Editing V1

## Goal

Build a serious GED RLA Extended Response training system that teaches learners how to analyze paired arguments, choose the better-supported position, use evidence accurately, explain reasoning, organize a response, revise it, and complete a 45-minute full ER practice. V1 must not pretend to automatically grade essays with an AI score.

## Product principle

Studo should train the process that earns rubric points, not merely provide an empty essay box.

A learner progresses from small, deliberate writing tasks to a complete timed response:

1. understand the task and map both sources;
2. select the better-supported position;
3. build a thesis and select evidence;
4. analyze evidence and reasoning instead of summarizing;
5. organize, develop, revise, and edit;
6. complete full paired-source ER practice.

## Internal skill model

Keep the existing twelve `W1.*` skills for tracking and analytics.

| Internal skill | Purpose |
| --- | --- |
| W1.1 | Understand the task |
| W1.2 | Map both arguments |
| W1.3 | Select better-supported position |
| W1.4 | Build evaluative thesis |
| W1.5 | Select specific source evidence |
| W1.6 | Analyze evidence |
| W1.7 | Analyze reasoning |
| W1.8 | Organize the response |
| W1.9 | Develop ideas |
| W1.10 | Revise for focus & clarity |
| W1.11 | Edit conventions |
| W1.12 | Full paired-source ER |

## Learner-facing structure

Expose six coherent units instead of twelve fragmented skill pages.

### Unit 1 — Understand & Map the Sources
Internal skills: `W1.1`, `W1.2`

Learner outcomes:
- identify what the ER prompt asks;
- identify each source's main claim;
- map evidence, reasoning, assumptions, and limitations;
- distinguish the author's position from the learner's personal opinion.

### Unit 2 — Choose the Stronger Argument
Internal skill: `W1.3`

Learner outcomes:
- compare support, relevance, sufficiency, reasoning, and credibility;
- choose the better-supported argument even when personally disagreeing;
- explain the choice in one or two precise sentences.

### Unit 3 — Thesis & Evidence
Internal skills: `W1.4`, `W1.5`

Learner outcomes:
- write an evaluative thesis naming the stronger argument and main reasons;
- select specific, relevant source evidence;
- preserve qualifiers such as `may`, `some`, `suggests`, and `could` rather than strengthening source claims.

### Unit 4 — Analyze, Don't Just Summarize
Internal skills: `W1.6`, `W1.7`

Learner outcomes:
- use the repeatable structure `Point -> Evidence -> Analysis -> Comparison`;
- explain why evidence supports a claim;
- identify reasoning strengths, unsupported assumptions, and weak predictions;
- compare the stronger and weaker arguments directly.

### Unit 5 — Organize, Develop & Revise
Internal skills: `W1.8`, `W1.9`, `W1.10`, `W1.11`

Learner outcomes:
- organize an introduction, purposeful body paragraphs, and concise conclusion;
- connect evidence to thesis rather than listing quotations;
- revise repetition, vague language, weak transitions, and source drift;
- edit conventions for clarity while accepting that perfect grammar is not required.

### Unit 6 — Full Extended Response
Internal skill: `W1.12`

Learner outcomes:
- read and annotate paired source texts;
- plan efficiently;
- write a complete response;
- revise within a 45-minute practice window;
- review the response against the three GED rubric traits.

## Learning ladder

Do not begin with repeated full essays.

### Stage 1 — Recognition
Short tasks identify the stronger argument, stronger evidence, unsupported claim, or correct thesis.

### Stage 2 — Controlled construction
Learners write one thesis, one evidence explanation, one comparison sentence, or one outline component.

### Stage 3 — Paragraph construction
Learners produce a complete `Point -> Evidence -> Analysis -> Comparison` body paragraph.

### Stage 4 — Response planning
Learners map both sources and create a thesis plus body-paragraph outline.

### Stage 5 — Untimed complete response
Learners write a complete ER with access to planning supports and rubric reminders.

### Stage 6 — Timed simulation
Learners receive paired sources, a 45-minute timer, a compact planning panel, and no interruptive feedback before submission.

## Content package

### Six unit resource sets

Each learner-facing unit receives:
- one Study Guide PDF;
- Workbook 1 for foundational practice;
- Workbook 2 for stronger application;
- focused interactive practice.

Total baseline PDF target: **18 PDFs**.

The Study Guides follow the existing Studo teaching standard:
1. learning goal;
2. plain-language explanation;
3. contrast with commonly confused ideas;
4. exam-style wording;
5. repeatable method;
6. worked example;
7. common traps;
8. diagnostic help;
9. quick check.

### Focused interactive practice

Focused practice should use short paired-source excerpts and writing fragments rather than only ordinary multiple-choice items.

Supported task types for V1 may include:
- choose the better thesis;
- select the strongest evidence;
- distinguish summary from analysis;
- identify an unsupported assumption;
- choose the strongest analysis sentence;
- order paragraph components;
- choose the best revision;
- edit a sentence for precision or conventions.

The interactive layer should track the appropriate `W1.*` skills even though learners navigate through six units.

## Full paired-source prompt bank

Create at least **8 original paired-source ER prompts** for the initial bank.

Topic mix should include several of the following:
- transportation;
- renewable energy;
- workplace automation;
- school policy;
- environmental regulation;
- infrastructure spending;
- public health policy;
- community development.

### Prompt quality requirements

Each prompt must:
- contain two defensible, genuinely competing positions;
- avoid making one source obviously foolish;
- include differences in evidence quality, reasoning, assumptions, or credibility that require analysis;
- give enough source material to support a complete response;
- use original Studo text or properly reusable material;
- have a documented authoring key describing why one argument is better supported and what evidence/reasoning makes the difference;
- preserve uncertainty and qualifiers accurately.

Across the bank, vary which source is stronger so learners cannot infer that Source A or Source B usually wins.

## Full ER interface

### Source area
- Source A and Source B accessible without leaving the task;
- clear source labels;
- comfortable reading width;
- highlighting/annotation if the existing architecture can support it without introducing a fragile subsystem; otherwise defer highlighting to a later version.

### Planning panel
Provide a compact optional planner with fields for:
- stronger argument;
- reason 1;
- evidence 1;
- reason 2;
- evidence 2;
- weakness or limitation in the other argument.

The planner is a scaffold, not part of the submitted essay.

### Writing area
- large plain-text essay editor;
- live word count only if it does not imply an official required word count;
- no automatic rewriting or sentence suggestions during timed simulation;
- learner text stored locally using the same privacy-first local-storage pattern as existing progress data.

### Timer
- full simulation starts at **45:00**;
- learner can submit early;
- timer reaching zero stops or locks editing only if that behavior is clearly communicated before starting;
- untimed practice remains available separately.

## Review and scoring model

### No fake automatic essay grade

V1 must not output claims such as `AI Score: 6/6`, `Official GED Score`, or any equally misleading automatic grade.

### Rubric-based review

After submission, show three review areas:

1. **Argument & Evidence — 0 / 1 / 2**
   - clear judgment of which argument is better supported;
   - relevant evidence from source texts;
   - explanation of why the evidence/reasoning matters;
   - evaluation rather than personal opinion.

2. **Development & Organization — 0 / 1 / 2**
   - clear thesis and logical progression;
   - purposeful paragraphs;
   - developed explanation;
   - useful transitions and formal tone.

3. **Clarity & Standard English — 0 / 1 / 2**
   - readable sentence control;
   - grammar/punctuation sufficient for clarity;
   - precise wording;
   - errors do not repeatedly interfere with meaning.

### Self-review workflow

For each trait, Studo should provide:
- a concise 0/1/2 rubric description;
- a checklist of observable evidence in the learner's own response;
- examples of weak vs. stronger execution;
- targeted revision questions;
- an exemplar/annotated model response for the same prompt only after the learner has submitted or explicitly chooses to reveal it.

Learners choose their own provisional trait score. Store that self-score separately from objective quiz accuracy so the progress system does not treat it as a machine-verified grade.

## Exemplars

Each full ER prompt should eventually have:
- a high-quality model response;
- annotations showing thesis, evidence, analysis, comparison, organization, and revision choices;
- where useful, a weaker sample illustrating common problems such as summary-only writing or unsupported claims.

Model responses should be clear and controlled rather than unnaturally sophisticated.

## Relationship with Arguments & Sources and Language & Editing

Extended Response must reuse prior learning instead of duplicating it.

- `Arguments & Sources` supplies claim/evidence/reasoning analysis.
- `Language & Editing` supplies sentence-level clarity, conventions, transitions, and revision support.
- ER feedback may link learners back to those existing units when a weakness is identified.

Examples:
- weak evidence evaluation -> recommend Arguments & Sources / Evidence Quality;
- repeated run-ons -> recommend Language & Editing / Sentence Boundaries & Punctuation;
- vague source comparison -> recommend Arguments & Sources / Compare Sources & Arguments.

## Progress model

Track at minimum:
- completion of focused ER exercises;
- accuracy on objective ER-analysis questions;
- full-response attempts;
- timed vs. untimed attempt;
- provisional self-scores for Traits 1–3;
- revision completion;
- prompt history so learners can revisit past responses.

Do not merge self-assigned rubric scores into objective mastery percentages without an explicit label separating them.

## Publication state

Extended Response stays `preview` while resources or full-prompt flow are incomplete.

Publish only after:
- all six learner units exist;
- all required resource links resolve;
- focused practice covers all twelve internal skills;
- at least eight full paired-source prompts exist;
- full ER writing/review flow works locally;
- timer behavior is tested;
- progress persistence is tested;
- PDF QA passes;
- clean canonical rebuild passes;
- automated regression tests pass;
- no learner-facing placeholder/prototype ER content remains.

## QA requirements

### Content QA
- source claims remain accurate when paraphrased;
- one defensible answer for objective exercises;
- no systematic A/B answer patterns;
- distractors represent genuine reasoning/writing mistakes;
- explanations diagnose the mistake rather than repeat generic text;
- paired arguments are genuinely competitive;
- stronger source alternates across prompt bank;
- exemplar analysis matches the source texts.

### Interface QA
- no source text is hidden behind the editor;
- keyboard-only navigation remains usable;
- timer state survives ordinary UI interactions;
- switching Source A/Source B does not erase essay text;
- accidental refresh recovery follows existing local-storage conventions where practical;
- self-score is clearly labeled as learner review, not official scoring.

### Build QA
- `content-src/` remains canonical;
- clean `data/generated/` deletion + rebuild reproduces all ER content;
- no preview content leaks into published navigation before release;
- existing Reading, Arguments, and Language regression suites remain green.

## Non-goals for V1

Do not build:
- AI essay grading;
- server accounts/database sync;
- collaborative teacher grading;
- plagiarism detection;
- grammar auto-rewrite;
- official-score prediction;
- complex rich-text editing unless required for basic usability.

These may be considered after a stable ER training system exists.

## Success definition

Extended Response V1 is successful when a learner can move from not knowing how to approach the ER to repeatedly practicing the exact component skills, complete a realistic paired-source response in 45 minutes, and use a transparent rubric-based process to identify what to improve next—without Studo claiming to know an official essay score it cannot reliably determine.
