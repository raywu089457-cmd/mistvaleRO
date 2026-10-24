/* 流浪仙境 v1.1.7（續）：天賦頁、聊天室「訊息」分頁、手機版天賦樹拖曳效能、軍團戰靴恢復掉落
   1. 共用天賦樹天賦頁：最多 10 頁，按「＋」新增空白頁；點分頁就切換並生效（Boss、試煉、武鬥場戰鬥中不能切換）；
      可改名、刪除。只存共用天賦樹，職業天賦不變。原本的配置成為「天賦頁 1」。
   2. 聊天室上方「聊天｜訊息」分頁：戰鬥中的獲得提示（裝備、卡片、奇蹟石、印記、MVP 掉落…）與擊敗頭目改記錄在「訊息」頁，
      不再在戰鬥畫面彈出；每個角色存最近 100 則；「關閉素材獲取提示」（預設勾選）不記錄一般素材。
   3. 手機版天賦樹拖曳：星圖獨立繪圖層、拖曳時關閉節點濾鏡、每幀只更新一次位置、停用中央起點動畫、
      天賦樹開著時暫停畫戰鬥畫面（戰鬥與掉落照常進行）。
   4. 軍團戰靴恢復為一般地圖獨特掉落（Lv83 以上地圖，與其他高階獨特相同）。
   5. 頭目掉落：地上還有掉落時延後離開場地、自動挑戰下一場與闇答萊屍降臨（最多 8 秒）；頭目掉落落地就飛向角色。
   6. 手機版背包詳情改放在畫面最上層（iPhone Safari 會把捲動區塊裡的固定面板裁掉，✕ 點不到、無法捲動）。 */
"use strict";

const V122 = { pgMax: 10, pgName: 12, logMax: 100, ct: "chat", pgAsk: 0, pgEdit: false, clrAsk: 0, mob: "(max-width: 760px)" };
const v122Mob = () => typeof matchMedia === "function" && matchMedia(V122.mob).matches;
const v122Esc = (s) => (typeof esc === "function" ? esc(String(s ?? "")) : String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]));

