# Studo Learning Design Principles

This file is the product reference for how Studo should support attention and learning.

## Core rule

**One primary mental task per screen.**

- While solving: solve the question.
- After answering: understand the correction.
- In Progress: inspect learning patterns.
- In review sessions: retrieve and strengthen weak skills.

## Evidence-informed principles

1. **Retrieval beats passive rereading for durable retention.** Studo should make learners actively retrieve answers and then give corrective feedback.
2. **Space and revisit learning.** Weak skills should return after delays; mastery should require success across time and preferably across different questions.
3. **Reduce extraneous cognitive load.** Useful tools should not all compete for attention at once. Use progressive disclosure.
4. **Avoid unnecessary task switching.** Do not make learners jump between solving, analytics, self-diagnosis, and settings during the same moment.
5. **Use metacognition carefully.** Confidence can reveal guessing and misconceptions, but it should stay optional and visually quiet.
6. **Personalize by evidence, not fixed “learning styles.”** Preferences differ, but Studo should adapt mainly to performance, prior knowledge, confidence, pace, and review history.
7. **Feedback should be layered.** Give the minimum correction first; deeper reasoning and evidence are available on demand.
8. **Track first attempts.** Once corrective feedback is revealed, later changes should not be treated as equivalent evidence of independent knowledge.
9. **Analytics belong away from the solving surface.** Practice should show only a quiet “recorded” or “added to review” message; detailed percentages live in Progress.
10. **Respect uncertainty.** Low-data skill estimates must be labelled as weak evidence rather than treated like precise mastery scores.

## Research anchors

- Wiklund-Hörnqvist et al. (2022), retrieval practice across differences in need for cognition. DOI: 10.3389/fpsyg.2021.797395
- Massey & Kellman (2021), adaptive spacing and mastery criteria. PMID: 34337609
- Foster et al. (2019), interleaving and distributed practice. DOI: 10.3758/s13421-019-00918-4
- Mengelkamp & Bannert (2010), confidence judgments and learning outcomes. DOI: 10.3758/MC.38.4.441
- Pashler et al. (2008), evidence review of learning-styles matching. DOI: 10.1111/j.1539-6053.2009.01038.x
- Zhou et al. (2022), task switching and working memory. PMID: 36457903

## Phase 3C — Review rhythm and transfer

### Review is scheduled by skill, not by page visit
Studo now keeps a lightweight review schedule for each graded skill. A wrong answer makes the skill immediately eligible for review; successful retrieval spaces the next check farther out. Confidence can shorten that interval when a correct answer was guessed or uncertain.

This schedule is intentionally simple and explainable. It is not presented as a scientifically exact memory model.

### Transfer matters more than memorizing the old answer
A mistake is not considered fully stable merely because the learner later selects the correct option on the exact same question. When possible, Studo looks for a different question in the same skill/question family. Correct work on fresh material is stronger evidence that the skill transferred.

### Train Me must explain its choices
An adaptive session may choose a question because:
- a review is due,
- the underlying skill is weak,
- the learner was confidently wrong,
- a new parallel question can test transfer after a mistake,
- the skill is still building,
- or the skill needs maintenance.

With too little history, the session is explicitly labelled **Baseline** rather than pretending to be personalized.

### Personalization boundaries
Studo adapts from observed performance, timing, confidence, and mistake patterns. It does not assign fixed learner-style identities. Manual Practice remains available at all times; adaptive recommendations are suggestions, not commands.
