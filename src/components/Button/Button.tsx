import "./Button.scss";

import React, { MouseEventHandler } from "react";

interface ButtonProperties {
  children: React.ReactNode;
  onClick?: MouseEventHandler;
  className: string;
  disabled?: boolean;
}

export default function Button({
  children,
  onClick,
  className,
  disabled,
}: ButtonProperties) {
  return (
    <button
      className={`button ${className}`}
      onClick={onClick ?? (() => {})}
      disabled={disabled ?? false}
    >
      {children}
    </button>
  );
}
