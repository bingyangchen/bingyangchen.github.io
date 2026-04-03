import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

function waitForNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });
}

export async function generateResumePdf(
  element: HTMLElement,
  fileName: string,
): Promise<void> {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  await waitForNextPaint();

  const width = Math.ceil(element.getBoundingClientRect().width);
  const height = Math.ceil(element.getBoundingClientRect().height);

  const scale = Math.min(2, window.devicePixelRatio || 2);

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: false,
    logging: false,
    backgroundColor: "#ffffff",
    width,
    height,
    windowWidth: width,
    windowHeight: height,
    scrollX: 0,
    scrollY: 0,
    foreignObjectRendering: false,
    onclone: (_clonedDocument, clonedElement) => {
      clonedElement.style.transform = "none";
      clonedElement.style.position = "relative";
      clonedElement.style.left = "0";
      clonedElement.style.top = "0";
    },
  });

  const imageData = canvas.toDataURL("image/png", 1.0);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imageProperties = pdf.getImageProperties(imageData);
  const imageWidthInPdfUnits = pageWidth;
  const imageHeightInPdfUnits =
    (imageProperties.height * imageWidthInPdfUnits) / imageProperties.width;

  if (imageHeightInPdfUnits <= pageHeight) {
    const horizontalOffset = 0;
    const verticalOffset = (pageHeight - imageHeightInPdfUnits) / 2;
    pdf.addImage(
      imageData,
      "PNG",
      horizontalOffset,
      verticalOffset,
      imageWidthInPdfUnits,
      imageHeightInPdfUnits,
    );
  } else {
    const imageHeightInPdfUnitsClamped = pageHeight;
    const imageWidthInPdfUnitsClamped =
      (imageProperties.width * imageHeightInPdfUnitsClamped) / imageProperties.height;
    const horizontalOffset = (pageWidth - imageWidthInPdfUnitsClamped) / 2;
    pdf.addImage(
      imageData,
      "PNG",
      horizontalOffset,
      0,
      imageWidthInPdfUnitsClamped,
      imageHeightInPdfUnitsClamped,
    );
  }

  pdf.save(fileName);
}
