/* 流浪仙境 v5 — RO 式裝備：8 個部位、基底素質＋額外素質（±50% 浮動）、卡片插槽、
   精煉 +1～+10、怪物卡片（6 階）與蒐藏、煉金工坊（分解／精煉／鑲嵌／卡片合成）。
   roV5Install() 由 roV4Install() 在屬性詞綴轉換之前呼叫，因此卡片上的
   rstr…rdex 等鍵值也會被換算成引擎的數值。 */
"use strict";

// ---------------------------------------------------------------------------
// 部位與名稱
const V5_PART = { W: "武器", S: "盾牌", H: "頭飾", A: "鎧甲", G: "披肩", B: "鞋子", X: "飾品" };
const V5_SLOT_PART = { weapon: "W", shield: "S", helm: "H", chest: "A", gloves: "G", boots: "B", ring: "X", amulet: "X" };
const V5_TIER = [
  null,
  { n: "普通", c: "#7d8894" },
  { n: "精良", c: "#2f9a3a" },
  { n: "稀有", c: "#2f72c8" },
  { n: "史詩", c: "#8a4fd0" },
  { n: "傳說", c: "#d9771c" },
  { n: "神話", c: "#d63845" },
];
const V5_EL = { neutral: "無", water: "水", earth: "地", fire: "火", wind: "風", poison: "毒", holy: "聖", shadow: "暗", ghost: "念", undead: "不死" };
// 怪物的攻擊屬性（RO 原版屬性為參考）
const V5_MOB_EL = {
  slime: "water", wolf: "fire", goblin: "wind", bat: "shadow", skeleton: "undead", wisp: "ghost",
  golem: "earth", imp: "fire", knight: "shadow", gd0: "earth", gd1: "fire", gd2: "wind",
  fin: "shadow", mon: "undead", thun: "poison", siren: "water", soul: "fire",
  ro_fungal: "poison", ro_stag: "earth", ro_scarab: "fire", dummy: "neutral",
  dullahan: "undead", loli: "shadow", venatu: "neutral", dimik: "earth", ferus: "fire", acidus: "wind", eremes: "poison", kathryne: "ghost",
};
// 地圖頭目的屬性（依地圖編號）
const V5_BOSS_EL = ["holy", "fire", "undead", "undead", "water", "wind", "fire", "shadow", "undead", "earth", "ghost", "undead", "holy", "shadow", "fire"];

// ---------------------------------------------------------------------------
// 素質：顯示名稱與 Lv100 參考值（權重 1.0 時約等於一條舊詞綴）
const V5_REF = {
  rstr: 12, rvit: 12, ragi: 12, rluk: 12, rint: 12, rdex: 12,
  life: 160, lifep: 22, armor: 215, armorp: 85, eva: 105, evap: 58, regen: 26,
  crit: 8.5, critm: 82, aspd: 15, act: 18, move: 30, cdr: 14, area: 28, skill: 60,
  dmgp: 41, adddmg: 23, minp: 60, psn: 90, brn: 90, bld: 90, pot: 57, lok: 46, revive: 35,
};
const V5_FLAT = new Set(Object.keys(V5_EL).map((e) => "res_" + e).concat("res_all"));
for (const k of V5_FLAT) V5_REF[k] = 20;
const V5_KN = {
  rstr: ["力量", ""], rvit: ["體質", ""], ragi: ["敏捷", ""], rluk: ["幸運", ""], rint: ["智力", ""], rdex: ["靈巧", ""],
  life: ["最大生命", ""], lifep: ["最大生命", "%"], armor: ["護甲", ""], armorp: ["護甲", "%"], eva: ["閃避", ""],
  evap: ["閃避", "%"], regen: ["每秒生命回復", ""], crit: ["暴擊率", "%"], critm: ["暴擊傷害", "%"],
  aspd: ["攻擊速度", "%"], act: ["行動速度", "%"], move: ["移動速度", "%"], cdr: ["冷卻縮減", "%"],
  area: ["技能範圍", "%"], skill: ["技能傷害", "%"], dmgp: ["傷害增加", "%"], adddmg: ["附加攻擊傷害", ""],
  minp: ["召喚物傷害", "%"], psn: ["中毒傷害", "%"], brn: ["燃燒傷害", "%"], bld: ["流血傷害", "%"],
  pot: ["藥水效果", "%"], lok: ["擊殺回復生命", ""], revive: ["復活時間縮短", "%"], res_all: ["全屬性抗性", "%"],
};
for (const [e, n] of Object.entries(V5_EL)) V5_KN["res_" + e] = [n + "屬性抗性", "%"];
// 以比例儲存的特殊效果（顯示時 ×100）
const V5_FRAC = {
  leech: (v) => `擊中時以傷害的 ${v}% 回復生命`,
  lokp: (v) => `擊殺回復 ${v}% 最大生命`,
  boss: (v) => `對頭目與菁英傷害 +${v}%`,
  dmgTaken: (v) => `受到的傷害 −${v}%`,
  graze: (v) => `受到攻擊時 ${v}% 機率傷害減半`,
  regenPct: (v) => `每秒回復 ${v}% 最大生命`,
  chlVul: (v) => `對冰緩的敵人傷害 +${v}%`,
  psnVul: (v) => `對中毒的敵人傷害 +${v}%`,
  exec: (v) => `對生命低於 20% 的敵人傷害 +${v}%`,
  roElHit_brn: (v) => `擊中時 ${v}% 機率使敵人燃燒`,
  roElHit_chl: (v) => `擊中時 ${v}% 機率使敵人冰緩`,
  roElHit_shk: (v) => `擊中時 ${v}% 機率使敵人感電`,
  v5pBlast: (v) => `擊中時 ${v}% 機率引發怒爆，對周圍造成 150% 傷害`,
  v5pMeteor: (v) => `擊中時 ${v}% 機率降下隕石，對周圍造成 250% 傷害`,
  v5pBolt: (v) => `擊中時 ${v}% 機率落雷，對目標額外造成 200% 傷害`,
};
const V5_MORE = { dmg: "總傷害額外", life: "最大生命額外", skill: "技能傷害額外", armor: "護甲額外", eva: "閃避值額外" };
const v5Num = (v) => (Math.abs(v) < 10 && v % 1 ? +v.toFixed(1) : Math.round(v));
function v5Line(k, v) {
  if (V5_FRAC[k]) return V5_FRAC[k](+(v * 100).toFixed(1));
  const kn = V5_KN[k];
  if (!kn) return `${k} ${v}`;
  const n = v5Num(v);
  return `${kn[0]} ${n >= 0 ? "+" : "−"}${Math.abs(n)}${kn[1]}`;
}
const v5MoreLine = (k, v) => `${V5_MORE[k] || k} +${v}%`;
// 等級縮放：Lv10 約 23%、Lv40 約 49%、Lv100 為 100%，超過 100 級每級 +0.5%
const v5Lv = (L) => (L <= 100 ? 0.15 + 0.85 * (Math.max(1, L) / 100) : 1 + 0.005 * (L - 100));

// ---------------------------------------------------------------------------
// 裝備基底資料庫（名稱、圖示、最低物品等級、防禦倍率、類型 a=護甲 e=閃避、額外素質權重）
const V5_BASES = {
  shield: [
    ["護盾", 2101, 1, 1.0, "a", { life: 0.6, rvit: 0.4 }],
    ["圓盾", 2104, 12, 0.8, "e", { evap: 0.5, ragi: 0.5 }],
    ["盾牌", 2101, 25, 1.1, "a", { armorp: 0.5, res_neutral: 0.6 }],
    ["鏡盾", 2107, 40, 1.0, "a", { armorp: 0.4, res_all: 0.2, rint: 0.3 }],
    ["聖盾", 2110, 55, 1.2, "a", { lifep: 0.5, res_shadow: 0.8, res_undead: 0.8 }],
    ["太陽之盾", 2107, 70, 1.25, "a", { armorp: 0.5, lifep: 0.4, res_fire: 0.7 }],
    ["瓦爾基麗之盾", 2110, 85, 1.35, "a", { lifep: 0.5, res_all: 0.25, rvit: 0.4 }],
  ],
  helm: [
    ["帽子", 2220, 1, 0.8, "a", { life: 0.6, rvit: 0.3 }],
    ["髮箍", 2210, 5, 0.5, "e", { rdex: 0.5, crit: 0.4 }],
    ["墨鏡", 2201, 10, 0.4, "e", { rdex: 0.6, critm: 0.4 }],
    ["頭盔", 2228, 20, 1.1, "a", { armorp: 0.4, life: 0.5 }],
    ["貓耳髮箍", 2213, 30, 0.6, "e", { ragi: 0.5, aspd: 0.5 }],
    ["眼罩", 2205, 38, 0.5, "e", { crit: 0.5, critm: 0.5 }],
    ["花髮飾", 2207, 45, 0.4, "e", { rint: 0.6, cdr: 0.4 }],
    ["頭冠", 2234, 55, 0.9, "a", { rint: 0.6, skill: 0.5 }],
    ["王冠", 2235, 65, 1.0, "a", { rstr: 0.5, dmgp: 0.5 }],
    ["天使之翼髮飾", 2254, 75, 0.8, "e", { rluk: 0.5, lifep: 0.4, res_holy: 0.7 }],
    ["巨角山羊頭盔", 2256, 85, 1.3, "a", { rstr: 0.5, dmgp: 0.5, lifep: 0.3 }],
  ],
  chest: [
    ["棉襯衫", 2301, 1, 0.7, "e", { life: 0.5, ragi: 0.3 }],
    ["皮夾克", 2304, 6, 0.9, "a", { life: 0.6, rvit: 0.3 }],
    ["斗篷", 2307, 14, 0.8, "e", { evap: 0.5, ragi: 0.4 }],
    ["外套", 2310, 22, 1.0, "a", { lifep: 0.4, rvit: 0.4 }],
    ["軟墊鎧甲", 2313, 30, 1.15, "a", { armorp: 0.5, res_neutral: 0.6 }],
    ["鎖子甲", 2314, 38, 1.25, "a", { armorp: 0.5, life: 0.5 }],
    ["緊身衣", 2330, 46, 0.9, "e", { evap: 0.6, ragi: 0.4, crit: 0.2 }],
    ["聖職者長袍", 2325, 54, 1.0, "a", { rint: 0.5, lifep: 0.4, res_shadow: 0.6 }],
    ["鋼板鎧甲", 2316, 62, 1.35, "a", { armorp: 0.6, lifep: 0.4 }],
    ["閃亮夾克", 2319, 70, 1.0, "e", { evap: 0.6, aspd: 0.4, res_wind: 0.6 }],
    ["禮服", 2320, 78, 1.0, "a", { dmgp: 0.5, lifep: 0.4, rluk: 0.2 }],
    ["領主之衣", 2315, 86, 1.4, "a", { lifep: 0.6, armorp: 0.4, res_all: 0.15 }],
    ["刺客暗影衣", 2331, 86, 1.15, "e", { evap: 0.6, critm: 0.4, ragi: 0.3 }],
  ],
  gloves: [
    ["連帽披肩", 2501, 1, 0.8, "e", { evap: 0.4, res_neutral: 0.4 }],
    ["圍巾", 2504, 15, 0.9, "a", { life: 0.5, res_neutral: 0.6 }],
    ["長披風", 2501, 30, 1.0, "e", { evap: 0.5, ragi: 0.4 }],
    ["古代披肩", 2507, 45, 1.0, "a", { res_all: 0.25, life: 0.5 }],
    ["天使之羽披風", 2504, 60, 1.1, "e", { evap: 0.5, move: 0.3, rluk: 0.3 }],
    ["瓦爾基麗披肩", 2507, 75, 1.2, "a", { lifep: 0.4, res_all: 0.25, armorp: 0.3 }],
    ["惡魔披風", 2501, 85, 1.2, "e", { dmgp: 0.4, evap: 0.4, crit: 0.3 }],
  ],
  boots: [
    ["涼鞋", 2401, 1, 0.6, "e", { move: 0.5, ragi: 0.3 }],
    ["鞋子", 2403, 10, 0.9, "a", { life: 0.5, rvit: 0.3 }],
    ["長靴", 2405, 22, 1.0, "a", { life: 0.5, move: 0.4 }],
    ["鐵靴", 2406, 35, 1.1, "a", { armorp: 0.4, rvit: 0.4 }],
    ["水晶高跟鞋", 2407, 48, 0.7, "e", { act: 0.5, rint: 0.4 }],
    ["戰靴", 2404, 60, 1.2, "a", { lifep: 0.4, move: 0.4 }],
    ["斯雷普尼爾", 2410, 78, 1.2, "e", { move: 0.6, act: 0.4, lifep: 0.3 }],
  ],
  ring: [
    ["戒指", 2601, 1, 0, null, { rstr: 0.8, adddmg: 0.4 }],
    ["手套", 2604, 8, 0, null, { rdex: 0.8, crit: 0.4 }],
    ["胸針", 2605, 18, 0, null, { ragi: 0.8, aspd: 0.4 }],
    ["銀戒指", 2611, 35, 0, null, { rluk: 0.6, crit: 0.4, critm: 0.3 }],
    ["衣夾", 2607, 55, 0, null, { dmgp: 0.6, rdex: 0.4 }],
    ["骷髏戒指", 2601, 75, 0, null, { dmgp: 0.6, crit: 0.4, rstr: 0.3 }],
  ],
  amulet: [
    ["項鍊", 2603, 1, 0, null, { rvit: 0.8, life: 0.5 }],
    ["耳環", 2602, 8, 0, null, { rint: 0.8, cdr: 0.3 }],
    ["念珠", 2608, 20, 0, null, { rluk: 0.6, regen: 0.4, res_holy: 0.4 }],
    ["十字架項鍊", 2603, 40, 0, null, { lifep: 0.5, rvit: 0.5 }],
    ["智慧耳環", 2602, 60, 0, null, { rint: 0.6, skill: 0.5 }],
    ["天使之羽項鍊", 2608, 80, 0, null, { skill: 0.5, cdr: 0.4, rluk: 0.3 }],
  ],
};
// 武器：依轉職分支（或一轉職業）決定額外素質與單手／雙手
const V5_WEX = {
  ro_sword_0: [1, { rstr: 0.6, critm: 0.4 }], ro_sword_1: [0, { rvit: 0.5, life: 0.5 }],
  ro_sword_2: [1, { rstr: 0.7, critm: 0.4 }], ro_sword_3: [0, { rstr: 0.5, rint: 0.4 }],
  ro_bow_0: [1, { rdex: 0.6, aspd: 0.4 }], ro_bow_1: [1, { rdex: 0.6, crit: 0.4 }],
  ro_bow_2: [1, { rdex: 0.6, critm: 0.4 }], ro_bow_3: [0, { rdex: 0.4, rint: 0.4, act: 0.3 }],
  ro_mage_0: [0, { rint: 0.7, cdr: 0.3 }], ro_mage_1: [0, { rint: 0.6, skill: 0.4 }],
  ro_mage_2: [0, { rint: 0.6, area: 0.4 }], ro_mage_3: [1, { rint: 0.8, skill: 0.5 }],
  ro_thief_0: [1, { crit: 0.6, critm: 0.5 }], ro_thief_1: [0, { ragi: 0.5, crit: 0.5 }],
  ro_thief_2: [1, { ragi: 0.4, crit: 0.5, psn: 0.4 }], ro_thief_3: [0, { ragi: 0.5, critm: 0.4 }],
  ro_acolyte_0: [0, { rint: 0.5, rvit: 0.4 }], ro_acolyte_1: [0, { rstr: 0.5, aspd: 0.4 }],
  ro_acolyte_2: [0, { rint: 0.6, life: 0.4 }], ro_acolyte_3: [0, { rstr: 0.5, critm: 0.4 }],
  ro_merchant_0: [1, { rstr: 0.7, critm: 0.4 }], ro_merchant_1: [0, { rint: 0.4, rdex: 0.4, psn: 0.3 }],
  ro_merchant_2: [0, { rdex: 0.5, minp: 0.4 }], ro_merchant_3: [0, { rint: 0.5, psn: 0.4 }],
  sword: [0, { rstr: 0.5, life: 0.4 }], bow: [1, { rdex: 0.6, aspd: 0.4 }], mage: [0, { rint: 0.6, cdr: 0.3 }],
  thief: [0, { ragi: 0.5, crit: 0.5 }], acolyte: [0, { rint: 0.5, rvit: 0.4 }], merchant: [0, { rstr: 0.5, rluk: 0.4 }],
};
const V5_WK = (L) => 1.1 + 0.4 * Math.min(1, L / 100), // 武器基底攻擊倍率（取代舊詞綴的武器傷害%）
  V5_WAPS = 1.1, // 武器攻速倍率（取代舊詞綴的武器攻速）
  V5_H2 = 1.25; // 雙手武器額外倍率
// 稀有度 → 素質浮動範圍（50%～150%）
const V5_Q = [
  [0.5, 0.9],
  [0.6, 1.1],
  [0.8, 1.3],
  [1.0, 1.5],
  [1.3, 1.5],
];
const V5_XW = 0.85; // 額外素質整體倍率
const V5_EVA = 0.45; // 閃避型防具：閃避 = 防禦基底 × 0.45
const V5_Q_UQ = [0.9, 1.4],
  V5_Q_MY = [1.5, 1.5];
// 卡片插槽（v5.3 大幅下修）：依稀有度決定上限，每多 1 孔機率大幅降低（0／1／2 孔約 60／30／10）
// [普通, 魔法, 稀有, 傳奇, 神話]；主宰、獨特另計
const V5_CAP_W = [1, 1, 2, 3, 5],
  V5_CAP_A = [0, 1, 1, 2, 3],
  V5_CAP_MY = { W: 7, A: 4 },
  V5_CAP_UQ = { W: 3, A: 2 };
const V5_HOLE_W = [60, 30, 10, 4, 1.5, 0.6, 0.25, 0.1];
function v5SlotCap(it) {
  const W = it.slot === "weapon";
  if (it.my) return W ? V5_CAP_MY.W : V5_CAP_MY.A;
  if (it.uq) return W ? V5_CAP_UQ.W : V5_CAP_UQ.A;
  return (W ? V5_CAP_W : V5_CAP_A)[Math.max(0, Math.min(4, it.rar || 0))];
}
const V5_SLOT_TXT = "武器：普通 0～1、魔法 0～1、稀有 0～2、傳奇 0～3、神話 0～5、主宰 0～7、獨特 0～3；其他部位：普通 0、魔法 0～1、稀有 0～1、傳奇 0～2、神話 0～3、主宰 0～4、獨特 0～2。每多 1 孔機率大幅降低（約 60%／30%／10%…）";
const v5RollSlots = (cap) => v5Rng(V5_HOLE_W.slice(0, cap + 1).map((w, i) => [i, w]));
// 精煉：裝備基底倍率、成功率、素材
const V5_REF_MUL = [1, 1.06, 1.12, 1.18, 1.24, 1.31, 1.38, 1.46, 1.55, 1.65, 1.76];
const V5_REF_OK = [0, 100, 100, 100, 100, 80, 65, 50, 35, 25, 15];
const v5RefMat = (it, lv) => (it.slot === "weapon" ? "x" : "i") + (lv <= 5 ? 2 : lv <= 8 ? 3 : 4);
// v5.5：48 小時模擬中 Zeny 累積到 140 萬以上卻沒有用途，精煉／鑲嵌／合成的費用改為依精煉值、階級平方成長
const v5RefZeny = (it, lv) => Math.round(lv * lv * (5 + 1.5 * it.ilvl));
// 防具基底生命：鎧甲 1.0、其他防具 0.5（以 Lv100 160 點為 1.0），低等級時較少
const v5BaseHp = (slot, L, q) => Math.max(1, Math.round(V5_REF.life * (slot === "chest" ? 1 : 0.5) * Math.pow(v5Lv(L), 1.5) * q));
const v5RefMul = (it) => V5_REF_MUL[Math.min(10, it?.ref || 0)];
const v5RefX = (it) => 1 + 0.03 * (it?.ref || 0); // 額外素質的精煉加成
// 卡片鑲嵌／拆卸／合成的消耗與成功率
// 鑲嵌成功率（v5.3 下修，階級越高越難）
const V5_INS_OK = [0, 85, 70, 55, 40, 28, 18];
const v5InsZeny = (t) => 150 * t * t,
  v5RemZeny = (t) => 500 * t * t,
  v5FuseZeny = (t) => 200 * t * t;
// 蒐藏：每蒐集到 1 種卡片，傷害增加與最大生命 +0.4%
const V5_COL = { d: 0.12, l: 0.12 };

// ---------------------------------------------------------------------------
// 怪物卡片：120 種，名稱取自 RO，效果依本遊戲設計；卡片視為強化素材，不綁定掉落的怪物。
// 每張卡的效果 = 基準值 × 權重 × 階級倍率（史詩 = 1）。
const V5_ANC = {
  dmgp: 10, skill: 10, critm: 15, crit: 2, aspd: 5, cdr: 4, area: 10, boss: 0.12, minp: 15,
  psn: 25, brn: 25, bld: 25, lifep: 8, life: 120, armorp: 15, evap: 15, res_all: 3,
  dmgTaken: 0.04, regenPct: 0.003, move: 8, act: 4, leech: 0.004, lokp: 0.006, revive: 25, graze: 0.08,
  roElHit_brn: 0.06, roElHit_chl: 0.06, roElHit_shk: 0.06, v5pBlast: 0.05, v5pMeteor: 0.025, v5pBolt: 0.05, adddmg: 6,
  rstr: 5, rvit: 5, ragi: 5, rluk: 5, rint: 5, rdex: 5,
};
for (const e of Object.keys(V5_EL)) V5_ANC["res_" + e] = 12;
const V5_TM = [0, 0.6, 0.75, 0.88, 1, 1.25, 1.5];
// v5.3：插槽變少，卡片數值 ×2
const V5_CARD_X = 2;
// [id, 名稱, 階級, 部位, 權重, 額外倍率(神話)]
const V5_CARD_DEF = [
  // ---- 普通（30）
  ["dwolf", "沙漠之狼幼犬", 1, "W", { dmgp: 1 }],
  ["andre", "工蟻", 1, "W", { dmgp: 0.6, rstr: 0.5 }],
  ["hornet", "黃蜂", 1, "W", { dmgp: 0.5, aspd: 0.5 }],
  ["snake", "蛇", 1, "W", { psn: 0.7, dmgp: 0.4 }],
  ["picky", "小雞", 1, "W", { dmgp: 0.5, crit: 0.5 }],
  ["crab", "螃蟹", 1, "S", { armorp: 0.6, res_water: 0.6 }],
  ["shellfish", "海螺", 1, "S", { armorp: 0.5, lifep: 0.5 }],
  ["toad", "蟾蜍", 1, "S", { res_poison: 0.7, lifep: 0.4 }],
  ["thiefbug", "盜蟲", 1, "S", { graze: 0.6, armorp: 0.4 }],
  ["poporing", "波波利", 1, "H", { rint: 0.5, cdr: 0.5 }],
  ["sporem", "蘑菇孢子", 1, "H", { skill: 0.6, rint: 0.4 }],
  ["mandragora", "曼陀羅", 1, "H", { area: 0.6, cdr: 0.4 }],
  ["roda", "洛達蛙", 1, "H", { rdex: 0.5, crit: 0.5 }],
  ["poring", "波利", 1, "A", { rluk: 0.4, lifep: 0.7 }],
  ["fabre", "法布爾", 1, "A", { rvit: 0.6, life: 0.5 }],
  ["pupa", "蟲蛹", 1, "A", { lifep: 0.6, armorp: 0.5 }],
  ["zombie", "殭屍", 1, "A", { lifep: 0.5, res_undead: 0.7 }],
  ["pspore", "毒孢子", 1, "A", { res_poison: 0.7, lifep: 0.4 }],
  ["condor", "禿鷹", 1, "G", { evap: 0.8, ragi: 0.3 }],
  ["wolf", "野狼", 1, "G", { evap: 0.5, move: 0.5 }],
  ["willow", "樹精", 1, "G", { res_earth: 0.6, evap: 0.5 }],
  ["vadon", "瓦登", 1, "G", { res_fire: 0.7, evap: 0.4 }],
  ["goblin", "哥布靈", 1, "B", { move: 0.6, ragi: 0.4 }],
  ["rocker", "蝗蟲", 1, "B", { ragi: 0.6, move: 0.4 }],
  ["horn", "獨角蟲", 1, "B", { act: 0.5, lifep: 0.4 }],
  ["gplant", "綠色植物", 1, "B", { regenPct: 0.6, lifep: 0.4 }],
  ["lunatic", "瘋兔", 1, "X", { rluk: 0.6, crit: 0.4 }],
  ["chonchon", "蒼蠅", 1, "X", { ragi: 0.7, aspd: 0.3 }],
  ["starfish", "海星", 1, "X", { rdex: 0.6, rint: 0.4 }],
  ["tadpole", "蝌蚪", 1, "X", { rint: 0.7, cdr: 0.3 }],
  // ---- 精良（28）
  ["drainliar", "吸血蝙蝠", 2, "W", { leech: 0.6, dmgp: 0.5 }],
  ["skelarcher", "骷髏弓箭手", 2, "W", { dmgp: 0.7, crit: 0.4 }],
  ["orcwar", "獸人戰士", 2, "W", { dmgp: 0.7, rstr: 0.4 }],
  ["mantis", "螳螂", 2, "W", { critm: 0.7, aspd: 0.3 }],
  ["scorpion", "蠍子", 2, "W", { dmgp: 0.5, boss: 0.5 }],
  ["skelsold", "邪骸士兵", 2, "S", { armorp: 0.6, res_undead: 0.6 }],
  ["orczombie", "獸人殭屍", 2, "S", { res_undead: 0.5, lifep: 0.5 }],
  ["mummy", "木乃伊", 2, "S", { dmgTaken: 0.6, res_shadow: 0.4 }],
  ["kappa", "河童", 2, "S", { res_water: 0.7, graze: 0.4 }],
  ["kukre", "庫克雷", 2, "H", { rint: 0.5, cdr: 0.5 }],
  ["smokie", "狸貓", 2, "H", { skill: 0.6, rluk: 0.4 }],
  ["orcskel", "獸人骷髏", 2, "H", { skill: 0.5, rstr: 0.5 }],
  ["clock", "時鐘", 2, "H", { cdr: 0.7, rdex: 0.3 }],
  ["golem", "巨石怪", 2, "A", { armorp: 0.7, rvit: 0.4 }],
  ["alligator", "鱷魚", 2, "A", { lifep: 0.6, res_water: 0.5 }],
  ["bigfoot", "大腳熊", 2, "A", { life: 0.6, lifep: 0.5 }],
  ["piratesk", "海盜骷髏", 2, "A", { armorp: 0.5, res_undead: 0.6 }],
  ["argos", "蜘蛛", 2, "G", { evap: 0.7, res_poison: 0.4 }],
  ["wisp", "鬼火", 2, "G", { res_ghost: 0.6, evap: 0.5 }],
  ["snowier", "雪人", 2, "G", { res_water: 0.5, evap: 0.5 }],
  ["savage", "野豬", 2, "G", { graze: 0.5, evap: 0.5 }],
  ["matyr", "瑪帝爾", 2, "B", { ragi: 0.6, move: 0.5 }],
  ["verit", "維里特", 2, "B", { lifep: 0.6, act: 0.3 }],
  ["sohee", "蘇西", 2, "B", { regenPct: 0.6, lifep: 0.4 }],
  ["zerom", "傑羅姆", 2, "X", { rdex: 0.6, aspd: 0.4 }],
  ["kobold", "肯貝特", 2, "X", { rstr: 0.6, crit: 0.4 }],
  ["bongun", "妖道", 2, "X", { rvit: 0.6, lifep: 0.3 }],
  ["eggpicky", "蛋殼小雞", 2, "X", { rluk: 0.6, cdr: 0.3 }],
  // ---- 稀有（24）
  ["abysmal", "深淵騎士", 3, "W", { boss: 1 }],
  ["khalitz", "卡利斯", 3, "W", { dmgp: 0.6, critm: 0.5 }],
  ["orcarcher", "獸人弓箭手", 3, "W", { dmgp: 0.7, aspd: 0.4 }],
  ["larva", "熔礦幼蟲", 3, "S", { res_fire: 0.7, armorp: 0.5 }],
  ["gargoyle", "石像鬼", 3, "S", { dmgTaken: 0.6, armorp: 0.4 }],
  ["angguard", "天使守衛", 3, "S", { res_shadow: 0.6, lifep: 0.5 }],
  ["spore", "游離孢子", 3, "H", { psn: 0.6, rint: 0.4 }],
  ["marduk", "瑪爾杜克", 3, "H", { skill: 1 }],
  ["skelwiz", "骷髏巫師", 3, "H", { skill: 0.6, cdr: 0.4 }],
  ["thunderelf", "雷精靈", 3, "H", { rint: 0.5, roElHit_shk: 0.5 }],
  ["goblinlead", "哥布靈首領", 3, "A", { lifep: 0.7, rvit: 0.4 }],
  ["skelgen", "骷髏將軍", 3, "A", { armorp: 0.6, lifep: 0.5 }],
  ["fireelf", "火焰精靈", 3, "A", { res_fire: 0.6, lifep: 0.5 }],
  ["whisper", "幽靈", 3, "G", { evap: 1, res_ghost: -0.6 }],
  ["raydric", "雷德利克", 3, "G", { res_neutral: 1 }],
  ["ghostwoman", "鬼女", 3, "G", { evap: 0.6, graze: 0.5 }],
  ["snowwolf", "雪狼", 3, "G", { res_water: 0.6, evap: 0.5 }],
  ["moonsprite", "月芽精靈", 3, "B", { act: 0.5, cdr: 0.5 }],
  ["salamander", "火蜥蜴", 3, "B", { move: 0.6, res_fire: 0.5 }],
  ["shadowwolf", "暗影狼", 3, "B", { move: 0.5, ragi: 0.5 }],
  ["deviruchi", "小惡魔", 3, "X", { rstr: 0.6, dmgp: 0.5 }],
  ["medusa", "蛇女", 3, "X", { rint: 0.6, skill: 0.5 }],
  ["darkmage", "暗黑法師", 3, "X", { cdr: 0.6, rint: 0.4 }],
  ["ninetail", "九尾狐", 3, "X", { rluk: 0.6, crit: 0.5 }],
  // ---- 史詩（18）
  ["drake", "海神", 4, "W", { dmgp: 1 }],
  ["turtle", "龜王", 4, "W", { dmgp: 0.7, v5pBlast: 0.6 }],
  ["thanatos", "達納托斯的憎恨", 4, "W", { critm: 1, crit: 0.5 }],
  ["gtb", "黃金蟲", 4, "S", { dmgTaken: 1 }],
  ["whiteknight", "白騎士", 4, "S", { armorp: 0.8, res_shadow: 0.5 }],
  ["clockmaster", "時鐘塔管理者", 4, "S", { dmgTaken: 0.6, res_all: 0.6 }],
  ["lod", "死靈", 4, "H", { cdr: 0.7, rint: 0.5 }],
  ["darkpriest", "闇神官", 4, "H", { skill: 1 }],
  ["frostqueen", "冰霜女王", 4, "H", { cdr: 0.5, roElHit_chl: 0.5 }],
  ["angeling", "天使波利", 4, "A", { lifep: 1, res_all: 1 }],
  ["ghostring", "幽靈波利", 4, "A", { graze: 0.6, lifep: 0.5 }],
  ["stormy", "冰暴騎士", 4, "G", { aspd: 0.7, roElHit_chl: 0.5, res_wind: 0.4 }],
  ["darkknight", "魔劍士", 4, "G", { evap: 0.7, aspd: 0.4 }],
  ["darklord", "闇答萊屍", 4, "B", { v5pMeteor: 0.8, move: 0.5 }],
  ["wolfking", "狼王", 4, "B", { move: 0.6, act: 0.5 }],
  ["osiris", "俄塞里斯", 4, "X", { revive: 1, regenPct: 0.7 }],
  ["ifrit", "伊夫利特", 4, "X", { brn: 0.6, rstr: 0.5, roElHit_brn: 0.5 }],
  ["deviling", "迪文", 4, "X", { rdex: 0.6, aspd: 0.5 }],
  // ---- 傳說（12）
  ["gifrit", "守護者・伊夫利特", 5, "W", { dmgp: 0.8, roElHit_brn: 0.6 }],
  ["baphomet", "巴風特", 5, "W", { area: 0.7, dmgp: 0.7 }],
  ["guardian", "迷宮守護者", 5, "S", { dmgTaken: 0.6, armorp: 0.6, res_all: 0.5 }],
  ["orchero", "獸人英雄", 5, "H", { rvit: 0.6, lifep: 0.5, dmgTaken: 0.4 }],
  ["pharaoh", "法老王", 5, "H", { cdr: 1 }],
  ["eddga", "虎王", 5, "A", { lifep: 0.8, graze: 0.6 }],
  ["maya", "蟻后瑪亞", 5, "A", { dmgTaken: 0.6, lifep: 0.6 }],
  ["gstormy", "守護者・冰暴騎士", 5, "G", { evap: 0.6, aspd: 0.6, roElHit_chl: 0.4 }],
  ["mistress", "蜂后", 5, "G", { evap: 0.6, cdr: 0.5 }],
  ["moonlight", "月夜貓", 5, "B", { move: 0.8, act: 0.7 }],
  ["mdarklord", "魔王・闇答萊屍", 5, "X", { skill: 0.9, cdr: 0.4 }],
  ["dracula", "德古拉伯爵", 5, "X", { leech: 0.9, lokp: 0.8 }],
  // v5.6 新地圖頭目卡片（只由該地圖頭目掉落，含深淵）
  ["lordofdeath", "死靈之王", 5, "H", { skill: 0.7, res_shadow: 0.6 }],
  ["vesper", "維斯伯", 5, "S", { dmgTaken: 0.6, rint: 0.6 }],
  ["detale", "迪塔勒泰晗勒斯", 5, "G", { lifep: 0.6, res_all: 0.6 }],
  ["seyren", "賽依連・溫德", 5, "W", { critm: 0.7, rstr: 0.6 }],
  // ---- 神話（8）
  ["fungal", "菌冠波利母體", 6, "W", { psn: 0.7 }, { dmg: 10 }],
  ["beelzebub", "別西卜", 6, "W", { critm: 0.6, crit: 0.4 }, { dmg: 8 }],
  ["odin", "奧丁", 6, "S", { dmgTaken: 0.8 }, { life: 7 }],
  ["valkyrie", "瓦爾基麗", 6, "H", { cdr: 0.6 }, { dmg: 7 }],
  ["stag", "古林鹿靈", 6, "A", { dmgTaken: 0.4 }, { life: 10 }],
  ["pirateking", "海盜之王", 6, "G", { evap: 0.8, crit: 0.4 }, { dmg: 4 }],
  ["archangel", "大天使波利", 6, "B", { move: 0.6, act: 0.6 }, { dmg: 4 }],
  ["scarab", "熔殼機械甲蟲", 6, "X", { skill: 1, crit: 0.4 }, { dmg: 5 }],
];
const V5_FRAC_K = new Set(Object.keys(V5_FRAC));
const V5_CARDS = V5_CARD_DEF.map(([id, n, t, p, w, mo]) => {
  const m = {};
  for (const [k, wt] of Object.entries(w)) {
    const v = V5_ANC[k] * wt * V5_TM[t] * V5_CARD_X;
    m[k] = V5_FRAC_K.has(k) ? +v.toFixed(V5_ANC[k] >= 0.1 ? 2 : 3) : k === "crit" ? Math.max(0.5, Math.round(v * 2) / 2) : Math.round(v) || Math.sign(v);
  }
  return { id, n: n + "卡片", t, p, m, ...(mo ? { mo: Object.fromEntries(Object.entries(mo).map(([k, v]) => [k, v * V5_CARD_X])) } : {}) };
});
const V5_CARD = Object.fromEntries(V5_CARDS.map((c) => [c.id, c]));
// 頭目專屬卡片：不進入一般掉落／合成的隨機池
const V56_BOSS_CARD = { 11: "lordofdeath", 12: "vesper", 13: "detale", 14: "seyren" };
for (const id of Object.values(V56_BOSS_CARD)) V5_CARD[id].ex = 1;
// 掉落：依內容強度決定階級（[階級, 權重]），卡片在該階級中隨機
const V5_DROP = { mob: 1 / 1000, elite: 6, boss: 0.01, guard: 0.015, final: 0.015, monarch: 0.025, god: 0.015, tower: 0.01, arena: 0.01, arenaUp: 0.0025, arenaMax: 0.05 };
const V5_TIER_SRC = {
  1: "一般怪物",
  2: "一般怪物（中後期地圖較多）、菁英",
  3: "菁英、地圖頭目",
  4: "地圖頭目、守護者、巴風特、無盡之塔與武鬥場頭目關",
  5: "守護者、巴風特、無盡之塔、武鬥場、魔王、活動神；死靈之王等 4 張只由 Lv78 以後的 4 張新地圖頭目掉落",
  6: "魔王闇答萊屍、活動神化身、武鬥場 30 層以上頭目關；或傳說卡片合成",
};
function v5DropTiers(kind, f = 0) {
  const m = ssMap() ? 99 : S.map;
  switch (kind) {
    case "mob":
      return m >= 11 ? [[1, 25], [2, 75]] : m >= 8 ? [[1, 40], [2, 60]] : m >= 4 ? [[1, 60], [2, 40]] : [[1, 90], [2, 10]];
    case "elite":
      return m >= 11 ? [[2, 40], [3, 60]] : m >= 8 ? [[2, 50], [3, 50]] : m >= 4 ? [[1, 20], [2, 50], [3, 30]] : [[1, 45], [2, 45], [3, 10]];
    case "boss":
      return m >= 11 ? [[4, 60], [5, 40]] : m >= 8 ? [[3, 30], [4, 70]] : m >= 4 ? [[3, 50], [4, 50]] : [[3, 75], [4, 25]];
    case "guard":
      return [[4, 60], [5, 40]];
    case "final":
      return [[4, 30], [5, 70]];
    case "monarch":
    case "god":
      return [[5, 60], [6, 40]];
    case "tower":
      return [[4, 50], [5, 50]];
    case "arena":
      return f >= 30 ? [[5, 60], [6, 40]] : [[4, 60], [5, 40]];
  }
  return [[1, 1]];
}
function v5RollCard(kind, f) {
  const t = v5Rng(v5DropTiers(kind, f)),
    pool = V5_CARDS.filter((c) => c.t === t && !c.ex);
  return pool[Math.floor(RAND() * pool.length)].id;
}
const v5CardLines = (c) => [
  ...Object.entries(c.mo || {}).map(([k, v]) => v5MoreLine(k, v)),
  ...Object.entries(c.m || {}).map(([k, v]) => v5Line(k, v)),
];
const v5CardText = (c) => v5CardLines(c).join("、");
const v5CardOk = (c, slot) => c.p === V5_SLOT_PART[slot];
function v5CardSrc(c) {
  return "掉落：" + V5_TIER_SRC[c.t];
}

