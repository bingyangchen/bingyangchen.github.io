import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { aboutTopics, type AboutTopic } from "../../data/about";

export function useAboutReading() {
  const section = useRef<HTMLElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const focusedJump = useRef<HTMLButtonElement | null>(null);
  const [activeTopic, setActiveTopic] = useState<AboutTopic>("origin");
  const [enhanced, setEnhanced] = useState(false);

  const preserveFocus = useCallback(() => {
    if (!rail.current || !focusedJump.current) return;
    const focus = document.activeElement;
    if (focus !== focusedJump.current && focus !== document.body) return;
    const { display, visibility } = getComputedStyle(rail.current);
    if (display !== "none" && visibility !== "hidden") return;
    const id = focusedJump.current.getAttribute("aria-controls");
    focusedJump.current = null;
    const chapter = id ? document.getElementById(id) : null;
    chapter?.focus({ preventScroll: true });
    chapter?.scrollIntoView({ block: "start", behavior: "instant" });
  }, []);

  useLayoutEffect(preserveFocus, [enhanced, preserveFocus]);

  useLayoutEffect(() => {
    const root = section.current;
    const questionStage = stage.current;
    if (
      !root ||
      !questionStage ||
      typeof IntersectionObserver !== "function" ||
      typeof ResizeObserver !== "function" ||
      typeof window.matchMedia !== "function" ||
      typeof CSS === "undefined" ||
      !CSS.supports("position", "sticky")
    )
      return;

    const chapters = Array.from(root.querySelectorAll<HTMLElement>("[data-chapter]"));
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const print = window.matchMedia("print");
    let chapterObserver: IntersectionObserver | undefined;
    let observedHeight = 0;

    function observeChapters() {
      chapterObserver?.disconnect();
      observedHeight = window.innerHeight;
      const readingLine = Math.round(observedHeight * 0.45);
      function syncChapter() {
        const chapter = chapters.find(
          (item) => item.getBoundingClientRect().bottom >= readingLine,
        );
        const topic = aboutTopics.find((item) => item === chapter?.dataset.chapter);
        setActiveTopic(topic ?? "curiosity");
      }

      // The inclusive edge matches IntersectionObserver's zero-height reading line.
      chapterObserver = new IntersectionObserver(syncChapter, {
        rootMargin: `${-readingLine}px 0px ${readingLine - observedHeight}px 0px`,
      });
      for (const chapter of chapters) chapterObserver.observe(chapter);
      syncChapter();
    }

    const updateLayout = () => {
      const height = questionStage.getBoundingClientRect().height;
      const headerBottom =
        document.querySelector(".site-layout > header")?.getBoundingClientRect()
          .bottom ?? 0;
      const fits =
        !motionPreference.matches &&
        !print.matches &&
        height > 0 &&
        height <= window.innerHeight - headerBottom + 1;
      setEnhanced(fits);
      if (fits && (!chapterObserver || observedHeight !== window.innerHeight))
        observeChapters();
      else if (!fits) {
        chapterObserver?.disconnect();
        chapterObserver = undefined;
      }
      preserveFocus();
    };

    const layoutObserver = new ResizeObserver(updateLayout);
    layoutObserver.observe(questionStage);
    window.addEventListener("resize", updateLayout);
    motionPreference.addEventListener("change", updateLayout);
    print.addEventListener("change", updateLayout);
    updateLayout();
    return () => {
      chapterObserver?.disconnect();
      layoutObserver.disconnect();
      window.removeEventListener("resize", updateLayout);
      motionPreference.removeEventListener("change", updateLayout);
      print.removeEventListener("change", updateLayout);
    };
  }, [preserveFocus]);

  function jumpToChapter(id: string) {
    const target = document.getElementById(id);
    if (!target) return;
    target.focus({ preventScroll: true });
    target.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }

  return {
    section,
    rail,
    stage,
    focusedJump,
    activeTopic,
    enhanced,
    preserveFocus,
    jumpToChapter,
  };
}
