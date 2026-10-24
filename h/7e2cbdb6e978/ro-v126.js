/* 流浪仙境 v1.2.3：雲端角色（綁定帳號）、劍士護甲天賦下修、其他角色離線掉落、鍛造大師改為終極天賦
   1. 雲端角色：網頁版登入 Google 後改用「這個帳號的雲端角色」，與這台裝置的本機角色分開（本機角色不上傳，登出後回到本機角色）。
      ・每次開啟都從雲端載入；本機只當暫存，被修改也不會讀進來；不能匯出／匯入，也不能用本機存檔覆蓋雲端（無法回溯）
      ・每 3 分鐘自動上傳（切走頁面時也上傳）；上傳失敗超過 3 分鐘暫停遊戲，恢復連線後自動繼續
      ・離線收益以伺服器時間計算（改電腦時間無效）
      ・伺服器檢查：等級不能倒退、等級與 Zeny 增加速度超過合理範圍時拒收（重新載入雲端存檔），並把帳號排除在線上排行之外
      ・未登入仍可用本機角色遊玩，但不能上傳線上排行、不能在聊天室發言（原本就需要綁定）
   2. 共用天賦「鋼鐵之膚」護甲 +58% → +40%；神聖流「盾擊」護甲 +30% → +20%
   3. 未使用的角色離線也有掉落（25%，與目前角色相同）
   4. 鍛造大師改為終極天賦：已點但點數不足、終極已滿或未滿 Lv60 的角色自動退回
   5. 手機版：彈出視窗底部留白，避免「關閉」被 Netlify 的標誌擋住
   6. 活動深淵「?」說明補上升階步驟；萬象斗篷、蛇毒披風、氣功披肩改用 RO 原版披肩圖示 */

const V126 = {
  every: 3 * 60e3, // 雲端角色自動上傳間隔
  retry: 30e3, // 上傳失敗後的重試間隔
  pauseAfter: 3 * 60e3, // 上傳失敗超過這個時間就暫停
  on: false,
  acc: "",
  ns: "",
  raw: null,
  booted: 0,
  failAt: 0,
  retryAt: 0,
  paused: false,
  sNow: 0, // 最近一次伺服器時間
  up: 0,
  bootPerf: 0,
  cOff: {}, // 各角色載入時的離線秒數（伺服器時間）
  cPerf: {}, // 各角色離開的時間（performance.now）
  cur: "",
};
// 披肩類獨特裝備的圖示（RO 原版披肩：2533、2511、2524）
(() => {
  const A = typeof window !== "undefined" && window.RO_ASSETS;
  if (!A) return;
  A.items ||= {};
  for (const id of [2511, 2524, 2533]) A.items[id] ||= { file: `items/${id}.png`, width: 24, height: 24 };
})();
const V126_ICON = { ro44_prism: 2533, ro44_viper: 2511, ro44_chi: 2524 }; // 萬象斗篷（原本戒指圖）、蛇毒披風（手套圖）、氣功披肩（胸針圖）
const v126Web = () => typeof location !== "undefined" && /^https?:$/.test(location.protocol) && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname);

// ---------------------------------------------------------------------------
// 1. 雲端角色模式：已登入時，角色相關的本機存檔改存到這個帳號專用的位置（本機角色不受影響）
(function v126Mode() {
  try {
    if (typeof v98Web !== "function" || !v98Web() || typeof V98 === "undefined" || !V98.cid) return;
    if (!/^[a-f0-9]{24}\.\d{10,16}\.[a-f0-9]{64}$/.test(V98C.tok || "")) return;
    V126.on = true;
    V126.acc = V98C.tok.split(".")[0];
  } catch (e) {
    return;
  }
  const P = "ro-wanderer.v3.",
    CP = CHAR_KEY(""),
    keys = new Set([SAVE_KEY, ROSTER_KEY, STASH_KEY, P + "zr"]);
  V126.ns = P + "@" + V126.acc + ".";
  const mk = (k) => (typeof k === "string" && (keys.has(k) || k.startsWith(CP)) ? V126.ns + k.slice(P.length) : k);
  const SP = Storage.prototype,
    g = SP.getItem,
    s = SP.setItem,
    r = SP.removeItem,
    isLS = (o) => {
      try {
        return o === window.localStorage;
      } catch (e) {
        return false;
      }
    };
  V126.raw = { g, s, r };
  SP.getItem = function (k) {
    return g.call(this, isLS(this) ? mk(k) : k);
  };
  SP.setItem = function (k, v) {
    return s.call(this, isLS(this) ? mk(k) : k, v);
  };
  SP.removeItem = function (k) {
    return r.call(this, isLS(this) ? mk(k) : k);
  };
  if (typeof document !== "undefined") document.documentElement.classList.add("v126cloud");
})();
if (typeof document !== "undefined" && v126Web()) document.documentElement.classList.add("v126web");