// ---------------------------------------------------------------------------
// 狀態
function v5St() {
  if (!S) return { cards: {}, seen: {} };
  S.v5 ||= { cards: {}, seen: {} };
  S.v5.cards ||= {};
  S.v5.seen ||= {};
  return S.v5;
}
const v5SeenN = () => (S && S.v5 ? Object.keys(S.v5.seen).filter((k) => V5_CARD[k]).length : 0);
function v5GainCard(id, n = 1) {
  const st = v5St(),
    first = !st.seen[id];
  st.cards[id] = (st.cards[id] || 0) + n;
  st.seen[id] = 1;
  if (first) recalc();
  markDirty();
  return first;
}
const v5Rng = (rs) => pickW(rs.map((r) => r[0]), (v) => rs.find((r) => r[0] === v)[1]);
const v5IsWeapon = (it) => it && it.slot === "weapon";
function v5Tpl(slot, L) {
  const list = V5_BASES[slot];
  if (!list) return null;
  const ok = list.map((t, i) => [t, i]).filter(([t]) => t[2] <= Math.max(1, L));
  const near = ok.filter(([t]) => t[2] >= L - 40);
  const pool = near.length ? near : ok.slice(-1);
  return pickW(pool, ([t]) => 1 + t[2] / 10);
}
function v5Range(it) {
  if (it.my) return V5_Q_MY;
  if (it.uq) return V5_Q_UQ;
  return V5_Q[Math.max(0, Math.min(4, it.rar))];
}
function v5WeaponDef(it) {
  const key = it.roWb || S?.tal?.asc,
    d = V5_WEX[key] || V5_WEX[S?.cls] || V5_WEX.sword;
  return d;
}
// 把（新掉落或舊存檔的）裝備轉成 v5 裝備
function v5Convert(it, opt = {}) {
  if (!it || it.sl || it.v5) return it;
  const L = it.ilvl || 1;
  if (it.sock) {
    delete it.sock;
    if (it.rar < 2) it.rar = 2;
    if (it.name && it.name.startsWith("空白・")) delete it.name;
  }
  if (it.rar < 0) it.rar = 0;
  it.af = [];
  const [lo, hi] = v5Range(it),
    roll = () => rf(lo, hi),
    qs = [];
  let ex;
  if (it.slot === "weapon") {
    const [h2, wex] = v5WeaponDef(it);
    ex = wex;
    it.h2 = h2 ? 1 : 0;
    const w = WEAPON[S?.cls] || WEAPON.sword,
      s = w.a + w.k * L,
      q = roll(),
      m = V5_WK(L) * (h2 ? V5_H2 : 1) * q;
    qs.push(q);
    it.wd ||= [1, 2, w.aps, w.c];
    if (!it.v5aps) (it.wd[2] = +(it.wd[2] * V5_WAPS).toFixed(2)), (it.v5aps = 1);
    it.wd[0] = Math.max(1, Math.round(0.75 * s * m));
    it.wd[1] = Math.max(2, Math.round(1.25 * s * m));
    delete it.dt;
  } else {
    const tpl = opt.tpl ?? v5Tpl(it.slot, L);
    if (!tpl) return it;
    const [t, ti] = tpl;
    it.v5t = ti;
    it.v5i = t[1];
    if (!it.uq) it.base = t[0];
    ex = t[5];
    delete it.arm;
    delete it.eva;
    delete it.dt;
    if (t[3]) {
      const q = roll(),
        b = (it.slot === "chest" ? 8 + 5 * L : 4 + 2.5 * L) * t[3] * q;
      qs.push(q);
      it.dt = t[4];
      if (t[4] === "e") it.eva = Math.max(1, Math.round(V5_EVA * b));
      else it.arm = Math.max(1, Math.round(b));
      it.hp = v5BaseHp(it.slot, L, q);
    }
  }
  it.bx = Object.entries(ex || {}).map(([k, w]) => {
    const q = roll();
    qs.push(q);
    const v = V5_REF[k] * w * V5_XW * (V5_FLAT.has(k) ? 1 : v5Lv(L)) * q;
    return { k, v: k === "crit" ? Math.max(0.1, +v.toFixed(1)) : Math.max(1, Math.round(v)) };
  });
  it.q = Math.round((100 * qs.reduce((a, b) => a + b, 0)) / Math.max(1, qs.length));
  const W = it.slot === "weapon";
  it.cs = v5RollSlots(v5SlotCap(it));
  it.cards = Array(it.cs).fill(null);
  it.ref ||= 0;
  it.v5 = 1;
  v5Name(it);
  return it;
}
function v5Name(it) {
  if (!it || !it.v5) return;
  const base = it.uq ? UNIQUE[it.uq]?.n || it.base : it.base;
  it.name = (it.ref ? `+${it.ref} ` : "") + base + (it.cs ? ` [${it.cs}]` : "");
}
const v5AllGear = () => [...SLOTS.map((s) => S.equip[s]).filter(Boolean), ...S.bag].filter((t) => t && t.v5);

// ---------------------------------------------------------------------------
// 掉落
function v5MobEl(m) {
  if (!m) return "neutral";
  if (m.boss && G.guard == null && !G.tw && m.god == null && !ssMap()) return V5_BOSS_EL[S.map] || V5_MOB_EL[m.type] || "neutral";
  return V5_MOB_EL[m.type] || "neutral";
}
function v5Drop(m, id) {
  const c = V5_CARD[id];
  if (!c) return;
  dropLoot(m, { cd: id, col: V5_TIER[c.t].c, tier: Math.min(4, c.t) });
}
function v5OnKill(m) {
  if (!m || m.dm || m.add || G.trn || !S) return;
  const mul = V5.dropMul;
  if (m.boss) {
    if (G.tw || G.trial != null) return;
    let kind = null;
    if (G.guard != null) kind = G.guard < 3 ? "guard" : G.guard === 3 ? "final" : "monarch";
    else if (m.god != null) kind = "god";
    else if (!ssMap()) kind = "boss";
    if (kind === "boss" && V56_BOSS_CARD[S.map] && RAND() < 0.03 * mul) v5Drop(m, V56_BOSS_CARD[S.map]);
    if (kind && RAND() < V5_DROP[kind] * mul) v5Drop(m, v5RollCard(kind));
    return;
  }
  if (RAND() < V5_DROP.mob * (m.elite ? V5_DROP.elite : 1) * mul) v5Drop(m, v5RollCard(m.elite ? "elite" : "mob"));
}
function v5TowerBoss(m) {
  const f = G.tw?.f || 0;
  if (!f || f % 10) return;
  const src = m && m.x != null ? m : { x: G.pl.x, y: G.pl.y };
  if (roArenaOn()) {
    if (RAND() < Math.min(V5_DROP.arenaMax, V5_DROP.arena + V5_DROP.arenaUp * (f / 10 - 1)) * V5.dropMul) v5Drop(src, v5RollCard("arena", f));
  } else if (RAND() < V5_DROP.tower * V5.dropMul) v5Drop(src, v5RollCard("tower", f));
}

// ---------------------------------------------------------------------------
// 素材：舊材料改名為 RO 精煉素材，新增魔力礦石
function v5MatsInstall() {
  const ren = {
    x1: "神之金屬原石", x2: "神之金屬", x3: "濃縮神之金屬", x4: "高純度神之金屬",
    i1: "鋁原石", i2: "鋁", i3: "濃縮鋁", i4: "高純度鋁",
    p1: "鐵匠的祝福", p2: "神工匠的祝福",
  };
  for (const [k, n] of Object.entries(ren)) if (MATS[k]) MATS[k].n = n;
  Object.assign(MATS, {
    y1: { n: "黃色魔力礦石", f: "y", l: 2 },
    b1: { n: "藍色魔力礦石", f: "b", l: 2 },
    e1: { n: "紅色魔力礦石", f: "e", l: 2 },
  });
  Object.assign(MAT_COL, { y: "#ffd84a", b: "#5aa8ff", e: "#ff5a6a" });
  if (!MERGE.some(([a]) => a === "i3")) MERGE.splice(5, 0, ["i3", "i4"]);
  for (const k of Object.keys(CRAFT)) delete CRAFT[k];
  Object.assign(CRAFT, {
    x: { n: "神之金屬原石", max: 1, c: (L) => 12 + Math.round(L / 2) },
    i: { n: "鋁原石", max: 1, c: (L) => 12 + Math.round(L / 2) },
    e: { n: "紅色魔力礦石", max: 1, c: () => 200 },
    b: { n: "藍色魔力礦石", max: 1, c: () => 300 },
    y: { n: "黃色魔力礦石", max: 1, c: () => 400 },
  });
  const icon = { x: 984, i: 985, p: 994, s: 714, r: 756, c: 757, m: 7220, h: 995, y: 715, b: 717, e: 716 };
  matIcon = function (k) {
    const f = MATS[k]?.f || k;
    if (k === "x1") return roItemIcon(756);
    if (k === "i1") return roItemIcon(757);
    return roItemIcon(icon[f] || 984);
  };
  if (typeof roDropItemId === "function") {
    const di = roDropItemId;
    roDropItemId = function (d) {
      if (d.cd) return 4001;
      if (d.mat) return d.mat === "x1" ? 756 : d.mat === "i1" ? 757 : icon[MATS[d.mat]?.f] || 984;
      return di(d);
    };
  }
  const rm = rollMats;
  rollMats = function (L, boss, elite) {
    const out = rm(L, boss, elite);
    if (!S.alchOn) return out;
    if (RAND() < (boss ? 0.6 : elite ? 0.05 : 0.004)) out.push("e1");
    if (RAND() < (boss ? 0.4 : elite ? 0.03 : 0.0025)) out.push("b1");
    if (RAND() < (boss ? 0.3 : elite ? 0.02 : 0.0015)) out.push("y1");
    return out;
  };
}
// 分解產出：武器 → 神之金屬系、防具 → 鋁系
function v5SalvMats(it) {
  if (!it || !it.v5) return {};
  const fam = it.slot === "weapon" ? "x" : "i",
    out = {},
    add = (k, n) => n > 0 && (out[k] = (out[k] || 0) + n);
  const n = [1, 1, 2, 3][Math.max(0, Math.min(3, it.rar))] + (it.uq ? 1 : 0);
  for (let i = 0; i < n; i++) add(fam + (it.ilvl >= 60 && RAND() < 0.25 ? 2 : 1), 1);
  if (it.ref >= 5) add(fam + "2", it.ref - 4);
  return out;
}
let v5SalvAcc = null;
function v5SalvGive(it, quiet) {
  if (!it || !it.v5) return;
  const got = v5SalvMats(it);
  for (const [k, n] of Object.entries(got)) S.mat[k] = (S.mat[k] || 0) + n;
  const back = (it.cards || []).filter(Boolean);
  for (const id of back) v5GainCard(id);
  if (quiet) return;
  if (!v5SalvAcc) {
    v5SalvAcc = { m: {}, c: 0 };
    later(0.05, () => {
      const a = v5SalvAcc;
      v5SalvAcc = null;
      const parts = Object.entries(a.m).map(([k, n]) => `${MATS[k].n}×${n}`);
      if (a.c) parts.push(`取回卡片 ${a.c} 張`);
      parts.length && toast("分解獲得：" + parts.join("、"));
    });
  }
  for (const [k, n] of Object.entries(got)) v5SalvAcc.m[k] = (v5SalvAcc.m[k] || 0) + n;
  v5SalvAcc.c += back.length;
}

// ---------------------------------------------------------------------------
// 精煉、鑲嵌、拆卸、合成
function v5Find(u) {
  return v5AllGear().find((t) => t.u === +u) || null;
}
function v5Refine(u) {
  const it = v5Find(u);
  if (!it || (it.ref || 0) >= 10) return;
  const lv = (it.ref || 0) + 1,
    mat = v5RefMat(it, lv),
    z = v5RefZeny(it, lv);
  if (!(S.mat[mat] > 0) || S.ash < z) return void toast("素材或 Zeny 不足", "bad");
  const prot = ui.v5prot && lv >= 5 ? (lv <= 7 && S.mat.p1 > 0 ? "p1" : S.mat.p2 > 0 ? "p2" : null) : null;
  S.mat[mat]--;
  S.ash -= z;
  if (prot) S.mat[prot]--;
  const ok = RAND() * 100 < V5_REF_OK[lv];
  if (ok) it.ref = lv;
  else if (!prot && lv > 5) it.ref = lv - 2;
  ui.v5res = {
    t: performance.now(),
    ok,
    txt: ok ? `精煉成功！${it.base} +${lv}` : prot ? `精煉失敗（${MATS[prot].n}保護，精煉值不變）` : lv > 5 ? `精煉失敗，精煉值降為 +${it.ref}` : "精煉失敗",
  };
  v5Name(it);
  sfx(ok ? "alch" : "alchF", ok ? Math.min(3, Math.ceil(lv / 3)) : 1);
  recalc();
  markDirty();
  ui.refreshIf("alch", "bag", "char");
}
function v5Insert(u, i, id) {
  const it = v5Find(u),
    c = V5_CARD[id],
    st = v5St();
  if (!it || !c || !it.cards || it.cards[i] || !v5CardOk(c, it.slot) || !(st.cards[id] > 0)) return;
  const z = v5InsZeny(c.t);
  if (!(S.mat.e1 > 0) || S.ash < z) return void toast("需要紅色魔力礦石與 Zeny", "bad");
  const prot = ui.v5prot ? (c.t <= 3 && S.mat.p1 > 0 ? "p1" : S.mat.p2 > 0 ? "p2" : null) : null;
  S.mat.e1--;
  S.ash -= z;
  if (prot) S.mat[prot]--;
  const ok = RAND() * 100 < V5_INS_OK[c.t];
  let lost = false;
  st.cards[id]--;
  if (ok) it.cards[i] = id;
  else if (prot || RAND() < 0.5) st.cards[id]++;
  else lost = true;
  if (!st.cards[id]) delete st.cards[id];
  ui.v5res = {
    t: performance.now(),
    ok,
    txt: ok ? `鑲嵌成功：${c.n}` : lost ? `鑲嵌失敗，${c.n}損毀了` : `鑲嵌失敗，${c.n}${prot ? `受${MATS[prot].n}保護` : ""}已退回`,
  };
  ui.v5pick = null;
  sfx(ok ? "alch" : "alchF", ok ? Math.min(3, c.t) : 1);
  recalc();
  markDirty();
  ui.refreshIf("alch", "bag", "char");
}
function v5Remove(u, i) {
  const it = v5Find(u),
    id = it?.cards?.[i],
    c = V5_CARD[id];
  if (!c) return;
  const z = v5RemZeny(c.t);
  if ((S.mat.y1 || 0) < c.t || S.ash < z) return void toast(`需要黃色魔力礦石 ×${c.t} 與 Zeny ${z}`, "bad");
  S.mat.y1 -= c.t;
  S.ash -= z;
  it.cards[i] = null;
  v5GainCard(id);
  ui.v5res = { t: performance.now(), ok: true, txt: `已拆下：${c.n}` };
  sfx("alch", 1);
  recalc();
  markDirty();
  ui.refreshIf("alch", "bag", "char");
}
function v5Fuse(ids) {
  const st = v5St();
  if (!ids || ids.length !== 3) return;
  const t = V5_CARD[ids[0]]?.t;
  if (!t || t >= 6 || ids.some((id) => V5_CARD[id]?.t !== t)) return;
  const need = {};
  for (const id of ids) need[id] = (need[id] || 0) + 1;
  if (Object.entries(need).some(([id, n]) => (st.cards[id] || 0) < n)) return;
  const z = v5FuseZeny(t);
  if ((S.mat.b1 || 0) < t || S.ash < z) return void toast(`需要藍色魔力礦石 ×${t} 與 Zeny ${z}`, "bad");
  S.mat.b1 -= t;
  S.ash -= z;
  for (const [id, n] of Object.entries(need)) (st.cards[id] -= n) || delete st.cards[id];
  const pool = V5_CARDS.filter((c) => c.t === t + 1 && !c.ex);
  const got = pool[Math.floor(RAND() * pool.length)];
  const first = v5GainCard(got.id);
  ui.v5res = { t: performance.now(), ok: true, txt: `合成獲得：${got.n}${first ? "（新蒐藏！）" : ""}` };
  ui.v5fp = [];
  sfx("alch", Math.min(3, t + 1));
  markDirty();
  ui.refreshIf("alch");
}

// ---------------------------------------------------------------------------
// 安裝
const V5 = { dropMul: 1 };
function roV5Install() {
  // 8 個部位
  if (!SLOTS.includes("shield")) SLOTS.splice(1, 0, "shield");
  Object.assign(SLOT_NAME, { weapon: "武器", shield: "盾牌", helm: "頭飾", chest: "鎧甲", gloves: "披肩", boots: "鞋子", ring: "飾品・左", amulet: "飾品・右" });
  for (const s of SLOTS)
    if (AFFIX["rs_" + s]) {
      AFFIX["rs_" + s].n = "偏向・" + SLOT_NAME[s];
      AFFIX["rs_" + s].f = (a) => `${SLOT_NAME[s]}掉落機率 +${a}%`;
    }
  if (!AFFIX.rs_shield) AFFIX.rs_shield = { ...AFFIX.rs_helm, n: "偏向・盾牌", f: (a) => `盾牌掉落機率 +${a}%` };
  BASES.shield = V5_BASES.shield.map((t) => t[0]).concat("聖盾").slice(0, 8);
  for (const [slot, list] of Object.entries(V5_BASES))
    for (const t of list) {
      roItemFiles["v5_" + t[1]] = t[1];
      ICONS["v5_" + t[1]] ||= ICONS[ICON_SET.helm[0]];
    }
  ICON_SET.shield = ["v5_2101", "v5_2104", "v5_2107", "v5_2110"];
  for (const s of ["helm", "chest", "gloves", "boots", "ring", "amulet"]) ICON_SET[s] = V5_BASES[s].slice(0, 8).map((t) => "v5_" + t[1]);
  roItemFiles.mnC = 4001;
  // 選單「卡牌」→「蒐藏」
  const mc = MENU.find((m) => m[0] === "cards");
  if (mc) mc[1] = "卡片圖鑑";
  if (!MENU.some((m) => m[0] === "mapcol")) MENU.splice(MENU.indexOf(mc) + 1, 0, ["mapcol", "地圖蒐藏", "mnM"]);
  roItemFiles.mnM = 601;
  v5MatsInstall();
  // 舊手套部位改為披肩：獨特裝備名稱配合
  for (const [k, n] of [["ro44_viper", "蛇毒披風"], ["ro44_chi", "氣功披肩"], ["ro44_prism", "萬象斗篷"]]) if (UNIQUE[k]) UNIQUE[k].n = n;

  // 新物品
  const mk = makeItem;
  makeItem = function (lv, a = {}) {
    const it = mk(lv, a);
    return it && !it.sl ? v5Convert(it) : it;
  };
  // 掉落後的石板／活動詞綴（詞綴提升、共鳴、神眷）不再套用到裝備；活動掉落改為插槽 +1
  const ri0 = rollItem;
  rollItem = function (lv, a) {
    const out = ri0(lv, a);
    for (const it of out)
      if (it && it.v5) {
        it.af = [];
        if (!it.v5ss && (a && a.ss !== undefined ? a.ss : ssMap() && !G.tw && !G.arena)) {
          it.v5ss = 1;
          if (it.cs < v5SlotCap(it)) (it.cs++, it.cards.push(null), v5Name(it));
        }
      }
    return out;
  };
  const ik = iconKey;
  iconKey = function (t) {
    if (t && t.v5 && t.v5i && !t.uq && t.slot !== "weapon") return "v5_" + t.v5i;
    if (t && t.v5 && t.uq && t.slot === "shield") return "v5_2107";
    return ik(t);
  };
  const wl = weaponLocal;
  weaponLocal = function (t) {
    const r = wl(t);
    if (t && t.ref) {
      const m = v5RefMul(t);
      r.mn = Math.round(r.mn * m);
      r.mx = Math.round(r.mx * m);
    }
    return r;
  };
  const bq = baseQ;
  baseQ = function (t) {
    return t && t.v5 && t.q ? clamp((t.q - 50) / 100, 0, 1) : bq(t);
  };
  // 屬性：基底、額外素質、精煉、卡片、蒐藏
  const cm = collectMods;
  collectMods = function () {
    const out = cm();
    if (!S) return out;
    const w = S.equip.weapon,
      h2 = w && w.h2 && canWear(w);
    for (const sl of SLOTS) {
      const it = S.equip[sl];
      if (!it || !canWear(it) || it.sl) continue;
      if (sl === "shield" && h2) {
        for (let i = out.length - 1; i >= 0; i--) if (out[i].src === "shield") out.splice(i, 1);
        continue;
      }
      if (!it.v5) continue;
      const rm = v5RefMul(it) - 1;
      if (rm > 0 && sl !== "weapon") {
        if (it.arm) out.push({ s: "armor", v: it.arm * rm, src: sl });
        if (it.eva) out.push({ s: "eva", v: it.eva * rm, src: sl });
      }
      if (it.hp) out.push({ s: "life", v: it.hp * (1 + rm), src: sl });
      const xm = v5RefX(it);
      for (const b of it.bx || []) out.push({ s: b.k, v: b.v * xm, src: sl });
      for (const id of it.cards || []) {
        const c = V5_CARD[id];
        if (!c) continue;
        for (const [k, v] of Object.entries(c.m || {})) out.push({ s: k, v, src: "card:" + id });
        for (const [k, v] of Object.entries(c.mo || {})) out.push({ s: k, v, src: "card:" + id, x: "more" });
      }
    }
    const n = v5SeenN();
    if (n) out.push({ s: "dmgp", v: n * V5_COL.d, src: "col" }, { s: "lifep", v: n * V5_COL.l, src: "col" });
    return out;
  };
  // 屬性抗性
  HURT_MUL.push({
    k: "v5:res",
    f: (m) => {
      if (!m || !m.type) return 1;
      const r = clamp(tal("res_" + v5MobEl(m)) + tal("res_all"), -100, 75);
      return 1 - r / 100;
    },
  });
  // 卡片觸發效果
  const aoe = (m, r, dmg, col, key, fx) => {
    const R = r * PS.area;
    roPushFx(G.fx, { k: "boom", x: m.x, y: m.y - 3, r: 0.6 * R, t: 0, life: 0.3, ...fx });
    sfx("big");
    for (const e of mobsNear(m.x, m.y - 3, R)) dealMob(e, dmg, !1, col, key);
  };
  // 觸發效果有 0.3 秒內部冷卻，避免範圍技能一次觸發太多
  const icd = (k) => {
    G.v5cd ||= {};
    if ((G.v5cd[k] || 0) > G.t) return false;
    G.v5cd[k] = G.t + 0.3;
    return true;
  };
  TAL_ON.v5pBlast = {
    hit: (m, dmg, crit, s) => {
      if (s && s.v5) return;
      if (alive(m) && RAND() < tal("v5pBlast") && icd("blast")) aoe(m, 26, dmg * 1.5, "#ff8a3a", "card:turtle");
    },
  };
  TAL_ON.v5pMeteor = {
    hit: (m, dmg, crit, s) => {
      if (s && s.v5) return;
      if (alive(m) && RAND() < tal("v5pMeteor") && icd("meteor")) {
        const x = m.x,
          y = m.y;
        later(0.35, () => aoe({ x, y }, 22, dmg * 2.5, "#ff5a3a", "card:darklord", { c: "#ff5a3a" }));
      }
    },
  };
  TAL_ON.v5pBolt = {
    hit: (m, dmg, crit, s) => {
      if (s && s.v5) return;
      if (alive(m) && RAND() < tal("v5pBolt") && icd("bolt")) dealMob(m, dmg * 2, !1, "#ffe25a", "card:bolt");
    },
  };
  // 卡片掉落
  const fr = fire;
  fire = function (ev, a, b, c, d) {
    if (ev === "kill") v5OnKill(a);
    return fr(ev, a, b, c, d);
  };
  const tc = twClear;
  twClear = function (m) {
    const f = G.tw?.f;
    const r = tc(m);
    if (f && G.tw) v5TowerBoss(m);
    return r;
  };
  const pk = pickup;
  pickup = function (d) {
    if (d && d.cd) {
      const c = V5_CARD[d.cd];
      if (!c) return;
      const first = v5GainCard(d.cd);
      lootToast(`獲得卡片：${c.n}${first ? "（新蒐藏！）" : ""}`, c.t >= 5 ? "rm" : c.t >= 4 ? "r4" : c.t >= 3 ? "r3" : "rs", 1);
      first && c.t >= 3 && sfx("lvl");
      ui.menuDot("cards", 1);
      ui.refreshIf("alch");
      return;
    }
    return pk(d);
  };
  // 分解得到素材並取回卡片
  const sv = salvage;
  salvage = function (u) {
    const it = S.bag.find((a) => a.u === +u);
    const r = sv(u);
    if (r >= 0 && it) v5SalvGive(it);
    return r;
  };
  const ti = takeItem;
  takeItem = function (t) {
    const r = ti(t);
    if (r === "salv" || r === "full") v5SalvGive(t, 1);
    return r;
  };
  // 雙手武器與盾牌、兩個飾品欄互通
  const eq = equipItem;
  equipItem = function (u) {
    const it = S.bag.find((a) => a.u === +u);
    if (it && canWear(it)) {
      if (it.slot === "shield" && S.equip.weapon?.h2) return void toast("裝備雙手武器時無法使用盾牌", "bad");
      const o = { ring: "amulet", amulet: "ring" }[it.slot];
      if (o && S.equip[it.slot] && !S.equip[o]) it.slot = o;
    }
    eq(u);
    if (it && it.slot === "weapon" && it.h2 && S.equip.weapon === it && S.equip.shield) {
      if (S.bag.length < BAG_MAX) {
        S.bag.push(S.equip.shield);
        delete S.equip.shield;
        toast("雙手武器：已卸下盾牌");
      } else toast("雙手武器無法搭配盾牌（背包已滿，盾牌效果不生效）", "bad");
      recalc();
    }
  };
  // 新角色、舊存檔遷移
  const ns = newState;
  newState = function (...a) {
    const st = ns(...a);
    st.v5m = 1;
    st.v5g = 1;
    st.v5n = 1;
    st.v5s = 1;
    st.v5 = { cards: {}, seen: {} };
    return st;
  };
  const ens = roEnsureStats;
  roEnsureStats = function () {
    if (S && S.v5m !== 1) v5Migrate();
    if (S && S.v5g !== 1) v5MigrateGems();
    if (S && S.v5s !== 1) v5MigrateSlots();
    if (S && S.v5n !== 1) {
      S.v5n = 1;
      for (const s of SLOTS) S.equip[s]?.v5 && v5Name(S.equip[s]);
      for (const t of S.bag || []) t.v5 && v5Name(t);
    }
    return ens();
  };
  v5SkillsRuntime();
  V5.ascLog = v5AscRework();
  v5HexInstall();
  v5TraitInstall();
  v5PriestInstall();
  v5UiInstall();
  v5SkillHelp();
  v5HelpAll();
  v5WrapInstall();
  v54Install();
  v55MapsInstall();
  v55BossInstall();
  v56Install();
  const rg = ui.m_roguide;
  if (rg)
    ui.m_roguide = function () {
      return rg.call(this).replace(
        "<h3>六職業 × 四流派</h3>",
        `<h3>裝備與卡片</h3><div class="box stack"><p>裝備分 8 個部位：武器、盾牌、頭飾、鎧甲、披肩、鞋子、飾品 ×2；雙手武器無法搭配盾牌。裝備沒有詞綴，改為基底素質＋固定額外素質（掉落時浮動 50%～150%）。</p><p>卡片插槽依稀有度：${V5_SLOT_TXT}。${V5_CARDS.length} 種怪物卡片分 6 階，在「煉金」鑲嵌、合成；精煉 +1～+10 強化基底。</p><p>選單「蒐藏」可查看卡片圖鑑、怪物屬性與地圖加成。</p></div><h3>技能</h3><div class="box stack"><p>每職業有專屬的輔助寶石與 2 種被動寶石；其他職業的輔助只能靠怪物掉落（穿梭寶石，無法變異）。技能標示 RO 屬性，聖屬性對不死怪物傷害 ×${V5_HOLY_UNDEAD}。</p></div><h3>六職業 × 四流派</h3>`,
      );
    };
}
function v5Migrate() {
  S.v5m = 1;
  v5St();
  let n = 0;
  const conv = (it) => {
    if (it && !it.sl && !it.v5 && it.slot && SLOTS.includes(it.slot)) {
      v5Convert(it);
      n++;
    }
  };
  for (const s of SLOTS) conv(S.equip[s]);
  (S.bag || []).forEach(conv);
  try {
    const st = STH || stLoad();
    let k = 0;
    for (const x of st.it) if (x.o && !x.o.v5 && !x.o.sl && x.o.slot) (conv(x.o), k++);
    if (k) stWrite(st);
  } catch (e) {}
  if (n) later(1.2, () => toast(`裝備系統改版：${n} 件裝備已轉為 RO 插卡裝備（詞綴移除，改為基底素質＋卡片插槽）`, "lvl", 1));
}

// v5.3 插槽下修：既有裝備削減到新上限，被移除插槽上的卡片退回蒐藏
function v5MigrateSlots() {
  S.v5s = 1;
  const st = v5St();
  let items = 0,
    back = 0;
  const trim = (it) => {
    if (!it || !it.v5 || !Array.isArray(it.cards)) return false;
    const cap = v5SlotCap(it);
    if (it.cards.length <= cap && (it.cs || 0) <= cap) return false;
    const full = it.cards.filter(Boolean),
      keep = full.slice(0, cap);
    for (const id of full.slice(cap)) (st.cards[id] = (st.cards[id] || 0) + 1), back++;
    it.cards = keep.concat(Array(cap - keep.length).fill(null));
    it.cs = cap;
    v5Name(it);
    items++;
    return true;
  };
  for (const s of SLOTS) trim(S.equip[s]);
  (S.bag || []).forEach(trim);
  try {
    const sh = STH || stLoad();
    let k = 0;
    for (const x of sh.it || []) if (x.o && trim(x.o)) k++;
    if (k) stWrite(sh);
  } catch (e) {}
  if (items) later(1.4, () => toast(`插槽改版：${items} 件裝備的插槽削減到新上限${back ? `，${back} 張卡片已退回蒐藏` : ""}`, "lvl", 1));
}

// ---------------------------------------------------------------------------
// 介面
const V5_MAT_ROWS = [
  ["武器精煉", ["x1", "x2", "x3", "x4"]],
  ["防具精煉", ["i1", "i2", "i3", "i4"]],
  ["祝福", ["p1", "p2"]],
  ["魔力礦石", ["e1", "b1", "y1"]],
];
const v5MatBoard = () =>
  `<div class="board mboard">${[
    ...V5_MAT_ROWS,
  ]
    .filter(Boolean)
    .map(([t, a]) => `<div class="mrow"><span>${t}</span>${a.map(matCell).join("")}</div>`)
    .join("")}</div>`;
const v5Have = (k, n = 1) => (S.mat[k] || 0) >= n;
const v5MatTag = (k, n = 1) =>
  `<span class="v5mt${v5Have(k, n) ? "" : " no"}"><img src="${matIcon(k)}" alt="">${MATS[k].n} <span class="px">${S.mat[k] || 0}/${n}</span></span>`;
