# Chee Skool Phase 4 Closeout Review

**Date:** 2026-08-25  
**Target release:** `0.7.0-alpha.29`  
**Scope:** Skill Check runtime/evidence, first-wave dedicated Checks, Train Quick Review, cross-mode isolation, learner flow, and release readiness for the next development phase.

## Verdict

Phase 4 is complete at the product/code/content level. The evidence system now has distinct jobs instead of reusing one interaction everywhere:

- **Practice teaches.** Guided help, retries, explanations, confidence, and learning-stage progression may live here.
- **Train strengthens.** Adaptive sessions use mistakes, weaker skills, review timing, and transfer questions.
- **Skill Check demonstrates one mature skill independently.** No hints, retries, confidence prompts, timer, or correctness feedback before final submission.
- **Quick Review retrieves discrete knowledge.** It schedules only recall cards and does not alter skill/mastery evidence.
- **Mock measures broader readiness.** Phase 4 still has no dedicated Mock-only bank; that is Phase 5.

This separation is the main Phase 4 success criterion. It is more important than maximizing feature count.

## Phase 4A — dedicated Skill Check runtime and evidence

A dedicated `check.html` / `js/check.js` runtime was used instead of branching the Practice controller. That keeps independent assessment behavior structurally separate from Guided Practice.

Skill Check conditions:

- answers remain hidden until the whole Check is submitted;
- no hint or retry control exists;
- no confidence interruption exists;
- no timer exists by default;
- one submitted answer per question records `mode: "skill_check"`, `assistance: "none"`, `attemptCount: 1`, and no learning stage;
- wrong answers enter the existing mistake/review system so later Train can respond to genuine independent misses;
- a lightweight `sq:skill-check-history:v1` history stores raw Check summaries for learner display;
- Progress shows **Practice signal** and **Latest Skill Check** separately rather than collapsing them into one unexplained mastery label.

Skill Check receives stronger independent evidence weighting than ordinary Practice, but a short Check does not become a psychometric mastery guarantee. The result is a local Chee Skool independent-practice result, not a GED score.

## Phase 4B — first-wave dedicated Checks

The first wave contains **9 Skill Checks / 54 unseen questions**:

Reading:

1. Explicit Meaning
2. Main Idea
3. Supporting Details
4. Summary
5. Inference
6. Conclusions & Generalizations

Arguments:

7. Claims & Argument Structure
8. Finding Evidence
9. Credibility & Counterarguments

Each Check contains six new questions, uses only the `skill_check` delivery role, and includes `mock-excluded`. Check content does not appear in ordinary Practice sets, adaptive Train candidates, or Mock fallback/dedicated selection.

Only mature skills received Checks. Phase 4 intentionally does **not** create Checks for all 62 canonical skills merely to fill the interface. More Checks should be justified later by learner evidence, Mock needs, or a clear independent-measurement gap.

## Phase 4C — selective Quick Review

Quick Review is an optional lane inside Train, not a second adaptive-question system.

The canonical deck contains **28 cards** across:

- argument terms;
- transitions;
- text structure;
- word/tone distinctions;
- language rules;
- punctuation;
- Extended Response planning/analysis reminders.

Passage-reasoning tasks such as Main Idea, Summary, Inference, and synthesis are intentionally not converted into flashcards. Those skills require reading and reasoning, not isolated recall.

The card interaction is:

**front → Reveal → back/example → Again / Got it**

Scheduling is stored under `sq:quick-review:v1`. `Again` makes the card due again; `Got it` spaces it across increasing review intervals. Quick Review does not call `Learning.recordAttempt`, does not set mistake reasons, does not change the learner's skill signal, and does not enter Mock.

## Cross-mode learner flow review

The intended high-level path is now:

**Learn → Practice → Train → Skill Check → Mock → Progress**

Quick Review is an optional recall lane from Train, not a required step.

Fresh learner behavior remains consistent:

- Progress sends a new learner directly to Practice;
- Train asks for Practice evidence before building an adaptive question session;
- Quick Review can still be opened independently because discrete recall does not require mastery history;
- Skill Check appears only on pages where a real dedicated Check exists;
- skills without a Check show no disabled card or `Soon` placeholder.

## Inventory at closeout

- **112 learner modules**
- **807 objective/component questions**
- **9 dedicated Skill Checks**
- **54 Skill Check questions**
- **28 Quick Review cards**
- **152 registered/physical learner PDFs**
- **10 full ER paired-source prompts**
- **6 ER Production Lab tasks**
- **0 dedicated Mock-role modules** — intentional until Phase 5

## What Phase 4 proves

Phase 4 gives Chee Skool a cleaner evidence hierarchy:

- supported Practice performance can guide learning;
- adaptive Train performance can strengthen/retest learning;
- dedicated Skill Check performance provides short independent skill evidence;
- mistakes from independent checks can influence later review;
- discrete recall can be scheduled without contaminating skill evidence.

## What Phase 4 does not prove

Phase 4 does **not** produce:

- an official GED score;
- a pass/fail prediction;
- psychometric equivalence to the GED;
- a guarantee that one Skill Check means permanent mastery;
- a complete readiness signal across the whole RLA test;
- a dedicated unseen Mock bank.

Those boundaries remain explicit in learner copy and architecture.

## Phase 5 handoff

Phase 5 should build the dedicated unseen Mock system, not expand Phase 4 for symmetry. The next design should:

- map the existing Mock blueprint to the intended reporting-category balance;
- author coherent unseen passage/source sets and editing material with dedicated `mock` role;
- preserve Skill Check questions as `mock-excluded`;
- prefer passage-set rhythm over one-question filler behavior;
- keep ER as paired-source writing;
- disable Practice fallback only when the dedicated Mock bank independently satisfies the full blueprint.

## Public release boundary

Phase 4 closeout is a development/release-candidate milestone, not the final public-alpha approval. `publicAlphaEnabled` remains `false` until the production URL receives real desktop/mobile testing, keyboard/zoom/basic screen-reader checks, service-worker/offline recovery checks, and a small learner pilot.
