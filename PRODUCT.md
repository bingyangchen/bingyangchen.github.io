# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Product Purpose

Bing-Yang Chen's personal website introduces the author to recruiters, technical peers, potential collaborators, and other visitors. The authoritative site context remains [docs/design.md](docs/design.md); this file provides a compact product entry point for design exploration.

## Capabilities and Constraints

The main page introduces the author, professional background, selected projects, writing, and contact destinations in English and Traditional Chinese. It provides a downloadable English resume PDF. Long-form writing lives on the external blog. The site is a static React and TypeScript frontend deployed to GitHub Pages.

## Product Principles

- The website introduces a person through narrative and experience. The downloadable resume provides the detailed, itemized record of career achievements.
- About uses a short interview and photographs to introduce the author in the context of the rest of the homepage.
- Facts, career history, degree names, destinations, and performance claims must remain traceable to existing site data or the author's explicit statements.
- The work interview pairs selected employers with the products the author helped build. Visitors can learn the range of the work here and find detailed accomplishments in the resume.

## Evidence on Hand

Career facts and profile data live in `src/data/`. The bilingual interview copy lives in `src/i18n/dictionaries/` and the English resume lives in `src/features/resume/ResumeSheet.tsx`. The author supplied ten photographs in `src/assets/about/photography/`. The interview displays four of them, using web derivatives in `src/assets/about/web/`. The first chapter covers the shift from economics to programming. The last names psychology, calligraphy, and photography.

## Operating Context

Changes follow the repository's SDD workflow. Current site behavior and verification criteria are in [the site spec](docs/specs/site.md).
