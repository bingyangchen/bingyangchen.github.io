import styles from "./Skill.module.scss";

interface SkillProperties {
  logo: string;
  title: string;
}

export default function Skill({ logo, title }: SkillProperties) {
  return (
    <div className={styles.main}>
      <img className={styles.logo} src={logo} alt={title} />
      {title}
    </div>
  );
}
