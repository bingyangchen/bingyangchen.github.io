import airflowLogo from "../../../assets/airflow_logo.svg";
import avatar_1 from "../../../assets/avatar_1.webp";
import avatar_2 from "../../../assets/avatar_2.jpg";
import awsLogo from "../../../assets/aws_logo.svg";
import cypressLogo from "../../../assets/cypress_logo.svg";
import djangoLogo from "../../../assets/django_logo.svg";
import dockerLogo from "../../../assets/docker_logo.svg";
import elasticsearchLogo from "../../../assets/elasticsearch_logo.svg";
import fastapiLogo from "../../../assets/fastapi_logo.svg";
import gitLogo from "../../../assets/git_logo.svg";
import graphqlLogo from "../../../assets/graphql_logo.svg";
import javascriptLogo from "../../../assets/javascript_logo.svg";
import metaLogo from "../../../assets/meta_logo.svg";
import mysqlLogo from "../../../assets/mysql_logo.svg";
import nccuLogo from "../../../assets/nccu_logo.webp";
import postgresqlLogo from "../../../assets/postgresql_logo.svg";
import pythonLogo from "../../../assets/python_logo.svg";
import rabbitmqLogo from "../../../assets/rabbitmq_logo.svg";
import reactLogo from "../../../assets/react_logo.svg";
import redisLogo from "../../../assets/redis_logo.svg";
import typescriptLogo from "../../../assets/typescript_logo.svg";
import vueLogo from "../../../assets/vue_logo.svg";

import styles from "./Home.module.scss";

import React from "react";

