import { IconCode } from "../../icons";
import Button from "../Button/Button";
import styles from "./ProjectDetail.module.scss";

import React from "react";
import { useTranslation } from "../../i18n/context";

function openInNewTab(url: string): void {
  const tab = window.open(url, "_blank");
  if (tab) tab.opener = null;
}

interface ProjectDetailProperties {
  thumbnail: React.ReactNode;
  icon: React.ReactNode;
  title: string;
  description: string;
  tags: string[];
  maintaining_time_range: [Date, Date] | [Date];
  source_code_url: string;
  demo_url: string;
}

export default function ProjectDetail({
  thumbnail,
  icon,
  title,
  description,
  tags,
  maintaining_time_range,
  source_code_url,
  demo_url,
}: ProjectDetailProperties) {
  const { dictionary } = useTranslation();

  return (
    <div className={styles.main}>
      <div className={styles.grid}>
        <div className={styles.media}>
          <div className={styles.mediaInner}>{thumbnail}</div>
        </div>
        <div className={styles.content}>
          <div className={styles.contentPad}>
            <h3 className={styles.title}>{title}</h3>
            <div className={styles.upper}>
              <div className={styles.tags}>
                {tags.map((tag, index) => (
                  <React.Fragment key={index}>
                    <span className={styles.tag}>{tag}</span>
                    {index !== tags.length - 1 && (
                      <span className={styles.tagSep}>·</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className={styles.timeRange}>
                {maintaining_time_range[0].getFullYear()}
                {" – "}
                {maintaining_time_range[1]?.getFullYear() ??
                  dictionary.projectCommon.present}
              </div>
            </div>
            <div className={styles.middle}>
              <div className={styles.iconContainer}>{icon}</div>
              <div className={styles.description}>{description}</div>
            </div>
            <div className={styles.lower}>
              <Button
                className="primary_fill l bold"
                onClick={() => {
                  openInNewTab(demo_url);
                }}
              >
                {dictionary.projectCommon.visit}
              </Button>
              <Button
                className="clean l bold"
                onClick={() => {
                  openInNewTab(source_code_url);
                }}
              >
                <span className={styles.sourceInner}>
                  <IconCode sideLength="24" color="currentColor" />
                  {dictionary.projectCommon.sourceCode}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
