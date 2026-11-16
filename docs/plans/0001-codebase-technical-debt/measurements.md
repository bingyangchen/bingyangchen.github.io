# 計劃 0001：量測方法

本附件提供 [TD-26](../0001-codebase-technical-debt.md) 既有數據的重現入口。從 repo 根目錄執行，依 [README](../../../README.md) 準備相容的 Node、npm、套件、Playwright Chromium 與 PDF 字型。命令使用工作目錄內的程式，輸出 runtime、commit 及 lockfile hash；既有數據的程式基準為 `c63814bba8d8914139eb4faba84e6184c9730be0`，Node 為 24.21.0、Vite 為 8.3.6。

要比較既有數字，來源程式、lockfile、runtime、瀏覽器及作業系統應與原本條件一致。工作目錄有修改時，commit 只標示起點，需一併保存當時的 diff。以下量測保留目前程式，build 與暫存輸出由命令產生；修改後重新量測的結果不必與舊數字相同。

## 履歷 Route 分割

以下命令以相同 Vite 設定在 OS 暫存目錄分別 build 原本與 lazy route 版本；lazy route 版本只透過 transform 改寫 router 的 import 與 Resume element。若 router 已改變而無法套用實驗，命令會失敗，避免把沒有分割的輸出當成實驗結果。

初始資源取自各次 build 的 HTML 所列 module script、modulepreload 與 stylesheet，對每個檔案分別使用 `gzipSync` 預設設定後加總。實際瀏覽器請求需另行確認；此命令沒有執行實驗版本的 prerender 或 PDF 流程。

```sh
node --input-type=module <<'NODE'
import { JSDOM } from 'jsdom';
import { build, version as viteVersion } from 'vite';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const temporary = await mkdtemp(join(tmpdir(), 'td26-bundle-comparison-'));
try {
  const baseline = join(temporary, 'baseline');
  const lazyRoute = join(temporary, 'lazy-route');
  await build({ logLevel: 'error', build: { outDir: baseline } });
  let transformed = false;
  await build({
    logLevel: 'error',
    plugins: [{
      name: 'measure-lazy-resume',
      enforce: 'pre',
      transform(source, id) {
        if (!id.endsWith('/src/router.tsx')) return;
        const importStatement = 'import Resume from "./features/resume";';
        const routeElement = 'element={<Resume />}';
        if (source.split(importStatement).length !== 2 || source.split(routeElement).length !== 2) {
          throw new Error('Router changed; update the measurement transform before comparing');
        }
        transformed = true;
        return source
          .replace(importStatement, 'import { lazy, Suspense } from "react";\nconst Resume = lazy(() => import("./features/resume"));')
          .replace(routeElement, 'element={<Suspense fallback={null}><Resume /></Suspense>}');
      },
    }],
    build: { outDir: lazyRoute },
  });
  if (!transformed) throw new Error('Router transform did not run');

  async function measureInitialAssets(directory) {
    const dom = new JSDOM(await readFile(join(directory, 'index.html'), 'utf8'));
    const resources = new Set([...dom.window.document.querySelectorAll(
      'script[type="module"][src], link[rel="modulepreload"][href], link[rel="stylesheet"][href]',
    )].map((element) => element.getAttribute('src') ?? element.getAttribute('href')));
    dom.window.close();
    const totals = { javascriptGzipBytes: 0, cssGzipBytes: 0 };
    const files = [];
    for (const resource of resources) {
      const pathname = new URL(resource, 'https://measurement.invalid').pathname;
      const source = await readFile(join(directory, pathname.replace(/^\//, '')));
      const gzipBytes = gzipSync(source).length;
      if (pathname.endsWith('.js')) totals.javascriptGzipBytes += gzipBytes;
      else if (pathname.endsWith('.css')) totals.cssGzipBytes += gzipBytes;
      else throw new Error(`Unexpected initial asset: ${resource}`);
      files.push({ resource, bytes: source.length, gzipBytes });
    }
    if (!files.length) throw new Error('No initial assets found');
    return { ...totals, files };
  }
  const before = await measureInitialAssets(baseline);
  const after = await measureInitialAssets(lazyRoute);
  console.log(JSON.stringify({
    node: process.version,
    vite: viteVersion,
    platform: `${process.platform}/${process.arch}`,
    commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    lockfileSha256: createHash('sha256').update(await readFile('package-lock.json')).digest('hex'),
    before,
    after,
    savedGzipBytes: before.javascriptGzipBytes + before.cssGzipBytes
      - after.javascriptGzipBytes - after.cssGzipBytes,
  }, null, 2));
} finally {
  await rm(temporary, { recursive: true, force: true });
}
NODE
```

原本結果是 JavaScript 減少 1570 bytes、CSS 減少 1110 bytes。HTML 之外的 runtime 載入、字型請求與載入時間不在這組 gzip 加總內；量測不等於完成 TD-26 的預覽、PDF 與載入失敗驗收。
