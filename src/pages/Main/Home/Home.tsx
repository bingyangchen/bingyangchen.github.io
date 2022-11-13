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
                            <a href="#projects" className={styles.cta_button}>
                                PROJECTS
                            </a>
                        </div>
                        <div className={styles.social_media_list}>
                            <a
                                href="https://github.com/Jamison-Chen"
                                target="_blank"
                                rel="noreferrer"
                                className={styles.social_media}
                                title="GitHub"
                            >
                                <IconGitHub side_length="20" />
                            </a>
                            <a
                                href="https://www.linkedin.com/in/jamison-chen-3937851a5/"
                                target="_blank"
                                rel="noreferrer"
                                className={styles.social_media}
                                title="LinkedIn"
                            >
                                <IconLinkedIn side_length="20" />
                            </a>
                            <a
                                href="https://www.cakeresume.com/me/BingYangChen"
                                target="_blank"
                                rel="noreferrer"
                                className={styles.social_media}
                                title="CakeResume"
                            >
                                <IconCSquareFill side_length="20" />
                            </a>
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
                >
                    <h2>ABOUT</h2>
                    <div className={styles.subtitle}>
                        大學主修經濟的我，因緣際會碰上了程式設計，軟體開發過程中的樂趣及成就感讓我決定成為一名軟體工程師。
                    </div>
                    <hr />
                    <h3>My Work Experience</h3>
                    <div className={styles.work_experience_outer}>
                        <div className={styles.block}>
                            <div className={styles.work_experience}>
                                <div className={styles.left}>
                                    <div className={styles.head} />
                                    <div className={styles.line} />
                                </div>
                                <div className={styles.main}>
                                    <div className={styles.time}>
                                        2022年3月至今
                                    </div>
                                    <div className={styles.job_title}>
                                        Python 後端工程師
                                    </div>
                                    <div className={styles.company_name}>
                                        矽羽科技
                                    </div>
                                    <div className={styles.description}>
                                        參與開發多租戶架構之電商自動開店系統後端，主要負責身份驗證機制，以及
                                        Request rate limit
                                        機制。主導社群購物後台管理系統之
                                        POC，串接 Facebook
                                        API，提供商家直播管理、商品管理、訊息管理以及抽獎等功能。
                                    </div>
                                    <div className={styles.tech_stack}>
                                        <div className={styles.title}>
                                            技術堆疊
                                        </div>
                                        <div className={styles.list}>
                                            <code className={styles.technology}>
                                                Python/Django
                                            </code>
                                            <code className={styles.technology}>
                                                PostgreSQL
                                            </code>
                                            <code className={styles.technology}>
                                                Redis
                                            </code>
                                            <code className={styles.technology}>
                                                GraphQL
                                            </code>
                                            <code className={styles.technology}>
                                                React
                                            </code>
                                            <code className={styles.technology}>
                                                Docker
                                            </code>
                                            <code className={styles.technology}>
                                                Facebook API
                                            </code>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.work_experience}>
                                <div className={styles.left}>
                                    <div className={styles.head} />
                                    <div className={styles.line} />
                                </div>
                                <div className={styles.main}>
                                    <div className={styles.time}>
                                        2020年7月－2021年1月
                                    </div>
                                    <div className={styles.job_title}>
                                        實習全端工程師
                                    </div>
                                    <div className={styles.company_name}>
                                        巨跡資訊
                                    </div>
                                    <div className={styles.description}>
                                        參與設計新產品的系統架構以及資料庫之 ER
                                        Model，同時擔任統整報告之角色。
                                        協助開發電商網站後台管理系統之「產品分類」功能以及「會員分級」功能。
                                        開發能夠辨識護照內容之影像辨識軟體，在使用者填寫個人護照相關資料時，提供其自動填入之功能。
                                        實作聊天機器人，處理與客戶間的基本問答。
                                    </div>
                                    <div className={styles.tech_stack}>
                                        <div className={styles.title}>
                                            技術堆疊
                                        </div>
                                        <div className={styles.list}>
                                            <code className={styles.technology}>
                                                Vue
                                            </code>
                                            <code className={styles.technology}>
                                                Bootstrap
                                            </code>
                                            <code className={styles.technology}>
                                                Python
                                            </code>
                                            <code className={styles.technology}>
                                                Google Tesseract
                                            </code>
                                            <code className={styles.technology}>
                                                Microsoft LUIS
                                            </code>
                                            <code className={styles.technology}>
                                                Line API
                                            </code>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={styles.block}>
                            <div className={styles.work_experience}>
                                <div className={styles.left}>
                                    <div className={styles.head} />
                                    <div className={styles.line} />
                                </div>
                                <div className={styles.main}>
                                    <div className={styles.time}>
                                        2020年2月－2021年6月
                                    </div>
                                    <div className={styles.job_title}>
                                        經濟學外聘講師
                                    </div>
                                    <div className={styles.company_name}>
                                        新北市立北大高中
                                    </div>
                                    <div className={styles.description}>
                                        為了讓即將畢業的高中生對經濟學有進一步認識，我親自設計了為期
                                        15
                                        周的經濟學原理課程，課程內容包括時事探討、基本原理，與個體進階理論。教學不但能帶來成就感，也能讓自己真正了解那個領域。製作課堂簡報也使我的簡報設計能力大幅提升。
                                    </div>
                                </div>
                            </div>
                            <div className={styles.work_experience}>
                                <div className={styles.left}>
                                    <div className={styles.head} />
                                    <div className={styles.line} />
                                </div>
                                <div className={styles.main}>
                                    <div className={styles.time}>
                                        2019年7月－2021年7月
                                    </div>
                                    <div className={styles.job_title}>
                                        程式設計外聘講師
                                    </div>
                                    <div className={styles.company_name}>
                                        猿創力程式設計學校
                                    </div>
                                    <div className={styles.description}>
                                        其實起初只是抱著想賺外快的心態，獲得錄取後發現學生的年齡層是小學，內容必須簡單，起初還有些沮喪，沒想到可愛的小學生們讓我還是愛上了這份兼職工作，
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    id="projects"
                    className={styles.about + " " + styles.section}
                    ref={this.projects_ref}
                >
                    <h2>PROJECTS</h2>
                    <div className={styles.subtitle}>
                        由於不想讓自己因為工作而逐漸失去創造力，當新點子冒出來時，當然是抓緊閒暇時間做一些
                        side projects，你或許會有興趣！
                    </div>
                    <hr />
                </div>
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
            this.projects_ref.current!.scrollIntoView();
        }
    }
}

export default withRouter(Home);
