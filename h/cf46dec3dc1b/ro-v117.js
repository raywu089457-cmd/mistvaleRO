/* 流浪仙境 v1.1.4（內部 v11.7）：線上排行榜快照可以查看天賦樹
   1. 武鬥場紀錄上傳時一併上傳共用天賦樹的配置（只記點亮的節點）
   2. 快照畫面新增「查看天賦樹」：唯讀的天賦星圖（縮放、拖曳、點節點看說明、終極總覽、職業獨特），
      顯示該玩家的點亮路徑、配置後素質、終極與職業獨特天賦，點數依當時等級；不能修改，可返回快照
   3. 舊紀錄沒有天賦樹資料時顯示提示
   4. 唯讀星圖可「複製到我的模擬器」：覆蓋自己的天賦模擬器並打開（其他職業的職業獨特天賦不複製），不影響目前天賦 */

const V117 = { view: null, last: null };
const v117Esc = (s) => (typeof esc === "function" ? esc(String(s ?? "")) : String(s ?? ""));
function v117Ranks(src) {
  const out = {};
  if (src && typeof src === "object" && typeof RO_TREE_NODES !== "undefined")
    for (const [id, v] of Object.entries(src)) if (v && RO_TREE_NODES[id]) out[id] = 1;
  return out;
}
// 唯讀星圖
function v117Open(key) {
  const rec = typeof V6RK_REC !== "undefined" ? V6RK_REC[key] : null,
    tree = rec?.d?.tree;
  if (!rec || !tree || typeof roTreeRender !== "function") return;
  V117.view = { key, ranks: v117Ranks(tree), cls: rec.cls, lv: Math.max(1, +rec.lv || 1), name: rec.name || "無名" };
  if (typeof v105Sim !== "undefined") v105Sim = false;
  roTreeDraft = { ...V117.view.ranks };
  roTreeSelected = RO_TREE_LAYOUT.hub[0];
  roTreeZoom = 1;
  roTreeView = "tree";
  roTreeCamera = { x: 0, y: 0, catalog: 0, detail: 0 };
  roTreeRender(true);
}
function v117Back() {
  V117.view = null;
  roTreeDraft = null;
  const L = V117.last;
  if (L && ui.snapOpen) ui.snapOpen(L.t, L.sel);
  else if (typeof sheetOff === "function") sheetOff();
}
// 複製到自己的天賦模擬器（v1.0.15 的模擬器；不影響目前天賦）
function v117Copy() {
  const V = V117.view;
  if (!V || !S || typeof v105SimData !== "function") return;
  const ranks = {};
  for (const id of Object.keys(V.ranks)) {
    const n = RO_TREE_NODES[id];
    if (!n || (n.kind === "unique" && n.cls !== S.cls)) continue;
    ranks[id] = 1;
  }
  v105SimData().ranks = ranks;
  markDirty();
  V117.view = null;
  roTreeOpen();
  // 切到模擬器（沿用模擬器按鈕的流程）
  document.querySelector("#sheet [data-v105t='sim']")?.click();
  const skip = Object.keys(V.ranks).length - Object.keys(ranks).length,
    over = typeof roTreeValid === "function" && !roTreeValid(ranks);
  toast(`已把 ${V.name} 的天賦配置複製到模擬器${skip ? `（其他職業的獨特天賦 ${skip} 個未複製）` : ""}${over ? "；你的點數不足，模擬器裡可以調整後再套用" : ""}`, over ? "bad" : "lvl");
}
function v117Decorate() {
  const V = V117.view,
    sh = document.querySelector("#sheet.ro-tree-sheet");
  if (!V || !sh) return;
  sh.classList.add("v117view");
  const h2 = sh.querySelector(".tree-header h2"),
    sm = sh.querySelector(".tree-header small"),
    p = sh.querySelector(".tree-header p");
  if (h2) h2.textContent = `${V.name} 的共用天賦樹`;
  if (sm) sm.textContent = "LEADERBOARD SNAPSHOT";
  if (p) {
    const used = roTreeUsed(V.ranks),
      ult = roTreeUltimates(V.ranks),
      uq = Object.values(RO_TREE_NODES).filter((x) => x.kind === "unique" && V.ranks[x.id]).length,
      cn = (typeof V6_CLS_N !== "undefined" && V6_CLS_N[V.cls]) || roClass?.[V.cls]?.n || V.cls;
    p.innerHTML = `${v117Esc(cn)}・Lv.${V.lv} · 已投入 <b>${used}</b> 點 · 終極天賦 <b>${ult} / 2</b> · 獨特天賦 <b>${uq}</b> · <span class="v117tag">唯讀快照</span>`;
  }
  const close = sh.querySelector(".tree-header [data-act='close']");
  if (close && !sh.querySelector(".v117hb")) {
    const box = document.createElement("div");
    box.className = "v117hb";
    close.replaceWith(box);
    box.innerHTML = `<button class="btn primary" data-v117="back">返回快照</button>`;
    box.appendChild(close);
  }
  // 隱藏所有修改用的按鈕
  sh.querySelector("[data-v105t='sim']")?.remove();
  sh.querySelector(".v72apply")?.remove();
  for (const b of sh.querySelectorAll(".tree-detail [data-ro-tree='add'],.tree-detail [data-ro-tree='path'],.tree-detail [data-ro-tree='remove']")) b.remove();
  const st = sh.querySelector(".tree-detail .tree-status");
  if (st) {
    const id = roTreeSelected;
    st.textContent = V.ranks[id] ? "這位玩家已點亮此天賦。" : "這位玩家沒有點亮此天賦。";
  }
  for (const h of sh.querySelectorAll(".tree-detail h4")) if (h.textContent === "配置後素質") h.textContent = "這位玩家的素質";
  sh.querySelector(".tree-migration")?.remove();
  for (const n of sh.querySelectorAll(".tree-detail .note")) if (/重配免費/.test(n.textContent)) n.remove();
  const ft = sh.querySelector(".tree-footer");
  if (ft)
    ft.innerHTML = `<span>這是 ${v117Esc(V.name)} 上傳紀錄時的天賦配置，只能查看。</span>${typeof v105SimData === "function" ? '<button class="btn" data-v117="copy">複製到我的模擬器</button>' : ""}<button class="btn primary" data-v117="back">返回快照</button>`;
}

