export type Language = "en" | "zh-TW";

export interface TranslationDictionary {
  name: string;
  home: {
    greeting: string;
    role: string;
    downloadResume: string;
    scrollDown: string;
  };
  navigation: {
    about: string;
    projects: string;
    blog: string;
  };
  about: {
    title: string;
    subtitle: string;
    workExperience: string;
    skills: string;
    education: string;
    nccuEconomics: string;
    nccuFintech: string;
  };
  projects: {
    title: string;
    subtitle: string;
    visitGithub: string;
  };
  blog: {
    title: string;
    subtitle: string;
    checkItOut: string;
  };
  qrModal: {
    scanToConnect: string;
  };
  header: {
    home: string;
    about: string;
    projects: string;
    blog: string;
  };
  footer: {
    contactMe: string;
    services: string;
    personalBranding: string;
    corporateBranding: string;
    internalSystems: string;
    otherWebApps: string;
    programmingInstruction: string;
    economicsInstruction: string;
    socialMedia: string;
  };
  workExperiences: Record<
    string,
    {
      work_duration: string;
      job_title: string;
      company_name: string;
      description: string;
    }
  >;
  projectsData: Record<
    string,
    {
      tags: string[];
      description: string;
    }
  >;
  projectCommon: {
    present: string;
    visit: string;
    sourceCode: string;
  };
}
