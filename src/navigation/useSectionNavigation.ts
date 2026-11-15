import { useEffect, useState } from "react";
import { getActivatedSection } from "./links";
import { SECTION_IDS, parseSectionHash, type SectionId } from "./sections";
import {
  resolveRestorationState,
  parseReadingPosition,
  transitionNavigation,
  type NavigationEvent,
  type ScrollDestination,
} from "./state";

const SCROLL_IDLE_DELAY_MS = 150;
const POSITION_TOLERANCE_PX = 2;

export function useSectionNavigation(isHomePage: boolean) {
  const [activeSection, setActiveSection] = useState<SectionId>("home");

  useEffect(() => {
    if (!isHomePage) return;
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    let state = resolveRestorationState(window.history.state, window.location.hash);
    let disposed = false;
    let animationFrame = 0;
    let restorationFrame = 0;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    const resizeObserver = new ResizeObserver(scheduleRestoration);

    function updateRestorationResources() {
      if (state.mode === "restoring") {
        document.documentElement.dataset.restoringScroll = "";
        resizeObserver.observe(document.body);
        scheduleRestoration();
      } else {
        delete document.documentElement.dataset.restoringScroll;
        resizeObserver.disconnect();
        cancelAnimationFrame(restorationFrame);
        restorationFrame = 0;
      }
    }

    function handleNavigationEvent(event: NavigationEvent) {
      const next = transitionNavigation(state, event);
      if (next === state) return;
      const previous = state;
      state = next;
      if (
        previous.mode !== state.mode &&
        (previous.mode === "restoring" || state.mode === "restoring")
      )
        updateRestorationResources();
      else if (
        previous.mode === "restoring" &&
        state.mode === "restoring" &&
        previous.destination !== state.destination
      )
        scheduleRestoration();
    }

    function getHeaderBottom() {
      return document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
    }

    function getDestinationPosition(destination: ScrollDestination) {
      const section =
        "section" in destination ? document.getElementById(destination.section) : null;
      const top =
        "position" in destination
          ? destination.position.top
          : section
            ? section.getBoundingClientRect().top + window.scrollY - getHeaderBottom()
            : window.scrollY;
      return {
        top: Math.max(
          0,
          Math.min(top, document.documentElement.scrollHeight - window.innerHeight),
        ),
        left:
          "position" in destination
            ? Math.max(
                0,
                Math.min(
                  destination.position.left,
                  document.documentElement.scrollWidth - window.innerWidth,
                ),
              )
            : window.scrollX,
      };
    }

    function isAtDestination(destination: ScrollDestination) {
      const position = getDestinationPosition(destination);
      return (
        Math.abs(window.scrollY - position.top) <= POSITION_TOLERANCE_PX &&
        Math.abs(window.scrollX - position.left) <= POSITION_TOLERANCE_PX
      );
    }

    function getActiveSection(): SectionId {
      if (
        window.scrollY > 0 &&
        window.scrollY + window.innerHeight >=
          document.documentElement.scrollHeight - POSITION_TOLERANCE_PX
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
      if (disposed) return;
      const destination =
        state.mode === "navigating"
          ? { section: state.section }
          : state.mode === "restoring"
            ? state.destination
            : undefined;
      if (destination && isAtDestination(destination))
        handleNavigationEvent({ type: "destination-reached" });
      setActiveSection(getActiveSection());
    }

    function scheduleActiveSection() {
      if (disposed || animationFrame) return;
      animationFrame = requestAnimationFrame(() => {
        animationFrame = 0;
        if (disposed) return;
        handleNavigationEvent({ type: "activation-finished" });
        updateActiveSection();
      });
    }

    function saveReadingPosition(url: string) {
      const previous = parseReadingPosition(window.history.state);
      if (
        previous?.top === window.scrollY &&
        previous.left === window.scrollX &&
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
      if (disposed) return;
      if (state.mode === "navigating") {
        if (state.stage !== "scrolling" || !isAtDestination({ section: state.section }))
          return;
        handleNavigationEvent({ type: "destination-reached" });
      } else if (state.mode === "restoring" && state.stage === "aligning") {
        if (!isAtDestination(state.destination)) return;
        handleNavigationEvent({ type: "destination-reached" });
      }
      const section = getActiveSection();
      setActiveSection(section);
      const url = new URL(window.location.href);
      url.hash = section;
      saveReadingPosition(url.href);
    }

    function handleScroll() {
      scheduleActiveSection();
      clearTimeout(idleTimer);
      idleTimer = setTimeout(syncHashAfterScroll, SCROLL_IDLE_DELAY_MS);
    }

    function alignRestorationDestination() {
      restorationFrame = 0;
      if (disposed || state.mode !== "restoring") return;
      const destination = state.destination;
      if ("position" in destination) {
        window.scrollTo({ ...getDestinationPosition(destination), behavior: "auto" });
      } else {
        document
          .getElementById(destination.section)
          ?.scrollIntoView({ behavior: "auto", block: "start" });
      }
      updateActiveSection();
      saveReadingPosition(window.location.href);
    }

    function scheduleRestoration() {
      if (disposed || state.mode !== "restoring" || restorationFrame) return;
      restorationFrame = requestAnimationFrame(alignRestorationDestination);
    }

    function handleUserIntent() {
      handleNavigationEvent({ type: "user-intent" });
    }

    function handleAnchorClick(event: MouseEvent) {
      handleUserIntent();
      const section = getActivatedSection(event);
      if (!section) return;
      saveReadingPosition(window.location.href);
      handleNavigationEvent({
        type: "activate",
        section,
        changesHash: parseSectionHash(window.location.hash) !== section,
      });
      scheduleActiveSection();
    }

    function handlePopState(event: PopStateEvent) {
      handleNavigationEvent({
        type: "popstate",
        hash: window.location.hash,
        historyState: event.state,
      });
      updateActiveSection();
      scheduleActiveSection();
    }

    function handleHashChange(event: HashChangeEvent) {
      // Queued hashchange events can describe a navigation already superseded.
      if (event.newURL && event.newURL !== window.location.href) return;
      handleNavigationEvent({
        type: "hashchange",
        hash: window.location.hash,
        historyState: window.history.state,
      });
      updateActiveSection();
      scheduleActiveSection();
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("scrollend", syncHashAfterScroll);
    window.addEventListener("resize", handleScroll);
    window.addEventListener("wheel", handleUserIntent, { passive: true });
    window.addEventListener("pointerdown", handleUserIntent);
    window.addEventListener("keydown", handleUserIntent);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("click", handleAnchorClick);
    updateRestorationResources();
    void document.fonts.ready.then(scheduleRestoration);
    updateActiveSection();
    return () => {
      disposed = true;
      resizeObserver.disconnect();
      cancelAnimationFrame(restorationFrame);
      cancelAnimationFrame(animationFrame);
      clearTimeout(idleTimer);
      delete document.documentElement.dataset.restoringScroll;
      window.history.scrollRestoration = previousScrollRestoration;
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scrollend", syncHashAfterScroll);
      window.removeEventListener("resize", handleScroll);
      window.removeEventListener("wheel", handleUserIntent);
      window.removeEventListener("pointerdown", handleUserIntent);
      window.removeEventListener("keydown", handleUserIntent);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("click", handleAnchorClick);
    };
  }, [isHomePage]);
  return activeSection;
}
