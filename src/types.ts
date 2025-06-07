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
