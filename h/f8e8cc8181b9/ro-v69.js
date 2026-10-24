/* 流浪仙境 v6.9：特效選單全面改用 RO 素材、主宰圖示、MVP 門票減半、神話卡片鑲嵌不能用神工匠的祝福、鐵匠／神工匠的祝福掉率 1/20、職業坦度重排（劍士最坦、商人第二、盜賊居中） */

// ---------------------------------------------------------------------------
// 1. 職業坦度：劍士最坦、商人第二、盜賊下修到中位數（載入時設定，說明文字由 v6.8 安裝時產生）
V68.capE.thief = 65; // 盜賊閃避上限 75% → 65%
V68.capA.merchant = 80; // 商人護甲減傷上限 75% → 80%
V68.amul = { sword: 1.2, merchant: 1.4 }; // 護甲效率：劍士 +20%、商人 +40%
V68.fmul = { sword: 2 }; // 劍士固定扣減 ×2
V68.kemul = { thief: 1.4 }; // 盜賊閃避難度 ×1.4

// ---------------------------------------------------------------------------
// 2. MVP 門票掉率全部減半
for (const k of ["mob", "elite", "boss"]) V64_TK[k] = V64_TK[k].map((v) => v * 0.5);

// ---------------------------------------------------------------------------
// 4. 鐵匠的祝福、神工匠的祝福掉率降為原本的 1/20
//    鐵匠：頭目 10% → 0.5%、菁英 1% → 0.05%；神工匠：武鬥場第 10 層頭目 40% → 2%，每 10 層 +10% → +0.5%
V63_BLESS.p1Keep.boss = 10 / 60 / 20;
V63_BLESS.p1Keep.elite = 1 / 15 / 20;
V63_BLESS.p2Base = 0.02;
V63_BLESS.p2Step = 0.005;
function v69BlessInstall() {
  if (typeof V64_MAT_USE !== "undefined") {
    V64_MAT_USE.p1 = "精煉 +5～+7、鑲嵌稀有以下卡片失敗時的保護；頭目 0.5%、菁英 0.05% 掉落";
    V64_MAT_USE.p2 = "武器 +6 以上精煉必須消耗；精煉 +8～+10、鑲嵌史詩與傳說卡片失敗時的保護（神話卡片不能用）；只由無限武鬥場頭目關掉落（第 10 層 2%，每 10 層 +0.5%）";
  }
  const row = (k, name, txt) => {
    const r = HELP[k]?.[1]?.find((x) => x[0] === name);
    if (r) r[1] = txt;
  };
  row("v5mat", "祝福", "鐵匠的祝福、神工匠的祝福：精煉與鑲嵌失敗時的保護，非常稀有。鐵匠的祝福由頭目（0.5%）與菁英（0.05%）掉落；神工匠的祝福只由無限武鬥場頭目關掉落（第 10 層 2%，每 10 層 +0.5%）。");
}

// ---------------------------------------------------------------------------
// 3. 神話卡片鑲嵌時不能使用神工匠的祝福（傳說的魔力礦石仍可使用）
function v69MythInsInstall() {
  const ins = v5Insert;
  v5Insert = function (u, i, id) {
    const c = V5_CARD[id];
    if (c && c.t >= 6 && ui.v5prot && !v64LgOn()) {
      const p = ui.v5prot;
      ui.v5prot = false;
      try {
        return ins.call(this, u, i, id);
      } finally {
        ui.v5prot = p;
      }
    }
    return ins.call(this, u, i, id);
  };
  const sk = v5SockTab;
  v5SockTab = function (...a) {
    let h = sk.apply(this, a);
    h = h.replace(/(・失敗時卡片 50% 機率損毀)([\s\S]*?)data-k="([^"]+)"/g, (m, t, mid, id) => (V5_CARD[id]?.t >= 6 ? `${t}（神話卡片不能使用神工匠的祝福）${mid}data-k="${id}"` : m));
    return h.replace("史詩以上用神工匠的祝福）", "史詩與傳說用神工匠的祝福；神話卡片不能使用）");
  };
  const row = (k, name, f) => {
    const r = HELP[k]?.[1]?.find((x) => x[0] === name);
    if (r && typeof r[1] === "string" && !r[1].includes("神話卡片")) r[1] = f(r[1]);
  };
  row("v5sock", "失敗", (s) => s + "神話卡片不能使用神工匠的祝福保護，只能用傳說的魔力礦石。");
}

