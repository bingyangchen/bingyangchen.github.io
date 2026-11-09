import { openHome, selectProject } from "../helpers/site";
import assert from "node:assert/strict";
import { test } from "../helpers/fixtures";

const DETAIL = '#projects [role="tabpanel"]:not([inert])';

test("SITE-R7.2 SITE-R7.3 SITE-R7.7 作品切換與重載", async ({ page, server }) => {
  await openHome(page, server);
  await page
    .locator("#projects")
    .evaluate((element: HTMLElement) =>
      element.scrollIntoView({ behavior: "instant" }),
    );
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  const before = await page.evaluate(() => ({
    scroll: window.scrollY,
    height: document.documentElement.scrollHeight,
  }));
  await selectProject(page, 2);
  assert.equal(
    await page
      .locator(`${DETAIL} h3`)
      .evaluate((element: HTMLElement) => element.textContent!),
    "Noads",
  );
  assert.equal(
    await page
      .locator(DETAIL)
      .evaluateAll((elements: HTMLElement[]) => elements.length),
    1,
  );
  assert.equal(
    await page
      .locator(`${DETAIL} a:not([href^="https://github.com/"])`)
      .evaluate((element: HTMLAnchorElement) => element.href),
    "https://chromewebstore.google.com/detail/noads/mcdfnneilaagajpfcfiofdjibclkflhg",
  );
  assert.deepEqual(
    await page.evaluate(() => ({
      scroll: window.scrollY,
      height: document.documentElement.scrollHeight,
    })),
    before,
  );
  await selectProject(page, 2);
  assert.equal(
    await page
      .locator(`${DETAIL} h3`)
      .evaluate((element: HTMLElement) => element.textContent!),
    "Noads",
  );
  await selectProject(page, 3);
  assert.equal(
    await page
      .locator(`${DETAIL} h3`)
      .evaluate((element: HTMLElement) => element.textContent!),
    "Leechai",
  );
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(
    await page
      .locator(`${DETAIL} h3`)
      .evaluate((element: HTMLElement) => element.textContent!),
    "Taigu",
  );
});

test("SITE-R7.8 鍵盤操作作品", async ({ page, server }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await openHome(page, server);
  await selectProject(page);
  await page.evaluate(() =>
    window.scrollTo({
      top: document.getElementById("projects")!.offsetTop + 500,
      behavior: "instant",
    }),
  );
  const before = await page.evaluate(() => window.scrollY);
  for (const [key, title] of [
    ["ArrowLeft", "Leechai"],
    ["ArrowRight", "Taigu"],
    ["End", "Leechai"],
    ["Home", "Taigu"],
  ]) {
    await page.keyboard.press(key);
    assert.equal(
      await page
        .locator(`${DETAIL} h3`)
        .evaluate((element: HTMLElement) => element.textContent!),
      title,
    );
    assert.equal(
      await page.evaluate(() =>
        (document.activeElement as HTMLElement).textContent!.trim(),
      ),
      title,
    );
    assert.equal(await page.evaluate(() => window.scrollY), before);
  }
  await page.keyboard.press("Space");
  await page.keyboard.press("Enter");
  assert.equal(
    await page
      .locator(`${DETAIL} h3`)
      .evaluate((element: HTMLElement) => element.textContent!),
    "Taigu",
  );
  assert.equal(
    await page.evaluate(
      () => getComputedStyle(document.activeElement as HTMLElement).outlineStyle,
    ),
    "solid",
  );
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() =>
      (document.activeElement as HTMLElement).getAttribute("role"),
    ),
    "tabpanel",
  );
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() =>
      (document.activeElement as HTMLElement).textContent!.trim(),
    ),
    "Explore Taigu",
  );
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() =>
      (document.activeElement as HTMLElement).textContent!.trim(),
    ),
    "Source Code",
  );
  const client = await page.context().newCDPSession(page);
  const tree = await client.send("Accessibility.getFullAXTree");
  assert.equal(
    tree.nodes.filter((node) => node.role?.value === "tabpanel" && !node.ignored)
      .length,
    1,
  );
});

