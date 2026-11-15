import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parseOutdatedResult } from "../scripts/report-dependencies.mts";

const outdatedPackage = { current: "1.0.0", wanted: "1.1.0", latest: "2.0.0" };
const outdated = JSON.stringify({ "fixture-dependency": outdatedPackage });

test("distinguishes completed queries from npm errors and incomplete output", () => {
  assert.equal(parseOutdatedResult("{}", "", 0).status, "current");
  assert.deepEqual(parseOutdatedResult(outdated, "", 1), {
    status: "outdated",
    packageCount: 1,
    message: "npm reported 1 outdated direct dependencies.",
  });
  for (const [stdout, exitCode] of [
    ['{"error":{"code":"ECONNREFUSED"}}', 1],
    ["", 1],
    ["not json", 0],
    ["[]", 0],
    ["null", 0],
    ["{}", 1],
    [outdated, 0],
    [outdated, 2],
    [outdated, null],
    ['{"fixture-dependency":{"wanted":"1.1.0","latest":"2.0.0"}}', 1],
    ['{"fixture-dependency":[]}', 1],
  ] as const) {
    assert.equal(parseOutdatedResult(stdout, "", exitCode).status, "failed");
  }
});

test("accepts npm's multi-location package rows without losing the raw report", () => {
  assert.equal(
    parseOutdatedResult(
      JSON.stringify({ "fixture-dependency": [outdatedPackage, outdatedPackage] }),
      "npm warn example warning\n",
      1,
    ).packageCount,
    1,
  );
});