// ---------------------------------------------------------------------------
// 1. 天賦頁（S.roTree.pages／pg；S.roTree.ranks 仍是目前生效的配置）
function v122Pg() {
  const T = S.roTree;
  if (!Array.isArray(T.pages) || !T.pages.length) {
    T.pages = [{ n: "天賦頁 1", r: { ...(T.ranks || {}) } }];
    T.pg = 0;
  }
  if (!(T.pg >= 0 && T.pg < T.pages.length)) T.pg = 0;
  return T;
}
// 目前生效的那頁跟著實際配置（升級後補點、套用）
function v122PgSync() {
  if (!S?.roTree) return;
  const T = v122Pg();
  T.pages[T.pg].r = { ...(T.ranks || {}) };
}
const v122Same = (a, b) => {
  const ka = Object.keys(a || {}).filter((k) => a[k]),
    kb = Object.keys(b || {}).filter((k) => b[k]);
  return ka.length === kb.length && ka.every((k) => b[k]);
};
function v122PgUse(k, note) {
  const T = v122Pg();
  if (k === T.pg || !T.pages[k]) return;
  if (inFight()) return toast("Boss、試煉或武鬥場戰鬥中不能切換天賦頁", "bad");
  const lost = roTreeDraft && !v122Same(roTreeDraft, T.ranks);
  v122PgSync();
  const hp = S.hp;
  T.pg = k;
  T.ranks = { ...(T.pages[k].r || {}) };
  T.migrated = false;
  roTreeEnsure();
  T.pages[k].r = { ...T.ranks };
  recalc();
  S.hp = Math.min(hp, PS.maxhp);
  markDirty();
  saveNow();
  ui.render();
  roTreeDraft = { ...T.ranks };
  if (document.querySelector("#sheet.ro-tree-sheet")) roTreeRender();
  toast(`${note || "已切換到"}「${T.pages[k].n}」${lost ? "（未套用的變更已捨棄）" : ""}`);
}
function v122PgBar() {
  const T = v122Pg(),
    tabs = T.pages
      .map((p, i) => {
        const on = i === T.pg,
          pts = typeof roTreeUsed === "function" ? roTreeUsed(on ? T.ranks : p.r || {}) : 0;
        if (on && V122.pgEdit)
          return `<span class="v122pgEd"><input id="v122pgIn" class="txt" maxlength="${V122.pgName}" value="${v122Esc(p.n)}" aria-label="天賦頁名稱"><button class="btn sm primary" data-v122pg="nameok">確定</button><button class="btn sm" data-v122pg="namecancel">取消</button></span>`;
        return `<button class="v122pgT${on ? " on" : ""}" data-v122pg="use" data-i="${i}" aria-pressed="${on}" title="${on ? "使用中" : "點一下切換並生效"}">${v122Esc(p.n)}<small>${pts} 點</small></button>`;
      })
      .join(""),
    ask = V122.pgAsk && performance.now() - V122.pgAsk < 3000;
  return `<div class="v122pg" role="group" aria-label="天賦頁">${tabs}${T.pages.length < V122.pgMax ? `<button class="v122pgT add" data-v122pg="add" title="新增空白天賦頁（最多 ${V122.pgMax} 頁）">＋</button>` : ""}<span class="v122pgOp">${V122.pgEdit ? "" : `<button class="btn sm" data-v122pg="name">改名</button>`}${T.pages.length > 1 ? `<button class="btn sm${ask ? " danger" : ""}" data-v122pg="del">${ask ? "再按一次刪除" : "刪除此頁"}</button>` : ""}</span></div>`;
}
function v122PgDecorate() {
  const sh = document.querySelector("#sheet.ro-tree-sheet");
  if (!sh || !S?.roTree) return;
  if ((typeof v105Sim !== "undefined" && v105Sim) || (typeof V117 !== "undefined" && V117.view)) return;
  const hd = sh.querySelector(".tree-header > div");
  if (!hd || hd.querySelector(".v122pg")) return;
  hd.insertAdjacentHTML("beforeend", v122PgBar());
  const inp = hd.querySelector("#v122pgIn");
  if (inp) {
    inp.focus();
    inp.select();
  }
  const on = hd.querySelector(".v122pgT.on");
  if (on) on.scrollIntoView({ block: "nearest", inline: "nearest" });
}
function v122PgClick(a, b) {
  const T = v122Pg();
  if (a !== "del") V122.pgAsk = 0;
  if (a === "use") return v122PgUse(+b.dataset.i);
  if (a === "add") {
    if (T.pages.length >= V122.pgMax) return toast(`最多 ${V122.pgMax} 個天賦頁`, "bad");
    if (inFight()) return toast("Boss、試煉或武鬥場戰鬥中不能切換天賦頁", "bad");
    let n = T.pages.length + 1;
    while (T.pages.some((p) => p.n === `天賦頁 ${n}`)) n++;
    T.pages.push({ n: `天賦頁 ${n}`, r: {} });
    markDirty();
    return v122PgUse(T.pages.length - 1, "已新增空白頁並切換到");
  }
  if (a === "name") V122.pgEdit = true;
  if (a === "namecancel") V122.pgEdit = false;
  if (a === "nameok") {
    const v = (document.getElementById("v122pgIn")?.value || "").trim().slice(0, V122.pgName);
    if (v) {
      T.pages[T.pg].n = v;
      markDirty();
      saveNow();
    }
    V122.pgEdit = false;
  }
  if (a === "del") {
    if (T.pages.length <= 1) return;
    if (!(V122.pgAsk && performance.now() - V122.pgAsk < 3000)) {
      V122.pgAsk = performance.now();
      return roTreeRender();
    }
    V122.pgAsk = 0;
    if (inFight()) return toast("Boss、試煉或武鬥場戰鬥中不能切換天賦頁", "bad");
    const k = T.pg,
      name = T.pages[k].n,
      to = k > 0 ? k - 1 : 1;
    v122PgUse(to, `已刪除「${name}」，切換到`);
    if (T.pg !== to) return roTreeRender(); // 切換失敗就不刪
    T.pages.splice(k, 1);
    if (T.pg > k) T.pg--;
    markDirty();
    saveNow();
  }
  roTreeRender();
}
function v122PgInstall() {
  if (typeof roTreeRender !== "function" || typeof roTreeAction !== "function") return;
  const rr = roTreeRender;
  roTreeRender = function (...a) {
    const r = rr.apply(this, a);
    try {
      v122PgDecorate();
    } catch (e) {}
    return r;
  };
  const ta = roTreeAction;
  roTreeAction = function (action, ...x) {
    const r = ta.call(this, action, ...x);
    if (action === "apply" && S?.roTree) {
      v122PgSync();
      markDirty();
    }
    return r;
  };
  const op = roTreeOpen;
  roTreeOpen = function (...a) {
    V122.pgEdit = false;
    V122.pgAsk = 0;
    if (S?.roTree) {
      roTreeEnsure();
      v122PgSync();
    }
    return op.apply(this, a);
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest?.("[data-v122pg]");
    if (!b || b.disabled || !S?.roTree) return;
    e.preventDefault();
    v122PgClick(b.dataset.v122pg, b);
  });
  window.addEventListener(
    "keydown",
    (e) => {
      if (e.target?.id !== "v122pgIn") return;
      e.stopImmediatePropagation(); // 輸入名稱時不觸發遊戲快捷鍵
      if (e.key === "Enter") (e.preventDefault(), v122PgClick("nameok"));
      if (e.key === "Escape") (e.preventDefault(), v122PgClick("namecancel"));
    },
    true,
  );
  const h = HELP.tree?.[1] || HELP.char?.[1];
  if (Array.isArray(h) && !h.some((r) => r[0] === "天賦頁"))
    h.push(["天賦頁", `天賦樹上方的分頁可以存不同的配置（最多 ${V122.pgMax} 頁）。按「＋」新增空白天賦頁；點分頁就切換並生效（重配免費，Boss、試煉或武鬥場戰鬥中不能切換）。在哪一頁加點、按「套用並儲存」就存到哪一頁；可改名、刪除。只存共用天賦樹，職業天賦不受影響；線上排行上傳的是使用中的那一頁。`]);
}

