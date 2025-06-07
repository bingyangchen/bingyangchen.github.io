import styles from "./ProjectCard.module.scss";

import React, { MouseEvent } from "react";

interface Props {
  thumbnail: React.ReactNode;
  icon: React.ReactNode;
  title: string;
  tags: string[];
  maintaining_time_range: [Date, Date] | [Date];
}

interface State {
  activated: boolean;
}

export default class ProjectCard extends React.Component<Props, State> {
  public state: State;
  private rippleRef: React.RefObject<HTMLDivElement>;
  public constructor(props: Props) {
    super(props);
    this.state = {
      activated: false,
    };
    this.rippleRef = React.createRef();
  }
  public render(): React.ReactNode {
    return (
      <div className={styles.main}>
        <div className={styles.mask} onClick={this.handleClick}>
          {this.state.activated && (
            <div className={styles.ripple} ref={this.rippleRef} />
          )}
        </div>
        {this.props.thumbnail && (
          <div className={styles.thumbnail_container}>{this.props.thumbnail}</div>
        )}
        <div className={styles.lower}>
          <div className={styles.icon_container}>{this.props.icon}</div>
          <div className={styles.right}>
            <div className={styles.title}>{this.props.title}</div>
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
        </div>
      </div>
    );
  }
  private handleClick = (e: MouseEvent) => {
    const mask = e.currentTarget as HTMLElement;
    const diameter = Math.max(mask.clientWidth, mask.clientHeight);
    this.setState({ activated: true }, () => {
      this.rippleRef.current!.style.width = `${diameter}px`;
      this.rippleRef.current!.style.height = `${diameter}px`;
      this.rippleRef.current!.style.left = `${
        e.clientX - mask.getBoundingClientRect().left - diameter / 2
      }px`;
      this.rippleRef.current!.style.top = `${
        e.clientY - mask.getBoundingClientRect().top - diameter / 2
      }px`;
    });
    setTimeout(() => {
      this.setState({ activated: false });
    }, 250);
  };
}
