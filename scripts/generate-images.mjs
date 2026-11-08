import { execFileSync } from "node:child_process";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const output = new URL("src/assets/responsive/", root);
const portraits = ["avatar_1.webp", "avatar_2.jpg"];
const artwork = [
  "taigu-overview.webp",
  "taigu-allocation.webp",
  "noads-interface.png",
  "leechai-accounts.png",
  "leechai-settings.png",
];
const logos = [
  ["logo.webp", 96],
  ["taigu_logo.webp", 78],
  ["noads_logo.webp", 78],
  ["leechai_logo.webp", 78],
  ["gaia_logo.webp", 64],
  ["pinkoi_logo.webp", 64],
  ["sysfeather_logo.webp", 64],
  ["beida_logo.webp", 64],
];

function generateWebp(source, width) {
  const destination = new URL(
    `${source.replace(/\.[^.]+$/, "")}-${width}.webp`,
    output,
  );
  execFileSync("cwebp", [
    "-quiet",
    "-q",
    width === 48 ? "60" : "88",
    "-m",
    "6",
    "-sharp_yuv",
    "-resize",
    String(width),
    "0",
    fileURLToPath(new URL(`src/assets/${source}`, root)),
    "-o",
    fileURLToPath(destination),
  ]);
  return destination;
}

await mkdir(output, { recursive: true });
for (const source of [...portraits, ...artwork]) {
  for (const width of portraits.includes(source)
    ? [160, 320, 480]
    : [48, 240, 480, 720]) {
    const destination = generateWebp(source, width);
    if ((await readFile(destination)).length > 64 * 1024)
      throw new Error(`Image exceeds the 64 KiB budget: ${destination.pathname}`);
  }
}
for (const [source, width] of logos) generateWebp(source, width);

// Keep the social image's PNG URL while resizing from an untouched source.
const cover = new URL("cover.webp", output);
execFileSync("cwebp", [
  "-quiet",
  "-lossless",
  "-resize",
  "1200",
  "0",
  fileURLToPath(new URL("design/cover-source.png", root)),
  "-o",
  fileURLToPath(cover),
]);
const png = execFileSync("dwebp", ["-quiet", fileURLToPath(cover), "-o", "-"]);
await writeFile(new URL("public/cover.png", root), png);
await unlink(cover);
console.log(`Generated responsive WebP assets and cover.png (${png.length} bytes).`);