const v5ZenyTag = (z) => `<span class="v5mt${S.ash >= z ? "" : " no"}"><img src="${shopIcon("ash")}" alt="">Zeny <span class="px">${fmt(z)}</span></span>`;
const v5TierTag = (t) => `<span class="v5tier" style="--tc:${V5_TIER[t].c}">${V5_TIER[t].n}</span>`;
const v5CardName = (c) => `<b class="v5cn" style="color:${V5_TIER[c.t].c}">${esc(c.n)}</b>`;
function v5ResHtml() {
  const r = ui.v5res;
  if (!r || performance.now() - r.t > 9000) return "";
  return `<p class="v5res ${r.ok ? "ok" : "fail"}">${esc(r.txt)}</p>`;
}
function v5GearRow(it, cur, sub) {
  const worn = S.equip[it.slot] === it;
  return `<div class="li v5row${cur ? " cur" : ""}" data-v5="sel" data-u="${it.u}"><img class="v5ic" src="${itemIcon(it)}" alt="" style="--rc:${rarColor(it)}"><div class="grow"><div class="t"><span class="${rc(it)}">${esc(itemName(it))}</span>${worn ? '<span class="tag aeq">使用中</span>' : ""}</div><div class="s">${SLOT_NAME[it.slot]}・LV${it.ilvl}${sub ? "・" + sub : ""}</div></div></div>`;
}
function v5GearList(filter, sel) {
  const worn = SLOTS.map((s) => S.equip[s]).filter((t) => t && t.v5 && filter(t)),
    bag = S.bag.filter((t) => t.v5 && filter(t)).sort((a, b) => (b.ref || 0) - (a.ref || 0) || rarTier(b) - rarTier(a) || b.ilvl - a.ilvl);
  return [...worn, ...bag.slice(0, 80)];
}
function v5SlotsHtml(it) {
  if (!it.cs) return '<p class="note" style="margin:2px 0">沒有卡片插槽</p>';
  return `<div class="v5slots">${it.cards
    .map((id, i) => {
      const c = V5_CARD[id];
      return c
        ? `<div class="v5slot on" style="--tc:${V5_TIER[c.t].c}"><img src="${roItemIcon(4001)}" alt=""><div class="grow">${v5CardName(c)}<div class="s">${esc(v5CardText(c))}</div></div></div>`
        : `<div class="v5slot"><span class="v5hole"></span><span class="note" style="margin:0">空插槽（可鑲嵌${V5_PART[V5_SLOT_PART[it.slot]]}卡片）</span></div>`;
    })
    .join("")}</div>`;
}
function v5StatHtml(t) {
  let a = "";
  if (t.slot === "weapon") {
    const s = weaponLocal(t);
    a += `<div class="base def"><span class="kv">攻擊 <b${t.ref ? ' class="c1"' : ""}>${s.mn}-${s.mx}</b></span><span class="kv">攻速 <b>${s.aps}</b></span><span class="kv">暴擊 <b>${s.crit}%</b></span><span class="kv">${t.h2 ? "雙手" : "單手"}</span></div>`;
  } else if (t.arm || t.eva) {
    const m = v5RefMul(t);
    const c1 = t.ref ? ' class="c1"' : "";
    a += `<div class="base def">${t.arm ? `<span class="kv">護甲 <b${c1}>${Math.round(t.arm * m)}</b></span>` : ""}${t.eva ? `<span class="kv">閃避 <b${c1}>${Math.round(t.eva * m)}</b></span>` : ""}${t.hp ? `<span class="kv">生命 <b${c1}>+${Math.round(t.hp * m)}</b></span>` : ""}</div>`;
  }
  a += `<div class="v5meta"><span>品質 <b class="px">${t.q || 100}%</b></span><span>精煉 <b class="px">+${t.ref || 0}</b></span><span>插槽 <b class="px">${(t.cards || []).filter(Boolean).length}/${t.cs || 0}</b></span></div>`;
  const xm = v5RefX(t);
  if (t.bx && t.bx.length) a += `<div class="v5bx">${t.bx.map((b) => `<div class="v5l">${esc(v5Line(b.k, b.v * xm))}</div>`).join("")}</div>`;
  if (t.uq && UNIQUE[t.uq])
    a += `<div class="uniq${t.my ? " rm" : ""}">${esc(uqText(t.uq, t.cm || 1))}${cmTag(t)}${UNIQUE[t.uq].help ? " " + helpBtn(UNIQUE[t.uq].help) : ""}</div>`;
  for (const s of uqKeys(t)) s !== t.uq && UNIQUE[s] && (a += `<div class="uniq"><b>${esc(UNIQUE[s].n)}</b>：${esc(uqText(s, t.cm || 1))}${cmTag(t)}</div>`);
  if (t.slot === "shield" && S.equip.weapon?.h2) a += '<p class="note" style="margin:2px 0;color:var(--bad)">目前裝備雙手武器，盾牌無法使用</p>';
  return a + v5SlotsHtml(t);
}
// --- 煉金工坊
const V5_TABS = [
  ["salv", "分解"],
  ["ref", "精煉"],
  ["sock", "鑲嵌"],
  ["fuse", "卡片合成"],
  ["mat", "素材"],
];
function v5AlchHtml() {
  const tabs = [...V5_TABS]; // v6.2：移除石板分頁
  if (!tabs.some(([k]) => k === ui.v5at)) ui.v5at = "ref";
  const tab = ui.v5at;
  const head = `<div class="row" style="margin:0 0 8px;flex-wrap:nowrap"><div class="seg aseg" style="flex:1">${tabs
    .map(([k, n]) => `<button data-v5="at" data-v="${k}" aria-pressed="${tab === k}">${n}</button>`)
    .join("")}</div>${helpBtn(tab === "slate" ? AX_HELP[ui.alchMd()] : "v5" + tab)}</div>`;
  return head + v5Res() + ({ salv: v5SalvTab, ref: v5RefTab, sock: v5SockTab, fuse: v5FuseTab, mat: v5MatTab }[tab] || v5RefTab)();
}
const v5Res = () => v5ResHtml();
function v5SalvTab() {
  const ok = (t) => t.v5 && !t.lk && !keepMatch(t) && !t.my,
    rows = [0, 1, 2, 3, "uq"].map((r) => {
      const list = S.bag.filter((t) => ok(t) && (r === "uq" ? t.uq : !t.uq && t.rar === r)),
        name = r === "uq" ? "獨特" : RAR_NAME[r],
        cf = ui.v5cf === "salv" + r;
      return `<div class="li"><div class="grow"><div class="t"><span class="${r === "uq" ? "ru" : "r" + r}">${name}</span> <span class="px">${list.length}</span> 件</div><div class="s">未鎖定、不符合保留規則的裝備</div></div><button class="btn sm${cf ? " primary" : ""}" data-v5="bsalv" data-v="${r}" ${list.length ? "" : "disabled"}>${cf ? `確定分解 ${list.length} 件？` : "全部分解"}</button></div>`;
    });
  return `${v5MatBoard()}<h3>分解產出</h3><div class="box stack"><p class="note" style="margin:0">武器 → 神之金屬原石；防具與飾品 → 鋁原石。稀有度越高產出越多；Lv60 以上的裝備有 25% 機率直接得到神之金屬／鋁；精煉 +5 以上的裝備額外退還精煉素材。鑲嵌在裝備上的卡片會全部取回。</p><p class="note" style="margin:0">背包中點選裝備也可以單件分解；拾取篩選自動分解的裝備同樣會得到素材。</p></div><h3>批次分解</h3><div class="list">${rows.join("")}</div>`;
}
function v5RefTab() {
  const list = v5GearList((t) => true);
  let it = v5Find(ui.v5sel);
  if (!it || !list.includes(it)) it = list[0] || null;
  ui.v5sel = it?.u ?? null;
  let top = '<p class="empty-note">沒有可精煉的裝備。</p>';
  if (it) {
    const lv = (it.ref || 0) + 1,
      max = lv > 10;
    let body;
    if (max) body = '<p class="note">已達精煉上限 +10。</p>';
    else {
      const mat = v5RefMat(it, lv),
        z = v5RefZeny(it, lv),
        prot = lv >= 5 ? (lv <= 7 ? "p1" : "p2") : null,
        can = v5Have(mat) && S.ash >= z;
      body = `<div class="v5cost">${v5MatTag(mat)}${v5ZenyTag(z)}</div>
        <div class="row"><span>成功率 <b class="px">${V5_REF_OK[lv]}%</b></span><span class="spacer"></span><span class="note" style="margin:0">${lv <= 4 ? "安全精煉" : lv <= 5 ? "失敗時精煉值不變" : "失敗時精煉值 −1"}</span></div>
        ${prot ? `<label class="chk"><input type="checkbox" data-v5="prot" ${ui.v5prot ? "checked" : ""}><span>使用保護（${lv <= 7 ? "鐵匠的祝福或神工匠的祝福" : "神工匠的祝福"}）：失敗時精煉值不變　持有 <span class="px">${S.mat.p1 || 0}</span>／<span class="px">${S.mat.p2 || 0}</span></span></label>` : ""}
        <button class="btn primary" data-v5="refine" data-u="${it.u}" ${can ? "" : "disabled"}>精煉 +${it.ref || 0} → +${lv}</button>`;
    }
    top = `<div class="board v5sel">${ui.itemHead(it)}${v5StatHtml(it)}<h3 style="margin:8px 0 4px">精煉 +${Math.min(10, lv)}・基底 ×${V5_REF_MUL[Math.min(10, lv)]}、額外素質 +${3 * Math.min(10, lv)}%</h3>${body}</div>`;
  }
  return `${top}<h3>選擇裝備</h3><div class="list">${list.map((t) => v5GearRow(t, t === it, `+${t.ref || 0}`)).join("")}</div>`;
}
function v5SockTab() {
  const list = v5GearList((t) => t.cs > 0);
  let it = v5Find(ui.v5sel);
  if (!it || !list.includes(it)) it = list[0] || null;
  ui.v5sel = it?.u ?? null;
  const st = v5St();
  let top = '<p class="empty-note">沒有帶卡片插槽的裝備。<br>插槽數依稀有度決定，高插槽非常稀有：武器最多 7 孔（主宰），其他部位最多 4 孔（主宰）。</p>';
  if (it) {
    const slots = it.cards
      .map((id, i) => {
        const c = V5_CARD[id];
        if (c)
          return `<div class="v5slot on" style="--tc:${V5_TIER[c.t].c}"><img src="${roItemIcon(4001)}" alt=""><div class="grow">${v5CardName(c)} ${v5TierTag(c.t)}<div class="s">${esc(v5CardText(c))}</div><div class="v5cost">${v5MatTag("y1", c.t)}${v5ZenyTag(v5RemZeny(c.t))}</div></div><button class="btn sm" data-v5="rem" data-u="${it.u}" data-i="${i}" ${v5Have("y1", c.t) && S.ash >= v5RemZeny(c.t) ? "" : "disabled"}>拆卸</button></div>`;
        const open = ui.v5pick === i;
        return `<div class="v5slot${open ? " pick" : ""}"><span class="v5hole"></span><div class="grow"><span>第 ${i + 1} 孔・空</span></div><button class="btn sm${open ? " primary" : ""}" data-v5="pick" data-i="${i}">${open ? "收起" : "選擇卡片"}</button></div>`;
      })
      .join("");
    let pick = "";
    if (ui.v5pick != null && it.cards[ui.v5pick] == null) {
      const own = V5_CARDS.filter((c) => st.cards[c.id] > 0 && v5CardOk(c, it.slot)).sort((a, b) => b.t - a.t);
      pick = own.length
        ? `<div class="list v5pickl">${own
            .map(
              (c) =>
                `<div class="li"><img class="v5ic" src="${roItemIcon(4001)}" alt="" style="--rc:${V5_TIER[c.t].c}"><div class="grow"><div class="t">${v5CardName(c)} ${v5TierTag(c.t)} <span class="px">×${st.cards[c.id]}</span></div><div class="s">${esc(v5CardText(c))}</div><div class="s">成功率 <b class="px">${V5_INS_OK[c.t]}%</b>・失敗時卡片 50% 機率損毀</div></div><button class="btn sm primary" data-v5="ins" data-u="${it.u}" data-i="${ui.v5pick}" data-k="${c.id}" ${v5Have("e1") && S.ash >= v5InsZeny(c.t) ? "" : "disabled"}>鑲嵌 <span class="px">${v5InsZeny(c.t)}</span></button></div>`,
            )
            .join("")}</div>`
        : `<p class="note">沒有可鑲嵌在${V5_PART[V5_SLOT_PART[it.slot]]}的卡片。</p>`;
    }
    top = `<div class="board v5sel">${ui.itemHead(it)}<div class="v5cost">${v5MatTag("e1")}<span class="note" style="margin:0">每次鑲嵌消耗 1 顆</span></div>
      <label class="chk"><input type="checkbox" data-v5="prot" ${ui.v5prot ? "checked" : ""}><span>使用保護：失敗時卡片必定退回（稀有以下用鐵匠的祝福，史詩以上用神工匠的祝福）　持有 <span class="px">${S.mat.p1 || 0}</span>／<span class="px">${S.mat.p2 || 0}</span></span></label>
      <div class="v5slots">${slots}</div>${pick}</div>`;
  }
  return `${top}<h3>選擇裝備</h3><div class="list">${list.map((t) => v5GearRow(t, t === it, `插槽 ${t.cards.filter(Boolean).length}/${t.cs}`)).join("")}</div>`;
}
function v5FuseTab() {
  const st = v5St(),
    fp = (ui.v5fp ||= []),
    t = fp.length ? V5_CARD[fp[0]].t : 0,
    used = (id) => fp.filter((x) => x === id).length;
  const picks = [0, 1, 2]
    .map((i) => {
      const c = V5_CARD[fp[i]];
      return c
        ? `<button class="v5fp on" data-v5="funpick" data-i="${i}" style="--tc:${V5_TIER[c.t].c}"><img src="${roItemIcon(4001)}" alt=""><span>${esc(c.n)}</span></button>`
        : '<div class="v5fp"><span class="v5hole"></span><span>空</span></div>';
    })
    .join("");
  const z = t ? v5FuseZeny(t) : 0,
    can = fp.length === 3 && v5Have("b1", t) && S.ash >= z;
  const groups = [1, 2, 3, 4, 5, 6]
    .map((tier) => {
      const own = V5_CARDS.filter((c) => c.t === tier && st.cards[c.id] > 0);
      if (!own.length) return "";
      const total = own.reduce((n, c) => n + st.cards[c.id], 0);
      return `<h3 class="hrow">${v5TierTag(tier)} <span class="px">${total}</span> 張${tier < 6 && total >= 3 ? `<span class="spacer"></span><button class="btn sm" data-v5="fauto" data-v="${tier}">自動選 3 張</button>` : ""}</h3><div class="v5cgrid">${own
        .map((c) => {
          const left = st.cards[c.id] - used(c.id),
            dis = tier >= 6 || left <= 0 || fp.length >= 3 || (t && t !== tier);
          return `<button class="v5mini" data-v5="fpick" data-k="${c.id}" style="--tc:${V5_TIER[c.t].c}" ${dis ? "disabled" : ""}><b>${esc(c.n)}</b><span class="px">×${left}</span><small>${V5_PART[c.p]}</small></button>`;
        })
        .join("")}</div>`;
    })
    .join("");
  return `<div class="board v5sel"><p class="note" style="margin:0 0 6px">放入 3 張同階卡片，合成 1 張隨機的高一階卡片（神話卡片無法再合成）。</p><div class="v5fps">${picks}</div>
    ${t ? `<div class="v5cost">${v5MatTag("b1", t)}${v5ZenyTag(z)}<span class="note" style="margin:0">→ 隨機 ${V5_TIER[t + 1]?.n || ""}卡片</span></div>` : ""}
    <div class="row"><button class="btn" data-v5="fclear" ${fp.length ? "" : "disabled"}>清除</button><span class="spacer"></span><button class="btn primary" data-v5="fuse" ${can ? "" : "disabled"}>合成</button></div></div>
    ${groups || '<p class="empty-note">還沒有卡片。<br>擊殺怪物有機率掉落卡片，菁英與頭目機率更高。</p>'}`;
}
function v5MatTab() {
  return `${v5MatBoard()}<h3 class="hrow">購買素材${helpBtn("craft")}${aWallet()}</h3>${ui.craftHtml()}<h3>升級合成${helpBtn("craft", 2)}</h3>${ui.mergeHtml()}`;
}
// --- 蒐藏
function v5CodexHtml() {
  const st = v5St(),
    n = v5SeenN(),
    N = V5_CARDS.length,
    own = Object.values(st.cards).reduce((a, b) => a + b, 0);
  const f = ui.v5cf2 || 0;
  const tiers = [1, 2, 3, 4, 5, 6].filter((t) => !f || f === t);
  return `<div class="board"><div class="row"><span>蒐藏度 <b class="px">${n}/${N}</b></span><span class="spacer"></span><span>持有卡片 <b class="px">${own}</b> 張</span></div>
    <div class="cbar v5bar"><i style="width:${(100 * n) / N}%"></i></div>
    <p class="note" style="margin:4px 0 0">每蒐集 1 種卡片（取得過即算），傷害增加與最大生命各 +${V5_COL.d}%。目前 +${+(n * V5_COL.d).toFixed(1)}%。</p></div>
    <details class="box v5mel"><summary>怪物屬性一覽</summary><div class="v5resb">${[...new Set(MAPS.slice(0, MAP_N).flatMap((m) => m.m))].map((k) => `<span>${esc(MON[k]?.n || k)} <b>${V5_EL[V5_MOB_EL[k] || "neutral"]}</b></span>`).join("")}${MAPS.slice(0, V5_BOSS_EL.length).map((m, i) => `<span>${esc(m.boss)} <b>${V5_EL[V5_BOSS_EL[i]]}</b></span>`).join("")}</div></details>
    <div class="seg" style="margin:8px 0">${[0, 1, 2, 3, 4, 5, 6].map((t) => `<button data-v5="cf" data-v="${t}" aria-pressed="${f === t}">${t ? V5_TIER[t].n : "全部"}</button>`).join("")}</div>
    ${tiers
      .map(
        (t) =>
          `<h3>${v5TierTag(t)}<span class="note" style="margin-left:6px">鑲嵌成功率 ${V5_INS_OK[t]}%・${esc(V5_TIER_SRC[t])}</span></h3><div class="v5codex">${V5_CARDS.filter((c) => c.t === t)
            .map((c) => {
              const seen = st.seen[c.id],
                cnt = st.cards[c.id] || 0;
              return `<div class="v5ccard${seen ? "" : " unk"}" style="--tc:${V5_TIER[c.t].c}"><div class="v5chd"><img src="${roItemIcon(4001)}" alt=""><b>${seen ? esc(c.n) : "？？？"}</b><span class="px">${seen ? "×" + cnt : ""}</span></div><div class="v5cpart">${V5_PART[c.p]}卡片</div><div class="v5ceff">${seen ? esc(v5CardText(c)) : "尚未取得"}</div></div>`;
            })
            .join("")}</div>`,
      )
      .join("")}`;
}
function v5UiInstall() {
  const st0 = ui.statHtml;
  ui.statHtml = function (t) {
    return t && t.v5 ? v5StatHtml(t) : st0.call(this, t);
  };
  const al = ui.alchList;
  ui.alchList = function (t, a) {
    return t && t.v5 ? [] : al.call(this, t, a);
  };
  const ab = ui.alchBtns;
  ui.alchBtns = function (t, a) {
    if (!t || !t.v5) return ab.call(this, t, a);
    return `<div class="ar"><button class="btn sm" data-v5="go" data-v="ref" data-u="${t.u}">精煉 +${t.ref || 0}</button>${t.cs ? `<button class="btn sm" data-v5="go" data-v="sock" data-u="${t.u}">鑲嵌卡片 ${t.cards.filter(Boolean).length}/${t.cs}</button>` : ""}</div>`;
  };
  const ce = cellHtml;
  cellHtml = function (t, a, s) {
    const h = ce(t, a, s);
    if (!t || !t.v5) return h;
    const i = h.lastIndexOf("</button>");
    const pips = t.cs ? `<span class="v5cs">${t.cards.map((c) => `<i${c ? ` style="background:${V5_TIER[V5_CARD[c]?.t || 1].c}"` : ""}></i>`).join("")}</span>` : "";
    return h.slice(0, i) + (t.ref ? `<span class="v5rf">+${t.ref}</span>` : "") + pips + h.slice(i);
  };
  const cs = ui.charStats;
  ui.charStats = function (...a) {
    let h = cs.apply(this, a).replace("grid-template-columns:repeat(7,minmax(0,1fr))", "grid-template-columns:repeat(4,minmax(0,1fr))");
    const res = Object.keys(V5_EL)
      .map((e) => [e, Math.round(tal("res_" + e) + tal("res_all"))])
      .filter(([, v]) => v);
    if (res.length)
      h = h.replace("<h3>自動藥水</h3>", `<h3>屬性抗性</h3><div class="box v5resb">${res.map(([e, v]) => `<span>${V5_EL[e]} <b class="px">${v > 0 ? "+" : ""}${Math.min(75, v)}%</b></span>`).join("")}</div><h3>自動藥水</h3>`);
    return h;
  };
  const pa = ui.p_alch;
  ui.p_alch = function () {
    if (!S.alchOn) return pa.call(this);
    if (ui.v5at === "slate") ui.v5at = "ref"; // v6.2：石板已移除
    if (false) {
      if (ui.alchMode === "k" || ui.alchMode === "s") ui.alchMode = "x";
      const h = pa.call(this).replace(/<button data-act="amode" data-v="[ks]"[^>]*>[^<]*<\/button>/g, "");
      const tabs = [...V5_TABS, ["slate", "石板"]];
      const seg = `<div class="row" style="margin:0 0 8px;flex-wrap:nowrap"><div class="seg aseg" style="flex:1">${tabs.map(([k, n]) => `<button data-v5="at" data-v="${k}" aria-pressed="${k === "slate"}">${n}</button>`).join("")}</div></div>`;
      return seg + h;
    }
    return v5AlchHtml();
  };
  const aa = ui.alchAll;
  ui.alchAll = function (m) {
    return aa.call(this, m).filter((t) => t.sl || t.slot === "slate");
  };
  // v5.5：卡片圖鑑與地圖蒐藏是不同的系統，選單分成兩個項目
  const mc = ui.m_cards;
  ui.m_cards = function () {
    return `<h2>卡片圖鑑${helpBtn("cards")}</h2>${v5CodexHtml()}`;
  };
  ui.m_mapcol = function () {
    return mc.call(this).replace(/<h2>怪物卡牌/, "<h2>地圖蒐藏").replace('data-k="cards"', 'data-k="mapcol"');
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("[data-v5]");
    if (!b || b.disabled || b.tagName === "INPUT") return;
    const a = b.dataset.v5,
      u = b.dataset.u,
      i = +b.dataset.i,
      k = b.dataset.k,
      v = b.dataset.v;
    switch (a) {
      case "at":
        ui.v5at = v;
        ui.v5res = null;
        ui.v5pick = null;
        ui.v5cf = null;
        break;
      case "go":
        if (!S.alchOn) return void toast(`煉金工坊尚未開放：擊敗「${MAPS[ALCH_MAP].n}」的頭目後開放`, "bad");
        ui.v5at = v;
        ui.v5sel = +u;
        ui.v5pick = null;
        return void ui.setTab("alch");
      case "sel":
        ui.v5sel = +u;
        ui.v5pick = null;
        break;
      case "refine":
        return void v5Refine(u);
      case "pick":
        ui.v5pick = ui.v5pick === i ? null : i;
        break;
      case "ins":
        return void v5Insert(u, i, k);
      case "rem":
        return void v5Remove(u, i);
      case "fpick": {
        const fp = (ui.v5fp ||= []);
        if (fp.length < 3) fp.push(k);
        break;
      }
      case "funpick":
        ui.v5fp?.splice(i, 1);
        break;
      case "fclear":
        ui.v5fp = [];
        break;
      case "fauto": {
        const t = +v,
          st = v5St(),
          bag = [];
        for (const c of V5_CARDS.filter((c) => c.t === t).sort((x, y) => (st.cards[y.id] || 0) - (st.cards[x.id] || 0)))
          for (let n = 0; n < (st.cards[c.id] || 0); n++) bag.push(c.id);
        ui.v5fp = bag.slice(0, 3);
        break;
      }
      case "fuse":
        return void v5Fuse(ui.v5fp);
      case "bsalv": {
        const key = "salv" + v;
        if (ui.v5cf !== key) {
          ui.v5cf = key;
          break;
        }
        ui.v5cf = null;
        const r = v === "uq" ? "uq" : +v;
        const list = S.bag.filter((t) => t.v5 && !t.lk && !keepMatch(t) && !t.my && (r === "uq" ? t.uq : !t.uq && t.rar === r));
        for (const t of list) salvage(t.u);
        markDirty();
        break;
      }
      case "cv":
        ui.v5cv = v;
        break;
      case "cf":
        ui.v5cf2 = +v;
        break;
      default:
        return;
    }
    ui.render();
  });
  document.addEventListener("change", (e) => {
    const b = e.target.closest && e.target.closest('[data-v5="prot"]');
    if (!b) return;
    ui.v5prot = !!b.checked;
    ui.render();
  });
  v5HelpInstall();
}

function v5HelpInstall() {
  HELP.alchx = ["石板萃取", HELP.alch[1]];
  AX_HELP.x = "alchx";
  HELP.alch = [
    "煉金工坊",
    [
      ["分解", "把不要的裝備分解成精煉素材；鑲嵌的卡片會全部取回。"],
      ["精煉", "消耗神之金屬（武器）或鋁（防具、飾品）提升精煉值 +1～+10，強化基底與額外素質。"],
      ["鑲嵌", "把卡片插進裝備的插槽，有失敗率；也可以花費黃色魔力礦石與 Zeny 拆下卡片。"],
      ["卡片合成", "3 張同階卡片合成 1 張隨機的高一階卡片。"],
      ["素材", "用 Zeny 購買原石與魔力礦石，或把 4 個素材升級合成為高一級。"],
      ["開放", `擊敗「${MAPS[ALCH_MAP].n}」的頭目後開放。`],
    ],
  ];
  HELP.v5salv = [
    "分解",
    [
      ["產出", "武器分解為神之金屬原石，防具與飾品分解為鋁原石。"],
      ["數量", "普通、魔法 1 個，稀有 2 個，傳奇 3 個，獨特再 +1。"],
      ["高等級", "Lv60 以上的裝備有 25% 機率直接得到神之金屬或鋁。"],
      ["精煉退還", "精煉 +5 以上的裝備，每高 1 級多退還 1 個神之金屬或鋁。"],
      ["卡片", "裝備上的卡片在分解時全部取回，不會消失。"],
      ["自動分解", "背包的拾取篩選自動分解時，也會得到素材與 Zeny。"],
      ["批次分解", "依稀有度一次分解；鎖定、符合保留規則與主宰裝備不會被分解。按兩次確認。"],
    ],
  ];
  HELP.v5ref = [
    "精煉",
    [
      ["效果", "每 +1 精煉提升基底（武器攻擊、護甲、閃避、生命）約 6%～11%，+10 時為 ×1.76；額外素質每級 +3%。"],
      ["素材", "+1～+5 用神之金屬／鋁，+6～+8 用濃縮神之金屬／濃縮鋁，+9～+10 用高純度神之金屬／高純度鋁。武器用神之金屬系，其他部位用鋁系。"],
      ["成功率", "+1～+4 必定成功；+5 為 80%、+6 為 65%、+7 為 50%、+8 為 35%、+9 為 25%、+10 為 15%。"],
      ["失敗", "+5 失敗時精煉值不變；+6 以上失敗時精煉值 −1。裝備不會損毀。"],
      ["保護", "勾選保護後，失敗時精煉值不變：+5～+7 使用鐵匠的祝福（沒有時改用神工匠的祝福），+8～+10 只能使用神工匠的祝福。"],
      ["Zeny", "每次精煉消耗 Zeny，裝備等級與目標精煉值越高越多。"],
    ],
  ];
  HELP.v5sock = [
    "鑲嵌",
    [
      ["插槽", "裝備的插槽數在掉落時決定，上限依稀有度：" + V5_SLOT_TXT + "。"],
      ["部位", "每張卡片只能插在指定的部位，例如武器卡片只能插武器。同一張卡片可以重複插。"],
      ["消耗", "每次鑲嵌消耗 1 顆紅色魔力礦石與 Zeny。"],
      ["成功率", "依卡片階級：" + V5_INS_OK.slice(1).map((v, i) => V5_TIER[i + 1].n + " " + v + "%").join("、") + "。失敗時卡片 50% 機率損毀（使用祝福可保護）。"],
      ["失敗", "失敗時卡片有 50% 機率損毀，否則退回。勾選保護則必定退回（稀有以下用鐵匠的祝福，史詩以上用神工匠的祝福）。"],
      ["拆卸", "花費黃色魔力礦石（數量等於卡片階級）與 Zeny 可拆下卡片，必定成功，卡片回到收藏中。"],
      ["分解", "分解裝備時會免費取回所有卡片。"],
    ],
  ];
  HELP.v5fuse = [
    "卡片合成",
    [
      ["合成", "放入 3 張同階卡片，得到 1 張隨機的高一階卡片。卡片可以相同也可以不同。"],
      ["消耗", "藍色魔力礦石（數量等於階級）與 Zeny。"],
      ["神話", "神話卡片無法再合成。"],
      ["自動選", "自動挑選該階持有最多的卡片。"],
    ],
  ];
  HELP.v5mat = [
    "素材",
    [
      ["神之金屬", "武器精煉用。4 個原石合成神之金屬，4 個神之金屬合成濃縮神之金屬，4 個濃縮合成高純度。"],
      ["鋁", "防具與飾品精煉用。4 個原石合成鋁，4 個鋁合成濃縮鋁，4 個濃縮合成高純度。"],
      ["祝福", "鐵匠的祝福、神工匠的祝福：精煉與鑲嵌失敗時的保護。由菁英與頭目掉落，4 個鐵匠的祝福可合成 1 個神工匠的祝福。"],
      ["魔力礦石", "紅色：鑲嵌卡片；藍色：合成卡片；黃色：拆卸卡片。可用 Zeny 購買，也會由怪物掉落。"],
      ["取得", "分解裝備、怪物掉落（菁英與頭目較多），或在此用 Zeny 購買原石。"],
    ],
  ];
  HELP.craft = [
    "購買與升級合成",
    [
      ["購買", "消耗 Zeny 購買神之金屬原石、鋁原石與三種魔力礦石。"],
      ["升級合成", "4 個同級素材加上 Zeny 合成 1 個高一級的素材；4 個鐵匠的祝福可合成 1 個神工匠的祝福。"],
      ["全部往上合", "從最低等級開始，將可合成的全部升級，合成結果也會繼續升級。"],
      ["自動合成", "勾選後，鐵匠的祝福達 4 個時自動合成為神工匠的祝福，並消耗 Zeny。"],
    ],
  ];
  HELP.mapcol = ["地圖蒐藏", (HELP.cards?.[1] || []).map((r) => (r[0] === "卡牌加成" ? ["地圖加成", r[1]] : r[0] === "活動卡牌" ? ["活動", r[1]] : r))];
  HELP.cards = [
    "卡片圖鑑",
    [
      ["怪物卡片", `共 ${V5_CARDS.length} 種，名稱取自 RO，分為普通、精良、稀有、史詩、傳說、神話 6 階。卡片是強化素材，不限定由哪種怪物掉落。`],
      ["一般怪物", `每次擊殺 ${V5_DROP.mob * 100}% 機率掉落普通或精良卡片，越後面的地圖精良越多；菁英掉落率 ×${V5_DROP.elite}，最高到稀有。`],
      ["頭目", `地圖頭目 ${V5_DROP.boss * 100}% 掉落稀有或史詩；守護者、巴風特 ${V5_DROP.guard * 100}% 掉落史詩或傳說；無盡之塔頭目層 ${V5_DROP.tower * 100}% 掉落史詩或傳說。`],
      ["高強度內容", `魔王闇答萊屍 ${V5_DROP.monarch * 100}%、活動神化身 ${V5_DROP.god * 100}% 掉落傳說或神話；無限武鬥場每 10 層頭目關機率隨層數提高，30 層起掉落傳說或神話。`],
      ["使用", "卡片在「煉金・鑲嵌」插入裝備插槽，依部位限制；合成在「煉金・卡片合成」。"],
      ["蒐藏度", `每蒐集到 1 種卡片（取得過即算，之後用掉也保留），傷害增加與最大生命各 +${V5_COL.d}%，全部蒐集 +${+(V5_COL.d * V5_CARDS.length).toFixed(1)}%。`],
      ["屬性", "每種怪物有攻擊屬性（水、地、火、風、毒、聖、暗、念、不死、無），卡片圖鑑上方可查看；屬性抗性降低該屬性怪物的傷害，上限 75%。"],
      ["地圖蒐藏", "每張地圖的擊殺加成是另一個系統，在選單「地圖蒐藏」查看。"],
    ],
  ];
  HELP.bag = [
    "背包",
    [
      ["部位", "8 個部位：武器、盾牌、頭飾、鎧甲、披肩、鞋子、飾品 ×2。雙手武器無法搭配盾牌。兩個飾品欄可以互換。"],
      ["素質", "裝備沒有詞綴，改為基底素質（攻擊或防禦）加上固定的額外素質；每件掉落時浮動 50%～150%，稀有度越高越接近上限，詳情顯示「品質」。"],
      ["插槽", "名稱後的 [數字] 為卡片插槽數；格子下方的小點為插槽，已鑲嵌的會亮起。"],
      ["精煉值", "名稱前的 +數字 為精煉值。"],
      ["拾取篩選", "勾選的稀有度在拾取時自動分解，得到 Zeny 與精煉素材。主宰不會分解。"],
      ["批次分解", "依勾選的稀有度和上方的部位、規則篩選，一次分解。裝備上的卡片會取回。"],
      ["多選", "點選多件裝備，再一次分解、鎖定或解鎖。全選會選取目前篩選的全部裝備。"],
      ["不會被分解", "鎖定的裝備不會被分解；傳奇、獨特需另行勾選。"],
      ["保留規則", "符合規則的裝備，拾取篩選與批次分解皆會略過。"],
    ],
  ];
}

