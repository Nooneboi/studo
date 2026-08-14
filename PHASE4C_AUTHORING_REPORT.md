# Studo Phase 4C — Authoring Workflow

## Goal

Make Phase 4 content comfortable to author without turning generated learner JSON back into the editing surface.

## New authoring routes

### Content Studio — direct source authoring

Run:

```bash
npm run studio
```

Open:

```text
http://localhost:4173/content-studio.html
```

Content Studio supports:

- passage/source metadata
- rights metadata
- question-set metadata
- RLA skill registry dropdowns
- difficulty and DOK
- question families
- difficulty-profile dimensions
- selected-response answer editing
- distractor types
- why-wrong rationales
- concise correct-answer explanations
- learner-content preview
- browser-side quality checks
- source JSON import
- direct save into `content-src/passages/` and `content-src/sets/` through the File System Access API when available
- JSON-download fallback when direct folder access is unavailable

The direct-save flow verifies that the chosen folder contains `package.json` and `content-src/` before using it as the project root.

### Authoring Workbook — bulk planning/review

`authoring/STUDO_RLA_AUTHORING_WORKBOOK_V1.xlsx`

Sheets:

- Start Here
- Passages
- Questions
- Options
- Review Queue
- Lists

The workbook provides dropdowns for stable skill IDs, difficulty, DOK, status, rights, question type, and distractor type.

The workbook is deliberately not the production source of truth. It is a batch planning/editorial tool. Production content remains in `content-src/` so all published assets pass the same validator/compiler.

## Existing pipeline remains unchanged

After saving source files:

```bash
npm run content:check
```

Final Phase 4C verification:

- JavaScript syntax: pass
- local authoring HTTP server: pass
- content validation: 0 errors
- current known transfer warnings: 2
- generated Phase 4 modules: 5
- runtime index entries: 6

## Important deployment note

Content Studio and `content-src/` are authoring assets, not learner features. A later deployment build should publish a clean learner-only `dist/` directory instead of exposing the whole working repository. This should be handled before a production release.
