# Chee Skool — Master Project Status

**Date:** 2026-08-25
**Current release:** `0.7.0-alpha.32`
**Current stage:** Phase 5.5 Extended Response hierarchy cleanup complete in source — Learning Units now lead the ER page before focused and full-response practice; public alpha still waits on real-browser/device/accessibility QA and a small learner pilot
**Public alpha gate:** `publicAlphaEnabled: false` until real-browser/device QA and a small learner pilot are signed off

This file is the current high-level source of truth for Chee Skool. Newer decisions in this file and the current canonical source override older phase reports when they conflict.


## Phase 5.5 Extended Response hierarchy cleanup — Alpha 32

- Extended Response now follows the learner sequence **Learn → focused practice → full response** instead of placing the practice banks before the learning index.
- A compact top jump bar keeps **Learning units**, **Production Lab**, and **Full ER Practice** immediately accessible for returning learners without changing the educational order.
- Learning Units remain compact index rows; lesson content still opens separately rather than expanding the landing page.
- Production Lab and Full Extended Response remain side by side on desktop. At phone/tablet widths they stack in the same learning sequence: Production Lab first, Full ER second.
- No ER prompts, tasks, scoring, Mock isolation, Progress evidence, or learner content counts changed.


## Phase 5.5 Progress responsive cleanup — Alpha 31

- The tracked-skill row no longer splits the learner status from its percentage meter. **Status now owns the label, percentage, and bar**, so `Needs work · 36%` cannot collide across columns.
- The old learner-facing `Practice signal` label is replaced with **Evidence → Practice**; Latest Skill Check remains visibly separate when available.
- Tablet turns skills into cards and phone turns each skill into a true one-column stack with explicit Correct, Evidence, and Status blocks. Progress-only horizontal overflow is clipped at the page boundary and all nested progress items can shrink to the viewport.
- Review list mistakes are grouped by skill, so five misses in Explicit Meaning appear as one actionable skill row with the number of questions needing review instead of five visually identical rows.
- Phase 5 Mock isolation, scoring, content counts, and the alpha.30 Extended Response/Mock restructuring are unchanged.

## Phase 5.5 learner-facing UI cleanup — Alpha 30

- Extended Response now shows **Production Lab** and **Full Extended Response Practice** side by side on desktop instead of burying full essays below a long drill list. On phone, **Full ER Practice appears first**, with jump links for Full ER, Production Lab, and Learning units.
- Mock now uses a scalable **test library**: Full RLA Mock and Objective RLA Practice Test are clear separate cards, and future test formats can be added to the same auto-fitting grid without redesigning the page. Focused Practice remains a separate lower section.
- Progress gives Correct, Practice signal, and Status independent layout cells so status text no longer competes with the percentage meter. At tablet/phone widths, each tracked skill becomes a readable stacked card instead of a compressed desktop row.
- Phone spacing is tighter on first load, major actions use full-width touch targets where appropriate, and long Extended Response navigation uses horizontally scrollable jump links rather than shrinking labels.
- Phase 5 role isolation, Mock counts, scoring boundaries, and learner evidence rules are unchanged.
- Public alpha remains gated on real-browser/device/accessibility QA and a small learner pilot.

## Product goal

Chee Skool is a calm, focused GED Reasoning Through Language Arts learning and practice system. A feature or content item earns a place only when it helps a learner understand, apply, strengthen, or honestly measure an RLA skill.

Core learner flow:

**Learn → Practice → Train → Skill Check → Mock → Progress**

The modes do not need identical content or interactions. Each mode has a distinct job.

## Non-negotiable product rules

- Do not add features because other learning sites have them.
- Do not put every learning method in every skill.
- Do not bulk-convert old material merely because a new interaction exists.
- Do not make reasoning harder by making controls confusing.
- Do not copy Main Idea's exact UI pattern into every skill; transfer the learning philosophy, not the mechanics.
- Do not create fake Skill Checks or pretend ordinary Practice is independent assessment.
- Do not treat Practice-bank Mock fallback as an independent readiness measure.
- Do not reuse dedicated Skill Check questions as Mock questions.
- Do not claim Chee Skool is official GED material, uses live GED questions, predicts an official scaled score, or guarantees pass/fail outcomes.
- Do not copy copyrighted prep-book passages/questions into the learner bank.
- Do not expose unfinished or duplicate material just to make the product look larger.
- Do not hand-edit `data/generated/` as canonical content; edit `content-src/`, validate, and rebuild.

