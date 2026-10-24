/* 流浪仙境 v1.1.1（內部 v11.4）：即時聊天室、無限武鬥場 Lv.50 開放、線上排行榜前 100 名
   1. 聊天室（下方分頁原本「煉金」的位置）＋戰鬥畫面左下的小聊天框；訊息由 Firebase Realtime Database 即時傳送
      ・發言條件：已綁定 Google，且這個角色有無限武鬥場線上排行榜紀錄
      ・發言時附上職業、等級、武鬥場最高層數與名次；排行榜總榜前三名有動態徽章（最強／榜二／榜三）
      ・每則訊息都送到伺服器（/api/chat）驗證後由伺服器寫入 Firebase，玩家只能讀取；名字、層數、名次、徽章無法偽造
      ・每 5 秒 1 則、每則 60 字以內、不能連續重複、常見髒話以＊顯示；可封鎖玩家（只影響自己）；管理員可刪訊息、禁言
      ・切到背景超過 1 分鐘自動斷線，回來自動重新連線；只在網址版啟用
   2. 無限武鬥場 Lv.30 → Lv.50 開放（MVP 武道場不變）
   3. 線上排行榜顯示前 50 → 前 100 名（伺服器 rank.mjs） */

const V114 = {
  api: "/api/chat",
  db: "https://xianjingro-default-rtdb.asia-southeast1.firebasedatabase.app",
  max: 60, // 每則字數上限
  gap: 5000, // 發言間隔（毫秒；伺服器也會檢查）
  keep: 100, // 顯示的訊息數
  hideOff: 60e3, // 切到背景多久後斷線
  box: 4, // 戰鬥畫面聊天框顯示幾則
  arenaLv: 50,
  lsBlock: "ro-wanderer.v3.chatBlock",
  lsSeen: "ro-wanderer.v3.chatSeen",
};
const V114C = {
  es: null,
  st: "off", // off／conn／on／err
  msgs: new Map(),
  loaded: false,
  seen: new Set(),
  me: null,
  passing: null,
  sending: false,
  last: 0,
  lastTxt: "",
  err: "",
  info: "",
  unread: 0,
  seenTs: null,
  hideT: 0,
  retryAt: 0,
  menu: null,
  muted: false,
  adm: false,
  block: new Set(),
  raf: 0,
  icon: "",
  failAt: 0,
};
try {
  for (const u of JSON.parse(localStorage.getItem(V114.lsBlock)) || []) if (typeof u === "string") V114C.block.add(u);
  const t = +localStorage.getItem(V114.lsSeen);
  if (t > 0) V114C.seenTs = t;
} catch (e) {}
const V114_BAD = ["幹你", "幹您", "幹妳", "幹拎", "幹林", "姦你", "操你", "肏", "靠北", "靠杯", "機掰", "雞掰", "機八", "雞巴", "雞歪", "他媽的", "她媽的", "你媽的", "媽的", "王八蛋", "賤人", "婊子", "白癡", "白痴", "智障", "腦殘", "去死", "fuck", "shit", "bitch", "cunt"];
const V114_BADGE = { 1: "最強", 2: "榜二", 3: "榜三" };
const V114_ERR = {
  cfg: "聊天室尚未開放（伺服器還沒設定好）",
  bind: "Google 登入已過期，請到選單「綁定」重新登入",
  rank: "還沒有無限武鬥場的線上排行榜紀錄：連網打完一場武鬥場後再試",
  own: "排行榜紀錄驗證失敗",
  rl: "太頻繁了，請稍後再試",
  bad: "資料錯誤",
  net: "暫時無法連線聊天室",
  mute: "你已被管理員禁言",
  long: "每則最多 60 個字",
  empty: "請輸入訊息",
  dup: "不能連續發送相同的訊息",
  srv: "伺服器忙碌中，請稍後再試",
};

const v114On = () => !!((typeof v98Web === "function" && v98Web()) || (typeof window !== "undefined" && window.V114_TEST));
const v114Bound = () => typeof v98On === "function" && v98On();
const v114Acc = () => (typeof V98C !== "undefined" && V98C.tok ? String(V98C.tok).split(".")[0] : "");
const v114Arena = () => (S?.roArena?.best || 0) >= 1;
const v114Can = () => v114On() && v114Bound() && v114Arena();
const v114Clean = (s) =>
  String(s ?? "")
    .replace(/[\u0000-\u001f\u007f\u200b-\u200f\u2028-\u202e\u2060-\u2064\ufeff]/g, "")
    .replace(/\s+/g, " ")
    .trim();
