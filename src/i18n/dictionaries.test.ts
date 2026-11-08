import { englishDictionary } from "./dictionaries/en";
import { traditionalChineseDictionary } from "./dictionaries/zhtw";
import { homeProjects } from "../data/projects";
import { workExperienceItems } from "../data/workExperience";

test.each([
  ["en", englishDictionary],
  ["zh-TW", traditionalChineseDictionary],
] as const)("維護中的 %s 工作與作品內容完整且沒有空白欄位", (_language, dictionary) => {
  const workIds = workExperienceItems.map(({ id }) => id);
  const projectIds = homeProjects.map(({ id }) => id);
  expect(new Set(workIds).size).toBe(workIds.length);
  expect(new Set(projectIds).size).toBe(projectIds.length);
  expect(Object.keys(dictionary.workExperiences).sort()).toEqual([...workIds].sort());
  expect(Object.keys(dictionary.projectsData).sort()).toEqual([...projectIds].sort());
  const copies = [
    ...Object.entries(dictionary.workExperiences),
    ...Object.entries(dictionary.projectsData),
  ];
  for (const [id, copy] of copies) {
    for (const [field, value] of Object.entries(copy)) {
      const values = typeof value === "string" ? [value] : value;
      expect(values.length, `${id}.${field}`).toBeGreaterThan(0);
      for (const text of values) expect(text.trim(), `${id}.${field}`).not.toBe("");
    }
  }
});
