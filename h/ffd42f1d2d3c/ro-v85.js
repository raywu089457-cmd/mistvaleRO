/* 流浪仙境 v8.5：職業新技能第 2 批（劍士：十字軍線；弓箭手：獵人線、詩人線）—— 三轉、四轉新增 RO 原作的主動與輔助技能
   另外修正：v8.3／v8.4 新技能的圖示沒有登錄，顯示成預設圖示 */

// ---------------------------------------------------------------------------
// 0. 技能圖示登錄（RO 原版技能圖示，assets/ro-v3/skills/<id>.png；沒登錄的會被換成預設圖示）
(() => {
  const A = typeof window !== "undefined" && window.RO_ASSETS;
  if (!A) return;
  A.skills ||= {};
  for (const id of [
    // v8.3／v8.4 法師
    365, 2213, 2211, 482, 405, 2447, 2446, 2449, 364, 2230, 403, 2445, "v83_400",
    // v8.5 劍士、弓箭手
    480, 367, 369, 2307, 2321, 2315, 380, 381, 383, 394, 489, 488, 2418, 2413, 2426, 2236,
  ])
    A.skills[id] ||= { file: `skills/${id}.png`, width: 24, height: 24 };
  // 部分 RO 特效用黑底貼圖（原版以相加混色顯示）：這些圖層改成相加混色，避免畫出黑色方塊
  const E = A.effects?.str || {},
    BLACK = ["target1.bmp", "target2.bmp", "target3.bmp", "shield.bmp"];
  for (const n of ["homing", "shield_charge", "melt"])
    for (const L of E[n]?.data?.layers || [])
      if ((L.textures || []).some((t) => BLACK.includes(String(t).toLowerCase())))
        for (const k of L.animations || []) if (k.srcalpha === 2 && k.destalpha === 1) k.destalpha = 2;
})();

// ---------------------------------------------------------------------------
// 1. 技能表（在 v6 技能登錄前加入）
//    「三轉」對應 RO 進階二轉（聖殿十字軍、神射手、搞笑藝人），「四轉」對應 RO 三轉（皇家禁衛隊、宮廷樂師）
//    id, 職業, 名稱, 招式, 傷害, 冷卻, 標籤, 屬性, 異常, RO 圖示, 形狀, 說明
const V85_ACT = [
  // 十字軍線
  ["sw_schain", "sword", "盾牌連擊", "schain", 1.1, 4, ["proj"], "neutral", null, 480, "L3", "擲出盾牌在敵人之間彈跳 5 次，每次造成 {hit}% 武器傷害（每 100 護甲傷害 +2%，最多 +200%）；每彈跳一次額外累積 4 點極限槽。只有一名敵人時會在牠身上反覆彈跳。"],
  ["sw_pressure", "sword", "壓迫", "pressure", 5.5, 4.5, ["spell", "holy"], "holy", null, 367, "I2", "以神聖之力壓制單一目標，造成 {hit}% 武器傷害，無視敵人的減傷與護盾；並額外造成目標目前生命 5% 的傷害（菁英 3%、頭目 1%，最多為本次傷害的 1.5 倍）。"],
  ["sw_cspear", "sword", "加農長矛", "cspear", 3.4, 4, ["aoe"], "neutral", null, 2307, "I3", "朝目標方向擲出長矛，貫穿直線上所有敵人造成 {hit}% 武器傷害並推開；離你越遠傷害越高（最遠處 ×2）。"],
  ["sw_genesis", "sword", "創世之光", "genesis", 0.9, 7, ["aoe", "spell", "holy"], "holy", null, 2321, "P5", "在目標身上降下追著目標移動的聖光柱 3 秒，每 0.3 秒對光柱範圍內的敵人造成 {hit}% 武器傷害並致盲 3 秒（致盲的敵人攻擊有 50% 機率落空）；技能擊中致盲的敵人時，極限槽累積 ×2。"],
  // 獵人線
  ["bw_fassault", "bow", "獵鷹強襲", "fassault", 3.6, 5, [], "wind", null, 381, "L3", "獵鷹俯衝目標，造成 {hit}% 武器傷害並標記 5 秒：期間普通攻擊命中被標記的敵人時，獵鷹追擊 1 次（本技能傷害的 20%，每 0.35 秒最多 1 次）；以強化射擊（每第 4 次技能）施放時，獵鷹再連續追擊 3 次。"],
  ["bw_sight", "bow", "真實之眼", "sight", 0, 14, ["spell"], "neutral", null, 380, "I2", "開啟真實之眼 8 秒：暴擊率 +15%，專注距離加成固定為最大（不論距離都視為最遠）。"],
  // 詩人線
  ["bw_avulcan", "bow", "火神連矢", "avulcan", 0.5, 6, ["proj"], "neutral", null, 394, "L3", "1.5 秒內朝附近的敵人連續射出 12 支箭（射擊時仍可移動），每支造成 {hit}% 武器傷害；每支箭都算作 1 次普通攻擊，會累積「第四箭」等普通攻擊次數（由第四箭額外施放時只射 6 支）。"],
  ["bw_tarot", "bow", "命運的塔羅牌", "tarot", 4.5, 5, ["proj"], "neutral", null, 489, "O4", "擲出塔羅牌造成 {hit}% 武器傷害，並隨機翻出一張牌：戰車（傷害 ×2.5）、高塔（追加目標最大生命 3%，菁英 1%、頭目 0.3%）、星星（目標與周圍敵人暈眩 2 秒）、倒吊人（凍結 3 秒，期間受到傷害 +30%）、死神（8 秒內每秒受到 20% 傷害）、惡魔（6 秒內對你的傷害 −50%）、太陽（以目標為中心爆炸）、戀人（你回復 12% 最大生命）、命運之輪（再抽 2 張）。多重投射時額外的牌飛向附近其他敵人（沒有其他敵人時以 50% 傷害打同一目標）。"],
  ["bw_rainstorm", "bow", "猛烈暴風雨", "rainstorm", 0.5, 6, ["aoe", "proj"], "neutral", null, 2418, "T4", "在自身周圍降下持續 3 秒、跟著你移動的箭雨，每 0.25 秒對範圍內的敵人造成 {hit}% 武器傷害。"],
  ["bw_metal", "bow", "金屬之聲", "metal", 8.0, 5, ["spell"], "neutral", null, 2413, "I3", "對目標發出刺耳的金屬聲波，造成 {hit}% 武器傷害並沉默 2 秒（無法施放頭目招式與菁英技能，一般怪物停止攻擊；頭目 1 秒）；對暈眩、凍結、沉默中的敵人傷害 +50%。"],
];
//    id, 職業, 名稱, 需求標籤, RO 圖示, 形狀, 說明
const V85_SUP = [
  ["sw_gospel", "sword", "聖歌", null, 369, "L3", "相鄰的主動技能施放時，隨機獲得兩種不同的聖歌祝福 8 秒：傷害 +25%／攻擊速度 +20%／受到傷害 −20%／每秒回復 2% 生命／暴擊率 +20%（不同祝福可同時存在，每 2 秒最多觸發 1 次）。"],
  ["sw_shspell", "sword", "盾牌魔法", null, 2315, "I2", "相鄰的主動技能傷害增加：每 100 護甲 +3%（最多 +60%）；施放時獲得 2% 最大生命的護盾（此方式最多累積到 10%）。"],
  ["bw_wwalk", "bow", "風之疾走", null, 383, "I2", "相鄰技能對距離 35 以上的敵人傷害 +30%；施放後 3 秒內移動速度 +30%。"],
  ["bw_hermode", "bow", "赫爾莫德之杖", null, 488, "L3", "相鄰的主動技能施放時，獲得 3% 最大生命的護盾（此方式最多累積到 15%）。"],
  ["bw_gecho", "bow", "巨大回音", null, 2426, "I2", "相鄰技能每次命中敵人，攻擊速度 +3%，持續 5 秒（最多 10 層 +30%，每 0.2 秒最多疊 1 層）。"],
];
// 商店：依職業線與職階開放（V81_TIER[職業][職業線][0 一轉起／1 三轉後／2 四轉後]）
const V85_TIER = {
  sword: [
    [[], [], []],
    [[], ["sw_schain", "sw_pressure", "sw_gospel"], ["sw_cspear", "sw_genesis", "sw_shspell"]],
  ],
  bow: [
    [[], ["bw_fassault", "bw_sight", "bw_wwalk"], []],
    [[], ["bw_avulcan", "bw_tarot", "bw_hermode"], ["bw_rainstorm", "bw_metal", "bw_gecho"]],
  ],
};
if (typeof V6_ACT !== "undefined" && typeof V6_SUP !== "undefined" && typeof V6_CLASS !== "undefined") {
  for (const r of V85_ACT) {
    V6_ACT.push(r);
    V6_CLASS[r[1]].act.push(r[0]);
    if (typeof V6_JOB !== "undefined") V6_JOB[r[0]] = []; // 不屬於任何流派：只依職階開放
  }
  for (const r of V85_SUP) {
    V6_SUP.push(r);
    V6_CLASS[r[1]].sup.push(r[0]);
    if (typeof V6_JOB !== "undefined") V6_JOB[r[0]] = [];
  }
  if (typeof V81_TIER !== "undefined")
    for (const [cls, lines] of Object.entries(V85_TIER)) lines.forEach((L, li) => L.forEach((ids, t) => V81_TIER[cls][li][t].push(...ids)));
}

