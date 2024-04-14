import avatar_1 from "../../../assets/avatar_1.png";
import avatar_2 from "../../../assets/avatar_2.jpeg";
import nccuLogo from "../../../assets/nccu_logo.png";
import pinkoiLogo from "../../../assets/pinkoi_logo.svg";
import sysfeatherLogo from "../../../assets/sysfeather_logo.svg";
import styles from "./Home.module.scss";

import React from "react";

import { Button } from "../../../components";
import {
    IconBlueprint,
    IconChevronDoubleDown,
    IconChevronDown,
    IconChevronUp,
    IconFilePerson,
    IconMedia,
} from "../../../icons";
import { IRouter, withRouter } from "../../../router";

interface Props extends IRouter {}

interface State {
    typedGreetingText: string;
    isShowingAllProjects: boolean;
}

class Home extends React.Component<Props, State> {
    public state: State;
    private fullGreetingText: string;
    private homeRef: React.RefObject<HTMLDivElement>;
    private aboutRef: React.RefObject<HTMLDivElement>;
    private projectsRef: React.RefObject<HTMLDivElement>;
    private blogRef: React.RefObject<HTMLDivElement>;
    public constructor(props: Props) {
        super(props);
        this.state = {
            typedGreetingText: "",
            isShowingAllProjects: false,
        };
        this.fullGreetingText =
            "Hi, my name is Jamison. I am currently a software engineer specializing in web application development, but I aspire to be more than that. Scroll down to know more about me!";
        this.homeRef = React.createRef();
        this.aboutRef = React.createRef();
        this.projectsRef = React.createRef();
        this.blogRef = React.createRef();
    }
    public componentDidMount(): void {
        this.typeGreetingText();
        window.addEventListener("scroll", () => {
            document.documentElement.style.backgroundColor =
                document.documentElement.scrollTop >
                document.documentElement.clientHeight
                    ? "#000"
                    : "#fff";
        });
        window.addEventListener("scroll", () => {
            let maxY = -Infinity;
            let maxAnchor: HTMLDivElement | null = null;
            [
                this.homeRef.current,
                this.aboutRef.current,
                this.projectsRef.current,
                this.blogRef.current,
            ]
                .filter((e) => e && e.getBoundingClientRect().y <= 1)
                .forEach((e) => {
                    const y = e!.getBoundingClientRect().y;
                    if (y > maxY) {
                        maxY = y;
                        maxAnchor = e;
                    }
                });
            maxAnchor = maxAnchor || this.homeRef.current!;
            const newHash = `#${maxAnchor.id}`;
            if (window.location.hash !== newHash) {
                window.history.replaceState({}, "", newHash);
            }
        });
    }
    public componentDidUpdate(): void {}
    public render(): React.ReactNode {
        return (
            <div className={styles.main}>
                <div
                    id="home"
                    className={`${styles.home} ${styles.section}`}
                    ref={this.homeRef}
                >
                    <div className={styles.avatar_container}>
                        <img
                            className={`${styles.avatar} ${styles.front}`}
                            src={avatar_2}
                            alt="avatar"
                        />
                        <img
                            className={`${styles.avatar} ${styles.back}`}
                            src={avatar_1}
                            alt="avatar"
                        />
                    </div>
                    <div className={styles.name}>Jamison</div>
                    <div className={styles.greeting}>
                        {this.state.typedGreetingText}
                    </div>
                    <div className={styles.cta_list}>
                        <a href="#about" className={styles.cta}>
                            <div className={styles.icon_container}>
                                <IconFilePerson sideLength="32" />
                            </div>
                            <div className={styles.cta_text}>About</div>
                        </a>
                        <a href="#projects" className={styles.cta}>
                            <div className={styles.icon_container}>
                                <IconMedia sideLength="30" />
                            </div>
                            <div className={styles.cta_text}>Projects</div>
                        </a>
                        <a href="#blog" className={styles.cta}>
                            <div className={styles.icon_container}>
                                <IconBlueprint sideLength="30" />
                            </div>
                            <div className={styles.cta_text}>Blog</div>
                        </a>
                    </div>
                    <div className={styles.scroll_down_hint}>
                        <IconChevronDoubleDown sideLength="14" />
                        Scroll down
                    </div>
                </div>
                <div
                    id="about"
                    className={`${styles.about} ${styles.section}`}
                    ref={this.aboutRef}
                >
                    <h2>ABOUT</h2>
                    <div className={styles.subtitle}>
                        我是一名熱愛學習與創作的軟體工程師，大學主修經濟，卻與程式設計狹路相逢，軟體開發過程中的樂趣及成就感，讓我決定往這條路持續深耕。
                    </div>
                    <hr />
                    <h3>Work Experience</h3>
                    <div className={styles.work_experience_outer}>
                        <div className={styles.block}>
                            <div className={styles.work_experience}>
                                <div className={styles.left}>
                                    <div className={styles.head} />
                                    <div className={styles.line} />
                                </div>
                                <div className={styles.main}>
                                    <div className={styles.time}>
                                        2023年3月至今
                                    </div>
                                    <div className={styles.job_title}>
                                        後端工程師
                                    </div>
                                    <a
                                        className={styles.company_name}
                                        href="https://www.pinkoi.com"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <img
                                            className={styles.company_logo}
                                            src={pinkoiLogo}
                                            alt="Pinkoi"
                                        />
                                        Pinkoi
                                    </a>
                                    <div className={styles.description}>
                                        開發與維護內部系統管理員工具，協助提升活動設定、商品推廣、訊息推播…等操作效率。主導設計與實作數項全新商業策略的後端服務，實現如主題訂閱、活動登錄…等機制。重構老舊程式碼並為其撰寫測試，有效降低系統負擔、減少錯誤，同時增加程式碼之可維護性。運用
                                        AI 工具成功優化網站
                                        SEO，提升站內商品的可見度與搜尋引擎排名。
                                    </div>
                                    <div className={styles.tech_stack}>
                                        <div className={styles.title}>技能</div>
                                        <div className={styles.list}>
                                            <code className={styles.skill_tag}>
                                                Python
                                            </code>
                                            <code className={styles.skill_tag}>
                                                Elasticsearch
                                            </code>
                                            <code className={styles.skill_tag}>
                                                MySQL
                                            </code>
                                            <code className={styles.skill_tag}>
                                                Redis
                                            </code>
                                            <code className={styles.skill_tag}>
                                                Vue
                                            </code>
                                            <code className={styles.skill_tag}>
                                                Cypress
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
                                        2022年3月~2023年3月
                                    </div>
                                    <div className={styles.job_title}>
                                        後端工程師
                                    </div>
                                    <a
                                        className={styles.company_name}
                                        href="https://www.sysfeather.com"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <img
                                            className={styles.company_logo}
                                            src={sysfeatherLogo}
                                            alt="Sysfeather,矽羽科技"
                                        />
                                        矽羽科技
                                    </a>
                                    <div className={styles.description}>
                                        參與開發多租戶架構的電商自動開店系統後端，負責
                                        Authentication 與 Rate Limit
                                        機制，確保系統的安全性與效能。負責社群購物後台管理系統的概念驗證，串接
                                        Facebook
                                        API，整合用戶的電商網站與社群帳號，提供直播管理、留言分析、訊息中心、貼文抽獎…等功能，藉此優化商家的社群平台管理體驗。
                                    </div>
                                    <div className={styles.tech_stack}>
                                        <div className={styles.title}>技能</div>
                                        <div className={styles.list}>
                                            <code className={styles.skill_tag}>
                                                Python
                                            </code>
                                            <code className={styles.skill_tag}>
                                                Django
                                            </code>
                                            <code className={styles.skill_tag}>
                                                PostgreSQL
                                            </code>
                                            <code className={styles.skill_tag}>
                                                Redis
                                            </code>
                                            <code className={styles.skill_tag}>
                                                GraphQL
                                            </code>
                                            <code className={styles.skill_tag}>
                                                React
                                            </code>
                                            <code className={styles.skill_tag}>
                                                Docker
                                            </code>
                                            <code className={styles.skill_tag}>
                                                Facebook API
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
                                        2020年2月~2020年6月
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
                                        2019年7月~2021年7月
                                    </div>
                                    <div className={styles.job_title}>
                                        程式設計外聘講師
                                    </div>
                                    <div className={styles.company_name}>
                                        猿創力程式設計學校
                                    </div>
                                    <div className={styles.description}>
                                        其實起初只是抱著想賺外快的心態，獲得錄取後發現學生的年齡層是小學，內容必須簡單，起初還有些沮喪，沒想到可愛的小學生們讓我還是愛上了這份兼職工作。
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <h3>Education</h3>
                    <div className={styles.education_outer}>
                        <img
                            className={styles.school_logo}
                            src={nccuLogo}
                            alt="NCCU,國立政治大學,經濟學系,金融科技學士學程"
                        />
                        <a
                            className={styles.name}
                            href="https://econo.nccu.edu.tw/"
                            target="_blank"
                            rel="noreferrer"
                        >
                            國立政治大學經濟學系
                        </a>
                        <a
                            className={styles.name}
                            href="https://www.ftrc.nccu.edu.tw/wordpresseng/?page_id=3053"
                            target="_blank"
                            rel="noreferrer"
                        >
                            國立政治大學金融科技學士學程
                        </a>
                    </div>
                </div>
                <div
                    id="projects"
                    className={`${styles.projects} ${styles.section}`}
                    ref={this.projectsRef}
                >
                    <h2>PROJECTS</h2>
                    <div className={styles.subtitle}>
                        不想讓自己因為工作而逐漸失去創造力，當新點子冒出來時，當然是抓緊閒暇時間做一些
                        side projects，你或許會喜歡！
                    </div>
                    <hr />
                    <div className={styles.project_list}>
                        <a
                            href="https://trade-smartly.com/welcome"
                            target="_blank"
                            rel="noreferrer"
                            className={`${styles.project} ${styles.trade_smartly}`}
                        >
                            <div
                                className={`${styles.background} ${styles.mask}`}
                            />
                            <div className={styles.title}>TradeSmartly</div>
                            <div className={styles.subtitle}>
                                你最佳的投資記帳小幫手，幫助你詳實紀錄與觀察自己的投資績效。
                            </div>
                        </a>
                        <a
                            href="https://jamison-chen.github.io/path-finding-visualize"
                            target="_blank"
                            rel="noreferrer"
                            className={`${styles.project} ${styles.path_finding}`}
                        >
                            <div className={styles.background} />
                            <div className={styles.title}>
                                Path Finding Visualize
                            </div>
                            <div className={styles.subtitle}>
                                使用 Dijkstra
                                演算法搜尋兩個物體間的最短路徑，順便拿來解迷宮。
                            </div>
                        </a>
                        <a
                            href="https://jamison-chen.github.io/virus-spread"
                            target="_blank"
                            rel="noreferrer"
                            className={`${styles.project} ${styles.virus_spread}`}
                        >
                            <div className={styles.background} />
                            <div className={styles.title}>
                                Virus Spread Simulate
                            </div>
                            <div className={styles.subtitle}>
                                簡單模擬不同參數下病毒擴散的狀況，並將統計結果視覺化。
                            </div>
                        </a>
                        <a
                            href="https://jamison-chen.github.io/wiki-prettier"
                            target="_blank"
                            rel="noreferrer"
                            className={`${styles.project} ${styles.wiki_prettier}`}
                        >
                            <div className={styles.background} />
                            <div className={styles.title}>Wiki Prettier</div>
                            <div className={styles.subtitle}>
                                你也覺得維基百科的排版使你閱讀起來不太舒服嗎？試試這個！
                            </div>
                        </a>
                        <a
                            href="https://jamison-chen.github.io/market-sim"
                            target="_blank"
                            rel="noreferrer"
                            className={`${styles.project} ${styles.market_simulate}`}
                        >
                            <div
                                className={`${styles.background} ${styles.mask}`}
                            />
                            <div className={styles.title}>Market Simulate</div>
                            <div className={styles.subtitle}>
                                使用程式模擬經濟學課本裡的供需理論，讓我們一起看看市場均衡是怎麼達成的！
                            </div>
                        </a>
                        <a
                            href="https://jamison-chen.github.io/inventory-analyzer"
                            target="_blank"
                            rel="noreferrer"
                            className={`${styles.project} ${styles.inventory_analyzer}`}
                        >
                            <div
                                className={`${styles.background} ${styles.mask}`}
                            />
                            <div className={styles.title}>
                                Inventory Analyzer
                            </div>
                            <div className={styles.subtitle}>
                                存貨管理其實就是個最佳化問題，不同成本結構與銷售狀況所適合的存貨策略可能截然不同！
                            </div>
                        </a>
                        {this.state.isShowingAllProjects ? (
                            <>
                                <a
                                    href="https://jamison-chen.github.io/snake"
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`${styles.project} ${styles.snake}`}
                                >
                                    <div
                                        className={`${styles.background} ${styles.mask}`}
                                    />
                                    <div className={styles.title}>Snake</div>
                                    <div className={styles.subtitle}>
                                        智障型手機時代的經典遊戲，你是否能贏過
                                        Dijkstra 演算法？
                                    </div>
                                </a>
                                <a
                                    href="https://jamison-chen.github.io/tic-tac-toe"
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`${styles.project} ${styles.tic_tac_toe}`}
                                >
                                    <div
                                        className={`${styles.background} ${styles.mask}`}
                                    />
                                    <div className={styles.title}>
                                        Tic Tac Toe
                                    </div>
                                    <div className={styles.subtitle}>
                                        簡單的機器學習就能讓你贏不了電腦！還記得小時候上課都跟隔壁的女同學在數學課本上玩圈圈叉叉...
                                    </div>
                                </a>
                                <a
                                    href="https://jamison-chen.github.io/pick-coins"
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`${styles.project} ${styles.pick_coins}`}
                                >
                                    <div
                                        className={`${styles.background} ${styles.mask}`}
                                    />
                                    <div className={styles.title}>
                                        Pick Coins
                                    </div>
                                    <div className={styles.subtitle}>
                                        其實這是一個結合經濟學的賽局理論的小遊戲，你能想到必勝的玩法嗎？
                                    </div>
                                </a>
                            </>
                        ) : null}
                    </div>
                    <div className={styles.show_all_project_button_container}>
                        <Button
                            className="clean l p8-15"
                            onClick={this.toggleShowAllProjectButton}
                        >
                            {this.state.isShowingAllProjects ? (
                                <IconChevronUp />
                            ) : (
                                <IconChevronDown />
                            )}
                            {this.state.isShowingAllProjects
                                ? "收合"
                                : "顯示更多"}
                        </Button>
                    </div>
                </div>
                <div
                    id="blog"
                    className={`${styles.blog} ${styles.section}`}
                    ref={this.blogRef}
                >
                    <h2>BLOG</h2>
                    <div className={styles.subtitle}>
                        「輸入與輸出並重」是學習與進步的關鍵。我整理了一些學習筆記，希望與大家分享。如有謬誤，敬請指正。
                    </div>
                    <hr />
                    <div className={styles.blog_button_container}>
                        <a
                            href="https://jamison-chen.gitbook.io/blog/"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Button className="black_fill xl">
                                <IconBlueprint sideLength="28" />
                                去看看
                            </Button>
                        </a>
                    </div>
                </div>
            </div>
        );
    }
    private typeGreetingText(): void {
        let accumulatedDelayMs = 0;
        for (let i = 0; i < this.fullGreetingText.length; i++) {
            accumulatedDelayMs += this.getGreetingTextDelayMs(i);
            setTimeout(() => {
                this.setState((state, props) => {
                    return {
                        typedGreetingText:
                            state.typedGreetingText + this.fullGreetingText[i],
                    };
                });
            }, accumulatedDelayMs);
        }
    }
    private getGreetingTextDelayMs(index: number): number {
        if (index !== 0) {
            if (this.fullGreetingText[index - 1] === ".") return 550;
            else if (this.fullGreetingText[index - 1] === ",") return 300;
        }
        return (0.2 + Math.random()) * 70;
    }
    private toggleShowAllProjectButton = (): void => {
        this.setState((state, props) => {
            return {
                isShowingAllProjects: !state.isShowingAllProjects,
            };
        });
    };
}

export default withRouter(Home);
