/* 流浪仙境 v1.1.7（內部 v12.0）：共用天賦樹擴充——新增 36 個專精與 12 個終極天賦
   參考：POE、上古卷軸5：天際、暗黑破壞神4、CrossCode、LOL 海克斯、WoW、最終幻想10
   ・每條路線 +6 專精（各 4 點）、+2 終極（各 30 點，仍最多選 2 個），從星座旁長出支線，不在必經的路上
   ・雕文：範圍內（半徑 180）每點亮 1 個指定素質點給加成（最多計 15 個）
   ・星輝轉換：範圍內的指定素質點改為給另一種素質
   ・總點數依「最遠的兩個終極天賦」重新計算（任兩個終極都點得到）
   數值與機制說明寫在每個天賦的 desc；機制實作在下方各節 */

const V120 = {
  R: 180, // 雕文、星輝轉換的範圍半徑（星圖座標）
  cap: 15, // 雕文最多計算的素質點
  total: 116, // 重新計算後的滿級總點數：最遠的兩個終極（幻影獵心＋堅毅技法）＝ 116 點
  forge: 0.3, // v1.2.3：鍛造大師改為終極天賦（+45%）；v1.2.4：精煉加成改為 +30%
  // 星輝轉換：[原素質, 改為]（0 力量 1 體質 2 敏捷 3 幸運 4 智力 5 靈巧）
  conv: { nstr2: [4, 0], nvit2: [2, 1], nagi2: [0, 2], nluk2: [5, 3], nint2: [1, 4], ndex2: [3, 5] },
  glyph: { nstr1: 0, nvit1: 1, nagi1: 2, nluk1: 3, nint1: 4, ndex1: 5 },
  glyphMods: {
    nstr1: (c) => ({ dmgp: 1.2 * c }),
    nvit1: (c) => ({ lifep: 0.8 * c, armorp: 2 * c }),
    nagi1: (c) => ({ aspd: 0.6 * c, move: 0.4 * c }),
    nluk1: (c) => ({ crit: 0.3 * c, critm: 1 * c }),
    nint1: (c) => ({ skill: 1 * c, cdr: 0.2 * c }),
    ndex1: (c) => ({ minp: 1.2 * c, skill: 0.5 * c }),
  },
  glyphTxt: {
    nstr1: (c) => `傷害 +${+(1.2 * c).toFixed(1)}%`,
    nvit1: (c) => `最大生命 +${+(0.8 * c).toFixed(1)}%、護甲 +${2 * c}%`,
    nagi1: (c) => `攻擊速度 +${+(0.6 * c).toFixed(1)}%、移動速度 +${+(0.4 * c).toFixed(1)}%`,
    nluk1: (c) => `暴擊率 +${+(0.3 * c).toFixed(1)}%、暴擊傷害 +${c}%`,
    nint1: (c) => `技能傷害 +${c}%、冷卻縮減 +${+(0.2 * c).toFixed(1)}%`,
    ndex1: (c) => `召喚物傷害 +${+(1.2 * c).toFixed(1)}%、技能傷害 +${+(0.5 * c).toFixed(1)}%`,
  },
};
const V120_ST = ["力量", "體質", "敏捷", "幸運", "智力", "靈巧"];
const v120Rng = (src, dst) => `範圍內（半徑 ${V120.R}，選取時星圖上會畫出範圍）已點亮的${V120_ST[src]}素質點改為提供${V120_ST[dst]}（數值不變）。`;
const v120Gly = (st, eff) => `範圍內（半徑 ${V120.R}，選取時星圖上會畫出範圍）每點亮 1 個${V120_ST[st]}素質點：${eff}（最多計 ${V120.cap} 個）。`;
// [id, 種類, 路線, x, y, 相連節點, 名稱, 說明, mods, 取向分類, 終極取向文字]
const V120_N = [
  // 戰意（力量）
  ["nstr1", "notable", 0, -560.7, -196.9, "t388", "戰鬥雕文", v120Gly(0, "傷害 +1.2%"), {}, "dmg"],
  ["nstr2", "notable", 0, 260.0, 397.7, "t412", "星輝轉換・力", v120Rng(4, 0), {}, "dmg"],
  ["nstr3", "notable", 0, -715.2, 634.1, "t375", "強襲", "對同一個敵人每第 8 次普通攻擊擊中時，額外造成該敵人最大生命 15% 的傷害（頭目、MVP、化身、守護者、試煉與武鬥場頭目 7.5%；不吃傷害加成）；換目標時重新計數。", { x7over: 0.15 }, "dmg"],
  ["nstr4", "notable", 0, 582.1, -165.3, "t443", "橫掃", "非範圍的主動技能擊中時，對主目標周圍的敵人造成該次傷害 25% 的濺射傷害（最多 4 個）。", { x7sweep: 0.25 }, "dmg"],
  ["nstr5", "notable", 0, 221.0, 960.9, "t367", "嗜血號令", "頭目戰開始時（含 MVP、試煉、守護者與無限武鬥場的頭目層），12 秒內攻擊速度 +30%、技能冷卻 −15%。", { x7lust: 0.3 }, "speed"],
  ["nstr6", "notable", 0, -20.9, 408.7, "t21", "震懾", "擊中使敵人「震懾」4 秒：每層使牠對你造成的傷害 −4%，最多 5 層（−20%）。", { x7awe: 0.04 }, "def"],
  // 守望（體質）
  ["nvit1", "notable", 1, 619.0, 236.6, "t558", "堅守雕文", v120Gly(1, "最大生命 +0.8%、護甲 +2%"), {}, "def"],
  ["nvit2", "notable", 1, -217.0, -816.1, "t516", "星輝轉換・體", v120Rng(2, 1), {}, "def"],
  ["nvit3", "notable", 1, 615.1, 625.8, "t417", "強固", "擊中時獲得「強固值」：最大生命的 4%（每 0.2 秒最多一次，上限為最大生命，每秒流失最大生命的 2%）。強固值高於目前生命時，受到的傷害 −15%。", { x7fort: 0.04 }, "def"],
  ["nvit4", "ultimate", 1, -143.3, 1053.3, "t325", "鍛造大師", "裝備精煉帶來的加成 +30%（武器攻擊、防具的護甲／閃避／生命，以及精煉提高的隨機屬性）。", { x7forge: 0.3 }, "def", "精煉・裝備"],
  ["nvit5", "notable", 1, 379.8, 592.8, "t316", "戰鬥踏步", "移動中每秒回復最大生命 0.6%。", { x7walk: 0.006 }, "def"],
  ["nvit6", "notable", 1, 203.7, -808.0, "t487", "第二陣風", "生命低於 40% 時，每秒回復最大生命 2%。", { x7wind: 0.02 }, "def"],
  // 疾影（敏捷）
  ["nagi1", "notable", 2, -148.4, -682.6, "t382", "疾行雕文", v120Gly(2, "攻擊速度 +0.6%、移動速度 +0.4%"), {}, "speed"],
  ["nagi2", "notable", 2, -727.9, -109.3, "t17", "星輝轉換・敏", v120Rng(0, 2), {}, "speed"],
  ["nagi3", "notable", 2, 384.2, 16.8, "t377", "戰鬥評級", "5 秒內連續擊殺提升評級：C（10 隻）→ B（25）→ A（50）→ S（100）。每升一級，經驗 +8%、物品額外掉落機率 +4%（S 級：經驗 +32%、額外掉落 +16%）。5 秒沒有擊殺時評級歸零。", { x7rank: 1 }, "speed"],
  ["nagi4", "notable", 2, -225.5, 498.7, "t229", "先制", "進入地圖、頭目戰開始、無限武鬥場每一層開始時，所有技能冷卻立即完成，3 秒內攻擊速度 +25%。", { x7first: 0.25 }, "speed"],
  ["nagi5", "notable", 2, 824.1, -518.4, "t43", "疾風印記", "擊中時標記敵人 8 秒；每有 1 個存活的被標記敵人，攻擊速度 +3%（最多 5 個，+15%）。", { x7mark: 0.03 }, "speed"],
  ["nagi6", "notable", 2, 34.0, -324.4, "t213", "雜技", "閃避 +50%，護甲 −25%。", { evap: 50, armorp: -25 }, "def"],
  // 星運（幸運）
  ["nluk1", "notable", 3, 421.3, -296.2, "t460", "機運雕文", v120Gly(3, "暴擊率 +0.3%、暴擊傷害 +1%"), {}, "crit"],
  ["nluk2", "notable", 3, -271.7, -245.5, "t222", "星輝轉換・幸", v120Rng(5, 3), {}, "crit"],
  ["nluk3", "notable", 3, 4.1, -1073.8, "t274", "易傷", "擊中時 15% 機率使敵人「易傷」4 秒：受到的所有傷害 ×1.2（含持續傷害與召喚物）。", { x7vuln: 0.15 }, "dmg"],
  ["nluk4", "notable", 3, -340.4, 897.8, "t313", "富翁", "撿取時自動分解的裝備，獲得的 Zeny +40%。", { x7rich: 0.4 }, "crit"],
  ["nluk5", "notable", 3, -351.6, 320.8, "t365", "炙熱連擊", "你的擊中連續暴擊 2 次後，下一個施放的技能必定暴擊，傷害 +30%（召喚物不計）。", { x7hot: 0.3 }, "crit"],
  ["nluk6", "notable", 3, -853.3, -571.3, "t50", "煉獄導管", "燃燒、中毒、流血每造成一次傷害，所有技能冷卻 −0.03 秒（每秒最多 −0.3 秒）。", { x7cond: 0.03 }, "poison"],
  // 奧秘（智力）
  ["nint1", "notable", 4, 719.8, -348.1, "t470", "奧術雕文", v120Gly(4, "技能傷害 +1%、冷卻縮減 +0.2%"), {}, "skill"],
  ["nint2", "notable", 4, 759.4, 87.7, "t486", "星輝轉換・智", v120Rng(1, 4), {}, "skill"],
  ["nint3", "notable", 4, -657.2, -842.5, "t281", "元素輪轉", "每 8 秒依序切換火 → 冰 → 雷：當下元素的異常效果 +40%；擊中時 10% 機率附加當下元素異常（燃燒／冰緩／感電）。", { x7cyc: 0.4 }, "elem"],
  ["nint4", "notable", 4, -939.1, 348.8, "t121", "元素終結", "感電的敵人生命低於 10% 時直接擊殺；冰緩的敵人生命低於 10% 時凍結 2 秒（每隻一次）。頭目無效。", { x7end: 0.1 }, "elem"],
  ["nint5", "notable", 4, -924.5, 11.6, "t264", "秘法充能", "施放技能時獲得 1 層秘法充能（最多 4 層，6 秒內沒有再施放則清空）：每層技能傷害 +5%。滿 4 層時，下一次施放消耗全部層數，該次技能傷害 ×1.5。", { x7arc: 0.05 }, "skill"],
  ["nint6", "notable", 4, 25.3, 1060.5, "t36", "魔力增幅器", "技能傷害額外 +30%；技能冷卻 +20%。", { more: { skill: 30 }, x7boost: 0.2 }, "skill"],
  // 契約（靈巧）
  ["ndex1", "notable", 5, -144.7, -154.2, "t468", "共生雕文", v120Gly(5, "召喚物傷害 +1.2%、技能傷害 +0.5%"), {}, "summon"],
  ["ndex2", "notable", 5, 173.2, -168.3, "t611", "星輝轉換・靈", v120Rng(3, 5), {}, "skill"],
  ["ndex3", "notable", 5, 245.1, -351.6, "t333", "惡魔契約", "場上每有 1 隻召喚物（含生命體、砲台、聖靈、植物），你的技能傷害 +2%（最多 8 隻，+16%）。", { x7pact: 0.02 }, "summon"],
  ["ndex4", "notable", 5, -474.1, -910.4, "t240", "血契", "有召喚物在場時，你受到傷害的 15% 改由召喚物承受：生命體會分擔這部分傷害，沒有生命的召喚物則直接抵銷。", { x7link: 0.15 }, "summon"],
  ["ndex5", "notable", 5, -235.7, 177.8, "t141", "不穩定召喚", "召喚物死亡或消失時爆炸，對周圍敵人造成牠最大生命 30% 的傷害（沒有生命的召喚物以你最大生命的 10% 計），套用召喚物傷害加成。", { x7unst: 0.3 }, "summon"],
  ["ndex6", "notable", 5, -981.1, -416.9, "t85", "附魔大師", "裝備上的卡片效果 +20%（卡片提供的素質點除外）。", { x7ench: 0.2 }, "skill"],
  // 終極
  ["ustr1", "ultimate", 0, 773.6, 830.9, "t136", "堅毅技法", "不會暴擊（「必定暴擊」類效果也無效）；總傷害額外 +35%。", { x7rt: 1, more: { dmg: 35 } }, "dmg", "不暴擊・直傷"],
  ["ustr2", "ultimate", 0, 1058.5, 295.8, "t187", "巨像碎擊", "每 20 秒，下一次技能擊中使目標「碎擊」6 秒：受到的所有傷害 +30%（頭目也有效）。", { x7smash: 0.3 }, "dmg", "破防・爆發"],
  ["uvit1", "ultimate", 1, -243.0, -1061.0, "t540", "鋼鐵反射", "閃避值全部轉為護甲（不再閃避），護甲 +40%；受到攻擊時，以護甲值的 20% 反擊攻擊者（套用傷害加成，不受護甲轉傷害影響）。", { x7iron: 0.4, thorn: 0.4 }, "def", "護甲・反擊"],
  ["uvit2", "ultimate", 1, 290.1, -1007.2, "t205", "神聖庇護", "受到致命傷害時保留 1 點生命，並無敵 2 秒（每 60 秒一次）。", { x7aegis: 1 }, "def", "免死・保命"],
  ["uagi1", "ultimate", 2, 682.9, -773.3, "t8", "風之舞者", "4 秒內沒有被擊中時，受到的傷害 −20%；被擊中後 4 秒內，閃避值 +60%。", { x7wd: 0.2 }, "def", "閃避・減傷"],
  ["uagi2", "ultimate", 2, 938.7, -337.7, "t189", "迅影", "每 1% 移動速度加成，技能傷害額外 +0.5%。", { x7swift: 0.5 }, "speed", "移速・技能"],
  ["uluk1", "ultimate", 3, 1018.9, 0.1, "t296", "元素超載", "暴擊後 8 秒內，總傷害額外 +40%；暴擊傷害加成無效（暴擊固定為 150%）。", { x7eo: 0.4 }, "crit", "暴擊率・爆發"],
  ["uluk2", "ultimate", 3, 838.5, 398.5, "t477", "星運之子", "幸運素質本身的效果 ×2；其他素質本身的效果 −15%（「每 1 點素質」類的轉職天賦不受影響）。", { x7luck: 1 }, "crit", "幸運・暴擊"],
  ["uint1", "ultimate", 4, -33.9, 862.4, "t525", "烈焰化身", "你的擊中一定使敵人燃燒，燃燒傷害 +40%；冰緩與感電效果 −50%。", { x7fire: 1, brn: 40, ax_chl: -0.5, ax_shk: -0.5 }, "elem", "燃燒・持續"],
  ["uint2", "ultimate", 4, -728.4, -394.0, "t521", "燃燒", "每 45 秒進入 10 秒「爆燃」：你的技能必定暴擊，技能冷卻 −30%。", { x7comb: 1 }, "crit", "週期爆發"],
  ["udex1", "ultimate", 5, -422.6, 709.0, "t569", "同生共死", "生命體的最大生命 +50%；有召喚物在場時，你受到傷害的 25% 改由召喚物承受（生命體分擔，沒有生命的召喚物直接抵銷）。", { x7share: 0.25 }, "summon", "召喚・保命"],
  ["udex2", "ultimate", 5, -674.9, 335.3, "t550", "群體意志", "召喚物擊中時使敵人疊加 1 層「群體意志」（最多 6 層，5 秒）：每層使牠受到你的所有傷害 +5%（最多 +30%）。", { x7will: 0.05 }, "summon", "召喚・增傷"],
];

