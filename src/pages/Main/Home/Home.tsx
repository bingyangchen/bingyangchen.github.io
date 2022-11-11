import styles from "./Home.module.scss";

import React from "react";

import { RouterInterface, withRouter } from "../../../router";
import IconGitHub from "../../../components/Icons/IconGitHub";
import IconLinkedIn from "../../../components/Icons/IconLinkedIn";
import IconCSquareFill from "../../../components/Icons/IconCSquareFill";

interface Props extends RouterInterface {}

interface State {}

class Home extends React.Component<Props, State> {
    public state: State;
    private home_ref: React.RefObject<HTMLDivElement>;
    private about_ref: React.RefObject<HTMLDivElement>;
    private projects_ref: React.RefObject<HTMLDivElement>;
    public constructor(props: Props) {
        super(props);
        this.state = {};
        this.home_ref = React.createRef();
        this.about_ref = React.createRef();
        this.projects_ref = React.createRef();
    }
    public componentDidMount(): void {
        window.addEventListener("scroll", () => {
            let target = this.home_ref.current!;
            let h = target.getBoundingClientRect().height;
            let bottom = target.getBoundingClientRect().bottom;
            target.style.backgroundPosition = `45% ${Math.abs(
                0.5 * (bottom - h)
            )}px`;
        });
    }
    public componentDidUpdate(
        prevProps: Readonly<Props>,
        prevState: Readonly<State>,
        snapshot?: any
    ): void {
        this.mobile_go_to_hash();
    }
    public render(): React.ReactNode {
        return (
            <div className={styles.main}>
                <div
                    id="home"
                    className={styles.home + " " + styles.section}
                    ref={this.home_ref}
                >
                    <div className={styles.upper}>
                        <div className={styles.cta_button_list}>
                            <div className={styles.cta_button}>BLOG</div>
                            <div className={styles.cta_button}>PROJECTS</div>
                        </div>
                        <div className={styles.social_media_list}>
                            <div className={styles.social_media} title="GitHub">
                                <IconGitHub side_length="20" />
                            </div>
                            <div
                                className={styles.social_media}
                                title="LinkedIn"
                            >
                                <IconLinkedIn side_length="20" />
                            </div>
                            <div
                                className={styles.social_media}
                                title="CakeResume"
                            >
                                <IconCSquareFill side_length="20" />
                            </div>
                        </div>
                    </div>
                    <div className={styles.middle}>
                        <div>I'm Jamison Chen,</div>
                        <div>a full-stack Web App developer.</div>
                    </div>
                </div>
                <div
                    id="about"
                    className={styles.about + " " + styles.section}
                    ref={this.about_ref}
                ></div>
                <div
                    id="projects"
                    className={styles.about + " " + styles.section}
                    ref={this.projects_ref}
                ></div>
            </div>
        );
    }
    private mobile_go_to_hash(): void {
        let hash = this.props.router.location.hash;
        if (["#home", ""].includes(hash)) {
            this.home_ref.current!.scrollIntoView();
        } else if (hash === "#about") {
            this.about_ref.current!.scrollIntoView();
        } else if (hash === "#projects") {
            this.about_ref.current!.scrollIntoView();
        }
    }
}

export default withRouter(Home);
