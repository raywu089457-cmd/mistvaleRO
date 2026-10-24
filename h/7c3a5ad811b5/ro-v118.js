/* 流浪仙境 v1.1.5（內部 v11.8）：線上排行防作弊、變異寶石漸層外框、城鎮切換角色
   1. 線上排行：上傳必須綁定 Google（伺服器驗證登入憑證）；沒綁定時這場紀錄先保留，綁定後自動補傳
   2. 管理員（Firebase chat/admin/<帳號代碼>）：快照畫面「刪除並封鎖」——刪除紀錄、同帳號其他角色的紀錄一併刪除、
      之後不能再上傳、聊天室禁言；線上排行頁「封鎖名單」可解除封鎖
   3. 存檔防竄改：角色存檔、備份（含雲端存檔）與共用倉庫存檔時附上驗證碼；讀檔時驗證，
      存檔資料被修改過的角色會標記，之後不能上傳線上排行、不能在聊天室發言（標記會一直保留）
   4. 技能盤：變異寶石外框改為漸層色（變異：金→橘→紅；多重變異：彩虹）
   5. 修正：在城鎮裡切換、建立、刪除角色時顯示「挑戰中無法切換角色」 */

const V118 = {
  reg: "ro-wanderer.v3.zr", // 驗證紀錄（這台裝置第一次替各角色簽章的時間）
  K: "xjro❦流浪仙境·z9q", // 驗證碼用的鍵
  pend: null, // 尚未上傳的武鬥場紀錄（等待綁定）
  pendTok: "",
  sending: 0,
  raw: 0, // lsRepack 期間：原樣寫回，不重新簽章
  adm: null, // { acc, v }
  admBusy: 0,
  bans: null,
  armed: "",
  told: "",
  stRaw: null,
  grad: {
    mu: ["#ffc23a", "#f0801e", "#d8262c"], // 變異：金→橘→紅
    multi: ["#ff3b3b", "#ff9f1a", "#ffe03a", "#3ccf5a", "#2f8fff", "#9a4dff"], // 多重變異：彩虹
  },
};
const v118Esc = (s) => (typeof esc === "function" ? esc(String(s ?? "")) : String(s ?? ""));

