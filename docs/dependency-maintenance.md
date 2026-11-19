# Dependency Maintenance

## Weekly Review

1. Review all open [Dependabot alerts](https://github.com/bingyangchen/bingyangchen.github.io/security/dependabot) across severities. Use the [dependency graph](https://github.com/bingyangchen/bingyangchen.github.io/network/dependencies) to trace affected packages.
2. Review the latest [Dependency report run](https://github.com/bingyangchen/bingyangchen.github.io/actions/workflows/dependencies.yml). Check for a failed or missing run as well as version findings.
3. Keep alerts and automated security updates enabled in [Code security settings](https://github.com/bingyangchen/bingyangchen.github.io/settings/security_analysis). Set delivery preferences for Dependabot and Actions in [Notification settings](https://github.com/settings/notifications).

Dependabot covers security advisories. The independent version report tracks newer direct dependency releases.

## Read the Version Report

Use **Run workflow** on `main` for an on-demand version report. Download the `dependency-report` artifact from the run summary before it expires. Start with `result.json`, read findings in `outdated.json`, and consult the stderr log or failed workflow step for errors. Newer versions are findings that a successful run can report. [Report workflow](../.github/workflows/dependencies.yml)

An absent row may reflect an npm query failure. The reporter checks HTTP failures and verifies the ranges of omitted direct dependencies. After changing npm, rerun `npm run test:dependencies` against the test registry. [Reporter](../scripts/report-dependencies.mts)

## Verify Scheduled Execution and Notification Delivery

With authenticated GitHub CLI access, check the workflow state and latest scheduled run separately.

```sh
gh api repos/bingyangchen/bingyangchen.github.io/actions/workflows/dependencies.yml \
  --jq '{id, path, state}'
gh api 'repos/bingyangchen/bingyangchen.github.io/actions/workflows/dependencies.yml/runs?event=schedule&per_page=1' \
  --jq '{total_count, runs: [.workflow_runs[] | {id, event, status, conclusion, created_at, head_branch, head_sha, html_url}]}'
```

An `active` state confirms enablement. A successful run with `event: schedule` confirms the occurrence indicated by `created_at`. Compare the timestamp with the occurrence expected from the workflow cron, which uses UTC. For a missing run, check the default branch, workflow state, and [GitHub’s delay and inactivity rules](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule) before changing the cron expression.

Download the scheduled run’s artifact. In `result.json`, compare the commit, lockfile SHA-256, and tool versions with the files at the run’s `head_sha`. Check the status and count against `outdated.json`. Each direct dependency must appear as a reported row or a successful range query in `unreported-packages.json`. Record the run URL, event, timestamp, commit, conclusion, artifact ID, and report result. If the artifact is missing or expired, mark the report contents as pending verification.

To list open security alerts across all severities, run the paginated query.

```sh
gh api --paginate 'repos/bingyangchen/bingyangchen.github.io/dependabot/alerts?state=open&per_page=100' \
  --jq '[.[] | {number, severity: .security_advisory.severity, package: .dependency.package.name, html_url}]'
```

The query prints one array per page. In Notification settings, look for **CLI** under **Dependabot alerts: New vulnerabilities** and check **Actions** for failure notifications. Record each channel’s configured setting and any observed delivery. For a vulnerability warning received during a normal authorized push, record the timestamp, repository, and redacted warning. Track pending verification in the [roadmap](roadmap.md).

## Produce a Local Report

To produce the same report locally after the normal development setup:

```sh
npm run check:toolchain
npm run report:dependencies
```

Inspect the output in `dependency-report/`. The [npm outdated reference](https://docs.npmjs.com/cli/v12/commands/npm-outdated/) explains `wanted` and `latest`. Use `npm outdated --all --json` when investigating transitive versions.

## Review Upgrades

- Trace security alerts with `npm explain <package>`. Check the affected version, API, and execution path. A package can affect the browser, development tools, or CI depending on where the site uses it.
- Keep the supported Node range and the reproducible CI baseline distinct when changing tools. The [local setup](../README.md#run-locally) reproduces the CI baseline from `.nvmrc` and `packageManager`.
- Review new install scripts before using `npm install-scripts approve <package>` with the pinned npm. Its version-specific approvals cover Puppeteer’s browser download and the native watchers. Verify with `npm ci` using an empty `PUPPETEER_CACHE_DIR` to exercise Chrome installation.
- Keep React and React DOM on the same release and their types on the same major line. The portrait’s `fetchPriority` and project panels’ boolean `inert` use React 19 JSX support.
- The `@typescript-eslint/typescript-estree` override selects a patched `minimatch` for [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249). Remove the override after the upstream package requires a patched version and lint confirms project matching.
- Run `npm run check` after an upgrade. Browser-support database updates can also affect the production output.
