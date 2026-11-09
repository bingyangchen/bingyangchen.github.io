import type { Browser, LaunchOptions } from "puppeteer";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";
import { watchPageResources } from "./browser-resources.mts";
import { startStaticServer } from "./static-server.mts";
import { closeBrowser } from "./prerender/browser.mts";
import { generateResumePdf } from "./prerender/resume.mts";
import { assertSnapshotHasContent, snapshot } from "./prerender/snapshot.mts";
import { PRERENDER_LOCALE, PRERENDER_TIMEZONE } from "./prerender/settings.mts";

const BUILD_DIR = fileURLToPath(new URL("../build", import.meta.url));
const ROOT_PLACEHOLDER = '<div id="root"></div>';
const PRERENDER_TIMEOUT_MS = 120_000;
const CLEANUP_TIMEOUT_MS = 5_000;

export async function prerender({
  buildDirectory = BUILD_DIR,
  timeoutMs = PRERENDER_TIMEOUT_MS,
  cleanupTimeoutMs = CLEANUP_TIMEOUT_MS,
  launchBrowser = (options) => puppeteer.launch(options),
}: {
  buildDirectory?: string;
  timeoutMs?: number;
  cleanupTimeoutMs?: number;
  launchBrowser?: (options: LaunchOptions) => Promise<Browser>;
} = {}) {
  let stage = "reading shell";
  let browser: Browser | undefined;
  let server: Awaited<ReturnType<typeof startStaticServer>> | undefined;
  let resources: Awaited<ReturnType<typeof watchPageResources>> | undefined;
  const failures = [];
  const controller = new AbortController();
  const runStage = async <T,>(
    name: string,
    operation: () => Promise<T>,
  ): Promise<T> => {
    controller.signal.throwIfAborted();
    stage = name;
    try {
      const result = await operation();
      controller.signal.throwIfAborted();
      return result;
    } catch (cause) {
      throw new Error(
        `Prerender failed during ${name}: ${cause instanceof Error ? cause.message : String(cause)}`,
        { cause },
      );
    }
  };
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error(
        `Prerender timed out after ${timeoutMs}ms during ${stage}`,
      );
      reject(error);
      controller.abort(error);
    }, timeoutMs);
  });
  const render = async () => {
    const shellPath = join(buildDirectory, "index.html");
    const shell = await runStage("reading shell", async () => {
      const shell = await readFile(shellPath, "utf8");
      if (!shell.includes(ROOT_PLACEHOLDER))
        throw new Error(
          `${shellPath} has no empty ${ROOT_PLACEHOLDER}. Run "vite build" first.`,
        );
      return shell;
    });
    await runStage("starting static server", async () => {
      server = await startStaticServer(buildDirectory, {
        shell,
        shellRoutes: ["/", "/resume"],
      });
      if (controller.signal.aborted) await server.close();
    });
    await runStage("launching browser", async () => {
      browser = await launchBrowser({
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
        signal: controller.signal,
        timeout: timeoutMs,
      });
      if (controller.signal.aborted) await closeBrowser(browser, cleanupTimeoutMs);
    });
    const page = await runStage("configuring browser", async () => {
      const page = await browser!.newPage();
      resources = await watchPageResources(page);
      await page.setViewport({ width: 1440, height: 900 });
      const cdp = await page.createCDPSession();
      await cdp.send("Network.enable");
      await cdp.send("Network.setUserAgentOverride", {
        userAgent: await browser!.userAgent(),
        acceptLanguage: PRERENDER_LOCALE,
      });
      await page.emulateTimezone(PRERENDER_TIMEZONE);
      await page.emulateMediaFeatures([
        { name: "prefers-reduced-motion", value: "reduce" },
      ]);
      return page;
    });
    const { rootHtml, textLength } = await runStage("capturing homepage", async () => {
      const rootHtml = await snapshot(page, server!.origin, "/", resources!);
      return { rootHtml, textLength: assertSnapshotHasContent(rootHtml, "/") };
    });
    const pdf = await runStage("generating and validating resume PDF", () =>
      generateResumePdf(page, server!.origin, resources!),
    );
    await runStage("writing static output", async () => {
      await writeFile(
        shellPath,
        shell.replace(ROOT_PLACEHOLDER, () => `<div id="root">${rootHtml}</div>`),
        { encoding: "utf8", signal: controller.signal },
      );
      await writeFile(join(buildDirectory, "resume.pdf"), pdf, {
        signal: controller.signal,
      });
    });
    console.log(
      `prerendered / (${textLength} chars of text); generated resume.pdf (${(pdf.length / 1024).toFixed(1)} kB, one English A4 page)`,
    );
  };
  try {
    await Promise.race([render(), deadline]);
  } catch (error) {
    failures.push(error);
  } finally {
    clearTimeout(timer);
    try {
      resources?.stop();
    } catch (error) {
      failures.push(error);
    }
    const cleanup = await Promise.allSettled([
      closeBrowser(browser, cleanupTimeoutMs),
      server?.close(),
    ]);
    for (const result of cleanup)
      if (result.status === "rejected")
        failures.push(
          new Error(`Prerender cleanup failed: ${result.reason.message}`, {
            cause: result.reason,
          }),
        );
  }
  if (failures.length === 1) throw failures[0];
  if (failures.length)
    throw new AggregateError(failures, "Prerender failed and cleanup also failed");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await prerender();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
