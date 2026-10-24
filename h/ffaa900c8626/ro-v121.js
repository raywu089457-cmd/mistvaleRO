/* 流浪仙境 v1.1.7（職業天賦校正）
   全職業 24 個流派依天賦文字逐一實測後的修正：
   1. 共鳴排（第 3 排）對齊各流派目前的核心技能與輔助寶石：
      ・不再強化流派沒有使用的技能（例如鐵壁流的龍之吐息、點燃爆破、冰霜龍息）。
      ・沒有直接傷害的技能（挑釁、狂暴光環、樂章、隱匿、殘影分身、詛咒、練氣）
        改給對應的機制加成，不再是無效的「傷害 ×1.10」。
      ・名稱與效果一致（例如「反擊架式共鳴」真的強化反擊架式）。
   2. 其他強化錯技能或無對象的天賦改為對應流派的技能。
   3. 盾牌迴旋的命中半徑跟著技能範圍放大；面板預估 DPS 補上多段、持續與依狀態計算的技能。
   4. 城鎮遊走、活動獨特裝備說明、獨特裝備標籤（移除終局／高階，活動獨特標「活動」）。
   5. 職業天賦頁新增「職業機制」說明卡（極限槽、強化射擊、元素反應、連擊點、氣球、手推車），數字含目前天賦加成。
   （劍士極限技的修正在 ro-v6.js：挑釁不再耗掉滿槽、範圍改為乘算 ×1.3） */
"use strict";

