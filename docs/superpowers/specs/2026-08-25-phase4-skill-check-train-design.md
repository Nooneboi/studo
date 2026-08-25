# Studo Phase 4 — Skill Checks and Train Quick Review Design

**Date:** 2026-08-25  
**Status:** Approved and implemented in Alpha 29  
**Base:** Chee Skool / Studo `0.7.0-alpha.26`

## Goal

Turn Studo's Phase 3 teaching system into a learner evidence system without blurring the jobs of Practice, Train, Skill Check, and Mock. Build a dedicated independent Skill Check experience, publish a first wave of unseen checks only for mature skills, add a small separate Quick Review mode for discrete recall, and then run a whole Phase 4 evidence/learner-flow review before Phase 5 Mock work begins.

## Product model

- **Practice teaches.** Hints, retries, confidence, explanations, and Guided/Apply/Independent progression may exist here.
- **Train strengthens.** Adaptive sessions use mistakes, weaker skills, spaced review timing, and transfer questions.
- **Skill Check demonstrates a specific skill independently.** No hints, retries, confidence interruptions, or correctness feedback before final submission.
- **Mock measures broader readiness and format/timing.** Phase 4 does not create the dedicated Mock bank.
- **Quick Review retrieves discrete knowledge.** It supports Train but does not count as independent skill evidence.

The learner should always know which job they are doing. Do not reuse the same learner-facing label for different evidence types.

## Non-negotiable constraints

- `content-src/` is canonical authoring source; `data/generated/` remains generated build output.
- Delivery roles remain explicit: `practice`, `train`, `skill_check`, `mock`.
- Every Skill Check module must use `curriculum.deliveryRoles: ["skill_check"]`, include `"mock-excluded"` in `curriculum.practiceTags`, and must not include `practice`, `train`, or `mock` delivery roles.
- Skill Check questions must be unseen relative to the learner-facing Practice/Train bank; do not copy or lightly rewrite existing questions.
- Skill Check answers/explanations stay hidden until the learner submits the whole check.
- Skill Check has no per-question hint, retry, confidence prompt, immediate right/wrong signal, or timer by default.
- Skill Check attempts are stored as `mode: "skill_check"` and are distinguishable from Practice and Train attempts.
- Do not invent a GED-equivalent score, pass/fail prediction, psychometric mastery claim, or official GED affiliation.
- Quick Review does not alter skill mastery/practice signals.
- Quick Review cards are selective; do not create passage-reasoning cards for Main Idea, Summary, Inference, synthesis, or similar skills.
- Do not create Skill Checks for all 62 canonical skills during this phase.
- No new PDFs are required for Phase 4.
- Phase 4 does not create Mock-only content.

# Checkpoint A — Dedicated Skill Check runtime and evidence architecture

## Problem

Alpha 26 already understands the canonical `skill_check` delivery role, and generated curriculum can expose `checks`, but the learner runtime is incomplete:

- `skill.js` renders Study Guide, Workbook Sheets, and Interactive Practice only;
- `module.js` records graded module attempts as `mode: "practice"` and contains Practice-specific hints/retries/confidence/immediate explanation behavior;
- `learning.js` has no dedicated Skill Check evidence handling;
- Progress does not separately display independent Skill Check results.

Adding branches to `module.js` would couple two intentionally different learning modes. Phase 4 therefore uses a dedicated Check runtime.

## Runtime architecture

Create:

- `check.html` — learner shell for one dedicated Skill Check;
- `js/check.js` — Skill Check controller;
- `css/check.css` only if existing shared/module styles cannot express the required layout cleanly. Prefer shared styles first.

Reuse existing learner-safe data loading and question interaction helpers where possible. Do not duplicate answer-validation logic if an existing shared interaction helper can be called without inheriting Practice feedback behavior.

### URL contract

A Skill Check opens as:

`check.html?file=<generated-module-file>&return=<encoded-skill-url>`

The runtime loads only a module whose `curriculum.deliveryRoles` contains `skill_check`. If the file is missing, invalid, or lacks the role, show a plain recovery state with a link back to the supplied safe return route or Practice.

## Skill Check learner flow

1. Learner opens a Skill Check from a skill/unit page.
2. Header identifies the skill and shows concise conditions:
   - `Independent`
   - `No hints`
   - `Answers after finishing`
