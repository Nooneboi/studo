# Studo learner resources

Studo can attach files and external learning resources to any curriculum skill.
The learner-facing `domain.html` page will place them beside web practice.

Put locally hosted files in `assets/resources/` and register them in:

`content-src/resources/rla.resources.json`

Example PDF entry:

```json
{
  "id": "res-rla-main-idea-guide-v1",
  "title": "Main Idea — Quick Study Guide",
  "type": "pdf",
  "skillIds": ["R1.2"],
  "description": "A short printable guide with examples and a checklist.",
  "href": "assets/resources/main-idea-study-guide.pdf",
  "download": true,
  "status": "published"
}
```

Supported learner-facing types currently include:
- `pdf`
- `worksheet`
- `study_guide`
- `notes`
- `reference`

The resource itself does not have to be created inside Studo. It may be authored as
a PDF, worksheet, or other file and then attached to the relevant skill.
