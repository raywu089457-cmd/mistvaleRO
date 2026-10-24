/* 流浪仙境 v8.3／v8.4：職業新技能第 1 批（法師：巫師線、賢者線）—— 三轉、四轉新增 RO 原作的主動與輔助技能；v8.4 依「跟現有技能太相似」重製 8 項 */

// ---------------------------------------------------------------------------
// 1. 技能表（在 v6 技能登錄前加入，跟原本的職業技能一樣建立寶石、商店、圖示）
//    「三轉」對應 RO 進階二轉（超魔導士、智者），「四轉」對應 RO 三轉（大法師、元素使）
//    id, 職業, 名稱, 招式, 傷害, 冷卻, 標籤, 屬性, 異常, RO 圖示, 形狀, 說明
const V83_ACT = [
  // 巫師線
  ["mg_nvulcan", "mage", "念力連發", "nvulcan", 0.3, 4, ["aoe", "spell"], "ghost", null, "v83_400", "L3", "朝目標方向射出念力光束，持續 1.2 秒，每 0.1 秒對直線上所有敵人造成 {hit}% 武器傷害；擊中帶有元素印記的敵人時傷害 +50%。"],
  ["mg_mcrash", "mage", "魔力粉碎", "mcrash", 3.8, 3.5, ["spell"], "neutral", null, 365, "I2", "以攻擊力凝聚魔力轟擊單一目標，造成 {hit}% 武器傷害；暴擊率 +25%，對護盾造成 2 倍傷害。"],
  ["mg_comet", "mage", "彗星", "comet", 8.5, 12, ["aoe", "spell"], "neutral", null, 2213, "P5", "詠唱 1.5 秒後巨大彗星墜落：畫面內所有敵人都會受到傷害，落點中心 {hit}% 武器傷害，離落點越遠越低（最低 40%）；並引爆敵人身上的元素印記，觸發元素反應。"],
  ["mg_crimson", "mage", "赤紅岩石", "crimson", 3.6, 5, ["aoe", "spell", "elem"], "fire", null, 2211, "O4", "赤紅岩石在目標處砸落：範圍內敵人受到 {hit}% 武器傷害並烙上火之印記，被大幅擊退、暈眩 1.5 秒；被擊飛的敵人撞到其他敵人時，對牠們造成 50% 傷害。"],
  // 賢者線
  ["mg_dcast", "mage", "雙重施法", "dcast", 0, 14, ["spell"], "neutral", null, 482, "I2", "8 秒內，投射類魔法（火球術、雷擊術、念力爆發、魔力粉碎等）施放時有 50% 機率再施放一次（70% 傷害）。"],
  ["mg_fiber", "mage", "蜘蛛網", "fiber", 0.6, 9, ["aoe", "spell"], "neutral", null, 405, "T4", "在目標處張開蜘蛛網 8 秒：張開時在網上與之後踏入的敵人受到 {hit}% 武器傷害並被黏住 2 秒（頭目、菁英較短）；被黏住的敵人受到的火屬性傷害 ×2。"],
  ["mg_ddust", "mage", "鑽石星塵", "ddust", 2.0, 7, ["aoe", "spell", "elem"], "water", "chl", 2447, "S4", "範圍內敵人受到 {hit}% 武器傷害並凍結 1.5 秒；1.5 秒後冰晶碎裂，再造成這段期間所受傷害的 40%（頭目、菁英凍結時間較短，但同樣累積 1.5 秒），並把水之印記擴散到周圍敵人。"],
  ["mg_egrave", "mage", "大地之墳", "egrave", 1.1, 8, ["aoe", "spell", "elem"], "earth", null, 2446, "L4", "在目標處升起岩石牢籠 3 秒：岩刺竄出時造成 {hit}% 武器傷害；圈內的敵人無法離開，每 0.5 秒再受到其 50% 傷害並烙上地之印記。"],
  ["mg_pwave", "mage", "念力波", "pwave", 1.1, 5, ["aoe", "spell"], "ghost", null, 2449, "O4", "從自身向目標方向推出 3 道扇形念力波，每道對碰到的敵人造成 {hit}% 武器傷害並把牠們推開。"],
];
//    id, 職業, 名稱, 需求標籤, RO 圖示, 形狀, 說明
const V83_SUP = [
  ["mg_sdrain", "mage", "靈魂吸取", null, 364, "I2", "相鄰技能擊殺敵人時，回復 2% 最大生命，且該技能冷卻 −0.3 秒。"],
  ["mg_release", "mage", "咒文書解放", null, 2230, "L3", "相鄰的主動技能施放 1 秒後自動再施放一次（60% 傷害）；冷卻 +25%。光環、召喚與增益技能無效。"],
  ["mg_memo", "mage", "記憶術", null, 403, "I2", "相鄰技能可預存 2 次施放：每次冷卻完成累積 1 次（最多 2 次），連續施放時間隔 0.4 秒；冷卻 −15%。"],
  ["mg_sfist", "mage", "法術拳", null, 2445, "L3", "相鄰的主動技能施放後，接下來 3 次普通攻擊各額外造成該技能 15% 的傷害。"],
];
// 商店：依職業線與職階開放（V81_TIER[職業][職業線][0 一轉起／1 三轉後／2 四轉後]）
const V83_TIER = {
  mage: [
    [[], ["mg_nvulcan", "mg_mcrash", "mg_sdrain"], ["mg_comet", "mg_crimson", "mg_release"]],
    // 賢者線：三轉加「崩裂術」、四轉加「暴風雪」（原本只有巫師流派買得到）
    [[], ["mg_quake", "mg_dcast", "mg_fiber", "mg_memo"], ["mg_storm", "mg_ddust", "mg_egrave", "mg_pwave", "mg_sfist"]],
  ],
};
if (typeof V6_ACT !== "undefined" && typeof V6_SUP !== "undefined" && typeof V6_CLASS !== "undefined") {
  for (const r of V83_ACT) {
    V6_ACT.push(r);
    V6_CLASS[r[1]].act.push(r[0]);
    if (typeof V6_JOB !== "undefined") V6_JOB[r[0]] = []; // 不屬於任何流派：只依職階開放
  }
  for (const r of V83_SUP) {
    V6_SUP.push(r);
    V6_CLASS[r[1]].sup.push(r[0]);
    if (typeof V6_JOB !== "undefined") V6_JOB[r[0]] = [];
  }
  if (typeof V81_TIER !== "undefined")
    for (const [cls, lines] of Object.entries(V83_TIER)) lines.forEach((L, li) => L.forEach((ids, t) => V81_TIER[cls][li][t].push(...ids)));
}

