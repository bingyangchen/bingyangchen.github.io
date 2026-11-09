import { openHome, enterPreview } from "../helpers/site";
import { assertColorContrast } from "../helpers/accessibility";
import { getPrintResult } from "../helpers/resume";
import { parsePdfMetadata } from "../helpers/pdf.mts";
import assert from "node:assert/strict";
import { test } from "../helpers/fixtures";

const DETAIL = '#projects [role="tabpanel"]:not([inert])';

const TABS = '#projects [role="tab"]';

const QR = '#home button[aria-haspopup="dialog"]';

test("SITE-R20.1 雙語正文、品牌按鈕及 hover 操作圖示的實際對比", async ({
  page,
  server,
}) => {
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
      for (const selector of [
        '#about [class*="work_duration"]',
        '#about [class*="company_name"]',
        '#about [class*="skills_inner"] > div',
        '#about [class*="degree_list"] a',
        '#home [class*="scroll_down_hint"]',
        '#home [class*="email_link"]',
      ])
        await assertColorContrast(page, selector);
      for (const selector of [
        "#home a[download]",
        '#home a[class*="nav_ghost"]',
        TABS,
        `${DETAIL} a:not([href^="https://github.com/"])`,
        `${DETAIL} a[href^="https://github.com/"]`,
      ]) {
        await page.mouse.move(0, 0);
        await assertColorContrast(page, selector);
        const controls = await page.$$(selector);
        for (const control of controls) {
          await control.hover();
          await assertColorContrast(page, selector);
        }
      }
      for (const selector of [QR, '#home a[aria-label][target="_blank"]']) {
        await page.mouse.move(0, 0);
        await assertColorContrast(page, selector, 3);
        const controls = await page.$$(selector);
        for (const control of controls) {
          await control.hover();
          await assertColorContrast(page, selector, 3);
        }
      }
    }
  }
});

test("SITE-R20.2 履歷預覽及列印的日期與教育資訊對比", async ({ page, server }) => {
  await openHome(page, server);
  await enterPreview(page);
  for (const media of ["screen", "print"] as const) {
    await page.emulateMedia({ media: media });
    for (const selector of ["roleDates", "roleSeparator", "yearRange", "gpaText"])
      await assertColorContrast(page, `[data-resume-root] [class*="${selector}"]`);
  }
  await page.emulateMedia({ media: "screen" });
  const built = await parsePdfMetadata(
    Buffer.from(await (await fetch(server.origin + "/resume.pdf")).arrayBuffer()),
  );
  const preview = await getPrintResult(page);
  assert.equal(built.pages, 1);
  assert.equal(preview.pages, built.pages);
  assert.deepEqual(preview.mediaBox, built.mediaBox);
  assert.deepEqual(preview.pageSizes, built.pageSizes);
  assert.deepEqual(preview.fonts, built.fonts);
  assert.deepEqual(preview.links, built.links);
  assert.equal(preview.language, "en");
});
