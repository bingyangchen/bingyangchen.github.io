import avatar_1 from "../../../assets/avatar_1.webp";
import avatar_2 from "../../../assets/avatar_2.jpg";
import nccuLogo from "../../../assets/nccu_logo.webp";

import styles from "./Home.module.scss";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
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
import { useTranslation } from "../../../i18n/context";
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
import type { Project } from "../../../types";
import ResumeSheet from "../Resume/ResumeSheet";

const CONTACT_EMAIL = "bryan.chen.429@gmail.com";

const SITE_URL_FOR_QR = "https://byc1999.com";

const NCCU_ECONOMICS_URL = "https://econo.nccu.edu.tw/";

export default function Home() {
  const { dictionary } = useTranslation();
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const homeRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const projectsRef = useRef<HTMLDivElement>(null);
  const blogRef = useRef<HTMLDivElement>(null);
  const projectDetailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleScrollForHash() {
      let maxY = -Infinity;
      let maxAnchor: HTMLDivElement | null = null;
      [homeRef.current, aboutRef.current, projectsRef.current, blogRef.current]
        .filter((element) => element && element.getBoundingClientRect().y <= 1)
        .forEach((element) => {
          const y = element!.getBoundingClientRect().y;
          if (y > maxY) {
            maxY = y;
            maxAnchor = element;
          }
        });
      maxAnchor = maxAnchor || homeRef.current!;
      const newHash = `#${maxAnchor.id}`;
      if (window.location.hash !== newHash) {
        window.history.replaceState({}, "", newHash);
      }
    }
    window.addEventListener("scroll", handleScrollForHash);
    return () => window.removeEventListener("scroll", handleScrollForHash);
  }, []);

  useEffect(() => {
    if (!isQrModalOpen) {
      return undefined;
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsQrModalOpen(false);
      }
    }
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isQrModalOpen]);

  useEffect(() => {
    if (!activeProject) {
      return;
    }
    projectDetailRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [activeProject]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const primaryWorkExperience = workExperienceItems[0];
  const primaryWorkTranslation = dictionary.workExperiences[primaryWorkExperience.id];
  const job_title =
    primaryWorkTranslation?.job_title || primaryWorkExperience.job_title;
  const company_name =
    primaryWorkTranslation?.company_name || primaryWorkExperience.company_name;
  const job_badge_label = `${job_title} @ ${company_name}`;
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

  function handleDownloadResume(): void {
    openResumePrintDialog();
  }

  function handleClickProjectCard(project: Project) {
    return () => {
      setTimeout(() => {
        setActiveProject(project);
      }, 250);
    };
  }

  return (
    <>
      <div className={styles.main}>
        <div id="home" className={`${styles.home} ${styles.section}`} ref={homeRef}>
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
                    onClick={() => setIsQrModalOpen(true)}
                  >
                    <IconQrCode sideLength="18" />
                  </RoundButton>
                </div>
                <div
                  className={`${styles.greeting_card} ${styles.hero_enter_greeting}`}
                >
                  <TypingGreeting
                    text={dictionary.home.greeting}
                    className={styles.greeting}
                    cursorClassName={styles.cursor}
                  />
                </div>
              </div>
              <div className={styles.sheet_right}>
                <h1 className={`${styles.name} ${styles.hero_enter_name}`}>
                  {dictionary.name}
                </h1>
                <div className={`${styles.role_badge_row} ${styles.hero_enter_badges}`}>
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
                      {dictionary.home.role}
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
                    onClick={handleDownloadResume}
                  >
                    {dictionary.home.downloadResume}
                  </Button>
                  <div className={styles.nav_links}>
                    <a href="#about" className={styles.nav_ghost}>
                      <IconFilePerson sideLength="22" />
                      <span>{dictionary.navigation.about}</span>
                    </a>
                    <a href="#projects" className={styles.nav_ghost}>
                      <IconMedia sideLength="20" />
                      <span>{dictionary.navigation.projects}</span>
                    </a>
                    <a href="#blog" className={styles.nav_ghost}>
                      <IconBlogText sideLength="20" />
                      <span>{dictionary.navigation.blog}</span>
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
            {dictionary.home.scrollDown}
          </div>
        </div>
        <div id="about" className={`${styles.about} ${styles.section}`} ref={aboutRef}>
          <h2>{dictionary.about.title}</h2>
          <div className={styles.subtitle}>{dictionary.about.subtitle}</div>
          <hr />
          <h3>{dictionary.about.workExperience}</h3>
          <div className={styles.work_experience_outer}>
            {workExperienceItems.map(({ id, ...work }) => {
              const translation = dictionary.workExperiences[id];
              return (
                <WorkExperience
                  key={id}
                  {...work}
                  work_duration={translation?.work_duration || work.work_duration}
                  job_title={translation?.job_title || work.job_title}
                  company_name={translation?.company_name || work.company_name}
                  description={translation?.description || work.description}
                />
              );
            })}
          </div>
          <h3>{dictionary.about.skills}</h3>
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
          <h3>{dictionary.about.education}</h3>
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
                {dictionary.about.nccuEconomics}
              </a>
              <a
                className={styles.degree}
                href="https://www.ftrc.nccu.edu.tw/wordpresseng/?page_id=3053"
                target="_blank"
                rel="noreferrer"
              >
                {dictionary.about.nccuFintech}
              </a>
            </div>
          </div>
        </div>
        <div
          id="projects"
          className={`${styles.projects} ${styles.section}`}
          ref={projectsRef}
        >
          <h2>{dictionary.projects.title}</h2>
          <div className={styles.subtitle}>{dictionary.projects.subtitle}</div>
          <hr />
          <div
            className={`${styles.project_detail_container} ${
              activeProject ? styles.active : ""
            }`}
            ref={projectDetailRef}
          >
            {activeProject && (
              <>
                <div className={styles.button_container}>
                  <RoundButton className="p-8" onClick={() => setActiveProject(null)}>
                    <IconXLarge sideLength="18" />
                  </RoundButton>
                </div>
                <ProjectDetail
                  thumbnail={activeProject.thumbnail}
                  icon={activeProject.icon}
                  title={activeProject.title}
                  description={
                    dictionary.projectsData[activeProject.title]?.description ||
                    activeProject.description
                  }
                  tags={
                    dictionary.projectsData[activeProject.title]?.tags ||
                    activeProject.tags
                  }
                  maintaining_time_range={activeProject.maintaining_time_range}
                  source_code_url={activeProject.source_code_url}
                  demo_url={activeProject.demo_url}
                />
              </>
            )}
          </div>
          <div className={styles.project_list_container}>
            {homeProjects.map((project) => {
              const translation = dictionary.projectsData[project.title];
              return (
                <div key={project.title} onClick={handleClickProjectCard(project)}>
                  <ProjectCard
                    thumbnail={activeProject ? undefined : project.thumbnail}
                    icon={project.icon}
                    title={project.title}
                    tags={translation?.tags || project.tags}
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
              title={dictionary.projects.visitGithub}
            >
              <Button className="primary_fill xl">
                <IconGitHub sideLength="28" />
                {dictionary.projects.visitGithub}
              </Button>
            </a>
          </div>
        </div>
        <div id="blog" className={`${styles.blog} ${styles.section}`} ref={blogRef}>
          <h2>{dictionary.blog.title}</h2>
          <div className={styles.subtitle}>{dictionary.blog.subtitle}</div>
          <hr />
          <div className={styles.footer}>
            <a href="https://blog.byc1999.com/list" target="_blank" rel="noreferrer">
              <Button className="primary_fill xl">
                <IconBlogText sideLength="28" />
                {dictionary.blog.checkItOut}
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
      {isQrModalOpen
        ? createPortal(
            <div
              className={styles.qr_modal_overlay}
              role="presentation"
              onClick={() => setIsQrModalOpen(false)}
            >
              <button
                type="button"
                className={styles.qr_modal_close_button}
                aria-label="Close QR code"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsQrModalOpen(false);
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
                  {dictionary.name}
                </div>
                <p className={styles.qr_modal_cta}>
                  {dictionary.qrModal.scanToConnect}
                </p>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