// ---------------------------------------------------------------------------
// 2. 聊天室「訊息」分頁：獲得提示改記錄在這裡
// 直接用 toast 顯示的戰鬥掉落提示
// 擊敗頭目：「擊敗〇〇！」（地圖頭目、MVP、守護者與神祇、終焉、魔王）、試煉完成
const V122_LOOT_RE = [/^擊敗 MVP「.*」！掉落：/, /^武鬥場頭目掉落了/, /^武鬥場第 \d+ 層頭目：獲得/, /掉落了魔王・獨特/, /：獲得「/, /^獲得神器「/, /^獲得稱號「/, /^擊敗[^：]*！$/, /^完成.+！獲得 \d+ 點天賦點$/];
// 素材獲取提示（可關閉；奇蹟石、傳說的魔力礦石、MVP 門票仍記錄）
const V122_MAT_KEEP = ["m1", "lg1", "tk1"];
let v122MatSet = null;
const v122IsMat = (m) => (v122MatSet ||= new Set(Object.entries(typeof MATS !== "undefined" ? MATS : {}).filter(([k]) => !V122_MAT_KEEP.includes(k)).map(([, x]) => "獲得" + x.n))).has(m);
const v122NoMat = () => !!S && S.set?.v122nomat !== 0; // 預設勾選（不記錄）
const v122L = () => (Array.isArray(S?.v122log) ? S.v122log : S ? (S.v122log = []) : []);
const v122Unread = () => (S ? v122L().filter((x) => x.t > (S.v122seen || 0)).length : 0);
function v122Log(m, c = "") {
  if (!S || !m) return;
  const L = v122L(),
    last = L[L.length - 1],
    now = Date.now();
  if (last && last.m === m && now - last.t < 60000) {
    last.n = (last.n || 1) + 1;
    last.t = now;
  } else {
    L.push({ t: now, m: String(m), c: String(c || ""), n: 1 });
    if (L.length > V122.logMax) L.splice(0, L.length - V122.logMax);
  }
  if (typeof markDirty === "function") markDirty();
  v122LogPaint();
}
function v122Hm(t) {
  const d = new Date(t),
    p = (x) => String(x).padStart(2, "0"),
    today = new Date().toDateString() === d.toDateString();
  return `${today ? "" : `${d.getMonth() + 1}/${d.getDate()} `}${p(d.getHours())}:${p(d.getMinutes())}`;
}
function v122ListHtml() {
  const L = v122L();
  if (!L.length) return `<p class="empty-note">還沒有獲得紀錄。打倒怪物獲得裝備、卡片、奇蹟石等時會記錄在這裡。</p>`;
  const seen = S.v122seen0 || 0;
  return L.slice()
    .reverse()
    .map((x) => `<div class="v122r${x.t > seen ? " new" : ""}"><span class="v122t">${v122Hm(x.t)}</span><span class="v122m ${v122Esc(x.c).replace(/[^\w ]/g, "")}">${v122Esc(x.m)}</span>${x.n > 1 ? `<b class="v122n">X${x.n}</b>` : ""}</div>`)
    .join("");
}
function v122LogPage() {
  const n = v122L().length,
    ask = V122.clrAsk && performance.now() - V122.clrAsk < 3000;
  return `<h2 style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">訊息<small class="v122sub">最近 ${V122.logMax} 則</small><span class="spacer"></span><label class="chk v122chk"><input type="checkbox" data-v122="nomat" ${v122NoMat() ? "checked" : ""}><span>關閉素材獲取提示</span></label>${n ? `<button class="btn sm${ask ? " danger" : ""}" data-v122="clear">${ask ? "再按一次清除" : "清除紀錄"}</button>` : ""}</h2>
  <div class="v122list" id="v122list">${v122ListHtml()}</div>
  <p class="note v122foot">戰鬥中的獲得提示（獨特、傳奇、神話、主宰裝備、卡片、素材、奇蹟石、無限印記、守護者與神祇掉落、MVP 掉落、背包已滿自動分解）與擊敗頭目、試煉完成都記錄在這裡，不再在戰鬥畫面彈出。勾選「關閉素材獲取提示」時不記錄一般素材（奇蹟石、傳說的魔力礦石、MVP 門票仍記錄）。每個角色保存最近 ${V122.logMax} 則。</p>`;
}
function v122Bar() {
  const c = typeof V114C !== "undefined" && V114C.unread ? V114C.unread : 0,
    ct = V122.ct;
  return `<div class="v122ct" role="tablist"><button role="tab" class="v122ctB${ct === "chat" ? " on" : ""}" aria-selected="${ct === "chat"}" data-v122ct="chat">聊天${c && ct !== "chat" ? ` <b>${c > 99 ? "99+" : c}</b>` : ""}</button><button role="tab" class="v122ctB${ct === "log" ? " on" : ""}" aria-selected="${ct === "log"}" data-v122ct="log">訊息</button></div>`;
}
function v122Seen() {
  if (!S) return;
  S.v122seen0 = S.v122seen || 0; // 這次打開前看過的位置（用來標示新訊息）
  S.v122seen = Date.now();
  markDirty();
}
// 下方「聊天」按鈕：「訊息」頁的新紀錄不顯示紅點（v1.2.5 起紅點只代表聊天室有別人的新發言，由聊天室本身提示）
function v122Dot() {
  const b = document.querySelector('#tabs [data-tab="chat"]');
  if (b && b.classList.contains("v122new")) b.classList.remove("v122new");
}
function v122LogPaint() {
  if (V122.raf) return;
  const raf = typeof requestAnimationFrame === "function" ? requestAnimationFrame : (f) => setTimeout(f, 16);
  V122.raf = raf(() => {
    V122.raf = 0;
    if (!S) return;
    const viewing = ui.tab === "chat" && V122.ct === "log";
    if (viewing) {
      S.v122seen = Date.now();
      const L = document.getElementById("v122list");
      if (L) {
        const h = v122ListHtml();
        if (L.innerHTML !== h) L.innerHTML = h;
      }
    }
    const bar = document.querySelector("#panel .v122ct");
    if (bar) {
      const h = v122Bar();
      if (bar.outerHTML !== h) bar.outerHTML = h;
    }
    v122Dot();
  });
}
function v122LogInstall() {
  if (typeof ui === "undefined" || typeof ui.p_chat !== "function") return;
  // 獲得提示不再彈出，改記錄到訊息頁（終端機模式的紀錄照舊）
  lootToast = function (t, a = "") {
    if (typeof termLog === "function") termLog(t, a);
    if (v122NoMat() && v122IsMat(t)) return;
    v122Log(t, a);
  };
  const t0 = toast;
  toast = function (m, a = "", ...x) {
    if (typeof m === "string" && V122_LOOT_RE.some((r) => r.test(m))) {
      if (typeof termLog === "function") termLog(m, a);
      return v122Log(m, a);
    }
    return t0.call(this, m, a, ...x);
  };
  const pc = ui.p_chat;
  ui.p_chat = function (...a) {
    if (!S) return "";
    return v122Bar() + (V122.ct === "log" ? v122LogPage() : pc.apply(this, a));
  };
  const st = ui.setTab;
  ui.setTab = function (t, ...a) {
    if (t === "chat" && V122.ct === "log") v122Seen();
    const r = st.call(this, t, ...a);
    v122Dot();
    return r;
  };
  // 設定頁的「隱藏掉落訊息」已沒有作用
  if (typeof ui.m_set === "function") {
    const ms = ui.m_set;
    ui.m_set = function (...a) {
      return String(ms.apply(this, a)).replace(/<label class="chk"><input type="checkbox" data-act="nolt"[^>]*><span>隱藏掉落訊息<\/span><\/label>/, "");
    };
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest?.("[data-v122ct],[data-v122]");
    if (!b || !S) return;
    if (b.dataset.v122ct) {
      if (b.dataset.v122ct === V122.ct) return;
      V122.ct = b.dataset.v122ct;
      V122.clrAsk = 0;
      if (V122.ct === "log") v122Seen();
      ui.render();
      if (V122.ct === "chat" && typeof v114Paint === "function") {
        if (typeof v114Unread === "function") v114Unread();
        v114Paint("bottom");
      }
      return v122Dot();
    }
    if (b.dataset.v122 === "nomat") {
      S.set.v122nomat = b.checked ? 1 : 0;
      return markDirty();
    }
    if (b.dataset.v122 === "clear") {
      if (!(V122.clrAsk && performance.now() - V122.clrAsk < 3000)) {
        V122.clrAsk = performance.now();
        return ui.render();
      }
      V122.clrAsk = 0;
      S.v122log = [];
      markDirty();
      ui.render();
    }
  });
  if (HELP.v114 && Array.isArray(HELP.v114[1]) && !HELP.v114[1].some((r) => r[0] === "訊息"))
    HELP.v114[1].splice(0, 0, ["訊息", `聊天室上方切換「聊天｜訊息」。戰鬥中的獲得提示（裝備、卡片、素材、奇蹟石、印記、MVP 掉落、背包已滿自動分解等）與擊敗頭目、試煉完成不再在戰鬥畫面彈出，改記錄在「訊息」頁，依稀有度上色，同一則連續出現時合併成「X2」。「關閉素材獲取提示」（預設勾選）勾選時不記錄一般素材，奇蹟石、傳說的魔力礦石、MVP 門票仍記錄。每個角色保存最近 ${V122.logMax} 則；有沒看過的訊息時，下方「聊天」按鈕顯示紅點（「訊息」分頁本身不顯示未讀數）。單機版也能使用。`]);
  setTimeout(v122Dot, 0);
}

