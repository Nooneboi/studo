# Studo UI v2 — Phase 1 + 2

## Product direction
Studo should feel like an academic workspace, not an entertainment feed. The interface therefore uses restrained surfaces, one vivid primary color, functional status colors, limited animation, and a strong reading hierarchy.

## Typography
- UI, headings, navigation, questions, answer choices: **Inter**
- Long reading passages: **Source Serif 4**
- Default body: 16px / 1.55
- Passage: ~17px / 1.72 and user-adjustable
- Question prompt: ~17px / 1.55 and user-adjustable

## Color system
Light theme:
- Background: `#F4F6F9`
- Surface: `#FFFFFF`
- Primary ink: `#172033`
- Secondary ink: `#526074`
- Primary blue: `#3156D9`
- Primary soft: `#E8EDFF`
- Success: `#16734A`
- Warning: `#9A5B00`
- Error: `#B4233E`
- Border: `#D8DFE8`
- Highlight: `#FFF1A8`

Dark and sepia themes retain the same semantic roles rather than inventing different UI behaviors.

## Interaction rules
- Primary actions use the brand blue.
- Neutral utility actions use outlined/ghost buttons.
- Correct/wrong feedback uses color **plus** border/background changes, never color alone.
- Keyboard focus uses a visible 3px brand-color outline.
- Core controls are at least 40px tall; answer choices are at least 52px tall.
- Animation is minimal and disabled when `prefers-reduced-motion` is enabled.

## Practice workspace
Desktop:
- Left: sticky reading passage.
- Right: one question at a time.
- The student always sees progress, previous/next, and the active answer area.
- Notes and reset are secondary actions.
- Drawing, print, copy, and sharing are in the `Tools` menu.
- Per-question time values are suggestions only; Practice no longer runs distracting countdowns.

Mobile:
- Passage and question stack vertically.
- Question navigation stays easy to reach.
- Content uses the full useful width without becoming edge-to-edge.

## Timed test workspace
- Same visual language as Practice so the student does not need to relearn the interface.
- One question at a time.
- Relevant passage changes with the active question.
- Timer remains visible but visually quiet until the final minute.
- Explanations stay hidden until submission.
- Test answer keys use `moduleId:questionId` internally to avoid collisions across modules.
- Written responses are excluded from the auto-graded denominator instead of being treated as wrong.

## File changes
- `css/studo-v2.css`: new design-system and workspace layer.
- `module.html`: simplified focus toolbar and secondary Tools menu.
- `test.html`: simplified focus toolbar and timer placement.
- `js/module.js`: single-question practice flow and cleaner practice feedback.
- `js/test.js`: single-question test flow, collision-safe answer keys, improved scoring.
- `sw.js`: cache version bumped and v2 stylesheet added.

## Next cleanup
After the v2 look is approved, consolidate the older `css/style.css` rules into smaller final files and remove superseded focus-mode rules. The separate v2 layer is intentional for this phase so the redesign can be tested without breaking older pages.
