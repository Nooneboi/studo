# Studo Full-System Audit — 22 Aug 2026

## Scope

This audit reviews the latest Studo project copy available for analysis (`studo_skillpage_placement_fixed`), including:

- learner-facing pages and navigation
- content architecture and curriculum coverage
- question quality and assessment validity
- passage practice and GED realism
- Extended Response readiness
- Grammar/Language readiness
- adaptive learning/progress architecture
- source-of-truth/build pipeline
- PDFs/resources
- accessibility/privacy/security/deployment hygiene
- automated testing and maintainability

**No product files were intentionally changed as part of this audit.** The content build was run to verify the current source/build pipeline, which refreshes generated outputs by design.

> Note: this is the latest project copy available in this workspace. The user's post-merge GitHub Desktop working copy may contain small differences after the later merge resolution.

---

# 1. Executive verdict

Studo has a **good learning/product skeleton**, and the Reading & Comprehension foundation is real. It is not a fake shell. The local-first architecture, skill taxonomy, progress logic, recent content placement fix, and the better passage sets are all worth preserving.

However, Studo is **not yet a solid full GED RLA preparation product**. The biggest problem is not visual design. It is **assessment validity and curriculum completeness**.

The current site exposes Arguments & Sources, Language & Editing, Extended Response, and a “Full RLA Test” before those areas are actually ready. Some existing practice is also too easy to game because of predictable answer positions, generic distractors, ambiguous transition items, and generic explanation metadata.

The repository’s own `release-gate.json` calls the product **pre-alpha** and keeps public alpha disabled. That is the correct status today.

### Practical ratings

| Area | Audit verdict |
|---|---|
| Core engineering/static shell | **Strong foundation** |
| Reading curriculum foundation | **Useful, needs calibration** |
| Learning/progress architecture | **Strong concept, content-limited** |
| Assessment validity | **Weak point** |
| GED exam realism | **Incomplete** |
| Arguments & Sources | **Mostly unbuilt** |
| Grammar & Language | **Mostly unbuilt** |
| Extended Response | **Prototype only** |
| Full mock/test experience | **Not usable as a GED simulation yet** |
| PDF/resource consistency | **Mixed** |
| Release readiness | **Not ready — pre-alpha is accurate** |

---

# 2. What was verified technically

Fresh verification on the audited copy:

- `npm run content:validate` → **0 errors, 4 warnings**
- `node scripts/build-content-regression.test.mjs` → **2/2 tests pass**
- `npm run content:build` → **passes**, 59 generated index entries, 4 quality warnings
- JavaScript syntax scan across `js/` and `scripts/` → **24 files checked, 0 syntax failures**
- Generated curriculum contains **23 Passage Practice sets**
- Local HTTP smoke test → **21 HTML pages + 5 core assets checked, 0 HTTP failures**
- Static/generated reference checks during the audit found no missing learner module/resource targets

### Current validator warnings

Four singleton transfer families remain:

- `theme.identify`
- `theme.evidence`
- `writing.evidence.relevance`
- `writing.argument.short_response`

These are not build failures, but they correctly indicate that transfer cannot yet be tested for those families.

### What could not be fully automated here

A true headless-browser click-through test could not be completed because the environment blocks browser access to localhost/private addresses. Therefore, this audit can verify build/static/runtime-serving integrity, but it does **not** claim every click path, keyboard interaction, timer flow, and localStorage flow has been end-to-end browser tested.

That missing test coverage itself is included as a quality gap below.

---

# 3. Strong points worth keeping

## 3.1 The learning architecture is thoughtful

`js/learning.js` is one of Studo’s stronger pieces. It already supports ideas that are educationally useful rather than decorative:

- first-attempt tracking
- confidence weighting
- mistake records
- spaced review intervals
- weak/due skill selection
- preference for fresh questions in the same family after mistakes
- low-data labeling instead of pretending certainty

This is a strong base for “Train Me.” It should be preserved.

The limitation is the bank feeding it: an adaptive engine cannot create high-quality transfer if the question families are shallow or the distractors are weak.

## 3.2 The Reading & Comprehension taxonomy is real

Reading has four developed domains:

- Core Meaning — 5 skills
- Relationships & Inference — 6 skills
- Words, Tone & Style — 5 skills
- Structure, Purpose & POV — 6 skills

