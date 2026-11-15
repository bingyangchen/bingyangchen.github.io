import type { MotionParameters } from "./parameters";

const MOTION_KINDS = [
  "content",
  "heading",
  "hero",
  "atmosphere",
  "hint",
  "portrait",
  "skill",
] as const;

export type MotionKind = (typeof MOTION_KINDS)[number];
export type MotionGeometry = { top: number; height: number };
export type MotionViewport = {
  height: number;
  scrollTop: number;
  headerBottom: number;
};
export type MotionPose = { y: number; opacity: number; scale: number; tilt: number };

export function parseMotionKind(value: string | undefined): MotionKind {
  const kind = MOTION_KINDS.find((kind) => kind === value);
  if (!kind) throw new Error(`Unknown motion kind: ${value}`);
  return kind;
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function smoothProgress(value: number): number {
  const progress = clamp(value);
  return progress * progress * (3 - 2 * progress);
}

export function calculatePose(
  target: MotionGeometry & { kind: MotionKind; order: number },
  viewport: MotionViewport,
  parameters: MotionParameters,
): MotionPose {
  const top = target.top - viewport.scrollTop;
  const bottom = top + target.height;
  if (
    target.kind === "hero" ||
    target.kind === "atmosphere" ||
    target.kind === "hint"
  ) {
    const readingDistance = Math.max(0, target.height - viewport.height);
    const progress = clamp(
      (-top - readingDistance) /
        Math.max(1, Math.min(viewport.height, target.height) - viewport.headerBottom),
    );
    if (target.kind === "hint")
      return {
        y: 0,
        opacity: 1 - smoothProgress(progress / parameters["hint-exit"]),
        scale: 1,
        tilt: 0,
      };
    const isHero = target.kind === "hero";
    return {
      y:
        -progress *
        parameters[isHero ? "hero-distance" : "atmosphere-distance"] *
        parameters["depth-scale"],
      opacity: isHero ? 1 - progress * parameters["hero-fade"] : 1,
      scale: isHero ? 1 - progress * parameters["hero-shrink"] : 1,
      tilt: isHero ? progress * parameters["hero-tilt"] : 0,
    };
  }
  const entranceStart = viewport.height * parameters["entrance-start"];
  const entranceEnd =
    viewport.height *
      parameters[
        target.height > viewport.height * parameters["long-content-threshold"]
          ? "long-content-end"
          : "entrance-end"
      ] -
    (target.kind === "skill"
      ? target.order * viewport.height * parameters["skill-stagger"]
      : 0);
  const exitStart = viewport.headerBottom + viewport.height * parameters["exit-start"];
  const exitEnd = viewport.headerBottom - viewport.height * parameters["exit-end"];
  const enter = smoothProgress((entranceStart - top) / (entranceStart - entranceEnd));
  const exit = smoothProgress((exitStart - bottom) / (exitStart - exitEnd));
  const isArtwork = target.kind === "portrait" || target.kind === "skill";
  const shrink =
    target.kind === "heading"
      ? parameters["heading-shrink"]
      : isArtwork
        ? parameters["artwork-shrink"]
        : parameters["content-shrink"];
  const exitShrink =
    target.kind === "heading"
      ? parameters["heading-exit-shrink"]
      : isArtwork
        ? parameters["artwork-exit-shrink"]
        : parameters["content-exit-shrink"];
  return {
    y:
      (1 - enter) *
        parameters["content-distance"] *
        (isArtwork ? parameters["artwork-distance-scale"] : 1) -
      exit *
        parameters["content-distance"] *
        parameters[isArtwork ? "artwork-exit-distance-scale" : "exit-distance-scale"],
    opacity:
      parameters["minimum-opacity"] +
      (1 - parameters["minimum-opacity"]) * enter * (1 - exit),
    scale: 1 - (1 - enter) * shrink - exit * exitShrink,
    tilt: 0,
  };
}

export function calculateTimeline(
  row: MotionGeometry,
  viewport: MotionViewport,
  parameters: MotionParameters,
): { progress: number; dotScale: number } {
  const progress = clamp(
    (viewport.height * parameters["timeline-reading-line"] -
      (row.top - viewport.scrollTop)) /
      Math.max(1, row.height),
  );
  return {
    progress,
    dotScale:
      parameters["timeline-dot-start"] + progress * parameters["timeline-dot-growth"],
  };
}
