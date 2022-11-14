import styles from "./Main.module.scss";

import React from "react";
import { Outlet } from "react-router-dom";

import Header from "../../components/Header/Header";
import { RouterInterface, withRouter } from "../../router";
import Footer from "../../components/Footer/Footer";

interface Props extends RouterInterface {}

interface State {
    should_header_transparent: boolean;
}

class Main extends React.Component<Props, State> {
    public state: State;
    public constructor(props: Props) {
        super(props);
        this.state = {
            should_header_transparent: true,
        };
    }
    public componentDidMount(): void {
        window.addEventListener("scroll", () => {
            this.setState({
                should_header_transparent: window.scrollY < window.innerHeight,
            });
        });
    }
    public render(): React.ReactNode {
        return (
            <main className={styles.main}>
                <Header transparent={this.state.should_header_transparent} />
                <Outlet />
                <Footer />
            </main>
        );
    }
}

export default withRouter(Main);
