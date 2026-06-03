import type { TranslationDictionary } from "../types";

export const englishDictionary: TranslationDictionary = {
  name: "Bing-Yang Chen",
  home: {
    greeting:
      "Software engineer focused on web apps that stay maintainable after launch.",
    role: "B.A. Economics, NCCU",
    downloadResume: "Download Resume",
    scrollDown: "Scroll down",
  },
  navigation: {
    about: "About",
    projects: "Projects",
    blog: "Blog",
  },
  about: {
    title: "ABOUT",
    subtitle:
      "With a background in Economics, I focus on software engineering and product development. Good technology does not need to look like magic. It should solve real problems reliably and leave something genuinely useful behind.",
    workExperience: "Work Experience",
    skills: "Skills",
    education: "Education",
    nccuEconomics: "National Chengchi University, Department of Economics",
    nccuFintech: "National Chengchi University, Financial Technology Program",
  },
  projects: {
    title: "PROJECTS",
    subtitle:
      "In my spare time, I use personal projects to explore new technologies and to find out which ideas are not just interesting in theory, but worth building for real.",
    visitGithub: "Visit My GitHub",
  },
  blog: {
    title: "BLOG",
    subtitle:
      "This is where I keep learning notes, technical write-ups, and some of the thinking behind them. A surprising number of things only make sense once you try to write them down.",
    checkItOut: "Check it out",
  },
  qrModal: {
    scanToConnect: "Scan to connect",
  },
  header: {
    home: "HOME",
    about: "ABOUT",
    projects: "PROJECTS",
    blog: "BLOG",
  },
  footer: {
    contactMe: "Contact Me",
    services: "Services",
    personalBranding: "Personal Branding Website Development",
    corporateBranding: "Corporate Branding Website Development",
    internalSystems: "Corporate Internal Management Systems",
    otherWebApps: "Other Web Application Development",
    programmingInstruction: "Programming Instruction",
    economicsInstruction: "Economics Instruction",
    socialMedia: "Social Media",
  },
  workExperiences: {
    "swag-2026": {
      work_duration: "Jan 2026 ~ Present",
      job_title: "Backend Engineer",
      company_name: "Swag",
      description:
        "Own and modernize a high-throughput multi-domain monitoring service; re-engineered the backend with FastAPI and PostgreSQL to cut CPU usage and streamline future feature deployment. Introduced GrowthBook for feature-flag management, enabling internal teams to configure flags with less friction and greater flexibility.",
    },
    "gaia-2024": {
      work_duration: "Dec 2024 ~ Dec 2025．1 yr 1 mo",
      job_title: "Senior Backend Engineer",
      company_name: "Gaia",
      description:
        "Architected a customer-facing B2B SaaS knowledge platform from 0 to 1, designing Python backend services for LLM/RAG workflows, PostgreSQL-backed retrieval, and scalable knowledge search for enterprise customers. Built and owned core backend platform capabilities including authentication, SSO, and role-based access control, strengthening access security and reliability for a customer-facing B2B SaaS product. Developed backend tooling to automate release workflows, including environment variable management and database migration utilities, reducing manual deployment steps and improving release reliability. Improved team-wide engineering practices by mentoring engineers, defining coding standards, and systematizing code reviews, reducing new engineer onboarding time from one week to one day.",
    },
    "pinkoi-2023": {
      work_duration: "Mar 2023 ~ Dec 2024．1 yr 10 mos",
      job_title: "Backend Engineer",
      company_name: "Pinkoi",
      description:
        "Built scalable APIs for marketplace checkout and order workflows, integrated third-party services, and partnered with frontend teams to deliver reliable production e-commerce features. Redesigned database schemas, modernized inter-service communication, and eliminated legacy bottlenecks, resulting in significant gains in system reliability and throughput. Built and deployed internal admin tools that automated key workflows, accelerating business operations and reducing manual overhead. Performed rigorous code reviews and enforced engineering best practices to uphold code quality, ensure system maintainability, and drive long-term scalability.",
    },
    "sysfeather-2022": {
      work_duration: "Mar 2022 ~ Mar 2023．1 yr 1 mo",
      job_title: "Backend Engineer",
      company_name: "Sysfeather",
      description:
        "Developed the backend for an e-commerce automated shop system with multi-tenant architecture. Spearheaded the POC for the Social Shopping Project, integrating the Facebook API to enable comment management and post lotteries, enhancing customers' social media management experience.",
    },
    "beida-2020": {
      work_duration: "2020 Spring Semester",
      job_title: "Economics Course Instructor",
      company_name: "New Taipei Municipal Beida High School",
      description:
        "To provide graduating high school students with a deeper understanding of economics, I designed a 15-week course covering the principles of economics. The course content included discussions on current events, basic principles, and advanced microeconomic theory. This experience sharpened my presentation and slide design skills.",
    },
  },
  projectsData: {
    Taigu: {
      tags: ["PWA", "Investment"],
      description:
        "Track and monitor your investment performance with detailed analytics.",
    },
    Noads: {
      tags: ["Chrome Extension", "Ad Blocker"],
      description:
        "A simple ad blocker that removes specific DOM elements using CSS selectors.",
    },
    Leechai: {
      tags: ["Personal Finance", "App"],
      description:
        "A personal finance app designed to help you easily track expenses and manage daily budgets.",
    },
  },
  projectCommon: {
    present: "Present",
    visit: "Visit",
    sourceCode: "Source Code",
  },
};
