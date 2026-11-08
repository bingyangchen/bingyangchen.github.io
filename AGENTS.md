# Project Instructions

## Task Context

- Before any change, load [the shared SDD workflow](.agents/skills/sdd/SKILL.md) and choose `plan`, `implement`, `change`, or the trivial path. Explicit user instructions for the current task take precedence.
- Before proposing or changing UI, interactions, product copy, or information architecture, read [the site design context](docs/design.md).
- Follow the site's established direction and tokens over generic design-skill preferences unless the user changes that direction. Use the user-level `impeccable-design` entrypoint when skill selection or coordination is needed; a specifically requested sub-skill can be used directly.
- For resume content, layout, or PDF work, also read [the project resume skill](.agents/skills/resume-writer/SKILL.md).
- Update the design context in the same change when an agreed change alters the site's purpose, major sections, outbound destinations, language behavior, copy tone, or visual system.

## Runtime and Deployment

- This is a React and TypeScript frontend built with Vite and deployed to GitHub Pages through `.github/workflows/deploy.yml`. There is no application server or first-party API in this repository.
- `npm run build` runs prerendering through `postbuild`. When changing routing, inspect `scripts/prerender.mjs` and verify direct navigation and reloads on static hosting; do not assume a server-provided SPA fallback.
- For service-worker or offline changes, inspect registration in `src/index.tsx` as well as the Workbox files, and verify the behavior against a production build.

## Styling

- Follow the [local design system](src/styles/README.md) for token roles, shared Sass patterns, and UI controls. Reuse patterns from `src/styles/` and keep component-specific composition and print geometry local.
- Keep shared tokens in `src/styles/_tokens.scss`, ordered as foundations, semantic tokens, and component tokens. Keep comparable scales ascending and define dependencies before derived values. Add new shared values there rather than hardcoding them in SCSS modules. Use `$small`, `$medium`, `$large`, and `$extra-large` for media queries.
- Keep global screen and print entry styles in `src/styles/index.scss` and `src/styles/print.scss`. Keep component and page styles in co-located `*.module.scss` files. Consume tokens with `@use ".../styles/tokens" as _;`, adjusting the relative path. Avoid inline TSX styles unless necessary.
- Nest module rules under their root class in TSX/DOM order, without unnecessary depth. Keep overrides under their actual parent with short, purposeful selectors.

## Markdown Formatting

Keep Markdown tables compact, with a single space around each cell's content. Put `<!-- prettier-ignore -->` directly before each table so Prettier preserves its spacing.

## Dependencies

- Use npm.