// ---------------------------------------------------------------------------
// 1. 加入星圖（載入時，遊戲開始前）
// 總點數：新增後以程式計算每一對終極天賦（含路徑）所需的最少點數，取最大值（最遠的兩個）。
// 計算方式見 tests：v120Budget 以 Dijkstra 由中心出發，先取到第一個終極的最短路徑，
// 再從整條已點亮路徑出發取到第二個，兩種順序取較小值；所有組合中的最大值 = 滿級總點數。
function v120Insert() {
  if (typeof RO_TREE_NODES === "undefined" || typeof roLink !== "function") return;
  for (const [id, kind, route, x, y, anchor, name, desc, mods, cat, focus] of V120_N) {
    if (RO_TREE_NODES[id] || !RO_TREE_NODES[anchor]) continue;
    const n = { id, route, kind, name, desc, mods, cost: kind === "ultimate" ? RO_TREE_COST.ultimate : RO_TREE_COST.notable, max: 1, where: { x, y }, v120: 1 };
    if (kind === "ultimate") Object.assign(n, { focus, branch: 9, level: 60, anchor, v63: 1 });
    if (V120.glyph[id] != null) n.v120g = V120.glyph[id];
    if (V120.conv[id]) n.v120c = V120.conv[id];
    RO_TREE_NODES[id] = n;
    RO_TREE_NODE_CAT[id] = cat;
    RO_TREE_LAYOUT.nodes.push([id, kind, x, y, route, 0, 0]);
    RO_TREE_LAYOUT.edges.push([anchor, id]);
    roLink(anchor, id);
  }
  RO_TREE_TOTAL = V120.total;
  RO_TREE_C = Math.ceil(Math.max(800, ...Object.values(RO_TREE_NODES).filter((n) => n.where).map((n) => Math.max(Math.abs(n.where.x), Math.abs(n.where.y)) + 70)));
  // 依節點清單算出的快取：重新計算
  if (typeof roTreeLabelPos !== "undefined") roTreeLabelPos = null;
  if (typeof roTreeUltIds !== "undefined") roTreeUltIds = null;
  if (typeof RO_TREE_GROW_LIST === "function") RO_TREE_GROW_LIST.v = null;
}
v120Insert();