3. Learner answers all questions in order.
4. No right/wrong state or explanation is revealed while moving through the check.
5. Learner cannot use Practice hints/retries/confidence controls because those controls do not exist in Check mode.
6. `Finish Check` remains disabled or blocked until all required questions have an answer.
7. On final submit:
   - grade all questions once;
   - record one independent attempt per graded question with `mode: "skill_check"`;
   - show raw result as `X / Y correct` and percentage only as a local Studo result, not a GED score;
   - reveal per-question correct answer, learner answer, explanation, and evidence text where present;
   - offer `Review this skill` linking to the canonical skill page and `Back to skill`.
8. A completed check cannot silently re-grade the same answers as new evidence. A learner may start another attempt explicitly; each new attempt is a fresh check attempt with its own timestamp/attempt ID.

## Attempt storage

Extend `Learning.recordAttempt`/normalization so `mode` accepts and preserves:

- `practice`
- `train`
- `skill_check`
- `test`

Add `skill_check` to learning-stage/evidence handling only where necessary. The preferred representation is:

- `mode: "skill_check"`
- `learningStage: null`
- `assistance: "none"`
- `firstTryCorrect` equals the final single submitted answer correctness;
- `attemptCount: 1`.

Skill Check evidence receives a stronger evidence weight than ordinary Practice because it is unassisted and independent, but do not let one short check overwhelm the entire skill signal. A target weight near existing independent/train evidence is appropriate; exact numeric value must be covered by regression tests and documented in `learning.js` comments.

### Mistakes and reviews

Wrong Skill Check answers should:

- enter/update the existing mistake system;
- make the skill eligible for future adaptive Train review;
- retain the check module file/question ID so Progress can route back to the skill rather than re-open a completed check as if it were Practice.

Correct Skill Check answers on a different question in the same canonical family may count as transfer evidence under the existing mistake-transfer logic.

## Check summary history

Store a lightweight check-session summary in local safe storage under a new versioned key such as:

`sq:skill-check-history:v1`

Each summary contains:

- stable `attemptId`;
- check/module ID;
- skill ID and label;
- module title;
- attempted timestamp;
- correct count;
- total count;
- raw percentage.

Keep a bounded recent history. The question-level learning attempts remain the source for skill signals; the check-history object exists for clear learner display.

## Skill page integration

`skill.js` gains a separate **Skill Check** section only when `item.checks` contains learner-visible checks.

Do not turn the existing three learning-resource columns into four cramped desktop columns. Preserve the current Study Guide / Workbook Sheets / Interactive Practice grid, then render a distinct compact section below it:

**Skill Check**  
`Independent · no hints · answers after finishing`

Each check card links to `check.html` and includes only the title and the concise independent conditions. If a skill has no check, render nothing—no `Soon`, disabled card, or empty section.

## Progress integration

Progress must keep the current Practice signal and show independent Check evidence separately rather than blending them into one unexplained number.

For skills with Skill Check history, show the latest result in a compact form such as:

- `Practice signal 82%`
- `Latest Skill Check 5/6`

The existing skill signal may use Skill Check attempts internally as stronger evidence, but the learner-facing UI must preserve the distinction.

For skills without a Check, Progress remains unchanged.

Do not add `Pass`, `Fail`, `Mastered`, or readiness claims based on one check.

## Accessibility and interaction requirements

- Check controls must be keyboard operable using the same interaction semantics as existing question engines.
- The final `Finish Check` action must announce validation errors accessibly if unanswered questions remain.
- After final submission, move focus to the result heading/summary.
- Correct/wrong styling must not rely on color alone.
- Focus mode/navigation behavior should match active Practice/Train/Mock conventions: global navigation stays out of the learner's way while the check is active.

## Checkpoint A tests

Add regression coverage proving:

- `check.html`/`js/check.js` exist in the learner build;
- Check runtime rejects non-`skill_check` modules;
- no Practice hint/retry/confidence/immediate-feedback controls are present;
- answers remain ungraded/unrevealed until final submission;
- final submission records `mode: "skill_check"` attempts;
- Skill Check attempts are unassisted single attempts;
- wrong Check answers enter mistake/review data;
- skill page renders Check only when checks exist;
- Progress preserves Practice vs latest Check distinction;
- Check content remains `mock-excluded` and does not enter Train.

# Checkpoint B — First-wave dedicated Skill Checks

## Scope

Publish one six-question unseen Skill Check for each of these mature skills/units:

1. Explicit Meaning
2. Main Idea
3. Supporting Details
4. Summary
5. Inference
6. Conclusions & Generalizations
7. Claims & Argument Structure
8. Finding Evidence
9. Credibility & Counterarguments

This produces **9 new Skill Check modules / 54 new questions** if all checks remain six questions.

