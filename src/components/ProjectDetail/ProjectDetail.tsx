import { IconCode } from "../../icons";
import Button from "../Button/Button";
import styles from "./ProjectDetail.module.scss";

import React from "react";

interface Props {
  thumbnail: React.ReactNode;
  icon: React.ReactNode;
  title: string;
  description: string;
  tags: string[];
  maintaining_time_range: [Date, Date] | [Date];
  source_code_url: string;
  demo_url: string;
}

interface State {}

export default class ProjectDetail extends React.Component<Props, State> {
  public state: State;
  public constructor(props: Props) {
    super(props);
    this.state = {};
  }
  public render(): React.ReactNode {
    return (
      <div className={styles.main}>
        <div className={styles.background}>{this.props.thumbnail}</div>
        <div className={styles.body}>
          <div className={styles.title}>{this.props.title}</div>
          <div className={styles.upper}>
            <div className={styles.tags}>
              {this.props.tags.map((tag, index) => (
                <React.Fragment key={index}>
                  <span className={styles.tag}>{tag}</span>
                  {index !== this.props.tags.length - 1 && <span>・</span>}
                </React.Fragment>
              ))}
            </div>
            <div className={styles.time_range}>
              {this.props.maintaining_time_range[0].getFullYear()}
              {" - "}
              {this.props.maintaining_time_range[1]?.getFullYear() ?? "Present"}
            </div>
          </div>
          <div className={styles.middle}>
            <div className={styles.icon_container}>{this.props.icon}</div>
            <div className={styles.description}>{this.props.description}</div>
          </div>
          <div className={styles.lower}>
            <Button
              className="success_fill l bold"
              onClick={() => {
                window.open(this.props.demo_url, "_blank");
              }}
            >
              <div className={styles.demo_button_link}>Visit</div>
            </Button>
            <Button
              className="clean l bold"
              onClick={() => {
                window.open(this.props.source_code_url, "_blank");
              }}
            >
              <IconCode color="#1aa260" />
              <div className={styles.source_code_button_link}>Source Code</div>
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