// ---------------------------------------------------------------------------
// 2. 共用狀態與小工具
const V85 = { sight: 0, gos: {}, gosT: 0, ww: 0, echo: { n: 0, t: 0, last: 0 }, blCast: 0, fal: null, lk: new Map(), lkT: -1, img: {} };
// 擊中來源的技能有沒有連結某個輔助（同一格畫面內快取）
function v85Lk(o, sup) {
  if (!o || !o.skill || typeof v83SkillOf !== "function") return false;
  const id = v83SkillOf(o);
  if (!id) return false;
  if (V85.lkT !== G.t) (V85.lk = new Map()), (V85.lkT = G.t);
  const key = id + "|" + sup;
  let v = V85.lk.get(key);
  if (v === undefined) {
    v = placed().some((g) => g.id === id && v6Linked(g, sup));
    V85.lk.set(key, v);
  }
  return v;
}
const v85Arm = () => Math.max(0, PS?.armor || 0);
const v85Img = (f) => {
  if (V85.img[f] !== undefined || typeof Image === "undefined") return V85.img[f] || null;
  V85.img[f] = null;
  const im = new Image();
  im.onload = () => (V85.img[f] = im);
  im.src = (typeof RO !== "undefined" && RO.root ? RO.root : "assets/ro-v3/") + "effects/textures/" + f;
  return null;
};
// 控制中（暈眩、凍結、沉默）
const v85Ctl = (m) => !!m && (m.v6stun > G.t || m.stn > 0 || m.frz > 0 || m.v85sil > G.t);
// 盾牌類護盾：只補到上限，不會壓低其他來源給的護盾
function v85Shield(pct, cap) {
  const p = G.pl;
  if (!p || !PS) return;
  const c = PS.maxhp * cap;
  if ((p.shd || 0) < c) addShd(PS.maxhp * pct, c);
}
// 沉默
function v85Silence(m, d) {
  if (!alive(m)) return;
  if (m.boss) {
    if (m.v85silCd > G.t) return;
    d = Math.min(d, 1);
    m.v85silCd = G.t + d + 4;
  } else if (m.elite) d *= 0.75;
  m.v85sil = Math.max(m.v85sil || 0, G.t + d);
  if (!m.boss) m.atk = Math.max(m.atk || 0, d);
  num(m.x, m.y - (m.h || 12) - 10, "沉默", "#c8d0ff");
}
// 致盲
function v85Blind(m, d) {
  if (!alive(m)) return;
  if (!(m.v85blind > G.t)) burst(m.x, m.y - (m.h || 12) * 0.8, 4, ["#fff6c8", "#ffffff"], 40, { z: 4 });
  m.v85blind = Math.max(m.v85blind || 0, G.t + d * (m.boss ? 0.5 : 1));
}

