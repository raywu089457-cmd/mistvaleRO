/* 流浪仙境 v1.0.8（內部 v9.8）：選單「綁定」——Google 帳號綁定雲端存檔
   ・所有角色與共用倉庫備份到雲端（Netlify 函式 /api/cloud ＋ Netlify Blobs），只記錄帳號識別碼的雜湊值
   ・每 5 分鐘自動上傳，切走或關閉頁面時也上傳；換裝置登入同一帳號即可載入
   ・同一個 Google 帳號同時只能在一台裝置遊玩：新裝置接手後，舊裝置會停止並提示
   原作留有雲端存檔程式但已停用（沒有用戶端 ID 與伺服器），這裡另外實作，沿用原本的存檔備份格式 */

const V98 = {
  cid: "1081223337282-ngl81bnr66h9p35nu609toekp9vac9ef.apps.googleusercontent.com", // Google OAuth 用戶端 ID（網頁應用程式，Google Cloud 專案 xianjingro）
  api: "/api/cloud",
  every: 5 * 60e3, // 自動上傳間隔
  hideGap: 60e3, // 切走頁面時，距上次上傳超過此時間才上傳
  key: "ro-wanderer.v3.cloud98",
  icon: 2611,
};
const V98C = { tok: "", acc: "", base: 0, up: 0, dev: "", tried: 0, busy: 0, ask: 0, err: "", booted: 0, ct: 0 };
try {
  Object.assign(V98C, JSON.parse(localStorage.getItem(V98.key)) || {});
} catch (e) {}
if (!/^[a-z0-9]{8,32}$/.test(V98C.dev)) V98C.dev = [...crypto.getRandomValues(new Uint8Array(16))].map((x) => (x % 36).toString(36)).join("");
const v98Web = () => typeof location !== "undefined" && /^https?:$/.test(location.protocol) && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const v98Ready = () => v98Web() && !!V98.cid;
const v98On = () => v98Ready() && !!V98C.tok;
const V98_ERR = {
  auth: "Google 登入已過期，請重新登入",
  nokey: "雲端存檔尚未開放",
  big: "存檔太大，無法上傳",
  cred: "Google 登入失敗",
  google: "暫時無法連線 Google",
  net: "暫時無法連線雲端",
  bad: "資料錯誤",
};
function v98Put() {
  try {
    const { tok, acc, base, up, dev } = V98C;
    localStorage.setItem(V98.key, JSON.stringify({ tok, acc, base, up, dev }));
  } catch (e) {}
}
const v98Api = (method, body) =>
  fetch(V98.api, {
    method,
    cache: "no-store",
    body: body ? JSON.stringify(body) : undefined,
    headers: { "content-type": "application/json", ...(V98C.tok ? { authorization: "Bearer " + V98C.tok } : {}) },
  })
    .then((r) => r.json())
    .catch(() => ({ err: "net" }));
const v98Time = (t) => {
  if (!t) return "—";
  const a = new Date(t);
  return `${a.getMonth() + 1}/${a.getDate()} ${String(a.getHours()).padStart(2, "0")}:${String(a.getMinutes()).padStart(2, "0")}`;
};
const v98Refresh = () => {
  try {
    ui.refreshIf("more");
    if (ui.tab === "more" && ui.moreView === "bind") ui.render();
  } catch (e) {}
};

function v98Out(msg) {
  V98C.tok = "";
  V98C.up = 0;
  V98C.ask = 0;
  v98Put();
  if (msg) toast(msg, "bad");
  v98Refresh();
}

async function v98Upload(force) {
  if (!v98On() || !S || (typeof TAB !== "undefined" && TAB.gone) || V98C.busy || (V98C.ask && !force)) return false;
  V98C.busy = 1;
  V98C.tried = Date.now();
  let ok = false;
  try {
    const r = await v98Api("PUT", { code: await bkEncode(), base: force ? -1 : V98C.base, dev: V98C.dev, ver: typeof V6_BUILD === "string" ? V6_BUILD : "" });
    if (r.t && !r.err) {
      V98C.base = V98C.ct = r.t;
      V98C.up = Date.now();
      V98C.err = "";
      v98Put();
      ok = true;
    } else if (r.err === "dev") v98Kick();
    else if (r.err === "old") v98Ask();
    else if (r.err === "auth") v98Out(V98_ERR.auth);
    else if (r.err !== "slow") V98C.err = V98_ERR[r.err] || V98_ERR.net;
  } catch (e) {
    V98C.err = V98_ERR.net;
  }
  V98C.busy = 0;
  v98Refresh();
  return ok;
}

// 另一台裝置接手：停止遊戲（沿用原作的畫面）
function v98Kick() {
  if (typeof gcKick === "function") return gcKick();
  location.reload();
}

