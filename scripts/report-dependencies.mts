import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

type QueryResult = {
  status: "current" | "outdated" | "failed";
  packageCount: number;
  message: string;
};

const QUERY_TIMEOUT_MS = 180_000;
const MAX_OUTPUT_BYTES = 10 * 1024 * 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseOutdatedResult(
  stdout: string,
  stderr: string,
  exitCode: number | null,
): QueryResult {
  const failed = (message: string): QueryResult => ({
    status: "failed",
    packageCount: 0,
    message,
  });

  // npm silently skips E403 and E404; its HTTP log is needed to reject partial reports.
  if (/^npm http fetch .*\s(?:403|404)\s/m.test(stderr)) {
    return failed("A package registry request returned HTTP 403 or 404.");
  }
  if (exitCode !== 0 && exitCode !== 1) {
    return failed(`npm outdated did not complete (exit code ${exitCode}).`);
  }

  let packages: unknown;
  try {
    packages = JSON.parse(stdout);
  } catch {
    return failed("npm outdated did not return valid JSON.");
  }
  if (!isRecord(packages)) {
    return failed("npm outdated did not return a package report.");
  }
  for (const entry of Object.values(packages)) {
    const rows = Array.isArray(entry) ? entry : [entry];
    if (
      rows.length === 0 ||
      rows.some(
        (row) =>
          !isRecord(row) ||
          ![row.current, row.wanted, row.latest].every(
            (version) => typeof version === "string" && version.length > 0,
          ),
      )
    ) {
      return failed("npm outdated returned an error or an incomplete package row.");
    }
  }

  const packageCount = Object.keys(packages).length;
  if (exitCode !== (packageCount === 0 ? 0 : 1)) {
    return failed("npm outdated exit code and package report disagree.");
  }
  return {
    status: packageCount === 0 ? "current" : "outdated",
    packageCount,
    message:
      packageCount === 0
        ? "npm reported no outdated direct dependencies."
        : `npm reported ${packageCount} outdated direct dependencies.`,
  };
}

if (import.meta.main) {
  const directory = resolve(process.argv[2] ?? "dependency-report");
  mkdirSync(directory, { recursive: true });
  const manifest = JSON.parse(readFileSync("package.json", "utf8"));
  const deadline = Date.now() + QUERY_TIMEOUT_MS;
  const args = [
    "outdated",
    "--json",
    "--long",
    "--all=false",
    "--include=dev",
    "--loglevel=http",
  ];
  const query = spawnSync("npm", args, {
    encoding: "utf8",
    timeout: QUERY_TIMEOUT_MS,
    maxBuffer: MAX_OUTPUT_BYTES,
  });
  const stdout = query.stdout ?? "";
  const stderr = query.stderr ?? "";
  let result: QueryResult = query.error
    ? { status: "failed", packageCount: 0, message: query.error.message }
    : parseOutdatedResult(stdout, stderr, query.status);
  const unreportedPackages = [];
  if (result.status !== "failed") {
    const packages = JSON.parse(stdout);
    for (const [name, range] of Object.entries({
      ...manifest.dependencies,
      ...manifest.devDependencies,
    })) {
      if (Object.hasOwn(packages, name)) continue;

      // npm also skips ETARGET without logging it, so absent rows need a strict range lookup.
      const verification = spawnSync(
        "npm",
        ["view", `${name}@${range}`, "version", "--json", "--prefer-online"],
        {
          encoding: "utf8",
          timeout: Math.max(1, deadline - Date.now()),
          maxBuffer: MAX_OUTPUT_BYTES,
        },
      );
      unreportedPackages.push({
        name,
        range,
        npmExitCode: verification.status,
        stdout: verification.stdout ?? "",
        stderr: verification.stderr ?? "",
        error: verification.error?.message ?? null,
      });
      let versions: unknown;
      try {
        versions = JSON.parse(verification.stdout ?? "");
      } catch {
        versions = null;
      }
      const rows = Array.isArray(versions) ? versions : [versions];
      if (
        verification.status !== 0 ||
        verification.error ||
        rows.length === 0 ||
        !rows.every((version) => typeof version === "string" && version.length > 0)
      ) {
        result = {
          status: "failed",
          packageCount: 0,
          message: `Could not verify the unreported dependency ${name}.`,
        };
        break;
      }
    }
  }
  const report = {
    ...result,
    generatedAt: new Date().toISOString(),
    commit: process.env.GITHUB_SHA ?? null,
    nodeVersion: process.version,
    packageManager: manifest.packageManager,
    lockfileSha256: createHash("sha256")
      .update(readFileSync("package-lock.json"))
      .digest("hex"),
    command: ["npm", ...args],
    npmExitCode: query.status,
    signal: query.signal,
  };
  const summary = `## Dependency report\n\nResult: **${report.status}**\n\n${report.message}\n\nDownload the dependency-report artifact for the original JSON, npm HTTP log, and query metadata. Outdated versions are not vulnerability findings.\n`;
  writeFileSync(resolve(directory, "outdated.json"), stdout);
  writeFileSync(resolve(directory, "npm-stderr.log"), stderr);
  writeFileSync(
    resolve(directory, "unreported-packages.json"),
    `${JSON.stringify(unreportedPackages, null, 2)}\n`,
  );
  writeFileSync(
    resolve(directory, "result.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  writeFileSync(resolve(directory, "summary.md"), summary);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  }
  console.log(summary);
  process.exitCode = result.status === "failed" ? 1 : 0;
}