// ---------------------------------------------------------------------------
// 3. 存檔驗證碼
function v118H(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
}
// 備份載入時會刪掉字串裡的 < > " ' ` \，所以驗證時一律不計這些字元
const v118Norm = (json) => json.replace(/[<>"'`\\]/g, "");
const v118Sig = (json) => v118H(V118.K + v118Norm(json) + V118.K, 0x5a17);
const V118_TAIL = /,"zq":"([^"]*)"\}$/;
// 物件最外層的 "t"（存檔時間）原始文字
function v118TopT(s) {
  let d = 0;
  for (let i = 0, n = s.length; i < n; i++) {
    const c = s.charCodeAt(i);
    if (c === 34) {
      const st = i;
      for (i++; i < n; i++) {
        const ch = s.charCodeAt(i);
        if (ch === 92) i++;
        else if (ch === 34) break;
      }
      if (d === 1 && i - st === 2 && s.charCodeAt(st + 1) === 116 && s.charCodeAt(i + 1) === 58) {
        const m = /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(s.slice(i + 2, i + 40));
        return m ? m[0] : "";
      }
    } else if (c === 123 || c === 91) d++;
    else if (c === 125 || c === 93) d--;
  }
  return "";
}
function v118RegGet() {
  try {
    const r = JSON.parse(localStorage.getItem(V118.reg));
    if (r && typeof r === "object") return { c: r.c && typeof r.c === "object" ? r.c : {}, x: r.x ? 1 : 0 };
  } catch (e) {}
  return { c: {}, x: 0 };
}
function v118RegPut(r) {
  try {
    localStorage.setItem(V118.reg, JSON.stringify(r));
  } catch (e) {}
}
function v118RegMark(cid) {
  if (!cid) return;
  const r = v118RegGet();
  if (r.c[cid]) return;
  r.c[cid] = Date.now();
  v118RegPut(r);
}
// 角色存檔字串（JSON）加上驗證碼：…,"zq":"<驗證碼>:<存檔時間>"}
function v118SignStr(s, cid) {
  if (typeof s !== "string" || s.length < 3 || s[0] !== "{" || s[s.length - 1] !== "}" || V118_TAIL.test(s)) return s;
  v118RegMark(cid);
  return s.slice(0, -1) + `,"zq":"${v118Sig(s)}:${v118TopT(s)}"}`;
}
// 物件（備份用）：回傳附上驗證碼的淺拷貝
function v118SignObj(o) {
  const { zq, ...r } = o;
  const json = JSON.stringify(r);
  return { ...r, zq: `${v118Sig(json)}:${r.t == null ? "" : String(r.t)}` };
}
// 讀檔：驗證並移除驗證碼；被修改過的存檔標記 zx（之後一直保留）
function v118Check(o) {
  if (!o || typeof o !== "object" || !o.cls) return o;
  const has = Object.prototype.hasOwnProperty.call(o, "zq"),
    zq = o.zq;
  if (has) delete o.zq;
  try {
    const t = o.t == null ? "" : String(o.t);
    if (has) {
      const m = /^([0-9a-f]{16}):(.*)$/.exec(String(zq ?? ""));
      if (!m) o.zx = 1;
      else if (m[2] === t && m[1] !== v118Sig(JSON.stringify(o))) o.zx = 1;
      // 存檔時間不同：舊版遊戲讀過簽章存檔後又存了一次 → 視為沒有驗證碼的舊存檔
    } else {
      // 沒有驗證碼：舊存檔可以；這台裝置已經替這個角色簽章過、卻出現更新的無驗證碼存檔 → 驗證碼被刪掉
      const at = v118RegGet().c[o.cid];
      if (at && +o.t >= at) o.zx = 1;
    }
  } catch (e) {}
  return o;
}
// 共用倉庫：存檔字串直接驗證
function v118StashCheck() {
  let raw = null;
  try {
    raw = localStorage.getItem(STASH_KEY);
  } catch (e) {}
  if (!raw || raw === V118.stRaw) return;
  V118.stRaw = raw;
  const m = V118_TAIL.exec(raw);
  if (!m) return;
  const body = raw.slice(0, m.index) + "}";
  if (m[1] === v118Sig(body) + ":s") return;
  const r = v118RegGet();
  if (!r.x) {
    r.x = 1;
    v118RegPut(r);
  }
  v118Flag();
}
const v118Bad = () => !!(typeof S !== "undefined" && S && S.zx);
function v118Flag() {
  if (typeof S === "undefined" || !S) return;
  if (!S.zx) {
    S.zx = 1;
    if (typeof markDirty === "function") markDirty();
  }
  if (V118.told === S.cid) return;
  V118.told = S.cid;
  setTimeout(() => toast("存檔驗證失敗：這個角色（或共用倉庫）的存檔資料被修改過，之後無法上傳線上排行、無法在聊天室發言", "bad", 1), 800);
}

