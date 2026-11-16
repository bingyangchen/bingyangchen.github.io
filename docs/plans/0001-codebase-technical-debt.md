---
id: "0001"
title: codebase-technical-debt
status: draft
specs:
  - docs/specs/site.md
depends_on: []
---

# 計劃 0001：技術債與模組分工

## 目標

讓內容、互動與工具的修改集中在負責的模組，降低跨檔案同步、理解狀態與驗證的成本。本計劃只保留尚未處理的工作，依問題的成因安排批次；各批次可分別核准。

## 核准紀錄

以下保留既有核准紀錄。本次修訂的待辦範圍仍為草稿，修改計劃不代表核准實作。

- 2026-11-16：使用者核准以 `change` 處理 TD-22 的維護說明及獨立、唯讀、每週與手動執行的過時版本報告，涵蓋查詢結果區分、原始報告保存與失敗處理。

## 範圍

涵蓋 `src/` 的功能分工、導覽、樣式與靜態資料，以及依賴維護和相關驗證。維持 React、Vite、GitHub Pages、英文單頁 A4 履歷、雙語、既有區塊順序與視覺方向。此次提案不增加 application server、CMS、全域狀態管理框架或公開頁面，也不改寫職涯成果。

### 判斷原則

- 以責任混合、重複知識、跨功能耦合與修改所需理解的範圍判斷重構收益。檔案長度、目錄深度或使用 HOC 本身不構成缺陷。
- 測試通過與畫面相同是保留行為的基準，不能用來否定結構問題；重構完成還須驗證責任、狀態與樣式的歸屬。
- 選擇能完整消除成因的設計，改動大小只用來安排驗證與拆批。需要跨檔案修改時一併處理，不以保留舊耦合來縮小 diff。
- 效能改善以量測決定優先度，並區分下載量、執行成本與使用者體感；單次安全掃描沒有公告，也不代表維護流程完整。

證據分為「已重現」「程式碼確認」與「待調查」。結構問題的影響可由依賴與修改路徑確認，不必等到產品故障；尚未重現的使用者故障仍須明確區分。

### 優先順序與工作批次

各批次可獨立安排；同一 TD 的不同範圍分批完成時，僅移除已驗證的部分。

<!-- prettier-ignore -->
| 範圍 | 優先順序 | 安排理由 |
| --- | --- | --- |
| TD-22 依賴維護驗證 | P2，獨立批次 | 觀察版本報告的定期觸發及 CLI 通知送達。 |
| TD-25 Sitemap 歸屬 | P3，獨立批次 | 確認專案路徑的歸屬與可用性，再決定保留或移除。 |
| TD-10 履歷功能分工 | P3，獨立批次 | 集中履歷預覽、內容與列印的維護位置。 |
| TD-23 共用控制與 Token | P3，獨立批次 | 依相同用途整理共用值與規則，與首頁樣式分工分開驗收。 |
| TD-26 履歷載入 | P3，獨立批次 | 已確認可減少首頁下載量，但目前量到的收益較小。 |

## 設計稿

無。本計劃保留現有畫面與互動，狀態圖放在對應方案中；若實作需要改變產品行為或視覺方向，另行修訂並核准。

## 檢查發現與調整方案

### TD-10：按功能集中履歷

程式碼確認：履歷預覽及內容在 `pages/Main/Resume`，列印 helper 在 `src/resume`。修改列印及履歷內容時，需跨兩個位置追查。

方案：將 Resume 預覽、ResumeSheet、列印 helper 與專用型別放在 `features/resume`，頁面入口負責接到既有 route。私有 helper、素材組合與型別隨功能維護，跨首頁及履歷的事實仍放在 `data/`，翻譯約定仍由 `i18n/` 負責。此批保留既有載入策略，沒有必要搬動 router 或新增 `app/`。

完成條件：預覽、內容與列印可從同一功能入口追查，私有模組不由全站共用 barrel 匯出，沒有循環 import，並維持既有的單頁 A4 版面、文字、字型、連結與語言還原行為。

### TD-22：補足依賴安全更新

