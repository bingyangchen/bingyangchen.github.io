import assert from "node:assert/strict";
import { before, after, beforeEach, afterEach, test } from "node:test";
import {
  readFile,
  stat,
  mkdtemp,
  mkdir,
  copyFile,
  writeFile,
  symlink,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import puppeteer from "puppeteer";
import { startStaticServer } from "../../scripts/serve-build.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const BUILD = resolve(ROOT, "build");
const DETAIL = '#projects [role="tabpanel"]:not([inert])';
const TABS = '#projects [role="tab"]';
const QR = '[class*="qr_avatar_fab"]';
const AVATAR = '#home button[class*="avatar_button"]';
const QR_DIALOG = 'dialog[aria-labelledby="qr-modal-title"]';
let server;
let browser;
let context;
let page;
let pageErrors;

before(async () => {
  await stat(join(BUILD, "index.html"));
  server = await startStaticServer(BUILD);
  browser = await puppeteer.launch({
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",

      // Headless input defaults differ across hosts; start with a desktop mouse.
      "--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4",
    ],
  });
});

after(async () => {
  await browser?.close();
  await server?.close();
});

beforeEach(async () => {
  context = await browser.createBrowserContext();
  page = await context.newPage();
  pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluateOnNewDocument(() =>
    Object.defineProperty(navigator, "language", { get: () => "en-US" }),
  );
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (
      new URL(request.url()).origin === server.origin ||
      request.url().startsWith("data:")
    )
      void request.continue();
    else
      void request.respond({
        status: 200,
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"/>',
      });
  });
});

afterEach(async () => {
  await context?.close();
  assert.deepEqual(pageErrors, [], "uncaught browser errors");
});

async function openHome(hash = "") {
  const response = await page.goto(server.origin + "/" + hash, {
    waitUntil: "networkidle0",
  });
  assert.equal(response.status(), 200);
  await page.waitForFunction(
    () =>
      document.documentElement.lang === "en" &&
      document.querySelector("#home a[download]"),
  );
}

async function selectProject(index = 1) {
  await page.$eval(`${TABS}:nth-child(${index})`, (element) => {
    const rect = element.getBoundingClientRect();
    const headerBottom = document
      .querySelector("header")
      .getBoundingClientRect().bottom;
    if (rect.top < headerBottom || rect.bottom > window.innerHeight)
      element.scrollIntoView({ block: "center", behavior: "instant" });
  });
  await settleMotion();
  await page.click(`${TABS}:nth-child(${index})`);
  await page.waitForFunction(
    (selector) =>
      document.querySelector(selector).getAttribute("aria-selected") === "true",
    {},
    `${TABS}:nth-child(${index})`,
  );
}

async function assertHoverCapability(expected) {
  assert.equal(
    await page.evaluate(() => matchMedia("(hover: hover)").matches),
    expected,
    "Hover capability must match the test input device",
  );
}

async function enterPreview() {
  await page.evaluate(() => {
    window.history.pushState({}, "", "/resume");
    dispatchEvent(new PopStateEvent("popstate"));
  });
  await page.waitForSelector('[class*="resumePage"]');
}

async function dragText(selector) {
  await page.$eval(selector, (element) =>
    element.scrollIntoView({ block: "center", behavior: "instant" }),
  );
  await settleMotion();
  const selection = await page.$eval(selector, (element) => {
    window.getSelection().removeAllRanges();
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let text = walker.nextNode();
    while (text && !text.textContent.trim()) text = walker.nextNode();
    const start = text.textContent.search(/\S/);
    const end = Math.min(start + 8, text.textContent.length);
    const range = document.createRange();
    range.setStart(text, start);
    range.setEnd(text, start + 1);
    const first = range.getBoundingClientRect();
    range.setStart(text, end - 1);
    range.setEnd(text, end);
    const last = range.getBoundingClientRect();
    return {
      start: { x: first.left + 0.1, y: first.top + first.height / 2 },
      end: { x: last.right - 0.1, y: last.top + last.height / 2 },
      text: text.textContent.slice(start, end),
    };
  });
  await page.mouse.move(selection.start.x, selection.start.y);
  await page.mouse.down();
  await page.mouse.move(selection.end.x, selection.end.y, { steps: 16 });
  await page.mouse.up();
  return selection.text;
}

async function getPrintResult() {
  await page.emulateMediaType("print");
  await page.waitForFunction(
    () =>
      getComputedStyle(document.querySelector("[data-language-switcher]"))
        .visibility === "hidden",
  );
  await page.evaluate(() => document.fonts.ready);
  const metrics = await page.$eval("[data-resume-root]", (sheet) => ({
    text: sheet.innerText,
    height: sheet.getBoundingClientRect().height,
    bottom:
      sheet.lastElementChild.getBoundingClientRect().bottom -
      sheet.getBoundingClientRect().top,
    visible: getComputedStyle(sheet).visibility,
    count: document.querySelectorAll("[data-resume-root]").length,
    header: getComputedStyle(document.querySelector("header")).display,
    footer: getComputedStyle(document.querySelector("footer")).display,
    language: getComputedStyle(document.querySelector("[data-language-switcher]"))
      .visibility,
  }));
  const pdf = Buffer.from(
    await page.pdf({ preferCSSPageSize: true, printBackground: true }),
  );
  await page.emulateMediaType("screen");
  return { metrics, ...parsePdfMetadata(pdf) };
}

function parsePdfMetadata(pdf) {
  return {
    fonts: Array.from(
      new Set(
        Array.from(
          pdf
            .toString("latin1")
            .matchAll(/\/(?:BaseFont|FontName)\s*\/(?:[A-Z]{6}\+)?([A-Za-z0-9-]+)/g),
          (match) => match[1],
        ),
      ),
    ).sort(),
    pages: pdf.toString("latin1").match(/\/Type\s*\/Page\b/g)?.length,
    mediaBox: pdf.toString("latin1").match(/\/MediaBox\s*\[([^\]]+)\]/)?.[1],
    language: pdf
      .toString("latin1")
      .match(/\/Type\s*\/Catalog\b[\s\S]*?\/Lang\s*\(([^)]+)\)/)?.[1],
    links: Array.from(
      pdf.toString("latin1").matchAll(/\/URI\s*\(([^)]+)\)/g),
      (match) => match[1],
    ).sort(),
  };
}

test("SITE-R1.1 SITE-R1.2 SITE-R7.1 公開首頁與初始作品", async () => {
  await openHome();
  assert.deepEqual(
    await page.$$eval("#home,#about,#projects,#blog", (elements) =>
      elements.map((element) => element.id),
    ),
    ["home", "about", "projects", "blog"],
  );
  assert.equal(
    await page.$$eval(
      ".site-layout > header,.site-layout > footer",
      (elements) => elements.length,
    ),
    2,
  );
  assert.deepEqual(
    await page.$$eval(TABS, (elements) =>
      elements.map((element) => element.textContent),
    ),
    ["Taigu", "Noads", "Leechai"],
  );
  assert.equal(
    await page.$eval(`${DETAIL} h3`, (element) => element.textContent),
    "Taigu",
  );
});

test("SITE-R1.3 非公開履歷與未知路徑不使用 SPA fallback", async () => {
  for (const path of ["/resume", "/resume/", "/missing"])
    assert.equal((await fetch(server.origin + path)).status, 404);
  await openHome();
  assert.equal(await page.$('a[href="/resume"]'), null);
});

test("SITE-R1.4 SITE-R12.4 非公開本機預覽", async () => {
  await openHome();
  await enterPreview();
  assert.equal(await page.$eval("h1", (element) => element.textContent), "Resume");
  assert.equal(
    await page.$$eval("[data-resume-root]", (elements) => elements.length),
    1,
  );
  assert.ok(await page.$("button"));
});

test("SITE-R2.1 SITE-R2.2 導覽與自然捲動", async () => {
  await openHome();
  const initialLength = await page.evaluate(() => window.history.length);
  await page.click('[class*="nav_links"] a[href="#about"]');
  await page.waitForFunction(
    () =>
      Math.abs(
        document.getElementById("about").getBoundingClientRect().top -
          document.querySelector("header").getBoundingClientRect().bottom,
      ) < 2,
  );
  assert.equal(await page.evaluate(() => window.location.hash), "#about");
  assert.equal(await page.evaluate(() => window.history.length), initialLength + 1);
  await page.evaluate(() =>
    document.getElementById("projects").scrollIntoView({ behavior: "instant" }),
  );
  await page.waitForFunction(() => window.location.hash === "#projects");
  assert.equal(await page.evaluate(() => window.history.length), initialLength + 1);
  await page.waitForNetworkIdle({ idleTime: 250 });
  await page.goBack({ waitUntil: "networkidle0" });
  await page.waitForFunction(() => window.scrollY < 2);
});

test("SITE-R2.5 SITE-R2.6 常駐 Header 與 Logo 回頂端", async () => {
  await openHome();
  assert.notEqual(
    await page.$eval("header", (element) => getComputedStyle(element).display),
    "none",
  );
  assert.equal(
    await page.$$eval('header nav a[href^="#"]', (elements) => elements.length),
    3,
  );
  await page.click('header a[href="#projects"]');
  await waitForSection("projects");
  await page.click('header a[href="#home"]');
  await page.waitForFunction(() => window.scrollY < 2);
  assert.equal(
    await page.$eval('header a[aria-current="location"]', (element) =>
      element.getAttribute("aria-label"),
    ),
    "Bing-Yang Chen",
  );
  assert.equal(
    await page.$eval(
      'header a[href="#home"] img',
      (element) => element.complete && element.naturalWidth > 0,
    ),
    true,
  );
  assert.equal(
    await page.$eval('header a[href="#home"]', (element) => element.textContent.trim()),
    "",
  );
});

async function waitForSection(id) {
  await page.waitForFunction(
    (section) => {
      const element = document.getElementById(section);
      const top = element.getBoundingClientRect().top + window.scrollY;
      const header = document.querySelector("header").getBoundingClientRect().bottom;
      const destination = Math.max(
        0,
        Math.min(
          section === "home" ? 0 : top - header,
          document.documentElement.scrollHeight - window.innerHeight,
        ),
      );
      return (
        window.location.hash === `#${section}` &&
        Math.abs(window.scrollY - destination) < 2
      );
    },
    {},
    id,
  );
}

test("SITE-R2.3 返回與前進保留區塊落點", async () => {
  await openHome();
  await page.click('header a[href="#projects"]');
  await waitForSection("projects");
  await page.click('header a[href="#blog"]');
  await waitForSection("blog");
  await page.evaluate(() =>
    window.addEventListener(
      "popstate",
      () => window.dispatchEvent(new Event("scrollend")),
      { once: true },
    ),
  );
  await page.goBack({ waitUntil: "networkidle0" });
  await waitForSection("projects");
  await page.goBack({ waitUntil: "networkidle0" });
  await page.waitForFunction(() => window.scrollY < 2);
  await page.goForward({ waitUntil: "networkidle0" });
  await waitForSection("projects");
  await page.click('header a[href="#about"]');
  await waitForSection("about");
  await page.evaluate(() => window.scrollBy({ top: 240, behavior: "instant" }));
  const readingPosition = await page.evaluate(() => window.scrollY);
  await page.click('header a[href="#projects"]');
  await waitForSection("projects");
  await page.goBack({ waitUntil: "networkidle0" });
  await page.waitForFunction(
    (top) => Math.abs(window.scrollY - top) < 2 && window.location.hash === "#about",
    {},
    readingPosition,
  );
  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForFunction(
    (top) => Math.abs(window.scrollY - top) < 2,
    {},
    readingPosition,
  );
});

test("SITE-R2.4 Hash 直接開啟與重載避開 Header", async () => {
  for (const section of ["home", "about", "projects", "blog"]) {
    await page.goto("about:blank");
    await openHome(`#${section}`);
    await waitForSection(section);
    await page.reload({ waitUntil: "networkidle0" });
    await waitForSection(section);
  }
});

test("SITE-R2.7 目前區塊與語言切換", async () => {
  await openHome();
  await page.$eval("#about", (element) =>
    element.scrollIntoView({ behavior: "instant" }),
  );
  await page.waitForSelector('header nav a[href="#about"][aria-current="location"]');
  await page.click("[data-language-switcher]");
  assert.equal(
    await page.$eval(
      'header nav a[aria-current="location"]',
      (element) => element.textContent,
    ),
    "簡歷",
  );
  assert.equal(
    await page.$$eval(
      'header [aria-current="location"]',
      (elements) => elements.length,
    ),
    1,
  );
});

test("SITE-R2.7 高視窗的最後區塊", async () => {
  await page.setViewport({ width: 1440, height: 2000 });
  await openHome();
  await page.click('header a[href="#blog"]');
  await waitForSection("blog");
  await page.waitForSelector('header nav a[href="#blog"][aria-current="location"]');
  assert.ok(
    await page.$eval(
      "#blog",
      (element) => element.getBoundingClientRect().top < window.innerHeight,
    ),
  );
  await page.reload({ waitUntil: "networkidle0" });
  await waitForSection("blog");
  await page.waitForSelector('header nav a[href="#blog"][aria-current="location"]');
  await page.click('header a[href="#home"]');
  await page.waitForFunction(() => window.scrollY < 2);
});

