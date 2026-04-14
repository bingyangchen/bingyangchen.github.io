import styles from "./ProjectCard.module.scss";

import React, { MouseEvent, useState } from "react";
import { useTranslation } from "../../i18n/context";

interface ProjectCardProperties {
  thumbnail: React.ReactNode;
  icon: React.ReactNode;
  title: string;
  tags: string[];
  maintaining_time_range: [Date, Date] | [Date];
}

interface RippleLayout {
  diameter: number;
  left: number;
  top: number;
}

export default function ProjectCard({
  thumbnail,
  icon,
  title,
  tags,
  maintaining_time_range,
}: ProjectCardProperties) {
  const { dictionary } = useTranslation();
  const [rippleLayout, setRippleLayout] = useState<RippleLayout | null>(null);

  function handleClick(event: MouseEvent) {
    const mask = event.currentTarget as HTMLElement;
    const diameter = Math.max(mask.clientWidth, mask.clientHeight);
    const rectangle = mask.getBoundingClientRect();
    setRippleLayout({
      diameter,
      left: event.clientX - rectangle.left - diameter / 2,
      top: event.clientY - rectangle.top - diameter / 2,
    });
    setTimeout(() => {
      setRippleLayout(null);
    }, 250);
  }

  return (
    <div className={styles.main}>
      <div className={styles.mask} onClick={handleClick}>
        {rippleLayout !== null && (
          <div
            className={styles.ripple}
            style={{
              width: rippleLayout.diameter,
              height: rippleLayout.diameter,
              left: rippleLayout.left,
              top: rippleLayout.top,
            }}
          />
        )}
      </div>
      {thumbnail && <div className={styles.thumbnail_container}>{thumbnail}</div>}
      <div className={styles.lower}>
        <div className={styles.icon_container}>{icon}</div>
        <div className={styles.right}>
          <div className={styles.title}>{title}</div>
          <div className={styles.tags}>
            {tags.map((tag, index) => (
              <React.Fragment key={index}>
                <span className={styles.tag}>{tag}</span>
                {index !== tags.length - 1 && <span>・</span>}
              </React.Fragment>
            ))}
          </div>
          <div className={styles.time_range}>
            {maintaining_time_range[0].getFullYear()}
            {" - "}
            {maintaining_time_range[1]?.getFullYear() ??
              dictionary.projectCommon.present}
          </div>
        </div>
      </div>
    </div>
  );
}