const v126Api = (method, body, q = "") =>
  fetch(V98.api + q, {
    method,
    cache: "no-store",
    body: body ? JSON.stringify(body) : undefined,
    headers: { "content-type": "application/json", authorization: "Bearer " + V98C.tok },
  })
    .then((r) => r.json())
    .catch(() => ({ err: "net" }));

// 畫面遮罩（讀取中、連線中斷）
function v126Cover(msg, opts = {}) {
  if (typeof document === "undefined") return;
  let el = document.getElementById("v126cover");
  if (!el) {
    el = document.createElement("div");
    el.id = "v126cover";
    document.body.appendChild(el);
  }
  el.hidden = false;
  el.innerHTML = `<div class="v126box"><b>${msg}</b>${opts.sub ? `<p>${opts.sub}</p>` : ""}${opts.btn ? `<div class="v126row"><button class="btn primary" data-v126="retry">重試</button>${opts.local ? '<button class="btn" data-v126="local">改用本機角色（登出）</button>' : ""}</div>` : ""}</div>`;
}
const v126CoverOff = () => {
  const el = typeof document !== "undefined" && document.getElementById("v126cover");
  if (el) el.hidden = true;
};
function v126Logout(msg) {
  try {
    if (S && typeof saveNow === "function" && !TAB.gone) saveNow(true);
  } catch (e) {}
  V98C.tok = "";
  V98C.up = 0;
  V98C.ask = 0;
  v98Put();
  try {
    if (msg) sessionStorage.setItem("v126msg", msg);
  } catch (e) {}
  TAB.gone = true;
  location.reload();
}
function v126Reload(msg) {
  try {
    if (msg) sessionStorage.setItem("v126msg", msg);
  } catch (e) {}
  TAB.gone = true; // 不再寫入本機暫存，直接重新載入雲端存檔
  location.reload();
}
function v126Ok(r) {
  V126.failAt = 0;
  if (r && r.now) V126.sNow = r.now;
  if (V126.paused) {
    V126.paused = false;
    v126CoverOff();
    toast("已恢復與雲端存檔的連線", "lvl");
  }
}
function v126Fail() {
  if (!V126.failAt) V126.failAt = performance.now();
}

