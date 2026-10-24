/* 流浪仙境 v1.2.25：組隊副本站位
   ・開場與每層開始時，整隊排在場地中間偏下（三排約在場地高度 62%、73%、84%），頭目在上方（改在 ro-v1213.js 的 v1213CellPos）
   ・遠程隊員（攻擊距離 25 以上）打頭目時停在自己攻擊距離的最遠處（攻擊距離 +6，普攻剛好打得到），不往前擠；
     被技能或閃避帶到太近時會慢慢退回這個距離
   ・頭目普攻（地獄之爪）打距離 25 以內的目標傷害 +25%（改在 ro-v1213.js 的 v1213BossTick） */

const V1225 = { minRange: 25, pad: 6 };

// 目前在跑的是遠程隊員（組隊副本中、不是世界那段）
function v1225Ranged() {
  return typeof V1213 !== "undefined" && V1213.run && V1213.cur && V1213.cur !== V1213.run.world && PS && PS.range >= V1225.minRange;
}
function v1225Boss() {
  const m = V1213.run && V1213.run.boss;
  return m && alive(m) && !(m.spawnT > 0) && m.v1213 && m.v1213.kind === "boss" ? m : null;
}
const v1225Want = () => PS.range + V1225.pad;

function v1225Install() {
  if (typeof V1213 === "undefined" || typeof skillReach !== "function") return;
  // 走位：打頭目時至少停在最遠的攻擊距離（原本會走到攻擊距離的 90%）
  const sr = skillReach;
  skillReach = function (...a) {
    const r = sr.apply(this, a);
    if (!v1225Ranged()) return r;
    const m = v1225Boss();
    if (!m || !G.pl || G.pl.tgt !== m) return r;
    return Math.max(r || 0, v1225Want() / 0.9);
  };
  // 太近時退回（每位隊員各跑一次）
  if (typeof V1213B !== "undefined" && Array.isArray(V1213B.post))
    V1213B.post.push((dt) => {
      if (!(dt > 0) || !v1225Ranged() || !G.pl || G.dead) return;
      const m = v1225Boss();
      if (!m) return;
      const p = G.pl,
        d = Math.hypot(p.x - m.x, p.y - m.y),
        want = v1225Want();
      if (!(d > 0.5) || d >= want - 3 || p.leap) return;
      const k = Math.min(want - d, Math.max(30, PS.move || 40) * 0.9 * dt);
      p.x = clamp(p.x + ((p.x - m.x) / d) * k, 6, G.W - 6);
      p.y = clamp(p.y + ((p.y - m.y) / d) * k, (G.top || 0) + 4, G.H - 4);
    });
  // 說明
  const rows = HELP.v1213 && HELP.v1213[1];
  if (Array.isArray(rows))
    for (const r of rows)
      if (r[0] === "陣型")
        r[1] = `入場前在九宮格排好位置；每層開始時整隊排在場地中間偏下，頭目在上方。普攻與大部分招式先找最前排（同一排找最近的）；被嘲諷時普攻改打嘲諷的隊員。開打後隊員依自己的戰鬥方式移動，遠程隊員（攻擊距離 ${V1225.minRange} 以上）打頭目時停在自己攻擊距離的最遠處。頭目普攻打距離 ${V1213.cfg.nearR} 以內的目標傷害 +${Math.round(V1213.cfg.nearK * 100)}%。`;
}

if (typeof roV4Install === "function") {
  const r4v1225 = roV4Install;
  roV4Install = function () {
    r4v1225.apply(this, arguments);
    try {
      v1225Install();
    } catch (e) {
      console.error("v1225", e);
    }
  };
}
