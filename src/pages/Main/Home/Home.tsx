import styles from "./Home.module.scss";

import React from "react";

import { RouterInterface, withRouter } from "../../../router";
import IconGitHub from "../../../components/Icons/IconGitHub";
import IconLinkedIn from "../../../components/Icons/IconLinkedIn";
import IconCSquareFill from "../../../components/Icons/IconCSquareFill";
import { Link } from "react-router-dom";
import Button from "../../../components/Button/Button";
import IconChevronDown from "../../../components/Icons/IconChevronDown";
import IconChevronUp from "../../../components/Icons/IconChevronUp";
import IconBook from "../../../components/Icons/IconBook";

interface Props extends RouterInterface {}

interface State {
    is_showing_all_projects: boolean;
}

class Home extends React.Component<Props, State> {
    public state: State;
    private home_ref: React.RefObject<HTMLDivElement>;
    private about_ref: React.RefObject<HTMLDivElement>;
    private projects_ref: React.RefObject<HTMLDivElement>;
    public constructor(props: Props) {
        super(props);
        this.state = {
            is_showing_all_projects: false,
        };
        this.home_ref = React.createRef();
        this.about_ref = React.createRef();
        this.projects_ref = React.createRef();
    }
    public componentDidMount(): void {
        this.make_cover_photo_slow();
    }
    public componentDidUpdate(): void {}
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
                            <a href="#projects" className={styles.cta_button}>
                                PROJECTS
                            </a>
                            <Link to="/blog" className={styles.cta_button}>
                                BLOG
                            </Link>
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
                    className={styles.projects + " " + styles.section}
                    ref={this.projects_ref}
                >
                    <h2>PROJECTS</h2>
                    <div className={styles.subtitle}>
                        不想讓自己因為工作而逐漸失去創造力，當新點子冒出來時，當然是抓緊閒暇時間做一些
                        side projects，你或許會喜歡！
                    </div>
                    <hr />
                    <div className={styles.project_list}>
                        <div
                            className={
                                styles.project + " " + styles.trade_smartly
                            }
                        >
                            <div className={styles.background} />
                            <div className={styles.title}>TradeSmartly</div>
                            <div className={styles.subtitle}>
                                投資記帳小幫手，幫助你詳實紀錄與觀察自己的投資績效。
                            </div>
                        </div>
                        <div
                            className={
                                styles.project + " " + styles.path_finding
                            }
                        >
                            <div className={styles.background} />
                            <div className={styles.title}>
                                Path Finding Visualize
                            </div>
                            <div className={styles.subtitle}>
                                使用 Dijkstra
                                演算法搜尋兩個物體間的最短路徑，順便拿來解迷宮。
                            </div>
                        </div>
                        <div
                            className={
                                styles.project + " " + styles.virus_spread
                            }
                        >
                            <div className={styles.background} />
                            <div className={styles.title}>
                                Virus Spread Simulate
                            </div>
                            <div className={styles.subtitle}>
                                簡單模擬不同參數下病毒擴散的狀況，並將統計結果視覺化。
                            </div>
                        </div>
                        <div
                            className={
                                styles.project + " " + styles.wiki_prettier
                            }
                        >
                            <div className={styles.background} />
                            <div className={styles.title}>Wiki Prettier</div>
                            <div className={styles.subtitle}>
                                你也覺得維基百科的排版使你閱讀起來不太舒服嗎？試試這個！
                            </div>
                        </div>
                        <div
                            className={
                                styles.project + " " + styles.market_simulate
                            }
                        >
                            <div className={styles.background} />
                            <div className={styles.title}>Market Simulate</div>
                            <div className={styles.subtitle}>
                                透過程式模擬經濟學課本裡的供需理論，市場均衡是怎麼達成的？
                            </div>
                        </div>
                        <div
                            className={
                                styles.project + " " + styles.inventory_control
                            }
                        >
                            <div className={styles.background} />
                            <div className={styles.title}>
                                Inventory Control
                            </div>
                            <div className={styles.subtitle}>
                                存貨管理其實就是一個最佳化問題，不同的成本結構與銷售狀況所適合的存貨策略可能截然不同！
                            </div>
                        </div>
                        {this.state.is_showing_all_projects ? (
                            <>
                                <div
                                    className={
                                        styles.project +
                                        " " +
                                        styles.market_simulate
                                    }
                                >
                                    <div className={styles.background} />
                                    <div className={styles.title}>
                                        Market Simulate
                                    </div>
                                    <div className={styles.subtitle}>
                                        透過程式模擬經濟學課本裡的供需理論，市場均衡是怎麼達成的？
                                    </div>
                                </div>
                                <div
                                    className={
                                        styles.project +
                                        " " +
                                        styles.inventory_control
                                    }
                                >
                                    <div className={styles.background} />
                                    <div className={styles.title}>
                                        Inventory Control
                                    </div>
                                    <div className={styles.subtitle}>
                                        存貨管理其實就是一個最佳化問題，不同的成本結構與銷售狀況所適合的存貨策略可能截然不同！
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </div>
                    <div className={styles.show_all_project_button_container}>
                        <Button
                            className="clean l p8-15"
                            onClick={this.toggle_show_all_project_button}
                        >
                            {this.state.is_showing_all_projects ? (
                                <IconChevronUp side_length="16" />
                            ) : (
                                <IconChevronDown side_length="16" />
                            )}
                            {this.state.is_showing_all_projects
                                ? "收合"
                                : "顯示更多"}
                        </Button>
                    </div>
                </div>
                <div id="blog" className={styles.blog + " " + styles.section}>
                    <h2>BLOG</h2>
                    <div className={styles.subtitle}>
                        「輸入與輸出並重」是學習的的不二法門，這裡整理了一些我覺得值得分享的學習筆記，如內容有謬誤，請不吝指教。
                    </div>
                    <hr />
                    <div className={styles.blog_button_container}>
                        <Link to="/blog">
                            <Button className="black_fill border l">
                                <IconBook side_length="16" />
                                去看看
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }
    private make_cover_photo_slow(): void {
        window.addEventListener("scroll", () => {
            let target = this.home_ref.current;
            if (target) {
                let h = target.getBoundingClientRect().height;
                let bottom = target.getBoundingClientRect().bottom;
                target.style.backgroundPosition = `45% ${Math.abs(
                    0.5 * (bottom - h)
                )}px`;
            }
        });
    }
    private toggle_show_all_project_button = (): void => {
        this.setState((state, props) => {
            return {
                is_showing_all_projects: !state.is_showing_all_projects,
            };
        });
    };
}

export default withRouter(Home);