## Phase 3 closeout — Alpha 26

- Phase 3 is closed after a whole-system learner/content/role review. No blocking Phase 3 gap remains.
- Reading and Arguments are intentionally frozen for now unless later Skill Check, Mock, or learner evidence exposes a specific need.
- Language priority calibration now covers Sentence Boundaries & Punctuation, Agreement & Pronouns, and Parallelism & Sentence Connections with real higher-reasoning items; the remaining Language units were audited and left unchanged where appropriate.
- Extended Response now progresses from component recognition to a six-task Production Lab to 10 full paired-source prompts, including two denser source pairs.
- Fresh Progress now sends a brand-new learner directly to **Start Practice**, matching the fresh-Train rule.
- Next stage is **Phase 4A — Skill Check runtime/UI/evidence**, not more Phase 3 content expansion.

## Phase 3D–3E closeout checkpoint (Alpha 25)

- Language priority calibration is complete for Sentence Boundaries & Punctuation, Agreement & Pronouns, and Parallelism & Sentence Connections; other Language units were audited and deliberately left unchanged where no real learner gap justified edits.
- Extended Response now includes a six-task **Production Lab** for thesis, evidence selection, evidence analysis, summary-to-analysis, body development, and revision/focus work. Production tasks are untimed, revision-oriented, and do not receive fake automated GED scores or objective mastery history.
- The full ER prompt bank now contains **10** original paired-source prompts, including two denser 550–650-word source pairs for longer evidence comparison practice.
- The generated learner bank remains **103 modules / 753 objective questions / 152 PDFs**; ER Production Lab tasks and full ER prompts are separate writing experiences rather than objective modules.

## Current content baseline

Chee Skool currently covers four RLA tracks and **62 canonical skills**:

1. Reading & Comprehension
2. Arguments & Sources
3. Language & Editing
4. Extended Response

Current generated learner bank:

- **133 learner modules**
- **945 objective/component questions**
- **9 dedicated Skill Checks / 54 independent Check questions**
- **21 dedicated mock-only source sets / 138 unseen Mock objective questions**
- **3 fixed Full RLA Mock forms / 3 mock-only Extended Response prompts**
- **28 Quick Review recall cards**
- **152 registered learner PDFs**
- **152 physical PDFs in `assets/resources`**
- **0 unregistered/orphan learner PDFs**

The old internal `sample-quiz` remains development/demo material and is no longer part of the learner catalog.

## Reference-skill strategy

### Reference skill #1 — Main Idea

Main Idea is the first complete active-learning reference skill.

Its design principle is:

**Learn → Guided → Apply → Independent → Transfer**

The learner difficulty should rise through reasoning demand rather than gimmicky controls. Main Idea remains a reference for quality and progression, not a template that every skill must copy mechanically.

### Reference skill #2 — Supporting Details

Supporting Details is now the second complete reference skill. Existing PDFs were reused rather than replaced.

Implemented progression:

1. Learn — existing Supporting Details Study Guide.
2. Guided — direct support vs related/background evidence and exact-sentence selection.
3. Apply — strongest-vs-some support and evidence-strength comparison.
4. Independent — close evidence choices and qualified/two-part claims with no hints.
5. Transfer — existing four-context independent drill remains available after the guided path.
6. Skill Check later — still intentionally absent until the dedicated Skill Check phase.

The new 494-word original community/civics passage, **A Saturday Market Street Pilot**, is used only for the reference guided path and remains `mock-excluded`.

### Phase 2 depth skill — Explicit Meaning

Explicit Meaning now uses the existing guide and two workbooks plus a new skill-specific active-learning path. The new path does not manufacture difficulty by turning explicit-detail questions into inference questions. It increases challenge through target matching, true-but-wrong details, paraphrase precision, qualifiers/conditions, evidence distance, and explicit rule application.

Implemented progression:

1. Learn — existing Explicit Meaning Study Guide.
2. Guided — directly stated vs not stated, then exact-sentence location.
3. Apply — reject true-but-wrong details and identify a condition that changes a rule.
4. Independent — preserve meaning through paraphrase and apply an explicitly stated exception with no hints.
5. Follow-up — existing four-context drill is retained as **Explicit Meaning - Independent Practice**.
6. Passage transfer — mixed Passage Practice continues to expose Explicit Meaning in longer reading sets.

