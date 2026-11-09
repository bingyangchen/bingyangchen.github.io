import { openHome, waitForSection } from "../helpers/site";
import { moveMotionTarget } from "../helpers/motion";
import assert from "node:assert/strict";
import { test, expect } from "../helpers/fixtures";

const PROJECTS_MOTION = '#projects > [data-scroll-motion="content"]';

test("SITE-R2.1 SITE-R2.2 導覽與自然捲動", async ({ page, server }) => {
  await openHome(page, server);
  const initialLength = await page.evaluate(() => window.history.length);
  await page.locator('[class*="nav_links"] a[href="#about"]').click();
  await page.waitForFunction(
    () =>
      Math.abs(
        document.getElementById("about")!.getBoundingClientRect().top -
          document.querySelector<HTMLElement>("header")!.getBoundingClientRect().bottom,
      ) < 2,
    undefined,
  );
  assert.equal(await page.evaluate(() => window.location.hash), "#about");
  assert.equal(await page.evaluate(() => window.history.length), initialLength + 1);
  await page.evaluate(() =>
    document.getElementById("projects")!.scrollIntoView({ behavior: "instant" }),
  );
  await page.waitForFunction(() => window.location.hash === "#projects", undefined);
  assert.equal(await page.evaluate(() => window.history.length), initialLength + 1);
  await expect
    .poll(() =>
      page.evaluate(() =>
        Math.abs((history.state?.siteScrollPosition?.top ?? -1) - scrollY),
      ),
    )
    .toBeLessThan(2);
  await page.goBack({ waitUntil: "networkidle" });
  await page.waitForFunction(() => window.scrollY < 2, undefined);
});

test("SITE-R2.5 SITE-R2.6 常駐 Header 與 Logo 回頂端", async ({ page, server }) => {
  await openHome(page, server);
  assert.notEqual(
    await page
      .locator("header")
      .evaluate((element: HTMLElement) => getComputedStyle(element).display),
    "none",
  );
  assert.equal(
    await page
      .locator('header nav a[href^="#"]')
      .evaluateAll((elements: HTMLAnchorElement[]) => elements.length),
    3,
  );
  await page.locator('header a[href="#projects"]').click();
  await waitForSection(page, "projects");
  await page.locator('header a[href="#home"]').click();
  await page.waitForFunction(() => window.scrollY < 2, undefined);
  assert.equal(
    await page
      .locator('header a[aria-current="location"]')
      .evaluate((element: HTMLAnchorElement) => element.getAttribute("aria-label")),
    "Bing-Yang Chen",
  );
  assert.equal(
    await page
      .locator('header a[href="#home"] img')
      .evaluate(
        (element: HTMLImageElement) => element.complete && element.naturalWidth > 0,
      ),
    true,
  );
  assert.equal(
    await page
      .locator('header a[href="#home"]')
      .evaluate((element: HTMLAnchorElement) =>
        [...element.childNodes]
          .filter((node) => node.nodeType === Node.TEXT_NODE)
          .map((node) => node.textContent!)
          .join("")
          .trim(),
      ),
    "",
  );
});

