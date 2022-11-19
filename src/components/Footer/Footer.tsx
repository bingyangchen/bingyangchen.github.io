import styles from "./Footer.module.scss";

import React from "react";
import IconGitHub from "../Icons/IconGitHub";
import IconLinkedIn from "../Icons/IconLinkedIn";
import IconCSquareFill from "../Icons/IconCSquareFill";

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
            <div className={styles.main}>
                <div className={styles.social_media_list}>
                    <a
                        href="https://github.com/Jamison-Chen"
                        target="_blank"
                        rel="noreferrer"
                        className={styles.social_media}
                        title="GitHub"
                    >
                        <IconGitHub side_length="18" />
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
                        <IconLinkedIn side_length="18" />
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
                        <IconCSquareFill side_length="18" />
                        <span>CakeResume</span>
                    </a>
                </div>
                <div className={styles.copy_right}>
                    Copyright © {new Date().getFullYear()} 陳秉洋 (Jamison Chen)
                    All rights reserved
                </div>
            </div>
        );
    }
}
