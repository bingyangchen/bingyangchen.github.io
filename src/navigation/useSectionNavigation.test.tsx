import { act, cleanup, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { useSectionNavigation } from "./useSectionNavigation";

class ResizeObserverStub {
  static instances: ResizeObserverStub[] = [];
  observe = vi.fn();
  disconnect = vi.fn();
  constructor(public notify: () => void) {
    ResizeObserverStub.instances.push(this);
  }
}

const SECTION_TOPS = { home: 0, about: 1000, projects: 2400, blog: 4000 };
let scope: HTMLDivElement;
let frameId: number;
let frameIdToCallback: Map<number, FrameRequestCallback>;
let resolveFonts: () => void;
let fontsDescriptor: PropertyDescriptor | undefined;

function flushFrame() {
  act(() => {
    const callbacks = [...frameIdToCallback.values()];
    frameIdToCallback.clear();
    callbacks.forEach((callback) => callback(0));
  });
}

function dispatch(type: string) {
  act(() => window.dispatchEvent(new Event(type)));
}

function scrollToPosition(top: number, left = 0) {
  vi.stubGlobal("scrollY", top);
  vi.stubGlobal("scrollX", left);
}

function changeLocation(type: "popstate" | "hashchange", hash: string, state: unknown) {
  window.history.replaceState(state, "", hash);
  act(() => {
    window.dispatchEvent(
      type === "popstate"
        ? new PopStateEvent(type, { state })
        : new HashChangeEvent(type, { newURL: window.location.href }),
    );
  });
}

function clickSection(section: string) {
  const anchor = document.createElement("a");
  anchor.href = `#${section}`;
  scope.append(anchor);

  // The test controls native history and scrolling independently of jsdom's timers.
  window.addEventListener("click", (event) => event.preventDefault(), { once: true });
  act(() =>
    anchor.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })),
  );
  anchor.remove();
}

beforeEach(() => {
  vi.useFakeTimers();
  window.history.replaceState(null, "", "/");
  window.history.scrollRestoration = "auto";
  frameId = 0;
  frameIdToCallback = new Map();
  ResizeObserverStub.instances = [];
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frameIdToCallback.set(++frameId, callback);
    return frameId;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frameIdToCallback.delete(id));
  vi.stubGlobal("innerHeight", 800);
  vi.stubGlobal("innerWidth", 1000);
  scrollToPosition(0);
  vi.stubGlobal(
    "scrollTo",
    vi.fn((position: ScrollToOptions) => {
      scrollToPosition(position.top ?? 0, position.left ?? 0);
    }),
  );
  vi.spyOn(document.documentElement, "scrollHeight", "get").mockReturnValue(5000);
  vi.spyOn(document.documentElement, "scrollWidth", "get").mockReturnValue(1200);
  fontsDescriptor = Object.getOwnPropertyDescriptor(document, "fonts");
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: {
      ready: new Promise<void>((resolve) => {
        resolveFonts = resolve;
      }),
    },
  });
  scope = document.createElement("div");
  const header = document.createElement("header");
  header.getBoundingClientRect = () => ({ bottom: 80 }) as DOMRect;
  scope.append(header);
  for (const [id, top] of Object.entries(SECTION_TOPS)) {
    const section = document.createElement("section");
    section.id = id;
    section.getBoundingClientRect = () => ({ top: top - window.scrollY }) as DOMRect;
    section.scrollIntoView = vi.fn(() => scrollToPosition(Math.max(0, top - 80)));
    scope.append(section);
  }
  document.body.append(scope);
});