// ---------------------------------------------------------------------------
// 3. 招式
function v85Moves() {
  Object.assign(V6_CAST, {
    // 盾牌連擊：在敵人之間彈跳 5 次
    schain(c) {
      if (!v6Need(c)) return false;
      const { p } = c;
      setFace(c.ang);
      p.anim = { k: "cast", t: 0, dur: 0.3, a: c.ang };
      const k = c.hit * c.r * (1 + Math.min(2, (0.02 * v85Arm()) / 100)),
        hops = 5 + (c.m.proj || 0),
        [hx, hy] = handPos();
      let tgt = c.tgt,
        n = 0,
        prev = null;
      v6Ent({
        life: 4,
        x: hx,
        y: hy,
        upd: (e, dt) => {
          if (e.back) {
            const dx = G.pl.x - e.x,
              dy = G.pl.y - 6 - e.y,
              d = Math.hypot(dx, dy) || 1,
              v = 300 * dt;
            if (d <= v) e.t = e.life;
            else (e.x += (dx / d) * v), (e.y += (dy / d) * v);
            return;
          }
          if (!alive(tgt)) {
            tgt = v6Near(e.x, e.y, 70).find((m) => m !== prev) || v6Near(e.x, e.y, 70)[0];
            if (!tgt) return void (e.back = 1);
          }
          const dx = tgt.x - e.x,
            dy = tgt.y - 5 - e.y,
            d = Math.hypot(dx, dy) || 1,
            v = 280 * dt;
          if (d > v + 4) return void ((e.x += (dx / d) * v), (e.y += (dy / d) * v));
          v6Hit(tgt, k, c.o, { kb: 30, sx: e.x, sy: e.y });
          v6LimAdd(4);
          v6Ro("sw_schain", tgt.x, tgt.y);
          burst(tgt.x, tgt.y - 5, 6, ["#e8e8ff", "#ffe08a"], 70, { z: 6, glow: 1 });
          n++;
          prev = tgt;
          if (n >= hops) return void (e.back = 1);
          const near = v6Near(tgt.x, tgt.y, 60 * c.n).filter((m) => m !== tgt && alive(m));
          near.sort((a, b) => Math.hypot(a.x - tgt.x, a.y - tgt.y) - Math.hypot(b.x - tgt.x, b.y - tgt.y));
          const nx = near[0];
          if (nx) tgt = nx;
          else {
            // 只有一名敵人：彈開再落回同一個目標
            e.x = tgt.x + (e.x < tgt.x ? -14 : 14);
            e.y = tgt.y - 16;
          }
        },
        draw: (e, cx) => {
          cx.save();
          cx.translate(e.x, e.y);
          cx.rotate(G.t * 20);
          cx.fillStyle = "#b8c8e0";
          cx.beginPath();
          cx.arc(0, 0, 3.6, 0, Math.PI * 2);
          cx.fill();
          cx.fillStyle = "#e8d070";
          cx.fillRect(-0.8, -3.6, 1.6, 7.2);
          cx.fillRect(-3.6, -0.8, 7.2, 1.6);
          cx.restore();
        },
      });
      return true;
    },
    // 壓迫：無視減傷與護盾的聖屬性單體
    pressure(c) {
      if (!v6Need(c)) return false;
      const { p, tgt } = c;
      setFace(c.ang);
      p.anim = { k: "cast", t: 0, dur: 0.4, a: c.ang, big: 1 };
      v6Ro("sw_pressure", tgt.x, tgt.y);
      later(0.25, () => {
        if (!alive(tgt)) return;
        const hp0 = tgt.hp;
        v6Hit(tgt, c.hit * c.r, Object.assign({}, c.o, { v85pierce: 1 }), { kb: 20, stop: 1 });
        const done = Math.max(0, hp0 - Math.max(0, tgt.hp));
        if (alive(tgt) && done > 0) {
          const pct = tgt.boss ? 0.01 : tgt.elite ? 0.03 : 0.05,
            extra = Math.min(tgt.hp * pct, done * 1.5);
          if (extra > 0) {
            const sh = tgt.sh;
            tgt.sh = 0;
            dealMob(tgt, extra, false, "#fff1ae");
            if (alive(tgt)) tgt.sh = sh;
          }
        }
        v6Fx({ k: "pillar", x: tgt.x, y: tgt.y, life: 0.4, col: "#fff1ae" });
        burst(tgt.x, tgt.y - 6, 16, V6_C.holy, 110, { z: 8, glow: 1 });
        shake(0.1);
      });
      return true;
    },
    // 加農長矛：貫穿直線，越遠越痛
    cspear(c) {
      if (!v6Need(c)) return false;
      const { p } = c,
        ang = c.ang,
        L = Math.max(130, 1.8 * PS.range) * Math.max(1, c.n * 0.8),
        W = 7 * Math.max(1, c.n);
      setFace(ang);
      p.anim = { k: "swing", t: 0, dur: 0.3, a: ang, combo: 2 };
      later(0.12, () => {
        if (G.dead) return;
        const [x0, y0] = handPos(),
          hs = new Set();
        v6Ent({
          life: L / 420 + 0.05,
          x: x0,
          y: y0,
          upd: (e) => {
            const d = Math.min(L, e.t * 420),
              x = x0 + Math.cos(ang) * d,
              y = y0 + Math.sin(ang) * d;
            e.x = x;
            e.y = y;
            for (const m of v6Line(x0, y0, x, y, W)) {
              if (hs.has(m)) continue;
              hs.add(m);
              const f = 1 + clamp(Math.hypot(m.x - p.x, m.y - p.y) / L, 0, 1);
              v6Hit(m, c.hit * c.r * f, c.o, { kb: 90, sx: x0, sy: y0 });
              v6Ro("sw_cspear", m.x, m.y);
            }
          },
          draw: (e, cx) => {
            cx.save();
            cx.strokeStyle = "#f4f0e0";
            cx.lineWidth = 2;
            cx.beginPath();
            cx.moveTo(e.x - Math.cos(ang) * 16, e.y - Math.sin(ang) * 16);
            cx.lineTo(e.x, e.y);
            cx.stroke();
            cx.fillStyle = "#ffe08a";
            cx.beginPath();
            cx.moveTo(e.x + Math.cos(ang) * 5, e.y + Math.sin(ang) * 5);
            cx.lineTo(e.x + Math.cos(ang + 2.4) * 4, e.y + Math.sin(ang + 2.4) * 4);
            cx.lineTo(e.x + Math.cos(ang - 2.4) * 4, e.y + Math.sin(ang - 2.4) * 4);
            cx.closePath();
            cx.fill();
            cx.restore();
          },
        });
        v6Fx({ k: "line", x: x0, y: y0, x2: x0 + Math.cos(ang) * L, y2: y0 + Math.sin(ang) * L, w: 3, life: 0.3, col: "#fff2c0" });
        shake(0.06);
      });
      return true;
    },
    // 創世之光：追著目標移動的光柱
    genesis(c) {
      if (!v6Need(c)) return false;
      const { p } = c,
        R = 20 * c.n;
      let tgt = c.tgt;
      p.anim = { k: "cast", t: 0, dur: 0.5, a: c.ang, big: 1 };
      v6Ro("sw_genesis", tgt.x, tgt.y, { area: 0.7 });
      v6Ent({
        zone: 1,
        life: 3,
        iv: 0.3,
        x: tgt.x,
        y: tgt.y,
        upd: (e, dt) => {
          if (!alive(tgt)) tgt = v6Near(e.x, e.y, 60)[0] || null;
          if (!tgt) return;
          const dx = tgt.x - e.x,
            dy = tgt.y - e.y,
            d = Math.hypot(dx, dy),
            v = 70 * dt;
          if (d > v) (e.x += (dx / d) * v), (e.y += (dy / d) * v);
          else (e.x = tgt.x), (e.y = tgt.y);
        },
        tick: (e) => {
          for (const m of v6Near(e.x, e.y, R)) {
            v6Hit(m, c.hit * c.r, c.o, { kb: 0 });
            v85Blind(m, 3);
          }
        },
        gdraw: (e, cx) => {
          const al = Math.min(1, e.t * 5, (e.life - e.t) * 3);
          cx.save();
          cx.globalAlpha = 0.16 * al;
          cx.fillStyle = "#fff1ae";
          cx.beginPath();
          cx.ellipse(e.x, e.y - 3, R, R * 0.7, 0, 0, Math.PI * 2);
          cx.fill();
          cx.globalAlpha = 0.55 * al;
          cx.strokeStyle = "#fff6d0";
          cx.lineWidth = 1;
          cx.stroke();
          cx.restore();
        },
        draw: (e, cx) => {
          const al = Math.min(1, e.t * 5, (e.life - e.t) * 3),
            w = R * 0.75,
            H = 110,
            gr = cx.createLinearGradient(e.x - w, 0, e.x + w, 0);
          gr.addColorStop(0, "rgba(255,241,174,0)");
          gr.addColorStop(0.5, "rgba(255,255,240,0.85)");
          gr.addColorStop(1, "rgba(255,241,174,0)");
          cx.save();
          cx.globalAlpha = (0.55 + 0.15 * Math.sin(G.t * 18)) * al;
          cx.globalCompositeOperation = "lighter";
          cx.fillStyle = gr;
          cx.fillRect(e.x - w, e.y - H, w * 2, H);
          cx.restore();
        },
      });
      return true;
    },
    // 獵鷹強襲：標記＋普通攻擊追擊
    fassault(c) {
      if (!v6Need(c)) return false;
      const { p, tgt } = c,
        g = v6G(),
        nth = S.cls === "bow" && !g.inExtra && g.n4 % V6_FOCUS.nth === 0;
      setFace(c.ang);
      p.anim = { k: "shoot", t: 0, dur: 0.3, a: c.ang };
      const chase = c.hit * c.r * 0.2,
        o = Object.assign({}, c.o, { v85k: "falcon" });
      V85.fal = { mult: chase, o, cd: 0 };
      later(0.18, () => {
        if (!alive(tgt)) return;
        v6Hit(tgt, c.hit * c.r, c.o, { kb: 40, stop: 1 });
        tgt.v85fal = G.t + 5;
        v6Fx({ k: "dive", x: tgt.x, y: tgt.y - 5, life: 0.25, col: V6_C.wind[0] });
        v6Ro("bw_fassault", tgt.x, tgt.y);
        burst(tgt.x, tgt.y - 6, 12, V6_C.wind, 100, { z: 6, glow: 1 });
        if (nth)
          for (let i = 0; i < 3; i++)
            later(0.2 + 0.16 * i, () => {
              if (!alive(tgt)) return;
              v6Hit(tgt, chase * 2, o, { kb: 15 });
              v6Fx({ k: "dive", x: tgt.x, y: tgt.y - 5, life: 0.2, col: V6_C.wind[1] });
            });
      });
      return true;
    },
    // 真實之眼：增益
    sight(c) {
      const { p } = c;
      p.anim = { k: "cast", t: 0, dur: 0.35, a: p.face };
      V85.sight = G.t + 8;
      v6Ro("bw_sight", p.x, p.y);
      v6Fx({ k: "ring", x: p.x, y: p.y - 3, r: 16, life: 0.5, col: "#9ad8ff", grow: 1 });
      num(p.x, p.y - 30, "真實之眼", "#9ad8ff");
      return true;
    },
    // 火神連矢：1.5 秒連射（仍可移動）
    avulcan(c) {
      if (!v6Need(c)) return false;
      const { p } = c;
      setFace(c.ang);
      p.anim = { k: "shoot", t: 0, dur: 0.18, a: c.ang };
      const n = v6G().inExtra ? 6 : 12; // 由第四箭等效果額外施放時只射 6 支
      for (let i = 0; i < n; i++)
        later(0.125 * i, () => {
          if (G.dead || !G.pl) return;
          const pl = G.pl,
            t = alive(c.tgt) && Math.hypot(c.tgt.x - pl.x, c.tgt.y - pl.y) < 2 * PS.range + 60 ? c.tgt : v6Near(pl.x, pl.y - 3, 2 * PS.range + 60)[0];
          if (!t) return;
          const [x, y] = handPos(),
            a = Math.atan2(t.y - 6 - y, t.x - x);
          fan({ k: "arrow", x, y, spd: 300, mult: c.hit * c.r, o: c.o, kb: 12 }, t, a, c.m.proj);
          // 算作普通攻擊（第四箭等）；但不會因此再施放火神連矢自己
          V85.vulArrow = 1;
          try {
            if (S.cls === "bow" && typeof v6OnBasic === "function") v6OnBasic();
          } catch (e) {
          } finally {
            V85.vulArrow = 0;
          }
        });
      return true;
    },
    // 命運的塔羅牌
    tarot(c) {
      if (!v6Need(c)) return false;
      const { p, tgt } = c;
      setFace(c.ang);
      p.anim = { k: "cast", t: 0, dur: 0.32, a: c.ang };
      const [x0, y0] = handPos(),
        n = 1 + (c.m.proj || 0),
        others = v6Near(tgt.x, tgt.y, 70).filter((m) => m !== tgt);
      // 多重投射：額外的牌飛向附近其他敵人；沒有其他敵人時以 50% 傷害打同一個目標
      for (let i = 0; i < n; i++) {
        const t = i === 0 ? tgt : others[i - 1] || tgt,
          k = i === 0 || t !== tgt ? 1 : 0.5,
          card = v85TarotPick(),
          cc = k === 1 ? c : Object.assign({}, c, { r: c.r * k }),
          a0 = c.ang + (i ? (i % 2 ? 1 : -1) * 0.35 * Math.ceil(i / 2) : 0);
        v6Ent({
          life: 2.2,
          x: x0 + Math.cos(a0) * 6,
          y: y0 + Math.sin(a0) * 6,
          t0: 0.08 * i,
          upd: (e, dt) => {
            if (e.hit || e.t < e.t0) return;
            if (!alive(t)) return void (e.t = e.life);
            const dx = t.x - e.x,
              dy = t.y - 10 - e.y,
              d = Math.hypot(dx, dy) || 1,
              v = 260 * dt;
            if (d > v) return void ((e.x += (dx / d) * v), (e.y += (dy / d) * v));
            e.hit = 1;
            e.t = e.life - 1.1;
            v85TarotHit(cc, t, card, 0, i);
          },
          draw: (e, cx) => e.t >= e.t0 && v85DrawCard(cx, e.x, e.y, e.hit ? card : -1, e.hit ? Math.min(1, (e.life - e.t) * 2) : 1, e.hit),
        });
      }
      return true;
    },
    // 猛烈暴風雨：跟著自己移動的箭雨
    rainstorm(c) {
      const { p } = c,
        R = 40 * c.n;
      p.anim = { k: "shoot", t: 0, dur: 0.3, a: p.face, big: 1 };
      v6Ent({
        zone: 1,
        life: 3,
        iv: 0.25,
        tick: (e) => {
          const pl = G.pl;
          if (!pl || G.dead) return;
          for (const m of v6Near(pl.x, pl.y - 3, R)) v6Hit(m, c.hit * c.r, c.o, { kb: 8 });
          if (((e.n = (e.n || 0) + 1) % 2) === 1) {
            const a = rf(0, Math.PI * 2),
              d = rf(0, R * 0.7);
            v6Ro("bw_rainstorm", pl.x + Math.cos(a) * d, pl.y + Math.sin(a) * d * 0.7);
          }
        },
        gdraw: (e, cx) => {
          const pl = G.pl;
          if (!pl) return;
          const al = Math.min(1, e.t * 4, (e.life - e.t) * 3);
          cx.save();
          cx.globalAlpha = 0.22 * al;
          cx.strokeStyle = "#e8f0ff";
          cx.lineWidth = 1.5;
          cx.beginPath();
          cx.ellipse(pl.x, pl.y - 3, R, R * 0.7, 0, 0, Math.PI * 2);
          cx.stroke();
          cx.restore();
        },
        draw: (e, cx) => {
          const pl = G.pl;
          if (!pl) return;
          cx.save();
          cx.strokeStyle = "#f4f6ff";
          cx.lineWidth = 1;
          cx.globalAlpha = 0.8;
          for (let i = 0; i < 10; i++) {
            const s = (i * 97 + Math.floor(G.t * 12) * 31) % 360,
              a = (s * Math.PI) / 180,
              d = ((i * 53 + Math.floor(G.t * 12) * 17) % 100) / 100 * R,
              x = pl.x + Math.cos(a) * d,
              y = pl.y - 3 + Math.sin(a) * d * 0.7,
              k = (G.t * 12) % 1;
            cx.beginPath();
            cx.moveTo(x - 2, y - 30 + 26 * k);
            cx.lineTo(x, y - 22 + 26 * k);
            cx.stroke();
          }
          cx.restore();
        },
      });
      return true;
    },
    // 金屬之聲：單體＋沉默
    metal(c) {
      if (!v6Need(c)) return false;
      const { p, tgt } = c;
      setFace(c.ang);
      p.anim = { k: "cast", t: 0, dur: 0.35, a: c.ang };
      v6Ro("bw_metal2", p.x, p.y);
      later(0.15, () => {
        if (!alive(tgt)) return;
        v6Hit(tgt, c.hit * c.r * (v85Ctl(tgt) ? 1.5 : 1), c.o, { kb: 30, stop: 1 });
        v85Silence(tgt, 2);
        v6Ro("bw_metal", tgt.x, tgt.y);
        for (let i = 0; i < 3; i++) v6Fx({ k: "ring", x: tgt.x, y: tgt.y - 6, r: 6 + 5 * i, life: 0.3 + 0.08 * i, col: "#c8d0ff", grow: 1 });
      });
      return true;
    },
  });
  // 施放距離與時機
  V6_ALWAYS.add("sight");
  const rd = v6Ready,
    rg = v6Range;
  v6Range = function (g, ...a) {
    const k = SKILLS[g.id]?.v6;
    if (k === "rainstorm") return 40 * PS.area * (1 + gemMods(g).area);
    if (k === "schain") return 100;
    if (k === "cspear") return Math.max(1.4 * PS.range, 70);
    return rg.call(this, g, ...a);
  };
  v6Ready = function (g, ...a) {
    const k = SKILLS[g.id]?.v6;
    if (k === "sight") return !G.dead && !(V85.sight > G.t) && mobsNear(G.pl.x, G.pl.y - 3, 2 * PS.range + 40).length > 0;
    return rd.call(this, g, ...a);
  };
}

