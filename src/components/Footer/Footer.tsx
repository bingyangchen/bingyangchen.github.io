import styles from "./Footer.module.scss";

import React from "react";
import { IconCSquareFill, IconGitHub, IconLinkedIn } from "../../icons";
import Logo from "../Logo/Logo";

interface Props {}

interface State {}

export default class Footer extends React.Component<Props, State> {
    public state: State;
    public constructor(props: Props) {
        super(props);
        this.state = {};
    }
    public render(): React.ReactNode {
        return (
            <footer className={styles.main}>
                <div className={styles.contact_me}>
                    <div className={styles.title}>Contact Me</div>
                    <div className={styles.body}>106208004@g.nccu.edu.tw</div>
                </div>
                <div className={styles.social_media_list}>
                    <a
                        href="https://github.com/Jamison-Chen"
                        target="_blank"
                        rel="noreferrer"
                        className={styles.social_media}
                        title="GitHub"
                    >
                        <IconGitHub sideLength="20" />
                        <span>GitHub</span>
                    </a>
                    <hr />
                    <a
                        href="https://www.linkedin.com/in/jamison-chen-3937851a5/"
                        target="_blank"
                        rel="noreferrer"
                        className={styles.social_media}
                        title="LinkedIn"
                    >
                        <IconLinkedIn sideLength="20" />
                        <span>LinkedIn</span>
                    </a>
                    <hr />
                    <a
                        href="https://www.cakeresume.com/me/BingYangChen"
                        target="_blank"
                        rel="noreferrer"
                        className={styles.social_media}
                        title="CakeResume"
                    >
                        <IconCSquareFill sideLength="20" />
                        <span>CakeResume</span>
                    </a>
                </div>
                <div className={styles.logo_container}>
                    <Logo size="s" full />
                </div>
                <div className={styles.copyright}>
                    Copyright © {new Date().getFullYear()} 陳秉洋 (Jamison Chen)
                    All rights reserved
                </div>
            </footer>
        );
    }
}
