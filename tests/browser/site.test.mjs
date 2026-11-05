import assert from "node:assert/strict";
import { before, after, beforeEach, afterEach, test } from "node:test";
import { readFile, stat, mkdtemp, mkdir, copyFile, writeFile, symlink, rm } from "node:fs/promises";
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
let server;
let browser;
let context;
let page;
let pageErrors;

before(async () => {
  await stat(join(BUILD, "index.html"));
  server = await startStaticServer(BUILD);
  browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
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
  await page.evaluateOnNewDocument(() => Object.defineProperty(navigator, "language", { get: () => "en-US" }));
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (new URL(request.url()).origin === server.origin || request.url().startsWith("data:")) void request.continue();
    else void request.respond({ status: 200, contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"/>' });
  });
});

afterEach(async () => {
  await context?.close();
  assert.deepEqual(pageErrors, [], "uncaught browser errors");
});

async function openHome(hash = "") {
  const response = await page.goto(server.origin + "/" + hash, { waitUntil: "networkidle0" });
  assert.equal(response.status(), 200);
  await page.waitForFunction(() => document.documentElement.lang === "en" && document.querySelector('[data-resume-root]'));
}

async function selectProject(index = 1) {
  await page.click(`${TABS}:nth-child(${index})`);
  await page.waitForFunction((selector) => document.querySelector(selector).getAttribute("aria-selected") === "true", {}, `${TABS}:nth-child(${index})`);
}

async function enterPreview() {
  await page.evaluate(() => {
    history.pushState({}, "", "/resume");
    dispatchEvent(new PopStateEvent("popstate"));
  });
  await page.waitForSelector('[class*="resumePage"]');
}

async function getPrintResult() {
  await page.emulateMediaType("print");
  await page.waitForFunction(() => getComputedStyle(document.querySelector('[aria-label="Toggle language"]')).visibility === "hidden");
  await page.evaluate(() => document.fonts.ready);
  const metrics = await page.$eval("[data-resume-root]", (sheet) => ({
    text: sheet.innerText,
    height: sheet.getBoundingClientRect().height,
    bottom: sheet.lastElementChild.getBoundingClientRect().bottom - sheet.getBoundingClientRect().top,
    visible: getComputedStyle(sheet).visibility,
    count: document.querySelectorAll("[data-resume-root]").length,
    header: getComputedStyle(document.querySelector("header")).display,
    footer: getComputedStyle(document.querySelector("footer")).display,
    language: getComputedStyle(document.querySelector('[aria-label="Toggle language"]')).visibility,
  }));
  const pdf = Buffer.from(await page.pdf({ preferCSSPageSize: true, printBackground: true }));
  await page.emulateMediaType("screen");
  return { metrics, pages: pdf.toString("latin1").match(/\/Type\s*\/Page\b/g)?.length, mediaBox: pdf.toString("latin1").match(/\/MediaBox\s*\[([^\]]+)\]/)?.[1] };
}

test("SITE-R1.1 SITE-R1.2 SITE-R7.1 公開首頁與初始作品", async () => {
  await openHome();
  assert.deepEqual(await page.$$eval("#home,#about,#projects,#blog", (elements) => elements.map((element) => element.id)), ["home", "about", "projects", "blog"]);
  assert.equal(await page.$$eval("main > header,main > footer", (elements) => elements.length), 2);
  assert.deepEqual(await page.$$eval(TABS, (elements) => elements.map((element) => element.textContent)), ["Taigu", "Noads", "Leechai"]);
  assert.equal(await page.$eval(`${DETAIL} h3`, (element) => element.textContent), "Taigu");
});

test("SITE-R1.3 非公開履歷與未知路徑不使用 SPA fallback", async () => {
  for (const path of ["/resume", "/resume/", "/missing"]) assert.equal((await fetch(server.origin + path)).status, 404);
  await openHome();
  assert.equal(await page.$('a[href="/resume"]'), null);
});

test("SITE-R1.4 非公開本機預覽", async () => {
  await openHome();
  await enterPreview();
  assert.equal(await page.$eval("h1", (element) => element.textContent), "Resume");
  assert.equal(await page.$$eval("[data-resume-root]", (elements) => elements.length), 1);
  assert.ok(await page.$('button'));
});