afterEach(() => {
  cleanup();
  scope.remove();
  if (fontsDescriptor) Object.defineProperty(document, "fonts", fontsDescriptor);
  else Reflect.deleteProperty(document, "fonts");
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

test("首頁以外不接管 history、事件或 browser 資源", async () => {
  const view = renderHook(() => useSectionNavigation(false));
  expect(window.history.scrollRestoration).toBe("auto");
  expect(ResizeObserverStub.instances).toHaveLength(0);
  await act(async () => resolveFonts());
  dispatch("scroll");
  expect(frameIdToCallback.size).toBe(0);
  expect(view.result.current).toBe("home");
});

test("SITE-R2.4 初始 hash、字型與內容變動共用還原目的地並合併 frame", async () => {
  window.history.replaceState(null, "", "#about");
  const view = renderHook(() => useSectionNavigation(true));
  const section = document.getElementById("about")!;
  expect(document.documentElement).toHaveAttribute("data-restoring-scroll");
  expect(window.history.scrollRestoration).toBe("manual");
  await act(async () => resolveFonts());
  ResizeObserverStub.instances[0].notify();
  expect(frameIdToCallback.size).toBe(1);
  flushFrame();
  expect(section.scrollIntoView).toHaveBeenCalledTimes(1);
  expect(window.scrollY).toBe(920);
  expect(view.result.current).toBe("about");
  section.getBoundingClientRect = () => ({ top: 1300 - window.scrollY }) as DOMRect;
  section.scrollIntoView = vi.fn(() => scrollToPosition(1220));
  ResizeObserverStub.instances[0].notify();
  flushFrame();
  expect(window.scrollY).toBe(1220);
  expect(document.documentElement).toHaveAttribute("data-restoring-scroll");
});

test("SITE-R2.4 還原抵達後能記錄後續捲動，幾何改變仍可重新定位", () => {
  window.history.replaceState(null, "", "#about");
  renderHook(() => useSectionNavigation(true));
  flushFrame();
  scrollToPosition(1100);
  dispatch("scrollend");
  expect(window.history.state.siteScrollPosition.top).toBe(1100);
  ResizeObserverStub.instances[0].notify();
  flushFrame();
  expect(window.scrollY).toBe(920);
});

test("SITE-R2.3 還原保存的雙軸座標，並保留 router 的 history state", () => {
  window.history.replaceState(
    { idx: 4, key: "entry", siteScrollPosition: { top: 1250, left: 30 } },
    "",
    "#about",
  );
  renderHook(() => useSectionNavigation(true));
  flushFrame();
  expect(window.scrollTo).toHaveBeenCalledWith({
    top: 1250,
    left: 30,
    behavior: "auto",
  });
  expect(document.getElementById("about")!.scrollIntoView).not.toHaveBeenCalled();
  dispatch("wheel");
  scrollToPosition(1400, 40);
  dispatch("scrollend");
  expect(window.history.state).toEqual({
    idx: 4,
    key: "entry",
    siteScrollPosition: { top: 1400, left: 40 },
  });
});

test("SITE-R2.4 超出目前文件的閱讀位置先限制於可捲範圍，內容長高後再還原", () => {
  const height = vi
    .spyOn(document.documentElement, "scrollHeight", "get")
    .mockReturnValue(1200);
  window.history.replaceState(
    { siteScrollPosition: { top: 2400, left: 900 } },
    "",
    "#projects",
  );
  renderHook(() => useSectionNavigation(true));
  flushFrame();
  expect(window.scrollTo).toHaveBeenLastCalledWith({
    top: 400,
    left: 200,
    behavior: "auto",
  });
  height.mockReturnValue(5000);
  ResizeObserverStub.instances[0].notify();
  flushFrame();
  expect(window.scrollTo).toHaveBeenLastCalledWith({
    top: 2400,
    left: 200,
    behavior: "auto",
  });
});

test.each(["wheel", "pointerdown", "keydown", "click"])(
  "SITE-R2.4 使用者 %s 後，延遲字型及 observer 不再拉回還原位置",
  async (type) => {
    window.history.replaceState(null, "", "#about");
    renderHook(() => useSectionNavigation(true));
    dispatch(type);
    expect(document.documentElement).not.toHaveAttribute("data-restoring-scroll");
    expect(ResizeObserverStub.instances[0].disconnect).toHaveBeenCalled();
    scrollToPosition(500);
    await act(async () => resolveFonts());
    ResizeObserverStub.instances[0].notify();
    flushFrame();
    expect(document.getElementById("about")!.scrollIntoView).not.toHaveBeenCalled();
    expect(window.scrollY).toBe(500);
  },
);

test("SITE-R2.1 SITE-R2.3 原生位置事件與舊 scrollend 不會提前改寫目的地", () => {
  window.history.replaceState({ idx: 2 }, "", "#about");
  scrollToPosition(1200);
  renderHook(() => useSectionNavigation(true));
  dispatch("pointerdown");
  clickSection("projects");
  const sourceState = window.history.state;
  expect(sourceState).toEqual({ idx: 2, siteScrollPosition: { top: 1200, left: 0 } });
  changeLocation("popstate", "#projects", null);
  dispatch("scrollend");
  expect(window.location.hash).toBe("#projects");
  expect(window.history.state).toBeNull();
  changeLocation("hashchange", "#projects", null);
  scrollToPosition(1600);
  dispatch("scroll");
  act(() => vi.advanceTimersByTime(200));
  dispatch("scrollend");
  expect(window.location.hash).toBe("#projects");
  expect(window.history.state).toBeNull();
  scrollToPosition(2320);
  dispatch("scrollend");
  expect(window.history.state.siteScrollPosition.top).toBe(2320);
  expect(document.documentElement).not.toHaveAttribute("data-restoring-scroll");
  changeLocation("popstate", "#about", sourceState);
  changeLocation("hashchange", "#about", sourceState);
  flushFrame();
  expect(window.scrollY).toBe(1200);
});

test("SITE-R2.1 已在相同 hash 的落點時，沒有位置或捲動事件仍能結束導覽", () => {
  window.history.replaceState(null, "", "#about");
  scrollToPosition(920);
  renderHook(() => useSectionNavigation(true));
  clickSection("about");
  flushFrame();
  scrollToPosition(2500);
  dispatch("scrollend");
  expect(window.location.hash).toBe("#projects");
  expect(window.history.state.siteScrollPosition.top).toBe(2500);
});

test("SITE-R2.1 連續點擊忽略已被取代的 hashchange", () => {
  renderHook(() => useSectionNavigation(true));
  clickSection("projects");
  clickSection("blog");
  window.history.replaceState(null, "", "#blog");
  act(() =>
    window.dispatchEvent(
      new HashChangeEvent("hashchange", {
        newURL: new URL("#projects", window.location.href).href,
      }),
    ),
  );
  dispatch("scrollend");
  expect(window.location.hash).toBe("#blog");
  expect(document.documentElement).not.toHaveAttribute("data-restoring-scroll");
  changeLocation("hashchange", "#blog", null);
  scrollToPosition(3920);
  dispatch("scrollend");
  expect(window.history.state.siteScrollPosition.top).toBe(3920);
});

test("SITE-R2.1 相同 hash 的原生 popstate 不啟動持續還原", () => {
  window.history.replaceState(null, "", "#about");
  scrollToPosition(920);
  renderHook(() => useSectionNavigation(true));
  clickSection("about");
  dispatch("scrollend");
  changeLocation("popstate", "#about", null);
  expect(document.documentElement).not.toHaveAttribute("data-restoring-scroll");
  scrollToPosition(2500);
  dispatch("scrollend");
  expect(window.location.hash).toBe("#projects");
});

test("SITE-R2.2 沒有 scrollend 時，idle timer 只在最後一次捲動後保存位置", () => {
  const view = renderHook(() => useSectionNavigation(true));
  scrollToPosition(1200);
  dispatch("scroll");
  act(() => vi.advanceTimersByTime(100));
  scrollToPosition(2500);
  dispatch("scroll");
  act(() => vi.advanceTimersByTime(149));
  expect(window.history.state).toBeNull();
  flushFrame();
  expect(view.result.current).toBe("projects");
  act(() => vi.advanceTimersByTime(1));
  expect(window.location.hash).toBe("#projects");
  expect(window.history.state.siteScrollPosition.top).toBe(2500);
});

test("SITE-R2.4 Strict Mode、離開首頁及卸載取消全部資源，延遲 callback 不再寫入", async () => {
  window.history.replaceState(null, "", "#about");
  const view = renderHook(({ isHomePage }) => useSectionNavigation(isHomePage), {
    initialProps: { isHomePage: true },
    wrapper: StrictMode,
  });
  expect(ResizeObserverStub.instances).toHaveLength(2);
  expect(ResizeObserverStub.instances[0].disconnect).toHaveBeenCalled();
  expect(frameIdToCallback.size).toBe(1);
  dispatch("scroll");
  expect(frameIdToCallback.size).toBe(2);
  const pendingCallbacks = [...frameIdToCallback.values()];
  view.rerender({ isHomePage: false });
  expect(frameIdToCallback.size).toBe(0);
  expect(vi.getTimerCount()).toBe(0);
  expect(window.history.scrollRestoration).toBe("auto");
  expect(document.documentElement).not.toHaveAttribute("data-restoring-scroll");
  const replaceState = vi.spyOn(window.history, "replaceState");
  await act(async () => resolveFonts());
  for (const observer of ResizeObserverStub.instances) {
    expect(observer.disconnect).toHaveBeenCalled();
    observer.notify();
  }
  act(() => pendingCallbacks.forEach((callback) => callback(0)));
  for (const type of [
    "scroll",
    "scrollend",
    "resize",
    "wheel",
    "popstate",
    "hashchange",
  ])
    dispatch(type);
  clickSection("blog");
  act(() => vi.runAllTimers());
  expect(replaceState).not.toHaveBeenCalled();
  expect(window.scrollTo).not.toHaveBeenCalled();
  expect(document.getElementById("about")!.scrollIntoView).not.toHaveBeenCalled();
  expect(frameIdToCallback.size).toBe(0);
  view.unmount();
});