// ---------------------------------------------------------------------------
// 2. 招式
const V83 = { dc: 0, fist: null, tg: null };
const v83Dense = (x, y, R) => {
  // 目標附近怪物最密集的點（找不到就用目標位置）
  let best = [x, y],
    bn = 0;
  for (const m of v6Near(x, y, R * 1.6)) {
    const n = v6Near(m.x, m.y, R).length;
    if (n > bn) (bn = n), (best = [m.x, m.y]);
  }
  return best;
};
// 岩刺：從地面竄出的尖石（0.45 秒）
function v83Spike(x, y, h) {
  v6Ent({
    life: 0.45,
    iv: 9,
    draw: (e, cx) => {
      const k = e.t / e.life,
        up = Math.min(1, k * 4),
        H = h * up,
        w = h * 0.32;
      cx.save();
      cx.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      cx.fillStyle = "#6a4a2a";
      cx.beginPath();
      cx.moveTo(x - w, y);
      cx.lineTo(x + w * 0.2, y - H);
      cx.lineTo(x + w, y);
      cx.closePath();
      cx.fill();
      cx.fillStyle = "#c89a5a";
      cx.beginPath();
      cx.moveTo(x - w * 0.6, y);
      cx.lineTo(x + w * 0.2, y - H);
      cx.lineTo(x, y);
      cx.closePath();
      cx.fill();
      cx.restore();
    },
  });
}
function v83Moves() {
  const inCage = (m, x, y, R) => Math.hypot(m.x - x, (m.y - y) / 0.7) <= R;
  Object.assign(V6_CAST, {
    // 念力連發：念力光束（持續 1.2 秒，穿透直線）
    nvulcan(c) {
      if (!v6Need(c)) return false;
      const { p } = c;
      let tgt = c.tgt,
        ang = c.ang;
      setFace(ang);
      p.anim = { k: "cast", t: 0, dur: 0.5, a: ang };
      const L = Math.max(1.6 * PS.range, 90) * Math.max(1, c.n * 0.8),
        W = 6 * c.n;
      for (let i = 0; i < 12; i++)
        later(0.1 * i, () => {
          if (G.dead) return;
          if (alive(tgt)) ang = aimAt(tgt);
          const [x0, y0] = handPos(),
            x1 = x0 + Math.cos(ang) * L,
            y1 = y0 + Math.sin(ang) * L;
          for (const m of v6Line(x0, y0, x1, y1, W)) v6Hit(m, c.hit * c.r * (m.v6m && m.v6m.t > G.t ? 1.5 : 1), c.o, { kb: 4 });
          v6Fx({ k: "line", x: x0, y: y0, x2: x1, y2: y1, w: 4, life: 0.12, col: "#9a7ae8" });
          v6Fx({ k: "line", x: x0, y: y0, x2: x1, y2: y1, w: 1.4, life: 0.12, col: "#f4eeff" });
          if (i % 4 === 0) v6Ro("mg_nvulcan", x0 + Math.cos(ang) * L * 0.6, y0 + Math.sin(ang) * L * 0.6);
        });
      return true;
    },
    // 魔力粉碎：單體重擊（對護盾 2 倍見擊中處理）
    mcrash(c) {
      if (!v6Need(c)) return false;
      const { p, tgt } = c;
      setFace(c.ang);
      p.anim = { k: "cast", t: 0, dur: 0.36, a: c.ang };
      later(0.22, () => {
        if (!alive(tgt)) return;
        v6Hit(tgt, c.hit * c.r, Object.assign({}, c.o, { crit: (c.o.crit || 0) + 25 }), { kb: 40, stop: 1 });
        v6Fx({ k: "ring", x: tgt.x, y: tgt.y - 4, r: 12, life: 0.3, col: "#ffffff", grow: 1 });
        burst(tgt.x, tgt.y - 6, 14, ["#ffffff", "#e8e0ff", "#a090ff"], 110, { z: 6, glow: 1 });
        v6Ro("mg_mcrash", tgt.x, tgt.y);
      });
      return true;
    },
    // 彗星：畫面清場，引爆元素印記
    comet(c) {
      if (!v6Need(c)) return false;
      const { p, tgt } = c,
        [x, y] = v83Dense(tgt.x, tgt.y, 30 * c.n);
      p.anim = { k: "cast", t: 0, dur: 1.0, a: c.ang, big: 1 };
      v6Fx({ k: "warn", x, y: y - 3, r: 50 * c.n, life: 1.5, col: "#e8d0a0" });
      v6Ro("mg_comet", x, y, { delay: 1.0, area: 1.6 });
      later(1.5, () => {
        const y0 = G.cy || 0,
          vh = G.VH || G.H,
          D = G.W * 0.9;
        for (const m of G.mobs) {
          if (!alive(m) || m.spawnT > 0 || m.y < y0 - 10 || m.y > y0 + vh + 10) continue;
          const f = Math.max(0.4, 1 - Math.hypot(m.x - x, m.y - y) / D);
          v6Hit(m, c.hit * c.r * f, c.o, { kb: 70 * f, sx: x, sy: y });
          if (alive(m) && m.v6m && m.v6m.t > G.t && typeof v6React === "function") {
            const mk = m.v6m.el;
            m.v6m = null;
            v6React(m, mk, V6_COUNTER[mk], c.g);
          }
        }
        v6Fx({ k: "ring", x, y: y - 3, r: 70 * c.n, life: 0.6, col: "#fff2c0", grow: 1 });
        burst(x, y - 6, 40, ["#ffffff", "#ffe8b0", "#c8a070"], 200, { z: 10, glow: 1 });
        shake(0.3);
      });
      return true;
    },
    // 赤紅岩石：擊退＋撞擊＋暈眩
    crimson(c) {
      if (!v6Need(c)) return false;
      const { p, tgt } = c,
        R = 26 * c.n,
        x = tgt.x,
        y = tgt.y;
      p.anim = { k: "cast", t: 0, dur: 0.45, a: c.ang, big: 1 };
      v6Fx({ k: "warn", x, y: y - 3, r: R, life: 0.35, col: "#ff5a3a" });
      v6Ro("mg_crimson", x, y);
      later(0.35, () => {
        const hit = new Set(v6Near(x, y, R));
        for (const m of hit) {
          v6Hit(m, c.hit * c.r, c.o, { kb: 220, sx: x, sy: y });
          v6Stun(m, 1.5);
        }
        burst(x, y - 6, 22, ["#ff5a3a", "#ffb070", "#7a2a10"], 140, { z: 6, glow: 1 });
        shake(0.14);
        later(0.18, () => {
          for (const k of hit) {
            if (!alive(k)) continue;
            for (const o of v6Near(k.x, k.y, 9 + (k.boss ? 6 : 0))) {
              if (hit.has(o)) continue;
              hit.add(o);
              v6Hit(o, c.hit * c.r * 0.5, c.o, { kb: 80, sx: k.x, sy: k.y });
              burst(o.x, o.y - 5, 6, ["#ffb070", "#7a2a10"], 60, { z: 4 });
            }
          }
        });
      });
      return true;
    },
    // 雙重施法：增益
    dcast(c) {
      const { p } = c;
      p.anim = { k: "cast", t: 0, dur: 0.35, a: c.ang };
      V83.dc = G.t + 8;
      v6Fx({ k: "ring", x: p.x, y: p.y - 3, r: 16, life: 0.5, col: "#c8b0ff", grow: 1 });
      v6Ro("mg_dcast", p.x, p.y);
      num(p.x, p.y - 30, "雙重施法", "#c8b0ff");
      return true;
    },
    // 蜘蛛網：8 秒的地面陷阱，黏住踏入的敵人；被黏住時火屬性傷害 ×2
    fiber(c) {
      if (!v6Need(c)) return false;
      const { p, tgt } = c,
        R = 24 * c.n,
        x = tgt.x,
        y = tgt.y;
      p.anim = { k: "cast", t: 0, dur: 0.4, a: c.ang };
      v6Ro("mg_fiber", x, y);
      v6Ent({
        zone: 1,
        life: 8,
        iv: 0.2,
        x,
        y,
        tick: () => {
          for (const m of v6Near(x, y, R)) {
            if (m.v84webCd > G.t) continue;
            const k = m.boss ? 0.25 : m.elite ? 0.6 : 1;
            v6Hit(m, c.hit * c.r, c.o, { kb: 0 });
            m.root = Math.max(m.root || 0, 2 * k);
            m.v84web = G.t + Math.max(1, 2 * k);
            m.v84webCd = G.t + 3;
          }
        },
        gdraw: (e, cx) => v83DrawWeb(cx, x, y, R, Math.min(1, e.t * 4, (e.life - e.t) * 2)),
      });
      return true;
    },
    // 鑽石星塵：凍結 → 解凍時碎裂
    ddust(c) {
      if (!v6Need(c)) return false;
      const { p, tgt } = c,
        R = 30 * c.n,
        x = tgt.x,
        y = tgt.y;
      p.anim = { k: "cast", t: 0, dur: 0.5, a: c.ang, big: 1 };
      v6Ro("mg_ddust", x, y);
      later(0.25, () => {
        for (const m of v6Near(x, y, R)) {
          v6Hit(m, c.hit * c.r, c.o, { kb: 0 });
          if (!alive(m)) continue;
          v6Stun(m, 1.5);
          m.v84fz = { end: G.t + 1.5, acc: 0 };
          later(1.5, () => v83Shatter(m));
        }
      });
      return true;
    },
    // 大地之墳：岩石牢籠
    egrave(c) {
      if (!v6Need(c)) return false;
      const { p, tgt } = c,
        R = 24 * c.n,
        x = tgt.x,
        y = tgt.y;
      p.anim = { k: "cast", t: 0, dur: 0.45, a: c.ang };
      v6Ro("mg_egrave", x, y);
      const caged = new Set(v6Near(x, y, R));
      for (const m of caged) v6Hit(m, c.hit * c.r, c.o, { kb: 0 });
      v6Ent({
        zone: 1,
        life: 3,
        iv: 0.5,
        x,
        y,
        upd: () => {
          for (const m of caged) {
            if (!alive(m) || m.boss) continue;
            const dx = m.x - x,
              dy = (m.y - y) / 0.7,
              d = Math.hypot(dx, dy),
              lim = R * 0.85;
            if (d > lim && d > 0) {
              m.x = x + (dx / d) * lim;
              m.y = y + (dy / d) * lim * 0.7;
            }
          }
        },
        tick: () => {
          for (const m of G.mobs) if (alive(m) && m.spawnT <= 0 && inCage(m, x, y, R)) v6Hit(m, c.hit * c.r * 0.5, c.o, { kb: 0 });
        },
        draw: (e, cx) => v83DrawCage(cx, x, y, R, e.t, e.life, 7 + 2 * c.n),
      });
      return true;
    },
    // 念力波：從自身向前推出 3 道扇形波
    pwave(c) {
      if (!v6Need(c)) return false;
      const { p } = c,
        ang = c.ang,
        R = 62 * c.n,
        h = 0.55;
      setFace(ang);
      p.anim = { k: "cast", t: 0, dur: 0.45, a: ang, big: 1 };
      for (let w = 0; w < 3; w++)
        later(0.18 * w, () => {
          if (G.dead) return;
          const rr = R * (0.55 + 0.225 * w);
          for (const m of v6Cone(p.x, p.y - 3, ang, h, rr)) v6Hit(m, c.hit * c.r, c.o, { kb: 70, sx: p.x, sy: p.y });
          v6Fx({ k: "cone", x: p.x, y: p.y - 3, a: ang, h, R: rr, life: 0.25, col: "#b89aff" });
          v6Ro("mg_pwave", p.x + Math.cos(ang) * rr * 0.7, p.y + Math.sin(ang) * rr * 0.5);
        });
      return true;
    },
  });
  // 施放距離與時機
  V6_ALWAYS.add("dcast");
  const rd = v6Ready,
    rg = v6Range;
  v6Range = function (g, ...a) {
    const k = SKILLS[g.id]?.v6;
    if (k === "pwave") return 50 * PS.area * (1 + gemMods(g).area);
    return rg.call(this, g, ...a);
  };
  v6Ready = function (g, ...a) {
    const k = SKILLS[g.id]?.v6;
    if (k === "dcast") return !G.dead && !(V83.dc > G.t) && mobsNear(G.pl.x, G.pl.y - 3, 2 * PS.range + 30).length > 0;
    return rd.call(this, g, ...a);
  };
}
// 蜘蛛網、岩石牢籠的繪圖
function v83DrawWeb(cx, x, y, R, al) {
  cx.save();
  cx.globalAlpha = 0.6 * al;
  cx.strokeStyle = "#eef0f6";
  cx.lineWidth = 0.6;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    cx.beginPath();
    cx.moveTo(x, y - 3);
    cx.lineTo(x + Math.cos(a) * R, y - 3 + Math.sin(a) * R * 0.7);
    cx.stroke();
  }
  for (let k = 1; k <= 3; k++) {
    cx.beginPath();
    for (let i = 0; i <= 8; i++) {
      const a = (i * Math.PI) / 4,
        rr = (R * k) / 3,
        px = x + Math.cos(a) * rr,
        py = y - 3 + Math.sin(a) * rr * 0.7;
      i ? cx.lineTo(px, py) : cx.moveTo(px, py);
    }
    cx.stroke();
  }
  cx.restore();
}
function v83DrawCage(cx, x, y, R, t, life, h) {
  const up = Math.min(1, t * 6),
    down = Math.min(1, (life - t) * 3),
    k = Math.min(up, down),
    n = 12;
  cx.save();
  for (let i = 0; i < n; i++) {
    const a = (i * Math.PI * 2) / n,
      sx = x + Math.cos(a) * R,
      sy = y + Math.sin(a) * R * 0.7,
      H = h * k * (0.85 + 0.3 * ((i * 7) % 3) / 2),
      w = h * 0.3;
    cx.fillStyle = "#5a3e22";
    cx.beginPath();
    cx.moveTo(sx - w, sy);
    cx.lineTo(sx + w * 0.15, sy - H);
    cx.lineTo(sx + w, sy);
    cx.closePath();
    cx.fill();
    cx.fillStyle = "#c89a5a";
    cx.beginPath();
    cx.moveTo(sx - w * 0.55, sy);
    cx.lineTo(sx + w * 0.15, sy - H);
    cx.lineTo(sx, sy);
    cx.closePath();
    cx.fill();
  }
  cx.restore();
}
// 鑽石星塵：解凍碎裂
function v83Shatter(m) {
  const f = m.v84fz;
  if (!f) return;
  m.v84fz = null;
  if (!alive(m)) return;
  const d = f.acc * 0.4;
  if (d > 0) {
    dealMob(m, d, false);
    num(m.x, m.y - (m.h || 12) - 6, typeof fmt === "function" ? fmt(d) : String(Math.round(d)), "#bfefff");
  }
  for (const o of v6Near(m.x, m.y, 22)) if (alive(o) && !(o.v6m && o.v6m.t > G.t)) o.v6m = { el: "water", t: G.t + V6_MARK_T };
  burst(m.x, m.y - 6, 12, ["#ffffff", "#bfefff", "#5aa8e8"], 90, { z: 6, glow: 1 });
  v6Ro("mg_ddust2", m.x, m.y);
}

