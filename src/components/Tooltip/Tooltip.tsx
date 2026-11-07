import { cloneElement, HTMLAttributes, ReactElement } from "react";

import styles from "./Tooltip.module.scss";

interface TooltipProperties {
  text: string;
  children: ReactElement<HTMLAttributes<HTMLElement>>;
}

export default function Tooltip({ text, children }: TooltipProperties) {
  return cloneElement(
    children,
    { className: `${children.props.className || ""} ${styles.trigger}` },
    children.props.children,
    <span className={styles.content} aria-hidden="true" data-tooltip-content>
      {text}
    </span>,
  );
}
