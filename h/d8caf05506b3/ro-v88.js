/* 流浪仙境 v8.8：光環技能重製——狂暴（劍士）改為「越殘血越強」不再持續扣血；二刀流（盜賊）普攻附帶副手追擊、怒氣值上限 +3 */

const V88 = {
  // 狂暴
  bsBase: 1.25, // 基礎傷害倍率
  bsDmg: 0.05, // 每失去 10% 生命：傷害 +5%
  bsAs: 0.03, // 每失去 10% 生命：攻擊速度 +3%
  bsLow: 0.3, // 生命低於此比例時
  bsDr: 0.2, // 受到的傷害 −20%
  // 二刀流
  dwOff: 0.4, // 副手追擊傷害
  dwCap: 3, // 怒氣值上限 +3
};
const V88_TXT = {
  sw_berserk: `光環：常駐開啟，所有傷害 ×${V88.bsBase}；每失去 10% 生命，傷害再 +${V88.bsDmg * 100}%、攻擊速度 +${V88.bsAs * 100}%（最多 +${V88.bsDmg * 900}%／+${V88.bsAs * 900}%）；生命低於 ${V88.bsLow * 100}% 時受到的傷害 −${V88.bsDr * 100}%。不再持續失去生命。`,
  th_dual: `光環：普攻擊中獲得怒氣值，怒氣值上限 +${V88.dwCap}（基本 ${10 + V88.dwCap} 層），每層攻擊速度 +5%、移動速度 +3%；普攻每次命中額外揮出副手一擊，造成 ${V88.dwOff * 100}% 傷害。`,
};
const v88On = (id) => !!(G?.pl?.sus?.[id]);
// 失去生命的十分之幾（0～9）
const v88Lost = () => (PS && S ? Math.max(0, Math.min(9, Math.floor((1 - S.hp / PS.maxhp) * 10 + 1e-9))) : 0);
const v88DualPlaced = () => typeof activeGems === "function" && activeGems().some((g) => g.id === "th_dual" || (SKILLS[g.id]?.roBase === "dance" && g.id !== "dance"));

function v88Install() {
  if (!SKILLS.sw_berserk || !SKILLS.th_dual) return;
  // 說明
  for (const [id, d] of Object.entries(V88_TXT)) if (SKILLS[id]) SKILLS[id].d = "〔無屬性〕" + d;

  // ---------------------------------------------------------------------------
  // 1. 狂暴：不再標記舊代號「狂怒之槍」（避免引擎的每秒扣血與固定 ×1.35），改用新的倍率
  const st = susTick;
  susTick = function (t, ...x) {
    const r = st.call(this, t, ...x);
    try {
      if (t && t.id === "sw_berserk" && G?.pl?.sus && !activeGems().some((g) => g.id === "frenzy")) delete G.pl.sus.frenzy;
    } catch (e) {}
    return r;
  };
  HIT_MUL.push({
    k: "v88:berserk",
    lab: () => v88On("sw_berserk") && `狂暴 ×${(V88.bsBase + tal("frz") + V88.bsDmg * v88Lost()).toFixed(2)}`,
    f: (t) => (v88On("sw_berserk") ? t * (V88.bsBase + tal("frz") + V88.bsDmg * v88Lost()) : t),
  });
  SPD_AS.push({ k: "v88:berserk", f: () => (v88On("sw_berserk") ? 1 + V88.bsAs * v88Lost() : 1) });
  HURT_MUL.push({ k: "v88:berserk", f: () => (v88On("sw_berserk") && S.hp < PS.maxhp * V88.bsLow ? 1 - V88.bsDr : 1) });

  // ---------------------------------------------------------------------------
  // 2. 二刀流：普攻命中時副手追擊（不累積怒氣值、不會再觸發副手）
  const fi = fire;
  fire = function (t, a, s, e, n) {
    const r = fi.call(this, t, a, s, e, n);
    if (t === "hit" && n && n.ba && !n.v88oh && !n.skill && !n.min && v88On("th_dual") && alive(a)) {
      try {
        hitMob(a, V88.dwOff, { ba: 1, v88oh: 1, nomom: 1, kb: 6 });
      } catch (er) {}
    }
    return r;
  };

  // ---------------------------------------------------------------------------
  // 3. 怒氣值上限 +5、角色頁 DPS 估算
  const cc = calc;
  calc = function (...a) {
    const R = cc.apply(this, a);
    try {
      if (!R || !S) return R;
      const ag = activeGems();
      // 狂暴：v7.2 的估算以 ×1.35 計，改為滿血時的倍率
      if (ag.some((g) => g.id === "sw_berserk") && !ag.some((g) => g.id === "frenzy") && !(R.T && R.T.fixedHit)) {
        const frz = (R.T && R.T.frz) || 0;
        R.dps *= (V88.bsBase + frz) / (1.35 + frz);
      }
      if (v88DualPlaced()) {
        R.T ||= {};
        R.T.momMax = (R.T.momMax || 0) + V88.dwCap;
        // 普攻部分：算進怒氣值滿層的攻擊速度與副手追擊
        if (!S.set?.nob && !(R.T && R.T.fixedHit)) {
          const nb = S.set.nob;
          S.set.nob = 1;
          let R2;
          try {
            R2 = cc.apply(this, a);
          } finally {
            S.set.nob = nb;
          }
          const basic = Math.max(0, R.dps - (R2?.dps || 0)),
            cap = STK.mom.max + R.T.momMax;
          if (basic > 0) R.dps += basic * ((1 + 0.05 * cap) * (1 + V88.dwOff) - 1);
        }
      }
    } catch (e) {}
    return R;
  };

  // ---------------------------------------------------------------------------
  // 4. 狀態列：狂暴目前的加成
  if (typeof HUD_BUFF !== "undefined")
    HUD_BUFF.push({
      k: "v88bs",
      n: () => (v88On("sw_berserk") ? Math.max(1, v88Lost()) : 0),
      left: () => 99,
      bg: "#8a1a2a",
      fg: "#ffe6ea",
      tc: "#ff8a9a",
      tip: () => {
        const L = v88Lost();
        return ["狂暴", [`傷害 ×${(V88.bsBase + tal("frz") + V88.bsDmg * L).toFixed(2)}`, `攻擊速度 +${Math.round(V88.bsAs * L * 100)}%`, S.hp < PS.maxhp * V88.bsLow ? `受到的傷害 −${V88.bsDr * 100}%` : `生命低於 ${V88.bsLow * 100}% 時受到的傷害 −${V88.bsDr * 100}%`]];
      },
      art: ["X..X..X", ".X.X.X.", "..XXX..", "XXXXXXX", "..XXX..", ".X.X.X.", "X..X..X"],
    });
}
if (typeof roV4Install === "function") {
  const r4v88 = roV4Install;
  roV4Install = function () {
    r4v88();
    v88Install();
  };
}
