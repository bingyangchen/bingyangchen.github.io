import { act, cleanup, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import type { MockInstance } from "vitest";
import { makeMotionStyle } from "./fixtures/style";
import { useScrollMotion } from "./useScrollMotion";

class ResizeObserverStub {
  static instances: ResizeObserverStub[] = [];
  observe = vi.fn();
  disconnect = vi.fn();
  constructor(public notify: () => void) {
    ResizeObserverStub.instances.push(this);
  }
}

class MutationObserverStub {
  static instances: MutationObserverStub[] = [];
  observe = vi.fn();
  disconnect = vi.fn();
  constructor(public notify: (records: Partial<MutationRecord>[]) => void) {
    MutationObserverStub.instances.push(this);
  }
}

function makeMediaQuery() {
  const listeners = new Set<() => void>();
  return {
    matches: false,
    addEventListener: vi.fn((_type: string, callback: () => void) =>
      listeners.add(callback),
    ),
    removeEventListener: vi.fn((_type: string, callback: () => void) =>
      listeners.delete(callback),
    ),
    change(matches: boolean) {
      this.matches = matches;
      act(() => listeners.forEach((callback) => callback()));
    },
  };
}

let scope: HTMLDivElement;
let target: HTMLDivElement;
let frameId: number;
let frameIdToCallback: Map<number, FrameRequestCallback>;
let reducedMotion: ReturnType<typeof makeMediaQuery>;
let printMedia: ReturnType<typeof makeMediaQuery>;
let resolveFonts: () => void;
let fontDescriptor: PropertyDescriptor | undefined;
let readParameter: MockInstance<(name: string) => string>;
let operations: string[];

function flushFrame() {
  act(() => {
    const callbacks = [...frameIdToCallback.values()];
    frameIdToCallback.clear();
    callbacks.forEach((callback) => callback(0));
  });
}

function addTarget(kind = "content") {
  const element = document.createElement("div");
  element.dataset.scrollMotion = kind;
  Object.defineProperties(element, {
    offsetTop: { configurable: true, value: 500 },
    offsetHeight: { configurable: true, value: 100 },
  });
  scope.append(element);
  const setProperty = element.style.setProperty.bind(element.style);
  vi.spyOn(element.style, "setProperty").mockImplementation((...arguments_) => {
    operations.push("write");
    return setProperty(...arguments_);
  });
  return element;
}

beforeEach(() => {
  operations = [];
  frameId = 0;
  frameIdToCallback = new Map();
  reducedMotion = makeMediaQuery();
  printMedia = makeMediaQuery();
  ResizeObserverStub.instances = [];
  MutationObserverStub.instances = [];
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  vi.stubGlobal("MutationObserver", MutationObserverStub);
  vi.stubGlobal("matchMedia", (query: string) =>
    query === "print" ? printMedia : reducedMotion,
  );
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frameIdToCallback.set(++frameId, callback);
    return frameId;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frameIdToCallback.delete(id));
  vi.stubGlobal("innerHeight", 1000);
  vi.stubGlobal("scrollY", 0);
  fontDescriptor = Object.getOwnPropertyDescriptor(document, "fonts");
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: {
      ready: new Promise<void>((resolve) => {
        resolveFonts = resolve;
      }),
    },
  });
  scope = document.createElement("div");
  document.body.append(scope);
  target = addTarget();
  const style = makeMotionStyle();
  const getPropertyValue = style.getPropertyValue.bind(style);
  readParameter = vi.spyOn(style, "getPropertyValue").mockImplementation((name) => {
    operations.push("read");
    return getPropertyValue(name);
  });
  vi.spyOn(window, "getComputedStyle").mockReturnValue(style);
});

