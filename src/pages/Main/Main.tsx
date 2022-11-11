import styles from "./Main.module.scss";

import React from "react";
import { Outlet } from "react-router-dom";

import Header from "../../components/Header/Header";
import { RouterInterface, withRouter } from "../../router";

interface Props extends RouterInterface {}

interface State {}

class Main extends React.Component<Props, State> {
    public state: State;
    public constructor(props: Props) {
        super(props);
        this.state = {};
    }
    public componentDidMount(): void {}
    public render(): React.ReactNode {
        return (
            <main className={styles.main}>
                <Header />
                <Outlet />
            </main>
        );
    }
}

export default withRouter(Main);
