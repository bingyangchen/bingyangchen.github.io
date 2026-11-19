# My Personal Website

[![Deploy](https://github.com/bingyangchen/bingyangchen.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/bingyangchen/bingyangchen.github.io/actions/workflows/deploy.yml)

[Bing-Yang Chen's personal website](https://byc1999.com/) is a bilingual portfolio with selected projects, writing, and an English resume. It uses React, TypeScript, and Vite on GitHub Pages.

## Run Locally

Use [nvm](https://github.com/nvm-sh/nvm) to select the Node version in [`.nvmrc`](.nvmrc). Install the npm version declared in [`package.json`](package.json), then install the locked dependencies.

```sh
nvm install
nvm use
npm install --global "$(node -p "require('./package.json').packageManager")"
npm run check:toolchain
npm ci
npm run dev
```

Open the URL printed by Vite. Use `/resume` there to preview and print the resume. To test the actual homepage download and static routes, build and preview the production files.

```sh
npm run build
npm run preview
```

The build needs Georgia for the PDF. macOS provides it, and Ubuntu CI installs the [bundled Georgia fonts](vendor/corefonts/README.md). Open `/resume.pdf` on the preview server to inspect the build output.

## Verify Changes

```sh
npx playwright install chromium firefox webkit
npm run check
```

On Linux, use `npx playwright install --with-deps chromium firefox webkit` when the browsers need system dependencies. See the [verification guide](docs/verification.md) for browser checks and troubleshooting, and the [manual checks](tests/manual/site.md) for device, accessibility, and print procedures.

The [deployment workflow](.github/workflows/deploy.yml) runs these checks on pushes to `main` and manual runs. Only successful runs for `main` publish to GitHub Pages.

## Find the Right Document

<!-- prettier-ignore -->
| Task | Start here |
| --- | --- |
| Change shared content or understand implementation decisions | [Architecture decisions](docs/architecture.md) |
| Change the layout, voice, or interaction design | [Site design context](docs/design.md) and [shared styles](src/styles/README.md) |
| Look up implemented behavior or test coverage | [Site spec](docs/specs/site.md) |
| Replace images or check loading budgets | [Image assets](docs/image-assets.md) |
| Review dependencies or verify the scheduled report | [Dependency maintenance](docs/dependency-maintenance.md) |
| Find known issues and open decisions | [Roadmap](docs/roadmap.md) |
| Choose a workflow for a change | [Project instructions](AGENTS.md) and [SDD workflow](.agents/skills/sdd/SKILL.md) |