test("SITE-R2.8 SITE-R12.4 手機選單、焦點與收起入口", async () => {
  await page.setViewport({ width: 390, height: 844 });
  await openHome();
  const menu = 'header button[aria-controls="site-navigation"]';
  assert.equal(
    await page.$eval(
      "#site-navigation",
      (element) => getComputedStyle(element).display,
    ),
    "none",
  );
  await page.click(menu);
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => document.activeElement.getAttribute("href")),
    "#about",
  );
  await page.keyboard.press("Escape");
  assert.equal(
    await page.$eval(menu, (element) => element.getAttribute("aria-expanded")),
    "false",
  );
  assert.equal(
    await page.evaluate(() => document.activeElement.getAttribute("aria-controls")),
    "site-navigation",
  );
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await waitForSection("about");
  assert.equal(await page.evaluate(() => document.activeElement.id), "about");
  assert.equal(
    await page.$eval(menu, (element) => element.getAttribute("aria-expanded")),
    "false",
  );
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() =>
      document.querySelector("header").contains(document.activeElement),
    ),
    false,
  );
  await page.click(menu);
  await page.click("[data-language-switcher]");
  assert.equal(await page.$eval("html", (element) => element.lang), "zh-TW");
  assert.equal(
    await page.$eval(menu, (element) => element.getAttribute("aria-expanded")),
    "true",
  );
  await page.mouse.click(200, 500);
  assert.equal(
    await page.$eval(menu, (element) => element.getAttribute("aria-expanded")),
    "false",
  );
  await page.click(menu);
  await page.setViewport({ width: 1024, height: 844 });
  await page.waitForFunction(
    () =>
      document
        .querySelector("header button[aria-controls]")
        .getAttribute("aria-expanded") === "false",
  );
  await page.setViewport({ width: 390, height: 844 });
  assert.equal(
    await page.$eval(
      "#site-navigation",
      (element) => getComputedStyle(element).display,
    ),
    "none",
  );
  await page.setViewport({ width: 1024, height: 844 });
  await page.$eval('header a[href="#projects"]', (element) => element.focus());
  await page.setViewport({ width: 390, height: 844 });
  await page.waitForFunction(
    () => document.activeElement?.getAttribute("aria-controls") === "site-navigation",
  );
  await page.setViewport({ width: 1024, height: 844 });
  await page.waitForFunction(
    () => document.activeElement?.getAttribute("href") === "#home",
  );
});

test("SITE-R2.9 Header 對齊、觸控範圍與窄版組成", async () => {
  await openHome();
  for (const language of ["en", "zh-TW"]) {
    if ((await page.$eval("html", (element) => element.lang)) !== language)
      await page.$eval("[data-language-switcher]", (element) => element.click());
    for (const width of [320, 390, 720, 721, 1024, 1440, 1920, 2560]) {
      await page.setViewport({ width, height: 900 });
      if (width <= 720)
        await page.click('header button[aria-controls="site-navigation"]');
      const metrics = await page.$eval("header", (header) => {
        const inner = header.querySelector('[class*="inner"]').getBoundingClientRect();
        const identityLink = header.querySelector('a[href="#home"]');
        const identity = identityLink.getBoundingClientRect();
        const projects = document.querySelector("#projects > div");
        const links = [...header.querySelectorAll("nav a, nav button"), identityLink];
        return {
          width: header.getBoundingClientRect().width,
          innerWidth: inner.width,
          innerLeft: inner.left,
          identityLeft: identity.left,
          contentLeft:
            projects.getBoundingClientRect().left +
            parseFloat(getComputedStyle(projects).paddingLeft),
          targets: links.map((element) => element.getBoundingClientRect().height),
          overflow: links.some((element) => {
            const box = element.getBoundingClientRect();
            return box.left < 0 || box.right > window.innerWidth;
          }),
          languageCount: document.querySelectorAll("[data-language-switcher]").length,
        };
      });
      assert.equal(metrics.width, width);
      assert.equal(metrics.innerWidth, Math.min(width, 1280));
      assert.equal(metrics.innerLeft, (width - Math.min(width, 1280)) / 2);
      assert.equal(metrics.identityLeft, metrics.contentLeft);
      assert.equal(metrics.overflow, false);
      assert.ok(metrics.targets.every((height) => height >= 44));
      assert.equal(metrics.languageCount, 1);
      if (width <= 720) await page.keyboard.press("Escape");
    }
  }
});

test("SITE-R2.10 跳過導覽、主要內容與焦點提示", async () => {
  await openHome();
  assert.equal(await page.$$eval("main", (elements) => elements.length), 1);
  assert.equal(
    await page.$eval("header nav", (element) => element.getAttribute("aria-label")),
    "Main navigation",
  );
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => document.activeElement.textContent),
    "Skip to content",
  );
  assert.ok(
    await page.evaluate(
      () => getComputedStyle(document.activeElement).outlineWidth !== "0px",
    ),
  );
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => document.activeElement.id), "main-content");
});

test("SITE-R13.5 導覽減少動態", async () => {
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await page.setViewport({ width: 390, height: 844 });
  await openHome();
  await page.click('header button[aria-controls="site-navigation"]');
  assert.equal(
    await page.$eval(
      'header [class*="menu_icon"] > span',
      (element) => getComputedStyle(element).transitionDuration,
    ),
    "0s",
  );
  assert.equal(
    await page.$eval(
      "header nav a",
      (element) => getComputedStyle(element, "::after").transitionDuration,
    ),
    "0s",
  );
  assert.equal(
    await page.$eval("html", (element) => getComputedStyle(element).scrollBehavior),
    "auto",
  );
  await page.click('header a[href="#projects"]');
  assert.ok(
    await page.$eval(
      "#projects",
      (element) =>
        Math.abs(
          element.getBoundingClientRect().top -
            document.querySelector("header").getBoundingClientRect().bottom,
        ) < 2,
    ),
  );
});

test("SITE-R4.1 SITE-R4.2 雙向切換與 reload 持久化", async () => {
  await openHome();
  const toggle = "button[data-language-switcher]";
  await page.click(toggle);
  await page.waitForFunction(() => document.documentElement.lang === "zh-TW");
  assert.equal(
    await page.evaluate(() => localStorage.getItem("preferred_language")),
    "zh-TW",
  );
  await page.reload({ waitUntil: "networkidle0" });
  assert.equal(await page.$eval("h1", (element) => element.textContent), "陳秉洋");
  await page.click(toggle);
  await page.waitForFunction(() => document.documentElement.lang === "en");
});

test("SITE-R3.6 讀取儲存被拒絕時首頁仍可啟動", async () => {
  await page.evaluateOnNewDocument(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException("Storage access denied", "SecurityError");
    };
  });

  await openHome();
  assert.equal(
    await page.$eval("#home h1", (element) => element.textContent),
    "Bing-Yang Chen",
  );
  await page.click("[data-language-switcher]");
  await page.waitForFunction(() => document.documentElement.lang === "zh-TW");
  assert.equal(
    await page.$eval("#home h1", (element) => element.textContent),
    "陳秉洋",
  );

  await page.reload({ waitUntil: "networkidle0" });
  assert.equal(await page.$eval("html", (element) => element.lang), "en");
});

test("SITE-R3.6 SITE-R4.6 localStorage 本身被拒絕時可切換且重載後使用瀏覽器語言", async () => {
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Storage access denied", "SecurityError");
      },
    });
  });

  await openHome();
  await page.click("[data-language-switcher]");
  await page.waitForFunction(() => document.documentElement.lang === "zh-TW");
  assert.equal(
    await page.$eval("#home h1", (element) => element.textContent),
    "陳秉洋",
  );
  await page.click("[data-language-switcher]");
  await page.waitForFunction(() => document.documentElement.lang === "en");
  await page.click("[data-language-switcher]");
  await page.waitForFunction(() => document.documentElement.lang === "zh-TW");

  await page.reload({ waitUntil: "networkidle0" });
  assert.equal(await page.$eval("html", (element) => element.lang), "en");
  assert.equal(
    await page.$eval("#home h1", (element) => element.textContent),
    "Bing-Yang Chen",
  );
});

test("SITE-R4.6 寫入失敗時保留本頁選擇並可繼續導覽", async () => {
  for (const errorName of ["SecurityError", "QuotaExceededError"]) {
    await page.evaluateOnNewDocument((name) => {
      Storage.prototype.setItem = () => {
        throw new DOMException("Cannot save preference", name);
      };
    }, errorName);

    await openHome();
    await page.click("[data-language-switcher]");
    await page.waitForFunction(() => document.documentElement.lang === "zh-TW");
    assert.equal(
      await page.$eval("#home h1", (element) => element.textContent),
      "陳秉洋",
    );
    assert.equal(
      await page.evaluate(() => localStorage.getItem("preferred_language")),
      null,
    );
    await page.click('header a[href="#about"]');
    await page.waitForFunction(() => window.location.hash === "#about");
    assert.equal(await page.$eval("html", (element) => element.lang), "zh-TW");

    await page.reload({ waitUntil: "networkidle0" });
    assert.equal(await page.$eval("html", (element) => element.lang), "en");
    assert.equal(
      await page.$eval("#home h1", (element) => element.textContent),
      "Bing-Yang Chen",
    );
  }
});

test("SITE-R4.3 作品詳情中切換語言", async () => {
  await openHome();
  await selectProject();
  const english = await page.$eval(
    `${DETAIL} [class*="description"]`,
    (element) => element.textContent,
  );
  await page.click("[data-language-switcher]");
  await page.waitForFunction(() => document.documentElement.lang === "zh-TW");
  assert.equal(
    await page.$eval(`${DETAIL} h3`, (element) => element.textContent),
    "Taigu",
  );
  assert.notEqual(
    await page.$eval(
      `${DETAIL} [class*="description"]`,
      (element) => element.textContent,
    ),
    english,
  );
});

test("SITE-R4.4 QR Code 關閉後切換語言", async () => {
  for (const width of [1440, 390]) {
    await page.setViewport({ width, height: 844 });
    await openHome();
    await page.click(QR);
    const qrCode = await page.$eval(
      '[class*="qr_modal_code_panel"] svg',
      (element) => element.outerHTML,
    );
    for (const language of ["zh-TW", "en"]) {
      await page.click(`${QR_DIALOG} button`);
      await page.waitForFunction(
        (selector) => !document.querySelector(selector),
        {},
        QR_DIALOG,
      );
      if (width === 390)
        await page.click('header button[aria-controls="site-navigation"]');
      await page.click("header [data-language-switcher]");
      await page.waitForFunction(
        (expected) => document.documentElement.lang === expected,
        {},
        language,
      );
      if (width === 390) await page.keyboard.press("Escape");
      await page.click(QR);
      await page.waitForSelector(`${QR_DIALOG}[open]`);
      assert.equal(
        await page.$eval("#qr-modal-title", (element) => element.textContent),
        language === "en" ? "Bing-Yang Chen" : "陳秉洋",
      );
      assert.equal(
        await page.$eval("#qr-modal-description", (element) => element.textContent),
        language === "en" ? "Scan to connect" : "掃描以取得連結",
      );
      assert.equal(
        await page.$eval(`${QR_DIALOG} button`, (element) =>
          element.getAttribute("aria-label"),
        ),
        language === "en" ? "Close QR code" : "關閉 QR code",
      );
      assert.equal(
        await page.$eval(
          '[class*="qr_modal_code_panel"] svg',
          (element) => element.outerHTML,
        ),
        qrCode,
      );
      assert.equal(
        await page.$$eval(`${QR_DIALOG} button`, (elements) => elements.length),
        1,
      );
      assert.equal(
        await page.$$eval(
          `${QR_DIALOG} a, ${QR_DIALOG} [data-language-switcher]`,
          (elements) => elements.length,
        ),
        0,
      );
      assert.ok(await page.$eval(QR_DIALOG, (element) => element.matches(":modal")));
    }
    await page.click(`${QR_DIALOG} button`);
  }
});

test("SITE-R4.5 Tab、Enter 與 Space 操作語言按鈕", async () => {
  await openHome();
  let reached = false;
  for (let index = 0; index < 80; index += 1) {
    await page.keyboard.press("Tab");
    reached = await page.evaluate(() =>
      document.activeElement?.hasAttribute("data-language-switcher"),
    );
    if (reached) break;
  }
  assert.ok(reached);
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.documentElement.lang === "zh-TW");
  await page.keyboard.press("Space");
  await page.waitForFunction(() => document.documentElement.lang === "en");
});

test("SITE-R5.2 問候完整顯示", { timeout: 30000 }, async () => {
  await openHome();
  await page.waitForFunction(
    () => !document.querySelector('[class*="greeting_card"] [class*="cursor"]'),
    { timeout: 25000 },
  );
  assert.equal(
    await page.$eval('[class*="greeting_card"]', (element) => element.textContent),
    "Software engineer focused on web apps that stay maintainable after launch.",
  );
});

