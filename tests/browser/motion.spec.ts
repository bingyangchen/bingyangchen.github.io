import { fileURLToPath } from "node:url";
import { resolve, join } from "node:path";
import { openHome, selectProject, waitForSection, enterPreview } from "../helpers/site";
import {
  moveMotionTarget,
  assertHoverCapability,
  hoverLink,
  assertArrowState,
  settleMotion,
  getMotionState,
  getMotionComposition,
} from "../helpers/motion";
import { setViewport, setJavaScriptEnabled } from "../helpers/browser";
import { getPrintResult } from "../helpers/resume";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "../helpers/fixtures";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

const BUILD = resolve(ROOT, "build");

const DETAIL = '#projects [role="tabpanel"]:not([inert])';

const TABS = '#projects [role="tab"]';

const PROJECTS_MOTION = '#projects > [data-scroll-motion="content"]';

const BLOG_MOTION = '#blog > [data-scroll-motion="content"]';

test("SITE-R13.5 導覽減少動態", async ({ page, server }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await openHome(page, server);
  await page.locator('header button[aria-controls="site-navigation"]').click();
  assert.equal(
    await page
      .locator('header [class*="menu_icon"] > span')
      .first()
      .evaluate((element: HTMLElement) => getComputedStyle(element).transitionDuration),
    "0s",
  );
  assert.equal(
    await page
      .locator('header nav a[href="#about"]')
      .evaluate(
        (element: HTMLElement) =>
          getComputedStyle(element, "::after").transitionDuration,
      ),
    "0s",
  );
  assert.equal(
    await page
      .locator("html")
      .evaluate((element: HTMLElement) => getComputedStyle(element).scrollBehavior),
    "auto",
  );
  await page.locator('header a[href="#projects"]').click();
  assert.ok(
    await page
      .locator("#projects")
      .evaluate(
        (element: HTMLElement) =>
          Math.abs(
            element.getBoundingClientRect().top -
              document.querySelector<HTMLElement>("header")!.getBoundingClientRect()
                .bottom,
          ) < 2,
      ),
  );
});