These are not empty labels. They have guides/workbooks/practice and map sensibly to GED-style reading demands.

## 3.3 Recent placement architecture is now better

The corrected build rule separates:

- focused skill practice → skill page
- mixed passage practice → Passage Practice

The regression test now protects that behavior. This is the correct long-term structure.

## 3.4 Several passages are genuinely useful

The newer/gold passages and Core Meaning transfer passages are generally stronger than the oldest drill content. The issue is often the **question calibration around a passage**, not the passage writing itself.

## 3.5 Privacy/security basics are good for a small static learning app

Learner data is local-first rather than sent to a custom backend. Learner pages use a restrictive Content Security Policy, scripts are self-hosted, frames/objects are blocked, and there is no obvious tracking-heavy architecture.

This makes Studo simple, inexpensive, and comparatively low-risk to operate.

## 3.6 The project has standards

The repository already documents good item-writing and visual principles. The problem is **execution consistency**, not a lack of standards.

That is a much easier problem to fix than having no content philosophy at all.

---

# 4. Critical weaknesses

# P0 — Fix before calling Studo serious full-RLA preparation

## 4.1 “Full RLA Test” is currently not a GED mock

This is the largest product-level issue found.

`js/quiz.js` intentionally assembles **every question** in a category into one timed test.

Current result:

| Test | Modules | Questions | Approx. timer |
|---|---:|---:|---:|
| Reading | 55 | 408 | 496 min |
| Writing/Analysis | 1 | 2 | 5 min |
| Language | 2 | 4 | 2 min |
| Full RLA | 58 | 414 | **503 min** |

That is about **8.4 hours** for “Full RLA.”

The real GED RLA is about 150 minutes total and includes one separately timed 45-minute Extended Response. Studo’s current test UI may be technically functional, but the assembly logic makes the feature **educationally misleading and unusable as exam simulation**.

### Recommendation

Keep the test UI, but replace “all questions” assembly with a **blueprint-based mock generator**:

- fixed realistic total duration
- controlled skill distribution
- realistic reading passage count/length mix
- separate 45-minute ER section
- no immediate feedback during the mock
- randomized/set-based forms so repeated mocks differ

Do not merely rename the 503-minute test.

---

## 4.2 Most non-reading RLA tracks are exposed before they are built

### Arguments & Sources

- 15 skills exposed across two domains
- only **3 prototype questions** currently exist
- 13/15 skills have no meaningful question bank
- no real learner resource baseline

### Language & Editing

- 13 skills exposed
- only **4 questions** across two skills
- 11 skills effectively empty
- no full study-resource baseline

### Extended Response

- 12 skills exposed
- only **2 prototype questions**
- no real 45-minute paired-source ER workflow
- no proper rubric-scored full response practice

This creates a trust problem: a learner can see a complete-looking curriculum while major portions are functionally absent.

### Recommendation

Until a domain has a useful baseline, either:

1. hide it from normal learner/search navigation, or
2. show it clearly as unavailable and make it non-clickable.

Do not let empty curriculum pages look like finished Studo content.

---

## 4.3 Assessment answer patterns are dangerously predictable

Across 58 generated modules / 414 questions:

- **28 modules** use exact key sequence `ABCDABCD`
- **10 modules** use exact key sequence `ABCDABC`

So about **38 of 58 modules (~66%)** use one of two obvious repeating answer patterns.

This is a serious validity problem. Even if a learner does not consciously exploit it, repeated exposure can teach answer-position expectations instead of reading skill.

### Recommendation

- rebalance keys at the **bank level**, not manually by visible pattern
- add a validator that flags suspicious local sequences and strong position imbalance
- never deliberately cycle A/B/C/D

---

## 4.4 Many distractors do not meet Studo’s own standard

The project standard says wrong options should represent plausible misconceptions and should not be removable without reading the passage.

Many older modules violate that.

Common pattern:

- correct answer accurately reflects a nuanced passage
- wrong options are extreme, unrelated, or clearly absurd

Examples found include inference options equivalent to:

- “he knew exactly whose battery would fail”
- “he planned to give away his laptop”
- “he never uses chargers”

Tone/purpose/structure sets also reuse generic extreme distractors.

