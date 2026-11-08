import { resolveProjectCopy, resolveWorkExperienceCopy } from "./content";
import { englishDictionary } from "./dictionaries/en";
import { makeProjectCopy, makeWorkExperienceCopy } from "./fixtures/content";
import type { ProjectCopy, WorkExperienceCopy } from "./types";
import { workExperienceItems } from "../data/workExperience";

test.each<Partial<WorkExperienceCopy> | undefined>([
  undefined,
  {},
  { job_title: "", company_name: " ", description: "\n", work_duration: "" },
])("SITE-R6.1 缺漏或空白工作翻譯保留英文內容：%j", (translation) => {
  const fallback = Object.freeze(makeWorkExperienceCopy());
  expect(resolveWorkExperienceCopy(fallback, translation)).toEqual(fallback);
});

test("SITE-R6.1 工作欄位各自取翻譯或英文，且不修改輸入", () => {
  const fallback = Object.freeze(makeWorkExperienceCopy());
  const translation = Object.freeze({ job_title: "後端工程師", description: "" });
  expect(resolveWorkExperienceCopy(fallback, translation)).toEqual({
    ...fallback,
    job_title: "後端工程師",
  });
});

test("SITE-R6.1 第一筆工作缺漏翻譯仍有職稱、公司與經歷", () => {
  const fallback = englishDictionary.workExperiences[workExperienceItems[0].id];
  const copy = resolveWorkExperienceCopy(fallback, undefined);
  expect(copy.job_title).toBe("Backend Engineer");
  expect(copy.company_name).toBe("Swag");
  expect(copy.description).toBe(fallback.description);
  expect(copy.work_duration).toBe(fallback.work_duration);
});

test.each<Partial<ProjectCopy> | undefined>([
  undefined,
  {},
  { purpose: "", description: " ", image_description: "\n", visit_label: "", tags: [] },
  { tags: ["", " "] },
  { tags: ["App", " "] },
])("SITE-R7.5 缺漏或空白作品翻譯保留英文內容：%j", (translation) => {
  const fallback = Object.freeze(makeProjectCopy({ tags: Object.freeze(["App"]) }));
  expect(resolveProjectCopy(fallback, translation)).toEqual(fallback);
});

test("SITE-R7.5 作品欄位各自取翻譯或英文，且不修改輸入", () => {
  const fallback = Object.freeze(makeProjectCopy());
  const translation = Object.freeze({
    purpose: "管理日常收支",
    description: "",
    tags: Object.freeze(["理財", "App"]),
  });
  expect(resolveProjectCopy(fallback, translation)).toEqual({
    ...fallback,
    purpose: translation.purpose,
    tags: translation.tags,
  });
});

test("SITE-R7.5 Leechai 缺漏描述仍使用同一份個人理財內容", () => {
  const fallback = englishDictionary.projectsData.leechai;
  for (const translation of [undefined, { description: "" }]) {
    expect(resolveProjectCopy(fallback, translation).description).toBe(
      "Keep track of daily income and expenses, and manage your budget in one app.",
    );
  }
});
