# Site Design Context

This document records the site's product and design direction. Detailed behavior lives in the [site spec](specs/site.md); engineering instructions and task-specific skills live in [AGENTS.md](../AGENTS.md).

The [local design system](../src/styles/README.md) documents the shared tokens, styling patterns, and controls that implement this direction. Shared tokens and global screen and print styles live in `src/styles/`; component styles remain co-located, while artwork composition and resume print geometry retain their contextual rules.

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
- Offer the same prebuilt English A4 resume PDF from the main page on all screen sizes; keep `/resume` as a non-public preview with browser printing.

## Language and Copy

The main site supports English and Traditional Chinese and respects the visitor's language preference. The resume remains in English.

Use the Header to change languages; close the QR code dialog before switching. Reopening it uses the current language.

Language selection remains available when browser storage is blocked. Keep the visitor's choice for the current page without showing a storage warning; on reload, use a readable saved preference or the browser language.

- Experience and education copy should be direct, professional, and specific about scope and outcomes. Distinguish personal projects from production work.
- Projects and Blog may use a warmer, open, curious tone while keeping claims concrete.
- Preserve shared facts across languages while allowing natural phrasing and different levels of detail. Chinese copy should use natural Traditional Chinese wording consistent with the existing site.
- Blog selections retain their original article titles. Localize the surrounding summaries and actions. In the English interface, identify the primary writing language before visitors choose an article.
- External links should identify their destination or action. Keep GitHub, company, school, project demo, and blog journeys clear.

## Visual Direction

Maintain a calm, professional presentation with readable hierarchy and restrained accents.

- **Palette:** Neutral backgrounds and dark text, with olive as an accent. Use a dedicated olive action color with white text for brand buttons, visually coordinated with the portrait. Keep the resume action label at the body UI scale with normal tracking so it stays clear without overpowering the card. Preserve a distinct lighter text color for dates and other supporting information. Choose the lightest neutral gray that maintains at least 4.5:1 contrast on the existing white and light gray surfaces; reserve paler gray for decoration. Use dark olive for text and action icons on light surfaces, including hover states.
- **Consistency:** Equivalent roles and surfaces share visual rules. Vary color or treatment when contrast, hierarchy, or layout gives the difference a purpose.
- **Typography:** Geneva/sans-serif for body and UI text; Georgia/Times/serif for established section titles, subtitles, and the Footer, using the same serif family and fallback order. Preserve the existing hierarchy and spacing rhythm.
- **Shared section scale:** Projects and Blog use the same responsive container spacing, section titles, introductory text, metadata, and equivalent external-link sizes. Preserve each section's content hierarchy.
- **Layout:** Keep sections distinct and reading widths comfortable. Align the header with the page's centered content bounds while allowing full-width surfaces. Adapt composition to the viewport and the surrounding layout.
- **Navigation:** Use the existing logo, readable mixed-case labels, and restrained indicators. A softly translucent, blurred header lets the white and gray page backgrounds show through while preserving foreground contrast. Keep separators subtle. Use solid surfaces for the expanded compact menu or when needed for accessibility.

## Interaction and Motion

Motion should support reading and navigation, with a clear purpose and respect for reduced-motion preferences.

- Keep section navigation and browser history predictable, and preserve focus continuity.
- Let the Hero card grow with its content and use page scrolling on short screens. Keep the card still and fully opaque until the bottom of the Hero has entered the viewport, then apply its reversible exit motion.
- Keep navigation, contact actions, and project details usable on smaller screens and with keyboard input. Focus preserves the scroll-driven position, scale, tilt, and opacity, including partially entered or exited content.
- Keep body text selectable and copyable through native browser interactions, including descriptions inside article links. Keep buttons, navigation, and action labels unselectable.
- Keep the viewport configured to disable user scaling.
- Provide immediate feedback for navigation and toggles, with visible keyboard focus and comfortable touch targets.
- Hover hints use Radix Tooltip with the site's small, rounded dark surfaces and white text. Show them immediately on hover or keyboard focus, prefer the space below the control, and shift or flip them to stay inside the viewport. Keep hints visible while the pointer moves across the gap onto their text. Escape dismisses a hint without moving focus; leaving and re-entering the control can show it again. Preserve each control's accessible name and description, and keep the visual hint text out of repeated screen reader announcements. Opening the QR code dialog dismisses its opener's hint.
- Focus indicators share a consistent line weight and use the existing palette by context: charcoal for the Header, main landmark, and resume preview; dark olive for homepage content and the QR code dialog; light olive for the dark Footer. Filled buttons follow their region's focus color when the outline sits on a light surrounding surface. Keep spacing consistent within ordinary controls and large content surfaces, and use inset outlines for full-width navigation targets. Preserve each control's shape and the system's focus colors in forced-colors mode.
- Links using `IconArrowUpRight` share the same subtle arrow movement when the link is hovered. Disable that movement when reduced motion is requested.

The main page uses clearly perceptible, reversible motion tied to scroll position. Content unfolds across the lower half of the viewport, stays still and fully readable through the reading area, and recedes toward the top. Scrolling back retraces the same motion without a replay delay. Projects and Blog each enter and exit as one complete group: their headings, actions, controls, imagery, and text share the same movement, scale, and opacity, preserving their relative positions. Professional history uses a drawing timeline and grouped entrances. Keep primary navigation stable, preserve native scrolling, and show complete static content when reduced motion is requested. Greetings appear in full and skills remain available in a wrapping list without timed animation.