// ---------------------------------------------------------------------------
// 3. 輔助與增益的效果
const V83_DC_OK = (id) => {
  const s = SKILLS[id];
  return !!s && s.act && !s.sus && (s.tg || []).includes("spell") && ((s.tg || []).includes("proj") || ["mg_bolt", "mg_mcrash"].includes(id));
};
const V83_NOECHO = (id) => {
  const s = SKILLS[id];
  return !s || !s.act || s.sus || (s.tg || []).includes("minion") || V6_ALWAYS.has(s.v6) || ["base:summon", "base:guard", "base:turret"].includes("base:" + (s.roBase || ""));
};
// 再施放一次（不打斷角色目前的動作：原本的回音施放會播放施法動作，佔用下一個技能的施放時間）
function v83Echo(g, mult, delay) {
  later(delay, () => {
    if (!G?.pl || G.dead || roEcho || !placed().includes(g)) return;
    const p = G.pl,
      an = p.anim,
      face = p.face;
    roEcho = true;
    try {
      castSkill(g, mult);
    } finally {
      roEcho = false;
      p.anim = an;
      p.face = face;
    }
  });
}
function v83Effects() {
  // 施放：雙重施法、咒文書解放、法術拳
  const cs = castSkill;
  castSkill = function (g, a = 1, ...x) {
    const r = cs.call(this, g, a, ...x);
    if (r === false || !g || !SKILLS[g.id] || typeof roEcho === "undefined") return r;
    try {
      const echo = roEcho;
      if (!echo && V83.dc > G.t && V83_DC_OK(g.id) && RAND() < 0.5) v83Echo(g, 0.7 * a, 0.15);
      else if (!echo && v6Linked(g, "mg_release") && !V83_NOECHO(g.id)) v83Echo(g, 0.6 * a, 1);
      if (!echo && v6Linked(g, "mg_sfist") && SKILLS[g.id].act && !SKILLS[g.id].sus) {
        const m = gemMods(g),
          sk = SKILLS[g.id];
        V83.fist = { n: 3, mult: (sk.est ? sk.est(m, PS, 1) : sk.hit || 0) * (1 + m.dmg) * 0.15, o: { skill: 1, v83fist: 1, tg: sk.tg, v6sk: g.id, v6el: sk.el, crit: m.crit, critm: m.critm } };
      }
    } catch (e) {}
    return r;
  };
  // 冷卻：咒文書解放 +25%（gemMods 的 cd 為縮減值，這裡以負值加入）
  SKILLS.mg_release.mod = { cd: -0.25 };
  SKILLS.mg_memo.mod = { cd: 0.15 };
  // 擊中：法術拳追加傷害、靈魂吸取
  const fi = fire;
  fire = function (t, a, s, e, n) {
    if (t === "hit") {
      try {
        v83OnHit(a, s, e, n);
      } catch (er) {}
    } else if (t === "cast" && a && !roEcho) {
      try {
        v83MemoCast(a);
      } catch (er) {}
    }
    return fi.call(this, t, a, s, e, n);
  };
  // 蜘蛛網：被黏住的敵人受到的火屬性傷害 ×2；魔力粉碎：對護盾 2 倍
  const hm = hitMob;
  hitMob = function (m, mult, o = {}, ...x) {
    if (m && o && mult > 0) {
      if (m.v84web > G.t && v83IsFire(o)) mult *= 2;
      if (o.v6sk === "mg_mcrash" && m.sh > 0) mult *= 2;
    }
    return hm.call(this, m, mult, o, ...x);
  };
  // 鑽石星塵：凍結期間累積受到的傷害
  const dm = dealMob;
  dealMob = function (t, a, ...x) {
    if (t && t.v84fz && a > 0 && G.t < t.v84fz.end) t.v84fz.acc += a;
    return dm.call(this, t, a, ...x);
  };
  // 記憶術：充能回復
  const tk = tick;
  tick = function (dt, ...x) {
    const r = tk.call(this, dt, ...x);
    try {
      if (S && G?.pl && !G.dead) v83MemoTick(dt);
    } catch (e) {}
    return r;
  };
}
const v83IsFire = (o) => o.v6el === "fire" || o.ail === "brn" || SKILLS[v83SkillOf(o)]?.el === "fire";
// 記憶術：每顆相鄰的技能最多預存 2 次施放
const v83MemoT = (g) => SKILLS[g.id].cd * (1 - gemMods(g).cd) * (1 - PS.cdr / 100) * (typeof kingCd === "function" ? kingCd() : 1);
function v83MemoCast(g) {
  if (!SKILLS[g.id]?.act || SKILLS[g.id].sus || !v6Linked(g, "mg_memo")) return;
  const st = (g.v84ch ||= { n: 2, r: 0 });
  st.n = Math.max(0, st.n - 1);
  const T = v83MemoT(g);
  G.pl.cds[g.u] = st.n > 0 ? 0.4 : Math.max(0.4, T - st.r);
}
function v83MemoTick(dt) {
  for (const g of activeGems()) {
    if (!g.v84ch || !v6Linked(g, "mg_memo")) continue;
    const st = g.v84ch;
    if (st.n >= 2) {
      st.r = 0;
      continue;
    }
    st.r += dt;
    const T = v83MemoT(g);
    if (st.r >= T) {
      st.n++;
      st.r -= T;
      if (st.n >= 2) st.r = 0;
    }
  }
}
function v83SkillOf(o) {
  if (!o) return null;
  if (o.v6sk) return o.v6sk;
  if (!o.tg) return null;
  if (!V83.tg) {
    V83.tg = new Map();
    for (const [id, s] of Object.entries(SKILLS)) if (s.tg && !V83.tg.has(s.tg)) V83.tg.set(s.tg, id);
  }
  return V83.tg.get(o.tg) || null;
}
function v83OnHit(mob, dmg, crit, o) {
  if (!mob || !G?.pl) return;
  // 法術拳：普通攻擊（非技能）命中時追加
  const f = V83.fist;
  if (f && f.n > 0 && !(o && (o.skill || o.min || o.v83fist))) {
    f.n--;
    if (f.n <= 0) V83.fist = null;
    if (alive(mob) && f.mult > 0) {
      hitMob(mob, f.mult, Object.assign({}, f.o));
      burst(mob.x, mob.y - 6, 6, ["#ffd27a", "#ffffff"], 70, { z: 6 });
    }
  }
  // 靈魂吸取：相鄰技能擊殺
  if (!(mob.hp > 0) && !mob.v83sd && o && o.skill) {
    const id = v83SkillOf(o);
    if (!id) return;
    const g = placed().find((x) => x.id === id && v6Linked(x, "mg_sdrain"));
    if (!g) return;
    mob.v83sd = 1;
    S.hp = Math.min(PS.maxhp, S.hp + PS.maxhp * 0.02);
    const cds = G.pl.cds;
    if (cds && cds[g.u] > 0) cds[g.u] = Math.max(0, cds[g.u] - 0.3);
  }
}

