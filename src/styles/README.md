# 網站 Design System

這個 design system 維護網站共用的視覺規則與互動 patterns，設計方向以 [設計文件](../../docs/design.md) 為準，使用者可觀察到的行為以 [網站規格](../../docs/specs/site.md) 為準。

## 檔案分工

<!-- prettier-ignore -->
| 位置 | 負責的內容 |
| --- | --- |
| [`_tokens.scss`](_tokens.scss) | 定義共用 token，供全域樣式與 CSS Modules 使用。 |
| [`_section.scss`](_section.scss) | 定義 Projects 與 Blog 共用的容器、標題、正文、metadata 與 action patterns。 |
| [`_controls.scss`](_controls.scss) | 定義控制文字不可選取的規則，以及圖示與文字控制共用的置中、最小操作範圍。 |
| [`_focus.scss`](_focus.scss) | 定義全站 focus 預設值，以及滿版目標的內框處理方式。 |
| [`_motion.scss`](_motion.scss) | 定義 reduced motion 的全域處理，以及 scroll motion 的參數與 transform 套用方式。 |
| [`index.scss`](index.scss) | 套用全域基礎樣式，並各套用一次 focus 與 reduced motion 預設值。 |
| 元件旁的 `*.module.scss` | 定義元件外觀、狀態與 responsive layout，並使用共用 token 和 patterns。 |
| [`print.scss`](print.scss) 與 [`ResumeSheet.module.scss`](../features/resume/ResumeSheet.module.scss) | 維護 A4 列印尺寸、履歷字型、頁面範圍與專用排版。 |

以底線開頭的檔案是 Sass partial，由其他 SCSS 透過 `@use` 載入。目前的 partial 定義 token 與 mixin，載入本身不會產生全域 CSS。`index.scss` 與 `print.scss` 則是由 `src/index.tsx` 載入的 CSS 入口。

## 功能樣式的作用範圍

[`SiteLayout.module.scss`](../layouts/SiteLayout/SiteLayout.module.scss) 維護共用外框的排列、背景及主要內容的焦點樣式。

[`Home.module.scss`](../pages/Home/Home.module.scss) 只維護整頁 motion scope、區塊高度、交錯背景及 anchor 焦點，不透過 `h2`、`h3` 或其他內容 selector 設定子功能的外觀。[`features/home`](../features/home/index.ts) 的 Hero、About、Portrait 與 QrCodeDialog 各自維護 CSS Module；About 的標題、subtitle、分隔線及內容間距跟隨 About，頭像及 dialog 的狀態外觀跟隨各自的互動實作。

[`Projects`](../features/projects/Projects.module.scss) 與 [`Blog`](../features/blog/Blog.module.scss) 沿用 `section` patterns，內部標題、正文與留白在相同寬度及字型下不依賴 Home 的父層規則。新增功能樣式時，將規則放在負責功能的 root class 內，依 DOM 順序排列；需要共用時，依相同用途擴充既有 pattern，避免重新加入頁面對子功能的內容 selector。

## Token 的用途

新共用值放在 `_tokens.scss`，依基礎值、語意 token、元件設定的順序分組，並將依賴的值定義在派生值之前。

<!-- prettier-ignore -->
| 分組 | 放入的內容 |
| --- | --- |
| 基礎值 | 定義 palette、基礎字級、間距刻度與 breakpoints。中性色由淺到深排列，可比較的尺寸由小到大排列。 |
| 語意 token | 定義文字、背景、邊框、字型、字級、容器留白、操作尺寸、圓角與共用 motion 的用途。 |
| 元件設定 | 依共用控制與網站區域分組，維護 Focus、Button、Tooltip、Header、Hero、QR code dialog、Projects、Blog、Footer 及 scroll motion 的設定。 |

間距刻度、breakpoints、字級與共用 motion 時間由小到大排列，不同元件的時間留在各自的設定群組。Palette 使用 `$neutral-*` 與 `$olive-*`，數字越大代表顏色越深，只表示明暗順序，不代表色值的計算公式。`$black-translucent` 保留半透明黑色值；文字、背景與操作則透過 `$text-*`、`$surface-*`、`$action-*` 指定用途。

語意 token 依文字、品牌與操作、背景與邊框、字型、間距、控制、圓角、motion 排列。名稱以用途類別或所屬元件開頭，再寫屬性，最後寫角色、狀態或尺寸變體，例如 `$font-family-body`、`$control-opacity-pressed`、`$hero-card-width-portrait`。固定的 CSS 屬性名稱保留原順序，例如 `line-height` 與 `z-index`；既有 `$small`、`$medium`、`$large`、`$extra-large` 保留為 breakpoint 名稱。

新增 token 時依以下用途選擇分組。

