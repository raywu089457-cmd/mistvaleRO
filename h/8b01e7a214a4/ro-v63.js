/* 流浪仙境 v6.3
   1. 終極天賦的負面代價降為原本的 1/3（好處不變），說明文字同步改寫。
   （轉職結構改版接在後面） */
"use strict";

// ---------------------------------------------------------------------------
// 1. 終極天賦代價 ×1/3
const V63_ULT_K = 1 / 3;
function v63UltSoften() {
  const fmtN = (x) => String(+x.toFixed(x < 1 ? 2 : 0));
  for (const n of Object.values(RO_TREE_NODES)) {
    if (n.kind !== "ultimate" || n.v63) continue;
    n.v63 = 1;
    const neg = [];
    const walk = (o) => {
      for (const [k, v] of Object.entries(o || {})) {
        if (v && typeof v === "object") walk(v);
        else if (typeof v === "number" && v < 0) {
          const frac = Math.abs(v) < 1;
          let nv = frac ? Math.round((v * V63_ULT_K) * 100) / 100 : Math.round(v * V63_ULT_K);
          if (nv === 0) nv = frac ? -0.01 : -1;
          o[k] = nv;
          neg.push([frac ? Math.abs(v) * 100 : Math.abs(v), frac ? Math.abs(nv) * 100 : Math.abs(nv)]);
        }
      }
    };
    walk(n.mods);
    if (!neg.length) continue;
    // 代價數字前面一定是「−」或「降低」
    let d = n.desc;
    for (const [a, b] of neg) {
      const re = new RegExp("(−|-|降低 ?)" + String(+a.toFixed(2)).replace(".", "\\.") + "(?![\\d.])");
      d = d.replace(re, (m, p) => p + "\u0000" + fmtN(b));
    }
    n.desc = d.replace(/\u0000/g, "");
  }
}
v63UltSoften();

