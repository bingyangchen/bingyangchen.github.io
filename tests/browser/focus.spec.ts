import { openHome, enterPreview, waitForSection, selectProject } from "../helpers/site";
import { setViewport } from "../helpers/browser";
import {
  assertHoverCapability,
  hoverLink,
  assertArrowState,
  settleMotion,
} from "../helpers/motion";
import { assertFocusRing, assertVisibleEdges } from "../helpers/accessibility";
import assert from "node:assert/strict";
import { test } from "../helpers/fixtures";

const DETAIL = '#projects [role="tabpanel"]:not([inert])';

const TABS = '#projects [role="tab"]';

const QR = '#home button[aria-haspopup="dialog"]';

const QR_DIALOG = 'dialog[aria-labelledby="qr-modal-title"]';

test("SITE-R18.4 Footer Email 箭頭尊重減少動態", async ({ page, server }) => {
  await openHome(page, server);
  const email = 'footer a[href^="mailto:"]';
  const arrow = `${email} svg`;
  for (const language of ["en", "zh-TW"]) {
    await page.setViewportSize({ width: 1440, height: 900 });
    if (language === "zh-TW") await page.locator("[data-language-switcher]").click();
    for (const width of [1440, 390]) {
      // Linux viewport changes can clear hover capability; restore mouse input.
      await setViewport(page, { width, height: 900, hasTouch: true });
      await setViewport(page, { width, height: 900, hasTouch: false });
      await assertHoverCapability(page, true);
      for (const preference of ["no-preference", "reduce"] as const) {
        await page.emulateMedia({ reducedMotion: preference });
        const duration = preference === "reduce" ? "0s" : "0.22s";
        await hoverLink(page, email);
        await assertArrowState(
          page,
          arrow,
          preference === "reduce" ? 0 : 2,
          0,
          duration,
        );
        await page.mouse.move(0, 0);
        await assertArrowState(page, arrow, 0, 0, duration);
      }
    }
  }
});

test("SITE-R18.1 依區域與控制尺寸共用鍵盤焦點框", async ({ page, server }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openHome(page, server);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
    for (const language of ["en", "zh-TW"]) {
      await page.evaluate(() => localStorage.setItem("preferred_language", "en"));
      await openHome(page, server);
      if (language === "zh-TW")
        await page
          .locator("[data-language-switcher]")
          .evaluate((element: HTMLElement) => element.click());
      const reached: Record<string, number> = {
        header: 0,
        content: 0,
        footer: 0,
        surfaces: 0,
      };
      for (let index = 0; index < 40; index += 1) {
        await page.keyboard.press("Tab");
        const target = await page.evaluate(() => {
          const element = document.activeElement as HTMLElement;
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
          page,
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
      assert.equal(reached.footer, 5);
      assert.equal(reached.surfaces, 4);
      // Tabbing past the final link can move focus out of the document.
      await page.bringToFront();
      await page.locator(`${TABS}:first-child`).focus();
      for (let index = 0; index < 3; index += 1) {
        await assertFocusRing(page, "rgb(82, 92, 48)");
        assert.equal(
          await page
            .locator(`${TABS}:nth-child(${index + 1})`)
            .evaluate((element: HTMLElement) => element.getAttribute("aria-selected")),
          "true",
        );
        await page.keyboard.press("Tab");
        await assertFocusRing(page, "rgb(82, 92, 48)", 5);
        await page.keyboard.press("Tab");
        await assertFocusRing(page, "rgb(82, 92, 48)");
        await page.keyboard.press("Tab");
        await assertFocusRing(page, "rgb(82, 92, 48)");
        await page.locator(`${TABS}:nth-child(${index + 1})`).focus();
        if (index < 2) await page.keyboard.press("ArrowRight");
      }
      await page.locator(QR).focus();
      await page.keyboard.press("Enter");
      await page.waitForSelector(`${QR_DIALOG}[open]`);
      await assertFocusRing(page, "rgb(82, 92, 48)");
      await page.keyboard.press("Escape");
      await assertFocusRing(page, "rgb(82, 92, 48)");
      await enterPreview(page);
      await page.locator('[class*="resumePage"] button').focus();
      await assertFocusRing(page, "rgb(34, 34, 34)");
      await page.locator('[data-resume-root] a[href^="mailto:"]').focus();
      await assertFocusRing(page, "rgb(34, 34, 34)");
    }
  }
});

test("SITE-R18.2 深淺背景對比與滿版目的地的實際可見框線", async ({ page, server }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openHome(page, server);
  await page.keyboard.press("Tab");
  for (const [selector, surface] of [
    ["header [data-language-switcher]", ".site-layout"],
    [`${DETAIL} a:not([href^="https://github.com/"])`, "#projects"],
    ['#blog a[class*="featured"]', ".site-layout"],
    ['footer a[href="https://github.com/bingyangchen"]', "footer"],
  ]) {
    await page.locator(selector).evaluate((element: HTMLElement) => {
      element.scrollIntoView({ block: "center", behavior: "instant" });
      element.focus({ preventScroll: true });
    });
    await settleMotion(page);
    const colors = await page
      .locator(selector)
      .evaluate(
        (element: HTMLElement, surfaceSelector) => [
          getComputedStyle(element).outlineColor,
          getComputedStyle(document.querySelector<HTMLElement>(surfaceSelector)!)
            .backgroundColor,
        ],
        surface,
      );
    const luminances = colors.map((color) => {
      const channels = color
        .match(/[\d.]+/g)!
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
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => localStorage.setItem("preferred_language", "en"));
    await openHome(page, server);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    assert.equal(
      await page.evaluate(() => (document.activeElement as HTMLElement).id),
      "main-content",
    );
    await assertFocusRing(page, "rgb(34, 34, 34)", -2);
    await assertVisibleEdges(page, [34, 34, 34]);
    for (const section of ["home", "about", "projects", "blog"]) {
      if (width === 390) {
        await page.locator('header button[aria-controls="site-navigation"]').focus();
        await page.keyboard.press("Enter");
      }
      await page.locator(`header a[href="#${section}"]`).focus();
      await page.keyboard.press("Enter");
      await waitForSection(page, section);
      assert.equal(
        await page.evaluate(() => (document.activeElement as HTMLElement).id),
        section,
      );
      await assertFocusRing(page, "rgb(82, 92, 48)", -2);
      await assertVisibleEdges(page, [82, 92, 48]);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        ),
        false,
      );
    }
  }
});

test("SITE-R18.3 強制色彩使用系統焦點色並保留外框", async ({ page, server }) => {
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await openHome(page, server);
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
    ['footer a[href="https://github.com/bingyangchen"]', 3],
  ] as const) {
    await page.locator(selector).first().focus();
    await assertFocusRing(page, systemColor, offset);
  }
  await page.locator(QR).focus();
  await page.keyboard.press("Enter");
  await page.waitForSelector(`${QR_DIALOG}[open]`);
  await assertFocusRing(page, systemColor);
  await page.keyboard.press("Escape");
  await assertFocusRing(page, systemColor);
});

