import type { ProjectCopy } from "./types";

function resolveText(fallback: string, translation: string | undefined): string {
  return translation?.trim() ? translation : fallback;
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
