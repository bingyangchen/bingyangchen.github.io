import {
  dragText,
  enterPreview,
  openHome,
  selectProject,
  waitForSection,
} from "../helpers/site";
import { expectNativeContextMenu } from "../helpers/context-menu";
import { expect, test } from "../helpers/fixtures";

test("SITE-R1.1 SITE-R1.2 首頁完整內容及共用外框", async ({ page, server }) => {
  await openHome(page, server);
  await expect(page.locator("#home, #about, #projects, #blog")).toHaveCount(4);
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.locator("#home h1")).toContainText("Bing-Yang Chen");
  await expect(page.locator("[data-resume-root]")).toHaveCount(0);
});

test("SITE-R6.7 圖片語意與雙語文字", async ({ page, server }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openHome(page, server);
  for (const language of ["en", "zh-TW"]) {
    if (language === "zh-TW") await page.locator("[data-language-switcher]").click();
    await expect(page.locator("html")).toHaveAttribute("lang", language);
    const about = page.locator("#about");
    await expect(about.getByRole("article")).toHaveCount(3);
    await expect(about.getByRole("heading", { level: 2 })).toHaveCount(3);
    await expect(about.getByRole("img")).toHaveCount(4);
    await expect(about.getByRole("img").first()).toHaveAccessibleName(
      language === "en" ? /bright yellow jackets/ : /亮黃色外套/,
    );
    await expect(about.locator("a[download]")).toHaveAttribute("href", "/resume.pdf");
  }
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

test("SITE-R2.1 SITE-R2.2 連續點擊與相同 hash 不阻擋後續自然捲動", async ({
  page,
  server,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openHome(page, server);
  await page.evaluate(() => {
    document.querySelector<HTMLAnchorElement>('header a[href="#projects"]')!.click();
    document.querySelector<HTMLAnchorElement>('header a[href="#blog"]')!.click();
  });
  await waitForSection(page, "blog");
  await page.locator('header a[href="#blog"]').click();
  await waitForSection(page, "blog");
  const historyLength = await page.evaluate(() => history.length);
  await page.evaluate(() =>
    document.getElementById("about")!.scrollIntoView({ behavior: "instant" }),
  );
  await expect.poll(() => page.evaluate(() => location.hash)).toBe("#about");
  await expect.poll(() => page.evaluate(() => history.length)).toBe(historyLength);
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

test("SITE-R9.8 圓形按鈕尺寸", async ({ createContext, browserName, server }) => {
  const buttonSize = "44px";
  const circleRadius = "50%";
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 1440, height: 900 },
  ]) {
    const hasTouch = viewport.width < 1024;
    const context = await createContext({
      viewport,
      hasTouch,
      ...(browserName === "firefox" ? {} : { isMobile: hasTouch }),
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await openHome(page, server);
    for (const language of ["en", "zh-TW"]) {
      if (language === "zh-TW") {
        const menuButton = page.locator(
          'header button[aria-controls="site-navigation"]',
        );
        const hasCompactMenu = await menuButton.isVisible();
        if (hasCompactMenu) await menuButton.click();
        await page.locator("[data-language-switcher]").click();
        if (hasCompactMenu) await menuButton.click();
      }
      await expect(page.locator("html")).toHaveAttribute("lang", language);
      const opener = page.locator('#home button[aria-haspopup="dialog"]');
      await expect(opener).toBeVisible();
      await expect
        .poll(() =>
          opener.evaluate((element) => {
            const { width, height } = element.getBoundingClientRect();
            return Math.abs(width - height);
          }),
        )
        .toBeLessThan(1);
      for (const dimension of ["width", "height"]) {
        await expect(opener).toHaveCSS(dimension, buttonSize);
      }
      await expect(opener).toHaveCSS("border-radius", circleRadius);
      if (hasTouch) await opener.tap();
      else await opener.click();
      const closeButton = page.getByRole("dialog").getByRole("button");
      await expect(closeButton).toBeVisible();
      await expect(closeButton).toHaveCSS("width", buttonSize);
      await expect(closeButton).toHaveCSS("height", buttonSize);
      await expect(closeButton).toHaveCSS("border-radius", circleRadius);
      if (hasTouch) await closeButton.tap();
      else await closeButton.click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
    await context.close();
  }
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

test("SITE-R21.1 圖片右鍵與動態作品", async ({ page, server }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openHome(page, server);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const language of ["en", "zh-TW"]) {
      if ((await page.locator("html").getAttribute("lang")) !== language)
        await page
          .locator("[data-language-switcher]")
          .evaluate((button: HTMLElement) => button.click());
      await expect(page.locator("html")).toHaveAttribute("lang", language);
      for (const selector of [
        "header img",
        "#home button[aria-pressed] img:first-child",
        "#home [data-brand-image]",
        '#about [data-photo="street"] img',
        '#about [data-photo="architecture"] img',
        '#about [data-photo="coast"] img',
        '#about [data-photo="passage"] img',
        "footer img",
      ])
        await expectNativeContextMenu(page.locator(selector), true);
      for (const index of [1, 2, 3]) {
        await selectProject(page, index);
        await expectNativeContextMenu(
          page
            .getByRole("tab")
            .nth(index - 1)
            .locator("img"),
          true,
        );
        const artwork = page.locator(
          '[role="tabpanel"]:not([inert]) [data-artwork-image]:visible',
        );
        await expect(artwork.first()).toBeVisible();
        for (const image of await artwork.all())
          await expectNativeContextMenu(image, true);
      }
      const results = await page.locator("img").evaluateAll((images) =>
        images.map((image) => {
          const event = new MouseEvent("contextmenu", {
            bubbles: true,
            cancelable: true,
          });
          image.dispatchEvent(event);
          return {
            canceled: event.defaultPrevented,
            selection: getComputedStyle(image).userSelect,
          };
        }),
      );
      expect(results.length).toBeGreaterThan(10);
      expect(
        results.every(({ canceled, selection }) => canceled && selection === "none"),
      ).toBe(true);
    }
  }
});

test("SITE-R21.2 SVG 子節點與 QR Code Portal", async ({ page, server }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openHome(page, server);
  for (const language of ["en", "zh-TW"]) {
    if (language === "zh-TW") await page.locator("[data-language-switcher]").click();
    await expectNativeContextMenu(
      page.locator('#home button[aria-haspopup="dialog"] svg'),
      true,
    );
    for (let opening = 0; opening < 2; opening++) {
      await page.locator('#home button[aria-haspopup="dialog"]').click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expectNativeContextMenu(page.locator("dialog svg").last(), true);
      const results = await page
        .locator("dialog svg, dialog svg path")
        .evaluateAll((elements) =>
          elements.map((element) => {
            const event = new MouseEvent("contextmenu", {
              bubbles: true,
              cancelable: true,
            });
            element.dispatchEvent(event);
            return event.defaultPrevented;
          }),
        );
      expect(results.length).toBeGreaterThan(2);
      expect(results.every(Boolean)).toBe(true);
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
    const styles = await page
      .locator("img, svg")
      .evaluateAll((images) =>
        images.map((image) => ({
          selection: getComputedStyle(image).userSelect,
          callout: getComputedStyle(image).getPropertyValue("-webkit-touch-callout"),
          supportsCallout: CSS.supports("-webkit-touch-callout", "none"),
        })),
      );
    expect(
      styles.every(
        ({ selection, callout, supportsCallout }) =>
          selection === "none" && (!supportsCallout || callout === "none"),
      ),
    ).toBe(true);
  }
});

test("SITE-R21.4 圖片規則保留觸控及鍵盤操作", async ({
  createContext,
  browserName,
  server,
}) => {
  const context = await createContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await openHome(page, server);
  for (const language of ["en", "zh-TW"]) {
    if (language === "zh-TW") {
      await page.locator('header button[aria-controls="site-navigation"]').tap();
      await page.locator("[data-language-switcher]").tap();
      await page.locator('header button[aria-controls="site-navigation"]').tap();
    }
    const portrait = page.locator("#home button[aria-pressed]");
    await portrait.tap();
    await expect(portrait).toHaveAttribute("aria-pressed", "true");
    await portrait.focus();
    await expect(portrait).toBeFocused();
    await portrait.press("Space");
    await expect(portrait).toHaveAttribute("aria-pressed", "false");
    const opener = page.locator('#home button[aria-haspopup="dialog"]');
    await opener.tap();
    await page.getByRole("dialog").getByRole("button").tap();
    await expect(opener).toBeFocused();
    await selectProject(page, 2);
    await page.getByRole("tab").nth(1).focus();
    await page.keyboard.press("End");
    await expect(page.getByRole("tab").last()).toHaveAttribute("aria-selected", "true");
    for (const target of [
      page.locator('#about [data-photo="street"] img'),
      page.locator('[role="tabpanel"]:not([inert]) [data-artwork-image]').first(),
    ]) {
      const canceled = await target.evaluate((image) =>
        ["touchstart", "pointerdown", "touchmove", "pointermove"].map((type) => {
          const event = new Event(type, { bubbles: true, cancelable: true });
          image.dispatchEvent(event);
          return event.defaultPrevented;
        }),
      );
      expect(canceled).toEqual([false, false, false, false]);
      if (browserName === "chromium") {
        await target.scrollIntoViewIfNeeded();
        const before = await page.evaluate(() => scrollY);
        const session = await context.newCDPSession(page);
        try {
          const bounds = (await target.boundingBox())!;
          const start = Math.min(bounds.y + bounds.height / 2, 700);
          await session.send("Input.dispatchTouchEvent", {
            type: "touchStart",
            touchPoints: [{ x: bounds.x + bounds.width / 2, y: start }],
          });
          for (let step = 1; step <= 6; step++)
            await session.send("Input.dispatchTouchEvent", {
              type: "touchMove",
              touchPoints: [{ x: bounds.x + bounds.width / 2, y: start - step * 30 }],
            });

          // A tap during the remaining fling stops scrolling instead of activating its target.
          await page.evaluate(() => {
            delete document.documentElement.dataset.testScrollEnded;
            document.addEventListener(
              "scrollend",
              () => {
                document.documentElement.dataset.testScrollEnded = "";
              },
              { once: true },
            );
          });
          await session.send("Input.dispatchTouchEvent", {
            type: "touchEnd",
            touchPoints: [],
          });
          await expect(page.locator("html")).toHaveAttribute(
            "data-test-scroll-ended",
            "",
          );
        } finally {
          await session.detach();
        }
        await expect
          .poll(() => page.evaluate(() => scrollY))
          .toBeGreaterThan(before + 50);
      }
    }
    await page.locator("header img").tap();
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    await page.locator("footer img").tap();
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  }
  await context.close();
});

test("SITE-R21.5 圖片以外保留原生選單與文字選取", async ({ page, server }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openHome(page, server);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const language of ["en", "zh-TW"]) {
      if ((await page.locator("html").getAttribute("lang")) !== language)
        await page
          .locator("[data-language-switcher]")
          .evaluate((button: HTMLElement) => button.click());
      for (const selector of [
        "#about [data-chapter] p",
        'footer a[href^="mailto:"] > span:first-child',
        '#blog [class*="featuredCopy"] p',
        '#blog [class*="reading"] p',
      ]) {
        await expectNativeContextMenu(page.locator(selector).first(), false);
      }
      const text = await dragText(page, "#about [data-chapter] p");
      expect(await page.evaluate(() => getSelection()!.toString())).toContain(text);
      const email = page.locator('#home [class*="email_link"] span');
      await email.click();
      expect(await page.evaluate(() => getSelection()!.toString())).toBe(
        await email.innerText(),
      );
      await expectNativeContextMenu(email, false);
      await expectNativeContextMenu(page.locator('#home a[href="#projects"]'), false);
    }
  }
});

test("SITE-R21.6 靜態圖片與非公開預覽", async ({ page, createContext, server }) => {
  const context = await createContext({
    javaScriptEnabled: false,
    reducedMotion: "reduce",
  });
  const staticPage = await context.newPage();
  await staticPage.goto(server.origin);
  await expect(staticPage.locator("#about [data-photo] img")).toHaveCount(4);
  await expect(staticPage.locator("#home a[download]")).toHaveAttribute(
    "href",
    "/resume.pdf",
  );
  await context.close();
  await openHome(page, server);
  await enterPreview(page);
  await expect(page.locator("[data-resume-root]")).toBeVisible();
  await expectNativeContextMenu(page.locator("header img"), true);
  await expectNativeContextMenu(page.locator("footer img"), true);
  await expectNativeContextMenu(page.locator("[data-resume-root] svg").first(), true);
});
