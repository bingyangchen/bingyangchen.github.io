import { resolve } from "node:path";
import { cwd } from "node:process";
import { compileString } from "sass";
import postcss from "postcss";

const stylesheet = postcss.parse(
  compileString('@use "motion"; .fixture { @include motion.scope; }', {
    loadPaths: [resolve(cwd(), "src/styles")],
  }).css,
);

export function makeMotionStyle(compact = false): CSSStyleDeclaration {
  const style = document.createElement("div").style;
  stylesheet.walkRules((rule) => {
    if (
      rule.parent?.type !== "root" &&
      !(
        compact &&
        rule.parent?.type === "atrule" &&
        rule.parent.params.startsWith("(max-width:")
      )
    )
      return;
    rule.walkDecls(/^--motion-/, ({ prop, value }) => style.setProperty(prop, value));
  });
  return style;
}
