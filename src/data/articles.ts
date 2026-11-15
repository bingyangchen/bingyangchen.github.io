import { profile } from "./profile";
export const featuredArticle = {
  id: "directoryStructure",
  title: "重新思考\n專案目錄結構",
  titleLanguage: "zh-TW",
  url: new URL(
    "software/software/system-design/chong-xin-si-kao-zhuan-an-mu-lu-jie-gou",
    profile.urls.blog,
  ).href,
} as const;

export const additionalArticles = [
  {
    id: "rateLimiter",
    title: "Rate Limiter",
    titleLanguage: "en",
    url: new URL("software/software/system-design/rate-limiter", profile.urls.blog)
      .href,
  },
  {
    id: "cleanArchitecture",
    title: "Clean Architecture",
    titleLanguage: "en",
    url: new URL(
      "software/software/reading-notes/clean-architecture",
      profile.urls.blog,
    ).href,
  },
] as const;

export type BlogArticleId =
  typeof featuredArticle.id | (typeof additionalArticles)[number]["id"];
