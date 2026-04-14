import styles from "./NavTab.module.scss";

import React, { MouseEventHandler } from "react";

interface NavTabProperties {
  tabIcon?: React.ReactNode;
  tabName: string;
  to: string;
  onClick: MouseEventHandler;
}

export default function NavTab({ tabIcon, tabName, to, onClick }: NavTabProperties) {
  return (
    <a href={to} className={styles.main} onClick={onClick}>
      <div className={styles.icon_outer}>{tabIcon}</div>
      {tabName}
    </a>
  );
}