// 共鳴排：[名稱, 效果]
const V121_ROW2 = {
  // ---- 劍士 ----
  ro_sword_0: [
    ["自動反擊共鳴", { "sp:sw_counter:add": 1, "sk:sw_bowl:more": 0.1 }],
    ["盧恩研究共鳴", { "sp:sw_runeb:pow": 0.6, "sk:sw_breath:more": 0.1 }],
    ["雙手劍加速共鳴", { "sp:sw_quick:pow": 0.6, "sk:sw_brandish:more": 0.1 }],
  ],
  ro_sword_1: [
    ["衝鋒精通共鳴", { "sp:sw_brand:pow": 0.6, "sk:sw_shboom:more": 0.1 }],
    ["極限突破共鳴", { v6limGain: 0.2, "sk:sw_charge:more": 0.1 }],
    ["雙手劍加速共鳴", { "sp:sw_quick:pow": 0.6, "sk:sw_gcross:more": 0.1 }],
  ],
  ro_sword_2: [
    ["狂怒共鳴", { "sp:fury:pow": 0.6, frz: 0.1 }],
    ["極限突破共鳴", { v6limGain: 0.2, "sk:sw_spiral:more": 0.1 }],
    ["雙手劍加速共鳴", { "sp:sw_quick:pow": 0.6, "sk:sw_wave:more": 0.1 }],
  ],
  ro_sword_3: [
    ["反擊架式共鳴", { v6parry: 0.25, "sk:sw_shboom:more": 0.1 }],
    ["自動反擊共鳴", { "sp:sw_counter:add": 1, "sk:sw_gcross:more": 0.1 }],
    ["雙手劍加速共鳴", { "sp:sw_quick:pow": 0.6, tntVul: 0.08 }],
  ],
  // ---- 弓箭手 ----
  ro_bow_0: [
    ["心神凝聚共鳴", { "sp:prec:pow": 0.6, "sk:bw_sharp:more": 0.1 }],
    ["遠距精通共鳴", { v6focus: 0.3, "sk:bw_snipe:more": 0.1 }],
    ["快速填裝共鳴", { "sp:bw_quick:pow": 0.6, "sk:bw_blitz:more": 0.1 }],
  ],
  ro_bow_1: [
    ["第四箭共鳴", { v6fourth: 0.2, "sk:bw_double:more": 0.1 }],
    ["心神凝聚共鳴", { "sp:prec:pow": 0.6, "sk:bw_disso:more": 0.1 }],
    ["快速填裝共鳴", { "sp:bw_quick:pow": 0.6, v6song: 0.3 }],
  ],
  ro_bow_2: [
    ["陷阱研究共鳴", { "sp:bw_trap:pow": 0.6, "sk:bw_ankle:more": 0.1 }],
    ["毒箭精通共鳴", { "sp:bw_poison:pow": 0.6, "sk:bw_varrow:more": 0.1 }],
    ["快速填裝共鳴", { "sp:bw_quick:pow": 0.6, "sk:bw_burst:more": 0.1 }],
  ],
  ro_bow_3: [
    ["合奏精通共鳴", { "sp:bw_ens:add": 1, "sk:bw_bsong:more": 0.1 }],
    ["樂器練習共鳴", { "sp:bw_ens2:pow": 0.6, "sk:bw_disso:more": 0.1 }],
    ["快速填裝共鳴", { "sp:bw_quick:pow": 0.6, minAs: 0.1 }],
  ],
  // ---- 魔法師 ----
  ro_mage_0: [
    ["魔法力增幅共鳴", { "sp:amp:pow": 0.6, "sk:mg_meteor:more": 0.1 }],
    ["擴散增幅共鳴", { "sp:spread:pow": 0.6, "sk:mg_storm:more": 0.1 }],
    ["快速詠唱共鳴", { "sp:mg_quick:pow": 0.6, "sk:mg_lov:more": 0.1 }],
  ],
  ro_mage_1: [
    ["元素親和共鳴", { "sp:mg_spirit:add": 1, "sk:mg_spirits:more": 0.1 }],
    ["元素反應共鳴", { v6react: 0.2, "sk:mg_fireball:more": 0.1 }],
    ["快速詠唱共鳴", { "sp:mg_quick:pow": 0.6, "sk:mg_field:more": 0.1 }],
  ],
  ro_mage_2: [
    ["元素反應共鳴", { v6react: 0.2, "sk:mg_tetra:more": 0.1 }],
    ["元素轉換共鳴", { v6mark: 0.3, "sk:mg_gravity:more": 0.1 }],
    ["快速詠唱共鳴", { "sp:mg_quick:pow": 0.6, crs: 0.1 }],
  ],
  ro_mage_3: [
    ["快速詠唱共鳴", { "sp:mg_quick:pow": 0.6, "sk:mg_bolt:more": 0.1 }],
    ["元素反應共鳴", { v6react: 0.2, "sk:mg_frost:more": 0.1 }],
    ["魔力集中共鳴", { "sp:mg_prec:pow": 0.6, "sk:mg_fireball:more": 0.1 }],
  ],
  // ---- 盜賊 ----
  ro_thief_0: [
    ["致命塗毒共鳴", { "sp:pstack:pow": 0.6, "sk:th_venom:more": 0.1 }],
    ["卡塔爾研究共鳴", { "sp:th_crit:pow": 0.6, "sk:th_slash:more": 0.1 }],
    ["疾風步共鳴", { "sp:th_quick:pow": 0.6, aspd: 5 }],
  ],
  ro_thief_1: [
    ["卡塔爾研究共鳴", { "sp:th_crit:pow": 0.6, "sk:th_backstab:more": 0.1 }],
    ["暗影步共鳴", { v6sneak: 0.15, v6hide: 0.3 }],
    ["疾風步共鳴", { "sp:th_quick:pow": 0.6, "sk:th_snatch:more": 0.1 }],
  ],
  ro_thief_2: [
    ["二刀連擊共鳴", { "sp:mstrike:add": 1, "sk:th_sonic:more": 0.1 }],
    ["致命終結共鳴", { v6cpDmg: 0.05, "sk:th_envenom:more": 0.1 }],
    ["疾風步共鳴", { "sp:th_quick:pow": 0.6, v6clone: 0.2 }],
  ],
  ro_thief_3: [
    ["暗影步共鳴", { v6sneak: 0.15, "sk:th_mark:more": 0.1 }],
    ["卡塔爾研究共鳴", { "sp:th_crit:pow": 0.6, crs: 0.1 }],
    ["疾風步共鳴", { "sp:th_quick:pow": 0.6, v6hide: 0.3 }],
  ],
  // ---- 服事 ----
  ro_acolyte_0: [
    ["天使之賜福共鳴", { "sp:ac_bless:pow": 0.6, "sk:ac_light:more": 0.1 }],
    ["恩典共鳴", { v6grace: 0.6, "sk:ac_heal:more": 0.1 }],
    ["加速術共鳴", { "sp:haste:pow": 0.6, "sk:ac_sanct:more": 0.1 }],
  ],
  ro_acolyte_1: [
    ["三段掌共鳴", { "sp:ac_triple:add": 1, "sk:ac_combo:more": 0.1 }],
    ["氣功凝聚共鳴", { v6sphGen: 0.2, "sk:ac_asura:more": 0.1 }],
    ["加速術共鳴", { "sp:haste:pow": 0.6, v6sphMax: 1 }],
  ],
  ro_acolyte_2: [
    ["天使之環共鳴", { "sp:ac_angel:add": 1, "sk:ac_orbs:more": 0.1 }],
    ["神聖守護共鳴", { "sp:ac_angel2:pow": 0.6, "sk:ac_magnus:more": 0.1 }],
    ["加速術共鳴", { "sp:haste:pow": 0.6, crs: 0.1 }],
  ],
  // ---- 商人 ----
  ro_merchant_0: [
    ["武器強化共鳴", { "sp:mc_over:pow": 0.6, "sk:mc_hfall:more": 0.1 }],
    ["連鎖錘擊共鳴", { "sp:mc_hammer:add": 1, "sk:mc_term:more": 0.1 }],
    ["快速組裝共鳴", { "sp:mc_quick:pow": 0.6, "sk:mc_mammon:more": 0.1 }],
  ],
};
// 其他強化錯技能／無對象的天賦：[分支, 排, 位置, 名稱, 效果]
const V121_FIX = [
  // 均衡流沒有冰霜龍息：改為冰緩（所有技能都能觸發）
  ["ro_sword_0", 3, 1, "冰霜龍鱗", { roElHit_chl: 0.12, chlVul: 0.08 }],
  // 神聖流沒有挑釁
  ["ro_sword_1", 3, 1, "鐵壁", { dmgTaken: 0.08, "sk:sw_gcross:area": 0.2 }],
  ["ro_sword_1", 7, 1, "不滅堡壘", { dmgTaken: 0.1, "sk:sw_shboom:more": 0.3 }],
  // 螺旋奧義：額外施放 +1 會連帶讓「第 3 次」更常觸發（實測 ×1.6），改為與其他奧義相同的冷卻縮減
  ["ro_sword_2", 7, 0, "螺旋奧義", { "nth:sw_spiral": 1.2, "sk:sw_spiral:cd": 0.15 }],
  // 鐵壁流：護甲轉傷害只留盾擊反射、鐵壁奧義；聖光反擊改為反擊類加成，反射壁壘改為嘲諷增傷
  ["ro_sword_3", 3, 1, "聖光反擊", { roElHit_shk: 0.12, thorn: 0.5, v6parry: 0.2 },
    "擊中時 12% 機率使敵人感電；反射盾的反射傷害 +護甲值的 25%（50% → 75%，不受護甲轉傷害影響）；「反擊架式」觸發間隔 −20%、反擊傷害 ×1.2"],
  ["ro_sword_3", 4, 2, "反射壁壘", { tntVul: 0.3 }],
  // 陷阱流沒有二連矢
  ["ro_bow_2", 1, 2, "精準射擊", { crit: 6, critm: 28, "sk:bw_burst:more": 0.1 }],
  // 連拳流沒有指彈
  ["ro_acolyte_1", 3, 2, "霸凰氣勁", { "sk:ac_asura:more": 0.2, roElHit_shk: 0.1 }],
  // 核心機制排：沒有終結技的盜賊流派，連擊點上限／終結技加成無效
  ["ro_thief_0", 4, 0, "連擊節奏", { "bac:th_slash": 0.06, aspd: 5 }],
  ["ro_thief_0", 4, 1, "致命連擊", { critm: 30, h_close: 0.05 }],
  ["ro_thief_0", 4, 2, "連擊本能", { baMore: 0.1, psnHit: 0.08 }],
  ["ro_thief_1", 4, 0, "潛行連擊", { "sk:th_hide:cd": 0.25, v6sneak: 0.1 }],
  ["ro_thief_1", 4, 1, "強奪連擊", { "sk:th_snatch:more": 0.25, "sk:th_backstab:more": 0.1 }],
  ["ro_thief_3", 4, 0, "詛咒連擊", { crs: 0.15, "sk:th_weak:cd": 0.2 }],
  ["ro_thief_3", 4, 1, "印記連擊", { "sk:th_mark:more": 0.25, "sk:th_mark:cd": 0.1 }],
  // 技能流：終結技在 3 點就會施放，上限 +1 幾乎用不到（實測無差異）→ 加上終結技傷害
  ["ro_thief_2", 4, 0, "連擊上限", { v6cpMax: 1, "tg:fin:dmg": 0.12 }],
  // 祭司流派沒有消耗氣球的技能，凝氣無效
  ["ro_acolyte_0", 4, 1, "聖光凝聚", { "sk:ac_light:more": 0.15, cdr: 4 }],
  ["ro_acolyte_2", 4, 1, "聖域凝聚", { "sk:ac_magnus:more": 0.12, "sk:ac_orbs:more": 0.08 }],
  // 鍊金術師與機械流沒有受手推車重量加成的技能
  ["ro_merchant_2", 4, 0, "彈藥手推車", { "sk:mc_cannon:more": 0.15, "sk:mc_axe:more": 0.1 }],
  // 基因學者（生命體流、毒雲流）的技能不花 Zeny、也不吃手推車重量：第 5 排改為生命體／藥劑／毒的選項
  ["ro_merchant_1", 4, 0, "生命體連攜", { "sk:mc_homun:more": 0.15, minAs: 0.08 }],
  ["ro_merchant_1", 4, 1, "藥劑投擲", { "sk:mc_acidbomb:more": 0.15, "sk:mc_firebomb:more": 0.15, pot: 20 }],
  ["ro_merchant_3", 4, 0, "毒劑調配", { psn: 25, "sk:mc_miasma:area": 0.15 }],
  ["ro_merchant_3", 4, 1, "藥劑學", { psn: 15, pot: 30 }],
];
// 護甲轉傷害：依說明文字線性計算（原本超過 1500 護甲的部分不論天賦數值一律每 100 點 +2%，
// 數值很小的天賦也會吃到 +100% 以上）
const V121_THORN = 0.5; // 反射傷害係數（護甲值 × 50%）
const v121ArmDmg = (armor, a) => (a ? (a * Math.max(0, armor || 0)) / 100 : 0);
// 各流派傷害校準（V6_BAL／盜賊 V56_THIEF）：v1.1.7 修正天賦後以頭目 60 秒單體＋地圖 10 清怪 120 秒重新量測
const V121_BAL = { ro_sword_1: 1.57, ro_sword_2: 0.9, ro_sword_3: 1.9, ro_bow_0: 1.0, ro_mage_3: 1.1, ro_merchant_0: 1.14, ro_merchant_2: 1.23 };
const V121_THIEF = { 1: 1.15, 2: 1.0 };
if (typeof V6_BAL !== "undefined") Object.assign(V6_BAL, V121_BAL);
if (typeof V56_THIEF !== "undefined") for (const [i, v] of Object.entries(V121_THIEF)) V56_THIEF.br[i] = v;
// 分支說明（舊版殘留的描述）
Object.assign(V6_BR_D, {
  ro_sword_3: "挑釁聚怪、盾牌迴旋與聖十字審判，極限技追加聖盾震擊並嘲諷周圍敵人",
  ro_bow_1: "樂器連射為主，歌曲強化普攻，普攻觸發二連矢",
  ro_bow_2: "預放定位陷阱控場，爆裂箭與毒箭清場",
  ro_mage_3: "高攻速普攻，擊中時自動念咒施放雷擊術、霜凍之術",
});

