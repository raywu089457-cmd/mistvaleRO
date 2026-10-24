/* 流浪仙境 v4 systems, installed from ro-content.js after the RO layer:
   - ascension talents that resonate with each branch's own skills
   - RO-flavoured equipment affixes (six stats, skill damage, MVP damage)
   - uniques that link to skills by mechanic (tags, elements, cooldowns)
   - 無限武鬥場 (endless arena)
   - a starter weapon for every ascension branch
   Per-skill bonuses use the "sk:<skill>:<stat>" / "sp:<support>:pow" mod keys
   handled by gemMods in ro-mutation.js. */
"use strict";

// ---------------------------------------------------------------------------
// Ascension branches: [template, A1, A2, A3, S1, S2, alt [row, col], weapon]
// A = signature active skills, S = signature supports, alt = the template
// talent kept as the second choice of row 2. Weapon = [name, icon, aps×, crit+].
const RO_ASC_SPEC = {
  sword: [
    ["bers", "heavy", "whirl", "thrust", "fury", "mstrike", [0, 1], ["騎士長槍", 1410, 0.95, 2]],
    ["guard", "gcross", "taunt", "guard", "bigarea", "haste", [1, 0], ["聖十字長矛", 1404, 0.9, 0]],
    ["blade", "swave", "leap", "whirl", "mstrike", "fury", [0, 1], ["劍領雙刃", 1151, 1.15, 3]],
    ["elem", "frostsl", "ignite", "fire", "amp", "ailx", [1, 0], ["盧恩符文劍", 1164, 1, 2]],
  ],
  bow: [
    ["snipe", "pierce", "exarrow", "rain", "prec", "mproj", [0, 1], ["獵人長弓", 1704, 0.95, 4]],
    ["venom", "varrow", "rain", "cvul", "pstack", "cot", [1, 1], ["毒蛇之弓", 1707, 1.05, 1]],
    ["ranger", "trap", "iarrow", "pierce", "bigarea", "prec", [0, 1], ["神射十字弩", 1710, 0.9, 3]],
    ["summ", "bsong", "dissonance", "rain", "mcount", "mdmg", [0, 0], ["詩人樂器", 1901, 1.1, 0]],
  ],
  mage: [
    ["elem", "fire", "nova", "chain", "amp", "spread", [1, 0], ["元素魔杖", 1604, 1, 2]],
    ["summ", "summon", "bliz", "chain", "mcount", "mdmg", [0, 0], ["賢者法典", 1550, 1.05, 0]],
    ["hex", "miasma", "cvul", "cwk", "cot", "bigarea", [0, 0], ["咒術骨杖", 1610, 1, 0]],
    ["snipe", "meteor", "bliz", "chain", "prec", "conc", [0, 1], ["大法師秘銀杖", 1601, 0.95, 4]],
  ],
  thief: [
    ["venom", "envenom", "venom", "miasma", "pstack", "cot", [1, 1], ["刺客拳刃", 1250, 1.15, 2]],
    ["ranger", "backstab", "trap", "sonic", "prec", "mstrike", [0, 1], ["流氓短劍", 1201, 1.1, 3]],
    ["blade", "sonic", "backstab", "blink", "mstrike", "multi", [0, 1], ["十字拳刃", 1250, 1.2, 3]],
    ["hex", "backstab", "cvul", "cwk", "multi", "prec", [0, 0], ["魅影匕首", 1207, 1.1, 2]],
  ],
  acolyte: [
    ["snipe", "holy", "sanctuary", "heal", "amp", "mproj", [0, 1], ["祭司聖錘", 1504, 1, 1]],
    ["blade", "combo", "asura", "palm", "mstrike", "prec", [0, 1], ["武僧鐵拳套", 1801, 1.3, 3]],
    ["summ", "angel", "guard", "heal", "mcount", "mdmg", [0, 0], ["神官念珠錘", 1513, 1, 0]],
    ["bers", "asura", "tiger", "palm", "mstrike", "prec", [0, 1], ["修羅拳套", 1801, 1.05, 2]],
  ],
  merchant: [
    ["guard", "cart", "mammonite", "taunt", "bigarea", "mstrike", [1, 0], ["鍛造巨斧", 1357, 0.9, 1]],
    ["summ", "homun", "acid", "faw", "mcount", "mdmg", [0, 0], ["鍊金師之斧", 1351, 1, 0]],
    ["snipe", "faw", "mammonite", "cart", "mproj", "prec", [0, 1], ["機匠工程斧", 1354, 1, 3]],
    ["venom", "acid", "miasma", "cart", "pstack", "cot", [1, 1], ["基因腐蝕斧", 1304, 1.05, 1]],
  ],
};
// v4.4: job-appropriate skills for branches whose class lacked one.
function roJobSkillsInstall() {
  roSkill("combo", "thrust", "連打掌", "acolyte", {
    hit: 2.3,
    cd: 2.2,
    d: "向前方連續出掌，每道造成 {hit}% 武器傷害並擊退",
  });
  roSkill("palm", "heavy", "發勁", "acolyte", {
    hit: 4.6,
    cd: 4,
    d: "以內勁貫穿目標，造成 {hit}% 武器傷害",
  });
  roSkill("tiger", "leap", "虎砲", "acolyte", {
    hit: 3.2,
    d: "躍向敵群以虎形拳轟擊，對周圍造成 {hit}% 武器傷害",
  });
  roSkill("angel", "summon", "天使降臨", "acolyte", {
    d: "召喚 2 位小天使，自動搜尋怪物並從遠處發射聖光彈，每發造成 35% 武器傷害並附帶元素異常；天使無敵，陣亡或切換地圖後自動補充",
  });
  roSkill("gcross", "nova", "聖十字審判", "sword", {
    hit: 5,
    cd: 4,
    ail: undefined,
    tg: ["spell", "aoe"],
    d: "以聖十字淨化周圍敵人，造成 {hit}% 武器傷害",
  });
  roSkill("ignite", "whirl", "點燃爆破", "sword", {
    ail: "brn",
    tg: ["aoe", "elem"],
    d: "引爆盧恩之火，對周圍敵人造成 {hit}% 武器傷害並附帶燃燒",
  });
  roSkill("bsong", "summon", "樂靈合奏", "bow", {
    d: "召喚 2 隻樂靈，自動搜尋怪物並從遠處發射音波彈，每發造成 35% 武器傷害並附帶元素異常；樂靈無敵，陣亡或切換地圖後自動補充",
  });
  roSkill("dissonance", "exarrow", "刺耳之聲", "bow", {
    d: "射出不和諧的音波彈，命中時對周圍造成 {hit}% 武器傷害",
  });
  SKILLS.turret.n = "獵鷹召喚"; // the bow class's turret reads as the hunter's falcon
  Object.assign(roSkillIcons, {
    combo: 61, palm: 8, tiger: 7, angel: 13, gcross: 79, ignite: 80, bsong: 74, dissonance: 76, holy: 156,
  });
  const add = (cls, ...ids) => {
    for (const id of ids) if (!CLASS[cls].gems.includes(id)) CLASS[cls].gems.push(id);
  };
  add("acolyte", "combo", "palm", "tiger", "angel");
  add("sword", "gcross", "ignite");
  add("bow", "bsong", "dissonance");
}
const RO_ASC_TITLE = { ro_bow_3: "詩人・合奏" };
// Template talents renamed to fit each job (effects unchanged).
const RO_ASC_RENAME = {
  ro_acolyte_0: { 獵殺: "神罰", 致命一擊: "審判之光", 處刑: "驅魔" },
  ro_acolyte_1: { 流水: "氣功循環", 無盡雙劍格擋: "爆氣", 殘影: "金剛不壞" },
  ro_acolyte_2: { 召喚大軍: "聖靈降臨", 精靈軍團: "天使軍團", 守護之靈: "守護天使" },
  ro_acolyte_3: { 血怒: "修羅血怒" },
  ro_bow_3: { 召喚大軍: "安可", 精靈軍團: "合奏樂團", 守護之靈: "安魂曲" },
  ro_merchant_1: { 召喚大軍: "培育大師", 精靈軍團: "生命體軍團", 守護之靈: "生命體護衛" },
  ro_sword_2: { 無盡雙劍格擋: "劍風亂舞", 殘影: "騎士之魂" },
  ro_sword_3: { 元素大師: "盧恩大師" },
};
const roSkName = (id) => SKILLS[id]?.n || id;
const roSkKind = (id) => {
  const s = SKILLS[id] || {};
  if ((s.tg || []).includes("minion")) return "minion";
  if ((s.tg || []).includes("curse")) return "curse";
  if (id === "heal") return "heal";
  if (id === "taunt") return "taunt";
  if (s.sus) return "sus";
  return "hit";
};
// Row 0: mastery of one signature active.
function roMastery(id) {
  const n = roSkName(id),
    k = roSkKind(id);
  if (k === "curse")
    return [n + "精通", `詛咒效果 +30%；「${n}」冷卻 −30%`, { crs: 0.3, ["sk:" + id + ":cd"]: 0.3 }];
  if (k === "heal")
    return [n + "精通", `「${n}」治癒量 ×1.5、冷卻 −30%`, { ["sk:" + id + ":more"]: 0.5, ["sk:" + id + ":cd"]: 0.3 }];
  if (k === "taunt")
    return [n + "精通", `被嘲諷的敵人受到的傷害 ×1.25；「${n}」冷卻 −30%`, { tntVul: 0.25, ["sk:" + id + ":cd"]: 0.3 }];
  if (k === "minion")
    return [n + "精通", `「${n}」傷害 ×1.4、冷卻 −20%`, { ["sk:" + id + ":more"]: 0.4, ["sk:" + id + ":cd"]: 0.2 }];
  return [n + "精通", `「${n}」傷害 ×1.35、冷卻 −15%`, { ["sk:" + id + ":more"]: 0.35, ["sk:" + id + ":cd"]: 0.15 }];
}
// Row 3: the third active's signature transformation.
function roArcanum(id) {
  const n = roSkName(id),
    k = roSkKind(id);
  if (k === "minion")
    return [n + "奧義", `「${n}」召喚數量 +1、傷害 ×1.3`, { ["sk:" + id + ":minion"]: 1, ["sk:" + id + ":more"]: 0.3 }];
  if (k === "curse")
    return [n + "奧義", `詛咒效果 +25%；受詛咒的敵人死亡時，詛咒轉移至附近 2 個敵人`, { crs: 0.25, crsSpread: 2 }];
  if (k === "heal")
    return [n + "奧義", `「${n}」治癒量 ×1.6；每秒回復最大生命 0.6%`, { ["sk:" + id + ":more"]: 0.6, regenPct: 0.006 }];
  if (k === "taunt")
    return [n + "奧義", `被嘲諷的敵人受到的傷害再 ×1.3；挑釁範圍 +50%`, { tntVul: 0.3, tntR: 0.5 }];
  return [n + "奧義", `「${n}」額外施放 +1、傷害 ×1.25`, { ["sk:" + id + ":extra"]: 1, ["sk:" + id + ":more"]: 0.25 }];
}
// Resonance with a signature support gem.
const RO_COUNT_SUP = { mstrike: "extra", multi: "extra", mproj: "proj", mcount: "minion", chainp: "chn" };
function roResonance(id, strong) {
  const n = roSkName(id);
  if (id === "cot")
    return [n + "共鳴", "冷卻縮減 +10%、技能傷害 +20%（自動念咒觸發更頻繁）", { cdr: 10, skill: 20 }];
  if (RO_COUNT_SUP[id])
    return [
      n + "共鳴",
      `連結「${n}」的技能，${{ extra: "額外施放", proj: "投射物", minion: "召喚數量", chn: "連鎖次數" }[RO_COUNT_SUP[id]]} +1${strong ? "；技能傷害 +15%" : ""}`,
      { ["sp:" + id + ":add"]: 1, ...(strong ? { skill: 15 } : {}) },
    ];
  return [
    n + "共鳴",
    `「${n}」連結時的效果 ×${strong ? "1.8" : "1.6"}`,
    { ["sp:" + id + ":pow"]: strong ? 0.8 : 0.6 },
  ];
}
// ---------------------------------------------------------------------------
// v4.6 職業天賦: 8 rows × 3 choices (one per row), in the spirit of WoW talent
// rows / PoE ascendancies. Rows: 屬性之力・戰鬥風格・輔助共鳴・核心機制・
// 元素屬性・對王專精・生存與機動・專精奧義. Several scale with the RO stats:
// "rsc:<stat>:<key>" adds <key> per stat point, "rscm:<stat>:<key>" adds a
// "more" multiplier per point (see roStatScaleInstall).
const RO_STAT_N = ["力量", "體質", "敏捷", "幸運", "智力", "靈巧"];
// [primary, secondary] stat of each branch.
const RO_ASC_STATS = {
  ro_sword_0: [0, 1], ro_sword_1: [1, 4], ro_sword_2: [0, 2], ro_sword_3: [0, 4],
  ro_bow_0: [5, 2], ro_bow_1: [5, 3], ro_bow_2: [5, 4], ro_bow_3: [5, 4],
  ro_mage_0: [4, 5], ro_mage_1: [4, 5], ro_mage_2: [4, 3], ro_mage_3: [4, 3],
  ro_thief_0: [2, 3], ro_thief_1: [2, 5], ro_thief_2: [2, 0], ro_thief_3: [2, 4],
  ro_acolyte_0: [4, 1], ro_acolyte_1: [0, 2], ro_acolyte_2: [4, 1], ro_acolyte_3: [0, 1],
  ro_merchant_0: [0, 1], ro_merchant_1: [4, 5], ro_merchant_2: [5, 0], ro_merchant_3: [4, 1],
};
// What one point of each stat grants in 屬性之力 (×2 for the primary stat's
// focused option, ×1 elsewhere).
const RO_STAT_EFF = [
  [{ dmgp: 0.6 }, "傷害 +0.6%"],
  [{ lifep: 0.5 }, "最大生命 +0.5%"],
  [{ aspd: 0.4 }, "攻擊速度 +0.4%"],
  [{ crit: 0.08, critm: 0.4 }, "暴擊率 +0.08%、暴擊傷害 +0.4%"],
  [{ skill: 0.6 }, "技能傷害 +0.6%"],
  [{ skill: 0.3, cdr: 0.06 }, "技能傷害 +0.3%、冷卻縮減 +0.06%"],
];
const roScaled = (i, eff, mult = 1) =>
  Object.fromEntries(Object.entries(eff).map(([k, v]) => ["rsc:" + i + ":" + k, +(v * mult).toFixed(3)]));
