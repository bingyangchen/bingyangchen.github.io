import { openHome } from "../helpers/site";
import { getControlAccessibility } from "../helpers/accessibility";
import { getTooltipSelector } from "../helpers/tooltip";
import assert from "node:assert/strict";
import { test } from "../helpers/fixtures";

const QR = '#home button[aria-haspopup="dialog"]';

const QR_DIALOG = 'dialog[aria-labelledby="qr-modal-title"]';

const TOOLTIP = "[data-tooltip-content]";

const TOOLTIP_CONTROLS = [
  'header a[href="#home"]',
  "[data-language-switcher]",
  QR,
  ...["github.com", "linkedin.com", "cake.me"].map(
    (domain) => `#home a[href*="${domain}"]`,
  ),
];

test("SITE-R2.5 SITE-R6.6 SITE-R19.4 Footer 原生連結及鍵盤操作", async ({
  page,
  server,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openHome(page, server);
  for (const language of ["en", "zh-TW"]) {
    if (language === "zh-TW") await page.locator("[data-language-switcher]").click();
    const email = 'footer a[href="mailto:bryan.chen.429@gmail.com"]';
    const home = 'footer a[href="/#home"]';
    await page.locator(email).focus();
    const destinations = [
      "https://github.com/bingyangchen",
      "https://www.linkedin.com/in/bing-yang-chen/",
      "https://www.cake.me/me/BingYangChen",
      "/#home",
    ];
    for (const href of destinations) {
      await page.keyboard.press("Tab");
      assert.equal(
        await page.evaluate(() =>
          (document.activeElement as HTMLElement).getAttribute("href"),
        ),
        href,
      );
      assert.equal(await page.$(TOOLTIP), null);
      assert.equal(
        await page.evaluate(
          () =>
            (document.activeElement as HTMLElement).hasAttribute("title") ||
            (document.activeElement as HTMLElement).hasAttribute("aria-describedby"),
        ),
        false,
      );
    }
    const position = await page.evaluate(() => scrollY);
    // Cancel new-tab creation while still letting any page click handlers run.
    await page.locator(home).evaluate((anchor: HTMLElement) => {
      for (const modifier of ["metaKey", "ctrlKey", "shiftKey"]) {
        anchor.addEventListener("click", (event) => event.preventDefault(), {
          once: true,
        });
        anchor.dispatchEvent(
          new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            [modifier]: true,
          }),
        );
      }
    });
    assert.equal(await page.evaluate(() => scrollY), position);
    await page.locator(home).click();
    await page.waitForFunction(
      () => scrollY < 2 && location.hash === "#home",
      undefined,
    );
  }
});

