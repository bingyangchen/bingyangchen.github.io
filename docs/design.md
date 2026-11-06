# Site Design Context

This document records the site's product and design direction. Detailed behavior lives in the [site spec](specs/site.md); engineering instructions and task-specific skills live in [AGENTS.md](../AGENTS.md).

## Purpose and Audience

[Bing-Yang Chen's personal site](https://byc1999.com/) presents professional background, selected side projects, and links to GitHub and the [external blog](https://blog.byc1999.com/). Recruiters, peers, and potential collaborators should be able to assess experience and work samples quickly.

Keep the site focused on one person's professional story. Long-form writing belongs on the external blog.

## Main Experience

- `/` is the main scrolling page, organized into Home, About, Projects, and Blog.
- About covers work experience, skills, and education.
- Projects emphasizes each product's purpose and real interface imagery, with consistent neutral staging.
- Blog introduces the author's thinking through one featured article and two additional reading selections, with a clear route to the full external publication. Keep long-form reading on GitBook.
- Keep contact and social links, language selection, and resume export easy to find.
- Keep the primary navigation available throughout the page and make the current section recognizable.
- Offer public resume export from the main page; keep `/resume` as a non-public preview.

## Language and Copy

The main site supports English and Traditional Chinese and respects the visitor's language preference. The resume remains in English.

Language selection remains available when browser storage is blocked. Keep the visitor's choice for the current page without showing a storage warning; on reload, use a readable saved preference or the browser language.

- Experience and education copy should be direct, professional, and specific about scope and outcomes. Distinguish personal projects from production work.
- Projects and Blog may use a warmer, open, curious tone while keeping claims concrete.
- Preserve shared facts across languages while allowing natural phrasing and different levels of detail. Chinese copy should use natural Traditional Chinese wording consistent with the existing site.
- Blog selections retain their original article titles. Localize the surrounding summaries and actions. In the English interface, identify the primary writing language before visitors choose an article.
- External links should identify their destination or action. Keep GitHub, company, school, project demo, and blog journeys clear.

## Visual Direction

Maintain a calm, professional presentation with readable hierarchy and restrained accents.

- **Palette:** Neutral backgrounds and dark text, with olive as an accent.
- **Typography:** Geneva/sans-serif for body and UI text; Georgia/Times/serif for established section titles and subtitles. Preserve the existing hierarchy and spacing rhythm.
- **Shared section scale:** Projects and Blog use the same responsive container spacing, section titles, introductory text, metadata, and equivalent external-link sizes. Preserve each section's content hierarchy.
- **Layout:** Keep sections distinct and reading widths comfortable. Align the header with the page's centered content bounds while allowing full-width surfaces. Adapt composition to the viewport and the surrounding layout.
- **Navigation:** Use the existing logo, readable mixed-case labels, and restrained indicators. A softly translucent, blurred header lets the white and gray page backgrounds show through while preserving foreground contrast. Keep separators subtle. Use solid surfaces for the expanded compact menu or when needed for accessibility.

## Interaction and Motion

Motion should support reading and navigation, with a clear purpose and respect for reduced-motion preferences.

- Keep section navigation and browser history predictable, and preserve focus continuity.
- Keep navigation, contact actions, and project details usable on smaller screens and with keyboard input.
- Keep the viewport configured to disable user scaling.
- Provide immediate feedback for navigation and toggles, with visible keyboard focus and comfortable touch targets.
- Links using `IconArrowUpRight` share the same subtle arrow movement when the link is hovered. Disable that movement when reduced motion is requested.

The main page uses clearly perceptible, reversible motion tied to scroll position. Content unfolds across the lower half of the viewport, stays still and fully readable through the reading area, and recedes toward the top. Scrolling back retraces the same motion without a replay delay. Project imagery carries the strongest depth effect through scale, tilt, and layered movement; professional history uses a drawing timeline and grouped entrances, while article text settles into a stable reading position. Keep primary navigation and project controls stable, preserve native scrolling, and show complete static content when reduced motion is requested. Greetings appear in full and skills remain available in a wrapping list without timed animation.
