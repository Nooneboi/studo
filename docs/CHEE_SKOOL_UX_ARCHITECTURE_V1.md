# Chee Skool UX Architecture V1

**Date:** 2026-10-05  
**Status:** Product architecture / pre-design  
**Scope:** GED RLA web product  
**Primary objective:** Make the next useful action obvious to a first-time learner and increasingly personalized to a returning learner.

## 1. Product decision

Chee Skool should stop behaving primarily like a library of RLA pages and start behaving like a **guided study system**.

Core promise:

> **Open Chee Skool. Know what to do next. Practice carefully. Understand mistakes. Come back knowing what matters today.**

Core UX rule:

> **Every major learner screen should make one primary next action obvious.**

Practice, Mock, Progress, and Resources remain useful. The change is that they become tools inside one study journey rather than competing first-level decisions.

## 2. Why the current architecture needs revision

The current Home asks a new learner to interpret product vocabulary before the product understands their situation:

- Practice
- Train
- Mock
- Progress
- Resources
- Reading & Comprehension
- Arguments & Sources
- Language & Editing
- Extended Response

That structure works better for an experienced learner than a first-time learner.

The new first-time question should be:

> **What should I do right now?**

The current skill page has a related problem: Study Guide, Workbook Sheets, Interactive Practice, and Skill Check appear as parallel choices. Chee Skool should make the intended sequence visible.

## 3. Evidence base

This architecture is informed by:

- **GED Ready:** readiness bands + custom study plan focused on areas that need work.  
  https://www.ged.com/study/ged-ready.html
- **GED & Me:** individual learning path, where to start, what to study, reminders, study-time tracking.  
  https://www.ged.com/study/ged-mobile-app.html
- **Nielsen Norman Group:** onboarding should not compensate for poor usability; setup should be minimal and clearly beneficial.  
  https://www.nngroup.com/articles/mobile-app-onboarding/
- **Carpenter, Pan & Butler (2022):** spacing and retrieval practice are effective but underused without support.  
  https://www.nature.com/articles/s44159-022-00089-1
- **Learning analytics research:** dashboards should support goals, planning, monitoring, and actionable regulation rather than merely display scores.  
  https://www.sciencedirect.com/science/article/pii/S0747563218302309  
  https://link.springer.com/article/10.1186/s41239-021-00313-7

## 4. Four learner modes

### Mode A — First visit
Chee Skool does not yet know enough to personalize.

Goal:
- reduce uncertainty;
- gather only information that changes recommendations;
- get the learner into useful work quickly.

Primary setup question:

> **When is your RLA exam?**

Choices:
1. I know my exam date
2. I have not scheduled it yet
3. I already have a GED Ready result

Do not begin with a product-tour carousel.

### Mode B — Building evidence
Chee Skool has limited performance history.

Communicate uncertainty honestly:

> **We’re still learning what you need most.**

Recommendations combine:
- exam date;
- available study time;
- completed skill work;
- early Skill Check results;
- optional GED Ready result.

Do not label a learner weak from one miss.

### Mode C — Personalized study
Chee Skool has enough repeated evidence.

Home becomes **Today**.

Example:

> **RLA exam in 24 days**  
> **Today · about 35 min**
>
> 1. Main Idea — implied ideas · 12 min  
> 2. Review — 3 mistakes due · 8 min  
> 3. Evidence — fresh transfer · 10 min  
> 4. Quick close · 5 min
>
> **Start today's plan**

### Mode D — Final-prep countdown
The exam is close enough that prioritization changes.

Example:

> **10 days until RLA**  
> You do not have time to study everything equally. We’ll focus on repeated weaknesses, realistic practice, and exam coverage.

Prioritize:
- recurring weaknesses;
- transferable reasoning;
- fresh mixed passages;
- timing;
- Extended Response exposure;
- language/editing coverage;
- active mistakes;
- realistic Mock work.

## 5. Navigation architecture

### Desktop V1
- **Today**
- **Practice**
- **Mock**
- **Progress**
- **Resources**

Secondary:
- Methodology
- About
- Privacy

### What happens to Train
"Train" should not remain a first-level concept that a new learner must understand.

Its adaptive behavior becomes part of:
- Today;
- Review;
- recommended sessions.

The underlying Train engine can remain technically separate.

### Mobile V1
1. Today
2. Practice
3. Mock
4. Progress
5. More

Resources moves into More and into contextual recommendations.

## 6. First-time Home

### Hero
**Prepare for GED RLA without guessing what to study next.**

Supporting copy:

> Tell Chee Skool where you are in your prep. We’ll organize what to practice first.

Primary:
**Build my study plan**

Secondary:
**Browse RLA practice**

Trust note:
> Your Chee Skool practice is not an official GED score.

