import styles from "./Blog.module.scss";

import React from "react";

import { RouterInterface, withRouter } from "../../../router";

interface Props extends RouterInterface {}

interface State {}

class Blog extends React.Component<Props, State> {
    public state: State;
    public constructor(props: Props) {
        super(props);
        this.state = {};
    }
    public componentDidMount(): void {}
    public componentDidUpdate(): void {}
    public render(): React.ReactNode {
        return <div className={styles.main}></div>;
    }
}

export default withRouter(Blog);
