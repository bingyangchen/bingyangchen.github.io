import type { profile } from "./data/profile.ts";

export function makeSiteMetadata(person: typeof profile) {
  const title = `${person.name.en} - ${person.name["zh-TW"]}`;
  const { education } = person;
  const description = `${person.name.en} (${person.name["zh-TW"]}, ${person.name.nickname}) is a software developer based in Taiwan. In ${education.graduationYear}, he graduated from ${education.school.en} (${education.abbreviation}, ${education.school["zh-TW"]}) with a major in ${education.major.en}. Check out his educational background, work experiences, and many creative side projects here.`;
  const keywords = `${person.name.en}, ${person.name["zh-TW"]}, ${person.name.nickname} ${person.name.family}, software engineer, 軟體工程師, ${education.abbreviation}, ${education.school["zh-TW"]}, ${education.major.en}, ${education.major["zh-TW"].replace(/學$/, "系")}, ${education.major["zh-TW"]}, personal website, 個人網站`;
  const manifest = {
    short_name: person.name.en,
    name: person.name.en,
    icons: [
      {
        src: "logo.webp",
        type: "image/webp",
        sizes: "512x512 192x192 64x64 32x32 24x24 16x16",
      },
    ],
    start_url: ".",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#ffffff",
    background_color: "#ffffff",
    capture_links: ["new-client", "existing-client-navigate"],
  };
  const sitemapPaths = [
    "/",
    "/path-finding-visualizer/",
    "/virus-spread/",
    "/wiki-prettier/",
    "/market-sim/",
    "/inventory-analyzer/",
    "/snake/",
    "/tic-tac-toe/",
    "/pick-coins/",
  ];
  return {
    placeholderToValue: {
      TITLE: title,
      DESCRIPTION: description,
      KEYWORDS: keywords,
      URL: person.urls.site,
    },
    files: {
      "manifest.json": {
        contentType: "application/manifest+json",
        source: `${JSON.stringify(manifest, null, 2)}\n`,
      },
      "robots.txt": {
        contentType: "text/plain; charset=utf-8",
        source: `User-agent: *\nAllow: /\n\nSitemap: ${new URL("/sitemap.txt", person.urls.site).href}\n`,
      },
      "sitemap.txt": {
        contentType: "text/plain; charset=utf-8",
        source: `${sitemapPaths.map((path) => new URL(path, person.urls.site).href).join("\n")}\n`,
      },
    },
  };
}

export function renderSiteShell(
  html: string,
  metadata: ReturnType<typeof makeSiteMetadata>,
): string {
  const placeholderToValue: Record<string, string> = metadata.placeholderToValue;
  return html.replace(/%PROFILE_([A-Z_]+)%/g, (_placeholder, key: string) => {
    const value = placeholderToValue[key];
    if (value === undefined) throw new Error(`Unknown profile HTML value: ${key}`);
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  });
}
