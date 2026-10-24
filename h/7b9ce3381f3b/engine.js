/* 流浪仙境：等級上限 127 */
const LV_CAP = 127;
const BUILD_ID = "ro-local-3",
  BUILD_VER = "流浪仙境 v3.5.1";
("use strict");
let RNGF = Math.random;
const RAND = () => RNGF();
function seeded(t, a) {
  let s = 2166136261;
  for (let a = 0; a < t.length; a++)
    s = Math.imul(s ^ t.charCodeAt(a), 16777619);
  const e = RNGF;
  RNGF = () => {
    s = (s + 1831565813) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    return (
      (t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t),
      ((t ^ (t >>> 14)) >>> 0) / 4294967296
    );
  };
  try {
    return a();
  } finally {
    RNGF = e;
  }
}
const ri = (t, a) => t + Math.floor(RAND() * (a - t + 1)),
  rf = (t, a) => t + RAND() * (a - t),
  clamp = (t, a, s) => (t < a ? a : t > s ? s : t),
  pickW = (t, a) => {
    let s = 0;
    for (const e of t) s += a(e);
    let e = RAND() * s;
    for (const s of t) if (((e -= a(s)), e <= 0)) return s;
    return t[t.length - 1];
  },
  fmt = (t) =>
    t >= 1e12
      ? (t / 1e12).toFixed(1) + "T"
      : t >= 1e9
        ? (t / 1e9).toFixed(1) + "B"
        : t >= 1e6
          ? (t / 1e6).toFixed(1) + "M"
          : t >= 1e4
            ? (t / 1e3).toFixed(1) + "K"
            : Math.round(t).toString(),
  POT_N = 5,
  POT_C = 30,
  SLOTS = ["weapon", "helm", "chest", "gloves", "boots", "ring", "amulet"],
  SLOT_NAME = {
    slate: "石板",
    weapon: "武器",
    helm: "頭盔",
    chest: "胸甲",
    gloves: "手套",
    boots: "鞋子",
    ring: "戒指",
    amulet: "項鍊",
  },
  RAR_NAME = ["普通", "魔法", "稀有", "傳奇", "神話"],
  RAR_AFFIX = [
    [0, 0],
    [1, 1],
    [2, 2],
    [3, 4],
    [7, 7],
  ],
  REQ_GAP = 5,
  reqLv = (t) => Math.max(1, (t.ilvl || 1) - 5),
  canWear = (t) => !!t && (S.lvl >= reqLv(t) || t === WEAR_ANY);
let WEAR_ANY = null;
const UQ_AFFIX = (t) => (t >= 60 ? 4 : t >= 30 ? 3 : 2),
  TT = (t, a, s, e, n = 1e3, l = 100) =>
    Array.from({ length: t }, (o, r) => {
      const i = t > 1 ? r / (t - 1) : 1,
        c = Math.round(s[0] + (e[0] - s[0]) * i),
        d = Math.round(s[1] + (e[1] - s[1]) * i);
      return {
        l: Math.max(1, Math.round(1 + (a - 1) * i)),
        r: [c, Math.max(c, d)],
        w: +(n * Math.pow(l / n, i)).toFixed(1),
      };
    }),
  MOVE_T = [5, 8, 11, 14, 17, 20, 23, 26, 30].map((t, a) => ({
    l: Math.round(1 + (72 * a) / 8),
    r: [t, t],
    w: +(1e3 * Math.pow(0.1, a / 8)).toFixed(1),
  })),
  AFFIX = {
    wadd: {
      n: "附加武器傷害",
      f: (t) => `附加 ${t} 點武器傷害`,
      s: ["weapon"],
      w: 100,
      loc: 1,
      t: TT(8, 73, [2, 4], [44, 56]),
    },
    wdmg: {
      n: "武器傷害%",
      f: (t) => `+${t}% 武器傷害`,
      s: ["weapon"],
      w: 90,
      loc: 1,
      t: TT(10, 78, [16, 24], [110, 130], 1e3, 25),
    },
    waspd: {
      n: "武器攻速",
      f: (t) => `+${t}% 武器攻擊速度`,
      s: ["weapon"],
      w: 60,
      loc: 1,
      t: TT(8, 73, [4, 6], [26, 30]),
    },
    wcrit: {
      n: "武器暴擊率",
      f: (t) => `+${t}% 武器暴擊率`,
      s: ["weapon"],
      w: 55,
      loc: 1,
      t: TT(8, 73, [20, 28], [150, 180]),
    },
    adddmg: {
      n: "附加攻擊傷害",
      f: (t) => `附加 ${t} 點攻擊傷害`,
      s: ["gloves", "ring"],
      w: 100,
      t: TT(8, 73, [1, 2], [20, 26]),
    },
    dmgp: {
      n: "傷害增加",
      f: (t) => `+${t}% 傷害`,
      s: ["gloves", "ring", "amulet", "helm"],
      w: 80,
      t: TT(8, 78, [6, 10], [38, 44], 1e3, 25),
    },
    skill: {
      n: "技能傷害",
      f: (t) => `+${t}% 技能傷害`,
      s: ["weapon", "helm", "amulet"],
      w: 50,
      t: TT(8, 78, [6, 9], [55, 64], 1e3, 25),
    },
    minp: {
      n: "召喚物傷害",
      f: (t) => `+${t}% 召喚物傷害`,
      s: ["weapon", "helm", "amulet", "ring"],
      w: 40,
      t: TT(8, 78, [6, 9], [55, 64]),
    },
    aspd: {
      n: "攻擊速度",
      f: (t) => `+${t}% 攻擊速度`,
      s: ["gloves", "ring"],
      w: 60,
      t: TT(6, 73, [2, 3], [14, 16]),
    },
    act: {
      n: "行動速度",
      f: (t) => `+${t}% 行動速度`,
      s: ["boots", "amulet"],
      w: 35,
      t: TT(9, 78, [1, 2], [17, 20]),
    },
    crit: {
      n: "暴擊率",
      f: (t) => `+${t}% 暴擊率`,
      s: ["ring", "amulet", "helm", "gloves"],
      w: 60,
      t: TT(6, 73, [1, 1], [8, 9]),
    },
    critm: {
      n: "暴擊傷害",
      f: (t) => `+${t}% 暴擊傷害`,
      s: ["weapon", "amulet", "gloves"],
      w: 45,
      t: TT(8, 73, [10, 15], [75, 90]),
    },
    life: {
      n: "最大生命",
      f: (t) => `+${t} 最大生命`,
      s: ["helm", "chest", "gloves", "boots", "ring", "amulet"],
      w: 100,
      t: TT(12, 80, [8, 14], [150, 170], 1e3, 1e3),
    },
    lifep: {
      n: "最大生命%",
      f: (t) => `+${t}% 最大生命`,
      s: ["chest", "amulet", "helm"],
      w: 35,
      t: TT(8, 78, [2, 3], [20, 24], 500, 500),
    },
    armor: {
      n: "護甲",
      f: (t) => `+${t} 護甲`,
      s: ["helm", "chest", "gloves", "boots"],
      w: 100,
      t: TT(12, 80, [8, 16], [200, 230], 1e3, 1e3),
    },
    armorp: {
      n: "護甲%",
      f: (t) => `+${t}% 護甲`,
      s: ["helm", "chest", "gloves", "boots"],
      w: 55,
      t: TT(12, 80, [5, 9], [80, 95], 1e3, 1e3),
    },
    eva: {
      n: "閃避",
      f: (t) => `+${t} 閃避`,
      s: ["helm", "chest", "gloves", "boots"],
      w: 80,
      t: TT(8, 51, [6, 12], [97, 115], 1e3, 50),
    },
    evap: {
      n: "閃避%",
      f: (t) => `+${t}% 閃避`,
      s: ["helm", "chest", "gloves", "boots"],
      w: 45,
      t: TT(8, 51, [5, 9], [53, 63], 1e3, 50),
    },
    regen: {
      n: "生命回復",
      f: (t) => `每秒回復 ${t} 生命`,
      s: ["chest", "ring", "amulet", "boots"],
      w: 60,
      t: TT(9, 78, [1, 2], [24, 28]),
    },
    lok: {
      n: "擊殺回復",
      f: (t) => `擊殺時回復 ${t} 生命`,
      s: ["weapon", "gloves", "ring"],
      w: 50,
      t: TT(8, 73, [1, 3], [40, 52]),
    },
    cdr: {
      n: "冷卻縮減",
      f: (t) => `+${t}% 冷卻縮減`,
      s: ["helm", "amulet", "ring"],
      w: 30,
      t: TT(6, 73, [2, 3], [13, 15]),
    },
    area: {
      n: "技能範圍",
      f: (t) => `+${t}% 技能範圍`,
      s: ["helm", "gloves", "amulet"],
      w: 35,
      t: TT(6, 73, [4, 6], [26, 30]),
    },
    move: {
      n: "移動速度",
      f: (t) => `+${t}% 移動速度`,
      s: ["boots"],
      w: 80,
      t: MOVE_T,
    },
    revive: {
      n: "復活時間縮短",
      f: (t) => `復活時間 -${t}%`,
      s: ["amulet"],
      w: 40,
      t: TT(6, 73, [5, 8], [32, 38]),
    },
    psn: {
      n: "中毒傷害",
      f: (t) => `+${t}% 中毒傷害`,
      s: ["gloves", "amulet"],
      w: 35,
      t: TT(8, 73, [10, 15], [80, 100]),
    },
    brn: {
      n: "燃燒傷害",
      f: (t) => `+${t}% 燃燒傷害`,
      s: ["gloves", "amulet"],
      w: 35,
      t: TT(8, 73, [10, 15], [80, 100]),
    },
    bld: {
      n: "流血傷害",
      f: (t) => `+${t}% 流血傷害`,
      s: ["gloves", "amulet"],
      w: 35,
      t: TT(8, 73, [10, 15], [80, 100]),
    },
    pot: {
      n: "藥水效果",
      f: (t) => `+${t}% 藥水回復量`,
      s: ["amulet", "chest"],
      w: 40,
      t: TT(6, 73, [8, 12], [52, 62]),
    },
  },
  ST = (t, a) =>
    TT(4, 88, t, a, 1e3, 200).map((t, a) => ({ ...t, l: [77, 80, 84, 88][a] }));
Object.assign(AFFIX, {
  sl_hp: {
    n: "怪物生命",
    f: (t) => `怪物生命 +${t}%`,
    s: ["dg"],
    w: 100,
    dg: (t) => 0.4 * t,
    t: ST([10, 15], [55, 70]),
  },
  sl_dmg: {
    n: "怪物傷害",
    f: (t) => `怪物傷害 +${t}%`,
    s: ["dg"],
    w: 100,
    dg: (t) => 0.6 * t,
    t: ST([8, 12], [40, 50]),
  },
  sl_spd: {
    n: "怪物速度",
    f: (t) => `怪物移動速度 +${t}%`,
    s: ["dg"],
    w: 80,
    dg: (t) => t,
    t: ST([5, 8], [25, 30]),
  },
  sl_aggr: {
    n: "怪物主動攻擊",
    f: () => "怪物會主動攻擊",
    s: ["dg"],
    w: 60,
    dg: () => 20,
    t: [{ l: 77, r: [1, 1], w: 1e3 }],
  },
  sl_boom: {
    n: "死亡爆炸",
    f: (t) => `怪物死亡時 ${t}% 機率爆炸`,
    s: ["dg"],
    w: 70,
    dg: (t) => 0.5 * t,
    t: ST([10, 15], [40, 50]),
  },
  sl_eaf: {
    n: "菁英強化",
    f: (t) => `菁英怪額外獲得 ${t} 個菁英詞綴`,
    s: ["dg"],
    w: 50,
    dg: () => 15,
    t: [{ l: 77, r: [1, 1], w: 1e3 }],
  },
  sl_heal: {
    n: "回復降低",
    f: (t) => `你的生命回復 -${t}%`,
    s: ["dg"],
    w: 70,
    dg: (t) => 0.5 * t,
    t: ST([10, 15], [40, 50]),
  },
  sl_shld: {
    n: "怪物護盾",
    f: (t) => `怪物帶有最大生命 ${t}% 的護盾`,
    s: ["dg"],
    w: 70,
    dg: (t) => 0.5 * t,
    t: ST([10, 15], [35, 45]),
  },
  sl_rx: {
    n: "遠程護衛",
    f: () => "每群怪物皆有遠程護衛",
    s: ["dg"],
    w: 50,
    dg: () => 15,
    t: [{ l: 77, r: [1, 1], w: 1e3 }],
  },
  sl_cd: {
    n: "冷卻延長",
    f: (t) => `你的技能冷卻 +${t}%`,
    s: ["dg"],
    w: 60,
    dg: (t) => 0.6 * t,
    t: ST([8, 12], [30, 40]),
  },
});
const GEAR_AF = Object.keys(AFFIX).filter(
  (t) => "slate" !== AFFIX[t].s[0] && "dg" !== AFFIX[t].s[0],
);
for (const t of GEAR_AF)
  AFFIX["rz_" + t] = {
    n: "共鳴・" + AFFIX[t].n,
    f: (a) => `掉落裝備有 ${a}% 機率帶有「${AFFIX[t].n}」`,
    s: ["slate"],
    w: 8,
    rw: 1,
    t: ST([5, 8], [20, 25]),
  };
AFFIX.sl_sock = {
  n: "插槽石板",
  f: (t) => `掉落的石板有 ${(t / 10).toFixed(1)}% 機率為插槽石板`,
  sc: 10,
  s: ["slate"],
  w: 12,
  rw: 1,
  t: ST([10, 15], [29, 33]),
};
const SSL = { n: [2, 3, 4], w: [60, 30, 10], fin: 0.3, k: 1.5 };
((AFFIX.sl_sdrop = {
  n: "石板探尋",
  f: (t) => `石板掉落率 +${t}%`,
  s: ["slate"],
  w: 12,
  rw: 1,
  t: ST([12, 18], [35, 45]),
}),
  (AFFIX.sl_sx = {
    n: "穿梭寶石",
    tip: "穿梭寶石：其他職業的輔助寶石，可連結你職業的主動寶石。",
    f: (t) => `擊殺時 ${(t / 1e3).toFixed(3)}% 機率掉落穿梭寶石`,
    sc: 1e3,
    s: ["slate"],
    w: 8,
    rw: 1,
    t: ST([1, 1], [4, 5]),
  }),
  (AFFIX.sl_mut = {
    n: "變異寶石",
    f: (t) => `擊殺時 ${(t / 100).toFixed(2)}% 機率掉落變異技能寶石`,
    sc: 100,
    s: ["slate"],
    w: 12,
    rw: 1,
    t: ST([2, 3], [8, 10]),
  }));
const MUT = { w: [40, 30, 30], max: 6, e: 5, b: 50, ash: 100, fn: 3, fc: 1e3 };
for (const t of SLOTS)
  AFFIX["rs_" + t] = {
    n: "偏向・" + SLOT_NAME[t],
    f: (a) => `${SLOT_NAME[t]}掉落機率 +${a}%`,
    s: ["slate"],
    w: 25,
    rw: 1,
    t: ST([130, 195], [455, 585]),
  };
((AFFIX.sl_rup = {
  n: "稀有度提升",
  f: (t) => `掉落裝備有 ${t}% 機率提升一級稀有度（最高傳奇）`,
  s: ["slate"],
  w: 12,
  rw: 1,
  t: ST([5, 8], [20, 25]),
}),
  (AFFIX.sl_tup = {
    n: "詞綴提升",
    f: (t) => `掉落裝備有 ${t}% 機率一條詞綴提升一階`,
    s: ["slate"],
    w: 15,
    rw: 1,
    t: ST([8, 12], [30, 40]),
  }));
const isSlateAf = (t) => "slate" === AFFIX[t].s[0] || "dg" === AFFIX[t].s[0],
  DG_N = [30, 45, 25],
  SL_BOOM = { r: 18, t: 1.1, k: 2.5, adg: 1 },
  SL_HEAL_MIN = 0.1,
  ARMOR_PER = 20,
  EVA_PER = 15,
  DEF_CAP = 75,
  CAST_MAX = 3,
  DEF_LINE = 4,
  affixPool = (t) =>
    Object.keys(AFFIX).filter(
      (a) => AFFIX[a].s.includes(t) && null == AFFIX[a].dv,
    ),
  tierN = (t) => AFFIX[t].t.length,
  tierOf = (t, a) => AFFIX[t].t[tierN(t) - a],
  T0_MUL = 1.25,
  tierRange = (t, a) =>
    a ? tierOf(t, a).r : tierOf(t, 1).r.map((t) => Math.round(1.25 * t)),
  tierQ = (t) => (tierN(t.a) > 1 ? (tierN(t.a) - t.t) / (tierN(t.a) - 1) : 1),
  MATS = {
    x1: { n: "神秘金屬 Lv1", f: "x", l: 1 },
    x2: { n: "神秘金屬 Lv2", f: "x", l: 2 },
    x3: { n: "神秘金屬 Lv3", f: "x", l: 3 },
    x4: { n: "神秘金屬 Lv4", f: "x", l: 4 },
    p1: { n: "低階保護石", f: "p", l: 1 },
    p2: { n: "高階保護石", f: "p", l: 3 },
    i1: { n: "鋁 Lv1", f: "i", l: 1 },
    i2: { n: "鋁 Lv2", f: "i", l: 2 },
    i3: { n: "鋁 Lv3", f: "i", l: 3 },
    i4: { n: "鋁 Lv4", f: "i", l: 4 },
    s1: { n: "封印石", f: "s", l: 3 },
    r1: { n: "磨礪石", f: "r", l: 3 },
    c1: { n: "腐化石", f: "c", l: 3 },
    m1: { n: "奇蹟石", f: "m", l: 3 },
    h1: { n: "洗鍊石", f: "h", l: 3 },
  },
  MAT_COL = {
    x: "#ffb347",
    p: "#7ad4ff",
    i: "#c080ff",
    s: "#6ae0a0",
    r: "#ff7a9a",
    c: "#d0407e",
    m: "#e8f0ff",
    h: "#3ec8b4",
  },
  PROT_KEEP = { p1: 10, p2: 25 },
  XTR = {
    ok: [0, 50, 100, 100, 100],
    uq: [0, 0, 0, 5, 5],
    up: [0, 0, 0, 0, 25],
  },
  MIR = { cor: 0.5 },
  MIR_COL = "#e8f0ff",
  ALCH_MAP = 2,
  OFF_RATE = 0.25,
  OFF_KPM = 250,
  OFF_XP = 0.75,
  ALCH_ASH = {
    x: (t) => Math.round(5 + 0.5 * t),
    i: (t) => 10 + t,
    r: (t) => 10 + t,
    f: (t) => 30 + 2 * t,
    c: (t) => 20 + t,
    m: (t) => 40 + 2 * t,
    h: (t) => 10 + t,
  },
  MERGE = [
    ["x1", "x2"],
    ["x2", "x3"],
    ["x3", "x4"],
    ["i1", "i2"],
    ["i2", "i3"],
    ["p1", "p2"],
  ],
  MERGE_N = 4,
  mergeAsh = (t) => 25 * 2 ** (("p2" === t ? 2 : MATS[t].l) - 2),
  CRAFT = {
    x: { n: "神秘金屬", max: 4, c: (t) => 20 + t },
    i: { n: "鋁", max: 3, c: (t) => 40 + 2 * t },
  },
  matLv = (t, a) => {
    const s = RAND(),
      e = t >= 70 ? 0.02 : 0,
      n = e + (t >= 55 ? 0.05 : 0),
      l = n + (t >= 30 ? 0.15 : 0);
    return Math.min(a, s < e ? 4 : s < n ? 3 : s < l ? 2 : 1);
  },
  matOdds = (t, a) => {
    const s = [0, 0, t >= 30 ? 15 : 0, t >= 55 ? 5 : 0, t >= 70 ? 2 : 0];
    for (let t = 4; t > a; t--) ((s[a] += s[t]), (s[t] = 0));
    return ((s[1] = 100 - s[2] - s[3] - s[4]), s);
  },
  BASES = {
    weapon: {
      sword: ["鐵劍", "闊劍", "騎士長劍", "符文巨劍"],
      bow: ["短弓", "獵弓", "複合弓", "星銀長弓"],
      mage: ["木杖", "法杖", "晶石杖", "星辰法杖"],
    },
    helm: [
      "銅盔",
      "鐵盔",
      "騎士盔",
      "秘銀盔",
      "布帽",
      "皮帽",
      "影紋兜帽",
      "月絲頭巾",
    ],
    chest: [
      "銅片甲",
      "鎖子甲",
      "鋼板甲",
      "秘銀板甲",
      "布衣",
      "皮甲",
      "影紋皮衣",
      "月絲長袍",
    ],
    gloves: [
      "銅護手",
      "鐵護手",
      "鋼護手",
      "秘銀護手",
      "布手套",
      "皮手套",
      "影紋手套",
      "月絲手套",
    ],
    boots: [
      "銅靴",
      "鐵靴",
      "鋼靴",
      "秘銀戰靴",
      "布鞋",
      "皮靴",
      "影紋皮靴",
      "月絲靴",
    ],
    ring: ["銅戒", "銀戒", "金戒", "星石戒"],
    amulet: ["骨墜", "銀項鍊", "琥珀項鍊", "星辰護符"],
  },
  WEAPON = {
    sword: { aps: 1.3, a: 6, k: 1.7, c: 8 },
    bow: { aps: 1.22, a: 5.6, k: 1.65, c: 10 },
    mage: { aps: 0.95, a: 6.6, k: 2, c: 9 },
  },
  UQ_P = 0.005,
  BOSS_UQ = 0.15,
  SOCK_P = 0.001,
  UQ_W = [100, 30, 8],
  MYTH_P = 1e-5,
  MYTH_LV = 83,
  I4_P = 1 / 3e4,
  mythKeys = () => [
    ...Object.keys(UNIQUE).filter((t) => UNIQUE[t].my),
    "slate",
  ],
  mythWt = (t) => (UNIQUE[t] && UNIQUE[t].myw) ?? 1,
  mythP = (t) => (MYTH_P * t.reduce((t, a) => t + mythWt(a), 0)) / 2,
  mythPick = (t) => pickW(t, mythWt),
  PUNCH = { r: 14, kb: 30, x: 0.6, gap: 0.12, rng: 30 },
  MYTH_AF = 6,
  MYTH_DG = 4,
  UNIQUE = {
    wolf: {
      n: "犬妖弓",
      slot: "weapon",
      hi: 0,
      v: [4],
      on: {
        kill: () => {
          (G.wolf.push(G.t + 5), G.wolf.length > 10 && G.wolf.shift());
        },
      },
      d: "每次擊殺使攻擊速度 +{0}%，持續 5 秒，最多 10 層",
    },
    road: {
      n: "天使羽翼戰靴",
      slot: "boots",
      hi: 0,
      v: [60],
      mods: (t) => ({ road: t(0) / 100 }),
      d: "附近沒有怪物時，移動速度 +{0}%",
    },
    blood: {
      n: "血之墜飾",
      slot: "amulet",
      hi: 0,
      v: [70, 10],
      lo: [1],
      mods: (t) => ({ revive: t(0) }),
      more: (t) => ({ life: -t(1) }),
      d: "復活時間 -{0}%，最大生命 -{1}%",
    },
    ember: {
      n: "火鱗鎧甲",
      slot: "chest",
      hi: 0,
      v: [8],
      on: {
        hurt: () => {
          for (const t of mobsNear(G.pl.x, G.pl.y, 24))
            dealMob(
              t,
              PS.armor * (uv("ember", 0) / 100) + 1,
              !1,
              void 0,
              "uq:ember",
            );
        },
      },
      d: "受到攻擊時，對周圍敵人造成等同護甲 {0}% 的傷害",
    },
    star: {
      n: "智力耳環",
      slot: "ring",
      hi: 0,
      v: [25],
      on: {
        cast: (t) => {
          RAND() < uv("star", 0) / 100 &&
            later(0.3, () => {
              placed().includes(t) && castSkill(t, 1);
            });
        },
      },
      d: "主動技能施放時，有 {0}% 機率立即再施放一次",
    },
    giant: {
      n: "力量手套",
      slot: "gloves",
      hi: 0,
      v: [30, 12],
      lo: [1],
      mods: (t) => ({ area: t(0), aspd: -t(1) }),
      d: "技能範圍 +{0}%，攻擊速度 -{1}%",
    },
    hush: {
      n: "后冠",
      slot: "helm",
      hi: 0,
      v: [2],
      vi: [0],
      mods: (t) => ({ gridCells: t(0) }),
      d: "技能格子額外解鎖 {0} 格（技能格上限 36 格）",
    },
    twin: {
      n: "雙子星戒指",
      slot: "ring",
      hi: 0,
      v: [50],
      on: {
        hit: (t, a, s) => {
          s &&
            later(0.08, () =>
              dealMob(t, a * (uv("twin", 0) / 100), !0, void 0, "uq:twin"),
            );
        },
      },
      d: "暴擊時追加一次 {0}% 傷害的打擊",
    },
    ovf: {
      n: "黑狐項鍊",
      slot: "ring",
      hi: 1,
      v: [2],
      mods: (t) => ({ critOver: t(0) }),
      d: "暴擊率超過 100% 的部分，每 1% 轉為 +{0}% 暴擊傷害",
    },
    rift: {
      n: "天龍之翼",
      slot: "weapon",
      hi: 1,
      v: [20, 150],
      on: {
        basicHit: (t) => {
          if (RAND() < uv("rift", 0) / 100) {
            const a = "sword" === roArchetype(S.cls) ? G.pl : t;
            shock(a.x, a.y - 3, 20 * PS.area, uv("rift", 1) / 100);
          }
        },
      },
      d: "普通攻擊有 {0}% 機率引發震波，對周圍造成 {1}% 傷害",
    },
    void: {
      n: "惡魔之眼",
      slot: "helm",
      hi: 1,
      v: [40, 25],
      lab: "對 Boss {x1}",
      hitMul: (t, a) => (a.boss ? t * (1 + uv("void", 1) / 100) : t),
      mods: (t) => ({ area: t(0) }),
      d: "技能範圍 +{0}%，對 Boss 傷害 {x1}",
    },
    vamp: {
      n: "吸血蝙蝠斗篷",
      slot: "chest",
      hi: 1,
      v: [2],
      on: { hit: (t, a) => heal(a * (uv("vamp", 0) / 100)) },
      d: "擊中時回復造成傷害的 {0}% 生命",
    },
    sand: {
      n: "時光靈巧飾品",
      slot: "amulet",
      hi: 1,
      v: [20, 10],
      lo: [1],
      mods: (t) => ({ cdr: t(0), act: -t(1) }),
      d: "冷卻縮減 +{0}%，行動速度 -{1}%",
    },
    flesh: {
      n: "生命之甲",
      slot: "chest",
      hi: 0,
      v: [40],
      mods: (t) => ({ armorToLife: t(0) / 100 }),
      d: "不再獲得護甲，原護甲的 {0}% 轉為最大生命",
    },
    gale: {
      n: "時光敏捷戰靴",
      slot: "boots",
      hi: 0,
      v: [20],
      mods: (t) => ({ move: t(0), actFromMove: 1 }),
      d: "移動速度 +{0}%；行動速度改為等於移動速度加成",
    },
    scav: {
      n: "幸運珠鏈",
      slot: "ring",
      hi: 0,
      v: [30],
      mods: (t) => ({ dropX: t(0) / 100 }),
      d: "物品掉落數量 +{0}%",
    },
    gland: {
      n: "毒蛇之牙",
      slot: "amulet",
      hi: 0,
      v: [20, 80],
      psnHit: (t) => t(0) / 100,
      mods: (t) => ({ psn: t(1) }),
      d: "擊中時 {0}% 機率使敵人中毒；中毒傷害 +{1}%",
    },
    thirst: {
      n: "獸人英雄頭具",
      slot: "helm",
      hi: 0,
      v: [3],
      mods: { noRegen: 1 },
      on: { hit: (t, a) => heal(a * (uv("thirst", 0) / 100)) },
      d: "不再自然回復生命；擊中時回復造成傷害的 {0}% 生命",
    },
    phase: {
      n: "幽靈手套",
      slot: "gloves",
      hi: 1,
      v: [30],
      on: {
        dodge: () => {
          const t = G.pl;
          if (G.t - (t.phT ?? -9) >= 1) {
            t.phT = G.t;
            for (const a in t.cds) t.cds[a] = 0;
            G.flashes.push({ x: t.x, y: t.y - 6, t: 0, ring: 1, c: "#9ad8ff" });
          }
        },
      },
      mods: (t) => ({ evap: t(0) }),
      d: "閃避值 +{0}%；閃避攻擊時重置所有技能冷卻（每秒最多一次）",
    },
    fang: {
      n: "刺殺拳刃",
      slot: "weapon",
      hi: 1,
      v: [50],
      psnHit: 1,
      on: {
        dealt: (t) => {
          !t.psn && t.hp < 1 && (t.hp = 1);
        },
      },
      mods: (t) => ({ psn: t(0) }),
      d: "擊中必定使敵人中毒，中毒傷害 +{0}%；僅能擊殺中毒的敵人（其他敵人生命最低為 1）",
    },
    riftb: {
      n: "死神之鐮",
      slot: "weapon",
      hi: 2,
      v: [10, 3],
      on: { basic: (t) => riftAttack(t) },
      d: "普通攻擊有 {0}% 機率開出裂隙，召喚虛空分身 {1} 秒，複製你的每次普通攻擊",
    },
    reso: {
      n: "風之路標",
      slot: "helm",
      hi: 2,
      v: [6],
      mods: (t) => ({
        skill: t(0) * placed().filter((t) => !SKILLS[t.id].act).length,
      }),
      d: "技能格中每有一顆輔助寶石，技能傷害 +{0}%",
    },
    oath: {
      n: "巴基力鎧甲",
      slot: "chest",
      hi: 2,
      v: [8],
      lo: [0],
      mods: { oath: 1 },
      d: "主動技能冷卻固定為 0.5 秒（不受冷卻縮減與輔助影響），每次施放消耗 {0}% 最大生命（生命不足時不施放）",
    },
    stars: {
      n: "天使之手",
      slot: "gloves",
      hi: 2,
      v: [30],
      mods: (t) => ({ minion: 1, minAs: t(0) / 100 }),
      d: "召喚物數量 +1，召喚物攻擊速度 +{0}%",
    },
    surge: {
      n: "潮汐戰靴",
      slot: "boots",
      hi: 2,
      v: [15],
      mods: (t) => ({ surge: t(0) / 100 }),
      d: "戰鬥中有持續技能時，攻擊速度與移動速度 +{0}%",
    },
    bipol: {
      n: "黑暗之戒",
      slot: "ring",
      hi: 2,
      v: [25],
      lab: "對同時中毒與受詛咒的敵人 {x0}",
      takeMul: (t, a) =>
        a.psn && a.crs && Object.values(a.crs).some((t) => t > 0)
          ? t * (1 + uv("bipol", 0) / 100)
          : t,
      d: "同時中毒與受詛咒的敵人，受到的傷害 {x0}",
    },
    boom: {
      n: "骷髏墜飾",
      slot: "amulet",
      hi: 2,
      v: [15, 15],
      on: {
        kill: (t) => {
          !t.boss &&
            RAND() < uv("boom", 0) / 100 &&
            later(0.08, () => corpseBoom(t));
        },
      },
      d: "擊殺時 {0}% 機率使屍體爆炸，對周圍造成該怪物最大生命 {1}% 的傷害",
    },
    roots: {
      n: "世界樹之戒",
      slot: "ring",
      hi: 3,
      v: [20, 100],
      on: {
        kill: (t) => {
          RAND() < uv("roots", 0) / 100 && plantSap(t);
        },
      },
      d: "擊殺時 {0}% 機率長出樹苗（最多 6 棵，持續 20 秒），樹苗以你普攻傷害的 {1}% 攻擊附近敵人；樹苗受召喚物加成",
    },
    magma: {
      n: "火焰戰靴",
      slot: "boots",
      hi: 3,
      v: [30],
      on: {
        hurt: (t) => {
          const a = G.pl;
          ((a.mg = (a.mg || 0) + t * (uv("magma", 0) / 100)),
            a.mgT > 0 || (a.mgT = MAGMA.t));
        },
      },
      d: "受到攻擊時，該次傷害（減傷前）的 {0}% 存入熔核；3 秒後對周圍爆發，造成存量 ×4 的傷害",
    },
    astral: {
      n: "奧丁之心",
      slot: "amulet",
      hi: 3,
      v: [50],
      on: {
        cast: () => {
          (G.orbit.push({ t: ORBIT.t, cd: 0 }),
            G.orbit.length > ORBIT.n && G.orbit.shift());
        },
      },
      d: "每次施放主動技能，獲得 1 顆環繞自身的星辰（最多 6 顆，持續 10 秒），觸及敵人時造成 {0}% 武器傷害的技能傷害",
    },
    fist: {
      n: "鐵拳",
      slot: "weapon",
      hi: 2,
      my: 1,
      myw: 0.1,
      any: 1,
      ic: "myFist",
      by: "我愛 IU",
      v: [100],
      vi: [0],
      mods: { punch: 1 },
      d: "普攻改為隔空砸拳，命中目標周圍小範圍，造成 {0}% 武器傷害。主動技能不會施放（光環除外）。所有輔助寶石都套用到揮拳，可疊加。",
    },
    hh: {
      n: "獸人酋長之戒",
      slot: "ring",
      hi: 2,
      my: 1,
      ic: "myHH",
      help: "hh",
      v: [20],
      vi: [0],
      on: {
        kill: (t) => hhKill(t),
        hit: (t, a, s, e) => hhHit(t, a, e),
        tick: (t) => hhTick(t),
      },
      off: () => {
        G.pl.hb = null;
      },
      d: "擊殺菁英時，獲得牠的菁英詞綴，持續 {0} 秒；不同詞綴可同時生效",
    },
    omni: {
      n: "太陽神頭盔",
      slot: "helm",
      hi: 4,
      v: [20],
      lo: [0],
      link: "all",
      more: (t) => ({ skill: -t(0) }),
      d: "輔助寶石無須相鄰，對技能格中所有符合條件的主動技能皆生效；技能傷害 -{0}%",
    },
    cmd: {
      n: "聖十字權杖",
      slot: "weapon",
      hi: 1,
      mods: { asToMin: 1 },
      d: "召喚物會獲得等同你獲得的攻擊速度加成",
    },
    endb: {
      n: "魔劍士之劍",
      slot: "weapon",
      hi: 4,
      v: [4],
      lo: [0],
      vi: [0],
      mods: { endb: 1 },
      on: { basic: () => endAttack() },
      d: "主動技能不再自動施放；每 {0} 次普通攻擊，隨機施放 1 個主動技能（無視冷卻，持續技能不受影響）",
    },
    thorn: {
      n: "反擊之盾鎧",
      slot: "chest",
      hi: 1,
      v: [2e3],
      mods: { fixedHit: 1 },
      hitPost: (t, a, s) => (s.base ? t : 1),
      on: {
        hurtPre: (t, a) => {
          a && thornHit(a, PS.armor * (uv("thorn", 0) / 100), "uq:thorn");
        },
      },
      d: "擊中傷害固定為 1（血之渴望除外）；敵人攻擊你時（含閃避），受到等同護甲 {0}% 的反傷，套用傷害加成",
    },
    gore: {
      n: "邪靈鎖鏈",
      slot: "amulet",
      hi: 1,
      v: [50],
      mods: (t) => ({ dotCrit: t(0) / 100 }),
      d: "流血、燃燒、中毒的每跳傷害皆可暴擊，套用你的暴擊率；暴擊傷害加成僅計算 {0}%",
    },
    snare: {
      n: "獵人長靴",
      slot: "boots",
      hi: 1,
      v: [40, 1],
      vi: [1],
      mods: (t) => ({ gndT: t(0) / 100, trapMax: t(1) }),
      d: "地面效果（陷阱、裂縫、暴風雪、熔岩、樹苗）持續時間 +{0}%，定位陷阱上限 +{1}",
    },
    pyre: {
      n: "魔法外套",
      slot: "chest",
      hi: 1,
      v: [3],
      on: { hit: (t, a, s, e) => pyreHit(t, a, e) },
      d: "範圍技能擊中時，在命中處留下熔岩 {0} 秒（每 2 秒最多 1 次）；熔岩上的敵人持續燃燒",
    },
    frostc: {
      n: "冰之王冠",
      slot: "helm",
      hi: 1,
      v: [40, 1.5],
      lab: "對凍結的敵人 {x0}",
      takeMul: (t, a) => (a.frz > 0 ? t * (1 + uv("frostc", 0) / 100) : t),
      on: { hit: (t, a, s, e) => frostHit(t, e) },
      d: "擊中時使敵人獲得 1 層寒霜（每層減速 10%）；疊滿 5 層時凍結 {1} 秒：無法移動與攻擊，受到的傷害 {x0}",
    },
    crsr: {
      n: "咒術師之戒",
      slot: "ring",
      hi: 1,
      mods: { crsRing: 1 },
      d: "技能拼圖中的詛咒改為光環：持續對你周圍的敵人生效，不再施放",
    },
    trigd: {
      n: "迴聲之戒",
      slot: "ring",
      hi: 1,
      v: [30],
      mods: (t) => ({ trigFull: 1, trigCd: t(0) / 100 }),
      d: "自動念咒的技能不再降低傷害，觸發間隔 -{0}%",
    },
    echo: {
      n: "聖母祈福手套",
      slot: "gloves",
      hi: 1,
      v: [2],
      vi: [0],
      mods: (t) => ({ chnRe: 1, chnN: t(0) }),
      d: "連鎖增幅的投射物可彈回已擊中過的敵人；彈射次數 +{0}",
    },
  };
function uv(t, a, s = (PS && PS.U[t]) || 1) {
  const e = UNIQUE[t],
    n = e.v[a];
  if (1 === s) return n;
  const l = e.lo && e.lo.includes(a) ? n / s : n * s;
  return e.vi && e.vi.includes(a) ? Math.max(1, Math.round(l)) : l;
}
const uvFmt = (t) => {
    const a = Math.round(10 * t) / 10;
    return String(a);
  },
  uqText = (t, a = 1, s = UNIQUE[t].d) =>
    s.replace(/\{(x?)(\d)\}/g, (s, e, n) =>
      e ? "×" + Math.round(100 + uv(t, +n, a)) / 100 : uvFmt(uv(t, +n, a)),
    ),
  TAG = {
    aoe: "範圍",
    proj: "投射物",
    spell: "法術",
    psn: "中毒",
    curse: "詛咒",
    minion: "召喚",
    elem: "元素",
    bld: "流血",
    trap: "陷阱",
    chn: "連鎖增幅",
  },
  tagText = (t) =>
    t.act
      ? t.aura
        ? "光環・不受輔助"
        : (t.sus ? "持續・" : "") +
          (t.tg.length ? t.tg.map((t) => TAG[t]).join("・") : "無標籤")
      : t.req
        ? "限" +
          []
            .concat(t.req)
            .map((t) => TAG[t])
            .join("／")
        : "不限標籤",
  supFits = (t, a) => {
    const s = SKILLS[a],
      e = SKILLS[t];
    return (
      !s.aura && (a !== 'heal' || ['haste','multi','amp','sacr','cot'].includes(t)) &&
      !(s.sus && e.cast) &&
      (!e.req || [].concat(e.req).some((t) => s.tg.includes(t))) &&
      (!e.not || !s.tg.includes(e.not))
    );
  },
  SKILLS = {
    heavy: {
      cls: "sword",
      act: 1,
      hit: 4.2,
      tg: [],
      n: "狂擊",
      cd: 4,
      shape: [
        [0, 0],
        [1, 0],
      ],
      col: "#e86a4a",
      d: "對目標造成 {hit}% 武器傷害",
    },
    whirl: {
      cls: "sword",
      act: 1,
      hit: 2.3,
      tg: ["aoe"],
      n: "怪物互擊",
      cd: 6,
      shape: [
        [0, 0],
        [-1, 0],
        [1, 0],
        [0, 1],
      ],
      col: "#e8a64a",
      d: "對周圍所有敵人造成 {hit}% 武器傷害",
    },
    fury: {
      cls: "sword",
      act: 0,
      n: "狂怒",
      shape: [
        [0, 0],
        [1, 0],
        [0, 1],
      ],
      col: "#c94040",
      d: "相鄰的主動技能傷害 +50%",
      mod: { dmg: 0.5 },
    },
    haste: {
      cls: "sword",
      act: 0,
      cast: 1,
      n: "加速術",
      shape: [
        [0, 0],
        [0, 1],
      ],
      col: "#4ac0a0",
      d: "相鄰的主動技能冷卻 -30%",
      mod: { cd: 0.3 },
    },
    pierce: {
      cls: "bow",
      act: 1,
      hit: 2.8,
      tg: ["proj"],
      n: "二連矢",
      cd: 3,
      shape: [
        [0, 0],
        [1, 0],
        [2, 0],
      ],
      col: "#9ad95a",
      d: "射出貫穿直線上所有敵人的箭，造成 {hit}% 武器傷害",
    },
    rain: {
      cls: "bow",
      act: 1,
      hit: 1.15,
      est: (t) => SKILLS.rain.hit * (4 + t.proj),
      tg: ["aoe", "proj"],
      n: "箭雨",
      cd: 7,
      shape: [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ],
      col: "#5ab0d9",
      d: "在怪物最密集處降下 4 波箭雨，每波 {hit}% 武器傷害",
    },
    multi: {
      cls: "bow",
      act: 0,
      cast: 1,
      n: "連續射擊",
      shape: [
        [0, 0],
        [1, 0],
        [2, 0],
        [1, 1],
      ],
      col: "#d9c45a",
      d: "相鄰的主動技能額外施放 1 次（60% 傷害）；召喚技能改為召喚物每次攻擊多攻擊 1 次",
      mod: { extra: 1 },
    },
    prec: {
      cls: "bow",
      act: 0,
      n: "心神凝聚",
      shape: [
        [0, 0],
        [1, 0],
        [1, 1],
      ],
      col: "#d95a9a",
      d: "相鄰的主動技能暴擊率 +30%、暴擊傷害 +50%",
      mod: { crit: 30, critm: 50 },
    },
    fire: {
      cls: "mage",
      act: 1,
      hit: 2.4,
      est: (t, a, s) =>
        3 +
        SKILLS.fire.hit *
          AIL.brn.v *
          a.brn *
          a.ail *
          (1 + t.ail) *
          Math.min(AIL.brn.t * a.ail * (1 + t.ail), s),
      tg: ["proj", "spell", "aoe", "elem"],
      n: "火球術",
      cd: 3,
      shape: [
        [0, 0],
        [1, 0],
        [0, 1],
      ],
      col: "#ff7a3a",
      d: "火球術命中造成 {hit}% 武器傷害，並爆炸造成 {half}% 範圍傷害；使敵人燃燒 3 秒（每秒 15% 命中傷害）",
      ail: "brn",
    },
    nova: {
      cls: "mage",
      act: 1,
      hit: 2,
      tg: ["aoe", "spell", "elem"],
      n: "霜凍之術",
      cd: 6.5,
      shape: [
        [0, 0],
        [-1, 0],
        [1, 0],
        [0, -1],
      ],
      col: "#7ad4ff",
      d: "對周圍造成 {hit}% 武器傷害，並使敵人冰緩 3 秒（移動與攻擊速度 -45%）",
      ail: "chl",
    },
    amp: {
      act: 0,
      req: "elem",
      n: "魔法力增幅",
      shape: [
        [0, 0],
        [1, 0],
      ],
      col: "#b07aff",
      d: "相鄰的主動技能傷害 +45%",
      mod: { dmg: 0.45 },
    },
    spread: {
      act: 0,
      req: "aoe",
      n: "擴散增幅",
      shape: [
        [0, 0],
        [1, 0],
      ],
      col: "#5ad9b0",
      d: "相鄰的主動技能範圍 +40%、傷害 +15%",
      mod: { area: 0.4, dmg: 0.15 },
    },
    thrust: {
      cls: "sword",
      act: 1,
      hit: 1.7,
      tg: ["aoe"],
      n: "連刺攻擊",
      cd: 2.5,
      shape: [
        [0, 0],
        [1, 0],
        [1, 1],
        [2, 1],
      ],
      col: "#e8d24a",
      d: "向前方三個方向突刺，每道造成 {hit}% 武器傷害並擊退",
    },
    mstrike: {
      cls: "sword",
      act: 0,
      cast: 1,
      not: "proj",
      n: "二刀連擊",
      shape: [
        [0, 0],
        [1, 0],
        [1, 1],
      ],
      col: "#e8703a",
      d: "相鄰的主動技能額外打擊 2 次（每次 60% 傷害）；召喚技能改為召喚物每次攻擊多攻擊 2 次；對投射物技能無效",
      mod: { extra: 2 },
    },
    bigarea: {
      act: 0,
      req: "aoe",
      n: "範圍擴展",
      shape: [
        [0, 0],
        [0, 1],
      ],
      col: "#c08a4a",
      d: "相鄰的主動技能範圍 +60%",
      mod: { area: 0.6 },
    },
    varrow: {
      cls: "bow",
      act: 1,
      hit: 1.4,
      est: (t, a, s) =>
        SKILLS.varrow.hit *
        (1 +
          PSN_K *
            Math.min(PSN_T, s * (a.psnMax + t.pstk)) *
            a.psn *
            (1 + (a.T.psnRate || 0))),
      tg: ["proj", "psn"],
      n: "毒箭射擊",
      cd: 2.5,
      shape: [
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 2],
      ],
      col: "#6ad94a",
      d: "射出毒箭造成 {hit}% 武器傷害，並使目標中毒 4 秒（每秒 30% 命中傷害）",
    },
    mproj: {
      act: 0,
      req: "proj",
      n: "多重箭矢",
      shape: [
        [0, 0],
        [1, 0],
        [0, 1],
      ],
      col: "#d9a05a",
      d: "相鄰的主動技能額外射出 2 個投射物，呈扇形散射（箭雨額外 2 波）",
      mod: { proj: 2 },
    },
    taunt: {
      cls: "sword",
      act: 1,
      tg: ["aoe"],
      n: "挑釁",
      cd: 8,
      shape: [
        [0, 0],
        [0, 1],
        [0, 2],
      ],
      col: "#e04a6a",
      d: "嘲諷周圍敵人 4 秒：牠們立刻追擊你，對你造成的傷害 -25%",
    },
    frenzy: {
      cls: "sword",
      act: 1,
      sus: 1,
      aura: 1,
      tg: [],
      n: "狂怒之槍",
      shape: [
        [0, 0],
        [0, 1],
        [1, 1],
      ],
      col: "#b8203a",
      d: "光環：常駐開啟，所有傷害 ×1.35；戰鬥中每秒失去 4% 生命（最低剩 1 點，不會致死）",
    },
    dance: {
      cls: "sword",
      act: 1,
      sus: 1,
      aura: 1,
      tg: [],
      n: "雙劍格擋",
      shape: [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ],
      col: "#6a8aff",
      d: "光環：常駐開啟，普攻擊中獲得 1 層氣勢（最多 10 層），每層攻擊速度 +5%、移動速度 +3%；3 秒未擊中後，每 0.5 秒失去 1 層",
    },
    pstack: {
      act: 0,
      n: "致命塗毒",
      shape: [
        [0, 0],
        [0, 1],
      ],
      col: "#3a9a4a",
      d: "相鄰技能造成的中毒可多疊 2 層（含毒刃等效果造成的中毒）",
      mod: { pstk: 2 },
    },
    ailx: {
      act: 0,
      req: "elem",
      n: "屬性研究",
      shape: [
        [0, 0],
        [1, 0],
        [1, 1],
      ],
      col: "#ff9ad0",
      d: "相鄰技能的元素異常（燃燒/冰緩/感電）效果 +50%、持續時間 +50%",
      mod: { ail: 0.5 },
    },
    cwk: {
      act: 1,
      tg: ["aoe", "spell", "curse"],
      crs: "wk",
      n: "天使之怒",
      cd: 6,
      shape: [
        [0, 0],
        [1, 0],
      ],
      col: "#9a7ad0",
      d: "詛咒目標周圍的敵人 6 秒：牠們造成的傷害 -25%",
    },
    cslw: {
      act: 1,
      tg: ["aoe", "spell", "curse"],
      crs: "sl",
      n: "泥沼地",
      cd: 6,
      shape: [
        [0, 0],
        [1, 0],
      ],
      col: "#5a8ad0",
      d: "詛咒目標周圍的敵人 6 秒：移動與攻擊速度 -30%",
    },
    cvul: {
      act: 1,
      tg: ["aoe", "spell", "curse"],
      crs: "vu",
      n: "弱點詛咒",
      cd: 6,
      shape: [
        [0, 0],
        [1, 0],
      ],
      col: "#d05a9a",
      d: "詛咒目標周圍的敵人 6 秒：受到的傷害 +25%",
    },
    summon: {
      cls: "mage",
      act: 1,
      tg: ["minion", "spell", "elem"],
      n: "召喚元素精靈",
      cd: 1.5,
      shape: [
        [0, 0],
        [0, 1],
        [1, 1],
      ],
      col: "#ffb070",
      d: "召喚 2 隻召喚元素精靈（火、冰、雷輪替），自動搜尋怪物並從遠處發射元素彈，每發造成 35% 武器傷害並附帶燃燒／冰緩／感電；精靈無敵，陣亡或切換地圖後自動補充",
    },
    mcount: {
      act: 0,
      req: "minion",
      n: "生命體增殖",
      shape: [
        [0, 0],
        [1, 0],
        [2, 0],
      ],
      col: "#e0a0ff",
      d: "相鄰召喚技能的召喚物數量 +1",
      mod: { minion: 1 },
    },
    mdmg: {
      act: 0,
      req: "minion",
      n: "生命體強化",
      shape: [
        [0, 0],
        [0, 1],
      ],
      col: "#ffd080",
      d: "相鄰的召喚技能召喚物傷害 +50%、生命 +50%",
      mod: { dmg: 0.5, mlife: 0.5 },
    },
    overk: {
      act: 0,
      req: "proj",
      n: "致命爆裂",
      shape: [
        [0, 0],
        [1, 0],
        [2, 0],
      ],
      col: "#ff6a4a",
      d: "相鄰技能擊殺敵人時，溢出傷害的 80% 轉移至最近的敵人（最多連續 2 次；與貫穿合計最多 100%）",
      mod: { ovk: 0.8 },
    },
    fissure: {
      cls: "sword",
      act: 1,
      hit: 2.2,
      ail: "bld",
      est: (t, a, s) => {
        const e = a.ail * (1 + t.ail);
        return (
          SKILLS.fissure.hit *
          (1 + AIL.bld.v * a.bld * e * Math.min(AIL.bld.t * e, s))
        );
      },
      tg: ["aoe", "bld"],
      n: "大地之擊",
      cd: 4.5,
      shape: [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
      ],
      col: "#d8463a",
      d: "劈開前方的地面，直線上的敵人受到 {hit}% 武器傷害並流血；裂縫持續 3 秒，踏入裂縫的敵人同樣流血",
    },
    leap: {
      cls: "sword",
      act: 1,
      hit: 3,
      tg: ["aoe"],
      n: "百矛穿刺",
      cd: 5,
      shape: [
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 2],
      ],
      col: "#c8a05a",
      d: "躍向附近怪物最密集處重擊地面，周圍敵人受到 {hit}% 武器傷害並被擊退",
    },
    swave: {
      cls: "sword",
      act: 1,
      hit: 2.1,
      tg: ["proj"],
      n: "螺旋擊刺",
      cd: 2.5,
      shape: [
        [0, 0],
        [1, 0],
        [1, 1],
      ],
      col: "#9ad8ff",
      d: "揮出一道劍氣飛向敵人，造成 {hit}% 武器傷害；可搭配多重箭矢、連鎖增幅",
    },
    exarrow: {
      cls: "bow",
      act: 1,
      hit: 0.7,
      est: () => SKILLS.exarrow.hit + EXA.k,
      tg: ["proj", "aoe"],
      n: "銳利射擊",
      cd: 1.2,
      shape: [
        [0, 0],
        [1, 0],
        [2, 0],
        [0, 1],
      ],
      col: "#ff8a3a",
      d: "射出附著於敵人身上的箭，造成 {hit}% 武器傷害；同一敵人累積 5 支（或 4 秒後）同時爆炸，每支對周圍造成 65% 武器傷害",
    },
    trap: {
      cls: "bow",
      act: 1,
      hit: 2.9,
      tg: ["aoe", "trap"],
      n: "定位陷阱",
      cd: 2.5,
      shape: [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
        [2, 1],
      ],
      col: "#b0a070",
      d: "在敵人腳下投出陷阱（最多 3 個，超過時最舊的立即爆炸），敵人觸發時爆炸，周圍敵人受到 {hit}% 武器傷害並定身 1 秒",
    },
    meteor: {
      cls: "mage",
      act: 1,
      hit: 4.8,
      ail: "brn",
      est: (t, a, s) => {
        const e = a.ail * (1 + t.ail);
        return (
          SKILLS.meteor.hit *
          (1 + AIL.brn.v * a.brn * e * Math.min(AIL.brn.t * e, s))
        );
      },
      tg: ["aoe", "spell", "elem"],
      n: "隕石術",
      cd: 7,
      shape: [
        [0, 0],
        [1, 0],
        [2, 0],
        [1, 1],
        [1, 2],
      ],
      col: "#ff6a3a",
      d: "在敵人最密集處標出落點，1.2 秒後隕石術砸下，範圍內敵人受到 {hit}% 武器傷害並燃燒",
    },
    bliz: {
      cls: "mage",
      act: 1,
      hit: 0.65,
      ail: "chl",
      est: () => (SKILLS.bliz.hit * BLZ.t) / BLZ.iv,
      tg: ["aoe", "spell", "elem"],
      n: "暴風雪",
      cd: 6,
      shape: [
        [0, 0],
        [1, 0],
        [1, 1],
        [2, 1],
        [2, 2],
      ],
      col: "#a0e0ff",
      d: "在目標處降下暴風雪 4 秒，每 0.5 秒對範圍內敵人造成 {hit}% 武器傷害並冰緩",
    },
    chainp: {
      act: 0,
      req: ["proj", "chn"],
      n: "連鎖增幅",
      shape: [
        [0, 0],
        [1, 0],
        [1, 1],
        [2, 1],
      ],
      col: "#7ae0d0",
      d: "相鄰技能的投射物擊中後，彈射到附近另一個敵人，最多 2 次；連鎖增幅技能多連鎖增幅 2 個敵人",
      mod: { chn: 2 },
    },
    conc: {
      act: 0,
      req: "aoe",
      n: "集中攻擊",
      shape: [
        [0, 0],
        [0, 1],
      ],
      col: "#e0c06a",
      d: "相鄰的主動技能範圍 -30%、傷害 +40%",
      mod: { area: -0.3, dmg: 0.4 },
    },
    sacr: {
      act: 0,
      cast: 1,
      n: "犧牲祈福",
      shape: [
        [0, 0],
        [1, 0],
        [0, 1],
      ],
      col: "#a01a2a",
      d: "相鄰的主動技能傷害 +60%，但每次施放失去 3% 最大生命（不會致死）",
      mod: { dmg: 0.6, life: 0.03 },
    },
    cot: {
      act: 0,
      cast: 1,
      n: "自動念咒",
      shape: [
        [0, 0],
        [1, 0],
        [2, 0],
        [1, -1],
      ],
      col: "#ffe08a",
      d: "相鄰的主動技能不再自動施放，改為暴擊時觸發（每個技能每 0.5 秒最多 1 次，傷害 -40%）",
      mod: { trig: 1 },
    },
    bpool: {
      cls: "sword",
      act: 1,
      sus: 1,
      stick: (t) => bpoolTick(t),
      sdps: (t, a) => ((t.maxhp * BPOOL.k) / BPOOL.iv) * (1 + a.dmg),
      tg: ["aoe"],
      n: "血之渴望",
      shape: [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 2],
      ],
      col: "#8a1020",
      d: "持續技能：常駐開啟，腳下湧出血之渴望；戰鬥中每秒失去 3% 生命（最低剩 1 點，不會致死），每 0.5 秒對池中敵人造成你最大生命 5% 的技能傷害",
    },
    blink: {
      cls: "sword",
      act: 1,
      hit: 2.2,
      est: (t, a, s) =>
        SKILLS.blink.hit *
        (1 +
          (activeGems().some((t) => "dance" === (SKILLS[t.id]?.roBase || t.id)) ? 0.5 * a.aps * s : 0)),
      tg: [],
      n: "黑暗瞬間",
      cd: 4,
      shape: [
        [0, 0],
        [1, 0],
        [2, 0],
        [2, 1],
      ],
      col: "#c8b0ff",
      d: "瞬間移動到目標身旁斬擊，造成 {hit}% 武器傷害；有氣勢時消耗 1 層，本次不進入冷卻（黑暗瞬間的擊中不會獲得氣勢）",
    },
    turret: {
      cls: "bow",
      act: 1,
      est: (t, a, s) =>
        TUR.k *
        TUR.as *
        a.waps *
        a.minRate *
        (1 + (a.T.minDmg || 0)) *
        Math.min(TUR.n + a.minion + t.minion, TUR.t / s) *
        s,
      tg: ["minion", "proj"],
      n: "FAW 魔導機甲",
      cd: 5,
      shape: [
        [0, 0],
        [0, 1],
        [1, 1],
        [2, 1],
      ],
      col: "#c09050",
      d: "在身旁架起一座FAW 魔導機甲（召喚物，最多 2 座），持續 12 秒，以武器攻速的 80% 射擊附近的敵人，每發 50% 武器傷害；FAW 魔導機甲射擊使用你的暴擊率與暴擊傷害",
    },
    farrow: {
      cls: "bow",
      act: 1,
      hit: 2.2,
      ail: "brn",
      est: (t, a, s) => {
        const e = a.ail * (1 + t.ail);
        return (
          SKILLS.farrow.hit *
          (1 + AIL.brn.v * a.brn * e * Math.min(AIL.brn.t * e, s))
        );
      },
      tg: ["proj", "elem"],
      n: "火焰箭",
      cd: 3,
      shape: [
        [0, 0],
        [1, 0],
        [2, 0],
        [2, -1],
      ],
      col: "#ff7a3a",
      d: "射出火焰箭，造成 {hit}% 武器傷害，並使敵人燃燒 3 秒（每秒 15% 命中傷害）",
    },
    iarrow: {
      cls: "bow",
      act: 1,
      hit: 1.8,
      ail: "chl",
      tg: ["proj", "aoe", "elem"],
      n: "冰凍箭",
      cd: 3,
      shape: [
        [0, 0],
        [1, 0],
        [1, 1],
        [2, 1],
      ],
      col: "#8ad8ff",
      d: "射出冰霜箭，造成 {hit}% 武器傷害並碎裂，周圍敵人受到 {half}% 武器傷害；全部冰緩 3 秒（移動與攻擊速度 -45%）",
    },
    larrow: {
      cls: "bow",
      act: 1,
      hit: 1.8,
      ail: "shk",
      tg: ["proj", "elem"],
      n: "閃電箭",
      cd: 3,
      shape: [
        [0, 0],
        [1, 0],
        [1, -1],
        [2, -1],
      ],
      col: "#f0e05a",
      d: "射出閃電箭，造成 {hit}% 武器傷害，並釋放電弧擊中附近 2 個敵人（每道 {half}%）；全部感電 4 秒（受到的傷害 +15%）",
    },
    whirlL: {
      cls: "sword",
      act: 1,
      sus: 1,
      leg: "whirl",
      stick: (t) => spinTick(t),
      sdps: (t, a) =>
        ((((t.mn + t.mx) / 2) * LEG.spin.k) / LEG.spin.iv) * (1 + a.dmg),
      tg: ["aoe"],
      n: "致命迴旋",
      shape: [
        [0, 0],
        [-1, 0],
        [1, 0],
        [0, 1],
      ],
      col: "#ffc04a",
      d: "傳說・持續技能：常駐開啟，不停旋轉，每 0.4 秒對周圍所有敵人造成 45% 武器傷害",
    },
    pierceL: {
      cls: "bow",
      act: 1,
      leg: "pierce",
      hit: 2.2,
      est: () => 2 * SKILLS.pierceL.hit,
      tg: ["proj"],
      n: "箭矢風暴",
      cd: 3,
      shape: [
        [0, 0],
        [1, 0],
        [2, 0],
      ],
      col: "#ffe08a",
      d: "傳說：射出貫穿直線上所有敵人的箭，飛至半途折返回到你身邊，去程與回程各造成 {hit}% 武器傷害",
    },
    blinkL: {
      cls: "sword",
      act: 1,
      leg: "blink",
      hit: 3,
      est: (t, a, s) =>
        SKILLS.blinkL.hit *
        (1 +
          (activeGems().some((t) => "dance" === (SKILLS[t.id]?.roBase || t.id)) ? 0.5 * a.aps * s : 0)),
      tg: ["aoe"],
      n: "迴旋十字斬",
      cd: 4,
      shape: [
        [0, 0],
        [1, 0],
        [2, 0],
        [2, 1],
      ],
      col: "#ffd890",
      d: "傳說：瞬間移動到目標身旁斬擊，造成 {hit}% 武器傷害，並在目標周圍爆開，對其他敵人造成 100% 武器傷害；有氣勢時消耗 1 層（50% 機率不消耗），本次不進入冷卻（擊中不會獲得氣勢）",
    },
    fireL: {
      cls: "mage",
      act: 1,
      leg: "fire",
      hit: 2.4,
      est: (t, a, s) =>
        3 +
        SKILLS.fireL.hit *
          AIL.brn.v *
          a.brn *
          a.ail *
          (1 + t.ail) *
          Math.min(AIL.brn.t * a.ail * (1 + t.ail), s),
      tg: ["proj", "spell", "aoe", "elem"],
      ail: "brn",
      n: "地獄火焰",
      cd: 3,
      shape: [
        [0, 0],
        [1, 0],
        [0, 1],
      ],
      col: "#ff5a2a",
      d: "傳說：火球術命中造成 {hit}% 武器傷害並爆炸，再分裂成 3 顆小火球術飛向四周（各 60%）；全部使敵人燃燒",
    },
    chain: {
      cls: "mage",
      act: 1,
      hit: 1.8,
      tg: ["aoe", "spell", "elem", "chn"],
      n: "連鎖增幅電擊",
      cd: 3.5,
      shape: [
        [0, 0],
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ],
      col: "#e0e05a",
      d: "閃電擊中目標後連鎖增幅到附近 2 個敵人，每次 {hit}% 武器傷害；使敵人感電 4 秒（受到的傷害 +15%）",
      ail: "shk",
    },
    frostsl: {
      cls: "sword",
      act: 1,
      hit: 2.6,
      ail: "chl",
      tg: ["aoe", "elem"],
      n: "冰霜龍息",
      cd: 4,
      shape: [
        [0, 0],
        [1, 0],
        [0, 1],
        [0, 2],
      ],
      col: "#8ad0ff",
      d: "重擊前方地面，冰刺範圍內的敵人受到 {hit}% 武器傷害並冰緩 3 秒（移動與攻擊速度 -45%）",
    },
    venom: {
      cls: "sword",
      act: 1,
      hit: 1.5,
      est: (t, a, s) =>
        SKILLS.venom.hit *
        (1 +
          PSN_K *
            Math.min(PSN_T, s * (a.psnMax + t.pstk)) *
            a.psn *
            (1 + (a.T.psnRate || 0))),
      tg: ["aoe", "psn"],
      n: "毒刃",
      cd: 3,
      shape: [
        [0, 0],
        [1, 0],
        [2, 0],
        [0, -1],
      ],
      col: "#7ad04a",
      d: "斬擊目標，毒液在目標周圍炸開，範圍內的敵人受到 {hit}% 武器傷害並中毒 4 秒（每秒 30% 命中傷害）",
    },
    guard: {
      cls: "sword",
      act: 1,
      tg: ["minion"],
      n: "英靈召喚",
      cd: 8,
      shape: [
        [0, 0],
        [0, 1],
        [1, 1],
        [0, 2],
      ],
      col: "#e0c878",
      d: "召喚 1 隻英靈召喚（召喚物），嘲諷周圍的敵人改為攻擊它；生命為你最大生命的 50%，使用你的護甲與閃避，每秒攻擊 1 次造成 50% 武器傷害；陣亡後經過冷卻時間重新召喚",
    },
    miasma: {
      cls: "mage",
      act: 1,
      hit: 0.4,
      est: (t, a, s) =>
        SKILLS.miasma.hit *
        (MIA.t / MIA.iv +
          PSN_K *
            a.psn *
            (1 + (a.T.psnRate || 0)) *
            (a.psnMax + t.pstk) *
            Math.min(MIA.t + PSN_T, s)),
      tg: ["aoe", "spell", "psn"],
      n: "毒霧",
      cd: 6,
      shape: [
        [0, 0],
        [1, 0],
        [1, 1],
        [2, 0],
      ],
      col: "#9ac04a",
      d: "在目標處放出瘴氣 5 秒，每 0.5 秒對範圍內敵人造成 {hit}% 武器傷害並使其中毒 4 秒（每秒 30% 命中傷害）",
    },
  };
for (const t in SKILLS) {
  const a = SKILLS[t];
  a.hit &&
    (a.d = a.d
      .replace("{hit}", Math.round(100 * a.hit))
      .replace("{half}", Math.round(50 * a.hit)));
}
const PSN_T = 4,
  PSN_K = 0.3,
  PLAGUE_R = 36,
  TNT_T = 4,
  TNT_DMG = 0.25,
  TNT_R = 44,
  AIL = {
    brn: { n: "燃燒", t: 3, v: 0.15, col: "#ff9a3a" },
    chl: { n: "冰緩", t: 3, v: 0.45, col: "#7ad4ff" },
    shk: { n: "感電", t: 4, v: 0.15, col: "#ffe04a" },
    bld: { n: "流血", t: 4, v: 0.2, mv: 2, col: "#e02a3a" },
  },
  EXA = { n: 5, t: 4, k: 0.65, r: 20 },
  TRAP = { max: 3, arm: 0.4, life: 10, r: 18, reach: 9, root: 1 },
  MTR = { t: 1.2, r: 28 },
  BLZ = { t: 4, r: 26, iv: 0.5 },
  TRIG = { cd: 0.5, k: 0.6 },
  FRZ = { n: 5, slow: 0.1, t: 3, imm: 3 },
  SWAVE = { rng: 75, life: 0.6 },
  BPOOL = { r: 34, k: 0.05, iv: 0.5, drain: 0.03 },
  BLINK = { rng: 90 },
  LEG = {
    spin: { iv: 0.4, k: 0.45, r: 18 },
    blink: { k: 1, r: 20, keep: 0.5 },
    ret: 0.6,
    split: { n: 3, k: 0.6, spd: 150, life: 0.45 },
  },
  LEG_P = { e: 2e-5, b: 2e-4 },
  SX_P = LEG_P,
  SX_W = { mstrike: 1, fury: 2, multi: 2, prec: 3, haste: 3 },
  sxPool = (t) =>
    Object.keys(SX_W).filter(
      (a) =>
        !CLASS[t].gems.includes(a) &&
        CLASS[t].gems.some((t) => SKILLS[t].act && supFits(a, t)),
    ),
  TUR = { n: 2, t: 12, as: 0.8, k: 0.5, r: 80, pspd: 230 },
  ARW = { ir: 16, lr: 40, ln: 2 },
  FSL = { off: 12, r: 20 },
  VEN = { r: 22 },
  MIA = { t: 5, iv: 0.5, r: 26 },
  GSP = {
    n: 1,
    life: 0.5,
    atk: 1,
    k: 0.5,
    tr: 50,
    reach: 9,
    spd: 70,
    follow: 60,
  },
  FISS = { L: 70, w: 6, life: 3 },
  LEAP = { rng: 90, r: 22, T: 0.4, z: 16 },
  CRS_RING = { iv: 0.5, t: 1.5 },
  CRS = {
    wk: { n: "衰弱", t: 6, v: 0.25, col: "#b89aff" },
    sl: { n: "緩慢", t: 6, v: 0.3, col: "#7aaaff" },
    vu: { n: "脆弱", t: 6, v: 0.25, col: "#ff7ab8" },
  },
  CRS_R = 28,
  CRS_TXT = { wk: "造成的傷害 -", sl: "移動與攻擊速度 -", vu: "受到的傷害 +" },
  OATH = { cd: 0.5 },
  BOOM = { r: 22 },
  SAP = { n: 6, t: 20, atk: 1, r: 44 },
  MAGMA = { t: 3, x: 4, r: 30 },
  ORBIT = { n: 6, t: 10, r: 16, cd: 1 },
  MIN = {
    n: 2,
    atk: 1.2,
    k: 0.35,
    spd: 85,
    r: 40,
    pspd: 150,
    el: ["brn", "chl", "shk"],
  },
  OVK = { r: 44, hops: 2, col: "#ff7a5a" },
  STK = { mom: { n: "氣勢", max: 10, dur: 3, decay: 0.5 } },
  MOM_AS = 0.05,
  MOM_MS = 0.03,
  FRZ_DMG = 0.35,
  FRZ_DRAIN = 0.04,
  SUS_IDLE = 2,
  CLASS = {
    sword: {
      n: "劍士",
      hp: 1.3,
      range: 12,
      d: "近戰・高生命",
      gems: [
        "heavy",
        "whirl",
        "fury",
        "haste",
        "thrust",
        "bigarea",
        "taunt",
        "frenzy",
        "dance",
        "fissure",
        "leap",
        "swave",
        "mproj",
        "conc",
        "sacr",
        "cot",
        "chainp",
        "bpool",
        "blink",
        "cwk",
        "cslw",
        "cvul",
        "mstrike",
        "frostsl",
        "venom",
        "guard",
        "mcount",
        "mdmg",
        "spread",
        "ailx",
        "overk",
        "pstack",
        "amp",
      ],
    },
    bow: {
      n: "弓手",
      hp: 1,
      range: 46,
      d: "遠程・高暴擊",
      gems: [
        "pierce",
        "rain",
        "multi",
        "prec",
        "varrow",
        "mproj",
        "pstack",
        "overk",
        "exarrow",
        "trap",
        "chainp",
        "conc",
        "sacr",
        "cot",
        "turret",
        "farrow",
        "iarrow",
        "larrow",
        "mcount",
        "mdmg",
        "spread",
        "cwk",
        "cslw",
        "cvul",
        "bigarea",
        "ailx",
        "amp",
      ],
    },
    mage: {
      n: "法師",
      hp: 0.85,
      range: 40,
      d: "遠程・範圍法術",
      gems: [
        "fire",
        "nova",
        "amp",
        "spread",
        "chain",
        "mproj",
        "ailx",
        "cwk",
        "cslw",
        "cvul",
        "summon",
        "mcount",
        "mdmg",
        "meteor",
        "bliz",
        "chainp",
        "conc",
        "sacr",
        "cot",
        "miasma",
        "bigarea",
        "overk",
        "pstack",
      ],
    },
  },
  TRIAL = [
    { lv: 30, n: "覺醒試煉", bt: "knight", boss: "試煉・深淵騎士" },
    { lv: 45, n: "鍛鍊試煉", bt: "golem", boss: "試煉・巨石怪" },
    { lv: 60, n: "征服試煉", bt: "imp", boss: "試煉・小惡魔" },
    { lv: 75, n: "巔峰試煉", bt: "knight", boss: "試煉・深淵領主" },
  ],
  TRIAL_T = 120,
  TRIAL_HP = 1.5,
  ASC_PT = 2,
  ASC_TRIAL = TRIAL.map((t) => t.lv),
  ASC_RESET = 300,
  ASC_RESET_T = 150,
  ARM_DMG_OVER = 0.02,
  ARM_FULL = 1500,
  RG = { graze: 0.3, trap: 1, shd: 0.01, cap: 0.5 },
  ASC = {
    sword: [
      {
        k: "bers",
        pal: { b: "#b8303a", B: "#6e1a22" },
        n: "狂戰士",
        d: "以血換力：狂怒之槍、生命偷取、生命越低越強",
        t: [
          [
            {
              k: "b1",
              n: "血之狂熱",
              d: "「狂怒之槍」的傷害倍率 +20%（共 ×1.55）",
              e: { frz: 0.2 },
            },
            {
              k: "b2",
              n: "嗜血",
              d: "擊中時回復該次傷害 2% 的生命",
              e: { leech: 0.02 },
            },
          ],
          [
            {
              k: "b3",
              n: "越戰越勇",
              d: "每失去 10% 生命為 1 段；傷害 ×（1＋5% × 段數）",
              e: { lowhp: 0.05 },
            },
            {
              k: "b4",
              n: "狂怒之軀",
              d: "最大生命 ×1.15",
              e: { more: { life: 15 } },
            },
          ],
          [
            {
              k: "b5",
              n: "血怒",
              d: "生命最多只能回復到 50%；傷害 ×1.5；「嗜血」與擊殺回復詞綴的回復量 ×2",
              e: { rage: 1, more: { dmg: 50 } },
            },
            {
              k: "b6",
              n: "殺戮渴望",
              d: "擊殺回復 3% 最大生命",
              e: { lokp: 0.03 },
            },
          ],
        ],
      },
      {
        k: "guard",
        pal: { b: "#c8c8d8", B: "#7a7a94" },
        n: "守護騎士",
        d: "嘲諷聚怪、護甲反傷、削弱受嘲諷的敵人",
        t: [
          [
            { k: "g1", n: "堅盾", d: "護甲 ×1.4", e: { more: { armor: 40 } } },
            {
              k: "g2",
              n: "挑釁",
              d: "挑釁範圍 +50%、持續時間 +2 秒",
              e: { tntR: 0.5, tntT: 2 },
            },
          ],
          [
            {
              k: "g3",
              n: "荊棘之心",
              d: "傷害 ×（1＋護甲每 100 點 1.5%），1500 以上改為每 100 點 2%；受到攻擊時，對攻擊者造成等同護甲值的傷害",
              e: { armDmg: 0.015, thorn: 1 },
            },
            {
              k: "g4",
              n: "威壓",
              d: "被嘲諷的敵人受到的傷害 ×1.35",
              e: { tntVul: 0.35 },
            },
          ],
          [
            {
              k: "g5",
              n: "不動如山",
              d: "受到的傷害 -20%；最大生命 ×1.2",
              e: { dmgTaken: 0.2, more: { life: 20 } },
            },
            {
              k: "g6",
              n: "鐵壁",
              d: "被嘲諷的敵人對你造成的傷害 -40%（原為 -25%）",
              e: { tntDmg: 0.15 },
            },
          ],
        ],
      },
      {
        k: "blade",
        pal: { b: "#3ab0b0", B: "#1e6a6e" },
        n: "雙劍格擋者",
        d: "累積氣勢加速，斬擊連綿不絕",
        t: [
          [
            {
              k: "d1",
              n: "劍勢",
              d: "氣勢上限 +5 層（共 15 層）",
              e: { momMax: 5 },
            },
            {
              k: "d2",
              n: "流水",
              d: "傷害 ×（1＋3% × 氣勢層數）",
              e: { momDmg: 0.03 },
            },
          ],
          [
            {
              k: "d3",
              n: "疾風步",
              d: "氣勢被消耗或消失時，25% 機率不減少，並重新保留 3 秒",
              e: { momSave: 0.25 },
            },
            {
              k: "d4",
              n: "劍刃風暴",
              d: "技能擊中也會獲得氣勢",
              e: { momSkill: 1 },
            },
          ],
          [
            {
              k: "d5",
              n: "無盡雙劍格擋",
              d: "氣勢滿層時，擊中有 25% 機率追加 100% 傷害（召喚物除外）",
              e: { momDbl: 0.25 },
            },
            {
              k: "d6",
              n: "殘影",
              d: "每層氣勢使受到的傷害 -1%",
              e: { momDR: 0.01 },
            },
          ],
        ],
      },
    ],
    bow: [
      {
        k: "snipe",
        pal: { b: "#5a5a6a", B: "#33333e" },
        n: "狙擊手",
        d: "單體高傷、致命爆裂、擅長對付菁英與 Boss",
        t: [
          [
            { k: "s1", n: "鷹眼", d: "暴擊傷害 +40%", e: { critm: 40 } },
            {
              k: "s2",
              n: "獵殺",
              d: "對菁英與 Boss 的傷害 ×1.2",
              e: { boss: 0.2 },
            },
          ],
          [
            {
              k: "s3",
              n: "貫穿",
              d: "普攻與技能擊殺敵人時，溢出傷害的 50% 轉移至最近的敵人（最多連續 2 次；與致命爆裂合計最多 100%）",
              e: { ovk: 0.5 },
            },
            {
              k: "s4",
              n: "穩定瞄準",
              d: "投射物技能傷害 ×1.25",
              e: { projDmg: 0.25 },
            },
          ],
          [
            {
              k: "s5",
              n: "致命一擊",
              d: "對生命 90% 以上的敵人必定暴擊",
              e: { fullCrit: 1 },
            },
            {
              k: "s6",
              n: "處刑",
              d: "對生命低於 20% 的敵人傷害 ×1.5",
              e: { exec: 0.5 },
            },
          ],
        ],
      },
      {
        k: "venom",
        pal: { b: "#8a4ab0", B: "#4e2470" },
        n: "毒師",
        d: "疊加中毒、加快毒傷、擴散增幅中毒",
        t: [
          [
            { k: "v1", n: "劇毒", d: "中毒傷害 +70%", e: { psn: 70 } },
            {
              k: "v2",
              n: "毒疊",
              d: "中毒最多可疊加 3 層（原為 1 層）",
              e: { psnMax: 2 },
            },
          ],
          [
            {
              k: "v3",
              n: "速效毒",
              d: "中毒每 0.7 秒造成一次傷害（原為 1 秒）",
              e: { psnRate: 0.43 },
            },
            {
              k: "v4",
              n: "毒刃",
              d: "普攻與技能擊中時，40% 機率使敵人中毒",
              e: { psnHit: 0.4 },
            },
          ],
          [
            {
              k: "v5",
              n: "瘟疫",
              d: "中毒的敵人死亡時毒爆：對周圍敵人造成牠身上剩餘毒傷的 75%，並使牠們中毒",
              e: { psnSpread: 0.75 },
            },
            {
              k: "v6",
              n: "腐蝕",
              d: "中毒的敵人受到的傷害 ×1.25",
              e: { psnVul: 0.25 },
            },
          ],
        ],
      },
      {
        k: "ranger",
        pal: { b: "#a0703a", B: "#5e3e1e" },
        n: "遊俠",
        d: "閃避為核心：幸運閃避、閃避轉暴擊、護盾",
        t: [
          [
            {
              k: "r1",
              n: "幸運閃避",
              d: "被擊中後，下一次閃避判定為幸運（判定兩次，取較好的結果）",
              e: { dgLuck: 1 },
            },
            { k: "r2", n: "閃身", d: "閃避值 ×2", e: { more: { eva: 100 } } },
          ],
          [
            {
              k: "r3",
              n: "擦身",
              d: `未閃避的攻擊有 ${100 * RG.graze}% 機率傷害減半`,
              e: { graze: RG.graze },
            },
            {
              k: "r4",
              n: "獵人本能",
              d: `陷阱傷害 ×（1＋閃避率 × ${RG.trap}），超出上限的閃避率也計算`,
              e: { trapEva: RG.trap },
            },
          ],
          [
            {
              k: "r5",
              n: "超越極限",
              d: "暴擊率等同於閃避率（含超出上限的部分）；裝備與其他來源的暴擊率無效",
              e: { critEva: 1 },
            },
            {
              k: "r6",
              n: "遊擊",
              d: `暴擊時獲得閃避值 ${100 * RG.shd}% 的護盾，上限為閃避值的 ${100 * RG.cap}%；護盾不會消失`,
              e: { critShd: RG.shd },
            },
          ],
        ],
      },
    ],
    mage: [
      {
        k: "elem",
        pal: { b: "#d8502a", B: "#8a2a14" },
        n: "元素使",
        d: "強化燃燒、冰緩、感電",
        t: [
          [
            {
              k: "e1",
              n: "元素親和",
              d: "元素異常效果與持續時間 +30%",
              e: { ail: 0.3 },
            },
            { k: "e2", n: "專注", d: "法術技能傷害 ×1.2", e: { spell: 0.2 } },
          ],
          [
            {
              k: "e3",
              n: "嚴寒",
              d: "冰緩中的敵人受到的傷害 ×1.15",
              e: { chlVul: 0.15 },
            },
            { k: "e4", n: "過載", d: "感電效果 +50%", e: { ax_shk: 0.5 } },
          ],
          [
            {
              k: "e5",
              n: "元素大師",
              d: "元素異常效果與持續時間再 +40%",
              e: { ail: 0.4 },
            },
            {
              k: "e6",
              n: "餘燼",
              d: "燃燒中的敵人死亡時爆炸，對周圍造成 100% 武器傷害",
              e: { ember: 1 },
            },
          ],
        ],
      },
      {
        k: "summ",
        pal: { b: "#3a9ad0", B: "#1e5a86" },
        n: "召喚師",
        d: "更多、更強、更快的召喚物",
        t: [
          [
            { k: "m1", n: "召喚大軍", d: "召喚物 +1", e: { minion: 1 } },
            {
              k: "m2",
              n: "強化召喚",
              d: "召喚物傷害 +30%",
              e: { minDmg: 0.3 },
            },
          ],
          [
            {
              k: "m3",
              n: "疾行精靈",
              d: "召喚物攻擊與移動速度 +30%",
              e: { minAs: 0.3 },
            },
            {
              k: "m4",
              n: "元素共鳴",
              d: "召喚物會套用你的暴擊率與暴擊傷害，附帶的元素異常效果 +50%",
              e: { minAil: 0.5, minCrit: 1 },
            },
          ],
          [
            {
              k: "m5",
              n: "精靈軍團",
              d: "召喚物 +1，召喚物傷害 +20%",
              e: { minion: 1, minDmg: 0.2 },
            },
            {
              k: "m6",
              n: "守護之靈",
              d: "每隻召喚物使你受到的傷害 -4%（最多 -60%）",
              e: { minGuard: 0.04 },
            },
          ],
        ],
      },
      {
        k: "hex",
        pal: { b: "#3a2a4a", B: "#1e1428" },
        n: "咒術師",
        d: "詛咒更強、更廣、可擴散增幅",
        t: [
          [
            { k: "h1", n: "怨念", d: "詛咒效果 +25%", e: { crs: 0.25 } },
            {
              k: "h2",
              n: "擴散增幅",
              d: "詛咒範圍 +40%、持續時間 +3 秒",
              e: { crsR: 0.4, crsT: 3 },
            },
          ],
          [
            {
              k: "h3",
              n: "咒縛",
              d: "敵人身上每個詛咒使牠受到的傷害 ×1.06",
              e: { crsVul: 0.06 },
            },
            {
              k: "h4",
              n: "詛咒光環",
              d: "每 4 秒，對你周圍的敵人施加技能拼圖中的所有詛咒",
              e: { crsAura: 4 },
            },
          ],
          [
            {
              k: "h5",
              n: "末日",
              d: "受詛咒的敵人死亡時，詛咒轉移至附近 2 個敵人",
              e: { crsSpread: 2 },
            },
            { k: "h6", n: "厄運", d: "詛咒效果再 +35%", e: { crs: 0.35 } },
          ],
        ],
      },
    ],
  },
  ascBranch = (t = S.cls, a = S.tal && S.tal.asc) =>
    (ASC[t] || []).find((t) => t.k === a),
  MON = {
    slime: { n: "史萊姆", hp: 1, dmg: 0.8, spd: 14 },
    wolf: { n: "野狼", hp: 0.8, dmg: 1, spd: 30 },
    goblin: { n: "哥布林", hp: 1, dmg: 1.1, spd: 22 },
    bat: { n: "蝙蝠", hp: 0.6, dmg: 0.8, spd: 34 },
    skeleton: { n: "骷髏兵", hp: 1.2, dmg: 1.1, spd: 18 },
    wisp: { n: "鬼火", hp: 0.7, dmg: 1, spd: 16, ranged: 40 },
    golem: { n: "石像", hp: 2, dmg: 1.4, spd: 11 },
    imp: { n: "小惡魔", hp: 0.8, dmg: 1.1, spd: 22, ranged: 36 },
    knight: { n: "亡靈騎士", hp: 1.6, dmg: 1.3, spd: 18 },
    gd0: { n: "獸人英雄", hp: 2.4, dmg: 1.3, spd: 17 },
    gd1: { n: "伊夫利特", hp: 2.8, dmg: 1.6, spd: 16 },
    gd2: { n: "冰暴騎士", hp: 2, dmg: 1.2, spd: 15, ranged: 44 },
    fin: { n: "巴風特", hp: 3, dmg: 1.5, spd: 18 },
    mon: { n: "闇答萊屍", hp: 3, dmg: 1.5, spd: 20 },
    dullahan: { n: "杜拉漢", hp: 1.7, dmg: 1.35, spd: 18 },
    loli: { n: "蘿莉露莉", hp: 1.1, dmg: 1.2, spd: 20, ranged: 36 },
    venatu: { n: "維納特", hp: 1.3, dmg: 1.2, spd: 24 },
    dimik: { n: "迪米克", hp: 1.2, dmg: 1.2, spd: 16, ranged: 44 },
    ferus: { n: "野性龍", hp: 1.5, dmg: 1.3, spd: 26 },
    acidus: { n: "酸性龍", hp: 1.2, dmg: 1.25, spd: 18, ranged: 40 },
    eremes: { n: "艾勒梅斯", hp: 1.1, dmg: 1.45, spd: 30 },
    kathryne: { n: "卡特琳娜", hp: 0.9, dmg: 1.35, spd: 16, ranged: 44 },
    dummy: { n: "訓練假人", hp: 1, dmg: 0, spd: 0 },
  },
  BOSS_SK = {
    cd: 4.5,
    first: 3,
    enr: 0.3,
    ea: 0.75,
    es: 1.25,
    spd: 1.1,
    minor: 0.35,
    big: 1.05,
    ramp: [0.3, 0.14],
    lead: 0.8,
    slam: { t: 1.3, r: 34, k: 1 },
    mark: { t: 1.1, r: 16, cnt: 2, k: 0.9 },
    charge: { t: 0.9, w: 9, len: 160, k: 1 },
    volley: { cnt: 16, k: 0.15, spd: 60 },
    summon: { cnt: 3, max: 6 },
    roots: { t: 1, r: 14, cnt: 3, k: 0.8, slow: 3, c: "#7ad46a" },
    meteor: { t: 1.3, r: 18, cnt: 6, k: 0.9, stagger: 0.2, c: "#ff8a3a" },
    cross: { t: 1, w: 7, k: 1.1, c: "#f0f4ff" },
  },
  BOSS_SKS = {
    slime: ["slam", "summon"],
    goblin: ["charge", "summon"],
    skeleton: ["mark", "summon"],
    golem: ["slam", "mark"],
    wisp: ["mark", "volley"],
    wolf: ["charge", "summon"],
    knight: ["charge", "slam"],
    imp: ["mark", "volley"],
  },
  ELITE_AF = {
    swift: { n: "加速術", c: "#7ad4ff", spd: 1.8, atk: 0.7 },
    tough: { n: "堅韌", c: "#d8c090", dr: 0.5 },
    burst: { n: "爆裂", c: "#ff8a3a", t: 0.9, r: 24, k: 4 },
    volley: {
      n: "遠射",
      c: "#ff60ff",
      cd: 3.5,
      cnt: 10,
      k: 1.2,
      spd: 55,
      rng: 80,
    },
    leech: { n: "吸血", c: "#ff4a5a", h: 0.05 },
    frost: {
      n: "寒霜",
      c: "#bfe8ff",
      cd: 4,
      r: 16,
      life: 4,
      slow: 0.5,
      rng: 70,
    },
  },
  HH_T = 20,
  HH = {
    swift: { d: "攻擊速度、移動速度 +40%", as: 0.4, ms: 0.4 },
    tough: { d: "受到的傷害 −30%", dr: 0.3 },
    burst: { d: "擊中時 25% 機率爆炸，對周圍造成等量傷害", p: 0.25, r: 20 },
    volley: {
      d: "每 3.5 秒朝附近敵人射出 6 支箭",
      cd: 3.5,
      n: 6,
      k: 0.8,
      rng: 110,
    },
    leech: { d: "以造成傷害的 2% 回復生命", h: 0.02 },
    frost: {
      d: "每 4 秒釋放冰環，冰緩周圍敵人 2 秒",
      cd: 4,
      r: 34,
      t: 2,
      v: 0.4,
    },
  },
  CARD_N = [500, 1e3, 2e3],
  CARD_LOOK = 2e4,
  TRAIL = [
    {
      n: "花瓣",
      c: ["#ffe0ee", "#ff8ac0", "#7ad04a"],
      rib: 2,
      dec: "flower",
      mote: 4,
      mk: "swirl",
      lit: 0,
      p: { vz: 10, g: -16, sp: 14, life: 1.1, s: 2, rate: 34 },
    },
    {
      n: "螢火",
      c: ["#fffbc0", "#d8ff6a", "#4a7a2a"],
      rib: 1,
      glow: 1,
      dec: "glow",
      mote: 7,
      mk: "wander",
      lit: 14,
      p: { vz: 6, g: 4, sp: 8, life: 1.4, s: 1, tw: 1, rate: 22 },
    },
    {
      n: "晶塵",
      c: ["#ffffff", "#7ad4ff", "#3a5aff"],
      rib: 3,
      glow: 1,
      aft: "#7ad4ff",
      dec: "shard",
      mote: 3,
      mk: "orbit",
      lit: 16,
      p: { vz: 18, g: -50, sp: 14, life: 0.8, s: 1, star: 1, rate: 40 },
    },
    {
      n: "沙塵",
      c: ["#fff0c8", "#e0b070", "#9a6a3a"],
      rib: 4,
      dec: "puff",
      mote: 0,
      lit: 0,
      p: { vz: 4, g: -5, sp: 20, life: 0.8, s: 2, rate: 50 },
    },
    {
      n: "泡沫",
      c: ["#ffffff", "#9ae8ff", "#3a8ac8"],
      rib: 2,
      glow: 1,
      dec: "ripple",
      mote: 5,
      mk: "rise",
      lit: 12,
      p: { vz: 10, g: 6, sp: 5, life: 1.2, s: 2, ring: 1, rate: 20 },
    },
    {
      n: "霜花",
      c: ["#ffffff", "#6ac8ff", "#1a4a9a"],
      rib: 2,
      glow: 1,
      aft: "#bfe8ff",
      dec: "frost",
      mote: 4,
      mk: "orbit",
      lit: 14,
      p: { vz: 3, g: -2, sp: 8, life: 1.3, s: 1, tw: 1, star: 1, rate: 20 },
    },
    {
      n: "餘燼",
      c: ["#fff0a0", "#ff8a2a", "#b0200a"],
      rib: 3,
      glow: 1,
      aft: "#ff5a1a",
      dec: "fire",
      mote: 5,
      mk: "rise",
      lit: 22,
      p: { vz: 22, g: 10, sp: 10, life: 1, s: 2, tw: 1, rate: 44 },
    },
    {
      n: "毒霧",
      c: ["#e0ff9a", "#7ad44a", "#2a5a2a"],
      rib: 4,
      dec: "pool",
      mote: 0,
      lit: 0,
      p: { vz: 3, g: 2, sp: 8, life: 1.5, s: 3, rate: 30 },
    },
    {
      n: "金屑",
      c: ["#ffffff", "#ffd84a", "#a8740a"],
      rib: 2,
      glow: 1,
      aft: "#ffd84a",
      dec: "coin",
      mote: 4,
      mk: "orbit",
      lit: 16,
      p: { vz: 22, g: -60, sp: 12, life: 0.9, s: 1, tw: 1, star: 1, rate: 34 },
    },
    {
      n: "虛空",
      c: ["#f0d8ff", "#a060ff", "#2a0a50"],
      rib: 4,
      glow: 1,
      aft: "#7a3aff",
      dec: "rune",
      mote: 6,
      mk: "pull",
      lit: 18,
      p: { vz: 6, g: 0, sp: 22, life: 0.9, s: 2, rate: 44 },
    },
    {
      n: "星軌",
      c: ["#ffffff", "#fff0a0", "#6a8aff"],
      rib: 3,
      glow: 1,
      aft: "#9ab0ff",
      dec: "star",
      mote: 4,
      mk: "const",
      lit: 20,
      p: { vz: 2, g: 2, sp: 4, life: 1.6, s: 1, tw: 1, star: 1, rate: 22 },
    },
  ],
  ELITE_2 = 6,
  ELITE_P = 0.08,
  DODGE = { base: 0.45, lo: 0.2, hi: 0.6 },
  WORLD_AREA = 4e4,
  MOB_REF_AREA = 34e3,
  AGGRO_MAP = 4,
  AGGRO_R = (t) => (t < 4 ? 0 : 22 + 5 * (t - 4)),
  RX_CH = 0.5,
  MAPS = [
    {
      n: "普隆德拉南門",
      lv: [1, 6],
      m: ["slime", "wolf"],
      boss: "天使波利",
      bt: "slime",
      card: ["move", [4, 8, 12]],
      v: {
        k: "grass",
        p: ["#356b3b", "#4a8f45", "#64ad50", "#89cb62"],
        q: ["#87603f", "#a3764d", "#be9161"],
        pool: ["#1f4a85", "#2a64a8", "#6ab3e4"],
        d: "flowers",
        pr: "tree",
        amb: [0.12, 44, 22, 70],
        sl: 0,
      },
    },
    {
      n: "斐揚森林",
      lv: [6, 13],
      m: ["wolf", "goblin"],
      boss: "黃金蟲",
      bt: "goblin",
      card: ["dmgp", [4, 8, 15]],
      v: {
        k: "grass",
        p: ["#1f3f2a", "#2b5634", "#3a6e3e", "#5a9050"],
        q: ["#4a3828", "#5e4632", "#74583e"],
        pool: null,
        d: "mush",
        pr: "tree",
        amb: [0.42, 30, 18, 60],
        sl: 0,
      },
    },
    {
      n: "妙勒尼礦坑",
      lv: [13, 21],
      m: ["bat", "skeleton"],
      boss: "死靈",
      bt: "skeleton",
      card: ["armorp", [8, 16, 30]],
      v: {
        k: "cave",
        p: ["#2a221e", "#3a302a", "#4a3e36", "#5e5046"],
        q: ["#3a2c22", "#4e3c2c", "#62503a"],
        pool: null,
        d: "crystal",
        pr: "rock",
        amb: [0.66, 12, 8, 24],
        sl: 2,
      },
    },
    {
      n: "夢羅克沙漠",
      lv: [21, 29],
      m: ["goblin", "golem"],
      boss: "俄塞里斯",
      bt: "golem",
      card: ["aspd", [3, 6, 10]],
      v: {
        k: "grass",
        p: ["#a8743e", "#bf8a4e", "#d4a464", "#e8c488"],
        q: ["#8a5a30", "#9c6a3a", "#b07c48"],
        pool: null,
        d: "bones",
        pr: "cactus",
        amb: [0.06, 80, 30, 10],
        sl: 1,
      },
    },
    {
      n: "依斯魯得海底洞穴",
      lv: [29, 37],
      m: ["skeleton", "wisp"],
      boss: "海神",
      bt: "wisp",
      card: ["crit", [2, 4, 6]],
      v: {
        k: "tiles",
        p: ["#1e3640", "#2a4a56", "#365e6a", "#4a7884"],
        q: ["#1e3640", "#2a4a56", "#365e6a"],
        pool: ["#123a52", "#1c5a7a", "#5ab0d0"],
        d: "puddle",
        pr: "pillar",
        amb: [0.46, 8, 30, 50],
        sl: 2,
      },
    },
    {
      n: "拉赫冰洞",
      lv: [37, 45],
      m: ["wolf", "golem"],
      rx: "wisp",
      boss: "冰暴騎士",
      bt: "wolf",
      card: ["critm", [8, 16, 25]],
      v: {
        k: "grass",
        p: ["#94a6bc", "#b0c0d2", "#cad8e6", "#eef4fa"],
        q: ["#7a8aa0", "#8e9eb2", "#a2b2c4"],
        pool: ["#5a7aa8", "#7aa0cc", "#c8e4ff"],
        d: "snow",
        pr: "pine",
        amb: [0.18, 20, 30, 70],
        sl: 2,
      },
    },
    {
      n: "諾可羅德火山",
      lv: [45, 53],
      m: ["imp", "golem"],
      boss: "伊夫利特",
      bt: "golem",
      card: ["act", [2, 4, 6]],
      v: {
        k: "cave",
        p: ["#1e1416", "#2e1e1e", "#3e2824", "#52342c"],
        q: ["#2a1a18", "#3a2420", "#4a2e26"],
        pool: ["#d8443a", "#ff8a30", "#ffe080"],
        glow: 1,
        d: "ember",
        pr: "rock",
        amb: [0.5, 40, 6, 6],
        sl: 1,
      },
    },
    {
      n: "葛城修道院",
      lv: [53, 61],
      m: ["slime", "wisp"],
      boss: "闇神官",
      bt: "slime",
      card: ["cdr", [2, 4, 6]],
      v: {
        k: "grass",
        p: ["#26321c", "#34421f", "#465830", "#5e7238"],
        q: ["#3a3424", "#4a422c", "#5a5034"],
        pool: ["#2a3a1a", "#4a5a20", "#8aa040"],
        d: "reeds",
        pr: "deadtree",
        amb: [0.48, 16, 30, 10],
        sl: 3,
      },
    },
    {
      n: "古城騎士團",
      lv: [61, 69],
      m: ["skeleton", "knight"],
      rx: "wisp",
      boss: "闇答萊屍",
      bt: "knight",
      card: ["area", [5, 10, 15]],
      v: {
        k: "tiles",
        p: ["#4a475a", "#767487", "#8f8d9c", "#aaa8b4"],
        q: ["#4a475a", "#5c5a6c", "#6e6c7e"],
        pool: null,
        d: "rubble",
        pr: "pillar",
        amb: [0.36, 44, 22, 70],
        sl: 0,
      },
    },
    {
      n: "龜島深處",
      lv: [69, 77],
      m: ["wisp", "imp"],
      boss: "龜王",
      bt: "imp",
      card: ["skill", [5, 10, 18]],
      v: {
        k: "cave",
        p: ["#120c1e", "#1a1230", "#241a42", "#322456"],
        q: ["#1a1230", "#241a42", "#2e2250"],
        pool: ["#3a1a6a", "#7a3ad0", "#d0a0ff"],
        glow: 1,
        d: "stars",
        pr: "obelisk",
        amb: [0.58, 24, 6, 50],
        sl: 4,
      },
    },
    {
      n: "達納托斯之塔",
      lv: [77, 82],
      m: ["knight", "golem"],
      rx: "imp",
      boss: "達納托斯的憎恨",
      bt: "knight",
      card: ["lifep", [4, 8, 12]],
      v: {
        k: "tiles",
        p: ["#24243a", "#30304a", "#3e3e5c", "#54547a"],
        q: ["#2a2a40", "#34344e", "#40405e"],
        pool: null,
        d: "runes",
        pr: "obelisk",
        amb: [0.5, 10, 10, 40],
        sl: 4,
      },
    },
    {
      n: "尼芙菲姆",
      lv: [78, 85],
      m: ["dullahan", "loli"],
      rx: "wisp",
      boss: "死靈之王",
      bt: "knight",
      card: ["lok", [6, 12, 20]],
      v: {
        k: "tiles",
        p: ["#2a1c2e", "#3a2840", "#4c3654", "#644870"],
        q: ["#2e2032", "#3a2a40", "#46344e"],
        pool: null,
        d: "runes",
        pr: "obelisk",
        amb: [0.5, 10, 10, 40],
        sl: 4,
      },
    },
    {
      n: "朱諾・魔大陸",
      lv: [85, 92],
      m: ["venatu", "dimik"],
      rx: "golem",
      boss: "維斯伯",
      bt: "golem",
      card: ["minp", [6, 12, 20]],
      v: {
        k: "tiles",
        p: ["#3a3428", "#4e4636", "#625a46", "#7a725c"],
        q: ["#40382a", "#4e4636", "#5c5442"],
        pool: ["#1e4a8a", "#3a7ad0", "#bfe4ff"],
        glow: 1,
        d: "runes",
        pr: "pillar",
        amb: [0.5, 10, 10, 40],
        sl: 4,
      },
    },
    {
      n: "深淵之湖",
      lv: [92, 99],
      m: ["ferus", "acidus"],
      rx: "knight",
      boss: "迪塔勒泰晗勒斯",
      bt: "imp",
      card: ["evap", [6, 12, 20]],
      v: {
        k: "cave",
        p: ["#1c2a2e", "#24383e", "#30484e", "#40606a"],
        q: ["#203034", "#2a3c42", "#344a50"],
        pool: ["#2a5a3a", "#c8a030", "#ffe080"],
        glow: 1,
        d: "stars",
        pr: "obelisk",
        amb: [0.5, 10, 10, 40],
        sl: 4,
      },
    },
    {
      n: "生體研究所",
      lv: [99, 106],
      m: ["eremes", "kathryne"],
      rx: "skeleton",
      boss: "賽依連・溫德",
      bt: "wolf",
      card: ["dmgp", [5, 10, 18]],
      v: {
        k: "tiles",
        p: ["#26282c", "#32363a", "#40444a", "#565c62"],
        q: ["#2a2c30", "#34383c", "#3e4248"],
        pool: ["#4a0a0a", "#8a1a1a", "#e04040"],
        d: "runes",
        pr: "pillar",
        amb: [0.5, 10, 10, 40],
        sl: 4,
      },
    },
    {
      n: "諸神黃昏",
      ss: 1,
      lv: [90, 90],
      m: ["thun", "siren", "soul"],
      boss: "巴風特",
      bt: "zeus",
      card: null,
      v: {
        k: "tiles",
        p: ["#6c6a86", "#8e8ca6", "#b0aec4", "#d4d2e2"],
        q: ["#7a7894", "#9492ac", "#aeacc2"],
        pool: ["#1e4a8a", "#3a7ad0", "#bfe4ff"],
        glow: 1,
        d: "runes",
        pr: "pillar",
        amb: [0.3, 30, 24, 60],
        sl: 4,
      },
    },
  ],
  SEASON = { on: 1, n: "諸神黃昏", lv: 90 },
  SS_MAP = MAPS.length - 1,
  MAP_N = SS_MAP,
  ssMap = (t = S.map) => t === SS_MAP,
  SS = {
    frag: 0.001,
    fragN: 10,
    uqW: 30,
    bhp: 2,
    bdmg: 1.2,
    bcd: 0.8,
    art: 0.05,
  },
  GODS = [
    {
      n: "雷神索爾",
      fr: "雷神索爾碎片",
      bn: "雷霆化身・雷神索爾",
      bt: "zeus",
      c: "#ffe066",
      ks: ["bolt", "storm", "cross"],
      art: "zeus",
      m: "thun",
      hn: "雷弧",
      kn: "天雷",
    },
    {
      n: "海神",
      fr: "海神碎片",
      bn: "怒海化身・海神",
      bt: "posei",
      c: "#4ac0ff",
      ks: ["wave", "tide", "volley"],
      art: "posei",
      m: "siren",
      hn: "水花",
      kn: "融潮",
    },
    {
      n: "闇答萊屍",
      fr: "闇答萊屍碎片",
      bn: "冥府化身・闇答萊屍",
      bt: "hades",
      c: "#b07aff",
      ks: ["reap", "souls", "mark"],
      art: "hades",
      m: "soul",
      hn: "碎魂",
      kn: "冥門",
    },
  ],
  GFX_N = [2e3, 1e4];
(Object.assign(MON, {
  thun: {
    n: "雷靈",
    hp: 0.8,
    dmg: 1.1,
    spd: 18,
    ranged: 42,
    pc: "#ffe066",
    fl: 1,
    nk: 1,
    god: 0,
  },
  siren: { n: "海妖", hp: 1.3, dmg: 1.1, spd: 20, nk: 1, god: 1 },
  soul: { n: "冥魂", hp: 0.7, dmg: 1.2, spd: 30, fl: 1, nk: 1, god: 2 },
  zeus: { n: "雷霆化身・雷神索爾", hp: 2.4, dmg: 1.4, spd: 18, nk: 1 },
  posei: { n: "怒海化身・海神", hp: 2.6, dmg: 1.4, spd: 16, nk: 1 },
  hades: { n: "冥府化身・闇答萊屍", hp: 2.4, dmg: 1.5, spd: 18, nk: 1 },
}),
  Object.assign(BOSS_SK, {
    bolt: {
      t: 0.9,
      r: 12,
      cnt: 4,
      gap: 0.35,
      k: 0.8,
      c: "#ffe066",
      go: (t, a, s, e) => {
        t.hold = 0.4;
        for (let s = 0; s < e.cnt; s++)
          later(s * e.gap, () => {
            alive(t) &&
              !G.dead &&
              addHaz({
                x: G.pl.x,
                y: G.pl.y,
                r: e.r,
                t: e.t,
                dmg: a * e.k,
                src: t,
                c: e.c,
                zap: 1,
                nk: 1,
              });
          });
      },
    },
    storm: {
      t: 1.1,
      w: 7,
      cnt: 3,
      gap: 44,
      k: 1,
      c: "#ffe066",
      go: (t, a, s, e) => {
        t.hold = e.t;
        for (let n = 0; n < e.cnt; n++) {
          const l = clamp(s.x + (n - 1) * e.gap, 6, G.W - 6);
          addHaz({
            k: "line",
            x: l,
            y: G.top + 4,
            x2: l,
            y2: G.H - 4,
            w: e.w,
            t: e.t + 0.1 * n,
            dmg: a * e.k,
            src: t,
            c: e.c,
            zap: 1,
            nk: 1,
          });
        }
      },
    },
    wave: {
      t: 1.2,
      w: 12,
      k: 1,
      c: "#4ac0ff",
      go: (t, a, s, e) => {
        ((t.hold = e.t),
          addHaz({
            k: "line",
            x: 6,
            y: s.y,
            x2: G.W - 6,
            y2: s.y,
            w: e.w,
            t: e.t,
            dmg: a * e.k,
            src: t,
            c: e.c,
            nk: 1,
          }));
      },
    },
    tide: {
      t: 1.8,
      r: 30,
      pull: 26,
      k: 1.1,
      c: "#4ac0ff",
      go: (t, a, s, e) => {
        ((t.hold = e.t),
          addHaz({
            x: t.x,
            y: t.y,
            r: e.r,
            t: e.t,
            dmg: a * e.k,
            src: t,
            c: e.c,
            nk: 1,
            tk: (a, s) => {
              !G.dead && alive(t) && ssPull(G.pl, a.x, a.y, e.pull * s);
            },
          }));
      },
    },
    reap: {
      t: 1.4,
      r: 44,
      ri: 15,
      k: 1.1,
      c: "#b07aff",
      go: (t, a, s, e) => {
        ((t.hold = e.t),
          addHaz({
            x: t.x,
            y: t.y,
            r: e.r,
            ri: e.ri,
            t: e.t,
            dmg: a * e.k,
            src: t,
            c: e.c,
            nk: 1,
          }));
      },
    },
    souls: {
      cnt: 4,
      max: 8,
      ty: "soul",
      go: (t, a, s, e) => {
        if (G.mobs.filter((t) => t.add).length >= e.max)
          return castBossSk(t, "mark", a);
        for (let a = 0; a < e.cnt; a++) {
          const s = (a / e.cnt) * 6.283 + rf(0, 1),
            n = addMob(
              e.ty,
              t.lv,
              t.x + 18 * Math.cos(s),
              t.y + 12 * Math.sin(s),
              { sl: 1 },
            );
          (inArena(n), (n.ag = !0), (n.add = 1));
        }
        (G.flashes.push({ x: t.x, y: t.y - 10, t: 0, ring: 1, c: "#b07aff" }),
          sfx("boss"));
      },
    },
  }));
const DV_K = [];
const DV_JUDG = { cd: 8, r: 90 },
  DV_REIGN = { r: 40, max: 3 },
  DV_PRESS = { r: 40, max: 10 },
  DV_SOUL_CAP = 1;
Object.assign(UNIQUE, {
  jcrown: {
    n: "審判者頭冠",
    slot: "helm",
    hi: 2,
    ss: 1,
    v: [25, 10],
    lab: "對審判標記 {x0}（每轉移一次倍率 +{1}%）",
    hitMul: (t, a) =>
      a === G.jc.m
        ? t * (1 + (uv("jcrown", 0) + uv("jcrown", 1) * G.jc.n) / 100)
        : t,
    on: { tick: (t) => jcTick(t), kill: (t) => jcKill(t) },
    d: "標記生命最高的敵人，你對牠的傷害 {x0}；牠死亡時標記轉移至下一個生命最高的敵人，每轉移一次倍率再 +{1}%（最多 5 次）",
  },
  kingr: {
    n: "雷神之戒",
    slot: "ring",
    hi: 2,
    ss: 1,
    v: [100, 40],
    lab: "唯一的主動技能 {x0}",
    labOn: () => kingOn(),
    hitMul: (t, a, s) =>
      s.skill && kingOn() ? t * (1 + uv("kingr", 0) / 100) : t,
    mods: (t) => ({ kingCd: t(1) / 100 }),
    d: "技能格中僅有一顆主動技能時（光環不計），此技能傷害 {x0}、冷卻 −{1}%",
  },
  vortg: {
    n: "海神手套",
    slot: "gloves",
    hi: 2,
    ss: 1,
    v: [30, 20],
    lab: "對身邊的敵人 {x1}",
    hitMul: (t, a) =>
      dist(a, G.pl) <= VORT_R ? t * (1 + uv("vortg", 1) / 100) : t,
    on: { hit: (t, a, s, e) => vortHit(t, e) },
    d: "擊中時將敵人往你拉近 {0}% 距離；你身邊的敵人受到的傷害 {x1}",
  },
  abyssc: {
    n: "深淵騎士鎧甲",
    slot: "chest",
    hi: 2,
    ss: 1,
    v: [30, 4],
    on: { hurt: (t, a) => abyssHurt(a), tick: (t) => abyssTick(t) },
    d: "受到傷害的 {0}% 改為於 {1} 秒內逐漸扣除",
  },
  hwalk: {
    n: "闇答萊屍戰靴",
    slot: "boots",
    hi: 2,
    ss: 1,
    v: [10],
    lab: "每個靈魂倍率 +{0}%（菁英、Boss）",
    hitMul: (t, a) =>
      (a.elite || a.boss) && G.souls
        ? t * (1 + (G.souls * uv("hwalk", 0)) / 100)
        : t,
    on: {
      kill: (t) => {
        t.elite || t.boss || G.souls++;
      },
      hit: (t) => {
        (t.elite || t.boss) && G.souls && (G.souls = 0);
      },
    },
    d: "擊殺一般敵人時收集一個靈魂（無上限）；下一次擊中菁英或 Boss 時消耗所有靈魂：傷害 ×（1＋{0}% × 靈魂數）",
  },
  schain: {
    n: "靈魂手套",
    slot: "gloves",
    hi: 2,
    ss: 1,
    v: [50, 4],
    on: { hit: (t, a, s, e) => chainHit(t, a, e) },
    d: "擊中時將目標與最近的另一個敵人鎖鏈相連 {1} 秒；其中一方受到擊中傷害時，另一方也受到 {0}%",
  },
});
const VORT_R = 26,
  ART = { max: 100, need: (t) => 50 + 20 * t, kp: [1, 3, 25], dup: 5e3 },
  ARTS = {
    zeus: {
      n: "雷神索爾雷霆",
      god: 0,
      ic: "artZ",
      st: "crit",
      per: 0.1,
      cd: 0.25,
      k: 0.5,
      r: 60,
      n2: [2, 4],
      stun: 0.3,
      aw: 10,
    },
    posei: {
      n: "海神三叉戟",
      god: 1,
      ic: "artP",
      st: "area",
      per: 0.2,
      cd: 8,
      t: [3, 6],
      r: [26, 34],
      vk: 0.1,
      cap: 1,
      pull: 50,
    },
    hades: {
      n: "闇答萊屍冥府權杖",
      god: 2,
      ic: "artH",
      st: "lifep",
      per: 0.2,
      p: 0.25,
      cap: [5, 10, 10],
      t: [7, 12, 12],
      as: [0.8, 0.8, 0.6],
      k: 1,
      spd: 55,
      spl: { k: 0.6, r: 22 },
    },
  },
  artStage = (t) => (t >= ART_LV[2] ? 2 : t >= ART_LV[1] ? 1 : 0),
  artStat = (t, a) => Math.round(ARTS[t].per * a * 10) / 10;
function artRows(t, a) {
  const s = ARTS[t],
    e = artStage(a),
    n = ["屬性", AFFIX[s.st].f(artStat(t, a))];
  return "zeus" === t
    ? [
        n,
        ["觸發", "暴擊時召喚落雷"],
        ["目標", `附近 ${s.n2[e ? 1 : 0]} 個敵人`],
        ["傷害", `觸發擊中傷害的 ${100 * s.k}%`],
        ["間隔", `每 ${s.cd} 秒最多一次`],
        ...(2 === e
          ? [
              ["暈眩", `${s.stun} 秒`],
              ["覺醒", `每第 ${s.aw} 道落雷擊中所有敵人`],
            ]
          : []),
      ]
    : "posei" === t
      ? [
          n,
          ...(2 === e
            ? [
                ["漩渦", "2 個，跟隨最密集的敵群移動"],
                ["持續", "永不消失（覺醒）"],
              ]
            : [
                ["漩渦", `每 ${s.cd} 秒出現在最密集處`],
                ["持續", `${s.t[0]} 秒`],
              ]),
          ["半徑", `${s.r[e ? 1 : 0]}`],
          ["拉扯", "將敵人拉向中心"],
          ["易傷", `每停留 1 秒 +${100 * s.vk}%（最多 +${100 * s.cap}%）`],
        ]
      : [
          n,
          ["觸發", `擊殺時 ${100 * s.p}% 機率召喚亡靈戰士`],
          ["數量", `最多 ${s.cap[e]} 隻＋召喚物數量`],
          ["持續", `${s.t[e]} 秒`],
          ["攻擊", `每 ${s.as[e]} 秒近戰一次`],
          ["傷害", `武器傷害的 ${100 * s.k}%`],
          ...(2 === e
            ? [["覺醒", 100 * s.spl.k + "% 傷害擴散增幅到附近敵人"]]
            : []),
        ];
}
function artStep(t) {
  const a = ARTS[t];
  return "zeus" === t
    ? [
        `落雷擊中 ${a.n2[0]} 個敵人`,
        `落雷擊中 ${a.n2[1]} 個敵人`,
        `暈眩・每 ${a.aw} 道全體落雷`,
      ]
    : "posei" === t
      ? [
          `漩渦半徑 ${a.r[0]}・${a.t[0]} 秒`,
          `漩渦半徑 ${a.r[1]}・${a.t[0]} 秒`,
          "2 個永恆漩渦",
        ]
      : [
          `最多 ${a.cap[0]} 隻亡靈・${a.t[0]} 秒`,
          `最多 ${a.cap[1]} 隻亡靈・${a.t[1]} 秒`,
          `每 ${a.as[2]} 秒攻擊・傷害擴散增幅`,
        ];
}
const ART_LV = [1, 50, 100],
  ART_SN = ["初始", "進化", "覺醒"],
  GUARD = [
    {
      n: "獸人英雄",
      mx: 3,
      c: "#7ad46a",
      bt: "gd0",
      tk: "古樹印記",
      fr: "古樹碎片",
      uq: "roots",
      mech: "adds",
      ks: ["roots", "charge"],
      d: "定期召喚爪牙，爪牙存活時守護者受到的傷害大減",
    },
    {
      n: "伊夫利特",
      mx: 7,
      c: "#ff8a3a",
      bt: "gd1",
      tk: "熔核印記",
      fr: "熔核碎片",
      uq: "magma",
      mech: "slam",
      ks: ["meteor", "volley"],
      d: "定期蓄力重擊，紅圈內受到巨大傷害",
    },
    {
      n: "冰暴騎士",
      mx: 10,
      c: "#9ab0ff",
      bt: "gd2",
      tk: "星穹印記",
      fr: "星穹碎片",
      uq: "astral",
      mech: "shield",
      ks: ["cross", "mark"],
      d: "定期展開護盾，未及時擊破將回復生命",
    },
  ],
  GD_SK = { cd: 3.4, first: 3, k: 2.2 },
  END_AS = 0.75,
  SK_N = {
    slam: "震地",
    mark: "星墜",
    charge: "衝撞",
    volley: "彈幕",
    roots: "纏根",
    meteor: "熔岩雨",
    cross: "星光十字",
    bolt: "落雷",
    storm: "雷牆",
    wave: "海嘯",
    tide: "漩渦",
    reap: "冥鐮",
    souls: "招魂",
  },
  GUARD_T = 140,
  GUARD_HP = 2.6,
  GUARD_DMG = 1.5,
  GUARD_UQ = 0.15,
  GUARD_TK = [0.0012, 0.012, 0.18],
  GUARD_ADD = { n: 3, cd: 6.5, dr: 0.4, max: 6 },
  GUARD_SLAM = { cd: 4, t: 1.2, r: 36, k: 4 },
  GUARD_SH = { cd: 10, v: 0.08, t: 6, h: 1 },
  FINAL = {
    n: "巴風特",
    c: "#e0445a",
    bt: "fin",
    uq: ["omni", "endb"],
    title: "終焉征服者",
    ks: ["cross", "roots", "meteor", "charge"],
    cd: 2.5,
    k: 2.6,
  },
  FINAL_T = 210,
  FINAL_HP = 3.7,
  FINAL_DMG = 1.6,
  FINAL_UQ = 0.2,
  MONARCH = {
    n: "闇答萊屍",
    c: "#b07aff",
    bt: "mon",
    title: "君主殺手",
    mk: 5,
    rt: 7,
    rd: 1.25,
    ks: ["cross", "meteor", "roots", "charge", "volley", "mark"],
    cd: 2,
    k: 2.8,
  },
  MON_T = 270,
  MON_HP = 9.25,
  MON_DMG = 1.6 * 1.6,
  MON_MY = 0.001,
  MON_MIR = 0.35,
  MON_MAT = { n: 10, w: { x4: 25, i3: 20, p2: 15, s1: 15, r1: 15, c1: 10 } },
  MYTHR_BEST = 3,
  MON_G = 4,
  MK_P = (t) => Math.min(1, 0.5 + 0.05 * Math.max(0, Math.floor(t / 10) - 1)),
  MK_FL = (t) => Math.min(1, 0.01 + 0.005 * (t - 1)),
  gdef = (t) => (4 === t ? MONARCH : GUARD[t] || FINAL),
  ARENA = {
    dummy: {
      n: "訓練場",
      v: {
        k: "tiles",
        p: ["#1c2418", "#2a3622", "#38462c", "#4c5c38"],
        q: ["#1c2418", "#2a3622", "#38462c"],
        pool: null,
        d: "runes",
        pr: "pillar",
        amb: [0.42, 22, 30, 12],
        sl: 0,
        ring: "#9ad870",
      },
    },
    trial: {
      n: "試煉聖殿",
      v: {
        k: "tiles",
        p: ["#2e2418", "#4a3c26", "#5c4c30", "#76623e"],
        q: ["#2e2418", "#4a3c26", "#5c4c30"],
        pool: null,
        d: "runes",
        pr: "pillar",
        amb: [0.42, 34, 22, 8],
        sl: 0,
        ring: "#ffd84a",
      },
    },
    g0: {
      n: "古樹祭壇",
      v: {
        k: "grass",
        p: ["#16301c", "#204428", "#2c5a32", "#447a42"],
        q: ["#16301c", "#204428", "#2c5a32"],
        pool: ["#123a30", "#1e5a44", "#6ad0a0"],
        glow: 1,
        d: "mush",
        pr: "tree",
        amb: [0.52, 8, 28, 18],
        sl: 0,
        ring: "#7ad46a",
      },
    },
    g1: {
      n: "熔核深淵",
      v: {
        k: "cave",
        p: ["#1a0e0c", "#2a1410", "#3a1c14", "#4e261a"],
        q: ["#1a0e0c", "#2a1410", "#3a1c14"],
        pool: ["#d8443a", "#ff8a30", "#ffe080"],
        glow: 1,
        d: "ember",
        pr: "rock",
        amb: [0.56, 40, 6, 4],
        sl: 1,
        ring: "#ff8a3a",
      },
    },
    g2: {
      n: "星穹之頂",
      v: {
        k: "tiles",
        p: ["#12162c", "#1a2040", "#242c54", "#343e70"],
        q: ["#12162c", "#1a2040", "#242c54"],
        pool: null,
        d: "stars",
        pr: "obelisk",
        amb: [0.56, 10, 14, 48],
        sl: 4,
        ring: "#9ab0ff",
      },
    },
    tw: {
      n: "無盡之塔",
      v: {
        k: "tiles",
        p: ["#0e1420", "#16202e", "#1e2c3e", "#2c3e56"],
        q: ["#0e1420", "#16202e", "#1e2c3e"],
        pool: ["#141a3a", "#3a2a6a", "#b07aff"],
        glow: 1,
        d: "runes",
        pr: "obelisk",
        amb: [0.6, 16, 10, 40],
        sl: 4,
        ring: "#b07aff",
      },
    },
    mon: {
      n: "無限王庭",
      v: {
        k: "tiles",
        p: ["#0a0a1c", "#12122c", "#1c1a40", "#2c2860"],
        q: ["#0a0a1c", "#12122c", "#1c1a40"],
        pool: ["#1a1240", "#4a2a8a", "#d0b0ff"],
        glow: 1,
        d: "stars",
        pr: "obelisk",
        amb: [0.64, 14, 6, 44],
        sl: 4,
        ring: "#b07aff",
      },
    },
    fin: {
      n: "終焉王座",
      v: {
        k: "tiles",
        p: ["#120810", "#1e0e18", "#2a1422", "#3c1c30"],
        q: ["#120810", "#1e0e18", "#2a1422"],
        pool: ["#2a0814", "#6a1630", "#e0445a"],
        glow: 1,
        d: "runes",
        pr: "obelisk",
        amb: [0.62, 30, 4, 16],
        sl: 4,
        ring: "#e0445a",
      },
    },
  },
  ARENA_OUT = 5,
  ARENA_OUT_F = 4,
  TRN = {
    t: ["一般", "菁英", "Boss"],
    n: [1, 3, 6],
    m: ["不死", "會死亡"],
    r: [0, 1, 3],
    p: ["固定", "可推動"],
    a: ["不攻擊", "會攻擊"],
    dmg: 1.2,
  },
  TW = {
    lv: 90,
    t: 60,
    bt: 30,
    cap: 6,
    hp: 1.1,
    dmg: 1.05,
    boss: 10,
    bhp: 0.4,
    rest: 2.5,
    heal: 0.25,
    out: 8,
    cb: 0.5,
    ct: 15,
  },
  twK = (t) => Math.min(30, 12 + Math.floor(t / 4)),
  twC = (t) => Math.min(0.4, 0.04 + 0.003 * t),
  twH = (t) => twC(t) / 2,
  TW_HB = TW.cb / 2,
  TW_RULES = [
    "sl_hp",
    "sl_dmg",
    "sl_spd",
    "sl_shld",
    "sl_heal",
    "sl_boom",
    "sl_cd",
    "sl_eaf",
    "sl_rx",
  ],
  TW_MS = (t) => ({ c1: 1 + t / 20, s1: 1, r1: 1 }),
  twCheck = (t) => Math.max(1, 10 * Math.floor(t / 10) + 1),
  COR = {
    w: [30, 35, 15, 20],
    n: ["升階", "數值變化", "無變化", "降階"],
    val: [0.85, 1.25],
    uq: { up: [1.1, 1.3], val: [0.8, 1.3], down: [0.7, 0.9] },
  },
  garena = (t) => ARENA[GUARD[t] ? "g" + t : 4 === t ? "mon" : "fin"],
  guardOf = (t) => (t >= MAP_N ? -1 : GUARD.findIndex((a) => t <= a.mx)),
  SLATE_LV = 90,
  SLATE_KILL = 1e3,
  SLATE_MAX = 5e3,
  RUNE_MAX = 5e3,
  SLATE_DROP = 0.003,
  slateLv = (t) => (ssMap(t) ? SEASON.lv : 83 + Math.round(0.7 * t)),
  slateCap = (t) => 3,
  endF = (t) => clamp(0.3 + 0.1 * (t - 83), 0.3, 1),
  legF = (t) => (t > 83 ? 1 + Math.min(1, (t - 83) / 7) : 1),
  SLATE = [
    { n: "群聚石板", k: "dens", r: [4, 8], f: (t) => `怪物數量上限 +${t}` },
    { n: "精英石板", k: "elite", r: [4, 8], f: (t) => `菁英怪機率 +${t}%` },
    { n: "狩獵石板", k: "spawn", r: [20, 40], f: (t) => `怪物生成速度 +${t}%` },
    {
      n: "萬軍石板",
      k: "horde",
      r: [1, 1],
      my: 1,
      ic: "myHorde",
      f: (t) =>
        `怪物數量上限 +${HORDE.dens * t}・生成速度 +${100 * HORDE.spawn * t}%`,
    },
  ],
  SLATE_N = 3,
  HORDE = { dens: 50, spawn: 3 },
  SLATE_BOSS = 200,
  bossNeed = (t) => ("function" == typeof roBossNeed ? roBossNeed(t) : t < MAP_N && slatesOn(t).length ? 200 : 30 + 10 * t),
  bossReady = () =>
    ssMap()
      ? S.ssf.some((t) => t >= SS.fragN)
      : S.prog[S.map] >= bossNeed(S.map),
  QUESTS = [
    {
      d: "將技能寶石放入技能格",
      hint: "至「技能」分頁點選寶石，再點選格子放置",
      k: "place",
      n: 1,
      rw: { pot: 5 },
    },
    { d: "擊殺 15 隻怪物", k: "kill", n: 15, rw: { gem: 2 } },
    {
      d: "穿上一件裝備",
      hint: "到「背包」點選裝備後按「裝備」",
      k: "equip",
      n: 1,
      rw: { ash: 60 },
    },
    {
      d: "將輔助寶石放在主動技能旁",
      hint: "輔助寶石只影響相鄰（上下左右）的主動技能",
      k: "link",
      n: 1,
      rw: { pot: 5 },
    },
    {
      d: "分解 3 件裝備",
      hint: "分解可獲得Zeny，用於向商人購買物品",
      k: "salvage",
      n: 3,
      rw: { ash: 80 },
    },
    {
      d: "擊敗普隆德拉南門的 Boss",
      hint: "擊殺 30 隻怪物後，按戰鬥畫面右下角的 BOSS 按鈕",
      k: "boss",
      n: 1,
      rw: { gem: 1 },
    },
    { d: "到達 10 級", k: "level", n: 10, rw: { gem: 3, pot: 5 } },
    { d: "到達 15 級", k: "level", n: 15, rw: { gem: 4 } },
    {
      d: "擊敗妙勒尼礦坑的 Boss",
      hint: "擊敗後開放「煉金」",
      k: "boss",
      m: 2,
      n: 1,
      rw: { mat: { x1: 3, i1: 1, p1: 1 } },
    },
    { d: "到達 22 級", k: "level", n: 22, rw: { gem: 5, ash: 150 } },
    { d: "到達 30 級", k: "level", n: 30, rw: { ash: 200 } },
    {
      d: "完成覺醒試煉並選擇轉職分支",
      hint: "到「地圖」分頁上方的「轉職試煉」開始挑戰",
      k: "trial",
      n: 1,
      rw: { pot: 10 },
    },
    {
      d: "完成鍛鍊試煉（45 級開放）",
      hint: "到「地圖」分頁上方的「轉職試煉」開始挑戰",
      k: "trial",
      n: 2,
      rw: { ash: 400 },
    },
    {
      d: "完成征服試煉（60 級開放）",
      hint: "到「地圖」分頁上方的「轉職試煉」開始挑戰",
      k: "trial",
      n: 3,
      rw: { ash: 800 },
    },
    {
      d: "完成巔峰試煉（75 級開放）",
      hint: "到「地圖」分頁上方的「轉職試煉」開始挑戰",
      k: "trial",
      n: 4,
      rw: { ash: 1500 },
    },
  ],
  INK = "#1b1424",
  HERO = {
    HD: [
      "................",
      ".....kkkkkk.....",
      "....khhhhhhk....",
      "...khhhhhhhhk...",
      "...khsssssshk...",
      "...ksessssesk...",
      "...kssssssssk...",
      "....kssssssk....",
    ],
    HU: [
      "................",
      ".....kkkkkk.....",
      "....khhhhhhk....",
      "...khhhhhhhhk...",
      "...khhhhhhhhk...",
      "...khhhhhhhhk...",
      "...khhhhhhhhk...",
      "....khhhhhhk....",
    ],
    HS: [
      "................",
      "....kkkkkk......",
      "...khhhhhhk.....",
      "..khhhhhhhhk....",
      "..khhhhhssssk...",
      "..khhhhsssesk...",
      "..khhhssssssk...",
      "...khhkssssk....",
    ],
    BD: [
      "...kbbbwwbbbk...",
      "..ksbbbbbbbbsk..",
      "..kSBbbbbbbBSk..",
      "...kggggggggk...",
      "...kBBBBBBBBk...",
    ],
    BU: [
      "...kbbbbbbbbk...",
      "..ksbbbbbbbbsk..",
      "..kSBbbbbbbBSk..",
      "...kggggggggk...",
      "...kBBBBBBBBk...",
    ],
    BS: [
      "....kbbbbwk.....",
      "...kbbbbbbsk....",
      "...kBbbbbbSk....",
      "...kggggggk.....",
      "...kBBBBBBk.....",
    ],
    LD: [
      ["....kllkkllk....", "....kllkkllk....", "....kkk..kkk...."],
      ["....kllkkllk....", "....kkkkkllk....", "........kkkk...."],
      ["....kllkkllk....", "....kllkkkkk....", "....kkkk........"],
    ],
    LS: [
      ["....kllkllk.....", "....kllkllk.....", "....kkkkkkk....."],
      ["...kllk.kllk....", "..kllk...kllk...", "..kkk.....kkk..."],
      ["....kllkllk.....", "....kllkllk.....", "....kkkkkkk....."],
    ],
  },
  HERO_PAL = {
    sword: {
      k: INK,
      h: "#6b3f2a",
      s: "#f2c29b",
      S: "#c98a6b",
      e: INK,
      b: "#3e6fd1",
      B: "#25438a",
      w: "#f4efe6",
      g: "#e8b84a",
      l: "#4a3428",
    },
    bow: {
      k: INK,
      h: "#3f8a4a",
      s: "#f2c29b",
      S: "#c98a6b",
      e: INK,
      b: "#7a9a3e",
      B: "#4a6226",
      w: "#d8c8a0",
      g: "#8a5a32",
      l: "#4a3428",
    },
    mage: {
      k: INK,
      h: "#d8d0ec",
      s: "#f2c29b",
      S: "#c98a6b",
      e: INK,
      b: "#7a52c8",
      B: "#4a3290",
      w: "#ffd84a",
      g: "#ffd84a",
      l: "#4a3290",
    },
  },
  HAT = [
    ".....kk.....",
    "....kppk....",
    "...kpppPk...",
    "...kppPPk...",
    "..kpppPPPk..",
    ".kyyyyyyyyk.",
    "kpppppppppPk",
    ".kkkkkkkkkk.",
  ],
  HAT_PAL = { k: INK, p: "#8a62d8", P: "#563a9e", y: "#ffd84a" },
  FIST_SPR = [
    "...kkkkkkk...",
    "...krrrrrk...",
    "..kkkkkkkkk..",
    ".khhhhgggggk.",
    "khhggggggggdk",
    "khggggggggddk",
    "kgggggggggddk",
    "kggkggkggkgdk",
    "kggkggkggkgdk",
    "khgkhgkhgkhdk",
    "kddkddkddkddk",
    ".kkkkkkkkkkk.",
  ],
  FIST_PAL = [
    { k: INK, r: "#e0445a", h: "#fff2a0", g: "#e8b84a", d: "#a8742a" },
    { k: INK, r: "#3a2a6a", h: "#e8d0ff", g: "#b48aff", d: "#6a3ad0" },
  ],
  HOOD_TIP = ["..kk", ".khk", "khhk", ".kk."],
  ASC_PAL = {
    w: "#e8dcc0",
    m: "#b4b8c4",
    M: "#6a6e7a",
    r: "#d8303a",
    d: "#55556a",
    D: "#33333e",
    v: "#6ab04a",
    V: "#3a6a2a",
    c: "#8a6232",
    C: "#5a3e1e",
    f: "#e04a3a",
    x: "#3a2a4a",
    X: "#1a1222",
    e: "#d8a0ff",
    o: "#9ae4ff",
    O: "#3a8ad0",
    y: "#ffd84a",
    F: "#ff8a2a",
  },
  ASC_ART = {
    bers: {
      y0: 2,
      d: [
        "................",
        ".kk..........kk.",
        ".kwk........kwk.",
        "..kwkkkkkkkkwk..",
        "...kmmmmmmmmk...",
        "...kmMMMMMMmk...",
        "................",
        "................",
        ".....r....r.....",
      ],
      u: [
        "................",
        ".kk..........kk.",
        ".kwk........kwk.",
        "..kwkkkkkkkkwk..",
        "...kmmmmmmmmk...",
        "...kmMMMMMMmk...",
      ],
      s: [
        "................",
        "kk..........kk..",
        "kwk........kwk..",
        ".kwkkkkkkkkwk...",
        "..kmmmmmmmmk....",
        "..kmMMMMMMmk....",
        "................",
        "................",
        "..........r.....",
      ],
    },
    guard: {
      y0: 2,
      d: [
        ".......kk.......",
        "......krrk......",
        ".....kkrrkk.....",
        "....kmmmmmmk....",
        "...kmmmmmmmmk...",
        "...kmmmmmmmmk...",
        "...kmMMMMMMmk...",
        "...kmkkkkkkmk...",
        "...kmmmmmmmmk...",
        "....kmmmmmmk....",
        "kkkk............",
        "kmrk............",
        "kmrk............",
        ".kk.............",
      ],
      u: [
        ".......kk.......",
        "......krrk......",
        ".....kkrrkk.....",
        "....kmmmmmmk....",
        "...kmmmmmmmmk...",
        "...kmmmmmmmmk...",
        "...kmMMMMMMmk...",
        "...kmmmmmmmmk...",
        "...kmmmmmmmmk...",
        "....kmmmmmmk....",
        "............kkkk",
        "............kmrk",
        "............kmrk",
        ".............kk.",
      ],
      s: [
        "......kk........",
        ".....krrk.......",
        "....kkrrkk......",
        "...kmmmmmmk.....",
        "..kmmmmmmmmk....",
        "..kmmmmmmmmk....",
        "..kmmmMMMMMk....",
        "..kmmmmkkkkk....",
        "..kmmmmmmmmk....",
        "...kmmmmmmk.....",
        "...kkkk.........",
        "...kmrk.........",
        "...kmrk.........",
        "....kk..........",
      ],
    },
    blade: {
      y0: 3,
      d: [
        ".......kk.......",
        "......khhk......",
        "................",
        "................",
        "...kbbbbbbbbkbk.",
        "............kbbk",
        ".............kbk",
        "..............kk",
      ],
      s: [
        "......kk........",
        ".....khhk.......",
        "................",
        "................",
        ".kbkbbbbbbbbk...",
        "kbbk............",
        "kbk.............",
        "kk..............",
      ],
    },
    snipe: {
      y0: 4,
      d: [
        ".....kkkkkk.....",
        "....kddddddk....",
        "...kddddddddk...",
        "..kddddddddddk..",
        "..kd........dk..",
        "..kd......r.dk..",
        "..kd........dk..",
        "...kd......dk...",
        "....kddddddk....",
      ],
      u: [
        ".....kkkkkk.....",
        "....kddddddk....",
        "...kddddddddk...",
        "..kddddddddddk..",
        "..kddddddddddk..",
        "..kddddddddddk..",
        "..kddddddddddk..",
        "...kddddddddk...",
        "....kddddddk....",
      ],
      s: [
        "....kkkkkk......",
        "...kddddddk.....",
        "..kddddddddk....",
        ".kddddddddddk...",
        ".kdddddd....k...",
        ".kdddddd..r.k...",
        ".kdddddd....k...",
        "..kddddd...k....",
        "...kddddddk.....",
      ],
    },
    venom: {
      y0: 6,
      d: [
        "....kvvvvvvk....",
        "...kvvvvvvvvk...",
        "................",
        "................",
        "...kvvvvvvvvk...",
        "....kvVvvVvk....",
      ],
      u: [
        "....kvvvvvvk....",
        "...kvvvvvvvvk...",
        "................",
        "................",
        ".......kvk......",
        "......kvVvk.....",
      ],
      s: [
        "...kvvvvvvk.....",
        "..kvvvvvvvvk....",
        "................",
        "................",
        ".......kvvvvk...",
        "........kvvk....",
      ],
    },
    ranger: {
      y0: 2,
      d: [
        ".............k..",
        "............kfk.",
        ".....kkkkkk.kfk.",
        "....kcccccckfk..",
        "...kcccccccckk..",
        "..kCCCCCCCCCCk..",
      ],
      s: [
        "............k...",
        "...........kfk..",
        "....kkkkkk.kfk..",
        "...kcccccckfk...",
        "..kcccccccckk...",
        "..kCCCCCCCCCCCk.",
      ],
    },
    elem: {
      hat: null,
      y0: 0,
      d: [
        ".......y........",
        "......y..y......",
        ".....yF..Fy.....",
        "....kFFyyFFk....",
        "...kFrFFFFrFk...",
        "...krrFrrFrrk...",
        "....kyyyryyk....",
      ],
    },
    summ: {
      hat: null,
      y0: 0,
      d: [
        ".......k........",
        "......kok.......",
        ".....kooOk......",
        "..k...kOk....k..",
        ".kok...k....kok.",
        "kooOk......kooOk",
        ".kOk........kOk.",
        "..k..........k..",
        "..kh........hk..",
        "..kh........hk..",
        "..kh........hk..",
        "..khk......khk..",
        "..kOOOOOOOOOOk..",
        "...kO......Ok...",
      ],
    },
    hex: {
      hat: null,
      y0: 2,
      d: [
        ".......kk.......",
        "......kxxk......",
        ".....kxxxxk.....",
        "....kxxxxxxk....",
        "...kxxxxxxxxk...",
        "..kxxxxxxxxxxk..",
        "..kxXXXXXXXXxk..",
        "..kxXeXXXXeXxk..",
        "..kxXXXXXXXXxk..",
        "...kxXXXXXXxk...",
        "....kxxxxxxk....",
      ],
      u: [
        ".......kk.......",
        "......kxxk......",
        ".....kxxxxk.....",
        "....kxxxxxxk....",
        "...kxxxxxxxxk...",
        "..kxxxxxxxxxxk..",
        "..kxxxxxxxxxxk..",
        "..kxxxxxxxxxxk..",
        "..kxxxxxxxxxxk..",
        "...kxxxxxxxxk...",
        "....kxxxxxxk....",
      ],
      s: [
        "......kk........",
        ".....kxxk.......",
        "....kxxxxk......",
        "...kxxxxxxk.....",
        "..kxxxxxxxxk....",
        ".kxxxxxxxxxxk...",
        ".kxxxxxXXXXXk...",
        ".kxxxxxXXXeXk...",
        ".kxxxxxXXXXXk...",
        "..kxxxxXXXXk....",
        "...kxxxxxxk.....",
      ],
    },
  },
  MSPR = {
    dummy: {
      pal: {
        s: "#e0c070",
        S: "#a88a40",
        w: "#9a6a3a",
        W: "#5a3a22",
        r: "#c04a3a",
        f: "#f4efe6",
      },
      f: [
        [
          "...sssss...",
          "..ssSsSss..",
          "..sssssss..",
          "...sSSSs...",
          "WwwwsssswwW",
          "...srrrs...",
          "...rrfrr...",
          "...srrrs...",
          "...sSsSs...",
          "....wWw....",
          "....wWw....",
          "....wWw....",
          "...WwWwW...",
          "..WWWWWWW..",
        ],
        [
          "...sssss...",
          "..sSsssSs..",
          "..sssssss..",
          "...sSSSs...",
          "WwwwsssswwW",
          "...srrrs...",
          "...rrfrr...",
          "...srrrs...",
          "...sSsSs...",
          "....wWw....",
          "....wWw....",
          "....wWw....",
          "...WwWwW...",
          "..WWWWWWW..",
        ],
      ],
    },
    wolf: {
      pal: {
        a: "#8a8a9c",
        A: "#5a5a6e",
        c: "#c4c4d4",
        r: "#ff5a6a",
        w: "#f4efe6",
      },
      f: [
        [
          "...........c...",
          "..........cc...",
          "c.........caa..",
          ".ccccccccaaraaa",
          "..aaaaaaaaaaaww",
          "..aaaaaaaaaA...",
          "..AA.A...AA.A..",
          "..A..A...A..A..",
        ],
        [
          "...........c...",
          "..........cc...",
          "..........caa..",
          "cccccccccaaraaa",
          ".aaaaaaaaaaaaww",
          "..aaaaaaaaaA...",
          "...AA.A.AA.A...",
          "...A..A.A..A...",
        ],
      ],
    },
    goblin: {
      pal: {
        g: "#6cb04a",
        G: "#3e7a2a",
        y: "#ffe040",
        b: "#9a6a3a",
        B: "#5a3a22",
        s: "#d0d4e0",
      },
      f: [
        [
          "g.........g",
          "gg.ggggg.gg",
          ".ggggggggg.",
          "..gyggggy..",
          "..ggGGGgg..",
          "...ggggg..s",
          "..bbbbbbb.s",
          ".gbbbbbbbgs",
          ".g.BbbbB.g.",
          "...bb.bb...",
          "...GG.GG...",
        ],
        [
          "g.........g",
          "gg.ggggg.gg",
          ".ggggggggg.",
          "..gyggggy..",
          "..ggGGGgg..",
          "...ggggg...",
          "..bbbbbbb..",
          ".gbbbbbbbgs",
          ".g.BbbbB.gs",
          "..bb...bb.s",
          "..GG...GG..",
        ],
      ],
    },
    bat: {
      pal: { p: "#7a4bb0", P: "#4a2a70", e: "#ff5a6a" },
      f: [
        [
          "p............p",
          "pp..........pp",
          "ppp..p..p..ppp",
          ".pppppppppppp.",
          "..ppeppppepp..",
          "...PPppppPP...",
          ".....pPPp.....",
        ],
        [
          "..............",
          ".....p..p.....",
          "....pppppp....",
          "...ppeppepp...",
          ".pppppppppppp.",
          "pppPPppppPPppp",
          "pp...PppP...pp",
        ],
      ],
    },
    skeleton: {
      pal: { w: "#e8e4d8", W: "#a8a49a", r: "#ff5040", s: "#b8bcc8" },
      f: [
        [
          "...wwwww...",
          "..wwwwwww..",
          "..wrwwwrw..",
          "..wwwwwww..",
          "...wWwWw...",
          "....www....",
          ".wwwWwWwww.",
          ".w.wWwWw.w.",
          ".w..www..ws",
          "....WwW...s",
          "...ww.ww..s",
          "...w...w...",
          "..ww...ww..",
        ],
        [
          "...wwwww...",
          "..wwwwwww..",
          "..wrwwwrw..",
          "..wwwwwww..",
          "...wWwWw...",
          "....www....",
          ".wwwWwWwww.",
          ".w.wWwWw.ws",
          ".w..www...s",
          "....WwW...s",
          "...ww.ww...",
          "..w.....w..",
          ".ww.....ww.",
        ],
      ],
    },
    golem: {
      pal: {
        a: "#8a7a6a",
        A: "#5a4e44",
        c: "#b0a090",
        y: "#ffd040",
        m: "#6a9a4a",
      },
      f: [
        [
          "....ccccccc....",
          "...caaaaaaaA...",
          "...ayyaaayyA...",
          "...aaaaaaaaA...",
          "cc.AAaaaaaAA.cc",
          "caacaaaaaaaaaaA",
          "caa.aammaaaa.aA",
          "aaA.aaaaaaaA.aA",
          "AA..aaaaaaaA..A",
          "....aaA.aaaA...",
          "....aaA.aaA....",
          "...AAAA..AAAA..",
        ],
        [
          "....ccccccc....",
          "...caaaaaaaA...",
          "...ayyaaayyA...",
          "...aaaaaaaaA...",
          "cc.AAaaaaaAA.cc",
          "caacaaaaaaaaaaA",
          "caa.aammaaaa.aA",
          "aaA.aaaaaaaA.aA",
          "AA..aaaaaaaA..A",
          "....aaA.aaaA...",
          "...aaA...aaA...",
          "..AAAA...AAAA..",
        ],
      ],
    },
    imp: {
      pal: {
        r: "#e0503a",
        R: "#8a2a22",
        y: "#ffe040",
        h: "#f4efe6",
        b: "#5a1a3a",
      },
      f: [
        [
          "...h....h...",
          "...hrrrrh...",
          "b..ryrryr..b",
          "bb.rrrrrr.bb",
          "bbb.rRRr.bbb",
          ".bbrrrrrrbb.",
          "..brrrrrrb..",
          "....rRRr....",
          "...rr..rr...",
          "...R....R.rr",
        ],
        [
          "...h....h...",
          "b..hrrrrh..b",
          "bb.ryrryr.bb",
          ".bbrrrrrrbb.",
          "..b.rRRr.b..",
          "...rrrrrr...",
          "...rrrrrr...",
          "....rRRr....",
          "...rr..rr..r",
          "...R....R.r.",
        ],
      ],
    },
    knight: {
      pal: {
        a: "#4e4e62",
        A: "#2e2e3e",
        c: "#7a7a94",
        e: "#7ad4ff",
        r: "#9a2a3e",
        s: "#d0d4e0",
      },
      f: [
        [
          "....ccccc....",
          "...caaaaaA...",
          "...aeeaeeA...",
          "...aaaaaaA...",
          "..ccaaaaaAA..",
          ".caarrrrraaA.",
          ".aaarrrrraaAs",
          ".aa.rrrrr.aAs",
          ".aA.raaar.aAs",
          "....aa.aa..As",
          "....aA.aA....",
          "...aaA.aaA...",
        ],
        [
          "....ccccc....",
          "...caaaaaA...",
          "...aeeaeeA...",
          "...aaaaaaA...",
          "..ccaaaaaAA..",
          ".caarrrrraaA.",
          ".aaarrrrraaA.",
          ".aa.rrrrr.aAs",
          ".aA.raaar.aAs",
          "...aa...aa.As",
          "...aA...aA..s",
          "..aaA...aaA..",
        ],
      ],
    },
    gd0: {
      pal: {
        l: "#7a5838",
        L: "#4a3426",
        g: "#5ab04a",
        G: "#2e7a34",
        m: "#a8e070",
        y: "#ffe040",
      },
      f: [
        [
          ".....gggggg.....",
          "...ggmgggggGg...",
          "..gggggGggmgggg.",
          ".ggGgggggggGggg.",
          ".gggGggmggGgggG.",
          "..GgggLlllgggG..",
          "....LllllllL....",
          "....lyllllyl....",
          "..l.lllLllll.l..",
          ".ll.llllllLl.ll.",
          ".g..llLlllll..g.",
          "....lllllLll....",
          "....llLlllll....",
          "...Lll.LLl.lL...",
          "..LL...LL...LL..",
          ".LL....L.....LL.",
        ],
        [
          ".....gggggg.....",
          "...ggmgggggGg...",
          "..gggggGggmgggg.",
          ".ggGgggggggGggg.",
          ".gggGggmggGgggG.",
          "..GgggLlllgggG..",
          "....LllllllL....",
          "....lyllllyl....",
          ".l..lllLllll..l.",
          ".ll.llllllLl.ll.",
          "g...llLlllll...g",
          "....lllllLll....",
          "....llLlllll....",
          "...Lll.LLl.lL...",
          "...LL..LL..LL...",
          "..LL...L....LL..",
        ],
      ],
    },
    gd1: {
      pal: { a: "#4a3a3a", A: "#2a2024", o: "#ff8a3a", y: "#ffd040" },
      f: [
        [
          ".....aaaaaa.....",
          "....aaoaaaaA....",
          "....ayyaayyA....",
          "....aaaoaaaA....",
          "aaa.AaaaaaAA.aaa",
          "aoaaaaaoaaaaaaoa",
          "aaA.aaoyyoaA.Aaa",
          "aoA.aoyyyyoA.Aoa",
          "AA..aaoyyoaA..AA",
          "....aAaoaaAA....",
          "....aaA..aaA....",
          "...aoA....aoA...",
          "...aaA....aaA...",
          "..AAA.....AAAA..",
        ],
        [
          ".....aaaaaa.....",
          "....aaoaaaaA....",
          "....ayyaayyA....",
          "....aaaoaaaA....",
          "aoa.AaaaaaAA.aoa",
          "aaaaaaaoaaaaaaaa",
          "aaA.aaoyyoaA.Aaa",
          "aoA.aoyoyyoA.Aoa",
          "AA..aaoyyoaA..AA",
          "....aAaoaaAA....",
          "....aaA..aaA....",
          "....aoA..aoA....",
          "....aaA..aaA....",
          "...AAA...AAAA...",
        ],
      ],
    },
    gd2: {
      pal: {
        v: "#3a3a6a",
        V: "#24244a",
        b: "#9ab0ff",
        w: "#f4efe6",
        y: "#ffe040",
      },
      f: [
        [
          ".......w.......",
          "...w..wyw..w...",
          "....wbbbbbw....",
          "....bvvvvvb....",
          "....vwvvvwv....",
          "....vvvvvvv....",
          "..bbvvbbbvvbb..",
          ".bvvvbbwbbvvvb.",
          "w.vvvvbbbvvvv.w",
          "...vvvvbvvvv...",
          "...VvvvvvvvV...",
          "....VvvvvvV....",
          ".....VvvvV.....",
          "......VvV......",
          ".......V.......",
        ],
        [
          ".......w.......",
          "..w...wyw...w..",
          "....wbbbbbw....",
          "....bvvvvvb....",
          "....vwvvvwv....",
          "....vvvvvvv....",
          "..bbvvbbbvvbb..",
          ".bvvvbbwbbvvvb.",
          ".w.vvvbbbvvv.w.",
          "...vvvvbvvvv...",
          "...VvvvvvvvV...",
          "....VvvvvvV....",
          ".....VvvvV.....",
          ".......VV......",
          ".......V.......",
        ],
      ],
    },
    fin: {
      pal: {
        d: "#2a1a3a",
        p: "#5a2a7a",
        r: "#e0445a",
        g: "#e8b84a",
        s: "#c8ccd8",
        S: "#7a7e90",
      },
      f: [
        [
          "....g.g..g.g....",
          "....gggggggg....",
          "....gsssssSg....",
          "...psrsssrsSp...",
          "..ppsssssssSpp..",
          ".pppSssrrssSppp.",
          "pdpppSSSSSSpppdp",
          "pd.psssrrsssp.dp",
          "dd.pssrrrrssp.dd",
          "d..psssrrsssp..d",
          "...ppSsssssSpp..",
          "..pppsss.ssspp..",
          "..ppdsS..Ssdpp..",
          ".pppdsS..Ssdppp.",
          ".ppd.SS..SS.dpp.",
          "ppd..........dpp",
        ],
        [
          "....g.g..g.g....",
          "....gggggggg....",
          "....gsssssSg....",
          "...psrsssrsSp...",
          "..ppsssssssSpp..",
          ".pppSssrrssSppp.",
          "pdpppSSSSSSpppdp",
          "pd.psssrrsssp.dp",
          "dd.pssrrrrssp.dd",
          "d..psssrrsssp..d",
          "...ppSsssssSpp..",
          "..pppsss.ssspp..",
          "..ppdsS..Ssdpp..",
          ".pppdsS..Ssdpp..",
          "pppd.SS..SS.dppp",
          ".pd..........dp.",
        ],
      ],
    },
    mon: {
      pal: {
        d: "#1a1440",
        p: "#3a2a8a",
        s: "#c8cce8",
        S: "#7a7ea8",
        g: "#f0f0ff",
        c: "#c890ff",
        o: "#d0b0ff",
        O: "#ffffff",
        l: "#9aa0c8",
      },
      f: [
        [
          ".....oOoo.cc.Oooo.....",
          "...oo..g.gccg.g..Oo...",
          "..o....gggggggg....o..",
          ".o.....gcggggcg.....o.",
          ".O......ssssss......c.",
          ".o......scsscs.....cOc",
          ".o......ssssss.....ccc",
          "..O...pp.ssss.pp...oc.",
          "...opppppsssspppppo.l.",
          "....ddpsssssssspdd..l.",
          "...ddppsscsscssppdd.l.",
          "..ddpppscsccscspppddl.",
          "..ddpppsscsscsspppssl.",
          ".ddppppSSSSSSSSppppdl.",
          ".ddpppppssddsspppppdl.",
          "ddppppppssddSsppppppld",
          "ddppppppssddSsppppppld",
          "dpppppppssddSsppppppld",
          "dpppppppSS..SSppppppld",
          ".dpopppp......ppppopl.",
          "..o..o..........o...l.",
          "..........o...........",
        ],
        [
          ".....oooO.cc.ooOo.....",
          "...oo..g.gccg.g..oo...",
          "..O....gggggggg....o..",
          ".o.....gcggggcg.....O.",
          ".o......ssssss......c.",
          ".o......scsscs.....ccc",
          ".O......ssssss.....cOc",
          "..o...pp.ssss.pp...oc.",
          "...opppppsssspppppo.l.",
          "....ddpsssssssspdd..l.",
          "...ddppsscsscssppdd.l.",
          "..ddpppscsccscspppddl.",
          "..ddpppsscsscsspppssl.",
          ".ddppppSSSSSSSSppppdl.",
          ".ddpppppssddsspppppdl.",
          "ddppppppssddSsppppppld",
          "ddppppppssddSsppppppld",
          "dpppppppssddSsppppppld",
          "dpppppppSS..SSppppppld",
          ".dpopppp......pppp.pl.",
          "....o......o...o....l.",
          "..o..............o....",
        ],
      ],
    },
    thun: {
      pal: { y: "#ffe066", Y: "#c8a020", w: "#ffffff", b: "#6ab0ff" },
      f: [
        [
          ".....y.....",
          "..y.ywy.y..",
          "...yyyyy...",
          ".yyYwwwYyy.",
          "..yYwbwYy..",
          "yyYwbbbwYyy",
          "..yYwbwYy..",
          ".yyYwwwYyy.",
          "...yyyyy...",
          "..y.yYy.y..",
          ".....y.....",
        ],
        [
          "..y.....y..",
          "....ywy....",
          ".y.yyyyy.y.",
          "..yYwwwYy..",
          ".yyYwbwYyy.",
          ".yYwbbbwYy.",
          ".yyYwbwYyy.",
          "..yYwwwYy..",
          ".y.yyyyy.y.",
          "....yYy....",
          "..y.....y..",
        ],
      ],
    },
    siren: {
      pal: {
        s: "#9ad8c8",
        h: "#3a8ac0",
        H: "#1e5a8a",
        t: "#4ac0a0",
        T: "#2a7a6a",
        e: "#ffe066",
        f: "#bfe8ff",
      },
      f: [
        [
          "....hhhh....",
          "...hhhhhh...",
          "..hhsesehh..",
          "..hhssssh...",
          "..hh.ss.hh..",
          ".s.ffttff.s.",
          "..sstttss...",
          "....tttt....",
          "....ttTt....",
          ".....tTtt...",
          "......tTtt..",
          ".......ttff.",
          "........fff.",
        ],
        [
          "....hhhh....",
          "...hhhhhh...",
          "..hhsesehh..",
          "..hhssssh...",
          "..hh.ss.hh..",
          "s..ffttff..s",
          "..sstttss...",
          "....tttt....",
          "....ttTt....",
          "....ttTt....",
          ".....tTtt...",
          "......tff...",
          ".....ff.f...",
        ],
      ],
    },
    soul: {
      pal: { p: "#b07aff", P: "#6a3aa8", w: "#f0e0ff", d: "#2a1440" },
      f: [
        [
          "...ppppp...",
          "..pwwwwwp..",
          ".pwwwwwwwp.",
          ".pwdwwwdwp.",
          ".pwdwwwdwp.",
          ".pwwwddwwp.",
          ".pwwwwwwwp.",
          ".ppwwwwwpp.",
          "..ppwwwpp..",
          "...PppPp...",
          "....PpP....",
          ".....P.....",
        ],
        [
          "...ppppp...",
          "..pwwwwwp..",
          ".pwwwwwwwp.",
          ".pwdwwwdwp.",
          ".pwdwwwdwp.",
          ".pwwwddwwp.",
          ".pwwwwwwwp.",
          ".ppwwwwwpp.",
          "..ppwwwpp..",
          "...pPppP...",
          "...PpP.....",
          "..P........",
        ],
      ],
    },
    zeus: {
      pal: {
        w: "#f4f4ff",
        W: "#a8aac8",
        s: "#f0c8a0",
        g: "#ffd84a",
        y: "#fff6a0",
        b: "#6ab0ff",
      },
      f: [
        [
          ".....g.g.g...y..",
          ".....ggggg...yy.",
          "....wsssssw.yy..",
          "....sbsssbs.yyy.",
          "....sssssss..yy.",
          "....wwwwwww.yy..",
          "...wwwwwwwww.y..",
          "..wwWwwwwwWwws..",
          ".wwWwwgggwwWws..",
          ".ww.wwwgwwwww...",
          ".ss.wWwwwwWw....",
          "....wwwwwwww....",
          "....wWwwwWww....",
          "....wwwwwwww....",
          "...wwW.wwW.ww...",
          "...gg...gg......",
        ],
        [
          ".....g.g.g..y...",
          ".....ggggg..yy..",
          "....wsssssw..yy.",
          "....sbsssbs.yyy.",
          "....sssssss.yy..",
          "....wwwwwww..yy.",
          "...wwwwwwwww..y.",
          "..wwWwwwwwWwws..",
          ".wwWwwgggwwWws..",
          ".ww.wwwgwwwww...",
          ".ss.wWwwwwWw....",
          "....wwwwwwww....",
          "....wWwwwWww....",
          "....wwwwwwww....",
          "...wwW.wwW.ww...",
          "....gg..gg......",
        ],
      ],
    },
    posei: {
      pal: {
        c: "#ffd84a",
        s: "#e0b890",
        h: "#4ac0c0",
        H: "#2a8a8a",
        a: "#2a6ab0",
        A: "#1a4a80",
        t: "#e8e8f0",
        e: "#ffffff",
      },
      f: [
        [
          "....c.c.c..t.t.t",
          "....ccccc..ttttt",
          "...hsssssh..t...",
          "...hsesesh..t...",
          "...hhssshh..t...",
          "...hhhhhhh..t...",
          "..aahhhhhaa.t...",
          ".aaaahhhaaaast..",
          ".aaAaaaaaaAast..",
          ".ss.aaaaaaaa.t..",
          "....aAaaaaAa.t..",
          "....aaaaaaaa.t..",
          "....aAaaaaAa.t..",
          "....aaaaaaaa.t..",
          "...aaA.aaA.aat..",
          "...hh...hh...t..",
        ],
        [
          "....c.c.c..t.e.t",
          "....ccccc..ttttt",
          "...hsssssh..t...",
          "...hsesesh..t...",
          "...hhssshh..t...",
          "...hhhhhhh..t...",
          "..aahhhhhaa.t...",
          ".aaaahhhaaaast..",
          ".aaAaaaaaaAast..",
          ".ss.aaaaaaaa.t..",
          "....aAaaaaAa.t..",
          "....aaaaaaaa.t..",
          "....aAaaaaAa.t..",
          "....aaaaaaaa.t..",
          "....aA.aaA.aat..",
          "....hh..hh...t..",
        ],
      ],
    },
    hades: {
      pal: {
        d: "#2e1e40",
        D: "#1e1230",
        p: "#b07aff",
        P: "#8a6aa8",
        s: "#c8c0d8",
        e: "#ff5a6a",
        g: "#6a5a80",
      },
      f: [
        [
          "...p..pp..p.....",
          "...pp.pp.pp..P..",
          "....gggggg...P..",
          "...gggggggg..P..",
          "...gesggseg..P..",
          "...ggssssgg..P..",
          "...dgggggggd.P..",
          "..dddddDddddsP..",
          ".ddDdddpddDdsP..",
          ".dd.dddpppdd.P..",
          ".ss.ddDpdDdd.P..",
          "....dddddddd.P..",
          "...ddDdddDdd.P..",
          "..dddddddddd.P..",
          ".pdddd.dddd.dP..",
          ".p.p..pp..p..P..",
        ],
        [
          "..p..pp..p......",
          "...pp.pp.pp..P..",
          "....gggggg...P..",
          "...gggggggg..P..",
          "...gesggseg..P..",
          "...ggssssgg..P..",
          "...dgggggggd.P..",
          "..dddddDddddsP..",
          ".ddDdddpddDdsP..",
          ".dd.dddpppdd.P..",
          ".ss.ddDpdDdd.P..",
          "....dddddddd.P..",
          "...ddDdddDdd.P..",
          "..dddddddddd.P..",
          ".pdddd.dddd.dP..",
          "..p.p.pp.p...P..",
        ],
      ],
    },
  },
  SLIME_PAL = [
    ["#5bc25b", "#2f8a4b", "#b9f08a"],
    ["#e0445a", "#9a2440", "#ff9aa0"],
    ["#4fb0e0", "#2a6fa0", "#b0ecff"],
    ["#8aa040", "#566a24", "#d0e080"],
    ["#b070ff", "#6a30b0", "#e8c8ff"],
  ],
  IPAL = {
    g: "#e8b84a",
    y: "#fff2a0",
    r: "#e0445a",
    R: "#8a2a3a",
    u: "#6fb6ff",
    p: "#b07aff",
    e: "#5ad9b0",
    o: "#ffb347",
    w: "#ffffff",
    l: "#9a6a3e",
    L: "#5d3f2b",
    t: "#a8703c",
    T: "#6b4228",
    n: "#e8dcc0",
    N: "#a89a80",
    x: "#120d1c",
    s: "#dfe6ec",
    f: "#f0c090",
    F: "#c08860",
    v: "#3a6ab0",
    h: "#2e8a6a",
    c: "#c8f4ff",
    d: "#4a2a7a",
    m: "#ff6ad0",
    i: "#b0f05a",
    j: "#4a9a2a",
    q: "#ff7a2a",
    z: "#22142e",
    G: "#8a8494",
    H: "#55505e",
    P: "#9a5af0",
    S: "#ffe066",
    W: "#a8e8ff",
    K: "#7af0e0",
    D: "#5a1424",
  },
  MAT = {
    cloth: ["#d8c8a0", "#a08c68", "#f4ead0"],
    leather: ["#a8703c", "#6b4228", "#d09a5a"],
    iron: ["#9a98a8", "#5c5a6c", "#d6d6e2"],
    mithril: ["#7fd0e8", "#3a7aa8", "#e0faff"],
    gold: ["#e8b84a", "#a8742a", "#fff2a0"],
    copper: ["#d07a4a", "#8a4628", "#f0b080"],
    silver: ["#c8ccd8", "#7a7e90", "#f6f8ff"],
    myth: ["#ffc83a", "#a8641a", "#fff6b0"],
    obsid: ["#3e3450", "#1e1828", "#6a5c80"],
    wood: ["#9a6a3e", "#5d3f2b", "#c8905a"],
    dark: ["#6a4a8a", "#3a2a5a", "#a07ad0"],
    bone: ["#e8dcc0", "#a89a80", "#fffaf0"],
    steel: ["#c0c6d4", "#6a7084", "#f4f6ff"],
    slate: ["#7a7290", "#4a4460", "#b0a8c8"],
    crim: ["#c8384a", "#7a1e30", "#ff8a8a"],
    void: ["#6a3ab0", "#33195e", "#b08aff"],
    frost: ["#9ad8f4", "#4a88c0", "#eefcff"],
    venom: ["#7ac84a", "#3e7a2a", "#c8f08a"],
    stone: ["#8a8494", "#55505e", "#b8b2c2"],
    flesh: ["#d87a7a", "#9a4048", "#f8b0a8"],
    abyss: ["#2e8a8a", "#164a5a", "#7ad8c8"],
    night: ["#4a3a72", "#2a1e48", "#8070b8"],
    doom: ["#6a5a7a", "#3a2e48", "#a898b8"],
  },
  ICONS = {
    artZ: {
      m: "gold",
      r: [
        "........CCA...",
        ".......CAAB...",
        "......CAAB....",
        ".....CAAB.....",
        "....CAAB......",
        "...CAAAAAAA...",
        "...BBBBAAAB...",
        "......CAAB....",
        ".....CAAB.....",
        "....CAAB......",
        "...CAAB.......",
        "..CAB.........",
        "..AB..........",
        "..B...........",
      ],
    },
    artP: {
      m: "mithril",
      r: [
        ".C...C...C....",
        ".A...A...A....",
        ".A...A...A....",
        ".AB..AB..AB...",
        ".AAAAAAAAAB...",
        "..BBBAABBB....",
        ".....AB.......",
        ".....gg.......",
        ".....AB.......",
        ".....AB.......",
        ".....AB.......",
        ".....gg.......",
        ".....AB.......",
        ".....AB.......",
      ],
    },
    artH: {
      m: "gold",
      r: [
        ".........nnn..",
        "..p.....nnnnn.",
        ".ppp....nenen.",
        "..p.....nnnnn.",
        ".........nNn..",
        "........pAAp..",
        ".......AB.p...",
        "......AB......",
        ".....AB.......",
        "....AB....p...",
        "...AB....ppp..",
        "..AB......p...",
        ".AB...........",
        "..............",
      ],
    },
    sw0: {
      m: "iron",
      r: [
        "..............",
        "..............",
        ".........CA...",
        "........CAB...",
        ".......CAB....",
        "......CAB.....",
        ".....CAB......",
        "..g.CAB.......",
        "...gAB........",
        "...lgg........",
        "..lL..........",
        ".lL...........",
        "..............",
        "..............",
      ],
    },
    sw1: {
      m: "iron",
      r: [
        "..............",
        "..........CC..",
        ".........CAAB.",
        "........CAAB..",
        ".......CAAB...",
        "......CAAB....",
        ".....CAAB.....",
        ".g..CAAB......",
        "..gCAAB.......",
        "...gAB........",
        "..tTgg........",
        ".tT....g......",
        "tT............",
        "..............",
      ],
    },
    sw2: {
      m: "silver",
      r: [
        "............CA",
        "...........CAB",
        "..........CAB.",
        ".........CAB..",
        "........CAB...",
        ".......CAB....",
        "......CAB.....",
        ".y...CAB......",
        "..g.CAB.......",
        "...gAB........",
        "...ugg........",
        "..RRg.g.......",
        ".RR....y......",
        "yR............",
      ],
    },
    sw3: {
      m: "mithril",
      r: [
        "...........CCA",
        "..........CAuA",
        ".........CAuAB",
        "........CAuAB.",
        ".......CAuAB..",
        "......CAuAB...",
        ".....CAuAB....",
        ".gg.CAuAB.....",
        "..gCAAAB......",
        "...gAAB.......",
        "..pgggy.......",
        ".pp..gg.......",
        "pp....g.......",
        "p.............",
      ],
    },
    bw0: {
      m: "wood",
      r: [
        "......CA......",
        ".....CAw......",
        "....CA.w......",
        "...CA..w......",
        "...AB..w......",
        "..lLl..w......",
        "..lLl..w......",
        "...AB..w......",
        "...AB..w......",
        "....AB.w......",
        ".....ABw......",
        "......AB......",
        "..............",
        "..............",
      ],
    },
    bw1: {
      m: "wood",
      r: [
        "......CA......",
        ".....CAw......",
        "....CA.w......",
        "...CA..w......",
        "...AB..w...s..",
        "..tTt..w...ss.",
        "rrlllllllllsss",
        "..tTt..w...ss.",
        "...AB..w...s..",
        "...AB..w......",
        "....AB.w......",
        ".....ABw......",
        "......AB......",
        "..............",
      ],
    },
    bw2: {
      m: "dark",
      r: [
        ".......g......",
        "......CAw.....",
        ".....CA.w.....",
        "....CA..w.....",
        "...CA...w.....",
        "...AB...w.....",
        "..RRR...w.....",
        "..RgR...w.....",
        "..RRR...w.....",
        "...AB...w.....",
        "....AB..w.....",
        ".....AB.w.....",
        "......ABw.....",
        ".......g......",
      ],
    },
    bw3: {
      m: "mithril",
      r: [
        "......y.......",
        ".....yCA......",
        "....CA.e......",
        "...CA..e......",
        "..CA...e......",
        "..AB...e......",
        ".guug..e......",
        ".guug..e......",
        "..AB...e......",
        "..AB...e......",
        "...AB..e......",
        "....AB.e......",
        ".....yCA......",
        "......y.......",
      ],
    },
    st0: {
      m: "wood",
      r: [
        "..............",
        "..........CC..",
        ".........CAAB.",
        ".........AABB.",
        "........lL....",
        ".......lL.....",
        "......lL......",
        ".....lL.......",
        "....lL........",
        "...lL.........",
        "..lL..........",
        ".lL...........",
        "..............",
        "..............",
      ],
    },
    st1: {
      m: "wood",
      r: [
        "..........uw..",
        ".........uuuw.",
        ".........uuuu.",
        "........g.uu..",
        "........gg....",
        ".......lL.....",
        "......lL......",
        ".....lL.......",
        "....lL........",
        "...lL.........",
        "..lL..........",
        ".lL...........",
        "..............",
        "..............",
      ],
    },
    st2: {
      m: "silver",
      r: [
        ".........p....",
        "........pp.p..",
        ".......ppwpp..",
        "........ppp...",
        ".......gCg....",
        "......CAB.....",
        ".....CAB......",
        "....CAB.......",
        "...CAB........",
        "..CAB.........",
        ".CAB..........",
        ".AB...........",
        "..............",
        "..............",
      ],
    },
    st3: {
      m: "gold",
      r: [
        "..........y...",
        ".........yuy..",
        ".......yyuuuyy",
        "........yuuuy.",
        ".......yuuyuuy",
        ".......y.CA..y",
        "........CAB...",
        ".......CAB....",
        "......CAB.....",
        ".....CAB......",
        "....CAB.......",
        "...CAB........",
        "..CAB.........",
        ".CB...........",
      ],
    },
    hm0: {
      m: "leather",
      r: [
        "..............",
        "..............",
        "..............",
        ".....CCCC.....",
        "...CCAAAAAA...",
        "..CAAAAAAAAB..",
        "..AAAAAAAAAB..",
        ".CAAAAAAAAAAB.",
        ".AAAAAAAAAAAB.",
        ".TTTTTTTTTTTT.",
        "TTnTTnTTnTTnTT",
        "..............",
        "..............",
        "..............",
      ],
    },
    hm1: {
      m: "iron",
      r: [
        "..............",
        "......CC......",
        "....CCAAAB....",
        "...CAAAAAAB...",
        "..CAAAAAAAAB..",
        "..CAAAAAAAAB..",
        "..AAAAAAAAAB..",
        "..AAAAAAAAAB..",
        "..AA..AA..AB..",
        "..AA..AA..AB..",
        "..BA..AB..BB..",
        "..BB......BB..",
        "..............",
        "..............",
      ],
    },
    hm2: {
      m: "iron",
      r: [
        ".......rr.....",
        "......rrRr....",
        ".....rrRR.....",
        ".....CCCCC....",
        "...CCAAAAAAB..",
        "..CAAAAAAAAAB.",
        "..AgggggggggB.",
        "..AxxxxxxxxxB.",
        "..AAAAAAAAAAB.",
        "..AAxAxAxAxAB.",
        "..BAAAAAAAABB.",
        "...BBBBBBBBB..",
        "..............",
        "..............",
      ],
    },
    hm3: {
      m: "mithril",
      r: [
        "C............C",
        "CC....CC....CC",
        "ACC.CCAACC.CCA",
        ".ACCAAAAAAACA.",
        "..BCAAAAAAAB..",
        "..CAAAuuAAAB..",
        "..AAAAuuAAAB..",
        "..AxxxxxxxxB..",
        "..AAAAAAAAAB..",
        "..BAAA..AAAB..",
        "..BBB....BBB..",
        "..............",
        "..............",
        "..............",
      ],
    },
    ch0: {
      m: "cloth",
      r: [
        "..............",
        "...CCC..CCC...",
        ".CCAAAwwAAACC.",
        "CAAAAAAwAAAAAB",
        "CAAAAAAAAAAAAB",
        "AAB.AAAAAA.BAB",
        "BB..AAAAAA..BB",
        "....AAAAAA....",
        "....AAAAAA....",
        "....AAAAAB....",
        "....BAAAAB....",
        "....BBBBBB....",
        "..............",
        "..............",
      ],
    },
    ch1: {
      m: "leather",
      r: [
        "..............",
        "...TTT..TTT...",
        ".CCAAAttAAACC.",
        "CAAAAAAtAAAAAB",
        "CAAAAAAtAAAAAB",
        "AAB.AAAtAA.BAB",
        "TT..AAAtAA..TT",
        "....AAAAAA....",
        "....LLgyLL....",
        "....AAAAAA....",
        "....BAAAAB....",
        "....TTTTTT....",
        "..............",
        "..............",
      ],
    },
    ch2: {
      m: "iron",
      r: [
        "..............",
        "...CCC..CCC...",
        ".CCZZZCCZZZCC.",
        "CZZZZZZZZZZZZB",
        "CZZZZZZZZZZZZB",
        "ZZB.ZZZZZZ.BZB",
        "BB..ZZZZZZ..BB",
        "....ZZZZZZ....",
        "....LLgyLL....",
        "....ZZZZZZ....",
        "....ZZZZZZ....",
        "....BBBBBB....",
        "..............",
        "..............",
      ],
    },
    ch3: {
      m: "mithril",
      r: [
        "..............",
        ".CCC......CCC.",
        "CAAAC....CAAAB",
        "CAAAACCCCAAAAB",
        "BAAAAAAAAAAABB",
        ".BBAAAuuAAABB.",
        "...AAAuuAAA...",
        "...CAAAAAAB...",
        "...AAAAAAAB...",
        "...gggggggg...",
        "...AAAAAAAB...",
        "....BBBBBB....",
        "..............",
        "..............",
      ],
    },
    gl0: {
      m: "cloth",
      r: [
        "..............",
        "....C.C.C.....",
        "...CACACAC....",
        "...AAAAAAA....",
        "...AAAAAAA.C..",
        "...AAAAAAACA..",
        "...AAAAAAAAB..",
        "...AAAAAAAB...",
        "...BAAAAAAB...",
        "...BAAAAAB....",
        "...BBBBBBB....",
        "..BBBBBBBBB...",
        "..............",
        "..............",
      ],
    },
    gl1: {
      m: "leather",
      r: [
        "..............",
        "....C.C.C.....",
        "...CACACAC....",
        "...AAAAAAA....",
        "...AAAAAAA.C..",
        "...AAAAAAACA..",
        "...AAAAAAAAB..",
        "...AAAAAAAB...",
        "...BAAAAAAB...",
        "...TTTTTTTT...",
        "..TTgTTTTTTT..",
        "..TTTTTTTTTT..",
        "..............",
        "..............",
      ],
    },
    gl2: {
      m: "iron",
      r: [
        "..............",
        "...CCCCCCC....",
        "...ABABABAB...",
        "...CCCCCCC....",
        "...AAAAAAA.CC.",
        "...AAAAAAACAB.",
        "...BBBBBBBAAB.",
        "...AAAAAAAAB..",
        "...AAAAAAAB...",
        "..CCCCCCCCCB..",
        "..AAAAAAAAAB..",
        "..BBBBBBBBBB..",
        "..............",
        "..............",
      ],
    },
    gl3: {
      m: "mithril",
      r: [
        "..............",
        "...CCCCCCC....",
        "...ABABABAB...",
        "...CCCCCCC....",
        "...AAAAAAA.CC.",
        "...AAuuAAACAB.",
        "...AAuuAAAAAB.",
        "...AAAAAAAAB..",
        "...AAAAAAAB...",
        "..gggggggggg..",
        "..AAAAAAAAAB..",
        ".CBBBBBBBBBBC.",
        "..............",
        "..............",
      ],
    },
    bo0: {
      m: "cloth",
      r: [
        "..............",
        "..............",
        "..............",
        "..............",
        "..............",
        "...CAAAB......",
        "...CAAAB......",
        "...CAAAAB.....",
        "...CAAAAAAB...",
        "..CAAAAAAAAAB.",
        "..AAAAAAAAAAB.",
        "..LLLLLLLLLLL.",
        "..............",
        "..............",
      ],
    },
    bo1: {
      m: "leather",
      r: [
        "..............",
        "...CCCCCC.....",
        "...TTTTTT.....",
        "...CAAAAB.....",
        "...CAAAAB.....",
        "...CAAAAB.....",
        "...CAAAAB.....",
        "...CAAAAAB....",
        "...CAAAAAAAB..",
        "..CAAAAAAAAAB.",
        "..AAAAAAAAAAB.",
        "..LLLLLLLLLLL.",
        "..............",
        "..............",
      ],
    },
    bo2: {
      m: "iron",
      r: [
        "..............",
        "...CCCCCCC....",
        "...AAAAAAB....",
        "...BBBBBBB....",
        "...CAAAAAB....",
        "...BBBBBBB....",
        "...CAAAAAB....",
        "...BBBBBBBB...",
        "...CAAAAAAAB..",
        "..CCCCCCAAAAB.",
        "..AAAAAAAAAAB.",
        "..BBBBBBBBBBB.",
        "..............",
        "..............",
      ],
    },
    bo3: {
      m: "mithril",
      r: [
        ".C............",
        ".CC.CCCCCC....",
        ".ACCAAAAAB....",
        "..ACAAAAAB....",
        "...CAAAAAB....",
        "...CAuuAAB....",
        "...CAuuAAB....",
        "...CAAAAAAB...",
        "...CAAAAAAAB..",
        "..CAAAAAAAAAB.",
        "..AAAAAAAAAAB.",
        "..ggggggggggg.",
        "..............",
        "..............",
      ],
    },
    rg0: {
      m: "copper",
      r: [
        "..............",
        "..............",
        "..............",
        ".....CCCC.....",
        "....CAAAAB....",
        "...CA....AB...",
        "..CA......AB..",
        "..A........B..",
        "..A........B..",
        "..AB......BB..",
        "...AB....BB...",
        "....BBBBBB....",
        "..............",
        "..............",
      ],
    },
    rg1: {
      m: "silver",
      r: [
        "..............",
        "......uw......",
        ".....uuuu.....",
        ".....CuuC.....",
        "....CAAAAB....",
        "...CA....AB...",
        "..CA......AB..",
        "..A........B..",
        "..A........B..",
        "..AB......BB..",
        "...AB....BB...",
        "....BBBBBB....",
        "..............",
        "..............",
      ],
    },
    rg2: {
      m: "gold",
      r: [
        ".....rrrr.....",
        "....rrwrrr....",
        "....rrrrRr....",
        "....grrRRg....",
        "....CAggAB....",
        "...CA....AB...",
        "..CA......AB..",
        "..A........B..",
        "..A........B..",
        "..AB......BB..",
        "...AB....BB...",
        "....BBBBBB....",
        "..............",
        "..............",
      ],
    },
    rg3: {
      m: "silver",
      r: [
        "......w.......",
        ".....pwp......",
        "....ppppp.....",
        ".wpppwpppw....",
        "....ppppp.....",
        "...CApwpAB....",
        "..CA..p...AB..",
        "..A........B..",
        "..A........B..",
        "..AB......BB..",
        "...AB....BB...",
        "....BBBBBB....",
        "..............",
        "..............",
      ],
    },
    am0: {
      m: "bone",
      r: [
        "L............L",
        ".L..........L.",
        "..L........L..",
        "...L......L...",
        "....L....L....",
        ".....LooL.....",
        "......CA......",
        ".....CAAB.....",
        ".....CAAB.....",
        ".....AAB......",
        "......AB......",
        "......A.......",
        "..............",
        "..............",
      ],
    },
    am1: {
      m: "silver",
      r: [
        "C............C",
        ".C..........C.",
        "..C........C..",
        "...C......C...",
        "....C....C....",
        ".....CCCC.....",
        ".....CAAB.....",
        "....CAuuAB....",
        "....AAuuAB....",
        "....BAAABB....",
        ".....BBBB.....",
        "..............",
        "..............",
        "..............",
      ],
    },
    am2: {
      m: "gold",
      r: [
        "A............A",
        ".A..........A.",
        "..A........A..",
        "...A......A...",
        "....A....A....",
        ".....AggA.....",
        "......oo......",
        ".....owoo.....",
        "....oooooo....",
        "....oooooo....",
        ".....oooo.....",
        "......oo......",
        "..............",
        "..............",
      ],
    },
    am3: {
      m: "gold",
      r: [
        "A............A",
        ".A..........A.",
        "..A........A..",
        "...A......A...",
        "....A....A....",
        ".....AAAA.....",
        "......uu......",
        ".....uuuu.....",
        ".uuuuuwuuuuu..",
        "...uuuuuuu....",
        "....uu..uu....",
        "...uu....uu...",
        "..............",
        "..............",
      ],
    },
    slate: {
      m: "slate",
      r: [
        "..............",
        "....CCCCCC....",
        "...CAAAAAAB...",
        "..CAAApAAAAB..",
        "..CAAppppAAB..",
        "..CApAppApAB..",
        "..CAAppppAAB..",
        "..CAAAppAAAB..",
        "..CApAppApAB..",
        "..CAAAppAAAB..",
        "..CAAAAAAAAB..",
        "..ABBBBBBBBB..",
        "...BBBBBBBB...",
        "..............",
      ],
    },
    rune: {
      m: "silver",
      r: [
        "..............",
        "......CC......",
        ".....CAAB.....",
        "....CAwAAB....",
        "...CAAwwAAB...",
        "..CAAAwAwAAB..",
        "..CAAAwwAAAB..",
        "..BAAAwAwAAB..",
        "..BAAAwAAAAB..",
        "...BAAwAAAB...",
        "....BAAAAB....",
        ".....BAAB.....",
        "......BB......",
        "..............",
      ],
    },
    tbc: {
      m: "leather",
      r: [
        "..............",
        "....TTTTTT....",
        "...TttttttT...",
        "..TttCtttttT..",
        "..TtffffffT...",
        "..TfxffffxfT..",
        "..TfffffffFT..",
        "...FfffffFF...",
        "....FFFFFF....",
        "..vvuuffuuvv..",
        ".vuuuuFFuuuuv.",
        ".vuuuggggguuv.",
        ".vuuuuuuuuuuv.",
        ".vvvvvvvvvvvv.",
      ],
    },
    tbb: {
      m: "leather",
      r: [
        "..............",
        ".....TTTT.....",
        "....T....T....",
        "..CCCCCCCCCC..",
        ".CAAAAAAAAAAB.",
        ".CAAAAAAAAAAB.",
        ".BBBBBggBBBBB.",
        ".ATAAAgyAAATB.",
        ".ATAAAAAAAATB.",
        ".ATAACCCCAATB.",
        ".ATAACAAAAATB.",
        ".ATAABBBBAATB.",
        ".BBBBBBBBBBBB.",
        "..............",
      ],
    },
    tbs: {
      m: "mithril",
      r: [
        "..............",
        ".....CCCC.....",
        "....CwCCAB....",
        "...CwCAAAAB...",
        "..CCCCAAABBB..",
        ".CAAAAAAAAAAB.",
        ".BAwAAAAAAAAB.",
        "..BAwAAAAAAB..",
        "...BAAAAAAB...",
        "....BAAAAB....",
        ".....BAAB.....",
        "......BB......",
        "..............",
        "..............",
      ],
    },
    tba: {
      m: "dark",
      r: [
        ".....w........",
        ".....LLLL.....",
        "......ss......",
        "......ss...w..",
        "......ss......",
        ".....s..s.....",
        "....s..w.s....",
        "...sCCCCCCs...",
        "..sAAwAAAAAs..",
        "..sAAAAAwAAs..",
        "..sAAAAAAABs..",
        "...sBAAAABs...",
        "....ssssss....",
        "..............",
      ],
    },
    tbm: {
      m: "bone",
      r: [
        "..............",
        ".lL........lL.",
        ".lLnnnnNnnnlL.",
        ".lLnTnnNnrnlL.",
        ".lLnnnnNrnrlL.",
        ".lLnnTnNnrnlL.",
        ".lLnnnnTnnnlL.",
        ".lLnnnnNnnnlL.",
        ".lLneTnNnnnlL.",
        ".lLeheTNnnnlL.",
        ".lLnennNnTnlL.",
        ".lLnnnnNTnnlL.",
        ".lL........lL.",
        "..............",
      ],
    },
    tbo: {
      m: "bone",
      r: [
        "..............",
        ".rrrrr..uuuuu.",
        ".rwrrr..uwuuu.",
        ".rrrrr..uuuuu.",
        ".rrrrR..uuuuv.",
        ".RRRRR..vvvvv.",
        "..............",
        "..............",
        ".eeeee..ggggg.",
        ".eweee..gyggg.",
        ".eeeee..ggggg.",
        ".eeeeh..ggggo.",
        ".hhhhh..ooooo.",
        "..............",
      ],
    },
    bsk: {
      m: "bone",
      r: [
        "..............",
        ".R..........R.",
        ".RR........RR.",
        "..RRCCCAAARR..",
        "...CAAAAAAAB..",
        "..CAAAAAAAAAB.",
        "..AAxxAAxxAB..",
        "..AArxAAxrAB..",
        "..AAAAxxAAAB..",
        "...BAAAAAAB...",
        "....nxnxnx....",
        "....BBBBBB....",
        "..............",
        "..............",
      ],
    },
    mnQ: {
      m: "copper",
      r: [
        "..............",
        "..gBBBBBBBBg..",
        "..BAAAAAAAAB.n",
        "..BAAAAAAAABnN",
        "..BAAAggAAABnN",
        "..BAAgyygAABnN",
        "..BAAAggAAABnN",
        "..BAAAAAAAABnN",
        "..BAAAAAAAABnN",
        "..BAAAAAAAABnN",
        "..gBBBBRBBBgN.",
        ".......R......",
        "......RR......",
        "..............",
      ],
    },
    exit: {
      m: "wood",
      r: [
        "..............",
        "...BBBBBB.....",
        "..BCCAAAAB....",
        ".BCAxxxxAAB...",
        ".BAxxxxxxAB...",
        ".BAxxxxxxABe..",
        ".BAxxxxxxABee.",
        ".BAxeeeeeeeeee",
        ".BAxeeeeeeeeee",
        ".BAxxxxxxABee.",
        ".BAxxxxxxABe..",
        ".BAxxxxxxAB...",
        ".BBBBBBBBBB...",
        "..............",
      ],
    },
    myHH: {
      m: "myth",
      r: [
        "....nnnnnn....",
        "...nnnnnnnn...",
        "..nnxxnnxxnn..",
        "y.nnxrnnrxnn.y",
        "g..nnnxxnnn..g",
        ".g..NnNnNn..g.",
        "..CA.nnnn.AB..",
        ".CA........AB.",
        ".A..........B.",
        ".A..........B.",
        ".AB........BB.",
        "..AB......BB..",
        "...ABBRRBBB...",
        "....BBBBBB....",
      ],
    },
    myFist: {
      m: "myth",
      r: [
        ".y..........y.",
        "...AAAAAAA....",
        "..ACCCCCCAA...",
        "..ACAAxAAxAB..",
        ".ACCAAxAAxAB..",
        ".AAAAAxAAxAB..",
        ".AAxxxxxxxAB..",
        ".ACAAAAAAAAB..",
        ".AAAAAAAAABB..",
        "..AAAAAAABB...",
        "...BBBBBBB....",
        "...RRRRRRR....",
        "...RrrrrrR....",
        "...RRRRRRR....",
      ],
    },
    myHorde: {
      m: "obsid",
      r: [
        "....y.yy.y....",
        "....gggggg....",
        "...gAAAAAAg...",
        "..gACAwrAAAg..",
        "..gCAArRAAAg..",
        "..gAAArRAACg..",
        "..gAAArRAAAg..",
        "..gACyyyyAAg..",
        "..gAAAggACAg..",
        "..gAAAyyAAAg..",
        "..gAAAAAAAAg..",
        "..gBBBBBBBBg..",
        "...gggggggg...",
        "..............",
      ],
    },
    mnS: {
      m: "leather",
      r: [
        "..............",
        ".....T..T.....",
        "......TT......",
        ".....tTTt.....",
        "....tttttt....",
        "...tttttttt...",
        "..ttttggtttt..",
        "..tttgyygttt..",
        "..tttgyygttT..",
        "..ttttggtttT..",
        "..ttttttttTT..",
        "...tttttTTT...",
        "....TTTTTT....",
        "..............",
      ],
    },
    mnC: {
      m: "bone",
      r: [
        "..............",
        "..gggggggggg..",
        "..gnnnnnnnng..",
        "..gnhhhhhhng..",
        "..gnhwhhwhng..",
        "..gnhhhhhhng..",
        "..gnhhrrhhng..",
        "..gnhhhhhhng..",
        "..gnnnnnnnng..",
        "..gnNNNNNNng..",
        "..gnnnnnnnng..",
        "..gnNNNNnnng..",
        "..gggggggggg..",
        "..............",
      ],
    },
    mnF: {
      m: "gold",
      r: [
        "..............",
        "......g.......",
        "......y.....p.",
        ".....gyg...ppp",
        ".....ywy....p.",
        "..gggywyggg...",
        ".gyywwwwwyyg..",
        "..gggywyggg...",
        ".....ywy......",
        ".u...gyg......",
        "uuu...y.......",
        ".u....g.......",
        "..............",
        "..............",
      ],
    },
    mnD: {
      m: "dark",
      r: [
        "..............",
        "..............",
        "..BBBBBBBBBB..",
        ".BCCCCCCCCCCB.",
        ".BAAAAAAAAAAB.",
        ".BAwwAwwAwwAB.",
        ".BAwwAwwAwwAB.",
        ".BAAAAAAAAAAB.",
        ".BAAAAAAAAAAB.",
        "..BAABBBBBBB..",
        "..BAB.........",
        "..BB..........",
        "..............",
        "..............",
      ],
    },
    mnH: {
      m: "gold",
      r: [
        "..............",
        "..............",
        "...rrr..rrr...",
        "..rwwrrrrrrr..",
        ".rwwrrrrrrrrR.",
        ".rwrrrrrrrrrR.",
        ".rrrrrrrrrrRR.",
        "..rrrrrrrrRR..",
        "...rrrrrrRR...",
        "....rrrrRR....",
        ".....rrRR.....",
        "......RR......",
        "..............",
        "..............",
      ],
    },
    mnB: {
      m: "mithril",
      r: [
        "..............",
        "..BBBBBBBBBB..",
        ".BCAAAAAAAAAB.",
        ".BCAAAAAAAAAB.",
        ".BCAAAggggAAB.",
        ".BCAAgyyygAAB.",
        ".BCAAAggggAAB.",
        ".BCAAAAAAAAAB.",
        ".BCAAAAAAAAAB.",
        ".BCAAAAAAAAAB.",
        ".BBnnnnnnnnnB.",
        ".BnNNNNNNNNNB.",
        "..BBBBBBBBBB..",
        "..............",
      ],
    },
    mnL: {
      m: "bone",
      r: [
        "..............",
        "..LLLLLLLLLL..",
        ".LllllllllllL.",
        "..LLLLLLLLLL..",
        "...nnnnnnnn...",
        "...nNNNNNnn...",
        "...nnnnnnnn...",
        "...nNNNNNNn...",
        "...nnnnnnnn...",
        "...nNNNnnrn...",
        "...nnnnnrRn...",
        "..LLLLLLLLLL..",
        ".LllllllllllL.",
        "..LLLLLLLLLL..",
      ],
    },
    mnR: {
      m: "gold",
      r: [
        "..............",
        "..BCCCCCCCCB..",
        "BBBACAAAAAABBB",
        "B.BACAArAAAB.B",
        "B.BACAAAAAAB.B",
        ".BBBACAAAAABB.",
        "...BACAAAAB...",
        "....BAAAAB....",
        ".....BAAB.....",
        "......AB......",
        "......AB......",
        "....BCCAAB....",
        "...BAAAAAAB...",
        "...BBBBBBBBB..",
      ],
    },
    mnW: {
      m: "wood",
      r: [
        "..............",
        "..............",
        "...BBBBBBBB...",
        "..BCCCCCCCCB..",
        ".BCAAAAAAAACB.",
        ".BAAAAAAAAAAB.",
        ".BggggyyggggB.",
        ".BAAAygyAAAAB.",
        ".BAAAyyyAAAAB.",
        ".BCAAAAAAAACB.",
        ".BAAAAAAAAAAB.",
        ".BggggggggggB.",
        "..BBBBBBBBBB..",
        "..............",
      ],
    },
    mnG: {
      m: "silver",
      r: [
        "......AA......",
        "..A...AA...A..",
        ".AAA.AAAA.AAA.",
        "..AAAAAAAAAA..",
        "...AAACCAAA...",
        "..AAAC..CAAA..",
        "AAAAC....CAAAA",
        "AAAAB....BAAAA",
        "..AAAB..BAAA..",
        "...AAABBAAA...",
        "..AAAAAAAAAA..",
        ".AAA.AAAA.AAA.",
        "..A...AA...A..",
        "......AA......",
      ],
    },
    u_wolf_sword: {
      m: "iron",
      r: [
        "...........CC.",
        "..........CAAB",
        ".........CAABs",
        "........CAAB..",
        ".......CAABs..",
        "......CAAB....",
        ".....CAABs....",
        "....CAAB......",
        ".N.CAABs......",
        ".NsNAB........",
        "..sNN.........",
        ".TNN.N........",
        "TT............",
        "N.............",
      ],
    },
    u_wolf_bow: {
      m: "wood",
      r: [
        ".....nn.......",
        ".....CAw......",
        "....CA.w......",
        "...CA..w......",
        "...AB..w......",
        "..NsN..w......",
        "..sNs..w......",
        "..NsN..w......",
        "..nAB..w......",
        "..nAB..w......",
        "....AB.w......",
        ".....ABw......",
        ".....nn.......",
        "..............",
      ],
    },
    u_wolf_mage: {
      m: "wood",
      r: [
        "........n...n.",
        "........nn.nn.",
        "........nnnnn.",
        ".......nnrnnrn",
        "........nnnnnN",
        "........NnNnN.",
        ".......lL.....",
        "......lL......",
        ".....lL.......",
        "....lLN.......",
        "...lLsN.......",
        "..lL..........",
        ".lL...........",
        "lL............",
      ],
    },
    u_rift_sword: {
      m: "mithril",
      r: [
        "..........CCA.",
        ".........CAwAB",
        "........CAwAB.",
        ".......CAAwB..",
        "......CAwAB...",
        ".....CAwAB....",
        "....CAAwB.....",
        ".u.CAwAB......",
        "u.gCAAB.......",
        "..ggAB........",
        ".gvvg.........",
        ".vv..g........",
        "vv............",
        "v.............",
      ],
    },
    u_rift_bow: {
      m: "mithril",
      r: [
        "......C.......",
        ".....CAu......",
        "....CA..u.....",
        "...CA..u......",
        "..CA....u.....",
        "..AB...u......",
        ".vwwv...u.....",
        ".vwwv..u......",
        "..AB....u.....",
        "..AB...u......",
        "...AB..u......",
        "....AB..u.....",
        ".....BAu......",
        "......B.......",
      ],
    },
    u_rift_mage: {
      m: "mithril",
      r: [
        ".....u......u.",
        "..........ww..",
        ".........wuuw.",
        "..u......uwuu.",
        ".........wuuw.",
        "........g.ww..",
        ".......CAg....",
        "......CAB.....",
        ".....CAB......",
        "....CAB.......",
        "...CAB........",
        "..CAB.........",
        ".CAB..........",
        ".B............",
      ],
    },
    u_fang_sword: {
      m: "venom",
      r: [
        "...........Cn.",
        "..........CnnN",
        ".........CnnN.",
        "........CnnNi.",
        ".......CnnN.i.",
        "......CnnN..j.",
        ".....CnnN.....",
        "..i.CnnN......",
        "...ACnN.......",
        "...AAB........",
        "..ABjA........",
        ".AB...........",
        "AB............",
        "..............",
      ],
    },
    u_fang_bow: {
      m: "venom",
      r: [
        "....rAAw......",
        "....AxAw......",
        "....CA.w......",
        "...CA..w......",
        "...AB..w......",
        "..jAj..w......",
        "..AjA..w......",
        "..jAj..w......",
        "...AB..w......",
        "...AB..w......",
        "....AB.w...i..",
        ".....ABw...i..",
        "......AB...j..",
        "..............",
      ],
    },
    u_fang_mage: {
      m: "venom",
      r: [
        ".........CAA..",
        "........CAxAA.",
        "........AAAAr.",
        ".........nBn..",
        "........lAA...",
        ".......AlL....",
        "......lLAA....",
        ".....AAL......",
        "....lLAA......",
        "...AAL........",
        "..lL..........",
        ".lL...........",
        "lL............",
        "..............",
      ],
    },
    u_riftb_sword: {
      m: "void",
      r: [
        ".........P..CA",
        "........P..CAB",
        ".......P..CAB.",
        "......P..CAB..",
        ".....P..CAB...",
        "....P..CAB....",
        "...P..CAB.....",
        "..P..CAB......",
        "....CAB.......",
        ".g.CAB........",
        "..gAB.........",
        "..dgg.........",
        ".dd...........",
        "dd............",
      ],
    },
    u_riftb_bow: {
      m: "void",
      r: [
        "......CA......",
        ".....CA.w.....",
        "....CA..w.PP..",
        "...CA...wPzzP.",
        "...AB...PzmzP.",
        "..ddd...PzzzP.",
        "..dgd...PzmzP.",
        "..ddd...PzzzP.",
        "...AB...PzzP..",
        "...AB...wPP...",
        "....AB..w.....",
        ".....AB.w.....",
        "......ABw.....",
        ".......B......",
      ],
    },
    u_riftb_mage: {
      m: "void",
      r: [
        ".........PPP..",
        "........PzzzP.",
        ".......PzmzzzP",
        ".......PzzmzzP",
        ".......PzzzmzP",
        "........PzzzP.",
        ".......gCPPP..",
        "......CAB.....",
        ".....CAB......",
        "....CAB.......",
        "...CAB........",
        "..CAB.........",
        ".CAB..........",
        ".B............",
      ],
    },
    u_cmd_sword: {
      m: "gold",
      r: [
        ".ee.......CCA.",
        ".eee.....CAAAB",
        ".ee.....CAAAB.",
        ".l.....CAAAB..",
        ".l....CAAAB...",
        ".l...CAAAB....",
        ".l..CAAAB.....",
        ".g.CAAAB......",
        "g.gCAAB.......",
        "..ggAB........",
        ".gLLg.........",
        ".LL..g........",
        "LL............",
        "L.............",
      ],
    },
    u_cmd_bow: {
      m: "wood",
      r: [
        ".....CA...ee..",
        "....CA.w..eee.",
        "...CA..w..ee..",
        "...AB..w..l...",
        "..AB...w..l...",
        "..gSg..w..l...",
        "..SgS..w..l...",
        "..gSg..w..l...",
        "..AB...w..l...",
        "..AB...w..l...",
        "...AB..w..l...",
        "....AB.w..l...",
        ".....CAw......",
        "..............",
      ],
    },
    u_cmd_mage: {
      m: "wood",
      r: [
        ".e.....e......",
        "........SSS.e.",
        ".......SgygS..",
        ".......SgggS..",
        "..e.....SSS...",
        ".......lL.....",
        "......lL......",
        ".....lL.......",
        "....lL........",
        "...lL.........",
        "..lL..........",
        ".lL...........",
        "lL............",
        "..............",
      ],
    },
    u_endb_sword: {
      m: "doom",
      r: [
        "..........RCA.",
        ".........CArAB",
        "........CArAB.",
        ".......CAArB..",
        "......CArAB...",
        ".....CArAB....",
        "....CAArB.....",
        ".R.CArAB......",
        ".RRCAAB.......",
        "..RRAB........",
        ".RxxR.........",
        ".xx..R........",
        "xx............",
        "r.............",
      ],
    },
    u_endb_bow: {
      m: "doom",
      r: [
        "......CA......",
        ".....CAr......",
        "....CA.r......",
        "...CA..r......",
        "..RAB..r......",
        ".RRRR..r......",
        "..RrR..r......",
        ".RRRR..r......",
        "..RAB..r......",
        "...AB..r......",
        "....AB.r......",
        ".....ABr......",
        "......AB......",
        "..............",
      ],
    },
    u_endb_mage: {
      m: "doom",
      r: [
        ".......R...R..",
        ".......RR.RR..",
        "........rrr...",
        ".......rrwrr..",
        "........rrr...",
        ".......RCAR...",
        ".......CAB....",
        "......CAB.....",
        ".....CAB......",
        "....CAB.......",
        "...CAB........",
        "..CAB.........",
        ".CAB..........",
        ".B............",
      ],
    },
    u_hush: {
      m: "slate",
      r: [
        "......CC......",
        "....CCAAAB....",
        "...CAAAAAAB...",
        "..CAAAAAAAAB..",
        "..AAxxxxxxAB..",
        ".CAxxwxxwxxAB.",
        ".AAxxxxxxxxAB.",
        ".AAssssssssAB.",
        ".AAsGsGsGssAB.",
        ".AAssssssssAB.",
        ".BAAxxxxxxABB.",
        "..BAAAAAAABB..",
        "...BBBBBBBB...",
        "..............",
      ],
    },
    u_void: {
      m: "void",
      r: [
        "..............",
        ".....CCCC.....",
        "...CCAAAAAB...",
        "..CAAAAAAAAB..",
        "..AAAwwwwAAB..",
        ".CAAwwmmwwAAB.",
        ".AAwwmxxmwwAB.",
        ".AAwwmxxmwwAB.",
        ".AAAwwmmwwABB.",
        "..AAAwwwwAAB..",
        "..BAAAAAAABB..",
        "..BB.BBBB.BB..",
        "..............",
        "..............",
      ],
    },
    u_thirst: {
      m: "crim",
      r: [
        "..............",
        ".C....C....C..",
        ".AC..CAB..CAB.",
        ".AAC.AAB.CAAB.",
        ".AAACAAABAAAB.",
        ".AAAAArAAAAAB.",
        ".BAAArrRAAABB.",
        ".gggggggggggg.",
        ".nRnRnRnRnRnR.",
        ".n.n.n.n.n.n..",
        "...r.....r....",
        "...R.....r....",
        ".........R....",
        "..............",
      ],
    },
    u_reso: {
      m: "silver",
      r: [
        "..............",
        "..............",
        ".....CuuA.....",
        "e...CAuuAB...e",
        ".e.CAAAAAAB.e.",
        "e.CAuAAAAuAB.e",
        ".eAAAAAAAAAAe.",
        "e.AAAAeeAAAB.e",
        "..ggggggggggg.",
        "..BBBBBBBBBB..",
        "..............",
        "..............",
        "..............",
        "..............",
      ],
    },
    u_omni: {
      m: "gold",
      r: [
        "..............",
        ".r....y....p..",
        ".C...CAB...C..",
        ".AC..AAB..CA..",
        ".AAC.AAB.CAA..",
        ".AAACAAABAAAB.",
        ".AAAAAAAAAAAB.",
        ".AeAAuAArAAeB.",
        ".gggggggggggg.",
        ".BBBBBBBBBBBB.",
        "..............",
        "..............",
        "..............",
        "..............",
      ],
    },
    u_frostc: {
      m: "frost",
      r: [
        "..............",
        ".c....c....c..",
        ".C...cCc...C..",
        ".AC..CAB..CA..",
        ".AAc.AAB.cAA..",
        ".AAACAAABAAAB.",
        ".AcAAAuuAAcAB.",
        ".AAAAuwuuAAAB.",
        ".BBAAAuuAABBB.",
        "..c.B.c..B.c..",
        "..c...c....c..",
        "......c.......",
        "..............",
        "..............",
      ],
    },
    u_jcrown: {
      m: "gold",
      r: [
        "......y.......",
        "...y.yyy.y....",
        "....yyryy.....",
        "...yyrwryy....",
        "....yyryy.....",
        ".C...yyy...C..",
        ".AC..CAB..CA..",
        ".AACCAAABCAA..",
        ".AAAAAAAAAAAB.",
        ".AuAAArAAAuAB.",
        ".gggggggggggg.",
        ".BBBBBBBBBBBB.",
        "..............",
        "..............",
      ],
    },
    u_ember: {
      m: "obsid",
      r: [
        "..............",
        ".CCC......CCC.",
        "CAAAC....CAAAB",
        "CAAAACCCCAAAAB",
        "BAAAAqoqAAAABB",
        ".BBAAorroAABB.",
        "...AAqrwrqA...",
        "...CAoqrqoB...",
        "...AAAqoqAB...",
        "...AAqAAAqB...",
        "...AqAAAAAB...",
        "....BBqBBB....",
        "..............",
        "..............",
      ],
    },
    u_vamp: {
      m: "night",
      r: [
        "..............",
        "..RR......RR..",
        "..RAR.CC.RAR..",
        "..RAACAAAAAR..",
        "..AAAAAAAAAB..",
        ".CAAARRRRAAAB.",
        ".AAARRRRRRAAB.",
        "CAAARRrrRRAAAB",
        "AAAARRrrRRAAAB",
        "AAAARRRRRRAABB",
        "AAAAARRRRAAABB",
        "A.AB.AAAA.AB.B",
        "..B..B..B..B..",
        "..............",
      ],
    },
    u_flesh: {
      m: "flesh",
      r: [
        "..............",
        ".CCC......CCC.",
        "CAAAC....CAAAB",
        "CAAAACCCCAAAAB",
        "BAnAARAARAAnBB",
        ".BnAAAAAAAAnB.",
        "..nARAnnARAn..",
        "..CAAAnnAAAB..",
        "..AARAAAARAB..",
        "..AAAnnnnAAB..",
        "..ARAAAAAARB..",
        "...BBBBBBBB...",
        "..............",
        "..............",
      ],
    },
    u_oath: {
      m: "steel",
      r: [
        "..............",
        ".CCC......CCC.",
        "CAAAC....CAAAB",
        "CAAAACCCCAAAAB",
        "BAAAAArAAAAABB",
        ".BBAArrrAAABB.",
        "...AArrrrAA...",
        "...CArrwrAB...",
        "...AAArrAAB...",
        "...ssssssss...",
        "...AAAAAAAB...",
        "....BBBBBB....",
        "..............",
        "..............",
      ],
    },
    u_thorn: {
      m: "iron",
      r: [
        "....n....n....",
        ".CCCh.nn.hCCC.",
        "CAAAhChhCAhAAB",
        "nhAAAhCChAAAhn",
        "BAhAAAhhAAAhAB",
        ".BnhAAAAAAhnB.",
        "...AhAAAAhA...",
        "..nhAhAAhAhn..",
        "...AAhAAhAB...",
        "..nAAAhhAAAn..",
        "...AAAAAAAB...",
        "....BBBBBB....",
        "..............",
        "..............",
      ],
    },
    u_pyre: {
      m: "crim",
      r: [
        "..............",
        "...CCC..CCC...",
        ".CCAAAggAAACC.",
        "CAAAAAAgAAAAAB",
        "CAAAAAAgAAAAAB",
        "AAB.AAAgAA.BAB",
        "BB..AAAgAA..BB",
        "....AAAAAA....",
        "....AAAAAA....",
        "...qAAqAAqA...",
        "...oqqoqqoq...",
        "..qyoqyoqyoq..",
        "..o.y.o.y.o...",
        "..............",
      ],
    },
    u_abyssc: {
      m: "abyss",
      r: [
        "..............",
        ".CCC......CCC.",
        "CZZZC....CZZZB",
        "CZZZZCCCCZZZZB",
        "BZZZZZZZZZZZBB",
        ".BBZZZeeZZZBB.",
        "...ZZeKKeZZ...",
        "...CZZeeZZB...",
        "...ZZZZZZZB...",
        "...ZZZZZZZB...",
        "...ZZZZZZZB...",
        "....BBBBBB....",
        "..............",
        "..............",
      ],
    },
    u_giant: {
      m: "stone",
      r: [
        "..............",
        "..CCCCCCCCC...",
        ".CAAHAAHAAAB..",
        ".CAAAAAAAAAB..",
        ".AAAHAAHAAABCC",
        ".AAAAAAAAAAAAB",
        ".AAAAAAAAAAAB.",
        ".BAAAAAAAAAB..",
        "..BAAAAAAAB...",
        "..ggggggggg...",
        "..AAAAAAAAB...",
        "..BBBBBBBBB...",
        "..............",
        "..............",
      ],
    },
    u_phase: {
      m: "frost",
      r: [
        "..............",
        "..W.W.W.......",
        ".W.W.W.W......",
        ".W....C.C.C...",
        ".W...CACACAC..",
        ".W...AAAAAAA..",
        "..W..AAAAAAA.C",
        "..W..AAAAAAACA",
        "..W..AAAAAAAAB",
        "...W.BAAAAAAB.",
        "....WBBBBBBB..",
        "....BBBBBBBBB.",
        "..............",
        "..............",
      ],
    },
    u_stars: {
      m: "night",
      r: [
        "...........y..",
        "....C.C.C.....",
        "...CACACAC....",
        "...AASAAAA....",
        "...AAAAASA.C..",
        "...ASAAAAACA..",
        "...AAAASAAAB..",
        "...AAAAAAAB...",
        "...BASAAAAB...",
        "...BAAAAAB....",
        "...gggggggg...",
        "..BBBBBBBBB...",
        "..............",
        "..............",
      ],
    },
    u_echo: {
      m: "silver",
      r: [
        "..............",
        "....C.C.C.....",
        "...CACACAC....",
        "...AAAAAAA...r",
        "...AAAcAAA.rr.",
        "...AAcwcAAr...",
        "...AcccccAuuuu",
        "...AAAAAAAe...",
        "...AAAAAAB.ee.",
        "...BAAAAAB...e",
        "...BBBBBBB....",
        "..BBBBBBBBB...",
        "..............",
        "..............",
      ],
    },
    u_vortg: {
      m: "abyss",
      r: [
        "..............",
        "....C.C.C.....",
        "...CACACAC....",
        "...AAAAAAA....",
        "...AKKKKAA.C..",
        "...KAAAAKACA..",
        "...KAKKAKAAB..",
        "...KAKAAKAB...",
        "...KAAKKAAB...",
        "...BKKAAAB....",
        "...BBBBBBB....",
        "..BBBBBBBBB...",
        "..............",
        "..............",
      ],
    },
    u_schain: {
      m: "night",
      r: [
        "..........KK..",
        ".........KwKK.",
        "....C.C.C.KK..",
        "...CACACAC.s..",
        "...AAAAAAA.s..",
        "...AAAAAAA.s.C",
        "...AAAAAAAs.CA",
        "...AAAAAAAsAAB",
        "...BAAAAAAsAB.",
        "...BAAAAAAs...",
        "...ssssssss...",
        "..BBBBBBBBB...",
        "..............",
        "..............",
      ],
    },
    u_road: {
      m: "leather",
      r: [
        "..............",
        "...CCCCCC.....",
        "...TTTTTT.....",
        "...CAAAAB.....",
        "...CAgAAB.....",
        "...CAAAAB.....",
        "...CttTAB.....",
        "...CtTtAAB....",
        "...CAAAAAAAB..",
        "..CAAAAAAAAAB.",
        "..AAAAAAAAAAB.",
        "..LLLLLLLLLLL.",
        ".N..N.N...N...",
        "N.N..N.....N..",
      ],
    },
    u_gale: {
      m: "silver",
      r: [
        ".w............",
        "wwC.CCCCCC....",
        ".wwCAAAAAB....",
        "wwwwCAAAAB....",
        ".wwwCAAAAB....",
        "..wwCAAAAB....",
        "....CAAAAB....",
        "....CAAAAAB...",
        "....CAAAAAAAB.",
        "...CAAAAAAAAAB",
        "...AAAAAAAAAAB",
        "...uuuuuuuuuuu",
        ".u...u....u...",
        "..............",
      ],
    },
    u_surge: {
      m: "mithril",
      r: [
        "..............",
        "...CCCCCCC....",
        "...AAAAAAB....",
        "...CAAAAAB....",
        "...CAuuAAB....",
        "...CAAAAAB....",
        "...CAAAAAB....",
        "...CAAAAAAB...",
        "...CAAAAAAAB..",
        "..CAAAAAAAAAB.",
        ".wuwAAAAAAuwB.",
        "uuwuuwuuwuuwuu",
        "vuuvuuvuuvuuvu",
        "..............",
      ],
    },
    u_magma: {
      m: "stone",
      r: [
        "..............",
        "...CCCCCCC....",
        "...AAqAAAB....",
        "...BBqBBBB....",
        "...CAqoAAB....",
        "...CAAqAAB....",
        "...CAAoqAB....",
        "...CAAAqAAB...",
        "...CAqAoqAAB..",
        "..CAqoAAAqAAB.",
        "..AoAAAAAAoqB.",
        "..qqoqqoqqoqq.",
        "...o..q..o....",
        "..............",
      ],
    },
    u_snare: {
      m: "leather",
      r: [
        ".........r....",
        "...CCCCCrR....",
        "...TtAAtR.....",
        "...AtAAtA.....",
        "...AAttAA.....",
        "...AtAAtA.....",
        "...TtAAtT.....",
        "...AAttAAB....",
        "...AtAAtAAAB..",
        "..CAAAAAAAAAB.",
        "..AAAAAAAAAAB.",
        "..LLLLLLLLLLL.",
        "..............",
        "..............",
      ],
    },
    u_hwalk: {
      m: "night",
      r: [
        "..K.......K...",
        ".KwK.....KwK..",
        "..K.CCCCCCK...",
        "...CAAAAAB....",
        "...CAnnAAB....",
        "...CAxnxAB....",
        "...CAnnnAB....",
        "...CAAAAAAB...",
        "...CAAAAAAAB..",
        "..CAAAAAAAAAB.",
        "..AAAAAAAAAAB.",
        "..KKKKKKKKKKK.",
        ".K..K..K..K...",
        "..............",
      ],
    },
    u_star: {
      m: "gold",
      r: [
        "......S.......",
        "......S.......",
        ".....SyS......",
        "..SSSywySSS...",
        ".....SyS......",
        "....CASAAB....",
        "...CA....AB...",
        "..CA......AB..",
        "..A........B..",
        "..A........B..",
        "..AB......BB..",
        "...AB....BB...",
        "....BBBBBB....",
        "..............",
      ],
    },
    u_twin: {
      m: "gold",
      r: [
        "..............",
        "..............",
        "..CCCC...sss..",
        ".CA..ABss...G.",
        ".A....sB.....G",
        ".A...s.B.....G",
        ".AB..s.B.....G",
        "..ABBsBB....G.",
        "......s....G..",
        ".......GGGG...",
        "..............",
        "..............",
        "..............",
        "..............",
      ],
    },
    u_ovf: {
      m: "silver",
      r: [
        ".y....y....y..",
        "..y...y...y...",
        "....yyyyy.....",
        "yy.yywwwyy.yy.",
        "....ywuwy.....",
        "....CyyyB.....",
        "...CA....AB...",
        "..CA......AB..",
        "..A........B..",
        "..A........B..",
        "..AB......BB..",
        "...AB....BB...",
        "....BBBBBB....",
        "..............",
      ],
    },
    u_scav: {
      m: "copper",
      r: [
        "..............",
        "..............",
        "..............",
        ".....CCCC.....",
        "....CAAAAB....",
        "...CA....AB...",
        "..CA......AB..",
        "..A........B..",
        "..A......ggg..",
        "..AB....gyyyg.",
        "...AB..ggggg..",
        "....BBgyyyyyg.",
        ".....gggggggg.",
        "..............",
      ],
    },
    u_bipol: {
      m: "silver",
      r: [
        "..............",
        ".....iiPP.....",
        "....iiiPPP....",
        "....ijiPdP....",
        "....iiiPPP....",
        "....CjiPdB....",
        "...CA....AB...",
        "..CA......AB..",
        "..A........B..",
        "..A........B..",
        "..AB......BB..",
        "...AB....BB...",
        "....BBBBBB....",
        "..............",
      ],
    },
    u_roots: {
      m: "wood",
      r: [
        ".....e.e......",
        "....eehee.....",
        ".....ehe......",
        "......l.......",
        "....CAlAAB....",
        "...CA.L..AB...",
        "..CA......AB..",
        "..A........B..",
        "..A........B..",
        "..AB......BB..",
        "..lAB....BBL..",
        ".l..BBBBBB..L.",
        "l..........L..",
        "..............",
      ],
    },
    u_crsr: {
      m: "dark",
      r: [
        "..p.......p...",
        ".p..xxxx...p..",
        "...xppppx.....",
        "..xpwppwpx....",
        "..xpxppxpx....",
        "...xppppx.....",
        "...CAxxAB.....",
        "..CA....AB....",
        ".CA......AB...",
        ".A........B...",
        ".AB......BB...",
        "..AB....BB....",
        "...BBBBBB.....",
        "..............",
      ],
    },
    u_trigd: {
      m: "gold",
      r: [
        ".p..........p.",
        "p..p......p..p",
        "p.p..rrrr..p.p",
        "p.p.rrwrrr.p.p",
        ".p.p.rrRr.p.p.",
        "....CArRAB....",
        "...CA....AB...",
        "..CA......AB..",
        "..A........B..",
        "..A........B..",
        "..AB......BB..",
        "...AB....BB...",
        "....BBBBBB....",
        "..............",
      ],
    },
    u_kingr: {
      m: "gold",
      r: [
        ".......SS.....",
        "......SS......",
        ".....SSSSS....",
        ".......SS.....",
        "......SS......",
        "....CASAAB....",
        "...CA....AB...",
        "..CA......AB..",
        "..A........B..",
        "..A........B..",
        "..AB......BB..",
        "...AB....BB...",
        "....BBBBBB....",
        "..............",
      ],
    },
    u_blood: {
      m: "gold",
      r: [
        "g............g",
        ".g..........g.",
        "..g........g..",
        "...g......g...",
        "....g....g....",
        ".....gggg.....",
        "......rr......",
        ".....rrrR.....",
        "....rwrrRR....",
        "....rrrrRR....",
        "....rryRRR....",
        ".....rRRR.....",
        "......RR......",
        "..............",
      ],
    },
    u_sand: {
      m: "gold",
      r: [
        "s............s",
        ".s..........s.",
        "..s........s..",
        "...s......s...",
        "....s....s....",
        "....CAAAAB....",
        "....coooooc...",
        ".....cooo.c...",
        "......coc.....",
        ".....c.o.c....",
        "....c..o..c...",
        "....cooooo.c..",
        "....BAAAAAB...",
        "..............",
      ],
    },
    u_gland: {
      m: "venom",
      r: [
        "s............s",
        ".s..........s.",
        "..s........s..",
        "...s......s...",
        "....s....s....",
        ".....sLLs.....",
        "......cc......",
        ".....cAAc.....",
        "....cAiAAc....",
        "...cAAAAAAc...",
        "...cAAAAAAc...",
        "...cAAAAABc...",
        "....cBBBBc....",
        ".....cccc.....",
      ],
    },
    u_boom: {
      m: "bone",
      r: [
        "L............L",
        ".L..........L.",
        "..L........L..",
        "...L......L...",
        "....L....L....",
        "..o..nnnn..o..",
        "...onnnnnno...",
        "...nxxnnxxn...",
        "...nxrnnrxn...",
        "....nnxxnn....",
        "..o.NnNnN..o..",
        ".o...nnnn...o.",
        "..............",
        "..............",
      ],
    },
    u_astral: {
      m: "gold",
      r: [
        "g............g",
        ".g..........g.",
        "..g........g..",
        "...g......g...",
        "....g....g....",
        ".....gggg.....",
        ".S....uu....S.",
        ".....uwuu.....",
        "..S.uuuuvu.S..",
        ".....uuuv.....",
        "......vv......",
        ".S..........S.",
        "..............",
        "..............",
      ],
    },
    u_gore: {
      m: "crim",
      r: [
        "D............D",
        ".D..........D.",
        "..D........D..",
        "...D......D...",
        "....D....D....",
        ".....DDDD.....",
        "......RR......",
        ".....RrrR.....",
        "....RrwrrR....",
        "....RrrrjR....",
        "....RrrjjR....",
        ".....RjjR.....",
        "......jR......",
        "......j.......",
      ],
    },
  };
for (const [t, a, s] of [
  ["hmA0", "hm1", "copper"],
  ["hmC0", "hm0", "cloth"],
  ["hmC2", "hm0", "dark"],
  ["hmC3", "hm0", "silver"],
  ["chA0", "ch2", "copper"],
  ["chA2", "ch3", "steel"],
  ["chC2", "ch1", "dark"],
  ["chC3", "ch0", "silver"],
  ["glA0", "gl2", "copper"],
  ["glA2", "gl3", "steel"],
  ["glC2", "gl1", "dark"],
  ["glC3", "gl0", "silver"],
  ["boA0", "bo2", "copper"],
  ["boA2", "bo3", "steel"],
  ["boC2", "bo1", "dark"],
  ["boC3", "bo0", "silver"],
])
  ICONS[t] = { m: s, r: ICONS[a].r };
const ICON_SET = {
    weapon: {
      sword: ["sw0", "sw1", "sw2", "sw3"],
      bow: ["bw0", "bw1", "bw2", "bw3"],
      mage: ["st0", "st1", "st2", "st3"],
    },
    helm: ["hmA0", "hm1", "hm2", "hm3", "hmC0", "hm0", "hmC2", "hmC3"],
    chest: ["chA0", "ch2", "chA2", "ch3", "ch0", "ch1", "chC2", "chC3"],
    gloves: ["glA0", "gl2", "glA2", "gl3", "gl0", "gl1", "glC2", "glC3"],
    boots: ["boA0", "bo2", "boA2", "bo3", "bo0", "bo1", "boC2", "boC3"],
    ring: ["rg0", "rg1", "rg2", "rg3"],
    amulet: ["am0", "am1", "am2", "am3"],
  },
  RUNE_FAM = {
    wadd: 0,
    wdmg: 0,
    waspd: 1,
    wcrit: 0,
    adddmg: 0,
    dmgp: 0,
    skill: 0,
    minp: 0,
    crit: 0,
    critm: 0,
    aspd: 1,
    act: 1,
    move: 1,
    cdr: 1,
    area: 1,
    life: 2,
    lifep: 2,
    armor: 2,
    armorp: 2,
    eva: 2,
    evap: 2,
    regen: 2,
    lok: 2,
    revive: 2,
    pot: 2,
    psn: 0,
    brn: 0,
    bld: 0,
  },
  RUNE_MAT = [
    ["#ff6a5a", "#a82a3a", "#ffc0b0"],
    ["#9ad95a", "#4a8a2a", "#e0ffb0"],
    ["#6fb6ff", "#2a5aa8", "#d0e8ff"],
    ["#ff5a82", "#a8204a", "#ffd0dc"],
    ["#b48aff", "#5a3a9a", "#e8dcff"],
  ];
for (const t in AFFIX) isSlateAf(t) && (RUNE_FAM[t] = 4);
const FONT = {
  0: "111101101101111",
  1: "010110010010111",
  2: "111001111100111",
  3: "111001111001111",
  4: "101101111001001",
  5: "111100111001111",
  6: "111100111101111",
  7: "111001010010010",
  8: "111101111101111",
  9: "111101111001111",
  "+": "000010111010000",
  "-": "000000111000000",
  "/": "001001010100100",
  "!": "010010010000010",
  " ": "000000000000000",
  ".": "000000000000010",
  ":": "000010000010000",
  A: "111101111101101",
  B: "110101110101110",
  C: "111100100100111",
  D: "110101101101110",
  E: "111100111100111",
  G: "111100101101111",
  H: "101101111101101",
  I: "111010010010111",
  K: "101101110101101",
  L: "100100100100111",
  M: "101111111101101",
  N: "110101101101101",
  O: "111101101101111",
  P: "111101111100100",
  R: "110101110101101",
  S: "111100111001111",
  T: "111010010010010",
  U: "101101101101111",
  V: "101101101101010",
  X: "101101010101101",
  Y: "101101010010010",
  W: "101101111111101",
  F: "111100111100100",
};
let S = null,
  PS = null,
  G = null;
const SAVE_KEY = "ro-wanderer.v3.v1";
function newState(t) {
  return {
    v: 1,
    t: Date.now(),
    cls: t,
    name: "",
    cid: "",
    lvl: 1,
    xp: 0,
    hp: 1e9,
    ash: 0,
    pot: 5,
    mat: {},
    potPct: 40,
    equip: {},
    bag: [],
    runes: [],
    gems: [],
    gp: 0,
    gpages: [null, null, null],
    bld: [null, null, null],
    bldN: ["", "", ""],
    uid: 1,
    sx: 0,
    map: 0,
    unlocked: 0,
    prog: MAPS.map(() => 0),
    beat: MAPS.map(() => 0),
    kills: {},
    slates: [],
    slt: [],
    gd: { t: [0, 0, 0], f: [0, 0, 0], w: [0, 0, 0], e: 0, m: 0 },
    tw: { best: 0, ms: 0, runs: 0, mk: 0, bd: 0 },
    lb: { id: "", key: "", name: "", sent: 0, sn: "" },
    title: "",
    q: 0,
    qp: 0,
    tal: { asc: "", p: [], n: 0, tr: 0 },
    art: { on: "", has: {} },
    ssSeen: 0,
    mvs: { map: 1, ss: 1, st: 1 },
    st: { d: "", t: 0, k0: 0, die: {}, b: 0, bw: 0 },
    ssf: [0, 0, 0],
    trn: { t: 0, n: 0, m: 0, r: 0, p: 0, a: 0 },
    set: {
      speed: 1,
      auto: [0, 0, 0],
      dev: 0,
      ab: 0,
      mus: 0.5,
      sfx: 0.7,
      keep: [],
      minG: 0,
      trapFx: 0,
    },
    total: 0,
    kpm: 0,
    ses: null,
    mt: [],
    help: {},
    logV: "",
    born: Date.now(),
    def2: 1,
    def3: 1,
    af3: 1,
    q2: 1,
    nm1: 1,
    sh1: 1,
    alc1: 1,
    alc2: 1,
    alc3: 1,
    sl2: 1,
    wc1: 1,
    sl3: 1,
    sl4: 1,
    sl5: 1,
    sl6: 1,
    slg1: 1,
    ssd1: 1,
    rg1: 1,
    alchOn: 0,
    rc: {},
  };
}
const uid = () => S.uid++;
function makeSlate(t) {
  const a = ri(0, 2),
    s = SLATE[a].r,
    e = {
      u: uid(),
      sl: 1,
      slot: "slate",
      b: a,
      name: SLATE[a].n,
      v: ri(s[0], s[1]),
      rar: pickW([0, 1, 2, 3], (t) => [45, 35, 16, 4][t]),
      ilvl: t,
      af: [],
      nw: 1,
    };
  return (
    addAffixes(e, ri(...RAR_AFFIX[e.rar])),
    (e.dg = []),
    addDanger(
      e,
      pickW([0, 1, 2], (t) => DG_N[t]),
    ),
    e
  );
}
function makeMythSlate(t) {
  const a = SLATE.findIndex((t) => t.my),
    s = {
      u: uid(),
      sl: 1,
      slot: "slate",
      b: a,
      name: SLATE[a].n,
      v: 1,
      rar: 3,
      my: 1,
      ilvl: t,
      af: [],
      dg: [],
      nw: 1,
    };
  return (addAffixes(s, 6), addDanger(s, 4), s);
}
function makeSockSlate(t) {
  const a = ri(0, 2),
    s = SLATE[a].r,
    e = pickW(SSL.n, (t) => SSL.w[SSL.n.indexOf(t)]),
    n = {
      u: uid(),
      sl: 1,
      slot: "slate",
      b: a,
      name: "插槽・" + SLATE[a].n,
      v: ri(s[0], s[1]),
      rar: 0,
      ilvl: t,
      af: [],
      dg: [],
      sock: { n: e, mode: "d", st: [] },
      nw: 1,
    };
  return (addDanger(n, e), n);
}
function addDanger(t, a) {
  for (let s = 0; s < a; s++) {
    const a = affixPool("dg").filter((a) => !t.dg.some((t) => t.a === a));
    if (!a.length) break;
    const s = pickW(a, (t) => AFFIX[t].w);
    t.dg.push(rollAffix(s, rollTier(s, t.ilvl)));
  }
}
const slLines = (t) => (t.dg ? [...t.af, ...t.dg] : t.af),
  slotsOf = () => (S.slt[0] ||= { s: [null, null, null], k: 0 }),
  slateOpen = () => Math.min(slateCap(), 1 + Math.floor(slotsOf().k / 1e3)),
  slatesOn = () => (S.slt[0]?.s || []).filter(Boolean),
  slatesPlaced = () => slatesOn(),
  slK = (t) => (t.sock || t.fused ? SSL.k : 1),
  slateDanger = (t = S.map) =>
    Math.round(
      slatesOn(t).reduce(
        (t, a) =>
          t +
          slK(a) *
            slLines(a).reduce(
              (t, a) => t + (AFFIX[a.a].dg ? AFFIX[a.a].dg(a.v) : 0),
              0,
            ),
        0,
      ),
    ),
  slateRwMul = (t = S.map) => 1 + slateDanger(t) / 200,
  slateQty = (t = S.map) => 1 + slateDanger(t) / 400,
  slHealMul = () => Math.max(0.1, 1 - slateSum("sl_heal") / 100);
function slateSum(t, a = S.map, s) {
  if (!s && G && G.tw && a === S.map) return G.tw.r[t] || 0;
  let e = 0;
  for (const s of slatesOn(a)) {
    const a = slK(s);
    SLATE[s.b].k === t && (e += s.v * a);
    for (const n of slLines(s)) n.a === t && (e += n.v * a);
  }
  return e && AFFIX[t]?.rw ? Math.round(e * slateRwMul(a)) : Math.round(e);
}
const slateKeys = (t, a = S.map) => [
    ...new Set(
      slatesOn(a)
        .flatMap((t) => slLines(t).map((t) => t.a))
        .filter((a) => a.startsWith(t)),
    ),
  ],
  mapLv = (t = S.map) => {
    const a = slatesOn(t).length ? [slateLv(t), slateLv(t)] : MAPS[t].lv,
      s = "function" == typeof v56AbyLv ? v56AbyLv(t) : 0;
    return s && s > a[1] ? [s, s] : a;
  },
  slateAsh = (t) =>
    Math.round([20, 40, 80, 160, 320][t.sock ? 2 : t.rar] * (1 + t.ilvl / 30));
function giveGem(t) {
  S.gems.push({ u: uid(), id: t, x: -1, y: -1, rot: 0 });
}
function makeMutGem() {
  const t = CLASS[S.cls].gems,
    a = t[ri(0, t.length - 1)];
  return {
    u: uid(),
    id: a,
    x: -1,
    y: -1,
    rot: 0,
    sh: mutShape(SKILLS[a].shape),
  };
}
const polyKey = (t) => {
    let a = null;
    for (let s = 0; s < 4; s++) {
      const e = t.map((t) => rotCell(t, s)),
        n = Math.min(...e.map((t) => t[0])),
        l = Math.min(...e.map((t) => t[1])),
        o = e
          .map(([t, a]) => t - n + "," + (a - l))
          .sort()
          .join(" ");
      (null === a || o < a) && (a = o);
    }
    return a;
  },
  gemStk = (t) => t.id + ":" + (t.sh ? polyKey(t.sh) : "") + (t.mu ? "~" + t.u : "") + ":" + (t.sx || "");
function gemStacks(t, a = gemStk) {
  const s = new Map();
  for (const e of t) {
    const t = a(e);
    s.has(t) ? s.get(t).push(e) : s.set(t, [e]);
  }
  return [...s.values()];
}
function polyConn(t) {
  const a = new Set(t.map((t) => t + "")),
    s = new Set([t[0] + ""]),
    e = [t[0]];
  for (; e.length;) {
    const [t, n] = e.pop();
    for (const l of [
      [t + 1, n],
      [t - 1, n],
      [t, n + 1],
      [t, n - 1],
    ])
      a.has(l + "") && !s.has(l + "") && (s.add(l + ""), e.push(l));
  }
  return s.size === t.length;
}
function mutShape(t) {
  const a = (t) => {
      const a = new Set(t.map((t) => t + "")),
        s = [];
      for (const [e, n] of t)
        for (const t of [
          [e + 1, n],
          [e - 1, n],
          [e, n + 1],
          [e, n - 1],
        ])
          a.has(t + "") || (a.add(t + ""), s.push(t));
      return [...t, s[ri(0, s.length - 1)]];
    },
    s = polyKey(t);
  for (let e = 0; e < 80; e++) {
    const e = pickW([0, 1, 2], (t) => MUT.w[t]);
    let n;
    if (1 === e) {
      if (t.length >= MUT.max) continue;
      n = a(t);
    } else if (2 === e) {
      if (t.length <= 1) continue;
      const a = ri(0, t.length - 1);
      if (((n = t.filter((t, s) => s !== a)), !polyConn(n))) continue;
    } else for (n = [[0, 0]]; n.length < t.length;) n = a(n);
    if (polyKey(n) === s) continue;
    const [l, o] = n.slice().sort((t, a) => t[1] - a[1] || t[0] - a[0])[0];
    return n.map(([t, a]) => [t - l, a - o]);
  }
  return t.map((t) => t.slice());
}
function rollTier(t, a) {
  const s = AFFIX[t].t,
    e = s.map((t, a) => a).filter((t) => s[t].l <= a && s[t].w > 0);
  return s.length - pickW(e.length ? e : [0], (t) => s[t].w);
}
function rollAffix(t, a) {
  const [s, e] = tierRange(t, a);
  return { a: t, t: a, v: ri(s, e) };
}
function addAffixes(t, a, s = 1) {
  for (let e = 0; e < a; e++) {
    const a = affixPool(t.slot).filter((a) => !t.af.some((t) => t.a === a));
    if (!a.length) break;
    const e = pickW(a, (t) => AFFIX[t].w);
    let n = rollTier(e, t.ilvl);
    for (let a = 1; a < s; a++) n = Math.min(n, rollTier(e, t.ilvl));
    t.af.push(rollAffix(e, n));
  }
}
const slotW = (t) => ("weapon" === t ? 1.3 : 1),
  baseTier = (t) => Math.min(3, Math.floor(t / 22)),
  isArmourSlot = (t) => ["helm", "chest", "gloves", "boots"].includes(t);
function setBase(t, a) {
  ((t.bi = a),
    (t.base = "weapon" === t.slot ? BASES.weapon[S.cls][a] : BASES[t.slot][a]),
    isArmourSlot(t.slot) && (t.dt = a >= 4 ? "e" : "a"));
}
function wpnTo(t, a, s) {
  const e = WEAPON[a],
    n = WEAPON[s];
  if ("weapon" !== t.slot || !t.wd || !e || !n || a === s) return;
  const l = t.bi ?? Math.max(0, BASES.weapon[a].indexOf(t.base)),
    o = (n.a + n.k * t.ilvl) / (e.a + e.k * t.ilvl);
  ((t.bi = l),
    (t.base = BASES.weapon[s][l]),
    (t.wd = [
      Math.max(1, Math.round(t.wd[0] * o)),
      Math.max(2, Math.round(t.wd[1] * o)),
      n.aps,
      (t.wd[3] ?? e.c) - e.c + n.c,
    ]));
}
const BASE_F = [0.92, 1.08];
function baseInfo(t) {
  if (t.sl) {
    const a = SLATE[t.b].r;
    return a && a[1] > a[0] && !t.my
      ? { v: [t.v], lo: [a[0]], hi: [a[1]] }
      : null;
  }
  if (t.wd) {
    const a = WEAPON[S.cls],
      s = a.a + a.k * t.ilvl,
      e = [0.75, 1.25],
      n = [1, 2],
      l = (t) => e.map((a, e) => Math.max(n[e], Math.round(s * a * t)));
    return { v: [t.wd[0], t.wd[1]], lo: l(BASE_F[0]), hi: l(BASE_F[1]) };
  }
  if (t.dt) {
    const a =
      ("chest" === t.slot ? 8 + 5 * t.ilvl : 4 + 2.5 * t.ilvl) *
      ("e" === t.dt ? 0.75 : 1);
    return {
      v: ["e" === t.dt ? t.eva : t.arm],
      lo: [Math.round(a * BASE_F[0])],
      hi: [Math.round(a * BASE_F[1])],
    };
  }
  return null;
}
function baseQ(t) {
  const a = baseInfo(t);
  return a
    ? a.v.reduce(
        (t, s, e) =>
          t +
          (a.hi[e] > a.lo[e]
            ? clamp((s - a.lo[e]) / (a.hi[e] - a.lo[e]), 0, 1)
            : 1),
        0,
      ) / a.v.length
    : -1;
}
function defBase(t, a = 1) {
  const s = ("chest" === t.slot ? 8 + 5 * t.ilvl : 4 + 2.5 * t.ilvl) * a;
  (delete t.arm,
    delete t.eva,
    "e" === t.dt ? (t.eva = Math.round(0.75 * s)) : (t.arm = Math.round(s)));
}
const UQ_LINE = { phase: "e", flesh: "a", thorn: "a", ember: "a" };
function makeItem(t, a = {}) {
  let s = a.slot || pickW(SLOTS, slotW),
    e = null;
  if (a.uqk) ((e = a.uqk), (s = UNIQUE[e].slot));
  else if (a.uniq) {
    const n = t >= 83 && (t >= 90 || RAND() < endF(t)) ? 2 : t >= 60 ? 1 : 0,
      l = Object.keys(UNIQUE).filter(
        (t) =>
          (UNIQUE[t].hi || 0) <= n && !UNIQUE[t].my && (!UNIQUE[t].ss || a.ss),
      );
    ((e = pickW(l, (t) => (UNIQUE[t].ss ? SS.uqW : UQ_W[UNIQUE[t].hi || 0]))),
      (s = UNIQUE[e].slot));
  }
  const n = { u: uid(), slot: s, ilvl: t, rar: 0, af: [], nw: 1 },
    l =
      isArmourSlot(s) &&
      "e" === ((e && UQ_LINE[e]) || (RAND() < 0.5 ? "a" : "e"))
        ? 4
        : 0;
  if ((setBase(n, baseTier(t) + l), "weapon" === s)) {
    const a = WEAPON[S.cls],
      s = a.a + a.k * t;
    n.wd = [
      Math.max(1, Math.round(0.75 * s * rf(0.92, 1.08))),
      Math.max(2, Math.round(1.25 * s * rf(0.92, 1.08))),
      a.aps,
      a.c,
    ];
  } else n.dt && defBase(n, rf(0.92, 1.08));
  if (a.sock) {
    const t = pickW(
      [2, 3, 4, 5, 6],
      (t) => ({ 2: 35, 3: 30, 4: 20, 5: 10, 6: 5 })[t],
    );
    return (
      (n.sock = { n: t, mode: RAND() < 0.8 ? "d" : "a", st: [] }),
      (n.rar = -1),
      (n.name = "空白・" + n.base),
      n
    );
  }
  return e
    ? ((n.uq = e),
      (n.hi = UNIQUE[e].hi),
      (n.rar = 3),
      (n.name = UNIQUE[e].n),
      UNIQUE[e].my && (n.my = 1),
      addAffixes(n, n.my ? 8 : UQ_AFFIX(t)),
      n)
    : ((n.rar =
        null != a.rar
          ? a.rar
          : pickW(
              [0, 1, 2, 3],
              (s) =>
                (a.rw || [45, 35, 16, 4])[s] *
                (3 === s ? legF(t) : 1) *
                ((s >= 2 && a.dgr) || 1),
            )),
      addAffixes(n, ri(...RAR_AFFIX[n.rar]), 4 === n.rar ? 3 : 1),
      n);
}
function weaponLocal(t) {
  const a = { wadd: 0, wdmg: 0, waspd: 0, wcrit: 0 };
  for (const s of t.af) s.a in a && (a[s.a] += s.v);
  const s = 1 + a.wdmg / 100;
  return {
    mn: Math.round((t.wd[0] + a.wadd) * s),
    mx: Math.round((t.wd[1] + a.wadd) * s),
    aps: +(t.wd[2] * (1 + a.waspd / 100)).toFixed(2),
    crit: +((t.wd[3] || 5) * (1 + a.wcrit / 100)).toFixed(1),
    mod: a,
  };
}
const itemName = (t) => t.name || t.base,
  rarClass = (t) =>
    t.sock
      ? "a" === t.sock.mode
        ? "ra"
        : "rs"
      : t.my
        ? "rm"
        : t.uq
          ? "ru"
          : "r" + t.rar,
  rarBorder = (t) => (t.sock ? "bs" : t.my ? "bm" : t.uq ? "bu" : "b" + t.rar),
  rarLabel = (t) =>
    t.sock
      ? t.sl
        ? "插槽石板"
        : "d" === t.sock.mode
          ? "插槽裝備・異種"
          : "插槽裝備・任意"
      : t.my
        ? "主宰"
        : t.uq
          ? "season" === UNIQUE[t.uq]?.src
            ? "獨特・活動"
            : 4 === t.hi
              ? "獨特・終焉"
              : 3 === t.hi
                ? "獨特・守護者"
                : "獨特"
          : RAR_NAME[t.rar],
  RAR_COL = ["#e8e8e8", "#6fb6ff", "#ffd84a", "#ff9a3c", "#3ce0ff"],
  UQ_COL = "#ff5a82",
  MY_COL = "#ff3030",
  SOCK_COL = "#5fd0c0",
  SOCK_ANY = "#c8f060",
  rarColor = (t) =>
    t.sock
      ? "a" === t.sock.mode
        ? SOCK_ANY
        : SOCK_COL
      : t.my
        ? MY_COL
        : t.uq
          ? UQ_COL
          : RAR_COL[Math.max(0, t.rar)],
  rarTier = (t) => (t.sock || t.uq ? 3 : Math.max(0, t.rar));
function baseIdx(t) {
  if (null != t.bi) return t.bi;
  const a = ("weapon" === t.slot ? BASES.weapon[S.cls] : BASES[t.slot]).indexOf(
    t.base,
  );
  return a < 0 ? baseTier(t.ilvl) : a;
}
const rarKey = (t) => (t.sock ? 6 : t.uq ? 5 : Math.max(0, t.rar)),
  hasDv = (t) => !!(t && t.af && t.af.some((t) => null != AFFIX[t.a].dv)),
  rarOk = (t, a) =>
    -9 === a ||
    (7 === a
      ? hasDv(t)
      : 10 === a
        ? !!t.my
        : a > 7
          ? !!t.sock && t.sock.mode === (8 === a ? "d" : "a")
          : rarKey(t) === a),
  canAlch = (t) =>
    !t.cor && !t.sock && !(t.sl && t.fused) && t.af.length > 0 && t.rar >= 2,
  canInfuse = (t) =>
    !t.cor && !t.sock && !(t.sl && t.fused) && t.rar >= 1 && t.af.length > 0,
  canCorrupt = (t) =>
    !t.cor && !t.sock && !t.sl && (t.af.length > 0 || !!uqKey(t)),
  uqKeys = (t) => (t ? [t.uq, t.uqe, ...(t.uqx || [])].filter(Boolean) : []),
  uqKey = (t) => uqKeys(t)[0],
  KEEP_K = {
    any: "任意詞綴",
    af: "指定詞綴",
    cnt: "詞綴計數",
    rar: "稀有度",
    slot: "部位",
    lv: "物品等級",
    q: "基底品質",
    uq: "獨特",
    sock: "插槽裝備",
  },
  KEEP_K_SL = {
    any: "任意詞綴",
    af: "指定詞綴",
    cnt: "詞綴計數",
    rar: "稀有度",
    b: "石板種類",
    dg: "危險度",
    lv: "物品等級",
    q: "基底品質",
    sock: "插槽石板",
  },
  KEEP_K_RN = {
    af: "指定詞綴",
    cnt: "詞綴計數",
    any: "階級",
    slot: "可用部位",
    rsl: "石板符文",
  },
  keepRank = (t) => (t.uq || t.sock ? 5 : Math.max(0, t.rar)),
  afOk = (t, a) => t.t <= a;
function keepCond(t, a) {
  const s = t.rune ? (t.a ? [t] : []) : t.af || [];
  switch (a.k) {
    case "any":
      return s.some((t) => afOk(t, a.t));
    case "af":
      return s.some(
        (t) => t.a === a.a && afOk(t, a.t) && !(a.v > 0 && t.v < a.v),
      );
    case "cnt":
      return (
        s.filter(
          (t) => (!a.a || !a.a.length || a.a.includes(t.a)) && afOk(t, a.t),
        ).length >= (t.rune ? 1 : a.n || 1)
      );
    case "rar":
      return keepRank(t) >= a.r;
    case "slot":
      return (
        !!a.s &&
        (t.rune
          ? !!t.a && AFFIX[t.a].s.some((t) => a.s.includes(t))
          : a.s.includes(t.slot))
      );
    case "rsl":
      return !!t.a && isSlateAf(t.a);
    case "lv":
      return t.ilvl >= a.l;
    case "q":
      return baseQ(t) >= 0 && Math.round(100 * baseQ(t)) >= a.q;
    case "uq":
      return !!t.uq && (!a.u || !a.u.length || a.u.includes(t.uq));
    case "sock":
      return (
        !!t.sock &&
        (!a.h || a.h.includes(t.sock.n)) &&
        (!a.m || a.m.includes(t.sock.mode))
      );
    case "b":
      return !!a.b && a.b.includes(t.b);
    case "dg":
      return a.ge ? slDg(t) >= a.d : slDg(t) <= a.d;
  }
  return !1;
}
const keepGroup = (t, a) =>
    !!a.on &&
    a.c &&
    a.c.length > 0 &&
    a.c.every((a) => keepCond(t, a) !== !!a.not),
  keepMatch = (t, a = S.set.keep) => !!a && a.some((a) => keepGroup(t, a));
function salvageValue(t) {
  const a = t.sock ? 30 : t.uq ? 25 : [2, 4, 8, 16, 60][t.rar];
  return Math.round(a * (1 + t.ilvl / 10));
}
const cardKills = (t) =>
    MAPS[t].card
      ? MAPS[t].m.reduce((a, s) => a + (S.kills[t + "_" + s] || 0), 0)
      : 0,
  cardTier = (t) => CARD_N.filter((a) => cardKills(t) >= a).length,
  trailOn = (t) => cardKills(t) >= 2e4,
  godKills = (t) => S.kills[SS_MAP + "_" + GODS[t].m] || 0,
  hfxOn = (t) => t >= 0 && godKills(t) >= GFX_N[0],
  kfxOn = (t) => t >= 0 && godKills(t) >= GFX_N[1];
function collectMods() {
  const t = [],
    a = (a, s, e) => t.push({ s: a, v: s, src: e });
  for (const t of SLOTS) {
    const s = S.equip[t];
    if (canWear(s)) {
      for (const e of s.af)
        AFFIX[e.a].loc || null != AFFIX[e.a].dv || a(e.a, e.v, t);
      (s.arm && a("armor", s.arm, t), s.eva && a("eva", s.eva, t));
    }
  }
  MAPS.forEach((t, s) => {
    const e = t.card && cardTier(s);
    e && a(t.card[0], t.card[1][e - 1], "card" + s);
  });
  const s = {};
  for (const t of SLOTS) {
    const a = S.equip[t];
    if (canWear(a))
      for (const t of a.af)
        null == AFFIX[t.a].dv || s[t.a] >= t.v || (s[t.a] = t.v);
  }
  for (const t in s) a(t, s[t], "dv");
  const e = S.art && S.art.on,
    n = e && S.art.has[e];
  (n &&
    (a(ARTS[e].st, artStat(e, n.lv), "art"),
    a("art_" + e, n.lv, "art"),
    n.lv < ART.max && a("artXp", 1, "art")),
    slateSum("sl_cd") && a("cdr", -slateSum("sl_cd"), "slate"));
  const l = ascBranch();
  if (l)
    for (const s of l.t)
      for (const e of s)
        if (S.tal.p.includes(e.k))
          for (const s in e.e)
            if ("more" === s)
              for (const a in e.e.more)
                t.push({ s: a, v: e.e.more[a], src: "tal:" + e.k, x: "more" });
            else a(s, e.e[s], "tal:" + e.k);
  for (const s of SLOTS) {
    const e = S.equip[s];
    if (canWear(e))
      for (const s of uqKeys(e)) {
        const n = UNIQUE[s];
        if (!n) continue;
        const l = (t) => uv(s, t, e.cm || 1),
          o = "function" == typeof n.mods ? n.mods(l) : n.mods,
          r = "function" == typeof n.more ? n.more(l) : n.more;
        for (const t in o || {}) a(t, o[t], "uq:" + s);
        for (const a in r || {})
          t.push({ s: a, v: r[a], src: "uq:" + s, x: "more" });
      }
  }
  return t;
}
function statOf(t, a = PS.mods) {
  let s = 0;
  for (const e of a) e.s !== t || e.x || (s += e.v);
  return s;
}
function moreOf(t, a = PS.mods) {
  let s = 1;
  for (const e of a) e.s === t && "more" === e.x && (s *= 1 + e.v / 100);
  return s;
}
const critOvr = (t, a, s = 1) =>
    Math.max(0, a - 100) * t.ovc - (s ? t.ovcB : 0),
  critF2 = (t, a) => {
    const s = t.critRaw + a.crit;
    return (
      1 +
      (Math.min(100, s) / 100) * ((t.critm + a.critm + critOvr(t, s)) / 100 - 1)
    );
  };
function gemCrit(t, a = gemMods(t)) {
  const s =
      !(SKILLS[t.id].tg || []).includes("minion") ||
      "turret" === (SKILLS[t.id]?.roBase || t.id) ||
      !!tal("minCrit"),
    e = +((s ? PS.critRaw : 0) + a.crit).toFixed(1);
  return {
    own: s,
    c: e,
    ch: Math.min(100, e),
    cm: (s ? PS.critm : 150) + a.critm + critOvr(PS, e, s),
  };
}
function calc() {
  const t = CLASS[S.cls],
    a = collectMods(),
    s = {},
    e = {};
  for (const t in AFFIX) null == AFFIX[t].dv && (s[t] = 0);
  for (const t of a)
    t.x || (t.s in s ? (s[t.s] += t.v) : (e[t.s] = (e[t.s] || 0) + t.v));
  const n = {};
  for (const t of SLOTS) {
    const a = S.equip[t];
    if (canWear(a))
      for (const t of uqKeys(a)) n[t] = Math.max(n[t] || 0, a.cm || 1);
  }
  const l = (t) => e[t] || 0,
    o = {};
  for (const t in TAL_ON)
    if (e[t])
      for (const a in TAL_ON[t])
        "p" !== a &&
          "off" !== a &&
          (o[a] ||= []).push({ p: TAL_ON[t].p || 0, f: TAL_ON[t][a] });
  for (const t in UNIQUE)
    if (n[t] && UNIQUE[t].on)
      for (const a in UNIQUE[t].on)
        (o[a] ||= []).push({ p: 0, f: UNIQUE[t].on[a] });
  activeGems().some((t) => gemMods(t).trig) &&
    (o.hit ||= []).push({ p: 0, f: trigHit });
  for (const t in o) o[t] = o[t].sort((t, a) => t.p - a.p).map((t) => t.f);
  const r = Object.keys(UNIQUE)
      .filter((t) => n[t])
      .map((t) => UNIQUE[t]),
    i = (t) => r.filter((a) => a[t]).map((a) => a[t]),
    c = [...i("hitMul"), ...HIT_MUL.map((t) => t.f)],
    d = [...TAKE_MUL.map((t) => t.f), ...i("takeMul")],
    f = i("hitPost"),
    p = (t) =>
      Object.keys(UNIQUE)
        .filter((a) => n[a] && UNIQUE[a][t])
        .map((t) => "uq:" + t),
    u = [...p("hitMul"), ...HIT_MUL.map((t) => t.k)],
    h = [...TAKE_MUL.map((t) => t.k), ...p("takeMul")],
    m = Object.keys(UNIQUE)
      .filter((t) => n[t] && UNIQUE[t].psnHit)
      .map((t) => {
        const a = UNIQUE[t].psnHit;
        return "function" == typeof a ? a((a) => uv(t, a, n[t])) : a;
      })
      .sort((t, a) => (a >= 1) - (t >= 1))
      .concat(l("psnHit") ? [l("psnHit")] : []),
    A = canWear(S.equip.weapon) ? S.equip.weapon : null,
    g = A ? weaponLocal(A) : { mn: 1, mx: 3, aps: 1.2, crit: 5 },
    v = Math.round(s.eva * Math.max(0, 1 + s.evap / 100) * moreOf("eva", a)),
    b = +(l("critEva") ? v / 15 : g.crit + s.crit).toFixed(1),
    k = l("critOver"),
    x = Math.max(0, b - 100) * k,
    y = l("fixedHit") ? 1 : g.mn + s.adddmg,
    w = l("fixedHit") ? 1 : g.mx + s.adddmg,
    $ = g.aps,
    M = Math.max(0.3, 1 + (l("actFromMove") ? s.move : s.act) / 100),
    B = Math.round(
      s.armor * Math.max(0, 1 + s.armorp / 100) * moreOf("armor", a),
    ),
    C = l("armorToLife") ? 0 : B,
    G = Math.round(
      ((60 + 13 * S.lvl) * t.hp + s.life) *
        (1 + s.lifep / 100) *
        moreOf("life", a) +
        (l("armorToLife") ? B * l("armorToLife") : 0),
    ),
    R = {
      st: s,
      U: n,
      mods: a,
      on: o,
      hitMul: c,
      takeMul: d,
      hitMulK: u,
      takeMulK: h,
      hitPost: f,
      psnHit: m,
      mn: y,
      mx: w,
      act: M,
      cast: Math.min(3, M),
      waps: $,
      aps: $ * Math.max(0.2, 1 + s.aspd / 100) * M,
      dmgMul: (1 + s.dmgp / 100) * moreOf("dmg", a),
      skillMul:
        (1 + (s.dmgp + s.skill) / 100) * moreOf("skill", a) * moreOf("dmg", a),
      minMul: (1 + (s.dmgp + s.minp) / 100) * moreOf("dmg", a),
      crit: Math.min(100, b),
      critRaw: b,
      ovc: k,
      ovcB: x,
      critm: 150 + s.critm + x,
      maxhp: G,
      armor: C,
      eva: v,
      armRed: Math.min(75, C / 20),
      dodge: Math.min(75, v / 15),
      dodgeRaw: v / 15,
      regen: l("noRegen") ? 0 : (0.01 + l('regenPct')) * G + s.regen,
      lok: s.lok,
      cdr: Math.min(90, s.cdr),
      area: 1 + s.area / 100,
      move: 32 * (l("actFromMove") ? 1 : Math.max(0.3, 1 + s.move / 100)) * M,
      revive: Math.min(90, s.revive),
      pot: 1 + s.pot / 100,
      psn: 1 + s.psn / 100,
      brn: 1 + s.brn / 100,
      bld: 1 + s.bld / 100,
      psnMax: 1 + l("psnMax"),
      ail: 1 + l("ail"),
      crs: 1 + l("crs"),
      minion: l("minion"),
      minAs: l("minAs"),
      minRate:
        (1 + l("minAs") + (l("asToMin") * s.aspd) / 100) *
        (l("asToMin") ? M : 1),
      ovk: l("ovk"),
      T: e,
      range: l("punch") ? PUNCH.rng : t.range,
    },
    T = (y + w) / 2,
    L = 1 + (R.crit / 100) * (R.critm / 100 - 1),
    O = (t) => activeGems().some((a) => a.id === t),
    N = l("punch") && punchMods(),
    _ = N
      ? ((uv("fist", 0, n.fist) / 100) *
          (1 + N.dmg) *
          (1 + PUNCH.x * N.extra) *
          (1 +
            (Math.min(100, b + N.crit) / 100) *
              ((R.critm + N.critm) / 100 - 1))) /
        L
      : 1;
  let P = l("fixedHit")
    ? R.aps
    : _ *
      T *
      R.dmgMul *
      (1 + l("baMore")) *
      R.aps *
      L *
      (O("dance")
        ? (1 + 0.05 * (STK.mom.max + l("momMax"))) *
          (l("actFromMove") ? 1 + 0.03 * (STK.mom.max + l("momMax")) : 1) *
          (1 + (STK.mom.max + l("momMax")) * l("momDmg"))
        : 1);
  S.set.nob
    ? (P = 0)
    : m.some((t) => t >= 1)
      ? (P += T * R.dmgMul * L * PSN_K * R.psn * (1 + l("psnRate")))
      : l("psnHit") &&
        (P +=
          T *
          R.dmgMul *
          L *
          PSN_K *
          R.psn *
          (1 + l("psnRate")) *
          Math.min(R.psnMax, R.aps * l("psnHit") * PSN_T));
  for (const t of activeGems()) {
    const a = SKILLS[t.id],
      s = gemMods(t);
    if (a.sus) {
      a.sdps && (P += a.sdps(R, s) * R.skillMul * critF2(R, s));
      continue;
    }
    if ("guard" === (SKILLS[t.id]?.roBase || t.id)) {
      P +=
        ((T * R.minMul * GSP.k * (1 + 0.6 * s.extra)) / GSP.atk) *
        R.minRate *
        (GSP.n + R.minion + s.minion) *
        (1 + s.dmg) *
        (1 + l("minDmg")) *
        (1 +
          (Math.min(95, (l("minCrit") ? R.crit : 0) + s.crit) / 100) *
            (((l("minCrit") ? R.critm : 150) + s.critm) / 100 - 1));
      continue;
    }
    if ("summon" === (SKILLS[t.id]?.roBase || t.id)) {
      P +=
        ((T * R.minMul * MIN.k * (1 + 0.6 * s.extra)) / MIN.atk) *
        R.minRate *
        (MIN.n + R.minion + s.minion) *
        (1 + s.dmg) *
        (1 + l("minDmg")) *
        (1 + l("spell")) *
        (1 +
          (Math.min(95, (l("minCrit") ? R.crit : 0) + s.crit) / 100) *
            (((l("minCrit") ? R.critm : 150) + s.critm) / 100 - 1));
      continue;
    }
    const e = s.trig
        ? Math.max(
            TRIG.cd * (1 - l("trigCd")),
            1 / ((1.5 * R.aps * R.crit) / 100 + 0.01),
          )
        : l("endb")
          ? (uv("endb", 0, n.endb) *
              activeGems().filter((t) => !SKILLS[t.id].sus).length) /
            R.aps
          : l("oath")
            ? OATH.cd
            : a.cd * (1 - s.cd) * (1 - R.cdr / 100),
      o =
        (a.est ? a.est(s, R, e) : a.hit || 0) *
        (s.trig && !l("trigFull") ? TRIG.k : 1) *
        (1 + s.dmg) *
        (1 + 0.6 * s.extra) *
        (a.tg.includes("proj") ? 1 + l("projDmg") : 1) *
        (a.tg.includes("spell") ? 1 + l("spell") : 1) *
        HIT_MUL.reduce((t, s) => (s.estSk ? t * s.estSk(R, l, a) : t), 1);
    l("fixedHit") ||
      (P +=
        ((T * (a.tg.includes("minion") ? R.minMul : R.skillMul) * o) / e) *
        critF2(R, s));
  }
  const I = activeGems().find((t) => "chain" === (SKILLS[t.id]?.roBase || t.id));
  if (I) {
    const t = gemMods(I),
      a = R.ail * (1 + t.ail);
    P *=
      1 +
      AIL.shk.v *
        a *
        Math.min(
          1,
          (AIL.shk.t * a) / (SKILLS.chain.cd * (1 - t.cd) * (1 - R.cdr / 100)),
        );
  }
  const E = activeGems().find((t) => "cvul" === (SKILLS[t.id]?.roBase || t.id));
  E
    ? (P *=
        1 +
        CRS.vu.v *
          R.crs *
          Math.min(
            1,
            CRS.vu.t /
              (SKILLS.cvul.cd * (1 - gemMods(E).cd) * (1 - R.cdr / 100)),
          ))
    : l("crsRing") &&
      placed().some((t) => "cvul" === (SKILLS[t.id]?.roBase || t.id)) &&
      (P *= 1 + CRS.vu.v * R.crs);
  const D = activeGems().find((t) => "taunt" === (SKILLS[t.id]?.roBase || t.id));
  (D &&
    l("tntVul") &&
    (P *=
      1 +
      l("tntVul") *
        Math.min(
          1,
          (4 + l("tntT")) /
            (SKILLS.taunt.cd * (1 - gemMods(D).cd) * (1 - R.cdr / 100)),
        )),
    l("psnVul") &&
      (m.length || activeGems().some((t) => SKILLS[t.id].tg.includes("psn"))) &&
      (P *= 1 + l("psnVul")),
    !l("fixedHit") && O("frenzy") && (P *= 1.35 + l("frz")));
  for (const t of HIT_MUL) t.est && (P *= t.est(R, l));
  return ((R.dps = P), R);
}
function recalc() {
  const t = PS ? PS.maxhp : 0,
    a = PS;
  if (((PS = calc()), a && void 0 !== G && G)) {
    for (const t in UNIQUE)
      a.U[t] && !PS.U[t] && UNIQUE[t].off && UNIQUE[t].off();
    for (const t in TAL_ON)
      a.T[t] && !PS.T[t] && TAL_ON[t].off && TAL_ON[t].off();
  }
  (S.hp > PS.maxhp && (S.hp = PS.maxhp),
    t && PS.maxhp > t && S.hp > 0 && (S.hp += PS.maxhp - t));
}
const GRID = 6,
  UNLOCK_ORDER = (() => {
    const t = [];
    for (let a = 0; a < 6; a++)
      for (let s = 0; s < 6; s++)
        t.push([s, a, Math.hypot(s - 2.5, a - 2.5) + 1e-4 * (6 * a + s)]);
    return t.sort((t, a) => t[2] - a[2]).map((t) => t[0] + "," + t[1]);
  })();
function openCount() {
  return Math.min(
    36,
    8 + Math.floor(S.lvl / 3) + ((PS && PS.T.gridCells) || 0),
  );
}
function openSet() {
  return new Set(UNLOCK_ORDER.slice(0, openCount()));
}
function rotCell([t, a], s) {
  for (let e = 0; e < s; e++) [t, a] = [-a, t];
  return [t, a];
}
const gemShape = (t) => t.sh || SKILLS[t.id].shape;
function gemCells(t, a = t.x, s = t.y, e = t.rot) {
  return gemShape(t).map((t) => {
    const [n, l] = rotCell(t, e);
    return [a + n, s + l];
  });
}
function placed() {
  return S.gems.filter((t) => t.x >= 0);
}
function canPlace(t, a, s, e) {
  const n = openSet(),
    l = new Set();
  for (const a of placed())
    if (a.u !== t.u) for (const [t, s] of gemCells(a)) l.add(t + "," + s);
  return gemCells(t, a, s, e).every(
    ([t, a]) =>
      t >= 0 &&
      a >= 0 &&
      t < 6 &&
      a < 6 &&
      n.has(t + "," + a) &&
      !l.has(t + "," + a),
  );
}
function activeGems() {
  const t = punchOn(),
    a = crsRingOn();
  return placed().filter(
    (s) =>
      SKILLS[s.id].act && (!t || SKILLS[s.id].aura) && !(a && SKILLS[s.id].crs),
  );
}
const crsRingOn = () => SLOTS.some((t) => uqKeys(S.equip[t]).includes("crsr")),
  punchOn = () => uqKeys(S.equip.weapon).includes("fist"),
  PUNCH_K = ["dmg", "area", "crit", "critm", "extra", "pstk", "life"];
function punchSups() {
  const t = [],
    a = [];
  for (const s of placed()) {
    const e = SKILLS[s.id];
    e.act ||
      ((e.req && ![].concat(e.req).includes("aoe")) ||
      "aoe" === e.not ||
      !Object.keys(e.mod).some((t) => PUNCH_K.includes(t))
        ? a
        : t
      ).push(s);
  }
  return { ok: t, bad: a };
}
function punchMods() {
  const t = Object.fromEntries(PUNCH_K.map((t) => [t, 0]));
  let a = 1;
  for (const s of punchSups().ok) {
    const e = SKILLS[s.id];
    for (const s in e.mod)
      s in t &&
        ("area" === s && e.mod[s] < 0
          ? (a *= 1 + e.mod[s])
          : (t[s] += e.mod[s]));
  }
  return ((t.area = (1 + t.area) * a - 1), t);
}
const LINK = {
  adj: (t, a) =>
    a.some(([a, s]) =>
      t.some(([t, e]) => Math.abs(t - a) + Math.abs(e - s) === 1),
    ),
  all: () => !0,
};
function linkRule() {
  for (const t of SLOTS)
    for (const a of uqKeys(S.equip[t]))
      if (UNIQUE[a] && UNIQUE[a].link) return UNIQUE[a].link;
  return "adj";
}
function adjSupports(t) {
  const a = LINK[linkRule()],
    s = gemCells(t);
  return placed().filter((t) => !SKILLS[t.id].act && a(s, gemCells(t)));
}
function linkedSupports(t) {
  return adjSupports(t).filter((a) => supFits(a.id, t.id));
}
function gemMods(t) {
  const a = {
    dmg: 0,
    cd: 0,
    area: 0,
    crit: 0,
    critm: 0,
    extra: 0,
    proj: 0,
    pstk: 0,
    ail: 0,
    minion: 0,
    ovk: 0,
    chn: 0,
    life: 0,
    trig: 0,
    mlife: 0,
  };
  let s = 1;
  for (const e of linkedSupports(t)) {
    const t = SKILLS[e.id].mod;
    for (const e in t)
      "area" === e && t[e] < 0 ? (s *= 1 + t[e]) : (a[e] += t[e]);
  }
  return ((a.area = (1 + a.area) * s - 1), (a.cd = Math.min(0.7, a.cd)), a);
}
function gridSnap() {
  return placed().map((t) => [t.u, t.x, t.y, t.rot]);
}
function switchBuild(t) {
  if (t === S.gp || t < 0 || t >= S.gpages.length) return null;
  const a = S.bld[t],
    s = {};
  for (const t of SLOTS) S.equip[t] && (s[t] = S.equip[t].u);
  const e = a ? SLOTS.filter((t) => a.eq[t]).map((t) => a.eq[t]) : [],
    n = S.equip,
    l = a ? SLOTS.map((t) => n[t]).filter((t) => t && !e.includes(t.u)) : [];
  if (
    a &&
    S.bag.length -
      e.filter((t) => S.bag.some((a) => a.u === t)).length +
      l.length >
      BAG_MAX
  )
    return { full: 1 };
  ((S.gpages[S.gp] = gridSnap()),
    (S.bld[S.gp] = { eq: s, asc: S.tal.asc, p: [...S.tal.p], art: S.art.on }));
  let o = 0;
  if (a) {
    const t = [...SLOTS.map((t) => n[t]).filter(Boolean), ...S.bag],
      s = {};
    for (const e of SLOTS)
      if (a.eq[e]) {
        const n = t.find((t) => t.u === a.eq[e]);
        n ? (s[e] = n) : o++;
      }
    S.bag = S.bag.filter((t) => !e.includes(t.u));
    for (const t of l) ((t.lk = 1), S.bag.push(t));
    ((S.equip = s),
      (S.tal.asc = a.asc),
      (S.tal.p = [...a.p]),
      void 0 !== a.art && (S.art.on = a.art));
  }
  if (((S.gp = t), recalc(), !S.gpages[t])) return { lost: o, miss: 0 };
  for (const t of S.gems) t.x = t.y = -1;
  let r = 0;
  for (const [a, s, e, n] of S.gpages[t]) {
    const t = S.gems.find((t) => t.u === a);
    t && (canPlace(t, s, e, n) ? ((t.x = s), (t.y = e), (t.rot = n)) : r++);
  }
  return { lost: o, miss: r };
}
function copyBuild(t, a, s) {
  if (!(t === S.gp || t < 0 || t >= S.gpages.length)) {
    if (a) {
      const a = {};
      for (const t of SLOTS) S.equip[t] && (a[t] = S.equip[t].u);
      S.bld[t]
        ? (S.bld[t].eq = a)
        : (S.bld[t] = {
            eq: a,
            asc: S.tal.asc,
            p: [...S.tal.p],
            art: S.art.on,
          });
    }
    s && (S.gpages[t] = gridSnap());
  }
}
function validateGrid() {
  const t = openSet();
  let a = 0;
  for (const s of placed())
    gemCells(s).every(([a, s]) => t.has(a + "," + s)) ||
      ((s.x = s.y = -1), a++);
  return a;
}
const xpNeed = (t) =>
    t >= 100 ? Math.round(xpNeed(99) * (1 + 0.1 * (t - 99))) :
    Math.round(
      20 *
        Math.pow(t, 1.8) *
        (t <= 50
          ? 0.25 + 0.75 * (t / 50) ** 2
          : Math.min(1.2, 1 + (t - 50) / 150)) *
        (t >= 85 ? 1 + (t - 84) / 4 : 1),
    ),
  monHp = (t) => 20 + 0.45 * t * t,
  // 流浪仙境 v4.4: mid-game maps (Lv.20–100) hit softer; max −25% around Lv.45–75.
  monDmgEase = (t) => {
    const k = (a, b) => Math.min(1, Math.max(0, (t - a) / (b - a))),
      sm = (x) => x * x * (3 - 2 * x);
    return 1 - 0.25 * sm(k(20, 45)) * (1 - sm(k(75, 100)));
  },
  monDmg = (t) => (1.5 + 0.11 * Math.pow(t, 1.6)) * monDmgEase(t),
  HUD_H = 26,
  MON_H = {
    dummy: 14,
    slime: 10,
    wolf: 10,
    goblin: 13,
    bat: 9,
    skeleton: 15,
    wisp: 12,
    golem: 14,
    imp: 12,
    knight: 14,
    gd0: 16,
    gd1: 14,
    gd2: 15,
    fin: 16,
    mon: 20,
    thun: 11,
    siren: 13,
    soul: 12,
    zeus: 16,
    posei: 16,
    hades: 16,
  },
  MON_COLS = {
    dummy: ["#e0c070", "#9a6a3a", "#c04a3a"],
    wolf: ["#8a8a9c", "#c4c4d4", "#5a5a6e"],
    goblin: ["#6cb04a", "#3e7a2a", "#9a6a3a"],
    bat: ["#7a4bb0", "#4a2a70", "#ff5a6a"],
    skeleton: ["#e8e4d8", "#a8a49a", "#ffffff"],
    wisp: ["#7ad4ff", "#ffffff", "#3a8ac0"],
    golem: ["#8a7a6a", "#b0a090", "#5a4e44"],
    imp: ["#e0503a", "#8a2a22", "#ffe040"],
    knight: ["#4e4e62", "#7a7a94", "#9a2a3e"],
    gd0: ["#6a5038", "#7ad46a", "#3e8a3a"],
    gd1: ["#4a3a3a", "#ff8a3a", "#ffd040"],
    gd2: ["#3a3a6a", "#9ab0ff", "#f4efe6"],
    fin: ["#5a2a7a", "#e0445a", "#e8b84a"],
    mon: ["#3a2a8a", "#c890ff", "#f0f0ff"],
    thun: ["#ffe066", "#ffffff", "#6ab0ff"],
    siren: ["#4ac0a0", "#9ad8c8", "#3a8ac0"],
    soul: ["#b07aff", "#f0e0ff", "#6a3aa8"],
    zeus: ["#f4f4ff", "#ffd84a", "#fff6a0"],
    posei: ["#2a6ab0", "#4ac0c0", "#ffd84a"],
    hades: ["#2e1e40", "#b07aff", "#ff5a6a"],
  };
function newWorld(t, a) {
  return {
    W: t,
    H: a,
    top: 30,
    t: 0,
    mobs: [],
    proj: [],
    fx: [],
    nums: [],
    drops: [],
    parts: [],
    orbs: [],
    later: [],
    flashes: [],
    mins: [],
    gsp: [],
    turs: [],
    saps: [],
    orbit: [],
    haz: [],
    vort: [],
    und: [],
    souls: 0,
    jc: { m: null, n: 0 },
    dvj: { m: null, t: 0 },
    pl: {
      abq: [],
      x: t / 2,
      y: (26 + a) / 2 + 6,
      vx: 0,
      vy: 0,
      dir: "down",
      flip: !1,
      face: Math.PI / 2,
      tgt: null,
      atk: 0.4,
      cds: {},
      sus: {},
      stk: {},
      retgt: 0,
      moving: 0,
      walkT: 0,
      anim: null,
      combo: 0,
      hurt: 0,
    },
    dead: 0,
    spawn: 0,
    arena: null,
    boss: null,
    bossT: 0,
    wolf: [],
    minK: 0,
    minT: 0,
    rate: { k: Array(60).fill(0), x: Array(60).fill(0), i: 0, t: 0, n: 0 },
    ground: null,
    shake: 0,
    freeze: 0,
    lastFreeze: 0,
    hurtFlash: 0,
  };
}
function curMap() {
  return MAPS[G && G.tw ? G.tw.mi : S.map];
}
const lvMap = () => (G && G.tw ? MAP_N - 1 : Math.min(S.map, MAP_N - 1)),
  mapV = () => (G.arena ? G.arena.ar.v : curMap().v),
  later = (t, a) => { const context = roFxContext; return G.later.push({ at: G.t + t / (G.cst || 1), fn: () => roWithFx(context, a) }); },
  alive = (t) => t && G.mobs.includes(t),
  dist = (t, a) => Math.hypot(t.x - a.x, t.y - a.y);
function inArena(t) {
  ((t.x = clamp(t.x, 6, G.W - 6)), (t.y = clamp(t.y, G.top + 4, G.H - 4)));
}
function spawnPack() {
  const t = curMap(),
    a = G.pl;
  let s,
    e,
    n = 0;
  do {
    ((s = rf(12, G.W - 12)), (e = rf(G.top + 10, G.H - 8)), n++);
  } while (Math.hypot(s - a.x, e - a.y) < 40 && n < 20);
  const l = ri(1, 3),
    o = t.m[ri(0, t.m.length - 1)],
    r = mapLv();
  for (let t = 0; t < l; t++)
    inArena(
      addMob(o, ri(r[0], r[1]), s + rf(-10, 10), e + rf(-8, 8), { sl: 1 }),
    );
  const i = t.rx || (slateSum("sl_rx") ? "wisp" : null);
  i &&
    o !== i &&
    (slateSum("sl_rx") > 0 || RAND() < 0.5) &&
    inArena(
      addMob(i, ri(r[0], r[1]), s + rf(-14, 14), e + rf(-10, 10), { sl: 1 }),
    );
}
function addMob(t, a, s, e, n = {}) {
  const l = MON[t],
    o = n.elite ?? (!n.boss && RAND() < 0.08 + slateSum("elite") / 100),
    r = (t) => (n.sl ? 1 + slateSum(t) / 100 : 1),
    i = monHp(a) * l.hp * (o ? 3 : 1) * (n.boss ? 30 : 1) * r("sl_hp"),
    c = {
      id: RAND(),
      type: t,
      lv: a,
      x: s,
      y: e,
      vx: 0,
      vy: 0,
      hp: i,
      max: i,
      dmg: monDmg(a) * l.dmg * (o ? 1.5 : 1) * (n.boss ? 2.2 : 1) * r("sl_dmg"),
      sdm: r("sl_dmg"),
      spd: l.spd * (n.boss ? 0.8 : 1) * r("sl_spd"),
      atk: rf(0.3, 1.3),
      slow: 0,
      elite: o,
      boss: !!n.boss,
      flash: 0,
      face: 1,
      spawnT: 0.45,
      ranged: l.ranged || 0,
      h: (MON_H[t] || 12) * (n.boss ? 2 : 1),
      lunge: 0,
      t: 5 * RAND(),
      nk: l.nk,
      ag: !!n.boss || mapAggro(),
      wt: rf(0, 1.5),
      wx: s,
      wy: e,
    };
  if (n.sl) {
    const t = slateSum("sl_shld");
    (t && (c.sh = c.shm = (i * t) / 100), (c.boom = slateSum("sl_boom")));
  }
  (G.tw && n.sl && twScale(c),
    o && !n.noAf && eliteAffix(c, n.sl),
    G.mobs.push(c));
  for (let t = 0; t < 8; t++)
    G.parts.push({
      x: s + rf(-5, 5),
      y: e,
      z: 0,
      vx: rf(-12, 12),
      vy: rf(-4, 4),
      vz: rf(20, 50),
      g: 140,
      life: rf(0.3, 0.5),
      c: "#3a2f52",
      s: 1,
    });
  return c;
}
function mapAggro() {
  const t = curMap().aff;
  return !(!t || !t.includes("aggr")) || slateSum("sl_aggr") > 0;
}
function attacking(t) {
  return (
    t.ag &&
    t.spawnT <= 0 &&
    dist(t, G.pl) <= (t.ranged || (t.boss ? 15 : 9)) + 24
  );
}
function pickTarget() {
  const t = G.pl,
    a = PS.range < 20 ? 0 : 0.9 * PS.range;
  let s = null,
    e = -1e9;
  for (const n of G.mobs) {
    if (n.spawnT > 0) continue;
    let l = 0;
    for (const t of G.mobs)
      t !== n && Math.abs(t.x - n.x) < 26 && Math.abs(t.y - n.y) < 26 && l++;
    const o =
      (attacking(n) ? 30 : 0) +
      3 * l -
      Math.max(0, Math.hypot(n.x - t.x, n.y - t.y) - a) / 22 +
      (n.boss ? 4 : 0);
    o > e && ((e = o), (s = n));
  }
  return s;
}
const pressN = () =>
  tal("dv_press")
    ? Math.min(DV_PRESS.max, mobsNear(G.pl.x, G.pl.y, DV_PRESS.r).length)
    : 0;
function mobsNear(t, a, s) {
  return G.mobs.filter(
    (e) =>
      e.spawnT <= 0 && Math.hypot(e.x - t, e.y - 3 - a) <= s + (e.boss ? 8 : 0),
  );
}
function num(t, a, s, e, n) {
  const l = "string" != typeof s;
  (l && S.set.nonum) ||
    (G.nums.push({
      x: t + rf(-3, 3),
      y: a,
      txt: l ? fmt(s) : s,
      col: e,
      t: 0,
      big: n,
      d: l,
    }),
    G.nums.length > 40 && G.nums.shift());
}
function burst(t, a, s, e, n = 80, l = {}) {
  for (let o = 0; o < s; o++) {
    const s = rf(0, 6.283),
      o = rf(0.3 * n, n);
    G.parts.push({
      x: t,
      y: a,
      z: l.z ?? 4,
      vx: Math.cos(s) * o,
      vy: Math.sin(s) * o * 0.6,
      vz: null != l.vz ? rf(0.5 * l.vz, l.vz) : rf(20, 80),
      g: l.g ?? 220,
      life: rf(0.35, 0.8) * (l.life || 1),
      c: e[ri(0, e.length - 1)],
      s: RAND() < 0.3 ? 2 : 1,
      glow: l.glow,
    });
  }
  G.parts.length > 420 && G.parts.splice(0, G.parts.length - 420);
}
function hitStop(t) {
  G.t - G.lastFreeze > 0.16 &&
    ((G.freeze = Math.max(G.freeze, t)), (G.lastFreeze = G.t));
}
function shake(t) {
  S.set.noshk || (G.shake = Math.max(G.shake, t));
}
function heal(t) {
  G.dead || (S.hp = Math.max(S.hp, Math.min(hpCap(), S.hp + t * slHealMul())));
}
const tal = (t) => PS.T[t] || 0;
function hpCap() {
  return PS.maxhp * (tal("rage") ? 0.5 : 1);
}
const SPD_AS = [
    { k: "surge", f: () => surge() },
    { k: "mom", f: () => 1 + 0.05 * stkN("mom") },
    { k: "hh:swift", f: () => (hbOn("swift") ? 1 + HH.swift.as : 1) },
    {
      k: "gale",
      f: () => (tal("actFromMove") ? fold(SPD_MS, 1, null, (t) => !t.act) : 1),
    },
  ],
  SPD_TICK = [
    { k: "wolf", f: () => 1 + (uv("wolf", 0) / 100) * G.wolf.length },
  ],
  SPD_MS = [
    { k: "surge", dodge: 1, act: 1, f: () => surge() },
    { k: "mom", f: () => 1 + 0.03 * stkN("mom") },
    {
      k: "road",
      f: () =>
        tal("road") && !mobsNear(G.pl.x, G.pl.y, 40).length
          ? 1 + tal("road")
          : 1,
    },
    { k: "hh:swift", dodge: 1, f: () => (hbOn("swift") ? 1 + HH.swift.ms : 1) },
  ],
  HURT_MUL = [
    { k: "armor", f: () => 1 - PS.armRed / 100 },
    { k: "taunt", f: (t) => (t && t.tnt > 0 ? 0.75 - tal("tntDmg") : 1) },
    { k: "weak", f: (t) => (t && cursed(t, "wk") ? 1 - CRS.wk.v * PS.crs : 1) },
    { k: "tal", f: () => 1 - tal("dmgTaken") },
    {
      k: "minGuard",
      f: () => Math.max(0.4, 1 - [...G.mins,...G.gsp,...G.turs].filter(m => m.hp == null || m.hp > 0).length * tal("minGuard")),
    },
    { k: "hh:tough", f: () => (hbOn("tough") ? 1 - HH.tough.dr : 1) },
    { k: "tal:momDR", f: () => 1 - stkN("mom") * tal("momDR") },
    {
      k: "graze",
      rnd: 1,
      f: () => (tal("graze") && RAND() < tal("graze") ? 0.5 : 1),
      ev: () => 1 - 0.5 * tal("graze"),
    },
  ],
  fold = (t, a, s, e) => {
    for (const n of t) (e && !e(n)) || (a *= n.f(s));
    return a;
  },
  minAtk = () =>
    PS.minRate * (tal("asToMin") ? fold(SPD_AS, 1) * fold(SPD_TICK, 1) : 1),
  pc = (t) => Math.round(100 * t),
  armDmg = (t, a) =>
    a ? (a * Math.min(t, 1500) + 0.02 * Math.max(0, t - 1500)) / 100 : 0,
  trapEva = (t) => (tal("trapEva") * t.dodgeRaw) / 100,
  xf = (t) => "×" + +(1 + t).toFixed(2),
  HIT_MUL = [
    {
      k: "sus:frenzy",
      lab: () =>
        activeGems().some((t) => "frenzy" === (SKILLS[t.id]?.roBase || t.id)) &&
        `狂怒之槍開啟時 ${xf(0.35 + tal("frz"))}`,
      f: (t) => (G.pl.sus.frenzy ? t * (1.35 + tal("frz")) : t),
    },
    {
      k: "tal:lowhp",
      lab: () => tal("lowhp") && `每失去 10% 生命倍率 +${pc(tal("lowhp"))}%`,
      f: (t) =>
        tal("lowhp")
          ? t * (1 + tal("lowhp") * Math.floor(10 * (1 - S.hp / PS.maxhp)))
          : t,
    },
    {
      k: "tal:momDmg",
      lab: () => tal("momDmg") && `每層氣勢倍率 +${pc(tal("momDmg"))}%`,
      f: (t) => (tal("momDmg") ? t * (1 + stkN("mom") * tal("momDmg")) : t),
    },
    {
      k: "tal:momDbl",
      lab: () => tal("momDbl") && `氣勢滿層時 ${pc(tal("momDbl"))}% 機率 ×2`,
      f: (t, a, s) =>
        tal("momDbl") &&
        !s.min &&
        stkN("mom") >= STK.mom.max + tal("momMax") &&
        RAND() < tal("momDbl")
          ? 2 * t
          : t,
      est: (t, a) =>
        activeGems().some((t) => "dance" === (SKILLS[t.id]?.roBase || t.id)) ? 1 + a("momDbl") : 1,
    },
    {
      k: "tal:boss",
      lab: () => tal("boss") && `對 Boss／菁英 ${xf(tal("boss"))}`,
      f: (t, a) => (a.boss || a.elite ? t * (1 + tal("boss")) : t),
    },
    {
      k: "tal:exec",
      lab: () => tal("exec") && `對生命低於 20% 的敵人 ${xf(tal("exec"))}`,
      f: (t, a) => (a.hp < 0.2 * a.max ? t * (1 + tal("exec")) : t),
    },
    {
      k: "tal:tags",
      lab: (t) =>
        [
          t.tg.includes("proj") &&
            tal("projDmg") &&
            `投射物傷害 ${xf(tal("projDmg"))}`,
          t.tg.includes("spell") &&
            tal("spell") &&
            `法術傷害 ${xf(tal("spell"))}`,
        ]
          .filter(Boolean)
          .join("、"),
      f: (t, a, s) =>
        s.tg
          ? t *
            ((s.tg.includes("proj") ? 1 + tal("projDmg") : 1) *
              (s.tg.includes("spell") ? 1 + tal("spell") : 1))
          : t,
    },
    {
      k: "tal:trapEva",
      lab: (t) =>
        t.tg.includes("trap") &&
        tal("trapEva") &&
        `獵人本能 ${xf(trapEva(PS))}`,
      f: (t, a, s) =>
        tal("trapEva") && s.tg && s.tg.includes("trap")
          ? t * (1 + trapEva(PS))
          : t,
      estSk: (t, a, s) =>
        s.tg.includes("trap") ? 1 + (a("trapEva") * t.dodgeRaw) / 100 : 1,
    },
    {
      k: "tal:armDmg",
      lab: () =>
        tal("armDmg") && `護甲轉傷害 ${xf(armDmg(PS.armor, tal("armDmg")))}`,
      f: (t) => (tal("armDmg") ? t * (1 + armDmg(PS.armor, tal("armDmg"))) : t),
      est: (t, a) => 1 + armDmg(t.armor, a("armDmg")),
    },
  ],
  TAKE_MUL = [
    { k: "ail:shk", f: (t, a) => (a.shk > 0 ? t * (1 + a.shkv) : t) },
    {
      k: "crs:vu",
      f: (t, a) => (cursed(a, "vu") ? t * (1 + CRS.vu.v * PS.crs) : t),
    },
    {
      k: "tal:psnVul",
      lab: () => tal("psnVul") && `對中毒的敵人 ${xf(tal("psnVul"))}`,
      f: (t, a) => (a.psn ? t * (1 + tal("psnVul")) : t),
    },
    {
      k: "tal:chlVul",
      lab: () => tal("chlVul") && `對冰緩的敵人 ${xf(tal("chlVul"))}`,
      f: (t, a) => (a.slow > 0 ? t * (1 + tal("chlVul")) : t),
    },
    {
      k: "tal:tntVul",
      lab: () => tal("tntVul") && `對被嘲諷的敵人 ${xf(tal("tntVul"))}`,
      f: (t, a) => (a.tnt > 0 ? t * (1 + tal("tntVul")) : t),
    },
    {
      k: "tal:crsVul",
      lab: () => tal("crsVul") && `敵人身上每個詛咒 ${xf(tal("crsVul"))}`,
      f: (t, a) => {
        if (a.crs && tal("crsVul"))
          for (const s in a.crs) a.crs[s] > 0 && (t *= 1 + tal("crsVul"));
        return t;
      },
    },
  ];
function thornHit(t, a, s) {
  if (!alive(t)) return;
  const e = { refl: 1 };
  if (((a *= PS.dmgMul), G.trn)) a = trnMul(PS.hitMul, PS.hitMulK, a, t, e);
  else for (const s of PS.hitMul) a = s(a, t, e);
  dealMob(t, a, !1, "#c8a0ff", s);
}
function hitMob(t, a, s = {}) {
  if (!alive(t)) return;
  let e =
    (s.base ?? rf(PS.mn, PS.mx)) *
    (s.min ? PS.minMul : s.skill ? PS.skillMul : PS.dmgMul) *
    (s.ba ? 1 + tal("baMore") : 1) *
    a;
  if (G.trn) e = trnMul(PS.hitMul, PS.hitMulK, e, t, s);
  else for (const a of PS.hitMul) e = a(e, t, s);
  const n = s.min ? !(!s.hcrit && !tal("minCrit")) : !s.ncrit,
    l = (n ? PS.critRaw : 0) + (s.crit || 0),
    o =
      (tal("fullCrit") && t.hp >= 0.9 * t.max) ||
      G.pl.acrit > 0 ||
      100 * RAND() < l;
  let r = 1;
  o &&
    (e *= r =
      ((n ? PS.critm : 150) + (s.critm || 0) + critOvr(PS, l, n)) / 100);
  for (const a of PS.hitPost) e = a(e, t, s);
  const i = s.sx ?? G.pl.x,
    c = s.sy ?? G.pl.y,
    d = t.x - i,
    f = t.y - c,
    p = Math.hypot(d, f) || 1,
    u = (s.kb ?? 45) * (t.boss ? 0.12 : t.elite ? 0.45 : 1);
  ((t.vx += (d / p) * u), (t.vy += (f / p) * u));
  const h = t.x - (d / p) * 3;
  (t.y,
    t.h,
    burst(
      h,
      t.y,
      o ? 10 : 5,
      o ? ["#ffffff", "#fff2c0", "#ffd84a"] : ["#ffffff", "#fff2c0"],
      o ? 130 : 100,
      { z: 0.45 * t.h, g: 60, life: 0.35, glow: 1 },
    ),
    s.stop && hitStop(o ? 0.075 : 0.045),
    sfx(o ? "crit" : "hit"),
    o && shake(0.1));
  const m = dealMob(t, e, o, void 0, G.trn && trnHit(s, o, r)),
    A = Math.min(1, (s.ovk || 0) + PS.ovk);
  (m > 0 && A > 0 && overkill(t, m * A, OVK.hops, A),
    (s.psn || PS.psnHit.some((t) => t >= 1 || RAND() < t)) &&
      poison(t, e, s.psn || s.pcap || PS.psnMax),
    !G.pl.sus.dance ||
      (s.skill && !tal("momSkill")) ||
      s.nomom ||
      addStk("mom"),
    s.ail && ailment(t, s.ail, e, s.ailx || 1),
    fire("hit", t, e, o, s));
}
function dealMob(t, a, s, e, n) {
  if (alive(t)) {
    if (G.trn) a = trnMul(PS.takeMul, PS.takeMulK, a, t);
    else for (const s of PS.takeMul) a = s(a, t);
    if ((hasAf(t, "tough") && (a *= 1 - ELITE_AF.tough.dr), t.sh > 0)) {
      const e = Math.min(t.sh, a);
      if (((t.sh -= e), (a -= e) <= 0))
        return (
          num(t.x, t.y - t.h - 4, e, s ? "#d8e4ff" : "#9ab0ff", s),
          (t.ag = !0),
          0
        );
    }
    if (!(t.gm && (a = guardTake(t, a)) <= 0)) {
      if (
        (t.tw && G.tw && (G.tw.dd += Math.min(a, t.hp)),
        G.trn && trnDmg(n || "oth", Math.min(a, t.hp)),
        (t.hp -= a),
        fire("dealt", t),
        (t.flash = e ? t.flash : 0.12),
        (t.ag = !0),
        num(t.x, t.y - t.h - 4, a, e || (s ? "#ffd84a" : "#ffffff"), s),
        t.hp <= 0)
      ) {
        const a = -t.hp;
        return (killMob(t), a);
      }
      return 0;
    }
  }
}
const hbOn = (t) => !!(G.pl.hb && G.pl.hb[t] > 0);
function hhKill(t) {
  if (!t.elite || !t.ea || !t.ea.length) return;
  const a = (G.pl.hb ||= {}),
    s = uv("hh", 0);
  for (const e of t.ea)
    HH[e] &&
      (a[e] > 0 ||
        ((a[e + "T"] = rf(0.5, 1)),
        num(G.pl.x, G.pl.y - 30, ELITE_AF[e].n, ELITE_AF[e].c)),
      (a[e] = s));
  sfx("quest");
}
function hhHit(t, a, s) {
  if (
    G.pl.hb &&
    (hbOn("leech") && heal(a * HH.leech.h),
    hbOn("burst") && !s.hhb && RAND() < HH.burst.p)
  ) {
    const s = HH.burst.r * PS.area;
    (roPushFx(G.fx,{ k: "boom", x: t.x, y: t.y - 3, r: 0.6 * s, t: 0, life: 0.3 }),
      sfx("big"));
    for (const e of mobsNear(t.x, t.y - 3, s))
      e !== t && dealMob(e, a, !1, ELITE_AF.burst.c, "uq:hh");
  }
}
function hhTick(t) {
  const a = G.pl.hb;
  if (!a) return;
  const s = G.pl;
  for (const e in HH)
    if (a[e] > 0) {
      if (((a[e] -= t), "volley" !== e && "frost" !== e)) continue;
      if ((a[e + "T"] -= t) > 0) continue;
      const n = HH[e];
      if ("volley" === e) {
        const t = nearestMobs(s.x, s.y, n.rng, n.n);
        if (!t.length) {
          a[e + "T"] = 0.3;
          continue;
        }
        a[e + "T"] = n.cd;
        const [l, o] = handPos();
        (t.forEach((t, a) =>
          later(0.05 * a, () => {
            alive(t) &&
              !G.dead &&
              roPushFx(G.proj,{
                k: "arrow",
                x: l,
                y: o,
                tgt: t,
                spd: 200,
                mult: n.k,
                kb: 20,
                o: { src: "uq:hh" },
              });
          }),
        ),
          sfx("shoot"));
      } else {
        a[e + "T"] = n.cd;
        const t = n.r * PS.area;
        (roPushFx(G.fx,{
          k: "nova",
          x: s.x,
          y: s.y - 3,
          r: t,
          t: 0,
          life: 0.45,
          c1: ELITE_AF.frost.c,
          c2: "#ffffff",
        }),
          sfx("nova"));
        for (const a of mobsNear(s.x, s.y - 3, t))
          ((a.chlv = Math.max((a.slow > 0 && a.chlv) || 0, n.v)),
            (a.slow = Math.max(a.slow, n.t)));
      }
    }
}
function corpseBoom(t) {
  const a = BOOM.r * PS.area;
  (roPushFx(G.fx,{ k: "boom", x: t.x, y: t.y - 3, r: 0.6 * a, t: 0, life: 0.3 }),
    burst(t.x, t.y, 18, ["#fff0a0", "#ff9a5a", "#c83a3a", "#5a2a3a"], 120, {
      z: 4,
      glow: 1,
    }),
    shake(0.06),
    sfx("big"));
  for (const s of mobsNear(t.x, t.y - 3, a))
    dealMob(s, t.max * (uv("boom", 1) / 100), !1, "#ff9a5a", "uq:boom");
}
function dotHit(t, a, s, e) {
  const n = tal("dotCrit") > 0 && 100 * RAND() < PS.crit;
  dealMob(t, n ? a * (1 + (PS.critm / 100 - 1) * tal("dotCrit")) : a, n, s, e);
}
const PYRE_CD = 2;
function pyreHit(t, a, s) {
  !s.skill ||
    !(s.tg || []).includes("aoe") ||
    G.t < (G.pyreT || 0) ||
    ((G.pyreT = G.t + PYRE_CD),
    roPushFx(G.fx,{
      k: "lava",
      x: t.x,
      y: t.y,
      r: 18 * PS.area,
      t: 0,
      life: uv("pyre", 0) * gndT(),
      acc: 0,
      d: a,
      ax: s.ailx || PS.ail,
    }));
}
function frostHit(t, a) {
  if (!alive(t) || t.frz > 0 || G.t < (t.fzi || 0)) return;
  const s = t.fst || (t.fst = { n: 0, t: 0 });
  (s.n++,
    (s.t = FRZ.t),
    s.n < FRZ.n ||
      ((t.fst = null),
      (t.frz = uv("frostc", 1) * (t.boss ? 0.5 : 1)),
      (t.fzi = G.t + t.frz + FRZ.imm),
      burst(t.x, t.y, 12, ["#ffffff", "#bfe8ff", "#7ad4ff"], 70, {
        z: 0.5 * t.h,
        life: 0.4,
        glow: 1,
      }),
      sfx("nova")));
}
const gndT = () => 1 + tal("gndT");
function fuseAdd(t, a) {
  const s = t.fz || (t.fz = { n: 0, d: 0, t: EXA.t, o: a.o, r: a.ar });
  (s.n++,
    (s.d += (a.mult / SKILLS.exarrow.hit) * EXA.k),
    (s.n >= EXA.n || !alive(t)) && fuseBoom(t));
}
function fuseBoom(t) {
  const a = t.fz;
  if (a) {
    ((t.fz = null),
      roPushFx(G.fx,{
        k: "boom",
        x: t.x,
        y: t.y - 4,
        r: 0.6 * a.r,
        t: 0,
        life: 0.3,
      }),
      burst(
        t.x,
        t.y,
        10 + 3 * a.n,
        ["#fff0a0", "#ffb347", "#ff6a3a", "#5a3a2a"],
        110,
        { z: 5, glow: 1 },
      ),
      shake(0.06),
      sfx("big"));
    for (const s of mobsNear(t.x, t.y - 3, a.r))
      hitMob(s, a.d, Object.assign({ kb: 80, sx: t.x, sy: t.y }, a.o));
  }
}
function chainOn(t, a) {
  const s = t.cl ?? (t.o && t.o.chn ? t.o.chn + tal("chnN") : 0);
  if (s <= 0) return;
  const e = t.chs || new Set();
  e.add(a);
  const n = nearestMobs(a.x, a.y, 60, 8).find(
    (t) => alive(t) && t !== a && (tal("chnRe") || !e.has(t)),
  );
  n &&
    roPushFx(G.proj,
      Object.assign({}, t, {
        tgt: n,
        x: a.x,
        y: a.y - 0.45 * a.h,
        cl: s - 1,
        chs: e,
        one: 0,
        spd: t.spd || 200,
      }),
    );
}
function trigHit(t, a, s, e) {
  if (!s || e.min || G.dead) return;
  const n = G.pl,
    l = n.trg || (n.trg = {}),
    o = TRIG.cd * (1 - tal("trigCd"));
  for (const t of activeGems())
    SKILLS[t.id].sus ||
      !gemMods(t).trig ||
      (l[t.u] || 0) > G.t ||
      !skillReady(t) ||
      ((l[t.u] = G.t + o),
      later(0.05, () => {
        if (
          placed().includes(t) &&
          !G.dead &&
          castSkill(t, tal("trigFull") ? 1 : TRIG.k)
        ) {
          sfx(t.id);
          const a = gemMods(t);
          (castCost(a),
            castExtra(t, a, tal("trigFull") ? 1 : TRIG.k),
            fire("cast", t));
        }
      }));
}
function castCost(t) {
  t.life &&
    ((S.hp = Math.max(1, S.hp - PS.maxhp * t.life)),
    burst(G.pl.x, G.pl.y - 8, 5, ["#ff4a5a", "#8a1a2a"], 40, {
      z: 8,
      life: 0.3,
    }));
}
const trapN = () => G.fx.filter((t) => "trap" === t.k && !t.done).length;
function trapBoom(t, a) {
  ((t.t = t.life), (t.done = 1));
  const s = mobsNear(t.x, t.y - 2, t.r);
  a && !s.includes(a) && s.push(a);
  for (const a of s)
    (hitMob(a, t.mult, Object.assign({ kb: 30, sx: t.x, sy: t.y }, t.o)),
      alive(a) && (a.root = Math.max(a.root || 0, TRAP.root)));
  (S.set.trapFx ||
    (roPushFx(G.fx,
      { k: "boom", x: t.x, y: t.y - 2, r: 0.6 * t.r, t: 0, life: 0.3 },
      { k: "ring", x: t.x, y: t.y, r: t.r, t: 0, life: 0.3, col: "#e0d090" },
    ),
    burst(t.x, t.y, 14, ["#e0d090", "#8a7a5a", "#ffffff", "#5a4a3a"], 100, {
      z: 2,
      vz: 60,
    }),
    shake(0.08)),
    sfx("trapx"));
}
function nearestMobs(t, a, s, e) {
  return G.mobs
    .filter((e) => e.spawnT <= 0 && Math.hypot(e.x - t, e.y - a) <= s)
    .sort((s, e) => Math.hypot(s.x - t, s.y - a) - Math.hypot(e.x - t, e.y - a))
    .slice(0, e);
}
function streak(t, a, s) {
  for (let e = 0; e <= 6; e++)
    G.parts.push({
      x: t.x + ((a.x - t.x) * e) / 6,
      y: t.y + ((a.y - t.y) * e) / 6,
      z: 6,
      vx: 0,
      vy: 0,
      vz: 0,
      g: 0,
      life: 0.2 + 0.03 * e,
      c: e % 2 ? s : "#ffffff",
      s: 1,
      glow: 1,
    });
}
const TAL_ON = {
  dgLuck: {
    p: -1,
    hurt: () => {
      G.pl.dgLk = 1;
    },
    off: () => {
      G.pl.dgLk = 0;
    },
  },
  critShd: {
    p: -1,
    hit: (t, a, s, e) => {
      s && !e.min && addShd(PS.eva * tal("critShd"), PS.eva * RG.cap);
    },
    off: () => {
      G.pl.shd = 0;
    },
  },
  thorn: {
    p: 1,
    hurtPre: (t, a) => {
      a && thornHit(a, PS.armor * tal("thorn"), "r:thorn");
    },
  },
  leech: {
    p: -1,
    hit: (t, a) => heal(a * tal("leech") * (tal("rage") ? 2 : 1)),
  },
  psnSpread: {
    p: -1,
    kill: (t) => {
      if (!t.psn || !t.psn.s.length) return;
      const a =
          t.psn.s.reduce((t, a) => t + a.dps * Math.max(0, a.t), 0) *
          (1 + tal("psnRate")) *
          tal("psnSpread"),
        s = t.psn.s.map((t) => t.dps),
        e = 36 * PS.area;
      later(0.08, () => {
        (roPushFx(G.fx,{
          k: "nova",
          x: t.x,
          y: t.y - 3,
          r: e,
          t: 0,
          life: 0.4,
          c1: "#9aff4a",
          c2: "#e8ffc0",
        }),
          burst(t.x, t.y, 18, ["#9aff4a", "#e8ffc0", "#4a8a2a"], 110, {
            z: 4,
            glow: 1,
          }),
          sfx("kill"));
        for (const n of mobsNear(t.x, t.y - 3, e))
          if ((dealMob(n, a, !1, "#8ad94a", "r:psnSpread"), alive(n)))
            for (const t of s) psnAdd(n, t, PS.psnMax);
      });
    },
  },
  crsSpread: {
    p: -1,
    kill: (t) => {
      if (t.crs)
        for (const a of nearestMobs(t.x, t.y, 44, tal("crsSpread"))) {
          streak(t, a, "#c89aff");
          for (const s in t.crs)
            t.crs[s] > 0 &&
              ((a.crs || (a.crs = {}))[s] = Math.max(
                (a.crs && a.crs[s]) || 0,
                t.crs[s],
              ));
        }
    },
  },
  ember: {
    p: -1,
    kill: (t) => {
      t.brn &&
        t.brn.t > 0 &&
        later(0.08, () => {
          (roPushFx(G.fx,{
            k: "boom",
            x: t.x,
            y: t.y - 3,
            r: 22 * PS.area,
            t: 0,
            life: 0.3,
          }),
            burst(t.x, t.y, 14, ["#fff0a0", "#ffb347", "#ff6a3a"], 100, {
              z: 6,
              glow: 1,
            }));
          for (const a of mobsNear(t.x, t.y - 3, 22 * PS.area))
            hitMob(a, tal("ember"), {
              skill: 1,
              kb: 60,
              sx: t.x,
              sy: t.y,
              src: "r:ember",
            });
        });
    },
  },
};
function fire(t, a, s, e, n) {
  const l = PS.on && PS.on[t];
  if (l) for (const t of l) if (!0 === t(a, s, e, n)) return !0;
  return !1;
}
function tickCrsAura(t) {
  const a = tal("crsRing"),
    s = a ? CRS_RING.iv : tal("crsAura");
  if (!s || G.dead || (G.crsAuraT = Math.min(G.crsAuraT ?? s, s) - t) > 0)
    return;
  G.crsAuraT = s;
  const e = G.pl,
    n = [
      ...new Set(
        placed()
          .filter((t) => SKILLS[t.id].act)
          .map((t) => SKILLS[t.id].crs)
          .filter(Boolean),
      ),
    ],
    l = crsAuraR(),
    o = mobsNear(e.x, e.y - 3, l);
  if (n.length && o.length) {
    for (const t of o)
      for (const s of n)
        (t.crs || (t.crs = {}))[s] = Math.max(
          t.crs[s] || 0,
          a ? CRS_RING.t : CRS[s].t + tal("crsT"),
        );
    a ||
      roPushFx(G.fx,{
        k: "ring",
        x: e.x,
        y: e.y - 3,
        r: l,
        t: 0,
        life: 0.5,
        col: "#c89aff",
      });
  }
}
const crsAuraR = () => 28 * PS.area * (1 + tal("crsR"));
function overkill(t, a, s, e) {
  let n = null,
    l = OVK.r;
  for (const a of G.mobs) {
    const s = Math.hypot(a.x - t.x, a.y - t.y);
    a.spawnT <= 0 && s < l && ((l = s), (n = a));
  }
  if (!n || a < 1) return;
  const o = t.x,
    r = t.y - 0.45 * t.h,
    i = n.x,
    c = n.y - 0.45 * n.h;
  for (let t = 0; t <= 8; t++)
    G.parts.push({
      x: o + ((i - o) * t) / 8,
      y: r + ((c - r) * t) / 8 + 6,
      z: 6,
      vx: 0,
      vy: 0,
      vz: 0,
      g: 0,
      life: 0.2 + 0.02 * t,
      c: t % 2 ? OVK.col : "#ffffff",
      s: 1,
      glow: 1,
    });
  const d = dealMob(n, a, !1, OVK.col, "ovk");
  d > 0 && s > 1 && overkill(n, d * e, s - 1, e);
}
function poison(t, a, s = 1) {
  psnAdd(t, a * PSN_K * PS.psn, s);
}
function psnAdd(t, a, s) {
  if (!alive(t)) return;
  t.psn || (t.psn = { s: [], acc: 0 });
  const e = t.psn.s;
  if (e.length < s) e.push({ dps: a, t: PSN_T });
  else {
    const t = e.reduce((t, a) => (a.dps < t.dps ? a : t));
    ((t.t = PSN_T), (t.dps = Math.max(t.dps, a)));
  }
}
function ailment(t, a, s, e) {
  if (!alive(t)) return;
  e *= 1 + tal("ax_" + a);
  const n = AIL[a],
    l = n.t * e;
  if ("brn" === a || "bld" === a) {
    const o = s * n.v * e * PS[a],
      r = t[a];
    !r || r.t <= 0
      ? (t[a] = { dps: o, t: l, acc: 0 })
      : ((r.t = l), (r.dps = Math.max(r.dps, o)));
  } else
    "chl" === a
      ? ((t.chlv = Math.max(
          (t.slow > 0 && t.chlv) || 0,
          Math.min(0.75, n.v * e),
        )),
        (t.slow = Math.max(t.slow, l)))
      : ((t.shkv = Math.max((t.shk > 0 && t.shkv) || 0, n.v * e)),
        (t.shk = Math.max(t.shk || 0, l)));
}
function tickAil(t) {
  for (const a of G.mobs.slice()) {
    if (a.fz && (a.fz.t -= t) <= 0 && (fuseBoom(a), !alive(a))) continue;
    (a.root > 0 && (a.root -= t),
      a.frz > 0 && (a.frz -= t),
      a.stn > 0 && (a.stn -= t),
      a.fst && (a.fst.t -= t) <= 0 && (a.fst = null));
    const s = a.bld,
      e = null != a.bpx && Math.hypot(a.x - a.bpx, a.y - a.bpy) > 3 * t;
    if (
      ((a.bpx = a.x),
      (a.bpy = a.y),
      s &&
        s.t > 0 &&
        ((s.t -= t),
        (s.acc += t),
        RAND() < t * (e ? 14 : 6) &&
          G.parts.push({
            x: a.x + rf(-3, 3),
            y: a.y,
            z: a.h * rf(0.3, 0.8),
            vx: rf(-6, 6),
            vy: 0,
            vz: rf(-4, 6),
            g: 60,
            life: 0.45,
            c: RAND() < 0.6 ? "#e02a3a" : "#8a1020",
            s: 1,
          }),
        s.acc >= 0.5 &&
          ((s.acc -= 0.5),
          dotHit(a, 0.5 * s.dps * (e ? AIL.bld.mv : 1), AIL.bld.col, "bld")),
        !alive(a)))
    )
      continue;
    a.shk > 0 &&
      ((a.shk -= t),
      RAND() < 6 * t &&
        G.parts.push({
          x: a.x + rf(-4, 4),
          y: a.y,
          z: a.h * rf(0.2, 0.9),
          vx: rf(-20, 20),
          vy: 0,
          vz: rf(-10, 10),
          g: 0,
          life: 0.12,
          c: RAND() < 0.5 ? "#ffe04a" : "#ffffff",
          s: 1,
          glow: 1,
        }));
    const n = a.brn;
    !n ||
      n.t <= 0 ||
      ((n.t -= t),
      (n.acc += t),
      RAND() < 8 * t &&
        G.parts.push({
          x: a.x + rf(-3, 3),
          y: a.y,
          z: a.h * rf(0.2, 0.7),
          vx: 0,
          vy: 0,
          vz: rf(16, 30),
          g: -10,
          life: 0.4,
          c: ["#fff0a0", "#ffb347", "#ff6a3a"][ri(0, 2)],
          s: 1,
          glow: 1,
        }),
      n.acc >= 0.5 &&
        ((n.acc -= 0.5), dotHit(a, 0.5 * n.dps, AIL.brn.col, "brn")));
  }
}
const minBase = (t) =>
  "guard" === (SKILLS[t.id]?.roBase || t.id) ? GSP.n : "turret" === (SKILLS[t.id]?.roBase || t.id) ? TUR.n : MIN.n;
function minCap(t) {
  return minBase(t) + PS.minion + gemMods(t).minion;
}
function plantSap(t) {
  const a = SAP.n + PS.minion;
  (G.saps.push({ x: t.x, y: t.y, t: 0, atk: rf(0.2, 0.6) }),
    G.saps.length > a && G.saps.shift(),
    burst(t.x, t.y, 8, ["#7ad46a", "#a8e070"], 50, { z: 2, life: 0.4 }));
}
const orbitPos = (t) => {
  const a = 3 * G.t + (t / G.orbit.length) * 6.283;
  return [
    G.pl.x + Math.cos(a) * ORBIT.r,
    G.pl.y - 6 + Math.sin(a) * ORBIT.r * 0.6,
  ];
};
function tickUq(t) {
  const a = G.pl;
  G.saps = G.saps.filter((a) => (a.t += t) < SAP.t * gndT());
  for (const a of G.saps) {
    if ((a.atk -= t) > 0) continue;
    let s = null,
      e = SAP.r;
    for (const t of G.mobs) {
      if (t.spawnT > 0) continue;
      const n = dist(t, a);
      n < e && ((e = n), (s = t));
    }
    s &&
      ((a.atk = SAP.atk / minAtk()),
      roPushFx(G.fx,{
        k: "zap",
        x: a.x,
        y: a.y - 5,
        x2: s.x,
        y2: s.y - 0.45 * s.h,
        t: 0,
        life: 0.15,
        s: ri(1, 999),
        col: "#7ad46a",
      }),
      hitMob(s, (uv("roots", 1) / 100) * (1 + tal("minDmg")), {
        kb: 15,
        sx: a.x,
        sy: a.y,
        min: 1,
        src: "uq:roots",
      }));
  }
  if (
    (a.mgT > 0 &&
      RAND() < 14 * t &&
      G.parts.push({
        x: a.x + rf(-5, 5),
        y: a.y,
        z: rf(2, 10),
        vx: 0,
        vy: 0,
        vz: rf(14, 28),
        g: -6,
        life: 0.5,
        c: RAND() < 0.6 ? "#ff8a3a" : "#ffd040",
        s: 1,
        glow: 1,
      }),
    a.mgT > 0 && (a.mgT -= t) <= 0)
  ) {
    const t = MAGMA.r * PS.area,
      s = a.mg * MAGMA.x;
    if (((a.mg = 0), !G.dead)) {
      for (const e of mobsNear(a.x, a.y, t))
        dealMob(e, s, !1, "#ff8a3a", "uq:magma");
      (roPushFx(G.fx,{
        k: "boom",
        x: a.x,
        y: a.y - 3,
        r: 0.6 * t,
        t: 0,
        life: 0.35,
      }),
        roPushFx(G.fx,{
          k: "ring",
          x: a.x,
          y: a.y - 3,
          r: t,
          t: 0,
          life: 0.4,
          col: "#ff8a3a",
        }),
        burst(a.x, a.y, 24, ["#ff8a3a", "#ffd040", "#4a3a3a"], 110, { z: 4 }),
        shake(0.15),
        sfx("big"));
    }
  }
  ((G.orbit = G.orbit.filter((a) => (a.t -= t) > 0)),
    G.orbit.forEach((s, e) => {
      if ((s.cd -= t) > 0) return;
      const [n, l] = orbitPos(e),
        o = G.mobs.find(
          (t) =>
            alive(t) &&
            t.spawnT <= 0 &&
            Math.abs(t.x - n) < 4 + (t.boss ? 7 : 0) &&
            Math.abs(t.y - 0.45 * t.h - l) < 0.6 * t.h,
        );
      o &&
        ((s.cd = ORBIT.cd),
        hitMob(o, uv("astral", 0) / 100, {
          skill: 1,
          kb: 25,
          sx: a.x,
          sy: a.y,
          src: "uq:astral",
        }),
        burst(n, l, 5, ["#9ab0ff", "#ffffff"], 60, {
          z: 0,
          life: 0.25,
          glow: 1,
        }));
    }));
}
function tickMins(t) {
  const a = G.pl,
    s = activeGems().filter((t) => "summon" === (SKILLS[t.id]?.roBase || t.id));
  (G.dead && (G.mins = []),
    (G.mins = G.mins.filter((t) => s.some((a) => a.u === t.g))));
  for (const t of s) {
    const a = G.mins.filter((a) => a.g === t.u),
      s = minCap(t);
    a.length > s && (G.mins = G.mins.filter((t) => !a.slice(s).includes(t)));
  }
  G.mins.forEach((e, n) => {
    if (((e.t += t), (e.atk -= t), S.set.minG)) {
      e.tgt = null;
      let t = 1e9;
      for (const s of G.mobs) {
        if (s.spawnT > 0) continue;
        const n =
          dist(s, a) + 16 * G.mins.filter((t) => t !== e && t.tgt === s).length;
        n < t && ((t = n), (e.tgt = s));
      }
    } else if (!alive(e.tgt) || e.tgt.spawnT > 0) {
      e.tgt = null;
      let t = 1e9;
      for (const a of G.mobs) {
        if (a.spawnT > 0) continue;
        const s =
          dist(a, e) +
          100 * G.mins.filter((t) => t !== e && t.tgt === a).length;
        s < t && ((t = s), (e.tgt = a));
      }
    }
    let l,
      o,
      r = 0;
    if (e.tgt)
      ((l = e.tgt.x), (o = e.tgt.y), (r = MIN.r + (e.tgt.boss ? 8 : 0)));
    else {
      const t = 0.9 * G.t + (n / G.mins.length) * 6.283;
      ((l = a.x + 14 * Math.cos(t)), (o = a.y + 8 * Math.sin(t)));
    }
    const i = l - e.x,
      c = o - e.y,
      d = Math.hypot(i, c),
      f = Math.min(Math.max(0, d - r), MIN.spd * (1 + PS.minAs) * t);
    (d > 0.5 &&
      ((e.x += (i / d) * f),
      (e.y += (c / d) * f),
      Math.abs(i) > 1 && (e.face = i < 0 ? -1 : 1)),
      (e.x += (e.vx || 0) * t),
      (e.y += (e.vy || 0) * t));
    const p = Math.pow(0.002, t);
    if (
      ((e.vx = (e.vx || 0) * p),
      (e.vy = (e.vy || 0) * p),
      inArena(e),
      e.tgt && e.atk <= 0 && d <= r + 3)
    ) {
      const t = gemMods(s.find((t) => t.u === e.g));
      e.atk = MIN.atk / minAtk();
      const a = (a, s) =>
        roPushFx(G.proj,{
          k: "mbolt",
          x: e.x,
          y: e.y - 9,
          tgt: s,
          spd: MIN.pspd,
          mult: MIN.k * a * (1 + t.dmg) * (1 + tal("minDmg")),
          kb: 20,
          col: AIL[e.el].col,
          o: {
            skill: 1,
            tg: SKILLS.summon.tg,
            min: 1,
            ncrit: !tal("minCrit"),
            crit: t.crit,
            critm: t.critm,
            ail: e.el,
            ailx: PS.ail * (1 + tal("minAil")),
          },
        });
      a(1, e.tgt);
      for (let s = 0; s < t.extra; s++) {
        const t = e.tgt;
        later(0.12 * (s + 1), () => {
          const s = alive(t) ? t : e.tgt;
          alive(s) && G.mins.includes(e) && a(0.6, s);
        });
      }
      (burst(e.x, e.y - 3, 4, [AIL[e.el].col, "#ffffff"], 40, {
        z: 6,
        life: 0.2,
        glow: 1,
      }),
        d > 0.5 && ((e.vx = (-i / d) * 25), (e.vy = (-c / d) * 15)));
    }
  });
}
const gspCap = (t) => GSP.n + PS.minion + gemMods(t).minion,
  gspMax = (t) => PS.maxhp * GSP.life * (1 + gemMods(t).mlife);
function foeOf(t) {
  const a = G.pl;
  if (!G.gsp.length || t.tnt > 0) return a;
  let s = a,
    e = GSP.tr;
  for (const a of G.gsp) {
    const n = dist(t, a);
    n < e && ((e = n), (s = a));
  }
  return s;
}
function gspHurt(t, a, s) {
  if (!(t.hp > 0)) return;
  if (100 * RAND() < PS.dodge)
    return void num(t.x, t.y - 18, "MISS", "#c8d0e0");
  const e =
    a *
    (1 - PS.armRed / 100) *
    (s && cursed(s, "wk") ? 1 - CRS.wk.v * PS.crs : 1);
  if (
    ((t.hp -= e), (t.hurt = 0.15), num(t.x, t.y - 18, e, "#9ab0ff"), t.hp > 0)
  )
    return;
  (G.gsp.splice(G.gsp.indexOf(t), 1),
    burst(t.x, t.y - 8, 18, ["#a0c8ff", "#e8f4ff", "#5a7ac0"], 70, {
      z: 8,
      life: 0.5,
      glow: 1,
    }));
  const n = placed().find((a) => a.u === t.g);
  if (n) {
    const t = gemMods(n);
    G.pl.cds[n.u] =
      SKILLS.guard.cd * (1 - t.cd) * (1 - PS.cdr / 100) * kingCd();
  }
}
function tickGsp(t) {
  const a = G.pl,
    s = activeGems().filter((t) => "guard" === (SKILLS[t.id]?.roBase || t.id));
  (G.dead && (G.gsp = []),
    (G.gsp = G.gsp.filter((t) => s.some((a) => a.u === t.g))));
  for (const t of s) {
    const a = G.gsp.filter((a) => a.g === t.u),
      s = gspCap(t);
    a.length > s && (G.gsp = G.gsp.filter((t) => !a.slice(s).includes(t)));
  }
  G.gsp.forEach((e, n) => {
    const l = s.find((t) => t.u === e.g),
      o = gemMods(l),
      r = gspMax(l);
    if (
      (r !== e.max && ((e.hp *= r / e.max), (e.max = r)),
      (e.hp = Math.min(e.max, e.hp + ((e.max * PS.regen) / PS.maxhp) * t)),
      (e.t += t),
      (e.atk -= t * minAtk()),
      (e.hurt = Math.max(0, e.hurt - t)),
      (e.sw = Math.max(0, e.sw - t)),
      !alive(e.tgt) || e.tgt.spawnT > 0 || dist(e.tgt, a) > GSP.follow + 20)
    ) {
      e.tgt = null;
      let t = GSP.follow;
      for (const s of G.mobs) {
        if (s.spawnT > 0 || !alive(s)) continue;
        const n = dist(s, a);
        n < t && ((t = n), (e.tgt = s));
      }
    }
    let i,
      c,
      d = 0;
    e.tgt
      ? ((i = e.tgt.x), (c = e.tgt.y), (d = GSP.reach + (e.tgt.boss ? 8 : 0)))
      : ((i = a.x + (n % 2 ? 10 : -10)), (c = a.y + 3));
    const f = i - e.x,
      p = c - e.y,
      u = Math.hypot(f, p),
      h = Math.min(Math.max(0, u - d), GSP.spd * t);
    if (
      (u > 0.5 &&
        ((e.x += (f / u) * h),
        (e.y += (p / u) * h),
        Math.abs(f) > 1 && (e.face = f < 0 ? -1 : 1)),
      inArena(e),
      e.tgt && e.atk <= 0 && u <= d + 3)
    ) {
      ((e.atk = GSP.atk), (e.sw = 0.2));
      const t = e.tgt;
      for (let a = 0; a <= o.extra; a++)
        later(0.08 + 0.15 * a, () => {
          alive(t) &&
            e.hp > 0 &&
            (a && (e.sw = 0.2),
            hitMob(
              t,
              GSP.k * (a ? 0.6 : 1) * (1 + o.dmg) * (1 + tal("minDmg")),
              {
                skill: 1,
                tg: SKILLS.guard.tg,
                min: 1,
                ncrit: !tal("minCrit"),
                crit: o.crit,
                critm: o.critm,
                kb: 40,
                sx: e.x,
                sy: e.y,
              },
            ));
        });
    }
  });
}
function tickTurs(t) {
  const a = activeGems().filter((t) => "turret" === (SKILLS[t.id]?.roBase || t.id));
  (G.dead && (G.turs = []),
    (G.turs = G.turs.filter(
      (s) => (s.t += t) < TUR.t && a.some((t) => t.u === s.g),
    )));
  for (const s of G.turs) {
    if ((s.atk -= t) > 0) continue;
    let e = null,
      n = TUR.r;
    for (const t of G.mobs) {
      if (t.spawnT > 0 || !alive(t)) continue;
      const a = dist(t, s);
      a < n && ((n = a), (e = t));
    }
    if (!e) {
      s.atk = 0.2;
      continue;
    }
    const l = gemMods(a.find((t) => t.u === s.g));
    ((s.atk = 1 / (TUR.as * PS.waps * minAtk())),
      (s.face = e.x < s.x ? -1 : 1),
      (s.fire = 0.15));
    const o = {
      k: "arrow",
      x: s.x + 3 * s.face,
      y: s.y - 8,
      spd: TUR.pspd,
      mult: TUR.k * s.k * (1 + l.dmg) * (1 + tal("minDmg")),
      kb: 20,
      o: {
        skill: 1,
        tg: SKILLS.turret.tg,
        min: 1,
        hcrit: 1,
        crit: l.crit,
        critm: l.critm,
        chn: l.chn,
        ovk: l.ovk,
      },
    };
    fan(o, e, Math.atan2(e.y - o.y, e.x - o.x), l.proj);
    for (let t = 0; t < l.extra; t++)
      later(0.12 * (t + 1), () => {
        if (!G.turs.includes(s) || !alive(e)) return;
        const t = Object.assign({}, o, { mult: 0.6 * o.mult });
        fan(t, e, Math.atan2(e.y - t.y, e.x - t.x), l.proj);
      });
  }
  for (const a of G.turs) a.fire > 0 && (a.fire -= t);
}
const bpoolR = () => {
  const t = activeGems().find((t) => "bpool" === (SKILLS[t.id]?.roBase || t.id));
  return BPOOL.r * PS.area * (1 + (t ? gemMods(t).area : 0));
};
function bpoolTick(t) {
  const a = G.pl;
  if (
    (S.hp > 1 && (S.hp = Math.max(1, S.hp - PS.maxhp * BPOOL.drain * t)),
    (a.bpT = (a.bpT || 0) + t) < BPOOL.iv)
  )
    return;
  a.bpT -= BPOOL.iv;
  const s = gemMods(activeGems().find((t) => "bpool" === (SKILLS[t.id]?.roBase || t.id)));
  for (const t of mobsNear(a.x, a.y, bpoolR()))
    hitMob(t, 1 + s.dmg, {
      skill: 1,
      base: PS.maxhp * BPOOL.k,
      kb: 0,
      tg: SKILLS.bpool.tg,
      crit: s.crit,
      critm: s.critm,
    });
}
function cursed(t, a) {
  return !!(t.crs && t.crs[a] > 0);
}
function addStk(t) {
  const a = G.pl.stk[t] || (G.pl.stk[t] = { n: 0, t: 0 });
  ((a.n = Math.min(STK[t].max + ("mom" === t ? tal("momMax") : 0), a.n + 1)),
    (a.t = STK[t].dur));
}
function useStk(t) {
  const a = G.pl.stk[t];
  return !(
    !a ||
    a.n <= 0 ||
    (stkKeep(t) ? (a.t = STK[t].dur) : --a.n <= 0 && delete G.pl.stk[t], 0)
  );
}
const stkKeep = (t) =>
  "mom" === t && tal("momSave") > 0 && RAND() < tal("momSave");
function stkN(t) {
  const a = G.pl.stk[t];
  return a ? a.n : 0;
}
function tickStk(t) {
  for (const a in G.pl.stk) {
    const s = G.pl.stk[a];
    if (((s.t -= t), s.t <= 0)) {
      if (stkKeep(a)) {
        s.t = STK[a].dur;
        continue;
      }
      (s.n--, (s.t = STK[a].decay), s.n <= 0 && delete G.pl.stk[a]);
    }
  }
}
function tickPoison(t) {
  for (const a of G.mobs.slice()) {
    const s = a.psn;
    if (!s) continue;
    ((s.acc += t),
      (s.fx = (s.fx || 0) - t),
      s.fx <= 0 &&
        ((s.fx = 0.2 / Math.min(3, s.s.length)),
        G.parts.push({
          x: a.x + rf(-3, 3),
          y: a.y,
          z: a.h * rf(0.3, 0.8),
          vx: 0,
          vy: 0,
          vz: 14,
          g: 0,
          life: 0.5,
          c: RAND() < 0.5 ? "#8ad94a" : "#c8f080",
          s: 1,
          glow: 1,
        })));
    const e = 1 / (1 + tal("psnRate"));
    s.acc >= e &&
      ((s.acc -= e),
      dotHit(
        a,
        s.s.reduce((t, a) => t + a.dps, 0),
        "#8ad94a",
        "psn",
      ));
    for (const a of s.s) a.t -= t;
    ((s.s = s.s.filter((t) => t.t > 0)),
      !s.s.length && alive(a) && (a.psn = null));
  }
}
function killMob(t) {
  if (
    (G.mobs.splice(G.mobs.indexOf(t), 1),
    G.pl.tgt === t && (G.pl.tgt = null),
    fire("kill", t),
    hasAf(t, "burst"))
  ) {
    const a = ELITE_AF.burst;
    addHaz({ x: t.x, y: t.y, r: a.r, t: a.t, dmg: t.dmg * a.k, c: a.c });
  } else
    t.boom &&
      100 * RAND() < t.boom &&
      addHaz({
        x: t.x,
        y: t.y,
        r: SL_BOOM.r,
        t: SL_BOOM.t,
        dmg: t.dmg * SL_BOOM.k,
        c: "#ff5a3a",
        adg: SL_BOOM.adg,
      });
  const a = "slime" === t.type ? SLIME_PAL[curMap().v.sl] : MON_COLS[t.type];
  if (
    (burst(t.x, t.y, t.boss ? 60 : t.elite ? 34 : 18, a, t.boss ? 140 : 90, {
      z: 0.5 * t.h,
    }),
    burst(t.x, t.y, 6, ["#ffffff", "#fff2c0"], 130, {
      z: 0.5 * t.h,
      g: 0,
      life: 0.35,
      glow: 1,
    }),
    G.flashes.push({
      x: t.x,
      y: t.y - 0.5 * t.h,
      t: 0,
      c: "#ffffff",
      r: t.boss ? 22 : t.elite ? 12 : 7,
    }),
    (t.boss || t.elite) && shake(t.boss ? 0.3 : 0.12),
    sfx(t.boss || t.elite ? "big" : "kill"),
    t.dm)
  )
    return trnKill(t);
  const s = Math.min(S.lvl, 100) - t.lv;
  let e = (3 + 1.5 * t.lv) * (t.elite ? 3 : 1) * (t.boss ? 20 : 1);
  s > 5 && (e *= Math.max(0.1, 1 - 0.08 * (s - 5)));
  for (let a = 0, s = t.boss ? 14 : t.elite ? 6 : ri(2, 3); a < s; a++) {
    const a = rf(0, 6.283),
      s = rf(15, 45);
    G.orbs.push({
      x: t.x,
      y: t.y,
      z: 4,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s * 0.6,
      vz: rf(40, 80),
      t: 0,
    });
  }
  if (
    (gainXp(e),
    PS.lok && heal(PS.lok * (tal("rage") ? 2 : 1)),
    tal("lokp") && heal(PS.maxhp * tal("lokp") * (tal("rage") ? 2 : 1)),
    t.tw)
  )
    return twKill(t);
  const n = S.map + "_" + t.type,
    l = S.kills[n] || 0;
  S.kills[n] = l + 1;
  const o = curMap().card && curMap().m.includes(t.type) ? cardKills(S.map) : 0;
  if (CARD_N.includes(o)) {
    const t = cardTier(S.map),
      a = curMap().card;
    (toast(
      `地圖蒐藏第 ${t} 階：${AFFIX[a[0]].f(a[1][t - 1])}（${curMap().n}）`,
      "lvl",
    ),
      ui.menuDot("mapcol", 1),
      recalc());
  }
  if (
    (2e4 === o &&
      (toast(`解鎖拖尾特效「${TRAIL[S.map].n}」！`, "rm", 1),
      (S.set.trail ?? -1) >= 0 || (S.set.trail = S.map),
      ui.menuDot("fx", 1),
      sfx("lvl")),
    null != MON[t.type].god && ssMap() && godCard(MON[t.type].god, S.kills[n]),
    S.total++,
    G.minK++,
    G.rate.k[G.rate.i]++,
    ses().k++,
    t.boss ||
      G.boss ||
      ssMap() ||
      (S.prog[S.map] = Math.min(bossNeed(S.map), S.prog[S.map] + 1)),
    null != MON[t.type].god &&
      !t.add &&
      ssMap() &&
      RAND() < SS.frag &&
      dropLoot(t, {
        ssf: MON[t.type].god,
        col: GODS[MON[t.type].god].c,
        tier: 3,
      }),
    slateKills(1),
    quest("kill", 1),
    t.boss && null != G.guard)
  )
    guardWin(t);
  else if (t.boss) {
    for (let a = 0; a < 2; a++) dropItem(t, { rw: [0, 35, 45, 20] });
    (RAND() < 0.15 && dropItem(t, { uniq: 1, uqk: roBossUnique(S.map, t), off: 1 }),
      null != t.god && ssBossDrop(t),
      bossWin());
  } else for (const a of rollKillDrops(t.elite)) dropItem(t, a);
  dropMats(t);
  const r = rollSlate(t.lv, t.elite, t.boss);
  r && dropLoot(t, { sl: r, col: rarColor(r), tier: r.rar });
  const i = rollMut(t.elite, t.boss);
  i && dropLoot(t, { gm: i, col: SKILLS[i.id].col, tier: 3 });
  const c = rollLeg(t);
  c && dropLoot(t, { gm: c, col: SKILLS[c.id].col, tier: 4 });
  const d = rollSx(t);
  d && dropLoot(t, { gm: d, col: SX_COL, tier: 4 });
  const f = t.gm ? -1 : rollTicket(t.lv, t.elite, t.boss);
  f >= 0 && dropLoot(t, { tk: f, col: GUARD[f].c, tier: 3 });
}
function godCard(t, a) {
  const s = GFX_N.indexOf(a);
  if (s < 0) return;
  const e = s ? "kfx" : "hfx",
    n = GODS[t];
  (toast(
    `解鎖${n.n}${s ? "擊殺" : "擊中"}特效「${s ? n.kn : n.hn}」！`,
    "rm",
    1,
  ),
    (S.set[e] ?? -1) >= 0 || (S.set[e] = t),
    ui.menuDot("fx", 1),
    sfx("lvl"),
    markDirty());
}
function dropLoot(t, a) {
  const s = rf(0, 6.283),
    e = rf(12, 34);
  G.drops.push(
    Object.assign(
      {
        x: t.x,
        y: t.y,
        z: 6,
        vx: Math.cos(s) * e,
        vy: Math.sin(s) * e * 0.6,
        vz: rf(60, 95),
        landed: 0,
        t: 0,
      },
      a,
    ),
  );
}
function rollTicket(t, a, s) {
  return slatesOn().length &&
    !ssMap() &&
    null == G.guard &&
    RAND() < GUARD_TK[s ? 2 : a ? 1 : 0]
    ? guardOf(S.map)
    : -1;
}
function rollSlate(t, a, s) {
  return S.beat[MAP_N - 1] &&
    t >= 77 &&
    RAND() <
      (s ? 0.5 : a ? 0.015 : 0.003) * endF(t) * (1 + slateSum("sl_sdrop") / 100)
    ? slateSum("sl_sock") && 1e3 * RAND() < slateSum("sl_sock")
      ? makeSockSlate(t)
      : makeSlate(t)
    : null;
}
function rollLeg(t) {
  if (
    t.lv < 90 ||
    (!t.elite && !t.boss) ||
    RAND() >= (t.boss ? LEG_P.b : LEG_P.e)
  )
    return null;
  const a = Object.keys(SKILLS).filter(
    (t) => SKILLS[t].leg && SKILLS[t].cls === roArchetype(S.cls),
  );
  return a.length
    ? { u: uid(), id: a[ri(0, a.length - 1)], x: -1, y: -1, rot: 0 }
    : null;
}
function rollSx(t, a = t.elite, s = t.boss) {
  const e =
    (t.lv >= 90 && (a || s) ? (s ? SX_P.b : SX_P.e) : 0) +
    (slateSum("sl_sx") / 1e5) * (s ? MUT.b : a ? MUT.e : 1);
  if (!e || RAND() >= e) return null;
  const n = sxPool(S.cls);
  return n.length
    ? { u: uid(), id: pickW(n, (t) => SX_W[t]), x: -1, y: -1, rot: 0, sx: 1 }
    : null;
}
function rollMut(t, a) {
  const s = slateSum("sl_mut");
  return s && 1e4 * RAND() < s * (a ? MUT.b : t ? MUT.e : 1)
    ? makeMutGem()
    : null;
}
function slateKills(t) {
  if (!slatesOn().length) return;
  const a = slotsOf(S.map),
    s = slateOpen(S.map);
  ((a.k += t),
    slateOpen(S.map) > s &&
      (toast(`開啟第 ${slateOpen(S.map)} 個石板欄位`, "lvl", 1),
      ui.badge("map", 1)));
}
const slAutoSalv = (t) =>
  slSet().sauto[t.sock ? 4 : t.rar] && !keepMatch(t, slSet().skeep);
function takeSlate(t) {
  const a = t.my
    ? ""
    : slAutoSalv(t)
      ? "salv"
      : S.slates.length >= 5e3
        ? "full"
        : "";
  return a
    ? ((S.ash += slateAsh(t)), (ses().ash += slateAsh(t)), a)
    : (S.slates.push(t), "bag");
}
function rollKillDrops(t) {
  const a = [],
    s = slateQty();
  return (
    (t || RAND() < 0.16 * s) && a.push(t ? { rw: [30, 40, 24, 6] } : {}),
    t && RAND() < 0.5 * s && a.push({}),
    a
  );
}
function rollMats(t, a, s) {
  const e = [];
  if (!S.alchOn) return e;
  for (let n = 0, l = a ? 2 : RAND() < (s ? 0.12 : 0.008) ? 1 : 0; n < l; n++)
    e.push("x" + matLv(t, 4));
  if (
    ((a || RAND() < (s ? 0.08 : 0.005)) && e.push("i" + matLv(t, 3)),
    (a || s) && RAND() < (a ? 0.6 : 0.15) && e.push("p1"),
    a && t >= 50 && RAND() < 0.25 && e.push("p2"),
    t >= 83)
  ) {
    const n = endF(t);
    (RAND() < (a ? 1 : (s ? 0.04 : 0.004) * n) && e.push("r1"),
      RAND() < (a ? 0.3 : s ? 0.015 : 0.0015) * n && e.push("s1"));
  }
  return e;
}
function dropMats(t) {
  for (const a of rollMats(t.lv, t.boss, t.elite)) dropMat(t, a);
  S.alchOn &&
    !t.boss &&
    !t.elite &&
    t.lv >= 83 &&
    RAND() < I4_P * (slatesOn().length ? slateRwMul() : 1) &&
    dropMat(t, "i4");
}
function dropMat(t, a) {
  const s = MATS[a];
  dropLoot(t, { mat: a, col: MAT_COL[s.f], tier: Math.min(3, s.l) });
}
function slateResonate(t) {
  if (!t.uq && !t.sock && t.af.length)
    for (const a of slateKeys("rz_")) {
      const s = a.slice(3);
      !AFFIX[s].s.includes(t.slot) ||
        t.af.some((t) => t.a === s) ||
        100 * RAND() >= slateSum(a) ||
        (t.af[ri(0, t.af.length - 1)] = rollAffix(s, rollTier(s, t.ilvl)));
    }
}
function slateUp(t) {
  if (t.uq || t.sock || t.sl) return;
  t.rar < 3 &&
    slateSum("sl_rup") &&
    100 * RAND() < slateSum("sl_rup") &&
    (t.rar++, addAffixes(t, ri(...RAR_AFFIX[t.rar]) - t.af.length));
  const a = t.af.filter((t) => t.t > 1);
  if (a.length && slateSum("sl_tup") && 100 * RAND() < slateSum("sl_tup")) {
    const t = a[ri(0, a.length - 1)];
    Object.assign(t, rollAffix(t.a, t.t - 1));
  }
}
function rollItem(t, a) {
  const s = Object.assign({}, a),
    e = slatesOn().length ? slateRwMul() : 1;
  e > 1 && (s.dgr = e);
  const n = s.off || t < 83 ? [] : mythKeys();
  if (n.length && RAND() < mythP(n) * e) {
    const a = mythPick(n);
    if ("slate" === a) return [makeMythSlate(Math.max(t, 90))];
    ((s.uniq = 1), (s.uqk = a));
  }
  (!s.uniq && RAND() < UQ_P * e && (s.uniq = 1),
    !s.uniq && t >= 75 && RAND() < 0.001 * e && (s.sock = 1),
    s.uniq ||
      s.sock ||
      s.slot ||
      !slateKeys("rs_").length ||
      (s.slot = pickW(
        SLOTS,
        (t) => slotW(t) * (1 + slateSum("rs_" + t) / 100),
      )),
    !ssMap() || G.tw || G.arena || (s.ss = 1));
  const l = [makeItem(t, s)];
  return (
    slateUp(l[0]),
    slateResonate(l[0]),
    s.ss && ssDivine(l[0]),
    tal("dropX") &&
      (!a || !a.extra) &&
      RAND() < tal("dropX") &&
      l.push(...rollItem(t, Object.assign({}, a, { extra: 1 }))),
    l
  );
}
function dropItem(t, a) {
  for (const s of rollItem(t.lv, a))
    dropLoot(
      t,
      s.sl
        ? { sl: s, col: rarColor(s), tier: 3 }
        : { it: s, col: rarColor(s), tier: rarTier(s) },
    );
}
function gainXp(t) {
  if (S.lvl >= LV_CAP) return;
  ((S.xp += t), (G.rate.x[G.rate.i] += t), (ses().xp += t));
  let a = !1;
  const s = openCount();
  for (; S.lvl < LV_CAP && S.xp >= xpNeed(S.lvl);)
    ((S.xp -= xpNeed(S.lvl)), S.lvl++, (a = !0));
  if (a) {
    (recalc(),
      (S.hp = PS.maxhp),
      toast(
        `升級！等級 ${S.lvl}` +
          (openCount() > s ? `・技能格 ${openCount()} 格` : ""),
        "lvl",
      ));
    const t = G.pl;
    G.flashes.push({ x: t.x, y: t.y - 6, t: 0, ring: 1, c: "#ffd84a" });
    for (let a = 0; a < 26; a++)
      G.parts.push({
        x: t.x + rf(-8, 8),
        y: t.y,
        z: rf(0, 6),
        vx: rf(-10, 10),
        vy: 0,
        vz: rf(60, 130),
        g: -20,
        life: rf(0.6, 1.1),
        c: RAND() < 0.5 ? "#ffd84a" : "#fff6c0",
        s: 1,
        glow: 1,
      });
    (sfx("lvl"),
      G.nums.push({
        x: t.x,
        y: t.y - 26,
        txt: "LEVEL UP!",
        col: "#ffd84a",
        t: 0,
        big: 1,
      }),
      (S.lvl <= 20 || S.lvl % 5 == 0) && stEv("lv"),
      quest("level", 0),
      markDirty(),
      ui.refreshIf("skill", "char"));
  }
}
function damagePlayer(t, a, s, e, n) {
  if (G.dead) return;
  const l = G.pl;
  if (fire("hurtPre", t, e, n)) return;
  const o = Math.min(75, PS.dodge),
    r = l.dgLk;
  if (((l.dgLk = 0), 100 * RAND() < o || (r && 100 * RAND() < o)))
    return (
      num(l.x, l.y - 22, "MISS", "#c8d0e0"),
      sfx("miss"),
      void fire("dodge")
    );
  let i = fold(HURT_MUL, t, e);
  if (l.shd > 0) {
    const a = Math.min(l.shd, i);
    if (((l.shd -= a), (i -= a), num(l.x, l.y - 28, a, "#9ad8ff"), i <= 0))
      return ((l.hurt = 0.12), void fire("hurt", t, 0));
  }
  if (
    ((S.hp -= i),
    (l.hurt = 0.22),
    dlogHit(e, i, n),
    hasAf(e, "leech") && alive(e))
  ) {
    const t = e.max * ELITE_AF.leech.h;
    ((e.hp = Math.min(e.max, e.hp + t)),
      num(e.x, e.y - e.h - 4, "+" + fmt(t), "#7dffc8"));
  }
  if (!(null == a || (e && e.nk))) {
    const t = Math.atan2(l.y - s, l.x - a);
    ((l.vx += 30 * Math.cos(t)), (l.vy += 18 * Math.sin(t)));
  }
  (num(l.x, l.y - 22, i, "#ff5a6a"),
    sfx("hurt"),
    burst(l.x, l.y, 4, ["#ff5a6a", "#ffffff"], 70, { z: 8, life: 0.4 }),
    fire("hurt", t, i),
    S.hp <= 0 && hpOut());
}
const DL_T = 8,
  DL_SHOW = 40;
function dlogHit(t, a, s) {
  const e = (G.dlog ||= []);
  for (
    e.push({
      t: G.t,
      n: t && MON[t.type] ? MON[t.type].n : "場地效果",
      tag: t ? (t.boss ? "Boss" : t.elite ? "菁英" : "") : "",
      k: 1 === s ? "近戰" : 0 === s ? "範圍攻擊" : "投射物",
      d: a,
      hp: Math.max(0, S.hp),
    });
    e.length && G.t - e[0].t > DL_T;
  )
    e.shift();
}
function addShd(t, a) {
  const s = G.pl;
  s.shd = Math.min(a, (s.shd || 0) + t);
}
function hpOut() {
  G.dead || fire("lethal") || die();
}
function die() {
  ((S.hp = 0),
    (G.dead = 10 * (1 - PS.revive / 100)),
    G.trn || (ses().die++, (S.st.die[S.map] = (S.st.die[S.map] || 0) + 1)),
    sfx("die"),
    (G.dl = {
      at: G.t,
      hits: (G.dlog || []).filter((t) => G.t - t.t <= DL_T),
      mhp: PS.maxhp,
      arm: PS.armRed,
      dg: PS.dodge,
    }),
    (G.dlog = []));
  const t = G.pl;
  ((t.sus = {}),
    (t.stk = {}),
    burst(
      t.x,
      t.y,
      28,
      ["#f2c29b", "#ffffff", HERO_PAL[S.cls].b, HERO_PAL[S.cls].h],
      100,
      { z: 8 },
    ),
    toast(`陣亡，${G.dead.toFixed(1)} 秒後原地復活`, "bad"),
    G.boss && failBoss("挑戰失敗：角色陣亡"),
    G.tw && twEnd("角色陣亡"),
    (G.proj = G.proj.filter((t) => !t.enemy)),
    (t.anim = null));
}
const agOn = (t) => !(!S.set.agb || !S.set.agb[t]),
  agAny = () => !(!S.set.agb || !S.set.agb.some(Boolean)),
  AB_WAIT = 120,
  AG_GAP = 3,
  inFight = () => !(!G.boss && !G.tw),
  canStart = () => !G.boss && !G.tw && !G.dead,
  canStartA = () => canStart() && !G.arena,
  abReady = () =>
    !G.trn &&
    S.hp >= Math.min((PS.maxhp * (S.set.abh || 80)) / 100, 0.999 * hpCap());
function startBoss(t) {
  if (!canStart() || !bossReady()) return;
  const a = curMap();
  if (a.ss) {
    if (
      (null == t && (t = S.ssf.indexOf(Math.max(...S.ssf))),
      !(S.ssf[t] >= SS.fragN))
    )
      return;
    ((S.ssf[t] -= SS.fragN), markDirty(), ui.refreshIf("map"), ui.hud(!0));
  }
  G.mobs = G.mobs.filter((t) => dist(t, G.pl) > 30).slice(0, 3);
  const s = G.pl.x < G.W / 2 ? G.W - 30 : 30,
    e = a.ss ? GODS[t] : null;
  ((G.boss = addMob(e ? e.bt : a.bt, mapLv()[1], s, (G.top + G.H) / 2, {
    boss: 1,
    sl: 1,
  })),
    (G.boss.spawnT = 1),
    (G.boss.spd *= BOSS_SK.spd / 0.8),
    (G.boss.bs = {
      t: BOSS_SK.first,
      i: 0,
      ks: e ? e.ks : BOSS_SKS[a.bt] || ["slam", "mark"],
    }),
    (G.bn = e ? e.bn : null),
    e &&
      ((G.boss.god = GODS.indexOf(e)),
      (G.boss.max *= SS.bhp),
      (G.boss.hp = G.boss.max),
      (G.boss.dmg *= SS.bdmg),
      (G.boss.bcd = SS.bcd),
      (G.boss.am = 0.75)),
    (G.bossT = 90),
    G.flashes.push({ x: s, y: G.boss.y - 10, t: 0, ring: 1, c: "#e0445a" }),
    shake(0.25),
    sfx("boss"),
    toast(`Boss 出現：${G.bn || a.boss}（限時 90 秒）`, "bad"),
    ui.hud(!0));
}
const canFinal = () => S.gd.f.every((t) => t > 0),
  canMonarch = () => S.tw.mk >= MONARCH.mk,
  agPick = () =>
    canMonarch() && agOn(4)
      ? 4
      : canFinal() && agOn(GUARD.length)
        ? GUARD.length
        : S.gd.t.findIndex((t, a) => t > 0 && agOn(a));
function startGuard(t) {
  const a = gdef(t),
    s = 4 === t,
    e = t === GUARD.length || s;
  if (!canStart() || !(s ? canMonarch() : e ? canFinal() : S.gd.t[t] > 0))
    return;
  s
    ? (S.tw.mk -= MONARCH.mk)
    : e
      ? (S.gd.f = S.gd.f.map((t) => t - 1))
      : S.gd.t[t]--;
  const n = enterArena(garena(t));
  ((G.boss = addMob(a.bt, 90, n, (G.top + G.H) / 2, { boss: 1 })),
    (G.boss.hp = G.boss.max = G.boss.max * (s ? 9.25 : e ? 3.7 : 2.6)),
    (G.boss.dmg *= s ? MON_DMG : e ? 1.6 : 1.5),
    (G.boss.spawnT = 1),
    (G.boss.am = 0.75),
    (G.boss.gm = {
      t: 3,
      slam: 0,
      sh: 0,
      st: 0,
      mech: a.mech,
      ph: -1,
      kt: GD_SK.first,
      ki: 0,
    }),
    (G.guard = t),
    (G.bossT = s ? 270 : e ? 210 : 140),
    G.flashes.push({ x: n, y: G.boss.y - 10, t: 0, ring: 1, c: a.c }),
    shake(0.3),
    sfx("boss"),
    toast(`${a.n}出現（限時 ${G.bossT} 秒）`, "bad"),
    markDirty(),
    ui.hud(!0),
    ui.refreshIf("map"));
}
function finMech(t, a, s) {
  const e = 4 === G.guard,
    n = gdef(G.guard),
    l = t.hp / t.max,
    o = Math.max(
      a.ph,
      e
        ? Math.min(3, Math.floor(4 * (1 - l)))
        : t.hp > (2 * t.max) / 3
          ? 0
          : t.hp > t.max / 3
            ? 1
            : 2,
    );
  return (
    o !== a.ph &&
      (a.ph >= 0 &&
        (toast(`${n.n}・第 ${o + 1} 階段${3 === o ? "・狂怒" : ""}`, "bad"),
        shake(0.3),
        sfx("boss"),
        G.flashes.push({ x: t.x, y: t.y - 12, t: 0, ring: 1, c: n.c })),
      Object.assign(a, {
        ph: o,
        t: 2,
        sh: 0,
        slam: 0,
        on: !1,
        rk: 0,
        rt: MONARCH.rt,
      }),
      3 === o &&
        ((t.dmg *= MONARCH.rd),
        (a.enr = 1),
        (t.spd *= BOSS_SK.es),
        (t.am = (t.am || 1) * BOSS_SK.ea))),
    3 === o
      ? ((a.rt -= s),
        a.rt <= 0 &&
          !(a.slam > 0) &&
          ((a.rt = MONARCH.rt),
          (a.rk = (a.rk + 1) % 3),
          (a.t = Math.min(a.t, 1))),
        ["slam", "adds", "shield"][a.rk])
      : ["shield", "slam", "adds"][o]
  );
}
function guardTick(t, a) {
  const s = t.gm,
    e = s.mech || finMech(t, s, a),
    n = gdef(G.guard);
  if (!(t.spawnT > 0 || t.frz > 0))
    if (
      (!s.enr &&
        t.hp < t.max * BOSS_SK.enr &&
        4 !== G.guard &&
        ((s.enr = 1),
        (t.spd *= BOSS_SK.es),
        (t.am = (t.am || 1) * BOSS_SK.ea),
        G.flashes.push({
          x: t.x,
          y: t.y - 0.5 * t.h,
          t: 0,
          ring: 1,
          c: "#ff3a2a",
        }),
        shake(0.25),
        sfx("boss"),
        toast(`${n.n}進入狂怒！`, "bad")),
      !((s.kt -= a) <= 0) ||
        t.hold > 0 ||
        t.dash ||
        G.dead ||
        s.slam > 0 ||
        ((s.kt = (n.cd || GD_SK.cd) * (s.enr ? 0.7 : 1)),
        castBossSk(t, n.ks[s.ki++ % n.ks.length], t.dmg * (n.k || GD_SK.k))),
      (s.t -= a),
      "adds" === e)
    ) {
      if (s.t <= 0) {
        s.t = GUARD_ADD.cd;
        const a = curMap().m;
        if (G.mobs.filter((t) => t.add).length >= GUARD_ADD.max) return;
        for (let s = 0; s < GUARD_ADD.n; s++) {
          const e = (s / GUARD_ADD.n) * 6.283 + rf(0, 1),
            n = addMob(
              a[s % a.length],
              90,
              t.x + 18 * Math.cos(e),
              t.y + 12 * Math.sin(e),
            );
          (inArena(n), (n.ag = !0), (n.add = 1));
        }
        (G.flashes.push({
          x: t.x,
          y: t.y - 10,
          t: 0,
          ring: 1,
          c: gdef(G.guard).c,
        }),
          sfx("boss"));
      }
      s.on = G.mobs.some((t) => t.add);
    } else if ("slam" === e)
      s.slam > 0
        ? ((s.slam -= a),
          s.slam <= 0 &&
            (shake(0.35),
            hitStop(0.08),
            sfx("big"),
            burst(s.x, s.y, 30, ["#ff8a3a", "#ffd040", "#4a3a3a"], 120, {
              z: 2,
            }),
            G.flashes.push({ x: s.x, y: s.y, t: 0, ring: 1, c: "#ff5a3a" }),
            Math.hypot(G.pl.x - s.x, 1.4 * (G.pl.y - s.y)) <= GUARD_SLAM.r &&
              damagePlayer(t.dmg * GUARD_SLAM.k, s.x, s.y, t, 0)))
        : s.t <= 0 &&
          ((s.t = GUARD_SLAM.cd),
          (s.slam = GUARD_SLAM.t),
          (s.x = t.x),
          (s.y = t.y));
    else if (s.sh > 0) {
      if (((s.st -= a), s.st <= 0)) {
        const a = s.sh * GUARD_SH.h;
        ((t.hp = Math.min(t.max, t.hp + a)),
          (s.sh = 0),
          num(t.x, t.y - t.h - 4, "+" + fmt(a), "#7dffc8"),
          toast(`${gdef(G.guard).n}回復生命`, "bad"));
      }
    } else
      s.t <= 0 &&
        ((s.t = GUARD_SH.cd),
        (s.sh = s.shm = t.max * GUARD_SH.v),
        (s.st = GUARD_SH.t),
        G.flashes.push({
          x: t.x,
          y: t.y - 12,
          t: 0,
          ring: 1,
          c: gdef(G.guard).c,
        }),
        sfx("boss"));
}
function guardTake(t, a) {
  const s = t.gm;
  if ((s.on && (a *= 1 - GUARD_ADD.dr), s.sh > 0)) {
    const e = Math.min(s.sh, a);
    ((s.sh -= e),
      (a -= e),
      num(t.x, t.y - t.h - 4, e, "#9ab0ff"),
      s.sh <= 0 &&
        ((s.sh = 0),
        burst(t.x, t.y, 16, ["#9ab0ff", "#ffffff"], 110, {
          z: 0.5 * t.h,
          glow: 1,
        }),
        sfx("big")));
  }
  return a;
}
function guardWin(t) {
  const a = G.guard,
    s = gdef(a);
  if (a === GUARD.length) return finalWin(t);
  if (4 === a) return monarchWin(t);
  (stBoss(1),
    (G.guard = null),
    (G.boss = null),
    S.gd.w[a]++,
    ses().boss++,
    arenaOut(5),
    (G.agT = G.t + AG_GAP));
  for (const t of G.mobs) t.add = 0;
  dropLoot(t, { fr: a, col: s.c, tier: 3 });
  for (let a = 0, s = RAND() < 0.5 ? 2 : 1; a < s; a++) dropMat(t, "s1");
  for (let a = 0; a < 2; a++) dropItem(t, { rw: [0, 20, 50, 30] });
  (RAND() < 0.15 && dropItem(t, { uniq: 1, uqk: s.uq, extra: 1 }),
    sfx("win"),
    toast(`擊敗${s.n}！`, "lvl"),
    markDirty(),
    ui.hud(!0),
    ui.refreshIf("map"));
}
function finalWin(t) {
  (stBoss(1),
    (G.guard = null),
    (G.boss = null),
    ses().boss++,
    arenaOut(5),
    (G.agT = G.t + AG_GAP));
  for (const t of G.mobs) t.add = 0;
  const a = !S.gd.e;
  S.gd.e++;
  for (const a of ["s1", "s1", "r1", "r1"]) dropMat(t, a);
  for (let a = 0; a < 3; a++) dropItem(t, { rw: [0, 10, 50, 40] });
  (RAND() < 0.2 &&
    dropItem(t, {
      uniq: 1,
      uqk: FINAL.uq[ri(0, FINAL.uq.length - 1)],
      extra: 1,
    }),
    RAND() < SSL.fin &&
      dropLoot(t, { sl: makeSockSlate(90), col: SOCK_COL, tier: 3 }),
    sfx("win"),
    shake(0.4),
    toast(`擊敗${FINAL.n}！`, "lvl"),
    a && ((S.title = FINAL.title), later(2, () => ui.ending())),
    markDirty(),
    ui.hud(!0),
    ui.refreshIf("map", "char"));
}
function monarchWin(t) {
  (stBoss(1),
    (G.guard = null),
    (G.boss = null),
    ses().boss++,
    arenaOut(5),
    (G.agT = G.t + AG_GAP));
  for (const t of G.mobs) t.add = 0;
  const a = !S.gd.m;
  S.gd.m++;
  const s = makeItem(90, { rar: 4 });
  if ((dropLoot(t, { it: s, col: rarColor(s), tier: 4 }), RAND() < 0.001)) {
    const a = mythKeys(),
      s = mythPick(a);
    if ("slate" === s) {
      const a = makeMythSlate(90);
      dropLoot(t, { sl: a, col: rarColor(a), tier: 3 });
    } else dropItem(t, { uniq: 1, uqk: s, extra: 1 });
  }
  RAND() < 0.35 && dropMat(t, "m1");
  for (let a = 0; a < MON_MAT.n; a++)
    dropMat(
      t,
      pickW(Object.keys(MON_MAT.w), (t) => MON_MAT.w[t]),
    );
  (sfx("win"),
    shake(0.4),
    toast(`擊敗${MONARCH.n}！`, "lvl"),
    a &&
      ((S.title = MONARCH.title),
      toast(`獲得稱號「${MONARCH.title}」`, "r4", 1)),
    markDirty(),
    ui.hud(!0),
    ui.refreshIf("map", "char"));
}
function enterArena(t) {
  for (const t of G.drops) pickup(t);
  Object.assign(G, {
    mobs: [],
    proj: [],
    drops: [],
    fx: [],
    orbs: [],
    turs: [],
    saps: [],
    orbit: [],
    haz: [],
    ground: null,
    arena: { ar: t, out: 0, ask: 0 },
    trn: null,
  });
  const a = G.pl;
  return (
    (a.tgt = null),
    (a.leap = null),
    (a.z = 0),
    (a.x = Math.round(0.3 * G.W)),
    (a.y = Math.round((G.top + G.H) / 2)),
    (a.vx = a.vy = 0),
    G.flashes.push({ x: a.x, y: a.y - 7, t: 0, ring: 1, c: t.v.ring }),
    G.W - 36
  );
}
function leaveArena() {
  if (!G.arena) return;
  (G.boss && failBoss("挑戰失敗：已離開場地"),
    G.tw && (twEnd("已離開"), (G.atT = G.t + AB_WAIT)));
  for (const t of G.drops) pickup(t);
  Object.assign(G, {
    mobs: [],
    proj: [],
    drops: [],
    fx: [],
    orbs: [],
    turs: [],
    saps: [],
    orbit: [],
    haz: [],
    ground: null,
    arena: null,
    trn: null,
  });
  const t = G.pl;
  ((t.tgt = null),
    (t.x = G.W / 2),
    (t.y = (G.top + G.H) / 2),
    (t.vx = t.vy = 0),
    G.flashes.push({ x: t.x, y: t.y - 7, t: 0, ring: 1, c: "#7dffc8" }),
    ui.hud(!0),
    ui.refreshIf("map"));
}
function trnStart() {
  canStartA() &&
    (enterArena(ARENA.dummy),
    (G.arena.out = 1e9),
    (G.trn = trnNew()),
    trnFill(),
    ui.hud(!0),
    ui.refreshIf("map"));
}
function trnSpawn(t) {
  const a = S.trn,
    s = TRN.n[a.n],
    e = Math.floor(t / 3),
    n = Math.min(3, s - 3 * e),
    l = Math.ceil(s / 3),
    o = Math.round(0.74 * G.W + 22 * ((t % 3) - (n - 1) / 2)),
    r = Math.round((G.top + G.H) / 2 + 28 * (e - (l - 1) / 2)),
    i = addMob("dummy", S.lvl, o, r, {
      boss: 2 === a.t,
      elite: 1 === a.t,
      noAf: 1,
    });
  (a.m || (i.hp = i.max = 1e15),
    (i.dmg =
      monDmg(S.lvl) * TRN.dmg * (1 === a.t ? 1.5 : 1) * (2 === a.t ? 2.2 : 1)),
    Object.assign(i, { dm: t + 1, hx: o, hy: r, ag: !1, spawnT: 0.3 }));
}
function trnShoot(t, a, s) {
  ((t.atk -= s),
    (t.face = a.x < t.x ? -1 : 1),
    t.atk > 0 ||
      ((t.atk = t.boss ? 1.6 : 1.3),
      (t.lunge = 0.2),
      later(0.1, () => {
        alive(t) &&
          !G.dead &&
          roPushFx(G.proj,{
            k: "ebolt",
            enemy: 1,
            x: t.x,
            y: t.y - 0.6 * t.h,
            tgt: a,
            spd: 75,
            dmg: t.dmg,
            col: t.boss ? "#ff60ff" : "#7ad4ff",
            src: t,
          });
      })));
}
function trnFill() {
  for (let t = 0; t < TRN.n[S.trn.n]; t++)
    G.mobs.some((a) => a.dm === t + 1) || trnSpawn(t);
}
function trnKill() {
  (G.trn.k++,
    later(TRN.r[S.trn.r] || 0.05, () => {
      G.trn && trnFill();
    }));
}
function trnSet(t, a) {
  ((S.trn[t] = a), markDirty(), G.trn && trnReset());
}
function trnReset() {
  ((G.mobs.length = 0),
    (G.later.length = 0),
    (G.proj.length = 0),
    (G.fx.length = 0),
    (G.pl.tgt = null),
    (G.trn = trnNew()),
    trnFill());
}
const trnNew = () => ({ t0: G.t, s: {}, mu: {}, b: [], k: 0, d: 0 });
let TGI = null;
const trnSrc = (t) =>
    t.src ||
    (t.tg &&
      (TGI ||= new Map(
        Object.keys(SKILLS)
          .filter((t) => SKILLS[t].tg)
          .map((t) => [SKILLS[t].tg, t]),
      )).get(t.tg)) ||
    (t.min ? "min" : t.skill ? "oth" : "basic"),
  trnRow = (t) => (G.trn.s[t] ||= { d: 0, n: 0, c: 0, cf: 0 });
function trnHit(t, a, s) {
  const e = trnSrc(t),
    n = trnRow(e);
  return (n.n++, a && (n.c++, (n.cf += s)), e);
}
function trnDmg(t, a) {
  const s = G.trn,
    e = Math.floor(G.t);
  ((trnRow(t).d += a),
    (s.d += a),
    (s.b.length && s.b.at(-1)[0] === e) ||
      (s.b.push([e, 0]), s.b.length > 11 && s.b.shift()),
    (s.b.at(-1)[1] += a));
}
function trnMul(t, a, s, e, n) {
  const l = G.trn.mu;
  for (let o = 0; o < t.length; o++) {
    const r = s;
    s = t[o](s, e, n);
    const i = r ? s / r : 1,
      c = (l[a[o]] ||= { n: 0, t: 0, f: 0 });
    (c.n++, (c.f += i), 1 !== i && c.t++);
  }
  return s;
}
function trnDps() {
  const t = G.trn,
    a = G.t - t.t0,
    s = Math.floor(G.t) - 9,
    e = Math.min(a, G.t - s),
    n = t.b.reduce((t, a) => t + (a[0] >= s ? a[1] : 0), 0);
  return { el: a, all: a > 0.5 ? t.d / a : 0, rec: e > 0.5 ? n / e : 0 };
}
function startTrial(t) {
  const a = TRIAL[t];
  if (!a || !canStart() || S.lvl < a.lv || t !== S.tal.tr) return;
  const s = enterArena(ARENA.trial);
  ((G.boss = addMob(a.bt, a.lv, s, (G.top + G.H) / 2, { boss: 1 })),
    (G.boss.hp = G.boss.max = 1.5 * G.boss.max),
    (G.boss.spawnT = 1),
    (G.trial = t),
    (G.bossT = 120),
    G.flashes.push({ x: s, y: G.boss.y - 10, t: 0, ring: 1, c: "#ffd84a" }),
    shake(0.25),
    sfx("boss"),
    toast(`${a.n}開始：擊敗${a.boss}（限時 120 秒）`, "bad"),
    ui.hud(!0),
    ui.refreshIf("map"));
}
function trialWin() {
  const t = G.trial,
    a = TRIAL[t];
  (stBoss(1),
    (G.trial = null),
    (G.boss = null),
    arenaOut(5),
    (S.tal.tr = t + 1),
    (S.tal.n += 2),
    ses().boss++,
    sfx("win"),
    toast(`完成${a.n}！獲得 2 點天賦點`, "lvl"),
    quest("trial", 0),
    ui.badge("char", 1),
    S.tal.asc || later(1, () => ui.ascPick()),
    markDirty(),
    ui.hud(!0),
    ui.refreshIf("map"));
}
const arenaOut = (t) => {
    G.arena && (G.arena.out = t);
  },
  twOpen = () => S.gd.e > 0,
  twFrom = () => {
    const t = twCheck(S.tw.best),
      a = S.set.twf ?? (2 === S.set.atf ? 1 : 0);
    return a > 0 && a < t ? a : t;
  };
function twStart(t) {
  if (twOpen() && canStart()) {
    ((t = Math.max(1, Math.min(t || 1, twCheck(S.tw.best)))),
      enterArena(ARENA.tw),
      (G.arena.out = 1e9),
      (G.tw = { f: 0, r: {}, rl: [], t: 0, rest: 0, ch: S.set.twc ? 1 : 0 }));
    for (let a = 1; 10 * a < t; a++) twRule(a);
    (S.tw.runs++, recalc(), twFloor(t), markDirty(), ui.refreshIf("map"));
  }
}
function twRule(t) {
  const a = G.tw,
    s = a.rl.map((t) => t.a),
    e = TW_RULES.filter((t) => !s.includes(t)),
    n = e.length ? e : TW_RULES.filter((t) => tierN(t) > 1),
    l = n[ri(0, n.length - 1)],
    o = rollAffix(l, Math.max(1, tierN(l) - t + 1)),
    r = a.rl.find((t) => t.a === l);
  (r ? (r.v += o.v) : a.rl.push(o), (a.r[l] = (a.r[l] || 0) + o.v), (a.nr = t));
}
function twFloor(t) {
  const a = G.tw;
  if (!a) return;
  t > 1 &&
    (t - 1) % 10 == 0 &&
    (t - 1) / 10 > (a.nr || 0) &&
    (twRule((t - 1) / 10), recalc(), toast("無盡之塔：規則增加", "bad"));
  const s = a.ch ? TW.ct : TW.t + (t % TW.boss === 0 ? TW.bt : 0);
  (Object.assign(a, {
    f: t,
    k: 0,
    sp: 0,
    need: twK(t),
    boss: t % TW.boss === 0,
    bs: null,
    bd: !1,
    t: s,
    t0: s,
    dd: 0,
    rest: 0,
    mi: (t - 1) % MAP_N,
  }),
    G.flashes.push({
      x: G.pl.x,
      y: G.pl.y - 7,
      t: 0,
      ring: 1,
      c: ARENA.tw.v.ring,
    }),
    toast(`無盡之塔・第 ${t} 層${a.boss ? "（王層）" : ""}`, "lvl"),
    ui.hud(!0));
}
function twMob(t, a, s, e) {
  const n = addMob(t, TW.lv, a, s, { sl: 1, boss: e });
  return (
    inArena(n),
    e &&
      ((n.spawnT = 1),
      (n.spd *= BOSS_SK.spd / 0.8),
      (n.bs = { t: BOSS_SK.first, i: 0, ks: BOSS_SKS[t] || ["slam", "mark"] })),
    n
  );
}
function twScale(t) {
  const a = G.tw.f,
    s = Math.pow(TW.hp, a - 1) * (t.boss ? TW.bhp : 1);
  ((t.hp = t.max = t.max * s),
    t.sh && (t.sh = t.shm = t.shm * s),
    (t.dmg *= Math.pow(TW.dmg, a - 1)),
    (t.ag = !0),
    (t.tw = t.boss ? 2 : 1));
}
function twTick(t) {
  const a = G.tw;
  if (!a || G.dead) return;
  if (a.rest > 0) return void ((a.rest -= t) <= 0 && twFloor(a.f + 1));
  if ((a.t -= t) <= 0) return twEnd("時間到");
  const s = MAPS[a.mi],
    e = G.mobs.filter((t) => 1 === t.tw).length;
  if (a.sp < a.need && e < TW.cap) {
    const t = G.pl;
    let e,
      n,
      l = 0;
    do {
      ((e = rf(12, G.W - 12)), (n = rf(G.top + 10, G.H - 8)));
    } while (Math.hypot(e - t.x, n - t.y) < 40 && ++l < 20);
    const o = s.m[ri(0, s.m.length - 1)];
    for (let t = 0, s = Math.min(ri(1, 3), a.need - a.sp); t < s; t++, a.sp++)
      twMob(o, e + rf(-10, 10), n + rf(-8, 8));
    a.r.sl_rx &&
      a.sp < a.need &&
      (twMob(s.rx || "wisp", e + rf(-14, 14), n + rf(-10, 10)), a.sp++);
  }
  a.boss &&
    !a.bs &&
    a.k >= a.need &&
    ((a.bs = twMob(
      s.bt,
      G.pl.x < G.W / 2 ? G.W - 30 : 30,
      (G.top + G.H) / 2,
      1,
    )),
    shake(0.25),
    sfx("boss"),
    (a.bs.bn = s.boss),
    toast(`王層：${s.boss}`, "bad"));
}
function twKill(t) {
  const a = G.tw;
  (S.total++, G.minK++, G.rate.k[G.rate.i]++, ses().k++, quest("kill", 1));
  const s = 1 + 0.25 * a.rl.length;
  if (2 === t.tw) {
    for (let a = 0; a < 2; a++) dropItem(t, { rw: [0, 30, 50, 20] });
    (RAND() < 0.15 && dropItem(t, { uniq: 1 }),
      a &&
        RAND() < MK_P(a.f) &&
        dropLoot(t, { mk: 1, col: MONARCH.c, tier: 3 }));
  } else
    ((RAND() < Math.min(1, (t.elite ? 0.35 : 0.05) * s)) &&
      dropItem(t, t.elite ? { rw: [30, 40, 24, 6] } : {}),
      t.elite && RAND() < Math.min(1, 0.08 * s) && dropItem(t, {}));
  (dropMats(t),
    a &&
      (2 === t.tw ? (a.bd = !0) : a.k++,
      a.k >= a.need && (!a.boss || a.bd) && !a.rest && twClear(t)));
}
function twClear(t) {
  const a = G.tw,
    s = a.f;
  if (
    (s > S.tw.best &&
      ((S.tw.best = s),
      (S.tw.bd = Math.round(a.dd / Math.max(1, a.t0 - a.t))),
      (a.rec = 1)),
    RAND() < twC(s) && dropMat(t, "c1"),
    a.boss && RAND() < TW.cb && dropMat(t, "c1"),
    RAND() < twH(s) && dropMat(t, "h1"),
    a.boss && RAND() < TW_HB && dropMat(t, "h1"),
    RAND() < MK_FL(s) && dropLoot(t, { mk: 1, col: MONARCH.c, tier: 3 }),
    s % 10 == 0 && s > S.tw.ms)
  ) {
    S.tw.ms = s;
    const a = TW_MS(s);
    for (const s in a) for (let e = 0; e < Math.floor(a[s]); e++) dropMat(t, s);
    toast(`首次通過第 ${s} 層！`, "r3");
  }
  (heal(PS.maxhp * TW.heal),
    (a.rest = TW.rest),
    sfx("win"),
    markDirty(),
    ui.hud(!0),
    ui.refreshIf("map"));
}
function twEnd(t) {
  const a = G.tw;
  a &&
    (stEv("tw", { f: a.f, d: G.dead > 0 ? 1 : 0 }),
    (G.tw = null),
    (G.mobs = G.mobs.filter((t) => !t.tw)),
    recalc(),
    arenaOut(TW.out),
    a.rec && lbRec(),
    toast(`無盡之塔結束：${t}・第 ${a.f} 層`, "bad"),
    sfx("die"),
    markDirty(),
    lbSend(),
    ui.hud(!0),
    ui.refreshIf("map"));
}
function failBoss(t) {
  (G.boss && stBoss(0, G.dead > 0),
    null == G.trial && null == G.guard && (G.abT = G.t + AB_WAIT),
    null != G.guard && (G.agT = G.t + AB_WAIT),
    (G.trial = null),
    (G.guard = null),
    arenaOut(4));
  for (const t of G.mobs) t.add = 0;
  (alive(G.boss) && G.mobs.splice(G.mobs.indexOf(G.boss), 1),
    (G.boss = null),
    toast(t, "bad"),
    sfx("die"),
    ui.hud(!0));
}
function bossWin() {
  if (null != G.trial) return trialWin();
  (stBoss(1),
    (G.boss = null),
    (S.beat[S.map] = 1),
    (S.prog[S.map] = 0),
    ses().boss++,
    quest("boss", 1),
    sfx("win"),
    S.map >= 2 &&
      !S.alchOn &&
      ((S.alchOn = 1),
      ui.alchTab(),
      ui.badge("alch", 1),
      later(1.2, () =>
        toast("「煉金」已開放：萃取符文石、合成煉金材料", "rs"),
      )),
    S.unlocked === S.map &&
      S.map < MAP_N - 1 &&
      (S.unlocked++,
      stEv("map", {
        m: S.unlocked,
        pt: Math.round(S.mt.reduce((t, a) => t + (a || 0), 0)),
      }),
      toast(`新地圖解鎖：${MAPS[S.unlocked].n}`, "lvl")),
    toast(`擊敗 ${G.bn || curMap().boss}！`, "lvl"),
    markDirty(),
    ui.hud(!0),
    ui.refreshIf("map"));
}
const perMin = (t) =>
    (60 * t.reduce((t, a) => t + a, 0)) /
    Math.max(10, Math.min(60, G.rate.n + G.rate.t)),
  sesNew = () => ({
    m: S.map,
    t: 0,
    k: 0,
    xp: 0,
    lv: S.lvl,
    dr: [0, 0, 0, 0, 0, 0, 0],
    ash: 0,
    die: 0,
    boss: 0,
    off: 0,
  });
function ses() {
  return ((S.ses && S.ses.m === S.map) || (S.ses = sesNew()), S.ses);
}
function setMap(t) {
  if (!(t > S.unlocked) || (ssMap(t) && ssOpen())) {
    for (const t of G.drops) pickup(t);
    ((G.tw = null),
      (S.map = t),
      (S.ses = sesNew()),
      recalc(),
      Object.assign(G, {
        mobs: [],
        proj: [],
        drops: [],
        fx: [],
        later: [],
        orbs: [],
        turs: [],
        saps: [],
        orbit: [],
        haz: [],
        boss: null,
        trial: null,
        guard: null,
        ground: null,
        arena: null,
        trn: null,
        abT: 0,
        vort: [],
        und: [],
        souls: 0,
        jc: { m: null, n: 0 },
        dvj: { m: null, t: 0 },
        bn: null,
      }),
      (G.pl.tgt = null),
      (G.pl.leap = null),
      (G.pl.z = 0),
      (G.pl.x = G.W / 2),
      (G.pl.y = (G.top + G.H) / 2),
      ui.hud(!0),
      markDirty());
  }
}
function setFace(t) {
  const a = G.pl,
    s = Math.cos(t),
    e = Math.sin(t);
  ((a.face = t),
    Math.abs(s) > 0.8 * Math.abs(e)
      ? ((a.dir = "side"), (a.flip = s < 0))
      : ((a.dir = e > 0 ? "down" : "up"), (a.flip = s < 0)));
}
const aimAt = (t) => Math.atan2(t.y - 0.45 * t.h - (G.pl.y - 7), t.x - G.pl.x);
function handPos() {
  const t = G.pl;
  return [t.x + 5 * Math.cos(t.face), t.y - 7 + 3 * Math.sin(t.face)];
}
const FIST_FX = 8,
  fistFx = (t, a, s) =>
    G.fx.filter((t) => "fist" === t.k).length < 8 &&
    roPushFx(G.fx,{
      k: "fist",
      m: t,
      x: t.x,
      y: t.y,
      t: -a,
      d: a,
      life: 0.55,
      cl: s ? 1 : 0,
      r: PUNCH.r * PS.area * (1 + punchMods().area),
    });
function punch(t) {
  const a = G.pl,
    s = aimAt(t),
    e = punchMods(),
    n = clamp(0.7 / PS.aps, 0.12, 0.24);
  for (let a = 0; a <= e.extra; a++) fistFx(t, 0.4 * n + PUNCH.gap * a);
  (setFace(s),
    (a.anim = { k: "punch", t: 0, dur: n, a: s }),
    sfx("swing"),
    e.life && (S.hp = Math.max(1, S.hp - PS.maxhp * e.life)),
    later(0.4 * n, () => punchHit(t, 1, e)));
  for (let a = 0; a < e.extra; a++)
    later(0.4 * n + PUNCH.gap * (a + 1), () => punchHit(t, PUNCH.x, e));
}
function punchHit(t, a, s, e) {
  if (!alive(t) || dist(t, G.pl) > PS.range + 12) return;
  const n = PUNCH.r * PS.area * (1 + s.area),
    l = (uv("fist", 0) / 100) * (1 + s.dmg) * a,
    o = {
      crit: s.crit,
      critm: s.critm,
      pcap: PS.psnMax + s.pstk,
      kb: PUNCH.kb,
      src: e ? "uq:riftb" : void 0,
    };
  for (const a of mobsNear(t.x, t.y, n))
    hitMob(
      a,
      l,
      Object.assign(
        { stop: a === t ? 1 : 0, sx: e ? e[0] : G.pl.x, sy: e ? e[1] : G.pl.y },
        o,
      ),
    );
  (1 !== a || e || fire("basicHit", t),
    G.fx.filter((t) => t.pr).length < 8 &&
      roPushFx(G.fx,{
        k: "ring",
        pr: 1,
        x: t.x,
        y: t.y,
        r: n,
        t: 0,
        life: 0.25,
        col: e ? "#b48aff" : "#ffd0a0",
      }),
    burst(t.x, t.y, 8, ["#ffffff", "#ffd0a0", "#ffb347"], 90, {
      z: 0.45 * t.h,
      life: 0.3,
      glow: 1,
    }),
    burst(t.x, t.y, 10, ["#cfc2a0", "#8a7a60", "#5a4a3a"], 70, {
      z: 0,
      vz: 70,
      g: 260,
      life: 0.5,
    }),
    shake(1 === a ? 0.14 : 0.08),
    1 !== a || e || hitStop(0.05));
}
function basicAttack(t) {
  if (tal("punch")) return punch(t);
  const a = G.pl,
    s = aimAt(t);
  if ((setFace(s), "sword" === roArchetype(S.cls))) {
    a.combo = (a.combo % 3) + 1;
    const e = clamp(0.75 / PS.aps, 0.14, 0.26);
    ((a.anim = { k: "swing", t: 0, dur: e, a: s, combo: a.combo }),
      sfx("swing"),
      (a.vx += 4 * Math.cos(s)),
      (a.vy += 4 * Math.sin(s) * 0.55),
      later(0.3 * e, () => {
        !alive(t) ||
          dist(t, a) > PS.range + 12 ||
          (hitMob(t, 1, { kb: 3 === a.combo ? 40 : 14, stop: 1, ba: 1 }),
          fire("basicHit", t));
      }));
  } else
    "bow" === roArchetype(S.cls)
      ? ((a.anim = {
          k: "shoot",
          t: 0,
          dur: clamp(0.7 / PS.aps, 0.16, 0.3),
          a: s,
        }),
        later(0.55 * a.anim.dur, () => {
          if (!alive(t)) return;
          const [a, s] = handPos();
          (roPushFx(G.proj,{
            k: "arrow",
            x: a,
            y: s,
            tgt: t,
            spd: 190,
            mult: 1,
            kb: 40,
            ba: 1,
          }),
            sfx("shoot"));
        }))
      : ((a.anim = {
          k: "cast",
          t: 0,
          dur: clamp(0.8 / PS.aps, 0.18, 0.32),
          a: s,
        }),
        later(0.5 * a.anim.dur, () => {
          if (!alive(t)) return;
          const [a, s] = handPos();
          (roPushFx(G.proj,{
            k: "bolt",
            x: a,
            y: s - 5,
            tgt: t,
            spd: 140,
            mult: 1,
            kb: 35,
            ba: 1,
          }),
            sfx("bolt"));
        }));
}
const surge = () =>
  tal("surge") && Object.keys(G.pl.sus).length && susHot()
    ? 1 + tal("surge")
    : 1;
function riftAttack(t) {
  const a = G.pl;
  if (
    (RAND() < uv("riftb", 0) / 100 &&
      (a.clone > G.t ||
        (roPushFx(G.fx,{
          k: "ring",
          x: a.x,
          y: a.y - 3,
          r: 12,
          t: 0,
          life: 0.35,
          col: "#b48aff",
        }),
        sfx("summon")),
      (a.clone = G.t + uv("riftb", 1))),
    a.clone > G.t && tal("punch"))
  )
    for (let a = 0; a <= punchMods().extra; a++)
      fistFx(t, 0.12 + PUNCH.gap * a, 1);
  a.clone > G.t &&
    later(0.12, () => {
      if (!alive(t)) return;
      const a = cloneXY();
      if (
        (streak(
          { x: a[0], y: a[1] - 8 },
          { x: t.x, y: t.y - 0.5 * t.h },
          "#b48aff",
        ),
        !tal("punch"))
      )
        return hitMob(t, 1, { kb: 18, sx: a[0], sy: a[1], src: "uq:riftb" });
      const s = punchMods();
      punchHit(t, 1, s, a);
      for (let e = 0; e < s.extra; e++)
        later(PUNCH.gap * (e + 1), () => punchHit(t, PUNCH.x, s, a));
    });
}
const cloneXY = () => {
  const t = G.pl;
  return [Math.round(t.x + (t.flip ? 10 : -10)), Math.round(t.y - 2)];
};
function shock(t, a, s, e) {
  roPushFx(G.fx,{ k: "ring", x: t, y: a, r: s, t: 0, life: 0.3, col: "#ffd84a" });
  for (const n of mobsNear(t, a, s)) hitMob(n, e, { kb: 80, src: "uq:rift" });
}
function fan(t, a, s, e) {
  alive(a)
    ? ((s = Math.atan2(a.y - 0.45 * a.h - t.y, a.x - t.x)),
      roPushFx(G.proj,Object.assign({ tgt: a }, t)))
    : roPushFx(G.proj,
        Object.assign(
          {
            vx: Math.cos(s) * t.spd,
            vy: Math.sin(s) * t.spd,
            one: 1,
            life: (1.8 * PS.range) / t.spd,
          },
          t,
        ),
      );
  for (let a = 1; a <= e; a++) {
    const e = s + 0.22 * Math.ceil(a / 2) * (a % 2 ? 1 : -1);
    roPushFx(G.proj,
      Object.assign(
        {
          vx: Math.cos(e) * t.spd,
          vy: Math.sin(e) * t.spd,
          one: 1,
          life: (1.8 * PS.range) / t.spd,
        },
        t,
      ),
    );
  }
}
function projHit(t, a) {
  if ("fire" === t.k) {
    (hitMob(
      a,
      t.mult,
      Object.assign({ kb: t.kb, sx: t.x, sy: t.y + 6, stop: 1 }, t.o),
    ),
      roPushFx(G.fx,{ k: "boom", x: t.x, y: t.y + 4, r: t.r, t: 0, life: 0.3 }),
      burst(
        t.x,
        t.y + 6,
        16,
        ["#fff0a0", "#ffb347", "#ff6a3a", "#d8443a"],
        110,
        { z: 6, glow: 1 },
      ));
    for (const s of mobsNear(t.x, t.y + 4, t.r))
      s !== a &&
        hitMob(
          s,
          0.5 * t.mult,
          Object.assign({ kb: 60, sx: t.x, sy: t.y + 6 }, t.o),
        );
    shake(0.08);
  } else
    "exarrow" === t.k
      ? (hitMob(
          a,
          t.mult,
          Object.assign({ kb: 20, sx: t.x - 0.05 * t.vx, sy: t.y + 6 }, t.o),
        ),
        fuseAdd(a, t))
      : (hitMob(
          a,
          t.mult,
          Object.assign(
            { kb: t.kb, sx: t.x - 0.05 * t.vx, sy: t.y + 6, ba: t.ba },
            t.o || {},
          ),
        ),
        t.ba && fire("basicHit", a),
        "mbolt" === t.k &&
          burst(t.x, t.y + 6, 7, [t.col, "#ffffff"], 70, {
            z: 6,
            life: 0.3,
            glow: 1,
          }));
  (t.after && t.after(t, a), chainOn(t, a));
}
function projTrail(t) {
  ("swave" === t.k &&
    RAND() < 0.7 &&
    G.parts.push({
      x: t.x + rf(-2, 2),
      y: t.y + 6,
      z: 6 + rf(-2, 2),
      vx: 0.1 * -t.vx,
      vy: 0.1 * -t.vy,
      vz: 0,
      g: 0,
      life: 0.2,
      c: RAND() < 0.5 ? "#bfe8ff" : "#ffffff",
      s: 1,
      glow: 1,
    }),
    "exarrow" === t.k &&
      RAND() < 0.6 &&
      G.parts.push({
        x: t.x,
        y: t.y + 6,
        z: 6,
        vx: 0,
        vy: 0,
        vz: 8,
        g: 0,
        life: 0.25,
        c: RAND() < 0.5 ? "#ffb347" : "#ff6a3a",
        s: 1,
        glow: 1,
      }),
    ARW_COL[t.k] &&
      RAND() < 0.7 &&
      G.parts.push({
        x: t.x,
        y: t.y + 6,
        z: 6,
        vx: 0,
        vy: 0,
        vz: 6,
        g: 0,
        life: 0.3,
        c: ARW_COL[t.k][RAND() < 0.5 ? 0 : 1],
        s: 1,
        glow: 1,
      }),
    "varrow" === t.k &&
      RAND() < 0.7 &&
      G.parts.push({
        x: t.x,
        y: t.y + 6,
        z: 6,
        vx: 0,
        vy: 0,
        vz: 6,
        g: 0,
        life: 0.3,
        c: RAND() < 0.5 ? "#8ad94a" : "#c8f080",
        s: 1,
        glow: 1,
      }),
    ("fire" === t.k || "bolt" === t.k || "mbolt" === t.k || t.enemy) &&
      RAND() < 0.8 &&
      G.parts.push({
        x: t.x + rf(-1, 1),
        y: t.y + 6,
        z: 6 + rf(-1, 1),
        vx: 0.1 * -t.vx,
        vy: 0.1 * -t.vy,
        vz: rf(4, 16),
        g: -20,
        life: rf(0.15, 0.35),
        c:
          "fire" === t.k
            ? ["#fff0a0", "#ffb347", "#ff6a3a"][ri(0, 2)]
            : "bolt" === t.k
              ? RAND() < 0.5
                ? "#c9a0ff"
                : "#ffffff"
              : "mbolt" === t.k
                ? RAND() < 0.5
                  ? t.col
                  : "#ffffff"
                : t.col,
        s: "fire" === t.k ? 2 : 1,
        glow: 1,
      }));
}
function fireSplit(t, a) {
  const s = LEG.split,
    e = 6.283 * RAND();
  for (let n = 0; n < s.n; n++) {
    const l = e + (n / s.n) * 6.283;
    roPushFx(G.proj,{
      k: "fire",
      x: t.x + 4 * Math.cos(l),
      y: t.y + 3 * Math.sin(l),
      vx: Math.cos(l) * s.spd,
      vy: Math.sin(l) * s.spd * 0.75,
      one: 1,
      life: s.life,
      mult: t.mult * s.k,
      o: t.o,
      r: 0.6 * t.r,
      kb: 40,
      skip: a,
      small: 1,
    });
  }
}
function spinTick(t) {
  const a = G.pl;
  if ((a.spT = (a.spT || 0) + t) < LEG.spin.iv) return;
  a.spT -= LEG.spin.iv;
  const s = gemMods(activeGems().find((t) => "whirlL" === (SKILLS[t.id]?.roBase || t.id))),
    e = LEG.spin.r * PS.area * (1 + s.area);
  for (const t of mobsNear(a.x, a.y - 3, e))
    hitMob(t, LEG.spin.k * (1 + s.dmg), {
      skill: 1,
      kb: 60,
      tg: SKILLS.whirlL.tg,
      crit: s.crit,
      critm: s.critm,
    });
  (roPushFx(G.fx,{
    k: "ring",
    x: a.x,
    y: a.y - 3,
    r: e,
    t: 0,
    life: 0.25,
    col: "#ffd890",
  }),
    sfx("swing"));
}
const ARW_COL = {
  farrow: ["#ffb347", "#ff6a3a"],
  iarrow: ["#bfe8ff", "#ffffff"],
  larrow: ["#ffe04a", "#ffffff"],
};
function arwIce(t, a) {
  const s = ARW.ir * t.ar;
  roPushFx(G.fx,{
    k: "nova",
    x: a.x,
    y: a.y - 3,
    r: s,
    t: 0,
    life: 0.3,
    c1: "#7ad4ff",
    c2: "#e0faff",
  });
  for (const e of mobsNear(a.x, a.y - 3, s))
    e !== a &&
      hitMob(e, 0.5 * t.mult, Object.assign({ kb: 40, sx: a.x, sy: a.y }, t.o));
  burst(a.x, a.y, 10, ["#ffffff", "#b0ecff", "#7ad4ff"], 80, {
    z: 6,
    life: 0.3,
    glow: 1,
  });
}
function arwZap(t, a) {
  G.mobs
    .filter(
      (s) =>
        s !== a &&
        alive(s) &&
        s.spawnT <= 0 &&
        Math.hypot(s.x - a.x, s.y - a.y) <= ARW.lr * t.ar,
    )
    .sort(
      (t, s) =>
        Math.hypot(t.x - a.x, t.y - a.y) - Math.hypot(s.x - a.x, s.y - a.y),
    )
    .slice(0, ARW.ln)
    .forEach((s, e) =>
      later(0.05 + 0.05 * e, () => {
        alive(s) &&
          alive(a) &&
          (roPushFx(G.fx,{
            k: "zap",
            x: a.x,
            y: a.y - 0.45 * a.h,
            x2: s.x,
            y2: s.y - 0.45 * s.h,
            t: 0,
            life: 0.18,
            s: ri(1, 999),
          }),
          hitMob(
            s,
            0.5 * t.mult,
            Object.assign({ kb: 30, sx: a.x, sy: a.y }, t.o),
          ));
      }),
    );
}
function segDist(t, a, s, e, n, l) {
  const o = n - s,
    r = l - e,
    i = clamp(((t - s) * o + (a - e) * r) / (o * o + r * r || 1), 0, 1);
  return Math.hypot(t - s - i * o, a - e - i * r);
}
function castSkill(t, a = 1) {
  const s = PS.cast || 1,
    e = G.pl.anim;
  let n;
  G.cst = s;
  try {
    n = castSkillRaw(t, a);
  } finally {
    G.cst = 0;
  }
  return (
    1 !== s && !1 !== n && G.pl.anim && G.pl.anim !== e && (G.pl.anim.dur /= s),
    n
  );
}
function castSkillRaw(t, a = 1) {
  if ("function" == typeof v6Cast) {
    const v6r = v6Cast(t, a);
    if (void 0 !== v6r) return v6r;
  }
  const s = G.pl,
    e = gemMods(t),
    n = PS.area * (1 + e.area),
    l = {
      skill: 1,
      crit: e.crit,
      critm: e.critm,
      ail: SKILLS[t.id].ail,
      ailx: PS.ail * (1 + e.ail),
      ovk: e.ovk,
      chn: e.chn,
      tg: SKILLS[t.id].tg,
      pcap: PS.psnMax + e.pstk,
    },
    o = SKILLS[t.id].hit,
    r = (1 + e.dmg) * a,
    i = s.tgt,
    c = i ? aimAt(i) : s.face;
  switch (SKILLS[t.id].roBase || t.id) {
    case "heavy":
      if (!alive(i)) return !1;
      (setFace(c),
        (s.anim = { k: "slam", t: 0, dur: 0.34, a: c }),
        (s.vx += 70 * Math.cos(c)),
        (s.vy += 40 * Math.sin(c)),
        later(0.13, () => {
          alive(i) &&
            (hitMob(i, o * r, Object.assign({ kb: 160, stop: 1 }, l)),
            roPushFx(G.fx,{
              k: "ring",
              x: i.x,
              y: i.y,
              r: 16 * n,
              t: 0,
              life: 0.3,
              col: "#ffb070",
            }),
            burst(i.x, i.y, 14, ["#a3764d", "#cfc2a0", "#6b4a32"], 70, {
              z: 1,
              vz: 70,
            }),
            shake(0.16));
        }));
      break;
    case "whirl":
      ((s.anim = { k: "whirl", t: 0, dur: 0.42, a: s.face, R: 18 * n }),
        later(0.08, () => {
          for (const t of mobsNear(s.x, s.y - 3, 18 * n))
            hitMob(t, o * r, Object.assign({ kb: 120 }, l));
          hitStop(0.05);
        }));
      break;
    case "pierce":
    case "pierceL":
      if (!alive(i)) return !1;
      (setFace(c),
        (s.anim = { k: "shoot", t: 0, dur: 0.32, a: c, big: 1 }),
        later(0.16, () => {
          const [a, s] = handPos();
          for (let n = 0; n <= e.proj; n++) {
            const e = c + 0.22 * Math.ceil(n / 2) * (n % 2 ? 1 : -1);
            roPushFx(G.proj,{
              k: "parrow",
              x: a,
              y: s,
              vx: 230 * Math.cos(e),
              vy: 230 * Math.sin(e),
              mult: o * r,
              o: l,
              hit: new Set(),
              life: 1.2,
              ...("pierceL" === (SKILLS[t.id]?.roBase || t.id) ? { ret: 1.2 - LEG.ret, gold: 1 } : {}),
            });
          }
          shake(0.06);
        }));
      break;
    case "rain":
      if (!alive(i)) return !1;
      s.anim = {
        k: "shoot",
        t: 0,
        dur: 0.3,
        a: -Math.PI / 2 - 0.3 * (s.flip ? -1 : 1),
        big: 1,
      };
      {
        const t = i.x,
          a = i.y;
        for (let s = 0; s < 4 + e.proj; s++)
          roPushFx(G.fx,{
            k: "rain",
            x: t + rf(-4, 4),
            y: a + rf(-3, 3),
            r: 18 * n,
            t: -0.2 - 0.24 * s,
            life: 0.28,
            mult: o * r,
            o: l,
            done: 0,
          });
      }
      break;
    case "fire":
    case "fireL":
      if (!alive(i)) return !1;
      (setFace(c),
        (s.anim = { k: "cast", t: 0, dur: 0.34, a: c, big: 1 }),
        later(0.16, () => {
          const [a, s] = handPos();
          fan(
            {
              k: "fire",
              x: a,
              y: s - 5,
              spd: 120,
              mult: o * r,
              o: l,
              r: 14 * n,
              kb: 70,
              after: "fireL" === (SKILLS[t.id]?.roBase || t.id) ? fireSplit : null,
            },
            i,
            c,
            e.proj,
          );
        }));
      break;
    case "varrow": {
      if (!alive(i)) return !1;
      (setFace(c), (s.anim = { k: "shoot", t: 0, dur: 0.3, a: c, big: 1 }));
      const t = Object.assign({ psn: PS.psnMax + e.pstk }, l);
      later(0.15, () => {
        const [a, s] = handPos();
        fan(
          { k: "varrow", x: a, y: s, spd: 200, mult: o * r, o: t, kb: 45 },
          i,
          c,
          e.proj,
        );
      });
      break;
    }
    case "thrust":
      if (!alive(i)) return !1;
      (setFace(c),
        (s.anim = { k: "swing", t: 0, dur: 0.18, a: c, combo: 1 }),
        (s.vx += 60 * Math.cos(c)),
        (s.vy += 35 * Math.sin(c)),
        later(0.06, () => {
          const t = 26 * n,
            a = s.x,
            e = s.y - 3,
            i = new Set();
          for (const s of [-0.45, 0, 0.45]) {
            const n = c + s,
              d = a + Math.cos(n) * t,
              f = e + Math.sin(n) * t;
            roPushFx(G.fx,{
              k: "thrust",
              x: a,
              y: e - 4,
              a: n,
              L: t,
              t: 0,
              life: 0.22,
            });
            for (const t of G.mobs)
              !i.has(t) &&
                alive(t) &&
                t.spawnT <= 0 &&
                segDist(t.x, t.y - 3, a, e, d, f) <= 5 + (t.boss ? 6 : 0) &&
                (i.add(t),
                hitMob(t, o * r, Object.assign({ kb: 100, sx: a, sy: e }, l)));
          }
          i.size && hitStop(0.045);
        }));
      break;
    case "chain":
      if (!alive(i)) return !1;
      (setFace(c),
        (s.anim = { k: "cast", t: 0, dur: 0.3, a: c, big: 1 }),
        later(0.12, () => {
          if (!alive(i)) return;
          const [t, a] = handPos(),
            s = new Set([i]);
          let c = { x: t, y: a - 5 },
            d = i;
          for (let t = 0; t < 3 + e.chn && d; t++) {
            const a = d,
              e = c.x,
              i = c.y;
            (later(0.07 * t, () => {
              alive(a) &&
                (roPushFx(G.fx,{
                  k: "zap",
                  x: e,
                  y: i,
                  x2: a.x,
                  y2: a.y - 0.45 * a.h,
                  t: 0,
                  life: 0.2,
                  s: ri(1, 999),
                }),
                hitMob(
                  a,
                  o * r,
                  Object.assign({ kb: 40, stop: 0 === t ? 1 : 0 }, l),
                ));
            }),
              (c = { x: a.x, y: a.y - 0.45 * a.h }),
              (d = G.mobs
                .filter(
                  (t) =>
                    !s.has(t) &&
                    alive(t) &&
                    t.spawnT <= 0 &&
                    Math.hypot(t.x - a.x, t.y - a.y) <= 36 * n,
                )
                .sort(
                  (t, s) =>
                    Math.hypot(t.x - a.x, t.y - a.y) -
                    Math.hypot(s.x - a.x, s.y - a.y),
                )[0]),
              d && s.add(d));
          }
        }));
      break;
    case "summon": {
      if (G.mins.filter((a) => a.g === t.u).length >= minCap(t)) return !1;
      const a = {
        g: t.u,
        el: MIN.el[(G.minEl = ((G.minEl || 0) + 1) % 3)],
        x: s.x + rf(-6, 6),
        y: s.y + rf(-4, 4),
        atk: rf(0.3, 0.8),
        t: rf(0, 6),
        tgt: null,
      };
      (G.mins.push(a),
        (s.anim = { k: "cast", t: 0, dur: 0.3, a: -Math.PI / 2 }),
        burst(a.x, a.y - 8, 12, [AIL[a.el].col, "#ffffff"], 60, {
          z: 8,
          life: 0.4,
          glow: 1,
        }));
      break;
    }
    case "cwk":
    case "cslw":
    case "cvul": {
      if (!alive(i)) return !1;
      const a = SKILLS[t.id].crs,
        e = 28 * n * (1 + tal("crsR")),
        l = i.x,
        o = i.y - 3;
      (setFace(c),
        (s.anim = { k: "cast", t: 0, dur: 0.3, a: c }),
        later(0.12, () => {
          for (const t of mobsNear(l, o, e))
            (((t.crs || (t.crs = {}))[a] = CRS[a].t + tal("crsT")),
              (t.ag = !0));
          roPushFx(G.fx,
            { k: "ring", x: l, y: o, r: e, t: 0, life: 0.5, col: CRS[a].col },
            {
              k: "ring",
              x: l,
              y: o,
              r: 0.5 * e,
              t: 0,
              life: 0.35,
              col: "#ffffff",
            },
          );
          for (let t = 0; t < 14; t++) {
            const s = (t / 14) * 6.283;
            G.parts.push({
              x: l + Math.cos(s) * e * 0.8,
              y: o + Math.sin(s) * e * 0.5,
              z: 2,
              vx: 30 * -Math.cos(s),
              vy: 18 * -Math.sin(s),
              vz: rf(10, 25),
              g: 0,
              life: 0.45,
              c: t % 2 ? CRS[a].col : "#3a2050",
              s: 1,
              glow: 1,
            });
          }
        }));
      break;
    }
    case "taunt":
      later(0.05, () => {
        const t = 44 * n * (1 + tal("tntR"));
        for (const a of mobsNear(s.x, s.y - 3, t))
          ((a.ag = !0),
            (a.tnt = 4 + tal("tntT")),
            (a.flash = Math.max(a.flash, 0.06)));
        (roPushFx(G.fx,
          {
            k: "ring",
            x: s.x,
            y: s.y - 3,
            r: t,
            t: 0,
            life: 0.4,
            col: "#ff6a7a",
          },
          {
            k: "ring",
            x: s.x,
            y: s.y - 3,
            r: 0.55 * t,
            t: 0,
            life: 0.3,
            col: "#ffd0a0",
          },
        ),
          burst(s.x, s.y - 10, 10, ["#ff6a7a", "#ffd0a0", "#ffffff"], 60, {
            z: 10,
            life: 0.35,
            glow: 1,
          }),
          shake(0.08));
      });
      break;
    case "farrow":
    case "iarrow":
    case "larrow":
      if (!alive(i)) return !1;
      (setFace(c),
        (s.anim = { k: "shoot", t: 0, dur: 0.28, a: c, big: 1 }),
        later(0.14, () => {
          const [a, s] = handPos();
          fan(
            {
              k: t.id,
              x: a,
              y: s,
              spd: 210,
              mult: o * r,
              o: l,
              kb: 50,
              ar: n,
              after:
                "iarrow" === (SKILLS[t.id]?.roBase || t.id) ? arwIce : "larrow" === (SKILLS[t.id]?.roBase || t.id) ? arwZap : null,
            },
            i,
            c,
            e.proj,
          );
        }));
      break;
    case "turret": {
      const n = clamp(s.x + rf(-14, 14), 8, G.W - 8),
        l = clamp(s.y + rf(-8, 8), G.top + 8, G.H - 6);
      G.turs.push({
        g: t.u,
        x: n,
        y: l,
        t: 0,
        atk: rf(0.2, 0.5),
        k: a,
        face: s.flip ? -1 : 1,
      });
      const o = G.turs.filter((a) => a.g === t.u),
        r = TUR.n + PS.minion + e.minion;
      (o.length > r &&
        (G.turs = G.turs.filter((t) => !o.slice(0, o.length - r).includes(t))),
        (s.anim = { k: "shoot", t: 0, dur: 0.24, a: -Math.PI / 2 }),
        burst(n, l, 12, ["#c09050", "#e8d8b0", "#6b4a32"], 60, {
          z: 2,
          vz: 40,
          life: 0.4,
        }));
      break;
    }
    case "blink":
    case "blinkL": {
      if (!alive(i)) return !1;
      const a = Math.atan2(i.y - s.y, i.x - s.x),
        e = { x: s.x, y: s.y - 6 };
      return (
        (s.x = clamp(i.x - 8 * Math.cos(a), 6, G.W - 6)),
        (s.y = clamp(i.y - 5 * Math.sin(a), G.top + 4, G.H - 4)),
        (s.vx = s.vy = 0),
        streak(e, { x: s.x, y: s.y - 6 }, "#c8b0ff"),
        burst(e.x, e.y + 6, 8, ["#c8b0ff", "#ffffff"], 40, {
          z: 6,
          life: 0.3,
          glow: 1,
        }),
        setFace(a),
        (s.anim = { k: "swing", t: 0, dur: 0.2, a, combo: 2 }),
        later(0.05, () => {
          if (alive(i)) {
            if ("blinkL" === (SKILLS[t.id]?.roBase || t.id)) {
              const t = LEG.blink.r * n;
              for (const a of mobsNear(i.x, i.y, t))
                a !== i &&
                  hitMob(
                    a,
                    LEG.blink.k * r,
                    Object.assign({ kb: 60, nomom: 1 }, l),
                  );
              roPushFx(G.fx,{
                k: "ring",
                x: i.x,
                y: i.y,
                r: t,
                t: 0,
                life: 0.3,
                col: "#ffd890",
              });
            }
            hitMob(i, o * r, Object.assign({ kb: 90, stop: 1, nomom: 1 }, l));
          }
        }),
        !(
          ("blinkL" === (SKILLS[t.id]?.roBase || t.id) && stkN("mom") > 0 && RAND() < LEG.blink.keep) ||
          useStk("mom")
        ) || "free"
      );
    }
    case "swave":
      if (!alive(i)) return !1;
      (setFace(c),
        (s.anim = { k: "swing", t: 0, dur: 0.22, a: c, combo: 3 }),
        later(0.08, () => {
          fan(
            {
              k: "swave",
              x: s.x + 6 * Math.cos(c),
              y: s.y - 8,
              spd: 190,
              mult: o * r,
              o: l,
              kb: 70,
              life: SWAVE.life,
            },
            i,
            c,
            e.proj,
          );
        }));
      break;
    case "exarrow":
      if (!alive(i)) return !1;
      (setFace(c),
        (s.anim = { k: "shoot", t: 0, dur: 0.24, a: c }),
        later(0.1, () => {
          const [t, a] = handPos();
          fan(
            {
              k: "exarrow",
              x: t,
              y: a,
              spd: 220,
              mult: o * r,
              o: l,
              kb: 20,
              ar: EXA.r * n,
            },
            i,
            c,
            e.proj,
          );
        }));
      break;
    case "trap": {
      if (!alive(i)) return !1;
      (trapN() >= TRAP.max + tal("trapMax") &&
        trapBoom(G.fx.find((t) => "trap" === t.k && !t.done)),
        setFace(c),
        (s.anim = { k: "shoot", t: 0, dur: 0.26, a: c }));
      const t = clamp(i.x + rf(-4, 4), 8, G.W - 8),
        a = clamp(i.y + rf(-3, 3), G.top + 6, G.H - 6);
      roPushFx(G.fx,{
        k: "trap",
        x: t,
        y: a,
        t: 0,
        life: TRAP.life * gndT(),
        mult: o * r,
        o: l,
        r: TRAP.r * n,
        fx: s.x,
        fy: s.y - 8,
      });
      break;
    }
    case "meteor": {
      if (!alive(i)) return !1;
      const t = MTR.r * n,
        a = G.mobs.filter((t) => alive(t) && t.spawnT <= 0 && dist(t, i) <= 50),
        e = a.reduce(
          (s, e) => {
            const n = a.filter(
              (a) => Math.hypot(a.x - e.x, a.y - e.y) <= 0.7 * t,
            ).length;
            return n > s.n ? { m: e, n } : s;
          },
          { m: i, n: 0 },
        ).m;
      (setFace(c),
        (s.anim = { k: "cast", t: 0, dur: 0.34, a: -Math.PI / 2, big: 1 }),
        roPushFx(G.fx,{
          k: "mtr",
          x: e.x,
          y: e.y,
          r: t,
          t: -MTR.t,
          life: 0.35,
          mult: o * r,
          o: l,
          done: 0,
        }));
      break;
    }
    case "bliz":
      if (!alive(i)) return !1;
      ((s.anim = { k: "cast", t: 0, dur: 0.3, a: -Math.PI / 2 }),
        roPushFx(G.fx,{
          k: "bliz",
          x: i.x,
          y: i.y,
          r: BLZ.r * n,
          t: 0,
          life: BLZ.t * gndT(),
          acc: 0,
          mult: o * r,
          o: l,
        }));
      break;
    case "fissure":
      if (!alive(i)) return !1;
      (setFace(c),
        (s.anim = { k: "slam", t: 0, dur: 0.34, a: c }),
        later(0.13, () => {
          const t = FISS.L * n,
            a = s.x + 4 * Math.cos(c),
            e = s.y - 1 + 3 * Math.sin(c),
            i = clamp(a + Math.cos(c) * t, 6, G.W - 6),
            d = clamp(e + Math.sin(c) * t, G.top + 4, G.H - 4);
          for (const t of G.mobs)
            alive(t) &&
              t.spawnT <= 0 &&
              segDist(t.x, t.y - 2, a, e, i, d) <= FISS.w + (t.boss ? 6 : 0) &&
              hitMob(t, o * r, Object.assign({ kb: 50, sx: a, sy: e }, l));
          const f =
            ((PS.mn + PS.mx) / 2) *
            PS.skillMul *
            o *
            r *
            AIL.bld.v *
            PS.bld *
            l.ailx;
          roPushFx(G.fx,{
            k: "fiss",
            x: a,
            y: e,
            x2: i,
            y2: d,
            w: FISS.w,
            t: 0,
            life: FISS.life * gndT(),
            dps: f,
            ax: l.ailx,
            acc: 0,
            s: ri(1, 999),
          });
          for (let t = 0; t < 16; t++) {
            const s = t / 15;
            G.parts.push({
              x: a + (i - a) * s + rf(-3, 3),
              y: e + (d - e) * s,
              z: 1,
              vx: rf(-20, 20),
              vy: rf(-10, 10),
              vz: rf(30, 70),
              g: 160,
              life: 0.5,
              c: ["#6b4a32", "#a3764d", "#e02a3a"][t % 3],
              s: 1,
            });
          }
          (shake(0.14), hitStop(0.05));
        }));
      break;
    case "leap": {
      if (!alive(i)) return !1;
      const t = LEAP.r * n,
        a = G.mobs.filter(
          (t) => alive(t) && t.spawnT <= 0 && dist(t, s) <= LEAP.rng,
        ),
        e = a.reduce(
          (s, e) => {
            const n = a.filter(
              (a) => Math.hypot(a.x - e.x, a.y - e.y) <= t,
            ).length;
            return n > s.n ? { m: e, n } : s;
          },
          { m: i, n: 0 },
        ).m,
        c = Math.atan2(e.y - s.y, e.x - s.x),
        d = clamp(e.x - 6 * Math.cos(c), 6, G.W - 6),
        f = clamp(e.y - 4 * Math.sin(c), G.top + 4, G.H - 4);
      (setFace(c),
        (s.anim = { k: "slam", t: 0, dur: LEAP.T + 0.1, a: c }),
        (s.leap = {
          x0: s.x,
          y0: s.y,
          x1: d,
          y1: f,
          t: 0,
          T: LEAP.T / (G.cst || 1),
        }),
        (s.vx = s.vy = 0),
        later(LEAP.T, () => {
          for (const a of mobsNear(s.x, s.y - 3, t))
            hitMob(a, o * r, Object.assign({ kb: 150 }, l));
          (roPushFx(G.fx,
            {
              k: "ring",
              x: s.x,
              y: s.y,
              r: t,
              t: 0,
              life: 0.35,
              col: "#ffd890",
            },
            {
              k: "ring",
              x: s.x,
              y: s.y,
              r: 0.55 * t,
              t: 0,
              life: 0.25,
              col: "#ffffff",
            },
          ),
            burst(s.x, s.y, 22, ["#a3764d", "#cfc2a0", "#6b4a32"], 110, {
              z: 1,
              vz: 80,
            }),
            shake(0.2),
            hitStop(0.06));
        }));
      break;
    }
    case "frostsl":
      if (!alive(i)) return !1;
      (setFace(c),
        (s.anim = { k: "slam", t: 0, dur: 0.34, a: c }),
        later(0.13, () => {
          const t = FSL.r * n,
            a = s.x + Math.cos(c) * FSL.off * n,
            e = s.y - 3 + Math.sin(c) * FSL.off * n * 0.6;
          for (const n of mobsNear(a, e, t))
            hitMob(n, o * r, Object.assign({ kb: 70, sx: s.x, sy: s.y }, l));
          roPushFx(G.fx,{ k: "nova", x: a, y: e + 3, r: t, t: 0, life: 0.4 });
          for (let s = 0; s < 16; s++) {
            const n = rf(0, 6.283),
              l = Math.sqrt(rf(0, 1)) * t;
            G.parts.push({
              x: a + Math.cos(n) * l,
              y: e + 3 + Math.sin(n) * l * 0.6,
              z: 0,
              vx: 0,
              vy: 0,
              vz: rf(50, 90),
              g: 240,
              life: 0.4,
              c: s % 3 ? "#b0ecff" : "#ffffff",
              s: 2,
              glow: 1,
            });
          }
          (shake(0.12), hitStop(0.05));
        }));
      break;
    case "venom": {
      if (!alive(i)) return !1;
      (setFace(c), (s.anim = { k: "swing", t: 0, dur: 0.2, a: c, combo: 1 }));
      const t = Object.assign({ psn: PS.psnMax + e.pstk }, l);
      later(0.08, () => {
        if (!alive(i)) return;
        const a = VEN.r * n,
          s = i.x,
          e = i.y - 3;
        for (const n of mobsNear(s, e, a))
          hitMob(
            n,
            o * r,
            Object.assign({ kb: 40, sx: s, sy: e, stop: n === i ? 1 : 0 }, t),
          );
        (roPushFx(G.fx,{
          k: "nova",
          x: s,
          y: e + 3,
          r: a,
          t: 0,
          life: 0.4,
          c1: "#6ac04a",
          c2: "#d4ff8a",
        }),
          burst(s, e + 3, 16, ["#8ad94a", "#c8f080", "#3a7a2a"], 80, {
            z: 6,
            life: 0.45,
            glow: 1,
          }));
      });
      break;
    }
    case "guard": {
      if (G.gsp.filter((a) => a.g === t.u).length >= gspCap(t)) return !1;
      const a = gspMax(t),
        e = {
          g: t.u,
          x: clamp(s.x + (s.flip ? 8 : -8), 6, G.W - 6),
          y: s.y + rf(-3, 3),
          hp: a,
          max: a,
          atk: 0.5,
          t: rf(0, 6),
          face: s.flip ? -1 : 1,
          tgt: null,
          hurt: 0,
          sw: 0,
        };
      (G.gsp.push(e),
        (s.anim = { k: "cast", t: 0, dur: 0.3, a: -Math.PI / 2 }),
        roPushFx(G.fx,{
          k: "ring",
          x: e.x,
          y: e.y,
          r: 12,
          t: 0,
          life: 0.35,
          col: "#a0c8ff",
        }),
        burst(e.x, e.y - 8, 14, ["#a0c8ff", "#e8f4ff", "#ffffff"], 60, {
          z: 8,
          life: 0.45,
          glow: 1,
        }));
      break;
    }
    case "miasma":
      if (!alive(i)) return !1;
      (setFace(c),
        (s.anim = { k: "cast", t: 0, dur: 0.3, a: c }),
        roPushFx(G.fx,{
          k: "mia",
          x: i.x,
          y: i.y,
          r: MIA.r * n,
          t: 0,
          life: MIA.t * gndT(),
          acc: 0,
          mult: o * r,
          o: Object.assign({ psn: PS.psnMax + e.pstk }, l),
        }));
      break;
    case "nova":
      ((s.anim = { k: "cast", t: 0, dur: 0.34, a: -Math.PI / 2, big: 1 }),
        later(0.12, () => {
          roPushFx(G.fx,{
            k: "nova",
            x: s.x,
            y: s.y - 3,
            r: 24 * n,
            t: 0,
            life: 0.45,
          });
          for (const t of mobsNear(s.x, s.y - 3, 24 * n))
            hitMob(t, o * r, Object.assign({ kb: 90 }, l));
          for (let t = 0; t < 18; t++) {
            const a = (t / 18) * 6.283;
            G.parts.push({
              x: s.x,
              y: s.y,
              z: 4,
              vx: 90 * Math.cos(a) * n,
              vy: 55 * Math.sin(a) * n,
              vz: 10,
              g: 20,
              life: 0.35,
              c: t % 2 ? "#b0ecff" : "#ffffff",
              s: 2,
              glow: 1,
            });
          }
          hitStop(0.05);
        }));
  }
  return !0;
}
function skillRange(t) {
  const a = PS.area * (1 + gemMods(t).area);
  switch (SKILLS[t.id].roBase || t.id) {
    case "heavy":
      return PS.range + 6;
    case "whirl":
      return 16 * a;
    case "nova":
      return 22 * a;
    case "summon":
    case "guard":
      return null;
    case "frostsl":
      return PS.range + (FSL.off + 0.5 * FSL.r) * a;
    case "cwk":
    case "cslw":
    case "cvul":
      return 1.4 * PS.range + 10;
    case "taunt":
      return 44 * a * (1 + tal("tntR"));
    case "thrust":
      return PS.range + 20 * a;
    case "fissure":
      return Math.max(PS.range + 30 * a, FISS.L * a * 0.9);
    case "leap":
      return LEAP.rng;
    case "swave":
      return SWAVE.rng;
    case "blink":
    case "blinkL":
      return BLINK.rng;
    case "turret":
      return TUR.r;
    default:
      return 1.4 * PS.range;
  }
}
function skillReady(t) {
  const a = G.pl,
    s = a.tgt,
    e = skillRange(t),
    n = () => alive(s) && dist(s, a) <= e;
  switch (SKILLS[t.id].roBase || t.id) {
    case "whirl":
    case "nova":
      return mobsNear(a.x, a.y - 3, e).length > 0;
    case "summon":
      return !G.dead && G.mins.filter((a) => a.g === t.u).length < minCap(t);
    case "guard":
      return !G.dead && G.gsp.filter((a) => a.g === t.u).length < gspCap(t);
    case "cwk":
    case "cslw":
    case "cvul": {
      if (!n()) return !1;
      const a = SKILLS[t.id].crs,
        e = mobsNear(s.x, s.y - 3, 28 * PS.area * (1 + gemMods(t).area)),
        l = e.filter((t) => !cursed(t, a)).length;
      return (
        (2 * l >= e.length && l > 0) || ((s.boss || s.elite) && !cursed(s, a))
      );
    }
    case "taunt":
      return mobsNear(a.x, a.y - 3, e).some((t) => !(t.tnt > 0));
    case "leap":
    case "blink":
    case "blinkL":
      return n() && !a.leap;
    case "turret":
      return !G.dead && n();
    default:
      return n();
  }
}
const WALK_SKIP = new Set(["summon", "guard", "cwk", "cslw", "cvul", "taunt"]);
function skillReach() {
  const t = G.pl;
  if (tal("endb")) return 0;
  const a = tal("oath") ? PS.maxhp * (uv("oath", 0) / 100) : 0;
  if (a && S.hp <= a) return 0;
  let s = 0,
    e = 0,
    n = 1e9;
  for (const a of activeGems()) {
    const l = gemMods(a).trig;
    if (SKILLS[a.id].sus || WALK_SKIP.has(a.id) || (l && !S.set.nob)) continue;
    const o = skillRange(a),
      r = l ? ((t.trg && t.trg[a.u]) || 0) - G.t : (t.cds[a.u] ?? 0.6);
    null != o &&
      (r <= 0
        ? (s = Math.max(s, o))
        : S.set.nob && r < n && ((n = r), (e = o)));
  }
  return s || e;
}
function susTick(t) {
  const a = G.pl;
  a.sus[t.id] ||
    ((a.sus[t.id] = 1),
    sfx(t.id),
    roPushFx(G.fx,{
      k: "ring",
      x: a.x,
      y: a.y - 3,
      r: 14,
      t: 0,
      life: 0.3,
      col: "#ff4a5a",
    }),
    burst(a.x, a.y - 8, 10, ["#ff4a5a", "#b8203a", "#ffd0a0"], 50, {
      z: 8,
      life: 0.35,
      glow: 1,
    }));
}
const susHot = () => (G.pl.susI ?? 2) < 2;
function endAttack() {
  const t = G.pl;
  if (((t.ebN = ((t.ebN || 0) + 1) % uv("endb", 0)), t.ebN)) return;
  const a = activeGems().filter((t) => !SKILLS[t.id].sus && skillReady(t));
  if (!a.length) return void (t.ebN = uv("endb", 0) - 1);
  const s = a[ri(0, a.length - 1)];
  later(0.12, () => {
    placed().includes(s) && !G.dead && ((G.pl.cds[s.u] = 0), tryCast(s, 1));
  });
}
function tryCast(t, a) {
  if (!skillReady(t)) return;
  const s = gemMods(t),
    e = tal("oath") ? PS.maxhp * (uv("oath", 0) / 100) : 0;
  if (e && S.hp <= e) return;
  const n = castSkill(t, 1);
  n &&
    (sfx(t.id),
    castCost(s),
    (G.pl.cds[t.u] =
      "free" === n
        ? 0
        : e
          ? OATH.cd
          : SKILLS[t.id].cd * (1 - s.cd) * (1 - PS.cdr / 100) * kingCd()),
    e &&
      ((S.hp -= e),
      burst(G.pl.x, G.pl.y - 8, 6, ["#ff4a5a", "#8a1a2a"], 40, {
        z: 8,
        life: 0.3,
      })),
    a || (G.pl.atk = Math.max(G.pl.atk, 0.2)),
    castExtra(t, s, 1),
    fire("cast", t));
}
function castExtra(t, a, s) {
  if (!SKILLS[t.id].tg.includes("minion"))
    for (let e = 0; e < a.extra; e++)
      later(0.22 * (e + 1), () => {
        placed().includes(t) &&
          !G.dead &&
          skillReady(t) &&
          castSkill(t, 0.6 * s);
      });
}
const hasAf = (t, a) => !!(t && t.ea && t.ea.includes(a));
function eliteAffix(t, a) {
  const s = Object.keys(ELITE_AF),
    e = Math.min(
      s.length,
      (lvMap() >= 6 || (a && slatesOn().length) ? 2 : 1) +
        (a ? slateSum("sl_eaf") : 0),
    );
  for (t.ea = []; t.ea.length < e;) {
    const a = s[ri(0, s.length - 1)];
    t.ea.includes(a) || t.ea.push(a);
  }
  (hasAf(t, "swift") &&
    ((t.spd *= ELITE_AF.swift.spd), (t.am = ELITE_AF.swift.atk)),
    (t.vt = rf(1, ELITE_AF.volley.cd)),
    (t.ft = rf(1, ELITE_AF.frost.cd)));
}
function eliteTick(t, a) {
  const s = G.pl,
    e = dist(t, s);
  if (hasAf(t, "volley") && (t.vt -= a) <= 0 && e < ELITE_AF.volley.rng) {
    t.vt = ELITE_AF.volley.cd;
    const a = ELITE_AF.volley;
    ring8(t, a.cnt, a.spd, t.dmg * a.k, a.c, 6.283 * RAND());
  }
  if (hasAf(t, "frost") && (t.ft -= a) <= 0 && e < ELITE_AF.frost.rng) {
    const a = ELITE_AF.frost;
    ((t.ft = a.cd),
      G.haz.push({
        k: "frost",
        x: s.x,
        y: s.y,
        r: a.r,
        life: a.life,
        L: a.life,
      }),
      sfx("nova"));
  }
}
function ring8(t, a, s, e, n, l) {
  for (let o = 0; o < a; o++) {
    const r = l + (o / a) * 6.283;
    roPushFx(G.proj,{
      k: "ebolt",
      enemy: 1,
      x: t.x,
      y: t.y - 0.5 * t.h,
      vx: Math.cos(r) * s,
      vy: Math.sin(r) * s * 0.75,
      life: 3,
      dmg: e,
      col: n,
      src: t,
    });
  }
  sfx("bolt");
}
function bossSkill(t, a) {
  const s = t.bs;
  if (t.spawnT > 0 || t.dash || G.dead) return;
  if (
    (!s.enr &&
      t.hp < t.max * BOSS_SK.enr &&
      ((s.enr = 1),
      (t.spd *= BOSS_SK.es),
      (t.am = (t.am || 1) * BOSS_SK.ea),
      G.flashes.push({
        x: t.x,
        y: t.y - 0.5 * t.h,
        t: 0,
        ring: 1,
        c: "#ff3a2a",
      }),
      shake(0.25),
      sfx("boss"),
      toast(`${t.bn || G.bn || curMap().boss}進入狂怒！`, "bad")),
    s.enr &&
      RAND() < 12 * a &&
      G.parts.push({
        x: t.x + rf(-8, 8),
        y: t.y,
        z: rf(2, t.h),
        vx: 0,
        vy: 0,
        vz: rf(16, 30),
        g: -8,
        life: 0.5,
        c: RAND() < 0.6 ? "#ff4a3a" : "#ffb070",
        s: 1,
        glow: 1,
      }),
    (s.t -= a) > 0 || t.hold > 0)
  )
    return;
  s.t = BOSS_SK.cd * (t.bcd || 1) * (s.enr ? 0.7 : 1);
  const e = s.i++ % s.ks.length;
  castBossSk(
    t,
    s.ks[e],
    (e ? BOSS_SK.minor : 1) *
      BOSS_SK.big *
      Math.min(1, BOSS_SK.ramp[0] + BOSS_SK.ramp[1] * lvMap()) *
      (60 + 13 * t.lv) *
      (t.sdm || 1),
  );
}
function castBossSk(t, a, s) {
  const e = BOSS_SK[a],
    n = G.pl,
    l = {
      x: clamp(n.x + (n.mvx || 0) * (e.t || 0) * BOSS_SK.lead, 6, G.W - 6),
      y: clamp(
        n.y + (n.mvy || 0) * (e.t || 0) * BOSS_SK.lead,
        G.top + 4,
        G.H - 4,
      ),
    };
  if (e.go) return e.go(t, s, l, e);
  if ("slam" === a)
    ((t.hold = e.t),
      addHaz({
        x: t.x,
        y: t.y,
        r: e.r,
        t: e.t,
        dmg: s * e.k,
        src: t,
        c: "#ff5a3a",
      }));
  else if ("mark" === a)
    for (let a = 0; a < e.cnt; a++)
      addHaz({
        x: l.x + (a ? rf(-22, 22) : 0),
        y: l.y + (a ? rf(-14, 14) : 0),
        r: e.r,
        t: e.t + 0.2 * a,
        dmg: s * e.k,
        src: t,
        c: "#ff5a3a",
      });
  else if ("charge" === a) {
    const a = Math.atan2(l.y - t.y, l.x - t.x),
      n = Math.min(e.len, dist(t, l) + 45),
      o = clamp(t.x + Math.cos(a) * n, 6, G.W - 6),
      r = clamp(t.y + Math.sin(a) * n, G.top + 4, G.H - 4);
    ((t.hold = e.t),
      addHaz({
        k: "line",
        x: t.x,
        y: t.y,
        x2: o,
        y2: r,
        w: e.w,
        t: e.t,
        dmg: s * e.k,
        src: t,
        c: "#ff5a3a",
        go: (a) => {
          alive(t) && (t.dash = { x: a.x2, y: a.y2, t: 0.2 });
        },
      }));
  } else if ("volley" === a)
    ((t.hold = 0.5),
      G.flashes.push({
        x: t.x,
        y: t.y - 0.5 * t.h,
        t: 0,
        ring: 1,
        c: "#ff60ff",
      }),
      later(0.5, () => {
        alive(t) && ring8(t, e.cnt, e.spd, s * e.k, "#ff60ff", 6.283 * RAND());
      }));
  else if ("summon" === a) {
    if (G.mobs.filter((t) => t.add).length >= e.max)
      return castBossSk(t, t.bs.ks.find((t) => "summon" !== t) || "mark", s);
    const a = curMap().m,
      n = G.tw ? [TW.lv, TW.lv] : mapLv();
    for (let s = 0; s < e.cnt; s++) {
      const l = (s / e.cnt) * 6.283 + rf(0, 1),
        o = addMob(
          a[s % a.length],
          ri(n[0], n[1]),
          t.x + 18 * Math.cos(l),
          t.y + 12 * Math.sin(l),
          { sl: 1 },
        );
      (inArena(o), (o.ag = !0), (o.add = 1));
    }
    (G.flashes.push({ x: t.x, y: t.y - 10, t: 0, ring: 1, c: "#e0445a" }),
      sfx("boss"));
  } else if ("roots" === a) {
    t.hold = 0.4;
    for (let a = 0; a < e.cnt; a++) {
      const n = (a / e.cnt) * 6.283 + rf(0, 1),
        o = a ? 16 : 0;
      addHaz({
        x: clamp(l.x + Math.cos(n) * o, 6, G.W - 6),
        y: clamp(l.y + Math.sin(n) * o * 0.7, G.top + 4, G.H - 4),
        r: e.r,
        t: e.t + 0.15 * a,
        dmg: s * e.k,
        src: t,
        c: e.c,
        go: (t) =>
          G.haz.push({
            k: "frost",
            x: t.x,
            y: t.y,
            r: t.r,
            life: e.slow,
            L: e.slow,
          }),
      });
    }
  } else if ("meteor" === a) {
    ((t.hold = 0.5),
      G.flashes.push({ x: t.x, y: t.y - 0.5 * t.h, t: 0, ring: 1, c: e.c }));
    for (let a = 0; a < e.cnt; a++)
      addHaz({
        x: a ? rf(16, G.W - 16) : l.x,
        y: a ? rf(G.top + 12, G.H - 10) : l.y,
        r: e.r,
        t: e.t + a * e.stagger,
        dmg: s * e.k,
        src: t,
        c: e.c,
      });
  } else if ("cross" === a) {
    t.hold = e.t;
    const a = Math.atan2(l.y - t.y, l.x - t.x),
      n = (a) => {
        const s = Math.cos(a),
          e = Math.sin(a),
          n = Math.min(
            s > 0 ? (G.W - 6 - t.x) / s : s < 0 ? (6 - t.x) / s : 1e4,
            e > 0 ? (G.H - 4 - t.y) / e : e < 0 ? (G.top + 4 - t.y) / e : 1e4,
          );
        return [t.x + s * Math.max(0, n), t.y + e * Math.max(0, n)];
      };
    for (const l of [a, a + 1.571]) {
      const [a, o] = n(l + 3.1416),
        [r, i] = n(l);
      addHaz({
        k: "line",
        x: a,
        y: o,
        x2: r,
        y2: i,
        w: e.w,
        t: e.t,
        dmg: s * e.k,
        src: t,
        c: e.c,
      });
    }
  }
}
function addHaz(t) {
  return (
    (t.T = t.t),
    (t.dg =
      RAND() < clamp((DODGE.base * PS.move) / 32, DODGE.lo, DODGE.hi) ||
      !!t.adg),
    G.haz.push(t),
    t
  );
}
function inHaz(t, a, s, e = 0) {
  if ("line" === t.k) {
    const n = t.x2 - t.x,
      l = t.y2 - t.y,
      o = clamp(((a - t.x) * n + (s - t.y) * l) / (n * n + l * l || 1), 0, 1);
    return Math.hypot(a - t.x - n * o, 1.4 * (s - t.y - l * o)) <= t.w + e;
  }
  const n = Math.hypot(a - t.x, 1.4 * (s - t.y));
  return n <= t.r + e && !(t.ri && n < t.ri - e);
}
function tickHaz(t) {
  const a = G.pl;
  for (let s = G.haz.length - 1; s >= 0; s--) {
    const e = G.haz[s];
    "frost" !== e.k
      ? (e.tk && e.tk(e, t),
        (e.t -= t) > 0 ||
          (G.haz.splice(s, 1),
          e.go && e.go(e),
          shake(0.2),
          hitStop(0.05),
          sfx("big"),
          "line" !== e.k &&
            (burst(e.x, e.y, 18, [e.c, "#ffd040", "#4a3a3a"], 110, { z: 2 }),
            G.flashes.push({ x: e.x, y: e.y, t: 0, ring: 1, c: e.c })),
          !G.dead &&
            inHaz(e, a.x, a.y) &&
            damagePlayer(
              e.dmg,
              e.nk ? null : e.x,
              e.y,
              alive(e.src) ? e.src : null,
              0,
            )))
      : (e.life -= t) <= 0
        ? G.haz.splice(s, 1)
        : !G.dead && inHaz(e, a.x, a.y) && (a.slowT = 0.15);
  }
}
function dodgeDir() {
  const t = G.pl;
  for (const a of G.haz) {
    if ("frost" === a.k || !a.dg || !inHaz(a, t.x, t.y, 3)) continue;
    let s, e;
    if ("line" === a.k) {
      const n = a.x2 - a.x,
        l = a.y2 - a.y,
        o = Math.hypot(n, l) || 1;
      ((s = -l / o),
        (e = n / o),
        (t.x - a.x) * s + (t.y - a.y) * e < 0 && ((s = -s), (e = -e)));
    } else {
      ((s = t.x - a.x), (e = t.y - a.y));
      const n = Math.hypot(s, e);
      n < 0.5 ? ((s = 1), (e = 0)) : ((s /= n), (e /= n));
    }
    return (
      ((t.x < 14 && s < 0) || (t.x > G.W - 14 && s > 0)) && (s = 0),
      ((t.y < G.top + 12 && e < 0) || (t.y > G.H - 10 && e > 0)) && (e = 0),
      s || e || (e = t.y < (G.top + G.H) / 2 ? 1 : -1),
      [s, e]
    );
  }
  return null;
}
const KITE_K = 0.65,
  KITE_MELEE = 0.8;
function kiteDir(t, a) {
  const s = G.pl,
    e = PS.range * (a ? 0.85 : PS.range < 20 ? 0.8 : 0.65),
    n = [];
  for (const t of G.mobs) {
    if ((!a && (!t.ag || t.ranged)) || t.spawnT > 0) continue;
    const l = e + (t.boss ? 8 : 0);
    dist(t, s) < l && n.push(t);
  }
  if (((s.kth = n), !n.length)) return ((s.kdir = null), null);
  const l = G.W - 6,
    o = G.top + 4,
    r = G.H - 4,
    i = s.kdir;
  let c = null,
    d = -1e9;
  for (let a = 0; a < 16; a++) {
    const e = (a * Math.PI) / 8,
      f = Math.cos(e),
      p = Math.sin(e),
      u = Math.min(
        f > 0.01 ? (l - s.x) / f : f < -0.01 ? (6 - s.x) / f : 99,
        p > 0.01 ? (r - s.y) / p : p < -0.01 ? (o - s.y) / p : 99,
        60,
      ),
      h = Math.min(u, 30);
    let m = 1e9;
    for (const t of n)
      for (const a of [0.4, 1]) {
        const e =
          Math.hypot(s.x + f * h * a - t.x, s.y + p * h * a - t.y) -
          (t.boss ? 8 : 0);
        e < m && (m = e);
      }
    const A =
      m +
      0.3 * u -
      1.5 *
        (t
          ? Math.max(
              0,
              Math.hypot(s.x + f * h * 0.5 - t.x, s.y + p * h * 0.5 - t.y) -
                0.9 * PS.range,
            )
          : 0) +
      (i ? 4 * (f * i[0] + p * i[1]) : 0);
    A > d && ((d = A), (c = [f, p]));
  }
  return ((s.kdir = c), c);
}
function tick(t) {
  G.t += t;
  const a = G.pl;
  for (; G.wolf.length && G.wolf[0] < G.t;) G.wolf.shift();
  fire("tick", t);
  const s = G.rate;
  for (s.t += t; s.t >= 1;)
    ((s.t -= 1),
      (s.i = (s.i + 1) % 60),
      (s.k[s.i] = 0),
      (s.x[s.i] = 0),
      (s.n = Math.min(60, s.n + 1)),
      ui.refreshIf("map"));
  if (
    (G.trn ||
      ((ses().t += t), (S.mt[S.map] = (S.mt[S.map] || 0) + t), (G.minT += t)),
    G.minT >= 60 &&
      ((S.kpm = S.kpm ? 0.7 * S.kpm + 0.3 * G.minK : G.minK),
      (G.minK = 0),
      (G.minT = 0)),
    G.boss &&
      ((G.bossT -= t),
      G.bossT <= 0
        ? failBoss("挑戰失敗：時間到")
        : null != G.guard && alive(G.boss) && guardTick(G.boss, t)),
    G.tw && twTick(t),
    G.arena && canStart() && (G.arena.out -= t) <= 0 && leaveArena(),
    S.set.ab &&
      !ssMap() &&
      canStartA() &&
      G.t >= (G.abT || 0) &&
      bossReady() &&
      abReady() &&
      startBoss(),
    ssMap() && S.set.ags && canStartA() && G.t >= (G.abT || 0) && abReady())
  ) {
    let t = -1;
    (S.set.ags.forEach((a, s) => {
      a && S.ssf[s] >= SS.fragN && (t < 0 || S.ssf[s] > S.ssf[t]) && (t = s);
    }),
      t >= 0 && startBoss(t));
  }
  if (agAny() && canStart() && G.t >= (G.agT || 0) && abReady()) {
    const t = agPick();
    t >= 0 && startGuard(t);
  }
  S.set.at &&
    twOpen() &&
    canStartA() &&
    G.t >= (G.atT || 0) &&
    abReady() &&
    twStart(twFrom());
  for (let t = G.later.length - 1; t >= 0; t--)
    if (G.later[t].at <= G.t) {
      const a = G.later.splice(t, 1)[0];
      G.dead || a.fn();
    }
  const e = G.arena
    ? 0
    : G.boss
      ? 3
      : Math.round(
          (Math.min(10, 5 + Math.floor(S.map / 2)) +
            slateSum("dens") +
            slateSum("horde") * HORDE.dens) *
            clamp((G.W * G.H) / 34e3, 1, 1.5),
        );
  if (
    ((G.spawn -= t),
    G.spawn <= 0 &&
      G.mobs.length < e &&
      (spawnPack(),
      (G.spawn =
        0.8 / (1 + slateSum("horde") * HORDE.spawn + slateSum("spawn") / 100))),
    (a.hurt = Math.max(0, a.hurt - t)),
    a.anim && ((a.anim.t += t), a.anim.t >= a.anim.dur && (a.anim = null)),
    G.dead)
  )
    ((G.dead -= t),
      G.dead <= 0 &&
        ((G.dead = 0),
        (S.hp = hpCap()),
        G.flashes.push({ x: a.x, y: a.y - 6, t: 0, ring: 1, c: "#7dffc8" }),
        toast("復活")));
  else {
    if (
      (S.hp < hpCap() &&
        (S.hp = Math.min(hpCap(), S.hp + PS.regen * slHealMul() * t)),
      a.sus.frenzy &&
        susHot() &&
        (S.hp > 1 && (S.hp = Math.max(1, S.hp - 0.04 * PS.maxhp * t)),
        RAND() < 10 * t &&
          G.parts.push({
            x: a.x + rf(-4, 4),
            y: a.y,
            z: rf(2, 10),
            vx: 0,
            vy: 0,
            vz: rf(14, 26),
            g: -6,
            life: 0.5,
            c: RAND() < 0.6 ? "#ff4a5a" : "#ffd0a0",
            s: 1,
            glow: 1,
          })),
      susHot())
    )
      for (const s in a.sus) SKILLS[s].stick && SKILLS[s].stick(t);
    if (
      (S.pot <= 0 &&
        S.set.apb &&
        S.ash >= 30 &&
        ((S.ash -= 30), (S.pot += 5), toast("自動購買藥水 ×5"), markDirty()),
      S.pot > 0 && (S.hp / PS.maxhp) * 100 < S.potPct && (a.potCd || 0) <= 0)
    ) {
      (S.pot--, heal(0.35 * PS.maxhp * PS.pot), (a.potCd = 4), sfx("pot"));
      for (let t = 0; t < 10; t++)
        G.parts.push({
          x: a.x + rf(-5, 5),
          y: a.y,
          z: rf(2, 12),
          vx: 0,
          vy: 0,
          vz: rf(20, 40),
          g: -10,
          life: 0.7,
          c: t % 2 ? "#ff8a9a" : "#ffffff",
          s: 1,
          glow: 1,
        });
      num(a.x, a.y - 22, "+" + fmt(0.35 * PS.maxhp * PS.pot), "#7dffc8");
    }
    ((a.potCd = (a.potCd || 0) - t),
      (a.retgt -= t),
      alive(a.tgt)
        ? a.retgt <= 0 &&
          ((a.retgt = 0.5),
          !a.tgt.ag && G.mobs.some(attacking) && (a.tgt = pickTarget()))
        : ((a.tgt = pickTarget()), (a.retgt = 0.5)));
    const s = S.set.psv && !G.trn; // v1.0.11：消極模式套用到所有戰鬥（練功木樁除外）
    if (s) {
      let t = null;
      for (const s of G.mobs)
        s.spawnT <= 0 && (!t || dist(s, a) < dist(t, a)) && (t = s);
      a.tgt = t && dist(t, a) <= PS.range + (t.boss ? 8 : 2) ? t : null;
    }
    let e = a.tgt;
    const n = s ? kiteDir(e, 1) : e ? kiteDir(e) : null;
    if (n && !s && dist(e, a) > PS.range + (e.boss ? 8 : 2)) {
      const t = a.kth.reduce(
        (t, s) => (!t || dist(s, a) < dist(t, a) ? s : t),
        null,
      );
      t && (e = a.tgt = t);
    }
    a.slowT = Math.max(0, (a.slowT || 0) - t);
    const l = dodgeDir(),
      o =
        (a.slowT > 0 ? 1 - ELITE_AF.frost.slow : 1) *
        (l
          ? fold(SPD_MS, PS.move, null, (t) => t.dodge)
          : fold(SPD_MS, PS.move) *
            (a.anim && "whirl" !== a.anim.k ? (n ? 0.6 : 0.35) : 1));
    let r = 0,
      i = 0;
    if (e) {
      const l = dist(e, a),
        o = skillReach(),
        c = o ? 0.9 * o : PS.range < 20 ? PS.range + 1 : 0.9 * PS.range;
      if (n) ((r = n[0]), (i = n[1]));
      else if (l > c && !s) {
        const t = Math.atan2(e.y - a.y, e.x - a.x);
        ((r = Math.cos(t)), (i = Math.sin(t)));
      }
      a.anim || setFace(Math.atan2(e.y - a.y, e.x - a.x));
      const d = fold(SPD_TICK, 1);
      ((a.atk -= t * d),
        a.atk <= 0 &&
          !a.leap &&
          !S.set.nob &&
          l <= PS.range + (e.boss ? 8 : 2) &&
          (basicAttack(e),
          (a.atk = 1 / fold(SPD_AS, PS.aps) + Math.max(a.atk, -t * d)),
          a.anim && (a.anim.gap = a.atk / Math.max(d, 0.01)),
          fire("basic", e)));
    } else if (!s || (G.tw && G.tw.rest > 0)) {
      const t = G.W / 2 - a.x,
        s = (G.top + G.H) / 2 - a.y,
        e = Math.hypot(t, s);
      e > 4 &&
        ((r = (t / e) * 0.5),
        (i = (s / e) * 0.5),
        a.anim || setFace(Math.atan2(s, t)));
    } else n && ((r = n[0]), (i = n[1]));
    if (
      (l && ((r = l[0]), (i = l[1])),
      (a.moving = !(!r && !i)),
      a.moving ? (a.walkT += t) : (a.walkT = 0),
      (a.x += (r * o + a.vx) * t),
      (a.y += (i * o + a.vy) * t),
      (a.mvx = r * o),
      (a.mvy = i * o),
      a.leap)
    ) {
      const s = a.leap,
        e = Math.min(1, (s.t += t) / s.T);
      ((a.x = s.x0 + (s.x1 - s.x0) * e),
        (a.y = s.y0 + (s.y1 - s.y0) * e),
        (a.z = Math.sin(e * Math.PI) * LEAP.z),
        (a.mvx = a.mvy = 0),
        e >= 1 && ((a.leap = null), (a.z = 0)));
    }
    const c = Math.pow(8e-4, t);
    ((a.vx *= c), (a.vy *= c), inArena(a));
    const d = activeGems();
    for (const t in a.sus) d.some((a) => a.id === t) || delete a.sus[t];
    if (d.some((t) => SKILLS[t.id].sus)) {
      const s = a.tgt;
      a.susI =
        (alive(s) && dist(s, a) <= 1.4 * PS.range + 10) ||
        G.mobs.some(attacking)
          ? 0
          : (a.susI ?? 2) + t;
    }
    const f = [],
      p = () =>
        !(
          a.anim &&
          a.anim.t < Math.min(0.6 * a.anim.dur, 0.5 * (a.anim.gap ?? 9))
        );
    for (const s of d)
      SKILLS[s.id].sus
        ? susTick(s)
        : ((a.cds[s.u] = (a.cds[s.u] ?? 0.6) - t),
          a.cds[s.u] <= 0 && !gemMods(s).trig && f.push(s));
    if (!tal("endb"))
      for (const t of f.sort((t, s) => a.cds[t.u] - a.cds[s.u]))
        p() && tryCast(t);
  }
  (tickPoison(t),
    tickAil(t),
    tickStk(t),
    tickMins(t),
    tickGsp(t),
    tickTurs(t),
    tickCrsAura(t),
    tickUq(t),
    tickHaz(t));
  const n = AGGRO_R(slatesOn().length || ssMap() ? MAP_N - 1 : S.map);
  for (const s of G.mobs) {
    if (((s.t += t), s.spawnT > 0)) {
      s.spawnT -= t;
      continue;
    }
    if (
      ((s.flash = Math.max(0, s.flash - t)),
      (s.slow = Math.max(0, s.slow - t)),
      s.tnt > 0 && (s.tnt -= t),
      s.crs)
    )
      for (const a in s.crs) s.crs[a] -= t;
    s.lunge = Math.max(0, s.lunge - t);
    const e = foeOf(s),
      l =
        (s.root > 0 ? 0 : 1) *
        (s.fst ? 1 - s.fst.n * FRZ.slow : 1) *
        (s.slow > 0 ? 1 - (s.chlv ?? AIL.chl.v) : 1) *
        (cursed(s, "sl") ? 1 - CRS.sl.v * PS.crs : 1),
      o = dist(s, e),
      r = s.ranged || (s.boss ? 15 : 9);
    ((s.x += s.vx * t), (s.y += s.vy * t));
    const i = Math.pow(0.004, t);
    if (((s.vx *= i), (s.vy *= i), s.dm))
      (S.trn.m || (s.hp = s.max),
        S.trn.p ? inArena(s) : ((s.x = s.hx), (s.y = s.hy), (s.vx = s.vy = 0)),
        !S.trn.a || G.dead || s.frz > 0 || s.stn > 0 || trnShoot(s, e, t * l));
    else if (G.dead) ((s.x += 6 * Math.sin(G.t + 10 * s.id) * t), inArena(s));
    else {
      if (s.dash) {
        const a = Math.min(1, t / s.dash.t);
        ((s.x += (s.dash.x - s.x) * a),
          (s.y += (s.dash.y - s.y) * a),
          (s.dash.t -= t),
          G.parts.push({
            x: s.x + rf(-4, 4),
            y: s.y,
            z: rf(1, 8),
            vx: 0,
            vy: 0,
            vz: 0,
            g: 0,
            life: 0.3,
            c: "#ff8a6a",
            s: 1,
          }),
          s.dash.t <= 0 && (s.dash = null),
          inArena(s));
        continue;
      }
      if (s.frz > 0 || s.stn > 0) inArena(s);
      else if (
        (s.bs && bossSkill(s, t),
        s.ea &&
          s.ag &&
          eliteTick(s, t * (s.slow > 0 ? 1 - (s.chlv ?? AIL.chl.v) : 1)),
        s.hold > 0)
      )
        ((s.hold -= t), (s.face = a.x < s.x ? -1 : 1), inArena(s));
      else {
        if ((!s.ag && (o < n || e !== a) && (s.ag = !0), s.ag)) {
          if (((s.face = e.x < s.x ? -1 : 1), o > r)) {
            const a = Math.atan2(e.y - s.y, e.x - s.x);
            ((s.x += Math.cos(a) * s.spd * l * t),
              (s.y += Math.sin(a) * s.spd * l * t));
          }
        } else {
          ((s.wt -= t),
            s.wt <= 0 &&
              ((s.wx = clamp(s.x + rf(-30, 30), 10, G.W - 10)),
              (s.wy = clamp(s.y + rf(-20, 20), G.top + 8, G.H - 6)),
              (s.wt = rf(2, 4.5))));
          const a = s.wx - s.x,
            e = s.wy - s.y,
            n = Math.hypot(a, e);
          if (n > 1.5 && s.wt > 1) {
            const o = 0.4 * s.spd * l;
            ((s.x += (a / n) * o * t),
              (s.y += (e / n) * o * t),
              Math.abs(a) > 0.5 && (s.face = a < 0 ? -1 : 1));
          }
        }
        for (const t of G.mobs)
          if (t !== s) {
            const a = s.x - t.x,
              e = s.y - t.y,
              n = a * a + e * e,
              l = s.boss || t.boss ? 14 : 7;
            if (n < l * l && n > 0.01) {
              const t = Math.sqrt(n),
                o = 0.5 * (l - t);
              ((s.x += (a / t) * o), (s.y += (e / t) * o));
            }
          }
        if ((inArena(s), (s.atk -= t * l), s.ag && o <= r + 1 && s.atk <= 0))
          if (
            ((s.atk = (s.boss ? 1.6 : 1.3) * (s.am || 1)),
            (s.lunge = 0.2),
            s.ranged)
          ) {
            const t =
              MON[s.type].pc ||
              ("imp" === s.type ? "#ff8a3a" : s.boss ? "#ff60ff" : "#7ad4ff");
            later(0.1, () => {
              alive(s) &&
                roPushFx(G.proj,{
                  k: "ebolt",
                  enemy: 1,
                  x: s.x,
                  y: s.y - 0.6 * s.h,
                  tgt: e,
                  spd: 75,
                  dmg: s.dmg,
                  col: t,
                  src: s,
                });
            });
          } else
            later(0.1, () => {
              alive(s) &&
                dist(s, e) <= r + 6 &&
                (e !== a
                  ? gspHurt(e, s.dmg, s)
                  : damagePlayer(s.dmg, s.x, s.y, s, 1),
                roPushFx(G.fx,{
                  k: "claw",
                  x: e.x,
                  y: e.y - 7,
                  t: 0,
                  life: 0.16,
                  face: s.face,
                }));
            });
      }
    }
  }
  for (let s = G.proj.length - 1; s >= 0; s--) {
    const e = G.proj[s];
    if (e)
      if (((e.age = (e.age || 0) + t), e.tgt)) {
        const n = e.tgt;
        if (e.enemy ? n !== a && !(n.hp > 0) : !alive(n)) {
          G.proj.splice(s, 1);
          continue;
        }
        const l = e.enemy ? n.y - 7 : n.y - 0.45 * n.h,
          o = Math.atan2(l - e.y, n.x - e.x);
        ((e.vx = Math.cos(o) * e.spd),
          (e.vy = Math.sin(o) * e.spd),
          (e.x += e.vx * t),
          (e.y += e.vy * t),
          projTrail(e),
          Math.hypot(n.x - e.x, l - e.y) < 4 + (n.boss ? 7 : 0) &&
            (G.proj.splice(s, 1),
            e.enemy
              ? (n !== a
                  ? gspHurt(n, e.dmg, e.src)
                  : G.dead || damagePlayer(e.dmg, e.x, e.y, e.src),
                burst(e.x, e.y + 6, 6, [e.col, "#ffffff"], 60, {
                  z: 6,
                  g: 30,
                  life: 0.3,
                  glow: 1,
                }))
              : projHit(e, n)));
      } else {
        if (((e.x += e.vx * t), (e.y += e.vy * t), (e.life -= t), e.enemy)) {
          !G.dead && Math.abs(e.x - a.x) < 4 && Math.abs(e.y - (a.y - 7)) < 6
            ? (G.proj.splice(s, 1),
              damagePlayer(e.dmg, e.x, e.y, e.src),
              burst(e.x, e.y + 6, 6, [e.col, "#ffffff"], 60, {
                z: 6,
                g: 30,
                life: 0.3,
                glow: 1,
              }))
            : (e.life <= 0 ||
                e.x < -10 ||
                e.x > G.W + 10 ||
                e.y < -10 ||
                e.y > G.H + 10) &&
              G.proj.splice(s, 1);
          continue;
        }
        if (e.one) {
          projTrail(e);
          const t = G.mobs.find(
            (t) =>
              alive(t) &&
              t !== e.skip &&
              t.spawnT <= 0 &&
              Math.abs(t.x - e.x) < 5 + (t.boss ? 6 : 0) &&
              Math.abs(t.y - 0.45 * t.h - e.y) < 0.6 * t.h,
          );
          if (t) {
            (G.proj.splice(s, 1), projHit(e, t));
            continue;
          }
          (e.life <= 0 ||
            e.x < -10 ||
            e.x > G.W + 10 ||
            e.y < -10 ||
            e.y > G.H + 10) &&
            (G.proj.splice(s, 1),
            "fire" === e.k &&
              burst(e.x, e.y + 6, 5, ["#ffb347", "#ff6a3a"], 40, {
                z: 6,
                glow: 1,
              }));
          continue;
        }
        if (
          (RAND() < 0.9 &&
            G.parts.push({
              x: e.x,
              y: e.y + 6,
              z: 6,
              vx: 0,
              vy: 0,
              vz: 0,
              g: 0,
              life: 0.22,
              c: RAND() < 0.5 ? "#d4ff8a" : "#ffffff",
              s: 1,
              glow: 1,
            }),
          e.ret && e.life <= e.ret)
        ) {
          const t = Math.hypot(e.vx, e.vy),
            s = Math.atan2(a.y - 6 - e.y, a.x - e.x);
          ((e.vx = Math.cos(s) * t),
            (e.vy = Math.sin(s) * t),
            (e.hit = new Set()),
            (e.ret = 0));
        }
        for (const t of G.mobs)
          !e.hit.has(t) &&
            t.spawnT <= 0 &&
            Math.abs(t.x - e.x) < 6 + (t.boss ? 6 : 0) &&
            Math.abs(t.y - 0.45 * t.h - e.y) < 0.6 * t.h &&
            (e.hit.add(t),
            hitMob(
              t,
              e.mult,
              Object.assign(
                { kb: 70, sx: e.x - e.vx, sy: e.y - e.vy + 6 },
                e.o,
              ),
            ));
        (e.life <= 0 ||
          e.x < -10 ||
          e.x > G.W + 10 ||
          e.y < -10 ||
          e.y > G.H + 10) &&
          G.proj.splice(s, 1);
      }
  }
  for (let a = G.fx.length - 1; a >= 0; a--) {
    const s = G.fx[a];
    if (((s.t += t), "rain" === s.k && s.t >= 0 && !s.done)) {
      s.done = 1;
      for (const t of mobsNear(s.x, s.y, s.r))
        hitMob(t, s.mult, Object.assign({ kb: 25, sx: t.x, sy: t.y - 1 }, s.o));
      burst(s.x, s.y, 8, ["#d4ff8a", "#ffffff", "#cfc2a0"], 60, {
        z: 0,
        vz: 50,
        life: 0.4,
      });
    }
    if ("trap" === s.k && s.t >= TRAP.arm && !s.done) {
      const t = G.mobs.find(
        (t) =>
          alive(t) &&
          t.spawnT <= 0 &&
          Math.hypot(t.x - s.x, 1.3 * (t.y - s.y)) <=
            TRAP.reach + (t.boss ? 6 : 0),
      );
      t && trapBoom(s, t);
    }
    if ("mtr" === s.k && s.t >= 0 && !s.done) {
      s.done = 1;
      for (const t of mobsNear(s.x, s.y - 2, s.r))
        hitMob(t, s.mult, Object.assign({ kb: 120, sx: s.x, sy: s.y }, s.o));
      (roPushFx(G.fx,
        { k: "boom", x: s.x, y: s.y - 3, r: 0.7 * s.r, t: 0, life: 0.4 },
        { k: "ring", x: s.x, y: s.y, r: s.r, t: 0, life: 0.4, col: "#ff8a3a" },
      ),
        burst(
          s.x,
          s.y,
          34,
          ["#fff0a0", "#ffb347", "#ff6a3a", "#d8443a", "#4a3030"],
          150,
          { z: 4, vz: 90, glow: 1 },
        ),
        shake(0.3),
        hitStop(0.07),
        sfx("big"));
    }
    if ("lava" === s.k && (s.acc += t) >= 0.5) {
      s.acc -= 0.5;
      for (const t of mobsNear(s.x, s.y - 2, s.r)) ailment(t, "brn", s.d, s.ax);
    }
    if ("mia" === s.k && (s.acc += t) >= MIA.iv) {
      s.acc -= MIA.iv;
      for (const t of mobsNear(s.x, s.y - 2, s.r))
        hitMob(t, s.mult, Object.assign({ kb: 0, sx: s.x, sy: s.y }, s.o));
    }
    if ("bliz" === s.k && (s.acc += t) >= BLZ.iv) {
      s.acc -= BLZ.iv;
      for (const t of mobsNear(s.x, s.y - 2, s.r))
        hitMob(t, s.mult, Object.assign({ kb: 8, sx: s.x, sy: s.y }, s.o));
    }
    if ("fiss" === s.k && (s.acc += t) >= 0.5) {
      s.acc -= 0.5;
      for (const t of G.mobs)
        if (
          alive(t) &&
          t.spawnT <= 0 &&
          segDist(t.x, t.y - 2, s.x, s.y, s.x2, s.y2) <= s.w
        ) {
          const a = t.bld;
          !a || a.t <= 0
            ? (t.bld = { dps: s.dps, t: AIL.bld.t * s.ax, acc: 0 })
            : ((a.t = Math.max(a.t, AIL.bld.t * s.ax)),
              (a.dps = Math.max(a.dps, s.dps)));
        }
    }
    s.t >= s.life && G.fx.splice(a, 1);
  }
  for (let a = G.flashes.length - 1; a >= 0; a--)
    ((G.flashes[a].t += t),
      G.flashes[a].t > (G.flashes[a].ring ? 0.6 : 0.22) &&
        G.flashes.splice(a, 1));
  for (let a = G.nums.length - 1; a >= 0; a--)
    ((G.nums[a].t += t),
      G.nums[a].t > (G.nums[a].big ? 1 : 0.75) && G.nums.splice(a, 1));
  for (let a = G.parts.length - 1; a >= 0; a--) {
    const s = G.parts[a];
    ((s.life -= t),
      s.life <= 0
        ? G.parts.splice(a, 1)
        : ((s.x += s.vx * t),
          (s.y += s.vy * t),
          (s.z += s.vz * t),
          (s.vz -= s.g * t),
          s.z < 0 &&
            ((s.z = 0), (s.vz *= -0.3), (s.vx *= 0.5), (s.vy *= 0.5))));
  }
  for (let s = G.orbs.length - 1; s >= 0; s--) {
    const e = G.orbs[s];
    if (((e.t += t), e.t < 0.4))
      ((e.x += e.vx * t),
        (e.y += e.vy * t),
        (e.z = Math.max(0, e.z + e.vz * t)),
        (e.vz -= 220 * t));
    else {
      const n = a.x,
        l = a.y - 6,
        o = Math.atan2(l - (e.y - e.z), n - e.x),
        r = 60 + 260 * (e.t - 0.4);
      ((e.x += Math.cos(o) * r * t),
        (e.y += Math.sin(o) * r * t),
        (e.z = Math.max(0, e.z - 30 * t)),
        (Math.hypot(n - e.x, l - (e.y - e.z)) < 4 || e.t > 2.5) &&
          G.orbs.splice(s, 1));
    }
  }
  for (let s = G.drops.length - 1; s >= 0; s--) {
    const e = G.drops[s];
    if (((e.t += t), e.landed)) {
      if (e.t > 1.2 && !G.dead) {
        const n = Math.atan2(a.y - 4 - e.y, a.x - e.x),
          l = Math.hypot(a.x - e.x, a.y - 4 - e.y),
          o = Math.min(l, (40 + 300 * (e.t - 1.2)) * t);
        ((e.x += Math.cos(n) * o),
          (e.y += Math.sin(n) * o),
          l - o < 5 &&
            (pickup(e),
            G.drops.splice(s, 1),
            sfx("pick"),
            G.flashes.push({
              x: a.x,
              y: a.y - 7,
              t: 0,
              c: e.col,
              r: 5 + 2 * e.tier,
            })));
      }
    } else
      ((e.x += e.vx * t),
        (e.y += e.vy * t),
        (e.z += e.vz * t),
        (e.vz -= 260 * t),
        e.z <= 0 &&
          ((e.z = 0),
          e.vz < -40 && (e.bn = (e.bn || 0) + 1) < 3
            ? ((e.vz *= -0.35), (e.vx *= 0.5), (e.vy *= 0.5))
            : ((e.landed = 1),
              (e.t = 0),
              (e.mat || e.tier >= 2) &&
                sfx(e.mat ? "mat" : "drop", e.it && e.it.uq ? 4 : e.tier),
              (e.y = clamp(e.y, G.top + 2, G.H - 4)),
              (e.x = clamp(e.x, 4, G.W - 4)))));
  }
  ((G.shake = Math.max(0, G.shake - t)),
    (G.hurtFlash = Math.max(0, G.hurtFlash - t)));
}
const STASH_MAX = 500,
  BAG_MAX = 5e3,
  autoSalv = (t) =>
    !t.my &&
    (t.sock
      ? S.set.auto[5]
      : t.uq
        ? S.set.auto[4]
        : S.set.auto[4 === t.rar ? 6 : t.rar]) &&
    !keepMatch(t);
function takeItem(t) {
  const a = ses(),
    s = t.uq ? 4 : t.sock ? 5 : 4 === t.rar ? 6 : t.rar;
  a.dr[s] = (a.dr[s] || 0) + 1;
  const e = autoSalv(t)
    ? "salv"
    : S.bag.length >= BAG_MAX && !t.my && t.rar < 4
      ? "full"
      : "";
  if (e) {
    const s = salvageValue(t);
    return ((S.ash += s), (a.ash += s), e);
  }
  return (S.bag.push(t), "bag");
}
function pickup(t) {
  if (t.sl && t.sl.my)
    return (
      takeSlate(t.sl),
      lootToast(`獲得主宰：${t.sl.name}！`, "rm", 1),
      sfx("lvl"),
      ui.badge("bag", 1),
      ui.refreshIf("bag"),
      void markDirty()
    );
  if (t.sl) {
    const a = takeSlate(t.sl);
    return (
      lootToast(
        "full" === a
          ? "石板已滿，自動分解"
          : "salv" === a
            ? `自動分解石板：${t.sl.name}`
            : `獲得石板：${t.sl.name}`,
        "salv" === a ? "" : "r3",
        1,
      ),
      "bag" === a && (ui.badge("bag", 1), ui.refreshIf("bag", "map")),
      void markDirty()
    );
  }
  if (t.gm)
    return (
      (t.gm.nw = 1),
      S.gems.push(t.gm),
      lootToast(
        `獲得${SKILLS[t.gm.id].leg ? "傳說" : t.gm.sx ? "穿梭" : "變異"}技能寶石：${SKILLS[t.gm.id].n}`,
        "r3",
        1,
      ),
      ui.badge("skill", 1),
      ui.refreshIf("skill"),
      void markDirty()
    );
  if (t.mk)
    return (
      S.tw.mk++,
      lootToast(`獲得無限印記（${S.tw.mk}/${MONARCH.mk}）`, "r3", 1),
      ui.badge("map", 1),
      ui.refreshIf("map"),
      void markDirty()
    );
  if (null != t.ssf)
    return (
      S.ssf[t.ssf]++,
      lootToast(`獲得${GODS[t.ssf].fr}`, "r3", 1),
      ui.badge("map", 1),
      ui.refreshIf("map"),
      ui.hud(!0),
      void markDirty()
    );
  if (null != t.tk || null != t.fr) {
    const a = null != t.tk,
      s = a ? t.tk : t.fr;
    return (
      S.gd[a ? "t" : "f"][s]++,
      lootToast(`獲得${a ? GUARD[s].tk : GUARD[s].fr}`, "r3", 1),
      ui.badge("map", 1),
      ui.refreshIf("map"),
      void markDirty()
    );
  }
  if ("m1" === t.mat)
    return (
      (S.mat.m1 = (S.mat.m1 || 0) + 1),
      lootToast("獲得奇蹟石！", "r4", 1),
      sfx("lvl"),
      ui.refreshIf("alch"),
      void markDirty()
    );
  if (t.mat)
    return (
      (S.mat[t.mat] = (S.mat[t.mat] || 0) + 1),
      "p1" === t.mat && autoMergeP(),
      lootToast(
        `獲得${MATS[t.mat].n}`,
        t.tier >= 3 ? "r3" : t.tier >= 2 ? "rs" : "",
        0,
      ),
      ui.refreshIf("alch"),
      void markDirty()
    );
  const a = t.it,
    s = takeItem(a);
  ("full" === s && lootToast("背包已滿，自動分解"),
    "bag" === s &&
      (a.my
        ? (lootToast(`獲得主宰：${a.name}！`, "rm", 1), sfx("lvl"))
        : a.uq
          ? lootToast(`獲得獨特裝備：${a.name}`, "ru")
          : a.sock
            ? lootToast(
                `獲得插槽裝備・${"a" === a.sock.mode ? "任意" : "異種"}（${a.sock.n} 孔）`,
                rarClass(a),
              )
            : 4 === a.rar
              ? (lootToast(`獲得神話裝備：${itemName(a)}！`, "r4", 1),
                sfx("lvl"))
              : 3 === a.rar
                ? lootToast(`獲得傳奇裝備：${itemName(a)}`, "r3")
                : termLog(
                    `獲得${rarLabel(a)}裝備：${itemName(a)}`,
                    rarClass(a),
                  ),
      ui.badge("bag", 1),
      ui.refreshIf("bag"),
      markDirty()));
}
function quest(t, a) {
  const s = QUESTS[S.q];
  if (s && s.k === t && ("boss" !== t || S.beat[s.m || 0])) {
    if (
      ("level" === t
        ? (S.qp = S.lvl)
        : "trial" === t
          ? (S.qp = S.tal.tr)
          : "link" === t
            ? (S.qp = activeGems().some((t) => linkedSupports(t).length)
                ? 1
                : 0)
            : (S.qp += a),
      S.qp >= s.n)
    ) {
      const t = s.rw,
        a = [];
      if (
        (t.pot && ((S.pot += t.pot), a.push(`藥水 ×${t.pot}`)),
        t.ash && ((S.ash += t.ash), a.push(`Zeny ${t.ash}`)),
        t.mat)
      )
        for (const s in t.mat)
          ((S.mat[s] = (S.mat[s] || 0) + t.mat[s]),
            a.push(`${MATS[s].n} ×${t.mat[s]}`));
      if (null != t.gem) {
        const s = CLASS[S.cls].gems[t.gem];
        (giveGem(s),
          a.push(`技能寶石「${SKILLS[s].n}」`),
          ui.badge("skill", 1));
      }
      (toast(`任務完成：${a.join("、")}`, "lvl"),
        sfx("quest"),
        S.q++,
        (S.qp = 0),
        stEv("q", { q: S.q - 1 }));
      const e = QUESTS[S.q];
      (!e || ("level" !== e.k && "link" !== e.k && "trial" !== e.k)
        ? e && "boss" === e.k && quest("boss", 1)
        : quest(e.k, 0),
        markDirty());
    }
    ui.refreshIf("more");
  }
}
const ssOpen = () => !!SEASON.on && S.lvl >= SEASON.lv;
function ssPull(t, a, s, e) {
  const n = a - t.x,
    l = s - t.y,
    o = Math.hypot(n, l);
  if (o < 1) return;
  const r = Math.min(o, e);
  ((t.x += (n / o) * r), (t.y += (l / o) * r), inArena(t));
}
function pullTo(t, a, s, e) {
  !t.boss &&
    alive(t) &&
    ((t.vx = (a - t.x) * e * 5.5), (t.vy = (s - t.y) * e * 5.5));
}
const hpTop = (t, a) => {
  let s = null;
  for (const e of G.mobs)
    e !== a &&
      e.spawnT <= 0 &&
      (!t || dist(e, G.pl) <= t) &&
      (!s || e.hp > s.hp) &&
      (s = e);
  return s;
};
function densest(t) {
  let a = null,
    s = -1;
  for (const e of G.mobs) {
    if (e.spawnT > 0 || (t && Math.hypot(e.x - t.x, e.y - t.y) < 50)) continue;
    let n = 0;
    for (const t of G.mobs)
      t !== e &&
        Math.abs(t.x - e.x) < 30 &&
        Math.hypot(t.x - e.x, t.y - e.y) < 30 &&
        n++;
    n > s && ((s = n), (a = e));
  }
  return a;
}
function ssDivine(t) {
  if (
    !t ||
    t.uq ||
    t.sock ||
    t.sl ||
    t.rar < 1 ||
    !t.af.length ||
    RAND() >= SS.dv
  )
    return;
  const a = DV_K[ri(0, DV_K.length - 1)];
  t.af[ri(0, t.af.length - 1)] = rollAffix(a, rollTier(a, t.ilvl));
}
function ssBossDrop(t) {
  if (RAND() >= SS.art) return;
  const a = GODS[t.god].art;
  (later(0.6, () => artGain(a)),
    G.flashes.push({ x: t.x, y: t.y - 10, t: 0, ring: 1, c: GODS[t.god].c }));
}
const artCur = () => (S.art.on && S.art.has[S.art.on] ? S.art.on : "");
function artGain(t) {
  const a = S.art.has;
  (a[t]
    ? (artXp(t, ART.dup),
      toast(`重複的「${ARTS[t].n}」已獻祭：+${ART.dup} 經驗`, "rm", 1))
    : ((a[t] = { lv: 1, xp: 0 }),
      artCur() || (S.art.on = t),
      toast(`獲得神器「${ARTS[t].n}」！`, "rm", 1),
      ui.badge("char", 1)),
    sfx("win"),
    recalc(),
    markDirty(),
    ui.refreshIf("char"));
}
function artXp(t, a) {
  const s = S.art.has[t];
  if (!s || s.lv >= ART.max) return;
  s.xp += a;
  let e = 0;
  for (; s.lv < ART.max && s.xp >= ART.need(s.lv);)
    ((s.xp -= ART.need(s.lv)), s.lv++, (e = 1));
  (s.lv >= ART.max && (s.xp = 0),
    e &&
      (recalc(),
      toast(
        `${ARTS[t].n} 升至 Lv${s.lv}${s.lv === ART_LV[1] ? "・進化" : s.lv === ART_LV[2] ? "・覺醒" : ""}！`,
        "lvl",
      ),
      sfx("lvl"),
      markDirty(),
      ui.refreshIf("char")));
}
function zeusHit(t, a, s, e) {
  if (!s || e.zeus) return;
  const n = ARTS.zeus,
    l = G.zeus || (G.zeus = { t: -9, n: 0 });
  if (G.t - l.t < n.cd) return;
  const o = artStage(tal("art_zeus")),
    r = n.n2[o ? 1 : 0],
    i =
      2 === o && ++l.n % n.aw === 0
        ? G.mobs.filter((a) => a !== t && a.spawnT <= 0)
        : nearestMobs(t.x, t.y, n.r, r + 1)
            .filter((a) => a !== t)
            .slice(0, r);
  if (i.length) {
    ((l.t = G.t), sfx("chain"));
    for (const t of i)
      (roPushFx(G.fx,{
        k: "zap",
        x: t.x + ri(-6, 6),
        y: G.top,
        x2: t.x,
        y2: t.y - 0.45 * t.h,
        t: 0,
        life: 0.18,
        s: ri(1, 999),
        col: "#ffe066",
      }),
        dealMob(t, a * n.k, !1, "#ffe066", "art:zeus"),
        2 === o &&
          alive(t) &&
          !t.boss &&
          G.t >= (t.sti || 0) &&
          ((t.stn = n.stun), (t.sti = G.t + 2)));
  }
}
function vortTick(t) {
  const a = ARTS.posei,
    s = artStage(tal("art_posei")),
    e = G.vort,
    n = a.r[s ? 1 : 0] * PS.area;
  if (2 === s) {
    for (; e.length < 2;) e.push({ x: G.pl.x, y: G.pl.y, t: 1e9 });
    const a = densest();
    a && ssPull(e[0], a.x, a.y, 40 * t);
    const s = densest(e[0]);
    s && ssPull(e[1], s.x, s.y, 40 * t);
  } else if ((G.vcd = (G.vcd ?? 1) - t) <= 0) {
    const t = densest();
    t &&
      (e.push({ x: t.x, y: t.y, t: a.t[0] }),
      (G.vcd = a.cd),
      sfx("nova"),
      G.flashes.push({ x: t.x, y: t.y, t: 0, ring: 1, c: "#9ad8ff" }));
  }
  for (let s = e.length - 1; s >= 0; s--) {
    const l = e[s];
    if (((l.r = n), (l.t -= t) <= 0)) e.splice(s, 1);
    else
      for (const s of G.mobs)
        s.spawnT <= 0 &&
          Math.hypot(s.x - l.x, 1.4 * (s.y - l.y)) <= n &&
          (s.boss || ssPull(s, l.x, l.y, a.pull * t),
          (s.vin = Math.min(
            a.cap / a.vk,
            (s.vinT > G.t - 0.25 ? s.vin : 0) + t,
          )),
          (s.vinT = G.t));
  }
}
function jcTick() {
  const t = G.jc;
  alive(t.m) || ((t.m = hpTop()), t.m || (t.n = 0));
}
function jcKill(t) {
  const a = G.jc;
  t === a.m &&
    ((a.m = hpTop()),
    (a.n = a.m ? Math.min(5, a.n + 1) : 0),
    a.m &&
      G.flashes.push({
        x: a.m.x,
        y: a.m.y - a.m.h,
        t: 0,
        ring: 1,
        c: "#ffd84a",
      }));
}
const kingOn = () =>
    1 === activeGems().filter((t) => !SKILLS[t.id].aura).length,
  kingCd = () => (tal("kingCd") && kingOn() ? 1 - tal("kingCd") : 1);
function vortHit(t, a) {
  a.min || pullTo(t, G.pl.x, G.pl.y, uv("vortg", 0) / 100);
}
function abyssHurt(t) {
  const a = (t * uv("abyssc", 0)) / 100,
    s = uv("abyssc", 1);
  a <= 0 || ((S.hp += a), G.pl.abq.push({ r: a / s, t: s }));
}
function abyssTick(t) {
  const a = G.pl.abq;
  if (!a.length) return;
  if (G.dead) return void (a.length = 0);
  let s = 0;
  for (const e of a) {
    const a = Math.min(e.t, t);
    ((s += e.r * a), (e.t -= a));
  }
  ((G.pl.abq = a.filter((t) => t.t > 0)), (S.hp -= s), S.hp <= 0 && hpOut());
}
function chainHit(t, a, s) {
  let e = t.lnk && t.lnk.t > G.t && alive(t.lnk.o) ? t.lnk.o : null;
  if (!e) {
    if (((e = nearestMobs(t.x, t.y, 60, 2).find((a) => a !== t)), !e)) return;
    const a = G.t + uv("schain", 1);
    ((t.lnk = { o: e, t: a }), (e.lnk = { o: t, t: a }));
  }
  dealMob(e, (a * uv("schain", 0)) / 100, !1, "#b07aff", "uq:schain");
}
const undK = () => ((PS.mn + PS.mx) / 2) * PS.minMul;
function undRaise(t) {
  const a = ARTS.hades,
    s = artStage(tal("art_hades"));
  G.dead ||
    G.und.length >= a.cap[s] + PS.minion ||
    RAND() >= a.p ||
    G.und.push({
      x: t.x,
      y: t.y,
      t: a.t[s],
      rise: 0.35,
      atk: 0.3,
      tgt: null,
      face: 1,
      lg: 0,
    });
}
function undTick(t) {
  if (G.dead) return void (G.und.length = 0);
  const a = ARTS.hades,
    s = artStage(tal("art_hades"));
  for (const e of G.und) {
    if (((e.t -= t), e.lg > 0 && (e.lg -= t), e.rise > 0)) {
      e.rise -= t;
      continue;
    }
    if (!alive(e.tgt)) {
      e.tgt = null;
      let t = 1e9;
      for (const a of G.mobs) {
        if (a.spawnT > 0) continue;
        const s = dist(a, e);
        s < t && ((t = s), (e.tgt = a));
      }
    }
    const n = e.tgt;
    if (!n) continue;
    const l = n.x - e.x,
      o = n.y - e.y,
      r = Math.hypot(l, o) || 1;
    if (((e.face = l < 0 ? -1 : 1), r > 8)) {
      const s = Math.min(r - 6, a.spd * (1 + PS.minAs) * t);
      ((e.x += (l / r) * s), (e.y += (o / r) * s));
      continue;
    }
    if ((e.atk -= t) > 0) continue;
    ((e.atk = a.as[s] / minAtk()), (e.lg = 0.15));
    const i = tal("minCrit") ? PS.critRaw : 0,
      c = i > 0 && 100 * RAND() < i,
      d =
        undK() *
        a.k *
        (1 + tal("minDmg")) *
        (c ? (PS.critm + critOvr(PS, i, !0)) / 100 : 1),
      f = 2 === s ? mobsNear(n.x, n.y - 3, a.spl.r).filter((t) => t !== n) : [];
    dealMob(n, d, c, "#c08aff", "art:hades");
    for (const t of f) dealMob(t, d * a.spl.k, c, "#c08aff", "art:hades");
    f.length &&
      roPushFx(G.fx,{
        k: "ring",
        x: n.x,
        y: n.y - 3,
        r: 0.7 * a.spl.r,
        t: 0,
        life: 0.25,
        col: "#b07aff",
      });
  }
  G.und = G.und.filter((t) => t.t > 0);
}
(Object.assign(TAL_ON, {
  dv_judg: {
    tick: (t) => {
      const a = G.dvj;
      (a.t -= t) > 0 ||
        ((a.t = DV_JUDG.cd),
        (a.m = hpTop(DV_JUDG.r)),
        a.m &&
          G.flashes.push({
            x: a.m.x,
            y: a.m.y - a.m.h,
            t: 0,
            ring: 1,
            c: "#ffd84a",
          }));
    },
  },
  dv_pull: {
    hit: (t, a, s, e) => {
      e.tg &&
        e.tg.includes("aoe") &&
        pullTo(t, e.sx ?? G.pl.x, e.sy ?? G.pl.y, tal("dv_pull") / 100);
    },
  },
  dv_exec: {
    dealt: (t) => {
      t.hp > 0 &&
        t.hp <
          ((t.max * tal("dv_exec")) / 100) * (t.elite || t.boss ? 0.5 : 1) &&
        ((t.hp = 0),
        burst(t.x, t.y, 10, ["#b07aff", "#2e1e40"], 90, { z: 0.5 * t.h }));
    },
  },
  dv_soul: {
    kill: () => {
      const t = Math.min(1, tal("dv_soul") / 10);
      for (const a in G.pl.cds) G.pl.cds[a] -= t;
    },
  },
  artXp: {
    kill: (t) => {
      if (t.dm) return;
      const a = artCur();
      a && artXp(a, ART.kp[t.boss ? 2 : t.elite ? 1 : 0]);
    },
  },
  art_zeus: { hit: (t, a, s, e) => zeusHit(t, a, s, e) },
  art_posei: {
    tick: (t) => vortTick(t),
    off: () => {
      G.vort.length = 0;
    },
  },
  art_hades: {
    kill: (t) => undRaise(t),
    tick: (t) => undTick(t),
    off: () => {
      G.und.length = 0;
    },
  },
}),
  HIT_MUL.push(
    {
      k: "dv:judg",
      lab: () => tal("dv_judg") && `審判標記 +${tal("dv_judg")}%`,
      f: (t, a) =>
        tal("dv_judg") && a === G.dvj.m ? t * (1 + tal("dv_judg") / 100) : t,
    },
    {
      k: "dv:press",
      lab: () =>
        tal("dv_press") &&
        `附近每隻敵人 +${tal("dv_press")}%（最多 ${DV_PRESS.max} 隻）`,
      f: (t) =>
        tal("dv_press") ? t * (1 + (tal("dv_press") / 100) * pressN()) : t,
    },
  ),
  TAKE_MUL.push({
    k: "art:posei",
    lab: () => tal("art_posei") && `漩渦中每秒 +${pc(ARTS.posei.vk)}%`,
    f: (t, a) => (a.vinT > G.t - 0.25 ? t * (1 + ARTS.posei.vk * a.vin) : t),
  }),
  HURT_MUL.push({
    k: "dv:reign",
    f: () =>
      tal("dv_reign")
        ? 1 -
          (tal("dv_reign") / 100) *
            Math.min(
              DV_REIGN.max,
              G.mobs.filter((t) => t.elite && dist(t, G.pl) <= DV_REIGN.r)
                .length,
            )
        : 1,
  }));
const SP = { hero: {}, mon: {}, icon: {} };
function cnv(t, a) {
  const s = document.createElement("canvas");
  return ((s.width = t), (s.height = a), s);
}
function outlineRows(t) {
  const a = t.length,
    s = t[0].length,
    e = [];
  for (let n = -1; n <= a; n++) {
    let a = "";
    for (let e = -1; e <= s; e++) {
      const s = (t[n] || "")[e];
      if (s && "." !== s) {
        a += s;
        continue;
      }
      let l = !1;
      for (const [a, s] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const o = (t[n + s] || "")[e + a];
        o && "." !== o && (l = !0);
      }
      a += l ? "k" : ".";
    }
    e.push(a);
  }
  return e;
}
function paint(t, a, s) {
  const e = cnv(t[0].length, t.length),
    n = e.getContext("2d");
  return (
    t.forEach((t, e) => {
      for (let l = 0; l < t.length; l++) {
        const o = t[l];
        "." !== o &&
          ((n.fillStyle =
            "Z" === o ? ((l + e) % 2 ? s[0] : s[2]) : a[o] || "#f0f"),
          n.fillRect(l, e, 1, 1));
      }
    }),
    e
  );
}
function tintC(t, a) {
  const s = cnv(t.width, t.height),
    e = s.getContext("2d");
  return (
    e.drawImage(t, 0, 0),
    (e.globalCompositeOperation = "source-in"),
    (e.fillStyle = a),
    e.fillRect(0, 0, s.width, s.height),
    s
  );
}
function flipC(t) {
  const a = cnv(t.width, t.height),
    s = a.getContext("2d");
  return (s.translate(t.width, 0), s.scale(-1, 1), s.drawImage(t, 0, 0), a);
}
function pcirc(t, a, s, e) {
  ((a = Math.round(a)), (s = Math.round(s)));
  for (let n = -(e = Math.max(1, Math.round(e))); n <= e; n++) {
    const l = Math.floor(Math.sqrt(e * e - n * n + 0.8 * e));
    t.fillRect(a - l, s + n, 2 * l + 1, 1);
  }
}
function pell(t, a, s, e, n) {
  e = Math.max(1, e);
  for (let l = -(n = Math.max(1, n)); l <= n; l++) {
    const o = Math.round(e * Math.sqrt(Math.max(0, 1 - (l / n) * (l / n))));
    t.fillRect(Math.round(a - o), Math.round(s + l), 2 * o + 1, 1);
  }
}
function hash2(t, a) {
  let s = (Math.imul(0 | t, 374761393) + Math.imul(0 | a, 668265263)) | 0;
  return (
    (s = Math.imul(s ^ (s >>> 13), 1274126177)),
    ((s ^ (s >>> 16)) >>> 0) / 4294967296
  );
}
function vn2(t, a) {
  const s = Math.floor(t),
    e = Math.floor(a),
    n = t - s,
    l = a - e,
    o = n * n * (3 - 2 * n),
    r = l * l * (3 - 2 * l),
    i = hash2(s, e),
    c = hash2(s + 1, e),
    d = hash2(s, e + 1);
  return (
    i + (c - i) * o + (d - i) * r + (i - c - d + hash2(s + 1, e + 1)) * o * r
  );
}
function mulberry(t) {
  return () => {
    t = (1831565813 + (t |= 0)) | 0;
    let a = Math.imul(t ^ (t >>> 15), 1 | t);
    return (
      (a = (a + Math.imul(a ^ (a >>> 7), 61 | a)) ^ a),
      ((a ^ (a >>> 14)) >>> 0) / 4294967296
    );
  };
}
function buildSprites() {
  for (const t in HERO_PAL) {
    const a = HERO_PAL[t],
      s = { down: [], up: [], side: [] },
      e = (s, e, n, l) => {
        const o = paint([...s, ...e, ...n], a),
          r = cnv(16, 20),
          i = r.getContext("2d");
        return (
          i.drawImage(o, 0, 4),
          "mage" === t && i.drawImage(paint(HAT, HAT_PAL), l ? 1 : 2, 0),
          "bow" === t && l && i.drawImage(paint(HOOD_TIP, a), 0, 7),
          r
        );
      };
    (HERO.LD.forEach((t) => {
      (s.down.push(e(HERO.HD, HERO.BD, t)), s.up.push(e(HERO.HU, HERO.BU, t)));
    }),
      HERO.LS.forEach((t) => s.side.push(e(HERO.HS, HERO.BS, t, 1))),
      (s.white = {}));
    for (const t of ["down", "up", "side"])
      s.white[t] = s[t].map((t) => tintC(t, "#ffffff"));
    SP.hero[t] = s;
  }
  for (const t in ASC)
    for (const a of ASC[t]) {
      const s = Object.assign({}, HERO_PAL[t], a.pal),
        e = { down: [], up: [], side: [] },
        n = ASC_ART[a.k] || {},
        l = Object.assign({}, s, ASC_PAL),
        o =
          void 0 === n.hat
            ? HAT_PAL
            : n.hat && Object.assign({}, HAT_PAL, n.hat),
        r = (t) =>
          n.d &&
          ("u" === t
            ? n.u || n.d
            : "s" === t
              ? n.s || n.d.map((t) => t.slice(1) + ".")
              : n.d),
        i = (e, i, c, d) => {
          const f = cnv(16, 20),
            p = f.getContext("2d"),
            u = "s" === d;
          return (
            p.drawImage(paint([...e, ...i, ...c], s), 0, 4),
            "mage" === t && o && p.drawImage(paint(HAT, o), u ? 1 : 2, 0),
            "bow" === t &&
              u &&
              "snipe" !== a.k &&
              p.drawImage(paint(HOOD_TIP, s), 0, 7),
            r(d) && p.drawImage(paint(r(d), l), 0, n.y0),
            f
          );
        };
      (HERO.LD.forEach((t) => {
        (e.down.push(i(HERO.HD, HERO.BD, t, "d")),
          e.up.push(i(HERO.HU, HERO.BU, t, "u")));
      }),
        HERO.LS.forEach((t) => e.side.push(i(HERO.HS, HERO.BS, t, "s"))),
        (e.white = {}));
      for (const t of ["down", "up", "side"])
        e.white[t] = e[t].map((t) => tintC(t, "#ffffff"));
      SP.hero[t + ":" + a.k] = e;
    }
  for (const t in MSPR) {
    const a = MSPR[t],
      s = Object.assign({ k: INK }, a.pal),
      e = a.f.map((t) => paint(outlineRows(t), s));
    SP.mon[t] = {
      fr: e,
      white: e.map((t) => tintC(t, "#ffffff")),
      gold: e.map((t) => tintC(t, "#ffd84a")),
      red: e.map((t) => tintC(t, "#ff4a5a")),
      w: e[0].width,
      h: e[0].height,
    };
  }
  SP.mat = {};
  for (const [t, a] of [
    ["x", [".AA.", "ACAA", "AAAB", ".BB."]],
    ["p", ["AAAA", "ACAB", "AAAB", ".AB."]],
    ["i", [".A..", ".AA.", "ACAA", "AAAB", ".BB."]],
    ["s", [".AA.", "A..B", "AAAB", "ACAB", ".BB."]],
    ["r", [".AA.", "ACAB", "AAAB", ".BB."]],
    ["c", [".A..", "ACk.", "AkAB", ".BB."]],
    ["m", [".CA.", "ACAB", "AACB", ".BB."]],
    ["h", [".AA.", "AkkB", "AkkB", ".BB."]],
  ]) {
    const s = MAT_COL[t];
    SP.mat[t] = paint(outlineRows(a), {
      k: INK,
      A: s,
      B: shade(s, -0.35),
      C: "#ffffff",
    });
  }
  ((SP.mat.m = paint(
    outlineRows(["..w..", ".ywp.", "cyWpv", "wWwWw", ".cwv.", "..p.."]),
    MIR_PAL,
  )),
    (SP.slate = [0, 1, 2, 3].map((t) =>
      paint(outlineRows([".AAA.", "ACuCB", "AuuuB", "ACuAB", "BBBBB"]), {
        k: INK,
        A: "#7a7290",
        B: "#4a4460",
        C: "#b0a8c8",
        u: RAR_COL[t],
      }),
    )),
    (SP.ssf = GODS.map((t) =>
      paint(outlineRows(["..A..", ".ACA.", "ACwCB", ".ACB.", "..B.."]), {
        k: INK,
        A: t.c,
        B: shade(t.c, -0.35),
        C: "#ffffff",
        w: "#fff6d0",
      }),
    )),
    (SP.mk = paint(outlineRows([".AAA.", "AwCwA", "ACwCB", "AwCwB", ".BBB."]), {
      k: INK,
      A: MONARCH.c,
      B: shade(MONARCH.c, -0.35),
      C: "#ffffff",
      w: "#f0f0ff",
    })),
    (SP.pouch = [0, 1, 2, 3, 4].map((t) =>
      paint(outlineRows([".ww.", "AAAA", "ACAA", "AAAB", ".BB."]), {
        k: INK,
        w: "#f4efe6",
        A: RAR_COL[t],
        B: shade(RAR_COL[t], -0.35),
        C: "#ffffff",
      }),
    )),
    (SP.gd = GUARD.map((t) =>
      [
        [".AAA.", "AwCwA", "ACCCB", "AwCwB", ".BBB."],
        ["..A.", ".ACA", "ACAB", ".AB.", "..B."],
      ].map((a) =>
        paint(outlineRows(a), {
          k: INK,
          A: t.c,
          B: shade(t.c, -0.35),
          C: "#ffffff",
          w: "#f4efe6",
        }),
      ),
    )),
    (SP.prop = buildProps()));
}
function shade(t, a) {
  const s = parseInt(t.slice(1), 16);
  let e = s >> 16,
    n = (s >> 8) & 255,
    l = 255 & s;
  const o = a < 0 ? 0 : 255,
    r = Math.abs(a);
  return (
    (e = Math.round((o - e) * r + e)),
    (n = Math.round((o - n) * r + n)),
    (l = Math.round((o - l) * r + l)),
    "#" + ((1 << 24) + (e << 16) + (n << 8) + l).toString(16).slice(1)
  );
}
function mixHex(t, a, s) {
  const e = parseInt(t.slice(1), 16),
    n = parseInt(a.slice(1), 16),
    l = (t) => Math.round(((e >> t) & 255) * (1 - s) + ((n >> t) & 255) * s);
  return (
    "#" + ((1 << 24) + (l(16) << 16) + (l(8) << 8) + l(0)).toString(16).slice(1)
  );
}
const uqIcon = (t, a = S.cls) =>
  UNIQUE[t].ic || [`u_${t}_${a}`, "u_" + t].find((t) => ICONS[t]);
function iconKey(t) {
  if (!t) return null;
  if (t.sl) return SLATE[t.b]?.ic || "slate";
  if (t.rune) return "rune" + (t.uq ? 3 : RUNE_FAM[t.a]);
  if (t.uq) {
    const a = uqIcon(t.uq, t.wc || S.cls);
    if (a) return a;
  }
  return (
    "weapon" === t.slot ? ICON_SET.weapon[t.wc || S.cls] : ICON_SET[t.slot]
  )[baseIdx(t)];
}
function iconCnv(t) {
  const a = "c:" + t;
  if (SP.icon[a]) return SP.icon[a];
  let s, e;
  t.startsWith("rune")
    ? ((s = ICONS.rune), (e = RUNE_MAT[+t.slice(4)]))
    : ((s = ICONS[t]), (e = MAT[s.m]));
  const n = Object.assign({}, IPAL, { A: e[0], B: e[1], C: e[2], k: INK });
  return (SP.icon[a] = paint(outlineRows(s.r), n, e));
}
function iconURL(t) {
  return SP.icon[t] || (SP.icon[t] = iconCnv(t).toDataURL());
}
const MYTH_FR = 16,
  MYTH_T = 2.4;
function mythStrip(t) {
  const a = "s:" + t;
  if (SP.icon[a]) return SP.icon[a];
  const s = iconCnv(t),
    e = s.width,
    n = s.height,
    l = s.getContext("2d").getImageData(0, 0, e, n).data,
    o = cnv(16 * e, n),
    r = o.getContext("2d"),
    i = r.createImageData(16 * e, n),
    c = (t) => [l[4 * t], l[4 * t + 1], l[4 * t + 2], l[4 * t + 3]],
    d = (t) => {
      const [a, s, e, n] = c(t);
      return n && a > 120 && a > 1.8 * s && a > 1.5 * e;
    },
    f = (t) => {
      const [a, s, e, n] = c(t);
      return n && a > 200 && s > 150 && e < 140;
    },
    p = (t, a) => {
      const s = t % e,
        l = (t / e) | 0;
      return [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].some(
        ([t, o]) =>
          s + t >= 0 &&
          s + t < e &&
          l + o >= 0 &&
          l + o < n &&
          a((l + o) * e + s + t),
      );
    },
    u = [];
  for (let t = 0; t < e * n; t++) f(t) && u.push(t);
  const h = [0, 1, 2].map((t) => u[Math.floor(hash2(t, e) * u.length)]),
    m = (t, a, s) => [
      t[0] + (a[0] - t[0]) * s,
      t[1] + (a[1] - t[1]) * s,
      t[2] + (a[2] - t[2]) * s,
    ];
  for (let t = 0; t < 16; t++) {
    const a = (t / 10) * (e + n + 6) - 3,
      s = 0.5 - 0.5 * Math.cos((t / 16) * 6.283);
    for (let o = 0; o < n; o++)
      for (let n = 0; n < e; n++) {
        const r = o * e + n,
          f = 4 * (o * e * 16 + t * e + n),
          u = l[4 * r + 3];
        let A = c(r).slice(0, 3);
        const g = A[0] + A[1] + A[2];
        u && d(r)
          ? (A = m(A, [255, 120, 90], 0.85 * s))
          : u && g < 330 && p(r, d) && (A = m(A, [190, 20, 40], 0.75 * s));
        const v = Math.abs(n + o - a);
        (u &&
          g > 150 &&
          t < 10 &&
          v < 2 &&
          (A = m(A, [255, 250, 225], v < 1 ? 0.65 : 0.3)),
          h.forEach((a, s) => {
            const e = (t + 5 * s) % 16;
            u &&
              e < 2 &&
              (r === a || (0 === e && g > 150 && p(r, (t) => t === a))) &&
              (A = m(A, [255, 255, 255], r === a ? 1 : 0.55));
          }),
          (i.data[f] = A[0]),
          (i.data[f + 1] = A[1]),
          (i.data[f + 2] = A[2]),
          (i.data[f + 3] = u));
      }
  }
  return (r.putImageData(i, 0, 0), (SP.icon[a] = o));
}
const mythURL = (t) => iconURL(t),
  itemIcon = (t) => (t.my ? mythURL(iconKey(t)) : iconURL(iconKey(t))),
  MAT_ICON = {
    m: [
      ".....AA.....",
      "....ACAA....",
      "...ACCAAB...",
      "..ACCAAAAB..",
      ".ACAAAAAAAB.",
      "ACAAAAAAAABB",
      ".AAAAAAAABB.",
      "..AAAAAABB..",
      "...AAAABB...",
      "....AABB....",
      ".....BB.....",
      "............",
    ],
    x: [
      ".....AA.....",
      "....ACAA....",
      "...ACCAAA...",
      "..ACCAAAAB..",
      "..ACAAAAABB.",
      ".AAAAAAABBB.",
      ".AAAAAABBBB.",
      "AAAAAABBBBB.",
      ".AAAABBBBBB.",
      "..AABBBBBB..",
      "...BBBBBB...",
      "....BBBB....",
    ],
    p: [
      ".AAAAAAAAAA.",
      ".ACCCAAAAAB.",
      ".ACAAAAAAAB.",
      ".ACAAAAAAAB.",
      ".AAAAAAAAAB.",
      ".AAAAAAAABB.",
      "..AAAAAAABB.",
      "..AAAAAABB..",
      "...AAAABBB..",
      "....AABBB...",
      ".....ABB....",
      "......B.....",
    ],
    s: [
      "....AAAA....",
      "...A....B...",
      "...A....B...",
      "...A....B...",
      ".AAAAAAAAAB.",
      ".ACCAAAAABB.",
      ".ACAAkkAABB.",
      ".AAAAkkAABB.",
      ".AAAAAkAABB.",
      ".AAAAAAABBB.",
      ".ABBBBBBBBB.",
      "..BBBBBBBB..",
    ],
    r: [
      ".....AA.....",
      "...AACAAA...",
      "..ACCAAAAB..",
      ".ACAACCAAAB.",
      ".ACACAACAAB.",
      ".AAAAAACAAB.",
      ".AAACAAAABB.",
      ".AAACAACABB.",
      "..AAACCAABB.",
      "..AAAAABBB..",
      "...BBBBBB...",
      ".....BB.....",
    ],
    c: [
      ".....A......",
      "....AAk.....",
      "...ACAAk....",
      "..ACAkAAB...",
      "..AAAAkAAB..",
      ".ACAAkAAABB.",
      ".AAkAAAkABB.",
      ".AAAkAkAABB.",
      "..AAAkAABBB.",
      "...AAkABBB..",
      "....ABBBB...",
      ".....BB.....",
    ],
    h: [
      "....AAAA....",
      "..AACCAAAA..",
      ".ACCAAAAAAB.",
      ".ACAAAAAAAB.",
      "ACAAAkkAAABB",
      "AAAAk..kAABB",
      "AAAAk..kAABB",
      "AAAAAkkAABBB",
      ".AAAAAAABBB.",
      ".AAAAAABBBB.",
      "..AABBBBBB..",
      "....BBBB....",
    ],
    i: [
      ".....A......",
      ".....AA.....",
      "....AAAA....",
      "....ACAAB...",
      "...ACCAAAB..",
      "...ACAAAAB..",
      "..ACAAAAAAB.",
      "..AAAAAAABB.",
      "..AAAAAABBB.",
      "..AAAAABBBB.",
      "...AABBBBB..",
      "....BBBBB...",
    ],
  },
  SHOP_ICON = {
    pot: {
      c: "#e0445a",
      r: [
        "....kkkk....",
        "....kCCk....",
        ".....AA.....",
        ".....AA.....",
        "....AAAA....",
        "...ACAAAB...",
        "..ACCAAAAB..",
        "..ACAAAABB..",
        "..AAAAAABB..",
        "..AAAABBBB..",
        "...ABBBBB...",
        "....BBBB....",
      ],
    },
    ash: {
      c: "#ff9a3c",
      r: [
        ".....A......",
        "....AC......",
        "....ACA..A..",
        "...ACCAA.AA.",
        "...ACAAA.AA.",
        "..ACAAAAAAB.",
        "..AAAAAAABB.",
        ".kAAAAAABBk.",
        ".kkAAABBBkk.",
        "kkkkkkkkkkkk",
        ".kkkkkkkkkk.",
        "............",
      ],
    },
  };
function shopIcon(t) {
  const a = SHOP_ICON[t],
    s = "shop_" + t;
  return (
    SP.icon[s] ||
    (SP.icon[s] = paint(outlineRows(a.r), {
      k: "#4a3a34",
      A: a.c,
      B: shade(a.c, -0.35),
      C: "#ffffff",
    }).toDataURL())
  );
}
const MIR_PAL = {
    k: INK,
    c: "#7af0ff",
    y: "#fff07a",
    w: "#ffffff",
    W: "#e8eaff",
    p: "#ff9ae0",
    v: "#b07aff",
    s: "#c8d0ff",
  },
  MIR_ICON = [
    ".....ww.....",
    "....ywWp....",
    "...cywWpp...",
    "..ccyWwppv..",
    ".cccywWpppv.",
    "wWwWwWwWwWwW",
    ".ccyywwppvv.",
    "..cyywwppv..",
    "...yywwpp...",
    "....ywwp....",
    ".....wp.....",
    ".....ss.....",
  ];
function matIcon(t) {
  const a = "mat_" + t,
    s = MAT_COL[t];
  return (
    SP.icon[a] ||
    (SP.icon[a] = (
      "m" === t
        ? paint(outlineRows(MIR_ICON), MIR_PAL)
        : paint(outlineRows(MAT_ICON[t]), {
            k: INK,
            A: s,
            B: shade(s, -0.35),
            C: "#ffffff",
          })
    ).toDataURL())
  );
}
function buildProps() {
  const t = {},
    a = (t, a = "#5d3f2b") => {
      const s = cnv(32, 40),
        e = s.getContext("2d");
      ((e.fillStyle = INK),
        e.fillRect(12, 25, 8, 14),
        e.fillRect(10, 36, 12, 3),
        (e.fillStyle = a),
        e.fillRect(13, 25, 6, 13),
        e.fillRect(11, 37, 10, 1),
        (e.fillStyle = shade(a, 0.2)),
        e.fillRect(14, 25, 2, 12));
      const n = [
        [16, 17, 12],
        [8, 20, 7],
        [24, 20, 7],
        [16, 9, 9],
        [10, 12, 6],
        [22, 12, 6],
      ];
      ((e.fillStyle = INK),
        n.forEach(([t, a, s]) => pcirc(e, t, a, s + 1)),
        (e.fillStyle = t[0]),
        n.forEach(([t, a, s]) => pcirc(e, t, a, s)),
        (e.fillStyle = t[1]),
        n.forEach(([t, a, s]) => pcirc(e, t - 1, a - 2, Math.max(1, s - 2))),
        (e.fillStyle = t[2]),
        n.forEach(([t, a, s]) => pcirc(e, t - 2, a - 4, Math.max(1, s - 5))));
      const l = mulberry(7 * t[0].length + 3);
      e.fillStyle = t[3];
      for (let t = 0; t < 22; t++) {
        const t = 6 + Math.floor(18 * l()),
          a = 3 + Math.floor(16 * l());
        e.fillRect(t, a, 1, 1);
      }
      return s;
    };
  return (
    (t.tree = [
      a(["#1f4a2e", "#2f6b3a", "#4b9a46", "#7cc65a"]),
      a(["#234a2a", "#386f34", "#5a9c3f", "#8ccb58"]),
      a(["#7a3420", "#b5562a", "#e08a3a", "#f6c065"]),
    ]),
    (t.pine = [0, 1].map((t) => {
      const a = cnv(24, 40),
        s = a.getContext("2d");
      ((s.fillStyle = INK),
        s.fillRect(10, 30, 5, 9),
        (s.fillStyle = "#5d3f2b"),
        s.fillRect(11, 30, 3, 8));
      const e = [
        [12, 4, 5],
        [12, 11, 8],
        [12, 19, 10],
        [12, 27, 11],
      ];
      for (const [t, a, n] of e)
        for (let e = 0; e <= 7; e++) {
          const l = Math.round((n * e) / 7);
          ((s.fillStyle = INK), s.fillRect(t - l - 1, a + e - 1, 2 * l + 3, 2));
        }
      for (const [t, a, n] of e) {
        for (let e = 0; e <= 7; e++) {
          const l = Math.round((n * e) / 7);
          ((s.fillStyle = "#2a5a4a"),
            s.fillRect(t - l, a + e, 2 * l + 1, 1),
            (s.fillStyle = "#3e7a62"),
            s.fillRect(t - l, a + e, l, 1));
        }
        ((s.fillStyle = "#eef4fa"),
          s.fillRect(t - n + 2, a + 6, 2 * n - 3, 1),
          s.fillRect(t - 2, a, 3, 1));
      }
      return a;
    })),
    (t.pillar = [0, 1].map((t) => {
      const a = cnv(16, 36),
        s = a.getContext("2d"),
        e = t ? 12 : 4;
      ((s.fillStyle = INK),
        s.fillRect(2, e, 12, 36 - e),
        s.fillRect(1, 31, 14, 5),
        (s.fillStyle = "#8f8d9c"),
        s.fillRect(3, e + 1, 10, 34 - e),
        (s.fillStyle = "#aaa8b4"),
        s.fillRect(4, e + 1, 3, 30 - e),
        (s.fillStyle = "#767487"),
        s.fillRect(10, e + 1, 3, 30 - e),
        s.fillRect(2, 32, 12, 3),
        (s.fillStyle = "#4a475a"));
      for (let t = e + 6; t < 30; t += 7) s.fillRect(3, t, 10, 1);
      return (
        t ||
          ((s.fillStyle = INK),
          s.fillRect(1, 3, 14, 4),
          (s.fillStyle = "#aaa8b4"),
          s.fillRect(2, 4, 12, 2)),
        (s.fillStyle = "#5c8748"),
        s.fillRect(3, 27, 2, 4),
        s.fillRect(11, 24, 2, 7),
        a
      );
    })),
    (t.rock = [0, 1].map((t) => {
      const a = cnv(20, 16),
        s = a.getContext("2d");
      return (
        (s.fillStyle = INK),
        pell(s, 10, 9, 9, 6),
        (s.fillStyle = "#5c5a6c"),
        pell(s, 10, 9, 8, 5),
        (s.fillStyle = "#7a7888"),
        pell(s, 9, 8, 6, 4),
        (s.fillStyle = "#9a98a8"),
        s.fillRect(6, 5, 4, 1),
        s.fillRect(5, 6, 2, 1),
        t &&
          ((s.fillStyle = "#7ad4ff"),
          s.fillRect(12, 3, 2, 4),
          s.fillRect(14, 5, 1, 2),
          (s.fillStyle = "#e0faff"),
          s.fillRect(12, 3, 1, 2)),
        a
      );
    })),
    (t.cactus = [0, 1].map((t) => {
      const a = cnv(16, 28),
        s = a.getContext("2d"),
        e = (t, a, e, n) => {
          ((s.fillStyle = INK),
            s.fillRect(t - 1, a - 1, e + 2, n + 2),
            (s.fillStyle = "#4a8a3a"),
            s.fillRect(t, a, e, n),
            (s.fillStyle = "#6aaa4a"),
            s.fillRect(t + 1, a, 1, n));
        };
      return (
        e(6, 4, 4, 23),
        e(1, 10, 3, 7),
        e(1, 16, 6, 2),
        t && (e(12, 8, 3, 8), e(9, 15, 5, 2)),
        (s.fillStyle = "#ff7aa0"),
        s.fillRect(7, 3, 2, 1),
        a
      );
    })),
    (t.deadtree = [0].map(() => {
      const t = cnv(28, 36),
        a = t.getContext("2d"),
        s = [
          [13, 35, 13, 14, 3],
          [13, 22, 6, 12, 2],
          [14, 18, 22, 8, 2],
          [6, 12, 3, 6, 1],
          [22, 8, 25, 4, 1],
          [13, 14, 15, 4, 2],
        ];
      for (const t of [0, 1])
        for (const [e, n, l, o, r] of s) {
          const s = Math.max(Math.abs(l - e), Math.abs(o - n));
          for (let i = 0; i <= s; i++) {
            const c = Math.round(e + ((l - e) * i) / s),
              d = Math.round(n + ((o - n) * i) / s);
            ((a.fillStyle = t ? "#4a4030" : INK),
              t
                ? a.fillRect(c - (r >> 1), d, r, 1)
                : a.fillRect(c - (r >> 1) - 1, d - 1, r + 2, 3));
          }
        }
      return t;
    })),
    (t.obelisk = [0, 1].map((t) => {
      const a = cnv(14, 34),
        s = a.getContext("2d");
      return (
        (s.fillStyle = INK),
        s.fillRect(3, 4, 8, 30),
        s.fillRect(4, 1, 6, 4),
        s.fillRect(1, 30, 12, 4),
        (s.fillStyle = "#2e2448"),
        s.fillRect(4, 4, 6, 29),
        s.fillRect(5, 2, 4, 3),
        (s.fillStyle = "#3e3260"),
        s.fillRect(4, 4, 2, 27),
        (s.fillStyle = "#241a3a"),
        s.fillRect(2, 31, 10, 2),
        (s.fillStyle = t ? "#ffe080" : "#c9a0ff"),
        s.fillRect(6, 9, 2, 1),
        s.fillRect(6, 11, 1, 3),
        s.fillRect(7, 15, 1, 2),
        s.fillRect(6, 19, 2, 1),
        s.fillRect(6, 22, 1, 3),
        a
      );
    })),
    t
  );
}
const hx32 = (t) =>
  ((255 << 24) |
    (parseInt(t.slice(5, 7), 16) << 16) |
    (parseInt(t.slice(3, 5), 16) << 8) |
    parseInt(t.slice(1, 3), 16)) >>>
  0;
function buildGround() {
  const t = mapV(),
    a = paintGround(
      t,
      G.W,
      G.H,
      G.top,
      G.arena ? 900 + t.p[0].charCodeAt(2) : 131 * S.map + 7,
    );
  ((G.ground = a.c), (G.props = a.props), (G.lights = a.lights));
}
function paintGround(t, a, s, e, n) {
  const l = cnv(a, s),
    o = l.getContext("2d"),
    r = o.createImageData(a, s),
    i = new Uint32Array(r.data.buffer),
    c = t.p.map(hx32),
    d = t.q.map(hx32),
    f = t.pool ? t.pool.map(hx32) : null,
    p = (t) => (e + s) / 2 + 10 + 9 * Math.sin(0.045 * t + n),
    u = [];
  for (let l = 0; l < s; l++)
    for (let o = 0; o < a; o++) {
      const r = hash2(o + 97 * n, l),
        h = o + 6 * (vn2(0.13 * o, 0.13 * l) - 0.5),
        m = l + 6 * (vn2(0.13 * o + 31, 0.13 * l + 11) - 0.5);
      let A;
      if ("tiles" === t.k) {
        const t = 15 & Math.floor(h),
          a = 15 & Math.floor(m),
          s = (Math.floor(m) >> 3) & 1,
          e = !(7 & a && (t + 4 * s) & 7),
          n = hash2((Math.floor(h) + 4 * s) >> 3, Math.floor(m) >> 3);
        ((A = e ? c[0] : n < 0.3 ? c[1] : n < 0.85 ? c[2] : c[3]),
          !e && r > 0.97 && (A = c[1]));
      } else {
        const a =
          0.62 * vn2(0.05 * o + n, 0.05 * l) +
          0.38 * vn2(0.19 * o, 0.19 * l) +
          0.2 * (r - 0.5);
        ((A = a < 0.4 ? c[0] : a < 0.58 ? c[1] : a < 0.74 ? c[2] : c[3]),
          "cave" === t.k && vn2(0.1 * o + 50, 0.3 * l) > 0.78 && (A = c[0]),
          r > 0.994 && (A = c[3]));
        const s = Math.abs(m - p(h));
        if ("grass" === t.k && s < 5) {
          const t = 0.6 * vn2(0.11 * o, 0.11 * l) + 0.45 * (r - 0.5);
          A = t < 0.3 ? d[0] : t < 0.55 ? d[1] : d[2];
        }
      }
      if (f) {
        const i = vn2(0.045 * o + 3 * n, 0.06 * l + 9),
          c = Math.min(o, a - o) / a,
          d = (s - l) / s;
        i > (c < 0.16 || d < 0.14 ? 0.6 : 0.9) &&
          (c < 0.22 || d < 0.2) &&
          l > e + 4 &&
          ((A = i > 0.74 ? f[0] : f[1]),
          (l + Math.round(1.5 * Math.sin(0.3 * o))) % 5 == 0 &&
            r > 0.5 &&
            (A = f[2]),
          t.glow && r > 0.985 && u.push([o, l]));
      }
      i[l * a + o] = A;
    }
  o.putImageData(r, 0, 0);
  const h = mulberry(n),
    m = [],
    A = Math.round((a * s) / 260);
  for (let n = 0; n < A; n++) {
    const n = Math.floor(h() * a),
      l = e - 6 + Math.floor(h() * (s - e + 6)),
      r = h();
    switch (t.d) {
      case "flowers":
        if (r < 0.55) {
          const t = ["#f05a6a", "#fff2f0", "#ffd84a", "#8fb8ff"][
            Math.floor(4 * h())
          ];
          ((o.fillStyle = "#2a5a30"),
            o.fillRect(n, l + 2, 1, 2),
            (o.fillStyle = t),
            o.fillRect(n - 1, l, 3, 1),
            o.fillRect(n, l - 1, 1, 3),
            (o.fillStyle = "#ffe066"),
            o.fillRect(n, l, 1, 1));
        } else
          ((o.fillStyle = "#2f6236"),
            o.fillRect(n, l, 1, 2),
            o.fillRect(n - 2, l - 1, 1, 2),
            o.fillRect(n + 2, l - 1, 1, 2));
        break;
      case "mush":
        r < 0.3
          ? ((o.fillStyle = INK),
            o.fillRect(n - 2, l - 3, 5, 3),
            o.fillRect(n - 1, l, 3, 2),
            (o.fillStyle = h() < 0.5 ? "#e0445a" : "#c9a0ff"),
            o.fillRect(n - 1, l - 2, 3, 1),
            (o.fillStyle = "#fff2f0"),
            o.fillRect(n, l - 2, 1, 1),
            (o.fillStyle = "#e8dcc0"),
            o.fillRect(n, l, 1, 1),
            h() < 0.4 && m.push([n, l - 2, 7, "#c9a0ff"]))
          : ((o.fillStyle = "#1c3a26"),
            o.fillRect(n, l, 1, 2),
            o.fillRect(n + 2, l - 1, 1, 2));
        break;
      case "crystal":
        r < 0.14
          ? ((o.fillStyle = INK),
            o.fillRect(n - 2, l - 5, 5, 6),
            (o.fillStyle = "#4fb0e0"),
            o.fillRect(n - 1, l - 4, 1, 4),
            o.fillRect(n + 1, l - 3, 1, 3),
            (o.fillStyle = "#b0ecff"),
            o.fillRect(n, l - 5, 1, 5),
            m.push([n, l - 3, 14, "#7ad4ff"]))
          : r < 0.5 && ((o.fillStyle = "#2a221e"), o.fillRect(n, l, 2, 1));
        break;
      case "bones":
        r < 0.12
          ? ((o.fillStyle = INK),
            o.fillRect(n - 1, l - 1, 7, 3),
            (o.fillStyle = "#e8dcc0"),
            o.fillRect(n, l, 5, 1),
            o.fillRect(n - 1 + 1, l - 1 + 1, 1, 1))
          : r < 0.4 && ((o.fillStyle = "#c09058"), o.fillRect(n, l, 2, 1));
        break;
      case "puddle":
        r < 0.12 &&
          ((o.fillStyle = "#1c5a7a"),
          pell(o, n, l, 4, 1),
          (o.fillStyle = "#5ab0d0"),
          o.fillRect(n - 2, l, 2, 1));
        break;
      case "snow":
        r < 0.5
          ? ((o.fillStyle = "#ffffff"), o.fillRect(n, l, 1, 1))
          : r < 0.56 &&
            ((o.fillStyle = INK),
            o.fillRect(n - 2, l - 2, 5, 3),
            (o.fillStyle = "#9aaabb"),
            o.fillRect(n - 1, l - 1, 3, 1),
            (o.fillStyle = "#ffffff"),
            o.fillRect(n - 1, l - 2 + 1 - 1, 3, 1));
        break;
      case "ember":
        if (r < 0.1) {
          o.fillStyle = "#d8443a";
          let t = n,
            a = l;
          for (let s = 0; s < 7; s++)
            (o.fillRect(t, a, 1, 1),
              (t += h() < 0.6 ? 1 : 0),
              (a += h() < 0.5 ? 1 : -1));
          m.push([n + 3, l, 10, "#ff8a30"]);
        }
        break;
      case "reeds":
        r < 0.3 &&
          ((o.fillStyle = "#5a6a2a"),
          o.fillRect(n, l - 4, 1, 5),
          o.fillRect(n + 2, l - 3, 1, 4),
          (o.fillStyle = "#8a6a3a"),
          o.fillRect(n, l - 5, 1, 2));
        break;
      case "rubble":
        r < 0.2
          ? ((o.fillStyle = INK),
            o.fillRect(n - 1, l - 1, 4, 3),
            (o.fillStyle = "#aaa8b4"),
            o.fillRect(n, l, 2, 1))
          : r < 0.3 && ((o.fillStyle = "#5c8748"), o.fillRect(n, l, 1, 1));
        break;
      case "stars":
        r < 0.3 &&
          ((o.fillStyle = h() < 0.3 ? "#d0a0ff" : "#8a7ab0"),
          o.fillRect(n, l, 1, 1));
        break;
      case "runes":
        if (r < 0.05) {
          const a = t.ring || "#ffe080";
          o.fillStyle = a;
          for (let t = 0; t < 6.28; t += 0.5)
            o.fillRect(
              Math.round(n + 4 * Math.cos(t)),
              Math.round(l + 2 * Math.sin(t)),
              1,
              1,
            );
          m.push([n, l, 10, a]);
        }
    }
  }
  for (const [t, a] of u) m.push([t, a, 9, "#ff8a30"]);
  if (t.ring) {
    const n = a / 2,
      l = (e + s) / 2 + 4,
      r = Math.round(0.42 * a),
      i = Math.round(0.36 * (s - e));
    for (const t of [0, 1])
      for (let a = 0; a < 6.283; a += 0.5 / r) {
        const s = Math.round(n + Math.cos(a) * r),
          e = Math.round(l + Math.sin(a) * i);
        t
          ? ((o.fillStyle = hash2(s >> 2, e) < 0.4 ? "#5c5a6c" : "#8f8d9c"),
            o.fillRect(s, e, 1, 1))
          : ((o.fillStyle = INK), o.fillRect(s - 1, e - 1, 3, 3));
      }
    for (let a = 0; a < 8; a++) {
      const s = (a / 8) * 6.283 + 0.2,
        e = Math.round(n + Math.cos(s) * r),
        c = Math.round(l + Math.sin(s) * i);
      ((o.fillStyle = INK),
        o.fillRect(e - 3, c - 4, 7, 7),
        (o.fillStyle = "#5c5a6c"),
        o.fillRect(e - 2, c - 3, 5, 5),
        (o.fillStyle = "#3e3a4c"),
        o.fillRect(e - 1, c - 2, 3, 3),
        (o.fillStyle = t.ring),
        o.fillRect(e, c - 2, 1, 3),
        o.fillRect(e - 1, c - 1, 3, 1),
        m.push([e, c, 12, t.ring]));
    }
    ((o.globalAlpha = 0.5), (o.fillStyle = t.ring));
    for (let t = 0; t < 6.283; t += 2 / r)
      o.fillRect(
        Math.round(n + Math.cos(t) * r * 0.55),
        Math.round(l + Math.sin(t) * i * 0.55),
        1,
        1,
      );
    o.globalAlpha = 1;
  }
  const g = SP.prop[t.pr],
    v = [];
  ([0.08, 0.3, 0.55, 0.78, 0.95].forEach((t, s) => {
    h() < 0.8 &&
      v.push({
        x: Math.round(a * t + 14 * (h() - 0.5)),
        y: e + 2 + Math.floor(4 * h()),
        s: g[Math.floor(h() * g.length)],
      });
  }),
    v.push(
      { x: -2, y: Math.round(0.62 * s), s: g[0] },
      { x: a + 2, y: Math.round(0.8 * s), s: g[g.length - 1] },
    ),
    (o.fillStyle = "rgba(10,16,30,.32)"));
  for (const t of v) pell(o, t.x + 2, t.y + 1, Math.round(0.35 * t.s.width), 3);
  return { c: l, props: v, lights: m };
}
function mapBanner(t, a, s, e, n, l) {
  const o = "ban:" + t + ":" + s;
  if (SP.icon[o]) return SP.icon[o];
  const r = paintGround(a, s, e, 15, n),
    i = r.c,
    c = i.getContext("2d");
  c.imageSmoothingEnabled = !1;
  for (const t of r.props.sort((t, a) => t.y - a.y))
    c.drawImage(t.s, Math.round(t.x - t.s.width / 2), t.y - t.s.height + 2);
  for (const t of l.slice().sort((t, a) => t.y - a.y)) {
    const e = Math.round(t.x * s),
      n = t.sc || 1;
    if (
      ((c.fillStyle = "rgba(10,16,30,.35)"),
      pell(c, e, t.y, Math.round(5 * n), Math.max(1, Math.round(n))),
      "slime" === t.t || "wisp" === t.t)
    ) {
      const s = {
        x: e,
        y: t.y,
        t: 0,
        lunge: 0,
        flash: 0,
        face: 1,
        boss: t.boss,
        sl: a.sl,
        eye: 0,
      };
      ("slime" === t.t ? drawSlime : drawWisp)(c, s);
      continue;
    }
    const l = SP.mon[t.t],
      o = l.w * n,
      r = l.h * n,
      i = Math.round(e - o / 2),
      d = Math.round(t.y - r),
      f = t.boss,
      p = (t) => {
        f
          ? (c.save(),
            c.translate(i + o, d),
            c.scale(-1, 1),
            c.drawImage(t, 0, 0, o, r),
            c.restore())
          : c.drawImage(t, i, d, o, r);
      };
    if (t.boss)
      for (const [t, a] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ])
        (c.save(), c.translate(t, a), p(l.red[0]), c.restore());
    p(l.fr[0]);
  }
  return (
    a.amb &&
      a.amb[0] > 0.05 &&
      ((c.fillStyle = `rgba(${a.amb[1]},${a.amb[2]},${a.amb[3]},${Math.min(0.35, 0.5 * a.amb[0])})`),
      c.fillRect(0, 0, s, e)),
    (SP.icon[o] = i.toDataURL())
  );
}
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function cardArt(t, a, s, e, n, l) {
  const o = "card:" + t + ":" + s;
  if (SP.icon[o]) return SP.icon[o];
  const r = cnv(s, e),
    i = r.getContext("2d");
  i.imageSmoothingEnabled = !1;
  let c = 7;
  for (const a of t) c = (31 * c + a.charCodeAt(0)) | 0;
  const d = mulberry(c),
    f = (t, a, s) => t.map((t, e) => Math.round(t + (a[e] - t) * s)),
    p = (t) => `rgb(${t[0]},${t[1]},${t[2]})`,
    u = (t, a) => BAYER[4 * (3 & a) + (3 & t)] / 16,
    h = [27, 20, 36],
    m = l
      ? [120, 46, 96]
      : (a.amb ? [a.amb[1], a.amb[2], a.amb[3]] : [44, 30, 70]).map((t) =>
          Math.min(255, 1.7 * t + 18),
        ),
    A = l
      ? [255, 236, 170]
      : f(
          ((v = a.p[3]), [1, 3, 5].map((t) => parseInt(v.slice(t, t + 2), 16))),
          [255, 255, 240],
          0.55,
        ),
    g = f(A, m, 0.45);
  var v;
  const b = [h, f(h, m, 0.55), m, f(m, g, 0.5), g],
    S = Math.round(0.58 * e),
    k = Math.round(0.74 * s),
    x = Math.round(0.2 * e),
    y = Math.max(3, Math.round(0.11 * e));
  for (let t = 0; t < S; t++)
    for (let a = 0; a < s; a++) {
      const s = 0.5 * (u(a, t) - 0.5);
      let e = Math.min(4, Math.max(0, Math.floor((t / S) * 4.2 + s)));
      const n = Math.hypot(a - k, 1.15 * (t - x)) / y + 0.4 * s;
      (n < 1.7 ? (e = Math.min(4, e + 2)) : n < 2.6 && (e = Math.min(4, e + 1)),
        (i.fillStyle = p(b[e])),
        i.fillRect(a, t, 1, 1));
    }
  for (let t = 0; t < 14; t++) {
    const t = Math.floor(d() * s),
      a = Math.floor(d() * S * 0.75);
    Math.hypot(t - k, a - x) > 2.8 * y &&
      ((i.fillStyle = p(d() < 0.5 ? A : g)),
      i.fillRect(t, a, 1, 1),
      d() < 0.2 && (i.fillRect(t - 1, a, 3, 1), i.fillRect(t, a - 1, 1, 3)));
  }
  if (((i.fillStyle = p(A)), pcirc(i, k, x, y), l)) {
    i.fillStyle = p(A);
    for (let t = 0.39; t < 6.283; t += 0.785)
      for (let a = y + 3; a < 2.6 * y; a += 2)
        i.fillRect(
          Math.round(k + Math.cos(t) * a),
          Math.round(x + Math.sin(t) * a),
          1,
          1,
        );
  } else
    ((i.fillStyle = p(f(A, m, 0.35))),
      i.fillRect(k - 2, x - 1, 2, 2),
      i.fillRect(k + 1, x + 2, 1, 1),
      i.fillRect(k + 2, x - 2, 1, 1));
  const w = p(f(m, h, 0.5)),
    $ = f(m, h, 0.7),
    M = 6 * d();
  i.fillStyle = w;
  for (let t = 0; t < s; t++) {
    const a = Math.round(
      5 + 3 * Math.sin(0.13 * t + M) + 4 * Math.sin(0.05 * t + 2 * M),
    );
    i.fillRect(t, S - a, 1, a + 1);
  }
  const B = SP.prop[a.pr] || [],
    C = (t) => (t.height > 0.3 * e ? 0.5 : 1);
  if (B.length)
    for (let t = 0; t < 5; t++) {
      const a = tintC(B[Math.floor(d() * B.length)], p($)),
        e = C(a),
        n = Math.round(a.width * e),
        l = Math.round(a.height * e),
        o = Math.round((s * (t + 0.15 + 0.7 * d())) / 5);
      i.drawImage(a, o - (n >> 1), S - l + 2, n, l);
    }
  (i.drawImage(paintGround(a, s, e - S + 2, 0, 255 & c).c, 0, S - 1),
    (i.fillStyle = p(g)),
    i.fillRect(0, S - 1, s, 1));
  for (let t = Math.round(0.82 * e); t < e; t++)
    for (let a = 0; a < s; a++)
      u(a, t) < ((t - 0.82 * e) / (0.18 * e)) * 0.6 &&
        ((i.fillStyle = "rgba(27,20,36,.5)"), i.fillRect(a, t, 1, 1));
  ((i.globalCompositeOperation = "lighter"),
    (i.fillStyle = p(f([0, 0, 0], A, 0.12))));
  for (const [t, a] of [
    [3, 5],
    [13, 3],
  ])
    for (let s = x; s < e; s++) {
      const e = Math.round(k - t - 0.5 * (s - x));
      for (let t = 0; t < a; t++) (e + t + s) & 1 && i.fillRect(e + t, s, 1, 1);
    }
  i.globalCompositeOperation = "source-over";
  for (let t = 0; t < e; t++)
    for (let a = 0; a < s; a++) {
      const n = Math.hypot((a - s / 2) / s, (t - e / 2) / e);
      n > 0.5 &&
        u(a, t) < 3 * (n - 0.5) &&
        ((i.fillStyle = "rgba(20,14,28,.6)"), i.fillRect(a, t, 1, 1));
    }
  for (let t = 0; t < 8; t++) {
    const t = Math.floor(d() * s),
      a = Math.floor(0.5 * S + d() * (e - 0.5 * S - 6));
    ((i.fillStyle = p(d() < 0.6 ? A : g)), i.fillRect(t, a, 1, 1));
  }
  if (B.length)
    for (const [t, a, n] of [
      [0, 0.02, 0],
      [B.length - 1, 0.98, 1],
    ]) {
      const l = tintC(B[t], "#140e1c"),
        o = C(l),
        r = Math.round(l.width * o),
        c = Math.round(l.height * o),
        d = Math.round(a * s - r / 2),
        f = e - c + 4;
      n
        ? (i.save(),
          i.translate(d + r, f),
          i.scale(-1, 1),
          i.drawImage(l, 0, 0, r, c),
          i.restore())
        : i.drawImage(l, d, f, r, c);
    }
  return (
    n.forEach((t, o) => {
      const r = l || o === n.length - 1,
        c = Math.round(t.x * s),
        d = r
          ? Math.round(e * (l ? 0.9 : 0.93))
          : Math.round(S + 0.3 * (e - S)),
        f = cnv(s, e),
        u = f.getContext("2d");
      if (
        ((u.imageSmoothingEnabled = !1),
        (i.fillStyle = "rgba(10,8,20,.5)"),
        pell(
          i,
          c,
          d,
          Math.round(6 * (t.sc || 1)),
          Math.max(1, Math.round(t.sc || 1)),
        ),
        ((t, s, e, n) => {
          const l = s.sc || 1;
          if ("slime" === s.t || "wisp" === s.t)
            return ("slime" === s.t ? drawSlime : drawWisp)(t, {
              x: e,
              y: n,
              t: 0,
              lunge: 0,
              flash: 0,
              face: 1,
              boss: l > 1,
              sl: a.sl,
              eye: s.flip ? -1 : 1,
            });
          const o = SP.mon[s.t],
            r = o.w * l,
            i = o.h * l,
            c = Math.round(e - r / 2),
            d = Math.round(n - i) - (MON[s.t].fl || "bat" === s.t ? 3 * l : 0);
          s.flip
            ? (t.save(),
              t.translate(c + r, d),
              t.scale(-1, 1),
              t.drawImage(o.fr[0], 0, 0, r, i),
              t.restore())
            : t.drawImage(o.fr[0], c, d, r, i);
        })(u, t, c, d),
        r)
      ) {
        const t = tintC(f, p(A));
        (i.drawImage(t, 1, 0), i.drawImage(t, 0, -1), i.drawImage(f, 0, 0));
      } else
        ((u.globalCompositeOperation = "source-atop"),
          (u.fillStyle = p(m)),
          (u.globalAlpha = 0.4),
          u.fillRect(0, 0, s, e),
          i.drawImage(f, 0, 0));
    }),
    (i.strokeStyle = "#1b1424"),
    (i.lineWidth = 1),
    i.strokeRect(0.5, 0.5, s - 1, e - 1),
    (SP.icon[o] = r.toDataURL())
  );
}
function textW(t, a = 1) {
  return 4 * t.length * a - a;
}
function glyphs(t, a, s, e, n) {
  for (let l = 0; l < a.length; l++) {
    const o = FONT[a[l]] || FONT[" "];
    for (let a = 0; a < 15; a++)
      "1" === o[a] &&
        t.fillRect(
          s + 4 * l * n + (a % 3) * n,
          e + Math.floor(a / 3) * n,
          n,
          n,
        );
  }
}
function ptext(t, a, s, e, n, l = 1, o = "#120d1c") {
  if (
    ((a = String(a).toUpperCase()), (s = Math.round(s)), (e = Math.round(e)), o)
  ) {
    t.fillStyle = o;
    for (const [n, o] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
      [1, 1],
    ])
      glyphs(t, a, s + n, e + o, l);
  }
  ((t.fillStyle = n), glyphs(t, a, s, e, l));
}
const LC = cnv(1, 1),
  lctx = LC.getContext("2d");
function drawShadow(t, a, s, e) {
  ((t.fillStyle = "rgba(10,14,28,.35)"),
    pell(t, a, s, e, Math.max(1, Math.round(0.4 * e))));
}
function swingState(t) {
  const a = clamp(t.t / t.dur, 0, 1),
    s = 1 - Math.pow(1 - a, 3);
  if ("whirl" === t.k) {
    const e = t.a,
      n = 4 * Math.PI;
    return { prog: a, a0: e, cur: e + n * s, R: t.R || 18, span: n, whirl: 1 };
  }
  const e = "slam" === t.k || 3 === t.combo,
    n = 2 === t.combo ? -1 : 1,
    l = e ? t.a - 0.9 * Math.PI * n : t.a - 1.4 * n,
    o = e ? 1.8 * Math.PI * n : 2.8 * n;
  return {
    prog: a,
    a0: l,
    cur: l + o * s,
    R: "slam" === t.k ? 24 : e ? 20 : 16,
    span: o,
    big: e,
  };
}
function drawSword(t, a) {
  const s = G.pl,
    e = s.anim;
  if (!e || !["swing", "slam", "whirl"].includes(e.k)) return;
  const n = swingState(e);
  if (a !== Math.sin(n.cur) < -0.3) return;
  const l = Math.round(s.x),
    o = Math.round(s.y - 7),
    r = n.R,
    i = S.equip.weapon,
    c = i && i.rar > 0 ? RAR_COL[i.rar] : "#dfe6ec";
  t.fillStyle = INK;
  for (let a = 3; a <= r; a++)
    t.fillRect(
      Math.round(l + Math.cos(n.cur) * a) - 1,
      Math.round(o + Math.sin(n.cur) * a) - 1,
      3,
      3,
    );
  for (let a = 3; a <= r; a++)
    ((t.fillStyle =
      a < 6 ? "#8a5a36" : 6 === a ? "#e8b84a" : a > r - 2 ? "#ffffff" : c),
      t.fillRect(
        Math.round(l + Math.cos(n.cur) * a),
        Math.round(o + Math.sin(n.cur) * a),
        6 === a ? 2 : 1,
        6 === a ? 2 : 1,
      ));
}
function drawSlash(t) {
  const a = G.pl,
    s = a.anim;
  if (!s || !["swing", "slam", "whirl"].includes(s.k)) return;
  const e = swingState(s),
    n = e.R + 3,
    l =
      "slam" === s.k
        ? "#fff3c4"
        : e.whirl
          ? "#ffe0b0"
          : e.big
            ? "#fff3c4"
            : "#ffffff",
    o =
      "slam" === s.k
        ? "#ff9a3c"
        : e.whirl
          ? "#e8a64a"
          : e.big
            ? "#ffb347"
            : "#8fe0ff",
    r = e.whirl ? 90 : 36,
    i = e.prog > 0.7 ? (1 - e.prog) / 0.3 : 1,
    c = e.whirl
      ? Math.max(0, e.cur - e.a0 - 1.6 * Math.PI) / (e.cur - e.a0 || 1)
      : 0.25;
  for (let d = 0; d <= r; d++) {
    const f = d / r;
    if (f < c) continue;
    const p = e.a0 + (e.cur - e.a0) * f;
    for (
      let e =
        n - Math.round(1 + ("slam" === s.k ? 7 : 5) * ((f - c) / (1 - c)) * i);
      e <= n;
      e++
    )
      ((t.fillStyle = e >= n - 1 ? l : o),
        t.fillRect(
          Math.round(a.x + Math.cos(p) * e),
          Math.round(a.y - 7 + Math.sin(p) * e * 0.8),
          1,
          1,
        ));
  }
}
function drawBow(t, a) {
  const s = G.pl,
    e = s.anim && "shoot" === s.anim.k ? s.anim : null,
    n = e ? e.a : s.face,
    l = Math.cos(n),
    o = Math.sin(n);
  if (o < -0.2 === a) return;
  const r = s.x + 5 * l,
    i = s.y - 7 + 3 * o,
    c = -o,
    d = l,
    f = e ? e.t / e.dur : 0,
    p = e && f < 0.55 ? (f / 0.55) * 4 : 0,
    u =
      S.equip.weapon && S.equip.weapon.rar > 0
        ? RAR_COL[S.equip.weapon.rar]
        : "#9a6a3e",
    h = [];
  for (let t = -6; t <= 6; t++) {
    const a = t / 6,
      s = 2.5 * (1 - a * a);
    h.push([r + c * t + l * s, i + d * t + o * s]);
  }
  t.fillStyle = INK;
  for (const [a, s] of h)
    t.fillRect(Math.round(a) - 1, Math.round(s) - 1, 3, 3);
  t.fillStyle = u;
  for (const [a, s] of h) t.fillRect(Math.round(a), Math.round(s), 1, 1);
  const m = h[0],
    A = h[12],
    g = r - l * p,
    v = i - o * p;
  t.fillStyle = "#f4efe6";
  for (const a of [m, A]) {
    const s = 6;
    for (let e = 0; e <= s; e++)
      t.fillRect(
        Math.round(a[0] + ((g - a[0]) * e) / s),
        Math.round(a[1] + ((v - a[1]) * e) / s),
        1,
        1,
      );
  }
  if (e && f < 0.55) {
    t.fillStyle = e.big ? "#d4ff8a" : "#e8d8b0";
    for (let a = 0; a < 9; a++)
      t.fillRect(Math.round(g + l * a), Math.round(v + o * a), 1, 1);
    ((t.fillStyle = "#ffffff"),
      t.fillRect(Math.round(g + 9 * l), Math.round(v + 9 * o), 1, 1));
  }
}
function drawStaff(t, a) {
  const s = G.pl,
    e = s.anim && "cast" === s.anim.k ? s.anim : null,
    n = (s.dir, s.flip ? -1 : 1);
  if (("up" === s.dir) === a) return;
  const l = e ? e.t / e.dur : 0,
    o = e ? Math.sin(Math.min(1, 1.6 * l) * Math.PI) : 0,
    r = s.x + 6 * n,
    i = s.y - 2,
    c = r + (e ? 4 * Math.cos(e.a) * o : 0),
    d = i - 15 - 3 * o,
    f = Math.ceil(Math.max(Math.abs(c - r), Math.abs(d - i)));
  t.fillStyle = INK;
  for (let a = 0; a <= f; a++)
    t.fillRect(
      Math.round(r + ((c - r) * a) / f) - 1,
      Math.round(i + ((d - i) * a) / f),
      3,
      1,
    );
  t.fillStyle = "#8a5a36";
  for (let a = 0; a <= f; a++)
    t.fillRect(
      Math.round(r + ((c - r) * a) / f),
      Math.round(i + ((d - i) * a) / f),
      1,
      1,
    );
  const p = S.equip.weapon,
    u = p && p.rar > 0 ? RAR_COL[p.rar] : "#b07aff";
  ((t.fillStyle = INK),
    pcirc(t, c, d - 1, 2 + (o > 0.3 ? 1 : 0)),
    (t.fillStyle = u),
    pcirc(t, c, d - 1, 1 + (o > 0.3 ? 1 : 0)),
    (t.fillStyle = "#ffffff"),
    t.fillRect(Math.round(c) - 1, Math.round(d) - 2, 1, 1),
    (s.orb = [c, d - 1, o]));
}
function drawClone(t) {
  const a = G.pl,
    s = (SP.hero[S.tal.asc ? S.cls + ":" + S.tal.asc : S.cls] || SP.hero[S.cls])
      .white[a.dir][0],
    e =
      s._v ||
      (s._v = (() => {
        const t = cnv(s.width, s.height),
          a = t.getContext("2d");
        return (
          a.drawImage(s, 0, 0),
          (a.globalCompositeOperation = "source-in"),
          (a.fillStyle = "#a678ff"),
          a.fillRect(0, 0, t.width, t.height),
          t
        );
      })()),
    [n, l] = cloneXY(),
    o = a.clone - G.t;
  ((t.globalAlpha =
    (o < 0.5 ? 2 * o : 1) * (Math.floor(12 * G.t) % 4 ? 0.7 : 0.55)),
    a.flip && "side" === a.dir
      ? (t.save(),
        t.translate(n, 0),
        t.scale(-1, 1),
        t.drawImage(e, -8, l - 19),
        t.restore())
      : t.drawImage(e, n - 8, l - 19),
    (t.globalAlpha = 1));
}
function drawPlayer(t) {
  const a = G.pl,
    s = SP.hero[S.tal.asc ? S.cls + ":" + S.tal.asc : S.cls] || SP.hero[S.cls];
  if (G.dead) return;
  const e = a.moving && !a.anim ? [0, 1, 0, 2][Math.floor(9 * a.walkT) % 4] : 0,
    n = (a.hurt > 0 && Math.floor(30 * a.hurt) % 2 == 0 ? s.white : s)[a.dir][
      e
    ],
    l = Math.round(a.x),
    o = Math.round(a.y),
    r = punchOn(),
    i = r
      ? () => {}
      : "sword" === roArchetype(S.cls)
        ? () => drawSword(t, !0)
        : "bow" === roArchetype(S.cls)
          ? () => drawBow(t, !1)
          : () => drawStaff(t, !1),
    c = r
      ? () => drawFist(t)
      : "sword" === roArchetype(S.cls)
        ? () => drawSword(t, !1)
        : "bow" === roArchetype(S.cls)
          ? () => drawBow(t, !0)
          : () => drawStaff(t, !0),
    d = Math.round(a.z || 0);
  if (tal("crsRing") && placed().some((t) => SKILLS[t.id].crs)) {
    const a = crsAuraR();
    t.fillStyle = "#b89aff";
    for (let s = 0; s < 6.283; s += 0.35) {
      const e = s + 0.6 * G.t;
      t.fillRect(
        Math.round(l + Math.cos(e) * a),
        Math.round(o - 3 + Math.sin(e) * a * 0.6),
        1,
        1,
      );
    }
  }
  if (tal("dv_press")) {
    const a = DV_PRESS.r;
    t.fillStyle = "#5ab8e8";
    for (let s = 0; s < 6.283; s += 0.2) {
      const e = s - 0.5 * G.t;
      t.fillRect(
        Math.round(l + Math.cos(e) * a),
        Math.round(o + Math.sin(e) * a * 0.6),
        1,
        1,
      );
    }
  }
  (d &&
    ((t.fillStyle = "rgba(0,0,0,.35)"),
    pell(t, l, o, 5, 2),
    t.save(),
    t.translate(0, -d)),
    i(),
    a.flip && "side" === a.dir
      ? (t.save(),
        t.translate(l, 0),
        t.scale(-1, 1),
        t.drawImage(n, -8, o - 19),
        t.restore())
      : t.drawImage(n, l - 8, o - 19),
    c(),
    d && t.restore());
}
const FIST_C = [];
function fistImg(t) {
  if (FIST_C[t]) return FIST_C[t];
  const a = cnv(FIST_SPR[0].length, FIST_SPR.length),
    s = a.getContext("2d"),
    e = FIST_PAL[t] || {};
  return (
    FIST_SPR.forEach((a, n) =>
      [...a].forEach((a, l) => {
        "." !== a &&
          ((s.fillStyle = 2 === t ? ("k" === a ? INK : "#ffffff") : e[a]),
          s.fillRect(l, n, 1, 1));
      }),
    ),
    (FIST_C[t] = a)
  );
}
function drawFist(t) {
  const a = G.pl,
    s = a.anim && "punch" === a.anim.k ? a.anim : null,
    e = s ? s.a : a.face,
    n = s ? Math.sin(Math.min(1, s.t / s.dur) * Math.PI) : 0,
    l = 4 + 9 * n,
    o = Math.round(a.x + Math.cos(e) * l),
    r = Math.round(a.y - 8 + Math.sin(e) * l * 0.6);
  if (n > 0.5) {
    t.fillStyle = "#fff2c0";
    for (let a = 3; a <= 6; a++)
      t.fillRect(
        Math.round(o - Math.cos(e) * a),
        Math.round(r - Math.sin(e) * a * 0.6),
        1,
        1,
      );
  }
  ((t.fillStyle = INK),
    t.fillRect(o - 2, r - 2, 5, 5),
    (t.fillStyle = "#e8b84a"),
    t.fillRect(o - 1, r - 1, 3, 3),
    (t.fillStyle = "#fff2a0"),
    t.fillRect(o - 1, r - 1, 2, 1),
    (t.fillStyle = "#e0445a"),
    t.fillRect(o + (Math.cos(e) >= 0 ? 1 : -1), r, 1, 1));
}
function drawSlime(t, a) {
  const s = SLIME_PAL[a.sl ?? curMap().v.sl],
    e = a.flash > 0,
    n = a.boss ? 2 : a.elite ? 1.4 : 1,
    l =
      a.lunge > 0
        ? 0.3 * Math.sin((a.lunge / 0.2) * Math.PI)
        : 0.08 * Math.sin(5 * a.t),
    o = 6 * n,
    r = Math.round(o * (1 + l)),
    i = Math.round(0.78 * o * (1 - l)),
    c = Math.round(a.x + (a.lunge > 0 ? 2 * a.face : 0)),
    d = Math.round(a.y) - i;
  if (
    ((t.fillStyle = e ? "#ffffff" : INK),
    pell(t, c, d, r + 1, i + 1),
    (t.fillStyle = e ? "#ffffff" : s[1]),
    pell(t, c, d, r, i),
    e)
  )
    return;
  ((t.fillStyle = s[0]),
    pell(t, c - 1, d - 1, Math.max(1, r - 2), Math.max(1, i - 2)),
    (t.fillStyle = s[2]),
    t.fillRect(c - Math.round(0.5 * r), d - Math.round(0.55 * i), 2, 1));
  const f = a.eye ?? Math.round(1.5 * clamp((G.pl.x - a.x) / 40, -1, 1) * n),
    p = Math.round(2 * n);
  ((t.fillStyle = INK),
    t.fillRect(c - p + f - 1, d - 1, n > 1 ? 2 : 1, n > 1 ? 3 : 2),
    t.fillRect(c + p + f, d - 1, n > 1 ? 2 : 1, n > 1 ? 3 : 2));
}
function drawWisp(t, a) {
  const s =
      4 === (a.sl ?? curMap().v.sl)
        ? ["#d0a0ff", "#7a3ad0"]
        : ["#7ad4ff", "#2a6fa0"],
    e = a.boss ? 2 : 1,
    n = a.flash > 0,
    l = Math.round(a.x + (a.lunge > 0 ? 2 * a.face : 0)),
    o = Math.round(a.y - 7 * e + 2 * Math.sin(3 * a.t));
  if (
    ((t.fillStyle = n ? "#fff" : INK),
    pcirc(t, l, o, 5 * e),
    (t.fillStyle = n ? "#fff" : s[1]),
    pcirc(t, l, o, 4 * e),
    !n)
  ) {
    ((t.fillStyle = s[0]), pcirc(t, l, o - e, 3 * e));
    for (let s = 0; s < 4; s++) {
      const n = 2 + Math.floor(4 * hash2(s, Math.floor(10 * a.t)));
      t.fillRect(l - 3 * e + 2 * s * e, o - 4 * e - n * e, e, n * e);
    }
    ((t.fillStyle = "#ffffff"),
      t.fillRect(l - 2 * e, o - e, e, 2 * e),
      t.fillRect(l + e, o - e, e, 2 * e));
  }
}
const SPIRIT_COL = {
  brn: ["#fff0a0", "#ff9a3a", "#c8402a"],
  chl: ["#ffffff", "#9ae4ff", "#3a8ad0"],
  shk: ["#ffffff", "#ffe04a", "#b0901a"],
};
function drawSpirit(t, a) {
  const s = SPIRIT_COL[a.el],
    e = Math.round(a.x),
    n = Math.round(a.y - 9 + 2 * Math.sin(4 * a.t));
  ((t.fillStyle = INK),
    pcirc(t, e, n, 4),
    (t.fillStyle = s[2]),
    pcirc(t, e, n, 3),
    (t.fillStyle = s[1]),
    pcirc(t, e, n - 1, 2));
  for (let l = 0; l < 3; l++) {
    const o = 1 + Math.floor(3 * hash2(l + 7, Math.floor(10 * a.t)));
    ((t.fillStyle = s[1]), t.fillRect(e - 2 + 2 * l, n - 3 - o, 1, o));
  }
  ((t.fillStyle = s[0]),
    t.fillRect(e - 1, n - 1, 1, 1),
    t.fillRect(e + 1, n - 1, 1, 1));
}
const GSP_ROWS = [
    "....PP.....",
    "...BBB.....",
    "..BAAAB...S",
    "..BEBEB...S",
    "...BBB....S",
    "DD.BAB....S",
    "DFDBAABBBHH",
    "DFDBAAAB...",
    "DDDBBAB....",
    ".D..BAB....",
    "....BCB....",
    ".....C.....",
  ],
  GSP_PAL = {
    k: "#1a2448",
    A: "#e8f4ff",
    B: "#9ab8f0",
    C: "#5a7ac0",
    E: "#7affff",
    P: "#c8e0ff",
    D: "#6a88d0",
    F: "#e8d070",
    S: "#eef4ff",
    H: "#c8a050",
  };
function drawGsp(t, a) {
  const s = (SP.gsp ||
      (SP.gsp = (() => {
        const t = paint(outlineRows(GSP_ROWS), GSP_PAL),
          a = tintC(t, "#ffffff");
        return [t, flipC(t), a, flipC(a)];
      })()))[(a.hurt > 0 ? 2 : 0) + (a.face < 0 ? 1 : 0)],
    e =
      Math.round(a.x - s.width / 2) +
      (a.sw > 0
        ? Math.round(3 * Math.sin((a.sw / 0.2) * Math.PI)) * a.face
        : 0),
    n = Math.round(a.y - s.height - 1 + 1.5 * Math.sin(3 * a.t));
  if (
    ((t.globalAlpha = 0.88),
    t.drawImage(s, e, n),
    (t.globalAlpha = 1),
    a.hp < a.max)
  ) {
    const s = Math.round(a.x) - 6,
      e = n - 3;
    ((t.fillStyle = "#120d1c"),
      t.fillRect(s - 1, e - 1, 14, 3),
      (t.fillStyle = "#9ab0ff"),
      t.fillRect(s, e, Math.max(1, Math.round((12 * a.hp) / a.max)), 1));
  }
}
function drawMob(t, a) {
  const s = a.spawnT > 0 ? clamp(1 - a.spawnT / 0.45, 0, 1) : 1;
  if (((t.globalAlpha = s), "slime" === a.type)) drawSlime(t, a);
  else if ("wisp" === a.type) drawWisp(t, a);
  else {
    const s = SP.mon[a.type],
      e = a.boss ? 2 : 1,
      n = Math.floor(a.t * ("bat" === a.type ? 10 : 5)) % 2,
      l = s.w * e,
      o = s.h * e,
      r = a.face < 0;
    let i =
        Math.round(a.x - l / 2) +
        (a.lunge > 0
          ? Math.round(3 * Math.sin((a.lunge / 0.2) * Math.PI)) * a.face
          : 0),
      c =
        Math.round(a.y - o) -
        ("bat" === a.type || MON[a.type].fl
          ? 4 + Math.round(2 * Math.sin(6 * a.t))
          : 0);
    const d = (a) => {
      r
        ? (t.save(),
          t.translate(i + l, c),
          t.scale(-1, 1),
          t.drawImage(a, 0, 0, l, o),
          t.restore())
        : t.drawImage(a, i, c, l, o);
    };
    if (a.elite || a.boss) {
      const t = (a.boss ? s.red : s.gold)[n];
      for (const [a, s] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ])
        ((i += a), (c += s), d(t), (i -= a), (c -= s));
    }
    (d(a.flash > 0 ? s.white[n] : s.fr[n]),
      a.slow > 0 &&
        ((t.fillStyle = "rgba(122,212,255,.45)"),
        t.fillRect(i, c + o - 3, l, 3)));
  }
  if (((t.globalAlpha = 1), (a.elite || a.boss) && !a.snap)) {
    const s = Math.round(a.x),
      e = Math.round(a.y - a.h - (a.boss ? 8 : 6));
    ((t.fillStyle = INK),
      t.fillRect(s - 5, e - 2, 11, 6),
      (t.fillStyle = "#ffd84a"),
      t.fillRect(s - 4, e + 2, 9, 2),
      t.fillRect(s - 4, e, 1, 2),
      t.fillRect(s, e - 1, 1, 3),
      t.fillRect(s + 4, e, 1, 2),
      (t.fillStyle = "#e0445a"),
      t.fillRect(s, e + 2, 1, 1));
  }
  if (a.tnt > 0) {
    const s = Math.round(a.x) + (a.boss ? 12 : 7),
      e = Math.round(a.y - a.h) - (a.boss ? 8 : 6);
    ((t.fillStyle = INK),
      t.fillRect(s - 1, e - 1, 3, 7),
      (t.fillStyle = "#ff5a6a"),
      t.fillRect(s, e, 1, 3),
      t.fillRect(s, e + 4, 1, 1));
  }
  if (a.crs) {
    let s = Math.round(a.x) - 4,
      e = 0;
    const n = Math.round(a.y - a.h) - (a.boss ? 12 : 9);
    for (const l in a.crs)
      a.crs[l] > 0 &&
        (a.crs[l] > 1.5 || G.t % 0.3 < 0.2) &&
        ((t.fillStyle = INK),
        t.fillRect(s + 4 * e - 1, n - 1, 4, 4),
        (t.fillStyle = CRS[l].col),
        t.fillRect(s + 4 * e, n, 2, 2),
        e++);
  }
  if (a.psn && a.psn.s.length > 1) {
    const s = "" + a.psn.s.length;
    ptext(
      t,
      s,
      Math.round(a.x) - (a.boss ? 12 : 8) - textW(s),
      Math.round(a.y - a.h) - (a.boss ? 8 : 6),
      "#8ad94a",
    );
  }
  if (!a.boss && a.hp < a.max) {
    const s = Math.round(a.x) - 6,
      e = Math.round(a.y - a.h) - 4;
    ((t.fillStyle = "#120d1c"),
      t.fillRect(s - 1, e - 1, 14, 3),
      (t.fillStyle = a.elite ? "#ffa040" : "#e0445a"),
      t.fillRect(s, e, Math.max(1, Math.round((12 * a.hp) / a.max)), 1));
  }
  if (a.sh > 0) {
    const s = Math.round(a.x) - 6,
      e = Math.round(a.y - a.h) - 6;
    ((t.fillStyle = "#1a2040"),
      t.fillRect(s - 1, e - 1, 14, 3),
      (t.fillStyle = "#9ab0ff"),
      t.fillRect(s, e, Math.max(1, Math.round((12 * a.sh) / a.shm)), 1));
  }
}
function gemSpr(t, a) {
  const s = SP.gm || (SP.gm = {}),
    e = SKILLS[t].col,
    n = t + (a ? ":sx" : "");
  return (
    s[n] ||
    (s[n] = paint(outlineRows([".AA.", "ACAB", "AAAB", ".BB."]), {
      k: a ? SX_COL : INK,
      A: e,
      B: shade(e, -0.35),
      C: "#ffffff",
    }))
  );
}
function drawLoot(t) {
  for (const a of G.drops) {
    const s = Math.round(a.x),
      e = Math.round(a.y - a.z);
    ((t.fillStyle = "rgba(10,14,28,.35)"),
      t.fillRect(s - 2, Math.round(a.y) + 1, 5, 1));
    const n = a.landed ? Math.round(1 * Math.sin(3 * G.t + a.x)) : 0,
      l = (a.it || a.sl)?.my;
    if (l) {
      t.drawImage(
        mythStrip(iconKey(a.it || a.sl)),
        (Math.floor((G.t / 2.4) * 16) % 16) * 16,
        0,
        16,
        16,
        s - 8,
        e - 17 + 2 * n,
        16,
        16,
      );
      for (let a = 0; a < 4; a++) {
        const n = 2.4 * G.t + 1.571 * a,
          l = Math.round(s + 11 * Math.cos(n)),
          o = Math.round(e - 9 + 5 * Math.sin(n));
        ((t.fillStyle = (Math.floor(6 * G.t) + a) % 3 ? "#ffd84a" : "#ffffff"),
          t.fillRect(l, o, 1, 1),
          a % 2 == 0 &&
            ((t.fillStyle = "#ff3030"), t.fillRect(l, o + 1, 1, 1)));
      }
    } else
      t.drawImage(
        a.mk
          ? SP.mk
          : null != a.tk
            ? SP.gd[a.tk][0]
            : null != a.ssf
              ? SP.ssf[a.ssf]
              : null != a.fr
                ? SP.gd[a.fr][1]
                : a.mat
                  ? SP.mat[MATS[a.mat].f]
                  : a.sl
                    ? SP.slate[a.tier]
                    : a.gm
                      ? gemSpr(a.gm.id, a.gm.sx)
                      : SP.pouch[a.tier],
        s - 3,
        e - 7 + n,
      );
  }
  for (const a of G.orbs) {
    const s = Math.round(a.x),
      e = Math.round(a.y - a.z);
    ((t.fillStyle = "#1b5a4a"),
      t.fillRect(s - 1, e - 2, 3, 3),
      (t.fillStyle = Math.floor(8 * G.t + a.x) % 2 ? "#7dffc8" : "#c8fff0"),
      t.fillRect(s, e - 1, 1, 1));
  }
}
function drawGuard(t) {
  const a = G.boss,
    s = a && a.gm;
  if (!s || !alive(a)) return;
  const e = (a, s, e, n) => {
    for (let l = 0; l < 6.283; l += n / Math.max(6, e))
      t.fillRect(
        Math.round(a + Math.cos(l) * e),
        Math.round(s + Math.sin(l) * e * 0.7),
        1,
        1,
      );
  };
  if (s.slam > 0) {
    const a = 1 - s.slam / GUARD_SLAM.t,
      n = GUARD_SLAM.r;
    ((t.globalAlpha = 0.18 + 0.14 * a),
      (t.fillStyle = "#ff3a2a"),
      pell(t, s.x, s.y, Math.round(n * a), Math.round(0.7 * n * a)),
      (t.globalAlpha = G.t % 0.2 < 0.12 ? 1 : 0.6),
      (t.fillStyle = "#ff5a3a"),
      e(s.x, s.y, n, 1),
      (t.globalAlpha = 1));
  }
  s.on &&
    ((t.fillStyle = "#7ad46a"),
    (t.globalAlpha = 0.55 + 0.25 * Math.sin(6 * G.t)),
    e(a.x, a.y, 18, 2.2),
    (t.globalAlpha = 1));
}
function drawTurret(t, a) {
  const s = Math.round(a.x),
    e = Math.round(a.y),
    n = clamp(a.t / 0.3, 0, 1),
    l = Math.round(4 + 3 * n),
    o = a.face,
    r = a.fire > 0 ? -o : 0;
  if (
    ((t.globalAlpha = a.t > TUR.t - 0.6 ? (TUR.t - a.t) / 0.6 : 1),
    (t.fillStyle = INK),
    t.fillRect(s - 3, e - 1, 7, 2),
    t.fillRect(s - 2, e - l - 1, 5, l + 1),
    (t.fillStyle = "#6b4a32"),
    t.fillRect(s - 2, e - 1, 5, 1),
    (t.fillStyle = "#a3764d"),
    t.fillRect(s - 1, e - l, 3, l),
    (t.fillStyle = "#c8a070"),
    t.fillRect(s - 1, e - l, 1, l),
    n >= 1)
  ) {
    const n = s + r,
      i = e - l - 2;
    ((t.fillStyle = INK),
      t.fillRect(n - 3, i - 1, 7, 3),
      t.fillRect(n + 2 * o - 1, i - 3, 3, 7),
      (t.fillStyle = "#8a6a4a"),
      t.fillRect(n - 2, i, 5, 1),
      (t.fillStyle = "#e8d8b0"),
      t.fillRect(n + 2 * o, i - 2, 1, 5),
      (t.fillStyle = a.fire > 0 ? "#ffffff" : "#e0445a"),
      t.fillRect(n + 3 * o, i, 1, 1));
  }
  t.globalAlpha = 1;
}
function drawSpin(t) {
  const a = G.pl;
  if (!a.sus || !a.sus.whirlL || G.dead) return;
  const s = activeGems().find((t) => "whirlL" === (SKILLS[t.id]?.roBase || t.id)),
    e = LEG.spin.r * PS.area * (1 + (s ? gemMods(s).area : 0)),
    n = 14 * G.t;
  for (let s = 0; s < 3; s++)
    for (let l = 0; l < 6; l++) {
      const o = n + 2.094 * s - 0.12 * l;
      ((t.globalAlpha = 1 - 0.15 * l),
        (t.fillStyle = l ? "#ffd890" : "#ffffff"),
        t.fillRect(
          Math.round(a.x + Math.cos(o) * e),
          Math.round(a.y - 3 + Math.sin(o) * e * 0.6),
          1,
          1,
        ));
    }
  t.globalAlpha = 1;
}
function drawBpool(t) {
  const a = G.pl;
  if (!a.sus || !a.sus.bpool || G.dead) return;
  const s = bpoolR(),
    e = Math.round(a.x),
    n = Math.round(a.y),
    l = 0.9 + 0.1 * Math.sin(3 * G.t);
  ((t.globalAlpha = 0.35),
    (t.fillStyle = "#5a0a18"),
    pell(t, e, n, Math.round(s * l), Math.round(0.6 * s * l)),
    (t.globalAlpha = 0.45),
    (t.fillStyle = "#8a1020"),
    pell(t, e, n, Math.round(0.7 * s * l), Math.round(0.42 * s * l)),
    (t.globalAlpha = 0.9),
    (t.fillStyle = "#e02a3a"));
  for (let a = 0; a < 6.283; a += 1.4 / Math.max(6, s))
    hash2(Math.round(20 * a), Math.floor(4 * G.t)) < 0.6 &&
      t.fillRect(
        Math.round(e + Math.cos(a) * s * l),
        Math.round(n + Math.sin(a) * s * 0.6 * l),
        1,
        1,
      );
  for (let a = 0; a < 5; a++) {
    const l = (1.3 * G.t + 0.37 * a) % 1,
      o = 6.283 * hash2(a, Math.floor(1.3 * G.t + 0.37 * a)),
      r = hash2(Math.floor(1.3 * G.t + 0.37 * a), a + 9) * s * 0.8;
    t.fillStyle = l < 0.7 ? "#c82a3a" : "#ff8a9a";
    const i = Math.round(e + Math.cos(o) * r),
      c = Math.round(n + Math.sin(o) * r * 0.6);
    t.fillRect(i, c - (l < 0.7 ? 0 : 1), l < 0.7 ? 1 : 2, 1);
  }
  t.globalAlpha = 1;
}
function drawSap(t, a) {
  const s = Math.round(a.x),
    e = Math.round(a.y),
    n = clamp(a.t / 0.4, 0, 1),
    l = a.t > SAP.t - 1,
    o = Math.round(2 + 4 * n),
    r = Math.round(0.6 * Math.sin(2 * G.t + a.x));
  if (
    ((t.fillStyle = INK),
    t.fillRect(s - 1, e - o, 3, o + 1),
    (t.fillStyle = "#7a5838"),
    t.fillRect(s, e - o + 1, 1, o),
    n < 0.6)
  )
    return;
  const i = s + r,
    c = e - o - 2;
  ((t.fillStyle = INK),
    t.fillRect(i - 3, c - 2, 7, 5),
    t.fillRect(i - 2, c - 3, 5, 7),
    (t.fillStyle = l ? "#8a7a3a" : "#3e8a3a"),
    t.fillRect(i - 2, c - 1, 5, 3),
    t.fillRect(i - 1, c - 2, 3, 5),
    (t.fillStyle = l ? "#b0a050" : "#7ad46a"),
    t.fillRect(i - 1, c - 1, 2, 2));
}
function drawOrbit(t) {
  G.orbit.forEach((a, s) => {
    const [e, n] = orbitPos(s),
      l = Math.round(e),
      o = Math.round(n);
    (a.t > 1.5 || G.t % 0.3 < 0.2) &&
      ((t.fillStyle = INK),
      t.fillRect(l - 2, o - 1, 5, 3),
      t.fillRect(l - 1, o - 2, 3, 5),
      (t.fillStyle = "#9ab0ff"),
      t.fillRect(l - 1, o, 3, 1),
      t.fillRect(l, o - 1, 1, 3),
      (t.fillStyle = "#ffffff"),
      t.fillRect(l, o, 1, 1));
  });
}
function drawGuardTop(t) {
  const a = G.boss,
    s = a && a.gm;
  if (!(s && alive(a) && s.sh > 0)) return;
  const e = a.y - 0.5 * a.h,
    n = 0.5 * a.h + 5;
  ((t.globalAlpha = 0.18),
    (t.fillStyle = "#9ab0ff"),
    pcirc(t, a.x, e, n),
    (t.globalAlpha = 0.8 + 0.2 * Math.sin(8 * G.t)),
    (t.fillStyle = "#d0dcff"));
  for (let s = 0; s < 6.283; s += 1.5 / n)
    t.fillRect(
      Math.round(a.x + Math.cos(s) * n),
      Math.round(e + Math.sin(s) * n),
      1,
      1,
    );
  t.globalAlpha = 1;
}
function drawHaz(t) {
  const a = (a, s, e, n) => {
    for (let l = 0; l < 6.283; l += n / Math.max(6, e))
      t.fillRect(
        Math.round(a + Math.cos(l) * e),
        Math.round(s + Math.sin(l) * e * 0.7),
        1,
        1,
      );
  };
  for (const s of G.haz) {
    if ("frost" === s.k) {
      const e = Math.min(1, s.life / 0.5, (s.L - s.life) / 0.3);
      ((t.globalAlpha = 0.28 * e),
        (t.fillStyle = "#9ad8ff"),
        pell(t, s.x, s.y, s.r, Math.round(0.7 * s.r)),
        (t.globalAlpha = 0.8 * e),
        (t.fillStyle = "#e8f8ff"));
      for (let a = 0; a < 6; a++) {
        const e = 1.05 * a + 0.6 * G.t,
          n = s.r * (0.3 + 0.6 * hash2(a, 0 | s.x));
        t.fillRect(
          Math.round(s.x + Math.cos(e) * n),
          Math.round(s.y + Math.sin(e) * n * 0.7),
          1,
          1,
        );
      }
      ((t.fillStyle = "#bfe8ff"), a(s.x, s.y, s.r, 2.4), (t.globalAlpha = 1));
      continue;
    }
    const e = 1 - s.t / s.T,
      n = G.t % 0.2 < 0.12 ? 1 : 0.6;
    if ("line" === s.k) {
      const a = s.x2 - s.x,
        l = s.y2 - s.y,
        o = Math.hypot(a, l) || 1,
        r = -l / o,
        i = (a / o) * 0.7;
      ((t.globalAlpha = 0.16 + 0.14 * e), (t.fillStyle = s.c));
      for (let n = 0; n <= o * e; n += 1)
        for (let e = -s.w; e <= s.w; e += 1)
          t.fillRect(
            Math.round(s.x + (a / o) * n + r * e),
            Math.round(s.y + (l / o) * n + i * e),
            1,
            1,
          );
      t.globalAlpha = n;
      for (let e = 0; e <= o; e += 2)
        for (const n of [-s.w, s.w])
          t.fillRect(
            Math.round(s.x + (a / o) * e + r * n),
            Math.round(s.y + (l / o) * e + i * n),
            1,
            1,
          );
      t.globalAlpha = 1;
      continue;
    }
    ((t.globalAlpha = 0.18 + 0.14 * e),
      (t.fillStyle = s.c),
      pell(t, s.x, s.y, Math.round(s.r * e), Math.round(0.7 * s.r * e)),
      (t.globalAlpha = n),
      a(s.x, s.y, s.r, 1),
      (t.globalAlpha = 1));
  }
  for (const a of G.mobs)
    a.ea &&
      a.spawnT <= 0 &&
      a.ea.forEach((s, e) => {
        ((t.fillStyle = ELITE_AF[s].c), (t.globalAlpha = 0.85));
        for (let s = 0; s < 4; s++) {
          const n = G.t * (e ? -2.2 : 2.2) + 1.571 * s + 0.78 * e;
          t.fillRect(
            Math.round(a.x + Math.cos(n) * (9 + 3 * e)),
            Math.round(a.y + Math.sin(n) * (5 + 2 * e)),
            1,
            1,
          );
        }
        t.globalAlpha = 1;
      });
}
const ARW_DRAW = {
  farrow: ["#ff6a3a", "#fff0a0"],
  iarrow: ["#7ad4ff", "#e0faff"],
  larrow: ["#e0c03a", "#fff8a0"],
};
function drawFxGround(t) {
  (drawGuard(t), drawHaz(t), drawBpool(t), drawSpin(t));
  for (const a of G.fx)
    if ("fist" === a.k) {
      alive(a.m) && a.t < 0 && ((a.x = a.m.x), (a.y = a.m.y));
      const s = Math.round(a.x),
        e = Math.round(a.y);
      if (a.t < 0) {
        const n = 1 + a.t / a.d;
        ((t.globalAlpha = 0.2 + 0.4 * n),
          (t.fillStyle = INK),
          pell(
            t,
            s,
            e,
            Math.round(3 + 4 * n),
            Math.max(1, Math.round(1 + 1.5 * n)),
          ),
          (t.globalAlpha = 1));
        continue;
      }
      const n = a.t / a.life,
        l = Math.max(8, a.r || 0),
        o = Math.min(1, 6 * n) * l;
      ((t.globalAlpha = n < 0.6 ? 0.55 : (0.55 * (1 - n)) / 0.4),
        (t.fillStyle = INK),
        pell(t, s, e, 6, 2),
        (t.globalAlpha = n < 0.6 ? 1 : (1 - n) / 0.4));
      for (let a = 0; a < 7; a++) {
        const l = 0.898 * a + 0.3,
          r = Math.cos(l),
          i = 0.5 * Math.sin(l);
        for (let l = 5; l <= o * (a % 3 ? 0.8 : 1); l++) {
          const o = Math.round(
              s + r * l + ((l >> 1) % 2 ? 1 : 0) * (a % 2 ? 1 : -1),
            ),
            c = Math.round(e + i * l);
          ((t.fillStyle = INK),
            t.fillRect(o, c, 1, 1),
            n < 0.25 &&
              ((t.fillStyle = "#ffe48a"), t.fillRect(o, c - 1, 1, 1)));
        }
      }
      t.globalAlpha = 1;
    }
  for (const a of G.fx) {
    const s = clamp(a.t / a.life, 0, 1);
    if ("ring" === a.k) {
      t.fillStyle = a.col;
      const e = a.r * (0.3 + 0.7 * s);
      t.globalAlpha = 1 - 0.8 * s;
      for (let s = 0; s < 6.283; s += 1.6 / Math.max(6, e))
        t.fillRect(
          Math.round(a.x + Math.cos(s) * e),
          Math.round(a.y + Math.sin(s) * e * 0.6),
          1,
          1,
        );
      t.globalAlpha = 1;
    } else if ("nova" === a.k) {
      const e = a.r * (0.2 + 0.8 * Math.sqrt(s));
      ((t.globalAlpha = 0.25 * (1 - s)),
        (t.fillStyle = a.c1 || "#7ad4ff"),
        pell(t, a.x, a.y, Math.round(e), Math.round(0.6 * e)),
        (t.globalAlpha = 1 - 0.6 * s),
        (t.fillStyle = a.c2 || "#e0faff"));
      for (let s = 0; s < 6.283; s += 0.06)
        t.fillRect(
          Math.round(a.x + Math.cos(s) * e),
          Math.round(a.y + Math.sin(s) * e * 0.6),
          1,
          1,
        );
      t.fillStyle = a.c1 || "#7ad4ff";
      for (let s = 0; s < 6.283; s += 0.45) {
        const n = 0.85 * e;
        t.fillRect(
          Math.round(a.x + Math.cos(s) * n),
          Math.round(a.y + Math.sin(s) * n * 0.6) - 2,
          1,
          3,
        );
      }
      t.globalAlpha = 1;
    } else if ("rain" === a.k)
      if (a.t < 0) {
        const s = clamp(1 + a.t / 0.2, 0, 1);
        ((t.fillStyle = "#d4ff8a"), (t.globalAlpha = 0.5 * s));
        for (let s = 0; s < 6.283; s += 0.3)
          t.fillRect(
            Math.round(a.x + Math.cos(s) * a.r),
            Math.round(a.y + Math.sin(s) * a.r * 0.6),
            1,
            1,
          );
        t.globalAlpha = 1;
        for (let e = 0; e < 7; e++) {
          const n = a.x + (hash2(e, 0 | a.x) - 0.5) * a.r * 1.6,
            l = a.y + (hash2(0 | a.y, e) - 0.5) * a.r - 60 + 60 * s;
          ((t.fillStyle = INK),
            t.fillRect(Math.round(n) - 1, Math.round(l) - 1, 3, 6),
            (t.fillStyle = "#e8d8b0"),
            t.fillRect(Math.round(n), Math.round(l), 1, 4),
            (t.fillStyle = "#ffffff"),
            t.fillRect(Math.round(n), Math.round(l) + 4, 1, 1));
        }
      } else {
        t.fillStyle = "#e8d8b0";
        for (let s = 0; s < 7; s++) {
          const e = a.x + (hash2(s, 0 | a.x) - 0.5) * a.r * 1.6,
            n = a.y + (hash2(0 | a.y, s) - 0.5) * a.r;
          t.fillRect(Math.round(e), Math.round(n) - 3, 1, 3);
        }
      }
    else if ("trap" === a.k) {
      const s = clamp(a.t / TRAP.arm, 0, 1),
        e = Math.round(a.fx + (a.x - a.fx) * s),
        n = Math.round(a.fy + (a.y - a.fy) * s - 14 * Math.sin(s * Math.PI));
      if (s < 1)
        ((t.fillStyle = INK),
          t.fillRect(e - 2, n - 2, 5, 4),
          (t.fillStyle = "#b0a070"),
          t.fillRect(e - 1, n - 1, 3, 2));
      else {
        const s = Math.min(1, (a.life - a.t) / 0.5);
        ((t.globalAlpha = s),
          (t.fillStyle = INK),
          pell(t, e, n, 6, 3),
          (t.fillStyle = "#6a5a3a"),
          pell(t, e, n, 5, 2),
          (t.fillStyle = "#3a3028"),
          t.fillRect(e - 3, n, 7, 1),
          (t.fillStyle = "#e0e0d0"));
        for (let a = -4; a <= 4; a += 2)
          (t.fillRect(e + a, n - 2, 1, 1), t.fillRect(e + a, n + 2, 1, 1));
        ((t.fillStyle = G.t % 0.8 < 0.4 ? "#ff6a3a" : "#e0d090"),
          t.fillRect(e, n, 1, 1),
          (t.globalAlpha = 1));
      }
    } else if ("mtr" === a.k && a.t < 0) {
      const s = 1 + a.t / MTR.t,
        e = G.t % 0.2 < 0.12 ? 1 : 0.6;
      ((t.globalAlpha = 0.15 + 0.2 * s),
        (t.fillStyle = "#ff6a3a"),
        pell(t, a.x, a.y, Math.round(a.r * s), Math.round(0.6 * a.r * s)),
        (t.globalAlpha = e),
        (t.fillStyle = "#ffb347"));
      for (let s = 0; s < 6.283; s += 1 / Math.max(6, a.r))
        t.fillRect(
          Math.round(a.x + Math.cos(s) * a.r),
          Math.round(a.y + Math.sin(s) * a.r * 0.6),
          1,
          1,
        );
      t.globalAlpha = 1;
    } else if ("lava" === a.k) {
      const s = Math.min(1, (a.life - a.t) / 0.5, a.t / 0.2);
      ((t.globalAlpha = 0.55 * s),
        (t.fillStyle = "#b8301a"),
        pell(t, a.x, a.y, Math.round(a.r), Math.round(0.6 * a.r)),
        (t.globalAlpha = 0.8 * s));
      for (let s = 0; s < 10; s++) {
        const e = 2.4 * s + a.x,
          n = 0.8 * a.r * hash2(s, 0 | a.y);
        ((t.fillStyle = (3 * G.t + s) % 2 < 1 ? "#ffb347" : "#ff6a3a"),
          t.fillRect(
            Math.round(a.x + Math.cos(e) * n),
            Math.round(a.y + Math.sin(e) * n * 0.6),
            2,
            1,
          ));
      }
      t.globalAlpha = 1;
    } else if ("bliz" === a.k) {
      const s = Math.min(1, (a.life - a.t) / 0.4, a.t / 0.2);
      ((t.globalAlpha = 0.22 * s),
        (t.fillStyle = "#bfe8ff"),
        pell(t, a.x, a.y, Math.round(a.r), Math.round(0.6 * a.r)),
        (t.globalAlpha = 0.9 * s));
      for (let s = 0; s < 26; s++) {
        const e = (0.9 * G.t + hash2(s, 7)) % 1,
          n = 6.283 * hash2(s, 3) + 0.8 * G.t,
          l = a.r * Math.sqrt(hash2(s, 5)),
          o = Math.round(a.x + Math.cos(n) * l),
          r = Math.round(a.y + Math.sin(n) * l * 0.6 - 22 * (1 - e));
        ((t.fillStyle = s % 3 ? "#ffffff" : "#9ad8ff"),
          t.fillRect(o, r, 1, 1),
          s % 5 == 0 &&
            (t.fillRect(o - 1, r, 3, 1), t.fillRect(o, r - 1, 1, 3)));
      }
      t.fillStyle = "#e8f8ff";
      for (let s = 0; s < 6.283; s += 2.4 / Math.max(6, a.r))
        t.fillRect(
          Math.round(a.x + Math.cos(s) * a.r),
          Math.round(a.y + Math.sin(s) * a.r * 0.6),
          1,
          1,
        );
      t.globalAlpha = 1;
    } else if ("mia" === a.k) {
      const s = Math.min(1, (a.life - a.t) / 0.5, a.t / 0.25);
      ((t.globalAlpha = 0.32 * s),
        (t.fillStyle = "#5a8a2a"),
        pell(t, a.x, a.y, Math.round(a.r), Math.round(0.6 * a.r)),
        (t.fillStyle = "#8ac040"),
        pell(t, a.x, a.y, Math.round(0.6 * a.r), Math.round(0.36 * a.r)),
        (t.globalAlpha = 0.85 * s * (1 - 0.3 * Math.sin(3 * G.t))));
      for (let s = 0; s < 24; s++) {
        const e = (0.35 * G.t + hash2(s, 11)) % 1,
          n = 6.283 * hash2(s, 4) + 0.3 * G.t,
          l = a.r * Math.sqrt(hash2(s, 9)) * 0.9,
          o = Math.round(a.x + Math.cos(n) * l),
          r = Math.round(a.y + Math.sin(n) * l * 0.6 - 12 * e),
          i = s % 4 ? 2 : 3;
        ((t.fillStyle = ["#4a7a1a", "#9ad040", "#d4ff8a"][s % 3]),
          t.fillRect(o, r, i, i - 1));
      }
      t.globalAlpha = 1;
    } else if ("fiss" === a.k) {
      const s = a.x2 - a.x,
        e = a.y2 - a.y,
        n = Math.hypot(s, e) || 1,
        l = -e / n,
        o = s / n,
        r = Math.min(1, (a.life - a.t) / 0.6);
      for (let i = 0; i <= n; i += 1) {
        const c = Math.round(3 * (hash2(Math.floor(i / 3), a.s) - 0.5)),
          d = Math.round(a.x + (s / n) * i + l * c),
          f = Math.round(a.y + (e / n) * i + o * c * 0.7);
        ((t.globalAlpha = 0.45 * r),
          (t.fillStyle = "#e02a3a"),
          t.fillRect(d - 1, f - 1, 3, 3),
          (t.globalAlpha = r),
          (t.fillStyle = "#1b1424"),
          t.fillRect(d, f, 1, 1),
          i % 5 == 0 &&
            ((t.fillStyle = (6 * G.t + i) % 4 < 2 ? "#ff6a5a" : "#8a1020"),
            t.fillRect(d, f - 1, 1, 1)));
      }
      t.globalAlpha = 1;
    } else
      "boom" === a.k &&
        ((t.fillStyle = s < 0.35 ? "#ffffff" : "#ffb347"),
        pcirc(t, a.x, a.y, Math.round(a.r * (0.4 + 0.6 * s) * (1 - 0.3 * s))),
        s < 0.5 &&
          ((t.fillStyle = "#fff0a0"),
          pcirc(t, a.x, a.y, Math.round(0.5 * a.r * (1 - s)))));
  }
}
function drawFxTop(t) {
  (drawGuardTop(t), drawOrbit(t));
  for (const a of G.mobs) {
    if (a.fst) {
      t.fillStyle = "#bfe8ff";
      for (let s = 0; s < a.fst.n; s++)
        t.fillRect(
          Math.round(a.x - 4 + 2 * s),
          Math.round(a.y - a.h - 4),
          1,
          2,
        );
    }
    if (a.frz > 0) {
      const s = Math.round(0.55 * a.h) + 2,
        e = Math.round(a.x),
        n = Math.round(a.y - 0.5 * a.h);
      ((t.globalAlpha = 0.45),
        (t.fillStyle = "#9ad8ff"),
        t.fillRect(
          e - s,
          n - Math.round(0.55 * a.h),
          2 * s + 1,
          Math.round(1.1 * a.h),
        ),
        (t.globalAlpha = 0.9),
        (t.fillStyle = "#e8f8ff"),
        t.fillRect(e - s, n - Math.round(0.55 * a.h), 2 * s + 1, 1),
        t.fillRect(e - s, n - Math.round(0.55 * a.h), 1, Math.round(1.1 * a.h)),
        (t.fillStyle = "#ffffff"),
        t.fillRect(e - s + 2, n - Math.round(0.4 * a.h), 1, 3),
        (t.globalAlpha = 1));
    }
  }
  for (const a of G.mobs)
    if (a.fz)
      for (let s = 0; s < a.fz.n; s++) {
        const e = Math.round(a.x - 4 + 2 * s),
          n = Math.round(a.y - 0.6 * a.h + (s % 2) * 2);
        ((t.fillStyle = INK),
          t.fillRect(e - 1, n - 4, 3, 5),
          (t.fillStyle = "#e8d8b0"),
          t.fillRect(e, n - 3, 1, 3),
          (t.fillStyle =
            (G.t * (2 + 2 * a.fz.n)) % 1 < 0.5 ? "#fff0a0" : "#ff6a3a"),
          t.fillRect(e, n, 1, 1));
      }
  for (const a of G.fx)
    if ("mtr" === a.k && a.t < 0) {
      const s = 1 + a.t / MTR.t,
        e = Math.round(a.x - 60 * (1 - s)),
        n = Math.round(a.y - 6 - 130 * (1 - s)),
        l = 5;
      ((t.fillStyle = "#ff8a3a"), (t.globalAlpha = 0.5));
      for (let a = 1; a < 6; a++)
        pcirc(t, e - 4 * a, n - 8 * a, Math.max(1, l - a));
      ((t.globalAlpha = 1),
        (t.fillStyle = INK),
        pcirc(t, e, n, l + 1),
        (t.fillStyle = "#6a3a2a"),
        pcirc(t, e, n, l),
        (t.fillStyle = "#ffb347"),
        pcirc(t, e + 1, n + 1, l - 2),
        (t.fillStyle = "#fff0a0"),
        t.fillRect(e + 1, n + 1, 2, 2));
    }
  for (const a of G.fx) {
    const s = clamp(a.t / a.life, 0, 1);
    if ("thrust" === a.k) {
      const e = Math.cos(a.a),
        n = 0.8 * Math.sin(a.a),
        l = a.L * Math.min(1, 3 * s),
        o = a.L * Math.max(0, 1.4 * s - 0.4);
      for (let s = o; s <= l; s++) {
        const l = Math.round(a.x + e * s),
          o = Math.round(a.y + n * s);
        ((t.fillStyle = INK), t.fillRect(l - 1, o - 1, 3, 3));
      }
      for (let s = o; s <= l; s++) {
        const o = Math.round(a.x + e * s),
          r = Math.round(a.y + n * s);
        ((t.fillStyle = s > l - 3 ? "#ffffff" : "#ffe48a"),
          t.fillRect(o, r, 1, 1));
      }
    } else if ("zap" === a.k) {
      const e = Math.max(3, Math.round(Math.hypot(a.x2 - a.x, a.y2 - a.y) / 6)),
        n = a.s + Math.floor(20 * G.t),
        l = [];
      for (let t = 0; t <= e; t++) {
        const s = t / e,
          o = t && t < e ? 8 * (hash2(n, t) - 0.5) : 0;
        l.push([a.x + (a.x2 - a.x) * s + 0.4 * o, a.y + (a.y2 - a.y) * s + o]);
      }
      for (const [n, o] of [
        [INK, 3],
        [a.col || (s < 0.5 ? "#ffffff" : "#f0f070"), 1],
      ]) {
        t.fillStyle = n;
        for (let a = 0; a < e; a++) {
          const [s, e] = l[a],
            [n, r] = l[a + 1],
            i = Math.max(1, Math.ceil(Math.hypot(n - s, r - e)));
          for (let a = 0; a <= i; a++)
            t.fillRect(
              Math.round(s + ((n - s) * a) / i) - (o >> 1),
              Math.round(e + ((r - e) * a) / i) - (o >> 1),
              o,
              o,
            );
        }
      }
    }
  }
  for (const a of G.fx)
    if ("fist" === a.k) {
      const s = fistImg(a.cl),
        e = s.width,
        n = s.height,
        l = Math.round(a.x),
        o = Math.round(a.y) + 1;
      if (a.t < 0) {
        const r = 1 + a.t / a.d,
          i = r < 0.35 ? 0 : (r - 0.35) / 0.65,
          c = 30 - 3 * Math.min(1, r / 0.35) - 27 * i * i * i;
        (i > 0.2 &&
          ((t.globalAlpha = 0.3),
          t.drawImage(s, l - e / 2, Math.round(o - n - c - 7), e, n),
          (t.globalAlpha = 0.15),
          t.drawImage(s, l - e / 2, Math.round(o - n - c - 14), e, n),
          (t.globalAlpha = 1)),
          t.drawImage(
            s,
            l - e / 2,
            Math.round(o - n - c),
            e,
            Math.round(n * (1 + 0.25 * i)),
          ));
        continue;
      }
      const r = a.t;
      if (r < 0.2) {
        const a = r < 0.06 ? 1 : 0,
          i = Math.round(e * (a ? 1.4 : 1)),
          c = Math.round(n * (a ? 0.65 : 1)),
          d = r > 0.1 ? Math.round(60 * (r - 0.1)) : 0;
        ((t.globalAlpha = r > 0.1 ? 1 - (r - 0.1) / 0.1 : 1),
          t.drawImage(
            r < 0.035 ? fistImg(2) : s,
            l - Math.round(i / 2),
            o - c - d,
            i,
            c,
          ),
          (t.globalAlpha = 1));
      }
      if (r < 0.09) {
        const a = r / 0.09,
          s = Math.round(6 + 10 * a);
        t.fillStyle = a < 0.5 ? "#ffffff" : "#fff2a0";
        for (let a = 0; a < 8; a++) {
          const e = 0.785 * a + 0.39,
            n = Math.cos(e),
            r = 0.6 * Math.sin(e);
          for (let a = Math.round(0.4 * s); a <= s; a++)
            t.fillRect(Math.round(l + n * a), Math.round(o - 3 + r * a), 1, 1);
        }
        ((t.fillStyle = "#ffffff"),
          pcirc(t, l, o - 3, Math.round(4 * (1 - a)) + 1));
      }
    }
  for (const a of G.fx)
    if ("claw" === a.k) {
      const s = a.t / a.life;
      t.fillStyle = s < 0.5 ? "#ffffff" : "#ff8a8a";
      for (let s = 0; s < 3; s++)
        for (let e = 0; e < 5; e++)
          t.fillRect(
            Math.round(a.x - 4 + 3 * s + e * a.face * -1),
            Math.round(a.y - 4 + 2 * e),
            1,
            1,
          );
    }
  for (const a of G.proj) {
    const s = Math.round(a.x),
      e = Math.round(a.y);
    if ("swave" === a.k) {
      const s = Math.atan2(a.vy || 0, a.vx || 1);
      for (const [e, n] of [
        [INK, 6],
        ["#9ad8ff", 5],
        ["#ffffff", 4],
      ]) {
        t.fillStyle = e;
        for (let l = -1.1; l <= 1.1; l += 0.18)
          t.fillRect(
            Math.round(a.x + Math.cos(s + l) * n - 3 * Math.cos(s)),
            Math.round(a.y + Math.sin(s + l) * n * 0.8 - 3 * Math.sin(s)),
            e === INK ? 2 : 1,
            e === INK ? 2 : 1,
          );
      }
    } else if (ARW_DRAW[a.k]) {
      const n = Math.atan2(a.vy || 0, a.vx || 1),
        l = Math.cos(n),
        o = Math.sin(n),
        r = ARW_DRAW[a.k];
      t.fillStyle = INK;
      for (let s = 0; s < 7; s++)
        t.fillRect(
          Math.round(a.x - l * s) - 1,
          Math.round(a.y - o * s) - 1,
          3,
          3,
        );
      t.fillStyle = r[0];
      for (let s = 0; s < 7; s++)
        t.fillRect(Math.round(a.x - l * s), Math.round(a.y - o * s), 1, 1);
      ((t.fillStyle = Math.floor(16 * G.t) % 2 ? r[1] : "#ffffff"),
        t.fillRect(s - 1, e - 1, 2, 2));
    } else if ("varrow" === a.k || "exarrow" === a.k) {
      const n = Math.atan2(a.vy || 0, a.vx || 1),
        l = Math.cos(n),
        o = Math.sin(n),
        r = "exarrow" === a.k;
      t.fillStyle = INK;
      for (let s = 0; s < 7; s++)
        t.fillRect(
          Math.round(a.x - l * s) - 1,
          Math.round(a.y - o * s) - 1,
          3,
          3,
        );
      t.fillStyle = r ? "#ff8a3a" : "#8ad94a";
      for (let s = 0; s < 7; s++)
        t.fillRect(Math.round(a.x - l * s), Math.round(a.y - o * s), 1, 1);
      ((t.fillStyle = r ? "#fff0a0" : "#e8ff9a"), t.fillRect(s, e, 1, 1));
    } else if ("arrow" === a.k || "parrow" === a.k) {
      const n = Math.atan2(a.vy || 0, a.vx || 1),
        l = "parrow" === a.k ? 9 : 6,
        o = Math.cos(n),
        r = Math.sin(n);
      t.fillStyle = INK;
      for (let s = 0; s < l; s++)
        t.fillRect(
          Math.round(a.x - o * s) - ("parrow" === a.k ? 1 : 0),
          Math.round(a.y - r * s) - ("parrow" === a.k ? 1 : 0),
          "parrow" === a.k ? 3 : 2,
          "parrow" === a.k ? 3 : 2,
        );
      t.fillStyle =
        "parrow" === a.k ? (a.gold ? "#ffe08a" : "#d4ff8a") : "#e8d8b0";
      for (let s = 0; s < l; s++)
        t.fillRect(Math.round(a.x - o * s), Math.round(a.y - r * s), 1, 1);
      ((t.fillStyle = "#ffffff"),
        t.fillRect(s, e, 1, 1),
        (t.fillStyle = "#e0445a"),
        t.fillRect(
          Math.round(a.x - o * (l - 1)),
          Math.round(a.y - r * (l - 1)),
          1,
          1,
        ));
    } else
      "bolt" === a.k
        ? ((t.fillStyle = "#6a30a0"),
          pcirc(t, s, e, 2),
          (t.fillStyle = Math.floor(16 * G.t) % 2 ? "#e0b0ff" : "#ffffff"),
          t.fillRect(s - 1, e - 1, 2, 2))
        : "mbolt" === a.k
          ? ((t.fillStyle = INK),
            pcirc(t, s, e, 2),
            (t.fillStyle = Math.floor(16 * G.t) % 2 ? a.col : "#ffffff"),
            t.fillRect(s - 1, e - 1, 2, 2))
          : "fire" === a.k && a.small
            ? ((t.fillStyle = "#d8443a"),
              pcirc(t, s, e, 2),
              (t.fillStyle = "#fff0a0"),
              t.fillRect(s, e, 1, 1))
            : "fire" === a.k
              ? ((t.fillStyle = "#d8443a"),
                pcirc(t, s, e, 3),
                (t.fillStyle = "#ff9a3c"),
                pcirc(t, s, e, 2),
                (t.fillStyle = "#fff0a0"),
                t.fillRect(s - 1, e - 1, 2, 2))
              : "ebolt" === a.k &&
                ((t.fillStyle = INK),
                pcirc(t, s, e, 2),
                (t.fillStyle = Math.floor(16 * G.t) % 2 ? a.col : "#ffffff"),
                t.fillRect(s - 1, e - 1, 3, 3));
  }
  for (const a of G.parts) {
    if (a.glow) continue;
    t.fillStyle = a.c;
    const s = a.life < 0.12 ? 1 : a.s;
    t.save();t.globalAlpha=.55;pcirc(t,a.x,a.y-a.z,Math.max(.2,s*.32));t.restore();
  }
  for (const a of G.flashes) {
    const s = Math.round(a.x),
      e = Math.round(a.y);
    if (a.ring) {
      const n = Math.round(4 + (a.t / 0.6) * 32);
      t.fillStyle = a.c;
      for (let a = 0; a < 6.283; a += 0.05)
        t.fillRect(
          Math.round(s + Math.cos(a) * n),
          Math.round(e + Math.sin(a) * n * 0.6),
          1,
          1,
        );
    } else {
      const n = a.t / 0.22;
      ((t.fillStyle = a.c), pcirc(t, s, e, Math.round((a.r || 7) * (1 - n))));
    }
  }
}
function stepCircle(t, a, s, e) {
  pcirc(t, a, s, Math.max(1, e));
}
function drawLighting(t) {
  const a = mapV(),
    [s, e, n, l] = a.amb;
  if (s < 0.02) return;
  const o = G.W,
    r = G.H;
  ((LC.width === o && LC.height === r) || ((LC.width = o), (LC.height = r)),
    (lctx.globalCompositeOperation = "source-over"),
    lctx.clearRect(0, 0, o, r),
    (lctx.fillStyle = `rgba(${e},${n},${l},${s})`),
    lctx.fillRect(0, 0, o, r),
    (lctx.globalCompositeOperation = "destination-out"));
  const i = [],
    c = G.pl,
    d = 2 * Math.sin(9 * G.t) + 1.5 * Math.sin(23 * G.t);
  (G.dead || i.push([c.x, c.y - 7, 46 + 0.5 * d]),
    c.orb &&
      "mage" === roArchetype(S.cls) &&
      i.push([c.orb[0], c.orb[1], 10 + 12 * c.orb[2]]));
  for (const t of G.proj)
    i.push([t.x, t.y, "fire" === t.k ? 34 + d : t.enemy ? 16 : 14]);
  for (const t of G.mins) i.push([t.x, t.y - 9, 16 + 0.5 * d]);
  for (const t of G.gsp) i.push([t.x, t.y - 8, 20 + 0.5 * d]);
  for (const t of G.mobs)
    ("wisp" === t.type || t.boss) &&
      i.push([t.x, t.y - 0.5 * t.h, t.boss ? 30 : 20]);
  for (const t of G.drops) t.landed && i.push([t.x, t.y - 8, 14 + 6 * t.tier]);
  for (const t of G.fx)
    "boom" === t.k
      ? i.push([t.x, t.y, 60 * (1 - t.t / t.life)])
      : "nova" === t.k || "ring" === t.k
        ? i.push([t.x, t.y, 1.4 * t.r])
        : "zap" === t.k && i.push([t.x2, t.y2, 30 * (1 - t.t / t.life)]);
  for (const t of G.flashes) t.ring && i.push([t.x, t.y, 50]);
  for (const t of G.lights || []) i.push([t[0], t[1], t[2] + 0.5 * d]);
  for (const t of TR.lit) i.push(t);
  for (const t of GF.lit) i.push(t);
  for (const [t, a, s] of i)
    t < -s ||
      a < -s ||
      t > o + s ||
      a > r + s ||
      ((lctx.fillStyle = "rgba(0,0,0,.34)"),
      stepCircle(lctx, t, a, s),
      (lctx.fillStyle = "rgba(0,0,0,.36)"),
      stepCircle(lctx, t, a, 0.7 * s),
      (lctx.fillStyle = "rgba(0,0,0,.5)"),
      stepCircle(lctx, t, a, 0.42 * s));
  t.drawImage(LC, 0, 0);
}
function drawGlow(t) {
  t.globalCompositeOperation = "lighter";
  for (const a of G.drops) {
    const s =
      (a.it || a.sl)?.my ||
      4 === a.it?.rar ||
      "m1" === a.mat ||
      "i4" === a.mat ||
      (a.gm && (SKILLS[a.gm.id].leg || a.gm.sx));
    if (!a.landed || (a.t > 1.2 && !s)) continue;
    const e = a.tier + (s ? 2 : 0),
      n = Math.round(a.x),
      l = Math.round(a.y) - 4,
      o =
        "m1" === a.mat
          ? `hsl(${(30 * Math.floor(4 * G.t)) % 360},100%,78%)`
          : a.col,
      r = 24 + 12 * e,
      i = 3 + 2 * e,
      c = 0.5 + 0.5 * Math.sin(5 * G.t + a.x),
      d = a.t < 0.15 ? a.t / 0.15 : 1;
    if (
      ((t.fillStyle = o),
      (t.globalAlpha = (0.16 + 0.1 * c) * d),
      t.fillRect(n - (i >> 1) - 1, l - r, i + 2, r),
      (t.globalAlpha = (0.32 + 0.15 * c) * d),
      t.fillRect(n - (i >> 1) + 1, l - r + 4, Math.max(1, i - 2), r - 4),
      (t.globalAlpha = 0.8 * d),
      t.fillRect(n, l - r + 8, 1, r - 8),
      (t.globalAlpha = 0.5 * d),
      pell(t, n, l + 1, 4 + e, 2),
      s)
    )
      for (let a = 0; a < 2; a++) {
        const s = (0.8 * G.t + 0.5 * a) % 1,
          e = 6 + 18 * s,
          o = 0.45 * e;
        ((t.globalAlpha = 0.9 * (1 - s) * d),
          (t.fillStyle = a ? "#ff3030" : "#ffd84a"));
        for (let a = 0; a < 6.283; a += 3 / e)
          t.fillRect(
            Math.round(n + Math.cos(a) * e),
            Math.round(l + 1 + Math.sin(a) * o),
            1,
            1,
          );
      }
  }
  for (const a of G.parts)
    a.glow &&
      ((t.fillStyle = a.c),
      (t.globalAlpha = 0.85 * Math.min(1, 3 * a.life)),
      t.fillRect(Math.round(a.x), Math.round(a.y - a.z), a.s, a.s));
  const a = mapV();
  if ("ember" === a.d || a.glow || a.ring)
    for (const a of G.lights || [])
      ((t.globalAlpha = 0.25 + 0.2 * Math.sin(3 * G.t + a[0])),
        (t.fillStyle = a[3]),
        t.fillRect(Math.round(a[0]) - 1, Math.round(a[1]), 3, 1));
  if ("stars" === a.d)
    for (let a = 0; a < 20; a++) {
      const s = Math.sin(2 * G.t + 1.7 * a);
      if (s < 0.3) continue;
      ((t.globalAlpha = s), (t.fillStyle = "#e8d0ff"));
      const e = Math.round(hash2(a, 3) * G.W),
        n = Math.round(G.top + hash2(a, 9) * (G.H - G.top));
      (t.fillRect(e, n, 1, 1),
        (t.globalAlpha *= 0.4),
        t.fillRect(e - 1, n, 3, 1),
        t.fillRect(e, n - 1, 1, 3));
    }
  if (a.amb[0] > 0.3)
    for (let s = 0; s < 14; s++) {
      const e = Math.sin(2 * G.t + 1.7 * s);
      if (e < 0.25) continue;
      const n = (hash2(s, 1) * G.W + 20 * Math.sin(0.3 * G.t + s) + G.W) % G.W,
        l =
          G.top +
          ((hash2(s, 2) * (G.H - G.top) +
            12 * Math.cos(0.25 * G.t + 2 * s) +
            G.H) %
            (G.H - G.top));
      ((t.globalAlpha = 0.9 * e),
        (t.fillStyle =
          "ember" === a.d
            ? "#ffb070"
            : "stars" === a.d
              ? "#d0a0ff"
              : "#d6ff7a"),
        t.fillRect(Math.round(n), Math.round(l), 1, 1));
    }
  ((t.globalAlpha = 1), (t.globalCompositeOperation = "source-over"));
}
function bar(t, a, s, e, n, l, o, r, i) {
  ((t.fillStyle = "#120d1c"),
    t.fillRect(a - 1, s - 1, e + 2, n + 2),
    (t.fillStyle = o),
    t.fillRect(a, s, e, n));
  const c = Math.round(e * clamp(l, 0, 1));
  ((t.fillStyle = r),
    t.fillRect(a, s, c, n),
    i && n > 2 && ((t.fillStyle = i), t.fillRect(a, s, c, 1)));
}
const HUD_BUFF = [
    {
      k: "wolf",
      n: () => G.wolf.length,
      left: () => (G.wolf.length ? G.wolf[G.wolf.length - 1] - G.t : 0),
      bg: "#8a2a36",
      fg: "#f4efe6",
      tc: "#ff9aa0",
      tip: (t, a) => [
        "犬妖弓",
        [`${t} 層：攻擊速度 +${t * uv("wolf", 0)}%`, `剩餘 ${a.toFixed(1)} 秒`],
      ],
      art: [
        "XXXXXXX",
        ".XXXXX.",
        ".XXXXX.",
        "..XXX..",
        "..XXX..",
        "...X...",
        "...X...",
      ],
    },
    {
      k: "min",
      n: () => MIN_HUD.reduce((t, [a]) => t + G[a].length, 0),
      left: () => 99,
      bg: "#2e5a8a",
      fg: "#f4efe6",
      tc: "#9ad8ff",
      tip: (t) => [
        "召喚物",
        [
          `場上共 ${t} 個`,
          ...MIN_HUD.filter(([t]) => G[t].length).map(
            ([t, a]) => `${a} ${G[t].length}`,
          ),
        ],
      ],
      art: [
        "..XXX..",
        ".XXXXX.",
        "XX.X.XX",
        "XXXXXXX",
        "XXXXXXX",
        "XXXXXXX",
        "X.X.X.X",
      ],
    },
    {
      k: "press",
      n: () => pressN(),
      left: () => 99,
      bg: "#1e4a6e",
      fg: "#9ad8ff",
      tc: "#5ab8e8",
      tip: (t) => [
        "深海壓力",
        [
          `範圍內 ${t} 隻敵人`,
          `傷害 +${t * tal("dv_press")}%（最多 ${DV_PRESS.max} 隻）`,
        ],
      ],
      art: [
        "X.X.X.X",
        "X.X.X.X",
        "XXXXXXX",
        "...X...",
        "...X...",
        "...X...",
        "...X...",
      ],
    },
  ],
  MIN_HUD = [
    ["mins", "召喚元素精靈"],
    ["gsp", "英靈召喚"],
    ["turs", "FAW 魔導機甲"],
    ["saps", "樹苗"],
    ["und", "亡靈戰士"],
  ],
  HUD_HIT = [];
function drawHUD(t) {
  const a = G.W; t.fillStyle="#f4f8fbea";t.fillRect(0,0,a,34);t.fillStyle="#b9cbd9";t.fillRect(0,34,a,.3);
  ((HUD_HIT.length = 0),
    (t.fillStyle = "#afc3d3"),
    t.fillRect(3, 3, 21, 17),
    (t.fillStyle = "#f2f7fb"),
    t.fillRect(4, 4, 19, 15),
    roHudText(t, "LV", 7, 6, "#6d8aa2", 1, null));
  const s = String(S.lvl);
  roHudText(t, s, 14 - textW(s) / 2, 12, "#b29a55", 1, null);
  const e = 28,
    n = Math.min(64, a - 100);
  bar(
    t,
    e,
    5,
    n,
    5,
    Math.max(0, S.hp) / PS.maxhp,
    "#3a1624",
    "#e0445a",
    "#ff9aa0",
  );
  const l = G.pl.shd > 0 ? Math.ceil(G.pl.shd) : 0,
    o = String(Math.ceil(Math.max(0, S.hp)));
  (l &&
    ((t.fillStyle = "#9ad8ff"),
    t.fillRect(
      e,
      5,
      Math.max(1, Math.round(n * Math.min(1, l / PS.maxhp))),
      2,
    )),
    roHudText(t, o, e + n + 4, 5, "#45647e"),
    l && roHudText(t, "+" + l, e + n + 6 + textW(o), 5, "#9ad8ff"),
    bar(
      t,
      e,
      13,
      n,
      2,
      S.lvl >= LV_CAP ? 1 : S.xp / xpNeed(S.lvl),
      "#2a2410",
      "#b29a55",
    ));
  ((t.fillStyle = INK),
    t.fillRect(28, 17, 5, 7),
    (t.fillStyle = "#e0445a"),
    t.fillRect(29, 20, 3, 3),
    (t.fillStyle = "#f4efe6"),
    t.fillRect(30, 18, 1, 2),
    (t.fillStyle = "#ff9aa0"),
    t.fillRect(29, 20, 1, 1),
    roHudItem(t,501,27,16,8),roHudText(t, String(S.pot), 36, 19, S.pot ? "#45647e" : "#6d8aa2"),
    HUD_HIT.push({
      k: "pot",
      x: 27,
      y: 16,
      w: 10 + textW(String(S.pot)),
      h: 9,
      t: () => [
        "生命藥水",
        [`剩餘 ${S.pot} 瓶`, `生命低於 ${S.potPct}% 時自動使用`],
        "#ff9aa0",
      ],
    }));
  const r = activeGems(),
    i = a - 5 - 9 * r.length + 1,
    c = i - 3;
  let d = 40 + textW(String(S.pot)),
    f = 19,
    p = 0;
  for (const [a, s, e] of [
    ["XP/M", fmt(perMin(G.rate.x)), "#b29a55"],
    ["KILL/M", String(Math.round(perMin(G.rate.k))), "#45647e"],
  ]) {
    const n = textW(a) + 3 + textW(s);
    if ((d + n > c && 19 === f && ((d = 5), (f = 26)), d + n > c)) break;
    (roHudText(t, a, d, f, "#6d8aa2"),
      roHudText(t, s, d + textW(a) + 3, f, e),
      (d += n + 6),
      (p = Math.max(p, d - 6)));
  }
  const u = fmt(S.ash),
    h = a - 5 - textW(u);
  (roHudText(t, u, h, 5, "#a17c37"),
    HUD_HIT.push({
      k: "ash",
      x: h - 8,
      y: 3,
      w: a - h + 6,
      h: 9,
      t: () => [
        "Zeny",
        [`持有 ${fmt(S.ash)}`, "分解裝備獲得；煉金與商人消耗"],
        "#a17c37",
      ],
    }),
    (t.fillStyle = INK),
    t.fillRect(h - 7, 4, 5, 7),
    (t.fillStyle = "#ff9a3c"),
    t.fillRect(h - 6, 6, 3, 4),
    (t.fillStyle = "#fff0a0"),
    t.fillRect(h - 5, 7, 1, 2),
    (t.fillStyle = "#d8443a"),
    t.fillRect(h - 6, 9, 3, 1),roHudItem(t,670,h-8,3,8));
  const m = fmt(PS.dps);
  (roHudText(t, m, a - 5 - textW(m), 13, "#45647e"),
    roHudText(t, "DPS", a - 5 - textW(m) - 15, 13, "#6d8aa2"));
  let A = i;
  const g = [];
  for (const t of HUD_BUFF) {
    const a = t.n();
    a > 0 &&
      g.push({
        bg: t.bg,
        blink: t.left() < 1.5,
        art: t.art,
        fg: t.fg,
        t: "" + a,
        tc: t.tc,
        k: "b" + t.k,
        tip: () => [...t.tip(t.n(), Math.max(0, t.left())), t.tc],
      });
  }
  if (G.pl.hb)
    for (const t in HH) {
      const a = G.pl.hb[t];
      a > 0 &&
        g.push({
          bg: ELITE_AF[t].c,
          blink: a < 3,
          t: "" + Math.ceil(a),
          tc: ELITE_AF[t].c,
          k: "h" + t,
          tip: () => [
            `竊取的菁英詞綴「${ELITE_AF[t].n}」`,
            [HH[t].d, `剩餘 ${Math.ceil(G.pl.hb[t] || 0)} 秒`],
            ELITE_AF[t].c,
          ],
        });
    }
  let v = A - 4,
    b = 5,
    k = 0;
  for (const s of g)
    ((v -= 9),
      5 === b && v - 1 < p + 3 && ((b = 22), (k = 1), (v = a - 13)),
      (t.fillStyle = s.blink && G.t % 0.4 < 0.2 ? "#3a2a40" : "#afc3d3"),
      t.fillRect(v - 1, b + 15, 9, 9),
      (t.fillStyle = s.bg),
      t.fillRect(v, b + 16, 7, 7),
      s.art &&
        ((t.fillStyle = s.fg),
        s.art.forEach((a, s) => {
          for (let e = 0; e < 7; e++)
            "X" === a[e] && t.fillRect(v + e, b + 16 + s, 1, 1);
        })),
      roHudText(t, s.t, v + 4 - Math.ceil(textW(s.t) / 2), b + 26, s.tc),
      HUD_HIT.push({ k: s.k, x: v - 1, y: b + 15, w: 9, h: 16, t: s.tip }));
  for (const a of r) {
    const s = SKILLS[a.id],
      e = gemMods(a),
      n = s.sus && G.pl.sus[a.id],
      l = s.sus
        ? n
          ? 0
          : 1
        : clamp(
            (G.pl.cds[a.u] ?? 0) /
              (s.cd * (1 - e.cd) * (1 - PS.cdr / 100) * kingCd()),
            0,
            1,
          );
    if (
      ((t.fillStyle = n && G.t % 0.6 < 0.3 ? "#ff4a5a" : "#afc3d3"),
      t.fillRect(A - 1, 20, 9, 9),
      (t.fillStyle = s.col),
      t.fillRect(A, 21, 7, 7), roHudIcon(t, a.id, A, 21, 7),
      (t.fillStyle = "rgba(255,255,255,.35)"),
      t.fillRect(A, 21, 7, 1),
      l > 0 &&
        ((t.fillStyle = "rgba(10,6,20,.72)"),
        t.fillRect(A, 21, 7, Math.round(7 * l))),
      "dance" === (SKILLS[a.id]?.roBase || a.id) && stkN("mom"))
    ) {
      const a = "" + stkN("mom");
      roHudText(t, a, A + 4 - Math.ceil(textW(a) / 2), 31, "#9ab0ff");
    }
    (HUD_HIT.push({
      k: "g" + a.u,
      x: A - 1,
      y: 20,
      w: 9,
      h: 16,
      t: () => [
        s.n,
        [
          tagText(s),
          s.sus
            ? (G.pl.sus[a.id] ? "開啟中" : "未開啟") +
              ("dance" === (SKILLS[a.id]?.roBase || a.id) ? `・氣勢 ${stkN("mom")} 層` : "")
            : `冷卻 ${(s.cd * (1 - e.cd) * (1 - PS.cdr / 100) * kingCd()).toFixed(1)} 秒` +
              ((G.pl.cds[a.u] ?? 0) > 0
                ? `・剩餘 ${G.pl.cds[a.u].toFixed(1)} 秒`
                : "・可施放"),
        ],
        s.col,
      ],
    }),
      (A += 9));
  }
  if (alive(G.boss)) {
    const s = G.boss,
      e = Math.min(120, a - 40),
      n = Math.round(a / 2 - e / 2),
      l = 44 + 17 * k;
    roHudText(t, "BOSS", n, l - 8, "#ff8a8a");
    const o = Math.max(0, Math.ceil(G.bossT)),
      r = Math.floor(o / 60) + ":" + String(o % 60).padStart(2, "0");
    (roHudText(t, r, n + e - textW(r), l - 8, G.bossT < 15 ? "#ff5a6a" : "#45647e"),
      bar(t, n, l, e, 4, s.hp / s.max, "#3a1624", "#e0445a", "#ff9aa0"),
      s.gm &&
        s.gm.sh > 0 &&
        bar(t, n, l + 6, e, 2, s.gm.sh / s.gm.shm, "#1a2040", "#9ab0ff"));
  }
}
const TR = {
  fl: [],
  an: null,
  L: [],
  h: [],
  af: [],
  dec: [],
  t: 0,
  x: 0,
  y: 0,
  acc: 0,
  at: 0,
  dt: 0,
  prev: new Map(),
  lit: [],
  tint: new Map(),
};
function trTint(t, a) {
  const s = a;
  let e = TR.tint.get(t);
  if ((e || TR.tint.set(t, (e = {})), e[s])) return e[s];
  const n = document.createElement("canvas");
  ((n.width = t.width), (n.height = t.height));
  const l = n.getContext("2d");
  return (
    l.drawImage(t, 0, 0),
    (l.globalCompositeOperation = "source-in"),
    (l.fillStyle = a),
    l.fillRect(0, 0, n.width, n.height),
    (e[s] = n)
  );
}
function trBurst(t, a, s, e, n, l) {
  const o = Math.random;
  for (let l = 0; l < e; l++) {
    const e = 6.283 * o(),
      l = n * (0.4 + 0.6 * o());
    TR.L.push({
      x: a,
      y: s,
      z: 4 + 4 * o(),
      vx: Math.cos(e) * l,
      vy: Math.sin(e) * l * 0.5,
      vz: 10 + 30 * o(),
      g: -50,
      life: 0.5 + 0.5 * o(),
      L: 1,
      c: t.c[Math.floor(3 * o())],
      s: t.p.s,
      glow: t.glow,
      tw: t.p.tw,
      star: t.p.star,
      ring: t.p.ring,
      ph: 6 * o(),
    });
  }
  l ||
    (TR.dec.push({ k: "boom", x: a, y: s, t: 0, L: 0.4, rot: 0 }),
    TR.fl.push([a, s, 34, now0()]));
}
const now0 = () => performance.now() / 1e3;
function trDecal(t, a, s, e) {
  const n = 1 - s.t / s.L,
    [l, o, r] = a.c,
    i = Math.round(s.x),
    c = Math.round(s.y),
    d = (a, s, e) => {
      ((t.fillStyle = e), t.fillRect(i + a, c + s, 1, 1));
    };
  switch (((t.globalAlpha = Math.min(1, 1.6 * n)), s.k)) {
    case "flower":
      for (const [t, a] of [
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0],
      ])
        d(t * (n > 0.5 ? 1 : 2), a * (n > 0.5 ? 1 : 2), o);
      d(0, 0, l);
      break;
    case "glow":
      ((t.globalAlpha = 0.5 * n), (t.fillStyle = o), pell(t, i, c, 3, 1));
      break;
    case "shard":
      ((t.fillStyle = o),
        t.fillRect(i, c - 2, 1, 5),
        t.fillRect(i - 1, c - 1, 3, 3),
        d(0, -1, l),
        Math.sin(20 * e + s.rot) > 0.7 && (d(-2, 0, l), d(2, 0, l)));
      break;
    case "puff":
      ((t.globalAlpha = 0.55 * n),
        (t.fillStyle = o),
        pell(
          t,
          i,
          c,
          Math.round(2 + 5 * (1 - n)),
          Math.round(1 + 2 * (1 - n)),
        ));
      break;
    case "ripple": {
      const a = 1 + 8 * (1 - n);
      t.fillStyle = o;
      for (let s = 0; s < 6.283; s += 0.5)
        t.fillRect(
          Math.round(i + Math.cos(s) * a),
          Math.round(c + Math.sin(s) * a * 0.5),
          1,
          1,
        );
      break;
    }
    case "frost":
      ((t.fillStyle = o),
        t.fillRect(i - 2, c, 5, 1),
        t.fillRect(i, c - 2, 1, 5),
        d(-1, -1, o),
        d(1, 1, o),
        d(1, -1, o),
        d(-1, 1, o),
        d(0, 0, l));
      break;
    case "fire":
      if (((t.fillStyle = r), pell(t, i, c, 2, 1), n > 0.2))
        for (let t = 0; t < 3; t++)
          Math.random() < n &&
            d(
              Math.round(4 * (Math.random() - 0.5)),
              -Math.floor(3 * Math.random() * n),
              Math.random() < 0.5 ? l : o,
            );
      break;
    case "pool":
      ((t.globalAlpha = 0.7 * n),
        (t.fillStyle = r),
        pell(t, i, c, 3, 1),
        (t.fillStyle = o),
        pell(t, i, c, 2, 1),
        Math.sin(7 * e + s.rot) > 0.6 &&
          d(Math.round(2 * Math.cos(s.rot)), -1, l));
      break;
    case "coin":
      ((t.fillStyle = r),
        t.fillRect(i - 1, c - 1, 2, 2),
        d(-1, -1, o),
        Math.sin(14 * e + s.rot) > 0.5 && (d(-2, -2, l), d(1, 1, l)));
      break;
    case "rune": {
      const a = 4 + 2 * (1 - n);
      t.fillStyle = o;
      for (let n = 0; n < 6.283; n += 0.9)
        t.fillRect(
          Math.round(i + Math.cos(n + 3 * e + s.rot) * a),
          Math.round(c + Math.sin(n + 3 * e + s.rot) * a * 0.5),
          1,
          1,
        );
      d(0, 0, r);
      break;
    }
    case "star":
      ((t.fillStyle = o),
        t.fillRect(i - 1, c, 3, 1),
        t.fillRect(i, c - 1, 1, 3),
        n > 0.5 && (d(-2, 0, r), d(2, 0, r), d(0, -2, r), d(0, 2, r)),
        d(0, 0, l));
      break;
    case "boom": {
      const a = 2 + 12 * (1 - n);
      t.fillStyle = l;
      for (let s = 0; s < 6.283; s += 0.3)
        t.fillRect(
          Math.round(i + Math.cos(s) * a),
          Math.round(c + Math.sin(s) * a * 0.55),
          1,
          1,
        );
      t.fillStyle = o;
      for (let s = 0.15; s < 6.283; s += 0.6)
        t.fillRect(
          Math.round(i + Math.cos(s) * a * 0.7),
          Math.round(c + Math.sin(s) * a * 0.4),
          1,
          1,
        );
      break;
    }
  }
}
function drawTrail(t) {
  const a = performance.now() / 1e3,
    s = Math.min(0.1, TR.t ? a - TR.t : 0),
    e = G.pl,
    n = S.set.trail ?? -1,
    l = TRAIL[n] && trailOn(n) ? TRAIL[n] : null;
  TR.t = a;
  const o = Math.hypot(e.x - TR.x, e.y - TR.y),
    r = l && !G.dead && o > 0.05 && o < 20;
  ((TR.x = e.x), (TR.y = e.y), (TR.lit = []));
  const i = new Map();
  for (const t of G.mobs) i.set(t, [t.x, t.y]);
  if (l)
    for (const [t, a] of TR.prev)
      !i.has(t) &&
        t.hp <= 0 &&
        Math.hypot(a[0] - e.x, a[1] - e.y) < 90 &&
        trBurst(l, a[0], a[1] - 3, t.boss ? 30 : 12, t.boss ? 60 : 40);
  if (((TR.prev = i), !l))
    return void (TR.L.length = TR.h.length = TR.af.length = TR.dec.length = 0);
  const [c, d, f] = l.c,
    p = Math.random,
    u = l.glow ? "lighter" : "source-over";
  if (e.anim && e.anim !== TR.an && !G.dead) {
    TR.an = e.anim;
    const t = e.face || 0;
    (trBurst(l, e.x + 8 * Math.cos(t), e.y - 6 + 4 * Math.sin(t), 7, 34, 1),
      (TR.at = 1));
  }
  if (!G.dead && !r)
    for (TR.acc += 0.45 * l.p.rate * s; TR.acc >= 1; TR.acc--) {
      const t = 6.283 * p();
      TR.L.push({
        x: e.x + 9 * Math.cos(t),
        y: e.y + 4 * Math.sin(t),
        z: 3 * p(),
        vx: 0,
        vy: 0,
        vz: 8 + 14 * p(),
        g: 0,
        life: 0.9 + 0.6 * p(),
        L: 1.2,
        c: l.c[Math.floor(2 * p())],
        s: l.p.s,
        glow: l.glow,
        tw: l.p.tw,
        star: l.p.star,
        ring: l.p.ring,
        ph: 6 * p(),
      });
    }
  if (r) {
    for (
      TR.h.push({ x: e.x, y: e.y, t: a }), TR.acc += 1.4 * l.p.rate * s;
      TR.acc >= 1;
      TR.acc--
    )
      TR.L.push({
        x: e.x + 6 * (p() - 0.5),
        y: e.y + 2 * (p() - 0.5),
        z: 4 * p(),
        vx: (p() - 0.5) * l.p.sp,
        vy: 0,
        vz: l.p.vz * (0.5 + 0.5 * p()),
        g: l.p.g,
        life: l.p.life * (0.6 + 0.4 * p()),
        L: l.p.life,
        c: l.c[Math.floor(3 * p())],
        s: l.p.s,
        glow: l.glow,
        tw: l.p.tw,
        star: l.p.star,
        ring: l.p.ring,
        ph: 6 * p(),
      });
    (TR.dt += s) > 0.16 &&
      ((TR.dt = 0),
      TR.dec.push({
        k: l.dec,
        x: e.x + 3 * (p() - 0.5),
        y: e.y + 1,
        t: 0,
        L: "fire" === l.dec || "pool" === l.dec ? 1.8 : 1.2,
        rot: 6 * p(),
      }));
  }
  if (l.aft && !G.dead && (r || TR.at >= 1) && (TR.at += s) > 0.06) {
    TR.at = 0;
    {
      const t =
          SP.hero[S.tal.asc ? S.cls + ":" + S.tal.asc : S.cls] ||
          SP.hero[S.cls],
        a = e.anim ? 0 : [0, 1, 0, 2][Math.floor(9 * e.walkT) % 4];
      TR.af.push({
        img: trTint(t[e.dir][a], l.aft),
        flip: e.flip && "side" === e.dir,
        x: Math.round(e.x),
        y: Math.round(e.y),
        t: 0,
      });
    }
  }
  for (; TR.h.length && a - TR.h[0].t > 0.32;) TR.h.shift();
  if ((TR.L.length > 220 && TR.L.splice(0, TR.L.length - 220), !G.dead)) {
    const s = 0.75 + 0.25 * Math.sin(4 * a),
      n = e.x,
      l = e.y + 1;
    ((t.globalCompositeOperation = u),
      (t.globalCompositeOperation = "source-over"),
      (t.fillStyle = f));
    for (let e = 0; e < 6.283; e += 0.26)
      ((t.globalAlpha = 0.45 * s),
        t.fillRect(
          Math.round(n + 12 * Math.cos(e + 1.2 * a)),
          Math.round(l + 1 + 12 * Math.sin(e + 1.2 * a) * 0.42),
          1,
          1,
        ));
    t.globalCompositeOperation = u;
    for (const [e, o, r, i] of [
      [12, 1.2, d, 0.26],
      [8, -2, c, 0.45],
    ]) {
      t.fillStyle = r;
      for (let r = 0; r < 6.283; r += i)
        ((t.globalAlpha = (0.35 + 0.4 * Math.sin(3 * r + 5 * a)) * s),
          t.fillRect(
            Math.round(n + Math.cos(r + a * o) * e),
            Math.round(l + Math.sin(r + a * o) * e * 0.42),
            1,
            1,
          ));
    }
    ((t.globalAlpha = 0.18 * s),
      (t.fillStyle = f),
      pell(t, n, l, 9, 3),
      (t.globalCompositeOperation = "source-over"));
  }
  for (let t = TR.fl.length - 1; t >= 0; t--) {
    const s = TR.fl[t],
      e = (a - s[3]) / 0.25;
    e >= 1 ? TR.fl.splice(t, 1) : TR.lit.push([s[0], s[1], s[2] * (1 - e)]);
  }
  for (let e = TR.dec.length - 1; e >= 0; e--) {
    const n = TR.dec[e];
    (n.t += s) >= n.L
      ? TR.dec.splice(e, 1)
      : ("boom" === n.k && (t.globalCompositeOperation = u),
        trDecal(t, l, n, a),
        (t.globalCompositeOperation = "source-over"));
  }
  t.globalCompositeOperation = u;
  for (let s = 1; s < TR.h.length; s++) {
    const e = TR.h[s - 1],
      n = TR.h[s],
      o = 1 - (a - n.t) / 0.32,
      r = Math.max(1, Math.round(l.rib * o)),
      i = Math.max(1, Math.ceil(Math.hypot(n.x - e.x, n.y - e.y)));
    for (let a = 0; a < i; a++) {
      const s = Math.round(e.x + ((n.x - e.x) * a) / i),
        l = Math.round(e.y + ((n.y - e.y) * a) / i) - 2;
      ((t.globalAlpha = 0.55 * o),
        (t.fillStyle = d),
        t.fillRect(s - (r >> 1), l - (r >> 1), r, r),
        o > 0.35 &&
          ((t.globalAlpha = 0.9 * o),
          (t.fillStyle = c),
          t.fillRect(s, l, 1, 1)));
    }
  }
  if (TR.h.length) {
    const t = TR.h[TR.h.length - 1];
    l.lit && TR.lit.push([t.x, t.y - 4, l.lit]);
  }
  for (let a = TR.af.length - 1; a >= 0; a--) {
    const e = TR.af[a];
    (e.t += s) > 0.3
      ? TR.af.splice(a, 1)
      : ((t.globalAlpha = 0.45 * (1 - e.t / 0.3)),
        e.flip
          ? (t.save(),
            t.translate(e.x, 0),
            t.scale(-1, 1),
            t.drawImage(e.img, -8, e.y - 19),
            t.restore())
          : t.drawImage(e.img, e.x - 8, e.y - 19));
  }
  for (let e = TR.L.length - 1; e >= 0; e--) {
    const n = TR.L[e];
    if (((n.life -= s), n.life <= 0)) {
      TR.L.splice(e, 1);
      continue;
    }
    ((n.x += n.vx * s),
      (n.y += (n.vy || 0) * s),
      (n.vz += n.g * s),
      (n.z = Math.max(0, n.z + n.vz * s)),
      0 === n.z && n.vz < 0 && (n.vz = 0));
    const l = Math.min(1, (n.life / n.L) * 1.8);
    let o = l;
    (n.tw && (o *= 0.5 + 0.5 * Math.sin(14 * a + n.ph)),
      (t.globalAlpha = o),
      (t.globalCompositeOperation = n.glow ? "lighter" : "source-over"),
      (t.fillStyle = n.c));
    const r = Math.round(n.x),
      i = Math.round(n.y - n.z);
    n.ring && n.s > 1
      ? (t.fillRect(r - 1, i, 1, 1),
        t.fillRect(r + 1, i, 1, 1),
        t.fillRect(r, i - 1, 1, 1),
        t.fillRect(r, i + 1, 1, 1))
      : n.star && l > 0.45
        ? (t.fillRect(r - 1, i, 3, 1), t.fillRect(r, i - 1, 1, 3))
        : t.fillRect(r, i, n.s, n.s);
  }
  if (l.mote && !G.dead) {
    const s = [];
    for (let t = 0; t < l.mote; t++) {
      const n = (t / l.mote) * 6.283;
      let o, r;
      if ("wander" === l.mk) {
        const s = 0.9 * a + 1.7 * n;
        ((o = e.x + Math.cos(s) * (9 + 4 * Math.sin(1.3 * a + t))),
          (r = e.y - 9 + 6 * Math.sin(1.3 * s)));
      } else if ("rise" === l.mk) {
        const s = (0.7 * a + t / l.mote) % 1;
        ((o = e.x + 6 * Math.sin(3 * n + 2 * a)), (r = e.y - 2 - 18 * s));
      } else if ("pull" === l.mk) {
        const s = 14 * (1 - ((0.8 * a + t / l.mote) % 1));
        ((o = e.x + Math.cos(n + 4 * a) * s),
          (r = e.y - 7 + Math.sin(n + 4 * a) * s * 0.5));
      } else if ("swirl" === l.mk) {
        const s = 2.4 * a + n;
        ((o = e.x + 12 * Math.cos(s)),
          (r = e.y - 8 + 4 * Math.sin(s) + 2 * Math.sin(3 * a + t)));
      } else {
        const t = 1.8 * a + n;
        ((o = e.x + 13 * Math.cos(t)), (r = e.y - 8 + 6 * Math.sin(t)));
      }
      s.push([Math.round(o), Math.round(r)]);
    }
    if (((t.globalCompositeOperation = u), "const" === l.mk)) {
      ((t.globalAlpha = 0.35), (t.fillStyle = f));
      for (let a = 0; a < s.length; a++) {
        const [e, n] = s[a],
          [l, o] = s[(a + 1) % s.length],
          r = Math.ceil(Math.hypot(l - e, o - n));
        for (let a = 0; a < r; a += 2)
          t.fillRect(
            Math.round(e + ((l - e) * a) / r),
            Math.round(n + ((o - n) * a) / r),
            1,
            1,
          );
      }
    }
    ((TR.mp = TR.mp || []),
      TR.mp.unshift(s),
      TR.mp.length > 5 && TR.mp.pop(),
      TR.mp.forEach((a, s) => {
        if (s) {
          ((t.globalAlpha = 0.35 * (1 - s / 5)), (t.fillStyle = d));
          for (const [s, e] of a) t.fillRect(s, e, 1, 1);
        }
      }),
      s.forEach(([s, e], n) => {
        const o = 0.7 + 0.3 * Math.sin(8 * a + 2 * n);
        ((t.globalCompositeOperation = "source-over"),
          (t.globalAlpha = 0.55 * o),
          (t.fillStyle = f),
          t.fillRect(s - 2, e - 1, 5, 3),
          t.fillRect(s - 1, e - 2, 3, 5),
          (t.globalCompositeOperation = u),
          (t.globalAlpha = 0.8 * o),
          (t.fillStyle = d),
          t.fillRect(s - 1, e, 3, 1),
          t.fillRect(s, e - 1, 1, 3),
          (t.globalAlpha = o),
          (t.fillStyle = c),
          t.fillRect(s, e, 1, 1),
          l.lit && n % 2 == 0 && TR.lit.push([s, e, 0.5 * l.lit]));
      }));
  }
  ((t.globalCompositeOperation = "source-over"), (t.globalAlpha = 1));
}
const gfNew = (t, a) => ({
    fx: [],
    P: [],
    lit: [],
    W: t,
    H: a,
    flAt: -9,
    t: 0,
  }),
  GF = gfNew(0, 0);
((GF.prev = new Map()), (GF.sn = new Map()), (GF.T = 0));
const GF_WR = [
    "..ddd..",
    ".ddddd.",
    "ddvvvdd",
    "dvevevd",
    "dvvvvvd",
    "ddvvvdd",
    ".ddddd.",
    "dd.d.dd",
    "d..d..d",
    "...d...",
  ],
  gfWraith = (t) =>
    (SP.gfw ||= {})[t] ||
    (SP.gfw[t] = paint(outlineRows(GF_WR), {
      k: INK,
      d: "#2a1438",
      v: "#06030a",
      e: t,
    }));
function gfSnap(t) {
  const a = t.sl ?? curMap().v.sl,
    s =
      t.type +
      (t.boss ? "B" : t.elite ? "E" : "") +
      (t.face < 0 ? "L" : "") +
      ":" +
      a,
    e = GF.sn.get(s);
  if (e) return e;
  const n = cnv(64, 64);
  return (
    drawMob(
      n.getContext("2d"),
      Object.assign({}, t, {
        x: 32,
        y: 56,
        t: 0,
        flash: 0,
        spawnT: 0,
        slow: 0,
        tnt: 0,
        crs: null,
        psn: null,
        sh: 0,
        hp: t.max,
        lunge: 0,
        snap: 1,
        eye: 0,
        sl: a,
      }),
    ),
    GF.sn.set(s, n),
    n
  );
}
function gfBolt(t, a, s, e, n, l, o) {
  let r = a,
    i = s;
  const c = (t) => (((43758.5 * Math.sin(99 * l + 12.9 * t)) % 1) + 1) % 1;
  for (let l = 1; l <= 7; l++) {
    const d =
        7 === l ? e : a + ((e - a) * l) / 7 + Math.round(8 * (c(l) - 0.5)),
      f = s + ((n - s) * l) / 7,
      p = Math.max(1, 0 | Math.max(Math.abs(d - r), Math.abs(f - i)));
    for (let a = 0; a <= p; a++) {
      const s = Math.round(r + ((d - r) * a) / p),
        e = Math.round(i + ((f - i) * a) / p);
      ((t.fillStyle = "#ffe066"),
        t.fillRect(s - (o > 1 ? 1 : 0), e, o, 1),
        (t.fillStyle = "#ffffff"),
        t.fillRect(s, e, 1, 1));
    }
    ((r = d), (i = f));
  }
}
function gfRing(t, a, s, e, n, l = 64) {
  for (let o = 0; o < l; o++) {
    const r = (o / l) * 6.283;
    t.fillRect(
      Math.round(a + Math.cos(r) * e),
      Math.round(s + Math.sin(r) * n),
      1,
      1,
    );
  }
}
function gfPart(t, a) {
  t.P.length < 420 && t.P.push(Object.assign({ t: 0, g: 0, vx: 0, vy: 0 }, a));
}
function gfHit(t, a, s, e, n) {
  const l = Math.random,
    o = (t, a) => t + l() * (a - t);
  if (0 === a) {
    t.fx.push({
      k: "arc",
      x: s,
      y: e,
      t: 0,
      life: 0.16,
      a: [0, 1, 2, 3].map(() => o(0, 6.283)),
      L: 6,
    });
    for (let a = 0; a < 3; a++) {
      const n = o(0, 6.283),
        l = o(12, 30);
      gfPart(t, {
        x: s,
        y: e,
        vx: Math.cos(n) * l,
        vy: Math.sin(n) * l,
        g: 20,
        life: 0.2,
        c: a % 2 ? "#ffffff" : "#ffe066",
      });
    }
    t.lit.push([s, e, 10, 0.12]);
  }
  if (1 === a) {
    for (let a = 0; a < 7; a++)
      gfPart(t, {
        x: s + o(-3, 3),
        y: e + 2,
        vx: o(-28, 28),
        vy: o(-60, -30),
        g: 160,
        life: 0.6,
        c: ["#ffffff", "#9ad8ff", "#4a9ae0"][a % 3],
        drop: 1,
        gy: n,
      });
    t.fx.push({ k: "ring", x: s, y: n, t: 0, life: 0.5, s: 1 });
  }
  if (2 === a)
    for (let a = 0; a < 3; a++)
      gfPart(t, {
        x: s + o(-5, 5),
        y: e + o(-2, 4),
        vx: o(-6, 6),
        vy: o(-26, -14),
        life: 0.9,
        c: ["#c08aff", "#7a4ad0", "#e8d8ff"][a % 3],
        soul: 1,
        ph: o(0, 6),
      });
}
function gfKill(t, a, s, e, n) {
  const l = s.boss ? 2 : s.elite ? 1.4 : 1,
    o = s.boss || s.elite,
    r = {
      x: Math.round(s.x),
      gy: Math.round(s.y),
      h: s.h || 10,
      sc: l,
      snap: e,
      t: 0,
    };
  if (0 === a) {
    const a = o || t.t - t.flAt > 0.8;
    (a && (t.flAt = t.t),
      t.fx.push(
        Object.assign({}, r, {
          k: "bolt",
          life: 0.35,
          top: n,
          s: 99 * Math.random(),
          w: o ? 3 : 2,
          fl: a,
        }),
        Object.assign({}, r, { k: "scorch", life: 1.6 }),
        Object.assign({}, r, { k: "zbody", life: 1 }),
      ));
  }
  (1 === a &&
    t.fx.push(
      Object.assign({}, r, { k: "ring", y: r.gy, life: 0.7, s: l }),
      Object.assign({}, r, { k: "ring", y: r.gy, t: -0.18, life: 0.7, s: l }),
      Object.assign({}, r, { k: "melt", life: 1.7 }),
    ),
    2 === a && t.fx.push(Object.assign({}, r, { k: "gate", life: 1.7 })));
}
function gfStep(t, a) {
  t.t += a;
  for (const s of t.P)
    ((s.t += a),
      (s.vy += s.g * a),
      (s.x += s.vx * a),
      (s.y += s.vy * a),
      s.soul && (s.x += 0.3 * Math.sin(6 * t.t + s.ph)),
      s.drop && s.y > s.gy && ((s.y = s.gy), (s.vy *= -0.25), (s.vx *= 0.5)));
  t.P = t.P.filter((t) => t.t < t.life);
  for (const s of t.fx) s.t += a;
  t.fx = t.fx.filter((t) => t.t < t.life);
  for (const s of t.lit) s[3] -= a;
  t.lit = t.lit.filter((t) => t[3] > 0);
}
function gfDraw(t, a, s) {
  const e = Math.random,
    n = (t, a) => t + e() * (a - t),
    l = (a, s, e = 0, n = 1) => {
      const l = Math.round(64 * n);
      t.drawImage(
        s,
        0,
        0,
        64,
        64,
        a.x - 32,
        a.gy - Math.round(56 * n) + e,
        64,
        l,
      );
    };
  if (s) {
    for (const s of a.fx) {
      const o = s.t;
      if (((t.globalAlpha = 1), "arc" === s.k))
        for (const a of s.a) {
          let e = s.x,
            l = s.y;
          for (let o = 1; o <= 3; o++) {
            const r = (s.L * o) / 3,
              i = Math.round(s.x + Math.cos(a) * r + n(-1.5, 1.5)),
              c = Math.round(s.y + Math.sin(a) * r * 0.8 + n(-1.5, 1.5)),
              d = Math.max(1, 0 | Math.max(Math.abs(i - e), Math.abs(c - l)));
            t.fillStyle = 1 === o ? "#ffffff" : "#ffe066";
            for (let a = 0; a <= d; a++)
              t.fillRect(
                Math.round(e + ((i - e) * a) / d),
                Math.round(l + ((c - l) * a) / d),
                1,
                1,
              );
            ((e = i), (l = c));
          }
        }
      else if ("zbody" === s.k) {
        if (o < 0.12) l(s, trTint(s.snap, "#ffffff"));
        else if (o < 0.45) l(s, trTint(s.snap, "#1a1218"));
        else if (!s.cr) {
          s.cr = 1;
          for (let t = 0; t < 22 * s.sc; t++)
            gfPart(a, {
              x: s.x + n(-6, 6) * s.sc,
              y: s.gy - n(0, s.h),
              vx: n(-20, 20),
              vy: n(-40, -5),
              g: 90,
              life: n(0.4, 0.8),
              c: ["#1a1218", "#ffb347", "#ffe066", "#3a2a2a"][t % 4],
            });
        }
        o < 0.3 &&
          e() < 0.5 &&
          gfBolt(
            t,
            s.x + Math.round(n(-8, 8) * s.sc),
            s.gy - s.h - 2,
            s.x + Math.round(n(-10, 10) * s.sc),
            s.gy,
            99 * e(),
            1,
          );
      } else if ("bolt" === s.k)
        (gfBolt(
          t,
          s.x + Math.round(n(-1, 1)),
          s.top,
          s.x,
          s.gy - Math.round(0.5 * s.h),
          s.s,
          s.w,
        ),
          a.lit.push([s.x, s.gy - 0.5 * s.h, 40 * s.sc, 0.02]),
          s.fl &&
            o < 0.12 &&
            ((t.globalAlpha = 0.35),
            (t.fillStyle = "#fff6c0"),
            t.fillRect(-4, -4, a.W + 8, a.H + 8)));
      else if ("melt" === s.k) {
        const t = Math.min(1, o / 0.55);
        (t < 1 &&
          l(s, t > 0.3 ? trTint(s.snap, "#4a9ae0") : s.snap, 0, 1 - 0.85 * t),
          o < 0.5 &&
            e() < 0.6 &&
            gfPart(a, {
              x: s.x + n(-6, 6) * s.sc,
              y: s.gy - 2,
              vx: n(-20, 20),
              vy: n(-40, -20),
              g: 160,
              life: 0.4,
              c: "#9ad8ff",
              drop: 1,
              gy: s.gy,
            }));
      } else if ("gate" === s.k) {
        const r =
            (o < 0.2
              ? (o / 0.2) * 11
              : o < 1.2
                ? 11
                : Math.max(0, 11 - 22 * (o - 1.2))) * s.sc,
          i = s.x;
        if (r > 0) {
          ((t.fillStyle = "#2a0e3a"),
            pell(t, i, s.gy, Math.round(r), Math.max(1, Math.round(0.3 * r))),
            (t.fillStyle = "#06030a"),
            pell(
              t,
              i,
              s.gy,
              Math.max(1, Math.round(0.7 * r)),
              Math.max(1, Math.round(0.2 * r)),
            ),
            (t.fillStyle = "#b060ff"));
          for (let a = 0; a < 18; a++)
            if (e() < 0.55) {
              const e = (a / 18) * 6.283;
              t.fillRect(
                Math.round(i + Math.cos(e) * r),
                Math.round(s.gy + Math.sin(e) * r * 0.3),
                1,
                1,
              );
            }
          a.lit.push([i, s.gy, 1.6 * r, 0.02]);
        }
        if (o < 0.75) {
          const r = Math.max(0, (o - 0.1) / 0.65);
          (t.save(),
            t.beginPath(),
            t.rect(i - 40, s.gy - 70, 80, 70),
            t.clip(),
            l(
              s,
              trTint(s.snap, o < 0.1 ? "#ffffff" : "#120a18"),
              Math.round(r * s.h * 1.1),
            ),
            t.restore(),
            e() < 0.8 &&
              gfPart(a, {
                x: i + n(-8, 8) * s.sc,
                y: s.gy - n(0, 3),
                vx: n(-3, 3),
                vy: n(-22, -8),
                life: 0.45,
                c: ["#b060ff", "#5a1a8a", "#000000"][(3 * e()) | 0],
                soul: 1,
                ph: n(0, 6),
              }));
        }
        if (o > 0.45 && o < 1.7) {
          const l = o - 0.45,
            r = gfWraith(e() < 0.85 ? "#9dff5a" : "#e8ffd0"),
            c = s.sc > 1.5 ? 2 : 1,
            d = Math.round(s.gy - 12 * c - l * l * 34 - 6 * l),
            f = Math.round(i - (r.width * c) / 2 + 1.5 * Math.sin(9 * l));
          ((t.globalAlpha = Math.max(0, Math.min(1, 1.6 * (1.7 - o)))),
            t.drawImage(r, f, d, r.width * c, r.height * c),
            (t.globalAlpha = 1));
          for (let t = 0; t < 2; t++)
            gfPart(a, {
              x: i + n(-3, 3) * c,
              y: d + 10 * c + n(0, 3),
              vx: n(-4, 4),
              vy: n(4, 16),
              life: 0.4,
              c: ["#b060ff", "#6a20b0", "#1a0a24"][(3 * e()) | 0],
              soul: 1,
              ph: n(0, 6),
            });
          a.lit.push([i, d + 5 * c, 12, 0.02]);
        }
      }
    }
    for (const s of a.P)
      ((t.globalAlpha = s.soul ? Math.max(0, 1 - s.t / s.life) : 1),
        (t.fillStyle = s.c),
        t.fillRect(
          Math.round(s.x),
          Math.round(s.y),
          s.soul ? 2 : 1,
          s.soul ? 2 : 1,
        ));
    t.globalAlpha = 1;
  } else {
    for (const s of a.fx)
      if ("scorch" === s.k) {
        const a = Math.min(1, (s.life - s.t) / 0.6);
        if (
          ((t.globalAlpha = a),
          (t.fillStyle = "#120c10"),
          pell(
            t,
            s.x,
            s.gy,
            Math.round(9 * s.sc),
            Math.max(1, Math.round(3 * s.sc)),
          ),
          s.t < 0.9)
        ) {
          t.fillStyle = "#ffb347";
          for (let a = 0; a < 4; a++)
            e() < 0.5 &&
              t.fillRect(
                Math.round(s.x + n(-7, 7) * s.sc),
                Math.round(s.gy + n(-2, 2) * s.sc),
                1,
                1,
              );
        }
      } else if ("ring" === s.k && s.t > 0) {
        const a = s.t / s.life;
        ((t.globalAlpha = 1 - a),
          (t.fillStyle = "#9ad8ff"),
          gfRing(t, s.x, s.y, (4 + 14 * a) * s.s, (1 + 4 * a) * s.s));
      } else if ("melt" === s.k) {
        const a = s.t,
          e = Math.min(1, a / 0.55),
          n = (a < 0.55 ? 6 + 4 * e : Math.max(0, 10 - 9 * (a - 0.55))) * s.sc;
        n > 0 &&
          ((t.globalAlpha = 1),
          (t.fillStyle = "#2a6ab0"),
          pell(t, s.x, s.gy, Math.round(n), Math.max(1, Math.round(0.28 * n))),
          (t.fillStyle = "#7cc8ff"),
          pell(t, s.x - 1, s.gy - 1, Math.max(1, Math.round(0.5 * n)), 1));
      }
    t.globalAlpha = 1;
  }
}
function gfScan(t) {
  const a = performance.now() / 1e3,
    s = Math.min(0.1, GF.T ? a - GF.T : 0);
  ((GF.T = a), (GF.W = G.W), (GF.H = G.H));
  const e = S.set.hfx ?? -1,
    n = S.set.kfx ?? -1,
    l = hfxOn(e),
    o = kfxOn(n),
    r = G.pl,
    i = new Map();
  let c = 0;
  for (const t of G.mobs) {
    const a = GF.prev.get(t);
    if ((i.set(t, t.flash), l && null != a && t.flash > a + 0.01 && c < 8)) {
      c++;
      const a = t.x - r.x,
        s = t.y - r.y,
        n = Math.hypot(a, s) || 1,
        l = "bat" === t.type || MON[t.type].fl ? 4 : 0;
      gfHit(
        GF,
        e,
        Math.round(t.x - (a / n) * 3),
        Math.round(t.y - 0.45 * t.h - l),
        Math.round(t.y),
      );
    }
  }
  if (o) {
    let t = GF.fx.filter(
      (t) => "zbody" === t.k || "melt" === t.k || "gate" === t.k,
    ).length;
    for (const [a] of GF.prev)
      !i.has(a) &&
        a.hp <= 0 &&
        (t < 10 || a.boss) &&
        (t++, gfKill(GF, n, a, gfSnap(a), Math.max(G.top || 0, a.y - 90)));
  }
  ((GF.prev = i),
    l || o || GF.fx.length || GF.P.length
      ? (gfStep(GF, s), gfDraw(t, GF, 0))
      : (GF.lit.length = 0));
}
const gfTop = (t) => {
    (GF.fx.length || GF.P.length) && gfDraw(t, GF, 1);
  },
  GFP = {
    cv: null,
    g: 0,
    k: "hk",
    E: null,
    t: 0,
    hit: 0.5,
    hp: 5,
    dead: 0,
    sw: 0,
    fl: 0,
    raf: 0,
    bg: null,
  };
function gfPrev(t, a, s = "hk") {
  if (
    (Object.assign(GFP, {
      cv: t,
      g: a,
      k: s,
      E: gfNew(t.width, t.height),
      hit: 0.5,
      hp: 5,
      dead: 0,
      sw: 0,
      fl: 0,
      t: 0,
    }),
    !GFP.bg)
  ) {
    const a = MAPS[SS_MAP].v,
      s = (GFP.bg = paintGround(a, t.width, t.height, 0, 41).c),
      e = s.getContext("2d");
    a.amb &&
      a.amb[0] > 0.05 &&
      ((e.fillStyle = `rgba(${a.amb[1]},${a.amb[2]},${a.amb[3]},${Math.min(0.45, 0.6 * a.amb[0])})`),
      e.fillRect(0, 0, s.width, s.height));
  }
  GFP.raf || (GFP.raf = requestAnimationFrame(gfPrevLoop));
}
function gfPrevLoop(t) {
  const a = GFP,
    s = a.cv;
  if (!s || !s.isConnected) return ((a.raf = 0), void (a.cv = null));
  a.raf = requestAnimationFrame(gfPrevLoop);
  const e = Math.min(0.05, a.t ? (t - a.t) / 1e3 : 0);
  a.t = t;
  const n = s.getContext("2d"),
    l = s.width,
    o = s.height - 10,
    r = Math.round(0.66 * l),
    i = Math.round(0.3 * l),
    c = {
      type: "slime",
      x: r,
      y: o,
      h: 10,
      max: 1,
      hp: 1,
      t: a.E.t,
      face: -1,
      flash: a.fl,
      lunge: 0,
      sl: 0,
      eye: -1,
    };
  if (a.dead)
    (a.dead += e) > 1.9 && Object.assign(a, { dead: 0, hp: 5, hit: 0.5 });
  else if (
    (a.hit -= e) <= 0 &&
    ((a.hit = 0.55),
    (a.sw = 0.16),
    a.hp--,
    (a.fl = 0.12),
    a.k.includes("h") && gfHit(a.E, a.g, r - 3, o - 5, o),
    !a.hp)
  )
    if (((a.dead = 0.001), a.k.includes("k")))
      gfKill(a.E, a.g, c, gfSnap(c), 0);
    else
      for (let t = 0; t < 10; t++) {
        const s = 6.283 * Math.random();
        gfPart(a.E, {
          x: r,
          y: o - 5,
          vx: 40 * Math.cos(s),
          vy: 30 * Math.sin(s),
          g: 90,
          life: 0.4,
          c: ["#ffffff", "#5fc86a", "#2f8a4a"][t % 3],
        });
      }
  ((a.fl = Math.max(0, a.fl - e)),
    (a.sw = Math.max(0, a.sw - e)),
    gfStep(a.E, e),
    (n.imageSmoothingEnabled = !1),
    n.drawImage(a.bg, 0, 0),
    gfDraw(n, a.E, 0));
  const d =
    SP.hero[S.tal.asc ? S.cls + ":" + S.tal.asc : S.cls] || SP.hero[S.cls];
  if (
    ((n.fillStyle = "rgba(10,16,30,.35)"),
    pell(n, i, o, 5, 1),
    pell(n, r, o, 6, 1),
    n.drawImage(d.side[0], i - 8 + (a.sw > 0 ? 2 : 0), o - 19),
    a.sw > 0)
  ) {
    n.fillStyle = "#ffffff";
    for (let t = -1; t <= 1; t += 0.25)
      n.fillRect(
        Math.round(i + 6 + 9 * Math.cos(t)),
        Math.round(o - 8 + 7 * Math.sin(t)),
        1,
        1,
      );
  }
  (a.dead || drawSlime(n, c), gfDraw(n, a.E, 1));
}
function drawUnd(t, a) {
  const s = Math.floor(7 * G.t + a.x) % 9 ? "#9dff5a" : "#e8ffd0",
    e =
      (SP.und ||= {})[s] ||
      (SP.und[s] = paint(outlineRows(GF_WR), {
        k: INK,
        d: "#8a62d8",
        v: "#1a0a24",
        e: s,
      })),
    n = e.width,
    l = e.height,
    o = Math.max(0, a.rise) / 0.35,
    r = Math.round(a.x - n / 2 + (a.lg > 0 ? 2 * a.face : 0)),
    i = Math.round(a.y - l - 2 + 1 * Math.sin(6 * G.t + a.x) + o * l);
  (drawShadow(t, a.x, a.y, 3),
    (t.globalCompositeOperation = "lighter"),
    (t.globalAlpha = 0.35 + 0.15 * Math.sin(5 * G.t + a.x)),
    (t.fillStyle = "#6a2ab0"),
    pell(t, Math.round(a.x), Math.round(a.y), 6, 2),
    (t.globalCompositeOperation = "source-over"),
    (t.globalAlpha = Math.min(1, a.t / 0.5, 1 - 0.6 * o)),
    t.save(),
    t.beginPath(),
    t.rect(r - 2, i - 2, n + 4, Math.round(a.y) - i + 3),
    t.clip(),
    a.face < 0
      ? (t.translate(r + n, i), t.scale(-1, 1), t.drawImage(e, 0, 0))
      : t.drawImage(e, r, i),
    t.restore(),
    (t.fillStyle = "#b060ff"));
  for (let s = 0; s < 3; s++)
    hash2(s + Math.floor(a.x), Math.floor(12 * G.t)) < 0.6 &&
      t.fillRect(
        r + 2 + 2 * s,
        i + l - 1 + Math.floor(3 * hash2(s, Math.floor(9 * G.t))),
        1,
        1,
      );
  t.globalAlpha = 1;
}
function drawVort(t) {
  for (const a of G.vort) {
    const s = Math.round(a.r || 26),
      e = Math.round(0.7 * s),
      n = Math.round(a.x),
      l = Math.round(a.y);
    ((t.globalAlpha = 0.5),
      (t.fillStyle = "#0e2e5a"),
      pell(t, n, l, s, e),
      (t.globalAlpha = 0.45),
      (t.fillStyle = "#1e5a9a"),
      pell(t, n, l, Math.round(0.68 * s), Math.round(0.68 * e)),
      (t.globalAlpha = 0.8),
      (t.fillStyle = "#06142e"),
      pell(
        t,
        n,
        l,
        Math.max(2, Math.round(0.2 * s)),
        Math.max(1, Math.round(0.2 * e)),
      ),
      (t.globalAlpha = 1));
    const o = Math.round(1.3 * s);
    for (let a = 0; a < 3; a++)
      for (let e = 0; e < o; e++) {
        const r = e / o,
          i = 4.5 * -G.t + 2.094 * a + 5.2 * r,
          c = s * (1 - 0.85 * r);
        ((t.fillStyle = r < 0.2 ? "#ffffff" : r < 0.5 ? "#9ad8ff" : "#4a9ae0"),
          t.fillRect(
            Math.round(n + Math.cos(i) * c),
            Math.round(l + Math.sin(i) * c * 0.7),
            r < 0.55 ? 2 : 1,
            1,
          ));
      }
    for (let a = 0; a < 28; a++) {
      if ((a + Math.floor(8 * G.t)) % 4 == 0) continue;
      const o = 2 * -G.t + (a / 28) * 6.283;
      ((t.fillStyle = a % 2 ? "#e8f6ff" : "#9ad8ff"),
        t.fillRect(
          Math.round(n + Math.cos(o) * (s + 1)),
          Math.round(l + Math.sin(o) * (e + 1)),
          2,
          1,
        ));
    }
  }
}
function drawSsMarks(t) {
  const a = (a, s) => {
    if (!a || !G.mobs.includes(a)) return;
    const e = Math.round(a.x),
      n = Math.round(a.y - a.h - (a.boss ? 14 : 11)),
      l = Math.floor(4 * G.t) % 2;
    ((t.fillStyle = INK),
      t.fillRect(e - 3, n - 3, 7, 7),
      (t.fillStyle = s),
      t.fillRect(e - 2, n, 5, 1),
      t.fillRect(e, n - 2, 1, 5),
      l && ((t.fillStyle = "#ffffff"), t.fillRect(e, n, 1, 1)));
  };
  (a(G.dvj.m, "#ffd84a"), G.jc.m !== G.dvj.m && a(G.jc.m, "#ffc83a"));
  for (const a of G.mobs) {
    if (
      a.lnk &&
      a.lnk.t > G.t &&
      G.mobs.includes(a.lnk.o) &&
      a.id < a.lnk.o.id
    ) {
      const s = a.lnk.o,
        e = Math.max(2, Math.round(dist(a, s) / 3));
      t.fillStyle = "#b07aff";
      for (let n = ((8 * G.t) | 0) % 2; n <= e; n += 2)
        t.fillRect(
          Math.round(a.x + ((s.x - a.x) * n) / e),
          Math.round(
            a.y - 0.5 * a.h + ((s.y - a.y + 0.5 * (a.h - s.h)) * n) / e,
          ),
          1,
          1,
        );
    }
    if (a.stn > 0) {
      const s = Math.round(a.x),
        e = Math.round(a.y - a.h - 4),
        n = 8 * G.t;
      t.fillStyle = "#ffe066";
      for (let a = 0; a < 3; a++)
        t.fillRect(
          Math.round(s + 4 * Math.cos(n + 2.1 * a)),
          Math.round(e + 1.5 * Math.sin(n + 2.1 * a)),
          1,
          1,
        );
    }
  }
}
function draw(t) {
  G.ground || buildGround();
  const a = G.VH || G.H,
    s = clamp(G.pl.y - (26 + a) / 2, 0, G.H - a);
  G.cy = null == G.cy || a >= G.H ? s : G.cy + 0.15 * (s - G.cy);
  const e = Math.round(G.cy),
    n = G.shake ? ri(-1, 1) : 0,
    l = G.shake ? ri(-1, 1) : 0;
  (t.save(),
    t.translate(n, l - e),
    (t.fillStyle = "#0e0b16"),
    t.fillRect(-2, -2, G.W + 4, G.H + 4),
    t.drawImage(G.ground, 0, 0, G.W, G.H),
    drawFxGround(t),
    drawVort(t),
    drawLoot(t),
    drawTrail(t),
    gfScan(t),
    G.dead || drawShadow(t, G.pl.x, G.pl.y, 5));
  for (const a of G.mins) drawShadow(t, a.x, a.y, 2);
  for (const a of G.gsp) drawShadow(t, a.x, a.y, 4);
  for (const a of G.turs) drawShadow(t, a.x, a.y, 3);
  for (const a of G.mobs)
    drawShadow(
      t,
      a.x,
      a.y,
      Math.round(
        ("bat" === a.type || "wisp" === a.type ? 3 : 5) * (a.boss ? 2 : 1),
      ),
    );
  const o = [];
  for (const a of G.props || [])
    o.push({
      y: a.y,
      f: () =>
        t.drawImage(a.s, Math.round(a.x - a.s.width / 2), a.y - a.s.height + 2),
    });
  for (const a of G.mobs) o.push({ y: a.y, f: () => drawMob(t, a) });
  o.push({ y: G.pl.y, f: () => drawPlayer(t) });
  for (const a of G.und) o.push({ y: a.y, f: () => drawUnd(t, a) });
  G.pl.clone > G.t &&
    !G.dead &&
    o.push({ y: G.pl.y - 2, f: () => drawClone(t) });
  for (const a of G.mins) o.push({ y: a.y, f: () => drawSpirit(t, a) });
  for (const a of G.gsp) o.push({ y: a.y, f: () => drawGsp(t, a) });
  for (const a of G.saps) o.push({ y: a.y, f: () => drawSap(t, a) });
  for (const a of G.turs) o.push({ y: a.y, f: () => drawTurret(t, a) });
  o.sort((t, a) => t.y - a.y);
  for (const t of o) t.f();
  (gfTop(t),
    drawSsMarks(t),
    drawSlash(t),
    drawFxTop(t),
    drawLighting(t),
    drawGlow(t));
  for (const a of G.nums) {
    const s = a.big ? 2 : 1,
      e = Math.min(1, a.t / 0.35),
      n = a.y - 12 * (1 - Math.pow(1 - e, 3)) - (a.big && a.t < 0.08 ? 2 : 0);
    false ||
      ptext(
        t,
        a.txt,
        clamp(a.x - textW(a.txt, s) / 2, 1, G.W - textW(a.txt, s) - 1),
        n,
        a.col,
        s,
      );
  }
  if ((t.restore(), G.hurtFlash > 0)) {
    t.fillStyle = `rgba(200,30,50,${0.65 * G.hurtFlash})`;
    const s = 2 + Math.round(10 * G.hurtFlash);
    (t.fillRect(0, 0, G.W, s),
      t.fillRect(0, a - s, G.W, s),
      t.fillRect(0, 0, s, a),
      t.fillRect(G.W - s, 0, s, a));
  }
  if ((ZEN || drawHUD(t), G.dead)) {
    ((t.fillStyle = "rgba(14,8,20,.55)"), t.fillRect(0, 0, G.W, a));
    const s = "YOU DIED";
    ptext(t, s, G.W / 2 - textW(s, 2) / 2, a / 2 - 14, "#e0445a", 2);
    const e = String(Math.ceil(G.dead));
    ptext(t, e, G.W / 2 - textW(e, 3) / 2, a / 2 + 2, "#f3ead8", 3);
  }
}
const GEM_ART = {},
  MUT_HUE = "#a040ff",
  SX_COL = "#f4f4ff",
  gemNm = (t) =>
    typeof roGemName === "function"
      ? roGemName(t)
      : SKILLS[t.id].n + (t.sx ? "（穿梭）" : "") + (t.sh ? "（變異）" : "");
function gemArt(t, a, s, e, n) {
  const l = t + a + ":" + s + (e ? ":" + e.join(" ") : "") + (n ? ":sx" : "");
  if (GEM_ART[l]) return GEM_ART[l];
  const o = SKILLS[t],
    r = (e || o.shape).map((t) => rotCell(t, a)),
    i = r.map((t) => t[0]),
    c = r.map((t) => t[1]),
    d = Math.min(...i),
    f = Math.min(...c),
    p = Math.max(...i) - d + 1,
    u = Math.max(...c) - f + 1,
    h = new Set(r.map(([t, a]) => t - d + "," + (a - f))),
    m = s + 1,
    A = p * m - 1,
    g = u * m - 1,
    v = new Uint8Array(A * g),
    b = new Int16Array(A * g).fill(-1),
    S = (t, a, s, e, n) => {
      for (let l = a; l < e; l++)
        for (let a = t; a < s; a++) ((v[l * A + a] = 1), (b[l * A + a] = n));
    },
    k = [...h]
      .map((t) => t.split(",").map(Number))
      .sort((t, a) => t[1] - a[1] || t[0] - a[0]);
  k.forEach(([t, a], e) => {
    (S(t * m, a * m, t * m + s, a * m + s, e),
      h.has(t + 1 + "," + a) && S(t * m + s, a * m, t * m + m, a * m + s, -1),
      h.has(t + "," + (a + 1)) && S(t * m, a * m + s, t * m + s, a * m + m, -1),
      h.has(t + 1 + "," + a) &&
        h.has(t + "," + (a + 1)) &&
        h.has(t + 1 + "," + (a + 1)) &&
        S(t * m + s, a * m + s, t * m + m, a * m + m, -1));
  });
  const x = s >= 12,
    y = x ? 2 : 1,
    w = o.col,
    $ = {
      o: o.leg ? "#e8b030" : "#1b1424",
      d: shade(w, -0.45),
      m: w,
      t: shade(w, 0.3),
      h: shade(w, 0.6),
      w: "#ffffff",
      f1: shade(w, 0.2),
      f2: shade(w, 0.06),
      f3: shade(w, -0.16),
      f4: shade(w, -0.3),
      P1: "#b49a74",
      P2: "#7e6852",
      P3: "#4e3e32",
      P4: "#2a201a",
    };
  n &&
    Object.assign($, {
      o: SX_COL,
      P1: "#d8dce8",
      P2: "#9aa0b4",
      P3: "#62687c",
      P4: "#2c3040",
      S: "#c8ccdc",
    });
  const M = !!e;
  if (M)
    for (const t of Object.keys($))
      "o" !== t &&
        "w" !== t &&
        (($[t + "1"] = mixHex($[t], MUT_HUE, 0.22)),
        ($[t + "2"] = mixHex($[t], MUT_HUE, 0.45)));
  const B = !o.act,
    C = (t, a) => t >= 0 && a >= 0 && t < A && a < g && v[a * A + t],
    G = (t, a) => {
      let e = ((t, a) => {
        if (!(C(t - 1, a) && C(t + 1, a) && C(t, a - 1) && C(t, a + 1)))
          return "o";
        let e = 9,
          n = 9;
        for (let s = 2; s <= y + 1; s++)
          (!(e > s) || (C(t - s, a) && C(t, a - s)) || (e = s),
            !(n > s) || (C(t + s, a) && C(t, a + s)) || (n = s));
        if (e < 9 || n < 9)
          return B
            ? e < n
              ? "P1"
              : n < e
                ? "P3"
                : "P2"
            : e < n
              ? x
                ? "h"
                : "t"
              : n < e
                ? "d"
                : "m";
        const l = b[a * A + t];
        if (l < 0) return B ? "P2" : "f3";
        const [r, i] = k[l],
          c = t - r * m,
          d = a - i * m,
          f = (s - 1) / 2,
          p = c - f,
          u = d - f;
        if (
          !B &&
          0 === l &&
          (x
            ? (5 === c && d >= 4 && d <= 6) || (5 === d && c >= 4 && c <= 6)
            : 1 === c && 1 === d)
        )
          return "w";
        if (!x)
          return Math.abs(p) + Math.abs(u) < 1
            ? B
              ? "m"
              : "h"
            : B
              ? "P2"
              : "m";
        if (o.act)
          return Math.abs(p) <= 2.5 && Math.abs(u) <= 2.5
            ? -2.5 === p || -2.5 === u
              ? "h"
              : 2.5 === p || 2.5 === u
                ? "f2"
                : "t"
            : Math.abs(u) >= Math.abs(p)
              ? u < 0
                ? "f1"
                : "f4"
              : p < 0
                ? "f2"
                : "f3";
        const h = Math.hypot(p, u),
          g = Math.hypot(p + 1.5, u + 1.5);
        return h <= 4.3
          ? g < 0.8
            ? "w"
            : g < 1.9
              ? "h"
              : p + u < -2
                ? "t"
                : p + u > 3
                  ? "f4"
                  : "m"
          : h <= 5.4
            ? "P4"
            : (c + d) % 7 == 0
              ? "P3"
              : "P2";
      })(t, a);
      if (
        (n &&
          ("P2" === e || "P3" === e) &&
          (((t - a) % 6) + 6) % 6 < 2 &&
          (e = "S"),
        !M || "o" === e || "w" === e)
      )
        return e;
      const l = t / A + a / g;
      return l > 1.15 ? e + "2" : l > 0.85 ? e + "1" : e;
    };
  let R = "";
  for (let t = 0; t < g; t++)
    for (let a = 0; a < A;) {
      if (!v[t * A + a]) {
        a++;
        continue;
      }
      const s = G(a, t);
      let e = a + 1;
      for (; e < A && v[t * A + e] && G(e, t) === s;) e++;
      ((R += `<rect x="${a}" y="${t}" width="${e - a}" height="1" fill="${$[s]}"/>`),
        (a = e));
    }
  return (GEM_ART[l] = {
    w: p,
    h: u,
    W: A,
    H: g,
    svg: `<svg viewBox="0 0 ${A} ${g}" preserveAspectRatio="none" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${R}</svg>`,
  });
}
const AU = {
  ctx: null,
  sfx: null,
  mus: null,
  nz: null,
  last: {},
  vo: 0,
  song: null,
  key: "",
  step: 0,
  next: 0,
};
let auS = 49723809;
const arnd = () =>
    (auS = (Math.imul(auS, 1664525) + 1013904223) >>> 0) / 4294967296,
  hz = (t) => 440 * 2 ** ((t - 69) / 12),
  auVol = (t) => (S && S.set && S.set[t]) ?? ("mus" === t ? 0.5 : 0.7);
function auInit() {
  if (AU.ctx)
    return void (
      "suspended" !== AU.ctx.state ||
      document.hidden ||
      TAB.gone ||
      AU.ctx.resume().catch(() => {})
    );
  const t = window.AudioContext || window.webkitAudioContext;
  if (!t) return;
  try {
    AU.ctx = new t();
  } catch (t) {
    return;
  }
  const a = AU.ctx,
    s = a.createDynamicsCompressor();
  ((s.threshold.value = -16),
    (s.ratio.value = 4),
    s.connect(a.destination),
    (AU.sfx = a.createGain()),
    (AU.mus = a.createGain()),
    (AU.sfx.gain.value = AU.mus.gain.value = 0),
    AU.sfx.connect(s),
    AU.mus.connect(s));
  const e = a.sampleRate,
    n = a.createBuffer(1, e, e),
    l = n.getChannelData(0);
  for (let t = 0; t < e; t++) l[t] = 2 * arnd() - 1;
  ((AU.nz = n),
    auApply(),
    "suspended" === a.state && a.resume().catch(() => {}),
    setInterval(musTick, 60));
}
function auApply() {
  if (!AU.ctx) return;
  const t = AU.ctx.currentTime,
    a = auVol("sfx"),
    s = auVol("mus");
  (AU.sfx.gain.setTargetAtTime(a * a * 0.9, t, 0.03),
    AU.mus.gain.setTargetAtTime(s * s * 0.6, t, 0.2));
}
function env(t, a, s, e, n) {
  ((t.value = 1e-4),
    t.setValueAtTime(1e-4, a),
    t.exponentialRampToValueAtTime(n, a + s),
    t.exponentialRampToValueAtTime(1e-4, a + e));
}
function osc(t, a) {
  const s = AU.ctx,
    e = s.createOscillator(),
    n = s.createGain();
  ((e.type = a.w || "square"),
    e.frequency.setValueAtTime(a.f, t),
    a.f2 && e.frequency.exponentialRampToValueAtTime(a.f2, t + (a.fd || a.d)));
  let l = e;
  if (a.lp) {
    const t = s.createBiquadFilter();
    ((t.frequency.value = a.lp), e.connect(t), (l = t));
  }
  (l.connect(n),
    n.connect(a.to || AU.sfx),
    env(n.gain, t, a.a || 0.004, a.d, a.g || 0.2),
    e.start(t),
    e.stop(t + a.d + 0.02),
    voice(e, a.to));
}
function nzv(t, a) {
  const s = AU.ctx,
    e = s.createBufferSource(),
    n = s.createBiquadFilter(),
    l = s.createGain();
  ((e.buffer = AU.nz),
    (n.type = a.ft || "bandpass"),
    (n.Q.value = a.q || 1),
    n.frequency.setValueAtTime(a.f, t),
    a.f2 && n.frequency.exponentialRampToValueAtTime(a.f2, t + a.d),
    e.connect(n),
    n.connect(l),
    l.connect(a.to || AU.sfx),
    env(l.gain, t, a.a || 0.003, a.d, a.g || 0.2),
    e.start(t, 0.8 * arnd()),
    e.stop(t + a.d + 0.02),
    voice(e, a.to));
}
function voice(t, a) {
  a || (AU.vo++, (t.onended = () => AU.vo--));
}
(["pointerdown", "pointerup", "touchend", "keydown", "click"].forEach((t) =>
  window.addEventListener(t, auInit, !0),
),
  document.addEventListener("visibilitychange", () => {
    const t = AU.ctx;
    t &&
      (document.hidden
        ? t.suspend().catch(() => {})
        : t.resume().catch(() => {}));
  }));
const twang = (t, a, s, e) => {
    (osc(t, { w: "triangle", f: s * a, f2: s * a * 0.35, d: 0.1, g: e }),
      nzv(t, { ft: "highpass", f: 3500, d: 0.05, g: 0.3 * e }));
  },
  notes = (t, a, s, e) =>
    a.forEach((n, l) =>
      osc(
        t + l * s,
        Object.assign(
          { w: "square", f: hz(n), d: 0.14, g: 0.08, lp: 3200 },
          e,
          l === a.length - 1 && e.last ? e.last : {},
        ),
      ),
    );
function curseSfx(t, a) {
  (osc(t, {
    w: "triangle",
    f: 220 * a,
    f2: 150 * a,
    d: 0.4,
    a: 0.04,
    g: 0.1,
    lp: 1200,
  }),
    osc(t + 0.03, {
      w: "sine",
      f: 233 * a,
      f2: 160 * a,
      d: 0.4,
      a: 0.04,
      g: 0.08,
    }),
    nzv(t, { ft: "bandpass", f: 900, f2: 400, d: 0.35, g: 0.1 }));
}
const SFX = {
  swing: [
    0.05,
    (t, a) =>
      nzv(t, { f: 900 * a, f2: 3400 * a, q: 1.2, d: 0.12, a: 0.03, g: 0.5 }),
  ],
  hit: [
    0.035,
    (t, a) => {
      (nzv(t, { ft: "lowpass", f: 2600 * a, f2: 450, d: 0.07, g: 0.26 }),
        osc(t, { w: "triangle", f: 190 * a, f2: 60, d: 0.08, g: 0.32 }));
    },
  ],
  crit: [
    0.05,
    (t, a) => {
      (nzv(t, { ft: "lowpass", f: 5200, f2: 600, d: 0.1, g: 0.34 }),
        osc(t, { w: "triangle", f: 230 * a, f2: 55, d: 0.13, g: 0.42 }),
        osc(t, { w: "square", f: 1760 * a, d: 0.1, g: 0.05, lp: 4200 }));
    },
  ],
  shoot: [0.05, (t, a) => twang(t, a, 560, 0.2)],
  bolt: [
    0.05,
    (t, a) =>
      osc(t, {
        w: "square",
        f: 320 * a,
        f2: 960 * a,
        d: 0.12,
        g: 0.14,
        lp: 2400,
      }),
  ],
  kill: [
    0.05,
    (t, a) => {
      (osc(t, { w: "square", f: 440 * a, f2: 90, d: 0.13, g: 0.08, lp: 1800 }),
        nzv(t, { ft: "lowpass", f: 1500, f2: 200, d: 0.15, g: 0.16 }));
    },
  ],
  big: [
    0.15,
    (t) => {
      (osc(t, { w: "triangle", f: 150, f2: 38, d: 0.5, g: 0.5 }),
        nzv(t, { ft: "lowpass", f: 2400, f2: 110, d: 0.55, g: 0.34 }));
    },
  ],
  hurt: [
    0.12,
    (t, a) =>
      osc(t, { w: "square", f: 250 * a, f2: 110, d: 0.14, g: 0.09, lp: 1400 }),
  ],
  miss: [
    0.1,
    (t) => nzv(t, { f: 1800, f2: 5200, q: 1.5, d: 0.12, a: 0.02, g: 0.35 }),
  ],
  pot: [
    0.3,
    (t) => {
      for (let a = 0; a < 3; a++)
        osc(t + 0.065 * a, {
          w: "sine",
          f: 380 + 90 * a,
          f2: 760 + 120 * a,
          d: 0.07,
          g: 0.13,
        });
    },
  ],
  pick: [
    0.07,
    (t, a) =>
      osc(t, {
        w: "square",
        f: 1320 * a,
        f2: 1980 * a,
        fd: 0.03,
        d: 0.06,
        g: 0.05,
        lp: 4e3,
      }),
  ],
  mat: [
    0.12,
    (t) => notes(t, [84, 91], 0.06, { w: "triangle", d: 0.3, g: 0.1 }),
  ],
  drop: [
    0.1,
    (t, a, s) => {
      (notes(t, [76, 79, 83, 88, 91].slice(0, s + 1), 0.07, {
        w: "triangle",
        d: 0.45,
        g: 0.12,
      }),
        osc(t + 0.07 * s, {
          w: "sine",
          f: hz([76, 79, 83, 88, 91][s] + 12),
          d: 1.1,
          g: 0.05,
        }));
    },
  ],
  lvl: [
    0.5,
    (t) => {
      (notes(t, [72, 76, 79, 84], 0.09, { last: { d: 0.6 } }),
        osc(t + 0.27, { w: "triangle", f: hz(60), d: 0.7, g: 0.18 }));
    },
  ],
  quest: [
    0.4,
    (t) => notes(t, [79, 84], 0.1, { w: "triangle", d: 0.35, g: 0.14 }),
  ],
  boss: [
    1,
    (t) => {
      for (const a of [38, 45])
        osc(t, { w: "sawtooth", f: hz(a), d: 1.5, a: 0.25, g: 0.16, lp: 650 });
      nzv(t, { ft: "lowpass", f: 420, f2: 70, d: 1.3, a: 0.1, g: 0.3 });
    },
  ],
  win: [
    1,
    (t) => {
      (notes(t, [67, 71, 74, 79], 0.1, { last: { d: 0.9 } }),
        notes(t + 0.3, [55, 62], 0, { w: "triangle", d: 0.9, g: 0.16 }));
    },
  ],
  die: [
    1,
    (t) => {
      notes(t, [64, 60, 57, 52], 0.16, {
        w: "triangle",
        d: 0.3,
        g: 0.16,
        last: { d: 0.9 },
      });
    },
  ],
  alch: [
    0.3,
    (t, a, s) => {
      (nzv(t, { f: 500, f2: 2600, q: 3, d: 0.65, a: 0.55, g: 0.16 }),
        notes(t + 0.65, [79, 84, 88, 91, 96].slice(0, 2 + s), 0.06, {
          w: "triangle",
          d: 0.4,
          g: 0.12,
        }));
    },
  ],
  alchF: [
    0.3,
    (t) => {
      (nzv(t, { f: 500, f2: 2600, q: 3, d: 0.65, a: 0.55, g: 0.16 }),
        osc(t + 0.65, {
          w: "square",
          f: 220,
          f2: 70,
          d: 0.3,
          g: 0.09,
          lp: 1200,
        }),
        nzv(t + 0.65, { ft: "lowpass", f: 1600, f2: 150, d: 0.3, g: 0.2 }));
    },
  ],
  click: [
    0.04,
    (t) => osc(t, { w: "square", f: 1100, d: 0.03, g: 0.03, lp: 3e3 }),
  ],
  heavy: [
    0.1,
    (t, a) => {
      (osc(t + 0.1, { w: "triangle", f: 130 * a, f2: 40, d: 0.3, g: 0.5 }),
        nzv(t + 0.1, { ft: "lowpass", f: 900, f2: 90, d: 0.32, g: 0.32 }));
    },
  ],
  whirl: [
    0.1,
    (t, a) => {
      for (let s = 0; s < 2; s++)
        nzv(t + 0.09 * s, {
          f: 700 * a,
          f2: 3e3 * a,
          q: 1.2,
          d: 0.14,
          a: 0.04,
          g: 0.5,
        });
    },
  ],
  fissure: [
    0.1,
    (t, a) => {
      (osc(t + 0.12, { w: "triangle", f: 110 * a, f2: 35, d: 0.35, g: 0.5 }),
        nzv(t + 0.12, { ft: "lowpass", f: 1600, f2: 120, d: 0.45, g: 0.4 }),
        nzv(t + 0.16, { f: 2600 * a, f2: 900, q: 2, d: 0.12, g: 0.25 }));
    },
  ],
  leap: [
    0.1,
    (t, a) => {
      (nzv(t, { f: 500 * a, f2: 1800 * a, q: 1, d: 0.3, a: 0.12, g: 0.3 }),
        osc(t + 0.4, { w: "triangle", f: 120 * a, f2: 30, d: 0.35, g: 0.6 }),
        nzv(t + 0.4, { ft: "lowpass", f: 1e3, f2: 80, d: 0.35, g: 0.4 }));
    },
  ],
  swave: [
    0.08,
    (t, a) => {
      (nzv(t + 0.06, { f: 1800 * a, f2: 5200, q: 2, d: 0.16, a: 0.02, g: 0.4 }),
        osc(t + 0.06, {
          w: "sine",
          f: 900 * a,
          f2: 1600 * a,
          d: 0.12,
          g: 0.06,
        }));
    },
  ],
  exarrow: [
    0.06,
    (t, a) => {
      twang(t + 0.08, 1.15 * a, 900, 0.1);
    },
  ],
  trap: [
    0.1,
    (t, a) => {
      (nzv(t, { f: 1200 * a, f2: 600, q: 2, d: 0.1, g: 0.25 }),
        osc(t + 0.3, {
          w: "square",
          f: 300 * a,
          f2: 200,
          d: 0.06,
          g: 0.08,
          lp: 1500,
        }));
    },
  ],
  trapx: [
    0.08,
    (t, a) => {
      (osc(t, { w: "square", f: 520 * a, f2: 140, d: 0.08, g: 0.12, lp: 2e3 }),
        nzv(t + 0.02, { ft: "lowpass", f: 1500, f2: 150, d: 0.3, g: 0.35 }));
    },
  ],
  meteor: [
    0.1,
    (t, a) => {
      nzv(t, { ft: "lowpass", f: 200, f2: 1600, d: 1.1, a: 0.9, g: 0.3 });
    },
  ],
  bliz: [
    0.1,
    (t, a) => {
      nzv(t, { f: 2400 * a, f2: 5e3, q: 0.8, d: 0.6, a: 0.2, g: 0.18 });
    },
  ],
  thrust: [
    0.1,
    (t, a) => {
      for (let s = 0; s < 3; s++)
        nzv(t + 0.05 * s, {
          f: 1400 * a,
          f2: 4200,
          q: 1.5,
          d: 0.07,
          a: 0.01,
          g: 0.45,
        });
    },
  ],
  pierce: [
    0.1,
    (t, a) => {
      (twang(t + 0.14, a, 760, 0.24),
        osc(t + 0.14, {
          w: "square",
          f: 900 * a,
          f2: 300,
          d: 0.12,
          g: 0.04,
          lp: 2600,
        }));
    },
  ],
  rain: [
    0.1,
    (t, a) => {
      for (let s = 0; s < 4; s++)
        twang(t + 0.07 * s, a * (1 + 0.06 * s), 620, 0.12);
    },
  ],
  varrow: [
    0.1,
    (t, a) => {
      (twang(t + 0.13, a, 480, 0.2),
        nzv(t + 0.13, { f: 2400, f2: 900, q: 4, d: 0.25, a: 0.03, g: 0.06 }));
    },
  ],
  fire: [
    0.1,
    (t, a) => {
      (nzv(t + 0.1, {
        ft: "lowpass",
        f: 300,
        f2: 2400,
        d: 0.32,
        a: 0.06,
        g: 0.7,
      }),
        osc(t + 0.1, {
          w: "sawtooth",
          f: 110 * a,
          f2: 70,
          d: 0.3,
          g: 0.06,
          lp: 700,
        }));
    },
  ],
  chain: [
    0.1,
    (t, a) => {
      for (let s = 0; s < 5; s++)
        osc(t + 0.1 + 0.035 * s, {
          w: "square",
          f: (900 + 1300 * arnd()) * a,
          f2: 300,
          d: 0.05,
          g: 0.05,
          lp: 5e3,
        });
      nzv(t + 0.1, { ft: "highpass", f: 4e3, d: 0.2, g: 0.1 });
    },
  ],
  frenzy: [
    0.1,
    (t, a) => {
      (osc(t, {
        w: "sawtooth",
        f: 90 * a,
        f2: 140 * a,
        d: 0.35,
        a: 0.03,
        g: 0.12,
        lp: 800,
      }),
        osc(t + 0.08, {
          w: "square",
          f: 180 * a,
          f2: 260 * a,
          d: 0.25,
          a: 0.02,
          g: 0.04,
          lp: 1200,
        }),
        nzv(t, { ft: "bandpass", f: 500, f2: 900, d: 0.25, g: 0.12 }));
    },
  ],
  dance: [
    0.1,
    (t, a) => {
      for (let s = 0; s < 3; s++)
        osc(t + 0.05 * s, {
          w: "triangle",
          f: (520 + 160 * s) * a,
          f2: (700 + 160 * s) * a,
          d: 0.12,
          a: 0.01,
          g: 0.06,
        });
      nzv(t, { ft: "highpass", f: 2500, f2: 5e3, d: 0.18, g: 0.08 });
    },
  ],
  cwk: [0.1, (t, a) => curseSfx(t, 0.9 * a)],
  cslw: [0.1, (t, a) => curseSfx(t, 0.8 * a)],
  cvul: [0.1, (t, a) => curseSfx(t, 1.1 * a)],
  whirlL: [
    0.1,
    (t, a) => {
      nzv(t, { f: 700 * a, f2: 2600 * a, q: 1.2, d: 0.3, a: 0.08, g: 0.3 });
    },
  ],
  bpool: [
    0.1,
    (t, a) => {
      (nzv(t, { ft: "lowpass", f: 400, f2: 1200, d: 0.4, a: 0.08, g: 0.35 }),
        osc(t, { w: "sine", f: 90 * a, f2: 60 * a, d: 0.45, a: 0.05, g: 0.3 }));
    },
  ],
  blink: [
    0.06,
    (t, a) => {
      (nzv(t, { f: 3e3 * a, f2: 900, q: 2, d: 0.1, g: 0.3 }),
        osc(t + 0.05, {
          w: "square",
          f: 1200 * a,
          f2: 500,
          d: 0.06,
          g: 0.05,
          lp: 3e3,
        }));
    },
  ],
  turret: [
    0.1,
    (t, a) => {
      (osc(t, { w: "square", f: 220 * a, f2: 160, d: 0.05, g: 0.08, lp: 1200 }),
        osc(t + 0.08, {
          w: "square",
          f: 260 * a,
          f2: 180,
          d: 0.05,
          g: 0.08,
          lp: 1200,
        }),
        nzv(t, { ft: "lowpass", f: 900, f2: 300, d: 0.15, g: 0.2 }));
    },
  ],
  farrow: [
    0.1,
    (t, a) => {
      (twang(t + 0.12, a, 520, 0.2),
        nzv(t + 0.12, {
          ft: "lowpass",
          f: 400,
          f2: 2e3,
          d: 0.25,
          a: 0.04,
          g: 0.3,
        }));
    },
  ],
  iarrow: [
    0.1,
    (t, a) => {
      (twang(t + 0.12, a, 640, 0.2),
        osc(t + 0.12, {
          w: "sine",
          f: 2200 * a,
          f2: 3e3 * a,
          d: 0.15,
          g: 0.05,
        }));
    },
  ],
  larrow: [
    0.1,
    (t, a) => {
      twang(t + 0.12, a, 700, 0.2);
      for (let s = 0; s < 3; s++)
        osc(t + 0.14 + 0.03 * s, {
          w: "square",
          f: (1e3 + 1e3 * arnd()) * a,
          f2: 300,
          d: 0.04,
          g: 0.04,
          lp: 5e3,
        });
    },
  ],
  frostsl: [
    0.1,
    (t, a) => {
      osc(t + 0.12, { w: "triangle", f: 140 * a, f2: 45, d: 0.28, g: 0.45 });
      for (let s = 0; s < 3; s++)
        osc(t + 0.13 + 0.04 * s, {
          w: "sine",
          f: (2e3 + 500 * s) * a,
          f2: (2600 + 500 * s) * a,
          d: 0.12,
          g: 0.05,
        });
      nzv(t + 0.12, { f: 3e3 * a, f2: 6e3, q: 1, d: 0.2, g: 0.15 });
    },
  ],
  venom: [
    0.08,
    (t, a) => {
      (nzv(t + 0.04, {
        f: 1600 * a,
        f2: 4200,
        q: 1.5,
        d: 0.1,
        a: 0.01,
        g: 0.4,
      }),
        nzv(t + 0.1, {
          ft: "lowpass",
          f: 600,
          f2: 1800,
          d: 0.3,
          a: 0.04,
          g: 0.3,
        }),
        osc(t + 0.1, { w: "sine", f: 220 * a, f2: 120 * a, d: 0.25, g: 0.08 }));
    },
  ],
  guard: [
    0.1,
    (t, a) => {
      for (let s = 0; s < 3; s++)
        osc(t + 0.07 * s, {
          w: "triangle",
          f: (330 + 110 * s) * a,
          f2: (360 + 110 * s) * a,
          d: 0.3,
          a: 0.02,
          g: 0.08,
        });
      osc(t, { w: "sine", f: 110 * a, d: 0.5, a: 0.05, g: 0.2 });
    },
  ],
  miasma: [
    0.1,
    (t, a) => {
      (nzv(t, { ft: "lowpass", f: 300, f2: 900, d: 0.7, a: 0.2, g: 0.3 }),
        osc(t, { w: "sine", f: 140 * a, f2: 100 * a, d: 0.6, a: 0.1, g: 0.1 }));
    },
  ],
  summon: [
    0.1,
    (t, a) => {
      for (let s = 0; s < 4; s++)
        osc(t + 0.06 * s, {
          w: "sine",
          f: (400 + 120 * s) * a,
          f2: (600 + 120 * s) * a,
          d: 0.2,
          a: 0.01,
          g: 0.06,
        });
      nzv(t, { ft: "highpass", f: 2e3, f2: 4e3, d: 0.3, g: 0.06 });
    },
  ],
  taunt: [
    0.1,
    (t, a) => {
      (osc(t + 0.05, {
        w: "sawtooth",
        f: 150 * a,
        f2: 110 * a,
        d: 0.45,
        a: 0.05,
        g: 0.14,
        lp: 900,
      }),
        osc(t + 0.05, {
          w: "square",
          f: 225 * a,
          f2: 165 * a,
          d: 0.4,
          a: 0.05,
          g: 0.05,
          lp: 700,
        }),
        nzv(t + 0.05, { ft: "lowpass", f: 700, f2: 200, d: 0.3, g: 0.18 }));
    },
  ],
  nova: [
    0.1,
    (t, a) => {
      (osc(t + 0.1, { w: "sine", f: 980 * a, f2: 180, d: 0.35, g: 0.2 }),
        nzv(t + 0.1, { ft: "lowpass", f: 3e3, f2: 200, d: 0.4, g: 0.26 }));
    },
  ],
};
function sfx(t, a = 0) {
  const s = AU.ctx;
  if (!s || "running" !== s.state || auVol("sfx") <= 0) return;
  const e = SFX[t],
    n = s.currentTime;
  if (!(!e || n - (AU.last[t] ?? -9) < e[0] || AU.vo > 40)) {
    AU.last[t] = n;
    try {
      e[1](n + 0.005, 1 + 0.12 * (arnd() - 0.5), a);
    } catch (t) {}
  }
}
((SFX.pierceL = SFX.pierce), (SFX.blinkL = SFX.blink), (SFX.fireL = SFX.fire));
const SCALE = {
  aeo: [0, 2, 3, 5, 7, 8, 10],
  dor: [0, 2, 3, 5, 7, 9, 10],
  phr: [0, 1, 3, 5, 7, 8, 10],
  hm: [0, 2, 3, 5, 7, 8, 11],
};
function songFor(t, a) {
  let s = 40503 + 7919 * t + (a ? 31337 : 0);
  const e = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296,
    n = (5 * t) % 12,
    l = 45 + n - (n > 5 ? 12 : 0),
    o = a
      ? [0, 5, 6, 4]
      : [
          [0, 5, 3, 4],
          [0, 3, 5, 4],
          [0, 6, 5, 4],
          [0, 5, 6, 3],
        ][t % 4],
    r = new Array(64).fill(null);
  let i = 9;
  for (let t = 0; t < 4; t++)
    for (let s = 0; s < 8; s++) {
      const n = o[t];
      if (0 === s || 4 === s) {
        if (e() < (a ? 0.9 : 0.7)) {
          const a = n + [0, 2, 4][Math.floor(3 * e())];
          ((i = clamp(a + 7 * Math.round((i - a) / 7), 5, 16)),
            (r[8 * t + s] = i));
        }
      } else
        e() < (a ? 0.55 : 0.35) &&
          ((i = clamp(i + [-2, -1, -1, 1, 1, 2][Math.floor(6 * e())], 5, 16)),
          (r[8 * t + s] = i));
    }
  for (let t = 0; t < 24; t++) r[32 + t] = r[t];
  ((r[56] = o[3] + 7), (r[60] = a ? o[3] + 9 : null));
  for (let t = 0; t < 64; t++)
    if (null != r[t]) {
      let a = 1;
      for (; a < 4 && t + a < 64 && null == r[t + a];) a++;
      r[t] = [r[t], a];
    }
  return {
    bpm: a ? 144 : 84 + (t % 4) * 6,
    sc: SCALE[a ? "hm" : ["aeo", "dor", "aeo", "phr"][t % 4]],
    root: l,
    prog: o,
    mel: r,
    boss: a,
  };
}
function musStep(t, a, s, e) {
  const n = (a >> 3) % 8,
    l = 7 & a,
    o = t.prog[n % 4],
    r = AU.mus,
    i = t.boss,
    c = (a) => t.root + t.sc[((a % 7) + 7) % 7] + 12 * Math.floor(a / 7);
  (i
    ? osc(s, {
        w: "triangle",
        f: hz(c(o) + (1 & l ? 12 : 0)),
        d: 0.9 * e,
        g: 0.3,
        to: r,
      })
    : (0 === l || 4 === l || (6 === l && 1 & n)) &&
      osc(s, {
        w: "triangle",
        f: hz(c(o + (4 === l ? 4 : 0))),
        d: e * (0 === l ? 3.5 : 1.8),
        a: 0.01,
        g: 0.28,
        to: r,
      }),
    osc(s, {
      w: "triangle",
      f: hz(c(o + [0, 2, 4, 7, 4, 2, 0, 2][l]) + 12),
      d: 0.9 * e,
      g: i ? 0.05 : 0.04,
      to: r,
    }));
  const d = t.mel[a % 64];
  (d &&
    osc(s, {
      w: "square",
      f: hz(c(d[0]) + 12),
      d: e * d[1] * 0.95,
      a: 0.015,
      g: 0.05,
      lp: i ? 2600 : 1600,
      to: r,
    }),
    i
      ? ((0 !== l && 4 !== l) ||
          osc(s, { w: "sine", f: 150, f2: 45, d: 0.18, g: 0.5, to: r }),
        (2 !== l && 6 !== l) || nzv(s, { f: 1800, d: 0.12, g: 0.14, to: r }),
        nzv(s, { ft: "highpass", f: 7e3, d: 0.03, g: 0.045, to: r }))
      : 1 & l && nzv(s, { ft: "highpass", f: 8e3, d: 0.03, g: 0.022, to: r }));
}
function musTick() {
  const t = AU.ctx;
  if (!t || "running" !== t.state) return;
  if (auVol("mus") <= 0) return void (AU.key = "");
  const a = S ? S.map : 0,
    s = (G && G.boss ? "b" : "m") + a;
  s !== AU.key &&
    ((AU.key = s),
    (AU.song = songFor(a, "b" === s[0])),
    (AU.step = 0),
    (AU.next = t.currentTime + 0.15));
  const e = AU.song,
    n = 30 / e.bpm;
  for (
    AU.next < t.currentTime && (AU.next = t.currentTime + 0.05);
    AU.next < t.currentTime + 0.3;
  ) {
    try {
      musStep(e, AU.step, AU.next, n);
    } catch (t) {}
    (AU.step++, (AU.next += n));
  }
}
const inflateRaw = (() => {
    function t() {
      ((this.table = new Uint16Array(16)), (this.trans = new Uint16Array(288)));
    }
    function a(a, s) {
      ((this.source = a),
        (this.sourceIndex = 0),
        (this.tag = 0),
        (this.bitcount = 0),
        (this.dest = s),
        (this.destLen = 0),
        (this.ltree = new t()),
        (this.dtree = new t()));
    }
    var s = new t(),
      e = new t(),
      n = new Uint8Array(30),
      l = new Uint16Array(30),
      o = new Uint8Array(30),
      r = new Uint16Array(30),
      i = new Uint8Array([
        16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15,
      ]),
      c = new t(),
      d = new Uint8Array(320);
    function f(t, a, s, e) {
      var n, l;
      for (n = 0; n < s; ++n) t[n] = 0;
      for (n = 0; n < 30 - s; ++n) t[n + s] = (n / s) | 0;
      for (l = e, n = 0; n < 30; ++n) ((a[n] = l), (l += 1 << t[n]));
    }
    var p = new Uint16Array(16);
    function u(t, a, s, e) {
      var n, l;
      for (n = 0; n < 16; ++n) t.table[n] = 0;
      for (n = 0; n < e; ++n) t.table[a[s + n]]++;
      for (t.table[0] = 0, l = 0, n = 0; n < 16; ++n)
        ((p[n] = l), (l += t.table[n]));
      for (n = 0; n < e; ++n) a[s + n] && (t.trans[p[a[s + n]]++] = n);
    }
    function h(t) {
      t.bitcount-- || ((t.tag = t.source[t.sourceIndex++]), (t.bitcount = 7));
      var a = 1 & t.tag;
      return ((t.tag >>>= 1), a);
    }
    function m(t, a, s) {
      if (!a) return s;
      for (; t.bitcount < 24;)
        ((t.tag |= t.source[t.sourceIndex++] << t.bitcount), (t.bitcount += 8));
      var e = t.tag & (65535 >>> (16 - a));
      return ((t.tag >>>= a), (t.bitcount -= a), e + s);
    }
    function A(t, a) {
      for (; t.bitcount < 24;)
        ((t.tag |= t.source[t.sourceIndex++] << t.bitcount), (t.bitcount += 8));
      var s = 0,
        e = 0,
        n = 0,
        l = t.tag;
      do {
        ((e = 2 * e + (1 & l)),
          (l >>>= 1),
          ++n,
          (s += a.table[n]),
          (e -= a.table[n]));
      } while (e >= 0);
      return ((t.tag = l), (t.bitcount -= n), a.trans[s + e]);
    }
    function g(t, a, s) {
      var e, n, l, o, r, f;
      for (e = m(t, 5, 257), n = m(t, 5, 1), l = m(t, 4, 4), o = 0; o < 19; ++o)
        d[o] = 0;
      for (o = 0; o < l; ++o) {
        var p = m(t, 3, 0);
        d[i[o]] = p;
      }
      for (u(c, d, 0, 19), r = 0; r < e + n;) {
        var h = A(t, c);
        switch (h) {
          case 16:
            var g = d[r - 1];
            for (f = m(t, 2, 3); f; --f) d[r++] = g;
            break;
          case 17:
            for (f = m(t, 3, 3); f; --f) d[r++] = 0;
            break;
          case 18:
            for (f = m(t, 7, 11); f; --f) d[r++] = 0;
            break;
          default:
            d[r++] = h;
        }
      }
      (u(a, d, 0, e), u(s, d, e, n));
    }
    function v(t, a, s) {
      for (;;) {
        var e,
          i,
          c,
          d,
          f = A(t, a);
        if (256 === f) return 0;
        if (f < 256) t.dest[t.destLen++] = f;
        else
          for (
            e = m(t, n[(f -= 257)], l[f]),
              i = A(t, s),
              d = c = t.destLen - m(t, o[i], r[i]);
            d < c + e;
            ++d
          )
            t.dest[t.destLen++] = t.dest[d];
      }
    }
    function b(t) {
      for (var a, s; t.bitcount > 8;) (t.sourceIndex--, (t.bitcount -= 8));
      if (
        (a =
          256 * (a = t.source[t.sourceIndex + 1]) + t.source[t.sourceIndex]) !==
        (65535 &
          ~(256 * t.source[t.sourceIndex + 3] + t.source[t.sourceIndex + 2]))
      )
        return -3;
      for (t.sourceIndex += 4, s = a; s; --s)
        t.dest[t.destLen++] = t.source[t.sourceIndex++];
      return ((t.bitcount = 0), 0);
    }
    return (
      (function (t, a) {
        var s;
        for (s = 0; s < 7; ++s) t.table[s] = 0;
        for (
          t.table[7] = 24, t.table[8] = 152, t.table[9] = 112, s = 0;
          s < 24;
          ++s
        )
          t.trans[s] = 256 + s;
        for (s = 0; s < 144; ++s) t.trans[24 + s] = s;
        for (s = 0; s < 8; ++s) t.trans[168 + s] = 280 + s;
        for (s = 0; s < 112; ++s) t.trans[176 + s] = 144 + s;
        for (s = 0; s < 5; ++s) a.table[s] = 0;
        for (a.table[5] = 32, s = 0; s < 32; ++s) a.trans[s] = s;
      })(s, e),
      f(n, l, 4, 3),
      f(o, r, 2, 1),
      (n[28] = 0),
      (l[28] = 258),
      function (t, n) {
        var l,
          o,
          r = new a(t, n);
        do {
          switch (((l = h(r)), m(r, 2, 0))) {
            case 0:
              o = b(r);
              break;
            case 1:
              o = v(r, s, e);
              break;
            case 2:
              (g(r, r.ltree, r.dtree), (o = v(r, r.ltree, r.dtree)));
              break;
            default:
              o = -3;
          }
          if (0 !== o) throw new Error("Data error");
        } while (!l);
        return r.destLen < r.dest.length
          ? "function" == typeof r.dest.slice
            ? r.dest.slice(0, r.destLen)
            : r.dest.subarray(0, r.destLen)
          : r.dest;
      }
    );
  })(),
  capT = (t, a, s = "%") =>
    `${+t.toFixed(1)}${s}${a - t > 0.05 ? `（${+a.toFixed(1)}${s}）` : ""}`,
  $ = (t) => document.querySelector(t);
let dirty = !1;
function markDirty() {
  dirty = !0;
}
const esc = (t) =>
    String(t).replace(
      /[&<>"]/g,
      (t) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[t],
    ),
  tierCol = (t) =>
    0 === t.t ? "var(--ru)" : `var(--t${Math.round(4 * tierQ(t))})`,
  rc = (t) =>
    t.sock
      ? "a" === t.sock.mode
        ? "ca"
        : "cs"
      : t.my
        ? "cm"
        : t.uq
          ? "cu"
          : "c" + Math.max(0, t.rar);
function toast(t, a = "", s = /\b(ru|rs|ra|r3|lvl|bad)\b/.test(a) ? 1 : 0) {
  termLog(t, a);
  const e = $("#toasts");
  if (!e) return;
  const n = () => [...e.children].filter((t) => !t.classList.contains("out")),
    l = (t) => {
      (clearTimeout(t._t),
        t.classList.add("out"),
        setTimeout(() => t.remove(), 420));
    },
    o = (t) => {
      (clearTimeout(t._t), (t._t = setTimeout(() => l(t), t._p ? 5e3 : 2200)));
    };
  let r = n().find((a) => a._m === t);
  if (r)
    return (r._n++, (r.textContent = `${t} X${r._n}`), e.prepend(r), void o(r));
  ((r = document.createElement("div")),
    (r.className = "toast " + a),
    (r.textContent = t),
    (r._m = t),
    (r._n = 1),
    (r._p = s),
    e.prepend(r),
    o(r));
  for (let t = n(); t.length > 4; t = n())
    l(t.filter((t) => !t._p).pop() || t.pop());
}
function lootToast(t, a = "", s) {
  S && S.set.nolt ? termLog(t, a) : toast(t, a, s);
}
const TM_LOG = [];
function termLog(t, a = "") {
  const s = TM_LOG[TM_LOG.length - 1];
  (s && s.m === t
    ? (s.n++, (s.t = Date.now()))
    : (TM_LOG.push({ t: Date.now(), m: t, c: a, n: 1 }),
      TM_LOG.length > 120 && TM_LOG.shift()),
    (TM_LOG.v = (TM_LOG.v || 0) + 1));
}
function findItem(t) {
  t = +t;
  for (const a of SLOTS)
    if (S.equip[a] && S.equip[a].u === t)
      return { it: S.equip[a], where: "equip" };
  const a = S.bag.find((a) => a.u === t);
  if (a) return { it: a, where: "bag" };
  const s = S.runes.find((a) => a.u === t);
  if (s) return { it: s, where: "rune" };
  const e =
    S.slates.find((a) => a.u === t) ||
    S.slt.flatMap((t) => (t ? t.s : [])).find((a) => a && a.u === t);
  return e ? { it: e, where: "slate" } : null;
}
const emptyIcon = (t) =>
  iconURL("weapon" === t ? ICON_SET.weapon[S.cls][0] : ICON_SET[t][0]);
function cellHtml(t, a, s) {
  const e = rarColor(t),
    n = t.rar > 0 || t.uq || t.sock ? e + "40" : "transparent";
  return `<button class="cell ${t.nw ? "new" : ""} ${s ? "sel" : ""} ${t.my ? "my" : ""}${t.mir ? " mir" : ""}" data-act="${a}" data-u="${t.u}" style="--rc:${t.rar > 0 || t.uq || t.sock ? e : "#6a5440"};--glow:${n}" aria-label="${esc(itemName(t))}">\n    <img src="${itemIcon(t)}" alt=""><span class="lv${canWear(t) ? "" : " no"}">${t.ilvl}</span>${t.lk ? '<span class="lk"></span>' : ""}${keepMatch(t) ? '<span class="kp"></span>' : ""}${t.sock ? `<span class="sk ${t.sock.mode}">${"<i></i>".repeat(t.sock.n)}</span>` : ""}${t.mir ? '<i class="mirf"></i>' : ""}${t.af && t.af.some((t) => null != AFFIX[t.a].dv) ? '<span class="dvm"></span>' : ""}</button>`;
}
function twLines() {
  const t = G.tw,
    a = Math.max(0, Math.ceil(t.t)),
    s = [
      [
        `第 ${t.f} 層・${Math.floor(a / 60)}:${String(a % 60).padStart(2, "0")}`,
        "",
      ],
      [
        `擊殺 ${Math.min(t.k, t.need)}/${t.need}${t.boss ? (t.bd ? "・王已擊敗" : t.bs ? "・擊敗王" : "・之後出現王") : ""}`,
        "",
      ],
    ];
  for (const a of t.rl) s.push([AFFIX[a.a].f(a.v), "dg"]);
  return s;
}
function slSumLines(t) {
  const a = [
    ...new Set(slatesOn(t).flatMap((t) => slLines(t).map((t) => t.a))),
  ].sort((t, a) => !!AFFIX[t].rw - !!AFFIX[a].rw);
  return [
    ...SLATE.map((a) => [a, slateSum(a.k, t, 1)])
      .filter(([, t]) => t)
      .map(([t, a]) => [t.f(a), ""]),
    ...a.map((a) => [
      AFFIX[a].f(slateSum(a, t, 1)),
      AFFIX[a].rw ? "rw" : "dg",
      a,
    ]),
  ];
}
const slatesUnlocked = () =>
    !!(
      S.beat[MAP_N - 1] ||
      S.slates.length ||
      S.slt.some((t) => t && t.s.some(Boolean))
    ),
  slateCell = (t, a, s = "") =>
    `<button class="cell${t.my ? " my" : ""}${t.mir ? " mir" : ""}" data-act="${a}" ${s} data-u="${t.u}" style="--rc:${t.rar > 0 || t.sock ? rarColor(t) : "#6a5440"};--glow:${t.rar > 0 || t.sock ? rarColor(t) + "40" : "transparent"}" aria-label="${esc(t.name)}"><img src="${itemIcon(t)}" alt=""><span class="lv">${t.ilvl}</span>${t.mir ? '<i class="mirf"></i>' : ""}</button>`,
  afTip = (t, a) =>
    AFFIX[t] && AFFIX[t].tip
      ? `<span class="tip" tabindex="0" data-tip="${esc(AFFIX[t].tip)}">${esc(a)}</span>`
      : esc(a),
  slV = (t, a) => Math.round(a * slK(t)),
  slateRow = (t) =>
    `<img src="${itemIcon(t)}" alt=""${t.my ? ' class="myi"' : ""} style="width:32px;height:32px;image-rendering:pixelated"><div class="grow"><div class="t">${t.lk ? '<span class="tag" style="color:var(--ember)">鎖定</span> ' : ""}${keepMatch(t, slSet().skeep) ? '<span class="tag" style="color:var(--ok)">保留</span> ' : ""}<span class="${t.sock ? "cs" : t.my ? "cm" : "c" + t.rar}">${esc(t.name)}</span> <small class="note">${t.sock ? `插槽 <span class="px">${t.sock.n}</span> 孔` : t.my ? "主宰" : t.fused ? "已鑲嵌" : RAR_NAME[t.rar]}・<span class="px">LV${t.ilvl}</span></small></div>${1 !== slK(t) ? `<div class="s note">插槽加成：詞綴效果 <span class="px">×${slK(t)}</span></div>` : ""}<div class="s">${esc(SLATE[t.b].f(slV(t, t.v)))}</div>${t.af.map((a) => `<div class="s"><span class="tag" style="color:${tierCol(a)}">T${a.t}</span> ${afTip(a.a, AFFIX[a.a].f(slV(t, a.v)))}</div>`).join("")}${slDg(t) ? `<div class="s" style="color:var(--bad)">危險度 <span class="px">${Math.round(slDg(t))}</span></div>` : ""}${(t.dg || []).map((a) => `<div class="s" style="color:var(--bad)">${esc(AFFIX[a.a].f(slV(t, a.v)))}</div>`).join("")}</div>`,
  dgHtml = (t) =>
    t.dg && t.dg.length
      ? `<div class="dgSec"><p class="note" style="margin:4px 0 0">危險詞綴</p>${t.dg.map((t) => `<div class="affix"><span class="tag" style="color:${tierCol(t)}">T${t.t}</span><span style="color:var(--bad)">${esc(AFFIX[t.a].f(t.v))} <small class="rng">${rngText(t)}</small></span></div>`).join("")}</div>`
      : "";
function slateChanged() {
  (recalc(), markDirty(), ui.hud());
}
const slWhere = (t) => {
  for (let a = 0; a < S.slt.length; a++) {
    const s = S.slt[a]?.s.findIndex((a) => a && a.u === t) ?? -1;
    if (s >= 0) return [a, s];
  }
  return null;
};
function slPlace(t, a, s) {
  const e = slotsOf();
  if (a >= slateOpen()) return;
  let n = null;
  const l = S.slates.findIndex((t) => t.u === s),
    o = slWhere(s);
  (l >= 0
    ? (n = S.slates.splice(l, 1)[0])
    : o && ((n = S.slt[o[0]].s[o[1]]), (S.slt[o[0]].s[o[1]] = null)),
    n &&
      (delete n.nw,
      e.s[a] && S.slates.push(e.s[a]),
      (e.s[a] = n),
      slateChanged(),
      sfx("alch")));
}
function slTakeOut(t, a) {
  const s = slotsOf();
  s.s[a] && (S.slates.push(s.s[a]), (s.s[a] = null), slateChanged());
}
function affixLine(t, a, s = 1, e = !1) {
  const n = AFFIX[t.a],
    l = a ? `<span class="w">${((n.w / a) * 100 * s).toFixed(0)}%</span>` : "";
  return null != n.dv
    ? `<div class="affix"><span class="tag" style="color:var(--dv)">神眷 T${t.t}</span><span style="color:var(--dv)">${esc(n.f(t.v))} <small class="rng">${rngText(t)}</small>${e ? ' <span class="tag" style="color:var(--ok)">封印</span>' : ""}</span>${l}</div>`
    : `<div class="affix"><span class="tag" style="color:${tierCol(t)}">T${t.t}</span><span>${afTip(t.a, n.f(t.v))} <small class="rng">${rngText(t)}</small>${e ? ' <span class="tag" style="color:var(--ok)">封印</span>' : ""}</span>${l}</div>`;
}
const BAG_PG = 60,
  BAG_SORT = [
    ["new", "最新取得"],
    ["rar", "稀有度"],
    ["lvl", "物品等級"],
    ["slot", "部位"],
    ["dps", "裝備後 DPS"],
    ["hp", "裝備後生命"],
    ["arm", "護甲"],
    ["eva", "閃避"],
    ["base", "基底品質"],
  ],
  RUNE_SORT = [
    ["new", "最新取得"],
    ["tier", "階級"],
    ["type", "種類"],
    ["grp", "依詞綴分組"],
  ],
  RUNE_TIER_F = [
    [9, "全部階級"],
    [-1, "獨特效果"],
    ...[0, 1, 2, 3, 4, 5].map((t) => [t, t ? `T${t} 或更好` : "T0"]),
  ],
  SOCK_M = [
    ["d", "異種"],
    ["a", "任意"],
  ],
  RAR_F = [
    [-9, "全部稀有度"],
    [0, "普通"],
    [1, "魔法"],
    [2, "稀有"],
    [3, "傳奇"],
    [4, "神話"],
    [5, "獨特"],
    [10, "主宰"],
    [6, "插槽"],
    [8, "插槽・異種"],
    [9, "插槽・任意"],
  ];
function fitDetail() {
  const t = $("#panel").getBoundingClientRect();
  for (const a of document.querySelectorAll(
    "#panel .detail, #panel .bagScroll",
  )) {
    const s = Math.max(a.getBoundingClientRect().top, t.top + 12);
    a.style.maxHeight =
      Math.max(
        a.classList.contains("detail") ? 160 : 140,
        Math.floor(t.bottom - s - 8),
      ) + "px";
  }
}
const bagHint = (t) =>
    t.classList.toggle(
      "end",
      t.scrollTop + t.clientHeight >=
        t.scrollHeight - 4 - (t.querySelector(".more")?.offsetHeight || 0),
    ),
  lstMore = (t) =>
    t > 0
      ? `<p class="note" style="text-align:center">▼ 往下捲動顯示其餘 <span class="px">${t}</span> 筆</p>`
      : "";
function bagScroll(t) {
  const a = t.target;
  if (
    "panel" === a.id &&
    "bag" === ui.tab &&
    ui.lstMore &&
    "items" !== ui.bagView &&
    a.scrollTop + a.clientHeight > a.scrollHeight - 200
  )
    return ((ui.lstN += 60), (ui.lstMore = !1), void ui.render());
  a.classList?.contains("bagScroll") &&
    ((ui.bagTop = a.scrollTop),
    bagHint(a),
    a.scrollTop + a.clientHeight > a.scrollHeight - 120 &&
      ui.bagN < bagList().length &&
      ((ui.bagN += 60), ui.render()));
}
function bagFill() {
  if ("bag" !== ui.tab) return;
  const t = $("#panel .bagScroll"),
    a = $("#panel");
  t &&
  t.scrollTop + t.clientHeight > t.scrollHeight - 120 &&
  ui.bagN < bagList().length
    ? ((ui.bagN += 60), ui.render())
    : !t &&
      ui.lstMore &&
      "items" !== ui.bagView &&
      a.scrollTop + a.clientHeight > a.scrollHeight - 200 &&
      ((ui.lstN += 60), (ui.lstMore = !1), ui.render());
}
function bagOpt() {
  const t = (S.set.bv ||= {});
  return (
    (t.s ??= "new"),
    (t.slot ??= ""),
    (t.r ??= -9),
    (t.rs ??= "new"),
    (t.rsl ??= ""),
    (t.rt ??= 9),
    (t.bulk ??= [1, 1, 0, 0]),
    (t.sh ??= [2, 3, 4, 5, 6]),
    (t.sm ??= ["d", "a"]),
    (t.kf ??= ""),
    (t.fg ??= { on: 1, c: [keepNew("any")] }),
    t
  );
}
const kfOk = (t, a = bagOpt()) =>
    "lk" === a.kf
      ? !!t.lk
      : "nolk" === a.kf
        ? !t.lk
        : "keep" === a.kf
          ? keepMatch(t)
          : "nokeep" === a.kf
            ? !keepMatch(t)
            : "cust" !== a.kf ||
              !a.fg.c.length ||
              keepGroup(t, { on: 1, c: a.fg.c }),
  KF_SEL = [
    ["", "不限規則"],
    ["keep", "符合保留規則"],
    ["nokeep", "不符合保留規則"],
    ["cust", "自訂條件"],
    ["lk", "已鎖定"],
    ["nolk", "未鎖定"],
  ],
  byRar = (t, a) =>
    rarKey(a) - rarKey(t) ||
    (t.uq && a.uq && t.uq !== a.uq
      ? UNIQUE[t.uq].n.localeCompare(UNIQUE[a.uq].n, "zh-Hant")
      : 0) ||
    a.ilvl - t.ilvl;
function bagList() {
  const t = bagOpt(),
    a = S.bag.filter(
      (a) => (!t.slot || a.slot === t.slot) && rarOk(a, t.r) && kfOk(a, t),
    );
  if ("new" === t.s) return a.reverse();
  if ("slot" === t.s)
    return a.sort(
      (t, a) => SLOTS.indexOf(t.slot) - SLOTS.indexOf(a.slot) || byRar(t, a),
    );
  if ("rar" === t.s) return a.sort(byRar);
  const s = {
      lvl: (t) => t.ilvl,
      dps: (t) => pvGet(t).dps,
      hp: (t) => pvGet(t).maxhp,
      arm: (t) => t.arm || 0,
      eva: (t) => t.eva || 0,
      base: (t) => baseQ(t),
    }[t.s],
    e = new Map(a.map((t) => [t, s(t)]));
  return a.sort((t, a) => e.get(a) - e.get(t));
}
const runeByTier = (t, a) =>
    runeT(t) - runeT(a) ||
    runeKind(t).localeCompare(runeKind(a)) ||
    (a.v || 0) - (t.v || 0),
  twSel = () => {
    const t = twCheck(S.tw.best),
      a = twFrom();
    return selHtml(
      "twf",
      Array.from({ length: (t - 1) / 10 + 1 }, (a, s) => [
        10 * s + 1 === t ? 0 : 10 * s + 1,
        `從第 ${10 * s + 1} 層`,
      ]),
      a === t ? 0 : a,
      "起始樓層",
      "rv",
    );
  },
  rSlotOk = (t, a) =>
    !a ||
    ("slate" === a
      ? !t.uq && isSlateAf(t.a)
      : t.uq
        ? UNIQUE[t.uq].slot === a
        : AFFIX[t.a].s.includes(a)),
  rTierOk = (t, a) => 9 === a || (a < 0 ? !!t.uq : !!t.uq || t.t <= a);
function runeList() {
  const t = bagOpt(),
    a = t.rs,
    s = S.runes.filter((a) => rSlotOk(a, t.rsl) && rTierOk(a, t.rt));
  return "new" === a
    ? s.reverse()
    : s.sort(
        "tier" === a
          ? runeByTier
          : (t, a) =>
              runeKind(t).localeCompare(runeKind(a)) || runeQ(a) - runeQ(t),
      );
}
const bulkList = () => {
    const t = bagOpt();
    return S.bag.filter(
      (a) =>
        !a.lk &&
        !a.my &&
        !a.mir &&
        !keepMatch(a) &&
        (a.sock
          ? t.bulk[5] && t.sh.includes(a.sock.n) && t.sm.includes(a.sock.mode)
          : a.uq
            ? t.bulk[4]
            : t.bulk[4 === a.rar ? 6 : a.rar]) &&
        (!t.slot || a.slot === t.slot) &&
        kfOk(a, t),
    );
  },
  selHtml = (t, a, s, e, n = "bv") =>
    `<select class="sel" data-${n}="${t}" aria-label="${e}">${a.map(([t, a]) => `<option value="${t}" ${t === s ? "selected" : ""}>${a}</option>`).join("")}</select>`,
  afNum = (t, a) => {
    const s = AFFIX[t].sc;
    return s ? (a / s).toFixed(Math.log10(s)) : a;
  },
  rngText = (t) => {
    const [a, s] = tierRange(t.a, t.t);
    return a === s ? "" : `(${afNum(t.a, a)}-${afNum(t.a, s)})`;
  },
  runeText = (t) =>
    t.uq ? `獨特 ${UNIQUE[t.uq].n}` : `T${t.t} ${AFFIX[t.a].f(t.v)}`,
  runeTag = (t) =>
    t.uq
      ? '<span class="tag" style="color:var(--ru)">獨特</span>'
      : `<span class="tag" style="color:${tierCol(t)}">T${t.t}</span>`,
  runeDesc = (t) =>
    t.uq ? `${UNIQUE[t.uq].n}：${uqText(t.uq)}` : AFFIX[t.a].f(t.v),
  runeT = (t) => (t.uq ? -1 : t.t),
  runeQ = (t) => (t.uq ? 2 : tierQ(t)),
  runeKind = (t) => (t.uq ? "~" + t.uq : t.a),
  sockFind = (t) =>
    S.bag.find((a) => a.u === t) || S.slates.find((a) => a.u === t),
  sockCap = (t) => (t.sl ? Math.min(t.sock.n, t.dg.length) : t.sock.n),
  ashTag = (t) =>
    `・<span class="px"${S.ash < t ? ' style="color:var(--bad)"' : ""}>${t}</span><img class="ashI" src="${shopIcon("ash")}" alt="Zeny" style="margin-left:2px">`,
  stgM = { S: null, u: null, it: null };
function isStaged(t) {
  if (null == ui.sockU) return !1;
  (stgM.S === S && stgM.u === ui.sockU) ||
    Object.assign(stgM, { S, u: ui.sockU, it: sockFind(ui.sockU) });
  const a = stgM.it;
  return !!(a && a.sock && a.sock.st.includes(t));
}
const ALCH_SORT = [
  ["new", "最新取得"],
  ["rar", "稀有度"],
  ["lvl", "物品等級"],
  ["slot", "部位"],
  ["tier", "詞綴階級"],
];
function alchOpt() {
  const t = (S.set.av ||= {});
  return ((t.s ??= "new"), (t.slot ??= ""), (t.r ??= -9), t);
}
const afQ = (t) =>
  t.af.length
    ? 10 * Math.max(...t.af.map(tierQ)) + t.af.reduce((t, a) => t + tierQ(a), 0)
    : 0;
function alchView(t) {
  const a = alchOpt(),
    s = (t) =>
      SLOTS.some((a) => S.equip[a] === t) || slatesPlaced().includes(t) ? 1 : 0;
  t = t.filter(
    (t) =>
      (!a.slot ||
        t.slot === a.slot ||
        ("gear" === a.slot && "slate" !== t.slot)) &&
      rarOk(t, a.r),
  );
  const e = (t) => ("slate" === t.slot ? 9 : SLOTS.indexOf(t.slot)),
    n = { rar: byRar, slot: (t, a) => e(t) - e(a) || byRar(t, a) }[a.s],
    l = { new: (t) => t.u, lvl: (t) => t.ilvl, tier: afQ }[a.s],
    o = l && new Map(t.map((t) => [t, l(t)]));
  return t.sort((t, a) => s(a) - s(t) || (n ? n(t, a) : o.get(a) - o.get(t)));
}
const SL_SORT = [
  ["new", "最新取得"],
  ["rar", "稀有度"],
  ["lvl", "物品等級"],
  ["dg", "危險度"],
  ["b", "種類"],
  ["h", "插槽孔數"],
];
function slOpt() {
  const t = (S.set.sv ||= {});
  return (
    (t.s ??= "new"),
    (t.b ??= -1),
    (t.r ??= -9),
    (t.bulk ??= [1, 0, 0, 0, 0]),
    (t.kf ??= ""),
    (t.fg ??= { on: 1, c: [keepNew("dg", 1)] }),
    t
  );
}
const slKfOk = (t) => {
    const a = slOpt();
    return "lk" === a.kf
      ? !!t.lk
      : "nolk" === a.kf
        ? !t.lk
        : "keep" === a.kf
          ? keepMatch(t, slSet().skeep)
          : "nokeep" === a.kf
            ? !keepMatch(t, slSet().skeep)
            : "cust" !== a.kf ||
              !a.fg.c.length ||
              keepGroup(t, { on: 1, c: a.fg.c });
  },
  slDg = (t) =>
    slK(t) *
    slLines(t).reduce(
      (t, a) => t + (AFFIX[a.a].dg ? AFFIX[a.a].dg(a.v) : 0),
      0,
    ),
  SL_KEY = {
    new: (t) => t.u,
    rar: (t) => 1e3 * t.rar + t.ilvl,
    lvl: (t) => t.ilvl,
    dg: slDg,
    b: (t) => 1e4 * -t.b + 1e3 * t.rar + t.ilvl,
    h: (t) => (t.sock ? 1e4 * t.sock.n : 0) + t.ilvl,
  },
  slRarOk = (t, a) => -9 === a || (t.sock || t.fused ? 6 : t.rar) === a,
  SL_RAR_F = RAR_F.filter(([t]) => t < 4 || 6 === t).map(([t, a]) => [
    t,
    -9 === t ? "全部稀有度" : a,
  ]);
function slateList(t = S.slates) {
  const a = slOpt(),
    s = SL_KEY[a.s];
  return t
    .filter((t) => (a.b < 0 || t.b === a.b) && slRarOk(t, a.r) && slKfOk(t))
    .sort((t, a) => s(a) - s(t));
}
const slBulk = () => {
    const t = slOpt();
    return S.slates.filter(
      (a) =>
        !a.lk &&
        !a.my &&
        !a.mir &&
        t.bulk[a.sock ? 4 : a.rar] &&
        (t.b < 0 || a.b === t.b) &&
        !keepMatch(a, slSet().skeep),
    );
  },
  slFilt = () => {
    const t = slOpt();
    return `<div class="row filt">${selHtml("s", SL_SORT, t.s, "石板排序", "sv")}${selHtml("b", [[-1, "全部種類"], ...SLATE.map((t, a) => [a, t.n])], t.b, "種類篩選", "sv")}${selHtml("r", SL_RAR_F, t.r, "稀有度篩選", "sv")}${selHtml("kf", KF_SEL, t.kf, "規則篩選", "sv")}</div>${"cust" === t.kf ? filtBox("z") : ""}`;
  },
  KEEP_MAXG = 12,
  KEEP_MAXC = 8,
  KEEP_DEF = {
    any: { t: 3 },
    af: { a: "life", t: 3, v: 0 },
    cnt: { n: 2, t: 3, a: [] },
    rar: { r: 3 },
    slot: { s: ["ring", "amulet"] },
    lv: { l: 60 },
    q: { q: 80 },
    uq: { u: [] },
    sock: { h: [2, 3, 4, 5, 6] },
    b: { b: [0] },
    dg: { d: 20, ge: 1 },
    rsl: {},
  },
  keepNew = (t, a) => {
    const s = { k: t, ...JSON.parse(JSON.stringify(KEEP_DEF[t])) };
    return (!0 === a && "af" === t && (s.a = "sl_sock"), s);
  },
  KEEP_AF = GEAR_AF.map((t) => [t, AFFIX[t].n]),
  KEEP_AF_SL = Object.keys(AFFIX)
    .filter((t) => "slate" === AFFIX[t].s[0])
    .map((t) => [t, AFFIX[t].n]),
  KEEP_AF_RN = [...KEEP_AF, ...KEEP_AF_SL],
  krMode = (t) => ("r" === t || "U" === t ? "r" : "syzT".includes(t || "-")),
  ST_KR = { bag: "S", slates: "T", runes: "U" },
  stFg = (t) => {
    const a = { S: "bag", T: "slates", U: "runes" }[t],
      s = ((ui.stF ||= {})[a] ||= {});
    return (s.fg ||= {
      on: 1,
      c: [keepNew("U" === t ? "af" : "T" === t ? "dg" : "any", krMode(t))],
    });
  },
  rnKeep = () => (S.set.rkeep ||= []),
  uqImg = (t) => {
    const a = UNIQUE[t],
      s =
        uqIcon(t) ||
        ("weapon" === a.slot ? ICON_SET.weapon.sword[3] : ICON_SET[a.slot][3]);
    return `<img class="uqi" src="${a.my ? mythURL(s) : iconURL(s)}" alt="">`;
  };
function ukOpen(t) {
  t && (ui.ukOn = t);
  const a = ui.ukOn,
    s = keepR({ dataset: { kr: a.kr } })[a.g],
    e = s && s.c[a.c];
  if (!e) return void ukClose();
  const n = e.u || [],
    l = $("#sheet"),
    o = "hlp ukp" === l.className ? l.scrollTop : 0;
  ((l.className = "hlp ukp"),
    (l.innerHTML = `<h2 class="cfh">指定獨特</h2><div class="hlist">${SLOTS.map(
      (t) => {
        const a = Object.keys(UNIQUE).filter(
          (a) => UNIQUE[a].slot === t && !UNIQUE[a].my && !UNIQUE[a].retired,
        );
        return a.length
          ? `<div class="hsec">${SLOT_NAME[t]}</div>` +
              a
                .map(
                  (t) =>
                    `<button class="hpt ukr" data-act="ukT" data-k="${t}" aria-pressed="${n.includes(t)}">${uqImg(t)}<div><b>${UNIQUE[t].n}</b>${fitLines(
                      hLines(uqText(t), HL_W - 3),
                      HL_W - 3,
                    )
                      .map((t) => `<span>${t}</span>`)
                      .join("")}</div></button>`,
                )
                .join("")
          : "";
      },
    ).join(
      "",
    )}</div>\n    <div class="row"><span class="note">已選 <span class="px">${n.length}</span> 件</span><span class="spacer"></span><button class="btn primary" data-act="ukDone">完成</button></div>`),
    ($("#sheetBg").hidden = !1),
    (l.scrollTop = o));
}
function ukClose() {
  const t = ui.ukOn;
  ((ui.ukOn = null),
    t && "xy".includes(t.kr || "-") && ui.bxOn
      ? ui.bxOpen()
      : (($("#sheetBg").hidden = !0),
        ($("#sheet").className = ""),
        ui.render()));
}
function ukAct(t) {
  const a = t && t.dataset.act;
  if ("ukT" === a) {
    const a = ui.ukOn,
      s = keepR({ dataset: { kr: a.kr } })[a.g]?.c[a.c];
    if (s) {
      const e = t.dataset.k;
      ((s.u = (s.u ||= []).includes(e)
        ? s.u.filter((t) => t !== e)
        : [...s.u, e]),
        a.kr && ((ui.bagN = 0), (ui.bagTop = 0)),
        markDirty());
    }
    ukOpen();
  } else ("ukDone" !== a && t) || ukClose();
}
const KEEP_RAR = ["普通", "魔法", "稀有", "傳奇", "神話", "獨特・插槽"],
  KEEP_RAR_SL = ["普通", "魔法", "稀有", "傳奇", "插槽石板"],
  slSet = () => {
    const t = S.set;
    return ((t.sauto ||= [0, 0, 0, 0, 0]), (t.skeep ||= []), t);
  };
function keepSel(t, a, s, e, n, l, o = "") {
  return `<select class="sel ${o}" data-kf="${t}" data-g="${a}" data-c="${s}" aria-label="${l}">${e.map(([t, a]) => `<option value="${t}" ${String(t) === String(n) ? "selected" : ""}>${a}</option>`).join("")}</select>`;
}
const keepTiers = (t) =>
  Array.from({ length: t + 1 }, (t, a) => [a, `T${a} 以上`]);
function keepRow(t, a, s, e) {
  const n = "r" === e,
    l = n ? KEEP_AF_RN : e ? KEEP_AF_SL : KEEP_AF,
    o = (t, e, n, l, o) => keepSel(t, a, s, e, n, l, o),
    r = (t, e, n, l) =>
      `<input type="number" class="num" inputmode="numeric" min="0" max="999" data-kf="${t}" data-g="${a}" data-c="${s}" value="${e || ""}" placeholder="${n}" aria-label="${l}">`;
  let i = "";
  switch (t.k) {
    case "any":
      i = o("t", keepTiers(12), t.t, "階級");
      break;
    case "af":
      i =
        o("a", l, t.a, "詞綴") +
        o("t", keepTiers(tierN(t.a)), Math.min(t.t, tierN(t.a)), "階級") +
        `<span class="kge"><span class="ge">數值 ≥</span>${r("v", t.v, "不限", "數值至少")}</span>`;
      break;
    case "cnt":
      i =
        (n
          ? ""
          : '<span class="ge">至少</span>' +
            o(
              "n",
              [1, 2, 3].map((t) => [t, t + " 條"]),
              t.n,
              "條數",
              "w4",
            )) +
        o("t", keepTiers(12), t.t, "階級") +
        `<div class="ktags">${t.a.length ? t.a.map((t) => `<button class="tag kt" data-act="kcaf" data-g="${a}" data-c="${s}" data-v="${t}" aria-label="移除 ${AFFIX[t].n}">${AFFIX[t].n} ✕</button>`).join("") : '<span class="note">任意詞綴</span>'}` +
        o(
          "aadd",
          [["", "＋ 限定詞綴"], ...l.filter(([a]) => !t.a.includes(a))],
          "",
          "加入詞綴",
          "add",
        ) +
        "</div>";
      break;
    case "rar":
      i =
        '<span class="ge">≥</span>' +
        o(
          "r",
          (e ? KEEP_RAR_SL : KEEP_RAR).map((t, a) => [a, t]),
          t.r,
          "稀有度",
        );
      break;
    case "b":
      i = `<div class="ktags">${SLATE.map((e, n) => `<button class="btn sm ks" data-act="kslb" data-g="${a}" data-c="${s}" data-v="${n}" aria-pressed="${t.b.includes(n)}">${e.n}</button>`).join("")}</div>`;
      break;
    case "dg":
      i =
        `<span class="ge">${t.ge ? "≥" : "≤"}</span>` +
        r("d", t.d, "危險度", t.ge ? "危險度至少" : "危險度至多");
      break;
    case "sock":
      i = `<div class="ktags"><span class="ge">孔數</span>${(e ? [2, 3, 4] : [2, 3, 4, 5, 6]).map((e) => `<button class="btn sm ks" data-act="ksh" data-g="${a}" data-c="${s}" data-v="${e}" aria-pressed="${!t.h || t.h.includes(e)}">${e} 孔</button>`).join("")}</div>${e ? "" : `<div class="ktags"><span class="ge">種類</span>${SOCK_M.map(([e, n]) => `<button class="btn sm ks" data-act="ksm" data-g="${a}" data-c="${s}" data-v="${e}" aria-pressed="${!t.m || t.m.includes(e)}">${n}</button>`).join("")}</div>`}`;
      break;
    case "slot":
      i = `<div class="ktags">${SLOTS.map((e) => `<button class="btn sm ks" data-act="kslot" data-g="${a}" data-c="${s}" data-v="${e}" aria-pressed="${t.s.includes(e)}">${SLOT_NAME[e]}</button>`).join("")}</div>`;
      break;
    case "lv":
      i = '<span class="ge">≥</span>' + r("l", t.l, "等級", "物品等級至少");
      break;
    case "q":
      i =
        '<span class="ge">≥</span>' +
        r("q", t.q, "品質", "基底品質至少") +
        '<span class="ge">%</span>';
      break;
    case "uq":
      i = `<div class="ktags">${(t.u || []).map((t) => `<button class="tag kt" data-act="kcuq" data-g="${a}" data-c="${s}" data-v="${t}" aria-label="移除 ${UNIQUE[t].n}">${uqImg(t)}${UNIQUE[t].n} ✕</button>`).join("") || '<span class="note">任意獨特</span>'}<button class="btn sm add" data-act="kuq" data-g="${a}" data-c="${s}">＋ 指定獨特</button></div>`;
      break;
  }
  return `<div class="kc"><button class="btn sm knot" data-act="knot" data-g="${a}" data-c="${s}" aria-pressed="${!!t.not}" aria-label="非：反轉這個條件">非</button>${o("k", Object.entries(n ? KEEP_K_RN : e ? KEEP_K_SL : KEEP_K), t.k, "條件種類", "kk")}<div class="kpar">${i}</div><button class="btn sm kx" data-act="kcdel" data-g="${a}" data-c="${s}" aria-label="刪除條件">✕</button></div>`;
}
function keepBox(t) {
  const a = "r" === t,
    s = a ? rnKeep() : t ? slSet().skeep : S.set.keep,
    e = a ? S.runes : t ? S.slates : S.bag,
    n = a ? "顆" : t ? "塊" : "件",
    l = s
      .map((s, l) => {
        const o =
          s.on && s.c.length ? e.filter((t) => keepGroup(t, s)).length : 0;
        return `${l ? '<div class="kor">或</div>' : ""}<div class="kg${s.on ? "" : " off"}">\n      <div class="row kgh"><label class="chk"><input type="checkbox" data-act="kon" data-g="${l}" ${s.on ? "checked" : ""}><span>規則 <span class="px">${l + 1}</span></span></label><span class="note">${a ? "符文" : t ? "石板" : "背包"}符合 <span class="px">${o}</span> ${n}</span><span class="spacer"></span>\n      <button class="btn sm" data-act="kdel" data-g="${l}">刪除</button></div>\n      ${s.c.map((a, s) => (s ? '<div class="kand">且</div>' : "") + keepRow(a, l, s, t)).join("") || '<p class="note" style="margin:0">還沒有條件。</p>'}\n      ${s.c.length < KEEP_MAXC ? `<button class="btn sm" data-act="kadd" data-g="${l}">＋ 條件</button>` : ""}</div>`;
      })
      .join(""),
    o = e.filter((t) => keepMatch(t, s)).length,
    r = `<div class="box stack"><div class="row"><span class="note">符合任一規則即不會被${a ? "" : "自動"}分解（共 <span class="px">${o}</span> ${n}）</span>${helpBtn("keep")}</div>\n    ${S.kpS ? "" : '<div class="row"><span class="note">此角色使用自己的保留規則</span><span class="spacer"></span><button class="btn sm" data-act="kpSync">同步</button></div>'}\n    ${l || '<p class="note" style="margin:0">還沒有規則。</p>'}\n    ${s.length < 12 ? '<button class="btn" data-act="kgadd">＋ 新增規則</button>' : ""}</div>`,
    i = a ? "r" : "s";
  return t
    ? r
        .replace(/data-act="k/g, `data-kr="${i}" data-act="k`)
        .replace(/data-kf="/g, `data-kr="${i}" data-kf="`)
    : r;
}
function xrBox() {
  const t = !!ui.bxSl,
    a = bxR(),
    s = bxL().filter(canAlch),
    e = t ? "y" : "x",
    n = t ? "塊" : "件",
    l = a
      .map((a, e) => {
        const l =
          a.on && a.c.length ? s.filter((t) => keepGroup(t, a)).length : 0;
        return `${e ? '<div class="kor">或</div>' : ""}<div class="kg${a.on ? "" : " off"}">\n      <div class="row kgh"><label class="chk"><input type="checkbox" data-act="kon" data-g="${e}" ${a.on ? "checked" : ""}><span>規則 <span class="px">${e + 1}</span></span></label><span class="note">符合 <span class="px">${l}</span> ${n}</span><span class="spacer"></span>\n      <button class="btn sm" data-act="kdel" data-g="${e}">刪除</button></div>\n      ${a.c.map((a, s) => (s ? '<div class="kand">且</div>' : "") + keepRow(a, e, s, t)).join("") || '<p class="note" style="margin:0">還沒有條件。</p>'}\n      ${a.c.length < KEEP_MAXC ? `<button class="btn sm" data-act="kadd" data-g="${e}">＋ 條件</button>` : ""}</div>`;
      })
      .join("");
  return `<div class="box stack"><span class="note">符合任一規則的${t ? "石板" : "裝備"}會被萃取</span>\n    ${l || '<p class="note" style="margin:0">還沒有規則。</p>'}\n    ${a.length < 12 ? '<button class="btn" data-act="kgadd">＋ 新增規則</button>' : ""}</div>`
    .replace(/data-act="k/g, `data-kr="${e}" data-act="k`)
    .replace(/data-kf="/g, `data-kr="${e}" data-kf="`);
}
const keepR = (t) =>
  "s" === t.dataset.kr
    ? slSet().skeep
    : "r" === t.dataset.kr
      ? rnKeep()
      : "z" === t.dataset.kr
        ? [slOpt().fg]
        : "x" === t.dataset.kr
          ? xrSet()
          : "y" === t.dataset.kr
            ? sxrSet()
            : t.dataset.kr
              ? [
                  "STU".includes(t.dataset.kr)
                    ? stFg(t.dataset.kr)
                    : bagOpt().fg,
                ]
              : S.set.keep;
function filtBox(t = "f") {
  const a = keepR({ dataset: { kr: t } })[0],
    s = krMode(t);
  return `<div class="box stack" style="margin-bottom:10px"><div class="row"><span class="note">條件全部符合才顯示</span><span class="spacer"></span>${a.c.length ? `<button class="btn sm" data-act="kfclr" data-kr="${t}">清除</button>` : ""}</div>\n    ${a.c.map((a, e) => (e ? '<div class="kand">且</div>' : "") + keepRow(a, 0, e, s).replace(/data-g=/g, `data-kr="${t}" data-g=`)).join("") || '<p class="note" style="margin:0">沒有條件，顯示全部。</p>'}\n    ${a.c.length < KEEP_MAXC ? `<button class="btn sm" data-act="kadd" data-kr="${t}" data-g="0" style="align-self:flex-start">＋ 條件</button>` : ""}</div>`;
}
function keepAct(t, a) {
  const s = keepR(a),
    e = s[+a.dataset.g],
    n = e && e.c[+a.dataset.c],
    l = krMode(a.dataset.kr);
  switch (t) {
    case "kgadd":
      s.push({ on: 1, c: [keepNew("any", l)] });
      break;
    case "kon":
      e && (e.on = a.checked ? 1 : 0);
      break;
    case "kdel":
      return (
        (ui.confirm = "kdel" + a.dataset.g),
        (ui.cfKr = a.dataset.kr || ""),
        !0
      );
    case "kdelYes":
      (s.splice(+a.dataset.g, 1), (ui.confirm = null));
      break;
    case "kadd":
      e && e.c.push(keepNew("r" === l ? "af" : "rar", l));
      break;
    case "kcdel":
      e && e.c.splice(+a.dataset.c, 1);
      break;
    case "knot":
      n && (n.not = n.not ? 0 : 1);
      break;
    case "kslb":
      if (n) {
        const t = +a.dataset.v;
        n.b = n.b.includes(t) ? n.b.filter((a) => a !== t) : [...n.b, t];
      }
      break;
    case "ksh":
      if (n) {
        const t = +a.dataset.v,
          s = n.h || [2, 3, 4, 5, 6];
        n.h = s.includes(t) ? s.filter((a) => a !== t) : [...s, t].sort();
      }
      break;
    case "ksm":
      if (n) {
        const t = a.dataset.v,
          s = n.m || ["d", "a"];
        n.m = s.includes(t) ? s.filter((a) => a !== t) : [...s, t];
      }
      break;
    case "kslot":
      if (n) {
        const t = a.dataset.v;
        n.s = n.s.includes(t) ? n.s.filter((a) => a !== t) : [...n.s, t];
      }
      break;
    case "kcaf":
      n && (n.a = n.a.filter((t) => t !== a.dataset.v));
      break;
    case "kcuq":
      n && (n.u = (n.u || []).filter((t) => t !== a.dataset.v));
      break;
    case "kuq":
      return (
        n &&
          ukOpen({ kr: a.dataset.kr || "", g: +a.dataset.g, c: +a.dataset.c }),
        !0
      );
    case "kpSync":
      return (kpOpen(), !0);
    case "kfclr":
      s[0].c = [];
      break;
    default:
      return !1;
  }
  return (a.dataset.kr && ((ui.bagN = 0), (ui.bagTop = 0)), markDirty(), !0);
}
function keepChange(t) {
  const a = keepR(t)[+t.dataset.g],
    s = +t.dataset.c,
    e = t.dataset.kf;
  if (!a || !a.c[s]) return;
  const n = a.c[s],
    l = t.value;
  ("k" === e
    ? (a.c[s] = {
        ...keepNew(l, krMode(t.dataset.kr)),
        ...(n.not ? { not: 1 } : {}),
      })
    : "a" === e
      ? ((n.a = l), (n.t = Math.min(n.t, tierN(l))))
      : "aadd" === e
        ? l && !n.a.includes(l) && n.a.push(l)
        : (n[e] = clamp(Math.floor(+l) || 0, 0, 999)),
    t.dataset.kr && ((ui.bagN = 0), (ui.bagTop = 0)),
    markDirty());
}
const HELP = {
    save: [
      "存檔備份",
      [
        ["存檔", "存檔儲存於此瀏覽器；清除瀏覽資料或更換手機後將會遺失。"],
        ["雲端", "綁定 Google 後，所有角色會備份到雲端。"],
        ["自動上傳", "每 5 分鐘一次，離開遊戲時也會上傳。"],
        ["換裝置", "在新裝置綁定同一個 Google 帳號，選「載入雲端」。"],
        ["一次一台", "同一個帳號同時只能在一台裝置上遊玩。"],
        [
          "換手玩",
          "在新裝置開始遊戲後，舊裝置將暫停；返回舊裝置時，點選「在這裡繼續」。",
        ],
        ["較新的進度", "雲端有其他裝置的較新進度時，可選擇保留哪一份。"],
        [
          "App 內開啟",
          "在 Threads、LINE 內開啟時無法登入 Google；請改用 Chrome 或 Safari。",
        ],
      ],
    ],
    rank: [
      "排行榜",
      [
        ["上榜", "無盡之塔的最高層數會自動上傳，並以角色名稱顯示。"],
        ["名次", "層數越高，排名越前；層數相同時，先達成者在前。"],
        ["改名", "可在角色分頁的「切換角色」中改名，排行榜會同步更新。"],
        ["審核", "上傳的層數會依時間與塔內實測 DPS 審核。"],
        ["榜上層數", "低於最高層數時，每次挑戰結束後會重新上傳。"],
        [
          "榜上資料",
          "職業、等級與轉職分支，為刷新紀錄當下的狀態；名稱會隨時同步。",
        ],
        ["構築快照", "刷新紀錄時，一併上傳當下的裝備、技能拼圖與天賦。"],
        ["查看構築", "點選排行榜上有「▸」的玩家，即可查看其構築快照。"],
        ["不公開", "勾選「不公開我的構築快照」後，其他玩家無法查看你的構築。"],
        ["屬性", "快照的「屬性」頁為刷新紀錄當下的角色面板數值。"],
      ],
    ],
    trn: [
      "訓練場",
      [
        ["用途", "對訓練假人測試構築的實際傷害。"],
        ["獎勵", "沒有經驗與掉落；不計入卡牌與任務。"],
        ["假人", "不會走動。"],
        ["攻擊", "設為「會攻擊」時，假人在原地向角色發射彈幕。"],
        ["彈幕傷害", "與同等級、同類型的怪物相同。"],
        ["陣亡", "照常陣亡並原地復活，不計入陣亡統計。"],
        ["位置", "可推動：會被擊退、拉扯，不會走回原位。"],
        ["類型", "菁英、Boss 適用「對菁英」「對 Boss」等加成。"],
        ["不死", "生命不會減少，可長時間測試。"],
        ["會死亡", "生命與同等級的怪物相同；死亡後依設定重生。"],
        ["自動挑戰", "在訓練場內不會自動挑戰 Boss 與無盡之塔。"],
        ["離線收益", "訓練時間不影響擊殺速度。"],
        ["設定", "進入後在此設定假人，隨時可改。"],
        ["統計", "戰鬥畫面左下顯示 DPS；點一下切換頁面。"],
        ["完整清單", "戰鬥畫面只顯示前 6 項；全部項目列在本頁下方。"],
        ["傷害來源", "各技能、普攻、召喚物與持續傷害的佔比與 DPS。"],
        ["擊中次數", "各來源每秒擊中假人的次數；持續傷害不計。"],
        ["增傷效果", "條件增傷與暴擊的平均倍率與觸發率。"],
        ["平均倍率", "未觸發的擊中算 ×1。"],
        ["重置", "點「重置統計」或變更假人設定時，統計重新計算。"],
      ],
    ],
    stash: [
      "共用倉庫",
      [
        ["共用", "同一裝置的所有角色共用一個倉庫。"],
        ["可存放", "裝備、符文石、石板與技能寶石。"],
        ["Zeny與材料", "所有角色共用，不必存入。"],
        ["上限", "最多 500 件。"],
        ["存入", "倉庫頁切到「身上」，或在背包詳細資訊點「存入倉庫」。"],
        ["多選", "倉庫頁或背包按「多選」，可一次存入或取出多件。"],
        ["職業限定", "武器與職業寶石只能由同職業的角色取出。"],
        ["等級需求", "取出的裝備照常需要等級。"],
        ["不可存放", "身上裝備與已放置的寶石。"],
        ["戰鬥中", "挑戰 Boss 或無盡之塔時無法存取。"],
      ],
    ],
    off: [
      "離線收益",
      [
        ["§時機"],
        ["開始", "關閉遊戲或手機切到背景時開始計算。"],
        ["電腦背景", "電腦切到其他分頁或縮小視窗時，戰鬥照常進行，不算離線。"],
        ["短暫離開", "60 秒內回來會快轉補上，不算離線。"],
        ["時間上限", "每次最多計算 8 小時。"],
        ["其他角色", "未使用的角色只累積經驗，沒有掉落。"],
        ["領取", "切換回該角色時領取。"],
        ["§經驗"],
        ["擊殺速度", "依最近的擊殺速度計算；上限每分鐘 250 隻。"],
        ["效率", "經驗為線上的 75%。"],
        ["等級上限", "最多升到所在地圖的最高等級。"],
        ["不設上限", "最後一張地圖、放置石板的地圖與活動地圖。"],
        ["Lv127", "帳號已有 Lv127 角色時，經驗 100%；不設等級上限。"],
        ["神器", "離線擊殺不累積神器經驗。"],
        ["§掉落"],
        ["效率", "掉落次數為線上的 25%。"],
        ["其他角色", "未使用的角色沒有離線掉落。"],
        ["掉落表", "與線上相同；包含石板、印記與寶石。"],
        ["主宰", "離線時不會掉落。"],
        ["怪物卡牌", "離線擊殺不計入卡牌進度。"],
        ["自動分解", "依拾取篩選自動分解。"],
        ["背包", "獨特、插槽、傳奇優先放入；背包已滿時，其餘分解為Zeny。"],
      ],
    ],
    chars: [
      "角色",
      [
        ["多角色", "最多可建立 5 個角色。"],
        ["共用", "Zeny、材料與卡牌進度由所有角色共用。"],
        ["獨立", "身上物品與地圖進度各角色獨立。"],
        ["共用倉庫", "選單「倉庫」可在角色之間轉移物品。"],
        [
          "切換",
          "在「切換角色」選擇要使用的角色。挑戰 Boss、守護者或無盡之塔時不能切換。",
        ],
        ["離線收益", "未使用的角色只累積離線經驗，沒有掉落。"],
        ["領取", "切換回該角色時領取，上限 8 小時。"],
        ["名稱", "1～8 個字，不可與自己的其他角色同名。"],
      ],
    ],
    asc: [
      "轉職",
      [
        ["試煉", "地圖分頁上方的轉職試煉，30、45、60、75 級各一場。"],
        ["分支", "通過第一場試煉後，選擇一個分支。"],
        ["天賦點", "每場試煉獲得 2 點，每個天賦消耗 2 點。"],
        ["解鎖", "習得上一排任一天賦後，才會開放下一排。"],
        ["重置天賦點", "消耗 150 Zeny，返還全部天賦點，分支不變。"],
        ["重置職業", "消耗 300 Zeny，返還全部天賦點並重新選擇分支。"],
      ],
    ],
    char: [
      "角色",
      [
        ["裝備", "點選裝備格可前往背包查看詳細資訊。"],
        [
          "普攻傷害",
          "每秒傷害 = 武器傷害 × 武器攻速，再乘上攻速加成 × 行動速度。",
        ],
        [
          "行動速度",
          "加快攻擊、移動與技能的出手動作。技能出手最多加快 3 倍，效果出現的時機一起提早。",
        ],
        [
          "技能傷害",
          "每次命中 = 武器傷害 × 技能倍率；再乘上 1 + 傷害增加 + 技能傷害；連結輔助的傷害加成另外相乘；暴擊時乘上暴擊傷害。",
        ],
        [
          "召喚物傷害",
          "每發 = 武器傷害 × 技能說明的 %；再乘上 1 + 傷害增加 + 召喚物傷害；不受技能傷害影響；預設不使用角色的暴擊率。",
        ],
        ["預估 DPS", "普攻與技能傷害的總和，技能依冷卻時間平均計算。"],
      ],
    ],
    runes: [
      "符文石",
      [
        [
          "自動分解",
          "萃取出的符文石若符合階級條件，將直接分解為Zeny。裝備符文與石板符文分開設定。獨特效果的符文石不會被分解。",
        ],
        [
          "批次分解",
          "一次分解選定階級以下的符文石。裝備符文與石板符文分開設定。已放入插槽但尚未鑲嵌的不會被分解。",
        ],
        [
          "保留規則",
          "符合保留規則的符文石不會被自動分解或批次分解。條件寫法與裝備的保留規則相同。",
        ],
      ],
    ],
    bag: [
      "背包",
      [
        [
          "拾取篩選",
          "勾選的稀有度在拾取時自動分解為Zeny。也可勾選插槽、神話裝備。主宰不會分解。",
        ],
        ["批次分解", "依勾選的稀有度和上方的部位、規則篩選，一次分解。"],
        [
          "多選",
          "點選多件裝備，再一次分解、萃取、鎖定或解鎖。全選會選取目前篩選的全部裝備。",
        ],
        [
          "不會被分解",
          "鎖定的裝備不會被分解；傳奇、獨特、插槽裝備需另行勾選。",
        ],
        ["插槽孔數", "勾選插槽後，可選擇要分解的插槽孔數。"],
        ["插槽種類", "勾選插槽後，可選擇要分解異種或任意。"],
        ["保留規則", "符合規則的裝備，拾取篩選與批次分解皆會略過。"],
        [
          "規則篩選",
          "可只顯示符合或不符合保留規則的裝備。或選擇「自訂條件」設定臨時條件。",
        ],
      ],
    ],
    keep: [
      "保留規則",
      [
        ["一條規則", "規則內的條件全部符合，才視為符合此規則。"],
        ["非", "點選條件左側的「非」可反轉條件，不符合時才成立。"],
        ["多條規則", "符合任一規則即保留。"],
        [
          "帳號共用",
          "保留規則所有角色共用。在任一角色修改，其他角色也會套用。",
        ],
        ["同步", "有自己規則的舊角色，可選擇是否改用共用規則。"],
        ["階級", "「T3 以上」包含 T3、T2、T1、T0。每種詞綴的階數不同。"],
        ["詞綴計數", "至少 N 條詞綴達到指定階級；可限定計算的詞綴。"],
        ["指定獨特", "「獨特」條件可指定裝備，僅計算已選取的獨特裝備。"],
        [
          "只留想要的獨特",
          "拾取篩選勾選獨特，再新增一條「獨特」規則並指定裝備。",
        ],
        ["保留標記", "符合規則的裝備，格子右上角會顯示金色書籤。"],
      ],
    ],
    season: [
      "活動・諸神黃昏",
      [
        ["§進入"],
        [
          "開放",
          `${SEASON.lv} 級以上可前往「${MAPS[SS_MAP].n}」，怪物固定 ${SEASON.lv} 級，可放置石板。`,
        ],
        ["§挑戰"],
        [
          "神之碎片",
          `雷靈、海妖、冥魂各有 ${100 * SS.frag}% 機率，掉落雷神索爾、海神、闇答萊屍的碎片。`,
        ],
        [
          "巴風特",
          `消耗 ${SS.fragN} 片同一位神的碎片，可挑戰一次祂的化身。每位化身招式不同；失敗不退還碎片。`,
        ],
        [
          "自動挑戰",
          "勾選化身的「自動」，碎片足夠時自動挑戰。多位勾選時，優先挑戰碎片最多的一位。失敗後等待 2 分鐘再挑戰。",
        ],
        ["§獎勵"],
        ["活動獨特", "六件活動獨特裝備只在這張地圖掉落。"],
        ["神器", `擊敗巴風特時，有 ${100 * SS.art}% 機率掉落祂的神器。`],
        ["活動結束", "活動結束後地圖關閉，裝備與神器皆會保留。"],
      ],
    ],
    art: [
      "神器",
      [
        ["裝備", "在角色分頁點選神器即可裝備，同時只能裝備一件。"],
        ["升級", `裝備神器時擊殺怪物可獲得經驗，最高 ${ART.max} 級。`],
        [
          "進化",
          `${ART_LV[1]} 級進化、${ART_LV[2]} 級覺醒，效果提升並新增一項能力。`,
        ],
        ["重複", `再次掉落已有的神器時，自動獻祭為 ${ART.dup} 經驗。`],
      ],
    ],
    bld: [
      "構築",
      [
        [
          "一鍵切換",
          "構築 1～3 各自保存一整套：技能拼圖、裝備、轉職分支、天賦與神器。點選即可整套切換。",
        ],
        ["免費", "切換構築不消耗Zeny。重置天賦點、重置職業僅影響目前的構築。"],
        ["新構築", "首次切換至空白構築時，會複製目前的構築，可再自行調整。"],
        ["複製", "可將目前構築的裝備或技能拼圖，複製到其他構築。"],
        ["改名", "再點一次目前的構築，可為它命名。"],
        [
          "裝備",
          "卸下但其他構築仍在使用的裝備會自動鎖定，不會被分解。已分解或萃取的裝備，對應欄位會留空。",
        ],
      ],
    ],
    skill: [
      "技能拼圖",
      [
        ["§操作"],
        ["拿起寶石", "點選寶石拿起，再點選格子放下；也可按住直接拖曳。"],
        [
          "旋轉、取下",
          "拿起時可按「旋轉」、R 或滾輪旋轉；移至格子下方即可取下。",
        ],
        [
          "交換寶石",
          "放到另一顆寶石上會互換：放下新寶石，拿起舊寶石。覆蓋兩顆以上時無法放置。",
        ],
        ["清空", "「清空」一次取下格子中全部寶石。"],
        ["更多格子", "每升 3 級開放 1 格。"],
        ["§寶石規則"],
        ["主動寶石", "冷卻結束後自動施放。"],
        [
          "輔助寶石",
          "僅強化上下左右相鄰的主動寶石。標籤須相符：範圍、投射物、元素等。",
        ],
        ["元素標籤", "施加燃燒、冰緩或感電的技能帶有元素標籤。召喚元素精靈也算。"],
        [
          "同名主動",
          "同種主動寶石可放置多顆，各自冷卻、各自施放。同名的持續與光環技能僅計算一顆。",
        ],
        [
          "同名輔助",
          "同種輔助寶石也可放置多顆，相鄰效果會疊加。範圍增加相加，減少相乘。冷卻縮減上限 70%。",
        ],
        [
          "額外施放",
          "連續射擊與二刀連擊可疊加，沒有上限。用於召喚技能時，召喚物每次攻擊會多攻擊（60% 傷害）。",
        ],
        ["§特殊效果"],
        [
          "流血",
          `大地之擊使敵人流血：每秒受到此次傷害的 ${100 * AIL.bld.v}%，持續 ${AIL.bld.t} 秒。敵人移動時（含擊退）流血傷害 ×${AIL.bld.mv}。`,
        ],
        [
          "自動念咒",
          `連結「自動念咒」的主動寶石不會自動施放，改為暴擊時施放（每顆每 ${TRIG.cd} 秒最多一次，傷害 ×${100 * TRIG.k}%）。暴擊率越高，觸發越頻繁。`,
        ],
        [
          "定身",
          `定位陷阱命中的敵人定身 ${TRAP.root} 秒：無法移動，但仍會攻擊身旁的你。`,
        ],
        [
          "變異寶石",
          "由石板詞綴「變異寶石」掉落。效果與原寶石相同，但形狀不同，格數可能增減。",
        ],
        [
          "合成",
          `消耗 ${MUT.fn} 顆同技能的變異寶石與 ${MUT.fc} Zeny，合成 1 顆該技能的變異寶石。形狀重新隨機。於「未放置的寶石」展開該技能，按「合成」。`,
        ],
        [
          "穿梭寶石",
          "為其他職業的輔助寶石，外框銀白。可連結你職業的主動寶石。Lv90 的菁英與頭目極少量掉落，石板詞綴「穿梭寶石」也會掉落。",
        ],
        [
          "分解寶石",
          `於「未放置的寶石」按「分解寶石」，可一次選取多顆。每顆獲得 ${MUT.ash} Zeny。傳說、穿梭寶石也可以分解。`,
        ],
        [
          "精靈模式",
          "於技能頁切換召喚元素精靈的模式。侵略：各自追擊最近的怪物。守護：優先攻擊離你最近的敵人。",
        ],
        [
          "召喚物傷害",
          "召喚物受「傷害增加」與「召喚物傷害」加成，不受「技能傷害」加成。",
        ],
        [
          "英靈召喚",
          "周圍的敵人改為攻擊英靈。頭目的技能仍以你為目標。英靈使用你的護甲、閃避與生命回復。",
        ],
        [
          "冰緩",
          "降低敵人的移動與攻擊速度，效果上限 75%。菁英詞綴的攻擊也會變慢。",
        ],
        ["§中毒"],
        [
          "中毒",
          `擊中使敵人中毒 ${PSN_T} 秒。每秒造成該次擊中傷害的 ${100 * PSN_K}%，再套用中毒傷害加成。`,
        ],
        [
          "層數",
          `每層各自計時 ${PSN_T} 秒，同時倒數。每秒將所有層的傷害合計，一次造成。層數上限依這次擊中而定：基礎 1 層，毒疊天賦與致命塗毒可提高。`,
        ],
        ["未達上限", "新的中毒增加 1 層。"],
        [
          "已達上限",
          `刷新傷害最低的 1 層：重新計時 ${PSN_T} 秒，傷害取兩者較高者。其餘各層不受影響，時間到即消失。`,
        ],
        [
          "上限不同",
          "上限較低的擊中不會減少層數。例：敵人身上 6 層，以上限 3 層的技能擊中，僅刷新 1 層。",
        ],
      ],
    ],
    alch: [
      "萃取",
      [
        [
          "神秘金屬",
          "消耗 1 顆神秘金屬，將稀有以上的裝備萃取為符文石。詞綴階級維持不變。",
        ],
        ["Lv1", `成功率 ${XTR.ok[1]}%，依權重取出 1 條詞綴。`],
        ["Lv2", "成功率 100%，依權重取出 1 條詞綴。"],
        [
          "Lv3",
          `成功率 100%。可取出獨特裝備的獨特效果。取出獨特效果的機率為 ${XTR.uq[3]}%。其餘 ${100 - XTR.uq[3]}% 依權重取出詞綴。`,
        ],
        [
          "Lv4",
          `成功率 100%。取出獨特效果的機率為 ${XTR.uq[4]}%。其餘 ${100 - XTR.uq[4]}% 依權重取出詞綴。取出的詞綴有 ${XTR.up[4]}% 機率提升一階。T1 可提升至 T0。`,
        ],
        [
          "保護石",
          `避免裝備萃取時被摧毀。低階保護石保留機率 ${PROT_KEEP.p1}%。高階保護石保留機率 ${PROT_KEEP.p2}%。`,
        ],
        [
          "取得",
          "由怪物掉落，菁英與 Boss 掉落率較高。神秘金屬、鋁也可消耗Zeny合成。",
        ],
        [
          "Zeny",
          `萃取、灌注、磨礪、鑲嵌皆會消耗Zeny。裝備等級越高，消耗越多。90 級裝備消耗量：萃取 ${ALCH_ASH.x(90)}、灌注 ${ALCH_ASH.i(90)}、磨礪 ${ALCH_ASH.r(90)}、鑲嵌 ${ALCH_ASH.f(90)}。`,
        ],
      ],
    ],
    hh: [
      "獸人酋長之戒",
      [
        [
          "主宰",
          `最稀有的裝備：83 級以上的怪物，每件掉落物有 1/${Math.round(1 / MYTH_P)} 機率為主宰。`,
        ],
        ["不會被分解", "拾取篩選、批次分解、批次萃取，皆不會影響主宰。"],
        ...Object.keys(HH).map((t) => [`竊取「${ELITE_AF[t].n}」`, HH[t].d]),
      ],
    ],
    bxtr: [
      "批次萃取",
      [
        ["萃取規則", "背包中稀有以上的裝備，符合任一規則即會一併萃取。"],
        ["石板", "上方切換至「石板」，可使用石板專屬的萃取規則。"],
        ["規則的條件", "同一規則內的條件須全部符合。"],
        ["不會萃取", "已鎖定、奇蹟狀態的裝備與主宰不會被批次萃取。"],
        ["不夠時", "神秘金屬、Zeny或符文石空間不足時，僅萃取清單前段的裝備。"],
      ],
    ],
    craft: [
      "合成",
      [
        [
          "合成材料",
          "消耗Zeny合成神秘金屬或鋁；保護石無法合成，僅由菁英與 Boss 掉落。",
        ],
        ["等級", "合成結果的等級隨機，角色等級越高，越容易合成高等級。"],
        [
          "升級合成",
          "4 顆同等級的神秘金屬、鋁或低階保護石，可搭配Zeny合成 1 顆高一級的。封印石、磨礪石、腐化石、奇蹟石無法升級。",
        ],
        [
          "全部往上合",
          "從最低等級開始，將可合成的全部升級，合成結果也會繼續升級。",
        ],
        ["自動合成", "勾選後，低階保護石達 4 顆時自動合成為高階，並消耗Zeny。"],
      ],
    ],
    inf: [
      "灌注",
      [
        ["鋁", "消耗 1 顆鋁，將符文石灌注至魔法以上的裝備。"],
        ["取代", "隨機取代一條詞綴，每條機率相同。可能出現兩條同種詞綴。"],
        ["Lv1", "灌注魔法以上的非獨特裝備。"],
        ["Lv2", "灌注魔法以上的裝備，包含獨特裝備。獨特效果不會被取代。"],
        ["Lv3", "灌注魔法以上的裝備，包含獨特裝備。也能鑲嵌插槽裝備。"],
        [
          "Lv4",
          "將獨特效果符文灌注至同部位的裝備。隨機取代一條詞綴，轉為此獨特效果。同種效果每件限一個。僅由 83 級以上的一般怪物掉落。",
        ],
        [
          "部位",
          "僅能灌注至此詞綴可出現的部位。鑲嵌插槽裝備不限部位，武器詞綴仍限武器。",
        ],
        ["先用低等級", "灌注時優先使用可用的最低等級鋁。"],
      ],
    ],
    fuse: [
      "鑲嵌",
      [
        ["插槽裝備", "僅由 Lv75 以上的怪物掉落。"],
        ["異種", "每種詞綴限放一顆。佔插槽裝備的 80%。"],
        ["任意", "可重複放入同種詞綴。佔插槽裝備的 20%。"],
        [
          "放入符文石",
          "在背包選擇插槽裝備並按「鑲嵌」，於鑲嵌視窗放入符文石後再按「鑲嵌」，消耗 1 顆鋁 Lv3。",
        ],
        [
          "不限部位",
          "一般符文石可鑲嵌至任何部位。僅灌注受原部位限制。武器詞綴仍限武器。",
        ],
        ["獨特效果符文", "僅能鑲嵌至同部位的插槽裝備，每件最多一顆。"],
        ["固定詞綴", "鑲嵌後詞綴固定在裝備上，不能再取下。"],
      ],
    ],
    map: [
      "地圖",
      [
        ["自動掛機", "角色會在目前的地圖自動戰鬥。"],
        [
          "挑戰 Boss",
          "擊殺足夠的怪物後，按「挑戰 BOSS」，限時 90 秒。越後面的地圖，所需擊殺數越多。",
        ],
        ["解鎖地圖", "首次擊敗 Boss 後，解鎖下一張地圖。"],
        ["掛機統計", "記錄進入此地圖後的成果，切換地圖後重新計算。"],
      ],
    ],
    guard: [
      "守護者",
      [
        ["§印記與挑戰"],
        [
          "印記",
          "放置石板的地圖會掉落守護者印記。地圖 1-4、5-8、9-11 各掉落對應守護者印記。",
        ],
        [
          "專屬場地",
          "挑戰時會傳送至守護者的場地。戰鬥結束後自動返回原地圖，也可點選右下角「離開」。",
        ],
        [
          "挑戰",
          "每個印記可挑戰一次，守護者 90 級，限時 140 秒。失敗不退還印記。",
        ],
        ["§三位守護者"],
        [
          "獸人英雄",
          `每 ${GUARD_ADD.cd} 秒召喚 ${GUARD_ADD.n} 隻爪牙。爪牙存活時，獸人英雄受到的傷害 -${100 * GUARD_ADD.dr}%。`,
        ],
        [
          "古樹招式",
          `每 ${GD_SK.cd} 秒輪流使用纏根和衝撞。纏根：你的腳下冒出樹根，命中後地面減速 ${BOSS_SK.roots.slow} 秒。衝撞：沿紅線衝鋒。`,
        ],
        [
          "伊夫利特",
          `每 ${GUARD_SLAM.cd} 秒蓄力重擊，${GUARD_SLAM.t} 秒後紅圈內受到 ${GUARD_SLAM.k} 倍傷害。`,
        ],
        [
          "熔核招式",
          `每 ${GD_SK.cd} 秒輪流使用熔岩雨和彈幕。熔岩雨：場地各處落下熔岩，第一顆瞄準你。彈幕：向四周射出火球術。`,
        ],
        [
          "冰暴騎士",
          `每 ${GUARD_SH.cd} 秒張開最大生命 ${100 * GUARD_SH.v}% 的護盾。${GUARD_SH.t} 秒內未擊破，回復剩餘護盾 ${GUARD_SH.h} 倍的生命。`,
        ],
        [
          "星穹招式",
          `每 ${GD_SK.cd} 秒輪流使用星光十字和星墜。星光十字：穿過整個場地的十字光束。星墜：落在你身上的紅圈。`,
        ],
        [
          "狂怒",
          `守護者和${FINAL.n}生命低於 ${100 * BOSS_SK.enr}% 時狂怒：移動、攻擊更快，招式更頻繁。`,
        ],
        [
          "獎勵",
          "擊敗後掉落守護者碎片和封印石，15% 機率掉落這位守護者的獨特裝備。",
        ],
        ["§" + FINAL.n],
        [
          "開啟挑戰",
          "三種守護者碎片各 1 個開啟挑戰，90 級，限時 210 秒。失敗不退還碎片。",
        ],
        [
          "三個階段",
          "生命 2/3 以上時展開護盾，1/3 以上時蓄力重擊，最後召喚爪牙。",
        ],
        [
          "終焉招式",
          `每 ${FINAL.cd} 秒輪流使用：${FINAL.ks.map((t) => SK_N[t]).join("、")}。傷害比守護者更高。`,
        ],
        [
          "終焉獎勵",
          `20% 機率掉落${FINAL.n}的獨特裝備。第一次擊敗獲得稱號「${FINAL.title}」。可以重複挑戰。`,
        ],
      ],
    ],
    slate: [
      "石板",
      [
        ["§取得與放置"],
        ["取得石板", "擊敗達納托斯之塔的 Boss 後，77 級以上的怪物會掉落石板。"],
        ["全地圖共用", "石板欄位所有地圖共用，放入的石板在每張地圖都生效。"],
        [
          "怪物等級",
          "放有石板時，怪物等級固定：第 1 張 83 級，依序提高，第 15 張 93 級。",
        ],
        [
          "地圖等級",
          "怪物等級越高，越容易掉落：終局獨特、封印石、磨礪石與石板。傳奇裝備也越多。",
        ],
        ["固定詞綴", "每種石板有一條固定詞綴，放置多塊時效果加總。"],
        ["更多欄位", "共 3 個欄位。放有石板時擊殺 1000 隻，開啟下一個欄位。"],
        ["地圖 Boss", "放有石板時，需擊殺 200 隻才能挑戰地圖 Boss。"],
        ["§風險與獎勵"],
        ["危險詞綴", "每塊石板另有 0-2 條紅色的危險詞綴，不佔獎勵詞綴的位置。"],
        [
          "危險度",
          "危險詞綴加總為危險度。每 2 點：獎勵詞綴效果 +1%，稀有度 +1%。稀有度越高，越容易掉稀有以上的裝備。每 4 點：掉落數量 +1%。",
        ],
        ["§掉落詞綴"],
        ["偏向", "提高指定部位的掉落權重。+100% 為權重加倍。"],
        ["多條偏向", "各部位依權重分配機率，不會互相抵消。"],
        ["稀有度提升", "掉落裝備機率提升一級稀有度，最高為傳奇。"],
        ["石板探尋", "提高石板的掉落率，與基礎掉落率相乘。"],
        ["詞綴提升", "掉落裝備機率使一條詞綴提升一階，最高為 T1。"],
        ["不受影響", "獨特與插槽裝備不受偏向、提升與共鳴影響。"],
        ["§石板煉金"],
        [
          "只動獎勵詞綴",
          "萃取與灌注僅影響獎勵詞綴。磨礪會連同危險詞綴一併重洗，封印僅能選擇獎勵詞綴。",
        ],
        [
          "萃取灌注",
          "稀有以上的石板能萃取，魔法以上的石板能灌注。石板的符文石只能灌注進石板。",
        ],
        [
          "插槽石板",
          "由巴風特機率掉落。獎勵詞綴「插槽石板」，可使掉落的石板轉為插槽石板。",
        ],
        [
          "鑲嵌石板",
          "插槽石板自帶與孔數相同的危險詞綴，可鑲嵌同等數量的石板符文（每種一顆），消耗鋁 Lv3。鑲嵌完成後才能放入地圖。",
        ],
        ["鑲嵌之後", "鑲嵌過的石板不能萃取或灌注。可以磨礪與洗鍊。"],
        [
          "插槽石板加成",
          `插槽石板的固定、獎勵、危險詞綴效果皆 ×${SSL.k}，危險度也 ×${SSL.k}。`,
        ],
        ["§整理"],
        [
          "整理石板",
          "背包的石板頁有獨立設定：拾取篩選、批次分解與保留規則，與裝備分開。符合石板保留規則的石板不會被自動分解。",
        ],
        ["鎖定石板", "鎖定的石板不會被分解，也不會被批次萃取。"],
      ],
    ],
    reroll: [
      "磨礪",
      [
        [
          "磨礪石",
          "在原本的階級範圍內，重洗所有詞綴的數值。詞綴種類和階級不變。",
        ],
        [
          "封印石",
          "磨礪或灌注時勾選封印石，再點選一條詞綴，本次不會改動此詞綴。",
        ],
        ["一次性", "每次磨礪或灌注消耗 1 顆封印石。"],
        ["連續使用", "勾選與封印的詞綴會保留到下一次；封印石用完時自動取消。"],
        [
          "取得",
          "僅在放置石板的地圖掉落，地圖等級越高越容易掉落，Boss 必定掉落磨礪石。",
        ],
      ],
    ],
    tower: [
      "無盡之塔",
      [
        ["§挑戰"],
        ["開放", `擊敗${FINAL.n}後開放，位於地圖分頁的守護者下方。`],
        [
          "樓層",
          `怪物 ${TW.lv} 級。每層限時 ${TW.t} 秒，擊殺指定數量即過關，並立即進入下一層。`,
        ],
        ["越來越強", "每上一層，怪物生命與傷害皆會提高。"],
        [
          "王層",
          `每 ${TW.boss} 層為王層，清除怪物後須再擊敗王，額外增加 ${TW.bt} 秒。`,
        ],
        [
          "規則",
          "第 11 層起，每 10 層增加一條規則，效果與石板的危險詞綴相同。",
        ],
        ["結束", "時間結束、陣亡或離開時，本次挑戰結束。最高層數會保留。"],
        [
          "挑戰模式",
          `勾選後，下一次挑戰每層（含王層）只有 ${TW.ct} 秒。獎勵與排行榜和一般模式相同。`,
        ],
        ["§進度"],
        [
          "存檔點",
          "存檔點每 10 層一個：第 1、11、21 層…，最高 37 層可選第 1、11、21、31 層。",
        ],
        [
          "起始樓層",
          "從下拉選單選擇起始樓層，預設為最新存檔點。自動挑戰也從此樓層開始。",
        ],
        [
          "自動挑戰",
          "勾選後，生命達到設定值（預設 80%）即自動進塔。手動離開後，需等待 2 分鐘才會再次自動進塔。",
        ],
        [
          "腐化石",
          "過關有機率掉落腐化石，層數越高機率越高，王層機率更高。腐化石僅在無盡之塔掉落。",
        ],
        [
          "洗鍊石",
          "過關有機率掉落洗鍊石，機率為腐化石的一半。洗鍊石僅在無盡之塔掉落。",
        ],
        [
          "里程碑",
          "首次通過第 10、20、30… 層時，額外獲得腐化石、封印石和磨礪石。",
        ],
      ],
    ],
    corr: [
      "腐化",
      [
        ["腐化石", "對一件裝備使用一顆腐化石，結果隨機。"],
        ["升階", `${COR.w[0]}%：一條詞綴提升一階，T1 可提升至 T0。`],
        [
          "數值變化",
          `${COR.w[1]}%：所有詞綴的數值 × ${Math.round(100 * COR.val[0])}%～${Math.round(100 * COR.val[1])}%，可超出原本的範圍。`,
        ],
        ["沒有變化", `${COR.w[2]}%：無任何變化。`],
        ["變差", `${COR.w[3]}%：一條詞綴降一階。`],
        [
          "獨特裝備",
          `獨特效果的數值也會改變。升階 ×${COR.uq.up.join("～")}。數值變化 ×${COR.uq.val.join("～")}。變差 ×${COR.uq.down.join("～")}。`,
        ],
        [
          "鎖定",
          "腐化後的裝備無法再煉金：萃取、灌注、磨礪、鑲嵌、腐化皆不可。建議完成煉金後再腐化。",
        ],
      ],
    ],
    monarch: [
      "闇答萊屍",
      [
        [
          "無限印記",
          `無盡之塔每通過一層，有 ${100 * MK_FL(1)}% 機率掉落無限印記，每高一層 +0.5%。擊敗王層的王時為 ${100 * MK_P(10)}%，每高 10 層再 +5%。`,
        ],
        [
          "開啟挑戰",
          `集滿 ${MONARCH.mk} 個無限印記即可開啟挑戰，90 級，限時 270 秒。失敗不退還印記。`,
        ],
        [
          "四個階段",
          "生命 3/4 以上時展開護盾，1/2 以上時蓄力重擊，1/4 以上時召喚爪牙。",
        ],
        [
          "招式",
          `每 ${MONARCH.cd} 秒輪流使用：${MONARCH.ks.map((t) => SK_N[t]).join("、")}。傷害比${FINAL.n}更高。`,
        ],
        [
          "狂怒",
          `最後 1/4 生命進入狂怒：傷害 ×${MONARCH.rd}，移動、攻擊更快，招式更頻繁，護盾、重擊、爪牙每 ${MONARCH.rt} 秒輪流使用。`,
        ],
        [
          "必定掉落",
          `1 件神話裝備（${RAR_AFFIX[4][0]} 條詞綴）和 ${MON_MAT.n} 個最高階素材。`,
        ],
        [
          "機率掉落",
          `35% 奇蹟石，0.1% 主宰。第一次擊敗獲得稱號「${MONARCH.title}」。`,
        ],
      ],
    ],
    holy: [
      "洗鍊石",
      [
        [
          "洗鍊石",
          "在基底範圍內，重洗基底數值：武器傷害、防具護甲或閃避、石板固定詞綴。",
        ],
        ["取得", "僅由無盡之塔掉落，層數越高機率越高，王層機率更高。"],
        ["基底範圍", "同底材、同物品等級的基底數值範圍。"],
        ["品質", "基底在範圍中的位置：0% 為最低，100% 為最高。"],
        ["限制", "已腐化、插槽裝備、鑲嵌過的石板無法使用。"],
        ["奇蹟", "奇蹟狀態下，基底只會提高。"],
      ],
    ],
    mir: [
      "奇蹟",
      [
        ["奇蹟石", "使一件裝備或石板獲得奇蹟狀態，僅由闇答萊屍掉落。"],
        [
          "只有一次",
          "對此裝備使用任何一次煉金後，奇蹟狀態即消失。萃取、灌注、磨礪、腐化、洗鍊、鑲嵌皆計入。",
        ],
        [
          "萃取",
          "獨特裝備必定取出獨特效果（主宰除外）。使用神秘金屬 Lv4 時，詞綴符文必定提升一階，獨特效果不會提升。",
        ],
        ["灌注", "必定取代階級最低的一條詞綴，同階時隨機選擇。"],
        [
          "磨礪",
          "每條詞綴的數值皆會提升，已達最大值者維持不變。石板的危險詞綴照常重洗。",
        ],
        [
          "腐化",
          100 * MIR.cor +
            "% 機率不會進入腐化狀態，之後仍可繼續煉金或再次腐化。",
        ],
        ["洗鍊", "基底數值必定提升，已達最大值者維持不變。"],
      ],
    ],
    shop: [
      "商人",
      [["Zeny", "分解裝備可獲得Zeny，可在此兌換道具與寶石。"]],
    ],
    cards: [
      "怪物卡牌",
      [
        ["帳號共用", "擊殺數由所有角色合併計算。"],
        [
          "卡牌加成",
          `每張地圖有三階加成：此地圖的怪物合計擊殺 ${CARD_N.join("、")} 隻，依序開啟第 1、2、3 階。`,
        ],
        ["只算最高階", "加成取目前達到的最高階數值，不會疊加。"],
        ["卡框", "銅、銀、金框代表已開啟第 1、2、3 階。"],
        ["閃卡", "合計擊殺 20000 隻後轉為閃卡，並解鎖此地圖的拖尾。"],
        ["活動卡牌", "諸神黃昏的三種怪物，各自對應一位神。"],
        [
          "神的特效",
          `擊殺對應怪物 ${GFX_N[0]} 隻解鎖擊中特效，${GFX_N[1]} 隻解鎖擊殺特效。`,
        ],
      ],
    ],
    fx: [
      "特效",
      [
        ["拖尾", "地圖卡牌合計擊殺 20000 隻，解鎖那張地圖的拖尾。"],
        ["擊中特效", `在活動地圖擊殺同一位神的怪物 ${GFX_N[0]} 隻後解鎖。`],
        ["擊殺特效", `同一種怪擊殺 ${GFX_N[1]} 隻解鎖。`],
        ["使用", "點選拖尾即可裝備，再點一次取下。"],
        ["預覽", "點選擊中、擊殺特效可預覽效果。"],
        ["只是外觀", "特效只改變畫面，不影響戰鬥。"],
      ],
    ],
    ab: [
      "自動挑戰 Boss",
      [
        [
          "開打時機",
          "擊殺數達標且生命達到設定值（預設 80%）時，自動挑戰地圖 Boss。",
        ],
        [
          "開打生命",
          "以滑桿調整自動挑戰所需的生命 %。Boss、終局頭目、無盡之塔皆使用此數值。",
        ],
        ["輸了", "等待 2 分鐘後才會再次自動挑戰，期間持續戰鬥升級。"],
        ["活動", "巴風特不會自動挑戰，需手動挑戰。"],
        ["手動", "隨時可手動點選「挑戰 BOSS」。"],
        [
          "終局頭目",
          "勾選頭目卡挑戰按鈕下的「自動」，生命達到設定值時自動挑戰此頭目。",
        ],
        [
          "順序",
          `優先順序：${MONARCH.n}（印記足夠）、${FINAL.n}（碎片齊全）、守護者。皆需勾選自動。`,
        ],
        [
          "連續挑戰",
          "勝利 3 秒後，直接在場地挑戰下一場，掉落物自動拾取。失敗則等待 2 分鐘。",
        ],
      ],
    ],
    ios: [
      "加到主畫面・iPhone",
      [
        ["用 Safari 開啟", "在 Safari 打開這個遊戲網頁。"],
        [
          "分享",
          "點選工具列的「分享」按鈕（方框加向上箭頭）；新版 iOS 請先點選「⋯」。",
        ],
        ["加入主畫面", "向下捲動，點選「加入主畫面」，再點選「加入」。"],
        ["存檔分開", "主畫面與 Safari 中的遊戲存檔互相獨立，請擇一遊玩。"],
      ],
    ],
    android: [
      "加到主畫面・Android",
      [
        ["用 Chrome 開啟", "在 Chrome 打開這個遊戲網頁。"],
        ["開啟選單", "點選右上角的「⋮」。"],
        ["加到主畫面", "點選「加到主畫面」，若出現選項請選擇「安裝」。"],
        ["完成", "確認後，遊戲圖示就會出現在手機主畫面。"],
      ],
    ],
  },
  MENU = [
    ["quest", "任務", "mnQ"],
    ["shop", "商人", "mnS"],
    ["cards", "卡牌", "mnC"],
    ["fx", "特效", "mnF"],
    ["rank", "排行", "mnR"],
    ["stash", "倉庫", "mnW"],
    ["log", "更新日誌", "mnL"],
    ["set", "設定", "mnG"],
    ["db", "資料庫", "mnB", "./db/"],
    ["dc", "Discord", "mnD", "https://discord.gg/mX33MCkBEa"],
    ["don", "贊助", "mnH", "https://p.ecpay.com.tw/6CF1767"],
  ],
  CHANGELOG = [
    {
      v: "v0.2.821",
      d: "2026-10-17",
      l: ["批次萃取勾選「每件使用奇蹟石」時，會先跳出確認"],
    },
    {
      v: "v0.2.820",
      d: "2026-10-17",
      l: ["批次萃取（含多選萃取）可勾選「每件使用奇蹟石強化」"],
    },
    {
      v: "v0.2.819",
      d: "2026-10-17",
      l: [
        "自動挑戰的開打生命：生命上限被限制時（如血怒 50%），回滿上限即可開打",
        "移除終局頭目「自動」旁的驚嘆號提示",
      ],
    },
    {
      v: "v0.2.818",
      d: "2026-10-17",
      l: [
        "新詞綴「燃燒傷害」「流血傷害」：出現在手套與項鍊，提高燃燒與流血每跳的傷害",
      ],
    },
    {
      v: "v0.2.816",
      d: "2026-10-17",
      l: [
        "符文石分組：「獨特效果」底下依每種獨特效果再細分群組",
        "共用倉庫新增「規則篩選」，可用保留規則或自訂條件篩選顯示",
      ],
    },
    { v: "v0.2.811", d: "2026-10-17", l: ["選單新增「贊助」，點開可贊助作者"] },
    {
      v: "v0.2.810",
      d: "2026-10-17",
      l: ["批次萃取視窗：滑鼠移到裝備上或點一下，可查看該裝備的詞綴"],
    },
    {
      v: "v0.2.808",
      d: "2026-10-17",
      l: ["修正：大螢幕全螢幕時，背包物品太多無法往下捲動、後面的物品不會顯示"],
    },
    {
      v: "v0.2.807",
      d: "2026-10-17",
      l: ["石板保留規則的「危險度」條件改為「≥」（已建立的舊條件維持「≤」）"],
    },
    { v: "v0.2.806", d: "2026-10-17", l: ["修正：資料庫頁面無法顯示"] },
    {
      v: "v0.2.804",
      d: "2026-10-17",
      l: [
        "深海壓力：角色周圍顯示作用範圍，右上顯示範圍內敵人數（點擊看傷害加成）",
      ],
    },
    {
      v: "v0.2.802",
      d: "2026-10-17",
      l: ["資料庫：高階、終局獨特的掉落等級移到名稱旁邊"],
    },
    {
      v: "v0.2.801",
      d: "2026-10-17",
      l: ["背包、煉金、倉庫的稀有度篩選新增「主宰」"],
    },
    {
      v: "v0.2.800",
      d: "2026-10-17",
      l: ["石板詞綴「稀有度提升」標示最高提升至傳奇"],
    },
    {
      v: "v0.2.799",
      d: "2026-10-16",
      l: ["修正：勾選不公開構築後，用舊版頁面上傳新紀錄會讓構築又變回公開"],
    },
    { v: "v0.2.798", d: "2026-10-16", l: ["設定 → 畫面 新增「隱藏紅點通知」"] },
    {
      v: "v0.2.797",
      d: "2026-10-16",
      l: ["煉金換選另一件裝備時，封印石、奇蹟石的勾選會自動取消"],
    },
    {
      v: "v0.2.795",
      d: "2026-10-16",
      l: ["畫面最多每秒 60 格；切到其他視窗時降為 30 格，邊看影片邊掛機較不卡"],
    },
    {
      v: "v0.2.794",
      d: "2026-10-16",
      l: [
        "修正：活動的紅點有時會出現在戰鬥畫面中間，現在固定在活動提示的右上角",
      ],
    },
    {
      v: "v0.2.793",
      d: "2026-10-16",
      l: [
        "狂怒之槍、雙劍格擋、血之渴望、致命迴旋改為常駐開啟，不再於怪物之間反覆開關",
        "扣血與血之渴望、旋風的傷害仍只在戰鬥中進行",
        "修正：分解寶石時往下捲再點選寶石，清單會跳回最上面",
      ],
    },
    {
      v: "v0.2.789",
      d: "2026-10-16",
      l: [
        "終局頭目已勾選「自動」卻沒開打時，旁邊顯示「!」，點擊可查看原因（如生命未達設定值）",
      ],
    },
    {
      v: "v0.2.787",
      d: "2026-10-16",
      l: ["改善鐵拳打訓練場不死假人時的卡頓（命中光圈同時最多顯示 8 個）"],
    },
    {
      v: "v0.2.785",
      d: "2026-10-16",
      l: [
        "改善鐵拳高攻速、大量額外揮拳時的卡頓（同時最多顯示 8 個砸拳特效，傷害不變）",
      ],
    },
    {
      v: "v0.2.783",
      d: "2026-10-16",
      l: [
        "共用倉庫的石板篩選與背包相同：可依危險度、種類、插槽孔數排序",
        "修正：倉庫石板的「插槽」篩選不包含已鑲嵌的石板",
      ],
    },
    {
      v: "v0.2.782",
      d: "2026-10-16",
      l: ["共用倉庫的符文石預設依詞綴分組，相同的符文石合併為一列"],
    },
    {
      v: "v0.2.781",
      d: "2026-10-16",
      l: ["角色頁的「轉職」分頁改名為「職業天賦」"],
    },
    { v: "v0.2.780", d: "2026-10-16", l: ["修正「同步保留規則」視窗的間距"] },
    {
      v: "v0.2.778",
      d: "2026-10-16",
      l: [
        "保留規則所有角色共用；已有自己規則的角色不會被改動",
        "這類角色會詢問是否同步共用規則，也可在保留規則頁按「同步」",
      ],
    },
    {
      v: "v0.2.776",
      d: "2026-10-16",
      l: [
        "保留規則改為所有角色共用（裝備、石板、符文石）",
        "各角色原本的保留規則會合併保留，重複的只留一條",
      ],
    },
    {
      v: "v0.2.775",
      d: "2026-10-16",
      l: [
        "技能頁的定位陷阱可關閉爆炸特效",
        "保留規則新增「基底品質」條件：品質達指定百分比即保留",
      ],
    },
    {
      v: "v0.2.774",
      d: "2026-10-16",
      l: [
        "無盡之塔挑戰中手動離開，會關閉自動挑戰無盡之塔",
        "鐵拳改為三職業通用：可經共用倉庫給任何職業使用",
      ],
    },
    { v: "v0.2.773", d: "2026-10-16", l: ["背包裝備詳情新增「腐化」按鈕"] },
    {
      v: "v0.2.771",
      d: "2026-10-16",
      l: ["修正：排行榜構築可能顯示破紀錄之後才換上的裝備"],
    },
    {
      v: "v0.2.770",
      d: "2026-10-16",
      l: ["修正：石板稀有度篩選「插槽」不會顯示已鑲嵌的插槽石板"],
    },
    {
      v: "v0.2.769",
      d: "2026-10-16",
      l: ["修正：同時開著多個分頁時，舊分頁可能蓋掉較新的進度"],
    },
    {
      v: "v0.2.767",
      d: "2026-10-16",
      l: ["修正：切換角色後立刻關閉遊戲，可能讀到舊存檔"],
    },
    {
      v: "v0.2.765",
      d: "2026-10-16",
      l: ["修正：倉庫中的穿梭寶石顯示限定職業、無法取出"],
    },
    {
      v: "v0.2.764",
      d: "2026-10-16",
      l: [
        "連鎖增幅電擊新增「連鎖增幅」標籤",
        "連鎖增幅輔助可輔助連鎖增幅技能：連鎖增幅電擊多連鎖增幅 2 個敵人",
      ],
    },
    {
      v: "v0.2.763",
      d: "2026-10-16",
      l: ["倉庫新增多選：可一次存入或取出多件裝備、符文石、石板、寶石"],
    },
    {
      v: "v0.2.762",
      d: "2026-10-16",
      l: [
        "修正：二刀連擊／連續射擊的額外施放，在原目標死亡後會打到很遠的怪物；現在新目標不在技能射程內就不施放",
      ],
    },
    {
      v: "v0.2.760",
      d: "2026-10-16",
      l: ["卡牌進度改為所有角色共用：各角色的擊殺數會合併計算"],
    },
    {
      v: "v0.2.756",
      d: "2026-10-16",
      l: [
        "構築可以命名：再點一次目前的構築即可改名",
        "倉庫寶石頁新增技能篩選，並依格子數由小到大排列",
      ],
    },
    {
      v: "v0.2.755",
      d: "2026-10-16",
      l: [
        "符文石保留規則新增「詞綴計數」：符合下列任一詞綴即保留",
        "修正：符文石階級篩選選 T0 等時，獨特效果符文石不再被篩掉",
      ],
    },
    {
      v: "v0.2.753",
      d: "2026-10-16",
      l: ["排行榜新增職業分頁：全部／劍士／弓手／法師"],
    },
    {
      v: "v0.2.752",
      d: "2026-10-16",
      l: [
        "Zeny與材料改為所有角色共用，切換角色時自動帶著走",
        "舊角色身上的Zeny與材料會自動合併",
        "倉庫移除「材料」分頁（不必再存入）",
      ],
    },
    {
      v: "v0.2.750",
      d: "2026-10-16",
      l: ["咒術師之戒：技能頁會顯示詛咒光環的效果、範圍與加成明細"],
    },
    {
      v: "v0.2.748",
      d: "2026-10-16",
      l: ["消極模式：無盡之塔換層時也會走回場地中間"],
    },
    {
      v: "v0.2.747",
      d: "2026-10-16",
      l: ["修正：鑲嵌視窗在較矮的螢幕上，符文石列表被壓扁難以點選"],
    },
    {
      v: "v0.2.746",
      d: "2026-10-16",
      l: ["修正：共用倉庫存入／取出疊在一起的寶石後，該行會跑到列表後面"],
    },
    {
      v: "v0.2.744",
      d: "2026-10-16",
      l: [
        "排行榜新增「不公開我的構築快照」",
        "勾選後，其他玩家無法查看你的構築",
      ],
    },
    {
      v: "v0.2.743",
      d: "2026-10-16",
      l: ["鑲嵌過的插槽石板可以磨礪與洗鍊（仍不能萃取、灌注）"],
    },
    {
      v: "v0.2.742",
      d: "2026-10-16",
      l: ["分解寶石：同形狀的寶石疊成一格，點一下選一顆"],
    },
    {
      v: "v0.2.741",
      d: "2026-10-16",
      l: [
        "合成變異寶石：同形狀的寶石疊成一格，點一下選一顆",
        "共用倉庫：相同的寶石疊成一行（×數量）",
      ],
    },
    {
      v: "v0.2.738",
      d: "2026-10-16",
      l: ["十億以上的數字改用 B 顯示（例：1.2B）"],
    },
    {
      v: "v0.2.737",
      d: "2026-10-16",
      l: ["巴基力鎧甲說明：冷卻固定 0.5 秒，不受冷卻縮減與輔助影響"],
    },
    {
      v: "v0.2.736",
      d: "2026-10-16",
      l: [
        "背包的石板與裝備相同，可直接點灌注／磨礪／洗鍊",
        "使用中的石板也有煉金按鈕",
      ],
    },
    {
      v: "v0.2.735",
      d: "2026-10-16",
      l: ["設定新增「石板詞綴不因角色靠近而淡出」"],
    },
    {
      v: "v0.2.734",
      d: "2026-10-16",
      l: ["修正：魔劍士之劍觸發技能時，普通攻擊會停頓，攻擊次數減半"],
    },
    {
      v: "v0.2.733",
      d: "2026-10-16",
      l: [
        "共用倉庫新增排序與篩選（部位、稀有度、階級、種類、職業）",
        "共用倉庫的寶石、材料名稱改為清楚的深色字",
        "石板詞綴的 T 階級標籤改用與裝備相同的底版",
      ],
    },
    {
      v: "v0.2.731",
      d: "2026-10-16",
      l: [
        "召喚元素精靈新增模式切換（技能頁）：侵略模式／守護模式",
        "守護模式：精靈優先攻擊離你最近的敵人",
      ],
    },
    {
      v: "v0.2.730",
      d: "2026-10-16",
      l: [
        "新增共用倉庫（選單→倉庫）：所有角色共用",
        "可存放裝備、符文石、石板、技能寶石與材料",
        "未使用的角色離線只累積經驗，沒有掉落",
      ],
    },
    {
      v: "v0.2.729",
      d: "2026-10-16",
      l: [
        "遊俠天賦重製：以閃避為核心的防禦分支",
        "新天賦：幸運閃避、擦身、獵人本能、超越極限、遊擊護盾",
        "已學習的遊俠天賦點保留，可至角色頁重新分配",
      ],
    },
    {
      v: "v0.2.728",
      d: "2026-10-16",
      l: [
        "迴旋十字斬：傷害 220% → 300%，爆開傷害 60% → 100%",
        "迴旋十字斬消耗氣勢時有 50% 機率不消耗",
      ],
    },
    {
      v: "v0.2.727",
      d: "2026-10-16",
      l: ["隱私權政策更新：排行榜上傳時比對裝置，防止重複作弊"],
    },
    {
      v: "v0.2.725",
      d: "2026-10-16",
      l: [
        "劍士新增傳說寶石「迴旋十字斬」：黑暗瞬間擊中後在目標周圍爆開",
        "雙劍格擋者天賦改版：疾風步、無盡雙劍格擋、殘影",
      ],
    },
    {
      v: "v0.2.723",
      d: "2026-10-16",
      l: ["插槽裝備詳細資訊直接顯示異種／任意的規則"],
    },
    {
      v: "v0.2.722",
      d: "2026-10-16",
      l: [
        "排行榜構築快照新增「屬性」頁：查看該玩家的角色面板數值",
        "屬性於玩家下次刷新紀錄時上傳",
      ],
    },
    {
      v: "v0.2.721",
      d: "2026-10-16",
      l: ["構築新增「複製」：目前的裝備或技能拼圖可複製到其他構築"],
    },
    {
      v: "v0.2.719",
      d: "2026-10-16",
      l: [
        "消極模式在無盡之塔也會生效",
        "鑲嵌頁的插槽裝備改為依孔數由多到少排列",
      ],
    },
    {
      v: "v0.2.718",
      d: "2026-10-15",
      l: [
        "灌注與鑲嵌選符文石：數值相同的符文石合併成一行，顯示數量",
        "同一種獨特效果符文石也合併顯示",
      ],
    },
    {
      v: "v0.2.717",
      d: "2026-10-15",
      l: ["修正登出 Google 後再登入同一帳號，可載入較舊的雲端存檔回溯進度"],
    },
    {
      v: "v0.2.715",
      d: "2026-10-15",
      l: ["訓練場統計：傷害來源新增每秒擊中次數"],
    },
    {
      v: "v0.2.714",
      d: "2026-10-15",
      l: ["聖十字權杖：召喚物也獲得你的行動速度加成（含時光敏捷戰靴的行動速度）"],
    },
    {
      v: "v0.2.712",
      d: "2026-10-15",
      l: ["灌注與符文列表：同階級、同種類的符文石改為數值由大到小排列"],
    },
    {
      v: "v0.2.711",
      d: "2026-10-15",
      l: [
        "定位陷阱達上限時仍會照冷卻施放：最舊的陷阱立即爆炸，再投出新陷阱",
        "修正關閉普通攻擊時，陷阱滿了角色會一直跑、不再施放陷阱",
      ],
    },
    {
      v: "v0.2.710",
      d: "2026-10-15",
      l: [
        "戰鬥畫面頂端：增益與獵首詞綴圖示放不下時改排到第二排，不再擠掉每分鐘經驗／擊殺",
      ],
    },
    {
      v: "v0.2.708",
      d: "2026-10-15",
      l: [
        "插槽石板：所有詞綴效果 ×1.5（固定、獎勵、危險詞綴，危險度也 ×1.5）",
        "尚未鑲嵌的舊插槽石板補足危險詞綴至孔數",
        "石板排序新增「插槽孔數」",
      ],
    },
    {
      v: "v0.2.707",
      d: "2026-10-15",
      l: [
        "背包符文頁新增「保留規則」：符合規則的符文石不會被自動分解或批次分解",
        "條件可選指定詞綴、階級、可用部位、石板符文",
      ],
    },
    {
      v: "v0.2.706",
      d: "2026-10-15",
      l: [
        "插槽石板：危險詞綴數量改為與孔數相同（原為 1 到孔數），可鑲嵌的獎勵符文也等於孔數",
      ],
    },
    {
      v: "v0.2.703",
      d: "2026-10-15",
      l: ["背景戰鬥（切到其他分頁或縮小視窗）的擊殺速度與畫面中相同"],
    },
    {
      v: "v0.2.702",
      d: "2026-10-15",
      l: ["關閉普通攻擊時，自動念咒的技能也依射程走位，不再貼近怪物"],
    },
    {
      v: "v0.2.700",
      d: "2026-10-15",
      l: [
        "關閉普通攻擊時，技能冷卻中改停在下一個技能的射程，不再靠近",
        "大地之擊：射程依裂縫長度（隨範圍變長）",
      ],
    },
    {
      v: "v0.2.698",
      d: "2026-10-15",
      l: [
        "走位：英雄走到「準備施放的技能」打得到的距離就停",
        "技能都在冷卻時，才靠近到普通攻擊的距離",
      ],
    },
    {
      v: "v0.2.692",
      d: "2026-10-15",
      l: ["劍士：怪物靠太近時會小退一步，保持在攻擊距離邊緣"],
    },
    {
      v: "v0.2.690",
      d: "2026-10-15",
      l: [
        "鐵拳：射程 12 → 30，改為隔空砸拳；砸拳動畫重做（蓄力、壓扁、爆閃、停格、碎石）",
        "劍士走到攻擊範圍內就停下，揮擊時不再往前衝進怪群",
      ],
    },
    {
      v: "v0.2.685",
      d: "2026-10-15",
      l: ["鐵拳：新增砸拳動畫，大拳頭從上方砸向目標，地面裂開"],
    },
    {
      v: "v0.2.683",
      d: "2026-10-15",
      l: ["鐵拳：技能頁顯示揮拳資訊、標籤、套用與未生效的輔助寶石"],
    },
    {
      v: "v0.2.682",
      d: "2026-10-15",
      l: [
        "死神之鐮：虛空分身改為複製你的普通攻擊，搭配鐵拳時也套用範圍與輔助寶石",
      ],
    },
    {
      v: "v0.2.681",
      d: "2026-10-15",
      l: ["角色頁「戰鬥方式」新增關閉普通攻擊，開啟後只施放技能"],
    },
    {
      v: "v0.2.680",
      d: "2026-10-15",
      l: [
        "技能頁：顯示輔助寶石（心神凝聚等）與黑狐項鍊給該技能的暴擊傷害",
        "加成明細：暴擊率、暴擊傷害改為該技能的最終數值，含輔助寶石來源",
        "超過上限的數值在括號內顯示未封頂的值，例如暴擊率 100%（130%）",
      ],
    },
    {
      v: "v0.2.677",
      d: "2026-10-15",
      l: [
        "反擊之盾鎧、荊棘之心的反傷改為套用傷害加成（傷害增加、狂怒之槍、對 Boss 等）",
        "反擊之盾鎧：反傷由護甲 150% 提高到 2000%",
        "反擊之盾鎧：血之渴望不再固定為 1 點傷害",
      ],
    },
    {
      v: "v0.2.675",
      d: "2026-10-15",
      l: ["修正技能頁英靈召喚的生命體增殖顯示為 2（實際基礎為 1 隻）"],
    },
    {
      v: "v0.2.674",
      d: "2026-10-15",
      l: [
        "背包裝備詳情：煉金按鈕有 4 個時改為兩排，手機上也點得到洗鍊",
        "洗鍊：武器範圍分成最小傷害範圍、最大傷害範圍兩列",
      ],
    },
    {
      v: "v0.2.673",
      d: "2026-10-15",
      l: [
        "訓練場統計：超過 6 項時，最後一列顯示「其他 N 項」",
        "地圖 → 訓練場頁面列出全部傷害來源與增傷效果",
      ],
    },
    {
      v: "v0.2.672",
      d: "2026-10-15",
      l: ["稀有度、部位排序：相同的獨特裝備排在一起（背包、煉金）"],
    },
    {
      v: "v0.2.671",
      d: "2026-10-15",
      l: ["煉金「部位」排序：同部位再依稀有度、物品等級排序"],
    },
    {
      v: "v0.2.670",
      d: "2026-10-15",
      l: [
        "背包「最新取得」：剛卸下的裝備排在最前面",
        "背包「部位」排序：同部位再依稀有度、物品等級排序",
      ],
    },
    {
      v: "v0.2.669",
      d: "2026-10-15",
      l: ["多選時右側會顯示最後點選裝備的詞綴"],
    },
    {
      v: "v0.2.667",
      d: "2026-10-15",
      l: ["背包新增「多選」：一次分解、萃取、鎖定或解鎖選取的裝備"],
    },
    {
      v: "v0.2.664",
      d: "2026-10-15",
      l: ["修正訓練場統計的神眷詞綴顯示為代碼（dv:judg）"],
    },
    {
      v: "v0.2.663",
      d: "2026-10-15",
      l: ["灌注時一律列出獨特效果符文石，沒有鋁 Lv4 時會提示材料不足"],
    },
    {
      v: "v0.2.662",
      d: "2026-10-15",
      l: ["「不需二次確認」設定也適用於分解裝備與石板"],
    },
    {
      v: "v0.2.661",
      d: "2026-10-15",
      l: [
        "弓手、法師會更早後退，與怪物保持距離",
        "射程內有怪物時直接攻擊，不再走進怪群",
      ],
    },
    {
      v: "v0.2.660",
      d: "2026-10-15",
      l: [
        "設定新增「煉金不需二次確認」，確認視窗也可勾選下次不再跳出",
        "煉金確認視窗改為顯示裝備詞綴，灌注另顯示使用的符文石",
        "訓練場新增「攻擊」設定：假人可在原地向角色發射彈幕",
      ],
    },
    {
      v: "v0.2.657",
      d: "2026-10-15",
      l: ["嘗試修正部分手機瀏覽器開深色模式時，紙張背景被強制變暗、字變淺"],
    },
    {
      v: "v0.2.657",
      d: "2026-10-15",
      l: ["電腦版右側面板不再顯示捲軸（滾輪照常捲動）"],
    },
    {
      v: "v0.2.654",
      d: "2026-10-15",
      l: ["煉金勾選「使用奇蹟石強化本次」時，會顯示本次奇蹟的強化效果"],
    },
    {
      v: "v0.2.653",
      d: "2026-10-15",
      l: ["新石板詞綴「石板探尋」：提高石板的掉落率"],
    },
    {
      v: "v0.2.652",
      d: "2026-10-15",
      l: [
        "修正洗鍊石掉在地上時角色消失（畫面停止繪製）",
        "護盾吸收的傷害數字在暴擊時也會放大顯示",
      ],
    },
    {
      v: "v0.2.649",
      d: "2026-10-15",
      l: [
        "新高階獨特「咒術師之戒」：技能拼圖中的詛咒改為光環，持續對周圍敵人生效",
      ],
    },
    {
      v: "v0.2.646",
      d: "2026-10-15",
      l: [
        "無盡之塔新增挑戰模式（每層 15 秒）；煉金可勾選直接使用奇蹟石",
        "背包可篩選已鎖定；低階保護石可自動合成高階；基底顯示改為一行",
        "修正：奇蹟說明漏了洗鍊、批次萃取無法萃取神話裝備；設定頁移除自動挑戰塔",
      ],
    },
    { v: "v0.2.632", d: "2026-10-15", l: ["新材料「聖玉」更名為「洗鍊石」"] },
    {
      v: "v0.2.629",
      d: "2026-10-15",
      l: [
        "新主宰「鐵拳」（玩家投稿）；新材料「洗鍊石」可重洗基底",
        "石板改為全地圖共用；新增消極模式、召喚物數量顯示、基底品質排序",
        "修正多項顯示錯誤；冥門擊殺特效不再讓畫面閃爍",
      ],
    },
    {
      v: "v0.2.610",
      d: "2026-10-15",
      l: ["修正使用中的石板詞綴很多時，更換石板視窗看不到下方的石板清單"],
    },
    {
      v: "v0.2.608",
      d: "2026-10-14",
      l: [
        "設定新增「隱藏掉落訊息」：戰鬥畫面中間不再顯示拾取訊息",
        "修正從背景回來時，地上偶爾留下撿不起來的掉落物殘影",
      ],
    },
    {
      v: "v0.2.606",
      d: "2026-10-14",
      l: [
        "多個主動技能同時可施放時，改為等待最久的先施放",
        "修正巴基力鎧甲等冷卻很短時，排在後面的技能（如新取得的傳說寶石）完全不施放",
      ],
    },
    {
      v: "v0.2.605",
      d: "2026-10-14",
      l: ["背包萃取／灌注／磨礪改為直接跳出視窗，不再切換到煉金分頁"],
    },
    {
      v: "v0.2.604",
      d: "2026-10-14",
      l: ["修正電腦切到背景掛機時，掉落物不會被撿起"],
    },
    {
      v: "v0.2.602",
      d: "2026-10-14",
      l: [
        "摸魚模式：開啟時日誌會提示離開方式",
        "點最下方輸入列的 exit 也能離開",
      ],
    },
    {
      v: "v0.2.601",
      d: "2026-10-14",
      l: ["摸魚模式：左上角離開按鈕加大，手機點左上角整塊區域即可離開"],
    },
    {
      v: "v0.2.600",
      d: "2026-10-14",
      l: ["修正電腦版獸人酋長之戒的詞綴圖示擋住每分鐘擊殺"],
    },
    {
      v: "v0.2.599",
      d: "2026-10-14",
      l: [
        "新增摸魚模式（設定，或按 ` 鍵）：畫面變成終端機，拾取與訊息以日誌顯示",
        "按 Esc 或左上角紅點離開；重新開啟網頁會保留摸魚模式",
      ],
    },
    {
      v: "v0.2.598",
      d: "2026-10-14",
      l: ["修正高攻速時實際攻擊次數低於面板的每秒攻擊次數"],
    },
    {
      v: "v0.2.597",
      d: "2026-10-14",
      l: ["放在其他地圖的使用中石板也能灌注（之前只限目前地圖）"],
    },
    {
      v: "v0.2.596",
      d: "2026-10-14",
      l: ["地圖 1-4 的石板欄位增加為 3 個（擊殺 1000 隻開啟下一格）"],
    },
    {
      v: "v0.2.594",
      d: "2026-10-14",
      l: [
        "行動速度也會加快技能的出手動作（最多 3 倍）",
        "冷卻很短時，技能施放次數因此提高",
      ],
    },
    {
      v: "v0.2.587",
      d: "2026-10-14",
      l: ["修正部分裝置煉金結果視窗看不到文字與按鈕"],
    },
    {
      v: "v0.2.586",
      d: "2026-10-14",
      l: [
        "無盡之塔起始樓層改為下拉選單，可選任一存檔點（第 1、11、21 層…）",
        "自動挑戰無盡之塔也從選擇的樓層開始",
      ],
    },
    {
      v: "v0.2.584",
      d: "2026-10-14",
      l: [
        "輔助範圍改為增加相加、減少相乘：只有集中攻擊為相乘，其他回到改版前",
        "時光敏捷戰靴：氣勢等暫時的移動速度加成也會提高行動速度",
        "角色屬性的行動速度也會顯示戰鬥中的數值",
      ],
    },
    {
      v: "v0.2.583",
      d: "2026-10-14",
      l: [
        "輔助寶石的範圍改為相乘計算，疊多顆集中攻擊範圍不再變成負數",
        "修正定位陷阱等技能疊集中攻擊後打不到敵人",
        "技能頁範圍改為顯示倍率（例：×0.49）",
      ],
    },
    {
      v: "v0.2.581",
      d: "2026-10-14",
      l: [
        "角色屬性的攻擊次數、移動速度、閃避率會顯示戰鬥中的數值（含氣勢等暫時加成）",
      ],
    },
    { v: "v0.2.579", d: "2026-10-14", l: ["商人的主動技能說明加上冷卻時間"] },
    {
      v: "v0.2.578",
      d: "2026-10-14",
      l: [
        "點擊戰鬥畫面上方的圖示（電腦版滑過）可查看技能、疊層、竊取詞綴的說明",
        "排行榜可點選玩家，查看他刷新紀錄時的裝備、技能拼圖與天賦",
        "保留規則的稀有度條件新增「神話」",
      ],
    },
    { v: "v0.2.566", d: "2026-10-14", l: ["鑲嵌新增部位與種類篩選"] },
    {
      v: "v0.2.565",
      d: "2026-10-14",
      l: ["修正自動挑戰首領時，地圖頁的碎片數量沒有更新"],
    },
    {
      v: "v0.2.564",
      d: "2026-10-14",
      l: [
        "修正攻速很高時技能幾乎不會施放",
        "活動巴風特可勾選「自動」挑戰",
        "拾取篩選新增「神話」（主宰不受影響）",
      ],
    },
    {
      v: "v0.2.560",
      d: "2026-10-14",
      l: [
        "石板詞綴「穿梭寶石」可點選或滑過查看說明",
        "資料庫補上穿梭寶石的石板詞綴來源",
      ],
    },
    {
      v: "v0.2.558",
      d: "2026-10-14",
      l: ["修正部分文字缺字", "背包分頁「符文石」改為「符文」，避免換行"],
    },
    {
      v: "v0.2.556",
      d: "2026-10-14",
      l: [
        "石板偏向改為提高部位掉落機率，多條偏向不再互相抵消",
        "新增石板詞綴：稀有度提升、詞綴提升",
        "舊石板的偏向數值已自動換算",
      ],
    },
    {
      v: "v0.2.555",
      d: "2026-10-14",
      l: [
        "裝備、符文石、石板上限皆提高為 5000",
        "存檔改為壓縮儲存，多角色也不易超出容量",
        "符文石與石板列表改為分批顯示，數量多時不卡頓",
      ],
    },
    {
      v: "v0.2.554",
      d: "2026-10-14",
      l: ["存檔失敗（儲存空間不足）時會顯示提示"],
    },
    {
      v: "v0.2.552",
      d: "2026-10-14",
      l: ["訓練場新增「位置」設定：假人可被擊退、拉扯"],
    },
    {
      v: "v0.2.549",
      d: "2026-10-14",
      l: [
        "背包稀有度篩選新增「插槽・異種」「插槽・任意」",
        "批次分解與保留規則的插槽條件可選擇異種或任意",
        "鑲嵌說明新增異種與任意的差別",
      ],
    },
    {
      v: "v0.2.548",
      d: "2026-10-14",
      l: [
        "獨立相乘的傷害效果統一改用「×」標示（效果不變）",
        "例：惡魔之眼「對 Boss 傷害 ×1.25」、獵殺「×1.2」",
      ],
    },
    {
      v: "v0.2.547",
      d: "2026-10-14",
      l: [
        "訓練場：進入後再設定假人",
        "訓練場 DPS 改為直接顯示在戰鬥畫面左下，點一下切換傷害來源／增傷效果",
      ],
    },
    {
      v: "v0.2.546",
      d: "2026-10-14",
      l: ["雷神之戒的技能傷害改標示為「×2」（與其他技能傷害相乘，效果不變）"],
    },
    {
      v: "v0.2.545",
      d: "2026-10-14",
      l: [
        "新增訓練場（地圖 → 試煉）：對假人測試構築的實際傷害",
        "點畫面左下的 DPS：各技能傷害佔比、增傷效果的平均倍率",
      ],
    },
    {
      v: "v0.2.544",
      d: "2026-10-14",
      l: ["資料庫「遊戲機制 → 技能」新增技能範圍的計算方式"],
    },
    {
      v: "v0.2.543",
      d: "2026-10-14",
      l: ["離線收益說明（?）補上：離線擊殺不計入怪物卡牌與神器經驗"],
    },
    { v: "v0.2.540", d: "2026-10-14", l: ["資料庫「遊戲機制」新增怪物卡牌"] },
    {
      v: "v0.2.539",
      d: "2026-10-14",
      l: ["離線收益視窗新增說明（?）", "資料庫「遊戲機制」新增離線收益"],
    },
    {
      v: "v0.2.538",
      d: "2026-10-14",
      l: ["離線掉落提高為 25%", "離線擊殺速度上限由每分鐘 40 提高為 250"],
    },
    {
      v: "v0.2.537",
      d: "2026-10-14",
      l: [
        "石板／無盡之塔「死亡爆炸」：英雄一定會走出爆炸範圍",
        "近戰不再因貼身擊殺而吃到爆炸",
      ],
    },
    {
      v: "v0.2.536",
      d: "2026-10-14",
      l: [
        "離線經驗提高為 75%，最多升到所在地圖的等級上限",
        "已有 Lv127 角色時，其他角色離線經驗 100%，不受上限",
        "離線掉落維持 10%",
      ],
    },
    { v: "v0.2.535", d: "2026-10-14", l: ["后冠說明補上技能格上限 36 格"] },
    {
      v: "v0.2.534",
      d: "2026-10-14",
      l: [
        "活動說明補上：同名神眷詞綴僅計算最高的一條",
        "資料庫修正收割、靈魂收割的數值顯示",
      ],
    },
    {
      v: "v0.2.532",
      d: "2026-10-14",
      l: [
        "守護之靈、殘影、貫穿、致命爆裂的說明補上上限",
        "冰緩說明補上效果上限 75%",
      ],
    },
    {
      v: "v0.2.531",
      d: "2026-10-14",
      l: ["資料庫「遊戲機制」新增防禦、技能、掉落"],
    },
    {
      v: "v0.2.529",
      d: "2026-10-14",
      l: ["資料庫新增「遊戲機制」分頁：傷害計算、異常狀態"],
    },
    {
      v: "v0.2.527",
      d: "2026-10-14",
      l: ["致命塗毒可連結任何主動技能", "毒刃等效果造成的中毒也可多疊 2 層"],
    },
    {
      v: "v0.2.526",
      d: "2026-10-14",
      l: ["中毒說明修正：每層同時倒數，每秒合計所有層的傷害一次造成"],
    },
    {
      v: "v0.2.525",
      d: "2026-10-14",
      l: ["技能拼圖說明（?）新增「中毒」頁：層數與刷新規則"],
    },
    { v: "v0.2.524", d: "2026-10-14", l: ["批次分解新增「神話」稀有度勾選"] },
    {
      v: "v0.2.523",
      d: "2026-10-14",
      l: ["電腦切到其他分頁或縮小視窗時，戰鬥照常進行"],
    },
    {
      v: "v0.2.521",
      d: "2026-10-14",
      l: ["技能拼圖新增「清空」：一次取下格子中全部寶石"],
    },
    {
      v: "v0.2.520",
      d: "2026-10-13",
      l: [
        "詛咒改為聰明施放：周圍一半以上的敵人未中詛咒（或頭目、菁英未中）時才施放",
      ],
    },
    {
      v: "v0.2.518",
      d: "2026-10-13",
      l: ["魔法力增幅改為三職業共用，可在商人購買，不再以穿梭寶石掉落"],
    },
    {
      v: "v0.2.517",
      d: "2026-10-13",
      l: [
        "致命爆裂、致命塗毒改為三職業共用，可在商人購買",
        "這兩顆不再以穿梭寶石掉落",
      ],
    },
    {
      v: "v0.2.516",
      d: "2026-10-13",
      l: [
        "範圍擴展、擴散增幅、屬性研究改為三職業共用，可在商人購買",
        "這三顆不再以穿梭寶石掉落",
      ],
    },
    {
      v: "v0.2.515",
      d: "2026-10-13",
      l: [
        "劍士也能在商人購買生命體增殖、生命體強化（搭配英靈召喚）",
        "這兩顆不再以穿梭寶石掉落",
      ],
    },
    {
      v: "v0.2.514",
      d: "2026-10-13",
      l: [
        "連續射擊連結FAW 魔導機甲時，FAW 魔導機甲每次射擊多射 1 次（60% 傷害），不再額外架設FAW 魔導機甲",
      ],
    },
    {
      v: "v0.2.513",
      d: "2026-10-13",
      l: [
        "連續射擊、二刀連擊連結召喚元素精靈或英靈召喚時，召喚物每次攻擊多攻擊 1／2 次（60% 傷害）",
      ],
    },
    {
      v: "v0.2.511",
      d: "2026-10-13",
      l: ["神秘金屬、鋁合成新增 X1000、X10000"],
    },
    {
      v: "v0.2.508",
      d: "2026-10-13",
      l: [
        "闇答萊屍可以自動挑戰：勾選君主卡挑戰按鈕下的「自動」",
        "順序：闇答萊屍、巴風特、守護者",
      ],
    },
    {
      v: "v0.2.507",
      d: "2026-10-13",
      l: ["修正資料庫中石板詞綴「穿梭寶石」的機率顯示"],
    },
    {
      v: "v0.2.505",
      d: "2026-10-13",
      l: [
        "劍士新技能：冰霜龍息、毒刃、英靈召喚；法師：毒霧",
        "新增穿梭寶石（其他職業的輔助）：Lv90 菁英、頭目與石板詞綴掉落",
        "魔法力增幅、屬性研究改為限元素技能；冰緩會延緩菁英詞綴攻擊",
      ],
    },
    {
      v: "v0.2.503",
      d: "2026-10-13",
      l: ["分解、萃取主宰改為長按按鈕：按住 1.5 秒才會執行，放開即取消"],
    },
    {
      v: "v0.2.501",
      d: "2026-10-13",
      l: [
        "分解或萃取主宰時，確認視窗會提醒這是超稀有裝備（掉落率 1/100000）",
      ],
    },
    {
      v: "v0.2.499",
      d: "2026-10-13",
      l: ["背包石板頁的稀有度篩選新增「插槽」"],
    },
    {
      v: "v0.2.498",
      d: "2026-10-13",
      l: [
        "分解寶石改到「未放置的寶石」下方，跟合成一樣在視窗裡挑選",
        "可一次選多顆或全選，每顆 +100 Zeny",
      ],
    },
    {
      v: "v0.2.496",
      d: "2026-10-13",
      l: [
        "一般技能寶石也可以分解（+100 Zeny）：技能頁選取寶石後按「分解寶石」",
      ],
    },
    {
      v: "v0.2.494",
      d: "2026-10-13",
      l: [
        "變異寶石合成改到「未放置的寶石」：展開技能後按「合成」，不用先拿起寶石",
      ],
    },
    {
      v: "v0.2.493",
      d: "2026-10-13",
      l: [
        "武器基礎暴擊率提高：劍 5%→8%、弓 7%→10%、法杖 6%→9%",
        "已持有的武器同步提高",
      ],
    },
    {
      v: "v0.2.492",
      d: "2026-10-13",
      l: [
        "新增變異寶石合成：3 顆同技能變異寶石＋1000 Zeny，合成 1 顆新形狀",
        "技能頁選取變異寶石後按「合成」",
      ],
    },
    {
      v: "v0.2.491",
      d: "2026-10-13",
      l: ["FAW 魔導機甲射擊速度提高：武器攻速的 60% → 80%"],
    },
    {
      v: "v0.2.489",
      d: "2026-10-13",
      l: ["FAW 魔導機甲射擊速度改為武器攻速的 60%（原本固定每 0.9 秒一發）"],
    },
    {
      v: "v0.2.488",
      d: "2026-10-13",
      l: [
        "聖十字權杖也計入暫時的攻擊速度加成（犬妖弓、氣勢等）",
        "FAW 魔導機甲說明精簡",
      ],
    },
    {
      v: "v0.2.487",
      d: "2026-10-13",
      l: ["新獨特武器「聖十字權杖」：召喚物會獲得等同你獲得的攻擊速度加成"],
    },
    {
      v: "v0.2.485",
      d: "2026-10-13",
      l: [
        "衰弱、緩慢、弱點詛咒開放給劍士與弓手使用",
        "修正：弓手 15、22 級任務獎勵的寶石恢復為毒箭射擊、多重箭矢",
      ],
    },
    {
      v: "v0.2.483",
      d: "2026-10-13",
      l: ["弓手也能使用輔助寶石「擴散增幅」（範圍 +40%、傷害 +15%）"],
    },
    {
      v: "v0.2.482",
      d: "2026-10-13",
      l: ["使用中（已放入地圖）的石板也能鎖定，取出後仍保持鎖定"],
    },
    {
      v: "v0.2.481",
      d: "2026-10-13",
      l: [
        "世界樹之戒：樹苗攻擊傷害 30% → 100% 普攻傷害",
        "闇答萊屍冥府權杖：亡靈戰士傷害 50% → 100% 武器傷害",
      ],
    },
    {
      v: "v0.2.480",
      d: "2026-10-13",
      l: ["資料庫的詞綴階級表新增 T0（神秘金屬 Lv4 升階才會出現）"],
    },
    {
      v: "v0.2.478",
      d: "2026-10-13",
      l: [
        "打贏 Boss 後在專屬場地停留的時間由 30 秒縮短為 5 秒（離開時會自動撿起所有掉落物）",
      ],
    },
    {
      v: "v0.2.477",
      d: "2026-10-13",
      l: ["8 個轉職天賦的說明改寫得更清楚（效果不變）"],
    },
    {
      v: "v0.2.475",
      d: "2026-10-13",
      l: ["石板也能鎖定：鎖定的石板不會被分解或批次萃取"],
    },
    {
      v: "v0.2.472",
      d: "2026-10-13",
      l: ["符文石批次分解：裝備符文與石板符文分開設定（石板符文預設不分解）"],
    },
    {
      v: "v0.2.471",
      d: "2026-10-13",
      l: [
        "石板符文的自動分解重設為「不自動分解」（需要時請到背包符文石頁重新設定）",
      ],
    },
    {
      v: "v0.2.470",
      d: "2026-10-13",
      l: ["石板的危險詞綴不再標示「危險」前綴（紅字即代表危險）"],
    },
    {
      v: "v0.2.469",
      d: "2026-10-13",
      l: [
        "背包可直接磨礪；按鈕改小，分三排",
        "符文石新增部位、階級篩選與依詞綴分組；石板顯示危險度",
        "煉金可篩選全部裝備或石板；角色說明新增技能與召喚物傷害公式",
      ],
    },
    {
      v: "v0.2.465",
      d: "2026-10-13",
      l: ["角色頁自動藥水說明改為兩行，不再擠成一段"],
    },
    {
      v: "v0.2.463",
      d: "2026-10-13",
      l: ["角色頁「自動藥水」新增：藥水用完時自動消耗Zeny購買"],
    },
    {
      v: "v0.2.462",
      d: "2026-10-13",
      l: ["地圖頁新解鎖的分頁會標示 NEW，開啟一次後消失"],
    },
    {
      v: "v0.2.460",
      d: "2026-10-13",
      l: [
        "地圖頁分頁改為「一般地圖／活動／試煉／終局／統計」",
        "終局分頁：守護者、無盡之塔、闇答萊屍",
      ],
    },
    {
      v: "v0.2.458",
      d: "2026-10-13",
      l: [
        "地圖頁分為「地圖／挑戰／統計」三個分頁",
        "活動、轉職試煉、守護者與無盡之塔移至「挑戰」",
      ],
    },
    {
      v: "v0.2.457",
      d: "2026-10-12",
      l: [
        "新增匿名遊玩統計，用來調整關卡難度與遊戲平衡",
        "隱私權政策已更新：說明收集的匿名紀錄內容",
      ],
    },
    {
      v: "v0.2.456",
      d: "2026-10-12",
      l: ["未使用的角色也會累積離線收益，切換回該角色時領取（上限 8 小時）"],
    },
    {
      v: "v0.2.455",
      d: "2026-10-12",
      l: ["修正：部分石板點「分解」沒有反應（批次分解不受影響）"],
    },
    {
      v: "v0.2.454",
      d: "2026-10-12",
      l: ["裝備背包上限由 500 件提高為 1000 件"],
    },
    {
      v: "v0.2.453",
      d: "2026-10-12",
      l: ["獲得變異或傳說技能寶石時，技能分頁與寶石上會顯示紅點，查看後消除"],
    },
    {
      v: "v0.2.452",
      d: "2026-10-12",
      l: ["灌注與鑲嵌的詞綴群組改為固定順序，用完 T0 符文石不再換位置"],
    },
    {
      v: "v0.2.451",
      d: "2026-10-12",
      l: ["鑲嵌視窗的符文石依詞綴分組，點選即可展開，與灌注相同"],
    },
    {
      v: "v0.2.449",
      d: "2026-10-12",
      l: [
        "說明、介面、裝備與技能文字統一用詞",
        "改用正式的遊戲說明語氣，讀起來更清楚",
      ],
    },
    {
      v: "v0.2.447",
      d: "2026-10-12",
      l: ["犬妖弓的攻速層數顯示在畫面右上角，技能圖示左邊"],
    },
    {
      v: "v0.2.446",
      d: "2026-10-12",
      l: ["修正石板詞綴「變異寶石」「插槽石板」的數值範圍顯示錯誤"],
    },
    {
      v: "v0.2.445",
      d: "2026-10-12",
      l: [
        "召喚物預設不吃你的暴擊，要有「元素共鳴」才吃",
        "世界樹之戒的樹苗也照這個規則",
        "FAW 魔導機甲例外：射擊一直使用你的暴擊（寫在寶石說明）",
      ],
    },
    {
      v: "v0.2.444",
      d: "2026-10-12",
      l: ["天賦「元素共鳴」也讓闇答萊屍神器的亡靈套用你的暴擊率和暴擊傷害"],
    },
    {
      v: "v0.2.442",
      d: "2026-10-12",
      l: ["說明視窗分頁顯示，一次只看一個主題"],
    },
    {
      v: "v0.2.440",
      d: "2026-10-12",
      l: ["商人和技能說明告訴你：同一種寶石可以放很多顆"],
    },
    {
      v: "v0.2.438",
      d: "2026-10-12",
      l: ["技能頁底部會提示「未放置的寶石」，點一下捲到寶石清單"],
    },
    {
      v: "v0.2.437",
      d: "2026-10-12",
      l: ["沒有符文石時也能打開自動分解設定，誤設成全部分解也改得回來"],
    },
    {
      v: "v0.2.436",
      d: "2026-10-12",
      l: ["符文石自動分解分成裝備符文和石板符文，各自設定"],
    },
    {
      v: "v0.2.434",
      d: "2026-10-12",
      l: [
        "灌注的符文石依詞綴分組，點開才列出，高階在上",
        "商人改成分頁：補給、主動技能、輔助技能",
        "稀有度篩選改叫「全部稀有度」",
      ],
    },
    {
      v: "v0.2.426",
      d: "2026-10-12",
      l: [
        "主畫面 App 裡的資料庫改成在遊戲內打開",
        "右上角「關閉」或返回手勢就回到遊戲",
      ],
    },
    {
      v: "v0.2.423",
      d: "2026-10-12",
      l: [
        "搬到新網址時，Google 雲端存檔綁定也會一起帶過去",
        "搬家後會提醒重新綁定 Google",
        "雲端存檔二選一時，同時列出這台和雲端的角色",
      ],
    },
    {
      v: "v0.2.420",
      d: "2026-10-12",
      l: [
        "「指定獨特」改成挑選視窗：每件獨特都有圖示和效果說明",
        "主宰（獸人酋長之戒）不會出現在清單裡",
      ],
    },
    {
      v: "v0.2.415",
      d: "2026-10-12",
      l: [
        "保留規則的「獨特」條件可以指定是哪幾件獨特",
        "拾取篩選勾獨特＋保留指定的獨特，其餘自動分解",
      ],
    },
    {
      v: "v0.2.413",
      d: "2026-10-12",
      l: ["修正法師施法時，手上的法杖看起來斷成好幾截"],
    },
    {
      v: "v0.2.412",
      d: "2026-10-12",
      l: [
        "遊戲搬到新網址 ro-wanderer.v3.com",
        "從舊網址打開會自動帶著存檔跳過去",
      ],
    },
    {
      v: "v0.2.410",
      d: "2026-10-12",
      l: [
        "拾取篩選可以勾「插槽」：撿起插槽裝備就自動分解",
        "勾選時會跳出確認，提醒插槽裝備是稀有掉落",
      ],
    },
    {
      v: "v0.2.407",
      d: "2026-10-12",
      l: [
        "技能拼圖：寶石放到另一顆上會交換，舊的拿到手上",
        "同時蓋到兩顆以上時，維持紅色放不下",
      ],
    },
    {
      v: "v0.2.405",
      d: "2026-10-12",
      l: ["手機橫放時，較窄的手機也會切換成左畫面、右介面的版面"],
    },
    {
      v: "v0.2.403",
      d: "2026-10-12",
      l: [
        "石板背包頁和放入石板視窗可以用規則篩選：符合／不符合保留規則，或自訂條件",
      ],
    },
    {
      v: "v0.2.401",
      d: "2026-10-12",
      l: ["升級提示只在解鎖新技能格時才顯示技能格數量"],
    },
    {
      v: "v0.2.400",
      d: "2026-10-12",
      l: ["建立角色時，名稱欄和下方按鈕的文字改成深色，看得清楚了"],
    },
    {
      v: "v0.2.399",
      d: "2026-10-11",
      l: ["放了石板的地圖，召喚 Boss 一律需要擊殺 200 隻"],
    },
    {
      v: "v0.2.397",
      d: "2026-10-11",
      l: [
        "守護者印記的掉落率不再受地圖等級影響，每張石板地圖都一樣",
        "古樹印記約 2～3 倍好拿，熔核印記也提高",
      ],
    },
    {
      v: "v0.2.396",
      d: "2026-10-11",
      l: ["在無盡之塔時，地圖頁的石板詞綴改為顯示正確數值，不再全部是 0%"],
    },
    {
      v: "v0.2.395",
      d: "2026-10-11",
      l: [
        "每件獨特裝備都有自己的專屬圖示，一眼就認得出來",
        "獨特武器依職業各有劍、弓、法杖三種樣子",
      ],
    },
    {
      v: "v0.2.392",
      d: "2026-10-11",
      l: [
        "召喚物傷害詞綴的高階更容易出現（T1 約 3 倍）",
        "召喚物傷害詞綴現在也會出現在戒指上",
      ],
    },
    {
      v: "v0.2.391",
      d: "2026-10-11",
      l: ["自動更新或切到背景時，地上的掉落物會先收進背包"],
    },
    {
      v: "v0.2.389",
      d: "2026-10-11",
      l: ["關閉鑲嵌視窗時，放入插槽但還沒鑲嵌的符文石會退回符文石列表"],
    },
    {
      v: "v0.2.388",
      d: "2026-10-11",
      l: ["等級不足的裝備也能在背包看到裝備後的屬性變化"],
    },
    {
      v: "v0.2.386",
      d: "2026-10-11",
      l: [
        "暴擊率上限 95% → 100%",
        "新獨特戒指「黑狐項鍊」：暴擊率超過 100% 的部分轉為暴擊傷害（Lv60 以上掉落）",
      ],
    },
    {
      v: "v0.2.384",
      d: "2026-10-11",
      l: [
        "雲端存檔：同一個 Google 帳號一次只能在一台裝置玩",
        "換裝置開始玩時，舊裝置會停下，按「在這裡繼續」可接回",
      ],
    },
    {
      v: "v0.2.382",
      d: "2026-10-11",
      l: ["Google 登入按鈕改成遊戲風格", "「雲端有另一份存檔」視窗間距修正"],
    },
    {
      v: "v0.2.381",
      d: "2026-10-11",
      l: [
        "修正：Google 登入後視窗不會關閉",
        "修正：雲端存檔選「保留這台的」沒有反應",
      ],
    },
    {
      v: "v0.2.380",
      d: "2026-10-11",
      l: ["存檔備份只保留 Google 雲端存檔，移除存檔碼匯出／匯入"],
    },
    {
      v: "v0.2.379",
      d: "2026-10-11",
      l: [
        "新增雲端存檔：選單 → 設定 → 存檔備份 → 綁定 Google",
        "所有角色自動備份，換手機登入同一個帳號就能載入",
      ],
    },
    {
      v: "v0.2.375",
      d: "2026-10-11",
      l: [
        "技能分頁的寶石按技能排好：同一個技能的變異寶石收進同一格",
        "點那一格展開所有形狀（原形狀在前，格子少的在前），再點形狀拿起來",
      ],
    },
    {
      v: "v0.2.374",
      d: "2026-10-11",
      l: [
        "「關閉暴擊畫面晃動」改成「關閉畫面晃動」：Boss、技能等所有晃動都會關掉",
      ],
    },
    {
      v: "v0.2.373",
      d: "2026-10-11",
      l: ["設定 → 畫面新增「關閉暴擊畫面晃動」"],
    },
    {
      v: "v0.2.372",
      d: "2026-10-11",
      l: [
        "自動挑戰終局頭目改成每個頭目自己勾：挑戰按鈕下方的「自動」",
        "原本有打開的，四個頭目都會先勾好",
      ],
    },
    {
      v: "v0.2.370",
      d: "2026-10-11",
      l: [
        "修正：開著「自動挑戰 Boss」時，會自動花神之碎片挑戰巴風特",
        "巴風特現在只能手動挑戰",
      ],
    },
    {
      v: "v0.2.369",
      d: "2026-10-11",
      l: ["規則的「非」沒啟用時改成灰色半透明，比較好分辨"],
    },
    {
      v: "v0.2.368",
      d: "2026-10-11",
      l: [
        "規則條件可以按「非」反轉：例如「非 獨特」＝不是獨特的裝備",
        "保留規則、石板規則、萃取規則和自訂篩選都能用",
      ],
    },
    {
      v: "v0.2.366",
      d: "2026-10-11",
      l: [
        "陣亡後戰鬥畫面左下出現「陣亡回顧」：致命一擊、死前 8 秒的傷害來源和生命變化",
      ],
    },
    {
      v: "v0.2.365",
      d: "2026-10-11",
      l: ["閒置 15 分鐘沒操作，會自動進入純畫面模式（點畫面退出）"],
    },
    { v: "v0.2.364", d: "2026-10-11", l: ["設定 → 畫面新增「隱藏傷害數字」"] },
    {
      v: "v0.2.363",
      d: "2026-10-11",
      l: ["二刀連擊改為所有非投射物的主動技能都能連結（狂擊也可以）"],
    },
    { v: "v0.2.362", d: "2026-10-11", l: ["掛機統計移到地圖頁最上方"] },
    {
      v: "v0.2.361",
      d: "2026-10-11",
      l: [
        "批次萃取可以切換到「石板」，用石板自己的萃取規則（種類、危險度、石板詞綴…）",
      ],
    },
    {
      v: "v0.2.358",
      d: "2026-10-11",
      l: [
        "職業選擇頁重新設計：遊戲名稱「流浪仙境」",
        "職業卡改成定位標籤＋生命／射程／範圍能力格",
      ],
    },
    {
      v: "v0.2.357",
      d: "2026-10-11",
      l: ["取消額外施放上限：連續射擊與二刀連擊可以無限疊加"],
    },
    {
      v: "v0.2.356",
      d: "2026-10-11",
      l: [
        "劍士新寶石「二刀連擊」：相鄰範圍技能額外再打 2 次",
        "自動念咒的技能也會吃連續射擊／二刀連擊的額外施放",
        "每個技能的額外施放最多 4 次",
      ],
    },
    {
      v: "v0.2.353",
      d: "2026-10-11",
      l: [
        "群聚石板加強：怪物數量上限 +2~4 → +4~8",
        "已有的群聚石板數值一起翻倍",
      ],
    },
    {
      v: "v0.2.352",
      d: "2026-10-11",
      l: ["荊棘之心取消上限：超過 1500 的護甲每 100 點傷害 +2%"],
    },
    {
      v: "v0.2.350",
      d: "2026-10-11",
      l: [
        "狂戰士更痛：血怒改為傷害 ×1.5，越戰越勇每 10% +5%",
        "守護騎士更坦也更痛：堅盾護甲 ×1.4，不動如山減傷 20%",
        "荊棘之心：每 100 護甲傷害 +1.5%（上限 50%）",
      ],
    },
    {
      v: "v0.2.345",
      d: "2026-10-10",
      l: ["冷卻縮減不再有 50% 上限（最高可到 90%）"],
    },
    {
      v: "v0.2.344",
      d: "2026-10-10",
      l: [
        "終局頭目變強：生命提高、出招更頻繁",
        "狩獵石板改為「怪物生成速度 +20~40%」",
        "85 級以後升級需要更多經驗",
      ],
    },
    {
      v: "v0.2.341",
      d: "2026-10-10",
      l: [
        "修正：離線收益視窗在手機上文字被擠成一字一行",
        "放入背包的稀有度統計改成兩欄排列",
      ],
    },
    {
      v: "v0.2.340",
      d: "2026-10-10",
      l: [
        "選單 → 設定新增「存檔備份」：所有角色可以匯出成存檔碼或檔案，換手機時匯入",
        "瀏覽器會盡量保留存檔，不被自動清除",
      ],
    },
    {
      v: "v0.2.339",
      d: "2026-10-10",
      l: [
        "排行榜：第一次上傳不再限制層數",
        "層數審核改用無盡之塔裡實際打出的 DPS，標準也放寬了",
      ],
    },
    {
      v: "v0.2.338",
      d: "2026-10-10",
      l: [
        "排行榜加入防偽造檢查：每次上傳的層數會依時間與 DPS 審核",
        "角色名稱不能再使用隱形字元或方向控制字元",
      ],
    },
    {
      v: "v0.2.337",
      d: "2026-10-10",
      l: [
        "冥府權杖：召喚機率 25%，持續 7 秒（進化後 12 秒）",
        "亡靈也吃召喚物數量、召喚物傷害與召喚物攻速天賦",
      ],
    },
    {
      v: "v0.2.336",
      d: "2026-10-10",
      l: [
        "冥府權杖改版：擊殺有 10% 機率召喚亡靈戰士，近戰造成武器傷害的 50%",
        "進化後最多 10 隻、持續 7 秒；覺醒後攻擊更快，傷害會擴散增幅到附近敵人",
      ],
    },
    {
      v: "v0.2.334",
      d: "2026-10-10",
      l: [
        "新詞綴「召喚物傷害」（武器、頭盔、項鍊）",
        "召喚物（召喚元素精靈、FAW 魔導機甲、樹苗、亡靈）改吃傷害增加＋召喚物傷害，不再吃技能傷害",
      ],
    },
    {
      v: "v0.2.332",
      d: "2026-10-10",
      l: [
        "闇答萊屍神器改成「冥府權杖」：擊殺敵人召喚亡靈幫你戰鬥，亡靈擊殺會再召喚",
        "進化後亡靈更多、更久；覺醒後亡靈消失時自爆",
      ],
    },
    {
      v: "v0.2.328",
      d: "2026-10-10",
      l: [
        "拾取篩選會分解不符合保留規則的神眷詞綴裝備；想留下可以加「神眷詞綴」保留規則",
      ],
    },
    {
      v: "v0.2.327",
      d: "2026-10-10",
      l: [
        "卡牌插畫重畫：每張地圖一幅月夜場景，遠近兩隻怪物",
        "修正卡牌插畫模糊",
        "活動卡的閃光更順，不會停在卡面上",
      ],
    },
    {
      v: "v0.2.321",
      d: "2026-10-10",
      l: [
        "卡牌頁改版成收藏卡：銅銀金卡框、閃卡、未解鎖是卡背",
        "新增活動卡牌：擊殺眾神的怪，解鎖擊中與擊殺特效",
        "選單新增「特效」頁：拖尾和擊中、擊殺特效都在這裡換，可以先預覽",
      ],
    },
    {
      v: "v0.2.313",
      d: "2026-10-10",
      l: ["背包、煉金的篩選和排序選單不會再因為撿到新物品而自己關掉"],
    },
    {
      v: "v0.2.312",
      d: "2026-10-10",
      l: [
        "修正卸下獸人酋長之戒或海神三叉戟（含切換構築）後，偷來的菁英詞綴和漩渦殘留在畫面上",
        "偷來的「加速術」「堅韌」不會在卸下戒指後永久生效",
      ],
    },
    {
      v: "v0.2.311",
      d: "2026-10-10",
      l: ["地圖卡片的 NOW／CLEAR／前往 標籤改成置中對齊"],
    },
    {
      v: "v0.2.310",
      d: "2026-10-10",
      l: [
        "說明改成一個視窗看完全部重點，不用一頁一頁按",
        "轉職、活動、石板等長說明分段列出",
      ],
    },
    {
      v: "v0.2.305",
      d: "2026-10-10",
      l: ["保留規則的「神眷詞綴」條件可以選 T 幾以上"],
    },
    {
      v: "v0.2.304",
      d: "2026-10-09",
      l: [
        "所有確認改成彈出確認視窗：切換地圖、分解、批次分解、挑戰守護者／塔、重置天賦、刪除角色與規則",
        "切換地圖的確認會顯示目前地圖和要前往的地圖",
      ],
    },
    { v: "v0.2.300", d: "2026-10-09", l: ["修正材料說明視窗的文字超出邊框"] },
    {
      v: "v0.2.299",
      d: "2026-10-09",
      l: ["煉金頁的裝備改成清單，不用點開就看得到名稱和每條詞綴"],
    },
    { v: "v0.2.296", d: "2026-10-09", l: ["資料庫頁面拿掉「回到遊戲」按鈕"] },
    {
      v: "v0.2.294",
      d: "2026-10-09",
      l: [
        "煉金頁重新設計：上方分頁切換萃取／灌注／合成／鑲嵌，裝備格子放大",
        "點裝備跳出煉金視窗，確認改成獨立的確認視窗",
        "材料只顯示這一頁用得到的，點材料看用途",
      ],
    },
    {
      v: "v0.2.289",
      d: "2026-10-09",
      l: [
        "背包、煉金的稀有度篩選多了「神眷詞綴」",
        "保留規則可以選「神眷詞綴」條件，指定詞綴也能選神眷詞綴",
      ],
    },
    {
      v: "v0.2.288",
      d: "2026-10-09",
      l: [
        "地圖、守護者、神器卡片的文字都改成一行一項，不再擠成一大串",
        "修正石板面板顯示程式碼文字的問題",
      ],
    },
    {
      v: "v0.2.281",
      d: "2026-10-09",
      l: [
        "守護者、巴風特、無盡之塔、闇答萊屍改成場景圖卡，印記和碎片用圖示顯示",
        "諸神黃昏不再掉落守護者印記",
        "守護者卡片直接列出會掉印記的地圖",
      ],
    },
    {
      v: "v0.2.280",
      d: "2026-10-09",
      l: [
        "神器上限改成 100 級：50 級進化、100 級覺醒，升級需要的擊殺多很多",
        "每級屬性改成 1/10（滿級和以前 10 級一樣）；重複神器獻祭改成 5000 經驗",
      ],
    },
    {
      v: "v0.2.279",
      d: "2026-10-09",
      l: ["挑戰巴風特改成要 10 片同一位神的碎片"],
    },
    {
      v: "v0.2.278",
      d: "2026-10-09",
      l: [
        "活動 Boss 改成用神之碎片挑戰：雷靈、海妖、冥魂各有 0.1% 掉落自己神的碎片，1 片挑戰一次那位神的化身",
        "活動地圖不再用擊殺數開 Boss",
      ],
    },
    {
      v: "v0.2.276",
      d: "2026-10-09",
      l: [
        "神器面板重新設計：大圖示、等級與經驗、效果一覽表和三個成長階段",
        "海神三叉戟的漩渦更明顯了",
      ],
    },
    { v: "v0.2.274", d: "2026-10-09", l: ["地圖分頁圖卡上的 Boss 不再模糊"] },
    {
      v: "v0.2.273",
      d: "2026-10-09",
      l: [
        "諸神黃昏可以放石板了（最多 3 塊，怪物維持 90 級），也會掉星穹印記",
      ],
    },
    {
      v: "v0.2.272",
      d: "2026-10-09",
      l: [
        "地圖分頁重新設計：每張地圖都是一張圖卡，畫出那裡的地形、怪物和 Boss",
        "活動、轉職試煉也改成圖卡；掛機統計改成數字格",
      ],
    },
    {
      v: "v0.2.269",
      d: "2026-10-09",
      l: [
        "活動「諸神黃昏」開跑：90 級可前往諸神黃昏，Boss 隨機是雷神索爾、海神或闇答萊屍的化身",
        "新掉落：金色神眷詞綴（只在活動地圖）、六件活動獨特、三件可升級的神器（角色分頁）",
        "構築切換也會記住戴著的神器",
      ],
    },
    {
      v: "v0.2.262",
      d: "2026-10-09",
      l: [
        "自動挑戰的開打生命可以自己設定（選單 → 設定 → 戰鬥，10%–100%，預設 80%）",
      ],
    },
    {
      v: "v0.2.260",
      d: "2026-10-09",
      l: [
        "一鍵構築切換：角色、技能分頁上方的「構築 1～3」各存一套技能拼圖、裝備、轉職分支和天賦，點一下整套換過去，不花Zeny",
      ],
    },
    {
      v: "v0.2.258",
      d: "2026-10-09",
      l: [
        "同一時間只能在一個分頁玩：開新分頁時，舊分頁會先存檔並暫停，按「在這裡繼續」可以切回來",
      ],
    },
    {
      v: "v0.2.255",
      d: "2026-10-09",
      l: [
        "無盡之塔可以自動挑戰：在塔的面板或設定勾選，選擇從存檔點（例如第 31 層）或第 1 層開始",
      ],
    },
    {
      v: "v0.2.254",
      d: "2026-10-09",
      l: [
        "主宰更稀有了：一般掉落從 1/20000 降為 1/100000，闇答萊屍從 1% 降為 0.1%",
      ],
    },
    {
      v: "v0.2.253",
      d: "2026-10-09",
      l: [
        "新增傳說技能寶石：致命迴旋（劍士）、箭矢風暴（弓手）、地獄火焰（法師）",
        "只有 Lv90 的菁英和頭目會掉落，極稀有；寶石有金色外框",
      ],
    },
    {
      v: "v0.2.251",
      d: "2026-10-09",
      l: [
        "新材料「鋁 Lv4」：把獨特效果符文灌注進同部位裝備，一件裝備可以有多個獨特效果",
        "只有 Lv83 以上的一般怪物會掉落，極稀有",
      ],
    },
    {
      v: "v0.2.246",
      d: "2026-10-09",
      l: ["純畫面模式的戰場大小改成和一般模式相同，不影響練功效率"],
    },
    {
      v: "v0.2.245",
      d: "2026-10-09",
      l: [
        "新增純畫面模式：選單 → 設定 → 畫面，隱藏所有介面只留戰鬥畫面，點畫面任一處退出",
      ],
    },
    {
      v: "v0.2.244",
      d: "2026-10-09",
      l: [
        "持續技能（如血之渴望）現在可以連結輔助寶石；狂怒之槍、雙劍格擋改稱光環，光環不吃輔助",
        "冷卻、額外施放、施放代價、自動念咒類的輔助對持續技能無效",
      ],
    },
    {
      v: "v0.2.243",
      d: "2026-10-09",
      l: [
        "黑暗瞬間：有氣勢時消耗 1 層，完全不進入冷卻（搭配雙劍格擋連續瞬步）",
        "血之渴望範圍加大",
      ],
    },
    {
      v: "v0.2.241",
      d: "2026-10-09",
      l: [
        "劍士新增「血之渴望」（持續扣血，腳下血之渴望依最大生命造成傷害）、「黑暗瞬間」（有氣勢時消耗 1 層，不進入冷卻）",
        "弓手新增「FAW 魔導機甲」（召喚物）、「火焰箭」「冰凍箭」「閃電箭」",
        "弓手商人新增「生命體增殖」「生命體強化」",
      ],
    },
    {
      v: "v0.2.237",
      d: "2026-10-09",
      l: [
        "劍士新增主動技能「螺旋擊刺」：揮出飛向敵人的劍氣，可搭配多重箭矢、連鎖增幅",
        "劍士商人新增「多重箭矢」",
        "修正：輔助寶石「連鎖增幅」原本沒有效果，現在投射物會正確彈射",
      ],
    },
    {
      v: "v0.2.235",
      d: "2026-10-09",
      l: [
        "邪靈鎖鏈：流血、燃燒、中毒每一跳都能暴擊；獵人長靴：地面效果持續更久、陷阱 +1",
        "魔法外套：任何範圍技能都會留下熔岩；冰之王冠：擊中疊寒霜，滿 5 層凍結敵人",
      ],
    },
    {
      v: "v0.2.233",
      d: "2026-10-09",
      l: [
        "石板危險度帶來的稀有度，現在也提高獨特、主宰和插槽裝備的掉落機率（原本只有稀有、傳奇）",
      ],
    },
    {
      v: "v0.2.232",
      d: "2026-10-09",
      l: [
        "弓手新增主動技能「銳利射擊」「定位陷阱」，法師新增「隕石術」「暴風雪」",
        "三職業共用新輔助寶石：連鎖增幅、集中攻擊、犧牲祈福、自動念咒（商人有賣）",
        "新增 6 件高階獨特：血爆之鍊、獵人長靴、魔法外套、冰之王冠、迴聲之戒、聖母祈福手套",
      ],
    },
    {
      v: "v0.2.229",
      d: "2026-10-09",
      l: [
        "劍士新增主動技能「大地之擊」：劈開直線地面造成傷害並流血，裂縫留在地上 3 秒",
        "劍士新增主動技能「百矛穿刺」：跳進怪物最密集的地方砸地",
        "新增異常「流血」：敵人移動時流血傷害加倍",
      ],
    },
    {
      v: "v0.2.226",
      d: "2026-10-09",
      l: [
        "自動挑戰終局頭目：打贏後 3 秒直接接著打下一場，不用等 30 秒回到地圖",
      ],
    },
    {
      v: "v0.2.225",
      d: "2026-10-09",
      l: [
        "新增「自動挑戰終局頭目」：有印記就自動挑戰守護者，碎片湊齊先打巴風特（地圖分頁守護者欄或設定開啟）",
        "闇答萊屍不會自動挑戰",
      ],
    },
    {
      v: "v0.2.224",
      d: "2026-10-09",
      l: ["灌注的符文石清單也改成依階級排序，高階在上"],
    },
    {
      v: "v0.2.223",
      d: "2026-10-09",
      l: ["鑲嵌視窗的符文石改成依階級排序，高階在上"],
    },
    {
      v: "v0.2.222",
      d: "2026-10-09",
      l: [
        "怪物卡牌改算地圖的總擊殺：合計 500、1000、2000 隻開啟第 1、2、3 階，20000 隻解鎖拖尾（原本是每種怪物各 250、500、1000、10000 隻），已達到的階數都保留",
      ],
    },
    {
      v: "v0.2.221",
      d: "2026-10-09",
      l: [
        "守護者新增招式：古樹會纏根和衝撞、熔核會降熔岩雨和射彈幕、星穹會放星光十字和星墜，低血量時狂怒",
        "巴風特與闇答萊屍輪流使用全部守護者招式，移動更快；闇答萊屍招式最頻繁、傷害最高",
      ],
    },
    { v: "v0.2.215", d: "2026-10-09", l: ["石板數量上限 120 → 500"] },
    {
      v: "v0.2.214",
      d: "2026-10-09",
      l: [
        "奇蹟石換上專屬外觀：七彩切面寶石、流轉的虹光與閃爍星芒，掉在地上會留下七彩光柱",
        "無盡之塔開放後，煉金一定會顯示「磨礪」模式",
      ],
    },
    {
      v: "v0.2.211",
      d: "2026-10-09",
      l: [
        "無盡之塔開放後，煉金就會顯示奇蹟石和「奇蹟」模式（還沒有奇蹟石時是暗的）",
      ],
    },
    {
      v: "v0.2.210",
      d: "2026-10-09",
      l: [
        "新增升級合成：4 顆同等級的神秘金屬／鋁／低階保護石加Zeny，合成 1 顆高一級的（煉金 → 升級合成，也能「全部往上合」）",
      ],
    },
    {
      v: "v0.2.206",
      d: "2026-10-09",
      l: [
        "煉金按鈕的Zeny花費改成Zeny圖示",
        "無盡之塔排行榜改顯示轉職分支（還沒轉職的顯示職業）",
      ],
    },
    {
      v: "v0.2.204",
      d: "2026-10-09",
      l: ["合成按鈕的Zeny數字後面加上Zeny圖示"],
    },
    {
      v: "v0.2.202",
      d: "2026-10-09",
      l: ["煉金的合成可以一次做 10 個或 100 個神秘金屬／鋁"],
    },
    {
      v: "v0.2.201",
      d: "2026-10-09",
      l: ["符文石「階級」排序改成直接照 T 數字：T0、T1、T2… 依序排列"],
    },
    {
      v: "v0.2.200",
      d: "2026-10-09",
      l: [
        "符文石上限 200 → 1000",
        "背包的符文石頁新增「自動分解」（萃取時直接分解低階符文）和「批次分解」",
      ],
    },
    {
      v: "v0.2.198",
      d: "2026-10-09",
      l: [
        "無限印記更好拿：塔內每通過一層都有機率掉落（第 1 層 1%，每層 +0.5%），王層的王每 10 層 +5%",
      ],
    },
    {
      v: "v0.2.197",
      d: "2026-10-09",
      l: [
        "闇答萊屍換上專屬造型：白銀皇冠、星光光環、胸前的 ∞ 印記、星球權杖，披風下擺化成星塵",
      ],
    },
    {
      v: "v0.2.194",
      d: "2026-10-09",
      l: [
        "新 Boss：闇答萊屍！無盡之塔王層掉落無限印記，湊滿 5 個開啟挑戰，必掉神話裝備（新稀有度・7 條詞綴）和 10 個最高階素材",
        "新材料奇蹟石：讓裝備獲得奇蹟狀態，下一次萃取／灌注／磨礪／腐化會被強化（煉金 →「奇蹟」）",
        "擊敗闇答萊屍獲得稱號「君主殺手」",
      ],
    },
    {
      v: "v0.2.191",
      d: "2026-10-09",
      l: [
        "主宰的圖示會動了：光澤掃過、紅眼與血劍脈動發光、金色星點閃爍（背包、地上、資料庫都看得到）",
      ],
    },
    {
      v: "v0.2.188",
      d: "2026-10-09",
      l: [
        "主宰（獸人酋長之戒、萬軍石板）換上專屬外觀：金紅圖示、金框閃光格子、深紅標題",
        "主宰掉在地上會直接顯示本體，周圍有金色光點與擴散增幅光環",
      ],
    },
    {
      v: "v0.2.180",
      d: "2026-10-09",
      l: [
        "新功能：官方資料庫！網址後面加 /db（或選單 →「資料庫」），可查技能寶石、裝備、詞綴、獨特裝備與轉職天賦",
      ],
    },
    { v: "v0.2.174", d: "2026-10-09", l: ["變異寶石外觀改成紫色虹彩漸層"] },
    {
      v: "v0.2.172",
      d: "2026-10-09",
      l: [
        "變異寶石多了紫色紋路，一眼就認得出來",
        "技能分頁「未放置的寶石」分成主動／輔助，同名同形狀的寶石會疊在一起",
      ],
    },
    {
      v: "v0.2.169",
      d: "2026-10-09",
      l: [
        "新石板詞綴「變異寶石」：擊殺時有機率掉落變異技能寶石",
        "變異寶石效果不變，但形狀不同，格子可能變多或變少；不需要的可在技能分頁分解",
      ],
    },
    {
      v: "v0.2.168",
      d: "2026-10-09",
      l: [
        "新設定：自動挑戰 Boss（選單 → 設定），擊殺數滿了、生命 80% 以上就自動開打",
        "輸了會先等 2 分鐘再自動挑戰",
      ],
    },
    {
      v: "v0.2.166",
      d: "2026-10-09",
      l: [
        "新功能：多角色！最多 5 隻，每隻都要取名，在角色分頁「切換角色」建立、切換、改名",
        "排行榜改用角色名稱，每隻角色各自上榜",
      ],
    },
    {
      v: "v0.2.163",
      d: "2026-10-09",
      l: [
        "新功能：無盡之塔排行榜（選單 →「排行」），設定暱稱後，最高層數會自動上傳",
      ],
    },
    {
      v: "v0.2.159",
      d: "2026-10-09",
      l: [
        "修正：關掉網頁再開回來時沒有離線收益",
        "修正：電腦睡眠或切到背景回來時，離線時間有時少算",
      ],
    },
    {
      v: "v0.2.158",
      d: "2026-10-09",
      l: [
        "拖尾特效大幅強化：腳下旋轉法陣、環繞光點、殘影與光帶、攻擊與擊殺時迸發，夜晚地圖會發光",
      ],
    },
    {
      v: "v0.2.154",
      d: "2026-10-09",
      l: [
        "新外觀：每張地圖的怪物都擊殺 10000 隻，解鎖專屬拖尾特效（共 11 種），在卡牌頁使用",
      ],
    },
    {
      v: "v0.2.152",
      d: "2026-10-09",
      l: [
        "怪物卡牌改成三階：每種怪擊殺 250／500／1000 隻依序開啟",
        "前幾張地圖的卡牌加成改得更實用（移動速度、護甲%、行動速度等）",
      ],
    },
    { v: "v0.2.151", d: "2026-10-09", l: ["守護者印記掉落率提高為 3 倍"] },
    {
      v: "v0.2.150",
      d: "2026-10-09",
      l: ["萬軍石板固定帶 4 條危險詞綴（危險度也會提高獎勵）"],
    },
    {
      v: "v0.2.148",
      d: "2026-10-09",
      l: [
        "主宰固定 6 條詞綴",
        "新主宰「萬軍石板」：怪物數量上限 +50、生成速度 +300%，石板欄位滿了也不會被分解",
        "移除設定裡的開發者工具",
      ],
    },
    {
      v: "v0.2.144",
      d: "2026-10-08",
      l: [
        "新稀有度「主宰」：83 級以上的怪物每件掉落物 1/20000，拾取篩選、批次分解、批次萃取都不會動到它",
        "第一件主宰「獸人酋長之戒」：擊殺菁英時偷走牠的菁英詞綴 20 秒",
      ],
    },
    {
      v: "v0.2.136",
      d: "2026-10-08",
      l: [
        "批次分解可以勾選插槽裝備，並選擇要分解幾孔的",
        "保留規則的「插槽裝備」條件可以指定孔數",
      ],
    },
    {
      v: "v0.2.134",
      d: "2026-10-08",
      l: [
        "煉金「萃取」新增批次萃取：像保留規則一樣設定萃取規則，一次萃取所有符合的裝備（已鎖定的會跳過）",
      ],
    },
    {
      v: "v0.2.129",
      d: "2026-10-08",
      l: [
        "無盡之塔：腐化石掉落率下修（每層約 4%～13%，王層多一次 50%）",
        "無盡之塔的怪物、王的技能和召喚物改用塔內等級，不再受進塔前的地圖影響",
      ],
    },
    {
      v: "v0.2.127",
      d: "2026-10-08",
      l: ["電腦版技能頁：拿著寶石時滾輪改為捲動頁面，旋轉改用右鍵或 R 鍵"],
    },
    {
      v: "v0.2.126",
      d: "2026-10-08",
      l: [
        "新增無盡之塔：擊敗巴風特後在地圖分頁挑戰，每層越來越強，每 10 層多一條規則",
        "新增腐化：用塔裡掉的腐化石讓裝備升階或改變數值，獨特效果也會變；腐化後不能再煉金",
      ],
    },
    {
      v: "v0.2.121",
      d: "2026-10-08",
      l: ["有新版本時會自動存檔並更新（不會在 Boss 戰或開著視窗時更新）"],
    },
    {
      v: "v0.2.119",
      d: "2026-10-08",
      l: [
        "離線收益改成線上的 10%（原本 50%）",
        "放了石板的地圖，戰鬥畫面左下角會列出目前的石板詞綴",
      ],
    },
    {
      v: "v0.2.116",
      d: "2026-10-08",
      l: ["石板詞綴「插槽石板」大幅下修：單條 1.0–3.3%，危險度 100 時最高 5%"],
    },
    {
      v: "v0.2.114",
      d: "2026-10-08",
      l: [
        "萃取、灌注、磨礪、鑲嵌改成要花Zeny，裝備等級越高花越多（90 級：萃取 50、灌注 100、磨礪 100、鑲嵌 210）",
      ],
    },
    {
      v: "v0.2.112",
      d: "2026-10-08",
      l: [
        "拾取篩選可以勾傳奇、獨特",
        "背包的石板頁加上拾取篩選、批次分解和保留規則（和裝備分開設定）",
      ],
    },
    {
      v: "v0.2.109",
      d: "2026-10-08",
      l: [
        "守護者生命 ×1.5、傷害 ×1.5，熔核重擊更頻繁、範圍更大",
        "巴風特生命 ×1.35、傷害 ×1.6",
      ],
    },
    {
      v: "v0.2.106",
      d: "2026-10-08",
      l: [
        "轉職頁的重選拆成「重置天賦點」（150 Zeny，分支不變）和「重置職業」",
        "符文石上限 80 → 200，石板上限 60 → 120",
        "奧丁之心說明改成：50% 武器傷害的技能傷害",
      ],
    },
    {
      v: "v0.2.104",
      d: "2026-10-08",
      l: [
        "弓手、法師被怪貼近時，鎖定的目標太遠就先打身邊的怪；後退時盡量留在射程內",
      ],
    },
    {
      v: "v0.2.102",
      d: "2026-10-08",
      l: [
        "新增插槽石板：巴風特 30% 掉落，或由新的石板獎勵詞綴「插槽石板」掉落",
        "插槽石板自帶危險詞綴，可鑲進同樣數量、自己挑的石板符文（鋁 Lv3）",
      ],
    },
    {
      v: "v0.2.101",
      d: "2026-10-08",
      l: ["地圖列表會標出每張圖掉落哪一種守護者印記"],
    },
    {
      v: "v0.2.99",
      d: "2026-10-08",
      l: [
        "轉職試煉、守護者、巴風特改成傳送到各自的專屬場地挑戰",
        "場地右下角「離開」可回到原地圖（挑戰中點兩下＝放棄）；打完 30 秒後自動回去",
      ],
    },
    {
      v: "v0.2.95",
      d: "2026-10-08",
      l: [
        "石板地圖分等級：第 1 張 83 級到第 11 張 90 級，越後面終局掉落越多、傳奇越多",
        "地圖 1-4 最多放 2 塊石板（多的會退回石板列表）",
        "石板的危險詞綴改成獨立一區，不再佔獎勵詞綴的位置；新增 6 種危險詞綴，危險度也會增加掉落數量和稀有度",
      ],
    },
    {
      v: "v0.2.91",
      d: "2026-10-08",
      l: ["守護者掉自己獨特 35% → 15%，巴風特 50% → 20%"],
    },
    {
      v: "v0.2.90",
      d: "2026-10-08",
      l: [
        "獨特裝備掉落率 2% → 0.5%，地圖 Boss 30% → 15%；高階、終局獨特更稀有",
        "插槽裝備掉落率 1% → 0.1%",
      ],
    },
    {
      v: "v0.2.89",
      d: "2026-10-08",
      l: ["插槽裝備的掉落率從 4% 降到 1%（獨特裝備維持 2%）"],
    },
    {
      v: "v0.2.88",
      d: "2026-10-08",
      l: [
        "地圖列表每張地圖都會顯示石板欄位，點欄位就能直接放入或更換，不用先切換地圖",
        "放石板的視窗也會列出其他地圖使用中的石板，選它會先確認再移過來",
        "修正石板說明：稀有以上才能萃取，魔法以上能灌注",
      ],
    },
    {
      v: "v0.2.87",
      d: "2026-10-08",
      l: [
        "煉金的裝備列表新增排序與部位、稀有度篩選",
        "地圖放石板改成獨立視窗，可排序和篩選，撿到新石板時列表不會再跳動",
        "背包的石板頁也能排序和篩選",
      ],
    },
    {
      v: "v0.2.86",
      d: "2026-10-08",
      l: ["角色的 DPS 估算現在有算進天使之手的召喚物攻速 +30%"],
    },
    {
      v: "v0.2.83",
      d: "2026-10-08",
      l: ["修正天龍之翼：弓手、法師的普通攻擊命中時也會引發震波（在目標周圍）"],
    },
    {
      v: "v0.2.82",
      d: "2026-10-08",
      l: [
        "技能頁的主動技能新增「加成明細」：列出每種加成來自哪件裝備、天賦或卡牌，以及條件加成",
      ],
    },
    {
      v: "v0.2.80",
      d: "2026-10-08",
      l: [
        "封印石改成一次性：磨礪或灌注時勾選封印石，點一條詞綴，只保護這一次（舊的永久封印已退回封印石）",
        "磨礪結果顯示每條詞綴的（原 → 現）數值",
      ],
    },
    {
      v: "v0.2.72",
      d: "2026-10-08",
      l: ["毒師「瘟疫」毒爆傷害：剩餘毒傷的 150% → 75%"],
    },
    {
      v: "v0.2.69",
      d: "2026-10-08",
      l: ["裝備詳細資訊的「需求 LV」不再被拆成兩行"],
    },
    {
      v: "v0.2.67",
      d: "2026-10-08",
      l: ["商人改成商品卡：寶石顯示形狀圖、擁有數量，點名稱看效果"],
    },
    {
      v: "v0.2.64",
      d: "2026-10-08",
      l: ["技能頁新增「配置 1～3」：可存三套不同的寶石擺法，點一下切換"],
    },
    {
      v: "v0.2.63",
      d: "2026-10-08",
      l: ["技能說明的提示框不會再被畫面右邊切掉"],
    },
    {
      v: "v0.2.62",
      d: "2026-10-07",
      l: [
        "召喚元素精靈不再吃你的暴擊，召喚師天賦「元素共鳴」才會套用",
        "召喚元素精靈吃得到法術傷害加成",
      ],
    },
    {
      v: "v0.2.61",
      d: "2026-10-07",
      l: [
        "召喚元素精靈改成遠程：在遠處發射元素彈攻擊",
        "技能頁的召喚技能會顯示目前總共召喚幾隻",
      ],
    },
    {
      v: "v0.2.58",
      d: "2026-10-07",
      l: [
        "前期升級更快：約 30 分鐘到 Lv30，Lv50 以後稍微變慢",
        "前幾張地圖（含夢羅克沙漠）的 Boss 大招減輕",
        "弓手補強：攻速提高，二連矢 280%、箭雨每波 115%",
      ],
    },
    {
      v: "v0.2.57",
      d: "2026-10-07",
      l: ["選單新增「更新日誌」，有新內容時會亮紅點"],
    },
    {
      v: "v0.2.56",
      d: "2026-10-07",
      l: [
        "前期升級加快：Lv1–40 所需經驗減少，Lv70 起稍微增加",
        "前幾張地圖的 Boss 大招再減輕",
      ],
    },
    {
      v: "v0.2.55",
      d: "2026-10-07",
      l: [
        "弓手、法師被怪物逼到牆角時會沿牆滑開或從 Boss 側面繞出去，不再卡在角落",
      ],
    },
    {
      v: "v0.2.54",
      d: "2026-10-07",
      l: [
        "技能頁的主動技能會列出技能說明",
        "連結的輔助寶石名稱可以 hover 或點一下看效果",
      ],
    },
    {
      v: "v0.2.53",
      d: "2026-10-07",
      l: [
        "裝備有等級需求：角色等級要達到物品等級 −5 才能穿",
        "等級不足的裝備格子數字變紅，詳細資訊顯示需求等級",
      ],
    },
    {
      v: "v0.2.52",
      d: "2026-10-07",
      l: ["Boss 大招傷害依英雄等級調整", "Boss 的衝撞與標記會預判你的走位"],
    },
    {
      v: "v0.2.47",
      d: "2026-10-07",
      l: [
        "地圖 Boss 新增技能：重擊、標記、衝撞、彈幕、召喚與狂怒，地面會先出現預警",
        "菁英怪帶詞綴：加速術、堅韌、爆裂、遠射、吸血、寒霜",
      ],
    },
  ],
  logTop = () =>
    CHANGELOG[0].v || ("string" == typeof BUILD_VER ? BUILD_VER : "DEV"),
  AUTO_HELP = {
    bag: "bag",
    skill: "skill",
    alch: "alch",
    map: "map",
    shop: "shop",
    cards: "cards",
    fx: "fx",
    rank: "rank",
  },
  psSnap = () => {
    const t = PS,
      a = (t) => Math.round(100 * t) / 100;
    return {
      dps: Math.round(t.dps),
      mn: Math.round(t.mn),
      mx: Math.round(t.mx),
      aps: a(t.aps),
      act: a(t.act),
      dmgp: t.st.dmgp,
      skill: t.st.skill,
      minp: t.st.minp || 0,
      crit: a(t.crit),
      critR: a(t.critRaw),
      critm: t.critm,
      cdr: a(t.cdr),
      cdrR: a(t.st.cdr),
      area: Math.round(100 * (t.area - 1)),
      hp: t.maxhp,
      armor: t.armor,
      armRed: a(t.armRed),
      armR: a(t.armor / 20),
      eva: t.eva,
      dodge: a(t.dodge),
      dodgeR: a(t.eva / 15),
      regen: a(t.regen),
      lok: t.lok,
      move: Math.round(t.move),
      rev: t.revive,
      revR: t.st.revive,
    };
  },
  psRows = (t, a) => {
    const s = (t) => (a ? `<span id="${t}"></span>` : "");
    return `<h3>攻擊</h3>\n    <dl class="kv box">\n      <dt>預估 DPS（含技能）</dt><dd>${fmt(t.dps)}</dd>\n      <dt>武器傷害</dt><dd>${t.mn}-${t.mx}</dd>\n      <dt>每秒攻擊次數</dt><dd>${t.aps.toFixed(2)}${s("lvAps")}</dd>\n      <dt>行動速度</dt><dd>X${t.act.toFixed(2)}${s("lvAct")}</dd>\n      <dt>傷害增加 / 技能傷害</dt><dd>+${t.dmgp}% / +${t.skill}%</dd>\n      ${t.minp ? `<dt>召喚物傷害</dt><dd>+${t.minp}%</dd>` : ""}\n      <dt>暴擊率 / 暴擊傷害</dt><dd>${capT(t.crit, t.critR)} / ${t.critm}%</dd>\n      <dt>冷卻縮減 / 技能範圍</dt><dd>${capT(t.cdr, t.cdrR)} / +${t.area}%</dd>\n    </dl>\n    <h3>防禦</h3>\n    <dl class="kv box">\n      <dt>最大生命</dt><dd>${t.hp}</dd><dt>護甲 / 減傷</dt><dd>${t.armor} / ${capT(t.armRed, t.armR)}</dd>\n      <dt>閃避 / 閃避率</dt><dd>${t.eva} / ${capT(t.dodge, t.dodgeR)}${s("lvDg")}</dd>\n      <dt>每秒回復</dt><dd>${t.regen.toFixed(1)}</dd><dt>擊殺回復</dt><dd>${t.lok}</dd>\n      <dt>移動速度</dt><dd>${t.move}${s("lvMs")}</dd><dt>復活時間</dt><dd>${(10 * (1 - t.rev / 100)).toFixed(1)} 秒${t.revR > t.rev ? `（縮短 ${t.revR}%）` : ""}</dd>\n    </dl>`;
  },
  BLD_NM = 4;
function bnOpen() {
  (($("#sheet").className = "sck"),
    ($("#sheetBg").hidden = !1),
    ($("#sheet").innerHTML =
      `<h2 class="cfh">構築 ${S.gp + 1} 名稱</h2><div class="row"><input id="bnName" class="txt" maxlength="4" autocomplete="off" value="${esc(S.bldN[S.gp] || "")}" placeholder="${S.gp + 1}" aria-label="構築名稱" style="flex:1"></div>\n    <p class="note" style="margin:6px 0">最多 4 個字；空白＝顯示編號</p><div class="row"><button class="btn" data-act="close">取消</button><span class="spacer"></span><button class="btn primary" data-act="bnOk">儲存</button></div>`));
  const t = $("#bnName");
  t && (t.focus(), t.select());
}
function bnSave() {
  const t = $("#bnName");
  t &&
    ((S.bldN[S.gp] = [...lbClean(t.value)].slice(0, 4).join("")),
    markDirty(),
    sheetOff(),
    ui.render());
}
const bldSeg = () =>
    `<div class="row" style="margin:6px 0 8px"><span>構築${helpBtn("bld")}</span><div class="seg" style="margin:0;flex:1">${S.gpages.map((t, a) => `<button data-act="build" data-v="${a}" aria-pressed="${S.gp === a}">${esc(S.bldN[a] || String(a + 1))}</button>`).join("")}</div><button class="btn sm" data-act="bldCp" style="flex:none">複製</button></div>`,
  helpBtn = (t, a = 0) =>
    `<button class="hbtn" data-act="help" data-k="${t}" data-i="${a}" aria-label="說明">?</button>`,
  HL_W = 21,
  hlW = (t) =>
    [...t].reduce((t, a) => t + (a.charCodeAt(0) > 255 ? 1 : 0.55), 0);
function hLines(t, a = HL_W) {
  const s = [];
  let e = "";
  for (const n of t.match(/[^，。；：]+[，。；：]?/g) || [t])
    e && (/[。；]$/.test(e) || hlW(e + n) > a)
      ? (s.push(e), (e = n))
      : (e += n);
  return (e && s.push(e), s.map((t) => t.replace(/[，。；]$/, "")));
}
const fitLines = (t, a) =>
  t.flatMap((t) => {
    const s = [];
    for (; hlW(t) > a;) {
      const e = [...t];
      let n = 0,
        l = 0,
        o = 0;
      for (; n < e.length && l + hlW(e[n]) <= a; n++)
        ((l += hlW(e[n])),
          "、" === e[n] && (o = n + 1),
          "（" === e[n + 1] && (o = n + 1));
      ((o = o || n), s.push(e.slice(0, o).join("")), (t = e.slice(o).join("")));
    }
    return [...s, t];
  });
function dlOpen() {
  const t = G.dl,
    a = t.hits,
    s = a[a.length - 1],
    e = a.reduce((t, a) => t + a.d, 0),
    n = (a) => Math.round((a / t.mhp) * 100) + "%",
    l = (t) => esc(t.n) + (t.tag ? `（${t.tag}）` : ""),
    o = {};
  for (const t of a) {
    const a = l(t);
    ((o[a] ||= { d: 0, n: 0 }), (o[a].d += t.d), o[a].n++);
  }
  const r = Object.entries(o)
      .sort((t, a) => a[1].d - t[1].d)
      .slice(0, 5),
    i = Array.from({ length: 16 }, (s, e) => {
      const n = t.at - DL_T + ((e + 1) * DL_T) / 16,
        l = a.filter((t) => t.t <= n);
      return l.length ? l[l.length - 1].hp : t.mhp;
    }),
    c = (t) =>
      `<dl class="kv">${t.map(([t, a]) => `<dt>${t}</dt><dd>${a}</dd>`).join("")}</dl>`;
  (($("#sheet").className = "hlp dlp"),
    ($("#sheet").innerHTML =
      `<h2 class="cfh">陣亡回顧</h2>\n    <h3>致命一擊</h3>${c([
        ["來源", l(s)],
        ["方式", s.k],
        ["傷害", `${fmt(s.d)}・生命 ${n(s.d)}`],
      ])}\n    <h3>死前 ${DL_T} 秒</h3>${c([
        ["受到傷害", `${fmt(e)}・生命 ${n(e)}`],
        ["受擊次數", `${a.length} 次`],
        ["單次最高", fmt(Math.max(...a.map((t) => t.d)))],
      ])}\n    <h3>生命變化</h3><div class="dlhp">${i.map((a) => `<i style="height:${Math.max(2, Math.round((a / t.mhp) * 40))}px"></i>`).join("")}</div>\n    <h3>傷害來源</h3>${c(r.map(([t, a]) => [t, `${fmt(a.d)}・${Math.round((a.d / e) * 100)}%`]))}\n    <h3>你的防禦</h3>${c(
        [
          ["最大生命", fmt(t.mhp)],
          ["護甲減傷", t.arm.toFixed(1) + "%"],
          ["閃避", t.dg.toFixed(1) + "%"],
        ],
      )}\n    <div class="row"><span class="spacer"></span><button class="btn primary" data-act="close">知道了</button></div>`),
    ($("#sheet").scrollTop = 0),
    ($("#sheetBg").hidden = !1));
}
const TRN_N = {
  basic: "普通攻擊",
  min: "召喚物",
  oth: "其他",
  psn: "中毒",
  brn: "燃燒",
  bld: "流血",
  ovk: "致命爆裂",
};
function trnName(t) {
  if (TRN_N[t]) return TRN_N[t];
  if (SKILLS[t]) return SKILLS[t].n;
  const [a, s] = t.split(":");
  if ("uq" === a) return UNIQUE[s].n;
  if ("art" === a) return ARTS[s].n;
  if ("sus" === a) return SKILLS[s].n;
  if ("ail" === a) return AIL[s].n;
  if ("crs" === a) return "詛咒・" + CRS[s].n;
  if ("dv" === a) return AFFIX["dv_" + s]?.n || t;
  if ("r" === a || "tal" === a) {
    const t = "tags" === s ? ["projDmg", "spell"] : [s],
      a = PS.mods.find((a) => t.includes(a.s));
    return a ? srcName(a.src) : "天賦";
  }
  return t;
}
function trnRows(t) {
  const a = G.trn,
    s = Math.max(trnDps().el, 0.5),
    e = (t) => Math.round(100 * t) + "%";
  if (!t)
    return Object.entries(a.s)
      .filter(([, t]) => t.d > 0)
      .sort((t, a) => a[1].d - t[1].d)
      .map(([t, n]) => [
        trnName(t),
        e(n.d / a.d),
        fmt(n.d / s),
        trnHps(n.n, s),
        n.d,
        n.n,
      ]);
  let n = 0,
    l = 0,
    o = 0;
  for (const t in a.s) {
    const s = a.s[t];
    ((n += s.n), (l += s.c), (o += s.cf));
  }
  const r = Object.entries(a.mu)
    .filter(([, t]) => t.t > 0)
    .map(([t, a]) => [trnName(t), a.f / a.n, a.t / a.n]);
  return (
    l && r.push(["暴擊", (n - l + o) / n, l / n]),
    r
      .sort((t, a) => a[1] - t[1])
      .map(([t, a, s]) => [t, "×" + a.toFixed(2), e(s), a])
  );
}
const TRN_EMPTY = ["尚未造成傷害", "沒有觸發的條件增傷"],
  TRN_NC = [4, 3],
  trnHps = (t, a) =>
    t ? (t / a < 10 ? (t / a).toFixed(1) : Math.round(t / a)) + "次/秒" : "",
  trnGrid = (t, a, s) =>
    `<div class="${a} c${TRN_NC[s]}">${t
      .map((t) =>
        t
          .slice(0, TRN_NC[s])
          .map((t, a) => `<span${a ? "" : ' class="n"'}>${esc(t)}</span>`)
          .join(""),
      )
      .join("")}</div>`,
  TRN_TOP = 6;
function trnChipHtml() {
  const t = G.trn,
    a = trnDps(),
    s = Math.max(a.el, 0.5),
    e = S.set.trc || 0,
    n = `<div class="hd">DPS <b>${fmt(a.rec)}</b>${e < 2 ? `・${["傷害來源", "增傷效果"][e]} ▾` : " ▸"}</div>`;
  if (2 === e) return n;
  const l = Math.floor(a.el / 60),
    o = `<div class="m">平均 ${fmt(a.all)}・${l}:${String(Math.floor(a.el % 60)).padStart(2, "0")}${S.trn.m ? `・擊殺 ${((t.k / s) * 60).toFixed(1)}/分` : ""}</div>`,
    r = trnRows(e),
    i = r.slice(0, 6),
    c = r.slice(6);
  if (c.length) {
    const a = `其他 ${c.length} 項`,
      n = c.reduce((t, a) => t + a[4], 0);
    i.push(
      e
        ? [a, "≤" + c[0][1], ""]
        : [
            a,
            Math.round((n / t.d) * 100) + "%",
            fmt(n / s),
            trnHps(
              c.reduce((t, a) => t + a[5], 0),
              s,
            ),
          ],
    );
  }
  return (
    n +
    o +
    (i.length ? trnGrid(i, "g", e) : `<div class="m">${TRN_EMPTY[e]}</div>`)
  );
}
const trnFullHtml = () =>
  [0, 1]
    .map((t) => {
      const a = trnRows(t);
      return (
        `<div class="trnH">${["傷害來源", "增傷效果"][t]}</div>` +
        (a.length
          ? trnGrid(a, "trnL", t)
          : `<p class="note">${TRN_EMPTY[t]}</p>`)
      );
    })
    .join("");
function helpOpen(t, a = 0, s = null) {
  const [e, n] = HELP[t];
  let l = -1;
  ((S.help[t] = 1), markDirty(), (ui.hlpK = t));
  const o = [];
  for (const [t, a] of n)
    "§" === t[0]
      ? o.push([t.slice(1), []])
      : (o.length || o.push(["", []]), o.at(-1)[1].push([t, a, ++l]));
  const r =
    s ??
    Math.max(
      0,
      o.findIndex(([, t]) => t.some((t) => t[2] === a && a)),
    );
  (($("#sheet").className = "hlp"),
    ($("#sheet").innerHTML =
      `<h2 class="cfh">${e}</h2>${o.length > 1 ? `<div class="seg" style="margin:0">${o.map(([t], a) => `<button data-act="hpg" data-v="${a}" aria-pressed="${a === r}">${t}</button>`).join("")}</div>` : ""}\n    <div class="hlist">${o[
        r
      ][1]
        .map(
          ([t, s, e]) =>
            `<div class="hpt${e === a && a ? " on" : ""}"><b>${t}</b>${hLines(s)
              .map((t) => `<span>${t}</span>`)
              .join("")}</div>`,
        )
        .join(
          "",
        )}</div>\n    <div class="row"><span class="spacer"></span><button class="btn primary" data-act="close">知道了</button></div>`),
    ($("#sheetBg").hidden = !1),
    ($("#sheet").scrollTop = 0));
  const i = $("#sheet .hpt.on");
  i && ($("#sheet").scrollTop = i.offsetTop - 60);
}
const isStandalone = () =>
    !0 === navigator.standalone ||
    !(!window.matchMedia || !matchMedia("(display-mode: standalone)").matches),
  DBV = { on: !1 };
function dbvOpen(t) {
  let a = $("#dbv");
  a ||
    (document.body.insertAdjacentHTML(
      "beforeend",
      '<div id="dbv" hidden><iframe title="資料庫"></iframe><button class="btn x">關閉</button></div>',
    ),
    (a = $("#dbv")),
    (a.querySelector(".x").onclick = () =>
      history.state && history.state.dbv ? history.back() : dbvClose()));
  const s = a.querySelector("iframe");
  (s.getAttribute("src") || (s.src = t), (a.hidden = !1), (DBV.on = !0));
  try {
    history.pushState({ dbv: 1 }, "");
  } catch (t) {}
}
function dbvClose() {
  const t = $("#dbv");
  (t && (t.hidden = !0), (DBV.on = !1));
}
window.addEventListener("popstate", () => {
  DBV.on && dbvClose();
});
const autoHelp = (t) => {
    t && HELP[t] && !S.help[t] && $("#sheetBg").hidden && helpOpen(t);
  },
  clock = (t, a) => {
    t = Math.floor(t);
    const s = Math.floor(t / 3600),
      e = Math.floor(t / 60) % 60,
      n = t % 60;
    return a
      ? s
        ? `${s}h${String(e).padStart(2, "0")}m`
        : `${e}m`
      : (s ? s + ":" + String(e).padStart(2, "0") : e) +
          ":" +
          String(n).padStart(2, "0");
  },
  MAT_ORDER = [
    ["x1", "x2", "x3", "x4"],
    ["i1", "i2", "i3", "i4"],
    ["p1", "p2"],
  ],
  matCell = (t) => {
    const a = MATS[t],
      s = S.mat[t] || 0,
      e = "p" === a.f ? (a.l > 1 ? 2 : 1) : a.l,
      n = "m" === a.f;
    return `<button class="cell mt${s ? "" : " empty"}${n ? " mir mstone" : ""}" data-act="matSel" data-k="${t}" aria-pressed="${ui.matSel === t}" title="${a.n}" style="--rc:var(${e >= 3 ? "--r3" : e >= 2 ? "--rs" : "--r0"})"><img src="${matIcon(a.f)}" alt=""${n ? ' class="prism"' : ""}><span class="pp">${"<i></i>".repeat(e)}</span>${s ? `<span class="lv">${s}</span>` : ""}${n ? '<i class="mirf"></i><i class="spk"></i>' : ""}</button>`;
  },
  matUse = (t) =>
    ({
      x1: `成功率 ${XTR.ok[1]}%，將稀有以上的裝備萃取為符文石`,
      x2: "成功率 100%，將稀有以上的裝備萃取為符文石",
      x3: `成功率 100%；${XTR.uq[3]}% 機率取出獨特效果`,
      x4: `成功率 100%；獨特效果 ${XTR.uq[4]}%；詞綴 ${XTR.up[4]}% 機率升階`,
      i1: "將符文石灌注至魔法以上的非獨特裝備",
      i2: "將符文石灌注至魔法以上的裝備（含獨特）",
      i3: "可灌注所有魔法以上裝備，亦可鑲嵌插槽裝備",
      i4: "將獨特效果符文灌注至同部位裝備，取代一條詞綴；僅由 Lv83 以上的一般怪物掉落",
      c1: "腐化一件裝備一次，結果隨機；僅於無盡之塔掉落",
      h1: "在基底範圍內重洗基底數值；僅於無盡之塔掉落",
      m1: "使一件裝備獲得奇蹟狀態，強化下一次煉金；僅由闇答萊屍掉落",
      s1: "磨礪或灌注時保護一條詞綴，僅限當次",
      r1: "在原階級範圍內，重新隨機所有詞綴數值",
      p1: `萃取時 ${PROT_KEEP.p1}% 機率保留裝備`,
      p2: `萃取時 ${PROT_KEEP.p2}% 機率保留裝備`,
    })[t],
  corOn = () => twOpen() || S.mat.c1 > 0,
  baseTxt = (t, a) =>
    t.wd
      ? a[0] + "-" + a[1]
      : t.sl
        ? a[0] + (/%/.test(SLATE[t.b].f(1)) ? "%" : "")
        : "" + a[0],
  baseRng = (t, a) =>
    t.wd
      ? [
          ["最小傷害範圍", `${a.lo[0]}-${a.hi[0]}`],
          ["最大傷害範圍", `${a.lo[1]}-${a.hi[1]}`],
        ]
      : [["範圍", `${a.lo[0]}-${baseTxt(t, a.hi)}`]],
  baseRow = (t, a) => {
    const s = baseInfo(t),
      e = Math.round(100 * baseQ(t));
    return s
      ? a
        ? `<div class="base def"><span class="kv">基底 <b>${baseTxt(t, s.v)}</b></span>${baseRng(
            t,
            s,
          )
            .map(
              ([t, a]) =>
                `<span class="kv rng"><span>${t}</span><b>${a}</b></span>`,
            )
            .join("")}<span class="kv">品質 <b>${e}%</b></span></div>`
        : `<div class="base def"><span class="kv">基底 <b>${baseTxt(t, s.v)}（${e}%）</b></span></div>`
      : "";
  },
  holyOn = () => twOpen() || S.mat.h1 > 0,
  canHoly = (t) => !t.cor && !t.sock && !!baseInfo(t),
  endOn = () => slatesUnlocked() || twOpen() || S.mat.s1 > 0 || S.mat.r1 > 0,
  canReroll = (t) => !t.cor && !t.sock && t.af && t.af.length > 0,
  alchFind = (t) =>
    [
      ...S.bag,
      ...SLOTS.map((t) => S.equip[t]),
      ...S.slates,
      ...slatesPlaced(),
    ].find((a) => a && a.u === t),
  gFree = () => {
    const t = new Set(
      S.gpages.flatMap((t, a) => (a !== S.gp && t ? t.map((t) => t[0]) : [])),
    );
    return S.gems.filter((a) => a.x < 0 && !t.has(a.u));
  },
  gfMats = (t) => gFree().filter((a) => a.id === t && a.sh),
  gsMats = (t) =>
    gFree().filter(
      (a) => !SKILLS[a.id].act == !t,
    ),
  cfW = (t) => `<span class="w">${t}</span>`,
  mythW = (t = "獨特", a) => [
    cfW(`這是超稀有的神話${t}`),
    cfW(
      a && a.uq && UNIQUE[a.uq].myw
        ? `掉落率僅獸人酋長之戒的 1/${Math.round(1 / UNIQUE[a.uq].myw)}`
        : `掉落率僅 1/${Math.round(1 / MYTH_P)}`,
    ),
  ],
  cfAsh = (t) =>
    `Zeny <span class="px"${S.ash < t ? ' style="color:var(--bad)"' : ""}>${fmt(t)}</span><img class="ashI" src="${shopIcon("ash")}" alt="" style="margin-left:2px">`,
  cfCard = (t, a, s, e, n, l = "cancel", o = "", r = "danger") =>
    `<h2 class="cfh">${t}</h2>${a}<div class="cfl">${s
      .filter(Boolean)
      .map((t) => `<div>${t}</div>`)
      .join(
        "",
      )}</div>\n  <div class="row"><button class="btn" data-act="${l}">取消</button><span class="spacer"></span><button class="btn ${r}" data-${r.includes("hold") ? "hold" : "act"}="${n}" ${o}><span>${e}</span></button></div>`,
  nocfChk = () =>
    `<label class="chk"><input type="checkbox" data-act="nocf" ${S.set.nocf ? "checked" : ""}><span>下次不再跳出確認視窗</span></label>`,
  cfGain = (t) =>
    `獲得Zeny <span class="px">+${fmt(t)}</span><img class="ashI" src="${shopIcon("ash")}" alt="" style="margin-left:2px">`,
  cfCells = (t) =>
    `<div class="grid">${t
      .slice(0, 14)
      .map((t) => cellHtml(t, "none", !1))
      .join(
        "",
      )}</div>${t.length > 14 ? `<p class="note" style="margin:0">還有 <span class="px">${t.length - 14}</span> 件</p>` : ""}`,
  matBoard = () =>
    `<div class="board mboard">${[
      ["神秘金屬", MAT_ORDER[0]],
      ["鋁", MAT_ORDER[1]],
      ["保護石", MAT_ORDER[2]],
      endOn() && [
        "終局",
        [
          "s1",
          "r1",
          ...(corOn() ? ["c1"] : []),
          ...(mirOn() ? ["m1"] : []),
          ...(holyOn() ? ["h1"] : []),
        ],
      ],
    ]
      .filter(Boolean)
      .map(
        ([t, a]) =>
          `<div class="mrow"><span>${t}</span>${a.map(matCell).join("")}</div>`,
      )
      .join("")}</div>`,
  aWallet = () =>
    `<span class="wallet"><img class="ashI" src="${shopIcon("ash")}" alt="Zeny"><span class="px">${fmt(S.ash)}</span></span>`,
  matStrip = (t) =>
    `<div class="mstrip">${t.map(matCell).join("")}${aWallet()}</div>`,
  arowHtml = (t, a) =>
    `<div class="li arow${a ? " cur" : ""}" data-act="asel" data-u="${t.u}">${cellHtml(t, "asel", a)}<div class="grow">\n  <div class="an"><span class="${rc(t)}">${esc(itemName(t))}</span>${S.equip[t.slot] === t || slatesPlaced().includes(t) ? '<span class="tag aeq">使用中</span>' : ""}</div>\n  ${t.af.map((t) => `<div class="aal"><span class="tag" style="color:${null != AFFIX[t.a].dv ? "var(--dv)" : tierCol(t)}">T${t.t}</span> ${esc(AFFIX[t.a].f(t.v))}</div>`).join("")}\n  ${uqKeys(
      t,
    )
      .map((a) => `<div class="aal auq">${esc(uqText(a, t.cm || 1))}</div>`)
      .join(
        "",
      )}${(t.dg || []).map((t) => `<div class="aal adg">${esc(AFFIX[t.a].f(t.v))}</div>`).join("")}</div></div>`,
  AX_MATS = {
    x: [...MAT_ORDER[0], ...MAT_ORDER[2]],
    i: [...MAT_ORDER[1], "s1"],
    r: ["r1", "s1"],
    c: ["c1"],
    m: ["m1"],
    h: ["h1"],
  },
  AX_HELP = {
    x: "alch",
    i: "inf",
    r: "reroll",
    c: "corr",
    m: "mir",
    h: "holy",
    k: "craft",
    s: "fuse",
  },
  runeStack = (t) => {
    const a = new Map();
    for (const s of t) {
      const t = s.uq ? s.uq : `${s.t}|${s.v}`;
      (a.has(t) || a.set(t, []), a.get(t).push(s));
    }
    return [...a.values()];
  },
  stackN = (t) => (t.length > 1 ? `<span class="px">X${t.length}</span>` : "");
function runeGrp(t, a, s, e, n) {
  const l = new Map(),
    o = Object.keys(AFFIX);
  for (const a of t) {
    const t = a.uq ? "~uq" : a.a;
    (l.has(t) || l.set(t, []), l.get(t).push(a));
  }
  const r = [...l]
      .map(([t, a]) => [
        t,
        a.sort((t, a) => runeT(t) - runeT(a) || runeQ(a) - runeQ(t)),
      ])
      .sort((t, a) => o.indexOf(t[0]) - o.indexOf(a[0])),
    i = (t, e, n, l) =>
      `<button class="li infg${l ? " isubH" : ""}" data-act="${s}" data-k="${t}" aria-expanded="${a.has(t)}">${runeTag(e[0])}<span class="grow">${n}</span><span class="px">X${e.length}</span><span class="px">${a.has(t) ? "－" : "＋"}</span></button>`,
    c = (t, l) => {
      const o = n ? runeStack(l) : l.map((t) => [t]),
        r = a.n?.[t] || 60;
      return (
        o
          .slice(0, r)
          .map((t) => e(t[0], t))
          .join("") +
        (o.length > r
          ? `<button class="li" data-act="${s}" data-k="${t}" data-more="1">再顯示 <span class="px">${Math.min(60, o.length - r)}</span> ${n ? "種" : "顆"}</button>`
          : "")
      );
    };
  return r
    .map(
      ([t, s]) =>
        i(t, s, "~uq" === t ? "獨特效果" : AFFIX[t].n) +
        (a.has(t)
          ? "~uq" === t
            ? ((t) => {
                const s = new Map(),
                  e = Object.keys(UNIQUE);
                for (const a of t)
                  (s.has(a.uq) || s.set(a.uq, []), s.get(a.uq).push(a));
                return [...s]
                  .sort((t, a) => e.indexOf(t[0]) - e.indexOf(a[0]))
                  .map(([t, s]) => {
                    const e = "~uq:" + t;
                    return (
                      i(e, s, esc(UNIQUE[t].n), 1) +
                      (a.has(e)
                        ? `<div class="list isub">${c(e, s)}</div>`
                        : "")
                    );
                  })
                  .join("");
              })(s)
            : c(t, s)
          : ""),
    )
    .join("");
}
function rgTap(t, a, s) {
  const e = (t.n ||= {});
  s ? (e[a] = (e[a] || 60) + 60) : t.delete(a) ? delete e[a] : t.add(a);
}
const AX_ACTS = new Set([
  "xopt",
  "aopt",
  "alch",
  "alchYes",
  "infr",
  "infg",
  "sealopt",
  "sealj",
  "rr",
  "rrYes",
  "cor",
  "corYes",
  "holy",
  "holyYes",
  "mirpick",
  "mir",
  "inf",
  "infYes",
  "nocf",
  "cancel",
]);
function matOpen(t) {
  const a = MATS[t];
  (($("#sheet").className = "matp"),
    ($("#sheet").innerHTML =
      `<div class="row" style="flex-wrap:nowrap">${matCell(t)}<div class="grow"><b${"m" === a.f ? ' class="mirt"' : ""}>${a.n}</b><div class="note" style="margin:0">持有 <span class="px">${S.mat[t] || 0}</span></div></div></div>\n    <div class="cfl">${matUse(
        t,
      )
        .split(/[；，]/)
        .map((t) => `<div>${t}</div>`)
        .join(
          "",
        )}</div><div class="row"><span class="spacer"></span><button class="btn primary" data-act="close">知道了</button></div>`),
    ($("#sheetBg").hidden = !1));
}
const runeAsh = (t) => (t.uq ? 40 : Math.round(4 + 16 * tierQ(t))),
  RUNE_TF = [
    [0, "不自動分解"],
    ...[1, 2, 3, 4, 5, 6, 7, 8].map((t) => [t, `T${t} 或更差`]),
  ],
  rSalvOk = (t, a) =>
    a > 0 && !t.uq && !isStaged(t.u) && t.t >= a && !keepMatch(t, S.set.rkeep),
  RUNE_TF_SL = RUNE_TF.slice(0, 4),
  rAutoK = (t) => (!t.uq && isSlateAf(t.a) ? S.set.rautoS : S.set.rauto) || 0,
  RUNE_BF = [[0, "不分解"], ...RUNE_TF.slice(1)],
  RUNE_BF_SL = RUNE_BF.slice(0, 4),
  rBulk = () =>
    S.runes.filter((t) =>
      rSalvOk(
        t,
        !t.uq && isSlateAf(t.a) ? S.set.rbulkS || 0 : (S.set.rbulk ?? 6),
      ),
    );
function previewEquip(t, a) {
  const s = S.equip[t.slot];
  ((S.equip[t.slot] = t), a && (WEAR_ANY = t));
  try {
    return calc();
  } finally {
    ((S.equip[t.slot] = s), (WEAR_ANY = null));
  }
}
let PV = { ps: null, m: new WeakMap() };
const pvClear = () => {
  PV = { ps: PS, m: new WeakMap() };
};
function pvGet(t) {
  PV.ps !== PS && pvClear();
  let a = PV.m.get(t);
  if (!a) {
    const s = previewEquip(t);
    ((a = { dps: s.dps, maxhp: s.maxhp }), PV.m.set(t, a));
  }
  return a;
}
function srcName(t) {
  if (SLOT_NAME[t]) return SLOT_NAME[t];
  if (t.startsWith("card")) return "卡牌・" + MAPS[+t.slice(4)].n;
  if (t.startsWith("uq:")) return UNIQUE[t.slice(3)].n;
  if (t.startsWith("tal:")) {
    const a = t.slice(4);
    for (const t of Object.values(ASC).flat())
      for (const s of t.t)
        for (const t of s) if (t.k === a) return "天賦・" + t.n;
  }
  return t;
}
function crsBreak() {
  const t = [];
  for (const [a, s] of [
    ["crs", "詛咒效果"],
    ["crsR", "詛咒範圍"],
  ]) {
    const e = {};
    for (const t of PS.mods)
      t.s === a && !t.x && t.v && (e[t.src] = (e[t.src] || 0) + t.v);
    const n = Object.keys(e);
    n.length &&
      t.push(
        `<div class="brow"><span>${s}</span><b class="px">+${fmt(100 * n.reduce((t, a) => t + e[a], 0))}%</b></div><div class="bsrc">${n.map((t) => `${esc(srcName(t))} +${fmt(100 * e[t])}%`).join("・")}</div>`,
      );
  }
  return (
    1 !== PS.area &&
      t.push(
        `<div class="brow"><span>技能範圍</span><b class="px">×${PS.area.toFixed(2)}</b></div>`,
      ),
    t.length ? t.join("") : '<div class="bsrc">目前沒有額外加成。</div>'
  );
}
function skillBreak(t) {
  const a = SKILLS[t.id],
    s = a.tg || [],
    e = [],
    n = s.includes("minion"),
    l = [
      ["dmgp", "傷害增加"],
      n ? ["minp", "召喚物傷害"] : ["skill", "技能傷害"],
      ["crit", "暴擊率"],
      ["critm", "暴擊傷害"],
      ...(s.includes("aoe") ? [["area", "技能範圍"]] : []),
      ...(a.sus ? [] : [["cdr", "冷卻縮減"]]),
      ...(s.includes("psn") ? [["psn", "中毒傷害"]] : []),
      ...("brn" === a.ail ? [["brn", "燃燒傷害"]] : []),
      ...("bld" === a.ail ? [["bld", "流血傷害"]] : []),
    ],
    o = gemCrit(t),
    r = (t, a, s) => {
      s && (t[a] = (t[a] || 0) + s);
    };
  for (const [a, s] of l) {
    const n = "crit" === a || "critm" === a,
      l = {};
    if (
      ("crit" === a &&
        o.own &&
        r(l, "武器基礎", +(PS.critRaw - PS.st.crit).toFixed(1)),
      "critm" === a && r(l, "基礎", 150),
      !n || o.own)
    )
      for (const t of PS.mods)
        t.s === a && !t.x && t.v && (l[t.src] = (l[t.src] || 0) + t.v);
    if (n) {
      for (const s of linkedSupports(t))
        r(l, SKILLS[s.id].n, SKILLS[s.id].mod[a]);
      "critm" === a &&
        r(l, "uq:ovf", critOvr(PS, o.c, o.own) + (o.own ? PS.ovcB : 0));
    }
    const i = Object.keys(l);
    if (!i.length || ("crit" === a && !o.c)) continue;
    const c = i.reduce((t, a) => t + l[a], 0);
    e.push(
      `<div class="brow"><span>${s}</span><b class="px">${"crit" === a ? capT(o.ch, o.c) : "critm" === a ? fmt(o.cm) + "%" : `${c > 0 ? "+" : ""}${fmt(c)}%`}</b></div><div class="bsrc">${i.map((t) => `${esc(srcName(t))} ${l[t] > 0 ? "+" : ""}${fmt(l[t])}`).join("・")}</div>`,
    );
  }
  for (const t of PS.mods)
    "more" !== t.x ||
      ("dmg" !== t.s && ("skill" !== t.s || n)) ||
      e.push(
        `<div class="brow"><span>${esc(srcName(t.src))}</span><b class="px">${"dmg" === t.s ? "" : "技能"}傷害 ×${fmt(1 + t.v / 100)}</b></div>`,
      );
  const i = [
    ...Object.keys(UNIQUE)
      .filter(
        (t) =>
          PS.U[t] && UNIQUE[t].lab && (!UNIQUE[t].labOn || UNIQUE[t].labOn()),
      )
      .map((t) => `${UNIQUE[t].n}：${uqText(t, PS.U[t], UNIQUE[t].lab)}`),
    ...[...HIT_MUL, ...TAKE_MUL].map((t) => t.lab && t.lab(a)).filter(Boolean),
  ];
  return (
    i.length &&
      e.push(
        `<div class="brow"><span>條件加成</span></div>${i.map((t) => `<div class="bsrc">・${esc(t)}</div>`).join("")}`,
      ),
    e.length ? e.join("") : '<div class="bsrc">目前沒有額外加成。</div>'
  );
}
let itfCell = null;
function itfShow(t) {
  const a = +t.dataset.u,
    s = S.bag.find((t) => t.u === a) || S.slates.find((t) => t.u === a);
  if (!s) return;
  let e = $("#itf");
  (e ||
    ((e = document.createElement("div")),
    (e.id = "itf"),
    document.body.appendChild(e)),
    (itfCell = t),
    (e.innerHTML =
      "slate" === s.slot
        ? `<div class="li" style="display:flex;gap:8px">${slateRow(s)}</div>`
        : ui.itemHead(s) + ui.statHtml(s)),
    (e.hidden = !1));
  const n = t.getBoundingClientRect(),
    l = e.offsetWidth,
    o = e.offsetHeight,
    r = document.documentElement.clientWidth,
    i = document.documentElement.clientHeight;
  let c = n.bottom + 4;
  (c + o > i - 8 && (c = n.top - o - 4),
    c < 8 && (c = Math.max(8, i - o - 8)),
    (e.style.left =
      Math.round(Math.max(8, Math.min(n.left, r - l - 8))) + "px"),
    (e.style.top = Math.round(c) + "px"));
}
function itfHide() {
  itfCell = null;
  const t = $("#itf");
  t && (t.hidden = !0);
}
setInterval(() => {
  !itfCell || (itfCell.isConnected && !$("#sheetBg").hidden) || itfHide();
}, 200);
const ui = {
  tab: "char",
  charView: "st",
  mapView: "map",
  bagView: "items",
  moreView: null,
  mdot: {},
  selGem: null,
  sealPick: !1,
  sealJ: null,
  rot: 0,
  ghost: null,
  sel: null,
  alchSel: null,
  alchOpt: { p: 0, x: 0 },
  alchRes: null,
  alchMode: "x",
  infR: null,
  matSel: null,
  sockU: null,
  brk: {},
  confirm: null,
  badges: {},
  needs: !1,
  hudT: 0,
  hudKey: "",
  tcT: 0,
  tcH: "",
  badge(t, a) {
    if (this.tab === t && a) return;
    this.badges[t] = a;
    const s = document.querySelector(`#tabs [data-tab="${t}"]`);
    if (!s) return;
    let e = s.querySelector(".dot");
    (a &&
      !e &&
      ((e = document.createElement("i")),
      (e.className = "dot"),
      s.appendChild(e)),
      !a && e && e.remove());
  },
  menuDot(t, a) {
    ((this.mdot[t] = a),
      this.badge("more", Object.values(this.mdot).some(Boolean) ? 1 : 0),
      "more" !== this.tab || this.moreView || (this.needs = !0));
  },
  openMenu(t) {
    this.setTab("more", t);
  },
  refreshIf(...t) {
    t.includes(this.tab) && (this.needs = !0);
  },
  hud() {
    if (!S || !G) return;
    const t = curMap(),
      a = S.prog[S.map],
      s = mapLv();
    let e,
      n,
      l,
      o = "bsk",
      r = `${t.n}<b>LV${s[0] === s[1] ? s[0] : s[0] + "-" + s[1]}</b>`;
    if (G.arena) {
      const t = inFight(),
        a = t && G.arena.ask > G.t,
        s = Math.max(0, Math.ceil(G.arena.out));
      ((r = G.tw
        ? `${esc(G.arena.ar.n)}<b>第 ${G.tw.f} 層</b>`
        : `${esc(G.arena.ar.n)}<b>專屬場地</b>`),
        (o = "exit"),
        (l = !1),
        (e = t
          ? a
            ? "放棄挑戰？"
            : "離開"
          : G.trn
            ? "離開"
            : `離開<b>${s}</b>`),
        (n = "chip leave" + (a ? " ask" : "")));
    } else if (G.boss) {
      const a = Math.max(0, Math.ceil(G.bossT));
      ((e = `${esc(null != G.guard ? gdef(G.guard).n : null != G.trial ? TRIAL[G.trial].boss : G.bn || t.boss)}<b>${Math.floor(a / 60)}:${String(a % 60).padStart(2, "0")}</b>`),
        (n = "chip fight"),
        (l = !0));
    } else if (ssMap()) {
      const t = Math.max(...S.ssf),
        a = t >= SS.fragN && !G.dead;
      ((e = a ? "挑戰首領" : `碎片<b>${t}/${SS.fragN}</b>`),
        (n = a ? "chip ready" : "chip"),
        (l = !a));
    } else
      a >= bossNeed(S.map) && !G.dead
        ? ((e = "挑戰 BOSS"), (n = "chip ready"), (l = !1))
        : ((e = `BOSS<b>${a}/${bossNeed(S.map)}</b>`), (n = "chip"), (l = !0));
    const i = QUESTS[S.q],
      c = i ? Math.min(i.n, "level" === i.k ? S.lvl : S.qp) : 0,
      d = i
        ? `<span class="qk">任務</span>${esc(i.d)}${i.n > 1 ? `<b>${c}/${i.n}</b>` : ""}`
        : "",
      f = G.tw
        ? twLines()
        : !G.arena && slatesOn().length
          ? slSumLines(S.map)
          : [],
      p = f.length
        ? `<div class="hd">${G.tw ? "無盡之塔" : "石板詞綴"}${S.set.slc ? `<b>${f.length}</b> ▸` : " ▾"}</div>` +
          (S.set.slc
            ? ""
            : f.map(([t, a]) => `<div class="${a}">${esc(t)}</div>`).join(""))
        : "",
      u =
        SEASON.on && !G.arena
          ? `<span class="qk">活動</span>${SEASON.n}${ssOpen() && !S.ssSeen ? '<i class="dot"></i>' : ""}`
          : "",
      h = G.dl && G.t - G.dl.at < 40 && G.dl.hits.length ? 1 : 0;
    if (G.trn && --this.tcT <= 0) {
      ((this.tcT = 3), (this.tcH = trnChipHtml()));
      const t = $("#trnFull");
      t && (t.innerHTML = trnFullHtml());
    }
    const m = G.trn ? this.tcH : "",
      A = r + e + n + d + p + u + h + m;
    if (A !== this.hudKey) {
      this.hudKey = A;
      const t = $("#questChip");
      ((t.hidden = !i || !!m), (t.innerHTML = d), ($("#dieChip").hidden = !h));
      const a = $("#trnChip");
      ((a.hidden = !m), (a.innerHTML = m));
      const s = $("#ssChip");
      ((s.hidden = !u), (s.innerHTML = u));
      const c = $("#slChip");
      ((c.hidden = !p), (c.innerHTML = p), ($("#mapChip").innerHTML = r));
      const f = $("#bossBtn"),
        g = `<img src="${iconURL(o)}" alt=""><span>${e}</span>`;
      (f.innerHTML !== g && (f.innerHTML = g),
        (f.className = n),
        (f.disabled = l));
    }
    this.chipDim();
  },
  chipDim() {
    const t = cv.getBoundingClientRect(),
      a = t.width / cv.width || 1,
      s = Math.round(G.cy || 0),
      e = (e) =>
        e && [
          t.left + (e.x - 11) * a,
          t.top + (e.y - s - 24) * a,
          t.left + (e.x + 11) * a,
          t.top + (e.y - s + 4) * a,
        ],
      n = [
        G.dead ? null : e(G.pl),
        G.pl.tgt && alive(G.pl.tgt) ? e(G.pl.tgt) : null,
      ].filter(Boolean);
    for (const t of [
      "#mapChip",
      "#bossBtn",
      "#questChip",
      "#slChip",
      "#ssChip",
      "#dieChip",
    ]) {
      const a = $(t);
      if (a.hidden) continue;
      if ("#slChip" === t && S.set.slnd) {
        a.classList.remove("dim");
        continue;
      }
      const s = a.getBoundingClientRect(),
        e = n.some(
          (t) =>
            t[0] < s.right && t[2] > s.left && t[1] < s.bottom && t[3] > s.top,
        );
      a.classList.toggle("dim", e);
    }
  },
  gemSeen: new Set(),
  gemSeenNow() {
    let t = 0;
    for (const a of S.gems)
      a.nw && (this.gemSeen.has(a) || a.x >= 0) && (delete a.nw, t++);
    (this.gemSeen.clear(),
      t && markDirty(),
      S.gems.some((t) => t.nw) && this.badge("skill", 1));
  },
  alchTab() {
    const t = document.querySelector('#tabs [data-tab="alch"]');
    t && t.classList.toggle("lk", !S.alchOn);
  },
  setTab(t, a) {
    const s = "skill" === this.tab && "skill" !== t;
    ("more" === t && ((this.moreView = a || null), a && this.menuDot(a, 0)),
      (this.tab = t),
      this.badge(t, 0),
      s && this.gemSeenNow(),
      "more" !== t &&
        this.badge("more", Object.values(this.mdot).some(Boolean) ? 1 : 0),
      document.body.classList.toggle(
        "sk",
        ["skill", "bag", "alch"].includes(t),
      ),
      document
        .querySelectorAll("#tabs button")
        .forEach((a) => a.setAttribute("aria-selected", a.dataset.tab === t)),
      drag && dragStop(!1),
      "skill" !== t && (dropGhost(), (this.selGem = null)),
      (this.confirm = null),
      (this.craftRes = null),
      (this.mergeRes = null),
      this.render(),
      ($("#panel").scrollTop = 0),
      autoHelp("more" === t ? AUTO_HELP[this.moreView] : AUTO_HELP[t]));
  },
  render() {
    this.needs = !1;
    const t = $("#panel"),
      a = t.scrollTop,
      s = $("#panel .detail")?.scrollTop || 0,
      e = $("#panel .runeScroll")?.scrollTop || 0;
    ((t.innerHTML = this["p_" + this.tab]()), (t.scrollTop = a));
    const n = $("#panel .detail"),
      l = $("#panel .bagScroll");
    if (n) {
      (fitDetail(), (n.scrollTop = s));
      const t = n.querySelector(".runeScroll");
      t && (t.scrollTop = e);
    }
    (l && (n || fitDetail(), (l.scrollTop = this.bagTop || 0), bagHint(l)),
      bagFill());
  },
  ascHtml() {
    const t = S.tal,
      a = ascBranch(),
      s = t.n - 2 * t.p.length;
    return t.tr
      ? a
        ? `<h2>職業天賦・${a.n}${helpBtn("asc")}</h2>\n      <div class="board"><div class="row"><span>${esc(a.d)}</span></div>\n        <div class="row"><span>天賦點 <span class="px">${s}</span> / <span class="px">${t.n}</span>・試煉 <span class="px">${t.tr}/${TRIAL.length}</span></span></div>\n        <div class="row"><span class="spacer"></span><button class="btn sm" data-act="talReset" ${t.p.length ? "" : "disabled"}>重置天賦點</button><button class="btn sm" data-act="ascReset">重置職業</button></div></div>\n      ${a.t
            .map(
              (e, n) =>
                `<h3>第 ${n + 1} 排</h3><div class="talRow">${e
                  .map((e) =>
                    ((e, n) => {
                      const l = t.p.includes(e.k),
                        o =
                          0 === n || a.t[n - 1].some((a) => t.p.includes(a.k)),
                        rp = a.t[n].some((a) => t.p.includes(a.k)),
                        r = !l && o && s >= 2 && !rp;
                      return `<div class="tal ${l ? "on" : ""} ${o || l ? "" : "locked"}"><b>${e.n}</b><div>${esc(e.d)}</div>\n        ${l ? '<span class="tag">已學習</span>' : `<button class="btn sm ${r ? "primary" : ""}" data-act="talL" data-k="${e.k}" ${r ? "" : "disabled"}>${rp ? "本排已選" : o ? (s < 2 ? "點數不足" : '學習・<span class="px">2</span> 點') : "先學上一排"}</button>`}</div>`;
                    })(e, n),
                  )
                  .join("")}</div>`,
            )
            .join("")}`
        : `<h2>職業天賦${helpBtn("asc")}</h2><p class="note">已完成試煉，尚未選擇分支。</p><div class="row"><button class="btn primary" data-act="ascPick">選擇分支</button></div>`
      : `<h2>職業天賦${helpBtn("asc")}</h2><p class="note">達到 ${TRIAL[0].lv} 級後，可於地圖分頁上方挑戰「${TRIAL[0].n}」。</p>`;
  },
  p_char() {
    const t = `<div class="seg" style="margin-bottom:8px">${[
        ["st", "屬性"],
        ["asc", "職業天賦"],
      ]
        .map(
          ([t, a]) =>
            `<button data-act="cview" data-v="${t}" aria-pressed="${this.charView === t}">${a}</button>`,
        )
        .join("")}</div>`,
      a = `<div class="row" style="margin-bottom:8px"><b>${esc(S.name || "未命名")}</b><span style="color:var(--muted)">${CLASS[S.cls].n} <span class="px">LV${S.lvl}</span></span><span class="spacer"></span><button class="btn sm" data-act="chars">切換角色</button></div>`;
    return "asc" === this.charView
      ? a + bldSeg() + t + this.ascHtml()
      : a + bldSeg() + t + this.charStats();
  },
  artBoard() {
    const t = Object.keys(ARTS),
      a = t.filter((t) => S.art.has[t]);
    if (!a.length && !SEASON.on) return "";
    const s = artCur(),
      e = s && S.art.has[s],
      n = e ? artStage(e.lv) : 0,
      l = `<div class="artFoot">${t.map((t) => (S.art.has[t] ? `<button class="cell asl${t === s ? " sel" : ""}" data-act="artOn" data-k="${t}" style="--rc:#ffc83a;--glow:#ffc83a40" aria-label="${ARTS[t].n}"><img src="${iconURL(ARTS[t].ic)}" alt=""><span class="lv">${S.art.has[t].lv}</span></button>` : `<div class="cell empty asl none" aria-label="未取得"><img src="${iconURL(ARTS[t].ic)}" alt=""></div>`)).join("")}<span class="spacer"></span>${s ? '<button class="btn sm" data-act="artOff">卸下</button>' : ""}</div>`;
    if (!e)
      return `<h3>神器${helpBtn("art")}</h3><div class="artCard">${l}<p class="note" style="margin:0">${a.length ? "點選神器即可裝備。" : `擊敗「${MAPS[SS_MAP].n}」的生態首領有機率獲得。`}</p></div>`;
    const o = e.lv >= ART.max,
      r = artStep(s);
    return `<h3>神器${helpBtn("art")}</h3><div class="artCard">\n      <div class="artHead"><span class="artBig${2 === n ? " aw" : ""}"><img src="${iconURL(ARTS[s].ic)}" alt=""></span>\n        <div class="artInfo"><div class="artName">${ARTS[s].n}</div>\n          <div class="row" style="gap:6px"><span class="px">LV${e.lv}</span><span class="tag" style="color:var(${2 === n ? "--dv" : n ? "--ember" : "--muted"})">${ART_SN[n]}</span><span class="spacer"></span><span class="px" style="color:var(--muted)">${o ? "MAX" : `${fmt(e.xp)}/${fmt(ART.need(e.lv))}`}</span></div>\n          <span class="mbar artXp"><i style="width:${o ? 100 : (e.xp / ART.need(e.lv)) * 100}%"></i></span></div></div>\n      <dl class="artKv">${artRows(
      s,
      e.lv,
    )
      .map(
        ([t, a]) =>
          `<dt>${t}</dt><dd${"覺醒" === t ? ' class="aw"' : ""}>${esc(a)}</dd>`,
      )
      .join(
        "",
      )}</dl>\n      <div class="artSteps">${ART_LV.map((t, a) => `<div class="astep${a < n ? " done" : a === n ? " cur" : ""}"><b><span class="px">LV${t}</span> ${ART_SN[a]}</b><span>${esc(r[a])}</span></div>`).join("")}</div>\n      ${l}</div>`;
  },
  liveChar() {
    const t = $("#lvAps");
    if (!t || !G) return;
    const a = (t, a, s) => {
        const e = a ? s : "";
        t && t.textContent !== e && (t.textContent = e);
      },
      s = fold(SPD_AS, PS.aps) * fold(SPD_TICK, 1),
      e = fold(SPD_MS, PS.move),
      n = PS.dodge;
    a(t, Math.abs(s - PS.aps) >= 0.005, `（戰鬥中 ${s.toFixed(2)}）`);
    const l =
      PS.act * (tal("actFromMove") ? fold(SPD_MS, 1, null, (t) => !t.act) : 1);
    (a(
      $("#lvAct"),
      Math.abs(l - PS.act) >= 0.005,
      `（戰鬥中 ${l.toFixed(2)}）`,
    ),
      a(
        $("#lvMs"),
        Math.round(e) !== Math.round(PS.move),
        `（戰鬥中 ${Math.round(e)}）`,
      ),
      a(
        $("#lvDg"),
        Math.abs(n - PS.dodge) >= 0.05,
        `（戰鬥中 ${n.toFixed(1)}%）`,
      ));
  },
  charStats() {
    const t = PS,
      a =
        (t.mn,
        t.mx,
        SLOTS.map((t) => S.equip[t])
          .filter((t) => t && uqKey(t))
          .flatMap((t) => uqKeys(t).map((a) => [t, a]))),
      s = SLOTS.map((t) =>
        S.equip[t]
          ? cellHtml(S.equip[t], "goItem")
          : `<button class="cell empty" disabled aria-label="${SLOT_NAME[t]}（空）"><img src="${emptyIcon(t)}" alt=""></button>`,
      ).join("");
    return `<h2>${CLASS[S.cls].n}${ascBranch() ? "・" + ascBranch().n : ""}・等級 <span class="px">${S.lvl}</span>${helpBtn("char")}</h2>${S.title ? `<p class="note" style="margin:-4px 0 6px">稱號：<b style="color:var(--ember)">${esc(S.title)}</b></p>` : ""}\n    <div class="doll" style="grid-template-columns:repeat(7,minmax(0,1fr))">${s}</div>${this.artBoard()}\n    ${psRows(psSnap(), 1)}\n    <h3>自動藥水</h3>\n    <div class="box stack">\n      <label for="potPct" style="font-size:12px">生命低於 <b class="px" id="potLbl">${S.potPct}%</b> 時自動使用藥水<br>（冷卻 4 秒，回復 ${Math.round(35 * t.pot)}%，剩餘 <b class="px">${S.pot}</b> 瓶）</label>\n      <input type="range" id="potPct" min="10" max="90" step="5" value="${S.potPct}" style="--v:${((S.potPct - 10) / 80) * 100}%">\n      <label class="chk"><input type="checkbox" data-act="apb" ${S.set.apb ? "checked" : ""}><span>藥水用完時自動購買（Zeny <span class="px">30</span>／<span class="px">5</span> 瓶）</span></label>\n    </div>\n    <h3>戰鬥方式</h3>\n    <div class="box stack"><label class="chk"><input type="checkbox" data-act="psv" ${S.set.psv ? "checked" : ""}><span>消極模式：遠離怪物，進入攻擊範圍才攻擊（含頭目戰）</span></label>\n      <label class="chk"><input type="checkbox" data-act="nob" ${S.set.nob ? "checked" : ""}><span>關閉普通攻擊：只施放技能</span></label></div>\n    ${a.length ? `<h3>獨特效果</h3><div class="box stack">${a.map(([t, a]) => `<div class="uniq"><b>${esc(a === t.uq ? t.name : UNIQUE[a].n)}</b>：${esc(uqText(a, t.cm || 1))}</div>`).join("")}</div>` : ""}`;
  },
  p_bag() {
    ((this.lstMore = !1),
      "slates" !== this.bagView ||
        slatesUnlocked() ||
        (this.bagView = "items"));
    const t = "runes" === this.bagView,
      a = "slates" === this.bagView,
      s = `<div class="row" style="margin-bottom:10px"><div class="seg" style="flex:1">\n      <button data-act="bagv" data-v="items" aria-pressed="${!t && !a}">裝備 <span class="px">${S.bag.length}/${BAG_MAX}</span></button>\n      <button data-act="bagv" data-v="runes" aria-pressed="${t}">符文 <span class="px">${S.runes.length}/5000</span></button>\n      ${slatesUnlocked() ? `<button data-act="bagv" data-v="slates" aria-pressed="${a}">石板 <span class="px">${S.slates.length}/5000</span></button>` : ""}</div></div>`,
      e = bagOpt();
    if (a) {
      const t = S.slt.flatMap((t, a) =>
          t ? t.s.filter(Boolean).map((t) => [t, a]) : [],
        ),
        a = (t) =>
          `<button class="btn sm" data-act="lock" data-u="${t.u}" aria-pressed="${!!t.lk}">${t.lk ? "解鎖" : "鎖定"}</button>`,
        e = (t, a) =>
          (a || slatesPlaced().includes(t) ? this.alchList(t, a) : [])
            .map(
              ([a, s]) =>
                `<button class="btn sm" data-act="toAlch" data-v="${a}" data-u="${t.u}">${s}</button>`,
            )
            .join(""),
        n = (t, s) =>
          `<div class="li">${slateRow(t)}${null != s ? `<div class="stack" style="gap:4px;align-items:flex-end"><span class="note">使用中</span>${e(t)}${a(t)}</div>` : `<div class="stack" style="gap:4px">${t.sock ? `<button class="btn sm primary" data-act="sock" data-u="${t.u}">鑲嵌</button>` : ""}${e(t, !0)}${a(t)}${t.lk ? "" : `<button class="btn sm" data-act="ssalv" data-u="${t.u}">分解 <span class="px">+${slateAsh(t)}</span></button>`}</div>`}</div>`,
        l = slateList(),
        o = this.bagTool,
        r = slSet(),
        i = slOpt(),
        c = slBulk(),
        d = c.reduce((t, a) => t + slateAsh(a), 0),
        f = KEEP_RAR_SL,
        p = (t, a) =>
          `<div class="row">${f.map((s, e) => `<label class="chk"><input type="checkbox" data-act="${t}" data-i="${e}" ${a[e] ? "checked" : ""}><span class="${e > 3 ? "cs" : "c" + e}">${s}</span></label>`).join("")}</div>`,
        u =
          {
            auto: `<div class="box stack"><div class="row"><span class="note">拾取時自動分解石板</span>${helpBtn("slate", 12)}</div>${p("sauto", r.sauto)}</div>`,
            bulk: `<div class="box stack"><div class="row"><span class="note">勾選要分解的稀有度</span></div>${p("sbulkr", i.bulk)}\n          <button class="btn" data-act="sbulk" ${c.length ? "" : "disabled"}>分解 <span class="px">${c.length}</span> 塊${i.b >= 0 ? "・" + SLATE[i.b].n : ""}（<span class="px">+${d}</span>）</button></div>`,
            keep: "keep" === o ? keepBox(1) : "",
          }[o] || "",
        h = `<div class="row tools">${[
          ["auto", "拾取篩選"],
          ["bulk", "批次分解"],
          ["keep", "保留規則"],
        ]
          .map(
            ([t, a]) =>
              `<button class="btn sm" data-act="btool" data-v="${t}" aria-pressed="${o === t}">${a} ${o === t ? "▲" : "▼"}</button>`,
          )
          .join("")}</div>`,
        m = (this.lstN = Math.max(60, this.lstN || 0));
      return (
        (this.lstMore = l.length > m),
        s +
          h +
          u +
          (S.slates.length
            ? slFilt() +
              (l.length
                ? `<div class="list">${l
                    .slice(0, m)
                    .map((t) => n(t))
                    .join("")}</div>${lstMore(l.length - m)}`
                : '<p class="empty-note">沒有符合篩選的石板。</p>')
            : '<p class="empty-note">沒有未使用的石板。</p>') +
          (t.length
            ? `<h3>使用中</h3><div class="list">${t.map(([t, a]) => n(t, a)).join("")}</div>`
            : "") +
          '<p class="note">於「地圖」分頁將石板放入目前地圖。</p>'
      );
    }
    if (t) {
      const t = this.bagTool,
        a = rBulk(),
        n = a.reduce((t, a) => t + runeAsh(a), 0),
        l = `<div class="row tools">${[
          ["rauto", "自動分解"],
          ["rbulk", "批次分解"],
          ["rkeep", "保留規則"],
        ]
          .map(
            ([a, s]) =>
              `<button class="btn sm" data-act="btool" data-v="${a}" aria-pressed="${t === a}">${s} ${t === a ? "▲" : "▼"}</button>`,
          )
          .join("")}</div>`,
        o =
          {
            rauto: `<div class="box stack"><div class="row"><span class="note">萃取時自動分解</span>${helpBtn("runes")}</div><div class="row"><span style="flex:none">裝備符文</span>${selHtml("rauto", RUNE_TF, S.set.rauto || 0, "裝備符文自動分解", "rv")}</div>\n          <div class="row"><span style="flex:none">石板符文</span>${selHtml("rautoS", RUNE_TF_SL, S.set.rautoS || 0, "石板符文自動分解", "rv")}</div></div>`,
            rbulk: `<div class="box stack"><div class="row"><span class="note">分解此階級以下的符文石</span>${helpBtn("runes", 1)}</div><div class="row"><span style="flex:none">裝備符文</span>${selHtml("rbulk", RUNE_BF, S.set.rbulk ?? 6, "裝備符文批次分解階級", "rv")}</div>\n          <div class="row"><span style="flex:none">石板符文</span>${selHtml("rbulkS", RUNE_BF_SL, S.set.rbulkS || 0, "石板符文批次分解階級", "rv")}</div>\n          <button class="btn" data-act="rbulk" ${a.length ? "" : "disabled"}>分解 <span class="px">${a.length}</span> 顆（<span class="px">+${n}</span>）</button></div>`,
            rkeep: "rkeep" === t ? keepBox("r") : "",
          }[t] || "";
      if (!S.runes.length)
        return (
          s +
          l +
          o +
          '<p class="empty-note">尚無符文石。<br>可於「煉金」從裝備萃取符文石，再灌注或鑲嵌至裝備。</p>'
        );
      const r = (t) =>
          `<div class="li"><img src="${itemIcon(t)}" alt="" style="width:32px;height:32px;image-rendering:pixelated">\n        <div class="grow"><div class="t">${runeTag(t)} ${esc(runeDesc(t))}</div><div class="s">${t.uq ? `獨特效果・僅可鑲嵌於${SLOT_NAME[UNIQUE[t.uq].slot]}插槽裝備` : isSlateAf(t.a) ? "石板詞綴・僅可灌注或鑲嵌於石板" : `${AFFIX[t.a].n}・${isStaged(t.u) ? "已放入插槽（未鑲嵌）" : "可鑲嵌"}`}</div></div>\n        <button class="btn sm" data-act="rsalv" data-u="${t.u}" ${isStaged(t.u) ? "disabled" : ""}>分解 <span class="px">+${runeAsh(t)}</span></button></div>`,
        i = runeList(),
        c = [
          ...SLOTS,
          ...(S.runes.some((t) => rSlotOk(t, "slate")) ? ["slate"] : []),
        ];
      return (
        s +
        l +
        o +
        `<div class="row filt">${selHtml("rs", RUNE_SORT, e.rs, "符文石排序")}${selHtml("rsl", [["", "全部部位"], ...c.map((t) => [t, SLOT_NAME[t]])], e.rsl, "可用部位篩選")}${selHtml("rt", RUNE_TIER_F, e.rt, "階級篩選")}</div><div class="row acnt"><span class="note" style="margin:0">${i.length < S.runes.length ? `顯示 <span class="px">${i.length}/${S.runes.length}</span> 顆` : `<span class="px">${i.length}</span> 顆`}</span></div>` +
        (i.length
          ? "grp" === e.rs
            ? ((this.lstMore = !1),
              `<div class="list">${runeGrp(i, (this.rOpen ||= new Set()), "rgrp", r)}</div>`)
            : ((this.lstMore =
                i.length > (this.lstN = Math.max(60, this.lstN || 0))),
              `<div class="list">${i.slice(0, this.lstN).map(r).join("")}</div>${lstMore(i.length - this.lstN)}`)
          : '<p class="empty-note">沒有符合篩選的符文石。</p>')
      );
    }
    (findItem(this.sel) &&
      !["rune", "slate"].includes(findItem(this.sel).where)) ||
      (this.sel = S.bag[0]?.u ?? S.equip.weapon?.u ?? null);
    const n = SLOTS.map((t) =>
        S.equip[t]
          ? cellHtml(S.equip[t], "pick", S.equip[t].u === this.sel)
          : `<button class="cell empty" disabled aria-label="${SLOT_NAME[t]}（空）"><img src="${emptyIcon(t)}" alt=""></button>`,
      ).join(""),
      l = bagList(),
      o = (this.bagN = Math.max(60, this.bagN || 0)),
      r = "multi" === this.bagTool && this.msel,
      i = l
        .slice(0, o)
        .map((t) =>
          r
            ? cellHtml(t, "mpick", r.has(t.u))
                .replace(" sel ", " ms ")
                .replace(
                  /<\/button>$/,
                  r.has(t.u) ? '<i class="ck"></i></button>' : "</button>",
                )
            : cellHtml(t, "pick", t.u === this.sel),
        )
        .join(""),
      c = S.set.auto,
      d = bulkList(),
      f = d.reduce((t, a) => t + salvageValue(a), 0),
      p =
        (d.some((t) => t.rar >= 2 || t.uq),
        `<div class="row filt">${selHtml("s", BAG_SORT, e.s, "排序")}${selHtml("slot", [["", "全部部位"], ...SLOTS.map((t) => [t, SLOT_NAME[t]])], e.slot, "部位篩選")}${selHtml("r", RAR_F, e.r, "稀有度篩選")}${selHtml("kf", KF_SEL, e.kf, "規則篩選")}</div>${"cust" === e.kf ? filtBox() : ""}`),
      u = this.bagTool,
      h =
        {
          auto: `<div class="box stack"><div class="row"><span class="note">拾取時自動分解</span>${helpBtn("bag")}</div>\n      <div class="row">${[
            0, 1, 2, 3, 6, 4, 5,
          ]
            .map((t) => [
              ["普通", "魔法", "稀有", "傳奇", "獨特", "插槽", "神話"][t],
              t,
            ])
            .map(
              ([t, a]) =>
                `<label class="chk"><input type="checkbox" id="auto${a}" data-act="auto" data-i="${a}" ${c[a] ? "checked" : ""}><span class="${a > 5 ? "c4" : a > 4 ? "cs" : a > 3 ? "cu" : "c" + a}">${t}</span></label>`,
            )
            .join("")}</div>\n    </div>`,
          bulk: `<div class="box stack"><div class="row"><span class="note">勾選要分解的稀有度</span>${helpBtn("bag", 1)}</div>\n      <div class="row">${[
            0, 1, 2, 3, 6, 4, 5,
          ]
            .map((t) => [
              ["普通", "魔法", "稀有", "傳奇", "獨特", "插槽", "神話"][t],
              t,
            ])
            .map(
              ([t, a]) =>
                `<label class="chk"><input type="checkbox" id="bulk${a}" data-act="bulkr" data-i="${a}" ${e.bulk[a] ? "checked" : ""}><span class="${a > 5 ? "c4" : a > 4 ? "cs" : a > 3 ? "cu" : "c" + a}">${t}</span></label>`,
            )
            .join(
              "",
            )}</div>\n      ${e.bulk[5] ? `<div class="row" style="gap:4px;align-items:center"><span class="note">插槽孔數</span>${[2, 3, 4, 5, 6].map((t) => `<button class="btn sm ks" data-act="bulkh" data-v="${t}" aria-pressed="${e.sh.includes(t)}">${t} 孔</button>`).join("")}</div><div class="row" style="gap:4px;align-items:center"><span class="note">插槽種類</span>${SOCK_M.map(([t, a]) => `<button class="btn sm ks" data-act="bulkm" data-v="${t}" aria-pressed="${e.sm.includes(t)}">${a}</button>`).join("")}</div>` : ""}\n      <button class="btn" data-act="bulk" ${d.length ? "" : "disabled"}>分解 <span class="px">${d.length}</span> 件・${e.slot ? SLOT_NAME[e.slot] : "全部部位"}${e.kf ? "・規則篩選" : ""}（<span class="px">+${f}</span>）</button>\n    </div>`,
          keep: "keep" === u ? keepBox() : "",
        }[u] || "";
    return (
      s +
      p +
      `<div class="row tools"><button class="btn sm" data-act="btool" data-v="auto" aria-pressed="${"auto" === u}">拾取篩選 ${"auto" === u ? "▲" : "▼"}</button><button class="btn sm" data-act="btool" data-v="bulk" aria-pressed="${"bulk" === u}">批次分解 ${"bulk" === u ? "▲" : "▼"}</button><button class="btn sm${"multi" === u ? " primary" : ""}" data-act="btool" data-v="multi" aria-pressed="${"multi" === u}">多選</button><button class="btn sm" data-act="btool" data-v="keep" aria-pressed="${"keep" === u}">保留規則 ${"keep" === u ? "▲" : "▼"}</button></div>${h}` +
      `<div class="split">\n      <div>\n        <h3 style="margin-top:0">身上裝備</h3><div class="doll">${n}</div>\n        <h3>背包${l.length < S.bag.length ? `<small class="note"> 顯示 <span class="px">${l.length}</span> 件</small>` : ""}</h3>${l.length ? `<div class="bagScroll"><div class="grid">${i}</div><div class="more">▼ 往下捲動・共 <span class="px">${l.length}</span> 件</div></div>` : `<p class="empty-note">${S.bag.length ? "沒有符合篩選的裝備。" : "背包是空的。<br>怪物掉落的裝備會自動拾取。"}</p>`}\n      </div>\n      <aside class="detail" aria-live="polite">${r ? this.multiHtml() : this.detailHtml()}</aside>\n    </div>\n`
    );
  },
  itemHead: (t) =>
    `<div class="head${t.my ? " myh" : ""}"><img src="${itemIcon(t)}" alt="" style="--rc:${rarColor(t)}"><div style="min-width:0"><p class="iname ${rc(t)}">${esc(itemName(t))}</p>\n      <div class="isub"><span class="nw">${SLOT_NAME[t.slot]}・<span class="px">LV${t.ilvl}</span>・</span><span class="nw"${canWear(t) ? "" : ' style="color:var(--bad)"'}>需求 <span class="px">LV${reqLv(t)}</span></span><br>${rarLabel(t)}${t.fused ? "・已鑲嵌" : ""}${t.cor ? '・<span style="color:var(--bad)">已腐化</span>' : ""}${t.mir ? '・<span class="mirt">奇蹟</span>' : ""}</div></div></div>`,
  statHtml(t) {
    let a = "";
    if (t.wd) {
      const s = weaponLocal(t),
        e = (t, a) => (t ? `<b class="c1">${a}</b>` : `<b>${a}</b>`);
      a += `<div class="base def"><span class="kv">傷害 ${e(s.mod.wadd || s.mod.wdmg, s.mn + "-" + s.mx)}</span><span class="kv">攻速 ${e(s.mod.waspd, s.aps)}</span><span class="kv">暴擊 ${e(s.mod.wcrit, s.crit + "%")}</span></div>`;
    }
    (t.dt &&
      (a += `<div class="base def">${t.arm ? `<span class="kv">護甲 <b>${t.arm}</b></span>` : ""}${t.eva ? `<span class="kv">閃避 <b>${t.eva}</b></span>` : ""}</div>`),
      (a += baseRow(t)),
      t.uq &&
        (a += `<div class="uniq${t.my ? " rm" : ""}">${esc(uqText(t.uq, t.cm || 1))}${cmTag(t)}${UNIQUE[t.uq].help ? " " + helpBtn(UNIQUE[t.uq].help) : ""}</div>${UNIQUE[t.uq].by ? `<p class="note" style="margin:0">設計：${esc(UNIQUE[t.uq].by)}</p>` : ""}`));
    for (const s of uqKeys(t))
      s !== t.uq &&
        (a += `<div class="uniq"><b>${esc(UNIQUE[s].n)}</b>：${esc(uqText(s, t.cm || 1))}${cmTag(t)}</div>`);
    return (
      t.af.length
        ? (a += `<div>${t.af.map((t) => affixLine(t)).join("")}</div>`)
        : t.sock || (a += '<p class="note" style="margin:0">沒有詞綴</p>'),
      (a += dgHtml(t)),
      a
    );
  },
  deltaHtml(t, a) {
    const s = previewEquip(t, !0),
      e = (t, a) => {
        const s = t - a;
        return `<span class="${s > 0 ? "up" : s < 0 ? "dn" : "eq"}">${s > 0 ? "+" : ""}${fmt(s)}</span>`;
      };
    return `<dl class="cmp"><dt style="grid-column:1/-1">${a ? `換下「${esc(itemName(a))}」後` : "裝備後"}</dt>\n      <dt>DPS</dt><dd>${fmt(s.dps)} ${e(s.dps, PS.dps)}</dd><dt>生命</dt><dd>${s.maxhp} ${e(s.maxhp, PS.maxhp)}</dd><dt>護甲</dt><dd>${s.armor} ${e(s.armor, PS.armor)}</dd><dt>閃避</dt><dd>${s.eva} ${e(s.eva, PS.eva)}</dd></dl>`;
  },
  ascPick(t = "") {
    if (S.tal.asc || !S.tal.tr) return;
    const a = (a) =>
      `<div class="board"><div class="row"><b>${a.n}</b><span class="spacer"></span><button class="btn sm ${t === a.k ? "primary" : ""}" data-act="ascSel" data-k="${a.k}">選擇</button></div>\n      <div>${esc(a.d)}</div><div style="color:var(--muted)">${a.t
        .flat()
        .map((t) => t.n)
        .join("、")}</div></div>`;
    if ((($("#sheet").className = "wide"), ($("#sheetBg").hidden = !1), t)) {
      const s = ascBranch(S.cls, t);
      return (
        ($("#sheet").className = "cfw"),
        void ($("#sheet").innerHTML = cfCard(
          "確定轉職？",
          a(s).replace(/<button[^>]*>選擇<\/button>/, ""),
          [
            `轉職為「${s.n}」`,
            '之後重置需消耗 <span class="px">300</span> Zeny',
          ],
          "確定",
          "ascYes",
          "ascSel",
          `data-k="${t}"`,
          "primary",
        ))
      );
    }
    (($("#sheet").innerHTML =
      `<h2>選擇轉職分支</h2>${ASC[S.cls].map(a).join("")}<div class="row"><span class="spacer"></span><button class="btn" data-act="close">稍後再選</button></div>`),
      ($("#sheetBg").hidden = !1));
  },
  cmpOpen(t) {
    const a = findItem(t),
      s = a && S.equip[a.it.slot];
    if (!a || "bag" !== a.where || !s) return;
    const e = (t, a) =>
      `<div class="cmpcol"><div class="lbl">${t}</div>${this.itemHead(a)}${this.statHtml(a)}</div>`;
    (($("#sheet").innerHTML =
      `<h2>比較裝備</h2><div class="cmpgrid">${e("目前裝備", s)}<div class="cmparr" aria-hidden="true">→</div>${e("選取中", a.it)}</div>\n      ${this.deltaHtml(a.it, s)}<div class="row" style="margin-top:12px"><button class="btn primary" data-act="cmpEq" data-u="${a.it.u}">更換</button><button class="btn" data-act="close">關閉</button></div>`),
      $("#sheet").classList.add("wide"),
      ($("#sheetBg").hidden = !1));
  },
  alchList: (t, a) =>
    S.alchOn
      ? [
          a && canAlch(t) && ["x", "萃取"],
          canInfuse(t) && ["i", "灌注"],
          endOn() && canReroll(t) && ["r", "磨礪"],
          holyOn() && canHoly(t) && ["h", "洗鍊"],
          corOn() && canCorrupt(t) && ["c", "腐化"],
        ].filter(Boolean)
      : [],
  alchBtns(t, a) {
    const s = this.alchList(t, a);
    return s.length
      ? `<div class="ar${s.length > 3 ? " g2" : ""}">${s.map(([a, s]) => `<button class="btn sm" data-act="toAlch" data-v="${a}" data-u="${t.u}">${s}</button>`).join("")}</div>`
      : "";
  },
  detailHtml() {
    const t = findItem(this.sel);
    if (!t) return '<p class="empty-note">點選左側裝備<br>查看詳細資訊</p>';
    const a = t.it;
    let s = this.statHtml(a),
      e = "";
    if (
      (a.sock &&
        !a.sl &&
        (s =
          `<p class="note" style="margin:0 0 4px;white-space:nowrap">${"d" === a.sock.mode ? "異種：同種詞綴限放一顆" : "任意：同種詞綴可放多顆"}</p>` +
          s),
      a.sock &&
        "bag" === t.where &&
        (s =
          `<div class="base" style="align-items:center"><span style="white-space:nowrap">插槽 <b>${a.sock.n}</b> 孔</span><button class="btn sm primary" data-act="sock" data-u="${a.u}" style="flex:none;white-space:nowrap">鑲嵌</button></div>` +
          s),
      "bag" === t.where)
    ) {
      const t = S.equip[a.slot];
      s += this.deltaHtml(a, t);
      const n = `<button class="btn sm" data-act="lock" data-u="${a.u}" aria-pressed="${!!a.lk}">${a.lk ? "解鎖" : "鎖定"}</button>`;
      e =
        `<div class="acts"><div class="ar">${canWear(a) ? `<button class="btn sm primary" data-act="equip" data-u="${a.u}">裝備</button>` : `<button class="btn sm primary" disabled>需要 <span class="px">LV${reqLv(a)}</span></button>`}${t ? `<button class="btn sm" data-act="cmp" data-u="${a.u}">比較</button>` : ""}</div>` +
        this.alchBtns(a, 1) +
        `<div class="ar">${n}${a.lk ? "" : `<button class="btn sm" data-act="salv">分解 <span class="px">+${salvageValue(a)}</span></button>`}</div>` +
        `<div class="ar"><button class="btn sm" data-act="stIn" data-k="bag" data-u="${a.u}" ${stCnt() >= 500 ? "disabled" : ""}>存入倉庫</button></div></div>`;
    } else
      "equip" === t.where &&
        (e = `<div class="acts"><div class="ar"><button class="btn sm" data-act="unequip" data-u="${a.u}" ${S.bag.length >= BAG_MAX ? "disabled" : ""}>卸下</button><button class="btn sm" data-act="lock" data-u="${a.u}" aria-pressed="${!!a.lk}">${a.lk ? "解鎖" : "鎖定"}</button></div>${this.alchBtns(a, 0)}</div>`);
    return this.itemHead(a) + e + s;
  },
  multiHtml() {
    const t = mselList(),
      a = t.filter((t) => t.lk).length,
      s = t.filter((t) => !t.lk),
      e = s.reduce((t, a) => t + salvageValue(a), 0),
      n = t.filter((t) => canAlch(t) && !xtrSkip(t)).length;
    return `<h3 style="margin-top:0">多選</h3><p class="note" style="margin:0">已選 <span class="px">${t.length}</span> 件</p>\n      <div class="acts"><div class="ar"><button class="btn sm" data-act="mall">全選</button><button class="btn sm" data-act="mnone" ${t.length ? "" : "disabled"}>清除</button></div>\n      <div class="ar"><button class="btn sm" data-act="msalv" ${s.length ? "" : "disabled"}>分解 <span class="px">${s.length}</span> 件</button></div>\n      ${S.alchOn ? `<div class="ar"><button class="btn sm" data-act="mxtr" ${n ? "" : "disabled"}>萃取 <span class="px">${n}</span> 件</button></div>` : ""}\n      <div class="ar"><button class="btn sm" data-act="mlock" ${t.some((t) => !t.lk) ? "" : "disabled"}>鎖定</button><button class="btn sm" data-act="munlock" ${a ? "" : "disabled"}>解鎖</button></div>\n      <div class="ar"><button class="btn sm" data-act="mstash" ${t.length && stCnt() + t.length <= 500 ? "" : "disabled"}>存入倉庫 <span class="px">${t.length}</span> 件</button></div></div>\n      ${s.length ? `<p class="note" style="margin:0">分解獲得Zeny <span class="px">+${fmt(e)}</span></p>` : ""}${a ? `<p class="note" style="margin:0">已鎖定 <span class="px">${a}</span> 件，不會分解</p>` : ""}\n      <p class="note" style="margin:0">點背包裝備以選取</p>${((t) => (t ? `<div class="axsec">最後點選</div>${this.itemHead(t.it)}${this.statHtml(t.it)}` : ""))(findItem(this.sel))}`;
  },
  bxOpen() {
    ((this.bxOn = !0),
      ($("#sheet").className = "sck wide bx"),
      ($("#sheetBg").hidden = !1));
    const t = xStone(),
      a = xtrPlan(t),
      s = this.alchOpt,
      e = a.items.length,
      n = a.all.filter((t) => !a.items.includes(t));
    (!s.p || S.mat[s.p] > 0 || (s.p = 0), S.mat.m1 > 0 || (s.bm = 0));
    const l = t
        ? n.length
          ? e >= S.mat[t]
            ? `神秘金屬僅足夠 ${e} ${this.bxSl ? "塊" : "件"}`
            : s.bm && a.mir >= S.mat.m1
              ? `奇蹟石僅足夠 ${e} ${this.bxSl ? "塊" : "件"}`
              : S.runes.length + e >= 5e3
                ? `符文石欄位僅剩 ${5e3 - S.runes.length} 格`
                : `Zeny僅足夠 ${e} ${this.bxSl ? "塊" : "件"}`
          : ""
        : "沒有神秘金屬",
      o = !!this.bxSl,
      r = o ? "塊" : "件",
      i = o ? "石板" : "裝備",
      c = o ? "y" : "x",
      d = !!this.bxM,
      f = d
        ? ""
        : S.slates.some(canAlch) || o
          ? `<div class="seg" style="margin-bottom:8px">${[
              ["", "裝備"],
              ["1", "石板"],
            ]
              .map(
                ([t, a]) =>
                  `<button data-act="bxT" data-v="${t}" aria-pressed="${o === !!t}">${a}</button>`,
              )
              .join("")}</div>`
          : "",
      p = (t, a) =>
        cellHtml(t, "bxI", !1).replace(
          'style="',
          a ? 'style="opacity:.35;' : 'style="',
        ),
      u = `<div class="seg">${["x1", "x2", "x3", "x4"].map((a) => `<button data-act="bxX" data-k="${a}" aria-pressed="${t === a}" ${S.mat[a] ? "" : "disabled"}>Lv${MATS[a].l} <span class="px">X${S.mat[a] || 0}</span></button>`).join("")}</div>`,
      h =
        ["p1", "p2"]
          .map(
            (t) =>
              `<label class="chk"><input type="checkbox" data-act="bxP" data-k="${t}" ${s.p === t ? "checked" : ""} ${S.mat[t] ? "" : "disabled"}>${MATS[t].n}，${PROT_KEEP[t]}% 保留${this.bxSl ? "石板" : "裝備"} <span class="px">X${S.mat[t] || 0}</span></label>`,
          )
          .join("") +
        (mirOn() && S.mat.m1 > 0
          ? `<label class="chk"><input type="checkbox" data-act="bxM1" ${s.bm ? "checked" : ""}><span>每${this.bxSl ? "塊" : "件"}使用奇蹟石強化・<span class="px">X${S.mat.m1}</span></span></label>`
          : "");
    if (this.confirm && this.confirm.startsWith("kdel"))
      return (
        ($("#sheet").innerHTML = cfCard(
          "刪除萃取規則？",
          "",
          [
            `刪除規則 <span class="px">${+this.confirm.slice(4) + 1}</span>`,
            "規則內的條件將一併刪除",
          ],
          "刪除",
          "kdelYes",
          "cancel",
          `data-g="${this.confirm.slice(4)}" data-kr="${c}"`,
        )),
        void ($("#sheet").scrollTop = 0)
      );
    if ("bxm1" === this.confirm)
      return (
        ($("#sheet").innerHTML = cfCard(
          "每件使用奇蹟石？",
          "",
          [
            cfW("奇蹟石是稀有素材"),
            `僅由${MONARCH.n}掉落`,
            `每${r}${i}消耗 1 顆奇蹟石`,
            `持有 <span class="px">${S.mat.m1 || 0}</span> 顆`,
          ],
          "確定使用",
          "bxM1Yes",
          "cancel",
        )),
        void ($("#sheet").scrollTop = 0)
      );
    if ("bxtr" === this.confirm && e)
      return (
        ($("#sheet").innerHTML = cfCard(
          "確定批次萃取？",
          `<div class="grid">${a.items
            .slice(0, 14)
            .map((t) => p(t))
            .join("")}</div>`,
          [
            `萃取 <span class="px">${e}</span> ${r}${i}`,
            a.items.some((t) => 4 === t.rar) && cfW("包含神話裝備"),
            s.p ? `每${r} ${PROT_KEEP[s.p]}% 機率保留` : cfW(`${i}全部摧毀`),
            `消耗 ${MATS[t].n} <span class="px">X${e}</span>${s.p ? `・${MATS[s.p].n}` : ""}`,
            a.mir &&
              `<span class="mirt">奇蹟</span>：消耗 奇蹟石 <span class="px">X${a.mir}</span>`,
            ...(a.mir
              ? [
                  "必定取出獨特效果（獨特裝備）",
                  "使用 Lv4 神秘金屬時，詞綴必定升一階",
                ].map((t) => `<span class="mirt">奇蹟</span>：${t}`)
              : []),
            cfAsh(a.cost),
          ],
          "萃取",
          "bxYes",
          "bxNo",
        )),
        void ($("#sheet").scrollTop = 0)
      );
    const m = `<div class="row"><span class="spacer"></span><button class="btn" data-act="close">關閉</button><button class="btn primary" data-act="bxGo" ${e ? "" : "disabled"}>萃取 <span class="px">${e}</span> ${r}</button></div>`,
      A = $("#sheet").scrollTop;
    (($("#sheet").innerHTML =
      `<h2>${d ? "萃取選取的裝備" : "批次萃取"}</h2>${f}${d ? "" : xrBox()}\n      <h3>將萃取的${i} <span class="px">${e}</span> ${r}</h3>\n      ${e ? `<div class="grid">${a.items.map((t) => p(t)).join("")}</div>` : `<p class="note" style="margin:0">${d ? "選取的裝備中沒有可萃取的。" : bxR().length ? `沒有符合規則的${i}。` : "請先新增一條規則。"}</p>`}\n      ${n.length ? `<p class="note" style="margin:4px 0 0">${l}，以下 <span class="px">${n.length}</span> ${r}本次不會萃取：</p><div class="grid">${n.map((t) => p(t, 1)).join("")}</div>` : ""}\n      ${a.skip ? `<p class="note" style="margin:4px 0 0">另有 <span class="px">${a.skip}</span> ${r}${d ? "已鎖定、奇蹟或主宰" : "已鎖定"}，不會萃取。</p>` : ""}\n      <p class="note" style="margin:6px 0 0">使用的神秘金屬</p>${u}${t ? "" : '<p class="note" style="margin:0">沒有神秘金屬，可於煉金分頁合成。</p>'}${h}\n      ${m}`),
      ($("#sheet").scrollTop = A));
  },
  bxAct(t) {
    const a = t.dataset.act;
    if ("kuq" === a) return (keepAct(a, t), !0);
    if ("xy".includes(t.dataset.kr || "-"))
      (keepAct(a, t),
        (this.confirm =
          this.confirm && this.confirm.startsWith("kdel")
            ? this.confirm
            : null));
    else if ("cancel" === a || "bxNo" === a) this.confirm = null;
    else if ("bxT" === a) ((this.bxSl = !!t.dataset.v), (this.confirm = null));
    else if ("bxX" === a)
      ((this.alchOpt.x = t.dataset.k), (this.confirm = null));
    else if ("bxP" === a)
      ((this.alchOpt.p = t.checked ? t.dataset.k : 0), (this.confirm = null));
    else if ("bxM1" === a)
      t.checked
        ? (this.confirm = "bxm1")
        : ((this.alchOpt.bm = 0), (this.confirm = null));
    else if ("bxM1Yes" === a) ((this.alchOpt.bm = 1), (this.confirm = null));
    else {
      if ("bxI" === a) return (itfCell === t ? itfHide() : itfShow(t), !0);
      if ("bxGo" !== a)
        return (
          "bxYes" === a &&
          ((this.confirm = null),
          (this.bxOn = !1),
          (this.alchRes = null),
          doBulkXtr(),
          (this.bxM = 0),
          this.alchRes
            ? alchPop(this.alchRes)
            : (($("#sheetBg").hidden = !0), ($("#sheet").className = "")),
          this.render(),
          !0)
        );
      this.confirm = "bxtr";
    }
    return (this.bxOpen(), !0);
  },
  sockOpen(t, a) {
    const s = sockFind(t);
    if (!s || (!s.sock && !a))
      return (
        (this.sockU = null),
        ($("#sheetBg").hidden = !0),
        ($("#sheet").className = ""),
        void ui.render()
      );
    if (
      ((this.sockU = t),
      ($("#sheet").className = "sck"),
      ($("#sheetBg").hidden = !1),
      a)
    )
      return void ($("#sheet").innerHTML =
        `<h2>鑲嵌完成</h2>${s.sl ? `<div class="li">${slateRow(s)}</div>` : this.itemHead(s) + this.statHtml(s)}<div class="row"><span class="spacer"></span><button class="btn primary" data-act="close">知道了</button></div>`);
    const e = s.sock,
      n = e.st.map((t) => S.runes.find((a) => a.u === t)).filter(Boolean),
      l = sockCap(s),
      o = n.length >= l,
      r = S.mat.i3 || 0,
      i = S.runes
        .filter(
          (t) =>
            !(
              isStaged(t.u) ||
              (s.sl
                ? t.uq ||
                  "slate" !== AFFIX[t.a].s[0] ||
                  n.some((a) => a.a === t.a)
                : t.uq
                  ? UNIQUE[t.uq].slot !== s.slot || n.some((t) => t.uq)
                  : isSlateAf(t.a) ||
                    (AFFIX[t.a].loc && "weapon" !== s.slot) ||
                    ("a" !== e.mode && n.some((a) => a.a === t.a)))
            ),
        )
        .sort(runeByTier);
    let c = `<h2>鑲嵌</h2>${s.sl ? `<div class="li">${slateRow(s)}</div>` : this.itemHead(s)}<div class="sholes">`;
    for (let t = 0; t < e.n; t++) {
      const a = n[t];
      c += a
        ? `<button class="shole on" data-act="skOut" data-u="${a.u}" aria-label="取出">${runeTag(a)}<span class="grow">${esc(runeDesc(a))}</span><span class="x">✕</span></button>`
        : `<div class="shole">${t < l ? "空孔" : "需要更多危險詞綴"}</div>`;
    }
    ((c += `</div>${s.sl ? `<p class="note" style="margin:0">獎勵符文最多 <span class="px">${l}</span> 顆（危險詞綴數）</p>` : ""}<p class="note" style="margin:0">${"d" === e.mode ? "每種詞綴限一顆" : "可重複種類"}・${n.length ? `鑲嵌後成為 <span class="${"c" + Math.min(3, n.length)}">${RAR_NAME[Math.min(3, n.length)]}</span>` : "點下方符文石放入"}</p>`),
      (c += `<h3>${o ? "插槽已滿" : "選擇符文石"}</h3><div class="list srunes">${i.length ? runeGrp(i, (this.skOpen ||= new Set()), "skG", (t, a) => `<button class="li ing" data-act="skIn" data-u="${t.u}" ${o ? "disabled" : ""}>${runeTag(t)}<span class="grow">${esc(runeDesc(t))}</span>${stackN(a)}</button>`, 1) : '<p class="note" style="margin:0">沒有可放入的符文石。</p>'}</div>`),
      "fuse" !== this.confirm
        ? ((c += `<div class="row"><button class="btn" data-act="close">關閉</button><span class="spacer"></span><button class="btn primary" data-act="skFuse" ${n.length && r > 0 && S.ash >= ALCH_ASH.f(s.ilvl) ? "" : "disabled"}>鑲嵌（鋁 Lv3 <span class="px">X${r}</span>${ashTag(ALCH_ASH.f(s.ilvl))}）</button></div>`),
          ($("#sheet").innerHTML = c))
        : ($("#sheet").innerHTML = cfCard(
            "確定鑲嵌？",
            s.sl ? `<div class="li">${slateRow(s)}</div>` : this.itemHead(s),
            [
              `放入 <span class="px">${n.length}</span> 顆符文石`,
              cfW("鑲嵌後無法取下"),
              e.n > n.length &&
                cfW(
                  `未插入的 <span class="px">${e.n - n.length}</span> 個空孔會消失`,
                ),
              "消耗 鋁 Lv3",
              cfAsh(ALCH_ASH.f(s.ilvl)),
            ],
            "鑲嵌",
            "skYes",
            "skNo",
          )));
  },
  sockClose() {
    const t = null != this.sockU && sockFind(this.sockU);
    (t && t.sock && t.sock.st.length && ((t.sock.st = []), markDirty()),
      "fuse" === this.confirm && (this.confirm = null),
      (this.sockU = null));
  },
  sockAct(t, a, s, e) {
    "skG" === t && rgTap((this.skOpen ||= new Set()), s, e);
    const n = sockFind(this.sockU);
    if (!n || !n.sock) return this.sockOpen(this.sockU);
    const l = (t) => {
      const a = S.runes.find((a) => a.u === t);
      return !!a && !a.uq && null != AFFIX[a.a].dv;
    };
    if ("skIn" === t && l(a) && n.sock.st.some(l))
      return void toast("一件裝備最多一條神眷詞綴", "bad");
    if (
      ("skIn" === t &&
        n.sock.st.length < sockCap(n) &&
        (n.sock.st.push(a), sfx("pick"), markDirty()),
      "skOut" === t &&
        ((n.sock.st = n.sock.st.filter((t) => t !== a)), markDirty()),
      (this.confirm = "skFuse" === t ? "fuse" : null),
      "skYes" === t)
    )
      return (fuse(n), this.sockOpen(n.u, 1));
    const o = $("#sheet .srunes"),
      r = o ? o.scrollTop : 0;
    this.sockOpen(n.u);
    const i = $("#sheet .srunes");
    i && (i.scrollTop = r);
  },
  p_skill() {
    const t = openSet(),
      a = {},
      s = null != this.selGem ? S.gems.find((t) => t.u === this.selGem) : null,
      e = drag && drag.held ? drag.g : null;
    for (const t of placed())
      for (const [s, e] of gemCells(t)) a[s + "," + e] = t;
    const n = new Set();
    for (const t of activeGems())
      for (const a of linkedSupports(t))
        for (const [t, s] of gemCells(a)) n.add(t + "," + s);
    const l = s && this.ghost,
      o =
        (s && s.x >= 0 && !l
          ? new Set(gemCells(s).map((t) => t + ""))
          : new Set(),
        l
          ? new Set(gemCells(s, l.x, l.y, l.rot).map((t) => t + ""))
          : new Set());
    let r = "";
    for (let s = 0; s < 6; s++)
      for (let e = 0; e < 6; e++) {
        const l = e + "," + s,
          i = a[l],
          c = t.has(l);
        r += `<button class="${c ? "open" : "lock"} ${i && n.has(l) ? "link" : ""} ${o.has(l) ? "ghost" : ""}" data-act="cell" data-x="${e}" data-y="${s}" aria-label="格子 ${e + 1},${s + 1}${i ? "：" + SKILLS[i.id].n : c ? "" : "（未解鎖）"}"></button>`;
      }
    for (const t of placed()) r += gemOverlay(t, s === t && !l);
    const i = S.gems.filter((t) => t.x < 0 && !(l && l.u === t.u) && t !== e),
      c = this.trayTab || "act",
      d = new Map();
    for (const t of i)
      if (!SKILLS[t.id].act == ("sup" === c)) {
        const a = t.id + ":" + (t.sh ? polyKey(t.sh) : "") + (t.mu ? "~" + t.u : ""),
          s = d.get(a) || (d.set(a, [t, 0, []]), d.get(a));
        (s[1]++, t.u === this.selGem && (s[0] = t), t.nw && s[2].push(t));
      }
    const f = [...d.values()],
      p = (t, a) => {
        const s = gemArt(t.id, a, 5, t.sh, t.sx);
        return `<span class="shape" style="width:${2 * s.W}px;height:${2 * s.H}px">${s.svg}</span>`;
      },
      u = CLASS[S.cls].gems,
      h = (t) => {
        const a = u.indexOf(t);
        return a < 0 ? 999 : a;
      },
      m = (t) => gemShape(t).length,
      A = new Map();
    for (const t of f) {
      const a = t[0].id;
      A.has(a) ? A.get(a).push(t) : A.set(a, [t]);
    }
    const g = [...A.values()].sort(
      (t, a) =>
        h(t[0][0].id) - h(a[0][0].id) ||
        SKILLS[t[0][0].id].n.localeCompare(SKILLS[a[0][0].id].n),
    );
    for (const t of g)
      t.sort((t, a) => !!t[0].sh - !!a[0].sh || m(t[0]) - m(a[0]));
    const v = (t) =>
        this.selGem === t.u ? (this.ghost ? this.ghost.rot : this.rot) : 0,
      b = '<i class="dot"></i>',
      k = (t) =>
        (d.get(t.id + ":" + (t.sh ? polyKey(t.sh) : "") + (t.mu ? "~" + t.u : "")) || [0, 0, []])[2],
      x = (t) => {
        for (const a of k(t)) this.gemSeen.add(a);
        return k(t).length ? b : "";
      },
      y = (t, a, s) =>
        `<button class="gem${s ? " gv" : ""}" data-act="gem" data-u="${t.u}" aria-pressed="${this.selGem === t.u}">${x(t)}${p(t, v(t))}<span>${s ? "" : gemNm(t)}${a > 1 ? ` <span class="px gcnt">×${a}</span>` : ""}${s ? "" : `<small>${SKILLS[t.id].act ? "主動" : "輔助"}・${tagText(SKILLS[t.id])}・${esc(SKILLS[t.id].d)}</small>`}</span></button>`,
      w = (t) => {
        const a = t[0][0].id,
          s = this.trayOpen === a || t.some(([t]) => t.u === this.selGem),
          e = t.reduce((t, a) => t + a[1], 0);
        return (
          `<button class="gem grp" data-act="gemGrp" data-id="${a}" aria-expanded="${s}">${!s && t.some(([t]) => k(t).length) ? b : ""}${p(t[0][0], 0)}<span>${SKILLS[a].n} <span class="px gcnt">×${e}</span><span class="gvn">${t.length} 種形狀 ${s ? "▴" : "▾"}</span></span></button>` +
          (s
            ? `<div class="gvar">${t.map(([t, a]) => y(t, a, 1)).join("")}${t.some(([t]) => t.sh) ? `<button class="btn sm gfB" data-act="gfuse" data-id="${a}" ${gfMats(a).length >= MUT.fn ? "" : "disabled"}>合成 <span class="px">${gfMats(a).length}/${MUT.fn}</span></button>` : ""}</div>`
            : "")
        );
      },
      $ = (t) =>
        `<span class="tip" tabindex="0" data-tip="${esc(SKILLS[t].d)}">${SKILLS[t].n}</span>`,
      M = (t) =>
        `${SKILLS[t.id].act ? "主動" : "輔助"}・${tagText(SKILLS[t.id])}・${esc(SKILLS[t.id].d)}`,
      B = activeGems()
        .map((t) => {
          const a = SKILLS[t.id],
            s = gemMods(t),
            e = a.sus ? 0 : a.cd * (1 - s.cd) * (1 - PS.cdr / 100) * kingCd(),
            n = a.sus
              ? 0
              : Math.max(
                  0,
                  a.cd *
                    (1 -
                      linkedSupports(t).reduce(
                        (t, a) => t + (SKILLS[a.id].mod.cd || 0),
                        0,
                      )) *
                    (1 - PS.st.cdr / 100) *
                    kingCd(),
                ),
            l = gemCrit(t, s),
            o = s.critm + critOvr(PS, l.c, l.own),
            r = linkedSupports(t).map((t) => $(t.id)),
            i = adjSupports(t)
              .filter((a) => !supFits(a.id, t.id))
              .map((t) => $(t.id));
          return `<div class="li"><span style="width:12px;height:12px;background:${a.col};flex:none;box-shadow:var(--shadow)"></span><div class="grow"><div class="t">${gemNm(t)} <small style="color:var(--muted)">${tagText(a)}</small></div>\n        <div class="s">${esc(a.d)}</div><div class="s">${a.sus ? (a.aura ? "光環" : "持續") + "・常駐開啟" : `冷卻 <span class="px">${e.toFixed(1)}</span> 秒${e - n > 0.05 ? `（${n.toFixed(1)}）` : ""}`}${s.dmg ? `・傷害 +${Math.round(100 * s.dmg)}%` : ""}${a.tg && a.tg.includes("minion") ? `・召喚 <span class="px">${minCap(t)}</span> 隻（基礎 ${minBase(t)}${s.minion ? `＋輔助 ${s.minion}` : ""}${PS.minion ? `＋天賦／裝備 ${PS.minion}` : ""}）` : ""}${s.extra ? `・額外施放 ${s.extra}` : ""}${s.crit ? `・暴擊 +${s.crit}%` : ""}${o ? `・暴傷 +${fmt(o)}%` : ""}${s.area ? `・範圍 ×${(1 + s.area).toFixed(2)}` : ""}<br>${r.length ? `連結：${r.join("、")}` : "沒有連結輔助寶石"}${i.length ? `<br><span style="color:#e0445a">${a.aura ? "光環不受輔助影響" : a.sus ? "標籤不符或不適用持續技能" : "標籤不符"}、未生效：${i.join("、")}</span>` : ""}</div>\n        ${
            "summon" === (SKILLS[t.id]?.roBase || t.id)
              ? `<div class="seg" style="margin:6px 0">${[
                  [0, "侵略模式"],
                  [1, "守護模式"],
                ]
                  .map(
                    ([t, a]) =>
                      `<button data-act="minG" data-v="${t}" aria-pressed="${(S.set.minG || 0) === t}">${a}</button>`,
                  )
                  .join("")}</div>`
              : ""
          }${
            "trap" === (SKILLS[t.id]?.roBase || t.id)
              ? `<div class="seg" style="margin:6px 0">${[
                  [0, "爆炸特效開"],
                  [1, "爆炸特效關"],
                ]
                  .map(
                    ([t, a]) =>
                      `<button data-act="trapFx" data-v="${t}" aria-pressed="${(S.set.trapFx || 0) === t}">${a}</button>`,
                  )
                  .join("")}</div>`
              : ""
          }<button class="btn sm brkB" data-act="brk" data-u="${t.u}" aria-expanded="${!!this.brk[t.u]}">${this.brk[t.u] ? "收起加成明細" : "加成明細"}</button>${this.brk[t.u] ? `<div class="brk">${skillBreak(t)}</div>` : ""}</div></div>`;
        })
        .join(""),
      C = crsRingOn()
        ? placed()
            .filter((t) => SKILLS[t.id].crs)
            .map((t) => {
              const a = SKILLS[t.id],
                s = CRS[a.crs],
                e = adjSupports(t).map((t) => $(t.id));
              return `<div class="li"><span style="width:12px;height:12px;background:${a.col};flex:none;box-shadow:var(--shadow)"></span><div class="grow"><div class="t">${gemNm(t)} <small style="color:var(--muted)">光環・${UNIQUE.crsr.n}</small></div>\n        <div class="s">周圍敵人${CRS_TXT[a.crs]}<span class="px">${fmt(s.v * PS.crs * 100)}%</span></div><div class="s">${G.pl && G.mobs.some((t) => t.crs && t.crs[a.crs] > 0) ? "生效中" : "敵人靠近時生效"}・範圍 <span class="px">${Math.round(crsAuraR())}</span>${e.length ? `<br><span style="color:#e0445a">光環不受輔助影響、未生效：${e.join("、")}</span>` : ""}</div>\n        <button class="btn sm brkB" data-act="brk" data-u="${t.u}" aria-expanded="${!!this.brk[t.u]}">${this.brk[t.u] ? "收起加成明細" : "加成明細"}</button>${this.brk[t.u] ? `<div class="brk">${crsBreak()}</div>` : ""}</div></div>`;
            })
            .join("")
        : "",
      R = punchOn()
        ? (() => {
            const t = punchMods(),
              a = punchSups(),
              s = t.critm + critOvr(PS, PS.critRaw + t.crit);
            return `<div class="li"><span style="width:12px;height:12px;background:#ffb347;flex:none;box-shadow:var(--shadow)"></span><div class="grow"><div class="t">${UNIQUE.fist.n} <small style="color:var(--muted)">普攻・${TAG.aoe}</small></div>\n        <div class="s">射程 <span class="px">${PUNCH.rng}</span>・目標周圍小範圍・${uvFmt(uv("fist", 0))}% 武器傷害</div><div class="s">每秒 <span class="px">${PS.aps.toFixed(2)}</span> 拳${t.dmg ? `・傷害 +${Math.round(100 * t.dmg)}%` : ""}${t.extra ? `・額外揮拳 ${t.extra}` : ""}${t.crit ? `・暴擊 +${t.crit}%` : ""}${s ? `・暴傷 +${fmt(s)}%` : ""}${t.area ? `・範圍 ×${(1 + t.area).toFixed(2)}` : ""}${t.pstk ? `・毒層上限 +${t.pstk}` : ""}${t.life ? `・每拳消耗 ${+(100 * t.life).toFixed(1)}% 生命` : ""}<br>${a.ok.length ? `套用：${a.ok.map((t) => $(t.id)).join("、")}` : "格子中沒有可套用的輔助寶石"}${a.bad.length ? `<br><span style="color:#e0445a">標籤不符或不適用揮拳、未生效：${a.bad.map((t) => $(t.id)).join("、")}</span>` : ""}</div></div></div>`;
          })()
        : "";
    return `<h2>技能拼圖${helpBtn("skill")}</h2>\n      ${bldSeg()}\n      <p class="note">已解鎖 <span class="px">${t.size}/36</span> 格（每 3 級 +1 格）</p>\n      <div class="gridWrap"><div class="sgrid" id="sgrid">${r}</div></div>\n      <div class="row" style="justify-content:center;margin:12px 0">\n        <button class="btn" data-act="rot" ${s || e ? "" : "disabled"}>旋轉</button>\n        <button class="btn" data-act="unplace" ${(s && (s.x >= 0 || l)) || (e && (e.x >= 0 || drag.ghost0)) ? "" : "disabled"}>取下</button>\n        <button class="btn" data-act="desel" ${s || e ? "" : "disabled"}>${e ? "放回" : "取消選取"}</button>\n        <button class="btn" data-act="gclear" ${placed().length && !e ? "" : "disabled"}>清空</button>\n      </div>\n      ${e ? `<p class="note" style="text-align:center">手持：<b style="color:var(--text)">${gemNm(e)}</b>（${M(e)}）。${drag.touch ? "點格子放下，按「旋轉」轉向" : "移到格子上點一下放下，滾輪捲動，右鍵或 R 旋轉"}，「放回」取消。</p>` : s ? `<p class="note" style="text-align:center">已選取：<b style="color:var(--text)">${gemNm(s)}</b>（${M(s)}）。${l ? '<span style="color:#ff5a6a">紅色＝此位置無法放置</span>，點選或拖曳紅色方塊、按「旋轉」調整；可放置時自動放入，「取消選取」可回到原位。' : "可拖曳移動，或按「旋轉」／「取下」。"}</p>` : ""}\n      ${i.length ? `<button class="trayHd" data-act="trayGo">▼ 未放置的寶石 <span class="px">${i.length}</span> 顆</button>` : "<h3>未放置的寶石</h3>"}\n      <div class="seg" style="margin:6px 0 8px">${[
      ["act", "主動"],
      ["sup", "輔助"],
    ]
      .map(
        ([t, a]) =>
          `<button data-act="trayTab" data-v="${t}" aria-pressed="${c === t}">${a} <span class="px">${i.filter((a) => !SKILLS[a.id].act == ("sup" === t)).length}</span>${c !== t && i.some((a) => a.nw && !SKILLS[a.id].act == ("sup" === t)) ? b : ""}</button>`,
      )
      .join(
        "",
      )}</div>\n      ${f.length ? `<div class="tray" id="tray">${g.map((t) => (1 !== t.length || t[0][0].sh ? w(t) : y(t[0][0], t[0][1]))).join("")}</div>` : `<p class="note tray" id="tray">${i.length ? `沒有未放置的${"act" === c ? "主動" : "輔助"}寶石（拖到這裡可取下）。` : "所有寶石皆已放入格子（拖到這裡可取下）。新寶石可由任務或商人取得。"}</p>`}\n      ${gsMats("act" === c).length ? '<div class="row" style="justify-content:flex-end;margin-top:6px"><button class="btn sm" data-act="gsOpen">分解寶石</button></div>' : ""}\n      <h3>主動技能</h3>\n      <div class="list">${R + B + C || '<p class="note">格子中尚無主動寶石，角色僅會普通攻擊。</p>'}</div>`;
  },
  alchMd() {
    const t = this.alchMode;
    return ("r" === t && !endOn()) ||
      ("c" === t && !corOn()) ||
      ("m" === t && !mirOn()) ||
      ("h" === t && !holyOn()) ||
      !"xircmhks".includes(t)
      ? "x"
      : t;
  },
  alchAll(t) {
    const a = SLOTS.map((t) => S.equip[t]).filter(Boolean),
      s = [...slatesOn(), ...S.slates];
    return "m" === t
      ? [...a, ...S.bag, ...s].filter(canMir)
      : "c" === t
        ? [...a, ...S.bag].filter(canCorrupt)
        : "h" === t
          ? [...a, ...S.bag, ...s].filter(canHoly)
          : "r" === t
            ? [...a, ...S.bag, ...s].filter(canReroll)
            : "i" === t
              ? [...a, ...S.bag, ...slatesPlaced(), ...S.slates].filter(
                  canInfuse,
                )
              : "x" === t
                ? [...S.bag, ...S.slates].filter(canAlch)
                : [];
  },
  p_alch() {
    if (!S.alchOn)
      return `<p class="empty-note">尚未開放。<br>擊敗「${MAPS[2].n}」的 Boss 後開放。</p>`;
    const t = this.alchMd();
    let a = `<div class="row" style="margin:0 0 8px;flex-wrap:nowrap"><div class="seg aseg" style="flex:1">${[
      ["x", "萃取"],
      ["i", "灌注"],
      endOn() && ["r", "磨礪"],
      corOn() && ["c", "腐化"],
      mirOn() && ["m", "奇蹟"],
      holyOn() && ["h", "洗鍊"],
      ["k", "合成"],
      ["s", "鑲嵌"],
    ]
      .filter(Boolean)
      .map(
        ([a, s]) =>
          `<button data-act="amode" data-v="${a}" aria-pressed="${t === a}">${s}</button>`,
      )
      .join("")}</div>${helpBtn(AX_HELP[t])}</div>`;
    if ("k" === t)
      return (
        a +
        matBoard() +
        `<h3 class="hrow">合成${helpBtn("craft")}${aWallet()}</h3>${this.craftHtml()}<h3>升級合成${helpBtn("craft", 2)}</h3>${this.mergeHtml()}`
      );
    if ("s" === t) {
      const t = alchOpt(),
        s = t.ks || "",
        e = t.km || "",
        n = S.bag.filter((t) => t.sock),
        l = n
          .filter((t) => !((s && t.slot !== s) || (e && t.sock.mode !== e)))
          .sort((t, a) => a.sock.n - t.sock.n),
        o = n.length
          ? `<div class="row filt">${selHtml("ks", [["", "全部部位"], ...SLOTS.map((t) => [t, SLOT_NAME[t]])], s, "部位篩選", "av")}${selHtml(
              "km",
              [
                ["", "全部種類"],
                ["d", "不同種類"],
                ["a", "任意種類"],
              ],
              e,
              "種類篩選",
              "av",
            )}</div>`
          : "";
      return (
        a +
        matStrip(["i3"]) +
        o +
        (n.length && !l.length
          ? '<p class="empty-note">沒有符合篩選的插槽裝備。</p>'
          : l.length
            ? `<div class="list">${l.map((t) => `<button class="li" data-act="sock" data-u="${t.u}"><img src="${itemIcon(t)}" alt="" style="width:32px;height:32px;image-rendering:pixelated"><div class="grow"><div class="t cs">${esc(itemName(t))}</div><div class="s">${t.sock.n} 孔・${"d" === t.sock.mode ? "不同種類" : "任意種類"}・已放 <span class="px">${t.sock.st.length}</span></div></div></button>`).join("")}</div>`
            : '<p class="empty-note">目前沒有插槽裝備。<br>插槽裝備僅由 Lv75 以上的怪物掉落。</p>')
      );
    }
    a += matStrip(AX_MATS[t].filter((t) => "s1" !== t || endOn()));
    const s = this.alchAll(t);
    if (!s.length)
      return (
        a +
        `<p class="empty-note">${{ x: "背包中沒有可萃取的裝備。<br>僅稀有以上的裝備可萃取。", i: "沒有可灌注的裝備。<br>僅魔法以上的裝備可灌注。", r: "沒有帶詞綴的裝備。", c: "沒有可腐化的裝備。<br>已腐化的裝備無法再次腐化。", m: "沒有可賦予奇蹟的裝備。", h: "沒有可使用洗鍊石的裝備。" }[t]}</p>`
      );
    const e = alchView(s.slice()),
      n = alchOpt(),
      l = [...SLOTS, ...(s.some((t) => "slate" === t.slot) ? ["slate"] : [])];
    return (
      (a += `<div class="row filt">${selHtml("s", ALCH_SORT, n.s, "排序", "av")}${selHtml("slot", [["", "全部物品"], ["gear", "全部裝備"], ...l.map((t) => [t, SLOT_NAME[t]])], n.slot, "部位篩選", "av")}${selHtml("r", RAR_F.slice(0, 8), n.r, "稀有度篩選", "av")}</div>\n      <div class="row acnt"><span class="note" style="margin:0">${e.length < s.length ? `顯示 <span class="px">${e.length}/${s.length}</span> 件` : `<span class="px">${s.length}</span> 件`}・點裝備開始${{ x: "萃取", i: "灌注", r: "磨礪", c: "腐化", m: "賦予奇蹟", h: "重洗基底" }[t]}</span><span class="spacer"></span>${"x" === t && (S.bag.some(canAlch) || S.slates.some(canAlch)) ? `<button class="btn sm" data-act="bxOpen">批次萃取</button>${helpBtn("bxtr")}` : ""}</div>`),
      (a += e.length
        ? `<div class="list alist">${e.map((t) => arowHtml(t, t.u === this.alchSel)).join("")}</div>`
        : '<p class="empty-note">沒有符合篩選的裝備。</p>'),
      a +
        ("i" === t && e.some((t) => S.equip[t.slot] === t)
          ? '<p class="note" style="margin:6px 0 0">已穿戴的裝備排在最前</p>'
          : "")
    );
  },
  craftHtml: () =>
    `<div class="list">${Object.keys(CRAFT)
      .map((t) => {
        const a = CRAFT[t],
          s = a.c(S.lvl),
          e = matOdds(S.lvl, a.max),
          n = ui.craftRes;
        return `<div class="li crow"><img src="${matIcon(t)}" alt="" style="width:24px;height:24px;image-rendering:pixelated;flex:none"><div class="grow"><div class="t">${a.n}</div>\n        <div class="s">${e
          .map((t, a) => (t ? `Lv${a} <span class="px">${t}%</span>` : ""))
          .filter(Boolean)
          .join("・")}</div>\n        ${
          n && n.f === t
            ? `<div class="s crf${performance.now() - n.t < 350 ? " new" : ""}">獲得 ${
                n.got
                  ? Object.keys(n.got)
                      .sort()
                      .map(
                        (t) =>
                          `<span style="color:var(${lvCol(t)})">Lv${MATS[t].l}</span> <span class="px">X${n.got[t]}</span>`,
                      )
                      .join("・")
                  : `<span style="color:var(${lvCol(n.k)})">${MATS[n.k].n}</span>${n.n > 1 ? ` <span class="px">X${n.n}</span>` : ""}・持有 <span class="px">${S.mat[n.k] || 0}</span>`
              }</div>`
            : ""
        }\n        <div class="row" style="gap:4px;margin-top:4px;flex-wrap:wrap">${CRAFT_N.map((a) => `<button class="btn sm" style="white-space:nowrap" data-act="craft" data-k="${t}" data-n="${a}" ${S.ash >= s * a ? "" : "disabled"}>${a > 1 ? `X${a}` : "合成"} <span class="px">${fmt(s * a)}</span><img class="ashI" src="${shopIcon("ash")}" alt="Zeny" style="margin-left:2px"></button>`).join("")}</div></div></div>`;
      })
      .join("")}</div>`,
  cfFor(t) {
    if (!t) return "";
    const a = t.match(
      /^(ssalv|msalv|salv|map|gd|tw|kdel|reset|ascReset|talReset|sbulk|rbulk|bulk|autoSock|autoMyth|gclear)(\d*)$/,
    );
    if (!a) return "";
    const s = a[1],
      e = +a[2],
      n = (t) => `<span class="px">${t}</span>`;
    if ("map" === s) {
      const t = MAPS[e],
        a = $(`#panel [data-act="map"][data-i="${e}"] .mban img`)?.src;
      return cfCard(
        "切換地圖？",
        a
          ? `<span class="mban"><img src="${a}" alt=""><span class="mpl mname">${esc(t.n)}</span></span>`
          : "",
        [
          `目前：${esc(MAPS[S.map].n)}`,
          `前往：${esc(t.n)}`,
          (G.boss || G.arena) && cfW("目前的挑戰會中斷"),
          "本次掛機統計會重新計算",
        ],
        "前往",
        "mapYes",
        "cancel",
        `data-i="${e}"`,
      );
    }
    if ("gd" === s) {
      const t = gdef(e),
        a = 4 === e,
        s = e === GUARD.length;
      return cfCard(
        `挑戰${t.n}？`,
        "",
        [
          a
            ? `消耗 ${n(MONARCH.mk)} 個無限印記`
            : s
              ? "消耗三種碎片各 1 個"
              : `消耗 1 個${t.tk}`,
          cfW("失敗不退還"),
          `限時 ${n(a ? 270 : s ? 210 : 140)} 秒`,
        ],
        "挑戰",
        "gdYes",
        "cancel",
        `data-i="${e}"`,
      );
    }
    if ("tw" === s)
      return cfCard(
        "挑戰無盡之塔？",
        "",
        [`從第 ${n(e)} 層開始`, `目前最高 ${n(S.tw.best)} 層`],
        "開始",
        "twYes",
        "cancel",
        `data-i="${e}"`,
      );
    if ("gclear" === s)
      return cfCard(
        "清空技能拼圖？",
        "",
        [
          `取下格子中全部 ${n(placed().length)} 顆寶石`,
          "寶石放回「未放置的寶石」",
        ],
        "清空",
        "gclearYes",
      );
    if ("reset" === s)
      return cfCard(
        "刪除角色？",
        "",
        [
          `刪除「${esc(S.name || "未命名")}」`,
          cfW("所有進度都會消失"),
          cfW("刪除後無法復原"),
        ],
        "刪除",
        "resetYes",
      );
    if ("ascReset" === s)
      return cfCard(
        "重置職業？",
        "",
        ["退回全部天賦點", "重新選擇職業分支", cfAsh(300)],
        "重置職業",
        "ascResetYes",
        "cancel",
        S.ash < 300 ? "disabled" : "",
      );
    if ("talReset" === s)
      return cfCard(
        "重置天賦點？",
        "",
        ["退回全部天賦點", "職業分支不變", cfAsh(150)],
        "重置天賦點",
        "talResetYes",
        "cancel",
        S.ash < 150 ? "disabled" : "",
      );
    if ("msalv" === s) {
      const t = mselList().filter((t) => !t.lk);
      if (!t.length) return "";
      const a = (a) => t.filter(a).length,
        s = a((t) => t.my);
      return cfCard(
        "分解選取的裝備？",
        cfCells(t),
        [
          `分解 <span class="px">${t.length}</span> 件`,
          s && cfW(`包含主宰 ${s} 件`),
          a((t) => 4 === t.rar && !t.my) &&
            cfW(`包含神話裝備 ${a((t) => 4 === t.rar && !t.my)} 件`),
          a((t) => t.mir) && cfW(`包含奇蹟狀態 ${a((t) => t.mir)} 件`),
          a((t) => keepMatch(t)) &&
            cfW(`符合保留規則 ${a((t) => keepMatch(t))} 件`),
          cfGain(t.reduce((t, a) => t + salvageValue(a), 0)),
          !t.some(salvWarn) && nocfChk(),
        ],
        s ? "長按分解" : "分解",
        "msalvYes",
        "cancel",
        "",
        s ? "danger hold" : "danger",
      );
    }
    if ("salv" === s) {
      const t = findItem(this.sel),
        a = t && t.it;
      return a
        ? a.my
          ? cfCard(
              "分解主宰？",
              this.itemHead(a),
              [
                ...mythW("獨特", a),
                cfW("分解後無法復原"),
                cfGain(salvageValue(a)),
              ],
              "長按分解",
              "salvYes",
              "cancel",
              `data-u="${a.u}"`,
              "danger hold",
            )
          : cfCard(
              "分解裝備？",
              this.itemHead(a),
              [
                4 === a.rar
                  ? cfW("這是神話裝備")
                  : a.mir
                    ? cfW("此裝備帶有奇蹟狀態")
                    : keepMatch(a)
                      ? cfW("符合保留規則")
                      : "",
                cfGain(salvageValue(a)),
                !salvWarn(a) && nocfChk(),
              ],
              "分解",
              "salvYes",
              "cancel",
              `data-u="${a.u}"`,
            )
        : "";
    }
    if ("autoMyth" === s)
      return cfCard(
        "自動分解神話裝備？",
        "",
        [
          "拾取神話裝備時自動分解",
          cfW("神話裝備為稀有掉落物"),
          cfW("分解後無法復原"),
          "主宰不會分解",
          "符合保留規則的不會分解",
        ],
        "開啟",
        "autoMythYes",
      );
    if ("autoSock" === s)
      return cfCard(
        "自動分解插槽裝備？",
        "",
        [
          "拾取插槽裝備時自動分解",
          cfW("插槽裝備為稀有掉落物"),
          cfW("分解後無法復原"),
          "符合保留規則的不會分解",
        ],
        "開啟",
        "autoSockYes",
      );
    if ("bulk" === s) {
      const t = bulkList();
      return t.length
        ? cfCard(
            "批次分解？",
            cfCells(t),
            [
              `分解 ${n(t.length)} 件裝備`,
              t.some((t) => 4 === t.rar) && cfW("包含神話裝備"),
              t.some((t) => t.sock) && cfW("包含插槽裝備"),
              t.some((t) => t.uq)
                ? cfW("包含獨特裝備")
                : t.some((t) => t.rar >= 2) && cfW("包含稀有以上"),
              cfGain(t.reduce((t, a) => t + salvageValue(a), 0)),
            ],
            "分解",
            "bulkYes",
          )
        : "";
    }
    if ("sbulk" === s) {
      const t = slBulk();
      return t.length
        ? cfCard(
            "批次分解石板？",
            cfCells(t),
            [
              `分解 ${n(t.length)} 塊石板`,
              t.some((t) => t.rar >= 2 || t.sock) && cfW("包含稀有以上"),
              cfGain(t.reduce((t, a) => t + slateAsh(a), 0)),
            ],
            "分解",
            "sbulkYes",
          )
        : "";
    }
    if ("rbulk" === s) {
      const t = rBulk();
      return t.length
        ? cfCard(
            "批次分解符文石？",
            "",
            [
              `分解 ${n(t.length)} 顆符文石`,
              t.some((t) => t.t <= 1) && cfW("包含 T1 以上"),
              cfGain(t.reduce((t, a) => t + runeAsh(a), 0)),
            ],
            "分解",
            "rbulkYes",
          )
        : "";
    }
    if ("ssalv" === s) {
      const t = S.slates.find((t) => t.u === e);
      return t
        ? cfCard(
            t.my ? "分解神話石板？" : "分解石板？",
            `<div class="li">${slateRow(t)}</div>`,
            [
              ...(t.my ? [...mythW("石板"), cfW("分解後無法復原")] : []),
              cfGain(slateAsh(t)),
              !t.my && nocfChk(),
            ],
            t.my ? "長按分解" : "分解",
            "ssalvYes",
            "cancel",
            `data-u="${e}"`,
            t.my ? "danger hold" : "danger",
          )
        : "";
    }
    return "kdel" === s
      ? cfCard(
          "刪除規則？",
          "",
          [`刪除規則 ${n(e + 1)}`, "規則內的條件將一併刪除"],
          "刪除",
          "kdelYes",
          "cancel",
          `data-g="${e}" data-kr="${this.cfKr || ""}"`,
        )
      : "";
  },
  gfOpen(t, a = [], s = null) {
    this.gf = { id: t, pick: a, res: s };
    const e = gfMats(t),
      n = (t) => Math.max(1, Math.min(3, Math.floor(30 / Math.max(t.W, t.H)))),
      l = (t) => {
        const a = gemArt(t.id, 0, 5, t.sh, t.sx);
        return `<span class="shape" style="width:${a.W * n(a)}px;height:${a.H * n(a)}px">${a.svg}</span>`;
      },
      o = a.length === MUT.fn && S.ash >= MUT.fc;
    (($("#sheet").className = "gfp"),
      ($("#sheetBg").hidden = !1),
      ($("#sheet").innerHTML =
        `<h2 class="cfh">合成變異寶石</h2>\n      ${s ? `<div class="row gfres"><span>獲得</span><span class="cell gfc">${l(s)}</span><b>${esc(gemNm(s))}</b><span class="px">${gemShape(s).length} 格</span></div>` : ""}\n      <div class="row"><b>${esc(SKILLS[t].n)}</b><span class="spacer"></span><span>選擇 <span class="px">${a.length}/${MUT.fn}</span> 顆</span></div>\n      <div class="gfG">${
          gemStacks(e)
            .sort((t, a) => gemShape(a[0]).length - gemShape(t[0]).length)
            .map((t) => this.stkCell(t, a, "gfPick", l))
            .join("") ||
          '<p class="note" style="margin:0">沒有可用的變異寶石。</p>'
        }</div>\n      <div class="cfl"><div>形狀重新隨機</div><div>消耗 ${cfAsh(MUT.fc)}</div></div>\n      <div class="row"><button class="btn" data-act="close">關閉</button><span class="spacer"></span><button class="btn primary" data-act="gfYes" ${o ? "" : "disabled"}>合成</button></div>`));
  },
  stkCell(t, a, s, e) {
    const n = t[0],
      l = t.filter((t) => a.includes(t.u)).length;
    return `<button class="cell gfc${l ? " sel" : ""}" data-act="${s}" data-u="${n.u}" aria-pressed="${!!l}" aria-label="${esc(gemNm(n))}">${e(n)}${t.some((t) => t.nw) ? '<i class="dot"></i>' : ""}${l ? `<span class="gfp">${l}</span>` : ""}<span class="lv">×${t.length - l}</span></button>`;
  },
  stkPick(t, a, s, e = 1e9) {
    const n = t.find((t) => t.u === s);
    if (!n) return a;
    const l = t.filter((t) => gemStk(t) === gemStk(n)),
      o = l.find((t) => !a.includes(t.u));
    return o && a.length < e
      ? [...a, o.u]
      : a.filter((t) => !l.some((a) => a.u === t));
  },
  gsOpen(t = [], a = 0) {
    const s = "act" === (this.trayTab || "act"),
      e = gsMats(s);
    ((t = t.filter((t) => e.some((a) => a.u === t))),
      (this.gs = { pick: t }),
      ($("#sheet").className = "gfp"),
      ($("#sheetBg").hidden = !1));
    const n = $("#sheet"),
      l = $("#sheet .gfS");
    if ((l && (this.gsSc = [n.scrollTop, l.scrollTop]), a))
      return void ($("#sheet").innerHTML = cfCard(
        "分解寶石？",
        "",
        [
          `分解 <span class="px">${t.length}</span> 顆寶石`,
          cfW("分解後無法復原"),
          cfGain(t.length * MUT.ash),
        ],
        "分解",
        "gfsDo",
        "gfsBack",
      ));
    const o = (t) =>
        Math.max(1, Math.min(3, Math.floor(30 / Math.max(t.W, t.H)))),
      r = (t) => {
        const a = gemArt(t.id, 0, 5, t.sh, t.sx);
        return `<span class="shape" style="width:${a.W * o(a)}px;height:${a.H * o(a)}px">${a.svg}</span>`;
      },
      i = (a) => this.stkCell(a, t, "gfsPick", r),
      c = [...new Set(e.map((t) => t.id))],
      d = e.length && t.length === e.length;
    n.innerHTML = `<h2 class="cfh">分解寶石</h2>\n      <div class="row"><span>${s ? "主動" : "輔助"}寶石</span><span class="spacer"></span><span>選擇 <span class="px">${t.length}</span> 顆</span><button class="btn sm" data-act="gfsAll">${d ? "取消全選" : "全選"}</button></div>\n      <div class="gfS">${
      c
        .map(
          (t) =>
            `<div class="gfR"><div class="note">${esc(SKILLS[t].n)}</div><div class="gfG">${gemStacks(
              e.filter((a) => a.id === t),
            )
              .sort(
                (t, a) =>
                  !!t[0].sh - !!a[0].sh ||
                  gemShape(a[0]).length - gemShape(t[0]).length,
              )
              .map(i)
              .join("")}</div></div>`,
        )
        .join("") || '<p class="note" style="margin:0">沒有可分解的寶石。</p>'
    }</div>\n      <div class="cfl"><div>每顆獲得Zeny <span class="px">+${MUT.ash}</span></div><div>傳說、穿梭寶石也可分解</div></div>\n      <div class="row"><button class="btn" data-act="close">關閉</button><span class="spacer"></span><button class="btn danger" data-act="gfsYes" ${t.length ? "" : "disabled"}>分解 <span class="px">${t.length}</span> 顆</button></div>`;
    const [f, p] = this.gsSc || [0, 0];
    n.scrollTop = f;
    const u = $("#sheet .gfS");
    u && (u.scrollTop = p);
  },
  gsAct(t, a) {
    const s = this.gs;
    if (s) {
      if ("gfsPick" === t)
        return this.gsOpen(
          this.stkPick(gsMats("act" === (this.trayTab || "act")), s.pick, a),
        );
      if ("gfsAll" === t) {
        const t = gsMats("act" === (this.trayTab || "act"));
        return this.gsOpen(s.pick.length === t.length ? [] : t.map((t) => t.u));
      }
      if ("gfsYes" === t) return this.gsOpen(s.pick, 1);
      if ("gfsBack" === t) return this.gsOpen(s.pick);
      if ("gfsDo" === t) {
        const t = gsMats("act" === (this.trayTab || "act")),
          a = s.pick.filter((a) => t.some((t) => t.u === a));
        if (!a.length) return this.gsOpen();
        if (
          ((S.gems = S.gems.filter((t) => !a.includes(t.u))),
          (S.ash += a.length * MUT.ash),
          a.includes(this.selGem) && (this.selGem = null),
          toast(`分解 ${a.length} 顆寶石，Zeny +${fmt(a.length * MUT.ash)}`),
          markDirty(),
          ui.render(),
          gsMats("act" === (this.trayTab || "act")).length)
        )
          return this.gsOpen();
        ((this.gs = null),
          ($("#sheetBg").hidden = !0),
          ($("#sheet").className = ""));
      }
    }
  },
  bcOpen(t = { to: S.gp ? 0 : 1, eq: 0, gr: 0 }) {
    this.bc = t;
    const a = t.to + 1,
      s = t.eq || t.gr;
    (($("#sheet").className = "gfp"),
      ($("#sheetBg").hidden = !1),
      ($("#sheet").innerHTML =
        `<h2 class="cfh">複製構築 ${S.gp + 1}</h2>\n      <div class="row"><span>內容</span><div class="seg" style="margin:0;flex:1"><button data-act="gfbEq" aria-pressed="${!!t.eq}">裝備</button><button data-act="gfbGr" aria-pressed="${!!t.gr}">技能拼圖</button></div></div>\n      <div class="row"><span>複製到</span><div class="seg" style="margin:0;flex:1">${S.gpages.map((a, s) => (s === S.gp ? "" : `<button data-act="gfbTo" data-u="${s}" aria-pressed="${t.to === s}">構築 ${s + 1}</button>`)).join("")}</div></div>\n      <div class="cfl">${
          s
            ? [
                t.eq && cfW(`取代構築 ${a} 的裝備`),
                t.gr && cfW(`取代構築 ${a} 的技能拼圖`),
                "天賦與轉職分支不變",
              ]
                .filter(Boolean)
                .map((t) => `<div>${t}</div>`)
                .join("")
            : "<div>選擇要複製的內容</div>"
        }</div>\n      <div class="row"><button class="btn" data-act="close">取消</button><span class="spacer"></span><button class="btn primary" data-act="gfbYes" ${s ? "" : "disabled"}>複製</button></div>`));
  },
  bcAct(t, a) {
    const s = this.bc;
    if (s) {
      if ("gfbEq" === t) s.eq = !s.eq;
      else if ("gfbGr" === t) s.gr = !s.gr;
      else if ("gfbTo" === t) s.to = a;
      else if ("gfbYes" === t)
        return (
          copyBuild(s.to, s.eq, s.gr),
          toast(`已複製到構築 ${s.to + 1}`),
          sfx("quest"),
          markDirty(),
          (this.bc = null),
          ($("#sheetBg").hidden = !0),
          void ($("#sheet").className = "")
        );
      this.bcOpen(s);
    }
  },
  gfAct(t, a) {
    if (t.startsWith("gfs")) return this.gsAct(t, a);
    if (t.startsWith("gfb")) return this.bcAct(t, a);
    const s = this.gf;
    if (s) {
      if ("gfPick" === t)
        return this.gfOpen(s.id, this.stkPick(gfMats(s.id), s.pick, a, MUT.fn));
      if ("gfYes" === t) {
        const t = gfMats(s.id),
          a = s.pick.filter((a) => t.some((t) => t.u === a));
        if (a.length !== MUT.fn || S.ash < MUT.fc) return this.gfOpen(s.id, a);
        ((S.ash -= MUT.fc), (S.gems = S.gems.filter((t) => !a.includes(t.u))));
        const e = {
          u: uid(),
          id: s.id,
          x: -1,
          y: -1,
          rot: 0,
          sh: mutShape(SKILLS[s.id].shape),
          nw: 1,
        };
        return (
          S.gems.push(e),
          a.includes(this.selGem) && (this.selGem = e.u),
          sfx("lvl"),
          markDirty(),
          ui.badge("skill", 1),
          ui.render(),
          this.gfOpen(s.id, [], e)
        );
      }
    }
  },
  cfOpen() {
    const t = this.cfFor(this.confirm);
    t
      ? (($("#sheet").className = "cfp"),
        ($("#sheet").innerHTML = t),
        ($("#sheetBg").hidden = !1))
      : (this.confirm = null);
  },
  axOpen() {
    const t = this.alchMd(),
      a = this.alchAll(t).find((t) => t.u === this.alchSel);
    if (!a)
      return (
        (this.axOn = !1),
        (this.confirm = null),
        ($("#sheetBg").hidden = !0),
        void ($("#sheet").className = "")
      );
    const s = $("#sheet"),
      e = "axs" === s.className ? s.scrollTop : 0,
      n = $("#sheet .runeScroll")?.scrollTop || 0;
    ((this.axOn = !0), (s.className = "axs"), ($("#sheetBg").hidden = !1));
    const l = this.confirm && this.axCf(t, a);
    ((s.innerHTML =
      l ||
      `<div class="row axh"><b>${{ x: "萃取", i: "灌注", r: "磨礪", c: "腐化", m: "賦予奇蹟", h: "洗鍊" }[t]}</b>${helpBtn(AX_HELP[t])}<span class="spacer"></span><button class="btn sm" data-act="close">關閉</button></div>` +
        ("m" === t
          ? this.mirHtml(a)
          : "h" === t
            ? this.holyHtml(a)
            : "c" === t
              ? this.corHtml(a)
              : "r" === t
                ? this.rrHtml(a)
                : "i" === t
                  ? this.infHtml(a)
                  : this.xtrHtml(a)) +
        ("m" !== t && mirOn() && S.mat.m1 > 0 && !a.mir && canMir(a)
          ? `<label class="chk"><input type="checkbox" data-act="mirpick" ${this.mirPick ? "checked" : ""}><span>使用奇蹟石強化本次・<span class="px">X${S.mat.m1}</span></span></label>`
          : "") +
        ("m" !== t && (a.mir || (mirOn() && S.mat.m1 > 0 && canMir(a)))
          ? this.mirFx(a, t, a.mir ? "奇蹟生效" : "奇蹟")
              .map((t) =>
                a.mir || this.mirPick
                  ? `<div class="s mirt">${t}</div>`
                  : `<div class="s" style="color:var(--muted)">${t}</div>`,
              )
              .join("")
          : "")),
      (s.scrollTop = l ? 0 : e));
    const o = $("#sheet .runeScroll");
    o && (o.scrollTop = n);
  },
  axAct(t, a) {
    const s = t.dataset.act;
    return "help" === s
      ? (helpOpen(t.dataset.k, +t.dataset.i || 0), !0)
      : "axRe" === s
        ? ((this.confirm = null), (this.alchRes = null), this.axOpen(), !0)
        : !!AX_ACTS.has(s) &&
          (onPanelClick(a),
          $("#sheet").classList.contains("alr") || this.axOpen(),
          !0);
  },
  axCf(t, a) {
    const s = cfW,
      e = cfAsh,
      n = this.mirPick && mirPickOk(a),
      l = [
        ...(n || a.mir
          ? this.mirFx(a, t, "奇蹟").map(
              (t) => `<span class="mirt">${t}</span>`,
            )
          : []),
        n &&
          `<span class="mirt">奇蹟</span>：消耗 奇蹟石、Zeny <span class="px">${ALCH_ASH.m(a.ilvl)}</span>`,
      ],
      o = !("x" === t && (a.my || a.lk)) && nocfChk(),
      r = this.itemHead(a) + this.cfLines(t, a),
      i = (t, a, s, e) => cfCard(t, r, [...a, ...l, o], s, e);
    if ("x" === t && "alch" === this.confirm) {
      const t = this.alchOpt,
        n = xStone();
      return n
        ? cfCard(
            a.my ? "萃取主宰？" : "確定萃取？",
            r,
            [
              ...l,
              ...(a.my ? mythW("獨特", a) : []),
              a.my && "主宰效果無法萃取",
              a.lk && "此裝備已鎖定，將自動解鎖",
              t.p
                ? `${PROT_KEEP[t.p]}% 機率保留裝備`
                : s("無論成敗，裝備皆會被摧毀"),
              `消耗 ${MATS[n].n}${t.p ? "、" + MATS[t.p].n : ""}`,
              e(ALCH_ASH.x(a.ilvl)),
              o,
            ],
            a.my ? "長按萃取" : "萃取",
            "alchYes",
            "cancel",
            "",
            a.my ? "danger hold" : "danger",
          )
        : "";
    }
    if ("i" === t && "inf" === this.confirm) {
      const t = S.runes.find((t) => t.u === this.infR),
        n = t && t.uq ? "i4" : infStone(a),
        l = this.sealOn(a);
      return t && n
        ? i(
            "確定灌注？",
            [
              `隨機取代一條${l ? "未封印的" : ""}詞綴`,
              s("符文石將被消耗"),
              `消耗 ${MATS[n].n}${l ? "、封印石" : ""}`,
              e(ALCH_ASH.i(a.ilvl)),
            ],
            "灌注",
            "infYes",
          )
        : "";
    }
    if ("r" === t && "rr" === this.confirm) {
      const t = this.sealOn(a);
      return i(
        "確定磨礪？",
        [
          `重洗 <span class="px">${slLines(a).length - (t ? 1 : 0)}</span> 條詞綴的數值`,
          t && "封印的詞綴不會改變",
          "消耗 磨礪石" + (t ? "、封印石" : ""),
          e(ALCH_ASH.r(a.ilvl)),
        ],
        "磨礪",
        "rrYes",
      );
    }
    return "h" === t && "holy" === this.confirm
      ? i(
          "確定使用洗鍊石？",
          [
            "在範圍內重洗基底數值",
            !(a.mir || n) && "結果隨機，可能變差",
            "消耗 洗鍊石",
            e(ALCH_ASH.h(a.ilvl)),
          ],
          "重洗",
          "holyYes",
        )
      : "c" === t && "cor" === this.confirm
        ? i(
            "確定腐化？",
            [
              s("腐化後無法再煉金"),
              "結果隨機，可能變差",
              "消耗 腐化石",
              e(ALCH_ASH.c(a.ilvl)),
            ],
            "腐化",
            "corYes",
          )
        : "";
  },
  xLines(t) {
    const a = t.af.reduce((t, a) => t + AFFIX[a.a].w, 0),
      s = xStone(),
      e = uqKey(t) && !t.my ? XTR.uq[s ? MATS[s].l : 0] : 0;
    return `<div>${t.af.map((t) => affixLine(t, a, 1 - e / 100)).join("")}${uqKeys(
      t,
    )
      .map(
        (a) =>
          `<div class="affix"><span class="tag" style="color:var(--ru)">獨特</span><span>${esc(uqText(a, t.cm || 1))}</span><span class="w">${t.my ? "不可" : e ? +(e / uqKeys(t).length).toFixed(1) + "%" : "Lv3+"}</span></div>`,
      )
      .join("")}</div>${dgHtml(t)}`;
  },
  cfLines(t, a) {
    if ("h" === t) return baseRow(a, 1);
    if ("x" === t) return this.xLines(a);
    const s = "ir".includes(t) && this.sealOn(a),
      e = "i" === t && S.runes.find((t) => t.u === this.infR);
    return (
      `<div>${a.af.map((t, a) => affixLine(t, null, 1, s && this.sealJ === a)).join("")}</div>` +
      uqKeys(a)
        .map(
          (t) =>
            `<div class="uniq">${t === a.uq ? "" : `<b>${esc(UNIQUE[t].n)}</b>：`}${esc(uqText(t, a.cm || 1))}</div>`,
        )
        .join("") +
      dgHtml(a) +
      (e
        ? `<div class="axsec">灌注的符文石</div><div class="li">${runeTag(e)}<span class="grow">${esc(runeDesc(e))}</span></div>`
        : "")
    );
  },
  xtrHtml(t) {
    t.af.reduce((t, a) => t + AFFIX[a.a].w, 0);
    const a = this.alchOpt,
      s = xStone(),
      e = s ? MATS[s].l : 0,
      n =
        (uqKey(t) && !t.my && XTR.uq[e],
        s
          ? [
              XTR.ok[e] < 100 ? `成功率 ${XTR.ok[e]}%` : "成功率 100%",
              XTR.up[e] && `${XTR.up[e]}% 機率詞綴升一階`,
            ]
              .filter(Boolean)
              .join("・")
          : ""),
      l = ALCH_ASH.x(t.ilvl),
      o = S.runes.length >= 5e3;
    return (
      this.itemHead(t) +
      this.xLines(t) +
      `\n      <p class="note" style="margin:0">右側 %＝取出機率，階級不變</p>\n      <div class="axsec">神秘金屬</div><div class="seg">${["x1", "x2", "x3", "x4"].map((t) => `<button data-act="xopt" data-k="${t}" aria-pressed="${s === t}" ${S.mat[t] ? "" : "disabled"}>Lv${MATS[t].l} <span class="px">X${S.mat[t] || 0}</span></button>`).join("")}</div>${s ? `<p class="note" style="margin:0">${n}</p>` : ""}\n      <div class="axsec">保護石</div>${["p1", "p2"].map((t) => `<label class="chk"><input type="checkbox" data-act="aopt" data-k="${t}" ${a.p === t ? "checked" : ""} ${S.mat[t] ? "" : "disabled"}>${MATS[t].n}・保留 <span class="px">${PROT_KEEP[t]}%</span><span class="spacer"></span><span class="px">X${S.mat[t] || 0}</span></label>`).join("")}\n      ${s ? (o ? '<p class="note" style="margin:0;color:var(--bad)">符文石已滿 <span class="px">5000</span> 顆</p>' : "") : '<p class="note" style="margin:0">沒有神秘金屬，可於「合成」製作。</p>'}\n      <button class="btn primary axgo" data-act="alch" ${s && !o && S.ash >= l ? "" : "disabled"}>萃取${s ? `・Lv${MATS[s].l}` : ""}${ashTag(l)}</button>`
    );
  },
  mergeHtml() {
    const t = `<img class="ashI" src="${shopIcon("ash")}" alt="Zeny" style="margin-left:2px">`,
      a = this.mergeRes,
      s = a && performance.now() - a.t < 350;
    return `<div class="list">${MERGE.map(([e, n], l) => {
      const o = S.mat[e] || 0,
        r = mergeAsh(n),
        i = Math.min(Math.floor(o / 4), Math.floor(S.ash / r));
      return `<div class="li"><img src="${matIcon(MATS[e].f)}" alt="" style="width:24px;height:24px;image-rendering:pixelated"><div class="grow"><div class="t">${"p" === MATS[e].f ? "低階保護石" : MATS[e].n} <span class="px">X4</span> → <span style="color:var(${lvCol(n)})">${"p" === MATS[e].f ? "高階" : "Lv" + MATS[n].l}</span></div>\n        <div class="s">持有 <span class="px">${o}</span>${a && a.got[n] ? `・<span class="crf${s ? " new" : ""}">獲得 <span class="px">X${a.got[n]}</span></span>` : ""}</div></div>\n        <div class="row" style="gap:4px;flex-wrap:nowrap"><button class="btn sm" data-act="merge" data-i="${l}" data-n="1" ${i ? "" : "disabled"}>合成 <span class="px">${r}</span>${t}</button><button class="btn sm" data-act="merge" data-i="${l}" data-n="1000000" ${i ? "" : "disabled"}>全部 <span class="px">X${i}</span></button></div></div>`;
    }).join(
      "",
    )}</div><div class="row" style="margin-top:6px"><button class="btn" data-act="merge" data-i="-1" data-n="1000000" ${MERGE.some(([t, a]) => (S.mat[t] || 0) >= 4 && S.ash >= mergeAsh(a)) ? "" : "disabled"}>全部升級</button>${a && !Object.keys(a.got).length ? '<span class="note">沒有可合成的材料</span>' : ""}</div>\n      <label class="chk" style="margin-top:6px"><input type="checkbox" data-act="amp" ${S.set.amp ? "checked" : ""}><span>低階保護石自動合成為高階</span></label>`;
  },
  sealCan(t) {
    return this.sealPick && S.mat.s1 > 0 && t.af.length > 1;
  },
  sealOn(t) {
    return this.sealCan(t) && null != this.sealJ && this.sealJ < t.af.length;
  },
  sealLines(t) {
    const a = this.sealCan(t),
      s =
        `<div>${t.af.map((t, s) => (a ? `<button class="sealPick" data-act="sealj" data-i="${s}" aria-pressed="${this.sealJ === s}">${affixLine(t, null, 1, this.sealJ === s)}</button>` : affixLine(t))).join("")}</div>` +
        uqKeys(t)
          .map(
            (a) =>
              `<div class="uniq${t.my && a === t.uq ? " rm" : ""}">${a === t.uq ? "" : `<b>${esc(UNIQUE[a].n)}</b>：`}${esc(uqText(a, t.cm || 1))}</div>`,
          )
          .join("");
    return !(S.mat.s1 > 0) || t.af.length < 2
      ? s + dgHtml(t)
      : s +
          dgHtml(t) +
          `<label class="chk"><input type="checkbox" data-act="sealopt" ${a ? "checked" : ""}>${MATS.s1.n}，本次保護一條詞綴 <span class="px">X${S.mat.s1}</span></label>` +
          (a && null == this.sealJ
            ? '<p class="note" style="margin:0">點選要封印的詞綴</p>'
            : "");
  },
  mirFx(t, a, s) {
    const e = uqKey(t),
      n = s || { x: "萃取", i: "灌注", r: "磨礪", c: "腐化", h: "洗鍊" }[a];
    return (
      {
        x: () =>
          canAlch(t)
            ? [
                e && !t.my && "必定取出獨特效果",
                "使用 Lv4 神秘金屬時，詞綴必定升一階",
              ]
            : [],
        i: () => [canInfuse(t) && "取代階級最低的詞綴"],
        r: () => [canReroll(t) && "所有詞綴數值必定提升"],
        c: () => [canCorrupt(t) && 100 * MIR.cor + "% 機率不進入腐化狀態"],
        h: () => [canHoly(t) && "基底數值必定提升"],
      }[a] || (() => [])
    )()
      .filter(Boolean)
      .map((t) => `${n}：${t}`);
  },
  mirHtml(t) {
    const a = S.mat.m1 || 0,
      s = ALCH_ASH.m(t.ilvl),
      e = (uqKey(t), "xirch".split("").flatMap((a) => this.mirFx(t, a)));
    return (
      this.itemHead(t) +
      `<div>${t.af.map((t) => affixLine(t)).join("")}</div>` +
      uqKeys(t)
        .map(
          (a) =>
            `<div class="uniq${t.my && a === t.uq ? " rm" : ""}">${esc(uqText(a, t.cm || 1))}${cmTag(t)}</div>`,
        )
        .join("") +
      dgHtml(t) +
      `<div class="axsec">下一次煉金</div>${e.map((t) => `<div class="s mirt">${t}</div>`).join("")}` +
      (a
        ? ""
        : `<p class="note" style="margin:0">奇蹟石僅由${MONARCH.n}掉落。</p>`) +
      `<button class="btn primary axgo" data-act="mir" ${a && S.ash >= s ? "" : "disabled"}>賦予奇蹟・奇蹟石 <span class="px">X${a}</span>${ashTag(s)}</button>`
    );
  },
  corHtml(t) {
    const a = S.mat.c1 || 0,
      s = ALCH_ASH.c(t.ilvl);
    return (
      this.itemHead(t) +
      `<div>${t.af.map((t) => affixLine(t)).join("")}</div>` +
      uqKeys(t)
        .map(
          (a) =>
            `<div class="uniq">${esc(uqText(a, t.cm || 1))}${cmTag(t)}</div>`,
        )
        .join("") +
      `<div class="axsec">結果機率</div><div class="cfl odds">${COR.n.map((t, a) => `<div><span>${t}</span><span class="spacer"></span><span class="px">${COR.w[a]}%</span></div>`).join("")}</div>` +
      `<button class="btn primary axgo" data-act="cor" ${a && S.ash >= s ? "" : "disabled"}>腐化・腐化石 <span class="px">X${a}</span>${ashTag(s)}</button>`
    );
  },
  holyHtml(t) {
    const a = S.mat.h1 || 0,
      s = ALCH_ASH.h(t.ilvl);
    return (
      this.itemHead(t) +
      baseRow(t, 1) +
      `<button class="btn primary axgo" data-act="holy" ${a && S.ash >= s ? "" : "disabled"}>重洗基底・洗鍊石 <span class="px">X${a}</span>${ashTag(s)}</button>`
    );
  },
  rrHtml(t) {
    const a = S.mat.r1 || 0,
      s = this.sealOn(t),
      e = this.itemHead(t) + this.sealLines(t);
    return this.sealCan(t) && !s
      ? e
      : e +
          `<button class="btn primary axgo" data-act="rr" ${a && S.ash >= ALCH_ASH.r(t.ilvl) ? "" : "disabled"}>磨礪・磨礪石 <span class="px">X${a}</span>${ashTag(ALCH_ASH.r(t.ilvl))}</button>`;
  },
  infHtml(t) {
    const a = S.runes
      .filter(
        (a) =>
          !isStaged(a.u) &&
          (a.uq ? uqInfFit(t, a) : AFFIX[a.a].s.includes(t.slot)),
      )
      .sort(runeByTier);
    a.some((t) => t.u === this.infR) || (this.infR = null);
    const s = a.find((t) => t.u === this.infR),
      e = s && s.uq ? "i4" : infStone(t);
    let n =
      this.itemHead(t) +
      this.sealLines(t) +
      `<div class="axsec">選擇符文石 <span class="px">${a.length}</span></div>`;
    if (
      ((n += a.length
        ? `<div class="list runeScroll">${runeGrp(a, (this.infOpen ||= new Set()), "infg", (t, a) => `<button class="li ing" data-act="infr" data-u="${t.u}" aria-pressed="${a.some((t) => t.u === this.infR)}">${runeTag(t)}<span class="grow">${esc(runeDesc(t))}</span>${stackN(a)}</button>`, 1)}</div>`
        : `<p class="note" style="margin:0">沒有可灌注至${SLOT_NAME[t.slot]}的符文石。</p>`),
      !s)
    )
      return (
        n +
        (a.length
          ? '<button class="btn primary axgo" disabled>請先選擇符文石</button>'
          : "")
      );
    const l = this.sealOn(t),
      o = t.af.length - (l ? 1 : 0);
    return this.sealCan(t) && !l
      ? n
      : ((n += `<p class="note" style="margin:0">取代一條${l ? "未封印的" : ""}詞綴・各 <span class="px">${Math.round(100 / o)}%</span></p>${s.uq ? "" : '<p class="note" style="margin:0">可能出現兩條同種詞綴</p>'}`),
        e
          ? !s.uq || S.mat.i4 > 0
            ? n +
              `<button class="btn primary axgo" data-act="inf" ${S.ash >= ALCH_ASH.i(t.ilvl) ? "" : "disabled"}>灌注・Lv${MATS[e].l} <span class="px">X${S.mat[e]}</span>${ashTag(ALCH_ASH.i(t.ilvl))}</button>`
            : n +
              '<p class="note" style="margin:0;color:var(--bad)">獨特效果需要鋁 Lv4</p><button class="btn primary axgo" disabled>灌注・Lv4 <span class="px">X0</span></button>'
          : n +
            `<p class="note" style="margin:0">${t.uq ? "獨特裝備需要鋁 Lv2 以上。" : "沒有鋁，可於「合成」製作。"}</p>`);
  },
};
function equipItem(t) {
  const a = S.bag.findIndex((a) => a.u === +t);
  if (a < 0) return;
  if (!canWear(S.bag[a]))
    return void toast(`等級不足：需要 LV${reqLv(S.bag[a])}`, "bad");
  const s = S.bag.splice(a, 1)[0],
    e = S.equip[s.slot];
  ((S.equip[s.slot] = s),
    e && S.bag.splice(a, 0, e),
    recalc(),
    validateGrid() && toast("部分寶石所在格子已鎖定，已退回"),
    recalc(),
    quest("equip", 1),
    markDirty());
}
function unequip(t) {
  for (const a of SLOTS)
    if (S.equip[a] && S.equip[a].u === +t) {
      if (S.bag.length >= BAG_MAX) return;
      (S.bag.push(S.equip[a]), delete S.equip[a]);
    }
  (recalc(),
    validateGrid() && toast("部分寶石所在格子已鎖定，已退回"),
    recalc(),
    markDirty());
}
function salvage(t) {
  const a = S.bag.findIndex((a) => a.u === +t);
  if (a < 0 || S.bag[a].lk) return -1;
  const s = S.bag.splice(a, 1)[0];
  return (
    s.sock && (s.sock.st = []),
    (S.ash += salvageValue(s)),
    quest("salvage", 1),
    markDirty(),
    a
  );
}
Object.assign(ui, {
  p_map() {
    const t = {
        map: () =>
          `${this.slateBoard()}<h3>選擇地圖${helpBtn("map")}</h3>\n      <div class="list mlist">${MAPS.slice(
            0,
            MAP_N,
          )
            .map((t, a) => this.mapCard(a))
            .join("")}</div>`,
        ss: () => this.seasonBoard(),
        tr: () => this.trialBoard() + this.trnBoard(),
        end: () => this.guardBoard(),
        st: () => this.statBoard(),
      },
      a = [
        ["map", "一般地圖", 1],
        ["ss", "活動", SEASON.on],
        ["tr", "試煉", 1],
        ["end", "終局", slatesUnlocked()],
        ["st", "統計", 1],
      ].filter((t) => t[2]),
      s = (a.find((t) => t[0] === this.mapView) || a[0])[0];
    return (
      `<div class="seg" style="margin-bottom:8px">${a.map(([t, a]) => `<button data-act="mview" data-v="${t}" aria-pressed="${s === t}">${a}${S.mvs[t] ? "" : '<b class="mst snew">NEW</b>'}</button>`).join("")}</div>` +
      t[s]()
    );
  },
  banW: () =>
    Math.max(110, Math.floor((($("#panel").clientWidth || 360) - 32) / 2)),
  bossBar: (t) =>
    `<img class="mbsk" src="${iconURL("bsk")}" alt="Boss"><span class="mbar"><i style="width:${100 * Math.min(1, S.prog[t] / bossNeed(t))}%"></i></span><span class="px">${S.prog[t]}/${bossNeed(t)}</span>`,
  mapCard(t) {
    const a = MAPS[t],
      s = t > S.unlocked,
      e = t === S.map,
      n = [...a.m, ...(a.rx ? [a.rx] : [])]
        .map((t, a) => ({ t, x: 0.18 + 0.17 * a, y: 30 + (a % 2) * 6 }))
        .concat(s ? [] : [{ t: a.bt, x: 0.82, y: 37, sc: 2, boss: 1 }]),
      l = slatesOn(t).length,
      o = l ? `LV${slateLv(t)}・石板 ${l}` : `LV${a.lv[0]}-${a.lv[1]}`,
      r = a.m.reduce((a, s) => a + (S.kills[t + "_" + s] || 0), 0),
      i = s
        ? ""
        : `<span class="msi"><img class="ficon" src="${iconURL("bsk")}" alt="Boss">${esc(a.boss)}</span>${S.mt[t] || r ? `<span class="msi">掛機 <span class="px">${clock(S.mt[t] || 0, 1)}</span></span><span class="msi">擊殺 <span class="px">${fmt(r)}</span></span>` : ""}${slatesUnlocked() ? `<span class="msi"><img class="ficon" src="${this.cvURL("tk" + guardOf(t), SP.gd[guardOf(t)][0])}" alt="${GUARD[guardOf(t)].tk}"></span>` : ""}`;
    return `<div class="mapRow"><button class="mcard${s ? " locked" : ""}${e ? " cur" : ""}" data-act="map" data-i="${t}" ${s ? "disabled" : ""} aria-label="${esc(a.n)}">\n      <span class="mban"><img src="${mapBanner("m" + t + (s ? "L" : ""), a.v, this.banW(), 40, 131 * t + 7, n)}" alt=""><span class="mpl mname">${esc(a.n)}${e ? '<b class="mst now">NOW</b>' : S.beat[t] ? '<b class="mst clr">CLEAR</b>' : ""}</span><span class="mpl mlv px">${o}</span>${s ? '<span class="mlock">LOCK</span>' : ""}</span>\n      <span class="mfoot">${s ? '<span class="note" style="margin:0">擊敗上一張地圖的 Boss 解鎖</span>' : this.bossBar(t)}</span>${i ? `<span class="mfoot sub">${i}</span>` : ""}\n    </button></div>`;
  },
  seasonBoard() {
    if (!SEASON.on) return "";
    const t = SS_MAP,
      a = MAPS[t],
      s = ssOpen(),
      e = ssMap(),
      n = mapBanner(
        "ss",
        a.v,
        this.banW(),
        44,
        777,
        GODS.map((t, a) => ({ t: t.bt, x: 0.22 + 0.28 * a, y: 41, sc: 2 })),
      ),
      l = (t) => s && S.ssf[t] >= SS.fragN && canStartA(),
      o = GODS.map(
        (t, a) =>
          `<div class="gfr"><img src="${SP.ssf[a].toDataURL()}" alt=""><span>${t.n}</span><b class="px">${S.ssf[a]}/${SS.fragN}</b><button class="btn sm ${l(a) ? "primary" : ""}"  data-act="ssBoss" data-g="${a}" ${l(a) ? "" : "disabled"}>挑戰</button><label class="chk"><input type="checkbox" data-act="ssag" data-g="${a}" ${S.set.ags && S.set.ags[a] ? "checked" : ""}><span>自動</span></label></div>`,
      ).join("");
    return `<h3>活動${helpBtn("season")}</h3><div class="mapRow"><div class="mcard ss${e ? " cur" : ""}${s ? "" : " locked"}"><button class="mbanBtn" data-act="map" data-i="${t}" ${s ? "" : "disabled"} aria-label="${esc(a.n)}">\n      <span class="mban"><img src="${n}" alt=""><span class="mpl mname ssn">${SEASON.n}${e ? '<b class="mst now">NOW</b>' : s ? '<b class="mst go">前往</b>' : ""}</span><span class="mpl mlv px">LV${SEASON.lv}</span>${s ? "" : `<span class="mlock">${SEASON.lv} 級開放</span>`}</span>\n</button>\n      <span class="mfoot"><b class="ssm">${a.n}</b><span class="spacer"></span><span style="color:var(--muted)">神之碎片・${SS.fragN} 片挑戰一次</span></span>\n      <div class="ssfr" style="margin-bottom:8px">${o}</div>\n      <span class="mfoot sub"><span class="msi">掉落</span><span class="dchip">活動獨特</span><span class="dchip">神器</span></span>\n    </div></div>`;
  },
  trialBoard() {
    const t = TRIAL[S.tal.tr],
      a = ascBranch(),
      s = t && S.lvl >= t.lv && !G.boss,
      e = mapBanner(
        "tr" + S.tal.tr,
        ARENA.trial.v,
        this.banW(),
        40,
        901,
        t ? [{ t: t.bt, x: 0.5, y: 37, sc: 2, boss: 1 }] : [],
      );
    return `<h3>轉職試煉${helpBtn("asc")}</h3><div class="mcard tcard"><span class="mban"><img src="${e}" alt=""><span class="mpl mname">${t ? t.n : "四場試煉全部完成"}</span>${t ? `<span class="mpl mlv px">LV${t.lv}</span>` : ""}<span class="tpips">${TRIAL.map((t, a) => `<i class="${a < S.tal.tr ? "on" : ""}"></i>`).join("")}</span></span>\n      <span class="mfoot">${a ? `分支 <b>${a.n}</b>` : S.tal.tr ? '<button class="btn sm primary" data-act="ascPick">選擇分支</button>' : '限時 <span class="px">120</span> 秒'}・天賦點 <span class="px">${S.tal.n}</span><span class="spacer"></span>\n      ${t ? `<button class="btn sm ${s ? "primary" : ""}" data-act="trial" ${s ? "" : "disabled"}>${null != G.trial ? "挑戰中" : S.lvl < t.lv ? `${t.lv} 級開放` : "開始挑戰"}</button>` : ""}</span></div>`;
  },
  trnBoard() {
    const t = S.trn,
      a = !!G.trn,
      s = !a && !canStartA(),
      e = (a, s, e) =>
        `<div class="row" style="margin:6px 0"><span style="width:36px">${s}</span><div class="seg" style="margin:0;flex:1">${e.map((s, e) => `<button data-act="trn" data-k="${a}" data-v="${e}" aria-pressed="${(t[a] || 0) === e}">${s}</button>`).join("")}</div></div>`,
      n = `<button class="btn sm ${s ? "" : "primary"}" data-act="trnGo" ${s ? "disabled" : ""}>${a ? "離開訓練場" : "進入訓練場"}</button>`;
    return a
      ? `<h3>訓練場${helpBtn("trn")}</h3><div class="board">\n      ${e("t", "類型", TRN.t)}${e(
          "n",
          "數量",
          TRN.n.map((t) => t + " 隻"),
        )}${e("m", "模式", TRN.m)}${e("p", "位置", TRN.p)}${e("a", "攻擊", TRN.a)}${
          t.m
            ? e(
                "r",
                "重生",
                TRN.r.map((t) => (t ? t + " 秒" : "立即")),
              )
            : ""
        }\n      <div class="row"><button class="btn sm" data-act="trnRst">重置統計</button><span class="spacer"></span>${n}</div><div id="trnFull">${trnFullHtml()}</div></div>`
      : `<h3>訓練場${helpBtn("trn")}</h3><div class="board"><div class="row"><span class="note">對假人測試構築的傷害</span><span class="spacer"></span>${n}</div></div>`;
  },
  statBoard() {
    const t = ses(),
      a = Math.max(t.t, 10) / 60,
      s = ["--r0", "--r1", "--r2", "--r3", "--ru", "--rs", "--r4"],
      e = (t, a, s) =>
        `<div class="stile"><span class="px"${s ? ` style="color:var(${s})"` : ""}>${a}</span><small>${t}</small></div>`;
    return `<h3>掛機統計${helpBtn("map", 3)}</h3><div class="board">\n      <div class="stiles">${e("時間", clock(t.t))}${e("擊殺/分", fmt(t.k / a), "--ember")}${e("經驗/分", fmt(t.xp / a), "--ok")}${e("升級", "+" + Math.max(0, S.lvl - t.lv))}${e("擊殺", fmt(t.k))}${e("經驗", fmt(t.xp))}${e("Boss 擊敗", t.boss)}${e("陣亡", t.die, t.die ? "--bad" : "")}</div>\n      <div class="drops">${["普通", "魔法", "稀有", "傳奇", "獨特", "插槽", "神話"].map((a, e) => (6 !== e || t.dr[6] ? `<span class="dchip" style="--c:var(${s[e]})"><i></i>${a} <b class="px">${t.dr[e]}</b></span>` : "")).join("")}</div>\n      <div class="row" style="color:var(--muted)">自動分解Zeny <span class="px">+${fmt(t.ash)}</span>${t.off ? `・含離線 ${clock(t.off)}` : ""}<span class="spacer"></span><button class="btn sm" data-act="sesReset">重置</button></div></div>`;
  },
  slateBoard() {
    if (!slatesUnlocked()) return "";
    const t = S.map,
      a = slotsOf(),
      s = slateOpen(),
      e = slatesOn(t),
      n = MAPS[t].lv,
      l = a.s
        .slice(0, slateCap())
        .map((t, a) =>
          t
            ? slateCell(t, "slPick", `data-i="${a}"`)
            : a < s
              ? `<button class="cell empty slAdd" data-act="slPick" data-i="${a}" aria-label="放入石板">＋</button>`
              : '<div class="cell empty slLock" aria-label="未開啟"><span class="px">LOCK</span></div>',
        )
        .join(""),
      o = slateDanger(t),
      r =
        slSumLines(t)
          .map(
            ([t, a, s]) =>
              `<div class="affix"><span${a ? ` style="color:var(${"rw" === a ? "--ok" : "--bad"})"` : ""}>${s ? afTip(s, t) : esc(t)}</span></div>`,
          )
          .join("") +
        (o
          ? `<div class="row" style="color:var(--muted)">危險度 <span class="px">${o}</span>・獎勵詞綴與稀有度 <span class="px">+${Math.round(o / 2)}%</span>・掉落數量 <span class="px">+${Math.round(o / 4)}%</span></div>`
          : "");
    return `<div class="board"><div class="row"><b>石板・全地圖</b>${helpBtn("slate")}<span class="spacer"></span><span>怪物 <span class="px">${e.length ? "LV" + slateLv(t) : `LV${n[0]}-${n[1]}`}</span></span></div>\n      <div class="row slSlots">${l}</div>\n      ${r || `<p class="note" style="margin:0">點「＋」放入石板，怪物等級轉為 <span class="px">${slateLv(t)}</span> 級。</p>`}${e.length ? '<p class="note" style="margin:0">點選石板可更換或取下</p>' : ""}\n      ${s < slateCap() ? `<div class="row" style="color:var(--muted)">${e.length ? "" : "放入石板後"}擊殺 <span class="px">${fmt(a.k % 1e3)}/1000</span> 開啟下一個欄位</div>` : ""}</div>`;
  },
  charsOpen() {
    const t = rosterGet(),
      a = this.chRn,
      s = this.chCf;
    (($("#sheet").className = "sck"), ($("#sheetBg").hidden = !1));
    const e = s && t.list.find((t) => t.id === s.id);
    if (e)
      $("#sheet").innerHTML =
        cfCard(
          1 === s.n ? "刪除角色？" : "再確認一次",
          `<div class="li"><b>${esc(e.name || "未命名")}</b><span class="spacer"></span><span style="color:var(--muted)">${(CLASS[e.cls] || {}).n || ""} <span class="px">LV${e.lvl}</span></span></div>`,
          [cfW("所有進度都會消失"), 2 === s.n && cfW("刪除後無法復原")],
          1 === s.n ? "刪除" : "確定刪除",
          "chDel",
          "chNo",
          `data-k="${e.id}"`,
        ) + '<p class="note" id="chErr" style="margin:0;color:var(--bad)"></p>';
    else if (
      (($("#sheet").innerHTML =
        `<div class="row"><b>角色</b>${helpBtn("chars")}<span class="spacer"></span><span class="px" style="color:var(--muted)">${t.list.length}/${CHAR_MAX}</span></div>\n      <div class="list">${t.list
          .map((t) => {
            const s = t.id === S.cid,
              e = (CLASS[t.cls] || {}).n || "",
              n =
                a === t.id
                  ? `<input id="chName" class="txt" maxlength="8" autocomplete="off" value="${esc(t.name || "")}"><button class="btn sm primary" data-act="chRnOk" data-k="${t.id}">儲存</button><button class="btn sm" data-act="chRnNo">取消</button>`
                  : `<span class="spacer"></span>${s ? "" : `<button class="btn sm primary" data-act="chUse" data-k="${t.id}">使用</button>`}<button class="btn sm" data-act="chRn" data-k="${t.id}">改名</button><button class="btn sm" data-act="chDel" data-k="${t.id}">刪除</button>`;
            return `<div class="li" style="flex-direction:column;align-items:stretch;gap:6px${s ? ";color:var(--ember)" : ""}"><div class="row"><b>${esc(t.name || "未命名")}</b>${s ? '<span class="tag">使用中</span>' : ""}<span class="spacer"></span>\n        <span style="color:var(--muted)">${e} <span class="px">LV${t.lvl}</span>${t.tw ? `・塔 <span class="px">${t.tw}</span> 層` : ""}</span></div><div class="row">${n}</div></div>`;
          })
          .join(
            "",
          )}</div><p class="note" id="chErr" style="margin:0;color:var(--bad)"></p>\n      <div class="row"><button class="btn" data-act="close">關閉</button><span class="spacer"></span><button class="btn primary" data-act="chNew" ${t.list.length >= CHAR_MAX ? "disabled" : ""}>建立新角色</button></div>`),
      a)
    ) {
      const t = $("#chName");
      t && t.focus();
    }
  },
  chAct(t, a) {
    const s = (t) => {
        const a = $("#chErr");
        a && (a.textContent = t);
      },
      e = () => G && (G.arena || inFight());
    if ("chNew" === t) {
      if (rosterGet().list.length >= CHAR_MAX) return;
      return e()
        ? s("挑戰中無法建立角色。")
        : (sheetOff(), void showPick("new"));
    }
    if ("chUse" === t)
      return e() ? s("挑戰中無法切換角色。") : (sheetOff(), void charSwitch(a));
    if ("chRn" === t)
      return ((this.chRn = a), (this.chCf = null), this.charsOpen());
    if ("chRnNo" === t || "chNo" === t)
      return ((this.chRn = this.chCf = null), this.charsOpen());
    if ("chRnOk" === t) {
      const [t, e] = nameCheck($("#chName").value, a);
      return t
        ? (charRename(a, t),
          (this.chRn = null),
          (ui.needs = !0),
          this.charsOpen())
        : s(e);
    }
    if ("chDel" === t) {
      const t = this.chCf;
      if (t && t.id === a)
        if (1 === t.n) t.n = 2;
        else {
          if (a === S.cid && e()) return s("挑戰中無法刪除使用中的角色。");
          this.chCf = null;
          const t = a === S.cid;
          if ((charDelete(a), t)) return void sheetOff();
        }
      else this.chCf = { id: a, n: 1 };
      return this.charsOpen();
    }
  },
  slPickOpen(t, a = this.slMap ?? S.map) {
    const s = slotsOf();
    if (null == t || t >= slateOpen())
      return (
        (this.slPick = this.slMap = this.slSwap = this.slpN = null),
        ($("#sheetBg").hidden = !0),
        ($("#sheet").className = ""),
        void ui.render()
      );
    ((this.slPick = t), (this.slMap = a));
    const e = s.s[t];
    (($("#sheet").className = "sck slp"), ($("#sheetBg").hidden = !1));
    const n = `欄位 <span class="px">${t + 1}</span>`,
      l = null != this.slSwap && slWhere(this.slSwap);
    if (l) {
      const t = S.slt[l[0]].s[l[1]];
      return void ($("#sheet").innerHTML =
        `<h2>更換石板</h2><div class="li">${slateRow(t)}</div>\n        <p class="note" style="margin:0">從「${esc(MAPS[l[0]].n)}」欄位 <span class="px">${l[1] + 1}</span> 取下，放入「${n}」？</p>\n        ${l[0] === S.map ? '<p class="note" style="margin:0;color:var(--bad)">目前所在地圖的怪物等級將隨之改變。</p>' : ""}\n        ${e ? `<p class="note" style="margin:0">「${esc(e.name)}」會回到背包。</p>` : ""}\n        <div class="row"><button class="btn" data-act="slSwapNo">取消</button><span class="spacer"></span><button class="btn primary" data-act="slSwapYes">更換</button></div>`);
    }
    this.slSwap = null;
    const o = slateList().filter((t) => !t.sock),
      r = [],
      i = S.slates.length + r.length,
      c = (this.slpN ||= 60),
      d =
        o
          .slice(0, c)
          .map(
            (t) =>
              `<button class="li" data-act="slIn" data-u="${t.u}">${slateRow(t)}</button>`,
          )
          .join("") +
        (o.length > c
          ? `<button class="li" data-act="slMore">再顯示 <span class="px">${Math.min(60, o.length - c)}</span> 塊</button>`
          : "") +
        (r.length
          ? '<p class="note slUsed">使用中（點選後確認更換）</p>' +
            r
              .map(
                (t) =>
                  `<button class="li inuse" data-act="slUse" data-u="${t.u}">${slateRow(t)}<span class="note nw">${esc(MAPS[slWhere(t.u)[0]].n)}</span></button>`,
              )
              .join("")
          : "");
    $("#sheet").innerHTML =
      `<div class="row"><h2>${e ? "更換石板" : "放入石板"}</h2><span class="spacer"></span><span class="note">${n}</span></div>\n      ${e ? `<div class="li cur">${slateRow(e)}<div class="stack" style="gap:4px">${S.alchOn && canInfuse(e) ? `<button class="btn sm" data-act="slInf" data-u="${e.u}">灌注</button>` : ""}<button class="btn sm" data-act="slOut">取下</button></div></div>` : ""}\n      ${i ? slFilt() : ""}\n      ${d ? `<div class="list srunes slList">${d}</div>` : `<p class="note" style="margin:0">${i ? "沒有符合篩選的石板。" : e ? "沒有其他可更換的石板。" : "沒有可放入的石板。"}</p>`}\n      <div class="row"><button class="btn" data-act="close">關閉</button><span class="spacer"></span><span class="note">背包 <span class="px">${S.slates.length}</span>・使用中 <span class="px">${S.slt.reduce((t, a) => t + (a ? a.s.filter(Boolean).length : 0), 0)}</span></span></div>`;
  },
  ending() {
    const t = Math.max(1, Math.round((Date.now() - S.born) / 864e5));
    (($("#sheet").className = ""),
      ($("#sheet").innerHTML =
        `<h2>終焉</h2><p class="note">${FINAL.n}倒下了。</p><p class="note">裂隙安靜下來，石板上的光也暗了。</p><p class="note">但這片大地上，還有更強的怪物在等你。</p>\n      <dl class="kv box"><dt>稱號</dt><dd>${esc(FINAL.title)}</dd><dt>等級</dt><dd>${S.lvl}</dd><dt>總擊殺</dt><dd>${fmt(S.total)}</dd><dt>冒險天數</dt><dd>${t}</dd></dl>\n      <div class="row" style="margin-top:12px"><span class="spacer"></span><button class="btn primary" data-act="close">繼續冒險</button></div>`),
      ($("#sheetBg").hidden = !1));
  },
  cvURL: (t, a) => SP.icon["cv:" + t] || (SP.icon["cv:" + t] = a.toDataURL()),
  bossCard(t, a, s, e, n, l, o, r) {
    return `<div class="mcard tcard"><span class="mban"><img src="${mapBanner(t, ARENA[a].v, this.banW(), e, 900 + 17 * t.length, [{ t: s, x: 0.5, y: e - 3, sc: 2, boss: 1 }])}" alt="">${n}</span><span class="mfoot">${l}</span>${r ? `<span class="mfoot sub">${r}</span>` : ""}</div>${o || ""}`;
  },
  gdBtn: (t, a) =>
    `<span class="gdc"><button class="btn sm ${a ? "primary" : ""}" data-act="gd" data-i="${t}" ${a ? "" : "disabled"}>${G.guard === t ? "挑戰中" : "挑戰"}</button>${t <= 4 ? `<label class="chk"><input type="checkbox" data-act="agset" data-i="${t}" ${agOn(t) ? "checked" : ""}><span>自動</span></label>` : ""}</span>`,
  guardBoard() {
    if (!slatesUnlocked()) return "";
    const t = canStart(),
      a = (t, a) => `<img class="ficon" src="${this.cvURL(a, t)}" alt="">`,
      s = GUARD.map((s, e) => {
        const n = e ? GUARD[e - 1].mx + 1 : 0;
        return this.bossCard(
          "g" + e,
          "g" + e,
          s.bt,
          40,
          `<span class="mpl mname">${s.n}</span>${S.gd.w[e] ? `<span class="mpl mwin">擊敗 <span class="px">${S.gd.w[e]}</span></span>` : ""}`,
          `${a(SP.gd[e][0], "tk" + e)}<span>印記 <b class="px">${S.gd.t[e]}</b></span>${a(SP.gd[e][1], "fr" + e)}<span>碎片 <b class="px">${S.gd.f[e]}</b></span><span class="spacer"></span>${this.gdBtn(e, S.gd.t[e] > 0 && t)}`,
          "",
          `<span class="gmaps">${MAPS.slice(n, s.mx + 1)
            .map(
              (t, a) =>
                `<span class="gmap"><img src="${mapBanner("mini" + (n + a), t.v, 30, 10, 131 * (n + a) + 7, [])}" alt="">${t.n}</span>`,
            )
            .join("")}</span>`,
        );
      }).join(""),
      e = GUARD.length,
      n =
        S.gd.e || S.gd.f.some((t) => t > 0)
          ? this.bossCard(
              "fin",
              "fin",
              FINAL.bt,
              40,
              `<span class="mpl mname">${FINAL.n}</span>${S.gd.e ? `<span class="mpl mwin">擊敗 <span class="px">${S.gd.e}</span></span>` : ""}`,
              `${GUARD.map((t, s) => `<span class="fneed${S.gd.f[s] > 0 ? " on" : ""}">${a(SP.gd[s][1], "fr" + s)}</span>`).join("")}<span>三種碎片各 1</span><span class="spacer"></span>${this.gdBtn(e, canFinal() && t)}`,
              "",
            )
          : "";
    return `<h3>守護者${helpBtn("guard")}</h3>${s}${n}` + this.towerBoard();
  },
  towerBoard() {
    if (!twOpen()) return "";
    const t = twCheck(S.tw.best),
      a = canStart(),
      s = 10 * Math.floor(S.tw.ms / 10) + 10,
      e = `<button class="btn sm ${a ? "primary" : ""}" data-act="tw" data-i="${twFrom()}" ${a ? "" : "disabled"}>${t > 1 ? "開始" : "從第 1 層"}</button>`,
      n = mapBanner("tw", ARENA.tw.v, this.banW(), 44, 950, [
        { t: "knight", x: 0.2, y: 35 },
        { t: "golem", x: 0.34, y: 40 },
        { t: "imp", x: 0.66, y: 37 },
        { t: "skeleton", x: 0.8, y: 41 },
      ]);
    return (
      `<h3>無盡之塔${helpBtn("tower")}</h3><div class="mcard tcard"><span class="mban"><img src="${n}" alt=""><span class="twfl"><small>最高</small><b class="px">${S.tw.best}</b><small>層</small></span>${G.tw ? `<span class="mpl mname">挑戰中・第 <span class="px">${G.tw.f}</span> 層</span>` : ""}<span class="mpl mlv">里程碑 <span class="px">${s}</span></span></span>\n      <span class="mfoot">${G.tw ? '<span style="color:var(--muted)">挑戰中</span>' : `${t > 1 ? twSel() : ""}${e}`}</span><div class="stack" style="padding:0 8px 6px"><label class="chk"><input type="checkbox" data-act="atset" ${S.set.at ? "checked" : ""}><span>自動挑戰無盡之塔</span></label><label class="chk"><input type="checkbox" data-act="twcset" ${S.set.twc ? "checked" : ""} ${G.tw ? "disabled" : ""}><span>挑戰模式：每層只有 <span class="px">${TW.ct}</span> 秒</span></label></div></div>` +
      this.monBoard()
    );
  },
  monBoard() {
    const t = MONARCH,
      a = canMonarch() && canStart(),
      s = this.cvURL("mk", SP.mk);
    return (
      `<h3>${t.n}${helpBtn("monarch")}</h3>` +
      this.bossCard(
        "mon",
        "mon",
        t.bt,
        48,
        `<span class="mpl mname">${t.n}</span>${S.gd.m ? `<span class="mpl mwin">擊敗 <span class="px">${S.gd.m}</span></span>` : ""}`,
        `${Array.from({ length: t.mk }, (t, a) => `<span class="fneed${a < S.tw.mk ? " on" : ""}"><img class="ficon" src="${s}" alt=""></span>`).join("")}<span>無限印記 <b class="px">${S.tw.mk}/${t.mk}</b></span><span class="spacer"></span>${this.gdBtn(4, a)}`,
        "",
      )
    );
  },
  p_more() {
    const t = this.moreView;
    return t
      ? '<button class="btn sm mback" data-act="menuBack">&lt; 選單</button>' +
          this["m_" + t]()
      : `<div class="menu">${MENU.map(([t, a, s, e]) => (e ? `<a class="mcell" href="${e}" target="_blank" rel="noopener"${"db" === t ? ' data-act="dbv"' : ""}><img src="${iconURL(s)}" alt="">${a}</a>` : `<button class="mcell" data-act="morev" data-v="${t}"><img src="${iconURL(s)}" alt="">${a}${this.mdot[t] ? '<i class="dot"></i>' : ""}</button>`)).join("")}</div>`;
  },
  m_quest() {
    const t = QUESTS[S.q];
    return `<h2>新手引導</h2>\n      ${t ? `<div class="box stack" style="border-color:var(--ember)"><div >${esc(t.d)}</div>\n        ${t.hint ? `<p class="note" style="margin:0">${esc(t.hint)}</p>` : ""}\n        <div class="mini"><i style="width:${Math.min(100, (("level" === t.k ? S.lvl : S.qp) / t.n) * 100)}%"></i></div>\n        <div class="row" style="color:var(--muted)"><span class="px">${"level" === t.k ? S.lvl : S.qp}/${t.n}</span><span class="spacer"></span>獎勵：${((a = t.rw), [a.pot && `藥水 ×${a.pot}`, a.ash && `Zeny ${a.ash}`, ...Object.keys(a.mat || {}).map((t) => `${MATS[t].n} ×${a.mat[t]}`), null != a.gem && `寶石「${SKILLS[CLASS[S.cls].gems[a.gem]].n}」`].filter(Boolean).join("、"))}</div></div>` : '<div class="box"><p class="note" style="margin:0">新手任務已全部完成。接下來可刷地圖、挑戰 Boss，以煉金構築流派。</p></div>'}\n      <h3>已完成</h3><div class="list">${
      QUESTS.slice(0, S.q)
        .map(
          (t) =>
            `<div class="li"><span class="tag" style="color:var(--ok)">DONE</span><div class="grow t">${esc(t.d)}</div></div>`,
        )
        .join("") || '<p class="note">尚無</p>'
    }</div>`;
    var a;
  },
  m_shop() {
    const t = '<img class="ashI" src="' + shopIcon("ash") + '" alt="Zeny">',
      a = (a, s, e, n, l, o, r) =>
        `<div class="ware"><div class="wwell">${s}${l ? `<span class="own px">×${l}</span>` : ""}</div>\n      <div class="wn"><span class="tip" tabindex="0" data-tip="${esc(r)}">${e}</span></div><div class="ws">${n}</div>${((a, s) => `<button class="btn sm ${S.ash >= s ? "primary" : ""}" data-act="buy" data-k="${a}" data-c="${s}" ${S.ash >= s ? "" : "disabled"} aria-label="${s} Zeny購買">${t}<span class="px">${s}</span></button>`)(a, o)}</div>`,
      s = this.shopV || "pot";
    return `<h2 style="display:flex;align-items:center">商人${helpBtn("shop")}<span class="wallet">${t}<b class="px">${S.ash}</b></span></h2>\n      <div class="seg" style="margin-bottom:8px">${[
      ["pot", "補給"],
      ["act", "主動技能"],
      ["sup", "輔助技能"],
    ]
      .map(
        ([t, a]) =>
          `<button data-act="shopV" data-v="${t}" aria-pressed="${t === s}">${a}</button>`,
      )
      .join(
        "",
      )}</div>\n      ${"pot" === s ? "" : `<p class="note" style="margin:0 0 6px">同種寶石可重複購買，皆可放入格子${helpBtn("skill", "act" === s ? 6 : 7)}</p>`}<div class="shopG">${
      "pot" === s
        ? a(
            "pot",
            `<img class="potI" src="${shopIcon("pot")}" alt="">`,
            "生命藥水 ×5",
            "回復 35% 生命",
            S.pot,
            30,
            "每瓶回復 35% 生命",
          )
        : ((e = "act" === s),
          CLASS[S.cls].gems
            .filter((t) => !SKILLS[t].act == !e && (typeof roGemOk !== "function" || roGemOk(t)))
            .map((t) => {
              const s = SKILLS[t];
              return a(
                "gem:" + t,
                ((t) => {
                  const a = gemArt(t, 0, 5),
                    s = Math.max(
                      1,
                      Math.min(3, Math.floor(56 / Math.max(a.W, a.H))),
                    );
                  return `<span class="shape" style="width:${a.W * s}px;height:${a.H * s}px">${a.svg}</span>`;
                })(t),
                s.n,
                s.act ? '<span style="color:var(--ember)">主動</span>' : "輔助",
                S.gems.filter((a) => a.id === t).length,
                200,
                `${tagText(s)}${s.act && s.cd ? `・冷卻 ${s.cd} 秒` : ""}・${s.d}`,
              );
            })
            .join(""))
    }</div>`;
    var e;
  },
  m_cards() {
    return `<h2>怪物卡牌${helpBtn("cards")}</h2>${SEASON.on ? this.ssCard() : ""}<div class="cgrid">${MAPS.slice(
      0,
      MAP_N,
    )
      .map((t, a) => this.cardTile(a))
      .join("")}</div>`;
  },
  cardArtW: () =>
    Math.max(
      60,
      Math.floor(((($("#panel").clientWidth || 360) - 40) / 2 - 22) / 2),
    ),
  cardPips: (t) =>
    `<span class="cpip">${CARD_N.map((a, s) => `<i class="${s < t ? "on" : ""}"></i>`).join("")}</span>`,
  cardNo: (t) => String(t + 1).padStart(2, "0"),
  cardTile(t, a) {
    const s = MAPS[t],
      e = cardTier(t),
      [n, l] = s.card,
      o = cardKills(t),
      r = trailOn(t),
      i = CARD_N[e] || 2e4,
      c = a ? "div" : "button";
    if (t > S.unlocked)
      return `<button class="ccard back" disabled aria-label="未解鎖"><span class="cbk"><b class="px">${this.cardNo(t)}</b><span>LOCK</span></span></button>`;
    const d = this.cardArtW(),
      f = cardArt("m" + t, s.v, d, Math.round(0.8 * d), [
        { t: s.m[0], x: 0.28 },
        { t: s.m[1], x: 0.62, sc: 2, flip: 1 },
      ]);
    return `<${c} class="ccard t${e}${r ? " foil" : ""}${a ? " big" : ""}" ${a ? "" : `data-act="cardOpen" data-i="${t}"`} aria-label="${esc(s.n)}">\n      <span class="chd"><b class="cno px">${this.cardNo(t)}</b><span class="cname">${esc(s.n)}</span>${this.cardPips(e)}</span>\n      <span class="cart"><img src="${f}" alt="" style="width:${2 * d}px"></span>\n      <span class="cbon${e ? "" : " off"}">${esc(AFFIX[n].f(l[Math.max(0, e - 1)]))}</span>\n      <span class="cbar"><i style="width:${r ? 100 : 100 * Math.min(1, o / i)}%"></i></span><span class="ckn px">${r ? fmt(o) : Math.min(o, i) + "/" + i}</span></${c}>`;
  },
  ssCard(t) {
    const a = MAPS[SS_MAP],
      s = ssOpen(),
      e = Math.floor(2.15 * this.cardArtW()),
      n = t ? "div" : "button",
      l = cardArt(
        "ss",
        a.v,
        e,
        Math.round(0.4 * e),
        GODS.map((t, a) => ({
          t: t.bt,
          x: 0.18 + 0.32 * a,
          sc: 2,
          flip: a > 1,
        })),
        1,
      ),
      o = GODS.map((t, a) => {
        const s = godKills(a),
          e = s >= GFX_N[0] ? GFX_N[1] : GFX_N[0];
        return `<span class="cgod" style="--gc:${t.c}"><i class="gsw"></i><b>${t.n}</b><span class="cbar"><i style="width:${100 * Math.min(1, s / e)}%"></i></span><span class="px">${s >= GFX_N[1] ? fmt(s) : s + "/" + e}</span></span>`;
      }).join("");
    return `<${n} class="ccard ss${t ? " big" : ""}" ${t ? "" : 'data-act="godOpen"'} aria-label="活動卡牌">\n      <span class="chd"><b class="cno px">S1</b><span class="cname">活動卡牌・${SEASON.n}</span></span>\n      <span class="cart"><img src="${l}" alt="" style="width:${2 * e}px">${s ? "" : `<span class="mlock">${SEASON.lv} 級開放</span>`}</span>\n      <span class="cgods">${o}</span></${n}>`;
  },
  cdRow: (t, a, s) =>
    `<div class="cdr${t ? " on" : ""}"><span class="px cdn">${a}</span><span class="grow">${s}</span><span class="cdk">${t ? "✓" : ""}</span></div>`,
  cardOpen(t) {
    const a = MAPS[t],
      s = cardTier(t),
      [e, n] = a.card,
      l = trailOn(t);
    (($("#sheet").className = "cdp"),
      ($("#sheetBg").hidden = !1),
      ($("#sheet").innerHTML =
        `${this.cardTile(t, 1)}<div class="row"><span>${a.m.map((t) => MON[t].n).join("・")}</span><span class="spacer"></span><span>擊殺 <span class="px">${cardKills(t)}</span></span></div>\n      <div class="cdl">${CARD_N.map((t, a) => this.cdRow(a < s, t, `第 ${a + 1} 階・${esc(AFFIX[e].f(n[a]))}`)).join("")}${this.cdRow(l, 2e4, `拖尾「${TRAIL[t].n}」`)}</div>\n      <div class="row">${l ? '<button class="btn" data-act="cdFx">前往特效頁使用</button>' : ""}<span class="spacer"></span><button class="btn" data-act="close">關閉</button></div>`));
  },
  godOpen() {
    (($("#sheet").className = "cdp"), ($("#sheetBg").hidden = !1));
    const t = GODS.some((t, a) => hfxOn(a));
    $("#sheet").innerHTML =
      `${this.ssCard(1)}${GODS.map((t, a) => `<div class="axsec" style="--gc:${t.c}"><i class="gsw"></i> ${t.n}・擊殺${MON[t.m].n} <span class="px">${godKills(a)}</span></div>\n      <div class="cdl">${this.cdRow(hfxOn(a), GFX_N[0], `擊中特效「${t.hn}」`)}${this.cdRow(kfxOn(a), GFX_N[1], `擊殺特效「${t.kn}」`)}</div>`).join("")}\n      <div class="row">${t ? '<button class="btn" data-act="cdFx">前往特效頁使用</button>' : ""}<span class="spacer"></span><button class="btn" data-act="close">關閉</button></div>`;
  },
  m_fx() {
    const t = (t, a, s, e, n, l) => {
        const o = (S.set[t] ?? -1) === a;
        return `<button class="fxt${o ? " on" : ""}${n ? " locked" : ""}" data-act="fxPick" data-k="${t}" data-v="${a}" ${n && "trail" === t ? "disabled" : ""}><span class="fxsw">${s}</span><span class="fxn">${e}</span><span class="fxs${n ? "" : " px"}">${o ? "使用中" : l}</span></button>`;
      },
      a = (a) =>
        GODS.map((s, e) => {
          const n = GFX_N["kfx" === a ? 1 : 0],
            l = godKills(e),
            o = l >= n;
          return t(
            a,
            e,
            ((t) => `<img src="${SP.ssf[t].toDataURL()}" alt="">`)(e),
            "kfx" === a ? s.kn : s.hn,
            !o,
            o ? "預覽" : `${l}/${n}`,
          );
        }).join("");
    return `<h2>特效${helpBtn("fx")}</h2><h3>拖尾</h3><div class="fxg">${TRAIL.map((a, s) => t("trail", s, ((t) => t.c.map((t) => `<i style="background:${t}"></i>`).join(""))(a), a.n, !trailOn(s), trailOn(s) ? "使用" : MAPS[s].n)).join("")}</div>\n      ${SEASON.on || GODS.some((t, a) => hfxOn(a)) ? `<h3>擊中特效</h3><div class="fxg">${a("hfx")}</div><h3>擊殺特效</h3><div class="fxg">${a("kfx")}</div>` : ""}`;
  },
  fxOpen(t, a) {
    const s = GODS[a],
      e = "kfx" === t,
      n = GFX_N[e ? 1 : 0],
      l = godKills(a),
      o = l >= n,
      r = (S.set[t] ?? -1) === a;
    (($("#sheet").className = "cdp"),
      ($("#sheetBg").hidden = !1),
      ($("#sheet").innerHTML =
        `<h2 class="cfh">${e ? "擊殺" : "擊中"}特效「${e ? s.kn : s.hn}」</h2><canvas id="gfPrev" class="gfpv" width="96" height="48"></canvas>\n      <div class="row"><span>${s.n}・擊殺${MON[s.m].n}</span><span class="spacer"></span><span class="px">${o ? l : l + "/" + n}</span></div>\n      <div class="row">${o ? `<button class="btn${r ? "" : " primary"}" data-act="cdUse" data-k="${t}" data-v="${a}">${r ? "取下" : "使用"}</button>` : `<span class="note" style="margin:0">擊殺 ${n} 隻解鎖</span>`}<span class="spacer"></span><button class="btn" data-act="close">關閉</button></div>`),
      gfPrev($("#gfPrev"), a, e ? "k" : "h"));
  },
  cdAct(t) {
    const a = t.dataset.act;
    if ("cdUse" === a) {
      const a = t.dataset.k,
        s = +t.dataset.v;
      return (
        (S.set[a] = S.set[a] === s ? -1 : s),
        markDirty(),
        this.fxOpen(a, s)
      );
    }
    "cdFx" === a &&
      (($("#sheetBg").hidden = !0),
      ($("#sheet").className = ""),
      (this.moreView = "fx"),
      this.menuDot("fx", 0),
      this.render(),
      ($("#panel").scrollTop = 0),
      autoHelp("fx"));
  },
  m_rank() {
    const t = LB.me,
      a = lbOn()
        ? LB.err || (LB.top ? "" : "讀取中…")
        : "離線版本無法連線排行榜。",
      s = twOpen()
        ? `最高 <span class="px">${S.tw.best}</span> 層・${t && t.floor < S.tw.best ? `榜上 <span class="px">${t.floor}</span> 層・` : ""}${t ? `${LB.v ? "職業" : ""}第 <span class="px">${t.r}</span> 名` : LB.v && LB.v !== S.cls ? `不在${CLASS[LB.v].n}榜` : S.tw.best && S.lvl >= LB_LV ? "上傳中" : "尚未上榜"}`
        : `擊敗${FINAL.n}後開放無盡之塔`,
      e = (LB.top || [])
        .map(
          (a) =>
            `<div class="li${a.p ? " snRow" : ""}"${a.p ? ` data-act="lbSnap" data-r="${a.r}" role="button" tabindex="0"` : ""}${t && a.r === t.r && a.name === t.name ? ' style="color:var(--ember)"' : ""}><span class="px" style="width:24px">${a.r}</span>\n      <div class="grow t">${esc(a.name)}${a.p ? ` <span class="snMk"${a.h ? ' style="color:var(--muted)"' : ""}>▸</span>` : ""}</div><span style="color:var(--muted)">${esc(brName(a.cls, a.br))} <span class="px">LV${a.lv}</span></span><span style="width:64px;text-align:right">第 <span class="px">${a.floor}</span> 層</span></div>`,
        )
        .join("");
    return `<h2>無盡之塔排行${helpBtn("rank")}</h2>\n      <div class="box stack">\n        <div class="row"><span>角色 <b>${esc(S.name || "未命名")}</b></span><span class="spacer"></span><span style="color:var(--muted)">${esc(brName(S.cls, S.tal.asc))} <span class="px">LV${S.lvl}</span></span></div>\n        <div class="row" style="color:var(--muted)"><span>${s}</span><span class="spacer"></span><button class="btn sm" data-act="lbRef" ${LB.busy ? "disabled" : ""}>重新整理</button></div>\n        <label class="chk"><input type="checkbox" data-act="lbHide" ${S.lb.hd ? "checked" : ""}>不公開我的構築快照</label>\n        ${a ? `<p class="note" style="margin:0">${esc(a)}</p>` : ""}\n      </div>\n      <div class="seg" style="margin:12px 0 0">${[["", "全部"], ...Object.keys(CLASS).map((t) => [t, CLASS[t].n])].map(([t, a]) => `<button data-act="lbV" data-v="${t}" aria-pressed="${LB.v === t}">${a}</button>`).join("")}</div>\n      <h3>${LB.v ? CLASS[LB.v].n + " " : ""}前 <span class="px">${LB_TOP}</span> 名</h3><div class="list">${e || (LB.top ? '<p class="note">目前尚無紀錄。</p>' : "")}</div>`;
  },
  snapOpen(t, a = this.snapSel) {
    ((this.snapX = t), (this.snapSel = a), lbSnapGet(t));
    const s = LB.snap[t.p],
      e =
        '<div class="row" style="margin-top:12px"><span class="spacer"></span><button class="btn" data-act="close">關閉</button></div>';
    (($("#sheet").className = "snp wide"), ($("#sheetBg").hidden = !1));
    const n = `<h2>${esc(t.name)}</h2><div class="row" style="color:var(--muted)"><span>${esc(brName(t.cls, t.br))} <span class="px">LV${t.lv}</span></span><span class="spacer"></span><span>第 <span class="px">${t.floor}</span> 層・第 <span class="px">${t.r}</span> 名</span></div>`;
    if (!s || 1 === s)
      return void ($("#sheet").innerHTML =
        n +
        `<p class="note">${1 === s ? "讀取中…" : "無法讀取構築快照。"}</p>` +
        e);
    const l = s.s,
      o = [S.cls, S.lvl];
    let r;
    ((S.cls = l.cls), (S.lvl = l.lv));
    try {
      const t = l.eq.find((t) => t.u === a) || l.eq[0],
        e = new Date(s.ts),
        o = SLOTS.map((a) => {
          const s = l.eq.find((t) => t.slot === a);
          return s
            ? cellHtml(s, "snIt", s === t).replace(
                '<span class="kp"></span>',
                "",
              )
            : `<div class="cell snEmpty" aria-label="${SLOT_NAME[a]}（無）"></div>`;
        }).join(""),
        i = new Set(UNLOCK_ORDER.slice(0, l.oc));
      let c = "";
      for (let t = 0; t < 6; t++)
        for (let a = 0; a < 6; a++)
          c += `<button class="${i.has(a + "," + t) ? "open" : "lock"}" tabindex="-1" aria-hidden="true"></button>`;
      for (const t of l.gm) c += gemOverlay(t, !1);
      const d = ascBranch(l.cls, l.br),
        f = d ? d.t.flat().filter((t) => l.tp.includes(t.k)) : [];
      ((r =
        n +
        `<div class="row" style="color:var(--muted)"><span>快照 <span class="px">${e.getMonth() + 1}/${e.getDate()}</span></span><span class="spacer"></span><span>生命 <span class="px">${fmt(l.hp || 0)}</span>${l.dps ? `・塔內 DPS <span class="px">${fmt(l.dps)}</span>` : ""}</span></div>\n        <div class="seg" style="margin:8px 0 0">${["構築", "屬性"].map((t, a) => `<button data-act="snPg" data-v="${a}" aria-pressed="${(this.snapPg || 0) === a}">${t}</button>`).join("")}</div>`),
        this.snapPg
          ? (r += l.ps
              ? psRows(l.ps)
              : '<p class="note">尚無屬性資料。</p><p class="note" style="margin:0">此玩家下次刷新紀錄時會一併上傳。</p>')
          : (r += `\n        <h3>裝備</h3><div class="snEq">${o}</div>\n        ${t ? `<div class="box snIt">${this.itemHead(t)}${this.statHtml(t)}</div>` : '<p class="note">沒有裝備。</p>'}\n        <h3>技能拼圖</h3><div class="gridWrap"><div class="sgrid snG">${c}</div></div>\n        <h3>轉職天賦</h3>${f.length ? `<div class="snTal">${f.map((t) => `<span class="snT">${esc(t.n)}</span>`).join("")}</div>` : '<p class="note">尚未習得天賦。</p>'}`));
    } catch (t) {
      r = n + '<p class="note">此快照無法顯示。</p>';
    } finally {
      [S.cls, S.lvl] = o;
    }
    const i = $("#sheet").scrollTop;
    (($("#sheet").innerHTML = r + e), ($("#sheet").scrollTop = i));
  },
  m_stash() {
    ("runes" !== this.stV && "slates" !== this.stV) || (this.stV = "bag");
    const t = STH || stLoad(),
      a = (this.stV ||= "bag"),
      s = !!this.stMine,
      e = (this.stN ||= 60),
      n = `<h2>共用倉庫${helpBtn("stash")}</h2><p class="note">所有角色共用・已存放 <span class="px">${t.it.length}/500</span></p>\n      <div class="seg" style="margin-bottom:8px">${[
        ["bag", "裝備"],
        ["gems", "寶石"],
      ]
        .map(
          ([t, s]) =>
            `<button data-act="stv" data-v="${t}" aria-pressed="${a === t}">${s}</button>`,
        )
        .join(
          "",
        )}</div><div class="seg" style="margin-bottom:8px"><button data-act="stm" data-v="" aria-pressed="${!s}">倉庫</button><button data-act="stm" data-v="1" aria-pressed="${s}">身上</button></div>`,
      l = t.it.length >= 500,
      o = (t, a) =>
        `<button class="btn sm" data-act="stIn" data-k="${t}" data-u="${a}" ${l ? "disabled" : ""}>存入</button>`,
      r = (t) =>
        stCan(t)
          ? `<button class="btn sm primary" data-act="stOut" data-s="${t.s}">取出</button>`
          : `<button class="btn sm" disabled>限${CLASS[t.o.wc].n}</button>`,
      i = (t) =>
        t.length > e
          ? `<div class="row"><button class="btn sm" data-act="stMore" style="flex:1">顯示更多（其餘 <span class="px">${t.length - e}</span>）</button></div>`
          : "",
      c = t.it.filter((t) => t.k === a),
      d = ((this.stF ||= {})[a] ||= {}),
      f = (t) => (s ? t : t.o),
      p = (t, a, s) => selHtml(t, a, d[t] ?? a[0][0], s, "stf"),
      u = this.stMs,
      h = !!u,
      m = (t) => (s ? t.u : t.s),
      A = `<span class="spacer"></span><button class="btn sm" data-act="stMs" aria-pressed="${h}">多選</button>`,
      g = (t, a, s) =>
        `<div class="row acnt"><span class="note" style="margin:0">${t < a ? `顯示 <span class="px">${t}/${a}</span> ${s}` : `<span class="px">${t}</span> ${s}`}</span>${A}</div>`,
      v = (a) => {
        this.stAll = a.filter((t) => s || stCan(t)).map(m);
        const e = u.size,
          n = s && t.it.length + e > 500;
        return `<div class="row" style="margin:0 0 8px"><span class="note" style="margin:0">已選 <span class="px">${e}</span></span><span class="spacer"></span><button class="btn sm" data-act="stMsA">全選</button><button class="btn sm" data-act="stMsN" ${e ? "" : "disabled"}>清除</button><button class="btn sm primary" data-act="stMsGo" ${e && !n ? "" : "disabled"}>${s ? "存入" : "取出"} <span class="px">${e}</span></button></div>`;
      },
      b = ST_KR[a],
      k = (b && d.kf) || "",
      x = "cust" === k && stFg(b),
      y = "bag" === a ? S.set.keep : "slates" === a ? slSet().skeep : rnKeep(),
      w = (t) => {
        const s = f,
          e = t
            .filter((t) =>
              "bag" === a
                ? (!d.slot || s(t).slot === d.slot) && rarOk(s(t), d.r ?? -9)
                : "runes" === a
                  ? rSlotOk(s(t), d.rsl || "") && rTierOk(s(t), d.rt ?? 9)
                  : "slates" === a
                    ? ((d.b ?? -1) < 0 || s(t).b === d.b) &&
                      slRarOk(s(t), d.r ?? -9)
                    : !(
                        (d.c && (SKILLS[s(t).id].cls || "any") !== d.c) ||
                        (d.a && !SKILLS[s(t).id].act != ("sup" === d.a)) ||
                        (d.id && s(t).id !== d.id)
                      ),
            )
            .filter((t) => {
              return (
                (a = s(t)),
                "lk" === k
                  ? !!a.lk
                  : "nolk" === k
                    ? !a.lk
                    : "keep" === k
                      ? keepMatch(a, y)
                      : "nokeep" === k
                        ? !keepMatch(a, y)
                        : "cust" !== k ||
                          !x.c.length ||
                          keepGroup(a, { on: 1, c: x.c })
              );
              var a;
            })
            .reverse(),
          n = d.s || "new";
        return "slates" === a
          ? ("new" !== n && e.sort((t, a) => SL_KEY[n](s(a)) - SL_KEY[n](s(t))),
            e)
          : ("rar" === n
              ? e.sort((t, a) => byRar(s(t), s(a)))
              : "lvl" === n
                ? e.sort((t, a) => s(a).ilvl - s(t).ilvl)
                : "slot" === n
                  ? e.sort(
                      (t, a) =>
                        SLOTS.indexOf(s(t).slot) - SLOTS.indexOf(s(a).slot) ||
                        byRar(s(t), s(a)),
                    )
                  : "tier" === n
                    ? e.sort((t, a) => runeByTier(s(t), s(a)))
                    : "type" === n &&
                      e.sort(
                        (t, a) =>
                          runeKind(s(t)).localeCompare(runeKind(s(a))) ||
                          runeQ(s(a)) - runeQ(s(t)),
                      ),
            "gems" === a &&
              e.sort(
                (t, a) =>
                  gemShape(s(t)).length - gemShape(s(a)).length ||
                  SKILLS[s(t).id].n.localeCompare(SKILLS[s(a).id].n),
              ),
            e);
      },
      $ = {
        bag: BAG_SORT.filter(([t]) =>
          ["new", "rar", "lvl", "slot"].includes(t),
        ),
        runes: [
          RUNE_SORT.find(([t]) => "grp" === t),
          ...RUNE_SORT.filter(([t]) => "grp" !== t),
        ],
        slates: SL_SORT,
      }[a],
      M = `<div class="row filt">${$ ? p("s", $, "排序") : ""}${{
        bag: () =>
          p(
            "slot",
            [["", "全部部位"], ...SLOTS.map((t) => [t, SLOT_NAME[t]])],
            "部位篩選",
          ) + p("r", RAR_F, "稀有度篩選"),
        runes: () =>
          p(
            "rsl",
            [
              ["", "全部部位"],
              ...SLOTS.map((t) => [t, SLOT_NAME[t]]),
              ["slate", SLOT_NAME.slate],
            ],
            "可用部位篩選",
          ) + p("rt", RUNE_TIER_F, "階級篩選"),
        slates: () =>
          p(
            "b",
            [[-1, "全部種類"], ...SLATE.map((t, a) => [a, t.n])],
            "種類篩選",
          ) + p("r", SL_RAR_F, "稀有度篩選"),
        gems: () =>
          p(
            "c",
            [
              ["", "全部職業"],
              ...Object.keys(CLASS).map((t) => [t, CLASS[t].n]),
              ["any", "通用"],
            ],
            "職業篩選",
          ) +
          p(
            "a",
            [
              ["", "主動與輔助"],
              ["act", "主動"],
              ["sup", "輔助"],
            ],
            "種類篩選",
          ) +
          p(
            "id",
            [
              ["", "全部技能"],
              ...[
                ...new Set([
                  ...(s
                    ? S.gems.filter((t) => t.x < 0)
                    : c.map((t) => t.o)
                  ).map((t) => t.id),
                  ...(d.id ? [d.id] : []),
                ]),
              ]
                .sort((t, a) => SKILLS[t].n.localeCompare(SKILLS[a].n))
                .map((t) => [t, SKILLS[t].n]),
            ],
            "技能篩選",
          ),
      }[
        a
      ]()}${b ? p("kf", "runes" === a ? KF_SEL.slice(0, 4) : KF_SEL, "規則篩選") : ""}</div>${"cust" === k ? filtBox(b) : ""}`;
    if ("bag" === a) {
      const t = s ? S.bag : c,
        a = w(t),
        l = (t) =>
          s
            ? cellHtml(t, "stpick", t.u === this.stSel)
            : cellHtml(
                Object.assign({}, t.o, { u: t.s }),
                "stpick",
                t.s === this.stSel,
              ),
        d = (t) =>
          h
            ? (s
                ? cellHtml(t, "stmp", u.has(t.u))
                : cellHtml(
                    Object.assign({}, t.o, { u: t.s }),
                    "stmp",
                    u.has(t.s),
                  )
              )
                .replace(" sel ", " ms ")
                .replace(
                  /<\/button>$/,
                  u.has(m(t)) ? '<i class="ck"></i></button>' : "</button>",
                )
            : l(t),
        f = s
          ? S.bag.find((t) => t.u === this.stSel)
          : c.find((t) => t.s === this.stSel),
        p = f && (s ? f : f.o),
        A = p
          ? this.itemHead(p) +
            `<div class="acts"><div class="ar">${s ? o("bag", p.u) : r(f)}</div></div>` +
            this.statHtml(p)
          : '<p class="empty-note">點選左側裝備<br>查看詳細資訊</p>';
      return (
        n +
        M +
        g(a.length, t.length, "件") +
        (h ? v(a) : "") +
        `<div class="split"><div><h3 style="margin-top:0">${s ? "背包" : "倉庫"}</h3>${a.length ? `<div class="grid">${a.slice(0, e).map(d).join("")}</div>${i(a)}` : `<p class="empty-note">${t.length ? "沒有符合篩選的裝備。" : s ? "背包是空的。" : "倉庫沒有裝備。"}</p>`}</div><aside class="detail" aria-live="polite">${A}</aside></div>`
      );
    }
    const B = {
        runes: (t, a) =>
          `<img src="${itemIcon(t)}" alt="" style="width:32px;height:32px;image-rendering:pixelated"><div class="grow"><div class="t">${runeTag(t)} ${esc(runeDesc(t))}${a > 1 ? ` <span class="px gcnt">×${a}</span>` : ""}</div></div>`,
        slates: slateRow,
        gems: (t, a) => {
          const s = gemArt(t.id, 0, 4, t.sh, t.sx);
          return `<span style="width:40px;flex:none;display:flex;justify-content:center"><span class="shape" style="display:block;width:${2 * s.W}px;height:${2 * s.H}px">${s.svg}</span></span><div class="grow"><div class="t">${esc(SKILLS[t.id].n)}${t.sx ? "（穿梭）" : t.sh ? "（變異）" : ""}${a > 1 ? ` <span class="px gcnt">×${a}</span>` : ""}</div><div class="s">${SKILLS[t.id].cls ? CLASS[SKILLS[t.id].cls].n : "通用"}・${SKILLS[t.id].act ? "主動" : "輔助"}</div></div>`;
        },
      }[a],
      C = s ? S[a].filter((t) => !("gems" === a && t.x >= 0)) : c,
      G = w(C),
      R = { runes: "符文石", slates: "石板", gems: "未放置的寶石" }[a],
      T = "gems" === a ? gemStacks(G, (t) => gemStk(f(t))) : G.map((t) => [t]),
      L = (t) => {
        const e = t[t.length - 1],
          n = t.filter((t) => s || stCan(t)).map(m),
          l = h && n.length && n.every((t) => u.has(t));
        return `<div class="li">${B(f(e), t.length)}${h ? (n.length ? `<button class="btn sm${l ? " primary" : ""}" data-act="stmr" data-v="${n.join(",")}" aria-pressed="${l}">${l ? "已選" : "選取"}</button>` : r(e)) : s ? o(a, e.u) : r(e)}</div>`;
      },
      O = "runes" === a && "grp" === (d.s || "grp") && G.length;
    return (
      n +
      M +
      g(G.length, C.length, { runes: "顆", slates: "塊", gems: "顆" }[a]) +
      (h ? v(G) : "") +
      (O
        ? `<div class="list">${runeGrp(
            G.map((t) => Object.assign({}, f(t), { _x: t })),
            (this.stOpen ||= new Set()),
            "stg",
            (t, a) => L(a.map((t) => t._x)),
            1,
          )}</div>`
        : T.length
          ? `<div class="list">${T.slice(0, e).map(L).join("")}</div>${i(T)}`
          : `<p class="empty-note">${C.length ? `沒有符合篩選的${{ runes: "符文石", slates: "石板", gems: "寶石" }[a]}。` : `${s ? "身上" : "倉庫"}沒有${R}。`}</p>`)
    );
  },
  m_log: () => (
    (S.logV = logTop()),
    `<h2>更新日誌</h2><div class="list">${CHANGELOG.map((t) => `<div class="li"><div class="grow"><div class="t"><span class="px">${t.v || logTop()}</span> <span style="color:var(--muted)">${t.d}</span></div>\n      ${t.l.map((t) => `<div class="s">・${esc(t)}</div>`).join("")}</div></div>`).join("")}</div>`
  ),
  m_set: () =>
    `<h2>設定</h2>\n      <div class="box stack">\n        <dl class="kv"><dt>存檔</dt><dd >${gcOn() || cloud.ok ? "本機＋雲端" : "本機瀏覽器（每 15 秒）"}</dd>\n        <dt>總擊殺</dt><dd>${S.total}</dd><dt>每分鐘擊殺</dt><dd>${S.kpm ? S.kpm.toFixed(1) : "-"}</dd></dl>\n        <div class="row"><span style="font-size:12px;color:var(--muted)">版本 <span class="px">${"string" == typeof BUILD_VER ? BUILD_VER : "DEV"}</span></span><span class="spacer"></span>\n          <button class="btn sm ${upd.has ? "primary" : ""}" data-act="reload">${upd.has ? `有新版本${upd.ver ? " " + upd.ver : ""}！點這裡更新` : "重新整理"}</button></div>\n        <div class="row"><span style="font-size:12px;color:var(--muted)">${isStandalone() ? "已從主畫面開啟" : "加入手機主畫面"}</span><span class="spacer"></span>\n          ${isStandalone() ? "" : pwa.ev ? '<button class="btn sm primary" data-act="install">安裝</button>' : '<button class="btn sm" data-act="help" data-k="ios">iPhone</button><button class="btn sm" data-act="help" data-k="android">Android</button>'}</div>\n      </div>\n      <h3>存檔備份${helpBtn("save")}</h3>\n      <div class="box stack">${gcOn() ? `<div class="row"><span>雲端存檔</span><span class="spacer"></span><span style="color:var(--muted)">${GC.up ? `<span class="px">${gcTime(GC.up)}</span> 已上傳` : "尚未上傳"}</span><button class="btn sm" data-act="gcUp">立即上傳</button></div>\n        ${GC.err ? `<p class="note" style="margin:0;color:var(--bad)">${GC.err}</p>` : ""}<div class="row"><span>Google 帳號</span><span class="spacer"></span><button class="btn sm" data-act="gcOff">登出</button><button class="btn sm" data-act="gcDel">刪除雲端存檔</button></div>` : '<div class="row"><span>雲端存檔</span><span class="spacer"></span><button class="btn sm primary" data-act="gcIn">綁定 Google</button></div>'}</div>\n      <h3>戰鬥${helpBtn("ab")}</h3>\n      <div class="box stack"><label class="chk"><input type="checkbox" data-act="abset" ${S.set.ab ? "checked" : ""}><span>自動挑戰 Boss</span></label>\n        <label for="abHp" style="font-size:12px">生命在 <b class="px" id="abHpL">${S.set.abh || 80}%</b> 以上才自動挑戰</label>\n        <input type="range" id="abHp" min="10" max="100" step="5" value="${S.set.abh || 80}" style="--v:${(((S.set.abh || 80) - 10) / 90) * 100}%"></div>\n      <h3>確認視窗</h3>\n      <div class="box stack"><label class="chk"><input type="checkbox" data-act="nocf" ${S.set.nocf ? "checked" : ""}><span>煉金、分解不需二次確認</span></label></div>\n      <h3>畫面</h3>\n      <div class="box stack"><label class="chk"><input type="checkbox" data-act="nonum" ${S.set.nonum ? "checked" : ""}><span>隱藏傷害數字</span></label><label class="chk"><input type="checkbox" data-act="noshk" ${S.set.noshk ? "checked" : ""}><span>關閉畫面晃動</span></label><label class="chk"><input type="checkbox" data-act="nolt" ${S.set.nolt ? "checked" : ""}><span>隱藏掉落訊息</span></label><label class="chk"><input type="checkbox" data-act="nodot" ${S.set.nodot ? "checked" : ""}><span>隱藏紅點通知</span></label><label class="chk"><input type="checkbox" data-act="slnd" ${S.set.slnd ? "checked" : ""}><span>石板詞綴不因角色靠近而淡出</span></label><div class="row"><span>純畫面模式（僅顯示戰鬥畫面）</span><span class="spacer"></span><button class="btn sm" data-act="zen">開啟</button></div><div class="row"><span>摸魚模式（終端機畫面）</span><span class="spacer"></span><button class="btn sm" data-act="term">開啟</button></div></div>\n      <h3>聲音</h3>\n      <div class="box stack">${[
      ["mus", "音樂"],
      ["sfx", "音效"],
    ]
      .map(([t, a]) => {
        const s = Math.round(100 * auVol(t));
        return `\n        <label for="vol_${t}" style="font-size:12px">${a} <b class="px" id="vol_${t}L">${s ? s + "%" : "關閉"}</b></label>\n        <input type="range" id="vol_${t}" data-vol="${t}" min="0" max="100" step="5" value="${s}" style="--v:${s}%">`;
      })
      .join(
        "",
      )}\n      </div>\n      <h3>刪除角色</h3>\n      <button class="btn danger" data-act="reset">刪除這個角色</button>`,
});
const CRAFT_N = [1, 10, 100, 1e3, 1e4],
  lvCol = (t) => (MATS[t].l >= 3 ? "--r3" : MATS[t].l >= 2 ? "--rs" : "--text");
function autoMergeP() {
  S.set.amp &&
    doMerge(
      MERGE.findIndex((t) => "p1" === t[0]),
      1e6,
    );
}
function doMerge(t, a) {
  const [s, e] = MERGE[t],
    n = mergeAsh(e),
    l = Math.min(a, Math.floor((S.mat[s] || 0) / 4), Math.floor(S.ash / n));
  return l < 1
    ? 0
    : ((S.mat[s] -= 4 * l),
      (S.mat[e] = (S.mat[e] || 0) + l),
      (S.ash -= l * n),
      l);
}
function mergeDo(t, a) {
  const s = {};
  for (const e of t < 0 ? MERGE.keys() : [t]) {
    const t = doMerge(e, a);
    t && (s[MERGE[e][1]] = (s[MERGE[e][1]] || 0) + t);
  }
  ((ui.mergeRes = { got: s, t: performance.now() }),
    Object.keys(s).length && sfx("mat"),
    markDirty());
}
const rngItem = (t, a, s) => {
    const e = (t.rn ||= {});
    return (
      (e[a] = (e[a] || 0) + 1),
      seeded(`${S.cid}|${t.u}|${a}|${e[a]}`, s)
    );
  },
  rngChar = (t, a) => (
    (S.rc[t] = (S.rc[t] || 0) + 1),
    seeded(`${S.cid}|${t}|${S.rc[t]}`, a)
  );
function doCraft(t, a = 1) {
  const s = CRAFT[t];
  if (!s || !S.alchOn) return;
  const e = s.c(S.lvl);
  if (S.ash < e * a) return;
  const n = {};
  for (let l = 0; l < a; l++) {
    const a = t + rngChar("m" + t, () => matLv(S.lvl, s.max));
    ((S.ash -= e), (S.mat[a] = (S.mat[a] || 0) + 1), (n[a] = (n[a] || 0) + 1));
  }
  const l = ui.craftRes,
    o = Object.keys(n)[0];
  ((ui.craftRes =
    a > 1
      ? { f: t, got: n, t: performance.now() }
      : {
          f: t,
          k: o,
          n: l && l.k === o && !l.got ? l.n + 1 : 1,
          t: performance.now(),
        }),
    sfx("mat"),
    markDirty());
}
function xStone() {
  const t = ui.alchOpt;
  return (
    S.mat[t.x] > 0 ||
      (t.x = ["x1", "x2", "x3", "x4"].find((t) => S.mat[t] > 0) || 0),
    t.x || null
  );
}
function xtrOne(t, a, s, e) {
  return rngItem(t, "x", () => {
    const n = MATS[a].l,
      l = mirUse(t),
      o = l && uqKey(t) && !t.my;
    (S.mat[a]--, (S.ash -= ALCH_ASH.x(t.ilvl)));
    const r = [],
      i = [];
    if ((l && i.push("奇蹟生效"), o || 100 * RAND() < XTR.ok[n]))
      if (o || (uqKey(t) && !t.my && 100 * RAND() < XTR.uq[n])) {
        {
          const a = uqKeys(t);
          r.push({
            u: uid(),
            rune: 1,
            uq: a.length > 1 ? a[ri(0, a.length - 1)] : a[0],
          });
        }
        i.push("取出獨特效果！");
      } else {
        const a = pickW(t.af, (t) => AFFIX[t.a].w),
          s = a.t >= 1 && ((l && 4 === n) || 100 * RAND() < XTR.up[n]),
          e = s ? a.t - 1 : a.t,
          [o, c] = tierRange(a.a, a.t),
          d = c > o ? (a.v - o) / (c - o) : 1,
          [f, p] = tierRange(a.a, e);
        (r.push({
          u: uid(),
          rune: 1,
          a: a.a,
          t: e,
          v: Math.round(f + d * (p - f)),
        }),
          s && i.push(`升階 T${a.t}→T${e}！`));
      }
    for (const t of r)
      rSalvOk(t, rAutoK(t))
        ? ((S.ash += runeAsh(t)), i.push("自動分解"))
        : S.runes.push(t);
    const c = !!s && (S.mat[s]--, 100 * RAND() < PROT_KEEP[s]);
    return (c || e.splice(e.indexOf(t), 1), { got: r, notes: i, keep: c });
  });
}
function doAlch() {
  const t = S.bag.some((t) => t.u === ui.alchSel) ? S.bag : S.slates,
    a = t.find((t) => t.u === ui.alchSel);
  if (!a || !canAlch(a) || a.lk) return;
  const s = ui.alchOpt,
    e = xStone();
  if (!e || S.runes.length >= 5e3 || S.ash < ALCH_ASH.x(a.ilvl)) return;
  !s.p || S.mat[s.p] > 0 || (s.p = 0);
  const n = itemIcon(a),
    l = rarColor(a),
    o = xtrOne(a, e, s.p, t);
  (s.p && o.notes.push(o.keep ? "保護石生效，裝備保留" : "保護石失效"),
    o.keep || (ui.alchSel = null),
    !s.p || S.mat[s.p] > 0 || (s.p = 0),
    (ui.alchRes = {
      k: "x",
      icon: n,
      rc: l,
      got: o.got,
      keep: o.keep,
      notes: o.notes,
      msg: o.got.length ? "萃取成功" : "萃取失敗",
    }),
    markDirty());
}
const xrSet = () => (S.set.xr ||= []),
  sxrSet = () => (S.set.sxr ||= []),
  bxL = () => (ui.bxSl ? S.slates : S.bag),
  bxR = () => (ui.bxSl ? sxrSet() : xrSet()),
  xtrSkip = (t) => !!t.lk || !!t.my || !!t.mir,
  xtrBulk = () =>
    bxL().filter((t) => canAlch(t) && !t.uqx && keepMatch(t, bxR()));
function xtrPlan(t, a = ui.bxM ? mselList().filter(canAlch) : xtrBulk()) {
  const s = a.filter((t) => !xtrSkip(t)),
    e = [],
    n = !!ui.alchOpt.bm && S.mat.m1 > 0;
  let l = S.ash,
    o = 0,
    r = 0;
  for (const a of s) {
    if (!t || e.length >= S.mat[t] || S.runes.length + e.length >= 5e3) break;
    const s = n && canMir(a);
    if (s && r >= S.mat.m1) break;
    const i = ALCH_ASH.x(a.ilvl) + (s ? ALCH_ASH.m(a.ilvl) : 0);
    l < i || ((l -= i), (o += i), (r += s ? 1 : 0), e.push(a));
  }
  return { all: s, skip: a.length - s.length, items: e, cost: o, mir: r };
}
function doBulkXtr() {
  const t = xStone(),
    a = xtrPlan(t),
    s = ui.alchOpt;
  if (!t || !a.items.length) return;
  const e = [],
    n = [],
    l = a.items[0],
    o = itemIcon(l),
    r = rarColor(l);
  let i = 0,
    c = 0,
    d = 0;
  for (const l of a.items) {
    (!s.p || S.mat[s.p] > 0 || (s.p = 0),
      s.p && d++,
      s.bm &&
        S.mat.m1 > 0 &&
        canMir(l) &&
        (S.mat.m1--, (S.ash -= ALCH_ASH.m(l.ilvl)), (l.mir = 1)));
    const a = xtrOne(l, t, s.p, bxL());
    (e.push(...a.got), n.push(...a.notes), a.got.length || i++, a.keep && c++);
  }
  (!s.p || S.mat[s.p] > 0 || (s.p = 0),
    S.mat.m1 > 0 || (s.bm = 0),
    (ui.alchSel = null));
  const f = a.items.length;
  ((ui.alchRes = {
    k: "x",
    bulk: { n: f, fail: i, kept: c, pu: d },
    icon: o,
    rc: r,
    got: e,
    keep: !1,
    notes: n,
    msg: `批次萃取 ${f} ${ui.bxSl ? "塊" : "件"}`,
  }),
    markDirty());
}
const uqInfFit = (t, a) =>
    !t.sl &&
    UNIQUE[a.uq] &&
    UNIQUE[a.uq].slot === t.slot &&
    !uqKeys(t).includes(a.uq),
  uqInfOk = (t, a) => S.mat.i4 > 0 && uqInfFit(t, a),
  infStone = (t) =>
    ["i1", "i2", "i3"].find(
      (a) => S.mat[a] > 0 && (!t?.uq || MATS[a].l >= 2),
    ) || null;
function doInfuse() {
  const t = [
      ...S.bag,
      ...SLOTS.map((t) => S.equip[t]),
      ...S.slates,
      ...slatesPlaced(),
    ].find((t) => t && t.u === ui.alchSel),
    a = S.runes.find((t) => t.u === ui.infR),
    s = infStone(t),
    e = a && a.uq,
    n = e ? "i4" : s;
  if (
    t &&
    a &&
    !e &&
    null != AFFIX[a.a].dv &&
    t.af.some((t) => null != AFFIX[t.a].dv)
  )
    return void toast("一件裝備最多一條神眷詞綴", "bad");
  if (
    !t ||
    !canInfuse(t) ||
    !a ||
    isStaged(a.u) ||
    (e ? !uqInfOk(t, a) : !AFFIX[a.a].s.includes(t.slot)) ||
    !n ||
    !(S.mat[n] > 0) ||
    S.ash < ALCH_ASH.i(t.ilvl)
  )
    return;
  const l = ui.sealOn(t) ? ui.sealJ : -1,
    o = t.af.map((t, a) => a).filter((t) => t !== l);
  if (!o.length) return;
  const r = mirUse(t),
    i = r
      ? o.filter((a) => t.af[a].t === Math.max(...o.map((a) => t.af[a].t)))
      : o,
    c = rngItem(t, "i", () => i[ri(0, i.length - 1)]),
    d = t.af[c];
  (l >= 0 && S.mat.s1--,
    S.mat[n]--,
    (S.ash -= ALCH_ASH.i(t.ilvl)),
    S.runes.splice(S.runes.indexOf(a), 1),
    (ui.infR = null),
    pvClear(),
    e
      ? (t.af.splice(c, 1),
        (t.uqx ||= []).push(e),
        (ui.alchRes = {
          k: "i",
          icon: itemIcon(t),
          rc: rarColor(t),
          rune: itemIcon(a),
          old: d,
          uq: e,
          mir: r,
          msg: "灌注成功：獲得獨特效果",
        }))
      : ((t.af[c] = { a: a.a, t: a.t, v: a.v }),
        (ui.alchRes = {
          k: "i",
          icon: itemIcon(t),
          rc: rarColor(t),
          rune: itemIcon(a),
          old: d,
          nw: t.af[c],
          dup: t.af.filter((t) => t.a === a.a).length > 1,
          mir: r,
          msg: "灌注成功",
        })),
    sealAfter(e ? c : -1),
    recalc(),
    markDirty());
}
function sealReset() {
  ((ui.sealPick = !1), (ui.sealJ = null));
}
function alchPick(t) {
  (t !== ui.alchSel && (sealReset(), (ui.mirPick = !1)),
    (ui.alchSel = t),
    (ui.sealJ = null));
}
function sealAfter(t) {
  S.mat.s1 > 0
    ? t >= 0 && null != ui.sealJ && ui.sealJ > t && ui.sealJ--
    : sealReset();
}
function doReroll() {
  const t = alchFind(ui.alchSel);
  if (!t || !canReroll(t) || !(S.mat.r1 > 0) || S.ash < ALCH_ASH.r(t.ilvl))
    return;
  const a = ui.sealOn(t) ? ui.sealJ : -1;
  if (ui.sealCan(t) && a < 0) return;
  (S.mat.r1--,
    (S.ash -= ALCH_ASH.r(t.ilvl)),
    a >= 0 && S.mat.s1--,
    sealAfter());
  const s = slLines(t),
    e = s.map((t) => ({ ...t })),
    n = mirUse(t),
    l = t.af.length;
  (rngItem(t, "r", () =>
    s.forEach((t, s) => {
      if (s !== a) {
        const [a, e] = tierRange(t.a, t.t);
        t.v =
          !n || s >= l
            ? ri(a, e)
            : t.v >= e
              ? t.v
              : ri(Math.max(a, t.v + 1), e);
      }
    }),
  ),
    (ui.alchRes = {
      k: "r",
      icon: itemIcon(t),
      rc: rarColor(t),
      old: e,
      sj: a,
      nw: s.map((t) => ({ ...t })),
      mir: n,
      msg: "磨礪完成",
    }),
    pvClear(),
    recalc(),
    markDirty());
}
const cmTag = (t) =>
    t.cm && 1 !== t.cm ? ` <small class="rng">（腐化 ×${t.cm}）</small>` : "",
  cnOf = (t) =>
    t.cn ??
    Math.max(
      0,
      ...t.af.map((t) => {
        const a = tierRange(t.a, t.t)[1];
        return t.v > a + 1
          ? Math.ceil(
              Math.log(t.v / Math.max(1, a)) / Math.log(COR.val[1]) - 1e-9,
            )
          : 0;
      }),
    );
function doCorrupt() {
  const t = alchFind(ui.alchSel);
  t &&
    canCorrupt(t) &&
    S.mat.c1 > 0 &&
    !(S.ash < ALCH_ASH.c(t.ilvl)) &&
    (S.mat.c1--,
    (S.ash -= ALCH_ASH.c(t.ilvl)),
    rngItem(t, "c", () => {
      const a = t.af.map((t) => ({ ...t })),
        s = t.cm || 1,
        e = uqKey(t),
        n = pickW([0, 1, 2, 3], (t) => COR.w[t]),
        l = (t, a) => {
          const [s, e] = tierRange(t.a, t.t),
            n = e > s ? clamp((t.v - s) / (e - s), 0, 1) : 1,
            [l, o] = tierRange(t.a, a);
          ((t.t = a), (t.v = Math.round(l + n * (o - l))));
        },
        o = (a) => {
          const s = t.af.map((t, a) => a).filter((s) => a(t.af[s]));
          return s.length ? s[ri(0, s.length - 1)] : -1;
        };
      let r = n,
        i = -1;
      if (
        (0 === n &&
          ((i = o((t) => t.t >= 1)),
          i >= 0 ? l(t.af[i], t.af[i].t - 1) : e || (r = 1)),
        1 === r)
      ) {
        t.cn = cnOf(t) + 1;
        for (const a of t.af)
          a.v = Math.max(1, Math.round(a.v * rf(COR.val[0], COR.val[1])));
      }
      3 === n &&
        ((i = o((t) => t.t < tierN(t.a))), i >= 0 && l(t.af[i], t.af[i].t + 1));
      const c = e && [COR.uq.up, COR.uq.val, null, COR.uq.down][r];
      c && (t.cm = Math.round(100 * rf(c[0], c[1])) / 100);
      const d = mirUse(t),
        f = d && RAND() < MIR.cor;
      (f || (t.cor = 1),
        (ui.alchRes = {
          k: "c",
          icon: itemIcon(t),
          rc: rarColor(t),
          out: r,
          old: a,
          j: i,
          nw: t.af.map((t) => ({ ...t })),
          uk: e,
          cm0: s,
          cm: t.cm || 1,
          mir: d,
          keep: f,
          msg: `腐化：${COR.n[r]}`,
        }));
    }),
    pvClear(),
    recalc(),
    markDirty());
}
const mirOn = () => twOpen() || S.gd.m > 0 || S.mat.m1 > 0,
  canMir = (t) =>
    !t.mir &&
    !(t.sl && t.fused) &&
    (canAlch(t) || canInfuse(t) || canReroll(t) || canCorrupt(t) || canHoly(t));
function doHoly() {
  const t = alchFind(ui.alchSel);
  if (!t || !canHoly(t) || !(S.mat.h1 > 0) || S.ash < ALCH_ASH.h(t.ilvl))
    return;
  (S.mat.h1--, (S.ash -= ALCH_ASH.h(t.ilvl)));
  const a = baseInfo(t),
    s = mirUse(t),
    e = baseQ(t),
    n = rngItem(t, "h", () =>
      a.v.map((t, e) =>
        s
          ? t >= a.hi[e]
            ? t
            : ri(Math.max(a.lo[e], t + 1), a.hi[e])
          : ri(a.lo[e], a.hi[e]),
      ),
    );
  (t.sl
    ? (t.v = n[0])
    : t.wd
      ? ((t.wd[0] = n[0]), (t.wd[1] = Math.max(n[1], n[0] + 1)))
      : "e" === t.dt
        ? (t.eva = n[0])
        : (t.arm = n[0]),
    (ui.alchRes = {
      k: "h",
      icon: itemIcon(t),
      rc: rarColor(t),
      it: t,
      old: a.v,
      q0: e,
      q1: baseQ(t),
      mir: s,
      msg: "洗鍊石重洗完成",
    }),
    pvClear(),
    recalc(),
    markDirty());
}
const mirUse = (t) => {
    const a = !!t.mir;
    return (delete t.mir, a);
  },
  mirPickOk = (t) =>
    t && !t.mir && canMir(t) && S.mat.m1 > 0 && S.ash >= ALCH_ASH.m(t.ilvl),
  mselList = () => (ui.msel ? S.bag.filter((t) => ui.msel.has(t.u)) : []);
function msalvDo() {
  const t = mselList().filter((t) => !t.lk);
  for (const a of t) (salvage(a.u), ui.msel.delete(a.u));
  ((ui.confirm = null), markDirty());
}
function salvDo(t) {
  const a = salvage(t);
  ((ui.confirm = null),
    (ui.sel = S.bag[Math.min(a, S.bag.length - 1)]?.u ?? null));
}
function ssalvDo(t) {
  const a = S.slates.findIndex((a) => a.u === +t);
  (a >= 0 &&
    !S.slates[a].lk &&
    ((S.ash += slateAsh(S.slates[a])), S.slates.splice(a, 1), markDirty()),
    (ui.confirm = null));
}
const salvWarn = (t) => t.my || 4 === t.rar || t.mir || keepMatch(t),
  axQuick = (t) => {
    const a = alchFind(ui.alchSel);
    return !(!S.set.nocf || !a || ("alch" === t && (a.my || a.lk)));
  };
function axDo(t) {
  if ("alch" === t) {
    const t = S.bag.find((t) => t.u === ui.alchSel);
    t && delete t.lk;
  }
  ((ui.confirm = null),
    (ui.alchRes = null),
    mirPre(),
    { alch: doAlch, inf: doInfuse, rr: doReroll, cor: doCorrupt, holy: doHoly }[
      t
    ](),
    alchPop(ui.alchRes));
}
function mirPre() {
  const t = alchFind(ui.alchSel);
  (ui.mirPick &&
    mirPickOk(t) &&
    (S.mat.m1--, (S.ash -= ALCH_ASH.m(t.ilvl)), (t.mir = 1)),
    S.mat.m1 > 0 || (ui.mirPick = !1));
}
function doMir() {
  const t = alchFind(ui.alchSel);
  t &&
    canMir(t) &&
    S.mat.m1 > 0 &&
    !(S.ash < ALCH_ASH.m(t.ilvl)) &&
    (S.mat.m1--,
    (S.ash -= ALCH_ASH.m(t.ilvl)),
    (t.mir = 1),
    (ui.alchRes = {
      k: "m",
      icon: itemIcon(t),
      rc: rarColor(t),
      msg: "奇蹟降臨",
    }),
    sfx("alch", 3),
    markDirty());
}
function alchPop(t) {
  if (!t || !t.k) return;
  const a = "x" !== t.k || t.got.length,
    s = "x" === t.k && t.got.some((t) => t.uq || 0 === t.t),
    e = s
      ? "var(--ru)"
      : "m" === t.k
        ? MAT_COL.m
        : "h" === t.k
          ? MAT_COL.h
          : "c" === t.k
            ? MAT_COL.c
            : "r" === t.k
              ? MAT_COL.r
              : "i" === t.k
                ? MAT_COL.i
                : a
                  ? MAT_COL.x
                  : "#8a7a68",
    n = Array.from({ length: 10 }, (t, a) => {
      const s = (a / 10) * Math.PI * 2 + 0.3,
        e = 34 + (a % 3) * 10;
      return `<i style="--dx:${Math.round(Math.cos(s) * e)}px;--dy:${Math.round(Math.sin(s) * e)}px"></i>`;
    }).join(""),
    l = (t, a) =>
      `<div class="affix ${a}"><span class="tag" style="color:${tierCol(t)}">T${t.t}</span><span>${esc(AFFIX[t.a].f(t.v))}</span></div>`;
  let o, r;
  if ("x" === t.k && t.bulk) {
    const s = t.bulk,
      e = t.got
        .slice()
        .sort((t, a) => (a.uq ? 1 : 0) - (t.uq ? 1 : 0) || t.t - a.t),
      n = e.slice(0, 5);
    o = `<img class="src ${a ? "gone" : "dust"}" src="${t.icon}" alt="" style="--rc:${t.rc}">\n      ${n.map((t, a) => `<img class="out" src="${itemIcon(t)}" alt="" style="--ox:${56 * (a - (n.length - 1) / 2)}px">`).join("")}`;
    const l = {};
    for (const a of t.notes) l[a] = (l[a] || 0) + 1;
    r =
      `<p class="note" style="margin:0 0 4px">取出 <span class="px">${e.length}</span> 顆・失敗 <span class="px">${s.fail}</span> 件${s.pu ? `・保護石保留 <span class="px">${s.kept}/${s.pu}</span> 件` : ""}</p>` +
      (e.length
        ? `<div class="srunes">${e.map((t) => `<div class="affix">${runeTag(t)}<span>${esc(runeDesc(t))}</span></div>`).join("")}</div>`
        : "") +
      (t.notes.length
        ? `<p class="note" style="margin:4px 0 0">${Object.entries(l)
            .map(([t, a]) => esc(t) + (a > 1 ? ` X${a}` : ""))
            .join("・")}</p>`
        : "") +
      `<p class="note" style="margin:2px 0 0">摧毀 <span class="px">${s.n - s.kept}</span> 件裝備。</p>`;
  } else if ("x" === t.k)
    ((o = `<img class="src ${t.keep ? "keep" : a ? "gone" : "dust"}" src="${t.icon}" alt="" style="--rc:${t.rc}">\n      ${t.got.map((a, s) => `<img class="out" src="${itemIcon(a)}" alt="" style="--ox:${56 * (s - (t.got.length - 1) / 2)}px">`).join("")}`),
      (r =
        (t.got.length
          ? t.got
              .map(
                (t) =>
                  `<div class="affix">${runeTag(t)}<span>${esc(runeDesc(t))}</span></div>`,
              )
              .join("")
          : '<p class="note" style="margin:0">未取出符文石。</p>') +
        (t.notes.length
          ? `<p class="note" style="margin:4px 0 0">${t.notes.map(esc).join("・")}</p>`
          : "") +
        (t.keep
          ? ""
          : '<p class="note" style="margin:2px 0 0">裝備已摧毀。</p>')));
  else if ("m" === t.k)
    ((o = `<img class="src fed" src="${t.icon}" alt="" style="--rc:${t.rc}">`),
      (r =
        '<p class="note" style="margin:0">此裝備獲得<span class="mirt">奇蹟</span>狀態。</p><p class="note" style="margin:2px 0 0">下一次煉金效果強化，之後奇蹟消失。</p>'));
  else if ("c" === t.k) {
    o = `<img class="src fed" src="${t.icon}" alt="" style="--rc:${t.rc}">`;
    const a = (t) => (/\d%/.test(AFFIX[t.a].f(1)) ? "%" : ""),
      s = (t, a) => t.t !== a.t || t.v !== a.v;
    r =
      t.nw
        .map(
          (e, n) =>
            `<div class="affix ${s(e, t.old[n]) ? "new" : ""}"><span class="tag" style="color:${tierCol(e)}">T${e.t}</span><span>${esc(AFFIX[e.a].f(e.v))}${s(e, t.old[n]) ? ` <small class="rng">（原 T${t.old[n].t} ${afNum(e.a, t.old[n].v)}${a(e)}）</small>` : ""}</span></div>`,
        )
        .join("") +
      (t.uk && t.cm !== t.cm0
        ? `<div class="uniq new">${esc(uqText(t.uk, t.cm))} <small class="rng">（×${t.cm0} → ×${t.cm}）</small></div>`
        : "") +
      `<p class="note" style="margin:4px 0 0">${t.keep ? "奇蹟生效：此裝備未轉為腐化狀態。" : "此裝備已腐化，無法再煉金。"}</p>`;
  } else if ("h" === t.k) {
    o = `<img class="src fed" src="${t.icon}" alt="" style="--rc:${t.rc}">`;
    const a = baseInfo(t.it);
    r =
      `<div class="affix new"><span>${baseTxt(t.it, t.old)} → ${baseTxt(t.it, a.v)}</span></div><div class="affix"><span>品質 <span class="px">${Math.round(100 * t.q0)}%</span> → <span class="px">${Math.round(100 * t.q1)}%</span></span></div>` +
      baseRng(t.it, a)
        .map(
          ([t, a]) =>
            `<div class="affix"><span>${t} <span class="px">${a}</span></span></div>`,
        )
        .join("");
  } else if ("r" === t.k) {
    o = `<img class="src fed" src="${t.icon}" alt="" style="--rc:${t.rc}">`;
    const a = (t) => (/\d%/.test(AFFIX[t.a].f(1)) ? "%" : "");
    r = t.nw
      .map(
        (s, e) =>
          `<div class="affix ${e === t.sj ? "" : "new"}"><span class="tag" style="color:${tierCol(s)}">T${s.t}</span><span>${esc(AFFIX[s.a].f(s.v))} <small class="rng">${e === t.sj ? "封印" : `（原 ${afNum(s.a, t.old[e].v)}${a(s)} → 現 ${afNum(s.a, s.v)}${a(s)}）`}</small></span></div>`,
      )
      .join("");
  } else
    ((o = `<img class="src fed" src="${t.icon}" alt="" style="--rc:${t.rc}"><img class="fly" src="${t.rune}" alt="">`),
      (r =
        l(t.old, "gone") +
        '<div class="arw">↓</div>' +
        (t.uq
          ? `<div class="uniq new"><b>${esc(UNIQUE[t.uq].n)}</b>：${esc(uqText(t.uq, 1))}</div>`
          : l(t.nw, "new")) +
        (t.dup
          ? '<p class="note" style="margin:4px 0 0">此裝備現有兩條同種詞綴。</p>'
          : "")));
  const i =
    ui.axOn &&
    !t.bulk &&
    ui.alchAll(ui.alchMd()).some((t) => t.u === ui.alchSel);
  (($("#sheet").className = "alr " + ("x" !== t.k ? "inf" : a ? "ok" : "fail")),
    ($("#sheet").innerHTML =
      `<div class="ast" style="--sc:${e}"><div class="fl"></div><div class="sp">${n}</div>${o}</div>\n    <div class="ares"><b style="color:${s ? "var(--ru)" : a ? "var(--text)" : "var(--muted)"}">${t.msg}</b>${t.mir && "irh".includes(t.k) ? ' <span class="mirt">奇蹟生效</span>' : ""}${r}</div>\n    <div class="row ares">${i ? '<button class="btn" data-act="axRe">繼續煉金</button>' : ""}<span class="spacer"></span><button class="btn primary" data-act="close">知道了</button></div>`),
    ($("#sheetBg").hidden = !1),
    sfx("i" === t.k || a ? "alch" : "alchF", s ? 3 : "i" === t.k ? 2 : 1));
}
function fuse(t) {
  const a = t.sock.st
    .map((t) => S.runes.find((a) => a.u === t))
    .filter(Boolean);
  if (!a.length || !(S.mat.i3 > 0) || S.ash < ALCH_ASH.f(t.ilvl)) return;
  (S.mat.i3--,
    (S.ash -= ALCH_ASH.f(t.ilvl)),
    mirUse(t),
    (t.af = a.filter((t) => !t.uq).map((t) => ({ a: t.a, t: t.t, v: t.v }))));
  const s = a.find((t) => t.uq);
  (s && (t.uqe = s.uq),
    (S.runes = S.runes.filter((a) => !t.sock.st.includes(a.u))));
  const e = a.length;
  ((t.rar = Math.min(3, e)),
    delete t.sock,
    (t.fused = 1),
    (t.name = "鑲嵌・" + (t.sl ? SLATE[t.b].n : t.base)),
    recalc(),
    sfx("alch", 3),
    markDirty());
}
function onPanelClick(t) {
  if (dragEnd && performance.now() - dragEnd < 400) return;
  const a = t.target.closest("[data-act]");
  if (!a || a.disabled) return;
  const s = a.dataset.act,
    e = a.dataset.u;
  if ("dbv" !== s) {
    switch (s) {
      case "pick": {
        const t = findItem(e);
        (t && delete t.it.nw, (ui.sel = +e), (ui.confirm = null));
        break;
      }
      case "goItem":
        return ((ui.sel = +e), (ui.bagView = "items"), void ui.setTab("bag"));
      case "equip":
        (equipItem(e), (ui.confirm = null));
        break;
      case "unequip":
        unequip(e);
        break;
      case "salv": {
        const t = findItem(ui.sel)?.it;
        t && S.set.nocf && !salvWarn(t) ? salvDo(t.u) : (ui.confirm = "salv");
        break;
      }
      case "salvYes":
        salvDo(e);
        break;
      case "mpick":
        ((ui.sel = +e),
          ui.msel && (ui.msel.has(+e) ? ui.msel.delete(+e) : ui.msel.add(+e)));
        break;
      case "mall":
        if (ui.msel) for (const t of bagList()) ui.msel.add(t.u);
        break;
      case "mnone":
        ui.msel?.clear();
        break;
      case "mlock":
      case "munlock":
        for (const t of mselList()) "mlock" === s ? (t.lk = 1) : delete t.lk;
        markDirty();
        break;
      case "msalv": {
        const t = mselList().filter((t) => !t.lk);
        if (!t.length) break;
        S.set.nocf && !t.some(salvWarn) ? msalvDo() : (ui.confirm = "msalv");
        break;
      }
      case "msalvYes":
        msalvDo();
        break;
      case "mxtr":
        return (
          (ui.bxM = 1),
          (ui.bxSl = !1),
          (ui.confirm = null),
          void ui.bxOpen()
        );
      case "toAlch":
        return (
          alchPick(+e),
          (ui.alchRes = null),
          (ui.alchMode = a.dataset.v || "x"),
          (ui.infR = null),
          "i" === ui.alchMode && autoHelp("inf"),
          "c" === ui.alchMode && autoHelp("corr"),
          void ($("#sheetBg").hidden && ui.axOpen())
        );
      case "sock":
        return ((ui.confirm = null), void ui.sockOpen(+e));
      case "bagv":
        ((ui.bagView = a.dataset.v), (ui.lstN = 0));
        break;
      case "btool":
        if (
          ((ui.bagTool = ui.bagTool === a.dataset.v ? null : a.dataset.v),
          (ui.confirm = null),
          (ui.msel = "multi" === ui.bagTool ? ui.msel || new Set() : null),
          "keep" === ui.bagTool)
        )
          return (ui.render(), void autoHelp("keep"));
        break;
      case "lock": {
        const t = findItem(e);
        t &&
          (t.it.lk ? delete t.it.lk : (t.it.lk = 1),
          (ui.confirm = null),
          markDirty());
        break;
      }
      case "bulkr":
        ((bagOpt().bulk[+a.dataset.i] = a.checked ? 1 : 0),
          (ui.confirm = null),
          markDirty());
        break;
      case "bulkm": {
        const t = bagOpt(),
          s = a.dataset.v;
        ((t.sm = t.sm.includes(s) ? t.sm.filter((t) => t !== s) : [...t.sm, s]),
          (ui.confirm = null),
          markDirty());
        break;
      }
      case "bulkh": {
        const t = bagOpt(),
          s = +a.dataset.v;
        ((t.sh = t.sh.includes(s)
          ? t.sh.filter((t) => t !== s)
          : [...t.sh, s].sort()),
          (ui.confirm = null),
          markDirty());
        break;
      }
      case "auto":
        if ((5 === +a.dataset.i || 6 === +a.dataset.i) && a.checked) {
          ((a.checked = !1),
            (ui.confirm = 6 === +a.dataset.i ? "autoMyth" : "autoSock"));
          break;
        }
        return (
          (S.set.auto[+a.dataset.i] = a.checked ? 1 : 0),
          void markDirty()
        );
      case "autoSockYes":
        ((S.set.auto[5] = 1), (ui.confirm = null), markDirty());
        break;
      case "autoMythYes":
        ((S.set.auto[6] = 1), (ui.confirm = null), markDirty());
        break;
      case "noshk":
        return ((S.set.noshk = a.checked ? 1 : 0), void markDirty());
      case "nodot":
        return (
          (S.set.nodot = a.checked ? 1 : 0),
          dotApply(),
          void markDirty()
        );
      case "nolt":
        return ((S.set.nolt = a.checked ? 1 : 0), void markDirty());
      case "slnd":
        return ((S.set.slnd = a.checked ? 1 : 0), void markDirty());
      case "nonum":
        return (
          (S.set.nonum = a.checked ? 1 : 0),
          a.checked && (G.nums = G.nums.filter((t) => !t.d)),
          void markDirty()
        );
      case "abset":
        return (
          (S.set.ab = a.checked ? 1 : 0),
          (G.abT = 0),
          markDirty(),
          void ui.hud(!0)
        );
      case "ssag":
        return (
          ((S.set.ags ||= [0, 0, 0])[+a.dataset.g] = a.checked ? 1 : 0),
          (G.abT = 0),
          void markDirty()
        );
      case "agset":
        return (
          ((S.set.agb ||= [0, 0, 0, 0])[+a.dataset.i] = a.checked ? 1 : 0),
          (G.agT = 0),
          void markDirty()
        );
      case "apb":
        return ((S.set.apb = a.checked ? 1 : 0), void markDirty());
      case "twcset":
        return ((S.set.twc = a.checked ? 1 : 0), void markDirty());
      case "amp":
        return (
          (S.set.amp = a.checked ? 1 : 0),
          autoMergeP(),
          markDirty(),
          void ui.render()
        );
      case "psv":
        return ((S.set.psv = a.checked ? 1 : 0), void markDirty());
      case "nob":
        return ((S.set.nob = a.checked ? 1 : 0), recalc(), void markDirty());
      case "atset":
        return ((S.set.at = a.checked ? 1 : 0), (G.atT = 0), void markDirty());
      case "sauto":
        return (
          (slSet().sauto[+a.dataset.i] = a.checked ? 1 : 0),
          void markDirty()
        );
      case "sbulkr":
        ((slOpt().bulk[+a.dataset.i] = a.checked ? 1 : 0),
          (ui.confirm = null),
          markDirty());
        break;
      case "sbulk":
        ui.confirm = "sbulk";
        break;
      case "rbulk":
        ui.confirm = "rbulk";
        break;
      case "rbulkYes": {
        const t = rBulk();
        for (const a of t) S.ash += runeAsh(a);
        ((S.runes = S.runes.filter((a) => !t.includes(a))),
          (ui.confirm = null),
          markDirty());
        break;
      }
      case "sbulkYes": {
        const t = slBulk();
        for (const a of t) S.ash += slateAsh(a);
        ((S.slates = S.slates.filter((a) => !t.includes(a))),
          (ui.confirm = null),
          markDirty());
        break;
      }
      case "bulk":
        ui.confirm = "bulk";
        break;
      case "bulkYes":
        for (const t of bulkList()) salvage(t.u);
        ui.confirm = null;
        break;
      case "cancel":
        ui.confirm = null;
        break;
      case "cmp":
        return void ui.cmpOpen(+e);
      case "slPick":
        return (
          (ui.slSwap = null),
          void ui.slPickOpen(
            +a.dataset.i,
            null != a.dataset.m ? +a.dataset.m : S.map,
          )
        );
      case "ssalv": {
        const t = S.slates.find((t) => t.u === +e);
        t && S.set.nocf && !t.my ? ssalvDo(e) : (ui.confirm = "ssalv" + e);
        break;
      }
      case "gsOpen":
        return ((ui.gsSc = null), void ui.gsOpen());
      case "bldCp":
        return (dropGhost(!1), void ui.bcOpen());
      case "gfuse": {
        const t = a.dataset.id;
        return void (SKILLS[t] && (dropGhost(!1), ui.gfOpen(t)));
      }
      case "ssalvYes":
        ssalvDo(e);
        break;
      case "rsalv": {
        const t = S.runes.findIndex((t) => t.u === +e);
        t >= 0 &&
          ((S.ash += runeAsh(S.runes[t])), S.runes.splice(t, 1), markDirty());
        break;
      }
      case "gem": {
        dropGhost();
        const t = S.gems.find((t) => t.u === +e);
        if (!t) return;
        const a = autoSpot(t);
        if (a) (placeGem(t, a.x, a.y, a.rot), (ui.selGem = t.u));
        else {
          const [a, s] = UNLOCK_ORDER[0].split(",").map(Number);
          (setGhost(t, a, s, 0),
            toast("沒有可放置的位置：拖曳紅色方塊、旋轉，或先取下其他寶石"));
        }
        break;
      }
      case "cell":
        return void skillCell(+a.dataset.x, +a.dataset.y, a);
      case "rot": {
        const t = S.gems.find((t) => t.u === ui.selGem);
        if (!t) return;
        const a = ui.ghost;
        if (a)
          ((a.rot = (a.rot + 1) % 4),
            canPlace(t, a.x, a.y, a.rot) && placeGem(t, a.x, a.y, a.rot));
        else if (t.x < 0) ui.rot = (ui.rot + 1) % 4;
        else {
          const a = (t.rot + 1) % 4;
          canPlace(t, t.x, t.y, a)
            ? placeGem(t, t.x, t.y, a)
            : setGhost(t, t.x, t.y, a);
        }
        break;
      }
      case "unplace": {
        const t = S.gems.find((t) => t.u === ui.selGem);
        t &&
          (dropGhost(!1),
          t.x >= 0 && ((t.x = t.y = -1), afterGrid()),
          (ui.selGem = null));
        break;
      }
      case "desel":
        (dropGhost(), (ui.selGem = null));
        break;
      case "gclear":
        placed().length && (ui.confirm = "gclear");
        break;
      case "gclearYes":
        dropGhost(!1);
        for (const t of placed()) t.x = t.y = -1;
        ((ui.selGem = null), afterGrid(), (ui.confirm = null));
        break;
      case "brk":
        ui.brk[+e] = !ui.brk[+e];
        break;
      case "minG":
        S.set.minG = +a.dataset.v;
        break;
      case "trapFx":
        S.set.trapFx = +a.dataset.v;
        break;
      case "trayTab":
        (ui.gemSeenNow(), (ui.trayTab = a.dataset.v));
        break;
      case "gemGrp": {
        ui.gemSeenNow();
        const t = a.dataset.id,
          s = S.gems.find((t) => t.u === ui.selGem);
        ((ui.trayOpen =
          ui.trayOpen === t || (s && s.id === t && s.x < 0) ? null : t),
          !ui.trayOpen && s && s.id === t && s.x < 0 && (ui.selGem = null));
        break;
      }
      case "build": {
        const t = +a.dataset.v;
        if (t === S.gp) return void bnOpen();
        (dragStop(!1), dropGhost(), (ui.selGem = null));
        const s = switchBuild(t);
        if (!s) return;
        if (s.full) return void toast("背包空間不足，無法換下裝備", "bad");
        const e = s.miss + validateGrid();
        (afterGrid(),
          toast(`切換到構築 ${t + 1}`),
          s.lost && toast(`${s.lost} 件裝備已不在背包，對應欄位留空`, "bad"),
          e && toast(`${e} 顆寶石所在格子已鎖定，已退回`),
          sfx("quest"));
        break;
      }
      case "asel":
        return (
          alchPick(+e),
          (ui.alchRes = null),
          (ui.confirm = null),
          (ui.infR = null),
          ui.render(),
          void ui.axOpen()
        );
      case "aopt":
        ((ui.alchOpt.p = a.checked ? a.dataset.k : 0), (ui.confirm = null));
        break;
      case "xopt":
        ((ui.alchOpt.x = a.dataset.k), (ui.confirm = null));
        break;
      case "alch":
      case "inf":
      case "rr":
      case "cor":
      case "holy":
        axQuick(s) ? axDo(s) : (ui.confirm = s);
        break;
      case "alchYes":
      case "infYes":
      case "rrYes":
      case "corYes":
      case "holyYes":
        axDo(s.slice(0, -3));
        break;
      case "nocf":
        return ((S.set.nocf = a.checked ? 1 : 0), void markDirty());
      case "bxOpen":
        return (
          (ui.confirm = null),
          (ui.bxM = 0),
          S.bag.some(canAlch) || (ui.bxSl = !0),
          void ui.bxOpen()
        );
      case "matSel":
        return void matOpen(a.dataset.k);
      case "amode":
        return (
          (ui.alchMode = a.dataset.v),
          (ui.alchSel = null),
          (ui.sealJ = null),
          (ui.alchRes = null),
          (ui.confirm = null),
          ui.render(),
          "i" === ui.alchMode && autoHelp("inf"),
          "r" === ui.alchMode && autoHelp("reroll"),
          "h" === ui.alchMode && autoHelp("holy"),
          "c" === ui.alchMode && autoHelp("corr"),
          void ("m" === ui.alchMode && autoHelp("mir"))
        );
      case "infr":
        ((ui.infR = +e), (ui.confirm = null));
        break;
      case "infg":
        rgTap((ui.infOpen ||= new Set()), a.dataset.k, a.dataset.more);
        break;
      case "rgrp":
        rgTap((ui.rOpen ||= new Set()), a.dataset.k, a.dataset.more);
        break;
      case "sealopt":
        ((ui.sealPick = a.checked), (ui.sealJ = null), (ui.confirm = null));
        break;
      case "sealj":
        ((ui.sealJ = +a.dataset.i), (ui.confirm = null));
        break;
      case "mirpick":
        ((ui.mirPick = a.checked), (ui.confirm = null));
        break;
      case "mir":
        (doMir(), alchPop(ui.alchRes));
        break;
      case "craft":
        doCraft(a.dataset.k, +a.dataset.n || 1);
        break;
      case "merge":
        mergeDo(+a.dataset.i, +a.dataset.n || 1);
        break;
      case "cardOpen":
        return void ui.cardOpen(+a.dataset.i);
      case "godOpen":
        return void ui.godOpen();
      case "fxPick": {
        const t = a.dataset.k,
          s = +a.dataset.v;
        if ("trail" !== t) return ui.fxOpen(t, s);
        ((S.set.trail = S.set.trail === s ? -1 : s), markDirty());
        break;
      }
      case "map":
        ui.confirm = +a.dataset.i === S.map ? null : "map" + a.dataset.i;
        break;
      case "mapYes":
        (setMap(+a.dataset.i), (ui.confirm = null), ssMap() && (S.ssSeen = 1));
        break;
      case "ssBoss": {
        const t = +a.dataset.g;
        (ssMap() || setMap(SS_MAP), startBoss(t), G.boss && ui.setTab("map"));
        break;
      }
      case "artOn":
        ((S.art.on = a.dataset.k), recalc(), markDirty());
        break;
      case "artOff":
        ((S.art.on = ""), recalc(), markDirty());
        break;
      case "trial":
        startTrial(S.tal.tr);
        break;
      case "trnGo":
        G.trn ? leaveArena() : trnStart();
        break;
      case "trn":
        trnSet(a.dataset.k, +a.dataset.v);
        break;
      case "trnRst":
        G.trn && (trnReset(), (ui.tcT = 0));
        break;
      case "gd":
        ui.confirm = "gd" + a.dataset.i;
        break;
      case "gdYes":
        (startGuard(+a.dataset.i), (ui.confirm = null));
        break;
      case "tw":
        ui.confirm = "tw" + a.dataset.i;
        break;
      case "twYes":
        ((ui.confirm = null), twStart(+a.dataset.i));
        break;
      case "trayGo":
        return void $("#tray")?.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
      case "shopV":
        return ((ui.shopV = a.dataset.v), void ui.render());
      case "mview":
        return (
          (ui.mapView = a.dataset.v),
          S.mvs[ui.mapView] || ((S.mvs[ui.mapView] = 1), markDirty()),
          (ui.confirm = null),
          void ui.render()
        );
      case "cview":
        return (
          (ui.charView = a.dataset.v),
          (ui.confirm = null),
          ui.render(),
          void ("asc" === ui.charView && autoHelp("asc"))
        );
      case "talL": {
        const t = ascBranch(),
          s = a.dataset.k,
          e = t ? t.t.findIndex((t) => t.some((t) => t.k === s)) : -1;
        if (
          e < 0 ||
          S.tal.p.includes(s) ||
          S.tal.n - 2 * S.tal.p.length < 2 ||
          (e > 0 && !t.t[e - 1].some((t) => S.tal.p.includes(t.k))) ||
          t.t[e].some((t) => S.tal.p.includes(t.k))
        )
          return;
        (S.tal.p.push(s), recalc(), markDirty(), sfx("quest"));
        break;
      }
      case "ascReset":
        ui.confirm = "ascReset";
        break;
      case "talReset":
        ui.confirm = "talReset";
        break;
      case "talResetYes":
        if (S.ash < 150 || !S.tal.p.length) return;
        return (
          (S.ash -= 150),
          (S.tal.p = []),
          recalc(),
          markDirty(),
          (ui.confirm = null),
          void ui.render()
        );
      case "ascResetYes":
        if (S.ash < 300) return;
        return (
          (S.ash -= 300),
          (S.tal.asc = ""),
          (S.tal.p = []),
          recalc(),
          markDirty(),
          (ui.confirm = null),
          ui.render(),
          void ui.ascPick()
        );
      case "ascPick":
        return void ui.ascPick();
      case "sesReset":
        ((S.ses = sesNew()), markDirty());
        break;
      case "morev":
        return (
          (ui.moreView = a.dataset.v),
          ui.menuDot(ui.moreView, 0),
          "rank" === ui.moreView && (lbSend(), lbLoad()),
          (ui.confirm = null),
          ui.render(),
          ($("#panel").scrollTop = 0),
          void autoHelp(AUTO_HELP[ui.moreView])
        );
      case "menuBack":
        return (
          (ui.moreView = null),
          (ui.confirm = null),
          ui.render(),
          void ($("#panel").scrollTop = 0)
        );
      case "help":
        return void helpOpen(a.dataset.k, +a.dataset.i || 0);
      case "stv":
        ((ui.stV = a.dataset.v),
          (ui.stSel = null),
          (ui.stN = 0),
          ui.stMs?.clear());
        break;
      case "stm":
        ((ui.stMine = !!a.dataset.v),
          (ui.stSel = null),
          (ui.stN = 0),
          ui.stMs?.clear());
        break;
      case "stMs":
        ((ui.stMs = ui.stMs ? null : new Set()), (ui.stSel = null));
        break;
      case "stmp":
        if (ui.stMs) {
          const t = +e;
          ui.stMs.has(t) ? ui.stMs.delete(t) : ui.stMs.add(t);
        }
        break;
      case "stmr":
        if (ui.stMs) {
          const t = a.dataset.v.split(",").map(Number),
            s = t.every((t) => ui.stMs.has(t));
          for (const a of t) s ? ui.stMs.delete(a) : ui.stMs.add(a);
        }
        break;
      case "stMsA":
        if (ui.stMs) for (const t of ui.stAll || []) ui.stMs.add(t);
        break;
      case "stMsN":
        ui.stMs?.clear();
        break;
      case "stMsGo": {
        const t = [...(ui.stMs || [])];
        if (!t.length) break;
        const a = ui.stMine ? stPut(ui.stV || "bag", t) : stTake(t);
        a &&
          (toast(
            `已${ui.stMine ? "存入" : "取出"} ${a} ${"slates" === ui.stV ? "塊" : "bag" === ui.stV ? "件" : "顆"}`,
          ),
          ui.stMs.clear(),
          (ui.sel = null));
        break;
      }
      case "stMore":
        ui.stN = (ui.stN || 60) + 60;
        break;
      case "stg":
        rgTap((ui.stOpen ||= new Set()), a.dataset.k, a.dataset.more);
        break;
      case "stpick":
        ui.stSel = +e;
        break;
      case "stIn": {
        const t = a.dataset.k || "bag",
          s = ui.sel;
        stPut(t, [+e]) &&
          (toast("已存入倉庫"),
          "bag" === t && s === +e && (ui.sel = null),
          (ui.stSel = null));
        break;
      }
      case "stOut":
        stTake([+a.dataset.s]) && (toast("已取出"), (ui.stSel = null));
        break;
      case "mstash": {
        const t = stPut(
          "bag",
          mselList().map((t) => t.u),
        );
        t && (toast(`已存入倉庫 ${t} 件`), ui.msel.clear(), (ui.sel = null));
        break;
      }
      case "buy": {
        const t = +a.dataset.c,
          s = a.dataset.k;
        if (S.ash < t) return;
        ((S.ash -= t),
          "pot" === s
            ? (S.pot += 5)
            : s.startsWith("gem:") &&
              (giveGem(s.slice(4)), ui.badge("skill", 1)),
          toast("購買成功"),
          markDirty());
        break;
      }
      case "reset":
        ui.confirm = "reset";
        break;
      case "resetYes":
        return void wipe();
      case "reload":
        return (
          grabDrops(),
          saveNow().then(() => location.reload()),
          void (TAB.gone = !0)
        );
      case "zen":
        return void zenSet(!0);
      case "term":
        return void termSet(!0);
      case "gcIn":
      case "gcUp":
      case "gcOff":
      case "gcDel":
        return void gcAct(s);
      case "chars":
        return ((ui.chRn = ui.chCf = null), void ui.charsOpen());
      case "lbHide":
        return ((S.lb.hd = a.checked ? 1 : 0), markDirty(), void lbSend());
      case "lbRef":
        return ((LB.t = 0), lbLoad(), void ui.render());
      case "lbV":
        return void (
          LB.v !== a.dataset.v &&
          ((LB.v = a.dataset.v),
          (LB.top = LB.me = null),
          (LB.t = 0),
          lbLoad(),
          ui.render())
        );
      case "lbSnap": {
        const t = (LB.top || []).find((t) => t.r === +a.dataset.r);
        return void (t && t.p && ((ui.snapPg = 0), ui.snapOpen(t, -1)));
      }
      case "install":
        if (pwa.ev) {
          const t = pwa.ev;
          ((pwa.ev = null),
            t.prompt(),
            t.userChoice.finally(() => ui.render()));
        }
        return;
      default:
        if (!keepAct(s, a)) return;
    }
    (ui.render(), ui.confirm && $("#sheetBg").hidden && ui.cfOpen());
  } else
    isStandalone() && (t.preventDefault(), dbvOpen(a.getAttribute("href")));
}
function gemOverlay(t, a) {
  const s = gemArt(t.id, t.rot, 16, t.sh, t.sx),
    e = gemCells(t),
    n = Math.min(...e.map((t) => t[0])),
    l = Math.min(...e.map((t) => t[1])),
    o = (t, a, s, e) =>
      `left:calc(6px + ${t} * ((100% - 27px) / 6 + 3px));top:calc(6px + ${a} * ((100% - 27px) / 6 + 3px));width:calc(${s} * ((100% - 27px) / 6 + 3px) - 3px);height:calc(${e} * ((100% - 27px) / 6 + 3px) - 3px)`,
    r = new Set(e.map((t) => t + "")),
    i = e.reduce((t, a) => t + a[0], 0) / e.length,
    c = e.reduce((t, a) => t + a[1], 0) / e.length;
  let d = null;
  for (const t of [0, 1])
    for (const [a, s] of e) {
      if (r.has(t ? a + "," + (s - 1) : a - 1 + "," + s)) continue;
      let e = 1;
      for (; r.has(t ? a + "," + (s + e) : a + e + "," + s);) e++;
      const n =
        (e > 1 ? 10 - 5 * t : 0) +
        e -
        0.1 *
          (Math.abs((t ? a : a + (e - 1) / 2) - i) +
            Math.abs((t ? s + (e - 1) / 2 : s) - c));
      (!d || n > d.sc) && (d = { x: a, y: s, n: e, vert: t && e > 1, sc: n });
    }
  const f = SKILLS[t.id].n,
    p =
      1 === d.n && f.length > 3
        ? esc(f.slice(0, 2)) + "<br>" + esc(f.slice(2))
        : esc(f);
  return `<div class="gov${a ? " sel" : ""}" data-u="${t.u}" style="${o(n, l, s.w, s.h)}">${s.svg}</div><div class="gname${d.vert ? " v" : ""}${SKILLS[t.id].act ? "" : " sup"}" data-u="${t.u}" style="${o(d.x, d.y, d.vert ? 1 : d.n, d.vert ? d.n : 1)}"><span>${p}</span></div>`;
}
let drag = null,
  dragEnd = 0;
function dragCellAt(t, a) {
  if (!$("#sgrid")) return null;
  const s = document.elementFromPoint(t, a),
    e = s && s.closest("#sgrid button");
  return e ? [+e.dataset.x, +e.dataset.y] : null;
}
function dragPaint() {
  const t = drag,
    a = t.g,
    s = document.querySelectorAll("#sgrid button");
  if (
    (s.forEach((t) => t.classList.remove("drop", "ghost", "dragsrc")), a.x >= 0)
  )
    for (const [t, e] of gemCells(a)) s[6 * e + t]?.classList.add("dragsrc");
  const [e, n] = rotCell(t.grab, t.rot),
    l = t.cell,
    o = $("#tray");
  if ((o && o.classList.toggle("dropzone", a.x >= 0 && t.overTray), l)) {
    const o = l[0] - e,
      r = l[1] - n,
      i = canPlace(a, o, r, t.rot) || !!swapTarget(a, o, r, t.rot);
    for (const [e, n] of gemCells(a, o, r, t.rot))
      e >= 0 &&
        n >= 0 &&
        e < 6 &&
        n < 6 &&
        s[6 * n + e].classList.add(i ? "drop" : "ghost");
  }
  document
    .querySelectorAll("#sgrid .gov,#sgrid .gname")
    .forEach((t) =>
      t.classList.toggle("dragsrc", a.x >= 0 && +t.dataset.u === a.u),
    );
  const r = gemShape(a).map((a) => rotCell(a, t.rot)),
    i = Math.min(...r.map((t) => t[0])),
    c = Math.min(...r.map((t) => t[1])),
    d = gemArt(a.id, t.rot, 16, a.sh, a.sx);
  let f = $("#dragGem");
  f ||
    ((f = document.createElement("div")),
    (f.id = "dragGem"),
    document.body.appendChild(f));
  const p = t.sz;
  ((f.style.width = d.w * (p + 3) - 3 + "px"),
    (f.style.height = d.h * (p + 3) - 3 + "px"),
    f.dataset.k !== a.u + ":" + t.rot &&
      ((f.innerHTML = d.svg), (f.dataset.k = a.u + ":" + t.rot)),
    (f.style.transform = `translate(${t.px - (e - i + 0.5) * (p + 3)}px,${t.py - (n - c + 0.5) * (p + 3)}px)`));
}
function dragStart(t) {
  const a = drag;
  ((a.on = !0),
    (a.held = !!t),
    (a.down = !t),
    ui.ghost && ui.ghost.u !== a.g.u && dropGhost(),
    (a.ghost0 = ui.ghost),
    (ui.ghost = null),
    (ui.selGem = null));
  const s = document.querySelector("#sgrid button");
  if (
    ((a.sz = s ? Math.round(s.getBoundingClientRect().width) : 32),
    navigator.vibrate && a.touch)
  )
    try {
      navigator.vibrate(10);
    } catch (t) {}
  ((a.scroll = setInterval(() => {
    if (!drag || !drag.on || (drag.held && drag.touch && !drag.down)) return;
    const t = $("#panel"),
      a = t.getBoundingClientRect(),
      s =
        drag.py > a.bottom - 48
          ? Math.min(14, (drag.py - (a.bottom - 48)) / 3 + 3)
          : drag.py < a.top + 48
            ? -Math.min(14, (a.top + 48 - drag.py) / 3 + 3)
            : 0;
    if (s) {
      const a = t.scrollTop;
      ((t.scrollTop += s), t.scrollTop !== a && dragMove());
    }
  }, 16)),
    t && ((dragEnd = performance.now()), ui.render()),
    dragMove());
}
function dragMove() {
  const t = drag;
  t.cell = dragCellAt(t.px, t.py);
  const a = $("#sgrid").getBoundingClientRect(),
    s = $("#panel").getBoundingClientRect();
  ((t.overTray = !t.cell && t.py > a.bottom + 12 && t.py < s.bottom + 40),
    dragPaint());
}
function dragStop(t) {
  const a = drag;
  if (
    ((drag = null),
    clearTimeout(a?.hold),
    clearInterval(a?.scroll),
    $("#dragGem")?.remove(),
    !a || !a.on)
  )
    return;
  dragEnd = performance.now();
  const s = a.g;
  if (((ui.ghost = a.ghost0 || null), t && a.cell)) {
    const [t, e] = rotCell(a.grab, a.rot),
      n = a.cell[0] - t,
      l = a.cell[1] - e,
      o = canPlace(s, n, l, a.rot) ? null : swapTarget(s, n, l, a.rot);
    if (o) {
      const t =
          gemCells(o).find(([t, s]) => t === a.cell[0] && s === a.cell[1]) ||
          gemCells(o).find(([t, e]) =>
            gemCells(s, n, l, a.rot).some(([a, s]) => a === t && s === e),
          ),
        e = rotCell([t[0] - o.x, t[1] - o.y], (4 - o.rot) % 4),
        r = o.rot;
      return (
        (o.x = o.y = -1),
        placeGem(s, n, l, a.rot),
        (ui.selGem = null),
        (drag = {
          g: o,
          grab: e,
          rot: r,
          id: a.id,
          x0: a.px,
          y0: a.py,
          px: a.px,
          py: a.py,
          on: !1,
          touch: a.touch,
          tray: !1,
          cell: null,
          overTray: !1,
        }),
        void dragStart(!0)
      );
    }
    canPlace(s, n, l, a.rot)
      ? (placeGem(s, n, l, a.rot), (ui.selGem = null))
      : setGhost(s, n, l, a.rot);
  } else
    t && a.overTray
      ? (dropGhost(!1),
        s.x >= 0 && ((s.x = s.y = -1), afterGrid()),
        (ui.selGem = null))
      : ui.ghost && ((ui.ghost.rot = a.rot), (ui.selGem = s.u));
  ui.render();
}
function dragRotate() {
  drag && drag.on && ((drag.rot = (drag.rot + 1) % 4), dragPaint());
}
function initDrag() {
  const t = $("#panel");
  (t.addEventListener("pointerdown", (t) => {
    if (drag && drag.held) {
      if (t.button > 0) return;
      const a = t.target.closest("[data-act]")?.dataset.act;
      if ("rot" === a)
        return (dragRotate(), void (dragEnd = performance.now()));
      if ("desel" === a)
        return (
          dragStop(!1),
          dropGhost(),
          (ui.selGem = null),
          void ui.render()
        );
      if ("unplace" === a) {
        const t = drag.g;
        return (
          dragStop(!1),
          dropGhost(!1),
          t.x >= 0 && ((t.x = t.y = -1), afterGrid()),
          (ui.selGem = null),
          void ui.render()
        );
      }
      return (
        (drag.id = t.pointerId),
        (drag.down = !0),
        (drag.px = t.clientX),
        (drag.py = t.clientY),
        void dragMove()
      );
    }
    if (drag)
      return void (
        drag.on &&
        t.pointerId !== drag.id &&
        (t.preventDefault(), dragRotate())
      );
    if ("skill" !== ui.tab || t.button > 0) return;
    let a = null,
      s = [0, 0],
      e = 0;
    const n = t.target.closest("#sgrid button"),
      l = t.target.closest('#tray [data-act="gem"]');
    if (n) {
      const t = +n.dataset.x,
        l = +n.dataset.y,
        o = ui.ghost,
        r = o && S.gems.find((t) => t.u === o.u);
      if (
        r &&
        gemCells(r, o.x, o.y, o.rot).some(([a, s]) => a === t && s === l)
      )
        ((a = r), (e = o.rot), (s = rotCell([t - o.x, l - o.y], (4 - e) % 4)));
      else {
        if (
          ((a = placed().find((a) =>
            gemCells(a).some(([a, s]) => a === t && s === l),
          )),
          !a)
        )
          return;
        ((e = a.rot), (s = rotCell([t - a.x, l - a.y], (4 - e) % 4)));
      }
    } else {
      if (!l) return;
      if (((a = S.gems.find((t) => t.u === +l.dataset.u)), !a)) return;
    }
    const o = "mouse" !== t.pointerType;
    drag = {
      g: a,
      grab: s,
      rot: e,
      id: t.pointerId,
      x0: t.clientX,
      y0: t.clientY,
      px: t.clientX,
      py: t.clientY,
      on: !1,
      touch: o,
      tray: !!l,
      cell: null,
      overTray: !1,
    };
  }),
    window.addEventListener("pointermove", (t) => {
      const a = drag;
      if (!a) return;
      if (a.held)
        return void (
          ("mouse" === t.pointerType || (a.down && t.pointerId === a.id)) &&
          ((a.px = t.clientX), (a.py = t.clientY), dragMove())
        );
      if (t.pointerId !== a.id) return;
      ((a.px = t.clientX), (a.py = t.clientY));
      const s = Math.hypot(a.px - a.x0, a.py - a.y0);
      if (a.on) dragMove();
      else {
        if (s < 5) return;
        dragStart();
      }
    }),
    window.addEventListener("pointerup", (t) => {
      const a = drag;
      a &&
        t.pointerId === a.id &&
        (a.held ? a.down && dragStop(!0) : a.on ? dragStop(!0) : dragStart(!0));
    }),
    window.addEventListener("pointercancel", (t) => {
      !drag ||
        t.pointerId !== drag.id ||
        (drag.held && !drag.down) ||
        dragStop(!1);
    }),
    window.addEventListener(
      "pointerdown",
      (t) => {
        drag && drag.held && !t.target.closest("#panel") && dragStop(!1);
      },
      !0,
    ),
    window.addEventListener(
      "touchmove",
      (t) => {
        drag && drag.on && (!drag.held || drag.down) && t.preventDefault();
      },
      { passive: !1 },
    ),
    window.addEventListener("keydown", (t) => {
      (drag && drag.on && ("r" === t.key || "R" === t.key) && dragRotate(),
        drag && "Escape" === t.key && dragStop(!1));
    }),
    t.addEventListener(
      "scroll",
      () => {
        drag && drag.on && dragMove();
      },
      { passive: !0 },
    ),
    t.addEventListener("contextmenu", (t) => {
      drag && (t.preventDefault(), drag.on && dragRotate());
    }));
}
function setGhost(t, a, s, e) {
  const n =
    ui.ghost && ui.ghost.u === t.u
      ? ui.ghost.from
      : t.x >= 0
        ? { x: t.x, y: t.y, rot: t.rot }
        : null;
  (t.x >= 0 && ((t.x = t.y = -1), afterGrid()),
    (ui.selGem = t.u),
    (ui.ghost = { u: t.u, x: a, y: s, rot: e, from: n }));
}
function dropGhost(t = !0) {
  const a = ui.ghost;
  if (((ui.ghost = null), !a || !t || !a.from)) return;
  const s = S.gems.find((t) => t.u === a.u),
    e = a.from;
  s && s.x < 0 && canPlace(s, e.x, e.y, e.rot) && placeGem(s, e.x, e.y, e.rot);
}
function swapTarget(t, a, s, e) {
  const n = openSet(),
    l = gemCells(t, a, s, e);
  if (!l.every(([t, a]) => n.has(t + "," + a))) return null;
  const o = placed().filter(
    (a) =>
      a.u !== t.u &&
      gemCells(a).some(([t, a]) => l.some(([s, e]) => s === t && e === a)),
  );
  return 1 === o.length ? o[0] : null;
}
function autoSpot(t) {
  for (let a = 0; a < 4; a++)
    for (const s of UNLOCK_ORDER) {
      const [e, n] = s.split(",").map(Number);
      if (canPlace(t, e, n, a)) return { x: e, y: n, rot: a };
    }
  return null;
}
function placeGem(t, a, s, e) {
  ((t.x = a),
    (t.y = s),
    (t.rot = e),
    (ui.ghost = null),
    (ui.rot = 0),
    afterGrid());
}
function afterGrid() {
  (recalc(), quest("place", 1), quest("link", 0), markDirty());
}
function skillCell(t, a, s) {
  if (!openSet().has(t + "," + a)) return;
  const e = S.gems.find((t) => t.u === ui.selGem),
    n = placed().find((s) => gemCells(s).some(([s, e]) => s === t && e === a)),
    l = ui.ghost;
  if (!(
    l &&
    e &&
    gemCells(e, l.x, l.y, l.rot).some(([s, e]) => s === t && e === a)
  ))
    if (e) {
      const s = l ? l.rot : e.x < 0 ? ui.rot : e.rot;
      if (n && n !== e)
        return (dropGhost(), (ui.selGem = n.u), (ui.rot = 0), void ui.render());
      (canPlace(e, t, a, s)
        ? (placeGem(e, t, a, s), (ui.selGem = null))
        : setGhost(e, t, a, s),
        ui.render());
    } else n && ((ui.selGem = n.u), ui.render());
}
const upd = { has: !1, told: !1 };
function checkUpdate() { return;
  /^https?:$/.test(location.protocol) &&
    window.fetch &&
    "string" == typeof BUILD_ID &&
    fetch("version.json?t=" + Date.now(), { cache: "no-store" })
      .then((t) => (t.ok ? t.json() : null))
      .then((t) => {
        if (t && t.v && t.v !== BUILD_ID) {
          ((upd.has = !0),
            ui.menuDot("set", 1),
            (upd.ver = t.ver || ""),
            (upd.v = t.v));
          try {
            upd.tried = sessionStorage.getItem("awUpd") === t.v;
          } catch (t) {
            upd.tried = !1;
          }
          "more" === ui.tab && ui.render();
        }
      })
      .catch(() => {});
}
(setTimeout(checkUpdate, 4e3),
  setInterval(checkUpdate, 6e5),
  document.addEventListener("visibilitychange", () => {
    document.hidden ||
      (upd.has && !upd.tried && updSafe() ? updNow() : checkUpdate());
  }));
const updSafe = () =>
    !TAB.gone &&
    !DBV.on &&
    !!S &&
    !!G &&
    canStart() &&
    $("#sheetBg").hidden &&
    !ui.confirm &&
    !drag,
  grabDrops = () => {
    if (G && G.drops && G.drops.length) {
      for (const t of G.drops) pickup(t);
      G.drops = [];
    }
  };
function updNow() {
  try {
    sessionStorage.setItem("awUpd", upd.v);
  } catch (t) {}
  (grabDrops(), saveNow().then(() => location.reload()), (TAB.gone = !0));
}
setInterval(() => {
  !upd.has ||
    upd.tried ||
    document.hidden ||
    (updSafe()
      ? upd.cd
        ? --upd.cd <= 0 && updNow()
        : ((upd.cd = 5),
          toast(
            `即將更新到新版本${upd.ver ? " " + upd.ver : ""}（5 秒）`,
            "lvl",
          ))
      : (upd.cd = 0));
}, 1e3);
const pwa = { ev: null };
(/^https?:$/.test(location.protocol) &&
  false && "serviceWorker" in navigator &&
  window.addEventListener("load", () =>
    navigator.serviceWorker.register("sw.js").catch(() => {}),
  ),
  window.addEventListener("beforeinstallprompt", (t) => {
    (t.preventDefault(), (pwa.ev = t), "more" === ui.tab && ui.render());
  }),
  window.addEventListener("appinstalled", () => {
    ((pwa.ev = null),
      toast("已安裝到主畫面"),
      "more" === ui.tab && ui.render());
  }));
const TAB = {
  gone: !1,
  id: Date.now().toString(36) + performance.now().toString(36),
  ch: null,
};
try {
  TAB.ch = new BroadcastChannel("ro-wanderer-v3-tab");
} catch (t) {}
const TAB_W = "ro-wanderer.v3.wt",
  wtGet = () => {
    try {
      return localStorage.getItem(TAB_W);
    } catch (t) {
      return null;
    }
  };
function tabStale() {
  return !!TAB.gone || (wtGet() !== TAB.seen && (tabLock(!0), !0));
}
function tabLock(t) {
  if (TAB.gone) return;
  (S && !t && wtGet() === TAB.seen && saveNow(!0),
    (TAB.gone = !0),
    AU.ctx && AU.ctx.suspend().catch(() => {}));
  const a = $("#pick");
  ((a.innerHTML =
    '<h1>遊戲在另一個分頁進行中</h1><p class="sub">同一時間只能在一個分頁遊玩。</p><button class="btn primary" id="tabBack">在這裡繼續</button>'),
    (a.hidden = !1),
    ($("#tabBack").onclick = () => location.reload()));
}
function tabClaim(t) {
  if (((TAB.seen = wtGet()), !TAB.ch || !/^https?:$/.test(location.protocol)))
    return t();
  let a = !1;
  const s = () => {
    a || ((a = !0), (TAB.seen = wtGet()), t());
  };
  (TAB.ch.addEventListener("message", (t) => {
    t.data && "saved" === t.data.k && s();
  }),
    TAB.ch.postMessage({ k: "claim", id: TAB.id }),
    setTimeout(s, 300));
}
TAB.ch &&
  (TAB.ch.onmessage = (t) => {
    const a = t.data || {};
    "claim" === a.k &&
      a.id !== TAB.id &&
      (tabLock(), TAB.ch.postMessage({ k: "saved", id: TAB.id }));
  });
const cloud = { db: null, id: null, ok: !1, busy: !1 },
  LS_Z = "Z1:",
  lsSeq = {},
  b64 = (t) => {
    let a = "";
    for (let s = 0; s < t.length; s += 32768)
      a += String.fromCharCode.apply(null, t.subarray(s, s + 32768));
    return btoa(a);
  };
async function lsZip(t) {
  if ("function" != typeof CompressionStream) return t;
  try {
    const a = new TextEncoder().encode(t);
    return (
      LS_Z +
      a.length +
      ":" +
      b64(await bkPipe(a, CompressionStream, "deflate-raw"))
    );
  } catch (a) {
    return t;
  }
}
function lsParse(t) {
  if (!t || !t.startsWith(LS_Z)) return t ? JSON.parse(t) : null;
  const a = t.indexOf(":", 3),
    s = atob(t.slice(a + 1)),
    e = new Uint8Array(s.length);
  for (let t = 0; t < s.length; t++) e[t] = s.charCodeAt(t);
  return JSON.parse(
    new TextDecoder().decode(inflateRaw(e, new Uint8Array(+t.slice(3, a)))),
  );
}
async function lsPut(t, a, s) {
  const e = (lsSeq[t] = (lsSeq[t] || 0) + 1),
    n = await lsZip(a);
  if (lsSeq[t] !== e) return !0;
  try {
    return (localStorage.setItem(t, n), s && s(), !0);
  } catch (t) {
    return !1;
  }
}
function lsPutNow(t, a, s) {
  try {
    return (
      localStorage.setItem(t, a),
      (lsSeq[t] = (lsSeq[t] || 0) + 1),
      s && s(),
      !0
    );
  } catch (t) {
    return !1;
  }
}
function lsRepack() {
  for (const t of rosterGet().list) {
    const a = CHAR_KEY(t.id);
    let s = null;
    try {
      s = localStorage.getItem(a);
    } catch (t) {}
    s && !s.startsWith(LS_Z) && lsPut(a, s);
  }
}
let saveErrT = 0;
const saveErr = () => (
  Date.now() - saveErrT > 6e4 &&
    ((saveErrT = Date.now()), toast("存檔失敗：儲存空間不足", "bad")),
  !1
);
function saveNow(t) {
  if (!S || tabStale()) return Promise.resolve(!1);
  try {
    (localStorage.setItem(TAB_W, TAB.id), (TAB.seen = TAB.id));
  } catch (t) {}
  S.t = Date.now();
  const a = JSON.stringify(S),
    s = S.cid,
    e = S.sx,
    n = () => stPrune(s, e),
    l =
      t && lsPutNow(SAVE_KEY, a, n)
        ? Promise.resolve(!0)
        : lsPut(SAVE_KEY, a, n).then((t) => t || saveErr());
  return (
    cloud.ok &&
      !cloud.busy &&
      ((cloud.busy = !0),
      cloud.db
        .doc("data/users/" + cloud.id + "/save")
        .set({ s: a, t: S.t })
        .catch(() => {
          cloud.ok = !1;
        })
        .finally(() => {
          cloud.busy = !1;
        })),
    (dirty = !1),
    rosterSync(),
    kpPush(),
    (G && G.tw) || lbSend(),
    gcTick(),
    l
  );
}
const LB = {
    top: null,
    me: null,
    err: "",
    busy: 0,
    t: 0,
    wait: 0,
    snap: {},
    v: "",
  },
  LB_TOP = 50,
  LB_LV = 85,
  LB_ERR = {
    nodb: "排行榜尚未開放。",
    key: "這個角色的排行身分無效。",
    slow: "上傳過於頻繁，稍後將自動重試。",
    name: "角色名稱須為 1～8 個字。",
    range: "紀錄不符合上傳條件。",
    ip: "此網路今日建立的排行身分已達上限。",
    bad: "資料錯誤。",
  },
  lbOn = () => false,
  lbClean = (t) =>
    [
      ...String(t || "")
        .replace(
          /[\u0000-\u001f\u007f-\u009f<>&"'`\\\u00ad\u034f\u061c\u115f\u1160\u17b4\u17b5\u180b-\u180f\u200b-\u200f\u202a-\u202e\u2060-\u206f\u3164\ufeff\uffa0]/g,
          "",
        )
        .replace(/(\p{M}{2})\p{M}+/gu, "$1")
        .replace(/\s+/g, " ")
        .trim(),
    ]
      .slice(0, 8)
      .join("");
function lbIdent() {
  if (S.lb.id) return;
  const t = (t) =>
    [...crypto.getRandomValues(new Uint8Array(t))]
      .map((t) => (t % 36).toString(36))
      .join("");
  ((S.lb.id = t(24)), (S.lb.key = t(36)), markDirty());
}
function lbSend() {
  const t = S && S.lb;
  if (!lbOn() || !t || !S.name || LB.busy || Date.now() < LB.wait) return;
  if (
    S.tw.best < 1 ||
    S.lvl < LB_LV ||
    (S.tw.best <= t.sent && S.name === t.sn && t.ss && !t.hd == !t.sh)
  )
    return;
  (lbIdent(), (LB.busy = 1));
  const a = t.rs && t.rs.floor === S.tw.best ? t.rs : lbNow(),
    s = {
      id: t.id,
      key: t.key,
      name: S.name,
      ...a,
      ver: "string" == typeof BUILD_VER ? BUILD_VER : "",
      aid: stAid(),
      cid: S.cid,
      hide: t.hd ? 1 : 0,
    };
  fetch("api/tower", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(s),
  })
    .then((t) => t.json())
    .then((a) => {
      a.ok
        ? (t.rs && a.floor >= t.rs.floor && delete t.rs,
          (t.sent = a.floor),
          (t.sn = s.name),
          (t.ss = a.ss ? 1 : 0),
          (t.sh = s.hide),
          LB.v || (LB.me = { r: a.r, floor: a.floor, name: s.name }),
          (LB.err = ""),
          (LB.t = 0),
          markDirty(),
          "rank" === ui.moreView && lbLoad())
        : ((LB.err = LB_ERR[a.err] || "暫時無法連線排行榜。"),
          "slow" === a.err && (LB.wait = Date.now() + 31e3),
          "ip" === a.err && (LB.wait = Date.now() + 36e5));
    })
    .catch(() => {
      ((LB.err = "暫時無法連線排行榜。"), (LB.wait = Date.now() + 6e4));
    })
    .finally(() => {
      ((LB.busy = 0), ui.refreshIf("more"));
    });
}
const lbNow = () => ({
  cls: S.cls,
  br: S.tal.asc || "",
  floor: S.tw.best,
  lv: S.lvl,
  dps: S.tw.bd || 0,
  est: Math.round(PS.dps || 0),
  hp: PS.maxhp,
  snap: lbSnap(),
});
function lbRec() {
  S.lvl >= LB_LV && ((S.lb.rs = lbNow()), markDirty());
}
const brName = (t, a) =>
    ((a && ascBranch(t, a)) || {}).n || (CLASS[t] || {}).n || "",
  lbAdm = () => {
    try {
      const t = localStorage.getItem("aw.adm");
      return t ? { authorization: "Bearer " + t } : {};
    } catch (t) {
      return {};
    }
  };
function admIn() {
  const t = /^#awadm:(.*)$/.exec(location.hash);
  if (t) {
    try {
      history.replaceState(null, "", location.pathname + location.search);
    } catch (t) {}
    try {
      t[1]
        ? localStorage.setItem("aw.adm", decodeURIComponent(t[1]))
        : localStorage.removeItem("aw.adm");
    } catch (t) {}
  }
}
function lbLoad() {
  if (!lbOn() || Date.now() - LB.t < 15e3) return;
  LB.t = Date.now();
  const t = LB.v,
    a = [S.lb.id && "id=" + S.lb.id, t && "cls=" + t].filter(Boolean).join("&");
  fetch("api/tower" + (a ? "?" + a : ""), {
    cache: "no-store",
    headers: lbAdm(),
  })
    .then((t) => t.json())
    .then((a) => {
      t === LB.v &&
        (a.top
          ? ((LB.top = a.top),
            (LB.me = a.me),
            LB.err && !/頻繁/.test(LB.err) && (LB.err = ""))
          : (LB.err = LB_ERR[a.err] || "暫時無法連線排行榜。"));
    })
    .catch(() => {
      LB.err = "暫時無法連線排行榜。";
    })
    .finally(() => ui.refreshIf("more"));
}
function lbSnap() {
  const t = SLOTS.map((t) => S.equip[t])
      .filter(Boolean)
      .map((t) => {
        const a = {};
        for (const s in t) ["u", "nw", "lk"].includes(s) || (a[s] = t[s]);
        return a;
      }),
    a = placed().map((t) => {
      const a = { id: t.id, x: t.x, y: t.y, rot: t.rot };
      return (t.sh && (a.sh = t.sh), t.sx && (a.sx = t.sx), a);
    });
  return {
    v: 1,
    cls: S.cls,
    lv: S.lvl,
    br: S.tal.asc || "",
    tp: S.tal.p.slice(),
    oc: openCount(),
    eq: t,
    gm: a,
    dps: S.tw.bd || 0,
    hp: PS.maxhp,
    ps: psSnap(),
  };
}
const own = (t, a) => "string" == typeof a && Object.hasOwn(t, a);
function snapCopy(t, a = 0) {
  if (a > 8) return null;
  if ("string" == typeof t)
    return t.replace(/[<>&"'`\\(){};]/g, "").slice(0, 60);
  if ("number" == typeof t) return Number.isFinite(t) ? t : 0;
  if ("boolean" == typeof t) return t;
  if (Array.isArray(t)) return t.slice(0, 64).map((t) => snapCopy(t, a + 1));
  if (!t || "object" != typeof t) return null;
  const s = {};
  for (const e of Object.keys(t).slice(0, 64))
    /^[A-Za-z0-9_]{1,16}$/.test(e) &&
      !["__proto__", "constructor", "prototype"].includes(e) &&
      (s[e] = snapCopy(t[e], a + 1));
  return s;
}
function snapClean(t) {
  const a = snapCopy(t);
  if (!a || Array.isArray(a) || !own(CLASS, a.cls)) return null;
  ((a.eq = (Array.isArray(a.eq) ? a.eq : [])
    .filter(
      (t) =>
        t &&
        own(SLOT_NAME, t.slot) &&
        "slate" !== t.slot &&
        Array.isArray(t.af) &&
        t.af.every((t) => t && own(AFFIX, t.a)) &&
        (!t.uq || own(UNIQUE, t.uq)),
    )
    .map((t, a) => Object.assign(t, { u: a }))),
    (a.gm = (Array.isArray(a.gm) ? a.gm : []).filter(
      (t) =>
        t &&
        own(SKILLS, t.id) &&
        [t.x, t.y, t.rot].every(Number.isInteger) &&
        (!t.sh ||
          (Array.isArray(t.sh) &&
            t.sh.every(
              (t) =>
                Array.isArray(t) && 2 === t.length && t.every(Number.isInteger),
            ))),
    )),
    (a.tp = Array.isArray(a.tp)
      ? a.tp.filter((t) => "string" == typeof t)
      : []));
  const s =
    a.ps && "object" == typeof a.ps && !Array.isArray(a.ps) ? a.ps : null;
  return (
    (a.ps =
      s &&
      Object.fromEntries(
        Object.keys(psSnap()).map((t) => [
          t,
          Number.isFinite(+s[t]) ? +s[t] : 0,
        ]),
      )),
    (a.oc = clamp(Math.floor(+a.oc || 0), 0, 36)),
    (a.lv = clamp(Math.floor(+a.lv || 1), 1, 100)),
    a
  );
}
function lbSnapGet(t) {
  const a = t && t.p;
  a &&
    lbOn() &&
    !LB.snap[a] &&
    ((LB.snap[a] = 1),
    fetch("api/tower?snap=" + a, { cache: "no-store", headers: lbAdm() })
      .then((t) => t.json())
      .then((t) => {
        const s = t.snap && snapClean(t.snap);
        LB.snap[a] = s ? { s, ts: +t.ts || 0 } : 0;
      })
      .catch(() => {
        LB.snap[a] = 0;
      })
      .finally(() => {
        (ui.snapX === t &&
          !$("#sheetBg").hidden &&
          $("#sheet").classList.contains("snp") &&
          ui.snapOpen(t),
          0 === LB.snap[a] && delete LB.snap[a]);
      }));
}
let bootPk = "";
function loadLocal() {
  let t = null;
  try {
    t = lsParse(localStorage.getItem(SAVE_KEY));
  } catch (t) {}
  const a = t && t.cid ? charLoad(t.cid) : null;
  return a
    ? ((bootPk = t.cid),
      (a.t || 0) > (t.t || 0) ? Object.assign(a, { pk: 1 }) : t)
    : t;
}
async function initCloud() { return null;
  try {
    if (!window.claude?.use) return null;
    const [t, a] = await Promise.all([
      window.claude.use("db"),
      window.claude.use("user"),
    ]);
    if (!t || !a) return null;
    const s = await a.id();
    if (!s) return null;
    Object.assign(cloud, { db: t, id: s, ok: !0 });
    const e = await t.doc("data/users/" + s + "/save").get();
    if (e.exists) return JSON.parse(e.data().s);
  } catch (t) {
    cloud.ok = !1;
  }
  return null;
}
const MIGR = [
  ["def2", migrateDef],
  ["def3", migrateLine],
  ["af3", migrateAf],
  [
    "q2",
    (t) => {
      ((t.alchOn =
        t.q > 6 || (t.runes || []).length || (t.bag || []).some((t) => t.sock)
          ? 1
          : 0),
        t.q > 6 ? t.q-- : 6 === t.q && (t.qp = 0));
    },
  ],
  [
    "alc1",
    (t) => {
      ((t.mat = t.mat || {}),
        t.scroll > 0 && (t.mat.p1 = (t.mat.p1 || 0) + t.scroll),
        (t.ash = (t.ash || 0) + (t.cat > 0 ? 120 * t.cat : 0)),
        delete t.scroll,
        delete t.cat);
    },
  ],
  [
    "alc2",
    (t) => {
      ((t.alchOn = t.alchOn || (t.beat || [])[2] ? 1 : 0),
        t.q > 8 ? t.q++ : 8 === t.q && (t.qp = 0));
    },
  ],
  [
    "alc3",
    (t) => {
      t.mat &&
        t.mat.i2 > 0 &&
        ((t.mat.i3 = (t.mat.i3 || 0) + t.mat.i2), (t.mat.i2 = 0));
    },
  ],
  [
    "sh1",
    (t) => {
      for (const a of t.gems || [])
        ("multi" !== a.id && "amp" !== a.id) || (a.x = a.y = -1);
    },
  ],
  [
    "nm1",
    (t) => {
      for (const a of [...(t.bag || []), ...Object.values(t.equip || {})])
        !a || a.uq || a.sock || a.fused || delete a.name;
    },
  ],
  [
    "sl2",
    (t) => {
      for (const a of [
        ...(t.slates || []),
        ...(t.slt || []).flatMap((t) => (t ? t.s : [])),
      ])
        a &&
          !a.slot &&
          ((a.slot = "slate"),
          (a.af = []),
          addAffixes(a, ri(...RAR_AFFIX[a.rar])));
    },
  ],
  [
    "sl3",
    (t) => {
      for (const a of [
        ...(t.bag || []),
        ...Object.values(t.equip || {}),
        ...(t.slates || []),
        ...(t.slt || []).flatMap((t) => (t ? t.s : [])),
      ])
        if (a && a.af && a.af.some((t) => t.lk)) {
          for (const t of a.af) delete t.lk;
          ((t.mat = t.mat || {}), (t.mat.s1 = (t.mat.s1 || 0) + 1));
        }
    },
  ],
  [
    "sl5",
    (t) => {
      for (const a of [
        ...(t.slates || []),
        ...(t.slt || []).flatMap((t) => (t ? t.s : [])),
      ])
        if (a && a.af && !a.dg) {
          ((a.dg = a.af.filter((t) => AFFIX[t.a] && "dg" === AFFIX[t.a].s[0])),
            (a.af = a.af.filter((t) => !a.dg.includes(t))));
          const t = RAR_AFFIX[a.rar][0] - a.af.length;
          t > 0 && addAffixes(a, t);
        }
      t.runes = (t.runes || []).filter((a) => {
        const s = !a.uq && AFFIX[a.a] && "dg" === AFFIX[a.a].s[0];
        return (s && (t.ash = (t.ash || 0) + runeAsh(a)), !s);
      });
    },
  ],
  [
    "sl4",
    (t) => {
      (t.slt || []).forEach((a, s) => {
        if (a && s < 4)
          for (let s = 2; s < a.s.length; s++)
            a.s[s] && ((t.slates ||= []).push(a.s[s]), (a.s[s] = null));
      });
    },
  ],
  [
    "wc1",
    (t) => {
      for (const a of [...Object.values(t.equip || {}), ...(t.bag || [])])
        a && "weapon" === a.slot && a.wd && null != a.wd[3] && (a.wd[3] += 3);
    },
  ],
  [
    "sl6",
    (t) => {
      for (const a of [
        ...(t.slates || []),
        ...(t.slt || []).flatMap((t) => (t ? t.s : [])),
      ])
        a && 0 === a.b && !a.my && (a.v *= 2);
    },
  ],
  [
    "slg1",
    (t) => {
      const a = (t.slt || []).flatMap((t) => (t ? t.s.filter(Boolean) : [])),
        s = (t.slt || []).reduce((t, a) => t + ((a && a.k) || 0), 0),
        e = Math.min(3, 1 + Math.floor(s / 1e3)),
        n = (t) =>
          slLines(t).reduce(
            (t, a) =>
              t + (AFFIX[a.a] && AFFIX[a.a].dg ? AFFIX[a.a].dg(a.v) : 0),
            0,
          );
      (a.sort((t, a) => n(a) - n(t)),
        (t.slates = [...(t.slates || []), ...a.slice(e)]),
        (t.slt =
          a.length || s
            ? [{ s: [0, 1, 2].map((t) => (a[t] && t < e ? a[t] : null)), k: s }]
            : []));
    },
  ],
  [
    "ssd1",
    (t) => {
      for (const a of t.slates || [])
        a &&
          a.sl &&
          a.sock &&
          a.dg &&
          a.dg.length < a.sock.n &&
          addDanger(a, a.sock.n - a.dg.length);
    },
  ],
  [
    "rg1",
    (t) => {
      t.tal && "ranger" === t.tal.asc && (t.tal.p || []).length && (t.rgN = 1);
    },
  ],
  [
    "rs1",
    (t) => {
      for (const a of [
        ...(t.slates || []),
        ...(t.slt || []).flatMap((t) => (t ? t.s : [])),
      ]
        .flatMap((t) => (t && t.af) || [])
        .concat(t.runes || []))
        a && /^rs_/.test(a.a) && (a.v *= 13);
    },
  ],
];
function migrate(t) {
  for (const a of [...(t.bag || []), ...(t.slates || [])])
    a && a.sock && (a.sock.st = []);
  (t.set &&
    (delete t.set.dev,
    delete t.set.speed,
    t.set.ag && (t.set.agb = [1, 1, 1, 1]),
    delete t.set.ag),
    t.set && !t.set.rsv2 && ((t.set.rautoS = 0), (t.set.rsv2 = 1)));
  for (const [a, s] of MIGR) t[a] || (s(t), (t[a] = 1));
  t.mvs ||
    (t.mvs = {
      map: 1,
      ss: 1,
      st: 1,
      tr: t.lvl >= 25 || (t.tal && t.tal.tr) ? 1 : 0,
      end: (t.beat || [])[MAP_N - 1] || (t.slates || []).length ? 1 : 0,
    });
  const a = newState(t.cls);
  for (const s in a) void 0 === t[s] && (t[s] = a[s]);
  for (
    t.cid || (t.cid = cidNew()),
      t.set.keep ||= [],
      t.tal.tr ||= 0,
      t.tw.mk ||= 0,
      t.tw.bd ||= 0,
      t.gd.m ||= 0,
      t.map >= MAP_N &&
        !(SEASON.on && t.lvl >= SEASON.lv) &&
        (t.map = Math.min(t.unlocked, MAP_N - 1));
    t.prog.length < MAPS.length;
  )
    t.prog.push(0);
  for (; t.beat.length < MAPS.length;) t.beat.push(0);
  return t;
}
function migrateLine(t) {
  const a = (t) => {
    if (!t || !isArmourSlot(t.slot) || !t.dt) return;
    const a = "chest" === t.slot ? 8 + 5 * t.ilvl : 4 + 2.5 * t.ilvl,
      s =
        "e" === t.dt
          ? (t.eva || 0) / (0.75 * a)
          : (t.arm || 0) / (a * ("h" === t.dt ? 0.6 : 1)),
      e = t.base;
    (setBase(
      t,
      (null != t.bi ? Math.min(3, t.bi) : baseTier(t.ilvl)) +
        ("e" === t.dt ? 4 : 0),
    ),
      defBase(t, clamp(s || 1, 0.9, 1.1)),
      t.name &&
        e &&
        t.name.endsWith(e) &&
        (t.sock || t.fused) &&
        (t.name = t.name.slice(0, -e.length) + t.base));
  };
  (Object.values(t.equip || {}).forEach(a), (t.bag || []).forEach(a));
}
function migrateDef(t) {
  const a = [
      [5, 12],
      [13, 30],
      [31, 60],
      [61, 110],
      [111, 180],
    ],
    s = (t) => {
      if ("armor" !== t.a || !t.t) return;
      const [s, e] = a[5 - t.t],
        [n, l] = OLD_R.armor[5 - t.t];
      t.v = Math.round(n + clamp((t.v - s) / (e - s), 0, 1) * (l - n));
    },
    e = (t) => {
      t &&
        ((t.af || []).forEach(s),
        !t.dt &&
          ["helm", "chest", "gloves", "boots"].includes(t.slot) &&
          ((t.dt = "a"), defBase(t)));
    };
  (Object.values(t.equip || {}).forEach(e),
    (t.bag || []).forEach(e),
    (t.runes || []).forEach(s));
}
const OLD_R = {
    adddmg: [
      [1, 3],
      [4, 8],
      [9, 16],
      [17, 28],
      [29, 45],
    ],
    dmgp: [
      [5, 9],
      [10, 15],
      [16, 24],
      [25, 34],
      [35, 45],
    ],
    skill: [
      [6, 10],
      [11, 17],
      [18, 26],
      [27, 36],
      [37, 48],
    ],
    aspd: [
      [3, 5],
      [6, 8],
      [9, 11],
      [12, 14],
      [15, 18],
    ],
    act: [
      [2, 3],
      [4, 5],
      [6, 8],
      [9, 11],
      [12, 15],
    ],
    crit: [
      [1, 2],
      [3, 4],
      [5, 6],
      [7, 8],
      [9, 11],
    ],
    critm: [
      [8, 12],
      [13, 20],
      [21, 30],
      [31, 42],
      [43, 60],
    ],
    life: [
      [8, 15],
      [16, 30],
      [31, 55],
      [56, 85],
      [86, 120],
    ],
    lifep: [
      [2, 3],
      [4, 5],
      [6, 8],
      [9, 11],
      [12, 15],
    ],
    armor: [
      [10, 25],
      [26, 50],
      [51, 90],
      [91, 140],
      [141, 200],
    ],
    armorp: [
      [8, 14],
      [15, 24],
      [25, 36],
      [37, 50],
      [51, 70],
    ],
    eva: [
      [8, 19],
      [20, 38],
      [39, 68],
      [69, 105],
      [106, 150],
    ],
    evap: [
      [8, 14],
      [15, 24],
      [25, 36],
      [37, 50],
      [51, 70],
    ],
    regen: [
      [1, 2],
      [2, 4],
      [4, 7],
      [7, 11],
      [11, 18],
    ],
    lok: [
      [1, 3],
      [4, 8],
      [9, 16],
      [17, 28],
      [29, 45],
    ],
    cdr: [
      [2, 3],
      [4, 5],
      [6, 7],
      [8, 9],
      [10, 12],
    ],
    area: [
      [4, 6],
      [7, 10],
      [11, 15],
      [16, 20],
      [21, 26],
    ],
    move: [
      [4, 6],
      [7, 10],
      [11, 15],
      [16, 20],
      [21, 26],
    ],
    revive: [
      [5, 8],
      [9, 13],
      [14, 19],
      [20, 26],
      [27, 35],
    ],
    pot: [
      [8, 12],
      [13, 20],
      [21, 30],
      [31, 42],
      [43, 55],
    ],
  },
  LOCAL_OF = { adddmg: "wadd", dmgp: "wdmg", aspd: "waspd", crit: "wcrit" };
function migrateAf(t) {
  const a = (t, a) => {
      const s = OLD_R[t.a];
      if (!s || !(t.t >= 1 && t.t <= 5)) return;
      const [e, n] = s[5 - t.t],
        l = n > e ? clamp((t.v - e) / (n - e), 0, 1) : 1;
      if ((a && LOCAL_OF[t.a] && (t.a = LOCAL_OF[t.a]), !AFFIX[t.a])) return;
      const o = tierN(t.a);
      t.t = o - Math.round(((5 - t.t) / 4) * (o - 1));
      const [r, i] = tierRange(t.a, t.t);
      t.v = Math.round(r + l * (i - r));
    },
    s = (s) => {
      if (!s || !s.af) return;
      const e = "weapon" === s.slot;
      if (
        (e && s.wd && null == s.wd[3] && (s.wd[3] = WEAPON[t.cls].c),
        s.af.forEach((t) => a(t, e)),
        (s.af = s.af.filter((t) => AFFIX[t.a])),
        !s.fused && !s.sock && s.rar >= 0)
      ) {
        const t = s.uq ? UQ_AFFIX(s.ilvl || 1) : RAR_AFFIX[s.rar][1];
        s.af = s.af
          .slice()
          .sort((t, a) => tierQ(a) - tierQ(t))
          .slice(0, t);
      }
    };
  (Object.values(t.equip || {}).forEach(s),
    (t.bag || []).forEach(s),
    (t.runes || []).forEach((t) => a(t, !1)));
}
function wipe() {
  (cloud.ok &&
    cloud.db
      .doc("data/users/" + cloud.id + "/save")
      .delete()
      .catch(() => {}),
    (ui.confirm = null),
    charDelete(S.cid));
}
const ROSTER_KEY = "ro-wanderer.v3.roster",
  CHAR_KEY = (t) => "ro-wanderer.v3.c." + t,
  CHAR_MAX = 6,
  cidNew = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function rosterGet() {
  try {
    const t = JSON.parse(localStorage.getItem(ROSTER_KEY));
    if (t && Array.isArray(t.list)) return t;
  } catch (t) {}
  return { list: [] };
}
function rosterPut(t) {
  try {
    localStorage.setItem(ROSTER_KEY, JSON.stringify(t));
  } catch (t) {}
}
function rosterSync() {
  if (!S || !S.cid) return;
  const t = rosterGet(),
    a = t.list.findIndex((t) => t.id === S.cid),
    s = { id: S.cid, name: S.name, cls: S.cls, lvl: S.lvl, tw: S.tw.best };
  (a >= 0 && JSON.stringify(t.list[a]) === JSON.stringify(s)) ||
    (a < 0 ? t.list.push(s) : (t.list[a] = s), rosterPut(t));
}
function rosterClean() {
  const t = rosterGet(),
    a = t.list.length;
  ((t.list = t.list.filter(
    (t) =>
      (S && t.id === S.cid) ||
      (() => {
        try {
          return !!localStorage.getItem(CHAR_KEY(t.id));
        } catch (t) {
          return !1;
        }
      })(),
  )),
    t.list.length !== a && rosterPut(t));
}
function nameCheck(t, a) {
  const s = lbClean(t);
  return s
    ? rosterGet().list.some((t) => t.id !== a && t.name === s)
      ? [null, "已有同名角色。"]
      : [s]
    : [null, "名稱須為 1～8 個字。"];
}
const carry = () =>
  S
    ? {
        mus: S.set.mus,
        sfx: S.set.sfx,
        nonum: S.set.nonum,
        noshk: S.set.noshk,
        nodot: S.set.nodot,
        logV: S.logV,
      }
    : ui.pkCarry || null;
function applyCarry(t, a) {
  return (
    a &&
      ((t.set = t.set || {}),
      (t.set.mus = a.mus),
      (t.set.sfx = a.sfx),
      a.nonum && (t.set.nonum = 1),
      a.noshk && (t.set.noshk = 1),
      a.nodot && (t.set.nodot = 1),
      (t.logV = a.logV)),
    t
  );
}
function sheetOff() {
  ((ui.chRn = ui.chCf = null),
    ($("#sheetBg").hidden = !0),
    ($("#sheet").className = ""));
}
function charReset() {
  (sheetOff(),
    (ui.moreView = null),
    (ui.charView = "st"),
    (ui.mapView = "map"),
    (ui.confirm = null),
    Object.assign(LB, { top: null, me: null, err: "", t: 0, wait: 0 }));
}
function charLoad(t) {
  try {
    const a = lsParse(localStorage.getItem(CHAR_KEY(t)));
    return a && a.cls ? a : null;
  } catch (t) {
    return null;
  }
}
async function stashCur() {
  if (!S) return !0;
  if (tabStale()) return !1;
  if (G) for (const t of G.drops) pickup(t);
  if ((kpPush(), !acctPark()))
    return (toast("儲存空間不足，無法切換角色", "bad"), !1);
  S.t = Date.now();
  const t = S.cid,
    a = S.sx;
  return (
    !!(await lsPut(CHAR_KEY(t), JSON.stringify(S), () => stPrune(t, a))) ||
    (toast("儲存空間不足，無法切換角色", "bad"), !1)
  );
}
function charUse(t, a, s) {
  const e = (Date.now() - (t.t || Date.now())) / 1e3;
  (applyCarry(t, s),
    charReset(),
    startGame(t, !1),
    offlineGains(e, e < 600, !0),
    saveNow().then((t) => {
      if (t && S && S.cid === a)
        try {
          localStorage.removeItem(CHAR_KEY(a));
        } catch (t) {}
    }),
    "function" == typeof auApply && auApply());
}
let chBusy = !1;
async function charSwitch(t) {
  if (!S || t === S.cid || chBusy) return;
  const a = charLoad(t);
  if (!a) return (toast("找不到這個角色的存檔", "bad"), void rosterClean());
  const s = carry();
  chBusy = !0;
  const e = await stashCur();
  ((chBusy = !1),
    e && S && S.cid !== t && (charUse(a, t, s), toast(`切換到「${S.name}」`)));
}
function charRename(t, a) {
  if (t === S.cid)
    return ((S.name = a), markDirty(), saveNow(), void toast("已改名"));
  const s = charLoad(t);
  if (!s) return;
  const e = s.name;
  s.name = a;
  const n = rosterGet(),
    l = n.list.find((a) => a.id === t);
  (l && ((l.name = a), rosterPut(n)),
    lsPut(CHAR_KEY(t), JSON.stringify(s)).then((a) => {
      if (a) return toast("已改名");
      const s = rosterGet(),
        n = s.list.find((a) => a.id === t);
      (n && ((n.name = e), rosterPut(s)),
        toast("儲存空間不足", "bad"),
        ui.refreshIf("more"));
    }));
}
function charDelete(t) {
  const a = rosterGet();
  if (
    ((a.list = a.list.filter((a) => a.id !== t)),
    rosterPut(a),
    stPrune(t, Infinity),
    t !== S.cid)
  ) {
    try {
      localStorage.removeItem(CHAR_KEY(t));
    } catch (t) {}
    return void toast("已刪除角色");
  }
  const s = carry(),
    e = stLoad();
  (acctIn(e, acctNeg(acctOf(S))), stWrite(e), (STH = e));
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (t) {}
  ((S = null), (PS = null), (G = null), charReset());
  for (const t of a.list) {
    const a = charLoad(t.id);
    if (a)
      return (
        charUse(a, t.id, s),
        void toast(`已刪除角色，切換到「${S.name}」`)
      );
  }
  ((ui.pkCarry = s), rosterPut({ list: [] }), showPick());
}
const STASH_KEY = "ro-wanderer.v3.stash",
  ST_K = ["bag", "runes", "slates", "gems"],
  ACCT_V = 2,
  ACCT_D = ["mat", "kl"],
  ST_CAP = { bag: BAG_MAX, runes: 5e3, slates: 5e3, gems: Infinity };
let STH = null;
const stNew = () => ({
  v: 1,
  uid: 1,
  it: [],
  mat: {},
  ash: 0,
  kl: {},
  acct: 0,
  j: {},
  kp: null,
});
function stClean(t) {
  const a = stNew();
  if (!t || "object" != typeof t) return a;
  ((a.it = (Array.isArray(t.it) ? t.it : []).filter(
    (t) =>
      t &&
      ST_K.includes(t.k) &&
      t.o &&
      "object" == typeof t.o &&
      Number.isFinite(t.s),
  )),
    (a.uid = Math.max(+t.uid || 1, ...a.it.map((t) => t.s + 1))));
  for (const s in t.mat || {})
    MATS[s] && +t.mat[s] > 0 && (a.mat[s] = Math.floor(+t.mat[s]));
  ((a.ash = Math.max(0, Math.floor(+t.ash || 0))),
    (a.acct = Math.max(0, Math.min(2, Math.floor(+t.acct || 0)))));
  for (const s in t.kl || {})
    /^\d+_\w+$/.test(s) && +t.kl[s] > 0 && (a.kl[s] = Math.floor(+t.kl[s]));
  for (const s in t.j || {})
    Array.isArray(t.j[s]) &&
      (a.j[s] = t.j[s].filter((t) => t && Number.isFinite(t.x)));
  if (t.kp && "object" == typeof t.kp) {
    a.kp = {};
    for (const s of KP_K) a.kp[s] = Array.isArray(t.kp[s]) ? t.kp[s] : [];
  }
  return a;
}
function stLoad() {
  let t = null;
  try {
    t = JSON.parse(localStorage.getItem(STASH_KEY));
  } catch (t) {}
  return (STH = stClean(t));
}
const stWrite = (t) => {
    try {
      return (localStorage.setItem(STASH_KEY, JSON.stringify(t)), !0);
    } catch (t) {
      return !1;
    }
  },
  stCnt = () => (STH || stLoad()).it.length;
function stApply(t) {
  for (const [a, s] of t.rm || []) S[a] = S[a].filter((t) => t.u !== s);
  for (const [a, s] of t.ad || [])
    (S[a].push(s), (S.uid = Math.max(S.uid, s.u + 1)));
  for (const a in t.mat || {})
    S.mat[a] = Math.max(0, (S.mat[a] || 0) + t.mat[a]);
  t.ash && (S.ash = Math.max(0, (S.ash || 0) + t.ash));
  for (const a in t.kl || {})
    S.kills[a] = Math.max(0, (S.kills[a] || 0) + t.kl[a]);
  S.sx = t.x;
}
function stPrune(t, a) {
  if (!t || !(STH || stLoad()).j[t]?.some((t) => t.x <= a)) return;
  const s = stLoad(),
    e = s.j[t];
  if (!e) return;
  const n = e.filter((t) => t.x > a);
  (n.length ? (s.j[t] = n) : delete s.j[t], stWrite(s));
}
function stRecover() {
  if (!S || !S.cid) return;
  const t = stLoad().j[S.cid],
    a = S.sx || 0;
  if (t) {
    for (const s of t) s.x > a && stApply(s);
    stPrune(S.cid, a);
  }
}
function stDo(t, a) {
  if (!S || !S.cid || tabStale() || inFight()) return !1;
  const s = stLoad();
  return (
    !1 !== a(s) &&
    ((t.x = (S.sx || 0) + 1),
    (s.j[S.cid] ||= []).push(t),
    stWrite(s)
      ? ((STH = s), stApply(t), recalc(), markDirty(), saveNow(), !0)
      : (toast("儲存空間不足", "bad"), stLoad(), !1))
  );
}
const stWc = (t, a) =>
  "bag" === t && "weapon" === a.slot
    ? S.cls
    : "gems" !== t || a.sx
      ? ""
      : SKILLS[a.id].cls || "";
function stPut(t, a) {
  const s = new Set(a.map(Number)),
    e = S[t].filter(
      (a) =>
        s.has(a.u) &&
        !("gems" === t && a.x >= 0) &&
        !("runes" === t && isStaged(a.u)),
    );
  return e.length &&
    stDo({ rm: e.map((a) => [t, a.u]) }, (a) => {
      if (a.it.length + e.length > 500)
        return (toast("倉庫空間不足（上限 500）", "bad"), !1);
      for (const s of e) {
        const e = JSON.parse(JSON.stringify(s)),
          n = stWc(t, s);
        (delete e.nw, n && (e.wc = n), a.it.push({ s: a.uid++, k: t, o: e }));
      }
    })
    ? e.length
    : 0;
}
const stCan = (t) =>
  !t.o.wc ||
  t.o.wc === S.cls ||
  ("gems" === t.k && !!t.o.sx) ||
  ("bag" === t.k && !!UNIQUE[t.o.uq]?.any);
function stTake(t) {
  const a = new Set(t.map(Number)),
    s = (STH || stLoad()).it.filter((t) => a.has(t.s) && stCan(t));
  if (!s.length) return 0;
  for (const t of ST_K) {
    const a = s.filter((a) => a.k === t).length;
    if (a && S[t].length + a > ST_CAP[t])
      return (toast("角色身上空間不足", "bad"), 0);
  }
  const e = s.map((t) => {
      const a = JSON.parse(JSON.stringify(t.o));
      return (
        a.wc && "bag" === t.k && wpnTo(a, a.wc, S.cls),
        delete a.wc,
        (a.u = uid()),
        (a.nw = 1),
        "gems" === t.k && ((a.x = a.y = -1), (a.rot = a.rot || 0)),
        [t.k, a]
      );
    }),
    n = stDo({ ad: e }, (t) => {
      const a = t.it.length;
      if (
        ((t.it = t.it.filter((t) => !s.some((a) => a.s === t.s))),
        t.it.length !== a - s.length)
      )
        return !1;
    });
  return (
    n &&
      (e.some(([t]) => "gems" === t) && ui.badge("skill", 1),
      e.some(([t]) => "gems" !== t) && ui.badge("bag", 1)),
    n ? s.length : 0
  );
}
const acctOf = (t) => ({
    ash: t.ash || 0,
    mat: { ...(t.mat || {}) },
    kl: { ...(t.kills || {}) },
  }),
  acctNeg = (t, a = 0) => {
    const s = { ash: a < 1 ? -(t.ash || 0) : 0, mat: {}, kl: {} };
    if (a < 1)
      for (const a in t.mat || {}) t.mat[a] > 0 && (s.mat[a] = -t.mat[a]);
    for (const a in t.kl || {}) t.kl[a] > 0 && (s.kl[a] = -t.kl[a]);
    return s;
  },
  acctAny = (t) =>
    !!t.ash || ACCT_D.some((a) => Object.keys(t[a] || {}).length > 0),
  acctIn = (t, a) => {
    t.ash -= a.ash || 0;
    for (const s of ACCT_D)
      for (const e in a[s] || {})
        ((t[s][e] = (t[s][e] || 0) - a[s][e]), t[s][e] <= 0 && delete t[s][e]);
  };
function acctPark() {
  if (!S || !S.cid) return !0;
  const t = acctNeg(acctOf(S));
  if (!acctAny(t)) return !0;
  const a = stLoad();
  return (
    (t.x = (S.sx || 0) + 1),
    (a.j[S.cid] ||= []).push(t),
    acctIn(a, t),
    stWrite(a) ? ((STH = a), stApply(t), !0) : (stLoad(), !1)
  );
}
const KP_K = ["keep", "skeep", "rkeep"],
  kpOf = (t) => {
    const a = {};
    for (const s of KP_K) a[s] = t.set[s] || [];
    return a;
  },
  kpN = (t) => KP_K.reduce((a, s) => a + (t[s] || []).length, 0);
let kpLast = "";
function kpPush() {
  if (!S || !S.kpS) return;
  const t = JSON.stringify(kpOf(S));
  if (t === kpLast) return;
  const a = stLoad();
  ((a.kp = JSON.parse(t)), stWrite(a) && (kpLast = t));
}
function kpPull(t) {
  const a = stLoad().kp;
  let s = !!a;
  if (((kpLast = ""), t)) S.kpS = 1;
  else if (!S.kpS) {
    const t = kpOf(S);
    if (a && kpN(a)) {
      if (kpN(t) && JSON.stringify(t) !== JSON.stringify(a))
        return void (S.kpAsk || ((S.kpAsk = 1), kpLater(S.cid)));
      S.kpS = 1;
    } else ((S.kpS = 1), (s = !1));
  }
  if (s)
    for (const t of KP_K) S.set[t] = JSON.parse(JSON.stringify(a[t] || []));
  kpPush();
}
function kpLater(t, a = 0) {
  setTimeout(() => {
    !S ||
      S.cid !== t ||
      S.kpS ||
      ui.kpOn ||
      ($("#sheetBg").hidden && $("#pick").hidden
        ? kpOpen()
        : a < 200 && kpLater(t, a + 1));
  }, 1500);
}
function kpOpen() {
  const t = stLoad().kp;
  S &&
    !S.kpS &&
    t &&
    ((ui.kpOn = 1),
    ($("#sheet").className = "kpp"),
    ($("#sheet").innerHTML =
      `<h2 class="cfh">同步保留規則？</h2><div class="cfl"><div>保留規則已改為所有角色共用</div><div>共用規則 <span class="px">${kpN(t)}</span> 條</div><div>此角色的規則 <span class="px">${kpN(kpOf(S))}</span> 條</div><div>${cfW("同步後，此角色的規則將被共用規則取代")}</div><div>暫不同步：繼續使用此角色的規則</div></div>\n    <div class="row"><button class="btn" data-act="kpNo">暫不同步</button><span class="spacer"></span><button class="btn primary" data-act="kpYes">同步</button></div>`),
    ($("#sheetBg").hidden = !1));
}
function kpAct(t) {
  if (t && "kpYes" === t.dataset.act) {
    const t = stLoad().kp;
    if (t) {
      for (const a of KP_K) S.set[a] = JSON.parse(JSON.stringify(t[a] || []));
      ((S.kpS = 1),
        (ui.bagN = 0),
        (ui.bagTop = 0),
        markDirty(),
        kpPush(),
        toast("已同步保留規則"));
    }
  } else if (t && "kpNo" !== t.dataset.act) return;
  ((ui.kpOn = null),
    ($("#sheetBg").hidden = !0),
    ($("#sheet").className = ""),
    ui.render());
}
function acctPull() {
  if (!S || !S.cid || tabStale()) return;
  const t = stLoad();
  let a = 0;
  if (t.acct < 2) {
    for (const a of rosterGet().list)
      if (a.id !== S.cid) {
        const s = charLoad(a.id);
        if (!s) continue;
        const e = t.j[a.id] || [],
          n = s.sx || 0,
          l = acctOf(s);
        for (const t of e)
          if (t.x > n) {
            l.ash += t.ash || 0;
            for (const a of ACCT_D)
              for (const s in t[a] || {}) l[a][s] = (l[a][s] || 0) + t[a][s];
          }
        const o = acctNeg(l, t.acct);
        if (!acctAny(o)) continue;
        ((o.x = Math.max(n, ...e.map((t) => t.x)) + 1),
          (t.j[a.id] ||= []).push(o),
          acctIn(t, o));
      }
    ((t.acct = 2), (a = 1));
  }
  const s = { ash: t.ash, mat: { ...t.mat }, kl: { ...t.kl } };
  (acctAny(s)
    ? ((s.x = (S.sx || 0) + 1),
      (t.j[S.cid] ||= []).push(s),
      (t.ash = 0),
      (t.mat = {}),
      (t.kl = {}),
      (a = 1))
    : (s.x = 0),
    a && (stWrite(t) ? ((STH = t), s.x && stApply(s)) : stLoad()));
}
const BK_TAG = "aw-save";
function bkData() {
  const t = rosterGet(),
    a = {};
  for (const s of t.list)
    if (!S || s.id !== S.cid) {
      const t = charLoad(s.id);
      t && (a[s.id] = t);
    }
  return (
    S && (S.t = Date.now()),
    {
      k: BK_TAG,
      v: 1,
      ver: "string" == typeof BUILD_VER ? BUILD_VER : "",
      t: Date.now(),
      cur: S,
      chars: a,
      stash: stLoad(),
    }
  );
}
const bkPipe = (t, a, s = "gzip") =>
  new Response(new Blob([t]).stream().pipeThrough(new a(s)))
    .arrayBuffer()
    .then((t) => new Uint8Array(t));
async function bkEncode(t = bkData()) {
  let a = new TextEncoder().encode(JSON.stringify(t)),
    s = "AW0:";
  if ("function" == typeof CompressionStream)
    try {
      ((a = await bkPipe(a, CompressionStream)), (s = "AW1:"));
    } catch (t) {}
  return s + b64(a);
}
const bkClean = (t) =>
    "string" == typeof t
      ? t.replace(/[<>"'`\\]/g, "")
      : Array.isArray(t)
        ? t.map(bkClean)
        : t && "object" == typeof t
          ? Object.fromEntries(
              Object.entries(t).map(([t, a]) => [bkClean(t), bkClean(a)]),
            )
          : t,
  bkOk = (t) =>
    !!(t && "object" == typeof t && CLASS[t.cls] && Number.isFinite(t.lvl));
async function bkDecode(t) {
  const a = /^AW([01]):([A-Za-z0-9+/=]+)$/.exec(
    String(t || "").replace(/\s+/g, ""),
  );
  if (!a) return null;
  try {
    let t = Uint8Array.from(atob(a[2]), (t) => t.charCodeAt(0));
    "1" === a[1] && (t = await bkPipe(t, DecompressionStream));
    const s = bkClean(JSON.parse(new TextDecoder().decode(t)));
    return s &&
      s.k === BK_TAG &&
      bkOk(s.cur) &&
      s.chars &&
      "object" == typeof s.chars
      ? ((s.chars = Object.fromEntries(
          Object.entries(s.chars)
            .filter(
              ([t, a]) =>
                bkOk(a) && /^[a-z0-9]{1,24}$/.test(t) && t !== s.cur.cid,
            )
            .slice(0, CHAR_MAX - 1),
        )),
        /^[a-z0-9]{1,24}$/.test(s.cur.cid || "") || (s.cur.cid = cidNew()),
        (s.stash = stClean(s.stash)),
        s)
      : null;
  } catch (t) {
    return null;
  }
}
async function bkApply(t) {
  TAB.gone = !0;
  for (const [a, s] of Object.entries(t.chars)) s.cid = a;
  const a = await Promise.all(
      [t.cur, ...Object.values(t.chars)].map((t) => lsZip(JSON.stringify(t))),
    ),
    s = [];
  try {
    for (let t = 0; t < localStorage.length; t++) {
      const a = localStorage.key(t);
      a && a.startsWith("ro-wanderer.v3.") && s.push(a);
    }
  } catch (t) {}
  const e = s.map((t) => [t, localStorage.getItem(t)]),
    n = (t) => ({
      id: t.cid,
      name: t.name,
      cls: t.cls,
      lvl: t.lvl,
      tw: (t.tw && t.tw.best) || 0,
    });
  try {
    for (const [t] of e)
      (t === SAVE_KEY ||
        t === ROSTER_KEY ||
        t === STASH_KEY ||
        t.startsWith(CHAR_KEY(""))) &&
        localStorage.removeItem(t);
    (localStorage.setItem(STASH_KEY, JSON.stringify(stClean(t.stash))),
      localStorage.setItem(SAVE_KEY, a[0]),
      Object.keys(t.chars).forEach((t, s) =>
        localStorage.setItem(CHAR_KEY(t), a[s + 1]),
      ),
      localStorage.setItem(
        ROSTER_KEY,
        JSON.stringify({ list: [t.cur, ...Object.values(t.chars)].map(n) }),
      ));
  } catch (t) {
    try {
      for (const [t, a] of e) localStorage.setItem(t, a);
    } catch (t) {}
    return ((TAB.gone = !1), void toast("儲存空間不足，無法載入", "bad"));
  }
  location.reload();
}
function bkSheet(t) {
  ($("#sheetBg").classList.toggle("top", !$("#pick").hidden),
    ($("#sheet").className = "bkp"),
    ($("#sheet").innerHTML = t),
    ($("#sheetBg").hidden = !1));
}
function bkAct(t) {
  return t.startsWith("bkGc")
    ? gcAct(t)
    : t.startsWith("bkMv")
      ? moveAct(t)
      : void 0;
}
const MOVE_HOST = "auto-wanderer.pages.dev",
  MOVE_TO = "https://ro-wanderer.v3.com/",
  MOVE_KEY = "ro-wanderer.v3.moved";
async function moveOut() {
  let t = "",
    a = "";
  try {
    const s = loadLocal(),
      e = localStorage.getItem(MOVE_KEY);
    if (
      (GC.tok &&
        (a = btoa(
          JSON.stringify({
            tok: GC.tok,
            base: GC.base,
            up: GC.up,
            dev: GC.dev,
          }),
        )),
      !e && bkOk(s))
    ) {
      const a = {};
      for (const t of rosterGet().list)
        if (t.id !== s.cid) {
          const s = charLoad(t.id);
          s && (a[t.id] = s);
        }
      t = await bkEncode({
        k: BK_TAG,
        v: 1,
        ver: "string" == typeof BUILD_VER ? BUILD_VER : "",
        t: Date.now(),
        cur: s,
        chars: a,
        stash: stLoad(),
      });
    }
  } catch (t) {
    return !1;
  }
  try {
    localStorage.setItem(MOVE_KEY, "2");
  } catch (t) {}
  const s =
    (window.matchMedia && matchMedia("(display-mode: standalone)").matches) ||
    !0 === navigator.standalone;
  return (
    location.replace(
      MOVE_TO +
        location.search +
        "#awmove:" +
        (s ? 1 : 0) +
        ":" +
        (a ? "G" + a + ":" : "") +
        t,
    ),
    !0
  );
}
function moveIn() {
  const t = /^#awmove:([01]):(?:G([A-Za-z0-9+/=]*):)?(.*)$/.exec(location.hash);
  if (!t) return "";
  try {
    history.replaceState(null, "", location.pathname + location.search);
  } catch (t) {}
  if ("1" === t[1])
    try {
      sessionStorage.setItem("awPwa", "1");
    } catch (t) {}
  if (t[2] && !GC.tok)
    try {
      const a = JSON.parse(atob(t[2]));
      "string" == typeof a.tok &&
        a.tok &&
        (Object.assign(GC, {
          tok: a.tok,
          acc: a.tok.split(".")[0],
          base: +a.base || 0,
          up: +a.up || 0,
        }),
        /^[a-z0-9]{8,32}$/.test(a.dev || "") && (GC.dev = a.dev),
        gcPut(),
        toast("已沿用 Google 雲端存檔綁定"));
    } catch (t) {}
  return t[3];
}
const moveDone = () => {
  try {
    sessionStorage.setItem("awMv", "1");
  } catch (t) {}
};
function moveAsk(t) {
  ((ui.mvO = t),
    bkSheet(
      `<h2 class="cfh">舊網址的存檔</h2><div class="list">${[t.cur, ...Object.values(t.chars)].map((t) => `<div class="li"><b>${esc(t.name || "未命名")}</b><span class="spacer"></span><span style="color:var(--muted)">${CLASS[t.cls].n} <span class="px">LV${t.lvl}</span></span></div>`).join("")}</div>\n    <div class="cfl"><div>遊戲已遷移至新網址</div><div>此處已有另一份存檔</div><div>${cfW("選擇的存檔將取代另一份")}</div></div>\n    <div class="row"><button class="btn" data-act="bkMvKeep">保留此處存檔</button><span class="spacer"></span><button class="btn primary" data-act="bkMvLoad">載入舊網址存檔</button></div>`,
    ));
}
function moveHint() {
  let t = 0,
    a = 0;
  try {
    ((t = sessionStorage.getItem("awPwa")),
      (a = sessionStorage.getItem("awMv")),
      sessionStorage.removeItem("awMv"));
  } catch (t) {}
  if ((a && toast("已從舊網址轉移存檔"), !t || !$("#sheetBg").hidden))
    return gcNag();
  try {
    sessionStorage.removeItem("awPwa");
  } catch (t) {}
  bkSheet(
    '<h2 class="cfh">遊戲已遷移</h2><div class="cfl"><div>新網址 <span class="px">ro-wanderer.v3.com</span></div><div>請將此網址加入主畫面</div><div>可刪除舊的主畫面圖示</div></div>\n    <div class="row"><span class="spacer"></span><button class="btn primary" data-act="close">知道了</button></div>',
  );
}
function moveAct(t) {
  if ("bkMvLoad" === t && ui.mvO) return (moveDone(), bkApply(ui.mvO));
  "bkMvKeep" === t && ((ui.mvO = null), gcClose(), moveHint());
}
const GC_ID = "",
  GC_KEY = "ro-wanderer.v3.cloud",
  GC_EVERY = 3e5,
  GC = {
    tok: "",
    acc: "",
    base: 0,
    up: 0,
    dev: "",
    busy: 0,
    tried: 0,
    ask: 0,
    err: "",
  };
try {
  const t = JSON.parse(localStorage.getItem(GC_KEY));
  t &&
    Object.assign(GC, {
      tok: t.tok || "",
      acc: t.acc || (t.tok || "").split(".")[0],
      base: t.base || 0,
      up: t.up || 0,
      dev: t.dev || "",
    });
} catch (t) {}
/^[a-z0-9]{8,32}$/.test(GC.dev) ||
  (GC.dev = [...crypto.getRandomValues(new Uint8Array(16))]
    .map((t) => (t % 36).toString(36))
    .join(""));
const GC_ERR = {
    auth: "Google 登入已過期，請重新綁定",
    nokey: "雲端存檔尚未開放",
    nodb: "雲端存檔尚未開放",
    big: "存檔太大，無法上傳",
    cred: "Google 登入失敗",
    google: "暫時無法連線 Google",
    net: "暫時無法連線雲端",
  },
  gcOn = () => lbOn() && !!GC.tok,
  gcClose = () => {
    (($("#sheetBg").hidden = !0), ($("#sheet").className = ""));
  },
  gcPut = () => {
    try {
      localStorage.setItem(
        GC_KEY,
        JSON.stringify({
          tok: GC.tok,
          acc: GC.acc,
          base: GC.base,
          up: GC.up,
          dev: GC.dev,
        }),
      );
    } catch (t) {}
  },
  gcInApp = () =>
    /FBAN|FBAV|Instagram|Barcelona|Threads|Line\/|MicroMessenger|; wv\)/i.test(
      navigator.userAgent,
    ),
  gcTime = (t) => {
    const a = new Date(t);
    return `${a.getMonth() + 1}/${a.getDate()} ${String(a.getHours()).padStart(2, "0")}:${String(a.getMinutes()).padStart(2, "0")}`;
  },
  gcApi = (t, a, s = "") =>
    fetch("api/save" + s, {
      method: t,
      cache: "no-store",
      body: a ? JSON.stringify(a) : void 0,
      headers: {
        "content-type": "application/json",
        ...(GC.tok ? { authorization: "Bearer " + GC.tok } : {}),
      },
    })
      .then((t) => t.json())
      .catch(() => ({ err: "net" }));
function gcOut(t) {
  ((GC.tok = ""),
    (GC.up = 0),
    (GC.ask = 0),
    gcPut(),
    t && toast(t, "bad"),
    ui.refreshIf("more"));
}
async function gcUpload(t) {
  if (!gcOn() || !S || TAB.gone || GC.busy || (GC.ask && !t)) return !1;
  ((GC.busy = 1), (GC.tried = Date.now()));
  let a = !1;
  try {
    if ((await GC.cl, GC.ask && !t)) throw 0;
    const s = await gcApi("PUT", {
      code: await bkEncode(),
      base: t ? -1 : GC.base,
      dev: GC.dev,
      ver: "string" == typeof BUILD_VER ? BUILD_VER : "",
    });
    s.t && !s.err
      ? ((GC.base = s.t),
        (GC.up = Date.now()),
        (GC.err = ""),
        gcPut(),
        (a = !0))
      : "dev" === s.err
        ? gcKick()
        : "old" === s.err
          ? gcAsk()
          : "auth" === s.err
            ? gcOut(GC_ERR.auth)
            : "slow" !== s.err && (GC.err = GC_ERR[s.err] || GC_ERR.net);
  } catch (t) {
    0 !== t && (GC.err = GC_ERR.net);
  }
  return ((GC.busy = 0), ui.refreshIf("more"), a);
}
const gcTick = () => {
  gcOn() && Date.now() - GC.tried > 3e5 && gcUpload();
};
function gcCheck() {
  !gcOn() ||
    GC.ask ||
    TAB.gone ||
    (GC.cl = gcApi("PATCH", { dev: GC.dev }).then((t) => {
      if ("auth" === t.err) return gcOut(GC_ERR.auth);
      t.err || (t.t && t.t !== GC.base ? gcAsk() : !t.t && S && gcUpload());
    }));
}
function gcKick() {
  if (TAB.gone) return;
  (S && saveNow(!0),
    (TAB.gone = !0),
    AU.ctx && AU.ctx.suspend().catch(() => {}),
    gcClose());
  const t = $("#pick");
  ((t.innerHTML =
    '<h1>遊戲在另一台裝置進行中</h1><p class="sub">同一 Google 帳號同時僅能在一台裝置遊玩。</p><button class="btn primary" id="tabBack">在這裡繼續</button>'),
    (t.hidden = !1),
    ($("#tabBack").onclick = () => location.reload()));
}
async function gcAsk() {
  GC.ask = 1;
  const t = await gcApi("GET"),
    a = t.code && (await bkDecode(t.code));
  if ("auth" === t.err) return gcOut(GC_ERR.auth);
  if (!a)
    return (
      (GC.ask = 0),
      void (null === t.code && S
        ? gcUpload()
        : S || toast("此 Google 帳號尚無雲端存檔"))
    );
  ((ui.gcO = a), (ui.gcT = t.t));
  const s = [a.cur, ...Object.values(a.chars)],
    e = S
      ? [
          S,
          ...rosterGet()
            .list.filter((t) => t.id !== S.cid)
            .map((t) => charLoad(t.id))
            .filter(Boolean),
        ]
      : [],
    n = (t) =>
      `<div class="list">${t.map((t) => `<div class="li"><b>${esc(t.name || "未命名")}</b><span class="spacer"></span><span style="color:var(--muted)">${CLASS[t.cls].n} <span class="px">LV${t.lvl}</span></span></div>`).join("")}</div>`;
  ((ui.gcH = `<h2 class="cfh">雲端有另一份存檔</h2>${e.length ? `<p class="note" style="margin:0">這台裝置</p>${n(e)}` : ""}\n    <p class="note" style="margin:0">雲端 <span class="px">${gcTime(t.t)}</span></p>${n(s)}\n    ${S ? `<div class="cfl"><div>${cfW("選擇的存檔將取代另一份")}</div></div>` : ""}\n    <div class="row">${S ? '<button class="btn" data-act="bkGcKeep">保留本機存檔</button>' : '<button class="btn" data-act="close">取消</button>'}<span class="spacer"></span><button class="btn primary" data-act="${S ? "bkGcAsk" : "bkGcLoad"}">載入雲端</button></div>`),
    (ui.gcLow =
      !!S &&
      Math.max(...s.map((t) => t.lvl)) < Math.max(...e.map((t) => t.lvl))),
    bkSheet(ui.gcH));
}
const GC_NAG = "ro-wanderer.v3.gcNag",
  MOVED_AT = Date.UTC(2026, 9, 13);
function gcNag() {
  if (lbOn() && !GC.tok && S && S.born < MOVED_AT && $("#sheetBg").hidden) {
    try {
      if (localStorage.getItem(GC_NAG)) return;
      localStorage.setItem(GC_NAG, "1");
    } catch (t) {
      return;
    }
    bkSheet(
      `<h2 class="cfh">重新綁定 Google</h2><div class="cfl"><div>遊戲已遷移至新網址</div><div>舊網址綁定的 Google 須重新綁定</div><div>綁定後更換裝置也能載入存檔</div>\n    <div>${cfW("雲端有舊存檔時，選「保留本機存檔」")}</div></div>\n    <div class="row"><button class="btn" data-act="close">稍後</button><span class="spacer"></span><button class="btn primary" data-act="bkGcIn">綁定 Google</button></div>`,
    );
  }
}
function gsiLoad() {
  return window.google && google.accounts && google.accounts.oauth2
    ? Promise.resolve()
    : gsiLoad.p
      ? gsiLoad.p
      : (gsiLoad.p = new Promise((t, a) => {
          const s = document.createElement("script");
          ((s.src = "https://accounts.google.com/gsi/client"),
            (s.async = !0),
            (s.onload = t),
            (s.onerror = () => {
              ((gsiLoad.p = null), a());
            }),
            document.head.appendChild(s));
        }));
}
const GC_G = (() => {
  const t = { r: "#ea4335", y: "#fbbc05", g: "#34a853", b: "#4285f4" };
  let a = "";
  return (
    [
      "..rrrr..",
      ".r....r.",
      "r.......",
      "y...bbbb",
      "y......b",
      "y......b",
      ".g....b.",
      "..gggg..",
    ].forEach((s, e) =>
      [...s].forEach((s, n) => {
        t[s] &&
          (a += `<rect x="${n}" y="${e}" width="1" height="1" fill="${t[s]}"/>`);
      }),
    ),
    "data:image/svg+xml," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" shape-rendering="crispEdges">${a}</svg>`,
      )
  );
})();
function gcLoginOpen() {
  lbOn()
    ? (bkSheet(
        `<h2 class="cfh">綁定 Google</h2><div class="cfl"><div>所有角色自動備份到雲端</div><div>更換裝置時登入同一帳號即可載入</div><div>僅記錄帳號識別碼，不儲存 Email</div>\n    ${gcInApp() ? `<div>${cfW("App 內瀏覽器無法登入 Google")}</div><div>${cfW("請改用 Chrome 或 Safari 開啟")}</div>` : ""}</div>\n    <div class="row"><span class="spacer"></span><a href="privacy/" target="_blank" rel="noopener" style="color:var(--muted)">隱私權政策</a></div>\n    <p class="note" id="bkErr" style="margin:0;color:var(--bad)" hidden></p>\n    <div class="row"><button class="btn" data-act="close">取消</button><span class="spacer"></span><button class="btn primary" data-act="bkGcGo"><img src="${GC_G}" alt="" style="width:16px;height:16px;vertical-align:-3px;margin-right:6px;image-rendering:pixelated;background:#fff;padding:0">用 Google 登入</button></div>`,
      ),
      gsiLoad().catch(() => gcLoginErr("無法連線 Google，請稍後再試")))
    : toast("雲端存檔只能在網頁版使用", "bad");
}
const gcLoginErr = (t) => {
  const a = $("#bkErr");
  a && ((a.textContent = t), (a.hidden = !1));
};
function gcGo() {
  if (!(window.google && google.accounts && google.accounts.oauth2))
    return (
      gcLoginErr("正在連線 Google，請再按一次"),
      void gsiLoad().catch(() => {})
    );
  (GC.tc ||
    (GC.tc = google.accounts.oauth2.initTokenClient({
      client_id: GC_ID,
      scope: "openid",
      callback: (t) =>
        t && t.access_token
          ? gcLogin({ at: t.access_token })
          : gcLoginErr("Google 登入失敗"),
      error_callback: (t) =>
        gcLoginErr(
          t && "popup_closed" === t.type
            ? "登入已取消"
            : "無法開啟 Google 登入視窗",
        ),
    })),
    GC.tc.requestAccessToken({ prompt: "select_account" }));
}
async function gcLogin(t) {
  const a = await gcApi("POST", t);
  if (!a.tok) return void gcLoginErr(GC_ERR[a.err] || GC_ERR.net);
  const s = a.tok.split(".")[0];
  (s !== GC.acc && (GC.base = 0),
    (GC.tok = a.tok),
    (GC.acc = s),
    (GC.err = ""),
    gcPut(),
    gcClose(),
    !a.t || (a.t === GC.base && S)
      ? S
        ? (await gcUpload()) && toast("已綁定 Google，存檔已上傳")
        : toast("已綁定 Google，雲端尚無存檔")
      : gcAsk(),
    ui.refreshIf("more"));
}
async function gcAct(t) {
  if ("gcIn" === t) return gcLoginOpen();
  if ("bkGcGo" === t) return gcGo();
  if ("bkGcIn" === t) return gcLoginOpen();
  if ("bkGcAsk" === t)
    return bkSheet(
      cfCard(
        "載入雲端存檔？",
        "",
        [
          cfW("本機角色將由雲端存檔取代"),
          ui.gcLow && cfW("雲端存檔等級低於本機"),
        ],
        "載入雲端",
        "bkGcLoad",
        "bkGcBack",
      ),
    );
  if ("bkGcBack" === t) return ui.gcH && bkSheet(ui.gcH);
  if ("gcUp" !== t) {
    if ("gcOff" === t)
      return (gcOut(), void toast("已登出 Google，雲端存檔仍保留"));
    if ("gcDel" === t)
      return bkSheet(
        cfCard(
          "刪除雲端存檔？",
          "",
          [
            cfW("雲端存檔會永久刪除"),
            "這台裝置的存檔不受影響",
            "同時登出 Google",
          ],
          "刪除",
          "bkGcDel",
          "close",
        ),
      );
    if ("bkGcDel" === t) {
      const t = await gcApi("DELETE");
      return (
        gcClose(),
        void (t.ok || "auth" === t.err
          ? ((GC.base = 0), gcOut(), toast("已刪除雲端存檔"))
          : toast(GC_ERR[t.err] || GC_ERR.net, "bad"))
      );
    }
    if ("bkGcKeep" === t)
      return (
        gcClose(),
        (GC.ask = 0),
        void ((await gcUpload(!0))
          ? toast("已用本機存檔取代雲端存檔")
          : toast(GC.err || GC_ERR.net, "bad"))
      );
    "bkGcLoad" === t &&
      ui.gcO &&
      ((GC.base = ui.gcT),
      (GC.ask = 0),
      (GC.up = Date.now()),
      gcPut(),
      bkApply(ui.gcO));
  } else {
    if (GC.ask) return gcAsk();
    if (await gcUpload()) toast("已上傳雲端存檔");
    else {
      if (GC.ask) return;
      toast(GC.err || "剛才已上傳", GC.err ? "bad" : "");
    }
  }
}
function offlineGains(t, a, s) {
  if (t < 60 || !S) return;
  const e = Math.min(480, t / 60),
    n = mapLv(),
    l = (n[0] + n[1]) / 2,
    o = slateSum("elite") / 100,
    r = rosterGet().list.some((t) => t.lvl >= LV_CAP),
    i = r ? 1 : 0.75,
    c = e * Math.min(S.kpm || 6, 250),
    d = r || S.map >= MAP_N - 1 || slatesOn().length ? LV_CAP : MAPS[S.map].lv[1],
    f = Math.floor(c * i),
    p = s ? 0 : Math.floor(0.25 * c);
  if (f <= 0) return;
  const u =
      (3 + 1.5 * l) * Math.max(0.1, 1 - 0.08 * Math.max(0, Math.min(S.lvl, 100) - l - 5)),
    h = S.lvl,
    m = S.ash,
    A = ses();
  let g = 0;
  for (let t = f * u; t > 0 && S.lvl < Math.min(LV_CAP, d);) {
    const a = Math.min(t, xpNeed(S.lvl) - S.xp);
    ((S.xp += a),
      (g += a),
      (t -= a),
      S.xp >= xpNeed(S.lvl) && ((S.xp -= xpNeed(S.lvl)), S.lvl++));
  }
  recalc();
  const v = [],
    b = {};
  let k = 0,
    x = 0,
    y = 0,
    w = 0;
  for (let t = 0; t < p; t++) {
    const t = ri(n[0], n[1]),
      a = RAND() < 0.08 + o;
    for (const s of rollKillDrops(a))
      v.push(...rollItem(t, Object.assign({}, s, { off: 1 })));
    for (const s of rollMats(t, !1, a)) b[s] = (b[s] || 0) + 1;
    const s = rollSlate(t, a, !1);
    s && "bag" === takeSlate(s) && k++;
    const e = rollTicket(t, a, !1);
    (e >= 0 && (S.gd.t[e]++, x++),
      ssMap() && RAND() < SS.frag && S.ssf[ri(0, GODS.length - 1)]++);
    const l = rollMut(a, !1);
    l && ((l.nw = 1), S.gems.push(l), y++);
    const r = rollSx({ lv: 0 }, a, !1);
    r && ((r.nw = 1), S.gems.push(r), w++);
  }
  const M = (t) => (t.uq ? 6 : t.sock ? 5 : t.rar);
  v.sort(
    (t, a) =>
      autoSalv(t) - autoSalv(a) ||
      keepMatch(a) - keepMatch(t) ||
      M(a) - M(t) ||
      a.ilvl - t.ilvl,
  );
  let B = 0;
  const C = new Set();
  for (const t of v) "bag" === takeItem(t) && (B++, C.add(t));
  for (const t in b) S.mat[t] = (S.mat[t] || 0) + b[t];
  autoMergeP();
  const G = S.ash - m;
  (ssMap() || (S.prog[S.map] = Math.min(bossNeed(S.map), S.prog[S.map] + f)),
    (S.total += f),
    slateKills(f),
    (A.k += f),
    (A.xp += g),
    (A.t += 60 * e),
    (A.off += 60 * e),
    (S.mt[S.map] = (S.mt[S.map] || 0) + 60 * e),
    recalc(),
    (S.hp = PS.maxhp),
    (B || k) && ui.badge("bag", 1),
    (y || w) && ui.badge("skill", 1));
  const R = ["普通", "魔法", "稀有", "傳奇", "", "插槽", "獨特"],
    T = {};
  for (const t of C) T[M(t)] = (T[M(t)] || 0) + 1;
  const L = [6, 5, 3, 2, 1, 0]
    .filter((t) => T[t])
    .map((t) => `<dt>${R[t]}</dt><dd>${T[t]}</dd>`)
    .join("");
  if (a)
    return (
      toast(`離線收益：擊殺 ${fmt(f)}・經驗 +${fmt(g)}`),
      saveNow(),
      void ui.refreshIf("bag", "alch")
    );
  const O = Object.keys(b)
    .sort()
    .map((t) => `${MATS[t].n} ×${b[t]}`)
    .join("<br>");
  (($("#sheet").className = "offp"),
    ($("#sheet").innerHTML =
      `<h2>離線收益<button class="hbtn" data-act="hp" data-k="off" aria-label="說明">?</button></h2><p class="note">離線 ${Math.round(e)} 分鐘（上限 8 小時）。</p>${s ? '<p class="note">未使用的角色離線時沒有掉落。</p>' : ""}\n    <dl class="kv box"><dt>效率</dt><dd>經驗 ${Math.round(100 * i)}%・掉落 ${s ? 0 : Math.round(25)}%</dd><dt>擊殺</dt><dd>${f}</dd><dt>經驗</dt><dd>${fmt(g)}</dd><dt>等級</dt><dd>${h} - ${S.lvl}${S.lvl >= d && d < 100 ? "（地圖上限）" : ""}</dd>\n    ${s ? "" : `<dt>裝備</dt><dd>掉落 ${v.length}・放入背包 ${B}</dd>\n    <dt>分解</dt><dd>${v.length - B} 件 → Zeny +${G}</dd>`}${O ? `<dt>材料</dt><dd>${O}</dd>` : ""}${k ? `<dt>石板</dt><dd>${k}</dd>` : ""}${x ? `<dt>印記</dt><dd>${GUARD[guardOf(S.map)].tk} ×${x}</dd>` : ""}${y ? `<dt>變異寶石</dt><dd>${y}</dd>` : ""}${w ? `<dt>穿梭寶石</dt><dd>${w}</dd>` : ""}</dl>\n    ${L ? `<h3>放入背包</h3><dl class="kv k4 box">${L}</dl>` : ""}\n    ${B && S.bag.length >= BAG_MAX ? '<p class="note">背包已滿，其餘裝備已自動分解。</p>' : ""}\n    <div class="row" style="margin-top:12px"><button class="btn primary" data-act="close">收下</button></div>`),
    ($("#sheetBg").hidden = !1),
    saveNow(),
    ui.refreshIf("bag", "alch"));
}
let TERM = 0;
const TM_KEY = "aw.term",
  termSaved = () => {
    try {
      return "1" === localStorage.getItem(TM_KEY);
    } catch (t) {
      return !1;
    }
  },
  TM = { cols: 58, minR: 34, lh: 1.3, cw: 0.6, t: 0, v: -1, h: "" },
  TM_FONT =
    'ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono","DejaVu Sans Mono",monospace',
  TM_C = {
    r0: "#9d9d9d",
    r1: "#569cd6",
    r2: "#dcdcaa",
    r3: "#ce9178",
    r4: "#f44747",
    ru: "#c586c0",
    rm: "#f44747",
    rs: "#4ec9b0",
    ra: "#b5cea8",
    lvl: "#6a9955",
    bad: "#f44747",
  },
  tmCol = (t) =>
    TM_C[(String(t).match(/\b(r[0-4]|ru|rm|rs|ra|lvl|bad)\b/) || [])[1]] ||
    "#d4d4d4",
  tmEsc = (t) =>
    String(t).replace(
      /[&<>]/g,
      (t) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[t],
    ),
  tmSpan = (t, a) => `<span style="color:${a}">${tmEsc(t)}</span>`;
function termSet(t) {
  if ((t = t ? 1 : 0) !== TERM) {
    t && ZEN && zenSet(!1);
    try {
      localStorage.setItem(TM_KEY, t ? "1" : "0");
    } catch (t) {}
    ((TERM = t),
      (zenWH = t && G ? [G.W, G.H] : null),
      document.body.classList.toggle("term", !!t),
      ($("#term").hidden = !t),
      t &&
        (termLog("點左上角或最下方的 exit 離開（電腦按 Esc）"),
        (TM.v = -1),
        (TM.h = ""),
        termFit(),
        termDraw()),
      G && layout());
  }
}
function termFit() {
  const t = document.createElement("canvas").getContext("2d");
  ((t.font = "100px " + TM_FONT),
    (TM.cw = t.measureText("M").width / 100 || 0.6));
  const a = innerWidth - 12,
    s = innerHeight - 12,
    e = Math.max(
      6,
      Math.min(a / ((TM.cols + 2) * TM.cw), s / ((TM.minR + 2) * TM.lh)),
    ),
    n = $("#term .tmWin");
  ((n.style.fontSize = e.toFixed(2) + "px"),
    (n.style.width = Math.ceil((TM.cols + 2) * TM.cw * e) + "px"));
}
const tmBar = (t, a) => {
    const s = Math.round(clamp(t, 0, 1) * a);
    return "[" + "|".repeat(s) + ".".repeat(a - s) + "]";
  },
  tmPad = (t, a) => String(t).padStart(a),
  tmHms = (t) => t.map((t) => String(t).padStart(2, "0")).join(":"),
  tmClock = (t) => {
    const a = new Date(t);
    return tmHms([a.getHours(), a.getMinutes(), a.getSeconds()]);
  };
function termDraw() {
  if (!TERM || !S || !G) return;
  const t = "#808080",
    a = ses(),
    s = Math.floor(a.t),
    e = Math.max(0, S.hp) / PS.maxhp,
    n = [
      `${tmSpan("up", t)} ${tmHms([Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60])}  ${tmSpan("lvl", t)} ${S.lvl}  ${tmSpan("kills", t)} ${a.k}  ${tmSpan("ash", t)} ${fmt(S.ash)}`,
      `${tmSpan("hp ", t)} ${tmSpan(tmBar(e, 24), e < 0.35 ? "#f44747" : "#6a9955")} ${Math.ceil(Math.max(0, S.hp))}/${Math.round(PS.maxhp)}`,
      `${tmSpan("xp ", t)} ${tmSpan(tmBar(S.lvl >= LV_CAP ? 1 : S.xp / xpNeed(S.lvl), 24), "#569cd6")} ${S.lvl >= LV_CAP ? "max" : ((S.xp / xpNeed(S.lvl)) * 100).toFixed(1) + "%"}`,
      alive(G.boss)
        ? `${tmSpan("boss", "#f44747")} ${tmSpan(tmBar(G.boss.hp / G.boss.max, 24), "#f44747")} ${((G.boss.hp / G.boss.max) * 100).toFixed(0)}%`
        : `${tmSpan("map", t)} ${String(G.tw ? "tower" : S.map + 1).padStart(2, "0")} ${tmEsc(curMap().n)}${G.dead ? tmSpan("  respawning…", "#f44747") : ""}`,
    ].join("\n"),
    l = $("#term");
  ((l.querySelector(".tmHd").innerHTML = n),
    TM.v !== TM_LOG.v &&
      ((TM.v = TM_LOG.v),
      (l.querySelector(".tmLog").innerHTML = TM_LOG.slice(-90)
        .map((a) => {
          const s = /^獲得|分解/.test(a.m)
              ? "loot"
              : /任務/.test(a.m)
                ? "task"
                : /王|BOSS|Boss|擊敗|挑戰/.test(a.m)
                  ? "boss"
                  : /Lv|等級|升級/.test(a.m)
                    ? "lvup"
                    : "game",
            e = /\bbad\b/.test(a.c)
              ? tmSpan("ERROR", "#f44747")
              : /\b(r3|r4|ru|rm|ra|rs)\b/.test(a.c)
                ? tmSpan("WARN ", "#dcdcaa")
                : tmSpan("INFO ", "#569cd6");
          return `<div>${tmSpan(tmClock(a.t), "#6a6a6a")} ${e} ${tmSpan("[" + s + "]", "#4ec9b0")} ${tmSpan(a.m, tmCol(a.c || "r0"))}${a.n > 1 ? tmSpan(" x" + a.n, t) : ""}</div>`;
        })
        .join(""))));
}
function termBoot() {
  (document.body.insertAdjacentHTML(
    "beforeend",
    `<div id="term" hidden><div class="tmWin" style="font-family:${TM_FONT.replace(/"/g, "'")}">\n    <div class="tmBar"><b class="tmDots" title="離開摸魚模式"><i></i><i></i><i></i></b><span>wanderer@prod-07: ~/svc/loot-worker — zsh</span></div>\n    <pre class="tmHd"></pre>\n    <div class="tmSep">-- tail -f /var/log/loot-worker.log --</div>\n    <div class="tmLog"></div>\n    <pre class="tmPs"><span style="color:#6a9955">wanderer@prod-07</span>:<span style="color:#569cd6">~/svc</span>$ <span class="tmCur">█</span><span class="tmSug">exit</span></pre></div></div>`,
  ),
    $("#term .tmDots").addEventListener("click", () => termSet(!1)),
    $("#term .tmPs").addEventListener("click", () => termSet(!1)),
    window.addEventListener("keydown", (t) => {
      "INPUT" !== t.target.tagName &&
        "TEXTAREA" !== t.target.tagName &&
        ("`" === t.key && S && G
          ? termSet(!TERM)
          : "Escape" === t.key && TERM && termSet(!1));
    }),
    window.addEventListener("resize", () => {
      TERM && termFit();
    }));
}
const cv = $("#stage"),
  ctx = cv.getContext("2d");
let UZ = 1,
  ZEN = 0,
  zenWH = null;
const ZEN_IDLE = 9e5;
function zenSet(t) {
  ((ZEN = t ? 1 : 0),
    (zenWH = t && G ? [G.W, G.H] : null),
    document.body.classList.toggle("zen", !!t));
  const a = $("#zenHint");
  (clearTimeout(zenSet.t),
    a.classList.remove("out"),
    (a.hidden = !t),
    t &&
      (zenSet.t = setTimeout(() => {
        (a.classList.add("out"),
          (zenSet.t = setTimeout(() => {
            a.hidden = !0;
          }, 800)));
      }, 2200)),
    G && layout());
}
const HT = { k: null, t: 0, h: "" };
function hudHitAt(t) {
  const a = cv.getBoundingClientRect();
  if (!a.width || ZEN) return null;
  const s = ((t.clientX - a.left) / a.width) * cv.width,
    e = ((t.clientY - a.top) / a.height) * cv.height,
    n = "mouse" === t.pointerType ? 0 : 3;
  let l = null,
    o = 1e9;
  for (const t of HUD_HIT) {
    if (s < t.x - n || s > t.x + t.w + n || e < t.y - n || e > t.y + t.h + n)
      continue;
    const a = Math.abs(s - t.x - t.w / 2);
    a < o && ((o = a), (l = t));
  }
  return l;
}
function hudTip(t, a) {
  const s = $("#hudTip");
  if (
    ((HT.k = t ? t.k : null),
    (HT.t = a ? Date.now() + 3e3 : 0),
    (HT.h = ""),
    !t)
  )
    return void (s.hidden = !0);
  const e = cv.getBoundingClientRect(),
    n = $("#stageWrap").getBoundingClientRect(),
    l = e.width / cv.width,
    o = e.left - n.left + (t.x + t.w / 2) * l;
  ((s.style.top = (e.top - n.top + (t.y + t.h + 2) * l) / UZ + "px"),
    o > n.width / 2
      ? ((s.style.left = "auto"),
        (s.style.right =
          Math.max(4, n.width - (e.left - n.left + (t.x + t.w + 3) * l)) / UZ +
          "px"))
      : ((s.style.right = "auto"),
        (s.style.left =
          Math.max(4, e.left - n.left + (t.x - 3) * l) / UZ + "px")),
    (s.hidden = !1),
    hudTipTick());
}
function hudTipTick() {
  if (null == HT.k) return;
  const t = HUD_HIT.find((t) => t.k === HT.k);
  if (!t || ZEN || DBV.on || (HT.t && Date.now() > HT.t))
    return void hudTip(null);
  const [a, s, e] = t.t(),
    n =
      `<b style="color:${e}">${a}</b>` +
      s.map((t) => `<div>${t}</div>`).join("");
  n !== HT.h && ((HT.h = n), ($("#hudTip").innerHTML = n));
}
function eliteTags() {
  const t = $("#tags"),
    a = G.dead ? [] : G.mobs.filter((t) => t.ea && t.spawnT <= 0);
  for (; t.children.length < a.length;) {
    const a = document.createElement("div");
    ((a.className = "etag"), t.appendChild(a));
  }
  const s = cv.offsetWidth / cv.width,
    e = (t.clientWidth - cv.offsetWidth) / 2,
    n = (t.clientHeight - cv.offsetHeight) / 2,
    l = Math.round(G.cy || 0);
  [...t.children].forEach((t, o) => {
    const r = a[o],
      i = r ? r.y - r.h - 9 - l : 0;
    if (((t.hidden = !r || i < 40), t.hidden)) return;
    const c = r.ea.join();
    (t.dataset.k !== c &&
      ((t.dataset.k = c),
      (t.innerHTML = r.ea
        .map(
          (t) => `<span style="color:${ELITE_AF[t].c}">${ELITE_AF[t].n}</span>`,
        )
        .join("・"))),
      (t.style.left = (e + r.x * s) / UZ + "px"),
      (t.style.top = (n + i * s) / UZ + "px"));
  });
}
function layout() {
  const t = $("#stageWrap"),
    a = t.clientWidth || 360,
    s = t.clientHeight || 260;
  if (zenWH) {
    const [e, n] = zenWH,
      l = Math.max(1, Math.floor(Math.min((a + 4) / e, (s + 4) / n)));
    return (
      (UZ = Math.max(1, Math.floor(l / 2))),
      t.style.setProperty("--uz", UZ),
      G && (G.VH = n),
      (cv.width === e && cv.height === n && cv.style.width === e * l + "px") ||
        ((cv.width = e),
        (cv.height = n),
        (cv.style.width = e * l + "px"),
        (cv.style.height = n * l + "px"),
        (ctx.imageSmoothingEnabled = !1)),
      [e, n]
    );
  }
  const e =
    document.body.classList.contains("sk") &&
    !matchMedia("(min-width:700px) and (min-aspect-ratio:5/4)").matches;
  e || (ui.fullH = [s, innerWidth]);
  const n = e
      ? Math.max(
          s,
          ui.fullH && ui.fullH[1] === innerWidth
            ? ui.fullH[0]
            : clamp(0.41 * innerHeight, 230, 380),
        )
      : s,
    l = Math.max(
      2,
      Math.round(Math.min(a / 250, n / 185)),
      Math.min(Math.round(Math.sqrt((a * n) / 4e4)), Math.floor(n / 160)),
    ),
    o = Math.ceil(a / l),
    r = Math.ceil(n / l),
    i = Math.min(r, Math.ceil(s / l));
  if (
    ((UZ = Math.max(1, Math.floor(l / 2))),
    t.style.setProperty("--uz", UZ),
    G && (G.VH = i),
    cv.width === o &&
      cv.height === i &&
      cv.style.width === o * l + "px" &&
      (!G || G.H === r))
  )
    return [o, r];
  if (
    ((cv.width = o),
    (cv.height = i),
    (cv.style.width = o * l + "px"),
    (cv.style.height = i * l + "px"),
    (ctx.imageSmoothingEnabled = !1),
    G && (G.W !== o || G.H !== r))
  ) {
    ((G.W = o), (G.H = r), (G.ground = null), inArena(G.pl));
    for (const t of G.mobs) inArena(t);
  }
  return [o, r];
}
const PK_ST = Object.assign(["生命", "射程", "範圍"], {
    sword: [5, 1, 3],
    bow: [3, 5, 2],
    mage: [2, 4, 5],
  }),
  PK_TITLE =
    '<div class="pkTitle"><h1>流浪仙境</h1><p class="en">RAGNAROK WANDERER</p><p class="sub">放置刷寶構築</p></div>';
function showPick(t = "first") {
  const a = $("#pick");
  ui.pickMode = t;
  const s = (t) =>
    `<div class="pkName"><label for="pkName">角色名稱</label><input id="pkName" class="txt" maxlength="8" autocomplete="off" placeholder="1～8 個字" value="${esc(t || "")}"></div><p class="sub pkErr" id="pkErr"></p>`;
  if ("name" === t)
    return (
      (a.innerHTML = `${PK_TITLE}<p class="sub">現已開放建立多個角色</p><p class="sub">請為你的${CLASS[S.cls].n}命名</p>${s(S.lb && S.lb.name)}<button class="btn primary" data-act="pkOk">確定</button>`),
      void (a.hidden = !1)
    );
  ((a.innerHTML = `${PK_TITLE}${s("")}<p class="sub pkHd">選擇你的職業</p>\n    <div class="cls">${Object.keys(
    CLASS,
  )
    .map(
      (t) =>
        `<button data-cls="${t}"><span class="pkWell"><canvas data-spr="${t}" width="16" height="20"></canvas></span><span class="pkInfo"><b>${CLASS[t].n}</b><span class="pkTags">${CLASS[
          t
        ].d
          .split("・")
          .map((t) => `<em>${t}</em>`)
          .join("")}</span>${PK_ST.map((a, s) => {
          return `<span class="pkSt">${a}${((e = PK_ST[t][s]), `<i class="pips">${"<u></u>".repeat(e)}${"<s></s>".repeat(5 - e)}</i>`)}</span>`;
          var e;
        }).join("")}</span></button>`,
    )
    .join("")}</div>`),
    "new" === t
      ? a.insertAdjacentHTML(
          "beforeend",
          '<button class="btn" data-act="pkBack">返回</button>',
        )
      : "first" === t &&
        lbOn() &&
        !gcOn() &&
        a.insertAdjacentHTML(
          "beforeend",
          '<button class="btn" data-act="pkGc">已有存檔？用 Google 載入</button>',
        ),
    a
      .querySelectorAll("canvas[data-spr]")
      .forEach((t) =>
        t.getContext("2d").drawImage(SP.hero[t.dataset.spr].down[0], 0, 0),
      ),
    (a.hidden = !1));
}
function pickClick(t) {
  if (t.target.closest('[data-act="pkBack"]'))
    return void ($("#pick").hidden = !0);
  if (t.target.closest('[data-act="pkGc"]')) return void gcLoginOpen();
  const a = t.target.closest('[data-act="pkOk"]'),
    s = t.target.closest("[data-cls]");
  if (!a && !s) return;
  const e = "name" === ui.pickMode,
    [n, l] = nameCheck($("#pkName").value, e && S ? S.cid : null);
  if (!n) return (($("#pkErr").textContent = l), void $("#pkName").focus());
  if (e)
    return (
      (S.name = n),
      markDirty(),
      saveNow(),
      ($("#pick").hidden = !0),
      (ui.needs = !0),
      void toast(`你好，${n}！`, "lvl")
    );
  const o = carry(),
    r = () => {
      const t = applyCarry(newState(s.dataset.cls), o);
      ((t.name = n), (t.cid = cidNew()), charReset(), startGame(t, !0));
    };
  if ("new" !== ui.pickMode || !S) return r();
  chBusy ||
    ((chBusy = !0),
    stashCur().then((t) => {
      ((chBusy = !1), t && r());
    }));
}
const ST_ON = false,
  ST_QK = "ro-wanderer.v3.stq",
  ST_AK = "ro-wanderer.v3.aid",
  ST_MAX = 400,
  ST_N = 60,
  stLS = (t, a) => {
    try {
      if (void 0 === a) return localStorage.getItem(t);
      localStorage.setItem(t, a);
    } catch (t) {}
    return null;
  };
let stQ = null,
  stA = "";
function stEv(t, a) {
  if (ST_ON && S) {
    if (!stQ) {
      try {
        stQ = JSON.parse(stLS(ST_QK) || "[]");
      } catch (t) {
        stQ = [];
      }
      Array.isArray(stQ) || (stQ = []);
    }
    (stQ.push([Date.now(), S.cid, t, S.cls, S.lvl, S.map, a || null]),
      stQ.length > ST_MAX && stQ.splice(0, stQ.length - ST_MAX),
      stLS(ST_QK, JSON.stringify(stQ)));
  }
}
function stAid() {
  return (
    stA ||
      ((stA = stLS(ST_AK) || ""),
      /^[a-z0-9]{12,32}$/.test(stA) ||
        ((stA = Array.from(crypto.getRandomValues(new Uint8Array(20)), (t) =>
          (t % 36).toString(36),
        ).join("")),
        stLS(ST_AK, stA))),
    stA
  );
}
function stSend() {
  if (ST_ON && stQ && stQ.length && navigator.sendBeacon) {
    for (stAid(); stQ.length;) {
      const t = stQ.slice(0, 60);
      if (
        !navigator.sendBeacon(
          "/api/stat",
          JSON.stringify({
            a: stA,
            v: "string" == typeof BUILD_VER ? BUILD_VER : "",
            e: t,
          }),
        )
      )
        break;
      stQ.splice(0, t.length);
    }
    stLS(ST_QK, JSON.stringify(stQ));
  }
}
function stBoss(t, a) {
  const s = G.guard,
    e = null != G.trial ? "t" : null != s ? "g" : curMap().ss ? "s" : "m",
    n = G.boss,
    l =
      "t" === e
        ? 120
        : "g" === e
          ? 4 === s
            ? 270
            : s === GUARD.length
              ? 210
              : 140
          : 90,
    o = { w: t ? 1 : 0, ty: e, s: Math.round(l - Math.max(0, G.bossT || 0)) };
  (("t" !== e && "g" !== e) || (o.i = "t" === e ? G.trial : s),
    t ||
      ((o.hp = n && n.max ? Math.max(0, Math.round((100 * n.hp) / n.max)) : 0),
      (o.d = a ? 1 : 0)),
    S.st.b++,
    t && S.st.bw++,
    stEv("boss", o));
}
function stDay(t) {
  if (!ST_ON) return;
  const a = S.st,
    s = new Date(),
    e = `${s.getFullYear()}-${s.getMonth() + 1}-${s.getDate()}`;
  if (a.d !== e) {
    if (a.d && a.t > 0) {
      const t = {};
      (S.mt.forEach((s, e) => {
        const n = Math.round((s || 0) - ((a.m0 || [])[e] || 0));
        n > 0 && (t[e] = n);
      }),
        stEv("day", {
          d: a.d,
          t: Math.round(a.t),
          k: Math.max(0, S.total - a.k0),
          die: a.die,
          mt: t,
          b: a.b,
          bw: a.bw,
        }));
    }
    S.st = { d: e, t: 0, k0: S.total, m0: S.mt.slice(), die: {}, b: 0, bw: 0 };
  }
  S.st.t += t;
}
ST_ON && setInterval(stSend, 6e4);
const dotApply = () =>
  document.body.classList.toggle("nodot", !(!S || !S.set.nodot));
function startGame(t, a) {
  const s = t.t ? Math.max(0, Math.round((Date.now() - t.t) / 1e3)) : 0;
  ((S = migrate(t)),
    stRecover(),
    acctPull(),
    kpPull(a),
    ui.alchTab(),
    a ? stEv("new") : stEv("on", { off: s }),
    SLOTS.some((t) => S.equip[t] && !canWear(S.equip[t])) &&
      setTimeout(
        () => toast("部分裝備等級不足，升級前屬性不生效", "bad"),
        1500,
      ),
    S.rgN &&
      (delete S.rgN,
      setTimeout(() => toast("遊俠天賦已重製，請至角色頁查看", "lvl"), 2500)));
  const [e, n] = layout();
  if (((G = newWorld(e, n)), (G.VH = cv.height), a)) {
    giveGem(CLASS[S.cls].gems[0]);
    const t = makeItem(1, { slot: "weapon", rar: 0 });
    (delete t.nw, (S.equip.weapon = t));
  }
  (a ? (S.logV = logTop()) : S.logV !== logTop() && ui.menuDot("log", 1),
    S.gems.some((t) => t.nw) && ui.badge("skill", 1),
    recalc(),
    (S.hp > PS.maxhp || S.hp <= 0) && (S.hp = PS.maxhp),
    ($("#pick").hidden = !0),
    S.q < QUESTS.length &&
      ("level" === QUESTS[S.q].k || "link" === QUESTS[S.q].k) &&
      quest(QUESTS[S.q].k, 0),
    S.q < QUESTS.length && "boss" === QUESTS[S.q].k && quest("boss", 1),
    (ui.hudKey = ""),
    (ui.sel = null),
    ui.setTab(a ? "skill" : "char"),
    a && toast("第一步：將技能寶石放入格子", "lvl"),
    ui.hud(),
    saveNow(),
    rosterClean(),
    dotApply(),
    termSaved() && termSet(!0),
    a || S.name || showPick("name"));
}
let last = performance.now(),
  wall = Date.now(),
  saveT = 0,
  lag = 0;
const LAG_MAX = 60,
  LAG_N = 72;
function frame(t) {
  requestAnimationFrame(frame);
  const a = advance(t);
  if (!(a < 0)) {
    if (TERM) t - TM.t < 125 || ((TM.t = t), termDraw());
    else if (!(DBV.on || t < frame.nx - 2)) {
      const a = document.hasFocus() ? 1e3 / 60 : 1e3 / 30;
      ((frame.nx = Math.max((frame.nx || 0) + a, t)),
        draw(ctx),
        eliteTags(),
        hudTipTick());
    }
    (frame.lc > t - 250 || ((frame.lc = t), ui.liveChar()),
      (ui.hudT -= a),
      ui.hudT <= 0 &&
        (ui.hud(),
        (ui.hudT = 0.15),
        ui.needs &&
          !drag &&
          $("#sheetBg").hidden &&
          !panelBusy() &&
          ui.render()));
  }
}
function advance(t) {
  const a = Math.max(0, (t - last) / 1e3),
    s = Date.now(),
    e = (s - wall) / 1e3;
  if (((last = t), (wall = s), !S || !G || TAB.gone)) return -1;
  e > 60 ? (offlineGains(e), (lag = 0)) : (lag = Math.min(60, lag + a));
  const n = Math.min(0.1, a),
    l = Math.min(72, Math.max(lag > 0 ? 1 : 0, Math.round(60 * lag)));
  for (let t = 0; t < l; t++) {
    const a = 72 === l ? Math.min(lag, 1 / 60) : lag / (l - t);
    ((lag -= a), G.freeze > 0 ? (G.freeze -= a) : tick(a));
  }
  return ((saveT += n), saveT > 15 && ((saveT = 0), saveNow()), stDay(n), n);
}
try {
  new Worker(
    URL.createObjectURL(
      new Blob(["setInterval(() => postMessage(0), 100)"], {
        type: "text/javascript",
      }),
    ),
  ).onmessage = () => {
    document.hidden && advance(performance.now());
  };
} catch (t) {}
function panelBusy() {
  const t = document.activeElement;
  return (
    !!t &&
    ("SELECT" === t.tagName || "INPUT" === t.tagName) &&
    $("#panel").contains(t)
  );
}
(document.addEventListener("visibilitychange", () => {
  S &&
    (document.hidden && (grabDrops(), saveNow(), stSend()),
    document.hidden
      ? gcOn() && Date.now() - GC.tried > 3e4 && gcUpload()
      : gcCheck());
}),
  window.addEventListener("pagehide", () => {
    S && (grabDrops(), saveNow(!0), stSend());
  }));
let tipEl = null;
function initTips() {
  if ($("#tipBox")) return;
  const t = document.createElement("div");
  ((t.id = "tipBox"), (t.hidden = !0), document.body.appendChild(t));
  const a = () => {
      ((tipEl = null), (t.hidden = !0));
    },
    s = (a) => {
      ((tipEl = a), (t.textContent = a.dataset.tip), (t.hidden = !1));
      const s = a.getBoundingClientRect(),
        e = t.offsetWidth,
        n = t.offsetHeight,
        l = document.documentElement.clientWidth;
      let o = Math.max(8, Math.min(s.left, l - e - 8)),
        r = s.top - n - 4;
      (r < 8 && (r = s.bottom + 4),
        (t.style.left = Math.round(o) + "px"),
        (t.style.top = Math.round(r) + "px"));
    };
  (document.addEventListener("pointerover", (t) => {
    const a = t.target.closest && t.target.closest(".tip");
    a && "mouse" === t.pointerType && s(a);
  }),
    document.addEventListener("pointerout", (t) => {
      tipEl &&
        "mouse" === t.pointerType &&
        !tipEl.contains(t.relatedTarget) &&
        a();
    }),
    document.addEventListener("focusin", (t) => {
      const a = t.target.closest && t.target.closest(".tip");
      a && s(a);
    }),
    document.addEventListener("focusout", (t) => {
      t.target === tipEl && a();
    }),
    document.addEventListener("scroll", a, !0),
    setInterval(() => {
      tipEl && !tipEl.isConnected && a();
    }, 200));
}
function boot(t) {
  (buildSprites(),
    initTips(),
    /^https?:$/.test(location.protocol) &&
      navigator.storage &&
      navigator.storage.persist &&
      !/Firefox/.test(navigator.userAgent) &&
      navigator.storage.persist().catch(() => {}));
  const a = {
    char: "tbc",
    bag: "tbb",
    skill: "tbs",
    alch: "tba",
    map: "tbm",
    more: "tbo",
  };
  (document
    .querySelectorAll("#tabs [data-tab]")
    .forEach((t) =>
      t.insertAdjacentHTML(
        "afterbegin",
        `<img src="${iconURL(a[t.dataset.tab])}" alt="">`,
      ),
    ),
    $("#tabs").addEventListener("click", (t) => {
      const a = t.target.closest("[data-tab]");
      a && S && (sfx("click"), ui.setTab(a.dataset.tab));
    }),
    $("#panel").addEventListener("click", onPanelClick),
    $("#panel").addEventListener("change", (t) => {
      if (t.target.dataset.kf) return (keepChange(t.target), void ui.render());
      const a = t.target.dataset.av,
        s = t.target.dataset.sv;
      if (a)
        return (
          (alchOpt()[a] = "r" === a ? +t.target.value : t.target.value),
          (ui.confirm = null),
          markDirty(),
          void ui.render()
        );
      if (s)
        return (
          (slOpt()[s] =
            "s" === s || "kf" === s ? t.target.value : +t.target.value),
          (ui.confirm = null),
          markDirty(),
          void ui.render()
        );
      const e = t.target.dataset.stf;
      if (e) {
        const a = t.target.value;
        return (
          (ui.stF[ui.stV][e] = ["r", "rt", "b"].includes(e) ? +a : a),
          (ui.stN = 0),
          (ui.stSel = null),
          void ui.render()
        );
      }
      const n = t.target.dataset.rv;
      if (n)
        return (
          (S.set[n] = +t.target.value),
          (ui.confirm = null),
          markDirty(),
          void ui.render()
        );
      const l = t.target.dataset.bv;
      l &&
        ((bagOpt()[l] =
          "r" === l || "rt" === l ? +t.target.value : t.target.value),
        (ui.confirm = null),
        (ui.bagN = 0),
        (ui.bagTop = 0),
        markDirty(),
        ui.render());
    }),
    initDrag(),
    $("#panel").addEventListener("input", (t) => {
      const a = t.target.dataset.vol;
      if (a) {
        const s = +t.target.value;
        return (
          (S.set[a] = s / 100),
          t.target.style.setProperty("--v", s + "%"),
          ($(`#vol_${a}L`).textContent = s ? s + "%" : "關閉"),
          auApply(),
          "sfx" === a && sfx("hit"),
          void markDirty()
        );
      }
      if ("abHp" === t.target.id)
        return (
          (S.set.abh = +t.target.value),
          t.target.style.setProperty(
            "--v",
            ((S.set.abh - 10) / 90) * 100 + "%",
          ),
          ($("#abHpL").textContent = S.set.abh + "%"),
          void markDirty()
        );
      "potPct" === t.target.id &&
        ((S.potPct = +t.target.value),
        t.target.style.setProperty("--v", ((S.potPct - 10) / 80) * 100 + "%"),
        ($("#potLbl").textContent = S.potPct + "%"),
        markDirty());
    }));
  const s = () => {
    if (ui.axOn && "hlp" === $("#sheet").className) ui.axOpen();
    else {
      if (ui.offBk && "hlp" === $("#sheet").className)
        return (
          ($("#sheet").className = "offp"),
          ($("#sheet").innerHTML = ui.offBk),
          void (ui.offBk = null)
        );
      ((ui.axOn || "cfp" === $("#sheet").className) && (ui.confirm = null),
        ui.sockClose(),
        (ui.axOn = !1),
        (ui.chRn = ui.chCf = null),
        (ui.slPick = ui.slMap = ui.slSwap = ui.slpN = null),
        ui.bxOn && (ui.confirm = null),
        (ui.bxOn = !1),
        (ui.bxM = 0),
        ($("#sheetBg").hidden = !0),
        ($("#sheet").className = ""),
        ui.render(),
        gcNag());
    }
  };
  let e = 0,
    n = null;
  const l = () => {
    (clearTimeout(e), n && n.classList.remove("on"), (n = null));
  };
  $("#sheetBg").addEventListener("pointerdown", (t) => {
    const a = t.target.closest("[data-hold]");
    a &&
      !a.disabled &&
      (l(),
      (n = a),
      a.classList.add("on"),
      (e = setTimeout(() => {
        ((n = null), a.classList.remove("on"));
        const t = document.createElement("button");
        (Object.assign(t.dataset, a.dataset),
          (t.dataset.act = a.dataset.hold),
          delete t.dataset.hold,
          (t.hidden = !0),
          a.parentNode.append(t),
          t.click(),
          t.remove());
      }, 1500)));
  });
  for (const t of ["pointerup", "pointercancel", "pointerleave"])
    $("#sheetBg").addEventListener(t, (a) => {
      !n || ("pointerleave" === t && a.target !== $("#sheetBg")) || l();
    });
  ($("#sheetBg").addEventListener("pointerover", (t) => {
    const a = "mouse" === t.pointerType && t.target.closest('[data-act="bxI"]');
    a && a !== itfCell && itfShow(a);
  }),
    $("#sheetBg").addEventListener("pointerout", (t) => {
      "mouse" === t.pointerType &&
        itfCell &&
        t.target.closest('[data-act="bxI"]') === itfCell &&
        !itfCell.contains(t.relatedTarget) &&
        itfHide();
    }),
    $("#sheet").addEventListener("scroll", itfHide),
    $("#sheetBg").addEventListener("pointerout", (t) => {
      n &&
        t.target.closest("[data-hold]") === n &&
        !n.contains(t.relatedTarget) &&
        l();
    }),
    $("#sheetBg").addEventListener("click", (t) => {
      if ((t.target.closest('[data-act="bxI"]') || itfHide(), ui.ukOn)) {
        const a = t.target.closest("[data-act]");
        return void ((a || t.target === $("#sheetBg")) && ukAct(a));
      }
      if (ui.kpOn) {
        const a = t.target.closest("[data-act]");
        return void ((a || t.target === $("#sheetBg")) && kpAct(a));
      }
      if (ui.bxOn) {
        const a = t.target.closest("[data-act]");
        if (a && !a.disabled && ui.bxAct(a)) return;
      }
      if (ui.axOn) {
        const a = t.target.closest("[data-act]");
        if (a && !a.disabled && ui.axAct(a, t)) return;
      }
      if ("cfp" === $("#sheet").className) {
        const a = t.target.closest("[data-act]");
        return a && "cancel" !== a.dataset.act
          ? void (
              a.disabled ||
              (($("#sheetBg").hidden = !0),
              ($("#sheet").className = ""),
              onPanelClick(t))
            )
          : void ((a || t.target === $("#sheetBg")) && s());
      }
      const a = t.target.closest('[data-act^="asc"]');
      if (a)
        return void ("ascSel" === a.dataset.act
          ? ui.ascPick(a.dataset.k)
          : "ascYes" !== a.dataset.act ||
            S.tal.asc ||
            ((S.tal.asc = a.dataset.k),
            stEv("asc", { b: S.tal.asc }),
            recalc(),
            markDirty(),
            toast(
              `轉職為「${ascBranch().n}」！可至角色分頁「轉職」學習天賦`,
              "lvl",
            ),
            sfx("quest"),
            ui.badge("char", 1),
            s()));
      const e = t.target.closest('[data-act="cmpEq"]');
      if (e) return (equipItem(+e.dataset.u), (ui.confirm = null), void s());
      const n = t.target.closest('[data-act^="sk"]');
      if (n)
        return void (
          n.disabled ||
          ui.sockAct(n.dataset.act, +n.dataset.u, n.dataset.k, n.dataset.more)
        );
      const l = t.target.closest('[data-act="hp"]');
      if (l)
        return (
          "offp" === $("#sheet").className &&
            (ui.offBk = $("#sheet").innerHTML),
          void helpOpen(l.dataset.k, +l.dataset.i || 0)
        );
      const o = t.target.closest('[data-act="hpg"]');
      if (o) return void helpOpen(ui.hlpK, 0, +o.dataset.v);
      if (t.target.closest('[data-act="bnOk"]')) return void bnSave();
      const r = t.target.closest('[data-act^="ch"]');
      if (r) return void (r.disabled || ui.chAct(r.dataset.act, r.dataset.k));
      const i = t.target.closest('button[data-kr="z"]');
      if (i && null != ui.slPick)
        return (
          keepAct(i.dataset.act, i),
          void ui.slPickOpen(ui.slPick, ui.slMap)
        );
      const c = t.target.closest('[data-act^="sl"]');
      if (c && null != ui.slPick) {
        const t = c.dataset.act,
          a = ui.slMap,
          e = ui.slPick;
        if ("slIn" === t) return (slPlace(a, e, +c.dataset.u), void s());
        if ("slOut" === t) return (slTakeOut(a, e), void s());
        if ("slInf" === t)
          return (
            s(),
            alchPick(+c.dataset.u),
            (ui.alchRes = null),
            (ui.alchMode = "i"),
            (ui.infR = null),
            autoHelp("inf"),
            void ($("#sheetBg").hidden && ui.axOpen())
          );
        if ("slUse" === t)
          return ((ui.slSwap = +c.dataset.u), void ui.slPickOpen(e, a));
        if ("slMore" === t) {
          const t = $("#sheet .slList")?.scrollTop || 0;
          ((ui.slpN += 60), ui.slPickOpen(e, a));
          const s = $("#sheet .slList");
          return void (s && (s.scrollTop = t));
        }
        if ("slSwapYes" === t)
          return (null != ui.slSwap && slPlace(a, e, ui.slSwap), void s());
        if ("slSwapNo" === t)
          return ((ui.slSwap = null), void ui.slPickOpen(e, a));
      }
      const d = t.target.closest('[data-act^="gf"]');
      if (d && "gfp" === $("#sheet").className)
        return void (d.disabled || ui.gfAct(d.dataset.act, +d.dataset.u));
      const f = t.target.closest('[data-act^="cd"]');
      if (f && "cdp" === $("#sheet").className) return void ui.cdAct(f);
      const p = t.target.closest('[data-act="snPg"]');
      if (p && ui.snapX)
        return ((ui.snapPg = +p.dataset.v), void ui.snapOpen(ui.snapX));
      const u = t.target.closest('[data-act="snIt"]');
      if (u && ui.snapX) return void ui.snapOpen(ui.snapX, +u.dataset.u);
      const h = t.target.closest('[data-act^="bk"]');
      h && "bkp" === $("#sheet").className
        ? h.disabled || bkAct(h.dataset.act)
        : (t.target === $("#sheetBg") ||
            t.target.closest('[data-act="close"]')) &&
          s();
    }),
    $("#sheetBg").addEventListener("change", (t) => {
      if (ui.bxOn && "xy".includes(t.target.dataset.kr || "-"))
        return (keepChange(t.target), void ui.bxOpen());
      if (null != ui.slPick && "z" === t.target.dataset.kr)
        return (keepChange(t.target), void ui.slPickOpen(ui.slPick, ui.slMap));
      const a = t.target.dataset.sv;
      a &&
        null != ui.slPick &&
        ((slOpt()[a] =
          "s" === a || "kf" === a ? t.target.value : +t.target.value),
        markDirty(),
        ui.slPickOpen(ui.slPick, ui.slMap));
    }),
    $("#stageWrap").addEventListener("click", () => {
      ZEN && zenSet(!1);
    }),
    $("#stageWrap").addEventListener("pointerdown", (t) => {
      if ("mouse" === t.pointerType || t.target !== cv) return;
      const a = hudHitAt(t);
      hudTip(a && a.k !== HT.k ? a : null, 1);
    }),
    $("#stageWrap").addEventListener("pointermove", (t) => {
      if ("mouse" !== t.pointerType) return;
      const a = t.target === cv ? hudHitAt(t) : null;
      (a ? a.k : null) !== HT.k && hudTip(a, 0);
    }),
    $("#stageWrap").addEventListener("pointerleave", (t) => {
      "mouse" === t.pointerType && hudTip(null);
    }));
  let o = Date.now();
  for (const t of ["pointerdown", "keydown", "wheel"])
    window.addEventListener(
      t,
      () => {
        o = Date.now();
      },
      !0,
    );
  (setInterval(() => {
    !ZEN &&
      !TERM &&
      S &&
      G &&
      !DBV.on &&
      Date.now() - o > 9e5 &&
      $("#sheetBg").hidden &&
      $("#pick").hidden &&
      !document.hidden &&
      zenSet(!0);
  }, 1e4),
    window.addEventListener("keydown", (t) => {
      "Escape" === t.key && ZEN && zenSet(!1);
    }),
    termBoot(),
    window.addEventListener("keydown", (t) => {
      "Escape" === t.key &&
        !$("#sheetBg").hidden &&
        $("#sheet").className &&
        s();
    }),
    $("#bossBtn").addEventListener("click", () => {
      if (G) {
        if (!G.arena) return startBoss();
        if (inFight() && !(G.arena.ask > G.t))
          return ((G.arena.ask = G.t + 3), void ui.hud());
        (G.tw &&
          S.set.at &&
          ((S.set.at = 0),
          markDirty(),
          toast("已關閉自動挑戰無盡之塔"),
          (ui.needs = !0)),
          leaveArena());
      }
    }),
    $("#questChip").addEventListener("click", () => {
      S && ui.openMenu("quest");
    }),
    $("#dieChip").addEventListener("click", () => {
      S && G.dl && dlOpen();
    }),
    $("#trnChip").addEventListener("click", () => {
      S &&
        G.trn &&
        ((S.set.trc = ((S.set.trc || 0) + 1) % 3),
        markDirty(),
        (ui.tcT = 0),
        ui.hud());
    }),
    $("#ssChip").addEventListener("click", () => {
      S &&
        (ssOpen() && !S.ssSeen && ((S.ssSeen = 1), markDirty(), ui.hud()),
        (ui.mapView = "ss"),
        (S.mvs.ss = 1),
        ui.setTab("map"));
    }),
    $("#slChip").addEventListener("click", () => {
      S && ((S.set.slc = S.set.slc ? 0 : 1), markDirty(), ui.hud());
    }),
    $("#pick").addEventListener("click", pickClick),
    $("#sheet").addEventListener("keydown", (t) => {
      "Enter" === t.key && "bnName" === t.target.id && bnSave();
    }),
    $("#pick").addEventListener("keydown", (t) => {
      "Enter" === t.key &&
        "pkName" === t.target.id &&
        "name" === ui.pickMode &&
        $('[data-act="pkOk"]').click();
    }));
  const r = () => {
    (document.documentElement.style.setProperty(
      "--ph",
      $("#panel").clientHeight + "px",
    ),
      fitDetail(),
      bagFill());
  };
  ($("#panel").addEventListener("scroll", fitDetail, { passive: !0 }),
    $("#panel").addEventListener("scroll", bagScroll, {
      passive: !0,
      capture: !0,
    }),
    r());
  try {
    new ResizeObserver(r).observe($("#panel"));
  } catch (t) {
    window.addEventListener("resize", r);
  }
  try {
    new ResizeObserver(() => {
      G && layout();
    }).observe($("#stageWrap"));
  } catch (t) {
    window.addEventListener("resize", () => {
      G && layout();
    });
  }
  try {
    window.claude?.hot?.snapshot?.(() =>
      S ? { S: JSON.parse(JSON.stringify(S)) } : {},
    );
  } catch (t) {}
  (requestAnimationFrame(frame), admIn());
  const i = moveIn();
  gcCheck();
  const c = t && t.S,
    d = c || loadLocal(),
    f = (d && d.t) || 0;
  if (!i || (d && d.cls)) {
    if (d && d.cls) {
      const t = (Date.now() - (d.t || Date.now())) / 1e3,
        a = d.pk;
      if (
        (delete d.pk,
        startGame(d, !1),
        c || offlineGains(t, !1, a),
        bootPk && !c)
      ) {
        const t = bootPk;
        saveNow().then((a) => {
          if (a && S && S.cid === t)
            try {
              localStorage.removeItem(CHAR_KEY(t));
            } catch (t) {}
        });
      }
    } else showPick();
    (lsRepack(),
      i
        ? bkDecode(i).then((t) => {
            !t || (S && t.cur.cid === S.cid && (t.cur.t || 0) <= f + 5e3)
              ? moveHint()
              : moveAsk(t);
          })
        : moveHint(),
      initCloud().then((t) => {
        if (t && t.cls && (!S || (t.t || 0) > (S.t || 0) + 5e3)) {
          const a = (Date.now() - t.t) / 1e3;
          (startGame(t, !1), offlineGains(a), toast("已載入雲端存檔"));
        }
        cloud.ok && S && saveNow();
      }));
  } else
    bkDecode(i).then((t) => {
      if (t) return (moveDone(), bkApply(t));
      (toast("舊網址的存檔讀取失敗", "bad"), showPick());
    });
}
const bootGo = () =>
  tabClaim(() =>
    window.claude?.hot?.ready
      ? window.claude.hot.ready(boot)
      : boot(window.claude?.hot?.data ?? {}),
  );
