import styles from "./Main.module.scss";

import React from "react";
import { Outlet } from "react-router-dom";

import { Header, Footer } from "../../components";
import { IRouter, withRouter } from "../../router";

interface Props extends IRouter {}

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
                <Footer />
            </main>
        );
    }
}

export default withRouter(Main);
