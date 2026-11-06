# 待處理事項

這份清單記錄尚未實作的需求、已知問題與待調查、待決策事項。已確認的方向寫在對應項目中，優先順序另行安排。處理時依 [SDD 流程](../.agents/skills/sdd/SKILL.md) 選擇 `change` 或 `plan`，需要計劃時才建立計劃文件。計劃建立後在對應項目連結，完成修復與驗證後移除已解決的內容；現行規則仍放在 [網站規格](specs/site.md)。

實測結果與程式碼觀察分別註明，不把待驗證的影響當成已確認缺陷。驗證方法與覆蓋範圍見 [手動驗收](../tests/manual/site.md)，每次執行結果記在 commit 說明與交付回報。

## 需求願景

### 窄畫面履歷入口

已確認手機與桌面都從首頁取得同一份預先產生的英文 A4 PDF。Build 時沿用 ResumeSheet 自動產生檔案，首頁按鈕改為取得 PDF；`/resume` 維持非公開預覽。

窄版下載按鈕保留在 Hero，卡片寬度依畫面決定，高度隨內容延伸，短螢幕以整頁捲動讀完。需一併調整 Hero 退場動畫，讓閱讀與操作期間的內容保持清楚。

現況在小於 720 px 隱藏公開匯出按鈕，390 × 844 實測相符。後續需實作 PDF 產檔與下載，並以真實手機驗證取得檔案的流程。

相關規格：[SITE-R10](specs/site.md#site-r10-履歷來源與列印入口)、[SITE-R11](specs/site.md#site-r11-pdf-內容與版面)、[SITE-R1.3](specs/site.md#site-r1-頁面與公開範圍)；相關問題：[短螢幕裁切](#短螢幕裁切)。

### 正文選取與複製

已確認工作經歷、作品說明等正文可選取與複製，按鈕與操作控制維持不可選取。

現況多數文字預設不可選取，email 等另有例外。後續需依文字用途調整，並驗證桌面選取與手機長按。

相關規格：[SITE-R5](specs/site.md#site-r5-hero-與聯絡資訊)、[SITE-R12](specs/site.md#site-r12-響應式組成)。

## 已確認問題

### 鍵盤與焦點

實測 QR code opener 是不可用 Tab 到達的 div，開啟後焦點停在 body，關閉後缺少焦點還原。

後續需依設計方向補齊鍵盤操作與焦點行為。現有滑鼠測試不表示整體已符合可及性要求。

相關規格：[SITE-R9](specs/site.md#site-r9-qr-code-顯示與關閉)；方向依據：[Interaction and Motion](design.md#interaction-and-motion)。

### 短螢幕裁切

實測 320 × 568 與 390 × 568，Hero 卡片裁掉部分社群與導覽。

後續依 [窄畫面履歷入口](#窄畫面履歷入口) 的排版方向調整，讓重要操作在這些尺寸可達。修復前，這些尺寸的可達性不能回報為通過。

相關規格：[SITE-R12](specs/site.md#site-r12-響應式組成)。

### Leechai Fallback 文案

程式碼盤點發現原始作品資料的描述與兩份字典不一致，目前正常顯示使用字典，因此尚無證據顯示訪客在正常操作下看到錯誤內容。

後續需依確認過的內容來源處理 fallback 文案，不把錯誤資料寫成產品要求。

相關規格：[SITE-R7.5](specs/site.md#site-r7-作品選取與詳情)。

### 英文履歷語意

ResumeSheet 未獨立設定 `lang`，Chromium 實測繁中介面下履歷繼承 `zh-TW`。

已確認需讓英文履歷獨立標示 `lang="en"`，並在實作時驗證輔助工具行為與產生 PDF 的語言資訊。

相關規格：[SITE-R10.4](specs/site.md#site-r10-履歷來源與列印入口)、[SITE-R11](specs/site.md#site-r11-pdf-內容與版面)。

### 隱藏履歷的焦點

在現有 production build，以 Chromium 的 390 × 844 繁中頁面循序按 Tab，焦點會進入螢幕外履歷的 email 連結。首頁 offscreen portal 使用 aria-hidden，未設定 inert。

已確認首頁改用預先產生的 PDF 後，移除供列印的隱藏履歷，讓不可見內容不進入鍵盤焦點順序；非公開預覽仍使用共用 ResumeSheet。

相關規格：[SITE-R10.5](specs/site.md#site-r10-履歷來源與列印入口)。

### 儲存被拒絕

以 Chromium 模擬 localStorage 丟出 `SecurityError`，已確認以下結果：

- `getItem` 失敗時，React 啟動失敗，首頁空白。
- `setItem` 失敗時，語言仍能切換，但偏好無法保存，並出現未處理的例外。

已確認儲存不可用時，網站仍應支援瀏覽與語言切換，不另顯示提示。語言選擇依以下規則處理：

- 使用者切換語言後，網站在本次頁面保留選擇。
- 使用者重新載入頁面時，網站依瀏覽器語言決定顯示語言。

後續需處理讀寫例外並驗證降級規則。

相關規格：[SITE-R3](specs/site.md#site-r3-初始語言選擇)、[SITE-R4](specs/site.md#site-r4-語言切換與持久化)。

## 待調查與待決策

暫無。
