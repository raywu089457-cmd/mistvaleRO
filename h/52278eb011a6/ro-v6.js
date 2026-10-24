/* 流浪仙境 v6：職業技能全面重製
   - 每個職業一個核心機制：
       劍士  極限槽（FF7 Limit Break）       弓箭手  專注距離＋第四擊（LoL 燼）
       魔法師 元素印記與反應（鬼谷八荒五行）   盜賊    連擊點與潛行（LoL 劫、上古卷軸）
       服事  氣球（RO 武僧氣彈）               商人    Zeny 與手推車重量（RO 原版）
   - 主動技能不再跨職業換皮：每種招式只屬於一個職業。
   - 新招式由 v6Cast() 在引擎的 castSkillRaw 最前面接手（支援、天賦、變異照常套用）。
   載入順序：ro-v5.js → ro-v6.js → ro-content.js（roV4Install 結束後再安裝執行期部分）。 */
"use strict";

// ===========================================================================
// 0. 共用工具
// ===========================================================================
const v6G = () => (G.v6 ||= { fx: [], ents: [], lim: 0, limCast: 0, cp: 0, sph: 0, sphT: 0, heat: 0, n4: 0, nb: 0, buf: {}, combo: 0, comboT: 0, song: -1, cpT: 0 });
const v6Cls = () => (S ? S.cls : null);
const v6Buf = (k) => (G && G.v6 && G.v6.buf[k] > G.t ? 1 : 0);
const v6SetBuf = (k, d) => {
  const g = v6G();
  g.buf[k] = Math.max(g.buf[k] || 0, G.t + d);
};
const v6Tal = (k) => (typeof tal === "function" && PS ? tal(k) : 0);
const V6_C = {
  fire: ["#ff8a3a", "#ffd27a", "#b0300a"],
  water: ["#7ad4ff", "#e0faff", "#2a6ab0"],
  wind: ["#e8e070", "#fffbd0", "#9a8a2a"],
  earth: ["#c89a5a", "#efd3a0", "#6a4a2a"],
  holy: ["#fff1ae", "#ffffff", "#e0c060"],
  shadow: ["#b08aff", "#e8d8ff", "#3a1a6a"],
  ghost: ["#c8b0ff", "#ffffff", "#6a5aa0"],
  poison: ["#9ad84a", "#e0ffb0", "#3a6a1a"],
  neutral: ["#ffffff", "#fff2c0", "#c8c0a8"],
  gold: ["#ffe08a", "#fff6c8", "#b08a1a"],
};
function v6Opts(g, m, ex) {
  const sk = SKILLS[g.id];
  return Object.assign(
    {
      skill: 1,
      crit: m.crit,
      critm: m.critm,
      ail: sk.ail,
      ailx: PS.ail * (1 + m.ail),
      ovk: m.ovk,
      chn: m.chn,
      tg: sk.tg,
      pcap: PS.psnMax + m.pstk,
      v6sk: g.id,
      v6el: sk.el,
      // 這次施放的來源寶石與累積計數：延遲命中（投射物、連段、持續招式）也沿用施放當下的資料
      v6g: g,
      v6c: { lim: 0, grace: 0 },
    },
    ex || {},
  );
}
const v6Hit = (mob, mult, o, ex) => (alive(mob) ? hitMob(mob, mult, ex ? Object.assign({}, o, ex) : o) : 0);
const v6Near = (x, y, r) => mobsNear(x, y, r);
// 線段範圍
function v6Line(x, y, x2, y2, w) {
  return G.mobs.filter((m) => m.spawnT <= 0 && segDist(m.x, m.y - 3, x, y, x2, y2) <= w + (m.boss ? 6 : 0));
}
// 扇形範圍（面向 a、半角 h、半徑 R）
function v6Cone(x, y, a, h, R) {
  return G.mobs.filter((m) => {
    if (m.spawnT > 0) return false;
    const dx = m.x - x,
      dy = m.y - 3 - y,
      d = Math.hypot(dx, dy);
    if (d > R + (m.boss ? 8 : 0)) return false;
    if (d < 6) return true;
    let da = Math.atan2(dy, dx) - a;
    da = Math.atan2(Math.sin(da), Math.cos(da));
    return Math.abs(da) <= h;
  });
}
const v6Stun = (m, d) => {
  if (!alive(m)) return;
  const k = m.boss ? 0.25 : m.elite ? 0.6 : 1;
  m.root = Math.max(m.root || 0, d * k);
  m.atk = Math.max(m.atk || 0, d * k);
  m.v6stun = G.t + d * k;
};
const v6Fx = (o) => {
  v6G().fx.push(Object.assign({ t: 0, life: 0.4 }, o));
};
const v6Ro = (id, x, y, o) => {
  try {
    roFxAdd(id, x, y, o || {});
  } catch (e) {}
};
const v6Clamp = (x, y) => [clamp(x, 6, G.W - 6), clamp(y, G.top + 4, G.H - 4)];
// 持續實體（區域、投射物、環繞物）
const v6Ent = (o) => {
  const e = Object.assign({ t: 0, life: 1, iv: 0.5, acc: 0 }, o);
  if (e.zone) e.life *= 1 + v6Tal("gndT");
  v6G().ents.push(e);
  return e;
};

// ===========================================================================
// 1. 核心機制
// ===========================================================================
// ---- 劍士：盾牌迴旋的護甲加成（每 100 護甲 +1.5%，與護甲轉傷害相加）----
const V6_SHB_ARM = 0.015;
// ---- 劍士：極限槽 ----
const V6_LIM = { skillHit: 3, castCap: 12, basic: 1.5, hurt: 60, mul: 2.5, area: 1.3 };
// 極限技只由會造成傷害的技能施放（挑釁這類無傷害技能不會耗掉滿槽）
const v6LimOk = (sk) => !!sk && (sk.hit > 0 || (sk.tg || []).includes("minion"));
function v6LimAdd(v) {
  if (v6Cls() !== "sword" || G.dead) return;
  const g = v6G();
  g.lim = Math.min(100, g.lim + v * (1 + v6Tal("v6limGain")));
}
// ---- 弓箭手：專注距離＋第四擊 ----
const V6_FOCUS = { near: 20, far: 80, max: 0.4, nth: 4, nthMul: 1.6, nthProj: 2 };
const v6FocusMul = (m) => {
  if (v6Cls() !== "bow" || !m || !G.pl) return 1;
  const d = Math.hypot(m.x - G.pl.x, m.y - G.pl.y);
  return 1 + clamp((d - V6_FOCUS.near) / (V6_FOCUS.far - V6_FOCUS.near), 0, 1) * V6_FOCUS.max * (1 + v6Tal("v6focus"));
};
// ---- 魔法師：元素印記與反應 ----
const V6_ELS = ["fire", "water", "wind", "earth"];
const V6_EL_N = { fire: "火", water: "水", wind: "風", earth: "地" };
const V6_REACT = {
  "fire+water": { n: "蒸發", k: 1.8 },
  "fire+wind": { n: "爆燃", k: 1.0, r: 18 },
  "water+wind": { n: "感電", k: 0.8, cnt: 3 },
  "earth+water": { n: "泥沼", k: 0.6, root: 2, r: 16 },
  "earth+fire": { n: "熔岩", k: 0.35, dur: 3, r: 14 },
  "earth+wind": { n: "沙暴", k: 1.0, r: 18 },
};
const V6_MARK_T = 4;
// ---- 盜賊：連擊點 ----
const V6_CP = { max: 5, per: 0.4, basicIv: 0.35, sneak: 3 };
const v6CpMax = () => V6_CP.max + v6Tal("v6cpMax");
function v6CpAdd(n) {
  if (v6Cls() !== "thief") return;
  const g = v6G();
  g.cp = Math.min(v6CpMax(), g.cp + n);
}
// ---- 服事：氣球 ----
const V6_SPH = { max: 5, iv: 2.5 };
const v6SphMax = () => V6_SPH.max + v6Tal("v6sphMax");
function v6SphAdd(n) {
  if (v6Cls() !== "acolyte") return;
  const g = v6G();
  g.sph = Math.min(v6SphMax(), g.sph + n);
}
// ---- 商人：手推車重量與 Zeny ----
const V6_CART = { k: 0.6, full: 100 }; // v7.2：滿載改為 100 件（RO 手推車上限；原本以背包上限 5000 件計算，加成幾乎為 0）
const v6CartMul = () => (v6Cls() === "merchant" ? 1 + V6_CART.k * (1 + v6Tal("v6cart")) * clamp((S.bag?.length || 0) / V6_CART.full, 0, 1) : 1);
function v6PayZeny(k) {
  const z = Math.round(k * Math.max(1, S.lvl) * (1 - Math.min(0.6, v6Tal("v6zeny"))));
  if (S.ash < z) return 0;
  S.ash -= z;
  (G.v6.zSpent ||= 0), (G.v6.zSpent += z);
  return z;
}
// ---- 機匠熱量 ----
const V6_HEAT = { max: 100, decay: 6, boom: 4 };

// ===========================================================================
// 2. 技能表
// ===========================================================================
// 形狀
const V6_SH = {
  I2: [[0, 0], [1, 0]],
  I3: [[0, 0], [1, 0], [2, 0]],
  L3: [[0, 0], [1, 0], [0, 1]],
  T4: [[0, 0], [-1, 0], [1, 0], [0, 1]],
  S4: [[0, 0], [1, 0], [1, 1], [2, 1]],
  O4: [[0, 0], [1, 0], [0, 1], [1, 1]],
  L4: [[0, 0], [0, 1], [0, 2], [1, 2]],
  I4: [[0, 0], [1, 0], [2, 0], [3, 0]],
  P5: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]],
};
// 主動技能：
//   id, 職業, 名稱, 招式（v6 招式名或 "base:引擎招式"）, 傷害, 冷卻, 標籤, 屬性, 異常, RO 圖示, 形狀, 說明, 其他
// 說明中的 {hit} 會換成傷害百分比。
const V6_ACT = [
  // ---------------- 劍士 ----------------
  ["sw_bash", "sword", "狂擊", "bash", 4.0, 3.5, [], "neutral", null, 5, "I2", "重擊目標造成 {hit}% 武器傷害並暈眩 0.8 秒。"],
  ["sw_magnum", "sword", "怒爆", "magnum", 2.3, 5, ["aoe", "elem"], "fire", "brn", 7, "T4", "以火焰震開周圍敵人，造成 {hit}% 武器傷害並燃燒；之後 4 秒普通攻擊附帶火焰（+25% 傷害）。"],
  ["sw_bowl", "sword", "保齡球擊", "bowl", 3.4, 3.5, ["aoe"], "neutral", null, 62, "S4", "把目標轟飛：造成 {hit}% 武器傷害，被撞到的敵人受到一半傷害並被撞飛，可再連鎖撞擊 1 次。"],
  ["sw_brandish", "sword", "騎乘攻擊", "base:thrust", 1.8, 2.5, ["aoe"], "neutral", null, 57, "T4", "騎乘突進，向前方三個方向刺擊，每道造成 {hit}% 武器傷害並擊退。"],
  ["sw_charge", "sword", "衝鋒攻擊", "base:leap", 3.0, 6, ["aoe"], "neutral", null, 1001, "L4", "躍向怪物最密集處重擊地面，周圍敵人受到 {hit}% 武器傷害並被擊退。"],
  ["sw_shboom", "sword", "盾牌迴旋", "shboom", 1.9, 2.5, ["proj"], "neutral", null, 251, "I3", "擲出盾牌飛向目標再飛回，去程與回程各造成 {hit}% 武器傷害；每 100 護甲傷害 +1.5%（與「護甲轉傷害」天賦相加計算）。"],
  ["sw_gcross", "sword", "聖十字審判", "gcross", 4.4, 4, ["aoe", "spell", "holy"], "holy", null, 254, "T4", "消耗目前生命 6%，以自身為中心降下十字聖光，造成 {hit}% 武器傷害；每擊中 1 名敵人回復 2% 最大生命（最多 10%）。"],
  ["sw_provoke", "sword", "挑釁", "base:taunt", 0, 8, ["aoe"], "neutral", null, 6, "I2", "嘲諷周圍敵人 4 秒：牠們立刻追擊你，對你造成的傷害 -25%。"],
  ["sw_spiral", "sword", "螺旋擊刺", "spiral", 0.9, 4, [], "neutral", null, 397, "L3", "對目標連續刺擊 5 次，每次造成 {hit}% 武器傷害，且每一擊比前一擊多 20%（合計約 630%）。"],
  ["sw_berserk", "sword", "狂暴", "base:frenzy", 0, 0, [], "neutral", null, 359, "I2", "光環：常駐開啟，所有傷害 ×1.35；戰鬥中每秒失去 4% 生命（最低剩 1 點，不會致死）。"],
  ["sw_wave", "sword", "劍氣衝擊", "base:swave", 2.2, 2.5, ["proj"], "neutral", null, 2002, "I3", "揮出一道劍氣飛向敵人，造成 {hit}% 武器傷害。"],
  ["sw_breath", "sword", "龍之吐息", "breath", 0.85, 5, ["aoe", "elem"], "fire", "brn", 2008, "P5", "向前方噴出龍息（扇形），0.6 秒內造成 4 次 {hit}% 武器傷害並燃燒；每次再附加 0.6% 最大生命的傷害。"],
  ["sw_ignite", "sword", "點燃爆破", "ignite", 2.2, 4, ["aoe", "elem"], "fire", "brn", 2006, "O4", "0.35 秒後盧恩之火在身旁爆炸：外圈造成 {hit}% 武器傷害，內圈（一半半徑）傷害 ×1.6。"],
  ["sw_frost", "sword", "冰霜龍息", "base:frostsl", 2.5, 5, ["aoe", "elem"], "water", "chl", 5004, "L4", "重擊前方地面，冰刺範圍內的敵人受到 {hit}% 武器傷害並冰緩。"],
  // ---------------- 弓箭手 ----------------
  ["bw_double", "bow", "二連矢", "double", 1.5, 1.6, ["proj"], "neutral", null, 46, "I2", "快速射出 2 支箭，每支造成 {hit}% 武器傷害。"],
  ["bw_shower", "bow", "箭雨", "base:rain", 1.1, 4, ["aoe", "proj"], "neutral", null, 47, "T4", "在怪物最密集處降下 4 波箭雨，每波 {hit}% 武器傷害。"],
  ["bw_blitz", "bow", "獵鷹突擊", "blitz", 0.75, 3, ["minion"], "wind", null, 129, "L3", "獵鷹俯衝目標附近，5 次攻擊分散打擊最多 3 名敵人，每次 {hit}% 武器傷害。放在技能盤上時，普通攻擊有 12% 機率觸發 1 次（傷害 50%）。"],
  ["bw_ankle", "bow", "定位陷阱", "base:trap", 2.9, 3, ["aoe", "trap"], "neutral", null, 117, "O4", "在敵人腳下投出陷阱（最多 3 個），觸發時爆炸造成 {hit}% 武器傷害並定身。"],
  ["bw_varrow", "bow", "毒箭", "base:varrow", 1.5, 2, ["proj", "psn"], "poison", null, 1004, "I2", "射出毒箭造成 {hit}% 武器傷害，並使目標中毒 4 秒。"],
  ["bw_corrode", "bow", "腐蝕引爆", "corrode", 1.0, 4, ["aoe", "psn"], "poison", null, 2031, "T4", "引爆目標周圍的毒素：範圍內敵人受到 {hit}% 武器傷害，身上的中毒立刻結算剩餘傷害的 140% 並解除。"],
  ["bw_sharp", "bow", "銳利射擊", "sharp", 3.0, 3, ["proj"], "neutral", null, 382, "I3", "射出貫穿直線上所有敵人的箭，造成 {hit}% 武器傷害，暴擊率 +40%。"],
  ["bw_snipe", "bow", "蓄力狙擊", "snipe", 7.0, 5.5, ["proj"], "neutral", null, 381, "I4", "瞄準 0.6 秒後射出狙擊箭，對目標造成 {hit}% 武器傷害；距離超過 60 時再 ×1.5。"],
  ["bw_burst", "bow", "爆裂箭", "base:exarrow", 0.7, 2.5, ["proj", "aoe"], "fire", null, 2288, "L3", "射出附著於敵人身上的箭，造成 {hit}% 武器傷害；同一敵人累積 5 支（或 4 秒後）同時爆炸。"],
  ["bw_song", "bow", "布拉奇之詩", "song", 0, 8, ["spell"], "neutral", null, 319, "I2", "演奏 8 秒的樂章，依序切換：攻擊速度 +25% → 冷卻縮減 20% → 傷害 +25%；每次施放換下一首。"],
  ["bw_bsong", "bow", "樂靈合奏", "base:summon", 0, 3, ["minion", "spell"], "neutral", null, 316, "T4", "召喚 2 隻樂靈，自動搜尋怪物並從遠處發射音波彈。"],
  ["bw_disso", "bow", "不協和音", "disso", 1.0, 3, ["aoe", "spell"], "neutral", null, 317, "L3", "從自身擴散 3 道音波圈，每道對碰到的敵人造成 {hit}% 武器傷害。"],
  // ---------------- 魔法師 ----------------
  ["mg_fireball", "mage", "火球術", "base:fire", 2.4, 2.6, ["proj", "spell", "aoe", "elem"], "fire", "brn", 17, "T4", "火球命中造成 {hit}% 武器傷害並爆炸，使敵人燃燒。"],
  ["mg_frost", "mage", "霜凍之術", "base:nova", 2.0, 3.5, ["aoe", "spell", "elem"], "water", "chl", 88, "O4", "對周圍造成 {hit}% 武器傷害並冰緩。"],
  ["mg_bolt", "mage", "雷擊術", "base:chain", 1.8, 2.2, ["aoe", "spell", "elem", "chn"], "wind", "shk", 20, "S4", "閃電擊中目標後連鎖到附近 2 個敵人，每次 {hit}% 武器傷害並感電。"],
  ["mg_quake", "mage", "崩裂術", "base:fissure", 2.2, 3, ["aoe", "spell", "elem"], "earth", null, 91, "I3", "大地崩裂，直線上的敵人受到 {hit}% 武器傷害；裂縫持續 3 秒。"],
  ["mg_meteor", "mage", "隕石術", "base:meteor", 4.8, 5, ["aoe", "spell", "elem"], "fire", "brn", 83, "P5", "在敵人最密集處標出落點，1.2 秒後砸下造成 {hit}% 武器傷害並燃燒。"],
  ["mg_storm", "mage", "暴風雪", "base:bliz", 0.65, 6, ["aoe", "spell", "elem"], "water", "chl", 89, "L4", "降下暴風雪 4 秒，每 0.5 秒造成 {hit}% 武器傷害並冰緩。"],
  ["mg_lov", "mage", "怒雷強擊", "lov", 0.9, 7, ["aoe", "spell", "elem"], "wind", "shk", 85, "O4", "詠唱 0.8 秒後，目標周圍落下 10 道雷擊，每道造成 {hit}% 武器傷害並感電。"],
  ["mg_field", "mage", "元素領域", "field", 0.25, 7, ["aoe", "spell", "elem"], "earth", null, 285, "T4", "在目標處展開 6 秒的元素領域（每次施放依序換成火山→洪水→狂風→地脈）：每 0.5 秒對範圍內敵人造成 {hit}% 武器傷害並烙上該元素印記。"],
  ["mg_spirits", "mage", "召喚元素精靈", "base:summon", 0, 3, ["minion", "spell", "elem"], "neutral", null, 2457, "T4", "召喚 2 隻元素精靈（火、冰、雷輪替），自動搜尋怪物並遠程攻擊。"],
  ["mg_tetra", "mage", "四元素漩渦", "tetra", 1.0, 4, ["spell", "elem"], "fire", null, 2217, "S4", "依序以火、水、風、地 4 種元素打擊目標，每次 {hit}% 武器傷害；4 次元素會連續觸發元素反應。"],
  ["mg_quag", "mage", "泥沼地", "base:cslw", 0, 4, ["aoe", "spell", "curse"], "earth", null, 92, "I2", "詛咒目標周圍的敵人 6 秒：移動與攻擊速度 -30%。"],
  ["mg_gravity", "mage", "重力場", "gravity", 0.55, 8, ["aoe", "spell"], "ghost", null, 361, "O4", "在目標處製造 5 秒的重力場，把敵人拉向中心，每 0.5 秒造成 {hit}% 武器傷害。"],
  ["mg_napalm", "mage", "念力爆發", "napalm", 1.6, 2.5, ["proj", "spell"], "ghost", null, 400, "L3", "射出 3 顆念力彈，分別飛向不同的敵人，每顆造成 {hit}% 武器傷害並小範圍爆炸。"],
  // ---------------- 盜賊 ----------------
  ["th_slash", "thief", "鋒刃連斬", "slash", 1.0, 2, [], "neutral", null, 48, "I2", "快速斬擊目標 3 次，每次 {hit}% 武器傷害；獲得 2 連擊點。"],
  ["th_sonic", "thief", "音速投擲", "sonic", 0.55, 4, [], "neutral", null, 136, "L3", "終結技：對目標連續斬擊 8 次，每次 {hit}% 武器傷害；消耗全部連擊點，每點傷害 +40%。"],
  ["th_venom", "thief", "毒刃", "base:venom", 1.5, 2.5, ["aoe", "psn"], "poison", null, 52, "T4", "斬擊目標，毒液在周圍炸開造成 {hit}% 武器傷害並中毒；獲得 2 連擊點。"],
  ["th_envenom", "thief", "毒素爆發", "envenom", 1.5, 3, ["aoe", "psn"], "poison", null, 378, "O4", "終結技：引爆目標與周圍敵人的毒素，造成 {hit}% 武器傷害並立刻結算剩餘中毒傷害；消耗全部連擊點，每點 +40%。"],
  ["th_hide", "thief", "隱匿", "hide", 0, 9, [], "shadow", null, 51, "I2", "進入隱匿 2.5 秒：受到的傷害 -80%；下一次技能擊中為「偷襲」，傷害 ×3 並結束隱匿；獲得 2 連擊點。"],
  ["th_backstab", "thief", "背刺", "base:blink", 3.6, 3, [], "shadow", null, 212, "L3", "瞬步至目標身旁，造成 {hit}% 武器傷害；隱匿中使用會觸發偷襲。"],
  ["th_snatch", "thief", "強奪", "snatch", 2.0, 2.5, [], "neutral", null, 50, "S4", "攻擊目標造成 {hit}% 武器傷害並奪取力量：6 秒內傷害 +15%（最多 3 層），並撿到少量 Zeny；獲得 2 連擊點。"],
  ["th_clone", "thief", "殘影分身", "clone", 0, 10, [], "shadow", null, 49, "O4", "召喚殘影 6 秒：你施放的每個技能都由 2 個殘影各重複 1 次（35% 傷害）。"],
  ["th_mark", "thief", "暗影印記", "mark", 1.5, 3, [], "shadow", null, 2037, "L3", "攻擊目標造成 {hit}% 武器傷害並烙上暗影印記 8 秒：受到你的傷害 +30%；被印記的敵人死亡時，印記跳到最近的敵人並給你 2 連擊點。"],
  ["th_weak", "thief", "弱點詛咒", "base:cvul", 0, 4, ["aoe", "spell", "curse"], "shadow", null, 2297, "I2", "詛咒目標周圍的敵人 6 秒：受到的傷害 +25%。"],
  ["th_dual", "thief", "二刀流", "base:dance", 0, 0, [], "neutral", null, 48, "I2", "光環：普攻擊中獲得氣勢（最多 10 層），每層攻擊速度 +5%、移動速度 +3%。"],
  // ---------------- 服事 ----------------
  ["ac_light", "acolyte", "神聖之光", "holy", 2.5, 2, ["spell", "holy"], "holy", null, 156, "I2", "在目標身上降下光柱，造成 {hit}% 武器傷害（小範圍）。"],
  ["ac_heal", "acolyte", "治癒術", "heal", 1.5, 4, ["spell", "aoe", "holy"], "holy", null, 28, "I2", "回復 25% 最大生命；溢出的治療量化為聖光，對周圍敵人造成 {hit}% 武器傷害 ×（1 + 溢出比例 ×3）。"],
  ["ac_sanct", "acolyte", "光耀之堂", "sanct", 0.35, 8, ["spell", "aoe", "holy"], "holy", null, 70, "O4", "在腳下展開 6 秒的聖域：每 0.5 秒回復 1.5% 最大生命，並對範圍內敵人造成 {hit}% 武器傷害。"],
  ["ac_wrath", "acolyte", "天使之怒", "base:cwk", 0, 4, ["aoe", "spell", "curse", "holy"], "holy", null, 78, "I2", "詛咒目標周圍的敵人 6 秒：牠們造成的傷害 -25%。"],
  ["ac_magnus", "acolyte", "十字驅魔攻擊", "magnus", 0.5, 7, ["spell", "aoe", "holy"], "holy", null, 79, "T4", "在目標處展開 5 秒的十字聖域，每 0.5 秒對十字範圍內的敵人造成 {hit}% 武器傷害。"],
  ["ac_orbs", "acolyte", "聖靈環繞", "orbs", 0.6, 10, ["minion", "spell", "holy"], "holy", null, 13, "L4", "召喚 3 顆聖靈繞著你旋轉 10 秒，碰到敵人時造成 {hit}% 武器傷害（每顆每 0.4 秒 1 次）。召喚物輔助可增加數量與傷害。"],
  ["ac_call", "acolyte", "練氣", "call", 0, 6, [], "ghost", null, 261, "I2", "立刻凝聚 3 顆氣球，4 秒內攻擊速度 +20%。"],
  ["ac_asura", "acolyte", "阿修羅霸凰拳", "asura", 3.0, 6, [], "ghost", null, 271, "L3", "終結技：衝向目標施放終結之拳，造成 {hit}% 武器傷害；消耗全部氣球，每顆傷害 +80%（至少需要 3 顆）。"],
  ["ac_combo", "acolyte", "連打掌", "combo", 1.6, 1.2, ["aoe"], "ghost", null, 272, "S4", "三段連招：第 1 段單體 {hit}%＋1 顆氣球、第 2 段前方扇形 ×0.9、第 3 段目標周圍 ×1.5；每次施放推進一段。"],
  ["ac_finger", "acolyte", "指彈", "finger", 1.2, 2, ["proj"], "ghost", null, 267, "I2", "每顆氣球射出 1 發氣彈（沒有氣球時 1 發），每發造成 {hit}% 武器傷害；消耗全部氣球。"],
  ["ac_knuckle", "acolyte", "閃電步", "knuckle", 2.2, 3, ["aoe"], "ghost", null, 264, "I3", "朝目標方向閃電突進，路徑上的敵人受到 {hit}% 武器傷害；獲得 1 顆氣球。"],
  ["ac_rampage", "acolyte", "大纏崩捶", "rampage", 1.6, 5, ["aoe"], "ghost", null, 2327, "O4", "以自身為中心擴散衝擊波，每名敵人受到 {hit}% 武器傷害；消耗全部氣球，每顆 +40%。"],
  // ---------------- 商人 ----------------
  ["mc_mammon", "merchant", "金錢攻擊", "mammon", 3.6, 3.5, [], "neutral", null, 42, "I2", "以金錢的力量重擊目標，造成 {hit}% 武器傷害；支付 5×等級 Zeny 時傷害 ×1.6。"],
  ["mc_cartrev", "merchant", "手推車攻擊", "cartrev", 2.0, 3, ["aoe"], "neutral", null, 153, "T4", "用手推車橫掃前方半圓，造成 {hit}% 武器傷害並擊退；受手推車重量加成。"],
  ["mc_hfall", "merchant", "大地之擊", "hammer", 2.6, 5, ["aoe"], "earth", null, 110, "O4", "以鐵鎚砸向目標處，範圍內敵人受到 {hit}% 武器傷害並暈眩 1.2 秒。"],
  ["mc_term", "merchant", "手推車終結", "term", 3.0, 5, ["aoe"], "neutral", null, 485, "L4", "推著手推車衝過敵群，路徑上的敵人受到 {hit}% 武器傷害（受手推車重量加成）；支付 10×等級 Zeny 時 ×1.5。"],
  ["mc_homun", "merchant", "生命體召喚", "base:guard", 0, 3, ["minion"], "neutral", null, 243, "T4", "召喚 1 隻生命體，嘲諷周圍的敵人並攻擊；生命為你最大生命的 50%。"],
  ["mc_acidbomb", "merchant", "強酸火煙瓶", "acid", 2.3, 3, ["aoe", "psn"], "poison", null, 490, "L3", "投擲強酸瓶，範圍內敵人受到 {hit}% 武器傷害並中毒，且護甲腐蝕 5 秒（受到的傷害 +20%）。"],
  ["mc_firebomb", "merchant", "火焰瓶", "firebomb", 0.4, 6, ["aoe", "elem"], "fire", "brn", 229, "T4", "投擲火焰瓶，目標處燃起 4 秒火海，每 0.5 秒造成 {hit}% 武器傷害並燃燒。"],
  ["mc_faw", "merchant", "FAW 砲台設置", "base:turret", 0.5, 4, ["minion", "proj"], "neutral", null, 2281, "O4", "在身旁架起 FAW 魔導機甲砲台（最多 2 座），持續 12 秒自動射擊。"],
  ["mc_cannon", "merchant", "機甲加農砲", "cannon", 3.0, 2.5, ["proj", "aoe"], "fire", null, 2259, "I3", "發射加農砲彈，命中造成 {hit}% 武器傷害並小範圍爆炸；累積 25 熱量。"],
  ["mc_axe", "merchant", "斧頭龍捲", "axe", 0.55, 6, ["aoe"], "neutral", null, 2279, "S4", "揮斧旋轉 2 秒，跟著你移動，每 0.25 秒對周圍造成 {hit}% 武器傷害；累積 30 熱量。"],
  ["mc_miasma", "merchant", "毒雲", "base:miasma", 0.4, 5, ["aoe", "spell", "psn"], "poison", null, 2032, "O4", "在目標處放出毒雲 5 秒，每 0.5 秒造成 {hit}% 武器傷害並中毒。"],
  ["mc_plant", "merchant", "地獄植物", "plant", 0.6, 8, ["minion", "aoe"], "earth", null, 8018, "T4", "在目標周圍種下 3 株地獄植物 8 秒，每株每 0.6 秒咬一次身旁的敵人，造成 {hit}% 武器傷害。召喚物輔助可增加數量與傷害。"],
  ["mc_spore", "merchant", "孢子爆炸", "spore", 2.8, 4, ["aoe", "psn"], "poison", null, 2032, "L3", "丟出孢子囊，0.8 秒後爆炸，範圍內敵人受到 {hit}% 武器傷害並中毒。"],
];

