/* 流浪仙境 v1.1.7（續）：性別與舞孃職業線
   1. 建立角色時選擇性別（男／女），角色頁可隨時更改（詩人線、舞孃線除外）；女性外觀取自 RO 原版素材
      （ragassets 圖片服務 gender=female：一轉 6、轉職 33、舞孃線 3，待機／走路／攻擊 × 8 方向，見 ro-jobs-f.js）。
   2. 弓箭手新增女性限定的第三條職業線「舞孃 → 吉普賽 → 流浪者」（男性維持詩人線），兩個流派：
      ・魅舞流（ro_bow_4）：不道德之舞、不要忘記我、舞伴；輔助 舞蹈練習、幸運之吻
      ・鞭舞流（ro_bow_5）：投擲箭、尖叫、哼歌；輔助 第四箭、幸運之吻（平A流）
      新機制「魅惑」：被魅惑的敵人受到的傷害 +15%（4 秒）。 */
"use strict";

const V123 = { charmT: 4, charmVul: 0.15, kissP: 0.15, humT: 8, humAs: 0.2, humBa: 0.25, pickSex: "m", lk: new Map(), lkT: -1 };
const V123_BASE = { sword: "swordsman", bow: "archer", mage: "mage", thief: "thief", acolyte: "acolyte", merchant: "merchant" };

// ---------------------------------------------------------------------------
// 0. 圖示（RO 原版：舞孃技能 323～330、鞭子 1950～1956）
(() => {
  const A = typeof window !== "undefined" && window.RO_ASSETS;
  if (!A) return;
  A.skills ||= {};
  for (const id of [323, 324, 325, 326, 327, 328, 329, 330]) A.skills[id] ||= { file: `skills/${id}.png`, width: 24, height: 24 };
  A.items ||= {};
  for (const id of [1950, 1952, 1954, 1956]) A.items[id] ||= { file: `items/${id}.png`, width: 24, height: 24 };
})();

