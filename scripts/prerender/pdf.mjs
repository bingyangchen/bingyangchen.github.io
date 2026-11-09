import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFStream,
  PDFString,
  PDFHexString,
} from "pdf-lib";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { fileURLToPath } from "node:url";

const RESUME_PDF_FONT_NAMES = [
  "Georgia",
  "Georgia-Bold",
  "Georgia-Italic",
  "NotoSerifTC-Bold",
];
const getName = (dictionary, key) =>
  dictionary.lookup(PDFName.of(key), PDFName).decodeText();

function collectFontNames(resources, names, visited) {
  if (!resources || visited.has(resources)) return;
  visited.add(resources);
  const fonts = resources.lookupMaybe(PDFName.of("Font"), PDFDict);
  for (const font of fonts?.values() ?? []) {
    const dictionary = resources.context.lookup(font, PDFDict);
    const name = getName(dictionary, "BaseFont").replace(/^[A-Z]{6}\+/, "");
    names.add(name);
    const descendants = dictionary.lookupMaybe(PDFName.of("DescendantFonts"), PDFArray);
    const embeddedFonts = descendants ? descendants.asArray() : [dictionary];
    for (const embeddedFont of embeddedFonts) {
      const descriptor = resources.context
        .lookup(embeddedFont, PDFDict)
        .lookup(PDFName.of("FontDescriptor"), PDFDict);
      const embedded = ["FontFile", "FontFile2", "FontFile3"].some((key) =>
        descriptor.lookupMaybe(PDFName.of(key), PDFStream),
      );
      if (!embedded) throw new Error(`Resume PDF font is not embedded: ${name}`);
      if (getName(descriptor, "FontName").replace(/^[A-Z]{6}\+/, "") !== name)
        throw new Error(`Resume PDF font descriptor disagrees with ${name}`);
    }
  }
  const objects = resources.lookupMaybe(PDFName.of("XObject"), PDFDict);
  for (const object of objects?.values() ?? []) {
    const stream = resources.context.lookup(object, PDFStream);
    collectFontNames(
      stream.dict.lookupMaybe(PDFName.of("Resources"), PDFDict),
      names,
      visited,
    );
  }
}

export async function assertResumePdfStructure(bytes, expectedLinks) {
  if (
    !Buffer.from(bytes.subarray(0, 8)).toString("ascii").startsWith("%PDF-") ||
    !Buffer.from(bytes.subarray(-1024)).toString("ascii").trimEnd().endsWith("%%EOF")
  )
    throw new Error("Invalid resume PDF: incomplete PDF envelope");
  const document = await PDFDocument.load(bytes, {
    throwOnInvalidObject: true,
    updateMetadata: false,
  });
  const pages = document.getPages();
  const language = document.catalog
    .lookupMaybe(PDFName.of("Lang"), PDFString, PDFHexString)
    ?.decodeText();
  if (pages.length !== 1 || language !== "en")
    throw new Error("Invalid resume PDF: expected one English A4 page");
  const page = pages[0];
  const media = page.getMediaBox();
  const crop = page.getCropBox();
  const userUnit =
    page.node.lookupMaybe(PDFName.of("UserUnit"), PDFNumber)?.asNumber() ?? 1;
  if (
    !Number.isFinite(userUnit) ||
    userUnit <= 0 ||
    Math.abs(media.width * userUnit - 595.28) > 2 ||
    Math.abs(media.height * userUnit - 841.89) > 2 ||
    page.getRotation().angle !== 0 ||
    ["x", "y", "width", "height"].some((key) => Math.abs(media[key] - crop[key]) > 0.01)
  )
    throw new Error("Invalid resume PDF: expected one uncropped English A4 page");
  const fonts = new Set();
  collectFontNames(page.node.Resources(), fonts, new Set());
  if (
    fonts.size !== RESUME_PDF_FONT_NAMES.length ||
    RESUME_PDF_FONT_NAMES.some((name) => !fonts.has(name))
  )
    throw new Error(
      `Unexpected resume PDF fonts: ${Array.from(fonts).join(", ")}. Expected Georgia and the bundled Noto Serif TC subset.`,
    );
  const links = new Set();
  const annotations = page.node.Annots();
  for (const annotation of annotations?.asArray() ?? []) {
    const dictionary = document.context.lookup(annotation, PDFDict);
    if (getName(dictionary, "Subtype") !== "Link") continue;
    const action = dictionary.lookupMaybe(PDFName.of("A"), PDFDict);
    if (!action || getName(action, "S") !== "URI") continue;
    const rectangle = dictionary
      .lookup(PDFName.of("Rect"), PDFArray)
      .asArray()
      .map((value) => document.context.lookup(value).asNumber());
    if (
      rectangle.length !== 4 ||
      !rectangle.every(Number.isFinite) ||
      rectangle[0] < media.x ||
      rectangle[1] < media.y ||
      rectangle[2] > media.x + media.width ||
      rectangle[3] > media.y + media.height ||
      rectangle[2] <= rectangle[0] ||
      rectangle[3] <= rectangle[1]
    )
      throw new Error("Resume PDF link lies outside its page");
    links.add(action.lookup(PDFName.of("URI"), PDFString, PDFHexString).decodeText());
  }
  for (const link of expectedLinks)
    if (!links.has(link))
      throw new Error(`Resume PDF is missing link annotation: ${link}`);
}

function normalizeText(text) {
  return text
    .normalize("NFKC")
    .replace(/\u00ad/g, "")
    .replace(/\s+/g, "");
}

export async function assertResumePdfText(bytes, expectedText) {
  if (!expectedText.length) throw new Error("Resume PDF has no expected text");
  const task = getDocument({
    data: Uint8Array.from(bytes),
    useSystemFonts: false,
    isEvalSupported: false,
    stopAtErrors: true,
    standardFontDataUrl: fileURLToPath(
      new URL("../standard_fonts/", import.meta.resolve("pdfjs-dist/build/pdf.mjs")),
    ),
  });
  try {
    const document = await task.promise;
    const text = [];
    for (let index = 1; index <= document.numPages; index++) {
      const content = await (await document.getPage(index)).getTextContent();
      text.push(
        ...content.items
          .filter((item) => "str" in item)
          .map((item) => item.str + (item.hasEOL ? "\n" : "")),
      );
    }

    // Only a hyphen at a PDF line ending can be an extra glyph inserted by print hyphenation.
    const extracted = normalizeText(text.join("").replace(/-\s*\n/g, "\0"));
    for (const block of expectedText) {
      const normalized = normalizeText(block);
      if (!normalized) throw new Error("Resume PDF has an empty expected text block");
      const pattern = Array.from(normalized, (character) =>
        character === "-" ? "[-\0]" : character.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      ).join("\0*");
      if (!new RegExp(pattern, "u").test(extracted))
        throw new Error(`Resume PDF is missing text: ${block}`);
    }
  } finally {
    await task.destroy();
  }
}
