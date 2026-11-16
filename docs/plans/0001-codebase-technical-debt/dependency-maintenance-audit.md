# TD-22：依賴維護能力盤點

本附件記錄[計劃 0001](../0001-codebase-technical-debt.md#td-22補足依賴安全更新) 的查核證據。盤點日期為 2026-11-15（Asia/Taipei），只讀取 GitHub API、設定頁及 repo 檔案，沒有修改程式碼、workflow、依賴或 GitHub 設定。

## 查核基準

<!-- prettier-ignore -->
| 項目 | 當次基準 |
| --- | --- |
| Repo | [bingyangchen/bingyangchen.github.io](https://github.com/bingyangchen/bingyangchen.github.io)，public，預設分支為 main。 |
| 本機 HEAD | `24e9c1a4fb7ce20e13ff8ab438797502727cb478`。 |
| 遠端 main | `f4dd9e74fe868d85e9b79ebc72d014e08a680bcd`。 |
| Lockfile | `lockfileVersion` 為 2，Git blob 為 `624ee049f461e25f2e8f4ac4d5ab931587f8ca16`，本機與遠端一致。 |
| Lockfile SHA-256 | `ba7fc94e724ed393ec4ed64d816f1549877b83ed907797f5bed6ab7ef5d8af80`。 |
| 部署 workflow | Git blob 為 `2b22c361f3da78d13592f4f8ec2c58c43587827a`，本機與遠端一致。 |
| 本機工具 | Node 24.21.0、npm 11.19.0。盤點沒有選定或變更專案版本。 |

本機 HEAD 與遠端 main 的 commit 不同，因此只對已核對相同 blob 的 lockfile 與部署 workflow 做一致性判斷，不把本機 HEAD 當成遠端服務的掃描版本。

## 已確認的能力

<!-- prettier-ignore -->
| 能力 | 實際結果與證據 | 維護入口 |
| --- | --- | --- |
| Dependency graph | GraphQL 列出 `package.json`、`package-lock.json` 及部署 workflow，均為可解析且未超過大小限制。REST SBOM 有 488 組不同 npm 套件名稱與版本，與 lockfile 的 491 筆安裝路徑去除重複後完全一致；兩邊集合的差集均為空。 | [Dependency graph](https://github.com/bingyangchen/bingyangchen.github.io/network/dependencies)。 |
| 傳遞依賴 | SBOM 有 967 個 `DEPENDS_ON` 關係；例如 repo 引入 `eslint@9.39.5`，再引入 `minimatch@3.1.5`。這是引入鏈範例，不是目前存在漏洞的判斷。 | Dependency graph 或 SBOM 的套件及關係。 |
| 安全警示 | `GET /repos/bingyangchen/bingyangchen.github.io/vulnerability-alerts` 回傳 HTTP 204，確認已啟用。分頁列舉取得 192 筆，全部為 fixed；另用 `state=open` 取得 0 筆。 | [Dependabot alerts](https://github.com/bingyangchen/bingyangchen.github.io/security/dependabot)。 |
| 公告判讀 | 歷史警示 [#69](https://github.com/bingyangchen/bingyangchen.github.io/security/dependabot/69) 提供 minimatch 的公告、high 嚴重度、`package-lock.json` 來源、傳遞依賴關係、受影響範圍及首個修正版本。 | 警示詳情搭配 Dependency graph。 |
| 自動安全更新 | `GET /repos/bingyangchen/bingyangchen.github.io/automated-security-fixes` 回傳 HTTP 200，`enabled` 為 true，`paused` 為 false；repo metadata 的 `allow_auto_merge` 為 false。警示與安全更新是分開的設定。 | [Repo Code security 設定](https://github.com/bingyangchen/bingyangchen.github.io/settings/security_analysis)及 [Dependabot Updates](https://github.com/bingyangchen/bingyangchen.github.io/actions/workflows/dependabot/dependabot-updates)。 |
| Repo 訂閱 | 以維護者帳號開啟 repo，Watch 控制顯示 `Unwatch: All Activity`。 | Repo 的 Watch 控制。 |
| 帳號通知 | 維護者的 Dependabot 新漏洞通知選中 Email、CLI，未選 On GitHub；email digest 顯示 `Don't send`。一般 Watching 通知選用 On GitHub 與 Email。 | [Notification settings](https://github.com/settings/notifications)，需以維護者登入。 |

SBOM 的 495 個套件節點另含 6 個 GitHub Actions 與 1 個 repo 節點，不能全部當成 npm 套件數。GraphQL 查詢只用於確認 manifest 辨識；本次套件涵蓋情況以 SBOM 與 lockfile 的實際集合比對為準，不以該次查詢的 `dependenciesCount` 為 0 推論沒有依賴。

## 過時版本報告的查核

遠端目前有 Deploy、Dependabot Updates、pages-build-deployment 三個 active workflows；API 保留的 185 筆執行紀錄涵蓋 2025-11-26 到 2026-11-15，其中 Deploy 有 55 筆、Dependabot Updates 有 119 筆、Pages 有 11 筆，事件只有 push 與 dynamic。

遠端 `.github/` 只有 workflows 目錄，沒有 Dependabot 或 Renovate 設定；本機 package scripts 及部署 workflow 沒有 `npm outdated`、定期安全查詢或 schedule。遠端 main 的兩個 check runs 都來自 GitHub Actions，webhooks 清單為空，README 也沒有外部版本報告入口。因此本次查核未找到不依賴更新 PR 的定期過時版本報告。

這個結論只涵蓋 repo 檔案、GitHub 保留的執行紀錄、目前 main 的 check runs 及 webhooks，不能排除維護者另有未連到 repo 的私人或外部工具。Dependabot 的安全更新紀錄也不能證明一般過時版本都有受到盤點。

## 通知與暴露情境的限制

依 [GitHub 通知文件](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/manage-your-dependency-security/configure-dependabot-notifications)，Email 與 On GitHub 會通知新發現的 high、critical 漏洞等事件，CLI 則在 push 時提示不安全依賴。設定已確認，但本次沒有收到測試 email，也沒有刻意引入漏洞來測試 CLI；實際送達須另外驗證。Email digest 目前未啟用，所以維護者仍須定期檢視完整警示清單，涵蓋 low、medium 警示及既有公告的更新。

歷史警示將 minimatch 標為 runtime，但目前 SBOM 的範例引入鏈來自 ESLint。警示的 scope 不能直接代表套件會進入首頁 JavaScript；維護者仍須依引入鏈、package scripts 與實際 import 判斷 browser runtime、build 或測試工具的使用情境。

## 選型建議

現有服務已能辨識目前 lockfile、顯示公告與傳遞依賴，並已設定 Email 與 CLI 通知，因此建議沿用 Dependabot，在 README 補上警示入口、每週檢視全部嚴重度警示的方式，以及依實際用途判讀暴露情境的方法。

已查核範圍缺少定期過時版本報告，因此建議另行核准每週及手動執行的唯讀 `npm outdated --json` workflow。依 [npm 文件](https://docs.npmjs.com/cli/v11/commands/npm-outdated/)，預設輸出直接依賴，傳遞依賴可按需用 `--all` 調查；報告應保留原始 JSON、查詢成功或失敗的結果與查看入口。實作時須驗證沒有過時版本、有過時版本及 registry 失敗能明確區別。

自動安全更新已啟用，可能產生安全更新 PR，但 auto-merge 未啟用；維護者依 repo 約定在 main 處理更新。此次建議沿用這些設定，新增報告也維持唯讀。具體待核准範圍與完成條件統一放在計劃的 TD-22，本次盤點不代表 TD-22 已完成。

## 重查入口

下列查詢均已實際執行，只有讀取用途；`gh` 需已登入具備對應讀取權限的帳號。HTTP 失敗或權限不足須另行處理，不能當成服務未啟用或清單為空。

```sh
gh api --method GET repos/bingyangchen/bingyangchen.github.io/vulnerability-alerts --include
gh api --method GET repos/bingyangchen/bingyangchen.github.io/automated-security-fixes
gh api --method GET 'repos/bingyangchen/bingyangchen.github.io/dependabot/alerts?per_page=100' --paginate --slurp
gh api --method GET 'repos/bingyangchen/bingyangchen.github.io/dependabot/alerts?state=open&per_page=100' --paginate --slurp
gh api --method GET repos/bingyangchen/bingyangchen.github.io/actions/workflows
gh api --method GET 'repos/bingyangchen/bingyangchen.github.io/actions/runs?per_page=100' --paginate --slurp
gh api --method GET repos/bingyangchen/bingyangchen.github.io/commits/main/check-runs
gh api --method GET repos/bingyangchen/bingyangchen.github.io/hooks --jq 'map({id,name,active,events})'
```

API 的 HTTP 204 及安全更新欄位解讀依 [GitHub REST 文件](https://docs.github.com/en/rest/repos/repos#check-if-vulnerability-alerts-are-enabled-for-a-repository)。Repo、lockfile 與 workflow 的 metadata 另以 `gh api` 的 repository、contents 及 commits GET endpoint 取得，GraphQL 則查詢 `dependencyGraphManifests` 的 filename、parseable 與 exceedsMaxSize。

本次 `GET /repos/bingyangchen/bingyangchen.github.io/dependency-graph/sbom` 仍成功回傳 SPDX JSON，匯出時間為 `2026-11-15T14:07:14Z`。不過 [GitHub SBOM 文件](https://docs.github.com/en/rest/dependency-graph/sboms)已公告此舊 endpoint 停用，後續重查應依當時文件使用非同步匯出流程；本次結果不代表舊 endpoint 會持續可用。套件比對以 lockfile 的套件名稱及 version 與 SBOM 的 npm purl 為集合，沒有把安裝路徑或 GitHub Actions 計入 npm 套件數。

帳號通知偏好與 repo 的 Watch 選項是從已登入的設定頁查核，沒有將個人 email 地址或憑證寫入附件。
