export type WorkExperienceData = {
  id: string;
  work_duration: string;
  job_title: string;
  company_name: string;
  company_logo?: string;
  description: string;
};

export type SkillItem = { id: string; title: string; logo: string };

export type Project = {
  icon: React.ReactNode;
  title: string;
  purpose: string;
  description: string;
  image_description: string;
  visit_label: string;
  tags: string[];
  maintaining_time_range: [Date, Date] | [Date];
  source_code_url: string;
  demo_url: string;
};
