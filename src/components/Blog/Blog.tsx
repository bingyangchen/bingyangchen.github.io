import { useId } from "react";
import { additionalArticles, featuredArticle } from "../../data/articles";
import { useTranslation } from "../../i18n/context";
import { IconArrowUpRight } from "../../icons";
import styles from "./Blog.module.scss";

function DirectoryIllustration() {
  return (
    <div className={styles.illustration} aria-hidden="true">
      <div className={styles.diagram}>
        <div className={styles.diagramLabel}>Package by layer</div>
        <div className={styles.layers}>
          {["routes/", "services/", "models/"].map((folder) => (
            <div className={styles.layer} key={folder}>
              <span className={styles.folderName}>{folder}</span>
              <span>cart.py</span>
              <span>user.py</span>
            </div>
          ))}
        </div>
        <div className={styles.reorganize}>
          <span />
          <span className={styles.diagramArrow}>↓</span>
          <span />
        </div>
        <div className={styles.diagramLabel}>Package by feature</div>
        <div className={styles.features}>
          {["cart/", "user/"].map((folder) => (
            <div className={styles.featureGroup} key={folder}>
              <span className={styles.folderName}>
                <svg viewBox="0 0 20 20" fill="none">
                  <path
                    d="M2.5 6.5V4.5h5l2 2h8v10h-15z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                </svg>
                {folder}
              </span>
              <span>router.py</span>
              <span>service.py</span>
              <span>models.py</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Blog() {
  const { dictionary, language } = useTranslation();
  const id = useId();
  const featuredCopy = dictionary.blog.articles[featuredArticle.id];

  return (
    <div className={styles.main}>
      <div className={styles.intro} data-scroll-motion="heading">
        <div className={styles.introCopy}>
          <h2>{dictionary.blog.title}</h2>
          <p>{dictionary.blog.subtitle}</p>
          {language === "en" && (
            <p className={styles.languageNote}>{dictionary.blog.articleLanguage}</p>
          )}
        </div>
        <a
          className={styles.archiveLink}
          href="https://blog.byc1999.com/list"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>{dictionary.blog.browseAll}</span>
          <IconArrowUpRight className={styles.arrow} aria-hidden="true" />
        </a>
      </div>

      <a
        className={styles.featured}
        data-scroll-motion="feature"
        href={featuredArticle.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-labelledby={`${id}-featured-title ${id}-featured-action`}
      >
        <div className={styles.featuredCopy}>
          <div className={styles.metadata}>
            <span className={styles.featuredLabel}>{dictionary.blog.featured}</span>
            <span className={styles.metadataSeparator} aria-hidden="true">
              ·
            </span>
            <span>{featuredCopy.category}</span>
          </div>
          <h3 id={`${id}-featured-title`} lang={featuredArticle.titleLanguage}>
            {featuredArticle.title}
          </h3>
          <p>{featuredCopy.summary}</p>
        </div>
        <div className={styles.featuredAction} id={`${id}-featured-action`}>
          <span>{dictionary.blog.readArticle}</span>
          <IconArrowUpRight className={styles.arrow} aria-hidden="true" />
        </div>
        <DirectoryIllustration />
      </a>

      <div className={styles.moreReading}>
        {additionalArticles.map((article) => {
          const copy = dictionary.blog.articles[article.id];
          return (
            <a
              className={styles.reading}
              data-scroll-motion="content"
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-labelledby={`${id}-${article.id}-title ${id}-${article.id}-action`}
            >
              <span className={styles.metadata}>{copy.category}</span>
              <div className={styles.readingHeading}>
                <h3 id={`${id}-${article.id}-title`} lang={article.titleLanguage}>
                  {article.title}
                </h3>
                <IconArrowUpRight className={styles.arrow} aria-hidden="true" />
              </div>
              <p>{copy.summary}</p>
              <span className={styles.readingAction} id={`${id}-${article.id}-action`}>
                {dictionary.blog.readArticle}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
