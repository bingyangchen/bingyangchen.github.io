這份清單記錄尚未實作的需求、已知問題與待調查、待決策事項。已確認的方向寫在對應項目中，優先順序另行安排。處理時依 [SDD 流程](../.agents/skills/sdd/SKILL.md) 選擇 `change` 或 `plan`，需要計劃時才建立計劃文件。計劃建立後在對應項目連結，完成修復與驗證後移除已解決的內容；現行規則仍放在 [網站規格](specs/site.md)。

實測結果與程式碼觀察分別註明，不要把待驗證的事項當成已確認缺陷。驗證方法與覆蓋範圍見 [手動驗收](../tests/manual/site.md)，須回報每次驗證的結果。

# 需求願景

暫無。

# 已確認問題

- 技術債改善：完整檢查及調整提案見 [計劃 0001](plans/0001-codebase-technical-debt.md)。目前列出的項目均待核准。待處理的已確認問題為 Footer 連結不足 44 px，以及未選作品大圖提前下載；另有內容型別、模組分工、測試與 build 工具的改善建議。相關需求為 SITE-R2、R6、R7、R11、R12、R13、R14、R15，各項證據與驗收放在計劃。

# 待調查

- 靜態資料校對：確認 sitemap 內其他 GitHub Pages 專案的歸屬與可用性，以及 manifest 圖示宣告是否符合真實尺寸，見 [計劃 0001 的 TD-25](plans/0001-codebase-technical-debt.md#td-25校對-metadatamanifest-與-sitemap)。目前沒有外站失效的實測結論，相關需求為 SITE-R16。

# 待決策

- 可讀性政策：建議解除 viewport 的 user scaling 限制，見 [計劃 0001 的 Spec 變更](plans/0001-codebase-technical-debt.md#spec-變更)。此調整涉及現行設計，核准前保留原規則，相關需求為 SITE-R12。
