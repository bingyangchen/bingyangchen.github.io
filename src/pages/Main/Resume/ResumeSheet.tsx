import styles from "./ResumeSheet.module.scss";

import React from "react";

const ResumeSheet = React.forwardRef<HTMLDivElement, {}>(
  function ResumeSheet(_props, forwardedReference) {
    return (
      <div ref={forwardedReference} className={styles.a4}>
        <div className={styles.contentArea} />
      </div>
    );
  },
);

export default ResumeSheet;
