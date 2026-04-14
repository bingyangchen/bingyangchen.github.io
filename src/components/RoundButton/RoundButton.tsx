import styles from "./RoundButton.module.scss";
import "./RoundButton.scss";

import React, { MouseEventHandler } from "react";

interface RoundButtonProperties {
  children: React.ReactNode;
  onClick?: MouseEventHandler;
  className?: string;
  disabled?: boolean;
  hintText?: string;
}

export default function RoundButton({
  children,
  onClick,
  className,
  disabled,
  hintText,
}: RoundButtonProperties) {
  const rootClassName =
    styles.main +
    (disabled ? ` ${styles.disabled}` : "") +
    (className ? ` round_button ${className}` : "");

  return (
    <div
      className={rootClassName}
      onClick={disabled ? () => {} : (onClick ?? (() => {}))}
    >
      {children}
      {hintText ? <div className={styles.hint_text}>{hintText}</div> : null}
    </div>
  );
}
