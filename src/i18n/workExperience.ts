import type {
  LocalizedWorkName,
  WorkExperienceFacts,
  WorkPeriod,
  YearMonth,
} from "../data/career";
import type { Language } from "./types";

const MONTHS = [
  "Jan.",
  "Feb.",
  "Mar.",
  "Apr.",
  "May.",
  "Jun.",
  "Jul.",
  "Aug.",
  "Sep.",
  "Oct.",
  "Nov.",
  "Dec.",
];

function getMonthIndex(date: YearMonth): number {
  if (
    !Number.isInteger(date.year) ||
    date.year < 1 ||
    !Number.isInteger(date.month) ||
    date.month < 1 ||
    date.month > 12
  )
    throw new Error(`Invalid career month: ${date.year}-${date.month}`);
  return date.year * 12 + date.month - 1;
}

function formatWorkPeriod(period: WorkPeriod, language: Language): string {
  if (period.kind === "semester") {
    if (!Number.isInteger(period.year) || period.year < 1)
      throw new Error(`Invalid career year: ${period.year}`);
    return language === "zh-TW"
      ? `${period.year} 年下學期`
      : `${period.year} Spring Semester`;
  }
  const start = getMonthIndex(period.start);
  const end = period.end === null ? null : getMonthIndex(period.end);
  if (end !== null && end < start) throw new Error("Career ends before it starts");
  const formatMonth = ({ year, month }: YearMonth) =>
    language === "zh-TW" ? `${year} 年 ${month} 月` : `${MONTHS[month - 1]} ${year}`;
  const range = `${formatMonth(period.start)} – ${period.end === null ? (language === "zh-TW" ? "至今" : "Present") : formatMonth(period.end)}`;
  if (end === null) return range;

  // Authored tenures count both the starting and ending calendar months.
  const months = end - start + 1;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const duration =
    language === "zh-TW"
      ? [years && `${years} 年`, remainingMonths && `${remainingMonths} 個月`]
          .filter(Boolean)
          .join(" ")
      : [
          years && `${years} ${years === 1 ? "yr" : "yrs"}`,
          remainingMonths &&
            `${remainingMonths} ${remainingMonths === 1 ? "mo" : "mos"}`,
        ]
          .filter(Boolean)
          .join(" ");
  return `${range} (${duration})`;
}

export function formatWorkIdentity(facts: WorkExperienceFacts, language: Language) {
  const localize = (name: LocalizedWorkName) => {
    const translation = name[language];
    return translation?.trim() ? translation : name.en;
  };
  return { company_name: localize(facts.company), job_title: localize(facts.title) };
}

export function formatWorkExperienceFacts(
  facts: WorkExperienceFacts,
  language: Language,
) {
  return {
    ...formatWorkIdentity(facts, language),
    work_duration: formatWorkPeriod(facts.period, language),
  };
}