function v118SaveInstall() {
  if (typeof lsPut !== "function" || typeof SAVE_KEY === "undefined" || typeof CHAR_KEY !== "function") return;
  const CP = CHAR_KEY("");
  const cidOf = (k) => (k === SAVE_KEY ? (typeof S !== "undefined" && S ? S.cid : "") : typeof k === "string" && k.startsWith(CP) ? k.slice(CP.length) : null);
  const sign = (k, v) => {
    if (V118.raw) return v;
    const cid = cidOf(k);
    if (cid == null) return v;
    try {
      return v118SignStr(v, cid);
    } catch (e) {
      return v;
    }
  };
  const lp = lsPut;
  lsPut = function (k, v, ...a) {
    return lp.call(this, k, sign(k, v), ...a);
  };
  if (typeof lsPutNow === "function") {
    const ln = lsPutNow;
    lsPutNow = function (k, v, ...a) {
      return ln.call(this, k, sign(k, v), ...a);
    };
  }
  if (typeof lsRepack === "function") {
    const rp = lsRepack;
    lsRepack = function (...a) {
      V118.raw = 1;
      try {
        return rp.apply(this, a);
      } finally {
        V118.raw = 0;
      }
    };
  }
  if (typeof lsParse === "function") {
    const pa = lsParse;
    lsParse = function (...a) {
      return v118Check(pa.apply(this, a));
    };
  }
  // 備份（匯出、雲端存檔）：目前角色、其他角色、共用倉庫都附上驗證碼
  if (typeof bkData === "function") {
    const bd = bkData;
    bkData = function (...a) {
      const d = bd.apply(this, a);
      try {
        if (d && d.cur && typeof d.cur === "object") {
          d.cur = v118SignObj(d.cur);
          v118RegMark(d.cur.cid);
        }
        for (const [k, c] of Object.entries(d?.chars || {})) if (c && typeof c === "object") d.chars[k] = v118SignObj(c);
        if (d && d.stash) d.zs = v118Sig(JSON.stringify(d.stash));
      } catch (e) {}
      return d;
    };
  }
  if (typeof bkDecode === "function") {
    const bc = bkDecode;
    bkDecode = async function (...a) {
      const s = await bc.apply(this, a);
      try {
        if (s && s.zs && s.stash && s.zs !== v118Sig(JSON.stringify(s.stash))) {
          // 備份裡的共用倉庫被修改過：備份裡的角色、以及之後在這台裝置載入的角色都標記
          if (s.cur) s.cur.zx = 1;
          for (const c of Object.values(s.chars || {})) if (c) c.zx = 1;
          s.v118x = 1;
        }
      } catch (e) {}
      return s;
    };
  }
  if (typeof bkApply === "function") {
    const ba = bkApply;
    bkApply = function (t, ...a) {
      try {
        if (t && t.v118x) {
          const r = v118RegGet();
          r.x = 1;
          v118RegPut(r);
        }
      } catch (e) {}
      return ba.call(this, t, ...a);
    };
  }
  // 共用倉庫：寫入時附上驗證碼、讀取時驗證
  if (typeof Storage !== "undefined" && typeof STASH_KEY !== "undefined") {
    const si = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (k === STASH_KEY && typeof v === "string" && v[0] === "{" && v[v.length - 1] === "}" && !V118_TAIL.test(v))
        try {
          v = v.slice(0, -1) + `,"zq":"${v118Sig(v)}:s"}`;
          V118.stRaw = v;
        } catch (e) {}
      return si.call(this, k, v);
    };
  }
  if (typeof stLoad === "function") {
    const sl = stLoad;
    stLoad = function (...a) {
      try {
        v118StashCheck();
      } catch (e) {}
      return sl.apply(this, a);
    };
  }
  // 角色載入後：被標記的角色提示一次
  if (typeof startGame === "function") {
    const sg = startGame;
    startGame = function (...a) {
      const r = sg.apply(this, a);
      try {
        if (S && (S.zx || v118RegGet().x)) v118Flag();
      } catch (e) {}
      return r;
    };
  }
}

// ---------------------------------------------------------------------------
// 1. 線上排行：上傳需要綁定 Google
const v118Bound = () => typeof v98On === "function" && v98On() && !!V98C.tok;
const v118Acc = () => (typeof V98C !== "undefined" && V98C.tok ? String(V98C.tok).split(".")[0] : "");
async function v118Submit(rec) {
  if (!v6RkOn() || !rec) return;
  if (v118Bad()) {
    V118.pend = null;
    toast("線上排行：這個角色的存檔驗證失敗（存檔資料被修改過），無法上傳", "bad");
    return;
  }
  if (!v118Bound()) {
    V118.pend = rec;
    V118.pendTok = "";
    toast("線上排行需要綁定 Google 才能上傳：到選單「綁定」登入後，這場紀錄會自動補傳", "bad", 1);
    return;
  }
  const tok = V98C.tok;
  V118.pend = null;
  V118.sending = 1;
  try {
    const r = await fetch(V6RK.api, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer " + tok },
      body: JSON.stringify(rec),
    });
    const j = await r.json().catch(() => ({ error: r.status }));
    V6RK.last = j;
    V6RK.at = 0;
    if (j.ok && j.best) toast(`線上排行：新紀錄！第 ${rec.floor} 層（${v6Sec(rec.sec)}），目前排名第 ${j.rank} 名`, "lvl", 1);
    else if (j.ok) toast(`線上排行：這場第 ${rec.floor} 層，未超過你的最佳紀錄（第 ${j.rec?.floor} 層）`, "lvl");
    else if (j.error === "bind") {
      V118.pend = rec;
      V118.pendTok = tok;
      toast("線上排行上傳失敗：Google 登入已過期，請到選單「綁定」重新登入，登入後會自動補傳這場紀錄", "bad", 1);
    } else if (j.error === "banned") toast("線上排行：這個角色或帳號已被管理員封鎖，無法上傳", "bad", 1);
    else toast("線上排行上傳失敗：" + (j.error || r.status), "bad");
  } catch (e) {
    toast("線上排行上傳失敗（連線問題）", "bad");
  }
  V118.sending = 0;
}
// 綁定（或重新登入）後補傳
function v118Retry() {
  const p = V118.pend;
  if (!p || V118.sending || !v118Bound() || !S || S.cid !== p.id || V98C.tok === V118.pendTok) return;
  v118Submit(p);
}

