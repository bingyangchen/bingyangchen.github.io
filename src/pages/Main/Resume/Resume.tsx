import styles from "./Resume.module.scss";

import React from "react";

import ResumeSheet from "./ResumeSheet";

export default class Resume extends React.Component {
  public render(): React.ReactNode {
    return (
      <div className={styles.resumePage}>
        <h1 className={styles.title}>Resume</h1>
        <p className={styles.subtitle}>
          Single-page A4 preview. The PDF download from the home screen matches this
          layout.
        </p>
        <div className={styles.sheetViewport}>
          <ResumeSheet />
        </div>
      </div>
    );
  }
}