function roStatTalent(name, i, summ) {
  const [eff, txt] = summ ? [{ minp: 0.8 }, "召喚物傷害 +0.8%"] : RO_STAT_EFF[i];
  return [name, `每 1 點${RO_STAT_N[i]}：${txt}`, roScaled(i, eff)];
}
// Template-specific 專精奧義 (core mechanic, empowered).
const RO_ASC_CORE_ULT = {
  bers: ["狂戰之魂", "每失去 10% 生命，傷害倍率 +6%；擊中吸血 +1%", { lowhp: 0.06, leech: 0.01 }],
  guard: ["不滅堡壘", "被嘲諷的敵人受到的傷害 +20%；受到的傷害 −8%", { tntVul: 0.2, dmgTaken: 0.08 }],
  blade: ["無限氣勢", "氣勢上限 +5 層；每層氣勢傷害倍率再 +1%", { momMax: 5, momDmg: 0.01 }],
  elem: ["元素支配", "元素異常效果 +30%；冰緩中的敵人受到的傷害 +10%；燃燒中的敵人死亡時爆炸（50% 武器傷害）", { ail: 0.3, chlVul: 0.1, ember: 0.5 }],
  snipe: ["絕殺", "暴擊傷害 +40%；對菁英與 Boss 傷害 +10%", { critm: 40, boss: 0.1 }],
  venom: ["萬毒歸宗", "中毒上限 +2 層；中毒跳動頻率 +25%", { psnMax: 2, psnRate: 0.25 }],
  ranger: ["幻影獵手", "暴擊時獲得閃避值 1% 的護盾；陷阱上限 +1、地面效果持續時間 +30%", { critShd: 0.01, trapMax: 1, gndT: 0.3 }],
  summ: ["統帥", "召喚物 +1；召喚物傷害 +20%", { minion: 1, minDmg: 0.2 }],
  hex: ["咒王", "詛咒效果 +25%；每 2 秒，每層詛咒再造成 60% 武器傷害", { crs: 0.25, roHexPulse: 0.6 }],
};
const RO_ASC_EXTRA_SUP = ["haste", "prec", "multi", "fury", "amp", "bigarea", "mstrike", "conc"];
function roAscRows(b, spec, keep, mk) {
  const [tpl, , , , S1, S2, [ar, ac]] = spec,
    cls = b.k.replace(/^ro_|_\d$/g, ""),
    [P, Q] = RO_ASC_STATS[b.k] || [0, 1],
    R3 = P !== 1 && Q !== 1 ? 1 : 3,
    summ = tpl === "summ",
    job = b.n.split("・")[0],
    S3 = RO_ASC_EXTRA_SUP.find((x) => x !== S1 && x !== S2 && CLASS[cls]?.gems.includes(x)) || "haste",
    row = (r, list) => list.map((t, j) => (Array.isArray(t) ? mk(r, j, t) : { ...t, k: b.k + "_" + r + "_" + j })),
    pS = RO_STAT_N[P];
  return [
    // 1 屬性之力
    row(0, [
      [
        `${job}・${pS}專精`,
        `每 1 點${pS}：${summ ? "召喚物傷害 +1.2%" : RO_STAT_EFF[P][1].replace(/[0-9.]+/g, (n) => +(n * 1.5).toFixed(3))}`,
        summ ? roScaled(P, { minp: 1.2 }) : roScaled(P, RO_STAT_EFF[P][0], 1.5),
      ],
      roStatTalent(`${job}・${RO_STAT_N[Q]}之道`, Q, false),
      roStatTalent(`${job}・${RO_STAT_N[R3]}之軀`, R3, false),
    ]),
    // 2 戰鬥風格
    row(1, [
      ["連擊架勢", "普通攻擊擊中時，所有主動技能冷卻 −0.15 秒；攻擊速度 +10%", { roBasicCd: 0.15, aspd: 10 }],
      ["捨身技", "施放主動技能時消耗目前生命的 3%；技能傷害額外 +25%", { roBloodCast: 0.03, more: { skill: 25 } }],
      ["致命節奏", "暴擊率 +5%；暴擊時攻擊速度 +20%，持續 3 秒", { crit: 5, roCritHaste: 0.2 }],
    ]),
    // 3 輔助共鳴
    row(2, [roResonance(S1), roResonance(S2), roResonance(S3)]),
    // 4 核心機制
    row(3, [keep[2][0], keep[2][1], keep[ar][ac]]),
    // 5 元素屬性
    row(4, [
      ["火焰附魔", "技能與普攻擊中時 15% 機率使敵人燃燒；燃燒傷害 +40%；元素技能傷害倍率 +10%", { roElHit_brn: 0.15, brn: 40, "tg:elem:dmg": 0.1 }],
      ["冰霜附魔", "技能與普攻擊中時 15% 機率冰緩敵人；冰緩中的敵人受到的傷害 +10%；元素技能傷害倍率 +10%", { roElHit_chl: 0.15, chlVul: 0.1, "tg:elem:dmg": 0.1 }],
      ["風暴附魔", "技能與普攻擊中時 15% 機率使敵人感電；感電效果 +30%；元素技能傷害倍率 +10%", { roElHit_shk: 0.15, ax_shk: 0.3, "tg:elem:dmg": 0.1 }],
    ]),
    // 6 對王專精
    row(5, [
      ["屠王者", "對菁英與 Boss 傷害 +25%", { boss: 0.25 }],
      ["審判", "對生命 90% 以上的敵人必定暴擊；暴擊傷害 +20%", { fullCrit: 1, critm: 20 }],
      ["不屈戰意", "頭目戰中受到的傷害 −20%；對生命低於 20% 的敵人傷害 +30%", { roBossDR: 0.2, exec: 0.3 }],
    ]),
    // 7 生存與機動
    row(6, [
      ["鋼鐵意志", "受到的傷害 −12%；護甲 +30%", { dmgTaken: 0.12, armorp: 30 }],
      ["生命汲取", "擊中吸血 1.5%；擊殺回復 2% 最大生命", { leech: 0.015, lokp: 0.02 }],
      ["疾風步", "受到攻擊時 25% 機率傷害減半；閃避 +30%；移動速度 +10%", { graze: 0.25, evap: 30, move: 10 }],
    ]),
    // 8 專精奧義
    row(7, [
      summ
        ? [`${pS}之極`, `每 1 點${pS}：召喚物傷害 +1.0%、召喚物攻擊速度 +0.2%`, roScaled(P, { minp: 1.0, minAs: 0.002 })]
        : [`${pS}之極`, `每 1 點${pS}：總傷害額外 +0.4%`, { ["rscm:" + P + ":dmg"]: 0.4 }],
      RO_ASC_CORE_ULT[tpl] || RO_ASC_CORE_ULT.bers,
      summ
        ? [`${job}之道`, `每 1 點${pS}：召喚物傷害 +0.5%；每 1 點${RO_STAT_N[Q]}：${RO_STAT_EFF[Q][1]}；召喚物 +1`, { ...roScaled(P, { minp: 0.5 }), ...roScaled(Q, RO_STAT_EFF[Q][0]), minion: 1 }]
        : [`${job}之道`, `每 1 點${pS}：總傷害額外 +0.2%；每 1 點${RO_STAT_N[Q]}：${RO_STAT_EFF[Q][1]}；技能傷害 +10%`, { ["rscm:" + P + ":dmg"]: 0.2, ...roScaled(Q, RO_STAT_EFF[Q][0]), skill: 10 }],
    ]),
  ];
}
// Total stat i: allocated RO stats plus stat affixes on gear.
let roStatGear = [0, 0, 0, 0, 0, 0];
function roStatTotal(i) {
  return (S?.roStats?.[i] || 0) + (roStatGear[i] || 0);
}
// Talent scaling counts stat points above 40 at half value.
const roStatEff = (v) => (v <= 40 ? v : 40 + (v - 40) * 0.5);
function roStatScaleInstall() {
  const inner = collectMods;
  collectMods = function () {
    const mods = inner();
    roStatGear = RO_STAT_AFFIX.map(([k]) => mods.reduce((n, m) => n + (m.s === k ? m.v : 0), 0));
    const add = [];
    for (const m of mods) {
      if (typeof m.s !== "string" || !m.s.startsWith("rsc")) continue;
      const [kind, i, key] = m.s.split(":");
      if (kind !== "rsc" && kind !== "rscm") continue;
      const v = m.v * roStatEff(roStatTotal(+i));
      add.push(kind === "rscm" ? { s: key, v, src: m.src, x: "more" } : { s: key, v, src: m.src });
    }
    return mods.concat(add);
  };
  // New combat-style / element mechanics.
  TAL_ON.roBasicCd = {
    basicHit: () => {
      const cds = G.pl?.cds;
      if (cds) for (const k in cds) cds[k] -= tal("roBasicCd");
    },
  };
  TAL_ON.roBloodCast = {
    cast: () => {
      if (S.hp > 1) S.hp = Math.max(1, S.hp * (1 - tal("roBloodCast")));
    },
  };
  TAL_ON.roCritHaste = {
    hit: (m, dmg, crit) => {
      if (crit) G.roCritT = G.t + 3;
    },
  };
  SPD_AS.push({ k: "tal:roCritHaste", f: () => (tal("roCritHaste") && G.roCritT > G.t ? 1 + tal("roCritHaste") : 1) });
  for (const el of ["brn", "chl", "shk"])
    TAL_ON["roElHit_" + el] = {
      hit: (m, dmg) => {
        if (alive(m) && RAND() < tal("roElHit_" + el)) ailment(m, el, dmg, 1);
      },
    };
  HURT_MUL.push({ k: "tal:roBossDR", f: () => (tal("roBossDR") && (G.boss || G.trial != null) ? 1 - tal("roBossDR") : 1) });
}
// Talent points: 2 per trial plus 2 at Lv.80 / 100 / 110 / 120 (8 rows × 2).
const RO_ASC_LV_PTS = [80, 100, 110, 120];
function roAscPointsInstall() {
  const ns = newState;
  newState = function (...a) {
    const st = ns(...a);
    if (st.tal) st.tal.v46 = 1; // new characters start on the v4.6 talent rows
    return st;
  };
  const rc = recalc;
  recalc = function () {
    if (S?.tal) {
      S.tal.n = ASC_PT * (S.tal.tr || 0) + 2 * RO_ASC_LV_PTS.filter((l) => S.lvl >= l).length;
      // v4.6 redesign: refund every point once; old row keys no longer match.
      if (S.tal.v46 !== 1) {
        if (S.tal.p?.length) later(1, () => toast("職業天賦已改版：天賦點已全數退還，請重新選擇", "lvl"));
        S.tal.p = [];
        S.tal.v46 = 1;
      }
    }
    return rc();
  };
}
function roAscRedesign() {
  // Rows of each template, taken from the first branch built on it, so a
  // branch can switch template (e.g. 祭司 now uses the 狙殺 rows).
  const src = {};
  const orig = Object.fromEntries(
    Object.entries(RO_ASC_SPEC).map(([cls, specs]) => [cls, specs.map((_, bi) => ASC[cls]?.[bi]?.t)]),
  );
  const ORIG_TPL = { ro_acolyte_0: "elem" };
  for (const [cls, specs] of Object.entries(RO_ASC_SPEC))
    specs.forEach((spec, bi) => {
      const b = ASC[cls]?.[bi],
        tpl = ORIG_TPL[b?.k] || spec[0];
      if (b && !src[tpl]) src[tpl] = orig[cls][bi];
    });
  for (const [cls, specs] of Object.entries(RO_ASC_SPEC))
    specs.forEach((spec, bi) => {
      const b = ASC[cls]?.[bi];
      if (!b) return;
      const [tpl, A1, A2, A3, S1, S2, [ar, ac], wpn] = spec;
      RO_SPEC_KEY.set(spec, b.k);
      const rows = ORIG_TPL[b.k] && ORIG_TPL[b.k] !== tpl ? src[tpl] : b.t,
        keep = rows.map((row) => row.map((t) => ({ ...t, e: { ...t.e } }))),
        mk = (r, j, [n, d, e]) => ({ k: b.k + "_" + r + "_" + j, n, d, e });
      b.tpl = tpl;
      b.core = { A: [A1, A2, A3], S: [S1, S2] };
      b.wpn = wpn;
      b.t = roAscRows(b, spec, keep, mk);
      roAscTune(b, tpl);
      if (RO_ASC_TITLE[b.k]) b.n = RO_ASC_TITLE[b.k];
      const ren = RO_ASC_RENAME[b.k] || {};
      for (const row of b.t) for (const t of row) if (ren[t.n]) t.n = ren[t.n];
      b.d =
        `核心技能：${[A1, A2, A3].map(roSkName).join("、")}｜輔助：${[S1, S2].map(roSkName).join("、")}｜` +
        b.d.replace(/^核心技能：[^｜]*｜輔助：[^｜]*｜/, "");
    });
}
// Balance passes from the 24-branch arena simulation (see 測試與平衡報告).
function roAscTune(b, tpl) {
  const add = (t, e, d) => {
    for (const [k, v] of Object.entries(e))
      if (k === "more") t.e.more = roMergeMods(t.e.more, v);
      else t.e[k] = (t.e[k] || 0) + v;
    t.d += d;
  };
  if (tpl === "hex")
    for (const t of b.t[0]) add(t, { roHexPulse: 1.2 }, "；每 2 秒，每層詛咒造成 120% 武器傷害（最多 3 層）");
  if (tpl === "blade")
    for (const t of b.t[0]) add(t, { momSkill: 1 }, "；技能擊中也會獲得氣勢");
  if (tpl === "bers") add(b.t[3][0], { leech: 0.015 }, "；擊中吸血 1.5%");
  for (const t of b.t[3]) if (tpl === "guard" && t.e.armDmg) add(t, { more: { dmg: -50 } }, "；其他傷害 ×0.5");
  const boost = RO_ASC_BOOST[b.k];
  if (boost)
    for (const t of b.t[0])
      add(
        t,
        boost,
        "；" +
          Object.entries(boost)
            .map(([k, v]) =>
              k === "more" ? `最大生命 ×${(1 + v.life / 100).toFixed(2)}` : `${{ skill: "技能傷害", minp: "召喚物傷害" }[k]} +${v}%`,
            )
            .join("、"),
      );
}
// Branches that trailed the arena simulation get a flat skill-damage lift on row 0.
const RO_ASC_BOOST = {
  ro_sword_2: { skill: 35, more: { life: 25 } },
  ro_bow_2: { skill: 50 },
  ro_mage_2: { skill: 70 },
  ro_bow_3: { skill: 90, minp: 120 },
  ro_sword_1: { skill: 80 },
  ro_thief_3: { skill: 25 },
  ro_acolyte_0: { skill: 20, more: { life: 20 } },
  ro_acolyte_1: { skill: 30, more: { life: 20 } },
  ro_merchant_0: { skill: 75, more: { life: 15 } },
  ro_thief_2: { skill: 15 },
  ro_merchant_1: { minp: 100, more: { life: 20 } },
  ro_merchant_2: { skill: 35, more: { life: 25 } },
};
// Count-type supports gain +N from "sp:<id>:add" (handled here, after gemMods).
function roSupportAddInstall() {
  const inner = gemMods;
  gemMods = function (t) {
    const a = inner(t);
    for (const e of linkedSupports(t)) {
      const add = ROSK["sp:" + e.id + ":add"],
        key = RO_COUNT_SUP[e.id];
      if (add && key) {
        const projOk = (SKILLS[t.id].tg || []).includes("proj");
        if (key === "proj" && !projOk) a.extra += Math.ceil(add / 2);
        else a[key] += add;
      }
    }
    return a;
  };
}

