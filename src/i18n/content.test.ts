import { resolveProjectCopy } from "./content";
import { englishDictionary } from "./dictionaries/en";
import { makeProjectCopy } from "./fixtures/content";
import type { ProjectCopy } from "./types";

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