// ---------------------------------------------------------------------------
// 1. 舞孃技能（在 v6 技能登錄前加入）
//    id, 職業, 名稱, 招式, 傷害, 冷卻, 標籤, 屬性, 異常, RO 圖示, 形狀, 說明
const V123_ACT = [
  ["dc_ugly", "bow", "不道德之舞", "v123ugly", 0.9, 3, ["aoe", "spell"], "neutral", null, 325, "L3", "從自身擴散 3 道舞波，每道對碰到的敵人造成 {hit}% 武器傷害，並使敵人魅惑 4 秒（受到的傷害 +15%）。"],
  ["dc_forget", "bow", "不要忘記我", "v123forget", 0.45, 4, ["aoe", "spell"], "neutral", null, 328, "T4", "在目標處跳起 4 秒的舞蹈領域，每 0.5 秒對範圍內的敵人造成 {hit}% 武器傷害並使其冰緩。"],
  ["dc_partner", "bow", "舞伴", "base:summon", 0, 3, ["minion", "spell"], "neutral", null, 330, "T4", "召喚 2 位幻影舞伴，自動搜尋怪物並從遠處發射舞波。"],
  ["dc_throw", "bow", "投擲箭", "double", 1.5, 1.6, ["proj"], "neutral", null, 324, "I2", "快速擲出 2 支箭，每支造成 {hit}% 武器傷害。"],
  ["dc_scream", "bow", "尖叫", "v123scream", 2.4, 4, ["aoe", "spell"], "neutral", null, 326, "L3", "發出刺耳的尖叫，對周圍敵人造成 {hit}% 武器傷害並暈眩 1 秒（頭目不受暈眩影響）。"],
  ["dc_humming", "bow", "哼歌", "v123hum", 0, 10, ["spell"], "neutral", null, 327, "I2", "哼歌 8 秒：攻擊速度 +20%、普攻傷害 +25%。"],
];
//    id, 職業, 名稱, 需求標籤, RO 圖示, 形狀, 說明
const V123_SUP = [
  ["dc_kiss", "bow", "幸運之吻", null, 329, "I2", "相鄰的主動技能暴擊率 +20%；擊中時 15% 機率使敵人魅惑 4 秒（受到的傷害 +15%）。"],
  ["dc_lesson", "bow", "舞蹈練習", null, 323, "L3", "相鄰的主動技能傷害 +25%、範圍 +25%。"],
];
const V123_MOD = { dc_kiss: { crit: 20 }, dc_lesson: { dmg: 0.25, area: 0.25 } };
// 流派：舞孃線的兩個流派（ASC.bow[4]、ASC.bow[5]）
const V123_JOB = { dc_ugly: [4], dc_forget: [4], dc_partner: [4], dc_lesson: [4], dc_throw: [5], dc_scream: [5], dc_humming: [5], dc_kiss: [4, 5] };
// 商店：舞孃線（V81_TIER.bow[2]）：二轉起／三轉後／四轉後；吉普賽、流浪者共用小丑、宮廷樂師的技能
const V123_TIER = [
  ["dc_ugly", "dc_throw", "dc_kiss"],
  ["dc_forget", "dc_scream", "dc_lesson", "bw_avulcan", "bw_tarot", "bw_hermode"],
  ["dc_partner", "dc_humming", "bw_rainstorm", "bw_gecho"],
];
if (typeof V6_ACT !== "undefined" && typeof V6_SUP !== "undefined" && typeof V6_CLASS !== "undefined") {
  for (const r of V123_ACT) {
    V6_ACT.push(r);
    V6_CLASS[r[1]].act.push(r[0]);
  }
  for (const r of V123_SUP) {
    V6_SUP.push(r);
    V6_CLASS[r[1]].sup.push(r[0]);
  }
  if (typeof V6_JOB !== "undefined") Object.assign(V6_JOB, V123_JOB);
  if (typeof V6_SPEC !== "undefined") {
    V6_SPEC.bow[4] = ["dc_ugly", "dc_forget", "dc_partner", "dc_lesson", "dc_kiss"];
    V6_SPEC.bow[5] = ["dc_throw", "dc_scream", "dc_humming", "bw_fourth", "dc_kiss"];
  }
  if (typeof V81_TIER !== "undefined") V81_TIER.bow[2] = V123_TIER.map((a) => [...a]);
  if (typeof V6_SELF !== "undefined") Object.assign(V6_SELF, { v123ugly: 40, v123scream: 40 });
  if (typeof V6_ALWAYS !== "undefined") V6_ALWAYS.add("v123hum");
}
// 掉落的武器：舞孃線改為鞭子
if (typeof RO_WB !== "undefined") {
  RO_WB.ro_bow_4 = [["繩鞭", "皮鞭", "舞孃長鞭", "玫瑰之鞭"], [1950, 1952, 1954, 1956]];
  RO_WB.ro_bow_5 = [["繩鞭", "皮鞭", "流浪者之鞭", "玫瑰之鞭"], [1950, 1952, 1956, 1954]];
}
if (typeof RO_ASC_STATS !== "undefined") Object.assign(RO_ASC_STATS, { ro_bow_4: [5, 4], ro_bow_5: [5, 3] });