// ---------------------------------------------------------------------------
// Equipment affixes in the spirit of RO gear: six stats, skill-specific damage
// (like RO cards and class gear), and MVP damage. Revive time is de-emphasised.
const RO_STAT_AFFIX = [
  ["rstr", "力量", ["weapon", "gloves", "ring", "helm"]],
  ["rvit", "體質", ["chest", "boots", "helm", "amulet"]],
  ["ragi", "敏捷", ["boots", "gloves", "ring"]],
  ["rluk", "幸運", ["ring", "amulet", "helm"]],
  ["rint", "智力", ["helm", "amulet", "ring"]],
  ["rdex", "靈巧", ["gloves", "ring", "amulet", "weapon"]],
];
function roAffixInstall() {
  for (const [k, n, s] of RO_STAT_AFFIX)
    AFFIX[k] = { n, f: (t) => `+${t} ${n}`, s, w: 45, t: TT(8, 78, [1, 2], [10, 14]) };
  AFFIX.mvp = {
    n: "對頭目傷害",
    f: (t) => `對頭目與菁英怪傷害 +${t}%`,
    s: ["weapon", "ring"],
    w: 40,
    t: TT(8, 78, [5, 8], [25, 32]),
  };
  // One affix per active skill; it only rolls for the class that owns the skill.
  const actives = new Set(
    Object.values(CLASS).flatMap((c) =>
      c.gems.filter(
        (g) =>
          SKILLS[g]?.act &&
          !SKILLS[g].sus &&
          (SKILLS[g].hit || (SKILLS[g].tg || []).includes("minion") || g === "heal"),
      ),
    ),
  );
  for (const id of actives) {
    const slots = ["weapon", "helm", "amulet"];
    AFFIX["skx_" + id] = {
      n: roSkName(id) + (id === "heal" ? "效果" : "傷害"),
      f: (t) => `+${t}% ${roSkName(id)}${id === "heal" ? "治癒量" : "傷害"}`,
      w: 9,
      t: TT(8, 78, [10, 15], [45, 55]),
      skx: id,
    };
    Object.defineProperty(AFFIX["skx_" + id], "s", {
      get: () => (S && CLASS[S.cls]?.gems.includes(id) ? slots : []),
      enumerable: true,
    });
  }
  if (AFFIX.revive) AFFIX.revive.w = 8;
}
// Converts the new affixes into the stats the engine already understands.
const RO_STAT_RATE = [
  [["adddmg", 0.15]],
  [["life", 2.5]],
  [["aspd", 0.35], ["eva", 1]],
  [["crit", 0.12]],
  [["skill", 0.5]],
  [["adddmg", 0.1], ["cdr", 0.08]],
];
function roAffixMods(mods) {
  const out = [];
  for (const m of mods) {
    const si = RO_STAT_AFFIX.findIndex(([k]) => k === m.s);
    if (si >= 0) {
      for (const [s, r] of RO_STAT_RATE[si]) out.push({ s, v: m.v * r, src: m.src });
      continue;
    }
    if (m.s === "mvp") {
      out.push({ s: "boss", v: m.v / 100, src: m.src });
      continue;
    }
    if (typeof m.s === "string" && m.s.startsWith("skx_"))
      out.push({ s: "sk:" + m.s.slice(4) + ":dmg", v: m.v / 100, src: m.src });
  }
  return mods.concat(out);
}