The new 489-word original workplace passage, **A New Equipment Checkout Procedure**, remains `mock-excluded`. No new PDF, flashcard deck, Skill Check, Mock item, or interaction engine was added.

### Phase 2 depth skill — Summary

Summary now reuses the existing guide and two workbooks plus a new skill-specific active-learning path. The progression teaches compression and scope directly instead of treating Summary as only another best-answer MCQ skill. Difficulty stays centered on DOK 2 summary reasoning rather than drifting into inference.

Implemented progression:

1. Learn — existing Summary Study Guide.
2. Guided — decide what is essential vs omittable, then control section scope.
3. Apply — diagnose too-narrow/added-claim summary traps and identify the developments that must survive compression.
4. Independent — choose a whole-passage summary and preserve a result + limitation relationship with no hints.
5. Follow-up — existing four-context drill is retained as **Summary - Independent Practice**.
6. Passage transfer — mixed Passage Practice continues to expose Summary inside longer reading sets.

The new 549-word original social-studies passage, **From Freight Yard to Shared Space**, remains `mock-excluded`. No new PDF, flashcard deck, Skill Check, Mock item, or interaction engine was added.

### Phase 2 depth skill — Inference

Inference now reuses the existing guide and two workbooks plus a new skill-specific active-learning path. The progression teaches learners to separate what the text states from what the clues support and from what is merely possible. Difficulty rises through evidence distance, competing interpretations, cautious wording, and unsupported-assumption traps rather than through vagueness.

Implemented progression:

1. Learn — existing Inference Study Guide.
2. Guided — classify stated information vs supported inference vs guess, then locate the strongest sentence supporting an inference.
3. Apply — choose the smallest supported conclusion and reject an attractive but unsupported motive explanation.
4. Independent — infer what a character/director likely considers possible, then identify the strongest evidence pair with no hints.
5. Follow-up — existing four-context drill is retained as **Inference - Independent Practice**.
6. Passage transfer — mixed Passage Practice continues to expose Inference inside longer informational and literary reading sets.

The new 588-word original literary passage, **The Spare Script**, remains `mock-excluded`. No new PDF, flashcard deck, Skill Check, Mock item, or interaction engine was added.

### Phase 2 depth skill — Conclusions & Generalizations

Conclusions & Generalizations now reuses the existing guide and two workbooks plus a new skill-specific active-learning path. The progression distinguishes synthesis from ordinary inference by making learners combine multiple findings, control scope, identify an underlying principle, and transfer that principle cautiously. Difficulty rises through competing evidence, qualifications, and overgeneralization traps rather than through vague guessing.

Implemented progression:

1. Learn — existing Conclusions & Generalizations Study Guide.
2. Guided — identify details that establish the overall pattern, then classify conclusions as too narrow, supported, or too broad.
3. Apply — synthesize results across conditions and identify the underlying principle without copying surface details.
4. Independent — transfer the principle to a new situation, then draw a whole-passage conclusion that preserves the study limitation with no hints.
5. Follow-up — existing four-context drill is retained as **Conclusions & Generalizations - Independent Practice**.
6. Passage transfer — mixed Passage Practice continues to expose Conclusions & Generalizations inside longer reading sets.

The new 545-word original science/informational passage, **Shade Cloth and Seedling Growth**, remains `mock-excluded`. No new PDF, flashcard deck, Skill Check, Mock item, or interaction engine was added.

## Learning-mode ownership

Phase 0D introduced explicit canonical delivery roles:

- `practice` — guided/focused/mixed application
- `train` — adaptive/spaced retrieval and transfer review
- `skill_check` — dedicated short independent proof
- `mock` — dedicated unseen exam-simulation measurement

Current ordinary learner modules are intentionally `practice + train`.

Current dedicated banks:

- Practice: populated
- Train: populated from modules explicitly carrying `train`
- Skill Check: **9 dedicated sets / 54 questions**
- Mock-only: **21 dedicated source sets / 138 questions across 3 fixed forms**

### Dedicated Mock behavior

Full RLA Mock now uses the V2 fixed-form manifest and only modules with exactly `deliveryRoles: ["mock"]`. Practice fallback is disabled with `allowPracticeFallback: false`.

