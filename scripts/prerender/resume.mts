import type { Page } from "puppeteer";
import type { watchPageResources } from "../browser-resources.mts";
import { MIN_VISIBLE_TEXT_CHARS } from "./settings.mts";
import { assertResumePdfStructure, assertResumePdfText } from "./pdf.mts";

export async function generateResumePdf(
  page: Page,
  origin: string,
  resources: Awaited<ReturnType<typeof watchPageResources>>,
) {
  const response = await page.goto(`${origin}/resume`, { waitUntil: "networkidle0" });
  if (!response?.ok()) throw new Error(`Resume responded ${response?.status()}`);
  await page.emulateMediaType("print");
  const expected = await page.evaluate(async (minimumTextLength) => {
    const sheets = document.querySelectorAll<HTMLElement>("[data-resume-root]");
    if (sheets.length !== 1) throw new Error("Expected one resume sheet");
    await document.fonts.ready;
    if (Array.from(document.fonts).some((font) => font.status === "error"))
      throw new Error("Resume font failed to load");
    const sheet = sheets[0];
    await Promise.all(
      Array.from(sheet.querySelectorAll("img"), (image) => image.decode()),
    );
    if (sheet.innerText.trim().length < minimumTextLength)
      throw new Error("Resume has insufficient content");
    const bounds = sheet.getBoundingClientRect();
    const walker = document.createTreeWalker(sheet, NodeFilter.SHOW_TEXT);
    for (let text = walker.nextNode(); text; text = walker.nextNode()) {
      if (!text.textContent!.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(text);
      const rectangles = Array.from(range.getClientRects());
      if (
        rectangles.length === 0 ||
        rectangles.some(
          (rect) =>
            rect.left < bounds.left - 1 ||
            rect.right > bounds.right + 1 ||
            rect.top < bounds.top - 1 ||
            rect.bottom > bounds.bottom + 1,
        )
      )
        throw new Error(`Resume content overflows A4: ${text.textContent!.trim()}`);
    }
    document.documentElement.lang = "en";
    return {
      text: sheet.innerText
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean),
      links: Array.from(
        sheet.querySelectorAll<HTMLAnchorElement>("a[href]"),
        (link) => link.href,
      ),
    };
  }, MIN_VISIBLE_TEXT_CHARS);
  const pdf = Buffer.from(
    await page.pdf({ preferCSSPageSize: true, printBackground: true }),
  );
  await resources.assertLoaded();

  await assertResumePdfStructure(pdf, expected.links);
  await assertResumePdfText(pdf, expected.text);
  return pdf;
}