// ---------------------------------------------------------------------------
// Uniques that interact with skills by mechanic (tags, elements, cooldowns),
// never by class name: which class skills they suit is left to players to find.
function roMergeMods(a, b) {
  const out = { ...(a || {}) };
  for (const [k, v] of Object.entries(b || {})) out[k] = (out[k] || 0) + v;
  return out;
}
// Tags a skill counts as for the "tg:<tag>:<stat>" keys (see ro-mutation.js).
let roEcho = false;
function roEchoCast(gem, mult, delay = 0.4) {
  if (roEcho) return;
  later(delay, () => {
    if (!placed().includes(gem) || G.dead) return;
    roEcho = true;
    try {
      castSkill(gem, mult);
    } finally {
      roEcho = false;
    }
  });
}
const roHasTag = (gem, tag) => roSkillTags(gem.id).includes(tag);
// v4.4: the unique set is rebuilt. Every earlier unique (engine originals and
// v4.1 mechanic uniques) is retired: it never drops again and saved copies are
// deleted. 24 new uniques follow the talent-tree routes and ascension
// mechanics: 14 drop from monsters on every map, 6 only in the season map and
// 4 only from 無限武鬥場 boss floors (the last two groups are stronger).
const RO_UQ = {
  // ---- map drops (hi: 0 any level, 1 Lv.60+, 2 Lv.83+) ----
  ro44_warlord: {
    n: "戰神之怒", slot: "weapon", hi: 0, v: [1.2, 30], src: "map",
    mods: (t) => ({ leech: t(0) / 100 }),
    hitMul: (d) => (S.hp < PS.maxhp * 0.5 ? d * (1 + uv("ro44_warlord", 1) / 100) : d),
    d: "擊中吸血 {0}%；自身生命低於 50% 時，造成的傷害 +{1}%",
  },
  ro44_crusader: {
    n: "十字軍聖鎧", slot: "chest", hi: 0, v: [40, 30], src: "map",
    mods: (t) => ({ armorp: t(0), thorn: t(1) / 100 }),
    d: "護甲 +{0}%；受到攻擊時，對攻擊者造成護甲值 {1}% 的傷害",
  },
  ro44_gale: {
    n: "疾風之靴", slot: "boots", hi: 0, v: [12, 15], src: "map",
    mods: (t) => ({ move: t(0), "tg:cdshort:cd": t(1) / 100 }),
    d: "移動速度 +{0}%；冷卻 3 秒以下的技能冷卻 −{1}%",
  },
  ro44_scope: {
    n: "狙擊手護目鏡", slot: "helm", hi: 0, v: [15, 40], src: "map",
    mods: (t) => ({ "tg:proj:crit": t(0), "tg:proj:critm": t(1) }),
    d: "投射物技能暴擊率 +{0}%、暴擊傷害 +{1}%",
  },
  ro44_orb: {
    n: "元素法珠", slot: "amulet", hi: 0, v: [30, 15], src: "map",
    mods: (t) => ({ ail: t(0) / 100, "tg:elem:dmg": t(1) / 100 }),
    d: "元素異常效果 +{0}%；元素技能傷害倍率 +{1}%",
  },
  ro44_pact: {
    n: "契約之戒", slot: "ring", hi: 0, v: [40, 2], src: "map",
    mods: (t) => ({ minp: t(0), minGuard: t(1) / 100 }),
    d: "召喚物傷害 +{0}%；每隻召喚物使你受到的傷害 −{1}%（最多 −60%）",
  },
  ro44_viper: {
    n: "蛇毒手套", slot: "gloves", hi: 0, v: [20, 10], src: "map",
    mods: (t) => ({ psnHit: t(0) / 100, psnVul: t(1) / 100 }),
    d: "普攻與技能擊中時，{0}% 機率使敵人中毒；中毒的敵人受到的傷害 +{1}%",
  },
  ro44_chi: {
    n: "氣功護腕", slot: "gloves", hi: 1, v: [2.5], src: "map",
    mods: (t) => ({ momDmg: t(0) / 100, momSkill: 1 }),
    d: "技能擊中也會獲得氣勢；每層氣勢使傷害倍率 +{0}%",
  },
  ro44_hex: {
    n: "咒縛之冠", slot: "helm", hi: 1, v: [25, 1], vi: [1], src: "map",
    mods: (t) => ({ crs: t(0) / 100, crsSpread: t(1) }),
    d: "詛咒效果 +{0}%；受詛咒的敵人死亡時，詛咒轉移至附近 {1} 個敵人",
  },
  ro44_execute: {
    n: "處刑者之刃", slot: "weapon", hi: 1, v: [40, 15], src: "map",
    mods: (t) => ({ exec: t(0) / 100, boss: t(1) / 100 }),
    d: "對生命低於 20% 的敵人傷害 +{0}%；對菁英與 Boss 傷害 +{1}%",
  },
  ro44_horn: {
    n: "挑戰者號角", slot: "amulet", hi: 1, v: [25, 15], src: "map",
    mods: (t) => ({ tntVul: t(0) / 100, tntDmg: t(1) / 100 }),
    d: "被嘲諷的敵人受到的傷害 +{0}%，對你造成的傷害再 −{1}%",
  },
  ro44_plague: {
    n: "瘟疫之心", slot: "chest", hi: 2, v: [60, 1], vi: [1], src: "map",
    mods: (t) => ({ psnSpread: t(0) / 100, psnMax: t(1) }),
    d: "中毒的敵人死亡時毒爆：造成剩餘毒傷的 {0}% 並傳播中毒；中毒上限 +{1} 層",
  },
  ro44_rune: {
    n: "盧恩之核", slot: "ring", hi: 2, v: [80, 12], src: "map",
    mods: (t) => ({ ember: t(0) / 100, chlVul: t(1) / 100 }),
    d: "燃燒中的敵人死亡時爆炸，造成 {0}% 武器傷害；冰緩中的敵人受到的傷害 +{1}%",
  },
  ro44_legion: {
    n: "軍團戰靴", slot: "boots", hi: 2, v: [1, 20], vi: [0], src: "map",
    mods: (t) => ({ minion: t(0), minAs: t(1) / 100 }),
    d: "召喚物 +{0}；召喚物攻擊速度 +{1}%",
  },
  // ---- season map only ----
  ro44_judge: {
    n: "審判者之劍", slot: "weapon", hi: 2, ss: 1, v: [30], src: "season",
    mods: () => ({ fullCrit: 1 }),
    more: (t) => ({ dmg: t(0) }),
    d: "總傷害額外 +{0}%；對生命 90% 以上的敵人必定暴擊",
  },
  ro44_oracle: {
    n: "神諭之冠", slot: "helm", hi: 2, ss: 1, v: [12, 40], src: "season",
    mods: (t) => ({ cdr: t(0), "tg:cdlong:dmg": t(1) / 100 }),
    d: "冷卻縮減 +{0}%；冷卻 4 秒以上的技能傷害倍率 +{1}%",
  },
  ro44_valk: {
    n: "女武神之鎧", slot: "chest", hi: 2, ss: 1, v: [15, 20], src: "season",
    mods: (t) => ({ dmgTaken: t(0) / 100 }),
    more: (t) => ({ life: t(1) }),
    d: "受到的傷害 −{0}%；最大生命額外 +{1}%",
  },
  ro44_star: {
    n: "星辰之戒", slot: "ring", hi: 2, ss: 1, v: [8, 50], src: "season",
    mods: (t) => ({ crit: t(0) }),
    on: {
      hit: (m, dmg, crit) =>
        crit && alive(m) && dealMob(m, dmg * (uv("ro44_star", 1) / 100), false, "#ffe27a", "uq:ro44_star"),
    },
    d: "暴擊率 +{0}%；暴擊時追加一次 {1}% 傷害的星辰打擊",
  },
  ro44_prism: {
    n: "萬象之手", slot: "gloves", hi: 2, ss: 1, v: [12, 30], src: "season",
    mods: (t) => ({ ail: t(1) / 100 }),
    on: {
      hit: (m, dmg, crit, o) => {
        if (!o || !o.skill || !alive(m) || RAND() >= uv("ro44_prism", 0) / 100) return;
        for (const el of ["brn", "chl", "shk"]) ailment(m, el, dmg, 1);
      },
    },
    d: "技能擊中時，{0}% 機率同時附加燃燒、冰緩與感電；元素異常效果 +{1}%",
  },
  ro44_spring: {
    n: "生命之泉", slot: "amulet", hi: 2, ss: 1, v: [1.2, 3], src: "season",
    mods: (t) => ({ regenPct: t(0) / 100, lokp: t(1) / 100 }),
    d: "每秒回復最大生命 {0}%；擊殺時回復 {1}% 最大生命",
  },
  // ---- 無限武鬥場 boss floors only ----
  ro44_fist: {
    n: "武鬥王之拳", slot: "weapon", hi: 2, v: [3, 20], vi: [1], src: "arena",
    on: {
      kill: () => {
        const r = (G.ro44Fist ||= { n: 0, t: 0 });
        r.n = Math.min(uv("ro44_fist", 1), (G.t < r.t ? r.n : 0) + 1);
        r.t = G.t + 5;
      },
    },
    hitMul: (d) => {
      const r = G.ro44Fist;
      return r && G.t < r.t ? d * (1 + (r.n * uv("ro44_fist", 0)) / 100) : d;
    },
    d: "擊殺時獲得 1 層鬥志（最多 {1} 層，5 秒內沒有擊殺則歸零）；每層傷害 +{0}%",
  },
  ro44_crown: {
    n: "不滅王冠", slot: "helm", hi: 2, v: [35, 1], src: "arena",
    mods: (t) => ({ regenPct: t(1) / 100 }),
    d: "生命低於 35% 時，受到的傷害 −{0}%；每秒回復最大生命 {1}%",
  },
  ro44_champ: {
    n: "冠軍項鍊", slot: "amulet", hi: 2, v: [25, 10], src: "arena",
    mods: (t) => ({ cdr: t(1) }),
    more: (t) => ({ skill: t(0) }),
    d: "技能傷害額外 +{0}%；冷卻縮減 +{1}%",
  },
  ro44_king: {
    n: "王者戰靴", slot: "boots", hi: 2, v: [15, 40], src: "arena",
    mods: (t) => ({ aspd: t(0), move: t(0) }),
    on: { cast: () => (G.ro44King = G.t + 1.5) },
    hitMul: (d) => (G.ro44King && G.t < G.ro44King ? d * (1 + uv("ro44_king", 1) / 100) : d),
    d: "攻擊速度與移動速度 +{0}%；施放主動技能後 1.5 秒內，造成的傷害 +{1}%",
  },
};
const roUqPool = (src, lv) =>
  Object.keys(RO_UQ).filter(
    (k) => RO_UQ[k].src === src && (lv == null || (RO_UQ[k].hi || 0) <= (lv >= 83 ? 2 : lv >= 60 ? 1 : 0)),
  );
