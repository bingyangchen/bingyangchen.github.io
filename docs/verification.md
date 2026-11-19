# Verification

Run `npm run check` before delivering changes to code or site behavior. For documentation-only edits, run `npm run format:check` and `npm run check:scenarios`. Read the [SDD verification rules](../.agents/skills/sdd/references/verification.md) when changing scenario coverage.

## Browser Checks

Build first to test production assets. Chromium runs all browser specs, including CDP and PDF checks. Firefox and WebKit run the linked core journeys. The development smoke test separately starts Vite because production React omits diagnostics. [Core journeys](../tests/browser/cross-browser.spec.ts) · [Development smoke test](../tests/browser/development.spec.ts)

Use `npm run test:browser -- --project=chromium` to select a project and `npx playwright test --list` to inspect discovery. On failure, open `npx playwright show-report` and inspect the trace, screenshot, and browser errors for the failing test.

- Use separate touch and mouse contexts. Turning off CDP touch emulation can leave Linux Chromium without hover while macOS retains it.
- After a same-document interaction, wait for its result, such as a decoded responsive candidate, saved scroll position, or rendered motion state. An existing page load state can resolve before a later interaction changes the page.
- Prefer roles, accessible attributes, and link destinations for interaction selectors. This keeps tests focused on the user-facing contract when the markup changes.
- Exercise language switching through the real provider and control. Use independent fixtures for incomplete translations and alternate data, so tests can run without mutating the shared production data.
- Keep production resources in browser tests so a mock cannot mask a broken bundled image. Check third-party destination availability separately from the local build. [Resource monitor](../tests/helpers/resources.ts)

## Manual Checks

Use the [manual acceptance guide](../tests/manual/site.md) for real Safari and mobile devices, assistive technology, system print dialogs, and visual judgment. For scroll performance, compare the same browser, viewport, input, and content.
