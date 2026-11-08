import { vi } from "vitest";
import { cleanup, fireEvent, within } from "@testing-library/react";
import { homeSkillItems } from "../../../data/skills";
import { workExperienceItems } from "../../../data/workExperience";
import { LanguageSwitcher } from "../../../components/LanguageSwitcher/LanguageSwitcher";
import { renderWithLanguage } from "../../../test-utils/render";
import { englishDictionary } from "../../../i18n/dictionaries/en";
import { traditionalChineseDictionary } from "../../../i18n/dictionaries/zhtw";
import * as printing from "../../../resume/print";
import Resume from "../Resume/Resume";
import Home from "./Home";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
});

test("SITE-R5.1 個人摘要", () => {
  const { container } = renderWithLanguage(<Home />);
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
  vi.useFakeTimers();
  const view = renderWithLanguage(
    <>
      <Home />
      <LanguageSwitcher />
    </>,
  );
  expect(
    within(view.container).getByText(englishDictionary.home.greeting),
  ).toBeInTheDocument();
  fireEvent.click(
    within(view.container).getByRole("button", {
      name: englishDictionary.header.switchLanguage,
    }),
  );
  expect(
    within(view.container).getByText(traditionalChineseDictionary.home.greeting),
  ).toBeInTheDocument();
  expect(
    within(view.container).queryByText(englishDictionary.home.greeting),
  ).not.toBeInTheDocument();
  expect(within(view.container).queryByText("|")).not.toBeInTheDocument();
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});

test.each([
  ["en", englishDictionary],
  ["zh-TW", traditionalChineseDictionary],
] as const)("SITE-R6.1 工作與翻譯 %s", (language, dictionary) => {
  const { container } = renderWithLanguage(<Home />, language);
  const content = within(container);
  const descriptions = workExperienceItems.map(({ id }) =>
    content.getByText(dictionary.workExperiences[id].description),
  );
  for (const [index, { id }] of workExperienceItems.entries()) {
    const copy = dictionary.workExperiences[id];
    expect(content.getByText(copy.work_duration)).toBeInTheDocument();
    expect(
      content.getAllByText(copy.job_title, { exact: true })[0],
    ).toBeInTheDocument();
    expect(content.getByText(copy.company_name, { exact: true })).toBeInTheDocument();
    if (index > 0)
      expect(descriptions[index - 1].compareDocumentPosition(descriptions[index])).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
  }
});

test("SITE-R6.2 技能與教育", () => {
  const { container } = renderWithLanguage(<Home />);
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

test.each([
  ["en", englishDictionary],
  ["zh-TW", traditionalChineseDictionary],
] as const)("SITE-R10.1 首頁下載入口 %s", (language, dictionary) => {
  const { container } = renderWithLanguage(<Home />, language);
  const link = within(container).getByRole("link", {
    name: dictionary.home.downloadResume,
  });
  expect(link).toHaveAttribute("href", "/resume.pdf");
  expect(link).toHaveAttribute("download", "Bing-Yang Chen - 陳秉洋.pdf");
  expect(within(container).queryByText("Career Summary")).not.toBeInTheDocument();
});

test("SITE-R10.2 非公開預覽列印", () => {
  const print = vi
    .spyOn(printing, "openResumePrintDialog")
    .mockImplementation(() => {});
  const { container } = renderWithLanguage(<Resume />);
  fireEvent.click(within(container).getByRole("button", { name: "Download PDF" }));
  expect(print).toHaveBeenCalledTimes(1);
});