Expected learner-bank totals after Checkpoint B, before any later Phase 4 additions that are not question modules:

- **112 learner modules**
- **807 objective/component questions**
- **152 PDFs**

These are expected counts, not hard-coded design goals; build output is authoritative.

## Content role contract

Each new check module:

- lives in canonical `content-src/sets/`;
- has `curriculum.deliveryRoles: ["skill_check"]`;
- includes `"mock-excluded"` in `curriculum.practiceTags`, matching the project's existing exclusion convention;
- is attached to the correct canonical skill/unit through generated curriculum `checks`;
- never appears in `sets`/Practice;
- never appears in the Train candidate catalog;
- never appears in Mock candidate selection.

## Content design rules

### Shared rules

- Six questions per check.
- Entirely original learner-facing text/questions; no copied commercial/prep-book questions.
- No question is a trivial paraphrase of an existing Practice item.
- Use canonical skill/family IDs already established during Phase 2/3.
- Difficulty should be mostly Medium with some Hard transfer where the skill supports it; do not manufacture equal distributions.
- No Guided/Apply labels or scaffolding.
- Distractors must represent plausible reasoning errors, not wording tricks.
- Each check should feel like one coherent independent evidence sample rather than six unrelated trivia items.

### Reading checks

Reading Skill Checks should use new original passages/contexts appropriate to the skill. Where a coherent passage can support multiple questions without accidentally testing unrelated skills, prefer a short passage set over six unrelated snippets. Keep the check focused enough that the result still means something about the named skill.

Skill identities remain:

- Explicit Meaning — answer only what the text actually states or safely paraphrases.
- Main Idea — identify the central point that covers the whole relevant text without becoming too broad/narrow.
- Supporting Details — distinguish details that genuinely support the named idea from nearby but irrelevant facts.
- Summary — preserve the whole text's essential scope while omitting minor details and added claims.
- Inference — clues → smallest supported inference → proof.
- Conclusions & Generalizations — pattern → conclusion → scope → principle/transfer without overgeneralization.

### Arguments checks

Use new original argument contexts. Preserve the Phase 3 boundaries:

- Claims & Argument Structure — claim → reasons → evidence → argument chain.
- Finding Evidence — exact claim → evidence test → direct match → verify connection.
- Credibility & Counterarguments — claim → source fit → source limitation; objection → fair statement → direct response.

Do not let Finding Evidence drift into Evidence Quality or Credibility. Do not let Credibility become generic `trustworthy source` trivia.

## First-wave publication gate

A check is publishable only when:

- canonical families validate;
- no family is introduced as a one-off singleton without legitimate transfer elsewhere, unless the validator explicitly permits it for a documented reason;
- question explanations teach the correct reasoning after submission;
- the check passes duplicate/overlap scans against learner Practice/Train content;
- delivery-role tests prove it is Check-only and Mock-excluded.

# Checkpoint C — Train Quick Review

## Purpose

Add a short recall mode for discrete knowledge without polluting adaptive Train or pretending recall cards prove reading/argument mastery.

## Navigation and layout

Keep the current adaptive Train experience as the primary action:

### Today's Training

Existing adaptive 8-question session based on mistakes, weak skills, due reviews, and transfer.

Add a secondary section/action:

### Quick Review

`3–5 min · terms and rules`

Quick Review opens in a dedicated learner view. Prefer a separate `quick-review.html` + `js/quick-review.js` if that keeps the adaptive Train controller simple. A modal buried inside Train is not preferred because it complicates focus/history behavior.

## Canonical card data

Add a small canonical source such as:

`content-src/config/quick-review-cards.json`

or a dedicated directory if the build architecture benefits from one. The generated learner-safe file should contain only published card content.

Each card contains:

- stable ID;
- category/skill tag;
- front/prompt;
- back/explanation;
- optional concise example;
- reviewer/status metadata in canonical source only where authoring-only fields are stripped from public output.

Target roughly **25–30 published cards** for Phase 4.

## Allowed card topics

Good candidates include:

- claim / reason / evidence / counterargument / rebuttal distinctions;
- evidence relevance vs sufficiency vs source credibility distinctions;
- common text-structure signal relationships;
- selected tone/connotation distinctions where the meaning is retrievable without a passage;
- transition relationship meanings;
- sentence-boundary/punctuation rules;
- agreement/pronoun rules;
- parallelism/connection rules;
- selected commonly confused usage rules;
- ER planning/rubric reminders such as thesis, evidence, analysis, comparison, and the three self-review traits.

