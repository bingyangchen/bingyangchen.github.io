import styles from "./ResumeSheet.module.scss";

import React from "react";

function IconLocation(): React.ReactElement {
  return (
    <svg
      className={styles.contactIcon}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
      />
    </svg>
  );
}

function IconEnvelope(): React.ReactElement {
  return (
    <svg
      className={styles.contactIcon}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
      />
    </svg>
  );
}

const ResumeSheet = React.forwardRef<HTMLDivElement, {}>(
  function ResumeSheet(_props, forwardedReference) {
    return (
      <div ref={forwardedReference} className={styles.a4} data-resume-root>
        <div className={styles.contentArea}>
          <header className={styles.header}>
            <h1 className={styles.name}>CHEN, BING-YANG (陳秉洋)</h1>
            <div className={styles.contactRow}>
              <span className={styles.contactItem}>
                <IconLocation />
                Taipei, Taiwan
              </span>
              <span className={styles.contactItem}>
                <IconEnvelope />
                <a href="mailto:bryan.chen.429@gmail.com">bryan.chen.429@gmail.com</a>
              </span>
            </div>
          </header>

          <section className={styles.section}>
            <h2 className={styles.sectionHeading}>Skills</h2>
            <ul className={styles.skillCategories}>
              <li>
                <span className={styles.skillLabel}>Languages &amp; Frameworks</span>
                <span className={styles.skillDetail}>
                  Python, TypeScript, JavaScript, Django, FastAPI, React, Vue
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
                <div className={styles.roleRow}>
                  <span className={styles.roleText}>Backend Engineer • Swag</span>
                  <span className={styles.roleDates}>Jan. 2025 – Present</span>
                </div>
                <ul className={styles.bulletList}>
                  <li>
                    Refactored a multi-domain availability monitoring service from Flask
                    and MongoDB to FastAPI and PostgreSQL, significantly reducing
                    codebase size and CPU usage.
                  </li>
                  <li>
                    Introduced GrowthBook for feature-flag management, enabling internal
                    teams to configure flags with less friction and greater flexibility.
                  </li>
                </ul>
              </div>

              <div className={styles.job}>
                <div className={styles.roleRow}>
                  <span className={styles.roleText}>
                    Senior Backend Engineer • Gaia
                  </span>
                  <span className={styles.roleDates}>
                    Dec. 2024 – Dec. 2025 • 1 yr 1 mo
                  </span>
                </div>
                <ul className={styles.bulletList}>
                  <li>
                    Architected and drove the development of an enterprise knowledge
                    management platform from 0 to 1, leveraging LLMs to establish RAG
                    workflows that empower faster decision-making across the
                    organization.
                  </li>
                  <li>
                    Built and owned several core platform capabilities, such as
                    authentication, SSO, and role-based access control, establishing the
                    security and reliability backbone for the application.
                  </li>
                  <li>
                    Developed and introduced internal tools to streamline release
                    workflows for the DevOps team, including an environment variable
                    management tool and automated database migration utilities.
                  </li>
                  <li>
                    Provided mentorship, set engineering standards, and operationalized
                    code reviews, elevating team-wide development practices and
                    accelerating new engineer onboarding from one week to one day.
                  </li>
                </ul>
              </div>

              <div className={styles.job}>
                <div className={styles.roleRow}>
                  <span className={styles.roleText}>Backend Engineer • Pinkoi</span>
                  <span className={styles.roleDates}>
                    Mar. 2023 – Dec. 2024 • 1 yr 10 mos
                  </span>
                </div>
                <ul className={styles.bulletList}>
                  <li>
                    Designed and implemented scalable, high-performance APIs; integrated
                    third-party services; and partnered closely with frontend teams to
                    deliver production-grade e-commerce functionality.
                  </li>
                  <li>
                    Redesigned database schemas, modernized inter-service communication,
                    and eliminated legacy bottlenecks, improving system reliability and
                    throughput.
                  </li>
                  <li>
                    Built internal admin tools that automated workflows and reduced
                    manual operational overhead.
                  </li>
                </ul>
              </div>

              <div className={styles.job}>
                <div className={styles.roleRow}>
                  <span className={styles.roleText}>Backend Engineer • Sysfeather</span>
                  <span className={styles.roleDates}>
                    Mar. 2022 – Mar. 2023 • 1 yr 1 mo
                  </span>
                </div>
                <ul className={styles.bulletList}>
                  <li>
                    Developed the backend for a multi-tenant e-commerce automation
                    system.
                  </li>
                  <li>
                    Spearheaded the POC for a social shopping backend, integrating the
                    Facebook API to enable comment management and post-based lotteries.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <div className={styles.bottomRow}>
            <div className={styles.bottomColumn}>
              <h2 className={styles.sectionHeading}>Education</h2>
              <p className={styles.schoolLine}>
                National Chengchi University{" "}
                <span className={styles.yearRange}>(2017–2021)</span>
              </p>
              <p className={styles.degreeLine}>Bachelor of Economics</p>
              <p className={styles.gpaLine}>GPA: 4.1/4.3</p>
            </div>
            <div className={styles.bottomColumn}>
              <h2 className={styles.sectionHeading}>Side Projects</h2>
              <p className={styles.projectLine}>
                <span className={styles.projectLabel}>GitHub</span>
                <a
                  href="https://github.com/bingyangchen"
                  target="_blank"
                  rel="noreferrer"
                >
                  github.com/bingyangchen
                </a>
              </p>
              <p className={styles.projectLine}>
                <span className={styles.projectLabel}>Personal Site</span>
                <a href="https://byc1999.com/" target="_blank" rel="noreferrer">
                  byc1999.com
                </a>
              </p>
              <p className={styles.projectLine}>
                <span className={styles.projectLabel}>Taigu</span>
                <a href="https://taigu.tw/" target="_blank" rel="noreferrer">
                  taigu.tw
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