// 塔羅牌：牌面與效果
const V85_TAROT = [
  { n: "戰車", f: "tarot04_tga.png", c: "#ffb070" },
  { n: "高塔", f: "tarot12_tga.png", c: "#ffd84a" },
  { n: "星星", f: "tarot13_tga.png", c: "#fff2a0" },
  { n: "倒吊人", f: "tarot08_tga.png", c: "#9ad8ff" },
  { n: "死神", f: "tarot09_tga.png", c: "#b08aff" },
  { n: "惡魔", f: "tarot11_tga.png", c: "#ff7a7a" },
  { n: "太陽", f: "tarot14_tga.png", c: "#ffcf5a" },
  { n: "戀人", f: "tarot06_tga.png", c: "#ff9ac8" },
  { n: "命運之輪", f: "tarot07_tga.png", c: "#e8d8a0" },
];
const v85TarotPick = (noWheel) => Math.floor(RAND() * (noWheel ? V85_TAROT.length - 1 : V85_TAROT.length));
function v85TarotHit(c, tgt, card, depth, off = 0) {
  if (!alive(tgt)) return;
  const C = V85_TAROT[card],
    base = c.hit * c.r;
  num(tgt.x, tgt.y - (tgt.h || 12) - 14 - (depth + off) * 9, C.n, C.c, 1);
  switch (C.n) {
    case "戰車":
      v6Hit(tgt, base * 2.5, c.o, { kb: 60, stop: 1 });
      break;
    case "高塔": {
      v6Hit(tgt, base, c.o, { kb: 30 });
      if (alive(tgt)) dealMob(tgt, tgt.max * (tgt.boss ? 0.003 : tgt.elite ? 0.01 : 0.03), false, "#ffd84a");
      v6Fx({ k: "bolt", x: tgt.x, y: tgt.y, life: 0.3, col: "#ffe08a" });
      break;
    }
    case "星星":
      v6Hit(tgt, base, c.o, { kb: 30 });
      for (const m of v6Near(tgt.x, tgt.y, 26 * c.n)) v6Stun(m, 2);
      burst(tgt.x, tgt.y - 10, 10, ["#fff2a0", "#ffffff"], 80, { z: 10, glow: 1 });
      break;
    case "倒吊人":
      v6Hit(tgt, base, c.o, { kb: 0 });
      v6Stun(tgt, 3);
      tgt.v85hang = G.t + 3 * (tgt.boss ? 0.25 : tgt.elite ? 0.6 : 1);
      break;
    case "死神": {
      v6Hit(tgt, base, c.o, { kb: 20 });
      const m = tgt;
      v6Ent({
        life: 8,
        iv: 1,
        tick: () => {
          if (!alive(m)) return;
          v6Hit(m, base * 0.2, c.o, { kb: 0 });
          burst(m.x, m.y - 8, 4, ["#b08aff", "#3a1a6a"], 40, { z: 6 });
        },
      });
      break;
    }
    case "惡魔":
      v6Hit(tgt, base, c.o, { kb: 20 });
      tgt.v85devil = G.t + 6;
      break;
    case "太陽": {
      const R = 30 * c.n;
      for (const m of v6Near(tgt.x, tgt.y, R)) v6Hit(m, base, c.o, { kb: 90, sx: tgt.x, sy: tgt.y });
      v6Fx({ k: "ring", x: tgt.x, y: tgt.y - 3, r: R, life: 0.4, col: "#ffcf5a", grow: 1 });
      burst(tgt.x, tgt.y - 6, 24, V6_C.fire, 140, { z: 6, glow: 1 });
      break;
    }
    case "戀人":
      v6Hit(tgt, base, c.o, { kb: 20 });
      heal(PS.maxhp * 0.12);
      burst(G.pl.x, G.pl.y - 10, 10, ["#ff9ac8", "#ffffff"], 60, { z: 10, glow: 1 });
      break;
    case "命運之輪":
      v6Hit(tgt, base, c.o, { kb: 20 });
      if (depth < 1)
        for (let i = 0; i < 2; i++)
          later(0.25 * (i + 1), () => {
            if (!alive(tgt)) return;
            const k = v85TarotPick(true);
            v85TarotHit(c, tgt, k, depth + 1, off + i + 1);
            v85CardFx(tgt.x + (i ? 10 : -10), tgt.y - 24, k);
          });
      break;
  }
}
// 額外抽到的牌：在目標上方短暫顯示
function v85CardFx(x, y, card) {
  v6Ent({ life: 0.9, draw: (e, cx) => v85DrawCard(cx, x, y - e.t * 8, card, Math.min(1, (e.life - e.t) * 2.5), 1) });
}
function v85DrawCard(cx, x, y, card, al, face) {
  const w = 9,
    h = 16;
  cx.save();
  cx.globalAlpha = al;
  cx.translate(x, y);
  if (!face) cx.rotate(G.t * 14);
  const im = card >= 0 ? v85Img(V85_TAROT[card].f) : null;
  if (face && im) cx.drawImage(im, -w, -h, w * 2, h * 2);
  else {
    cx.fillStyle = "#3a2a5a";
    cx.fillRect(-w * 0.6, -h * 0.6, w * 1.2, h * 1.2);
    cx.strokeStyle = "#ffe08a";
    cx.lineWidth = 1;
    cx.strokeRect(-w * 0.6, -h * 0.6, w * 1.2, h * 1.2);
  }
  cx.restore();
}

