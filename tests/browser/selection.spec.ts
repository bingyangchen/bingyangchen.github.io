import { openHome, dragText, selectProject } from "../helpers/site";
import { setViewport } from "../helpers/browser";
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

test("SITE-R12.5 SITE-R12.6 觸控與桌面均依文字用途設定選取", async ({
  page,
  server,
}) => {
  test.setTimeout(45000);
  await openHome(page, server);
  for (const language of ["en", "zh-TW"]) {
    if (language === "zh-TW") {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.locator("[data-language-switcher]").click();
      await page.waitForFunction(
        () => document.documentElement.lang === "zh-TW",
        undefined,
      );
    }
    for (const hasTouch of [false, true]) {
      await setViewport(page, { width: hasTouch ? 390 : 1440, height: 900, hasTouch });
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
          '#home [class*="nav_ghost"] span',
          '#projects [role="tabpanel"] a',
          '#blog [class*="archiveLink"] span',
          '#blog [class*="featuredAction"] span',
          '#blog [class*="readingAction"]',
          "footer nav a span",
          'footer a[href="/#home"] span',
        ];
        function getSelectionStyles(selectors: string[]) {
          return selectors.flatMap((selector) => {
            const elements = [
              ...document.querySelectorAll<HTMLElement>(selector),
            ].filter((element) => element.getBoundingClientRect().height > 0);
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
  await setViewport(page, { width: 1440, height: 900, hasTouch: false });
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
