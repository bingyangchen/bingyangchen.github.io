# 待處理事項

這份清單記錄需求願景、已知問題與待調查、待決策事項，尚未指定修法或優先順序。處理時依 [SDD 流程](../.agents/skills/sdd/SKILL.md) 選擇 `change` 或 `plan`，需要計劃時才建立計劃文件。計劃建立後在對應項目連結，完成修復與驗證後移除已解決的內容；現行規則仍放在 [網站規格](specs/site.md)。

實測結果與程式碼觀察分別註明，不把待驗證的影響當成已確認缺陷。驗證方法與覆蓋範圍見 [手動驗收](../tests/manual/site.md)，每次執行結果記在 commit 說明與交付回報。

## 需求願景

暫無。

## 已確認問題

### Hash 與歷史還原

Chromium 實測發現以下導覽問題：

- 自然捲到 Projects、返回後再前進，可能停在首頁。
- 直接開 `#projects` 時，重掛載後區塊位置偏移，hash 也可能改成 `#about`。

後續需處理區塊導覽與歷史還原的一致性。相關情境仍保留手動驗收與失敗紀錄，不以停用測試算成通過。

相關規格：[SITE-R2.3、SITE-R2.4](specs/site.md#site-r2-區塊導覽與瀏覽器歷史)。

### 鍵盤與焦點

實測作品卡及 QR code opener 是不可用 Tab 到達的 div，開啟後焦點停在 body；作品關閉缺原生鍵盤入口，沒有焦點移入與還原。

後續需依設計方向補齊鍵盤操作與焦點行為。現有滑鼠測試不表示整體已符合可及性要求。

相關規格：[SITE-R7](specs/site.md#site-r7-作品選取與詳情)、[SITE-R9](specs/site.md#site-r9-qr-code-顯示與關閉)；方向依據：[Interaction and Motion](design.md#interaction-and-motion)。

### Reduced Motion

實測 reduce 下背景、頭像、打字、游標、技能輪播與 smooth scroll 仍運作。目前測試只覆蓋已存在的 Hero 入場與下滑提示停用分支。

後續需處理其餘動態效果，並依實際結果驗證 reduced-motion，不能把部分停用當成全面符合。

相關規格：[SITE-R13](specs/site.md#site-r13-動態與-reduced-motion)。

### 短螢幕裁切

實測 320 × 568 與 390 × 568，Hero 卡片裁掉部分社群與導覽。

後續需調整版面，讓重要操作在這些尺寸可達。修復前，這些尺寸的可達性不能回報為通過。

相關規格：[SITE-R12](specs/site.md#site-r12-響應式組成)。

### Leechai Fallback 文案

程式碼盤點發現原始作品資料的描述與兩份字典不一致，目前正常顯示使用字典，因此尚無證據顯示訪客在正常操作下看到錯誤內容。

後續需依確認過的內容來源處理 fallback 文案，不把錯誤資料寫成產品要求。

相關規格：[SITE-R7.5](specs/site.md#site-r7-作品選取與詳情)。

## 待調查與待決策

### 窄畫面履歷入口

程式在小於 720 px 隱藏公開匯出按鈕，390 × 844 實測相符。設計方向要求匯出容易找到，但尚未確認這個例外是否刻意保留。

後續需確認窄畫面的公開匯出方式。`/resume` 刻意不公開，不能藉由公開該頁面補救。

相關規格：[SITE-R10](specs/site.md#site-r10-履歷來源與列印入口)、[SITE-R1.3](specs/site.md#site-r1-頁面與公開範圍)。

### 英文履歷語意

程式碼盤點發現 ResumeSheet 沒有獨立 `lang=en`，會繼承全站所選 `html.lang`；對輔助工具的實際影響尚未驗證。

後續需確認英文履歷的語言標示與輔助工具行為，維持英文內容政策。

相關規格：[SITE-R10.4](specs/site.md#site-r10-履歷來源與列印入口)、[SITE-R11](specs/site.md#site-r11-pdf-內容與版面)。

### 隱藏履歷的焦點

程式碼盤點發現首頁 offscreen portal 使用 aria-hidden，但內含連結，未設定 inert；尚未完成全鍵盤路徑驗證。

後續需確認隱藏內容是否進入鍵盤焦點順序，再決定處理方式。

相關規格：[SITE-R10.5](specs/site.md#site-r10-履歷來源與列印入口)。

### 儲存被拒絕

Provider 沒有處理 localStorage getItem 或 setItem 的 exception。這種環境尚未實測，也沒有已確認的降級規則。

後續需模擬存取被拒絕，確認實際影響，再決定是否及如何支援降級；目前不得宣告已支援。

相關規格：[SITE-R3](specs/site.md#site-r3-初始語言選擇)、[SITE-R4](specs/site.md#site-r4-語言切換與持久化)。

### Zoom 與文字選取

程式碼盤點發現 public viewport 限制縮放，多數文字預設不可選取，部分內容另有例外。這些是實作觀察，尚未確認為產品或可及性方向。

後續需以真實裝置確認影響，再決定縮放與文字選取政策。

相關規格：[SITE-R12](specs/site.md#site-r12-響應式組成)；方向依據：[設計方向](design.md)。