// 新輔助（核心機制專用）：id, 職業, 名稱, 限定標籤, RO 圖示, 形狀, 說明
const V6_SUP = [
  ["sw_limit", "sword", "極限突破", null, 357, "L3", "相鄰技能累積的極限槽 ×2；由它施放極限技時，極限技傷害再 +50%。"],
  ["sw_parry", "sword", "反擊架式", null, 61, "I2", "你受到傷害時，自動以 80% 傷害施放相鄰技能（每 1.5 秒最多 1 次，不需冷卻）。"],
  ["bw_fourth", "bow", "第四箭", null, 45, "L3", "每第 4 次普通攻擊，自動以 60% 傷害施放相鄰技能（不需冷卻）。"],
  ["bw_range", "bow", "遠距精通", null, 43, "I2", "相鄰技能的「專注距離」加成 ×2。"],
  ["mg_reson", "mage", "元素共鳴", null, 366, "L3", "相鄰技能觸發的元素反應傷害 +60%。"],
  ["mg_conv", "mage", "元素轉換", "elem", 279, "I2", "相鄰的元素技能擊中有印記的敵人時，一定會觸發元素反應（自動轉成能反應的元素）。"],
  ["th_finish", "thief", "致命終結", "fin", 137, "L3", "相鄰的終結技每個連擊點再 +10% 傷害，施放後返還 1 點連擊點。"],
  ["th_step", "thief", "暗影步", null, 51, "I2", "施放相鄰技能後隱匿 1 秒：下一次技能擊中為半偷襲（傷害 ×1.5）。"],
  ["ac_focus", "acolyte", "氣功凝聚", "sph", 261, "L3", "相鄰的消耗氣球技能施放後返還 1 顆氣球。"],
  ["ac_grace", "acolyte", "恩典", null, 66, "I2", "相鄰技能每擊中 1 名敵人回復 1% 最大生命（每次施放最多 5%）。"],
  ["mc_invest", "merchant", "金錢投入", null, 41, "L3", "相鄰技能每次施放支付 3×等級 Zeny，傷害 ×1.5（Zeny 不足時無效）。"],
  ["mc_heavy", "merchant", "重型手推車", null, 39, "I2", "相鄰技能也享有手推車重量加成，且加成 ×2。"],
];
// 各職業的技能清單（主動在前、輔助、被動）
const V6_CLASS = {
  sword: {
    act: ["sw_bash", "sw_magnum", "sw_bowl", "sw_brandish", "sw_charge", "sw_shboom", "sw_gcross", "sw_provoke", "sw_spiral", "sw_berserk", "sw_wave", "sw_breath", "sw_ignite", "sw_frost"],
    sup: ["fury", "sw_quick", "sw_brand", "sw_crit", "sw_counter", "sw_runeb", "conc", "sacr", "sw_limit", "sw_parry"],
  },
  bow: {
    act: ["bw_double", "bw_shower", "bw_blitz", "bw_ankle", "bw_varrow", "bw_corrode", "bw_sharp", "bw_snipe", "bw_burst", "bw_song", "bw_bsong", "bw_disso"],
    sup: ["prec", "multi", "mproj", "overk", "bw_quick", "bw_poison", "bw_trap", "bw_ens", "bw_ens2", "bw_falcon", "bw_fourth", "bw_range"],
  },
  mage: {
    act: ["mg_fireball", "mg_frost", "mg_bolt", "mg_quake", "mg_meteor", "mg_storm", "mg_lov", "mg_field", "mg_spirits", "mg_tetra", "mg_quag", "mg_gravity", "mg_napalm"],
    sup: ["amp", "ailx", "spread", "cot", "bigarea", "chainp", "mg_spirit", "mg_spirit2", "mg_prec", "mg_conc", "mg_quick", "mg_proj", "mg_reson", "mg_conv"],
  },
  thief: {
    act: ["th_slash", "th_sonic", "th_venom", "th_envenom", "th_hide", "th_backstab", "th_snatch", "th_clone", "th_mark", "th_weak", "th_dual"],
    sup: ["mstrike", "pstack", "th_quick", "th_crit", "th_shadow", "th_instinct", "th_area", "th_ambush", "th_toxin", "th_finish", "th_step"],
  },
  acolyte: {
    act: ["ac_light", "ac_heal", "ac_sanct", "ac_wrath", "ac_magnus", "ac_orbs", "ac_call", "ac_asura", "ac_combo", "ac_finger", "ac_knuckle", "ac_rampage"],
    sup: ["haste", "ac_bless", "ac_ray", "ac_triple", "ac_spirit", "ac_angel", "ac_angel2", "ac_area", "ac_fury", "ac_holy", "ac_focus", "ac_grace"],
  },
  merchant: {
    act: ["mc_mammon", "mc_cartrev", "mc_hfall", "mc_term", "mc_homun", "mc_acidbomb", "mc_firebomb", "mc_faw", "mc_cannon", "mc_axe", "mc_miasma", "mc_plant", "mc_spore"],
    sup: ["mcount", "mdmg", "mc_cart", "mc_quick", "mc_area", "mc_proj", "mc_prec", "mc_acid", "mc_cot", "mc_hammer", "mc_over", "mc_invest", "mc_heavy"],
  },
};
// 轉職分支：[A1, A2, A3, S1, S2]（樣板、替代天賦、武器沿用 v4）
const V6_SPEC = {
  sword: [
    ["sw_bowl", "sw_bash", "sw_brandish", "fury", "sw_counter"],
    ["sw_gcross", "sw_shboom", "sw_provoke", "sw_brand", "sw_parry"],
    ["sw_spiral", "sw_berserk", "sw_wave", "sw_counter", "sw_limit"],
    ["sw_breath", "sw_ignite", "sw_frost", "sw_runeb", "sw_limit"],
  ],
  bow: [
    ["bw_sharp", "bw_snipe", "bw_blitz", "prec", "bw_range"],
    ["bw_varrow", "bw_corrode", "bw_shower", "bw_poison", "bw_fourth"],
    ["bw_ankle", "bw_burst", "bw_double", "bw_trap", "bw_fourth"],
    ["bw_song", "bw_disso", "bw_bsong", "bw_ens", "bw_ens2"],
  ],
  mage: [
    ["mg_meteor", "mg_storm", "mg_lov", "amp", "spread"],
    ["mg_field", "mg_spirits", "mg_fireball", "mg_spirit", "mg_reson"],
    ["mg_tetra", "mg_quag", "mg_bolt", "mg_reson", "mg_conv"],
    ["mg_gravity", "mg_napalm", "mg_quake", "mg_prec", "mg_conc"],
  ],
  thief: [
    ["th_venom", "th_envenom", "th_slash", "pstack", "th_finish"],
    ["th_snatch", "th_backstab", "th_hide", "th_crit", "th_step"],
    ["th_sonic", "th_clone", "th_slash", "mstrike", "th_finish"],
    ["th_mark", "th_weak", "th_hide", "th_step", "th_crit"],
  ],
  acolyte: [
    ["ac_light", "ac_heal", "ac_sanct", "ac_bless", "ac_grace"],
    ["ac_combo", "ac_call", "ac_asura", "ac_triple", "ac_focus"],
    ["ac_magnus", "ac_orbs", "ac_wrath", "ac_angel", "ac_angel2"],
    ["ac_knuckle", "ac_rampage", "ac_finger", "ac_focus", "ac_spirit"],
  ],
  merchant: [
    ["mc_hfall", "mc_term", "mc_mammon", "mc_invest", "mc_heavy"],
    ["mc_homun", "mc_acidbomb", "mc_firebomb", "mcount", "mdmg"],
    ["mc_faw", "mc_cannon", "mc_axe", "mc_proj", "mc_prec"],
    ["mc_miasma", "mc_plant", "mc_spore", "mc_acid", "mcount"],
  ],
};
// 終結技（盜賊）與消耗氣球技能（服事）
const V6_FIN = new Set(["th_sonic", "th_envenom"]);
const V6_SPEND = new Set(["ac_asura", "ac_finger", "ac_rampage"]);
// 舊寶石 → 新寶石（舊存檔）
const V6_OLD = {
  sword: { heavy: "sw_bash", whirl: "sw_magnum", thrust: "sw_brandish", taunt: "sw_provoke", frenzy: "sw_berserk", leap: "sw_charge", swave: "sw_wave", frostsl: "sw_frost", gcross: "sw_gcross", ignite: "sw_ignite", sw_magnum: "sw_magnum", sw_hcross: "sw_gcross", guard: "sw_provoke", fire: "sw_ignite", meteor: "sw_breath", chain: "sw_shboom", fissure: "sw_charge", blink: "sw_spiral", dance: "sw_berserk", bpool: "sw_berserk", venom: "sw_bash" },
  bow: { pierce: "bw_sharp", rain: "bw_shower", varrow: "bw_varrow", exarrow: "bw_burst", trap: "bw_ankle", turret: "bw_blitz", farrow: "bw_double", iarrow: "bw_double", larrow: "bw_double", summon: "bw_bsong", bsong: "bw_bsong", dissonance: "bw_disso", bw_charge: "bw_snipe", bw_blast: "bw_ankle", dance: "bw_song" },
  mage: { fire: "mg_fireball", nova: "mg_frost", chain: "mg_bolt", meteor: "mg_meteor", bliz: "mg_storm", summon: "mg_spirits", miasma: "mg_quag", cslw: "mg_quag", cvul: "mg_quag", cwk: "mg_quag", mg_tstorm: "mg_lov", mg_soul: "mg_napalm", holy: "mg_napalm", heal: "mg_frost" },
  thief: { sonic: "th_sonic", envenom: "th_envenom", venom: "th_venom", backstab: "th_backstab", blink: "th_backstab", dance: "th_dual", bpool: "th_hide", varrow: "th_venom", miasma: "th_envenom", cvul: "th_weak", trap: "th_snatch", cwk: "th_weak", cslw: "th_weak", th_soulbrk: "th_sonic", th_meteor: "th_slash" },
  acolyte: { holy: "ac_light", sanctuary: "ac_sanct", heal: "ac_heal", guard: "ac_orbs", asura: "ac_asura", taunt: "ac_wrath", cwk: "ac_wrath", cslw: "ac_wrath", cvul: "ac_wrath", summon: "ac_orbs", chain: "ac_light", dance: "ac_call", frenzy: "ac_call", combo: "ac_combo", palm: "ac_finger", tiger: "ac_knuckle", angel: "ac_orbs", ac_magnus: "ac_magnus", ac_sphere: "ac_finger" },
  merchant: { mammonite: "mc_mammon", cart: "mc_cartrev", acid: "mc_acidbomb", homun: "mc_homun", faw: "mc_faw", miasma: "mc_miasma", fissure: "mc_hfall", taunt: "mc_hfall", frenzy: "mc_axe", exarrow: "mc_cannon", mc_revo: "mc_term", mc_cannon: "mc_cannon" },
};

// ===========================================================================
// 3. 登錄技能（在 roV5SkillsInstall 之後、轉職天賦建立之前）
// ===========================================================================
function v6SkillsInstall() {
  TAG.fin = "終結技";
  TAG.sph = "消耗氣球";
  const ES = {};
  for (const [id, cls, n, kind, hit, cd, tg, el, ail, icon, sh, d] of V6_ACT) {
    const base = kind.startsWith("base:") ? kind.slice(5) : null;
    const sk = base
      ? { ...SKILLS[base], shape: SKILLS[base].shape.map((p) => [...p]), tg: [...(SKILLS[base].tg || [])], roBase: base }
      : { act: 1, col: "#e8a64a" };
    Object.assign(sk, {
      n,
      cls,
      act: 1,
      hit,
      cd: base && !cd ? SKILLS[base].cd : cd,
      tg: [...tg],
      el,
      ail: ail || undefined,
      shape: V6_SH[sh].map((p) => [...p]),
      v6: kind,
      d: `〔${V5_EL[el] || "無"}屬性〕` + d.replace("{hit}", Math.round(100 * hit)),
    });
    if (V6_FIN.has(id) && !sk.tg.includes("fin")) sk.tg.push("fin");
    if (V6_SPEND.has(id) && !sk.tg.includes("sph")) sk.tg.push("sph");
    if (el === "holy" && !sk.tg.includes("holy")) sk.tg.push("holy");
    if (base === "frenzy" || base === "dance") {
      sk.hit = SKILLS[base].hit;
      sk.cd = SKILLS[base].cd;
    }
    SKILLS[id] = sk;
    roSkillIcons[id] = icon;
    V5_SK_EL[id] = el;
    ES[id] = 1;
  }
  for (const [id, cls, n, req, icon, sh, d] of V6_SUP) {
    SKILLS[id] = { cls, act: 0, n, shape: V6_SH[sh].map((p) => [...p]), col: "#d9c45a", d, mod: {}, ...(req ? { req } : {}), v6sup: 1 };
    roSkillIcons[id] = icon;
  }
  // 職業技能清單
  for (const [cls, c] of Object.entries(V6_CLASS)) {
    const pas = CLASS[cls].gems.filter((id) => SKILLS[id]?.pas);
    CLASS[cls].gems.splice(0, CLASS[cls].gems.length, ...c.act, ...c.sup.filter((id) => SKILLS[id]), ...pas);
  }
  // 轉職分支的核心技能
  for (const [cls, specs] of Object.entries(V6_SPEC))
    specs.forEach((sp, i) => {
      const o = RO_ASC_SPEC[cls][i];
      if (o) for (let k = 0; k < 5; k++) o[k + 1] = sp[k];
    });
  // RO 原版特效
  if (typeof roFxProfiles !== "undefined")
    Object.assign(roFxProfiles, {
      sw_bash: { custom: "slash", target: 1, delay: 0.12 },
      sw_magnum: { str: ["firehit1"], self: 1 },
      sw_bowl: { str: ["bowling"], target: 1 },
      sw_shboom: { str: ["earthhit"], target: 1 },
      sw_gcross: { str: ["holyhit"], self: 1 },
      sw_spiral: { str: ["pierce"], target: 1 },
      sw_breath: { str: ["firehit1"], target: 1 },
      sw_ignite: { str: ["hell_in"], self: 1 },
      bw_double: { str: ["arrowshot"], projectile: 1 },
      bw_blitz: { str: ["windhit1"], target: 1 },
      bw_corrode: { custom: "poison", target: 1 },
      bw_sharp: { str: ["arrowshot"], projectile: 1 },
      bw_snipe: { str: ["arrowstorm"], target: 1 },
      bw_disso: { custom: "aura", self: 1 },
      bw_song: { custom: "aura", self: 1 },
      mg_lov: { str: ["lightning"], target: 1 },
      mg_field: { custom: "aura", target: 1 },
      mg_tetra: { str: ["firehit1"], target: 1 },
      mg_gravity: { str: ["quagmire"], target: 1, ground: 1 },
      mg_napalm: { custom: "aura", target: 1 },
      th_slash: { custom: "slash", target: 1 },
      th_sonic: { str: ["sonicblow"], target: 1, delay: 0.1 },
      th_envenom: { custom: "poison", target: 1 },
      th_hide: { custom: "shadow", self: 1 },
      th_snatch: { custom: "shadow", target: 1 },
      th_clone: { custom: "shadow", self: 1 },
      th_mark: { str: ["weakness"], target: 1 },
      ac_light: { str: ["holyhit"], target: 1 },
      ac_heal: { custom: "heal", self: 1 },
      ac_sanct: { str: ["sanctuary"], self: 1, ground: 1 },
      ac_magnus: { str: ["holyhit"], target: 1 },
      ac_orbs: { custom: "aura", self: 1 },
      ac_call: { custom: "aura", self: 1 },
      ac_asura: { custom: "asura", target: 1, delay: 0.12 },
      ac_combo: { custom: "slash", target: 1 },
      ac_finger: { custom: "aura", self: 1 },
      ac_knuckle: { custom: "impact", target: 1 },
      ac_rampage: { custom: "impact", self: 1 },
      mc_mammon: { str: ["maemor"], target: 1, delay: 0.12 },
      mc_cartrev: { str: ["cartrevolution"], self: 1 },
      mc_hfall: { str: ["crashearth"], target: 1, delay: 0.1 },
      mc_term: { str: ["cartrevolution"], self: 1 },
      mc_acidbomb: { custom: "acid", projectile: 1 },
      mc_firebomb: { str: ["firehit1"], target: 1 },
      mc_cannon: { str: ["firehit1"], target: 1 },
      mc_axe: { str: ["bowling"], self: 1 },
      mc_plant: { custom: "summon", target: 1, ground: 1 },
      mc_spore: { str: ["poison_mist"], target: 1, ground: 1 },
    });
}
// 掛在 roV5SkillsInstall 之後（它由 roV4Install 呼叫，早於轉職天賦建立）
if (typeof roV5SkillsInstall === "function") {
  const v5si = roV5SkillsInstall;
  roV5SkillsInstall = function () {
    v5si();
    v6SkillsInstall();
  };
}

