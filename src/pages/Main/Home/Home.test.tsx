import { act, cleanup, fireEvent, render, within } from "@testing-library/react";
import React from "react";
import Home from "./Home";
import Resume from "../Resume/Resume";
import Footer from "../../../components/Footer/Footer";
import ProjectCard from "../../../components/ProjectCard/ProjectCard";
import ProjectDetail from "../../../components/ProjectDetail/ProjectDetail";
import { homeProjects } from "../../../data/projects";
import { homeSkillItems } from "../../../data/skills";
import { workExperienceItems } from "../../../data/workExperience";
import * as language from "../../../i18n/context";
import { englishDictionary } from "../../../i18n/dictionaries/en";
import * as printing from "../../../resume/print";

jest.mock("react-router-dom", () => ({
  NavLink: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}), { virtual: true });

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(language, "useTranslation").mockReturnValue({ language: "en", setLanguage: jest.fn(), dictionary: englishDictionary });
  Element.prototype.scrollIntoView = jest.fn();
});

afterEach(() => {
  cleanup();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test("SITE-R5.1 個人摘要", () => {
  const { container } = render(<Home />);
  const content = within(container);
  expect(content.getByRole("heading", { level: 1 })).toHaveTextContent(englishDictionary.name);
  const firstWork = englishDictionary.workExperiences[workExperienceItems[0].id];
  expect(content.getByText(`${firstWork.job_title} @ ${firstWork.company_name}`)).toBeInTheDocument();
});

test("SITE-R6.1 工作與翻譯", () => {
  const first = workExperienceItems[0];
  const saved = { ...first };
  Object.assign(first, { job_title: "Fallback title", company_name: "Fallback company", description: "Fallback description", work_duration: "Fallback period" });
  jest.spyOn(language, "useTranslation").mockReturnValue({ language: "en", setLanguage: jest.fn(), dictionary: { ...englishDictionary, workExperiences: {} } });
  try {
    const { container } = render(<Home />);
    const content = within(container);
    expect(content.getByText("Fallback description")).toBeInTheDocument();
    expect(content.getByText("Fallback period")).toBeInTheDocument();
    expect(content.getByText("Fallback title @ Fallback company")).toBeInTheDocument();
  } finally {
    Object.assign(first, saved);
  }
});

test("SITE-R6.2 技能與教育", () => {
  const { container } = render(<Home />);
  for (const skill of homeSkillItems) expect(within(container).getAllByText(skill.title).length).toBeGreaterThanOrEqual(1);
  expect(within(container).getByRole("link", { name: englishDictionary.about.nccuEconomics })).toHaveAttribute("href", "https://econo.nccu.edu.tw/");
  expect(within(container).getByRole("link", { name: englishDictionary.about.nccuFintech })).toHaveAttribute("href", expect.stringContaining("ftrc.nccu.edu.tw"));
});

test("SITE-R6.3 Footer 內容", () => {
  jest.setSystemTime(new Date("2030-01-02T00:00:00Z"));
  const { container } = render(<Footer />);
  expect(container).toHaveTextContent("bryan.chen.429@gmail.com");
  expect(container).toHaveTextContent("Copyright © 2030 Bing-Yang Chen");
  for (const name of ["GitHub", "LinkedIn", "Cake"]) expect(within(container).getByRole("link", { name })).toHaveAttribute("target", "_blank");
});

test("SITE-R7.1 初始作品清單", () => {
  const { container } = render(<Home />);
  const content = within(container);
  expect(homeProjects.map((project) => content.getByText(project.title).textContent)).toEqual(homeProjects.map((project) => project.title));
  expect(content.queryByRole("heading", { name: homeProjects[0].title })).not.toBeInTheDocument();
});

test("SITE-R7.5 內容與翻譯", () => {
  const project = homeProjects[0];
  const translated = render(<ProjectDetail {...project} description={englishDictionary.projectsData[project.title].description} tags={englishDictionary.projectsData[project.title].tags} />);
  expect(translated.container).toHaveTextContent(englishDictionary.projectsData[project.title].description);
  translated.unmount();
  jest.spyOn(language, "useTranslation").mockReturnValue({ language: "en", setLanguage: jest.fn(), dictionary: { ...englishDictionary, projectsData: {} } });
  const { container } = render(<Home />);
  fireEvent.click(within(container).getByText(project.title));
  act(() => { jest.advanceTimersByTime(250); });
  expect(container).toHaveTextContent(project.description);
});

test("SITE-R7.6 期間顯示", () => {
  const project = homeProjects[0];
  const props = { ...project, maintaining_time_range: project.maintaining_time_range };
  const { container, rerender } = render(<ProjectCard {...props} />);
  expect(container).toHaveTextContent(englishDictionary.projectCommon.present);
  rerender(<ProjectCard {...props} maintaining_time_range={[new Date(2020, 0, 1), new Date(2022, 0, 1)]} />);
  expect(container).toHaveTextContent("2020 - 2022");
});

test("SITE-R8.1 作品展示", () => {
  const open = jest.spyOn(window, "open").mockReturnValue(null);
  for (const project of homeProjects) {
    const view = render(<ProjectDetail {...project} />);
    fireEvent.click(within(view.container).getByRole("button", { name: englishDictionary.projectCommon.visit }));
    expect(open).toHaveBeenLastCalledWith(project.demo_url, "_blank");
    view.unmount();
  }
});

test("SITE-R8.2 作品程式碼", () => {
  const open = jest.spyOn(window, "open").mockReturnValue(null);
  for (const project of homeProjects) {
    const view = render(<ProjectDetail {...project} />);
    fireEvent.click(within(view.container).getByRole("button", { name: englishDictionary.projectCommon.sourceCode }));
    expect(open).toHaveBeenLastCalledWith(project.source_code_url, "_blank");
    view.unmount();
  }
});

test("SITE-R8.3 新分頁隔離", () => {
  const originalOpener = window.opener;
  window.opener = window;
  jest.spyOn(window, "open").mockReturnValue(window);
  try {
    const view = render(<ProjectDetail {...homeProjects[0]} />);
    fireEvent.click(within(view.container).getByRole("button", { name: englishDictionary.projectCommon.visit }));
    expect(window.opener).toBeNull();
    view.unmount();
    const home = render(<><Home /><Footer /></>);
    for (const anchor of Array.from(home.container.querySelectorAll('a[target="_blank"]'))) {
      expect(anchor.getAttribute("rel")?.split(" ")).toEqual(expect.arrayContaining(["noreferrer"]));
    }
  } finally {
    window.opener = originalOpener;
  }
});

test("SITE-R10.1 首頁列印入口", () => {
  const print = jest.spyOn(printing, "openResumePrintDialog").mockImplementation(() => {});
  const { container } = render(<Home />);
  fireEvent.click(within(container).getByRole("button", { name: englishDictionary.home.downloadResume }));
  expect(print).toHaveBeenCalledTimes(1);
});

test("SITE-R10.2 非公開預覽列印", () => {
  const print = jest.spyOn(printing, "openResumePrintDialog").mockImplementation(() => {});
  const { container } = render(<Resume />);
  fireEvent.click(within(container).getByRole("button", { name: "Download PDF" }));
  expect(print).toHaveBeenCalledTimes(1);
});
