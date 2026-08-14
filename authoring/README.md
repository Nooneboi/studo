# Studo Authoring Workflow — Phase 4C

## Single passage / question set

1. Run `npm run studio` from the project folder.
2. Open `http://localhost:4173/content-studio.html`.
3. Connect the project folder if your browser supports the File System Access API.
4. Author the passage and question set.
5. Run the built-in Quality Check.
6. Save source files. They go into `content-src/passages/` and `content-src/sets/`.
7. Run `npm run content:check`.

If direct folder access is unavailable, Content Studio downloads the two JSON source files instead.

## Bulk planning and editorial review

Use `STUDO_RLA_AUTHORING_WORKBOOK_V1.xlsx` to plan passages, questions, options, and editorial review in batches. The workbook contains dropdowns for skills, difficulty, DOK, status, distractor type, rights status, and question type.

The workbook is not the production database. Production source of truth remains `content-src/` so every published item passes the same validator/build pipeline.

## Publishing rule

Never hand-edit `data/generated/`. Generated learner content is rebuilt from the Phase 4 source files.