### Start card
**Do you already have an RLA exam date?**

- Yes, I know the date
- Not scheduled yet
- I have a GED Ready result

The learner describes their situation before being asked to understand product structure.

## 7. Exam-date onboarding

Keep initial setup to three required decisions.

### Step 1 — Exam timing
**When is your RLA exam?**

Input:
- date; or
- not scheduled.

Derived:
- days remaining;
- planning mode.

### Step 2 — Realistic study capacity
**How much time can you usually study on a normal day?**

Choices:
- 15 min
- 30 min
- 45 min
- 60 min
- Custom

Then:
**Which days are usually available?**

Do not ask for detailed hour-by-hour schedules.

### Step 3 — Existing evidence
**Do you have a GED Ready RLA result?**

Choices:
- Yes
- No
- Not sure what that is

If Yes:
- record score;
- record date;
- display official readiness band.

Never transform a Chee Skool score into a GED Ready score.

### Completion
Show useful output immediately:

> **Your starting plan**
>
> 28 days remaining  
> 30 min/day · 5 days/week  
> First step: establish your current RLA skill profile
>
> **Start first session**

## 8. Planning modes

These are **Chee Skool heuristics to pilot**, not official GED rules.

| Time remaining | Mode | Main behavior |
|---|---|---|
| No date | Foundation | Build skills steadily |
| 61+ days | Foundation + spacing | Teach, practice, revisit |
| 31–60 days | Development | Prioritize weak skills + transfer |
| 15–30 days | Priority | Mixed practice, reviews, checks, timing |
| 8–14 days | Countdown | Repeated weaknesses + exam coverage |
| 2–7 days | Final prep | Targeted review + realistic practice |
| 1 day | Final day | Light review, logistics, no backlog |

Thresholds must be piloted and may change.

## 9. Daily-plan engine

The planner should not be a static calendar.

Conceptual priority:

**time urgency × skill need × recurrence × exam importance × review timing × remaining coverage**

Do not invent numeric weights yet.

### Inputs
- exam date;
- minutes available;
- study days;
- GED Ready result;
- Chee Skool skill evidence;
- repeated diagnostic categories;
- active mistakes;
- due reviews;
- Skill Checks;
- Mock performance;
- Extended Response exposure;
- practice recency;
- unfinished tasks.

### Hard constraints
The planner must not:
- exceed stated daily time without explicit opt-in;
- diagnose a weakness from one miss;
- recommend only the lowest-scoring skill until exam day;
- let the learner reach the final week without exposure to major RLA demands;
- call Chee Skool percentages GED readiness;
- create an ever-growing backlog after missed days.

## 10. Daily-plan composition

### 15 minutes
- 10 min main priority
- 5 min review or transfer

### 30 minutes
- 15 min main priority
- 8 min review
- 7 min fresh transfer

### 45 minutes
- 20 min main priority
- 10 min review
- 10 min secondary transfer
- 5 min close

### 60 minutes
Do not automatically fill all 60 minutes. Use longer sessions when they serve a purpose:
- Mock;
- Extended Response;
- longer passage;
- learner-requested catch-up.

## 11. Missed-day behavior

Do not say:

> You missed 3 tasks. Finish yesterday first.

Chee Skool should say:

> **Yesterday did not happen. We adjusted the remaining plan.**

Rules:
- recalculate from today;
- keep high-value due review when useful;
- drop low-priority work;
- never punish with backlog;
- briefly explain major priority changes.

## 12. Ten-days-left mode

### Header
**10 days until RLA**

Supporting:
> There is not enough time to study everything equally. Your plan now focuses on repeated weaknesses, realistic practice, and exam coverage.

### Days 10–8
Repair high-value recurring skill problems.

### Days 7–5
Increase transfer:
- fresh mixed passages;
- realistic distractors;
- passage length;
- one Extended Response block if needed.

### Days 4–3
Increase exam-like conditions:
- timed mixed work;
- pacing;
- Mock or partial Mock;
- targeted review afterward.

### Day 2
Targeted repair only:
- strongest remaining mistakes;
- important review;
- one short confidence-building set.

### Day 1
Light review:
- no major new learning sequence;
- logistics;
- optional short refresh.

This sequence is a product hypothesis and must be piloted.

## 13. Today screen

Information order:

1. exam countdown / current mode;
2. today’s estimated workload;
3. one main recommended action;
4. due review;
5. secondary task if useful;
6. **Why this today?**
7. manual browse link.

Example:

> **24 days until RLA**  
> Today · ~35 min
>
> ### Main priority
> **Main Idea — implied central ideas**  
> 12 min  
> You missed this reasoning pattern in two recent practices.
>
> **Start**
>
> Then:
> Review 3 mistakes · 8 min  
> Evidence transfer · 10 min  
> Quick close · 5 min

