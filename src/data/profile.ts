const givenName = "Bing-Yang";
const familyName = "Chen";

export const profile = {
  name: {
    family: familyName,
    en: `${givenName} ${familyName}`,
    "zh-TW": "陳秉洋",
    resume: `${familyName.toUpperCase()}, ${givenName.toUpperCase()}`,
    nickname: "Bryan",
  },
  email: "bryan.chen.429@gmail.com",
  urls: {
    site: "https://byc1999.com/",
    github: "https://github.com/bingyangchen",
    linkedin: "https://www.linkedin.com/in/bing-yang-chen/",
    cake: "https://www.cake.me/me/BingYangChen",
    blog: "https://blog.byc1999.com/",
  },
  education: {
    school: { en: "National Chengchi University", "zh-TW": "國立政治大學" },
    shortSchoolNameZhTw: "政治大學",
    abbreviation: "NCCU",
    major: { en: "Economics", "zh-TW": "經濟學" },
    degree: { en: "B.A. in Economics", "zh-TW": "經濟學學士" },
    startYear: 2017,
    graduationYear: 2021,
    economicsUrl: "https://econo.nccu.edu.tw/",
  },
};

export const resumeDownload = {
  href: "/resume.pdf",
  download: `${profile.name.en} - ${profile.name["zh-TW"]}.pdf`,
};
