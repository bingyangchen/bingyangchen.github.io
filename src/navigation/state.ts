import { parseSectionHash, type SectionId } from "./sections";

export type ScrollPosition = { top: number; left: number };
export type ScrollDestination = { section: SectionId } | { position: ScrollPosition };

export type NavigationState =
  | { mode: "reading" }
  | {
      mode: "navigating";
      section: SectionId;
      stage: "activating" | "activating-same-hash" | "scrolling";
    }
  | {
      mode: "restoring";
      stage: "aligning" | "tracking";
      destination: ScrollDestination;
    };

export type NavigationEvent =
  | { type: "activate"; section: SectionId; changesHash: boolean }
  | { type: "popstate" | "hashchange"; hash: string; historyState: unknown }
  | { type: "activation-finished" | "destination-reached" | "user-intent" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function parseReadingPosition(
  historyState: unknown,
): ScrollPosition | undefined {
  if (!isRecord(historyState)) return undefined;
  const position = historyState.siteScrollPosition;
  if (
    !isRecord(position) ||
    typeof position.top !== "number" ||
    typeof position.left !== "number" ||
    !Number.isFinite(position.top) ||
    !Number.isFinite(position.left)
  )
    return undefined;
  return { top: position.top, left: position.left };
}

export function resolveRestorationState(
  historyState: unknown,
  hash: string,
): NavigationState {
  const position = parseReadingPosition(historyState);
  if (position)
    return { mode: "restoring", stage: "aligning", destination: { position } };
  const section = parseSectionHash(hash);
  return section
    ? { mode: "restoring", stage: "aligning", destination: { section } }
    : { mode: "reading" };
}

export function transitionNavigation(
  state: NavigationState,
  event: NavigationEvent,
): NavigationState {
  switch (event.type) {
    case "activate":
      return {
        mode: "navigating",
        section: event.section,
        stage: event.changesHash ? "activating" : "activating-same-hash",
      };
    case "popstate":
    case "hashchange":
      if (
        state.mode === "navigating" &&
        state.stage !== "scrolling" &&
        state.section === parseSectionHash(event.hash)
      ) {
        // A native fragment navigation can emit popstate before hashchange.
        return event.type === "popstate" && state.stage === "activating"
          ? state
          : { ...state, stage: "scrolling" };
      }
      return resolveRestorationState(event.historyState, event.hash);
    case "activation-finished":
      return state.mode === "navigating" && state.stage === "activating-same-hash"
        ? { ...state, stage: "scrolling" }
        : state;
    case "destination-reached":
      if (state.mode === "restoring" && state.stage === "aligning")
        return { ...state, stage: "tracking" };
      return state.mode === "navigating" && state.stage === "scrolling"
        ? { mode: "reading" }
        : state;
    case "user-intent":
      return { mode: "reading" };
  }
}
