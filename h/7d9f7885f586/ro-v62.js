/* 流浪仙境 v6.2 — 移除「石板」系統與「神眷詞綴」
   ・石板：不再掉落；石板欄位、背包／倉庫石板頁、石板煉金（萃取、灌注、磨礪、腐化、洗鍊、奇蹟、插槽石板鑲嵌）全部移除。
     只供石板使用的符文石、封印石、磨礪石、腐化石、奇蹟石、洗鍊石停止掉落；舊存檔換成 Zeny。
   ・石板原本的地圖強化（怪物數量、菁英率、生成速度）改為固定加成：Lv78 以後的 4 張主線地圖與所有深淵階級。
   ・守護者印記改由「深淵模式」掉落（依所在地圖對應的守護者）。
   ・神眷詞綴：不再出現；保留規則條件、活動掉落標示與說明移除；舊裝備上的神眷詞綴會被移除。
   由 roV4Install() 結束後安裝（排在 v6 之後）。 */
"use strict";

var V62 = {
  // 固定地圖加成（約等於原本各一塊平均石板）
  fix: { dens: 6, elite: 6, spawn: 30 },
  fixLv: 78,
  // 停用素材 → Zeny（每顆）
  matZ: { s1: 100, r1: 100, c1: 110, m1: 220, h1: 100 },
};
const V62_GONE = new Set(Object.keys(V62.matZ));

// 目前是否在深淵（一般地圖，不含試煉、守護者、塔、武鬥場、活動）
const v62AbyOn = () => typeof v56AbyActive === "function" && v56AbyActive() && !ssMap();
// 固定加成是否生效
function v62FixOn(m = S.map) {
  if (!S || !G || m !== S.map || G.arena || G.tw || G.trial != null || G.guard != null || ssMap()) return false;
  if (m >= MAP_N) return false;
  return v62AbyOn() || (MAPS[m]?.lv?.[0] || 0) >= V62.fixLv;
}
const v62FixText = () => `怪物數量 +${V62.fix.dens}・菁英率 +${V62.fix.elite}%・生成速度 +${V62.fix.spawn}%`;

// 隨機抽一件主宰獨特（取代原本抽到的主宰石板）
function v62MythItem(lv) {
  const ks = mythKeys().filter((k) => k !== "slate");
  if (!ks.length) return null;
  return makeItem(Math.max(lv, MYTH_LV), { uniq: 1, uqk: mythPick(ks) });
}

// ---------------------------------------------------------------------------
// 掉落
function v62DropsInstall() {
  rollSlate = function () {
    return null;
  };
  takeSlate = function (t) {
    const z = t ? slateAsh(t) || 0 : 0;
    S.ash += z;
    ses().ash += z;
    return "salv";
  };
  // 守護者印記：深淵模式掉落，依所在地圖對應的守護者（機率與原本放置石板時相同）
  rollTicket = function (lv, elite, boss) {
    return v62AbyOn() && G.guard == null && RAND() < GUARD_TK[boss ? 2 : elite ? 1 : 0] ? guardOf(S.map) : -1;
  };
  const rm = rollMats;
  rollMats = function (...a) {
    return rm.apply(this, a).filter((k) => !V62_GONE.has(k));
  };
  const dm = dropMat;
  dropMat = function (t, k) {
    if (V62_GONE.has(k)) return;
    return dm.call(this, t, k);
  };
  // 主宰掉落池裡的「石板」改成主宰獨特
  const ri = rollItem;
  rollItem = function (lv, a) {
    return ri.call(this, lv, a).map((it) => (it && it.sl ? v62MythItem(lv) : it)).filter(Boolean);
  };
  const dl = dropLoot;
  dropLoot = function (t, d) {
    if (d && d.sl) {
      const it = v62MythItem(d.sl.ilvl || 90);
      if (!it) return;
      d = { it, col: rarColor(it), tier: rarTier(it) };
    }
    return dl.call(this, t, d);
  };
  // 活動地圖不再附加神眷詞綴
  ssDivine = function () {};
}

// ---------------------------------------------------------------------------
// 固定地圖加成（取代石板的怪物數量／菁英率／生成速度）
function v62FixInstall() {
  const ss = slateSum;
  slateSum = function (t, a = S.map, s) {
    const v = ss.call(this, t, a, s);
    return V62.fix[t] && v62FixOn(a) ? v + V62.fix[t] : v;
  };
}

