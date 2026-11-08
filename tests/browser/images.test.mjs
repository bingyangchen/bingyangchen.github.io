import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import puppeteer from "puppeteer";
import { startStaticServer } from "../../scripts/serve-build.mjs";
import { watchPageResources } from "../../scripts/browser-resources.mjs";

const tabs = '#projects [role="tab"]';
const selectedPanel = '#projects [role="tabpanel"][aria-hidden="false"]';
const artwork = `${selectedPanel} [data-artwork-image]`;
const buildDirectory = fileURLToPath(new URL("../../build", import.meta.url));
let browser;
let server;

before(async () => {
  server = await startStaticServer(buildDirectory);
  browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
});
after(async () => {
  await browser?.close();
  await server?.close();
});

async function openPage(viewport, hash = "", javaScriptEnabled = true) {
  const context = await browser.createBrowserContext();
  try {
    const page = await context.newPage();
    await page.setViewport(viewport);
    await page.setJavaScriptEnabled(javaScriptEnabled);
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);
    const resources = await watchPageResources(page);
    await page.goto(server.origin + "/" + hash, { waitUntil: "networkidle0" });
    return { page, resources, context };
  } catch (error) {
    await context.close();
    throw error;
  }
}

async function getImageRequests(page) {
  return page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .filter((entry) => /\.(webp|png|jpe?g|svg)(?:$|\?)/.test(entry.name))
      .map((entry) => ({
        url: new URL(entry.name).pathname,
        bytes: entry.decodedBodySize,
      })),
  );
}

async function selectProject(page, index) {
  await page.$eval(`${tabs}:nth-child(${index + 1})`, (tab) => tab.click());
  await page.waitForFunction(
    (index) =>
      document
        .querySelectorAll('#projects [role="tab"]')
        [index].getAttribute("aria-selected") === "true",
    {},
    index,
  );
}

async function assertArtworkDecoded(page) {
  await page.$$eval(artwork, (images) =>
    Promise.all(images.map((image) => image.decode())),
  );
}

test("內嵌預覽的 JS、CSS 與 HTML 成本維持資源預算", async () => {
  const assets = join(buildDirectory, "assets");
  const files = (await readdir(assets)).filter((name) => /\.(js|css)$/.test(name));
  const sizes = await Promise.all(
    files.map(async (name) => gzipSync(await readFile(join(assets, name))).length),
  );
  assert.ok(sizes.reduce((sum, size) => sum + size, 0) <= 128 * 1024);
  assert.ok(
    gzipSync(await readFile(join(buildDirectory, "index.html"))).length <= 16 * 1024,
  );
});

test(
  "SITE-R7.10 初始圖片資源預算與 512 px 前後的載入",
  { timeout: 60000 },
  async (t) => {
    for (const [width, deviceScaleFactor] of [
      [390, 1],
      [390, 2],
      [390, 3],
      [512, 2],
      [513, 2],
      [720, 2],
      [1024, 2],
      [1440, 1],
      [1440, 2],
    ]) {
      const { page, resources, context } = await openPage({
        width,
        height: 844,
        deviceScaleFactor,
      });
      try {
        const initial = await getImageRequests(page);
        t.diagnostic(
          JSON.stringify({
            width,
            deviceScaleFactor,
            initialImageBytes: initial.reduce((sum, request) => sum + request.bytes, 0),
          }),
        );
        assert.ok(
          initial.reduce((sum, request) => sum + request.bytes, 0) <= 192 * 1024,
          JSON.stringify({ width, deviceScaleFactor, initial }),
        );
        assert.ok(
          !initial.some((request) =>
            /noads-interface|leechai-(accounts|settings)/.test(request.url),
          ),
        );
        const portraits = await page.$$eval("#home button img", (images) =>
          images.map((image) => image.currentSrc),
        );
        assert.equal(portraits.length, 2);
        assert.ok(
          portraits.every((source) => source.includes(`-${160 * deviceScaleFactor}-`)),
          portraits.join("\n"),
        );
        await page.$eval("#projects", (section) =>
          section.scrollIntoView({ behavior: "instant" }),
        );
        await assertArtworkDecoded(page);
        await page.waitForNetworkIdle({ idleTime: 100 });
        const requests = await getImageRequests(page);
        assert.ok(
          !requests.some((request) =>
            /noads-interface|leechai-(accounts|settings)/.test(request.url),
          ),
        );
        assert.equal(
          requests.some((request) => request.url.includes("taigu-allocation")),
          width > 512,
        );
        assert.ok(
          requests
            .filter((request) => /taigu-(overview|allocation)/.test(request.url))
            .every((request) => request.bytes <= 64 * 1024),
        );
        assert.ok(!requests.some((request) => request.url === "/cover.png"));
        await resources.assertLoaded();
      } finally {
        resources.stop();
        await context.close();
      }
    }
  },
);

