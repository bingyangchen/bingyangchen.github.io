這份清單記錄尚未實作的需求、已知問題與待調查、待決策事項。已確認的方向寫在對應項目中，優先順序另行安排。處理時依 [SDD 流程](../.agents/skills/sdd/SKILL.md) 選擇 `change` 或 `plan`，需要計劃時才建立計劃文件。計劃建立後在對應項目連結，完成修復與驗證後移除已解決的內容；現行規則仍放在 [網站規格](specs/site.md)。

實測結果與程式碼觀察分別註明，不要把待驗證的事項當成已確認缺陷。驗證方法與覆蓋範圍見 [手動驗收](../tests/manual/site.md)，須回報每次驗證的結果。

# 需求願景

暫無。

# 已確認問題

- 技術債改善：完整檢查及調整提案見 [計劃 0001](plans/0001-codebase-technical-debt.md)。共用控制與 Token、履歷載入各自安排，各項證據、相關需求與驗收放在計劃。

# 待調查

- 依賴維護流程驗證：GitHub 版本報告由 schedule 定期觸發的實際紀錄，以及既有 Dependabot CLI 通知的實際送達仍待驗證，範圍見 [計劃 0001 的 TD-22](plans/0001-codebase-technical-debt.md#td-22補足依賴安全更新)。維護入口與判讀方式見 [README](../README.md#dependency-maintenance)，相關需求為 SITE-R16。

# 待決策

暫無。