test("SITE-R5.4 SITE-R6.4 社群、學校與外部部落格目的地", async () => {
  await openHome();
  const links = await page.$$eval('#home a[target="_blank"],#blog a', (elements) =>
    elements.map((element) => ({ href: element.href, target: element.target })),
  );
  for (const href of [
    "https://github.com/bingyangchen",
    "https://www.linkedin.com/in/bing-yang-chen/",
    "https://www.cake.me/me/BingYangChen",
    "https://econo.nccu.edu.tw/",
    "https://blog.byc1999.com/list",
  ]) {
    assert.ok(
      links.some((link) => link.href === href && link.target === "_blank"),
      href,
    );
  }
});

test("SITE-R7.2 SITE-R7.3 SITE-R7.7 作品切換與重載", async () => {
  await openHome();
  await page.$eval("#projects", (element) =>
    element.scrollIntoView({ behavior: "instant" }),
  );
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  const before = await page.evaluate(() => ({
    scroll: window.scrollY,
    height: document.documentElement.scrollHeight,
  }));
  await selectProject(2);
  assert.equal(
    await page.$eval(`${DETAIL} h3`, (element) => element.textContent),
    "Noads",
  );
  assert.equal(await page.$$eval(DETAIL, (elements) => elements.length), 1);
  assert.equal(
    await page.$eval(`${DETAIL} a`, (element) => element.href),
    "https://chromewebstore.google.com/detail/noads/mcdfnneilaagajpfcfiofdjibclkflhg",
  );
  assert.deepEqual(
    await page.evaluate(() => ({
      scroll: window.scrollY,
      height: document.documentElement.scrollHeight,
    })),
    before,
  );
  await selectProject(2);
  assert.equal(
    await page.$eval(`${DETAIL} h3`, (element) => element.textContent),
    "Noads",
  );
  await selectProject(3);
  assert.equal(
    await page.$eval(`${DETAIL} h3`, (element) => element.textContent),
    "Leechai",
  );
  await page.reload({ waitUntil: "networkidle0" });
  assert.equal(
    await page.$eval(`${DETAIL} h3`, (element) => element.textContent),
    "Taigu",
  );
});

test("SITE-R7.8 鍵盤操作作品", async () => {
  await page.setViewport({ width: 390, height: 700 });
  await openHome();
  await selectProject();
  await page.evaluate(() =>
    window.scrollTo({
      top: document.getElementById("projects").offsetTop + 500,
      behavior: "instant",
    }),
  );
  const before = await page.evaluate(() => window.scrollY);
  for (const [key, title] of [
    ["ArrowLeft", "Leechai"],
    ["ArrowRight", "Taigu"],
    ["End", "Leechai"],
    ["Home", "Taigu"],
  ]) {
    await page.keyboard.press(key);
    assert.equal(
      await page.$eval(`${DETAIL} h3`, (element) => element.textContent),
      title,
    );
    assert.equal(
      await page.evaluate(() => document.activeElement.textContent.trim()),
      title,
    );
    assert.equal(await page.evaluate(() => window.scrollY), before);
  }
  await page.keyboard.press("Space");
  await page.keyboard.press("Enter");
  assert.equal(
    await page.$eval(`${DETAIL} h3`, (element) => element.textContent),
    "Taigu",
  );
  assert.equal(
    await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle),
    "solid",
  );
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => document.activeElement.getAttribute("role")),
    "tabpanel",
  );
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => document.activeElement.textContent.trim()),
    "Explore Taigu",
  );
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => document.activeElement.textContent.trim()),
    "Source Code",
  );
  const client = await page.createCDPSession();
  const tree = await client.send("Accessibility.getFullAXTree");
  assert.equal(
    tree.nodes.filter((node) => node.role?.value === "tabpanel" && !node.ignored)
      .length,
    1,
  );
});

test("SITE-R12.2 學歷跨 breakpoint 時立即套用字級", async () => {
  await page.setViewport({ width: 512, height: 844 });
  await openHome();
  for (const language of ["en", "zh-TW"]) {
    if ((await page.$eval("html", (element) => element.lang)) !== language)
      await page.evaluate(() =>
        document.querySelector("[data-language-switcher]").click(),
      );
    for (const [width, fontSize] of [
      [513, "18px"],
      [512, "16px"],
    ]) {
      await page.setViewport({ width, height: 844 });
      assert.deepEqual(
        await page.$$eval('#about [class*="degree_list"] > a', (elements) =>
          elements.map((element) => getComputedStyle(element).fontSize),
        ),
        [fontSize, fontSize],
        `education font size at ${width} ${language}`,
      );
      const skills = await page.$$eval('[data-scroll-motion="skill"]', (elements) =>
        elements.map((element) => ({
          title: element.textContent.trim(),
          top: element.offsetTop,
          width: element.offsetWidth,
          height: element.offsetHeight,
          display: getComputedStyle(element).display,
        })),
      );
      assert.ok(skills.length > 10);
      assert.equal(new Set(skills.map((skill) => skill.title)).size, skills.length);
      assert.ok(new Set(skills.map((skill) => skill.top)).size > 1, "skills wrap");
      assert.ok(
        skills.every(
          (skill) => skill.width > 0 && skill.height > 0 && skill.display !== "none",
        ),
      );
      assert.ok(
        await page.$eval(
          '[class*="skills_inner"]',
          (element) => element.scrollWidth <= element.clientWidth,
        ),
      );
    }
  }
});

test("SITE-R12.3 作品詳情分支", async () => {
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await openHome();
  for (const width of [320, 390, 512, 513, 720, 721, 1024, 1025, 1440]) {
    await page.setViewport({ width, height: 844 });
    for (const language of ["en", "zh-TW"]) {
      if ((await page.$eval("html", (element) => element.lang)) !== language)
        await page.evaluate(() =>
          document.querySelector("[data-language-switcher]").click(),
        );
      let height;
      for (const index of [1, 2, 3]) {
        await page.$eval("#projects", (element) =>
          element.scrollIntoView({ behavior: "instant", block: "start" }),
        );
        await selectProject(index);
        await page.evaluate(async () =>
          Promise.all(
            [...document.querySelectorAll("#projects img")].map((image) =>
              image.decode(),
            ),
          ),
        );
        const metrics = await page.$eval(DETAIL, (panel) => {
          const stage = panel
            .querySelector('[class*="productStage"]')
            .getBoundingClientRect();
          const intro = panel
            .querySelector('[class*="projectIntro"]')
            .getBoundingClientRect();
          const content = panel
            .querySelector('[class*="projectContent"]')
            .getBoundingClientRect();
          return {
            pageHeight: document.documentElement.scrollHeight,
            sectionWidth: document.getElementById("projects").scrollWidth,
            vertical: stage.top >= intro.bottom && content.top >= stage.bottom,
            imageBounds: [...panel.querySelector('[class*="productArt"]').children]
              .filter((element) => getComputedStyle(element).display !== "none")
              .every((element) => {
                const rect = element.getBoundingClientRect();
                return (
                  rect.left >= stage.left - 0.5 &&
                  rect.right <= stage.right + 0.5 &&
                  rect.top >= stage.top - 0.5 &&
                  rect.bottom <= stage.bottom + 0.5
                );
              }),
            targets: [
              ...document.querySelectorAll(
                '#projects [role="tab"], #projects [aria-hidden="false"] a',
              ),
            ].map((element) => element.getBoundingClientRect().height),
          };
        });
        assert.ok(metrics.sectionWidth <= width, `overflow at ${width} ${language}`);
        assert.equal(metrics.vertical, width <= 720, `layout at ${width} ${language}`);
        assert.ok(metrics.imageBounds, `artwork outside stage at ${width} ${language}`);
        assert.ok(metrics.targets.every((target) => target >= 44));
        if (height !== undefined)
          assert.equal(
            metrics.pageHeight,
            height,
            `unstable height at ${width} ${language}`,
          );
        height = metrics.pageHeight;
        for (const link of await page.$$(`${DETAIL} a`)) {
          await link.evaluate((element) => {
            const rect = element.getBoundingClientRect();
            const targetCenter = window.innerHeight / 2;
            window.scrollBy({
              top: rect.top + rect.height / 2 - targetCenter,
              behavior: "instant",
            });
          });
          assert.ok(
            await link.evaluate((element) => {
              const rect = element.getBoundingClientRect();
              return element.contains(
                document.elementFromPoint(
                  rect.x + rect.width / 2,
                  rect.y + rect.height / 2,
                ),
              );
            }),
            `obstructed action at ${width} ${language}`,
          );
        }
      }
    }
  }
});

test("SITE-R12.5 正文可拖選並以原生複製取得文字", { timeout: 45000 }, async () => {
  await openHome();
  await context.overridePermissions(server.origin, [
    "clipboard-read",
    "clipboard-write",
  ]);
  for (const language of ["en", "zh-TW"]) {
    if (language === "zh-TW") {
      await page.setViewport({ width: 1440, height: 900 });
      await page.click("[data-language-switcher]");
      await page.waitForFunction(() => document.documentElement.lang === "zh-TW");
    }
    for (const width of [1440, 390]) {
      await page.setViewport({ width, height: 900 });
      for (const selector of [
        '#about [class*="description"]',
        `${DETAIL} [class*="description"]`,
        '#blog [class*="featuredCopy"] p',
        '#blog [class*="reading"] p',
        'footer [class*="contact_me"] [class*="body"]',
      ]) {
        const expected = await dragText(selector);
        assert.equal(
          await page.evaluate(() => window.getSelection().toString()),
          expected,
          `${language}, ${width}px: ${selector}`,
        );
        assert.equal(
          await page.evaluate(() => document.hasFocus()),
          true,
          "dragging text keeps the page active for copying",
        );
        await page.keyboard.press("KeyC", { commands: ["Copy"] });
        assert.equal(
          await page.evaluate(() => navigator.clipboard.readText()),
          expected,
          "native copy preserves the selected body text",
        );
      }
    }
  }
});

test(
  "SITE-R12.5 SITE-R12.6 觸控與桌面均依文字用途設定選取",
  { timeout: 45000 },
  async () => {
    await openHome();
    for (const language of ["en", "zh-TW"]) {
      if (language === "zh-TW") {
        await page.setViewport({ width: 1440, height: 900 });
        await page.click("[data-language-switcher]");
        await page.waitForFunction(() => document.documentElement.lang === "zh-TW");
      }
      for (const hasTouch of [false, true]) {
        await page.setViewport({ width: hasTouch ? 390 : 1440, height: 900, hasTouch });
        if (hasTouch) await page.click('header button[aria-expanded="false"]');
        const styles = await page.evaluate(() => {
          const bodySelectors = [
            "#home h1",
            '#home [class*="greeting"]',
            '#about [class*="job_title"]',
            '#about [class*="company_name"]',
            '#about [class*="description"]',
            '#about [class*="degree_list"] a',
            '#projects [role="tabpanel"]:not([inert]) h3',
            '#projects [role="tabpanel"]:not([inert]) p span',
            '#blog [class*="featuredCopy"] h3',
            '#blog [class*="featuredCopy"] p',
            '#blog [class*="reading"] p',
            'footer [class*="contact_me"] [class*="body"]',
            'footer [class*="services"] [class*="item"]',
          ];
          const controlSelectors = [
            "button",
            "button span",
            "header nav a",
            '#home [class*="nav_ghost"] span',
            '#projects [class*="actions"] a',
            '#blog [class*="archiveLink"] span',
            '#blog [class*="featuredAction"] span',
            '#blog [class*="readingAction"]',
            'footer [class*="social_media"] a span',
            'footer [class*="product_name"]',
          ];
          function getSelectionStyles(selectors) {
            return selectors.flatMap((selector) => {
              const elements = [...document.querySelectorAll(selector)].filter(
                (element) => element.getBoundingClientRect().height > 0,
              );
              if (!elements.length)
                throw new Error(`Missing visible text: ${selector}`);
              return elements.map((element) => ({
                selector,
                value: getComputedStyle(element).userSelect,
              }));
            });
          }
          return {
            body: getSelectionStyles(bodySelectors),
            controls: getSelectionStyles(controlSelectors),
            email: getComputedStyle(
              document.querySelector('#home [class*="email_link"] span'),
            ).userSelect,
          };
        });
        for (const { selector, value } of styles.body)
          assert.ok(["auto", "text"].includes(value), `${selector}: ${value}`);
        for (const { selector, value } of styles.controls)
          assert.equal(value, "none", selector);
        assert.equal(styles.email, "all");
        if (hasTouch) await page.click('header button[aria-expanded="true"]');
      }
    }
    await page.setViewport({ width: 1440, height: 900, hasTouch: false });
    await dragText('header a[href="#about"]');
    assert.equal(await page.evaluate(() => window.getSelection().toString()), "");
    await page.click('header a[href="#projects"]');
    await page.waitForFunction(() => window.location.hash === "#projects");
    await selectProject(2);
    assert.equal(
      await page.$eval(`${DETAIL} h3`, (element) => element.textContent),
      "Noads",
    );
  },
);

