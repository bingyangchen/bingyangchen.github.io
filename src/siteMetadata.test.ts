import shell from "../index.html?raw";
import { profile } from "./data/profile";
import { makeSiteMetadata, renderSiteShell } from "./siteMetadata";

test("Profile 的姓名、學歷與網站網址同步到靜態 HTML 及公開 metadata", () => {
  const person = {
    ...profile,
    name: { ...profile.name, en: 'Example & "Person" <Test>', "zh-TW": "測試姓名" },
    urls: { ...profile.urls, site: "https://example.test/" },
    education: { ...profile.education, graduationYear: 2022 },
  };
  const metadata = makeSiteMetadata(person);
  const html = renderSiteShell(shell, metadata);
  const document = new DOMParser().parseFromString(html, "text/html");
  expect(document.title).toBe(`${person.name.en} - 測試姓名`);
  const description = document.querySelector<HTMLMetaElement>(
    'meta[name="description"]',
  )!.content;
  expect(description).toContain(person.name.en);
  expect(description).toContain("In 2022");
  expect(
    document.querySelector<HTMLMetaElement>('meta[property="og:description"]')!.content,
  ).toBe(description);
  expect(
    document.querySelector<HTMLMetaElement>('meta[property="og:url"]')!.content,
  ).toBe(person.urls.site);
  expect(document.querySelector<HTMLLinkElement>('link[rel="canonical"]')!.href).toBe(
    person.urls.site,
  );
  expect(html).not.toContain("%PROFILE_");
  expect(document.querySelector("test")).toBeNull();
  const manifest = JSON.parse(metadata.files["manifest.json"].source);
  expect(manifest.name).toBe(person.name.en);
  expect(manifest.short_name).toBe(person.name.en);
  expect(metadata.files["robots.txt"].source).toContain(
    "https://example.test/sitemap.txt",
  );
  const sitemap = metadata.files["sitemap.txt"].source.trim().split("\n");
  expect(sitemap[0]).toBe(person.urls.site);
  for (const url of sitemap) {
    expect(new URL(url).origin).toBe("https://example.test");
    expect(new URL(url).pathname).not.toBe("/resume");
  }
});

test("未定義的 Profile placeholder 使 HTML 輸出失敗", () => {
  expect(() => renderSiteShell("%PROFILE_MISSING%", makeSiteMetadata(profile))).toThrow(
    "Unknown profile HTML value: MISSING",
  );
});