// 開機：先從雲端載入，寫進這個帳號的暫存，再開始遊戲
async function v126Boot() {
  v126Cover("正在讀取雲端角色…");
  const r = await v126Api("GET");
  if (r.err === "auth") {
    v126Logout("Google 登入已過期，已改用本機角色；到「選單 → 綁定」重新登入即可使用雲端角色");
    return false;
  }
  if (r.err || r.t == null) {
    v126Cover("無法連線雲端存檔", { sub: "雲端角色需要連線才能開始遊戲。", btn: 1, local: 1 });
    return false;
  }
  let o = null;
  if (r.code) {
    o = await bkDecode(r.code);
    if (!o) {
      v126Cover("雲端存檔讀取失敗", { sub: "請稍後再試；本機角色不受影響。", btn: 1, local: 1 });
      return false;
    }
  }
  await v126WriteCache(o, r);
  V98C.base = V98C.ct = r.t || 0;
  V98C.ask = 0;
  v98Put();
  v126Ok(r);
  v126CoverOff();
  V126.bootOk = 1;
  return true;
}
async function v126WriteCache(o, r) {
  const ls = window.localStorage,
    raw = V126.raw,
    del = [];
  for (let i = 0; i < ls.length; i++) {
    const k = ls.key(i);
    if (k && k.startsWith(V126.ns)) del.push(k);
  }
  for (const k of del) raw.r.call(ls, k);
  V126.bootPerf = performance.now();
  if (!o) return;
  // 離線時間改用伺服器時間：所有存檔時間平移，使「本機時間 − 存檔時間」＝ 伺服器上距離上次上傳的時間
  const now = Date.now(),
    off = Math.max(0, (r.now || now) - (r.t || now)),
    shift = now - off - (o.cur.t || now);
  for (const [k, c] of Object.entries(o.chars)) c.cid = k;
  const all = [o.cur, ...Object.values(o.chars)];
  for (const c of all) if (c && c.t) c.t = Math.round(c.t + shift);
  ls.setItem(STASH_KEY, JSON.stringify(stClean(o.stash)));
  ls.setItem(SAVE_KEY, await lsZip(JSON.stringify(o.cur)));
  for (const [k, c] of Object.entries(o.chars)) ls.setItem(CHAR_KEY(k), await lsZip(JSON.stringify(c)));
  ls.setItem(ROSTER_KEY, JSON.stringify({ list: all.map((t) => ({ id: t.cid, name: t.name, cls: t.cls, lvl: t.lvl, tw: (t.tw && t.tw.best) || 0 })) }));
  for (const c of all) V126.cOff[c.cid] = Math.max(0, (now - (c.t || now)) / 1000);
}

// 上傳（取代 ro-v98 的上傳：不允許覆蓋雲端、記錄連線狀態）
async function v126Upload() {
  if (!V126.on || !S || TAB.gone || V126.up || V126.paused === "chk") return false;
  V126.up = 1;
  V98C.tried = Date.now();
  let ok = false;
  try {
    const code = await bkEncode();
    const r = await v126Api("PUT", { code, base: V98C.base, dev: V98C.dev, ver: typeof V6_BUILD === "string" ? V6_BUILD : "" });
    if (r.t && !r.err) {
      V98C.base = V98C.ct = r.t;
      V98C.up = Date.now();
      V98C.err = "";
      v98Put();
      v126Ok(r);
      ok = true;
    } else if (r.err === "net") {
      V98C.err = V98_ERR.net;
      v126Fail();
    } else {
      v126Ok(r);
      if (r.err === "dev") v98Kick();
      else if (r.err === "old") v126Reload("雲端存檔已在其他裝置更新，已重新載入雲端角色");
      else if (r.err === "auth") v126Logout(V98_ERR.auth);
      else if (r.err === "chk") v126Chk(r);
      else if (r.err !== "slow") V98C.err = V98_ERR[r.err] || V98_ERR.net;
    }
  } catch (e) {
    v126Fail();
  }
  V126.up = 0;
  v98Refresh();
  return ok;
}
// 伺服器檢查未通過：這次進度不保存，重新載入雲端存檔
function v126Chk(r) {
  V126.paused = "chk";
  v126Cover("雲端存檔檢查未通過", {
    sub: `${r.why ? esc(r.why) + "。" : ""}這次的進度不會保存，將重新載入上一次的雲端存檔；這個帳號已排除在線上排行之外。`,
  });
  const el = document.querySelector("#v126cover .v126box");
  if (el) el.insertAdjacentHTML("beforeend", '<div class="v126row"><button class="btn primary" data-v126="reload">重新載入</button></div>');
}
function v126Pause() {
  if (V126.paused) return;
  V126.paused = true;
  v126Cover("與雲端存檔的連線中斷，遊戲已暫停", { sub: "恢復連線後會自動繼續（每 30 秒重試）。", btn: 1 });
}
// 每 5 秒：上傳失敗的重試與暫停
async function v126Watch() {
  if (!V126.on || !S || TAB.gone || V126.paused === "chk") return;
  const t = performance.now();
  if (!V126.failAt) return;
  if (!V126.paused && t - V126.failAt > V126.pauseAfter) v126Pause();
  if (t - V126.retryAt > V126.retry && !V126.up) {
    V126.retryAt = t;
    await v126Upload();
  }
}

