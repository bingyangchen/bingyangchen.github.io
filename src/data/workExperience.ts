import type { WorkExperienceData } from "../types";

export const workExperienceItems: WorkExperienceData[] = [
  {
    id: "swag-2025",
    work_duration: "Jan 2025 ~ Present",
    job_title: "Backend Engineer",
    company_name: "Swag",
    company_logo: "https://swag.live/favicon.ico",
    company_link: "https://swag.live/",
    description:
      "Refactored a multi-domain availability monitoring service from Flask and MongoDB to FastAPI and PostgreSQL, significantly reducing codebase size and CPU usage. Introduced GrowthBook for feature-flag management, enabling internal teams to configure flags with less friction and greater flexibility.",
  },
  {
    id: "gaia-2024",
    work_duration: "Dec 2024 ~ Dec 2025．1 yr 1 mo",
    job_title: "Senior Backend Engineer",
    company_name: "Gaia",
    company_logo: "https://www.gaia.net/images/ci/apple-icon-152x152.png",
    company_link: "https://www.gaia.net/",
    description:
      "Architected and led the development of an enterprise-grade knowledge management platform leveraging LLMs to streamline information discovery and elevate customer service quality. Refined containerization practices, achieving a nearly 50% reduction in image size and boosting CI/CD pipeline efficiency by over 60%. Established robust engineering standards by integrating unit testing, linting, and code review processes, improving system reliability and maintainability. Led security hardening efforts, mitigating critical vulnerabilities by securing internal APIs from anonymous access and tightening CORS and content security policies (CSP).",
  },
  {
    id: "pinkoi-2023",
    work_duration: "Mar 2023 ~ Dec 2024．1 yr 10 mos",
    job_title: "Backend Engineer",
    company_name: "Pinkoi",
    company_logo:
      "https://cdn04.pinkoi.com/pinkoi.site/general/favicon/favicon_192x192.png",
    company_link: "https://www.pinkoi.com/",
    description:
      "Designed and implemented scalable, high-performance APIs; integrated third-party services; and partnered closely with frontend teams to deliver robust, production-grade e-commerce functionality. Redesigned database schemas, modernized inter-service communication, and eliminated legacy bottlenecks, resulting in significant gains in system reliability and throughput. Built and deployed internal admin tools that automated key workflows, accelerating business operations and reducing manual overhead. Performed rigorous code reviews and enforced engineering best practices to uphold code quality, ensure system maintainability, and drive long-term scalability.",
  },
  {
    id: "sysfeather-2022",
    work_duration: "Mar 2022 ~ Mar 2023．1 yr 1 mo",
    job_title: "Backend Engineer",
    company_name: "Sysfeather",
    company_logo: "https://www.sysfeather.com/en-US/logo-sysfeather.png",
    company_link: "https://www.sysfeather.com/",
    description:
      "Developed the backend for an e-commerce automated shop system with multi-tenant architecture. Spearheaded the POC for the Social Shopping Project, integrating the Facebook API to enable comment management and post lotteries, enhancing customers' social media management experience.",
  },
  {
    id: "beida-2020",
    work_duration: "2020 Spring Semester",
    job_title: "Economics Course Instructor",
    company_name: "New Taipei Municipal Beida High School",
    company_logo:
      "https://www.bdsh.ntpc.edu.tw/var/file/0/1000/msys_1000_9064694_48923.png",
    description:
      "To provide graduating high school students with a deeper understanding of economics, I designed a 15-week course covering the principles of economics. The course content included discussions on current events, basic principles, and advanced microeconomic theory. This experience sharpened my presentation and slide design skills.",
  },
];
