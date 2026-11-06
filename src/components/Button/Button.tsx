import "./Button.scss";

import React, { MouseEventHandler } from "react";

interface ButtonProperties {
  children: React.ReactNode;
  onClick: MouseEventHandler;
  className: string;
}

export default function Button({ children, onClick, className }: ButtonProperties) {
  return (
    <button className={`button ${className}`} onClick={onClick}>
      {children}
    </button>
  );
}
