import {
  calculatePose,
  calculateTimeline,
  parseMotionKind,
  type MotionKind,
} from "./calculation";
import { makeMotionStyle } from "./fixtures/style";
import { parseMotionParameters } from "./parameters";

const parameters = Object.freeze(parseMotionParameters(makeMotionStyle()));
const viewport = Object.freeze({ height: 1000, scrollTop: 0, headerBottom: 80 });
const restingPose = { y: 0, opacity: 1, scale: 1, tilt: 0 };

test.each(["content", "heading", "hero", "atmosphere", "hint", "portrait", "skill"])(
  "辨識既有動態種類 %s",
  (kind) => expect(parseMotionKind(kind)).toBe(kind),
);

test.each([undefined, "", "unknown", "Hero"])("拒絕未定義的動態種類 %s", (kind) => {
  expect(() => parseMotionKind(kind)).toThrow("Unknown motion kind");
});

test.each(["content", "heading", "portrait", "skill"] as const)(
  "%s 在短內容與長內容的閱讀區保持原位",
  (kind) => {
    for (const [height, top] of [
      [100, 420],
      [651, 620],
      [2000, 620],
    ]) {
      expect(
        calculatePose({ kind, order: 0, top, height }, viewport, parameters),
      ).toEqual(restingPose);
    }
    const threshold = calculatePose(
      { kind, order: 0, top: 620, height: 650 },
      viewport,
      parameters,
    );
    expect(threshold.opacity).toBeLessThan(1);
  },
);

test.each([
  ["content", 0.965, 0.98],
  ["heading", 0.92, 0.975],
  ["portrait", 0.82, 0.95],
  ["skill", 0.82, 0.95],
] as const)("%s 進退場超出上下界時保持端點", (kind, initialScale, finalScale) => {
  const target = { kind, order: 0, height: 100, top: 2000 };
  const before = calculatePose(target, viewport, parameters);
  expect(before.opacity).toBeCloseTo(0.18);
  expect(before.scale).toBeCloseTo(initialScale);
  expect(before.y).toBeCloseTo(kind === "portrait" || kind === "skill" ? 76.8 : 96);
  expect(calculatePose({ ...target, top: 1040 }, viewport, parameters)).toEqual(before);
  const after = calculatePose({ ...target, top: -2000 }, viewport, parameters);
  expect(after.opacity).toBeCloseTo(0.18);
  expect(after.scale).toBeCloseTo(finalScale);
  expect(after.y).toBeCloseTo(kind === "portrait" || kind === "skill" ? -43.2 : -67.2);
});

test("技能錯開進場，但在各自閱讀區恢復原位", () => {
  const first = { kind: "skill" as const, order: 0, height: 100, top: 420 };
  const last = { ...first, order: 3 };
  expect(calculatePose(first, viewport, parameters)).toEqual(restingPose);
  expect(calculatePose(last, viewport, parameters).opacity).toBeLessThan(1);
  expect(calculatePose({ ...last, top: 345 }, viewport, parameters)).toEqual(
    restingPose,
  );
});

test("內容在進退場四分之一處使用 smoothstep 曲線", () => {
  const target = { kind: "content" as const, order: 0, height: 100, top: 885 };
  const entering = calculatePose(target, viewport, parameters);
  expect(entering.y).toBeCloseTo(81);
  expect(entering.opacity).toBeCloseTo(0.308125, 6);
  expect(entering.scale).toBeCloseTo(0.97046875, 8);
  const exiting = calculatePose({ ...target, top: 140 }, viewport, parameters);
  expect(exiting.y).toBeCloseTo(-10.5);
  expect(exiting.opacity).toBeCloseTo(0.871875, 6);
  expect(exiting.scale).toBeCloseTo(0.996875, 6);
});

test("長 Hero、背景與提示在讀完之前保持完整，之後使用相同延遲", () => {
  for (const kind of ["hero", "atmosphere", "hint"] as const) {
    const target = { kind, order: 0, top: 0, height: 1800 };
    for (const scrollTop of [0, 400, 800]) {
      const pose = calculatePose(target, { ...viewport, scrollTop }, parameters);
      expect(pose.y).toBeCloseTo(0);
      expect(pose.opacity).toBe(1);
      expect(pose.scale).toBe(1);
      expect(pose.tilt).toBe(0);
    }
    const halfway = calculatePose(target, { ...viewport, scrollTop: 1260 }, parameters);
    expect(halfway.y).toBe(kind === "hero" ? -80 : kind === "atmosphere" ? -32 : 0);
    expect(halfway.opacity).toBeCloseTo(
      kind === "hero" ? 0.61 : kind === "hint" ? 0 : 1,
    );
    expect(halfway.scale).toBeCloseTo(kind === "hero" ? 0.93 : 1);
    expect(halfway.tilt).toBe(kind === "hero" ? 2 : 0);
  }
});

test("短 Hero 退場端點與窄版幅度保持原有規則", () => {
  const target = { kind: "hero" as const, order: 0, top: 0, height: 600 };
  const exited = { ...viewport, scrollTop: 1000 };
  const pose = calculatePose(target, exited, parameters);
  expect(pose.y).toBe(-160);
  expect(pose.opacity).toBeCloseTo(0.22);
  expect(pose.scale).toBeCloseTo(0.86);
  expect(pose.tilt).toBe(4);
  expect(
    calculatePose(target, exited, parseMotionParameters(makeMotionStyle(true))).y,
  ).toBe(-96);
});

test("不同高度與種類往返相同位置得到相同的有限數值", () => {
  for (const kind of [
    "content",
    "heading",
    "hero",
    "atmosphere",
    "hint",
    "portrait",
    "skill",
  ] as MotionKind[]) {
    for (const height of [0, 1, 100, 650, 651, 1800]) {
      const target = { kind, order: 3, top: 1200, height };
      const positions = [0, 160, 580, 1000, 1200, 2000, 4000];
      const forward = positions.map((scrollTop) =>
        calculatePose(target, { ...viewport, scrollTop }, parameters),
      );
      const backward = positions
        .toReversed()
        .map((scrollTop) =>
          calculatePose(target, { ...viewport, scrollTop }, parameters),
        );
      expect(backward.toReversed()).toEqual(forward);
      for (const pose of forward) {
        expect(Object.values(pose).every(Number.isFinite)).toBe(true);
        expect(pose.opacity).toBeGreaterThanOrEqual(0);
        expect(pose.opacity).toBeLessThanOrEqual(1);
        expect(pose.scale).toBeGreaterThan(0);
        expect(pose.scale).toBeLessThanOrEqual(1);
      }
    }
  }
});

test("時間軸依閱讀線及段落高度延展，零高度與兩端仍有界", () => {
  for (const [top, progress, dotScale] of [
    [720, 0, 0.75],
    [620, 0, 0.75],
    [570, 0.5, 0.925],
    [520, 1, 1.1],
    [-1000, 1, 1.1],
  ]) {
    const result = calculateTimeline({ top, height: 100 }, viewport, parameters);
    expect(result.progress).toBe(progress);
    expect(result.dotScale).toBeCloseTo(dotScale);
  }
  expect(
    calculateTimeline({ top: 620, height: 0 }, viewport, parameters).progress,
  ).toBe(0);
  expect(
    calculateTimeline({ top: 619, height: 0 }, viewport, parameters).progress,
  ).toBe(1);
});