// ---------------------------------------------------------------------------
// 2. 管理員
const v118IsAdm = () => !!((V118.adm && V118.adm.acc === v118Acc() && V118.adm.v) || (typeof V114C !== "undefined" && V114C.adm));
function v118RankApi(body) {
  return fetch(V6RK.api, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + V98C.tok },
    body: JSON.stringify(body),
  })
    .then((r) => r.json().catch(() => ({ error: r.status })))
    .catch(() => ({ error: "net" }));
}
async function v118AdmCheck() {
  if (!v6RkOn() || !v118Bound() || V118.admBusy) return;
  const acc = v118Acc();
  if (V118.adm && V118.adm.acc === acc) return;
  V118.admBusy = 1;
  const j = await v118RankApi({ op: "adm" });
  V118.admBusy = 0;
  if (j.error === "net") return;
  V118.adm = { acc, v: !!j.adm };
  if (j.adm && ui.tab === "more" && ui.moreView === "orank") ui.render();
}
const V118_AERR = { adm: "沒有管理員權限", cfg: "伺服器還沒設定管理員功能（FIREBASE_SA）", bind: "Google 登入已過期，請重新登入", net: "連線失敗", srv: "伺服器忙碌中，請稍後再試" };
async function v118Ban(id, name) {
  const j = await v118RankApi({ op: "ban", id });
  if (!j.ok) return toast("刪除並封鎖失敗：" + (V118_AERR[j.error] || j.error), "bad");
  const more = Math.max(0, (j.ids?.length || 1) - 1);
  toast(`已刪除並封鎖「${name || id}」${more ? `（同帳號另外 ${more} 個角色一併刪除並封鎖）` : ""}${j.acc ? (j.mute ? "，聊天室已禁言" : "") : "（這筆紀錄沒有綁定帳號，只封鎖這個角色）"}`, "lvl", 1);
  for (const x of j.ids || [id]) delete V6RK_REC["v6:" + x];
  V6RK.list = null;
  V6RK.at = 0;
  V118.bans = null;
  if (typeof sheetOff === "function") sheetOff();
  if (ui.tab === "more" && ui.moreView === "orank") ui.render();
  v6RkFetch(true);
}
async function v118Unban(id) {
  const j = await v118RankApi({ op: "unban", id });
  if (!j.ok) return toast("解除封鎖失敗：" + (V118_AERR[j.error] || j.error), "bad");
  toast("已解除封鎖（玩家下次上傳紀錄後會重新出現在排行榜）", "lvl");
  V118.bans = null;
  v118BansOpen();
}
async function v118BansOpen() {
  const sh = $("#sheet");
  sh.className = "wide v118-sheet";
  $("#sheetBg").hidden = false;
  if (!V118.bans) {
    sh.innerHTML = `<h2>封鎖名單</h2><p class="note">讀取中…</p>`;
    const j = await v118RankApi({ op: "bans" });
    if (!j.ok) {
      sh.innerHTML = `<h2>封鎖名單</h2><p class="note">${v118Esc(V118_AERR[j.error] || j.error)}</p><div class="row"><span class="spacer"></span><button class="btn" data-act="close">關閉</button></div>`;
      return;
    }
    V118.bans = j.list || [];
  }
  const L = V118.bans,
    rows = L.length
      ? L.map(
          (b) =>
            `<div class="li v118ban"><span class="grow"><b>${v118Esc(b.name || "（無名）")}</b> <small>${v118Esc(V6_CLS_N[b.cls] || b.cls || "")}${b.floor ? `・第 ${b.floor} 層` : ""}・${new Date(b.t).toLocaleString()}</small><br><small class="note">角色 ${v118Esc(b.id)}・帳號代碼 ${v118Esc(b.a || "未綁定")}</small></span><button class="btn sm" data-v118="unban" data-id="${v118Esc(b.id)}">解除封鎖</button></div>`,
        ).join("")
      : `<p class="note">目前沒有封鎖的角色。</p>`;
  sh.innerHTML = `<h2>封鎖名單 <small>共 ${L.length} 個角色</small></h2><p class="note" style="margin:0 0 6px">被封鎖的角色與帳號不能上傳線上排行，帳號在聊天室被禁言；解除封鎖會一併解除禁言。</p><div class="list">${rows}</div><div class="row"><span class="spacer"></span><button class="btn" data-act="close">關閉</button></div>`;
}

