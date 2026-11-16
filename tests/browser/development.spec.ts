import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { expect, test } from "../helpers/fixtures";

test("開發模式首頁與履歷不產生 console 警告或錯誤", async ({ page, pageResources }) => {
  // Production React omits development diagnostics, so this must load the dev server.
  const developmentServer = await createServer({
    root: fileURLToPath(new URL("../../", import.meta.url)),
    logLevel: "error",
    server: { host: "127.0.0.1", port: 0 },
  });
  const diagnostics: string[] = [];
  page.on("console", (message) => {
    if (["warning", "error"].includes(message.type()))
      diagnostics.push(`[${message.type()}] ${message.text()}`);
  });
  try {
    await developmentServer.listen();
    const address = developmentServer.httpServer?.address();
    assert.ok(address && typeof address === "object");
    const origin = `http://127.0.0.1:${address.port}`;

    await page.goto(origin, { waitUntil: "networkidle" });
    await expect(page.locator("#home h1")).toContainText("Bing-Yang Chen");
    await expect(page.locator("#home img[fetchpriority]")).toHaveAttribute(
      "fetchpriority",
      "high",
    );
    await page.getByRole("button", { name: "Flip portrait", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Flip portrait", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Show QR code", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.locator("[data-language-switcher]").click();
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-TW");
    await pageResources.assertLoaded();

    await page.goto(`${origin}/resume`, { waitUntil: "networkidle" });
    await expect(page.locator("[data-resume-root]")).toBeVisible();
    await pageResources.assertLoaded();
    expect(diagnostics).toEqual([]);
  } finally {
    await developmentServer.close();
  }
});
