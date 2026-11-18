import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { type Locator, type Page } from "@playwright/test";
import { expect, test } from "../helpers/fixtures";
import { assertFocusRing } from "../helpers/accessibility";
import { settleMotion } from "../helpers/motion";
import { parsePdfMetadata } from "../helpers/pdf.mts";
import { openHome, waitForSection } from "../helpers/site";

const topics = ["origin", "work", "curiosity"] as const;

const readingOrder = [
  "origin",
  "work",
  "curiosity",
  "work",
  "origin",
  "curiosity",
  "origin",
] as const;

const interview = {
  en: {
    questions: [
      "Economics, then code. What changed?",
      "What have you built?",
      "What do you do outside of work?",
    ],
    answers: [
      "I learned to code before AI tools came along, and I loved seeing a program I’d written run for the first time. Studying economics taught me why creating value matters. Back then, I figured the most direct way to do that was to build something that would solve a problem for someone else.",
      "At Pinkoi, I spent a lot of time figuring out how to make online shopping better for customers. I went on to help build an AI knowledge platform for businesses from scratch. Now I work on games at Swag so people have more to do on the platform beyond watching live streams.",
      "I’m interested in psychology. I also practice calligraphy and take photos.",
    ],
    resume: "Download full resume",
    navigation: "About",
  },
  "zh-TW": {
    questions: [
      "經濟學，怎麼走到寫程式？",
      "你做過哪些產品？",
      "工作之外，你喜歡做什麼？",
    ],
    answers: [
      "在那個還沒有 AI 的時代，我喜歡看著自己寫的程式第一次跑起來。經濟學告訴我們創造價值的重要性，而那時的我認為，能親手打造出替人解決問題的產品，是創造價值最直接的方式。",
      "我曾在電商 Pinkoi 為了替顧客創造更好的購物體驗而絞盡腦汁，也曾從零到一和團隊打造企業 AI 知識平台。後來輾轉到了 Swag，致力於透過遊戲讓用戶享受除了直播外的豐富體驗。",
      "我喜歡心理學，平常也寫書法、拍照。",
    ],
    resume: "下載完整履歷",
    navigation: "關於",
  },
} as const;

type Language = keyof typeof interview;

function getChapter(page: Page, topic: (typeof topics)[number]) {
  return page.locator(`#about article[data-chapter="${topic}"]`);
}

async function setLanguage(page: Page, language: Language) {
  if ((await page.locator("html").getAttribute("lang")) !== language)
    await page
      .locator("[data-language-switcher]")
      .evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.locator("html")).toHaveAttribute("lang", language);
}

async function scrollToReadingPosition(locator: Locator) {
  await locator.evaluate((element) => {
    const { top, height } = element.getBoundingClientRect();
    const headerBottom = document
      .querySelector("header")!
      .getBoundingClientRect().bottom;
    const sectionTop = element.closest("#about")!.getBoundingClientRect().top;
    const targetTop = Math.max(headerBottom + 16, (innerHeight - height) / 2);
    window.scrollBy({
      top: Math.max(top - targetTop, sectionTop - headerBottom),
      behavior: "instant",
    });
  });
}

async function assertClearOfHeader(locator: Locator) {
  await expect
    .poll(() =>
      locator.evaluate((element) => {
        const { left, right, top, width, height } = element.getBoundingClientRect();
        const headerBottom = document
          .querySelector("header")!
          .getBoundingClientRect().bottom;
        return (
          left >= 0 &&
          right <= innerWidth &&
          top >= headerBottom - 1 &&
          width > 0 &&
          height > 0 &&
          element.contains(
            document.elementFromPoint(
              left + width / 2,
              Math.min(top + height / 2, innerHeight - 1),
            ),
          )
        );
      }),
    )
    .toBe(true);
}

