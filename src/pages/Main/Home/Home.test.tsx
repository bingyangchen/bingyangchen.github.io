import { cleanup, fireEvent, render, within } from "@testing-library/react";
import React from "react";
import Footer from "../../../components/Footer/Footer";
import { homeSkillItems } from "../../../data/skills";
import { workExperienceItems } from "../../../data/workExperience";
import * as language from "../../../i18n/context";
import { englishDictionary } from "../../../i18n/dictionaries/en";
import { traditionalChineseDictionary } from "../../../i18n/dictionaries/zhtw";
import * as printing from "../../../resume/print";
import Resume from "../Resume/Resume";
import Home from "./Home";

jest.mock(
  "react-router-dom",
  () => ({
    NavLink: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  }),
  { virtual: true },
);

beforeEach(() => {
  jest.useFakeTimers();
  jest
    .spyOn(language, "useTranslation")
    .mockReturnValue({
      language: "en",
      setLanguage: jest.fn(),
      dictionary: englishDictionary,
    });
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
  expect(content.getByRole("heading", { level: 1 })).toHaveTextContent(
    englishDictionary.name,
  );
  const firstWork = englishDictionary.workExperiences[workExperienceItems[0].id];
  expect(
    content.getByText(`${firstWork.job_title} @ ${firstWork.company_name}`),
  ).toBeInTheDocument();
});

test("SITE-R13.1 完整問候", () => {
  const view = render(<Home />);
  expect(
    within(view.container).getByText(englishDictionary.home.greeting),
  ).toBeInTheDocument();
  jest
    .spyOn(language, "useTranslation")
    .mockReturnValue({
      language: "zh-TW",
      setLanguage: jest.fn(),
      dictionary: traditionalChineseDictionary,
    });
  view.rerender(<Home />);
  expect(
    within(view.container).getByText(traditionalChineseDictionary.home.greeting),
  ).toBeInTheDocument();
  expect(
    within(view.container).queryByText(englishDictionary.home.greeting),
  ).not.toBeInTheDocument();
  expect(within(view.container).queryByText("|")).not.toBeInTheDocument();
  view.unmount();
  expect(jest.getTimerCount()).toBe(0);
});

test("SITE-R6.1 工作與翻譯", () => {
  const first = workExperienceItems[0];
  const saved = { ...first };
  Object.assign(first, {
    job_title: "Fallback title",
    company_name: "Fallback company",
    description: "Fallback description",
    work_duration: "Fallback period",
  });
  jest
    .spyOn(language, "useTranslation")
    .mockReturnValue({
      language: "en",
      setLanguage: jest.fn(),
      dictionary: { ...englishDictionary, workExperiences: {} },
    });
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
  for (const skill of homeSkillItems)
    expect(within(container).getAllByText(skill.title)).toHaveLength(1);
  expect(
    within(container).getByRole("link", {
      name: englishDictionary.about.nccuEconomics,
    }),
  ).toHaveAttribute("href", "https://econo.nccu.edu.tw/");
  expect(
    within(container).getByRole("link", { name: englishDictionary.about.nccuFintech }),
  ).toHaveAttribute("href", expect.stringContaining("ftrc.nccu.edu.tw"));
});

test("SITE-R6.3 Footer 內容", () => {
  jest.setSystemTime(new Date("2030-01-02T00:00:00Z"));
  const { container } = render(<Footer />);
  expect(container).toHaveTextContent("bryan.chen.429@gmail.com");
  expect(container).toHaveTextContent("Copyright © 2030 Bing-Yang Chen");
  for (const name of ["GitHub", "LinkedIn", "Cake"])
    expect(within(container).getByRole("link", { name })).toHaveAttribute(
      "target",
      "_blank",
    );
});

test.each([englishDictionary, traditionalChineseDictionary])(
  "SITE-R10.1 首頁下載入口",
  (dictionary) => {
    jest
      .spyOn(language, "useTranslation")
      .mockReturnValue({
        language: dictionary === englishDictionary ? "en" : "zh-TW",
        setLanguage: jest.fn(),
        dictionary,
      });
    const print = jest.spyOn(window, "print").mockImplementation(() => {});
    const { container } = render(<Home />);
    const link = within(container).getByRole("link", {
      name: dictionary.home.downloadResume,
    });
    expect(link).toHaveAttribute("href", "/resume.pdf");
    expect(link).toHaveAttribute("download", "Bing-Yang Chen - 陳秉洋.pdf");
    fireEvent.click(link);
    expect(print).not.toHaveBeenCalled();
    expect(within(container).queryByText("Career Summary")).not.toBeInTheDocument();
  },
);

test("SITE-R10.2 非公開預覽列印", () => {
  const print = jest
    .spyOn(printing, "openResumePrintDialog")
    .mockImplementation(() => {});
  const { container } = render(<Resume />);
  fireEvent.click(within(container).getByRole("button", { name: "Download PDF" }));
  expect(print).toHaveBeenCalledTimes(1);
});
