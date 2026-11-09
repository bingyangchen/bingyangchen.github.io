import { type Page } from "@playwright/test";
import assert from "node:assert/strict";
import { settleMotion } from "./motion";

export async function assertFocusRing(page: Page, color: string, offset = 3) {
  await page.waitForFunction(
    (expectedOffset) => {
      const style = getComputedStyle(document.activeElement as HTMLElement);
      return (
        style.outlineWidth === "2px" && style.outlineOffset === `${expectedOffset}px`
      );
    },
    offset,
    {},
  );
  const ring = await page.evaluate(() => {
    const element = document.activeElement as HTMLElement;
    const style = getComputedStyle(element);
    return {
      color: style.outlineColor,
      width: style.outlineWidth,
      style: style.outlineStyle,
      offset: style.outlineOffset,
      visible: element.matches(":focus-visible"),
    };
  });
  assert.deepEqual(ring, {
    color,
    width: "2px",
    style: "solid",
    offset: `${offset}px`,
    visible: true,
  });
}

export async function assertVisibleEdges(page: Page, color: number[]) {
  await settleMotion(page);
  const screenshot = (await page.screenshot()).toString("base64");
  const edges = await page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    const scale = image.width / window.innerWidth;
    const y = Math.round(
      (document.querySelector<HTMLElement>("header")!.getBoundingClientRect().bottom +
        20) *
        scale,
    );
    return [0, image.width - 1].map((x) =>
      [...context.getImageData(x, y, 1, 1).data].slice(0, 3),
    );
  }, screenshot);
  assert.deepEqual(edges, [color, color]);
}

export async function getControlAccessibility(page: Page, selector: string) {
  const session = await page.context().newCDPSession(page);
  try {
    const { root } = await session.send("DOM.getDocument");
    const { nodeId } = await session.send("DOM.querySelector", {
      nodeId: root.nodeId,
      selector,
    });
    assert.ok(nodeId, `${selector} exists`);
    const { nodes } = await session.send("Accessibility.getPartialAXTree", {
      nodeId,
      fetchRelatives: false,
    });
    const node = nodes.find((node) => !node.ignored);
    assert.ok(node, `${selector} remains accessible`);
    return {
      role: node.role?.value,
      name: node.name?.value,
      description: node.description?.value,
    };
  } finally {
    await session.detach();
  }
}

export async function assertColorContrast(page: Page, selector: string, minimum = 4.5) {
  const results = await page
    .locator(selector)
    .evaluateAll((elements: HTMLElement[]) => {
      const parseColor = (color: string) => {
        const channels = color.match(/[\d.]+/g)!.map(Number);
        return [...channels.slice(0, 3), channels[3] ?? 1];
      };
      const compositeColor = (foreground: number[], background: number[]) =>
        background.map(
          (channel, index) =>
            foreground[index] * foreground[3] + channel * (1 - foreground[3]),
        );
      const getLuminance = (color: number[]) => {
        const channels = color.map((value) => {
          const channel = value / 255;
          return channel <= 0.04045
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4;
        });
        return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
      };
      return elements.map((element) => {
        const style = getComputedStyle(element);
        const backgrounds: number[][] = [];
        for (
          let parent = style.backdropFilter === "none" ? element.parentElement : null;
          parent;
          parent = parent.parentElement
        ) {
          const parentStyle = getComputedStyle(parent);
          backgrounds.push(parseColor(parentStyle.backgroundColor));
          if (parentStyle.backdropFilter !== "none" || backgrounds.at(-1)![3] === 1)
            break;
        }
        const overlay = getComputedStyle(element, "::before");
        const overlayColor = parseColor(overlay.backgroundColor);
        const ratios = [0, 255].map((channel) => {
          const underlay = backgrounds.reduceRight(
            (background, foreground) => compositeColor(foreground, background),
            [channel, channel, channel],
          );
          let background = compositeColor(parseColor(style.backgroundColor), underlay);
          let foreground = compositeColor(parseColor(style.color), background);
          if (overlay.content !== "none") {
            background = compositeColor(overlayColor, background);
            foreground = compositeColor(overlayColor, foreground);
          }
          background = compositeColor([...background, Number(style.opacity)], underlay);
          foreground = compositeColor([...foreground, Number(style.opacity)], underlay);
          const luminances = [foreground, background].map(getLuminance);
          return (Math.max(...luminances) + 0.05) / (Math.min(...luminances) + 0.05);
        });
        return { color: style.color, ratios };
      });
    });
  assert.ok(results.length > 0, `Missing contrast target: ${selector}`);
  for (const result of results)
    assert.ok(
      Math.min(...result.ratios) >= minimum,
      `${selector}: ${result.color}, contrast ${Math.min(...result.ratios)} < ${minimum}`,
    );
}
