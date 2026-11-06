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
  navigation: { about: "簡歷", projects: "專案", blog: "文章" },
  about: {
    title: "簡歷",
    subtitle:
      "具備經濟學背景，專注於軟體工程與產品開發。相信好的技術不必看起來像魔法，而是能穩定地解決問題，並留下真正有用的成果。",
    workExperience: "工作經歷",
    skills: "專業技能",
    education: "學歷",
    nccuEconomics: "國立政治大學 經濟學系",
    nccuFintech: "國立政治大學 金融科技學士學程",
  },
  projects: {
    title: "專案",
    subtitle:
      "閒暇時間會透過個人專案探索新技術，順便確認哪些想法不只聽起來不錯，也值得真的做出來。",
    visitGithub: "GitHub",
  },
  blog: {
    title: "文章",
    subtitle: "很多事寫下來之後，才知道自己是不是真的懂了。",
    browseAll: "查看完整筆記",
    featured: "精選文章",
    readArticle: "閱讀全文",
    articleLanguage: "文章以繁體中文為主。",
    articles: {
      directoryStructure: {
        category: "軟體設計",
        summary: "從依技術分層到依功能分組，重新理解目錄結構如何影響模組之間的依賴。",
      },
      rateLimiter: {
        category: "系統設計",
        summary:
          "比較五種 rate limit 演算法，整理流量突增、精確度與實作成本之間的取捨。",
      },
      cleanArchitecture: {
        category: "閱讀筆記",
        summary: "從依賴方向到框架耦合，整理書中的原則與實務上的取捨。",
      },
    },
  },
  qrModal: {
    open: "顯示 QR code",
    close: "關閉 QR code",
    scanToConnect: "掃描以取得連結",
  },
  header: {
    home: "回到首頁",
    about: "簡歷",
    projects: "專案",
    blog: "文章",
    navigationLabel: "主要導覽",
    openMenu: "選單",
    closeMenu: "關閉",
    skipToContent: "跳至主要內容",
    switchLanguage: "切換成英文",
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
    "swag-2026": {
      work_duration: "2026 年 1 月 ~ 至今",
      job_title: "後端工程師",
      company_name: "Swag",
      description:
        "從零開發合作平台後端，並建立支援依需求轉檔與影片重用的 Telegram 影音服務。在合作夥伴點數轉帳與遊戲錢包整合中，實作 API 簽章與防止重複交易的機制，並為遊戲交易建立 PostgreSQL 帳本與自動對帳流程。同時將網域可用性 API 由 Flask、MongoDB 遷移至非同步 FastAPI、PostgreSQL，加入 Redis cache，並導入 GrowthBook 支援功能發布與 A/B 測試。",
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
      purpose: "投資績效，一目了然。",
      description: "從交易紀錄、資產配置到績效分析，讓每一筆投資都有清楚的紀錄。",
      image_description: "Taigu 投資總覽與資產配置介面",
      visit_label: "探索 Taigu",
    },
    Noads: {
      tags: ["Chrome 外掛", "廣告阻擋"],
      purpose: "讓網頁，留下你想看的內容。",
      description: "用自訂 CSS 選擇器，移除網頁上指定的元素。",
      image_description: "Noads 擴充功能的 CSS 選擇器設定介面",
      visit_label: "前往 Chrome 商店",
    },
    Leechai: {
      tags: ["個人理財", "原生 App"],
      purpose: "日常收支，清楚掌握。",
      description: "記錄日常收支、管理預算，在同一個 App 裡掌握個人財務。",
      image_description: "Leechai 帳戶總覽與個人設定介面",
      visit_label: "前往 App Store",
    },
  },
  projectCommon: {
    present: "至今",
    sourceCode: "原始碼",
    chooseProject: "選擇作品",
    maintained: "維護期間",
  },
};