async function assertLinearInterview(page: Page, language: Language) {
  const about = page.locator("#about");
  await expect(about.getByRole("button")).toHaveCount(0);
  const headings = about.getByRole("heading", { level: 2 });
  await expect(headings).toHaveText([...interview[language].questions]);
  await expect(about.getByRole("img")).toHaveCount(4);
  await expect(about.locator("a[download]")).toHaveAccessibleName(
    interview[language].resume,
  );

  const content = await about.locator("[data-chapter]").evaluateAll((chapters) =>
    chapters.map((chapter) => {
      const bounds = chapter.getBoundingClientRect();
      const heading = chapter.querySelector("h2")!;
      const headingStyle = getComputedStyle(heading);
      return {
        top: bounds.top,
        bottom: bounds.bottom,
        hasVisibleHeading:
          headingStyle.visibility === "visible" &&
          headingStyle.opacity === "1" &&
          headingStyle.clipPath === "none" &&
          heading.getBoundingClientRect().height > 1,
      };
    }),
  );
  assert.equal(content.length, 3);
  for (const [index, selection] of content.entries()) {
    assert.ok(selection.hasVisibleHeading, `linear heading ${index + 1}`);
    if (index > 0) assert.ok(selection.top >= content[index - 1].bottom - 1);
    await expect(getChapter(page, topics[index]).locator("p").first()).toHaveText(
      interview[language].answers[index],
    );
  }
}

test.describe("Compact About reading", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("SITE-R2.1 SITE-R6.10 SITE-R13.7 手機雙語導覽與完整訪談依序可讀", async ({
    page,
    server,
  }) => {
    await openHome(page, server);
    const banner = page.getByRole("banner");
    const menu = banner.locator('button[aria-controls="site-navigation"]');
    for (const language of ["en", "zh-TW"] as const) {
      await setLanguage(page, language);
      await menu.click();
      await banner
        .getByRole("link", { name: interview[language].navigation, exact: true })
        .click();
      await waitForSection(page, "about");
      await expect(menu).toHaveAttribute("aria-expanded", "false");
      await assertLinearInterview(page, language);

      const about = page.locator("#about");
      for (const topic of readingOrder) {
        const heading = getChapter(page, topic).getByRole("heading");
        const answer = getChapter(page, topic).locator("p").first();
        for (const text of [heading, answer]) {
          await scrollToReadingPosition(text);
          await assertClearOfHeader(text);
        }
      }
      await expect.poll(() => new URL(page.url()).hash).toBe("#about");
      const historyLength = await page.evaluate(() => history.length);
      const readingPosition = await page.evaluate(() => scrollY);
      await expect
        .poll(() => page.evaluate(() => history.state?.siteScrollPosition?.top ?? -1))
        .toBeCloseTo(readingPosition, 0);
      await page.reload({ waitUntil: "networkidle" });
      await expect
        .poll(() => page.evaluate(() => scrollY))
        .toBeCloseTo(readingPosition, 0);
      await expect.poll(() => page.evaluate(() => history.length)).toBe(historyLength);
      await expect(banner.locator('[aria-current="location"]')).toHaveAttribute(
        "href",
        "#about",
      );
      await expect(about.locator("[data-photo] img").last()).toHaveAttribute(
        "loading",
        "lazy",
      );
    }
  });
});

