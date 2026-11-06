import styles from "./RoundButton.module.scss";

import React, { MouseEventHandler } from "react";

interface RoundButtonProperties {
  children: React.ReactNode;
  onClick: MouseEventHandler;
  className: string;
  hintText: string;
}

export default function RoundButton({
  children,
  onClick,
  className,
  hintText,
}: RoundButtonProperties) {
  const rootClassName = `${styles.main} round_button ${className}`;

  return (
    <div className={rootClassName} onClick={onClick}>
      {children}
      <div className={styles.hint_text}>{hintText}</div>
    </div>
  );
}