// ===========================================================================
// v5 第二階段：技能多樣化、職業專屬輔助與被動、穿梭（跨職業）輔助
// 由 roV4Install() 在 roJobSkillsInstall() 之後呼叫（轉職天賦建立之前）。
// ---------------------------------------------------------------------------
// 輔助寶石的「原職業」；其他職業改用自己的同功能輔助（下方 V5_EQ）。
const V5_SUP_HOME = {
  fury: "sword", sacr: "sword", conc: "sword",
  prec: "bow", multi: "bow", mproj: "bow", overk: "bow",
  amp: "mage", ailx: "mage", spread: "mage", cot: "mage", bigarea: "mage", chainp: "mage",
  mstrike: "thief", pstack: "thief",
  haste: "acolyte",
  mcount: "merchant", mdmg: "merchant",
};
// 職業專屬輔助：[id, 複製來源, 名稱, 職業, 覆寫]
const V5_SUPS = [
  ["sw_quick", "haste", "雙手劍加速", "sword"],
  ["sw_crit", "prec", "致命一擊", "sword"],
  ["sw_counter", "mstrike", "自動反擊", "sword"],
  ["sw_brand", "bigarea", "衝鋒精通", "sword"],
  ["sw_spirit", "mdmg", "英靈之誓", "sword"],
  ["sw_rune", "amp", "盧恩之力", "sword"],
  ["sw_runeb", "ailx", "盧恩研究", "sword"],
  ["sw_endure", "fury", "霸體", "sword", { mod: { dmg: 0.3, area: 0.2 }, d: "相鄰的主動技能傷害 +30%、範圍 +20%" }],
  ["bw_quick", "haste", "快速填裝", "bow"],
  ["bw_poison", "pstack", "毒箭精通", "bow"],
  ["bw_reflex", "cot", "反射射擊", "bow"],
  ["bw_trap", "bigarea", "陷阱研究", "bow"],
  ["bw_ens", "mcount", "合奏精通", "bow"],
  ["bw_ens2", "mdmg", "樂器練習", "bow"],
  ["bw_falcon", "fury", "鋼鐵之鷹", "bow"],
  ["mg_spirit", "mcount", "元素親和", "mage"],
  ["mg_spirit2", "mdmg", "精靈強化", "mage"],
  ["mg_prec", "prec", "魔力集中", "mage"],
  ["mg_conc", "conc", "魔法壓縮", "mage"],
  ["mg_quick", "haste", "快速詠唱", "mage"],
  ["mg_proj", "mproj", "魔法彈幕", "mage"],
  ["th_quick", "haste", "疾風步", "thief"],
  ["th_crit", "prec", "卡塔爾研究", "thief"],
  ["th_shadow", "multi", "影子分身", "thief"],
  ["th_instinct", "cot", "暗殺本能", "thief"],
  ["th_area", "bigarea", "毒霧擴散", "thief"],
  ["th_ambush", "fury", "埋伏", "thief"],
  ["th_toxin", "fury", "毒性強化", "thief", { req: "psn", mod: { dmg: 0.35, pstk: 1 }, d: "相鄰的中毒技能傷害 +35%，中毒可多疊 1 層" }],
  ["ac_bless", "amp", "天使之賜福", "acolyte"],
  ["ac_ray", "mproj", "聖光連射", "acolyte"],
  ["ac_triple", "mstrike", "三段掌", "acolyte"],
  ["ac_spirit", "prec", "氣功", "acolyte"],
  ["ac_angel", "mcount", "天使之環", "acolyte"],
  ["ac_angel2", "mdmg", "神聖守護", "acolyte"],
  ["ac_area", "bigarea", "光之領域", "acolyte"],
  ["ac_fury", "fury", "爆氣", "acolyte"],
  ["ac_holy", "fury", "神聖之力", "acolyte", { req: "holy", mod: { dmg: 0.6 }, d: "相鄰的神聖技能傷害 +60%" }],
  ["mc_cart", "fury", "改良手推車", "merchant"],
  ["mc_quick", "haste", "快速組裝", "merchant"],
  ["mc_area", "bigarea", "手推車迴旋", "merchant"],
  ["mc_proj", "mproj", "多管砲", "merchant"],
  ["mc_prec", "prec", "精準瞄準", "merchant"],
  ["mc_acid", "pstack", "強酸塗佈", "merchant"],
  ["mc_cot", "cot", "自動煉成", "merchant"],
  ["mc_hammer", "mstrike", "連鎖錘擊", "merchant"],
  ["mc_over", "fury", "武器強化", "merchant", { mod: { dmg: 0.35, crit: 15 }, d: "相鄰的主動技能傷害 +35%、暴擊率 +15%" }],
];
const V5_SUP_ICON = { sw_endure: 8, th_toxin: 138, ac_holy: 156, mc_over: 154 };
// 被動技能寶石：放入技能格即生效（同種只計 1 顆），不需相鄰
const V5_PAS = [
  ["pa_sw1", "劍術精通", "sword", 2, { dmgp: 15, critm: 20 }],
  ["pa_sw2", "生命回復力提升", "sword", 4, { lifep: 12, regenPct: 0.003 }],
  ["pa_bw1", "鷹眼", "bow", 44, { dmgp: 12, crit: 3 }],
  ["pa_bw2", "野性本能", "bow", 45, { aspd: 8, move: 8 }],
  ["pa_mg1", "魔法精通", "mage", 9, { skill: 18 }],
  ["pa_mg2", "魔力回復", "mage", 20, { cdr: 5, rint: 5 }],
  ["pa_th1", "回避率增加", "thief", 49, { evap: 20, ragi: 4 }],
  ["pa_th2", "致命要害", "thief", 51, { crit: 3, critm: 25 }],
  ["pa_ac1", "天使之護", "acolyte", 33, { armorp: 25, lifep: 8 }],
  ["pa_ac2", "神聖保護", "acolyte", 22, { res_undead: 20, res_shadow: 20, rint: 4 }],
  ["pa_mc1", "武器研究", "merchant", 36, { dmgp: 12, rstr: 4 }],
  ["pa_mc2", "學習藥水", "merchant", 37, { pot: 40, regenPct: 0.003 }],
];
// 新主動技能（RO 原名）：[id, 複製來源, 名稱, 職業, 屬性, 圖示, 覆寫]
const V5_ACTS = [
  ["sw_magnum", "whirl", "怒爆", "sword", "fire", 7, { hit: 2.5, cd: 5, ail: "brn", tg: ["aoe", "elem"], d: "以火焰之力震開周圍敵人，造成 {hit}% 武器傷害並使其燃燒" }],
  ["sw_hcross", "thrust", "聖十字攻擊", "sword", "holy", 255, { hit: 1.9, cd: 2.5, tg: ["aoe", "holy"], d: "以十字斬擊前方敵人，每道造成 {hit}% 武器傷害" }],
  ["bw_charge", "pierce", "衝鋒箭", "bow", "neutral", 46, { hit: 3.4, cd: 3.5, d: "射出強力的箭矢，造成 {hit}% 武器傷害並大幅擊退" }],
  ["bw_blast", "trap", "爆炸陷阱", "bow", "fire", 116, { hit: 2.6, ail: "brn", tg: ["aoe", "trap", "elem"], d: "設置爆炸陷阱，敵人觸發時爆炸，造成 {hit}% 武器傷害並使其燃燒" }],
  ["mg_tstorm", "bliz", "雷爆術", "mage", "wind", 21, { hit: 0.6, cd: 6, ail: "shk", d: "召喚雷暴持續轟擊區域，每次造成 {hit}% 武器傷害並使敵人感電" }],
  ["mg_soul", "fire", "靈魂之擊", "mage", "ghost", 13, { hit: 2.6, cd: 3, ail: undefined, tg: ["proj", "spell"], d: "射出念屬性的靈魂彈，造成 {hit}% 武器傷害並在命中處爆炸" }],
  ["th_soulbrk", "heavy", "靈魂破壞", "thief", "ghost", 137, { hit: 5.2, cd: 5, d: "以念力貫穿目標，造成 {hit}% 武器傷害" }],
  ["th_meteor", "whirl", "流星突擊", "thief", "neutral", 397, { hit: 2.5, cd: 5, d: "化為流星撞擊周圍，造成 {hit}% 武器傷害" }],
  ["ac_magnus", "bliz", "十字驅魔攻擊", "acolyte", "holy", 79, { hit: 0.75, cd: 7, ail: undefined, tg: ["aoe", "spell", "holy"], d: "降下十字聖光持續淨化區域，每次造成 {hit}% 武器傷害" }],
  ["ac_sphere", "fire", "氣彈", "acolyte", "ghost", 261, { hit: 2.3, cd: 2.5, ail: undefined, tg: ["proj"], d: "射出念屬性的氣彈，造成 {hit}% 武器傷害並在命中處爆炸" }],
  ["mc_revo", "whirl", "手推車革命", "merchant", "neutral", 153, { hit: 2.4, cd: 5, d: "揮舞手推車橫掃周圍，造成 {hit}% 武器傷害" }],
  ["mc_cannon", "pierce", "手推車加農砲", "merchant", "neutral", 154, { hit: 3.0, cd: 3, d: "從手推車發射砲彈，造成 {hit}% 武器傷害" }],
];
// 既有主動技能的屬性（只有「聖屬性對不死怪物 ×1.5」有傷害加成）
const V5_SK_EL = {
  fire: "fire", meteor: "fire", farrow: "fire", ignite: "fire", fireL: "fire",
  nova: "water", bliz: "water", iarrow: "water", frostsl: "water",
  chain: "wind", larrow: "wind", fissure: "earth", cslw: "earth",
  varrow: "poison", venom: "poison", envenom: "poison", miasma: "poison", acid: "poison",
  holy: "holy", sanctuary: "holy", gcross: "holy", angel: "holy", heal: "holy", cwk: "holy",
  blink: "shadow", backstab: "shadow", bpool: "shadow", blinkL: "shadow", cvul: "shadow",
  asura: "ghost", palm: "ghost", combo: "ghost", tiger: "ghost",
};
const V5_HOLY_UNDEAD = 1.5;
const V5_EQ = {}; // V5_EQ[cls][通用輔助] = 該職業的同功能輔助
const v5SupBase = (id) => SKILLS[id]?.v5base || id;
const v5IsPas = (id) => !!SKILLS[id]?.pas;
const v5SupFits = (s, a) => !v5IsPas(s) && !SKILLS[s]?.act && supFits(v5SupBase(s) === s || SKILLS[s].v5own ? s : v5SupBase(s), a);
function roV5SkillsInstall() {
  TAG.holy = "神聖";
  TAG.pas = "被動";
  // 職業專屬輔助
  for (const [id, base, n, cls, ex = {}] of V5_SUPS) {
    const b = SKILLS[base];
    SKILLS[id] = { ...b, shape: b.shape.map((p) => [...p]), tg: [...(b.tg || [])], mod: { ...b.mod }, n, cls, v5base: base, ...ex };
    if (ex.req || ex.mod) SKILLS[id].v5own = 1;
    roSkillIcons[id] = V5_SUP_ICON[id] || roSkillIcons[base] || 20;
    (V5_EQ[cls] ||= {})[base] ??= id;
    if (RO_COUNT_SUP[base] && !ex.mod) RO_COUNT_SUP[id] = RO_COUNT_SUP[base];
  }
  for (const [id, cls] of Object.entries(V5_SUP_HOME)) SKILLS[id].cls = cls;
  // 被動技能
  for (const [id, n, cls, icon, pm] of V5_PAS) {
    SKILLS[id] = {
      n, cls, act: 0, pas: 1, req: "pas", tg: [], mod: {}, pm,
      shape: [[0, 0], [1, 0]],
      col: "#c9a45a",
      d: "被動技能：放入技能格即生效（不需相鄰，同種只計 1 顆）。" + Object.entries(pm).map(([k, v]) => v5Line(k, v)).join("、"),
    };
    roSkillIcons[id] = icon;
  }
  // 新主動技能
  for (const [id, base, n, cls, el, icon, ex] of V5_ACTS) {
    roSkill(id, base, n, cls, ex);
    V5_SK_EL[id] = el;
    roSkillIcons[id] = icon;
  }
  // 技能屬性：神聖技能加上「神聖」標籤；說明前加上屬性
  for (const [id, el] of Object.entries(V5_SK_EL)) {
    const sk = SKILLS[id];
    if (!sk) continue;
    sk.el = el;
    if (el === "holy" && sk.tg && !sk.tg.includes("holy")) sk.tg.push("holy");
    if (sk.d && !sk.d.startsWith("〔")) sk.d = `〔${V5_EL[el]}屬性〕` + sk.d;
  }
  for (const id in SKILLS) {
    const sk = SKILLS[id];
    if (sk.act && !sk.el && sk.d && !sk.d.startsWith("〔") && sk.hit) sk.d = "〔無屬性〕" + sk.d;
  }
  for (const id in SKILLS) {
    const sk = SKILLS[id];
    if (sk.hit && sk.d && sk.d.includes("{")) sk.d = sk.d.replace("{hit}", Math.round(100 * sk.hit)).replace("{half}", Math.round(50 * sk.hit));
  }
  // 各職業技能清單：非本職業的輔助換成本職業的同功能輔助，再加入新寶石
  for (const [cls, c] of Object.entries(CLASS)) {
    const out = [];
    for (const g of c.gems) {
      let id = g;
      const sk = SKILLS[g];
      if (sk && !sk.act && V5_SUP_HOME[g] && V5_SUP_HOME[g] !== cls) id = V5_EQ[cls]?.[g] || null;
      if (id && !out.includes(id)) out.push(id);
    }
    for (const [id, , , k] of [...V5_SUPS, ...V5_ACTS]) if (k === cls && !out.includes(id)) out.push(id);
    for (const [id, , k] of V5_PAS) if (k === cls && !out.includes(id)) out.push(id);
    c.gems.splice(0, c.gems.length, ...out);
  }
  // 轉職天賦的「共鳴」輔助改為本職業版本
  for (const [cls, specs] of Object.entries(RO_ASC_SPEC))
    for (const sp of specs) for (const i of [4, 5]) if (V5_EQ[cls]?.[sp[i]] && V5_SUP_HOME[sp[i]] !== cls) sp[i] = V5_EQ[cls][sp[i]];
  const res = roResonance;
  roResonance = function (id, strong) {
    const b = v5SupBase(id);
    if (b === "cot" && id !== "cot") {
      const r = res("cot", strong);
      return [SKILLS[id].n + "共鳴", r[1].replace("自動念咒", SKILLS[id].n), r[2]];
    }
    return res(id, strong);
  };
}
// 第二階段的執行期掛勾（在 roV5Install 內呼叫）
function v5SkillsRuntime() {
  // 連結：被動不連結；複製的輔助依來源判斷標籤
  linkedSupports = function (t) {
    return adjSupports(t).filter((a) => !v5IsPas(a.id) && (v5SupFits(a.id, t.id) || a.mu?.free));
  };
  // 聖屬性對不死怪物
  HIT_MUL.push({
    k: "v5:holy",
    lab: (t) => t.tg && t.tg.includes("holy") && `聖屬性對不死怪物 ×${V5_HOLY_UNDEAD}`,
    f: (t, m, s) => (s && s.tg && s.tg.includes("holy") && m && v5MobEl(m) === "undead" ? t * V5_HOLY_UNDEAD : t),
  });
  // 被動技能效果
  const cm = collectMods;
  collectMods = function () {
    const out = cm();
    if (!S || !S.gems) return out;
    const seen = new Set();
    for (const g of placed()) {
      const sk = SKILLS[g.id];
      if (!sk?.pas || seen.has(g.id) || g.sx) continue;
      seen.add(g.id);
      for (const [k, v] of Object.entries(sk.pm)) out.push({ s: k, v, src: "pas:" + g.id });
    }
    return out;
  };
  // 變異寶石不會是被動
  const mm = makeMutGem;
  makeMutGem = function () {
    for (let i = 0; i < 30; i++) {
      const g = mm();
      if (!v5IsPas(g.id)) return g;
    }
    return mm();
  };
  // 近戰職業的投射物技能（神聖之光、氣彈、強酸火煙瓶、火球術…）施放距離至少 55，
  // 避免追不到會保持距離的遠程怪物
  const sr = skillRange;
  skillRange = function (t) {
    const r = sr(t);
    return r != null && PS.range < 30 && (SKILLS[t.id].tg || []).includes("proj") ? Math.max(r, V5_PROJ_REACH) : r;
  };
  // 穿梭寶石：其他職業的輔助，任何怪物都可能掉落；無法變異
  rollSx = function (t, a = t.elite, s = t.boss) {
    const p = (s ? V5_SX.b : a ? V5_SX.e : V5_SX.n) + (slateSum("sl_sx") / 1e5) * (s ? MUT.b : a ? MUT.e : 1);
    if (!p || RAND() >= p) return null;
    const pool = v5SxPool(S.cls);
    return pool.length ? { u: uid(), id: pool[Math.floor(RAND() * pool.length)], x: -1, y: -1, rot: 0, sx: 1 } : null;
  };
  // 介面：被動標籤文字
  const fix = (h) => h.replace(/限被動/g, "被動");
  for (const k of ["p_skill", "m_shop"]) {
    const f = ui[k];
    if (f) ui[k] = function (...a) { return fix(f.apply(this, a)); };
  }
}
const V5_SX = { n: 1 / 15000, e: 1 / 2500, b: 1 / 150 };
const V5_PROJ_REACH = 55;
function v5SxPool(cls) {
  const own = CLASS[cls].gems,
    acts = own.filter((g) => SKILLS[g]?.act);
  return Object.keys(SKILLS).filter(
    (id) => !SKILLS[id].act && !SKILLS[id].pas && !SKILLS[id].leg && SKILLS[id].mod && !own.includes(id) && acts.some((a) => v5SupFits(id, a)),
  );
}
// 舊存檔：不屬於本職業的輔助寶石轉為穿梭寶石（可使用、無法變異）
function v5MigrateGems() {
  if (!S || !S.gems || S.v5g === 1) return;
  S.v5g = 1;
  const own = CLASS[S.cls].gems;
  let n = 0;
  for (const g of S.gems) {
    const sk = SKILLS[g.id];
    if (sk && !sk.act && !sk.pas && !own.includes(g.id) && !g.sx) (g.sx = 1), n++;
  }
  if (n) later(1.5, () => toast(`輔助寶石改為職業專屬：${n} 顆其他職業的輔助已轉為穿梭寶石，仍可使用`, "lvl", 1));
}
function v5SkillHelp() {
  const L = HELP.skill[1],
    set = (k, v) => {
      const i = L.findIndex((x) => x[0] === k);
      i >= 0 ? (L[i] = [k, v]) : L.push([k, v]);
    },
    after = (k, rows) => {
      const i = L.findIndex((x) => x[0] === k);
      L.splice(i + 1, 0, ...rows);
    };
  set("輔助寶石", "僅強化上下左右相鄰的主動寶石。標籤須相符：範圍、投射物、元素、神聖等。每個職業有自己的專屬輔助，商人只販售本職業的寶石。");
  after("輔助寶石", [
    ["被動寶石", "每職業 2 種。放入技能格即生效，不需相鄰，也不會連結主動寶石；同種被動只計算 1 顆。"],
    ["技能屬性", "技能說明開頭標示屬性（火、水、風、地、毒、聖、暗、念、無）。目前只有聖屬性有相剋：聖屬性技能對不死屬性怪物傷害 ×1.5，其他屬性沒有傷害加減。"],
  ]);
  set("變異寶石", "所有怪物都可能掉落本職業的變異寶石（菁英、頭目機率較高），石板詞綴「變異寶石」可再提高。效果數值、格數或元素會改變。");
  set("穿梭寶石", "其他職業的專屬輔助寶石，名稱標示「（穿梭）」。可連結你職業的主動寶石，但無法變異；不需要時可在「分解寶石」分解。所有怪物都可能掉落（菁英、頭目機率較高），石板詞綴「穿梭寶石」可再提高。");
}