// ===========================================================================
// 2. 轉職結構：每職業 2 條職業線 × 2 種流派
//    一轉（Lv30）選職業線；二轉（Lv45）選流派；三轉、四轉職稱與外觀升級。
//    流派仍沿用原本的 4 個分支鍵值（ro_<職業>_0～3），舊存檔可直接對應。
// ===========================================================================
// 職業線：n=[二轉, 三轉, 四轉]、sp=外觀（對應 ro-jobs.js 的角色鍵）、ks=[流派A, 流派B]
const V63_LINES = {
  sword: [
    { n: ["騎士", "騎士領主", "盧恩騎士"], sp: ["knight", "lord_knight", "rune_knight"], ks: [0, 2], d: "騎槍與龍息，攻守兩路" },
    { n: ["十字軍", "聖殿十字軍", "皇家禁衛隊"], sp: ["crusader", "paladin", "royal_guard"], ks: [1, 3], d: "神聖之力與盾牌守護" },
  ],
  bow: [
    { n: ["獵人", "神射手", "遊俠"], sp: ["hunter", "sniper", "ranger"], ks: [0, 2], d: "遠距狙擊與陷阱獵殺" },
    { n: ["詩人", "搞笑藝人", "宮廷樂師"], sp: ["bard", "clown", "minstrel"], ks: [3, 1], d: "樂曲增益與樂器射擊" },
  ],
  mage: [
    { n: ["巫師", "超魔導士", "大法師"], sp: ["wizard", "high_wizard", "warlock"], ks: [0, 2], d: "大範圍元素魔法與禁咒" },
    { n: ["賢者", "智者", "元素使"], sp: ["sage", "professor", "sorcerer"], ks: [1, 3], d: "元素精靈與自動念咒" },
  ],
  thief: [
    { n: ["刺客", "十字刺客", "十字斬首者"], sp: ["assassin", "assassin_cross", "guillotine_cross"], ks: [2, 0], d: "拳刃暗殺：技能爆發或雙刀平砍" },
    { n: ["流氓", "神行太保", "魅影追蹤者"], sp: ["rogue", "stalker", "shadow_chaser"], ks: [1, 3], d: "偷襲背刺與暗影詛咒" },
  ],
  acolyte: [
    { n: ["祭司", "神官", "大主教"], sp: ["priest", "high_priest", "arch_bishop"], ks: [0, 2], d: "聖光審判與祈禱召喚" },
    { n: ["武僧", "武術宗師", "修羅"], sp: ["monk", "champion", "sura"], ks: [1, 3], d: "連段拳法與氣功爆發" },
  ],
  merchant: [
    { n: ["鐵匠", "神工匠", "機匠"], sp: ["blacksmith", "whitesmith", "mechanic"], ks: [0, 2], d: "戰鬥鐵匠與機械砲台" },
    { n: ["鍊金術師", "創造者", "基因學者"], sp: ["alchemist", "creator", "genetic"], ks: [1, 3], d: "生命體與毒雲植物" },
  ],
};
// 平A流（普攻為主）的流派
const V63_BA = new Set(["ro_bow_1", "ro_mage_3", "ro_thief_0", "ro_acolyte_1", "ro_merchant_0"]);
// 流派：style=流派名、A/S=核心主動／輔助、d=玩法說明、trait=分支特性、rows=天賦（第 1～8 排，null 表示沿用）
const V63T = (n, e) => [n, e];
const V63_STYLE = {
  // ---- 劍士 ----
  ro_sword_0: {
    style: "均衡", A: ["sw_bowl", "sw_brandish", "sw_breath"], S: ["sw_counter", "sw_runeb"],
    d: "體槍騎士：保齡球擊與騎乘攻擊清場，盧恩騎士的龍之吐息補足範圍，攻守平衡",
    trait: V63T("騎槍守勢", { armorp: 20, lifep: 10, res_all: 5 }),
    mech: V63T("龍騎合一", { "sk:sw_bowl:more": 0.2, "sk:sw_breath:more": 0.2 }),
    rows: [
      [V63T("槍騎力量", { "rsc:0:dmgp": 0.7, "rsc:0:armorp": 0.3 }), V63T("騎士體魄", { "rsc:1:lifep": 0.5, "rsc:1:armorp": 0.6 }), V63T("龍血靈巧", { "rsc:5:skill": 0.4, "rsc:5:res_all": 0.05 })],
      [V63T("保齡連撞", { "sk:sw_bowl:more": 0.25, "sk:sw_bowl:area": 0.15 }), V63T("騎乘突進", { h_first: 0.4, move: 12 }), V63T("龍息吐納", { "sk:sw_breath:more": 0.25, lifep: 6 })],
      null,
      [V63T("火龍之息", { roElHit_brn: 0.15, brn: 40 }), V63T("冰霜龍鱗", { "sk:sw_frost:more": 0.2, chlVul: 0.08 }), V63T("盧恩護符", { res_all: 8, ail: 0.15 })],
      null,
      [V63T("騎士榮耀", { boss: 0.2, roBossDR: 0.1 }), V63T("穩紮穩打", { h_ramp: 0.025, armorp: 15 }), V63T("龍騎威壓", { exec: 0.3, area: 10 })],
      [V63T("自動防禦", { dmgTaken: 0.12, armorp: 25 }), V63T("龍血再生", { regenPct: 0.004, lifep: 8 }), V63T("騎士誓言", { h_cheat: 0.3, lifep: 8 })],
      [V63T("龍息奧義", { "nth:sw_breath": 1.2, "sk:sw_breath:area": 0.2 }), V63T("保齡奧義", { "nth:sw_bowl": 1.2, "sk:sw_bowl:cd": 0.15 }), V63T("均衡之道", { "rscm:1:dmg": 0.2, "rsc:0:dmgp": 0.4 })],
    ],
  },
  ro_sword_2: { style: "暴力", A: ["sw_spiral", "sw_berserk", "sw_wave"], S: ["fury", "sw_limit"], d: "螺旋槍騎：螺旋擊刺單體爆發與狂暴，以血換傷、高風險高輸出" },
  ro_sword_1: {
    style: "神聖", A: ["sw_gcross", "sw_charge", "sw_shboom"], S: ["sw_brand", "sw_limit"],
    d: "捨命攻擊：聖十字審判與衝鋒攻擊，消耗生命換取神聖爆發",
    mech: V63T("聖十字精通", { "sk:sw_gcross:more": 0.3, "sk:sw_gcross:area": 0.15 }),
    patch: [[1, 1, V63T("衝鋒之誓", { "sk:sw_charge:more": 0.3, move: 8 })]],
  },
  ro_sword_3: {
    style: "鐵壁", A: ["sw_provoke", "sw_shboom", "sw_gcross"], S: ["sw_parry", "sw_counter"],
    d: "反射盾禁衛：挑釁聚怪、以護甲反擊，越硬越痛",
    wpn: ["禁衛長矛", 1404, 0.9, 0],
    trait: V63T("反射盾", { thorn: 1, armorp: 30, lifep: 10 }),
    mech: V63T("反射壁壘", { armDmg: 0.006, tntVul: 0.1 }),
    rows: [
      [V63T("鐵壁體魄", { "rsc:1:lifep": 0.7, "rsc:1:armorp": 0.5 }), V63T("堅毅力量", { "rsc:0:dmgp": 0.6, "rsc:0:armorp": 0.4 }), V63T("信仰之盾", { "rsc:4:skill": 0.4, "rsc:4:dmgTaken": 0.0015 })],
      [V63T("挑釁大師", { tntVul: 0.2, "sk:sw_provoke:cd": 0.3 }), V63T("盾擊反射", { "sk:sw_shboom:more": 0.3, armDmg: 0.006 }), V63T("犧牲", { tntDmg: 0.15, lifep: 8 })],
      null,
      [V63T("光之盾", { res_all: 10, dmgTaken: 0.05 }), V63T("聖光反擊", { roElHit_shk: 0.12, armDmg: 0.004 }), V63T("荊棘鎧甲", { armorp: 40, h_pain: 0.15 })],
      null,
      [V63T("守護者", { roBossDR: 0.2, armorp: 20 }), V63T("不動如山", { h_ramp: 0.02, dmgTaken: 0.06 }), V63T("制裁", { exec: 0.3, tntVul: 0.1 })],
      [V63T("信任", { lifep: 15, regenPct: 0.003 }), V63T("堅毅", { dmgTaken: 0.1, res_all: 6 }), V63T("格擋", { graze: 0.2, armorp: 20 })],
      [V63T("鐵壁奧義", { armDmg: 0.01 }), V63T("盾牌奧義", { "nth:sw_shboom": 1.2, "sk:sw_shboom:area": 0.25 }), V63T("禁衛之道", { "rscm:1:dmg": 0.25, "rsc:1:armorp": 0.4 })],
    ],
  },
  // ---- 弓箭手 ----
  ro_bow_0: { style: "狙殺", A: ["bw_sharp", "bw_snipe", "bw_blitz"], S: ["prec", "bw_range"], d: "遠距暴擊狙殺：銳利射擊與蓄力狙擊，普攻觸發獵鷹突擊" },
  ro_bow_2: {
    style: "陷阱", A: ["bw_ankle", "bw_burst", "bw_varrow"], S: ["bw_trap", "bw_poison"],
    d: "陷阱獵：預放定位陷阱控場，爆裂箭與毒箭清場",
    patch: [[3, 0, V63T("毒蛇陷阱", { psnHit: 0.2, psn: 30, "sk:bw_varrow:more": 0.2 })]],
  },
  ro_bow_3: { style: "合奏", A: ["bw_song", "bw_disso", "bw_bsong"], S: ["bw_ens", "bw_ens2"], d: "切換樂章增益，以不協和音與樂靈合奏輸出" },
  ro_bow_1: {
    style: "樂箭", A: ["bw_song", "bw_double", "bw_disso"], S: ["bw_fourth", "prec"],
    d: "平A流：樂器連射為主，歌曲強化普攻，普攻有機率觸發二連矢",
    wpn: ["詩人長弓", 1704, 1.15, 2],
    trait: V63T("樂器練習", { baMore: 1.2, aspd: 20, "bac:bw_double": 0.18 }),
    mech: V63T("急速演奏", { aspd: 12, baMore: 0.1 }),
    rows: [
      [V63T("樂手敏捷", { "rsc:2:aspd": 0.5 }), V63T("樂感靈巧", { "rsc:5:baMore": 0.004 }), V63T("巡演體魄", { "rsc:1:lifep": 0.45, "rsc:2:evap": 0.3 })],
      [V63T("連續射擊", { "bac:bw_double": 0.1, aspd: 8 }), V63T("樂章節拍", { roBasicCd: 0.1, v6song: 0.3 }), V63T("穿雲箭", { baMore: 0.15, crit: 4 })],
      null,
      [V63T("火焰之歌", { roElHit_brn: 0.12, brn: 30 }), V63T("寒冰之歌", { roElHit_chl: 0.12, chlVul: 0.06 }), V63T("雷鳴之歌", { roElHit_shk: 0.12, ail: 0.15 })],
      null,
      [V63T("安可", { boss: 0.2, baMore: 0.075 }), V63T("漸強", { h_ramp: 0.028, aspd: 5 }), V63T("終曲", { exec: 0.35, crit: 3 })],
      [V63T("搖擺步伐", { evap: 35, move: 10 }), V63T("歌聲護體", { h_killshd: 0.03, lifep: 8 }), V63T("舞台魅力", { dmgTaken: 0.08, graze: 0.15 })],
      [V63T("樂箭奧義", { baMore: 0.3 }), V63T("二連矢奧義", { "bac:bw_double": 0.12, "sk:bw_double:more": 0.3 }), V63T("宮廷樂師之道", { "rscm:5:dmg": 0.25, "rsc:2:aspd": 0.3 })],
    ],
  },
  // ---- 魔法師 ----
  ro_mage_0: { style: "元素", A: ["mg_meteor", "mg_storm", "mg_lov"], S: ["amp", "spread"], d: "隕石術、暴風雪、怒雷強擊的大範圍元素反應" },
  ro_mage_2: { style: "禁咒", A: ["mg_tetra", "mg_gravity", "mg_quag"], S: ["mg_reson", "mg_conv"], d: "四元素漩渦一次觸發多種反應，重力場聚怪、泥沼詛咒" },
  ro_mage_1: { style: "精靈", A: ["mg_field", "mg_spirits", "mg_fireball"], S: ["mg_spirit", "mg_reson"], d: "元素領域持續烙印，召喚元素精靈協戰" },
  ro_mage_3: {
    style: "自動念咒", A: ["mg_bolt", "mg_frost", "mg_fireball"], S: ["mg_quick", "mg_reson"],
    d: "平A流（戰鬥賢者）：高攻速普攻，擊中時自動念咒施放雷擊術、霜凍之術",
    wpn: ["賢者法典", 1550, 1.15, 2],
    trait: V63T("自動念咒", { "bac:mg_bolt": 0.18, "bac:mg_frost": 0.12, baMore: 0.3, aspd: 10 }),
    mech: V63T("念咒共鳴", { v6react: 0.3, baMore: 0.075 }),
    rows: [
      [V63T("戰鬥敏捷", { "rsc:2:aspd": 0.55 }), V63T("念咒智力", { "rsc:4:skill": 0.5, "rsc:4:baMore": 0.002 }), V63T("法典體魄", { "rsc:1:lifep": 0.5 })],
      [V63T("雷擊念咒", { "bac:mg_bolt": 0.08, "sk:mg_bolt:more": 0.2 }), V63T("冰箭念咒", { "bac:mg_frost": 0.08, chlVul: 0.06 }), V63T("火球念咒", { "bac:mg_fireball": 0.1, brn: 30 })],
      null,
      [V63T("屬性附加・火", { roElHit_brn: 0.15, baMore: 0.05 }), V63T("屬性附加・水", { roElHit_chl: 0.15, baMore: 0.05 }), V63T("屬性附加・風", { roElHit_shk: 0.15, baMore: 0.05 })],
      null,
      [V63T("智者洞察", { boss: 0.2, crit: 3 }), V63T("法力循環", { roBasicCd: 0.12, cdr: 4 }), V63T("破法", { exec: 0.3, h_first: 0.3 })],
      [V63T("魔法屏障", { dmgTaken: 0.1, res_all: 6 }), V63T("魔力汲取", { h_killshd: 0.025, regenPct: 0.003 }), V63T("空間轉移", { graze: 0.2, move: 12 })],
      [V63T("念咒奧義", { "bac:mg_bolt": 0.1, "bac:mg_frost": 0.1 }), V63T("戰鬥法典", { baMore: 0.25, aspd: 8 }), V63T("元素使之道", { "rscm:4:dmg": 0.25, "rsc:2:aspd": 0.3 })],
    ],
  },
  // ---- 盜賊 ----
  ro_thief_2: { style: "技能", A: ["th_sonic", "th_envenom", "th_clone"], S: ["mstrike", "th_finish"], d: "技能爆發：鋒刃連斬累積連擊點，音速投擲與毒素爆發終結，殘影分身" },
  ro_thief_0: {
    style: "平A", A: ["th_dual", "th_venom", "th_slash"], S: ["pstack", "th_crit"],
    d: "平A流：二刀流拳刃高速平砍、暴擊與塗毒，普攻有機率觸發鋒刃連斬",
    wpn: ["刺客雙拳刃", 1250, 1.25, 4],
    trait: V63T("二刀連擊", { baMore: 0.4, aspd: 15, psnHit: 0.15, crit: 4 }),
    mech: V63T("連擊本能", { v6cpMax: 1, baMore: 0.075 }),
    rows: [
      [V63T("拳刃敏捷", { "rsc:2:aspd": 0.6 }), V63T("致命幸運", { "rsc:3:crit": 0.1, "rsc:3:critm": 0.4 }), V63T("影步體魄", { "rsc:2:evap": 0.5, "rsc:1:lifep": 0.4 })],
      [V63T("雙刀連擊", { "bac:th_slash": 0.1, aspd: 8 }), V63T("毒素塗抹", { psnHit: 0.2, psn: 30 }), V63T("卡塔爾精通", { baMore: 0.15, critm: 20 })],
      null,
      [V63T("致命毒刃", { psnVul: 0.15, psn: 25 }), V63T("冰刃", { roElHit_chl: 0.12, chlVul: 0.05 }), V63T("暗影刃", { crit: 5, critm: 25 })],
      null,
      [V63T("靈魂破壞", { boss: 0.22, baMore: 0.05 }), V63T("殺意漸濃", { h_ramp: 0.026, aspd: 5 }), V63T("割喉", { exec: 0.4, h_close: 0.08 })],
      [V63T("殘影", { evap: 35, graze: 0.15 }), V63T("血刃", { leech: 0.015, h_frenzy: 0.04 }), V63T("隱匿", { h_killshd: 0.03, move: 10 })],
      [V63T("毒神", { psnMax: 3, psnRate: 0.15 }), V63T("平砍奧義", { baMore: 0.3, crit: 3 }), V63T("十字斬首者之道", { "rscm:2:dmg": 0.25, "rsc:3:crit": 0.05 })],
    ],
  },
  ro_thief_1: { style: "偷襲", A: ["th_snatch", "th_backstab", "th_hide"], S: ["th_crit", "th_step"], d: "隱匿偷襲 ×3、背刺與強奪疊加傷害" },
  ro_thief_3: { style: "暗咒", A: ["th_mark", "th_weak", "th_hide"], S: ["th_step", "th_crit"], d: "暗影印記跳躍與弱點詛咒" },
  // ---- 服事 ----
  ro_acolyte_0: { style: "聖光", A: ["ac_light", "ac_heal", "ac_sanct"], S: ["ac_bless", "ac_grace"], d: "驅魔審判：治癒溢出轉成聖光，光耀之堂" },
  ro_acolyte_2: { style: "祈禱", A: ["ac_magnus", "ac_orbs", "ac_wrath"], S: ["ac_angel", "ac_angel2"], d: "十字驅魔聖域與聖靈環繞" },
  ro_acolyte_1: {
    style: "連拳", A: ["ac_combo", "ac_call", "ac_asura"], S: ["ac_triple", "ac_focus"],
    d: "平A流：普攻觸發三段掌接連打掌，連段累積氣球，最後以阿修羅收尾",
    trait: V63T("三段掌", { "bac:ac_combo": 0.2, baMore: 0.35, aspd: 10 }),
    mech: V63T("氣之連拳", { v6sphPas: 0.03, baMore: 0.075 }),
    rows: [
      [V63T("拳法敏捷", { "rsc:2:aspd": 0.55 }), V63T("武僧力量", { "rsc:0:baMore": 0.003, "rsc:0:dmgp": 0.3 }), V63T("氣功體魄", { "rsc:1:lifep": 0.5 })],
      [V63T("三段掌", { "bac:ac_combo": 0.1, aspd: 6 }), V63T("連打掌精通", { "sk:ac_combo:more": 0.3 }), V63T("猛龍誇強", { baMore: 0.15, h_first: 0.3 })],
      null,
      [V63T("金剛不壞", { dmgTaken: 0.08, armorp: 20 }), V63T("爆氣", { v6sphGen: 0.25, baMore: 0.05 }), V63T("氣功彈", { "sk:ac_finger:more": 0.25, roElHit_shk: 0.1 })],
      null,
      [V63T("阿修羅之怒", { boss: 0.22, crit: 3 }), V63T("連段漸強", { h_ramp: 0.028, aspd: 5 }), V63T("一擊必殺", { exec: 0.35, critm: 20 })],
      [V63T("金剛", { dmgTaken: 0.1, lifep: 8 }), V63T("氣血循環", { leech: 0.012, regenPct: 0.003 }), V63T("殘影步", { graze: 0.2, move: 12 })],
      [V63T("連拳奧義", { baMore: 0.3 }), V63T("三段掌奧義", { "bac:ac_combo": 0.12, "sk:ac_combo:area": 0.2 }), V63T("武術宗師之道", { "rscm:0:dmg": 0.25, "rsc:2:aspd": 0.3 })],
    ],
  },
  ro_acolyte_3: { style: "爆氣", A: ["ac_knuckle", "ac_rampage", "ac_finger"], S: ["ac_focus", "ac_spirit"], d: "修羅：閃電步突進、大纏崩捶與指彈消耗氣球爆發" },
  // ---- 商人 ----
  ro_merchant_0: {
    style: "戰鬥", A: ["mc_hfall", "mc_term", "mc_mammon"], S: ["mc_over", "mc_hammer"],
    d: "平A流（戰鬥鐵匠）：速度激發與武器強化的高速斧擊，普攻有機率觸發大地之擊",
    trait: V63T("速度激發", { aspd: 20, baMore: 0.4, "bac:mc_hfall": 0.08 }),
    mech: V63T("過載", { v6cart: 0.3, baMore: 0.075 }),
    rows: [
      [V63T("鍛造力量", { "rsc:0:dmgp": 0.6, "rsc:0:baMore": 0.002 }), V63T("鐵匠敏捷", { "rsc:2:aspd": 0.5 }), V63T("鐵匠體魄", { "rsc:1:lifep": 0.5, "rsc:1:armorp": 0.4 })],
      [V63T("武器強化", { baMore: 0.15, dmgp: 8 }), V63T("速度激發", { aspd: 12, roBasicCd: 0.08 }), V63T("大地之擊", { "bac:mc_hfall": 0.08, "sk:mc_hfall:area": 0.15 })],
      null,
      [V63T("火焰武器", { roElHit_brn: 0.15, brn: 30 }), V63T("武器完美化", { boss: 0.12, crit: 3 }), V63T("淬鍊", { armorp: 30, res_all: 6 })],
      null,
      [V63T("神匠之怒", { boss: 0.2, baMore: 0.05 }), V63T("戰意漸濃", { h_ramp: 0.026, aspd: 5 }), V63T("重擊", { exec: 0.3, critm: 20 })],
      [V63T("精煉護甲", { dmgTaken: 0.1, armorp: 25 }), V63T("鍛造之血", { leech: 0.012, lifep: 8 }), V63T("財富之盾", { v6zeny: 0.2, dmgTaken: 0.08 })],
      [V63T("戰鬥奧義", { baMore: 0.3 }), V63T("極限強化", { aspd: 15, critm: 30 }), V63T("神工匠之道", { "rscm:0:dmg": 0.25, "rsc:2:aspd": 0.3 })],
    ],
  },
  ro_merchant_2: { style: "機械", A: ["mc_faw", "mc_cannon", "mc_axe"], S: ["mc_proj", "mc_prec"], d: "FAW 砲台、加農砲與斧頭龍捲，熱量滿時過熱爆發" },
  ro_merchant_1: { style: "生命體", A: ["mc_homun", "mc_acidbomb", "mc_firebomb"], S: ["mcount", "mdmg"], d: "生命體、強酸火煙瓶與火焰瓶" },
  ro_merchant_3: { style: "毒雲", A: ["mc_miasma", "mc_plant", "mc_spore"], S: ["mc_acid", "mcount"], d: "毒雲、地獄植物與孢子爆炸" },
};
// 技能寶石可購買的流派（流派編號）
const V63_JOB = {
  sw_bowl: [0], sw_brandish: [0], sw_breath: [0], sw_ignite: [0], sw_frost: [0], sw_runeb: [0], sw_counter: [0, 3],
  sw_charge: [1], sw_shboom: [1, 3], sw_gcross: [1, 3], sw_parry: [3],
  sw_spiral: [2], sw_berserk: [2], sw_wave: [2],
  bw_varrow: [2], bw_corrode: [2], bw_poison: [2], bw_song: [3, 1], bw_disso: [3, 1], bw_ens2: [3, 1],
  mg_gravity: [2], mg_quake: [2],
  th_envenom: [2], th_sonic: [2], th_clone: [2], th_slash: [0, 2], th_crit: [0, 2],
};
// 分支平衡倍率（v6 的 V6_BAL）：新流派先沿用同職業的中位數，之後由武鬥場試算調整
const V63_BAL = { ro_sword_3: 1.0, ro_bow_1: 1.25, ro_mage_3: 1.0, ro_acolyte_1: 1.5, ro_merchant_0: 1.0 };
for (const [k, v] of Object.entries(V63_JOB)) if (typeof V6_JOB !== "undefined") V6_JOB[k] = v;
if (typeof V6_BAL !== "undefined") Object.assign(V6_BAL, V63_BAL);
// 盜賊流派倍率（v5.6 的 V56_THIEF，依流派編號）：0＝刺客平A、2＝刺客技能（合併毒刃與音速）
if (typeof V56_THIEF !== "undefined") V56_THIEF.br.splice(0, 4, 1.0, 1.1, 1.6, 2.4);
if (typeof V5_TAL_TXT !== "undefined") {
  V5_TAL_TXT.baMore = (v) => `普攻傷害 +${v5P(v, 3)}%`;
  for (const id of ["bw_double", "mg_bolt", "mg_frost", "mg_fireball", "th_slash", "ac_combo", "mc_hfall"])
    V5_TAL_TXT["bac:" + id] = (v) => `普攻擊中時 ${v5P(v, 3)}% 機率施放「${roSkName(id)}」（需放在技能盤上）`;
}

