import styles from "./ResumeSheet.module.scss";

import React from "react";
import { profile } from "../../../data/profile";
import { workExperienceIdToFacts, type WorkExperienceId } from "../../../data/career";
import { formatWorkExperienceFacts } from "../../../i18n/workExperience";
import { IconEnvelope, IconLocation } from "../../../icons";

function JobHeading({ experienceId }: { experienceId: WorkExperienceId }) {
  const copy = formatWorkExperienceFacts(workExperienceIdToFacts[experienceId], "en");
  return (
    <div className={styles.roleRow}>
      <span className={styles.roleText}>
        {copy.job_title}
        <span className={styles.roleSeparator}> · </span>
        {copy.company_name}
      </span>
      <span className={styles.roleDates}>{copy.work_duration}</span>
    </div>
  );
}

const ResumeSheet = React.forwardRef<HTMLDivElement, {}>(
  function ResumeSheet(_props, forwardedReference) {
    React.useEffect(() => {
      let screenLanguage: string | undefined;
      const setPrintLanguage = () => {
        if (screenLanguage === undefined) {
          screenLanguage = document.documentElement.lang;
        }

        // Chromium takes the PDF catalog language from the document, not the sheet.
        document.documentElement.lang = "en";
      };
      const restoreScreenLanguage = () => {
        if (screenLanguage !== undefined) {
          document.documentElement.lang = screenLanguage;
          screenLanguage = undefined;
        }
      };
      window.addEventListener("beforeprint", setPrintLanguage);
      window.addEventListener("afterprint", restoreScreenLanguage);
      return () => {
        window.removeEventListener("beforeprint", setPrintLanguage);
        window.removeEventListener("afterprint", restoreScreenLanguage);
        restoreScreenLanguage();
      };
    }, []);

    return (
      <div ref={forwardedReference} className={styles.a4} lang="en" data-resume-root>
        <div className={styles.contentArea}>
          <header className={styles.header}>
            <h1 className={styles.name}>
              {profile.name.resume} (<span lang="zh-TW">{profile.name["zh-TW"]}</span>)
            </h1>
            <div className={styles.contactRow}>
              <span className={styles.contactItem}>
                <IconLocation
                  className={styles.contactIcon}
                  sideLength="11"
                  aria-hidden
                />
                Taipei, Taiwan
              </span>
              <span className={styles.contactItem}>
                <IconEnvelope
                  className={styles.contactIcon}
                  sideLength="11"
                  aria-hidden
                />
                <a href={`mailto:${profile.email}`}>{profile.email}</a>
              </span>
            </div>
          </header>

          <section className={styles.section}>
            <h2 className={styles.sectionHeading}>Skills</h2>
            <ul className={styles.skillCategories}>
              <li>
                <span className={styles.skillLabel}>Languages &amp; Frameworks</span>
                <span className={styles.skillDetail}>
                  Python, TypeScript, JavaScript, Dart, Django, FastAPI, React, Vue,
                  Flutter
                </span>
              </li>
              <li>
                <span className={styles.skillLabel}>Databases</span>
                <span className={styles.skillDetail}>PostgreSQL, MySQL, Redis</span>
              </li>
              <li>
                <span className={styles.skillLabel}>DevOps &amp; Cloud</span>
                <span className={styles.skillDetail}>
                  AWS, Linux, Docker, Kubernetes, Git
                </span>
              </li>
              <li>
                <span className={styles.skillLabel}>Others</span>
                <span className={styles.skillDetail}>
                  Elasticsearch, RabbitMQ, Airflow, GraphQL
                </span>
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionHeading}>Career Summary</h2>
            <div className={styles.experience}>
              <div className={styles.job}>
                <JobHeading experienceId="swag-2026" />
                <ul className={styles.bulletList}>
                  <li>
                    Built the affiliate backend from scratch with FastAPI,
                    HMAC-authenticated APIs, and idempotent credit transfers.
                  </li>
                  <li>
                    Integrated a game wallet with a PostgreSQL ledger, deduplicated
                    transactions, and automated reconciliation.
                  </li>
                  <li>
                    Migrated domain availability APIs from Flask/MongoDB to async
                    FastAPI/PostgreSQL with Redis caching.
                  </li>
                  <li>
                    Integrated GrowthBook for feature rollouts and A/B tests, with
                    configuration migration and CDN invalidation.
                  </li>
                  <li>
                    Built a Telegram video service with on-demand transcoding, signed
                    service APIs, and reusable uploads.
                  </li>
                </ul>
              </div>

              <div className={styles.job}>
                <JobHeading experienceId="gaia-2024" />
                <ul className={styles.bulletList}>
                  <li>
                    Architected the backend of a customer-facing enterprise AI knowledge
                    platform from 0 to 1, enabling conversational AI, knowledge base
                    management, RAG-powered retrieval, multimodal generation, and
                    modular MCP integrations.
                  </li>
                  <li>
                    Built and owned core platform capabilities including authentication,
                    SSO, RBAC, and file upload functionality for a customer-facing
                    product.
                  </li>
                  <li>
                    Optimized database schemas and refactored backend services, reducing
                    chat loading time by 67%.
                  </li>
                  <li>
                    Improved engineering practices by mentoring teammates, defining
                    coding standards, and systematizing code reviews, reducing new
                    engineer ramp-up time from one week to one day.
                  </li>
                </ul>
              </div>

              <div className={styles.job}>
                <JobHeading experienceId="pinkoi-2023" />
                <ul className={styles.bulletList}>
                  <li>
                    Designed and implemented guest shopping cart functionality, enabling
                    a seamless checkout experience for non-registered users.
                  </li>
                  <li>
                    Integrated Taiwan&apos;s Cultural Points program and ShopBack Hong
                    Kong, supporting new purchasing channels and driving order growth in
                    targeted markets.
                  </li>
                  <li>
                    Re-architected the free-shipping eligibility computation pipeline,
                    reducing computation by nearly 50% while ensuring promotion accuracy
                    during high-traffic campaigns.
                  </li>
                </ul>
              </div>

              <div className={styles.job}>
                <JobHeading experienceId="sysfeather-2022" />
                <ul className={styles.bulletList}>
                  <li>
                    Built backend services for a multi-tenant e-commerce platform while
                    leading the technical proof of concept for social commerce
                    integrations.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <div className={styles.bottomRow}>
            <div className={styles.bottomColumn}>
              <h2 className={styles.sectionHeading}>Education</h2>
              <p className={styles.schoolLine}>
                {profile.education.school.en}{" "}
                <span className={styles.yearRange}>
                  ({profile.education.startYear}–{profile.education.graduationYear})
                </span>
              </p>
              <div className={styles.educationDetailRow}>
                <span className={styles.degreeText}>
                  Bachelor of {profile.education.major.en}
                </span>
                <span className={styles.gpaText}>GPA: 4.1/4.3</span>
              </div>
            </div>
            <div className={styles.bottomColumn}>
              <h2 className={styles.sectionHeading}>Social Links</h2>
              <p className={styles.projectLine}>
                <span className={styles.projectLabel}>GitHub</span>
                <a href={profile.urls.github} target="_blank" rel="noreferrer">
                  {profile.urls.github.replace(/^https:\/\//, "")}
                </a>
              </p>
              <p className={styles.projectLine}>
                <span className={styles.projectLabel}>Personal Site</span>
                <a href={profile.urls.site} target="_blank" rel="noreferrer">
                  {new URL(profile.urls.site).host}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export default ResumeSheet;