test("SITE-R12.2 學歷跨 breakpoint 時立即套用字級", async ({ page, server }) => {
  await page.setViewportSize({ width: 512, height: 844 });
  await openHome(page, server);
  for (const language of ["en", "zh-TW"]) {
    if (
      (await page
        .locator("html")
        .evaluate((element: HTMLHtmlElement) => element.lang)) !== language
    )
      await page.evaluate(() =>
        document.querySelector<HTMLElement>("[data-language-switcher]")!.click(),
      );
    for (const [width, fontSize] of [
      [513, "18px"],
      [512, "16px"],
    ] as const) {
      await page.setViewportSize({ width, height: 844 });
      assert.deepEqual(
        await page
          .locator('#about [class*="degree_list"] > a')
          .evaluateAll((elements: HTMLElement[]) =>
            elements.map((element) => getComputedStyle(element).fontSize),
          ),
        [fontSize, fontSize],
        `education font size at ${width} ${language}`,
      );
      const skills = await page
        .locator('[data-scroll-motion="skill"]')
        .evaluateAll((elements: HTMLElement[]) =>
          elements.map((element) => ({
            title: element.textContent!.trim(),
            top: element.offsetTop,
            width: element.offsetWidth,
            height: element.offsetHeight,
            display: getComputedStyle(element).display,
          })),
        );
      assert.ok(skills.length > 10);
      assert.equal(new Set(skills.map((skill) => skill.title)).size, skills.length);
      assert.ok(new Set(skills.map((skill) => skill.top)).size > 1, "skills wrap");
      assert.ok(
        skills.every(
          (skill) => skill.width > 0 && skill.height > 0 && skill.display !== "none",
        ),
      );
      assert.ok(
        await page
          .locator('[class*="skills_inner"]')
          .evaluate(
            (element: HTMLElement) => element.scrollWidth <= element.clientWidth,
          ),
      );
    }
  }
});

test("SITE-R12.3 作品詳情分支", async ({ page, server }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openHome(page, server);
  for (const width of [320, 390, 512, 513, 720, 721, 1024, 1025, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    for (const language of ["en", "zh-TW"]) {
      if (
        (await page
          .locator("html")
          .evaluate((element: HTMLHtmlElement) => element.lang)) !== language
      )
        await page.evaluate(() =>
          document.querySelector<HTMLElement>("[data-language-switcher]")!.click(),
        );
      let height;
      for (const index of [1, 2, 3]) {
        await page
          .locator("#projects")
          .evaluate((element: HTMLElement) =>
            element.scrollIntoView({ behavior: "instant", block: "start" }),
          );
        await selectProject(page, index);
        await page.evaluate(async () =>
          Promise.all(
            [...document.querySelectorAll<HTMLImageElement>("#projects img")].map(
              (image) => image.decode(),
            ),
          ),
        );
        const metrics = await page.locator(DETAIL).evaluate((panel: HTMLElement) => {
          const stage = panel
            .querySelector<HTMLElement>('[class*="productStage"]')!
            .getBoundingClientRect();
          const intro = panel
            .querySelector<HTMLElement>('[class*="projectIntro"]')!
            .getBoundingClientRect();
          const content = panel
            .querySelector<HTMLElement>('[class*="projectContent"]')!
            .getBoundingClientRect();
          return {
            pageHeight: document.documentElement.scrollHeight,
            sectionWidth: document.getElementById("projects")!.scrollWidth,
            vertical: stage.top >= intro.bottom && content.top >= stage.bottom,
            imageBounds: [
              ...panel.querySelector<HTMLElement>('[class*="productArt"]')!.children,
            ]
              .filter((element) => getComputedStyle(element).display !== "none")
              .every((element) => {
                const rect = element.getBoundingClientRect();
                return (
                  rect.left >= stage.left - 0.5 &&
                  rect.right <= stage.right + 0.5 &&
                  rect.top >= stage.top - 0.5 &&
                  rect.bottom <= stage.bottom + 0.5
                );
              }),
            targets: [
              ...document.querySelectorAll<HTMLElement>(
                '#projects [role="tab"], #projects [aria-hidden="false"] a',
              ),
            ].map((element) => element.getBoundingClientRect().height),
          };
        });
        assert.ok(metrics.sectionWidth <= width, `overflow at ${width} ${language}`);
        assert.equal(metrics.vertical, width <= 720, `layout at ${width} ${language}`);
        assert.ok(metrics.imageBounds, `artwork outside stage at ${width} ${language}`);
        assert.ok(metrics.targets.every((target) => target >= 44));
        if (height !== undefined)
          assert.equal(
            metrics.pageHeight,
            height,
            `unstable height at ${width} ${language}`,
          );
        height = metrics.pageHeight;
        for (const link of await page.$$(`${DETAIL} a`)) {
          await link.evaluate((element) => {
            const rect = element.getBoundingClientRect();
            const targetCenter = window.innerHeight / 2;
            window.scrollBy({
              top: rect.top + rect.height / 2 - targetCenter,
              behavior: "instant",
            });
          });
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
            `obstructed action at ${width} ${language}`,
          );
        }
      }
    }
  }
});
