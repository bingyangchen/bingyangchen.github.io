import { KeyboardEvent, ReactNode, useId, useRef, useState } from "react";
import {
  leechaiAccounts,
  leechaiSettings,
  noadsInterface,
  taiguAllocation,
  taiguOverview,
} from "./artwork";
import ProjectImage from "./ProjectImage";
import { homeProjects } from "../../data/projects";
import { useTranslation } from "../../i18n/context";
import type { Language } from "../../i18n/types";
import { IconArrowUpRight } from "../../icons";
import type { Project } from "../../types";
import styles from "./Projects.module.scss";

const projectTitleToArtwork: Record<string, ReactNode> = {
  Taigu: (
    <>
      <ProjectImage className={styles.deviceMain} image={taiguOverview} />
      <ProjectImage
        className={styles.deviceSecondary}
        image={taiguAllocation}
        secondary
      />
    </>
  ),
  Noads: <ProjectImage className={styles.extension} image={noadsInterface} />,
  Leechai: (
    <>
      <ProjectImage className={styles.leechaiMain} image={leechaiAccounts} />
      <ProjectImage
        className={styles.leechaiSecondary}
        image={leechaiSettings}
        secondary
      />
    </>
  ),
};

function formatPeriod(project: Project, language: Language, present: string): string {
  const startYear = project.maintaining_time_range[0].getFullYear();
  const endYear = project.maintaining_time_range[1]?.getFullYear();
  if (startYear === endYear) return String(startYear);
  if (language === "zh-TW")
    return endYear === undefined
      ? `${startYear} 年${present}`
      : `${startYear} 年至 ${endYear} 年`;
  return `${startYear} to ${endYear ?? present}`;
}

export default function Projects() {
  const { dictionary, language } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const id = useId();

  function handleProjectKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let nextIndex: number;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % homeProjects.length;
    else if (event.key === "ArrowLeft")
      nextIndex = (index + homeProjects.length - 1) % homeProjects.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = homeProjects.length - 1;
    else return;
    event.preventDefault();
    setActiveIndex(nextIndex);
    tabRefs.current[nextIndex]?.focus({ preventScroll: true });
  }

  return (
    <div className={styles.main} data-scroll-motion="content">
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>{dictionary.projects.title}</h2>
          <p>{dictionary.projects.subtitle}</p>
        </div>
        <a
          className={styles.github}
          href="https://github.com/bingyangchen"
          target="_blank"
          rel="noopener noreferrer"
        >
          {dictionary.projects.visitGithub}
          <IconArrowUpRight aria-hidden="true" />
        </a>
      </div>
      <div
        className={styles.projectPicker}
        role="tablist"
        aria-label={dictionary.projectCommon.chooseProject}
      >
        {homeProjects.map((project, index) => (
          <button
            key={project.title}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            className={styles.projectTab}
            id={`${id}-tab-${index}`}
            type="button"
            role="tab"
            aria-controls={`${id}-panel-${index}`}
            aria-selected={index === activeIndex}
            tabIndex={index === activeIndex ? 0 : -1}
            onClick={() => setActiveIndex(index)}
            onKeyDown={(event) => handleProjectKeyDown(event, index)}
          >
            <span className={styles.projectIcon} aria-hidden="true">
              {project.icon}
            </span>
            <span>{project.title}</span>
          </button>
        ))}
      </div>
      <div className={styles.showcaseStack}>
        {homeProjects.map((project, index) => {
          const translation = dictionary.projectsData[project.title];
          const selected = index === activeIndex;
          const period = formatPeriod(
            project,
            language,
            dictionary.projectCommon.present,
          );
          const artwork = projectTitleToArtwork[project.title];
          if (!artwork) throw new Error(`Missing artwork for project ${project.title}`);
          return (
            <div
              key={project.title}
              id={`${id}-panel-${index}`}
              className={styles.showcase}
              role="tabpanel"
              aria-labelledby={`${id}-tab-${index}`}
              aria-hidden={!selected}
              tabIndex={selected ? 0 : -1}
              {...{ inert: selected ? undefined : "" }}
            >
              <div className={styles.projectIntro}>
                <h3 className={styles.projectTitle}>{project.title}</h3>
                <p className={styles.projectPurpose}>
                  {translation?.purpose || project.purpose}
                </p>
              </div>
              <figure className={styles.productStage}>
                <div className={styles.productArt}>{selected && artwork}</div>
                <figcaption className={styles.imageDescription}>
                  {translation?.image_description || project.image_description}
                </figcaption>
              </figure>
              <div className={styles.projectContent}>
                <p className={styles.description}>
                  {translation?.description || project.description}
                </p>
                <div className={styles.actions}>
                  <a
                    className={styles.visit}
                    href={project.demo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {translation?.visit_label || project.visit_label}
                    <IconArrowUpRight aria-hidden="true" />
                  </a>
                  <a
                    className={styles.source}
                    href={project.source_code_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {dictionary.projectCommon.sourceCode}
                    <IconArrowUpRight aria-hidden="true" />
                  </a>
                </div>
                <p className={styles.projectMeta}>
                  <span>{(translation?.tags || project.tags).join(" · ")}</span>
                  <span className={styles.metaSeparator} aria-hidden="true" />
                  <span
                    className={styles.period}
                    aria-label={`${dictionary.projectCommon.maintained} ${period}`}
                  >
                    {period}
                  </span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
