import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { expect, test } from "../helpers/fixtures";

test.use({ javaScriptEnabled: false });

test("SITE-R14.2 無 JavaScript 的提示可讀且內容與 PDF 可用", async ({
  page,
  server,
}) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(server.origin, { waitUntil: "networkidle" });
    const notice = page.locator("noscript > p");
    await expect(notice).toBeVisible();
    await expect(notice).toHaveText(
      "你仍可閱讀主要內容並下載履歷 PDF；語言切換與互動功能需要啟用 JavaScript。",
    );
    const noticeBounds = await notice.boundingBox();
    const headerBounds = await page.getByRole("banner").boundingBox();
    assert.ok(noticeBounds && headerBounds);
    assert.ok(noticeBounds.y >= headerBounds.y + headerBounds.height);
    assert.ok(noticeBounds.x >= 0 && noticeBounds.x + noticeBounds.width <= width);
    await expect(page.locator("#home, #about, #projects, #blog")).toHaveCount(4);
    await expect(page.locator("#home h1")).toContainText("陳秉洋");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator('#home a[download][href="/resume.pdf"]').click(),
    ]);
    assert.equal(await download.failure(), null);
    const downloadedPath = await download.path();
    assert.ok(downloadedPath);
    const pdf = await readFile(downloadedPath);
    assert.equal(pdf.toString("ascii", 0, 5), "%PDF-");
  }
});

test("SITE-R16.2 SITE-R16.5 開發及 production Metadata 與實際圖示一致", async ({
  page,
  server,
}) => {
  const developmentServer = await createServer({
    root: fileURLToPath(new URL("../../", import.meta.url)),
    logLevel: "error",
    server: { host: "127.0.0.1", port: 0 },
  });
  try {
    await developmentServer.listen();
    const address = developmentServer.httpServer?.address();
    assert.ok(address && typeof address === "object");
    const manifests: string[] = [];
    for (const origin of [`http://127.0.0.1:${address.port}`, server.origin]) {
      const sitemapResponse = await page.request.get(`${origin}/sitemap.txt`);
      assert.equal(sitemapResponse.status(), 200);
      assert.match(sitemapResponse.headers()["content-type"], /^text\/plain\b/);
      assert.equal(
        await sitemapResponse.text(),
        [
          "https://byc1999.com/",
          "https://byc1999.com/path-finding-visualizer/",
          "https://byc1999.com/virus-spread/",
          "https://byc1999.com/market-sim/",
          "https://byc1999.com/inventory-analyzer/",
          "https://byc1999.com/snake/",
          "https://byc1999.com/tic-tac-toe/",
          "",
        ].join("\n"),
      );
      const robotsResponse = await page.request.get(`${origin}/robots.txt`);
      assert.equal(robotsResponse.status(), 200);
      assert.match(robotsResponse.headers()["content-type"], /^text\/plain\b/);
      assert.equal(
        await robotsResponse.text(),
        "User-agent: *\nAllow: /\n\nSitemap: https://byc1999.com/sitemap.txt\n",
      );
      await page.goto(origin, { waitUntil: "networkidle" });
      const manifestPath = await page
        .locator('link[rel="manifest"]')
        .getAttribute("href");
      assert.ok(manifestPath);
      const manifestUrl = new URL(manifestPath, page.url());
      const response = await page.request.get(manifestUrl.href);
      assert.equal(response.status(), 200);
      const source = await response.text();
      manifests.push(source);
      const manifest = JSON.parse(source);
      assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0);
      for (const icon of manifest.icons) {
        const iconUrl = new URL(icon.src, manifestUrl);
        const iconResponse = await page.request.get(iconUrl.href);
        assert.equal(iconResponse.status(), 200);
        assert.equal(icon.type, "image/webp");
        assert.equal(iconResponse.headers()["content-type"], icon.type);
        const bytes = await iconResponse.body();
        assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
        assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
        const dimensions = await page.evaluate(async (source) => {
          const image = new Image();
          image.src = source;
          await image.decode();
          return { width: image.naturalWidth, height: image.naturalHeight };
        }, iconUrl.href);
        assert.ok(dimensions.width > 0 && dimensions.height > 0);
        for (const size of icon.sizes.trim().split(/\s+/))
          assert.equal(size, `${dimensions.width}x${dimensions.height}`);
      }
    }
    assert.equal(manifests[0], manifests[1]);
  } finally {
    await developmentServer.close();
  }
});