// ---------------------------------------------------------------------------
// 介面
function v62UiInstall() {
  ui.slateBoard = function () {
    return "";
  };
  const pb = ui.p_bag;
  ui.p_bag = function () {
    if (this.bagView === "slates" || this.bagView === "runes") this.bagView = "items";
    return pb.call(this);
  };
  // 守護者：地圖清單標示「深淵掉落」
  const gb = ui.guardBoard;
  ui.guardBoard = function () {
    return gb.call(this).replace(/<span class="gmaps">/g, '<span class="gmaps"><span class="gmap v62aby" style="grid-column:1/-1;color:var(--muted)">深淵模式中，以下地圖掉落印記：</span>');
  };
  // 地圖卡片：固定加成
  const mc = ui.mapCard;
  ui.mapCard = function (t) {
    let h = mc.call(this, t);
    if (t >= MAP_N || ssMap(t)) return h;
    const lvOk = (MAPS[t]?.lv?.[0] || 0) >= V62.fixLv,
      aby = typeof v56AbyTier === "function" && v56AbyTier(t) > 0;
    if (!lvOk && !aby) return h;
    const row = `<div class="row v62fix"><span class="note" style="margin:0">終局加成：${v62FixText()}</span></div>`;
    const i = h.lastIndexOf("</div>");
    return i > 0 ? h.slice(0, i) + row + h.slice(i) : h + row;
  };
}

// ---------------------------------------------------------------------------
// 說明文字
function v62HelpInstall() {
  const row = (k, name, txt) => {
    const rows = HELP[k]?.[1];
    if (!rows) return;
    const i = rows.findIndex((r) => r[0] === name);
    if (i < 0) return;
    if (txt == null) rows.splice(i, 1);
    else rows[i] = [name, txt];
  };
  for (const k of ["slate", "bxtr", "inf", "fuse", "reroll", "corr", "holy", "mir", "alchx", "runes"]) delete HELP[k];
  row("stash", "可存放", "裝備與技能寶石。怪物卡片屬於各角色，不能存入倉庫；鑲嵌在裝備上的卡片會跟著裝備一起存入。");
  row("off", "不設上限", "最後一張地圖與活動地圖。");
  row("off", "掉落表", "與線上相同；包含守護者印記與寶石。");
  row("bag", "頁籤", "裝備、卡片兩頁。");
  row("keep", "石板、符文石", null);
  row("keep", "階級", null);
  row("keep", "詞綴計數", null);
  row("season", "開放", `${SEASON.lv} 級以上可前往「${MAPS[SS_MAP].n}」，怪物固定 ${SEASON.lv} 級。`);
  row("skill", "變異寶石", "所有怪物都可能掉落本職業的變異寶石（菁英、頭目機率較高）。效果數值、格數或元素會改變。");
  const sx = HELP.skill?.[1]?.find((r) => r[0] === "穿梭寶石");
  if (sx) sx[1] = sx[1].replace(/，石板詞綴「穿梭寶石」可再提高/, "");
  row("guard", "印記", `全部主線地圖通關後開放的「深淵模式」會掉落守護者印記（菁英、頭目機率較高）。地圖 1-4、5-8、9-${MAP_N} 各掉落對應守護者的印記。`);
  row("guard", "獎勵", `擊敗後掉落守護者碎片，15% 機率掉落這位守護者的獨特裝備，${(typeof V5_DROP !== "undefined" ? V5_DROP.guard : 0.015) * 100}% 機率掉落史詩或傳說卡片。`);
  row("tower", "規則", "第 11 層起，每 10 層增加一條負面規則。");
  row("tower", "腐化石", null);
  row("tower", "洗鍊石", null);
  row("tower", "里程碑", null);
  row("monarch", "機率掉落", "0.1% 主宰。第一次擊敗獲得稱號「君主殺手」。");
  if (HELP.v56aby) row("v56aby", "獎勵", `每階菁英出現率 +${V56_ABY.elite}%、裝備稀有度提升機率 +${V56_ABY.rup}%、卡片掉落率 +${V56_ABY.card * 100}%；另有終局加成（${v62FixText()}），並會掉落守護者印記。怪物等級越高經驗值越多。`);
  // 地圖說明：補上固定加成
  if (HELP.map?.[1] && !HELP.map[1].some((r) => r[0] === "終局加成"))
    HELP.map[1].push(["終局加成", `Lv${V62.fixLv} 以後的 4 張主線地圖與所有深淵階級：${v62FixText()}。`]);
}

