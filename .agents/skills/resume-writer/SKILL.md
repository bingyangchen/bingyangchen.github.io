---
name: resume-writer
description: >-
  Maintain this site's resume content, layout, and browser-printed PDF with a
  recruiter and hiring-manager perspective. Use when drafting or reviewing resume
  copy, tailoring it to a role, or changing resume styling and print behavior.
---

## Project Sources

Follow [the site design context](../../../docs/design.md) for audience, tone, and visual direction. Paths below are relative to the repository root; inspect only sources relevant to the task:

- `src/pages/Main/Resume/ResumeSheet.tsx`: English resume content, maintained separately from the site's dictionaries.
- Shared facts: `src/data/workExperience.ts`, both `src/i18n/dictionaries/en.ts` and `src/i18n/dictionaries/zhtw.ts`, and `src/pages/Main/Home/Home.tsx`. For skill or project claims, also check `src/data/skills.ts` or `src/data/projects.tsx` and their dictionary entries.
- Layout and printing: `src/pages/Main/Resume/ResumeSheet.module.scss`, `src/print.scss`, and `src/resume/print.ts`.

## Facts and Editorial Decisions

- Cross-check shared facts against the sources and user-supplied evidence. Existing copy does not independently verify a claim, and neither dictionary takes precedence when they disagree. Ask the user about contradictions the evidence cannot resolve.
- Preserve supported seniority, ownership, scope, and attribution; request missing evidence for metrics or stronger claims.
- Keep common facts consistent across resume, website, and languages while allowing different accomplishments, wording, and detail. Respect the requested editing scope.
- Preserve the resume's language unless a language change is requested.
- For tailoring, select accomplishments and truthful keywords for the target role or job description. General maintenance does not require a job posting.
- Write concise bullets connecting action, scope, and outcome; put the strongest relevant evidence first.

## Layout and Format

- Preserve A4 unless the user requests a format change. The current print CSS caps height and hides overflow, so added content can be silently clipped. Edit for relevance and spacing before shrinking text; discuss a format change if readability cannot be maintained.
- Keep key information as selectable text, with conventional headings and logical reading order. Prefer a single column for ATS submissions; appearance and successful text extraction alone do not establish ATS compatibility.

## Validation

After changes to resume content, layout, or print behavior:

1. Inspect the sheet on screen and export through the browser print flow at the intended paper size. Check the PDF for page count, clipping, missing content, wrapping, spacing, font rendering, and readability.
2. Check extracted or copied text for completeness and reading order, and verify PDF contact and social links.
3. The homepage export and `/resume` share `ResumeSheet`. Check both entry points when shared print behavior changes; copy-only edits require inspecting the exported sheet, without unrelated navigation checks.

Use available PDF tooling for inspection. If export or inspection is unavailable, report the limitation and remaining checks. Guidance-only edits to this skill do not require PDF export.
