import styles from "./FullLogo.module.scss";
import logo from "../../assets/logo.png";

import React from "react";
import { NavLink } from "react-router-dom";

interface Props {
    size: "s" | "m" | "l";
}

interface State {}

export default class FullLogo extends React.Component<Props, State> {
    public state: State;
    public constructor(props: Props) {
        super(props);
        this.state = {};
    }
    public render(): React.ReactNode {
        return (
            <NavLink to="/" className={this.className}>
                <img className={styles.logo} src={logo} alt="Jamison Chen" />
                <div className={styles.product_name}>JamisonChen</div>
            </NavLink>
        );
    }
    private get className(): string {
        return (
            styles.main +
            " " +
            (this.props.size === "s"
                ? styles.s
                : this.props.size === "m"
                ? styles.m
                : styles.l)
        );
    }
}