test("SITE-R6.11 SITE-R13.7 SITE-R13.12 雙語桌面捲動與問句在往返或跨段時一致", async ({
  page,
  server,
}) => {
  await openHome(page, server, "#about");
  await waitForSection(page, "about");
  const about = page.locator("#about");
  const banner = page.getByRole("banner");
  for (const language of ["en", "zh-TW"] as const) {
    await setLanguage(page, language);
    const focus = banner.getByRole("link", {
      name: interview[language].navigation,
      exact: true,
    });
    await focus.evaluate((element: HTMLElement) =>
      element.focus({ preventScroll: true }),
    );
    await expect(about).toHaveAttribute("data-enhanced", "true");
    for (const topic of readingOrder) {
      const chapter = getChapter(page, topic);
      await scrollToReadingPosition(chapter.locator("p").first());
      const question = about.locator(`[data-question="${topic}"]`);
      await expect(question).toHaveAttribute("data-active", "true");
      await expect(question).toHaveCSS("opacity", "1");
      await expect(about.locator('[data-question][data-active="true"]')).toHaveCount(1);
      const current = about.locator('button[aria-current="step"]');
      await expect(current).toHaveAttribute(
        "aria-controls",
        (await chapter.getAttribute("id"))!,
      );
      await expect(banner.locator('[aria-current="location"]')).toHaveAttribute(
        "href",
        "#about",
      );
      await expect(focus).toBeFocused();
      await assertClearOfHeader(chapter.locator("p").first());
    }
    const handoff = await getChapter(page, "origin").evaluate((chapter) =>
      Math.round(chapter.getBoundingClientRect().bottom + scrollY - innerHeight * 0.45),
    );
    for (const offset of [-20, 0, 1, 20, 1, 0, -20]) {
      await page.evaluate(
        (top) => scrollTo({ top, behavior: "instant" }),
        handoff + offset,
      );
      await expect(
        about.locator('[data-question][data-active="true"]'),
      ).toHaveAttribute("data-question", offset <= 0 ? "origin" : "work");
    }
  }
});

test("SITE-R2.1 SITE-R6.11 SITE-R18.1 快跳保持歷史並接續鍵盤焦點", async ({
  page,
  server,
}) => {
  await openHome(page, server, "#about");
  await waitForSection(page, "about");
  const about = page.locator("#about");
  const banner = page.getByRole("banner");
  const work = getChapter(page, "work");
  const curiosity = getChapter(page, "curiosity");

  for (const language of ["en", "zh-TW"] as const) {
    await setLanguage(page, language);
    const initialHistory = await page.evaluate(() => [location.hash, history.length]);
    await expect(about.getByRole("button")).toHaveCount(3);
    const jump = about.locator(
      `button[aria-controls="${await work.getAttribute("id")}"]`,
    );
    await page.keyboard.press("Tab");
    await jump.focus();
    await assertClearOfHeader(jump);
    await page.keyboard.press("Enter");
    await expect(work).toBeFocused();
    await expect(jump).toHaveAttribute("aria-current", "step");
    await assertClearOfHeader(work.locator("p").first());
    await assertFocusRing(page, "rgb(82, 92, 48)", -2);
    await page.keyboard.press("Tab");
    await expect(
      about.getByRole("link", { name: interview[language].resume }),
    ).toBeFocused();
    await assertFocusRing(page, "rgb(82, 92, 48)");

    const nextJump = about.locator(
      `button[aria-controls="${await curiosity.getAttribute("id")}"]`,
    );
    await nextJump.focus();
    await page.setViewportSize({ width: 1024, height: 900 });
    await expect(nextJump).toBeHidden();
    await expect(curiosity).toBeFocused();
    await assertClearOfHeader(curiosity.getByRole("heading"));
    await expect(banner.locator('[aria-current="location"]')).toHaveAttribute(
      "href",
      "#about",
    );
    assert.deepEqual(
      await page.evaluate(() => [location.hash, history.length]),
      initialHistory,
    );

    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(about.getByRole("button")).toHaveCount(3);
    await expect(curiosity).toBeFocused();
  }
});

test("SITE-R6.12 About 雙語均下載同一份英文履歷", async ({ page, server }) => {
  await openHome(page, server);
  const response = await fetch(server.origin + "/resume.pdf");
  assert.equal(response.status, 200);
  const expected = Buffer.from(await response.arrayBuffer());
  for (const language of ["en", "zh-TW"] as const) {
    await setLanguage(page, language);
    const resume = page
      .locator("#about")
      .getByRole("link", { name: interview[language].resume, exact: true });
    await expect(resume).toHaveAttribute("href", "/resume.pdf");
    await expect(resume).toHaveAttribute(
      "download",
      (await page.locator("#home a[download]").getAttribute("download"))!,
    );
    await scrollToReadingPosition(resume);
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      resume.click(),
    ]);
    assert.equal(await download.failure(), null);
    assert.deepEqual(await readFile(await download.path()), expected);
    assert.equal(new URL(page.url()).pathname, "/");
  }
});