test("SITE-R19.1 共用提示", async ({ page, server }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [1440, 1024, 721, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => localStorage.setItem("preferred_language", "en"));
    await openHome(page, server);
    for (const language of ["en", "zh-TW"]) {
      if (language === "zh-TW") {
        await page.evaluate(() =>
          document.querySelector<HTMLElement>("[data-language-switcher]")!.click(),
        );
      }
      assert.equal(await page.$("[title]"), null, "no native HTML tooltips");
      let sharedAppearance;
      for (const selector of TOOLTIP_CONTROLS) {
        if (selector === "[data-language-switcher]" && width <= 720) {
          await page.locator('header button[aria-controls="site-navigation"]').click();
        }
        await page
          .locator(selector)
          .evaluate((control: HTMLElement) =>
            control.scrollIntoView({ block: "center", behavior: "instant" }),
          );
        const destination = await page
          .locator(selector)
          .evaluate((control: HTMLElement) => control.getAttribute("href"));
        const accessibility = await getControlAccessibility(page, selector);
        await page.locator(selector).hover();
        const tooltip = await getTooltipSelector(page, selector);
        const appearance = await page
          .locator(tooltip)
          .evaluate((content: HTMLElement) => {
            const style = getComputedStyle(content);
            const bounds = content.getBoundingClientRect();
            if (style.display === "none") throw new Error("Tooltip is hidden");
            if (
              bounds.left < 0 ||
              bounds.right > window.innerWidth ||
              bounds.top < 0 ||
              bounds.bottom > window.innerHeight
            )
              throw new Error(
                `${content.textContent!} extends outside ${window.innerWidth}px viewport: ${bounds.left} to ${bounds.right}`,
              );
            let ancestor = content.parentElement;
            while (ancestor) {
              const ancestorStyle = getComputedStyle(ancestor);
              const ancestorBounds = ancestor.getBoundingClientRect();
              if (
                /(hidden|auto|scroll|clip)/.test(ancestorStyle.overflowY) &&
                (bounds.top < ancestorBounds.top ||
                  bounds.bottom > ancestorBounds.bottom)
              )
                throw new Error("Tooltip is clipped vertically");
              ancestor = ancestor.parentElement;
            }
            return {
              background: style.backgroundColor,
              color: style.color,
              radius: style.borderRadius,
              font: style.font,
              padding: style.padding,
              opacity: style.opacity,
            };
          });
        if (!sharedAppearance) sharedAppearance = appearance;
        assert.deepEqual(appearance, sharedAppearance, `${width}px ${selector}`);
        assert.deepEqual(
          await getControlAccessibility(page, selector),
          accessibility,
          "visual hints preserve the accessible name and description",
        );
        if (selector === "[data-language-switcher]" || selector === QR) {
          assert.equal(
            await page
              .locator(selector)
              .evaluate((control: HTMLElement) => control.getAttribute("aria-label")),
            await page
              .locator(tooltip)
              .evaluate((content: HTMLElement) => content.textContent!),
          );
        }
        await page.mouse.move(width - 1, 899, { steps: 12 });
        await page
          .locator(selector)
          .evaluate((control: HTMLElement) => control.focus({ preventScroll: true }));
        await page.keyboard.down("Shift");
        await page.keyboard.press("Tab");
        await page.keyboard.up("Shift");
        await page.keyboard.press("Tab");
        await getTooltipSelector(page, selector);
        assert.deepEqual(await getControlAccessibility(page, selector), accessibility);
        await page.keyboard.down("Shift");
        await page.keyboard.press("Tab");
        await page.keyboard.up("Shift");
        await page.waitForSelector(tooltip, { state: "hidden" });
        assert.equal(
          await page
            .locator(selector)
            .evaluate((control: HTMLElement) => control.getAttribute("href")),
          destination,
        );
        if (selector === "[data-language-switcher]" && width <= 720) {
          await page.locator('header button[aria-controls="site-navigation"]').click();
        }
      }
    }
  }
});