test("SITE-R2.1 SITE-R2.2 導覽與自然捲動", async () => {
  await openHome();
  const initialLength = await page.evaluate(() => history.length);
  await page.click('[class*="nav_links"] a[href="#about"]');
  await page.waitForFunction(() => Math.abs(document.getElementById("about").getBoundingClientRect().top) < 2);
  assert.equal(await page.evaluate(() => location.hash), "#about");
  assert.equal(await page.evaluate(() => history.length), initialLength + 1);
  await page.evaluate(() => document.getElementById("projects").scrollIntoView({ behavior: "instant" }));
  await page.waitForFunction(() => location.hash === "#projects");
  assert.equal(await page.evaluate(() => history.length), initialLength + 1);
  await page.waitForNetworkIdle({ idleTime: 250 });
  await page.goBack({ waitUntil: "networkidle0" });
  await page.waitForFunction(() => scrollY < 2);
});

test("SITE-R2.5 SITE-R2.6 Header 門檻與 Logo 回頂端", async () => {
  await openHome();
  assert.equal(await page.$eval("header", (element) => getComputedStyle(element).display), "none");
  await page.evaluate(() => scrollTo({ top: innerHeight + 20, behavior: "instant" }));
  await page.waitForFunction(() => getComputedStyle(document.querySelector("header")).display !== "none");
  assert.equal(await page.$$eval('header a[href^="#"]', (elements) => elements.length), 4);
  await page.click('header a[href="/"]');
  await page.waitForFunction(() => scrollY < 2);
});

test("SITE-R4.1 SITE-R4.2 雙向切換與 reload 持久化", async () => {
  await openHome();
  const toggle = 'button[aria-label="Toggle language"]';
  await page.click(toggle);
  await page.waitForFunction(() => document.documentElement.lang === "zh-TW");
  assert.equal(await page.evaluate(() => localStorage.getItem("preferred_language")), "zh-TW");
  await page.reload({ waitUntil: "networkidle0" });
  assert.equal(await page.$eval("h1", (element) => element.textContent), "陳秉洋");
  await page.click(toggle);
  await page.waitForFunction(() => document.documentElement.lang === "en");
});

test("SITE-R4.3 作品詳情中切換語言", async () => {
  await openHome();
  await selectProject();
  const english = await page.$eval(`${DETAIL} [class*="description"]`, (element) => element.textContent);
  await page.click('[aria-label="Toggle language"]');
  await page.waitForFunction(() => document.documentElement.lang === "zh-TW");
  assert.equal(await page.$eval(`${DETAIL} h3`, (element) => element.textContent), "Taigu");
  assert.notEqual(await page.$eval(`${DETAIL} [class*="description"]`, (element) => element.textContent), english);
});

test("SITE-R4.4 QR 中切換語言保留 dialog", async () => {
  await openHome();
  await page.click(QR);
  await page.evaluate(() => document.querySelector('[aria-label="Toggle language"]').click());
  await page.waitForFunction(() => document.documentElement.lang === "zh-TW");
  assert.ok((await page.$eval('[role="dialog"]', (element) => element.textContent)).includes("陳秉洋"));
});

