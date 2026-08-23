# Chee Skool 0.7.0-alpha.5 — Release Hardening Report

**Date:** 2026-08-23  
**Stage:** Alpha candidate  
**Public alpha gate:** Disabled pending real-browser/device QA and small learner pilot

## Executive verdict

Chee Skool has moved from a pre-alpha content/UI build to a technically hardened RLA alpha candidate. The remaining release risk is now mostly **real-browser/device behavior and learner validation**, not known content-validation debt or broken source packaging.

This build is suitable for a controlled browser QA pass. It should **not** be promoted as an official GED product or widely released until the manual QA gate and small learner pilot are completed.

## What changed in this hardening pass

### Resources presentation

- Removed repetitive divider lines between individual resource-topic rows.
- Kept stronger visual separation for major sections and column structure.
- Preserved the desktop right-side search layout and responsive mobile layout.

### Content-depth warnings resolved

The previous 10 validator warnings were resolved with targeted content rather than suppressing checks:

- Added two original Reading transfer passages covering:
  - implied cause/effect;
  - connotation;
  - tone;
  - structure/effect;
  - author point of view.
- Added an ER transfer/revision check covering:
  - W1.8 Organization;
  - W1.9 Development;
  - W1.10 Revision for focus/clarity;
  - W1.11 Editing conventions.
- Added additional R5.4 Evidence relevance coverage.

Current content validation: **0 errors, 0 warnings**.

### Current learning-bank scale

- Generated learner modules: **95**
- Generated objective/component questions: **702**
- Question types:
  - multiple choice: **606**
  - grammar edit: **91**
  - evidence based: **3**
  - fill blank: **1**
  - open ended: **1**
- Passage Practice sets: **26**
  - informational: **19**
  - literary: **7**
  - word-count range: **407–723**
  - 600+ word stamina passages: **5**
- Learner Resources library: **151 unique resources across 44 learner topics**
- Learner PDF files: **159**

The Passage Practice mix is about **73% informational / 27% literary**, close to GED Testing Service's published 75%/25% design guidance. All Passage Practice texts remain inside the published 400–900 word reading-passage range.

## Academic review

### Reading & Comprehension — strong alpha baseline

Strengths:

- Covers explicit meaning, main idea, supporting details, inference, cause/effect, comparison, conclusions, vocabulary/context, connotation, tone, structure, purpose, POV, and evidence-linked reasoning.
- Passage length is controlled.
- Informational/literary balance is close to official published GED guidance.
- Transfer-family coverage no longer depends on a single example for the five previously flagged families.
- Automated checks protect against answer-pattern runs and generic feedback overuse.

Remaining Beta-level opportunity:

- Continue widening contexts rather than increasing question count indiscriminately.
- Add more authentic technology-enhanced interactions when the UI supports them reliably.

### Arguments & Sources — strong alpha baseline

Strengths:

- Nine learner units cover claims, evidence, support, reasoning, assumptions, credibility, counterarguments, source comparison, text/data, and synthesis.
- Evidence relevance now reaches the minimum hardening target instead of remaining a low-coverage skill.
- Mixed-source practice and focused units are separately tested.

### Language & Editing — strong alpha baseline

Strengths:

- Seven learner units.
- Six mixed editing passages in the 350–450 word design range.
- 91 grammar-edit interactions provide more contextual editing practice than stand-alone grammar drills.
- Coverage includes usage, agreement, pronouns, modifiers, parallelism, concision, transitions, boundaries, punctuation, capitalization, and possessives.

### Extended Response — good/strong alpha baseline

Strengths:

- Eight original paired-source prompts.
- Timed 45-minute and untimed modes.
- Autosave, planner, source tabs, revision flow, word count, and three-trait self-review.
- No invented official scaled score.
- The four previously low-coverage revision/organization objective skills now have at least four canonical questions each.

Remaining Beta-level opportunity:

