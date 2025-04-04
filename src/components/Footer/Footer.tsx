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
                <div className={`${styles.section} ${styles.contact_me}`}>
                    <div className={styles.title}>Contact Me</div>
                    <div className={styles.body}>bryan.chen.429@gmail.com</div>
                </div>
                <div className={`${styles.section} ${styles.services}`}>
                    <div className={styles.title}>Services</div>
                    <div className={styles.list}>
                        <div className={styles.item}>
                            Personal Branding Website Development
                        </div>
                        <hr />
                        <div className={styles.item}>
                            Corporate Branding Website Development
                        </div>
                        <hr />
                        <div className={styles.item}>
                            Corporate Internal Management Systems
                        </div>
                        <hr />
                        <div className={styles.item}>
                            Other Web Application Development
                        </div>
                        <hr />
                        <div className={styles.item}>
                            Programming Instruction
                        </div>
                        <hr />
                        <div className={styles.item}>
                            Principles of Economics Instruction
                        </div>
                        <hr />
                    </div>
                </div>
                <div className={`${styles.section} ${styles.social_media}`}>
                    <div className={styles.title}>Social Media</div>
                    <div className={styles.list}>
                        <a
                            href="https://github.com/bingyangchen"
                            target="_blank"
                            rel="noreferrer noopener"
                            className={styles.item}
                            title="GitHub"
                        >
                            <IconGitHub sideLength="20" />
                            <span>GitHub</span>
                        </a>
                        <hr />
                        <a
                            href="https://www.linkedin.com/in/bing-yang-chen/"
                            target="_blank"
                            rel="noreferrer noopener"
                            className={styles.item}
                            title="LinkedIn"
                        >
                            <IconLinkedIn sideLength="18.5" />
                            <span>LinkedIn</span>
                        </a>
                        <hr />
                        <a
                            href="https://www.cake.me/me/BingYangChen"
                            target="_blank"
                            rel="noreferrer noopener"
                            className={styles.item}
                            title="Cake"
                        >
                            <IconCSquareFill sideLength="18.5" />
                            <span>Cake</span>
                        </a>
                        <hr />
                    </div>
                </div>
                <Logo size="s" full invert />
                <div className={`${styles.section} ${styles.copyright}`}>
                    Copyright © {new Date().getFullYear()} 陳秉洋 (Bing-Yang
                    Chen) All rights reserved
                </div>
            </footer>
        );
    }
}
