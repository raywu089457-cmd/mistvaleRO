/* 流浪仙境 v6.7：遠程怪攻速、魔王頁與信物、主宰裝備改由巴風特掉落、傳說／神話卡片擴充、魔王掉落下修 */

// ---------------------------------------------------------------------------
// 1. 遠程普通怪（含菁英，不含頭目）攻擊間隔 ×2.5
const V67_RANGED = 2.5;
function v67RangedInstall() {
  const am = addMob;
  addMob = function (...a) {
    const n0 = G.mobs.length;
    const r = am.apply(this, a);
    if (G.mobs.length > n0) {
      const m = G.mobs[G.mobs.length - 1];
      if (m && !m.boss && (m.ranged || MON[m.type]?.ranged)) m.am = (m.am || 1) * V67_RANGED;
    }
    return r;
  };
}

// ---------------------------------------------------------------------------
// 2、3. 地圖分頁「終局」改名「魔王」；深淵掉落的印記改名「信物」（召喚魔王用）
const v67Token = (s) => String(s).replace(/守護者印記/g, "信物").replace(/印記/g, "信物");
function v67NameInstall() {
  for (const g of GUARD) if (g.tk) g.tk = g.tk.replace("印記", "信物");
  const pm = ui.p_map;
  ui.p_map = function (...a) {
    return pm.apply(this, a).replace(/(data-act="mview" data-v="end" aria-pressed="(?:true|false)">)終局/, "$1魔王");
  };
  const gb = ui.guardBoard;
  ui.guardBoard = function (...a) {
    return gb
      .apply(this, a)
      .replace(/<h3>守護者/, "<h3>魔王")
      .replace(/<span>印記 <b/g, "<span>信物 <b")
      .replace(/掉落印記/g, "掉落信物（召喚魔王用）");
  };
  const og = offlineGains;
  offlineGains = function (...a) {
    const r = og.apply(this, a);
    try {
      const sh = $("#sheet");
      if (sh && sh.innerHTML.includes("<dt>印記</dt>")) sh.innerHTML = sh.innerHTML.replace("<dt>印記</dt>", "<dt>信物</dt>");
    } catch (e) {}
    return r;
  };
  // 說明文字
  if (HELP.guard) {
    HELP.guard[0] = "魔王";
    for (const r of HELP.guard[1]) {
      if (r[0] === "印記") r[0] = "信物";
      if (typeof r[1] === "string") r[1] = v67Token(r[1]).replace(/守護者/g, "魔王");
    }
    if (!HELP.guard[1].some((r) => r[0] === "召喚")) HELP.guard[1].unshift(["召喚", "魔王頁的獸人英雄、伊夫利特、冰暴騎士各需要 1 個對應的信物才能挑戰；信物由深淵模式的怪物掉落（菁英與頭目機率較高）。集齊三位魔王的碎片可挑戰巴風特。"]);
  }
  for (const k of ["v56aby", "off"])
    for (const r of HELP[k]?.[1] || []) if (typeof r[1] === "string" && /守護者印記/.test(r[1])) r[1] = r[1].replace(/守護者印記/g, "信物（召喚魔王用）");
}

