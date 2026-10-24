/* Shared character progression, contextual gear suggestions and the Wild Echo season. */
"use strict";
// v1.1.7：總點數改為 let，新增天賦後由 ro-v120.js 依「最遠兩個終極天賦」重新設定
let RO_TREE_TOTAL = 115;
const RO_TREE_LEVELS = 126;
const RO_TREE_ROUTES = [
  {
    key: "str",
    name: "戰意",
    color: "#c17b66",
    stat: 0,
    icon: 5,
    paths: [
      [
        "重擊修習",
        "傷害 +4%／級",
        { dmgp: 4 },
        "碎甲之勢",
        "傷害 +12%，暴擊傷害 +15%",
        { dmgp: 12, critm: 15 },
      ],
      [
        "裂傷修習",
        "流血傷害 +10%／級",
        { bld: 10 },
        "血戰續行",
        "流血傷害 +25%，擊殺回復 +12",
        { bld: 25, lok: 12 },
      ],
    ],
    join: ["戰場直覺", "力量 +6，技能範圍 +8%", { area: 8 }],
    ultimate: [
      "破軍誓約",
      "總傷害額外提高 18%，但暴擊率降低 8 個百分點。",
      { crit: -8, more: { dmg: 18 } },
    ],
  },
  {
    key: "vit",
    name: "守望",
    color: "#6a9e85",
    stat: 1,
    icon: 28,
    paths: [
      [
        "鎧甲修習",
        "護甲 +8%／級",
        { armorp: 8 },
        "鋼鐵之膚",
        "護甲 +25%，生命 +6%",
        { armorp: 25, lifep: 6 },
      ],
      [
        "復甦修習",
        "生命 +3%／級",
        { lifep: 3 },
        "泉源之心",
        "每秒額外回復最大生命的 0.4%，藥水效果 +15%",
        { regenPct: 0.004, pot: 15 },
      ],
    ],
    join: ["穩固根基", "體質 +6，生命 +5%", { lifep: 5 }],
    ultimate: [
      "不屈壁壘",
      "最大生命額外提高 25%，護甲 +30%；移動速度 −10%，攻速 −8%。",
      { armorp: 30, move: -10, aspd: -8, more: { life: 25 } },
    ],
  },
  {
    key: "agi",
    name: "疾影",
    color: "#7a9db3",
    stat: 2,
    icon: 29,
    paths: [
      [
        "連擊修習",
        "攻速 +3%／級",
        { aspd: 3 },
        "迅捷節拍",
        "攻速 +10%，冷卻縮減 +3%",
        { aspd: 10, cdr: 3 },
      ],
      [
        "步法修習",
        "閃避 +10%／級",
        { evap: 10 },
        "風之足跡",
        "閃避 +80，移動速度 +8%",
        { eva: 80, move: 8 },
      ],
    ],
    join: ["輕盈身法", "敏捷 +6，閃避 +8%", { evap: 8 }],
    ultimate: [
      "疾影連舞",
      "攻速 +25%，冷卻縮減 +10%；最大生命降低 12%。",
      { aspd: 25, cdr: 10, lifep: -12 },
    ],
  },
  {
    key: "luk",
    name: "星運",
    color: "#b49861",
    stat: 3,
    icon: 75,
    paths: [
      [
        "致命修習",
        "暴擊率 +1.5%／級",
        { crit: 1.5 },
        "鷹眼之星",
        "暴擊率 +4%，暴擊傷害 +20%",
        { crit: 4, critm: 20 },
      ],
      [
        "毒理修習",
        "中毒傷害 +10%／級",
        { psn: 10 },
        "蝕骨毒理",
        "中毒上限 +1 層，中毒傷害 +20%",
        { psnMax: 1, psn: 20 },
      ],
    ],
    join: ["命運伏線", "幸運 +6，暴擊傷害 +10%", { critm: 10 }],
    ultimate: [
      "命運豪賭",
      "暴擊率 +10%，暴擊傷害 +60%；一般傷害加成降低 15%。",
      { crit: 10, critm: 60, dmgp: -15 },
    ],
  },
  {
    key: "int",
    name: "奧秘",
    color: "#9d83b9",
    stat: 4,
    icon: 20,
    paths: [
      [
        "法術修習",
        "技能傷害 +5%／級",
        { skill: 5 },
        "符文共鳴",
        "技能傷害 +15%，冷卻縮減 +4%",
        { skill: 15, cdr: 4 },
      ],
      [
        "元素修習",
        "燃燒傷害 +10%／級",
        { brn: 10 },
        "元素延展",
        "元素異常效果 +20%，技能範圍 +12%",
        { ail: 0.2, area: 12 },
      ],
    ],
    join: ["魔力編織", "智力 +6，技能傷害 +8%", { skill: 8 }],
    ultimate: [
      "奧術洪流",
      "技能傷害額外提高 25%，冷卻縮減 +8%；攻速 −18%，生命 −8%。",
      { cdr: 8, aspd: -18, lifep: -8, more: { skill: 25 } },
    ],
  },
  {
    key: "dex",
    name: "契約",
    color: "#8eaa74",
    stat: 5,
    icon: 385,
    paths: [
      [
        "精準修習",
        "技能傷害 +3%／級",
        { skill: 3 },
        "精密調律",
        "冷卻縮減 +6%，暴擊率 +3%",
        { cdr: 6, crit: 3 },
      ],
      [
        "使魔修習",
        "召喚傷害 +8%／級",
        { minp: 8 },
        "共生契印",
        "召喚傷害 +20%，召喚攻速 +15%",
        { minp: 20, minAs: 0.15 },
      ],
    ],
    join: ["靈巧連結", "靈巧 +6，技能範圍 +8%", { area: 8 }],
    ultimate: [
      "契約統御",
      "召喚數量 +1，召喚傷害 +35%，召喚攻速 +20%；自身攻速 −15%，技能傷害 −10%。",
      { minion: 1, minp: 35, minAs: 0.2, aspd: -15, skill: -10 },
    ],
  },
];
// Keep the original `u` IDs so existing characters retain their choices.
// New terminal nodes use the same combat modifiers as equipment and ascensions.
const RO_TREE_ULTIMATE_BRANCHES = {
  str: [
    [
      "血刃祭儀",
      "流血傷害 +90%；擊中時回復該次傷害的 1.5%。暴擊率 −10 個百分點。需搭配能造成流血的技能。",
      { bld: 90, leech: 0.015, crit: -10 },
      "bn",
      "流血・吸血",
    ],
    [
      "斬首獵令",
      "對菁英與 Boss 的擊中傷害倍率 +25%；對生命低於 20% 的敵人，擊中傷害倍率 +25%。技能範圍 −25%。",
      { boss: 0.25, exec: 0.25, area: -25 },
      "an",
      "獵王・處刑",
    ],
    [
      "巨人之握",
      "範圍技能傷害倍率 +30%，技能範圍 +20%；投射物技能傷害倍率 −30%。",
      { "tg:aoe:dmg": 0.3, area: 20, "tg:proj:dmg": -0.3 },
      "",
      "範圍・巨力",
    ],
    [
      "狂戰之血",
      "總傷害額外提高 25%；最大生命 −20%。",
      { lifep: -20, more: { dmg: 25 } },
      "",
      "捨身・直傷",
    ],
    [
      "破城重擊",
      "冷卻 4 秒以上的技能傷害倍率 +40%，暴擊傷害 +30%；冷卻 3 秒以下的技能傷害倍率 −25%。",
      { "tg:cdlong:dmg": 0.4, critm: 30, "tg:cdshort:dmg": -0.25 },
      "",
      "重擊・長冷卻",
    ],
  ],
  vit: [
    [
      "荊棘王座",
      "被敵人攻擊時，以護甲值的 60% 為基礎反擊攻擊者；反擊仍受傷害加成影響。護甲 +25%，攻速 −15%。",
      { thorn: 0.6, armorp: 25, aspd: -15 },
      "an",
      "護甲・反傷",
    ],
    [
      "聖泉誓守",
      "每秒額外回復最大生命的 1.5%，藥水效果 +30%；一般傷害加成 −18%。無法自然回復的效果仍會阻止生命回復。",
      { regenPct: 0.015, pot: 30, dmgp: -18 },
      "bn",
      "再生・藥水",
    ],
    [
      "巨像之軀",
      "最大生命額外提高 30%；移動速度 −20%。",
      { move: -20, more: { life: 30 } },
      "",
      "生命・巨像",
    ],
    [
      "不朽誓言",
      "每秒回復最大生命 1%，擊殺回復 +40；冷卻縮減 −10 個百分點。",
      { regenPct: 0.01, lok: 40, cdr: -10 },
      "",
      "回復・續戰",
    ],
    [
      "鐵壁堡壘",
      "護甲 +80%，最大生命 +20%；攻擊速度 −10%。",
      { armorp: 80, lifep: 20, aspd: -10 },
      "",
      "護甲・堅守",
    ],
  ],
  agi: [
    [
      "幻影獵心",
      "暴擊率改由閃避率決定，包含超過閃避上限的部分；其他直接暴擊率來源不再計入。閃避值額外提高 40%，護甲加成 −25%。",
      { critEva: 1, armorp: -25, more: { eva: 40 } },
      "bn",
      "閃避・暴擊轉換",
    ],
    [
      "疾風傳承",
      "自身攻速加成的 100% 同時加入召喚物攻速，召喚物亦套用行動速度倍率。召喚攻擊與移動速度 +15%；自身技能傷害加成 −20%。需搭配召喚技能。",
      { asToMin: 1, minAs: 0.15, skill: -20 },
      "an",
      "攻速・召喚轉換",
    ],
    [
      "疾風連射",
      "投射物技能的投射物 +2，投射物技能冷卻 −20%；非投射物技能傷害倍率 −30%。",
      { "tg:proj:proj": 2, "tg:proj:cd": 0.2, "tg:nonproj:dmg": -0.3 },
      "",
      "投射・連射",
    ],
    [
      "瞬身",
      "冷卻 3 秒以下的技能冷卻 −30%，移動速度 +15%；冷卻 4 秒以上的技能傷害倍率 −25%。",
      { "tg:cdshort:cd": 0.3, move: 15, "tg:cdlong:dmg": -0.25 },
      "",
      "短冷卻・機動",
    ],
    [
      "千刃亂舞",
      "非召喚技能額外施放 +1 次；這些技能傷害倍率 −10%。",
      { "tg:nonminion:extra": 1, "tg:nonminion:dmg": -0.1 },
      "",
      "多段・連擊",
    ],
  ],
  luk: [
    [
      "萬毒之源",
      "普攻與技能擊中時（含召喚命中），有 35% 機率施加中毒；中毒上限 +2 層、中毒傷害 +50%。暴擊傷害 −40%。",
      { psnHit: 0.35, psnMax: 2, psn: 50, critm: -40 },
      "bn",
      "擊中施毒・疊層",
    ],
    [
      "瘟疫蔓生",
      "中毒敵人死亡時，以剩餘毒傷的 50% 引發範圍毒爆，並傳播中毒。中毒傷害跳動頻率 +25%；一般傷害加成 −15%。需先有中毒來源。",
      { psnSpread: 0.5, psnRate: 0.25, dmgp: -15 },
      "bn",
      "毒爆・擴散",
    ],
    [
      "致命一擊",
      "暴擊傷害 +80%；最大生命 −15%。",
      { critm: 80, lifep: -15 },
      "",
      "暴擊傷害",
    ],
    [
      "幸運之星",
      "暴擊率 +15 個百分點；暴擊傷害 −30%。",
      { crit: 15, critm: -30 },
      "",
      "暴擊率",
    ],
    [
      "劇毒之雨",
      "中毒技能額外施放 +1、範圍 +25%；暴擊率 −10 個百分點。",
      { "tg:psn:extra": 1, "tg:psn:area": 0.25, crit: -10 },
      "",
      "中毒・範圍",
    ],
  ],
  int: [
    [
      "焚世餘燼",
      "燃燒敵人死亡時引發 80% 武器基礎傷害的範圍爆炸，套用技能傷害加成。燃燒傷害 +65%，生命加成 −12%。需搭配燃燒技能。",
      { ember: 0.8, brn: 65, lifep: -12 },
      "bn",
      "燃燒・連環爆炸",
    ],
    [
      "永冬雷域",
      "冰緩敵人受到的傷害倍率 +20%，感電效果 +40%；燃燒傷害加成 −35%。需搭配冰緩或感電技能。",
      { chlVul: 0.2, ax_shk: 0.4, brn: -35 },
      "bn",
      "冰緩・感電",
    ],
    [
      "元素過載",
      "元素技能傷害倍率 +40%；最大生命 −15%。",
      { "tg:elem:dmg": 0.4, lifep: -15 },
      "",
      "元素・爆發",
    ],
    [
      "禁咒詠唱",
      "法術技能暴擊率 +20%、暴擊傷害 +40%；冷卻縮減 −10 個百分點。",
      { "tg:spell:crit": 20, "tg:spell:critm": 40, cdr: -10 },
      "",
      "法術・暴擊",
    ],
    [
      "雷霆連鎖",
      "連鎖技能的連鎖次數 +3，感電效果 +30%；技能範圍 −20%。",
      { "tg:chn:chn": 3, ax_shk: 0.3, area: -20 },
      "",
      "連鎖・感電",
    ],
  ],
  dex: [
    [
      "精靈同調",
      "召喚物套用自身暴擊率與暴擊傷害，附帶的元素異常效果 +35%；自身暴擊率 +5 個百分點，技能傷害加成 −15%。",
      { minCrit: 1, minAil: 0.35, crit: 5, skill: -15 },
      "bn",
      "召喚・暴擊共鳴",
    ],
    [
      "咒縛領域",
      "詛咒效果 +35%、詛咒範圍 +30%；敵人每有一個生效中的詛咒，受到的傷害再乘 1.06。冷卻縮減 −8 個百分點。需搭配詛咒技能。",
      { crs: 0.35, crsR: 0.3, crsVul: 0.06, cdr: -8 },
      "an",
      "詛咒・增傷",
    ],
    [
      "軍團指揮",
      "召喚技能的召喚數量 +2；召喚物傷害 −20%，自身技能傷害 −15%。",
      { "tg:minion:minion": 2, minp: -20, skill: -15 },
      "",
      "召喚・數量",
    ],
    [
      "機關大師",
      "陷阱技能額外施放 +2、陷阱技能冷卻 −25%；非陷阱技能傷害 −15%。",
      { "tg:trap:extra": 2, "tg:trap:cd": 0.25, skill: -15 },
      "",
      "陷阱・連設",
    ],
    [
      "精準射擊",
      "技能傷害 +25%，暴擊率 +6 個百分點；技能範圍 −30%。",
      { skill: 25, crit: 6, area: -30 },
      "",
      "精準・單體",
    ],
  ],
};
// v4 tree: PoE-style. Each route is a chain of attribute nodes (+4 stat each)
// that forks into two specialties; each specialty ends in one powerful notable.
// Crossroads of attribute nodes join neighbouring routes. 18 ultimates stay on
// the rim. Class unique talents sit apart and never count toward the 2 ultimates.
const RO_STAT_NAMES = ["力量", "體質", "敏捷", "幸運", "智力", "靈巧"];
// v4.4: attribute nodes are coloured by stat; notables, junctions and
// ultimates by what they do (取向), with a legend on the map.
const RO_STAT_COLORS = ["#c8553d", "#3f9a68", "#3e86c6", "#c99a1e", "#8a5cc9", "#1d9c96"];
const RO_TREE_CAT = {
  dmg: ["傷害", "#cf3f33", "傷"],
  crit: ["暴擊", "#e08e0b", "暴"],
  speed: ["冷卻・速度", "#1593d1", "速"],
  skill: ["技能", "#5b4fd8", "技"],
  elem: ["元素", "#ec6f1c", "元"],
  curse: ["詛咒", "#a2359f", "咒"],
  summon: ["召喚", "#2f9a4e", "召"],
  poison: ["毒", "#7fa30f", "毒"],
  def: ["防禦・生命", "#557591", "防"],
};
const RO_TREE_NODE_CAT = {};
for (const [cat, ids] of Object.entries({
  dmg: "stran strbn strdn stru stru1 stru2 stru4 stru5",
  crit: "lukan lukcn lukj luku luku3 luku4 agiu1 intu4",
  speed: "agian agicn agiu agiu4",
  skill: "agidn agiu3 agiu5 intan intj intu dexan dexu5 dexj strj strcn stru3 dexdn dexu4",
  elem: "intbn intcn intdn intu1 intu2 intu3 intu5",
  curse: "dexcn dexu2",
  summon: "dexbn dexu dexu1 dexu3 agiu2",
  poison: "lukbn lukdn luku1 luku2 luku5",
  def: "vitan vitbn vitcn vitdn vitj vitu vitu1 vitu2 vitu3 vitu4 vitu5 agibn agij",
}))
  for (const id of ids.split(" ")) RO_TREE_NODE_CAT[id] = cat;
