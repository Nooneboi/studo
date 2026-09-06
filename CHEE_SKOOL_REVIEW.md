# Chee Skool alpha.34 review

Reviewed: 2026-09-06  
Input: packaged static-site ZIP supplied in ChatGPT  
Output release: `0.7.0-alpha.34`

## Outcome

The package has a strong, usable learning structure: Study Guides, Workbooks, Interactive Practice, Skill Checks, a mistake-review loop, Extended Response practice, fixed mock forms, local progress storage, and printable resources are kept as distinct learner tools.

This update fixes the release-blocking functional and editorial defects found in the supplied package. The site remains an alpha because the archive contains compiled public files rather than the authoring source, generation scripts, or repository test setup.

## Scope reviewed

- 351 packaged files before this report was added
- 20 HTML pages, 28 JavaScript files, and the main CSS/manifest/service worker
- 143 generated JSON files
- 136 learning modules with 961 objective questions
- 10 ordinary Extended Response prompts, 3 mock-only Extended Response prompts, and 6 Production Lab tasks
- 3 fixed full-mock forms
- 152 learner PDFs
- Local navigation, asset references, version/cache consistency, mock generation, answer keys, distractor feedback, and PDF integrity

## Fixes in alpha.34

### Test flow

- Fixed the 30-question Objective RLA Practice Test generator. It previously failed before the first question because every reading filler drill was excluded from mock-style use. The generator now fills the remaining reading and language targets from unused, eligible Practice sets.
- Locked a timed mock Extended Response after submission.
- Deferred mock ER self-review until Part 3 is complete, so rubric reflection cannot interrupt the test or change the timed draft.
- Allowed a completed mock to reopen its saved ER for post-test self-review without exposing the revision button.
- Clarified how the stated 150-minute total includes 3 minutes for instructions and final review.

### Learning content

- Replaced six questions in **Plan the Full Response** that asked about Chee Skool interface behavior. The new questions assess evidence selection, source comparison, limits, analysis, precise revision, and proportional conclusions.
- Corrected three Extended Response Production Lab models:
  - clinic reminders now preserves the source's before/after causation limit;
  - automated inspection now uses the actual 31-to-19-per-10,000 defect measure and the 1.8% false-alarm limit;
  - stormwater fees now distinguishes documented repair costs and engineering reasoning from a direct cost measurement.
- Corrected a capitalization item whose answer key pointed to the incorrectly capitalized choice.
- Strengthened eight answer explanations that previously repeated the answer without explaining the reasoning.
- Corrected a 12-week/eight-week contradiction in one science mock and sentence-level errors in the workplace and civics mock passages.
- Synchronized the declared skill metadata for all dedicated mock modules with the skills their questions actually measure.

### Exam-style fidelity

- Rewrote all three mock editing passages as coherent real-world documents and kept each within the 350–450-word range in GED Testing Service's public educator guide:
  - Form A: 364 words
  - Form B: 351 words
  - Form C: 382 words
- Kept all three mock ER source pairs within the guide's 550–650-word range:
  - Form A: 558 words
  - Form B: 560 words
  - Form C: 551 words
- Ordinary ER prompts shorter than 550 words are now labeled as focused, untimed process practice. The two 550–650-word pairs retain the 45-minute option.
- Replaced “unseen mock bank” claims with the more accurate “dedicated mock bank” wording.

### Printable resources

- Rebuilt both **Full Extended Response** workbooks. The old two-page sheets asked learners to analyze sources and a sample paragraph that were not supplied.
- Each replacement is an eight-page standalone workbook with a complete 550–650-word paired-source prompt, source pages, evidence planner, writing space, rubric self-review, model reasoning, and revision guidance.

## Verification

- All 28 JavaScript files and the service worker pass Node syntax checking.
- All local HTML links and asset references resolve.
- Critical pages, scripts, styles, and JSON return successfully from a local HTTP server.
- All 143 JSON files parse.
- All 961 objective questions have valid IDs, answer references, and distractor feedback.
- All three full mocks generate with 14 questions in Part 1 and 32 in Part 3.
- The Objective RLA Practice Test generated successfully across 20 deterministic seeds with its 17 reading, 6 argument, and 7 language-question targets.
- All 152 PDFs open and contain extractable text: 574 pages after the workbook replacements.
- Both rebuilt workbooks were rendered page by page and visually inspected.
- The release verifier completed 27 checks with 0 failures.

## Remaining editorial work

These items do not block alpha.34, but they should be addressed before calling the mock bank mature:

- The three fixed mocks contain 20 groups of questions that reuse the same full wording and choice structure across different forms. The passages and answers still function, but repeat users will see familiar item patterns.
- Many mock literary, science, workplace, data, and civics passages share a common structural template. Future forms should vary narrative shape, evidence organization, and question architecture, not only topic details.
- Seven of the ten ordinary ER prompt pairs are shorter than the public 550–650-word guidance for full ER stimulus sets. Alpha.34 keeps these available only as focused untimed practice; future content work can expand or replace them before enabling timed mode.
- The supplied ZIP has no source content tree or build pipeline. Future edits should be ported into the real source repository and generator before rebuilding, or a later build could overwrite the corrected public files.

## Public format references

- GED Testing Service, [Test Subjects](https://www.ged.com/about-test/test-subjects.html): current public RLA time, sections, break, essay, and item-format overview.
- GED Testing Service, [Assessment Guide for Educators: RLA](https://www.ged.com/wp-content/uploads/assessment_guide_for_educators_rla.pdf): public guidance for RLA passage types, editing-passage length, ER source length, and scoring traits.

Chee Skool is independent practice material. Its results and self-review levels are not official GED scores or pass predictions.