test("SITE-R19.2 Escape 關閉提示", async ({ page, server }) => {
  await page.addInitScript(() => localStorage.setItem("preferred_language", "en"));
  const selector = '#home a[href*="github.com"]';
  for (const motion of ["no-preference", "reduce"] as const) {
    await page.emulateMedia({ reducedMotion: motion });
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await openHome(page, server);
      for (const language of ["en", "zh-TW"]) {
        if (language === "zh-TW")
          await page.evaluate(() =>
            document.querySelector<HTMLElement>("[data-language-switcher]")!.click(),
          );
        await page.locator(selector).hover();
        const tooltip = await getTooltipSelector(page, selector);
        const focusedBeforeHover = await page.evaluateHandle(
          () => document.activeElement as HTMLElement,
        );
        await page.keyboard.press("Escape");
        await page.waitForSelector(tooltip, { state: "hidden" });
        assert.equal(
          await page.evaluate(
            (before) => (document.activeElement as HTMLElement) === before,
            focusedBeforeHover,
          ),
          true,
        );
        await focusedBeforeHover.dispose();
        const bounds = await page
          .locator(selector)
          .evaluate((control: HTMLElement) => control.getBoundingClientRect().toJSON());
        await page.mouse.move(
          bounds.x + bounds.width / 2 + 1,
          bounds.y + bounds.height / 2,
        );
        assert.equal(
          await page.$(tooltip),
          null,
          "moving within a dismissed trigger does not reopen it",
        );
        await page.mouse.move(width - 1, 899, { steps: 12 });
        await page.locator(selector).hover();
        await getTooltipSelector(page, selector);
        await page.mouse.move(width - 1, 899, { steps: 12 });
        await page.waitForSelector(tooltip, { state: "hidden" });
        await page
          .locator(selector)
          .evaluate((control: HTMLElement) => control.focus({ preventScroll: true }));
        await getTooltipSelector(page, selector);
        await page.locator(selector).hover();
        await page.mouse.move(width - 1, 899, { steps: 12 });
        await page.evaluate(
          () =>
            new Promise((resolveFrame) =>
              requestAnimationFrame(() => requestAnimationFrame(resolveFrame)),
            ),
        );
        assert.ok(
          await page.$(tooltip),
          "keyboard focus keeps the hint open after pointer departure",
        );
        await page.keyboard.press("Escape");
        await page.waitForSelector(tooltip, { state: "hidden" });
        assert.equal(
          await page
            .locator(selector)
            .evaluate(
              (control: HTMLElement) =>
                (document.activeElement as HTMLElement) === control,
            ),
          true,
        );
        await page.locator(selector).hover();
        await getTooltipSelector(page, selector);
        await page.mouse.move(width - 1, 899, { steps: 12 });
        await page.evaluate(
          () =>
            new Promise((resolveFrame) =>
              requestAnimationFrame(() => requestAnimationFrame(resolveFrame)),
            ),
        );
        assert.ok(
          await page.$(tooltip),
          "re-entering after Escape restores the focused hint",
        );
        await page.keyboard.press("Escape");
        await page.keyboard.press("Tab");
        await page.keyboard.down("Shift");
        await page.keyboard.press("Tab");
        await page.keyboard.up("Shift");
        await getTooltipSelector(page, selector);
        assert.equal(
          await page
            .locator(selector)
            .evaluate(
              (control: HTMLElement) =>
                (document.activeElement as HTMLElement) === control,
            ),
          true,
        );
        await page.keyboard.press("Escape");
        await page.locator(selector).evaluate((control: HTMLElement) => control.blur());
      }
    }
  }
});

