import logo from "../../assets/logo.png";
import styles from "./Logo.module.scss";

import React from "react";
import { NavLink } from "react-router-dom";

interface Props {
    size: "s" | "m" | "l";
    full?: boolean;
}

interface State {}

export default class Logo extends React.Component<Props, State> {
    public state: State;
    public constructor(props: Props) {
        super(props);
        this.state = {};
    }
    public render(): React.ReactNode {
        return (
            <NavLink
                to="/"
                className={this.className}
                onClick={() => window.scrollTo({ top: 0 })}
            >
                <img className={styles.logo} src={logo} alt="Jamison Chen" />
                {this.props.full && (
                    <div className={styles.product_name}>JamisonChen</div>
                )}
            </NavLink>
        );
    }
    private get className(): string {
        return (
            `${styles.main} ` +
            (this.props.size === "s"
                ? styles.s
                : this.props.size === "m"
                ? styles.m
                : styles.l)
        );
    }
}