const v63LineOf = (cls, k) => {
  const i = ASC[cls]?.findIndex((b) => b.k === k);
  return i == null || i < 0 ? -1 : (V63_LINES[cls] || []).findIndex((l) => l.ks.includes(i));
};
const v63Stage = () => (!S?.tal ? 0 : S.tal.tr >= 4 ? 2 : S.tal.tr >= 3 ? 1 : 0);
const v63Pending = () => !!(S?.tal?.asc && S.tal.v63s === 0);
function v63Title(cls, k, stage) {
  const li = v63LineOf(cls, k),
    st = V63_STYLE[k];
  if (li < 0 || !st) return "";
  const L = V63_LINES[cls][li];
  return `${L.n[stage]}（${v63Pending() ? "流派未定" : st.style + "流"}）`;
}

// 安裝後套用：名稱、核心技能、天賦、分支特性
function v63AscApply() {
  for (const [cls, bs] of Object.entries(ASC))
    bs.forEach((b, bi) => {
      const st = V63_STYLE[b.k];
      if (!st) return;
      b.v63style = st.style;
      b.core = { A: [...st.A], S: [...st.S] };
      if (st.wpn) b.wpn = st.wpn;
      const sp = RO_ASC_SPEC[cls]?.[bi];
      if (sp) {
        for (let i = 0; i < 5; i++) sp[i + 1] = [...st.A, ...st.S][i];
        if (st.wpn) sp[7] = st.wpn;
      }
      const set = (t, [n, e]) => Object.assign(t, { n, e: { ...e }, d: v5TalText(e), src: null });
      if (st.rows) st.rows.forEach((row, ri) => row && row.forEach((x, i) => b.t[ri]?.[i] && set(b.t[ri][i], x)));
      for (const [ri, i, x] of st.patch || []) b.t[ri]?.[i] && set(b.t[ri][i], x);
      if (st.mech && b.t[4]?.[2]) set(b.t[4][2], st.mech);
      if (st.trait) b.trait = { n: st.trait[0], e: { ...st.trait[1] }, d: v5TalText(st.trait[1]) };
      const li = v63LineOf(cls, b.k),
        L = V63_LINES[cls][li];
      b.d = `核心技能：${st.A.map(roSkName).join("、")}｜輔助：${st.S.map(roSkName).join("、")}｜${st.d}`;
      b.v63base = `${L.n[0]}（${st.style}流）`;
      // 名稱依目前角色的轉職階段顯示（他人快照或未選擇時用二轉職稱）
      Object.defineProperty(b, "n", {
        configurable: true,
        enumerable: true,
        get: () => (S?.cls === cls && S?.tal?.asc === b.k ? v63Title(cls, b.k, v63Stage()) : b.v63base),
        set: () => {},
      });
    });
}

