import styles from "./RoundButton.module.scss";
import "./RoundButton.scss";

import React, { MouseEventHandler } from "react";

interface Props {
    children: any;
    onClick?: MouseEventHandler;
    className?: string;
    disabled?: boolean;
    hintText?: string;
}

interface State {}

export default class RoundButton extends React.Component<Props, State> {
    public state: State;
    public constructor(props: Props) {
        super(props);
        this.state = {};
    }
    public render(): React.ReactNode {
        return (
            <div
                className={
                    styles.main +
                    (this.props.disabled ? ` ${styles.disabled}` : "") +
                    (this.props.className
                        ? ` round_button ${this.props.className}`
                        : "")
                }
                onClick={
                    this.props.disabled
                        ? () => {}
                        : this.props.onClick || (() => {})
                }
            >
                {this.props.children}
                {this.props.hintText ? (
                    <div className={styles.hint_text}>
                        {this.props.hintText}
                    </div>
                ) : null}
            </div>
        );
    }
}