// ---------------------------------------------------------------------------
// 2. 職業線與流派
if (typeof V63_LINES !== "undefined") {
  V63_LINES.bow[1].sex = "m"; // 詩人線：男性限定
  V63_LINES.bow[2] = { n: ["舞孃", "吉普賽", "流浪者"], sp: ["dancer", "gypsy", "wanderer"], ks: [4, 5], d: "魅惑舞蹈與鞭擊（女性限定）", sex: "f" };
}
if (typeof V63_STYLE !== "undefined") {
  V63_STYLE.ro_bow_4 = {
    style: "魅舞", A: ["dc_ugly", "dc_forget", "dc_partner"], S: ["dc_lesson", "dc_kiss"],
    d: "以舞波與舞蹈領域魅惑、冰緩敵人，舞伴從遠處追擊；被魅惑的敵人受到的傷害提高",
    wpn: ["舞孃長鞭", 1952, 1.1, 0],
    trait: V63T("舞蹈之心", { skill: 90, minp: 200, charmHit: 0.06 }),
    mech: V63T("魅惑之舞", { charmVul: 0.15, "sk:dc_ugly:more": 0.15 }),
    rows: [
      [V63T("舞步專精", { "rsc:5:minp": 1.2 }), V63T("舞孃智慧", { "rsc:4:skill": 0.5, "rsc:4:minAs": 0.003 }), V63T("舞孃體魄", { "rsc:1:lifep": 0.5, "rsc:2:evap": 0.3 })],
      [V63T("雙人舞", { minAs: 0.2, minp: 20 }), V63T("魅力", { charmHit: 0.1, skill: 10 }), V63T("迷戀", { charmVul: 0.2 })],
      null,
      [V63T("舞團", { minion: 1, minDmg: 0.2 }), V63T("不要忘記我精通", { "sk:dc_forget:area": 0.25, "sk:dc_forget:cd": 0.15 }), V63T("不道德之舞精通", { "sk:dc_ugly:more": 0.3 })],
      null,
      [V63T("傾城之舞", { boss: 0.25, minp: 5 }), V63T("漸強", { h_ramp: 0.031 }), V63T("致命魅惑", { charmVul: 0.25 })],
      [V63T("舞者步伐", { graze: 0.25, evap: 30, move: 12 }), V63T("魅惑護身", { dmgTaken: 0.1, charmHit: 0.03 }), V63T("舞伴守護", { minGuard: 0.04 })],
      [V63T("交際舞奧義", { minion: 1, minDmg: 0.25 }), V63T("魅惑奧義", { charmVul: 0.2, charmHit: 0.05 }), V63T("流浪者之道", { "rsc:5:minp": 0.5, "rsc:4:skill": 0.5, minion: 1 })],
    ],
  };
  V63_STYLE.ro_bow_5 = {
    style: "鞭舞", A: ["dc_throw", "dc_scream", "dc_humming"], S: ["bw_fourth", "dc_kiss"],
    d: "平A流：鞭擊連打為主，哼歌強化普攻，普攻有機率觸發投擲箭",
    wpn: ["流浪者之鞭", 1956, 1.15, 2],
    trait: V63T("鞭舞", { baMore: 1.2, aspd: 20, "bac:dc_throw": 0.18 }),
    mech: V63T("急速鞭擊", { aspd: 12, baMore: 0.1 }),
    rows: [
      [V63T("舞孃敏捷", { "rsc:2:aspd": 0.5 }), V63T("鞭技靈巧", { "rsc:5:baMore": 0.004 }), V63T("巡演體魄", { "rsc:1:lifep": 0.45, "rsc:2:evap": 0.3 })],
      [V63T("連環投擲", { "bac:dc_throw": 0.1, aspd: 8 }), V63T("魅惑鞭", { charmHit: 0.08, baMore: 0.1 }), V63T("鞭擊", { baMore: 0.15, crit: 4 })],
      null,
      [V63T("火焰之舞", { roElHit_brn: 0.12, brn: 30 }), V63T("寒冰之舞", { roElHit_chl: 0.12, chlVul: 0.06 }), V63T("雷鳴之舞", { roElHit_shk: 0.12, ail: 0.15 })],
      null,
      [V63T("安可", { boss: 0.2, baMore: 0.075 }), V63T("漸強", { h_ramp: 0.028, aspd: 5 }), V63T("終幕", { exec: 0.35, crit: 3 })],
      [V63T("搖擺步伐", { evap: 35, move: 10 }), V63T("舞台魅力", { dmgTaken: 0.08, graze: 0.15 }), V63T("迷人笑容", { charmHit: 0.05, dmgTaken: 0.05 })],
      [V63T("鞭舞奧義", { baMore: 0.3 }), V63T("投擲箭奧義", { "bac:dc_throw": 0.12, "sk:dc_throw:more": 0.3 }), V63T("流浪者之道", { "rscm:5:dmg": 0.25, "rsc:2:aspd": 0.3 })],
    ],
  };
}
if (typeof V63_BA !== "undefined") V63_BA.add("ro_bow_5");
if (typeof V121_ROW2 !== "undefined") {
  V121_ROW2.ro_bow_4 = [
    ["舞蹈練習共鳴", { "sp:dc_lesson:pow": 0.6, "sk:dc_partner:more": 0.1 }],
    ["幸運之吻共鳴", { "sp:dc_kiss:pow": 0.6, "sk:dc_ugly:more": 0.1 }],
    ["快速填裝共鳴", { "sp:bw_quick:pow": 0.6, "sk:dc_forget:more": 0.1 }],
  ];
  V121_ROW2.ro_bow_5 = [
    ["第四箭共鳴", { v6fourth: 0.2, "sk:dc_throw:more": 0.1 }],
    ["幸運之吻共鳴", { "sp:dc_kiss:pow": 0.6, "sk:dc_scream:more": 0.1 }],
    ["快速填裝共鳴", { "sp:bw_quick:pow": 0.6, "sk:dc_humming:cd": 0.2 }],
  ];
}
// 流派傷害校準（頭目 60 秒單體＋地圖 10 清怪 120 秒，對照詩人兩流派）
if (typeof V6_BAL !== "undefined") Object.assign(V6_BAL, { ro_bow_4: 1.2, ro_bow_5: 1.07 });
if (typeof V121_EST !== "undefined") Object.assign(V121_EST, { dc_ugly: 2, dc_forget: 8, dc_throw: 2, dc_scream: 1 });
if (typeof V5_TAL_TXT !== "undefined") {
  Object.assign(V5_TAL_TXT, {
    charmHit: (v) => `擊中時 ${v5P(v)}% 機率使敵人魅惑 4 秒（受到的傷害 +15%）`,
    charmVul: (v) => `被魅惑的敵人受到的傷害再 +${v5P(v)}%`,
    "bac:dc_throw": (v) => `普攻擊中時 ${v5P(v, 3)}% 機率施放「投擲箭」（需放在技能盤上）`,
  });
}