afterEach(() => {
  cleanup();
  scope.remove();
  if (fontDescriptor) Object.defineProperty(document, "fonts", fontDescriptor);
  else Reflect.deleteProperty(document, "fonts");
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test("先讀取全部參數再寫入，捲動合併為一個 frame 並重用量測", () => {
  const row = document.createElement("div");
  row.dataset.scrollTimeline = "";
  scope.append(row);
  const setProperty = row.style.setProperty.bind(row.style);
  vi.spyOn(row.style, "setProperty").mockImplementation((...arguments_) => {
    operations.push("write");
    return setProperty(...arguments_);
  });
  renderHook(() => useScrollMotion({ current: scope }));
  expect(operations.lastIndexOf("read")).toBeLessThan(operations.indexOf("write"));
  const reads = readParameter.mock.calls.length;
  operations = [];
  for (let index = 0; index < 5; index++) window.dispatchEvent(new Event("scroll"));
  expect(frameIdToCallback.size).toBe(1);
  flushFrame();
  expect(readParameter).toHaveBeenCalledTimes(reads);
  operations = [];
  ResizeObserverStub.instances[0].notify();
  flushFrame();
  expect(readParameter).toHaveBeenCalledTimes(reads * 2);
  expect(operations.lastIndexOf("read")).toBeLessThan(operations.indexOf("write"));
});

test("偏好與列印即時清除動態，恢復時使用目前位置", () => {
  reducedMotion.matches = true;
  renderHook(() => useScrollMotion({ current: scope }));
  expect(readParameter).not.toHaveBeenCalled();
  expect(scope).not.toHaveAttribute("data-scroll-motion-active");
  reducedMotion.change(false);
  expect(scope).toHaveAttribute("data-scroll-motion-active");
  expect(target.style.getPropertyValue("--scroll-y")).not.toBe("");
  printMedia.change(true);
  expect(scope).not.toHaveAttribute("data-scroll-motion-active");
  expect(target.style.getPropertyValue("--scroll-y")).toBe("");
  vi.stubGlobal("scrollY", 2000);
  printMedia.change(false);
  expect(target.style.getPropertyValue("--scroll-y")).toBe("-67.200px");
  reducedMotion.change(true);
  expect(target.style.getPropertyValue("--scroll-opacity")).toBe("");
});

test("字型與內容改變會重新量測，新增元素會重新收集並排除 inert 內容", async () => {
  renderHook(() => useScrollMotion({ current: scope }));
  const initialReads = readParameter.mock.calls.length;
  await act(async () => resolveFonts());
  expect(frameIdToCallback.size).toBe(1);
  flushFrame();
  expect(readParameter).toHaveBeenCalledTimes(initialReads * 2);
  const additional = addTarget("heading");
  const hidden = addTarget();
  hidden.setAttribute("inert", "");
  MutationObserverStub.instances[0].notify([{ type: "childList" }]);
  flushFrame();
  expect(additional.style.getPropertyValue("--scroll-scale")).not.toBe("");
  expect(hidden.style.getPropertyValue("--scroll-scale")).toBe("");
  hidden.removeAttribute("inert");
  MutationObserverStub.instances[0].notify([{ type: "attributes" }]);
  flushFrame();
  expect(hidden.style.getPropertyValue("--scroll-scale")).not.toBe("");
});

test("頁面隱藏時取消 frame，恢復及歷史定位後重新量測", () => {
  const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  renderHook(() => useScrollMotion({ current: scope }));
  window.dispatchEvent(new Event("scroll"));
  hidden.mockReturnValue(true);
  document.dispatchEvent(new Event("visibilitychange"));
  expect(frameIdToCallback.size).toBe(0);
  window.dispatchEvent(new Event("scroll"));
  expect(frameIdToCallback.size).toBe(0);
  hidden.mockReturnValue(false);
  document.dispatchEvent(new Event("visibilitychange"));
  flushFrame();
  const reads = readParameter.mock.calls.length;
  MutationObserverStub.instances[1].notify([{ type: "attributes" }]);
  flushFrame();
  expect(readParameter.mock.calls.length).toBeGreaterThan(reads);
});

test("參數失效時回報原因並清除動態與瀏覽器資源", () => {
  renderHook(() => useScrollMotion({ current: scope }));
  const readValue = readParameter.getMockImplementation()!;
  readParameter.mockImplementation((name) =>
    name === "--motion-hero-tilt" ? "4px" : readValue(name),
  );
  ResizeObserverStub.instances[0].notify();
  expect(flushFrame).toThrow("--motion-hero-tilt");
  expect(scope).not.toHaveAttribute("data-scroll-motion-active");
  expect(target.style.getPropertyValue("--scroll-y")).toBe("");
  window.dispatchEvent(new Event("scroll"));
  window.dispatchEvent(new Event("resize"));
  expect(frameIdToCallback.size).toBe(0);
  for (const observer of [
    ...ResizeObserverStub.instances,
    ...MutationObserverStub.instances,
  ])
    expect(observer.disconnect).toHaveBeenCalled();
});

test("Strict Mode 重掛與卸載清除 observer、事件、frame 及尚未完成的字型 callback", async () => {
  const view = renderHook(() => useScrollMotion({ current: scope }), {
    wrapper: StrictMode,
  });
  expect(ResizeObserverStub.instances).toHaveLength(2);
  window.dispatchEvent(new Event("scroll"));
  expect(frameIdToCallback.size).toBe(1);
  view.unmount();
  expect(frameIdToCallback.size).toBe(0);
  expect(scope).not.toHaveAttribute("data-scroll-motion-active");
  expect(target.style.getPropertyValue("--scroll-y")).toBe("");
  for (const observer of [
    ...ResizeObserverStub.instances,
    ...MutationObserverStub.instances,
  ])
    expect(observer.disconnect).toHaveBeenCalled();
  const reads = readParameter.mock.calls.length;
  await act(async () => resolveFonts());
  for (const event of ["scroll", "resize"]) window.dispatchEvent(new Event(event));
  scope.dispatchEvent(new Event("load"));
  document.dispatchEvent(new Event("visibilitychange"));
  reducedMotion.change(true);
  printMedia.change(true);
  for (const observer of ResizeObserverStub.instances) observer.notify();
  for (const observer of MutationObserverStub.instances)
    observer.notify([{ type: "childList" }]);
  expect(frameIdToCallback.size).toBe(0);
  expect(readParameter).toHaveBeenCalledTimes(reads);
});
