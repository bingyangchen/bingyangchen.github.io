import { fileURLToPath } from "node:url";
import { resolve, join } from "node:path";
import { openHome, enterPreview } from "../helpers/site";
import { settleMotion } from "../helpers/motion";
import { setJavaScriptEnabled } from "../helpers/browser";
import { getPrintResult } from "../helpers/resume";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { expect, test } from "../helpers/fixtures";
import { parsePdfMetadata } from "../helpers/pdf.mts";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

const BUILD = resolve(ROOT, "build");

test("SITE-R1.4 SITE-R12.4 非公開本機預覽", async ({ page, server }) => {
  await openHome(page, server);
  await enterPreview(page);
  assert.equal(
    await page.getByRole("heading", { name: "Resume", exact: true }).textContent(),
    "Resume",
  );
  assert.equal(
    await page
      .locator("[data-resume-root]")
      .evaluateAll((elements: HTMLElement[]) => elements.length),
    1,
  );
  assert.ok(await page.$("button"));
});

test("SITE-R10.1 雙語與各尺寸下載同一份 PDF", async ({ page, server }) => {
  await openHome(page, server);
  await page.evaluate(() => {
    window.print = () => {
      throw new Error("Homepage must download, not print");
    };
  });
  const expected = await readFile(join(BUILD, "resume.pdf"));
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 568 });
    for (const language of ["en", "zh-TW"]) {
      if ((await page.locator("html").getAttribute("lang")) !== language)
        await page
          .locator("[data-language-switcher]")
          .evaluate((element: HTMLElement) => element.click());
      await expect(page.locator("html")).toHaveAttribute("lang", language);
      await page.locator("#home a[download]").scrollIntoViewIfNeeded();
      await settleMotion(page);
      const downloaded = page.waitForEvent("download");
      await page.locator("#home a[download]").click();
      const download = await downloaded;
      assert.equal(await download.failure(), null);
      assert.equal(download.suggestedFilename(), "Bing-Yang Chen - 陳秉洋.pdf");
      const path = await download.path();
      assert.ok(path);
      assert.deepEqual(await readFile(path), expected);
      assert.equal(new URL(page.url()).pathname, "/");
    }
  }
});

test("SITE-R10.4 SITE-R10.5 英文預覽與首頁沒有隱藏履歷", async ({ page, server }) => {
  await openHome(page, server);
  let firstPreview;
  for (const language of ["en", "zh-TW"]) {
    if (language === "zh-TW") await page.locator("[data-language-switcher]").click();
    assert.equal(await page.$("[data-resume-root]"), null);
    assert.equal(await page.$(".resume-print-area"), null);
    await enterPreview(page);
    const preview = await page
      .locator("[data-resume-root]")
      .evaluateAll((elements: HTMLHtmlElement[]) =>
        elements.map((element) => ({
          text: element.textContent!,
          language: element.lang,
        })),
      );
    assert.equal(preview.length, 1);
    assert.equal(preview[0].language, "en");
    assert.ok(preview[0].text.includes("Career Summary"));
    if (firstPreview) assert.deepEqual(preview, firstPreview);
    firstPreview = preview;
    assert.equal(
      await page
        .locator('[class*="resumePage"]')
        .evaluate((element: HTMLHtmlElement) => element.lang),
      "en",
    );
    await page.goBack();
    await page.waitForSelector("#home");
    assert.equal(await page.$("[data-resume-root]"), null);
  }
});

test("SITE-R10.6 首頁下載焦點與預覽連結", async ({ page, server }) => {
  await openHome(page, server);
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    for (const language of ["en", "zh-TW"]) {
      await page.evaluate(
        (value) => localStorage.setItem("preferred_language", value),
        language,
      );
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForSelector("#home a[download]");
      await page
        .locator('#home a[aria-label="Cake"]')
        .evaluate((element: HTMLAnchorElement) => element.focus());
      await page.keyboard.press("Tab");
      assert.equal(
        await page.evaluate(() =>
          (document.activeElement as HTMLElement).getAttribute("download"),
        ),
        "Bing-Yang Chen - 陳秉洋.pdf",
      );
      assert.notEqual(
        await page
          .locator("#home a[download]")
          .evaluate(
            (element: HTMLAnchorElement) => getComputedStyle(element).outlineStyle,
          ),
        "none",
      );
      await page.keyboard.down("Shift");
      await page.keyboard.press("Tab");
      await page.keyboard.up("Shift");
      assert.equal(
        await page.evaluate(() =>
          (document.activeElement as HTMLElement).getAttribute("aria-label"),
        ),
        "Cake",
      );
      assert.equal(await page.$(".resume-print-area"), null);
      await enterPreview(page);
      await page
        .locator('[data-resume-root] a[href^="mailto:"]')
        .evaluate((element: HTMLAnchorElement) => element.focus());
      assert.ok(
        await page.evaluate(() =>
          (document.activeElement as HTMLAnchorElement).href.startsWith("mailto:"),
        ),
      );
      await page.goBack();
      await page.waitForSelector("#home");
      assert.equal(await page.$(".resume-print-area"), null);
    }
  }
});