// 這台裝置接手，並檢查雲端是否有較新的存檔
async function v98Claim() {
  if (!v98On() || V98C.ask || (typeof TAB !== "undefined" && TAB.gone)) return;
  const r = await v98Api("PATCH", { dev: V98C.dev });
  if (r.err === "auth") return v98Out(V98_ERR.auth);
  if (r.err) return;
  V98C.ct = r.t || 0;
  if (r.t && r.t !== V98C.base) v98Ask();
  else if (!r.t && S) v98Upload();
  v98Refresh();
}

const v98List = (arr) =>
  `<div class="list">${arr
    .filter(Boolean)
    .map((t) => `<div class="li"><b>${esc(t.name || "未命名")}</b><span class="spacer"></span><span style="color:var(--muted)">${CLASS[t.cls]?.n || ""} <span class="px">LV${t.lvl}</span></span></div>`)
    .join("")}</div>`;
async function v98Ask() {
  V98C.ask = 1;
  const r = await v98Api("GET");
  if (r.err === "auth") return v98Out(V98_ERR.auth);
  const o = r.code && (await bkDecode(r.code));
  if (!o) {
    V98C.ask = 0;
    if (S) v98Upload();
    else toast("這個 Google 帳號還沒有雲端存檔");
    return;
  }
  ui.v98O = o;
  ui.v98T = r.t;
  const cloud = [o.cur, ...Object.values(o.chars || {})],
    local = S ? [S, ...rosterGet().list.filter((t) => t.id !== S.cid).map((t) => charLoad(t.id))] : [];
  ui.v98Low = !!S && Math.max(...cloud.filter(Boolean).map((t) => t.lvl)) < Math.max(...local.filter(Boolean).map((t) => t.lvl));
  ui.v98H = `<h2 class="cfh">雲端有另一份存檔</h2>${local.length ? `<p class="note" style="margin:0">這台裝置</p>${v98List(local)}` : ""}
    <p class="note" style="margin:0">雲端 <span class="px">${v98Time(r.t)}</span></p>${v98List(cloud)}
    ${S ? `<div class="cfl"><div>${cfW("選擇的存檔將取代另一份")}</div></div>` : ""}
    <div class="row">${S ? '<button class="btn" data-v98="keep">保留本機存檔</button>' : '<button class="btn" data-act="close">取消</button>'}<span class="spacer"></span><button class="btn primary" data-v98="${S ? "loadAsk" : "load"}">載入雲端</button></div>`;
  bkSheet(ui.v98H);
}

// ---- Google 登入
function v98LoginOpen() {
  if (!v98Web()) return toast("雲端存檔只能在網頁版使用", "bad");
  if (!V98.cid) return toast(V98_ERR.nokey, "bad");
  const inApp = typeof gcInApp === "function" && gcInApp();
  bkSheet(`<h2 class="cfh">綁定 Google</h2><div class="cfl"><div>所有角色與共用倉庫自動備份到雲端</div><div>更換裝置時登入同一帳號即可載入</div><div>同一帳號同時只能在一台裝置遊玩</div><div>只記錄帳號識別碼，不儲存 Email</div>
    ${inApp ? `<div>${cfW("App 內瀏覽器無法登入 Google")}</div><div>${cfW("請改用 Chrome 或 Safari 開啟")}</div>` : ""}</div>
    <div class="row"><span class="spacer"></span><a href="privacy/" target="_blank" rel="noopener" style="color:var(--muted)">隱私權政策</a></div>
    <p class="note" id="v98Err" style="margin:0;color:var(--bad)" hidden></p>
    <div class="row"><button class="btn" data-act="close">取消</button><span class="spacer"></span><button class="btn primary" data-v98="go">${typeof GC_G === "string" ? `<img src="${GC_G}" alt="" style="width:16px;height:16px;vertical-align:-3px;margin-right:6px;image-rendering:pixelated;background:#fff;padding:0">` : ""}用 Google 登入</button></div>`);
  gsiLoad().catch(() => v98LoginErr("無法連線 Google，請稍後再試"));
}
const v98LoginErr = (t) => {
  const a = document.getElementById("v98Err");
  if (a) {
    a.textContent = t;
    a.hidden = false;
  }
};
function v98Go() {
  if (!(window.google && google.accounts && google.accounts.oauth2)) {
    v98LoginErr("正在連線 Google，請再按一次");
    gsiLoad().catch(() => {});
    return;
  }
  V98C.tc ||= google.accounts.oauth2.initTokenClient({
    client_id: V98.cid,
    scope: "openid",
    callback: (t) => (t && t.access_token ? v98Login(t.access_token) : v98LoginErr("Google 登入失敗")),
    error_callback: (t) => v98LoginErr(t && t.type === "popup_closed" ? "登入已取消" : "無法開啟 Google 登入視窗"),
  });
  V98C.tc.requestAccessToken({ prompt: "select_account" });
}
async function v98Login(at) {
  const r = await v98Api("POST", { at });
  if (!r.tok) return v98LoginErr(V98_ERR[r.err] || V98_ERR.net);
  const acc = r.tok.split(".")[0];
  if (acc !== V98C.acc) V98C.base = 0;
  Object.assign(V98C, { tok: r.tok, acc, err: "", ct: r.t || 0 });
  v98Put();
  gcClose();
  // 這台裝置接手
  await v98Api("PATCH", { dev: V98C.dev });
  if (r.t && !(r.t === V98C.base && S)) v98Ask();
  else if (S) (await v98Upload()) && toast("已綁定 Google，存檔已上傳");
  else toast("已綁定 Google，雲端還沒有存檔");
  v98Refresh();
}

