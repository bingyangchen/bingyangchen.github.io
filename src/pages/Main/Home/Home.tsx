import styles from "./Home.module.scss";

import React from "react";

import { RouterInterface, withRouter } from "../../../router";

interface PropsInterface extends RouterInterface {}

interface StateInterface {}

class Home extends React.Component<PropsInterface, StateInterface> {
    public state: StateInterface;
    public constructor(props: PropsInterface) {
        super(props);
        this.state = {};
    }
    public componentDidMount(): void {}
    public render(): React.ReactNode {
        return <div className={styles.main}></div>;
    }
}

export default withRouter(Home);
