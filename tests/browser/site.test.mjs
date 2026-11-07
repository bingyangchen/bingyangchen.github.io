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
      document.querySelector("[data-resume-root]"),
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
  return {
    metrics,
    pages: pdf.toString("latin1").match(/\/Type\s*\/Page\b/g)?.length,
    mediaBox: pdf.toString("latin1").match(/\/MediaBox\s*\[([^\]]+)\]/)?.[1],
    language: pdf
      .toString("latin1")
      .match(/\/Type\s*\/Catalog\b[\s\S]*?\/Lang\s*\(([^)]+)\)/)?.[1],
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

test("SITE-R10.4 SITE-R10.5 英文履歷與單一 portal", async () => {
  await openHome();
  assert.equal(
    await page.$$eval("[data-resume-root]", (elements) => elements.length),
    1,
  );
  assert.equal(await page.$("#root [data-resume-root]"), null);
  for (const language of ["en", "zh-TW"]) {
    if (language === "zh-TW") await page.click("[data-language-switcher]");
    await page.waitForFunction(
      (expected) => document.documentElement.lang === expected,
      {},
      language,
    );
    const home = await page.$eval("[data-resume-root]", (element) => ({
      text: element.textContent,
      language: element.closest("[lang]").lang,
    }));
    assert.equal(home.language, "en");
    assert.ok(home.text.includes("Career Summary"));
    await enterPreview();
    assert.equal(
      await page.$$eval("[data-resume-root]", (elements) => elements.length),
      1,
    );
    assert.deepEqual(
      await page.$eval("[data-resume-root]", (element) => ({
        text: element.textContent,
        language: element.closest("[lang]").lang,
      })),
      home,
    );
    assert.equal(
      await page.$eval('[class*="resumePage"]', (element) => element.lang),
      "en",
    );
    await page.goBack();
    await page.waitForSelector("#home");
  }
});

test("SITE-R10.4 SITE-R11.1 SITE-R11.2 SITE-R11.4 A4、列印語言與共用結果", async () => {
  await openHome();
  for (const language of ["en", "zh-TW"]) {
    if (language === "zh-TW") await page.click("[data-language-switcher]");
    await page.waitForFunction(
      (expected) => document.documentElement.lang === expected,
      {},
      language,
    );
    const home = await getPrintResult();
    assert.equal(await page.evaluate(() => document.documentElement.lang), language);
    await enterPreview();
    const preview = await getPrintResult();
    assert.equal(await page.evaluate(() => document.documentElement.lang), language);
    assert.equal(home.pages, 1);
    assert.equal(preview.pages, 1);
    assert.equal(home.mediaBox, preview.mediaBox);
    const dimensions = home.mediaBox.trim().split(/\s+/).map(Number);
    assert.ok(Math.abs(dimensions[2] - 595) < 2 && Math.abs(dimensions[3] - 842) < 2);
    assert.equal(home.metrics.text, preview.metrics.text);
    for (const result of [home, preview]) {
      assert.equal(result.language, "en");
      assert.equal(result.metrics.count, 1);
      assert.equal(result.metrics.visible, "visible");
      assert.ok(result.metrics.bottom <= result.metrics.height + 1);
      assert.equal(result.metrics.header, "none");
      assert.equal(result.metrics.footer, "none");
      assert.equal(result.metrics.language, "hidden");
      for (const section of ["SKILLS", "CAREER SUMMARY", "EDUCATION", "SOCIAL LINKS"])
        assert.ok(result.metrics.text.includes(section));
    }
    await page.goBack();
    await page.waitForSelector("#home");
  }
});

test("SITE-R13.3 完整減少動態與即時切換", async () => {
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await openHome();
  async function assertStaticMotion() {
    await page.hover('#home [class*="avatar_container"]');
    assert.equal(
      await page.$eval(
        '#home [class*="avatar"][class*="front"]',
        (element) => getComputedStyle(element).transform,
      ),
      "none",
    );
    assert.equal(
      await page.$eval(
        '#home [class*="avatar"][class*="back"]',
        (element) => getComputedStyle(element).display,
      ),
      "none",
    );
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
  await page.hover('#home [class*="avatar_container"]');
  await page.waitForFunction(() => {
    const element = document.querySelector('#home [class*="avatar"][class*="front"]');
    return new DOMMatrixReadOnly(getComputedStyle(element).transform).m11 < 0;
  });
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

test("SITE-R13.8 長段落與作品焦點", async () => {
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
  await page.setViewport({ width: 1440, height: 900 });
  const stage = `${DETAIL} [data-scroll-motion="stage"]`;
  await moveMotionTarget(stage, 700);
  assert.ok((await getMotionState(stage)).opacity < 1);
  const before = await page.evaluate(() => window.scrollY);
  await page.$eval(DETAIL, (panel) => panel.focus({ preventScroll: true }));
  await settleMotion();
  assert.equal(await page.evaluate(() => window.scrollY), before);
  for (const kind of ["content", "stage", "device", "secondary-device"]) {
    const state = await getMotionState(`${DETAIL} [data-scroll-motion="${kind}"]`);
    assert.equal(state.opacity, 1);
    assert.equal(state.scale, 1);
    assert.equal(state.x, 0);
    assert.equal(state.y, 0);
  }
  await page.focus("[data-language-switcher]");
  await settleMotion();
  assert.ok((await getMotionState(stage)).opacity < 1);
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
  const result = await getPrintResult();
  assert.equal(result.pages, 1);
  assert.equal(result.metrics.count, 1);
  assert.equal(result.metrics.header, "none");
  await page.waitForSelector("[data-scroll-motion-active]");
});
