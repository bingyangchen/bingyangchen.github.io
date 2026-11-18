import { cleanup } from "@testing-library/react";
import { renderWithLanguage } from "../../test-utils/render";
import Home from "./Home";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

test("首頁區塊保留順序、原生落點及共同的動態範圍", () => {
  const { container } = renderWithLanguage(<Home />);
  const scope = container.firstElementChild!;
  const sections = Array.from(scope.children);
  expect(sections.map((section) => section.id)).toEqual([
    "home",
    "about",
    "projects",
    "blog",
  ]);
  expect(sections.every((section) => section.parentElement === scope)).toBe(true);
  expect(sections.every((section) => section.getAttribute("tabindex") === "-1")).toBe(
    true,
  );
  expect(sections[0]).toHaveAttribute("data-scroll-anchor");
  expect(scope.querySelectorAll('[data-scroll-motion="hero"]')).toHaveLength(1);
  expect(sections[1].querySelectorAll("article[data-chapter]")).toHaveLength(3);
  expect(container.querySelector('a[href="#about"]')).toBeInTheDocument();
});
