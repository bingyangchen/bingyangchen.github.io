import type { ProjectCopy, WorkExperienceCopy } from "./types";

function resolveText(fallback: string, translation: string | undefined): string {
  return translation?.trim() ? translation : fallback;
}

export function resolveWorkExperienceCopy(
  fallback: WorkExperienceCopy,
  translation: Partial<WorkExperienceCopy> | undefined,
): WorkExperienceCopy {
  return {
    work_duration: resolveText(fallback.work_duration, translation?.work_duration),
    job_title: resolveText(fallback.job_title, translation?.job_title),
    company_name: resolveText(fallback.company_name, translation?.company_name),
    description: resolveText(fallback.description, translation?.description),
  };
}

export function resolveProjectCopy(
  fallback: ProjectCopy,
  translation: Partial<ProjectCopy> | undefined,
): ProjectCopy {
  return {
    tags:
      translation?.tags?.length && translation.tags.every((tag) => tag.trim())
        ? translation.tags
        : fallback.tags,
    description: resolveText(fallback.description, translation?.description),
    purpose: resolveText(fallback.purpose, translation?.purpose),
    image_description: resolveText(
      fallback.image_description,
      translation?.image_description,
    ),
    visit_label: resolveText(fallback.visit_label, translation?.visit_label),
  };
}