function roUniqueInstall() {
  for (const [k, u] of Object.entries(UNIQUE)) if (!u.my) u.retired = 1;
  for (const [k, u] of Object.entries(RO_UQ)) UNIQUE[k] = u;
  // Random unique drops pick only from the new set: season uniques only in
  // the season map (half of its unique drops), arena uniques never at random.
  const make = makeItem;
  makeItem = function (lv, a = {}) {
    if (a.uniq && (!a.uqk || UNIQUE[a.uqk]?.retired)) {
      const pool = a.ss && RAND() < 0.5 ? roUqPool("season") : roUqPool("map", lv);
      a = { ...a, uqk: pool[Math.floor(RAND() * pool.length)] };
    }
    return make(lv, a);
  };
  roBossUnique = (map, mob) => {
    const pool = mob?.god != null ? roUqPool("season") : roUqPool("map", MAPS[map]?.lv?.[1] || S.lvl);
    return pool[Math.floor(RAND() * pool.length)];
  };
  FINAL.uq = roUqPool("map", 99).filter((k) => RO_UQ[k].hi === 2);
  // Distinct RO item icons for the new uniques.
  const icons = {
    ro44_warlord: 1357, ro44_crusader: 2320, ro44_gale: 2405, ro44_scope: 2235, ro44_orb: 2608,
    ro44_pact: 2611, ro44_viper: 2604, ro44_chi: 2605, ro44_hex: 2256, ro44_execute: 1164,
    ro44_horn: 2607, ro44_plague: 2325, ro44_rune: 2602, ro44_legion: 2410, ro44_judge: 1151,
    ro44_oracle: 2228, ro44_valk: 2314, ro44_star: 2603, ro44_prism: 2601, ro44_spring: 995,
    ro44_fist: 1801, ro44_crown: 2234, ro44_champ: 994, ro44_king: 2403,
  };
  for (const [k, id] of Object.entries(icons)) {
    UNIQUE[k].ic = "u_" + k;
    ICONS["u_" + k] ||= ICONS.sw0;
    roItemFiles["u_" + k] = id;
  }
  HURT_MUL.push({
    k: "uq:ro44_crown",
    f: () => (PS.U?.ro44_crown && S.hp < PS.maxhp * 0.35 ? 1 - uv("ro44_crown", 0, PS.U.ro44_crown) / 100 : 1),
  });
}
// Arena boss floors (every 10th) may drop an arena unique; the chance grows
// with the floor reached.
function roArenaUniqueDrop(m) {
  const f = G.tw?.f || 0;
  if (f % 10 || RAND() >= Math.min(0.35, 0.04 + 0.02 * (f / 10))) return;
  const pool = roUqPool("arena"),
    src = m && m.x != null ? m : { x: G.pl.x, y: G.pl.y, lv: S.lvl };
  dropItem({ ...src, lv: Math.max(90, S.lvl) }, { uniq: 1, uqk: pool[Math.floor(RAND() * pool.length)], extra: 1 });
  toast("武鬥場頭目掉落了專屬獨特裝備！", "lvl");
}
// v4.4: delete every retired unique from the bag, equipment and stash.
function roPurgeUniques() {
  if (!S) return;
  const bad = (it) => it && it.uq && !it.my && (!UNIQUE[it.uq] || UNIQUE[it.uq].retired);
  let n = 0;
  const keep = (it) => (bad(it) ? (n++, false) : true);
  if (S.bag) S.bag = S.bag.filter(keep);
  for (const [slot, it] of Object.entries(S.equip || {})) if (bad(it)) (S.equip[slot] = null), n++;
  try {
    const st = STH || stLoad();
    const before = st.it.length;
    st.it = st.it.filter((x) => !bad(x.o));
    if (st.it.length !== before) (n += before - st.it.length), stWrite(st);
  } catch (e) {}
  if (n) later(1, () => toast(`獨特裝備改版：已移除 ${n} 件舊獨特裝備`, "lvl"));
}
// ---------------------------------------------------------------------------
// Starter weapon for each ascension branch (e.g. 武僧 receives knuckles).
function roAscWeapon(b) {
  if (!b?.wpn || !S) return;
  S.roAscWpn ||= {};
  if (S.roAscWpn[b.k]) return;
  S.roAscWpn[b.k] = 1;
  const [name, icon, aps, crit] = b.wpn,
    lv = Math.max(1, S.lvl),
    it = makeItem(lv, { slot: "weapon" });
  it.rar = 0; // a plain, basic weapon: no affixes
  it.af = [];
  if (it.wd) {
    it.wd[2] = +(it.wd[2] * aps).toFixed(2);
    it.wd[3] = (it.wd[3] || 5) + crit;
  }
  const key = "roasc_" + b.k;
  roItemFiles[key] ||= icon;
  ICONS[key] ||= ICONS.sw0;
  it.roIcon = key;
  it.base = name;
  it.name = name;
  it.nw = 1;
  S.bag.push(it);
  toast(`轉職贈禮：獲得基本武器「${name}」，已放入背包`, "lvl");
  markDirty();
}
function roWeaponInstall() {
  const ik = iconKey;
  iconKey = function (t) {
    return t?.roIcon || ik(t);
  };
  for (const specs of Object.values(RO_ASC_SPEC))
    for (const s of specs) {
      const b = Object.values(ASC).flat().find((x) => x.wpn === s[7]);
      if (b) {
        // Fist/katar/book/instrument icons arrive with work/assets-jobs.py;
        // until then use a similar existing icon.
        const id = s[7][1],
          fb = { 1801: 1216, 1250: 1219, 1550: 1601, 1901: 1701 }[id];
        roItemFiles["roasc_" + b.k] = fb && !window.RO_JOB_ASSETS?.items?.[id] ? fb : id;
        ICONS["roasc_" + b.k] ||= ICONS.sw0;
      }
    }
  const ev = stEv;
  stEv = function (t, a) {
    const r = ev(t, a);
    if (t === "asc") roAscWeapon(ascBranch());
    return r;
  };
}

