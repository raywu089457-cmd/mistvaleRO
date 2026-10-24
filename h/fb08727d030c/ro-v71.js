/* 流浪仙境 v7.1：主宰裝備基底改為 Lv120、深淵改為 3 階（最高階加成不變）、怪物子彈改用 RO 屬性特效、48 小時模擬校正 */

// ---------------------------------------------------------------------------
// 1. 主宰裝備：基底素質以 Lv120 計算（新掉落物品等級 120，需求 Lv115）；既有主宰裝備的基底素質換算為 Lv120（物品等級不變，不影響穿戴）
const V71_MY_L = 120;
function v71MythInstall() {
  v67MythGear = function () {
    const slot = SLOTS[ri(0, SLOTS.length - 1)],
      it = makeItem(V71_MY_L, { slot, rar: 4 });
    if (!it) return null;
    it.my = 1;
    delete it.uq;
    delete it.v5;
    v5Convert(it);
    it.v71l = 1;
    v5Name(it);
    return it;
  };
}
function v71MyScale(it) {
  if (!it || !it.my || it.uq || !it.v5 || it.v71l) return false;
  const L = Math.max(1, it.ilvl || 1),
    T = V71_MY_L;
  it.v71l = 1;
  if (L >= T) return false;
  if (it.slot === "weapon" && it.wd) {
    const w = WEAPON[S?.cls] || WEAPON.sword,
      r = ((w.a + w.k * T) * V5_WK(T)) / ((w.a + w.k * L) * V5_WK(L));
    it.wd[0] = Math.round(it.wd[0] * r);
    it.wd[1] = Math.round(it.wd[1] * r);
  } else {
    const f = (x) => (it.slot === "chest" ? 8 + 5 * x : 4 + 2.5 * x),
      r = f(T) / f(L);
    if (it.arm) it.arm = Math.round(it.arm * r);
    if (it.eva) it.eva = Math.round(it.eva * r);
    if (it.hp) it.hp = Math.round(it.hp * Math.pow(v5Lv(T) / v5Lv(L), 1.5));
  }
  const rb = v5Lv(T) / v5Lv(L);
  for (const b of it.bx || []) if (!V5_FLAT.has(b.k)) b.v = b.k === "crit" ? +(b.v * rb).toFixed(1) : Math.round(b.v * rb);
  return true;
}

// ---------------------------------------------------------------------------
// 2. 深淵改為 3 階：第 3 階＝原本第 10 階（等級 Lv127、生命約 ×41、傷害約 ×3.1、菁英 +20%、稀有度 +30%、卡片 +150%）
//    每階倍率為原本的 10/3 次方，第 2 階 Lv120；活動深淵的數量與生成速度同樣在第 3 階等於原本第 10 階
const V71_K = 10 / 3;
V56_ABY.max = 3;
V56_ABY.hp = +Math.pow(1.45, V71_K).toFixed(4);
V56_ABY.dmg = +Math.pow(1.12, V71_K).toFixed(4);
V56_ABY.elite = 20 / 3;
V56_ABY.rup = 10;
V56_ABY.card = 0.5;
V65_ABY.densUp = 4.5;
V65_ABY.spawnUp = 45;
const v71AbyMap = (x) => (!(x > 0) ? 0 : x >= 10 ? 3 : x >= 7 ? 2 : 1);
function v71AbyInstall() {
  const ens = roEnsureStats;
  roEnsureStats = function (...a) {
    const r = ens.apply(this, a);
    try {
      if (S && S.v71aby !== 1) {
        S.v71aby = 1;
        for (const row of Object.values(S.aby || {})) {
          if (!row) continue;
          row.m = v71AbyMap(row.m);
          row.on = v71AbyMap(row.on);
        }
      }
      if (S) for (const it of [...SLOTS.map((s) => S.equip[s]), ...(S.bag || [])]) v71MyScale(it);
    } catch (e) {}
    return r;
  };
  const top = Math.round(Math.pow(1.45, 10)),
    td = +Math.pow(1.12, 10).toFixed(1);
  const row = (k, name, txt) => {
    const r = HELP[k]?.[1]?.find((x) => x[0] === name);
    if (r) r[1] = txt;
  };
  row("v56aby", "開放", `全部 ${MAP_N} 張主線地圖的頭目都擊敗後開放，每張地圖都能進入深淵第 1 階；在最高階擊敗該地圖頭目，就開放該地圖的下一階，最高 3 階。`);
  row("v56aby", "怪物等級", `所有地圖一致：第 1 階 Lv${V6_ABY_LV[0]}、第 2 階 Lv${v56AbyLvN(2)}、第 3 階 Lv${V6_ABY_LV[1]}。`);
  row("v56aby", "難度", `每階怪物生命 ×${V56_ABY.hp.toFixed(2)}、傷害 ×${V56_ABY.dmg.toFixed(2)}（逐階相乘，第 3 階生命約 ×${top}、傷害約 ×${td}），另外再加上等級提升。頭目同樣適用，限時內擊敗才會開放下一階。`);
  row("v56aby", "獎勵", `每階菁英出現率 +${+V56_ABY.elite.toFixed(1)}%、裝備稀有度提升機率 +${V56_ABY.rup}%、卡片掉落率 +${V56_ABY.card * 100}%（第 3 階：菁英 +20%、稀有度 +30%、卡片 +150%）；另有終局加成，並會掉落信物。怪物等級越高經驗值越多。`);
  row("v65aby", "數量", `怪物數量上限第 1 階 +${V65_ABY.dens}、每階再 +${V65_ABY.densUp}；生成速度第 1 階 +${V65_ABY.spawn}%、每階再 +${V65_ABY.spawnUp}%（第 3 階 +21、+170%）。`);
  row("v65aby", "難度", `比照一般深淵：每階怪物生命 ×${V56_ABY.hp.toFixed(2)}、傷害 ×${V56_ABY.dmg.toFixed(2)}（逐階相乘），神祇頭目同樣適用。`);
}

