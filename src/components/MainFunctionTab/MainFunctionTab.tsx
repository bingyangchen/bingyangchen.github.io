import styles from "./MainFunctionTab.module.scss";

import React, { MouseEventHandler } from "react";
import { Link } from "react-router-dom";

interface Props {
    tab_icon?: any;
    tab_name: string;
    to: string;
    onClick: MouseEventHandler;
}

interface State {}

export default class MainFunctionTab extends React.Component<Props, State> {
    public state: State;
    public constructor(props: Props) {
        super(props);
        this.state = {};
    }
    public render(): React.ReactNode {
        return (
            <Link
                to={this.props.to}
                className={styles.tab}
                onClick={this.props.onClick}
            >
                <div className={styles.icon_outer}>{this.props.tab_icon}</div>
                {this.props.tab_name}
            </Link>
        );
    }
}
