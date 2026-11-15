export type YearMonth = { year: number; month: number };
export type WorkPeriod =
  | { kind: "employment"; start: YearMonth; end: YearMonth | null }
  | { kind: "semester"; year: number; semester: "spring" };

export type LocalizedWorkName = { en: string; "zh-TW"?: string };
export type WorkExperienceFacts = {
  company: LocalizedWorkName;
  title: LocalizedWorkName;
  period: WorkPeriod;
};

const backendEngineer = { en: "Backend Engineer", "zh-TW": "後端工程師" };

export const workExperienceIdToFacts = {
  "swag-2026": {
    company: { en: "Swag" },
    title: backendEngineer,
    period: { kind: "employment", start: { year: 2026, month: 1 }, end: null },
  },
  "gaia-2024": {
    company: { en: "Gaia" },
    title: { en: "Senior Backend Engineer", "zh-TW": "資深後端工程師" },
    period: {
      kind: "employment",
      start: { year: 2024, month: 12 },
      end: { year: 2025, month: 12 },
    },
  },
  "pinkoi-2023": {
    company: { en: "Pinkoi" },
    title: backendEngineer,
    period: {
      kind: "employment",
      start: { year: 2023, month: 3 },
      end: { year: 2024, month: 12 },
    },
  },
  "sysfeather-2022": {
    company: { en: "Sysfeather" },
    title: backendEngineer,
    period: {
      kind: "employment",
      start: { year: 2022, month: 3 },
      end: { year: 2023, month: 3 },
    },
  },
  "beida-2020": {
    company: {
      en: "New Taipei Municipal Beida High School",
      "zh-TW": "新北市立北大高級中學",
    },
    title: { en: "Economics Course Instructor", "zh-TW": "經濟學課程講師" },
    period: { kind: "semester", year: 2020, semester: "spring" },
  },
} as const satisfies Record<string, WorkExperienceFacts>;

export type WorkExperienceId = keyof typeof workExperienceIdToFacts;