function v117Install() {
  if (typeof roTreeRender !== "function" || typeof roTreeAction !== "function") return;
  // 1. 上傳：武鬥場紀錄附上共用天賦樹
  if (typeof v6RkSnap === "function") {
    const rs = v6RkSnap;
    v6RkSnap = function (...a) {
      const d = rs.apply(this, a);
      try {
        if (d && S?.roTree?.ranks) d.tree = v117Ranks(S.roTree.ranks);
      } catch (e) {}
      return d;
    };
  }
  // 2. 唯讀星圖：畫的時候暫時換成那位玩家的職業、等級與配置
  const rr = roTreeRender;
  roTreeRender = function (...a) {
    const V = V117.view;
    if (!V || !S) return rr.apply(this, a);
    roTreeDraft = { ...V.ranks };
    const keep = [S.cls, S.lvl];
    S.cls = roClass?.[V.cls] ? V.cls : S.cls;
    S.lvl = V.lv;
    let r;
    try {
      r = rr.apply(this, a);
      v117Decorate();
    } finally {
      [S.cls, S.lvl] = keep;
    }
    return r;
  };
  const ta = roTreeAction;
  roTreeAction = function (action, ...x) {
    if (V117.view && !["tree", "catalog", "unique", "zoomin", "zoomout", "center"].includes(action)) return roTreeRender();
    return ta.call(this, action, ...x);
  };
  const op = roTreeOpen;
  roTreeOpen = function (...a) {
    V117.view = null;
    return op.apply(this, a);
  };
  // 3. 快照畫面的按鈕
  if (ui.snapOpen) {
    const so = ui.snapOpen;
    ui.snapOpen = function (t, ...a) {
      V117.view = null;
      const r = so.call(this, t, ...a);
      try {
        if (t && t.v6 && typeof V6RK_REC !== "undefined" && V6RK_REC[t.p]) {
          V117.last = { t, sel: this.snapSel };
          const sh = $("#sheet"),
            box = sh.querySelector(".v6rk-ex"),
            has = !!V6RK_REC[t.p]?.d?.tree;
          if (box && !box.querySelector(".v117row"))
            box.insertAdjacentHTML(
              "beforeend",
              `<div class="row v117row">${has ? `<button class="btn sm primary" data-v117="tree" data-p="${v117Esc(t.p)}">查看天賦樹</button>` : `<span class="note" style="margin:0">這筆紀錄沒有天賦樹資料，玩家下次刷新紀錄後就會有。</span>`}</div>`,
            );
        }
      } catch (e) {}
      return r;
    };
  }
  document.addEventListener(
    "click",
    (e) => {
      const b = e.target.closest && e.target.closest("[data-v117]");
      if (!b) return;
      e.preventDefault();
      e.stopPropagation();
      if (b.dataset.v117 === "tree") v117Open(b.dataset.p);
      else if (b.dataset.v117 === "back") v117Back();
      else if (b.dataset.v117 === "copy") v117Copy();
    },
    true,
  );
  if (!document.getElementById("v117css")) {
    const st = document.createElement("style");
    st.id = "v117css";
    st.textContent = `.ro-tree-sheet.v117view .tree-header h2{color:#2a5f96}
.ro-tree-sheet .v117tag{color:#2a5f96;font-weight:700}
.ro-tree-sheet.v117view .tree-header{gap:8px}
.ro-tree-sheet.v117view .tree-footer{justify-content:flex-end;gap:8px}
.ro-tree-sheet.v117view .tree-footer span{margin-right:auto}
.v117row{margin-top:2px}
.ro-tree-sheet .v117hb{display:flex;gap:8px;align-items:flex-start;flex:none}`;
    document.head.appendChild(st);
  }
  if (HELP.tower && Array.isArray(HELP.tower[1]))
    HELP.tower[1].push(["天賦樹快照", "線上排行的快照可按「查看天賦樹」，以唯讀星圖查看該玩家上傳紀錄時的共用天賦樹配置（點亮路徑、素質、終極與職業獨特天賦）；按「複製到我的模擬器」會覆蓋你的天賦模擬器並打開，不影響目前天賦（其他職業的獨特天賦不複製）。較早上傳的紀錄沒有天賦樹資料，玩家下次刷新紀錄後就會有。"]);
}
if (typeof roV4Install === "function") {
  const r4v117 = roV4Install;
  roV4Install = function () {
    r4v117();
    v117Install();
  };
}
