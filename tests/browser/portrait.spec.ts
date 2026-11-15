import assert from "node:assert/strict";
import { openHome } from "../helpers/site";
import { assertHoverCapability } from "../helpers/motion";
import { type Page } from "@playwright/test";
import { test } from "../helpers/fixtures";

const QR = '#home button[aria-haspopup="dialog"]';

const AVATAR = "#home button[aria-pressed]";

const QR_DIALOG = 'dialog[aria-labelledby="qr-modal-title"]';

async function assertAvatarFace(page: Page, flipped: boolean, pressed = flipped) {
  assert.equal(
    await page
      .locator(AVATAR)
      .evaluate((button: HTMLElement) => button.getAttribute("aria-pressed")),
    String(pressed),
  );
  await page.waitForFunction(
    ([selector, flipped]) => {
      const images = document
        .querySelector<HTMLElement>(selector)!
        .querySelectorAll<HTMLImageElement>("img");
      return Array.from(images).every((image, index) => {
        const matrix = new DOMMatrixReadOnly(getComputedStyle(image).transform);
        return Math.abs(matrix.m11 - (flipped === (index === 0) ? -1 : 1)) < 0.001;
      });
    },
    [AVATAR, flipped] as const,
    {},
  );
}

test("SITE-R5.5 頭像 Hover、點按保持與鍵盤", async ({ page, server }) => {
  await openHome(page, server);
  await assertHoverCapability(page, true);
  assert.equal(
    await page
      .locator(AVATAR)
      .evaluate((button: HTMLElement) => button.getAttribute("aria-label")),
    "Flip portrait",
  );
  assert.deepEqual(
    await page
      .locator(`${AVATAR} img`)
      .evaluateAll((images: HTMLImageElement[]) => images.map((image) => image.alt)),
    ["陳秉洋 (Bing-Yang Chen)", "陳秉洋 (Bing-Yang Chen)"],
  );
  await assertAvatarFace(page, false);
  await page.locator(AVATAR).hover();
  await assertAvatarFace(page, true, false);
  await page.mouse.move(0, 0);
  await assertAvatarFace(page, false);
  await page.locator(AVATAR).hover();
  await assertAvatarFace(page, true, false);
  await page.locator(AVATAR).click();
  await assertAvatarFace(page, true);
  await page.locator(AVATAR).click();
  await assertAvatarFace(page, false);
  await page.mouse.move(0, 0);
  await assertAvatarFace(page, false);
  await page.locator(AVATAR).hover();
  await assertAvatarFace(page, true, false);
  await page.locator(AVATAR).click();
  await assertAvatarFace(page, true);
  await page.mouse.move(0, 0);
  await page.locator(QR).click();
  await page.waitForSelector(`${QR_DIALOG}[open]`);
  await page.keyboard.press("Escape");
  await page.waitForSelector(QR_DIALOG, { state: "hidden" });
  await assertAvatarFace(page, true);
  await page.locator(AVATAR).focus();
  await page.keyboard.press("Enter");
  await assertAvatarFace(page, false);
  assert.equal(
    await page
      .locator(AVATAR)
      .evaluate((button: HTMLElement) => getComputedStyle(button).outlineStyle),
    "solid",
  );
  await page.keyboard.press("Space");
  await assertAvatarFace(page, true);
  await page.mouse.move(0, 0);
  await page.keyboard.press("Enter");
  await assertAvatarFace(page, false);
  await page.locator(AVATAR).hover();
  await assertAvatarFace(page, true, false);
  await page.locator(AVATAR).click();
  await assertAvatarFace(page, true);
  await page.evaluate(() =>
    document.querySelector<HTMLElement>("[data-language-switcher]")!.click(),
  );
  await page.waitForFunction(
    (selector) =>
      document.querySelector<HTMLElement>(selector)!.getAttribute("aria-label") ===
      "翻轉頭像",
    AVATAR,
    {},
  );
  await assertAvatarFace(page, true);
});

test.describe("Touch portrait", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("SITE-R5.5 頭像觸控與減少動態", async ({ page, server }) => {
    await openHome(page, server);
    await assertHoverCapability(page, false);
    for (const preference of ["no-preference", "reduce"] as const) {
      await page.emulateMedia({ reducedMotion: preference });
      await assertAvatarFace(page, false);
      await page.locator(AVATAR).tap();
      await assertAvatarFace(page, true);
      await page.touchscreen.tap(5, 120);
      await assertAvatarFace(page, true);
      if (preference === "reduce") {
        assert.deepEqual(
          await page
            .locator(`${AVATAR} img`)
            .evaluateAll((images: HTMLImageElement[]) =>
              images.map((image) => getComputedStyle(image).transitionDuration),
            ),
          ["0s", "0s"],
        );
      }
      await page.locator(AVATAR).tap();
      await assertAvatarFace(page, false);
    }
  });
});
