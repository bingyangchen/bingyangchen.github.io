import { openHome, selectProject } from "../helpers/site";
import assert from "node:assert/strict";
import { test } from "../helpers/fixtures";

const DETAIL = '#projects [role="tabpanel"]:not([inert])';

const QR = '#home button[aria-haspopup="dialog"]';

const QR_DIALOG = 'dialog[aria-labelledby="qr-modal-title"]';

test("SITE-R4.1 SITE-R4.2 雙向切換與 reload 持久化", async ({ page, server }) => {
  await openHome(page, server);
  const toggle = "button[data-language-switcher]";
  await page.locator(toggle).click();
  await page.waitForFunction(
    () => document.documentElement.lang === "zh-TW",
    undefined,
  );
  assert.equal(
    await page.evaluate(() => localStorage.getItem("preferred_language")),
    "zh-TW",
  );
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(
    await page.locator("h1").evaluate((element: HTMLElement) => element.textContent!),
    "陳秉洋",
  );
  await page.locator(toggle).click();
  await page.waitForFunction(() => document.documentElement.lang === "en", undefined);
});

test("SITE-R3.6 讀取儲存被拒絕時首頁仍可啟動", async ({ page, server }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException("Storage access denied", "SecurityError");
    };
  });
  await openHome(page, server);
  assert.equal(
    await page
      .locator("#home h1")
      .evaluate((element: HTMLElement) => element.textContent!),
    "Bing-Yang Chen",
  );
  await page.locator("[data-language-switcher]").click();
  await page.waitForFunction(
    () => document.documentElement.lang === "zh-TW",
    undefined,
  );
  assert.equal(
    await page
      .locator("#home h1")
      .evaluate((element: HTMLElement) => element.textContent!),
    "陳秉洋",
  );
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(
    await page.locator("html").evaluate((element: HTMLHtmlElement) => element.lang),
    "en",
  );
});

test("SITE-R3.6 SITE-R4.6 localStorage 本身被拒絕時可切換且重載後使用瀏覽器語言", async ({
  page,
  server,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Storage access denied", "SecurityError");
      },
    });
  });
  await openHome(page, server);
  await page.locator("[data-language-switcher]").click();
  await page.waitForFunction(
    () => document.documentElement.lang === "zh-TW",
    undefined,
  );
  assert.equal(
    await page
      .locator("#home h1")
      .evaluate((element: HTMLElement) => element.textContent!),
    "陳秉洋",
  );
  await page.locator("[data-language-switcher]").click();
  await page.waitForFunction(() => document.documentElement.lang === "en", undefined);
  await page.locator("[data-language-switcher]").click();
  await page.waitForFunction(
    () => document.documentElement.lang === "zh-TW",
    undefined,
  );
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(
    await page.locator("html").evaluate((element: HTMLHtmlElement) => element.lang),
    "en",
  );
  assert.equal(
    await page
      .locator("#home h1")
      .evaluate((element: HTMLElement) => element.textContent!),
    "Bing-Yang Chen",
  );
});

test("SITE-R4.6 寫入失敗時保留本頁選擇並可繼續導覽", async ({ page, server }) => {
  for (const errorName of ["SecurityError", "QuotaExceededError"]) {
    await page.addInitScript((name) => {
      Storage.prototype.setItem = () => {
        throw new DOMException("Cannot save preference", name);
      };
    }, errorName);
    await openHome(page, server);
    await page.locator("[data-language-switcher]").click();
    await page.waitForFunction(
      () => document.documentElement.lang === "zh-TW",
      undefined,
    );
    assert.equal(
      await page
        .locator("#home h1")
        .evaluate((element: HTMLElement) => element.textContent!),
      "陳秉洋",
    );
    assert.equal(
      await page.evaluate(() => localStorage.getItem("preferred_language")),
      null,
    );
    await page.locator('header a[href="#about"]').click();
    await page.waitForFunction(() => window.location.hash === "#about", undefined);
    assert.equal(
      await page.locator("html").evaluate((element: HTMLHtmlElement) => element.lang),
      "zh-TW",
    );
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(
      await page.locator("html").evaluate((element: HTMLHtmlElement) => element.lang),
      "en",
    );
    assert.equal(
      await page
        .locator("#home h1")
        .evaluate((element: HTMLElement) => element.textContent!),
      "Bing-Yang Chen",
    );
  }
});