This creates the appearance of practice without enough reasoning demand.

### Recommendation

Make Level 3 difficulty come from:

- degree/qualification differences
- evidence distance
- competing plausible interpretations
- partial truth vs best-supported answer
- closely related purposes/tones
- synthesis across paragraphs

—not from confusing passage prose or obviously silly distractors.

---

## 4.5 Some questions have more than one defensible answer

This is worse than an easy question because it can teach the learner that correct reasoning is wrong.

Examples found in transition practice:

- `Consequently` vs `As a result` can both validly express the same result relationship in one item
- `Nevertheless` vs `However` can both plausibly fit another item

There is also a confirmed explanation/key mismatch:

- `rla-compare-practice-01.json`, Q4: key is **D**, but explanation says **A** is correct

### Recommendation

Add pre-publication QA that checks:

- one defensible best answer
- answer/explanation consistency
- transition synonyms in context
- qualification strength
- no “technically also correct” distractor

This should be a hard publication gate.

---

## 4.6 “whyWrong” exists, but much of it is educationally empty

This is a good example of “we have the feature, but it is not useful enough.”

Repeated generic metadata includes phrases like:

- “This choice does not best match the relationship and evidence in this text.” — hundreds of repetitions
- “This choice does not best match the wording and evidence in this specific text.” — hundreds
- “This option is not best supported by the passage.” — dozens

That does not diagnose *why* a learner made the error.

Newer passage sets are better because their explanations reference the actual evidence and misconception.

### Recommendation

Each wrong answer should explain the real error type, for example:

- too broad
- reverses cause/effect
- true detail but does not answer the question
- makes the author more certain than the text
- confuses sequence with cause
- supported by one paragraph but contradicted by another

The explanation layer should be a teaching system, not placeholder metadata.

---

# 5. Passage Practice audit

Current Passage Practice:

- **23 sets**
- 146 questions
- about **70% informational / 30% literary**, reasonably close to the GED’s 75/25 direction
- mostly medium difficulty

### Length problem

Using the actual passage texts, the bank is heavily concentrated around short-to-mid length.

- **9/23** are under 400 words (including three tiny prototypes/drills)
- **14/23** are 400+ words
- **0** are 600+ words
- longest is about **561 words**

GED reading passages can run roughly 400–900 words, so Studo currently lacks the upper-end reading stamina a learner needs.

### Misclassified tiny sets

At least these do not belong beside GED-length passage practice:

- *The Last Bus* — about 67 words / 2 questions
- *The Night Shift* — about 89 words / 2 questions
- *Sunday Hours at the Downtown Library* — about 53 words / 2 questions

They are useful as focused drills/prototypes, but not as full Passage Practice.

### Topic mix gap

Studo has a lot of:

- workplace/community contexts
- environment/science-adjacent texts
- literary stories

But it has very little meaningful **civics/history/social-studies informational reading**, including the kind of U.S. civic/founding-document ideas listed in GED’s RLA specifications.

### Recommendation

Build a deliberate passage blueprint rather than adding random passages:

- 75% informational / 25% literary target
- science + social studies/civics + workplace distribution
- 400–600 word normal practice
- regular 600–900 word stamina pieces
- mixture of straightforward and dense syntax
- close-choice assessment around each passage

---

# 6. GED question-format realism

Current 414-question generated bank:

| Question type | Count |
|---|---:|
| Multiple choice | **404** |
| Evidence-based | 5 |
| Grammar edit | 4 |
| Extended response | 1 |

The live GED also uses technology-enhanced question forms such as drag/drop, select-an-area, and dropdown items.

Studo is therefore currently almost entirely multiple choice.

The existing `grammar_edit` implementation also behaves more like ordinary answer choices below the prompt than authentic embedded dropdown editing.

### Recommendation

Do not add exotic interaction types just for visual novelty. Add them where they train a real GED task:

1. embedded dropdown editing
2. multiple-selection/select-area style evidence tasks where appropriate
3. drag/drop only where ordering/classification genuinely benefits from it

The reasoning should remain the hard part—not the UI.

---

# 7. Extended Response is not yet a real product area

The current ER track is a curriculum shell with tiny prototypes, not full GED ER preparation.

A serious ER system needs:

