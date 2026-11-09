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

Work-experience metadata lives in `src/data/workExperience.ts`; project metadata lives in `src/data/projects.ts`. Their literal IDs define the required keys in both dictionaries and the project artwork registry, so display-name edits do not change lookup keys. Projects store calendar years directly, since their periods display no month or day. Keep JSX and artwork composition in the Projects component.

English work and project copy is maintained only in `src/i18n/dictionaries/en.ts`, with Traditional Chinese in `zhtw.ts`. The pure resolvers in `src/i18n/content.ts` apply English fallback per field when a translation is missing or blank. Complete production dictionaries remain required by TypeScript, and data-integrity tests reject empty copy and duplicate IDs, so fallback cannot hide incomplete maintained content. Resume bullets remain independently editable.

[Image assets and loading](docs/image-assets.md) documents responsive renditions, embedded project previews, resource budgets, and before/after measurements. After replacing an original image, run `npm run images:generate` with libwebp's `cwebp` and `dwebp` available; generated assets are committed, so normal builds need neither tool.

Preview serves the build over loopback HTTP without an SPA fallback. `/resume` remains a non-public preview with browser printing, available through `npm run dev`.

### Static Output and PDF Validation

`scripts/static-server.mjs` owns loopback file serving for both preview and prerender, including MIME types, decoded-path and symlink checks, HEAD requests, stream errors, and shutdown. Preview serves actual files only. Prerender explicitly supplies the compile shell for `/` and `/resume`; all other missing paths return 404, including missing assets. Unexpected file I/O failures return 500 and report their cause.

`scripts/prerender.mjs` coordinates browser configuration, homepage capture, resume generation, validation, and output. The modules in `scripts/prerender/` keep those responsibilities separately testable. A 120-second deadline covers the run, errors identify the failing stage, and browser cleanup has a separate five-second limit before terminating the browser process. Server shutdown runs even if browser launch or cleanup fails, and closes active connections. HTML and PDF are written only after both outputs pass validation.

PDF structure is read through [pdf-lib](https://pdf-lib.js.org/docs/api/classes/pdfdocument), including compressed objects, page geometry, document language, embedded font descriptors, and link annotations. [PDF.js](https://github.com/mozilla/pdf.js/tree/master/examples/node) independently extracts the generated text and checks every expected line of resume content, including contact information. Comparison normalizes Unicode ligatures, whitespace, and discretionary line-end hyphens while preserving authored punctuation. DOM bounds remain a separate clipping check; neither extraction nor structural checks establish visual quality or ATS compatibility.

Browser tests inspect PDF metadata, drawing fonts, annotations, and text with PDF.js rather than sharing the build's structure reader. Prerender failure fixtures invoke the actual entry module with a temporary build directory, so adding an internal import cannot turn a fixture into a missing-module failure. Negative PDF fixtures cover compressed objects, corruption, missing text or annotations, unexpected geometry or language, and missing, substituted, or unembedded fonts. Manual checks retain visual layout, reading order, and real browser/OS printing.

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

Content component tests use the real LanguageProvider through `src/test-utils/render.tsx` and switch languages through the actual control. Test missing translations and alternate periods at the pure-function boundary with independent fixtures; never modify exported production data. Prefer roles, accessible attributes, or destinations for browser interaction selectors; keep CSS selectors for visual geometry local to those checks.

Browser tests use the production assets without substituting remote images. The shared `scripts/browser-resources.mjs` monitor blocks unexpected external requests and rejects HTTP errors, failed requests, undecodable images, console errors, and uncaught JavaScript errors. Failure tests use isolated pages and explicitly verify their expected errors. External link destinations are checked separately from third-party availability.

Motion checks wait for the rendered hover position and media-query cleanup state. A completed emulation command, a fixed number of animation frames, or an empty animation list does not guarantee that those changes have reached the renderer and event listeners.

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
