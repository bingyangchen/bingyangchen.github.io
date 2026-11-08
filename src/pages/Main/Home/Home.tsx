import avatar_1 from "../../../assets/avatar_1.webp";
import avatar_2 from "../../../assets/avatar_2.jpg";
import nccuLogo from "../../../assets/nccu_logo.webp";

import styles from "./Home.module.scss";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  Blog,
  ButtonLink,
  Projects,
  RoundButton,
  Skill,
  Tooltip,
  WorkExperience,
} from "../../../components";
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
import { useScrollMotion } from "../../../motion/useScrollMotion";

const CONTACT_EMAIL = "bryan.chen.429@gmail.com";

const SITE_URL_FOR_QR = "https://byc1999.com";

const NCCU_ECONOMICS_URL = "https://econo.nccu.edu.tw/";

export default function Home() {
  const motionRef = useRef<HTMLDivElement>(null);
  useScrollMotion(motionRef);
  const { dictionary } = useTranslation();
  const [isAvatarFlipped, setIsAvatarFlipped] = useState(false);
  const [isAvatarHoverSuppressed, setIsAvatarHoverSuppressed] = useState(false);
  const avatarPointerPositionRef = useRef<{ clientX: number; clientY: number } | null>(
    null,
  );
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const qrOpenerRef = useRef<HTMLButtonElement | null>(null);
  const qrDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const recordPointerPosition = (event: PointerEvent) => {
      avatarPointerPositionRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
      };
    };
    document.addEventListener("pointermove", recordPointerPosition, { passive: true });
    return () => document.removeEventListener("pointermove", recordPointerPosition);
  }, []);

  useEffect(() => {
    if (!isQrModalOpen) {
      return undefined;
    }
    const dialog = qrDialogRef.current!;
    const opener = qrOpenerRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [isQrModalOpen]);

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

  return (
    <>
      <div className={styles.main} ref={motionRef}>
        <div
          id="home"
          className={`${styles.home} ${styles.section}`}
          tabIndex={-1}
          data-scroll-anchor=""
        >
          <div
            className={styles.home_atmosphere}
            aria-hidden="true"
            data-scroll-motion="atmosphere"
          />
          <div className={styles.business_card} data-scroll-motion="hero">
            <div className={styles.business_card_inner}>
              <div className={styles.sheet_left}>
                <div
                  className={styles.avatar_container}
                  onPointerLeave={() => setIsAvatarHoverSuppressed(false)}
                >
                  <button
                    type="button"
                    className={styles.avatar_button}
                    aria-label={dictionary.home.flipAvatar}
                    aria-pressed={isAvatarFlipped}
                    data-hover-suppressed={isAvatarHoverSuppressed || undefined}
                    onClick={(event) => {
                      const avatarContainer = event.currentTarget.parentElement!;
                      const bounds = avatarContainer.getBoundingClientRect();
                      const pointer = avatarPointerPositionRef.current;
                      setIsAvatarFlipped((flipped) => !flipped);

                      // Closing a dialog can delay :hover restoration past a keyboard click.
                      setIsAvatarHoverSuppressed(
                        event.detail > 0 ||
                          avatarContainer.matches(":hover") ||
                          (pointer !== null &&
                            pointer.clientX >= bounds.left &&
                            pointer.clientX < bounds.right &&
                            pointer.clientY >= bounds.top &&
                            pointer.clientY < bounds.bottom),
                      );
                    }}
                  >
                    <img
                      className={`${styles.avatar} ${styles.front}`}
                      src={avatar_2}
                      alt="陳秉洋 (Bing-Yang Chen)"
                    />
                    <img
                      className={`${styles.avatar} ${styles.back}`}
                      src={avatar_1}
                      alt="陳秉洋 (Bing-Yang Chen)"
                    />
                  </button>
                  <RoundButton
                    className={styles.qr_avatar_fab}
                    hintText={dictionary.qrModal.open}
                    aria-haspopup="dialog"
                    onClick={(event) => {
                      qrOpenerRef.current = event.currentTarget;
                      setIsQrModalOpen(true);
                    }}
                  >
                    <IconQrCode sideLength="18" />
                  </RoundButton>
                </div>
                <div className={styles.greeting_card}>
                  <div className={styles.greeting}>{dictionary.home.greeting}</div>
                </div>
              </div>
              <div className={styles.sheet_right}>
                <h1 className={styles.name}>{dictionary.name}</h1>
                <div className={styles.role_badge_row}>
                  <div className={styles.role_badge}>{job_badge_content}</div>
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
                <div className={styles.contact_row}>
                  <span className={styles.email_link}>
                    <IconEnvelope sideLength="18" color="currentColor" />
                    <span>{CONTACT_EMAIL}</span>
                  </span>
                  <div className={styles.social_icons}>
                    <Tooltip text="GitHub">
                      <a
                        href="https://github.com/bingyangchen"
                        target="_blank"
                        rel="noreferrer noopener"
                        className={styles.social_icon_link}
                        aria-label="GitHub"
                      >
                        <IconGitHub sideLength="22" />
                      </a>
                    </Tooltip>
                    <Tooltip text="LinkedIn">
                      <a
                        href="https://www.linkedin.com/in/bing-yang-chen/"
                        target="_blank"
                        rel="noreferrer noopener"
                        className={styles.social_icon_link}
                        aria-label="LinkedIn"
                      >
                        <IconLinkedIn sideLength="22" />
                      </a>
                    </Tooltip>
                    <Tooltip text="Cake">
                      <a
                        href="https://www.cake.me/me/BingYangChen"
                        target="_blank"
                        rel="noreferrer noopener"
                        className={styles.social_icon_link}
                        aria-label="Cake"
                      >
                        <IconCSquareFill sideLength="22" />
                      </a>
                    </Tooltip>
                  </div>
                </div>
                <div className={styles.cta_toolbar}>
                  <ButtonLink
                    variant="brand"
                    size="extra-large"
                    bold
                    className={styles.resume_download}
                    href="/resume.pdf"
                    download="Bing-Yang Chen - 陳秉洋.pdf"
                  >
                    {dictionary.home.downloadResume}
                  </ButtonLink>
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
          <div className={styles.scroll_down_hint} data-scroll-motion="hint">
            <span className={styles.scroll_down_chevron}>
              <IconChevronDoubleDown sideLength="14" />
            </span>
            {dictionary.home.scrollDown}
          </div>
        </div>
        <div id="about" className={`${styles.about} ${styles.section}`} tabIndex={-1}>
          <h2 data-scroll-motion="heading">{dictionary.about.title}</h2>
          <div className={styles.subtitle} data-scroll-motion="heading">
            {dictionary.about.subtitle}
          </div>
          <hr data-scroll-motion="heading" />
          <h3 data-scroll-motion="heading">{dictionary.about.workExperience}</h3>
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
          <h3 data-scroll-motion="heading">{dictionary.about.skills}</h3>
          <div className={styles.skills_outer}>
            <div className={styles.skills_inner}>
              {homeSkillItems.map((skill, index) => (
                <Skill
                  key={skill.id}
                  logo={skill.logo}
                  title={skill.title}
                  motionOrder={index % 4}
                />
              ))}
            </div>
          </div>
          <h3 data-scroll-motion="heading">{dictionary.about.education}</h3>
          <div className={styles.education_outer}>
            <img
              className={styles.school_logo}
              data-scroll-motion="portrait"
              src={nccuLogo}
              alt="NCCU,National Chengchi University,國立政治大學,經濟學系,Department of Economics,金融科技學士學程,Financial Technology Program,陳秉洋"
            />
            <div className={styles.degree_list} data-scroll-motion="content">
              <a
                className={styles.degree}
                href="https://econo.nccu.edu.tw/"
                target="_blank"
                rel="noopener noreferrer"
              >
                {dictionary.about.nccuEconomics}
              </a>
              <a
                className={styles.degree}
                href="https://www.ftrc.nccu.edu.tw/wordpresseng/?page_id=3053"
                target="_blank"
                rel="noopener noreferrer"
              >
                {dictionary.about.nccuFintech}
              </a>
            </div>
          </div>
        </div>
        <div id="projects" className={styles.section} tabIndex={-1}>
          <Projects />
        </div>
        <div id="blog" className={`${styles.blog} ${styles.section}`} tabIndex={-1}>
          <Blog />
        </div>
      </div>
      {isQrModalOpen
        ? createPortal(
            <dialog
              ref={qrDialogRef}
              className={styles.qr_modal_overlay}
              aria-labelledby="qr-modal-title"
              aria-describedby="qr-modal-description"
              onCancel={(event) => {
                event.preventDefault();
                setIsQrModalOpen(false);
              }}
              onClick={(event) => {
                if (event.target === event.currentTarget) setIsQrModalOpen(false);
              }}
            >
              <button
                type="button"
                className={styles.qr_modal_close_button}
                aria-label={dictionary.qrModal.close}
                onClick={() => setIsQrModalOpen(false)}
              >
                <IconXLarge sideLength="20" />
              </button>
              <div className={styles.qr_modal_content}>
                <div className={styles.qr_modal_code_panel}>
                  <QRCodeSVG value={SITE_URL_FOR_QR} size={240} level="M" />
                </div>
                <div className={styles.qr_modal_title} id="qr-modal-title">
                  {dictionary.name}
                </div>
                <p className={styles.qr_modal_cta} id="qr-modal-description">
                  {dictionary.qrModal.scanToConnect}
                </p>
              </div>
            </dialog>,
            document.body,
          )
        : null}
    </>
  );
}