test("SITE-R13.4 作品動態偏好", async () => {
  await openHome();
  await selectProject(2);
  assert.notEqual(
    await page.$eval(
      `${DETAIL} [class*="productArt"]`,
      (element) => getComputedStyle(element).animationName,
    ),
    "none",
  );
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await selectProject(3);
  assert.equal(
    await page.$eval(
      `${DETAIL} [class*="productArt"]`,
      (element) => getComputedStyle(element).animationName,
    ),
    "none",
  );
  assert.equal(
    await page.$eval(
      `${DETAIL} a`,
      (element) => getComputedStyle(element).transitionDuration,
    ),
    "0s",
  );
});

test("SITE-R9.1 SITE-R9.2 SITE-R9.3 SITE-R9.4 QR 的所有關閉入口", async () => {
  await openHome();
  for (const overflow of ["", "scroll"]) {
    await page.evaluate((value) => {
      document.body.style.overflow = value;
    }, overflow);
    for (const closeWith of ["overlay", "button", "Escape"]) {
      await page.click(QR);
      await page.waitForSelector(`${QR_DIALOG}[open]`);
      assert.equal(await page.evaluate(() => document.body.style.overflow), "hidden");
      assert.equal(
        await page.$eval(
          QR_DIALOG,
          (element) => element.querySelectorAll("button").length,
        ),
        1,
      );
      await page.click('[class*="qr_modal_content"]');
      assert.ok(await page.$(`${QR_DIALOG}[open]`));
      if (closeWith === "overlay")
        await page.click(QR_DIALOG, { offset: { x: 5, y: 5 } });
      else if (closeWith === "button") await page.click(`${QR_DIALOG} button`);
      else await page.keyboard.press("Escape");
      await page.waitForFunction(
        (selector) => !document.querySelector(selector),
        {},
        QR_DIALOG,
      );
      assert.equal(await page.evaluate(() => document.body.style.overflow), overflow);
      assert.ok(await page.$eval(QR, (element) => document.activeElement === element));
    }
  }
});

test("SITE-R9.6 QR Code 鍵盤入口", async () => {
  await openHome();
  for (const width of [1440, 390]) {
    await page.setViewport({ width, height: 900 });
    for (const language of ["en", "zh-TW"]) {
      await page.evaluate(() => localStorage.setItem("preferred_language", "en"));
      await openHome();
      if (language === "zh-TW") {
        await page.evaluate(() =>
          document.querySelector("[data-language-switcher]").click(),
        );
        await page.waitForFunction(() => document.documentElement.lang === "zh-TW");
      }
      let reached = false;
      for (let index = 0; index < 20; index += 1) {
        await page.keyboard.press("Tab");
        reached = await page.$eval(QR, (element) => document.activeElement === element);
        if (reached) break;
      }
      assert.ok(reached, `Tab reaches QR opener at ${width}px in ${language}`);
      const opener = await page.$eval(QR, (element) => ({
        tag: element.tagName,
        label: element.getAttribute("aria-label"),
        popup: element.getAttribute("aria-haspopup"),
        width: element.getBoundingClientRect().width,
        height: element.getBoundingClientRect().height,
        outline: getComputedStyle(element).outlineStyle,
      }));
      assert.equal(opener.tag, "BUTTON");
      assert.equal(opener.label, language === "en" ? "Show QR code" : "顯示 QR code");
      assert.equal(opener.popup, "dialog");
      assert.ok(opener.width >= 44 && opener.height >= 44);
      assert.equal(opener.outline, "solid");
      for (const key of ["Enter", "Space"]) {
        await page.keyboard.press(key);
        await page.waitForSelector(`${QR_DIALOG}[open]`);
        assert.ok(
          await page.$eval(
            `${QR_DIALOG} button`,
            (element) => document.activeElement === element,
          ),
        );
        const closeButton = await page.$eval(`${QR_DIALOG} button`, (element) => ({
          label: element.getAttribute("aria-label"),
          width: element.getBoundingClientRect().width,
          height: element.getBoundingClientRect().height,
          outline: getComputedStyle(element).outlineStyle,
        }));
        assert.equal(
          closeButton.label,
          language === "en" ? "Close QR code" : "關閉 QR code",
        );
        assert.ok(closeButton.width >= 44 && closeButton.height >= 44);
        assert.equal(closeButton.outline, "solid");
        await page.keyboard.press("Enter");
        await page.waitForFunction(
          (selector) => !document.querySelector(selector),
          {},
          QR_DIALOG,
        );
        assert.ok(
          await page.$eval(QR, (element) => document.activeElement === element),
        );
      }
    }
  }
});

test("SITE-R9.7 Dialog 焦點與卸載清理", async () => {
  await openHome();
  await page.click(QR);
  assert.ok(await page.$eval(QR_DIALOG, (element) => element.matches(":modal")));
  assert.ok(
    await page.$eval(
      `${QR_DIALOG} button`,
      (element) => document.activeElement === element,
    ),
  );
  const accessibility = await page.accessibility.snapshot({ interestingOnly: false });
  const dialog = await page.accessibility.snapshot({
    root: await page.$(QR_DIALOG),
    interestingOnly: false,
  });
  assert.ok(dialog);
  assert.equal(dialog.name, "Bing-Yang Chen");
  assert.equal(dialog.description, "Scan to connect");
  assert.equal(dialog.modal, true);
  assert.equal(JSON.stringify(accessibility).includes('"role":"link"'), false);
  for (const reverse of [false, true]) {
    if (reverse) await page.keyboard.down("Shift");
    for (let index = 0; index < 8; index += 1) {
      await page.keyboard.press("Tab");
      assert.ok(
        await page.$eval(
          QR_DIALOG,
          (element) =>
            document.activeElement === document.body ||
            element.contains(document.activeElement),
        ),
      );
    }
    if (reverse) await page.keyboard.up("Shift");
  }
  await page.$eval(QR, (element) => element.focus());
  assert.equal(
    await page.$eval(QR, (element) => document.activeElement === element),
    false,
  );
  await page.keyboard.press("Escape");
  await page.waitForFunction(
    (selector) => !document.querySelector(selector),
    {},
    QR_DIALOG,
  );
  assert.ok(await page.$eval(QR, (element) => document.activeElement === element));
  await page.keyboard.press("Tab");
  assert.ok(
    await page.evaluate(() =>
      document.activeElement.href?.includes("econo.nccu.edu.tw"),
    ),
  );
  await page.evaluate(() => {
    document.body.style.overflow = "scroll";
  });
  await page.click(QR);
  await enterPreview();
  assert.equal(await page.$(QR_DIALOG), null);
  assert.equal(await page.evaluate(() => document.body.style.overflow), "scroll");
  await page.$eval('a[href^="mailto:"]', (element) => element.focus());
  assert.ok(
    await page.evaluate(() => document.activeElement.href?.startsWith("mailto:")),
  );
});

test("SITE-R10.1 雙語與各尺寸下載同一份 PDF", async () => {
  const directory = await mkdtemp(join(tmpdir(), "resume-download-"));
  const session = await page.createCDPSession();
  await session.send("Browser.setDownloadBehavior", {
    behavior: "allow",
    browserContextId: context.id,
    downloadPath: directory,
    eventsEnabled: true,
  });
  try {
    await openHome();
    await page.evaluate(() => {
      window.print = () => {
        throw new Error("Homepage must download, not print");
      };
    });
    const expected = await readFile(join(BUILD, "resume.pdf"));
    for (const width of [390, 1440]) {
      await page.setViewport({ width, height: 568 });
      for (const language of ["en", "zh-TW"]) {
        if ((await page.$eval("html", (element) => element.lang)) !== language)
          await page.$eval("[data-language-switcher]", (element) => element.click());
        await page.waitForFunction(
          (expectedLanguage) => document.documentElement.lang === expectedLanguage,
          {},
          language,
        );
        const downloaded = new Promise((resolveDownload, rejectDownload) => {
          const timer = setTimeout(() => {
            session.off("Browser.downloadProgress", onProgress);
            rejectDownload(new Error("PDF download timed out"));
          }, 10000);
          function onProgress(event) {
            if (event.state === "inProgress") return;
            clearTimeout(timer);
            session.off("Browser.downloadProgress", onProgress);
            if (event.state === "completed") resolveDownload();
            else rejectDownload(new Error("PDF download canceled"));
          }
          session.on("Browser.downloadProgress", onProgress);
        });
        await page.$eval("#home a[download]", (element) =>
          element.scrollIntoView({ block: "center", behavior: "instant" }),
        );
        await settleMotion();
        await page.click("#home a[download]");
        await downloaded;
        const path = join(directory, "Bing-Yang Chen - 陳秉洋.pdf");
        assert.deepEqual(await readFile(path), expected);
        await rm(path);
        assert.equal(new URL(page.url()).pathname, "/");
      }
    }
  } finally {
    await session.detach();
    await rm(directory, { recursive: true, force: true });
  }
});

test("SITE-R10.4 SITE-R10.5 英文預覽與首頁沒有隱藏履歷", async () => {
  await openHome();
  let firstPreview;
  for (const language of ["en", "zh-TW"]) {
    if (language === "zh-TW") await page.click("[data-language-switcher]");
    assert.equal(await page.$("[data-resume-root]"), null);
    assert.equal(await page.$(".resume-print-area"), null);
    await enterPreview();
    const preview = await page.$$eval("[data-resume-root]", (elements) =>
      elements.map((element) => ({
        text: element.textContent,
        language: element.lang,
      })),
    );
    assert.equal(preview.length, 1);
    assert.equal(preview[0].language, "en");
    assert.ok(preview[0].text.includes("Career Summary"));
    if (firstPreview) assert.deepEqual(preview, firstPreview);
    firstPreview = preview;
    assert.equal(
      await page.$eval('[class*="resumePage"]', (element) => element.lang),
      "en",
    );
    await page.goBack();
    await page.waitForSelector("#home");
    assert.equal(await page.$("[data-resume-root]"), null);
  }
});

test("SITE-R10.6 首頁下載焦點與預覽連結", async () => {
  await openHome();
  for (const width of [390, 1440]) {
    await page.setViewport({ width, height: 844 });
    for (const language of ["en", "zh-TW"]) {
      await page.evaluate(
        (value) => localStorage.setItem("preferred_language", value),
        language,
      );
      await page.reload({ waitUntil: "networkidle0" });
      await page.waitForSelector("#home a[download]");
      await page.$eval('#home a[aria-label="Cake"]', (element) => element.focus());
      await page.keyboard.press("Tab");
      assert.equal(
        await page.evaluate(() => document.activeElement.getAttribute("download")),
        "Bing-Yang Chen - 陳秉洋.pdf",
      );
      assert.notEqual(
        await page.$eval(
          "#home a[download]",
          (element) => getComputedStyle(element).outlineStyle,
        ),
        "none",
      );
      await page.keyboard.down("Shift");
      await page.keyboard.press("Tab");
      await page.keyboard.up("Shift");
      assert.equal(
        await page.evaluate(() => document.activeElement.getAttribute("aria-label")),
        "Cake",
      );
      assert.equal(await page.$(".resume-print-area"), null);
      await enterPreview();
      await page.$eval('a[href^="mailto:"]', (element) => element.focus());
      assert.ok(
        await page.evaluate(() => document.activeElement.href?.startsWith("mailto:")),
      );
      await page.goBack();
      await page.waitForSelector("#home");
      assert.equal(await page.$(".resume-print-area"), null);
    }
  }
});

test("SITE-R10.7 停用 JavaScript 與直接請求 PDF", async () => {
  await page.setJavaScriptEnabled(false);
  await page.goto(server.origin, { waitUntil: "networkidle0" });
  const link = await page.$eval("#home a[download]", (element) => ({
    href: element.getAttribute("href"),
    name: element.getAttribute("download"),
  }));
  assert.deepEqual(link, { href: "/resume.pdf", name: "Bing-Yang Chen - 陳秉洋.pdf" });
  const response = await fetch(server.origin + link.href);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/pdf");
  assert.deepEqual(
    Buffer.from(await response.arrayBuffer()),
    await readFile(join(BUILD, "resume.pdf")),
  );
});

