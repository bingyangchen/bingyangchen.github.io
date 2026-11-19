# 更新圖片與檢查載入

## 頭像、作品截圖與 Logo

更新原圖後，備妥 `cwebp`、`dwebp` 及下節的社群預覽原圖，再執行 `npm run images:generate`。提交產生的縮圖，供一般開發與 build 直接使用。各尺寸、原圖與編碼設定以[產生腳本](../scripts/generate-images.mts)為準。

換 Logo 時，從向量原檔更新 `src/assets/logo.webp`、`public/logo.webp` 與 `public/favicon.ico`，保留透明底與純黑的可見像素。兩份 WebP 保持一致，並讓 manifest 符合公開 WebP 的格式及尺寸。產生腳本只從素材目錄的 WebP 產生縮圖。 [向量原檔](../src/assets/logo.svg) · [Manifest 來源](../src/siteMetadata.ts)

## 社群預覽圖

先把原圖放在 `design/cover-source.png`，再執行整批產生，因為腳本會先寫入其他縮圖。沿用目前的社群圖時，可從縮圖前的 commit 取出原圖。用 libwebp 1.6.0 重新產生的 PNG 與目前的發布版本相同。 [發布用 PNG](../public/cover.png)

```sh
cover_source_ref=96b1e888870f95c3b92c37a2a3a26f031b5bc088:public/cover.png
git cat-file -e "$cover_source_ref" &&
  mkdir -p design &&
  (set -C; git show "$cover_source_ref" > design/cover-source.png)
```

命令會保護已有的原圖。更換社群圖時，在該路徑放新原圖。

## About 照片

從攝影原檔產生各尺寸的 WebP，保留構圖與比例。依衍生圖旁的 JSON 更新原圖與編碼紀錄，並同步檢查資料內的尺寸、兩份字典的替代文字及列印畫面。 [原圖](../src/assets/about/photography/) · [衍生圖與設定](../src/assets/about/web/) · [照片資料](../src/data/about.ts)

## 載入與預算

窄版的第二張 App 圖片要在 `picture` 切換來源，因為單用 CSS 隱藏仍可能送出 request。讓媒體查詢和顯示規則共用 breakpoint。作品大圖的 `sizes` 採構圖上限，避免版面穩定前多下載一張。 [作品圖片](../src/features/projects/ProjectImage.tsx)

產生腳本會逐一檢查頭像與作品縮圖的檔案大小。更換圖片後目視檢查桌面與窄版，並用新 build 跑[圖片測試](../tests/browser/images.spec.ts)，確認初始載入、內嵌成本及延後下載符合預算。

```sh
npm run build
npm run test:browser -- --project=chromium tests/browser/images.spec.ts
```

圖片預算使用 Resource Timing 的 `decodedBodySize`。內嵌圖則計入 JS 與 HTML 預算。調整預算時，記錄同條件下的差異與原因。 [歷史量測與預算理由](https://github.com/bingyangchen/bingyangchen.github.io/blob/c7c61138274b25f205697bf5be707eb9cf622e4f/docs/image-assets.md#量測紀錄)
