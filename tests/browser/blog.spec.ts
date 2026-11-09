import { fileURLToPath } from "node:url";
import { resolve, join } from "node:path";
import { openHome, dragText } from "../helpers/site";
import { assertHoverCapability } from "../helpers/motion";
import { setJavaScriptEnabled } from "../helpers/browser";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "../helpers/fixtures";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

const BUILD = resolve(ROOT, "build");

test("SITE-R17.2 SITE-R17.3 文章鍵盤啟用與雙語", async ({ page, context, server }) => {
  test.setTimeout(45000);
  await openHome(page, server, "#blog");
  const original = await page
    .locator("#blog a")
    .evaluateAll((links: HTMLAnchorElement[]) => links.map((link) => link.href));
  assert.equal(original.length, 4);
  assert.equal(
    await page
      .locator('#blog [class*="languageNote"]')
      .evaluate((note: HTMLElement) => note.textContent!),
    "Primarily in Traditional Chinese.",
  );
  const selectors = [
    '#blog a[class*="featured"]',
    '#blog a[class*="reading"]:nth-child(1)',
    '#blog a[class*="reading"]:nth-child(2)',
  ];
  for (const selector of selectors) {
    const destination = await page
      .locator(selector)
      .evaluate((link: HTMLAnchorElement) => link.href);
    for (const activation of ["keyboard", "mouse", "modifier"]) {
      await page.bringToFront();
      await dragText(page, `${selector} p`);
      const popupTarget = context.waitForEvent("page", { timeout: 10000 });
      await page.bringToFront();
      if (activation === "keyboard") {
        await page.locator(selector).focus();
        await page.keyboard.press("Enter");
      } else if (activation === "modifier") {
        const modifier = process.platform === "darwin" ? "Meta" : "Control";
        await page.keyboard.down(modifier);
        try {
          await page.locator(`${selector} p`).click();
        } finally {
          await page.keyboard.up(modifier);
        }
      } else {
        await page.locator(`${selector} p`).click();
      }
      const target = await popupTarget;
      assert.equal(target.url(), destination, activation);
      const popup = target;
      assert.ok(popup, `${activation} creates a page`);
      await popup.close();
    }
  }
  const titles = await page
    .locator("#blog h3")
    .evaluateAll((headings: HTMLElement[]) =>
      headings.map((heading) => heading.textContent!),
    );
  await page.locator("[data-language-switcher]").click();
  await page.waitForFunction(
    () => document.documentElement.lang === "zh-TW",
    undefined,
  );
  assert.equal(await page.$('#blog [class*="languageNote"]'), null);
  assert.deepEqual(
    await page
      .locator("#blog h3")
      .evaluateAll((headings: HTMLElement[]) =>
        headings.map((heading) => heading.textContent!),
      ),
    titles,
  );
  assert.deepEqual(
    await page
      .locator("#blog a")
      .evaluateAll((links: HTMLAnchorElement[]) => links.map((link) => link.href)),
    original,
  );
  assert.ok(
    await page
      .locator("#blog")
      .evaluate((blog: HTMLElement) =>
        blog.textContent!.includes("很多事寫下來之後，才知道自己是不是真的懂了。"),
      ),
  );
  await page.locator("[data-language-switcher]").click();
  await page.waitForSelector('#blog [class*="languageNote"]');
});

