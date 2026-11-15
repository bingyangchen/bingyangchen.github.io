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
      {/* Safari can expose an external SVG's own name despite an empty alt. */}
      <img
        className={styles.logo}
        src={logo}
        alt=""
        aria-hidden="true"
        width={50}
        height={50}
        loading="lazy"
        decoding="async"
      />
      {title}
    </div>
  );
}
