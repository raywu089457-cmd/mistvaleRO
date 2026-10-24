/* 流浪仙境 v8.0：深淵大量菁英連射時的卡頓優化、角色資訊數值最多顯示小數點後 3 位、基本素質「?」說明 */

// ---------------------------------------------------------------------------
// 1. 怪物子彈繪製優化
//    原本每顆怪物子彈畫 3 段尾跡＋光暈（4～5 次加亮貼圖），菁英多時同屏數百顆子彈，每幀上千次貼圖，畫面明顯卡頓。
//    改為依「屬性・貼圖影格・飛行方向（16 向）・旋轉角度」預先合成好的快取圖，每顆子彈只畫 1 次；外觀維持原本的屬性貼圖、
//    尾跡與光暈。同時超過 120 顆時自動省略尾跡。子彈的屬性在第一次繪製時記下，不再每幀重算。
const V80_SHOT = { lod: 120, dirs: 16, spins: 8, rs: 2, cap: 900, cache: new Map(), q: [] };
function v80ShotSprite(cfg, key, tint, angB, spinB, lod) {
  const id = `${key}|${tint || ""}|${angB}|${spinB}|${lod ? 1 : 0}`;
  const C = V80_SHOT.cache;
  let sp = C.get(id);
  if (sp) return sp;
  const im0 = v69Tex(key, cfg.al);
  if (!im0 || !(im0.width || im0.naturalWidth)) return null;
  const im = tint ? roFxTint(im0, [...tint, 255]) : im0,
    m = cfg.sz / Math.max(im.width, im.height),
    w = im.width * m,
    h = im.height * m,
    ang = (angB * Math.PI * 2) / V80_SHOT.dirs,
    half = Math.ceil(Math.hypot(w, h) / 2 + 5.5),
    RS = V80_SHOT.rs,
    cv = document.createElement("canvas");
  cv.width = cv.height = half * 2 * RS;
  const c = cv.getContext("2d");
  c.scale(RS, RS);
  for (let i = lod ? 0 : 2; i >= 0; i--) {
    const k = i * 2.2;
    c.save();
    c.globalAlpha = i ? 0.22 / i : 0.95;
    if (cfg.add) c.globalCompositeOperation = "lighter";
    c.translate(half - Math.cos(ang) * k, half - Math.sin(ang) * k);
    if (cfg.rot) c.rotate(ang);
    else if (cfg.spin) c.rotate((spinB * Math.PI * 2) / V80_SHOT.spins);
    const s = i ? 1 - 0.18 * i : 1;
    c.drawImage(im, (-w * s) / 2, (-h * s) / 2, w * s, h * s);
    c.restore();
  }
  if (cfg.glow && !lod) {
    const g = v69Tex("pok1.tga");
    if (g) {
      c.globalCompositeOperation = "lighter";
      c.globalAlpha = 0.6;
      c.drawImage(roFxTint(g, [...cfg.glow, 255]), half - w * 0.45, half - h * 0.45, w * 0.9, h * 0.9);
    }
  }
  sp = { cv, half };
  C.set(id, sp);
  if (C.size > V80_SHOT.cap) C.delete(C.keys().next().value);
  return sp;
}
function v80DrawShots(c, list) {
  const lod = list.length > V80_SHOT.lod,
    tau = Math.PI * 2,
    add = [],
    norm = [];
  for (const p of list) {
    const el = p.v80el || (p.v80el = typeof v5MobEl === "function" && p.src ? v5MobEl(p.src) : "neutral"),
      cfg = V71_SHOT[el] || V71_SHOT.neutral,
      ang = Math.atan2(p.vy || (p.tgt ? p.tgt.y - p.y : 0), p.vx || (p.tgt ? p.tgt.x - p.x : 1)),
      key = cfg.anim ? cfg.anim[Math.floor(G.t * 18) % cfg.anim.length] : cfg.tex[0],
      tint = cfg.tint || (el === "neutral" ? (p.v80tn ??= v71Hex(p.col)) : null),
      angB = ((Math.round(ang / (tau / V80_SHOT.dirs)) % V80_SHOT.dirs) + V80_SHOT.dirs) % V80_SHOT.dirs,
      spinB = cfg.spin && !cfg.rot ? Math.floor((((G.t * cfg.spin) % tau) + tau) % tau / (tau / V80_SHOT.spins)) % V80_SHOT.spins : 0,
      sp = v80ShotSprite(cfg, key, tint, angB, spinB, lod);
    if (sp) (cfg.add ? add : norm).push([sp, p.x, p.y]);
  }
  if (!add.length && !norm.length) return;
  c.save();
  c.globalAlpha = 1;
  for (const [sp, x, y] of norm) c.drawImage(sp.cv, x - sp.half, y - sp.half, sp.half * 2, sp.half * 2);
  c.globalCompositeOperation = "lighter";
  for (const [sp, x, y] of add) c.drawImage(sp.cv, x - sp.half, y - sp.half, sp.half * 2, sp.half * 2);
  c.restore();
}
// 2. 黑暗地圖（深淵等）的光照：每顆子彈原本各畫 3 個光圈；怪物子彈的光源改為最多 24 個（離角色最近的）
const V80_LIGHT = { enemyMax: 24 };
function v80PerfInstall() {
  if (typeof v71ShotDraw !== "function" || typeof V71_SHOT === "undefined") return;
  // v7.1 的子彈繪製改為先排隊，整批在特效層畫完後一次畫出
  const orig = v71ShotDraw;
  v71ShotDraw = function (c, p) {
    if (V80_SHOT.off) return orig.call(this, c, p);
    V80_SHOT.q.push(p);
    return true;
  };
  const ft = drawFxTop;
  drawFxTop = function (c, ...a) {
    V80_SHOT.q.length = 0;
    const r = ft.call(this, c, ...a);
    if (V80_SHOT.q.length)
      try {
        v80DrawShots(c, V80_SHOT.q);
      } catch (e) {}
    V80_SHOT.q.length = 0;
    return r;
  };
  const dl = drawLighting;
  drawLighting = function (c, ...a) {
    const all = G.proj;
    if (V80_SHOT.off || !all || all.length <= V80_LIGHT.enemyMax) return dl.call(this, c, ...a);
    let n = 0;
    for (const q of all) if (q.enemy) n++;
    if (n <= V80_LIGHT.enemyMax) return dl.call(this, c, ...a);
    const p = G.pl,
      en = all.filter((q) => q.enemy);
    en.sort((u, v) => (u.x - p.x) ** 2 + (u.y - p.y) ** 2 - ((v.x - p.x) ** 2 + (v.y - p.y) ** 2));
    const keep = new Set(en.slice(0, V80_LIGHT.enemyMax));
    G.proj = all.filter((q) => !q.enemy || keep.has(q));
    try {
      return dl.call(this, c, ...a);
    } finally {
      G.proj = all;
    }
  };
}

