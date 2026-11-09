import { getImageDecodeFailures } from "../../scripts/image-decoding.mts";
import { createServer, type Server } from "node:http";
import { startStaticServer } from "../../scripts/static-server.mts";
import { type AddressInfo } from "node:net";
import { fileURLToPath } from "node:url";
import { watchPageResources } from "../helpers/resources";
import assert from "node:assert/strict";
import { test, expect } from "../helpers/fixtures";

let fixtureServer: Server;

let fixtureOrigin: string;

let siteServer: Awaited<ReturnType<typeof startStaticServer>>;

test.beforeAll(async () => {
  fixtureServer = createServer((request, response) => {
    if (request.url === "/") {
      response
        .writeHead(200, { "Content-Type": "text/html" })
        .end(
          '<html><head><link rel="icon" href="data:,"></head><body>Resource fixture</body></html>',
        );
    } else if (request.url?.startsWith("/pending-image.svg")) {
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
  await new Promise<void>((resolveListening) =>
    fixtureServer.listen(0, "127.0.0.1", resolveListening),
  );
  fixtureOrigin = `http://127.0.0.1:${(fixtureServer.address() as AddressInfo).port}`;
  siteServer = await startStaticServer(
    fileURLToPath(new URL("../../build", import.meta.url)),
  );
});

test.afterAll(async () => {
  await siteServer.close();
  await new Promise<void>((resolveClosed) =>
    fixtureServer.close(() => resolveClosed()),
  );
});

test("resource checks reject missing, invalid and failed local resources", async ({
  createContext,
}) => {
  const cases: [string, string, RegExp][] = [
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
    const context = await createContext();
    const page = await context.newPage();
    const resources = await watchPageResources(page);
    const url = new URL(path, fixtureOrigin).href;
    try {
      await page.goto(fixtureOrigin, { waitUntil: "networkidle" });
      const completed = Promise.race([
        page.waitForEvent("requestfailed", (request) => request.url() === url),
        page.waitForEvent("requestfinished", (request) => request.url() === url),
      ]);
      await page.evaluate(
        ([kind, url]) => {
          if (kind === "fetch") void fetch(url).catch(() => {});
          else {
            const element = document.createElement(kind === "image" ? "img" : "script");
            element.src = url;
            document.body.append(element);
          }
        },
        [kind, url],
      );
      await completed;
      await assert.rejects(resources.assertLoaded(), (error) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, expected);
        assert.ok(error.message.includes(url), error.message);
        assert.ok(error.message.includes(`(${kind})`), error.message);
        return true;
      });
    } finally {
      await resources.stop();
    }
  }
});

test("resource checks accept superseded image cancellations but reject an undecodable current image", async ({
  createContext,
}) => {
  test.setTimeout(15000);
  const context = await createContext();
  const page = await context.newPage();
  const resources = await watchPageResources(page);
  try {
    await page.goto(fixtureOrigin, { waitUntil: "networkidle" });
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
        resolveFailed(request.failure()!.errorText);
      });
    });
    await page.locator("img").evaluate((image: HTMLImageElement) => {
      image.src = "/ready-image.svg";
    });
    assert.equal(await failed, "net::ERR_ABORTED");
    await resources.assertLoaded();
    const pending = page.waitForResponse((response) =>
      response.url().includes("/pending-image.svg?required"),
    );
    await page.locator("img").evaluate((image: HTMLImageElement) => {
      image.src = "/pending-image.svg?required";
    });
    await pending;
    const session = await page.context().newCDPSession(page);
    await session.send("Page.stopLoading");
    await assert.rejects(resources.assertLoaded(), /Image cannot be decoded/);
  } finally {
    await resources.stop();
  }
});

test("resource checks preserve console and JavaScript failures", async ({
  createContext,
}) => {
  const context = await createContext();
  const page = await context.newPage();
  const resources = await watchPageResources(page);
  try {
    await page.goto(fixtureOrigin, { waitUntil: "networkidle" });
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
    await resources.stop();
  }
});

