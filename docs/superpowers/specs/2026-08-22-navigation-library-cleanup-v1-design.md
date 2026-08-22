# Studo Navigation & Library Cleanup V1 Design

## Goal
Make the now-large RLA library easy to navigate without changing the underlying learning content.

## Scope
1. Fix the Extended Response home link (`extended_response` -> `extended-response`).
2. Add navigation regression checks for all published home-track links.
3. Make Practice search learner-facing: Reading searches individual skills; Arguments, Language, and Extended Response search learner units.
4. Reorganize Passage Practice into four responsive groups: Science, Workplace, Community & Civics, Literary.
5. Add passage-title/topic search and concise metadata (text type, difficulty, question count).
6. Reorganize Resources by track -> domain -> learner topic, not file extension.
7. Use learner unit names for Arguments, Language, and Extended Response; Reading continues to use its skill names.
8. Add Resources search and track filters.
9. Preserve all existing resource files and content; this phase changes discovery/navigation only.
10. Run whole-site navigation/link, syntax, build, and smoke checks.

## Passage Practice UX
Desktop uses four equal columns. Each column has a group heading and count; entries are compact text rows rather than large cards. Tablet collapses to two columns; phone to one. Search filters by title, context, text type, and difficulty.

Group mapping:
- Literary: `textType === literary`
- Science: science/environment/technology contexts
- Workplace: workplace/business contexts
- Community & Civics: community/civics/social-studies/education and other informational contexts

## Resources UX
Top of page:
- Search input
- Track chips: All, Reading, Arguments, Language, Extended Response

Below, resources are grouped by track and domain. Each topic row shows its learner-facing topic name and available resource links in columns: Study Guide, Workbook 1, Workbook 2, and Workbook 3 where present. Domain-level/general resources appear in a small General resources section above topic rows.

On small screens, each topic row stacks vertically.

## Practice Search
Search result data is derived from the published curriculum:
- Domains with learner units: return unit results and link with `unit=`.
- Domains without units: return skill results and link with `skill=`.
- Search text includes topic label, summary, domain, and track.

## Quality gates
- Every published homepage RLA track link resolves to a published curriculum track ID.
- Practice search exposes unit labels for unit-based tracks and does not expose their internal skill labels as primary results.
- Passage groups contain all learner-visible passage sets exactly once.
- Resource grouping contains every unique learner resource exactly once and preserves existing hrefs.
- No content source files, assessment questions, or PDFs are changed.