// ---------------------------------------------------------------------------
// 3. 魅惑：受到的傷害 +15%（＋天賦）
function v123Charm(m, d = V123.charmT) {
  if (!m || !(m.hp > 0)) return;
  if (!(m.v123ch > G.t)) burst(m.x, m.y - (m.h || 12) - 4, 4, ["#ff8ac8", "#ffd0e8"], 34, { z: 6 });
  m.v123ch = Math.max(m.v123ch || 0, G.t + d);
}
// 擊中來源的技能有沒有連結某個輔助（同一格畫面內快取）
function v123Lk(o, sup) {
  const g = o && o.v6g;
  if (!g || typeof v6Linked !== "function") return false;
  if (V123.lkT !== G.t) (V123.lk = new Map()), (V123.lkT = G.t);
  const key = g.u + "|" + sup;
  let v = V123.lk.get(key);
  if (v === undefined) V123.lk.set(key, (v = !!v6Linked(g, sup)));
  return v;
}
if (typeof HIT_MUL !== "undefined")
  HIT_MUL.push(
    {
      k: "v123:charm",
      lab: () => tal("charmVul") && `對魅惑的敵人 ×${+(1 + V123.charmVul + tal("charmVul")).toFixed(2)}`,
      f: (t, m) => (m && m.v123ch > G.t ? t * (1 + V123.charmVul + tal("charmVul")) : t),
    },
    {
      k: "v123:hum",
      lab: () => "",
      f: (t, m, o) => (o && o.ba && typeof v6Buf === "function" && v6Buf("v123hum") ? t * (1 + V123.humBa) : t),
    },
  );