test("SITE-R4.5 Tab、Enter 與 Space 操作語言按鈕", async () => {
  await openHome();
  let reached = false;
  for (let index = 0; index < 80; index += 1) {
    await page.keyboard.press("Tab");
    reached = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") === "Toggle language");
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
  await page.waitForFunction(() => !document.querySelector('[class*="greeting_card"] [class*="cursor"]'), { timeout: 25000 });
  assert.equal(await page.$eval('[class*="greeting_card"]', (element) => element.textContent), "Software engineer focused on web apps that stay maintainable after launch.");
});

test("SITE-R5.4 SITE-R6.4 社群、學校與外部部落格目的地", async () => {
  await openHome();
  const links = await page.$$eval('#home a[target="_blank"],#blog a', (elements) => elements.map((element) => ({ href: element.href, target: element.target })));
  for (const href of ["https://github.com/bingyangchen", "https://www.linkedin.com/in/bing-yang-chen/", "https://www.cake.me/me/BingYangChen", "https://econo.nccu.edu.tw/", "https://blog.byc1999.com/list"]) {
    assert.ok(links.some((link) => link.href === href && link.target === "_blank"), href);
  }
});

test("SITE-R7.2 SITE-R7.3 SITE-R7.7 作品切換與重載", async () => {
  await openHome();
  await page.$eval("#projects", (element) => element.scrollIntoView({ behavior: "instant" }));
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const before = await page.evaluate(() => ({ scroll: scrollY, height: document.documentElement.scrollHeight }));
  await selectProject(2);
  assert.equal(await page.$eval(`${DETAIL} h3`, (element) => element.textContent), "Noads");
  assert.equal(await page.$$eval(DETAIL, (elements) => elements.length), 1);
  assert.equal(await page.$eval(`${DETAIL} a`, (element) => element.href), "https://chromewebstore.google.com/detail/noads/mcdfnneilaagajpfcfiofdjibclkflhg");
  assert.deepEqual(await page.evaluate(() => ({ scroll: scrollY, height: document.documentElement.scrollHeight })), before);
  await selectProject(2);
  assert.equal(await page.$eval(`${DETAIL} h3`, (element) => element.textContent), "Noads");
  await selectProject(3);
  assert.equal(await page.$eval(`${DETAIL} h3`, (element) => element.textContent), "Leechai");
  await page.reload({ waitUntil: "networkidle0" });
  assert.equal(await page.$eval(`${DETAIL} h3`, (element) => element.textContent), "Taigu");
});

test("SITE-R7.8 鍵盤操作作品", async () => {
  await page.setViewport({ width: 390, height: 700 });
  await openHome();
  await selectProject();
  await page.evaluate(() => window.scrollTo({ top: document.getElementById("projects").offsetTop + 500, behavior: "instant" }));
  const before = await page.evaluate(() => scrollY);
  for (const [key, title] of [["ArrowLeft", "Leechai"], ["ArrowRight", "Taigu"], ["End", "Leechai"], ["Home", "Taigu"]]) {
    await page.keyboard.press(key);
    assert.equal(await page.$eval(`${DETAIL} h3`, (element) => element.textContent), title);
    assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), title);
    assert.equal(await page.evaluate(() => scrollY), before);
  }
  await page.keyboard.press("Space");
  await page.keyboard.press("Enter");
  assert.equal(await page.$eval(`${DETAIL} h3`, (element) => element.textContent), "Taigu");
  assert.equal(await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle), "solid");
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute("role")), "tabpanel");
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), "Explore Taigu");
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), "Source Code");
  const client = await page.createCDPSession();
  const tree = await client.send("Accessibility.getFullAXTree");
  assert.equal(tree.nodes.filter((node) => node.role?.value === "tabpanel" && !node.ignored).length, 1);
});

