import styles from "./Project.module.scss";

import React from "react";

interface Props {
  thumbnail: React.ReactNode;
  icon: React.ReactNode;
  title: string;
  tags: string[];
  maintaining_time_range: [Date, Date] | [Date];
}

interface State {}

export default class Project extends React.Component<Props, State> {
  public state: State;
  public constructor(props: Props) {
    super(props);
    this.state = {};
  }
  public render(): React.ReactNode {
    return (
      <div className={styles.main}>
        <div className={styles.thumbnail_container}>{this.props.thumbnail}</div>
        <div className={styles.lower}>
          <div className={styles.icon_container}>{this.props.icon}</div>
          <div className={styles.right}>
            <div className={styles.title}>{this.props.title}</div>
            <div className={styles.tags}>
              {this.props.tags.map((tag, index) => (
                <>
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                  {index !== this.props.tags.length - 1 && <span>・</span>}
                </>
              ))}
            </div>
            <div className={styles.time_range}>
              {this.props.maintaining_time_range[0].getFullYear()}
              {" - "}
              {this.props.maintaining_time_range[1]?.getFullYear() ?? "Present"}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