// ---------------------------------------------------------------------------
// 3. 怪物子彈（遠程怪、菁英「遠射」、頭目彈幕）改用 RO 屬性特效貼圖
const V71_SHOT = {
  fire: { tex: ["fire_blast.bmp"], add: 1, sz: 8 },
  water: { tex: ["icearrow.tga"], sz: 9, rot: 1 },
  wind: { anim: ["thunder_ball_a.bmp", "thunder_ball_b.bmp", "thunder_ball_c.bmp", "thunder_ball_d.bmp"], add: 1, sz: 8 },
  earth: { tex: ["stone_part.bmp"], al: 1, tint: [170, 120, 70], sz: 10, spin: 8, glow: [230, 180, 110] },
  poison: { tex: ["puyan.bmp"], add: 1, tint: [150, 255, 80], sz: 11, glow: [170, 90, 220] },
  holy: { tex: ["pok3.tga"], add: 1, tint: [255, 235, 150], sz: 11 },
  shadow: { tex: ["twirl_soft.bmp"], al: 1, tint: [90, 40, 140], sz: 8, spin: 10, glow: [170, 110, 255] },
  ghost: { tex: ["round_kirakira.bmp"], add: 1, tint: [200, 175, 255], sz: 7 },
  undead: { anim: ["devil_fire08.bmp", "devil_fire09.bmp", "devil_fire10.bmp", "devil_fire11.bmp", "devil_fire12.bmp", "devil_fire13.bmp"], add: 1, tint: [120, 255, 170], sz: 14 },
  neutral: { tex: ["pok1.tga"], add: 1, sz: 9 },
};
const v71Hex = (c) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(c || "");
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
function v71ShotDraw(c, p) {
  const el = typeof v5MobEl === "function" && p.src ? v5MobEl(p.src) : "neutral",
    cfg = V71_SHOT[el] || V71_SHOT.neutral,
    ang = Math.atan2(p.vy || (p.tgt ? p.tgt.y - p.y : 0), p.vx || (p.tgt ? p.tgt.x - p.x : 1)),
    key = cfg.anim ? cfg.anim[Math.floor(G.t * 18) % cfg.anim.length] : cfg.tex[0],
    im0 = v69Tex(key, cfg.al);
  if (!im0) return false;
  const tint = cfg.tint || (el === "neutral" ? v71Hex(p.col) : null),
    im = tint ? roFxTint(im0, [...tint, 255]) : im0,
    m = cfg.sz / Math.max(im.width, im.height),
    w = im.width * m,
    h = im.height * m;
  c.save();
  // 尾跡
  for (let i = 2; i >= 0; i--) {
    const k = i * 2.2;
    c.save();
    c.globalAlpha = i ? 0.22 / i : 0.95;
    if (cfg.add) c.globalCompositeOperation = "lighter";
    c.translate(p.x - Math.cos(ang) * k, p.y - Math.sin(ang) * k);
    if (cfg.rot) c.rotate(ang);
    else if (cfg.spin) c.rotate(G.t * cfg.spin);
    const s = i ? 1 - 0.18 * i : 1;
    c.drawImage(im, (-w * s) / 2, (-h * s) / 2, w * s, h * s);
    c.restore();
  }
  if (cfg.glow) {
    const g = v69Tex("pok1.tga");
    if (g) {
      c.globalCompositeOperation = "lighter";
      c.globalAlpha = 0.6;
      c.drawImage(roFxTint(g, [...cfg.glow, 255]), p.x - w * 0.45, p.y - h * 0.45, w * 0.9, h * 0.9);
    }
  }
  c.restore();
  return true;
}
// 命中：RO 屬性閃光（取代像素碎屑）
const V71_HIT = { fire: ["fire_blast.bmp", null], water: ["freeze_ice.bmp", null], wind: ["thunder_center.bmp", null], earth: ["dust_part.bmp", [200, 160, 110]], poison: ["puyan.bmp", [150, 230, 90]], holy: ["pok3.tga", [255, 235, 150]], shadow: ["pok1.tga", [150, 90, 230]], ghost: ["round_kirakira.bmp", [200, 175, 255]], undead: ["lord_blast_e_small.bmp", null], neutral: ["pok1.tga", null] };
function v71HitDraw(c, e) {
  const k = (G.t - e.t0) / 0.3;
  if (k < 0 || k > 1) return;
  const d = V71_HIT[e.el] || V71_HIT.neutral,
    im0 = v69Tex(d[0]);
  if (!im0) return;
  const im = d[1] ? roFxTint(im0, [...d[1], 255]) : im0,
    w = 6 + 10 * k;
  c.save();
  c.globalCompositeOperation = "lighter";
  c.globalAlpha = 1 - k;
  c.drawImage(im, e.x - w / 2, e.y - w / 2, w, w);
  c.restore();
}
function v71ShotInstall() {
  const isEnemy = (p) => p && p.enemy && (p.k === "ebolt" || p.k === "mbolt");
  // 拿掉怪物子彈的像素尾跡與命中碎屑
  const pt = projTrail;
  projTrail = function (t, ...x) {
    if (t && t.enemy) return;
    return pt.call(this, t, ...x);
  };
  const bu = burst;
  burst = function (x, y, n, cols, sp, o, ...r) {
    if (n === 6 && sp === 60 && Array.isArray(cols) && cols[1] === "#ffffff" && o && o.g === 30 && o.life === 0.3 && o.z === 6 && o.glow) {
      const near = (G.proj || []).length >= 0 && V71S.last.find((p) => Math.hypot(p.x - x, p.y + 6 - y) < 10);
      (G.v71hit ||= []).push({ x, y: y - 6, t0: G.t, el: near ? near.el : "neutral" });
      if (G.v71hit.length > 30) G.v71hit.shift();
      return;
    }
    return bu.call(this, x, y, n, cols, sp, o, ...r);
  };
  const ft = drawFxTop;
  drawFxTop = function (c, ...x) {
    const all = G.proj,
      shots = all ? all.filter(isEnemy) : [];
    if (!shots.length || typeof v69Tex !== "function" || !v69Tex("pok1.tga")) {
      const r0 = ft.call(this, c, ...x);
      if (G.v71hit?.length && typeof v69Tex === "function")
        try {
          G.v71hit = G.v71hit.filter((e) => G.t - e.t0 < 0.3);
          for (const e of G.v71hit) v71HitDraw(c, e);
        } catch (e) {}
      return r0;
    }
    G.proj = all.filter((p) => !isEnemy(p));
    let r;
    try {
      r = ft.call(this, c, ...x);
    } finally {
      G.proj = all;
    }
    try {
      V71S.last = shots.map((p) => ({ x: p.x, y: p.y, el: typeof v5MobEl === "function" && p.src ? v5MobEl(p.src) : "neutral" }));
      for (const p of shots) v71ShotDraw(c, p);
      if (G.v71hit?.length) {
        G.v71hit = G.v71hit.filter((e) => G.t - e.t0 < 0.3);
        for (const e of G.v71hit) v71HitDraw(c, e);
      }
    } catch (e) {}
    return r;
  };
}
const V71S = { last: [] };