The three fixed forms rotate so the learner receives all three before a repeat when local history is available; after that, the least-recently-used form is selected. Objective RLA Practice Test remains separate and continues to use Practice-role content. Mock results are raw practice evidence only and do **not** estimate a GED scaled score or predict pass/fail.

## Phase 0 — content integrity before expansion

### Phase 0A — Question-family integrity: complete

- canonical family registry is the source of truth;
- legacy family aliases preserve historical learner data where required;
- published content is validated against the canonical family system;
- `question-families.js` is regenerated from canonical config rather than treated as hand-maintained generated data.

### Phase 0B — Progress evidence integrity: complete

Learner evidence now preserves distinctions including:

- first-try correctness;
- retries;
- hint assistance;
- learning stage;
- question-level difficulty.

Guided/hinted success remains useful learning evidence but is not treated as equal to independent first-try performance.

### Phase 0C — Resource cleanup: complete

The previous 8 unregistered/duplicate PDFs were reconciled in canonical source rather than only in an exported public build.

Current result:

- 152 registered learner PDFs;
- 152 physical learner PDFs;
- no orphan/missing registered learner PDFs;
- unique Core Meaning transfer material retained/consolidated rather than duplicated.

### Phase 0D — Content-role separation: complete

- Practice uses only `practice` content.
- Train uses only `train` content.
- Skill Check uses only `skill_check` content.
- Mock prefers `mock` content and may use the explicitly enabled temporary Practice fallback during alpha.
- learner public builds copy only modules referenced by the generated learner index.
- internal/demo modules cannot silently hitch a ride in the learner artifact.

## Current learner systems

### Practice

- focused practice remains separated from mixed Passage Practice;
- learner-facing categories and domains use canonical RLA structure;
- current active-learning interactions include multiple choice, embedded/whole-revision dropdown editing, authored select-text, drag-sort, and drag-order where instructionally justified;
- Main Idea uses the Guided Learning Workspace progression;
- alternate interaction types are used only when they improve the reasoning task.

### Train

Train is for strengthening and revisiting, not for duplicating the whole curriculum. It uses explicitly Train-eligible content, learner weaknesses/mistakes, review timing, and transfer opportunities.

Selective flashcards belong here later under Quick Review only where discrete retrieval genuinely helps, such as transition meanings, tone/connotation vocabulary, commonly confused words, selected grammar/rhetorical terms, or ER planning/rubric vocabulary. Reasoning-heavy skills such as Main Idea, Supporting Details, Inference, Summary, synthesis, and full ER reasoning should not become flashcard decks.

### Progress

- objective mastery remains evidence-based;
- Guided/hinted/retry evidence is distinguishable from independent performance;
- confidence, mistakes, and review timing remain local learner signals;
- ER self-review remains separate from objective mastery;
- Mock history remains separate from ordinary skill mastery;
- learner-facing copy does not imply an official GED scaled score.

### Mock

Full RLA Mock baseline:

- Part 1: 14 questions / 27 minutes
- Extended Response: 45 minutes
- break: 10 minutes
- Part 3: 32 questions / 65 minutes
- 46 objective questions total
- Reading 25 / Arguments 10 / Language 11
- fixed refresh-safe attempt
- flags/unanswered review
- section timing and recovery
- post-completion explanations
- ER self-review kept separate
- no fake official GED scaled score

The final Mock-quality milestone is still a **dedicated unseen Mock bank**, including appropriately authentic interaction types and heavier ER source pairs. That is a later roadmap phase, not Phase 0D.

### Resources

Resources support the learning system; they are not a second curriculum.

- Study guide PDF → Learn + Resources
- Focused workbook → Practice / printable + Resources
- Mixed transfer workbook → Passage Practice / printable when unique and useful
- duplicate/obsolete workbook → archive rather than presenting multiple near-identical choices

## Source and public-build architecture

### Canonical source

`content-src/` is the learning-content source of truth.

`data/generated/` is disposable build output.

Canonical workflow:

`content-src/ → validation → content build → data/generated/ → public build`

### Public learner boundary

`npm run public:build` creates the learner-only artifact in `dist/`.

The public build contains only learner runtime HTML/CSS/JS, generated learner data, icons/branding, and registered learner resources. Internal authoring/development material remains outside the learner artifact.