// ---------------------------------------------------------------------------
// 舊存檔：石板、符文石、停用素材換成 Zeny；移除神眷詞綴
const V62_DONE = new WeakSet();
function v62StripDv(it) {
  if (!it || !Array.isArray(it.af) || !it.af.length) return 0;
  const n = it.af.length;
  it.af = it.af.filter((a) => !(a && typeof a.a === "string" && a.a.startsWith("dv_")));
  return n - it.af.length;
}
function v62SlAsh(t) {
  try {
    return slateAsh(t) || 0;
  } catch (e) {
    return 320;
  }
}
function v62RnAsh(t) {
  try {
    return runeAsh(t) || 0;
  } catch (e) {
    return 20;
  }
}
// 角色身上是否還有石板相關物品（每次都檢查，很便宜）
const v62Need = () =>
  !!(S && ((S.slates && S.slates.length) || (S.runes && S.runes.length) || (S.slt && S.slt.some((r) => r && r.s && r.s.some(Boolean))) || [...V62_GONE].some((k) => S.mat?.[k] > 0)));
function v62Migrate() {
  if (!S) return;
  const first = !V62_DONE.has(S);
  if (!first && !v62Need()) return;
  V62_DONE.add(S);
  let z = 0,
    ns = 0,
    nr = 0,
    nm = 0,
    nd = 0;
  // 角色身上
  for (const t of S.slates || []) (z += v62SlAsh(t)), ns++;
  for (const row of S.slt || []) for (const t of row?.s || []) if (t) (z += v62SlAsh(t)), ns++;
  for (const t of S.runes || []) (z += v62RnAsh(t)), nr++;
  if (Array.isArray(S.slates)) S.slates.length = 0;
  if (Array.isArray(S.runes)) S.runes.length = 0;
  if (Array.isArray(S.slt)) S.slt.length = 0;
  for (const k of V62_GONE) {
    const n = Math.max(0, Math.floor(S.mat?.[k] || 0));
    if (n) (z += n * V62.matZ[k]), (nm += n);
    if (S.mat && k in S.mat) delete S.mat[k];
  }
  if (first) {
    for (const k of Object.keys(S.equip || {})) nd += v62StripDv(S.equip[k]);
    for (const it of S.bag || []) nd += v62StripDv(it);
    // 保留規則：移除神眷詞綴條件
    const kp = (list) => {
      if (!Array.isArray(list)) return list;
      for (const g of list) if (g && Array.isArray(g.c)) g.c = g.c.filter((c) => c && c.k !== "dv");
      return list.filter((g) => !g || !Array.isArray(g.c) || g.c.length);
    };
    if (S.set) S.set.keep = kp(S.set.keep);
    // 共用倉庫
    try {
      const st = stLoad();
      let ch = false;
      st.it = st.it.filter((x) => {
        if (x.k === "slates") return (z += v62SlAsh(x.o)), ns++, (ch = true), false;
        if (x.k === "runes") return (z += v62RnAsh(x.o)), nr++, (ch = true), false;
        if (x.k === "bag" && v62StripDv(x.o)) (nd++, (ch = true));
        return true;
      });
      for (const k of V62_GONE) {
        const n = Math.max(0, Math.floor(st.mat?.[k] || 0));
        if (st.mat && k in st.mat) (delete st.mat[k], (ch = true));
        if (n) (z += n * V62.matZ[k]), (nm += n);
      }
      if (st.kp?.keep) (st.kp.keep = kp(st.kp.keep)), (ch = true);
      if (ch) stWrite(st), (STH = st);
    } catch (e) {}
  }
  if (z) S.ash += z;
  if (z || nd) {
    const p = [];
    if (ns) p.push(`石板 ${ns} 塊`);
    if (nr) p.push(`符文石 ${nr} 顆`);
    if (nm) p.push(`石板素材 ${nm} 個`);
    const msg = `v6.2 移除石板系統：${p.length ? p.join("、") + ` 已換成 ${fmt(z)} Zeny` : ""}${nd ? `${p.length ? "；" : ""}移除 ${nd} 條神眷詞綴` : ""}`;
    later(1.8, () => toast(msg, "lvl", 1));
    markDirty();
  }
}

function v62Install() {
  v62DropsInstall();
  v62FixInstall();
  v62UiInstall();
  v62HelpInstall();
  const ens = roEnsureStats;
  roEnsureStats = function () {
    v62Migrate();
    return ens.apply(this, arguments);
  };
}

if (typeof roV4Install === "function") {
  const r4v62 = roV4Install;
  roV4Install = function () {
    r4v62();
    v62Install();
  };
}
var V62_BUILD = "v6.2";