function v114Filter(s) {
  let t = String(s ?? "");
  for (const w of V114_BAD) {
    const re = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    t = t.replace(re, (m) => "＊".repeat([...m].length));
  }
  return t;
}
const v114Hm = (ts) => {
  const d = new Date(+ts || Date.now());
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
};
function v114Job(m) {
  const b = String(m.b && m.b !== "-" ? m.b : "").replace(/（[^）]*）$/, "");
  return b || (typeof V6_CLS_N !== "undefined" && V6_CLS_N[m.c]) || CLASS?.[m.c]?.n || m.c || "";
}
function v114Badge(g, mini) {
  return V114_BADGE[g] ? `<span class="v114g g${g}${mini ? " mini" : ""}">${mini ? "★" : "★ " + V114_BADGE[g]}</span>` : "";
}
const v114List = () =>
  [...V114C.msgs.entries()]
    .filter(([, m]) => m && typeof m === "object" && typeof m.t === "string")
    .sort((a, b) => (+a[1].ts || 0) - (+b[1].ts || 0) || (a[0] < b[0] ? -1 : 1));

// ---------------------------------------------------------------------------
// 接收：Firebase 即時串流（EventSource，不需要登入）
function v114Connect() {
  if (!v114On() || V114C.es || typeof EventSource === "undefined" || Date.now() < V114C.retryAt) return;
  const url = `${V114.db}/chat/m.json?orderBy=${encodeURIComponent('"ts"')}&limitToLast=${V114.keep}`;
  let es;
  try {
    es = new EventSource(url);
  } catch (e) {
    V114C.st = "err";
    V114C.retryAt = Date.now() + 15e3;
    return;
  }
  V114C.es = es;
  V114C.st = "conn";
  V114C.loaded = false;
  const on = (ev) => {
    try {
      v114Apply(ev.type, JSON.parse(ev.data));
    } catch (e) {}
  };
  es.addEventListener("put", on);
  es.addEventListener("patch", on);
  es.addEventListener("cancel", () => v114Close("err"));
  es.onopen = () => {
    V114C.st = "on";
    v114Paint();
  };
  es.onerror = () => {
    if (es.readyState === 2) v114Close("err");
    else V114C.st = "conn";
    v114Paint();
  };
  v114Paint();
}
function v114Close(st = "off") {
  if (V114C.es) {
    try {
      V114C.es.close();
    } catch (e) {}
  }
  V114C.es = null;
  V114C.st = st;
  if (st === "err") V114C.retryAt = Date.now() + 15e3;
  v114Paint();
}
function v114Apply(type, d) {
  if (!d || typeof d.path !== "string") return;
  const p = d.path.split("/").filter(Boolean),
    M = V114C.msgs,
    fresh = [];
  const set = (k, v) => {
    if (v && typeof v === "object") {
      if (!M.has(k)) fresh.push(k);
      M.set(k, v);
    } else M.delete(k);
  };
  if (!p.length) {
    if (type === "put") {
      M.clear();
      for (const [k, v] of Object.entries(d.data || {})) set(k, v);
    } else for (const [k, v] of Object.entries(d.data || {})) set(k, v);
  } else if (p.length === 1) {
    if (type === "patch" && M.has(p[0]) && d.data) M.set(p[0], { ...M.get(p[0]), ...d.data });
    else set(p[0], d.data);
  } else if (M.has(p[0])) {
    const m = { ...M.get(p[0]) };
    if (d.data == null) delete m[p[1]];
    else m[p[1]] = d.data;
    M.set(p[0], m);
  }
  // 只保留最新的訊息
  const L = v114List();
  for (const [k] of L.slice(0, Math.max(0, L.length - V114.keep))) M.delete(k);
  V114C.loaded = true;
  v114Unread();
  V114C.st = "on";
  v114Paint(true);
}

// 未讀：比上次看過的最新訊息還新的訊息（含斷線、關閉遊戲期間的訊息；自己的與封鎖的不算）
function v114SeenSave() {
  try {
    localStorage.setItem(V114.lsSeen, String(V114C.seenTs));
  } catch (e) {}
}
function v114Unread() {
  const L = v114List(),
    top = L.length ? +L[L.length - 1][1].ts || 0 : 0;
  if (V114C.seenTs == null) {
    // 第一次使用聊天室：之前的訊息不算未讀
    V114C.seenTs = top;
    v114SeenSave();
  }
  if (ui.tab === "chat" && !document.hidden) {
    if (top > V114C.seenTs) {
      V114C.seenTs = top;
      v114SeenSave();
    }
    V114C.unread = 0;
  } else {
    const me = v114Acc();
    V114C.unread = L.filter(([, m]) => +m.ts > V114C.seenTs && m.u !== me && !V114C.block.has(m.u)).length;
  }
  ui.badge("chat", V114C.unread ? 1 : 0);
}

