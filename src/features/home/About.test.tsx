import { cleanup, within } from "@testing-library/react";
import { renderWithLanguage } from "../../test-utils/render";
import { englishDictionary } from "../../i18n/dictionaries/en";
import { traditionalChineseDictionary } from "../../i18n/dictionaries/zhtw";
import { homeSkillItems } from "../../data/skills";
import { profile } from "../../data/profile";
import { workExperienceItems } from "../../data/workExperience";
import About from "./About";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

test.each([
  ["en", englishDictionary],
  ["zh-TW", traditionalChineseDictionary],
] as const)("SITE-R6.1 工作與翻譯 %s", (language, dictionary) => {
  const { container } = renderWithLanguage(<About />, language);
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
  const { container } = renderWithLanguage(<About />);
  for (const skill of homeSkillItems)
    expect(within(container).getAllByText(skill.title)).toHaveLength(1);
  expect(
    within(container).getByRole("link", {
      name: `${profile.education.school.en} ${englishDictionary.about.degree}`,
    }),
  ).toHaveAttribute("href", "https://econo.nccu.edu.tw/");
  expect(
    within(container).getByRole("link", {
      name: englishDictionary.about.fintechProgram,
    }),
  ).toHaveAttribute("href", "https://www.ftrc.nccu.edu.tw/fintech/display/1");
});