const roTreeColor = (n) =>
  n.kind === "attribute"
    ? RO_STAT_COLORS[n.stat]
    : RO_TREE_CAT[RO_TREE_NODE_CAT[n.id]]?.[1] || RO_TREE_ROUTES[n.route]?.color || "#8a97a0";
function roTreeLegend() {
  return `<div class="tree-legend" aria-label="天賦顏色圖例"><b>取向</b>${Object.values(RO_TREE_CAT)
    .map(([name, c, g]) => `<span><i style="--c:${c}">${g}</i>${name}</span>`)
    .join("")}<b>素質</b>${RO_STAT_NAMES.map((name, i) => `<span><i class="dot" style="--c:${RO_STAT_COLORS[i]}"></i>${name}</span>`).join("")}</div>`;
}
// Fewer but heavier notables (old minor ×3 + notable, folded into one node).
const RO_TREE_NOTABLES = {
  str: [
    ["碎甲之勢", "傷害 +28%，暴擊傷害 +18%", { dmgp: 28, critm: 18 }],
    ["血戰續行", "流血傷害 +66%，擊殺回復 +15", { bld: 66, lok: 15 }],
    ["破陣衝鋒", "範圍技能傷害倍率 +18%，技能範圍 +10%", { "tg:aoe:dmg": 0.18, area: 10 }],
    ["重鎚專注", "冷卻 4 秒以上的技能傷害倍率 +20%，暴擊傷害 +12%", { "tg:cdlong:dmg": 0.2, critm: 12 }],
  ],
  vit: [
    ["鋼鐵之膚", "護甲 +58%，最大生命 +8%", { armorp: 58, lifep: 8 }],
    ["泉源之心", "最大生命 +11%，每秒回復最大生命 0.5%，藥水效果 +18%", { lifep: 11, regenPct: 0.005, pot: 18 }],
    ["不屈意志", "最大生命 +10%，護甲 +25%", { lifep: 10, armorp: 25 }],
    ["戰地急救", "擊殺回復 +20，藥水效果 +30%，每秒回復最大生命 0.3%", { lok: 20, pot: 30, regenPct: 0.003 }],
  ],
  agi: [
    ["迅捷節拍", "攻擊速度 +22%，冷卻縮減 +4%", { aspd: 22, cdr: 4 }],
    ["風之足跡", "閃避 +96、閃避 +36%，移動速度 +10%", { eva: 96, evap: 36, move: 10 }],
    ["連擊本能", "冷卻 3 秒以下的技能冷卻 −15%，攻擊速度 +8%", { "tg:cdshort:cd": 0.15, aspd: 8 }],
    ["流星彈道", "投射物技能的投射物 +1，投射物技能傷害倍率 +8%", { "tg:proj:proj": 1, "tg:proj:dmg": 0.08 }],
  ],
  luk: [
    ["鷹眼之星", "暴擊率 +10%，暴擊傷害 +24%", { crit: 10, critm: 24 }],
    ["蝕骨毒理", "中毒傷害 +60%，中毒上限 +1 層", { psn: 60, psnMax: 1 }],
    ["致命弱點", "暴擊傷害 +36%，對菁英與 Boss 擊中傷害倍率 +6%", { critm: 36, boss: 0.06 }],
    ["毒霧擴散", "中毒技能範圍 +20%，中毒技能傷害倍率 +18%", { "tg:psn:area": 0.2, "tg:psn:dmg": 0.18 }],
  ],
  int: [
    ["符文共鳴", "技能傷害 +36%，冷卻縮減 +5%", { skill: 36, cdr: 5 }],
    ["元素延展", "燃燒傷害 +36%，元素異常效果 +24%，技能範圍 +14%", { brn: 36, ail: 0.24, area: 14 }],
    ["冰雷交鳴", "帶冰緩或感電效果的技能傷害倍率 +22%", { "tg:ail_chl:dmg": 0.22, "tg:ail_shk:dmg": 0.22 }],
    ["法術迴路", "連鎖技能的連鎖次數 +1，法術技能暴擊率 +8%", { "tg:chn:chn": 1, "tg:spell:crit": 8 }],
  ],
  dex: [
    ["精密調律", "技能傷害 +11%，冷卻縮減 +7%，暴擊率 +4%", { skill: 11, cdr: 7, crit: 4 }],
    ["共生契印", "召喚物傷害 +53%，召喚攻擊速度 +18%", { minp: 53, minAs: 0.18 }],
    ["咒術工藝", "詛咒效果 +25%，詛咒技能冷卻 −20%", { crs: 0.25, "tg:curse:cd": 0.2 }],
    ["機關巧手", "陷阱技能額外施放 +1，陷阱與召喚技能冷卻 −15%", { "tg:trap:extra": 1, "tg:trap:cd": 0.15, "tg:minion:cd": 0.15 }],
  ],
};
// v4.1 tree: a scattered constellation (Atlas-style wheels joined by attribute
// paths), generated once by tests/gen_tree.py into ro-tree-data.js. Notables,
// junctions and the 18 ultimates are spread so related ones are far apart.
const RO_TREE_NODES = {};
const RO_TREE_COST = { attribute: 1, big: 2, notable: 4, junction: 3, ultimate: 30 };
const RO_TREE_ULT = {};
for (const [i, r] of RO_TREE_ROUTES.entries())
  [r.ultimate, ...RO_TREE_ULTIMATE_BRANCHES[r.key]].forEach((u, branch) => {
    RO_TREE_ULT[r.key + (branch ? "u" + branch : "u")] = { u, i, branch };
  });
