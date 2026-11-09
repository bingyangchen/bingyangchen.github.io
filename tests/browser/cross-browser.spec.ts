import { openHome, waitForSection } from "../helpers/site";
import { expect, test } from "../helpers/fixtures";

test("SITE-R1.1 SITE-R1.2 首頁完整內容及共用外框", async ({ page, server }) => {
  await openHome(page, server);
  await expect(page.locator("#home, #about, #projects, #blog")).toHaveCount(4);
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.locator("#home h1")).toContainText("Bing-Yang Chen");
  await expect(page.locator("[data-resume-root]")).toHaveCount(0);
});

test("SITE-R4.1 SITE-R4.2 語言切換及重載持久化", async ({ page, server }) => {
  await openHome(page, server);
  await page
    .getByRole("button", { name: "Switch to Traditional Chinese", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-TW");
  await expect(page.locator("#home h1")).toContainText("陳秉洋");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-TW");
  await page.locator("[data-language-switcher]").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("SITE-R2.1 SITE-R2.3 Anchor 導覽及返回前進", async ({ page, server }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openHome(page, server);
  const initialLength = await page.evaluate(() => history.length);
  await page
    .getByRole("banner")
    .getByRole("link", { name: "Projects", exact: true })
    .click();
  await waitForSection(page, "projects");
  await page
    .getByRole("banner")
    .getByRole("link", { name: "Blog", exact: true })
    .click();
  await waitForSection(page, "blog");
  await expect.poll(() => page.evaluate(() => history.length)).toBe(initialLength + 2);
  await page.goBack();
  await waitForSection(page, "projects");
  await page.goForward();
  await waitForSection(page, "blog");
});

test("SITE-R2.4 Hash 直達與重載保留閱讀位置", async ({ page, server }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openHome(page, server, "#about");
  await waitForSection(page, "about");
  await page.evaluate(() => scrollBy({ top: 180, behavior: "instant" }));
  const position = await page.evaluate(() => scrollY);
  await expect
    .poll(() => page.evaluate(() => history.state?.siteScrollPosition?.top))
    .toBeCloseTo(position, 0);
  await page.reload();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(position, 0);
  await expect(
    page.getByRole("banner").locator('[aria-current="location"]'),
  ).toHaveAttribute("href", "#about");
});

test("SITE-R7.8 原生分頁鍵盤操作與焦點", async ({ page, server }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openHome(page, server, "#projects");
  const tabs = page.getByRole("tablist").getByRole("tab");
  await tabs.first().focus();
  await page.keyboard.press("End");
  await expect(tabs.last()).toBeFocused();
  await expect(tabs.last()).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toHaveCount(1);
  await page.keyboard.press("Home");
  await expect(tabs.first()).toBeFocused();
  await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
});

test("SITE-R9.1 SITE-R9.2 SITE-R9.3 SITE-R9.4 Dialog 鍵盤開關及焦點還原", async ({
  page,
  server,
}) => {
  await openHome(page, server);
  const opener = page.locator('#home button[aria-haspopup="dialog"]');
  await opener.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Bing-Yang Chen", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAccessibleDescription("Scan to connect");
  await expect(
    dialog.getByRole("button", { name: "Close QR code", exact: true }),
  ).toBeFocused();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});

test("SITE-R13.3 Reduced Motion 初始與即時切換", async ({ page, server }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openHome(page, server, "#projects");
  await expect(page.locator("[data-scroll-motion-active]")).toHaveCount(0);
  await expect(page.locator('#projects > [data-scroll-motion="content"]')).toHaveCSS(
    "opacity",
    "1",
  );
  await expect(page.locator("#home h1")).toBeAttached();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("[data-scroll-motion-active]").first()).toBeAttached();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("[data-scroll-motion-active]")).toHaveCount(0);
  await expect(page.locator('#projects > [data-scroll-motion="content"]')).toHaveCSS(
    "transform",
    "none",
  );
});