if (typeof SPD_AS !== "undefined") SPD_AS.push({ k: "v123:hum", f: () => (typeof v6Buf === "function" && v6Buf("v123hum") ? 1 + V123.humAs : 1) });
function v123HitInstall() {
  const hm = hitMob;
  hitMob = function (m, mult, o, ...x) {
    const r = hm.call(this, m, mult, o, ...x);
    if (!m || !o) return r;
    if (o.v6sk === "dc_ugly") v123Charm(m);
    else if (o.v6g && RAND() < V123.kissP && v123Lk(o, "dc_kiss")) v123Charm(m);
    if (PS && tal("charmHit") && RAND() < tal("charmHit")) v123Charm(m);
    if (o.v6sk === "dc_forget" && m.hp > 0 && typeof ailment === "function") ailment(m, "chl", 0, 1);
    return r;
  };
}

// ---------------------------------------------------------------------------
// 4. 招式
function v123Stun(m, d) {
  if (!m || !(m.hp > 0) || m.boss) return;
  if (typeof v90Stun === "function") v90Stun(m, d);
  else m.stn = Math.max(m.stn || 0, d);
}
function v123Moves() {
  Object.assign(V6_CAST, {
    // 不道德之舞：3 道舞波（擊中魅惑，見 v123HitInstall）
    v123ugly(c) {
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
            for (const m of v6Near(p.x, p.y - 3, r)) if (!hs.has(m)) hs.add(m), v6Hit(m, c.hit * c.r, c.o, { kb: 40 });
          },
          draw: (e, cx) => {
            const tt = e.t - e.t0;
            if (tt < 0) return;
            const r = R * Math.min(1, tt / 0.3);
            v6Ell(cx, p.x, p.y - 3, r, "#ff8ac8", 0.75 * (1 - tt / 0.45), false, 2);
          },
        });
      }
      v6Ro("bw_disso", p.x, p.y);
      return true;
    },
    // 不要忘記我：目標處 4 秒的舞蹈領域，每 0.5 秒傷害並冰緩
    v123forget(c) {
      if (!v6Need(c)) return false;
      const { p, tgt } = c,
        R = 36 * c.n,
        x = tgt.x,
        y = tgt.y;
      setFace(c.ang);
      p.anim = { k: "cast", t: 0, dur: 0.4, a: c.ang };
      let next = 0;
      v6Ent({
        life: 4,
        upd: (e) => {
          if (e.t < next) return;
          next += 0.5;
          for (const m of v6Near(x, y - 3, R)) v6Hit(m, c.hit * c.r, c.o, { kb: 0 });
        },
        draw: (e, cx) => {
          const a = 1 - e.t / 4;
          v6Ell(cx, x, y - 3, R, "#ff8ac8", 0.16 * a + 0.06, true);
          v6Ell(cx, x, y - 3, R * (0.8 + 0.2 * Math.sin(e.t * 6)), "#ffd0e8", 0.6 * a + 0.2, false, 1.5);
        },
      });
      v6Ro("bw_song", x, y);
      return true;
    },
    // 尖叫：周圍傷害＋暈眩 1 秒
    v123scream(c) {
      const { p } = c,
        R = 46 * c.n;
      p.anim = { k: "cast", t: 0, dur: 0.35, a: p.face };
      for (const m of v6Near(p.x, p.y - 3, R)) {
        v6Hit(m, c.hit * c.r, c.o, { kb: 70 });
        v123Stun(m, 1);
      }
      v6Fx({ k: "ring", x: p.x, y: p.y - 3, r: R, life: 0.35, col: "#ff8ac8", grow: 1 });
      burst(p.x, p.y - 8, 18, ["#ff8ac8", "#ffffff"], 120, { z: 6, glow: 1 });
      shake(0.08);
      return true;
    },
    // 哼歌：8 秒攻擊速度 +20%、普攻傷害 +25%
    v123hum(c) {
      const { p } = c;
      v6SetBuf("v123hum", V123.humT);
      v6Ro("bw_song", p.x, p.y);
      v6Fx({ k: "notes", x: p.x, y: p.y - 10, life: 1.2, col: "#ff8ac8" });
      return true;
    },
  });
  // 哼歌：附近有敵人、且效果已結束時才施放
  if (typeof v6Ready === "function") {
    const rd = v6Ready;
    v6Ready = function (g, ...a) {
      if (SKILLS[g?.id]?.v6 === "v123hum") return !G.dead && !v6Buf("v123hum") && mobsNear(G.pl.x, G.pl.y - 3, 2 * PS.range + 40).length > 0;
      return rd.call(this, g, ...a);
    };
  }
  for (const [id, mod] of Object.entries(V123_MOD)) if (SKILLS[id]) SKILLS[id].mod = { ...mod };
  if (typeof roFxProfiles !== "undefined") {
    const cp = (a, b) => roFxProfiles[b] && (roFxProfiles[a] ||= { ...roFxProfiles[b] });
    cp("dc_ugly", "bw_disso");
    cp("dc_scream", "bw_disso");
    cp("dc_partner", "bw_bsong");
    cp("dc_throw", "bw_double");
    cp("dc_humming", "bw_song");
  }
}

