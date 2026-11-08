import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";
import { watchPageResources } from "../../scripts/browser-resources.mjs";
import { startStaticServer } from "../../scripts/serve-build.mjs";

let browser;
let fixtureServer;
let fixtureOrigin;
let siteServer;

before(async () => {
  fixtureServer = createServer((request, response) => {
    if (request.url === "/") {
      response
        .writeHead(200, { "Content-Type": "text/html" })
        .end(
          '<html><head><link rel="icon" href="data:,"></head><body>Resource fixture</body></html>',
        );
    } else if (request.url.startsWith("/pending-image.svg")) {
      response.writeHead(200, { "Content-Type": "image/svg+xml" });
      response.write('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1">');
      response.once("close", () => response.end());
    } else if (request.url === "/ready-image.svg") {
      response
        .writeHead(200, { "Content-Type": "image/svg+xml" })
        .end(
          '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1"/></svg>',
        );
    } else if (request.url === "/html-image.png") {
      response
        .writeHead(200, { "Content-Type": "text/html" })
        .end("<p>Not an image</p>");
    } else if (request.url === "/broken.png") {
      response.writeHead(200, { "Content-Type": "image/png" }).end("invalid PNG");
    } else if (request.url === "/server-error") {
      response.writeHead(503).end("unavailable");
    } else if (request.url === "/disconnect") {
      request.socket.destroy();
    } else {
      response.writeHead(404).end("not found");
    }
  });
  await new Promise((resolveListening) =>
    fixtureServer.listen(0, "127.0.0.1", resolveListening),
  );
  fixtureOrigin = `http://127.0.0.1:${fixtureServer.address().port}`;
  siteServer = await startStaticServer(
    fileURLToPath(new URL("../../build", import.meta.url)),
  );
  browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
});

after(async () => {
  await browser?.close();
  await siteServer?.close();
  await new Promise((resolveClosed) => fixtureServer.close(resolveClosed));
});

test("resource checks reject missing, invalid and failed local resources", async () => {
  const cases = [
    ["image", "/missing-image.png", /HTTP 404/],
    ["image", "/html-image.png", /Invalid image response \(text\/html\)/],
    ["image", "/broken.png", /Image cannot be decoded/],
    ["fetch", "/server-error", /HTTP 503/],
    ["fetch", "/disconnect", /Request failed/],
    ["fetch", "https://unexpected.invalid/data", /Unexpected external request/],
    ["script", "https://unexpected.invalid/script.js", /Unexpected external request/],
    ["image", "https://unexpected.invalid/logo.png", /Unexpected external request/],
  ];
  for (const [kind, path, expected] of cases) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    const resources = await watchPageResources(page);
    const url = new URL(path, fixtureOrigin).href;
    try {
      await page.goto(fixtureOrigin, { waitUntil: "networkidle0" });
      await page.evaluate(
        (kind, url) => {
          if (kind === "fetch") void fetch(url).catch(() => {});
          else {
            const element = document.createElement(kind === "image" ? "img" : "script");
            element.src = url;
            document.body.append(element);
          }
        },
        kind,
        url,
      );
      await page.waitForNetworkIdle({ idleTime: 100 });
      await assert.rejects(resources.assertLoaded(), (error) => {
        assert.match(error.message, expected);
        assert.ok(error.message.includes(url), error.message);
        assert.ok(error.message.includes(`(${kind})`), error.message);
        return true;
      });
    } finally {
      resources.stop();
      await context.close();
    }
  }
});