<!-- prettier-ignore -->
| 用途 | 選用方式 |
| --- | --- |
| 文字與背景 | 依角色選用 `$text-*`、`$surface-*` 與 `$border-default`。裝飾與陰影可使用 palette，品牌色的透明變化沿用 `$brand-accent`，例如 `rgba(_.$brand-accent, 0.2)`。 |
| 品牌與操作 | 一般品牌裝飾使用 `$brand-accent`；填色操作使用 `$action-background` 與 `$text-on-fill`，淺底操作文字及圖示使用 `$action-foreground`。 |
| 字型與字級 | 使用 `$font-family-body`、`$font-family-heading`、`$font-family-resume` 與 `$font-size-*`。各區塊的大標題比例由對應 pattern 或局部樣式維護。 |
| 間距 | 常規 padding、margin 與 gap 使用已定義的 `$space-*` 刻度，刻度數字乘以 4 為像素值。Header 與內容容器的水平留白使用 `$content-padding-desktop`、`$content-padding-tablet`、`$content-padding-compact`。 |
| 控制與圓角 | 使用 `$control-size-minimum`、`$control-size-comfortable`、`$radius-*` 與 `$button-radius`。Tooltip 使用自己的 `$tooltip-*` token。 |
| 操作回饋與連結底線 | Header 選單、導覽連結及語言控制的按下透明度使用 `$control-opacity-pressed`；一般操作連結的底線間距使用 `$link-underline-offset`。 |
| Responsive layout | 使用 `$small`、`$medium`、`$large` 與 `$extra-large`，保留元件在各 breakpoint 的既有構圖。 |
| Motion | 共用回饋、箭頭與揭露效果使用 `$motion-duration-*`，元件專用時間使用各元件的 `*-motion-duration`；共用 easing 使用 `$motion-easing-emphasized`。Scroll motion 的參數集中在 `$scroll-motion`，窄版覆寫以 `-compact` 結尾並保留被覆寫的參數名稱。 |
| Focus | 使用 `$focus-color-*`、`$focus-ring-width` 與兩種 offset；區域透過 `--focus-color` 指定焦點色。 |

日期、公司、技能與履歷的次要資訊使用 `$text-muted`，保留與正文的明暗層次；選色採用在既有白色與淺灰背景均達到至少 4.5：1 的最淺一般十六進位灰階。`$text-secondary` 保留既有較深的文字角色，分隔線使用 `$border-default` 或對應元件的裝飾色。品牌按鈕使用獨立的 `$action-background` 橄欖綠底與 `$text-on-fill` 白字，與頭像的色調協調。履歷下載文字使用正文 UI 字級、600 字重與正常字距，淺底的文字與操作圖示在 hover 時使用 `$action-foreground`，保留淺橄欖色作為背景及裝飾。

相同數值只有在用途相同時才共用。圖片定位、裝飾漸層、局部陰影、光學微調，以及履歷列印的尺寸與字級保留在使用處，避免首頁的間距或字級調整改變 PDF 排版。Footer 的聯絡標題使用 Projects、Blog 共用的 `section.title`，保留深底文字色；說明、Email、平台、作者識別與版權使用 UI 字型，履歷保留專用字型。Footer 使用獨立的 `$footer-text-secondary` 與 `$footer-divider-color`，分開次要文字及裝飾分隔線。

同一元件內需要同步修改的幾何值使用局部 Sass 變數。WorkExperience 的圓點尺寸與日期列最小高度共用 `$marker-size`、`$marker-size-compact`，將對齊關係保留在元件內。局部變數放在使用範圍的開頭，先定義基準，再定義變體及派生值。新增共用 token 前先查既有使用處，移除已無引用的 token，改名時同步更新使用處及文件。

圓形按鈕、頭像與工作經歷圓點使用 `$radius-circle`，膠囊使用 `$radius-pill`。Button 的 hover 遮罩繼承按鈕本體的圓角，尺寸由各自的 `size` 規則設定。RoundButton 維護基礎 padding，頭像上的 QR code 入口只保留桌面構圖所需的 padding 調整。QR code dialog 的關閉按鈕沿用 `controls.centered-target`，固定寬高仍由 dialog 維護。

`controls.centered-target` 同時供圖示與文字控制使用，維護置中及最小寬高，不設定 padding、外觀或固定尺寸。

Header 的標誌、選單與導覽各自保留對齊及寬度規則，不套用 Button 的尺寸。Footer Email 與署名連結的底線間距依各自字級及構圖維護，不跟一般操作連結一起調整。

Scroll motion 的距離 token 使用 `px`，Hero 傾斜使用 `deg`，進度、比例與縮放使用無單位數值。`perspective` 保留 CSS 長度，由 transform 直接使用；其他參數的名稱與單位由 [`parameters.ts`](../motion/parameters.ts) 驗證。驗證失敗時，`useScrollMotion` 會停止當次更新、清除動態樣式並釋放瀏覽器資源。

調整 `$scroll-motion` 或 compact token 時，一併執行 `src/motion/parameters.test.ts`，確認實際 Sass 輸出與 TypeScript 的參數約定一致。參數只在重新量測時讀取，純計算使用已驗證的數值；所有計算完成後才寫入樣式，避免在寫入期間讀取 computed style。

