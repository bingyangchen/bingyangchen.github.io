import { ButtonLink, Tooltip } from "../../components";
import BrandImage from "../../components/BrandImage/BrandImage";
import { profile } from "../../data/profile";
import { workExperienceItems } from "../../data/workExperience";
import { useTranslation } from "../../i18n/context";
import { resolveWorkExperienceCopy } from "../../i18n/content";
import { englishDictionary } from "../../i18n/dictionaries/en";
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
} from "../../icons";
import Portrait from "./Portrait";
import styles from "./Hero.module.scss";

export default function Hero() {
  const { dictionary } = useTranslation();
  const primaryWorkExperience = workExperienceItems[0];
  const primaryWorkCopy = resolveWorkExperienceCopy(
    englishDictionary.workExperiences[primaryWorkExperience.id],
    dictionary.workExperiences[primaryWorkExperience.id],
  );
  const jobBadgeLabel = `${primaryWorkCopy.job_title} @ ${primaryWorkCopy.company_name}`;
  const jobBadgeContent = (
    <>
      {primaryWorkExperience.company_logo ? (
        <BrandImage
          src={primaryWorkExperience.company_logo}
          alt=""
          className={styles.role_badge_company_logo}
          width={18}
          height={18}
          loading="eager"
        />
      ) : null}
      <span>{jobBadgeLabel}</span>
    </>
  );

  return (
    <div className={styles.main}>
      <div
        className={styles.home_atmosphere}
        aria-hidden="true"
        data-scroll-motion="atmosphere"
      />
      <div className={styles.business_card} data-scroll-motion="hero">
        <div className={styles.business_card_inner}>
          <div className={styles.sheet_left}>
            <Portrait />
            <div className={styles.greeting_card}>
              <div className={styles.greeting}>{dictionary.home.greeting}</div>
            </div>
          </div>
          <div className={styles.sheet_right}>
            <h1 className={styles.name}>{dictionary.name}</h1>
            <div className={styles.role_badge_row}>
              <div className={styles.role_badge}>{jobBadgeContent}</div>
              <a
                href={profile.education.economicsUrl}
                target="_blank"
                rel="noreferrer noopener"
                className={styles.role_badge}
              >
                <IconGraduationCap sideLength="16" />
                <span className={styles.role_badge_label}>{dictionary.home.role}</span>
              </a>
            </div>
            <div className={styles.contact_row}>
              <span className={styles.email_link}>
                <IconEnvelope sideLength="18" color="currentColor" />
                <span>{profile.email}</span>
              </span>
              <div className={styles.social_icons}>
                <Tooltip text="GitHub">
                  <a
                    href={profile.urls.github}
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
                    href={profile.urls.linkedin}
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
                    href={profile.urls.cake}
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
                className={styles.resume_download}
                href="/resume.pdf"
                download={`${profile.name.en} - ${profile.name["zh-TW"]}.pdf`}
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
  );
}
