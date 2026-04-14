import type { TranslationDictionary } from "../types";

export const traditionalChineseDictionary: TranslationDictionary = {
  name: "陳秉洋",
  home: {
    greeting:
      "以前是個靠寫 code 維生的打工仔，現在是個使喚 AI 幫我寫 code 的打工仔。平常喜歡研究魔法史，還有一點經濟學！",
    role: "政治大學 經濟學系",
    downloadResume: "下載履歷",
    scrollDown: "下滑了解更多",
  },
  navigation: {
    about: "簡歷",
    projects: "專案",
    blog: "文章",
  },
  about: {
    title: "簡歷",
    subtitle:
      "我是一個具備經濟學背景的軟體工程師。對技術充滿好奇心，並在透過程式碼解決真實問題、打造產品的過程中，找到強烈的成就感與使命感。",
    workExperience: "工作經歷",
    skills: "專業技能",
    education: "學歷",
    nccuEconomics: "國立政治大學 經濟學系",
    nccuFintech: "國立政治大學 金融科技學士學程",
  },
  projects: {
    title: "專案",
    subtitle:
      "我喜歡在閒暇時間透過 Side Projects 探索新技術，將有趣的點子轉化為實際的產出。希望你能在這裡發現一些酷東西！",
    visitGithub: "我的 GitHub",
  },
  blog: {
    title: "文章",
    subtitle:
      "我相信學習是一段雙向的過程，吸收新知與分享見解同樣重要。這裡記錄了我的學習筆記與技術心得，歡迎隨時與我交流！",
    checkItOut: "查看文章",
  },
  qrModal: {
    scanToConnect: "掃描以取得連結",
  },
  header: {
    home: "首頁",
    about: "簡歷",
    projects: "專案",
    blog: "文章",
  },
  footer: {
    contactMe: "聯繫方式",
    services: "服務項目",
    personalBranding: "個人品牌網站開發",
    corporateBranding: "企業形象網站開發",
    internalSystems: "企業內部管理系統",
    otherWebApps: "其他 Web 應用程式開發",
    programmingInstruction: "程式教學",
    economicsInstruction: "經濟學教學",
    socialMedia: "其它平台",
  },
  workExperiences: {
    "swag-2025": {
      work_duration: "2025 年 1 月 ~ 至今",
      job_title: "後端工程師",
      company_name: "Swag",
      description:
        "將多網域可用性監控服務由 Flask 與 MongoDB 重構為 FastAPI 與 PostgreSQL，有效精簡程式碼架構並顯著降低 CPU 負載。導入 GrowthBook 進行 Feature Flag 管理，降低內部團隊設定功能開關的門檻，大幅提升操作彈性。",
    },
    "gaia-2024": {
      work_duration: "2024 年 12 月 ~ 2025 年 12 月．1 年 1 個月",
      job_title: "資深後端工程師",
      company_name: "Gaia",
      description:
        "主導設計與開發基於 LLM 的企業級知識管理平台，透過 RAG 架構與向量資料庫實現精準的語意搜尋，大幅簡化企業內部資訊檢索流程並提升客服效率，成功導入至捷安特 (Giant)、威剛科技 (ADATA) 等指標性企業。為符合企業級資安要求，實作完整的 RBAC 架構，確保機敏文件在向量檢索過程中的安全隔離。",
    },
    "pinkoi-2023": {
      work_duration: "2023 年 3 月 ~ 2024 年 12 月．1 年 10 個月",
      job_title: "後端工程師",
      company_name: "Pinkoi",
      description:
        "設計並實作具備擴展性與高效能的 API；整合第三方服務；並與前端團隊緊密合作，交付穩健、生產級別的電商功能。重新設計資料庫 Schema，現代化跨服務通訊，並消除歷史遺留的效能瓶頸，大幅提升系統可靠性與吞吐量。建置並部署內部管理工具，自動化關鍵工作流程，加速業務營運並減少人工負擔。執行嚴格的程式碼審查並落實工程最佳實踐，以維持程式碼品質、確保系統可維護性，並推動長期的可擴展性。",
    },
    "sysfeather-2022": {
      work_duration: "2022 年 3 月 ~ 2023 年 3 月．1 年 1 個月",
      job_title: "後端工程師",
      company_name: "Sysfeather",
      description:
        "開發具備多租戶架構的電商自動化開店系統後端。主導社群購物專案的 POC，整合 Facebook API 以實現留言管理與貼文抽獎功能，提升客戶的社群媒體管理體驗。",
    },
    "beida-2020": {
      work_duration: "2020 年下學期",
      job_title: "經濟學課程講師",
      company_name: "新北市立北大高級中學",
      description:
        "為了讓即將畢業的高中生更深入了解經濟學，我設計了一門為期 15 週的經濟學原理課程。課程內容涵蓋時事討論、基本原理以及進階個體經濟學理論。這段經歷磨練了我的簡報與投影片設計能力。",
    },
  },
  projectsData: {
    Taigu: {
      tags: ["PWA", "投資理財"],
      description: "透過詳細的數據分析，幫助你輕鬆追蹤並監控投資績效。",
    },
    Noads: {
      tags: ["Chrome 外掛", "廣告阻擋"],
      description:
        "一款輕量級的廣告阻擋工具，能透過自訂 CSS 選擇器精準移除網頁上的特定元素。",
    },
    Leechai: {
      tags: ["個人理財", "原生 App"],
      description:
        "一款專為個人理財設計的記帳應用程式，幫助你輕鬆記錄日常收支並管理財務。",
    },
  },
  projectCommon: {
    present: "至今",
    visit: "前往網站",
    sourceCode: "原始碼",
  },
};