- paired source texts
- roughly authentic source length/load
- argument comparison
- claim/evidence/reasoning analysis
- 45-minute mode
- planning space
- full response editor
- rubric-based review across:
  - argument/evidence
  - development/organization
  - clarity/Standard English
- model/annotated responses
- targeted drills before full essays

This should become its own deliberate learning progression, not just one generic written-response component.

---

# 8. Source-of-truth/build architecture is incomplete

This is a major maintainability issue.

`content-src/` currently owns only a small fraction of the learner content. The generated learner curriculum preserves a large amount of older migrated content that is not fully represented in the current source authoring structure.

Examples from the audited copy:

- `content-src/resources/rla.resources.json` contains only a tiny current-source set
- learner curriculum still references about **85 resource PDFs**
- generated bank has **58 modules / 59 index entries**
- current source content only accounts directly for a small subset

The recent build bug—where a normal rebuild would have erased migrated learner content before we added the regression protection—was evidence of this architectural debt.

### Why this matters

If legacy content remains outside the true source-of-truth pipeline:

- validators cannot fully judge it
- bulk changes are harder to make safely
- generated output becomes semi-authoritative
- future rebuilds risk data loss
- QA rules are applied inconsistently

### Recommendation

Before or alongside the large RLA refinement, **finish migrating legacy learner content into the source-of-truth format**.

The end state should be:

`content-src` → validate → build → `data/generated`

Generated files should never need to serve as hidden backup source material.

---

# 9. PDF/resource audit

Audit inventory:

- **93 PDFs** in assets
- **399 pages** rendered successfully during QA
- about **85 PDFs** referenced by learner curriculum
- **10 orphan/unregistered assets** found

### Strong

- no widespread render failure
- newer refined Core Meaning guides look much closer to the intended Studo visual standard
- layouts are generally clean and readable

### Weak

Typography is inconsistent across generations:

- about **69/85 referenced PDFs** use a dominant font other than Inter
- older groups use DejaVu Sans / Liberation Sans
- one learner-referenced Core Meaning practice pack has roughly **10 pt median text**, below the current readability target

Some old tiny PDFs are orphaned rather than learner-facing, which reduces urgency but still creates repo clutter.

The new four Core Meaning transfer-practice PDFs also exist but are not registered to learner resource navigation, so they are effectively dead assets unless intentionally kept only as production artifacts.

### Recommendation

Do not visually rebuild every PDF just because the font differs. Prioritize:

1. learner-visible PDFs with small/dense text
2. content being materially revised anyway
3. inconsistent or missing guide sections
4. orphan resources: register if useful, delete if not

Then gradually converge everything on the current Inter/lavender/accessibility standard.

---

# 10. Accessibility, privacy, security

## Good

- learner pages contain viewport/lang/title basics
- static image-alt scan did not find missing alt text in learner HTML
- local references are intact
- restrictive CSP is present
- learner progress is local-first
- privacy page describes local storage / hosting behavior
- service worker avoids aggressively caching large PDFs

## Needs improvement

A full keyboard/screen-reader/browser interaction audit has not yet been automated.

Some internal authoring forms use wrapped labels rather than explicit `for` attributes; wrapped labels are valid HTML, so these should not be reported as automatic failures, but the authoring interfaces deserve a focused accessibility pass later.

---

# 11. Deployment/security hygiene

Studo is a static site, which is a major security advantage. But the GitHub Pages deployment currently appears to publish the repository root.

That means internal/project material can be publicly reachable, including items such as:

- `builder.html`
- `content-studio.html`
- `resource-studio.html`
- authoring files
- source content
- internal reports/docs

Calling a page “private” because it is not linked is not real privacy.

There are also several committed backup files (`.bak`, `.bak4e`, etc.) and documentation/release metadata that have drifted from the current project state.

### Recommendation

Later, create a real learner deployment output, e.g. `dist/` or `public/`, and configure GitHub Pages to publish **only** that output.

Keep authoring tools, source files, audit docs, and backups out of the public web root.

---

# 12. Test coverage is too small for “solid quality”

Current meaningful automated regression coverage is only two tests:

1. migrated learner content survives build
2. Passage Practice does not leak into skill pages

Those are useful, but not enough.

Missing automated coverage includes:

