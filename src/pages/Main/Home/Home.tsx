import avatar_1 from "../../../assets/avatar_1.webp";
import avatar_2 from "../../../assets/avatar_2.jpg";
import nccuLogo from "../../../assets/nccu_logo.webp";

import styles from "./Home.module.scss";

import { QRCodeSVG } from "qrcode.react";
import React from "react";
import { createPortal } from "react-dom";

import {
  Button,
  ProjectCard,
  ProjectDetail,
  RoundButton,
  Skill,
  TypingGreeting,
  WorkExperience,
} from "../../../components";
import { homeProjects } from "../../../data/projects";
import { homeSkillItems } from "../../../data/skills";
import { workExperienceItems } from "../../../data/workExperience";
import {
  IconBlogText,
  IconChevronDoubleDown,
  IconCSquareFill,
  IconEnvelope,
  IconFilePerson,
  IconGitHub,
  IconGraduationCap,
  IconLinkedIn,
  IconMedia,
  IconQrCode,
  IconXLarge,
} from "../../../icons";
import { openResumePrintDialog } from "../../../resume/print";
import { IRouter, withRouter } from "../../../router";
import type { Project } from "../../../types";
import ResumeSheet from "../Resume/ResumeSheet";

const GREETING_TEXT =
  "Software engineer focused on web apps that stay maintainable after launch.";

const CONTACT_EMAIL = "bryan.chen.429@gmail.com";

const SITE_URL_FOR_QR = "https://byc1999.com";

const NCCU_ECONOMICS_URL = "https://econo.nccu.edu.tw/";

interface Props extends IRouter {}

interface State {
  activeProject: Project | null;
  isQrModalOpen: boolean;
}

