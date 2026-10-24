/* 流浪仙境 v1.0.19（內部 v10.9）：獻祭之靴也能獻祭聖靈環繞的聖靈、地獄植物、植物栽培的植物
   這三個技能被視為召喚技能（有「召喚物」標籤），但召喚出的東西不在一般召喚物清單裡，原本不會被獻祭。
   現在一起列入：獻祭離你最近的 1 隻（不分種類），被獻祭的聖靈或植物等下次施放才補回。 */

function v109Install() {
  if (typeof v90SacTick !== "function" || typeof UNIQUE === "undefined" || !UNIQUE.v90_sac || typeof v6G !== "function") return;
  // 地獄植物的植物沒有記錄位置，施放後補上（與原本相同的排列方式）
  if (typeof V6_CAST !== "undefined" && typeof V6_CAST.plant === "function") {
    const pl = V6_CAST.plant;
    V6_CAST.plant = function (c, ...x) {
      const before = new Set(v6G().ents);
      const r = pl.call(this, c, ...x);
      try {
        if (r && c && c.tgt) {
          const fresh = v6G().ents.filter((e) => !before.has(e) && e.k === "plant" && e.x == null),
            n = fresh.length;
          fresh.forEach((e, i) => {
            const a = (6.283 * i) / n,
              [px, py] = v6Clamp(c.tgt.x + Math.cos(a) * 14, c.tgt.y + Math.sin(a) * 9);
            e.x = px;
            e.y = py;
          });
        }
      } catch (e) {}
      return r;
    };
  }
  v90SacTick = function (dt) {
    if (!S || G.dead) return;
    const iv = uv("v90_sac", 0);
    G.v90sacT = (G.v90sacT || 0) + dt;
    if (G.v90sacT < iv) return;
    const p = G.pl,
      ents = (v6G().ents || []).filter((e) => (e.k === "orb" || e.k === "plant") && e.x != null);
    let best = null,
      list = null,
      bd = Infinity;
    for (const L of [G.mins, G.gsp, G.turs, ents])
      for (const m of L || []) {
        if (!m || m.x == null || (m.hp != null && m.hp <= 0)) continue;
        const d = Math.hypot(m.x - p.x, m.y - p.y);
        if (d < bd) (bd = d), (best = m), (list = L);
      }
    if (!best) return void (G.v90sacT = iv);
    const from = list === ents ? v6G().ents : list;
    from.splice(from.indexOf(best), 1);
    G.v90sacT = 0;
    G.v90sacB = G.t + V90_K.sacBuff;
    const R = V90_K.sacR * (PS.area || 1),
      x = best.x,
      y = best.y - 3;
    roPushFx(G.fx, { k: "boom", x, y, r: 0.6 * R, t: 0, life: 0.35, c: "#9a5aff" });
    G.flashes.push({ x, y, t: 0, ring: 1, c: "#c08aff" });
    sfx("big");
    const k = uv("v90_sac", 1) / 100;
    for (const e of mobsNear(x, y, R)) hitMob(e, k, { min: 1, sx: x, sy: y, kb: 30, nomom: 1, v88oh: 1, v90: 1 });
  };
  UNIQUE.v90_sac.d = `每 {0} 秒獻祭離你最近的 1 隻召喚物（召喚元素精靈、樂靈合奏、天使降臨、生命體、英靈、獵鷹、FAW 砲台、聖靈環繞的聖靈、地獄植物與植物栽培的植物皆可，之後施放技能時照常重新召喚），在原地爆炸，造成 {1}% 武器傷害（套用召喚物傷害）；之後 ${V90_K.sacBuff} 秒內獲得「不潔之力」：傷害 +{2}%；召喚物傷害 +{3}%`;
}
if (typeof roV4Install === "function") {
  const r4v109 = roV4Install;
  roV4Install = function () {
    r4v109();
    v109Install();
  };
}