// ===========================================================================
// v5 第三階段：全部「?」說明配合新系統更新
// ===========================================================================
// 職業天賦說明文字（v5.2 起由效果自動產生；v5.3 新增精確小數、每點屬性、第 3 次施放等）
const v5P = (v, d = 2) => +(v * 100).toFixed(d);
const v5X = (v) => `×${+(1 + v).toFixed(3)}`;
const V5_HEX_TXT = {
  h_first: (v) => `對每個敵人的第一次擊中傷害 ${v5X(v)}`,
  h_ramp: (v) => `戰鬥中每秒傷害倍率 +${v5P(v, 1)}%，最多 +${v5P(v * 10, 0)}%（停止攻擊 4 秒後重置）`,
  h_ail: (v) => `目標身上每有 1 種異常（燃燒、冰緩、感電、中毒、流血、詛咒），傷害倍率 +${v5P(v)}%`,
  h_killcd: (v) => `擊殺時，所有技能冷卻 −${v} 秒`,
  h_killshd: (v) => `擊殺時獲得 ${v5P(v, 1)}% 最大生命的護盾（最多 30%）`,
  h_cheat: (v) => `生命低於 30% 時獲得 ${v5P(v)}% 最大生命的護盾（每 30 秒一次）`,
  h_echo: (v) => `施放技能時 ${v5P(v)}% 機率 0.4 秒後以 60% 傷害再施放一次`,
  h_undead: (v) => `對不死、暗屬性怪物傷害 ${v5X(v)}`,
  h_lowhpdr: (v) => `生命低於 50% 時，受到的傷害 −${v5P(v)}%`,
  h_minshd: (v) => `每隻召喚物使你每秒回復 ${v5P(v)}% 最大生命`,
  // v5.3 新機制
  h_healthy: (v) => `對生命 80% 以上的敵人傷害 ${v5X(v)}`,
  h_close: (v) => `對近身（40 距離內）的敵人傷害 ${v5X(v)}`,
  h_far: (v) => `對遠處（60 距離外）的敵人傷害 ${v5X(v)}`,
  h_castdr: (v) => `施放技能後 2 秒內，受到的傷害 −${v5P(v)}%`,
  h_op: (v) => `每 10 秒，下一次技能擊中的傷害 ${v5X(v)}`,
  h_frenzy: (v) => `擊殺後 4 秒內，傷害倍率 +${v5P(v)}%`,
  h_lucky: (v) => `擊中時 ${v5P(v)}% 機率造成 3 倍傷害`,
  h_ward: (v) => `施放技能時獲得 ${v5P(v, 1)}% 最大生命的護盾（最多 20%）`,
  h_reset: (v) => `擊殺時 ${v5P(v)}% 機率重置所有技能冷卻`,
  h_pain: (v) => `受到傷害後 3 秒內，傷害倍率 +${v5P(v)}%`,
  h_stand: (v) => `站立不動時，傷害倍率 +${v5P(v)}%`,
  h_moving: (v) => `移動中受到的傷害 −${v5P(v)}%`,
};
const V5_TAL_TXT = {
  ...V5_HEX_TXT,
  roBasicCd: (v) => `普通攻擊擊中時，所有技能冷卻 −${+v.toFixed(4)} 秒`,
  roBloodCast: (v) => `施放技能時消耗目前生命的 ${v5P(v)}%`,
  roCritHaste: (v) => `暴擊時攻擊速度 +${v5P(v)}%，持續 3 秒`,
  fullCrit: () => "對生命 90% 以上的敵人必定暴擊",
  roBossDR: (v) => `頭目戰中受到的傷害 −${v5P(v)}%`,
  tntVul: (v) => `被嘲諷的敵人受到的傷害 +${v5P(v)}%`,
  tntDmg: (v) => `被嘲諷的敵人對你造成的傷害再 −${v5P(v)}%`,
  crs: (v) => `詛咒效果 +${v5P(v, 3)}%`,
  crsVul: (v) => `敵人身上每個詛咒使傷害 +${v5P(v)}%`,
  crsSpread: (v) => `受詛咒的敵人死亡時，詛咒轉移至附近 ${v} 個敵人`,
  roHexPulse: (v) => `每 2 秒，每層詛咒造成 ${v5P(v, 1)}% 武器傷害（最多 3 層）`,
  ail: (v) => `元素異常效果 +${v5P(v, 3)}%`,
  ember: (v) => `燃燒中的敵人死亡時爆炸（${v5P(v)}% 武器傷害）`,
  minAs: (v) => `召喚物攻擊速度 +${v5P(v, 3)}%`,
  minCrit: () => "召喚物使用你的暴擊率與暴擊傷害",
  minAil: (v) => `召喚物的元素異常效果 +${v5P(v)}%`,
  minDmg: (v) => `召喚物傷害 ${v5X(v)}`,
  minion: (v) => `召喚物 +${v}`,
  minGuard: (v) => `每隻召喚物使你受到的傷害 −${v5P(v, 3)}%（最多 −60%）`,
  skToMin: (v) => `技能傷害的 ${v5P(v)}% 也套用到召喚物傷害`,
  momSkill: () => "技能擊中也會獲得氣勢",
  momDmg: (v) => `每層氣勢傷害倍率 +${v5P(v, 3)}%`,
  momDR: (v) => `每層氣勢使受到的傷害 −${v5P(v, 3)}%`,
  momDbl: (v) => `氣勢滿層時，擊中有 ${v5P(v)}% 機率造成 2 倍傷害（召喚物除外）`,
  momMax: (v) => `氣勢上限 +${v} 層`,
  rage: () => "生命最多只能回復到 50%；「嗜血」與擊殺回復的回復量 ×2",
  lowhp: (v) => `每失去 10% 生命，傷害倍率 +${v5P(v, 3)}%`,
  armDmg: (v) => `傷害 ×（1＋護甲每 100 點 ${v5P(v, 1)}%）`,
  thorn: () => "受到攻擊時，對攻擊者造成等同護甲值的傷害",
  critEva: () => "暴擊率等同於閃避率（含超出上限的部分）；裝備與其他來源的暴擊率無效",
  critShd: (v) => `暴擊時獲得閃避值 ${v5P(v, 1)}% 的護盾（上限為閃避值的 50%）`,
  psnSpread: (v) => `中毒的敵人死亡時毒爆：對周圍敵人造成牠身上剩餘毒傷的 ${v5P(v)}%，並使牠們中毒`,
  psnHit: (v) => `普攻與技能擊中時 ${v5P(v, 3)}% 機率使敵人中毒`,
  psnRate: (v) => `中毒跳動頻率 +${v5P(v)}%`,
  psnMax: (v) => `中毒上限 +${v} 層`,
  trapMax: (v) => `陷阱上限 +${v}`,
  gndT: (v) => `地面效果持續時間 +${v5P(v, 3)}%`,
  trapEva: (v) => `陷阱傷害依閃避值提高（每 100 閃避 +${v}%）`,
};
const V5_STAT_TXT = (k, v) => {
  if (k === "dmg") return `總傷害額外 +${+v.toFixed(3)}%`;
  if (V5_TAL_TXT[k]) return V5_TAL_TXT[k](v);
  if (V5_FRAC[k]) return V5_FRAC[k](+(v * 100).toFixed(4));
  const kn = V5_KN[k];
  return kn ? `${kn[0]} +${+v.toFixed(3)}${kn[1]}` : `${k} +${v}`;
};
function v5TalText(e) {
  const out = [],
    per = {};
  for (const [k, v] of Object.entries(e || {})) {
    if (k === "v5rd" || k === "v5min") continue;
    if (k === "more") {
      for (const [mk, mv] of Object.entries(v)) out.push(v5MoreLine(mk, mv));
      continue;
    }
    if (/^rscm?:/.test(k)) {
      const [kind, i, key] = k.split(":");
      (per[i] ||= []).push(kind === "rscm" ? (key === "dmg" ? `總傷害額外 +${+v.toFixed(3)}%` : `${key} 額外 +${v}%`) : V5_STAT_TXT(key, v));
      continue;
    }
    if (V5_TAL_TXT[k]) out.push(V5_TAL_TXT[k](v));
    else if (k.startsWith("nth:")) out.push(`「${roSkName(k.slice(4))}」每施放第 3 次，該次傷害 ${v5X(v)}`);
    else if (k.startsWith("sk:")) {
      const [, id, st, el] = k.split(":"),
        n = `「${roSkName(id)}」`;
      out.push(
        st === "more" ? `${n}傷害 ${v5X(v)}` : st === "cd" ? `${n}冷卻 −${v5P(v)}%` : st === "extra" ? `${n}額外施放 +${v}` : st === "proj" ? `${n}投射物 +${v}` : st === "chn" ? `${n}連鎖次數 +${v}` : st === "minion" ? `${n}召喚數量 +${v}` : st === "area" ? `${n}範圍 +${v5P(v)}%` : st === "el" ? `${n}附帶${{ brn: "燃燒", chl: "冰緩", shk: "感電", psn: "中毒" }[el] || el}` : `${n}${st} +${v}`,
      );
    } else if (k.startsWith("tg:")) {
      const [, tg, st] = k.split(":");
      out.push(`${TAG[tg] || tg}技能${st === "dmg" ? "傷害倍率" : st} +${v5P(v)}%`);
    } else out.push(v5Line(k, v));
  }
  const pre = Object.entries(per).map(([i, l]) => `每 1 點${RO_STAT_N[i]}：${l.join("、")}`);
  return [...pre, ...out].join("；");
}
// v5.3 職業天賦全面重製：24 分支 × 8 排 × 3 選 1，全遊戲 576 個天賦效果皆不重複。
// 第 1、2、4、5、6、7、8 排由下表定義（第 3 排為輔助共鳴，另附加分支核心技能加成）；[名稱, 效果, 來源類型]
// 來源類型：W=WoW 天賦、P=PoE、L=LoL 海克斯、E=Last Epoch 技能節點、D=Diablo IV
const V5_TAL2 = {
  ro_sword_0: [
    [["長矛專精", { "rsc:0:dmgp": 0.9 }, "W"], ["騎士體魄", { "rsc:1:lifep": 0.4, "rsc:1:armorp": 0.8 }, "D"], ["衝刺步法", { "rsc:0:move": 0.15, "rsc:0:aspd": 0.25 }, "P"]],
    [["狂擊連打", { roBasicCd: 0.15, aspd: 10 }, "W"], ["騎乘衝鋒", { h_first: 0.5, move: 10 }, "L"], ["三連突刺", { "nth:thrust": 1.0, "sk:thrust:area": 0.2 }, "E"]],
    [["血怒", { rage: 1, more: { dmg: 50 }, leech: 0.015 }, "P"], ["殺戮渴望", { lokp: 0.03, h_frenzy: 0.15 }, "D"], ["嗜血長矛", { leech: 0.02, "sk:heavy:more": 0.2 }, "E"]],
    [["火焰長矛", { roElHit_brn: 0.15, brn: 40 }, "W"], ["龍之怒", { v5pBlast: 0.08, dmgp: 10 }, "L"], ["灼熱突刺", { "sk:thrust:el:brn": 1, ail: 0.25 }, "E"]],
    [["長矛穿刺", { boss: 0.25 }, "W"], ["越戰越勇", { h_ramp: 0.03 }, "L"], ["騎士榮耀", { roBossDR: 0.2, exec: 0.3 }, "D"]],
    [["霸體", { dmgTaken: 0.12, armorp: 30 }, "W"], ["狂暴之血", { leech: 0.012, h_pain: 0.15 }, "D"], ["騎士誓言", { h_cheat: 0.3, lifep: 10 }, "L"]],
    [["狂擊奧義", { "nth:heavy": 1.5, "sk:heavy:cd": 0.2 }, "E"], ["狂戰之魂", { lowhp: 0.06, leech: 0.01 }, "P"], ["騎士之道", { "rscm:0:dmg": 0.25, "rsc:1:lifep": 0.3 }, "W"]],
  ],
  ro_sword_1: [
    [["神聖體魄", { "rsc:1:lifep": 0.75 }, "W"], ["信仰之力", { "rsc:4:skill": 0.7 }, "W"], ["十字軍之盾", { "rsc:1:dmgTaken": 0.002, "rsc:1:armorp": 0.6 }, "D"]],
    [["盾擊", { "sk:gcross:more": 0.25, armorp: 30 }, "E"], ["挑釁大師", { tntVul: 0.2, "sk:taunt:cd": 0.3 }, "W"], ["自我犧牲", { minDmg: 0.3, "sk:guard:minion": 1 }, "W"]],
    [["不動如山", { dmgTaken: 0.2, more: { life: 20 } }, "W"], ["鐵壁", { tntDmg: 0.15, "sk:taunt:area": 0.3 }, "W"], ["荊棘之心", { armDmg: 0.015, thorn: 1, more: { dmg: -50 } }, "P"]],
    [["神聖之盾", { h_undead: 0.3, res_shadow: 20 }, "D"], ["信仰", { lifep: 15, res_all: 8 }, "W"], ["聖光審判", { "tg:spell:dmg": 0.15, roElHit_shk: 0.12 }, "L"]],
    [["神聖十字", { boss: 0.22, "sk:gcross:area": 0.2 }, "E"], ["堅守陣地", { roBossDR: 0.25, h_stand: 0.15 }, "D"], ["審判之槍", { fullCrit: 1, critm: 20 }, "W"]],
    [["鋼鐵意志", { h_castdr: 0.2, armorp: 25 }, "D"], ["治癒之光", { regenPct: 0.006, lokp: 0.01 }, "W"], ["殉道者", { h_cheat: 0.4 }, "L"]],
    [["體質之極", { "rscm:1:dmg": 0.4 }, "W"], ["不滅堡壘", { tntVul: 0.2, dmgTaken: 0.08 }, "W"], ["聖十字奧義", { "nth:gcross": 1.2, "sk:gcross:cd": 0.15 }, "E"]],
  ],
  ro_sword_2: [
    [["雙手劍專精", { "rsc:0:dmgp": 0.85 }, "W"], ["劍舞步法", { "rsc:2:aspd": 0.4 }, "W"], ["劍領體魄", { "rsc:1:lifep": 0.45, "rsc:1:evap": 0.3 }, "D"]],
    [["劍刃風暴", { "sk:whirl:more": 0.25, area: 15 }, "E"], ["連斬節奏", { roCritHaste: 0.2, crit: 5 }, "W"], ["雙手劍加速", { aspd: 15, cdr: 5 }, "W"]],
    [["劍風亂舞", { momDbl: 0.25 }, "P"], ["騎士之魂", { momDR: 0.01 }, "W"], ["流水", { momDmg: 0.03 }, "W"]],
    [["火焰劍", { "sk:swave:el:brn": 1, brn: 40 }, "E"], ["雷光劍", { roElHit_shk: 0.15, h_ail: 0.05 }, "L"], ["劍氣", { v5pBolt: 0.06, dmgp: 10 }, "L"]],
    [["劍領之威", { boss: 0.25, h_close: 0.05 }, "D"], ["越戰越勇・劍", { h_ramp: 0.032 }, "L"], ["一擊必殺", { h_first: 0.4, exec: 0.3 }, "L"]],
    [["劍之屏障", { dmgTaken: 0.1, momDR: 0.005 }, "W"], ["嗜血", { leech: 0.015, lokp: 0.02 }, "W"], ["疾風步", { graze: 0.25, evap: 30, move: 10 }, "W"]],
    [["螺旋奧義", { "nth:swave": 1.3, "sk:swave:extra": 1 }, "E"], ["無限氣勢", { momMax: 5, momDmg: 0.01 }, "P"], ["劍領之道", { "rscm:0:dmg": 0.2, "rsc:2:aspd": 0.3 }, "W"]],
  ],
  ro_sword_3: [
    [["盧恩力量", { "rsc:0:dmgp": 0.75, "rsc:0:ail": 0.004 }, "P"], ["盧恩智慧", { "rsc:4:skill": 0.65 }, "W"], ["盧恩體魄", { "rsc:1:lifep": 0.5, "rsc:1:res_all": 0.15 }, "D"]],
    [["盧恩共振", { h_echo: 0.15, "tg:elem:dmg": 0.04 }, "L"], ["盧恩刻印", { "tg:elem:dmg": 0.15, cdr: 5 }, "W"], ["龍之吐息", { "sk:frostsl:more": 0.3, "sk:frostsl:area": 0.15 }, "E"]],
    [["盧恩大師", { ail: 0.4 }, "W"], ["餘燼", { ember: 1 }, "P"], ["嚴寒", { chlVul: 0.15 }, "W"]],
    [["火焰盧恩", { "sk:ignite:more": 0.2, brn: 40 }, "E"], ["冰霜盧恩", { "sk:frostsl:el:chl": 1, chlVul: 0.08 }, "E"], ["元素交響・盧恩", { h_ail: 0.1, ail: 0.2 }, "L"]],
    [["屠龍者", { boss: 0.25, res_fire: 15 }, "D"], ["盧恩護甲", { roBossDR: 0.2, armorp: 30 }, "W"], ["盧恩爆發", { h_op: 0.8 }, "D"]],
    [["盧恩之盾", { dmgTaken: 0.12, res_all: 8 }, "W"], ["生命盧恩", { regenPct: 0.006, lifep: 10 }, "W"], ["結界盧恩", { h_ward: 0.03 }, "E"]],
    [["力量之極・盧恩", { "rscm:0:dmg": 0.38, "rsc:0:ail": 0.002 }, "W"], ["元素支配", { ail: 0.3, chlVul: 0.1, ember: 0.5 }, "P"], ["盧恩之道", { "rscm:0:dmg": 0.15, "rsc:4:skill": 0.5, cdr: 5 }, "W"]],
  ],
  ro_bow_0: [
    [["弓術專精", { "rsc:5:skill": 0.45, "rsc:5:cdr": 0.09 }, "W"], ["獵人敏捷", { "rsc:2:aspd": 0.42 }, "W"], ["鷹之眼", { "rsc:5:crit": 0.06, "rsc:5:critm": 0.5 }, "D"]],
    [["二連矢", { "sk:pierce:extra": 1, "sk:pierce:more": 0.1 }, "E"], ["鷹眼凝視", { crit: 6, critm: 25 }, "W"], ["獵人步伐", { roCritHaste: 0.2, move: 10 }, "W"]],
    [["致命一擊", { fullCrit: 1 }, "W"], ["處刑", { exec: 0.5 }, "W"], ["獵殺", { boss: 0.2, h_frenzy: 0.08 }, "D"]],
    [["火焰箭頭", { roElHit_brn: 0.15, brn: 45 }, "W"], ["冰凍箭頭", { roElHit_chl: 0.15, h_far: 0.08 }, "D"], ["閃電箭頭", { roElHit_shk: 0.15, v5pBolt: 0.04 }, "L"]],
    [["狩獵印記", { boss: 0.25, h_lucky: 0.03 }, "D"], ["遠距狙擊", { h_far: 0.25 }, "D"], ["處刑射擊", { exec: 0.35, crit: 4 }, "W"]],
    [["迴避射擊", { evap: 40, graze: 0.15 }, "W"], ["獵人之心", { lokp: 0.02, leech: 0.01 }, "W"], ["偽裝", { h_moving: 0.2, move: 15 }, "D"]],
    [["箭雨奧義", { "sk:rain:extra": 1, "sk:rain:area": 0.25 }, "E"], ["絕殺", { critm: 40, boss: 0.1 }, "W"], ["獵人之道", { "rscm:5:dmg": 0.25, "rsc:2:aspd": 0.25 }, "W"]],
  ],
  ro_bow_1: [
    [["毒箭專精", { "rsc:5:skill": 0.35, "rsc:5:psn": 0.8 }, "P"], ["遊俠幸運", { "rsc:3:crit": 0.08, "rsc:3:psn": 0.4 }, "W"], ["荒野體魄", { "rsc:1:lifep": 0.4, "rsc:1:res_poison": 0.4 }, "D"]],
    [["毒素精通", { psn: 40, "sk:varrow:more": 0.15 }, "E"], ["連續射擊", { "nth:varrow": 0.9, "sk:varrow:proj": 1 }, "E"], ["弱點標記", { crsVul: 0.08, crs: 0.2 }, "W"]],
    [["瘟疫", { psnSpread: 0.75 }, "P"], ["腐蝕", { psnVul: 0.25 }, "W"], ["毒刃", { psnHit: 0.4 }, "W"]],
    [["劇毒", { psnVul: 0.12, psn: 30, h_ail: 0.03 }, "L"], ["毒雲擴散", { "sk:rain:el:chl": 1, psn: 20 }, "E"], ["冰毒", { roElHit_chl: 0.12, psnVul: 0.08 }, "D"]],
    [["毒獵", { boss: 0.22, psn: 15 }, "W"], ["慢性毒殺", { h_ramp: 0.028, psnRate: 0.15 }, "L"], ["遊俠之眼", { fullCrit: 1, critm: 18, psn: 10 }, "W"]],
    [["遊俠之風", { evap: 30, graze: 0.2 }, "W"], ["吸取毒素", { leech: 0.015, res_poison: 30 }, "D"], ["荒野求生", { h_lowhpdr: 0.2, regenPct: 0.003 }, "D"]],
    [["萬毒歸宗", { psnMax: 2, psnRate: 0.25 }, "P"], ["毒王", { more: { dmg: 20 }, psnVul: 0.1 }, "P"], ["遊俠之道", { "rscm:5:dmg": 0.2, "rsc:3:crit": 0.06 }, "W"]],
  ],
  ro_bow_2: [
    [["神射專精", { "rsc:5:skill": 0.5, "rsc:5:cdr": 0.05 }, "W"], ["陷阱智慧", { "rsc:4:skill": 0.55, "rsc:4:gndT": 0.006 }, "E"], ["神射體魄", { "rsc:1:lifep": 0.5, "rsc:1:evap": 0.4 }, "D"]],
    [["陷阱大師", { "sk:trap:more": 0.25, area: 15 }, "E"], ["定位強化", { "sk:trap:cd": 0.2, trapEva: 4 }, "W"], ["精準射擊", { crit: 6, critm: 28, "sk:pierce:more": 0.1 }, "W"]],
    [["超越極限", { critEva: 1 }, "P"], ["遊擊", { critShd: 0.01 }, "L"], ["閃身", { more: { eva: 100 } }, "W"]],
    [["爆炸陷阱", { "sk:trap:el:brn": 1, v5pBlast: 0.06 }, "E"], ["冰凍陷阱", { "sk:trap:el:chl": 1, chlVul: 0.1 }, "E"], ["閃光陷阱", { roElHit_shk: 0.15, h_ail: 0.04, trapEva: 2 }, "L"]],
    [["狩獵陷阱", { boss: 0.25, "sk:trap:area": 0.1 }, "E"], ["伏擊", { h_first: 0.55 }, "L"], ["越戰越勇・陷阱", { h_ramp: 0.03, trapMax: 1 }, "L"]],
    [["閃避本能", { evap: 40, graze: 0.18 }, "W"], ["生存專家", { lokp: 0.02, h_killshd: 0.02 }, "D"], ["神射不倒", { h_cheat: 0.3, evap: 15 }, "L"]],
    [["陷阱奧義", { "nth:trap": 1.2, trapMax: 1 }, "E"], ["幻影獵手", { critShd: 0.01, trapMax: 1, gndT: 0.3 }, "P"], ["神射之道", { "rscm:5:dmg": 0.22, "rsc:4:skill": 0.4 }, "W"]],
  ],
  ro_bow_3: [
    [["樂器專精", { "rsc:5:minp": 1.2 }, "W"], ["詩人智慧", { "rsc:4:skill": 0.5, "rsc:4:minAs": 0.003 }, "E"], ["詩人體魄", { "rsc:1:lifep": 0.5, "rsc:1:minGuard": 0.0006 }, "D"]],
    [["合奏", { minAs: 0.2, minp: 20 }, "W"], ["樂章共鳴", { skToMin: 0.5 }, "P"], ["高音", { minCrit: 1, critm: 35, minp: 5 }, "L"]],
    [["合奏樂團", { minion: 1, minDmg: 0.2 }, "W"], ["安魂曲", { minGuard: 0.04 }, "W"], ["安可", { minion: 1, "sk:dissonance:cd": 0.15 }, "E"]],
    [["冰之曲", { roElHit_chl: 0.15, minAil: 0.3 }, "W"], ["戰歌", { roElHit_brn: 0.12, minAil: 0.25, minp: 10 }, "W"], ["雷鳴樂章", { roElHit_shk: 0.15, minAil: 0.35 }, "L"]],
    [["英雄敘事詩", { boss: 0.25, minp: 5 }, "W"], ["漸強", { h_ramp: 0.031 }, "L"], ["不協和音", { "sk:dissonance:more": 0.4, crsVul: 0.05 }, "E"]],
    [["搖籃曲", { dmgTaken: 0.1, h_minshd: 0.002 }, "D"], ["旋律護盾", { h_killshd: 0.03, lifep: 10 }, "L"], ["舞者步伐", { graze: 0.25, evap: 30, move: 12 }, "W"]],
    [["靈巧之極", { "rsc:5:minp": 1.0, "rsc:5:minAs": 0.002 }, "W"], ["交響指揮", { minion: 1, minDmg: 0.25 }, "W"], ["詩人之道", { "rsc:5:minp": 0.5, "rsc:4:skill": 0.5, minion: 1 }, "W"]],
  ],
  ro_mage_0: [
    [["元素智力", { "rsc:4:skill": 0.8 }, "W"], ["法術靈巧", { "rsc:5:skill": 0.3, "rsc:5:cdr": 0.06 }, "W"], ["魔力屏障", { "rsc:4:res_all": 0.12, "rsc:1:lifep": 0.4 }, "D"]],
    [["快速詠唱", { cdr: 10, "tg:spell:dmg": 0.05 }, "W"], ["雙重施法", { h_echo: 0.15 }, "L"], ["連鎖精通", { "sk:chain:chn": 2, "sk:chain:more": 0.15 }, "E"]],
    [["元素大師", { ail: 0.4, "tg:elem:dmg": 0.05 }, "W"], ["火焰餘燼", { ember: 1, brn: 20 }, "P"], ["極寒", { chlVul: 0.15, "sk:nova:area": 0.15 }, "E"]],
    [["火焰精通", { "sk:fire:more": 0.1, brn: 40 }, "E"], ["冰霜精通", { "sk:nova:more": 0.2, chlVul: 0.06 }, "E"], ["元素交響・巫師", { h_ail: 0.1, ail: 0.15 }, "L"]],
    [["魔法破壞", { boss: 0.2, "tg:spell:dmg": 0.03 }, "W"], ["魔力湧動", { h_ramp: 0.029, cdr: 3 }, "L"], ["元素爆發", { h_first: 0.4, area: 10 }, "L"]],
    [["魔法護盾", { h_ward: 0.025, res_all: 6 }, "E"], ["魔力吸取", { h_killshd: 0.03, regenPct: 0.003 }, "D"], ["瞬間移動", { graze: 0.25, move: 15 }, "W"]],
    [["元素奧義", { "nth:fire": 0.8, "nth:nova": 0.8 }, "E"], ["元素支配・巫師", { ail: 0.35, chlVul: 0.12 }, "P"], ["巫師之道", { "rscm:4:dmg": 0.25, "rsc:5:cdr": 0.05 }, "W"]],
  ],
  ro_mage_1: [
    [["精靈智慧", { "rsc:4:minp": 1.2 }, "W"], ["賢者靈巧", { "rsc:5:skill": 0.35, "rsc:5:minAs": 0.002 }, "E"], ["賢者體魄", { "rsc:1:lifep": 0.5, "rsc:4:minGuard": 0.0004 }, "D"]],
    [["精靈之翼", { minAs: 0.25, minp: 15 }, "W"], ["賢者之書", { skToMin: 0.6 }, "P"], ["元素連結", { minCrit: 1, critm: 30 }, "L"]],
    [["精靈軍團", { minion: 1, minDmg: 0.18 }, "W"], ["守護之靈", { minGuard: 0.045 }, "W"], ["召喚大軍", { minion: 1, "sk:summon:cd": 0.2 }, "E"]],
    [["火精靈", { roElHit_brn: 0.15, minAil: 0.3 }, "W"], ["水精靈", { roElHit_chl: 0.15, minAil: 0.28, chlVul: 0.04 }, "W"], ["風精靈", { roElHit_shk: 0.14, minAil: 0.3, minAs: 0.05 }, "W"]],
    [["大魔法", { boss: 0.24, "sk:bliz:more": 0.1 }, "E"], ["精靈之潮", { h_ramp: 0.03, minAs: 0.05 }, "L"], ["賢者之眼", { fullCrit: 1, critm: 20, minp: 5 }, "W"]],
    [["魔法屏障", { dmgTaken: 0.1, h_minshd: 0.0022 }, "D"], ["精靈庇護", { h_killshd: 0.03, lifep: 12 }, "L"], ["空間轉移", { graze: 0.22, move: 15, evap: 10 }, "W"]],
    [["智力之極・賢者", { "rsc:4:minp": 1.0, "rsc:4:minAs": 0.002 }, "W"], ["精靈統帥", { minion: 1, minDmg: 0.22 }, "W"], ["賢者之道", { "rsc:4:minp": 0.5, "rsc:5:skill": 0.3, minion: 1 }, "W"]],
  ],
  ro_mage_2: [
    [["禁咒智力", { "rsc:4:skill": 0.85, "rsc:4:crs": 0.002 }, "P"], ["咒術幸運", { "rsc:3:crit": 0.08, "rsc:3:critm": 0.4 }, "W"], ["暗影體魄", { "rsc:1:lifep": 0.45, "rsc:1:res_shadow": 0.4 }, "D"]],
    [["詛咒蔓延", { crs: 0.25, area: 10 }, "W"], ["惡毒詠唱", { "nth:cwk": 1.2, "sk:cvul:cd": 0.15 }, "E"], ["禁咒研究", { crsVul: 0.08 }, "W"]],
    [["末日", { crsSpread: 2 }, "P"], ["厄運", { crs: 0.35 }, "W"], ["怨念", { crs: 0.25, roHexPulse: 0.9 }, "P"]],
    [["毒霧", { "sk:miasma:more": 0.25, psnVul: 0.08 }, "E"], ["暗影侵蝕", { h_ail: 0.1, crs: 0.15 }, "L"], ["凍結詛咒", { roElHit_chl: 0.15, chlVul: 0.1 }, "W"]],
    [["厄運降臨", { boss: 0.25, crs: 0.05 }, "W"], ["慢性詛咒", { h_ramp: 0.028, crsVul: 0.02 }, "L"], ["靈魂收割", { exec: 0.5, h_frenzy: 0.05 }, "D"]],
    [["暗影護盾", { dmgTaken: 0.12, res_shadow: 20 }, "W"], ["生命虹吸", { leech: 0.015, lokp: 0.015 }, "D"], ["詛咒反噬", { h_pain: 0.2, h_lowhpdr: 0.1 }, "D"]],
    [["智力之極・咒術", { "rscm:4:dmg": 0.4 }, "W"], ["咒王", { crs: 0.25, roHexPulse: 0.6 }, "P"], ["咒術之道", { "rscm:4:dmg": 0.2, "rsc:3:crit": 0.06, "rsc:3:critm": 0.3 }, "W"]],
  ],
  ro_mage_3: [
    [["大法師智力", { "rsc:4:skill": 0.88, "rsc:4:crit": 0.02 }, "W"], ["魔力幸運", { "rsc:3:crit": 0.1, "rsc:3:critm": 0.5 }, "D"], ["秘銀體魄", { "rsc:1:lifep": 0.55 }, "W"]],
    [["魔力增幅", { "tg:spell:dmg": 0.1 }, "W"], ["隕石雙發", { "nth:meteor": 1.0, "sk:meteor:area": 0.15 }, "E"], ["魔力暴走", { roCritHaste: 0.2, crit: 5, cdr: 5 }, "W"]],
    [["審判之光", { fullCrit: 1, crit: 3 }, "W"], ["處刑魔法", { exec: 0.55 }, "W"], ["大魔導", { boss: 0.2, "tg:elem:dmg": 0.05 }, "W"]],
    [["隕石強化", { roElHit_brn: 0.15, "sk:meteor:more": 0.15 }, "E"], ["絕對零度", { "sk:bliz:el:chl": 1, chlVul: 0.12 }, "E"], ["雷暴", { roElHit_shk: 0.15, v5pBolt: 0.05 }, "L"]],
    [["大法師之威", { boss: 0.22 }, "W"], ["元素爆發・大法師", { h_first: 0.5, crit: 2 }, "L"], ["魔力超載", { h_op: 1.0 }, "D"]],
    [["秘銀護盾", { dmgTaken: 0.12, res_all: 8, armorp: 10 }, "W"], ["魔力汲取", { h_killshd: 0.025, regenPct: 0.004 }, "D"], ["閃現", { graze: 0.25, move: 15, evap: 5 }, "W"]],
    [["智力之極・大法師", { "rscm:4:dmg": 0.36 }, "W"], ["絕殺魔法", { critm: 40, boss: 0.1, crit: 2 }, "W"], ["大法師之道", { "rscm:4:dmg": 0.2, "rsc:3:crit": 0.05, "rsc:3:critm": 0.35 }, "W"]],
  ],
  ro_thief_0: [
    [["卡塔爾敏捷", { "rsc:2:aspd": 0.55, "rsc:2:psn": 0.3 }, "W"], ["致命幸運", { "rsc:3:crit": 0.09, "rsc:3:psnHit": 0.002 }, "P"], ["影步體魄", { "rsc:2:evap": 0.5, "rsc:1:lifep": 0.4 }, "D"]],
    [["毒刃連擊", { "sk:venom:extra": 1, psn: 20 }, "E"], ["暗殺", { h_first: 0.5, crit: 3 }, "L"], ["致命塗毒", { "nth:envenom": 1.0, psnHit: 0.1 }, "E"]],
    [["連鎖毒爆", { psnSpread: 0.9 }, "P"], ["蝕骨", { psnVul: 0.22, psnHit: 0.05 }, "W"], ["淬毒刀刃", { psnHit: 0.35, psn: 15 }, "W"]],
    [["劇毒刺客", { psnVul: 0.14, psn: 35 }, "W"], ["毒霧瀰漫", { "sk:miasma:area": 0.25, "sk:miasma:more": 0.15 }, "E"], ["冰毒刃", { roElHit_chl: 0.12, h_ail: 0.06 }, "L"]],
    [["暗殺契約", { boss: 0.2, h_healthy: 0.25 }, "D"], ["慢性毒刃", { h_ramp: 0.027, psnRate: 0.1 }, "L"], ["割喉", { exec: 0.45, h_close: 0.08 }, "D"]],
    [["隱匿", { graze: 0.25, evap: 30, h_moving: 0.1 }, "W"], ["毒素回流", { lokp: 0.025, res_poison: 25 }, "D"], ["暗影殘像", { h_killshd: 0.03, move: 10 }, "L"]],
    [["毒神", { psnMax: 3, psnRate: 0.15 }, "P"], ["連環暗殺", { h_reset: 0.15, exec: 0.2 }, "D"], ["刺客之道", { "rscm:2:dmg": 0.25, "rsc:3:crit": 0.05 }, "W"]],
  ],
  ro_thief_1: [
    [["流氓敏捷", { "rsc:2:evap": 0.8, "rsc:2:aspd": 0.3 }, "W"], ["神偷靈巧", { "rsc:5:skill": 0.4, "rsc:5:crit": 0.04 }, "P"], ["街頭體魄", { "rsc:1:lifep": 0.5, "rsc:2:graze": 0.0015 }, "D"]],
    [["背刺精通", { "sk:backstab:more": 0.3 }, "E"], ["偷襲", { h_first: 0.45, h_moving: 0.1 }, "L"], ["雙刀連擊", { aspd: 12, h_killcd: 0.3 }, "W"]],
    [["影之極限", { critEva: 1, aspd: 5 }, "P"], ["遊擊戰術", { critShd: 0.012 }, "L"], ["鬼影", { more: { eva: 90 }, graze: 0.05 }, "W"]],
    [["淬毒短劍", { psnHit: 0.25, psn: 30, psnVul: 0.08 }, "W"], ["暗影之刃", { h_ail: 0.08, roElHit_chl: 0.1 }, "L"], ["閃光彈", { roElHit_shk: 0.15, h_castdr: 0.1 }, "D"]],
    [["盜賊之王", { boss: 0.22, crit: 4 }, "W"], ["纏鬥", { h_ramp: 0.026, evap: 15 }, "L"], ["致命要害", { fullCrit: 1, critm: 15, move: 5 }, "W"]],
    [["殘影步", { evap: 45, h_moving: 0.12 }, "W"], ["偷竊", { lokp: 0.02, pot: 40 }, "W"], ["脫逃術", { h_cheat: 0.3, move: 12 }, "L"]],
    [["影縛陷阱", { critShd: 0.008, trapMax: 2, gndT: 0.4 }, "P"], ["背刺奧義", { "nth:backstab": 1.5, h_close: 0.1 }, "E"], ["流氓之道", { "rscm:2:dmg": 0.22, "rsc:5:skill": 0.3, "rsc:5:cdr": 0.04 }, "W"]],
  ],
  ro_thief_2: [
    [["音速敏捷", { "rsc:2:aspd": 0.45, "rsc:2:crit": 0.03 }, "W"], ["十字力量", { "rsc:0:dmgp": 0.8, "rsc:0:leech": 0.0002 }, "P"], ["暗殺者體魄", { "rsc:1:lifep": 0.45, "rsc:2:graze": 0.001 }, "D"]],
    [["音速連打", { "sk:sonic:more": 0.25, aspd: 8 }, "E"], ["影子分身", { h_echo: 0.12, aspd: 6 }, "L"], ["殺戮節奏", { h_killcd: 0.4 }, "D"]],
    [["無盡雙劍", { momDbl: 0.22, crit: 3 }, "P"], ["殘影護體", { momDR: 0.012 }, "W"], ["流水連斬", { momDmg: 0.028, aspd: 4 }, "W"]],
    [["劇毒卡塔爾", { psnVul: 0.12, psnHit: 0.2, psn: 30 }, "W"], ["暗影突襲", { h_first: 0.3, roElHit_chl: 0.1 }, "L"], ["瞬雷", { roElHit_shk: 0.12, "sk:blink:more": 0.3 }, "E"]],
    [["靈魂破壞", { boss: 0.24, momDmg: 0.003 }, "W"], ["殺意漸濃", { h_ramp: 0.025, h_frenzy: 0.05 }, "L"], ["處決", { exec: 0.4, h_reset: 0.05 }, "D"]],
    [["殘影", { dmgTaken: 0.08, momDR: 0.006, evap: 10 }, "W"], ["血刃", { leech: 0.018, h_frenzy: 0.04 }, "D"], ["影遁", { graze: 0.3, move: 12 }, "W"]],
    [["殺戮之舞", { momMax: 4, momDmg: 0.012, momDR: 0.002 }, "P"], ["音速奧義", { "nth:sonic": 1.2, "sk:sonic:extra": 1 }, "E"], ["十字刺客之道", { "rscm:2:dmg": 0.2, "rsc:0:dmgp": 0.5 }, "W"]],
  ],
  ro_thief_3: [
    [["魅影敏捷", { "rsc:2:aspd": 0.4, "rsc:2:crs": 0.0015 }, "W"], ["暗咒智力", { "rsc:4:skill": 0.7, "rsc:4:crs": 0.002 }, "P"], ["幻影體魄", { "rsc:1:lifep": 0.5, "rsc:2:evap": 0.3 }, "D"]],
    [["暗影之舞", { roCritHaste: 0.25, evap: 15 }, "W"], ["詛咒之刃", { crsVul: 0.07, aspd: 6 }, "W"], ["鏡像詛咒", { "nth:cwk": 1.0, "sk:cvul:area": 0.3 }, "E"]],
    [["禍延", { crsSpread: 3 }, "P"], ["厄運纏身", { crs: 0.3, crsVul: 0.03 }, "W"], ["怨靈", { crs: 0.2, roHexPulse: 1.0 }, "P"]],
    [["影蝕", { h_ail: 0.09, crs: 0.12 }, "L"], ["幻毒", { psnVul: 0.15, psn: 30 }, "W"], ["冰霜之觸", { roElHit_chl: 0.12, chlVul: 0.08, h_close: 0.05 }, "D"]],
    [["魅影獵殺", { boss: 0.22, crs: 0.08 }, "W"], ["暗中觀察", { h_healthy: 0.3 }, "D"], ["魂之收割", { exec: 0.4, lokp: 0.015 }, "D"]],
    [["暗影斗篷", { graze: 0.2, evap: 35, res_shadow: 15 }, "W"], ["暗影汲取", { leech: 0.01, h_killshd: 0.02 }, "D"], ["替身術", { h_cheat: 0.35, evap: 10 }, "L"]],
    [["夢魘", { crs: 0.2, roHexPulse: 0.8, crsSpread: 1 }, "P"], ["影咒奧義", { "nth:backstab": 1.2, crsVul: 0.04 }, "E"], ["魅影之道", { "rscm:2:dmg": 0.2, "rsc:4:skill": 0.4, "rsc:4:crs": 0.001 }, "W"]],
  ],
  ro_acolyte_0: [
    [["聖光智力", { "rsc:4:skill": 0.75, "rsc:4:res_shadow": 0.1 }, "W"], ["信仰體魄", { "rsc:1:lifep": 0.5, "rsc:1:regenPct": 0.00004 }, "D"], ["祈禱幸運", { "rsc:3:crit": 0.1, "rsc:3:critm": 0.3 }, "P"]],
    [["神聖之光精通", { "sk:holy:more": 0.25, cdr: 5 }, "E"], ["天使之賜福", { h_echo: 0.14, "tg:spell:dmg": 0.04 }, "L"], ["聖光彈幕", { "sk:holy:extra": 1 }, "E"]],
    [["神聖審判", { fullCrit: 1, h_undead: 0.1 }, "W"], ["驅魔之刃", { exec: 0.45, res_shadow: 10 }, "W"], ["神罰", { boss: 0.22, "sk:holy:area": 0.1 }, "W"]],
    [["驅魔", { h_undead: 0.35, res_shadow: 20 }, "D"], ["神聖光輝", { roElHit_shk: 0.12, v5pBolt: 0.06 }, "L"], ["淨化", { h_ail: 0.08, roElHit_brn: 0.1 }, "L"]],
    [["審判", { boss: 0.22, h_op: 0.3 }, "D"], ["神聖之怒", { h_ramp: 0.03, cdr: 4 }, "L"], ["天罰", { h_lucky: 0.04, critm: 15 }, "D"]],
    [["天使之護", { dmgTaken: 0.1, h_castdr: 0.1 }, "D"], ["聖光治癒", { regenPct: 0.007, pot: 20 }, "W"], ["復活", { h_cheat: 0.35, lifep: 10 }, "L"]],
    [["聖光奧義", { "nth:holy": 0.9, "sk:holy:proj": 1 }, "E"], ["聖域行者", { "sk:sanctuary:more": 0.5, "sk:sanctuary:area": 0.3, regenPct: 0.004 }, "E"], ["祭司之道", { "rscm:4:dmg": 0.22, "rsc:1:lifep": 0.3, "sk:heal:more": 0.3 }, "W"]],
  ],
  ro_acolyte_1: [
    [["武僧力量", { "rsc:0:dmgp": 0.8, "rsc:0:armorp": 0.3 }, "W"], ["武僧敏捷", { "rsc:2:aspd": 0.5, "rsc:2:roBasicCd": 0.0005 }, "P"], ["金剛體魄", { "rsc:1:lifep": 0.6, "rsc:1:dmgTaken": 0.001 }, "D"]],
    [["連打掌精通", { "sk:combo:more": 0.25, aspd: 8 }, "E"], ["氣功", { crit: 6, critm: 20, momDmg: 0.005 }, "W"], ["三段掌", { "nth:combo": 1.0, roBasicCd: 0.1 }, "E"]],
    [["爆氣", { momDbl: 0.28 }, "P"], ["金剛不壞", { momDR: 0.011, armorp: 10 }, "W"], ["氣功循環", { momDmg: 0.032 }, "W"]],
    [["氣彈", { v5pBolt: 0.07, "sk:palm:more": 0.1 }, "L"], ["金剛", { h_ail: 0.05, roElHit_shk: 0.14, armorp: 10 }, "L"], ["火龍氣", { roElHit_brn: 0.13, brn: 30, h_close: 0.05 }, "W"]],
    [["阿修羅", { boss: 0.2, "sk:asura:more": 0.2 }, "E"], ["連段氣勢", { h_ramp: 0.024, momDmg: 0.005 }, "L"], ["點穴", { h_healthy: 0.2, exec: 0.2 }, "D"]],
    [["金鐘罩", { dmgTaken: 0.1, armorp: 20, momDR: 0.003 }, "W"], ["氣血循環", { leech: 0.016, regenPct: 0.002 }, "W"], ["殘影拳", { graze: 0.2, evap: 25, h_moving: 0.08 }, "D"]],
    [["百裂拳意", { momMax: 6, momDbl: 0.05 }, "P"], ["阿修羅奧義", { "nth:asura": 1.5, "sk:asura:cd": 0.15 }, "E"], ["武僧之道", { "rscm:0:dmg": 0.2, "rsc:2:aspd": 0.3, "rsc:0:dmgp": 0.2 }, "W"]],
  ],
  ro_acolyte_2: [
    [["神官智力", { "rsc:4:minp": 1.1, "rsc:4:minAs": 0.001 }, "W"], ["神官體魄", { "rsc:1:lifep": 0.5, "rsc:1:minGuard": 0.0005 }, "D"], ["祈福幸運", { "rsc:3:crit": 0.06, "rsc:3:minp": 0.4 }, "P"]],
    [["天使之翼", { minAs: 0.22, minp: 20 }, "W"], ["聖靈共鳴", { skToMin: 0.7 }, "P"], ["神聖連結", { minCrit: 1, critm: 25, crit: 3 }, "L"]],
    [["天使軍團", { minion: 1, minDmg: 0.2, minAs: 0.05 }, "W"], ["守護天使", { minGuard: 0.04, regenPct: 0.001 }, "W"], ["聖靈降臨", { minion: 1, "sk:angel:cd": 0.15 }, "E"]],
    [["聖光天使", { h_undead: 0.35, minAil: 0.3 }, "D"], ["雷光天使", { roElHit_shk: 0.15, minAil: 0.3 }, "W"], ["炎之天使", { roElHit_brn: 0.15, minAil: 0.25, brn: 20 }, "W"]],
    [["神之審判", { boss: 0.25, minp: 10 }, "W"], ["聖歌漸強", { h_ramp: 0.03, minAs: 0.04 }, "L"], ["天之懲戒", { exec: 0.4, minp: 10 }, "D"]],
    [["天使之盾", { dmgTaken: 0.08, h_minshd: 0.0025 }, "W"], ["治癒祈禱", { regenPct: 0.005, "sk:heal:more": 0.25, lifep: 8 }, "W"], ["聖母之愛", { h_cheat: 0.4, minGuard: 0.01 }, "L"]],
    [["智力之極・神官", { "rsc:4:minp": 1.5, "rsc:4:minAs": 0.003 }, "W"], ["天使統帥", { minion: 1, minDmg: 0.4 }, "P"], ["神官之道", { "rsc:4:minp": 0.9, "rsc:1:lifep": 0.5, minion: 1 }, "W"]],
  ],
  ro_acolyte_3: [
    [["修羅力量", { "rsc:0:dmgp": 0.85, "rsc:0:leech": 0.0001 }, "P"], ["修羅體魄", { "rsc:1:lifep": 0.6, "rsc:1:lowhp": 0.0004 }, "D"], ["戰意幸運", { "rsc:3:crit": 0.07, "rsc:3:lokp": 0.0003 }, "W"]],
    [["虎砲精通", { "sk:tiger:more": 0.3, area: 10 }, "E"], ["連段", { roBasicCd: 0.2, "sk:palm:cd": 0.1 }, "W"], ["捨身", { roBloodCast: 0.03, more: { skill: 25 } }, "P"]],
    [["修羅血怒", { rage: 1, more: { dmg: 50 }, leech: 0.018 }, "P"], ["殺意渴望", { lokp: 0.035 }, "W"], ["修羅嗜血", { leech: 0.022, "sk:tiger:area": 0.1 }, "W"]],
    [["修羅之火", { roElHit_brn: 0.15, brn: 30, lowhp: 0.01 }, "W"], ["氣爆", { v5pBlast: 0.09, area: 8 }, "L"], ["血脈暴走", { h_ail: 0.07, h_pain: 0.08 }, "L"]],
    [["阿修羅霸凰", { boss: 0.25, "sk:asura:more": 0.1 }, "E"], ["殺戮狂潮", { h_frenzy: 0.1, h_ramp: 0.015 }, "L"], ["霸凰一擊", { h_first: 0.35, h_op: 0.4 }, "D"]],
    [["鋼鐵之軀", { dmgTaken: 0.1, armorp: 35, lifep: 5 }, "W"], ["血之渴望", { leech: 0.01, lokp: 0.025 }, "D"], ["修羅不死", { h_cheat: 0.3, lowhp: 0.01 }, "D"]],
    [["修羅道", { lowhp: 0.06, h_pain: 0.1 }, "P"], ["虎砲奧義", { "nth:tiger": 1.5, "sk:tiger:area": 0.2 }, "E"], ["修羅之道", { "rscm:0:dmg": 0.22, "rsc:1:lifep": 0.35 }, "W"]],
  ],
  ro_merchant_0: [
    [["鍛造力量", { "rsc:0:dmgp": 0.7, "rsc:0:armorp": 0.5 }, "W"], ["鐵匠體魄", { "rsc:1:lifep": 0.6, "rsc:1:armorp": 0.5 }, "D"], ["商人幸運", { "rsc:3:crit": 0.06, "rsc:3:critm": 0.6 }, "P"]],
    [["手推車精通", { "sk:cart:more": 0.25, area: 10 }, "E"], ["武器強化", { dmgp: 15, crit: 3 }, "W"], ["金錢攻擊", { "sk:mammonite:more": 0.3, h_killcd: 0.2 }, "E"]],
    [["鋼鐵鑄身", { dmgTaken: 0.18, more: { life: 25 } }, "W"], ["鐵壁陣地", { tntDmg: 0.18, "sk:taunt:cd": 0.2 }, "W"], ["荊棘鎧", { armDmg: 0.016, thorn: 1, more: { dmg: -50 } }, "P"]],
    [["火焰鍛造", { roElHit_brn: 0.14, brn: 40, armorp: 10 }, "W"], ["淬火", { roElHit_chl: 0.15, armorp: 20 }, "W"], ["雷擊鍛造", { roElHit_shk: 0.15, "sk:mammonite:el:shk": 1 }, "E"]],
    [["神匠之斧", { boss: 0.22, armorp: 15 }, "W"], ["百鍛", { h_ramp: 0.028, armorp: 10 }, "L"], ["鐵砧之心", { roBossDR: 0.22, h_stand: 0.1 }, "D"]],
    [["鍛鐵之軀", { dmgTaken: 0.12, armorp: 25, lifep: 5 }, "W"], ["荊棘鎧甲", { armorp: 40, h_lowhpdr: 0.15 }, "D"], ["最後的財產", { h_cheat: 0.3, armorp: 15 }, "L"]],
    [["金錢萬能", { "nth:mammonite": 2.0, "sk:mammonite:area": 0.3 }, "E"], ["神匠", { tntVul: 0.25, tntDmg: 0.05 }, "W"], ["鐵匠之道", { "rscm:0:dmg": 0.2, "rsc:1:armorp": 0.6 }, "W"]],
  ],
  ro_merchant_1: [
    [["生命體智力", { "rsc:4:minp": 1.25 }, "W"], ["鍊金靈巧", { "rsc:5:minAs": 0.003, "rsc:5:skill": 0.2 }, "E"], ["鍊金體魄", { "rsc:1:lifep": 0.5, "rsc:1:pot": 0.5 }, "D"]],
    [["生命體強化", { minAs: 0.28, minp: 10 }, "W"], ["鍊金共鳴", { skToMin: 0.55, skill: 10 }, "P"], ["精準調配", { minCrit: 1, critm: 20, crit: 5 }, "L"]],
    [["生命體軍團", { minion: 1, minDmg: 0.21 }, "W"], ["生命體護衛", { minGuard: 0.042, armorp: 10 }, "W"], ["培育大師", { minion: 1, "sk:homun:cd": 0.2 }, "E"]],
    [["強酸", { psnVul: 0.15, minAil: 0.3 }, "W"], ["火焰瓶", { roElHit_brn: 0.15, minAil: 0.32, "sk:acid:more": 0.1 }, "E"], ["元素交響", { h_ail: 0.08, minAil: 0.3 }, "L"]],
    [["鍊金爆彈", { boss: 0.23, minp: 12 }, "W"], ["持續實驗", { h_ramp: 0.03, minp: 5 }, "L"], ["溶解", { exec: 0.35, psnVul: 0.05, minp: 8 }, "D"]],
    [["生命體之盾", { dmgTaken: 0.1, h_minshd: 0.0018, armorp: 5 }, "W"], ["藥水研究", { pot: 50, regenPct: 0.004 }, "W"], ["急救藥劑", { h_cheat: 0.3, pot: 20 }, "L"]],
    [["智力之極・鍊金", { "rsc:4:minp": 1.1, "rsc:4:minAs": 0.0025 }, "W"], ["生命體進化", { minion: 1, minDmg: 0.25, minAs: 0.05 }, "E"], ["鍊金之道", { "rsc:4:minp": 0.55, "rsc:5:skill": 0.3, minion: 1 }, "W"]],
  ],
  ro_merchant_2: [
    [["機匠靈巧", { "rsc:5:skill": 0.45, "rsc:5:minAs": 0.002 }, "W"], ["機匠力量", { "rsc:0:dmgp": 0.6, "rsc:0:lifep": 0.15 }, "W"], ["機甲體魄", { "rsc:1:lifep": 0.5, "rsc:1:armorp": 0.4 }, "D"]],
    [["砲台超載", { "sk:faw:more": 0.25, minAs: 0.15 }, "E"], ["自動瞄準", { crit: 6, critm: 22, h_far: 0.05 }, "W"], ["快速組裝", { cdr: 10, h_killcd: 0.2 }, "W"]],
    [["鎖定致命", { fullCrit: 1, h_far: 0.05 }, "W"], ["處刑模式", { exec: 0.5, crit: 2 }, "W"], ["攻城砲", { boss: 0.21, area: 5 }, "W"]],
    [["火焰砲彈", { roElHit_brn: 0.15, v5pBlast: 0.04 }, "L"], ["冷凍砲彈", { roElHit_chl: 0.14, chlVul: 0.1, "sk:faw:el:chl": 1 }, "E"], ["電磁砲", { roElHit_shk: 0.13, v5pBolt: 0.055 }, "L"]],
    [["攻城模式", { boss: 0.24, h_stand: 0.06 }, "D"], ["火力全開", { h_ramp: 0.032, cdr: 3 }, "L"], ["鎖定", { h_first: 0.5, h_far: 0.05 }, "L"]],
    [["機械裝甲", { dmgTaken: 0.11, armorp: 35 }, "W"], ["修理", { regenPct: 0.005, lokp: 0.012 }, "W"], ["緊急脫離", { h_cheat: 0.3, move: 8, armorp: 10 }, "L"]],
    [["砲台奧義", { "nth:faw": 1.2, "sk:faw:minion": 1 }, "E"], ["精密射控", { critm: 35, h_lucky: 0.03 }, "D"], ["機匠之道", { "rscm:5:dmg": 0.22, "rsc:0:dmgp": 0.4 }, "W"]],
  ],
  ro_merchant_3: [
    [["基因智力", { "rsc:4:skill": 0.75, "rsc:4:psn": 0.3 }, "P"], ["基因體魄", { "rsc:1:lifep": 0.55, "rsc:1:res_poison": 0.3 }, "D"], ["藥劑幸運", { "rsc:3:crit": 0.05, "rsc:3:psnHit": 0.0015 }, "W"]],
    [["強酸精通", { "sk:acid:more": 0.25, psn: 20 }, "E"], ["自動煉成", { h_echo: 0.13, psn: 15 }, "L"], ["毒雲瀰漫", { area: 20, psn: 20 }, "W"]],
    [["腐毒爆裂", { psnSpread: 0.55, psnVul: 0.05 }, "P"], ["基因腐蝕", { psnVul: 0.24 }, "W"], ["毒液塗佈", { psnHit: 0.38, "sk:acid:area": 0.1 }, "W"]],
    [["劇毒培養", { psnVul: 0.13, psn: 25 }, "W"], ["毒霧蔓延", { "sk:miasma:area": 0.2, psnRate: 0.1 }, "E"], ["酸蝕反應", { h_ail: 0.08, roElHit_chl: 0.08, psn: 10 }, "L"]],
    [["基因改造", { boss: 0.22, psnRate: 0.05 }, "W"], ["持續腐蝕", { h_ramp: 0.028, psn: 15 }, "L"], ["溶解處決", { exec: 0.45, psnVul: 0.04 }, "D"]],
    [["生物護甲", { dmgTaken: 0.12, res_poison: 30 }, "W"], ["強效藥劑", { pot: 60, regenPct: 0.003 }, "W"], ["基因再生", { h_cheat: 0.3, regenPct: 0.002 }, "L"]],
    [["毒素增殖", { psnMax: 2, psnSpread: 0.3 }, "P"], ["強酸奧義", { "nth:acid": 1.3, "sk:acid:area": 0.2 }, "E"], ["基因之道", { "rscm:4:dmg": 0.22, "rsc:1:lifep": 0.3, psn: 10 }, "W"]],
  ],
};
const V5_TAL_SRC = { W: "WoW", P: "PoE", L: "LoL 海克斯", E: "Last Epoch", D: "Diablo IV" };
// V5_TAL2 的 7 排對應到天賦的第 1、2、4、5、6、7、8 排
const V5_TAL_ROW_IDX = [0, 1, 3, 4, 5, 6, 7];
// 分支特性（常駐）：原本附在第 1 排三個選項上的共同加成（平衡補正、氣勢／詛咒脈衝等核心機制）
// 移到這裡，選擇分支後就生效；沒有補正的分支給一個小型的主題特性。
const V5_TRAIT_TPL = { blade: { momSkill: 1 }, hex: { roHexPulse: 1.2 } };
const V5_TRAIT_X = {
  ro_sword_0: ["騎乘", { move: 8, armorp: 10 }],
  ro_sword_1: ["神聖誓約"],
  ro_sword_2: ["劍領之魂"],
  ro_sword_3: ["盧恩之血", { res_all: 5, ail: 0.05 }],
  ro_bow_0: ["獵鷹之眼", { crit: 3 }],
  ro_bow_1: ["荒野之子", { res_poison: 15, psn: 10 }],
  ro_bow_2: ["神射手"],
  ro_bow_3: ["吟遊之歌"],
  ro_mage_0: ["元素親和", { cdr: 3, res_all: 5 }],
  ro_mage_1: ["精靈契約", { minAs: 0.05, res_all: 5 }],
  ro_mage_2: ["禁咒之源"],
  ro_mage_3: ["秘法洞悉", { crit: 2, critm: 10 }],
  ro_thief_0: ["毒腺", { psn: 10, evap: 10 }],
  ro_thief_1: ["神偷", { evap: 15, pot: 15 }],
  ro_thief_2: ["十字之刃"],
  ro_thief_3: ["魅影之咒"],
  ro_acolyte_0: ["神之恩典"],
  ro_acolyte_1: ["氣之修行"],
  ro_acolyte_2: ["天使召喚"],
  ro_acolyte_3: ["修羅之血", { leech: 0.003, lifep: 5 }],
  ro_merchant_0: ["鍛造大師"],
  ro_merchant_1: ["生命體培育"],
  ro_merchant_2: ["機械工學"],
  ro_merchant_3: ["基因工學", { pot: 25, res_poison: 15 }],
};
// v5.3 武鬥場試算後的分支特性微調（加在原平衡補正上）
const V5_TRAIT_ADJ = {
  ro_sword_1: { skill: 40, more: { dmg: 30 } },
  ro_bow_3: { minp: 80 },
  ro_acolyte_0: { skill: -20 },
  ro_merchant_2: { skill: -20 },
};
function v5TraitOf(b) {
  const [n, x] = V5_TRAIT_X[b.k] || ["分支特性"],
    e = { ...(x || {}) };
  const add = (o) => {
    for (const [k, v] of Object.entries(o || {}))
      if (k === "more") e.more = roMergeMods(e.more, v);
      else e[k] = (e[k] || 0) + v;
  };
  add(V5_TRAIT_TPL[b.tpl]);
  add(RO_ASC_BOOST[b.k]);
  if (b.k === "ro_acolyte_2") add({ minp: V5_PRIEST.row0Min });
  add(V5_TRAIT_ADJ[b.k]);
  for (const k of Object.keys(e)) if (e[k] === 0) delete e[k];
  return { n, d: v5TalText(e), e };
}
function v5AscRework() {
  const log = [],
    used = new Set();
  for (const [cls, bs] of Object.entries(ASC))
    bs.forEach((b, bi) => {
      const rows = V5_TAL2[b.k];
      if (rows)
        rows.forEach((row, ri) =>
          row.forEach(([n, e, src], i) => {
            const t = b.t[V5_TAL_ROW_IDX[ri]]?.[i];
            if (t) Object.assign(t, { n, d: v5TalText(e), e, src });
          }),
        );
      // 共鳴排：不屬於本職業的輔助換成本職業版本；再附加分支核心技能的加成，讓每個共鳴天賦都不重複
      const core = b.core?.A || [];
      (b.t[2] || []).forEach((t, i) => {
        const sk0 = Object.keys(t.e || {}).find((k) => k.startsWith("sp:"));
        const id = sk0?.split(":")[1];
        if (id && SKILLS[id] && !CLASS[cls].gems.includes(id) && V5_EQ[cls]?.[id]) {
          const nid = V5_EQ[cls][id],
            r = roResonance(nid, false);
          log.push(`${b.n}：${t.n} → ${r[0]}`);
          Object.assign(t, { n: r[0], d: r[1], e: r[2] });
        }
        const sk = Object.keys(t.e || {}).find((k) => k.startsWith("sp:")) || t.n;
        let rid = null;
        for (let j = 0; j < 3 && !rid; j++) {
          const c = core[(i + bi + j) % 3];
          if (c && SKILLS[c] && !used.has(sk + "|" + c)) rid = c;
        }
        rid && used.add(sk + "|" + rid);
        if (rid && !t.e.v5rd) {
          t.e = { ...t.e, ["sk:" + rid + ":more"]: 0.1, v5rd: 1 };
          t.d += `；「${roSkName(rid)}」傷害 ×1.10`;
        }
        t.src = "P";
      });
      b.trait = v5TraitOf(b);
    });
  return log;
}
// 分支特性生效、介面顯示、改版退點
function v5TraitInstall() {
  const cm = collectMods;
  collectMods = function () {
    const out = cm();
    const b = typeof ascBranch === "function" && S?.tal ? ascBranch() : null;
    if (b?.trait)
      for (const [k, v] of Object.entries(b.trait.e))
        if (k === "more") for (const [mk, mv] of Object.entries(v)) out.push({ s: mk, v: mv, src: "trait:" + b.k, x: "more" });
        else out.push({ s: k, v, src: "trait:" + b.k });
    return out;
  };
  const ns = newState;
  newState = function (...a) {
    const st = ns(...a);
    if (st.tal) st.tal.v53 = 1;
    return st;
  };
  const rc = recalc;
  recalc = function () {
    if (S?.tal && S.tal.v53 !== 1) {
      if (S.tal.p?.length) later(1, () => toast("職業天賦 v5.3 全面重製：天賦點已全數退還，請重新選擇", "lvl"));
      S.tal.p = [];
      S.tal.v53 = 1;
    }
    return rc();
  };
  if (ui?.ascHtml) {
    const ah = ui.ascHtml;
    ui.ascHtml = function () {
      let h = ah.call(this);
      const b = ascBranch();
      if (!b || !S.tal.tr) return h;
      if (b.trait)
        h = h.replace(
          "<h3>第 1 排</h3>",
          `<div class="board v5trait"><div class="row"><b>分支特性・${esc(b.trait.n)}</b><span class="tag">常駐</span></div><div class="row"><span>${esc(b.trait.d)}</span></div></div><h3>第 1 排</h3>`,
        );
      for (const row of b.t)
        for (const t of row)
          if (t.src && V5_TAL_SRC[t.src]) h = h.replace(`<b>${t.n}</b>`, `<b>${t.n}</b><span class="v5src">${V5_TAL_SRC[t.src]}</span>`);
      return h.replace("<h3>第 8 排</h3>", "<h3>第 8 排・奧義</h3>");
    };
  }
}
// 新機制（海克斯式）
function v5HexInstall() {
  HIT_MUL.push(
    {
      k: "v5:first",
      lab: () => tal("h_first") && `首擊 ×${(1 + tal("h_first")).toFixed(2)}`,
      f: (t, m) => {
        if (!tal("h_first") || !m || m.v5f) return t;
        m.v5f = 1;
        return t * (1 + tal("h_first"));
      },
    },
    {
      k: "v5:ramp",
      lab: () => tal("h_ramp") && `越戰越勇（最多 +${Math.round(tal("h_ramp") * 1000)}%）`,
      f: (t) => {
        const v = tal("h_ramp");
        if (!v || !G.v5c) return t;
        return t * (1 + Math.min(10 * v, (G.t - G.v5c.s) * v));
      },
    },
    {
      k: "v5:ail",
      lab: () => tal("h_ail") && `每種異常 +${Math.round(tal("h_ail") * 100)}%`,
      f: (t, m) => {
        const v = tal("h_ail");
        if (!v || !m) return t;
        const n = [m.brn && m.brn.t > 0, m.slow > 0, m.shk > 0, m.psn && m.psn.s && m.psn.s.length, m.bld && m.bld.t > 0, m.crs && Object.values(m.crs).some((x) => x > 0)].filter(Boolean).length;
        return t * (1 + v * n);
      },
    },
    {
      k: "v5:undead",
      lab: () => tal("h_undead") && `對不死、暗屬性 ×${(1 + tal("h_undead")).toFixed(2)}`,
      f: (t, m) => {
        const v = tal("h_undead");
        if (!v || !m) return t;
        const el = v5MobEl(m);
        return el === "undead" || el === "shadow" ? t * (1 + v) : t;
      },
    },
  );
  HURT_MUL.push({ k: "v5:lowhpdr", f: () => (tal("h_lowhpdr") && S.hp < PS.maxhp * 0.5 ? 1 - tal("h_lowhpdr") : 1) });
  TAL_ON.h_ramp = {
    hit: () => {
      const c = (G.v5c ||= { s: G.t, l: G.t });
      if (G.t - c.l > 4) c.s = G.t;
      c.l = G.t;
    },
  };
  TAL_ON.h_killcd = {
    kill: () => {
      const cds = G.pl?.cds;
      if (cds) for (const k in cds) cds[k] -= tal("h_killcd");
    },
  };
  TAL_ON.h_killshd = {
    kill: () => {
      const p = G.pl;
      p.shd = Math.min(PS.maxhp * 0.3, (p.shd || 0) + PS.maxhp * tal("h_killshd"));
    },
  };
  TAL_ON.h_cheat = {
    hurt: () => {
      if (S.hp < PS.maxhp * 0.3 && !(G.v5cheat > G.t)) {
        G.v5cheat = G.t + 30;
        G.pl.shd = Math.max(G.pl.shd || 0, PS.maxhp * tal("h_cheat"));
        num(G.pl.x, G.pl.y - 30, "不屈！", "#ffd84a");
      }
    },
  };
  TAL_ON.h_echo = {
    cast: (g) => {
      if (g && RAND() < tal("h_echo") && typeof roEchoCast === "function") roEchoCast(g, 0.6);
    },
  };
  TAL_ON.h_minshd = {
    tick: (dt) => {
      const n = (G.mins || []).length + (G.turs || []).length + (G.gsp || []).length;
      if (n && S.hp < PS.maxhp) S.hp = Math.min(PS.maxhp, S.hp + PS.maxhp * tal("h_minshd") * n * dt);
    },
  };
  // ---- v5.3 新機制 ----
  const dist = (m) => (m && G.pl ? Math.hypot(m.x - G.pl.x, m.y - G.pl.y) : 0);
  const on = (k, t, ok) => (tal(k) && ok ? t * (1 + tal(k)) : t);
  HIT_MUL.push(
    { k: "v5:healthy", lab: () => tal("h_healthy") && `對高生命敵人 ${v5X(tal("h_healthy"))}`, f: (t, m) => on("h_healthy", t, m && m.hp >= 0.8 * m.max) },
    { k: "v5:close", lab: () => tal("h_close") && `近身 ${v5X(tal("h_close"))}`, f: (t, m) => on("h_close", t, m && dist(m) < 40) },
    { k: "v5:far", lab: () => tal("h_far") && `遠距 ${v5X(tal("h_far"))}`, f: (t, m) => on("h_far", t, m && dist(m) > 60) },
    { k: "v5:frenzy", lab: () => tal("h_frenzy") && `擊殺後 ${v5X(tal("h_frenzy"))}`, f: (t) => on("h_frenzy", t, G.v5fz > G.t) },
    { k: "v5:pain", lab: () => tal("h_pain") && `受傷後 ${v5X(tal("h_pain"))}`, f: (t) => on("h_pain", t, G.v5pn > G.t) },
    { k: "v5:stand", lab: () => tal("h_stand") && `站立 ${v5X(tal("h_stand"))}`, f: (t) => on("h_stand", t, !G.v5mv) },
    {
      k: "v5:lucky",
      lab: () => tal("h_lucky") && `${v5P(tal("h_lucky"))}% 機率 ×3`,
      f: (t) => (tal("h_lucky") && RAND() < tal("h_lucky") ? t * 3 : t),
      est: (R, a) => 1 + 2 * (a("h_lucky") || 0),
    },
    {
      k: "v5:op",
      lab: () => tal("h_op") && `每 10 秒首次技能 ${v5X(tal("h_op"))}`,
      f: (t, m, s) => {
        if (!tal("h_op") || !s || !s.skill || (G.v5op || 0) > G.t) return t;
        G.v5op = G.t + 10;
        return t * (1 + tal("h_op"));
      },
    },
  );
  HURT_MUL.push(
    { k: "v5:castdr", f: () => (tal("h_castdr") && G.v5cdr > G.t ? 1 - tal("h_castdr") : 1) },
    { k: "v5:moving", f: () => (tal("h_moving") && G.v5mv ? 1 - tal("h_moving") : 1) },
  );
  TAL_ON.h_frenzy = { kill: () => (G.v5fz = G.t + 4) };
  TAL_ON.h_pain = { hurt: (src, dmg) => dmg > 0 && (G.v5pn = G.t + 3) };
  TAL_ON.h_castdr = { cast: () => (G.v5cdr = G.t + 2) };
  TAL_ON.h_ward = {
    cast: () => {
      const p = G.pl;
      if (p) p.shd = Math.min(PS.maxhp * 0.2, (p.shd || 0) + PS.maxhp * tal("h_ward"));
    },
  };
  TAL_ON.h_reset = {
    kill: () => {
      const cds = G.pl?.cds;
      if (!cds || RAND() >= tal("h_reset")) return;
      for (const k in cds) cds[k] = 0;
      num(G.pl.x, G.pl.y - 30, "冷卻重置！", "#9ad8ff");
    },
  };
  // 是否在移動（位移速度 > 15／秒）
  const mv = (dt) => {
    const p = G.pl;
    if (!p || !dt) return;
    const m = G.v5mp;
    G.v5mv = m ? Math.hypot(p.x - m[0], p.y - m[1]) / dt > 15 : false;
    G.v5mp = [p.x, p.y];
  };
  TAL_ON.h_stand = { tick: mv };
  TAL_ON.h_moving = { tick: mv };
  // 「第 3 次施放」：每個技能各自計數
  const csr = castSkillRaw;
  castSkillRaw = function (g, a = 1) {
    const v = g && tal("nth:" + g.id);
    if (v) {
      const c = (G.v5nth ||= {});
      c[g.id] = (c[g.id] || 0) + 1;
      if (c[g.id] % 3 === 0) a *= 1 + v;
    }
    return csr.call(this, g, a);
  };

}