test("SITE-R10.4 SITE-R11.1 SITE-R11.2 SITE-R11.4 下載與預覽共用英文 A4", async () => {
  const built = parsePdfMetadata(await readFile(join(BUILD, "resume.pdf")));
  assert.equal(built.pages, 1);
  assert.equal(built.language, "en");
  assert.deepEqual(built.fonts, [
    "Georgia",
    "Georgia-Bold",
    "Georgia-Italic",
    "NotoSerifTC-Bold",
  ]);
  const fontLicense = await fetch(server.origin + "/fonts/OFL-NotoSerifTC.txt");
  assert.equal(fontLicense.status, 200);
  assert.ok((await fontLicense.text()).includes("SIL OPEN FONT LICENSE Version 1.1"));
  const dimensions = built.mediaBox.trim().split(/\s+/).map(Number);
  assert.ok(Math.abs(dimensions[2] - 595) < 2 && Math.abs(dimensions[3] - 842) < 2);
  for (const url of [
    "mailto:bryan.chen.429@gmail.com",
    "https://github.com/bingyangchen",
    "https://byc1999.com/",
  ])
    assert.ok(built.links.includes(url), url);
  await openHome();
  for (const language of ["en", "zh-TW"]) {
    if (language === "zh-TW") await page.click("[data-language-switcher]");
    await enterPreview();
    const preview = await getPrintResult();
    assert.equal(await page.$eval("html", (element) => element.lang), language);
    assert.equal(preview.pages, built.pages);
    assert.equal(preview.language, built.language);
    assert.equal(preview.mediaBox, built.mediaBox);
    assert.deepEqual(preview.links, built.links);
    assert.deepEqual(preview.fonts, built.fonts);
    assert.equal(preview.metrics.count, 1);
    assert.equal(preview.metrics.visible, "visible");
    assert.ok(preview.metrics.bottom <= preview.metrics.height + 1);
    assert.equal(preview.metrics.header, "none");
    assert.equal(preview.metrics.footer, "none");
    assert.equal(preview.metrics.language, "hidden");
    for (const section of ["SKILLS", "CAREER SUMMARY", "EDUCATION", "SOCIAL LINKS"])
      assert.ok(preview.metrics.text.includes(section));
    await page.goBack();
    await page.waitForSelector("#home");
  }
});

test("SITE-R5.5 頭像 Hover、點按保持、鍵盤、觸控與減少動態", async () => {
  async function assertAvatarFace(flipped, pressed = flipped) {
    assert.equal(
      await page.$eval(AVATAR, (button) => button.getAttribute("aria-pressed")),
      String(pressed),
    );
    await page.waitForFunction(
      (selector, flipped) => {
        const images = document.querySelector(selector).querySelectorAll("img");
        return Array.from(images).every((image, index) => {
          const matrix = new DOMMatrixReadOnly(getComputedStyle(image).transform);
          return Math.abs(matrix.m11 - (flipped === (index === 0) ? -1 : 1)) < 0.001;
        });
      },
      {},
      AVATAR,
      flipped,
    );
  }

  await openHome();
  await assertHoverCapability(true);
  assert.equal(
    await page.$eval(AVATAR, (button) => button.getAttribute("aria-label")),
    "Flip portrait",
  );
  assert.deepEqual(
    await page.$$eval(`${AVATAR} img`, (images) => images.map((image) => image.alt)),
    ["陳秉洋 (Bing-Yang Chen)", "陳秉洋 (Bing-Yang Chen)"],
  );
  await assertAvatarFace(false);
  await page.hover(AVATAR);
  await assertAvatarFace(true, false);
  await page.mouse.move(0, 0);
  await assertAvatarFace(false);
  await page.hover(AVATAR);
  await assertAvatarFace(true, false);
  await page.click(AVATAR);
  await assertAvatarFace(true);
  await page.click(AVATAR);
  await assertAvatarFace(false);
  await page.mouse.move(0, 0);
  await assertAvatarFace(false);
  await page.hover(AVATAR);
  await assertAvatarFace(true, false);
  await page.click(AVATAR);
  await assertAvatarFace(true);
  await page.mouse.move(0, 0);
  await page.click(QR);
  await page.waitForSelector(`${QR_DIALOG}[open]`);
  await page.keyboard.press("Escape");
  await page.waitForSelector(QR_DIALOG, { hidden: true });
  await assertAvatarFace(true);
  await page.focus(AVATAR);
  await page.keyboard.press("Enter");
  await assertAvatarFace(false);
  assert.equal(
    await page.$eval(AVATAR, (button) => getComputedStyle(button).outlineStyle),
    "solid",
  );
  await page.keyboard.press("Space");
  await assertAvatarFace(true);
  await page.mouse.move(0, 0);
  await page.keyboard.press("Enter");
  await assertAvatarFace(false);
  await page.hover(AVATAR);
  await assertAvatarFace(true, false);
  await page.click(AVATAR);
  await assertAvatarFace(true);
  await page.evaluate(() => document.querySelector("[data-language-switcher]").click());
  await page.waitForFunction(
    (selector) =>
      document.querySelector(selector).getAttribute("aria-label") === "翻轉頭像",
    {},
    AVATAR,
  );
  await assertAvatarFace(true);

  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto("about:blank");
  await page.goto(server.origin);
  await page.evaluate(() => localStorage.setItem("preferred_language", "en"));
  await openHome();
  await assertHoverCapability(false);
  for (const preference of ["no-preference", "reduce"]) {
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: preference },
    ]);
    await assertAvatarFace(false);
    await page.tap(AVATAR);
    await assertAvatarFace(true);
    await page.touchscreen.tap(5, 120);
    await assertAvatarFace(true);
    if (preference === "reduce") {
      assert.deepEqual(
        await page.$$eval(`${AVATAR} img`, (images) =>
          images.map((image) => getComputedStyle(image).transitionDuration),
        ),
        ["0s", "0s"],
      );
    }
    await page.tap(AVATAR);
    await assertAvatarFace(false);
  }
});

test("SITE-R13.3 完整減少動態與即時切換", async () => {
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await openHome();
  async function assertStaticMotion() {
    await page.hover('#home [aria-label="GitHub"]');
    assert.equal(
      await page.$eval(
        '#home [aria-label="GitHub"]',
        (element) => getComputedStyle(element).transform,
      ),
      "none",
    );
    assert.equal(await page.$("[data-scroll-motion-active]"), null);
    const states = await page.$$eval("[data-scroll-motion]", (elements) =>
      elements
        .filter((element) => !element.closest("[inert]"))
        .map((element) => ({
          opacity: getComputedStyle(element).opacity,
          transform: getComputedStyle(element).transform,
        })),
    );
    assert.ok(states.length > 30);
    assert.ok(
      states.every((state) => state.opacity === "1" && state.transform === "none"),
    );
    assert.equal(
      await page.$$eval(
        "#home *, #about *, #projects *, #blog *",
        (elements) =>
          elements.filter(
            (element) =>
              getComputedStyle(element).animationName !== "none" ||
              getComputedStyle(element).transitionDuration !== "0s",
          ).length,
      ),
      0,
    );
    assert.equal(
      await page.$eval("html", (element) => getComputedStyle(element).scrollBehavior),
      "auto",
    );
  }
  await assertStaticMotion();
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "no-preference" },
  ]);
  await page.waitForSelector("[data-scroll-motion-active]");
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await settleMotion();
  await assertStaticMotion();
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "no-preference" },
  ]);
  await page.waitForSelector("[data-scroll-motion-active]");
  await moveMotionTarget(
    '#projects [role="tabpanel"]:not([inert]) [data-scroll-motion="stage"]',
    700,
  );
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await settleMotion();
  await assertStaticMotion();
});

test("SITE-R14.1 SITE-R14.2 SITE-R14.3 完整 build、靜態文字與擷取範圍", async () => {
  const html = await readFile(join(BUILD, "index.html"), "utf8");
  assert.ok(!html.includes('<div id="root"></div>'));
  assert.ok(html.includes("陳秉洋"));
  assert.ok(!html.includes("data-resume-root"));
  const newestSource = await stat(join(ROOT, "src/index.tsx"));
  assert.ok((await stat(join(BUILD, "index.html"))).mtimeMs >= newestSource.mtimeMs);
  assert.ok(
    (await stat(join(BUILD, "resume.pdf"))).mtimeMs >=
      (await stat(join(ROOT, "src/pages/Main/Resume/ResumeSheet.tsx"))).mtimeMs,
  );
  await page.setJavaScriptEnabled(false);
  await page.goto(server.origin, { waitUntil: "networkidle0" });
  assert.equal(
    await page.$$eval("#home,#about,#projects,#blog", (elements) => elements.length),
    4,
  );
  assert.ok((await page.$eval("#root", (element) => element.textContent)).length > 500);
});

test("SITE-R15.1 新環境不註冊 service worker", async () => {
  await openHome();
  const result = await page.evaluate(async () => ({
    controller: !!navigator.serviceWorker.controller,
    registrations: (await navigator.serviceWorker.getRegistrations()).length,
  }));
  assert.deepEqual(result, { controller: false, registrations: 0 });
});

test("SITE-R16.1 SITE-R16.2 Metadata、robots 與 sitemap", async () => {
  await openHome();
  assert.equal(await page.title(), "Bing-Yang Chen - 陳秉洋");
  assert.equal(
    await page.$eval('link[rel="canonical"]', (element) => element.href),
    "https://byc1999.com/",
  );
  assert.ok(await page.$('meta[property="og:image"]'));
  assert.ok(await page.$('meta[name="description"]'));
  assert.ok(await page.$('link[rel="manifest"]'));
  const robots = await (await fetch(server.origin + "/robots.txt")).text();
  const sitemap = await (await fetch(server.origin + "/sitemap.txt")).text();
  assert.ok(robots.includes("https://byc1999.com/sitemap.txt"));
  assert.ok(!sitemap.includes("/resume"));
});

