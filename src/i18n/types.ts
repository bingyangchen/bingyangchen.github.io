import type { BlogArticleId } from "../data/articles";
import type { ProjectId } from "../data/projects";
import type { WorkExperienceId } from "../data/workExperience";

export type Language = "en" | "zh-TW";

export interface WorkExperienceCopy {
  work_duration: string;
  job_title: string;
  company_name: string;
  description: string;
}

export interface ProjectCopy {
  tags: readonly string[];
  description: string;
  purpose: string;
  image_description: string;
  visit_label: string;
}

export interface TranslationDictionary {
  name: string;
  home: {
    greeting: string;
    role: string;
    flipAvatar: string;
    downloadResume: string;
    scrollDown: string;
  };
  navigation: { about: string; projects: string; blog: string };
  about: {
    title: string;
    subtitle: string;
    workExperience: string;
    skills: string;
    education: string;
    nccuEconomics: string;
    nccuFintech: string;
  };
  projects: { title: string; subtitle: string; visitGithub: string };
  blog: {
    title: string;
    subtitle: string;
    browseAll: string;
    featured: string;
    readArticle: string;
    articleLanguage: string;
    articles: Record<BlogArticleId, { category: string; summary: string }>;
  };
  qrModal: { open: string; close: string; scanToConnect: string };
  header: {
    home: string;
    about: string;
    projects: string;
    blog: string;
    navigationLabel: string;
    openMenu: string;
    closeMenu: string;
    skipToContent: string;
    switchLanguage: string;
  };
  footer: {
    title: string;
    description: string;
    email: string;
    elsewhere: string;
    home: string;
  };
  workExperiences: Record<WorkExperienceId, WorkExperienceCopy>;
  projectsData: Record<ProjectId, ProjectCopy>;
  projectCommon: {
    present: string;
    sourceCode: string;
    chooseProject: string;
    maintained: string;
  };
}