// 說明文字：輔助共鳴的寫法沿用原本的共鳴天賦
function v121Text(e) {
  const pre = [],
    rest = {};
  for (const [k, v] of Object.entries(e)) {
    const m = /^sp:(\w+):(pow|add)$/.exec(k);
    if (!m) rest[k] = v;
    else if (m[2] === "pow") pre.push(`「${roSkName(m[1])}」連結時的效果 ×${+(1 + v).toFixed(2)}`);
    else pre.push(`連結「${roSkName(m[1])}」的技能，${{ extra: "額外施放", proj: "投射物", minion: "召喚數量", chn: "連鎖次數" }[RO_COUNT_SUP[m[1]]] || "次數"} +${v}`);
  }
  return [...pre, v5TalText(rest)].filter(Boolean).join("；");
}
function v121Set(t, n, e, d) {
  Object.assign(t, { n, e: { ...e }, d: d || v121Text(e), v121d: d ? 1 : 0 });
}
function v121Apply() {
  for (const bs of Object.values(ASC))
    for (const b of bs) {
      const r2 = V121_ROW2[b.k];
      if (r2) r2.forEach(([n, e], i) => b.t[2]?.[i] && v121Set(b.t[2][i], n, e));
    }
  for (const [bk, r, i, n, e, d] of V121_FIX) {
    const b = Object.values(ASC).flat().find((x) => x.k === bk);
    if (b?.t[r]?.[i]) v121Set(b.t[r][i], n, e, d);
  }
}


