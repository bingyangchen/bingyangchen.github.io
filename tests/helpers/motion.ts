import { type Page } from "@playwright/test";
import assert from "node:assert/strict";

export async function assertHoverCapability(page: Page, expected: boolean) {
  assert.equal(
    await page.evaluate(() => matchMedia("(hover: hover)").matches),
    expected,
    "Hover capability must match the test input device",
  );
}

export async function hoverLink(page: Page, selector: string) {
  await page
    .locator(selector)
    .evaluate((link: HTMLElement) =>
      link.scrollIntoView({ behavior: "instant", block: "center" }),
    );
  await settleMotion(page);
  await page.locator(selector).hover();
  await page.waitForFunction(
    (selector) => document.querySelector<HTMLElement>(selector)!.matches(":hover"),
    selector,
    { timeout: 5000 },
  );
}

export async function assertArrowState(
  page: Page,
  selector: string,
  horizontalOffset: number,
  verticalOffset: number,
  transitionDuration: string,
) {
  // An empty animation list can resolve before hover creates its transition.
  await page.waitForFunction(
    ([selector, horizontalOffset, verticalOffset, transitionDuration]) => {
      const style = getComputedStyle(document.querySelector<HTMLElement>(selector)!);
      const matrix = new DOMMatrixReadOnly(
        style.transform === "none" ? undefined : style.transform,
      );
      return (
        Math.abs(matrix.m41 - horizontalOffset) < 0.01 &&
        Math.abs(matrix.m42 - verticalOffset) < 0.01 &&
        style.transitionDuration === transitionDuration
      );
    },
    [selector, horizontalOffset, verticalOffset, transitionDuration] as const,
    { timeout: 5000 },
  );
}

export async function settleMotion(page: Page) {
  await page.evaluate(
    () =>
      new Promise((resolveFrame) =>
        requestAnimationFrame(() => requestAnimationFrame(resolveFrame)),
      ),
  );
}

export async function moveMotionTarget(
  page: Page,
  selector: string,
  viewportTop: number,
) {
  await page.evaluate(
    ([targetSelector, top]) => {
      dispatchEvent(new WheelEvent("wheel"));
      const element = document.querySelector<HTMLElement>(targetSelector)!;
      let documentTop = 0;
      for (
        let parent: HTMLElement | null = element;
        parent;
        parent = parent.offsetParent as HTMLElement | null
      )
        documentTop += parent.offsetTop;
      window.scrollTo({ top: documentTop - top, behavior: "instant" });
    },
    [selector, viewportTop] as const,
  );
  await settleMotion(page);
}

export async function getMotionState(page: Page, selector: string) {
  return page
    .locator(selector)
    .first()
    .evaluate((element: HTMLElement) => {
      const style = getComputedStyle(element);
      const matrix = new DOMMatrixReadOnly(
        style.transform === "none" ? undefined : style.transform,
      );
      return {
        opacity: Number(style.opacity),
        x: matrix.m41,
        y: matrix.m42,
        scale: Math.hypot(matrix.m11, matrix.m12, matrix.m13),
        transform: style.transform,
      };
    });
}

export async function getMotionComposition(
  page: Page,
  selector: string,
  childSelectors: string[],
) {
  return page
    .locator(selector)
    .first()
    .evaluate((group: HTMLElement, selectors) => {
      const bounds = group.getBoundingClientRect();
      const scale = new DOMMatrixReadOnly(getComputedStyle(group).transform).m11;
      return selectors.flatMap((childSelector) =>
        [...group.querySelectorAll<HTMLElement>(childSelector)]
          .filter((child) => child.getClientRects().length)
          .map((child) => {
            const rect = child.getBoundingClientRect();
            const style = getComputedStyle(child);
            return {
              x: (rect.left - bounds.left) / scale,
              y: (rect.top - bounds.top) / scale,
              opacity: style.opacity,
              transform: style.transform,
            };
          }),
      );
    }, childSelectors);
}
