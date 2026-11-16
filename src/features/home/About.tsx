import nccuLogo from "../../assets/nccu_logo.webp";
import BrandImage from "../../components/BrandImage/BrandImage";
import { profile } from "../../data/profile";
import { homeSkillItems } from "../../data/skills";
import { workExperienceItems } from "../../data/workExperience";
import { resolveWorkExperienceCopy } from "../../i18n/content";
import { useTranslation } from "../../i18n/context";
import { englishDictionary } from "../../i18n/dictionaries/en";
import Skill from "./Skill/Skill";
import WorkExperience from "./WorkExperience/WorkExperience";
import styles from "./About.module.scss";

export default function About() {
  const { dictionary, language } = useTranslation();
  return (
    <div className={styles.main}>
      <h2 className={styles.title} data-scroll-motion="heading">
        {dictionary.about.title}
      </h2>
      <div className={styles.subtitle} data-scroll-motion="heading">
        {dictionary.about.subtitle}
      </div>
      <hr className={styles.divider} data-scroll-motion="heading" />
      <h3 className={styles.heading} data-scroll-motion="heading">
        {dictionary.about.workExperience}
      </h3>
      <div className={styles.work_experience_outer}>
        {workExperienceItems.map(({ id, ...work }) => {
          const copy = resolveWorkExperienceCopy(
            englishDictionary.workExperiences[id],
            dictionary.workExperiences[id],
          );
          return <WorkExperience key={id} {...work} {...copy} />;
        })}
      </div>
      <h3 className={styles.heading} data-scroll-motion="heading">
        {dictionary.about.skills}
      </h3>
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
      <h3 className={styles.heading} data-scroll-motion="heading">
        {dictionary.about.education}
      </h3>
      <div className={styles.education_outer}>
        <BrandImage
          className={styles.school_logo}
          data-scroll-motion="portrait"
          src={nccuLogo}
          alt=""
          width={314}
          height={103}
        />
        <div className={styles.degree_list} data-scroll-motion="content">
          <a
            className={styles.degree}
            href={profile.education.economicsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className={styles.school_name}>
              {profile.education.school[language]}
            </span>{" "}
            <span>{dictionary.about.degree}</span>
          </a>
          <a
            className={styles.program}
            href={profile.education.fintechUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {dictionary.about.fintechProgram}
          </a>
        </div>
      </div>
    </div>
  );
}
