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
        "Much of my work has centered on backend systems. I modernized a high-throughput, domain healthness monitoring service by migrating its backend to FastAPI and PostgreSQL, which cut CPU usage and made the codebase considerably easier to maintain. I then designed and built the backend for a new affiliate platform from the ground up, covering the partner-facing APIs, the commission settlement workflows, and the internal tools our partner operations team relied on. Along the way, I also introduced a remote config service that gave product teams the flexibility to manage feature rollouts and run A/B tests on their own terms.",
    },
    "gaia-2024": {
      work_duration: "Dec 2024 ~ Dec 2025．1 yr 1 mo",
      job_title: "Senior Backend Engineer",
      company_name: "Gaia",
      description:
        "One of the projects I'm proudest of is an enterprise AI knowledge platform I architected from the ground up. I owned the backend design end to end, building it to support conversational AI, knowledge base management, RAG-powered retrieval, multimodal generation, and modular MCP integrations, along with the core platform capabilities the whole product stood on: authentication, SSO, RBAC, and file upload. Because it was customer-facing, performance mattered as much as features, so I optimized the database schemas and refactored the backend services, which brought chat loading time down by 67%. But the part I've come to value most wasn't the code itself. As the platform grew I put real effort into how the team worked, mentoring teammates, defining our coding standards, and systematizing code reviews, and it paid off in a way I could measure: new engineers went from a week to a single day to get up to speed.",
    },
    "pinkoi-2023": {
      work_duration: "Mar 2023 ~ Dec 2024．1 yr 10 mos",
      job_title: "Backend Engineer",
      company_name: "Pinkoi",
      description:
        "On the e-commerce side, a lot of my work came down to removing friction in the buying flow. I designed and implemented guest shopping cart functionality so that non-registered users could move through checkout without being forced to sign up first. I also integrated Taiwan's Cultural Points program and ShopBack Hong Kong, which opened up new purchasing channels and drove order growth in the markets we were targeting. The piece I found most demanding was re-architecting the free-shipping eligibility computation pipeline: I brought the computation down by nearly half while keeping promotion accuracy intact even during high-traffic campaigns, when getting it wrong would have been most costly.",
    },
    "sysfeather-2022": {
      work_duration: "Mar 2022 ~ Mar 2023．1 yr 1 mo",
      job_title: "Backend Engineer",
      company_name: "Sysfeather",
      description:
        "I built the backend services behind a multi-tenant e-commerce platform, and at the same time took the lead on the technical proof of concept for our social commerce integrations.",
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
