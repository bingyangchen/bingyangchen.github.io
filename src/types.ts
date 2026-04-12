export type WorkExperienceData = {
  id: string;
  layout_column: "left" | "right";
  work_duration: string;
  job_title: string;
  company_name: string;
  company_logo?: string;
  company_link?: string;
  description: string;
  skills?: string[];
};

export type Project = {
  thumbnail: React.ReactNode;
  icon: React.ReactNode;
  title: string;
  description: string;
  tags: string[];
  maintaining_time_range: [Date, Date] | [Date];
  source_code_url: string;
  demo_url: string;
};