// ---------------------------------------------------------------------------
// 4. 變異寶石外框：漸層
function v118GemInstall() {
  if (typeof gemOverlay !== "function" || typeof V91 === "undefined") return;
  const go = gemOverlay,
    edge = `fill="${V91.col.mu.edge}"`;
  gemOverlay = function (gem, sel, ...x) {
    const h = go.call(this, gem, sel, ...x);
    if (!gem || !gem.mu || sel || gem.sx || typeof h !== "string" || !h.includes(edge)) return h;
    const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(h);
    if (!m) return h;
    const id = "v118g" + String(gem.u).replace(/[^\w-]/g, ""),
      C = gem.mu.multi ? V118.grad.multi : V118.grad.mu,
      stops = C.map((c, i) => `<stop offset="${(i / (C.length - 1)).toFixed(3)}" stop-color="${c}"/>`).join(""),
      defs = `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${m[1]}" y2="${m[2]}">${stops}</linearGradient></defs>`;
    return h.replace(/(<svg[^>]*>)/, "$1" + defs).split(edge).join(`fill="url(#${id})"`);
  };
}

// ---------------------------------------------------------------------------
// 5. 城鎮裡可以切換、建立、刪除角色（城鎮是用場地做的，原本被當成挑戰中）
function v118CharInstall() {
  if (typeof ui.chAct !== "function") return;
  const ca = ui.chAct;
  ui.chAct = function (t, a, ...x) {
    if (!(typeof v113In === "function" && v113In()) || !["chNew", "chUse", "chDel"].includes(t)) return ca.call(this, t, a, ...x);
    const g = G,
      A = g.arena;
    g.arena = null;
    try {
      return ca.call(this, t, a, ...x);
    } finally {
      if (g.arena == null) g.arena = A;
    }
  };
}