// ---------------------------------------------------------------------------
// 平A流：普攻擊中時機率施放技能（bac:<技能>）
function v63OnBasicHit(m) {
  if (!S || !PS || !alive(m)) return;
  const g = typeof v6G === "function" ? v6G() : {};
  if (g.inExtra) return;
  for (const [k, v] of Object.entries(PS.T || {})) {
    if (!k.startsWith("bac:") || !(v > 0) || RAND() >= v) continue;
    const gem = activeGems().find((x) => x.id === k.slice(4));
    if (!gem) continue;
    g.inExtra = 1;
    try {
      castSkill(gem, 0.6);
    } catch (e) {
    } finally {
      g.inExtra = 0;
    }
  }
}

// ---------------------------------------------------------------------------
// 轉職選擇介面
function v63Card(inner, act, val, label, on) {
  return `<div class="board v63card"><div class="row">${inner}<span class="spacer"></span><button class="btn sm ${on ? "primary" : ""}" data-v63="${act}" data-v="${val}">${label}</button></div></div>`;
}
function v63PickLine(confirm = -1) {
  const lines = V63_LINES[S.cls];
  $("#sheet").className = "wide";
  $("#sheetBg").hidden = false;
  const card = (L, li) => {
    const styles = L.ks.map((i) => ASC[S.cls][i]).map((b) => `<div class="v63sty"><b>${esc(b.v63style)}流</b>${V63_BA.has(b.k) ? '<span class="tag">平A</span>' : ""}<div class="note">${esc(V63_STYLE[b.k].d)}</div></div>`).join("");
    return `<div class="board v63card${confirm === li ? " cur" : ""}"><div class="row"><b style="font-size:16px">${L.n[0]}</b><span class="note">${L.n.join(" → ")}</span><span class="spacer"></span><button class="btn sm ${confirm === li ? "primary" : ""}" data-v63="${confirm === li ? "lineYes" : "line"}" data-v="${li}">${confirm === li ? "確定轉職" : "選擇"}</button></div><div class="note">${esc(L.d)}</div><div class="v63stys">${styles}</div></div>`;
  };
  $("#sheet").innerHTML = `<h2>選擇職業（二轉）</h2><p class="note">每個職業有兩條職業線。完成二轉試煉（Lv.${TRIAL[1]?.lv || 45}）後再選擇流派；三轉、四轉時職稱與外觀會升級。</p>${lines.map(card).join("")}<div class="row"><span class="spacer"></span><button class="btn" data-act="close">稍後再選</button></div>`;
}
function v63PickStyle(confirm = "") {
  const li = v63LineOf(S.cls, S.tal.asc),
    L = V63_LINES[S.cls][li];
  if (!L) return;
  $("#sheet").className = "wide";
  $("#sheetBg").hidden = false;
  const card = (b) => {
    const st = V63_STYLE[b.k],
      cur = confirm === b.k;
    return `<div class="board v63card${cur ? " cur" : ""}"><div class="row"><b style="font-size:16px">${esc(b.v63base)}</b>${V63_BA.has(b.k) ? '<span class="tag">平A</span>' : ""}<span class="spacer"></span><button class="btn sm ${cur ? "primary" : ""}" data-v63="${cur ? "styYes" : "sty"}" data-v="${b.k}">${cur ? "確定選擇" : "選擇"}</button></div><div>${esc(st.d)}</div>${b.trait ? `<div class="note">分支特性・${esc(b.trait.n)}：${esc(b.trait.d)}</div>` : ""}<div class="note">核心技能：${b.core.A.map(roSkName).join("、")}</div><div style="color:var(--muted);font-size:12px">${b.t.flat().map((t) => t.n).join("、")}</div></div>`;
  };
  $("#sheet").innerHTML = `<h2>選擇流派・${L.n[0]}</h2><p class="note">選擇後天賦點會全數退還，可重新分配。之後重置職業需消耗 300 Zeny。</p>${L.ks.map((i) => card(ASC[S.cls][i])).join("")}<div class="row"><span class="spacer"></span><button class="btn" data-act="close">稍後再選</button></div>`;
}
function v63UiInstall() {
  const ap = ui.ascPick;
  ui.ascPick = function (t = "") {
    if (!S?.tal?.tr) return;
    if (!S.tal.asc) return v63PickLine();
    if (v63Pending() && S.tal.tr >= 2) return v63PickStyle();
  };
  document.addEventListener(
    "click",
    (e) => {
      const el = e.target.closest?.("[data-v63]");
      if (!el || !S?.tal) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const a = el.dataset.v63,
        v = el.dataset.v;
      if (a === "line") return v63PickLine(+v);
      if (a === "lineYes" && !S.tal.asc) {
        const L = V63_LINES[S.cls][+v];
        S.tal.asc = ASC[S.cls][L.ks[0]].k;
        S.tal.v63s = 0;
        S.tal.p = [];
        stEv?.("asc", { b: S.tal.asc });
        recalc();
        markDirty();
        toast(`轉職為「${L.n[0]}」！完成二轉試煉後可選擇流派`, "lvl");
        sfx("quest");
        ui.badge("char", 1);
        $("#sheetBg").hidden = true;
        $("#sheet").className = "";
        if (S.tal.tr >= 2) later(0.6, () => v63PickStyle());
        return ui.render();
      }
      if (a === "pickSty") return v63PickStyle();
      if (a === "sty") return v63PickStyle(v);
      if (a === "styYes" && v63Pending() && v63LineOf(S.cls, v) === v63LineOf(S.cls, S.tal.asc)) {
        S.tal.asc = v;
        S.tal.v63s = 1;
        S.tal.p = [];
        recalc();
        markDirty();
        toast(`選擇流派「${ascBranch().n}」！可至角色分頁學習天賦`, "lvl");
        sfx("quest");
        ui.badge("char", 1);
        $("#sheetBg").hidden = true;
        $("#sheet").className = "";
        return ui.render();
      }
    },
    true,
  );
  // 職業天賦頁：職業線、階段與流派
  const ah = ui.ascHtml;
  ui.ascHtml = function () {
    let h = ah.call(this);
    const b = ascBranch();
    if (!b || !S.tal.tr) return h;
    const li = v63LineOf(S.cls, b.k),
      L = V63_LINES[S.cls][li],
      stg = v63Stage();
    const path = L.n.map((n, i) => (i === stg ? `<b>${n}</b>` : n)).join(" → ");
    const pend = v63Pending();
    const info = `<div class="board v63path"><div class="row"><span>職業線：${path}</span></div>${pend ? `<div class="row"><span class="note">${S.tal.tr >= 2 ? "已完成二轉試煉，請選擇流派。" : `完成「${TRIAL[1]?.n || "二轉試煉"}」後選擇流派；目前只能學習第 1～2 排。`}</span><span class="spacer"></span>${S.tal.tr >= 2 ? '<button class="btn sm primary" data-v63="pickSty">選擇流派</button>' : ""}</div>` : ""}</div>`;
    h = h.replace(/(<h2>[^]*?<\/h2>)/, `$1${info}`);
    if (pend) {
      // 流派未定：隱藏分支特性與第 3 排以後
      h = h.replace(/<div class="board v5trait">[^]*?<\/div><\/div>/, "");
      h = h.replace(esc(b.d), esc(`${L.d}（完成二轉試煉後，從 ${L.ks.map((i) => ASC[S.cls][i].v63style + "流").join("／")} 選一）`));
      const i = h.indexOf("<h3>第 3 排</h3>");
      if (i > 0) h = h.slice(0, i);
          }
    return h;
  };
  // 二轉試煉完成時提示選流派
  const tw = trialWin;
  trialWin = function (...a) {
    const r = tw.apply(this, a);
    if (v63Pending() && S.tal.tr >= 2) later(1.2, () => ui.ascPick());
    return r;
  };
  // 流派未定：不套用分支特性、不能學第 3 排以後
  const cm = collectMods;
  collectMods = function (...a) {
    const out = cm.apply(this, a);
    return v63Pending() ? out.filter((m) => !String(m.src || "").startsWith("trait:")) : out;
  };
  if (typeof v6ShopOk === "function") {
    const so = v6ShopOk;
    v6ShopOk = function (id) {
      if (so(id)) return true;
      if (!v63Pending()) return false;
      const j = V6_JOB[id],
        li = v63LineOf(S.cls, S.tal.asc),
        L = V63_LINES[S.cls]?.[li];
      return Array.isArray(j) && !!L && L.ks.some((i) => j.includes(i));
    };
  }
}
// 學習天賦：流派未定時只能學第 1～2 排
function v63TalGuard() {
  document.addEventListener(
    "click",
    (e) => {
      const el = e.target.closest?.('[data-act="talL"]');
      if (!el || !v63Pending()) return;
      const b = ascBranch(),
        ri = b?.t.findIndex((row) => row.some((t) => t.k === el.dataset.k));
      if (ri >= 2) {
        e.preventDefault();
        e.stopImmediatePropagation();
        toast("請先選擇流派", "bad");
      }
    },
    true,
  );
}

