# Studo Phase 4C.1 — Curriculum Attachment

## Why this exists
Content Studio could already create passages and question sets, but authored sets did not have a first-class place in the RLA curriculum map. Phase 4C.1 adds that missing layer.

## New curriculum metadata
Every Phase 4 question set now stores a `curriculum` object:

```json
{
  "domain": "Core Meaning",
  "primarySkillId": "R1.2",
  "secondarySkillIds": ["R1.3"],
  "contentKind": "passage_practice",
  "learningObjective": "Identify the main idea and choose the detail that best supports it.",
  "topicLabel": "Main Idea"
}
```

## Content Studio workflow
A new **Curriculum** step sits between Passage and Question set.

The author chooses:
- RLA domain
- primary skill
- optional secondary skills
- content format
- learner-facing topic
- learning objective

Content Studio shows the resulting path, for example:

`RLA → Core Meaning → Main idea / central idea`

## Why set-level and question-level tags both exist
The **set-level placement** tells Studo where the learning asset belongs in navigation and curriculum coverage.

The **question-level primary skill** tells the learning engine exactly what each question measures.

This means a Main Idea set may contain a Supporting Details question without losing its main curriculum home.

## Compiler support
The compiler now carries curriculum metadata into:
- each generated module's `contentMeta.curriculum`
- generated index entries

This prepares the learner UI to build Practice navigation and coverage directly from curriculum metadata later.

## Validation
The validator now checks:
- curriculum domain exists
- primary skill exists
- skill belongs to the selected domain
- content format is valid
- secondary skills exist
- learning objective is present (warning if missing)
- non-mixed sets actually contain a question testing their primary skill

## Existing Phase 4 content migrated
All five published source sets now have curriculum placement:
- Night Shift → Relationships & Inference → Inference from details
- Last Bus → Relationships & Inference → Inference from details
- Sentence Repair → Language & Editing → Basic subject–verb agreement
- Precision Check → Language & Editing → Basic subject–verb agreement
- Library Hours → Argument Analysis → Evidence relevance

## Current validation status
- 0 blocking errors
- 2 existing transfer-family warnings for the writing set
