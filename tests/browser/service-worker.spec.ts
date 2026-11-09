import { fileURLToPath } from "node:url";
import { startStaticServer } from "../../scripts/static-server.mts";
import { mkdtemp, cp, mkdir, writeFile, rm, readdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { type Page, type Response } from "@playwright/test";
import assert from "node:assert/strict";
import { test } from "../helpers/fixtures";

declare global {
  interface Window {
    serviceWorkerQueries: number;
  }
}

const BUILD = fileURLToPath(new URL("../../build/", import.meta.url));

const WORKER = `
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
`;

let directory: string;

let legacyServer: Awaited<ReturnType<typeof startStaticServer>>;

test.beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), "legacy-service-worker-"));
  await cp(BUILD, directory, { recursive: true });
  await mkdir(join(directory, "other-project"));
  await writeFile(
    join(directory, "worker-fixture.html"),
    '<!doctype html><html><head><link rel="icon" href="data:,"></head><body>Legacy worker fixture</body></html>',
  );
  await writeFile(join(directory, "service-worker.js"), WORKER);
  await writeFile(join(directory, "other-project/service-worker.js"), WORKER);
  await writeFile(join(directory, "replacement-worker.js"), WORKER);
  legacyServer = await startStaticServer(directory);
});

test.afterAll(async () => {
  try {
    await legacyServer?.close();
  } finally {
    if (directory) await rm(directory, { recursive: true, force: true });
  }
});

async function openFixture(page: Page) {
  await page.addInitScript(() => {
    const getRegistrations = navigator.serviceWorker.getRegistrations.bind(
      navigator.serviceWorker,
    );
    window.serviceWorkerQueries = 0;
    navigator.serviceWorker.getRegistrations = async () => {
      const registrations = await getRegistrations();
      window.serviceWorkerQueries += 1;
      return registrations;
    };
  });
  await page.goto(`${legacyServer.origin}/worker-fixture.html`);
  return page;
}

async function openHome(page: Page) {
  await page.goto(legacyServer.origin, { waitUntil: "networkidle" });
  await page.waitForFunction(
    () =>
      window.serviceWorkerQueries > 0 && document.querySelector<HTMLElement>("#home")!,
    undefined,
  );
}

async function activateWorker(page: Page, script: string) {
  await page.evaluate(async (script) => {
    const registration = await navigator.serviceWorker.register(script);
    const worker = registration.installing ?? registration!.active!;
    if (worker!.state !== "activated")
      await new Promise<void>((resolveActivated, rejectActivated) => {
        worker!.addEventListener("statechange", () => {
          if (worker!.state === "activated") resolveActivated();
          if (worker!.state === "redundant")
            rejectActivated(new Error("Fixture worker failed to activate"));
        });
      });
  }, script);
}

test("SITE-R15.1 production output contains no service worker", async () => {
  const files = await readdir(BUILD, { recursive: true });
  assert.deepEqual(
    files.filter((file) => /(?:service-worker|workbox)[^/]*\.js$/.test(file)),
    [],
  );
});

test("SITE-R15.2 cleans an active legacy worker and its waiting update, preserving other projects and caches", async ({
  page,
}) => {
  test.setTimeout(15000);
  await openFixture(page);
  await activateWorker(page, "/service-worker.js");
  await activateWorker(page, "/other-project/service-worker.js");
  await page.waitForFunction(
    () => navigator.serviceWorker.controller !== null,
    undefined,
  );
  await page.evaluate(async () => {
    for (const name of ["legacy-site-cache", "other-project-cache"]) {
      const cache = await caches.open(name);
      await cache.put("/cached-value", new Response(name));
    }
  });
  await writeFile(join(directory, "service-worker.js"), `${WORKER}\n// Revision 2`);
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration("/");
    await registration!.update();
  });
  await page.waitForFunction(async () => {
    const registration = await navigator.serviceWorker.getRegistration("/");
    return registration!.active! && registration!.waiting!;
  }, undefined);
  await openHome(page);
  await page.waitForFunction(
    async () =>
      (await navigator.serviceWorker.getRegistrations()).every(
        (registration) => registration.scope !== `${location.origin}/`,
      ),
    undefined,
  );
  const result = await page.evaluate(async () => ({
    scopes: (await navigator.serviceWorker.getRegistrations()).map(
      (registration) => registration.scope,
    ),
    controller: navigator.serviceWorker.controller?.scriptURL,
    cacheNames: (await caches.keys()).sort(),
    values: await Promise.all(
      ["legacy-site-cache", "other-project-cache"].map(async (name) =>
        (await (await caches.open(name)).match("/cached-value"))!.text(),
      ),
    ),
  }));
  assert.deepEqual(result, {
    scopes: [`${legacyServer.origin}/other-project/`],
    controller: `${legacyServer.origin}/service-worker.js`,
    cacheNames: ["legacy-site-cache", "other-project-cache"],
    values: ["legacy-site-cache", "other-project-cache"],
  });
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.evaluate(() => navigator.serviceWorker.controller), null);
});

test("SITE-R15.2 preserves a root registration owned by a different script", async ({
  page,
}) => {
  test.setTimeout(15000);
  await openFixture(page);
  await activateWorker(page, "/replacement-worker.js");
  await openHome(page);
  assert.deepEqual(
    await page.evaluate(async () =>
      (await navigator.serviceWorker.getRegistrations()).map((registration) => ({
        scope: registration.scope,
        script: registration!.active!.scriptURL,
      })),
    ),
    [
      {
        scope: `${legacyServer.origin}/`,
        script: `${legacyServer.origin}/replacement-worker.js`,
      },
    ],
  );
});

test("SITE-R15.2 preserves a legacy registration being replaced by another script", async ({
  page,
}) => {
  test.setTimeout(15000);
  await openFixture(page);
  await activateWorker(page, "/service-worker.js");
  await page.waitForFunction(
    () => navigator.serviceWorker.controller !== null,
    undefined,
  );
  await page.evaluate(() => navigator.serviceWorker.register("/replacement-worker.js"));
  await page.waitForFunction(async () => {
    const registration = await navigator.serviceWorker.getRegistration("/");
    return registration?.waiting?.scriptURL.endsWith("/replacement-worker.js") ?? false;
  }, undefined);
  await openHome(page);
  assert.deepEqual(
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration("/");
      return {
        active: registration!.active!.scriptURL,
        waiting: registration!.waiting!.scriptURL,
      };
    }),
    {
      active: `${legacyServer.origin}/service-worker.js`,
      waiting: `${legacyServer.origin}/replacement-worker.js`,
    },
  );
});