// ---------------------------------------------------------------------------
// 2. 雕文與星輝轉換：範圍內的素質點
const v120Near = (() => {
  const memo = {};
  return (id) =>
    (memo[id] ||= Object.values(RO_TREE_NODES)
      .filter((m) => m.kind === "attribute" && Math.hypot(m.where.x - RO_TREE_NODES[id].where.x, m.where.y - RO_TREE_NODES[id].where.y) <= V120.R)
      .map((m) => m.id));
})();
// 這組配置下每個素質點的實際素質（套用星輝轉換）
function v120Eff(r) {
  const eff = {};
  for (const [cid, [src, dst]] of Object.entries(V120.conv)) {
    if (!r?.[cid]) continue;
    for (const id of v120Near(cid)) if (RO_TREE_NODES[id].stat === src) eff[id] = dst;
  }
  return eff;
}
const v120StatOf = (id, eff) => (eff[id] != null ? eff[id] : RO_TREE_NODES[id]?.stat);
// 雕文：範圍內已點亮的指定素質點數（最多 15）
function v120GlyphN(gid, r, eff = v120Eff(r)) {
  const st = V120.glyph[gid];
  let c = 0;
  for (const id of v120Near(gid)) if (r[id] && v120StatOf(id, eff) === st) c++;
  return Math.min(V120.cap, c);
}
// 配置後素質（含轉換）
function v120Stats(r, cls) {
  const base = [...(roClass[cls]?.stats || [0, 0, 0, 0, 0, 0])],
    eff = v120Eff(r);
  for (const [id, v] of Object.entries(r || {})) {
    const n = RO_TREE_NODES[id];
    if (!n || !v || n.stat == null) continue;
    base[n.kind === "attribute" ? v120StatOf(id, eff) : n.stat] += n.gain * v;
  }
  return base;
}
const v120Has = (id) => !!(typeof S !== "undefined" && S?.roTree?.ranks?.[id]);

// ---------------------------------------------------------------------------
// 3. 機制
const v120Mins = () => {
  let n = (G.mins || []).length + (G.gsp || []).length + (G.turs || []).length;
  try {
    if (typeof v6G === "function") n += v6G().ents.filter((e) => e.k === "orb" || e.k === "plant").length;
  } catch (e) {}
  return n;
};
const v120Pl = (m) => !m || !m.min; // 你的擊中（不含召喚物）
const v120Sk = (s) => s && s.skill && !s.min; // 你的技能擊中
const v120Boss = () => !!((G && G.boss && alive(G.boss)) || (G && G.tw && G.tw.bs && alive(G.tw.bs)));
const v120CdAll = (x) => {
  const cds = G.pl?.cds;
  if (cds) for (const k in cds) cds[k] -= x;
};
const v120Txt = (txt, col = "#ffd84a") => {
  try {
    if (G?.pl) num(G.pl.x, G.pl.y - 34, txt, col);
  } catch (e) {}
};
const v120Elem = () => ["brn", "chl", "shk"][Math.floor((G?.t || 0) / 8) % 3];
// 每場地圖的狀態
const v120G = () => (G.v120 ||= { lastBoss: null, fort: 0, fortT: 0, rk: 0, rkT: -99, mk: 0, hc: 0, hot: 0, hotEnd: 0, arc: 0, arcT: 0, arcBurst: 0, smT: 0, eoT: 0, wdHit: -99, inv: 0, ag: 0, cdSec: 0, cdUsed: 0, prevMins: null, elem: "" });

