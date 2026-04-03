import styles from "./Resume.module.scss";

import React from "react";

import { Button } from "../../../components";
import ResumeSheet from "./ResumeSheet";

interface State {
  isDownloadingResume: boolean;
}

export default class Resume extends React.Component<Record<string, never>, State> {
  private resumeSheetReference = React.createRef<HTMLDivElement>();

  public state: State = {
    isDownloadingResume: false,
  };

  private handleDownloadPdf = async (): Promise<void> => {
    if (!this.resumeSheetReference.current) {
      return;
    }
    this.setState({ isDownloadingResume: true });
    try {
      const { generateResumePdf } = await import("../../../resume/generateResumePdf");
      await generateResumePdf(
        this.resumeSheetReference.current,
        "Bing-Yang-Chen-Resume.pdf",
      );
    } catch (error) {
      console.error(error);
    } finally {
      this.setState({ isDownloadingResume: false });
    }
  };

  public render(): React.ReactNode {
    return (
      <div className={styles.resumePage}>
        <h1 className={styles.title}>Resume</h1>
        <p className={styles.subtitle}>
          Single-page A4 preview. The PDF uses the same layout as this preview.
        </p>
        <div className={styles.downloadRow}>
          <Button
            className="primary_fill l"
            onClick={this.handleDownloadPdf}
            disabled={this.state.isDownloadingResume}
          >
            {this.state.isDownloadingResume ? "Preparing PDF…" : "Download PDF"}
          </Button>
        </div>
        <div className={styles.sheetViewport}>
          <ResumeSheet ref={this.resumeSheetReference} />
        </div>
      </div>
    );
  }
}
