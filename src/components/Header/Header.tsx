import styles from "./Header.module.scss";

import { ReactElement, useCallback, useEffect, useMemo, useState } from "react";

import { Logo, NavTab, RoundButton } from "..";
import { useTranslation } from "../../i18n/context";
import {
  IconBlogText,
  IconFilePerson,
  IconHomeblank,
  IconList,
  IconMedia,
} from "../../icons";

export default function Header() {
  const { dictionary } = useTranslation();
  const [isSideMenuActive, setIsSideMenuActive] = useState(false);
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
        tabIcon={<IconHomeblank sideLength="100%" />}
        tabName={dictionary.header.home}
        to="#home"
        onClick={() => {}}
        key="home"
      />,
      <NavTab
        tabIcon={<IconFilePerson sideLength="100%" />}
        tabName={dictionary.header.about}
        to="#about"
        onClick={() => {}}
        key="about"
      />,
      <NavTab
        tabIcon={<IconMedia sideLength="100%" />}
        tabName={dictionary.header.projects}
        to="#projects"
        onClick={() => {}}
        key="projects"
      />,
      <NavTab
        tabIcon={<IconBlogText sideLength="100%" />}
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

  const showSideMenu = useCallback(() => {
    setIsSideMenuActive(true);
  }, []);

  const hideSideMenu = useCallback(() => {
    setIsSideMenuActive(false);
  }, []);

  return (
    <>
      <header className={mainClass}>
        <Logo size="s" />
        <div className={styles.nav_bar_tab_container}>{subpageTabs}</div>
        <div className={styles.list_button_outer}>
          <RoundButton onClick={showSideMenu}>
            <IconList />
          </RoundButton>
        </div>
      </header>
      <div
        className={styles.side_menu + (isSideMenuActive ? ` ${styles.active}` : "")}
        onClick={hideSideMenu}
      >
        {subpageTabs}
      </div>
      <div
        className={
          styles.side_menu_background + (isSideMenuActive ? ` ${styles.active}` : "")
        }
        onClick={hideSideMenu}
      />
    </>
  );
}
