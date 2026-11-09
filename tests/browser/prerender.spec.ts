import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import { test } from "../helpers/fixtures";

async function runSession(options: string) {
  const directory = await mkdtemp(join(tmpdir(), "prerender-lifecycle-"));
  try {
    await writeFile(join(directory, "index.html"), '<div id="root"></div>');
    const source = `import { prerender } from ${JSON.stringify(new URL("../../scripts/prerender.mts", import.meta.url).href)};
      try { await prerender({ buildDirectory: process.argv[1], ${options} }); }
      catch (error) { console.error(error); process.exitCode = 1; }`;
    return await new Promise<{ code: number | null; output: string }>(
      (resolveResult, rejectResult) => {
        const child = spawn(
          process.execPath,
          ["--input-type=module", "-e", source, directory],
          { stdio: ["ignore", "pipe", "pipe"] },
        );
        let output = "";
        child.stdout.on("data", (chunk) => {
          output += chunk;
        });
        child.stderr.on("data", (chunk) => {
          output += chunk;
        });
        const timer = setTimeout(() => {
          child.kill("SIGKILL");
          rejectResult(
            new Error(`Prerender leaked resources or exceeded its deadline: ${output}`),
          );
        }, 5000);
        child.once("error", (error) => {
          clearTimeout(timer);
          rejectResult(error);
        });
        child.once("close", (code) => {
          clearTimeout(timer);
          resolveResult({ code, output });
        });
      },
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("browser launch failure closes the listening static server", async () => {
  const result = await runSession(
    'launchBrowser: async () => { throw new Error("launch failure"); }',
  );
  assert.equal(result.code, 1);
  assert.match(result.output, /launching browser: launch failure/);
});

test("browser close failure preserves the stage failure and still closes the server", async () => {
  const result = await runSession(`launchBrowser: async () => ({
    newPage: async () => { throw new Error("page failure"); },
    close: async () => { throw new Error("close failure"); },
    process: () => ({ kill: () => console.log("browser process killed") }),
  })`);
  assert.equal(result.code, 1);
  assert.match(result.output, /configuring browser: page failure/);
  assert.match(result.output, /cleanup failed: close failure/);
  assert.match(result.output, /browser process killed/);
});

test("the overall deadline interrupts a stuck stage and bounds stuck browser cleanup", async () => {
  const result = await runSession(`timeoutMs: 500, cleanupTimeoutMs: 50,
    launchBrowser: async () => ({
      newPage: () => new Promise(() => {}),
      close: () => new Promise(() => {}),
      process: () => ({ kill: () => console.log("browser process killed") }),
    })`);
  assert.equal(result.code, 1);
  assert.match(result.output, /timed out after 500ms during configuring browser/);
  assert.match(result.output, /Browser cleanup timed out/);
  assert.match(result.output, /browser process killed/);
});

test("a browser returned after the deadline is closed without starting another stage", async () => {
  const result = await runSession(`timeoutMs: 500, cleanupTimeoutMs: 50,
    launchBrowser: () => new Promise((resolveBrowser) => setTimeout(() => resolveBrowser({
      close: async () => console.log("late browser closed"),
      process: () => null,
      newPage: async () => { throw new Error("must not start a page after timeout"); },
    }), 1000))`);
  assert.equal(result.code, 1);
  assert.match(result.output, /timed out after 500ms during launching browser/);
  assert.match(result.output, /late browser closed/);
  assert.doesNotMatch(result.output, /must not start a page after timeout/);
});