async function runPrerenderFixture(script) {
  const directory = await mkdtemp(join(tmpdir(), "prerender-failure-"));
  try {
    await mkdir(join(directory, "scripts"));
    await mkdir(join(directory, "build"));
    await copyFile(
      join(ROOT, "scripts/prerender.mjs"),
      join(directory, "scripts/prerender.mjs"),
    );
    await symlink(join(ROOT, "node_modules"), join(directory, "node_modules"), "dir");
    await writeFile(
      join(directory, "build/index.html"),
      `<html><body><div id="root"></div><script>${script}</script></body></html>`,
    );
    return await new Promise((resolveResult, rejectResult) => {
      const child = spawn(
        process.execPath,
        [join(directory, "scripts/prerender.mjs")],
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
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test(
  "SITE-R14.4 錯誤、空內容與不足內容阻止 prerender",
  { timeout: 120000 },
  async () => {
    const failures = [
      ["", "empty #root"],
      [
        'document.getElementById("root").textContent="thin";',
        "characters of visible text",
      ],
      [
        'document.getElementById("root").textContent="Content ".repeat(100); throw new Error("fixture error");',
        "fixture error",
      ],
    ];
    for (const [script, message] of failures) {
      const result = await runPrerenderFixture(script);
      assert.notEqual(result.code, 0);
      assert.ok(result.output.includes(message), result.output);
    }
    const errorServer = createServer((request, response) =>
      response.writeHead(500).end("fixture failure"),
    );
    await new Promise((resolveListening) =>
      errorServer.listen(0, "127.0.0.1", resolveListening),
    );
    try {
      const result = await runPrerenderFixture(
        `location.replace("http://127.0.0.1:${errorServer.address().port}/failure");`,
      );
      assert.notEqual(result.code, 0);
      assert.ok(result.output.includes("responded 500"), result.output);
    } finally {
      await new Promise((resolveClosed) => errorServer.close(resolveClosed));
    }
  },
);
test("SITE-R14.4 履歷缺漏、裁切與圖片失敗阻止產檔", { timeout: 60000 }, async () => {
  const content = "Resume content ".repeat(70);
  const fixtures = [
    ["<p>No resume sheet</p>", "Expected one resume sheet"],
    ["<div data-resume-root>thin</div>", "Resume has insufficient content"],
    [
      `<div data-resume-root style="width:794px;height:1123px;position:absolute;left:0;top:0"><p style="position:absolute;top:1200px">${content}</p></div>`,
      "Resume content overflows A4",
    ],
    [
      `<div data-resume-root>${content}<img src="/missing-image.png"></div>`,
      "source image cannot be decoded",
    ],
  ];
  for (const [markup, message] of fixtures) {
    const result = await runPrerenderFixture(`
      if(location.pathname==="/resume") {
        document.getElementById("root").innerHTML=${JSON.stringify(markup)};
      } else {
        document.getElementById("root").textContent="Homepage content ".repeat(100);
      }
    `);
    assert.notEqual(result.code, 0);
    assert.ok(result.output.includes(message), result.output);
  }
});

test("SITE-R14.4 字型替換時停止履歷產檔", async () => {
  const markup = `<style>
    @page { size: A4; margin: 0; }
    body { margin: 0; }
    [data-resume-root] {
      width: 210mm; height: 297mm;
      font: 12px "Missing Resume Font", Arial, sans-serif;
    }
  </style><div data-resume-root>${"Resume content ".repeat(70)}</div>`;
  const result = await runPrerenderFixture(`
    if (location.pathname === "/resume") {
      document.getElementById("root").innerHTML = ${JSON.stringify(markup)};
    } else {
      document.getElementById("root").textContent = "Homepage content ".repeat(100);
    }
  `);
  assert.notEqual(result.code, 0, "A loaded fallback font must not pass the build");
  assert.ok(result.output.includes("Unexpected resume PDF fonts"), result.output);
});

test("SITE-R17.2 SITE-R17.3 文章鍵盤啟用與雙語", { timeout: 45000 }, async () => {
  await openHome("#blog");
  const original = await page.$$eval("#blog a", (links) =>
    links.map((link) => link.href),
  );
  assert.equal(original.length, 4);
  assert.equal(
    await page.$eval('#blog [class*="languageNote"]', (note) => note.textContent),
    "Primarily in Traditional Chinese.",
  );
  const selectors = [
    '#blog a[class*="featured"]',
    '#blog a[class*="reading"]:nth-child(1)',
    '#blog a[class*="reading"]:nth-child(2)',
  ];
  const articleContext = context;
  for (const selector of selectors) {
    const destination = await page.$eval(selector, (link) => link.href);
    for (const activation of ["keyboard", "mouse", "modifier"]) {
      await page.bringToFront();
      await dragText(`${selector} p`);
      const existingTargets = new Set(browser.targets());
      const popupTarget = browser.waitForTarget(
        (target) =>
          target.type() === "page" &&
          target.browserContext() === articleContext &&
          !existingTargets.has(target),
        { timeout: 10000 },
      );
      await page.bringToFront();
      if (activation === "keyboard") {
        await page.focus(selector);
        await page.keyboard.press("Enter");
      } else if (activation === "modifier") {
        const modifier = process.platform === "darwin" ? "Meta" : "Control";
        await page.keyboard.down(modifier);
        try {
          await page.click(`${selector} p`);
        } finally {
          await page.keyboard.up(modifier);
        }
      } else {
        await page.click(`${selector} p`);
      }
      const target = await popupTarget;
      assert.equal(target.url(), destination, activation);
      const popup = await target.page();
      assert.ok(popup, `${activation} creates a page`);
      await popup.close();
    }
  }
  const titles = await page.$$eval("#blog h3", (headings) =>
    headings.map((heading) => heading.textContent),
  );
  await page.click("[data-language-switcher]");
  await page.waitForFunction(() => document.documentElement.lang === "zh-TW");
  assert.equal(await page.$('#blog [class*="languageNote"]'), null);
  assert.deepEqual(
    await page.$$eval("#blog h3", (headings) =>
      headings.map((heading) => heading.textContent),
    ),
    titles,
  );
  assert.deepEqual(
    await page.$$eval("#blog a", (links) => links.map((link) => link.href)),
    original,
  );
  assert.ok(
    await page.$eval("#blog", (blog) =>
      blog.textContent.includes("很多事寫下來之後，才知道自己是不是真的懂了。"),
    ),
  );
  await page.click("[data-language-switcher]");
  await page.waitForSelector('#blog [class*="languageNote"]');
});

test("SITE-R17.4 各尺寸文章與操作範圍", async () => {
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await openHome("#blog");
  for (const width of [320, 390, 512, 720, 721, 1024, 1440]) {
    await page.setViewport({ width, height: 844 });
    for (const language of ["en", "zh-TW"]) {
      if ((await page.$eval("html", (html) => html.lang)) !== language)
        await page.evaluate(() =>
          document.querySelector("[data-language-switcher]").click(),
        );
      await page.waitForFunction(
        (expected) => document.documentElement.lang === expected,
        {},
        language,
      );
      const metrics = await page.$eval("#blog", (blog) => {
        const featured = blog.querySelector('a[class*="featured"]');
        const copy = featured
          .querySelector('[class*="featuredCopy"]')
          .getBoundingClientRect();
        const action = featured
          .querySelector('[class*="featuredAction"]')
          .getBoundingClientRect();
        const illustration = featured
          .querySelector('[class*="illustration"]')
          .getBoundingClientRect();
        const reading = [...blog.querySelectorAll('a[class*="reading"]')].map((link) =>
          link.getBoundingClientRect(),
        );
        return {
          overflow: blog.scrollWidth > window.innerWidth,
          vertical:
            illustration.top >= action.bottom - 1 && action.top >= copy.bottom - 1,
          readingVertical: reading[1].top >= reading[0].bottom - 1,
          textOverflow: [
            ...blog.querySelectorAll(
              "p,h2,h3,[class*='layer'],[class*='featureGroup']",
            ),
          ]
            .filter((element) => element.scrollWidth > element.clientWidth + 2)
            .map((element) => element.className),
          targets: [...blog.querySelectorAll("a")].map(
            (link) => link.getBoundingClientRect().height,
          ),
          nestedScrolling: [...blog.querySelectorAll("div")].some((element) =>
            ["auto", "scroll"].includes(getComputedStyle(element).overflowY),
          ),
        };
      });
      assert.equal(metrics.overflow, false, `${width} ${language}`);
      assert.equal(metrics.vertical, width <= 720, `${width} ${language}`);
      assert.equal(metrics.readingVertical, width <= 720, `${width} ${language}`);
      assert.deepEqual(metrics.textOverflow, [], `${width} ${language}`);
      assert.ok(
        metrics.targets.every((height) => height >= 44),
        `${width} ${language}`,
      );
      assert.equal(metrics.nestedScrolling, false);
      const mismatches = await page.evaluate(() => {
        const pairs = [
          [
            "#projects > div",
            "#blog > div",
            ["padding-top", "padding-right", "padding-bottom", "padding-left"],
          ],
          [
            "#projects h2",
            "#blog h2",
            [
              "font-family",
              "font-size",
              "font-weight",
              "line-height",
              "letter-spacing",
            ],
          ],
          [
            '#projects [class*="sectionHeader"]',
            '#blog [class*="intro"]',
            ["display", "align-items", "justify-content", "gap", "margin-bottom"],
          ],
          [
            '#projects [class*="sectionHeader"] p',
            '#blog [class*="introCopy"] > p',
            ["font-size", "font-weight", "line-height", "margin-top"],
          ],
          [
            '#projects a[class*="github"]',
            '#blog a[class*="archiveLink"]',
            ["font-size", "min-height", "gap", "margin-top"],
          ],
          [
            '#projects a[class*="github"] svg',
            '#blog a[class*="archiveLink"] svg',
            ["width", "height"],
          ],
          [
            '#projects [aria-hidden="false"] [class*="description"]',
            '#blog [class*="featuredCopy"] > p',
            ["font-size", "line-height"],
          ],
          [
            '#projects [aria-hidden="false"] [class*="projectMeta"]',
            '#blog [class*="featuredCopy"] [class*="metadata"]',
            ["font-size", "line-height"],
          ],
          [
            '#projects [aria-hidden="false"] [class*="actions"] a',
            '#blog [class*="featuredAction"]',
            ["font-size", "min-height", "gap"],
          ],
          [
            '#projects [aria-hidden="false"] [class*="actions"] svg',
            '#blog [class*="featuredAction"] svg',
            ["width", "height"],
          ],
          [
            '#projects [aria-hidden="false"] [class*="actions"] svg',
            '#blog [class*="readingHeading"] svg',
            ["width", "height"],
          ],
        ];
        return pairs.flatMap(([projectSelector, blogSelector, properties]) => {
          const projectStyle = getComputedStyle(
            document.querySelector(projectSelector),
          );
          const blogStyle = getComputedStyle(document.querySelector(blogSelector));
          return properties
            .filter(
              (property) =>
                projectStyle.getPropertyValue(property) !==
                blogStyle.getPropertyValue(property),
            )
            .map((property) => ({
              element: blogSelector,
              property,
              project: projectStyle.getPropertyValue(property),
              blog: blogStyle.getPropertyValue(property),
            }));
        });
      });
      assert.deepEqual(mismatches, [], `section consistency at ${width} ${language}`);
      for (const link of await page.$$("#blog a")) {
        await link.evaluate((element) =>
          element.scrollIntoView({ behavior: "instant", block: "center" }),
        );
        assert.ok(
          await link.evaluate((element) => {
            const rect = element.getBoundingClientRect();
            return element.contains(
              document.elementFromPoint(
                rect.x + rect.width / 2,
                rect.y + rect.height / 2,
              ),
            );
          }),
          `unreachable link at ${width} ${language}`,
        );
      }
    }
  }
});

test("SITE-R13.6 外連箭頭一致性", async () => {
  await openHome("#projects");
  await assertHoverCapability(true);
  const sharedLinks = [
    '#projects a[class*="github"]',
    '#blog a[class*="archiveLink"]',
    '#blog a[class*="featured"]',
    '#blog a[class*="reading"]:nth-child(1)',
    '#blog a[class*="reading"]:nth-child(2)',
  ];
  const projectLinks = [`${DETAIL} a[class*="visit"]`, `${DETAIL} a[class*="source"]`];

  async function hoverLink(selector) {
    await page.$eval(selector, (link) =>
      link.scrollIntoView({ behavior: "instant", block: "center" }),
    );
    await page.hover(selector);
    assert.equal(
      await page.$eval(selector, (link) => link.matches(":hover")),
      true,
      selector,
    );
  }

  async function assertArrowState(selector, moved, duration) {
    await page.waitForFunction(
      (selector, moved) => {
        const transform = getComputedStyle(document.querySelector(selector)).transform;
        const matrix =
          transform === "none" ? new DOMMatrix() : new DOMMatrix(transform);
        return (
          Math.abs(matrix.m41 - (moved ? 3 : 0)) < 0.01 &&
          Math.abs(matrix.m42 - (moved ? -3 : 0)) < 0.01
        );
      },
      { timeout: 5000 },
      selector,
      moved,
    );
    assert.equal(
      await page.$eval(selector, (arrow) => getComputedStyle(arrow).transitionDuration),
      duration,
      selector,
    );
  }

  for (const reduced of [false, true]) {
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: reduced ? "reduce" : "no-preference" },
    ]);
    for (let index = 0; index < 3; index += 1) {
      const tab = `${TABS}:nth-child(${index + 1})`;
      await page.$eval(tab, (button) =>
        button.scrollIntoView({ behavior: "instant", block: "center" }),
      );
      await page.focus(tab);
      await page.keyboard.press("Enter");
      await page.waitForSelector(`${tab}[aria-selected="true"]`);
      const links = index === 0 ? [...sharedLinks, ...projectLinks] : projectLinks;
      for (const selector of links) {
        const arrow = `${selector} svg[class*="IconArrowUpRight_main"]`;
        const duration = reduced ? "0s" : "0.22s";
        await hoverLink(selector);
        await assertArrowState(arrow, !reduced, duration);
        await page.mouse.move(0, 0);
        await assertArrowState(arrow, false, duration);
      }
    }
  }

  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "no-preference" },
  ]);
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto("about:blank");
  await openHome("#blog");
  await assertHoverCapability(false);
  for (const selector of [...sharedLinks, ...projectLinks]) {
    await hoverLink(selector);
    await assertArrowState(
      `${selector} svg[class*="IconArrowUpRight_main"]`,
      false,
      "0.22s",
    );
  }
});

test("SITE-R17.5 文章焦點、Hover 與減少動態", async () => {
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "no-preference" },
  ]);
  await openHome("#blog");
  await assertHoverCapability(true);
  const links = await page.$$eval("#blog a", (elements) =>
    elements.map((element) => element.href),
  );
  await page.focus('#blog a[class*="archiveLink"]');
  for (let index = 0; index < links.length; index += 1) {
    const focus = await page.evaluate(() => ({
      href: document.activeElement.href,
      outline: getComputedStyle(document.activeElement).outlineStyle,
    }));
    assert.equal(focus.href, links[index]);
    assert.equal(focus.outline, "solid");
    if (index < links.length - 1) await page.keyboard.press("Tab");
  }
  await page.hover('#blog a[class*="featured"]');
  await page.waitForFunction(
    () =>
      getComputedStyle(
        document.querySelector('#blog [class*="featuredAction"] [class*="arrow"]'),
      ).transform !== "none",
  );
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  const durations = await page.$$eval('#blog [class*="arrow"]', (arrows) =>
    arrows.map((arrow) => getComputedStyle(arrow).transitionDuration),
  );
  assert.ok(durations.every((duration) => duration === "0s"));
});

test("SITE-R17.6 精選文章不依賴 JavaScript 或 GitBook 回應", async () => {
  const html = await readFile(join(BUILD, "index.html"), "utf8");
  assert.ok(html.includes("專案目錄結構"));
  assert.ok(html.includes("從依技術分層到依功能分組"));
  assert.ok(html.includes("system-design/rate-limiter"));
  await page.setJavaScriptEnabled(false);
  await page.goto(server.origin + "/#blog", { waitUntil: "networkidle0" });
  assert.equal(await page.$$eval("#blog h3", (headings) => headings.length), 3);
  assert.equal(
    await page.$$eval(
      "#blog a",
      (links) =>
        links.filter((link) => link.href.startsWith("https://blog.byc1999.com/"))
          .length,
    ),
    4,
  );
  const blogRequests = [];
  page.on("request", (request) => {
    if (new URL(request.url()).hostname === "blog.byc1999.com")
      blogRequests.push(request.url());
  });
  await page.setJavaScriptEnabled(true);
  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForFunction(() => document.documentElement.lang === "en");
  assert.equal(await page.$$eval("#blog h3", (headings) => headings.length), 3);
  assert.deepEqual(blogRequests, []);
});

async function settleMotion() {
  await page.evaluate(
    () =>
      new Promise((resolveFrame) =>
        requestAnimationFrame(() => requestAnimationFrame(resolveFrame)),
      ),
  );
}