Do **not** create cards whose answer requires reading a new passage or making a passage-specific inference. No Main Idea/Summary/Inference `flashcards` that reduce reasoning to memorized slogans.

## Quick Review learner flow

1. Show one card front.
2. Learner chooses `Reveal`.
3. Back shows concise explanation/example.
4. Learner selects:
   - `Again`
   - `Got it`
5. Continue through a short session.
6. End with a neutral summary such as `8 reviewed · 3 marked Again`.

No correctness percentage is needed because the learner self-reports retrieval.

## Scheduling/storage

Store Quick Review state separately from `sq:learning:v1`, for example:

`sq:quick-review:v1`

Each card may track:

- last reviewed timestamp;
- next due timestamp;
- small stage/interval index;
- Again/Got-it counts.

A simple bounded spaced schedule is sufficient. Do not build a full Anki clone.

Quick Review state must not:

- call `Learning.recordAttempt`;
- change skill Practice signals;
- create mistakes;
- create Skill Check evidence;
- affect Mock/readiness evidence.

## Quick Review tests

Add regression coverage proving:

- the published card bank validates and is learner-safe;
- no prohibited passage-reasoning skills appear as recall cards;
- Quick Review is visibly separate from Today's Training;
- `Again`/`Got it` updates only Quick Review storage;
- no Learning attempts/mistakes/mastery signals are written;
- public build contains card data but not authoring-only metadata.

# Phase 4 whole-system closeout review

After A/B/C are green, audit the complete learner evidence flow before calling Phase 4 complete.

## Review dimensions

### Learner journey

Verify the intended flow is understandable and non-redundant:

**Learn/Study Guide → Practice → Train → Skill Check → later Mock**

A learner should be able to answer:

- Where do I learn?
- Where do I practice with support?
- Where do I revisit weaknesses?
- Where do I independently check one skill?
- What is not yet a real Mock readiness measure?

### Evidence hierarchy

Verify:

- Guided Practice is weaker evidence than unassisted independent work;
- Train remains strengthening/review evidence;
- Skill Check is stored and surfaced distinctly as independent evidence;
- Quick Review contributes no mastery evidence;
- ER Production Lab remains Practice, not Skill Check;
- fallback Mock remains separate and does not consume Skill Checks.

### Content isolation

Verify:

- Check modules do not appear in Practice lists;
- Check modules do not enter Train sessions;
- Check modules do not enter fallback/dedicated Mock selection;
- Practice/Train modules do not masquerade as Check content;
- Quick Review cards are not inserted into question banks;
- no learner-facing answer keys or authoring notes leak into public output.

### Progress and learner copy

Verify Progress explains the distinction between Practice signal and latest Skill Check without overclaiming mastery/readiness.

Review all learner-facing copy for prohibited implications such as:

- official GED affiliation;
- GED-equivalent scoring;
- guaranteed pass/readiness;
- psychometric mastery claims.

### Mobile/accessibility

Automated checks should cover structural contracts, but Phase 4 is not considered release-ready solely from automated tests. Keep the existing final manual QA requirement for phone/tablet/keyboard/screen-reader sanity before public release.

## Phase 4 stop rule

At closeout, do not add more Skill Checks or cards because counts look uneven. Additional checks/cards require one of:

- learner testing reveals confusion or missing coverage;
- later Mock analysis exposes a real evidence gap;
- a mature skill gains enough Practice depth that an independent Check becomes meaningful.

If the system above is coherent and green, close Phase 4 and move to Phase 5 dedicated unseen Mock work.

# Release and verification strategy

Use internal checkpoints rather than one blind mega-edit:

1. **Checkpoint A** — Check runtime/evidence architecture; full tests + clean public build.
2. **Checkpoint B** — nine first-wave checks; full tests + content validation/build + public isolation checks.
3. **Checkpoint C** — Quick Review; full tests + storage/evidence isolation checks.
4. **Phase 4 closeout** — final whole-system audit and release package.

Before the final release claim run fresh:

- `npm test`
- `npm run content:validate`
- `npm run content:build`
- `npm run public:build -- --out <fresh-directory>`
- JavaScript syntax checks on learner-shipped JS
- generated/public module-question-PDF counts
- Skill Check role/isolation checks
- Quick Review evidence-isolation checks
- broken local-reference scan
- learner-only artifact scan
- release/version/service-worker/cache/manifest consistency checks

Final SOURCE packaging must exclude `.git`, `node_modules`, temporary verification output, and other machine-local artifacts. PUBLIC packaging must contain only learner runtime/assets/data/resources required for publication.