test("SITE-R6.13 真實作品保留比例、替代文字與靜態語意", async ({ page, server }) => {
  await openHome(page, server, "#about");
  const images = getChapter(page, "curiosity").getByRole("img");
  const expected = [
    {
      id: "street",
      aspect: 6000 / 4000,
      en: "Two people in bright yellow jackets stand on opposite sides of the frame, against concrete and red brick.",
      "zh-TW": "兩位穿亮黃色外套的人站在畫面兩側，後方是灰牆與紅磚建築。",
    },
    {
      id: "architecture",
      aspect: 1917 / 2875,
      en: "A cyclist passes a building with blue glazing and sweeping white curves.",
      "zh-TW": "一名騎士從藍白曲面建築前騎過。",
    },
    {
      id: "coast",
      aspect: 2795 / 4192,
      en: "Waves break against a rocky shore beneath steep cliffs, with a lone figure by the water.",
      "zh-TW": "海浪拍打岩岸，岸邊站著一個人，遠方是陡峭的山壁。",
    },
    {
      id: "passage",
      aspect: 1920 / 2881,
      en: "Two people walk through a sunlit passage framed by beams.",
      "zh-TW": "兩人走過有樑柱與日光的長廊。",
    },
  ];

  await expect(images).toHaveCount(expected.length);
  for (const [language, width] of [
    ["en", 1440],
    ["zh-TW", 390],
  ] as const) {
    await page.setViewportSize({ width, height: 844 });
    await setLanguage(page, language);
    for (const [index, photo] of expected.entries()) {
      const figure = images.nth(index);
      await expect(figure).toHaveAccessibleName(photo[language]);
      const image = figure.locator("img");
      await expect(image).toHaveAttribute("alt", photo[language]);
      await scrollToReadingPosition(image);
      const metrics = await image.evaluate(async (element: HTMLImageElement) => {
        await element.decode();
        const bounds = element.getBoundingClientRect();
        return {
          id: element.closest<HTMLElement>("[data-photo]")!.dataset.photo,
          source: element.currentSrc,
          sourceAspect: element.naturalWidth / element.naturalHeight,
          declaredAspect:
            Number(element.getAttribute("width")) /
            Number(element.getAttribute("height")),
          visibleAspect: bounds.width / bounds.height,
          interactive: Boolean(
            element.closest(
              'a, button, [role="button"], [role="link"], [tabindex]:not([tabindex="-1"])',
            ),
          ),
          cropped: getComputedStyle(element).objectFit === "cover",
        };
      });
      assert.equal(metrics.id, photo.id);
      const url = new URL(metrics.source);
      assert.equal(url.origin, server.origin);
      assert.match(url.pathname, /\.webp$/);
      assert.equal(metrics.declaredAspect, photo.aspect);
      assert.ok(Math.abs(metrics.sourceAspect - photo.aspect) < 0.005);
      assert.ok(Math.abs(metrics.visibleAspect - photo.aspect) < 0.005);
      assert.equal(metrics.interactive, false);
      assert.equal(metrics.cropped, false);
    }
  }
});