// ---------------------------------------------------------------------------
// 職業機制說明卡（職業天賦頁）：數字直接讀機制常數與目前天賦，與實際效果一致
const v121P = (x) => +(x * 100).toFixed(1);
const v121X = (x) => +x.toFixed(2);
const v121Names = (cls, tag) =>
  CLASS[cls].gems.filter((id) => SKILLS[id]?.act && (SKILLS[id].tg || []).includes(tag)).map((id) => `「${roSkName(id)}」`).join("");
function v121Mech() {
  if (!S || !PS) return null;
  const cls = S.cls,
    T = (k) => tal(k),
    br = ASC[cls]?.find((b) => b.k === S.tal?.asc),
    style = br ? (br.n.match(/（(.+?)）/) || [, br.n])[1] : "";
  if (cls === "sword") {
    const gain = T("v6limGain"),
      dm = T("v6limDmg");
    const extra = {
      ro_sword_0: "周圍敵人暈眩 1.5 秒",
      ro_sword_1: "獲得 25% 最大生命的護盾",
      ro_sword_2: "6 秒內攻擊速度 +40%",
      ro_sword_3: `聖盾震擊：目標周圍造成 ${v121P(3 * (1 + dm))}% 武器傷害並嘲諷 4 秒`,
    };
    return [
      "極限槽",
      [
        `累積：技能每次擊中 +3（每次施放最多 +12）、普通攻擊擊中 +1.5、受到傷害時每損失 10% 最大生命 +6；連結「極限突破」的技能累積 ×2${gain ? `。目前累積量 +${v121P(gain)}%` : ""}。`,
        `滿 100 後，下一個會造成傷害的技能成為極限技：傷害 ×${v121X(V6_LIM.mul * (1 + dm))}、範圍在原本範圍上 ×${V6_LIM.area}；由連結「極限突破」的技能施放時傷害再 ×1.5。挑釁等沒有傷害的技能不會用掉滿槽。`,
        br && extra[br.k] ? `${style}極限附效：${extra[br.k]}。` : `完成二轉後依流派追加效果：均衡流暈眩、神聖流護盾、暴力流攻速、鐵壁流聖盾震擊。`,
        "角色腳下的細條是極限槽，滿槽時閃爍金色。",
      ],
    ];
  }
  if (cls === "bow") {
    const f = V6_FOCUS.max * (1 + T("v6focus"));
    return [
      "專注距離與強化射擊",
      [
        `專注距離：技能擊中距離你 ${V6_FOCUS.near} 以上的敵人時傷害提高，${V6_FOCUS.far} 以上達到最多 +${v121P(f)}%；連結「遠距精通」的技能再乘一次（最多 ×${v121X((1 + f) * (1 + f))}）；「真實之眼」期間不論距離都視為最遠。`,
        `強化射擊：每第 ${V6_FOCUS.nth} 次施放技能，該次傷害 ×${v121X(V6_FOCUS.nthMul * (1 + T("v6fourth")))}，投射物技能多 ${V6_FOCUS.nthProj} 個投射物（第四箭與普攻觸發的獵鷹突擊不計次數）。`,
        `角色腳下的 ${V6_FOCUS.nth} 格小點顯示強化射擊的計數。`,
      ],
    ];
  }
  if (cls === "mage") {
    const r = 1 + T("v6react"),
      q = (k) => Math.round(V6_REACT[k].k * r * 100) + "%";
    return [
      "元素印記與反應",
      [
        `元素技能（以及燃燒、冰緩、感電）擊中時，在敵人身上留下該元素的印記 ${v121X(V6_MARK_T * (1 + T("v6mark")))} 秒；同元素再擊中會刷新時間。`,
        `擊中帶有不同元素印記的敵人時消耗印記，觸發元素反應（武器傷害倍率${T("v6react") ? `，已含元素反應 +${v121P(T("v6react"))}%` : ""}；連結「元素共鳴」的技能觸發時再 ×1.6）：`,
        `火＋水「蒸發」單體 ${q("fire+water")}；火＋風「爆燃」範圍 ${q("fire+wind")} 並燃燒；水＋風「感電」${q("water+wind")} 並連鎖附近 ${V6_REACT["water+wind"].cnt} 個敵人；地＋水「泥沼」範圍 ${q("earth+water")} 並定身 ${V6_REACT["earth+water"].root} 秒（頭目 0.4 秒）；地＋火「熔岩」地面 ${V6_REACT["earth+fire"].dur} 秒，每 0.5 秒 ${q("earth+fire")} 並燃燒；地＋風「沙暴」範圍 ${q("earth+wind")} 並擊退。`,
        "連結「元素轉換」的技能打到同元素的印記時，會自動轉成能反應的元素。怪物頭上的小色點是元素印記。",
      ],
    ];
  }
  if (cls === "thief") {
    const per = V6_CP.per + T("v6cpDmg"),
      sn = 1 + T("v6sneak");
    return [
      "連擊點與偷襲",
      [
        `連擊點上限 ${v6CpMax()}：普通攻擊擊中（每 ${V6_CP.basicIv} 秒最多 1 點）與說明寫「獲得連擊點」的技能累積；被暗影印記標記的敵人死亡時也給 2 點。`,
        `終結技（${v121Names("thief", "fin")}）消耗全部連擊點，每點傷害 +${v121P(per)}%，至少 3 點才會自動施放；連結「致命終結」的終結技每點再 +10%，施放後返還 1 點。`,
        `偷襲：「隱匿」期間下一次技能擊中傷害 ×${v121X(V6_CP.sneak * sn)}（「暗影步」的半偷襲 ×${v121X(1.5 * sn)}），擊中後結束隱匿。`,
        "角色腳下的紅點顯示連擊點。",
      ],
    ];
  }
  if (cls === "acolyte") {
    const iv = V6_SPH.iv * (1 - Math.min(0.6, T("v6sphGen"))),
      pas = T("v6sphPas"),
      sd = T("v6sphDmg");
    return [
      "氣球",
      [
        `附近（70 距離內）有敵人時，每 ${v121X(iv)} 秒凝聚 1 顆氣球，上限 ${v6SphMax()} 顆；練氣、連打掌、閃電步等技能也會給氣球（見技能說明）。`,
        `消耗氣球的技能（${v121Names("acolyte", "sph")}）施放時用掉全部氣球，每顆提高該技能的效果（見技能說明）${sd ? `，目前每顆的效果再 +${v121P(sd)}%` : ""}；連結「氣功凝聚」的技能返還 1 顆。`,
        pas ? `每顆氣球使傷害 +${v121P(pas)}%（最多 ${v6SphMax()} 顆，+${v121P(pas * v6SphMax())}%）。` : "祭司流派沒有消耗氣球的技能，可用核心機制排的「氣之共鳴」讓每顆氣球提高傷害。",
        "角色身邊環繞的小光點是氣球。",
      ],
    ];
  }
  if (cls === "merchant") {
    const ck = V6_CART.k * (1 + T("v6cart")),
      n = Math.min(V6_CART.full, S.bag?.length || 0),
      z = Math.min(0.6, T("v6zeny")),
      h = T("v6heat");
    return [
      "手推車與 Zeny",
      [
        `手推車重量：背包每件物品 +${v121X((ck * 100) / V6_CART.full)}%（${V6_CART.full} 件滿載 +${v121P(ck)}%），加在「手推車攻擊」「手推車終結」「斧頭迴旋鏢」的傷害上；連結「重型手推車」的技能也享有，且加成 ×2。目前背包 ${n} 件：+${v121P((ck * n) / V6_CART.full)}%。`,
        `Zeny：「金錢攻擊」「手推車終結」「極限武器強化」與連結「金錢投入」的技能會付費換取加成（見技能說明），只有 Zeny 高於 5×等級² 的保留額時才付款${z ? `；技能花費 −${v121P(z)}%` : ""}。`,
        `熱量：機甲加農砲 +25、斧頭龍捲 +30、火焰發射器 +35、斧頭迴旋鏢 +20${h ? `（累積 +${v121P(h)}%）` : ""}，每秒散熱 ${V6_HEAT.decay}；滿 ${V6_HEAT.max} 時過熱爆發，對周圍造成 ${v121P(V6_HEAT.boom * (1 + T("v6heatDmg")))}% 武器傷害並擊退。機械流的角色腳下顯示熱量條。`,
      ],
    ];
  }
  return null;
}
function v121MechHtml() {
  let m = null;
  try {
    m = v121Mech();
  } catch (e) {
    return "";
  }
  if (!m) return "";
  return `<div class="board v121mech"><div class="row"><b>職業機制・${esc(m[0])}</b><span class="tag">${esc(CLASS[S.cls]?.n || "職業")}</span></div><ul>${m[1].map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>`;
}