// 遊戲中的離線（電腦睡眠、切到背景太久）：向伺服器確認實際經過的時間
async function v126SleepGain(og, t) {
  if (V126.sleep) return;
  V126.sleep = 1;
  const s0 = V126.sNow,
    r = await v126Api("GET", null, "?ping=1");
  V126.sleep = 0;
  if (r.err) return v126Fail();
  v126Ok(r);
  const real = s0 ? (r.now - s0) / 1000 : 0,
    e = Math.min(t, Math.max(0, real));
  if (e >= 60 && S && G && !V126.paused) og.call(window, e);
}

function v126CloudInstall() {
  if (!V126.on) return;
  V98.every = V126.every;
  v98Upload = v126Upload;
  // 雲端有較新的存檔（其他裝置上傳）：一律以雲端為準
  v98Ask = async function () {
    const r = await v126Api("GET", null, "?ping=1");
    if (r.err === "auth") return v126Logout(V98_ERR.auth);
    if (r.err) return v126Fail();
    v126Ok(r);
    if (r.t && r.t !== V98C.base) v126Reload("雲端存檔已在其他裝置更新，已重新載入雲端角色");
  };
  // 不能匯入備份到雲端角色
  const ba = bkApply;
  bkApply = function (...a) {
    if (V126.on) return void toast("雲端角色不能匯入備份；登出後可在本機角色使用", "bad");
    return ba.apply(this, a);
  };
  // 綁定頁：雲端角色的狀態與登出
  const act = v98Act;
  v98Act = async function (k, ...x) {
    if (k === "off") return v126Logout("已登出 Google，改用本機角色；雲端角色仍保留");
    if (["load", "loadAsk", "keep", "cloud", "back"].includes(k)) return;
    if (k === "delYes") {
      const r = await v126Api("DELETE");
      if (r.ok || r.err === "auth") return v126Reload("已刪除雲端存檔");
      return toast(V98_ERR[r.err] || V98_ERR.net, "bad");
    }
    return act.call(this, k, ...x);
  };
  const page = ui.m_bind;
  ui.m_bind = function (...a) {
    return page
      .apply(this, a)
      .replace(/<button class="btn" data-v98="cloud">從雲端載入<\/button>/, "")
      .replace(/每 5 分鐘自動上傳；/, "雲端角色：每 3 分鐘自動上傳；")
      .replace(/(<dt>狀態<\/dt><dd>)已綁定 Google/, "$1使用雲端角色")
      .replace(/data-v98="off">[^<]*</, 'data-v98="off">登出（改用本機角色）<');
  };
  // 設定：雲端角色不顯示匯出／匯入
  const ms = ui.m_set;
  ui.m_set = function (...a) {
    return ms
      .apply(this, a)
      .replace(/<h3>存檔備份[\s\S]*?(?=<h3>戰鬥)/, `<h3>存檔備份</h3><div class="box stack"><p class="note">目前使用雲端角色（綁定 Google 帳號），存檔只保存在雲端，不能匯出或匯入。登出後回到這台裝置的本機角色。</p></div>`);
  };
  // 離線收益：角色切換限制在實際經過的時間內；遊戲中的離線向伺服器確認
  const og = offlineGains;
  offlineGains = function (t, a, s) {
    if (V126.paused || !S) return;
    if (arguments.length < 2) return void v126SleepGain(og, t);
    const now = performance.now();
    if (V126.cur && V126.cur !== S.cid) {
      V126.cPerf[V126.cur] = now;
      V126.cOff[V126.cur] = 0;
    }
    V126.cur = S.cid;
    const max = (V126.cOff[S.cid] || 0) + (now - (V126.cPerf[S.cid] ?? V126.bootPerf)) / 1000 + 5;
    V126.cOff[S.cid] = 0;
    V126.cPerf[S.cid] = now;
    return og.call(this, Math.min(t, max), a, s);
  };
  // 暫停時不進行戰鬥
  const tk = tick;
  tick = function (...a) {
    if (V126.paused) return;
    return tk.apply(this, a);
  };
  // 登入流程：登入後重新載入，改用雲端角色
  setInterval(() => {
    try {
      v126Watch();
    } catch (e) {}
  }, 5e3);
}
// 未登入（本機角色）：登入後重新載入成雲端角色模式；登入畫面說明
function v126LocalInstall() {
  if (V126.on || typeof v98Login !== "function") return;
  v98Login = async function (at) {
    const r = await v126ApiNoTok("POST", { at });
    if (!r.tok) return v98LoginErr(V98_ERR[r.err] || V98_ERR.net);
    try {
      if (S && typeof saveNow === "function") await saveNow(true);
    } catch (e) {}
    const acc = r.tok.split(".")[0];
    Object.assign(V98C, { tok: r.tok, acc, err: "", ct: r.t || 0, base: 0, up: 0 });
    v98Put();
    await v126ApiNoTok("PATCH", { dev: V98C.dev }, r.tok);
    v126Reload(r.t ? "已登入 Google，載入這個帳號的雲端角色" : "已登入 Google：這個帳號還沒有雲端角色，請建立新角色，或把本機角色帶到雲端");
  };
  const lo = v98LoginOpen;
  v98LoginOpen = function (...a) {
    const r = lo.apply(this, a);
    try {
      const box = document.querySelector("#sheet .cfl");
      if (box)
        box.innerHTML =
          "<div>登入後改用這個帳號的「雲端角色」，存檔保存在雲端</div><div>這台裝置的本機角色（包含匯入的存檔）不會自動上傳，登入後可以在「選單 → 綁定」帶到雲端（每 7 天 1 次）；登出後可以回到本機角色</div><div>只有雲端角色可以上傳線上排行、在聊天室發言</div><div>同一帳號同時只能在一台裝置遊玩</div><div>只記錄帳號識別碼的雜湊值，不儲存 Email、姓名</div>";
    } catch (e) {}
    return r;
  };
  const page = ui.m_bind;
  ui.m_bind = function (...a) {
    return page.apply(this, a).replace(/<div class="cfl">[\s\S]*?<\/div>\s*<div class="row"><span class="spacer"><\/span><button class="btn primary" data-v98="in">/, '<div class="cfl"><div>登入後使用這個帳號的雲端角色（與本機角色分開；本機角色與匯入的存檔可以在登入後帶到雲端，每 7 天 1 次）</div><div>雲端角色每 3 分鐘自動上傳，換裝置登入同一帳號即可繼續</div><div>只有雲端角色可以上傳線上排行、在聊天室發言</div><div>登出後回到這台裝置的本機角色</div></div><div class="row"><span class="spacer"></span><button class="btn primary" data-v98="in">');
  };
}
const v126ApiNoTok = (method, body, tok) =>
  fetch(V98.api, {
    method,
    cache: "no-store",
    body: body ? JSON.stringify(body) : undefined,
    headers: { "content-type": "application/json", ...(tok ? { authorization: "Bearer " + tok } : {}) },
  })
    .then((r) => r.json())
    .catch(() => ({ err: "net" }));