// ---------------------------------------------------------------------------
// 4. 輔助與狀態效果
const V85_GOS = [
  { k: "dmg", n: "傷害 +25%" },
  { k: "as", n: "攻擊速度 +20%" },
  { k: "dr", n: "受到傷害 −20%" },
  { k: "regen", n: "每秒回復 2% 生命" },
  { k: "crit", n: "暴擊率 +20%" },
];
const v85Gos = (k) => V85.gos[k] > G.t;
function v85Effects() {
  // 施放：聖歌、盾牌魔法、赫爾莫德之杖、風之疾走
  const cs = castSkill;
  castSkill = function (g, a = 1, ...x) {
    if (V85.vulArrow && g && SKILLS[g.id]?.v6 === "avulcan") return false;
    if (!roEcho) V85.blCast = 0;
    const r = cs.call(this, g, a, ...x);
    if (r === false || !g || !SKILLS[g.id] || roEcho) return r;
    try {
      const sk = SKILLS[g.id];
      if (!sk.act || sk.sus) return r;
      if (v6Linked(g, "sw_gospel") && G.t >= V85.gosT) {
        V85.gosT = G.t + 2;
        const i = Math.floor(RAND() * V85_GOS.length),
          j = (i + 1 + Math.floor(RAND() * (V85_GOS.length - 1))) % V85_GOS.length;
        for (const b of [V85_GOS[i], V85_GOS[j]]) V85.gos[b.k] = G.t + 8;
        num(G.pl.x, G.pl.y - 34, "聖歌：" + V85_GOS[i].n + "、" + V85_GOS[j].n, "#fff1ae");
        burst(G.pl.x, G.pl.y - 10, 10, V6_C.holy, 60, { z: 10, glow: 1 });
      }
      if (v6Linked(g, "sw_shspell")) v85Shield(0.02, 0.1);
      if (v6Linked(g, "bw_hermode")) v85Shield(0.03, 0.15);
      if (v6Linked(g, "bw_wwalk")) V85.ww = G.t + 3;
    } catch (e) {}
    return r;
  };
  // 盾牌魔法：傷害隨護甲（數值即時計算，技能頁的預估也會跟著變）
  if (SKILLS.sw_shspell)
    SKILLS.sw_shspell.mod = Object.defineProperty({}, "dmg", { enumerable: true, get: () => (typeof PS !== "undefined" && PS ? Math.min(0.6, (0.03 * v85Arm()) / 100) : 0) });
  // 擊中：獵鷹追擊、巨大回音、致盲時的極限槽、致盲落空
  const fi = fire;
  fire = function (t, a, s, e, n) {
    if (t === "hit") {
      try {
        v85OnHit(a, s, e, n);
      } catch (er) {}
    } else if (t === "hurtPre" && s && s.v85blind > G.t && RAND() < 0.5) {
      try {
        const p = G.pl;
        num(p.x, p.y - 22, "MISS", "#fff6c8");
      } catch (er) {}
      return true;
    }
    return fi.call(this, t, a, s, e, n);
  };
  // 壓迫：無視減傷與護盾；暴擊加成（真實之眼、聖歌）
  const hm = hitMob;
  hitMob = function (m, mult, o = {}, ...x) {
    if (!m || !alive(m)) return hm.call(this, m, mult, o, ...x);
    const cr = (V85.sight > G.t ? 15 : 0) + (v85Gos("crit") ? 20 : 0);
    if (cr) o = Object.assign({}, o, { crit: (o.crit || 0) + cr });
    if (o.v85pierce) {
      const sv = { sh: m.sh, dr: m.roDr, gm: m.gm, ea: m.ea };
      m.sh = 0;
      m.roDr = 0;
      m.gm = null;
      if (Array.isArray(m.ea)) m.ea = m.ea.filter((k) => k !== "tough");
      try {
        return hm.call(this, m, mult, o, ...x);
      } finally {
        m.sh = sv.sh;
        m.roDr = sv.dr;
        m.gm = sv.gm;
        m.ea = sv.ea;
      }
    }
    return hm.call(this, m, mult, o, ...x);
  };
  // 傷害倍率
  HIT_MUL.push(
    { k: "v85:gos", lab: () => v85Gos("dmg") && "聖歌：傷害 ×1.25", f: (t) => (v85Gos("dmg") ? t * 1.25 : t) },
    { k: "v85:ww", f: (t, m, s) => (m && s && s.skill && Math.hypot(m.x - G.pl.x, m.y - G.pl.y) >= 35 && v85Lk(s, "bw_wwalk") ? t * 1.3 : t) },
  );
  TAKE_MUL.push(
    { k: "v85:hang", f: (t, m) => (m && m.v85hang > G.t ? t * 1.3 : t) },
  );
  HURT_MUL.push(
    { k: "v85:gos", f: () => (v85Gos("dr") ? 0.8 : 1) },
    { k: "v85:devil", f: (src) => (src && src.v85devil > G.t ? 0.5 : 1) },
  );
  SPD_AS.push(
    { k: "v85:gos", f: () => (v85Gos("as") ? 1.2 : 1) },
    { k: "v85:echo", f: () => (V85.echo.t > G.t ? 1 + 0.03 * V85.echo.n : 1) },
  );
  SPD_MS.push({ k: "v85:ww", f: () => (V85.ww > G.t ? 1.3 : 1) });
  // 真實之眼：專注距離加成固定為最大
  const fe = HIT_MUL.find((h) => h.k === "v6:focus");
  if (fe) {
    const f0 = fe.f;
    fe.f = (t, m, s) => {
      if (!(V85.sight > G.t) || !S || S.cls !== "bow") return f0(t, m, s);
      const mx = 1 + V6_FOCUS.max * (1 + v6Tal("v6focus"));
      return t * mx * (s && g6Lk(s, "bw_range") ? mx : 1);
    };
  }
  // 沉默：頭目招式、菁英詞綴技能暫停
  const bs = bossSkill;
  bossSkill = function (t, ...a) {
    if (t && t.v85sil > G.t) return;
    return bs.call(this, t, ...a);
  };
  const et = eliteTick;
  eliteTick = function (t, ...a) {
    if (t && t.v85sil > G.t) return;
    return et.call(this, t, ...a);
  };
  // 聖歌：生命回復；巨大回音：層數到期
  const tk = tick;
  tick = function (dt, ...x) {
    const r = tk.call(this, dt, ...x);
    try {
      if (S && G?.pl && !G.dead) {
        if (v85Gos("regen")) heal(PS.maxhp * 0.02 * dt);
        if (V85.echo.n && V85.echo.t <= G.t) V85.echo.n = 0;
      }
    } catch (e) {}
    return r;
  };
}
function v85OnHit(mob, dmg, crit, o) {
  if (!mob || !G?.pl || !o) return;
  // 獵鷹強襲：普通攻擊命中被標記的敵人
  const f = V85.fal;
  if (f && !(o.skill || o.min) && mob.v85fal > G.t && G.t >= f.cd && alive(mob)) {
    f.cd = G.t + 0.35;
    hitMob(mob, f.mult, f.o);
    v6Fx({ k: "dive", x: mob.x, y: mob.y - 5, life: 0.18, col: V6_C.wind[0] });
  }
  if (!o.skill) return;
  // 巨大回音
  if (G.t - V85.echo.last >= 0.2 && v85Lk(o, "bw_gecho")) {
    V85.echo.last = G.t;
    V85.echo.n = Math.min(10, (V85.echo.t > G.t ? V85.echo.n : 0) + 1);
    V85.echo.t = G.t + 5;
  }
  // 創世之光：擊中致盲的敵人時，極限槽累積 ×2
  if (S.cls === "sword" && !o.v6r && mob.v85blind > G.t && V85.blCast < V6_LIM.castCap) {
    V85.blCast += V6_LIM.skillHit;
    v6LimAdd(V6_LIM.skillHit);
  }
}