// ---------------------------------------------------------------------------
// 面板預估 DPS：多段、持續與依狀態計算的技能補上「單一目標每次施放的總倍率」
//   數字以單一木樁實測（固定亂數、送入 hitMob 的倍率總和）；連擊點以 4 點、氣球以 3 顆估算
const V121_EST = {
  sw_spiral: 7, // 5 擊，每擊 +20%：1＋1.2＋1.4＋1.6＋1.8
  bw_double: 2,
  bw_disso: 2,
  mg_lov: 9,
  mg_field: 12, // 6 秒、每 0.5 秒
  mg_tetra: 4, // 不含元素反應
  mg_gravity: 10,
  mg_napalm: 3, // 只有一個敵人時 3 顆都打同一個
  th_slash: 3,
  ac_heal: 1.75,
  ac_sanct: 12,
  ac_magnus: 10,
  mc_firebomb: 8,
  mc_axe: 7,
};
// est(s, R, cd) 在計算面板時呼叫，PS 可能還沒建立：天賦與數值一律從 R 讀
const v121T = (R, k) => (R && R.T && R.T[k]) || 0;
const v121CpEst = (R) => 1 + (V6_CP.per + v121T(R, "v6cpDmg")) * Math.min(V6_CP.max + v121T(R, "v6cpMax"), 4);
const v121SphEst = (R) => Math.min(V6_SPH.max + v121T(R, "v6sphMax"), 3);
const v121CartEst = (R) => 1 + V6_CART.k * (1 + v121T(R, "v6cart")) * clamp((S?.bag?.length || 0) / V6_CART.full, 0, 1);
function v121EstInstall() {
  for (const [id, k] of Object.entries(V121_EST)) if (SKILLS[id]) SKILLS[id].est = () => SKILLS[id].hit * k;
  const set = (id, f) =>
    SKILLS[id] &&
    (SKILLS[id].est = (s, R, ...a) => {
      try {
        const v = f(R || {}, s);
        return isFinite(v) && v > 0 ? v : SKILLS[id].hit;
      } catch (e) {
        return SKILLS[id].hit;
      }
    });
  const H = (id) => SKILLS[id].hit;
  // 盾牌迴旋：去程＋回程 2 下；護甲加成與護甲轉傷害相加（面板的護甲轉傷害倍率另外乘在所有技能上，這裡補差額）
  set("sw_shboom", (R) => {
    const A = R.armor || 0,
      a = v121T(R, "armDmg");
    return (H("sw_shboom") * 2 * (1 + v121ArmDmg(A, a + V6_SHB_ARM))) / (1 + v121ArmDmg(A, a));
  });
  // 龍之吐息：4 次，每次再附加 0.6% 最大生命（換算成武器傷害倍率）
  set("sw_breath", (R) => 4 * (H("sw_breath") + (0.006 * (R.maxhp || 0)) / Math.max(1, ((R.mn || 0) + (R.mx || 0)) / 2)));
  // 終結技：消耗連擊點
  set("th_sonic", (R) => H("th_sonic") * 8 * v121CpEst(R));
  set("th_envenom", (R) => H("th_envenom") * v121CpEst(R));
  set("th_sbreak", (R) => H("th_sbreak") * v121CpEst(R));
  set("th_cimpact", (R) => H("th_cimpact") * v121CpEst(R));
  // 消耗氣球
  set("ac_asura", (R) => H("ac_asura") * (1 + 0.8 * v121SphEst(R)));
  set("ac_finger", (R) => H("ac_finger") * Math.max(1, v121SphEst(R)));
  set("ac_rampage", (R) => H("ac_rampage") * (1 + 0.4 * v121SphEst(R)));
  // 手推車重量
  set("mc_cartrev", (R) => H("mc_cartrev") * v121CartEst(R));
  set("mc_term", (R) => H("mc_term") * v121CartEst(R));
  set("mc_aboom", (R) => H("mc_aboom") * 2 * v121CartEst(R));
}


