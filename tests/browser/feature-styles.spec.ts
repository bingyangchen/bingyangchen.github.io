import assert from "node:assert/strict";
import { test } from "../helpers/fixtures";
import { openHome } from "../helpers/site";

test("作品與文章的內容樣式不依賴首頁父層", async ({ page, server }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openHome(page, server);

  for (const language of ["en", "zh-TW"]) {
    await page.evaluate((selectedLanguage) => {
      localStorage.setItem("preferred_language", selectedLanguage);
    }, language);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForFunction(
      (expectedLanguage) => document.documentElement.lang === expectedLanguage,
      language,
    );

    for (const width of [320, 390, 512, 720, 721, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const differences = await page.evaluate(async () => {
        await document.fonts.ready;
        const properties = [
          "font-family",
          "font-size",
          "font-weight",
          "line-height",
          "letter-spacing",
          "text-align",
          "color",
          "margin-top",
          "margin-right",
          "margin-bottom",
          "margin-left",
          "padding-top",
          "padding-right",
          "padding-bottom",
          "padding-left",
          "gap",
          "row-gap",
          "column-gap",
        ];
        const results: Array<{ section: string; element: string; property: string }> =
          [];

        for (const section of ["projects", "blog"]) {
          const container = document.getElementById(section)!;
          const source = container.firstElementChild!;
          const originalElements = [source, ...source.querySelectorAll("*")];
          const originalStyles = originalElements.map((element) => {
            const style = getComputedStyle(element);
            return properties.map((property) => style.getPropertyValue(property));
          });
          const host = document.createElement("div");
          host.style.position = "absolute";
          host.style.left = "-100000px";
          host.style.width = `${container.getBoundingClientRect().width}px`;
          const isolated = source.cloneNode(true) as HTMLElement;
          host.append(isolated);
          document.body.append(host);

          try {
            const isolatedElements = [isolated, ...isolated.querySelectorAll("*")];
            isolatedElements.forEach((element, index) => {
              const style = getComputedStyle(element);
              properties.forEach((property, propertyIndex) => {
                if (
                  style.getPropertyValue(property) !==
                  originalStyles[index][propertyIndex]
                )
                  results.push({ section, element: element.tagName, property });
              });
            });
          } finally {
            host.remove();
          }
        }
        return results;
      });
      assert.deepEqual(differences, [], `${language} at ${width}px`);
    }
  }
});
