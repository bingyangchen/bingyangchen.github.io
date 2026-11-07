import { RefObject, useLayoutEffect } from "react";

type MotionKind =
  | "content"
  | "heading"
  | "hero"
  | "atmosphere"
  | "hint"
  | "stage"
  | "feature"
  | "portrait"
  | "skill"
  | "device"
  | "secondary-device";
type MotionTarget = {
  element: HTMLElement;
  anchor: HTMLElement;
  kind: MotionKind;
  order: number;
  top: number;
  height: number;
};
type TimelineRow = { element: HTMLElement; top: number; height: number };
const MOTION_PROPERTIES = ["x", "y", "opacity", "scale", "tilt", "rotate"] as const;
const MOTION_KINDS: readonly MotionKind[] = [
  "content",
  "heading",
  "hero",
  "atmosphere",
  "hint",
  "stage",
  "feature",
  "portrait",
  "skill",
  "device",
  "secondary-device",
];

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function smoothProgress(value: number): number {
  const progress = clamp(value);
  return progress * progress * (3 - 2 * progress);
}

function getDocumentTop(element: HTMLElement): number {
  let top = 0;

  // Layout offsets keep the measured path independent of our visual transforms.
  for (
    let parent: HTMLElement | null = element;
    parent;
    parent = parent.offsetParent as HTMLElement | null
  )
    top += parent.offsetTop;
  return top;
}