// ---------------------------------------------------------------------------
// v4.5: after ascension, dropped weapons use the branch's weapon type: names,
// RO icons, and the attack-speed / crit adjustment of the starter weapon.
const RO_WB = {
  ro_sword_0: [["長矛", "長槍", "斧槍", "騎士長槍"], [1401, 1404, 1407, 1410]],
  ro_sword_1: [["標槍", "三叉戟", "聖十字長矛", "審判之矛"], [1413, 1416, 1404, 1407]],
  ro_sword_2: [["雙手劍", "斬首大劍", "劍領雙刃", "巨人之劍"], [1116, 1123, 1131, 1151]],
  ro_sword_3: [["軍刀", "彎刀", "符文劍", "盧恩符文劍"], [1107, 1110, 1119, 1164]],
  ro_bow_0: [["短弓", "長弓", "獵人長弓", "獵鷹之弓"], [1701, 1704, 1707, 1708]],
  ro_bow_1: [["複合弓", "毒蛇之弓", "遊俠長弓", "暴風之弓"], [1704, 1707, 1708, 1710]],
  ro_bow_2: [["十字弩", "連弩", "神射十字弩", "鷹眼十字弩"], [1710, 1708, 1710, 1708]],
  ro_bow_3: [["曼陀林", "魯特琴", "豎琴", "詩人樂器"], [1901, 1901, 1901, 1901]],
  ro_mage_0: [["魔杖", "元素魔杖", "火焰法杖", "巫師之杖"], [1601, 1604, 1607, 1610]],
  ro_mage_1: [["魔法書", "元素之書", "賢者法典", "智慧之書"], [1550, 1550, 1550, 1550]],
  ro_mage_2: [["骨杖", "咒術骨杖", "詛咒之杖", "冥界之杖"], [1610, 1607, 1610, 1607]],
  ro_mage_3: [["秘銀杖", "大法師之杖", "星辰法杖", "大法師秘銀杖"], [1604, 1607, 1610, 1601]],
  ro_thief_0: [["拳刃", "雙刃拳刃", "毒蛇拳刃", "刺客拳刃"], [1250, 1250, 1250, 1250]],
  ro_thief_1: [["匕首", "短劍", "大駒短劍", "流氓短劍"], [1201, 1204, 1207, 1213]],
  ro_thief_2: [["拳刃", "迴旋拳刃", "十字拳刃", "刺殺拳刃"], [1250, 1250, 1250, 1250]],
  ro_thief_3: [["影之刃", "暗影匕首", "魅影匕首", "深淵短劍"], [1216, 1219, 1207, 1222]],
  ro_acolyte_0: [["鎚", "流星鎚", "祭司聖錘", "審判之錘"], [1501, 1504, 1507, 1510]],
  ro_acolyte_1: [["拳套", "鐵拳套", "武僧鐵拳套", "阿修羅拳套"], [1801, 1801, 1801, 1801]],
  ro_acolyte_2: [["念珠錘", "聖光錘", "神官念珠錘", "天使之錘"], [1513, 1516, 1513, 1516]],
  ro_acolyte_3: [["皮拳套", "利爪拳套", "修羅拳套", "羅剎拳套"], [1801, 1801, 1801, 1801]],
  ro_merchant_0: [["戰斧", "鍛造巨斧", "雙刃巨斧", "毀滅之斧"], [1351, 1354, 1357, 1357]],
  ro_merchant_1: [["手斧", "鍊金師之斧", "煉成之斧", "賢者之斧"], [1301, 1304, 1351, 1304]],
  ro_merchant_2: [["扳手斧", "機匠工程斧", "動力斧", "魔導齒輪斧"], [1354, 1357, 1354, 1357]],
  ro_merchant_3: [["藥劑斧", "基因腐蝕斧", "強酸之斧", "生命之斧"], [1304, 1301, 1304, 1351]],
};
const RO_JOB_ICON_FB = { 1801: 1216, 1250: 1219, 1550: 1601, 1901: 1701 };
function roBranchWeaponInstall() {
  for (const [k, [, ids]] of Object.entries(RO_WB))
    ids.forEach((id, i) => {
      const key = "rowb_" + k + "_" + i,
        fb = RO_JOB_ICON_FB[id];
      roItemFiles[key] = fb && !window.RO_JOB_ASSETS?.items?.[id] ? fb : id;
      ICONS[key] ||= ICONS.sw0;
    });
  const sb = setBase;
  setBase = function (t, a) {
    sb(t, a);
    const asc = t.slot === "weapon" && S?.tal?.asc,
      wb = asc && RO_WB[asc];
    if (wb) {
      t.base = wb[0][Math.min(3, a)];
      t.roWb = asc;
    }
  };
  const mk = makeItem;
  makeItem = function (lv, a = {}) {
    const it = mk(lv, a);
    if (it && it.roWb && it.wd && !it.roWbAdj) {
      const spec = Object.values(RO_ASC_SPEC)
        .flat()
        .find((sp, i, all) => ASC_KEY_OF(sp) === it.roWb);
      const w = spec?.[7];
      if (w) {
        it.wd[2] = +(it.wd[2] * w[2]).toFixed(2);
        it.wd[3] = (it.wd[3] || 0) + w[3];
      }
      it.roWbAdj = 1;
      if (!it.uq && it.name && it.rar <= 0) it.name = it.base;
    }
    return it;
  };
  const ik = iconKey;
  iconKey = function (t) {
    if (t && t.slot === "weapon" && t.roWb && !t.uq && !t.roIcon && RO_WB[t.roWb])
      return "rowb_" + t.roWb + "_" + Math.min(3, Math.max(0, t.bi ?? 0));
    return ik(t);
  };
}
// Branch key for a RO_ASC_SPEC row (filled in by roAscRedesign).
const RO_SPEC_KEY = new Map();
const ASC_KEY_OF = (spec) => RO_SPEC_KEY.get(spec);

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// v4.6: job skills belong to their ascension branches. Gems outside the
// current branch cannot be placed, are pulled off the board when the branch
// changes, and are not sold or dropped. Supports stay shared by the class.
const RO_JOB_GEMS = {
  asura: ["ro_acolyte_1", "ro_acolyte_3"],
  combo: ["ro_acolyte_1", "ro_acolyte_3"],
  palm: ["ro_acolyte_1", "ro_acolyte_3"],
  tiger: ["ro_acolyte_3"],
  angel: ["ro_acolyte_2"],
  gcross: ["ro_sword_1"],
  ignite: ["ro_sword_3"],
  frostsl: ["ro_sword_3"],
  swave: ["ro_sword_2"],
  bsong: ["ro_bow_3"],
  dissonance: ["ro_bow_3"],
};
function roGemOk(id) {
  const allow = RO_JOB_GEMS[id];
  return !allow || allow.includes(S?.tal?.asc);
}
const roJobNames = (id) =>
  (RO_JOB_GEMS[id] || []).map((k) => Object.values(ASC).flat().find((b) => b.k === k)?.n.split("・")[0]).join("、");
