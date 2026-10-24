/* 流浪仙境 v1.2.1：無限武鬥場王層頭目
   1. 王層頭目的外觀改用名稱對應的 RO 頭目圖（原本顯示該層地圖的小怪圖，例：「龜王」顯示小惡魔）
   2. 王層頭目改為 15 隻地圖頭目依序輪替：第 10 層天使波利、第 20 層黃金蟲……第 150 層賽依連・溫德，之後循環
      （原本依「(層數−1) ÷ 15 的餘數」挑地圖，王層只會輪到龜王、海神、賽依連・溫德）。
      生命與傷害換算回原本該層頭目的數值，各層難度與線上排行不受影響；招式依頭目本身的類型。 */

// 第 f 層（王層）的頭目所屬地圖編號
const v124BossMap = (f) => (Math.max(1, Math.floor(f / TW.boss)) - 1) % MAP_N;

function v124TwInstall() {
  const tick = twTick;
  twTick = function (t) {
    const a = G.tw;
    // 只有「王即將出現」的那一刻替換地圖編號；此時小怪已全數生成，不影響一般怪
    if (!a || !a.boss || a.bs || a.rest > 0 || a.k < a.need) return tick.apply(this, arguments);
    const mi = a.mi,
      bi = v124BossMap(a.f);
    let r;
    a.mi = bi;
    try {
      r = tick.apply(this, arguments);
    } finally {
      a.mi = mi;
    }
    const m = a.bs;
    if (m && !m.v124) {
      // 生命、傷害換算回原本該層頭目（MAPS[mi].bt）的類型倍率
      const o = MON[MAPS[mi]?.bt],
        n = MON[MAPS[bi]?.bt],
        hk = o && n && n.hp ? o.hp / n.hp : 1,
        dk = o && n && n.dmg ? o.dmg / n.dmg : 1;
      m.hp *= hk;
      m.max *= hk;
      if (m.sh) (m.sh *= hk), (m.shm *= hk);
      m.dmg *= dk;
      m.v124 = roBossKeys[bi] || "";
    }
    return r;
  };
  // 外觀：王層頭目改畫該頭目的 RO 圖
  const dm = drawMob;
  drawMob = function (c, m, ...x) {
    const k = m && m.v124;
    if (!k || !RO.assets.monsters?.[k]) return dm.call(this, c, m, ...x);
    const old = roMonsterKeys[m.type];
    roMonsterKeys[m.type] = k;
    try {
      return dm.call(this, c, m, ...x);
    } finally {
      roMonsterKeys[m.type] = old;
    }
  };
  // 說明
  const row = [
    "王層頭目",
    `每 10 層的王層依序出現 ${MAP_N} 張地圖的頭目（第 10 層${MAPS[0].boss}、第 20 層${MAPS[1].boss}……第 ${MAP_N * 10} 層${MAPS[MAP_N - 1].boss}），之後循環。外觀為該頭目的 RO 原版圖；生命與傷害依層數計算，招式依頭目類型。`,
  ];
  for (const k of ["v54ch", "tower"]) {
    const h = HELP[k];
    if (Array.isArray(h?.[1]) && !h[1].some((r) => r[0] === row[0])) {
      const i = h[1].findIndex((r) => r[0] === "掉落");
      h[1].splice(i < 0 ? h[1].length : i, 0, row);
    }
  }
}

if (typeof roV4Install === "function") {
  const r4v124 = roV4Install;
  roV4Install = function () {
    r4v124.apply(this, arguments);
    try {
      v124TwInstall();
    } catch (e) {
      console.error("v124", e);
    }
  };
}
