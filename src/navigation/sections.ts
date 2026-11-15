export const SECTION_IDS = ["home", "about", "projects", "blog"] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export function parseSectionHash(hash: string): SectionId | undefined {
  return SECTION_IDS.find((section) => `#${section}` === hash);
}