// ---------------------------------------------------------------------------
// 3. 手機版天賦樹拖曳效能
function v122PerfInstall() {
  // 單指拖曳時每幀只更新一次位置
  if (typeof roTreePaintCamera === "function") {
    const pc = roTreePaintCamera;
    let raf = 0;
    roTreePaintCamera = function (...a) {
      const dragging = document.querySelector("#sheet .tree-map.dragging");
      if (!dragging || typeof requestAnimationFrame !== "function") {
        if (raf) cancelAnimationFrame(raf), (raf = 0);
        return pc.apply(this, a);
      }
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        pc();
      });
    };
  }
  // 天賦樹在手機上是全螢幕：開著時不畫底下的戰鬥畫面（戰鬥、掉落照常進行）
  const covered = () => {
    if (typeof document === "undefined") return false;
    const bg = document.getElementById("sheetBg");
    return !!(bg && !bg.hidden && v122Mob() && document.querySelector("#sheet.ro-tree-sheet"));
  };
  if (typeof draw === "function") {
    const d0 = draw;
    draw = function (...a) {
      if (covered()) return;
      return d0.apply(this, a);
    };
  }
  if (typeof eliteTags === "function") {
    const e0 = eliteTags;
    eliteTags = function (...a) {
      if (covered()) return;
      return e0.apply(this, a);
    };
  }
}