// ---------------------------------------------------------------------------
// 4. 48 小時模擬校正
// 4-1 魔王戰（獸人英雄、伊夫利特、冰暴騎士、巴風特、闇答萊屍）原本固定 Lv90，對深淵階段（Lv112～127）的角色幾秒內就結束；
//     改為依開放時的等級出場，生命與傷害依等級換算後再調整；信物掉率下修（原本每小時可打數十場）
const V71_GD = {
  g: { lv: 112, hp: 3.0, dmg: 1.0 }, // 守護者三魔王
  f: { lv: 120, hp: 2.5, dmg: 1.25 }, // 巴風特
  m: { lv: 127, t: 330, sh: 0.05 }, // 闇答萊屍：維持巴風特的 4 倍生命／2 倍傷害（跟著校正後的巴風特），Lv127、限時 330 秒，護盾 8%→5%
  tk: 0.4, // 信物掉率
  slam: 2.5, // 震地（紅圈）傷害倍率 4→2.5：自動戰鬥無法走位，近戰職業每 4 秒必吃一次
};
const v71HpR = (L) => monHp(L) / monHp(90),
  v71DmgR = (L) => monDmg(L) / monDmg(90);
function v71GuardInstall() {
  for (let i = 0; i < GUARD_TK.length; i++) GUARD_TK[i] *= V71_GD.tk;
  const sg = startGuard;
  startGuard = function (t, ...x) {
    const r = sg.call(this, t, ...x);
    const b = G.boss;
    if (!b || G.guard !== t || b.v71g) return r;
    b.v71g = 1;
    const c = t < GUARD.length ? V71_GD.g : t === GUARD.length ? V71_GD.f : null;
    if (c) {
      b.lv = c.lv;
      b.max *= v71HpR(c.lv) * c.hp;
      b.hp = b.max;
      b.dmg *= v71DmgR(c.lv) * c.dmg;
    } else if (t === 4) {
      // 跟著校正後的巴風特（v7.0 召喚時再乘上巴風特的 4 倍生命／2 倍傷害）；延長時間、護盾變薄
      const f = V71_GD.f;
      b.lv = V71_GD.m.lv;
      b.max *= v71HpR(f.lv) * f.hp;
      b.hp = b.max;
      b.dmg *= v71DmgR(f.lv) * f.dmg;
      G.bossT = V71_GD.m.t;
    }
    return r;
  };
  // 說明
  const ex = `（v7.1：生命與傷害依等級換算，信物掉率 ×${V71_GD.tk}）`;
  for (const hv of Object.values(HELP))
    for (const r of Array.isArray(hv?.[1]) ? hv[1] : []) {
      if (!Array.isArray(r) || typeof r[1] !== "string") continue;
      r[1] = r[1]
        .replace(/(可挑戰一次，(?:魔王|守護者)) ?90 級/, `$1 ${V71_GD.g.lv} 級`)
        .replace(/(碎片各 1 個開啟挑戰，) ?90 級/, `$1${V71_GD.f.lv} 級`)
        .replace(/(紅圈內受到 )4( 倍傷害)/, `$1${V71_GD.slam}$2`)
        .replace(/(虛空召喚魔王闇答萊屍（[^）]*?)限時 270 秒/, `$1Lv${V71_GD.m.lv}、限時 ${V71_GD.m.t} 秒`);
      if (/^(挑戰|信物)$/.test(r[0]) && r[1].includes(`${V71_GD.g.lv} 級`) && !r[1].includes("v7.1")) r[1] += ex;
    }
  // 闇答萊屍的護盾較薄（仍是輸出檢定）；校正後的魔王震地倍率降低
  const gt = guardTick;
  guardTick = function (t, a, ...x) {
    if (!t || !t.v71g) return gt.call(this, t, a, ...x);
    const v0 = GUARD_SH.v,
      k0 = GUARD_SLAM.k;
    if (G.guard === 4) GUARD_SH.v = V71_GD.m.sh;
    GUARD_SLAM.k = V71_GD.slam;
    try {
      return gt.call(this, t, a, ...x);
    } finally {
      GUARD_SH.v = v0;
      GUARD_SLAM.k = k0;
    }
  };
}