// ---------------------------------------------------------------------------
// 發言：每則訊息都送到伺服器（/api/chat）驗證後寫入 Firebase
function v114Api(body) {
  return fetch(V114.api, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + V98C.tok },
    body: JSON.stringify(body),
  })
    .then((r) => r.json().catch(() => ({ err: "net" })))
    .catch(() => ({ err: "net" }));
}
// 發言名片（職業、等級、層數、名次、徽章）與管理員、禁言狀態；5 分鐘內不重複查詢
async function v114Me(force) {
  if (!S || !v114Can()) return null;
  const cid = S.cid,
    acc = v114Acc(),
    m = V114C.me;
  if (!force && m && m.cid === cid && m.acc === acc && Date.now() - m.at < 300e3) return m;
  if (!force && Date.now() - V114C.failAt < 300e3) return null;
  if (V114C.passing) return V114C.passing;
  V114C.passing = (async () => {
    const j = await v114Api({ op: "me", id: cid, tok: v6RkTok() });
    V114C.passing = null;
    if (!j.c) {
      V114C.err = V114_ERR[j.err] || V114_ERR.net;
      V114C.failAt = Date.now();
      v114Paint();
      return null;
    }
    V114C.err = "";
    V114C.me = { c: j.c, uid: j.uid, adm: !!j.adm, muted: !!j.muted, stat: j.stat || null, cid, acc, at: Date.now() };
    V114C.adm = !!j.adm;
    V114C.muted = !!j.muted;
    v114Paint(true);
    return V114C.me;
  })();
  return V114C.passing;
}
async function v114Send(raw) {
  const txt = v114Clean(raw);
  if (!txt) return false;
  if ([...txt].length > V114.max) return v114Info(`每則最多 ${V114.max} 個字`);
  const wait = V114.gap - (Date.now() - V114C.last);
  if (wait > 0) return v114Info(`發言太快了，${Math.ceil(wait / 1000)} 秒後再試`);
  if (txt === V114C.lastTxt && Date.now() - V114C.last < 60e3) return v114Info("不能連續發送相同的訊息");
  if (V114C.muted) return v114Info(V114_ERR.mute);
  if (V114C.sending) return false;
  V114C.sending = true;
  const j = await v114Api({ op: "say", id: S.cid, tok: v6RkTok(), t: txt });
  V114C.sending = false;
  if (j.ok) {
    V114C.last = Date.now();
    V114C.lastTxt = txt;
    V114C.info = "";
    V114C.err = "";
    if (j.c) V114C.me = { ...(V114C.me || {}), c: j.c, uid: j.uid, cid: S.cid, acc: v114Acc(), at: V114C.me?.at || Date.now() };
    v114Paint(true);
    return true;
  }
  if (j.err === "fast") {
    V114C.last = Date.now() - V114.gap + (+j.wait || V114.gap);
    return v114Info(`發言太快了，${Math.ceil((+j.wait || V114.gap) / 1000)} 秒後再試`);
  }
  if (j.err === "mute") V114C.muted = true;
  return v114Info(V114_ERR[j.err] || V114_ERR.net);
}
function v114Info(s) {
  V114C.info = s;
  v114Paint();
  setTimeout(() => {
    if (V114C.info === s) {
      V114C.info = "";
      v114Paint();
    }
  }, 5000);
  return false;
}
// 管理員：刪除訊息、禁言
async function v114Admin(op, k, u) {
  if (!V114C.adm) return;
  const j = await v114Api({ op, k, u });
  if (j.ok) toast(op === "del" ? "已刪除訊息" : op === "mute" ? "已禁言" : "已解除禁言");
  else toast(j.err === "adm" ? "沒有管理員權限" : V114_ERR.net, "bad");
}
function v114Block(u, on) {
  if (!u) return;
  on ? V114C.block.add(u) : V114C.block.delete(u);
  try {
    localStorage.setItem(V114.lsBlock, JSON.stringify([...V114C.block]));
  } catch (e) {}
  v114Paint(true);
}

