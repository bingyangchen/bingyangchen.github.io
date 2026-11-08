import type { ProjectCopy, WorkExperienceCopy } from "../types";

export function makeWorkExperienceCopy(
  overrides: Partial<WorkExperienceCopy> = {},
): WorkExperienceCopy {
  return {
    job_title: "Software Engineer",
    company_name: "Example Company",
    description: "Build reliable software.",
    work_duration: "2020 to Present",
    ...overrides,
  };
}

export function makeProjectCopy(overrides: Partial<ProjectCopy> = {}): ProjectCopy {
  return {
    purpose: "Understand your finances.",
    description: "Review income and expenses.",
    image_description: "Account overview",
    visit_label: "Explore the app",
    ...overrides,
    tags: [...(overrides.tags ?? ["Personal Finance", "App"])],
  };
}
