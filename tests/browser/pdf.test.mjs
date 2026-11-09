import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, test } from "node:test";
import {
  PDFDict,
  PDFDocument,
  PDFName,
  PDFString,
  StandardFonts,
  degrees,
} from "pdf-lib";
import {
  assertResumePdfStructure,
  assertResumePdfText,
} from "../../scripts/prerender/pdf.mjs";
import { parsePdfMetadata } from "../helpers/pdf.mjs";

const LINKS = [
  "mailto:bryan.chen.429@gmail.com",
  "https://github.com/bingyangchen",
  "https://byc1999.com/",
];
let original;

before(async () => {
  original = await readFile(new URL("../../build/resume.pdf", import.meta.url));
});

async function mutatePdf(mutate) {
  const document = await PDFDocument.load(original);
  await mutate(document, document.getPage(0));
  return document.save({ useObjectStreams: true });
}

test("compressed PDF objects retain the real pages, fonts, language and annotations", async () => {
  const compressed = await mutatePdf(() => {});
  await assertResumePdfStructure(compressed, LINKS);
  const inspected = await parsePdfMetadata(compressed);
  assert.equal(inspected.pages, 1);
  assert.equal(inspected.language, "en");
  assert.deepEqual(inspected.fonts, [
    "Georgia",
    "Georgia-Bold",
    "Georgia-Italic",
    "NotoSerifTC-Bold",
  ]);
  assert.deepEqual(inspected.links, [...LINKS].sort());
  await assertResumePdfText(compressed, [
    "陳秉洋",
    "CAREER SUMMARY",
    "EDUCATION",
    "bryan.chen.429@gmail.com",
  ]);
});

test("SITE-R14.4 corrupt, multipage, non-A4, cropped, rotated and non-English PDFs are rejected", async () => {
  await assert.rejects(
    assertResumePdfStructure(Buffer.from("%PDF-1.7\ninvalid\n%%EOF"), LINKS),
  );
  await assert.rejects(
    assertResumePdfStructure(original.subarray(0, -10), LINKS),
    /incomplete PDF envelope/,
  );
  const cases = [
    [(document) => document.addPage(), /one English A4 page/],
    [(_, page) => page.setSize(612, 792), /A4/],
    [
      (document, page) =>
        page.node.set(PDFName.of("UserUnit"), document.context.obj(2)),
      /A4/,
    ],
    [(_, page) => page.setCropBox(0, 0, 500, 700), /uncropped/],
    [(_, page) => page.setRotation(degrees(90)), /A4/],
    [(document) => document.setLanguage("zh-TW"), /English/],
  ];
  for (const [mutate, expected] of cases)
    await assert.rejects(
      assertResumePdfStructure(await mutatePdf(mutate), LINKS),
      expected,
    );
});

test("text comparison accepts print line-end hyphens and rejects missing authored punctuation", async () => {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);
  const page = document.addPage();
  for (const [index, line] of [
    "conversa-",
    "tional AI",
    "customer-",
    "facing",
    "HMAC-authenticated",
    "[a]+(b)?",
  ].entries())
    page.drawText(line, { font, size: 12, x: 40, y: 780 - index * 20 });
  const bytes = await document.save();
  await assertResumePdfText(bytes, [
    "conversational AI",
    "customer-facing",
    "HMAC-authenticated",
    "[a]+(b)?",
  ]);
  await assert.rejects(
    assertResumePdfText(bytes, ["HMACauthenticated"]),
    /missing text/,
  );
  await assert.rejects(assertResumePdfText(bytes, ["[a]+(c)?"]), /missing text/);
  await assert.rejects(assertResumePdfText(bytes, [""]), /empty expected text block/);
});

test("SITE-R14.4 missing, changed and out-of-page PDF link annotations are rejected", async () => {
  const missing = await mutatePdf((document, page) =>
    page.node.set(PDFName.of("Annots"), document.context.obj([])),
  );
  await assert.rejects(
    assertResumePdfStructure(missing, LINKS),
    /missing link annotation/,
  );
  const changed = await mutatePdf((document, page) => {
    const annotation = document.context.lookup(page.node.Annots().get(0), PDFDict);
    annotation
      .lookup(PDFName.of("A"), PDFDict)
      .set(PDFName.of("URI"), PDFString.of("https://wrong.invalid/"));
  });
  await assert.rejects(
    assertResumePdfStructure(changed, LINKS),
    /missing link annotation/,
  );
  const clipped = await mutatePdf((document, page) => {
    const annotation = document.context.lookup(page.node.Annots().get(0), PDFDict);
    annotation.set(PDFName.of("Rect"), document.context.obj([0, 0, 900, 900]));
  });
  await assert.rejects(assertResumePdfStructure(clipped, LINKS), /outside its page/);
});

test("SITE-R14.4 missing, substituted and unembedded PDF fonts are rejected", async () => {
  const missing = await mutatePdf((_, page) =>
    page.node
      .Resources()
      .set(PDFName.of("Font"), PDFDict.withContext(page.doc.context)),
  );
  await assert.rejects(
    assertResumePdfStructure(missing, LINKS),
    /Unexpected resume PDF fonts/,
  );
  const substituted = await mutatePdf((document, page) => {
    const fonts = page.node.Resources().lookup(PDFName.of("Font"), PDFDict);
    document.context
      .lookup(fonts.values()[0], PDFDict)
      .set(PDFName.of("BaseFont"), PDFName.of("Arial"));
  });
  await assert.rejects(
    assertResumePdfStructure(substituted, LINKS),
    /font descriptor|Unexpected resume PDF fonts/,
  );
  const unembedded = await mutatePdf((document) => {
    for (const [, object] of document.context.enumerateIndirectObjects()) {
      if (!(object instanceof PDFDict)) continue;
      for (const key of ["FontFile", "FontFile2", "FontFile3"])
        object.delete(PDFName.of(key));
    }
  });
  await assert.rejects(assertResumePdfStructure(unembedded, LINKS), /not embedded/);
});

test("SITE-R14.4 independent extraction rejects a missing section and contact text", async () => {
  const paragraphs = [
    "SKILLS",
    "Python and TypeScript",
    "CAREER SUMMARY",
    "Built reliable services.",
    "EDUCATION",
    "Computer Science",
    "bryan.chen.429@gmail.com",
  ];
  const makePdf = async (lines) => {
    const document = await PDFDocument.create();
    const font = await document.embedFont(StandardFonts.Helvetica);
    const page = document.addPage();
    lines.forEach((text, index) =>
      page.drawText(text, { font, size: 12, x: 40, y: 780 - index * 20 }),
    );
    return document.save();
  };
  await assertResumePdfText(await makePdf(paragraphs), paragraphs);
  await assert.rejects(
    assertResumePdfText(
      await makePdf(paragraphs.filter((text) => text !== "Computer Science")),
      paragraphs,
    ),
    /missing text: Computer Science/,
  );
  await assert.rejects(
    assertResumePdfText(await makePdf(paragraphs.slice(0, -1)), paragraphs),
    /missing text: bryan/,
  );
  const noContent = await mutatePdf((document, page) =>
    page.node.set(PDFName.of("Contents"), document.context.obj([])),
  );
  await assertResumePdfStructure(noContent, LINKS);
  await assert.rejects(
    assertResumePdfText(noContent, ["CAREER SUMMARY"]),
    /missing text: CAREER SUMMARY/,
  );
});
