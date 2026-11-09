import assert from "node:assert/strict";
import { openHome } from "../helpers/site";
import { assertHoverCapability } from "../helpers/motion";
import { setViewport, tap, tapAt } from "../helpers/browser";
import { test } from "../helpers/fixtures";

const QR = '#home button[aria-haspopup="dialog"]';

const AVATAR = "#home button[aria-pressed]";

const QR_DIALOG = 'dialog[aria-labelledby="qr-modal-title"]';

test("SITE-R5.5 頭像 Hover、點按保持、鍵盤、觸控與減少動態", async ({
  page,
  server,
}) => {
  async function assertAvatarFace(flipped: boolean, pressed = flipped) {
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
  await assertAvatarFace(false);
  await page.locator(AVATAR).hover();
  await assertAvatarFace(true, false);
  await page.mouse.move(0, 0);
  await assertAvatarFace(false);
  await page.locator(AVATAR).hover();
  await assertAvatarFace(true, false);
  await page.locator(AVATAR).click();
  await assertAvatarFace(true);
  await page.locator(AVATAR).click();
  await assertAvatarFace(false);
  await page.mouse.move(0, 0);
  await assertAvatarFace(false);
  await page.locator(AVATAR).hover();
  await assertAvatarFace(true, false);
  await page.locator(AVATAR).click();
  await assertAvatarFace(true);
  await page.mouse.move(0, 0);
  await page.locator(QR).click();
  await page.waitForSelector(`${QR_DIALOG}[open]`);
  await page.keyboard.press("Escape");
  await page.waitForSelector(QR_DIALOG, { state: "hidden" });
  await assertAvatarFace(true);
  await page.locator(AVATAR).focus();
  await page.keyboard.press("Enter");
  await assertAvatarFace(false);
  assert.equal(
    await page
      .locator(AVATAR)
      .evaluate((button: HTMLElement) => getComputedStyle(button).outlineStyle),
    "solid",
  );
  await page.keyboard.press("Space");
  await assertAvatarFace(true);
  await page.mouse.move(0, 0);
  await page.keyboard.press("Enter");
  await assertAvatarFace(false);
  await page.locator(AVATAR).hover();
  await assertAvatarFace(true, false);
  await page.locator(AVATAR).click();
  await assertAvatarFace(true);
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
  await assertAvatarFace(true);
  await setViewport(page, { width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto("about:blank");
  await page.goto(server.origin);
  await page.evaluate(() => localStorage.setItem("preferred_language", "en"));
  await openHome(page, server);
  await assertHoverCapability(page, false);
  for (const preference of ["no-preference", "reduce"] as const) {
    await page.emulateMedia({ reducedMotion: preference });
    await assertAvatarFace(false);
    await tap(page, AVATAR);
    await assertAvatarFace(true);
    await tapAt(page, 5, 120);
    await assertAvatarFace(true);
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
    await tap(page, AVATAR);
    await assertAvatarFace(false);
  }
});