// ---------------------------------------------------------------------------
// 畫面
function v114Msg(k, m) {
  const me = !!v114Acc() && m.u === v114Acc(),
    open = V114C.menu === k,
    adm = V114C.adm,
    blk = V114C.block.has(m.u);
  const tag = `${esc(v114Job(m))}・Lv.${+m.l || 0}・武鬥場 ${+m.f || 0} 層・第 ${+m.r || 0} 名`;
  const menu = open
    ? `<div class="v114act">${me ? "" : `<button class="btn sm" data-v114="${blk ? "unblock" : "block"}" data-u="${esc(m.u)}">${blk ? "解除封鎖" : "封鎖"}</button>`}${adm ? `<button class="btn sm" data-v114="del" data-k="${esc(k)}">刪除訊息</button><button class="btn sm" data-v114="mute" data-u="${esc(m.u)}">禁言</button><button class="btn sm" data-v114="unmute" data-u="${esc(m.u)}">解除禁言</button>` : ""}<button class="btn sm" data-v114="menu" data-k="">關閉</button></div>`
    : "";
  return `<div class="v114m${me ? " me" : ""}${m.g ? " top" : ""}"><div class="v114h">${v114Badge(+m.g)}<button class="v114n" data-v114="menu" data-k="${esc(k)}">${esc(m.n || "無名")}</button><span class="v114i">${tag}</span><span class="v114t">${v114Hm(m.ts)}</span></div><div class="v114x">${esc(v114Filter(m.t))}</div>${menu}</div>`;
}
function v114ListHtml() {
  const L = v114List().filter(([, m]) => !V114C.block.has(m.u));
  if (!L.length) return `<p class="empty-note">${V114C.st === "on" ? "還沒有人發言，來說第一句話吧！" : V114C.st === "err" ? "無法連線聊天室" : "連線中…"}</p>`;
  return L.map(([k, m]) => v114Msg(k, m)).join("");
}
function v114InputHtml() {
  if (!v114On()) return `<p class="note">聊天室只在網址版開放。</p>`;
  if (!v114Bound()) return `<div class="v114gate"><span>綁定 Google 帳號後才能發言（只記錄帳號識別碼的雜湊值，不儲存 Email）。</span><button class="btn sm primary" data-v114="bind">前往綁定</button></div>`;
  if (!v114Arena()) {
    const lv = S.lvl >= V114.arenaLv;
    return `<div class="v114gate"><span>打過無限武鬥場、有線上排行榜紀錄後才能發言${lv ? "" : `（無限武鬥場 Lv.${V114.arenaLv} 開放）`}。</span>${lv ? '<button class="btn sm primary" data-v114="arena">前往無限武鬥場</button>' : ""}</div>`;
  }
  if (V114C.muted) return `<p class="note" style="color:var(--bad)">${V114_ERR.mute}</p>`;
  const a = V114C.me,
    st = V114C.adm && a?.stat ? `・今日 發言 ${a.stat.say || 0} 則／查詢 ${a.stat.me || 0} 次` : "",
    who = a?.c ? `以「${esc(a.c.n)}」${v114Badge(+a.c.g, 1)} 發言・武鬥場 ${a.c.f} 層・第 ${a.c.r} 名${V114C.adm ? "・管理員" : ""}${st}` : V114C.passing ? "驗證中…" : "";
  return `<div class="v114in"><input id="v114in" class="txt" maxlength="${V114.max}" autocomplete="off" placeholder="輸入訊息（${V114.max} 字以內，Enter 送出）" aria-label="聊天訊息"><button class="btn primary" data-v114="send">送出</button></div><div class="v114who">${who}</div>`;
}
function v114Status() {
  const n = v114List().length;
  return V114C.st === "on" ? `<span class="v114st on">已連線</span>` : V114C.st === "conn" ? `<span class="v114st">連線中…</span>` : `<button class="v114st off" data-v114="reconnect">離線・點此重新連線</button>`;
}
function v114Page() {
  const blk = V114C.block.size,
    acc = v114Bound() ? v114Acc() : "";
  return `<h2 style="display:flex;align-items:center;gap:8px">聊天室${helpBtn("v114")}<span class="spacer"></span>${v114On() ? v114Status() : ""}</h2>
  <div class="v114list" id="v114list">${v114ListHtml()}</div>
  <div id="v114inbox">${v114InputHtml()}</div>
  <div class="v114msg" id="v114msg">${esc(V114C.info || V114C.err || "")}</div>
  <div class="v114foot"><label class="chk"><input type="checkbox" data-v114="box" ${S.set.v114box === 0 ? "" : "checked"}><span>戰鬥畫面顯示聊天框</span></label>${blk ? `<button class="btn sm" data-v114="unblockall">解除全部封鎖（${blk}）</button>` : ""}${acc ? `<span class="note">帳號代碼 ${acc}</span>` : ""}</div>`;
}
// 戰鬥畫面的小聊天框
function v114BoxEl() {
  let el = document.getElementById("v114box");
  if (!el) {
    const ls = document.getElementById("lstack");
    if (!ls) return null;
    el = document.createElement("div");
    el.id = "v114box";
    el.className = "chip v114box";
    ls.prepend(el);
  }
  return el;
}
function v114BoxPaint() {
  const el = v114BoxEl();
  if (!el) return;
  const show = !!(S && v114On() && S.set.v114box !== 0);
  el.hidden = !show;
  if (!show) return;
  const fold = !!S.set.v114bc,
    dot = V114C.unread ? `<i class="dot"></i>` : "";
  if (fold) {
    const h = `<button class="v114bh" data-v114="open">聊天${V114C.unread ? ` <b>${V114C.unread > 99 ? "99+" : V114C.unread}</b>` : ""}</button><button class="v114bx" data-v114="fold" aria-label="展開聊天框">＋</button>${dot}`;
    if (el.innerHTML !== h) el.innerHTML = h;
    el.classList.add("fold");
    return;
  }
  el.classList.remove("fold");
  const L = v114List()
    .filter(([, m]) => !V114C.block.has(m.u))
    .slice(-V114.box);
  const lines = L.length
    ? L.map(([, m]) => `<div class="v114bl">${v114Badge(+m.g, 1)}<b>${esc(m.n || "無名")}</b>：${esc(v114Filter(m.t))}</div>`).join("")
    : `<div class="v114bl note">${V114C.st === "on" ? "還沒有訊息" : "連線中…"}</div>`;
  const h = `<div class="v114bt"><button class="v114bh" data-v114="open">聊天室${V114C.unread ? ` <b>${V114C.unread > 99 ? "99+" : V114C.unread}</b>` : ""}</button><button class="v114bx" data-v114="fold" aria-label="收起聊天框">－</button></div><div class="v114bb" data-v114="open">${lines}</div>`;
  if (el.innerHTML !== h) el.innerHTML = h;
}
function v114Paint(listChanged) {
  if (V114C.raf) return;
  const raf = typeof requestAnimationFrame === "function" ? requestAnimationFrame : (f) => setTimeout(f, 16);
  V114C.raf = raf(() => {
    V114C.raf = 0;
    try {
      v114BoxPaint();
    } catch (e) {}
    if (ui.tab !== "chat") return;
    const L = document.getElementById("v114list");
    if (!L) return;
    const near = L.scrollHeight - L.scrollTop - L.clientHeight < 60;
    const h = v114ListHtml();
    if (L.innerHTML !== h) L.innerHTML = h;
    if (near || listChanged === "bottom") L.scrollTop = L.scrollHeight;
    const ib = document.getElementById("v114inbox"),
      inp = document.getElementById("v114in");
    // 輸入框只在狀態改變時重畫（保留正在輸入的文字）
    const ih = v114InputHtml();
    if (ib && ib.dataset.h !== ih) {
      const val = inp ? inp.value : "",
        foc = inp && document.activeElement === inp;
      ib.innerHTML = ih;
      ib.dataset.h = ih;
      const n = document.getElementById("v114in");
      if (n) {
        n.value = val;
        if (foc) n.focus();
      }
    }
    const mg = document.getElementById("v114msg");
    if (mg) mg.textContent = V114C.info || V114C.err || "";
    const h2 = document.querySelector("#panel h2 .v114st");
    if (h2 && h2.outerHTML !== v114Status()) h2.outerHTML = v114Status();
  });
}
function v114Icon() {
  if (V114C.icon) return V114C.icon;
  // 原創 24×24 像素對話泡泡
  const c = document.createElement("canvas");
  c.width = c.height = 24;
  const x = c.getContext("2d"),
    px = (a, b, w, h, col) => ((x.fillStyle = col), x.fillRect(a, b, w, h));
  px(4, 4, 16, 1, "#3b2a1a");
  px(3, 5, 1, 10, "#3b2a1a");
  px(20, 5, 1, 10, "#3b2a1a");
  px(4, 15, 16, 1, "#3b2a1a");
  px(4, 5, 16, 10, "#fff7e6");
  px(4, 5, 16, 2, "#ffffff");
  px(4, 13, 16, 2, "#f0dcb8");
  px(7, 16, 3, 1, "#3b2a1a");
  px(7, 16, 2, 2, "#fff7e6");
  px(6, 16, 1, 3, "#3b2a1a");
  px(7, 18, 1, 1, "#3b2a1a");
  px(9, 17, 1, 1, "#3b2a1a");
  for (const a of [7, 11, 15]) px(a, 9, 2, 2, "#5b8cc8");
  V114C.icon = c.toDataURL();
  return V114C.icon;
}
function v114Tab() {
  const b = document.querySelector('#tabs [data-tab="alch"],#tabs [data-tab="chat"]');
  if (!b || !b.dataset) return;
  // 遊戲啟動時會依 data-tab 幫每個分頁加上圖示；在那之前改名會讓啟動程式找不到圖示而中斷，所以等圖示加好後才改
  if (b.dataset.tab === "alch" && !(b.querySelector && b.querySelector("img"))) return;
  if (b.dataset.tab !== "chat") b.dataset.tab = "chat";
  const ims = Array.from(b.querySelectorAll?.("img") || []);
  for (let i = 1; i < ims.length; i++) ims[i].remove();
  const im = ims[0];
  if (im && im.getAttribute("src") !== v114Icon()) im.setAttribute("src", v114Icon());
  if (!im) b.insertAdjacentHTML("afterbegin", `<img src="${v114Icon()}" alt="">`);
  for (const n of Array.from(b.childNodes || [])) if (n.nodeType === 3 && /煉金/.test(n.textContent)) n.textContent = n.textContent.replace("煉金", "聊天");
}

