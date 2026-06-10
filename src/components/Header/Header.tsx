import styles from "./Header.module.scss";

import { ReactElement, useEffect, useMemo, useState } from "react";

import { Logo, NavTab } from "..";
import { useTranslation } from "../../i18n/context";

export default function Header() {
  const { dictionary } = useTranslation();
  const [isHeaderTransparent, setIsHeaderTransparent] = useState(true);

  useEffect(() => {
    function updateHeaderTransparencyFromScroll() {
      setIsHeaderTransparent(window.scrollY < window.innerHeight);
    }
    updateHeaderTransparencyFromScroll();
    window.addEventListener("scroll", updateHeaderTransparencyFromScroll, {
      passive: true,
    });
    return () => {
      window.removeEventListener("scroll", updateHeaderTransparencyFromScroll);
    };
  }, []);

  const subpageTabs = useMemo(
    (): ReactElement[] => [
      <NavTab
        tabName={dictionary.header.home}
        to="#home"
        onClick={() => {}}
        key="home"
      />,
      <NavTab
        tabName={dictionary.header.about}
        to="#about"
        onClick={() => {}}
        key="about"
      />,
      <NavTab
        tabName={dictionary.header.projects}
        to="#projects"
        onClick={() => {}}
        key="projects"
      />,
      <NavTab
        tabName={dictionary.header.blog}
        to="#blog"
        onClick={() => {}}
        key="blog"
      />,
    ],
    [dictionary],
  );

  const mainClass = isHeaderTransparent
    ? `${styles.main} ${styles.transparent}`
    : styles.main;

  return (
    <header className={mainClass}>
      <Logo size="s" />
      <div className={styles.nav_bar_tab_container}>{subpageTabs}</div>
    </header>
  );
}
