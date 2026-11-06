import styles from "./RoundButton.module.scss";

import React, { MouseEventHandler } from "react";

interface RoundButtonProperties extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  onClick: MouseEventHandler<HTMLButtonElement>;
  className: string;
  hintText: string;
}

export default function RoundButton({
  children,
  onClick,
  className,
  hintText,
  ...buttonProperties
}: RoundButtonProperties) {
  const rootClassName = `${styles.main} round_button ${className}`;

  return (
    <button
      {...buttonProperties}
      type="button"
      className={rootClassName}
      onClick={onClick}
      aria-label={hintText}
    >
      {children}
      <span className={styles.hint_text} aria-hidden="true">
        {hintText}
      </span>
    </button>
  );
}
