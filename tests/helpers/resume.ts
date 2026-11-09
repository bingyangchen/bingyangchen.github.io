import { type Page } from "@playwright/test";
import { parsePdfMetadata } from "../helpers/pdf.mts";

export async function getPrintResult(page: Page) {
  await page.emulateMedia({ media: "print" });
  await page.waitForFunction(
    () =>
      getComputedStyle(document.querySelector<HTMLElement>("[data-language-switcher]")!)
        .visibility === "hidden",
    undefined,
  );
  await page.evaluate(() => document.fonts.ready);
  const metrics = await page
    .locator("[data-resume-root]")
    .evaluate((sheet: HTMLElement) => ({
      text: sheet.innerText,
      height: sheet.getBoundingClientRect().height,
      bottom:
        sheet.lastElementChild!.getBoundingClientRect().bottom -
        sheet.getBoundingClientRect().top,
      visible: getComputedStyle(sheet).visibility,
      count: document.querySelectorAll<HTMLElement>("[data-resume-root]").length,
      header: getComputedStyle(document.querySelector<HTMLElement>("header")!).display,
      footer: getComputedStyle(document.querySelector<HTMLElement>("footer")!).display,
      language: getComputedStyle(
        document.querySelector<HTMLElement>("[data-language-switcher]")!,
      ).visibility,
    }));
  const pdf = Buffer.from(
    await page.pdf({ preferCSSPageSize: true, printBackground: true, tagged: true }),
  );
  await page.emulateMedia({ media: "screen" });
  return { metrics, ...(await parsePdfMetadata(pdf)) };
}