function v118Install() {
  v118SaveInstall();
  v118GemInstall();
  v118CharInstall();
  if (typeof v6RkSubmit === "function") v6RkSubmit = v118Submit;
  if (typeof setInterval === "function") setInterval(() => {
    try {
      v118Retry();
    } catch (e) {}
  }, 3000);
  // 聊天室：存檔被修改過的角色不能發言
  if (typeof v114Api === "function" && typeof V114_ERR !== "undefined") {
    V114_ERR.zx = "這個角色的存檔驗證失敗（存檔資料被修改過），無法在聊天室發言";
    const api = v114Api;
    v114Api = function (body, ...x) {
      if (v118Bad() && body && (body.op === "say" || body.op === "me")) return Promise.resolve({ err: "zx" });
      return api.call(this, body, ...x);
    };
  }
  // 線上排行頁：綁定提示、帳號代碼、管理員的封鎖名單
  if (typeof ui.m_orank === "function") {
    const mo = ui.m_orank;
    ui.m_orank = function (...a) {
      let h = mo.apply(this, a);
      if (typeof h !== "string" || !v6RkOn()) return h;
      h = h.replace("無限武鬥場結束時自動上傳；", "無限武鬥場結束時自動上傳（需要綁定 Google）；");
      const warn = [];
      if (v118Bad()) warn.push("這個角色的存檔驗證失敗（存檔資料被修改過），無法上傳線上排行。");
      else if (!v118Bound()) warn.push(`尚未綁定 Google：武鬥場紀錄不會上傳。到選單「綁定」登入後${V118.pend ? "，剛才那場紀錄會自動補傳" : "即可上傳"}。`);
      if (warn.length) h = h.replace("<h2>線上排行・無限武鬥場</h2>", `$&<div class="box v118warn"><p class="note" style="margin:0">${warn.join("<br>")}</p></div>`);
      v118AdmCheck();
      const acc = v118Bound() ? v118Acc() : "";
      if (acc || v118IsAdm())
        h += `<div class="row v118foot">${acc ? `<span class="note">帳號代碼 ${v118Esc(acc)}</span>` : ""}<span class="spacer"></span>${v118IsAdm() ? '<button class="btn sm" data-v118="bans">封鎖名單（管理員）</button>' : ""}</div>`;
      return h;
    };
  }
  // 快照畫面：管理員的「刪除並封鎖」
  if (ui.snapOpen) {
    const so = ui.snapOpen;
    ui.snapOpen = function (t, ...a) {
      const r = so.call(this, t, ...a);
      try {
        const x = t && t.v6 && typeof V6RK_REC !== "undefined" ? V6RK_REC[t.p] : null;
        if (x && v118IsAdm()) {
          const box = $("#sheet").querySelector(".v6rk-ex");
          if (box && !box.querySelector(".v118adm"))
            box.insertAdjacentHTML(
              "beforeend",
              `<div class="row v118adm"><button class="btn sm v118banb" data-v118="ban" data-id="${v118Esc(x.id)}" data-n="${v118Esc(x.name)}">刪除並封鎖</button><span class="note" style="margin:0">管理員：刪除這筆紀錄、同帳號其他角色的紀錄，並禁止再上傳、聊天室禁言</span></div>`,
            );
        }
      } catch (e) {}
      return r;
    };
  }
  document.addEventListener(
    "click",
    (e) => {
      const b = e.target.closest && e.target.closest("[data-v118]");
      if (!b) return;
      e.preventDefault();
      e.stopPropagation();
      const k = b.dataset.v118;
      if (k === "ban") {
        const id = b.dataset.id;
        if (V118.armed !== id) {
          V118.armed = id;
          b.textContent = "再按一次確認刪除並封鎖";
          b.classList.add("armed");
          setTimeout(() => {
            if (V118.armed === id) {
              V118.armed = "";
              if (b.isConnected) {
                b.textContent = "刪除並封鎖";
                b.classList.remove("armed");
              }
            }
          }, 5000);
          return;
        }
        V118.armed = "";
        b.disabled = true;
        b.textContent = "處理中…";
        v118Ban(id, b.dataset.n);
      } else if (k === "bans") v118BansOpen();
      else if (k === "unban") {
        b.disabled = true;
        v118Unban(b.dataset.id);
      }
    },
    true,
  );
  if (!document.getElementById("v118css")) {
    const st = document.createElement("style");
    st.id = "v118css";
    st.textContent = `.v118adm{gap:8px;flex-wrap:wrap;align-items:center;margin-top:2px}
.v118banb{color:#b3261e;border-color:#d9776f}
.v118banb.armed{background:#b3261e;color:#fff;border-color:#b3261e}
.v118warn{margin-bottom:6px;border-color:#d9a13f}
.v118foot{margin-top:6px;gap:8px}
.v118-sheet{max-width:640px;max-height:86vh;overflow:auto}
.v118ban{display:flex;align-items:center;gap:8px}`;
    document.head.appendChild(st);
  }
  if (HELP.tower && Array.isArray(HELP.tower[1])) {
    HELP.tower[1].push(["上傳條件", "線上排行需要綁定 Google（選單「綁定」）才能上傳；沒綁定時這場紀錄會先保留，登入後自動補傳（重新整理頁面前）。"]);
    HELP.tower[1].push(["防作弊", "存檔、備份與共用倉庫都附有驗證碼，存檔資料被修改過的角色無法上傳線上排行、無法在聊天室發言。管理員可以刪除不合理的紀錄並封鎖該角色與帳號（之後不能再上傳、聊天室禁言）。"]);
  }
}
if (typeof roV4Install === "function") {
  const r4v118 = roV4Install;
  roV4Install = function () {
    r4v118();
    v118Install();
  };
}
