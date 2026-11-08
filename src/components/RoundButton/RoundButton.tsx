import styles from "./RoundButton.module.scss";

import React, { MouseEventHandler } from "react";
import Tooltip from "../Tooltip/Tooltip";

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
  const rootClassName = `${styles.main} ${className}`;

  return (
    <Tooltip text={hintText}>
      <button
        {...buttonProperties}
        type="button"
        className={rootClassName}
        onClick={onClick}
        aria-label={hintText}
      >
        {children}
      </button>
    </Tooltip>
  );
}
