import styles from "./Skill.module.scss";

import React from "react";

interface Props {
    logo: string;
    title: string;
}

interface State {}

export default class Skill extends React.Component<Props, State> {
    public state: State;
    public constructor(props: Props) {
        super(props);
        this.state = {};
    }
    public render(): React.ReactNode {
        return (
            <div className={styles.main}>
                <img
                    className={styles.logo}
                    src={this.props.logo}
                    alt={this.props.title}
                />
                {this.props.title}
            </div>
        );
    }
}
