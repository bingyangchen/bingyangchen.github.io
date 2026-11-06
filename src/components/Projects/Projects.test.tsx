import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import Projects from "./Projects";
import { homeProjects } from "../../data/projects";
import * as translation from "../../i18n/context";
import { englishDictionary } from "../../i18n/dictionaries/en";
import { traditionalChineseDictionary } from "../../i18n/dictionaries/zhtw";
import type { Language } from "../../i18n/types";

beforeEach(() => {
  jest
    .spyOn(translation, "useTranslation")
    .mockReturnValue({
      language: "en",
      setLanguage: jest.fn(),
      dictionary: englishDictionary,
    });
});

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});

test("SITE-R7.1 初始作品清單", () => {
  render(<Projects />);
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

test("SITE-R7.5 內容與翻譯", () => {
  const view = render(<Projects />);
  expect(
    within(screen.getByRole("tabpanel")).getByText(
      englishDictionary.projectsData.Taigu.description,
    ),
  ).toBeInTheDocument();
  jest
    .spyOn(translation, "useTranslation")
    .mockReturnValue({
      language: "en",
      setLanguage: jest.fn(),
      dictionary: { ...englishDictionary, projectsData: {} },
    });
  view.rerender(<Projects />);
  for (const project of homeProjects) {
    fireEvent.click(screen.getByRole("tab", { name: project.title }));
    const content = within(screen.getByRole("tabpanel"));
    expect(content.getByText(project.description)).toBeInTheDocument();
    expect(content.getByText(project.purpose)).toBeInTheDocument();
    expect(content.getByText(project.image_description)).toBeInTheDocument();
    expect(content.getByRole("link", { name: project.visit_label })).toHaveAttribute(
      "href",
      project.demo_url,
    );
    expect(content.getByText(project.tags.join(" · "))).toBeInTheDocument();
  }
});

test.each<Language>(["en", "zh-TW"])(
  "SITE-R7.5 Leechai 描述在 %s 翻譯缺漏時維持個人理財內容",
  (language) => {
    const dictionary =
      language === "en" ? englishDictionary : traditionalChineseDictionary;
    const context = { language, setLanguage: jest.fn(), dictionary };
    const useTranslation = jest.spyOn(translation, "useTranslation");
    useTranslation.mockReturnValue(context);
    const view = render(<Projects />);
    fireEvent.click(screen.getByRole("tab", { name: "Leechai" }));
    const content = within(screen.getByRole("tabpanel"));
    expect(
      content.getByText(dictionary.projectsData.Leechai.description),
    ).toBeInTheDocument();

    const { Leechai, ...otherProjects } = dictionary.projectsData;
    useTranslation.mockReturnValue({
      ...context,
      dictionary: { ...dictionary, projectsData: otherProjects },
    });
    view.rerender(<Projects />);
    expect(
      content.getByText(englishDictionary.projectsData.Leechai.description),
    ).toBeInTheDocument();

    useTranslation.mockReturnValue({
      ...context,
      dictionary: {
        ...dictionary,
        projectsData: { ...otherProjects, Leechai: { ...Leechai, description: "" } },
      },
    });
    view.rerender(<Projects />);
    expect(
      content.getByText(englishDictionary.projectsData.Leechai.description),
    ).toBeInTheDocument();
    expect(content.getByText(Leechai.purpose)).toBeInTheDocument();
    expect(content.getByText(Leechai.image_description)).toBeInTheDocument();
    expect(content.getByText(Leechai.tags.join(" · "))).toBeInTheDocument();
    expect(content.getByRole("link", { name: Leechai.visit_label })).toHaveAttribute(
      "href",
      "https://apps.apple.com/tw/app/leechai-%E7%90%86%E6%9F%B4/id6761012779",
    );
  },
);

test("SITE-R7.6 期間顯示", () => {
  const project = homeProjects[0];
  const originalPeriod = project.maintaining_time_range;
  const view = render(<Projects />);
  try {
    expect(
      within(screen.getByRole("tabpanel")).getByText("2021 to Present"),
    ).toBeInTheDocument();
    project.maintaining_time_range = [new Date(2020, 0, 1), new Date(2022, 0, 1)];
    view.rerender(<Projects />);
    expect(
      within(screen.getByRole("tabpanel")).getByText("2020 to 2022"),
    ).toBeInTheDocument();
    project.maintaining_time_range = [new Date(2024, 0, 1), new Date(2024, 11, 1)];
    view.rerender(<Projects />);
    expect(within(screen.getByRole("tabpanel")).getByText("2024")).toBeInTheDocument();
    jest
      .spyOn(translation, "useTranslation")
      .mockReturnValue({
        language: "zh-TW",
        setLanguage: jest.fn(),
        dictionary: traditionalChineseDictionary,
      });
    project.maintaining_time_range = [new Date(2021, 0, 1)];
    view.rerender(<Projects />);
    expect(
      within(screen.getByRole("tabpanel")).getByText("2021 年至今"),
    ).toBeInTheDocument();
    project.maintaining_time_range = [new Date(2020, 0, 1), new Date(2022, 0, 1)];
    view.rerender(<Projects />);
    expect(
      within(screen.getByRole("tabpanel")).getByText("2020 年至 2022 年"),
    ).toBeInTheDocument();
  } finally {
    project.maintaining_time_range = originalPeriod;
  }
});

test("分頁以方向鍵循環、Home 與 End 切換並保留焦點", () => {
  render(<Projects />);
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
  render(<Projects />);
  for (const project of homeProjects) {
    fireEvent.click(screen.getByRole("tab", { name: project.title }));
    const label = englishDictionary.projectsData[project.title].visit_label;
    expect(
      within(screen.getByRole("tabpanel")).getByRole("link", { name: label }),
    ).toHaveAttribute("href", project.demo_url);
  }
});

test("SITE-R8.2 作品程式碼", () => {
  render(<Projects />);
  for (const project of homeProjects) {
    fireEvent.click(screen.getByRole("tab", { name: project.title }));
    expect(
      within(screen.getByRole("tabpanel")).getByRole("link", { name: "Source Code" }),
    ).toHaveAttribute("href", project.source_code_url);
  }
});

test("SITE-R8.3 新分頁隔離", () => {
  render(<Projects />);
  for (const anchor of screen.getAllByRole("link", { hidden: true })) {
    expect(anchor).toHaveAttribute("target", "_blank");
    expect(anchor.getAttribute("rel")?.split(" ")).toEqual(
      expect.arrayContaining(["noopener", "noreferrer"]),
    );
  }
});
