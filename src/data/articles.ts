export const featuredArticle = {
  id: "directoryStructure",
  title: "重新思考\n專案目錄結構",
  titleLanguage: "zh-TW",
  url: "https://blog.byc1999.com/software/software/system-design/chong-xin-si-kao-zhuan-an-mu-lu-jie-gou",
} as const;

export const additionalArticles = [
  {
    id: "rateLimiter",
    title: "Rate Limiter",
    titleLanguage: "en",
    url: "https://blog.byc1999.com/software/software/system-design/rate-limiter",
  },
  {
    id: "cleanArchitecture",
    title: "Clean Architecture",
    titleLanguage: "en",
    url: "https://blog.byc1999.com/software/software/reading-notes/clean-architecture",
  },
] as const;

export type BlogArticleId =
  typeof featuredArticle.id | (typeof additionalArticles)[number]["id"];