class Home extends React.Component<Props, State> {
  public state: State;
  private homeRef: React.RefObject<HTMLDivElement>;
  private aboutRef: React.RefObject<HTMLDivElement>;
  private projectsRef: React.RefObject<HTMLDivElement>;
  private blogRef: React.RefObject<HTMLDivElement>;
  private projectDetailRef: React.RefObject<HTMLDivElement>;
  private qrModalEscapeListener: ((event: KeyboardEvent) => void) | undefined;
  public constructor(props: Props) {
    super(props);
    this.state = {
      activeProject: null,
      isQrModalOpen: false,
    };
    this.homeRef = React.createRef();
    this.aboutRef = React.createRef();
    this.projectsRef = React.createRef();
    this.blogRef = React.createRef();
    this.projectDetailRef = React.createRef();
  }
  public componentDidMount(): void {
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

  public componentDidUpdate(
    _previousProperties: Readonly<Props>,
    previousState: Readonly<State>,
  ): void {
    if (previousState.isQrModalOpen !== this.state.isQrModalOpen) {
      if (this.state.isQrModalOpen) {
        this.qrModalEscapeListener = (event: KeyboardEvent) => {
          if (event.key === "Escape") {
            this.setState({ isQrModalOpen: false });
          }
        };
        document.addEventListener("keydown", this.qrModalEscapeListener);
        document.body.style.overflow = "hidden";
      } else {
        if (this.qrModalEscapeListener) {
          document.removeEventListener("keydown", this.qrModalEscapeListener);
          this.qrModalEscapeListener = undefined;
        }
        document.body.style.overflow = "";
      }
    }
  }

  public componentWillUnmount(): void {
    if (this.qrModalEscapeListener) {
      document.removeEventListener("keydown", this.qrModalEscapeListener);
      this.qrModalEscapeListener = undefined;
    }
    document.body.style.overflow = "";
  }

  public render(): React.ReactNode {
    const primaryWorkExperience = workExperienceItems[0];
    const job_badge_label = `${primaryWorkExperience.job_title} @ ${primaryWorkExperience.company_name}`;
    const job_badge_content = (
      <>
        {primaryWorkExperience.company_logo ? (
          <img
            src={primaryWorkExperience.company_logo}
            alt=""
            className={styles.role_badge_company_logo}
            width={18}
            height={18}
          />
        ) : null}
        <span>{job_badge_label}</span>
      </>
    );

    return (
      <>
        <div className={styles.main}>
          <div
            id="home"
            className={`${styles.home} ${styles.section}`}
            ref={this.homeRef}
          >
            <div className={styles.home_atmosphere} aria-hidden="true" />
            <div className={styles.business_card}>
              <div className={styles.business_card_inner}>
                <div className={styles.sheet_left}>
                  <div
                    className={`${styles.avatar_container} ${styles.hero_enter_avatar}`}
                  >
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
                    <RoundButton
                      className={styles.qr_avatar_fab}
                      hintText="Show QR Code"
                      onClick={() => this.setState({ isQrModalOpen: true })}
                    >
                      <IconQrCode sideLength="18" />
                    </RoundButton>
                  </div>
                  <div
                    className={`${styles.greeting_card} ${styles.hero_enter_greeting}`}
                  >
                    <TypingGreeting
                      text={GREETING_TEXT}
                      className={styles.greeting}
                      cursorClassName={styles.cursor}
                    />
                  </div>
                </div>
                <div className={styles.sheet_right}>
                  <h1 className={`${styles.name} ${styles.hero_enter_name}`}>
                    Bing-Yang Chen
                  </h1>
                  <div
                    className={`${styles.role_badge_row} ${styles.hero_enter_badges}`}
                  >
                    {primaryWorkExperience.company_link ? (
                      <a
                        href={primaryWorkExperience.company_link}
                        target="_blank"
                        rel="noreferrer noopener"
                        className={styles.role_badge}
                      >
                        {job_badge_content}
                      </a>
                    ) : (
                      <div className={styles.role_badge}>{job_badge_content}</div>
                    )}
                    <a
                      href={NCCU_ECONOMICS_URL}
                      target="_blank"
                      rel="noreferrer noopener"
                      className={styles.role_badge}
                    >
                      <IconGraduationCap sideLength="16" />
                      <span className={styles.role_badge_label}>
                        B.A. Economics, NCCU
                      </span>
                    </a>
                  </div>
                  <div className={`${styles.contact_row} ${styles.hero_enter_contact}`}>
                    <a className={styles.email_link} href={`mailto:${CONTACT_EMAIL}`}>
                      <IconEnvelope sideLength="18" color="currentColor" />
                      <span>{CONTACT_EMAIL}</span>
                    </a>
                    <div className={styles.social_icons}>
                      <a
                        href="https://github.com/bingyangchen"
                        target="_blank"
                        rel="noreferrer noopener"
                        className={styles.social_icon_link}
                        title="GitHub"
                        aria-label="GitHub"
                      >
                        <IconGitHub sideLength="22" />
                      </a>
                      <a
                        href="https://www.linkedin.com/in/bing-yang-chen/"
                        target="_blank"
                        rel="noreferrer noopener"
                        className={styles.social_icon_link}
                        title="LinkedIn"
                        aria-label="LinkedIn"
                      >
                        <IconLinkedIn sideLength="22" />
                      </a>
                      <a
                        href="https://www.cake.me/me/BingYangChen"
                        target="_blank"
                        rel="noreferrer noopener"
                        className={styles.social_icon_link}
                        title="Cake"
                        aria-label="Cake"
                      >
                        <IconCSquareFill sideLength="22" />
                      </a>
                    </div>
                  </div>
                  <div className={`${styles.cta_toolbar} ${styles.hero_enter_cta}`}>
                    <Button
                      className={`brand_fill xl bold ${styles.resume_download_desktop_only}`}
                      onClick={this.handleDownloadResume}
                    >
                      Download Resume
                    </Button>
                    <div className={styles.nav_links}>
                      <a href="#about" className={styles.nav_ghost}>
                        <IconFilePerson sideLength="22" />
                        <span>About</span>
                      </a>
                      <a href="#projects" className={styles.nav_ghost}>
                        <IconMedia sideLength="20" />
                        <span>Projects</span>
                      </a>
                      <a href="#blog" className={styles.nav_ghost}>
                        <IconBlogText sideLength="20" />
                        <span>Blog</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div
              className={`${styles.scroll_down_hint} ${styles.hero_enter_scroll_hint}`}
            >
              <span className={styles.scroll_down_chevron}>
                <IconChevronDoubleDown sideLength="14" />
              </span>
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
              Software engineer with a background in Economics, driven by curiosity and
              a strong sense of purpose found in building through code.
            </div>
            <hr />
            <h3>Work Experience</h3>
            <div className={styles.work_experience_outer}>
              {workExperienceItems.map(({ id, ...work }) => (
                <WorkExperience key={id} {...work} />
              ))}
            </div>
            <h3>Skills</h3>
            <div className={styles.skills_outer}>
              <div className={styles.skills_inner}>
                {[1, 2].map((screenIndex) => (
                  <div className={styles.screen} key={screenIndex}>
                    {homeSkillItems.map((skill) => (
                      <Skill key={skill.id} logo={skill.logo} title={skill.title} />
                    ))}
                  </div>
                ))}
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
                  National Chengchi University, Department of Economics
                </a>
                <a
                  className={styles.degree}
                  href="https://www.ftrc.nccu.edu.tw/wordpresseng/?page_id=3053"
                  target="_blank"
                  rel="noreferrer"
                >
                  National Chengchi University, Financial Technology Program
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
              Keeping creativity alive through side projects - exploring new ideas and
              building things that matter in my free time. You might find something
              interesting here!
            </div>
            <hr />
            <div
              className={`${styles.project_detail_container} ${
                this.state.activeProject ? styles.active : ""
              }`}
              ref={this.projectDetailRef}
            >
              {this.state.activeProject && (
                <>
                  <div className={styles.button_container}>
                    <RoundButton
                      className="p-8"
                      onClick={() => this.setState({ activeProject: null })}
                    >
                      <IconXLarge sideLength="18" />
                    </RoundButton>
                  </div>
                  <ProjectDetail
                    thumbnail={this.state.activeProject.thumbnail}
                    icon={this.state.activeProject.icon}
                    title={this.state.activeProject.title}
                    description={this.state.activeProject.description}
                    tags={this.state.activeProject.tags}
                    maintaining_time_range={
                      this.state.activeProject.maintaining_time_range
                    }
                    source_code_url={this.state.activeProject.source_code_url}
                    demo_url={this.state.activeProject.demo_url}
                  />
                </>
              )}
            </div>
            <div className={styles.project_list_container}>
              {homeProjects.map((project) => {
                return (
                  <div
                    key={project.title}
                    onClick={this.handleClickProjectCard(project)}
                  >
                    <ProjectCard
                      thumbnail={
                        this.state.activeProject ? undefined : project.thumbnail
                      }
                      icon={project.icon}
                      title={project.title}
                      tags={project.tags}
                      maintaining_time_range={project.maintaining_time_range}
                    />
                  </div>
                );
              })}
            </div>
            <div className={styles.footer}>
              <a
                href="https://github.com/bingyangchen"
                target="_blank"
                rel="noreferrer"
                title="Visit My GitHub"
              >
                <Button className="primary_fill xl">
                  <IconGitHub sideLength="28" />
                  Visit My GitHub
                </Button>
              </a>
            </div>
          </div>
          <div
            id="blog"
            className={`${styles.blog} ${styles.section}`}
            ref={this.blogRef}
          >
            <h2>BLOG</h2>
            <div className={styles.subtitle}>
              Learning is a two-way street - I believe in both absorbing knowledge and
              sharing insights. Here are my learning notes and thoughts. Feedback and
              corrections are always welcome!
            </div>
            <hr />
            <div className={styles.footer}>
              <a href="https://blog.byc1999.com/list" target="_blank" rel="noreferrer">
                <Button className="primary_fill xl">
                  <IconBlogText sideLength="28" />
                  Check it out
                </Button>
              </a>
            </div>
          </div>
        </div>
        {createPortal(
          <div
            className={`${styles.resume_export_slot} resume-print-area`}
            aria-hidden="true"
          >
            <ResumeSheet />
          </div>,
          document.body,
        )}
        {this.state.isQrModalOpen
          ? createPortal(
              <div
                className={styles.qr_modal_overlay}
                role="presentation"
                onClick={() => this.setState({ isQrModalOpen: false })}
              >
                <button
                  type="button"
                  className={styles.qr_modal_close_button}
                  aria-label="Close QR code"
                  onClick={(event) => {
                    event.stopPropagation();
                    this.setState({ isQrModalOpen: false });
                  }}
                >
                  <IconXLarge sideLength="20" />
                </button>
                <div
                  className={styles.qr_modal_content}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="qr-modal-title"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className={styles.qr_modal_code_panel}>
                    <QRCodeSVG value={SITE_URL_FOR_QR} size={240} level="M" />
                  </div>
                  <div className={styles.qr_modal_title} id="qr-modal-title">
                    Bing-Yang Chen
                  </div>
                  <p className={styles.qr_modal_cta}>Scan to connect</p>
                </div>
              </div>,
              document.body,
            )
          : null}
      </>
    );
  }
  private handleDownloadResume = (): void => {
    openResumePrintDialog();
  };

  private handleClickProjectCard = (project: Project) => {
    return () => {
      setTimeout(() => {
        this.setState({ activeProject: project }, () => {
          this.projectDetailRef.current!.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      }, 250);
    };
  };
}

export default withRouter(Home);
