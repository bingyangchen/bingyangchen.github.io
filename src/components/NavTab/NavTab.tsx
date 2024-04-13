import styles from "./NavTab.module.scss";

import React, { MouseEventHandler } from "react";

interface Props {
    tabIcon?: any;
    tabName: string;
    to: string;
    onClick: MouseEventHandler;
}

interface State {}

export default class NavTab extends React.Component<Props, State> {
    public state: State;
    public constructor(props: Props) {
        super(props);
        this.state = {};
    }
    public render(): React.ReactNode {
        return (
            <a
                href={this.props.to}
                className={styles.main}
                onClick={this.props.onClick}
            >
                <div className={styles.icon_outer}>{this.props.tabIcon}</div>
                {this.props.tabName}
            </a>
        );
    }
}
