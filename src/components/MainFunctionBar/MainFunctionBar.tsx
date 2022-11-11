import styles from "./MainFunctionBar.module.scss";

import React from "react";

interface Props {
    children: React.ReactNode[];
    is_active_in_short_screen: boolean;
    hide: () => void;
}

interface State {}

export default class MainFunctionBar extends React.Component<Props, State> {
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
                        (this.props.is_active_in_short_screen
                            ? " " + styles.active
                            : "")
                    }
                >
                    {this.props.children}
                </div>
                <div
                    className={
                        styles.small_screen_active_background +
                        (this.props.is_active_in_short_screen
                            ? " " + styles.active
                            : "")
                    }
                    onClick={this.props.hide}
                ></div>
            </>
        );
    }
}