test("SITE-R10.7 停用 JavaScript 與直接請求 PDF", async ({ page, server }) => {
  await setJavaScriptEnabled(page, false);
  await page.goto(server.origin, { waitUntil: "networkidle" });
  const link = await page
    .locator("#home a[download]")
    .evaluate((element: HTMLAnchorElement) => ({
      href: element.getAttribute("href"),
      name: element.getAttribute("download"),
    }));
  assert.deepEqual(link, { href: "/resume.pdf", name: "Bing-Yang Chen - 陳秉洋.pdf" });
  const response = await fetch(server.origin + link.href);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/pdf");
  assert.deepEqual(
    Buffer.from(await response.arrayBuffer()),
    await readFile(join(BUILD, "resume.pdf")),
  );
});

test("SITE-R10.4 SITE-R11.1 SITE-R11.2 SITE-R11.3 SITE-R11.4 下載與預覽共用英文 A4", async ({
  page,
  server,
}) => {
  const built = await parsePdfMetadata(await readFile(join(BUILD, "resume.pdf")));
  assert.equal(built.pages, 1);
  assert.equal(built.language, "en");
  assert.deepEqual(built.fonts, [
    "Georgia",
    "Georgia-Bold",
    "Georgia-Italic",
    "NotoSerifTC-Bold",
  ]);
  const fontLicense = await fetch(server.origin + "/fonts/OFL-NotoSerifTC.txt");
  assert.equal(fontLicense.status, 200);
  assert.ok((await fontLicense.text()).includes("SIL OPEN FONT LICENSE Version 1.1"));
  const dimensions = built.pageSizes[0];
  assert.ok(Math.abs(dimensions[0] - 595) < 2 && Math.abs(dimensions[1] - 842) < 2);
  for (const url of [
    "mailto:bryan.chen.429@gmail.com",
    "https://github.com/bingyangchen",
    "https://byc1999.com/",
  ])
    assert.ok(built.links.includes(url), url);
  await openHome(page, server);
  for (const language of ["en", "zh-TW"]) {
    if (language === "zh-TW") await page.locator("[data-language-switcher]").click();
    await enterPreview(page);
    const preview = await getPrintResult(page);
    assert.equal(
      await page.locator("html").evaluate((element: HTMLHtmlElement) => element.lang),
      language,
    );
    assert.equal(preview.pages, built.pages);
    assert.equal(preview.language, built.language);
    assert.deepEqual(preview.mediaBox, built.mediaBox);
    assert.deepEqual(preview.pageSizes, built.pageSizes);
    assert.deepEqual(preview.links, built.links);
    assert.deepEqual(preview.fonts, built.fonts);
    assert.equal(preview.metrics.count, 1);
    assert.equal(preview.metrics.visible, "visible");
    assert.ok(preview.metrics.bottom <= preview.metrics.height + 1);
    assert.equal(preview.metrics.header, "none");
    assert.equal(preview.metrics.footer, "none");
    assert.equal(preview.metrics.language, "hidden");
    const normalize = (text: string) =>
      text.normalize("NFKC").replace(/[\s\u00ad-]/g, "");
    for (const block of preview.metrics.text
      .split(/\n+/)
      .filter((text) => text.trim())) {
      assert.ok(
        normalize(preview.text).includes(normalize(block)),
        `Preview PDF is missing: ${block}`,
      );
      assert.ok(
        normalize(built.text).includes(normalize(block)),
        `Built PDF is missing: ${block}`,
      );
    }
    for (const section of ["SKILLS", "CAREER SUMMARY", "EDUCATION", "SOCIAL LINKS"])
      assert.ok(built.text.includes(section), section);
    await page.goBack();
    await page.waitForSelector("#home");
  }
});
