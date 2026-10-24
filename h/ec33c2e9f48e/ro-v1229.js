/* 流浪仙境 v1.2.29：羈絆之戒效果調整
   ・拿掉組隊副本中的隊友加成（每名存活的隊友傷害 +5%、受到的傷害 −3%）
   ・保留組隊副本以外的召喚英靈（ro-v1220.js）
   ・新增：每次造成傷害時（普攻、技能、召喚物的每一次命中各自擲一次），最終傷害隨機提高 1%～75%；
     低數值較常見（1 ＋ 75 × 亂數²，平均約 +26%）。角色面板的 DPS 估算用平均值
   ・v1.2.31：說明文字拿掉「（低數值較常見，平均約 +26%）」 */

const V1229 = { uq: "v1213_bond", min: 1, max: 75 };
// 1～75（整數），低數值較常見
const v1229Roll = () => Math.min(V1229.max, V1229.min + Math.floor((V1229.max - V1229.min + 1) * RAND() ** 2));
// 平均值（DPS 估算用）
V1229.avg = (() => {
  let s = 0;
  const n = V1229.max - V1229.min + 1;
  for (let i = 0; i < n; i++) s += (V1229.min + i) * (((i + 1) / n) ** 0.5 - (i / n) ** 0.5);
  return s / 100;
})();
const v1229On = (U) => !!(U && U[V1229.uq]);

function v1229Install() {
  const u = typeof UNIQUE !== "undefined" && UNIQUE[V1229.uq];
  if (!u) return;
  // 1. 拿掉組隊副本的隊友加成
  delete u.hitMul;
  const hb = HURT_MUL.find((x) => x.k === "v1213:bond");
  if (hb) hb.f = () => 1;
  // 2. 隨機最終傷害
  HIT_MUL.push({
    k: "v1229:bond",
    lab: () => v1229On(PS && PS.U) && "羈絆之戒 最終傷害隨機 +1%～75%",
    f: (t) => (v1229On(PS && PS.U) ? t * (1 + v1229Roll() / 100) : t),
    est: (R) => (v1229On((R && R.U) || (PS && PS.U)) ? 1 + V1229.avg : 1),
  });
  // 說明
  u.d = `每次造成傷害時，最終傷害隨機提高 ${V1229.min}%～${V1229.max}%；組隊副本以外，召喚英靈（生命為你最大生命的 70%），每 5 秒嘲諷附近的敵人、不會攻擊，倒下後 30 秒再次召喚。只在組隊副本掉落`;
  const rows = HELP.v1213 && HELP.v1213[1];
  if (Array.isArray(rows))
    for (const r of rows)
      if (r[0] === "羈絆之戒")
        r[1] = `獨特・組隊的戒指，插槽 3～6 孔。每次造成傷害時（普攻、技能、召喚物的每一次命中），最終傷害隨機提高 ${V1229.min}%～${V1229.max}%。組隊副本以外：召喚英靈（生命為你最大生命的 70%），每 5 秒嘲諷附近的敵人，不會攻擊；英靈倒下後 30 秒再次召喚。`;
}

if (typeof roV4Install === "function") {
  const r4v1229 = roV4Install;
  roV4Install = function () {
    r4v1229.apply(this, arguments);
    try {
      v1229Install();
    } catch (e) {
      console.error("v1229", e);
    }
  };
}
