# Studo Reading & Comprehension Quality Refinement V1 Design

**Date:** 2026-08-22
**Status:** Approved for implementation in chat

## Goal

Turn the existing published Reading & Comprehension track from a broad V1 content bank into a defensible GED-RLA training baseline: fair questions, useful feedback, realistic passage practice, honest difficulty, and a clear progression from skill learning to transfer.

## Why this phase exists

Foundation QA V1 made the build safe and exposed quality warnings. The Reading track now has 22 published skills, 85 learner resources, 33 skill-practice sets, and a substantial Passage Practice bank, but the audit found recurring weaknesses:

- predictable correct-answer positions;
- generic `whyWrong` feedback;
- some implausible/easy distractors;
- some short items classified as GED-style Passage Practice;
- no 600+ word Passage Practice;
- too little civics/history informational reading;
- some difficulty metadata that overstates reasoning demand;
- study guides that teach well but lack explicit diagnostic-help sections.

The design preserves useful material. It does not rewrite files just to create activity.

## Official alignment target

Use GED Testing Service guidance as the primary reference:

- reading-comprehension stimulus passages: roughly 400-900 words;
- long-term stimulus mix: about 75% informational and 25% literary;
- informational contexts include science, social studies, and workplace material;
- difficulty should include inference, relationships, purpose, structure, word meaning, and evidence-based reasoning rather than obscure instructions.

Recent 2026 learner reports are treated only as secondary pattern evidence. Repeated reports about long passages, time pressure, and very similar answer choices support stronger close-choice discrimination, but do not define official test content.

## 1. Preserve the learning progression

### Skill pages

Skill pages remain focused on deliberate practice:

- Study Guide -> explanation and method;
- Workbook 1 -> Learn;
- Workbook 2 -> Apply;
- existing Workbook 3 where present -> stronger Apply;
- Interactive Practice -> focused retrieval and diagnostic data.

Existing short skill drills do **not** need to imitate 800-word exam passages. If an item is intentionally foundational, its difficulty metadata should say so.

### Passage Practice

Passage Practice is the Level 3 transfer layer:

- coherent 400-900 word passages;
- mixed Reading skills;
- 6-8 questions when appropriate;
- plausible competing choices;
- no hints from skill labels;
- strong evidence paths and specific feedback.

Exam simulation remains a later phase.

## 2. Assessment-calibration rules

### Correct-answer positions

No authored A/B/C/D cycle. Published Reading sets should avoid obvious local patterns and long runs. Option order may be changed without changing construct meaning.

### Distractors

Every standard MCQ should have one defensible best answer. Wrong choices should represent genuine errors such as:

- too broad / too narrow;
- true but irrelevant;
- supported by only one clue;
- inference that adds an assumption;
- reversed relationship;
- overstatement of certainty;
- related detail answering a different question;
- summary instead of theme/purpose;
- correct concept applied to the wrong paragraph or subject.

Absurd filler choices are not acceptable in Level 2/3 material.

### Feedback

`whyWrong` must explain the actual error. Generic bank-wide phrases are replaced by question-specific or misconception-specific feedback. Correct explanations must explain why the evidence supports the answer, not merely restate the key.

### Difficulty metadata

Difficulty is calibrated from reasoning, evidence distance, text complexity, and distractor similarity. Foundational skill drills may be `easy`/`medium`; realistic transfer passages may be `medium`/`hard`.

## 3. Existing Reading content treatment

### Study Guides

Preserve the existing instructional core. Add a short skill-specific **Diagnostic help** section to each of the 22 skill guides so learners can identify why they missed an item. Do not redesign otherwise-good guide pages.

### Workbooks

Preserve workbooks unless an objective defect is found. This phase does not regenerate every workbook merely to change fonts or appearance. When a workbook is touched for content, keep the current Studo visual-accessibility standard.

### Skill Interactive Practice

For all published Reading modules:

- remove predictable answer-position cycles;
- replace generic repeated `whyWrong` strings with useful feedback;
- correct objective key/explanation defects;
- downgrade overstated difficulty where appropriate;
- strengthen the weakest high-priority items, especially inference, conclusions/generalizations, relationships, tone, purpose, and perspective.

### Existing Passage Practice

- Preserve strong 400+ word passages.
- Expand or reclassify learner-visible passages below the GED transfer range instead of pretending they are full passage practice.
- The two tiny Evidence prototypes (`The Last Bus`, `The Night Shift`) are removed from Reading Passage Practice and retained only as development/preview material because they mix preview Argument skills.
- Improve answer-order distribution and feedback across the published Reading passage bank.
- Fix any question whose distractors or explanation make the item unfair or trivial.

## 4. New transfer passages

Add four original Level 3 passages to fill actual bank gaps rather than create volume:

1. **Social studies/civics informational**, ~700-850 words.
2. **Science informational**, ~650-800 words.
3. **Workplace/public-policy informational**, ~650-800 words.
4. **Literary**, ~650-800 words.

Each has 7 mixed Reading questions. Across the four, cover all four Reading domains and emphasize close-choice reasoning, qualifications, evidence distance, and author decisions.

The resulting bank should have meaningful 600+ word stamina practice and retain an overall informational-heavy balance.

## 5. PDF treatment

For each of the 22 skill Study Guides:

- preserve searchable/selectable text;
- append or integrate a concise diagnostic-help section;
- use Inter when regenerating new pages;
- body text around 14 pt;
- dark text on white with Studo lavender accents;
- render and visually inspect changed PDFs.

No mass workbook visual rewrite in this phase unless a changed file fails readability QA.

## 6. QA and tests

Add regression coverage that proves:

- published Reading modules no longer contain authored cyclic answer patterns;
- no published Reading question uses the known generic `whyWrong` phrases above the allowed reuse threshold;
- no Reading Passage Practice item is below 400 words;
- at least four published Passage Practice texts are 600+ words after refinement;
- Passage Practice remains out of skill pages;
- all published Reading resource paths resolve;
- all correct keys exist and explanation-letter checks pass;
- clean source-only builds remain reproducible.

Validation warnings are expected to fall substantially. Preview Writing/Argument singleton warnings may remain because they are outside this phase.

## 7. Non-goals

This phase does **not**:

- publish Arguments & Sources;
- publish Language & Editing;
- build Extended Response;
- build the final GED mock-test blueprint;
- redesign the whole site;
- create cloud accounts/progress sync;
- rewrite every workbook only for visual consistency.

## Success criteria

Reading Quality Refinement V1 is ready for learner review only when:

1. `npm test` passes.
2. `npm run content:check` exits 0.
3. published Reading answer-pattern warnings are eliminated or reduced to justified exceptions.
4. generic-feedback warnings for published Reading are eliminated.
5. every learner-visible Passage Practice item is at least 400 words.
6. the bank includes at least four 600+ word passages.
7. four new transfer passages contain one defensible answer per question and pass manual editorial review.
8. changed Study Guides render without clipping/overlap and remain readable.
9. local static smoke tests find no missing learner pages/modules/resources.
10. the updated project is packaged for GitHub Desktop review before commit.