// 4-2 商人：金錢攻擊、投資等技能只要 Zeny 足夠就自動付款，模擬中商人永遠存不到錢（買不起寶石、48 小時精煉 0 次、裝備全 +0）。
//     改為 Zeny 高於保留額（5 × 等級²：Lv30 4,500、Lv100 50,000、Lv127 約 80,000）時才付款
const v71ZRes = (lv) => 5 * lv * lv;
function v71ZenyInstall() {
  if (typeof v6PayZeny !== "function") return;
  v6PayZeny = function (k) {
    const z = Math.round(k * Math.max(1, S.lvl) * (1 - Math.min(0.6, v6Tal("v6zeny"))));
    if (S.ash - z < v71ZRes(Math.max(1, S.lvl))) return 0;
    S.ash -= z;
    (G.v6.zSpent ||= 0), (G.v6.zSpent += z);
    return z;
  };
  for (const id of ["mc_mammon", "mc_invest", "mc_term"]) {
    const sk = SKILLS[id];
    if (!sk) continue;
    for (const f of ["d", "desc"]) if (typeof sk[f] === "string" && sk[f].includes("Zeny") && !sk[f].includes("保留額")) sk[f] += "（Zeny 高於 5×等級² 的保留額時才付款）";
  }
}

// 4-3 職業天賦倍率（依流派）：以相同裝備（Lv127、Lv100 傳說 +7）量測 24 流派的單體輸出（無限生命頭目 60 秒）與清怪（60 秒擊殺數），
//     兩者幾何平均後與中位數比較；最弱約 0.65（盜賊技能流）、最強約 1.45（服事祈禱流）。往中位數拉回約六成、上下限 ±30%，以 5% 為單位。
//     轉職後依所選流派套用（獨立相乘的傷害倍率）；轉職前不影響
const V71_BR = {
  sword: [20, 0, 15, -20], // 均衡、神聖、暴力、鐵壁
  bow: [-5, 5, 15, 0], // 狙殺、樂箭、陷阱、合奏
  mage: [-10, -5, 5, 20], // 元素、精靈、禁咒、自動念咒
  thief: [25, 25, 30, -5], // 平A、偷襲、技能、暗咒
  acolyte: [-10, -5, -25, -5], // 聖光、連拳、祈禱、爆氣
  merchant: [20, 10, -5, -5], // 戰鬥、生命體、機械、毒雲
};
const V71_BR_N = "職業天賦倍率";
const v71BrIdx = () => {
  const k = S?.tal?.asc,
    a = k && ASC[S.cls];
  return a ? a.findIndex((b) => b.k === k) : -1;
};
const v71BrMul = () => {
  const i = v71BrIdx(),
    a = V71_BR[S?.cls];
  return i >= 0 && Array.isArray(a) ? a[i] || 0 : 0;
};
function v71BrInstall() {
  const cm = collectMods;
  collectMods = function (...a) {
    const out = cm.apply(this, a);
    const v = v71BrMul();
    if (v) out.push({ s: "dmg", v, src: V71_BR_N, x: "more" });
    return out;
  };
  const fl = (b) => (String(b.n).match(/（([^）]+)）/) || [, b.n])[1];
  const txt = Object.keys(V71_BR)
    .map((c) => `${CLASS[c]?.n || c}：` + (ASC[c] || []).map((b, i) => { const v = V71_BR[c][i] || 0; return `${fl(b)} ${v ? (v > 0 ? "+" : "−") + Math.abs(v) + "%" : "不變"}`; }).join("、"))
    .join("；");
  const h = HELP.char?.[1];
  if (Array.isArray(h) && !h.some((r) => r[0] === "職業天賦倍率")) h.push(["職業天賦倍率", `轉職後依所選流派，傷害另乘上一層獨立的倍率（v7.1 依 24 流派同裝備量測校正，顯示在角色面板的傷害倍率）：${txt}。`]);
}

// ---------------------------------------------------------------------------
function v71Install() {
  v71BrInstall();
  v71GuardInstall();
  v71ZenyInstall();
  v71MythInstall();
  v71AbyInstall();
  v71ShotInstall();
}
if (typeof roV4Install === "function") {
  const r4v71 = roV4Install;
  roV4Install = function () {
    r4v71();
    v71Install();
  };
}
