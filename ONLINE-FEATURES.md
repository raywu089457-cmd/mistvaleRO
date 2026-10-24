# 線上功能分析 & 本機化缺口清單

> 對象：`mistvaleRO` 離線鏡像（xianjingro.fun 快照）
> 方法：靜態掃描 131 支 JS（`fetch` / `EventSource` / OAuth / Firebase 端點），逐一還原「請求契約」
> 重要前提：**這些功能的後端程式不在前端 bundle 裡** → 我們只拿得到「客戶端契約」，拿不到伺服器實作

---

## 一、總覽：哪些功能需要連線

| # | 功能 | 端點 | 方法 | 認證 | 前端檔案 | 本機現況 |
|---|---|---|---|---|---|---|
| 1 | 雲端存檔（Google 綁定） | `/api/cloud` | POST / GET / PATCH | Bearer（Google access token → 換 session token） | `ro-v98.js`, `ro-v126.js` | ❌ 無後端 |
| 2 | 排行榜（武鬥場/塔） | `/api/rank` | POST / GET | 無（自帶 `id` + 本機 `rkTok`） | `ro-v6.js`, `ro-v66.js`, `ro-v139.js` | ❌ 無後端 |
| 3 | 塔排行（引擎內建） | `api/tower` | POST / GET | 管理用 `Bearer aw.adm`（localStorage） | `engine.js` | ❌ 無後端 |
| 4 | 組隊副本排行 | `/api/party` | GET / POST | Bearer（雲端 token） | `ro-v1213.js`, `ro-v137.js` | ❌ 無後端 |
| 5 | 聊天室 | 寫：`/api/chat` / 讀：Firebase RTDB `…/chat/m.json` | POST / EventSource 串流 | 寫入需 `id` + `rkTok` | `ro-v114.js`, `ro-v151.js` | ❌ 無後端 + 無 Firebase |
| 6 | 舊版雲端存檔 | `api/save` | PUT / POST | Bearer（`GC.tok`） | `engine.js` | ❌ 無後端 |
| 7 | 版本更新檢查 | `version.json`、HEAD `index.html` / `ro-content.js` | GET / HEAD | 無 | `ro-v63.js`, `ro-v64.js`, `ro-v75.js` | ✅ 已停用（快照不需要） |

其他外部網域（`assets.latam-tools.com.br` 1319 次、`opengameart`、`ragnaplace`、`divine-pride`、`github/raw`）都是**素材引用與出處連結**，不是功能端點。

---

## 二、各功能契約（可直接照著實作）

### 1) 雲端存檔 `/api/cloud`

```js
// 設定（ro-v98.js）
V98 = {
  cid: "1081223337282-…apps.googleusercontent.com",  // 作者的 Google OAuth client
  api: "/api/cloud",
  every: 300000,        // 自動上傳間隔 5 分鐘
  key: "ro-wanderer.v3.cloud98",   // localStorage 存放 {tok, acc, base, up, dev}
}
```

流程：
1. 前端用 Google Identity Services（`google.accounts.oauth2`）取得 **access token**
2. `POST /api/cloud { at }` → 回應 `{ tok, t }`（`tok` 是該帳號的 session token，`t` 是雲端存檔時間戳）
3. `PATCH /api/cloud { dev }` → 標記「這台裝置接手」
4. `GET /api/cloud` → `{ code, t }`（`code` 是**前端自己編碼**的存檔字串，伺服器只存不解析）
5. `POST /api/cloud`（上傳）→ 帶 `code`

錯誤碼（前端對照表）：`auth` / `nokey` / `big` / `cred` / `google` / `net` / `bad`

**關鍵細節**：存檔內容用 `bkEncode` / `bkDecode` 在前端做編碼壓縮（多支 `ro-v14x` 會包裝 `bkDecode` 做舊資料清理），
所以**伺服器端完全不需要理解存檔格式**，只要存字串。這讓本機化相對容易。

---

### 2) 排行榜 `/api/rank`

```js
// 上傳（ro-v6.js 的 v6RkSubmit）
POST /api/rank
{ id, tok, name, cls, br, lv, floor, sec, dps, d }
// id    = S.cid（角色 ID）
// tok   = S.rkTok（本機產生的 32~64 hex，防冒用）
// cls   = "sword"|"bow"|"mage"|"thief"|"acolyte"|"merchant"
// br    = 二轉分支名稱
// floor / sec / dps = 該場成績
// d     = 快照（裝備、技能盤、天賦、素質）

// 讀取（ro-v6.js / ro-v139.js）
GET /api/rank?cls=all|<cls>&id=<cid>

// 回應（推測自前端用法）
{ ok, rank, best, rec, top:[…], me:{…}, total, err }
```

前端看得到的錯誤碼：`cooldown`、`banned`、`bad data` 等（`V6RK` / `LB_ERR` 對照表）。

---

### 3) 組隊副本排行 `/api/party`

```js
GET  /api/party                     // 列出公開隊伍紀錄
POST /api/party                     // 上傳成績
  headers: { authorization: "Bearer " + V98C.tok }   // 需要雲端登入
  body: { name, cls, br, lv, floor, sec, d:{ mem:[ {k, lv, cls, br, dps, pet?} … ] } }
```

錯誤碼：`cooldown`（100 分鐘內只能上傳一次）、`banned`、`bind`（Google 登入過期）、
`owner mismatch`（隊長憑證不符）、`bad data`、`too large`。