// ===========================================================================
// 4. 招式（v6Cast 由引擎 castSkillRaw 最前面呼叫）
// ===========================================================================
const v6Linked = (g, id) => {
  try {
    return linkedSupports(g).some((e) => e.id === id);
  } catch (e) {
    return false;
  }
};
const v6AvgW = () => Math.max(1, (PS.mn + PS.mx) / 2);
function v6Cast(g, a = 1) {
  const sk = SKILLS[g.id];
  if (!sk || !sk.v6 || sk.roBase) return undefined;
  const fn = V6_CAST[sk.v6];
  if (!fn) return undefined;
  const p = G.pl,
    m = gemMods(g),
    tgt = p.tgt;
  let mul = a;
  // 商人：金錢投入、重型手推車
  if (v6Linked(g, "mc_invest") && v6PayZeny(3)) mul *= 1.5;
  if (v6Linked(g, "mc_heavy")) mul *= 1 + (v6CartMul() - 1) * 2;
  const c = {
    g,
    sk,
    p,
    m,
    n: PS.area * (1 + m.area),
    tgt,
    ang: alive(tgt) ? aimAt(tgt) : p.face,
    hit: sk.hit,
    r: (1 + m.dmg) * mul,
    o: v6Opts(g, m),
    a,
  };
  return fn(c);
}
const v6Need = (c) => alive(c.tgt);
const V6_CAST = {
  // ---------------- 劍士 ----------------
  bash(c) {
    if (!v6Need(c)) return false;
    const { p, tgt } = c;
    setFace(c.ang);
    p.anim = { k: "slam", t: 0, dur: 0.32, a: c.ang };
    p.vx += 60 * Math.cos(c.ang);
    later(0.12, () => {
      if (!alive(tgt)) return;
      v6Hit(tgt, c.hit * c.r, c.o, { kb: 120, stop: 1 });
      v6Stun(tgt, 0.8);
      v6Ro("sw_bash", tgt.x, tgt.y);
      burst(tgt.x, tgt.y, 12, ["#ffffff", "#ffd27a", "#a3764d"], 80, { z: 6 });
      shake(0.14);
    });
    return true;
  },
  magnum(c) {
    const { p } = c,
      R = 20 * c.n;
    p.anim = { k: "whirl", t: 0, dur: 0.4, a: p.face, R };
    later(0.08, () => {
      for (const m of v6Near(p.x, p.y - 3, R)) v6Hit(m, c.hit * c.r, c.o, { kb: 150 });
      v6Fx({ k: "ring", x: p.x, y: p.y - 3, r: R, life: 0.35, col: V6_C.fire[0], grow: 1 });
      burst(p.x, p.y - 4, 22, V6_C.fire, 120, { z: 4, glow: 1 });
      v6Ro("sw_magnum", p.x, p.y);
      v6SetBuf("magnum", 4);
      hitStop(0.04);
    });
    return true;
  },
  bowl(c) {
    if (!v6Need(c)) return false;
    const { p, tgt } = c;
    setFace(c.ang);
    p.anim = { k: "swing", t: 0, dur: 0.24, a: c.ang, combo: 2 };
    const hitSet = new Set([tgt]);
    const launch = (mob, dx, dy, depth) => {
      if (!alive(mob)) return;
      if (!mob.boss) {
        mob.vx += dx * (mob.elite ? 140 : 240);
        mob.vy += dy * (mob.elite ? 100 : 170);
      }
      v6Ent({
        life: 0.4,
        upd: () => {
          if (!alive(mob)) return;
          for (const o of G.mobs) {
            if (hitSet.has(o) || o.spawnT > 0) continue;
            if (Math.hypot(o.x - mob.x, o.y - mob.y) < 10 + (o.boss ? 6 : 0)) {
              hitSet.add(o);
              v6Hit(o, c.hit * c.r * 0.5, c.o, { kb: 10 });
              v6Ro("sw_bowl", o.x, o.y);
              burst(o.x, o.y, 8, ["#ffffff", "#e8d8b0"], 70, { z: 6 });
              if (depth > 0) {
                const ex = o.x - mob.x,
                  ey = o.y - mob.y,
                  d = Math.hypot(ex, ey) || 1;
                launch(o, ex / d, ey / d, depth - 1);
              }
            }
          }
        },
      });
    };
    later(0.1, () => {
      if (!alive(tgt)) return;
      v6Hit(tgt, c.hit * c.r, c.o, { kb: 10, stop: 1 });
      v6Ro("sw_bowl", tgt.x, tgt.y);
      const dx = tgt.x - p.x,
        dy = tgt.y - p.y,
        d = Math.hypot(dx, dy) || 1;
      launch(tgt, dx / d, dy / d, 1);
      shake(0.12);
    });
    return true;
  },
  shboom(c) {
    if (!v6Need(c)) return false;
    const { p, tgt } = c;
    setFace(c.ang);
    p.anim = { k: "cast", t: 0, dur: 0.28, a: c.ang };
    // 護甲加成（每 100 護甲 +1.5%）由擊中時的「護甲轉傷害」一併相加計算（v6arm）
    const k = c.hit * c.r;
    const [hx, hy] = handPos();
    const e = v6Ent({
      life: 2.5,
      x: hx,
      y: hy,
      leg: 0,
      hs: new Set(),
      upd: (e, dt) => {
        const tx = e.leg ? G.pl.x : alive(tgt) ? tgt.x : e.tx,
          ty = e.leg ? G.pl.y - 6 : alive(tgt) ? tgt.y - 4 : e.ty;
        e.tx = tx;
        e.ty = ty;
        const dx = tx - e.x,
          dy = ty - e.y,
          d = Math.hypot(dx, dy) || 1,
          v = 230 * dt;
        if (d <= v || (!e.leg && Math.hypot(e.x - hx, e.y - hy) > 110)) {
          if (e.leg) e.t = e.life;
          else (e.leg = 1), (e.hs = new Set());
        } else (e.x += (dx / d) * v), (e.y += (dy / d) * v);
        for (const m of G.mobs)
          if (!e.hs.has(m) && m.spawnT <= 0 && Math.hypot(m.x - e.x, m.y - 4 - e.y) < (8 + (m.boss ? 6 : 0)) * c.n) {
            e.hs.add(m);
            v6Hit(m, k, c.o, { kb: 60, sx: e.x, sy: e.y, v6arm: V6_SHB_ARM });
            burst(e.x, e.y + 4, 6, ["#e8e8ff", "#a8b8d8"], 60, { z: 6 });
          }
      },
      draw: (e, cx) => {
        cx.save();
        cx.translate(e.x, e.y);
        cx.rotate(G.t * 18);
        cx.fillStyle = "#b8c8e0";
        cx.fillRect(-3, -3, 6, 6);
        cx.fillStyle = "#e8d070";
        cx.fillRect(-1, -3, 2, 6);
        cx.fillRect(-3, -1, 6, 2);
        cx.restore();
      },
    });
    e.tx = tgt.x;
    e.ty = tgt.y;
    return true;
  },
  gcross(c) {
    const { p } = c,
      L = 44 * c.n,
      W = 6;
    if (S.hp > PS.maxhp * 0.1) S.hp -= S.hp * 0.06;
    p.anim = { k: "cast", t: 0, dur: 0.4, a: p.face, big: 1 };
    v6Fx({ k: "cross", x: p.x, y: p.y - 3, L, w: W, life: 0.5, col: V6_C.holy[0] });
    v6Ro("sw_gcross", p.x, p.y);
    later(0.15, () => {
      const set = new Set([...v6Line(p.x - L, p.y - 3, p.x + L, p.y - 3, W), ...v6Line(p.x, p.y - 3 - L * 0.7, p.x, p.y - 3 + L * 0.7, W)]);
      let n = 0;
      for (const m of set) v6Hit(m, c.hit * c.r, c.o, { kb: 60 }), n++;
      if (n) heal(PS.maxhp * Math.min(0.1, 0.02 * n));
      burst(p.x, p.y - 6, 16, V6_C.holy, 100, { z: 6, glow: 1 });
      shake(0.12);
    });
    return true;
  },
  spiral(c) {
    if (!v6Need(c)) return false;
    const { p, tgt } = c;
    setFace(c.ang);
    for (let i = 0; i < 5; i++)
      later(0.06 + 0.08 * i, () => {
        if (!alive(tgt)) return;
        p.anim = { k: "swing", t: 0, dur: 0.1, a: c.ang, combo: i % 3 };
        v6Hit(tgt, c.hit * c.r * (1 + 0.2 * i), c.o, { kb: 15, stop: i === 4 ? 1 : 0 });
        if (i % 2 === 0) v6Ro("sw_spiral", tgt.x, tgt.y);
        streak({ x: p.x, y: p.y - 6 }, { x: tgt.x, y: tgt.y - 6 }, "#ffffff");
      });
    return true;
  },
  breath(c) {
    const { p } = c,
      R = 54 * c.n,
      H = 0.55,
      a0 = c.ang;
    setFace(a0);
    p.anim = { k: "cast", t: 0, dur: 0.7, a: a0, big: 1 };
    const flat = (0.006 * PS.maxhp) / v6AvgW();
    v6Fx({ k: "cone", x: p.x, y: p.y - 4, a: a0, h: H, R, life: 0.7, col: V6_C.fire[0] });
    for (let i = 0; i < 4; i++)
      later(0.1 + 0.15 * i, () => {
        for (const m of v6Cone(p.x, p.y - 4, a0, H, R)) v6Hit(m, (c.hit + flat) * c.r, c.o, { kb: 25 });
        for (let k = 0; k < 6; k++) {
          const aa = a0 + rf(-H, H),
            d = rf(8, R);
          burst(p.x + Math.cos(aa) * d, p.y - 4 + Math.sin(aa) * d * 0.7, 2, V6_C.fire, 40, { z: 4, glow: 1, life: 0.5 });
        }
      });
    v6Ro("sw_breath", p.x + Math.cos(a0) * R * 0.6, p.y + Math.sin(a0) * R * 0.4);
    return true;
  },
  ignite(c) {
    const { p } = c,
      R = 28 * c.n;
    p.anim = { k: "slam", t: 0, dur: 0.38, a: p.face };
    v6Fx({ k: "warn", x: p.x, y: p.y - 3, r: R, life: 0.35, col: V6_C.fire[0] });
    later(0.35, () => {
      for (const m of v6Near(p.x, p.y - 3, R)) {
        const d = Math.hypot(m.x - p.x, m.y - 3 - (p.y - 3));
        v6Hit(m, c.hit * c.r * (d < R / 2 ? 1.6 : 1), c.o, { kb: 120 });
      }
      v6Fx({ k: "ring", x: p.x, y: p.y - 3, r: R, life: 0.3, col: V6_C.fire[0], grow: 1 });
      v6Ro("sw_ignite", p.x, p.y);
      burst(p.x, p.y - 4, 26, V6_C.fire, 140, { z: 4, glow: 1 });
      shake(0.16);
    });
    return true;
  },
  // ---------------- 弓箭手 ----------------
  double(c) {
    if (!v6Need(c)) return false;
    const { p, tgt } = c;
    setFace(c.ang);
    p.anim = { k: "shoot", t: 0, dur: 0.26, a: c.ang };
    for (let i = 0; i < 2; i++)
      later(0.08 + 0.1 * i, () => {
        const [x, y] = handPos();
        fan({ k: "arrow", x, y, spd: 240, mult: c.hit * c.r, o: c.o, kb: 30 }, tgt, c.ang, c.m.proj);
      });
    return true;
  },
  blitz(c, k = 1) {
    const tgt = c.tgt;
    if (!alive(tgt)) return false;
    const pool = [tgt, ...v6Near(tgt.x, tgt.y, 26 * c.n).filter((m) => m !== tgt)].slice(0, 3);
    const hits = 5 + (c.m.extra || 0);
    for (let i = 0; i < hits; i++)
      later(0.05 + 0.07 * i, () => {
        const m = pool[i % pool.length];
        if (!alive(m)) return;
        v6Hit(m, c.hit * c.r * k, Object.assign({}, c.o, { skill: 1 }), { kb: 20 });
        v6Fx({ k: "dive", x: m.x, y: m.y - 4, life: 0.18, col: V6_C.wind[0] });
        if (i === 0) v6Ro("bw_blitz", m.x, m.y);
      });
    return true;
  },
  corrode(c) {
    if (!v6Need(c)) return false;
    const { p, tgt } = c,
      R = 24 * c.n;
    setFace(c.ang);
    p.anim = { k: "shoot", t: 0, dur: 0.3, a: c.ang, big: 1 };
    later(0.15, () => {
      for (const m of v6Near(tgt.x, tgt.y, R)) {
        v6Hit(m, c.hit * c.r, c.o, { kb: 30 });
        v6Detonate(m, 1.4);
      }
      v6Fx({ k: "ring", x: tgt.x, y: tgt.y - 3, r: R, life: 0.35, col: V6_C.poison[0], grow: 1 });
      v6Ro("bw_corrode", tgt.x, tgt.y);
      burst(tgt.x, tgt.y - 3, 16, V6_C.poison, 90, { z: 4 });
    });
    return true;
  },
  sharp(c) {
    if (!v6Need(c)) return false;
    const { p } = c;
    setFace(c.ang);
    p.anim = { k: "shoot", t: 0, dur: 0.32, a: c.ang, big: 1 };
    later(0.15, () => {
      const [x, y] = handPos();
      for (let i = 0; i <= c.m.proj; i++) {
        const a = c.ang + 0.2 * Math.ceil(i / 2) * (i % 2 ? 1 : -1);
        roPushFx(G.proj, { k: "parrow", x, y, vx: 250 * Math.cos(a), vy: 250 * Math.sin(a), mult: c.hit * c.r, o: Object.assign({}, c.o, { crit: (c.o.crit || 0) + 40 }), hit: new Set(), life: 1.2 });
      }
      shake(0.05);
    });
    return true;
  },
  snipe(c) {
    if (!v6Need(c)) return false;
    const { p, tgt } = c;
    setFace(c.ang);
    p.anim = { k: "shoot", t: 0, dur: 0.75, a: c.ang, big: 1 };
    v6Fx({ k: "aim", life: 0.6, m: tgt, col: "#ff5a5a" });
    later(0.6, () => {
      if (!alive(tgt)) return;
      const d = Math.hypot(tgt.x - G.pl.x, tgt.y - G.pl.y);
      v6Hit(tgt, c.hit * c.r * (d > 60 ? 1.5 : 1), c.o, { kb: 90, stop: 1 });
      streak({ x: G.pl.x, y: G.pl.y - 7 }, { x: tgt.x, y: tgt.y - 6 }, "#fff2c0");
      v6Ro("bw_snipe", tgt.x, tgt.y);
      shake(0.12);
    });
    return true;
  },
  song(c) {
    const g = v6G();
    g.song = (g.song + 1) % 3;
    v6SetBuf("song" + g.song, 8 * (1 + v6Tal("v6song")));
    for (let i = 0; i < 3; i++) if (i !== g.song) g.buf["song" + i] = 0;
    v6Ro("bw_song", c.p.x, c.p.y);
    v6Fx({ k: "notes", x: c.p.x, y: c.p.y - 10, life: 1.2, col: ["#ffd27a", "#7ad4ff", "#ff8aa0"][g.song] });
    toast(`樂章：${["急速之歌（攻擊速度 +25%）", "專注之歌（冷卻縮減 20%）", "激昂之歌（傷害 +25%）"][g.song]}`, "", 1);
    return true;
  },
  disso(c) {
    const { p } = c,
      R = 42 * c.n;
    p.anim = { k: "cast", t: 0, dur: 0.4, a: p.face };
    for (let i = 0; i < 3; i++) {
      const hs = new Set();
      v6Ent({
        life: 0.45,
        t0: 0.15 * i,
        upd: (e) => {
          const tt = e.t - e.t0;
          if (tt < 0) return;
          const r = R * Math.min(1, tt / 0.3);
          for (const m of v6Near(p.x, p.y - 3, r)) if (!hs.has(m)) hs.add(m), v6Hit(m, c.hit * c.r, c.o, { kb: 50 });
        },
        draw: (e, cx) => {
          const tt = e.t - e.t0;
          if (tt < 0) return;
          const r = R * Math.min(1, tt / 0.3);
          v6Ell(cx, p.x, p.y - 3, r, "#c8a8ff", 0.7 * (1 - tt / 0.45), false);
        },
      });
    }
    return true;
  },
  // ---------------- 魔法師 ----------------
  lov(c) {
    if (!v6Need(c)) return false;
    const { p, tgt } = c,
      R = 40 * c.n;
    p.anim = { k: "cast", t: 0, dur: 0.9, a: c.ang, big: 1 };
    const x0 = tgt.x,
      y0 = tgt.y;
    v6Fx({ k: "warn", x: x0, y: y0 - 3, r: R, life: 0.8, col: V6_C.wind[0] });
    for (let i = 0; i < 10; i++)
      later(0.8 + 0.12 * i, () => {
        const near = v6Near(x0, y0, R);
        const m = near.length && RAND() < 0.7 ? near[ri(0, near.length - 1)] : null;
        const x = m ? m.x : x0 + rf(-R, R),
          y = m ? m.y : y0 + rf(-R, R) * 0.7;
        for (const mm of v6Near(x, y, 10 * c.n)) v6Hit(mm, c.hit * c.r, c.o, { kb: 20 });
        v6Fx({ k: "bolt", x, y: y - 3, life: 0.2, col: V6_C.wind[1] });
        if (i % 3 === 0) v6Ro("mg_lov", x, y);
      });
    return true;
  },
  field(c) {
    const { p, tgt } = c,
      g = v6G();
    g.fieldEl = ((g.fieldEl ?? -1) + 1) % 4;
    const el = V6_ELS[g.fieldEl],
      R = 30 * c.n,
      x = alive(tgt) ? tgt.x : p.x,
      y = alive(tgt) ? tgt.y : p.y;
    p.anim = { k: "cast", t: 0, dur: 0.4, a: c.ang, big: 1 };
    v6Ent({
      zone: 1,
      life: 6,
      iv: 0.5,
      x,
      y,
      tick: () => {
        for (const m of v6Near(x, y, R)) v6Hit(m, c.hit * c.r, Object.assign({}, c.o, { v6el: el, ail: { fire: "brn", water: "chl", wind: "shk", earth: undefined }[el] }), { kb: 0 });
      },
      gdraw: (e, cx) => {
        v6Ell(cx, x, y - 3, R, V6_C[el][0], 0.18, true);
        v6Ell(cx, x, y - 3, R, V6_C[el][1], 0.5, false);
      },
    });
    toast(`元素領域：${{ fire: "火山", water: "洪水", wind: "狂風", earth: "地脈" }[el]}`, "", 1);
    return true;
  },
  tetra(c) {
    if (!v6Need(c)) return false;
    const { p, tgt } = c;
    setFace(c.ang);
    p.anim = { k: "cast", t: 0, dur: 0.6, a: c.ang, big: 1 };
    V6_ELS.forEach((el, i) =>
      later(0.1 + 0.14 * i, () => {
        if (!alive(tgt)) return;
        v6Hit(tgt, c.hit * c.r, Object.assign({}, c.o, { v6el: el, ail: { fire: "brn", water: "chl", wind: "shk" }[el] }), { kb: 10 });
        burst(tgt.x, tgt.y - 6, 10, V6_C[el], 80, { z: 6, glow: 1 });
        v6Ro(["mg_tetra", "mg_tetra", "mg_lov", "mc_hfall"][i], tgt.x, tgt.y);
      }),
    );
    return true;
  },
  gravity(c) {
    const { p, tgt } = c,
      R = 28 * c.n,
      x = alive(tgt) ? tgt.x : p.x,
      y = alive(tgt) ? tgt.y : p.y;
    p.anim = { k: "cast", t: 0, dur: 0.4, a: c.ang, big: 1 };
    v6Ro("mg_gravity", x, y);
    v6Ent({
      zone: 1,
      life: 5,
      iv: 0.5,
      upd: () => {
        for (const m of v6Near(x, y, R * 1.3)) pullTo(m, x, y, 0.12);
      },
      tick: () => {
        for (const m of v6Near(x, y, R)) v6Hit(m, c.hit * c.r, c.o, { kb: 0 });
      },
      gdraw: (e, cx) => {
        v6Ell(cx, x, y - 3, R, "#6a4ac0", 0.22, true);
        for (let k = 0; k < 3; k++) v6Ell(cx, x, y - 3, R * (((G.t * 0.8 + k / 3) % 1) || 0.01), "#c8b0ff", 0.5, false);
      },
    });
    return true;
  },
  napalm(c) {
    if (!v6Need(c)) return false;
    const { p, tgt } = c;
    setFace(c.ang);
    p.anim = { k: "cast", t: 0, dur: 0.34, a: c.ang };
    const ts = [tgt, ...v6Near(p.x, p.y, 1.6 * PS.range).filter((m) => m !== tgt)];
    const n = 3 + (c.m.proj || 0);
    for (let i = 0; i < n; i++)
      later(0.06 * i, () => {
        const m = ts[i % ts.length];
        if (!alive(m)) return;
        const [x, y] = handPos();
        fan(
          {
            k: "mbolt",
            x,
            y,
            spd: 150,
            mult: c.hit * c.r,
            o: c.o,
            col: "#c8b0ff",
            after: (pr, hm) => {
              for (const o of v6Near(pr.x, pr.y + 4, 10 * c.n)) o !== hm && v6Hit(o, c.hit * c.r * 0.4, c.o, { kb: 20 });
            },
          },
          m,
          aimAt(m),
          0,
        );
      });
    return true;
  },
  // ---------------- 盜賊 ----------------
  slash(c) {
    if (!v6Need(c)) return false;
    const { p, tgt } = c;
    setFace(c.ang);
    for (let i = 0; i < 3; i++)
      later(0.04 + 0.09 * i, () => {
        if (!alive(tgt)) return;
        p.anim = { k: "swing", t: 0, dur: 0.1, a: c.ang, combo: i };
        v6Hit(tgt, c.hit * c.r, c.o, { kb: 15 });
        if (i === 1) v6Ro("th_slash", tgt.x, tgt.y);
      });
    v6CpAdd(2);
    return true;
  },
  sonic(c) {
    if (!v6Need(c)) return false;
    const { p, tgt } = c,
      cp = v6FinCp(c);
    setFace(c.ang);
    v6Ro("th_sonic", tgt.x, tgt.y);
    for (let i = 0; i < 8 + (c.m.extra || 0); i++)
      later(0.05 + 0.05 * i, () => {
        if (!alive(tgt)) return;
        p.anim = { k: "swing", t: 0, dur: 0.06, a: c.ang, combo: i % 3 };
        v6Hit(tgt, c.hit * c.r * cp, c.o, { kb: 5, stop: i === 7 ? 1 : 0 });
      });
    return true;
  },
  envenom(c) {
    if (!v6Need(c)) return false;
    const { p, tgt } = c,
      cp = v6FinCp(c),
      R = 18 * c.n;
    setFace(c.ang);
    p.anim = { k: "swing", t: 0, dur: 0.22, a: c.ang, combo: 2 };
    later(0.1, () => {
      for (const m of v6Near(tgt.x, tgt.y, R)) {
        v6Hit(m, c.hit * c.r * cp, c.o, { kb: 30 });
        v6Detonate(m, 1 + 0.3 * (cp - 1));
      }
      v6Fx({ k: "ring", x: tgt.x, y: tgt.y - 3, r: R, life: 0.3, col: V6_C.poison[0], grow: 1 });
      v6Ro("th_envenom", tgt.x, tgt.y);
    });
    return true;
  },
  hide(c) {
    v6SetBuf("hide", 2.5 * (1 + v6Tal("v6hide")));
    v6G().sneak = V6_CP.sneak;
    v6CpAdd(2);
    v6Ro("th_hide", c.p.x, c.p.y);
    burst(c.p.x, c.p.y - 6, 12, V6_C.shadow, 50, { z: 6 });
    return "free";
  },
  snatch(c) {
    if (!v6Need(c)) return false;
    const { p, tgt } = c;
    setFace(c.ang);
    p.anim = { k: "swing", t: 0, dur: 0.2, a: c.ang, combo: 1 };
    later(0.08, () => {
      if (!alive(tgt)) return;
      v6Hit(tgt, c.hit * c.r, c.o, { kb: 30 });
      const g = v6G();
      g.snatch = Math.min(3, (g.buf.snatch > G.t ? g.snatch || 0 : 0) + 1);
      v6SetBuf("snatch", 6);
      g.buf.snatch = G.t + 6;
      const z = Math.round(2 + S.lvl * 0.5);
      S.ash += z;
      num(tgt.x, tgt.y - 16, "+" + z + "z", "#ffe08a");
      v6Ro("th_snatch", tgt.x, tgt.y);
    });
    v6CpAdd(2);
    return true;
  },
  clone(c) {
    v6SetBuf("clone", 6 * (1 + v6Tal("v6clone")));
    v6Ro("th_clone", c.p.x, c.p.y);
    toast("殘影分身：6 秒內技能由殘影重複施放", "", 1);
    return true;
  },
  mark(c) {
    if (!v6Need(c)) return false;
    const { p, tgt } = c;
    setFace(c.ang);
    p.anim = { k: "swing", t: 0, dur: 0.2, a: c.ang, combo: 2 };
    later(0.08, () => {
      if (!alive(tgt)) return;
      v6Hit(tgt, c.hit * c.r, c.o, { kb: 20 });
      for (const m of G.mobs) if (m.v6mark) m.v6mark = 0;
      tgt.v6mark = G.t + 8;
      v6Ro("th_mark", tgt.x, tgt.y);
    });
    return true;
  },
  // ---------------- 服事 ----------------
  holy(c) {
    if (!v6Need(c)) return false;
    const { p, tgt } = c;
    p.anim = { k: "cast", t: 0, dur: 0.32, a: c.ang };
    v6Fx({ k: "pillar", x: tgt.x, y: tgt.y, life: 0.45, col: V6_C.holy[0] });
    later(0.12, () => {
      for (const m of v6Near(tgt.x, tgt.y, 9 * c.n)) v6Hit(m, c.hit * c.r * (m === tgt ? 1 : 0.6), c.o, { kb: 30 });
      v6Ro("ac_light", tgt.x, tgt.y);
    });
    return true;
  },
  heal(c) {
    const { p } = c;
    p.anim = { k: "cast", t: 0, dur: 0.4, a: p.face, big: 1 };
    const amt = PS.maxhp * 0.25 * (1 + c.m.dmg) * c.a,
      room = Math.max(0, hpCap() - S.hp),
      over = Math.max(0, amt - room) / PS.maxhp;
    heal(amt);
    num(p.x, p.y - 24, "+" + fmt(Math.min(amt, room)), "#7dffc8");
    v6Ro("ac_heal", p.x, p.y);
    const R = 22 * c.n;
    for (const m of v6Near(p.x, p.y - 3, R)) v6Hit(m, c.hit * c.r * (1 + over * 3), c.o, { kb: 40 });
    v6Fx({ k: "ring", x: p.x, y: p.y - 3, r: R, life: 0.4, col: V6_C.holy[0], grow: 1 });
    return true;
  },
  sanct(c) {
    const { p } = c,
      R = 26 * c.n,
      x = p.x,
      y = p.y;
    v6Ro("ac_sanct", x, y);
    v6Ent({
      zone: 1,
      life: 6,
      iv: 0.5,
      tick: () => {
        if (Math.hypot(G.pl.x - x, G.pl.y - y) <= R) heal(PS.maxhp * 0.015 * (1 + c.m.dmg * 0.5));
        for (const m of v6Near(x, y, R)) v6Hit(m, c.hit * c.r, c.o, { kb: 0 });
      },
      gdraw: (e, cx) => {
        v6Ell(cx, x, y - 3, R, "#fff1ae", 0.16, true);
        v6Ell(cx, x, y - 3, R, "#ffffff", 0.45, false);
      },
    });
    return true;
  },
  magnus(c) {
    const { p, tgt } = c,
      L = 32 * c.n,
      W = 7,
      x = alive(tgt) ? tgt.x : p.x,
      y = alive(tgt) ? tgt.y : p.y;
    p.anim = { k: "cast", t: 0, dur: 0.5, a: c.ang, big: 1 };
    v6Ent({
      zone: 1,
      life: 5,
      iv: 0.5,
      tick: () => {
        const set = new Set([...v6Line(x - L, y - 3, x + L, y - 3, W), ...v6Line(x, y - 3 - L * 0.7, x, y - 3 + L * 0.7, W)]);
        for (const m of set) v6Hit(m, c.hit * c.r, c.o, { kb: 0 });
        if (RAND() < 0.4) v6Ro("ac_magnus", x + rf(-L, L) * 0.5, y);
      },
      gdraw: (e, cx) => v6DrawCross(cx, x, y - 3, L, W, "#fff1ae", 0.35),
    });
    return true;
  },
  orbs(c) {
    const n = 3 + (c.m.minion || 0),
      g = v6G();
    g.ents = g.ents.filter((e) => e.k !== "orb");
    for (let i = 0; i < n; i++)
      v6Ent({
        k: "orb",
        life: 10,
        a0: (6.283 * i) / n,
        cd: new Map(),
        upd: (e) => {
          const a = e.a0 + G.t * 2.6,
            x = G.pl.x + Math.cos(a) * 20,
            y = G.pl.y - 5 + Math.sin(a) * 13;
          e.x = x;
          e.y = y;
          for (const m of v6Near(x, y + 3, 7))
            if ((e.cd.get(m) || 0) <= G.t) {
              e.cd.set(m, G.t + 0.4);
              v6Hit(m, c.hit * c.r * (1 + (c.m.mlife || 0)), Object.assign({}, c.o, { min: 0 }), { kb: 20 });
              burst(x, y + 4, 4, V6_C.holy, 40, { z: 6, glow: 1 });
            }
        },
        draw: (e, cx) => {
          if (e.x == null) return;
          cx.save();
          cx.globalAlpha = 0.9;
          cx.fillStyle = "#fff1ae";
          cx.beginPath();
          cx.arc(e.x, e.y, 2.5, 0, 6.283);
          cx.fill();
          cx.globalAlpha = 0.35;
          cx.beginPath();
          cx.arc(e.x, e.y, 4.5, 0, 6.283);
          cx.fill();
          cx.restore();
        },
      });
    v6Ro("ac_orbs", c.p.x, c.p.y);
    return true;
  },
  call(c) {
    v6SphAdd(3);
    v6SetBuf("call", 4);
    v6Ro("ac_call", c.p.x, c.p.y);
    return true;
  },
  asura(c) {
    const g = v6G();
    if (!v6Need(c) || g.sph < 3) return false;
    const { p, tgt } = c,
      n = v6SphSpend(c);
    const a = Math.atan2(tgt.y - p.y, tgt.x - p.x);
    const from = { x: p.x, y: p.y - 6 };
    [p.x, p.y] = v6Clamp(tgt.x - 8 * Math.cos(a), tgt.y - 5 * Math.sin(a));
    p.vx = p.vy = 0;
    streak(from, { x: p.x, y: p.y - 6 }, "#ffd27a");
    setFace(a);
    p.anim = { k: "punch", t: 0, dur: 0.3, a };
    later(0.12, () => {
      if (!alive(tgt)) return;
      v6Hit(tgt, c.hit * c.r * (1 + 0.8 * n), c.o, { kb: 160, stop: 1 });
      v6Ro("ac_asura", tgt.x, tgt.y);
      burst(tgt.x, tgt.y - 6, 30, ["#ffffff", "#ffd27a", "#ff8a3a"], 160, { z: 6, glow: 1 });
      shake(0.25);
    });
    return true;
  },
  combo(c) {
    if (!v6Need(c)) return false;
    const { p, tgt } = c,
      g = v6G();
    if (G.t > g.comboT) g.combo = 0;
    const st = g.combo;
    g.combo = (st + 1) % 3;
    g.comboT = G.t + 3;
    setFace(c.ang);
    p.anim = { k: st === 2 ? "slam" : "swing", t: 0, dur: 0.2, a: c.ang, combo: st };
    later(0.08, () => {
      if (!alive(tgt)) return;
      if (st === 0) {
        v6Hit(tgt, c.hit * c.r, c.o, { kb: 30 });
        v6SphAdd(1);
      } else if (st === 1) {
        for (const m of v6Cone(p.x, p.y - 3, c.ang, 0.7, 30 * c.n)) v6Hit(m, c.hit * c.r * 0.9, c.o, { kb: 60 });
        v6Fx({ k: "cone", x: p.x, y: p.y - 3, a: c.ang, h: 0.7, R: 30 * c.n, life: 0.25, col: "#ffd27a" });
      } else {
        for (const m of v6Near(tgt.x, tgt.y, 20 * c.n)) v6Hit(m, c.hit * c.r * 1.5, c.o, { kb: 120 });
        v6Fx({ k: "ring", x: tgt.x, y: tgt.y - 3, r: 20 * c.n, life: 0.3, col: "#ffd27a", grow: 1 });
        shake(0.12);
      }
      v6Ro("ac_combo", tgt.x, tgt.y);
    });
    return true;
  },
  finger(c) {
    if (!v6Need(c)) return false;
    const { p, tgt } = c,
      n = Math.max(1, v6SphSpend(c));
    setFace(c.ang);
    p.anim = { k: "cast", t: 0, dur: 0.3, a: c.ang };
    for (let i = 0; i < n + (c.m.proj || 0); i++)
      later(0.07 * i, () => {
        if (!alive(tgt)) return;
        const [x, y] = handPos();
        fan({ k: "mbolt", x, y, spd: 170, mult: c.hit * c.r, o: c.o, col: "#ffd27a" }, tgt, aimAt(tgt), 0);
      });
    return true;
  },
  knuckle(c) {
    if (!v6Need(c)) return false;
    const { p, tgt } = c,
      a = Math.atan2(tgt.y - p.y, tgt.x - p.x),
      L = 60;
    const x0 = p.x,
      y0 = p.y,
      [x1, y1] = v6Clamp(x0 + Math.cos(a) * L, y0 + Math.sin(a) * L * 0.8);
    for (const m of v6Line(x0, y0 - 3, x1, y1 - 3, 8 * c.n)) v6Hit(m, c.hit * c.r, c.o, { kb: 70 });
    p.x = x1;
    p.y = y1;
    p.vx = p.vy = 0;
    streak({ x: x0, y: y0 - 6 }, { x: x1, y: y1 - 6 }, "#ffe080");
    v6Fx({ k: "line", x: x0, y: y0 - 4, x2: x1, y2: y1 - 4, w: 3, life: 0.25, col: "#ffe080" });
    setFace(a);
    p.anim = { k: "punch", t: 0, dur: 0.2, a };
    v6SphAdd(1);
    v6Ro("ac_knuckle", x1, y1);
    return true;
  },
  rampage(c) {
    const { p } = c,
      n = v6SphSpend(c),
      R = 46 * c.n,
      hs = new Set();
    p.anim = { k: "slam", t: 0, dur: 0.4, a: p.face };
    const x = p.x,
      y = p.y - 3;
    v6Ent({
      life: 0.45,
      upd: (e) => {
        const r = R * Math.min(1, e.t / 0.35);
        for (const m of v6Near(x, y, r)) if (!hs.has(m)) hs.add(m), v6Hit(m, c.hit * c.r * (1 + 0.4 * n), c.o, { kb: 110, sx: x, sy: y });
      },
      draw: (e, cx) => {
        const r = R * Math.min(1, e.t / 0.35);
        v6Ell(cx, x, y, r, "#ffd27a", 0.8 * (1 - e.t / 0.45), false, 2);
      },
    });
    v6Ro("ac_rampage", x, y);
    shake(0.15);
    return true;
  },
  // ---------------- 商人 ----------------
  mammon(c) {
    if (!v6Need(c)) return false;
    const { p, tgt } = c,
      paid = v6PayZeny(5);
    setFace(c.ang);
    p.anim = { k: "slam", t: 0, dur: 0.32, a: c.ang };
    later(0.12, () => {
      if (!alive(tgt)) return;
      v6Hit(tgt, c.hit * c.r * (paid ? 1.6 : 1), c.o, { kb: 100, stop: 1 });
      v6Ro("mc_mammon", tgt.x, tgt.y);
      burst(tgt.x, tgt.y - 6, paid ? 18 : 6, V6_C.gold, 100, { z: 8, glow: 1 });
      if (paid) num(tgt.x, tgt.y - 24, "-" + paid + "z", "#ffe08a");
    });
    return true;
  },
  cartrev(c) {
    const { p } = c,
      R = 28 * c.n,
      a = c.ang,
      cm = v6CartMul();
    setFace(a);
    p.anim = { k: "whirl", t: 0, dur: 0.35, a, R };
    later(0.08, () => {
      for (const m of v6Cone(p.x, p.y - 3, a, 1.6, R)) v6Hit(m, c.hit * c.r * cm, c.o, { kb: 150 });
      v6Fx({ k: "cone", x: p.x, y: p.y - 3, a, h: 1.6, R, life: 0.3, col: "#e8d8b0" });
      v6Ro("mc_cartrev", p.x, p.y);
    });
    return true;
  },
  hammer(c) {
    if (!v6Need(c)) return false;
    const { p, tgt } = c,
      R = 22 * c.n,
      x = tgt.x,
      y = tgt.y;
    setFace(c.ang);
    p.anim = { k: "slam", t: 0, dur: 0.36, a: c.ang };
    v6Fx({ k: "warn", x, y: y - 3, r: R, life: 0.2, col: V6_C.earth[0] });
    later(0.2, () => {
      for (const m of v6Near(x, y, R)) v6Hit(m, c.hit * c.r, c.o, { kb: 50 }), v6Stun(m, 1.2);
      v6Ro("mc_hfall", x, y);
      burst(x, y - 3, 20, V6_C.earth, 110, { z: 2 });
      shake(0.18);
    });
    return true;
  },
  term(c) {
    if (!v6Need(c)) return false;
    const { p, tgt } = c,
      paid = v6PayZeny(10),
      a = Math.atan2(tgt.y - p.y, tgt.x - p.x),
      L = 70,
      x0 = p.x,
      y0 = p.y,
      [x1, y1] = v6Clamp(x0 + Math.cos(a) * L, y0 + Math.sin(a) * L * 0.8);
    const k = c.hit * c.r * v6CartMul() * (paid ? 1.5 : 1);
    for (const m of v6Line(x0, y0 - 3, x1, y1 - 3, 9 * c.n)) v6Hit(m, k, c.o, { kb: 130 });
    p.x = x1;
    p.y = y1;
    p.vx = p.vy = 0;
    setFace(a);
    p.anim = { k: "whirl", t: 0, dur: 0.3, a, R: 12 };
    v6Fx({ k: "line", x: x0, y: y0 - 4, x2: x1, y2: y1 - 4, w: 4, life: 0.3, col: "#e8d8b0" });
    v6Ro("mc_term", x1, y1);
    if (paid) num(x1, y1 - 24, "-" + paid + "z", "#ffe08a");
    shake(0.12);
    return true;
  },
  acid(c) {
    if (!v6Need(c)) return false;
    const { p, tgt } = c,
      R = 16 * c.n;
    setFace(c.ang);
    p.anim = { k: "shoot", t: 0, dur: 0.3, a: c.ang };
    const [hx, hy] = handPos();
    v6Lob(hx, hy, tgt.x, tgt.y, 0.35, "#9ad84a", () => {
      for (const m of v6Near(tgt.x, tgt.y, R)) {
        v6Hit(m, c.hit * c.r, Object.assign({}, c.o, { psn: c.o.pcap }), { kb: 30 });
        m.v6acid = G.t + 5;
      }
      v6Fx({ k: "ring", x: tgt.x, y: tgt.y - 3, r: R, life: 0.3, col: V6_C.poison[0], grow: 1 });
      v6Ro("mc_acidbomb", tgt.x, tgt.y);
    });
    return true;
  },
  firebomb(c) {
    if (!v6Need(c)) return false;
    const { p, tgt } = c,
      R = 20 * c.n,
      x = tgt.x,
      y = tgt.y;
    setFace(c.ang);
    p.anim = { k: "shoot", t: 0, dur: 0.3, a: c.ang };
    const [hx, hy] = handPos();
    v6Lob(hx, hy, x, y, 0.35, "#ff8a3a", () => {
      v6Ro("mc_firebomb", x, y);
      v6Ent({
        zone: 1,
      life: 4,
        iv: 0.5,
        tick: () => {
          for (const m of v6Near(x, y, R)) v6Hit(m, c.hit * c.r, c.o, { kb: 0 });
          burst(x + rf(-R, R) * 0.6, y + rf(-R, R) * 0.4, 3, V6_C.fire, 30, { z: 2, glow: 1, life: 0.6 });
        },
        gdraw: (e, cx) => v6Ell(cx, x, y - 3, R, "#ff6a2a", 0.22 + 0.06 * Math.sin(G.t * 12), true),
      });
    });
    return true;
  },
  cannon(c) {
    if (!v6Need(c)) return false;
    const { p, tgt } = c;
    setFace(c.ang);
    p.anim = { k: "shoot", t: 0, dur: 0.3, a: c.ang, big: 1 };
    v6HeatAdd(25);
    later(0.12, () => {
      const [x, y] = handPos();
      fan(
        {
          k: "mbolt",
          x,
          y,
          spd: 200,
          mult: c.hit * c.r,
          o: c.o,
          col: "#ffb347",
          after: (pr, hm) => {
            for (const o of v6Near(pr.x, pr.y + 4, 14 * c.n)) o !== hm && v6Hit(o, c.hit * c.r * 0.5, c.o, { kb: 60 });
            v6Ro("mc_cannon", pr.x, pr.y + 4);
            shake(0.06);
          },
        },
        tgt,
        c.ang,
        c.m.proj,
      );
    });
    return true;
  },
  axe(c) {
    const R = 20 * c.n;
    v6HeatAdd(30);
    v6Ro("mc_axe", c.p.x, c.p.y);
    v6Ent({
      life: 2,
      iv: 0.25,
      tick: () => {
        const p = G.pl;
        p.anim = { k: "whirl", t: 0, dur: 0.25, a: p.face, R };
        for (const m of v6Near(p.x, p.y - 3, R)) v6Hit(m, c.hit * c.r, c.o, { kb: 40 });
      },
      draw: (e, cx) => v6Ell(cx, G.pl.x, G.pl.y - 3, R, "#e8e8e8", 0.35, false, 2),
    });
    return true;
  },
  plant(c) {
    if (!v6Need(c)) return false;
    const { tgt } = c,
      n = 3 + (c.m.minion || 0),
      dmgK = 1 + (c.m.mlife || 0);
    for (let i = 0; i < n; i++) {
      const a = (6.283 * i) / n,
        [x, y] = v6Clamp(tgt.x + Math.cos(a) * 14, tgt.y + Math.sin(a) * 9);
      v6Ent({
        k: "plant",
        life: 8,
        iv: 0.6,
        tick: () => {
          const near = v6Near(x, y, 12);
          if (near.length) {
            const m = near[0];
            v6Hit(m, c.hit * c.r * dmgK, Object.assign({}, c.o, { min: 0 }), { kb: 10, sx: x, sy: y });
            v6Fx({ k: "line", x, y: y - 4, x2: m.x, y2: m.y - 5, w: 1, life: 0.15, col: "#7ad46a" });
          }
        },
        draw: (e, cx) => {
          cx.save();
          cx.fillStyle = "#3a7a2a";
          cx.fillRect(x - 1, y - 7, 2, 7);
          cx.fillStyle = "#c83a5a";
          cx.beginPath();
          cx.arc(x, y - 8, 3 + Math.sin(G.t * 8 + i) * 0.6, 0, 6.283);
          cx.fill();
          cx.restore();
        },
      });
    }
    v6Ro("mc_plant", tgt.x, tgt.y);
    return true;
  },
  spore(c) {
    if (!v6Need(c)) return false;
    const { p, tgt } = c,
      R = 22 * c.n,
      x = tgt.x,
      y = tgt.y;
    setFace(c.ang);
    p.anim = { k: "shoot", t: 0, dur: 0.3, a: c.ang };
    const [hx, hy] = handPos();
    v6Lob(hx, hy, x, y, 0.3, "#c8a85a", () => {
      v6Fx({ k: "warn", x, y: y - 3, r: R, life: 0.8, col: V6_C.poison[0] });
      later(0.8, () => {
        for (const m of v6Near(x, y, R)) v6Hit(m, c.hit * c.r, Object.assign({}, c.o, { psn: c.o.pcap }), { kb: 90, sx: x, sy: y });
        v6Ro("mc_spore", x, y);
        burst(x, y - 3, 24, V6_C.poison, 120, { z: 3 });
        shake(0.1);
      });
    });
    return true;
  },
};
// 拋物線投擲物
function v6Lob(x0, y0, x1, y1, T, col, done) {
  v6Ent({
    life: T,
    end: done,
    draw: (e, cx) => {
      const k = Math.min(1, e.t / T),
        x = x0 + (x1 - x0) * k,
        y = y0 + (y1 - 4 - y0) * k - Math.sin(k * Math.PI) * 18;
      cx.save();
      cx.fillStyle = col;
      cx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
      cx.restore();
    },
  });
}
// 毒素結算
function v6Detonate(m, k) {
  if (!alive(m) || !m.psn || !m.psn.s || !m.psn.s.length) return;
  let sum = 0;
  for (const p of m.psn.s) if (p && p.t > 0) sum += (p.dps || 0) * p.t;
  if (sum > 0) {
    m.psn.s = [];
    dealMob(m, sum * k, false);
  }
}
// 盜賊終結技：消耗連擊點
function v6FinCp(c) {
  const g = v6G(),
    n = g.cp,
    per = V6_CP.per + v6Tal("v6cpDmg") + (v6Linked(c.g, "th_finish") ? 0.1 : 0);
  g.cp = v6Linked(c.g, "th_finish") ? Math.min(1, n) : 0;
  if (n) num(G.pl.x, G.pl.y - 30, `連擊 ×${n}`, "#ffd27a");
  return 1 + per * n;
}
// 服事：消耗全部氣球
function v6SphSpend(c) {
  const g = v6G(),
    n = Math.floor(g.sph);
  g.sph = v6Linked(c.g, "ac_focus") ? Math.min(1, n) : 0;
  return n * (1 + v6Tal("v6sphDmg"));
}
function v6HeatAdd(v) {
  if (v6Cls() !== "merchant") return;
  const g = v6G();
  g.heat += v * (1 + v6Tal("v6heat"));
  if (g.heat >= V6_HEAT.max) {
    g.heat = 0;
    const p = G.pl,
      R = 34 * PS.area;
    for (const m of v6Near(p.x, p.y - 3, R)) hitMob(m, V6_HEAT.boom * (1 + v6Tal("v6heatDmg")), { skill: 1, kb: 160, v6sk: "overheat" });
    v6Fx({ k: "ring", x: p.x, y: p.y - 3, r: R, life: 0.4, col: "#ff8a3a", grow: 1 });
    burst(p.x, p.y - 4, 30, V6_C.fire, 160, { z: 4, glow: 1 });
    shake(0.22);
    toast("過熱爆發！", "", 1);
  }
}

