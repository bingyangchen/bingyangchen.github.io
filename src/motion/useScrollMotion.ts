import { RefObject, useLayoutEffect } from "react";
import { calculatePose, parseMotionKind, type MotionKind } from "./calculation";
import { parseMotionParameters, type MotionParameters } from "./parameters";

type MotionTarget = {
  element: HTMLElement;
  anchor: HTMLElement;
  kind: MotionKind;
  top: number;
  height: number;
};
const MOTION_PROPERTIES = ["y", "opacity", "scale", "tilt"] as const;

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

export function useScrollMotion(scopeRef: RefObject<HTMLElement | null>): void {
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
    let parameters: MotionParameters;
    let headerBottom = 0;

    function collect() {
      targets = Array.from(
        scope.querySelectorAll<HTMLElement>("[data-scroll-motion]"),
      ).map((element) => ({
        element,
        anchor: element.closest<HTMLElement>("[data-scroll-anchor]") ?? element,
        kind: parseMotionKind(element.dataset.scrollMotion),
        top: 0,
        height: 0,
      }));
      resizeObserver.disconnect();
      resizeObserver.observe(scope);
      const header = document.querySelector("header");
      if (header) resizeObserver.observe(header);
      new Set(targets.map((target) => target.anchor)).forEach((anchor) =>
        resizeObserver.observe(anchor),
      );
      needsCollection = false;
      needsMeasurement = true;
    }

    function measure() {
      parameters = parseMotionParameters(getComputedStyle(scope));
      headerBottom =
        document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
      for (const target of targets) {
        target.top = getDocumentTop(target.anchor);
        target.height = target.anchor.offsetHeight;
      }
      needsMeasurement = false;
    }

    function reset() {
      scope.removeAttribute("data-scroll-motion-active");
      for (const { element } of targets)
        for (const property of MOTION_PROPERTIES)
          element.style.removeProperty(`--scroll-${property}`);
    }

    function render() {
      frame = 0;
      if (disposed || document.hidden) return;
      try {
        if (needsCollection) collect();
        if (reducedMotion.matches || printMedia.matches) {
          reset();
          return;
        }
        if (needsMeasurement) measure();
        const viewport = {
          height: window.innerHeight,
          scrollTop: window.scrollY,
          headerBottom,
        };
        const activeTargets = targets.filter(
          ({ element }) => !element.closest("[inert]"),
        );
        const poses = activeTargets.map((target) =>
          calculatePose(target, viewport, parameters),
        );

        for (let index = 0; index < poses.length; index++) {
          const pose = poses[index];
          const element = activeTargets[index].element;
          const values = {
            y: `${pose.y.toFixed(3)}px`,
            opacity: pose.opacity.toFixed(4),
            scale: pose.scale.toFixed(5),
            tilt: `${pose.tilt.toFixed(3)}deg`,
          };
          for (const property of MOTION_PROPERTIES)
            if (
              element.style.getPropertyValue(`--scroll-${property}`) !==
              values[property]
            )
              element.style.setProperty(`--scroll-${property}`, values[property]);
        }
        scope.dataset.scrollMotionActive = "";
      } catch (error) {
        dispose();
        throw error;
      }
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
    function dispose() {
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
    }
    render();
    return dispose;
  }, [scopeRef]);
}
