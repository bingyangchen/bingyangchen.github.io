import { openHome, enterPreview } from "../helpers/site";
import assert from "node:assert/strict";
import { test } from "../helpers/fixtures";

const QR = '#home button[aria-haspopup="dialog"]';

const QR_DIALOG = 'dialog[aria-labelledby="qr-modal-title"]';

test("SITE-R9.1 SITE-R9.2 SITE-R9.3 SITE-R9.4 QR 的所有關閉入口", async ({
  page,
  server,
}) => {
  await openHome(page, server);
  for (const overflow of ["", "scroll"]) {
    await page.evaluate((value) => {
      document.body.style.overflow = value;
    }, overflow);
    for (const closeWith of ["overlay", "button", "Escape"]) {
      await page.locator(QR).click();
      await page.waitForSelector(`${QR_DIALOG}[open]`);
      assert.equal(await page.evaluate(() => document.body.style.overflow), "hidden");
      assert.equal(
        await page
          .locator(QR_DIALOG)
          .evaluate(
            (element: HTMLElement) =>
              element.querySelectorAll<HTMLElement>("button").length,
          ),
        1,
      );
      await page.locator('[class*="qr_modal_content"]').click();
      assert.ok(await page.$(`${QR_DIALOG}[open]`));
      if (closeWith === "overlay")
        await page.locator(QR_DIALOG).click({ position: { x: 5, y: 5 } });
      else if (closeWith === "button")
        await page.locator(`${QR_DIALOG} button`).click();
      else await page.keyboard.press("Escape");
      await page.waitForFunction(
        (selector) => !document.querySelector<HTMLElement>(selector)!,
        QR_DIALOG,
        {},
      );
      assert.equal(await page.evaluate(() => document.body.style.overflow), overflow);
      assert.ok(
        await page
          .locator(QR)
          .evaluate(
            (element: HTMLElement) =>
              (document.activeElement as HTMLElement) === element,
          ),
      );
    }
  }
});

test("SITE-R9.6 QR Code 鍵盤入口", async ({ page, server }) => {
  await openHome(page, server);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const language of ["en", "zh-TW"]) {
      await page.evaluate(() => localStorage.setItem("preferred_language", "en"));
      await openHome(page, server);
      if (language === "zh-TW") {
        await page.evaluate(() =>
          document.querySelector<HTMLElement>("[data-language-switcher]")!.click(),
        );
        await page.waitForFunction(
          () => document.documentElement.lang === "zh-TW",
          undefined,
        );
      }
      let reached = false;
      for (let index = 0; index < 20; index += 1) {
        await page.keyboard.press("Tab");
        reached = await page
          .locator(QR)
          .evaluate(
            (element: HTMLElement) =>
              (document.activeElement as HTMLElement) === element,
          );
        if (reached) break;
      }
      assert.ok(reached, `Tab reaches QR opener at ${width}px in ${language}`);
      const opener = await page
        .locator(QR)
        .evaluate((element: HTMLButtonElement) => ({
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
          await page
            .locator(`${QR_DIALOG} button`)
            .evaluate(
              (element: HTMLElement) =>
                (document.activeElement as HTMLElement) === element,
            ),
        );
        const closeButton = await page
          .locator(`${QR_DIALOG} button`)
          .evaluate((element: HTMLButtonElement) => ({
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
          (selector) => !document.querySelector<HTMLElement>(selector)!,
          QR_DIALOG,
          {},
        );
        assert.ok(
          await page
            .locator(QR)
            .evaluate(
              (element: HTMLElement) =>
                (document.activeElement as HTMLElement) === element,
            ),
        );
      }
    }
  }
});

test("SITE-R9.7 Dialog 焦點與卸載清理", async ({ page, server }) => {
  await openHome(page, server);
  await page.locator(QR).click();
  assert.ok(
    await page
      .locator(QR_DIALOG)
      .evaluate((element: HTMLElement) => element.matches(":modal")),
  );
  assert.ok(
    await page
      .locator(`${QR_DIALOG} button`)
      .evaluate(
        (element: HTMLElement) => (document.activeElement as HTMLElement) === element,
      ),
  );
  const session = await page.context().newCDPSession(page);
  const accessibility = await session.send("Accessibility.getFullAXTree");
  await session.detach();
  const dialog = accessibility.nodes.find(
    (node) => !node.ignored && node.role?.value === "dialog",
  );
  assert.ok(dialog);
  assert.equal(dialog.name?.value, "Bing-Yang Chen");
  assert.equal(dialog.description?.value, "Scan to connect");
  assert.equal(
    dialog.properties?.find((property) => property.name === "modal")?.value.value,
    true,
  );
  assert.equal(
    accessibility.nodes.some((node) => !node.ignored && node.role?.value === "link"),
    false,
  );
  for (const reverse of [false, true]) {
    if (reverse) await page.keyboard.down("Shift");
    for (let index = 0; index < 8; index += 1) {
      await page.keyboard.press("Tab");
      assert.ok(
        await page
          .locator(QR_DIALOG)
          .evaluate(
            (element: HTMLElement) =>
              (document.activeElement as HTMLElement) === document.body ||
              element.contains(document.activeElement as HTMLElement),
          ),
      );
    }
    if (reverse) await page.keyboard.up("Shift");
  }
  await page.locator(QR).evaluate((element: HTMLElement) => element.focus());
  assert.equal(
    await page
      .locator(QR)
      .evaluate(
        (element: HTMLElement) => (document.activeElement as HTMLElement) === element,
      ),
    false,
  );
  await page.keyboard.press("Escape");
  await page.waitForFunction(
    (selector) => !document.querySelector<HTMLElement>(selector)!,
    QR_DIALOG,
    {},
  );
  assert.ok(
    await page
      .locator(QR)
      .evaluate(
        (element: HTMLElement) => (document.activeElement as HTMLElement) === element,
      ),
  );
  await page.keyboard.press("Tab");
  assert.ok(
    await page.evaluate(() =>
      (document.activeElement as HTMLAnchorElement).href.includes("econo.nccu.edu.tw"),
    ),
  );
  await page.evaluate(() => {
    document.body.style.overflow = "scroll";
  });
  await page.locator(QR).click();
  await enterPreview(page);
  assert.equal(await page.$(QR_DIALOG), null);
  assert.equal(await page.evaluate(() => document.body.style.overflow), "scroll");
  await page
    .locator('[data-resume-root] a[href^="mailto:"]')
    .evaluate((element: HTMLAnchorElement) => element.focus());
  assert.ok(
    await page.evaluate(() =>
      (document.activeElement as HTMLAnchorElement).href.startsWith("mailto:"),
    ),
  );
});
