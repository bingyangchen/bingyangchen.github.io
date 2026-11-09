import { watchPageResources } from "../helpers/resources";
import { startStaticServer } from "../../scripts/static-server.mts";
import {
  test as base,
  expect,
  type BrowserContextOptions,
  type BrowserContext,
} from "@playwright/test";
import { fileURLToPath } from "node:url";

type ResourceMonitor = Awaited<ReturnType<typeof watchPageResources>>;

type StaticServer = Awaited<ReturnType<typeof startStaticServer>>;

export type CreateContext = (
  options?: BrowserContextOptions,
) => Promise<BrowserContext>;

export const test = base.extend<
  { pageResources: ResourceMonitor; createContext: CreateContext },
  { server: StaticServer }
>({
  createContext: async ({ browser }, use) => {
    const contexts: BrowserContext[] = [];
    try {
      await use(async (options = {}) => {
        const context = await browser.newContext({
          locale: "en-US",
          timezoneId: "Asia/Taipei",
          ...options,
        });
        contexts.push(context);
        return context;
      });
    } finally {
      await Promise.all(contexts.map((context) => context.close()));
    }
  },
  server: [
    // Playwright resolves dependencies from this parameter, including an empty pattern.
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const server = await startStaticServer(
        fileURLToPath(new URL("../../build", import.meta.url)),
      );
      try {
        await use(server);
      } finally {
        await server?.close();
      }
    },
    { scope: "worker" },
  ],
  pageResources: [
    async ({ page }, use, testInfo) => {
      const resources = await watchPageResources(page);
      try {
        await use(resources);
        await resources.assertLoaded();
      } finally {
        await resources.stop();
        if (testInfo.status !== testInfo.expectedStatus || resources.failures.length)
          await testInfo.attach("browser-console", {
            body: resources.consoleMessages.join("\n"),
            contentType: "text/plain",
          });
        if (resources.failures.length)
          await testInfo.attach("browser-errors", {
            body: resources.failures.join("\n"),
            contentType: "text/plain",
          });
      }
    },
    { auto: true },
  ],
});

export { expect };