test("SITE-R6.5 local brand images reserve space in both languages and hide failed images", async ({
  createContext,
}) => {
  const context = await createContext();
  const page = await context.newPage();
  const resources = await watchPageResources(page);
  try {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(siteServer.origin, { waitUntil: "networkidle" });
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const language of ["en", "zh-TW"]) {
        await page.evaluate((language) => {
          if (document.documentElement.lang !== language)
            document.querySelector<HTMLElement>("[data-language-switcher]")!.click();
        }, language);
        await page.waitForFunction(
          (language) => document.documentElement.lang === language,
          language,
          {},
        );
        await resources.assertLoaded();
        const images = await page
          .locator("[data-brand-image]")
          .evaluateAll((images: HTMLImageElement[]) =>
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
    const before = await page
      .locator("#about [data-brand-image]")
      .first()
      .evaluate((image: HTMLImageElement) => {
        const bounds = image.getBoundingClientRect();
        return {
          width: bounds.width,
          height: bounds.height,
          text: image.parentElement!.textContent!,
        };
      });
    await page
      .locator("#about [data-brand-image]")
      .first()
      .evaluate((image: HTMLImageElement) => {
        image.src = "/missing-brand.png";
      });
    await expect(page.locator("#about [data-image-failed]").first()).toBeAttached();
    const after = await page
      .locator("#about [data-brand-image]")
      .first()
      .evaluate((image: HTMLImageElement) => {
        const bounds = image.getBoundingClientRect();
        return {
          width: bounds.width,
          height: bounds.height,
          text: image.parentElement!.textContent!,
          visibility: getComputedStyle(image).visibility,
        };
      });
    assert.deepEqual(after, { ...before, visibility: "hidden" });
    await assert.rejects(resources.assertLoaded(), /missing-brand\.png/);
  } finally {
    await resources.stop();
  }
});

test("resource checks accept native mail delegation without treating it as a failed asset", async ({
  createContext,
}) => {
  const context = await createContext();
  const page = await context.newPage();
  const resources = await watchPageResources(page);
  try {
    await page.goto(fixtureOrigin, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      const link = document.createElement("a");
      link.href = "mailto:reader@example.test";
      link.textContent = "Contact";
      document.body.append(link);
    });
    const delegated = page.waitForEvent(
      "requestfailed",
      (request) => request.isNavigationRequest() && request.url().startsWith("mailto:"),
    );
    await page.getByRole("link", { name: "Contact", exact: true }).click();
    await delegated;
    await resources.assertLoaded();
  } finally {
    await resources.stop();
  }
});

test("resource checks decode the current source when an image changes during decoding", async ({
  createContext,
}) => {
  const context = await createContext();
  const page = await context.newPage();
  const resources = await watchPageResources(page);
  try {
    await page.goto(fixtureOrigin, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      const decode = HTMLImageElement.prototype.decode;
      HTMLImageElement.prototype.decode = function () {
        document.documentElement.dataset.imageDecodeStarted = "true";
        return decode.call(this);
      };
      const image = new Image();
      image.src = "/pending-image.svg?changing-source";
      document.body.append(image);
    });
    const outcome = resources.assertLoaded().then(
      () => null,
      (error: unknown) => error,
    );
    await page.waitForFunction(
      () => document.documentElement.dataset.imageDecodeStarted === "true",
    );
    await page.locator("img").evaluate((image: HTMLImageElement) => {
      image.src = "/ready-image.svg";
    });
    assert.equal(
      await outcome,
      null,
      "an obsolete decode must not reject a valid replacement image",
    );
    await page.locator("img").evaluate((image: HTMLImageElement) => {
      image.src = "/broken.png";
    });
    await assert.rejects(resources.assertLoaded(), /Image cannot be decoded/);
  } finally {
    await resources.stop();
  }
});

test("image decoding rechecks completed candidates while other images are pending", async ({
  createContext,
}) => {
  const context = await createContext();
  const page = await context.newPage();
  await page.goto(fixtureOrigin, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    const first = new Image();
    first.id = "first-image";
    first.src = "/ready-image.svg";
    document.body.append(first);
    await first.decode();
    const second = new Image();
    second.id = "second-image";
    second.src = "/pending-image.svg?batch";
    document.body.append(second);
    const decode = HTMLImageElement.prototype.decode;
    HTMLImageElement.prototype.decode = async function () {
      if (this.id === "second-image")
        document.documentElement.dataset.secondDecodeStarted = "true";
      await decode.call(this);
      if (this.id === "first-image")
        document.documentElement.dataset.firstDecoded = "true";
    };
  });
  const checking = page.evaluate(getImageDecodeFailures);
  await page.waitForFunction(
    () =>
      document.documentElement.dataset.firstDecoded === "true" &&
      document.documentElement.dataset.secondDecodeStarted === "true",
  );
  await page.evaluate(() => {
    (document.getElementById("first-image") as HTMLImageElement).src = "/broken.png";
    (document.getElementById("second-image") as HTMLImageElement).src =
      "/ready-image.svg";
  });
  assert.ok(
    (await checking).some((failure) => failure.includes("broken.png")),
    "the current replacement must be verified after the complete batch",
  );
});
