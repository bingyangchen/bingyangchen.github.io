import { useEffect, useState } from "react";

const SECTION_IDS = ["home", "about", "projects", "blog"] as const;
const SCROLL_IDLE_DELAY_MS = 150;
type SectionId = (typeof SECTION_IDS)[number];
type ScrollPosition = { top: number; left: number };
type ScrollDestination = { section: SectionId } | { position: ScrollPosition };

export function useSectionNavigation(isHomePage: boolean) {
  const [activeSection, setActiveSection] = useState<SectionId>("home");

  useEffect(() => {
    if (!isHomePage) return;
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    let animationFrame = 0;
    let restorationFrame = 0;
    let idleTimer: ReturnType<typeof setTimeout>;
    let clickedHash: string | undefined;
    let restorationDestination = getRestorationDestination();
    let pendingDestination = restorationDestination;
    if (restorationDestination) document.documentElement.dataset.restoringScroll = "";

    function getSectionFromHash() {
      return SECTION_IDS.find((id) => `#${id}` === window.location.hash);
    }

    function getRestorationDestination(): ScrollDestination | undefined {
      const position: ScrollPosition | undefined =
        window.history.state?.siteScrollPosition;
      if (position && Number.isFinite(position.top) && Number.isFinite(position.left)) {
        return { position };
      }
      const section = getSectionFromHash();
      return section ? { section } : undefined;
    }

    function getHeaderBottom() {
      return document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
    }

    function getDestinationTop(destination: ScrollDestination) {
      const section =
        "section" in destination ? document.getElementById(destination.section) : null;
      const top =
        "position" in destination
          ? destination.position.top
          : section
            ? section.getBoundingClientRect().top + window.scrollY - getHeaderBottom()
            : window.scrollY;
      return Math.max(
        0,
        Math.min(top, document.documentElement.scrollHeight - window.innerHeight),
      );
    }

    function getActiveSection(): SectionId {
      if (
        window.scrollY > 0 &&
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2
      )
        return SECTION_IDS[SECTION_IDS.length - 1];
      const headerBottom = getHeaderBottom();
      return SECTION_IDS.reduce<SectionId>((current, id) => {
        const section = document.getElementById(id);
        return section && section.getBoundingClientRect().top <= headerBottom + 1
          ? id
          : current;
      }, "home");
    }

    function updateActiveSection() {
      animationFrame = 0;
      if (
        pendingDestination &&
        Math.abs(window.scrollY - getDestinationTop(pendingDestination)) <= 2
      )
        pendingDestination = undefined;
      setActiveSection(getActiveSection());
    }

    function saveReadingPosition(url: string) {
      const previous: ScrollPosition | undefined =
        window.history.state?.siteScrollPosition;
      if (
        previous?.top === window.scrollY &&
        previous?.left === window.scrollX &&
        url === window.location.href
      )
        return;
      window.history.replaceState(
        {
          ...window.history.state,
          siteScrollPosition: { top: window.scrollY, left: window.scrollX },
        },
        "",
        url,
      );
    }

    function syncHashAfterScroll() {
      if (pendingDestination) {
        if (Math.abs(window.scrollY - getDestinationTop(pendingDestination)) > 2)
          return;
        pendingDestination = undefined;
      }
      const section = getActiveSection();
      setActiveSection(section);
      const url = new URL(window.location.href);
      url.hash = section;
      saveReadingPosition(url.href);
    }

    function handleScroll() {
      if (!animationFrame) animationFrame = requestAnimationFrame(updateActiveSection);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(syncHashAfterScroll, SCROLL_IDLE_DELAY_MS);
    }

    function alignRestorationDestination() {
      if (!restorationDestination) return;
      if ("position" in restorationDestination) {
        window.scrollTo({ ...restorationDestination.position, behavior: "auto" });
      } else {
        document
          .getElementById(restorationDestination.section)
          ?.scrollIntoView({ behavior: "auto", block: "start" });
      }
      updateActiveSection();
      saveReadingPosition(window.location.href);
    }

    const resizeObserver = new ResizeObserver(alignRestorationDestination);
    if (restorationDestination) resizeObserver.observe(document.body);

    function releaseRestoration() {
      restorationDestination = undefined;
      delete document.documentElement.dataset.restoringScroll;
      resizeObserver.disconnect();
      cancelAnimationFrame(restorationFrame);
    }

    function handleUserIntent() {
      releaseRestoration();
      pendingDestination = undefined;
      clickedHash = undefined;
    }

    function handleAnchorClick(event: MouseEvent) {
      handleUserIntent();
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor =
        event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank") return;
      const url = new URL(anchor.href);
      if (
        url.origin === window.location.origin &&
        url.pathname === window.location.pathname &&
        url.search === window.location.search &&
        SECTION_IDS.some((id) => `#${id}` === url.hash)
      ) {
        saveReadingPosition(window.location.href);
        if (url.hash !== window.location.hash) clickedHash = url.hash;
      }
    }

    function handleLocationChange() {
      if (clickedHash === window.location.hash) {
        const section = getSectionFromHash();
        pendingDestination = section ? { section } : undefined;
        return;
      }
      releaseRestoration();
      restorationDestination = getRestorationDestination();
      pendingDestination = restorationDestination;
      if (!restorationDestination) return;
      document.documentElement.dataset.restoringScroll = "";
      resizeObserver.observe(document.body);
      restorationFrame = requestAnimationFrame(alignRestorationDestination);
    }

    function handleHashChange() {
      handleLocationChange();
      clickedHash = undefined;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("scrollend", syncHashAfterScroll);
    window.addEventListener("resize", handleScroll);
    window.addEventListener("wheel", handleUserIntent, { passive: true });
    window.addEventListener("pointerdown", handleUserIntent);
    window.addEventListener("keydown", handleUserIntent);
    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("hashchange", handleHashChange);
    document.addEventListener("click", handleAnchorClick, true);
    restorationFrame = requestAnimationFrame(alignRestorationDestination);
    void document.fonts.ready.then(alignRestorationDestination);
    updateActiveSection();
    return () => {
      handleUserIntent();
      window.history.scrollRestoration = previousScrollRestoration;
      cancelAnimationFrame(animationFrame);
      clearTimeout(idleTimer);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scrollend", syncHashAfterScroll);
      window.removeEventListener("resize", handleScroll);
      window.removeEventListener("wheel", handleUserIntent);
      window.removeEventListener("pointerdown", handleUserIntent);
      window.removeEventListener("keydown", handleUserIntent);
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("hashchange", handleHashChange);
      document.removeEventListener("click", handleAnchorClick, true);
    };
  }, [isHomePage]);
  return activeSection;
}
