import { fileURLToPath } from "node:url";
import { resolve, join } from "node:path";
import { readFile, stat } from "node:fs/promises";
import assert from "node:assert/strict";
import { setJavaScriptEnabled } from "../helpers/browser";
import { openHome } from "../helpers/site";
import { runPrerenderFixture } from "../helpers/prerender";
import { createServer } from "node:http";
import { type AddressInfo } from "node:net";
import { test } from "../helpers/fixtures";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

const BUILD = resolve(ROOT, "build");

test("SITE-R14.1 SITE-R14.2 SITE-R14.3 完整 build、靜態文字與擷取範圍", async ({
  page,
  server,
}) => {
  const html = await readFile(join(BUILD, "index.html"), "utf8");
  assert.ok(!html.includes('<div id="root"></div>'));
  assert.ok(html.includes("陳秉洋"));
  assert.ok(!html.includes("data-resume-root"));
  const newestSource = await stat(join(ROOT, "src/index.tsx"));
  assert.ok((await stat(join(BUILD, "index.html"))).mtimeMs >= newestSource.mtimeMs);
  assert.ok(
    (await stat(join(BUILD, "resume.pdf"))).mtimeMs >=
      (await stat(join(ROOT, "src/pages/Main/Resume/ResumeSheet.tsx"))).mtimeMs,
  );
  await setJavaScriptEnabled(page, false);
  await page.goto(server.origin, { waitUntil: "networkidle" });
  assert.equal(
    await page
      .locator("#home,#about,#projects,#blog")
      .evaluateAll((elements: HTMLElement[]) => elements.length),
    4,
  );
  assert.ok(
    (
      await page
        .locator("#root")
        .evaluate((element: HTMLElement) => element.textContent!)
    ).length > 500,
  );
});

test("SITE-R15.1 新環境不註冊 service worker", async ({ page, server }) => {
  await openHome(page, server);
  const result = await page.evaluate(async () => ({
    controller: !!navigator.serviceWorker.controller,
    registrations: (await navigator.serviceWorker.getRegistrations()).length,
  }));
  assert.deepEqual(result, { controller: false, registrations: 0 });
});

test("SITE-R16.1 SITE-R16.2 Metadata、robots 與 sitemap", async ({ page, server }) => {
  await openHome(page, server);
  assert.equal(await page.title(), "Bing-Yang Chen - 陳秉洋");
  assert.equal(
    await page
      .locator('link[rel="canonical"]')
      .evaluate((element: HTMLLinkElement) => element.href),
    "https://byc1999.com/",
  );
  assert.ok(await page.$('meta[property="og:image"]'));
  assert.ok(await page.$('meta[name="description"]'));
  assert.ok(await page.$('link[rel="manifest"]'));
  const robots = await (await fetch(server.origin + "/robots.txt")).text();
  const sitemap = await (await fetch(server.origin + "/sitemap.txt")).text();
  assert.ok(robots.includes("https://byc1999.com/sitemap.txt"));
  assert.ok(!sitemap.includes("/resume"));
});

test("SITE-R14.4 錯誤、空內容與不足內容阻止 prerender", async () => {
  test.setTimeout(120000);
  const failures = [
    ["", "empty #root"],
    [
      'document.getElementById("root").textContent="thin";',
      "characters of visible text",
    ],
    [
      'document.getElementById("root").textContent="Content ".repeat(100); throw new Error("fixture error");',
      "fixture error",
    ],
  ];
  for (const [script, message] of failures) {
    const result = await runPrerenderFixture(script);
    assert.notEqual(result.code, 0);
    assert.ok(result.output.includes(message), result.output);
  }
  const errorServer = createServer((request, response) =>
    response.writeHead(500).end("fixture failure"),
  );
  await new Promise<void>((resolveListening) =>
    errorServer.listen(0, "127.0.0.1", resolveListening),
  );
  try {
    const result = await runPrerenderFixture(
      `location.replace("http://127.0.0.1:${(errorServer.address() as AddressInfo).port}/failure");`,
    );
    assert.notEqual(result.code, 0);
    assert.ok(result.output.includes("responded 500"), result.output);
  } finally {
    await new Promise((resolveClosed) => errorServer.close(resolveClosed));
  }
});

