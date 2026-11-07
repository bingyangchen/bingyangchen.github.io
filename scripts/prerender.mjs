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
const RESUME_PDF_FONT_NAMES = [
  "Georgia",
  "Georgia-Bold",
  "Georgia-Italic",
  "NotoSerifTC-Bold",
];

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
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

async function generateResumePdf(page, origin) {
  const failures = [];
  const onPageError = (error) => failures.push(error.message);
  const onConsole = (message) => {
    if (message.type() === "error") failures.push(message.text());
  };
  page.on("pageerror", onPageError);
  page.on("console", onConsole);
  try {
    const response = await page.goto(`${origin}/resume`, { waitUntil: "networkidle0" });
    if (!response?.ok()) throw new Error(`Resume responded ${response?.status()}`);
    await page.emulateMediaType("print");
    await page.evaluate(async (minimumTextLength) => {
      const sheets = document.querySelectorAll("[data-resume-root]");
      if (sheets.length !== 1) throw new Error("Expected one resume sheet");
      await document.fonts.ready;
      if (Array.from(document.fonts).some((font) => font.status === "error"))
        throw new Error("Resume font failed to load");
      const sheet = sheets[0];
      await Promise.all(
        Array.from(sheet.querySelectorAll("img"), (image) => image.decode()),
      );
      if (sheet.innerText.trim().length < minimumTextLength)
        throw new Error("Resume has insufficient content");
      const bounds = sheet.getBoundingClientRect();
      const walker = document.createTreeWalker(sheet, NodeFilter.SHOW_TEXT);
      for (let text = walker.nextNode(); text; text = walker.nextNode()) {
        if (!text.textContent.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(text);
        const rectangles = Array.from(range.getClientRects());
        if (
          rectangles.length === 0 ||
          rectangles.some(
            (rect) =>
              rect.left < bounds.left - 1 ||
              rect.right > bounds.right + 1 ||
              rect.top < bounds.top - 1 ||
              rect.bottom > bounds.bottom + 1,
          )
        )
          throw new Error(`Resume content overflows A4: ${text.textContent.trim()}`);
      }
      document.documentElement.lang = "en";
    }, MIN_VISIBLE_TEXT_CHARS);
    const pdf = Buffer.from(
      await page.pdf({ preferCSSPageSize: true, printBackground: true }),
    );
    if (failures.length) throw new Error(`Resume failed: ${failures.join("; ")}`);

    // These checks target Chromium's output, not arbitrary uploaded PDF files.
    const content = pdf.toString("latin1");
    const pages = content.match(/\/Type\s*\/Page\b/g)?.length;
    const dimensions = content
      .match(/\/MediaBox\s*\[([^\]]+)\]/)?.[1]
      .trim()
      .split(/\s+/)
      .map(Number);
    if (
      !content.startsWith("%PDF-") ||
      !content.trimEnd().endsWith("%%EOF") ||
      pages !== 1 ||
      !dimensions ||
      dimensions.length !== 4 ||
      !dimensions.every(Number.isFinite) ||
      Math.abs(dimensions[2] - 595) > 2 ||
      Math.abs(dimensions[3] - 842) > 2 ||
      !/\/Lang\s*\(en\)/.test(content)
    )
      throw new Error("Invalid resume PDF: expected one English A4 page");
    const fontNames = new Set(
      Array.from(
        content.matchAll(/\/(?:BaseFont|FontName)\s*\/(?:[A-Z]{6}\+)?([A-Za-z0-9-]+)/g),
        (match) => match[1],
      ),
    );
    if (
      fontNames.size !== RESUME_PDF_FONT_NAMES.length ||
      RESUME_PDF_FONT_NAMES.some((fontName) => !fontNames.has(fontName))
    )
      throw new Error(
        `Unexpected resume PDF fonts: ${Array.from(fontNames).join(", ")}. ` +
          `Expected Georgia and the bundled Noto Serif TC subset.`,
      );
    await writeFile(join(BUILD_DIR, "resume.pdf"), pdf);
    console.log(
      `generated resume.pdf (${(pdf.length / 1024).toFixed(1)} kB, one A4 page)`,
    );
  } finally {
    await page.emulateMediaType("screen");
    page.off("pageerror", onPageError);
    page.off("console", onConsole);
  }
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

    // Capturing only #root preserves shell metadata and excludes body-level portals.
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

  let browser;
  try {
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    const cdp = await page.createCDPSession();
    await cdp.send("Network.enable");
    await cdp.send("Network.setUserAgentOverride", {
      userAgent: await browser.userAgent(),
      acceptLanguage: PRERENDER_LOCALE,
    });

    await page.emulateTimezone(PRERENDER_TIMEZONE);
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);

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
    await generateResumePdf(page, origin);
  } finally {
    await browser?.close();
    server.close();
  }
}

await main();