// ---------------------------------------------------------------------------
// 城鎮遊走：進城鎮 10 秒後開始在場地內走走停停，偶爾走到 NPC 旁邊；打開 NPC 對話時停下
const V121_WANDER = { idle: 10, pause: [2, 5], npc: 1 / 3, spd: 0.45, pad: 20 };
const v121W = { t: 0, tx: null, ty: null, wait: 0, look: 0, town: null };
const v121Talking = () => {
  try {
    const bg = document.getElementById("sheetBg"),
      sh = document.getElementById("sheet");
    return !!(bg && !bg.hidden && sh && sh.classList.contains("v113d"));
  } catch (e) {
    return false;
  }
};
function v121Wander(dt, x0, y0) {
  const p = G.pl,
    W = v121W,
    k = G.arena?.v113;
  if (W.town !== k) Object.assign(W, { t: 0, tx: null, ty: null, wait: 0, look: 0, town: k });
  if (v121Talking()) {
    W.t = 0;
    W.tx = null;
    return;
  }
  if ((W.t += dt) < V121_WANDER.idle) return;
  const stay = () => {
    W.wt = 0;
    p.x = x0;
    p.y = y0;
    p.moving = false;
    p.walkT = 0;
    p.mvx = p.mvy = 0;
  };
  if (W.tx == null) {
    if (W.wait > 0) {
      W.wait -= dt;
      // 停下時偶爾轉頭看看
      if (W.look > 0 && W.wait <= W.look) {
        W.look = 0;
        if (!p.anim) setFace(RAND() * Math.PI * 2);
      }
      return stay();
    }
    const pad = V121_WANDER.pad,
      ns = typeof v113Npcs === "function" ? v113Npcs() : [];
    if (ns.length && RAND() < V121_WANDER.npc) {
      const n = ns[Math.floor(RAND() * ns.length)],
        side = RAND() < 0.5 ? -1 : 1;
      W.tx = n.x + side * (14 + RAND() * 8);
      W.ty = n.y + 4 + RAND() * 6;
      W.face = Math.atan2(n.y - W.ty, n.x - W.tx);
    } else {
      W.tx = pad + RAND() * (G.W - 2 * pad);
      W.ty = G.top + pad + RAND() * (G.H - G.top - 2 * pad);
      W.face = null;
    }
    W.tx = clamp(W.tx, pad, G.W - pad);
    W.ty = clamp(W.ty, G.top + pad, G.H - pad);
  }
  const dx = W.tx - x0,
    dy = W.ty - y0,
    d = Math.hypot(dx, dy),
    v = fold(SPD_MS, PS.move) * V121_WANDER.spd * dt;
  if (d <= v || d < 1) {
    p.x = W.tx;
    p.y = W.ty;
    if (W.face != null && !p.anim) setFace(W.face);
    W.tx = null;
    W.wait = V121_WANDER.pause[0] + RAND() * (V121_WANDER.pause[1] - V121_WANDER.pause[0]);
    W.look = RAND() < 0.6 ? W.wait * (0.3 + RAND() * 0.4) : 0;
    W.wt = 0;
    p.moving = false;
    p.walkT = 0;
    p.mvx = p.mvy = 0;
    return;
  }
  p.x = x0 + (dx / d) * v;
  p.y = y0 + (dy / d) * v;
  p.mvx = (dx / d) * (v / dt);
  p.mvy = (dy / d) * (v / dt);
  p.moving = true;
  p.walkT = W.wt = (W.wt || 0) + dt;
  if (!p.anim) setFace(Math.atan2(dy, dx));
}

