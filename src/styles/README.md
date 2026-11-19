# 網站樣式指南

產品與視覺方向見[設計文件](../../docs/design.md)，可觀察的行為見[網站規格](../../docs/specs/site.md)。

## 樣式放在哪裡

- 把全域螢幕與列印規則放在 [`index.scss`](index.scss) 和 [`print.scss`](print.scss)。履歷紙張的幾何與局部排版由 [ResumeSheet](../features/resume/ResumeSheet.module.scss) 維護，讓首頁樣式調整與 PDF 排版各自獨立。
- 在元件或頁面旁的 CSS Module 維護局部樣式。依 TSX 或 DOM 順序整理 root class 內的規則，將覆寫放在對應的父元素下。Selector 保持簡短，避免多餘巢狀。樣式優先寫在 Sass，必要時才用 inline style。
- Projects 與 Blog 用 [`_section.scss`](_section.scss) 共用容器、標題與內文尺度。兩者各自維護內部排版，讓 Home 可以直接組合各區塊。

## 選用與新增 Token

- 共用值放在 [`_tokens.scss`](_tokens.scss)，依基礎值、語意 token、元件設定分組。可比較的尺寸由小到大，中性色由淺到深。先定義基礎值，再定義衍生值。
- 依用途選 token。次要資訊用 `$text-muted`，品牌裝飾用 `$brand-accent`，填色操作配對 `$action-background` 和 `$text-on-fill`，淺底的操作文字及圖示用 `$action-foreground`。品牌裝飾與可操作文字各有對比需求。
- 用 `@use "../../styles/tokens" as _;` 載入 token，並依檔案位置調整相對路徑。媒體查詢使用 `$small`、`$medium`、`$large`、`$extra-large`。
- 只有用途相同的值才共用 token。圖片定位、裝飾漸層、局部陰影、光學微調與履歷列印尺寸留在使用處。同一元件有多處共用的幾何值時，在該使用範圍開頭定義基準及派生值。
- 新 token 以用途類別或元件名開頭，接屬性及角色、狀態或尺寸。例子可參考 `$font-family-body`、`$control-opacity-pressed` 及 `$hero-portrait-size-compact`。`line-height`、`z-index` 等固定屬性名稱維持原順序。

## 共用控制與焦點

- 依原生語意選控制。執行操作用 `Button`，前往網址或下載用 `ButtonLink`。外觀參數見[元件定義](../components/Button/Button.tsx)。
- `RoundButton` 用固定的相等寬高，因為 WebKit 可能把絕對定位的自動尺寸算成橢圓。QR code dialog 的關閉按鈕用 `controls.centered-target` 置中，固定寬高由 dialog 維護。
- Tooltip 的定位像素值與 Sass 外觀共用 token。把 `aria-hidden` 留在提示文字的內層，因為 `aria-describedby` 直接參照的隱藏外層仍可能被讀成描述。修改時比對開啟前後的 accessible name 與 description。 [Tooltip 元件](../components/Tooltip/Tooltip.tsx)
- 依焦點框相鄰的背景選色。一般控制用標準外距，文章卡片與作品面板用較寬的外距，滿版目的地使用內框，避免側邊框線移出視窗。 [焦點規格](../../docs/specs/site.md#site-r18-一致的鍵盤焦點外觀) · [焦點 Mixin](_focus.scss)
- 相鄰文字已提供公司名稱時，Logo 使用空 `alt`。圖示按鈕由控制提供 accessible name。獨立傳達資訊的 SVG 須具圖片語意與名稱。

## 修改後的驗證

調整 scroll motion 的 Sass 參數時，執行 `npm run test:unit -- src/motion/parameters.test.ts`，檢查 Sass 的輸出能否由 TypeScript 讀取。 [Scroll Motion 的讀寫約定](../../docs/architecture.md#section-navigation-and-scroll-motion)

依[驗證指南](../../docs/verification.md)選擇檢查。共用樣式先對照雙語桌面與窄版，然後依影響範圍檢查焦點、減少動態、QR code、About 靜態版面和單頁 A4 履歷。 [手動驗收](../../tests/manual/site.md)
