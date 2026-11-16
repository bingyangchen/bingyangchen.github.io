import { openHome, dragText, selectProject } from "../helpers/site";
import { type Page } from "@playwright/test";
import { assertHoverCapability } from "../helpers/motion";
import assert from "node:assert/strict";
import { test } from "../helpers/fixtures";

const DETAIL = '#projects [role="tabpanel"]:not([inert])';

test("SITE-R12.5 正文可拖選並以原生複製取得文字", async ({ page, context, server }) => {
  test.setTimeout(45000);
  await openHome(page, server);
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: server.origin,
  });
  for (const language of ["en", "zh-TW"]) {
    if (language === "zh-TW") {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.locator("[data-language-switcher]").click();
      await page.waitForFunction(
        () => document.documentElement.lang === "zh-TW",
        undefined,
      );
    }
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const selector of [
        '#about [class*="description"]',
        `${DETAIL} [class*="description"]`,
        '#blog [class*="featuredCopy"] p',
        '#blog [class*="reading"] p',
        'footer a[href^="mailto:"] > span:first-child',
      ]) {
        const expected = await dragText(page, selector);
        assert.equal(
          await page.evaluate(() => window.getSelection()!.toString()),
          expected,
          `${language}, ${width}px: ${selector}`,
        );
        assert.equal(
          await page.evaluate(() => document.hasFocus()),
          true,
          "dragging text keeps the page active for copying",
        );
        await page.keyboard.press("ControlOrMeta+c");
        assert.equal(
          await page.evaluate(() => navigator.clipboard.readText()),
          expected,
          "native copy preserves the selected body text",
        );
      }
    }
  }
});

async function assertSelectionStyles(
  page: Page,
  server: { origin: string },
  hasTouch: boolean,
) {
  await openHome(page, server);
  await assertHoverCapability(page, !hasTouch);
  for (const language of ["en", "zh-TW"]) {
    if (language === "zh-TW") {
      await page
        .locator("[data-language-switcher]")
        .evaluate((element: HTMLElement) => element.click());
      await page.waitForFunction(
        () => document.documentElement.lang === "zh-TW",
        undefined,
      );
    }
    if (hasTouch) await page.locator('header button[aria-expanded="false"]').click();
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
        'footer a[href^="mailto:"] > span:first-child',
      ];
      const controlSelectors = [
        "button",
        "button span",
        "header nav a",
        '#home a[href="#projects"]',
        '#projects [role="tabpanel"] a',
        '#blog [class*="archiveLink"] span',
        '#blog [class*="featuredAction"] span',
        '#blog [class*="readingAction"]',
        "footer nav a span",
        'footer a[href="/#home"] span',
      ];
      function getSelectionStyles(selectors: string[]) {
        return selectors.flatMap((selector) => {
          const elements = [...document.querySelectorAll<HTMLElement>(selector)].filter(
            (element) => element.getBoundingClientRect().height > 0,
          );
          if (!elements.length) throw new Error(`Missing visible text: ${selector}`);
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
          document.querySelector<HTMLElement>('#home [class*="email_link"] span')!,
        ).userSelect,
      };
    });
    for (const { selector, value } of styles.body)
      assert.ok(["auto", "text"].includes(value), `${selector}: ${value}`);
    for (const { selector, value } of styles.controls)
      assert.equal(value, "none", selector);
    assert.equal(styles.email, "all");
    if (hasTouch) await page.locator('header button[aria-expanded="true"]').click();
  }
}

test("SITE-R12.5 SITE-R12.6 桌面依文字用途設定選取", async ({ page, server }) => {
  await assertSelectionStyles(page, server, false);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => localStorage.setItem("preferred_language", "en"));
  await openHome(page, server);
  await dragText(page, 'header a[href="#about"]');
  assert.equal(await page.evaluate(() => window.getSelection()!.toString()), "");
  await page.locator('header a[href="#projects"]').click();
  await page.waitForFunction(() => window.location.hash === "#projects", undefined);
  await selectProject(page, 2);
  assert.equal(
    await page
      .locator(`${DETAIL} h3`)
      .evaluate((element: HTMLElement) => element.textContent!),
    "Noads",
  );
});

test.describe("Touch selection", () => {
  test.use({ viewport: { width: 390, height: 900 }, hasTouch: true });

  test("SITE-R12.5 SITE-R12.6 觸控依文字用途設定選取", async ({ page, server }) => {
    await assertSelectionStyles(page, server, true);
  });
});
