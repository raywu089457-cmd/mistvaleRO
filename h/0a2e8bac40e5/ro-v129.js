/* 流浪仙境 v1.2.9：擊退改為「僵直＋微擊退」、目標被打遠時改打最近的怪
   原因：每次命中都把怪物往外推（推力會累加），近戰攻擊距離只有 14 px，
        例如修羅、武術宗師的連打掌第 3 段一下推約 22 px，怪物一打就出攻擊範圍，角色只能去追。
   ① 所有職業的技能與普攻：擊退縮小為原本的 25%，一下最多約 5 px（菁英、頭目再依原本比例減少）；
      怪物在你的攻擊距離內時，擊退不會把牠推出攻擊距離。
      赤紅岩石（擊飛撞擊是招式本身的效果）維持原本的擊退。
   ② 被擊中時短暫僵直：依原本的擊退強度 0.1～0.35 秒，僵直中停止移動（仍可攻擊）；
      不疊加，取較長的一次；菁英減半，頭目不僵直；擊退為 0 的傷害（持續傷害區域等）不會僵直。
   ③ 目前目標離開攻擊距離超過 10 px，且有別的怪比牠近時，改打離自己最近的怪（每 0.25 秒檢查）。 */

const V129 = {
  kb: 0.25, // 擊退保留比例
  kbMax: 27.6, // 一下最多約 5 px（位移 ≈ 擊退 ÷ ln 250）
  lam: Math.log(250), // 怪物擊退速度的衰減（每秒 ×0.004）
  hs0: 0.1, // 僵直：0.1 秒起
  hsK: 0.0025, // 每點原本擊退 +0.0025 秒
  hsMax: 0.35,
  hsElite: 0.5,
  far: 10, // 超出攻擊距離多少就轉移目標
  rtIv: 0.25,
  rt: 0,
  keep: new Set(["mg_crimson"]), // 維持原本擊退的招式
};

// 怪物在玩家攻擊距離內時，擊退後的停止位置不超出攻擊距離
function v129Clamp(m) {
  const P = G.pl;
  if (!P || !(PS && PS.range > 0)) return;
  const rx = m.x - P.x,
    ry = m.y - P.y,
    d2 = rx * rx + ry * ry,
    reach = PS.range + (m.boss ? 8 : 2); // 普攻打得到的距離
  if (d2 > reach * reach) return; // 已經在攻擊距離外
  const L = Math.max(4, PS.range + 1, Math.sqrt(d2)),
    c = d2 - L * L;
  const dx = (m.vx || 0) / V129.lam,
    dy = (m.vy || 0) / V129.lam,
    a = dx * dx + dy * dy;
  if (a < 1e-6) return;
  const b = 2 * (rx * dx + ry * dy),
    f = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
  if (f < 1) {
    const k = Math.max(0, f);
    m.vx *= k;
    m.vy *= k;
  }
}

function v129Install() {
  // ①② 擊退 → 微擊退＋僵直
  const hm = hitMob;
  hitMob = function (m, mult, o, ...x) {
    if (!m || !alive(m) || (o && o.v6sk && V129.keep.has(o.v6sk))) return hm.call(this, m, mult, o, ...x);
    const k0 = Math.max(0, +(o && o.kb != null ? o.kb : 45) || 0),
      o2 = Object.assign({}, o, { kb: Math.min(k0 * V129.kb, V129.kbMax) }),
      r = hm.call(this, m, mult, o2, ...x);
    if (alive(m) && !m.dm) {
      if (k0 > 0) v129Clamp(m);
      if (k0 > 0 && !m.boss) {
        const d = Math.min(V129.hsMax, V129.hs0 + V129.hsK * k0) * (m.elite ? V129.hsElite : 1);
        m.v129hs = Math.max(m.v129hs || 0, d);
      }
    }
    return r;
  };
  // 僵直中停止移動（攻擊照常）；③ 目標轉移
  const tk = tick;
  tick = function (dt, ...x) {
    const held = [];
    if (G && Array.isArray(G.mobs))
      for (const m of G.mobs)
        if (m.v129hs > 0 && !m.boss) {
          held.push([m, m.spd]);
          m.spd = 0;
        }
    let r;
    try {
      r = tk.call(this, dt, ...x);
    } finally {
      // 組隊副本（v1.2.13）：每格會依隊員各跑一次「角色」段，僵直只在「世界」段倒數；目標轉移只在「角色」段
      const md = typeof V1213B !== "undefined" ? V1213B.mode : null;
      for (const [m, s] of held) {
        m.spd = s;
        if (md !== "p") m.v129hs = Math.max(0, m.v129hs - (dt || 0));
      }
    }
    try {
      if ((typeof V1213B === "undefined" ? null : V1213B.mode) !== "w") v129Retarget(dt || 0);
    } catch (e) {}
    return r;
  };
  // 說明
  for (const [id, sk] of Object.entries(SKILLS)) if (sk && typeof sk.d === "string" && sk.d.includes("大幅擊退") && !V129.keep.has(id)) sk.d = sk.d.replace("大幅擊退", "擊退");
  const row = ["擊退與僵直", "技能與普攻命中時，怪物會短暫僵直（0.1～0.35 秒，停止移動、仍可攻擊）並被微微擊退（一下最多約 5 px，不會被推出你的攻擊距離）；菁英僵直減半、頭目不僵直。目標被打離攻擊距離太遠時，會改打離自己最近的怪。"];
  if (Array.isArray(HELP.skill?.[1]) && !HELP.skill[1].some((x) => x[0] === row[0])) {
    const i = HELP.skill[1].findIndex((x) => x[0] === "流血");
    HELP.skill[1].splice(i < 0 ? HELP.skill[1].length : i, 0, row);
  }
}

// ③ 目標被打遠：改打最近的怪
function v129Retarget(dt) {
  if ((V129.rt -= dt) > 0) return;
  V129.rt = V129.rtIv;
  if (!S || !G || G.dead || G.trn || S.set?.psv) return;
  const P = G.pl,
    tg = P && P.tgt;
  if (!alive(tg) || !PS) return;
  const d = dist(tg, P);
  if (d <= PS.range + (tg.boss ? 8 : 2) + V129.far) return;
  let best = null,
    bd = d;
  for (const m of G.mobs) {
    if (m === tg || m.spawnT > 0) continue;
    const e = dist(m, P);
    if (e < bd) (bd = e), (best = m);
  }
  if (best) {
    P.tgt = best;
    P.retgt = 0.5;
  }
}

if (typeof roV4Install === "function") {
  const r4v129 = roV4Install;
  roV4Install = function () {
    r4v129.apply(this, arguments);
    try {
      v129Install();
    } catch (e) {
      console.error("v129", e);
    }
  };
}