Alpha 13 source/build reconciliation also restores the runtime packaging contract for files such as:

- `js/test.js`
- `js/rla-browse.js`
- generated `data/generated/question-families.js`

and prevents stale/unindexed module JSON from being copied into the public artifact.

## Current quality protections

Automated validation/regression coverage protects against problems including:

- canonical learner-content loss during rebuild;
- invalid/missing delivery roles;
- Practice/Train/Skill Check/Mock role leakage;
- internal/demo content entering the learner catalog;
- stale/unindexed modules entering the public artifact;
- missing required public runtime references;
- Passage Practice leaking into focused skill pages;
- answer/explanation mismatches;
- duplicate or invalid options;
- problematic answer-position patterns;
- excessive generic feedback;
- invalid passage lengths;
- broken resource references;
- invalid curriculum/navigation routes;
- learner-library organization regressions;
- Mock count/coverage/timing/scoring regressions;
- reappearance of resolved content-depth warning classes;
- accidental inclusion of internal authoring surfaces in public builds.

## Roadmap from here

### Phase 1 — Supporting Details reference skill: complete

Supporting Details now uses the existing strong PDF material plus a skill-specific Guided → Apply → Independent path, followed by the existing multi-context independent practice.

### Phase 2 — Complete high-priority Reading depth: complete

Completed reference-depth sequence:

1. Explicit Meaning — **complete in Alpha 15**
2. Summary — **complete in Alpha 16**
3. Inference — **complete in Alpha 17**
4. Conclusions / Generalizations — **complete in Alpha 18**

The Phase 2 whole-system review found that the strongest next gains came from integrating the learning system rather than adding more Reading drills.

### Phase 2.5 — Learning System Integration: complete in Alpha 19

Implemented without expanding the content bank:

- Progress recommendations and skill rows now return to the canonical curriculum/skill or grouped-unit pages instead of the retired category detour;
- fresh learners with fewer than three recorded attempts are sent to Practice before Train offers an adaptive session;
- Guided Practice completion can continue directly to the next Independent Practice when the same curriculum item provides one;
- learner-facing Mock copy now describes the temporary Practice-bank mode as **RLA Format & Timing Practice**, not an independent readiness simulation;
- unavailable future subjects are hidden from learner navigation while multi-subject support remains an internal future capability;
- Home explains Practice, Train, and Mock in plain learner language;
- a shared curriculum-routing helper keeps Progress and module sequencing derived from the generated curriculum rather than another handwritten taxonomy;
- `release-gate.json` remains disabled and is intentionally not wired into automatic deployment yet; changing deployment policy remains a separate operational decision.

The Phase 2 reference paths remain unchanged. The review did not justify bulk-deepening Sequence, Compare & Contrast, or other thinner Reading skills before higher-value Arguments/Language/ER work.

### Phase 3 — Deepen Arguments, Language, and Extended Response

#### Phase 3A — Claims & Argument Structure: complete in Alpha 20

Claims & Argument Structure now reuses the existing Study Guide and two workbooks, adds one original guided argumentative passage, and preserves the existing eight-question focused drill as **Claims & Argument Structure - Independent Practice**.

Implemented progression:

1. Guided — classify sentence roles as main claim, supporting claim/reason, or evidence/supporting fact.
2. Guided — locate the main claim directly in the passage.
3. Apply — match evidence to the specific supporting reason it actually supports.
4. Apply — identify how a paragraph contributes to the argument rather than merely summarizing its topic.
5. Independent — trace the full problem → reasons/evidence → recommendation → review/next-step chain.
6. Independent — choose the concise argument map that preserves the claim's exact scope and strongest reasons.

The new 483-word original community argument, **Two Evenings at the Community Hub**, is `practice + train` and remains `mock-excluded`. No new PDF, flashcard deck, Skill Check, Mock item, or interaction engine was added.

#### Phase 3B — Finding Evidence: complete in Alpha 21

Finding Evidence now reuses the existing Study Guide and two workbooks, adds one original workplace guided passage, and preserves the existing tutoring drill as **Finding Evidence - Independent Practice**. The unit stays distinct from Supporting Details and Evidence Quality by centering the exact argumentative claim first, then asking what evidence actually measures that claim.

Implemented progression:

1. Guided — separate observed evidence from the recommendation itself, then match evidence to the congestion or punctuality claim it supports.
2. Guided — locate the direct punctuality result in the passage rather than choosing a merely related explanation.
3. Apply — match different measured outcomes to congestion, punctuality, and productivity claims.
4. Apply — reject a related commuting explanation in favor of the direct clock-in evidence for punctuality.
5. Independent — support a two-part claim with evidence covering both congestion and productivity.
6. Independent — choose one direct evidence line for each of two different reasons across the argument.

The new 457-word original workplace argument, **Extending the Staggered-Start Pilot**, is `practice + train` and remains `mock-excluded`. The existing runtime compatibility ID `reading.evidence.matching` remains unchanged; canonical mastery stays on R5.3. The older evidence-role item now uses the canonical `evidence.identify_role` family where appropriate. No new PDF, flashcard deck, Skill Check, Mock item, or interaction engine was added.

#### Phase 3C — Credibility & Counterarguments: complete in Alpha 22

Credibility & Counterarguments now reuses the existing Study Guide and two workbooks, adds one original workplace guided passage, and preserves the existing food-waste drill as **Credibility & Counterarguments - Independent Practice**. The reference path keeps credibility claim-specific and treats counterargument analysis as fair identification followed by a direct-response check.

Implemented progression:

1. Guided — match sources/records to the exact claim they are positioned to support.
2. Guided — identify the opponent's actual counterargument directly in the passage.
3. Apply — choose the source whose access and method best fit an equipment-reliability claim.
4. Apply — identify a credibility limitation when a worker-perception survey is stretched into a mechanical-failure claim.
5. Independent — evaluate whether the writer answers the productivity objection with evidence that directly tests it.
6. Independent — trace the full objection → response evidence → qualification/monitoring chain.

The new 497-word original workplace argument, **Keeping the Earlier Equipment Check**, is `practice + train` and remains `mock-excluded`. The independent set now provides genuine transfer for the canonical `credibility.limit` and `counterargument.identify` families instead of leaving those families as singletons. No new PDF, flashcard deck, Skill Check, Mock item, or interaction engine was added.

Arguments priority from here:

- whole-track review completed after Alpha 22; no additional Arguments expansion is justified before learner/Skill Check/Mock evidence shows a real gap.

#### Phase 3D — Language difficulty progression: Sentence Boundaries & Punctuation complete in Alpha 23

The existing **Renovation Sentence Repair** focused module remains one eight-question Practice/Train set. No new PDF, module, interaction engine, Skill Check, or Mock content was added. Instead, its reasoning progression was calibrated from eight flat Medium/DOK2 items to a genuine **2 Easy → 4 Medium → 2 Hard** sequence:

1. Easy — identify a complete sentence versus dependent-clause fragments.
2. Easy — repair a straightforward independent-clause boundary with a semicolon.
3–6. Medium — apply nonessential-clause punctuation, colon logic, comma-splice repair, and essential that-clause punctuation.
7. Hard — repair a multi-clause sentence while preserving both contrast and cause, rejecting a grammatically possible revision that changes the meaning.
8. Hard — coordinate a colon, semicolon, and conjunctive adverb in one sentence to preserve identification plus contrast.

The hard items use DOK3 reasoning and higher distractor similarity rather than merely receiving harder labels. Language now has **3 Easy / 87 Medium / 2 Hard** questions overall, with **3 DOK1 / 87 DOK2 / 2 DOK3**. The next Language target is Agreement & Pronouns, beginning with an audit rather than automatic expansion.

Language priority:

- continue real easy → medium → hard calibration in high-value units, starting with Agreement & Pronouns;
- preserve the current embedded editing format and 350–450-word mixed editing passage range.

#### Phase 3D — Language priority calibration complete in Alpha 24

The Phase 3D batch calibrated the two remaining high-value focused Language units without adding modules or PDFs.

- **Agreement & Pronouns** now uses a genuine 2 Easy / 4 Medium / 2 Hard progression. The final items require the learner to hold subject-verb agreement and pronoun reference/number constraints at the same time rather than solving one isolated rule.
- **Parallelism & Sentence Connections** now uses a genuine 2 Easy / 4 Medium / 2 Hard progression. The final items require both parallel form and the intended contrast/cause relationship to survive the revision.
- Word Choice & Standard Usage, Modifiers & Sentence Logic, Concision & Transitions, and Capitalization & Possessives were audited and left unchanged because their current focused drills plus mixed editing transfer already perform a distinct learner job; forcing an identical difficulty distribution would be artificial.
- The six 350–450-word mixed editing passages remain unchanged.
- No new Language guide, workbook, module, PDF, flashcard, Skill Check, Mock item, or interaction engine was added.

