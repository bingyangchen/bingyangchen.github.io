import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export async function generateResumePdf(
  element: HTMLElement,
  fileName: string,
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
  });
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imageData = canvas.toDataURL("image/png");
  pdf.addImage(imageData, "PNG", 0, 0, pageWidth, pageHeight);
  pdf.save(fileName);
}
