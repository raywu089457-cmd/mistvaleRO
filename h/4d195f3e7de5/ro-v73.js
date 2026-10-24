/* 流浪仙境 v7.3：深淵模式頭目召喚數統一 200、專屬場地固定 RO 背景並修正名稱、活動名稱統一「荒野回響」、深淵階級選單改深色 */

// ---------------------------------------------------------------------------
// 1. 深淵模式（主線地圖）擊殺 200 隻怪物後可召喚頭目；一般模式維持 30＋10×地圖編號
const V73_ABY_BOSS = 200;
function roBossNeed(t) {
  if (t < MAP_N && typeof v56AbyTier === "function" && S && v56AbyTier(t) > 0) return V73_ABY_BOSS;
  return t < MAP_N && slatesOn(t).length ? 200 : 30 + 10 * t;
}
function v73AbyBossInstall() {
  const h = HELP.v56aby?.[1];
  if (Array.isArray(h) && !h.some((r) => r[0] === "頭目召喚")) h.splice(1, 0, ["頭目召喚", `深淵模式中，每張地圖都要擊殺 ${V73_ABY_BOSS} 隻怪物才能召喚頭目（一般模式為 30～170 隻）。`]);
}

// ---------------------------------------------------------------------------
// 2. 專屬場地：原本三魔王與 MVP 武道場的背景沿用出發時所在的地圖，與場地名稱不符。
//    改為固定的 RO 地圖背景，名稱顯示「場地名（地圖名）」；挑戰頁卡片的橫幅圖一併對應
const V73_ARENA = {
  g0: ["payon", "古樹祭壇", "斐揚森林"],
  g1: ["magma", "熔核深淵", "諾可羅德火山"],
  g2: ["icecave", "星穹之頂", "拉赫冰洞"],
  fin: ["odin", "終焉王座", "奧丁神殿"],
  mon: ["odin", "無限王庭", "奧丁神殿"],
  trial: ["ghknight", "試煉聖殿", "古城騎士團"],
  tw: ["thanatos", "無限武鬥場", "達納托斯之塔"],
  v64mvp: ["ghchurch", "MVP 武道場", "葛城修道院"],
};
const v73MapImg = (th) => {
  const d = RO?.assets?.maps?.[th];
  return d ? d.decoratedFile || d.file : null;
};
function v73ArenaInstall() {
  const theme = new Map();
  for (const [k, [th, n, mp]] of Object.entries(V73_ARENA)) {
    const A = ARENA[k];
    if (!A) continue;
    A.n = `${n}（${mp}）`;
    theme.set(A, th);
  }
  const bg = buildGround;
  buildGround = function (...a) {
    const A = G?.arena?.ar,
      th = A && theme.get(A),
      f = th && v73MapImg(th),
      im = f && roImage(f);
    if (im) {
      G.ground = im;
      G.props = [];
      G.lights = [];
      return;
    }
    return bg.apply(this, a);
  };
  // 挑戰頁、魔王頁、試煉、活動卡片的橫幅
  const ban = { g0: "payon", g1: "magma", g2: "icecave", fin: "odin", mon: "odin", tw: "thanatos", ss: "odin" };
  const mb = mapBanner;
  mapBanner = function (key, ...a) {
    const k = String(key),
      th = ban[k] || (/^tr\d*$/.test(k) ? "ghknight" : null),
      f = th && v73MapImg(th);
    return f ? RO.root + f : mb.call(this, key, ...a);
  };
  // 武鬥場的側欄標題原本寫「無盡之塔」
  const hd = ui.hud;
  ui.hud = function (...a) {
    const r = hd.apply(this, a);
    try {
      const el = document.querySelector("#slChip .hd");
      if (el && el.firstChild && /^無盡之塔/.test(el.firstChild.textContent || "")) el.firstChild.textContent = (el.firstChild.textContent || "").replace("無盡之塔", "無限武鬥場");
    } catch (e) {}
    return r;
  };
  for (const hv of Object.values(HELP))
    for (const r of Array.isArray(hv?.[1]) ? hv[1] : [])
      if (Array.isArray(r) && r[0] === "專屬場地" && typeof r[1] === "string" && !r[1].includes("背景")) r[1] += "各場地使用固定的 RO 地圖背景：魔王（獸人英雄 斐揚森林、伊夫利特 諾可羅德火山、冰暴騎士 拉赫冰洞）、巴風特與闇答萊屍 奧丁神殿、轉職試煉 古城騎士團、無限武鬥場 達納托斯之塔、MVP 武道場 葛城修道院。";
}