// ---------------------------------------------------------------------------
// 外觀：依職業線與轉職階段（缺少的外觀沿用前一階段）
function v63SpriteInstall() {
  if (!window.RO_JOB_ASSETS || typeof roClass === "undefined") return;
  const ready = (key) => {
    const c = RO.assets.characters[key];
    if (!c) return false;
    const src = RO.root + c.states.idle.file;
    if (RO.images[src]) return true;
    if (!RO.failed.includes(src) && !c.v63ld) {
      c.v63ld = 1;
      const im = new Image();
      im.onload = () => (RO.images[src] = im);
      im.onerror = () => RO.failed.push(src);
      im.src = src;
    }
    return false;
  };
  for (const [cls, c] of Object.entries(roClass)) {
    const desc = Object.getOwnPropertyDescriptor(c, "sprite");
    const base = desc?.get ? null : c.sprite;
    const old = desc?.get;
    Object.defineProperty(c, "sprite", {
      configurable: true,
      get: () => {
        if (S && S.cls === cls && S.tal?.asc) {
          const L = V63_LINES[cls]?.[v63LineOf(cls, S.tal.asc)];
          if (L)
            for (let i = v63Stage(); i >= 0; i--) {
              const key = L.sp[i];
              if (RO.assets.characters[key] && ready(key)) return key;
            }
        }
        return old ? old() : base;
      },
    });
  }
}

// ---------------------------------------------------------------------------
// 舊存檔：原本的分支對應到新的職業線；改變玩法的分支需重新選流派；轉職天賦退還
const V63_REPICK = new Set(["ro_sword_3", "ro_bow_1", "ro_mage_3", "ro_thief_0", "ro_acolyte_1", "ro_merchant_0"]);
function v63Migrate() {
  if (!S?.tal || S.tal.v63 === 1) return;
  S.tal.v63 = 1;
  const had = S.tal.asc;
  if (had) {
    S.tal.v63s = V63_REPICK.has(had) ? 0 : 1;
    if (S.tal.v63s === 0) {
      const L = V63_LINES[S.cls]?.[v63LineOf(S.cls, had)];
      if (L) S.tal.asc = ASC[S.cls][L.ks[0]].k;
    }
  }
  const n = S.tal.p?.length || 0;
  S.tal.p = [];
  if (had) later(1.6, () => toast(`v6.3 轉職改版：職業改為「職業線 × 流派」，轉職天賦點已退還${S.tal.v63s === 0 ? "；請到角色頁選擇新流派" : ""}`, "lvl", 1));
}

// ---------------------------------------------------------------------------
// 單手／雙手：依新流派修正（只影響之後取得的武器）；雙手流派不建議盾牌
if (typeof V5_WEX !== "undefined")
  Object.assign(V5_WEX, {
    ro_mage_3: [0, { rint: 0.6, aspd: 0.4 }], // 賢者（自動念咒）：單手書，可拿盾
    ro_sword_3: [0, { rvit: 0.6, life: 0.4 }], // 十字軍（鐵壁）：單手長矛＋盾
  });
function v63NoShield() {
  if (!S) return false;
  const w = S.equip?.weapon;
  if (w && canWear(w)) return !!w.h2;
  const d = (typeof V5_WEX !== "undefined" && (V5_WEX[S.tal?.asc] || V5_WEX[S.cls])) || null;
  return !!(d && d[0]);
}
function v63ShieldAdvice() {
  if (typeof roGearAdvice !== "function") return;
  const ga = roGearAdvice;
  roGearAdvice = function (item) {
    if (item && item.slot === "shield" && v63NoShield())
      return { good: false, attack: false, defend: false, damage: 0, survival: 0, empty: false, reason: "雙手武器無法使用盾牌" };
    return ga.call(this, item);
  };
}

// ---------------------------------------------------------------------------
// 修正：v5.6 新地圖的 8 種怪物沒有死亡爆散顏色，擊殺時報錯並中斷經驗值與掉落
if (typeof MON_COLS !== "undefined")
  Object.assign(MON_COLS, {
    dullahan: ["#3a3048", "#8a7aa0", "#c8b8e0"],
    loli: ["#6a2a6a", "#e0a0d8", "#2a1a2a"],
    venatu: ["#7a8a6a", "#c8d0b0", "#4a5048"],
    dimik: ["#5a6a8a", "#b0c0d8", "#3a4050"],
    ferus: ["#b03a2a", "#f0a060", "#5a1a10"],
    acidus: ["#c8a030", "#f0e090", "#6a5010"],
    eremes: ["#5a3a6a", "#c0a0d0", "#2a1a30"],
    kathryne: ["#a04a7a", "#f0c8e0", "#5a2040"],
  });
