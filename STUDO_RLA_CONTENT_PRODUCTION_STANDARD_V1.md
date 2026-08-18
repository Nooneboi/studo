# Studo RLA Content Production Standard v1

## Purpose

This standard turns RLA content creation into a repeatable editorial and assessment-development workflow. It applies to Study Guides, Workbook Sheets, Interactive Practice, and mixed Passage Practice.

The goal is not to imitate surface features of a GED item. The goal is to measure the same kind of reasoning with original, properly sourced material, clear evidence paths, fair distractors, and readable learner-facing design.

## Non-negotiable content placement rule

- **Skill page:** only content primarily created to teach or assess that skill.
- **Topic/domain page:** broad resources covering the whole topic/domain.
- **Passage Practice:** mixed-skill passage sets appear once, even when their questions measure several skills.
- `skillsMeasured` and similar metadata drive scoring, Progress, and Train Me. They do not create duplicate library placements.

## Production pipeline

1. **Research**
   - Confirm the target skill against the current Studo registry and official GED guidance.
   - Log external sources and rights before authoring from them.
   - Treat released GED items as pattern references, not copy material.

2. **Plan**
   - Choose the exact skill, question family, context, difficulty, DOK, and learner mistake to target.
   - Decide whether the content is a Study Guide, Workbook Sheet, Interactive Practice, or mixed Passage Practice.

3. **Teach**
   - Create the Study Guide first when the skill is new.
   - Explain the construct in plain language, then from another useful angle if confusion is common.
   - Include comparison tables only when they reduce confusion.
   - Use worked examples and explain both correct reasoning and common traps.

4. **Practice**
   - Workbook Sheets should move from guided to independent reasoning.
   - Do not reuse the same passages/questions from the Study Guide or web practice.
   - Include answer reasoning, not answer letters alone.

5. **Assess**
   - Interactive Practice should produce useful learner data.
   - Every item needs one primary skill, one best answer, an evidence path, and misconception-based distractors.
   - Confidence, mistake type, and question-family metadata should support later adaptive review.

6. **Validate**
   - Run the Studo content validator.
   - No blocking validation errors may remain before publication.

7. **Render and inspect**
   - Render every PDF and inspect the pages visually.
   - Check text size, contrast, page breaks, crowding, answer-choice spacing, and reading order.

8. **Publish**
   - Confirm every file/link exists in the learner build.
   - Confirm rights/attribution records.
   - Confirm navigation returns to the correct origin.

9. **Review and improve**
   - Treat the first published version as reviewable, not perfect forever.
   - Revise items when learner response patterns reveal weak distractors, ambiguity, or miscalibrated difficulty.

## Minimum skill package

### V1 publish floor

- 1 Study Guide
- 2 Workbook Sheets
- 1 Interactive Practice
- multiple contexts
- deliberate transfer variants for core question families
- no passage duplication across formats

### Expansion target

Priority skills should grow toward:

- 2-3 Interactive Practices
- 3+ workbook/transfer contexts
- multiple item families at more than one difficulty level
- repeated retrieval opportunities in Train Me
- natural appearances in mixed Passage Practice

## Study Guide standard

A Study Guide should answer:

1. What is this skill?
2. Why does it matter?
3. How is it different from nearby/confusing skills?
4. How can I solve it step by step?
5. What traps should I watch for?
6. Can I see a worked example?
7. Can I try a quick self-check?

Use direct language. Avoid long textbook-style introductions.

## Workbook Sheet standard

A Workbook Sheet should:

- begin with a short strategy reminder, not a second full lesson;
- use original or rights-cleared text;
- provide enough space and separation to read comfortably;
- move from clearer evidence to more independent reasoning;
- include fresh transfer contexts;
- provide a concise answer key with reasoning;
- diagnose common mistakes when useful.

## Interactive Practice standard

Interactive Practice should:

- stay focused on the declared skill;
- use fresh text not copied from the workbook;
- include balanced answer positions across the set;
- use clear stems and four fair options for standard MCQ items;
- store distractor type and why-wrong metadata;
- support immediate feedback and later Progress/Train Me analysis.

## Mixed Passage Practice standard

Mixed passages are closer to exam conditions and should not be duplicated onto every skill page.

A strong passage set:

- uses an original or rights-cleared source text;
- contains a coherent 6-8 question mix when appropriate;
- includes multiple skills naturally supported by the source;
- keeps difficulty in the reasoning, not in confusing instructions;
- uses informational/literary balance as a long-term bank target rather than forcing every individual set to match the overall exam ratio.

## Difficulty standard

Difficulty may come from:

- text complexity;
- reasoning depth;
- distance between question and evidence;
- similarity of plausible distractors;
- number of sources/formats;
- response demand.

Difficulty must **not** come from unnecessarily complicated question wording.

## Distractor standard

Wrong answers should represent plausible reasoning errors such as:

- too broad
- too narrow
- true but irrelevant
- mentioned but not supported
- unsupported inference
- reversed relationship
- background only
- evidence for another claim
- partly true
- plot summary instead of theme
- personal opinion instead of text evidence
- wrong sequence
- correlation treated as cause

Do not use absurd filler options.

## Source and rights standard

Every external source should have a record containing:

- title
- author/owner
- source URL
- publication/collection
- rights/license status
- whether adaptation is allowed
- required attribution
- date checked
- reviewer

Collection-level permission does not remove the need to verify the exact item.

## PDF/visual standard

Learner PDFs follow the current Studo visual-accessibility standard:

- clear-print body size, normally around 14 pt;
- strong dark/light contrast;
- no information conveyed by color alone;
- plain readable type;
- left-aligned text;
- comfortable line spacing and white space;
- single-column passage reading unless a special layout requires otherwise;
- selectable/searchable text;
- logical reading order;
- uncluttered examples, questions, and answer explanations.

## Primary reference set

- GED Testing Service - Assessment Guide for Educators: RLA
  https://www.ged.com/content/dam/websites/ged/resources/en/assessment-guide-for-educators-rla.pdf
- GED Testing Service - GED Study Guide: RLA
  https://www.ged.com/content/dam/websites/ged/resources/GED-Study-Guide-RLA.pdf
- GED Testing Service - RLA Essential Skills and Strategies
  https://www.ged.com/content/dam/websites/ged/educators-admins/Reasoning-Through-Language-Arts-Essential-Skills-and-Strategies.pdf
- GED Testing Service - Curriculum and Notional Learning Time
  https://www.ged.com/content/dam/websites/ged/resources/en/GED-Curriculum-and-Notional-Time-Aug.-2022.pdf
- Institute of Education Sciences - Organizing Instruction and Study to Improve Student Learning
  https://ies.ed.gov/ncee/wwc/practiceguide/1
- W3C - WCAG 2.2
  https://www.w3.org/TR/WCAG22/
- RNIB - Clear Print Guidance
  https://www.rnib.org.uk/documents/1643/Clear_Print_guidance_2023.docx
- CAST - UDL Guidelines 3.0
  https://udlguidelines.cast.org/