async function moveMotionTarget(selector, viewportTop) {
  await page.evaluate(
    (targetSelector, top) => {
      dispatchEvent(new WheelEvent("wheel"));
      const element = document.querySelector(targetSelector);
      let documentTop = 0;
      for (let parent = element; parent; parent = parent.offsetParent)
        documentTop += parent.offsetTop;
      window.scrollTo({ top: documentTop - top, behavior: "instant" });
    },
    selector,
    viewportTop,
  );
  await settleMotion();
}

async function getMotionState(selector) {
  return page.$eval(selector, (element) => {
    const style = getComputedStyle(element);
    const matrix = new DOMMatrixReadOnly(
      style.transform === "none" ? undefined : style.transform,
    );
    return {
      opacity: Number(style.opacity),
      x: matrix.m41,
      y: matrix.m42,
      scale: Math.hypot(matrix.m11, matrix.m12, matrix.m13),
      transform: style.transform,
    };
  });
}

test("SITE-R12.1 雙語短螢幕、橫向與分界的 Hero 完整可操作", async () => {
  await openHome();
  for (const preference of ["no-preference", "reduce"]) {
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: preference },
    ]);
    for (const language of ["en", "zh-TW"]) {
      if ((await page.$eval("html", (element) => element.lang)) !== language)
        await page.$eval("[data-language-switcher]", (element) => element.click());
      await page.waitForFunction(
        (expected) => document.documentElement.lang === expected,
        {},
        language,
      );
      for (const [width, height] of [
        [320, 568],
        [390, 568],
        [390, 844],
        [568, 320],
        [719, 568],
        [720, 568],
        [844, 390],
        [1440, 900],
      ]) {
        await page.setViewport({ width, height });
        await page.evaluate(() => {
          dispatchEvent(new WheelEvent("wheel"));
          window.scrollTo({ top: 0, behavior: "instant" });
        });
        await settleMotion();
        const label = `${language} ${preference} ${width}x${height}`;
        const metrics = await page.$eval(
          '#home [data-scroll-motion="hero"]',
          (card) => {
            const bounds = card.getBoundingClientRect();
            const inner = card.firstElementChild;
            const greeting = card.querySelector('[class*="greeting_card"]');
            return {
              horizontal: document.documentElement.scrollWidth > window.innerWidth,
              clipped:
                card.scrollHeight > card.clientHeight + 1 ||
                card.scrollWidth > card.clientWidth + 1 ||
                inner.scrollWidth > inner.clientWidth + 1,
              greetingScroll: greeting.scrollHeight > greeting.clientHeight + 1,
              columns: getComputedStyle(inner).gridTemplateColumns.split(" ").length,
              actions: Array.from(card.querySelectorAll("a,button"), (element) => {
                const rect = element.getBoundingClientRect();
                return {
                  width: rect.width,
                  height: rect.height,
                  contained:
                    rect.left >= bounds.left &&
                    rect.right <= bounds.right + 1 &&
                    rect.top >= bounds.top &&
                    rect.bottom <= bounds.bottom + 1,
                };
              }),
            };
          },
        );
        assert.equal(metrics.horizontal, false, label);
        assert.equal(metrics.clipped, false, label);
        assert.equal(metrics.greetingScroll, false, label);
        assert.equal(metrics.columns, width < 720 ? 1 : 2, label);
        assert.equal(metrics.actions.length, 10, label);
        assert.ok(
          metrics.actions.every(
            (action) => action.contained && action.width >= 44 && action.height >= 44,
          ),
          label + JSON.stringify(metrics.actions),
        );
        const actions = await page.$$(
          '#home [data-scroll-motion="hero"] a, #home [data-scroll-motion="hero"] button',
        );
        for (const action of actions) {
          await action.evaluate((element) =>
            element.scrollIntoView({ block: "center", behavior: "instant" }),
          );
          await settleMotion();
          assert.ok(
            await action.evaluate((element) => {
              const rect = element.getBoundingClientRect();
              const x = rect.left + rect.width / 2,
                y = rect.top + rect.height / 2;
              return (
                y > document.querySelector("header").getBoundingClientRect().bottom &&
                y < window.innerHeight &&
                element.contains(document.elementFromPoint(x, y))
              );
            }),
            label + ": each control must be reachable by page scrolling",
          );
          await action.dispose();
        }
      }
    }
  }
});

test("SITE-R13.2 長 Hero 讀完前保持清楚並可往返退場", async () => {
  await openHome();
  await page.setViewport({ width: 390, height: 568 });
  const hero = '#home [data-scroll-motion="hero"]';
  for (const language of ["en", "zh-TW"]) {
    if (language === "zh-TW")
      await page.$eval("[data-language-switcher]", (element) => element.click());
    await moveMotionTarget("#home", 0);
    const initial = await getMotionState(hero);
    const readingDistance = await page.$eval(
      "#home",
      (element) => element.offsetHeight - window.innerHeight,
    );
    assert.ok(readingDistance > 0);
    await moveMotionTarget("#home", -readingDistance + 1);
    assert.deepEqual(await getMotionState(hero), initial);
    await moveMotionTarget("#home", -readingDistance - 150);
    const exiting = await getMotionState(hero);
    assert.ok(exiting.opacity < 1 && exiting.scale < 1 && exiting.y < 0);
    await moveMotionTarget("#home", -readingDistance + 1);
    assert.deepEqual(await getMotionState(hero), initial);
  }
});

test("SITE-R13.2 Hero 往返動態", async () => {
  await openHome();
  const hero = '#home [data-scroll-motion="hero"]';
  const initial = await getMotionState(hero);
  assert.equal(initial.opacity, 1);
  assert.equal(initial.scale, 1);
  await moveMotionTarget("#home", -250);
  const away = await getMotionState(hero);
  assert.ok(away.y < -20);
  assert.ok(away.opacity < 0.9 && away.opacity > 0);
  assert.ok(away.scale < 0.98);
  assert.equal((await getMotionState('#home [data-scroll-motion="hint"]')).opacity, 0);
  await moveMotionTarget("#home", 0);
  assert.deepEqual(await getMotionState(hero), initial);
});

test("SITE-R13.7 各段落三次往返還原與停止", async () => {
  await openHome();
  const selectors = [
    '#about [data-scroll-motion="content"]',
    `${DETAIL} [data-scroll-motion="stage"]`,
    '#blog [data-scroll-motion="feature"]',
  ];
  for (const selector of selectors) {
    await moveMotionTarget(selector, 700);
    const entering = await getMotionState(selector);
    assert.ok(entering.y > 10 && entering.opacity < 0.95, selector);
    await moveMotionTarget(selector, 250);
    const reading = await getMotionState(selector);
    assert.equal(reading.opacity, 1, selector);
    assert.equal(reading.y, 0, selector);
    assert.equal(reading.scale, 1, selector);
    const height = await page.$eval(selector, (element) => element.offsetHeight);
    for (let cycle = 0; cycle < 3; cycle++) {
      await moveMotionTarget(selector, -height + 100);
      const exiting = await getMotionState(selector);
      assert.ok(exiting.opacity < 0.7 && exiting.y < 0, selector);
      await moveMotionTarget(selector, 700);
      assert.deepEqual(await getMotionState(selector), entering, selector);
    }
    await settleMotion();
    assert.deepEqual(
      await getMotionState(selector),
      entering,
      `${selector} holds when idle`,
    );
  }
  const reading = '#blog [data-scroll-motion="content"]';
  await moveMotionTarget(reading, 700);
  const entering = await getMotionState(reading);
  assert.ok(entering.opacity < 1);
  for (let cycle = 0; cycle < 3; cycle++) {
    await moveMotionTarget(reading, 300);
    assert.equal((await getMotionState(reading)).opacity, 1);
    await moveMotionTarget(reading, 700);
    assert.deepEqual(await getMotionState(reading), entering);
  }
});

test("SITE-R13.8 長段落閱讀區", async () => {
  await page.setViewport({ width: 390, height: 844 });
  await openHome();
  const longContent =
    '#about [data-scroll-timeline]:nth-child(2) [data-scroll-motion="content"]';

  // Explicit lines keep this case taller than the viewport across fonts and copy changes.
  await page.$eval(longContent, (element) => {
    const description = element.lastElementChild;
    description.replaceChildren();
    for (let line = 0; line < 40; line++)
      description.append("Work experience detail.", document.createElement("br"));
  });
  for (const fontFamily of ["Arial, sans-serif", "monospace"]) {
    await page.$eval(
      longContent,
      (element, font) => {
        element.style.fontFamily = font;
      },
      fontFamily,
    );
    await settleMotion();
    assert.ok(
      await page.$eval(
        longContent,
        (element) => element.offsetHeight > window.innerHeight,
      ),
      `Long-content fixture must exceed the viewport with ${fontFamily}`,
    );
    for (const top of [100, -250]) {
      await moveMotionTarget(longContent, top);
      const state = await getMotionState(longContent);
      assert.equal(state.opacity, 1, fontFamily);
      assert.equal(state.y, 0, fontFamily);
      assert.equal(state.scale, 1, fontFamily);
    }
  }
});

test("SITE-R13.8 聚焦維持進退場與景深", async () => {
  const hero = '#home [data-scroll-motion="hero"]';
  const stage = `${DETAIL} [data-scroll-motion="stage"]`;
  const feature = '#blog [data-scroll-motion="feature"]';
  const reading = '#blog [data-scroll-motion="content"]';
  const cases = [
    { anchor: hero, targets: [hero], focus: [`${hero} a`] },
    {
      anchor: stage,
      targets: [
        `${DETAIL} > [data-scroll-motion="content"]:first-child`,
        stage,
        `${DETAIL} [data-scroll-motion="device"]`,
        `${DETAIL} [data-scroll-motion="secondary-device"]`,
        `${DETAIL} > [data-scroll-motion="content"]:last-child`,
      ],
      focus: [DETAIL, `${DETAIL} a`],
    },
    { anchor: feature, targets: [feature], focus: [feature] },
    { anchor: reading, targets: [reading], focus: [reading] },
  ];
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewport(viewport);
    await openHome();
    for (const { anchor, targets, focus } of cases) {
      const height = await page.$eval(anchor, (element) => element.offsetHeight);
      const positions =
        anchor === hero ? [-250] : [viewport.height * 0.78, -height + 100];
      const getStates = () => Promise.all(targets.map(getMotionState));
      for (const position of positions) {
        await moveMotionTarget(anchor, position);
        const before = await getStates();
        assert.ok(before[anchor === stage ? 1 : 0].opacity < 1, anchor);
        const scrollTop = await page.evaluate(() => window.scrollY);
        for (const selector of focus) {
          await page.$eval(selector, (element) =>
            element.focus({ preventScroll: true }),
          );
          await settleMotion();
          assert.equal(await page.evaluate(() => window.scrollY), scrollTop);
          assert.deepEqual(await getStates(), before, `${selector} focused`);
          await page.evaluate(
            (top) => window.scrollTo({ top: top - 40, behavior: "instant" }),
            scrollTop,
          );
          await settleMotion();
          const focusedScroll = await getStates();
          assert.notDeepEqual(focusedScroll, before, `${selector} scrolls with focus`);
          await page.$eval(selector, (element) => element.blur());
          await settleMotion();
          assert.deepEqual(await getStates(), focusedScroll, `${selector} blurred`);
          await moveMotionTarget(anchor, position);
          assert.deepEqual(await getStates(), before, `${selector} restored`);
        }
      }
    }
  }
});

test("SITE-R13.9 Hash 直達與重載的動態狀態", async () => {
  const selectors = {
    home: '#home [data-scroll-motion="hero"]',
    about: '#about [data-scroll-motion="heading"]',
    projects: `${DETAIL} [data-scroll-motion="stage"]`,
    blog: '#blog [data-scroll-motion="feature"]',
  };
  for (const [section, selector] of Object.entries(selectors)) {
    await page.goto("about:blank");
    await openHome(`#${section}`);
    await waitForSection(section);
    await settleMotion();
    const state = await getMotionState(selector);
    const top = await page.evaluate(() => window.scrollY);
    await page.reload({ waitUntil: "networkidle0" });
    await page.waitForFunction(
      (position) => Math.abs(window.scrollY - position) <= 1,
      {},
      top,
    );
    await settleMotion();
    assert.deepEqual(await getMotionState(selector), state, section);
  }
});

test("SITE-R13.9 雙語與尺寸重算", async () => {
  await openHome();
  const selector =
    '#about [data-scroll-timeline]:nth-child(3) [data-scroll-motion="content"]';
  for (const [language, width] of [
    ["en", 720],
    ["zh-TW", 721],
    ["en", 390],
  ]) {
    await page.setViewport({ width, height: 844 });
    if ((await page.$eval("html", (element) => element.lang)) !== language)
      await page.$eval("[data-language-switcher]", (element) => element.click());
    await page.waitForFunction(
      (expected) => document.documentElement.lang === expected,
      {},
      language,
    );
    await moveMotionTarget(selector, 600);
    const state = await getMotionState(selector);
    const top = await page.evaluate(() => window.scrollY);
    await page.reload({ waitUntil: "networkidle0" });
    await page.evaluate((position) => {
      dispatchEvent(new WheelEvent("wheel"));
      window.scrollTo({ top: position, behavior: "instant" });
    }, top);
    await settleMotion();
    assert.deepEqual(await getMotionState(selector), state, `${language} ${width}`);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    );
  }
});