async function queryRegistryFixture(
  mode:
    | "current"
    | "outdated"
    | "unavailable"
    | "forbidden"
    | "missing"
    | "partial"
    | "no-matching-version",
) {
  const root = await mkdtemp(join(tmpdir(), "dependency-report-"));
  const registry = createServer((request, response) => {
    const rejected =
      mode === "forbidden" ||
      mode === "missing" ||
      (mode === "partial" && request.url === "/fixture-dependency");
    if (rejected || mode === "unavailable") {
      response.writeHead(mode === "missing" ? 404 : rejected ? 403 : 503, {
        "content-type": "application/json",
      });
      response.end(JSON.stringify({ error: "Fixture registry failure" }));
      return;
    }
    const name = request.url?.slice(1);
    const latest =
      mode === "no-matching-version" ? "0.5.0" : mode === "current" ? "1.0.0" : "2.0.0";
    response.writeHead(200, { "content-type": "application/json" });
    response.end(
      JSON.stringify({
        name,
        "dist-tags": { latest },
        versions: Object.fromEntries(
          (mode === "no-matching-version" ? [latest] : ["1.0.0", latest]).map(
            (version) => [version, { name, version }],
          ),
        ),
      }),
    );
  });
  try {
    await new Promise<void>((resolve) => registry.listen(0, "127.0.0.1", resolve));
    const address = registry.address();
    assert.ok(address && typeof address === "object");
    const dependencies: Record<string, string> = { "fixture-dependency": "^1.0.0" };
    if (mode === "partial") dependencies["other-dependency"] = "^1.0.0";
    const manifest = {
      name: "report-fixture",
      version: "1.0.0",
      packageManager: "npm@12.2.2",
      dependencies,
    };
    await writeFile(join(root, "package.json"), JSON.stringify(manifest));
    const lockfile = JSON.stringify({ lockfileVersion: 3, packages: { "": manifest } });
    await writeFile(join(root, "package-lock.json"), lockfile);
    for (const name of Object.keys(dependencies)) {
      const directory = join(root, "node_modules", name);
      await mkdir(directory, { recursive: true });
      await writeFile(
        join(directory, "package.json"),
        JSON.stringify({ name, version: "1.0.0" }),
      );
    }
    const summaryPath = join(root, "step-summary.md");
    const child = spawn(
      process.execPath,
      [fileURLToPath(new URL("../scripts/report-dependencies.mts", import.meta.url))],
      {
        cwd: root,
        env: {
          ...process.env,
          NPM_CONFIG_REGISTRY: `http://127.0.0.1:${address.port}`,
          NPM_CONFIG_CACHE: join(root, "npm-cache"),
          NPM_CONFIG_USERCONFIG: join(root, "unused-npmrc"),
          NPM_CONFIG_FETCH_RETRIES: "0",
          NPM_CONFIG_FETCH_TIMEOUT: "2000",
          GITHUB_STEP_SUMMARY: summaryPath,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let diagnostics = "";
    child.stdout.on("data", (chunk) => {
      diagnostics += chunk;
    });
    child.stderr.on("data", (chunk) => {
      diagnostics += chunk;
    });
    const exitCode = await new Promise<number | null>((resolve, reject) => {
      child.on("error", reject);
      child.on("close", resolve);
    });
    const reportPath = join(root, "dependency-report");
    const report = JSON.parse(await readFile(join(reportPath, "result.json"), "utf8"));
    const raw = JSON.parse(await readFile(join(reportPath, "outdated.json"), "utf8"));
    const stderr = await readFile(join(reportPath, "npm-stderr.log"), "utf8");
    assert.equal(
      await readFile(summaryPath, "utf8"),
      await readFile(join(reportPath, "summary.md"), "utf8"),
    );
    assert.deepEqual(
      JSON.parse(await readFile(join(root, "package.json"), "utf8")),
      manifest,
    );
    assert.equal(await readFile(join(root, "package-lock.json"), "utf8"), lockfile);
    return { exitCode, report, raw, stderr, diagnostics };
  } finally {
    await new Promise<void>((resolve, reject) =>
      registry.close((error) => (error ? reject(error) : resolve())),
    );
    await rm(root, { recursive: true, force: true });
  }
}

test("real npm records a successful query with no outdated versions", async () => {
  const result = await queryRegistryFixture("current");
  assert.equal(result.exitCode, 0, result.diagnostics);
  assert.equal(result.report.status, "current");
  assert.equal(result.report.npmExitCode, 0);
  assert.deepEqual(result.raw, {});
});

test("real npm outdated exit 1 produces a successful report and preserves version details", async () => {
  const result = await queryRegistryFixture("outdated");
  assert.equal(result.exitCode, 0, result.diagnostics);
  assert.equal(result.report.status, "outdated");
  assert.equal(result.report.npmExitCode, 1);
  assert.equal(result.raw["fixture-dependency"].current, "1.0.0");
  assert.equal(result.raw["fixture-dependency"].latest, "2.0.0");
});

test("real npm registry failure keeps diagnostics and fails the report", async () => {
  const result = await queryRegistryFixture("unavailable");
  assert.equal(result.exitCode, 1, result.diagnostics);
  assert.equal(result.report.status, "failed");
  assert.match(result.stderr, /503/);
});

test("real npm's silent HTTP 403 cannot become a clean report", async () => {
  const result = await queryRegistryFixture("forbidden");
  assert.equal(result.report.npmExitCode, 0);
  assert.deepEqual(result.raw, {});
  assert.equal(result.exitCode, 1, result.diagnostics);
  assert.equal(result.report.status, "failed");
});

test("real npm's silent HTTP 404 cannot become a clean report", async () => {
  const result = await queryRegistryFixture("missing");
  assert.equal(result.report.npmExitCode, 0);
  assert.deepEqual(result.raw, {});
  assert.equal(result.exitCode, 1, result.diagnostics);
  assert.equal(result.report.status, "failed");
});

test("a partial npm report is retained but marked failed", async () => {
  const result = await queryRegistryFixture("partial");
  assert.equal(result.report.npmExitCode, 1);
  assert.equal(result.raw["other-dependency"].latest, "2.0.0");
  assert.equal(result.exitCode, 1, result.diagnostics);
  assert.equal(result.report.status, "failed");
});

test("npm's silent ETARGET cannot become a clean report", async () => {
  const result = await queryRegistryFixture("no-matching-version");
  assert.equal(result.report.npmExitCode, 0);
  assert.deepEqual(result.raw, {});
  assert.equal(result.exitCode, 1, result.diagnostics);
  assert.equal(result.report.status, "failed");
});