// 確認視窗（按鈕交給 data-v98 處理；取消用遊戲原本的關閉）
const v98Card = (title, lines, ok, okK, backK) =>
  `<h2 class="cfh">${title}</h2><div class="cfl">${lines.filter(Boolean).map((t) => `<div>${t}</div>`).join("")}</div><div class="row">${backK ? `<button class="btn" data-v98="${backK}">返回</button>` : '<button class="btn" data-act="close">取消</button>'}<span class="spacer"></span><button class="btn danger" data-v98="${okK}"><span>${ok}</span></button></div>`;
async function v98Act(k) {
  if (k === "in" || k === "pick") return v98LoginOpen();
  if (k === "go") return v98Go();
  if (k === "up") {
    if (V98C.ask) return v98Ask();
    if (await v98Upload()) toast("已上傳雲端存檔");
    else if (!V98C.ask) toast(V98C.err || "剛才已上傳，稍後再試", V98C.err ? "bad" : "");
    return;
  }
  if (k === "load") {
    if (!ui.v98O) return v98Ask();
    V98C.base = V98C.ct = ui.v98T;
    V98C.ask = 0;
    V98C.up = Date.now();
    v98Put();
    return bkApply(ui.v98O);
  }
  if (k === "loadAsk") return bkSheet(v98Card("載入雲端存檔？", [cfW("這台裝置的角色將由雲端存檔取代"), ui.v98Low && cfW("雲端存檔的等級低於這台裝置")], "載入雲端", "load", "back"));
  if (k === "back") return ui.v98H && bkSheet(ui.v98H);
  if (k === "keep") {
    gcClose();
    V98C.ask = 0;
    return (await v98Upload(true)) ? toast("已用這台裝置的存檔取代雲端存檔") : toast(V98C.err || V98_ERR.net, "bad");
  }
  if (k === "cloud") return v98Ask();
  if (k === "off") {
    v98Out();
    return toast("已登出 Google，雲端存檔仍保留");
  }
  if (k === "del") return bkSheet(v98Card("刪除雲端存檔？", [cfW("雲端存檔會永久刪除"), "這台裝置的存檔不受影響", "同時登出 Google"], "刪除", "delYes"));
  if (k === "delYes") {
    const r = await v98Api("DELETE");
    gcClose();
    if (r.ok || r.err === "auth") {
      V98C.base = V98C.ct = 0;
      v98Out();
      toast("已刪除雲端存檔");
    } else toast(V98_ERR[r.err] || V98_ERR.net, "bad");
  }
}

// ---- 選單「綁定」
function v98Page() {
  const head = `<h2>帳號綁定${typeof helpBtn === "function" && HELP.bind ? helpBtn("bind") : ""}</h2>`;
  if (!v98Web()) return head + `<div class="box stack"><p>雲端存檔只能在網頁版使用。</p><p class="note">請用瀏覽器開啟遊戲網址後再綁定。</p></div>`;
  if (!V98.cid) return head + `<div class="box stack"><p>${V98_ERR.nokey}。</p></div>`;
  const G = typeof GC_G === "string" ? `<img src="${GC_G}" alt="" style="width:16px;height:16px;vertical-align:-3px;margin-right:6px;image-rendering:pixelated;background:#fff;padding:0">` : "";
  if (!V98C.tok)
    return (
      head +
      `<div class="box stack"><p><b>綁定 Google 帳號，防止存檔遺失</b></p>
      <div class="cfl"><div>所有角色與共用倉庫自動備份到雲端（每 5 分鐘，切走頁面時也會上傳）</div><div>清除瀏覽資料、更換手機或電腦時，登入同一帳號即可載入</div><div>同一帳號同時只能在一台裝置遊玩</div><div>只記錄帳號識別碼，不儲存 Email</div></div>
      <div class="row"><span class="spacer"></span><button class="btn primary" data-v98="in">${G}用 Google 登入</button></div></div>`
    );
  return (
    head +
    `<div class="box stack"><dl class="kv"><dt>狀態</dt><dd>已綁定 Google（帳號 …${esc(V98C.acc.slice(-4))}）</dd><dt>這台上傳</dt><dd><span class="px">${v98Time(V98C.up)}</span></dd><dt>雲端存檔</dt><dd><span class="px">${v98Time(V98C.ct || V98C.base)}</span></dd></dl>
    ${V98C.err ? `<p class="note" style="margin:0;color:var(--bad)">${esc(V98C.err)}</p>` : ""}
    <p class="note" style="margin:0">每 5 分鐘自動上傳；同一帳號在另一台裝置登入後，這台會停止遊戲。</p>
    <div class="row" style="flex-wrap:wrap;gap:6px"><button class="btn primary" data-v98="up" ${V98C.busy ? "disabled" : ""}>立即上傳</button><button class="btn" data-v98="cloud">從雲端載入</button><span class="spacer"></span><button class="btn" data-v98="off">登出</button><button class="btn" data-v98="del" style="color:var(--bad)">刪除雲端存檔</button></div></div>`
  );
}

