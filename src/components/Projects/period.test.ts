import { formatProjectPeriod } from "./period";
import type { ProjectData } from "../../data/projects";

test.each<{
  period: Pick<ProjectData, "startYear" | "endYear">;
  english: string;
  chinese: string;
}>([
  { period: { startYear: 2021 }, english: "2021 to Present", chinese: "2021 年至今" },
  {
    period: { startYear: 2020, endYear: 2022 },
    english: "2020 to 2022",
    chinese: "2020 年至 2022 年",
  },
  { period: { startYear: 2024, endYear: 2024 }, english: "2024", chinese: "2024" },
])("SITE-R7.6 期間顯示：$english", ({ period, english, chinese }) => {
  expect(formatProjectPeriod(period, "en", "Present")).toBe(english);
  expect(formatProjectPeriod(period, "zh-TW", "至今")).toBe(chinese);
});
