# Phase 5A — Progress refinement + Resource Studio

## Progress page

The Progress page now uses a compact workspace layout:

- sticky left shortcut rail
- four compact metrics
- one review block
- one next-skill block
- a table-like Skills section
- a plain Review list

Long explanatory paragraphs and decorative dashboard blocks were removed.

## Resource Studio

Open:

`resource-studio.html`

or run the normal local Studio server and visit:

`http://localhost:4173/resource-studio.html`

Resource Studio can attach these resource types to RLA skills:

- PDF
- worksheet
- study guide
- notes
- DOCX
- reference
- external link

When the Studo project folder is connected in Chrome/Edge, a selected local file is copied to:

`assets/resources/`

and its metadata is added to:

`content-src/resources/rla.resources.json`

The existing validator/build pipeline remains unchanged. Run:

`npm.cmd run content:check`

on Windows PowerShell if the PowerShell npm wrapper is blocked.
