/* 流浪仙境 v1.0.18（內部 v10.8）：獻祭之靴可以獻祭所有召喚物
   原本只會獻祭跟隨型召喚物（召喚元素精靈、樂靈合奏、天使降臨），生命體、英靈與砲台流裝上幾乎沒有效果。
   現在獻祭離你最近的 1 隻召喚物，不分種類（跟隨型、生命體召喚、英靈召喚、獵鷹召喚、FAW 砲台）；
   被獻祭的召喚物下次施放技能時重新召喚或放置。爆炸、不潔之力、召喚物傷害加成都不變。 */

function v108Install() {
  if (typeof v90SacTick !== "function" || typeof UNIQUE === "undefined" || !UNIQUE.v90_sac) return;
  v90SacTick = function (dt) {
    if (!S || G.dead) return;
    const iv = uv("v90_sac", 0);
    G.v90sacT = (G.v90sacT || 0) + dt;
    if (G.v90sacT < iv) return;
    const p = G.pl;
    let best = null,
      list = null,
      bd = Infinity;
    for (const L of [G.mins, G.gsp, G.turs])
      for (const m of L || []) {
        if (!m || m.x == null || (m.hp != null && m.hp <= 0)) continue;
        const d = Math.hypot(m.x - p.x, m.y - p.y);
        if (d < bd) (bd = d), (best = m), (list = L);
      }
    if (!best) return void (G.v90sacT = iv);
    list.splice(list.indexOf(best), 1);
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
  UNIQUE.v90_sac.d = `每 {0} 秒獻祭離你最近的 1 隻召喚物（召喚元素精靈、樂靈合奏、天使降臨、生命體、英靈、獵鷹、FAW 砲台皆可，之後施放技能時照常重新召喚），在原地爆炸，造成 {1}% 武器傷害（套用召喚物傷害）；之後 ${V90_K.sacBuff} 秒內獲得「不潔之力」：傷害 +{2}%；召喚物傷害 +{3}%`;
}
if (typeof roV4Install === "function") {
  const r4v108 = roV4Install;
  roV4Install = function () {
    r4v108();
    v108Install();
  };
}
