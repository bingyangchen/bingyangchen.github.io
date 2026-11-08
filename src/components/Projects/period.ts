import type { ProjectData } from "../../data/projects";
import type { Language } from "../../i18n/types";

export function formatProjectPeriod(
  { startYear, endYear }: Pick<ProjectData, "startYear" | "endYear">,
  language: Language,
  present: string,
): string {
  if (startYear === endYear) return String(startYear);
  if (language === "zh-TW")
    return endYear === undefined
      ? `${startYear} 年${present}`
      : `${startYear} 年至 ${endYear} 年`;
  return `${startYear} to ${endYear ?? present}`;
}