// ===========================================================================
// 5. 施放距離與時機
// ===========================================================================
const V6_SELF = { magnum: 20, ignite: 26, gcross: 40, rampage: 40, axe: 20, disso: 40, sanct: 26, heal: 22 };
const V6_ALWAYS = new Set(["song", "call", "hide", "clone", "orbs"]);
function v6Range(g) {
  const sk = SKILLS[g.id],
    k = sk.v6,
    n = PS.area * (1 + gemMods(g).area);
  if (V6_SELF[k]) return V6_SELF[k] * n;
  if (V6_ALWAYS.has(k)) return null;
  switch (k) {
    case "bash":
    case "bowl":
    case "spiral":
    case "slash":
    case "sonic":
    case "envenom":
    case "snatch":
    case "mark":
    case "mammon":
    case "combo":
      return PS.range + 6;
    case "asura":
    case "knuckle":
    case "term":
      return Math.max(PS.range + 6, 55);
    case "breath":
      return 50 * n;
    case "cartrev":
      return 26 * n;
    case "shboom":
      return 100;
    case "snipe":
      return Math.max(1.6 * PS.range, 90);
    default:
      return Math.max(1.4 * PS.range, 55);
  }
}
function v6Ready(g) {
  const sk = SKILLS[g.id],
    k = sk.v6,
    p = G.pl,
    t = p.tgt,
    v = v6G();
  if (G.dead) return false;
  const anyNear = (r) => mobsNear(p.x, p.y - 3, r).length > 0;
  switch (k) {
    case "heal":
      return S.hp < PS.maxhp * 0.75 || anyNear(V6_SELF.heal * PS.area);
    case "song":
      return anyNear(2 * PS.range + 40);
    case "call":
      return v.sph <= v6SphMax() - 2 && anyNear(2 * PS.range + 20);
    case "hide":
      return !v6Buf("hide") && anyNear(PS.range + 30);
    case "clone":
      return !v6Buf("clone") && anyNear(1.5 * PS.range + 20);
    case "orbs":
      return !v.ents.some((e) => e.k === "orb" && e.life - e.t > 2) && anyNear(40);
    case "asura":
      if (v.sph < 3) return false;
      break;
    case "rampage":
      if (v.sph < 2) return false;
      break;
    case "sonic":
    case "envenom":
      if (v.cp < Math.min(3, v6CpMax())) return false;
      break;
  }
  const r = v6Range(g);
  if (V6_SELF[k]) return anyNear(r);
  return alive(t) && dist(t, p) <= r;
}