// 強襲：對同一個敵人每第 8 次普攻擊中，額外造成該敵人最大生命 15% 的傷害（頭目類減半）；換目標重新計數
const V120_OVER = { n: 8, boss: 0.5 };
// 訓練木樁（不扣血的 1e15）以同等級假人的血量計算
const v120OverHp = (m) =>
  G.trn && m.max >= 1e14 ? monHp(S.lvl) * (MON[m.type]?.hp || 1) * (m.elite ? 3 : 1) * (m.boss ? 30 : 1) : m.max || 0;
TAL_ON.x7over = {
  basicHit: (m) => {
    const g = v120G();
    if (!m || !alive(m)) return;
    if (g.overM !== m) {
      g.overM = m;
      g.overN = 0;
    }
    if (++g.overN < V120_OVER.n) return;
    g.overN = 0;
    dealMob(m, v120OverHp(m) * tal("x7over") * (m.boss ? V120_OVER.boss : 1), false, "#ff9a4a", "x7over");
  },
};
// 橫掃
TAL_ON.x7sweep = {
  hit: (m, dmg, crit, s) => {
    if (!v120Sk(s) || s.x7sw || (s.tg || []).includes("aoe") || !(dmg > 0) || typeof mobsNear !== "function") return;
    let k = 0;
    for (const o of mobsNear(m.x, m.y, 60)) {
      if (o === m || !alive(o)) continue;
      dealMob(o, dmg * tal("x7sweep"), false, "#ffc27a", "x7sweep");
      if (++k >= 4) break;
    }
  },
};
// 嗜血號令／先制：頭目戰開始
TAL_ON.x7lust = {
  tick: () => {
    const g = v120G(),
      b = (G.boss && alive(G.boss) && G.boss) || (G.tw?.bs && alive(G.tw.bs) && G.tw.bs) || null;
    if (b && b !== g.lustBoss) {
      g.lustBoss = b;
      g.lustT = G.t + 12;
      v120Txt("嗜血號令！", "#ff7a5a");
    }
  },
  cast: (gem) => {
    if ((v120G().lustT || 0) > G.t && G.pl?.cds?.[gem?.u] > 0) G.pl.cds[gem.u] *= 1 - 0.15;
  },
};
SPD_AS.push({ k: "x7:lust", f: () => (tal("x7lust") && (G?.v120?.lustT || 0) > G.t ? 1 + tal("x7lust") : 1) });
// 震懾
TAL_ON.x7awe = {
  hit: (m) => {
    if (!m) return;
    const a = (m.x7aw ||= { n: 0, t: 0 });
    a.n = a.t > G.t ? Math.min(5, a.n + 1) : 1;
    a.t = G.t + 4;
  },
};
HURT_MUL.push({ k: "x7:awe", f: (src) => (tal("x7awe") && src?.x7aw && src.x7aw.t > G.t ? 1 - tal("x7awe") * src.x7aw.n : 1) });
// 強固
TAL_ON.x7fort = {
  hit: () => {
    const g = v120G();
    if (G.t < g.fortT) return;
    g.fortT = G.t + 0.2;
    g.fort = Math.min(PS.maxhp, g.fort + PS.maxhp * tal("x7fort"));
  },
  tick: (dt) => {
    const g = v120G();
    g.fort = Math.max(0, g.fort - PS.maxhp * 0.02 * dt);
  },
};
HURT_MUL.push({ k: "x7:fort", f: () => (tal("x7fort") && (G?.v120?.fort || 0) > S.hp ? 0.85 : 1) });
// 回復：戰鬥踏步、第二陣風
const v120Heal = (x) => {
  if (G.dead || !(S.hp > 0)) return;
  const cap = typeof hpCap === "function" ? hpCap() : PS.maxhp;
  if (S.hp < cap) S.hp = Math.min(cap, S.hp + x * (typeof slHealMul === "function" ? slHealMul() : 1));
};
TAL_ON.x7walk = { tick: (dt) => G.pl?.moving && v120Heal(PS.maxhp * tal("x7walk") * dt) };
TAL_ON.x7wind = { tick: (dt) => S.hp < PS.maxhp * 0.4 && v120Heal(PS.maxhp * tal("x7wind") * dt) };
// 戰鬥評級
const V120_RANK = [0, 10, 25, 50, 100];
const v120RankLv = () => {
  const g = G?.v120;
  if (!g || !tal("x7rank") || G.t - g.rkT > 5) return 0;
  let lv = 0;
  for (let i = 1; i < V120_RANK.length; i++) if (g.rk >= V120_RANK[i]) lv = i;
  return lv;
};
TAL_ON.x7rank = {
  kill: () => {
    const g = v120G(),
      before = v120RankLv();
    g.rk = G.t - g.rkT > 5 ? 1 : g.rk + 1;
    g.rkT = G.t;
    const lv = v120RankLv();
    if (lv > before) v120Txt(`戰鬥評級 ${"DCBAS"[lv]}`, "#9ad8ff");
  },
};
// 先制
const v120First = () => {
  if (!tal("x7first") || !G?.pl) return;
  const cds = G.pl.cds;
  if (cds) for (const k in cds) cds[k] = 0;
  v120G().firstT = G.t + 3;
  v120Txt("先制！", "#9ad8ff");
};
TAL_ON.x7first = {
  tick: () => {
    const g = v120G(),
      b = (G.boss && alive(G.boss) && G.boss) || null;
    if (b && b !== g.firstBoss) {
      g.firstBoss = b;
      v120First();
    }
    if (!g.firstMap) {
      g.firstMap = 1;
      v120First();
    }
  },
};
SPD_AS.push({ k: "x7:first", f: () => (tal("x7first") && (G?.v120?.firstT || 0) > G.t ? 1 + tal("x7first") : 1) });
// 疾風印記
TAL_ON.x7mark = {
  hit: (m) => {
    if (m) m.x7mk = G.t + 8;
  },
  tick: () => {
    const g = v120G();
    let n = 0;
    for (const m of G.mobs || []) if (m.x7mk > G.t && ++n >= 5) break;
    g.mk = n;
  },
};
SPD_AS.push({ k: "x7:mark", f: () => (tal("x7mark") ? 1 + tal("x7mark") * (G?.v120?.mk || 0) : 1) });
// 易傷、巨像碎擊、群體意志：敵人受到的傷害
TAL_ON.x7vuln = {
  hit: (m) => {
    if (m && RAND() < tal("x7vuln")) m.x7vu = G.t + 4;
  },
};
TAL_ON.x7smash = {
  hit: (m, dmg, crit, s) => {
    const g = v120G();
    if (!m || !v120Sk(s) || G.t < g.smT) return;
    g.smT = G.t + 20;
    m.x7sm = G.t + 6;
    num(m.x, m.y - (m.h || 20) - 14, "碎擊！", "#ff7a5a");
  },
};
TAL_ON.x7will = {
  hit: (m, dmg, crit, s) => {
    if (!m || !s?.min) return;
    const a = (m.x7wl ||= { n: 0, t: 0 });
    a.n = a.t > G.t ? Math.min(6, a.n + 1) : 1;
    a.t = G.t + 5;
  },
};
TAKE_MUL.push(
  { k: "x7:vuln", f: (t, m) => (tal("x7vuln") && m?.x7vu > G.t ? t * 1.2 : t) },
  { k: "x7:smash", f: (t, m) => (tal("x7smash") && m?.x7sm > G.t ? t * (1 + tal("x7smash")) : t) },
  { k: "x7:will", f: (t, m) => (tal("x7will") && m?.x7wl && m.x7wl.t > G.t ? t * (1 + tal("x7will") * m.x7wl.n) : t) },
);
// 炙熱連擊
TAL_ON.x7hot = {
  hit: (m, dmg, crit, s) => {
    if (!s || s.min) return;
    const g = v120G();
    if (g.hotEnd > G.t) return; // 強化中的擊中不計
    g.hc = crit ? g.hc + 1 : 0;
    if (g.hc >= 2) {
      g.hc = 0;
      if (!g.hot) v120Txt("炙熱連擊", "#ff9a4a");
      g.hot = 1;
    }
  },
  cast: () => {
    const g = v120G();
    if (!g.hot) return;
    g.hot = 0;
    g.hotEnd = G.t + 0.6;
  },
};
HIT_MUL.push({ k: "x7:hot", lab: () => tal("x7hot") && `炙熱連擊 ×${1 + tal("x7hot")}`, f: (t, m, s) => (tal("x7hot") && v120Sk(s) && (G?.v120?.hotEnd || 0) > G.t ? t * (1 + tal("x7hot")) : t) });
// 秘法充能
TAL_ON.x7arc = {
  cast: () => {
    const g = v120G();
    if (G.t > g.arcT) g.arc = 0;
    if (g.arc >= 4) {
      g.arc = 0;
      g.arcBurst = G.t + 0.6;
      v120Txt("秘法爆發", "#b48cff");
    } else g.arc++;
    g.arcT = G.t + 6;
  },
};
HIT_MUL.push({
  k: "x7:arc",
  lab: () => tal("x7arc") && `秘法充能每層 +${Math.round(tal("x7arc") * 100)}%`,
  f: (t, m, s) => {
    const g = G?.v120;
    if (!tal("x7arc") || !g || !v120Sk(s)) return t;
    if (g.arcBurst > G.t) return t * 1.5;
    return G.t <= g.arcT ? t * (1 + tal("x7arc") * g.arc) : t;
  },
});
// 魔力增幅器、燃燒：冷卻（施放後調整剛設定的冷卻）
TAL_ON.x7boost = {
  p: 5,
  cast: (gem) => {
    if (G.pl?.cds?.[gem?.u] > 0) G.pl.cds[gem.u] *= 1 + tal("x7boost");
  },
};
const v120Comb = () => tal("x7comb") && G && (G.t % 45) < 10;
TAL_ON.x7comb = {
  p: 6,
  cast: (gem) => {
    if (v120Comb() && G.pl?.cds?.[gem?.u] > 0) G.pl.cds[gem.u] *= 0.7;
  },
  tick: () => {
    const g = v120G(),
      on = v120Comb();
    if (on && !g.combOn) v120Txt("爆燃！", "#ff6a3a");
    g.combOn = on;
  },
};
// 惡魔契約
TAL_ON.x7pact = {
  tick: () => {
    v120G().minN = v120Mins();
  },
};
HIT_MUL.push({ k: "x7:pact", lab: () => tal("x7pact") && `每隻召喚物 +${Math.round(tal("x7pact") * 100)}%`, f: (t, m, s) => (tal("x7pact") && v120Sk(s) ? t * (1 + tal("x7pact") * Math.min(8, G?.v120?.minN || 0)) : t) });
// 元素超載
TAL_ON.x7eo = {
  hit: (m, dmg, crit) => {
    if (crit) v120G().eoT = G.t + 8;
  },
};
HIT_MUL.push({ k: "x7:eo", lab: () => tal("x7eo") && `暴擊後 ×${1 + tal("x7eo")}`, f: (t) => (tal("x7eo") && (G?.v120?.eoT || 0) > G.t ? t * (1 + tal("x7eo")) : t) });
// 易傷以外的元素：元素輪轉、元素終結、烈焰化身
TAL_ON.x7cyc = {
  hit: (m, dmg, crit, s) => {
    if (!m || !alive(m) || !s || RAND() >= 0.1) return;
    const el = v120Elem();
    ailment(m, el, dmg, PS.ail);
  },
  tick: () => {
    const g = v120G(),
      el = v120Elem();
    if (el !== g.elem) {
      g.elem = el;
      v120Txt({ brn: "火之模式", chl: "冰之模式", shk: "雷之模式" }[el], { brn: "#ff7a3a", chl: "#7ad0ff", shk: "#ffe04a" }[el]);
    }
  },
};
TAL_ON.x7fire = {
  hit: (m, dmg, crit, s) => {
    if (!m || !alive(m) || !s || (m.x7fi || 0) > G.t) return;
    m.x7fi = G.t + 0.25;
    ailment(m, "brn", dmg, PS.ail);
  },
};
const v120End = (m) => {
  if (!m || !alive(m) || m.boss || !(m.max > 0) || m.hp >= m.max * tal("x7end")) return;
  if (m.shk > 0) {
    m.hp = 0;
    num(m.x, m.y - (m.h || 20) - 14, "解離", "#ffe04a");
    killMob(m);
  } else if (m.slow > 0 && !m.x7fz) {
    m.x7fz = 1;
    m.frz = Math.max(m.frz || 0, 2);
    num(m.x, m.y - (m.h || 20) - 14, "凍結", "#7ad0ff");
  }
};
TAL_ON.x7end = { hit: (m) => v120End(m), dealt: (m) => v120End(m) };
// 煉獄導管（持續傷害）、神聖庇護、風之舞者、血契、同生共死、不穩定召喚：見下方包裝
TAL_ON.x7cond = { tick: () => {} };
TAL_ON.x7aegis = {
  p: -5,
  lethal: () => {
    const g = v120G();
    if (G.t < g.ag) return;
    g.ag = G.t + 60;
    g.inv = G.t + 2;
    S.hp = Math.max(1, S.hp);
    v120Txt("神聖庇護！", "#fff0a0");
    return true;
  },
  hurtPre: () => (G?.v120?.inv || 0) > G.t,
};
TAL_ON.x7wd = { hurt: (raw, fin) => fin > 0 && (v120G().wdHit = G.t) };
HURT_MUL.push({ k: "x7:wd", f: () => (tal("x7wd") && G.t - (G?.v120?.wdHit ?? -99) >= 4 ? 1 - tal("x7wd") : 1) });
TAL_ON.x7link = { tick: () => (v120G().minN = v120Mins()) };
TAL_ON.x7share = { tick: () => (v120G().minN = v120Mins()) };
TAL_ON.x7unst = {
  tick: () => {
    const g = v120G(),
      now = new Set([...(G.mins || []), ...(G.gsp || []), ...(G.turs || [])]);
    try {
      if (typeof v6G === "function") for (const e of v6G().ents) if (e.k === "orb" || e.k === "plant") now.add(e);
    } catch (e) {}
    if (g.prevMins && !G.dead)
      for (const o of g.prevMins)
        if (!now.has(o) && o.x != null) {
          const dmg = (o.max > 0 ? o.max : PS.maxhp / 3) * tal("x7unst") * PS.minMul;
          try {
            roPushFx(G.fx, { k: "ring", x: o.x, y: o.y, r: 70, t: 0, life: 0.3, col: "#c48cff" });
          } catch (e) {}
          for (const m of mobsNear(o.x, o.y, 70)) dealMob(m, dmg, false, "#c48cff", "x7unst");
        }
    g.prevMins = now;
  },
};
// 其他只需要旗標的天賦（效果在包裝函式裡）
for (const k of ["x7forge", "x7rich", "x7ench", "x7rt", "x7iron", "x7swift", "x7luck"]) TAL_ON[k] ||= { tick: () => {} };