Phase 3D is sufficient for Phase 3. Next checkpoint: **Phase 3E — Extended Response production depth**.

Extended Response priority:

- production microtasks: thesis writing/revision, exact evidence selection, reasoning completion, organization, paragraph development, and revision — not only recognition MCQs.

### Phase 4 — Skill Checks + Train Quick Review: complete in Alpha 29

- Dedicated `check.html` / `js/check.js` runtime keeps Skill Check separate from Practice: no hints, retries, confidence prompts, timer, or correctness feedback until the entire Check is submitted.
- Skill Check attempts record `mode: skill_check`, `assistance: none`, and one submitted answer per question; Progress shows **Practice signal** and **Latest Skill Check** separately rather than merging them into a fake mastery badge.
- First wave contains **9 dedicated Skill Checks / 54 unseen questions** for mature Reading and Arguments skills only. Check modules use only the `skill_check` delivery role and remain `mock-excluded`; they do not enter Practice, adaptive Train, or Mock.
- Train now has an optional **Quick Review** lane with **28 curated recall cards** for discrete terms/rules. `Again` / `Got it` schedule only card review and never call the learning-attempt or mistake APIs.
- Quick Review is intentionally absent for passage-reasoning tasks such as Main Idea, Summary, and Inference.
- Phase 4 strengthens evidence quality but does not claim a GED-equivalent score, pass/fail prediction, psychometric mastery, or Mock readiness.
- Phase 4 closeout found no reason to create checks for all 62 skills or to expand PDFs/content simply for symmetry.

### Phase 5 — Dedicated unseen Mock bank: complete at code/content/automated-QA level

- V2 uses **three fixed forms** rather than random full-form assembly.
- Each form has **46 objective questions** in **7 coherent source sets** plus one unique **45-minute mock-only ER**.
- Across Phase 5: **21 mock-only modules / 138 unseen objective questions / 3 mock-only ER prompts**.
- Each form meets the internal 16 / 21 / 9 reporting-category target and 34 MC / 8 embedded editing / 2 select-text / 2 drag interaction target.
- Every form contains 2 literary and 5 informational/editing sets, including civics/GAC, science/technical, workplace/community, data/multi-format, one dedicated editing set, and a 600+ word stamina source.
- Full Mock consumes only `deliveryRoles: ["mock"]`; Practice, Train, Skill Check, Quick Review, passage browsing, and Objective Practice remain isolated.
- Practice fallback is disabled. The engine rotates A → B → C before repeating and then uses least-recently-used selection.
- Mock ER prompts compile to a separate learner-safe payload and are absent from ordinary ER Practice.
- Results use **Text Features & Technique**, **Evidence & Arguments**, and **Language Conventions**, with ER kept as separate Self-review.
- No scaled-score estimate, pass prediction, College Ready claim, official percentile/equating claim, or psychometric-equivalence claim is added.
- Automated release verification is clean; real desktop/mobile/accessibility QA remains a human public-release gate.

## Release gate after content work

Automated correctness is necessary but not the final public-release gate. Before enabling a public alpha:

1. test the deployed production URL end-to-end in a real desktop browser;
2. test a real phone/tablet, including touch selection and mobile navigation;
3. test refresh/back/two-tab/offline/service-worker recovery;
4. verify print/PDF behavior;
5. perform keyboard-only, 200% zoom, and basic screen-reader checks;
6. have a small number of learners use the product with minimal guidance;
7. fix high-impact learner/content/accessibility/reliability issues;
8. explicitly enable the release gate only after that review.

## Immediate next work

> **Post-Phase-5 release QA before any new product expansion.**

Run the finished Full RLA Mock on real desktop and mobile browsers, including refresh/back/two-tab behavior, touch interactions, keyboard-only use, zoom, and basic screen-reader checks. Then run a small learner pilot and fix only evidence-backed high-impact issues before deciding the next product phase. Keep the public-alpha gate disabled until that review is signed off.