// 開機流程：雲端角色模式先讀雲端（在 bootGo → tabClaim 之前完成）
if (V126.on && typeof tabClaim === "function") {
  const tc = tabClaim;
  tabClaim = function (cb) {
    if (V126.booted) return tc.call(this, cb);
    V126.booted = 1;
    V126.go = () =>
      v126Boot().then((ok) => {
        if (ok) cb();
      });
    return tc.call(this, () => V126.go());
  };
}

// ---------------------------------------------------------------------------
// 2. 護甲天賦下修
function v126ArmorInstall() {
  const n = typeof RO_TREE_NODES !== "undefined" && RO_TREE_NODES.vitan;
  if (n && n.mods && n.mods.armorp === 58) {
    n.mods.armorp = 40;
    n.desc = String(n.desc || "").replace("護甲 +58%", "護甲 +40%");
  }
  for (const row of (typeof RO_TREE_NOTABLES !== "undefined" && RO_TREE_NOTABLES.vit) || []) if (row[0] === "鋼鐵之膚") row[1] = row[1].replace("護甲 +58%", "護甲 +40%");
  for (const b of (typeof ASC !== "undefined" && ASC.sword) || [])
    for (const row of b.t || [])
      for (const t of row)
        if (t.n === "盾擊" && t.e && t.e.armorp === 30) {
          t.e.armorp = 20;
          if (t.d) t.d = String(t.d).replace("護甲 +30%", "護甲 +20%");
        }
}