test(
  "resource checks accept superseded image cancellations but reject an undecodable current image",
  { timeout: 15000 },
  async () => {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    const resources = await watchPageResources(page);
    try {
      await page.goto(fixtureOrigin, { waitUntil: "networkidle0" });
      const response = page.waitForResponse((response) =>
        response.url().includes("/pending-image.svg"),
      );
      await page.evaluate(() => {
        const image = new Image();
        image.src = "/pending-image.svg";
        document.body.append(image);
      });
      await response;
      const failed = new Promise((resolveFailed, rejectFailed) => {
        const timer = setTimeout(
          () => rejectFailed(new Error("Expected image cancellation")),
          5000,
        );
        page.once("requestfailed", (request) => {
          clearTimeout(timer);
          resolveFailed(request.failure().errorText);
        });
      });
      await page.$eval("img", (image) => {
        image.src = "/ready-image.svg";
      });
      assert.equal(await failed, "net::ERR_ABORTED");
      await resources.assertLoaded();

      const pending = page.waitForResponse((response) =>
        response.url().includes("/pending-image.svg?required"),
      );
      await page.$eval("img", (image) => {
        image.src = "/pending-image.svg?required";
      });
      await pending;
      const session = await page.createCDPSession();
      await session.send("Page.stopLoading");
      await assert.rejects(resources.assertLoaded(), /Image cannot be decoded/);
    } finally {
      resources.stop();
      await context.close();
    }
  },
);

test("resource checks preserve console and JavaScript failures", async () => {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const resources = await watchPageResources(page);
  try {
    await page.goto(fixtureOrigin, { waitUntil: "networkidle0" });
    const error = new Promise((resolveError) => page.once("pageerror", resolveError));
    await page.evaluate(() => {
      console.error("fixture console failure");
      setTimeout(() => {
        throw new Error("fixture JavaScript failure");
      }, 0);
    });
    await error;
    await assert.rejects(resources.assertLoaded(), /fixture console failure/);
    await assert.rejects(resources.assertLoaded(), /fixture JavaScript failure/);
  } finally {
    resources.stop();
    await context.close();
  }
});

test("SITE-R6.5 local brand images reserve space in both languages and hide failed images", async () => {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const resources = await watchPageResources(page);
  try {
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);
    await page.goto(siteServer.origin, { waitUntil: "networkidle0" });
    for (const width of [320, 390, 1440]) {
      await page.setViewport({ width, height: 900 });
      for (const language of ["en", "zh-TW"]) {
        await page.evaluate((language) => {
          if (document.documentElement.lang !== language)
            document.querySelector("[data-language-switcher]").click();
        }, language);
        await page.waitForFunction(
          (language) => document.documentElement.lang === language,
          {},
          language,
        );
        await resources.assertLoaded();
        const images = await page.$$eval("[data-brand-image]", (images) =>
          images.map((image) => ({
            url: image.src,
            width: image.width,
            height: image.height,
            loaded: image.complete && image.naturalWidth > 0,
            reserved: image.hasAttribute("width") && image.hasAttribute("height"),
          })),
        );
        assert.equal(images.length, 7);
        assert.ok(
          images.every(
            (image) =>
              image.loaded && image.reserved && image.width > 0 && image.height > 0,
          ),
        );
        assert.ok(
          images.every((image) => new URL(image.url).origin === siteServer.origin),
        );
      }
    }
    await resources.assertLoaded();
    const before = await page.$eval("#about [data-brand-image]", (image) => {
      const bounds = image.getBoundingClientRect();
      return {
        width: bounds.width,
        height: bounds.height,
        text: image.parentElement.textContent,
      };
    });
    await page.$eval("#about [data-brand-image]", (image) => {
      image.src = "/missing-brand.png";
    });
    await page.waitForSelector("#about [data-image-failed]");
    const after = await page.$eval("#about [data-brand-image]", (image) => {
      const bounds = image.getBoundingClientRect();
      return {
        width: bounds.width,
        height: bounds.height,
        text: image.parentElement.textContent,
        visibility: getComputedStyle(image).visibility,
      };
    });
    assert.deepEqual(after, { ...before, visibility: "hidden" });
    await assert.rejects(resources.assertLoaded(), /missing-brand\.png/);
  } finally {
    resources.stop();
    await context.close();
  }
});