## 14. Practice

Practice remains the manual library.

Start it with:

> **Want Chee Skool to choose?**  
> Continue today’s plan.

Manual Practice is for:
- learner curiosity;
- teacher-assigned work;
- targeted extra practice;
- repeating a specific topic.

Manual browsing should not be the default planning burden.

## 15. Skill page

Current resource columns should become a visible sequence.

### Main Idea / Central Idea
Short skill statement.

### Recommended path
1. Learn the method
2. Guided practice
3. Transfer practice
4. Skill Check
5. Review mistakes

### Offline / reference
- Study Guide
- Practice Pack

PDFs become support material rather than equal top-level choices.

## 16. Progress

Progress must answer:

1. What is improving?
2. What keeps causing trouble?
3. What should I do next?
4. What evidence is this based on?

### Above the fold
- exam countdown;
- current plan status;
- next action.

### Skill signals
Use restrained labels:
- Not enough evidence
- Developing
- More consistent
- Strong evidence

Avoid false psychometric precision.

### Repeated issues
Example:

> **Scope control** appeared in 3 recent Main Idea misses.

Action:
**Practice scope**

### GED Ready
Keep separate:

> Official GED Ready  
> 142 · Too Close to Call  
> Taken Sep 28

Do not merge it into Chee Skool’s internal score.

## 17. Resources / PDFs

Resources should become contextual.

Prefer:

> **For your current plan**
> - Main Idea Study Guide
> - Main Idea Practice Pack

Then:
> Browse all resources

Each PDF needs a declared role:
- Reference Guide
- Practice Pack
- Answer & Reasoning
- Exam Strategy
- Planning/Checklist

Do not create PDFs to increase file count.

## 18. PDF editorial identity

Chee Skool PDFs should use:
- clear Chee Skool authorship;
- source/rights line;
- consistent skill vocabulary;
- the same mistake/trap language as web;
- deliberate whitespace;
- authentic passages;
- clear page purpose;
- no generic “AI report” aesthetic;
- no filler motivation;
- answers/reasoning separated from attempt pages;
- web links/QR only for a specific next action.

Goal:

> A learner should recognize a Chee Skool PDF without needing to see the logo.

## 19. Authenticity contract

Every learner-facing claim should be identifiable as one of:

### Official fact
Example: GED Ready readiness bands.

### Chee Skool instructional strategy
Example: “Check scope before choosing a main idea.”

### Community observation
Example: learners frequently report long-passage difficulty.

### Product heuristic
Example: 8–14 days = Countdown mode.

Never present a heuristic or community tactic as an official GED rule.

## 20. Voice

Chee Skool learner copy should be:
- short;
- calm;
- specific;
- instructional;
- non-corporate;
- non-hype;
- non-judgmental.

Prefer:
> This answer is too narrow because it covers only the flooding detail.

Avoid:
> Great job! You’re crushing it!

Prefer:
> You missed yesterday. The remaining plan has been adjusted.

Avoid streak guilt.

## 21. Empty states

Bad:
> No data yet.

Good:
> **No skill evidence yet.** Complete your first practice session and Chee Skool can begin recommending what to review.

Bad:
> No mistakes.

Good:
> **Nothing is waiting for review.** Continue today’s plan or choose a skill manually.

## 22. Recommendation transparency

Every recommendation should support **Why this?**

Reason examples:
- repeated recent misses;
- review due;
- exam approaching;
- not practiced yet;
- GED Ready focus;
- Mock pacing issue;
- Skill Check follow-up;
- coverage gap.

Do not use an opaque “AI recommends this” label.

## 23. Planner data model — V1

```text
StudyProfile
  version
  examDate
  dailyMinutes
  studyDays[]
  gedReady:
    score
    takenAt
    band
  createdAt
  updatedAt

DailyPlan
  version
  date
  mode
  targetMinutes
  tasks[]
  rationale[]
  generatedFromEvidenceAt

PlanTask
  type
  skillId?
  moduleId?
  resourceId?
  estimatedMinutes
  priority
  reasonCode
  optional
  completedAt?

PlanState
  version
  lastRecalculatedAt
  lastCompletedPlanDate
  skippedDates[]
```

Version the storage structure from the first implementation.

## 24. Reason codes

Stable machine-readable reason codes:

- `repeated_skill_miss`
- `diagnostic_pattern`
- `due_review`
- `coverage_gap`
- `exam_countdown`
- `mock_pacing`
- `ged_ready_focus`
- `skill_check_followup`
- `stale_skill`
- `first_evidence_needed`

This makes recommendation behavior testable.

## 25. First-session flow

