# Phase 4G — Resource-first Practice

## Product decision

Studo no longer treats every learner activity as an interactive web question set.

The learner model is now:

- **Practice**: find a skill and open study material such as PDF guides, worksheets, notes, references, DOCX files, or external links.
- **Check yourself**: optional interactive question sets using the existing module engine.
- **Quiz / Test**: exam-style assessment.
- **Train Me**: adaptive retrieval/review using interactive question sets.
- **Progress**: records evidence from interactive activity inside Studo.

This preserves the existing skill registry, curriculum taxonomy, validator, compiler, Train Me logic, and assessment engine. The main change is that study files become first-class curriculum assets.

## Learner navigation

Practice → Track → Domain → Skill

The Practice homepage also supports skill search.

A skill page contains two separate sections:

1. **Study material** — downloadable/openable files and references.
2. **Check yourself** — optional interactive checks.

Interactive sets are no longer presented as the default definition of practice.

## Resource registry

Study material belongs in:

`content-src/resources/rla.resources.json`

Local files can live in:

`assets/resources/`

Example:

```json
{
  "id": "res-rla-main-idea-guide-v1",
  "title": "Main Idea — Quick Study Guide",
  "type": "pdf",
  "skillIds": ["R1.2"],
  "href": "assets/resources/main-idea-study-guide.pdf",
  "download": true,
  "status": "published",
  "reviewer": "Reviewer name",
  "rightsStatus": "original"
}
```

External resources may use an `https://...` href. Studo opens those in a new tab.

Supported resource types in the validator:

- `pdf`
- `worksheet`
- `study_guide`
- `notes`
- `reference`
- `docx`
- `link`

## Backend compatibility

The backend is not replaced.

Generated curriculum skills now expose both:

- `studyResources` / `studyFileCount`
- `checks` / `checkCount`

Legacy aliases (`resources`, `sets`) remain during migration so existing code does not break.

## Validation

The validator now checks resource IDs, file types, status, attached skill IDs, file paths, and local file existence for published resources.