test(
  "SITE-R7.10 SITE-R7.3 Hash 直達、作品切換及 resize 保留圖片與自然高度",
  { timeout: 30000 },
  async () => {
    const { page, resources, context } = await openPage(
      { width: 390, height: 844, deviceScaleFactor: 2 },
      "#projects",
    );
    try {
      await assertArtworkDecoded(page);
      await page.focus(`${tabs}:nth-child(1)`);
      const before = await page.evaluate(() => ({
        height: document.documentElement.scrollHeight,
        scroll: scrollY,
      }));
      for (const [key, name, source] of [
        ["End", "Leechai", "leechai-accounts"],
        ["ArrowLeft", "Noads", "noads-interface"],
        ["Home", "Taigu", "taigu-overview"],
      ]) {
        await page.keyboard.press(key);
        await assertArtworkDecoded(page);
        assert.equal(
          await page.$eval(`${selectedPanel} h3`, (heading) => heading.textContent),
          name,
        );
        assert.equal(
          await page.evaluate(() => document.activeElement.textContent.trim()),
          name,
        );
        assert.deepEqual(
          await page.evaluate(() => ({
            height: document.documentElement.scrollHeight,
            scroll: scrollY,
          })),
          before,
        );
        const sources = await page.$$eval(artwork, (images) =>
          images.map((image) => image.currentSrc),
        );
        assert.ok(
          sources.some((url) => url.includes(source)),
          sources.join("\n"),
        );
      }
      assert.ok(
        !(await getImageRequests(page)).some((request) =>
          /taigu-allocation|leechai-settings/.test(request.url),
        ),
      );
      await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
      await assertArtworkDecoded(page);
      await page.waitForNetworkIdle({ idleTime: 100 });
      assert.ok(
        (await getImageRequests(page)).some((request) =>
          request.url.includes("taigu-allocation"),
        ),
      );
      await selectProject(page, 2);
      await assertArtworkDecoded(page);
      assert.ok(
        (await getImageRequests(page)).some((request) =>
          request.url.includes("leechai-settings"),
        ),
      );
      await resources.assertLoaded();
    } finally {
      resources.stop();
      await context.close();
    }
  },
);

test("SITE-R7.10 慢速載入與快速切換立即提供目前作品的預覽", async () => {
  const { page, resources, context } = await openPage(
    { width: 390, height: 844, deviceScaleFactor: 2 },
    "#projects",
  );
  try {
    await assertArtworkDecoded(page);
    const session = await page.createCDPSession();
    await session.send("Network.enable");
    await session.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 400,
      downloadThroughput: 32 * 1024,
      uploadThroughput: 32 * 1024,
    });
    const before = await page.evaluate(() => ({
      height: document.documentElement.scrollHeight,
      scroll: scrollY,
    }));
    await selectProject(page, 2);
    const preview = await page.$eval(
      `${selectedPanel} [data-artwork-preview]`,
      (image) => ({
        visible: getComputedStyle(image).visibility,
        loaded: image.complete && image.naturalWidth === 48,
        source: image.src,
      }),
    );
    assert.equal(preview.visible, "visible");
    assert.ok(preview.loaded && preview.source.startsWith("data:image/webp;"));
    for (const index of [1, 0, 2, 1, 2]) await selectProject(page, index);
    assert.equal(
      await page.$eval(`${selectedPanel} h3`, (heading) => heading.textContent),
      "Leechai",
    );
    assert.deepEqual(
      await page.evaluate(() => ({
        height: document.documentElement.scrollHeight,
        scroll: scrollY,
      })),
      before,
    );
    await assertArtworkDecoded(page);
    await session.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
    });
    await resources.assertLoaded();
  } finally {
    resources.stop();
    await context.close();
  }
});

test("SITE-R14.2 SITE-R7.10 無 JavaScript 的圖片來源、文字及 PDF 連結可用", async () => {
  const { page, resources, context } = await openPage(
    { width: 390, height: 844, deviceScaleFactor: 2 },
    "#projects",
    false,
  );
  try {
    await assertArtworkDecoded(page);
    const sources = await page.$$eval(artwork, (images) =>
      images.map((image) => image.currentSrc),
    );
    assert.ok(
      sources.some((url) => url.includes("taigu-overview-480")),
      sources.join("\n"),
    );
    assert.ok(
      !(await getImageRequests(page)).some((request) =>
        /taigu-allocation|noads-interface|leechai-(accounts|settings)/.test(
          request.url,
        ),
      ),
    );
    assert.equal(
      await page.$$eval('#projects [role="tabpanel"]', (panels) => panels.length),
      3,
    );
    assert.ok(await page.$('#home a[download][href="/resume.pdf"]'));
    await resources.assertLoaded();
  } finally {
    resources.stop();
    await context.close();
  }
});