// ---------------------------------------------------------------------------
// 活動獨特裝備說明（地圖頁活動卡片、活動說明「?」）
const v121SsUqs = () => (typeof roUqPool === "function" ? roUqPool("season") : Object.keys(UNIQUE).filter((k) => UNIQUE[k].src === "season"));
function v121SsUqHtml() {
  const ks = v121SsUqs();
  if (!ks.length) return "";
  const mapN = typeof SS_MAP !== "undefined" && MAPS[SS_MAP] ? MAPS[SS_MAP].n : "活動地圖";
  return `<section class="v121ssuq"><h4>活動獨特裝備<small>只在「${esc(mapN)}」掉落（地圖怪物與化身都可能掉落）</small></h4><div class="v121uql">${ks
    .map((k) => {
      const u = UNIQUE[k];
      return `<div class="v121uq"><img src="${iconURL(u.ic || "u_" + k)}" alt=""><div><div class="v121uqn"><b>${esc(u.n)}</b><span>${esc(SLOT_NAME[u.slot] || u.slot)}</span></div><p>${esc(uqText(k, 1))}</p></div></div>`;
    })
    .join("")}</div></section>`;
}
function v121SsHelp() {
  const rows = HELP.season?.[1];
  if (!rows) return;
  const ks = v121SsUqs(),
    i = rows.findIndex((r) => r[0] === "活動獨特");
  if (i < 0 || !ks.length) return;
  rows[i] = ["活動獨特", `下列 ${ks.length} 件活動獨特裝備只在這張地圖掉落（地圖怪物與化身都可能掉落），裝備上標示「獨特・活動」。`];
  for (let j = rows.length - 1; j > i; j--) if (rows[j].v121) rows.splice(j, 1);
  ks.forEach((k, n) => {
    const r = [`${UNIQUE[k].n}（${SLOT_NAME[UNIQUE[k].slot] || UNIQUE[k].slot}）`, uqText(k, 1)];
    r.v121 = 1;
    rows.splice(i + 1 + n, 0, r);
  });
}

