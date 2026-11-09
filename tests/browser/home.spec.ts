import { openHome } from "../helpers/site";
import assert from "node:assert/strict";
import { test } from "../helpers/fixtures";

const DETAIL = '#projects [role="tabpanel"]:not([inert])';

const TABS = '#projects [role="tab"]';

test("SITE-R1.1 SITE-R1.2 SITE-R7.1 公開首頁與初始作品", async ({ page, server }) => {
  await openHome(page, server);
  assert.deepEqual(
    await page
      .locator("#home,#about,#projects,#blog")
      .evaluateAll((elements: HTMLElement[]) => elements.map((element) => element.id)),
    ["home", "about", "projects", "blog"],
  );
  assert.equal(
    await page
      .locator(".site-layout > header,.site-layout > footer")
      .evaluateAll((elements: HTMLElement[]) => elements.length),
    2,
  );
  assert.deepEqual(
    await page
      .locator(TABS)
      .evaluateAll((elements: HTMLElement[]) =>
        elements.map((element) => element.textContent!),
      ),
    ["Taigu", "Noads", "Leechai"],
  );
  assert.equal(
    await page
      .locator(`${DETAIL} h3`)
      .evaluate((element: HTMLElement) => element.textContent!),
    "Taigu",
  );
});

test("SITE-R1.3 非公開履歷與未知路徑不使用 SPA fallback", async ({ page, server }) => {
  for (const path of ["/resume", "/resume/", "/missing"])
    assert.equal((await fetch(server.origin + path)).status, 404);
  await openHome(page, server);
  assert.equal(await page.$('a[href="/resume"]'), null);
});

test("SITE-R12.9 Footer 操作尺寸、排列及文字放大", async ({ page, server }) => {
  test.setTimeout(45000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openHome(page, server);
  for (const language of ["en", "zh-TW"]) {
    await page.setViewportSize({ width: 1440, height: 900 });
    if (language === "zh-TW") await page.locator("[data-language-switcher]").click();
    for (const width of [320, 390, 512, 513, 720, 721, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const dimensions = await page
        .locator("footer")
        .evaluate((footer: HTMLElement) => {
          const links = [...footer.querySelectorAll<HTMLAnchorElement>("a")].map(
            (element) => element.getBoundingClientRect().toJSON(),
          );
          const contact = footer
            .querySelector<HTMLElement>("h2")!
            .getBoundingClientRect();
          const platforms = footer
            .querySelector<HTMLElement>("nav")!
            .getBoundingClientRect();
          const identity = footer
            .querySelector<HTMLAnchorElement>('a[href="/#home"]')!
            .getBoundingClientRect();
          const copyright = footer
            .querySelector<HTMLElement>("p:last-child")!
            .getBoundingClientRect();
          return {
            links,
            contact: contact.toJSON(),
            platforms: platforms.toJSON(),
            identity: identity.toJSON(),
            copyright: copyright.toJSON(),
            width: footer.clientWidth,
            contentWidth: footer.scrollWidth,
          };
        });
      assert.equal(dimensions.links.length, 5);
      assert.ok(
        dimensions.links.every(
          (rect) => rect.height >= 44 && rect.left >= 0 && rect.right <= width,
        ),
      );
      assert.equal(dimensions.width, dimensions.contentWidth);
      assert.ok(
        width <= 720
          ? dimensions.platforms.top > dimensions.contact.bottom
          : dimensions.platforms.left > dimensions.contact.right,
      );
      if (width <= 512)
        assert.ok(dimensions.copyright.top >= dimensions.identity.bottom);
      // Focus the first link so Tab stays inside the page across viewport checks.
      await page.locator('footer a[href^="mailto:"]').focus();
      await page.keyboard.press("Tab");
      for (const link of await page.$$("footer a")) {
        await link.focus();
        const focus = await link.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          const outset =
            parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
          return {
            name: element.textContent!,
            visible: element.matches(":focus-visible"),
            outlineWidth: style.outlineWidth,
            outset,
            left: rect.left,
            right: rect.right,
            viewportWidth: innerWidth,
          };
        });
        assert.ok(
          focus.visible &&
            focus.outlineWidth === "2px" &&
            focus.left >= focus.outset &&
            focus.right + focus.outset <= focus.viewportWidth,
          JSON.stringify({ language, width, focus }),
        );
      }
      await page.locator("html").evaluate((element: HTMLElement) => {
        element.style.fontSize = "200%";
      });
      assert.equal(
        await page
          .locator("footer")
          .evaluate(
            (footer: HTMLElement) =>
              footer.scrollWidth === footer.clientWidth &&
              [...footer.querySelectorAll<HTMLAnchorElement>("a")].every(
                (element) => element.getBoundingClientRect().right <= innerWidth,
              ),
          ),
        true,
      );
      await page.locator("html").evaluate((element: HTMLElement) => {
        element.style.removeProperty("font-size");
      });
    }
  }
});

test("SITE-R5.2 問候完整顯示", async ({ page, server }) => {
  test.setTimeout(30000);
  await openHome(page, server);
  await page.waitForFunction(
    () =>
      !document.querySelector<HTMLElement>(
        '[class*="greeting_card"] [class*="cursor"]',
      )!,
    undefined,
    { timeout: 25000 },
  );
  assert.equal(
    await page
      .locator('[class*="greeting_card"]')
      .evaluate((element: HTMLElement) => element.textContent!),
    "Software engineer focused on web apps that stay maintainable after launch.",
  );
});

test("SITE-R5.4 SITE-R6.4 社群、學校與外部部落格目的地", async ({ page, server }) => {
  await openHome(page, server);
  const links = await page
    .locator('#home a[target="_blank"],#blog a')
    .evaluateAll((elements: HTMLAnchorElement[]) =>
      elements.map((element) => ({ href: element.href, target: element.target })),
    );
  for (const href of [
    "https://github.com/bingyangchen",
    "https://www.linkedin.com/in/bing-yang-chen/",
    "https://www.cake.me/me/BingYangChen",
    "https://econo.nccu.edu.tw/",
    "https://blog.byc1999.com/list",
  ]) {
    assert.ok(
      links.some((link) => link.href === href && link.target === "_blank"),
      href,
    );
  }
});
