import styles from "./Resume.module.scss";

import { Button } from "../../../components";
import { openResumePrintDialog } from "../../../resume/print";
import ResumeSheet from "./ResumeSheet";

export default function Resume() {
  function handleDownloadPdf(): void {
    openResumePrintDialog();
  }

  return (
    <div className={styles.resumePage}>
      <h1 className={styles.title}>Resume</h1>
      <p className={styles.subtitle}>
        Experience, education, and skills at a glance. Save the PDF when you need a
        formal copy.
      </p>
      <div className={styles.downloadRow}>
        <Button className="primary_fill l" onClick={handleDownloadPdf}>
          Download PDF
        </Button>
      </div>
      <div className={`${styles.sheetViewport} resume-print-area`}>
        <ResumeSheet />
      </div>
    </div>
  );
}