// ---------------------------------------------------------------------------
// 5. 預估傷害、特效、增益圖示
const V85_EST = { sw_pressure: 1.3, sw_cspear: 1.2, sw_genesis: 10, bw_fassault: 1.5, bw_avulcan: 12, bw_tarot: 1.6, bw_rainstorm: 12, bw_metal: 1.1 };
const V85_FX = {
  sw_schain: [{ str: ["shield_charge"], target: 1 }, { str: ["earthhit"], target: 1 }],
  sw_pressure: [{ str: ["gloria"], target: 1 }, { str: ["holyhit"], target: 1 }],
  sw_cspear: [{ str: ["spearstab"], target: 1 }, { str: ["pierce"], target: 1 }],
  sw_genesis: [{ str: ["benedictio"], target: 1 }, { str: ["holyhit"], target: 1 }],
  bw_fassault: [{ str: ["homing"], target: 1 }, { str: ["windhit1"], target: 1 }],
  bw_sight: [{ str: ["concentration"], self: 1 }, { custom: "aura", self: 1 }],
  bw_rainstorm: [{ str: ["arrowstorm"], target: 1 }],
  bw_metal: [{ str: ["silence"], target: 1 }, { custom: "aura", target: 1 }],
  bw_metal2: [{ str: ["loud"], self: 1 }, { custom: "aura", self: 1 }],
};
function v85Finish() {
  for (const [id, k] of Object.entries(V85_EST))
    if (SKILLS[id]) {
      const sk = SKILLS[id];
      sk.est = () => sk.hit * k;
    }
  if (SKILLS.sw_schain) SKILLS.sw_schain.est = () => SKILLS.sw_schain.hit * 5 * (1 + Math.min(2, (0.02 * v85Arm()) / 100));
  if (typeof roFxProfiles !== "undefined")
    for (const [id, list] of Object.entries(V85_FX)) {
      const p = list.find((q) => !q.str || (typeof roFxNative === "function" && q.str.every((n) => roFxNative(n))));
      if (p) roFxProfiles[id] = p;
    }
  // 蓄力狙擊改用 RO「瞄準箭」圖示，獵鷹強襲用回 RO 原本的圖示
  if (typeof roSkillIcons !== "undefined" && roSkillIcons.bw_snipe === 381) roSkillIcons.bw_snipe = 2236;
  // 塔羅牌圖預先載入
  for (const c of V85_TAROT) v85Img(c.f);
  if (typeof HUD_BUFF !== "undefined")
    HUD_BUFF.push(
      {
        k: "v85sight",
        n: () => (V85.sight > G.t ? 1 : 0),
        left: () => Math.max(0, V85.sight - G.t),
        bg: "#2a5a8a",
        fg: "#e6f4ff",
        tc: "#9ad8ff",
        tip: (n, l) => ["真實之眼", [`剩餘 ${l.toFixed(1)} 秒`, "暴擊率 +15%", "專注距離加成固定為最大"]],
        art: ["..XXX..", ".X...X.", "X..X..X", "X.XXX.X", "X..X..X", ".X...X.", "..XXX.."],
      },
      {
        k: "v85gos",
        n: () => V85_GOS.filter((b) => v85Gos(b.k)).length,
        left: () => Math.max(0, ...V85_GOS.map((b) => (v85Gos(b.k) ? V85.gos[b.k] - G.t : 0))),
        bg: "#8a7a2a",
        fg: "#fffbe6",
        tc: "#fff1ae",
        tip: () => ["聖歌", V85_GOS.filter((b) => v85Gos(b.k)).map((b) => `${b.n}（剩餘 ${(V85.gos[b.k] - G.t).toFixed(1)} 秒）`)],
        art: ["...X...", "...X...", "XXXXXXX", "...X...", "...X...", "...X...", "...X..."],
      },
      {
        k: "v85echo",
        n: () => (V85.echo.t > G.t ? V85.echo.n : 0),
        left: () => Math.max(0, V85.echo.t - G.t),
        bg: "#6a3a8a",
        fg: "#f6e6ff",
        tc: "#d8b0ff",
        tip: (n, l) => ["巨大回音", [`${n} 層：攻擊速度 +${n * 3}%`, `剩餘 ${l.toFixed(1)} 秒`]],
        art: ["X.....X", "X..X..X", "X.X.X.X", "XX...XX", "X.X.X.X", "X..X..X", "X.....X"],
      },
    );
  // 新角色、換地圖時清掉暫存
  if (typeof startGame === "function") {
    const sg = startGame;
    startGame = function (...a) {
      V85.sight = 0;
      V85.gos = {};
      V85.gosT = 0;
      V85.ww = 0;
      V85.echo = { n: 0, t: 0, last: 0 };
      V85.fal = null;
      return sg.apply(this, a);
    };
  }
}
// 蜘蛛網、岩石牢籠（v8.4 法師）：有 Codex 繪製的圖（assets/ro-fx-custom/v84_web.png、v84_spike.png）時改用圖片，
// 沒有時維持程式繪製。第一次施放時才讀取，讀不到就不再嘗試。
const V85_ART = {};
function v85Art(k) {
  if (k in V85_ART || typeof Image === "undefined") return V85_ART[k] || null;
  V85_ART[k] = null;
  const im = new Image();
  im.onload = () => (V85_ART[k] = im.naturalWidth ? im : false);
  im.onerror = () => (V85_ART[k] = false);
  im.src = "assets/ro-fx-custom/" + k + ".png";
  return null;
}
function v85ArtInstall() {
  if (typeof v83DrawWeb === "function") {
    const dw = v83DrawWeb;
    v83DrawWeb = function (cx, x, y, R, al) {
      const im = v85Art("v84_web");
      if (!im) return dw.call(this, cx, x, y, R, al);
      cx.save();
      cx.globalAlpha = 0.9 * al;
      cx.drawImage(im, x - R, y - 3 - R * 0.7, R * 2, R * 1.4);
      cx.restore();
    };
  }
  if (typeof v83DrawCage === "function") {
    const dc = v83DrawCage;
    v83DrawCage = function (cx, x, y, R, t, life, h) {
      const im = v85Art("v84_spike");
      if (!im) return dc.call(this, cx, x, y, R, t, life, h);
      const k = Math.min(1, t * 6, (life - t) * 3),
        n = 12,
        fw = im.naturalWidth / 4,
        fh = im.naturalHeight;
      cx.save();
      for (let i = 0; i < n; i++) {
        const a = (i * Math.PI * 2) / n,
          sx = x + Math.cos(a) * R,
          sy = y + Math.sin(a) * R * 0.7,
          H = h * 1.5 * (0.85 + (0.3 * ((i * 7) % 3)) / 2),
          W = (H * fw) / fh,
          up = H * k;
        // 從地面竄出：只畫露出地面的部分
        cx.drawImage(im, (i % 4) * fw, 0, fw, fh * k, sx - W / 2, sy - up, W, up);
      }
      cx.restore();
    };
  }
}
function v85Install() {
  if (typeof V6_CAST === "undefined" || !SKILLS.sw_schain) return;
  v85Moves();
  v85Effects();
  v85Finish();
  v85ArtInstall();
}
if (typeof roV4Install === "function") {
  const r4v85 = roV4Install;
  roV4Install = function () {
    r4v85();
    v85Install();
  };
}
