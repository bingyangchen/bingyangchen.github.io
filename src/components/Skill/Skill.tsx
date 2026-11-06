import styles from "./Skill.module.scss";

interface SkillProperties {
  logo: string;
  title: string;
  motionOrder: number;
}

export default function Skill({ logo, title, motionOrder }: SkillProperties) {
  return (
    <div
      className={styles.main}
      data-scroll-motion="skill"
      data-scroll-order={motionOrder}
    >
      <img className={styles.logo} src={logo} alt={title} />
      {title}
    </div>
  );
}
