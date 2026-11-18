import { type Locator } from "@playwright/test";
import { expect } from "./fixtures";

export async function expectNativeContextMenu(target: Locator, canceled: boolean) {
  const page = target.page();
  await page.evaluate(() => {
    delete document.documentElement.dataset.contextMenuCanceled;
    document.addEventListener(
      "contextmenu",
      (event) => {
        document.documentElement.dataset.contextMenuCanceled = String(
          event.defaultPrevented,
        );
      },
      { once: true },
    );
  });
  await target.click({ button: "right" });
  await expect(page.locator("html")).toHaveAttribute(
    "data-context-menu-canceled",
    String(canceled),
  );
  if (!canceled) await page.keyboard.press("Escape");
}