// ---------------------------------------------------------------------------
const V114_CSS = `
#tabs:has([data-tab="chat"]){grid-template-columns:repeat(6,1fr)!important}
#tabs [data-tab="chat"]{display:flex!important}
.v114list{height:min(52vh,460px);overflow-y:auto;overscroll-behavior:contain;padding:6px;background:#fbfdff;border:1px solid #b9c8d8;border-radius:4px;display:flex;flex-direction:column;gap:6px}
.v114list .empty-note{margin:auto}
.v114m{padding:5px 8px;background:#fff;border:1px solid #e1e8ef;border-radius:4px}
.v114m.me{background:#f2f8ff;border-color:#c7dbef}
.v114m.top{border-color:#e8d08a;background:linear-gradient(#fffdf4,#fff)}
.v114h{display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;font-size:12px}
.v114n{font:inherit;font-weight:700;font-size:13px;color:#2a5f96;background:none;border:0;padding:0;cursor:pointer}
.v114n:hover{text-decoration:underline}
.v114i{color:#6a7f94;min-width:0}
.v114t{margin-left:auto;color:#9aa9b8;font-size:11px}
.v114x{margin-top:2px;line-height:1.55;word-break:break-word;color:#2b3440}
.v114act{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
.v114in{display:flex;gap:6px;margin-top:8px}
.v114in .txt{flex:1;min-width:0}
.v114who{font-size:12px;color:#6a7f94;margin-top:4px;min-height:16px}
.v114gate{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px;padding:8px;background:#fff8e8;border:1px solid #e8d08a;border-radius:4px}
.v114gate span{flex:1 1 200px}
.v114msg{min-height:18px;font-size:12px;color:var(--bad,#a81c1c);margin-top:4px}
.v114foot{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:6px}
.v114foot .note{margin:0;font-size:11px}
.v114st{font-size:12px;font-weight:400;color:#6a7f94;background:none;border:0;padding:0}
.v114st.on{color:#1a6e34}
.v114st.off{color:#a81c1c;cursor:pointer;text-decoration:underline}
.v114g{display:inline-block;font-size:11px;font-weight:700;line-height:16px;padding:0 6px;border-radius:9px;color:#5a3a00;white-space:nowrap;background-size:220% 100%;animation:v114shine 2.2s linear infinite,v114glow 1.6s ease-in-out infinite alternate;vertical-align:baseline}
.v114g.g1{background-image:linear-gradient(110deg,#e8b730 0%,#fff3b0 30%,#e8b730 50%,#c9901a 75%,#e8b730 100%);box-shadow:0 0 0 1px #9a6a00}
.v114g.g2{color:#3a4450;background-image:linear-gradient(110deg,#b8c4d0 0%,#ffffff 30%,#b8c4d0 50%,#8a98a8 75%,#b8c4d0 100%);box-shadow:0 0 0 1px #6a7888}
.v114g.g3{color:#4a2410;background-image:linear-gradient(110deg,#d08a50 0%,#ffd8b0 30%,#d08a50 50%,#a86030 75%,#d08a50 100%);box-shadow:0 0 0 1px #7a4018}
.v114g.mini{padding:0 4px;font-size:10px;line-height:14px;margin-right:3px}
@keyframes v114shine{from{background-position:120% 0}to{background-position:-100% 0}}
@keyframes v114glow{from{filter:drop-shadow(0 0 0 #ffd84a00)}to{filter:drop-shadow(0 0 3px #ffd84acc)}}
#v114box{pointer-events:auto;width:min(340px,58vw);padding:4px 7px!important;white-space:normal;cursor:pointer;background:#f8fbeff0}
#v114box.fold{width:auto}
#v114box .dot{position:absolute;right:-3px;top:-3px;width:7px;height:7px;background:#e0445a;box-shadow:0 0 0 1px #fff}
.v114bt{display:flex;align-items:center;gap:6px;margin-bottom:2px}
.v114bh{font:inherit;font-weight:700;color:#2a5f96;background:none;border:0;padding:0;cursor:pointer}
.v114bh b{display:inline-block;min-width:16px;padding:0 4px;border-radius:8px;background:#e0445a;color:#fff;font-size:10px;line-height:15px;text-align:center}
.v114bx{margin-left:auto;font:inherit;background:none;border:0;color:#6a7f94;cursor:pointer;padding:0 2px}
#v114box.fold .v114bx{margin-left:6px}
.v114bl{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.5}
.v114bl b{color:#2a5f96;font-weight:700}
@media (max-width:600px){#v114box{width:min(260px,64vw);font-size:10px!important}.v114bl:nth-last-child(n+4){display:none}}
@media (prefers-reduced-motion:reduce){.v114g{animation:none}}`;

