import { profile } from "../../data/profile";
import type { TranslationDictionary } from "../types";

export const englishDictionary: TranslationDictionary = {
  name: profile.name["en"],
  home: {
    greeting:
      "I write code for a living. AI does some of the typing. Off the clock, I’m into the history of magic, with a little economics on the side.",
    role: `${profile.education.degree.en}, ${profile.education.abbreviation}`,
    flipAvatar: "Flip portrait",
    downloadResume: "Download Resume",
    scrollDown: "Scroll down",
  },
  navigation: { about: "About", projects: "Projects", blog: "Blog" },
  about: {
    topics: {
      origin: {
        label: "Where did it start?",
        question: ["Economics,", "then code.", "What changed?"],
        answer:
          "I learned to code before AI tools came along, and I loved seeing a program I’d written run for the first time. Studying economics taught me why creating value matters. Back then, I figured the most direct way to do that was to build something that would solve a problem for someone else.",
      },
      work: {
        label: "Products I’ve built",
        question: ["What have", "you built?"],
        answer:
          "At Pinkoi, I spent a lot of time figuring out how to make online shopping better for customers. I went on to help build an AI knowledge platform for businesses from scratch. Now I work on games at Swag so people have more to do on the platform beyond watching live streams.",
      },
      curiosity: {
        label: "And off the clock?",
        question: ["What do you", "do outside", "of work?"],
        answer:
          "I’m interested in psychology. I also practice calligraphy and take photos.",
      },
    },
    navigation: "Interview chapters",
    jump: "Jump to",
    resume: "Download full resume",
    continue: "Keep scrolling",
    photoAlt: {
      street:
        "Two people in bright yellow jackets stand on opposite sides of the frame, against concrete and red brick.",
      architecture:
        "A cyclist passes a building with blue glazing and sweeping white curves.",
      coast:
        "Waves break against a rocky shore beneath steep cliffs, with a lone figure by the water.",
      passage: "Two people walk through a sunlit passage framed by beams.",
    },
  },
  projects: {
    title: "Projects",
    subtitle:
      "In my spare time, I use personal projects to explore new technologies and to find out which ideas are not just interesting in theory, but worth building for real.",
    visitGithub: "GitHub",
  },
  blog: {
    title: "Blog",
    subtitle: "Writing things down is how I find out whether I really understand them.",
    browseAll: "Browse all notes",
    featured: "Featured essay",
    readArticle: "Read on GitBook",
    articleLanguage: "Primarily in Traditional Chinese.",
    articles: {
      directoryStructure: {
        category: "Software design",
        summary:
          "From layers to features: how the way we organize files shapes the dependencies between modules.",
      },
      rateLimiter: {
        category: "System design",
        summary:
          "Five rate limiting algorithms, with trade-offs in burst traffic, accuracy, and implementation cost.",
      },
      cleanArchitecture: {
        category: "Reading notes",
        summary:
          "Notes on dependency rules, framework coupling, and the trade-offs behind the principles.",
      },
    },
  },
  qrModal: {
    open: "Show QR code",
    close: "Close QR code",
    scanToConnect: "Scan to connect",
  },
  header: {
    home: "Back to home",
    about: "About",
    projects: "Projects",
    blog: "Blog",
    navigationLabel: "Main navigation",
    openMenu: "Menu",
    closeMenu: "Close",
    skipToContent: "Skip to content",
    switchLanguage: "Switch to Traditional Chinese",
  },
  footer: {
    title: "Let’s talk.",
    description: "About technology, products, or working together.",
    email: "Send an email",
    elsewhere: "Elsewhere",
    home: "Back to home",
  },
  projectsData: {
    taigu: {
      tags: ["PWA", "Investment"],
      purpose: "A clearer view of your investments.",
      description:
        "Track transactions, review asset allocation, and monitor performance in one place.",
      image_description: "Taigu investment overview and asset allocation screens",
      visit_label: "Explore Taigu",
    },
    noads: {
      tags: ["Chrome Extension", "Ad Blocker"],
      purpose: "A cleaner web, on your terms.",
      description: "Choose which page elements to remove with custom CSS selectors.",
      image_description: "Noads extension interface for configuring CSS selectors",
      visit_label: "Chrome Web Store",
    },
    leechai: {
      tags: ["Personal Finance", "App"],
      purpose: "Everyday finances, made clearer.",
      description:
        "Keep track of daily income and expenses, and manage your budget in one app.",
      image_description: "Leechai account overview and personal settings screens",
      visit_label: "View on the App Store",
    },
  },
  projectCommon: {
    present: "Present",
    sourceCode: "Source Code",
    chooseProject: "Choose a project",
    maintained: "Maintained",
  },
};