test("SITE-R17.4 各尺寸文章與操作範圍", async ({ page, server }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openHome(page, server, "#blog");
  for (const width of [320, 390, 512, 720, 721, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    for (const language of ["en", "zh-TW"]) {
      if (
        (await page.locator("html").evaluate((html: HTMLHtmlElement) => html.lang)) !==
        language
      )
        await page.evaluate(() =>
          document.querySelector<HTMLElement>("[data-language-switcher]")!.click(),
        );
      await page.waitForFunction(
        (expected) => document.documentElement.lang === expected,
        language,
        {},
      );
      const metrics = await page.locator("#blog").evaluate((blog: HTMLElement) => {
        const featured = blog.querySelector<HTMLAnchorElement>('a[class*="featured"]')!;
        const copy = featured
          .querySelector<HTMLElement>('[class*="featuredCopy"]')!
          .getBoundingClientRect();
        const action = featured
          .querySelector<HTMLElement>('[class*="featuredAction"]')!
          .getBoundingClientRect();
        const illustration = featured
          .querySelector<HTMLElement>('[class*="illustration"]')!
          .getBoundingClientRect();
        const reading = [
          ...blog.querySelectorAll<HTMLAnchorElement>('a[class*="reading"]'),
        ].map((link) => link.getBoundingClientRect());
        return {
          overflow: blog.scrollWidth > window.innerWidth,
          vertical:
            illustration.top >= action.bottom - 1 && action.top >= copy.bottom - 1,
          readingVertical: reading[1].top >= reading[0].bottom - 1,
          textOverflow: [
            ...blog.querySelectorAll<HTMLElement>(
              "p,h2,h3,[class*='layer'],[class*='featureGroup']",
            ),
          ]
            .filter((element) => element.scrollWidth > element.clientWidth + 2)
            .map((element) => element.className),
          targets: [...blog.querySelectorAll<HTMLAnchorElement>("a")].map(
            (link) => link.getBoundingClientRect().height,
          ),
          nestedScrolling: [...blog.querySelectorAll<HTMLElement>("div")].some(
            (element) =>
              ["auto", "scroll"].includes(getComputedStyle(element).overflowY),
          ),
        };
      });
      assert.equal(metrics.overflow, false, `${width} ${language}`);
      assert.equal(metrics.vertical, width <= 720, `${width} ${language}`);
      assert.equal(metrics.readingVertical, width <= 720, `${width} ${language}`);
      assert.deepEqual(metrics.textOverflow, [], `${width} ${language}`);
      assert.ok(
        metrics.targets.every((height) => height >= 44),
        `${width} ${language}`,
      );
      assert.equal(metrics.nestedScrolling, false);
      const mismatches = await page.evaluate(() => {
        const pairs: [string, string, string[]][] = [
          [
            "#projects > div",
            "#blog > div",
            ["padding-top", "padding-right", "padding-bottom", "padding-left"],
          ],
          [
            "#projects h2",
            "#blog h2",
            [
              "font-family",
              "font-size",
              "font-weight",
              "line-height",
              "letter-spacing",
            ],
          ],
          [
            '#projects [class*="sectionHeader"]',
            '#blog [class*="intro"]',
            ["display", "align-items", "justify-content", "gap", "margin-bottom"],
          ],
          [
            '#projects [class*="sectionHeader"] p',
            '#blog [class*="introCopy"] > p',
            ["font-size", "font-weight", "line-height", "margin-top"],
          ],
          [
            '#projects a[href="https://github.com/bingyangchen"]',
            '#blog a[class*="archiveLink"]',
            ["font-size", "min-height", "gap", "margin-top"],
          ],
          [
            '#projects a[href="https://github.com/bingyangchen"] svg',
            '#blog a[class*="archiveLink"] svg',
            ["width", "height"],
          ],
          [
            '#projects [aria-hidden="false"] [class*="description"]',
            '#blog [class*="featuredCopy"] > p',
            ["font-size", "line-height"],
          ],
          [
            '#projects [aria-hidden="false"] [class*="projectMeta"]',
            '#blog [class*="featuredCopy"] [class*="metadata"]',
            ["font-size", "line-height"],
          ],
          [
            '#projects [role="tabpanel"][aria-hidden="false"] a',
            '#blog [class*="featuredAction"]',
            ["font-size", "min-height", "gap"],
          ],
          [
            '#projects [role="tabpanel"][aria-hidden="false"] a svg',
            '#blog [class*="featuredAction"] svg',
            ["width", "height"],
          ],
          [
            '#projects [role="tabpanel"][aria-hidden="false"] a svg',
            '#blog [class*="readingHeading"] svg',
            ["width", "height"],
          ],
        ];
        return pairs.flatMap(([projectSelector, blogSelector, properties]) => {
          const projectStyle = getComputedStyle(
            document.querySelector<HTMLElement>(projectSelector)!,
          );
          const blogStyle = getComputedStyle(
            document.querySelector<HTMLElement>(blogSelector)!,
          );
          return properties
            .filter(
              (property) =>
                projectStyle.getPropertyValue(property) !==
                blogStyle.getPropertyValue(property),
            )
            .map((property) => ({
              element: blogSelector,
              property,
              project: projectStyle.getPropertyValue(property),
              blog: blogStyle.getPropertyValue(property),
            }));
        });
      });
      assert.deepEqual(mismatches, [], `section consistency at ${width} ${language}`);
      for (const link of await page.$$("#blog a")) {
        await link.evaluate((element) =>
          element.scrollIntoView({ behavior: "instant", block: "center" }),
        );
        assert.ok(
          await link.evaluate((element) => {
            const rect = element.getBoundingClientRect();
            return element.contains(
              document.elementFromPoint(
                rect.x + rect.width / 2,
                rect.y + rect.height / 2,
              ),
            );
          }),
          `unreachable link at ${width} ${language}`,
        );
      }
    }
  }
});

test("SITE-R17.5 文章焦點、Hover 與減少動態", async ({ page, server }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openHome(page, server, "#blog");
  await assertHoverCapability(page, true);
  const links = await page
    .locator("#blog a")
    .evaluateAll((elements: HTMLAnchorElement[]) =>
      elements.map((element) => element.href),
    );
  await page.locator('#blog a[class*="archiveLink"]').focus();
  for (let index = 0; index < links.length; index += 1) {
    const focus = await page.evaluate(() => ({
      href: (document.activeElement as HTMLAnchorElement).href,
      outline: getComputedStyle(document.activeElement as HTMLElement).outlineStyle,
    }));
    assert.equal(focus.href, links[index]);
    assert.equal(focus.outline, "solid");
    if (index < links.length - 1) await page.keyboard.press("Tab");
  }
  await page.locator('#blog a[class*="featured"]').hover();
  await page.waitForFunction(
    () =>
      getComputedStyle(
        document.querySelector<HTMLElement>(
          '#blog [class*="featuredAction"] [class*="arrow"]',
        )!,
      ).transform !== "none",
    undefined,
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(
    () => {
      const arrows = [
        ...document.querySelectorAll<HTMLElement>('#blog [class*="arrow"]'),
      ];
      return (
        arrows.length > 0 &&
        arrows.every((arrow) => getComputedStyle(arrow).transitionDuration === "0s")
      );
    },
    undefined,
    { timeout: 5000 },
  );
});

test("SITE-R17.6 精選文章不依賴 JavaScript 或 GitBook 回應", async ({
  page,
  server,
}) => {
  const html = await readFile(join(BUILD, "index.html"), "utf8");
  assert.ok(html.includes("專案目錄結構"));
  assert.ok(html.includes("從依技術分層到依功能分組"));
  assert.ok(html.includes("system-design/rate-limiter"));
  await setJavaScriptEnabled(page, false);
  await page.goto(server.origin + "/#blog", { waitUntil: "networkidle" });
  assert.equal(
    await page
      .locator("#blog h3")
      .evaluateAll((headings: HTMLElement[]) => headings.length),
    3,
  );
  assert.equal(
    await page
      .locator("#blog a")
      .evaluateAll(
        (links: HTMLAnchorElement[]) =>
          links.filter((link) => link.href.startsWith("https://blog.byc1999.com/"))
            .length,
      ),
    4,
  );
  const blogRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).hostname === "blog.byc1999.com")
      blogRequests.push(request.url());
  });
  await setJavaScriptEnabled(page, true);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.lang === "en", undefined);
  assert.equal(
    await page
      .locator("#blog h3")
      .evaluateAll((headings: HTMLElement[]) => headings.length),
    3,
  );
  assert.deepEqual(blogRequests, []);
});