// ===========================================================================
// 6. 繪圖
// ===========================================================================
function v6Ell(cx, x, y, r, col, al, fill, lw = 1) {
  if (r <= 0) return;
  cx.save();
  cx.globalAlpha = Math.max(0, Math.min(1, al));
  cx.beginPath();
  cx.ellipse(x, y, r, r * 0.7, 0, 0, 6.283);
  if (fill) (cx.fillStyle = col), cx.fill();
  else (cx.strokeStyle = col), (cx.lineWidth = lw), cx.stroke();
  cx.restore();
}
function v6DrawCross(cx, x, y, L, w, col, al) {
  cx.save();
  cx.globalAlpha = al;
  cx.fillStyle = col;
  cx.fillRect(x - L, y - w * 0.7, 2 * L, 1.4 * w);
  cx.fillRect(x - w, y - L * 0.7, 2 * w, 1.4 * L);
  cx.restore();
}
function v6DrawFx(cx, ground) {
  const g = G.v6;
  if (!g) return;
  for (const e of g.ents) {
    if (ground && e.gdraw) e.gdraw(e, cx);
    if (!ground && e.draw) e.draw(e, cx);
  }
  for (const f of g.fx) {
    const k = f.t / f.life,
      al = 1 - k;
    const isG = f.k === "warn" || f.k === "cross" || f.k === "cone";
    if (isG !== ground) continue;
    switch (f.k) {
      case "ring":
        v6Ell(cx, f.x, f.y, f.grow ? f.r * Math.min(1, 0.3 + k * 1.4) : f.r, f.col, al, false, 2);
        break;
      case "warn":
        v6Ell(cx, f.x, f.y, f.r, f.col, 0.18 + 0.2 * k, true);
        v6Ell(cx, f.x, f.y, f.r * k, f.col, 0.5, false);
        break;
      case "cross":
        v6DrawCross(cx, f.x, f.y, f.L, f.w, f.col, 0.55 * al);
        break;
      case "cone": {
        cx.save();
        cx.globalAlpha = 0.35 * al;
        cx.fillStyle = f.col;
        cx.beginPath();
        cx.moveTo(f.x, f.y);
        for (let i = 0; i <= 12; i++) {
          const a = f.a - f.h + (2 * f.h * i) / 12;
          cx.lineTo(f.x + Math.cos(a) * f.R, f.y + Math.sin(a) * f.R * 0.7);
        }
        cx.closePath();
        cx.fill();
        cx.restore();
        break;
      }
      case "line":
        cx.save();
        cx.globalAlpha = al;
        cx.strokeStyle = f.col;
        cx.lineWidth = f.w;
        cx.beginPath();
        cx.moveTo(f.x, f.y);
        cx.lineTo(f.x2, f.y2);
        cx.stroke();
        cx.restore();
        break;
      case "pillar":
        cx.save();
        cx.globalAlpha = 0.7 * al;
        cx.fillStyle = f.col;
        cx.fillRect(f.x - 3, f.y - 60, 6, 60);
        cx.globalAlpha = 0.4 * al;
        cx.fillRect(f.x - 6, f.y - 60, 12, 60);
        cx.restore();
        break;
      case "bolt": {
        cx.save();
        cx.globalAlpha = al;
        cx.strokeStyle = f.col;
        cx.lineWidth = 1.5;
        cx.beginPath();
        let x = f.x + rf(-3, 3),
          y = f.y - 60;
        cx.moveTo(x, y);
        for (let i = 0; i < 5; i++) (x = f.x + rf(-4, 4)), (y += 12), cx.lineTo(x, y);
        cx.stroke();
        cx.restore();
        break;
      }
      case "dive":
        cx.save();
        cx.globalAlpha = al;
        cx.strokeStyle = f.col;
        cx.lineWidth = 1;
        cx.beginPath();
        cx.moveTo(f.x - 10 + 10 * k, f.y - 14 + 14 * k);
        cx.lineTo(f.x, f.y);
        cx.stroke();
        cx.restore();
        break;
      case "aim":
        if (alive(f.m)) {
          cx.save();
          cx.globalAlpha = 0.5 + 0.5 * k;
          cx.strokeStyle = f.col;
          cx.lineWidth = 1;
          cx.beginPath();
          cx.moveTo(G.pl.x, G.pl.y - 7);
          cx.lineTo(f.m.x, f.m.y - 6);
          cx.stroke();
          v6Ell(cx, f.m.x, f.m.y - 6, 6 - 3 * k, f.col, 0.9, false);
          cx.restore();
        }
        break;
      case "notes":
        cx.save();
        cx.globalAlpha = al;
        cx.fillStyle = f.col;
        for (let i = 0; i < 3; i++) cx.fillRect(f.x - 8 + 8 * i, f.y - 10 * k - 3 * i, 2, 3);
        cx.restore();
        break;
    }
  }
}
// 角色身旁的資源顯示＋怪物身上的印記
function v6DrawHud(cx) {
  if (!S || !G.pl || G.dead) return;
  const g = v6G(),
    p = G.pl,
    cls = S.cls,
    x = p.x,
    y = p.y + 4;
  cx.save();
  if (cls === "sword") {
    const w = 18,
      v = g.lim / 100;
    cx.globalAlpha = 0.85;
    cx.fillStyle = "#1b1424";
    cx.fillRect(x - w / 2 - 1, y, w + 2, 3);
    cx.fillStyle = v >= 1 ? (G.t % 0.3 < 0.15 ? "#ffd84a" : "#ff8a3a") : "#e86a4a";
    cx.fillRect(x - w / 2, y + 1, Math.round(w * v), 1);
  } else if (cls === "bow") {
    for (let i = 0; i < V6_FOCUS.nth; i++) {
      cx.fillStyle = i < g.n4 % V6_FOCUS.nth ? "#ffd84a" : "#3a3446";
      cx.fillRect(x - 7 + 4 * i, y, 3, 2);
    }
  } else if (cls === "thief") {
    for (let i = 0; i < v6CpMax(); i++) {
      cx.fillStyle = i < g.cp ? "#ff5a6a" : "#3a3446";
      cx.fillRect(x - 9 + 4 * i, y, 3, 2);
    }
    if (v6Buf("hide")) {
      cx.globalAlpha = 0.4;
      v6Ell(cx, x, p.y - 6, 9, "#3a1a6a", 0.4, true);
    }
  } else if (cls === "acolyte") {
    const n = Math.floor(g.sph);
    for (let i = 0; i < n; i++) {
      const a = G.t * 2 + (6.283 * i) / Math.max(1, n);
      cx.fillStyle = "#ffd27a";
      cx.fillRect(Math.round(x + Math.cos(a) * 9) - 1, Math.round(p.y - 8 + Math.sin(a) * 5) - 1, 2, 2);
    }
  } else if (cls === "merchant" && S.tal?.asc === "ro_merchant_2") {
    const w = 18,
      v = g.heat / V6_HEAT.max;
    cx.fillStyle = "#1b1424";
    cx.fillRect(x - w / 2 - 1, y, w + 2, 3);
    cx.fillStyle = v > 0.75 ? "#ff5a3a" : "#ffb347";
    cx.fillRect(x - w / 2, y + 1, Math.round(w * v), 1);
  }
  cx.restore();
  // 怪物：元素印記、暗影印記、強酸
  for (const m of G.mobs) {
    if (m.v6m && m.v6m.t > G.t) {
      cx.fillStyle = V6_C[m.v6m.el][0];
      cx.fillRect(Math.round(m.x) - 1, Math.round(m.y - m.h - 6), 3, 3);
    }
    if (m.v6mark > G.t) v6Ell(cx, m.x, m.y - 2, 7, "#b08aff", 0.7, false);
    if (m.v6acid > G.t) {
      cx.fillStyle = "#9ad84a";
      cx.fillRect(Math.round(m.x) + 3, Math.round(m.y - m.h - 5), 2, 2);
    }
  }
}

// 各流派的傷害校準（以 Lv127 同裝備的頭目 60 秒單體傷害量測，讓非盜賊流派接近同一水準；盜賊另外 ×1.3）
const V6_BAL = {
  ro_sword_0: 1.22, ro_sword_1: 0.98, ro_sword_2: 1.28, ro_sword_3: 1.7,
  ro_bow_0: 1.05, ro_bow_1: 1.22, ro_bow_2: 1.19, ro_bow_3: 1.4,
  ro_mage_0: 1.21, ro_mage_1: 1.41, ro_mage_2: 1.63, ro_mage_3: 1.0,
  ro_acolyte_0: 1.4, ro_acolyte_1: 1.6, ro_acolyte_2: 2.05, ro_acolyte_3: 2.0,
  ro_merchant_0: 2.7, ro_merchant_1: 1.57, ro_merchant_2: 1.34, ro_merchant_3: 1.78,
};
const v6Bal = () => (S && S.tal && V6_BAL[S.tal.asc]) || 1;

// ===========================================================================
// 7. 執行期：事件、倍率、施放包裝
// ===========================================================================
const V6_AIL_EL = { brn: "fire", chl: "water", shk: "wind" };
const V6_COUNTER = { fire: "water", water: "fire", wind: "earth", earth: "wind" };
function v6CtxGem() {
  const id = typeof roFxContext !== "undefined" && roFxContext ? roFxContext.id : null;
  return id ? activeGems().find((g) => g.id === id) || null : null;
}
function v6React(m, a, b, gem) {
  const key = [a, b].sort().join("+"),
    R = V6_REACT[key];
  if (!R || !alive(m)) return;
  const K = R.k * (1 + v6Tal("v6react")) * (gem && v6Linked(gem, "mg_reson") ? 1.6 : 1);
  const o = { skill: 1, v6r: 1, kb: 20 };
  const tx = m.x,
    ty = m.y;
  num(tx, ty - m.h - 10, R.n, V6_C[b][0]);
  switch (key) {
    case "fire+water":
      hitMob(m, K, o);
      burst(tx, ty - 6, 12, ["#ffffff", "#e0f0ff"], 60, { z: 8, vz: 60 });
      break;
    case "fire+wind":
      for (const x of v6Near(tx, ty, R.r * PS.area)) hitMob(x, K, Object.assign({ ail: "brn", ailx: PS.ail }, o));
      v6Fx({ k: "ring", x: tx, y: ty - 3, r: R.r * PS.area, life: 0.3, col: V6_C.fire[0], grow: 1 });
      break;
    case "water+wind": {
      const ts = v6Near(tx, ty, 50).filter((x) => x !== m).slice(0, R.cnt);
      hitMob(m, K, o);
      for (const x of ts) {
        hitMob(x, K, Object.assign({ ail: "shk", ailx: PS.ail }, o));
        v6Fx({ k: "line", x: tx, y: ty - 5, x2: x.x, y2: x.y - 5, w: 1, life: 0.15, col: "#fffbd0" });
      }
      break;
    }
    case "earth+water":
      for (const x of v6Near(tx, ty, R.r * PS.area)) hitMob(x, K, o), (x.root = Math.max(x.root || 0, x.boss ? 0.4 : R.root));
      v6Fx({ k: "warn", x: tx, y: ty - 3, r: R.r * PS.area, life: 0.4, col: "#6a4a2a" });
      break;
    case "earth+fire":
      v6Ent({
        zone: 1,
      life: R.dur,
        iv: 0.5,
        tick: () => {
          for (const x of v6Near(tx, ty, R.r * PS.area)) hitMob(x, K, Object.assign({ ail: "brn", ailx: PS.ail }, o));
        },
        gdraw: (e, cx) => v6Ell(cx, tx, ty - 3, R.r * PS.area, "#ff5a1a", 0.3 + 0.08 * Math.sin(G.t * 10), true),
      });
      break;
    case "earth+wind":
      for (const x of v6Near(tx, ty, R.r * PS.area)) hitMob(x, K, Object.assign({}, o, { kb: 160, sx: tx, sy: ty }));
      burst(tx, ty - 3, 18, V6_C.earth, 120, { z: 4 });
      break;
  }
}
function v6OnHit(m, dmg, crit, o) {
  if (!o || !S) return;
  const g = v6G(),
    cls = S.cls;
  if (cls === "sword" && o.skill && !o.v6r) {
    const gem = o.v6g || g.curGem,
      lk = !!gem && v6Linked(gem, "sw_limit"),
      cap = V6_LIM.castCap * (lk ? 2 : 1),
      used = o.v6c ? o.v6c.lim : g.limCast;
    if (used < cap) {
      const v = V6_LIM.skillHit * (lk ? 2 : 1);
      if (o.v6c) o.v6c.lim += v;
      else g.limCast += v;
      v6LimAdd(v);
    }
  }
  if (cls === "mage" && !o.v6r && alive(m)) {
    const gem = v6CtxGem();
    let el = (o.v6el && V6_ELS.includes(o.v6el) && o.v6el) || V6_AIL_EL[o.ail] || (gem && V6_ELS.includes(SKILLS[gem.id]?.el) ? SKILLS[gem.id].el : null);
    if (el) {
      const mk = m.v6m && m.v6m.t > G.t ? m.v6m.el : null;
      if (mk && mk === el && gem && v6Linked(gem, "mg_conv")) el = V6_COUNTER[mk];
      if (mk && mk !== el) {
        m.v6m = null;
        v6React(m, mk, el, gem);
      } else m.v6m = { el, t: G.t + V6_MARK_T * (1 + v6Tal("v6mark")) };
    }
  }
  if (cls === "acolyte" && o.skill) {
    const gem = o.v6g || g.curGem,
      n = o.v6c ? o.v6c.grace : g.graceN || 0;
    if (gem && v6Linked(gem, "ac_grace") && n < 5) {
      if (o.v6c) o.v6c.grace = n + 1;
      else g.graceN = n + 1;
      heal(PS.maxhp * 0.01 * (1 + v6Tal("v6grace")));
    }
  }
}
function v6OnBasicHit(m) {
  const g = v6G();
  if (!S) return;
  if (S.cls === "sword") v6LimAdd(V6_LIM.basic);
  if (S.cls === "thief" && G.t >= (g.cpT || 0)) {
    g.cpT = G.t + V6_CP.basicIv;
    v6CpAdd(1);
  }
  if (S.cls === "bow" && alive(m) && RAND() < 0.12 + v6Tal("v6blitz")) {
    const gem = activeGems().find((x) => x.id === "bw_blitz");
    if (gem) {
      g.inExtra = 1;
      try {
        castSkill(gem, 0.5);
      } finally {
        g.inExtra = 0;
      }
    }
  }
}
function v6OnBasic() {
  const g = v6G();
  if (!S || S.cls !== "bow") return;
  g.nb = (g.nb || 0) + 1;
  if (g.nb % 4) return;
  for (const gem of activeGems())
    if (v6Linked(gem, "bw_fourth") && skillReady(gem)) {
      g.inExtra = 1;
      try {
        castSkill(gem, 0.6);
      } finally {
        g.inExtra = 0;
      }
    }
}
function v6OnHurt(d, real) {
  if (!S || !(real > 0)) return;
  const g = v6G();
  if (S.cls === "sword") {
    v6LimAdd((V6_LIM.hurt * real) / Math.max(1, PS.maxhp));
    if (G.t >= (g.parryT || 0))
      for (const gem of activeGems())
        if (v6Linked(gem, "sw_parry") && skillReady(gem)) {
          g.parryT = G.t + 1.5 * (1 - Math.min(0.5, v6Tal("v6parry")));
          castSkill(gem, 0.8 * (1 + v6Tal("v6parry")));
          break;
        }
  }
}
function v6OnKill(m) {
  if (!S || !m) return;
  if (S.cls === "thief" && m.v6mark > G.t) {
    const n = mobsNear(m.x, m.y, 80).filter((x) => x !== m && alive(x)).sort((a, b) => dist(a, m) - dist(b, m))[0];
    if (n) n.v6mark = G.t + 8;
    v6CpAdd(2);
  }
}
function v6LimitBranch() {
  const p = G.pl,
    b = S.tal?.asc;
  if (b === "ro_sword_0") for (const m of mobsNear(p.x, p.y, 45)) v6Stun(m, 1.5);
  else if (b === "ro_sword_1") addShd(PS.maxhp * 0.25, PS.maxhp * 0.25);
  else if (b === "ro_sword_2") v6SetBuf("limAs", 6);
  else if (b === "ro_sword_3") {
    // 鐵壁流：聖盾震擊，並嘲諷被擊中的敵人
    const t = alive(p.tgt) ? p.tgt : p;
    later(0.2, () => {
      for (const m of mobsNear(t.x, t.y, 30 * PS.area)) {
        m.tnt = Math.max(m.tnt || 0, 4 + tal("tntT"));
        hitMob(m, 3 * (1 + v6Tal("v6limDmg")), { skill: 1, kb: 120, v6r: 1 });
      }
      v6Fx({ k: "ring", x: t.x, y: t.y - 3, r: 30 * PS.area, life: 0.35, col: "#ffe08a", grow: 1 });
      burst(t.x, t.y - 4, 24, ["#ffe08a", "#ffffff", "#9ad0ff"], 140, { z: 4, glow: 1 });
    });
  }
}
function v6Tick(dt) {
  if (!G || !S) return;
  const g = v6G();
  for (let i = g.fx.length - 1; i >= 0; i--) if ((g.fx[i].t += dt) >= g.fx[i].life) g.fx.splice(i, 1);
  for (let i = g.ents.length - 1; i >= 0; i--) {
    const e = g.ents[i];
    e.t += dt;
    try {
      e.upd && e.upd(e, dt);
      if (e.tick) {
        e.acc += dt;
        while (e.acc >= e.iv) (e.acc -= e.iv), e.tick(e);
      }
    } catch (err) {}
    if (e.t >= e.life) {
      g.ents.splice(i, 1);
      try {
        e.end && e.end(e);
      } catch (err) {}
    }
  }
  if (g.ents.length > 120) g.ents.splice(0, g.ents.length - 120);
  if (G.dead) return;
  const near = G.pl && mobsNear(G.pl.x, G.pl.y, 70).length > 0;
  if (S.cls === "acolyte" && near) g.sph = Math.min(v6SphMax(), g.sph + dt / (V6_SPH.iv * (1 - Math.min(0.6, v6Tal("v6sphGen")))));
  if (S.cls === "merchant" && g.heat > 0) g.heat = Math.max(0, g.heat - V6_HEAT.decay * dt);
  if (v6Buf("song1")) for (const gem of activeGems()) if (G.pl.cds[gem.u] > 0) G.pl.cds[gem.u] -= dt * 0.25;
  if (g.sneakEnd && G.t > g.sneakEnd) {
    g.sneakEnd = 0;
    g.buf.hide = 0;
    g.sneak = 0;
  }
}
// 舊存檔：技能寶石換成新技能並取下
// 舊存檔讀取時缺少的欄位會由 newState 補上（v6=1），所以改看內容：還有不屬於本職業的主動技能寶石就要轉換
function v6NeedMig() {
  if (!S || !Array.isArray(S.gems) || !CLASS[S.cls]) return false;
  const own = CLASS[S.cls].gems;
  return S.gems.some((g) => g && SKILLS[g.id]?.act && !own.includes(g.id) && !g.sx && !SKILLS[g.id].leg);
}
function v6Migrate() {
  S.v6 = 1;
  if (!Array.isArray(S.gems)) return;
  const own = CLASS[S.cls].gems,
    map = V6_OLD[S.cls] || {};
  let n = 0,
    z = 0;
  const keep = [];
  for (const g of S.gems) {
    if (!g || !SKILLS[g.id]) continue;
    const sk = SKILLS[g.id];
    if (own.includes(g.id) || g.sx || sk.leg) {
      keep.push(g);
      continue;
    }
    if (sk.act) {
      g.id = map[g.id] || own.find((id) => SKILLS[id].act);
      delete g.sh;
      delete g.mu;
      keep.push(g);
      n++;
    } else if (sk.pas) keep.push(g);
    else (z += 200), n++;
  }
  S.gems = keep;
  for (const g of S.gems) (g.x = -1), (g.y = -1);
  if (Array.isArray(S.gpages)) S.gpages = S.gpages.map(() => []);
  if (z) S.ash += z;
  later(1.4, () => toast(`v6 技能重製：舊技能寶石已換成新技能（${n} 顆），請到「技能」頁重新擺放${z ? `；移除的輔助退還 ${z} Zeny` : ""}`, "lvl", 1));
}
function v6RuntimeInstall() {
  // 極限技：範圍在既有範圍上 ×1.3（乘算）
  const gm = gemMods;
  gemMods = function (t) {
    const a = gm(t),
      g = S && G && G.v6;
    if (g && g.limGem && g.limGem === t) a.area = (1 + a.area) * V6_LIM.area - 1;
    return a;
  };
  // 施放
  const sr = skillRange;
  skillRange = function (g) {
    const sk = SKILLS[g.id];
    return sk && sk.v6 && !sk.roBase && V6_CAST[sk.v6] ? v6Range(g) : sr(g);
  };
  const sre = skillReady;
  skillReady = function (g) {
    const sk = SKILLS[g.id];
    return sk && sk.v6 && !sk.roBase && V6_CAST[sk.v6] ? v6Ready(g) : sre(g);
  };
  const cs = castSkill;
  castSkill = function (t, a = 1) {
    const sk = SKILLS[t.id];
    if (!S || !sk || !sk.act || sk.aura || sk.sus) return cs(t, a);
    const g = v6G(),
      cls = S.cls;
    g.limCast = 0;
    g.graceN = 0;
    g.curGem = t;
    let lim = false,
      nth = false;
    if (cls === "sword" && g.lim >= 100 && !g.inExtra && v6LimOk(sk)) {
      lim = true;
      a *= V6_LIM.mul * (1 + v6Tal("v6limDmg")) * (v6Linked(t, "sw_limit") ? 1.5 : 1);
    }
    if (cls === "bow" && !g.inExtra) {
      g.n4++;
      if (g.n4 % V6_FOCUS.nth === 0) {
        nth = true;
        a *= V6_FOCUS.nthMul * (1 + v6Tal("v6fourth"));
      }
    }
    const kp = "sk:" + t.id + ":proj",
      ka = "sk:" + t.id + ":area";
    if (nth) ROSK[kp] = (ROSK[kp] || 0) + V6_FOCUS.nthProj;
    if (lim) g.limGem = t;
    let r;
    try {
      r = cs(t, a);
    } finally {
      if (nth) ROSK[kp] -= V6_FOCUS.nthProj;
      if (lim) g.limGem = null;
    }
    if (r !== false && r !== undefined) {
      if (lim) {
        g.lim = 0;
        const p = G.pl;
        num(p.x, p.y - 32, "極限技！", "#ffd84a", 1);
        burst(p.x, p.y - 8, 26, ["#ffd84a", "#ffffff", "#ff8a3a"], 140, { z: 8, glow: 1 });
        shake(0.2);
        v6LimitBranch();
      }
      if (nth) num(G.pl.x, G.pl.y - 30, "強化射擊", "#ffd84a");
      if (cls === "thief" && v6Buf("clone") && !g.inExtra)
        for (let i = 0; i < 2; i++)
          later(0.14 * (i + 1), () => {
            if (!placed().includes(t) || G.dead) return;
            g.inExtra = 1;
            try {
              cs(t, a * 0.35 * (1 + v6Tal("v6clone")));
            } finally {
              g.inExtra = 0;
            }
          });
      if (v6Linked(t, "th_step")) {
        v6SetBuf("hide", 1);
        g.sneak = Math.max(g.sneak || 0, 1.5);
      }
    }
    return r;
  };
  // 事件
  const rc = recalc;
  recalc = function (...x) {
    const r = rc.apply(this, x);
    if (PS) {
      PS.on ||= {};
      (PS.on.hit ||= []).push(v6OnHit);
      (PS.on.basicHit ||= []).push(v6OnBasicHit);
      (PS.on.basic ||= []).push(v6OnBasic);
      (PS.on.hurt ||= []).push(v6OnHurt);
      (PS.on.kill ||= []).push(v6OnKill);
    }
    return r;
  };
  // 倍率
  HIT_MUL.push(
    { k: "v6:focus", lab: () => S.cls === "bow" && "專注距離：越遠傷害越高（最多 +40%）", f: (t, m, s) => (S.cls === "bow" ? t * v6FocusMul(m) * (s && g6Lk(s, "bw_range") ? v6FocusMul(m) : 1) : t) },
    { k: "v6:magnum", f: (t, m, s) => (v6Buf("magnum") && !(s && s.skill) ? t * 1.25 : t) },
    {
      k: "v6:sneak",
      f: (t, m, s) => {
        const g = G.v6;
        if (!g || !(s && s.skill) || !v6Buf("hide") || !g.sneak) return t;
        if (!g.sneakEnd) g.sneakEnd = G.t + 0.35;
        return t * g.sneak * (1 + v6Tal("v6sneak"));
      },
    },
    { k: "v6:snatch", f: (t) => (v6Buf("snatch") ? t * (1 + 0.15 * (G.v6.snatch || 0)) : t) },
    { k: "v6:mark", f: (t, m) => (m && m.v6mark > G.t ? t * (1.3 + v6Tal("v6markDmg")) : t) },
    { k: "v6:acid", f: (t, m) => (m && m.v6acid > G.t ? t * 1.2 : t) },
    { k: "v6:song", f: (t) => (v6Buf("song2") ? t * 1.25 : t) },
    { k: "v6:bal", f: (t) => t * v6Bal(), est: () => v6Bal() },
  );
  HURT_MUL.push({ k: "v6:hide", f: () => (v6Buf("hide") ? 0.2 : 1) });
  SPD_AS.push(
    { k: "v6:song", f: () => (v6Buf("song0") ? 1.25 : 1) },
    { k: "v6:call", f: () => (v6Buf("call") ? 1.2 : 1) },
    { k: "v6:lim", f: () => (v6Buf("limAs") ? 1.4 : 1) },
  );
  // 每格更新與繪圖
  const tk = tick;
  tick = function (dt) {
    const r = tk.apply(this, arguments);
    try {
      v6Tick(dt);
    } catch (e) {}
    return r;
  };
  const dg = drawFxGround;
  drawFxGround = function (c) {
    const r = dg.apply(this, arguments);
    try {
      v6DrawFx(c, true);
    } catch (e) {}
    return r;
  };
  const dtp = drawFxTop;
  drawFxTop = function (c) {
    const r = dtp.apply(this, arguments);
    try {
      v6DrawFx(c, false);
      v6DrawHud(c);
    } catch (e) {}
    return r;
  };
  // 舊存檔
  const ns = newState;
  newState = function (...a) {
    const st = ns(...a);
    st.v6 = 1;
    return st;
  };
  const ens = roEnsureStats;
  roEnsureStats = function () {
    if (S && (S.v6 !== 1 || v6NeedMig())) v6Migrate();
    return ens();
  };
}
// 專注距離加倍：遠距精通連結的技能（由施放中的寶石判斷）
function g6Lk(s, id) {
  const g = G.v6?.curGem;
  return g && s.skill && v6Linked(g, id);
}

