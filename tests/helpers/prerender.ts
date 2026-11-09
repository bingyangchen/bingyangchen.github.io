import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";

export async function runPrerenderFixture(script: string) {
  const directory = await mkdtemp(join(tmpdir(), "prerender-failure-"));
  try {
    await mkdir(join(directory, "build"));
    await writeFile(
      join(directory, "build/index.html"),
      `<html><head><link rel="icon" href="data:,"></head><body><div id="root"></div><script>${script}</script></body></html>`,
    );
    return await new Promise<{ code: number | null; output: string }>(
      (resolveResult, rejectResult) => {
        const child = spawn(
          process.execPath,
          [
            "--input-type=module",
            "-e",
            `import { prerender } from ${JSON.stringify(new URL("../../scripts/prerender.mts", import.meta.url).href)}; await prerender({ buildDirectory: process.argv[1] });`,
            join(directory, "build"),
          ],
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
          rejectResult(new Error("prerender fixture timed out"));
        }, 30000);
        child.once("error", (error) => {
          clearTimeout(timer);
          rejectResult(error);
        });
        child.once("exit", (code) => {
          clearTimeout(timer);
          resolveResult({ code, output });
        });
      },
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
