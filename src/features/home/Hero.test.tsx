import { cleanup, fireEvent, within } from "@testing-library/react";
import { LanguageSwitcher } from "../../components/LanguageSwitcher/LanguageSwitcher";
import { renderWithLanguage } from "../../test-utils/render";
import { englishDictionary } from "../../i18n/dictionaries/en";
import { traditionalChineseDictionary } from "../../i18n/dictionaries/zhtw";
import { workExperienceItems } from "../../data/workExperience";
import Hero from "./Hero";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

test("SITE-R5.1 個人摘要", () => {
  const { container } = renderWithLanguage(<Hero />);
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
  const view = renderWithLanguage(
    <>
      <Hero />
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
});

test.each([
  ["en", englishDictionary],
  ["zh-TW", traditionalChineseDictionary],
] as const)("SITE-R10.1 首頁下載入口 %s", (language, dictionary) => {
  const { container } = renderWithLanguage(<Hero />, language);
  const link = within(container).getByRole("link", {
    name: dictionary.home.downloadResume,
  });
  expect(link).toHaveAttribute("href", "/resume.pdf");
  expect(link).toHaveAttribute("download", "Bing-Yang Chen - 陳秉洋.pdf");
  expect(within(container).queryByText("Career Summary")).not.toBeInTheDocument();
});
