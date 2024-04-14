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
                    <div className={styles.title}>合作邀約</div>
                    <div className={styles.body}>106208004@g.nccu.edu.tw</div>
                </div>
                <div className={`${styles.section} ${styles.services}`}>
                    <div className={styles.title}>服務項目</div>
                    <div className={styles.list}>
                        <div className={styles.item}>個人形象網站製作</div>
                        <hr />
                        <div className={styles.item}>公司形象網站製作</div>
                        <hr />
                        <div className={styles.item}>公司內部管理系統</div>
                        <hr />
                        <div className={styles.item}>其它應用程式開發</div>
                        <hr />
                        <div className={styles.item}>基礎程式設計教學</div>
                        <hr />
                        <div className={styles.item}>經濟學原理與實務</div>
                        <hr />
                    </div>
                </div>
                <div className={`${styles.section} ${styles.social_media}`}>
                    <div className={styles.title}>Social Media</div>
                    <div className={styles.list}>
                        <a
                            href="https://github.com/Jamison-Chen"
                            target="_blank"
                            rel="noreferrer"
                            className={styles.item}
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
                            className={styles.item}
                            title="LinkedIn"
                        >
                            <IconLinkedIn sideLength="18.5" />
                            <span>LinkedIn</span>
                        </a>
                        <hr />
                        <a
                            href="https://www.cakeresume.com/me/BingYangChen"
                            target="_blank"
                            rel="noreferrer"
                            className={styles.item}
                            title="CakeResume"
                        >
                            <IconCSquareFill sideLength="18.5" />
                            <span>CakeResume</span>
                        </a>
                        <hr />
                    </div>
                </div>
                <Logo size="s" full invert />
                <div className={`${styles.section} ${styles.copyright}`}>
                    Copyright © {new Date().getFullYear()} 陳秉洋 (Jamison Chen)
                    All rights reserved
                </div>
            </footer>
        );
    }
}
