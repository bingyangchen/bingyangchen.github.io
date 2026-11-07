# Resume CJK font

`noto-serif-tc.woff2` is a static 700-weight Noto Serif TC subset derived from Google Fonts (v37), licensed under `public/fonts/OFL-NotoSerifTC.txt` (published as `/fonts/OFL-NotoSerifTC.txt`).

The Chinese characters are limited to 陳、秉、洋 (U+9673, U+79C9, U+6D0B). Only the Chinese name uses this font, in bold. Role separators and list markers use Georgia. Update both the subset and its CSS unicode range when adding CJK characters to the resume.

The variable source has a default weight of 200 and the PostScript name `NotoSerifTC-ExtraLight`. Linux Chromium retains that name in PDFs even when rendering weight 700, while macOS reports the bold instance. This file pins weight 700 and uses the PostScript name `NotoSerifTC-Bold`, keeping the PDF font check consistent across platforms without changing the bold glyphs.

Source CSS: <https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;700&text=%E9%99%B3%E7%A7%89%E6%B4%8B>

Variable source URL: <https://fonts.gstatic.com/l/font?kit=XLYgIZb5bJNDGYxLBibeHZ0BhnIcRJ_YwSWokJYLwA&skey=dafe25338141b30f&v=v37>

Variable source SHA-256: `1cca2a757794276dcaa80633e7c7d722853beebdbded036cfd4d57cf15824d2a`

Bundled static font SHA-256: `0605bcfea99bc089d890c4152b6f41e1ca08a48d499b48a287d01c9eb72caa4a`

Upstream font copyright: (c) 2017–2024 Adobe (<http://www.adobe.com/>).

To regenerate from the repository root, use FontTools 4.68.0. Set the typographic family name before instancing so the source's legacy `ExtraLight` family suffix is not retained in the bold name. Preserve the source timestamp for repeatable output. This is a maintenance command; CI uses the bundled WOFF2 directly.

```sh
uv run --no-project --with 'fonttools[woff]==4.68.0' python - <<'PY'
from hashlib import sha256
from io import BytesIO
from urllib.request import urlopen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

source = urlopen("https://fonts.gstatic.com/l/font?kit=XLYgIZb5bJNDGYxLBibeHZ0BhnIcRJ_YwSWokJYLwA&skey=dafe25338141b30f&v=v37", timeout=30).read()
assert sha256(source).hexdigest() == "1cca2a757794276dcaa80633e7c7d722853beebdbded036cfd4d57cf15824d2a"
font = TTFont(BytesIO(source), recalcTimestamp=False)
for record in list(font["name"].names):
    if record.nameID == 1:
        font["name"].setName("Noto Serif TC", 16, record.platformID, record.platEncID, record.langID)
bold = instantiateVariableFont(font, {"wght": 700}, updateFontNames=True, static=True)
assert bold["name"].getDebugName(6) == "NotoSerifTC-Bold"
bold.flavor = "woff2"
bold.save("src/assets/fonts/noto-serif-tc.woff2")
PY
```