function roGemLockInstall() {
  const cp = canPlace;
  canPlace = function (t, ...a) {
    return roGemOk(t.id) && cp(t, ...a);
  };
  const gn = roGemName;
  roGemName = function (t) {
    return gn(t) + (roGemOk(t.id) ? "" : `（限${roJobNames(t.id)}）`);
  };
  const rc = recalc;
  recalc = function () {
    if (S?.gems) {
      const off = placed().filter((g) => !roGemOk(g.id));
      for (const g of off) (g.x = -1), (g.y = -1);
      if (off.length && G?.pl)
        later(0.5, () => toast(`已拔除不屬於目前職業的技能：${off.map((g) => SKILLS[g.id].n).join("、")}`, "lvl"));
    }
    return rc();
  };
  const mut = makeMutGem;
  makeMutGem = function () {
    for (let i = 0; i < 20; i++) {
      const g = mut();
      if (roGemOk(g.id)) return g;
    }
    return mut();
  };
}

// v4.6: in the season map, boss fights, 無限武鬥場, trials and 無盡之塔 every
// monster is aggressive from the moment it spawns (no waves, no toggle).
function roHostileMode() {
  return !!(G && (G.boss || G.arena || G.tw || G.trial != null || (typeof ssMap === "function" && ssMap())));
}

// v4.5: on ordinary maps monsters walk toward the hero so packs come to you.
// Below Lv.70 only monsters within half a screen are drawn in; from Lv.70 the
// whole map is. Far-away monsters move up to ×1.6 faster while closing in.
function roGatherOn() {
  return (
    S && G && !G.dead && S.set?.roGather !== 0 && !S.set?.psv &&
    !G.arena && !G.tw && !G.boss && !G.trn && !G.trial
  );
}
function roGatherTick(t) {
  if (G && !G.dead && !G.trn && roHostileMode()) {
    const p = G.pl;
    for (const m of G.mobs)
      if (alive(m) && !m.dm && !(m.spawnT > 0)) {
        m.ag = true;
        m.roPulled = 1;
      }
    return roGatherBoost(t, p);
  }
  if (!roGatherOn()) return;
  const p = G.pl,
    dist2 = (m) => Math.hypot(m.x - p.x, m.y - p.y);
  // Pull in waves: at most 3 monsters are chasing / fighting the hero at once
  // (counting ones the map already aggroed); the rest wait their turn.
  // The next wave is pulled only when the current fight is almost over and the
  // hero has at least 70% life, so there is still time to recover.
  const engaged = G.mobs.filter((m) => alive(m) && m.ag && !m.boss).length;
  let room = engaged <= 1 && S.hp >= PS.maxhp * 0.7 ? 3 - engaged : 0;
  const order = G.mobs
    .filter((m) => alive(m) && !m.boss && !m.ag && !m.dm && !(m.spawnT > 0))
    .sort((a, b) => dist2(a) - dist2(b));
  for (const m of order) {
    if (room <= 0) break;
    const reach = (m.lv || S.lvl) < 70 ? Math.max(G.W, 200) * 0.5 : Infinity;
    if (dist2(m) > reach) break;
    m.ag = true;
    m.roPulled = 1;
    room--;
  }
  roGatherBoost(t, p);
}
function roGatherBoost(t, p) {
  const dist2 = (m) => Math.hypot(m.x - p.x, m.y - p.y);
  for (const m of G.mobs) {
    if (!m.roPulled || !alive(m) || m.hold > 0 || m.dash || m.frz > 0 || m.stn > 0 || m.root > 0) continue;
    const d = dist2(m),
      r = (m.ranged || 9) + 12;
    if (d > r + 30) {
      const boost = Math.min(0.6, ((d - r - 30) / 90) * 0.6),
        a = Math.atan2(p.y - m.y, p.x - m.x),
        v = m.spd * boost * t * (m.slow > 0 ? 0.5 : 1);
      m.x += Math.cos(a) * v;
      m.y += Math.sin(a) * v;
      inArena(m);
    }
  }
}
function roGatherInstall() {
  const tk = tick;
  tick = function (t) {
    const r = tk(t);
    try {
      roGatherTick(t);
    } catch (e) {}
    return r;
  };
  const cs = ui.charStats;
  ui.charStats = function (...args) {
    const html = cs.apply(this, args);
    const on = S.set?.roGather !== 0;
    return html.replace(
      /(<span>關閉普通攻擊：只施放技能<\/span><\/label>)/,
      `$1\n      <label class="chk"><input type="checkbox" data-ro-gather ${on ? "checked" : ""}><span>怪物自動靠攏（一般地圖；Lv.70 以下為半個畫面內，Lv.70 以上為整張地圖；消極模式時不作用）</span></label>`,
    );
  };
  document.addEventListener("change", (e) => {
    const box = e.target.closest?.("[data-ro-gather]");
    if (!box || !S) return;
    S.set.roGather = box.checked ? 1 : 0;
    markDirty();
  });
}