function v114Install() {
  if (typeof ui === "undefined" || typeof S === "undefined") return;
  if (typeof document !== "undefined" && !document.getElementById("v114css")) {
    const st = document.createElement("style");
    st.id = "v114css";
    st.textContent = V114_CSS;
    document.head.appendChild(st);
  }
  // 1. 聊天分頁（原本煉金的位置）：分頁圖示加好後才改名（見 v114Tab）
  ui.p_chat = function () {
    return S ? v114Page() : "";
  };
  const st = ui.setTab;
  ui.setTab = function (t, ...a) {
    const r = st.call(this, t, ...a);
    v114Tab();
    if (t === "chat") {
      V114C.menu = null;
      v114Unread();
      v114Connect();
      // 打開聊天室時查詢發言名片（5 分鐘內、或失敗後 5 分鐘內不重複查詢）
      if (v114Can()) v114Me();
      const L = document.getElementById("v114list");
      if (L) L.scrollTop = L.scrollHeight;
      v114Paint("bottom");
    }
    return r;
  };
  // 聊天頁重畫時保留輸入中的文字與捲動位置
  const rd = ui.render;
  ui.render = function (...a) {
    try {
      v114Tab();
    } catch (e) {}
    if (this.tab !== "chat") return rd.apply(this, a);
    const inp = document.getElementById("v114in"),
      val = inp ? inp.value : "",
      foc = inp && document.activeElement === inp,
      L = document.getElementById("v114list"),
      top = L ? L.scrollTop : null;
    const r = rd.apply(this, a);
    const n = document.getElementById("v114in");
    if (n) {
      n.value = val;
      if (foc) n.focus();
    }
    const L2 = document.getElementById("v114list");
    if (L2) L2.scrollTop = top == null ? L2.scrollHeight : top;
    const ib = document.getElementById("v114inbox");
    if (ib) ib.dataset.h = v114InputHtml();
    return r;
  };
  if (typeof AUTO_HELP !== "undefined") AUTO_HELP.chat = "v114";
  HELP.v114 = [
    "聊天室",
    [
      ["發言條件", `已綁定 Google（選單「綁定」），且這個角色有無限武鬥場的線上排行榜紀錄（無限武鬥場 Lv.${V114.arenaLv} 開放）。沒有符合的玩家可以看但不能發言。`],
      ["名片", "發言會附上職業、等級、無限武鬥場最高層數與名次（發言當下的排行榜紀錄，由伺服器查詢）。排行榜總榜前三名有動態徽章：最強、榜二、榜三。"],
      ["規則", `每 ${V114.gap / 1000} 秒最多 1 則、每則 ${V114.max} 字以內、不能連續發送相同的訊息；常見髒話會以＊顯示。顯示最近 ${V114.keep} 則。`],
      ["封鎖", "點玩家名字可以封鎖或解除封鎖，只影響你自己看到的內容。"],
      ["戰鬥畫面", "左下角的小聊天框顯示最新幾則訊息，點一下開啟聊天室；「－」收起、「＋」展開，也可以在聊天室下方關閉。"],
      ["連線", "遊戲切到背景超過 1 分鐘會自動斷開聊天室，回來時自動重新連線。只在網址版開放。"],
      ["隱私", "聊天內容會存放在 Firebase（Google）伺服器並公開顯示給所有玩家，請不要張貼個人資料。"],
    ],
  ];

  // 點選
  document.addEventListener(
    "click",
    (e) => {
      const b = e.target.closest && e.target.closest("[data-v114]");
      if (!b || !S) return;
      const a = b.dataset.v114;
      if (a === "box") return; // 勾選框由 change 處理
      e.preventDefault();
      e.stopPropagation();
      if (b.disabled) return;
      if (a === "send") {
        const inp = document.getElementById("v114in");
        if (!inp) return;
        const v = inp.value;
        v114Send(v).then((ok) => {
          if (ok) {
            const n = document.getElementById("v114in");
            if (n && n.value === v) n.value = "";
            v114Paint("bottom");
          }
        });
      } else if (a === "open") {
        if (ui.tab !== "chat") ui.setTab("chat");
      } else if (a === "fold") {
        S.set.v114bc = S.set.v114bc ? 0 : 1;
        markDirty();
        v114Paint();
      } else if (a === "menu") {
        V114C.menu = V114C.menu === b.dataset.k || !b.dataset.k ? null : b.dataset.k;
        v114Paint();
      } else if (a === "block" || a === "unblock") {
        v114Block(b.dataset.u, a === "block");
        V114C.menu = null;
      } else if (a === "unblockall") {
        V114C.block.clear();
        v114Block("-", false);
        ui.render();
      } else if (a === "del" || a === "mute" || a === "unmute") {
        V114C.menu = null;
        v114Admin(a, b.dataset.k, b.dataset.u);
      } else if (a === "bind") ui.openMenu("bind");
      else if (a === "arena") {
        ui.mapView = "ch";
        if (S.mvs) S.mvs.ch = 1;
        ui.setTab("map");
      } else if (a === "reconnect") {
        V114C.retryAt = 0;
        v114Close("off");
        v114Connect();
      }
    },
    true,
  );
  document.addEventListener("change", (e) => {
    const b = e.target.closest && e.target.closest('[data-v114="box"]');
    if (!b || !S) return;
    S.set.v114box = b.checked ? 1 : 0;
    markDirty();
    v114Paint();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.isComposing && e.target && e.target.id === "v114in") {
      e.preventDefault();
      document.querySelector('[data-v114="send"]')?.click();
    }
  });
  // 連線管理：進入遊戲後連線；切到背景超過 1 分鐘斷線
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) V114C.hideT = Date.now();
    else {
      V114C.hideT = 0;
      if (ui.tab === "chat" && V114C.loaded) v114Unread();
    }
  });
  if (typeof setInterval === "function") setInterval(() => {
    try {
      v114Tab();
      if (!S || !v114On()) return;
      if (document.hidden) {
        if (V114C.es && V114C.hideT && Date.now() - V114C.hideT > V114.hideOff) v114Close("off");
        return;
      }
      if (!V114C.es) v114Connect();
      v114Tab();
      v114BoxPaint();
    } catch (e) {}
  }, 2000);

  // 2. 無限武鬥場 Lv.50 開放（MVP 武道場維持原本等級）
  if (typeof roArenaStart === "function") {
    const ra = roArenaStart;
    roArenaStart = function (...a) {
      if (S && S.lvl < V114.arenaLv) return void toast(`無限武鬥場 Lv.${V114.arenaLv} 開放`, "bad");
      return ra.apply(this, a);
    };
  }
  const pm = ui.p_map;
  ui.p_map = function (...a) {
    let h = pm.apply(this, a);
    if (S && S.lvl < V114.arenaLv)
      h = h.replace(/<button class="btn sm primary" data-ro-arena[^>]*>[^<]*<\/button>/, `<button class="btn sm primary" data-ro-arena disabled>Lv.${V114.arenaLv} 開放</button>`);
    return h;
  };
  for (const hv of Object.values(HELP))
    for (const row of Array.isArray(hv?.[1]) ? hv[1] : [])
      if (Array.isArray(row) && typeof row[1] === "string" && /武鬥場/.test(row[1])) row[1] = row[1].replace(/無限武鬥場(（?)Lv\.?\s*30/g, `無限武鬥場$1Lv.${V114.arenaLv}`);
  // 3. 線上排行榜：說明改為前 100 名
  if (typeof ui.m_orank === "function") {
    const mo = ui.m_orank;
    ui.m_orank = function (...a) {
      return mo.apply(this, a).replace(/前 ?50 ?名/g, "前 100 名");
    };
  }
}
if (typeof roV4Install === "function") {
  const r4v114 = roV4Install;
  roV4Install = function () {
    r4v114();
    v114Install();
  };
}