// ---------------------------------------------------------------------------
// 4. 主宰裝備：只由魔王巴風特掉落（任何部位、品質 150%、武器 0～7 孔、其他 0～4 孔）；
//    其他地方不再掉落主宰；鐵拳、獸人酋長之戒不再掉落（已取得的保留）
const V67_MY = { p: 0.05 };
function v67MythGear(lv) {
  const slot = SLOTS[ri(0, SLOTS.length - 1)],
    it = makeItem(Math.max(90, lv || 90), { slot, rar: 4 });
  if (!it) return null;
  it.my = 1;
  delete it.uq;
  delete it.v5;
  v5Convert(it);
  v5Name(it);
  return it;
}
function v67MythInstall() {
  for (const k of ["fist", "hh"]) if (UNIQUE[k]) UNIQUE[k].myw = 0;
  // 一般掉落不再擲主宰
  const ri0 = rollItem;
  rollItem = function (lv, a) {
    return ri0.call(this, lv, { ...(a || {}), off: 1 });
  };
  const fw = finalWin;
  finalWin = function (m, ...x) {
    const r = fw.call(this, m, ...x);
    if (RAND() < V67_MY.p) {
      const it = v67MythGear(S.lvl);
      if (it) dropLoot(m && m.x != null ? m : { x: G.pl.x, y: G.pl.y }, { it, col: rarColor(it), tier: 4, v67keep: 1 });
    }
    return r;
  };
  const fix = (k, name, txt) => {
    const r = HELP[k]?.[1]?.find((x) => x[0] === name);
    if (r) r[1] = txt;
  };
  for (const v of Object.values(HELP))
    if (Array.isArray(v) && Array.isArray(v[1])) {
      const r = v[1].find((x) => x[0] === "主宰" && typeof x[1] === "string" && /機率為主宰/.test(x[1]));
      if (r) r[1] = `最稀有的裝備：只由魔王巴風特掉落（${V67_MY.p * 100}%）。任何部位，品質 150%，插槽武器 0～7 孔、其他部位 0～4 孔（越多孔越稀有）。`;
    }
  fix("monarch", "必定掉落", "闇答萊屍已移至 MVP 武道場。");
}

// ---------------------------------------------------------------------------
// 6. 魔王戰（獸人英雄、伊夫利特、冰暴騎士、巴風特）的掉落皆為原本的 1/3
//    （魔王碎片照常掉落，以免無法召喚巴風特；巴風特的主宰另計）
const V67_BOSS_DROP = 1 / 3;
function v67BossDropInstall() {
  const gw = guardWin;
  guardWin = function (m, ...x) {
    if (m) m.v67md = 1;
    return gw.call(this, m, ...x);
  };
  const dl = dropLoot;
  dropLoot = function (t, a, ...x) {
    if (t && t.boss && (t.v67md || (G && G.guard != null && G.guard !== 4)) && a && a.fr == null && !a.v67keep && RAND() >= V67_BOSS_DROP) return;
    return dl.call(this, t, a, ...x);
  };
}

// ---------------------------------------------------------------------------
// 7.（見 4）獸人酋長之戒不再掉落

