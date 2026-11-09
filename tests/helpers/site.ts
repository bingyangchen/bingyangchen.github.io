import { type Page } from "@playwright/test";
import assert from "node:assert/strict";
import { settleMotion } from "./motion";

const TABS = '#projects [role="tab"]';

export async function openHome(page: Page, server: { origin: string }, hash = "") {
  const response = await page.goto(server.origin + "/" + hash, {
    waitUntil: "networkidle",
  });
  assert.equal(response!.status(), 200);
  await page.waitForFunction(
    () =>
      document.documentElement.lang === "en" &&
      document.querySelector<HTMLAnchorElement>("#home a[download]")!,
    undefined,
  );
}

export async function selectProject(page: Page, index = 1) {
  await page.locator(`${TABS}:nth-child(${index})`).evaluate((element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const headerBottom = document
      .querySelector<HTMLElement>("header")!
      .getBoundingClientRect().bottom;
    if (rect.top < headerBottom || rect.bottom > window.innerHeight)
      element.scrollIntoView({ block: "center", behavior: "instant" });
  });
  await settleMotion(page);
  await page.locator(`${TABS}:nth-child(${index})`).click();
  await page.waitForFunction(
    (selector) =>
      document.querySelector<HTMLElement>(selector)!.getAttribute("aria-selected") ===
      "true",
    `${TABS}:nth-child(${index})`,
    {},
  );
}

export async function enterPreview(page: Page) {
  await page.evaluate(() => {
    window.history.pushState({}, "", "/resume");
    dispatchEvent(new PopStateEvent("popstate"));
  });
  await page.waitForSelector('[class*="resumePage"]');
}

export async function dragText(page: Page, selector: string) {
  await page
    .locator(selector)
    .first()
    .evaluate((element: HTMLElement) =>
      element.scrollIntoView({ block: "center", behavior: "instant" }),
    );
  await settleMotion(page);
  const selection = await page
    .locator(selector)
    .first()
    .evaluate((element: HTMLElement) => {
      window.getSelection()!.removeAllRanges();
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      let text = walker.nextNode();
      while (text && !text.textContent!.trim()) text = walker.nextNode();
      if (!text) throw new Error("Selection target has no text");
      const start = text.textContent!.search(/\S/);
      const end = Math.min(start + 8, text.textContent!.length);
      const range = document.createRange();
      range.setStart(text, start);
      range.setEnd(text, start + 1);
      const first = range.getBoundingClientRect();
      range.setStart(text, end - 1);
      range.setEnd(text, end);
      const last = range.getBoundingClientRect();
      return {
        start: { x: first.left + 0.1, y: first.top + first.height / 2 },
        end: { x: last.right - 0.1, y: last.top + last.height / 2 },
        text: text.textContent!.slice(start, end),
      };
    });
  await page.mouse.move(selection.start.x, selection.start.y);
  await page.mouse.down();
  await page.mouse.move(selection.end.x, selection.end.y, { steps: 16 });
  await page.mouse.up();
  return selection.text;
}

export async function waitForSection(page: Page, id: string) {
  await page.waitForFunction(
    (section) => {
      const element = document.getElementById(section)!;
      const top = element.getBoundingClientRect().top + window.scrollY;
      const header = document
        .querySelector<HTMLElement>("header")!
        .getBoundingClientRect().bottom;
      const destination = Math.max(
        0,
        Math.min(
          section === "home" ? 0 : top - header,
          document.documentElement.scrollHeight - window.innerHeight,
        ),
      );
      return (
        window.location.hash === `#${section}` &&
        Math.abs(window.scrollY - destination) < 2
      );
    },
    id,
    {},
  );
}
