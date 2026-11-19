# Roadmap

這份清單記錄還需要處理的需求、問題及待查事項。現行行為見[網站規格](specs/site.md)。建立計劃後從對應項目連結，修復並驗證後移除已完成的項目。

## 需求願景

## 已確認問題

- **Projects 與 Blog 在窄版放大文字後出現水平溢出。** 2026-11-16 以 Chromium、390 × 844、英文及一般動態設定，將根字級設為 200% 後，Projects 的 GitHub 連結與 Leechai 分頁右緣約為 404 px 與 396 px，Blog 的完整筆記連結右緣約為 418 px。檢查相關控制的換行與排列。規格見 [SITE-R12](specs/site.md#site-r12-響應式組成)。

## 待調查

- **依賴報告與通知。** 確認 GitHub 定期觸發的 run、對應 commit 與報告內容，再確認 Dependabot CLI 警告曾實際送達。步驟與所需證據見[依賴維護](dependency-maintenance.md#verify-scheduled-execution-and-notification-delivery)。
- **圖片原生選單。** 以桌面瀏覽器確認右鍵選單，再用 iOS Safari、iOS Chrome 與 Android Chrome 實機確認長按及從圖片起始的捲動。依[手動驗收 SITE-R21.1 到 SITE-R21.5](../tests/manual/site.md#site-r211-圖片右鍵) 記錄結果。

## 待決策
