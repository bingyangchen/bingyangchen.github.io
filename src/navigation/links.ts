import { parseSectionHash } from "./sections";

type ActivationEvent = Pick<
  MouseEvent,
  | "button"
  | "metaKey"
  | "ctrlKey"
  | "shiftKey"
  | "altKey"
  | "defaultPrevented"
  | "target"
>;

export function getActivatedSection(event: ActivationEvent) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return undefined;
  const anchor =
    event.target instanceof Element ? event.target.closest("a[href]") : null;
  if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute("download"))
    return undefined;
  const target =
    anchor.getAttribute("target") ??
    document.querySelector<HTMLBaseElement>("base[target]")?.target;
  if (target && target.toLowerCase() !== "_self") return undefined;
  const url = new URL(anchor.href);
  if (
    url.origin !== window.location.origin ||
    url.pathname !== window.location.pathname ||
    url.search !== window.location.search
  )
    return undefined;
  return parseSectionHash(url.hash);
}