// ---------------------------------------------------------------------------
// 3. 活動名稱統一為「荒野回響」（地圖：米德加爾特・共生秘境）；說明裡舊的「諸神黃昏」改掉
function v73SeasonNameInstall() {
  if (typeof SEASON !== "undefined") SEASON.n = "荒野回響";
  const fix = (s) => (typeof s === "string" ? s.replace(/諸神黃昏/g, "荒野回響") : s);
  for (const hv of Object.values(HELP)) {
    if (!Array.isArray(hv)) continue;
    hv[0] = fix(hv[0]);
    for (const r of Array.isArray(hv[1]) ? hv[1] : []) if (Array.isArray(r)) (r[0] = fix(r[0])), (r[1] = fix(r[1]));
  }
  if (typeof RO_BGM_MAPNAME !== "undefined" && typeof SS_MAP !== "undefined" && MAPS[SS_MAP]) {
    const i = RO_BGM_MAPNAME.indexOf("諸神黃昏");
    if (i >= 0) RO_BGM_MAPNAME[i] = MAPS[SS_MAP].n;
  }
}

// ---------------------------------------------------------------------------
// 4. 一般地圖的深淵階級選單：深色底、亮色字；開啟深淵時發光
function v73AbySelInstall() {
  if (typeof document !== "undefined" && !document.getElementById("v73css")) {
    const st = document.createElement("style");
    st.id = "v73css";
    // #panel select 的 ID 選擇器優先度較高，這裡同樣以 #panel 開頭
    const A = "#panel .mapRow .v56aby select.sel.v73aby";
    st.textContent = `#panel .mapRow .v56aby .note{color:#6a3fb0;font-weight:700}
${A}{background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 7 4' shape-rendering='crispEdges'%3E%3Cpath fill='%23e6d4ff' d='M0 0h7v1h-1v1h-1v1h-1v1h-1v-1h-1v-1h-1v-1h-1z'/%3E%3C/svg%3E") no-repeat right 8px center/9px 5px,#241634;color:#f3e9ff;border:1px solid #7b55c9;border-image:none;border-radius:6px;padding:5px 24px 5px 10px;font-weight:700;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06);cursor:pointer}
${A}:hover,${A}:focus{border-color:#b98cff;outline:none}
${A}.on{background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 7 4' shape-rendering='crispEdges'%3E%3Cpath fill='%23e6d4ff' d='M0 0h7v1h-1v1h-1v1h-1v1h-1v-1h-1v-1h-1v-1h-1z'/%3E%3C/svg%3E") no-repeat right 8px center/9px 5px,#3d1656;border-color:#d2a2ff;color:#fff;box-shadow:0 0 0 1px #d2a2ff55,0 0 10px rgba(176,122,255,.7)}
${A} option{background:#241634;color:#f3e9ff}`;
    document.head.appendChild(st);
  }
  const mc = ui.mapCard;
  ui.mapCard = function (t, ...a) {
    const h = mc.call(this, t, ...a);
    if (typeof h !== "string") return h;
    const on = typeof v56AbyTier === "function" && v56AbyTier(t) > 0;
    return h.replace(/<select class="sel" data-v56aby=/, `<select class="sel v73aby${on ? " on" : ""}" data-v56aby=`);
  };
}

// ---------------------------------------------------------------------------
function v73Install() {
  v73AbyBossInstall();
  v73ArenaInstall();
  v73SeasonNameInstall();
  v73AbySelInstall();
}
if (typeof roV4Install === "function") {
  const r4v73 = roV4Install;
  roV4Install = function () {
    r4v73();
    v73Install();
  };
}