if (typeof roV4Install === "function") {
  const r4v121 = roV4Install;
  roV4Install = function () {
    r4v121.apply(this, arguments);
    Object.assign(V5_TAL_TXT, {
      v6parry: (v) => `「反擊架式」觸發間隔 −${v5P(v)}%、反擊傷害 ${v5X(v)}`,
      v6grace: (v) => `「恩典」每次回復量 ${v5X(v)}`,
      frz: (v) => `「狂暴」光環傷害倍率 +${+v.toFixed(2)}（×${V88.bsBase} → ×${+(V88.bsBase + v).toFixed(2)}）`,
    });
    v121Apply();
    v121EstInstall();
    const am = HIT_MUL.find((x) => x.k === "tal:armDmg");
    if (am) {
      am.lab = () => tal("armDmg") && `護甲轉傷害 ${xf(v121ArmDmg(PS.armor, tal("armDmg")))}`;
      // 盾牌迴旋的護甲加成（opts.v6arm）與護甲轉傷害相加，不再相乘
      am.f = (t, m, o) => {
        if (o && o.refl) return t; // 反射傷害（反射盾、荊棘、鋼鐵反射）不吃護甲轉傷害
        const a = tal("armDmg") + ((o && o.v6arm) || 0);
        return a ? t * (1 + v121ArmDmg(PS.armor, a)) : t;
      };
      am.est = (t, a) => 1 + v121ArmDmg(t.armor, a("armDmg"));
    }
    // 反射傷害：護甲值 × 50%（原本 100%），且不吃護甲轉傷害（見上方 am.f）
    if (TAL_ON.thorn) TAL_ON.thorn.hurtPre = (t, a) => {
      a && thornHit(a, PS.armor * tal("thorn") * V121_THORN, "r:thorn");
    };
    V5_TAL_TXT.thorn = (v) => `受到攻擊時，對攻擊者造成護甲值 ${+(v * V121_THORN * 100).toFixed(0)}% 的傷害（不受護甲轉傷害影響）`;
    for (const b of Object.values(ASC).flat()) {
      if (b.trait?.e?.thorn) b.trait.d = v5TalText(b.trait.e);
      for (const row of b.t) for (const t of row) if (t.e?.thorn && !t.v121d) t.d = v121Text(t.e);
      // 負的「總傷害額外」原本顯示成「+-50%」
      if (b.trait?.d) b.trait.d = b.trait.d.replace(/\+-(\d)/g, "−$1");
      for (const row of b.t) for (const t of row) if (t.d) t.d = t.d.replace(/\+-(\d)/g, "−$1");
    }
    // 職業天賦頁：分支特性上方加「職業機制」說明卡（還沒轉職時放在最後）
    if (ui?.ascHtml) {
      const ah = ui.ascHtml;
      ui.ascHtml = function () {
        const h = ah.apply(this, arguments),
          box = v121MechHtml();
        if (!box || typeof h !== "string") return h;
        const i = h.indexOf('<div class="board v5trait">');
        return i >= 0 ? h.slice(0, i) + box + h.slice(i) : h + box;
      };
    }
    // 城鎮遊走（最外層 tick）：記下這一格開始的位置，必要時覆蓋一般的「回到中央」移動
    const tk121 = tick;
    tick = function (dt, ...a) {
      const town = typeof v113In === "function" && v113In() && G && G.pl && !G.dead,
        x0 = town ? G.pl.x : 0,
        y0 = town ? G.pl.y : 0;
      const r = tk121.call(this, dt, ...a);
      if (town && typeof v113In === "function" && v113In()) {
        try {
          v121Wander(dt, x0, y0);
        } catch (e) {}
      } else if (v121W.town) v121W.town = null;
      return r;
    };
    // 活動卡片：活動獨特裝備；說明「?」補上名稱與效果
    if (ui?.seasonBoard) {
      const sb121 = ui.seasonBoard;
      ui.seasonBoard = function (...a) {
        const h = sb121.apply(this, a);
        return typeof h === "string" ? h + v121SsUqHtml() : h;
      };
    }
    v121SsHelp();
    if (typeof document !== "undefined" && !document.getElementById("v121css")) {
      const st = document.createElement("style");
      st.id = "v121css";
      st.textContent = `.v121mech ul{margin:4px 0 0;padding-left:18px;display:grid;gap:3px}
.v121mech li{font-size:12px;line-height:1.5;color:var(--ink,inherit)}
.v121ssuq{margin-top:10px}
.v121ssuq h4{margin:0 0 6px;font-size:13px;display:flex;flex-wrap:wrap;align-items:baseline;gap:6px}
.v121ssuq h4 small{font-weight:400;color:var(--muted);font-size:11px}
.v121uql{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:6px}
.v121uq{display:flex;gap:8px;align-items:flex-start;padding:6px 8px;border:1px solid var(--line,#ccd6e2);border-radius:6px;background:var(--card,rgba(255,255,255,.6))}
.v121uq img{width:24px;height:24px;image-rendering:pixelated;flex:none}
.v121uqn{display:flex;gap:6px;align-items:baseline;flex-wrap:wrap}
.v121uqn b{color:#ff5a82;font-size:13px}
.v121uqn span{font-size:11px;color:var(--muted)}
.v121uq p{margin:2px 0 0;font-size:12px;line-height:1.45}`;
      document.head.appendChild(st);
    }
  };
}
