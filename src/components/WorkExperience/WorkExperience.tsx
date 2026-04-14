import styles from "./WorkExperience.module.scss";

interface WorkExperienceProperties {
  work_duration: string;
  job_title: string;
  company_name: string;
  company_logo?: string;
  company_link?: string;
  description: string;
  skills?: string[];
}

export default function WorkExperience({
  work_duration,
  job_title,
  company_name,
  company_logo,
  company_link,
  description,
  skills,
}: WorkExperienceProperties) {
  return (
    <div className={styles.main}>
      <div className={styles.left}>
        <div className={styles.head} />
        <div className={styles.line} />
      </div>
      <div className={styles.body}>
        <div className={styles.work_duration}>{work_duration}</div>
        <div className={styles.job_title}>{job_title}</div>
        {company_link ? (
          <a
            className={styles.company_name}
            href={company_link}
            target="_blank"
            rel="noreferrer"
          >
            {company_logo && (
              <img
                className={styles.company_logo}
                src={company_logo}
                alt={company_name}
              />
            )}
            {company_name}
          </a>
        ) : (
          <div className={styles.company_name}>
            {company_logo && (
              <img
                className={styles.company_logo}
                src={company_logo}
                alt={company_name}
              />
            )}
            {company_name}
          </div>
        )}
        <div className={styles.description}>{description}</div>
        {skills && (
          <div className={styles.tech_stack}>
            <div className={styles.title}>技能</div>
            <div className={styles.list}>
              {skills.map((skill, index) => (
                <code className={styles.skill_tag} key={index}>
                  {skill}
                </code>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