待驗證：觀察[版本報告 workflow](../../.github/workflows/dependencies.yml) 由 schedule 定期觸發的實際紀錄。維護入口、結果判讀及選型理由見 [README](../../README.md#dependency-maintenance)。

待驗證：既有 Dependabot CLI 通知的實際送達，通知偏好、限制及每週檢視所有嚴重度警示的方式見 README。

完成條件：維護者分別記錄定期觸發與 CLI 通知送達的實際觀察結果，未觀察的項目保留待驗證。

### TD-23：整理共用控制與 Token

程式碼確認：已有 [design system](../../src/styles/README.md)、semantic tokens 及 section、focus、control mixins，應沿用。

方案：先辨認相同用途的重複，再共用既有 token 或 mixin。RoundButton 的圓形使用 circle token；Button、Header 是否共用尺寸或規則依實際角色判斷，不因數值相等就合併。局部構圖、陰影、光學調整與履歷印刷幾何仍由使用處維護。

完成條件：

- 每個抽出值均能說明共同用途；只在單一構圖使用的數字不因相同而共用。
- Module 規則依 DOM 順序整理，token 依基礎、語意及元件設定的既有規則排列。
- 保留兩種語言及既有 breakpoints 的畫面，並通過一般動態、reduced-motion、鍵盤 focus、forced colors 與單頁 A4 PDF 的既有驗證。

### TD-25：確認 Sitemap 歸屬

待調查：sitemap 的 8 個專案路徑不由本 repo 輸出，但可能由其他 GitHub Pages repo 提供，目前沒有外站失效或歸屬的查證結果。

方案：每個專案記錄檢查日期、歸屬、HTTP response、最終目的地與實際內容；HTTP 200 若只是 fallback 首頁，不能當成目的地有效。保留或移除理由記錄在 README 的靜態 metadata 說明，再更新由 profile 產生的清單。個人 metadata 仍由共用 profile 維護。

完成條件：每個 URL 都有可追溯的處置理由，非公開 `/resume` 仍不列入；未查完的目的地保留為待調查，不以本 repo 沒有檔案作為刪除理由。

### TD-26：分開履歷載入並記錄啟動方式

程式碼確認：[router](../../src/router.tsx) 直接 import Resume，首頁 JS 與 CSS 含履歷專用內容及規則。[啟動入口](../../src/index.tsx) 對 browser snapshot 使用 `createRoot` 重建 DOM，目前沒有執行 hydration，也沒有已重現的 hydration mismatch。

2026-11-15 在 Node 24.21.0、Vite 8.3.6，以暫存 Vite transform 將 Resume 改為 `lazy` 與 `Suspense`，未修改 repo 程式。以同一個 `gzipSync` 預設設定比較初始資源，重現命令見[履歷 Route 分割量測](0001-codebase-technical-debt/measurements.md#履歷-route-分割)：

<!-- prettier-ignore -->
| 初始資源 | 原本 gzip bytes | Route 分割實驗 gzip bytes |
| --- | --- | --- |
| JavaScript | 113824 | 112254 |
| CSS | 10906 | 9796 |

合計減少 2680 bytes，約 2.6 KiB gzip。原本首頁資源請求沒有履歷字型，不能將字型檔大小算成此方案節省的下載量。這是下載量實驗，尚未驗證實驗版本的完整 PDF 流程，也未建立載入時間或互動速度改善的結論。

方案：保留為較低優先的獨立 route 分割，實作前依當時功能依賴重測。以 [`React.lazy` 與 `Suspense`](https://react.dev/reference/react/lazy) 分開非公開預覽，build 明確等待 ResumeSheet 及其資源就緒後才檢查 PDF。分割範圍包含 Resume、ResumeSheet 與它們的 CSS Modules；[全域 print 入口](../../src/styles/print.scss) 仍由 `src/index.tsx` 載入，保留既有頁面及列印規則。

啟動方式與量測限制記錄在 README；若要導入 hydration，另行設計 snapshot 與 client 的語言、ID、時間及路徑一致性，遵循 [React 的 hydration 要求](https://react.dev/reference/react-dom/client/hydrateRoot)。

完成條件：首頁初始資源不含 Resume、ResumeSheet 的實作、履歷內容及 CSS Modules，全域 print 規則維持原載入方式。預覽與 build PDF 等待 lazy route 完成；缺少 route chunk 時 build 回報失敗而非擷取 placeholder。首頁完整 prerender、公開範圍與既有列印結果維持，交付報告記錄同條件的 gzip 與實際請求差異。

## 決策

### 工具與共用規則

<!-- prettier-ignore -->
| 決策 | 理由及實作後保存位置 |
| --- | --- |
| 依用途共用 Sass Token 與 patterns | 讓用途不同的設定可以分別修改；保存於 [design system](../../src/styles/README.md)。 |
| 依能力缺漏選擇依賴維護工具 | 避免重做既有服務已提供的能力，選型條件見 [TD-22](#td-22補足依賴安全更新)，實際維護入口與理由保存於 README。 |
| 履歷載入與 hydration 分開設計 | Route 分割的下載收益已可量測，hydration 還需解決 snapshot 與初次 render 的一致性；保存於 README 的啟動及靜態輸出說明。 |

## 做法要點

實作前先確認當時程式與本計劃的證據仍相符，再建立該批驗證基準。批次與依賴以[優先順序與工作批次](#優先順序與工作批次)為準。

保留下列既有約定：

- `/resume` 是非公開 client route，內部產 PDF 使用該 route 不改變公開 hosting 的嚴格靜態行為。
- 作品 panels 保留最大自然高度，切換作品維持頁面位置與焦點；分工及樣式調整保留目前已實作的 DOM 與 motion 群組結果。
- Prerender 保留完整主要內容、shell metadata、PDF 連結及靜態可讀性，排除 portal、motion 暫存狀態與 loading placeholder。
- PDF 字型、內容、單頁 A4 及獨立解析檢查維持；共用樣式變更必須確認沒有影響列印。
- Native dialog、anchor、文字選取、reduced-motion、focus 與 Tooltip 保留既有 browser 及 manual 情境。

各批實作更新實際受影響的 spec、manual checks、README 與 design system。這次修訂沒有改變產品方向；只有後續經核准的變更涉及目的、區塊、目的地、語言、文案語氣或視覺系統時，才同步修改 design context。

## 驗證方式

### 結構與工程驗收

各 TD 的「完成條件」是工程驗收的完整定義，產品回歸對應如下表，不另重複一份條件。結構與 import 歸屬由 code review 核對，純計算及狀態轉換使用 unit test，涉及 DOM、資源與歷史的結果使用 browser 驗證，需實機或輔助工具判斷的結果另做 manual checks。

### 產品情境回歸

<!-- prettier-ignore -->
| 批次 | 保留的主要情境 |
| --- | --- |
| 履歷分工及載入 | SITE-R1.3、R1.4、R10、R11、R13.11、R14。 |
| 共用控制與 Token | SITE-R12.6、R18、R19、R20，以及受影響的控制與 PDF 情境。 |
| Sitemap | SITE-R16.1、R16.2。 |

各批沿用現行 spec 已宣告的 unit、browser、manual 對應。Browser 回歸使用當次 production build；實機、Safari、OS 列印與螢幕閱讀器的人工結果分開回報。

每批程式實作完成後執行 `npm run check`，並完成適用的 manual checks 及獨立 code review。修復且驗證的範圍才從本計劃與 Roadmap 移除；驗證限制記錄在交付報告，不把未執行的人工檢查寫成通過。

### 文件檢查

計劃、量測附件與 Roadmap 的文件變更執行 Markdown、frontmatter 解析、Prettier、中文 lint 與 `npm run check:scenarios`；量測命令另實際執行確認。由不帶規劃對話脈絡的 reviewer 檢查證據、範圍、依賴及驗收是否一致，另依中文寫作規範審稿。

## 還沒定案的問題

TD-22 的定期觸發及 CLI 通知送達依該項列出的範圍驗證。

Sitemap 歸屬依 TD-25 的既定調查範圍處理。

TD-26 的排期依當時重新量測決定。
