import { useRef } from "react";
import { About, Hero } from "../../../features/home";
import Blog from "../../../features/blog";
import Projects from "../../../features/projects";
import { useScrollMotion } from "../../../motion/useScrollMotion";
import styles from "./Home.module.scss";

export default function Home() {
  const motionRef = useRef<HTMLDivElement>(null);
  useScrollMotion(motionRef);

  return (
    <div className={styles.main} ref={motionRef}>
      <div
        id="home"
        className={`${styles.home} ${styles.section}`}
        tabIndex={-1}
        data-scroll-anchor=""
      >
        <Hero />
      </div>
      <div id="about" className={styles.section} tabIndex={-1}>
        <About />
      </div>
      <div id="projects" className={styles.section} tabIndex={-1}>
        <Projects />
      </div>
      <div id="blog" className={`${styles.blog} ${styles.section}`} tabIndex={-1}>
        <Blog />
      </div>
    </div>
  );
}
