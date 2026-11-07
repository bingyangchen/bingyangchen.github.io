import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import logo from "../../assets/logo.webp";
import { LanguageSwitcher } from "../LanguageSwitcher/LanguageSwitcher";
import Tooltip from "../Tooltip/Tooltip";
import { useTranslation } from "../../i18n/context";
import { useSectionNavigation } from "../../navigation/useSectionNavigation";
import styles from "./Header.module.scss";

export default function Header() {
  const { dictionary } = useTranslation();
  const { pathname } = useLocation();
  const activeSection = useSectionNavigation(pathname === "/");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const focusedControlRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    function closeOnOutsideClick(event: PointerEvent) {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) {
        if (headerRef.current?.contains(document.activeElement)) {
          menuButtonRef.current?.focus({ preventScroll: true });
        }
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutsideClick);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    function handleViewportChange() {
      const button = menuButtonRef.current;
      const navigation = headerRef.current?.querySelector("nav");
      if (!button || !navigation) return;
      if (getComputedStyle(button).display === "none") {
        if (focusedControlRef.current === button) {
          headerRef.current
            ?.querySelector<HTMLAnchorElement>('a[href$="#home"]')
            ?.focus({ preventScroll: true });
        }
        setIsMenuOpen(false);
      } else if (
        getComputedStyle(navigation).display === "none" &&
        navigation.contains(focusedControlRef.current)
      ) {
        button.focus({ preventScroll: true });
      }
    }
    window.addEventListener("resize", handleViewportChange);
    return () => window.removeEventListener("resize", handleViewportChange);
  }, []);

  function getSectionHref(section: string) {
    return `${pathname === "/" ? "" : "/"}#${section}`;
  }

  function handleSectionClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    section: string,
  ) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    setIsMenuOpen(false);
    document.getElementById(section)?.focus({ preventScroll: true });
  }

  return (
    <header
      className={styles.main}
      ref={headerRef}
      data-menu-open={isMenuOpen}
      onFocus={(event) => {
        focusedControlRef.current = event.target;
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          // A resize can blur a hidden control before the resize event runs.
          if (event.target.getClientRects().length > 0) {
            focusedControlRef.current = null;
          }
          setIsMenuOpen(false);
        }
      }}
    >
      <a className={styles.skip_link} href="#main-content">
        {dictionary.header.skipToContent}
      </a>
      <div className={styles.inner}>
        <Tooltip text={dictionary.header.home}>
          <a
            className={styles.identity}
            href={getSectionHref("home")}
            aria-label={dictionary.name}
            aria-current={
              pathname === "/" && activeSection === "home" ? "location" : undefined
            }
            onClick={(event) => handleSectionClick(event, "home")}
          >
            <img src={logo} width={32} height={32} alt="" />
          </a>
        </Tooltip>
        <button
          className={styles.menu_button}
          type="button"
          ref={menuButtonRef}
          aria-expanded={isMenuOpen}
          aria-controls="site-navigation"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span>
            {isMenuOpen ? dictionary.header.closeMenu : dictionary.header.openMenu}
          </span>
          <span className={styles.menu_icon} aria-hidden="true" data-open={isMenuOpen}>
            <span />
            <span />
          </span>
        </button>
        <nav
          id="site-navigation"
          className={styles.navigation}
          aria-label={dictionary.header.navigationLabel}
          data-open={isMenuOpen}
        >
          <ul className={styles.links}>
            {(["about", "projects", "blog"] as const).map((section) => (
              <li key={section}>
                <a
                  href={getSectionHref(section)}
                  aria-current={
                    pathname === "/" && activeSection === section
                      ? "location"
                      : undefined
                  }
                  onClick={(event) => handleSectionClick(event, section)}
                >
                  {dictionary.header[section]}
                </a>
              </li>
            ))}
          </ul>
          <div className={styles.language}>
            <LanguageSwitcher />
          </div>
        </nav>
      </div>
    </header>
  );
}