// v5.2 神官補強：召喚專屬的戰鬥風格、奧義加強、天使降臨與治癒術
const V5_PRIEST = {
  angelMore: 0.86, // 每發 35% → 65%
  guardMore: 0.3, // 服事的英靈召喚傷害 ×1.3
  angelAdd: 1, // 天使 2 → 3
  healHit: 1.6,
  row0Min: 100,
};
function v5PriestInstall() {
  // v5.3：第 1 排的召喚物傷害移到「分支特性」、第 8 排併入 V5_TAL2
  if (SKILLS.angel)
    SKILLS.angel.d = "〔聖屬性〕召喚 3 位小天使，自動搜尋怪物並從遠處發射聖光彈，每發造成 65% 武器傷害並附帶元素異常；天使無敵，陣亡或切換地圖後自動補充";
  if (SKILLS.heal) {
    SKILLS.heal.hit = V5_PRIEST.healHit;
    if (!SKILLS.heal.tg.includes("holy")) SKILLS.heal.tg.push("holy");
    SKILLS.heal.d = `〔聖屬性〕生命低於 70% 時，回復 30% 最大生命（每點智力再 +0.3%）；周圍有敵人時也會施放，對周圍敵人造成 ${Math.round(V5_PRIEST.healHit * 100)}% 武器傷害（聖屬性，對不死怪物 ×${V5_HOLY_UNDEAD}）`;
  }
  const cm = collectMods;
  collectMods = function () {
    const out = cm();
    if (S && S.cls === "acolyte")
      out.push({ s: "sk:angel:more", v: V5_PRIEST.angelMore, src: "v5" }, { s: "sk:angel:minion", v: V5_PRIEST.angelAdd, src: "v5" }, { s: "sk:guard:more", v: V5_PRIEST.guardMore, src: "v5" });
    return out;
  };
}
// 在所有屬性換算完成後（最外層）：天賦樹「技能傷害」同時給一半的召喚物傷害；「聖靈共鳴」把技能傷害轉給召喚物
function v5PostInstall() {
  const cm = collectMods;
  collectMods = function () {
    const out = cm();
    let tree = 0,
      skill = 0,
      conv = 0;
    for (const m of out) {
      if (m.x) continue;
      if (m.s === "skill") {
        skill += m.v;
        if (typeof m.src === "string" && m.src.startsWith("共用天賦") && m.v > 0) tree += m.v;
      } else if (m.s === "skToMin") conv += m.v;
    }
    if (tree) out.push({ s: "minp", v: tree * V5_TREE_MIN, src: "共用天賦・召喚共鳴" });
    if (conv && skill > 0) out.push({ s: "minp", v: skill * conv, src: "tal:skToMin" });
    return out;
  };
}
const V5_TREE_MIN = 0.5;
if (typeof roV4Install === "function") {
  const r4 = roV4Install;
  roV4Install = function () {
    r4();
    v5PostInstall();
    v54Late();
  };
}
function v5HelpAll() {
  const row = (k, name, text) => {
    const L = HELP[k]?.[1];
    if (!L) return;
    const i = L.findIndex((x) => x[0] === name);
    if (text == null) i >= 0 && L.splice(i, 1);
    else i >= 0 ? (L[i] = [name, text]) : L.push([name, text]);
  };
  const add = (k, afterName, rows) => {
    const L = HELP[k]?.[1];
    if (!L) return;
    const i = afterName ? L.findIndex((x) => x[0] === afterName) : L.length - 1;
    L.splice(i + 1, 0, ...rows);
  };
  row("trn", "獎勵", "沒有經驗與掉落；不計入蒐藏（卡片、地圖加成）與任務。");
  row("stash", "可存放", "裝備、符文石、石板與技能寶石。怪物卡片屬於各角色，不能存入倉庫；鑲嵌在裝備上的卡片會跟著裝備一起存入。");
  row("off", "怪物卡牌", null);
  add("off", "主宰", [["怪物卡片", "離線擊殺不會掉落卡片，也不計入地圖蒐藏的擊殺數。"]]);
  row("off", "背包", "獨特、傳奇優先放入；背包已滿時，其餘分解為 Zeny 與精煉素材。");
  row("chars", "共用", "Zeny、材料與地圖蒐藏的擊殺數由所有角色共用；怪物卡片與卡片蒐藏度屬於各角色。");
  HELP.asc = [
    "轉職",
    [
      ["試煉", "地圖分頁「試煉」的轉職試煉，30、45、60、75 級各一場；一轉、二轉限時 150 秒，三轉 130 秒（頭目較耐打），四轉 120 秒（頭目更耐打、技能傷害更高）。"],
      ["分支", "通過第一場試煉後，選擇一個分支。"],
      ["天賦點", "每場試煉獲得 2 點；Lv80、100、110、120 各再獲得 2 點，最多 16 點。每個天賦消耗 2 點。"],
      ["分支特性", "選擇分支後常駐生效，不需天賦點，顯示在天賦列表最上方（例如十字刺客「技能擊中也會獲得氣勢」、各分支的平衡補正）。"],
      ["8 排 × 3 選 1", "職業天賦共 8 排，每排 3 個天賦只能選 1 個：屬性之力、戰鬥風格、輔助共鳴、核心機制、元素屬性、對王專精、生存與機動、奧義。同一排的三個選項方向不同（例如輸出／功能／防禦），全遊戲 576 個天賦效果皆不重複。"],
      ["奧義", "第 8 排會改變玩法：例如「每施放第 3 次」大幅增傷、擊殺重置冷卻、中毒或氣勢上限提高。"],
      ["來源標籤", "天賦名稱旁的小標籤是設計參考：WoW、PoE、LoL 海克斯、Last Epoch、Diablo IV。"],
      ["解鎖", "習得上一排的天賦後，才會開放下一排。"],
      ["共鳴", "「輔助共鳴」強化的是本職業的專屬輔助寶石。"],
      ["分支技能", "部分技能限定分支使用（名稱標示「限…」），換分支時會自動拔除。"],
      ["重置天賦點", "消耗 150 Zeny，返還全部天賦點，分支不變。"],
      ["重置職業", "消耗 300 Zeny，返還全部天賦點並重新選擇分支。"],
    ],
  ];
  add("char", "預估 DPS", [
    ["裝備部位", "8 個部位：武器、盾牌、頭飾、鎧甲、披肩、鞋子、飾品 ×2。雙手武器無法搭配盾牌。"],
    ["屬性抗性", "來自裝備與卡片。降低對應屬性怪物的傷害，上限 75%；角色頁「屬性抗性」顯示目前數值。"],
  ]);
  row("keep", "階級", "「T3 以上」包含 T3、T2、T1、T0。詞綴條件只對石板與符文石有效；裝備已沒有詞綴。");
  row("keep", "詞綴計數", "至少 N 條詞綴達到指定階級（石板、符文石）。");
  add("keep", "詞綴計數", [["基底品質", "裝備的「品質」50%～150% 換算為 0～100：品質 100% 為 50，150% 為 100。"]]);
  HELP.season = [
    "活動・諸神黃昏",
    [
      ["§進入"],
      ["開放", "90 級以上可前往「諸神黃昏」，怪物固定 90 級，可放置石板。"],
      ["§挑戰"],
      ["生態印記", `游離孢子、月芽精靈、熔礦幼蟲各有 ${SS.frag * 100}% 機率掉落${GODS.map((g) => g.n).join("、")}的生態印記。`],
      ["化身", `消耗 ${SS.fragN} 片同一位神的印記，可挑戰一次祂的化身。每位化身招式不同；失敗不退還印記。`],
      ["自動挑戰", "勾選化身的「自動」，印記足夠時自動挑戰。多位勾選時，優先挑戰印記最多的一位。失敗後等待 2 分鐘再挑戰。"],
      ["§獎勵"],
      ["活動裝備", "此地圖掉落的裝備卡片插槽 +1（不會超過該稀有度的插槽上限）。"],
      ["卡片", `擊敗化身有 ${V5_DROP.god * 100}% 機率掉落傳說或神話卡片。`],
      ["活動獨特", "六件活動獨特裝備只在這張地圖掉落。"],
      ["神器", `擊敗化身時，有 ${(SS.art ?? 0.05) * 100}% 機率掉落祂的神器。`],
      ["活動結束", "活動結束後地圖關閉，裝備、卡片與神器皆會保留。"],
    ],
  ];
  row("bld", "裝備", "卸下但其他構築仍在使用的裝備會自動鎖定，不會被分解。已分解的裝備，對應欄位會留空。");
  row("hh", "不會被分解", "拾取篩選與批次分解皆不會影響主宰。");
  HELP.bxtr = [
    "批次萃取（石板）",
    [
      ["萃取規則", "石板分頁中稀有以上的石板，符合任一規則即會一併萃取。裝備已沒有詞綴，不能萃取。"],
      ["規則的條件", "同一規則內的條件須全部符合。"],
      ["不會萃取", "已鎖定、奇蹟狀態的石板與主宰不會被批次萃取。"],
      ["不夠時", "神之金屬系素材、Zeny 或符文石空間不足時，僅萃取清單前段的石板。"],
    ],
  ];
  HELP.alchx = [
    "石板萃取",
    [
      ["素材", "消耗 1 個神之金屬系素材（Lv1 原石、Lv2 神之金屬、Lv3 濃縮、Lv4 高純度），將稀有以上的石板萃取為符文石。詞綴階級維持不變。"],
      ["Lv1", "成功率 50%，依權重取出 1 條詞綴。"],
      ["Lv2", "成功率 100%，依權重取出 1 條詞綴。"],
      ["Lv3", "成功率 100%。"],
      ["Lv4", "成功率 100%。取出的詞綴有 25% 機率提升一階。T1 可提升至 T0。"],
      ["祝福", "避免石板萃取時被摧毀：鐵匠的祝福保留機率 10%，神工匠的祝福 25%。"],
      ["Zeny", "萃取、灌注、磨礪、鑲嵌皆會消耗 Zeny，石板等級越高，消耗越多。"],
    ],
  ];
  HELP.inf = [
    "灌注（石板）",
    [
      ["素材", "消耗 1 個鋁系素材（Lv1 鋁原石、Lv2 鋁、Lv3 濃縮鋁），將石板符文石灌注至魔法以上的石板。"],
      ["取代", "隨機取代一條獎勵詞綴，每條機率相同。可能出現兩條同種詞綴。"],
      ["先用低等級", "灌注時優先使用可用的最低等級鋁系素材。"],
      ["裝備", "裝備已沒有詞綴，不能灌注；裝備改用精煉與卡片強化。"],
    ],
  ];
  HELP.fuse = [
    "鑲嵌（插槽石板）",
    [
      ["插槽石板", "由巴風特機率掉落，或由石板詞綴「插槽石板」轉換。"],
      ["放入符文石", "在背包石板頁選擇插槽石板並按「鑲嵌」，放入石板符文石後再按「鑲嵌」，消耗 1 個濃縮鋁。"],
      ["每種一顆", "同種詞綴限放一顆。"],
      ["固定詞綴", "鑲嵌後詞綴固定在石板上，不能再取下。"],
      ["裝備卡片", "裝備的卡片鑲嵌在「煉金・鑲嵌」，說明見該頁的「?」。"],
    ],
  ];
  row("guard", "獎勵", `擊敗後掉落守護者碎片和封印石，15% 機率掉落這位守護者的獨特裝備，${V5_DROP.guard * 100}% 機率掉落史詩或傳說卡片。`);
  row("guard", "終焉獎勵", `20% 機率掉落巴風特的獨特裝備，${V5_DROP.final * 100}% 機率掉落史詩或傳說卡片。第一次擊敗獲得稱號「終焉征服者」。可以重複挑戰。`);
  row("slate", "地圖等級", "怪物等級越高，越容易掉落：終局獨特、封印石、磨礪石與石板。傳奇裝備也越多。");
  row("slate", "詞綴提升", "只影響石板；裝備已沒有詞綴，不受詞綴提升與共鳴影響。");
  row("slate", "不受影響", "獨特裝備不受偏向影響。");
  row("slate", "鑲嵌石板", "插槽石板自帶與孔數相同的危險詞綴，可鑲嵌同等數量的石板符文（每種一顆），消耗濃縮鋁。鑲嵌完成後才能放入地圖。");
  row("reroll", "磨礪石", "在原本的階級範圍內，重洗石板所有詞綴的數值。詞綴種類和階級不變。裝備沒有詞綴，不能磨礪。");
  HELP.corr = [
    "腐化（石板）",
    [
      ["腐化石", "對一塊石板使用一顆腐化石，結果隨機。裝備改用精煉與卡片，不能腐化。"],
      ["升階", "30%：一條詞綴提升一階，T1 可提升至 T0。"],
      ["數值變化", "35%：所有詞綴的數值 × 85%～125%，可超出原本的範圍。"],
      ["沒有變化", "15%：無任何變化。"],
      ["變差", "20%：一條詞綴降一階。"],
      ["鎖定", "腐化後的石板無法再煉金。建議完成煉金後再腐化。"],
    ],
  ];
  row("holy", "洗鍊石", "在基底範圍內，重洗石板的固定詞綴數值。");
  row("holy", "限制", "已腐化、鑲嵌過的石板無法使用。裝備的品質在掉落時決定，不能洗鍊。");
  row("mir", "奇蹟石", "使一塊石板獲得奇蹟狀態，僅由闇答萊屍掉落。");
  row("mir", "只有一次", "對此石板使用任何一次煉金後，奇蹟狀態即消失。");
  row("mir", "萃取", "使用 Lv4 素材時，取出的詞綴必定提升一階。");
  row("tower", "腐化石", "過關有機率掉落腐化石（石板煉金用），層數越高機率越高，王層機率更高。腐化石僅在無盡之塔掉落。");
  row("tower", "洗鍊石", "過關有機率掉落洗鍊石（石板煉金用），機率為腐化石的一半。洗鍊石僅在無盡之塔掉落。");
  add("tower", "里程碑", [["卡片", `王層的王有 ${V5_DROP.tower * 100}% 機率掉落史詩或傳說卡片。`]]);
  row("monarch", "必定掉落", "1 件神話裝備（品質 130%～150%，插槽接近上限）和 10 個最高階素材。");
  add("monarch", "必定掉落", [["卡片", `${V5_DROP.monarch * 100}% 機率掉落傳說或神話卡片。`]]);
  HELP.shop = [
    "商人",
    [
      ["Zeny", "分解裝備可獲得 Zeny，可在此購買藥水與本職業的技能寶石。"],
      ["職業專屬", "商人只販售本職業的主動、輔助與被動寶石；其他職業的輔助只能靠怪物掉落（穿梭寶石）。"],
      ["素材", "精煉素材與魔力礦石在「煉金・素材」購買。"],
    ],
  ];
  row("fx", "拖尾", "地圖蒐藏合計擊殺 20000 隻，解鎖那張地圖的拖尾。");
  HELP.runes[1].unshift(["來源", "符文石只能從石板萃取取得，用於灌注或鑲嵌石板。裝備已沒有詞綴。"]);
}
// 說明視窗換行：過長的一行在「、」「）」或空白後再斷行，避免超出視窗
function v5WrapInstall() {
  const hl = hLines;
  hLines = function (t, a = HL_W) {
    const out = [];
    for (const line of hl(t, a)) {
      if (hlW(line) <= a + 1) {
        out.push(line);
        continue;
      }
      let rest = line;
      while (hlW(rest) > a + 1) {
        let cut = -1,
          w = 0;
        for (let i = 0; i < rest.length; i++) {
          w += rest.charCodeAt(i) > 255 ? 1 : 0.55;
          if (w > a) break;
          if ("、）) ".includes(rest[i]) && i > 3) cut = i + 1;
        }
        if (cut < 0) {
          w = 0;
          for (cut = 0; cut < rest.length; cut++) {
            w += rest.charCodeAt(cut) > 255 ? 1 : 0.55;
            if (w > a) break;
          }
        }
        out.push(rest.slice(0, cut).trim());
        rest = rest.slice(cut).trim();
      }
      rest && out.push(rest);
    }
    return out;
  };
}