test("SITE-R12.12 訪談與作品適應窄版、短畫面及文字放大", async ({ page, server }) => {
  await openHome(page, server, "#about");
  const about = page.locator("#about");
  for (const language of ["en", "zh-TW"] as const) {
    await setLanguage(page, language);
    for (const [width, height, fontSize] of [
      [320, 900, "100%"],
      [390, 844, "100%"],
      [512, 844, "100%"],
      [720, 900, "100%"],
      [721, 900, "100%"],
      [1024, 900, "100%"],
      [1280, 720, "100%"],
      [1440, 900, "100%"],
      [1440, 390, "100%"],
      [320, 900, "200%"],
      [1440, 900, "200%"],
    ] as const) {
      await test.step(`${language} ${width}×${height} at ${fontSize}`, async () => {
        await page.setViewportSize({ width, height });
        await page.locator("html").evaluate((element, fontSize) => {
          element.style.fontSize = fontSize;
        }, fontSize);
        const enhanced = width >= 1280 && height >= 720 && fontSize === "100%";
        await expect(about).toHaveAttribute("data-enhanced", String(enhanced));
        if (!enhanced) await assertLinearInterview(page, language);
        await settleMotion(page);
        const layout = await about.evaluate((element) => {
          const overflowing = [...element.querySelectorAll<HTMLElement>("*")]
            .filter((child) => {
              const style = getComputedStyle(child);
              return (
                (["auto", "scroll"].includes(style.overflowY) &&
                  child.scrollHeight > child.clientHeight) ||
                (["auto", "scroll"].includes(style.overflowX) &&
                  child.scrollWidth > child.clientWidth)
              );
            })
            .map((child) => child.tagName);
          const displaced = [
            ...element.querySelectorAll<HTMLElement>(
              "[data-chapter] h2, [data-chapter] p, [data-photo] img, a[download], button",
            ),
          ]
            .filter((child) => {
              const bounds = child.getBoundingClientRect();
              const style = getComputedStyle(child);
              if (
                !child.getClientRects().length ||
                style.visibility === "hidden" ||
                style.clipPath !== "none"
              )
                return false;
              const range = document.createRange();
              range.selectNodeContents(child);
              return (
                bounds.left < -1 ||
                bounds.right > innerWidth + 1 ||
                [...range.getClientRects()].some(
                  ({ left, right, top, bottom }) =>
                    left < bounds.left - 1 ||
                    right > bounds.right + 1 ||
                    top < bounds.top - 1 ||
                    bottom > bounds.bottom + 1,
                ) ||
                (child.matches("a,button") && bounds.height < 44)
              );
            })
            .map((child) => ({
              tag: child.tagName,
              text: child.textContent,
              bounds: child.getBoundingClientRect().toJSON(),
            }));
          return {
            overflowing,
            displaced,
            documentWidth: document.documentElement.scrollWidth,
            aboutWidth: element.scrollWidth,
          };
        });
        assert.deepEqual(layout.overflowing, []);
        assert.deepEqual(layout.displaced, []);
        assert.ok(layout.aboutWidth <= width);
        if (fontSize === "100%") assert.ok(layout.documentWidth <= width);
        if (width <= 512) {
          const photos = await about.locator("[data-photo]").evaluateAll((elements) =>
            elements.map((element) => {
              const { left, width, top, bottom } = element.getBoundingClientRect();
              return { left, width, top, bottom };
            }),
          );
          assert.equal(photos.length, 4);
          for (let index = 1; index < photos.length; index++) {
            const photo = photos[index];
            assert.equal(photo.width, photos[0].width);
            assert.equal(photo.left, photos[0].left);
            assert.equal(photo.top - photos[index - 1].bottom, 24);
          }
        }
        const resume = about.locator("a[download]");
        await scrollToReadingPosition(resume);
        await assertClearOfHeader(resume);
      });
    }
  }
});

test("SITE-R6.13 SITE-R12.12 照片載入失敗時可讀完整雙語說明", async ({
  createContext,
  server,
}) => {
  const context = await createContext({ viewport: { width: 320, height: 800 } });
  const page = await context.newPage();
  await page.route(/\/street-(?:480|960|1440)-[^/]+\.webp$/, (route) => route.abort());
  await openHome(page, server, "#about");
  await page.locator("html").evaluate((element) => (element.style.fontSize = "200%"));

  const photo = page.locator('#about [data-photo="street"]');
  await photo.scrollIntoViewIfNeeded();
  await photo.locator("img").evaluate((image: HTMLImageElement) => {
    // Trigger the failure without waiting for the browser's lazy-load heuristic.
    image.loading = "eager";
  });
  await expect(photo).toHaveAttribute("data-unavailable", "true");
  const caption = photo.locator("figcaption");

  for (const language of ["en", "zh-TW"] as const) {
    await setLanguage(page, language);
    const description = await photo.locator("img").getAttribute("alt");
    assert.ok(description);
    await expect(caption).toHaveText(description);
    await expect(photo).toHaveAccessibleName(description);
    const fits = await caption.evaluate((element) => {
      const figure = element.parentElement!.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(element);
      return (
        figure.height >= (figure.width * 2) / 3 - 1 &&
        [...range.getClientRects()].every(
          (line) => line.right <= figure.right && line.bottom <= figure.bottom,
        )
      );
    });
    assert.ok(fits);
  }
});