// ---------------------------------------------------------------------------
// 3. 未使用的角色離線也有掉落（25%）
function v126OfflineInstall() {
  const og = offlineGains;
  offlineGains = function (t, a, s, ...x) {
    return og.call(this, t, a, false, ...x);
  };
  const fix = (s) => (typeof s === "string" ? s.replace("未使用的角色只累積經驗，沒有掉落。", "未使用的角色也會累積經驗與掉落（掉落 25%）。").replace("未使用的角色沒有離線掉落。", "未使用的角色同樣是線上的 25%。").replace("未使用的角色只累積離線經驗，沒有掉落。", "未使用的角色也會累積離線經驗與掉落（掉落 25%）。") : s);
  for (const k of ["off", "chars"]) for (const r of HELP[k]?.[1] || []) if (Array.isArray(r)) r[1] = fix(r[1]);
}

// ---------------------------------------------------------------------------
// 4. 鍛造大師改為終極天賦：舊存檔的處理
function v126ForgeFix() {
  const T = S?.roTree;
  if (!T || typeof roTreeUltimates !== "function") return;
  const bad = (r) => r && r.nvit4 && (S.lvl < 60 || roTreeUltimates(r) > 2 || roTreeUsed(r) > roTreeBudget());
  let n = 0;
  if (bad(T.ranks)) {
    delete T.ranks.nvit4;
    n++;
  }
  for (const p of T.pages || [])
    if (bad(p.r)) {
      delete p.r.nvit4;
      n++;
    }
  if (!n) return;
  try {
    if (typeof roTreeEnsure === "function") roTreeEnsure();
  } catch (e) {}
  recalc();
  markDirty();
  setTimeout(() => toast("「鍛造大師」改為終極天賦（30 點）：點數不足、終極已滿或未滿 Lv60，已退回投入的點數", "lvl", 1), 1200);
}

// ---------------------------------------------------------------------------
// 6. 活動深淵的說明：補上升階步驟
function v126AbyHelp() {
  if (typeof SS === "undefined" || typeof V56_ABY === "undefined") return;
  const up = `① 在活動地圖卡片下方的選單切換到目前開放的最高階；② 收集 ${SS.fragN} 片同一位神的生態印記（活動地圖的海葵、水波利、蛇髮女妖各有 ${+(SS.frag * 100).toFixed(2)}% 機率掉落）；③ 在活動地圖挑戰這位神的化身並擊敗，就會開放下一階（最高 ${V56_ABY.max} 階）。在較低的階級擊敗化身不會升階；挑戰失敗不退還印記。`;
  const rows = HELP.v65aby?.[1];
  if (Array.isArray(rows) && !rows.some((r) => r[0] === "升階")) {
    const i = rows.findIndex((r) => r[0] === "開放");
    rows.splice(i < 0 ? 0 : i + 1, 0, ["升階", up]);
  }
  const sr = HELP.season?.[1]?.find((r) => r[0] === "活動深淵");
  if (sr && !String(sr[1]).includes("升階")) sr[1] += `升階：切換到最高階，用 ${SS.fragN} 片生態印記挑戰並擊敗任一位神的化身，開放下一階（最高 ${V56_ABY.max} 階）。`;
}

// ---------------------------------------------------------------------------
const V126_CSS = `
#v126cover{position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;background:rgba(8,5,14,.72);padding:16px}
#v126cover[hidden]{display:none}
#v126cover .v126box{background:#fbfdff;border:1px solid #9fb3c8;border-radius:6px;padding:16px 18px;max-width:360px;width:100%;text-align:center;color:#2b3440;box-shadow:0 6px 24px rgba(0,0,0,.35)}
#v126cover b{font-size:16px}
#v126cover p{margin:8px 0 0;font-size:13px;color:#5d7186;line-height:1.6}
#v126cover .v126row{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:12px}
@media (max-width:760px){html.v126web #sheetBg{padding-bottom:calc(64px + env(safe-area-inset-bottom,0px))}}`;