// ---------------------------------------------------------------------------
// 5. 建立分支：在 roV4Install 的最前面加入 ASC.bow[4]、[5] 與 RO_ASC_SPEC（ASC 在 ro-content.js 建立）
function v123Pre() {
  if (typeof ASC === "undefined" || !ASC.bow || ASC.bow.length >= 6 || typeof roTemplates === "undefined") return;
  const mk = (template, i, n, d) => {
    const b = structuredClone(roTemplates[template]);
    b.k = "ro_bow_" + i;
    b.n = n;
    b.d = d;
    b.t.forEach((row, r) => row.forEach((t, j) => (t.k = b.k + "_" + r + "_" + j)));
    const choices =
      template === "summ"
        ? [["生命共鳴", "召喚物 +1、傷害 +20%", { minion: 1, minDmg: 0.2 }], ["守護契約", "每隻召喚物減傷再 +2%，至原上限", { minGuard: 0.02 }]]
        : [["連綿不絕", "氣勢上限 +5、技能擊中獲得氣勢", { momMax: 5, momSkill: 1 }], ["迅捷之風", "攻擊速度 +20%、移動速度 +10%", { aspd: 20, move: 10 }]];
    b.t.push(choices.map(([n, d, e], j) => ({ k: b.k + "_3_" + j, n, d, e })));
    return b;
  };
  ASC.bow[4] = mk("summ", 4, "舞孃・魅舞", "舞波與舞蹈領域魅惑敵人，舞伴追擊");
  ASC.bow[5] = mk("blade", 5, "舞孃・鞭舞", "鞭擊連打、哼歌強化普攻");
  if (typeof RO_ASC_SPEC !== "undefined") {
    RO_ASC_SPEC.bow[4] = ["summ", "bsong", "dissonance", "rain", "mcount", "mdmg", [0, 0], ["舞孃長鞭", 1952, 1.1, 0]];
    RO_ASC_SPEC.bow[5] = ["blade", "pierce", "rain", "exarrow", "mstrike", "prec", [0, 1], ["流浪者之鞭", 1956, 1.15, 2]];
  }
}

// ---------------------------------------------------------------------------
// 6. 女性外觀
function v123SpriteInstall() {
  const F = typeof window !== "undefined" && window.RO_JOB_ASSETS_F;
  if (!F || typeof RO === "undefined" || !RO.assets?.characters || typeof roClass === "undefined") return;
  for (const [k, def] of Object.entries(F.characters || {})) RO.assets.characters[k] = { ...def, lazy: 1 };
  // 舞孃線（女性限定）的外觀鍵：與 v63 職業線的 sp 對應
  for (const k of ["dancer", "gypsy", "wanderer"]) if (F.characters[k + "_f"]) RO.assets.characters[k] = { ...F.characters[k + "_f"], lazy: 1 };
  const ready = (key) => {
    const c = RO.assets.characters[key];
    if (!c) return false;
    const src = RO.root + c.states.idle.file;
    if (RO.images[src]) return true;
    if (!RO.failed.includes(src) && !c.v123ld) {
      c.v123ld = 1;
      const im = new Image();
      im.onload = () => (RO.images[src] = im);
      im.onerror = () => RO.failed.push(src);
      im.src = src;
    }
    return false;
  };
  for (const [cls, c] of Object.entries(roClass)) {
    const desc = Object.getOwnPropertyDescriptor(c, "sprite"),
      old = desc?.get,
      base = old ? null : c.sprite;
    Object.defineProperty(c, "sprite", {
      configurable: true,
      get: () => {
        const k = old ? old() : base;
        if (S && S.cls === cls && S.sex === "f") {
          const fk = k + "_f";
          if (RO.assets.characters[fk] && ready(fk)) return fk;
        }
        return k;
      },
    });
  }
}