// ===========================================================================
// 9. 安裝（roV4Install 結束後）
// ===========================================================================
if (typeof roV4Install === "function") {
  const r4v6 = roV4Install;
  roV4Install = function () {
    r4v6();
    v6RuntimeInstall();
    v6TalInstall();
    if (typeof v6LateInstall === "function") v6LateInstall();
  };
}

// ===========================================================================
// 10. 職業天賦：對應新技能、加入核心機制排、重製冷門天賦
// ===========================================================================
const V6_OLD_SPEC = typeof RO_ASC_SPEC !== "undefined" ? JSON.parse(JSON.stringify(RO_ASC_SPEC)) : {};
// 分支專屬的舊技能 → 新技能（優先於職業共用對照）
const V6_TAL_MAP = {
  ro_sword_0: { heavy: "sw_bash", whirl: "sw_bowl", thrust: "sw_brandish" },
  ro_sword_1: { guard: "sw_shboom", taunt: "sw_provoke" },
  ro_sword_2: { swave: "sw_spiral", leap: "sw_wave", whirl: "sw_wave" },
  ro_sword_3: { frostsl: "sw_frost", fire: "sw_breath" },
  ro_bow_0: { pierce: "bw_sharp", rain: "bw_blitz", exarrow: "bw_snipe" },
  ro_bow_1: { rain: "bw_shower", cvul: "bw_corrode" },
  ro_bow_2: { pierce: "bw_double", iarrow: "bw_burst", trap: "bw_ankle" },
  ro_bow_3: { bsong: "bw_bsong", rain: "bw_song", dissonance: "bw_disso" },
  ro_mage_0: { chain: "mg_lov", fire: "mg_meteor", nova: "mg_storm" },
  ro_mage_1: { summon: "mg_spirits", bliz: "mg_field", chain: "mg_fireball" },
  ro_mage_2: { cwk: "mg_quag", cvul: "mg_quag", miasma: "mg_tetra" },
  ro_mage_3: { meteor: "mg_napalm", bliz: "mg_gravity", chain: "mg_quake" },
  ro_thief_0: { envenom: "th_envenom", venom: "th_venom", miasma: "th_slash" },
  ro_thief_1: { backstab: "th_backstab", trap: "th_hide", sonic: "th_snatch" },
  ro_thief_2: { blink: "th_clone", backstab: "th_slash" },
  ro_thief_3: { cwk: "th_weak", cvul: "th_weak", backstab: "th_mark" },
  ro_acolyte_0: { sanctuary: "ac_sanct", heal: "ac_heal", holy: "ac_light" },
  ro_acolyte_1: { asura: "ac_asura", palm: "ac_combo" },
  ro_acolyte_2: { angel: "ac_orbs", guard: "ac_orbs", heal: "ac_magnus" },
  ro_acolyte_3: { tiger: "ac_rampage", palm: "ac_finger", asura: "ac_knuckle" },
  ro_merchant_0: { cart: "mc_term", taunt: "mc_hfall", mammonite: "mc_mammon" },
  ro_merchant_1: { faw: "mc_firebomb" },
  ro_merchant_2: { mammonite: "mc_cannon", cart: "mc_axe" },
  ro_merchant_3: { acid: "mc_spore", miasma: "mc_miasma", cart: "mc_plant" },
};
// 核心機制排（取代原本的元素排）：[名稱, 效果]
const V6_MECH = {
  sword: [["極限蓄力", { v6limGain: 0.35 }], ["極限爆發", { v6limDmg: 0.4 }]],
  bow: [["鷹之專注", { v6focus: 0.6 }], ["第四擊強化", { v6fourth: 0.35 }]],
  mage: [["元素共振", { v6react: 0.45 }], ["印記延長", { v6mark: 0.6, ail: 0.15 }]],
  thief: [["連擊上限", { v6cpMax: 1 }], ["致命連擊", { v6cpDmg: 0.1 }]],
  acolyte: [["氣之共鳴", { v6sphPas: 0.04 }], ["凝氣", { v6sphGen: 0.3, v6sphMax: 1 }]],
  merchant: [["重型手推車", { v6cart: 0.6 }], ["精打細算", { v6zeny: 0.4, dmgp: 8 }]],
};
const V6_MECH3 = {
  ro_sword_0: ["保齡衝擊", { "sk:sw_bowl:more": 0.3, "sk:sw_bowl:area": 0.2 }],
  ro_sword_1: ["盾牌精通", { "sk:sw_shboom:more": 0.3, armorp: 20 }],
  ro_sword_2: ["螺旋極意", { "sk:sw_spiral:more": 0.35 }],
  ro_sword_3: ["龍血", { "sk:sw_breath:more": 0.3, "sk:sw_breath:area": 0.15 }],
  ro_bow_0: ["獵鷹訓練", { v6blitz: 0.08, "sk:bw_blitz:more": 0.2 }],
  ro_bow_1: ["腐蝕精通", { "sk:bw_corrode:more": 0.35 }],
  ro_bow_2: ["爆裂精通", { "sk:bw_burst:more": 0.3, trapMax: 1 }],
  ro_bow_3: ["安可曲", { v6song: 0.5, "sk:bw_disso:more": 0.2 }],
  ro_mage_0: ["怒雷精通", { "sk:mg_lov:more": 0.3 }],
  ro_mage_1: ["領域擴張", { "sk:mg_field:more": 0.35, "sk:mg_field:area": 0.2 }],
  ro_mage_2: ["四元素精通", { "sk:mg_tetra:more": 0.3 }],
  ro_mage_3: ["念力精通", { "sk:mg_napalm:proj": 1, "sk:mg_gravity:more": 0.2 }],
  ro_thief_0: ["毒爆精通", { "sk:th_envenom:more": 0.3 }],
  ro_thief_1: ["偷襲大師", { v6sneak: 0.5 }],
  ro_thief_2: ["殘影強化", { v6clone: 0.5 }],
  ro_thief_3: ["印記強化", { v6markDmg: 0.15 }],
  ro_acolyte_0: ["治癒精通", { "sk:ac_heal:more": 0.4 }],
  ro_acolyte_1: ["霸凰之力", { "sk:ac_asura:more": 0.3, v6sphDmg: 0.15 }],
  ro_acolyte_2: ["聖靈精通", { "sk:ac_orbs:minion": 1, "sk:ac_magnus:more": 0.15 }],
  ro_acolyte_3: ["崩捶精通", { "sk:ac_rampage:more": 0.3 }],
  ro_merchant_0: ["神匠之鎚", { "sk:mc_hfall:more": 0.3, "sk:mc_hfall:area": 0.15 }],
  ro_merchant_1: ["火焰瓶精通", { "sk:mc_firebomb:more": 0.4 }],
  ro_merchant_2: ["熱量控制", { v6heat: 0.3, v6heatDmg: 0.6 }],
  ro_merchant_3: ["植物培育", { "sk:mc_plant:minion": 1, "sk:mc_spore:more": 0.2 }],
};
// 共鳴排的機制版（v6 新輔助沒有「效果 ×1.6」可放大）
const V6_RES = { sword: { v6limGain: 0.2 }, bow: { v6focus: 0.3 }, mage: { v6react: 0.2 }, thief: { v6cpDmg: 0.05 }, acolyte: { v6sphGen: 0.2 }, merchant: { v6cart: 0.3 } };
// 重製的冷門天賦：[分支, 排, 位置, 名稱, 效果]
const V6_REDO = [
  // 神官：原本以召喚天使為主，改為十字聖域與聖靈環繞
  ["ro_acolyte_2", 0, 0, "神官智力", { "rsc:4:skill": 0.8 }],
  ["ro_acolyte_2", 0, 1, "神官體魄", { "rsc:1:lifep": 0.5, "rsc:1:regenPct": 0.00004 }],
  ["ro_acolyte_2", 0, 2, "祈福幸運", { "rsc:3:crit": 0.08, "rsc:3:critm": 0.4 }],
  ["ro_acolyte_2", 1, 0, "十字聖域", { "sk:ac_magnus:more": 0.3, "sk:ac_magnus:area": 0.15 }],
  ["ro_acolyte_2", 1, 1, "聖靈增殖", { "sk:ac_orbs:minion": 1, "sk:ac_orbs:more": 0.15 }],
  ["ro_acolyte_2", 1, 2, "天使之怒精通", { "sk:ac_wrath:cd": 0.3, crs: 0.2 }],
  ["ro_acolyte_2", 3, 0, "聖域延展", { gndT: 0.3, area: 10 }],
  ["ro_acolyte_2", 3, 1, "神聖連結", { crit: 6, critm: 25 }],
  ["ro_acolyte_2", 3, 2, "審判之光", { fullCrit: 1, h_undead: 0.15 }],
  ["ro_acolyte_2", 5, 0, "神之審判", { boss: 0.25 }],
  ["ro_acolyte_2", 5, 1, "聖歌漸強", { h_ramp: 0.03, cdr: 3 }],
  ["ro_acolyte_2", 5, 2, "天之懲戒", { exec: 0.4, h_undead: 0.1 }],
  ["ro_acolyte_2", 6, 0, "天使之盾", { dmgTaken: 0.1, res_shadow: 15 }],
  ["ro_acolyte_2", 6, 1, "治癒祈禱", { regenPct: 0.005, lifep: 8, pot: 20 }],
  ["ro_acolyte_2", 6, 2, "聖母之愛", { h_cheat: 0.4, lifep: 6 }],
  ["ro_acolyte_2", 7, 0, "智力之極・神官", { "rscm:4:dmg": 0.35 }],
  ["ro_acolyte_2", 7, 1, "驅魔奧義", { "nth:ac_magnus": 1.2, "sk:ac_magnus:cd": 0.15 }],
  ["ro_acolyte_2", 7, 2, "神官之道", { "rscm:4:dmg": 0.2, "rsc:1:lifep": 0.4 }],
  // 流氓：沒有陷阱了
  ["ro_thief_1", 7, 0, "影襲", { v6sneak: 0.4, critShd: 0.008 }],
  // 鐵匠：沒有挑釁了
  ["ro_merchant_0", 3, 1, "財富之盾", { v6zeny: 0.2, dmgTaken: 0.12 }],
  ["ro_merchant_0", 7, 1, "神匠", { v6cart: 0.4, "sk:mc_term:more": 0.2 }],
  // 傷害為 0 或機制不符的技能加成
  ["ro_mage_0", 1, 2, "雷擊精通", { "sk:mg_lov:more": 0.25, "sk:mg_lov:area": 0.15 }],
  ["ro_mage_2", 1, 1, "惡毒詠唱", { "nth:mg_tetra": 1.0, "sk:mg_quag:cd": 0.25 }],
  ["ro_thief_3", 1, 2, "鏡像印記", { "nth:th_mark": 1.0, "sk:th_weak:area": 0.3 }],
  ["ro_acolyte_0", 7, 0, "聖光奧義", { "nth:ac_light": 0.9, "sk:ac_light:area": 0.3 }],
  // 十字軍：英靈召喚改為盾牌迴旋
  ["ro_sword_1", 1, 2, "盾擊反射", { "sk:sw_shboom:more": 0.25, armDmg: 0.008 }],
];
// 分支說明（核心技能｜輔助｜玩法）
const V6_BR_D = {
  ro_sword_0: "保齡球擊撞飛敵群連鎖撞擊，極限技使周圍敵人暈眩",
  ro_sword_1: "盾牌迴旋與自傷換回復的聖十字，極限技給予護盾",
  ro_sword_2: "螺旋擊刺單體爆發與狂暴，極限技提高攻擊速度",
  ro_sword_3: "龍息與點燃爆破的火焰範圍，極限技追加盧恩爆炸",
  ro_bow_0: "遠距離銳利射擊與蓄力狙擊，獵鷹自動突擊",
  ro_bow_1: "毒箭疊毒、腐蝕引爆一次結算",
  ro_bow_2: "定位陷阱與爆裂箭，第四箭自動補刀",
  ro_bow_3: "切換樂章增益、不協和音與樂靈",
  ro_mage_0: "隕石、暴風雪、怒雷的大範圍元素反應",
  ro_mage_1: "元素領域持續烙印與元素精靈",
  ro_mage_2: "四元素漩渦一次觸發多種反應，泥沼詛咒",
  ro_mage_3: "重力場聚怪、念力爆發與崩裂術",
  ro_thief_0: "毒刃疊毒，毒素爆發終結",
  ro_thief_1: "隱匿偷襲 ×3、強奪疊加傷害",
  ro_thief_2: "鋒刃連斬累積連擊點、音速投擲終結與殘影分身",
  ro_thief_3: "暗影印記跳躍與弱點詛咒",
  ro_acolyte_0: "治癒溢出轉成聖光、光耀之堂",
  ro_acolyte_1: "三段連打掌、練氣凝聚氣球、阿修羅霸凰拳一次清空",
  ro_acolyte_2: "十字驅魔聖域與聖靈環繞",
  ro_acolyte_3: "閃電步突進、大纏崩捶與指彈消耗氣球",
  ro_merchant_0: "大地之擊暈眩、手推車終結與金錢攻擊",
  ro_merchant_1: "生命體、強酸火煙瓶與火焰瓶",
  ro_merchant_2: "FAW 砲台、加農砲與斧頭龍捲，熱量滿時過熱爆發",
  ro_merchant_3: "毒雲、地獄植物與孢子爆炸",
};
function v6TalInstall() {
  Object.assign(V5_TAL_TXT, {
    v6limGain: (v) => `極限槽累積 +${v5P(v)}%`,
    v6limDmg: (v) => `極限技傷害 ${v5X(v)}`,
    v6focus: (v) => `專注距離加成 +${v5P(v)}%`,
    v6fourth: (v) => `強化射擊（每第 4 次施放）傷害 ${v5X(v)}`,
    v6blitz: (v) => `普通攻擊觸發獵鷹突擊的機率 +${v5P(v)}%`,
    v6song: (v) => `樂章持續時間 +${v5P(v)}%`,
    v6react: (v) => `元素反應傷害 +${v5P(v)}%`,
    v6mark: (v) => `元素印記持續時間 +${v5P(v)}%`,
    v6cpMax: (v) => `連擊點上限 +${v}`,
    v6cpDmg: (v) => `終結技每個連擊點的傷害再 +${v5P(v)}%`,
    v6sneak: (v) => `偷襲傷害 +${v5P(v)}%`,
    v6hide: (v) => `隱匿時間 +${v5P(v)}%`,
    v6clone: (v) => `殘影分身持續時間與傷害 +${v5P(v)}%`,
    v6markDmg: (v) => `暗影印記使目標受到的傷害再 +${v5P(v)}%`,
    v6sphPas: (v) => `每顆氣球使傷害 +${v5P(v)}%`,
    v6sphGen: (v) => `氣球凝聚速度 +${v5P(v)}%`,
    v6sphMax: (v) => `氣球上限 +${v}`,
    v6sphDmg: (v) => `消耗氣球的技能，每顆氣球的效果 +${v5P(v)}%`,
    v6cart: (v) => `手推車重量加成 +${v5P(v)}%`,
    v6zeny: (v) => `技能花費的 Zeny −${v5P(v)}%`,
    v6heat: (v) => `熱量累積 +${v5P(v)}%`,
    v6heatDmg: (v) => `過熱爆發傷害 +${v5P(v)}%`,
  });
  const mapId = (cls, bk, id) => {
    if (CLASS[cls].gems.includes(id)) return id;
    const sp = V6_OLD_SPEC[cls]?.[ASC[cls].findIndex((b) => b.k === bk)];
    const nsp = V6_SPEC[cls][ASC[cls].findIndex((b) => b.k === bk)];
    let n = V6_TAL_MAP[bk]?.[id];
    if (!n && sp) {
      const i = [sp[1], sp[2], sp[3]].indexOf(id);
      if (i >= 0) n = nsp[i];
    }
    n ||= V6_OLD[cls]?.[id];
    if (!n || !CLASS[cls].gems.includes(n)) n = nsp[0];
    return n;
  };
  const remap = (cls, bk, e, t) => {
    const out = {};
    for (const [k, v] of Object.entries(e || {})) {
      let nk = k;
      const m = /^(sk|nth):([a-zA-Z0-9_]+)(.*)$/.exec(k);
      if (m && SKILLS[m[2]] && (SKILLS[m[2]].act || m[1] === "nth")) nk = m[1] + ":" + mapId(cls, bk, m[2]) + m[3];
      if (k.startsWith("sp:")) {
        const sid = k.split(":")[1];
        if (SKILLS[sid]?.v6sup) {
          Object.assign(out, V6_RES[cls]);
          if (t) t.v6res = 1;
          continue;
        }
      }
      out[nk] = typeof v === "object" ? v : (out[nk] || 0) + v;
    }
    return out;
  };
  for (const [cls, bs] of Object.entries(ASC))
    bs.forEach((b) => {
      b.t.forEach((row) => row.forEach((t) => (t.e = remap(cls, b.k, t.e, t))));
      // 第 5 排（原本的元素排）→ 核心機制
      const row = b.t[4];
      if (row && V6_MECH[cls]) {
        const opts = [...V6_MECH[cls], V6_MECH3[b.k]];
        row.forEach((t, i) => {
          const o = opts[i];
          if (o) Object.assign(t, { n: o[0], e: { ...o[1] } });
        });
      }
      for (const [bk, r, i, n, e] of V6_REDO) if (bk === b.k && b.t[r]?.[i]) Object.assign(b.t[r][i], { n, e: { ...e } });
      b.t.forEach((row, ri) =>
        row.forEach((t) => {
          t.src = null;
          if (ri !== 2) t.d = v5TalText(t.e);
          else if (t.v6res) t.d = v5TalText(Object.fromEntries(Object.entries(t.e).filter(([k]) => k !== "v5rd")));
        }),
      );
      if (V6_BR_D[b.k] && b.d) b.d = b.d.replace(/｜[^｜]*$/, "｜" + V6_BR_D[b.k]);
      if (b.trait) b.trait.d = v5TalText(b.trait.e);
    });
  // 移除天賦的參考來源標籤
  for (const k of Object.keys(V5_TAL_SRC)) delete V5_TAL_SRC[k];
  for (const v of Object.values(HELP)) if (Array.isArray(v) && Array.isArray(v[1])) v[1] = v[1].filter((r) => r[0] !== "來源標籤");
  // 機制倍率
  HIT_MUL.push({ k: "v6:sph", f: (t) => (S && S.cls === "acolyte" && v6Tal("v6sphPas") ? t * (1 + v6Tal("v6sphPas") * Math.floor(G.v6?.sph || 0)) : t) });
}