test("SITE-R12.3 作品詳情分支", async () => {
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await openHome();
  for (const width of [320, 390, 512, 513, 720, 721, 1024, 1025, 1440]) {
    await page.setViewport({ width, height: 844 });
    for (const language of ["en", "zh-TW"]) {
      if (await page.$eval("html", (element) => element.lang) !== language) await page.evaluate(() => document.querySelector('[aria-label="Toggle language"]').click());
      let height;
      for (const index of [1, 2, 3]) {
        await page.$eval("#projects", (element) => element.scrollIntoView({ behavior: "instant", block: "start" }));
        await selectProject(index);
        await page.evaluate(async () => Promise.all([...document.querySelectorAll("#projects img")].map((image) => image.decode())));
        const metrics = await page.$eval(DETAIL, (panel) => {
          const stage = panel.querySelector('[class*="productStage"]').getBoundingClientRect();
          const intro = panel.querySelector('[class*="projectIntro"]').getBoundingClientRect();
          const content = panel.querySelector('[class*="projectContent"]').getBoundingClientRect();
          return {
            pageHeight: document.documentElement.scrollHeight,
            sectionWidth: document.getElementById("projects").scrollWidth,
            vertical: stage.top >= intro.bottom && content.top >= stage.bottom,
            imageBounds: [...panel.querySelector('[class*="productArt"]').children].filter((element) => getComputedStyle(element).display !== "none").every((element) => { const rect = element.getBoundingClientRect(); return rect.left >= stage.left - 0.5 && rect.right <= stage.right + 0.5 && rect.top >= stage.top - 0.5 && rect.bottom <= stage.bottom + 0.5; }),
            targets: [...document.querySelectorAll('#projects [role="tab"], #projects [aria-hidden="false"] a')].map((element) => element.getBoundingClientRect().height),
          };
        });
        assert.ok(metrics.sectionWidth <= width, `overflow at ${width} ${language}`);
        assert.equal(metrics.vertical, width <= 720, `layout at ${width} ${language}`);
        assert.ok(metrics.imageBounds, `artwork outside stage at ${width} ${language}`);
        assert.ok(metrics.targets.every((target) => target >= 44));
        if (height !== undefined) assert.equal(metrics.pageHeight, height, `unstable height at ${width} ${language}`);
        height = metrics.pageHeight;
        for (const link of await page.$$(`${DETAIL} a`)) {
          await link.evaluate((element) => {
            const rect = element.getBoundingClientRect();
            const switcher = document.querySelector('[aria-label="Toggle language"]').getBoundingClientRect();
            const targetCenter = (switcher.top + switcher.bottom) / 2;
            window.scrollBy({ top: rect.top + rect.height / 2 - targetCenter, behavior: "instant" });
          });
          assert.ok(await link.evaluate((element) => { const rect = element.getBoundingClientRect(); return element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)); }), `obstructed action at ${width} ${language}`);
        }
      }
    }
  }
});

test("SITE-R13.4 作品動態偏好", async () => {
  await openHome();
  await selectProject(2);
  assert.notEqual(await page.$eval(`${DETAIL} [class*="productArt"]`, (element) => getComputedStyle(element).animationName), "none");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await selectProject(3);
  assert.equal(await page.$eval(`${DETAIL} [class*="productArt"]`, (element) => getComputedStyle(element).animationName), "none");
  assert.equal(await page.$eval(`${DETAIL} a`, (element) => getComputedStyle(element).transitionDuration), "0s");
});

test("SITE-R9.1 SITE-R9.2 SITE-R9.3 SITE-R9.4 QR 的所有關閉入口", async () => {
  await openHome();
  await page.click(QR);
  await page.waitForSelector('[role="dialog"]');
  assert.equal(await page.evaluate(() => document.body.style.overflow), "hidden");
  await page.click('[role="dialog"]');
  assert.ok(await page.$('[role="dialog"]'));
  await page.click('[class*="qr_modal_overlay"]', { offset: { x: 5, y: 5 } });
  assert.equal(await page.$('[role="dialog"]'), null);
  await page.click(QR);
  await page.click('[aria-label="Close QR code"]');
  assert.equal(await page.$('[role="dialog"]'), null);
  await page.click(QR);
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
  assert.equal(await page.evaluate(() => document.body.style.overflow), "");
});

test("SITE-R10.4 SITE-R10.5 英文履歷與單一 portal", async () => {
  await openHome();
  assert.equal(await page.$$eval("[data-resume-root]", (elements) => elements.length), 1);
  assert.equal(await page.$('#root [data-resume-root]'), null);
  await page.click('[aria-label="Toggle language"]');
  assert.ok((await page.$eval("[data-resume-root]", (element) => element.textContent)).includes("Career Summary"));
  await enterPreview();
  assert.equal(await page.$$eval("[data-resume-root]", (elements) => elements.length), 1);
  assert.ok((await page.$eval("[data-resume-root]", (element) => element.textContent)).includes("Career Summary"));
});

