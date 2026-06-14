# Bing-Yang Chen Personal Site Context

Use this file as a quick memory refresh before any product or UX work on this repository.

## What This Site Is

A **personal portfolio and identity site** for Bing-Yang Chen (陳秉洋), deployed at [byc1999.com](https://byc1999.com/). It presents professional background, selected side projects, and links to GitHub and an external blog ([blog.byc1999.com](https://blog.byc1999.com/)). It is **not** a multi-user product: the audience is visitors (recruiters, peers, collaborators) scanning credibility and work samples.

**Stack (observed):** React 18, TypeScript, SCSS modules, React Router (single main route with in-page anchors), Create React App build, GitHub Pages deploy with custom domain; Workbox/service worker dependencies suggest offline/PWA-oriented setup.

## Core Experience

- **Hero (HOME):** Name, flip/interactive avatar, typing-style greeting, anchor CTAs (About / Projects / Blog), scroll hint.
- **ABOUT:** Narrative subtitle, **Work experience** timeline (structured cards), **Skills** grid (duplicated row for visual rhythm), **Education** with NCCU links.
- **PROJECTS:** Intro copy, project cards opening a **detail surface** (thumbnail, tags, dates, description, source + demo links), GitHub CTA.
- **BLOG:** Short positioning copy and a button linking to the external blog list.
- **Chrome:** Fixed header (transparent over first viewport, solid after scroll), desktop nav tabs + mobile side menu, footer.

**Information architecture:** One long-scroll page; section IDs (`#home`, `#about`, `#projects`, `#blog`) drive navigation and URL hash updates on scroll.

## Product Characteristics

- **English-first UI** for headings, body, and CTAs; **HTML/lang and SEO** lean Traditional Chinese (`zh-Hant-TW`) alongside English names and institutions.
- **Professional resume narrative** in work descriptions (impact, scope, tooling); **warmer, invitation-style** copy for Projects and Blog sections.
- **Outbound by design:** GitHub, company sites, school pages, Chrome Web Store, and the separate blog open as external journeys rather than in-app content.
- **Single author, single story:** Consistency matters more than feature breadth; changes should preserve a coherent personal brand.

## Design Style Direction (Observed)

- **Palette:** Neutrals (`#f5f5f5`, grays, near-black text), accent **theme color** `#9fa76e` (olive/sage) used in chrome/components; occasional semantic colors (e.g. red/green/blue) in variables for UI elements as needed.
- **Typography:** **Georgia / serif** for section titles (`h2`), subtitles, and editorial rhythm; **Geneva / sans-serif** for body and hero name/greeting. Generous line height and letter spacing on subtitles.
- **Layout:** Full-viewport sections, alternating light backgrounds, centered section titles with short horizontal rules, constrained subtitle width for readability.
- **Motion:** Purposeful and light—e.g. avatar flip, typing greeting, smooth scroll; avoid heavy or gimmicky animation that competes with reading.

## UX Principles for This Site

- **Scannable first:** Visitors should grasp role, trajectory, and standout projects within one scroll.
- **Respect deep links:** Hash-based sections and replaceState behavior should stay predictable when adding content or changing layout.
- **Mobile parity:** Side menu, touch targets, and section padding should remain comfortable on small viewports (existing breakpoints around 512px and up).
- **Project flow:** Opening a project should feel clear (focus moves to detail, dismiss control obvious); avoid trapping scroll or hiding critical actions.
- **External links:** Use clear labels and `rel`/`target` patterns consistent with the rest of the site; avoid ambiguous “click here” copy.

## Interaction and Motion Tone

- Subtle, supportive of reading and navigation—not a playground demo unless the content itself is a demo.
- Prefer **immediate feedback** on navigation and toggles (header, menu, project open/close).
- Honor **smooth scroll** already set globally; new features should not fight it.

## Copy Tone

- **Direct and professional** for experience and facts; **open and curious** for Projects/Blog framing.
- Avoid corporate filler; prefer concrete outcomes and honest scope (e.g. side project vs. production platform).
- When adding Chinese copy, keep it aligned with existing SEO/meta tone: clear names, institutions, and role labels; avoid mixing tones awkwardly within the same block.

## When This File Should Be Updated

Update this document when the site’s **purpose**, **major sections**, **primary outbound properties**, or **visual/typography system** change materially so design and copy suggestions stay aligned with what actually ships in `src/`.
