# Studo Language & Editing V1 Design

## Goal
Build a complete first-pass GED RLA Language & Editing track that teaches grammar and editing through seven learner-facing units while preserving all thirteen internal L1/L2 skill IDs for progress tracking.

## Learner structure
1. Word Choice & Standard Usage - L1.1, L1.4
2. Agreement & Pronouns - L1.2, L1.3, L1.7
3. Modifiers & Sentence Logic - L1.5
4. Parallelism & Sentence Connections - L1.6
5. Concision & Transitions - L1.8, L1.9
6. Sentence Boundaries & Punctuation - L2.2, L2.4
7. Capitalization & Possessives - L2.1, L2.3

The internal skill IDs remain canonical for analytics, weakness detection, and future recommendations. The learner navigates units, not thirteen fragmented skill pages.

## Learning progression
Each unit receives:
- one Study Guide following the Studo 9-part guide standard;
- Workbook 1 for Learn-level rule recognition;
- Workbook 2 for Apply-level contextual editing;
- one eight-question focused interactive editing module.

A separate Mixed Editing Practice collection contains six 350-450 word workplace/informational passages with six questions each. These passages mix grammar, punctuation, usage, transitions, and clarity so learners must edit in context rather than answer isolated grammar trivia.

## Assessment design
Focused items may use short sentences when the goal is to learn a rule. Harder items must use authentic sentence context and close alternatives. Mixed passage questions should prefer `grammar_edit` where a dropdown/edit replacement is natural, while allowing multiple choice for sentence-boundary or best-revision decisions.

Every item must have one defensible best answer. Ambiguous punctuation alternatives and synonymous transitions are not acceptable. Distractors should correspond to genuine errors: agreement attractors, unclear pronouns, dangling modifiers, nonparallel structure, fragments/run-ons, comma splices, possessive/plural confusion, wordiness, and logic mismatches.

## Mixed editing coverage
Six 350-450 word passages, each six questions (36 total), collectively covering all thirteen L1/L2 skills. At least four passages must be workplace/informational; the rest may use community/school contexts. The passages should resemble practical editing material rather than literary comprehension.

## PDF standard
Use Inter, dark text, Studo lavender #51439C, single-column layout, readable 13.5-14 pt body text, generous spacing, selectable text, and no dense multi-column pages. Study Guides include Learning goal, explanation, confused ideas, exam wording, repeatable method, worked example, traps, diagnostic help, and quick check. Workbooks include answer reasoning and a mistake-check section.

## ER connection
Each guide may include one brief note explaining how the skill supports Extended Response clarity, but the Language track does not teach the ER rubric itself.

## Publication
Keep Language in preview while authoring. Publish only after:
- all seven units have guide + two workbooks + focused module;
- six mixed editing passages exist;
- validator reports zero blocking Language errors;
- Language-specific regression tests pass;
- clean source-only rebuild succeeds;
- changed PDFs are rendered and visually inspected;
- learner pages and references smoke-test successfully.

## Out of scope
- Extended Response instruction/scoring system;
- rewriting Reading or Arguments content;
- advanced style instruction beyond GED editing needs;
- full mock-test blueprint.