test("SITE-R4.3 作品詳情中切換語言", async ({ page, server }) => {
  await openHome(page, server);
  await selectProject(page);
  const english = await page
    .locator(`${DETAIL} [class*="description"]`)
    .evaluate((element: HTMLElement) => element.textContent!);
  await page.locator("[data-language-switcher]").click();
  await page.waitForFunction(
    () => document.documentElement.lang === "zh-TW",
    undefined,
  );
  assert.equal(
    await page
      .locator(`${DETAIL} h3`)
      .evaluate((element: HTMLElement) => element.textContent!),
    "Taigu",
  );
  assert.notEqual(
    await page
      .locator(`${DETAIL} [class*="description"]`)
      .evaluate((element: HTMLElement) => element.textContent!),
    english,
  );
});

test("SITE-R4.4 QR Code 關閉後切換語言", async ({ page, server }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await openHome(page, server);
    await page.locator(QR).click();
    const qrCode = await page
      .locator('[class*="qr_modal_code_panel"] svg')
      .evaluate((element: HTMLElement) => element.outerHTML);
    for (const language of ["zh-TW", "en"]) {
      await page.locator(`${QR_DIALOG} button`).click();
      await page.waitForFunction(
        (selector) => !document.querySelector<HTMLElement>(selector)!,
        QR_DIALOG,
        {},
      );
      if (width === 390)
        await page.locator('header button[aria-controls="site-navigation"]').click();
      await page.locator("header [data-language-switcher]").click();
      await page.waitForFunction(
        (expected) => document.documentElement.lang === expected,
        language,
        {},
      );
      if (width === 390) await page.keyboard.press("Escape");
      await page.locator(QR).click();
      await page.waitForSelector(`${QR_DIALOG}[open]`);
      assert.equal(
        await page
          .locator("#qr-modal-title")
          .evaluate((element: HTMLElement) => element.textContent!),
        language === "en" ? "Bing-Yang Chen" : "陳秉洋",
      );
      assert.equal(
        await page
          .locator("#qr-modal-description")
          .evaluate((element: HTMLElement) => element.textContent!),
        language === "en" ? "Scan to connect" : "掃描以取得連結",
      );
      assert.equal(
        await page
          .locator(`${QR_DIALOG} button`)
          .evaluate((element: HTMLElement) => element.getAttribute("aria-label")),
        language === "en" ? "Close QR code" : "關閉 QR code",
      );
      assert.equal(
        await page
          .locator('[class*="qr_modal_code_panel"] svg')
          .evaluate((element: HTMLElement) => element.outerHTML),
        qrCode,
      );
      assert.equal(
        await page
          .locator(`${QR_DIALOG} button`)
          .evaluateAll((elements: HTMLElement[]) => elements.length),
        1,
      );
      assert.equal(
        await page
          .locator(`${QR_DIALOG} a, ${QR_DIALOG} [data-language-switcher]`)
          .evaluateAll((elements: HTMLElement[]) => elements.length),
        0,
      );
      assert.ok(
        await page
          .locator(QR_DIALOG)
          .evaluate((element: HTMLElement) => element.matches(":modal")),
      );
    }
    await page.locator(`${QR_DIALOG} button`).click();
  }
});

test("SITE-R4.5 Tab、Enter 與 Space 操作語言按鈕", async ({ page, server }) => {
  await openHome(page, server);
  let reached = false;
  for (let index = 0; index < 80; index += 1) {
    await page.keyboard.press("Tab");
    reached = await page.evaluate(() =>
      (document.activeElement as HTMLElement).hasAttribute("data-language-switcher"),
    );
    if (reached) break;
  }
  assert.ok(reached);
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    () => document.documentElement.lang === "zh-TW",
    undefined,
  );
  await page.keyboard.press("Space");
  await page.waitForFunction(() => document.documentElement.lang === "en", undefined);
});