test("SITE-R18.4 焦點樣式保留輸入方式、選取、dialog 與列印行為", async ({
  page,
  server,
}) => {
  for (const reduced of [false, true]) {
    await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
    await openHome(page, server, "#projects");
    await selectProject(page, 2);
    assert.equal(
      await page
        .locator(`${TABS}:nth-child(2)`)
        .evaluate((element: HTMLElement) => element.matches(":focus-visible")),
      false,
    );
    await page.keyboard.press("Tab");
    await assertFocusRing(page, "rgb(82, 92, 48)", 5);
    await page.keyboard.down("Shift");
    await page.keyboard.press("Tab");
    await page.keyboard.up("Shift");
    await assertFocusRing(page, "rgb(82, 92, 48)");
    await page.keyboard.press("End");
    assert.equal(
      await page
        .locator(`${TABS}:nth-child(3)`)
        .evaluate((element: HTMLElement) => element.getAttribute("aria-selected")),
      "true",
    );
    await page.keyboard.press("Home");
    await page.keyboard.press("ArrowRight");
    assert.equal(
      await page
        .locator(`${TABS}:nth-child(2)`)
        .evaluate((element: HTMLElement) => element.getAttribute("aria-selected")),
      "true",
    );
    assert.equal(
      await page
        .locator('header a[href="#projects"]')
        .evaluate((element: HTMLAnchorElement) => element.getAttribute("aria-current")),
      "location",
    );
    await page.locator(QR).focus();
    await page.keyboard.press("Enter");
    await page.waitForSelector(`${QR_DIALOG}[open]`);
    await assertFocusRing(page, "rgb(82, 92, 48)");
    await page.keyboard.press("Escape");
    assert.ok(
      await page
        .locator(QR)
        .evaluate(
          (element: HTMLElement) => (document.activeElement as HTMLElement) === element,
        ),
    );
    await assertFocusRing(page, "rgb(82, 92, 48)");
    await enterPreview(page);
    await page.locator('[data-resume-root] a[href^="mailto:"]').focus();
    await assertFocusRing(page, "rgb(34, 34, 34)");
    await page.emulateMedia({ media: "print" });
    const printRing = await page.evaluate(() => {
      const style = getComputedStyle(document.activeElement as HTMLElement);
      return { style: style.outlineStyle, offset: style.outlineOffset };
    });
    const browserPrintRing = await page.evaluate(() => {
      const sheets = [...document.styleSheets].filter((sheet) => !sheet.disabled);
      sheets.forEach((sheet) => {
        sheet.disabled = true;
      });
      const style = getComputedStyle(document.activeElement as HTMLElement);
      const ring = { style: style.outlineStyle, offset: style.outlineOffset };
      sheets.forEach((sheet) => {
        sheet.disabled = false;
      });
      return ring;
    });
    assert.deepEqual(printRing, browserPrintRing);
    await page.emulateMedia({ media: "screen" });
  }
});
