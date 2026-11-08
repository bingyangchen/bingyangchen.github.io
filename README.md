# My Personal Website

[![Deploy](https://github.com/bingyangchen/bingyangchen.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/bingyangchen/bingyangchen.github.io/actions/workflows/deploy.yml)

A React and TypeScript personal website built with Vite and deployed to GitHub Pages. Visit the live site at [byc1999.com](https://byc1999.com/).

## Development

Use Node.js 22.22.2 or newer in the 22.x line and npm, matching CI. Node.js 24.15.0 or newer in the 24.x line is also supported; see `package.json` for the full engine range required by the test tools. Resume PDF builds require Georgia: macOS supplies it, while Ubuntu CI installs the TTF files in [vendor/corefonts](vendor/corefonts/README.md), without downloading or extracting fonts. Noto Serif TC is bundled for the Chinese name, so no system CJK font is needed. `npm run build` rejects missing or substituted PDF fonts; `npm run dev` remains available without the PDF build fonts.

```sh
npm ci
npm run dev
```

To preview the production site locally:

```sh
npm run build
npm run preview
```

Vite reads the root `index.html`, bundles imported assets, and copies `public/` into a clean `build/` directory. The npm `postbuild` hook then prerenders the homepage and generates `build/resume.pdf` from the shared ResumeSheet. Use the production preview to test homepage downloads; the development server does not generate the PDF.

Brand images ship with the site. Original source URLs for work-experience logos are recorded beside their imports in [`workExperience.ts`](src/data/workExperience.ts). Prerender and PDF generation block non-loopback network requests, so producing the static site does not require third-party services.

[Image assets and loading](docs/image-assets.md) documents responsive renditions, embedded project previews, resource budgets, and before/after measurements. After replacing an original image, run `npm run images:generate` with libwebp's `cwebp` and `dwebp` available; generated assets are committed, so normal builds need neither tool.

Preview serves the build over loopback HTTP without an SPA fallback. `/resume` remains a non-public preview with browser printing, available through `npm run dev`.

The [local design system](src/styles/README.md) documents shared tokens, Sass patterns, and UI controls. Shared tokens, reusable patterns, and global screen and print entry styles live in `src/styles/`; component styles stay in co-located CSS Modules.

## Verification

Run `npm run check` for all automated checks, including a fresh production build. Individual checks are also available:

<!-- prettier-ignore -->
| Command | Purpose |
| --- | --- |
| `npm run format` | Format maintained source, configuration, and documentation with Prettier. |
| `npm run format:check` | Check formatting without modifying files. |
| `npm run lint` | Check source, scripts, and tests with ESLint; warnings fail the check. |
| `npm run lint:fix` | Apply available ESLint fixes. |
| `npm run typecheck` | Check application, unit tests, and Vite configuration with TypeScript. |
| `npm run check:scenarios` | Validate spec and scenario coverage links. |
| `npm run test:checker` | Test the scenario checker. |
| `npm run test:unit` | Run Vitest tests in jsdom. |
| `npm run test:browser` | Run Chromium tests against the production build; run `npm run build` first. |

Prettier owns formatting; the independent `eslint.config.mjs` configures JavaScript, TypeScript, React, hooks, and accessibility rules, with `eslint-config-prettier` disabling conflicting style rules. ESLint uses the latest compatible 9.x release because the React and accessibility plugins do not yet support ESLint 10. Node scripts and tests have Node globals, unit tests have Vitest globals, and the Puppeteer modules also have browser globals for callbacks executed in the page. Formatting excludes archived plans, agent skills, static artwork, generated files, and the lockfile.

React's `jsx-runtime` preset supports the automatic JSX transform; props, JSX text, and accessibility checks remain enabled. The QR dialog has a local exception for backdrop clicks because Escape and the close button already provide keyboard dismissal.

Vitest discovers `src/**/*.{test,spec}.{js,jsx,ts,tsx}` and excludes `fixtures` and `__fixtures__` directories, matching the scenario checker. The existing Node test runner and Puppeteer continue to run browser tests.

Browser tests use the production assets without substituting remote images. The shared `scripts/browser-resources.mjs` monitor blocks unexpected external requests and rejects HTTP errors, failed requests, undecodable images, console errors, and uncaught JavaScript errors. Failure tests use isolated pages and explicitly verify their expected errors. External link destinations are checked separately from third-party availability.

Vite's JavaScript targets and PostCSS Autoprefixer use the existing production Browserslist policy. CSS uses Vite's default Lightning CSS minifier. The dormant Workbox source remains for TD-19, but Vite neither bundles nor emits a service worker.

The `@typescript-eslint/typescript-estree` override selects patched `minimatch` 11 for [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249). It affects ESLint's project-file matching only. Remove the override once typescript-eslint requires a patched version itself, after checking lint and project matching.

See [manual checks](tests/manual/site.md) for verification methods and coverage requirements, and the [roadmap](docs/roadmap.md) for future requirement goals, known issues, and questions awaiting investigation or product decisions. Record actual execution results in commit bodies and delivery reports.

## Spec-Driven Workflow

Read the [design context](docs/design.md) for product and visual direction, the [site spec](docs/specs/site.md) for implemented behavior, and [AGENTS.md](AGENTS.md) for engineering conventions. The [SDD skill](.agents/skills/sdd/SKILL.md) defines the full workflow:

<!-- prettier-ignore -->
| Request | Use for |
| --- | --- |
| `/sdd plan` | Propose new or changed behavior and substantial design changes. |
| `/sdd implement <id>` | Implement an approved plan. |
| `/sdd change` | Fix specified behavior or refactor without changing behavior. |
| `/sdd backfill` | Document existing behavior and verification. |
| `/sdd abandon <id>` | Abandon an unfinished plan. |

This repo uses direct commits to `main`; commit and push each require explicit user instructions.

## CI and Publishing

The [deployment workflow](.github/workflows/deploy.yml) runs `npm run check` on pushes to `main` and manual runs. Successful runs on `main` deploy to GitHub Pages.