test("SITE-R13.12 缺少訪談增強所需的瀏覽器能力時完整直排", async ({ page, server }) => {
  await page.addInitScript(() =>
    Reflect.deleteProperty(window, "IntersectionObserver"),
  );
  await openHome(page, server, "#about");
  await expect(page.locator("#about")).toHaveAttribute("data-enhanced", "false");
  for (const language of ["en", "zh-TW"] as const) {
    await setLanguage(page, language);
    await assertLinearInterview(page, language);
  }
});

test("SITE-R13.12 改用減少動態時可繼續閱讀且隱藏的快跳移交焦點", async ({
  page,
  server,
}) => {
  await openHome(page, server, "#about");
  await waitForSection(page, "about");
  const about = page.locator("#about");
  await expect(about.getByRole("button")).toHaveCount(3);
  const work = getChapter(page, "work");
  const jump = about.locator(
    `button[aria-controls="${await work.getAttribute("id")}"]`,
  );
  await jump.focus();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(jump).toBeHidden();
  await expect(work).toBeFocused();
  await assertClearOfHeader(work.getByRole("heading"));
  for (const language of ["en", "zh-TW"] as const) {
    await setLanguage(page, language);
    await assertLinearInterview(page, language);
    await expect(work).toBeFocused();
  }
});

test("SITE-R6.12 SITE-R13.12 停用 JavaScript 仍能讀完整訪談、作品與履歷連結", async ({
  createContext,
  server,
}) => {
  const context = await createContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const response = await page.goto(server.origin + "/#about");
  assert.equal(response!.status(), 200);
  const about = page.locator("#about");
  await expect(about).toHaveAttribute("data-enhanced", "false");
  const language =
    (await about.getAttribute("data-language")) === "en" ? "en" : "zh-TW";
  await assertLinearInterview(page, language);
  await expect(about.locator("a[download]")).toHaveAttribute("href", "/resume.pdf");
  for (const image of await about.locator("[data-photo] img").all()) {
    await scrollToReadingPosition(image);
    await expect
      .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
      .toBeGreaterThan(0);
  }
});

test("SITE-R13.12 首頁列印保留三段問答與照片", async ({ page, server }) => {
  await openHome(page, server);
  const about = page.locator("#about");
  await expect(about).toHaveAttribute("data-enhanced", "true");
  await page.emulateMedia({ media: "print" });
  await assertLinearInterview(page, "en");
  const pdf = await parsePdfMetadata(
    await page.pdf({ preferCSSPageSize: true, printBackground: true }),
  );
  const text = pdf.text.replace(/\s+/g, " ");
  let position = 0;
  for (const [index, question] of interview.en.questions.entries()) {
    const heading = text.indexOf(question, position);
    assert.ok(heading >= position, `missing printed question: ${question}`);
    position = text.indexOf(interview.en.answers[index], heading + question.length);
    assert.ok(position > heading, `missing printed answer after: ${question}`);
  }
  assert.ok(text.includes(interview.en.resume));
  const aspectRatios = pdf.paintedImageSizes.map(([width, height]) => width / height);
  assert.ok(aspectRatios.some((ratio) => Math.abs(ratio - 1.5) < 0.005));
  assert.ok(
    aspectRatios.filter((ratio) => Math.abs(ratio - 2 / 3) < 0.005).length >= 3,
  );
});
