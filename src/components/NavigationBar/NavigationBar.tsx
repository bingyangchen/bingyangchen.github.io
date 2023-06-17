import styles from "./NavigationBar.module.scss";

import React from "react";

interface Props {
    children: React.ReactNode[];
    isActive: boolean;
    hide: () => void;
}

interface State {}

export default class NavigationBar extends React.Component<Props, State> {
    public state: State;
    public constructor(props: Props) {
        super(props);
        this.state = {};
    }
    public render(): React.ReactNode {
        return (
            <>
                <div
                    className={
                        styles.main +
                        (this.props.isActive ? " " + styles.active : "")
                    }
                >
                    {this.props.children}
                </div>
                <div
                    className={
                        styles.small_screen_active_background +
                        (this.props.isActive ? " " + styles.active : "")
                    }
                    onClick={this.props.hide}
                ></div>
            </>
        );
    }
}