const V63_BURST_DEF = ["#ffffff", "#d8d0c0", "#8a7a60"];
function v63BurstGuard() {
  if (typeof burst !== "function") return;
  const bu = burst;
  burst = function (t, a, s, e, ...r) {
    return bu.call(this, t, a, s, Array.isArray(e) && e.length ? e : V63_BURST_DEF, ...r);
  };
}

// ---------------------------------------------------------------------------
// 難度（中等）：中後期怪物強度、生怪速度與數量、無限武鬥場
const V63_DIFF = {
  lv0: 40, // 此等級以下不變
  lv1: 100, // 此等級以上達到上限
  hp: 0.5, // 生命最多 ×1.5（地圖頭目 ×1.25）
  bossHp: 0.25,
  dmg: 0.25, // 傷害最多 ×1.25
  mid: { from: 6, to: 10, dens: 3, spawn: 20 }, // 第 7～11 張地圖（Lv45～82）
  late: { dens: 9, spawn: 45 }, // Lv78 以後 4 張與深淵（原 +6、+30%）
  arena: { hp: 1.1, dmg: 1.06, cap: 8 }, // 原 ×1.08、×1.05、6 隻
};
if (typeof V62 !== "undefined") Object.assign(V62.fix, V63_DIFF.late);
const v63DiffK = (lv) => Math.max(0, Math.min(1, (lv - V63_DIFF.lv0) / (V63_DIFF.lv1 - V63_DIFF.lv0)));
const v63MidOn = (m = S?.map) =>
  !!(S && G && m === S.map && !G.arena && !G.tw && G.trial == null && G.guard == null && !ssMap() && m >= V63_DIFF.mid.from && m <= V63_DIFF.mid.to && !(typeof v56AbyTier === "function" && v56AbyTier(m)));
const v63MidText = () => `怪物數量 +${V63_DIFF.mid.dens}・生成速度 +${V63_DIFF.mid.spawn}%`;
function v63DiffInstall() {
  // ① 怪物強度：一般地圖（含深淵、地圖頭目），不影響試煉、守護者、塔、武鬥場、活動
  const am = addMob;
  addMob = function (...a) {
    const n0 = G.mobs.length;
    const r = am.apply(this, a);
    if (G.mobs.length > n0 && !G.arena && !G.tw && G.trial == null && G.guard == null && !ssMap()) {
      const m = G.mobs[G.mobs.length - 1],
        k = v63DiffK(m.lv || 0);
      if (k > 0) {
        const hm = 1 + (m.boss ? V63_DIFF.bossHp : V63_DIFF.hp) * k;
        m.hp = m.max = m.max * hm;
        if (m.sh) m.sh = m.shm = m.shm * hm;
        m.dmg *= 1 + V63_DIFF.dmg * k;
      }
    }
    return r;
  };
  // ② 中期地圖的生怪加成（終局加成由 v6.2 的固定加成提高）
  const ss = slateSum;
  slateSum = function (t, a = S.map, s) {
    const v = ss.call(this, t, a, s);
    return (t === "dens" || t === "spawn") && v63MidOn(a) ? v + V63_DIFF.mid[t] : v;
  };
  const mc = ui.mapCard;
  ui.mapCard = function (t) {
    let h = mc.call(this, t);
    if (t < V63_DIFF.mid.from || t > V63_DIFF.mid.to || (typeof v56AbyTier === "function" && v56AbyTier(t))) return h;
    const row = `<div class="row v63mid"><span class="note" style="margin:0">中期加成：${v63MidText()}</span></div>`;
    const i = h.lastIndexOf("</div>");
    return i > 0 ? h.slice(0, i) + row + h.slice(i) : h + row;
  };
  if (HELP.map?.[1] && !HELP.map[1].some((r) => r[0] === "中期加成"))
    HELP.map[1].push(["中期加成", `第 ${V63_DIFF.mid.from + 1}～${V63_DIFF.mid.to + 1} 張地圖：${v63MidText()}。`]);
  const fixRow = HELP.map?.[1]?.find((r) => r[0] === "終局加成");
  if (fixRow && typeof v62FixText === "function") fixRow[1] = `Lv${V62.fixLv} 以後的 4 張主線地圖與所有深淵階級：${v62FixText()}。`;
  if (HELP.map?.[1] && !HELP.map[1].some((r) => r[0] === "怪物強度"))
    HELP.map[1].push(["怪物強度", `Lv${V63_DIFF.lv0} 以後的怪物生命與傷害逐級提高，Lv${V63_DIFF.lv1} 達到上限：生命 ×${1 + V63_DIFF.hp}（地圖頭目 ×${1 + V63_DIFF.bossHp}）、傷害 ×${1 + V63_DIFF.dmg}。試煉、守護者、塔、武鬥場、活動不受影響。`]);
  // ③ 無限武鬥場
  if (typeof RO_ARENA !== "undefined") Object.assign(RO_ARENA, { hp: V63_DIFF.arena.hp, dmg: V63_DIFF.arena.dmg });
  if (typeof roArenaStart === "function") {
    const rs = roArenaStart;
    roArenaStart = function (...a) {
      const cap = TW.cap;
      const r = rs.apply(this, a);
      if (G?.tw?.ra) {
        G.tw.ra.keep.cap = cap;
        TW.cap = V63_DIFF.arena.cap;
      }
      return r;
    };
  }
  const oldTxt = "每層怪物生命 ×1.08、傷害 ×1.05",
    newTxt = `每層怪物生命 ×${V63_DIFF.arena.hp}、傷害 ×${V63_DIFF.arena.dmg}、同時最多 ${V63_DIFF.arena.cap} 隻怪物`;
  const pm = ui.p_map;
  ui.p_map = function (...a) {
    return pm.apply(this, a).split(oldTxt).join(newTxt);
  };
  for (const v of Object.values(HELP))
    if (Array.isArray(v) && Array.isArray(v[1])) for (const r of v[1]) if (typeof r[1] === "string" && r[1].includes(oldTxt)) r[1] = r[1].split(oldTxt).join(newTxt);
}

// ---------------------------------------------------------------------------
// 網址版自動更新：每 3 分鐘比對網站上的遊戲檔案（ETag），有新版時提示並倒數 60 秒存檔重整；
// Boss、試煉、守護者、塔、武鬥場戰鬥中會等戰鬥結束才倒數。本機直接開啟檔案時不啟用。
const V63_UPD = { every: 180, count: 60 };
const v63UpdOn = () =>
  /^https?:$/.test(location.protocol) && (!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || /[?&]v63upd=1/.test(location.search));
const v63Upd = { base: null, found: false, left: V63_UPD.count, timer: 0, el: null, busy: false };
function v63UpdFiles() {
  const out = new Set([location.pathname.replace(/[^/]*$/, "") + "index.html"]);
  for (const el of document.querySelectorAll("script[src],link[rel=stylesheet][href]")) {
    const u = new URL(el.getAttribute("src") || el.getAttribute("href"), location.href);
    if (u.origin === location.origin) out.add(u.pathname);
  }
  return [...out];
}
async function v63UpdSig() {
  const sig = {};
  await Promise.all(
    v63UpdFiles().map(async (f) => {
      try {
        const r = await fetch(f, { method: "HEAD", cache: "no-store" });
        if (r.ok) sig[f] = r.headers.get("etag") || r.headers.get("last-modified") || r.headers.get("content-length") || "";
      } catch (e) {}
    }),
  );
  return sig;
}
async function v63UpdCheck() {
  if (v63Upd.found || v63Upd.busy) return;
  v63Upd.busy = true;
  try {
    const sig = await v63UpdSig();
    if (!v63Upd.base) v63Upd.base = sig;
    else if (Object.keys(sig).some((f) => v63Upd.base[f] && sig[f] && sig[f] !== v63Upd.base[f])) {
      v63Upd.found = true;
      v63UpdTick();
    }
  } finally {
    v63Upd.busy = false;
  }
}
const v63UpdFight = () => !!(typeof G !== "undefined" && G && S && (inFight() || G.dead));
function v63UpdBanner(txt) {
  if (!v63Upd.el) {
    const el = document.createElement("div");
    el.className = "v63upd";
    el.style.cssText =
      "position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:99999;display:flex;gap:10px;align-items:center;padding:8px 14px;border-radius:10px;background:#fff8e6;border:2px solid #e2b552;box-shadow:0 4px 18px #0004;font:600 14px 'Microsoft JhengHei',sans-serif;color:#5a3c08";
    el.innerHTML = '<span class="v63updTxt"></span><button class="btn sm primary" data-v63upd>立即更新</button>';
    el.querySelector("[data-v63upd]").addEventListener("click", () => v63UpdGo());
    document.body.appendChild(el);
    v63Upd.el = el;
  }
  v63Upd.el.querySelector(".v63updTxt").textContent = txt;
}
function v63UpdTick() {
  clearTimeout(v63Upd.timer);
  if (v63UpdFight()) {
    v63UpdBanner("遊戲有新版本，戰鬥結束後將自動存檔並重新整理");
    v63Upd.timer = setTimeout(v63UpdTick, 1000);
    return;
  }
  if (v63Upd.left <= 0) return v63UpdGo();
  v63UpdBanner(`遊戲有新版本，${v63Upd.left} 秒後自動存檔並重新整理`);
  v63Upd.left--;
  v63Upd.timer = setTimeout(v63UpdTick, 1000);
}
async function v63UpdGo() {
  clearTimeout(v63Upd.timer);
  v63UpdBanner("存檔中，即將重新整理…");
  try {
    if (typeof S !== "undefined" && S && typeof saveNow === "function")
      await Promise.race([saveNow(1), new Promise((r) => setTimeout(r, 3000))]);
  } catch (e) {}
  location.reload();
}
function v63UpdInstall() {
  if (!v63UpdOn() || typeof fetch !== "function") return;
  setTimeout(v63UpdCheck, 8000);
  setInterval(v63UpdCheck, V63_UPD.every * 1000);
  document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && v63UpdCheck());
}