// ===========================================================================
// v5.4：RO 菁英詞條、背包卡片頁與 v5 篩選、地圖「挑戰」、轉職試煉難度、頭目技能修正
// ===========================================================================
const V54_TRIAL = { hp: 1.25, t: 150 };
// v5.6：三轉、四轉試煉上修（一轉、二轉維持 v5.4 的簡單版）
const V56_TRIAL = [
  { hp: 1.25, t: 150, sdm: 1 },
  { hp: 1.25, t: 150, sdm: 1 },
  { hp: 1.6, t: 130, sdm: 1 },
  { hp: 2.0, t: 120, sdm: 1.2 },
];
const v56Trial = (i) => V56_TRIAL[i] || V54_TRIAL;
// 菁英詞條：原有 6 種改用 RO 怪物技能名稱，另新增 4 種
const V54_ELITE = {
  swift: { n: "加速術", d: "移動速度 ×1.8，攻擊間隔 ×0.7" },
  tough: { n: "石化皮膚", c: "#c9b48a", d: "受到的傷害 −50%" },
  burst: { n: "自爆", d: "死亡時在原地引爆（約 0.9 秒後，可閃避）" },
  volley: { n: "箭雨", d: "每 3.5 秒向四周射出 10 支箭" },
  leech: { n: "吸血", d: "擊中你時回復自身 5% 最大生命" },
  frost: { n: "冰凍術", d: "每 4 秒在你的位置產生冰霧，移動速度 −50%" },
};
const V54_ELITE_NEW = {
  heal: { n: "治癒術", c: "#7dffa0", cd: 5, h: 0.06, d: "每 5 秒回復 6% 最大生命" },
  bolt: { n: "雷擊術", c: "#ffe066", cd: 4.5, r: 12, t: 1, k: 1.6, rng: 90, d: "每 4.5 秒在你的位置降下雷擊（有預警範圍，可閃避）" },
  ghost: { n: "念屬性", c: "#c8a0ff", dr: 0.5, d: "普通攻擊與召喚物對牠的傷害 −50%（技能不受影響）" },
  venom: { n: "毒性攻擊", c: "#9be05a", p: 0.012, t: 4, d: "擊中你時使你中毒 4 秒，每秒損失 1.2% 最大生命（不會低於 25%）" },
};
// 卡片分解價值（Zeny，依階級）
const V54_CARD_ZENY = [0, 15, 40, 100, 250, 600, 1500];
const V54_KEEP_OLD = new Set(["any", "af", "cnt", "dv", "sock"]);

function v54Install() {
  // ---- 1. 菁英詞條 ----
  for (const [k, v] of Object.entries(V54_ELITE)) if (ELITE_AF[k]) Object.assign(ELITE_AF[k], v);
  Object.assign(ELITE_AF, V54_ELITE_NEW);
  const et = eliteTick;
  eliteTick = function (m, dt) {
    et(m, dt);
    if (!m || !m.ea || G.dead) return;
    if (m.ea.includes("heal")) {
      const a = ELITE_AF.heal;
      m.v54h = (m.v54h ?? rf(1, a.cd)) - dt;
      if (m.v54h <= 0) {
        m.v54h = a.cd;
        if (m.hp < m.max) {
          const h = Math.min(m.max - m.hp, m.max * a.h);
          m.hp += h;
          num(m.x, m.y - m.h - 4, "+" + fmt(h), a.c);
        }
      }
    }
    if (m.ea.includes("bolt")) {
      const a = ELITE_AF.bolt;
      m.v54b = (m.v54b ?? rf(1, a.cd)) - dt;
      if (m.v54b <= 0 && dist(m, G.pl) < a.rng) {
        m.v54b = a.cd;
        addHaz({ x: G.pl.x, y: G.pl.y, r: a.r, t: a.t, dmg: m.dmg * a.k, src: m, c: a.c, zap: 1, nk: 1 });
      }
    }
  };
  HIT_MUL.push({
    k: "v54:ghost",
    f: (t, m, s) => (m && m.ea && m.ea.includes("ghost") && !(s && s.skill) ? t * (1 - ELITE_AF.ghost.dr) : t),
  });
  const dp = damagePlayer;
  damagePlayer = function (d, x, y, src, n) {
    const hp0 = S.hp;
    dp(d, x, y, src, n);
    if (src && src.ea && src.ea.includes("venom") && S.hp < hp0 && G && !G.dead) G.v54psn = G.t + ELITE_AF.venom.t;
  };
  const tk = tick;
  tick = function (dt) {
    tk(dt);
    if (!G || G.dead || !(G.v54psn > G.t) || !PS) return;
    G.v54pt = (G.v54pt || 0) + dt;
    if (G.v54pt < 1) return;
    G.v54pt -= 1;
    const floor = PS.maxhp * 0.25;
    if (S.hp <= floor) return;
    const d = Math.min(S.hp - floor, PS.maxhp * ELITE_AF.venom.p);
    S.hp -= d;
    num(G.pl.x, G.pl.y - 22, Math.round(d), ELITE_AF.venom.c);
  };

  // ---- 6. 頭目（或任何怪物）死亡時，尚未落地的技能預警取消，不再造成傷害 ----
  const th = tickHaz;
  tickHaz = function (dt) {
    const hz = G.haz;
    if (hz && hz.length)
      for (let i = hz.length - 1; i >= 0; i--) {
        const h = hz[i];
        if (h.src && h.k !== "frost" && !alive(h.src)) hz.splice(i, 1);
      }
    return th(dt);
  };

  // ---- 7. 轉職試煉：頭目生命 ×1.5 → ×1.25、限時 120 → 150 秒 ----
  const stt = startTrial;
  startTrial = function (i) {
    const t0 = toast;
    const tr = v56Trial(i);
    toast = (m, k) => t0(String(m).replace("限時 120 秒", `限時 ${tr.t} 秒`), k);
    try {
      stt(i);
    } finally {
      toast = t0;
    }
    if (G.trial === i && G.boss) {
      const f = tr.hp / 1.5;
      G.boss.max = Math.round(G.boss.max * f);
      G.boss.hp = G.boss.max;
      G.bossT = tr.t;
      if (tr.sdm !== 1) G.boss.sdm = (G.boss.sdm || 1) * tr.sdm;
    }
  };

  // ---- 3. 保留規則：裝備改用插槽、卡片、精煉條件 ----
  for (const k of V54_KEEP_OLD) delete KEEP_K[k];
  Object.assign(KEEP_K, { cs: "插槽數", card: "已鑲卡片", ref: "精煉值" });
  Object.assign(KEEP_DEF, { cs: { n: 2 }, card: { n: 1 }, ref: { n: 5 } });
  KEEP_RAR[5] = "獨特";
  const kc = keepCond;
  keepCond = function (t, a) {
    if (a.k === "cs") return (t.cs || 0) >= (a.n || 0);
    if (a.k === "card") return (t.cards || []).filter(Boolean).length >= (a.n || 1);
    if (a.k === "ref") return (t.ref || 0) >= (a.n || 0);
    return kc(t, a);
  };
  const kr = keepRow;
  keepRow = function (t, g, c, e) {
    if (e || !["cs", "card", "ref"].includes(t.k)) return kr(t, g, c, e);
    const lab = { cs: ["孔", "插槽數至少"], card: ["張", "已鑲卡片至少"], ref: ["", "精煉值至少"] }[t.k];
    const inp = `<span class="ge">${t.k === "ref" ? "+" : ""}≥</span><input type="number" class="num" inputmode="numeric" min="0" max="10" data-kf="n" data-g="${g}" data-c="${c}" value="${t.n || ""}" placeholder="0" aria-label="${lab[1]}"><span class="ge">${lab[0]}</span>`;
    return `<div class="kc"><button class="btn sm knot" data-act="knot" data-g="${g}" data-c="${c}" aria-pressed="${!!t.not}" aria-label="非：反轉這個條件">非</button>${keepSel("k", g, c, Object.entries(KEEP_K), t.k, "條件種類", "kk")}<div class="kpar">${inp}</div><button class="btn sm kx" data-act="kcdel" data-g="${g}" data-c="${c}" aria-label="刪除條件">✕</button></div>`;
  };
  // 稀有度篩選：移除舊插槽／神眷，新增插槽與卡片篩選
  for (let i = RAR_F.length - 1; i >= 0; i--) if ([6, 7, 8, 9].includes(RAR_F[i][0])) RAR_F.splice(i, 1);
  RAR_F.push([11, "有插槽"], [12, "有空插槽"], [13, "已鑲卡片"]);
  BAG_SORT.push(["cs", "插槽數"], ["ref", "精煉值"]);
  const bl = bagList;
  bagList = function () {
    const o = bagOpt(),
      r = o.r,
      s = o.s,
      fr = r >= 11,
      fs = s === "cs" || s === "ref";
    if (fr) o.r = -9;
    if (fs) o.s = "new";
    let a;
    try {
      a = bl();
    } finally {
      o.r = r;
      o.s = s;
    }
    const nc = (t) => (t.cards || []).filter(Boolean).length;
    if (fr) a = a.filter((t) => (r === 11 ? t.cs > 0 : r === 12 ? t.cs > nc(t) : nc(t) > 0));
    if (fs) a = a.sort((x, y) => (s === "cs" ? (y.cs || 0) - (x.cs || 0) : (y.ref || 0) - (x.ref || 0)));
    return a;
  };
  const ns = newState;
  newState = function (...a) {
    const st = ns(...a);
    st.v54 = 1;
    return st;
  };
  const ens = roEnsureStats;
  roEnsureStats = function () {
    if (S && S.v54 !== 1) v54Migrate();
    return ens();
  };
  v54Help();
}
// 舊存檔：裝備符文石已無用途 → 換成 Zeny；保留規則中的詞綴條件移除
function v54Migrate() {
  S.v54 = 1;
  let n = 0,
    z = 0;
  if (Array.isArray(S.runes)) {
    const keep = [];
    for (const r of S.runes)
      if (r && !r.uq && r.a && isSlateAf(r.a)) keep.push(r);
      else {
        n++;
        try {
          z += runeAsh(r) || 0;
        } catch (e) {}
      }
    if (n) {
      S.runes = keep;
      S.ash += z;
    }
  }
  const clean = (list) => {
    if (!Array.isArray(list)) return list;
    for (const g of list) if (g && Array.isArray(g.c)) g.c = g.c.filter((c) => !V54_KEEP_OLD.has(c.k));
    return list.filter((g) => g && g.c && g.c.length);
  };
  if (S.set?.keep) S.set.keep = clean(S.set.keep);
  try {
    const o = bagOpt();
    if (o.fg?.c) o.fg.c = o.fg.c.filter((c) => !V54_KEEP_OLD.has(c.k));
    if (V54_KEEP_OLD.has(o.r) || [6, 7, 8, 9].includes(o.r)) o.r = -9;
  } catch (e) {}
  if (S.set?.auto) S.set.auto[5] = 0;
  if (n) later(1.6, () => toast(`背包改版：${n} 顆裝備符文石（裝備已沒有詞綴）換成 Zeny +${fmt(z)}`, "lvl", 1));
}

// ---- 背包「卡片」頁 ----
const v54CardN = () => Object.values(v5St().cards).reduce((a, b) => a + b, 0);
function v54Opt() {
  const o = ((S.set ||= {}).v54c ||= {});
  o.t ??= 0;
  o.p ??= "";
  o.s ??= "tier";
  o.fmax ??= 3;
  o.fk ??= 1;
  o.st ??= [0, 1, 1, 0, 0, 0, 0];
  o.sk ??= 1;
  return o;
}
function v54Seg(view) {
  const b = (v, txt, on) => `<button data-act="bagv" data-v="${v}" aria-pressed="${on}">${txt}</button>`;
  return `<div class="row" style="margin-bottom:10px"><div class="seg" style="flex:1">${b("items", `裝備 <span class="px">${S.bag.length}/${BAG_MAX}</span>`, view === "items")}${b("cards", `卡片 <span class="px">${v54CardN()}</span>`, view === "cards")}</div></div>`;
}
// 批次合成：每階由低到高，把「超過保留張數」的卡片 3 張合 1 張
function v54FusePlan(apply) {
  const o = v54Opt(),
    st = v5St(),
    out = { n: 0, z: 0, b: 0, got: [] };
  for (let t = 1; t <= Math.min(5, o.fmax); t++) {
    for (;;) {
      const pool = [];
      for (const c of V5_CARDS)
        if (c.t === t) for (let i = 0; i < (st.cards[c.id] || 0) - o.fk; i++) pool.push(c.id);
      if (pool.length < 3) break;
      const z = v5FuseZeny(t);
      if ((S.mat.b1 || 0) - (apply ? 0 : out.b) < t || S.ash - (apply ? 0 : out.z) < z) break;
      out.n++;
      out.z += z;
      out.b += t;
      if (!apply) {
        // 試算：從清單扣掉 3 張，不實際合成
        const take = pool.slice(-3);
        for (const id of take) st.cards[id]--;
        (out.tmp ||= []).push(...take);
        continue;
      }
      S.mat.b1 -= t;
      S.ash -= z;
      for (const id of pool.slice(-3)) (st.cards[id] -= 1) || delete st.cards[id];
      const p = V5_CARDS.filter((c) => c.t === t + 1 && !c.ex),
        got = p[Math.floor(RAND() * p.length)];
      v5GainCard(got.id);
      out.got.push(got);
    }
  }
  if (!apply) for (const id of out.tmp || []) st.cards[id]++;
  return out;
}
function v54SalvList() {
  const o = v54Opt(),
    st = v5St(),
    out = [];
  for (const c of V5_CARDS) {
    const n = (st.cards[c.id] || 0) - o.sk;
    if (o.st[c.t] && n > 0) out.push([c, n]);
  }
  return out;
}
function v54CardsHtml() {
  const o = v54Opt(),
    st = v5St(),
    tool = ui.v54tool,
    list = V5_CARDS.filter((c) => st.cards[c.id] > 0 && (!o.t || c.t === o.t) && (!o.p || c.p === o.p));
  list.sort((a, b) => (o.s === "n" ? st.cards[b.id] - st.cards[a.id] : o.s === "p" ? a.p.localeCompare(b.p) : 0) || b.t - a.t || a.n.localeCompare(b.n));
  const sel = (k, opts, v, lab) => `<select class="sel" data-v54s="${k}" aria-label="${lab}">${opts.map(([x, t]) => `<option value="${x}" ${String(x) === String(v) ? "selected" : ""}>${t}</option>`).join("")}</select>`;
  const filt = `<div class="row filt">${sel("s", [["tier", "依階級"], ["n", "依數量"], ["p", "依部位"]], o.s, "排序")}${sel("p", [["", "全部部位"], ...Object.entries(V5_PART).map(([k, n]) => [k, n])], o.p, "部位篩選")}${sel("t", [[0, "全部階級"], ...V5_TIER.slice(1).map((x, i) => [i + 1, x.n])], o.t, "階級篩選")}</div>`;
  const tb = (v, t) => `<button class="btn sm" data-v54="tool" data-v="${v}" aria-pressed="${tool === v}">${t} ${tool === v ? "▲" : "▼"}</button>`;
  let box = "";
  if (tool === "fuse") {
    const p = v54FusePlan(false);
    box = `<div class="box stack"><div class="row"><span class="note">把多餘的卡片 3 張合成 1 張高一階（隨機）</span>${helpBtn("v54cards")}</div>
      <div class="row"><span style="flex:none">合成到</span>${sel("fmax", V5_TIER.slice(1, 6).map((x, i) => [i + 1, `${x.n} → ${V5_TIER[i + 2].n}`]), o.fmax, "合成最高階級")}<span style="flex:none">每種保留</span>${sel("fk", [0, 1, 2, 3].map((n) => [n, n + " 張"]), o.fk, "每種保留張數")}</div>
      <button class="btn" data-v54="fuse" ${p.n ? "" : "disabled"}>合成 <span class="px">${p.n}</span> 次（Zeny <span class="px">${fmt(p.z)}</span>・藍色魔力礦石 <span class="px">${p.b}</span>）</button>
      <p class="note" style="margin:0">需要藍色魔力礦石（每次 = 卡片階級數）與 Zeny；目前藍礦 <span class="px">${S.mat.b1 || 0}</span>。</p></div>`;
  } else if (tool === "salv") {
    const l = v54SalvList(),
      n = l.reduce((a, [, k]) => a + k, 0),
      z = l.reduce((a, [c, k]) => a + V54_CARD_ZENY[c.t] * k, 0),
      cf = ui.v54cf === "salv";
    box = `<div class="box stack"><div class="row"><span class="note">勾選要分解的階級（分解為 Zeny）</span>${helpBtn("v54cards", 1)}</div>
      <div class="row">${V5_TIER.slice(1).map((x, i) => `<label class="chk"><input type="checkbox" data-v54c="st" data-i="${i + 1}" ${o.st[i + 1] ? "checked" : ""}><span style="color:${x.c}">${x.n}</span></label>`).join("")}</div>
      <div class="row"><span style="flex:none">每種保留</span>${sel("sk", [0, 1, 2, 3].map((k) => [k, k + " 張"]), o.sk, "每種保留張數")}</div>
      <button class="btn${cf ? " primary" : ""}" data-v54="salv" ${n ? "" : "disabled"}>${cf ? "再按一次確認：" : ""}分解 <span class="px">${n}</span> 張（<span class="px">+${fmt(z)}</span> Zeny）</button></div>`;
  }
  const row = (c) =>
    `<div class="li"><img class="v5ic" src="${roItemIcon(4001)}" alt="" style="--rc:${V5_TIER[c.t].c}"><div class="grow"><div class="t">${v5CardName(c)} ${v5TierTag(c.t)} <span class="px">×${st.cards[c.id]}</span></div><div class="s">${V5_PART[c.p]}・${esc(v5CardText(c))}</div></div><div class="stack" style="gap:4px"><button class="btn sm primary" data-v54="go" data-v="ins">鑲嵌</button><button class="btn sm" data-v54="one" data-k="${c.id}">分解 <span class="px">+${V54_CARD_ZENY[c.t]}</span></button></div></div>`;
  const kinds = Object.keys(st.cards).filter((k) => st.cards[k] > 0).length;
  return (
    `<div class="row tools">${tb("fuse", "批次合成")}${tb("salv", "批次分解")}<button class="btn sm" data-v54="go" data-v="fuse">前往卡片合成</button></div>${box}${filt}` +
    `<div class="row acnt"><span class="note" style="margin:0">持有 <span class="px">${v54CardN()}</span> 張・<span class="px">${kinds}</span> 種${list.length < kinds ? `・顯示 <span class="px">${list.length}</span> 種` : ""}・蒐藏 <span class="px">${v5SeenN()}/${V5_CARDS.length}</span></span></div>` +
    (list.length ? `<div class="list">${list.map(row).join("")}</div>` : `<p class="empty-note">${kinds ? "沒有符合篩選的卡片。" : "還沒有卡片。<br>擊敗怪物有機率掉落卡片；菁英、頭目、武鬥場掉落較高階的卡片。"}</p>`)
  );
}
// 拾取篩選／批次分解的快速保留：插槽 ≥ N 孔、已鑲卡片（存成一般保留規則）
function v54QuickGet(kind) {
  const g = (S.set.keep || []).find((x) => x.v5q === kind);
  return g && g.on ? g.c[0].n : 0;
}
function v54QuickSet(kind, n) {
  const list = (S.set.keep ||= []);
  const i = list.findIndex((x) => x.v5q === kind);
  if (!n) {
    if (i >= 0) list.splice(i, 1);
  } else {
    const g = { on: 1, v5q: kind, c: [{ k: kind, n }] };
    i >= 0 ? (list[i] = g) : list.push(g);
  }
  markDirty();
}
const v54QuickRow = () =>
  `<div class="row v54q"><span class="note" style="flex:none">一律保留</span><span style="flex:none">插槽 ≥</span><select class="sel" data-v54s="qcs" aria-label="保留插槽數">${[[0, "不限"], [1, "1 孔"], [2, "2 孔"], [3, "3 孔"], [4, "4 孔"]].map(([v, t]) => `<option value="${v}" ${v54QuickGet("cs") === v ? "selected" : ""}>${t}</option>`).join("")}</select><label class="chk"><input type="checkbox" data-v54c="qcard" ${v54QuickGet("card") ? "checked" : ""}><span>已鑲卡片</span></label><label class="chk"><input type="checkbox" data-v54c="qref" ${v54QuickGet("ref") ? "checked" : ""}><span>精煉 +5 以上</span></label></div>`;

// 介面（在所有其他包裝之後安裝）
function v54Late() {
  // ---- 背包 ----
  const pb = ui.p_bag;
  ui.p_bag = function () {
    try {
      const o = bagOpt();
      if (o.fg?.c) o.fg.c = o.fg.c.filter((c) => !V54_KEEP_OLD.has(c.k));
    } catch (e) {}
    if (this.bagView === "cards") return v54Seg("cards") + v54CardsHtml();
    let h = pb.call(this);
    const v = this.bagView || "items";
    h = h.replace(/<div class="row" style="margin-bottom:10px"><div class="seg" style="flex:1">[\s\S]*?<\/div><\/div>/, v54Seg(v));
    if (v === "runes")
      h = h.replace(/(<div class="row tools">)/, `<div class="row"><button class="btn sm" data-act="bagv" data-v="slates">← 返回石板</button><span class="note">石板符文石：從石板萃取，用於灌注或鑲嵌石板</span></div>$1`);
    else if (v === "slates")
      h = h.replace(/(<div class="row tools">[\s\S]*?)(<\/div>)/, `$1<button class="btn sm" data-act="bagv" data-v="runes">石板符文石 <span class="px">${(S.runes || []).length}</span></button>$2`);
    else {
      h = h
        .replace(/<label class="chk"><input type="checkbox" id="auto5"[\s\S]*?<\/label>/, "")
        .replace(/<label class="chk"><input type="checkbox" id="bulk5"[\s\S]*?<\/label>/, "")
        .replace(/(id="auto4"[\s\S]*?<\/label>)(<\/div>)/, "$1$2" + v54QuickRow())
        .replace(/(id="bulk4"[\s\S]*?<\/label>)(<\/div>)/, "$1$2" + v54QuickRow());
    }
    return h;
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("[data-v54]");
    if (!b || b.disabled) return;
    const a = b.dataset.v54;
    if (a !== "salv") ui.v54cf = null;
    if (a === "go") {
      if (!S.alchOn) return void toast(`煉金工坊尚未開放：擊敗「${MAPS[ALCH_MAP].n}」的頭目後開放`, "bad");
      ui.v5at = b.dataset.v;
      ui.v5pick = null;
      ui.v5res = null;
      return void ui.setTab("alch");
    }
    if (a === "tool") ui.v54tool = ui.v54tool === b.dataset.v ? null : b.dataset.v;
    else if (a === "fuse") {
      const r = v54FusePlan(true);
      if (r.n) {
        const best = r.got.reduce((x, c) => (c.t > x ? c.t : x), 0);
        toast(`批次合成 ${r.n} 次：獲得 ${r.got.length} 張卡片（最高 ${V5_TIER[best].n}）`, "lvl");
        sfx("alch", Math.min(3, best));
      }
      markDirty();
    } else if (a === "salv") {
      if (ui.v54cf !== "salv") ui.v54cf = "salv";
      else {
        ui.v54cf = null;
        const st = v5St();
        let n = 0,
          z = 0;
        for (const [c, k] of v54SalvList()) {
          (st.cards[c.id] -= k) || delete st.cards[c.id];
          n += k;
          z += V54_CARD_ZENY[c.t] * k;
        }
        S.ash += z;
        toast(`分解 ${n} 張卡片：Zeny +${fmt(z)}`, "lvl");
        markDirty();
      }
    } else if (a === "one") {
      const st = v5St(),
        c = V5_CARD[b.dataset.k];
      if (!c || !(st.cards[c.id] > 0)) return;
      (st.cards[c.id] -= 1) || delete st.cards[c.id];
      S.ash += V54_CARD_ZENY[c.t];
      markDirty();
    } else return;
    ui.render();
  });
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (!t || !t.dataset) return;
    if (t.dataset.v54s) {
      const k = t.dataset.v54s,
        o = v54Opt();
      if (k === "qcs") v54QuickSet("cs", +t.value);
      else o[k] = ["t", "fmax", "fk", "sk"].includes(k) ? +t.value : t.value;
      markDirty();
      ui.render();
    } else if (t.dataset.v54c) {
      const k = t.dataset.v54c;
      if (k === "st") v54Opt().st[+t.dataset.i] = t.checked ? 1 : 0;
      else if (k === "qcard") v54QuickSet("card", t.checked ? 1 : 0);
      else if (k === "qref") v54QuickSet("ref", t.checked ? 5 : 0);
      ui.v54cf = null;
      markDirty();
      ui.render();
    }
  });

  // ---- 4. 地圖：新增「挑戰」列表，武鬥場移入 ----
  const pm = ui.p_map;
  ui.p_map = function () {
    const ch = this.mapView === "ch";
    if (ch) this.mapView = "map";
    let h;
    try {
      h = pm.call(this);
    } finally {
      if (ch) this.mapView = "ch";
    }
    const m = h.match(/<section class="ro-arena-card">[\s\S]*?<\/section>/),
      card = m ? m[0] : "";
    if (card) h = h.replace(card, "");
    const i = h.indexOf('<div class="seg"'),
      j = i < 0 ? -1 : h.indexOf("</div>", i);
    if (j < 0) return h;
    let seg = h.slice(i, j),
      body = h.slice(j + 6);
    if (ch) seg = seg.replace(/aria-pressed="true"/g, 'aria-pressed="false"');
    const k = seg.indexOf("</button>") + 9,
      btn = `<button data-act="mview" data-v="ch" aria-pressed="${ch}">挑戰${S.mvs?.ch ? "" : '<b class="mst snew">NEW</b>'}</button>`;
    seg = seg.slice(0, k) + btn + seg.slice(k);
    if (ch) body = `<h3>挑戰${helpBtn("v54ch")}</h3>${card || '<p class="empty-note">目前沒有可挑戰的內容。</p>'}`;
    return h.slice(0, i) + seg + "</div>" + body;
  };
  // 冒險手冊：菁英詞條一覽
  const rg = ui.m_roguide;
  if (rg)
    ui.m_roguide = function () {
      const h = rg.call(this);
      const sec = `<h3>菁英詞條</h3><div class="box stack">${Object.values(ELITE_AF).map((a) => `<p><b class="v54ea" style="--ec:${a.c}">${a.n}</b>　${esc(a.d || "")}</p>`).join("")}</div>`;
      return h.includes("<h3>技能</h3>") ? h.replace("<h3>技能</h3>", sec + "<h3>技能</h3>") : h + sec;
    };
  // 轉職試煉說明的限時
  const tb = ui.trialBoard;
  if (tb)
    ui.trialBoard = function () {
      return tb.call(this).replace('限時 <span class="px">120</span> 秒', `限時 <span class="px">${v56Trial(S.tal.tr).t}</span> 秒`);
    };
}
function v54Help() {
  HELP.v54cards = [
    "卡片",
    [
      ["持有", "背包「卡片」頁列出目前持有的卡片；鑲嵌在裝備上的卡片不在這裡。"],
      ["批次合成", "由低階到高階，把超過「每種保留」張數的卡片 3 張合成 1 張高一階（隨機）。每次消耗藍色魔力礦石（數量 = 卡片階級）與 Zeny。"],
      ["批次分解", `把勾選階級中超過保留張數的卡片分解為 Zeny：${V5_TIER.slice(1).map((x, i) => x.n + " " + V54_CARD_ZENY[i + 1]).join("、")}。需要按兩次確認。`],
      ["單張分解", "每張卡片右側的「分解」只分解 1 張。"],
      ["蒐藏度", "分解或合成用掉的卡片仍計入蒐藏度。"],
    ],
  ];
  HELP.v54ch = [
    "挑戰",
    [
      ["無限武鬥場", "層數無上限，每層怪物生命 ×1.08、傷害 ×1.05；每 10 層為頭目關，每通過 10 層隨機增加一個負面效果（本次挑戰內持續）。"],
      ["掉落", "頭目關有機率掉落高階卡片，30 層起掉落傳說或神話；並有武鬥場限定的獨特裝備。"],
    ],
  ];
  HELP.bag = [
    "背包",
    [
      ["頁籤", "裝備、卡片、石板三頁；石板頁內的「石板符文石」可管理萃取出的符文石。"],
      ["部位", "8 個部位：武器、盾牌、頭飾、鎧甲、披肩、鞋子、飾品 ×2。雙手武器無法搭配盾牌。兩個飾品欄可以互換。"],
      ["素質", "基底素質（攻擊或防禦）加上固定的額外素質；每件掉落時浮動 50%～150%，稀有度越高越接近上限。"],
      ["插槽", "名稱後的 [數字] 為卡片插槽數，上限依稀有度；格子下方的小點為插槽，已鑲嵌的會亮起。"],
      ["拾取篩選", "勾選的稀有度在拾取時自動分解，得到 Zeny 與精煉素材。主宰不會分解。"],
      ["批次分解", "依勾選的稀有度和上方的部位、稀有度、規則篩選，一次分解。裝備上的卡片會退回。"],
      ["一律保留", "拾取篩選與批次分解下方可設定：插槽達到指定孔數、已鑲卡片、精煉 +5 以上的裝備不會被分解（存為保留規則）。"],
      ["篩選", "稀有度篩選可選「有插槽」「有空插槽」「已鑲卡片」；排序可選插槽數、精煉值。"],
      ["多選", "點選多件裝備，再一次分解、鎖定或解鎖。"],
      ["不會被分解", "鎖定、主宰，以及符合保留規則的裝備不會被分解。"],
    ],
  ];
  const kp = HELP.keep?.[1];
  if (kp) {
    for (const n of ["階級", "詞綴計數"]) {
      const i = kp.findIndex((x) => x[0] === n);
      if (i >= 0) kp.splice(i, 1);
    }
    kp.push(["裝備條件", "裝備可用：稀有度、部位、物品等級、基底品質、獨特、插槽數、已鑲卡片、精煉值。"], ["石板、符文石", "仍可使用詞綴與階級條件（「T3 以上」包含 T3～T0）。"]);
  }
  HELP.v54elite = [
    "菁英詞條",
    Object.keys(ELITE_AF).map((k) => [ELITE_AF[k].n, ELITE_AF[k].d || ""]),
  ];
}

// ===========================================================================
// v5.5：地圖背景依地圖名稱改用對應的 RO 原版地圖（GND 地表 + 原版貼圖烘焙）
// ===========================================================================
const V55_MAP_FILES = {
  payon: ["pay_fild08", "maps/ro55/pay_fild08.jpg", "斐揚森林（含 RO 樹木模型）"],
  mjolnir: ["mjo_dun01", "maps/ro55/mjo_dun01.jpg", "妙勒尼廢礦"],
  byalan: ["iz_dun02", "maps/ro55/iz_dun02.jpg", "依斯魯得海底洞穴"],
  icecave: ["ice_dun01", "maps/ro55/ice_dun01.jpg", "拉赫冰洞"],
  magma: ["mag_dun01", "maps/ro55/mag_dun01.jpg", "諾可羅德火山洞窟"],
  ghchurch: ["gl_church", "maps/ro55/gl_church.jpg", "葛城修道院"],
  ghknight: ["gl_knt01", "maps/ro55/gl_knt01.jpg", "葛城騎士團"],
  turtle: ["tur_dun02", "maps/ro55/tur_dun02.jpg", "龜島地下城"],
  thanatos: ["tha_t03", "maps/ro55/tha_t03.jpg", "達納托斯之塔"],
  odin: ["odin_tem01", "maps/ro55/odin_tem01.jpg", "奧丁神殿"],
  niflheim: ["niflheim", "maps/ro56/niflheim.jpg", "尼芙菲姆"],
  juperos: ["juperos_01", "maps/ro56/juperos_01.jpg", "朱諾・魔大陸遺跡"],
  abysslake: ["abyss_03", "maps/ro56/abyss_03.jpg", "深淵之湖地下洞穴"],
  biolab: ["lhz_dun03", "maps/ro56/lhz_dun03.jpg", "生體工學研究所"],
};
// 地圖編號 → 背景（0 普隆德拉南門、3 夢羅克沙漠維持原本的 prt_fild08、moc_fild12）
const V55_MAP_THEME = { 1: "payon", 2: "mjolnir", 4: "byalan", 5: "icecave", 6: "magma", 7: "ghchurch", 8: "ghknight", 9: "turtle", 10: "thanatos", 11: "niflheim", 12: "juperos", 13: "abysslake", 14: "biolab", 15: "odin" };
function v55MapsInstall() {
  if (!RO?.assets?.maps || typeof roMapThemes === "undefined") return;
  for (const [k, [name, file, n]] of Object.entries(V55_MAP_FILES))
    RO.assets.maps[k] = { name, n, file, width: 1536, height: 960, source: `https://assets.latam-tools.com.br/maps/${name}/manifest.json` };
  for (const [i, k] of Object.entries(V55_MAP_THEME)) roMapThemes[+i] = k;
  // 專屬場地：無盡之塔與武鬥場→達納托斯之塔、轉職試煉→葛城騎士團、魔王→葛城修道院、終局→奧丁神殿
  const bg = buildGround;
  buildGround = function () {
    const A = G?.arena?.ar,
      k = !A ? null : G.tw ? "thanatos" : A === ARENA.trial ? "ghknight" : A === ARENA.mon ? "ghchurch" : A === ARENA.fin ? "odin" : null;
    if (k && RO.assets.maps[k]) {
      const im = roImage(RO.assets.maps[k].file);
      if (im) {
        G.ground = im;
        G.props = [];
        G.lights = [];
        return;
      }
    }
    return bg();
  };
}

// v5.5：48 小時模擬與各職業抵達時的頭目試算顯示難度曲線不平滑：
// 夢羅克沙漠（俄塞里斯）常超時、海底洞穴（海神）秒殺玩家；後段地圖頭目則一抵達就能輕鬆擊敗。
// 依地圖調整頭目生命（hp）與技能傷害（sdm）。
const V55_BOSS_TUNE = {
  3: { hp: 0.7, sdm: 0.8 },
  4: { sdm: 0.7 },
  6: { sdm: 0.85 },
  7: { hp: 1.2 },
  8: { sdm: 0.85 },
  9: { hp: 1.35 },
  10: { hp: 1.5, sdm: 1.1 },
};
function v55BossInstall() {
  const sb = startBoss;
  startBoss = function (t) {
    const had = G.boss;
    const r = sb(t);
    const b = G.boss;
    if (b && b !== had && G.trial == null && !curMap().ss) {
      const k = V55_BOSS_TUNE[S.map];
      if (k?.hp) b.hp = b.max = Math.round(b.max * k.hp);
      if (k?.sdm) b.sdm = (b.sdm || 1) * k.sdm;
    }
    return r;
  };
}

// ===========================================================================
// v5.6
// ===========================================================================
// ---- 舊物品清理：已不會掉落的獨特裝備與寶石直接刪除；現行的可分解 ----
const v56UqLive = () => new Set([...Object.keys(RO_UQ), ...Object.keys(UNIQUE).filter((k) => UNIQUE[k].my)]);
function v56Migrate() {
  S.v56 = 1;
  v56MapMigrate();
  const live = v56UqLive();
  const bad = (it) => it && !it.my && uqKeys(it).some((k) => !live.has(k) || !UNIQUE[k]);
  let n = 0;
  if (Array.isArray(S.bag)) S.bag = S.bag.filter((it) => (bad(it) ? (n++, false) : true));
  for (const [slot, it] of Object.entries(S.equip || {})) if (bad(it)) (S.equip[slot] = null), n++;
  try {
    const st = STH || stLoad();
    const b = st.it.length;
    st.it = st.it.filter((x) => !bad(x.o));
    if (st.it.length !== b) (n += b - st.it.length), stWrite(st);
  } catch (e) {}
  // 寶石：技能已不存在，或不屬於本職業可掉落的傳說寶石
  const arch = roArchetype(S.cls);
  const badG = (g) => !g || !SKILLS[g.id] || (SKILLS[g.id].leg && SKILLS[g.id].cls !== arch);
  let m = 0;
  if (Array.isArray(S.gems)) S.gems = S.gems.filter((g) => (badG(g) ? (m++, false) : true));
  if (n || m) later(1.2, () => toast(`v5.6 舊物品清理：移除 ${n} 件已停止掉落的獨特裝備${m ? `、${m} 顆舊寶石` : ""}`, "lvl", 1));
}
function v56ItemsInstall() {
  const ns = newState;
  newState = function (...a) {
    const st = ns(...a);
    st.v56 = 1;
    return st;
  };
  const ens = roEnsureStats;
  roEnsureStats = function () {
    if (S && S.v56 !== 1) v56Migrate();
    return ens();
  };
}