---

### 4) 聊天室

```
寫入：POST /api/chat
      { op:"say", id: S.cid, tok: v6RkTok(), t: "訊息" }

讀取：EventSource(`${V114.db}/chat/m.json?orderBy="ts"&limitToLast=100`)
      V114.db = https://xianjingro-default-rtdb.asia-southeast1.firebasedatabase.app
      → 也就是直接讀作者的 Firebase Realtime Database（公開讀）
```

前端限制（伺服器端還會再檢查一次）：
- 每則 **60 字**上限
- 發言間隔 **5 秒**
- 同訊息 60 秒內不可重複
- 黑名單 / 禁言（`V114C.muted`）

---

### 5) 塔排行（引擎內建，最舊的一條）

```js
POST api/tower
{ name, lv, cls, br, floor, sec, dps, ver, aid, cid, hide }
GET  api/tower?id=<cid>&cls=<cls>        // 管理：headers 帶 axios 式的 Bearer aw.adm
```

`hide: 1` = 不上公開榜。

---

## 三、本機缺少什麼（要完整重現這些功能需要的清單）

### A. 後端服務（完全缺失）

作者跑在 Cloudflare/Netlify 的 functions 上，**沒有把伺服器程式放進前端**。要本機化必須自己寫：

| 需要實作 | 內容 | 粗估 |
|---|---|---|
| `/api/cloud` | 存 `{acc → code, t}`、session token 簽發、`PATCH dev` | 120–200 行 |
| `/api/rank` | 上傳/最佳化/查詢、以 `(cls, floor desc, sec asc)` 排序 | 80–150 行 |
| `/api/party` | 同上 + 100 分鐘 cooldown + 隊長憑證比對 | 100–150 行 |
| `/api/chat` | 寫入、5 秒間隔、60 字、禁言 | 60–120 行 |
| `chat/m.json` 相容端 | 支援 `orderBy/limitToLast` 與 **event-stream**（EventSource） | 80–150 行 |
| 儲存 | SQLite 或 JSON 檔即可 | 30 行 |
| CORS + 靜態托管 | 讓 `/api/*` 與遊戲同源 | 30 行 |

合計約 **400–800 行 Node**，半天到一天可完成（不含驗證機制）。

### B. Google 登入（雲端存檔用）

- 現在的 `V98.cid` 是**作者的** OAuth client，本機不能用（Domain 限制）
- 選項 1：自己開 Google Cloud 專案 + OAuth 同意畫面，拿新 client_id，改 `V98.cid`
- 選項 2：本機繞過——改成打自己的 `/api/devlogin` 直接發 token（改 `ro-v98.js` 的 `v98Login`）
- 選項 3（最省事）：**不啟用雲端存檔**，繼續用 localStorage（單機存檔本來就正常）

### C. 聊天讀取（Firebase）

- 現在讀的是作者的 RTDB（公開讀）。要本機化有兩條路：
  1. 自建 Firebase 專案（免費），把 `V114.db` 指到自己，rules 開放 `/chat/m` 讀取，寫入由自家 `/api/chat` 用 admin 憑證寫
  2. 自己寫一個假 Firebase 端點（上面那 80–150 行的相容端），要模擬 `{ "-Nxxx": {ts, id, name, t, …} }` 的物件形狀

### D. 反作弊 / 驗證邏輯（不可知）

原站伺服器怎麼驗證 `floor / sec / dps / 快照` 是否合理，**前端看不到**。
本機自架只能選擇「信任客戶端」或自己訂規則（例如 floor 不得跳階、sec 下限、dps 上限），
所以**本機排行榜的公平性一定不如原站**。

### E. 網域限制（這條最容易卡住）

```js
// ro-v6.js
const v6RkOn = () =>
  /^https?:$/.test(location.protocol) &&
  !/^(localhost|127\.|\[::1\])/.test(location.hostname) || window.V6_RK_TEST;
```

→ **用 `http://localhost` 開，排行榜／組隊／聊天「功能本身」會被前端直接關掉**（不是錯誤，是靜默停用）。
用 `127.0.0.1` 一樣被擋。
可用：`http://192.168.x.x`（LAN）、Tailscale `100.x`、或 GitHub Pages 網域 —— 這些都會去真的打 `/api/*`。

### F. 其他

- `api/save`、`api/tower` 是**相對路徑** → 只要本機伺服器在同源提供，就不必改前端
- 版本檢查已在本機版停用（`ro-v75.js` 的 `files: []`），避免一直去要 `ro-content.js` 造成 404

---

## 四、建議實作順序（如果真的要做）

1. **聊天室**（最簡單、最有互動感）：自架 `/api/chat` + `chat/m.json` 相容端，5 秒間隔，SQLite 存
2. **排行榜**：`/api/rank` + 前端不擋（用 LAN IP 開）
3. **雲端存檔**：`/api/cloud`（存字串）+ 自建 Google client，或直接 devlogin 繞過
4. **組隊排行**：`/api/party` + cooldown + 憑證比對
5. **反作弊**：最後再做，且要知道原站規則才可能對齊

## 五、結論（一句話）

**單機內容 100% 在手上；線上功能 0% 在手上——因為那是伺服器程式，不是素材。**
能重現的是「介面與契約」，不能重現的是「作者的伺服器與驗證邏輯」。
若只是自己玩，localStorage 存檔已經足夠；要多人排行榜／聊天，就得自架那 400–800 行的後端。
