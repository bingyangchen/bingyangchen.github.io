import type { ProjectCopy } from "../types";

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