- Learner performance on real essays must guide the next refinement; automated official-equivalent essay scoring is deliberately not claimed.

### Mock/Test — structurally strong, interaction parity incomplete

Strengths:

- 46-objective-question full blueprint plus ER.
- Section timing, break, resume/recovery, flags, review, raw/domain/skill results, and post-test answer review.
- 100 seeded mock generations are regression-tested for blueprint integrity.

Known limitation:

- GED Testing Service publicly documents multiple-choice plus technology-enhanced interactions such as drag/drop, select-area, and drop-down formats. Chee Skool currently relies mostly on multiple choice and grammar-edit/dropdown interactions. This is acceptable for a learning alpha, but it is not full interface parity with the official exam.

## Learner-experience review

### Navigation and discovery

Status: **Strong**

- Consistent Home / Practice / Train / Mock / Progress / Resources navigation.
- "Mock" terminology is consistent in learner-facing navigation.
- Practice search and Resources search use learner-facing unit/topic labels.
- Passage Practice is separated from focused skill pages and grouped by context.
- Invalid curriculum routes do not silently fall back to unrelated Reading content.

### Resources

Status: **Strong after this pass**

- Main sections remain visually structured.
- Individual topic rows no longer look like a dense spreadsheet because repetitive horizontal dividers were removed.
- 151 unique curriculum resources are rendered once each by the library model.

### Progress / Train Me

Status: **Strong alpha baseline**

- Objective mastery, confidence, mistakes, and review signals remain distinct from official GED scores.
- ER self-review and Mock history stay separate from objective skill mastery.
- Empty-history shortcuts are not rendered as dead links.
- Backup filename and learner-facing copy use Chee Skool branding.

## Practice Tools review

### Notes

- Per-question notes autosave locally.
- UI explicitly says notes are saved on the device.
- Notes are cleared only when the learner confirms Reset this practice.

### Highlighting

- Passage and question highlights persist locally.
- Restored highlight markup is sanitized against the original text and a strict element/class allowlist.
- Clicking a saved highlight while highlight mode is active removes it.

**Manual gate:** real touch-selection behavior still needs iPhone/Android testing. Desktop source wiring is present, but touch text-selection quality cannot be certified statically.

### Text size

- Stored locally.
- Clamped to safe minimum/maximum values.
- A-/A+ controls disable at limits.

### Reset

- Confirmation is required.
- Clears current-practice answers, notes, and highlights without pretending to erase historical learning evidence.
- This pass also clears transient confidence-button state so a reset does not visually reuse an old confidence choice.

### Copy / Share / Print

- Copy uses modern Clipboard API with fallback and visible failure feedback.
- Share uses the native share sheet when available, otherwise copies the current link.
- Print closes the Tools menu before printing.

**Manual gate:** clipboard permission behavior, native Share, and actual print preview must be tested on the deployed site.

### Tools menu accessibility

- Escape closes the disclosure and returns focus.
- Clicking outside closes the menu.
- Tool rows have touch-friendly sizing.
- Status feedback uses a polite live region.

## Accessibility/static-quality review

Fresh learner-only artifact audit:

- Learner HTML pages audited: **18**
- Static structural issues: **0**
- Missing local static dependencies: **0**
- Duplicate IDs found: **0**
- Images missing alt text: **0**
- Static form controls missing labels: **0**
- Unsafe `javascript:` URLs: **0**
- `target="_blank"` links missing `noopener`: **0**
- First-party JS/MJS syntax files checked: **39**
- JS/MJS syntax failures: **0**

Still requires a real-browser accessibility pass for keyboard flow, 200% zoom, screen-reader announcements, responsive stress cases, and touch interactions.

## Security and privacy review

Strengths:

- Static learner architecture; no Chee Skool learner account/database in Alpha.
- Learner answers/history/notes/highlights remain local to the browser.
- No third-party script tags in the public learner build.
- No absolute external API/network calls found in learner JS.
- No `eval()` / `new Function()` dynamic execution found in learner JS.
- Restrictive Content Security Policy and no-referrer policy are present on learner pages.
- Saved highlight HTML is sanitized before restoration.
- Practice return links are now URL-parsed and constrained to the current origin/protocol rather than relying on a small blacklist of dangerous schemes.
- Internal authoring tools are excluded from the public artifact.

External dependency:

- The UI loads Inter and Source Serif 4 from Google Fonts. The Privacy page discloses this. There are no analytics/advertising script dependencies in the learner artifact. A later privacy/offline refinement could switch to system fonts, but that is not an Alpha blocker.

## PDF review

- PDFs checked: **159**
- PDFs still containing old Studo branding: **0**
- PDFs containing Chee Skool branding: **159**
- Unreadable PDFs in verification pass: **0**

Three representative PDFs (Reading, Arguments, Extended Response) were re-rendered and visually inspected after true text redaction/replacement. The changes remained localized to branding/attribution areas, with no sampled clipping or overlap.

## Public deployment boundary

A new `npm run public:build` step creates a learner-only `dist/` artifact.

Verified public artifact:

- generated modules: **95**
- learner PDFs: **159**
- internal authoring surfaces found: **0**
- service-worker app-shell references missing: **0**

Excluded from public deployment include:

- `builder.html`
- `content-studio.html`
- `resource-studio.html`
- `content-src/`
- `authoring/`
- `scripts/`
- development documentation/configuration

The repository now contains a GitHub Pages Actions workflow that tests, validates, builds `dist/`, uploads only that Pages artifact, and deploys it. GitHub Pages must be configured with **Source = GitHub Actions** rather than branch-root deployment.

## Automated release evidence

Fresh final run on this exact candidate:

- automated tests: **84 passed / 0 failed**
- content validation: **0 errors / 0 warnings**
- generated learner modules: **95**
- JS/MJS syntax: **39 checked / 0 failures**
- public HTML static audit: **18 pages / 0 issues**
- public forbidden internal files: **0**
- public PDFs: **159**
- PDF old-brand findings: **0**

## What is not yet verified

This environment could not complete reliable Chromium interaction automation against the local site. Therefore this report does **not** certify:

- real touch selection/highlighting;
- native share-sheet permissions;
- clipboard permission variations;
- real print preview/output;
- screen-reader quality;
- service-worker update behavior in an already-cached production browser;
- production GitHub Pages path behavior;
- two-tab/back-button edge cases on a real browser.

## Release decision

**Recommended status: Alpha Candidate — proceed to real-browser QA.**

Do not turn on the public-alpha gate yet.

### Next gate

1. Push the full source candidate through GitHub Desktop.
2. In GitHub repository Settings -> Pages, set Source to GitHub Actions.
3. Confirm the Pages workflow passes.
4. Test the deployed URL in desktop Chrome/Edge.
5. Test a real phone.
6. Complete one full Mock and one ER attempt including refresh/resume.
7. Test Notes, Highlight, A-/A+, Copy, Share, Print, Reset.
8. Test 200% zoom and keyboard-only navigation.
9. If those pass, run a small 3–5 learner pilot with minimal guidance.
10. Fix high-impact issues discovered by learners before broader sharing.

## Reference baseline used for academic/deployment review

- GED Testing Service, **Reasoning Through Language Arts test subjects / curriculum**: public format lists three sections, one Extended Response, approximately 150 minutes, and multiple-choice plus technology-enhanced item types.
- GED Testing Service, **Assessment Guide for Educators: RLA**: public guidance describes 400–900 word reading passages, approximately 75% informational / 25% literary text, and technology-enhanced items.
- GitHub Docs, **Using custom workflows with GitHub Pages** and **Configuring a publishing source**: public guidance supports building and deploying a generated static artifact through `configure-pages`, `upload-pages-artifact`, and `deploy-pages` with GitHub Actions.
