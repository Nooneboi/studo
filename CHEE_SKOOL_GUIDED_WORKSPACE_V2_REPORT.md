# Chee Skool Guided Learning Workspace V2 Report

**Release:** `0.7.0-alpha.7`  
**Reference title:** Reading → Core Meaning → Main Idea / Central Idea → Main Idea - Active Learning Path

## Why V2 was needed

Alpha 6 proved the interaction engines worked, but the first learner-facing layout created too much interface work: repeated sorting controls, unclear Select Text affordance, long operational wording, visible confidence before a response, and a question pane that felt like one dense central block.

V2 keeps the answer/scoring/storage engines and replaces the guided Practice presentation with the rule:

> **One task. One obvious action. One place to look.**

## Main Idea learning flow

The six questions now use an explicit support progression:

1. **Guided** — classify central information vs supporting context, one statement at a time.
2. **Guided** — select the sentence that states the lesson from the first measurements.
3. **Apply** — identify the central idea with clean multiple choice.
4. **Apply** — classify one candidate main idea at a time as too narrow, too broad, or fitting the passage.
5. **Independent** — select the strongest evidence for a qualified whole-passage idea.
6. **Independent** — choose the qualified central idea from close distractors.

Difficulty rises through reasoning depth, evidence distance, and distractor similarity. The controls do not become harder merely because the question is harder.

## Learner-facing changes

### Reading pane

- Shows the real passage title **A Shadier Route to Transit** rather than repeating the module title.
- Removes the long module description from the repeated working view.
- Keeps passage/topic metadata quiet.
- Keeps the passage as the stable visual anchor.

### Task pane

- Starts from the top-left rather than visually centering a dense block.
- Uses `N of 6 · GUIDED/APPLY/INDEPENDENT` as the quiet progress/stage line.
- Uses shorter direct prompts and at most one helper line.
- Hides hints behind **Need help?**.
- Hides confidence until a complete response exists.
- Places confidence before the final **Check answer** action.
- Guided questions allow one retry before full explanation is revealed.
- Independent questions expose no pre-answer hints.

### Single-card sorting

Alpha 6's board has been removed from active-learning Practice. Guided sorting now shows:

- one statement card;
- one set of category choices;
- compact item progress;
- a Back control to revise earlier cards;
- Check answer only after all cards are classified.

Dragging is optional. Clicking/tapping a category is always available and keyboard-compatible.

### Select Text

Select Text now visibly changes the passage into an answer state:

- a **Selection mode** bar appears above the passage;
- only authored candidate sentences receive a soft blue answer treatment;
- hover/focus/touch states are visible;
- selected text receives a stronger state;
- the task pane reports the selection count;
- the redundant Alpha 6 instruction block is gone.

This answer treatment remains visually distinct from Chee Skool's freeform highlighting tool.

## Content changes

The content schema and compiler now preserve optional:

- `learningStage`: `guided | apply | independent`
- `hint`: authored hint text

The Main Idea reference set is still tagged:

- `active-learning`
- `mock-excluded`

so these interactions remain outside randomized Mock until real-device QA is complete.

## What V2 deliberately did not change

- Mock/Test V1 was not redesigned.
- No new question type was added.
- Existing strong RLA content was not mass-converted to interactive formats.
- Drag-order was not forced into Main Idea.
- No XP, streak pressure, animations, confetti, mascots, or decorative learning chrome was added.
- Other titles have not yet been converted to active-learning paths.

## Verification

Fresh release-gate results for `0.7.0-alpha.7`:

- **108 / 108 automated tests passed**
- **0 content errors**
- **0 content warnings**
- **65 source JS/MJS files syntax-checked, 0 failures**
- **22 learner-public JS/MJS files syntax-checked, 0 failures**
- learner-only public build completed
- public build contains `module.html`, `test.html`, `js/module.js`, `js/question-interactions.js`, and the Main Idea reference module
- public build excludes `builder.html`, `content-studio.html`, and `resource-studio.html`

## Remaining real-device QA

Automated/static verification cannot replace interaction testing. Before removing `mock-excluded`, manually test:

- mouse drag and click classification;
- phone tap classification;
- keyboard category selection;
- Back/revision inside the sorter;
- partial-sort refresh recovery;
- Select Text on desktop and phone;
- selection visibility in Light, Dark, and Sepia;
- confidence reveal timing;
- Guided retry behavior;
- 200% browser zoom;
- text-size A− / A+;
- Tools/highlighting interaction during Select Text;
- narrow-screen scrolling and footer behavior.

A local Chromium screenshot attempt was also made during this pass, but Chromium did not complete rendering in the execution environment. Therefore visual browser certification remains a manual QA item rather than a claimed automated result.