test("SITE-R11.1 SITE-R11.2 SITE-R11.4 A4、列印隔離與共用結果", async () => {
  await openHome();
  const home = await getPrintResult();
  await enterPreview();
  const preview = await getPrintResult();
  assert.equal(home.pages, 1);
  assert.equal(preview.pages, 1);
  assert.equal(home.mediaBox, preview.mediaBox);
  const dimensions = home.mediaBox.trim().split(/\s+/).map(Number);
  assert.ok(Math.abs(dimensions[2] - 595) < 2 && Math.abs(dimensions[3] - 842) < 2);
  assert.equal(home.metrics.text, preview.metrics.text);
  for (const result of [home, preview]) {
    assert.equal(result.metrics.count, 1);
    assert.equal(result.metrics.visible, "visible");
    assert.ok(result.metrics.bottom <= result.metrics.height + 1);
    assert.equal(result.metrics.header, "none");
    assert.equal(result.metrics.footer, "none");
    assert.equal(result.metrics.language, "hidden");
    for (const section of ["SKILLS", "CAREER SUMMARY", "EDUCATION", "SOCIAL LINKS"]) assert.ok(result.metrics.text.includes(section));
  }
});

test("SITE-R13.3 已有 reduced-motion 分支", async () => {
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await openHome();
  const animations = await page.$$eval('[class*="hero_enter"],[class*="scroll_down_chevron"]', (elements) => elements.map((element) => getComputedStyle(element).animationName));
  assert.ok(animations.length > 0);
  assert.ok(animations.every((name) => name === "none"));
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
  assert.equal(await page.$$eval("#home,#about,#projects,#blog", (elements) => elements.length), 4);
  assert.ok((await page.$eval("#root", (element) => element.textContent)).length > 500);
});

test("SITE-R15.1 新環境不註冊 service worker", async () => {
  await openHome();
  const result = await page.evaluate(async () => ({ controller: !!navigator.serviceWorker.controller, registrations: (await navigator.serviceWorker.getRegistrations()).length }));
  assert.deepEqual(result, { controller: false, registrations: 0 });
});

test("SITE-R16.1 SITE-R16.2 Metadata、robots 與 sitemap", async () => {
  await openHome();
  assert.equal(await page.title(), "Bing-Yang Chen - 陳秉洋");
  assert.equal(await page.$eval('link[rel="canonical"]', (element) => element.href), "https://byc1999.com/");
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
    await copyFile(join(ROOT, "scripts/prerender.mjs"), join(directory, "scripts/prerender.mjs"));
    await symlink(join(ROOT, "node_modules"), join(directory, "node_modules"), "dir");
    await writeFile(join(directory, "build/index.html"), `<html><body><div id="root"></div><script>${script}</script></body></html>`);
    return await new Promise((resolveResult, rejectResult) => {
      const child = spawn(process.execPath, [join(directory, "scripts/prerender.mjs")], { stdio: ["ignore", "pipe", "pipe"] });
      let output = "";
      child.stdout.on("data", (chunk) => { output += chunk; });
      child.stderr.on("data", (chunk) => { output += chunk; });
      const timer = setTimeout(() => { child.kill("SIGKILL"); rejectResult(new Error("prerender fixture timed out")); }, 30000);
      child.once("error", (error) => { clearTimeout(timer); rejectResult(error); });
      child.once("exit", (code) => { clearTimeout(timer); resolveResult({ code, output }); });
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("SITE-R14.4 錯誤、空內容與不足內容阻止 prerender", { timeout: 120000 }, async () => {
  const failures = [
    ["", "empty #root"],
    ['document.getElementById("root").textContent="thin";', "characters of visible text"],
    ['document.getElementById("root").textContent="Content ".repeat(100); throw new Error("fixture error");', "fixture error"],
  ];
  for (const [script, message] of failures) {
    const result = await runPrerenderFixture(script);
    assert.notEqual(result.code, 0);
    assert.ok(result.output.includes(message), result.output);
  }
  const errorServer = createServer((request, response) => response.writeHead(500).end("fixture failure"));
  await new Promise((resolveListening) => errorServer.listen(0, "127.0.0.1", resolveListening));
  try {
    const result = await runPrerenderFixture(`location.replace("http://127.0.0.1:${errorServer.address().port}/failure");`);
    assert.notEqual(result.code, 0);
    assert.ok(result.output.includes("responded 500"), result.output);
  } finally {
    await new Promise((resolveClosed) => errorServer.close(resolveClosed));
  }
});