// ---- 新增主線地圖（v6 起 Lv78～106）：尼芙菲姆、朱諾・魔大陸、深淵之湖、生體研究所 ----
// 怪物與頭目使用 RO 原版動畫（8 方向，縮小 0.45 倍存檔、繪製時放大回原尺寸）。
const V56_SPR = {"lod":{"job":1373,"idle":[[99,117,8,[200,200,200,200,200,200,200,200],64,96,0],[99,117,8,[200,200,200,200,200,200,200,200],64,96,117],[83,112,8,[200,200,200,200,200,200,200,200],50,96,234],[83,112,8,[200,200,200,200,200,200,200,200],50,96,346],[83,112,8,[200,200,200,200,200,200,200,200],32,96,458],[83,112,8,[200,200,200,200,200,200,200,200],32,96,570],[99,117,8,[200,200,200,200,200,200,200,200],33,96,682],[99,117,8,[200,200,200,200,200,200,200,200],33,96,799]],"walk":[[99,115,8,[200,200,200,200,200,200,200,200],64,95,0],[99,115,8,[200,200,200,200,200,200,200,200],64,95,115],[83,112,8,[200,200,200,200,200,200,200,200],50,95,230],[83,112,8,[200,200,200,200,200,200,200,200],50,95,342],[83,112,8,[200,200,200,200,200,200,200,200],32,95,454],[83,112,8,[200,200,200,200,200,200,200,200],32,95,566],[99,115,8,[200,200,200,200,200,200,200,200],33,95,678],[99,115,8,[200,200,200,200,200,200,200,200],33,95,793]],"attack":[[131,117,8,[150,150,200,150,150,200,150,200],89,95,0],[131,117,8,[150,150,200,150,150,200,150,200],89,95,117],[147,111,8,[150,150,200,150,150,200,150,200],85,95,234],[147,111,8,[150,150,200,150,150,200,150,200],85,95,345],[147,111,8,[150,150,200,150,150,200,150,200],61,95,456],[147,111,8,[150,150,200,150,150,200,150,200],61,95,567],[131,117,8,[150,150,200,150,150,200,150,200],42,95,678],[131,117,8,[150,150,200,150,150,200,150,200],42,95,795]]},"dullahan":{"job":1504,"idle":[[54,51,8,[124,124,124,186,124,124,124,186],19,45,0],[54,51,8,[124,124,124,186,124,124,124,186],19,45,51],[57,49,8,[124,124,124,186,124,124,124,186],26,42,102],[57,49,8,[124,124,124,186,124,124,124,186],26,42,151],[57,49,8,[124,124,124,186,124,124,124,186],31,42,200],[57,49,8,[124,124,124,186,124,124,124,186],31,42,249],[54,51,8,[124,124,124,186,124,124,124,186],34,45,298],[54,51,8,[124,124,124,186,124,124,124,186],34,45,349]],"walk":[[56,57,8,[50,50,100,50,50,100,50,100],21,46,0],[56,57,8,[50,50,100,50,50,100,50,100],21,46,57],[54,51,8,[50,50,100,50,50,100,50,100],24,42,114],[54,51,8,[50,50,100,50,50,100,50,100],24,42,165],[54,51,8,[50,50,100,50,50,100,50,100],29,42,216],[54,51,8,[50,50,100,50,50,100,50,100],29,42,267],[56,57,8,[50,50,100,50,50,100,50,100],34,46,318],[56,57,8,[50,50,100,50,50,100,50,100],34,46,375]],"attack":[[52,80,8,[50,100,50,100,50,100,50,100],22,62,0],[52,80,8,[50,100,50,100,50,100,50,100],22,62,80],[60,65,8,[50,100,50,100,50,100,50,100],28,57,160],[60,65,8,[50,100,50,100,50,100,50,100],28,57,225],[60,65,8,[50,100,50,100,50,100,50,100],31,57,290],[60,65,8,[50,100,50,100,50,100,50,100],31,57,355],[51,80,8,[50,100,50,100,50,100,50,100],29,62,420],[51,80,8,[50,100,50,100,50,100,50,100],29,62,500]]},"loli":{"job":1505,"idle":[[46,59,8,[200,200,200,200,200,200,200,200],12,62,0],[46,59,8,[200,200,200,200,200,200,200,200],12,62,59],[46,61,8,[200,200,200,200,200,200,200,200],31,64,118],[46,61,8,[200,200,200,200,200,200,200,200],31,64,179],[46,61,8,[200,200,200,200,200,200,200,200],14,64,240],[46,61,8,[200,200,200,200,200,200,200,200],14,64,301],[46,59,8,[200,200,200,200,200,200,200,200],34,62,362],[46,59,8,[200,200,200,200,200,200,200,200],34,62,421]],"walk":[[46,59,8,[200,200,200,200,200,200,200,200],12,62,0],[46,59,8,[200,200,200,200,200,200,200,200],12,62,59],[46,61,8,[200,200,200,200,200,200,200,200],31,64,118],[46,61,8,[200,200,200,200,200,200,200,200],31,64,179],[46,61,8,[200,200,200,200,200,200,200,200],14,64,240],[46,61,8,[200,200,200,200,200,200,200,200],14,64,301],[46,59,8,[200,200,200,200,200,200,200,200],34,62,362],[46,59,8,[200,200,200,200,200,200,200,200],34,62,421]],"attack":[[117,83,8,[200,200,200,200,200,200,200,300],46,68,0],[117,83,8,[200,200,200,200,200,200,200,300],46,68,83],[84,90,8,[200,200,200,200,200,200,200,300],50,85,166],[84,90,8,[200,200,200,200,200,200,200,300],50,85,256],[83,90,8,[200,200,200,200,200,200,200,300],33,85,346],[83,90,8,[200,200,200,200,200,200,200,300],33,85,436],[117,83,8,[200,200,200,200,200,200,200,300],70,68,526],[117,83,8,[200,200,200,200,200,200,200,300],70,68,609]]},"vesper":{"job":1685,"idle":[[61,78,6,[87,87,87,87,87,87],26,72,0],[61,78,6,[87,87,87,87,87,87],26,72,78],[61,79,6,[87,87,87,87,87,87],32,74,156],[61,79,6,[87,87,87,87,87,87],32,74,235],[61,79,6,[87,87,87,87,87,87],28,74,314],[61,79,6,[87,87,87,87,87,87],28,74,393],[61,78,6,[87,87,87,87,87,87],35,72,472],[61,78,6,[87,87,87,87,87,87],35,72,550]],"walk":[[80,108,8,[75,75,150,75,75,150,75,150],34,87,0],[80,108,8,[75,75,150,75,75,150,75,150],34,87,108],[84,119,8,[75,75,150,75,75,150,75,150],38,98,216],[84,119,8,[75,75,150,75,75,150,75,150],38,98,335],[84,119,8,[75,75,150,75,75,150,75,150],45,98,454],[84,119,8,[75,75,150,75,75,150,75,150],45,98,573],[79,108,8,[75,75,150,75,75,150,75,150],45,87,692],[79,108,8,[75,75,150,75,75,150,75,150],45,87,800]],"attack":[[105,86,8,[100,100,150,100,100,150,100,150],56,80,0],[105,86,8,[100,100,150,100,100,150,100,150],56,80,86],[104,89,8,[100,100,150,100,100,150,100,150],57,76,172],[104,89,8,[100,100,150,100,100,150,100,150],57,76,261],[104,89,8,[100,100,150,100,100,150,100,150],46,76,350],[104,89,8,[100,100,150,100,100,150,100,150],46,76,439],[104,86,8,[100,100,150,100,100,150,100,150],48,80,528],[104,86,8,[100,100,150,100,100,150,100,150],48,80,614]]},"venatu":{"job":1676,"idle":[[24,30,7,[100,100,100,100,100,100,100],9,24,0],[24,30,7,[100,100,100,100,100,100,100],9,24,30],[23,30,7,[100,100,100,100,100,100,100],11,24,60],[23,30,7,[100,100,100,100,100,100,100],11,24,90],[23,30,7,[100,100,100,100,100,100,100],11,24,120],[23,30,7,[100,100,100,100,100,100,100],11,24,150],[24,30,7,[100,100,100,100,100,100,100],15,24,180],[24,30,7,[100,100,100,100,100,100,100],15,24,210]],"walk":[[26,31,8,[62,124,124,124,62,124,124,124],13,22,0],[26,31,8,[62,124,124,124,62,124,124,124],13,22,31],[27,30,8,[62,124,124,124,62,124,124,124],16,22,62],[27,30,8,[62,124,124,124,62,124,124,124],16,22,92],[27,30,8,[62,124,124,124,62,124,124,124],10,22,122],[27,30,8,[62,124,124,124,62,124,124,124],10,22,152],[26,31,8,[62,124,124,124,62,124,124,124],12,22,182],[26,31,8,[62,124,124,124,62,124,124,124],12,22,213]],"attack":[[50,34,8,[124,124,124,124,124,124,124,186],32,26,0],[50,34,8,[124,124,124,124,124,124,124,186],32,26,34],[51,48,8,[124,124,124,124,124,124,124,186],32,42,68],[51,48,8,[124,124,124,124,124,124,124,186],32,42,116],[50,48,8,[124,124,124,124,124,124,124,186],18,42,164],[50,48,8,[124,124,124,124,124,124,124,186],18,42,212],[50,34,8,[124,124,124,124,124,124,124,186],18,25,260],[50,34,8,[124,124,124,124,124,124,124,186],18,25,294]]},"dimik":{"job":1671,"idle":[[31,40,8,[100,100,100,100,100,100,100,100],15,31,0],[31,40,8,[100,100,100,100,100,100,100,100],15,31,40],[31,41,8,[100,100,100,100,100,100,100,100],14,31,80],[31,41,8,[100,100,100,100,100,100,100,100],14,31,121],[31,41,8,[100,100,100,100,100,100,100,100],17,31,162],[31,41,8,[100,100,100,100,100,100,100,100],17,31,203],[31,40,8,[100,100,100,100,100,100,100,100],15,31,244],[31,40,8,[100,100,100,100,100,100,100,100],15,31,284]],"walk":[[42,44,8,[124,124,124,124,124,124,124,124],21,33,0],[42,44,8,[124,124,124,124,124,124,124,124],21,33,44],[35,42,8,[124,124,124,124,124,124,124,124],14,32,88],[35,42,8,[124,124,124,124,124,124,124,124],14,32,130],[35,42,8,[124,124,124,124,124,124,124,124],20,32,172],[35,42,8,[124,124,124,124,124,124,124,124],20,32,214],[42,44,8,[124,124,124,124,124,124,124,124],21,33,256],[42,44,8,[124,124,124,124,124,124,124,124],21,33,300]],"attack":[[35,40,8,[50,100,100,100,100,100,100,100],19,31,0],[35,40,8,[50,100,100,100,100,100,100,100],19,31,40],[40,45,8,[50,100,100,100,100,100,100,100],22,36,80],[40,45,8,[50,100,100,100,100,100,100,100],22,36,125],[40,45,8,[50,100,100,100,100,100,100,100],17,36,170],[40,45,8,[50,100,100,100,100,100,100,100],17,36,215],[35,40,8,[50,100,100,100,100,100,100,100],15,31,260],[35,40,8,[50,100,100,100,100,100,100,100],15,31,300]]},"detale":{"job":1719,"idle":[[86,71,6,[75,75,75,75,75,75],43,62,0],[86,71,6,[75,75,75,75,75,75],43,62,71],[97,76,6,[75,75,75,75,75,75],42,62,142],[97,76,6,[75,75,75,75,75,75],42,62,218],[97,76,6,[75,75,75,75,75,75],54,62,294],[97,76,6,[75,75,75,75,75,75],54,62,370],[86,71,6,[75,75,75,75,75,75],42,62,446],[86,71,6,[75,75,75,75,75,75],42,62,517]],"walk":[[90,70,6,[75,75,75,75,75,75],47,65,0],[90,70,6,[75,75,75,75,75,75],47,65,70],[110,79,6,[75,75,75,75,75,75],42,65,140],[110,79,6,[75,75,75,75,75,75],42,65,219],[110,79,6,[75,75,75,75,75,75],68,65,298],[110,79,6,[75,75,75,75,75,75],68,65,377],[90,70,6,[75,75,75,75,75,75],42,65,456],[90,70,6,[75,75,75,75,75,75],42,65,526]],"attack":[[90,72,7,[50,50,50,50,50,50,50],43,63,0],[90,72,7,[50,50,50,50,50,50,50],43,63,72],[103,85,7,[50,50,50,50,50,50,50],43,67,144],[103,85,7,[50,50,50,50,50,50,50],43,67,229],[103,85,7,[50,50,50,50,50,50,50],59,67,314],[103,85,7,[50,50,50,50,50,50,50],59,67,399],[90,72,7,[50,50,50,50,50,50,50],47,63,484],[90,72,7,[50,50,50,50,50,50,50],47,63,556]]},"ferus":{"job":1714,"idle":[[55,47,6,[100,100,100,100,100,100],25,41,0],[55,47,6,[100,100,100,100,100,100],25,41,47],[47,45,6,[100,100,100,100,100,100],21,39,94],[47,45,6,[100,100,100,100,100,100],21,39,139],[47,45,6,[100,100,100,100,100,100],25,39,184],[47,45,6,[100,100,100,100,100,100],25,39,229],[55,47,6,[100,100,100,100,100,100],29,41,274],[55,47,6,[100,100,100,100,100,100],29,41,321]],"walk":[[51,46,6,[62,62,62,62,62,62],25,36,0],[51,46,6,[62,62,62,62,62,62],25,36,46],[47,44,6,[62,62,62,62,62,62],20,36,92],[47,44,6,[62,62,62,62,62,62],20,36,136],[47,44,6,[62,62,62,62,62,62],26,36,180],[47,44,6,[62,62,62,62,62,62],26,36,224],[51,46,6,[62,62,62,62,62,62],25,36,268],[51,46,6,[62,62,62,62,62,62],25,36,314]],"attack":[[78,64,8,[50,100,50,100,50,100,50,100],39,52,0],[78,64,8,[50,100,50,100,50,100,50,100],39,52,64],[77,56,8,[50,100,50,100,50,100,50,100],41,50,128],[77,56,8,[50,100,50,100,50,100,50,100],41,50,184],[77,56,8,[50,100,50,100,50,100,50,100],36,50,240],[77,56,8,[50,100,50,100,50,100,50,100],36,50,296],[78,64,8,[50,100,50,100,50,100,50,100],38,52,352],[78,64,8,[50,100,50,100,50,100,50,100],38,52,416]]},"acidus":{"job":1716,"idle":[[62,50,8,[75,75,75,75,75,75,75,75],21,49,0],[62,50,8,[75,75,75,75,75,75,75,75],21,49,50],[60,54,8,[75,75,75,75,75,75,75,75],29,50,100],[60,54,8,[75,75,75,75,75,75,75,75],29,50,154],[60,54,8,[75,75,75,75,75,75,75,75],30,50,208],[60,54,8,[75,75,75,75,75,75,75,75],30,50,262],[62,50,8,[75,75,75,75,75,75,75,75],40,49,316],[62,50,8,[75,75,75,75,75,75,75,75],40,49,366]],"walk":[[62,50,8,[62,62,62,62,62,62,62,62],21,49,0],[62,50,8,[62,62,62,62,62,62,62,62],21,49,50],[60,54,8,[62,62,62,62,62,62,62,62],29,50,100],[60,54,8,[62,62,62,62,62,62,62,62],29,50,154],[60,54,8,[62,62,62,62,62,62,62,62],30,50,208],[60,54,8,[62,62,62,62,62,62,62,62],30,50,262],[62,50,8,[62,62,62,62,62,62,62,62],40,49,316],[62,50,8,[62,62,62,62,62,62,62,62],40,49,366]],"attack":[[88,78,8,[100,100,100,100,100,100,100,100],36,68,0],[88,78,8,[100,100,100,100,100,100,100,100],36,68,78],[81,77,8,[100,100,100,100,100,100,100,100],40,69,156],[81,77,8,[100,100,100,100,100,100,100,100],40,69,233],[81,77,8,[100,100,100,100,100,100,100,100],40,69,310],[81,77,8,[100,100,100,100,100,100,100,100],40,69,387],[88,78,8,[100,100,100,100,100,100,100,100],50,68,464],[88,78,8,[100,100,100,100,100,100,100,100],50,68,542]]},"seyren":{"job":1646,"idle":[[32,48,6,[100,100,100,100,100,100],14,41,0],[32,48,6,[100,100,100,100,100,100],14,41,48],[32,48,6,[100,100,100,100,100,100],14,41,96],[32,48,6,[100,100,100,100,100,100],14,41,144],[32,48,6,[100,100,100,100,100,100],14,41,192],[32,48,6,[100,100,100,100,100,100],18,41,240],[32,48,6,[100,100,100,100,100,100],18,41,288],[32,48,6,[100,100,100,100,100,100],18,41,336]],"walk":[[22,45,8,[75,75,75,75,75,75,75,75],11,39,0],[26,46,8,[75,75,75,75,75,75,75,75],14,39,45],[26,45,8,[75,75,75,75,75,75,75,75],14,39,91],[23,46,8,[75,75,75,75,75,75,75,75],14,39,136],[23,45,8,[75,75,75,75,75,75,75,75],11,39,182],[23,46,8,[75,75,75,75,75,75,75,75],9,39,227],[26,45,8,[75,75,75,75,75,75,75,75],11,39,273],[26,46,8,[75,75,75,75,75,75,75,75],11,39,318]],"attack":[[49,53,8,[50,50,50,50,50,50,50,100],23,41,0],[49,53,8,[50,50,50,50,50,50,50,100],23,41,53],[68,48,8,[50,50,50,50,50,50,50,100],37,42,106],[68,48,8,[50,50,50,50,50,50,50,100],37,42,154],[68,48,8,[50,50,50,50,50,50,50,100],30,42,202],[68,48,8,[50,50,50,50,50,50,50,100],30,42,250],[49,53,8,[50,50,50,50,50,50,50,100],25,41,298],[49,53,8,[50,50,50,50,50,50,50,100],25,41,351]]},"eremes":{"job":1635,"idle":[[32,48,6,[100,100,100,100,100,100],13,42,0],[32,48,6,[100,100,100,100,100,100],13,42,48],[32,48,6,[100,100,100,100,100,100],13,42,96],[32,48,6,[100,100,100,100,100,100],13,42,144],[32,48,6,[100,100,100,100,100,100],13,42,192],[32,48,6,[100,100,100,100,100,100],18,42,240],[32,48,6,[100,100,100,100,100,100],18,42,288],[32,48,6,[100,100,100,100,100,100],18,42,336]],"walk":[[21,46,8,[75,75,75,75,75,75,75,75],10,40,0],[23,46,8,[75,75,75,75,75,75,75,75],10,40,46],[26,43,8,[75,75,75,75,75,75,75,75],15,40,92],[22,44,8,[75,75,75,75,75,75,75,75],13,40,135],[22,45,8,[75,75,75,75,75,75,75,75],11,40,179],[22,44,8,[75,75,75,75,75,75,75,75],9,40,224],[26,43,8,[75,75,75,75,75,75,75,75],9,40,268],[23,46,8,[75,75,75,75,75,75,75,75],11,40,311]],"attack":[[32,46,8,[50,50,50,50,50,50,50,50],18,40,0],[32,46,8,[50,50,50,50,50,50,50,50],18,40,46],[41,45,8,[50,50,50,50,50,50,50,50],24,40,92],[41,45,8,[50,50,50,50,50,50,50,50],24,40,137],[41,45,8,[50,50,50,50,50,50,50,50],16,40,182],[41,45,8,[50,50,50,50,50,50,50,50],16,40,227],[32,46,8,[50,50,50,50,50,50,50,50],14,40,272],[32,46,8,[62,62,62,62,62,62,62,62],14,40,318]]},"kathryne":{"job":1639,"idle":[[32,48,6,[100,100,100,100,100,100],13,41,0],[32,48,6,[100,100,100,100,100,100],13,41,48],[32,48,6,[100,100,100,100,100,100],13,41,96],[32,48,6,[100,100,100,100,100,100],13,41,144],[32,48,6,[100,100,100,100,100,100],13,41,192],[32,48,6,[100,100,100,100,100,100],18,41,240],[32,48,6,[100,100,100,100,100,100],18,41,288],[32,48,6,[100,100,100,100,100,100],18,41,336]],"walk":[[19,44,8,[75,75,75,75,75,75,75,75],9,36,0],[20,43,8,[75,75,75,75,75,75,75,75],11,36,44],[22,40,8,[75,75,75,75,75,75,75,75],11,36,87],[21,41,8,[75,75,75,75,75,75,75,75],10,36,127],[19,41,8,[75,75,75,75,75,75,75,75],9,36,168],[21,41,8,[75,75,75,75,75,75,75,75],9,36,209],[22,40,8,[75,75,75,75,75,75,75,75],10,36,250],[20,43,8,[75,75,75,75,75,75,75,75],8,36,290]],"attack":[[28,50,8,[50,50,50,50,50,50,50,50],16,41,0],[28,50,8,[50,50,50,50,50,50,50,50],16,41,50],[30,57,8,[50,50,50,50,50,50,50,50],21,44,100],[30,57,8,[50,50,50,50,50,50,50,50],21,44,157],[30,57,8,[50,50,50,50,50,50,50,50],8,44,214],[30,57,8,[50,50,50,50,50,50,50,50],8,44,271],[27,50,8,[50,50,50,50,50,50,50,50],11,41,328],[27,50,8,[50,50,50,50,50,50,50,50],11,41,378]]}};
// 怪物種類 → 動畫鍵；新地圖頭目依地圖編號
const V56_MOB_KEY = { dullahan: "dullahan", loli: "loli", venatu: "venatu", dimik: "dimik", ferus: "ferus", acidus: "acidus", eremes: "eremes", kathryne: "kathryne" };
const V56_BOSS_KEY = { 11: "lod", 12: "vesper", 13: "detale", 14: "seyren" };
const V56_BOSS_NAME = { lod: "死靈之王", vesper: "維斯伯", detale: "迪塔勒泰晗勒斯", seyren: "賽依連・溫德" };
const V56_MOB_H = { dullahan: 15, loli: 14, venatu: 11, dimik: 12, ferus: 13, acidus: 13, eremes: 14, kathryne: 14 };
const V56_BOSS_TUNE = { 11: { hp: 1.5, sdm: 1.1 }, 12: { hp: 1.6, sdm: 1.1 }, 13: { hp: 3.4, sdm: 1.15 }, 14: { hp: 3.8, sdm: 1.2 } };
function v56MapsInstall() {
  const DN = ["south", "southwest", "west", "northwest", "north", "northeast", "east", "southeast"];
  RO.assets.monsters ||= {};
  for (const [k, v] of Object.entries(V56_SPR)) {
    const states = {};
    for (const st of ["idle", "walk", "attack"]) {
      const file = `monsters/ro56/${k}-${st}.webp`;
      const dirs = v[st].map(([fw, fh, n, du, ax, ay, oy], i) => ({ file, frameWidth: fw, frameHeight: fh, frames: n, durations: du, anchor: [ax, ay], ox: 0, oy, ks: 1 / 0.45, direction: DN[i] }));
      states[st] = { ...dirs[0], directions: dirs };
    }
    RO.assets.monsters[k] = { job: v.job, name: V56_BOSS_NAME[k] || MON[k]?.n || k, states };
  }
  Object.assign(roMonsterKeys, V56_MOB_KEY);
  Object.assign(MON_H, V56_MOB_H);
  // 地圖蒐藏卡面：新地圖用該地圖怪物的 RO 卡片插畫
  const V56_CARD_ART = { 11: "dullahan", 12: "venatu", 13: "ferus", 14: "eremes" };
  const ca = cardArt;
  cardArt = function (key, ...r) {
    const n = Number(String(key).replace(/\D/g, "")) || 0;
    return /^m\d/.test(String(key)) && V56_CARD_ART[n] ? `assets/ro/cards/${V56_CARD_ART[n]}.png` : ca.call(this, key, ...r);
  };
  // 地圖蒐藏的拖尾特效（擊殺 2 萬）
  const tc = (i, n, c, aft) => ({ ...JSON.parse(JSON.stringify(TRAIL[i])), n, c, ...(aft ? { aft } : {}) });
  if (TRAIL.length < MAP_N)
    TRAIL.push(
      tc(9, "冥火", ["#f0e0ff", "#b06aff", "#3a0a5a"], "#9a4aff"),
      tc(2, "齒輪", ["#ffffff", "#c8d8e8", "#4a5a6a"], "#a8c0d8"),
      tc(8, "龍鱗", ["#fff8d0", "#ffb03a", "#8a3a0a"], "#ff9a2a"),
      tc(7, "血霧", ["#ffd0d0", "#e04a4a", "#4a0a0a"]),
    );
  // 頭目動畫依地圖編號：舊的 11 號（活動地圖巴風特）移到最後
  if (roBossKeys.length < MAPS.length) roBossKeys.splice(11, 0, ...[11, 12, 13, 14].map((i) => V56_BOSS_KEY[i]));
  for (const [i, k] of Object.entries(V56_BOSS_KEY)) roBossKeys[+i] = k;
  Object.assign(V55_BOSS_TUNE, V56_BOSS_TUNE);
  // 守護者：最後一位守護者也會出現在新地圖
  if (GUARD.length) GUARD[GUARD.length - 1].mx = MAP_N - 1;
  // 新怪物的頭目技能沿用同類型
  Object.assign(BOSS_SKS, { dullahan: BOSS_SKS.knight, loli: BOSS_SKS.imp, venatu: BOSS_SKS.golem, dimik: BOSS_SKS.wisp, ferus: BOSS_SKS.wolf, acidus: BOSS_SKS.imp, eremes: BOSS_SKS.wolf, kathryne: BOSS_SKS.wisp });
}
// 舊存檔：活動地圖原本是 11 號，新增 4 張主線地圖後改為 SS_MAP（15 號）
function v56MapMigrate() {
  const OLD = 11,
    add = SS_MAP - OLD;
  if (!add || !Array.isArray(S.prog) || S.prog.length !== OLD + 1) return;
  const mv = (arr) => {
    if (!Array.isArray(arr)) return arr;
    const v = arr[OLD];
    const out = arr.slice(0, OLD);
    while (out.length < SS_MAP) out.push(0);
    out[SS_MAP] = v || 0;
    return out;
  };
  S.prog = mv(S.prog);
  S.beat = mv(S.beat);
  if (Array.isArray(S.mt)) {
    const v = S.mt[OLD];
    S.mt[OLD] = 0;
    S.mt[SS_MAP] = v || 0;
  }
  for (const k of Object.keys(S.kills || {}))
    if (k.startsWith(OLD + "_")) {
      S.kills[SS_MAP + k.slice(String(OLD).length)] = (S.kills[SS_MAP + k.slice(String(OLD).length)] || 0) + S.kills[k];
      delete S.kills[k];
    }
  if (S.map === OLD) S.map = SS_MAP;
  if (S.beat[OLD - 1] && S.unlocked < OLD) {
    S.unlocked = OLD;
    later(1.5, () => toast(`新地圖解鎖：${MAPS[OLD].n}（Lv78 以後的主線地圖）`, "lvl", 1));
  }
}

// ---- 地圖深淵階級：已擊敗頭目的地圖可開啟深淵 1～10 階 ----
// 怪物等級往 Lv127 提高（第 10 階＝Lv127）、生命與傷害逐階相乘；菁英、稀有度與卡片掉落提高。
// 擊敗該地圖頭目時若正在最高階，就開放下一階。
const V56_ABY = { max: 10, hp: 1.45, dmg: 1.12, elite: 2, rup: 3, card: 0.15 };
const v56AbyRow = (t) => ((S.aby ||= {})[t] ||= { m: 0, on: 0 });
// v6：全部主線地圖通關後才開放；所有地圖的深淵等級一致（第 1 階 Lv112 → 第 10 階 Lv127）
const V6_ABY_LV = [112, 127];
const v56AllClear = () => !!S?.beat && Array.from({ length: MAP_N }, (_, i) => i).every((i) => S.beat[i]);
const v56AbyLvN = (n) => (n ? Math.round(V6_ABY_LV[0] + ((V6_ABY_LV[1] - V6_ABY_LV[0]) * (n - 1)) / (V56_ABY.max - 1)) : 0);
const v56AbyMax = (t) => (t >= MAP_N || !S.beat?.[t] || !v56AllClear() ? 0 : Math.max(1, S.aby?.[t]?.m || 0));
const v56AbyTier = (t = S.map) => (t >= MAP_N || !S?.aby?.[t] ? 0 : Math.min(S.aby[t].on || 0, v56AbyMax(t)));
const v56AbyActive = () => !!(S && G && !G.arena && !G.tw && G.trial == null && G.guard == null && v56AbyTier());
function v56AbyLv(t) {
  return v56AbyLvN(v56AbyTier(t));
}
function v56AbyInstall() {
  const am = addMob;
  addMob = function (...a) {
    const n0 = G.mobs.length;
    const r = am.apply(this, a);
    if (v56AbyActive() && G.mobs.length > n0) {
      const n = v56AbyTier(),
        m = G.mobs[G.mobs.length - 1];
      m.hp = m.max = m.max * Math.pow(V56_ABY.hp, n);
      m.dmg *= Math.pow(V56_ABY.dmg, n);
      m.aby = n;
    }
    return r;
  };
  const ss = slateSum;
  slateSum = function (t, a = S.map, s) {
    const v = ss(t, a, s);
    if (a !== S.map || !v56AbyActive()) return v;
    const n = v56AbyTier();
    return t === "elite" ? v + V56_ABY.elite * n : t === "sl_rup" ? v + V56_ABY.rup * n : v;
  };
  const ok = v5OnKill;
  v5OnKill = function (m) {
    if (!v56AbyActive()) return ok(m);
    const d = V5.dropMul;
    V5.dropMul = d * (1 + V56_ABY.card * v56AbyTier());
    try {
      return ok(m);
    } finally {
      V5.dropMul = d;
    }
  };
  const bw = bossWin;
  bossWin = function () {
    const t = S.map,
      tr = G.trial,
      gd = G.guard,
      n = v56AbyTier(t);
    const had = !!S.beat[t],
      clr = v56AllClear();
    const r = bw.apply(this, arguments);
    if (tr == null && gd == null && t < MAP_N) {
      const row = v56AbyRow(t);
      if (!clr && v56AllClear()) {
        later(1.5, () => toast(`全部地圖通關！深淵開放：每張地圖都能切換深淵第 1 階（Lv${V6_ABY_LV[0]}）`, "lvl", 1));
      } else if (!clr || !had) {
      } else if (n && n >= row.m && row.m < V56_ABY.max) {
        row.m = n + 1;
        later(1.5, () => toast(`「${MAPS[t].n}」開放深淵第 ${row.m} 階`, "lvl", 1));
      }
    }
    return r;
  };
  // 地圖卡片：深淵階級選單＋顯示等級
  const mc = ui.mapCard;
  ui.mapCard = function (t) {
    let h = mc.call(this, t);
    const mx = v56AbyMax(t);
    if (!mx) return h;
    const n = v56AbyTier(t);
    if (n) h = h.replace(`LV${MAPS[t].lv[0]}-${MAPS[t].lv[1]}`, `深淵 ${n}・LV${v56AbyLv(t)}`);
    const opts = [`<option value="0"${n ? "" : " selected"}>一般</option>`]
      .concat(Array.from({ length: mx }, (_, i) => `<option value="${i + 1}"${n === i + 1 ? " selected" : ""}>深淵 ${i + 1} 階・LV${v56AbyLvN(i + 1)}</option>`))
      .join("");
    const row = `<div class="row v56aby"><span class="note">深淵階級${helpBtn("v56aby")}</span><select class="sel" data-v56aby="${t}" aria-label="深淵階級">${opts}</select></div>`;
    const i = h.lastIndexOf("</div>");
    return i > 0 ? h.slice(0, i) + row + h.slice(i) : h + row;
  };
  document.addEventListener?.("change", (e) => {
    const el = e.target?.closest?.("[data-v56aby]");
    if (!el || !S) return;
    const t = +el.dataset.v56aby,
      v = Math.max(0, Math.min(+el.value || 0, v56AbyMax(t)));
    v56AbyRow(t).on = v;
    if (t === S.map && !G.boss && !G.arena && G.trial == null) setMap(t);
    markDirty();
    ui.refreshIf("map");
  });
  HELP.v56aby = [
    "深淵階級",
    [
      ["開放", `全部 ${MAP_N} 張主線地圖的頭目都擊敗後開放，每張地圖都能進入深淵第 1 階；在最高階擊敗該地圖頭目，就開放該地圖的下一階，最高 10 階。`],
      ["怪物等級", `所有地圖一致：第 1 階 Lv${V6_ABY_LV[0]}，逐階提高，第 10 階 Lv${V6_ABY_LV[1]}。`],
      ["難度", `每階怪物生命 ×${V56_ABY.hp}、傷害 ×${V56_ABY.dmg}（逐階相乘，第 10 階生命約 ×${Math.round(Math.pow(V56_ABY.hp, 10))}、傷害約 ×${+Math.pow(V56_ABY.dmg, 10).toFixed(1)}），另外再加上等級提升。頭目同樣適用，限時內擊敗才會開放下一階。`],
      ["獎勵", `每階菁英出現率 +${V56_ABY.elite}%、裝備稀有度提升機率 +${V56_ABY.rup}%、卡片掉落率 +${V56_ABY.card * 100}%；怪物等級越高經驗值越多。`],
      ["切換", "在地圖卡片下方的選單切換；切換目前所在地圖的階級會重新進入地圖。轉職試煉、武鬥場、守護者不受影響。"],
    ],
  ];
}

// ---- 盜賊：生存力最低，但輸出要比其他職業暴力（約為其他職業平均的 1.3 倍）----
// 倍率依各流派實測（頭目 60 秒單體傷害）調整，讓 4 個流派都高於其他職業。
const V56_THIEF = { base: 1.3, br: [1.98, 1.1, 1.3, 2.4] };
const v56ThiefMul = () => {
  if (!S || S.cls !== "thief") return 1;
  const i = S.tal?.asc ? ASC.thief.findIndex((b) => b.k === S.tal.asc) : -1;
  return i >= 0 ? V56_THIEF.br[i] : V56_THIEF.base;
};
function v56ThiefInstall() {
  HIT_MUL.push({
    k: "v56:thief",
    lab: () => S.cls === "thief" && `盜賊・暴力輸出 ×${v56ThiefMul()}`,
    f: (t) => t * v56ThiefMul(),
    est: () => v56ThiefMul(),
  });
}
function v56Install() {
  v56MapsInstall();
  v56AbyInstall();
  v56ItemsInstall();
  v56ThiefInstall();
}