```text
HOME
  ↓
Build my study plan
  ↓
Exam date / not scheduled
  ↓
Daily minutes + study days
  ↓
GED Ready? optional
  ↓
Starting plan
  ↓
First learning/diagnostic session
  ↓
"We're beginning to learn where you need practice."
  ↓
TODAY
```

Target: first meaningful learning task within a few minutes.

## 26. Returning-session flow

```text
OPEN SITE
  ↓
TODAY
  ↓
Primary task
  ↓
Feedback / reasoning
  ↓
Review if due
  ↓
Session complete
  ↓
What changed
  ↓
Next useful action
```

## 27. Manual-learning escape hatch

Always allow:
- Browse Practice
- Choose another skill
- Skip optional task
- Reduce today’s plan
- Change exam date
- Change available study time

Recommendations should guide, not trap.

## 28. Design hierarchy

Do not start with colors or visual polish.

Validate in this order:

1. Information order
2. Label clarity
3. Primary-action clarity
4. Decision count
5. Mobile flow
6. State changes
7. Accessibility
8. Visual identity

The current human feedback mainly concerns steps 1–4.

## 29. First usability test

Do not explain Chee Skool first.

Scenario:

> Imagine your GED RLA test is in 30 days. You have about 30 minutes most evenings. Show me what you would do first.

Observe:
- first click;
- hesitation;
- whether Today makes sense;
- whether Practice vs plan is clear;
- whether Skill Check is understood;
- whether PDFs are findable;
- whether Progress is understandable;
- whether GED Ready looks separate and official.

Then:

> You missed three days. What would you do now?

Then:

> Your test is now in 10 days. What changed?

Do not begin by asking “Do you like the design?”

Ask:
- What would you do next?
- What do you think this means?
- What did you expect?
- What feels unclear?
- What would you ignore?

## 30. V1 usability success criteria

Before visual redesign:

- 4/5 first-time testers identify the starting action without coaching.
- 4/5 explain the difference between Today and Practice.
- 4/5 understand Chee Skool results are not official GED scores.
- 4/5 find the next task after a missed-day scenario.
- 4/5 understand why the plan changed near the exam.
- no tester needs Train explained as a separate product concept.
- no tester mistakes PDFs for the primary study path.

These are Chee Skool pilot thresholds, not formal industry benchmarks.

## 31. Engineering requirements before implementation

Before planner release:
- add PR CI for tests + content validation + public build;
- keep `main` deployable;
- create stable release tags;
- test local-storage migration;
- version StudyProfile / DailyPlan / PlanState;
- add planner unit tests;
- test missed-day recalculation;
- test backup/restore compatibility;
- derive dates at runtime correctly;
- keep plan logic deterministic enough to test;
- keep reason codes inspectable;
- provide a safe fallback for invalid planner state.

## 32. Do not build yet

Not yet:
- AI chat tutor as the main interface;
- social feed;
- leaderboards;
- XP economy;
- streak punishment;
- Chee Skool pass probability;
- teacher dashboard;
- account/cloud sync;
- giant onboarding tutorial;
- dozens of planner preferences;
- separate planner app;
- final PDFs before editorial design rules are stable.

## 33. Recommended implementation order

### UX-0 — Test architecture
Use a low-fidelity prototype with 3–5 learners/friends.

### UX-1 — Home / Today split
Implement first-time Home and returning Today with a manual Practice escape hatch.

### UX-2 — Study Profile
Add exam date, daily minutes, study days, optional GED Ready.

### UX-3 — Deterministic planner V1
Explicit rules + reason codes. No opaque AI planning.

### UX-4 — Progress integration
Show plan status, repeated issues, and why-next reasoning.

### UX-5 — Skill-page sequence
Turn parallel resources into guided path + offline support.

### UX-6 — Resource/PDF redesign
Only after web flow and editorial identity stabilize.

### UX-7 — Pilot
Test 10-day, 30-day, 60-day, and no-date learners.

## 34. Decision status

### Lock for V1
- “Know what to do next” as core principle.
- Exam date as a central planning input.
- Today as primary returning surface.
- Practice remains manual browse.
- GED Ready remains separate official evidence.
- Missed days trigger replanning, not backlog.
- Recommendations expose reasons.
- Resources become contextual.
- No fake pass probability.
- No heavy gamification.

### Test before locking
- exact planning thresholds;
- exact daily-minute templates;
- Home wording;
- whether exam date is the first setup question;
- whether “Today” is the best nav label;
- skill-status vocabulary;
- final-day planner behavior.

### Defer
- final visual redesign;
- final PDF design;
- AI tutor;
- cloud accounts;
- social product features.

## 35. North-star usability question

At any meaningful point in Chee Skool, a learner should be able to answer:

> **What should I do next, and why?**

If the interface cannot answer that, the design is not finished.
