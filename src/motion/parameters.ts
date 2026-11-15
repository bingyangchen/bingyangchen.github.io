const PARAMETER_NAME_TO_UNIT = {
  "content-distance": "px",
  "depth-scale": "",
  "entrance-start": "",
  "entrance-end": "",
  "long-content-threshold": "",
  "long-content-end": "",
  "exit-start": "",
  "exit-end": "",
  "minimum-opacity": "",
  "content-shrink": "",
  "content-exit-shrink": "",
  "exit-distance-scale": "",
  "hero-distance": "px",
  "atmosphere-distance": "px",
  "hero-fade": "",
  "hero-shrink": "",
  "hero-tilt": "deg",
  "hint-exit": "",
  "heading-shrink": "",
  "heading-exit-shrink": "",
  "artwork-shrink": "",
  "artwork-exit-shrink": "",
  "artwork-distance-scale": "",
  "artwork-exit-distance-scale": "",
  "skill-stagger": "",
  "timeline-reading-line": "",
  "timeline-dot-start": "",
  "timeline-dot-growth": "",
} as const;

export type MotionParameters = Record<keyof typeof PARAMETER_NAME_TO_UNIT, number>;

export function parseMotionParameters(
  style: Pick<CSSStyleDeclaration, "getPropertyValue">,
): MotionParameters {
  const parameters = {} as MotionParameters;
  for (const name of Object.keys(
    PARAMETER_NAME_TO_UNIT,
  ) as (keyof MotionParameters)[]) {
    const property = `--motion-${name}`;
    const raw = style.getPropertyValue(property).trim();
    const match = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(px|deg)?$/i.exec(raw);
    if (!match || (match[2]?.toLowerCase() ?? "") !== PARAMETER_NAME_TO_UNIT[name])
      throw new Error(`Invalid motion parameter ${property}: ${raw || "(missing)"}`);
    const value = Number(match[1]);
    if (!Number.isFinite(value))
      throw new Error(`Non-finite motion parameter ${property}: ${raw}`);
    parameters[name] = value;
  }
  if (
    parameters["entrance-start"] <=
    Math.max(parameters["entrance-end"], parameters["long-content-end"])
  )
    throw new Error("Motion entrance must start below both reading thresholds");
  if (parameters["exit-start"] + parameters["exit-end"] <= 0)
    throw new Error("Motion exit range must be positive");
  if (parameters["hint-exit"] <= 0)
    throw new Error("Motion hint exit range must be positive");
  if (parameters["skill-stagger"] < 0)
    throw new Error("Motion skill stagger must be non-negative");
  return parameters;
}