test("SITE-R13.4 作品動態偏好", async ({ page, server }) => {
  await openHome(page, server);
  await selectProject(page, 2);
  assert.notEqual(
    await page
      .locator(`${DETAIL} [class*="productArt"]`)
      .evaluate((element: HTMLElement) => getComputedStyle(element).animationName),
    "none",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await selectProject(page, 3);
  assert.equal(
    await page
      .locator(`${DETAIL} [class*="productArt"]`)
      .evaluate((element: HTMLElement) => getComputedStyle(element).animationName),
    "none",
  );
  assert.equal(
    await page
      .locator(`${DETAIL} a:not([href^="https://github.com/"])`)
      .evaluate((element: HTMLElement) => getComputedStyle(element).transitionDuration),
    "0s",
  );
});

test("SITE-R13.3 完整減少動態與即時切換", async ({ page, server }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openHome(page, server);
  async function assertStaticMotion() {
    // Media emulation can resolve before matchMedia listeners clear motion state.
    await page.waitForFunction(
      () =>
        matchMedia("(prefers-reduced-motion: reduce)").matches &&
        !document.querySelector<HTMLElement>("[data-scroll-motion-active]")!,
      undefined,
      { timeout: 5000 },
    );
    await page.locator('#home [aria-label="GitHub"]').hover();
    assert.equal(
      await page
        .locator('#home [aria-label="GitHub"]')
        .evaluate((element: HTMLElement) => getComputedStyle(element).transform),
      "none",
    );
    assert.equal(await page.$("[data-scroll-motion-active]"), null);
    const states = await page
      .locator("[data-scroll-motion]")
      .evaluateAll((elements: HTMLElement[]) =>
        elements
          .filter((element) => !element.closest("[inert]"))
          .map((element) => ({
            opacity: getComputedStyle(element).opacity,
            transform: getComputedStyle(element).transform,
          })),
      );
    assert.ok(states.length > 30);
    assert.ok(
      states.every((state) => state.opacity === "1" && state.transform === "none"),
    );
    assert.equal(
      await page
        .locator("#home *, #about *, #projects *, #blog *")
        .evaluateAll(
          (elements: HTMLElement[]) =>
            elements.filter(
              (element) =>
                getComputedStyle(element).animationName !== "none" ||
                getComputedStyle(element).transitionDuration !== "0s",
            ).length,
        ),
      0,
    );
    assert.equal(
      await page
        .locator("html")
        .evaluate((element: HTMLElement) => getComputedStyle(element).scrollBehavior),
      "auto",
    );
  }
  await assertStaticMotion();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.waitForSelector("[data-scroll-motion-active]");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await assertStaticMotion();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.waitForSelector("[data-scroll-motion-active]");
  await moveMotionTarget(page, PROJECTS_MOTION, 700);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await assertStaticMotion();
});

test("SITE-R13.6 外連箭頭一致性", async ({ page, server }) => {
  await openHome(page, server, "#projects");
  await assertHoverCapability(page, true);
  const sharedLinks = [
    '#projects a[href="https://github.com/bingyangchen"]',
    '#blog a[class*="archiveLink"]',
    '#blog a[class*="featured"]',
    '#blog a[class*="reading"]:nth-child(1)',
    '#blog a[class*="reading"]:nth-child(2)',
  ];
  const projectLinks = [
    `${DETAIL} a:not([href^="https://github.com/"])`,
    `${DETAIL} a[href^="https://github.com/"]`,
  ];
  for (const reduced of [false, true]) {
    await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
    for (let index = 0; index < 3; index += 1) {
      const tab = `${TABS}:nth-child(${index + 1})`;
      await page
        .locator(tab)
        .evaluate((button: HTMLElement) =>
          button.scrollIntoView({ behavior: "instant", block: "center" }),
        );
      await page.locator(tab).focus();
      await page.keyboard.press("Enter");
      await page.waitForSelector(`${tab}[aria-selected="true"]`);
      const links = index === 0 ? [...sharedLinks, ...projectLinks] : projectLinks;
      for (const selector of links) {
        const arrow = `${selector} svg[aria-hidden="true"]`;
        const duration = reduced ? "0s" : "0.22s";
        await hoverLink(page, selector);
        await assertArrowState(
          page,
          arrow,
          reduced ? 0 : 3,
          reduced ? 0 : -3,
          duration,
        );
        await page.mouse.move(0, 0);
        await assertArrowState(page, arrow, 0, 0, duration);
      }
    }
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await setViewport(page, { width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto("about:blank");
  await openHome(page, server, "#blog");
  await assertHoverCapability(page, false);
  for (const selector of [...sharedLinks, ...projectLinks]) {
    await hoverLink(page, selector);
    await assertArrowState(page, `${selector} svg[aria-hidden="true"]`, 0, 0, "0.22s");
  }
});

test("SITE-R12.1 SITE-R12.7 雙語短螢幕、橫向與分界的 Hero 完整可操作", async ({
  page,
  server,
}) => {
  await openHome(page, server);
  for (const preference of ["no-preference", "reduce"] as const) {
    await page.emulateMedia({ reducedMotion: preference });
    for (const language of ["en", "zh-TW"]) {
      if (
        (await page
          .locator("html")
          .evaluate((element: HTMLHtmlElement) => element.lang)) !== language
      )
        await page
          .locator("[data-language-switcher]")
          .evaluate((element: HTMLElement) => element.click());
      await page.waitForFunction(
        (expected) => document.documentElement.lang === expected,
        language,
        {},
      );
      for (const [width, height] of [
        [320, 568],
        [390, 568],
        [390, 844],
        [568, 320],
        [719, 568],
        [720, 568],
        [844, 390],
        [1440, 900],
      ]) {
        await page.setViewportSize({ width, height });
        await page.evaluate(() => {
          dispatchEvent(new WheelEvent("wheel"));
          window.scrollTo({ top: 0, behavior: "instant" });
        });
        await settleMotion(page);
        const label = `${language} ${preference} ${width}x${height}`;
        const metrics = await page
          .locator('#home [data-scroll-motion="hero"]')
          .evaluate((card: HTMLElement) => {
            const bounds = card.getBoundingClientRect();
            const inner = card.firstElementChild!;
            const greeting = card.querySelector<HTMLElement>(
              '[class*="greeting_card"]',
            )!;
            const greetingStyle = getComputedStyle(greeting.firstElementChild!);
            return {
              horizontal: document.documentElement.scrollWidth > window.innerWidth,
              clipped:
                card.scrollHeight > card.clientHeight + 1 ||
                card.scrollWidth > card.clientWidth + 1 ||
                inner.scrollWidth > inner.clientWidth + 1,
              greetingScroll: greeting.scrollHeight > greeting.clientHeight + 1,
              greetingFontSize: parseFloat(greetingStyle.fontSize),
              greetingLineHeight: parseFloat(greetingStyle.lineHeight),
              columns: getComputedStyle(inner).gridTemplateColumns.split(" ").length,
              actions: Array.from(
                card.querySelectorAll<HTMLAnchorElement>("a,button"),
                (element) => {
                  const rect = element.getBoundingClientRect();
                  return {
                    width: rect.width,
                    height: rect.height,
                    contained:
                      rect.left >= bounds.left &&
                      rect.right <= bounds.right + 1 &&
                      rect.top >= bounds.top &&
                      rect.bottom <= bounds.bottom + 1,
                  };
                },
              ),
            };
          });
        assert.equal(metrics.horizontal, false, label);
        assert.equal(metrics.clipped, false, label);
        assert.equal(metrics.greetingScroll, false, label);
        if (width === 719 || width === 720) {
          const expectedFontSize = width === 719 ? 14.72 : 14.4;
          const expectedLineHeight = width === 719 ? 25.024 : 23.76;
          assert.ok(
            Math.abs(metrics.greetingFontSize - expectedFontSize) < 0.01,
            label,
          );
          assert.ok(
            Math.abs(metrics.greetingLineHeight - expectedLineHeight) < 0.01,
            label,
          );
        }
        assert.equal(metrics.columns, width < 720 ? 1 : 2, label);
        assert.equal(metrics.actions.length, 10, label);
        assert.ok(
          metrics.actions.every(
            (action) => action.contained && action.width >= 44 && action.height >= 44,
          ),
          label + JSON.stringify(metrics.actions),
        );
        const actions = await page.$$(
          '#home [data-scroll-motion="hero"] a, #home [data-scroll-motion="hero"] button',
        );
        for (const action of actions) {
          await action.evaluate((element) =>
            element.scrollIntoView({ block: "center", behavior: "instant" }),
          );
          await settleMotion(page);
          assert.ok(
            await action.evaluate((element) => {
              const rect = element.getBoundingClientRect();
              const x = rect.left + rect.width / 2,
                y = rect.top + rect.height / 2;
              return (
                y >
                  document.querySelector<HTMLElement>("header")!.getBoundingClientRect()
                    .bottom &&
                y < window.innerHeight &&
                element.contains(document.elementFromPoint(x, y))
              );
            }),
            label + ": each control must be reachable by page scrolling",
          );
          await action.dispose();
        }
      }
    }
  }
});

test("SITE-R13.2 長 Hero 讀完前保持清楚並可往返退場", async ({ page, server }) => {
  await openHome(page, server);
  await page.setViewportSize({ width: 390, height: 568 });
  const hero = '#home [data-scroll-motion="hero"]';
  for (const language of ["en", "zh-TW"]) {
    if (language === "zh-TW")
      await page
        .locator("[data-language-switcher]")
        .evaluate((element: HTMLElement) => element.click());
    await moveMotionTarget(page, "#home", 0);
    const initial = await getMotionState(page, hero);
    const readingDistance = await page
      .locator("#home")
      .evaluate((element: HTMLElement) => element.offsetHeight - window.innerHeight);
    assert.ok(readingDistance > 0);
    await moveMotionTarget(page, "#home", -readingDistance + 1);
    assert.deepEqual(await getMotionState(page, hero), initial);
    await moveMotionTarget(page, "#home", -readingDistance - 150);
    const exiting = await getMotionState(page, hero);
    assert.ok(exiting.opacity < 1 && exiting.scale < 1 && exiting.y < 0);
    await moveMotionTarget(page, "#home", -readingDistance + 1);
    assert.deepEqual(await getMotionState(page, hero), initial);
  }
});

test("SITE-R13.2 Hero 往返動態", async ({ page, server }) => {
  await openHome(page, server);
  const hero = '#home [data-scroll-motion="hero"]';
  const initial = await getMotionState(page, hero);
  assert.equal(initial.opacity, 1);
  assert.equal(initial.scale, 1);
  await moveMotionTarget(page, "#home", -250);
  const away = await getMotionState(page, hero);
  assert.ok(away.y < -20);
  assert.ok(away.opacity < 0.9 && away.opacity > 0);
  assert.ok(away.scale < 0.98);
  assert.equal(
    (await getMotionState(page, '#home [data-scroll-motion="hint"]')).opacity,
    0,
  );
  await moveMotionTarget(page, "#home", 0);
  assert.deepEqual(await getMotionState(page, hero), initial);
});

test("SITE-R13.7 各段落三次往返還原與停止", async ({ page, server }) => {
  await openHome(page, server);
  const selectors = ['#about [data-scroll-motion="content"]'];
  for (const selector of selectors) {
    await moveMotionTarget(page, selector, 700);
    const entering = await getMotionState(page, selector);
    assert.ok(entering.y > 10 && entering.opacity < 0.95, selector);
    await moveMotionTarget(page, selector, 250);
    const reading = await getMotionState(page, selector);
    assert.equal(reading.opacity, 1, selector);
    assert.equal(reading.y, 0, selector);
    assert.equal(reading.scale, 1, selector);
    const height = await page
      .locator(selector)
      .first()
      .evaluate((element: HTMLElement) => element.offsetHeight);
    for (let cycle = 0; cycle < 3; cycle++) {
      await moveMotionTarget(page, selector, -height + 100);
      const exiting = await getMotionState(page, selector);
      assert.ok(exiting.opacity < 0.7 && exiting.y < 0, selector);
      await moveMotionTarget(page, selector, 700);
      assert.deepEqual(await getMotionState(page, selector), entering, selector);
    }
    await settleMotion(page);
    assert.deepEqual(
      await getMotionState(page, selector),
      entering,
      `${selector} holds when idle`,
    );
  }
});

test("SITE-R13.7 SITE-R13.8 專案與文章整組往返並維持相對位置", async ({
  page,
  server,
}) => {
  const groups = [
    {
      selector: PROJECTS_MOTION,
      children: [
        '[class*="sectionHeader"]',
        '[role="tablist"]',
        '[role="tabpanel"]:not([inert]) [class*="projectIntro"]',
        '[role="tabpanel"]:not([inert]) figure',
        '[role="tabpanel"]:not([inert]) img',
        '[role="tabpanel"]:not([inert]) [class*="projectContent"]',
      ],
    },
    {
      selector: BLOG_MOTION,
      children: ['[class*="intro"]', 'a[class*="featured"]', 'a[class*="reading"]'],
    },
  ];
  await openHome(page, server);
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    // Trailing space makes the last section's full exit reachable in this fixture.
    await page.locator("footer").evaluate((element: HTMLElement) => {
      element.style.minHeight = "100vh";
    });
    for (const language of ["en", "zh-TW"]) {
      if (
        (await page
          .locator("html")
          .evaluate((element: HTMLHtmlElement) => element.lang)) !== language
      )
        await page
          .locator("[data-language-switcher]")
          .evaluate((element: HTMLElement) => element.click());
      await page.waitForFunction(
        (expected) => document.documentElement.lang === expected,
        language,
        {},
      );
      for (const { selector, children } of groups) {
        const getComposition = () => getMotionComposition(page, selector, children);
        await page
          .locator(selector)
          .first()
          .evaluate((group: HTMLElement) =>
            Promise.all(
              group
                .getAnimations({ subtree: true })
                .map((animation) => animation.finished),
            ),
          );
        await moveMotionTarget(page, selector, 250);
        assert.equal((await getMotionState(page, selector)).opacity, 1);
        const composition = await getComposition();
        assert.ok(composition.length >= children.length);
        const height = await page
          .locator(selector)
          .first()
          .evaluate((element: HTMLElement) => element.offsetHeight);
        await moveMotionTarget(page, selector, viewport.height * 0.84);
        const entering = await getMotionState(page, selector);
        assert.ok(entering.y > 10 && entering.opacity < 0.95);
        for (let cycle = 0; cycle < 3; cycle++) {
          for (const position of [-height + 100, viewport.height * 0.84]) {
            await moveMotionTarget(page, selector, position);
            const state = await getMotionState(page, selector);
            assert.ok(state.opacity < 0.95);
            if (position < 0) assert.ok(state.y < 0);
            else assert.deepEqual(state, entering);
            const current = await getComposition();
            assert.equal(current.length, composition.length);
            current.forEach((child, index) => {
              assert.ok(Math.abs(child.x - composition[index].x) < 0.1, selector);
              assert.ok(Math.abs(child.y - composition[index].y) < 0.1, selector);
              assert.equal(child.opacity, "1", selector);
              assert.equal(child.transform, "none", selector);
            });
          }
        }
        await settleMotion(page);
        assert.deepEqual(await getMotionState(page, selector), entering);
        await moveMotionTarget(page, selector, -height / 2);
        assert.equal((await getMotionState(page, selector)).opacity, 1);
        assert.equal((await getMotionState(page, selector)).y, 0);
        assert.equal((await getMotionState(page, selector)).scale, 1);
      }
    }
  }
});

test("SITE-R13.8 長段落閱讀區", async ({ page, server }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openHome(page, server);
  const longContent =
    '#about [data-scroll-timeline]:nth-child(2) [data-scroll-motion="content"]';
  // Explicit lines keep this case taller than the viewport across fonts and copy changes.
  await page.locator(longContent).evaluate((element: HTMLElement) => {
    const description = element.lastElementChild!;
    description.replaceChildren();
    for (let line = 0; line < 40; line++)
      description.append("Work experience detail.", document.createElement("br"));
  });
  for (const fontFamily of ["Arial, sans-serif", "monospace"]) {
    await page.locator(longContent).evaluate((element: HTMLElement, font) => {
      element.style.fontFamily = font;
    }, fontFamily);
    await settleMotion(page);
    assert.ok(
      await page
        .locator(longContent)
        .evaluate((element: HTMLElement) => element.offsetHeight > window.innerHeight),
      `Long-content fixture must exceed the viewport with ${fontFamily}`,
    );
    for (const top of [100, -250]) {
      await moveMotionTarget(page, longContent, top);
      const state = await getMotionState(page, longContent);
      assert.equal(state.opacity, 1, fontFamily);
      assert.equal(state.y, 0, fontFamily);
      assert.equal(state.scale, 1, fontFamily);
    }
  }
});

test("SITE-R13.8 聚焦維持整組進退場", async ({ page, server }) => {
  const hero = '#home [data-scroll-motion="hero"]';
  const cases = [
    { anchor: hero, targets: [hero], focus: [`${hero} a`] },
    {
      anchor: PROJECTS_MOTION,
      targets: [PROJECTS_MOTION],
      focus: [TABS, DETAIL, `${DETAIL} a`],
    },
    {
      anchor: BLOG_MOTION,
      targets: [BLOG_MOTION],
      focus: ['#blog a[class*="featured"]', '#blog a[class*="reading"]'],
    },
  ];
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await openHome(page, server);
    await page.locator("footer").evaluate((element: HTMLElement) => {
      element.style.minHeight = "100vh";
    });
    for (const { anchor, targets, focus } of cases) {
      const height = await page
        .locator(anchor)
        .evaluate((element: HTMLElement) => element.offsetHeight);
      const positions =
        anchor === hero ? [-250] : [viewport.height * 0.78, -height + 100];
      const getStates = () =>
        Promise.all(targets.map((selector) => getMotionState(page, selector)));
      for (const position of positions) {
        await moveMotionTarget(page, anchor, position);
        const before = await getStates();
        assert.ok(before[0].opacity < 1, anchor);
        const scrollTop = await page.evaluate(() => window.scrollY);
        for (const selector of focus) {
          await page
            .locator(selector)
            .first()
            .evaluate((element: HTMLElement) => element.focus({ preventScroll: true }));
          await settleMotion(page);
          assert.equal(await page.evaluate(() => window.scrollY), scrollTop);
          assert.deepEqual(await getStates(), before, `${selector} focused`);
          await page.evaluate(
            (top) => window.scrollTo({ top: top - 40, behavior: "instant" }),
            scrollTop,
          );
          await settleMotion(page);
          const focusedScroll = await getStates();
          assert.notDeepEqual(focusedScroll, before, `${selector} scrolls with focus`);
          await page
            .locator(selector)
            .first()
            .evaluate((element: HTMLElement) => element.blur());
          await settleMotion(page);
          assert.deepEqual(await getStates(), focusedScroll, `${selector} blurred`);
          await moveMotionTarget(page, anchor, position);
          assert.deepEqual(await getStates(), before, `${selector} restored`);
        }
      }
    }
  }
});

test("SITE-R13.9 Hash 直達與重載的動態狀態", async ({ page, server }) => {
  const selectors = {
    home: '#home [data-scroll-motion="hero"]',
    about: '#about [data-scroll-motion="heading"]',
    projects: PROJECTS_MOTION,
    blog: BLOG_MOTION,
  };
  for (const [section, selector] of Object.entries(selectors)) {
    await page.goto("about:blank");
    await openHome(page, server, `#${section}`);
    await waitForSection(page, section);
    await settleMotion(page);
    const state = await getMotionState(page, selector);
    const top = await page.evaluate(() => window.scrollY);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForFunction(
      (position) => Math.abs(window.scrollY - position) <= 1,
      top,
      {},
    );
    await settleMotion(page);
    assert.deepEqual(await getMotionState(page, selector), state, section);
  }
});

test("SITE-R13.9 雙語與尺寸重算", async ({ page, server }) => {
  await openHome(page, server);
  const selector =
    '#about [data-scroll-timeline]:nth-child(3) [data-scroll-motion="content"]';
  for (const [language, width] of [
    ["en", 720],
    ["zh-TW", 721],
    ["en", 390],
  ] as const) {
    await page.setViewportSize({ width, height: 844 });
    if (
      (await page
        .locator("html")
        .evaluate((element: HTMLHtmlElement) => element.lang)) !== language
    )
      await page
        .locator("[data-language-switcher]")
        .evaluate((element: HTMLElement) => element.click());
    await page.waitForFunction(
      (expected) => document.documentElement.lang === expected,
      language,
      {},
    );
    await moveMotionTarget(page, selector, 600);
    const state = await getMotionState(page, selector);
    const top = await page.evaluate(() => window.scrollY);
    await page.reload({ waitUntil: "networkidle" });
    await page.evaluate((position) => {
      dispatchEvent(new WheelEvent("wheel"));
      window.scrollTo({ top: position, behavior: "instant" });
    }, top);
    await settleMotion(page);
    assert.deepEqual(
      await getMotionState(page, selector),
      state,
      `${language} ${width}`,
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    );
  }
});

test("SITE-R13.10 原生捲動與閒置更新", async ({ page, server }) => {
  await openHome(page, server);
  await moveMotionTarget(page, '#about [data-scroll-motion="content"]', 500);
  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 300);
  await page.waitForFunction(
    (position) => window.scrollY >= position + 299,
    before,
    {},
  );
  await settleMotion(page);
  assert.ok(Math.abs((await page.evaluate(() => window.scrollY)) - before - 300) < 2);
  const mutations = await page.evaluate(
    () =>
      new Promise((resolveIdle) => {
        let writes = 0;
        const observer = new MutationObserver((records) => {
          writes += records.length;
        });
        observer.observe(
          document.querySelector<HTMLElement>("[data-scroll-motion-active]")!,
          { attributes: true, subtree: true, attributeFilter: ["style"] },
        );
        let frames = 0;
        const sample = () => {
          if (++frames === 6) {
            observer.disconnect();
            resolveIdle(writes);
          } else requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      }),
  );
  assert.equal(mutations, 0, "idle motion must not keep writing styles");
});

test("SITE-R13.11 靜態內容與列印隔離", async ({ page, server }) => {
  const html = await readFile(join(BUILD, "index.html"), "utf8");
  assert.ok(!html.includes("data-scroll-motion-active"));
  assert.ok(!html.includes("--scroll-"));
  await setJavaScriptEnabled(page, false);
  await page.goto(server.origin, { waitUntil: "networkidle" });
  const states = await page
    .locator("[data-scroll-motion]:not([inert])")
    .evaluateAll((elements: HTMLElement[]) =>
      elements
        .filter((element) => !element.closest("[inert]"))
        .map((element) => ({
          opacity: getComputedStyle(element).opacity,
          transform: getComputedStyle(element).transform,
        })),
    );
  assert.ok(states.length > 30);
  assert.ok(
    states.every((state) => state.opacity === "1" && state.transform === "none"),
  );
  await setJavaScriptEnabled(page, true);
  await openHome(page, server);
  assert.ok(await page.$("#home a[download]"));
  await enterPreview(page);
  const result = await getPrintResult(page);
  assert.equal(result.pages, 1);
  assert.equal(result.metrics.count, 1);
  assert.equal(result.metrics.header, "none");
  await page.goBack();
  await page.waitForSelector("[data-scroll-motion-active]");
});