// ---------------------------------------------------------------------------
// 5. 傳說 +21、神話 +13 張卡片（RO 的 MVP 為藍本；數值沿用卡片公式）
const V67_CARD_DEF = [
  // ---- 傳說
  ["atroce", "惡狼阿特羅斯", 5, "W", { dmgp: 0.7, aspd: 0.6 }],
  ["taogunka", "道格加", 5, "W", { dmgp: 0.6, boss: 0.7 }],
  ["kiel", "凱爾 D-01", 5, "S", { dmgTaken: 0.6, cdr: 0.5 }],
  ["gloom", "陰暗之夜", 5, "S", { armorp: 0.7, res_all: 0.6 }],
  ["ktull", "克圖拉納克斯", 5, "S", { res_water: 0.7, dmgTaken: 0.5, armorp: 0.3 }],
  ["fbishop", "墮落大神官", 5, "H", { skill: 0.8, rint: 0.5 }],
  ["tanee", "塔妮女士", 5, "H", { cdr: 0.6, rdex: 0.5, minp: 0.3 }],
  ["amonra", "阿蒙拉", 5, "A", { lifep: 0.7, res_all: 0.6 }],
  ["orclord", "獸人酋長", 5, "A", { lifep: 0.6, rstr: 0.6, regenPct: 0.3 }],
  ["cenia", "埃尼格米・塞尼亞", 5, "A", { lifep: 0.6, graze: 0.5, armorp: 0.3 }],
  ["hatii", "冰狼哈提", 5, "G", { evap: 0.6, roElHit_chl: 0.5, res_water: 0.4 }],
  ["phreeoni", "弗里奧尼", 5, "G", { crit: 0.6, evap: 0.6 }],
  ["pdrake", "海盜德瑞克", 5, "B", { move: 0.6, lokp: 0.6 }],
  ["gioia", "喬伊亞", 5, "B", { move: 0.5, act: 0.5, roElHit_shk: 0.3 }],
  ["leak", "李克", 5, "B", { act: 0.7, crit: 0.4 }],
  ["tendril", "天德利恩", 5, "B", { move: 0.6, graze: 0.5 }],
  ["dsnake", "暗黑蛇王", 5, "B", { move: 0.5, ragi: 0.6, act: 0.3 }],
  ["rsx", "RSX-0806", 5, "X", { rstr: 0.6, critm: 0.6 }],
  ["gqscaraba", "黃金聖甲蟲女王", 5, "X", { rluk: 0.6, crit: 0.6 }],
  ["bacsojin", "白素貞", 5, "X", { rint: 0.6, skill: 0.5, cdr: 0.2 }],
  ["wmorroc", "受傷的莫洛克", 5, "X", { dmgp: 0.6, rvit: 0.5 }],
  // ---- 神話
  ["naght", "納特西格", 6, "W", { critm: 0.6, dmgp: 0.4 }, { dmg: 7 }],
  ["nidshadow", "尼德霍格之影", 6, "S", { dmgTaken: 0.6, res_all: 0.4 }, { life: 6 }],
  ["timeholder", "時光守護者", 6, "S", { dmgTaken: 0.5, cdr: 0.5 }, { life: 5 }],
  ["mthanatos", "達納托斯的記憶", 6, "H", { skill: 0.7, cdr: 0.4 }, { dmg: 6 }],
  ["entweihen", "恩特威亨", 6, "H", { cdr: 0.5, roElHit_shk: 0.5 }, { dmg: 6 }],
  ["smorroc", "撒旦莫洛克", 6, "A", { lifep: 0.6, dmgTaken: 0.4 }, { life: 8 }],
  ["mammoth", "猛瑪象王", 6, "A", { armorp: 0.7, lifep: 0.4 }, { life: 7 }],
  ["randgris", "蘭德格里斯", 6, "G", { evap: 0.6, aspd: 0.5 }, { dmg: 5 }],
  ["icetitan", "冰之泰坦", 6, "G", { res_all: 0.6, evap: 0.5 }, { life: 5 }],
  ["kraken", "克拉肯", 6, "B", { move: 0.6, graze: 0.5 }, { dmg: 4 }],
  ["solace", "索拉斯", 6, "B", { act: 0.6, move: 0.4, lokp: 0.3 }, { dmg: 4 }],
  ["boitata", "波伊塔塔", 6, "X", { brn: 0.6, roElHit_brn: 0.5 }, { dmg: 5 }],
  ["bijou", "碧茱", 6, "X", { rint: 0.6, skill: 0.6 }, { dmg: 5 }],
];
// 載入時就加入（在各說明文字與蒐藏統計建立之前）
(function v67CardInstall() {
  if (typeof V5_CARDS === "undefined") return;
  for (const [id, n, t, p, w, mo] of V67_CARD_DEF) {
    if (V5_CARD[id]) continue;
    const m = {};
    for (const [k, wt] of Object.entries(w)) {
      const v = V5_ANC[k] * wt * V5_TM[t] * V5_CARD_X;
      m[k] = V5_FRAC_K.has(k) ? +v.toFixed(V5_ANC[k] >= 0.1 ? 2 : 3) : k === "crit" ? Math.max(0.5, Math.round(v * 2) / 2) : Math.round(v) || Math.sign(v);
    }
    const c = { id, n: n + "卡片", t, p, m, ...(mo ? { mo: Object.fromEntries(Object.entries(mo).map(([k, v]) => [k, v * V5_CARD_X])) } : {}) };
    V5_CARDS.push(c);
    V5_CARD[id] = c;
  }
})();

// ---------------------------------------------------------------------------
function v67Install() {
  v67RangedInstall();
  v67NameInstall();
  v67MythInstall();
  v67BossDropInstall();
}
if (typeof roV4Install === "function") {
  const r4v67 = roV4Install;
  roV4Install = function () {
    r4v67();
    v67Install();
  };
}
