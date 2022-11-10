import styles from "./Home.module.scss";

import React from "react";

import { RouterInterface, withRouter } from "../../../router";

interface PropsInterface extends RouterInterface {}

interface StateInterface {}

class Home extends React.Component<PropsInterface, StateInterface> {
    public state: StateInterface;
    private cover_ref: React.RefObject<HTMLDivElement>;
    public constructor(props: PropsInterface) {
        super(props);
        this.state = {};
        this.cover_ref = React.createRef();
    }
    public componentDidMount(): void {
        window.addEventListener("scroll", () => {
            let target = this.cover_ref.current!;
            let h = target.getBoundingClientRect().height;
            let bottom = target.getBoundingClientRect().bottom;
            target.style.backgroundPosition = `45% ${Math.abs(
                0.5 * (bottom - h)
            )}px`;
        });
    }
    public render(): React.ReactNode {
        return (
            <div className={styles.main}>
                <div
                    id="home"
                    className={styles.home + " " + styles.section}
                    ref={this.cover_ref}
                ></div>
                <div
                    id="about"
                    className={styles.about + " " + styles.section}
                ></div>
            </div>
        );
    }
}

export default withRouter(Home);