// ---------------------------------------------------------------------------
// 7. 性別：建立角色、角色頁更改、職業線限制
const v123Sex = () => (S && S.sex === "f" ? "f" : "m");
const v123LineOk = (L) => !L?.sex || L.sex === v123Sex();
// 目前在性別限定的職業線（詩人線、舞孃線）時不能改性別
function v123SexLocked() {
  if (!S?.tal?.asc || typeof v63LineOf !== "function") return false;
  const L = V63_LINES[S.cls]?.[v63LineOf(S.cls, S.tal.asc)];
  return !!L?.sex;
}
function v123PickPaint() {
  const pk = document.getElementById("pick");
  if (!pk) return;
  for (const b of pk.querySelectorAll("[data-v123sex]")) b.setAttribute("aria-pressed", b.dataset.v123sex === V123.pickSex ? "true" : "false");
  for (const b of pk.querySelectorAll("[data-cls]")) {
    const im = b.querySelector(".pkWell img"),
      base = V123_BASE[b.dataset.cls];
    if (im && base) im.src = `${RO.root}characters/${base}${V123.pickSex === "f" ? "_f" : ""}-idle.png`;
    // 二轉職業線（依選擇的性別）
    const rt = b.querySelector(".ro-routes"),
      lines = typeof V63_LINES !== "undefined" ? V63_LINES[b.dataset.cls] : null;
    if (rt && lines) rt.textContent = lines.filter((L) => !L.sex || L.sex === V123.pickSex).map((L) => L.n[0]).join(" ／ ");
  }
}
function v123UiInstall() {
  if (typeof document === "undefined" || typeof ui === "undefined") return;
  // 建立角色：性別選擇（預覽圖跟著切換）
  if (typeof showPick === "function") {
    const sp = showPick;
    showPick = function (t = "first", ...a) {
      const r = sp.call(this, t, ...a);
      try {
        if (t !== "name") {
          V123.pickSex = "m";
          const nm = document.querySelector("#pick .pkName");
          if (nm && !document.querySelector("#pick .v123sex"))
            nm.insertAdjacentHTML("afterend", `<div class="v123sex"><span>性別</span><button type="button" data-v123sex="m">男</button><button type="button" data-v123sex="f">女</button><small>弓箭手：男性二轉為詩人線、女性為舞孃線</small></div>`);
          v123PickPaint();
        }
      } catch (e) {}
      return r;
    };
  }
  // 新角色帶上選擇的性別
  if (typeof startGame === "function") {
    const sg = startGame;
    startGame = function (t, fresh, ...a) {
      if (t && fresh === true && !document.getElementById("pick")?.hidden && !t.sex) t.sex = V123.pickSex;
      if (t && !t.sex) t.sex = "m";
      return sg.call(this, t, fresh, ...a);
    };
  }
  // 角色頁：性別按鈕
  if (typeof ui.p_char === "function") {
    const pc = ui.p_char;
    ui.p_char = function (...a) {
      const h = String(pc.apply(this, a));
      if (!S) return h;
      const f = v123Sex() === "f",
        lock = v123SexLocked();
      const btn = `<button class="btn sm v123sexBtn" data-v123chsex ${lock ? 'disabled title="詩人線、舞孃線無法更改性別"' : 'title="點一下更改性別"'}>${f ? "♀ 女" : "♂ 男"}</button>`;
      return h.replace('<span class="spacer"></span><button class="btn sm" data-act="chars">', btn + '<span class="spacer"></span><button class="btn sm" data-act="chars">');
    };
  }
  document.addEventListener(
    "click",
    (e) => {
      const b = e.target.closest?.("[data-v123sex],[data-v123chsex]");
      if (!b) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (b.dataset.v123sex) {
        V123.pickSex = b.dataset.v123sex === "f" ? "f" : "m";
        return v123PickPaint();
      }
      if (!S || b.disabled) return;
      if (v123SexLocked()) return toast("詩人線、舞孃線無法更改性別", "bad");
      S.sex = v123Sex() === "f" ? "m" : "f";
      markDirty();
      saveNow?.();
      toast(`性別已改為「${S.sex === "f" ? "女" : "男"}」`);
      ui.render();
    },
    true,
  );
  // 選擇職業線：只顯示這個性別能選的（弓箭手：男性詩人線、女性舞孃線）
  if (typeof v63PickLine === "function") {
    const pl = v63PickLine;
    v63PickLine = function (...a) {
      const r = pl.apply(this, a);
      try {
        const lines = V63_LINES[S.cls] || [];
        const cards = [...document.querySelectorAll("#sheet .v63card")];
        cards.forEach((c, i) => lines[i] && !v123LineOk(lines[i]) && c.remove());
        const note = document.querySelector("#sheet h2 + p.note");
        if (note && lines.some((L) => L.sex)) note.textContent = note.textContent.replace("每個職業有兩條職業線。", `每個職業有兩條職業線（弓箭手的第二條依性別：男性詩人、女性舞孃）。`);
      } catch (e) {}
      return r;
    };
  }
  window.addEventListener(
    "click",
    (e) => {
      const el = e.target.closest?.('[data-v63="lineYes"],[data-v63="line"]');
      if (!el || !S) return;
      const L = V63_LINES[S.cls]?.[+el.dataset.v];
      if (L && !v123LineOk(L)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        toast(`「${L.n[0]}」只限${L.sex === "f" ? "女性" : "男性"}`, "bad");
      }
    },
    true,
  );
  if (!document.getElementById("v123css")) {
    const st = document.createElement("style");
    st.id = "v123css";
    st.textContent = `
#pick .v123sex{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;margin:4px 0 8px}
#pick .v123sex span{font-weight:700}
#pick .v123sex button{min-width:56px;padding:4px 14px;border:1px solid #9fb3c4;background:#fff;color:#3e5568;font:inherit;font-weight:700;cursor:pointer;border-radius:4px}
#pick .v123sex button[aria-pressed="true"]{background:#3e6c86;border-color:#2c5168;color:#fff}
#pick .v123sex small{flex-basis:100%;text-align:center;color:#6a7f94;font-size:11px}
.v123sexBtn{margin-left:6px}`;
    document.head.appendChild(st);
  }
  // 說明
  const h = HELP.char?.[1] || HELP.tree?.[1];
  if (Array.isArray(h) && !h.some((r) => r[0] === "性別"))
    h.push(["性別", "建立角色時選擇男或女（外觀為 RO 原版的男女角色），之後可在角色頁名字旁的按鈕免費更改。弓箭手二轉時男性走詩人線、女性走舞孃線（舞孃 → 吉普賽 → 流浪者）；在這兩條職業線時無法更改性別。"]);
}

// ---------------------------------------------------------------------------
function v123Post() {
  for (const f of [v123Moves, v123HitInstall, v123SpriteInstall, v123UiInstall])
    try {
      f();
    } catch (e) {
      console.error("v123", f.name, e);
    }
}
if (typeof roV4Install === "function") {
  const r4v123 = roV4Install;
  roV4Install = function () {
    try {
      v123Pre();
    } catch (e) {
      console.error("v123Pre", e);
    }
    r4v123.apply(this, arguments);
    v123Post();
  };
}