// ---------------------------------------------------------------------------
// v6.3.2：精煉祝福、施法動作
// 鐵匠的祝福掉率大降；神工匠的祝福只由無限武鬥場頭目關掉落；武器 +6 以上每次精煉必須消耗 1 個（失敗照常降級）
const V63_BLESS = {
  p1Keep: { boss: 10 / 60, elite: 1 / 15 }, // Boss 60%→10%、菁英 15%→1%
  p2Base: 0.4, // 武鬥場第 10 層 40%，每 10 層 +10%
  p2Step: 0.1,
  wpnLv: 6, // 武器目前精煉值達此值起，精煉需要神工匠的祝福
};
const V63_CAST_T = 0.2; // 施法動作（秒），行動速度可縮短
function v63BlessInstall() {
  // 掉落：鐵匠的祝福保留一部分；神工匠的祝福不再由一般 Boss／魔王掉落
  const rm = rollMats;
  rollMats = function (L, boss, elite, ...x) {
    return rm.call(this, L, boss, elite, ...x).filter((k) => (k === "p2" ? false : k === "p1" ? RAND() < (boss ? V63_BLESS.p1Keep.boss : V63_BLESS.p1Keep.elite) : true));
  };
  const dm = dropMat;
  dropMat = function (t, k) {
    if (k === "p2") return;
    return dm.call(this, t, k);
  };
  // 移除 4 個鐵匠的祝福合成神工匠的祝福
  const mi = MERGE.findIndex(([a, b]) => a === "p1" && b === "p2");
  if (mi >= 0) MERGE.splice(mi, 1);
  autoMergeP = function () {};
  const mh = ui.mergeHtml;
  ui.mergeHtml = function (...a) {
    return mh.apply(this, a).replace(/<label class="chk"[^>]*><input type="checkbox" data-act="amp"[\s\S]*?<\/label>/, "");
  };
  if (HELP.craft?.[1]) {
    HELP.craft[1] = HELP.craft[1].filter((r) => r[0] !== "自動合成");
    const r = HELP.craft[1].find((r) => r[0] === "升級合成");
    if (r) r[1] = "4 個同級素材加上 Zeny 合成 1 個高一級的素材。鐵匠的祝福不能合成神工匠的祝福。";
  }
  // 無限武鬥場頭目關：神工匠的祝福
  const tc = twClear;
  twClear = function (m, ...x) {
    const ra = typeof roArenaOn === "function" && roArenaOn(),
      f = G.tw?.f || 0,
      boss = !!G.tw?.boss;
    const r = tc.call(this, m, ...x);
    if (ra && boss && f >= 10) {
      const p = Math.min(1, V63_BLESS.p2Base + V63_BLESS.p2Step * (Math.floor(f / 10) - 1));
      if (RAND() < p) {
        S.mat.p2 = (S.mat.p2 || 0) + 1;
        toast(`武鬥場第 ${f} 層頭目：獲得「${MATS.p2.n}」`, "r3");
        markDirty();
      }
    }
    return r;
  };
  // 精煉：武器 +6 以上需要神工匠的祝福（不提供保護，失敗照常降級）
  const need = (it) => it && it.slot === "weapon" && (it.ref || 0) >= V63_BLESS.wpnLv && (it.ref || 0) < 10;
  const vr = v5Refine;
  v5Refine = function (u, ...x) {
    const it = v5Find(u);
    if (!need(it)) return vr.call(this, u, ...x);
    if (!(S.mat.p2 > 0)) return void toast(`武器 +${V63_BLESS.wpnLv} 以上精煉需要 1 個「${MATS.p2.n}」（無限武鬥場頭目關掉落）`, "bad");
    const prot = ui.v5prot,
      z0 = S.ash;
    ui.v5prot = false;
    try {
      vr.call(this, u, ...x);
    } finally {
      ui.v5prot = prot;
    }
    if (S.ash < z0) {
      S.mat.p2--;
      markDirty();
      ui.refreshIf("alch");
    }
  };
  const rt = v5RefTab;
  v5RefTab = function (...x) {
    let h = rt.apply(this, x);
    const it = v5Find(ui.v5sel);
    if (!need(it)) return h;
    h = h.replace(/<label class="chk"><input type="checkbox" data-v5="prot"[\s\S]*?<\/label>/, "");
    h = h.replace('<div class="v5cost">', `<div class="v5cost">${v5MatTag("p2")}`);
    h = h.replace(/(<button class="btn primary" data-v5="refine"[^>]*?)( disabled)?>/, (m0, a0) => `${a0}${S.mat.p2 > 0 ? "" : " disabled"}>`);
    h = h.replace(/(<button class="btn primary" data-v5="refine")/, `<p class="note" style="margin:2px 0">武器 +${V63_BLESS.wpnLv} 以上：每次精煉消耗 1 個「${MATS.p2.n}」（只由無限武鬥場頭目關掉落），失敗時精煉值照常下降。</p>$1`);
    return h;
  };
  if (HELP.v5ref?.[1] && !HELP.v5ref[1].some((r) => r[0] === "神工匠的祝福"))
    HELP.v5ref[1].push(["神工匠的祝福", `武器 +${V63_BLESS.wpnLv} 以上每次精煉都要消耗 1 個（不提供保護，失敗照常降級）。只由無限武鬥場頭目關掉落：第 10 層 ${V63_BLESS.p2Base * 100}%，每 10 層 +${V63_BLESS.p2Step * 100}%。`]);
  if (typeof S !== "undefined" && S?.set) S.set.amp = 0;
}
// 施法動作：施放技能後 0.2 秒內不能施放其他技能（行動速度縮短），不再一口氣放出所有冷卻好的技能
function v63CastInstall() {
  const tc = tryCast;
  tryCast = function (t, a) {
    if (G?.pl && (G.pl.v63cl || 0) > G.t) return;
    return tc.call(this, t, a);
  };
  const onCast = () => {
    if (!G?.pl) return;
    const d = V63_CAST_T / Math.max(0.3, PS?.cast || 1);
    G.pl.v63cl = G.t + d;
    if (!G.pl.anim) G.pl.anim = { k: "cast", t: 0, dur: d, a: G.pl.face || 0 };
  };
  const rc = recalc;
  recalc = function (...x) {
    const r = rc.apply(this, x);
    if (PS) (PS.on ||= {}), (PS.on.cast ||= []).push(onCast);
    return r;
  };
}