function v126Install() {
  if (typeof document !== "undefined" && !document.getElementById("v126css")) {
    const st = document.createElement("style");
    st.id = "v126css";
    st.textContent = V126_CSS;
    document.head.appendChild(st);
  }
  v126ArmorInstall();
  v126OfflineInstall();
  for (const [k, id] of Object.entries(V126_ICON)) if (typeof roItemFiles !== "undefined" && UNIQUE[k]) roItemFiles["u_" + k] = id;
  v126AbyHelp();
  v126CloudInstall();
  v126LocalInstall();
  const sg = startGame;
  startGame = function (...a) {
    const r = sg.apply(this, a);
    try {
      v126ForgeFix();
      if (V126.on && S) V126.cur = S.cid;
    } catch (e) {}
    return r;
  };
  if (typeof document !== "undefined") {
    document.addEventListener(
      "click",
      (e) => {
        const b = e.target.closest && e.target.closest("[data-v126]");
        if (b) {
          e.preventDefault();
          e.stopImmediatePropagation();
          const k = b.dataset.v126;
          if (k === "retry") {
            if (V126.go && !V126.bootOk) return void V126.go();
            V126.retryAt = 0;
            return void v126Upload();
          }
          if (k === "local") return v126Logout("已改用本機角色");
          if (k === "reload") return v126Reload();
          return;
        }
        // 雲端角色：不能使用匯出／匯入
        if (V126.on && e.target.closest && e.target.closest("[data-ro-save]")) {
          e.preventDefault();
          e.stopImmediatePropagation();
          toast("雲端角色不能匯出或匯入存檔", "bad");
        }
      },
      true,
    );
    setTimeout(() => {
      try {
        const m = sessionStorage.getItem("v126msg");
        if (m) {
          sessionStorage.removeItem("v126msg");
          toast(m, "lvl", 1);
        }
      } catch (e) {}
    }, 2500);
  }
  if (HELP.bind) {
    HELP.bind[1] = [
      ["雲端角色", "在「選單 → 綁定」用 Google 登入後，改用這個帳號的雲端角色；這台裝置原本的本機角色（包含「匯入檔案」匯入的存檔）不會上傳，帳號還沒有雲端角色時需要建立新角色，登出後可以回到本機角色。只記錄帳號識別碼（雜湊後），不儲存 Email。"],
      ["以雲端為準", "每次開啟都從雲端載入角色；本機只當暫存，被修改也不會讀進來。雲端角色不能匯出、匯入，也不能用舊存檔覆蓋雲端。"],
      ["自動上傳", "每 3 分鐘自動上傳一次，切走或關閉頁面時也會上傳；也可以按「立即上傳」。"],
      ["連線", "雲端角色需要連線才能開始遊戲；遊戲中上傳失敗超過 3 分鐘會暫停，恢復連線後自動繼續。"],
      ["離線收益", "雲端角色的離線時間以伺服器時間計算，修改電腦時間不會增加離線收益。"],
      ["檢查", "伺服器會檢查等級不能倒退、等級與 Zeny 的增加速度，以及技能寶石合成（合成變異寶石必須用掉 3 顆同技能的變異寶石，憑空多出的合成寶石對不上）；超過合理範圍時拒收這次上傳（重新載入上一次的雲端存檔），並把帳號排除在線上排行之外。"],
      ["排行與聊天", "只有雲端角色可以上傳線上排行、在聊天室發言；未登入時仍可用本機角色遊玩。"],
      ["一台裝置", "同一個 Google 帳號同時只能在一台裝置遊玩：在新裝置開啟後，舊裝置會停止並顯示「遊戲在另一台裝置進行中」。"],
      ["登出與刪除", "登出後回到本機角色，雲端角色仍保留；刪除雲端存檔會永久刪除這個帳號的雲端角色。"],
      ["注意", "在 LINE、Threads 等 App 內開啟時無法登入 Google，請改用 Chrome 或 Safari。"],
    ];
  }
}
if (typeof roV4Install === "function") {
  const r4v126 = roV4Install;
  roV4Install = function () {
    r4v126.apply(this, arguments);
    try {
      v126Install();
    } catch (e) {
      console.error("v126", e);
    }
  };
}
