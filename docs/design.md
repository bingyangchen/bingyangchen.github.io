# Site Design Context

This document records the site's product and design direction. Engineering instructions and task-specific skills live in [AGENTS.md](../AGENTS.md).

## Purpose and Audience

[Bing-Yang Chen's personal site](https://byc1999.com/) presents professional background, selected side projects, and links to GitHub and the [external blog](https://blog.byc1999.com/). Recruiters, peers, and potential collaborators should be able to assess experience and work samples quickly.

Keep the site focused on one person's professional story. Long-form writing belongs on the external blog; adding an in-app publishing system requires an explicit product decision.

## Main Experience

* `/` is the main scrolling page, organized into Home, About, Projects, and Blog. About covers work experience, skills, and education; Projects provides work samples and details; Blog leads to the external publication.
* Keep contact and social links, language selection, and resume export easy to find. The resume is also available at `/resume`, with PDF export through browser printing.

## Language and Copy

The main site supports English and Traditional Chinese, using a saved preference or otherwise the browser language. Copy lives in `src/i18n/dictionaries/en.ts` and `src/i18n/dictionaries/zhtw.ts`. The resume has separate English content.

* Experience and education copy should be direct, professional, and specific about scope and outcomes. Distinguish personal projects from production work.
* Projects and Blog may use a warmer, open, curious tone while keeping claims concrete.
* Preserve shared facts across languages while allowing natural phrasing and different levels of detail. Chinese copy should use natural Traditional Chinese wording consistent with the existing site.
* External links should identify their destination or action. Keep GitHub, company, school, project demo, and blog journeys clear.

## Visual Direction

Maintain a calm, professional presentation with readable hierarchy and restrained accents.

* **Palette:** Neutral backgrounds and dark text, with olive as an accent. In `src/_global_variables.scss`, `$theme-color` is the dark primary color and `$brand-olive` is the accent.
* **Typography:** Geneva/sans-serif for body and UI text; Georgia/Times/serif for established section titles and subtitles. Preserve the existing hierarchy and spacing rhythm.
* **Layout:** Keep sections distinct and reading widths comfortable. Adapt composition to the viewport and the surrounding layout.

## Interaction and Motion

Motion should support reading and navigation, with a clear purpose and respect for reduced-motion preferences.

* Preserve section navigation, predictable URL hash updates, and browser history behavior.
* Keep navigation, contact actions, and project details usable on smaller screens and with keyboard input.
* Project details need an obvious dismiss action and clear focus behavior.
* Provide immediate feedback for navigation and toggles, with visible keyboard focus and comfortable touch targets.