function v98Install() {
  if (typeof MENU === "undefined" || typeof ui === "undefined") return;
  if (typeof roItemFiles !== "undefined") roItemFiles.mnBind = V98.icon;
  if (!MENU.some((m) => m[0] === "bind")) {
    const i = MENU.findIndex((m) => m[0] === "set");
    MENU.splice(i >= 0 ? i : MENU.length, 0, ["bind", "綁定", "mnBind"]);
  }
  ui.m_bind = v98Page;
  if (typeof HELP !== "undefined") {
    HELP.bind = [
      "帳號綁定",
      [
        ["綁定", "在「選單 → 綁定」用 Google 登入，所有角色與共用倉庫會備份到雲端。只記錄帳號識別碼（雜湊後），不儲存 Email。"],
        ["自動上傳", "綁定後每 5 分鐘自動上傳一次，切走或關閉頁面時也會上傳；也可以按「立即上傳」。"],
        ["換裝置", "在新裝置開啟遊戲，用同一個 Google 帳號登入，選「載入雲端」。沒有角色時，建立角色畫面也有「已有存檔？用 Google 載入」。"],
        ["一台裝置", "同一個 Google 帳號同時只能在一台裝置遊玩：在新裝置登入或開啟後，舊裝置下次上傳時會停止，並顯示「遊戲在另一台裝置進行中」；按「在這裡繼續」可以接手回來。"],
        ["兩份存檔", "這台裝置和雲端的存檔不同時，會列出兩邊的角色與等級，選擇要保留哪一份；選擇的存檔會取代另一份。"],
        ["登出與刪除", "登出後雲端存檔仍保留；刪除雲端存檔會永久刪除雲端那份，這台裝置的存檔不受影響。"],
        ["注意", "在 LINE、Threads 等 App 內開啟時無法登入 Google，請改用 Chrome 或 Safari。"],
      ],
    ];
    const sv = HELP.save?.[1];
    if (Array.isArray(sv))
      for (const r of sv)
        if (Array.isArray(r) && typeof r[1] === "string") r[1] = r[1].replace(/綁定 Google 後/g, "在「選單 → 綁定」綁定 Google 後");
  }
  // 點擊
  document.addEventListener("click", (e) => {
    const b = e.target.closest?.("[data-v98]");
    if (!b || b.disabled) return;
    e.preventDefault();
    e.stopPropagation();
    v98Act(b.dataset.v98);
  });
  // 建立角色畫面：已有存檔？用 Google 載入
  if (typeof showPick === "function") {
    const sp = showPick;
    showPick = function (t = "first", ...x) {
      const r = sp.call(this, t, ...x);
      try {
        const a = document.getElementById("pick");
        if (t === "first" && v98Ready() && !V98C.tok && a && !a.querySelector("[data-v98]")) a.insertAdjacentHTML("beforeend", '<button class="btn" data-v98="pick">已有存檔？用 Google 載入</button>');
        if (t === "first" && v98On() && !S) setTimeout(v98Ask, 300);
      } catch (e) {}
      return r;
    };
  }
  // 讀取角色後：這台裝置接手並比對雲端
  if (typeof startGame === "function") {
    const sg = startGame;
    startGame = function (...a) {
      const r = sg.apply(this, a);
      if (!V98C.booted && v98On()) {
        V98C.booted = 1;
        setTimeout(v98Claim, 1500);
      }
      return r;
    };
  }
  // 自動上傳
  setInterval(() => {
    if (v98On() && S && Date.now() - V98C.tried > V98.every) v98Upload();
  }, 30e3);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && v98On() && S && Date.now() - V98C.tried > V98.hideGap) v98Upload();
  });
}
if (typeof roV4Install === "function") {
  const r4v98 = roV4Install;
  roV4Install = function () {
    r4v98();
    v98Install();
  };
}
