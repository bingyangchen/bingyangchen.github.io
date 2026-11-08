# 網站 Design System

這個 design system 維護網站共用的視覺規則與互動 patterns，設計方向以 [設計文件](../../docs/design.md) 為準，使用者可觀察到的行為以 [網站規格](../../docs/specs/site.md) 為準。

## 檔案分工

<!-- prettier-ignore -->
| 位置 | 負責的內容 |
| --- | --- |
| [`_tokens.scss`](_tokens.scss) | 定義共用 token，供全域樣式與 CSS Modules 使用。 |
| [`_section.scss`](_section.scss) | 定義 Projects 與 Blog 共用的容器、標題、正文、metadata 與 action patterns。 |
| [`_controls.scss`](_controls.scss) | 定義控制文字不可選取的規則，以及 icon control 的置中與最小操作範圍。 |
| [`_focus.scss`](_focus.scss) | 定義全站 focus 預設值，以及滿版目標的內框處理方式。 |
| [`_motion.scss`](_motion.scss) | 定義 reduced motion 的全域處理，以及 scroll motion 的參數與 transform 套用方式。 |
| [`index.scss`](index.scss) | 套用全域基礎樣式，並各套用一次 focus 與 reduced motion 預設值。 |
| 元件旁的 `*.module.scss` | 定義元件外觀、狀態與 responsive layout，並使用共用 token 和 patterns。 |
| [`print.scss`](print.scss) 與 [`ResumeSheet.module.scss`](../pages/Main/Resume/ResumeSheet.module.scss) | 維護 A4 列印尺寸、履歷字型、頁面範圍與專用排版。 |

以底線開頭的檔案是 Sass partial，由其他 SCSS 透過 `@use` 載入。目前的 partial 定義 token 與 mixin，載入本身不會產生全域 CSS。`index.scss` 與 `print.scss` 則是由 `src/index.tsx` 載入的 CSS 入口。

## Token 的用途

新共用值放在 `_tokens.scss`，依基礎值、語意 token、元件設定的順序分組，並將依賴的值定義在派生值之前。

<!-- prettier-ignore -->
| 分組 | 放入的內容 |
| --- | --- |
| 基礎值 | 定義 palette、基礎字級、間距刻度與 breakpoints。中性色由淺到深排列，可比較的尺寸由小到大排列。 |
| 語意 token | 定義文字、背景、邊框、字型、字級、容器留白、操作尺寸、圓角與共用 motion 的用途。 |
| 元件設定 | 依共用控制與網站區域分組，維護 Focus、Button、Tooltip、外連箭頭、Header、Hero 與 dialog、Projects、Blog、履歷及 scroll motion 的設定。 |

間距刻度、breakpoints、字級與同一用途的時間值由小到大排列。Palette 中的 `$charcoal` 與 `$muted-gray` 描述顏色，文字與背景則透過 `$text-*` 和 `$surface-*` 指定用途。新增 token 時依以下用途選擇分組。

<!-- prettier-ignore -->
| 用途 | 選用方式 |
| --- | --- |
| 文字與背景 | 依角色選用 `$text-*`、`$surface-*` 與 `$border-default`。品牌色與透明色的局部變化使用既有 palette，例如 `rgba(_.$brand-olive, 0.2)`。 |
| 字型與字級 | 使用 `$body-font-family`、`$heading-font-family`、`$resume-font-family` 與 `$font-size-*`。各區塊的大標題比例由對應 pattern 或局部樣式維護。 |
| 間距 | 常規 padding、margin 與 gap 使用已定義的 `$space-*` 刻度，刻度數字乘以 4 為像素值。Header 與內容容器的水平留白使用 `$desktop-content-padding`、`$tablet-content-padding`、`$compact-content-padding`。 |
| 控制與圓角 | 使用 `$minimum-control-size`、`$comfortable-control-size`、`$radius-*` 與 `$button-radius`。Tooltip 使用自己的 `$tooltip-*` token。 |
| Responsive layout | 使用 `$small`、`$medium`、`$large` 與 `$extra-large`，保留元件在各 breakpoint 的既有構圖。 |
| Motion | 依用途選用 `$motion-duration-*` 與 `$motion-easing-emphasized`。Scroll motion 的參數集中在 `$scroll-motion` 及其 compact token。 |
| Focus | 使用 `$focus-color-*`、`$focus-ring-width` 與兩種 offset；區域透過 `--focus-color` 指定焦點色。 |

日期、公司、技能與履歷的次要資訊使用 `$text-muted`，保留與正文的明暗層次；選色採用在既有白色與淺灰背景均達到至少 4.5：1 的最淺一般十六進位灰階。`$text-secondary` 保留既有較深的文字角色，`$gray` 只供分隔線等裝飾使用。品牌按鈕使用獨立的 `$brand-olive-action` 橄欖綠底與 `$text-on-fill` 白字，與頭像的色調協調。履歷下載文字使用正文 UI 字級、600 字重與正常字距，淺底的文字與操作圖示在 hover 時使用 `$brand-olive-ink`，保留淺橄欖色作為背景及裝飾。

相同數值只有在用途相同時才共用。圖片定位、裝飾漸層、局部陰影、光學微調，以及履歷列印的尺寸與字級保留在使用處，避免首頁的間距或字級調整改變 PDF 排版。Footer 與標題共用字型，履歷保留專用字型。

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

[`RoundButton`](../components/RoundButton/RoundButton.tsx) 用於執行操作的 icon button，`hintText` 同時提供 accessible name 與 tooltip 文字。[`Tooltip`](../components/Tooltip/Tooltip.tsx) 為既有控制加入 hover 與鍵盤 focus 提示，控制本身仍須提供 accessible name。

共用元件與樣式依以下規則套用：

- 一般連結與填色按鈕沿用所屬區域的 focus 色。
- 文章卡片及作品展示區使用較寬的 surface offset。
- 滿版導覽目標使用 `focus.inset-outline`。
- `controls.unselectable` 只套用在控制與操作文字，正文保持可選取。
- 局部 hover 位移與 scroll motion 須遵守 reduced motion 設定。

## 修改後的驗證

修改後執行 `npm run check`，其中包含 production build、瀏覽器互動與履歷 PDF 檢查，並依修改範圍補做以下檢查：

- 調整共用樣式時，對照修改前後的桌面與窄版畫面、兩種語言、QR code dialog、focus 與 reduced motion 狀態。
- 涉及履歷時，檢查預覽與匯出的單頁 A4 PDF。
