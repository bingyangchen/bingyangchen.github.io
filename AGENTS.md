# Project Instructions

## Task Context

* Before any change, load [the shared SDD workflow](.agents/skills/sdd/SKILL.md) and choose `plan`, `implement`, `change`, or the trivial path. Explicit user instructions for the current task take precedence.
* Before proposing or changing UI, interactions, product copy, or information architecture, read [the site design context](docs/design.md).
* Follow the site's established direction and tokens over generic design-skill preferences unless the user changes that direction. Use the user-level `impeccable-design` entrypoint when skill selection or coordination is needed; a specifically requested sub-skill can be used directly.
* For resume content, layout, or PDF work, also read [the project resume skill](.agents/skills/resume-writer/SKILL.md).
* Update the design context in the same change when an agreed change alters the site's purpose, major sections, outbound destinations, language behavior, copy tone, or visual system.

## Runtime and Deployment

* This is a React and TypeScript frontend built with Create React App and deployed to GitHub Pages through `.github/workflows/deploy.yml`. There is no application server or first-party API in this repository.
* `npm run build` runs prerendering through `postbuild`. When changing routing, inspect `scripts/prerender.mjs` and verify direct navigation and reloads on static hosting; do not assume a server-provided SPA fallback.
* For service-worker or offline changes, inspect registration in `src/index.tsx` as well as the Workbox files, and verify the behavior against a production build.

## Styling

* Use `src/_global_variables.scss` for colors, base typography values, shared layout constants, and breakpoints. Add new shared values there rather than hardcoding them in SCSS modules. Use `$small`, `$medium`, `$large`, and `$extra-large` for media queries.
* Keep component and page styles in co-located `*.module.scss` files. Consume tokens with `@use ".../global_variables" as _;`, adjusting the relative path. Avoid inline TSX styles unless necessary.
* Nest module rules under their root class in TSX/DOM order, without unnecessary depth. Keep overrides under their actual parent with short, purposeful selectors.

## Dependencies

* Use npm.