// 天賦文字（模擬器、說明用）
if (typeof V5_TAL_TXT !== "undefined")
  Object.assign(V5_TAL_TXT, {
    x7over: (v) => `對同一個敵人每第 ${V120_OVER.n} 次普攻擊中，額外造成該敵人最大生命 ${+(v * 100).toFixed(1)}% 的傷害（頭目類 ${+(v * 100 * V120_OVER.boss).toFixed(1)}%；換目標重新計數）`,
    x7sweep: (v) => `非範圍技能擊中時，對周圍敵人造成 ${Math.round(v * 100)}% 濺射傷害`,
    x7lust: (v) => `頭目戰開始 12 秒內攻擊速度 +${Math.round(v * 100)}%、技能冷卻 −15%`,
    x7awe: (v) => `擊中使敵人對你造成的傷害每層 −${Math.round(v * 100)}%（最多 5 層）`,
    x7fort: (v) => `擊中獲得最大生命 ${Math.round(v * 100)}% 的強固值；強固值高於生命時受到的傷害 −15%`,
    x7forge: (v) => `裝備精煉帶來的加成 +${Math.round(v * 100)}%`,
    x7walk: (v) => `移動中每秒回復最大生命 ${+(v * 100).toFixed(2)}%`,
    x7wind: (v) => `生命低於 40% 時，每秒回復最大生命 ${Math.round(v * 100)}%`,
    x7rank: () => "連續擊殺提升戰鬥評級：經驗與掉落增加",
    x7first: (v) => `進入地圖或頭目戰時冷卻立即完成，3 秒內攻擊速度 +${Math.round(v * 100)}%`,
    x7mark: (v) => `每個被標記的敵人使攻擊速度 +${Math.round(v * 100)}%（最多 5 個）`,
    x7vuln: (v) => `擊中時 ${Math.round(v * 100)}% 機率使敵人易傷（受到傷害 ×1.2）`,
    x7rich: (v) => `自動分解獲得的 Zeny +${Math.round(v * 100)}%`,
    x7hot: (v) => `連續暴擊 2 次後，下一個技能必定暴擊、傷害 +${Math.round(v * 100)}%`,
    x7cond: (v) => `持續傷害每跳使所有技能冷卻 −${v} 秒（每秒最多 −0.3 秒）`,
    x7cyc: (v) => `火冰雷輪替，當下元素異常效果 +${Math.round(v * 100)}%`,
    x7end: (v) => `感電／冰緩的敵人生命低於 ${Math.round(v * 100)}% 時擊殺／凍結`,
    x7arc: (v) => `秘法充能每層技能傷害 +${Math.round(v * 100)}%，滿 4 層時下一次 ×1.5`,
    x7boost: (v) => `技能冷卻 +${Math.round(v * 100)}%`,
    x7pact: (v) => `每隻召喚物使技能傷害 +${Math.round(v * 100)}%（最多 8 隻）`,
    x7link: (v) => `你受到傷害的 ${Math.round(v * 100)}% 由召喚物承受`,
    x7unst: (v) => `召喚物消失時爆炸（最大生命 ${Math.round(v * 100)}%）`,
    x7ench: (v) => `卡片效果 +${Math.round(v * 100)}%`,
    x7rt: () => "不會暴擊",
    x7smash: (v) => `每 20 秒使目標受到的傷害 +${Math.round(v * 100)}%（6 秒）`,
    x7iron: (v) => `閃避值轉為護甲，護甲 +${Math.round(v * 100)}%`,
    x7aegis: () => "受到致命傷害時保留 1 點生命並無敵 2 秒（每 60 秒）",
    x7wd: (v) => `4 秒內沒被擊中時受到的傷害 −${Math.round(v * 100)}%，被擊中後閃避值 +60%`,
    x7swift: (v) => `每 1% 移動速度加成，技能傷害額外 +${v}%`,
    x7eo: (v) => `暴擊後 8 秒內總傷害額外 +${Math.round(v * 100)}%；暴擊傷害加成無效`,
    x7luck: () => "幸運素質效果 ×2，其他素質效果 −15%",
    x7fire: () => "擊中一定使敵人燃燒",
    x7comb: () => "每 45 秒爆燃 10 秒：技能必定暴擊、冷卻 −30%",
    x7share: (v) => `你受到傷害的 ${Math.round(v * 100)}% 由召喚物承受；生命體最大生命 +50%`,
    x7will: (v) => `召喚物擊中使敵人受到你的傷害每層 +${Math.round(v * 100)}%（最多 6 層）`,
  });

