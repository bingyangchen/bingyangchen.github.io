# Project Instructions

## Task Context

- Before any change, load [the shared SDD workflow](.agents/skills/sdd/SKILL.md) and choose the entry point that matches the task. Explicit user instructions for the current task take precedence.
- Before proposing or changing UI, interactions, product copy, or information architecture, read [the site design context](docs/design.md).
- Follow the site's established design and tokens when applying the `impeccable` skill.
- For resume content, layout, or PDF work, also read [the project resume skill](.agents/skills/resume-writer/SKILL.md).
- Update the design context in the same change when an agreed change alters the site's purpose, major sections, outbound destinations, language behavior, copy tone, or visual system.

## Runtime and Deployment

- For routing changes, inspect [prerender](scripts/prerender.mts) and verify direct navigation and reloads with production preview. The development server can fall back to the app shell.
- For service-worker or offline changes, inspect [startup](src/index.tsx) and [legacy registration cleanup](src/serviceWorkerRegistration.ts). Verify against a production build.
- Declare input devices with Playwright context options or `test.use`. Use `page.setViewportSize` only for geometry. See the [browser verification guide](docs/verification.md#browser-checks) for the CDP touch emulation limitation.

## Styling

Apply the [shared style guide](src/styles/README.md) for token roles, Sass patterns, and placement of screen, print, and component styles.

## Markdown Formatting

Keep Markdown tables compact, with a single space around each cell's content. Put `<!-- prettier-ignore -->` directly before each table so Prettier preserves its spacing.

## Dependencies

Use npm.
