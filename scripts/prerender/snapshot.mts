import type { Page } from "puppeteer";
import type { watchPageResources } from "../browser-resources.mts";
import { MIN_VISIBLE_TEXT_CHARS, PRERENDER_LOCALE } from "./settings.mts";

const DOM_IDLE_MS = 1_000;
const DOM_SETTLE_TIMEOUT_MS = 60_000;

function waitForDomIdle(page: Page, idleMs: number, timeoutMs: number) {
  return page.evaluate(
    (idle, timeout) =>
      new Promise<void>((resolveIdle, rejectIdle) => {
        let idleTimer: ReturnType<typeof setTimeout>;

        const hardTimer = setTimeout(() => {
          observer.disconnect();
          clearTimeout(idleTimer);
          rejectIdle(new Error(`DOM still mutating after ${timeout}ms`));
        }, timeout);

        const settle = () => {
          observer.disconnect();
          clearTimeout(hardTimer);
          resolveIdle();
        };

        const restart = () => {
          clearTimeout(idleTimer);
          idleTimer = setTimeout(settle, idle);
        };

        const observer = new MutationObserver(restart);
        observer.observe(document.documentElement, {
          attributes: true,
          characterData: true,
          childList: true,
          subtree: true,
        });
        restart();
      }),
    idleMs,
    timeoutMs,
  );
}

export async function snapshot(
  page: Page,
  origin: string,
  route: string,
  resources: Awaited<ReturnType<typeof watchPageResources>>,
) {
  const response = await page.goto(`${origin}${route}`, { waitUntil: "networkidle0" });
  if (!response?.ok()) {
    throw new Error(`${route} responded ${response?.status()}`);
  }

  const locale = await page.evaluate(() => navigator.language);
  if (locale !== PRERENDER_LOCALE) {
    throw new Error(
      `Browser locale is "${locale}" but the snapshot must be "${PRERENDER_LOCALE}". ` +
        `The locale override did not apply, so the wrong language would be indexed.`,
    );
  }

  // Unselected artwork is absent from the DOM, but every project's assets must pass build checks.
  const projectTabs = await page.$$('#projects [role="tab"]');
  for (let index = 0; index < projectTabs.length; index++) {
    await projectTabs[index].evaluate((tab) => {
      if (!(tab instanceof HTMLElement)) throw new Error("Project tab is not HTML");
      tab.click();
    });
    await page.waitForFunction(
      (selected) =>
        document
          .querySelectorAll('#projects [role="tab"]')
          [selected]?.getAttribute("aria-selected") === "true",
      {},
      index,
    );
    await resources.assertLoaded();
    await page.$$eval("#projects img[srcset]", async (images) => {
      // A valid currentSrc does not prove the other DPR renditions can be decoded.
      const sources = new Set(
        images.flatMap((image) =>
          image.srcset.split(",").map((source) => source.trim().split(/\s+/)[0]),
        ),
      );
      for (const source of sources) {
        const image = new Image();
        image.src = source;
        try {
          await image.decode();
        } catch {
          throw new Error(`Image cannot be decoded: ${source} (responsive artwork)`);
        }
      }
    });
  }
  if (projectTabs.length) {
    await projectTabs[0].evaluate((tab) => {
      if (!(tab instanceof HTMLElement)) throw new Error("Project tab is not HTML");
      tab.click();
    });
    await page.waitForFunction(
      () =>
        document
          .querySelector('#projects [role="tab"]')
          ?.getAttribute("aria-selected") === "true",
    );
  }

  await waitForDomIdle(page, DOM_IDLE_MS, DOM_SETTLE_TIMEOUT_MS);
  await resources.assertLoaded();

  // Capturing only #root preserves shell metadata and excludes body-level portals.
  const rootHtml = await page.$eval("#root", (root) => {
    const snapshot = root.cloneNode(true);
    if (!(snapshot instanceof HTMLElement))
      throw new Error("Snapshot root is not HTML");
    for (const preview of snapshot.querySelectorAll("[data-artwork-preview]"))
      preview.removeAttribute("data-loaded");
    return snapshot.innerHTML;
  });
  if (!rootHtml.trim()) {
    throw new Error(`${route} rendered an empty #root`);
  }
  return rootHtml;
}

export function assertSnapshotHasContent(rootHtml: string, route: string) {
  const visibleText = rootHtml
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (visibleText.length < MIN_VISIBLE_TEXT_CHARS) {
    throw new Error(
      `${route} rendered only ${visibleText.length} characters of visible text, ` +
        `expected at least ${MIN_VISIBLE_TEXT_CHARS}. The snapshot is what crawlers ` +
        `read, so a thin one defeats the point of prerendering.\n` +
        `Got: ${JSON.stringify(visibleText.slice(0, 200))}`,
    );
  }
  return visibleText.length;
}
