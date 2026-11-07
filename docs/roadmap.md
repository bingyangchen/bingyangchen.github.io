# 待處理事項

這份清單記錄尚未實作的需求、已知問題與待調查、待決策事項。已確認的方向寫在對應項目中，優先順序另行安排。處理時依 [SDD 流程](../.agents/skills/sdd/SKILL.md) 選擇 `change` 或 `plan`，需要計劃時才建立計劃文件。計劃建立後在對應項目連結，完成修復與驗證後移除已解決的內容；現行規則仍放在 [網站規格](specs/site.md)。

實測結果與程式碼觀察分別註明，不把待驗證的影響當成已確認缺陷。驗證方法與覆蓋範圍見 [手動驗收](../tests/manual/site.md)，每次執行結果記在 commit 說明與交付回報。

## 需求願景

暫無。

## 已確認問題

暫無。

## 待調查與待決策

### 真實手機履歷下載驗收

[計劃 0001：履歷 PDF 下載與短螢幕排版](plans/0001-resume-download.md) 已實作；計劃維持 approved，待完成實機驗收後再封存。

手機與桌面首頁均提供同一份預先產生的英文 A4 PDF。Chromium 已驗證兩種語言、短螢幕及橫向畫面的內容完整性、操作可達性與延後退場，原有短螢幕裁切已修復。

尚需以真實手機的 Safari 或 Chrome 確認檔案可儲存、開啟或分享，並檢查直向與橫向操作。不同瀏覽器與裝置分別記錄，不能由 Chromium 模擬結果推定實機通過。

相關規格：[SITE-R10](specs/site.md#site-r10-履歷來源與下載入口)、[SITE-R12](specs/site.md#site-r12-響應式組成)、[SITE-R13](specs/site.md#site-r13-動態與-reduced-motion)；步驟見 [SITE-R10.1](../tests/manual/site.md#site-r101-首頁下載入口) 與 [SITE-R12.1](../tests/manual/site.md#site-r121-hero-分支)。