import { Button, Skill, WorkExperience } from "../../../components";
import {
    IconBlogText,
    IconChevronDoubleDown,
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
            isShowingAllProjects: true,
        };
        this.fullGreetingText =
            "Hi there. I'm Bing-Yang Chen.\nI'm a software engineer with a focus on web application development, but I aim to expand my expertise further.\nKeep scrolling to learn more about me!";
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
                            alt="陳秉洋"
                        />
                        <img
                            className={`${styles.avatar} ${styles.back}`}
                            src={avatar_1}
                            alt="Bing-Yang Chen"
                        />
                    </div>
                    <h1 className={styles.name}>Bing-Yang Chen</h1>
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
                                <IconBlogText sideLength="30" />
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
                        Software engineer with a background in Economics, driven
                        by curiosity and a strong sense of purpose found in
                        building through code.
                    </div>
                    <hr />
                    <h3>Work Experience</h3>
                    <div className={styles.work_experience_outer}>
                        <div className={styles.block}>
                            <WorkExperience
                                work_duration="Dec 2024 ~ Present"
                                job_title="Backend Engineer"
                                company_name="Gaia"
                                company_logo="https://www.gaia.net/images/ci/apple-icon-152x152.png"
                                company_link="https://www.gaia.net/"
                                description="Developed an enterprise-grade knowledge management tool integrating LLMs and RAG to enhance information retrieval and collaboration. Refined containerization practices, achieving a nearly 50% reduction in image size and boosting CI/CD pipeline efficiency by over 60%. Established robust engineering standards by integrating unit testing, linting, and code review processes, improving system reliability and maintainability. Proactively mitigated security vulnerabilities, fortifying the system against potential threats and ensuring compliance with best practices."
                            />
                            <WorkExperience
                                work_duration="Mar 2023 ~ Dec 2024．1 yr 10 mos"
                                job_title="Backend Engineer"
                                company_name="Pinkoi"
                                company_logo="https://cdn04.pinkoi.com/pinkoi.site/general/favicon/favicon_192x192.png"
                                company_link="https://www.pinkoi.com/"
                                description="Designed and built scalable APIs, integrated third-party services, and collaborated with client-side teams to deliver new, efficient, and bug-free e-commerce features. Redesigned database schemas, revamped the system communication processes, and refactored legacy code to optimize performance and enhance stability. Optimized website SEO using AI services, achieving double-digit growth in search engine ranking. Developed internal system administration tools to enhance the efficiency of overall workflow."
                                // skills={[
                                //     "Python",
                                //     "MySQL",
                                //     "Redis",
                                //     "Elasticsearch",
                                //     "RabbitMQ",
                                //     "Vue",
                                //     "Cypress",
                                // ]}
                            />
                        </div>
                        <div className={styles.block}>
                            <WorkExperience
                                work_duration="Mar 2022 ~ Mar 2023．1 yr 1 mo"
                                job_title="Backend Engineer"
                                company_name="Sysfeather"
                                company_logo="https://www.sysfeather.com/en-US/logo-sysfeather.png"
                                company_link="https://www.sysfeather.com/"
                                description="Developed the backend for an e-commerce automated shop system with multi-tenant architecture. Spearheaded the POC for the Social Shopping Project, integrating the Facebook API to enable comment management and post lotteries, enhancing customers' social media management experience."
                                // skills={[
                                //     "Python",
                                //     "Django",
                                //     "PostgreSQL",
                                //     "Redis",
                                //     "GraphQL",
                                //     "Docker",
                                //     "React",
                                //     "Facebook API",
                                // ]}
                            />
                            <WorkExperience
                                work_duration="2020 Spring Semester"
                                job_title="Economics Course Instructor"
                                company_logo="https://www.bdsh.ntpc.edu.tw/var/file/0/1000/msys_1000_9064694_48923.png"
                                company_name="New Taipei Municipal Beida High School"
                                description="To provide graduating high school students with a deeper understanding of economics, I designed a 15-week course covering the principles of economics. The course content included discussions on current events, basic principles, and advanced microeconomic theory. This experience sharpened my presentation and slide design skills."
                            />
                        </div>
                    </div>
                    <h3>Skills</h3>
                    <div className={styles.skills_outer}>
                        <div className={styles.skills_inner}>
                            {[1, 2].map((number) => {
                                return (
                                    <div className={styles.screen} key={number}>
                                        <Skill
                                            logo={pythonLogo}
                                            title="Python"
                                        />
                                        <Skill
                                            logo={typescriptLogo}
                                            title="TypeScript"
                                        />
                                        <Skill
                                            logo={javascriptLogo}
                                            title="JavaScript"
                                        />
                                        <Skill logo={mysqlLogo} title="MySQL" />
                                        <Skill
                                            logo={postgresqlLogo}
                                            title="PostgreSQL"
                                        />
                                        <Skill logo={redisLogo} title="Redis" />
                                        <Skill
                                            logo={elasticsearchLogo}
                                            title="Elasticsearch"
                                        />
                                        <Skill
                                            logo={rabbitmqLogo}
                                            title="RabbitMQ"
                                        />
                                        <Skill
                                            logo={airflowLogo}
                                            title="Airflow"
                                        />
                                        <Skill
                                            logo={djangoLogo}
                                            title="Django"
                                        />
                                        <Skill
                                            logo={fastapiLogo}
                                            title="FastAPI"
                                        />
                                        <Skill logo={reactLogo} title="React" />
                                        <Skill logo={vueLogo} title="Vue" />
                                        <Skill logo={gitLogo} title="Git" />
                                        <Skill
                                            logo={dockerLogo}
                                            title="Docker"
                                        />
                                        <Skill logo={awsLogo} title="AWS" />
                                        <Skill
                                            logo={graphqlLogo}
                                            title="GraphQL"
                                        />
                                        <Skill
                                            logo={cypressLogo}
                                            title="Cypress"
                                        />
                                        <Skill
                                            logo={metaLogo}
                                            title="Meta API"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <h3>Education</h3>
                    <div className={styles.education_outer}>
                        <img
                            className={styles.school_logo}
                            src={nccuLogo}
                            alt="NCCU,National Chengchi University,國立政治大學,經濟學系,Department of Economics,金融科技學士學程,Financial Technology Program,陳秉洋"
                        />
                        <div className={styles.degree_list}>
                            <a
                                className={styles.degree}
                                href="https://econo.nccu.edu.tw/"
                                target="_blank"
                                rel="noreferrer"
                            >
                                National Chengchi University, Department of
                                Economics
                            </a>
                            <a
                                className={styles.degree}
                                href="https://www.ftrc.nccu.edu.tw/wordpresseng/?page_id=3053"
                                target="_blank"
                                rel="noreferrer"
                            >
                                National Chengchi University, Financial
                                Technology Program
                            </a>
                        </div>
                    </div>
                </div>
                <div
                    id="projects"
                    className={`${styles.projects} ${styles.section}`}
                    ref={this.projectsRef}
                >
                    <h2>PROJECTS</h2>
                    <div className={styles.subtitle}>
                        Keeping creativity alive through side projects -
                        exploring new ideas and building things that matter in
                        my free time. You might find something interesting here!
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
                                Track and monitor your investment performance
                                with detailed analytics.
                            </div>
                        </a>
                        <a
                            href="https://byc1999.com/path-finding-visualizer"
                            target="_blank"
                            rel="noreferrer"
                            className={`${styles.project} ${styles.path_finding}`}
                        >
                            <div className={styles.background} />
                            <div className={styles.title}>
                                Path-Finding Visualizer
                            </div>
                            <div className={styles.subtitle}>
                                Explore various pathfinding algorithms and maze
                                generation algorithms.
                            </div>
                        </a>
                        <a
                            href="https://byc1999.com/virus-spread"
                            target="_blank"
                            rel="noreferrer"
                            className={`${styles.project} ${styles.virus_spread}`}
                        >
                            <div className={styles.background} />
                            <div className={styles.title}>
                                Virus Spread Simulate
                            </div>
                            <div className={styles.subtitle}>
                                Simulate the spread of viruses under different
                                parameters and visualize the results.
                            </div>
                        </a>
                        <a
                            href="https://chromewebstore.google.com/detail/noads/mcdfnneilaagajpfcfiofdjibclkflhg"
                            target="_blank"
                            rel="noreferrer"
                            className={`${styles.project} ${styles.noads}`}
                        >
                            <div
                                className={`${styles.background} ${styles.mask}`}
                            />
                            <div className={styles.title}>Noads</div>
                            <div className={styles.subtitle}>
                                A simple ad blocker that removes specific DOM
                                elements using CSS selectors.
                            </div>
                        </a>
                        <a
                            href="https://byc1999.com/market-sim"
                            target="_blank"
                            rel="noreferrer"
                            className={`${styles.project} ${styles.market_simulate}`}
                        >
                            <div
                                className={`${styles.background} ${styles.mask}`}
                            />
                            <div className={styles.title}>Market Simulate</div>
                            <div className={styles.subtitle}>
                                Simulate supply and demand theory to see how
                                market equilibrium is achieved.
                            </div>
                        </a>
                        <a
                            href="https://byc1999.com/inventory-analyzer"
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
                                Optimize inventory management based on different
                                cost structures and sales patterns.
                            </div>
                        </a>
                        {this.state.isShowingAllProjects ? (
                            <>
                                <a
                                    href="https://byc1999.com/snake"
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`${styles.project} ${styles.snake}`}
                                >
                                    <div
                                        className={`${styles.background} ${styles.mask}`}
                                    />
                                    <div className={styles.title}>Snake</div>
                                    <div className={styles.subtitle}>
                                        A classic mobile game - can you beat the
                                        Dijkstra algorithm?
                                    </div>
                                </a>
                                <a
                                    href="https://byc1999.com/tic-tac-toe"
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
                                        Simple machine learning makes it
                                        unbeatable!
                                    </div>
                                </a>
                                <a
                                    href="https://byc1999.com/pick-coins"
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
                                        A game theory puzzle - can you find the
                                        winning strategy?
                                    </div>
                                </a>
                            </>
                        ) : null}
                    </div>
                    {/* <div className={styles.show_all_project_button_container}>
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
                                ? "顯示較少"
                                : "顯示更多"}
                        </Button>
                    </div> */}
                </div>
                <div
                    id="blog"
                    className={`${styles.blog} ${styles.section}`}
                    ref={this.blogRef}
                >
                    <h2>BLOG</h2>
                    <div className={styles.subtitle}>
                        Learning is a two-way street - I believe in both
                        absorbing knowledge and sharing insights. Here are my
                        learning notes and thoughts. Feedback and corrections
                        are always welcome!
                    </div>
                    <hr />
                    <div className={styles.blog_button_container}>
                        <a
                            href="https://blog.byc1999.com/list"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Button className="black_fill xl">
                                <IconBlogText sideLength="28" />
                                Check it out
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