// ===========================================================================
// 11. 其他調整：專家天賦（隱藏）、穿梭寶石、特效 RO 化
// ===========================================================================
// 共用天賦樹的職業獨特天賦：改名「專家」，暫不開放（資料保留於 RO_TREE_UNIQUE_SPEC）
const V6_EXPERT_OPEN = false;
function v6ExpertInstall() {
  if (typeof RO_KIND_NAME !== "undefined") RO_KIND_NAME.unique = "專家";
  if (V6_EXPERT_OPEN) return;
  const isU = (id) => RO_TREE_NODES[id]?.kind === "unique";
  if (typeof roTreeGrow === "function") {
    const g = roTreeGrow;
    roTreeGrow = function (saved) {
      for (const id of Object.keys(saved || {})) if (isU(id)) delete saved[id];
      return g(saved);
    };
  }
  if (typeof roTreeBlock === "function") {
    const b = roTreeBlock;
    roTreeBlock = function (n, r) {
      return n && n.kind === "unique" ? "專家天賦尚未開放" : b(n, r);
    };
  }
  if (typeof roTreeRender === "function") {
    const rr = roTreeRender;
    roTreeRender = function (...a) {
      if (roTreeView === "unique") roTreeView = "tree";
      if (isU(roTreeSelected)) roTreeSelected = RO_TREE_LAYOUT.hub[0];
      if (roTreeDraft) for (const id of Object.keys(roTreeDraft)) if (isU(id)) delete roTreeDraft[id];
      const out = rr.apply(this, a);
      try {
        document.querySelector('#sheet [data-ro-tree="unique"]')?.remove();
        const p = document.querySelector("#sheet .tree-header p");
        if (p) p.innerHTML = p.innerHTML.replace(/ · 獨特天賦 <b>\d+<\/b>/, "");
        for (const el of document.querySelectorAll("#sheet .tree-detail .note"))
          if (/獨特天賦 10 點/.test(el.textContent)) el.textContent = el.textContent.replace(/；獨特天賦 10 點/, "");
        const mg = document.querySelector("#sheet .tree-migration");
        if (mg) mg.textContent = mg.textContent.replace("、終極與獨特天賦", "與終極天賦");
      } catch (e) {}
      return out;
    };
  }
  if (ui.m_rotree) {
    const m = ui.m_rotree;
    ui.m_rotree = function (...a) {
      return m.apply(this, a).replace(/另有只強化單一職業技能的「職業獨特天賦」，不佔終極名額。/, "");
    };
  }
}

// 穿梭寶石：所有怪物統一 0.01%；效果與本職業輔助相同（只是名稱不同）的不會掉落
function v6SxInstall() {
  if (typeof V5_SX === "undefined") return;
  Object.assign(V5_SX, { n: 1e-4, e: 1e-4, b: 1e-4 });
  const sig = (id) => {
    const m = SKILLS[id]?.mod || {};
    // 只看效果種類（傷害、冷卻、範圍、投射物…），數值略有不同也視為同一種效果
    return Object.keys(m).filter((k) => m[k]).sort().join(",");
  };
  v5SxPool = function (cls) {
    const own = CLASS[cls].gems,
      acts = own.filter((g) => SKILLS[g]?.act),
      ownSig = new Set(own.filter((g) => SKILLS[g] && !SKILLS[g].act && !SKILLS[g].pas).map(sig));
    const seen = new Set();
    return Object.keys(SKILLS).filter((id) => {
      const s = SKILLS[id];
      if (s.act || s.pas || s.leg || !s.mod || own.includes(id)) return false;
      // v6 職業機制輔助（極限突破、第四箭…）依賴原職業機制，不當穿梭寶石
      if (!Object.keys(s.mod).length || V6_SUP_IDS.has(id)) return false;
      const k = sig(id);
      if (ownSig.has(k) || seen.has(k) || !acts.some((a) => v5SupFits(id, a))) return false;
      seen.add(k);
      return true;
    });
  };
}
const V6_SUP_IDS = new Set(["sw_limit", "sw_parry", "bw_fourth", "bw_range", "mg_reson", "mg_conv", "th_finish", "th_step", "ac_focus", "ac_grace", "mc_invest", "mc_heavy"]);

// 特效選單：拖尾、擊中、擊殺改為 RO 屬性風格
const V6_TRAIL = [
  ["聖・天使之羽", ["#ffffff", "#ffe9a8", "#e8c860"], "#fff4c8"],
  ["地・森之息", ["#f0ffc0", "#9ad84a", "#3a6a1a"]],
  ["念・魂光", ["#ffffff", "#c8b0ff", "#6a4ad0"], "#b89aff"],
  ["地・流沙", ["#fff0c8", "#d8a860", "#7a5228"]],
  ["水・泡沫", ["#ffffff", "#7ad0ff", "#2a6ad0"]],
  ["水・霜凍", ["#ffffff", "#b8ecff", "#4aa0e0"], "#9adcff"],
  ["火・火焰", ["#fff0a0", "#ff7a2a", "#a01a0a"]],
  ["毒・毒霧", ["#e8ffb0", "#9ae04a", "#5a2a7a"]],
  ["無・Zeny", ["#fffbe0", "#ffd84a", "#a87a1a"]],
  ["暗・暗影", ["#e0d0ff", "#7a3ad0", "#1a0a3a"], "#6a2ac0"],
  ["風・雷光", ["#ffffff", "#fff07a", "#7adca0"], "#e8ff9a"],
  ["不死・冥火", ["#e0ffe8", "#7ad8a0", "#2a3a4a"], "#6ad89a"],
  ["聖・十字光", ["#ffffff", "#fff0b0", "#d8a83a"], "#ffe48a"],
  ["火・熔岩", ["#fff0b0", "#ff9a2a", "#6a1a0a"], "#ff7a1a"],
  ["暗・血霧", ["#ffd0d0", "#d03a4a", "#3a0a1a"]],
];
// 擊中：風（雷擊）、水（冰晶）、念（靈魂）；擊殺：風（怒雷）、水（暴風雪）、暗（冥界之門）
const V6_GFX = {
  hn: ["風屬性・雷擊", "水屬性・冰晶", "念屬性・靈魂擊"],
  kn: ["風屬性・怒雷", "水屬性・暴風雪", "暗屬性・冥界之門"],
  h: [["windhit1"], ["freeze"], null],
  k: [["lightning", "windhit1"], ["stormgust"], ["hell_in"]],
};
function v6FxInstall() {
  V6_TRAIL.forEach(([n, c, aft], i) => {
    const t = TRAIL[i];
    if (!t) return;
    t.n = n;
    t.c = c;
    if (aft) t.aft = aft;
    else delete t.aft;
  });
  GODS.forEach((g, i) => {
    if (V6_GFX.hn[i]) (g.hn = V6_GFX.hn[i]), (g.kn = V6_GFX.kn[i]);
  });
  if (typeof roFxProfiles !== "undefined")
    for (let i = 0; i < 3; i++) {
      roFxProfiles["v6gh" + i] = V6_GFX.h[i] ? { str: V6_GFX.h[i], target: 1 } : { custom: "shadow", target: 1 };
      roFxProfiles["v6gk" + i] = { str: V6_GFX.k[i], target: 1, ground: i === 1 };
    }
  let last = -9;
  const gh = gfHit;
  gfHit = function (t, a, s, e, n) {
    gh(t, a, s, e, n);
    if (t === GF && typeof roFxAdd === "function" && G.t - last > 0.12) {
      last = G.t;
      try { roFxAdd("v6gh" + a, s, e, { area: 0.55 }); } catch (x) {}
    }
  };
  const gk = gfKill;
  gfKill = function (t, a, s, e, n) {
    gk(t, a, s, e, n);
    if (t === GF && typeof roFxAdd === "function")
      try { roFxAdd("v6gk" + a, s.x, s.y - (a === 1 ? 0 : (s.h || 10) * 0.4), { area: s.boss ? 1.2 : s.elite ? 0.9 : 0.7 }); } catch (x) {}
  };
  if (HELP.fx) {
    const L = HELP.fx[1];
    L.splice(0, 0, ["RO 屬性", "拖尾依 RO 屬性命名（聖、地、念、水、火、毒、無、暗、風、不死）；擊中與擊殺特效疊加 RO 原版技能動畫（雷擊、冰晶、暴風雪、冥界之門…）。"]);
  }
}

// 舊裝備上的「技能傷害」詞綴（skx_舊技能）在 v6 已不存在：換成對應的新技能，找不到就移除
function v6FixAffix(it, cls) {
  if (!it || !Array.isArray(it.af)) return 0;
  let n = 0;
  it.af = it.af.filter((e) => {
    if (!e) return false;
    const af = AFFIX[e.a];
    if (af && !(af.w === 0 && af.skx && e.a !== "skx_" + af.skx)) return true;
    n++;
    if (typeof e.a === "string" && e.a.startsWith("skx_")) {
      const old = e.a.slice(4),
        maps = [V6_OLD[cls] || {}, ...Object.values(V6_OLD)];
      for (const m of maps) {
        const nw = m[old];
        if (nw && AFFIX["skx_" + nw]) {
          e.a = "skx_" + nw;
          return true;
        }
      }
    }
    return false;
  });
  return n;
}
const V6_FIXED = new WeakSet();
var V6_BUILD = "v1.5.5";
function v6FixItems() {
  if (!S) return;
  // 身上裝備每次都檢查（很便宜），背包與倉庫每個角色只檢查一次
  let n = 0;
  for (const k of Object.keys(S.equip || {})) n += v6FixAffix(S.equip[k], S.cls);
  if (V6_FIXED.has(S)) {
    if (n) later(1.6, () => toast(`v6：${n} 條舊技能傷害詞綴已換成對應的新技能`, "lvl", 1));
    return;
  }
  V6_FIXED.add(S);
  for (const it of S.bag || []) n += v6FixAffix(it, S.cls);
  try {
    const st = typeof STH !== "undefined" && STH ? STH : typeof stLoad === "function" ? stLoad() : null;
    let m = 0;
    for (const x of st?.it || []) if (x.k === "bag") m += v6FixAffix(x.o, S.cls);
    if (m && typeof stWrite === "function") stWrite(st);
    n += m;
  } catch (e) {}
  if (n) later(1.6, () => toast(`v6：${n} 條舊技能傷害詞綴已換成對應的新技能`, "lvl", 1));
}
// 保險：舊技能的 skx_ 詞綴保留為「別名」（效果算在對應新技能上、不會再掉落），舊裝備即使沒轉換也不會出錯
function v6AffixAlias() {
  for (const [cls, m] of Object.entries(V6_OLD))
    for (const [old, nw] of Object.entries(m)) {
      const k = "skx_" + old, t = AFFIX["skx_" + nw];
      if (AFFIX[k] || !t) continue;
      AFFIX[k] = { n: t.n, f: t.f, w: 0, t: t.t, skx: nw, s: [] };
    }
}
function v6LateInstall() {
  v6AffixAlias();
  if (typeof collectMods === "function") {
    const cm = collectMods;
    collectMods = function (...a) {
      v6FixItems();
      return cm.apply(this, a);
    };
  }
  v6ExpertInstall();
  v6JobInstall();
  v6RankInstall();
  v6SxInstall();
  v6FxInstall();
  if (typeof v6AbyInstall === "function") v6AbyInstall();
  if (typeof v6BossInstall === "function") v6BossInstall();
}