for (const [id, kind, x, y, stat, start, big] of RO_TREE_LAYOUT.nodes) {
  const where = { x, y };
  if (kind === "attribute") {
    const gain = big ? 6 : 2;
    RO_TREE_NODES[id] = {
      id,
      route: stat,
      kind,
      stat,
      gain,
      big: !!big,
      start: !!start,
      name: RO_STAT_NAMES[stat] + " +" + gain,
      desc: big
        ? `${RO_STAT_NAMES[stat]} +${gain}。素質之星，星座中心的大型素質節點。`
        : `${RO_STAT_NAMES[stat]} +${gain}。素質路徑節點。`,
      cost: big ? RO_TREE_COST.big : RO_TREE_COST.attribute,
      max: 1,
      where,
    };
  } else if (kind === "notable") {
    const key = id.slice(0, 3),
      ri = RO_TREE_ROUTES.findIndex((r) => r.key === key),
      [name, desc, mods] = RO_TREE_NOTABLES[key]["abcd".indexOf(id[3])];
    RO_TREE_NODES[id] = { id, route: ri, kind, name, desc, mods, cost: RO_TREE_COST.notable, max: 1, where };
  } else if (kind === "junction") {
    const key = id.slice(0, 3),
      ri = RO_TREE_ROUTES.findIndex((r) => r.key === key),
      r = RO_TREE_ROUTES[ri];
    RO_TREE_NODES[id] = {
      id,
      route: ri,
      kind,
      name: r.join[0],
      desc: r.join[1],
      mods: r.join[2],
      stat: ri,
      gain: 6,
      cost: RO_TREE_COST.junction,
      max: 1,
      where,
    };
  } else if (kind === "ultimate") {
    const { u, i: ri, branch } = RO_TREE_ULT[id];
    RO_TREE_NODES[id] = {
      id,
      route: ri,
      kind,
      name: u[0],
      desc: u[1],
      mods: u[2],
      focus:
        u[4] ||
        ["重擊・直傷", "生命・護甲", "攻速・冷卻", "暴擊・爆發", "技能・施法", "召喚・數量"][ri],
      branch,
      cost: RO_TREE_COST.ultimate,
      max: 1,
      level: 60,
      where,
    };
  }
}
// Undirected adjacency; null is the centre (冒險者).
const RO_TREE_EDGES = [];
const RO_TREE_ADJ = {};
const roLink = (a, b) => {
  RO_TREE_EDGES.push([a, b]);
  (RO_TREE_ADJ[a] ||= []).push(b);
  (RO_TREE_ADJ[b] ||= []).push(a);
};
for (const id of RO_TREE_LAYOUT.hub) roLink(null, id);
for (const [a, b] of RO_TREE_LAYOUT.edges) roLink(a, b);
for (const n of Object.values(RO_TREE_NODES))
  if (n.kind === "ultimate") n.anchor = RO_TREE_ADJ[n.id][0];
// Class unique talents: one per signature skill, boosting only that skill.
// They connect straight to the centre and do not count toward the ultimate cap.
const RO_TREE_UNIQUE_SPEC = {
  sword: [
    ["heavy", "震地", "傷害 ×1.4、範圍 +50%", { more: 0.4, area: 0.5 }],
    ["whirl", "旋風", "額外施放 +1、傷害 ×1.2", { extra: 1, more: 0.2 }],
    ["fissure", "裂地", "傷害 ×1.4、冷卻 −20%", { more: 0.4, cd: 0.2 }],
    ["swave", "貫穿", "投射物 +2、傷害 ×1.2", { proj: 2, more: 0.2 }],
    ["frostsl", "龍語", "傷害 ×1.3，並附加燃燒（冰火雙息）", { more: 0.3, "el:brn": 1 }],
    ["guard", "聖騎", "召喚數量 +1、傷害 ×1.3", { minion: 1, more: 0.3 }],
  ],
  bow: [
    ["pierce", "三連矢", "額外施放 +1、傷害 ×1.2", { extra: 1, more: 0.2 }],
    ["rain", "暴風", "範圍 +50%、傷害 ×1.3", { area: 0.5, more: 0.3 }],
    ["varrow", "劇毒", "傷害 ×1.3、暴擊率 +20%", { more: 0.3, crit: 20 }],
    ["trap", "連環", "額外施放 +1", { extra: 1 }],
    ["turret", "量產", "召喚數量 +1", { minion: 1 }],
    ["iarrow", "碎冰", "傷害 ×1.3，並附加感電", { more: 0.3, "el:shk": 1 }],
  ],
  mage: [
    ["fire", "爆炎", "範圍 +50%、傷害 ×1.3", { area: 0.5, more: 0.3 }],
    ["nova", "絕對零度", "傷害 ×1.4、冷卻 −20%", { more: 0.4, cd: 0.2 }],
    ["chain", "雷暴", "連鎖 +2、傷害 ×1.2", { chn: 2, more: 0.2 }],
    ["meteor", "流星群", "額外施放 +1", { extra: 1 }],
    ["bliz", "冰河", "範圍 +40%、傷害 ×1.4", { area: 0.4, more: 0.4 }],
    ["summon", "元素王", "召喚數量 +1、傷害 ×1.2", { minion: 1, more: 0.2 }],
  ],
  thief: [
    ["sonic", "雙重投擲", "額外施放 +1、傷害 ×1.2", { extra: 1, more: 0.2 }],
    ["backstab", "致命", "暴擊率 +30%、暴擊傷害 +60%", { crit: 30, critm: 60 }],
    ["envenom", "附魔毒", "傷害 ×1.4、範圍 +40%", { more: 0.4, area: 0.4 }],
    ["venom", "浸毒", "傷害 ×1.4、冷卻 −25%", { more: 0.4, cd: 0.25 }],
    ["blink", "影步", "傷害 ×1.5", { more: 0.5 }],
    ["varrow", "連射", "投射物 +2", { proj: 2 }],
  ],
  acolyte: [
    ["holy", "聖十字", "投射物 +2、傷害 ×1.2", { proj: 2, more: 0.2 }],
    ["sanctuary", "聖域", "範圍 +50%、傷害 ×1.3", { area: 0.5, more: 0.3 }],
    ["heal", "大治癒", "治癒量 ×1.6、冷卻 −30%", { more: 0.6, cd: 0.3 }],
    ["asura", "爆氣", "傷害 ×1.5、暴擊率 +20%", { more: 0.5, crit: 20 }],
    ["guard", "天使", "召喚數量 +1、傷害 ×1.3", { minion: 1, more: 0.3 }],
    ["chain", "審判之雷", "連鎖 +2、傷害 ×1.3", { chn: 2, more: 0.3 }],
  ],
  merchant: [
    ["mammonite", "鉅富", "傷害 ×1.5、暴擊率 +15%", { more: 0.5, crit: 15 }],
    ["cart", "旋轉", "額外施放 +1、範圍 +30%", { extra: 1, area: 0.3 }],
    ["acid", "腐蝕", "傷害 ×1.4、範圍 +40%", { more: 0.4, area: 0.4 }],
    ["homun", "進化", "召喚數量 +1、傷害 ×1.3", { minion: 1, more: 0.3 }],
    ["faw", "過載", "召喚數量 +1、傷害 ×1.2", { minion: 1, more: 0.2 }],
    ["fissure", "崩裂", "傷害 ×1.4、冷卻 −20%", { more: 0.4, cd: 0.2 }],
  ],
};
// Built at install time, after the RO skills (sonic, holy …) exist.
function roTreeAddUniques() {
  for (const [cls, list] of Object.entries(RO_TREE_UNIQUE_SPEC))
    list.forEach(([skill, tag, desc, eff], i) => {
      const id = "uq_" + cls + "_" + i,
        mods = Object.fromEntries(
          Object.entries(eff).map(([k, v]) => ["sk:" + skill + ":" + k, v]),
        );
      RO_TREE_NODES[id] = {
        id,
        route: -1,
        cls,
        skill,
        name: (SKILLS[skill]?.n || skill) + "・" + tag,
        desc: (SKILLS[skill]?.n || skill) + "：" + desc,
        mods,
        kind: "unique",
        cost: 10,
        max: 1,
        level: 20 + 10 * Math.floor(i / 2),
        slot: i,
      };
    });
}
// A node is "lit" once allocated (every node is a single rank now).
const roTreeLitAt = () => 1;
const roTreeLit = (n, r) => (r[n.id] || 0) >= 1;
let roTreeStart = "str"; // legacy field kept so older saves load.
// Allocated nodes connected to the centre.
// The 48-constellation map is large: reach and distance maps are cached per
// allocation (keyed by the set of allocated ids) so rendering stays fast.
const roTreeMemo = new WeakMap();
function roTreeMemoFor(r) {
  let sig = "";
  for (const k in r) if (r[k] > 0) sig += k + ",";
  let m = roTreeMemo.get(r);
  if (!m || m.sig !== sig) roTreeMemo.set(r, (m = { sig, reach: null, dist: null }));
  return m;
}
function roTreeReach(r) {
  const m = roTreeMemoFor(r);
  return (m.reach ||= roTreeReachRaw(r));
}
function roTreeReachRaw(r) {
  const seen = new Set(),
    queue = [null];
  while (queue.length) {
    const id = queue.shift();
    for (const nid of RO_TREE_ADJ[id] || [])
      if (nid !== null && !seen.has(nid) && r[nid]) {
        seen.add(nid);
        queue.push(nid);
      }
  }
  return seen;
}
function roTreeTouches(n, r, reach = roTreeReach(r)) {
  if (n.kind === "unique") return true;
  return (RO_TREE_ADJ[n.id] || []).some((id) => id === null || reach.has(id));
}
// Cheapest extra points needed before `n` can be allocated (0 = open now).
function roTreeDistance(n, r) {
  if (roTreeTouches(n, r)) return 0;
  const m = roTreeMemoFor(r);
  m.dist ||= roTreeDistMap(r);
  return Math.min(...(RO_TREE_ADJ[n.id] || []).map((id) => m.dist.get(id) ?? Infinity));
}
// Linear min-extraction (no per-step sort); stale queue entries are skipped.
function roTreePopMin(open, dist, done) {
  while (open.length) {
    let best = 0;
    for (let i = 1; i < open.length; i++) if (dist.get(open[i]) < dist.get(open[best])) best = i;
    const id = open[best];
    open[best] = open[open.length - 1];
    open.pop();
    if (done.has(id)) continue;
    done.add(id);
    return id;
  }
  return undefined;
}
function roTreeDistMap(r) {
  const done = new Set(),
    reach = roTreeReach(r),
    need = (x) => (reach.has(x.id) ? 0 : x.cost),
    dist = new Map([[null, 0]]),
    open = [null];
  while (open.length) {
    const id = roTreePopMin(open, dist, done);
    if (id === undefined) break;
    for (const nid of RO_TREE_ADJ[id] || []) {
      const x = RO_TREE_NODES[nid];
      if (!x || x.kind === "ultimate") continue;
      const d = dist.get(id) + need(x);
      if (!dist.has(nid) || d < dist.get(nid)) {
        dist.set(nid, d);
        open.push(nid);
      }
    }
  }
  return dist;
}
const roTreeBudget = () =>
  Math.floor(
    (RO_TREE_TOTAL * Math.min(RO_TREE_LEVELS, Math.max(0, (S?.lvl || 1) - 1))) /
      RO_TREE_LEVELS,
  );
