import { getDocument, OPS } from "pdfjs-dist/legacy/build/pdf.mjs";

export async function parsePdfMetadata(bytes: Uint8Array) {
  const task = getDocument({
    data: Uint8Array.from(bytes),
    fontExtraProperties: true,
    disableFontFace: true,
    useSystemFonts: false,
    stopAtErrors: true,
  });
  try {
    const document = await task.promise;
    const metadata = await document.getMetadata();
    const fonts = new Set();
    const links = new Set();
    const text = [];
    const pageSizes = [];
    let mediaBox;
    for (let index = 1; index <= document.numPages; index++) {
      const page = await document.getPage(index);
      const viewport = page.getViewport({ scale: 1 });
      pageSizes.push([viewport.width, viewport.height]);
      mediaBox ??= page.view;
      const content = await page.getTextContent();
      text.push(
        ...content.items
          .filter((item) => "str" in item)
          .map((item) => item.str + (item.hasEOL ? "\n" : "")),
      );
      const operators = await page.getOperatorList();

      // Inspect the fonts used by drawing operators with a parser independent of the build validator.
      for (let index = 0; index < operators.fnArray.length; index++) {
        if (operators.fnArray[index] !== OPS.setFont) continue;
        const font = page.commonObjs.get(operators.argsArray[index][0]);
        if (!font.name) throw new Error("PDF.js did not expose the embedded font name");
        fonts.add(font.name.replace(/^[A-Z]{6}\+/, ""));
      }
      for (const annotation of await page.getAnnotations())
        if (annotation.subtype === "Link" && annotation.url) links.add(annotation.url);
    }
    return {
      pages: document.numPages,
      language: "Language" in metadata.info ? metadata.info.Language : undefined,
      mediaBox,
      pageSizes,
      fonts: Array.from(fonts).sort(),
      links: Array.from(links).sort(),
      text: text.join(""),
    };
  } finally {
    await task.destroy();
  }
}
