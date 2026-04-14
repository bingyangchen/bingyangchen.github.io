import { IconCode } from "../../icons";
import Button from "../Button/Button";
import styles from "./ProjectDetail.module.scss";

import React from "react";
import { useTranslation } from "../../i18n/context";
import type { TranslationDictionary } from "../../i18n/types";

interface Props {
  thumbnail: React.ReactNode;
  icon: React.ReactNode;
  title: string;
  description: string;
  tags: string[];
  maintaining_time_range: [Date, Date] | [Date];
  source_code_url: string;
  demo_url: string;
  dictionary: TranslationDictionary;
}

interface State {}

export class ProjectDetail extends React.Component<Props, State> {
  public state: State;
  public constructor(props: Props) {
    super(props);
    this.state = {};
  }

  private openInNewTab(url: string): void {
    const tab = window.open(url, "_blank");
    if (tab) tab.opener = null;
  }

  public render(): React.ReactNode {
    return (
      <div className={styles.main}>
        <div className={styles.grid}>
          <div className={styles.media}>
            <div className={styles.mediaInner}>{this.props.thumbnail}</div>
          </div>
          <div className={styles.content}>
            <div className={styles.contentPad}>
              <h3 className={styles.title}>{this.props.title}</h3>
              <div className={styles.upper}>
                <div className={styles.tags}>
                  {this.props.tags.map((tag, index) => (
                    <React.Fragment key={index}>
                      <span className={styles.tag}>{tag}</span>
                      {index !== this.props.tags.length - 1 && (
                        <span className={styles.tagSep}>·</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <div className={styles.timeRange}>
                  {this.props.maintaining_time_range[0].getFullYear()}
                  {" – "}
                  {this.props.maintaining_time_range[1]?.getFullYear() ??
                    this.props.dictionary.projectCommon.present}
                </div>
              </div>
              <div className={styles.middle}>
                <div className={styles.iconContainer}>{this.props.icon}</div>
                <div className={styles.description}>{this.props.description}</div>
              </div>
              <div className={styles.lower}>
                <Button
                  className="primary_fill l bold"
                  onClick={() => {
                    this.openInNewTab(this.props.demo_url);
                  }}
                >
                  {this.props.dictionary.projectCommon.visit}
                </Button>
                <Button
                  className="clean l bold"
                  onClick={() => {
                    this.openInNewTab(this.props.source_code_url);
                  }}
                >
                  <span className={styles.sourceInner}>
                    <IconCode sideLength="24" color="currentColor" />
                    {this.props.dictionary.projectCommon.sourceCode}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default function ProjectDetailWrapper(props: Omit<Props, "dictionary">) {
  const { dictionary } = useTranslation();
  return <ProjectDetail {...props} dictionary={dictionary} />;
}