// ---------------------------------------------------------------------------
// 無限武鬥場: endless floors on the tower framework. Monsters scale from the
// player's level; HP ×1.08 and damage ×1.05 per floor; every 10th floor is a
// boss; each 10 floors cleared adds one random curse that stays for the run.
const RO_ARENA_CURSES = [
  ["狂暴", "怪物傷害 +20%", { mdmg: 0.2 }],
  ["鋼鐵之膚", "怪物生命 +30%", { mhp: 0.3 }],
  ["疾風", "怪物移動速度 +25%", { mspd: 0.25 }],
  ["沉默", "技能冷卻縮減 −20%", { pmods: { cdr: -20 } }],
  ["詛咒", "生命回復與藥水效果 −40%", { pmods: { pot: -40 }, regenCut: 0.4 }],
  ["石化之觸", "攻擊速度 −15%", { pmods: { aspd: -15 } }],
  ["黑暗", "暴擊率 −15%", { pmods: { crit: -15 } }],
  ["毒霧", "每秒損失 1% 最大生命", { dot: 0.01 }],
  ["庇護", "怪物受到的傷害 −20%", { mdr: 0.2 }],
  ["脆弱", "受到的傷害 +15%", { pmods: { dmgTaken: -0.15 } }],
];
const RO_ARENA = { hp: 1.08, dmg: 1.05, minLv: 30 };
function roArenaOn() {
  return !!G?.tw?.ra;
}
function roArenaCurse(n) {
  const a = G.tw,
    pool = RO_ARENA_CURSES.filter(([name]) => !a.ra.curses.some((c) => c[0] === name));
  const c = (pool.length ? pool : RO_ARENA_CURSES)[ri(0, (pool.length || RO_ARENA_CURSES.length) - 1)];
  a.ra.curses.push(c);
  toast(`無限武鬥場：第 ${n * 10} 層通過，新增負面效果「${c[0]}」— ${c[1]}`, "bad");
  recalc();
}
const roArenaSum = (k) =>
  roArenaOn() ? G.tw.ra.curses.reduce((s, c) => s + (c[2][k] || 0), 0) : 0;
function roArenaStart() {
  if (!S || S.lvl < RO_ARENA.minLv || !canStart()) return;
  const keep = { lv: TW.lv, hp: TW.hp, dmg: TW.dmg };
  enterArena(ARENA.tw);
  G.arena.out = 1e9;
  G.tw = {
    f: 0,
    r: {},
    rl: [],
    t: 0,
    rest: 0,
    ch: 0,
    ra: { curses: [], keep, lv: Math.min(LV_CAP, S.lvl) },
  };
  TW.lv = G.tw.ra.lv;
  TW.hp = RO_ARENA.hp;
  TW.dmg = RO_ARENA.dmg;
  S.roArena ||= { best: 0, runs: 0 };
  S.roArena.runs++;
  recalc();
  twFloor(1);
  markDirty();
  ui.refreshIf("map");
}
function roArenaInstall() {
  const rule = twRule;
  twRule = function (n) {
    if (roArenaOn()) {
      G.tw.nr = n;
      return roArenaCurse(n);
    }
    return rule(n);
  };
  const scale = twScale;
  twScale = function (m) {
    scale(m);
    if (!roArenaOn()) return;
    const hp = 1 + roArenaSum("mhp");
    m.hp = m.max = m.max * hp;
    m.dmg *= 1 + roArenaSum("mdmg");
    m.spd *= 1 + roArenaSum("mspd");
    m.roDr = roArenaSum("mdr");
  };
  const tick = twTick;
  twTick = function (t) {
    if (roArenaOn() && !G.dead) {
      const dot = roArenaSum("dot");
      if (dot) S.hp -= PS.maxhp * dot * t;
      if (S.hp <= 0) S.hp = 1;
    }
    return tick(t);
  };
  const clear = twClear;
  twClear = function (m) {
    if (!roArenaOn()) return clear(m);
    const best = S.tw.best,
      bd = S.tw.bd,
      ms = S.tw.ms;
    S.tw.ms = 1e9; // no tower first-clear rewards inside the arena
    clear(m);
    Object.assign(S.tw, { best, bd, ms });
    S.roArena.best = Math.max(S.roArena.best, G.tw.f);
    roArenaUniqueDrop(m);
  };
  const end = twEnd;
  twEnd = function (why) {
    const ra = G.tw?.ra;
    if (ra) {
      const best = S.tw.best;
      end(why);
      S.tw.best = best;
      Object.assign(TW, ra.keep);
      recalc();
      return;
    }
    return end(why);
  };
  const floor = twFloor;
  twFloor = function (n) {
    const ra = roArenaOn(),
      t0 = toast;
    if (ra) toast = (m, k) => t0(String(m).replace("無盡之塔", "無限武鬥場"), k);
    try {
      return floor(n);
    } finally {
      toast = t0;
    }
  };
  const lines = twLines;
  twLines = function () {
    const l = lines();
    if (roArenaOn()) {
      l[0][0] = "無限武鬥場・" + l[0][0];
      for (const c of G.tw.ra.curses) l.push([`${c[0]}：${c[1]}`, "dg"]);
    }
    return l;
  };
  // Player-side curses.
  const inner = collectMods;
  collectMods = function () {
    const mods = inner();
    if (roArenaOn())
      for (const c of G.tw.ra.curses)
        for (const [s, v] of Object.entries(c[2].pmods || {}))
          mods.push({ s, v, src: "arena:" + c[0] });
    return mods;
  };
  // Monsters with 庇護 take less damage.
  HIT_MUL.push({ k: "arena:dr", f: (d, m) => (m && m.roDr ? d * (1 - m.roDr) : d) });
  // Map tab entry.
  const map = ui.p_map;
  ui.p_map = function (...args) {
    let html = map.apply(this, args);
    const best = S.roArena?.best || 0,
      open = S.lvl >= RO_ARENA.minLv;
    const card = `<section class="ro-arena-card"><h3>無限武鬥場</h3><p class="note">層數無上限・每層怪物生命 ×1.08、傷害 ×1.05・每 10 層為頭目關・每通過 10 層隨機增加一個負面效果（本次挑戰內持續）。</p><div class="row"><span>最高紀錄 <b class="px">${best}</b> 層</span><span class="spacer"></span><button class="btn sm primary" data-ro-arena ${open && canStart() ? "" : "disabled"}>${roArenaOn() ? "挑戰中" : open ? "進入武鬥場" : `Lv.${RO_ARENA.minLv} 開放`}</button></div></section>`;
    return html.replace(/(<h3[^>]*>選擇地圖)/, card + "$1");
  };
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-ro-arena]")) roArenaStart();
  });
}

// ---------------------------------------------------------------------------
// Ascension outfits: work/assets-jobs.py downloads each branch's RO job sprite
// (with its own weapon type) into ro-jobs.js. Without it, the 1st-job look stays.
function roJobsInstall() {
  const data = window.RO_JOB_ASSETS;
  if (!data) return;
  const byBranch = {};
  for (const [key, def] of Object.entries(data.characters || {})) {
    RO.assets.characters[key] = { ...def, lazy: 1 }; // loaded on first use
    byBranch[def.branch] = key;
  }
  const pending = new Set();
  // Use the job atlas once it has loaded; until then keep the 1st-job sprite.
  const ready = (key) => {
    const src = RO.root + RO.assets.characters[key].states.idle.file;
    if (RO.images[src]) return true;
    if (!pending.has(src) && !RO.failed.includes(src)) {
      pending.add(src);
      const im = new Image();
      im.onload = () => (RO.images[src] = im);
      im.onerror = () => RO.failed.push(src);
      im.src = src;
    }
    return false;
  };
  RO.assets.items ||= {};
  for (const [id, def] of Object.entries(data.items || {})) RO.assets.items[id] ||= def;
  for (const [cls, c] of Object.entries(roClass)) {
    const base = c.sprite;
    Object.defineProperty(c, "sprite", {
      get: () => {
        const b = S && S.cls === cls && S.tal?.asc,
          key = b && byBranch[b];
        return key && ready(key) ? key : base;
      },
      configurable: true,
    });
  }
}
function roV4Install() {
  roJobsInstall();
  roJobSkillsInstall();
  if (typeof roV5SkillsInstall === "function") roV5SkillsInstall();
  const ensure = roEnsureStats;
  roEnsureStats = function () {
    if (S && S.roPurged !== 44) {
      roPurgeUniques();
      S.roPurged = 44;
    }
    return ensure();
  };
  roAscRedesign();
  roAscPointsInstall();
  roAffixInstall();
  roUniqueInstall();
  roWeaponInstall();
  roArenaInstall();
  roBranchWeaponInstall();
  roGatherInstall();
  roGemLockInstall();
  roSupportAddInstall();
  // v5: RO equipment, cards and refine (before the stat conversion below).
  if (typeof roV5Install === "function") roV5Install();
  // Affix conversion, then the per-skill scan, wrap last so they see every mod.
  const inner = collectMods;
  collectMods = function () {
    return roAffixMods(inner());
  };
  roStatScaleInstall();
  roSkInstall();
}
