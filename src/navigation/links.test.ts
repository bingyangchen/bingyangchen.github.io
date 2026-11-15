import { cleanup } from "@testing-library/react";
import { getActivatedSection } from "./links";

function activate(anchor: HTMLAnchorElement, options: MouseEventInit = {}) {
  let section: ReturnType<typeof getActivatedSection>;
  anchor.addEventListener(
    "click",
    (event) => {
      section = getActivatedSection(event);
      event.preventDefault();
    },
    { once: true },
  );
  anchor.firstElementChild!.dispatchEvent(
    new MouseEvent("click", { bubbles: true, cancelable: true, ...options }),
  );
  return section;
}

let anchor: HTMLAnchorElement;

beforeEach(() => {
  window.history.replaceState(null, "", "/?view=home#home");
  anchor = document.createElement("a");
  anchor.href = "#projects";
  anchor.append(document.createElement("span"));
  document.body.append(anchor);
});

afterEach(() => {
  anchor.remove();
  document.querySelector("base")?.remove();
  cleanup();
});

test("SITE-R2.1 點擊連結內的子元素仍能取得區塊，空 target 與 _self 均可", () => {
  expect(activate(anchor)).toBe("projects");
  anchor.target = "_SELF";
  expect(activate(anchor)).toBe("projects");
});

test.each<MouseEventInit>([
  { button: 1 },
  { button: 2 },
  { ctrlKey: true },
  { metaKey: true },
  { altKey: true },
  { shiftKey: true },
])("SITE-R2.1 修飾鍵及非主要按鈕保留原生行為：%j", (options) => {
  expect(activate(anchor, options)).toBeUndefined();
});

test.each([
  "https://example.com/?view=home#projects",
  "/resume?view=home#projects",
  "/?view=other#projects",
  "#unknown",
  "#main-content",
  "mailto:person@example.com",
])("SITE-R2.1 不接管不同文件或未知區塊：%s", (href) => {
  anchor.href = href;
  expect(activate(anchor)).toBeUndefined();
});

test.each(["_blank", "_parent", "_top", "preview"])(
  "SITE-R2.1 不接管其他 target：%s",
  (target) => {
    anchor.target = target;
    expect(activate(anchor)).toBeUndefined();
  },
);

test("SITE-R2.1 下載、已取消的點擊及 base target 保留原生處理", () => {
  anchor.download = "";
  expect(activate(anchor)).toBeUndefined();
  anchor.removeAttribute("download");
  anchor.addEventListener("click", (event) => event.preventDefault(), { once: true });
  expect(activate(anchor)).toBeUndefined();
  const base = document.createElement("base");
  base.target = "preview";
  document.head.append(base);
  expect(activate(anchor)).toBeUndefined();
  anchor.target = "_self";
  expect(activate(anchor)).toBe("projects");
  anchor.target = "";
  expect(activate(anchor)).toBe("projects");
});
