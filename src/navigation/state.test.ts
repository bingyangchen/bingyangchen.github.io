import { parseSectionHash } from "./sections";
import {
  resolveRestorationState,
  parseReadingPosition,
  transitionNavigation,
  type NavigationState,
} from "./state";

test.each([
  null,
  undefined,
  7,
  "history",
  [],
  {},
  { siteScrollPosition: null },
  { siteScrollPosition: [100, 0] },
  { siteScrollPosition: { top: "100", left: 0 } },
  { siteScrollPosition: { top: 100 } },
  { siteScrollPosition: { top: 100, left: NaN } },
  { siteScrollPosition: { top: Infinity, left: 0 } },
  { siteScrollPosition: { top: 100, left: -Infinity } },
])("SITE-R2.4 無效 history 輸入仍可依 hash 定位：%j", (historyState) => {
  expect(parseReadingPosition(historyState)).toBeUndefined();
  expect(resolveRestorationState(historyState, "#about")).toEqual({
    mode: "restoring",
    stage: "aligning",
    destination: { section: "about" },
  });
  expect(resolveRestorationState(historyState, "#unknown")).toEqual({
    mode: "reading",
  });
});

test("SITE-R2.3 SITE-R2.4 有效閱讀位置優先於區塊，且只取座標", () => {
  const position = { top: 1234.5, left: 12, behavior: "smooth" };
  const historyState = { siteScrollPosition: position, idx: 3 };
  const state = resolveRestorationState(historyState, "#projects");
  expect(state).toEqual({
    mode: "restoring",
    stage: "aligning",
    destination: { position: { top: 1234.5, left: 12 } },
  });
  position.top = 0;
  expect(state).toEqual({
    mode: "restoring",
    stage: "aligning",
    destination: { position: { top: 1234.5, left: 12 } },
  });
  expect(parseReadingPosition({ siteScrollPosition: { top: 0, left: 0 } })).toEqual({
    top: 0,
    left: 0,
  });
});

test("SITE-R2.1 原生點擊先等位置事件，再等捲動抵達目的地", () => {
  let state = transitionNavigation(
    { mode: "reading" },
    { type: "activate", section: "projects", changesHash: true },
  );
  const activating = state;
  state = transitionNavigation(state, { type: "destination-reached" });
  expect(state).toBe(activating);
  state = transitionNavigation(state, {
    type: "popstate",
    hash: "#projects",
    historyState: null,
  });
  expect(state).toBe(activating);
  state = transitionNavigation(state, {
    type: "hashchange",
    hash: "#projects",
    historyState: null,
  });
  expect(state).toEqual({
    mode: "navigating",
    section: "projects",
    stage: "scrolling",
  });
  expect(transitionNavigation(state, { type: "destination-reached" })).toEqual({
    mode: "reading",
  });
});

test("SITE-R2.1 相同 hash 的點擊不等待不一定會發出的 hashchange", () => {
  const state = transitionNavigation(
    { mode: "reading" },
    { type: "activate", section: "about", changesHash: false },
  );
  const activated = transitionNavigation(state, { type: "activation-finished" });
  expect(transitionNavigation(activated, { type: "destination-reached" })).toEqual({
    mode: "reading",
  });
});

test("SITE-R2.3 歷史切換取代尚未完成的導覽，還原抵達後仍保留目的地", () => {
  let state = transitionNavigation(
    { mode: "reading" },
    { type: "activate", section: "blog", changesHash: true },
  );
  state = transitionNavigation(state, {
    type: "popstate",
    hash: "#about",
    historyState: { siteScrollPosition: { top: 1200, left: 0 } },
  });
  const expected = {
    mode: "restoring",
    stage: "aligning",
    destination: { position: { top: 1200, left: 0 } },
  };
  expect(state).toEqual(expected);
  state = transitionNavigation(state, { type: "destination-reached" });
  expect(state).toEqual({ ...expected, stage: "tracking" });
  state = transitionNavigation(state, {
    type: "hashchange",
    hash: "#about",
    historyState: { siteScrollPosition: { top: 1200, left: 0 } },
  });
  expect(state).toEqual(expected);
  expect(transitionNavigation(state, { type: "user-intent" })).toEqual({
    mode: "reading",
  });
});

test.each<NavigationState>([
  { mode: "reading" },
  { mode: "navigating", section: "projects", stage: "activating" },
  { mode: "navigating", section: "projects", stage: "activating-same-hash" },
  { mode: "navigating", section: "projects", stage: "scrolling" },
  { mode: "restoring", stage: "aligning", destination: { section: "about" } },
  { mode: "restoring", stage: "tracking", destination: { section: "about" } },
])("SITE-R2.1 新點擊與使用者中斷可取代目前的 $mode 階段", (state) => {
  expect(
    transitionNavigation(state, {
      type: "activate",
      section: "blog",
      changesHash: true,
    }),
  ).toEqual({ mode: "navigating", section: "blog", stage: "activating" });
  expect(transitionNavigation(state, { type: "user-intent" })).toEqual({
    mode: "reading",
  });
});

test("SITE-R2.1 只辨識固定區塊，不將未知 fragment 視為區塊", () => {
  expect(parseSectionHash("#home")).toBe("home");
  expect(parseSectionHash("#about")).toBe("about");
  expect(parseSectionHash("#projects")).toBe("projects");
  expect(parseSectionHash("#blog")).toBe("blog");
  for (const hash of ["", "about", "#ABOUT", "#main-content", "#about/child"])
    expect(parseSectionHash(hash)).toBeUndefined();
});
