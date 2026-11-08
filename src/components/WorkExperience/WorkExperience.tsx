import styles from "./WorkExperience.module.scss";
import BrandImage from "../BrandImage/BrandImage";

interface WorkExperienceProperties {
  work_duration: string;
  job_title: string;
  company_name: string;
  company_logo?: string;
  description: string;
}

export default function WorkExperience({
  work_duration,
  job_title,
  company_name,
  company_logo,
  description,
}: WorkExperienceProperties) {
  return (
    <div className={styles.main} data-scroll-timeline="">
      <div className={styles.left}>
        <div className={styles.head} />
        <div className={styles.line} />
      </div>
      <div className={styles.body} data-scroll-motion="content">
        <div className={styles.work_duration}>{work_duration}</div>
        <div className={styles.job_title}>{job_title}</div>
        <div className={styles.company_name}>
          {company_logo && (
            <BrandImage
              className={styles.company_logo}
              src={company_logo}
              alt={company_name}
              width={20}
              height={20}
            />
          )}
          {company_name}
        </div>
        <div className={styles.description}>{description}</div>
      </div>
    </div>
  );
}