test("SITE-R2.3 返回與前進保留區塊落點", async ({ page, server }) => {
  await openHome(page, server);
  await page.locator('header a[href="#projects"]').click();
  await waitForSection(page, "projects");
  await page.locator('header a[href="#blog"]').click();
  await waitForSection(page, "blog");
  await page.evaluate(() =>
    window.addEventListener(
      "popstate",
      () => window.dispatchEvent(new Event("scrollend")),
      { once: true },
    ),
  );
  await page.goBack({ waitUntil: "networkidle" });
  await waitForSection(page, "projects");
  await page.goBack({ waitUntil: "networkidle" });
  await page.waitForFunction(() => window.scrollY < 2, undefined);
  await page.goForward({ waitUntil: "networkidle" });
  await waitForSection(page, "projects");
  await page.locator('header a[href="#about"]').click();
  await waitForSection(page, "about");
  await page.evaluate(() => window.scrollBy({ top: 240, behavior: "instant" }));
  const readingPosition = await page.evaluate(() => window.scrollY);
  await page.locator('header a[href="#projects"]').click();
  await waitForSection(page, "projects");
  await page.goBack({ waitUntil: "networkidle" });
  await page.waitForFunction(
    (top) => Math.abs(window.scrollY - top) < 2 && window.location.hash === "#about",
    readingPosition,
    {},
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(
    (top) => Math.abs(window.scrollY - top) < 2,
    readingPosition,
    {},
  );
});

test("SITE-R2.4 Hash 直接開啟與重載避開 Header", async ({ page, server }) => {
  for (const section of ["home", "about", "projects", "blog"]) {
    await page.goto("about:blank");
    await openHome(page, server, `#${section}`);
    await waitForSection(page, section);
    await page.reload({ waitUntil: "networkidle" });
    await waitForSection(page, section);
  }
});

test("SITE-R2.7 目前區塊與語言切換", async ({ page, server }) => {
  await openHome(page, server);
  await page
    .locator("#about")
    .evaluate((element: HTMLElement) =>
      element.scrollIntoView({ behavior: "instant" }),
    );
  await page.waitForSelector('header nav a[href="#about"][aria-current="location"]');
  await page.locator("[data-language-switcher]").click();
  assert.equal(
    await page
      .locator('header nav a[aria-current="location"]')
      .evaluate((element: HTMLAnchorElement) => element.textContent!),
    "簡歷",
  );
  assert.equal(
    await page
      .locator('header [aria-current="location"]')
      .evaluateAll((elements: HTMLElement[]) => elements.length),
    1,
  );
});

test("SITE-R2.7 高視窗的最後區塊", async ({ page, server }) => {
  await page.setViewportSize({ width: 1440, height: 2000 });
  await openHome(page, server);
  await page.locator('header a[href="#blog"]').click();
  await waitForSection(page, "blog");
  await page.waitForSelector('header nav a[href="#blog"][aria-current="location"]');
  assert.ok(
    await page
      .locator("#blog")
      .evaluate(
        (element: HTMLElement) =>
          element.getBoundingClientRect().top < window.innerHeight,
      ),
  );
  await page.reload({ waitUntil: "networkidle" });
  await waitForSection(page, "blog");
  await page.waitForSelector('header nav a[href="#blog"][aria-current="location"]');
  await page.locator('header a[href="#home"]').click();
  await page.waitForFunction(() => window.scrollY < 2, undefined);
});

test("SITE-R2.8 SITE-R12.4 手機選單、焦點與收起入口", async ({ page, server }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openHome(page, server);
  const menu = 'header button[aria-controls="site-navigation"]';
  assert.equal(
    await page
      .locator("#site-navigation")
      .evaluate((element: HTMLElement) => getComputedStyle(element).display),
    "none",
  );
  await page.locator(menu).click();
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() =>
      (document.activeElement as HTMLElement).getAttribute("href"),
    ),
    "#about",
  );
  await page.keyboard.press("Escape");
  assert.equal(
    await page
      .locator(menu)
      .evaluate((element: HTMLElement) => element.getAttribute("aria-expanded")),
    "false",
  );
  assert.equal(
    await page.evaluate(() =>
      (document.activeElement as HTMLElement).getAttribute("aria-controls"),
    ),
    "site-navigation",
  );
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await waitForSection(page, "about");
  assert.equal(
    await page.evaluate(() => (document.activeElement as HTMLElement).id),
    "about",
  );
  assert.equal(
    await page
      .locator(menu)
      .evaluate((element: HTMLElement) => element.getAttribute("aria-expanded")),
    "false",
  );
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() =>
      document
        .querySelector<HTMLElement>("header")!
        .contains(document.activeElement as HTMLElement),
    ),
    false,
  );
  await page.locator(menu).click();
  await page.locator("[data-language-switcher]").click();
  assert.equal(
    await page.locator("html").evaluate((element: HTMLHtmlElement) => element.lang),
    "zh-TW",
  );
  assert.equal(
    await page
      .locator(menu)
      .evaluate((element: HTMLElement) => element.getAttribute("aria-expanded")),
    "true",
  );
  await page.mouse.click(200, 500);
  assert.equal(
    await page
      .locator(menu)
      .evaluate((element: HTMLElement) => element.getAttribute("aria-expanded")),
    "false",
  );
  await page.locator(menu).click();
  await page.setViewportSize({ width: 1024, height: 844 });
  await page.waitForFunction(
    () =>
      document
        .querySelector<HTMLElement>("header button[aria-controls]")!
        .getAttribute("aria-expanded") === "false",
    undefined,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page
      .locator("#site-navigation")
      .evaluate((element: HTMLElement) => getComputedStyle(element).display),
    "none",
  );
  await page.setViewportSize({ width: 1024, height: 844 });
  await page
    .locator('header a[href="#projects"]')
    .evaluate((element: HTMLAnchorElement) => element.focus());
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(
    () =>
      (document.activeElement as HTMLElement).getAttribute("aria-controls") ===
      "site-navigation",
    undefined,
  );
  await page.setViewportSize({ width: 1024, height: 844 });
  await page.waitForFunction(
    () => (document.activeElement as HTMLElement).getAttribute("href") === "#home",
    undefined,
  );
});

test("SITE-R2.9 Header 對齊、觸控範圍與窄版組成", async ({ page, server }) => {
  await openHome(page, server);
  for (const language of ["en", "zh-TW"]) {
    if (
      (await page
        .locator("html")
        .evaluate((element: HTMLHtmlElement) => element.lang)) !== language
    )
      await page
        .locator("[data-language-switcher]")
        .evaluate((element: HTMLElement) => element.click());
    for (const width of [320, 390, 720, 721, 1024, 1440, 1920, 2560]) {
      await page.setViewportSize({ width, height: 900 });
      await moveMotionTarget(page, PROJECTS_MOTION, 0);
      if (width <= 720)
        await page.locator('header button[aria-controls="site-navigation"]').click();
      const metrics = await page.locator("header").evaluate((header: HTMLElement) => {
        const inner = header
          .querySelector<HTMLElement>('[class*="inner"]')!
          .getBoundingClientRect();
        const identityLink =
          header.querySelector<HTMLAnchorElement>('a[href="#home"]')!;
        const identity = identityLink.getBoundingClientRect();
        const projects = document.querySelector<HTMLElement>("#projects > div")!;
        const links = [
          ...header.querySelectorAll<HTMLElement>("nav a, nav button"),
          identityLink,
        ];
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
          languageCount: document.querySelectorAll<HTMLElement>(
            "[data-language-switcher]",
          ).length,
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

test("SITE-R2.10 跳過導覽、主要內容與焦點提示", async ({ page, server }) => {
  await openHome(page, server);
  assert.equal(
    await page
      .locator("main")
      .evaluateAll((elements: HTMLElement[]) => elements.length),
    1,
  );
  assert.equal(
    await page
      .locator("header nav")
      .evaluate((element: HTMLElement) => element.getAttribute("aria-label")),
    "Main navigation",
  );
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => (document.activeElement as HTMLElement).textContent!),
    "Skip to content",
  );
  assert.ok(
    await page.evaluate(
      () =>
        getComputedStyle(document.activeElement as HTMLElement).outlineWidth !== "0px",
    ),
  );
  await page.keyboard.press("Enter");
  assert.equal(
    await page.evaluate(() => (document.activeElement as HTMLElement).id),
    "main-content",
  );
});