// ---------------------------------------------------------------------------
// 3. 角色資訊：數值最多顯示到小數點後 3 位（例：技能傷害 +192.52599999999998% → +192.526%）
const v80Dec = (h) => (typeof h === "string" ? h.replace(/\d+\.\d{4,}/g, (m) => String(+(+m).toFixed(3))) : h);
function v80DecInstall() {
  for (const k of ["p_char", "charStats", "ascHtml"]) {
    const f = ui[k];
    if (typeof f !== "function") continue;
    ui[k] = function (...a) {
      return v80Dec(f.apply(this, a));
    };
  }
  if (typeof roStatsHTML === "function") {
    const rs = roStatsHTML;
    roStatsHTML = (...a) => v80Dec(rs(...a));
  }
}

// ---------------------------------------------------------------------------
// 4. 基本素質旁的「?」：每項能力值每點的效果、目前總值與合計加成
const v80Num = (v) => String(+(+v).toFixed(2));
function v80StatHelp() {
  if (typeof V79_STAT === "undefined") return;
  const tot = typeof v79StatTotals === "function" ? v79StatTotals() : (S?.roStats || [0, 0, 0, 0, 0, 0]),
    N = { adddmg: "攻擊（加在武器攻擊上，所有技能的傷害都以武器攻擊計算）", dmg: "總傷害額外", life: "生命", lifeM: "最大生命額外", aspd: "攻擊速度", eva: "閃避值", crit: "暴擊率", critm: "暴擊傷害", skill: "技能傷害", skillM: "技能傷害額外", cdr: "冷卻縮減" },
    nm = (k, x) => (x ? N[k + "M"] || N[k] : N[k]),
    pct = (k, x) => !["adddmg", "eva"].includes(k) && !(k === "life" && !x),
    rows = roStats.map(([en, n], i) => {
      const t = Math.round(tot[i] || 0),
        tree = S?.roStats?.[i] || 0,
        per = V79_STAT[i].map(([k, v, x]) => `${nm(k, x).replace(/（.*）/, "")} +${v}${pct(k, x) ? "%" : ""}`).join("、"),
        sum = V79_STAT[i].map(([k, v, x]) => `${nm(k, x).replace(/（.*）/, "")} +${v80Num(v * (tot[i] || 0))}${pct(k, x) ? "%" : ""}`).join("、");
      return [`${n}（${en}）目前 ${t}`, `每 1 點：${per}。目前合計：${sum}（天賦樹 ${tree}${t - tree ? `＋裝備與卡片 ${t - tree}` : ""}）。`];
    });
  HELP.v80stat = [
    "基本素質",
    [
      ...rows,
      ["來源", "共用天賦樹的素質節點、裝備上的能力值（含新掉落防具飾品的隨機能力值）、卡片上的能力值，三者合計後換算。角色頁括號內是裝備與卡片提供的部分。"],
      ["額外加成", "標示「額外」的是乘算：例如總傷害額外 +8% 會讓最後的傷害 ×1.08，不會被其他「傷害增加」稀釋。攻擊則是加在武器攻擊上，所有技能的傷害都以武器攻擊計算。"],
      ["職業天賦", "部分職業天賦寫著「每 1 點力量…」等，依同一個能力值總數另外計算；超過 40 點的部分以一半計算。"],
    ],
  ];
}
function v80StatBtnInstall() {
  if (typeof roStatsHTML !== "function") return;
  const rs = roStatsHTML;
  roStatsHTML = (...a) => {
    try {
      v80StatHelp();
    } catch (e) {}
    const h = rs(...a);
    return typeof h === "string" ? h.replace("<b>基本素質 · 共用天賦</b>", `<b>基本素質 · 共用天賦</b>${helpBtn("v80stat")}`) : h;
  };
  v80StatHelp();
}

// ---------------------------------------------------------------------------
function v80Install() {
  v80PerfInstall();
  v80StatBtnInstall();
  v80DecInstall();
}
if (typeof roV4Install === "function") {
  const r4v80 = roV4Install;
  roV4Install = function () {
    r4v80();
    v80Install();
  };
}
