import { type Page } from "@playwright/test";

export async function getTooltipSelector(page: Page, controlSelector: string) {
  const tooltipId = await page.waitForFunction(
    (selector) => {
      const control = document.querySelector<HTMLElement>(selector)!;
      for (const id of control?.getAttribute("aria-describedby")?.split(/\s+/) ?? []) {
        const content = document.getElementById(id)!;
        if (
          content?.matches("[data-tooltip-content]") &&
          getComputedStyle(content).visibility === "visible"
        )
          return id;
      }
      return false;
    },
    controlSelector,
    {},
  );
  try {
    return `[data-tooltip-content][id="${await tooltipId.jsonValue()}"]`;
  } finally {
    await tooltipId.dispose();
  }
}