// ---------------------------------------------------------------------------
// 5. 特效選單：拖尾、擊中、擊殺特效全部改用 RO 原版特效貼圖與技能動畫（含選單縮圖與預覽）
// 不透明（黑底）貼圖另備「亮度轉透明度」版本，供一般疊加（煙霧、落葉、沙塵）使用
const V69_ALPHA = { "ff.bmp": "ff_bmp", "dust_part.bmp": "dust_part_bmp", "stone_part.bmp": "stone_part_bmp", "smoke2.bmp": "smoke2_bmp", "smoke3.bmp": "smoke3_bmp", "twirl_soft.bmp": "twirl_soft_bmp" };
const v69AlphaSrc = (k) => RO.root + "effects/textures-a/" + V69_ALPHA[k] + ".png";
function v69AlphaLoad() {
  if (typeof Image === "undefined") return;
  for (const k of Object.keys(V69_ALPHA)) {
    const src = v69AlphaSrc(k);
    if (RO.images[src]) continue;
    const im = new Image();
    im.onload = () => (RO.images[src] = im);
    im.src = src;
  }
}
const v69Tex = (k, al) => {
  if (al && V69_ALPHA[k]) {
    const a = RO.images[v69AlphaSrc(k)];
    if (a) return a;
  }
  const d = RO.assets.effects?.textures?.[k];
  return d ? RO.images[RO.root + d.file] : null;
};
const v69TexUrl = (k) => {
  const d = RO.assets.effects?.textures?.[k];
  return d ? RO.root + d.file : "";
};
const v69Rf = (a) => (Array.isArray(a) ? a[0] + Math.random() * (a[1] - a[0]) : a || 0);
const v69Frames = (base, n) => Array.from({ length: n }, (_, i) => `${base}${String(i + 1).padStart(2, "0")}.bmp`);
const V69_FIRE = v69Frames("devil_fire", 25);
const V69_COIN = ["coin_a.bmp", "coin_b.bmp", "coin_c.bmp", "coin_d.bmp", "coin_e.bmp", "coin_d.bmp", "coin_c.bmp", "coin_b.bmp"];
const V69_TBALL = ["thunder_ball_a.bmp", "thunder_ball_b.bmp", "thunder_ball_c.bmp", "thunder_ball_d.bmp"];
// 拖尾設定：tex 隨機貼圖／anim 動畫影格、tint 染色、add 疊加發光、sz 大小、z 起始高度、vz 上升速度、g 重力、sway 飄動、spin 旋轉、life 壽命、rate 每秒數量、sec 第二層粒子
const V69_TR = [
  { tex: ["sanctuaria_angel_wing_up.bmp", "sanctuaria_angel_wing_upa.bmp", "sanctuaria_angel_wing_up2.bmp"], sz: [6, 9], z: [8, 16], vz: [-3, 0], g: 0.8, sway: 1, spin: [-1.5, 1.5], life: [1.4, 2], rate: 8, sec: { tex: ["pika01.bmp"], add: 1, sz: [2, 3.5], z: [2, 12], vz: [2, 6], life: [0.5, 0.9], rate: 10 }, th: "sanctuaria_angel_wing_up.bmp" },
  { tex: ["ff.bmp"], al: 1, tint: [70, 170, 50], sz: [5, 8], z: [6, 12], vz: [-2, 1], g: 0.9, sway: 1, spin: [-2, 2], life: [1.2, 1.8], rate: 9, sec: { tex: ["pokjuk_c.bmp"], tint: [180, 255, 140], add: 1, sz: [6, 9], z: [2, 8], vz: [1, 3], life: [0.6, 1], rate: 4 }, th: "ff.bmp", thf: "sepia(1) saturate(4) hue-rotate(50deg)" },
  { tex: ["round_kirakira.bmp"], tint: [200, 180, 255], add: 1, sz: [4, 7], z: [3, 8], vz: [4, 9], g: -1, life: [0.8, 1.3], rate: 12, sec: { tex: ["pok1.tga"], tint: [180, 150, 255], add: 1, sz: [6, 9], z: [4, 10], vz: [2, 5], life: [0.5, 0.8], rate: 5 }, th: "round_kirakira.bmp", thf: "hue-rotate(230deg) saturate(1.4)" },
  { tex: ["dust_part.bmp"], al: 1, a: 0.8, tint: [230, 190, 120], sz: [6, 10], z: [0, 2], vz: [1, 3], g: 1, life: [0.7, 1.1], rate: 12, low: 1, sec: { tex: ["stone_part.bmp"], al: 1, tint: [220, 180, 110], sz: [3, 5], z: [1, 3], vz: [3, 6], g: 14, life: [0.5, 0.8], rate: 6, low: 1 }, th: "dust_part.bmp" },
  { tex: ["bubble_b.bmp", "bubble_c.bmp", "bubble_d.bmp"], add: 1, sz: [4, 7], z: [2, 8], vz: [5, 10], g: -2, sway: 1, life: [1, 1.6], rate: 10, th: "bubble_b.bmp" },
  { tex: ["freeze_ice.bmp"], add: 1, sz: [4, 6], z: [0, 3], vz: [1, 3], life: [0.6, 1], rate: 7, low: 1, sec: { tex: ["snow_a.bmp", "snow_b.bmp"], add: 1, sz: [5, 8], z: [6, 14], vz: [-3, -1], g: 0.3, sway: 1, life: [1, 1.5], rate: 8 }, th: "freeze_ice.bmp" },
  { anim: V69_FIRE, fps: 30, add: 1, sz: [16, 22], z: [0, 2], vz: [3, 6], g: -2, life: [0.5, 0.8], rate: 14, th: "devil_fire12.bmp", thz: 2.6 },
  { tex: ["smoke2.bmp", "smoke3.bmp"], al: 1, tint: [120, 200, 40], a: 0.8, sz: [8, 12], z: [1, 4], vz: [2, 4], g: -0.5, spin: [-0.6, 0.6], life: [1, 1.5], rate: 8, sec: { tex: ["puyan.bmp"], tint: [190, 100, 230], add: 1, sz: [5, 8], z: [2, 8], vz: [2, 5], life: [0.6, 1], rate: 4 }, th: "smoke2.bmp", thf: "sepia(1) saturate(5) hue-rotate(40deg)" },
  { anim: V69_COIN, fps: 14, sz: [3, 4], z: [6, 10], vz: [6, 10], g: 30, spread: 10, life: [0.6, 0.9], rate: 10, sec: { tex: ["pika01.bmp"], add: 1, sz: [2, 3], z: [2, 10], vz: [1, 4], life: [0.4, 0.7], rate: 6 }, th: "coin_a.bmp" },
  { tex: ["smoke3.bmp", "smoke2.bmp"], al: 1, tint: [90, 50, 150], a: 0.7, sz: [8, 12], z: [0, 4], vz: [2, 4], g: -0.5, spin: [-0.6, 0.6], life: [1, 1.4], rate: 9, sec: { tex: ["twirl_soft.bmp"], tint: [160, 90, 255], add: 1, sz: [5, 8], z: [3, 9], vz: [1, 3], spin: [-4, 4], life: [0.6, 0.9], rate: 3 }, th: "smoke3.bmp", thf: "sepia(1) saturate(4) hue-rotate(220deg) brightness(.8)" },
  { anim: V69_TBALL, fps: 18, add: 1, sz: [5, 8], z: [2, 8], vz: [1, 4], life: [0.35, 0.6], rate: 12, sec: { tex: ["light_c.bmp", "light_d.bmp"], add: 1, sz: [9, 13], z: [0, 1], vz: [0, 0], life: [0.15, 0.25], rate: 3, low: 1 }, th: "thunder_ball_a.bmp" },
  { anim: V69_FIRE, fps: 30, tint: [120, 255, 170], add: 1, sz: [16, 22], z: [0, 2], vz: [3, 6], g: -2, life: [0.5, 0.8], rate: 12, sec: { tex: ["lord_blast_e_small.bmp"], add: 1, sz: [8, 12], z: [2, 8], vz: [1, 3], life: [0.6, 1], rate: 3 }, th: "devil_fire12.bmp", thf: "hue-rotate(110deg)", thz: 2.6 },
  { tex: ["cross_old.bmp"], sz: [4, 6], z: [8, 14], vz: [2, 4], g: -1, life: [1, 1.4], rate: 6, sec: { tex: ["pok3.tga"], tint: [255, 240, 170], add: 1, sz: [7, 10], z: [6, 14], vz: [1, 3], life: [0.5, 0.8], rate: 6 }, th: "cross_old.bmp" },
  { tex: ["fire_blast.bmp"], add: 1, sz: [6, 9], z: [0, 2], vz: [1, 3], life: [0.5, 0.8], rate: 10, low: 1, sec: { tex: ["meteo_comet_b.bmp"], add: 1, sz: [3, 4], z: [2, 6], vz: [6, 10], g: 30, spread: 8, spin: [-6, 6], life: [0.5, 0.8], rate: 4 }, th: "fire_blast.bmp" },
  { tex: ["smoke2.bmp"], al: 1, tint: [200, 40, 60], a: 0.65, sz: [8, 12], z: [0, 4], vz: [2, 4], g: -0.5, spin: [-0.6, 0.6], life: [1, 1.4], rate: 9, sec: { tex: ["puyan.bmp"], tint: [255, 80, 90], add: 1, sz: [5, 8], z: [2, 8], vz: [1, 4], life: [0.6, 0.9], rate: 4 }, th: "smoke2.bmp", thf: "sepia(1) saturate(6) hue-rotate(-30deg)" },
];
const V69T = { list: [], acc: 0, acc2: 0, x: 0, y: 0, t: 0, prev: new Map(), an: null };
function v69TrPart(cfg, x, y) {
  const a = Math.random() * Math.PI * 2,
    sp = cfg.spread || 2;
  return {
    cfg,
    x,
    y,
    z: v69Rf(cfg.z),
    vx: Math.cos(a) * sp * Math.random(),
    vy: Math.sin(a) * sp * 0.5 * Math.random(),
    vz: v69Rf(cfg.vz),
    rot: Math.random() * Math.PI * 2,
    spin: v69Rf(cfg.spin),
    sz: v69Rf(cfg.sz),
    life: v69Rf(cfg.life),
    t: 0,
    ph: Math.random() * 6,
    tex: cfg.tex ? cfg.tex[Math.floor(Math.random() * cfg.tex.length)] : null,
    f0: Math.floor(Math.random() * 8),
  };
}
function v69TrBurst(cfg, x, y, n) {
  for (let i = 0; i < n; i++) {
    const p = v69TrPart(cfg, x, y),
      a = Math.random() * Math.PI * 2,
      s = 10 + 16 * Math.random();
    p.vx = Math.cos(a) * s;
    p.vy = Math.sin(a) * s * 0.5;
    p.vz = Math.max(p.vz, 4 + 6 * Math.random());
    V69T.list.push(p);
    if (cfg.sec && i % 2 === 0) V69T.list.push(v69TrPart(cfg.sec, x + (Math.random() - 0.5) * 8, y));
  }
  if (V69T.list.length > 260) V69T.list.splice(0, V69T.list.length - 260);
}
function v69TrDraw(c, p) {
  const cfg = p.cfg,
    k = p.t / p.life,
    key = cfg.anim ? cfg.anim[(p.f0 + Math.floor(p.t * (cfg.fps || 12))) % cfg.anim.length] : p.tex,
    im0 = v69Tex(key, cfg.al);
  if (!im0) return;
  const im = cfg.tint ? roFxTint(im0, [...cfg.tint, 255]) : im0,
    iw = im.width,
    ih = im.height,
    m = p.sz / Math.max(iw, ih),
    fade = Math.min(1, k / 0.15) * (k > 0.6 ? Math.max(0, (1 - k) / 0.4) : 1),
    x = p.x + (cfg.sway ? Math.sin(p.ph + p.t * 3) * 2.5 : 0),
    y = p.y - p.z;
  c.save();
  c.globalAlpha = (cfg.a ?? 1) * fade;
  if (cfg.add) c.globalCompositeOperation = "lighter";
  c.translate(x, y);
  if (p.spin || cfg.spin) c.rotate(p.rot + p.spin * p.t);
  c.drawImage(im, (-iw * m) / 2, (-ih * m) / 2, iw * m, ih * m);
  c.restore();
}
function v69TrStep(dt) {
  const L = V69T.list;
  for (let i = L.length - 1; i >= 0; i--) {
    const p = L[i];
    p.t += dt;
    if (p.t >= p.life) {
      L.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 1 - Math.min(1, 2.5 * dt);
    p.vy *= 1 - Math.min(1, 2.5 * dt);
    p.z = Math.max(0, p.z + p.vz * dt);
    p.vz -= (p.cfg.g || 0) * dt;
  }
}
function v69TrailInstall() {
  drawTrail = function (c) {
    if (typeof TR !== "undefined") TR.lit = [];
    const now = performance.now() / 1000,
      dt = Math.min(0.1, V69T.t ? now - V69T.t : 0),
      p = G.pl,
      n = S.set.trail ?? -1,
      cfg = V69_TR[n] && TRAIL[n] && trailOn(n) ? V69_TR[n] : null;
    V69T.t = now;
    const mv = Math.hypot(p.x - V69T.x, p.y - V69T.y);
    V69T.x = p.x;
    V69T.y = p.y;
    const cur = new Map();
    for (const m of G.mobs) cur.set(m, [m.x, m.y]);
    if (cfg)
      for (const [m, pos] of V69T.prev)
        if (!cur.has(m) && m.hp <= 0 && Math.hypot(pos[0] - p.x, pos[1] - p.y) < 90) v69TrBurst(cfg, pos[0], pos[1] - 3, m.boss ? 16 : 7);
    V69T.prev = cur;
    if (!cfg) return void (V69T.list.length = 0);
    if (p.anim && p.anim !== V69T.an && !G.dead) {
      V69T.an = p.anim;
      v69TrBurst(cfg, p.x + 6 * Math.cos(p.face || 0), p.y - 2 + 3 * Math.sin(p.face || 0), 3);
    } else if (!p.anim) V69T.an = null;
    if (!G.dead && mv > 0.05 && mv < 20) {
      for (V69T.acc += cfg.rate * dt; V69T.acc >= 1; V69T.acc--) V69T.list.push(v69TrPart(cfg, p.x + (Math.random() - 0.5) * 8, p.y + (Math.random() - 0.5) * 4));
      if (cfg.sec) for (V69T.acc2 += cfg.sec.rate * dt; V69T.acc2 >= 1; V69T.acc2--) V69T.list.push(v69TrPart(cfg.sec, p.x + (Math.random() - 0.5) * 10, p.y + (Math.random() - 0.5) * 4));
    }
    v69TrStep(dt);
    for (const q of V69T.list) if (q.cfg.low || q.z < 5) v69TrDraw(c, q);
  };
}

// 擊中／擊殺：只播 RO 技能動畫；靈魂擊、冥界之門以 RO 特效貼圖組成
function v69Soul(c, x, y, t, s = 1) {
  const d = 0.5;
  if (t < 0 || t > d) return;
  const k = t / d,
    orb = v69Tex("round_kirakira.bmp"),
    fl = v69Tex("pok1.tga");
  c.save();
  c.globalCompositeOperation = "lighter";
  if (orb) {
    const im = roFxTint(orb, [200, 170, 255, 255]);
    for (let i = 0; i < 3; i++) {
      const a = i * 2.094 + k * 5,
        r = 18 * s * Math.max(0, 1 - k * 1.6),
        w = 10 * s;
      c.globalAlpha = Math.min(1, (1 - k) * 1.6);
      c.drawImage(im, x + Math.cos(a) * r - w / 2, y + Math.sin(a) * r * 0.6 - w / 2, w, w);
    }
  }
  if (fl && k > 0.45) {
    const q = (k - 0.45) / 0.55,
      w = (10 + 20 * q) * s;
    c.globalAlpha = 1 - q;
    c.drawImage(roFxTint(fl, [190, 160, 255, 255]), x - w / 2, y - w / 2, w, w);
  }
  c.restore();
}
function v69Gate(c, x, y, t, s = 1) {
  const d = 1.3;
  if (t < 0 || t > d) return;
  const k = t / d,
    tw = v69Tex("twirl_soft.bmp", 1),
    sm = v69Tex("smoke3.bmp", 1),
    gh = v69Tex("storm_god.bmp"),
    grow = Math.min(1, k / 0.25) * (k > 0.75 ? (1 - k) / 0.25 : 1);
  c.save();
  if (tw) {
    const w = 30 * s * grow;
    c.save();
    c.translate(x, y);
    c.scale(1, 0.5);
    c.rotate(-t * 6);
    c.globalAlpha = 0.85 * grow;
    c.drawImage(roFxTint(tw, [110, 50, 170, 255]), -w / 2, -w / 2, w, w);
    c.globalCompositeOperation = "lighter";
    c.globalAlpha = 0.5 * grow;
    c.drawImage(roFxTint(tw, [170, 90, 255, 255]), -w / 3, -w / 3, (w * 2) / 3, (w * 2) / 3);
    c.restore();
  }
  if (sm)
    for (let i = 0; i < 4; i++) {
      const a = i * 1.57 + t * 1.5,
        w = (12 + 6 * k) * s;
      c.globalAlpha = 0.5 * grow;
      c.drawImage(roFxTint(sm, [80, 40, 120, 255]), x + Math.cos(a) * 9 * s - w / 2, y + Math.sin(a) * 4 * s - w / 2 - 4 * s * k, w, w);
    }
  if (gh && k > 0.15) {
    const q = (k - 0.15) / 0.85,
      w = 20 * s;
    c.globalCompositeOperation = "lighter";
    c.globalAlpha = 0.75 * Math.sin(Math.PI * q);
    c.drawImage(roFxTint(gh, [200, 170, 255, 255]), x - w / 2, y - w * 0.9 - 18 * s * q, w, w);
  }
  c.restore();
}
function v69GodFxInstall() {
  let last = -9;
  gfHit = function (t, a, x, y) {
    if (t !== GF || !G || !G.pl) return;
    if (G.t - last < 0.12) return;
    last = G.t;
    if (a === 2) ((G.v69fx ||= []).push({ k: "soul", x, y, t0: G.t }), G.v69fx.length > 24 && G.v69fx.shift());
    else
      try {
        roFxAdd("v6gh" + a, x, y, { area: 0.55 });
      } catch (e) {}
  };
  gfKill = function (t, a, m) {
    if (t !== GF || !G || !G.pl || !m) return;
    const area = m.boss ? 1.2 : m.elite ? 0.9 : 0.7;
    try {
      roFxAdd("v6gk" + a, m.x, m.y - (a === 1 ? 0 : (m.h || 10) * 0.4), { area });
    } catch (e) {}
    if (a === 2) ((G.v69fx ||= []).push({ k: "gate", x: m.x, y: m.y - 2, t0: G.t, s: area / 0.7 }), G.v69fx.length > 24 && G.v69fx.shift());
  };
  const ft = drawFxTop;
  drawFxTop = function (c, ...x) {
    const r = ft.call(this, c, ...x);
    try {
      for (const q of V69T.list) if (!(q.cfg.low || q.z < 5)) v69TrDraw(c, q);
      if (G.v69fx?.length) {
        G.v69fx = G.v69fx.filter((e) => G.t - e.t0 < (e.k === "gate" ? 1.3 : 0.5));
        for (const e of G.v69fx) e.k === "soul" ? v69Soul(c, e.x, e.y, G.t - e.t0) : v69Gate(c, e.x, e.y, G.t - e.t0, e.s || 1);
      }
    } catch (e) {}
    return r;
  };
}

// 預覽：RO 地圖地面、目前職業的 RO 角色，對 RO 波利播放特效
const V69P = { cv: null, g: 0, k: "h", t0: 0, raf: 0, ev: [], last: -1 };
const V69_PS = 2.4; // 預覽倍率（世界單位 → 預覽像素）
function v69PrevStr(c, name, t, x, y, area) {
  const d = typeof roFxNative === "function" && roFxNative(name);
  if (d) roDrawStr(c, d, t, { x, y, area });
}
const V69_GSTR = { h: [["windhit1"], ["freeze"], null], k: [["lightning", "windhit1"], ["stormgust"], ["hell_in"]] };
function v69PrevLoop(now) {
  const P = V69P,
    cv = P.cv;
  if (!cv || !cv.isConnected) return void ((P.raf = 0), (P.cv = null));
  P.raf = requestAnimationFrame(v69PrevLoop);
  const c = cv.getContext("2d"),
    W = cv.width,
    H = cv.height,
    S2 = V69_PS,
    t = now / 1000 - P.t0,
    kill = P.k === "k",
    per = kill ? 2.8 : 1.4,
    cyc = Math.floor(t / per),
    ph = t - cyc * per,
    hitAt = kill ? 0.9 : 0.35;
  if (cyc !== P.last && ph >= hitAt) {
    P.last = cyc;
    P.ev.push({ t0: t });
    if (P.ev.length > 4) P.ev.shift();
  }
  // 地面
  c.save();
  c.fillStyle = "#1b1424";
  c.fillRect(0, 0, W, H);
  try {
    const th = roMapThemes[S.map] || "grass",
      def = RO.assets.maps?.[th],
      im = def && roImage(def.decoratedFile || def.file);
    if (im) {
      const sw = Math.min(im.width, 480),
        sh = sw / 2;
      c.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, 0, 0, W, H);
    }
  } catch (e) {}
  const vg = c.createRadialGradient(W / 2, H * 0.6, H * 0.2, W / 2, H * 0.6, W * 0.7);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(10,6,18,.55)");
  c.fillStyle = vg;
  c.fillRect(0, 0, W, H);
  const hx = W * 0.28,
    hy = H * 0.8,
    mx = W * 0.7,
    my = H * 0.8,
    ty = my - 9 * S2;
  // 地面類特效（暴風雪）
  for (const e of P.ev) {
    const tt = t - e.t0;
    if (kill && P.g === 1) v69PrevStr(c, "stormgust", tt, mx, my, 0.42 * S2);
  }
  // 角色
  try {
    const st = RO.assets.characters?.[roClass[S.cls].sprite]?.states;
    if (st) {
      const atk = ph >= hitAt - 0.3 && ph < hitAt + 0.05;
      roFrame(c, roFacingFrame(st, atk ? "attack" : "idle", 6), hx, hy, 0.28 * S2, t, false, atk ? (ph - (hitAt - 0.3)) / 0.35 : null);
    }
  } catch (e) {}
  // 波利
  const dead = kill && ph >= hitAt;
  try {
    const ms = RO.assets.monsters?.poring?.states;
    if (ms) {
      const fadeIn = kill ? Math.min(1, ph / 0.3) : 1,
        fadeOut = dead ? Math.max(0, 1 - (ph - hitAt) / 0.3) : 1,
        a = fadeIn * fadeOut;
      if (a > 0) {
        c.save();
        c.globalAlpha = a;
        roFrame(c, roFacingFrame(ms, "idle", 2), mx, my, 0.3 * S2, t);
        const fl = P.ev.length && t - P.ev[P.ev.length - 1].t0 < 0.12 && !dead;
        if (fl) {
          c.globalCompositeOperation = "lighter";
          c.globalAlpha = 0.5;
          roFrame(c, roFacingFrame(ms, "idle", 2), mx, my, 0.3 * S2, t);
        }
        c.restore();
      }
    }
  } catch (e) {}
  // 擊中／擊殺特效
  for (const e of P.ev) {
    const tt = t - e.t0,
      list = V69_GSTR[kill ? "k" : "h"][P.g];
    if (!kill && P.g === 2) v69Soul(c, mx, ty, tt, S2);
    else if (kill && P.g === 2) {
      v69PrevStr(c, "hell_in", tt, mx, ty, 0.7 * S2);
      v69Gate(c, mx, my - 2 * S2, tt, S2);
    } else if (list) for (const n of list) if (!(kill && n === "stormgust")) v69PrevStr(c, n, tt, mx, kill && P.g === 1 ? my : ty, (kill ? 0.7 : 0.55) * S2);
  }
  c.restore();
}
function v69PrevInstall() {
  gfPrev = function (cv, a, s = "hk") {
    if (!cv) return;
    cv.width = 288;
    cv.height = 144;
    cv.style.imageRendering = "auto";
    Object.assign(V69P, { cv, g: a, k: s === "k" ? "k" : "h", t0: performance.now() / 1000, ev: [], last: -1 });
    if (!V69P.raf) V69P.raf = requestAnimationFrame(v69PrevLoop);
  };
}

