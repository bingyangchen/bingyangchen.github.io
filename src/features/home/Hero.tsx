import { ButtonLink, Tooltip } from "../../components";
import BrandImage from "../../components/BrandImage/BrandImage";
import { profile } from "../../data/profile";
import { workExperienceItems } from "../../data/workExperience";
import { useTranslation } from "../../i18n/context";
import { resolveWorkExperienceCopy } from "../../i18n/content";
import { englishDictionary } from "../../i18n/dictionaries/en";
import {
  IconChevronDoubleDown,
  IconCSquareFill,
  IconEnvelope,
  IconGitHub,
  IconGraduationCap,
  IconLinkedIn,
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

  return (
    <div className={styles.main}>
      <div
        className={styles.home_atmosphere}
        aria-hidden="true"
        data-scroll-motion="atmosphere"
      />
      <div className={styles.hero_content} data-scroll-motion="hero">
        <div className={styles.portrait}>
          <Portrait />
        </div>
        <div className={styles.introduction}>
          <h1 className={styles.name}>{dictionary.name}</h1>
          <div className={styles.role}>
            <BrandImage
              src={primaryWorkExperience.company_logo}
              alt=""
              width={16}
              height={16}
              loading="eager"
            />
            <span>{`${primaryWorkCopy.job_title} @ ${primaryWorkCopy.company_name}`}</span>
          </div>
          <p className={styles.greeting}>{dictionary.home.greeting}</p>
          <div className={styles.actions}>
            <ButtonLink
              variant="brand"
              size="extra-large"
              className={styles.resume_download}
              href="/resume.pdf"
              download={`${profile.name.en} - ${profile.name["zh-TW"]}.pdf`}
            >
              {dictionary.home.downloadResume}
            </ButtonLink>
            <a className={styles.project_link} href="#projects">
              {dictionary.navigation.projects}
            </a>
          </div>
          <a
            className={styles.education_link}
            href={profile.education.economicsUrl}
            target="_blank"
            rel="noreferrer noopener"
          >
            <IconGraduationCap sideLength="16" />
            <span>{dictionary.home.role}</span>
          </a>
        </div>
        <div className={styles.contact_row}>
          <span className={styles.email_link}>
            <IconEnvelope sideLength="16" />
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
                <IconGitHub sideLength="21" />
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
                <IconLinkedIn sideLength="21" />
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
                <IconCSquareFill sideLength="21" />
              </a>
            </Tooltip>
          </div>
        </div>
      </div>
      <a className={styles.scroll_down_hint} href="#about" data-scroll-motion="hint">
        <IconChevronDoubleDown sideLength="14" />
        {dictionary.home.scrollDown}
      </a>
    </div>
  );
}