// ---------------------------------------------------------------------------
// 4. 預估傷害（多段技能以單一目標的總段數計算）、特效、說明
const V83_EST = { mg_nvulcan: 12, mg_ddust: 1.4, mg_pwave: 3, mg_egrave: 4, mg_comet: 1, mg_crimson: 1, mg_fiber: 1 };
// 特效：依序使用第一個可用的設定（RO 原版 .str 優先；尚未下載時用遊戲內現有的特效）
const V83_FX = {
  mg_nvulcan: [{ str: ["shockwavehit"], target: 1 }, { strip: "mg_napalm", target: 1 }],
  mg_mcrash: [{ str: ["magical"], target: 1 }, { strip: "mg_soul", target: 1 }],
  mg_comet: [{ str: ["meteor1", "dust"], target: 1 }, { str: ["meteor1"], target: 1 }],
  mg_crimson: [{ str: ["crimson_r"], target: 1 }, { str: ["firehit2", "firehit3"], target: 1 }],
  mg_dcast: [{ str: ["spell"], self: 1 }, { custom: "aura", self: 1 }],
  mg_ddust: [{ str: ["freezing"], target: 1 }, { str: ["freeze"], target: 1 }],
  mg_ddust2: [{ str: ["icecrash"], target: 1 }, { str: ["freeze"], target: 1 }],
  mg_egrave: [{ str: ["crashearth"], target: 1 }],
  mg_pwave: [{ str: ["mentalbreak"], target: 1 }, { strip: "mg_gravity", target: 1 }],
};
function v83Finish() {
  for (const [id, k] of Object.entries(V83_EST))
    if (SKILLS[id]) {
      const sk = SKILLS[id];
      sk.est = () => sk.hit * k;
    }
  if (SKILLS.mg_mcrash) SKILLS.mg_mcrash.est = () => SKILLS.mg_mcrash.hit * 1.1;
  if (typeof roFxProfiles !== "undefined") {
    const D = typeof V78_FX_DATA !== "undefined" ? V78_FX_DATA : null;
    for (const [id, list] of Object.entries(V83_FX)) {
      const p = list.find((q) => !q.str || (typeof roFxNative === "function" && q.str.every((n) => roFxNative(n))));
      if (!p) continue;
      roFxProfiles[id] = p;
      if (p.strip && D?.custom?.[p.strip] && typeof V78_STRIP !== "undefined" && !V78_STRIP.img[p.strip] && typeof Image !== "undefined") {
        const im = new Image();
        im.onload = () => (V78_STRIP.img[p.strip] = im);
        im.src = D.custom[p.strip].file;
      }
    }
  }
  // 增益圖示：雙重施法剩餘時間
  if (typeof HUD_BUFF !== "undefined")
    HUD_BUFF.push({
      k: "v83dc",
      n: () => (V83.dc > G.t ? 1 : 0),
      left: () => Math.max(0, V83.dc - G.t),
      bg: "#5a3a9a",
      fg: "#efe6ff",
      tc: "#c8b0ff",
      tip: (n, l) => ["雙重施法", [`剩餘 ${l.toFixed(1)} 秒`, "投射類魔法施放時有 50% 機率再施放一次（70% 傷害）"]],
      art: ["XX...XX", "X.X.X.X", "X..X..X", ".......", "X..X..X", "X.X.X.X", "XX...XX"],
    });
  // 新角色、換地圖時清掉暫存
  if (typeof startGame === "function") {
    const sg = startGame;
    startGame = function (...a) {
      V83.dc = 0;
      V83.fist = null;
      return sg.apply(this, a);
    };
  }
}
function v83Install() {
  if (typeof V6_CAST === "undefined" || !SKILLS.mg_nvulcan) return;
  v83Moves();
  v83Effects();
  v83Finish();
}
if (typeof roV4Install === "function") {
  const r4v83 = roV4Install;
  roV4Install = function () {
    r4v83();
    v83Install();
  };
}