// 選單縮圖
const V69_GTH = { h: [["thunder_ball_a.bmp"], ["freeze_ice.bmp"], ["round_kirakira.bmp", "hue-rotate(230deg) saturate(1.4)"]], k: [["light_c.bmp"], ["freeze_ice_part.bmp"], ["storm_god.bmp", "hue-rotate(40deg)"]] };
const v69Th = (key, f, z) => {
  const st = [f ? `filter:${f}` : "", z ? `transform:scale(${z})` : ""].filter(Boolean).join(";");
  return `<span class="v69tw"><img class="v69th" src="${v69TexUrl(key)}" alt=""${st ? ` style="${st}"` : ""}></span>`;
};
function v69MenuInstall() {
  const mf = ui.m_fx;
  ui.m_fx = function (...a) {
    let h = mf.apply(this, a);
    h = h.replace(/(data-k="(trail|hfx|kfx)" data-v="(\d+)"[^>]*><span class="fxsw">)([\s\S]*?)(<\/span><span class="fxn">)/g, (m, pre, k, v, inner, post) => {
      const i = +v;
      if (k === "trail") {
        const cfg = V69_TR[i];
        return cfg ? pre + v69Th(cfg.th, cfg.thf, cfg.thz) + post : m;
      }
      const g = V69_GTH[k === "kfx" ? "k" : "h"][i];
      return g ? pre + v69Th(g[0], g[1]) + post : m;
    });
    return h;
  };
  if (HELP.fx) {
    const r = HELP.fx[1].find((x) => x[0] === "RO 屬性");
    const txt = "拖尾依 RO 屬性命名，粒子使用 RO 原版特效貼圖（天使之羽、泡泡、金幣、惡魔火焰、十字、雷球、冰晶…）；擊中與擊殺特效播放 RO 原版技能動畫（雷擊、冰晶、靈魂擊、怒雷、暴風雪、冥界之門），預覽以 RO 角色對波利示範。";
    if (r) r[1] = txt;
    else HELP.fx[1].unshift(["RO 屬性", txt]);
  }
  if (typeof document !== "undefined" && !document.getElementById("v69css")) {
    const st = document.createElement("style");
    st.id = "v69css";
    st.textContent = ".v69tw{display:block;width:24px;height:24px;overflow:hidden;background:#000;border-radius:3px;box-shadow:0 0 0 1px #1b1424}.fxsw img.v69th{display:block;width:24px;height:24px;image-rendering:auto;object-fit:contain}.fxsw:has(.v69tw){height:24px}.gfpv{image-rendering:auto}";
    document.head.appendChild(st);
  }
}

// ---------------------------------------------------------------------------
// 6. 主宰的鐵拳、獸人酋長之戒原本沒有對應的 RO 圖示（顯示成礦石），改用 RO 道具圖示
function v69MyIconInstall() {
  if (typeof roItemFiles === "undefined") return;
  roItemFiles.myFist = 1801; // 拳刃（Waghnakh）
  roItemFiles.myHH = 2611; // 銀戒指
  if (typeof Image !== "undefined")
    for (const id of [1801, 2611]) {
      const src = roItemIcon(id);
      if (RO.images[src] || src.startsWith("data:")) continue;
      const im = new Image();
      im.onload = () => (RO.images[src] = im);
      im.src = src;
    }
}
function v69Install() {
  v69AlphaLoad();
  v69MyIconInstall();
  v69BlessInstall();
  v69MythInsInstall();
  v69TrailInstall();
  v69GodFxInstall();
  v69PrevInstall();
  v69MenuInstall();
}
if (typeof roV4Install === "function") {
  const r4v69 = roV4Install;
  roV4Install = function () {
    r4v69();
    v69Install();
  };
}
