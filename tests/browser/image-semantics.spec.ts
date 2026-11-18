import assert from "node:assert/strict";
import { type Page } from "@playwright/test";
import { getControlAccessibility } from "../helpers/accessibility";
import { test, expect } from "../helpers/fixtures";
import { watchPageResources } from "../helpers/resources";
import { openHome } from "../helpers/site";

async function getAccessibleContent(page: Page) {
  const session = await page.context().newCDPSession(page);
  try {
    const { root } = await session.send("DOM.getDocument");
    const { nodeId } = await session.send("DOM.querySelector", {
      nodeId: root.nodeId,
      selector: "#about",
    });
    const { nodes } = await session.send("Accessibility.queryAXTree", { nodeId });
    return nodes
      .filter((node) => !node.ignored)
      .map((node) => ({ role: node.role?.value, name: node.name?.value }));
  } finally {
    await session.detach();
  }
}

async function assertDecorativeIconsHidden(page: Page) {
  const session = await page.context().newCDPSession(page);
  try {
    const { root } = await session.send("DOM.getDocument");
    const { nodeIds } = await session.send("DOM.querySelectorAll", {
      nodeId: root.nodeId,
      selector: "#root svg, dialog button svg",
    });
    assert.ok(nodeIds.length > 0);
    for (const nodeId of nodeIds) {
      const { nodes } = await session.send("Accessibility.getPartialAXTree", {
        nodeId,
        fetchRelatives: false,
      });
      assert.ok(
        nodes.every((node) => node.ignored),
        JSON.stringify(nodes),
      );
    }
  } finally {
    await session.detach();
  }
}

test("SITE-R6.7 雙語圖片不重複加入資訊並保留文字閱讀順序", async ({ page, server }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openHome(page, server);
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [language, labels] of [
      [
        "en",
        { open: "Show QR code", close: "Close QR code", portrait: "Flip portrait" },
      ],
      ["zh-TW", { open: "顯示 QR code", close: "關閉 QR code", portrait: "翻轉頭像" }],
    ] as const) {
      if ((await page.locator("html").getAttribute("lang")) !== language)
        await page
          .locator("[data-language-switcher]")
          .evaluate((button: HTMLElement) => button.click());
      await expect(page.locator("html")).toHaveAttribute("lang", language);
      const content = await getAccessibleContent(page);
      const about = page.locator("#about");
      const questions = await about.locator("h2").allTextContents();
      const alternatives = await about
        .locator("[data-photo] img")
        .evaluateAll((images: HTMLImageElement[]) => images.map((image) => image.alt));
      assert.equal(questions.length, 3);
      assert.equal(alternatives.length, 4);
      assert.ok(content.every(({ role, name }) => role !== "article" || !name));
      assert.deepEqual(
        content.filter(({ role }) => role === "heading" || role === "image"),
        [
          ...questions.map((question) => ({ role: "heading", name: question })),
          ...alternatives.map((alternative) => ({ role: "image", name: alternative })),
        ],
      );
      for (const alternative of alternatives)
        assert.ok(
          !content.some(
            ({ role, name }) => role === "StaticText" && name === alternative,
          ),
        );
      assert.deepEqual(
        await getControlAccessibility(page, '#home button[aria-haspopup="dialog"]'),
        { role: "button", name: labels.open, description: undefined },
      );
      await page.getByRole("button", { name: labels.open, exact: true }).focus();
      await page.keyboard.press("Enter");
      const close = page.getByRole("button", { name: labels.close, exact: true });
      await expect(close).toBeFocused();
      await assertDecorativeIconsHidden(page);
      assert.deepEqual(await getControlAccessibility(page, "dialog button"), {
        role: "button",
        name: labels.close,
        description: undefined,
      });
      await expect(page.locator("dialog svg").last()).toBeVisible();
      await page.keyboard.press("Escape");
      await assertDecorativeIconsHidden(page);
      await expect(
        page.getByRole("button", { name: labels.open, exact: true }),
      ).toBeFocused();
      await expect(
        page
          .getByRole("button", { name: labels.portrait, exact: true })
          .getByRole("img"),
      ).toHaveCount(2);
    }
  }
});

test("SITE-R6.7 圖片載入失敗後仍保留同一份可讀資訊", async ({
  server,
  createContext,
}) => {
  const context = await createContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  const resources = await watchPageResources(page);
  try {
    await openHome(page, server);
    await resources.assertLoaded();
  } finally {
    await resources.stop();
  }
  const englishContent = await getAccessibleContent(page);
  await page.locator("[data-language-switcher]").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-TW");
  const chineseContent = await getAccessibleContent(page);
  await page.locator("#about img").evaluateAll(async (images: HTMLImageElement[]) => {
    await Promise.all(
      images.map(async (image) => {
        image.removeAttribute("srcset");
        image.src = "data:image/png;base64,AA==";
        await image.decode().then(
          () => {
            throw new Error("invalid image decoded");
          },
          () => undefined,
        );
      }),
    );
  });
  assert.deepEqual(await getAccessibleContent(page), chineseContent);
  await page.locator("[data-language-switcher]").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  assert.deepEqual(await getAccessibleContent(page), englishContent);
});