test("SITE-R13.10 原生捲動與閒置更新", async () => {
  await openHome();
  await moveMotionTarget('#about [data-scroll-motion="content"]', 500);
  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel({ deltaY: 300 });
  await page.waitForFunction(
    (position) => window.scrollY >= position + 299,
    {},
    before,
  );
  await settleMotion();
  assert.ok(Math.abs((await page.evaluate(() => window.scrollY)) - before - 300) < 2);
  const mutations = await page.evaluate(
    () =>
      new Promise((resolveIdle) => {
        let writes = 0;
        const observer = new MutationObserver((records) => {
          writes += records.length;
        });
        observer.observe(document.querySelector("[data-scroll-motion-active]"), {
          attributes: true,
          subtree: true,
          attributeFilter: ["style"],
        });
        let frames = 0;
        const sample = () => {
          if (++frames === 6) {
            observer.disconnect();
            resolveIdle(writes);
          } else requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      }),
  );
  assert.equal(mutations, 0, "idle motion must not keep writing styles");
});

test("SITE-R13.11 靜態內容與列印隔離", async () => {
  const html = await readFile(join(BUILD, "index.html"), "utf8");
  assert.ok(!html.includes("data-scroll-motion-active"));
  assert.ok(!html.includes("--scroll-"));
  await page.setJavaScriptEnabled(false);
  await page.goto(server.origin, { waitUntil: "networkidle0" });
  const states = await page.$$eval("[data-scroll-motion]:not([inert])", (elements) =>
    elements
      .filter((element) => !element.closest("[inert]"))
      .map((element) => ({
        opacity: getComputedStyle(element).opacity,
        transform: getComputedStyle(element).transform,
      })),
  );
  assert.ok(states.length > 30);
  assert.ok(
    states.every((state) => state.opacity === "1" && state.transform === "none"),
  );
  await page.setJavaScriptEnabled(true);
  await openHome();
  assert.ok(await page.$("#home a[download]"));
  await enterPreview();
  const result = await getPrintResult();
  assert.equal(result.pages, 1);
  assert.equal(result.metrics.count, 1);
  assert.equal(result.metrics.header, "none");
  await page.goBack();
  await page.waitForSelector("[data-scroll-motion-active]");
});

async function assertFocusRing(color, offset = 3) {
  await page.waitForFunction(
    (expectedOffset) => {
      const style = getComputedStyle(document.activeElement);
      return (
        style.outlineWidth === "2px" && style.outlineOffset === `${expectedOffset}px`
      );
    },
    {},
    offset,
  );
  const ring = await page.evaluate(() => {
    const element = document.activeElement;
    const style = getComputedStyle(element);
    return {
      color: style.outlineColor,
      width: style.outlineWidth,
      style: style.outlineStyle,
      offset: style.outlineOffset,
      visible: element.matches(":focus-visible"),
    };
  });
  assert.deepEqual(ring, {
    color,
    width: "2px",
    style: "solid",
    offset: `${offset}px`,
    visible: true,
  });
}

test("SITE-R18.1 依區域與控制尺寸共用鍵盤焦點框", async () => {
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await openHome();
  for (const width of [1440, 390]) {
    await page.setViewport({ width, height: width === 1440 ? 900 : 844 });
    for (const language of ["en", "zh-TW"]) {
      await page.evaluate(() => localStorage.setItem("preferred_language", "en"));
      await openHome();
      if (language === "zh-TW")
        await page.$eval("[data-language-switcher]", (element) => element.click());
      const reached = { header: 0, content: 0, footer: 0, surfaces: 0 };
      for (let index = 0; index < 40; index += 1) {
        await page.keyboard.press("Tab");
        const target = await page.evaluate(() => {
          const element = document.activeElement;
          return {
            body: element === document.body,
            skip: element.getAttribute("href") === "#main-content",
            region: element.closest("header")
              ? "header"
              : element.closest("footer")
                ? "footer"
                : "content",
            surface:
              element.getAttribute("role") === "tabpanel" ||
              (element.closest("#blog") && !element.className.includes("archiveLink")),
            menu: element.getAttribute("aria-controls") === "site-navigation",
          };
        });
        if (target.body || (index > 0 && target.skip)) break;
        reached[target.region] += 1;
        if (target.surface) reached.surfaces += 1;
        await assertFocusRing(
          target.region === "header"
            ? "rgb(34, 34, 34)"
            : target.region === "footer"
              ? "rgb(159, 167, 110)"
              : "rgb(82, 92, 48)",
          target.surface ? 5 : 3,
        );
        if (target.menu) await page.keyboard.press("Enter");
      }
      assert.equal(reached.header, width === 1440 ? 6 : 7);
      assert.equal(reached.content, 21);
      assert.equal(reached.footer, 4);
      assert.equal(reached.surfaces, 4);

      await page.focus(`${TABS}:first-child`);
      for (let index = 0; index < 3; index += 1) {
        await assertFocusRing("rgb(82, 92, 48)");
        assert.equal(
          await page.$eval(`${TABS}:nth-child(${index + 1})`, (element) =>
            element.getAttribute("aria-selected"),
          ),
          "true",
        );
        await page.keyboard.press("Tab");
        await assertFocusRing("rgb(82, 92, 48)", 5);
        await page.keyboard.press("Tab");
        await assertFocusRing("rgb(82, 92, 48)");
        await page.keyboard.press("Tab");
        await assertFocusRing("rgb(82, 92, 48)");
        await page.focus(`${TABS}:nth-child(${index + 1})`);
        if (index < 2) await page.keyboard.press("ArrowRight");
      }

      await page.focus(QR);
      await page.keyboard.press("Enter");
      await page.waitForSelector(`${QR_DIALOG}[open]`);
      await assertFocusRing("rgb(82, 92, 48)");
      await page.keyboard.press("Escape");
      await assertFocusRing("rgb(82, 92, 48)");

      await enterPreview();
      await page.focus('[class*="resumePage"] button');
      await assertFocusRing("rgb(34, 34, 34)");
      await page.focus('[data-resume-root] a[href^="mailto:"]');
      await assertFocusRing("rgb(34, 34, 34)");
    }
  }
});

test("SITE-R18.2 深淺背景對比與滿版目的地的實際可見框線", async () => {
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await openHome();
  await page.keyboard.press("Tab");
  for (const [selector, surface] of [
    ["header [data-language-switcher]", ".site-layout"],
    [`${DETAIL} a[class*="visit"]`, "#projects"],
    ['#blog a[class*="featured"]', ".site-layout"],
    ['footer a[title="GitHub"]', "footer"],
  ]) {
    await page.$eval(selector, (element) => {
      element.scrollIntoView({ block: "center", behavior: "instant" });
      element.focus({ preventScroll: true });
    });
    await settleMotion();
    const colors = await page.$eval(
      selector,
      (element, surfaceSelector) => [
        getComputedStyle(element).outlineColor,
        getComputedStyle(document.querySelector(surfaceSelector)).backgroundColor,
      ],
      surface,
    );
    const luminances = colors.map((color) => {
      const channels = color
        .match(/[\d.]+/g)
        .slice(0, 3)
        .map(Number)
        .map((value) => {
          const channel = value / 255;
          return channel <= 0.04045
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4;
        });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    });
    assert.ok(
      (Math.max(...luminances) + 0.05) / (Math.min(...luminances) + 0.05) >= 3,
      `${selector}: ${colors.join(" on ")}`,
    );
  }

  for (const width of [1440, 390]) {
    await page.setViewport({ width, height: 900 });
    await page.evaluate(() => localStorage.setItem("preferred_language", "en"));
    await openHome();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => document.activeElement.id), "main-content");
    await assertFocusRing("rgb(34, 34, 34)", -2);
    await assertVisibleEdges([34, 34, 34]);
    for (const section of ["home", "about", "projects", "blog"]) {
      if (width === 390) {
        await page.focus('header button[aria-controls="site-navigation"]');
        await page.keyboard.press("Enter");
      }
      await page.focus(`header a[href="#${section}"]`);
      await page.keyboard.press("Enter");
      await waitForSection(section);
      assert.equal(await page.evaluate(() => document.activeElement.id), section);
      await assertFocusRing("rgb(82, 92, 48)", -2);
      await assertVisibleEdges([82, 92, 48]);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        ),
        false,
      );
    }
  }
});

async function assertVisibleEdges(color) {
  await settleMotion();
  const screenshot = await page.screenshot({ encoding: "base64" });
  const edges = await page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    const scale = image.width / window.innerWidth;
    const y = Math.round(
      (document.querySelector("header").getBoundingClientRect().bottom + 20) * scale,
    );
    return [0, image.width - 1].map((x) =>
      [...context.getImageData(x, y, 1, 1).data].slice(0, 3),
    );
  }, screenshot);
  assert.deepEqual(edges, [color, color]);
}

test("SITE-R18.3 強制色彩使用系統焦點色並保留外框", async () => {
  // Puppeteer's media-feature helper does not support forced-colors.
  const client = await page.createCDPSession();
  await client.send("Emulation.setEmulatedMedia", {
    media: "screen",
    features: [
      { name: "forced-colors", value: "active" },
      { name: "prefers-reduced-motion", value: "reduce" },
    ],
  });
  await openHome();
  assert.equal(
    await page.evaluate(() => matchMedia("(forced-colors: active)").matches),
    true,
  );
  const systemColor = await page.evaluate(() => {
    const sample = document.createElement("span");
    sample.style.color = "Highlight";
    document.body.append(sample);
    const color = getComputedStyle(sample).color;
    sample.remove();
    return color;
  });
  await page.keyboard.press("Tab");
  for (const [selector, offset] of [
    ["[data-language-switcher]", 3],
    [TABS, 3],
    [DETAIL, 5],
    [`${DETAIL} a`, 3],
    ['#blog a[class*="featured"]', 5],
    ['footer a[title="GitHub"]', 3],
  ]) {
    await page.focus(selector);
    await assertFocusRing(systemColor, offset);
  }
  await page.focus(QR);
  await page.keyboard.press("Enter");
  await page.waitForSelector(`${QR_DIALOG}[open]`);
  await assertFocusRing(systemColor);
  await page.keyboard.press("Escape");
  await assertFocusRing(systemColor);
});

test("SITE-R18.4 焦點樣式保留輸入方式、選取、dialog 與列印行為", async () => {
  for (const reduced of [false, true]) {
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: reduced ? "reduce" : "no-preference" },
    ]);
    await openHome("#projects");
    await selectProject(2);
    assert.equal(
      await page.$eval(`${TABS}:nth-child(2)`, (element) =>
        element.matches(":focus-visible"),
      ),
      false,
    );
    await page.keyboard.press("Tab");
    await assertFocusRing("rgb(82, 92, 48)", 5);
    await page.keyboard.down("Shift");
    await page.keyboard.press("Tab");
    await page.keyboard.up("Shift");
    await assertFocusRing("rgb(82, 92, 48)");
    await page.keyboard.press("End");
    assert.equal(
      await page.$eval(`${TABS}:nth-child(3)`, (element) =>
        element.getAttribute("aria-selected"),
      ),
      "true",
    );
    await page.keyboard.press("Home");
    await page.keyboard.press("ArrowRight");
    assert.equal(
      await page.$eval(`${TABS}:nth-child(2)`, (element) =>
        element.getAttribute("aria-selected"),
      ),
      "true",
    );
    assert.equal(
      await page.$eval('header a[href="#projects"]', (element) =>
        element.getAttribute("aria-current"),
      ),
      "location",
    );

    await page.focus(QR);
    await page.keyboard.press("Enter");
    await page.waitForSelector(`${QR_DIALOG}[open]`);
    await assertFocusRing("rgb(82, 92, 48)");
    await page.keyboard.press("Escape");
    assert.ok(await page.$eval(QR, (element) => document.activeElement === element));
    await assertFocusRing("rgb(82, 92, 48)");
    await enterPreview();
    await page.focus('[data-resume-root] a[href^="mailto:"]');
    await assertFocusRing("rgb(34, 34, 34)");
    await page.emulateMediaType("print");
    const printRing = await page.evaluate(() => {
      const style = getComputedStyle(document.activeElement);
      return { style: style.outlineStyle, offset: style.outlineOffset };
    });
    const browserPrintRing = await page.evaluate(() => {
      const sheets = [...document.styleSheets].filter((sheet) => !sheet.disabled);
      sheets.forEach((sheet) => {
        sheet.disabled = true;
      });
      const style = getComputedStyle(document.activeElement);
      const ring = { style: style.outlineStyle, offset: style.outlineOffset };
      sheets.forEach((sheet) => {
        sheet.disabled = false;
      });
      return ring;
    });
    assert.deepEqual(printRing, browserPrintRing);
    await page.emulateMediaType("screen");
  }
});
