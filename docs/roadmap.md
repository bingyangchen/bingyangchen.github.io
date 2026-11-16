這份清單記錄尚未實作的需求、已知問題與待調查、待決策事項。已確認的方向寫在對應項目中，優先順序另行安排。處理時依 [SDD 流程](../.agents/skills/sdd/SKILL.md) 選擇 `change` 或 `plan`，需要計劃時才建立計劃文件。計劃建立後在對應項目連結，完成修復與驗證後移除已解決的內容；現行規則仍放在 [網站規格](specs/site.md)。

實測結果與程式碼觀察分別註明，不要把待驗證的事項當成已確認缺陷。驗證方法與覆蓋範圍見 [手動驗收](../tests/manual/site.md)，須回報每次驗證的結果。

# 需求願景

暫無。

# 已確認問題

- 200% 文字放大時，Projects 與 Blog 的部分操作超出窄版畫面。2026-11-16 以 Chromium、390 × 844、英文及一般動態設定，將根元素字級設為 200% 後，量到 Projects 的 GitHub 連結右緣約 404 px、Leechai 分頁約 396 px，Blog 的 Browse all notes 連結約 418 px；Hero 沒有超出畫面。此次沒有修改 Projects 與 Blog，後續需檢查文字放大時的換行及操作排列，相關需求為 SITE-R12。

# 待調查

- 依賴維護流程驗證：GitHub 版本報告由 schedule 定期觸發的實際紀錄、該次報告內容與來源 commit，以及既有 Dependabot CLI 通知的實際送達仍待驗證。查核方式與證據要求見 [README](../README.md#verify-scheduled-execution-and-notification-delivery)，相關需求為 SITE-R16。

# 待決策

暫無。
