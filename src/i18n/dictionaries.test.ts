import { englishDictionary } from "./dictionaries/en";
import { traditionalChineseDictionary } from "./dictionaries/zhtw";
import { homeProjects } from "../data/projects";
import { aboutTopics, photographs } from "../data/about";

test.each([
  ["en", englishDictionary],
  ["zh-TW", traditionalChineseDictionary],
] as const)("維護中的 %s 訪談與作品內容完整且沒有空白欄位", (_language, dictionary) => {
  const projectIds = homeProjects.map(({ id }) => id);
  expect(new Set(projectIds).size).toBe(projectIds.length);
  expect(Object.keys(dictionary.about.topics)).toEqual([...aboutTopics]);
  expect(Object.keys(dictionary.about.photoAlt)).toEqual(
    photographs.map(({ id }) => id),
  );
  for (const alt of Object.values(dictionary.about.photoAlt))
    expect(alt.trim()).not.toBe("");
  expect(Object.keys(dictionary.projectsData).sort()).toEqual([...projectIds].sort());
  const copies = [
    ...Object.entries(dictionary.about.topics),
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