test("SITE-R14.4 首頁缺圖及非預期外連阻止 prerender", async () => {
  test.setTimeout(60000);
  const fixtures = [
    [
      `const root = document.getElementById("root");
       root.innerHTML += '<section id="projects"><button role="tab" aria-selected="true">First</button><button role="tab" aria-selected="false">Second</button></section>';
       const tabs = root.querySelectorAll('[role="tab"]');
       tabs.forEach((tab, index) => tab.onclick = () => {
         tabs.forEach(other => other.setAttribute("aria-selected", String(other === tab)));
         if (index === 1) { const image = new Image(); image.loading = "lazy"; image.src = "/missing-unselected-artwork.png"; root.append(image); }
       });`,
      "missing-unselected-artwork.png",
    ],
    [
      'const image = new Image(); image.src = "/missing-home-image.png"; document.body.append(image);',
      "missing-home-image.png",
    ],
    [
      'const image = new Image(); image.src = "https://unexpected.invalid/logo.png"; document.body.append(image);',
      "Unexpected external request",
    ],
    [
      'const script = document.createElement("script"); script.src = "https://unexpected.invalid/script.js"; document.body.append(script);',
      "Unexpected external request",
    ],
    [
      'void fetch("https://unexpected.invalid/data").catch(() => {});',
      "Unexpected external request",
    ],
  ];
  for (const [script, message] of fixtures) {
    const result = await runPrerenderFixture(
      'document.getElementById("root").textContent="Homepage content ".repeat(100);' +
        script,
    );
    assert.notEqual(result.code, 0);
    assert.ok(result.output.includes(message), result.output);
  }
});

test("SITE-R14.4 履歷缺漏、裁切與圖片失敗時停止產生 PDF", async () => {
  test.setTimeout(60000);
  const content = "Resume content ".repeat(70);
  const fixtures = [
    ["<p>No resume sheet</p>", "Expected one resume sheet"],
    ["<div data-resume-root>thin</div>", "Resume has insufficient content"],
    [
      `<div data-resume-root style="width:794px;height:1123px;position:absolute;left:0;top:0"><p style="position:absolute;top:1200px">${content}</p></div>`,
      "Resume content overflows A4",
    ],
    [
      `<div data-resume-root>${content}<img src="/missing-image.png"></div>`,
      "source image cannot be decoded",
    ],
  ];
  for (const [markup, message] of fixtures) {
    const result = await runPrerenderFixture(`
      if(location.pathname==="/resume") {
        document.getElementById("root").innerHTML=${JSON.stringify(markup)};
      } else {
        document.getElementById("root").textContent="Homepage content ".repeat(100);
      }
    `);
    assert.notEqual(result.code, 0);
    assert.ok(result.output.includes(message), result.output);
  }
});

test("SITE-R14.4 字型替換時停止產生履歷 PDF", async () => {
  const markup = `<style>
    @page { size: A4; margin: 0; }
    body { margin: 0; }
    [data-resume-root] {
      width: 210mm; height: 297mm;
      font: 12px "Missing Resume Font", Arial, sans-serif;
    }
  </style><div data-resume-root>${"Resume content ".repeat(70)}</div>`;
  const result = await runPrerenderFixture(`
    if (location.pathname === "/resume") {
      document.getElementById("root").innerHTML = ${JSON.stringify(markup)};
    } else {
      document.getElementById("root").textContent = "Homepage content ".repeat(100);
    }
  `);
  assert.notEqual(result.code, 0, "A loaded fallback font must not pass the build");
  assert.ok(result.output.includes("Unexpected resume PDF fonts"), result.output);
});