const roTreeUsed = (r) =>
  Object.entries(r).reduce(
    (n, [k, v]) => n + (RO_TREE_NODES[k]?.cost || 0) * v,
    0,
  );
let roTreeUltIds = null;
const roTreeUltimates = (r) =>
  (roTreeUltIds ||= Object.values(RO_TREE_NODES)
    .filter((n) => n.kind === "ultimate")
    .map((n) => n.id)).filter((id) => r[id] > 0).length;
const roTreeStateCache = new WeakMap();
// Cheapest set of unallocated nodes that connects `target` to the allocated
// tree (or the centre). Ultimates are never used as stepping stones.
function roTreePathTo(target, r) {
  const done = new Set(),
    reach = roTreeReach(r),
    cost = (id) => (reach.has(id) ? 0 : RO_TREE_NODES[id].cost),
    dist = new Map([[null, 0]]),
    prev = new Map(),
    open = [null];
  for (const id of reach) {
    dist.set(id, 0);
    open.push(id);
  }
  while (open.length) {
    const id = roTreePopMin(open, dist, done);
    if (id === undefined) break;
    if (id === target) break;
    for (const nid of RO_TREE_ADJ[id] || []) {
      if (nid === null) continue;
      const x = RO_TREE_NODES[nid];
      if (x.kind === "ultimate" && nid !== target) continue;
      const d = dist.get(id) + cost(nid);
      if (!dist.has(nid) || d < dist.get(nid)) {
        dist.set(nid, d);
        prev.set(nid, id);
        open.push(nid);
      }
    }
  }
  if (!dist.has(target)) return null;
  const path = [];
  for (let id = target; id !== null && id !== undefined && !reach.has(id); id = prev.get(id))
    path.unshift(id);
  return path;
}
// Older saves (v1/v2 trees): keep the chosen notables, junctions, ultimates and
// unique talents, then rebuild the cheapest paths to them on the new map.
function roTreeMigrate(old) {
  const r = {},
    targets = Object.keys(old || {}).filter((id) => {
      const n = RO_TREE_NODES[id];
      return old[id] && n && n.kind !== "attribute";
    });
  const order = ["unique", "ultimate", "notable", "junction"];
  targets.sort((a, b) => order.indexOf(RO_TREE_NODES[a].kind) - order.indexOf(RO_TREE_NODES[b].kind));
  for (const id of targets) {
    const n = RO_TREE_NODES[id];
    if (n.kind === "unique") {
      if (!roTreeBlock(n, r)) r[id] = 1;
      continue;
    }
    const path = roTreePathTo(id, r);
    if (!path) continue;
    const extra = path.reduce((s, x) => s + RO_TREE_NODES[x].cost, 0);
    if (roTreeUsed(r) + extra > roTreeBudget()) continue;
    if (n.kind === "ultimate" && roTreeUltimates(r) >= 2) continue;
    for (const x of path) r[x] = 1;
  }
  return r;
}
function roTreeEnsure() {
  if (!S) return;
  const cached = roTreeStateCache.get(S);
  if (
    cached &&
    cached.ranks === S.roTree?.ranks &&
    cached.budget === roTreeBudget()
  )
    return;
  if (!S.roTree) S.roTree = { version: 4, ranks: {} };
  if (S.roTree.version !== 4) {
    S.roTree = {
      version: 4,
      ranks: roTreeMigrate(S.roTree.ranks),
      migrated: 1,
    };
  }
  const valid = roTreeGrow({ ...(S.roTree.ranks || {}) });
  S.roTree.ranks = valid;
  S.roStats = [...roClass[S.cls].stats];
  for (const [id, rank] of Object.entries(valid)) {
    const n = RO_TREE_NODES[id];
    if (n.stat != null) S.roStats[n.stat] += n.gain * rank;
  }
  S.roSpent = roTreeUsed(valid);
  roTreeStateCache.set(S, { ranks: valid, budget: roTreeBudget() });
}
// Re-add saved nodes outward from the centre until nothing more fits.
// Path nodes first, then notables/junctions, then ultimates and uniques.
const RO_GROW_ORDER = ["attribute", "notable", "junction", "ultimate", "unique"];
// Same rules as roTreeBlock, but incremental: a node joins once it touches the
// centre or an already-kept node, within budget, level, class and the ult cap.
const RO_TREE_GROW_LIST = () =>
  (RO_TREE_GROW_LIST.v ||= Object.values(RO_TREE_NODES).sort(
    (a, b) => RO_GROW_ORDER.indexOf(a.kind) - RO_GROW_ORDER.indexOf(b.kind),
  ));
function roTreeGrow(saved) {
  const valid = {},
    budget = roTreeBudget(),
    nodes = RO_TREE_GROW_LIST().filter((n) => Number(saved[n.id]) > 0);
  let used = 0,
    ults = 0;
  for (let pass = 0; pass < 256; pass++) {
    let changed = false;
    for (const n of nodes) {
      if (valid[n.id]) continue;
      if (n.kind === "unique" ? n.cls !== S.cls : !(RO_TREE_ADJ[n.id] || []).some((id) => id === null || valid[id]))
        continue;
      if (n.kind === "ultimate" && ults >= 2) continue;
      if (used + n.cost > budget || (n.level && S.lvl < n.level)) continue;
      valid[n.id] = 1;
      used += n.cost;
      if (n.kind === "ultimate") ults++;
      changed = true;
    }
    if (!changed) break;
  }
  return valid;
}
function roTreeBlock(n, r) {
  if ((r[n.id] || 0) >= n.max) return "已投入";
  if (n.kind === "unique" && n.cls !== S.cls)
    return "僅限" + (roClass[n.cls]?.n || n.cls);
  if (n.kind === "ultimate" && roTreeUltimates(r) >= 2)
    return "每個角色最多兩個終極天賦";
  if (roTreeUsed(r) + n.cost > roTreeBudget()) return "天賦點不足";
  if (n.level && S.lvl < n.level) return `需要 Lv.${n.level}`;
  if (!roTreeTouches(n, r)) {
    const d = roTreeDistance(n, r);
    return (
      "需與已點亮、且連回中心的天賦相鄰" +
      (Number.isFinite(d) ? `；最近路徑還需 ${d} 點` : "")
    );
  }
  return "";
}
// Every allocated node must trace back to the centre.
function roTreeValid(r) {
  if (roTreeUsed(r) > roTreeBudget() || roTreeUltimates(r) > 2) return false;
  for (const [id, rank] of Object.entries(r)) {
    if (!rank) continue;
    const n = RO_TREE_NODES[id];
    if (!n || rank > n.max || (n.level && S.lvl < n.level)) return false;
    if (n.kind === "unique" && n.cls !== S.cls) return false;
  }
  const reach = roTreeReach(r);
  return Object.entries(r).every(
    ([id, rank]) => !rank || RO_TREE_NODES[id].kind === "unique" || reach.has(id),
  );
}
let roTreeHint = new Set();
let roTreeDraft = null,
  roTreeDraftStart = "str",
  roTreeSelected = "str",
  roTreeView = "tree",
  roTreeZoom = 1;
const RO_TREE_ZMIN = 0.5,
  RO_TREE_ZMAX = 3,
  roTreeSvgH = () => `${roTreeZoom * (RO_TREE_C / 800) * 100}%`;
let roTreeCamera = { x: 0, y: 0, catalog: 0, detail: 0 },
  roTreeDrag = null,
  roTreeSuppressClick = false;
