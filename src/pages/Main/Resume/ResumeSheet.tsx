import styles from "./ResumeSheet.module.scss";

import React from "react";
import { IconEnvelope, IconLocation } from "../../../icons";

const ResumeSheet = React.forwardRef<HTMLDivElement, {}>(
  function ResumeSheet(_props, forwardedReference) {
    return (
      <div ref={forwardedReference} className={styles.a4} data-resume-root>
        <div className={styles.contentArea}>
          <header className={styles.header}>
            <h1 className={styles.name}>CHEN, BING-YANG (陳秉洋)</h1>
            <div className={styles.contactRow}>
              <span className={styles.contactItem}>
                <IconLocation
                  className={styles.contactIcon}
                  sideLength="12"
                  aria-hidden
                />
                Taipei, Taiwan
              </span>
              <span className={styles.contactItem}>
                <IconEnvelope
                  className={styles.contactIcon}
                  sideLength="12"
                  aria-hidden
                />
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
                  <span className={styles.roleText}>Backend Engineer．Swag</span>
                  <span className={styles.roleDates}>Jan. 2026 – Present</span>
                </div>
                <ul className={styles.bulletList}>
                  <li>
                    Modernized a high-throughput multi-domain monitoring service by
                    migrating the backend to FastAPI and PostgreSQL, reducing CPU usage
                    and improving maintainability.
                  </li>
                  <li>
                    Designed and built the backend for a new affiliate platform,
                    including partner-facing APIs, commission settlement workflows, and
                    internal tools for partner operations.
                  </li>
                  <li>
                    Introduced remote config service, enabling product teams to manage
                    feature rollouts and a/b tests with greater flexibility.
                  </li>
                </ul>
              </div>

              <div className={styles.job}>
                <div className={styles.roleRow}>
                  <span className={styles.roleText}>Senior Backend Engineer．Gaia</span>
                  <span className={styles.roleDates}>
                    Dec. 2024 – Dec. 2025．1 yr 1 mo
                  </span>
                </div>
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
                <div className={styles.roleRow}>
                  <span className={styles.roleText}>Backend Engineer．Pinkoi</span>
                  <span className={styles.roleDates}>
                    Mar. 2023 – Dec. 2024．1 yr 10 mos
                  </span>
                </div>
                <ul className={styles.bulletList}>
                  <li>
                    Designed and implemented guest shopping cart functionality, enabling
                    a seamless checkout experience for non-registered users.
                  </li>
                  <li>
                    Integrated Taiwan's Cultural Points program and ShopBack Hong Kong,
                    supporting new purchasing channels and driving order growth in
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
                <div className={styles.roleRow}>
                  <span className={styles.roleText}>Backend Engineer．Sysfeather</span>
                  <span className={styles.roleDates}>
                    Mar. 2022 – Mar. 2023．1 yr 1 mo
                  </span>
                </div>
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
                National Chengchi University{" "}
                <span className={styles.yearRange}>(2017–2021)</span>
              </p>
              <div className={styles.educationDetailRow}>
                <span className={styles.degreeText}>Bachelor of Economics</span>
                <span className={styles.gpaText}>GPA: 4.1/4.3</span>
              </div>
            </div>
            <div className={styles.bottomColumn}>
              <h2 className={styles.sectionHeading}>Social Links</h2>
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
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export default ResumeSheet;