export function useScrollMotion(scopeRef: RefObject<HTMLElement>): void {
  useLayoutEffect(() => {
    if (
      !scopeRef.current ||
      typeof window.matchMedia !== "function" ||
      typeof ResizeObserver !== "function"
    )
      return;
    const scope = scopeRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const printMedia = window.matchMedia("print");
    let disposed = false;
    let frame = 0;
    let needsCollection = true;
    let needsMeasurement = true;
    let targets: MotionTarget[] = [];
    let rows: TimelineRow[] = [];
    let config: CSSStyleDeclaration;
    let headerBottom = 0;
    const parameters = new Map<string, number>();

    function getParameter(name: string): number {
      const stored = parameters.get(name);
      if (stored !== undefined) return stored;
      const value = Number.parseFloat(config.getPropertyValue(`--motion-${name}`));
      if (!Number.isFinite(value)) throw new Error(`Missing motion parameter: ${name}`);
      parameters.set(name, value);
      return value;
    }

    function collect() {
      targets = Array.from(
        scope.querySelectorAll<HTMLElement>("[data-scroll-motion]"),
      ).map((element) => {
        const kind = element.dataset.scrollMotion;
        if (!MOTION_KINDS.includes(kind as MotionKind))
          throw new Error(`Unknown motion kind: ${kind}`);
        return {
          element,
          anchor: element.closest<HTMLElement>("[data-scroll-anchor]") ?? element,
          kind: kind as MotionKind,
          order: Number(element.dataset.scrollOrder ?? 0),
          top: 0,
          height: 0,
        };
      });
      rows = Array.from(
        scope.querySelectorAll<HTMLElement>("[data-scroll-timeline]"),
      ).map((element) => ({ element, top: 0, height: 0 }));
      resizeObserver.disconnect();
      resizeObserver.observe(scope);
      const header = document.querySelector("header");
      if (header) resizeObserver.observe(header);
      new Set([
        ...targets.map((target) => target.anchor),
        ...rows.map((row) => row.element),
      ]).forEach((anchor) => resizeObserver.observe(anchor));
      needsCollection = false;
      needsMeasurement = true;
    }

    function measure() {
      parameters.clear();
      config = getComputedStyle(scope);
      headerBottom =
        document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
      for (const target of targets) {
        target.top = getDocumentTop(target.anchor);
        target.height = target.anchor.offsetHeight;
      }
      for (const row of rows) {
        row.top = getDocumentTop(row.element);
        row.height = row.element.offsetHeight;
      }
      needsMeasurement = false;
    }

    function reset() {
      scope.removeAttribute("data-scroll-motion-active");
      for (const { element } of targets)
        for (const property of MOTION_PROPERTIES)
          element.style.removeProperty(`--scroll-${property}`);
      for (const { element } of rows) {
        element.style.removeProperty("--scroll-line-progress");
        element.style.removeProperty("--scroll-dot-scale");
      }
    }

    function render() {
      frame = 0;
      if (disposed || document.hidden) return;
      if (needsCollection) collect();
      if (reducedMotion.matches || printMedia.matches) {
        reset();
        return;
      }
      if (needsMeasurement) measure();
      const height = window.innerHeight;
      const scrollTop = window.scrollY;
      const distance = getParameter("content-distance");
      const depthScale = getParameter("depth-scale");
      const entranceStart = height * getParameter("entrance-start");
      const exitStart = headerBottom + height * getParameter("exit-start");
      const exitEnd = headerBottom - height * getParameter("exit-end");
      const poses = targets
        .filter(({ element }) => !element.closest("[inert]"))
        .map((target) => {
          const top = target.top - scrollTop;
          const bottom = top + target.height;
          const entranceEnd =
            height *
              getParameter(
                target.height > height * getParameter("long-content-threshold")
                  ? "long-content-end"
                  : "entrance-end",
              ) -
            (target.kind === "skill"
              ? target.order * height * getParameter("skill-stagger")
              : 0);
          const enter = smoothProgress(
            (entranceStart - top) / (entranceStart - entranceEnd),
          );
          const exit = smoothProgress((exitStart - bottom) / (exitStart - exitEnd));
          let x = 0;
          let y =
            (1 - enter) * distance -
            exit * distance * getParameter("exit-distance-scale");
          let opacity =
            getParameter("minimum-opacity") +
            (1 - getParameter("minimum-opacity")) * enter * (1 - exit);
          let scale =
            1 -
            (1 - enter) * getParameter("content-shrink") -
            exit * getParameter("content-exit-shrink");
          let tilt = 0;
          let rotate = 0;
          if (["hero", "atmosphere", "hint"].includes(target.kind)) {
            const readingDistance = Math.max(0, target.height - height);
            const progress = clamp(
              (-top - readingDistance) /
                Math.max(1, Math.min(height, target.height) - headerBottom),
            );
            y =
              -progress *
              getParameter(
                target.kind === "hero" ? "hero-distance" : "atmosphere-distance",
              ) *
              depthScale;
            opacity =
              target.kind === "hero" ? 1 - progress * getParameter("hero-fade") : 1;
            scale =
              target.kind === "hero" ? 1 - progress * getParameter("hero-shrink") : 1;
            tilt = target.kind === "hero" ? progress * getParameter("hero-tilt") : 0;
            if (target.kind === "hint") {
              y = 0;
              opacity = 1 - smoothProgress(progress / getParameter("hint-exit"));
            }
          } else if (target.kind === "stage" || target.kind === "feature") {
            y = (1 - enter) * getParameter("stage-distance") - exit * distance;
            scale =
              1 -
              (1 - enter) * getParameter("stage-shrink") -
              exit * getParameter("stage-exit-shrink");
            tilt =
              target.kind === "stage"
                ? (1 - enter) * getParameter("stage-tilt") -
                  exit * getParameter("stage-exit-tilt")
                : 0;
          } else if (target.kind === "heading") {
            scale =
              1 -
              (1 - enter) * getParameter("heading-shrink") -
              exit * getParameter("heading-exit-shrink");
          } else if (target.kind === "portrait" || target.kind === "skill") {
            scale =
              1 -
              (1 - enter) * getParameter("artwork-shrink") -
              exit * getParameter("artwork-exit-shrink");
            y =
              (1 - enter) * distance * getParameter("artwork-distance-scale") -
              exit * distance * getParameter("artwork-exit-distance-scale");
          } else if (target.kind === "device" || target.kind === "secondary-device") {
            const depth = 0.5 - clamp((height - top) / (height + target.height));
            const prefix = target.kind;
            y = depth * getParameter(`${prefix}-distance`) * depthScale;
            x = depth * getParameter(`${prefix}-spread`) * depthScale;
            rotate = depth * getParameter(`${prefix}-rotation`) * depthScale;
            opacity = 1;
            scale = 1;
          }
          return { element: target.element, x, y, opacity, scale, tilt, rotate };
        });
      const lines = rows.map((row) => ({
        element: row.element,
        progress: clamp(
          (height * getParameter("timeline-reading-line") - (row.top - scrollTop)) /
            Math.max(1, row.height),
        ),
      }));

      for (const pose of poses) {
        const values = {
          x: `${pose.x.toFixed(3)}px`,
          y: `${pose.y.toFixed(3)}px`,
          opacity: pose.opacity.toFixed(4),
          scale: pose.scale.toFixed(5),
          tilt: `${pose.tilt.toFixed(3)}deg`,
          rotate: `${pose.rotate.toFixed(3)}deg`,
        };
        for (const property of MOTION_PROPERTIES)
          if (
            pose.element.style.getPropertyValue(`--scroll-${property}`) !==
            values[property]
          )
            pose.element.style.setProperty(`--scroll-${property}`, values[property]);
      }
      for (const { element, progress } of lines) {
        element.style.setProperty("--scroll-line-progress", progress.toFixed(4));
        element.style.setProperty(
          "--scroll-dot-scale",
          (
            getParameter("timeline-dot-start") +
            progress * getParameter("timeline-dot-growth")
          ).toFixed(4),
        );
      }
      scope.dataset.scrollMotionActive = "";
    }

    function schedule() {
      if (
        !disposed &&
        !document.hidden &&
        !reducedMotion.matches &&
        !printMedia.matches &&
        !frame
      )
        frame = requestAnimationFrame(render);
    }
    function invalidate() {
      needsMeasurement = true;
      schedule();
    }
    function updatePreference() {
      cancelAnimationFrame(frame);
      frame = 0;
      if (reducedMotion.matches || printMedia.matches) reset();
      else {
        needsMeasurement = true;
        render();
      }
    }
    function updateVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else invalidate();
    }
    const resizeObserver = new ResizeObserver(invalidate);
    const mutationObserver = new MutationObserver((records) => {
      if (records.some((record) => record.type === "childList")) needsCollection = true;
      needsMeasurement = true;
      schedule();
    });
    mutationObserver.observe(scope, {
      childList: true,
      characterData: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["inert"],
    });
    const restorationObserver = new MutationObserver(invalidate);
    restorationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-restoring-scroll"],
    });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", invalidate);
    scope.addEventListener("load", invalidate, true);
    document.addEventListener("visibilitychange", updateVisibility);
    reducedMotion.addEventListener("change", updatePreference);
    printMedia.addEventListener("change", updatePreference);
    void document.fonts?.ready.then(() => {
      if (!disposed) invalidate();
    });
    render();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      restorationObserver.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", invalidate);
      scope.removeEventListener("load", invalidate, true);
      document.removeEventListener("visibilitychange", updateVisibility);
      reducedMotion.removeEventListener("change", updatePreference);
      printMedia.removeEventListener("change", updatePreference);
      reset();
    };
  }, [scopeRef]);
}