// ---------------------------------------------------------------------------
// 4. 軍團戰靴恢復為一般地圖獨特掉落
function v122LegionInstall() {
  if (typeof RO_UQ === "undefined" || !RO_UQ.ro44_legion || typeof roUqPool !== "function") return;
  RO_UQ.ro44_legion.src = "map";
  if (typeof UNIQUE !== "undefined" && UNIQUE.ro44_legion) UNIQUE.ro44_legion.src = "map";
  if (typeof FINAL !== "undefined") FINAL.uq = roUqPool("map", 99).filter((k) => RO_UQ[k].hi === 2);
}

// ---------------------------------------------------------------------------
// 5. 頭目掉落：地上還有掉落時延後離開場地與自動挑戰下一場（最多 8 秒；v1.2.3 起闇答萊屍照原本 2.5 秒降臨）；頭目掉落落地就飛向角色
const V122_LOOT = { wait: 8, step: 0.3, fly: 1.2 };
let v122InTick = false;
// 是否還要等掉落撿完（只在遊戲迴圈裡自動觸發時等；玩家手動操作不等）
function v122LootWait() {
  if (!v122InTick || !G || G.dead || !G.drops?.length) {
    if (G) G.v122lw = 0;
    return false;
  }
  if (!G.v122lw) G.v122lw = G.t;
  return G.t - G.v122lw < V122_LOOT.wait;
}
function v122LootInstall() {
  const tk = tick;
  tick = function (...a) {
    v122InTick = true;
    try {
      return tk.apply(this, a);
    } finally {
      v122InTick = false;
    }
  };
  const la = leaveArena;
  leaveArena = function (...a) {
    if (G?.arena && v122LootWait()) {
      G.arena.out = V122_LOOT.step;
      return;
    }
    return la.apply(this, a);
  };
  const sg = startGuard;
  startGuard = function (...a) {
    // 巴風特後的闇答萊屍（ro-v70 虛空召喚，第 4 位守護者）照原本 2.5 秒降臨，不等掉落
    if (a[0] !== 4 && v122LootWait()) {
      G.agT = Math.max(G.agT || 0, G.t + V122_LOOT.step);
      return;
    }
    return sg.apply(this, a);
  };
  if (typeof twStart === "function") {
    const ts = twStart;
    twStart = function (...a) {
      if (v122LootWait()) {
        G.atT = Math.max(G.atT || 0, G.t + V122_LOOT.step);
        return;
      }
      return ts.apply(this, a);
    };
  }
  // 頭目（含守護者、巴風特、MVP）的掉落：落地就開始飛向角色（原本落地後再等 1.2 秒）
  const dl = dropLoot;
  dropLoot = function (t, ...x) {
    const n0 = G?.drops?.length ?? 0,
      r = dl.call(this, t, ...x);
    if (t && t.boss && G?.drops) for (let i = n0; i < G.drops.length; i++) G.drops[i].t = Math.max(G.drops[i].t || 0, V122_LOOT.fly);
    return r;
  };
}

