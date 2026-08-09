/**
 * Prerenders routes of the production build into static HTML.
 *
 * Runs after `react-scripts build`: serves build/ over loopback HTTP, loads each
 * route in headless Chrome, waits for the DOM to settle, then splices the
 * rendered #root markup back into the built index.html shell.
 *
 * Only #root's innerHTML is captured, never the whole document. That keeps the
 * <head> exactly as CRA emitted it, and it is what makes body-level portals safe:
 * React clears #root when it mounts but would never clean up stale nodes
 * elsewhere in <body>, so a captured portal (the print-only resume sheet) would
 * survive as a duplicate.
 */
import { createReadStream } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import puppeteer from "puppeteer";

const BUILD_DIR = resolve(fileURLToPath(new URL("../build", import.meta.url)));
const ROUTES = ["/"];
const PRERENDER_LOCALE = "zh-TW";
const PRERENDER_TIMEZONE = "Asia/Taipei";
const ROOT_PLACEHOLDER = '<div id="root"></div>';
const DOM_IDLE_MS = 1_000;
const DOM_SETTLE_TIMEOUT_MS = 60_000;
const MIN_VISIBLE_TEXT_CHARS = 500;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

function startStaticServer(shell) {
  const server = createServer(async (request, response) => {
    const { pathname } = new URL(request.url, "http://localhost");
    const requested = resolve(join(BUILD_DIR, normalize(decodeURIComponent(pathname))));
    const isAssetRequest =
      extname(requested) !== "" &&
      (requested === BUILD_DIR || requested.startsWith(BUILD_DIR + sep)) &&
      (await isFile(requested));

    if (!isAssetRequest) {
      response.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      });
      response.end(shell);
      return;
    }

    response.writeHead(200, {
      "Content-Type": MIME_TYPES[extname(requested)] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    createReadStream(requested).pipe(response);
  });

  return new Promise((resolveListening, rejectListening) => {
    server.once("error", rejectListening);
    server.listen(0, "127.0.0.1", () => resolveListening(server));
  });
}

function waitForDomIdle(page, idleMs, timeoutMs) {
  return page.evaluate(
    (idle, timeout) =>
      new Promise((resolveIdle, rejectIdle) => {
        let idleTimer;

        const hardTimer = setTimeout(() => {
          observer.disconnect();
          clearTimeout(idleTimer);
          rejectIdle(new Error(`DOM still mutating after ${timeout}ms`));
        }, timeout);

        const settle = () => {
          observer.disconnect();
          clearTimeout(hardTimer);
          resolveIdle();
        };

        const restart = () => {
          clearTimeout(idleTimer);
          idleTimer = setTimeout(settle, idle);
        };

        const observer = new MutationObserver(restart);
        observer.observe(document.documentElement, {
          attributes: true,
          characterData: true,
          childList: true,
          subtree: true,
        });
        restart();
      }),
    idleMs,
    timeoutMs,
  );
}

async function snapshot(page, origin, route) {
  const failures = [];
  const onPageError = (error) => failures.push(`uncaught: ${error.message}`);
  const onConsole = (message) => {
    if (message.type() === "error") failures.push(`console: ${message.text()}`);
  };

  page.on("pageerror", onPageError);
  page.on("console", onConsole);

  try {
    const response = await page.goto(`${origin}${route}`, {
      waitUntil: "networkidle0",
    });
    if (!response?.ok()) {
      throw new Error(`${route} responded ${response?.status()}`);
    }

    const locale = await page.evaluate(() => navigator.language);
    if (locale !== PRERENDER_LOCALE) {
      throw new Error(
        `Browser locale is "${locale}" but the snapshot must be "${PRERENDER_LOCALE}". ` +
          `The locale override did not apply, so the wrong language would be indexed.`,
      );
    }

    await waitForDomIdle(page, DOM_IDLE_MS, DOM_SETTLE_TIMEOUT_MS);

    const rootHtml = await page.$eval("#root", (root) => root.innerHTML);
    if (!rootHtml.trim()) {
      throw new Error(`${route} rendered an empty #root`);
    }
    if (failures.length > 0) {
      throw new Error(`${route} logged errors:\n  ${failures.join("\n  ")}`);
    }
    return rootHtml;
  } finally {
    page.off("pageerror", onPageError);
    page.off("console", onConsole);
  }
}

function assertSnapshotHasContent(rootHtml, route) {
  const visibleText = rootHtml
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (visibleText.length < MIN_VISIBLE_TEXT_CHARS) {
    throw new Error(
      `${route} rendered only ${visibleText.length} characters of visible text, ` +
        `expected at least ${MIN_VISIBLE_TEXT_CHARS}. The snapshot is what crawlers ` +
        `read, so a thin one defeats the point of prerendering.\n` +
        `Got: ${JSON.stringify(visibleText.slice(0, 200))}`,
    );
  }
  return visibleText.length;
}

async function main() {
  const shellPath = join(BUILD_DIR, "index.html");
  const shell = await readFile(shellPath, "utf8");
  if (!shell.includes(ROOT_PLACEHOLDER)) {
    throw new Error(
      `${shellPath} has no empty ${ROOT_PLACEHOLDER}. Run "react-scripts build" first.`,
    );
  }

  const server = await startStaticServer(shell);
  const origin = `http://127.0.0.1:${server.address().port}`;

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    const cdp = await page.createCDPSession();
    await cdp.send("Network.enable");
    await cdp.send("Network.setUserAgentOverride", {
      userAgent: await browser.userAgent(),
      acceptLanguage: PRERENDER_LOCALE,
    });

    await page.emulateTimezone(PRERENDER_TIMEZONE);

    for (const route of ROUTES) {
      const startedAt = process.hrtime.bigint();
      const rootHtml = await snapshot(page, origin, route);

      const outputPath =
        route === "/" ? shellPath : join(BUILD_DIR, normalize(route), "index.html");
      const html = shell.replace(
        ROOT_PLACEHOLDER,
        () => `<div id="root">${rootHtml}</div>`,
      );

      const textLength = assertSnapshotHasContent(rootHtml, route);

      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, html, "utf8");

      const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
      console.log(
        `prerendered ${route} -> ${outputPath.slice(BUILD_DIR.length + 1)} ` +
          `(${(rootHtml.length / 1024).toFixed(1)} kB markup, ${textLength} chars of ` +
          `text, ${(elapsedMs / 1000).toFixed(1)}s)`,
      );
    }
  } finally {
    await browser.close();
    server.close();
  }
}

await main();