```scss
@use "../../styles/tokens" as _;
@use "../../styles/section";

.main {
  @include section.container;

  .title {
    @include section.title;
  }

  .content {
    margin-top: _.$space-6;
    color: _.$text-secondary;
  }
}
```

## 共用元件

[`Button` 與 `ButtonLink`](../components/Button/Button.tsx) 共用一份 CSS Module 與外觀參數。執行操作時用 `Button`，前往網址或下載檔案時用 `ButtonLink`，讓瀏覽器保留按鈕、連結與下載的原生行為。

<!-- prettier-ignore -->
| 參數 | 支援的值與用途 |
| --- | --- |
| `variant` | 使用 `primary` 或 `brand`，預設為 `primary`。 |
| `size` | 使用 `large` 或 `extra-large`，預設為 `large`。 |
| `bold` | 指定是否使用粗體，預設為 `false`。 |
| `className` | 加入使用處的局部版面樣式。 |
| 原生屬性 | `Button` 接受 button 屬性，`type` 預設為 `button`；`ButtonLink` 接受 anchor 屬性，並要求提供 `href`。 |

```tsx
<Button onClick={handleDownloadPdf}>Download PDF</Button>

<ButtonLink
  variant="brand"
  size="extra-large"
  bold
  href="/resume.pdf"
  download="Bing-Yang Chen - 陳秉洋.pdf"
>
  Download Resume
</ButtonLink>
```

[`RoundButton`](../components/RoundButton/RoundButton.tsx) 用於執行操作的 icon button，`hintText` 同時提供 accessible name 與 tooltip 文字。[`Tooltip`](../components/Tooltip/Tooltip.tsx) 封裝 Radix Tooltip，讓 Escape 關閉、跨過間距的 hover 與視窗邊緣定位由同一套互動處理，控制本身仍須提供 accessible name。提示立即顯示，優先放在入口下方，必要時平移或翻轉位置；提示以 portal 放在 body，開啟 QR code dialog 時收起入口提示。

Tooltip 另外記錄鍵盤聚焦入口時的開啟狀態；入口仍有焦點時，即使 Radix 因游標離開或捲動而關閉提示，仍會維持提示顯示。按 Escape、啟用控制、點擊外部或移開焦點時，Tooltip 會清除此狀態。

Tooltip 保留 `$tooltip-*` 外觀 token，定位 API 所需的像素值由 CSS Module 的 `:export` 讀取同一份 token。提示文字僅供視覺使用，文字節點設為 `aria-hidden`，讓 Radix 加入的描述不重複控制名稱，原有 description 繼續保留。不要把 `aria-hidden` 改放在被 `aria-describedby` 直接參照的外層，因為被直接參照的隱藏內容仍可能成為描述。修改時須比較 accessibility tree 中開啟前後的 name 與 description。

共用元件與樣式依以下規則套用：

- 一般連結與填色按鈕沿用所屬區域的 focus 色。
- 文章卡片及作品展示區使用較寬的 surface offset。
- 滿版導覽目標使用 `focus.inset-outline`。
- `controls.unselectable` 只套用在控制與操作文字，正文保持可選取。
- 局部 hover 位移與 scroll motion 須遵守 reduced motion 設定。

## 圖片與圖示語意

公司 logo、技能圖示及校名圖片已有相鄰文字提供完整資訊，使用空 `alt`；具獨立資訊的圖片由使用處提供相符的替代文字。沿用 [W3C 裝飾圖片指引](https://www.w3.org/WAI/tutorials/images/decorative/) 判斷資訊用途，不以圖片格式決定是否隱藏，也不在共用 `BrandImage` 強制清空 `alt`。

Safari 的實際 accessibility tree 在技能圖片使用空 `alt` 後，仍會列出外部 SVG 內的 `role`、`aria-label` 或 `title`。`Skill` 因此另以 `aria-hidden=true` 隱藏裝飾圖片，保留相鄰技能名稱；SVG 素材保留原有資訊，供其他用途使用。

[`asIcon`](../icons/IconLayout.tsx) 集中 SVG 外框設定，現有使用處均為裝飾用途，因此預設 `aria-hidden=true`，按鈕及連結提供自己的 accessible name。保留明確指定 `aria-hidden` 的能力；需要獨立表達資訊的 SVG 須另行提供 image 語意與名稱，不能只取消隱藏。人物照片的替代文字與 QR code 的內容仍由各自功能維護。

## 修改後的驗證

修改後執行 `npm run check`，其中包含 production build、瀏覽器互動與履歷 PDF 檢查，並依修改範圍補做以下檢查：

- 調整共用樣式時，對照修改前後的桌面與窄版畫面、兩種語言、QR code dialog、focus 與 reduced motion 狀態。
- 涉及履歷時，檢查預覽與匯出的單頁 A4 PDF。