// ---------------------------------------------------------------------------
// 6. 手機版背包詳情：iPhone Safari 會把放在捲動區塊裡的固定面板裁切掉（上方 ✕ 被藏住、無法捲動），
//    改搬到畫面最上層的容器；按鈕照常交給原本的點擊處理
function v122SheetHost() {
  let h = document.getElementById("v122sheet");
  if (!h) {
    h = document.createElement("div");
    h.id = "v122sheet";
    h.className = "ro-inventory";
    h.addEventListener("click", (e) => {
      if (typeof onPanelClick === "function") onPanelClick(e);
    });
    document.body.appendChild(h);
  }
  return h;
}
function v122SheetMove(top) {
  const host = document.getElementById("v122sheet"),
    dt = document.querySelector("#panel .ro-inventory .detail");
  const on = !!(dt && dt.classList.contains("v94sheet") && !dt.classList.contains("v94multi") && ui.tab === "bag");
  if (!on) {
    if (host) host.textContent = "";
    return;
  }
  const h = v122SheetHost(),
    dim = document.getElementById("v94dim");
  h.textContent = "";
  if (dim) h.appendChild(dim);
  h.appendChild(dt);
  if (top) dt.scrollTop = top;
}
function v122SheetInstall() {
  if (typeof document === "undefined" || typeof ui === "undefined" || typeof v94Sheet !== "function") return;
  const rd = ui.render;
  ui.render = function (...a) {
    const old = document.querySelector("#v122sheet .detail"),
      top = old ? old.scrollTop : 0,
      same = old && ui.sel === V122.sheetSel;
    const r = rd.apply(this, a);
    try {
      v122SheetMove(same ? top : 0);
      V122.sheetSel = ui.sel;
    } catch (e) {}
    return r;
  };
}