// ---------------------------------------------------------------------------
// 4. 包裝函式（roV4Install 之後，最外層）
function v120Install() {
  // 4-1 素質：星輝轉換
  if (typeof roTreeEnsure === "function") {
    const te = roTreeEnsure;
    roTreeEnsure = function (...a) {
      const r = te.apply(this, a);
      try {
        if (S?.roTree?.ranks && Object.keys(V120.conv).some((id) => S.roTree.ranks[id])) {
          if (V120.convFor !== S.roTree.ranks || V120.convS !== S || V120.convCls !== S.cls) {
            S.roStats = v120Stats(S.roTree.ranks, S.cls);
            V120.convFor = S.roTree.ranks;
            V120.convS = S;
            V120.convCls = S.cls;
          }
        } else V120.convFor = null;
      } catch (e) {}
      return r;
    };
  }
  // 4-2 能力：雕文、附魔大師、鍛造大師（防具）、星運之子
  const cm = collectMods;
  collectMods = function (...a) {
    const out = cm.apply(this, a);
    if (!S || !S.roTree?.ranks) return out;
    const r = S.roTree.ranks;
    try {
      const eff = v120Eff(r);
      for (const gid of Object.keys(V120.glyph)) {
        if (!r[gid]) continue;
        const c = v120GlyphN(gid, r, eff);
        if (c) for (const [k, v] of Object.entries(V120.glyphMods[gid](c))) out.push({ s: k, v, src: "共用天賦・" + RO_TREE_NODES[gid].name });
      }
      if (r.ndex6) for (const m of out) if (typeof m.src === "string" && m.src.startsWith("card:") && !/^r(str|vit|agi|luk|int|dex)$/.test(m.s)) m.v *= 1.2;
      if (r.nvit4 && typeof v5RefMul === "function") {
        const h2 = S.equip.weapon?.h2 && canWear(S.equip.weapon);
        for (const sl of SLOTS) {
          const it = S.equip[sl];
          if (!it || !it.v5 || sl === "weapon" || !canWear(it) || it.sl || (sl === "shield" && h2)) continue;
          const rm = v5RefMul(it) - 1 + (typeof v79Over === "function" && typeof V79_REF !== "undefined" ? V79_REF.mul[10] * (v79Over(it) - 1) : 0);
          if (rm > 0) {
            if (it.arm) out.push({ s: "armor", v: it.arm * rm * V120.forge, src: "共用天賦・鍛造大師" });
            if (it.eva) out.push({ s: "eva", v: it.eva * rm * V120.forge, src: "共用天賦・鍛造大師" });
            if (it.hp) out.push({ s: "life", v: it.hp * rm * V120.forge, src: "共用天賦・鍛造大師" });
          }
          const xm = typeof v5RefX === "function" ? v5RefX(it) - 1 : 0;
          if (xm > 0) for (const b of it.bx || []) out.push({ s: b.k, v: b.v * xm * V120.forge, src: "共用天賦・鍛造大師" });
        }
      }
      if (r.uluk2 && typeof V79_STAT !== "undefined" && typeof v79StatTotals === "function") {
        for (let i = out.length - 1; i >= 0; i--) if (out[i].src === "RO 素質") out.splice(i, 1);
        v79StatTotals().forEach((v, i) => {
          if (!v) return;
          const f = i === 3 ? 2 : 0.85;
          for (const [s, rr, x] of V79_STAT[i]) out.push(x ? { s, v: v * rr * f, src: "RO 素質", x: "more" } : { s, v: v * rr * f, src: "RO 素質" });
        });
      }
    } catch (e) {}
    return out;
  };
  // 4-3 鍛造大師（武器攻擊）
  if (typeof weaponLocal === "function") {
    const wl = weaponLocal;
    weaponLocal = function (t, ...a) {
      const r = wl.call(this, t, ...a);
      try {
        if (r && t && t.v5 && v120Has("nvit4") && typeof v5RefMul === "function") {
          const m = v5RefMul(t) * (typeof v79Over === "function" ? v79Over(t) : 1);
          if (m > 1) {
            const k = (1 + (m - 1) * (1 + V120.forge)) / m;
            r.mn = Math.round(r.mn * k);
            r.mx = Math.round(r.mx * k);
          }
        }
      } catch (e) {}
      return r;
    };
  }
  // 4-4 計算後的屬性：堅毅技法、元素超載、鋼鐵反射、迅影
  if (typeof calc === "function") {
    const c0 = calc;
    calc = function (...a) {
      const R = c0.apply(this, a);
      try {
        const T = R.T || {},
          L = (cr, cm) => 1 + (Math.min(100, Math.max(0, cr)) / 100) * (cm / 100 - 1);
        if (T.x7rt) {
          const l0 = L(R.crit, R.critm);
          R.crit = 0;
          R.critRaw = 0;
          T.fullCrit = 0;
          if (R.dps) R.dps /= l0;
        }
        if (T.x7eo) {
          const l0 = L(R.crit, R.critm);
          R.critm = 150;
          if (R.dps) R.dps *= L(R.crit, 150) / l0;
        }
        if (T.x7iron) {
          R.armor = Math.round((R.armor + R.eva) * (1 + T.x7iron));
          R.eva = 0;
          R.dodge = 0;
          R.dodgeRaw = 0;
          R.armRed = typeof v68ArmPct === "function" ? v68ArmPct(R.armor, (PS && PS.v68lv) || S.lvl) : Math.min(75, R.armor / 20);
        }
        if (T.x7swift && R.st && R.st.move > 0) R.skillMul *= 1 + (T.x7swift * R.st.move) / 100;
      } catch (e) {}
      return R;
    };
  }
  // 4-5 擊中：堅毅技法、炙熱連擊、燃燒（必定暴擊）
  const hm = hitMob;
  hitMob = function (m, mult, o = {}, ...x) {
    if (typeof PS !== "undefined" && PS?.T) {
      if (PS.T.x7rt) {
        o.crit = -1e9;
        const ac = G.pl?.acrit;
        if (ac > 0) G.pl.acrit = 0;
        try {
          return hm.call(this, m, mult, o, ...x);
        } finally {
          if (ac > 0) G.pl.acrit = ac;
        }
      }
      if (v120Sk(o) && (((PS.T.x7hot && (G?.v120?.hotEnd || 0) > G.t)) || v120Comb())) o.crit = (o.crit || 0) + 1e4;
    }
    return hm.call(this, m, mult, o, ...x);
  };
  // 4-6 受到傷害：風之舞者（被擊中後閃避）、血契、同生共死
  const dp = damagePlayer;
  damagePlayer = function (d, xx, yy, src, kind) {
    if (typeof PS === "undefined" || !PS?.T || !(d > 0)) return dp.call(this, d, xx, yy, src, kind);
    const share = (PS.T.x7link || 0) + (PS.T.x7share || 0);
    if (share > 0 && v120Mins() > 0) {
      const part = d * Math.min(0.6, share);
      d -= part;
      const gs = (G.gsp || []).filter((g) => g.hp > 0);
      if (gs.length && G.pl) {
        gs.sort((a, b) => Math.hypot(a.x - G.pl.x, a.y - G.pl.y) - Math.hypot(b.x - G.pl.x, b.y - G.pl.y));
        try {
          gspHurt(gs[0], part, src);
        } catch (e) {}
      }
    }
    if (PS.T.x7wd && G.t - (G?.v120?.wdHit ?? -99) < 4) {
      const k = [PS.dodge, PS.dodgeRaw];
      PS.dodge = Math.min(75, PS.dodge * 1.6);
      PS.dodgeRaw *= 1.6;
      try {
        return dp.call(this, d, xx, yy, src, kind);
      } finally {
        [PS.dodge, PS.dodgeRaw] = k;
      }
    }
    return dp.call(this, d, xx, yy, src, kind);
  };
  // 4-7 生命體生命 +50%（同生共死）
  if (typeof tickGsp === "function") {
    const tg = tickGsp;
    tickGsp = function (...a) {
      const r = tg.apply(this, a);
      if (tal("x7share")) for (const e of G.gsp || []) (e.hp *= 1.5), (e.max *= 1.5);
      return r;
    };
  }
  // 4-8 持續傷害：煉獄導管
  if (typeof dotHit === "function") {
    const dh = dotHit;
    dotHit = function (...a) {
      const r = dh.apply(this, a);
      if (tal("x7cond") && G?.pl?.cds) {
        const g = v120G(),
          sec = Math.floor(G.t);
        if (g.cdSec !== sec) (g.cdSec = sec), (g.cdUsed = 0);
        const x = Math.min(tal("x7cond"), 0.3 - g.cdUsed);
        if (x > 0) {
          g.cdUsed += x;
          v120CdAll(x);
        }
      }
      return r;
    };
  }
  // 4-9 元素輪轉：當下元素的異常效果 +40%
  if (typeof ailment === "function") {
    const ai = ailment;
    ailment = function (t, a, s, e, ...x) {
      if (tal("x7cyc") && a === v120Elem() && typeof e === "number") e *= 1 + tal("x7cyc");
      return ai.call(this, t, a, s, e, ...x);
    };
  }
  // 4-10 戰鬥評級：經驗與掉落；富翁：Zeny
  if (typeof gainXp === "function") {
    const gx = gainXp;
    gainXp = function (t, ...a) {
      const lv = v120RankLv();
      return gx.call(this, lv ? t * (1 + 0.08 * lv) : t, ...a);
    };
  }
  if (typeof rollItem === "function") {
    const ri0 = rollItem;
    rollItem = function (...a) {
      const lv = v120RankLv();
      if (!lv || !PS?.T) return ri0.apply(this, a);
      const keep = PS.T.dropX;
      PS.T.dropX = (keep || 0) + 0.04 * lv;
      try {
        return ri0.apply(this, a);
      } finally {
        PS.T.dropX = keep;
      }
    };
  }
  if (typeof takeItem === "function") {
    const tk = takeItem;
    takeItem = function (it, ...a) {
      const r = tk.call(this, it, ...a);
      try {
        if ((r === "salv" || r === "full") && tal("x7rich")) {
          const z = Math.round(salvageValue(it) * tal("x7rich"));
          S.ash += z;
          ses().ash += z;
        }
      } catch (e) {}
      return r;
    };
  }
  // 4-11 先制：無限武鬥場每一層
  if (typeof twFloor === "function") {
    const tf = twFloor;
    twFloor = function (...a) {
      const r = tf.apply(this, a);
      try {
        v120First();
      } catch (e) {}
      return r;
    };
  }
  // 4-12 星圖：範圍圓圈、配置後素質（含轉換）、雕文目前的效果
  if (typeof roTreeSvg === "function") {
    const sv = roTreeSvg;
    roTreeSvg = function (...a) {
      const h = sv.apply(this, a);
      const n = RO_TREE_NODES[roTreeSelected];
      if (typeof h !== "string" || !n || (n.v120g == null && !n.v120c)) return h;
      const p = roTreePoint(n),
        col = n.v120c ? RO_STAT_COLORS[n.v120c[1]] : RO_STAT_COLORS[n.v120g];
      return h.replace('<g class="tree-links">', `<g class="v120rad"><circle cx="${p.x}" cy="${p.y}" r="${V120.R}" fill="${col}" fill-opacity=".08" stroke="${col}" stroke-width="2" stroke-dasharray="8 6"/></g><g class="tree-links">`);
    };
  }
  if (typeof roTreeRender === "function") {
    const rr = roTreeRender;
    roTreeRender = function (...a) {
      const out = rr.apply(this, a);
      try {
        const sh = document.querySelector("#sheet.ro-tree-sheet"),
          r = typeof roTreeDraft !== "undefined" && roTreeDraft ? roTreeDraft : S?.roTree?.ranks;
        if (sh && r) {
          const cls = (typeof V117 !== "undefined" && V117.view?.cls) || S.cls,
            tot = v120Stats(r, cls),
            bs = sh.querySelectorAll(".tree-detail .tree-stats b");
          if (bs.length === 6) bs.forEach((b, i) => (b.textContent = tot[i]));
          const n = RO_TREE_NODES[roTreeSelected],
            desc = sh.querySelector(".tree-detail > p");
          if (n && desc && (n.v120g != null || n.v120c)) {
            let txt = "";
            if (n.v120g != null) {
              const c = v120GlyphN(n.id, r);
              txt = `目前範圍內已點亮的${V120_ST[n.v120g]}素質點：${c} 個${c >= V120.cap ? "（已達上限）" : ""} → ${V120.glyphTxt[n.id](c)}`;
            } else {
              const [src, dst] = n.v120c,
                c = v120Near(n.id).filter((id) => r[id] && RO_TREE_NODES[id].stat === src).length,
                all = v120Near(n.id).filter((id) => RO_TREE_NODES[id].stat === src).length;
              txt = `範圍內共有 ${all} 個${V120_ST[src]}素質點，目前已點亮 ${c} 個 → ${V120_ST[dst]} +${c * 2}`;
            }
            desc.insertAdjacentHTML("afterend", `<p class="note v120note">${txt}</p>`);
          }
        }
      } catch (e) {}
      return out;
    };
  }
  // 4-13 天賦模擬器：雕文的加成也算進總表
  if (typeof v105SimMods === "function") {
    const sm = v105SimMods;
    v105SimMods = function (r, ...a) {
      const e = sm.call(this, r, ...a);
      try {
        const eff = v120Eff(r || {});
        for (const gid of Object.keys(V120.glyph)) {
          if (!r?.[gid]) continue;
          const c = v120GlyphN(gid, r, eff);
          for (const [k, v] of Object.entries(V120.glyphMods[gid](c))) e[k] = (e[k] || 0) + v;
        }
      } catch (x) {}
      return e;
    };
  }
  if (!document.getElementById("v120css")) {
    const st = document.createElement("style");
    st.id = "v120css";
    st.textContent = `.v120rad{pointer-events:none}.tree-detail .v120note{margin:2px 0 6px;color:#3d6a9a}`;
    document.head.appendChild(st);
  }
  // 說明
  if (HELP.tower && Array.isArray(HELP.tower[1]))
    HELP.tower[1].push([
      "天賦樹擴充",
      `v1.1.7 起共用天賦樹新增 36 個專精與 12 個終極天賦（終極共 ${Object.values(RO_TREE_NODES).filter((n) => n.kind === "ultimate").length} 個，仍最多選 2 個）。「雕文」依範圍內點亮的素質點給加成；「星輝轉換」把範圍內的素質點改為另一種素質。滿級總點數 ${RO_TREE_TOTAL} 點，剛好夠最遠的兩個終極天賦。`,
    ]);
}
if (typeof roV4Install === "function") {
  const r4v120 = roV4Install;
  roV4Install = function () {
    r4v120();
    v120Install();
  };
}