// ---------------------------------------------------------------------------
// v6.3.3：卡片合成改為隨機階級（同階 85%、降一階 10%、升一階 5%；普通卡不降階，該部分歸同階）
const V63_FUSE = { down: 0.1, up: 0.05 };
const V63_FUSE_TXT = `同階 ${100 - (V63_FUSE.down + V63_FUSE.up) * 100}%、降一階 ${V63_FUSE.down * 100}%、升一階 ${V63_FUSE.up * 100}%`;
function v63FuseRoll(t) {
  const r = RAND();
  let tt = t;
  if (r < V63_FUSE.up && t < 6) tt = t + 1;
  else if (r < V63_FUSE.up + V63_FUSE.down && t > 1) tt = t - 1;
  const pool = V5_CARDS.filter((c) => c.t === tt && !c.ex);
  return pool[Math.floor(RAND() * pool.length)] || V5_CARDS.filter((c) => c.t === t && !c.ex)[0];
}
const v63FuseTag = (t, got) => (got.t > t ? "（升階！）" : got.t < t ? "（降階）" : "");
function v63FuseInstall() {
  v5Fuse = function (ids) {
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
    const got = v63FuseRoll(t);
    const first = v5GainCard(got.id);
    ui.v5res = { t: performance.now(), ok: got.t >= t, txt: `合成獲得：${V5_TIER[got.t].n}「${got.n}」${v63FuseTag(t, got)}${first ? "（新蒐藏！）" : ""}` };
    ui.v5fp = [];
    sfx(got.t > t ? "alch" : got.t < t ? "alchF" : "alch", Math.min(3, got.t));
    markDirty();
    ui.refreshIf("alch");
  };
  // 批次合成：先試算次數，實際合成時每階最多合成試算的次數（合成出的同階卡不會再被連續合成）
  v54FusePlan = function (apply) {
    const o = v54Opt(),
      st = v5St(),
      out = { n: 0, z: 0, b: 0, got: [], up: 0, down: 0 };
    const plan = {};
    let zz = 0,
      bb = 0;
    const snap = { ...st.cards };
    for (let t = 1; t <= Math.min(5, o.fmax); t++) {
      plan[t] = 0;
      for (;;) {
        const pool = [];
        for (const c of V5_CARDS) if (c.t === t) for (let i = 0; i < (snap[c.id] || 0) - o.fk; i++) pool.push(c.id);
        if (pool.length < 3) break;
        const z = v5FuseZeny(t);
        if ((S.mat.b1 || 0) - bb < t || S.ash - zz < z) break;
        for (const id of pool.slice(-3)) snap[id]--;
        plan[t]++;
        zz += z;
        bb += t;
      }
    }
    if (!apply) {
      for (const t in plan) out.n += plan[t];
      out.z = zz;
      out.b = bb;
      return out;
    }
    for (let t = 1; t <= Math.min(5, o.fmax); t++)
      for (let k = 0; k < (plan[t] || 0); k++) {
        const pool = [];
        for (const c of V5_CARDS) if (c.t === t) for (let i = 0; i < (st.cards[c.id] || 0) - o.fk; i++) pool.push(c.id);
        const z = v5FuseZeny(t);
        if (pool.length < 3 || (S.mat.b1 || 0) < t || S.ash < z) break;
        S.mat.b1 -= t;
        S.ash -= z;
        for (const id of pool.slice(-3)) (st.cards[id] -= 1) || delete st.cards[id];
        const got = v63FuseRoll(t);
        v5GainCard(got.id);
        out.got.push(got);
        out.n++;
        out.z += z;
        out.b += t;
        if (got.t > t) out.up++;
        else if (got.t < t) out.down++;
      }
    if (out.n) later(0.3, () => toast(`批次合成 ${out.n} 次：升階 ${out.up}、降階 ${out.down}、同階 ${out.n - out.up - out.down}`, out.up ? "lvl" : "", 1));
    return out;
  };
  const ft = v5FuseTab;
  v5FuseTab = function (...a) {
    return ft
      .apply(this, a)
      .replace("放入 3 張同階卡片，合成 1 張隨機的高一階卡片（神話卡片無法再合成）。", `放入 3 張同階卡片，合成 1 張隨機卡片：${V63_FUSE_TXT}（普通卡不會降階；神話卡片無法再合成）。`)
      .replace(/→ 隨機 [^<]*卡片/, "→ 隨機卡片（多半為同階）");
  };
  const ch = v54CardsHtml;
  v54CardsHtml = function (...a) {
    return ch.apply(this, a).replace("把多餘的卡片 3 張合成 1 張高一階（隨機）", `把多餘的卡片 3 張合成 1 張隨機卡片（${V63_FUSE_TXT}）`);
  };
  const fix = (k, name, txt) => {
    const r = HELP[k]?.[1]?.find((r) => r[0] === name);
    if (r) r[1] = txt;
  };
  fix("v5fuse", "合成", `放入 3 張同階卡片，得到 1 張隨機卡片：${V63_FUSE_TXT}。普通卡不會降階（該部分算同階）；傳說卡升階為神話。卡片可以相同也可以不同。`);
  fix("alch", "卡片合成", `3 張同階卡片合成 1 張隨機卡片（${V63_FUSE_TXT}）。`);
  fix("v54cards", "批次合成", `由低階到高階，把超過「每種保留」張數的卡片 3 張合成 1 張隨機卡片（${V63_FUSE_TXT}）。按下時依試算次數合成，合成出的卡片不會再被連續合成。每次消耗藍色魔力礦石（數量 = 卡片階級）與 Zeny。`);
}

// ---------------------------------------------------------------------------
// v6.3.3：無限武鬥場起始層。最高紀錄通過第 10 層後可從第 11 層開始，以此類推；
// 跳過的每 10 層先補抽負面效果，怪物強度依起始層計算
const v63ArenaMax = () => Math.floor((S?.roArena?.best || 0) / 10) * 10 + 1;
const v63ArenaFrom = () => {
  const f = Math.floor(+(S?.roArena?.from || 1));
  return f > 1 && f <= v63ArenaMax() && (f - 1) % 10 === 0 ? f : 1;
};
function v63ArenaFromInstall() {
  if (typeof roArenaStart !== "function") return;
  const rs = roArenaStart;
  roArenaStart = function (...a) {
    const from = S ? v63ArenaFrom() : 1;
    if (from <= 1) return rs.apply(this, a);
    const t0 = toast;
    toast = () => {};
    let r;
    try {
      r = rs.apply(this, a);
    } finally {
      toast = t0;
    }
    if (!G?.tw?.ra) return r;
    toast = () => {};
    try {
      for (let k = 1; 10 * k < from; k++) twRule(k);
    } finally {
      toast = t0;
    }
    recalc();
    twFloor(from);
    const n = G.tw.ra.curses.length;
    toast(`無限武鬥場：從第 ${from} 層開始，已帶有 ${n} 個負面效果（${G.tw.ra.curses.map((c) => c[0]).join("、")}）`, "bad");
    return r;
  };
  const pm = ui.p_map;
  ui.p_map = function (...a) {
    let h = pm.apply(this, a);
    if (!S || !h.includes("data-ro-arena")) return h;
    const mx = v63ArenaMax();
    if (mx <= 1) return h;
    const cur = v63ArenaFrom(),
      opts = [];
    for (let f = 1; f <= mx; f += 10) opts.push(`<option value="${f}"${f === cur ? " selected" : ""}>第 ${f} 層</option>`);
    const sel = `<span class="note" style="margin:0">起始層</span><select class="sel" data-v63af aria-label="武鬥場起始層" style="width:auto">${opts.join("")}</select>`;
    return h.replace(/(<button class="btn sm primary" data-ro-arena)/, `${sel}$1`);
  };
  document.addEventListener("change", (e) => {
    const el = e.target?.closest?.("[data-v63af]");
    if (!el || !S) return;
    (S.roArena ||= { best: 0, runs: 0 }).from = +el.value || 1;
    markDirty();
  });
  for (const v of Object.values(HELP))
    if (Array.isArray(v) && Array.isArray(v[1]) && v[1].some((r) => r[0] === "無限武鬥場") && !v[1].some((r) => r[0] === "起始層"))
      v[1].push(["起始層", "最高紀錄通過第 10 層後，可選擇從第 11 層開始，通過 20 層解鎖第 21 層，以此類推。跳過的每 10 層會先補抽負面效果，怪物強度依起始層計算；秒數從進場開始計算。"]);
}

function v63Install() {
  v63BurstGuard();
  v63ArenaFromInstall();
  v63FuseInstall();
  v63BlessInstall();
  v63CastInstall();
  v63UpdInstall();
  v63DiffInstall();
  v63AscApply();
  v63ShieldAdvice();
  v63UiInstall();
  v63TalGuard();
  v63SpriteInstall();
  const ns = newState;
  newState = function (...a) {
    const st = ns(...a);
    if (st.tal) st.tal.v63 = 1;
    return st;
  };
  const ens = roEnsureStats;
  roEnsureStats = function () {
    v63Migrate();
    return ens.apply(this, arguments);
  };
  const rc = recalc;
  recalc = function (...x) {
    const r = rc.apply(this, x);
    if (PS) (PS.on ||= {}), (PS.on.basicHit ||= []).push(v63OnBasicHit);
    return r;
  };
}
if (typeof roV4Install === "function") {
  const r4v63 = roV4Install;
  roV4Install = function () {
    r4v63();
    v63Install();
  };
}
var V63_BUILD = "v6.3";