const V122_CSS = `
.ro-tree-sheet .tree-map svg{will-change:transform}
.v122pg{display:flex;align-items:center;gap:4px;margin-top:8px;overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:thin;max-width:100%;padding-bottom:2px}
.v122pgT{flex:none;display:flex;flex-direction:column;align-items:center;gap:0;font:inherit;font-size:12px;font-weight:700;line-height:1.2;padding:4px 10px;border:1px solid #c7d4dc;border-radius:4px;background:#fff;color:#3e6c86;cursor:pointer;white-space:nowrap}
.v122pgT small{font-size:10px;font-weight:400;color:#8b9fae}
.v122pgT.on{background:#3e6c86;border-color:#2c5168;color:#fff}
.v122pgT.on small{color:#d6e6f0}
.v122pgT.add{font-size:16px;padding:4px 12px;color:#5d7a8c}
.v122pgOp{display:flex;gap:4px;margin-left:6px;flex:none}
.v122pgOp .danger,.v122foot .danger,h2 .danger{color:var(--bad,#a81c1c);border-color:var(--bad,#a81c1c)}
.v122pgEd{display:flex;gap:4px;align-items:center;flex:none}
.v122pgEd .txt{width:9em}
.tree-header > div{min-width:0;flex:1}
.v122ct{display:flex;gap:4px;margin-bottom:8px;border-bottom:2px solid #b9c8d8}
.v122ctB{font:inherit;font-weight:700;padding:6px 16px;border:1px solid #b9c8d8;border-bottom:0;border-radius:4px 4px 0 0;background:#eef3f8;color:#5a6f84;cursor:pointer;margin-bottom:-2px}
.v122ctB.on{background:#fbfdff;color:#2a5f96;border-color:#b9c8d8;box-shadow:0 2px 0 #fbfdff}
.v122ctB b{display:inline-block;min-width:16px;padding:0 4px;border-radius:8px;background:#e0445a;color:#fff;font-size:10px;line-height:15px;text-align:center}
.v122sub{font-size:12px;font-weight:400;color:#6a7f94}
.v122list{height:min(56vh,500px);overflow-y:auto;overscroll-behavior:contain;padding:6px;background:#fbfdff;border:1px solid #b9c8d8;border-radius:4px;display:flex;flex-direction:column;gap:3px}
.v122list .empty-note{margin:auto}
.v122r{display:flex;align-items:baseline;gap:8px;padding:4px 8px;background:#fff;border:1px solid #e1e8ef;border-radius:4px;line-height:1.5}
.v122r.new{border-color:#c7dbef;background:#f6faff}
.v122t{flex:none;color:#9aa9b8;font-size:11px;min-width:3.2em}
.v122m{flex:1;min-width:0;word-break:break-word;color:#2b3440}
.v122m.lvl{color:var(--ember)}.v122m.bad{color:var(--bad)}.v122m.ru{color:var(--ru)}.v122m.rm{color:var(--rm)}.v122m.rs{color:var(--rs)}.v122m.ra{color:var(--ra)}.v122m.r3{color:var(--r3)}.v122m.r4{color:var(--r4)}
.v122n{flex:none;font-size:11px;color:#6a7f94}
.v122foot{font-size:11px;margin-top:6px}
#tabs [data-tab="chat"]{position:relative}
.v122chk{font-size:12px;font-weight:400;margin:0}
#v122sheet{position:fixed;inset:0;z-index:40;pointer-events:none}
#v122sheet:empty{display:none}
#v122sheet > *{pointer-events:auto}
#tabs [data-tab="chat"].v122new::after{content:"";position:absolute;right:8px;top:4px;width:7px;height:7px;background:#e0445a;box-shadow:0 0 0 1px #fff}
@media (max-width:760px){
  .ro-tree-sheet .tree-center-ring,.ro-tree-sheet .tree-center-glow{animation:none!important}
  .ro-tree-sheet .tree-map.dragging *{filter:none!important}
}`;

function v122Install() {
  if (typeof document !== "undefined" && !document.getElementById("v122css")) {
    const st = document.createElement("style");
    st.id = "v122css";
    st.textContent = V122_CSS;
    document.head.appendChild(st);
  }
  for (const f of [v122LegionInstall, v122PgInstall, v122LogInstall, v122PerfInstall, v122LootInstall, v122SheetInstall])
    try {
      f();
    } catch (e) {
      console.error("v122", f.name, e);
    }
}
if (typeof roV4Install === "function") {
  const r4v122 = roV4Install;
  roV4Install = function () {
    r4v122.apply(this, arguments);
    v122Install();
  };
}
