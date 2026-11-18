import { openHome, enterPreview, waitForSection } from "../helpers/site";
import { assertColorContrast } from "../helpers/accessibility";
import { getPrintResult } from "../helpers/resume";
import { parsePdfMetadata } from "../helpers/pdf.mts";
import assert from "node:assert/strict";
import { expect, test } from "../helpers/fixtures";

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
      for (const selector of ["#about [data-chapter] p", '#home [class*="email_link"]'])
        await assertColorContrast(page, selector);
      await assertColorContrast(page, "#about h2", 3);
      if (width >= 720)
        await assertColorContrast(page, '#home [class*="scroll_down_hint"]');
      for (const selector of [
        "#home a[download]",
        "#about a[download]",
        '#home a[href="#projects"]',
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

test("SITE-R20.1 桌面固定欄問句與快跳在實際背景上的對比", async ({ page, server }) => {
  await openHome(page, server, "#about");
  await waitForSection(page, "about");
  const about = page.locator("#about");
  const targets =
    '#about [data-question][data-active="true"] span, #about nav button span';
  await expect(about).toHaveAttribute("data-enhanced", "true");
  for (const language of ["en", "zh-TW"]) {
    if (language === "zh-TW") await page.locator("[data-language-switcher]").click();
    await expect(page.locator("html")).toHaveAttribute("lang", language);
    for (const topic of ["origin", "work", "curiosity"]) {
      await about.locator(`[data-chapter="${topic}"]`).evaluate((chapter) => {
        chapter.scrollIntoView({ behavior: "instant", block: "start" });
      });
      const question = about.locator(`[data-question="${topic}"]`);
      await expect(question).toHaveAttribute("data-active", "true");
      await expect(question).toHaveCSS("opacity", "1");
      const samples = await page.locator(targets).evaluateAll((labels) =>
        labels.flatMap((label) => {
          const range = document.createRange();
          range.selectNodeContents(label);
          const foreground = getComputedStyle(label)
            .color.match(/[\d.]+/g)!
            .map(Number);
          const minimum = label.closest("button") ? 4.5 : 3;
          return [...range.getClientRects()].flatMap((rect) =>
            [0.05, 0.25, 0.5, 0.75, 0.95].map((fraction) => ({
              x: rect.left + rect.width * fraction,
              y: rect.top + rect.height / 2,
              label: label.textContent!.trim(),
              foreground,
              minimum,
            })),
          );
        }),
      );
      assert.ok(samples.length > 0);
      // Hide the glyphs to measure the surface even where the SVG curves behind them.
      const transparentText = await page.addStyleTag({
        content: `${targets} { color: transparent !important; }`,
      });
      let screenshot: Buffer;
      try {
        screenshot = await page.screenshot();
      } finally {
        await transparentText.evaluate((style) => style.parentNode?.removeChild(style));
      }
      const pixels = await page.evaluate(
        async ({ png, samples }) => {
          const image = new Image();
          image.src = "data:image/png;base64," + png;
          await image.decode();
          const canvas = document.createElement("canvas");
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext("2d")!;
          context.drawImage(image, 0, 0);
          return samples.map(({ x, y }) => {
            const pixelX = Math.floor((x / innerWidth) * image.width);
            const pixelY = Math.floor((y / innerHeight) * image.height);
            return [...context.getImageData(pixelX, pixelY, 1, 1).data];
          });
        },
        { png: screenshot.toString("base64"), samples },
      );
      const luminance = (channels: number[]) => {
        const linear = channels.slice(0, 3).map((channel) => {
          const value = channel / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
      };
      for (const [index, { foreground, minimum, label }] of samples.entries()) {
        const [light, dark] = [luminance(foreground), luminance(pixels[index])].sort(
          (a, b) => b - a,
        );
        const ratio = (light + 0.05) / (dark + 0.05);
        assert.equal(pixels[index][3], 255, `offscreen label: ${label}`);
        assert.ok(ratio >= minimum, `${language} ${label}: ${ratio} < ${minimum}`);
      }
    }
  }
});

test("SITE-R20.2 履歷預覽及列印的日期與教育資訊對比", async ({ page, server }) => {
  await openHome(page, server);
  await enterPreview(page);
  for (const media of ["screen", "print"] as const) {
    await page.emulateMedia({ media: media });
    for (const selector of ["roleDates", "roleSeparator", "educationMetadata"])
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
