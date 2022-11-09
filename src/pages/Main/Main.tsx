import styles from "./Main.module.scss";

import React from "react";
import { Outlet } from "react-router-dom";

import Header from "../../components/Header/Header";
import { RouterInterface, withRouter } from "../../router";

interface PropsInterface extends RouterInterface {}

interface StateInterface {}

class Main extends React.Component<PropsInterface, StateInterface> {
    public state: StateInterface;
    public constructor(props: PropsInterface) {
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