- module answer/feedback flow
- scoring
- quiz/mock assembly
- timer behavior
- Train Me selection
- learning-engine scheduling
- progress backup/restore
- search/navigation into only available content
- localStorage corruption/fallback behavior
- service-worker/cache behavior
- answer/explanation consistency
- answer-position quality
- ambiguous distractor checks where machine-detectable

### Recommendation

Create a small, focused automated quality suite rather than hundreds of brittle UI tests.

Highest-value tests:

1. build/content QA
2. mock blueprint validity
3. scoring/answer flow
4. learning-engine unit tests
5. progress export/import
6. browser smoke test for core learner routes

---

# 13. UX/product-trust issues

The visual design is not the current bottleneck.

The more serious UX issue is **promise vs availability**:

- curriculum/search can expose empty skills
- “Full RLA Test” sounds authentic but currently means all 414 questions
- Passage Practice mixes genuine passage sets with tiny drills
- progress/adaptive features can look sophisticated even where the content family behind them is shallow

A solid product should sometimes show **less** rather than expose weak/incomplete material.

Recommendation: only surface a feature when it has enough content to be useful.

---

# 14. Master priority plan

## P0 — Product validity

1. **Finish source-of-truth migration** for the legacy learner bank
2. **QA/refine the existing question bank**
   - remove key patterns
   - remove ambiguous questions
   - make distractors plausible
   - fix key/explanation mismatches
   - replace generic whyWrong feedback
3. **Replace Full Test assembly with a GED-style blueprint**
4. **Build Arguments & Sources baseline**
5. **Build Language & Editing baseline**
6. **Build real Extended Response progression and 45-min mode**
7. **Rebuild Passage Practice blueprint**
   - reclassify tiny drills
   - add 600–900 word stamina passages
   - add civics/social-studies informational material

## P1 — Quality hardening

8. Add appropriate GED-style interaction types
9. Strengthen question-family transfer coverage
10. Standardize/refine learner-visible PDFs as they are touched
11. Register or delete orphan resources
12. Add focused automated test coverage
13. Hide/non-link incomplete curriculum from learners until useful

## P2 — Engineering/deployment cleanup

14. Publish a learner-only `dist/` instead of repo root
15. remove backup/obsolete files from deployable output
16. update README/release metadata/tooling docs
17. reduce CSS/repo duplication where it genuinely improves maintenance
18. optimize bulk module loading only if it becomes a real performance problem

---

# 15. What NOT to do

- Do **not** rewrite all existing material blindly.
- Do **not** add hundreds of questions just to make counts look impressive.
- Do **not** call every 400-word text “GED-level” solely because its length matches.
- Do **not** make questions difficult by making passages unnecessarily confusing.
- Do **not** expose empty skills simply because the taxonomy exists.
- Do **not** keep a “Full RLA Test” that is 8+ hours just because the timer technically works.
- Do **not** trust metadata labels like `hard` unless learner reasoning demand actually justifies them.

The goal should be **fewer weak assets, more defensible assets**.

---

# 16. Recommended next move

Do not start by refining Relationships & Inference alone.

Use this audit as the master map, then perform the rebuild/refinement in controlled system batches:

### Batch 1 — Foundation & QA pipeline
- migrate source-of-truth
- add content-quality validators/tests
- hide unfinished curriculum

### Batch 2 — Existing Reading quality sweep
- preserve good passages/guides
- repair weak/ambiguous questions
- remove answer-key patterns
- improve explanations
- rebalance Passage Practice

### Batch 3 — Arguments & Sources

### Batch 4 — Language & Editing

### Batch 5 — Extended Response

### Batch 6 — Mock/Test blueprint

### Batch 7 — Final whole-site learner QA + PDF/accessibility/deployment cleanup

This order prevents us from generating another large batch before the production/QA rules are strong enough to protect it.

---

# Bottom line

**Studo is worth continuing. The foundation is much stronger than a blank prototype, but the current product is not yet trustworthy as complete GED RLA preparation.**

The highest-value work now is not “more content.” It is:

> **make the content pipeline authoritative → make every existing question defensible → complete the missing RLA pillars → build a real mock system → then scale the bank.**

That is the path from “we have the feature” to “the feature is actually useful.”
