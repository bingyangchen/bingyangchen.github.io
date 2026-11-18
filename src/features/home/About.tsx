import { useId, useState } from "react";
import { aboutTopics, photographs } from "../../data/about";
import { resumeDownload } from "../../data/profile";
import { useTranslation } from "../../i18n/context";
import { IconFilePerson } from "../../icons";
import { useAboutReading } from "./useAboutReading";
import styles from "./About.module.scss";

const photoSizes = {
  street: styles.streetSizes,
  architecture: styles.pairSizes,
  coast: styles.pairSizes,
  passage: styles.passageSizes,
};

function Photograph({
  photo,
  description,
}: {
  photo: (typeof photographs)[number];
  description: string;
}) {
  const [unavailable, setUnavailable] = useState(false);
  return (
    <figure
      className={styles.photograph}
      data-photo={photo.id}
      data-unavailable={unavailable || undefined}
      role="img"
      aria-label={description}
      style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
    >
      <img
        src={photo.medium}
        srcSet={`${photo.small} 480w, ${photo.medium} 960w, ${photo.large} 1440w`}
        sizes={photoSizes[photo.id]}
        width={photo.width}
        height={photo.height}
        loading="lazy"
        decoding="async"
        alt={description}
        aria-hidden="true"
        onError={() => setUnavailable(true)}
        onLoad={() => setUnavailable(false)}
      />
      {unavailable && <figcaption aria-hidden="true">{description}</figcaption>}
    </figure>
  );
}

export default function About() {
  const { dictionary, language } = useTranslation();
  const copy = dictionary.about;
  const id = useId();
  const {
    section,
    rail,
    stage,
    focusedJump,
    activeTopic,
    enhanced,
    preserveFocus,
    jumpToChapter,
  } = useAboutReading();

  return (
    <section
      id="about"
      ref={section}
      tabIndex={-1}
      aria-label={dictionary.navigation.about}
      className={styles.main}
      data-enhanced={enhanced}
      data-language={language}
    >
      <div className={styles.story}>
        <div className={styles.backdrop} aria-hidden="true">
          <div className={styles.background_stage}>
            <svg viewBox="0 0 1536 900" preserveAspectRatio="none">
              <ellipse cx="-30" cy="-70" rx="820" ry="1030" />
            </svg>
            <svg className={styles.thread} viewBox="0 0 760 900">
              <path d="M180 790C550 760 350 350 720 350" />
              <circle cx="720" cy="350" r="5" />
            </svg>
          </div>
        </div>
        <div className={styles.question_rail} ref={rail}>
          <div className={styles.question_stage} ref={stage}>
            <div className={styles.visual_questions} aria-hidden="true">
              {aboutTopics.map((topic) => (
                <div
                  className={styles.visual_question}
                  key={topic}
                  data-question={topic}
                  data-active={activeTopic === topic}
                >
                  {copy.topics[topic].question.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </div>
              ))}
            </div>
            <nav
              className={styles.chapter_navigation}
              aria-label={copy.navigation}
              onFocus={(event) => {
                if (event.target instanceof HTMLButtonElement)
                  focusedJump.current = event.target;
              }}
              onBlur={() => {
                preserveFocus();
                focusedJump.current = null;
              }}
            >
              {aboutTopics.map((topic) => (
                <button
                  type="button"
                  key={topic}
                  aria-current={activeTopic === topic ? "step" : undefined}
                  aria-controls={`${id}-${topic}`}
                  aria-label={`${copy.jump} ${copy.topics[topic].label}`}
                  onClick={() => jumpToChapter(`${id}-${topic}`)}
                >
                  <span>{copy.topics[topic].label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
        <div className={styles.chapters}>
          {aboutTopics.map((topic) => (
            <article
              id={`${id}-${topic}`}
              className={styles.chapter}
              data-chapter={topic}
              key={topic}
              tabIndex={-1}
            >
              <h2 className={styles.chapter_heading}>
                {copy.topics[topic].question.join(language === "en" ? " " : "")}
              </h2>
              <div className={styles.answer}>
                <p>{copy.topics[topic].answer}</p>
              </div>
              {topic === "origin" && (
                <p className={styles.continue}>
                  {copy.continue}
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 4v15m-5-5 5 5 5-5" />
                  </svg>
                </p>
              )}
              {topic === "work" && (
                <a className={styles.resume} {...resumeDownload}>
                  <IconFilePerson sideLength="22" />
                  <span>{copy.resume}</span>
                </a>
              )}
              {topic === "curiosity" && (
                <div className={styles.photographs}>
                  {photographs.map((photo) => (
                    <Photograph
                      key={photo.id}
                      photo={photo}
                      description={copy.photoAlt[photo.id]}
                    />
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
