import { workExperienceIdToFacts, type WorkExperienceFacts } from "../data/career";
import { workExperienceItems } from "../data/workExperience";
import { englishDictionary } from "./dictionaries/en";
import { traditionalChineseDictionary } from "./dictionaries/zhtw";
import { formatWorkExperienceFacts } from "./workExperience";

test.each([
  ["swag-2026", "Jan. 2026 – Present", "2026 年 1 月 – 至今"],
  [
    "gaia-2024",
    "Dec. 2024 – Dec. 2025 (1 yr 1 mo)",
    "2024 年 12 月 – 2025 年 12 月 (1 年 1 個月)",
  ],
  [
    "pinkoi-2023",
    "Mar. 2023 – Dec. 2024 (1 yr 10 mos)",
    "2023 年 3 月 – 2024 年 12 月 (1 年 10 個月)",
  ],
  [
    "sysfeather-2022",
    "Mar. 2022 – Mar. 2023 (1 yr 1 mo)",
    "2022 年 3 月 – 2023 年 3 月 (1 年 1 個月)",
  ],
  ["beida-2020", "2020 Spring Semester", "2020 年下學期"],
] as const)("中英文工作經歷共用日期與年資格式：%s", (id, english, chinese) => {
  expect(englishDictionary.workExperiences[id].work_duration).toBe(english);
  expect(traditionalChineseDictionary.workExperiences[id].work_duration).toBe(chinese);
});

test.each([
  [
    { year: 2024, month: 12 },
    { year: 2024, month: 12 },
    "Dec. 2024 – Dec. 2024 (1 mo)",
    "2024 年 12 月 – 2024 年 12 月 (1 個月)",
  ],
  [
    { year: 2024, month: 12 },
    { year: 2025, month: 1 },
    "Dec. 2024 – Jan. 2025 (2 mos)",
    "2024 年 12 月 – 2025 年 1 月 (2 個月)",
  ],
  [
    { year: 2023, month: 8 },
    { year: 2024, month: 7 },
    "Aug. 2023 – Jul. 2024 (1 yr)",
    "2023 年 8 月 – 2024 年 7 月 (1 年)",
  ],
  [
    { year: 2022, month: 8 },
    { year: 2024, month: 7 },
    "Aug. 2022 – Jul. 2024 (2 yrs)",
    "2022 年 8 月 – 2024 年 7 月 (2 年)",
  ],
])("年資包含起訖月份且省略零年或零月：%j 到 %j", (start, end, english, chinese) => {
  const facts: WorkExperienceFacts = {
    ...workExperienceIdToFacts["swag-2026"],
    period: { kind: "employment", start, end },
  };
  expect(formatWorkExperienceFacts(facts, "en").work_duration).toBe(english);
  expect(formatWorkExperienceFacts(facts, "zh-TW").work_duration).toBe(chinese);
});

test.each([
  [{ year: 2024, month: 0 }, null],
  [{ year: 2024, month: 13 }, null],
  [{ year: NaN, month: 1 }, null],
  [{ year: 2024, month: 1.5 }, null],
  [
    { year: 2024, month: 1 },
    { year: 2023, month: 12 },
  ],
  [
    { year: 2024, month: 1 },
    { year: 2024, month: 13 },
  ],
])("無效任職年月在產生內容時失敗：%j 到 %j", (start, end) => {
  expect(() =>
    formatWorkExperienceFacts(
      {
        ...workExperienceIdToFacts["swag-2026"],
        period: { kind: "employment", start, end },
      },
      "en",
    ),
  ).toThrow(/Invalid career month|Career ends before/);
});

test("職稱與公司翻譯缺漏或空白時保留英文共同事實", () => {
  const facts: WorkExperienceFacts = {
    ...workExperienceIdToFacts["swag-2026"],
    company: { en: "Example Company", "zh-TW": " " },
    title: { en: "Staff Engineer" },
  };
  expect(formatWorkExperienceFacts(facts, "zh-TW")).toMatchObject({
    company_name: "Example Company",
    job_title: "Staff Engineer",
  });
});

test("工作素材、雙語字典與共用事實涵蓋相同的固定 ID", () => {
  const ids = Object.keys(workExperienceIdToFacts).sort();
  expect(workExperienceItems.map(({ id }) => id).sort()).toEqual(ids);
  for (const dictionary of [englishDictionary, traditionalChineseDictionary])
    expect(Object.keys(dictionary.workExperiences).sort()).toEqual(ids);
  for (const facts of Object.values(workExperienceIdToFacts)) {
    for (const name of [facts.company, facts.title])
      for (const value of Object.values(name)) expect(value.trim()).not.toBe("");
  }
});