function roTreePaintCamera() {
  const svg = $("#sheet .tree-map svg");
  if (svg)
    svg.style.transform = `translate(-50%, -50%) translate(${roTreeCamera.x}px, ${roTreeCamera.y}px)`;
}
function roTreeInstallPan() {
  document.addEventListener("pointerdown", (e) => {
    const map = e.target.closest(".ro-tree-sheet .tree-map");
    if (!map || e.button !== 0 || !e.isPrimary) return;
    // Native focus scrolling fights the translated camera, especially after zooming.
    e.preventDefault();
    roTreeSuppressClick = false;
    roTreeDrag = {
      map,
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      panX: roTreeCamera.x,
      panY: roTreeCamera.y,
      moved: false,
    };
  });
  document.addEventListener(
    "pointermove",
    (e) => {
      const d = roTreeDrag;
      if (!d || d.id !== e.pointerId) return;
      if (!d.map.isConnected) {
        roTreeDrag = null;
        return;
      }
      const dx = e.clientX - d.x,
        dy = e.clientY - d.y;
      if (!d.moved && Math.hypot(dx, dy) < 5) return;
      if (!d.moved) {
        d.moved = true;
        d.map.setPointerCapture(e.pointerId);
        d.map.classList.add("dragging");
      }
      e.preventDefault();
      roTreeCamera.x = d.panX + dx;
      roTreeCamera.y = d.panY + dy;
      roTreePaintCamera();
    },
    { passive: false },
  );
  const finish = (e) => {
    const d = roTreeDrag;
    if (!d || d.id !== e.pointerId) return;
    roTreeSuppressClick = d.moved;
    roTreeDrag = null;
    d.map.classList.remove("dragging");
    if (d.map.hasPointerCapture(e.pointerId))
      d.map.releasePointerCapture(e.pointerId);
  };
  // 滾輪縮放：以滑鼠位置為中心，50%～300%
  document.addEventListener(
    "wheel",
    (e) => {
      const map = e.target.closest?.(".ro-tree-sheet .tree-map");
      if (!map) return;
      e.preventDefault();
      const z0 = roTreeZoom,
        z1 = Math.min(RO_TREE_ZMAX, Math.max(RO_TREE_ZMIN, Math.round(z0 * (e.deltaY < 0 ? 1.12 : 1 / 1.12) * 100) / 100));
      if (z1 === z0) return;
      const box = map.getBoundingClientRect(),
        px = e.clientX - box.left - box.width / 2,
        py = e.clientY - box.top - box.height / 2,
        k = z1 / z0;
      roTreeCamera.x = px - (px - roTreeCamera.x) * k;
      roTreeCamera.y = py - (py - roTreeCamera.y) * k;
      roTreeZoom = z1;
      const svg = map.querySelector("svg");
      if (svg) svg.style.height = roTreeSvgH();
      const lab = $("#sheet .tree-zoom-val");
      if (lab) lab.textContent = Math.round(z1 * 100) + "%";
      roTreePaintCamera();
    },
    { passive: false },
  );
  document.addEventListener("pointerup", finish);
  document.addEventListener("pointercancel", finish);
  document.addEventListener("lostpointercapture", finish);
  window.addEventListener("blur", () => {
    if (roTreeDrag) finish({ pointerId: roTreeDrag.id });
  });
  document.addEventListener(
    "click",
    (e) => {
      if (roTreeSuppressClick && e.target.closest(".ro-tree-sheet .tree-map")) {
        roTreeSuppressClick = false;
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true,
  );
}
let RO_TREE_C = Math.ceil(
  Math.max(800, ...RO_TREE_LAYOUT.nodes.map((n) => Math.max(Math.abs(n[2]), Math.abs(n[3])) + 70)),
);
function roTreePoint(n) {
  if (!n) return { x: RO_TREE_C, y: RO_TREE_C };
  return { x: RO_TREE_C + n.where.x, y: RO_TREE_C + n.where.y };
}
// 節點圓圈半徑（含終極外環），供標籤避讓
const roTreeR = (n) => (n.kind === "attribute" ? (n.big ? 12 : 8) : n.kind === "ultimate" ? 26 : n.kind === "notable" ? 17 : 14);
// 標籤位置：下、上、右、左，選第一個不壓到其他節點與已放標籤的位置（只算一次）
let roTreeLabelPos = null;
function roTreeLabels() {
  if (roTreeLabelPos) return roTreeLabelPos;
  const ns = Object.values(RO_TREE_NODES).filter((n) => n.kind !== "unique"),
    placed = [],
    out = new Map();
  const hitCircle = (b, x0, y0, x1, y1, self) =>
    ns.some((m) => {
      if (m === self) return false;
      const r = roTreeR(m) + 2,
        cx = Math.max(x0, Math.min(m.where.x, x1)),
        cy = Math.max(y0, Math.min(m.where.y, y1));
      return Math.hypot(cx - m.where.x, cy - m.where.y) < r;
    });
  const hitLabel = (x0, y0, x1, y1) => placed.some((b) => x0 < b[2] && x1 > b[0] && y0 < b[3] && y1 > b[1]);
  const order = ns.filter((n) => n.kind !== "attribute").sort((a, b) => roTreeR(b) - roTreeR(a));
  for (const n of order) {
    const w = n.name.length * 13 + 6,
      h = 16,
      r = roTreeR(n),
      { x, y } = n.where,
      cand = [
        [x, y + r + 15, "middle", x - w / 2, y + r + 2, x + w / 2, y + r + 2 + h],
        [x, y - r - 6, "middle", x - w / 2, y - r - 6 - h + 2, x + w / 2, y - r - 4],
        [x + r + 5, y + 5, "start", x + r + 3, y - h / 2, x + r + 3 + w, y + h / 2],
        [x - r - 5, y + 5, "end", x - r - 3 - w, y - h / 2, x - r - 3, y + h / 2],
        [x, y + r + 28, "middle", x - w / 2, y + r + 15, x + w / 2, y + r + 15 + h],
      ];
    let best = cand[0],
      bestScore = Infinity;
    for (const c of cand) {
      const score = (hitCircle(null, c[3], c[4], c[5], c[6], n) ? 2 : 0) + (hitLabel(c[3], c[4], c[5], c[6]) ? 1 : 0);
      if (score < bestScore) (best = c), (bestScore = score);
      if (!score) break;
    }
    placed.push([best[3], best[4], best[5], best[6]]);
    out.set(n.id, best);
  }
  return (roTreeLabelPos = out);
}
// 修正與專精／終極圓圈重疊的素質點：沿反方向推開
function roTreeUnoverlap() {
  const ns = Object.values(RO_TREE_NODES).filter((n) => n.kind !== "unique");
  for (let pass = 0; pass < 3; pass++)
    for (const a of ns) {
      if (a.kind !== "attribute") continue;
      for (const b of ns) {
        if (a === b) continue;
        const dx = a.where.x - b.where.x,
          dy = a.where.y - b.where.y,
          d = Math.hypot(dx, dy) || 1,
          need = roTreeR(a) + roTreeR(b) + 6;
        if (d >= need) continue;
        const k = (need - d) / d;
        if (b.kind === "attribute") {
          a.where.x += (dx * k) / 2;
          a.where.y += (dy * k) / 2;
          b.where.x -= (dx * k) / 2;
          b.where.y -= (dy * k) / 2;
        } else {
          a.where.x += dx * k;
          a.where.y += dy * k;
        }
      }
    }
}
roTreeUnoverlap();
function roTreeSvg() {
  const r = roTreeDraft,
    edges = [],
    nodes = [],
    labels = [],
    lpos = roTreeLabels();
  for (const [a, b] of RO_TREE_EDGES) {
    const na = RO_TREE_NODES[a],
      nb = RO_TREE_NODES[b],
      from = roTreePoint(na),
      to = roTreePoint(nb),
      lit = (!na || r[a]) && r[b],
      H = (id) => roTreeHint.has(id),
      hint = (H(a) || H(b)) && (H(a) || !na || r[a]) && (H(b) || r[b]);
    edges.push(
      `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" class="${hint ? "hint " : ""}${lit ? "lit" : ""}"/>`,
    );
  }
  for (const n of Object.values(RO_TREE_NODES)) {
    if (n.kind === "unique") continue;
    const p = roTreePoint(n),
      route = RO_TREE_ROUTES[n.route],
      on = !!r[n.id],
      available = !on && !roTreeBlock(n, r),
      cls = `tree-node ${n.kind} ${n.big ? "big" : ""} ${on ? "on" : ""} ${available ? "available" : ""} ${roTreeHint.has(n.id) ? "hint" : ""} ${roTreeSelected === n.id ? "selected" : ""}`;
    if (n.kind === "attribute") {
      nodes.push(
        `<g role="button" tabindex="0" aria-label="${n.name}，${on ? "已點亮" : "未點亮"}" data-ro-node="${n.id}" class="${cls}" style="--route:${roTreeColor(n)}"><title>${n.name}（${n.cost} 點）</title><circle cx="${p.x}" cy="${p.y}" r="${n.big ? 12 : 8}"/>${n.big ? `<text class="tree-symbol small" x="${p.x}" y="${p.y + 3.5}">${roStats[n.stat][0]}</text>` : ""}</g>`,
      );
      continue;
    }
    const radius = n.kind === "ultimate" ? 21 : n.kind === "notable" ? 17 : 14,
      cat = RO_TREE_CAT[RO_TREE_NODE_CAT[n.id]],
      label = cat ? cat[2] : n.kind === "ultimate" ? "✦" : n.kind === "notable" ? "◆" : "✧";
    nodes.push(
      `<g role="button" tabindex="0" aria-label="${n.name}（${cat ? cat[0] : RO_KIND_NAME[n.kind]}），${on ? "已點亮" : "未點亮"}" data-ro-node="${n.id}" class="${cls}" style="--route:${roTreeColor(n)}"><title>${n.name}（${cat ? cat[0] : ""}）：${n.desc}</title>${n.kind === "ultimate" ? `<circle class="tree-ult-ring" cx="${p.x}" cy="${p.y}" r="${radius + 5}"/>` : ""}<circle cx="${p.x}" cy="${p.y}" r="${radius}"/><text class="tree-symbol" x="${p.x}" y="${p.y + 4}">${label}</text></g>`,
    );
    const lp = lpos.get(n.id) || [n.where.x, n.where.y + radius + 15, "middle"];
    labels.push(
      `<text class="tree-label${on ? " on" : ""}${roTreeSelected === n.id ? " selected" : ""}" style="--route:${roTreeColor(n)};text-anchor:${lp[2]}" x="${RO_TREE_C + lp[0]}" y="${RO_TREE_C + lp[1]}">${n.name}</text>`,
    );
  }
  const c = RO_TREE_C;
  return `<svg viewBox="0 0 ${c * 2} ${c * 2}" role="group" aria-label="共用天賦樹：星座狀素質路徑、二十四個專精、六個交會、三十六個終極天賦" style="height:${roTreeSvgH()};width:auto"><g class="tree-links">${edges.join("")}</g><defs><radialGradient id="treeHubG" cx="50%" cy="42%" r="60%"><stop offset="0%" stop-color="#fffbe9"/><stop offset="70%" stop-color="#f6df9c"/><stop offset="100%" stop-color="#d9a945"/></radialGradient></defs><circle class="tree-center-glow" cx="${c}" cy="${c}" r="74"/><circle class="tree-center-ring" cx="${c}" cy="${c}" r="64"/><circle class="tree-center" cx="${c}" cy="${c}" r="56" fill="url(#treeHubG)"/><text x="${c}" y="${c - 4}" class="tree-origin">冒險者起點</text><text x="${c}" y="${c + 16}" class="tree-rank tree-hub-sub">六職業共用</text>${nodes.join("")}<g class="tree-labels">${labels.join("")}</g></svg>`;
}
function roTreeCardPath(n) {
  if (roTreeDraft[n.id]) return "已選擇";
  const d = roTreeDistance(n, roTreeDraft);
  if (d === 0) return "已連通，可直接投入";
  return `路徑還需 ${d} 點（不含終極本身 ${n.cost} 點）`;
}
function roTreeCatalog() {
  return `<div class="tree-catalog"><p class="tree-catalog-intro">${Object.values(RO_TREE_NODES).filter((x) => x.kind === "ultimate").length} 個終極天賦 · 全職業皆可選擇<br>點選卡片查看完整效果與前置條件；最多選兩個，可同路線或跨路線搭配。<br>${Object.values(RO_TREE_NODES).filter((x) => x.kind === "ultimate").length} 個終極散落在星座網各處，同系列的不會相鄰；從中心沿任一條路徑往外點。終極天賦可不點，也能正常遊玩。</p>${RO_TREE_ROUTES.map(
    (route, i) =>
      `<section style="--route:${route.color}"><h3>${route.name} <small>${roStats[i][1]}路線</small></h3>${Object.values(
        RO_TREE_NODES,
      )
        .filter((n) => n.route === i && n.kind === "ultimate")
        .map(
          (n) =>
            `<button class="tree-ultimate-card ${roTreeDraft[n.id] ? "on" : ""} ${roTreeSelected === n.id ? "selected" : ""}" data-ro-node="${n.id}" aria-pressed="${roTreeSelected === n.id}" style="--route:${roTreeColor(n)}"><span class="tree-card-top"><b>${n.name}</b><small>${roTreeDraft[n.id] ? "已選擇" : n.cost + " 點"}</small></span><em>${RO_TREE_CAT[RO_TREE_NODE_CAT[n.id]]?.[0] || ""} · ${n.focus}</em><small class="tree-card-path">${roTreeCardPath(n)}</small><span>${n.desc}</span></button>`,
        )
        .join("")}</section>`,
  ).join("")}</div>`;
}
// Class unique talents: listed as cards for the current class only.
function roTreeUniqueView() {
  const list = Object.values(RO_TREE_NODES).filter(
    (n) => n.kind === "unique" && n.cls === S.cls,
  );
  return `<div class="tree-catalog"><p class="tree-catalog-intro">${roClass[S.cls].n}的獨特天賦 · 每個只強化一個職業技能<br>直接從中心投入，不需路徑；不佔終極天賦的兩個名額，但會使用天賦點。</p><section style="--route:${roClass[S.cls].color}"><h3>職業獨特天賦 <small>${list.length} 個</small></h3>${list
    .map(
      (n) =>
        `<button class="tree-ultimate-card ${roTreeDraft[n.id] ? "on" : ""} ${roTreeSelected === n.id ? "selected" : ""}" data-ro-node="${n.id}" aria-pressed="${roTreeSelected === n.id}"><span class="tree-card-top"><b>${n.name}</b><small>${roTreeDraft[n.id] ? "已選擇" : n.cost + " 點 · Lv." + n.level}</small></span><em>${SKILLS[n.skill]?.n || n.skill}</em><span>${n.desc}</span></button>`,
    )
    .join("")}</section></div>`;
}
function roTreeOpen() {
  roTreeEnsure();
  roTreeDraft = { ...S.roTree.ranks };
  roTreeSelected = RO_TREE_LAYOUT.hub[0];
  roTreeZoom = 1;
  roTreeView = "tree";
  roTreeCamera = { x: 0, y: 0, catalog: 0, detail: 0 };
  roTreeRender(true);
}
const RO_KIND_NAME = {
  attribute: "素質路徑",
  notable: "專精天賦",
  junction: "交會天賦",
  ultimate: "終極天賦",
  unique: "職業獨特天賦",
};
function roTreeRender(fresh = false) {
  const active = document.activeElement,
    focusNode = active?.closest("#sheet [data-ro-node]")?.dataset.roNode,
    focusAction = active?.closest("#sheet [data-ro-tree]")?.dataset.roTree,
    scrollParents = fresh
      ? []
      : [$("#sheet"), $("#sheetBg")]
          .filter(Boolean)
          .map((el) => ({ el, top: el.scrollTop, left: el.scrollLeft }));
  if (!fresh) {
    const catalog = $("#sheet .tree-catalog"),
      detail = $("#sheet .tree-detail");
    if (catalog) roTreeCamera.catalog = catalog.scrollTop;
    if (detail) roTreeCamera.detail = detail.scrollTop;
  }
  const n = RO_TREE_NODES[roTreeSelected] || RO_TREE_NODES[RO_TREE_LAYOUT.hub[0]],
    r = roTreeDraft,
    on = !!r[n.id],
    block = on ? "" : roTreeBlock(n, r),
    route =
      !on && n.kind !== "unique" && block && !/點不足|名額|兩個|Lv\.|僅限/.test(block)
        ? roTreePathTo(n.id, r)
        : null,
    routeCost = route ? route.reduce((s, id) => s + RO_TREE_NODES[id].cost, 0) : 0,
    color =
      n.kind === "unique"
        ? roClass[n.cls].color
        : RO_TREE_ROUTES[n.kind === "attribute" ? n.stat : n.route].color,
    where =
      n.kind === "unique"
        ? roClass[n.cls].n
        : RO_TREE_ROUTES[n.kind === "attribute" ? n.stat : n.route].name + "路線";
  roTreeHint = new Set(route || []);
  const totals = [...roClass[S.cls].stats];
  for (const [id, v] of Object.entries(r)) {
    const x = RO_TREE_NODES[id];
    if (x?.stat != null) totals[x.stat] += x.gain * v;
  }
  const selectedUlts = Object.values(RO_TREE_NODES).filter(
      (x) => x.kind === "ultimate" && r[x.id],
    ),
    uniques = Object.values(RO_TREE_NODES).filter(
      (x) => x.kind === "unique" && r[x.id],
    ),
    uniqueCount = Object.values(RO_TREE_NODES).filter(
      (x) => x.kind === "unique" && x.cls === S.cls,
    ).length;
  $("#sheet").className = "wide ro-tree-sheet";
  $("#sheet").innerHTML =
    `<header class="tree-header"><div><small>ADVENTURER'S CONSTELLATION</small><h2>共用天賦樹</h2><p>剩餘 <b>${roTreeBudget() - roTreeUsed(r)}</b> / ${roTreeBudget()} 點 · 終極天賦 <b>${roTreeUltimates(r)} / 2</b> · 獨特天賦 <b>${uniques.length}</b></p></div><button class="btn" data-act="close">關閉</button></header><div class="tree-layout"><div class="tree-map-wrap"><div class="tree-tools"><button class="btn sm" data-ro-tree="tree" aria-pressed="${roTreeView === "tree"}">天賦星圖</button><button class="btn sm" data-ro-tree="catalog" aria-pressed="${roTreeView === "catalog"}">終極總覽 · ${roTreeUltIds ? roTreeUltIds.length : Object.values(RO_TREE_NODES).filter((x) => x.kind === "ultimate").length}</button><button class="btn sm" data-ro-tree="unique" aria-pressed="${roTreeView === "unique"}">職業獨特 · ${uniqueCount}</button>${roTreeView === "tree" ? `<button class="btn sm" data-ro-tree="zoomout" aria-label="縮小天賦樹">−</button><span class="tree-zoom-val">${Math.round(roTreeZoom * 100)}%</span><button class="btn sm" data-ro-tree="zoomin" aria-label="放大天賦樹">＋</button><button class="btn sm" data-ro-tree="center" aria-label="重設天賦樹視角">置中</button><span class="tree-pan-hint">按住拖曳移動・滾輪縮放</span>` : ""}</div>${roTreeView === "catalog" ? roTreeCatalog() : roTreeView === "unique" ? roTreeUniqueView() : `<div class="tree-map" aria-label="可拖曳的天賦星圖">${roTreeSvg()}</div>${roTreeLegend()}`}</div><aside class="tree-detail"><small style="color:${color}">${where} · ${RO_KIND_NAME[n.kind]}</small><h3>${n.name}</h3><p>${n.desc}</p><p class="tree-cost">${on ? "已投入" : "未投入"} · ${n.cost} 點</p>${n.kind === "ultimate" ? `<p class=note>Lv.60 開放，${n.cost} 點；需與已點亮、且連回中心的相鄰節點相連。目前：${roTreeCardPath(n)}。每個角色最多選兩個。</p>` : ""}${n.kind === "unique" ? `<p class=note>Lv.${n.level} 開放。只強化「${SKILLS[n.skill]?.n || n.skill}」，需把該技能放上技能盤才有效。不佔終極天賦名額。</p>` : ""}<div class="row"><button class="btn primary" data-ro-tree="add" ${on || block ? "disabled" : ""}>投入 ${n.cost} 點</button>${route ? `<button class="btn" data-ro-tree="path" ${roTreeUsed(r) + routeCost <= roTreeBudget() && !(n.kind === "ultimate" && roTreeUltimates(r) >= 2) ? "" : "disabled"}>沿最短路徑點到這裡（${route.length} 個節點・${routeCost} 點）</button>` : ""}<button class="btn" data-ro-tree="remove" ${on ? "" : "disabled"}>退回</button></div><p class="tree-status" role="status">${on ? "已投入；按套用後才會生效。" : block || "可投入；按套用後才會生效。"}</p><h4>配置後素質</h4><div class="tree-stats">${roStats.map(([key, label], i) => `<span>${label}<b>${totals[i]}</b></span>`).join("")}</div><h4>已選終極天賦</h4><p>${selectedUlts.length ? selectedUlts.map((x) => x.name).join(" ／ ") : "尚未選擇"}</p>${uniques.length ? `<h4>職業獨特天賦</h4><p>${uniques.map((x) => x.name).join(" ／ ")}</p>` : ""}<p class="note">天賦點隨等級平均取得，Lv.127 共 ${RO_TREE_TOTAL} 點：剛好夠任意兩個終極天賦（最貴的組合正好用完）。素質節點 1 點、素質 +2（素質之星 2 點、+6）；專精 4 點；交會 3 點；終極 30 點；獨特天賦 10 點。點選遠處的天賦可「沿最短路徑點到這裡」。重配免費；Boss 或試煉戰鬥中不能套用。</p>${S.roTree.migrated ? "<p class=tree-migration>天賦樹已擴大為 48 個星座：原本選的專精、交會、終極與獨特天賦已沿最短路徑自動補上；點數不足的部分已退回。</p>" : ""}</aside></div><footer class="tree-footer"><button class="btn" data-ro-tree="reset">重置草稿</button><button class="btn" data-ro-tree="revert">還原目前配置</button><span>關閉不會儲存草稿</span><button class="btn primary" data-ro-tree="apply" ${inFight() ? "disabled" : ""}>${inFight() ? "戰鬥結束後套用" : "套用並儲存"}</button></footer>`;
  $("#sheetBg").hidden = false;
  const catalog = $("#sheet .tree-catalog");
  if (catalog) catalog.scrollTop = roTreeCamera.catalog;
  $("#sheet .tree-detail").scrollTop = roTreeCamera.detail;
  roTreePaintCamera();
  if (!fresh) {
    const target = focusNode
      ? $('#sheet [data-ro-node="' + CSS.escape(focusNode) + '"]')
      : focusAction
        ? $('#sheet [data-ro-tree="' + CSS.escape(focusAction) + '"]')
        : null;
    target?.focus({ preventScroll: true });
    for (const { el, top, left } of scrollParents) {
      el.scrollTop = top;
      el.scrollLeft = left;
    }
  }
}
function roTreeAction(action) {
  if (!roTreeDraft) return;
  const n = RO_TREE_NODES[roTreeSelected];
  if (action === "add" && n && !roTreeBlock(n, roTreeDraft))
    roTreeDraft[n.id] = 1;
  if (action === "path" && n) {
    const path = roTreePathTo(n.id, roTreeDraft);
    if (path) {
      const next = { ...roTreeDraft };
      for (const id of path) next[id] = 1;
      if (roTreeValid(next)) roTreeDraft = next;
      else toast("天賦點不足或超過終極名額", "bad");
    }
  }
  if (action === "remove" && n) {
    const next = { ...roTreeDraft };
    delete next[n.id];
    if (!roTreeValid(next)) {
      toast("先退回依賴此節點的後續天賦", "bad");
      return;
    }
    roTreeDraft = next;
  }
  if (["tree", "catalog", "unique"].includes(action)) roTreeView = action;
  if (action === "reset") roTreeDraft = {};
  if (action === "revert") roTreeDraft = { ...S.roTree.ranks };
  if (action === "zoomin") roTreeZoom = Math.min(RO_TREE_ZMAX, roTreeZoom + 0.25);
  if (action === "zoomout") roTreeZoom = Math.max(RO_TREE_ZMIN, roTreeZoom - 0.25);
  if (action === "center") {
    roTreeZoom = 1;
    roTreeCamera.x = 0;
    roTreeCamera.y = 0;
  }
  if (action === "apply") {
    if (inFight() || !roTreeValid(roTreeDraft))
      return toast("目前配置無法套用", "bad");
    const previousHp = S.hp;
    S.roTree.ranks = { ...roTreeDraft };
    S.roTree.migrated = false;
    roTreeEnsure();
    recalc();
    S.hp = Math.min(previousHp, PS.maxhp);
    markDirty();
    saveNow();
    ui.render();
    toast("共用天賦已套用並儲存");
  }
  roTreeRender();
}
let roGearCache = { ps: null, items: new WeakMap() };
function roGearAdvice(item) {
  if (!item || !canWear(item) || !SLOTS.includes(item.slot))
    return { good: false };
  if (roGearCache.ps !== PS) roGearCache = { ps: PS, items: new WeakMap() };
  if (roGearCache.items.has(item)) return roGearCache.items.get(item);
  const next = previewEquip(item),
    defense = (p) =>
      p.maxhp /
      Math.max(0.25, 1 - p.armRed / 100) /
      Math.max(0.25, 1 - p.dodge / 100);
  const damage = next.dps / Math.max(1, PS.dps) - 1,
    survival = defense(next) / Math.max(1, defense(PS)) - 1;
  const empty = !S.equip[item.slot],
    attack = damage >= 0.03 && survival >= -0.08,
    defend = survival >= 0.05 && damage >= -0.05;
  const balanced =
    Math.pow(Math.max(0.01, 1 + damage), 0.6) *
      Math.pow(Math.max(0.01, 1 + survival), 0.4) -
      1 >=
      0.03 &&
    damage >= -0.1 &&
    survival >= -0.1;
  const result = {
    good: empty || attack || defend || balanced,
    attack: empty || attack,
    defend: empty || defend,
    damage,
    survival,
    empty,
    reason: empty
      ? "補齊空裝備部位"
      : attack
        ? "輸出提升"
        : defend
          ? "生存提升"
          : balanced
            ? "綜合提升"
            : "目前面板未達建議門檻",
  };
  roGearCache.items.set(item, result);
  return result;
}
function roAdviceHtml(item) {
  const a = roGearAdvice(item);
  if (!a.good) return "";
  const pct = (v) => (v >= 0 ? "+" : "") + (v * 100).toFixed(1) + "%";
  return `<div class="ro-upgrade-summary"><b>↑ 建議更換 · ${a.reason}</b><span>預估輸出 ${pct(a.damage)} · 有效生命 ${pct(a.survival)}</span><small>依目前技能與面板估算；獨特詞綴的觸發條件仍需比較。</small></div>`;
}
const RO_SEASON_BOSSES = [
  {
    name: "菌冠波利母體",
    title: "孢林之心",
    color: "#c699bd",
    habitat: "吸收古樹汁液的波利群聚體，以菌絲守護繁殖地。",
    skills: ["孢子花環", "菌床萌發", "黏液奔流"],
    unique: "kingr",
    artifact: "菌冠孢心",
  },
  {
    name: "古林鹿靈",
    title: "月枝守望者",
    color: "#a6c9a5",
    habitat: "棲居林間聖泉的鹿形精靈，角枝會隨月光生長。",
    skills: ["根鬚穿刺", "月枝交錯", "森息回環"],
    unique: "vortg",
    artifact: "月枝靈核",
  },
  {
    name: "熔殼機械甲蟲",
    title: "廢礦鍛爐",
    color: "#d49b60",
    habitat: "以礦石為食的古代採掘機體，熔爐與甲殼已長成一體。",
    skills: ["熔渣落點", "鍛爐掃射", "熱核震波"],
    unique: "abyssc",
    artifact: "熔殼爐心",
  },
];
function roInstallSeason() {
  SEASON.n = "荒野回響";
  roMapThemes[SS_MAP] = "grass";
  MAPS[SS_MAP].n = "米德加爾特・共生秘境";
  MAPS[SS_MAP].boss = "共生秘境首領";
  const types = ["ro_fungal", "ro_stag", "ro_scarab"];
  const originalSprites = buildSprites;
  buildSprites = function () {
    originalSprites();
    types.forEach((type, i) => {
      const frames = [0, 0.3].map((t) => {
        const canvas = document.createElement("canvas");
        canvas.width = 26;
        canvas.height = 26;
        const c = canvas.getContext("2d");
        c.scale(0.5, 0.5);
        roDrawSeasonBoss(
          c,
          { god: i, x: 26, y: 48, t, lunge: 0, roDirection: 0 },
          1,
        );
        return canvas;
      });
      SP.mon[type] = {
        fr: frames,
        white: frames,
        gold: frames,
        red: frames,
        w: 26,
        h: 26,
      };
    });
  };
  RO_SEASON_BOSSES.forEach((b, i) => {
    const god = GODS[i],
      old = MON[god.bt];
    MON[types[i]] = {
      ...old,
      n: b.name,
      hp: [2.6, 2.35, 2.8][i],
      spd: [15, 22, 13][i],
    };
    MON_COLS[types[i]] = [b.color, "#f3e5bd", "#8faaa0"];
    Object.assign(god, {
      n: b.name,
      fr: b.name + "生態印記",
      bn: b.title + "・" + b.name,
      bt: types[i],
      c: b.color,
      ks: [0, 1, 2].map((j) => `ro_eco_${i}_${j}`),
      hn: b.skills[0],
      kn: b.skills[2],
    });
    MON[god.m].n = ["游離孢子", "月芽精靈", "熔礦幼蟲"][i];
    if (ARTS[god.art]) ARTS[god.art].n = b.artifact;
    for (let j = 0; j < 3; j++)
      BOSS_SK[`ro_eco_${i}_${j}`] = {
        t: 1.2,
        c: b.color,
        go: (mob, damage, target) => {
          mob.hold = 0.65;
          toast(`${b.name}：${b.skills[j]}`);
          const spot = (x, y, r, delay, mult = 1) =>
            addHaz({
              x: clamp(x, 7, G.W - 7),
              y: clamp(y, G.top + 7, G.H - 7),
              r,
              t: delay,
              dmg: damage * mult,
              src: mob,
              c: b.color,
              nk: 1,
            });
          if (i === 0) {
            if (j === 0)
              for (let k = 0; k < 6; k++) {
                const a = (k * Math.PI) / 3;
                spot(
                  target.x + Math.cos(a) * 24,
                  target.y + Math.sin(a) * 18,
                  9,
                  1.25,
                  0.65,
                );
              }
            if (j === 1)
              for (let k = 0; k < 3; k++)
                spot(
                  target.x + (k - 1) * 21,
                  target.y,
                  12,
                  1.1 + k * 0.3,
                  0.65,
                );
            if (j === 2)
              for (let k = 0; k < 3; k++)
                addHaz({
                  k: "line",
                  x: mob.x,
                  y: mob.y,
                  x2: target.x + (k - 1) * 23,
                  y2: target.y,
                  w: 6,
                  t: 1.3 + k * 0.16,
                  dmg: damage * 0.65,
                  src: mob,
                  c: b.color,
                });
          } else if (i === 1) {
            if (j === 0)
              for (let k = 0; k < 4; k++)
                spot(
                  target.x + (k - 1.5) * 18,
                  target.y + Math.sin(k * 2) * 14,
                  8,
                  1.15 + k * 0.12,
                  0.6,
                );
            if (j === 1)
              for (const a of [-0.6, 0.6])
                addHaz({
                  k: "line",
                  x: target.x - Math.cos(a) * 55,
                  y: target.y - Math.sin(a) * 40,
                  x2: target.x + Math.cos(a) * 55,
                  y2: target.y + Math.sin(a) * 40,
                  w: 6,
                  t: 1.4,
                  dmg: damage * 0.75,
                  src: mob,
                  c: b.color,
                });
            if (j === 2) {
              spot(mob.x, mob.y, 27, 1.35, 0.8);
              for (let k = 0; k < 4; k++) {
                const a = (k * Math.PI) / 2;
                spot(
                  mob.x + Math.cos(a) * 42,
                  mob.y + Math.sin(a) * 32,
                  10,
                  1.8,
                  0.55,
                );
              }
            }
          } else {
            if (j === 0)
              for (let k = 0; k < 5; k++)
                spot(
                  target.x + (k - 2) * 15,
                  target.y + (k % 2 ? 16 : -16),
                  10,
                  1.2 + k * 0.15,
                  0.65,
                );
            if (j === 1)
              for (let k = 0; k < 3; k++)
                addHaz({
                  k: "line",
                  x: 8,
                  y: target.y + (k - 1) * 27,
                  x2: G.W - 8,
                  y2: target.y + (k - 1) * 27,
                  w: 7,
                  t: 1.25 + k * 0.3,
                  dmg: damage * 0.7,
                  src: mob,
                  c: b.color,
                });
            if (j === 2) {
              spot(mob.x, mob.y, 20, 1.2, 0.8);
              for (let k = 0; k < 8; k++) {
                const a = (k * Math.PI) / 4;
                spot(
                  mob.x + Math.cos(a) * 40,
                  mob.y + Math.sin(a) * 30,
                  9,
                  1.8,
                  0.6,
                );
              }
            }
          }
        },
      };
  });
  const baseDraw = drawMob;
  drawMob = function (c, m) {
    if (m.boss && m.god != null && RO_SEASON_BOSSES[m.god]) {
      const target = foeOf(m) || G.pl;
      m.roDirection = roDirection(Math.atan2(target.y - m.y, target.x - m.x));
      m.roMoving =
        Math.hypot(m.x - (m.roLastX ?? m.x), m.y - (m.roLastY ?? m.y)) > 0.015;
      m.roLastX = m.x;
      m.roLastY = m.y;
      c.save();
      c.globalAlpha = m.spawnT > 0 ? clamp(1 - m.spawnT, 0, 1) : 1;
      if (m.flash > 0) c.globalAlpha *= 0.7;
      roDrawSeasonBoss(c, m, 1);
      c.restore();
      c.fillStyle = "#223543cc";
      c.fillRect(m.x - 18, m.y - 47, 36, 3);
      c.fillStyle = RO_SEASON_BOSSES[m.god].color;
      c.fillRect(m.x - 17.5, m.y - 46.5, 35 * clamp(m.hp / m.max, 0, 1), 2);
      return;
    }
    baseDraw(c, m);
  };
  const oldBoard = ui.seasonBoard;
  ui.seasonBoard = function (...args) {
    let i = 0;
    return (
      oldBoard
        .apply(this, args)
        .replace(
          /(<div class="gfr"><img src=")[^"]+/g,
          (_, prefix) => prefix + roSeasonPortrait(i++ % 3),
        )
        .replaceAll("神之碎片", "生態印記") + roSeasonGuide()
    );
  };
}
function roSeasonGuide() {
  return `<section class="ro-ecology"><h3>荒野回響 · 原創生態首領</h3>${RO_SEASON_BOSSES.map((b, i) => `<article style="--eco:${b.color}"><img src="${roSeasonPortrait(i)}" alt="${b.name}"><div><small>${b.title}</small><b>${b.name}</b><p>${b.habitat}</p><small>${b.skills.join(" · ")}</small></div></article>`).join("")}</section>`;
}
const roSeasonPortraitCache = {};
function roSeasonPortrait(i) {
  if (roSeasonPortraitCache[i]) return roSeasonPortraitCache[i];
  const canvas = document.createElement("canvas");
  canvas.width = 120;
  canvas.height = 120;
  const c = canvas.getContext("2d");
  c.scale(2.5, 2.5);
  roDrawSeasonBoss(
    c,
    { god: i, x: 24, y: 42, t: 0, lunge: 0, roDirection: 0 },
    1,
  );
  return (roSeasonPortraitCache[i] = canvas.toDataURL());
}
function roProgressionInstall() {
  roTreeAddUniques();
  roEnsureStats = roTreeEnsure;
  roPoints = () => {
    roTreeEnsure();
    return roTreeBudget() - roTreeUsed(S.roTree.ranks);
  };
  const collect = collectMods;
  collectMods = function () {
    const mods = collect();
    for (const [id, rank] of Object.entries(S.roTree.ranks)) {
      const n = RO_TREE_NODES[id];
      for (const [s, v] of Object.entries(n.mods || {})) {
        if (s === "more")
          for (const [key, value] of Object.entries(v))
            mods.push({
              s: key,
              v: value * rank,
              src: "共用天賦・" + n.name,
              x: "more",
            });
        else mods.push({ s, v: v * rank, src: "共用天賦・" + n.name });
      }
    }
    return mods;
  };
  roStatsHTML = () => {
    roTreeEnsure();
    return `<section class="ro-stats"><div class="ro-section"><b>基本素質 · 共用天賦</b><span>剩餘 ${roPoints()} 點</span></div><div class="ro-stat-grid">${roStats.map(([k, n, tip], i) => `<div title="${tip}"><span><b>${k}</b> ${n}</span><strong>${S.roStats[i]}</strong></div>`).join("")}</div><button class="btn primary ro-tree-open" data-ro-tree-open>開啟共用天賦樹 <small>終極天賦 ${roTreeUltimates(S.roTree.ranks)} / 2</small></button></section>`;
  };
  MENU.push(["rotree", "共用天賦樹", "mnB"]);
  ui.m_rotree = () =>
    `<h2>共用天賦樹</h2><p>仿 PoE 天賦網的星座圖：48 個星座由素質路徑互相連結，${Object.values(RO_TREE_NODES).filter((x) => x.kind === "notable").length} 個專精、${Object.values(RO_TREE_NODES).filter((x) => x.kind === "junction").length} 個交會與 ${Object.values(RO_TREE_NODES).filter((x) => x.kind === "ultimate").length} 個終極天賦（最多兩個）散落各處，同系列的不會相鄰。另有只強化單一職業技能的「職業獨特天賦」，不佔終極名額。</p><button class="btn primary" data-ro-tree-open>開啟天賦星圖</button>`;
  const list = bagList;
  bagList = function () {
    const mode = bagOpt().roBetter;
    let items = list();
    if (mode)
      items = items.filter((it) => {
        const a = roGearAdvice(it);
        return mode === "attack"
          ? a.attack
          : mode === "defense"
            ? a.defend
            : a.good;
      });
    return items;
  };
  const bag = ui.p_bag;
  ui.p_bag = function () {
    let html = bag.call(this);
    if ((this.bagView || "items") === "items")
      html = html.replace(
        '<section class="ro-inventory">',
        `<section class="ro-inventory"><div class="ro-upgrade-filter"><label>裝備建議 <select data-ro-better aria-label="較好的裝備篩選">${[
          ["", "全部裝備"],
          ["good", "較好的裝備・建議更換"],
          ["attack", "建議更換・輸出提升"],
          ["defense", "建議更換・生存提升"],
        ]
          .map(
            ([v, n]) =>
              `<option value="${v}" ${bagOpt().roBetter === v ? "selected" : ""}>${n}</option>`,
          )
          .join(
            "",
          )}</select></label><small>依目前配裝、技能和可穿戴等級比較</small></div>`,
      );
    return html;
  };
  const detail = ui.detailHtml;
  ui.detailHtml = function () {
    const html = detail.call(this),
      t = findItem(this.sel);
    return t?.where === "bag"
      ? html.replace('<div class="acts">', roAdviceHtml(t.it) + '<div class="acts">')
      : html;
  };
  const compare = ui.cmpOpen;
  ui.cmpOpen = function (uid) {
    compare.call(this, uid);
    const item = findItem(uid)?.it;
    if (item)
      $("#sheet .ro-compare-delta")?.insertAdjacentHTML(
        "afterbegin",
        roAdviceHtml(item),
      );
  };
  rollKillDrops = function (elite) {
    const drops = [],
      q = slateQty();
    if (RAND() < Math.min(1, (elite ? 0.35 : 0.05) * q))
      drops.push(elite ? { rw: [30, 40, 24, 6] } : {});
    if (elite && RAND() < Math.min(1, 0.08 * q)) drops.push({});
    return drops;
  };
  roInstallSeason();
  roTreeInstallPan();
  document.addEventListener("change", (e) => {
    if (e.target.matches("[data-ro-better]")) {
      bagOpt().roBetter = e.target.value;
      ui.bagN = 60;
      ui.bagTop = 0;
      markDirty();
      ui.render();
      saveNow();
    }
  });
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-ro-tree-open]")) {
      roTreeOpen();
      return;
    }
    const node = e.target.closest("[data-ro-node]");
    if (node) {
      roTreeSelected = node.dataset.roNode;
      roTreeRender();
      $('#sheet [data-ro-node="' + CSS.escape(roTreeSelected) + '"]')?.focus({
        preventScroll: true,
      });
      return;
    }
    const action = e.target.closest("[data-ro-tree]")?.dataset.roTree;
    if (action) roTreeAction(action);
  });
  document.addEventListener("keydown", (e) => {
    if (
      (e.key === "Enter" || e.key === " ") &&
      e.target.matches("[data-ro-node]")
    ) {
      e.preventDefault();
      roTreeSelected = e.target.dataset.roNode;
      roTreeRender();
    }
  });
}