// ===========================================================================
// 12. 後期頭目新技能：十字、外環（躲內側）、直列、橫列
// ===========================================================================
const V6_BSK = {
  v6cross: { n: "十字審判", t: 1.3, w: 9, k: 1.15, c: "#fff2a8" },
  v6ring: { n: "外環震爆", t: 1.8, r: 125, ri: 30, k: 1.25, c: "#ff6a4a" },
  v6col: { n: "直列落雷", t: 1.3, w: 9, gap: 72, wave: 0.9, k: 1, c: "#bfe4ff" },
  v6row: { n: "橫列衝擊", t: 1.3, w: 8, gap: 46, wave: 0.9, k: 1, c: "#ffb07a" },
};
// 地圖頭目的非首位技能傷害 ×BOSS_SK.minor；新技能是大範圍預警招式，補回一部分
const v6BskDmg = (a) => (G.guard == null ? a * 2 : a);
const v6BLine = (t, x, y, x2, y2, e, dmg, delay = 0) => {
  const f = () =>
    alive(t) && !G.dead &&
    addHaz({ k: "line", x, y, x2, y2, w: e.w, t: e.t, dmg, src: t, c: e.c, nk: 1,
      go: (h) => {
        for (let i = 0; i <= 4; i++)
          G.flashes.push({ x: h.x + ((h.x2 - h.x) * i) / 4, y: h.y + ((h.y2 - h.y) * i) / 4, t: 0, ring: 1, c: e.c });
      } });
  delay ? later(delay, f) : f();
};
function v6BossSkills() {
  const L = 6, R = () => G.W - 6, T = () => G.top + 4, B = () => G.H - 4;
  Object.assign(BOSS_SK, {
    v6cross: Object.assign({}, V6_BSK.v6cross, {
      go: (t, a, s, e) => {
        t.hold = e.t;
        const d = v6BskDmg(a) * e.k;
        v6BLine(t, L, s.y, R(), s.y, e, d);
        v6BLine(t, s.x, T(), s.x, B(), e, d);
        v6Ro("v6gk0", s.x, s.y);
      },
    }),
    v6ring: Object.assign({}, V6_BSK.v6ring, {
      go: (t, a, s, e) => {
        t.hold = e.t;
        G.flashes.push({ x: t.x, y: t.y - 0.5 * t.h, t: 0, ring: 1, c: e.c });
        addHaz({ x: t.x, y: t.y, r: e.r, ri: e.ri, t: e.t, dmg: v6BskDmg(a) * e.k, src: t, c: e.c, nk: 1, v6ring: 1,
          go: (h) => {
            for (let i = 0; i < 10; i++) {
              const q = (i / 10) * 6.283;
              G.flashes.push({ x: h.x + Math.cos(q) * (h.ri + 22), y: h.y + Math.sin(q) * (h.ri + 22) * 0.7, t: 0, ring: 1, c: e.c });
            }
          } });
      },
    }),
    v6col: Object.assign({}, V6_BSK.v6col, {
      go: (t, a, s, e) => {
        t.hold = 0.5;
        const d = v6BskDmg(a) * e.k;
        for (let w = 0; w < 2; w++)
          for (let i = -2; i <= 2; i++) {
            const x = s.x + (i + w * 0.5) * e.gap;
            if (x < L || x > R()) continue;
            v6BLine(t, x, T(), x, B(), e, d, w * e.wave);
          }
      },
    }),
    v6row: Object.assign({}, V6_BSK.v6row, {
      go: (t, a, s, e) => {
        t.hold = 0.5;
        const d = v6BskDmg(a) * e.k;
        for (let w = 0; w < 2; w++)
          for (let i = -2; i <= 2; i++) {
            const y = s.y + (i + w * 0.5) * e.gap;
            if (y < T() || y > B()) continue;
            v6BLine(t, L, y, R(), y, e, d, w * e.wave);
          }
      },
    }),
  });
  for (const [k, v] of Object.entries(V6_BSK)) SK_N[k] = v.n;
}
// 哪些頭目會用：Lv61 以後的地圖頭目（第 9～11 張 2 招、Lv78 以後 4 張全部）、深淵頭目、最終守護者與魔王
const V6_BSK_ALL = ["v6cross", "v6ring", "v6col", "v6row"];
const v6BossKs = (m) => {
  if (typeof v56AbyActive === "function" && v56AbyActive()) return V6_BSK_ALL;
  if (m >= 11 && m < MAP_N) return V6_BSK_ALL;
  if (m >= 8 && m < MAP_N) return m === 10 ? ["v6ring", "v6col"] : m === 9 ? ["v6cross", "v6row"] : ["v6cross", "v6col"];
  return null;
};
function v6BossInstall() {
  v6BossSkills();
  const sb = startBoss;
  startBoss = function (...a) {
    const r = sb.apply(this, a);
    const b = G.boss;
    if (b && b.bs && b.god == null && G.trial == null && !curMap().ss) {
      const add = v6BossKs(S.map);
      if (add) b.bs.ks = [...b.bs.ks, ...add.filter((k) => !b.bs.ks.includes(k))];
    }
    return r;
  };
  const oldF = typeof FINAL !== "undefined" ? FINAL.ks.map((k) => SK_N[k]).join("、") : "",
    oldM = typeof MONARCH !== "undefined" ? MONARCH.ks.map((k) => SK_N[k]).join("、") : "";
  if (typeof FINAL !== "undefined" && Array.isArray(FINAL.ks))
    for (const k of ["v6ring", "v6col"]) if (!FINAL.ks.includes(k)) FINAL.ks.push(k);
  if (typeof MONARCH !== "undefined" && Array.isArray(MONARCH.ks))
    for (const k of V6_BSK_ALL) if (!MONARCH.ks.includes(k)) MONARCH.ks.push(k);
  // 說明文字裡的技能列表同步更新
  const fix = (x) =>
    typeof x === "string"
      ? x.replace("輪流使用：" + oldF + "。", "輪流使用：" + FINAL.ks.map((k) => SK_N[k]).join("、") + "。").replace("輪流使用：" + oldM + "。", "輪流使用：" + MONARCH.ks.map((k) => SK_N[k]).join("、") + "。")
      : Array.isArray(x) ? x.map(fix) : x;
  if (oldF)
    for (const k of Object.keys(HELP)) {
      const v = fix(HELP[k]);
      if (JSON.stringify(v) !== JSON.stringify(HELP[k])) HELP[k] = v;
    }
  HELP.v6boss = ["後期頭目技能", [
    ["十字審判", "以你為中心、橫豎貫穿整個場地的十字光束；往斜角方向離開交叉點。"],
    ["外環震爆", "以頭目為中心的大環，只有貼近頭目的內圈（白色描邊）與最外側安全；橙線由外往內收縮，收到內圈時引爆。"],
    ["直列落雷", "兩波縱向落雷，第一波對準你所在的直線，第二波落在空隙；看準節奏左右移動。"],
    ["橫列衝擊", "兩波橫向衝擊，同樣分兩波交錯；上下移動閃避。"],
    ["誰會使用", "第 9～11 張地圖頭目各 2 招；Lv78 以後的 4 張新地圖頭目、所有深淵頭目與魔王使用全部 4 招；最終守護者加入外環與直列。"],
  ]];
  // 外環：躲向內側（或外側較近的一邊）
  const dd = dodgeDir;
  dodgeDir = function () {
    const p = G.pl;
    for (const h of G.haz) {
      if (!h.ri || !h.dg || !inHaz(h, p.x, p.y, 3)) continue;
      let dx = p.x - h.x, dy = p.y - h.y;
      const d = Math.hypot(dx, 1.4 * dy) || 1;
      const inward = d - h.ri < h.r - d;
      if (d < 0.5) (dx = 1), (dy = 0);
      else (dx /= d), (dy /= d);
      return inward ? [-dx, -dy] : [dx, dy];
    }
    return dd();
  };
  // 外環的繪製：只畫環帶，內側安全區留空並描邊
  const dh = drawHaz;
  drawHaz = function (c) {
    const rings = G.haz.filter((h) => h.ri && h.k !== "line" && h.k !== "frost");
    if (!rings.length) return dh(c);
    G.haz = G.haz.filter((h) => !rings.includes(h));
    try {
      dh(c);
    } finally {
      G.haz.push(...rings);
    }
    for (const h of rings) {
      const e = 1 - h.t / h.T, ry = h.r * 0.7, iy = h.ri * 0.7;
      c.globalAlpha = 0.24 + 0.2 * e;
      c.fillStyle = h.c;
      for (let y = -Math.floor(ry); y <= ry; y++) {
        const ox = Math.floor(h.r * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
        const ix = Math.abs(y) < iy ? Math.floor(h.ri * Math.sqrt(1 - (y * y) / (iy * iy))) : 0;
        const yy = Math.round(h.y + y);
        if (ix) {
          c.fillRect(Math.round(h.x - ox), yy, ox - ix, 1);
          c.fillRect(Math.round(h.x + ix), yy, ox - ix, 1);
        } else c.fillRect(Math.round(h.x - ox), yy, ox * 2, 1);
      }
      // 收縮中的預警線（由外往內）
      c.globalAlpha = G.t % 0.2 < 0.12 ? 1 : 0.6;
      const rr = h.r - (h.r - h.ri) * e;
      for (const [r0, col] of [[h.r, h.c], [rr, h.c], [h.ri, "#e8fff0"]])
        for (let q = 0; q < 6.283; q += 1.2 / Math.max(6, r0)) {
          c.fillStyle = col;
          c.fillRect(Math.round(h.x + Math.cos(q) * r0), Math.round(h.y + Math.sin(q) * r0 * 0.7), 1, 1);
        }
      c.globalAlpha = 1;
    }
  };
}

// ===========================================================================
// 13. v6 新技能圖示（RO 原版技能圖示，assets/ro-v3/skills/<id>.png）
// ===========================================================================
(() => {
  const A = typeof window !== "undefined" && window.RO_ASSETS;
  if (!A) return;
  A.skills ||= {};
  for (const id of [1001, 251, 254, 2002, 2008, 129, 381, 319, 316, 317, 285, 2217, 361, 400, 272, 267, 264, 2327, 485, 229, 2259, 2279])
    A.skills[id] ||= { file: `skills/${id}.png`, width: 24, height: 24 };
})();

// ===========================================================================
// 14. 流派專屬技能：商店只賣一轉基本技能＋目前流派的技能（依 RO 轉職路線）
//     其他流派的技能只能從變異寶石取得（取得後可正常使用）
// ===========================================================================
const V6_JOB = {
  // 值：可購買的流派編號；"base" 為一轉技能（所有流派）
  sw_bash: "base", sw_magnum: "base", sw_provoke: "base",
  sw_bowl: [0], sw_brandish: [0], sw_charge: [0],
  sw_shboom: [1], sw_gcross: [1],
  sw_spiral: [2], sw_berserk: [2], sw_wave: [2],
  sw_breath: [3], sw_ignite: [3], sw_frost: [3],
  bw_double: "base", bw_shower: "base",
  bw_sharp: [0], bw_snipe: [0], bw_blitz: [0],
  bw_varrow: [1], bw_corrode: [1],
  bw_ankle: [2], bw_burst: [2],
  bw_song: [3], bw_bsong: [3], bw_disso: [3],
  mg_fireball: "base", mg_frost: "base", mg_bolt: "base", mg_napalm: "base",
  mg_meteor: [0], mg_storm: [0], mg_lov: [0],
  mg_field: [1], mg_spirits: [1],
  mg_tetra: [2], mg_quag: [2],
  mg_gravity: [3], mg_quake: [3],
  th_venom: "base", th_hide: "base", th_dual: "base",
  th_envenom: [0], th_slash: [0, 2], th_sonic: [0, 2],
  th_snatch: [1], th_backstab: [1],
  th_clone: [2],
  th_mark: [3], th_weak: [3],
  ac_light: "base", ac_heal: "base",
  ac_sanct: [0],
  ac_combo: [1], ac_call: [1, 3], ac_asura: [1, 3],
  ac_magnus: [2], ac_orbs: [2], ac_wrath: [2],
  ac_knuckle: [3], ac_rampage: [3], ac_finger: [3],
  mc_mammon: "base", mc_cartrev: "base",
  mc_hfall: [0], mc_term: [0],
  mc_homun: [1], mc_acidbomb: [1], mc_firebomb: [1],
  mc_faw: [2], mc_cannon: [2], mc_axe: [2],
  mc_miasma: [3], mc_plant: [3], mc_spore: [3],
  // 輔助寶石：數值類與核心機制輔助通用（不列出）；RO 職業特色輔助歸流派
  sw_counter: [0], sw_parry: [1], sw_runeb: [3],
  bw_falcon: [0], bw_poison: [1], bw_trap: [2], bw_ens: [3], bw_ens2: [3],
  mg_spirit: [1], mg_spirit2: [1],
  pstack: [0], th_toxin: [0], th_crit: [0, 2], th_ambush: [1], th_shadow: [3],
  ac_ray: [0], ac_holy: [0, 2], ac_triple: [1, 3], ac_spirit: [1, 3], ac_fury: [1, 3], ac_angel: [2], ac_angel2: [2],
  mc_hammer: [0], mc_over: [0], mcount: [1, 3], mdmg: [1, 3], mc_acid: [1, 3], mc_cot: [1], mc_proj: [2], mc_prec: [2],
};
const V6_SHOP_PRICE = 200;
const v6BranchIdx = () => (S?.tal?.asc && ASC[S.cls] ? ASC[S.cls].findIndex((b) => b.k === S.tal.asc) : -1);
// 這個主動技能能不能用商店／任務取得（輔助、被動、非 v6 技能一律可以）
function v6ShopOk(id) {
  const j = V6_JOB[id];
  if (!j || !SKILLS[id] || SKILLS[id].pas) return true;
  if (j === "base") return true;
  return j.includes(v6BranchIdx());
}
const v6JobName = (id) => {
  const j = V6_JOB[id];
  if (!Array.isArray(j)) return "";
  const cls = SKILLS[id]?.cls || Object.keys(V6_CLASS).find((c) => V6_CLASS[c].act.includes(id));
  return j.map((i) => ASC[cls]?.[i]?.n.split("・")[0]).filter(Boolean).join("、");
};
function v6JobInstall() {
  // 商店：暫時讓 roGemOk 同時檢查流派（不影響擺放規則）
  if (ui.m_shop) {
    const ms = ui.m_shop;
    ui.m_shop = function (...a) {
      const ok = roGemOk;
      roGemOk = (id) => ok(id) && v6ShopOk(id);
      let h;
      try {
        h = ms.apply(this, a);
      } finally {
        roGemOk = ok;
      }
      if (this.shopV === "act" || this.shopV === "sup")
        h = h.replace(/(<p class="note"[^>]*>)/, `$1其他流派的${this.shopV === "act" ? "技能" : "輔助"}只能從變異寶石取得。${v6BranchIdx() < 0 ? "轉職後才會販售流派專屬寶石；" : ""}`);
      return h;
    };
  }
  // 任務獎勵：其他流派的技能改給一轉基本技能
  const gg = giveGem;
  giveGem = function (id, ...r) {
    if (SKILLS[id] && !v6ShopOk(id)) {
      const act = !!SKILLS[id].act,
        base = CLASS[S.cls].gems.filter((g) => !!SKILLS[g]?.act === act && !SKILLS[g]?.pas && v6ShopOk(g));
      id = base.find((g) => !S.gems.some((x) => x.id === g)) || base[0] || id;
    }
    return gg(id, ...r);
  };
  // 舊存檔：非變異的其他流派技能寶石移除，退還商店價格
  const ens = roEnsureStats;
  roEnsureStats = function () {
    const r = ens();
    if (S && S.v6job !== 1 && Array.isArray(S.gems)) {
      S.v6job = 1;
      // 其他構築頁使用中的流派也算（構築可切換流派）
      const brs = new Set([v6BranchIdx(), ...(Array.isArray(S.bld) ? S.bld : []).map((b) => (b?.asc ? ASC[S.cls].findIndex((x) => x.k === b.asc) : -1))]);
      const okAny = (id) => V6_JOB[id] === "base" || V6_JOB[id].some((i) => brs.has(i));
      const rm = S.gems.filter((g) => g && SKILLS[g.id] && !SKILLS[g.id].pas && !SKILLS[g.id].leg && Array.isArray(V6_JOB[g.id]) && CLASS[S.cls].gems.includes(g.id) && !g.mu && !g.sx && !okAny(g.id));
      if (rm.length) {
        const ids = new Set(rm.map((g) => g.u));
        S.gems = S.gems.filter((g) => !ids.has(g.u));
        S.ash += rm.length * V6_SHOP_PRICE;
        const names = [...new Set(rm.map((g) => SKILLS[g.id].n))].join("、");
        later(2, () => toast(`流派寶石調整：移除 ${rm.length} 顆其他流派的寶石（${names}），退還 ${rm.length * V6_SHOP_PRICE} Zeny；其他流派寶石改由變異寶石取得`, "lvl", 1));
        try { recalc(); } catch (e) {}
      }
    }
    return r;
  };
  // 說明
  if (HELP.shop) HELP.shop[1].push(["流派寶石", "商店只販售一轉基本技能、通用輔助，以及目前流派的專屬技能與輔助；其他流派的寶石只能從變異寶石取得，取得後可正常放上技能盤。"]);
}

// ===========================================================================
// 15. 線上排行榜（無限武鬥場）：只在網址版啟用，伺服器為 Netlify 函式 /api/rank
// ===========================================================================
const V6RK = {
  api: "/api/rank",
  cls: "all",
  list: null,
  total: 0,
  err: "",
  loading: false,
  at: 0,
  last: null, // 最近一次上傳結果
};
const v6RkOn = () =>
  (typeof location !== "undefined" && /^https?:$/.test(location.protocol) && !/^(localhost|127\.|\[::1\])/.test(location.hostname)) ||
  (typeof window !== "undefined" && window.V6_RK_TEST);
const V6_CLS_N = { all: "全部", sword: "劍士", bow: "弓箭手", mage: "魔法師", thief: "盜賊", acolyte: "服事", merchant: "商人" };
const v6Fmt = (n) => (n >= 1e9 ? (n / 1e9).toFixed(2) + "B" : n >= 1e6 ? (n / 1e6).toFixed(2) + "M" : n >= 1e4 ? (n / 1e3).toFixed(1) + "K" : String(Math.round(n)));
const v6Sec = (s) => {
  s = Math.round(s);
  const m = Math.floor(s / 60);
  return m ? `${m} 分 ${s % 60} 秒` : `${s} 秒`;
};
function v6RkTok() {
  if (!S.rkTok || !/^[a-f0-9]{32,64}$/.test(S.rkTok)) {
    const a = new Uint8Array(16);
    (crypto?.getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => (a[i] = Math.floor(Math.random() * 256))));
    S.rkTok = [...a].map((x) => x.toString(16).padStart(2, "0")).join("");
    markDirty();
  }
  return S.rkTok;
}
const v6Txt = (h) => String(h ?? "").replace(/<[^>]*>/g, "").trim();
// 這場的快照：裝備、技能盤、天賦、素質
function v6RkSnap(ra) {
  const eq = [];
  for (const slot of SLOTS) {
    const it = S.equip?.[slot];
    if (!it) continue;
    const lines = [];
    for (const e of [...(it.bx || []).map((x) => ({ a: x.k, v: x.v })), ...(it.af || [])]) {
      const A = AFFIX[e.a];
      try {
        if (A?.f) lines.push(v6Txt(A.f(Math.round(e.v * 10) / 10)));
      } catch (x) {}
    }
    const cards = (it.cards || []).filter(Boolean).map((id) => V5_CARDS?.find?.((c) => c.id === id)?.n || id);
    eq.push({ s: SLOT_NAME?.[slot] || slot, n: v6Txt(itemName(it)), r: it.uq ? "獨特" : RAR_NAME[it.rar] || "", ref: it.ref || 0, af: lines.slice(0, 12), c: cards });
  }
  const gems = [];
  for (const g of activeGems()) {
    const sk = SKILLS[g.id];
    if (!sk) continue;
    let sup = [];
    try {
      sup = linkedSupports(g).map((x) => SKILLS[x.id]?.n + (x.sx ? "（穿梭）" : "")).filter(Boolean);
    } catch (x) {}
    gems.push({ n: sk.n, mu: g.mu ? v6Txt(roMutText(g)) : "", sx: g.sx ? 1 : 0, sup });
  }
  const br = ASC[S.cls]?.find((b) => b.k === S.tal?.asc);
  const tal = [];
  for (const k of S.tal?.p || []) {
    for (const row of br?.t || []) {
      const o = row.find?.((x) => x.k === k);
      if (o) tal.push(o.n);
    }
  }
  const ult = Object.values(RO_TREE_NODES || {})
    .filter((n) => n.kind === "ultimate" && S.roTree?.ranks?.[n.id])
    .map((n) => n.name);
  // 遊戲原本的構築快照（裝備完整資料、技能拼圖位置、天賦、屬性面板）＋變異資料
  let snap = null;
  try {
    snap = lbSnap();
    snap.gm = placed().map((g) => {
      const o = { id: g.id, x: g.x, y: g.y, rot: g.rot };
      if (g.sh) o.sh = g.sh;
      if (g.sx) o.sx = g.sx;
      if (g.mu) o.mu = g.mu;
      return o;
    });
    snap.lv = S.lvl;
  } catch (e) {
    snap = null;
  }
  return {
    snap,
    eq,
    gems,
    tal,
    ult,
    st: [...(S.roStats || [])],
    curse: (ra?.curses || []).map((c) => c[0]),
    sheet: Math.round(PS.dps || 0),
    hp: Math.round(PS.maxhp || 0),
  };
}
async function v6RkSubmit(rec) {
  if (!v6RkOn()) return;
  try {
    const r = await fetch(V6RK.api, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(rec) });
    const j = await r.json();
    V6RK.last = j;
    V6RK.at = 0;
    if (j.ok && j.best) toast(`線上排行：新紀錄！第 ${rec.floor} 層（${v6Sec(rec.sec)}），目前排名第 ${j.rank} 名`, "lvl", 1);
    else if (j.ok) toast(`線上排行：這場第 ${rec.floor} 層，未超過你的最佳紀錄（第 ${j.rec?.floor} 層）`, "lvl");
    else toast("線上排行上傳失敗：" + (j.error || r.status), "bad");
  } catch (e) {
    toast("線上排行上傳失敗（連線問題）", "bad");
  }
}
async function v6RkFetch(force) {
  if (!v6RkOn() || V6RK.loading) return;
  if (!force && V6RK.list && Date.now() - V6RK.at < 30000) return;
  V6RK.loading = true;
  V6RK.err = "";
  try {
    const r = await fetch(`${V6RK.api}?cls=${V6RK.cls}`, { cache: "no-store" });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || r.status);
    V6RK.list = j.list || [];
    V6RK.total = j.total || 0;
    V6RK.at = Date.now();
  } catch (e) {
    V6RK.err = "無法讀取排行榜：" + (e.message || e);
  }
  V6RK.loading = false;
  if (ui.tab === "more" && ui.moreView === "orank") ui.render();
}
// 快照畫面上方附加：武鬥場成績、終極天賦、素質、變異寶石
const V6RK_REC = {};
function v6RkExtra(x) {
  const d = x.d || {},
    st = ["力量", "體質", "敏捷", "幸運", "智力", "靈巧"],
    mut = (d.gems || []).filter((g) => g.mu).map((g) => `${g.n}（${g.mu}）`);
  return `<div class="box stack v6rk-ex">
    <div class="v6rk-top"><span>無限武鬥場 第 <b class="px">${x.floor}</b> 層</span><span>耗時 <b class="px">${v6Sec(x.sec)}</b></span><span>實際 DPS <b class="px">${v6Fmt(x.dps)}</b></span></div>
    ${d.curse?.length ? `<div class="note" style="margin:0">負面效果：${esc(d.curse.join("、"))}</div>` : ""}
    <div class="note" style="margin:0">終極天賦：${esc((d.ult || []).join("、") || "無")}</div>
    <div class="note" style="margin:0">素質：${(d.st || []).map((v, i) => `${st[i]} <b class="px">${+v || 0}</b>`).join("　")}</div>
    ${mut.length ? `<div class="note" style="margin:0">變異寶石：${esc(mut.join("、"))}</div>` : ""}
    <div class="note" style="margin:0">${new Date(x.t).toLocaleString()}</div></div>`;
}
async function v6RkDetail(id, rank) {
  $("#sheet").className = "wide v6rk-sheet";
  $("#sheetBg").hidden = false;
  $("#sheet").innerHTML = `<h2>讀取中…</h2>`;
  try {
    const r = await fetch(`${V6RK.api}?id=${encodeURIComponent(id)}`, { cache: "no-store" });
    const x = await r.json();
    if (!r.ok) throw new Error(x.error || r.status);
    // 新格式：沿用遊戲的構築快照畫面
    const sc = x.d?.snap && typeof snapClean === "function" ? snapClean(x.d.snap) : null;
    if (sc && ui.snapOpen) {
      sc.lv = x.lv;
      const key = "v6:" + x.id;
      LB.snap[key] = { s: sc, ts: x.t };
      V6RK_REC[key] = x;
      ui.snapPg = 0;
      ui.snapOpen({ v6: 1, p: key, name: x.name, cls: x.cls, br: sc.br, lv: x.lv, floor: x.floor, r: rank || "-" }, undefined);
      return;
    }
    const d = x.d || {},
      li = (a) => (a || []).map((s) => `<li>${esc(String(s))}</li>`).join(""),
      st = ["力量", "體質", "敏捷", "幸運", "智力", "靈巧"];
    $("#sheet").innerHTML = `<h2>${esc(x.name)} <small>${esc(V6_CLS_N[x.cls] || x.cls)}・${esc(x.br || "未轉職")}・Lv.${x.lv}</small></h2>
      <div class="v6rk-top"><span>第 <b class="px">${x.floor}</b> 層</span><span><b class="px">${v6Sec(x.sec)}</b></span><span>DPS <b class="px">${v6Fmt(x.dps)}</b></span><span>面板 DPS <b class="px">${v6Fmt(d.sheet || 0)}</b></span><span>生命 <b class="px">${v6Fmt(d.hp || 0)}</b></span></div>
      <p class="note">${new Date(x.t).toLocaleString()}${d.curse?.length ? `・負面效果：${esc(d.curse.join("、"))}` : ""}</p>
      <h3>裝備</h3><div class="v6rk-eq">${(d.eq || [])
        .map((e) => `<div class="v6rk-it"><b>${esc(e.s)}</b>・${esc(e.n)} <small>${esc(e.r)}${e.ref ? `・+${e.ref}` : ""}</small><ul>${li(e.af)}${e.c?.length ? `<li>卡片：${esc(e.c.join("、"))}</li>` : ""}</ul></div>`)
        .join("") || "<p class=note>無</p>"}</div>
      <h3>技能盤</h3><div class="v6rk-eq">${(d.gems || [])
        .map((g) => `<div class="v6rk-it"><b>${esc(g.n)}</b>${g.mu ? ` <small>變異：${esc(g.mu)}</small>` : ""}<ul>${g.sup?.length ? li(g.sup.map((s) => "連結：" + s)) : "<li>無連結輔助</li>"}</ul></div>`)
        .join("") || "<p class=note>無</p>"}</div>
      <h3>天賦</h3><p>${esc((d.tal || []).join("、") || "無")}</p>
      <h3>共用天賦樹・終極天賦</h3><p>${esc((d.ult || []).join("、") || "無")}</p>
      <h3>素質</h3><p>${(d.st || []).map((v, i) => `${st[i]} <b class="px">${+v || 0}</b>`).join("　")}</p>
      <div class="row"><span class="spacer"></span><button class="btn primary" data-act="close">關閉</button></div>`;
  } catch (e) {
    $("#sheet").innerHTML = `<h2>讀取失敗</h2><p class="note">${esc(String(e.message || e))}</p><div class="row"><span class="spacer"></span><button class="btn" data-act="close">關閉</button></div>`;
  }
}
function v6RankInstall() {
  // 紀錄：每層通過時累計傷害與戰鬥秒數；整場經過時間另外計算
  const tk = twTick;
  twTick = function (t) {
    const a = G.tw;
    if (a?.ra && !G.dead) a.v6el = (a.v6el || 0) + t;
    return tk(t);
  };
  const cl = twClear;
  twClear = function (m) {
    const a = G.tw;
    if (a?.ra) {
      a.v6dd = (a.v6dd || 0) + (a.dd || 0);
      a.v6ct = (a.v6ct || 0) + Math.max(0, (a.t0 || 0) - (a.t || 0));
      a.v6best = { floor: a.f, sec: a.v6el || 0, dd: a.v6dd, ct: a.v6ct };
    }
    return cl(m);
  };
  const end = twEnd;
  twEnd = function (why) {
    const a = G.tw,
      ra = a?.ra,
      b = a?.v6best;
    let rec = null;
    if (ra && b && b.floor >= 1 && S) {
      try {
        rec = {
          id: S.cid,
          tok: v6RkTok(),
          name: S.name || "無名",
          cls: S.cls,
          br: ASC[S.cls]?.find((x) => x.k === S.tal?.asc)?.n || "",
          lv: S.lvl,
          floor: b.floor,
          sec: Math.max(0.1, Math.round(b.sec * 10) / 10),
          dps: Math.round(b.dd / Math.max(1, b.ct)),
          d: v6RkSnap(ra),
        };
      } catch (e) {
        rec = null;
      }
    }
    const r = end.apply(this, arguments);
    if (rec) v6RkSubmit(rec);
    return r;
  };
  // 快照畫面：v6 排行紀錄不向原版伺服器讀取，並在畫面上方附加武鬥場成績
  if (typeof lbSnapGet === "function") {
    const sg = lbSnapGet;
    lbSnapGet = function (t, ...a) {
      if (t && t.v6) return;
      return sg(t, ...a);
    };
  }
  if (ui.snapOpen) {
    const so = ui.snapOpen;
    ui.snapOpen = function (t, ...a) {
      const r = so.call(this, t, ...a);
      if (t && t.v6 && V6RK_REC[t.p])
        try {
          const sh = $("#sheet"),
            row = sh.querySelector(".seg") || sh.querySelector(".row:last-child");
          if (row && !sh.querySelector(".v6rk-ex")) row.insertAdjacentHTML("beforebegin", v6RkExtra(V6RK_REC[t.p]));
          sh.classList.add("v6rk-sheet");
        } catch (e) {}
      return r;
    };
  }
  // 選單
  if (!MENU.some((m) => m[0] === "orank")) {
    const i = MENU.findIndex((m) => m[0] === "log");
    MENU.splice(i >= 0 ? i : MENU.length, 0, ["orank", "線上排行", "mnR"]);
  }
  ui.m_orank = function () {
    const head = `<h2>線上排行・無限武鬥場</h2>`;
    if (!v6RkOn())
      return head + `<div class="box"><p class="note" style="margin:0">線上排行只在網址版開放（xianjingro.fun）。直接開啟本機 index.html 時不會上傳也無法查看。</p></div>`;
    v6RkFetch();
    const tabs = `<div class="seg" style="margin-bottom:8px">${Object.entries(V6_CLS_N)
      .map(([k, n]) => `<button data-v6rk-cls="${k}" aria-pressed="${V6RK.cls === k}">${n}</button>`)
      .join("")}</div>`;
    const mine = S?.cid,
      body = V6RK.err
        ? `<p class="note">${esc(V6RK.err)}</p>`
        : !V6RK.list
          ? `<p class="note">讀取中…</p>`
          : !V6RK.list.length
            ? `<p class="note">還沒有紀錄。挑戰無限武鬥場，結束時會自動上傳。</p>`
            : `<div class="list v6rk-list">${V6RK.list
                .map(
                  (r, i) =>
                    `<button class="li v6rk-row${r.id === mine ? " me" : ""}" data-v6rk-id="${esc(r.id)}" data-v6rk-r="${i + 1}"><span class="v6rk-n px">${i + 1}</span><span class="grow"><b>${esc(r.name)}</b> <small>${esc(V6_CLS_N[r.cls] || r.cls)}・${esc(r.br || "未轉職")}・Lv.${r.lv}</small></span><span class="v6rk-f"><b class="px">${r.floor}</b> 層</span><span class="v6rk-s">${v6Sec(r.sec)}</span></button>`,
                )
                .join("")}</div>`;
    return (
      head +
      `<p class="note" style="margin:0 0 6px">無限武鬥場結束時自動上傳；每個角色只保留最佳紀錄（層數高者優先，同層比秒數）。點選任一筆可查看那場的 DPS、裝備、技能與天賦。</p>` +
      tabs +
      body +
      `<div class="row" style="margin-top:6px"><span class="note">共 ${V6RK.total} 名角色</span><span class="spacer"></span><button class="btn sm" data-v6rk-reload>重新整理</button></div>`
    );
  };
  document.addEventListener?.("click", (e) => {
    const c = e.target?.closest?.("[data-v6rk-cls]");
    if (c) {
      V6RK.cls = c.dataset.v6rkCls;
      V6RK.list = null;
      V6RK.at = 0;
      ui.render();
      return;
    }
    if (e.target?.closest?.("[data-v6rk-reload]")) {
      V6RK.at = 0;
      v6RkFetch(true);
      return;
    }
    const r = e.target?.closest?.("[data-v6rk-id]");
    if (r) v6RkDetail(r.dataset.v6rkId, +r.dataset.v6rkR || 0);
  });
  try {
    const css = document.createElement("style");
    css.textContent = `.v6rk-row{display:flex;align-items:center;gap:8px;width:100%;text-align:left;cursor:pointer}.v6rk-row.me{outline:2px solid var(--ember,#c86);}.v6rk-n{min-width:2em;text-align:right}.v6rk-f{min-width:4.5em;text-align:right}.v6rk-s{min-width:6.5em;text-align:right;color:var(--muted)}.v6rk-top{display:flex;flex-wrap:wrap;gap:6px 16px;margin:4px 0}.v6rk-eq{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:6px}.v6rk-it{border:1px solid var(--line,#ccd);border-radius:6px;padding:6px 8px;font-size:12px}.v6rk-it ul{margin:4px 0 0;padding-left:16px}.v6rk-sheet{max-width:860px;max-height:86vh;overflow:auto}.snp .snT,.v6rk-sheet .snT{color:#2a3442;background:#eef2f8;border:1px solid #9fb0c6;text-shadow:none}`;
    document.head.appendChild(css);
  } catch (e) {}
  if (HELP.tower) HELP.tower[1].push(["線上排行", "網址版中，無限武鬥場結束時會自動上傳這場紀錄；選單「線上排行」可查看所有玩家的排名與配置。"]);
}
