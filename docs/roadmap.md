這份清單記錄尚未實作的需求、已知問題與待調查、待決策事項。已確認的方向寫在對應項目中，優先順序另行安排。處理時依 [SDD 流程](../.agents/skills/sdd/SKILL.md) 選擇 `change` 或 `plan`，需要計劃時才建立計劃文件。計劃建立後在對應項目連結，完成修復與驗證後移除已解決的內容；現行規則仍放在 [網站規格](specs/site.md)。

實測結果與程式碼觀察分別註明，不要把待驗證的事項當成已確認缺陷。驗證方法與覆蓋範圍見 [手動驗收](../tests/manual/site.md)，須回報每次驗證的結果。

# 需求願景

暫無。

# 已確認問題

- 技術債改善：完整檢查及調整提案見 [計劃 0001](plans/0001-codebase-technical-debt.md)。導覽、履歷分工、共用控制與 Token、工具及依賴維護各自安排。相關需求為 SITE-R2、R6、R7、R11、R12、R13、R14、R18、R19，各項證據、批次與驗收放在計劃。
- 靜態資料不一致：無 JavaScript 時仍有主要內容及 PDF 下載，但 noscript 提示宣稱必須啟用 JavaScript；manifest 的 icon 尺寸宣告也與實際圖片不符。兩項均已實測確認，見 [計劃 0001 的 TD-25](plans/0001-codebase-technical-debt.md#td-25校對-metadatamanifest-與-sitemap)，相關需求為 SITE-R14、R16。

# 待調查

- 依賴維護能力：確認 GitHub repo 與帳號已有的警示、依賴分析及版本盤點能力，再決定需要補上的工具，見 [計劃 0001 的 TD-22](plans/0001-codebase-technical-debt.md#td-22補足依賴安全更新)，相關需求為 SITE-R16。
- Sitemap 歸屬：確認其他 GitHub Pages 專案的歸屬、可用性及保留或移除理由，見 [計劃 0001 的 TD-25](plans/0001-codebase-technical-debt.md#td-25校對-metadatamanifest-與-sitemap)。目前沒有外站失效的實測結論，相關需求為 SITE-R16。

# 待決策

暫無。
