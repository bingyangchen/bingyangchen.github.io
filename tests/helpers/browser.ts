import { type Page, type CDPSession } from "@playwright/test";
import assert from "node:assert/strict";

// Emulation overrides reset when their CDP session detaches.
const pageToSession = new WeakMap<Page, Promise<CDPSession>>();

function getCDPSession(page: Page) {
  let session = pageToSession.get(page);
  if (!session) {
    session = page.context().newCDPSession(page);
    pageToSession.set(page, session);
  }
  return session;
}

export async function setJavaScriptEnabled(page: Page, enabled: boolean) {
  const session = await getCDPSession(page);
  await session.send("Emulation.setScriptExecutionDisabled", { value: !enabled });
}

export async function setViewport(
  page: Page,
  viewport: {
    width: number;
    height: number;
    hasTouch?: boolean;
    isMobile?: boolean;
    deviceScaleFactor?: number;
  },
) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  const session = await getCDPSession(page);
  await session.send("Emulation.setTouchEmulationEnabled", {
    enabled: viewport.hasTouch ?? false,
  });
  if (viewport.isMobile !== undefined || viewport.deviceScaleFactor !== undefined)
    await session.send("Emulation.setDeviceMetricsOverride", {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: viewport.deviceScaleFactor ?? 1,
      mobile: viewport.isMobile ?? false,
    });
}

export async function tap(page: Page, selector: string) {
  const locator = page.locator(selector);
  await locator.scrollIntoViewIfNeeded();
  const bounds = await locator.boundingBox();
  assert.ok(bounds);
  await tapAt(page, bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
}

export async function tapAt(page: Page, x: number, y: number) {
  const session = await getCDPSession(page);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}
