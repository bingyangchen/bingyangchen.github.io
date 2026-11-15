import { makeMotionStyle } from "./fixtures/style";
import { parseMotionParameters } from "./parameters";

test.each([false, true])("Sass 與計算使用相同參數及單位，compact=%s", (compact) => {
  const style = makeMotionStyle(compact);
  const getPropertyValue = vi.spyOn(style, "getPropertyValue");
  const parameters = parseMotionParameters(style);
  const properties = Array.from({ length: style.length }, (_, index) =>
    style.item(index),
  );
  expect(getPropertyValue.mock.calls.map(([name]) => name).sort()).toEqual(
    properties.filter((name) => name !== "--motion-perspective").sort(),
  );
  expect(parameters["content-distance"]).toBe(compact ? 56 : 96);
  expect(parameters["depth-scale"]).toBe(compact ? 0.6 : 1);
  expect(parameters["hero-distance"]).toBe(160);
  expect(parameters["hero-tilt"]).toBe(4);
});

test.each([
  "",
  "96",
  "96rem",
  "96%",
  "96px extra",
  "calc(48px * 2)",
  "Infinitypx",
  "1e309px",
])("拒絕缺漏、錯誤單位及非有限的距離：%s", (value) => {
  const style = makeMotionStyle();
  style.setProperty("--motion-content-distance", value);
  expect(() => parseMotionParameters(style)).toThrow("--motion-content-distance");
});

test.each([
  ["--motion-hero-tilt", "4px"],
  ["--motion-minimum-opacity", "18%"],
  ["--motion-depth-scale", "1 trailing"],
])("拒絕參數 %s 的錯誤值 %s", (name, value) => {
  const style = makeMotionStyle();
  style.setProperty(name, value);
  expect(() => parseMotionParameters(style)).toThrow(name);
});

test("CSS 參數拼錯時指出缺漏名稱", () => {
  const style = makeMotionStyle();
  style.removeProperty("--motion-hero-distance");
  style.setProperty("--motion-hero-distnace", "160px");
  expect(() => parseMotionParameters(style)).toThrow("--motion-hero-distance");
});

test("完整解析有正負號、指數及大小寫單位的 CSS 數值", () => {
  const style = makeMotionStyle();
  style.setProperty("--motion-content-distance", "+9.6e1PX");
  style.setProperty("--motion-hero-tilt", "4DEG");
  style.setProperty("--motion-minimum-opacity", ".18");
  const parameters = parseMotionParameters(style);
  expect(parameters["content-distance"]).toBe(96);
  expect(parameters["hero-tilt"]).toBe(4);
  expect(parameters["minimum-opacity"]).toBe(0.18);
});

test.each([
  ["entrance-start", "0.42", "entrance"],
  ["long-content-end", "1.04", "entrance"],
  ["exit-end", "-0.24", "exit range"],
  ["hint-exit", "0", "hint exit"],
  ["skill-stagger", "-0.025", "skill stagger"],
])("參數 %s 不得使進度區間無效", (name, value, error) => {
  const style = makeMotionStyle();
  style.setProperty(`--motion-${name}`, value);
  expect(() => parseMotionParameters(style)).toThrow(error);
});
