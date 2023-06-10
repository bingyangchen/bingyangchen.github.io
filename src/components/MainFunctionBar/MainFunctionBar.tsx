import styles from "./MainFunctionBar.module.scss";

import React from "react";

interface Props {
    children: React.ReactNode[];
    isActiveInShortScreen: boolean;
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
                        (this.props.isActiveInShortScreen
                            ? " " + styles.active
                            : "")
                    }
                >
                    {this.props.children}
                </div>
                <div
                    className={
                        styles.small_screen_active_background +
                        (this.props.isActiveInShortScreen
                            ? " " + styles.active
                            : "")
                    }
                    onClick={this.props.hide}
                ></div>
            </>
        );
    }
}