test("SITE-R2.8 SITE-R19.2 Escape 先關閉提示再關閉窄版選單", async ({
  page,
  server,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openHome(page, server);
  const menu = 'header button[aria-controls="site-navigation"]';
  const language = "[data-language-switcher]";
  for (const languageCode of ["en", "zh-TW"]) {
    if (languageCode === "zh-TW")
      await page.evaluate(() =>
        document.querySelector<HTMLElement>("[data-language-switcher]")!.click(),
      );
    await page.locator(menu).click();
    await page.locator(language).evaluate((control: HTMLElement) => control.focus());
    const tooltip = await getTooltipSelector(page, language);
    await page.keyboard.press("Escape");
    await page.waitForSelector(tooltip, { state: "hidden" });
    assert.equal(
      await page
        .locator(menu)
        .evaluate((control: HTMLElement) => control.getAttribute("aria-expanded")),
      "true",
    );
    assert.equal(
      await page
        .locator(language)
        .evaluate(
          (control: HTMLElement) => (document.activeElement as HTMLElement) === control,
        ),
      true,
    );
    await page.keyboard.press("Escape");
    assert.equal(
      await page
        .locator(menu)
        .evaluate((control: HTMLElement) => control.getAttribute("aria-expanded")),
      "false",
    );
    assert.equal(
      await page
        .locator(menu)
        .evaluate(
          (control: HTMLElement) => (document.activeElement as HTMLElement) === control,
        ),
      true,
    );
  }
});

test("SITE-R19.3 游標移入提示", async ({ page, server }) => {
  await page.addInitScript(() => localStorage.setItem("preferred_language", "en"));
  for (const motion of ["no-preference", "reduce"] as const) {
    await page.emulateMedia({ reducedMotion: motion });
    for (const width of [1440, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await openHome(page, server);
      for (const language of ["en", "zh-TW"]) {
        if (language === "zh-TW")
          await page.evaluate(() =>
            document.querySelector<HTMLElement>("[data-language-switcher]")!.click(),
          );
        for (const selector of TOOLTIP_CONTROLS) {
          if (selector === "[data-language-switcher]" && width <= 720)
            await page
              .locator('header button[aria-controls="site-navigation"]')
              .click();
          await page
            .locator(selector)
            .evaluate((control: HTMLElement) =>
              control.scrollIntoView({ block: "center", behavior: "instant" }),
            );
          await page.locator(selector).hover();
          const tooltip = await getTooltipSelector(page, selector);
          const bounds = await page
            .locator(tooltip)
            .evaluate((content: HTMLElement) =>
              content.getBoundingClientRect().toJSON(),
            );
          const focusedBeforeHover = await page.evaluateHandle(
            () => document.activeElement as HTMLElement,
          );
          await page.mouse.move(
            bounds.x + bounds.width / 2,
            bounds.y + bounds.height / 2,
            { steps: 12 },
          );
          await page.evaluate(
            () =>
              new Promise((resolveFrame) =>
                requestAnimationFrame(() => requestAnimationFrame(resolveFrame)),
              ),
          );
          assert.equal(
            await page
              .locator(tooltip)
              .evaluate((content: HTMLElement) =>
                content.contains(
                  document.elementFromPoint(
                    content.getBoundingClientRect().x + content.clientWidth / 2,
                    content.getBoundingClientRect().y + content.clientHeight / 2,
                  ),
                ),
              ),
            true,
          );
          assert.equal(
            await page.evaluate(
              (before) => (document.activeElement as HTMLElement) === before,
              focusedBeforeHover,
            ),
            true,
          );
          await focusedBeforeHover.dispose();
          await page.mouse.move(width - 1, 899, { steps: 12 });
          await page.waitForSelector(tooltip, { state: "hidden" });
          if (selector === "[data-language-switcher]" && width <= 720)
            await page
              .locator('header button[aria-controls="site-navigation"]')
              .click();
        }
      }
    }
  }
});

test("SITE-R19.3 提示與 QR code dialog 隔離", async ({ page, server }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openHome(page, server);
  await page
    .locator(QR)
    .evaluate((control: HTMLElement) =>
      control.scrollIntoView({ block: "center", behavior: "instant" }),
    );
  await page.locator(QR).hover();
  const qrTooltip = await getTooltipSelector(page, QR);
  await page.locator(QR).click();
  await page.waitForSelector(`${QR_DIALOG}[open]`);
  await page.waitForSelector(qrTooltip, { state: "hidden" });
  // Move over background coordinates while the native dialog intercepts pointer input.
  await page.locator('header a[href="#home"]').hover({ force: true });
  assert.equal(
    await page.$(TOOLTIP),
    null,
    "background hints stay closed behind a modal dialog",
  );
  await page.keyboard.press("Escape");
  await page.waitForSelector(QR_DIALOG, { state: "hidden" });
  assert.equal(
    await page
      .locator(QR)
      .evaluate(
        (control: HTMLElement) => (document.activeElement as HTMLElement) === control,
      ),
    true,
  );
  await getTooltipSelector(page, QR);
  await page.keyboard.press("Escape");
  await page.waitForSelector(qrTooltip, { state: "hidden" });
  assert.equal(
    await page
      .locator(QR)
      .evaluate(
        (control: HTMLElement) => (document.activeElement as HTMLElement) === control,
      ),
    true,
  );
});
