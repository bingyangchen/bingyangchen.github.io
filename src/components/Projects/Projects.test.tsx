import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import Projects from "./Projects";
import { homeProjects } from "../../data/projects";
import { LanguageSwitcher } from "../LanguageSwitcher/LanguageSwitcher";
import { renderWithLanguage } from "../../test-utils/render";
import { englishDictionary } from "../../i18n/dictionaries/en";
import { traditionalChineseDictionary } from "../../i18n/dictionaries/zhtw";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

test("SITE-R7.1 初始作品清單", () => {
  renderWithLanguage(<Projects />);
  const tabs = screen.getAllByRole("tab");
  expect(tabs.map((tab) => tab.textContent)).toEqual(
    homeProjects.map((project) => project.title),
  );
  expect(tabs[0]).toHaveAttribute("aria-selected", "true");
  expect(tabs[0]).toHaveAttribute("tabindex", "0");
  expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
  expect(
    within(screen.getByRole("tabpanel")).getByRole("heading", { name: "Taigu" }),
  ).toBeInTheDocument();
  const panels = screen.getAllByRole("tabpanel", { hidden: true });
  expect(panels[0]).not.toHaveAttribute("inert");
  for (const panel of panels.slice(1)) {
    expect(panel).toHaveAttribute("inert", "");
    expect(panel).toHaveAttribute("aria-hidden", "true");
    expect(panel).toHaveAttribute("tabindex", "-1");
  }
});

test.each([
  ["en", englishDictionary],
  ["zh-TW", traditionalChineseDictionary],
] as const)("SITE-R7.5 SITE-R7.6 作品內容與期間 %s", (language, dictionary) => {
  renderWithLanguage(<Projects />, language);
  for (const project of homeProjects) {
    fireEvent.click(screen.getByRole("tab", { name: project.title }));
    const content = within(screen.getByRole("tabpanel"));
    const copy = dictionary.projectsData[project.id];
    for (const text of [copy.description, copy.purpose, copy.image_description])
      expect(content.getByText(text)).toBeInTheDocument();
    expect(content.getByRole("link", { name: copy.visit_label })).toHaveAttribute(
      "href",
      project.demo_url,
    );
    expect(content.getByText(copy.tags.join(" · "))).toBeInTheDocument();
  }
  fireEvent.click(screen.getByRole("tab", { name: "Noads" }));
  expect(within(screen.getByRole("tabpanel")).getByText("2024")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "Taigu" }));
  expect(
    within(screen.getByRole("tabpanel")).getByText(
      language === "en" ? "2021 to Present" : "2021 年至今",
    ),
  ).toBeInTheDocument();
});

test("SITE-R7.5 切換語言保留作品選取、圖片與外連", () => {
  renderWithLanguage(
    <>
      <Projects />
      <LanguageSwitcher />
    </>,
  );
  fireEvent.click(screen.getByRole("tab", { name: "Leechai" }));
  const panel = screen.getByRole("tabpanel");
  const images = [...panel.querySelectorAll("img")].map((image) => image.src);
  const links = within(panel)
    .getAllByRole("link")
    .map((link) => link.getAttribute("href"));
  fireEvent.click(
    screen.getByRole("button", { name: englishDictionary.header.switchLanguage }),
  );
  expect(screen.getByRole("tab", { name: "Leechai" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(
    within(panel).getByText(
      traditionalChineseDictionary.projectsData.leechai.description,
    ),
  ).toBeInTheDocument();
  expect([...panel.querySelectorAll("img")].map((image) => image.src)).toEqual(images);
  expect(
    within(panel)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href")),
  ).toEqual(links);
});

test("分頁以方向鍵循環、Home 與 End 切換並保留焦點", () => {
  renderWithLanguage(<Projects />);
  const tabs = screen.getAllByRole("tab");
  tabs[0].focus();
  fireEvent.keyDown(tabs[0], { key: "ArrowLeft" });
  expect(tabs[2]).toHaveFocus();
  expect(tabs[2]).toHaveAttribute("aria-selected", "true");
  fireEvent.keyDown(tabs[2], { key: "ArrowRight" });
  expect(tabs[0]).toHaveFocus();
  fireEvent.keyDown(tabs[0], { key: "End" });
  expect(tabs[2]).toHaveFocus();
  fireEvent.keyDown(tabs[2], { key: "Home" });
  expect(tabs[0]).toHaveFocus();
});

test("SITE-R8.1 作品展示", () => {
  renderWithLanguage(<Projects />);
  for (const project of homeProjects) {
    fireEvent.click(screen.getByRole("tab", { name: project.title }));
    const label = englishDictionary.projectsData[project.id].visit_label;
    expect(
      within(screen.getByRole("tabpanel")).getByRole("link", { name: label }),
    ).toHaveAttribute("href", project.demo_url);
  }
});

test("SITE-R8.2 作品程式碼", () => {
  renderWithLanguage(<Projects />);
  for (const project of homeProjects) {
    fireEvent.click(screen.getByRole("tab", { name: project.title }));
    expect(
      within(screen.getByRole("tabpanel")).getByRole("link", { name: "Source Code" }),
    ).toHaveAttribute("href", project.source_code_url);
  }
});

test("SITE-R8.3 新分頁隔離", () => {
  renderWithLanguage(<Projects />);
  for (const anchor of screen.getAllByRole("link", { hidden: true })) {
    expect(anchor).toHaveAttribute("target", "_blank");
    expect(anchor.getAttribute("rel")?.split(" ")).toEqual(
      expect.arrayContaining(["noopener", "noreferrer"]),
    );
  }
});
