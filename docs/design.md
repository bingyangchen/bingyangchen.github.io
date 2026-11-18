# Site Design Context

This document records the site's product and design direction. Detailed behavior lives in the [site spec](specs/site.md); engineering instructions and task-specific skills live in [AGENTS.md](../AGENTS.md).

The [local design system](../src/styles/README.md) documents the shared tokens, styling patterns, and controls that implement this direction. Shared tokens and global screen and print styles live in `src/styles/`; component styles remain co-located, while artwork composition and resume print geometry retain their contextual rules.

## Purpose and Audience

[Bing-Yang Chen's personal site](https://byc1999.com/) introduces the author through professional background, selected side projects, personal interests, and links to GitHub and the [external blog](https://blog.byc1999.com/). Its purpose is to market the author as a person. The audience includes recruiters, peers, potential collaborators, and general visitors arriving through search or shared links.

Help visitors quickly understand who the author is and find a reason to learn more. Keep the site focused on one person's identity and work. Long-form writing belongs on the external blog.

## Main Experience

- `/` is the main scrolling page, organized into Home, About, Projects, and Blog.
- Hero aims to introduce the author within roughly five seconds and leave the impression that this is an interesting person worth getting to know. The name and current role provide basic identification; the greeting adds personality and invites further exploration.
- About introduces the author in three short interview chapters covering the move into software, selected professional work, and interests outside work. The final answer leads directly into a selection of the author’s photographs. The work chapter links to the downloadable resume for the detailed career record.
- Projects emphasizes each product's purpose and real interface imagery, with consistent neutral staging.
- Blog introduces the author's thinking through one featured article and two additional reading selections, with a clear route to the full external publication. Keep long-form reading on GitBook.
- Keep contact and social links, language selection, and resume export easy to find.
- The Footer closes the page with a direct email contact, GitHub, LinkedIn, and Cake, followed by author identity and copyright. Keep services out of the Footer.
- Keep the primary navigation available throughout the page and make the current section recognizable.
- Offer the same prebuilt English A4 resume PDF from the main page on all screen sizes; keep `/resume` as a non-public preview with browser printing.

## Language and Copy

The main site supports English and Traditional Chinese and respects the visitor's language preference. The resume remains in English.

Use the Header to change languages; close the QR code dialog before switching. Reopening it uses the current language.

Language selection remains available when browser storage is blocked. Keep the visitor's choice for the current page without showing a storage warning; on reload, use a readable saved preference or the browser language.

- Experience and education copy should be direct, professional, and specific about scope and outcomes. Distinguish personal projects from production work.
- The Hero jokes about the history of magic to invite curiosity. About opens with economics and describes the author’s interests in psychology, calligraphy, and photography.
- About uses a personal voice grounded in facts supplied by the author. Use selected employers, product types, and the author’s role in those products to convey the breadth of the work. Detailed accomplishments belong in the resume. Review proposed personal motivations and opinions with the author before publication.
- Hero copy uses conversational, self-deprecating humor and specific, unexpected interests to invite curiosity. Write each language for its audience, giving it natural phrasing, its own sentence rhythm and humor, and a comfortable degree of personal disclosure while preserving shared facts. The greeting should complement the visible name and role. Keep intriguing details open to discovery rather than explaining every reference or reducing the introduction to a list of traits.
- The Hero shows the author’s school and earned degree and links to the department. Use a consistent degree name in the Hero and resume.
- Projects and Blog may use a warmer, open, curious tone while keeping claims concrete.
- Preserve shared facts across languages while allowing natural phrasing and different levels of detail. Chinese copy should use natural Traditional Chinese wording consistent with the existing site.
- Blog selections retain their original article titles. Localize the surrounding summaries and actions. In the English interface, identify the primary writing language before visitors choose an article.
- Footer contact copy is concise and conversational. Welcome discussion about technology, products, and collaboration without implying current availability or response times.
- External links should identify their destination or action. Keep GitHub, school, project demo, and blog journeys clear.

## Visual Direction

Maintain a calm, professional presentation with readable hierarchy and restrained accents.

- **Palette:** Neutral backgrounds and dark text, with olive as an accent. Use a dedicated olive action color with white text for brand buttons, visually coordinated with the portrait. Keep the resume action label at the body UI scale with normal tracking so it stays clear without overpowering the introduction. Preserve a distinct lighter text color for dates and other supporting information. Choose the lightest neutral gray that maintains at least 4.5:1 contrast on the existing white and light gray surfaces; reserve paler gray for decoration. Use dark olive for text and action icons on light surfaces, including hover states.
- **Consistency:** Equivalent roles and surfaces share visual rules. Vary color or treatment when contrast, hierarchy, or layout gives the difference a purpose.
- **Typography:** Geneva/sans-serif for body and UI text; Georgia/Times/serif for established section titles and subtitles. The Footer pairs a serif contact headline with sans-serif descriptions, addresses, platform links, identity, and copyright. Preserve the existing hierarchy and spacing rhythm elsewhere.
- **Shared section scale:** Projects and Blog use the same responsive container spacing, section titles, introductory text, metadata, and equivalent external-link sizes. The Footer contact headline shares their responsive title scale, using the dark surface to distinguish the page ending. Preserve each section's content hierarchy.
- **Layout:** Keep sections distinct and reading widths comfortable. Align the header with the page's centered content bounds while allowing full-width surfaces. Adapt composition to the viewport and the surrounding layout.
- **Hero:** Use an open composition without a card enclosure. On wider screens, a prominent portrait sits to the left of the name, current role, personal introduction, and primary actions. Compact screens stack the portrait above the identity and introduction. Keep education visually secondary after the actions, with email and social links below a subtle divider. Preserve the existing olive palette, serif name, conversational copy, portrait interactions, and QR code entry. This direction prioritizes personality and an inviting introduction while keeping resume export and project exploration easy to find.
- **Hero continuity** lets the compact Hero end with its content and flow into About. The dark olive surface and visible portion of the first question signal the next section. Wider screens keep the independent Hero scroll hint. The Hero Projects action is an underlined in-page link without an external-link arrow.
- **About** pairs white serif questions on a dark olive curve with answers on a light surface. The desktop question and background stay in place within About while the answers scroll in sequence. The four photographs retain their original framing, with a wide opening image, two staggered portraits, and a warmer closing image. Compact screens stack the questions, answers, and photographs in order. In a single photo column, the four photographs share the same width and vertical spacing.
- **Navigation** uses the existing logo, readable mixed-case labels, and restrained indicators. The About link reads 「關於」 in Traditional Chinese and About in English. A softly translucent, blurred header lets the white and gray page backgrounds show through while preserving foreground contrast. Keep separators subtle. Use solid surfaces for the expanded compact menu or when needed for accessibility.

## Interaction and Motion

Motion should support reading and navigation, with a clear purpose and respect for reduced-motion preferences.

- Keep section navigation and browser history predictable, and preserve focus continuity.
- Let the Hero content group grow with its content and use page scrolling on short screens. Keep the group still and fully opaque until the bottom of the Hero has entered the viewport, then apply its reversible exit motion.
- Keep each About question, answer, and related content in document order. On desktop, the visible question updates as readers scroll the page. Selecting a chapter control scrolls to that chapter and moves keyboard focus there. The chapters share the `#about` destination. The complete interview reads in a static column when the viewport or the visitor’s preferences prevent the desktop presentation. The static homepage and its print layout include the interview and photographs.
- Keep navigation, contact actions, and project details usable on smaller screens and with keyboard input. Focus preserves the scroll-driven position, scale, tilt, and opacity, including partially entered or exited content.
- Keep body text selectable and copyable through native browser interactions, including descriptions inside article links. Keep buttons, navigation, and action labels unselectable.
- Keep the viewport configured to disable user scaling. The PWA should retain stable interface proportions and predictable touch interactions, with interface sizing controlled by responsive layout rather than accidental whole-page zoom. Content that needs magnification should provide it within that content.
- Provide immediate feedback for navigation and toggles, with visible keyboard focus and comfortable touch targets.
- Hover hints use Radix Tooltip with the site's small, rounded dark surfaces and white text. Show them immediately on hover or keyboard focus, prefer the space below the control, and shift or flip them to stay inside the viewport. Keep hints visible while the pointer moves across the gap onto their text. Escape dismisses a hint without moving focus; leaving and re-entering the control can show it again. Preserve each control's accessible name and description, and keep the visual hint text out of repeated screen reader announcements. Opening the QR code dialog dismisses its opener's hint. Footer platform links display their names directly and do not add tooltips that repeat the visible text.
- Focus indicators share a consistent line weight. Use charcoal for the Header, main landmark, and resume preview, dark olive for light homepage surfaces and the QR code dialog, and light olive for the dark Footer. About uses white focus outlines on the dark curve and a two-layer olive and white inset outline for its section and chapter targets. Filled buttons follow their region's focus color when the outline sits on a light surrounding surface. Keep spacing consistent within ordinary controls and large content surfaces, and use inset outlines for full-width navigation targets. Preserve each control's shape and the system's focus colors in forced-colors mode.
- Links using `IconArrowUpRight` share the same subtle arrow movement when the link is hovered. Disable that movement when reduced motion is requested.

Motion follows the current scroll position, so scrolling back restores the same view. Projects and Blog each enter and exit as a group, with headings, actions, imagery, and text sharing their group’s movement, scale, and opacity. About changes the visible question and keeps each answer and photograph in its own place on the page. Keep primary navigation stable, preserve native scrolling, and show complete static content when reduced motion is requested. The Hero greeting is available in full on arrival.
