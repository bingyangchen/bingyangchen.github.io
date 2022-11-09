import styles from "./MainFunctionBar.module.scss";

import React from "react";

interface PropsInterface {
    children: React.ReactNode[];
    is_active_in_short_screen: boolean;
    hide: () => void;
}

interface StateInterface {}

export default class MainFunctionBar extends React.Component<
    PropsInterface,
    StateInterface
> {
    public state: StateInterface;
    public constructor(props: PropsInterface) {
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
