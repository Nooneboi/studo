# Phase 4E — Curriculum Library UI

## Why this phase exists
The Phase 4D learner UI exposed too many layers in one place. Track cards,
domain explanations, expandable skills, and practice sets all competed for
attention. Phase 4E changes the hierarchy so each screen has one job.

## Learner flow

Practice → Track → Domain → Skill → Resource

- **Practice** is now a simple track index instead of a card dashboard.
- **Track pages** list domains only. They no longer expand the full skill tree.
- **Domain pages** open on a dedicated page and group skills in a deliberate
  order (for example, Core Meaning → Foundations → Build understanding).
- **Skill resources** appear as simple rows beneath the skill. Web practice and
  downloadable resources use the same library structure.

## Homepage
The main Study Philosophy message is left-led and no longer shares the hero
with three large roadmap cards. Plans, Systems, and Details now sit below the
main introduction as three equal stages. The bottom section explains Practice,
Train, and Resources without boxed cards.

## Curriculum grouping
The curriculum config now includes ordered groups for every RLA domain. These
are product organization groups, not new GED assessment targets. They exist to
help the learner move through related skills in a sensible order.

## PDF / study-file support
A resource registry now exists at:

`content-src/resources/rla.resources.json`

Local learner files can live under:

`assets/resources/`

A resource can attach to one or more skill IDs. `domain.html` renders published
resources alongside web practice. Supported display types include PDF guide,
worksheet, study guide, notes, and reference.

This means Studo can organize learning without forcing all learning to happen
inside the web app.

## Validation
`npm run content:check` still completes with 0 blocking errors and the two
existing transfer-family warnings for the writing prototype.
