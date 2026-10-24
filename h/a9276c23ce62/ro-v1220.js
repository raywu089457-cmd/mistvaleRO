/* 流浪仙境 v1.2.20：組隊副本數值與規則調整（大部分改在 ro-v1213.js、ro-v1214.js、ro-v1215.js、ro-v1216.js）
   這個檔案：
   ・羈絆之戒在組隊副本以外：召喚英靈——生命為你最大生命的 70%，每 5 秒嘲諷附近的敵人（被嘲諷的敵人改打英靈），不會攻擊；
     英靈倒下後 30 秒再次召喚。英靈的外觀是你自己的角色（半透明金色），受到的傷害比照守護者（閃避、護甲減傷）。
     組隊副本中維持原本的隊友加成（每名存活的隊友傷害 +5%、受到的傷害 −3%）。
   ・隊伍排行：隊員的構築快照畫面加上「返回隊伍」 */

const V1220 = { hp: 0.7, tnt: 5, r: 56, cd: 30, follow: 90, leash: 140, col: "#ffd86a" };

function v1220On() {
  if (!S || !G || !G.pl || !PS || !PS.U || !PS.U.v1213_bond || G.dead) return false;
  if (typeof V1213 !== "undefined" && V1213.run) return false;
  if (typeof v113In === "function" && v113In()) return false;
  return true;
}
const v1220Sp = () => (G && G.v1220 && G.v1220.sp) || null;

// ---------------------------------------------------------------------------
// 1. 英靈：召喚、跟隨、嘲諷
function v1220Tick(dt) {
  if (!G) return;
  const Q = (G.v1220 ||= { sp: null, cd: 0 });
  if (!v1220On()) {
    if (Q.sp) Q.sp = null;
    return;
  }
  Q.cd = Math.max(0, Q.cd - dt);
  const p = G.pl,
    max = PS.maxhp * V1220.hp;
  let e = Q.sp;
  if (!e) {
    if (Q.cd > 0) return;
    e = Q.sp = { v1220: 1, x: clamp(p.x + 12, 6, G.W - 6), y: p.y, hp: max, max, t: 0, tn: 0.5, face: 1, hurt: 0, mv: 0, walkT: 0 };
    try {
      roPushFx(G.fx, { k: "ring", x: e.x, y: e.y, r: 14, t: 0, life: 0.45, col: V1220.col });
      num(e.x, e.y - 24, "英靈", V1220.col);
    } catch (x) {}
  }
  if (max > 0 && Math.abs(max - e.max) > 0.5) {
    e.hp *= max / e.max;
    e.max = max;
  }
  e.hp = Math.min(e.max, e.hp + ((e.max * (PS.regen || 0)) / Math.max(1, PS.maxhp)) * dt);
  e.t += dt;
  e.hurt = Math.max(0, e.hurt - dt);
  // 有被自己嘲諷的敵人：站到最近的那隻旁邊擋住（離角色太遠時回來）；
  // 否則擋在角色與最近的敵人之間；沒有敵人時跟在角色旁邊
  let tgt = null,
    bd = V1220.follow,
    hold = null,
    hd = 1e9;
  for (const m of G.mobs) {
    if (!alive(m) || m.spawnT > 0 || m.dm) continue;
    const d = Math.hypot(m.x - p.x, m.y - p.y);
    if (d < bd) (bd = d), (tgt = m);
    if (m.v1220tn > 0 && d < V1220.leash) {
      const k = Math.hypot(m.x - e.x, m.y - e.y);
      if (k < hd) (hd = k), (hold = m);
    }
  }
  let tx, ty;
  if (hold) {
    const a = Math.atan2(hold.y - e.y, hold.x - e.x),
      st = hold.boss ? 14 : 7;
    tx = hold.x - Math.cos(a) * st;
    ty = hold.y - Math.sin(a) * st;
    tgt = hold;
  } else if (tgt) {
    const a = Math.atan2(tgt.y - p.y, tgt.x - p.x),
      d = Math.max(0, bd - (tgt.boss ? 18 : 11));
    tx = p.x + Math.cos(a) * Math.min(d, 46);
    ty = p.y + Math.sin(a) * Math.min(d, 46);
  } else {
    const side = Math.cos(p.face || 0) >= 0 ? 1 : -1;
    tx = p.x + side * 18;
    ty = p.y - 2;
  }
  const dx = tx - e.x,
    dy = ty - e.y,
    d = Math.hypot(dx, dy);
  if (d > 160) {
    e.x = tx;
    e.y = ty;
    e.mv = 0;
  } else if (d > 2) {
    const sp = Math.min(d, Math.max(36, (PS.move || 40) * 1.15) * dt);
    e.x += (dx / d) * sp;
    e.y += (dy / d) * sp;
    e.mv = 1;
    if (Math.abs(dx) > 0.5) e.face = dx > 0 ? 1 : -1;
  } else e.mv = 0;
  if (tgt) e.face = tgt.x < e.x ? -1 : 1;
  e.x = clamp(e.x, 6, G.W - 6);
  e.y = clamp(e.y, (G.top || 0) + 8, G.H - 4);
  if (e.mv) e.walkT += dt;
  // 每 5 秒嘲諷附近的敵人
  e.tn -= dt;
  if (e.tn <= 0) {
    e.tn = V1220.tnt;
    let n = 0;
    for (const m of mobsNear(e.x, e.y - 3, V1220.r)) {
      if (!alive(m) || m.dm) continue;
      m.ag = true;
      m.v1220tn = V1220.tnt + 0.25;
      m.flash = Math.max(m.flash || 0, 0.06);
      n++;
    }
    try {
      roPushFx(G.fx, { k: "ring", x: e.x, y: e.y - 3, r: V1220.r, t: 0, life: 0.4, col: V1220.col });
      if (n) num(e.x, e.y - 26, "嘲諷", V1220.col);
    } catch (x) {}
  }
  for (const m of G.mobs) if (m.v1220tn > 0) m.v1220tn -= dt;
}
// 英靈受到傷害（比照守護者：閃避、護甲減傷、衰弱詛咒）
function v1220Hurt(e, a, s) {
  if (!e || !(e.hp > 0)) return;
  if (100 * RAND() < (PS.dodge || 0)) return void num(e.x, e.y - 20, "MISS", "#c8d0e0");
  const d = a * (1 - (PS.armRed || 0) / 100) * (s && typeof cursed === "function" && cursed(s, "wk") ? 1 - CRS.wk.v * PS.crs : 1);
  e.hp -= d;
  e.hurt = 0.15;
  num(e.x, e.y - 20, d, "#ffe6a0");
  if (e.hp > 0) return;
  const Q = G.v1220;
  if (Q && Q.sp === e) {
    Q.sp = null;
    Q.cd = V1220.cd;
  }
  for (const m of G.mobs) m.v1220tn = 0;
  try {
    burst(e.x, e.y - 8, 18, [V1220.col, "#fff6d8", "#c09030"], 70, { z: 8, life: 0.5, glow: 1 });
  } catch (x) {}
  toast(`英靈消散了（${V1220.cd} 秒後再次召喚）`, "bad");
}

// ---------------------------------------------------------------------------
// 2. 畫英靈：用自己角色的外觀（半透明金色）
function v1220Fake() {
  const Q = G.v1220,
    key = [S.cls, S.tal?.asc || "", S.sex || "m", S.lvl].join("|");
  if (Q.fake && Q.fakeK === key) return Q.fake;
  let st = null;
  try {
    st = (typeof v1213Quiet === "function" ? v1213Quiet : (f) => f())(() => newState(S.cls));
    st.tal = { ...(st.tal || {}), asc: S.tal?.asc };
    st.lvl = S.lvl;
    st.sex = S.sex;
  } catch (x) {
    st = null;
  }
  Q.fake = st;
  Q.fakeK = key;
  return st;
}
function v1220Draw(c, dp, a) {
  const e = v1220Sp();
  if (!e) return;
  const st = v1220Fake();
  c.save();
  c.globalAlpha = 0.32;
  c.fillStyle = V1220.col;
  c.beginPath();
  c.ellipse(e.x, e.y, 7, 2.6, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
  if (st) {
    const p = (e.pl ||= { x: e.x, y: e.y, vx: 0, vy: 0, face: 0, dir: "down", anim: null, moving: 0, walkT: 0, hurt: 0, sus: {}, stk: {} });
    p.x = e.x;
    p.y = e.y;
    p.moving = e.mv ? 1 : 0;
    p.walkT = e.walkT;
    p.face = e.face < 0 ? Math.PI : 0;
    p.hurt = e.hurt;
    const s0 = S,
      p0 = G.pl,
      d0 = G.dead,
      V = typeof V1213 !== "undefined" ? V1213 : null;
    S = st;
    G.pl = p;
    G.dead = 0;
    c.save();
    c.globalAlpha = 0.72;
    try {
      c.filter = "sepia(0.8) saturate(1.8) brightness(1.25)";
    } catch (x) {}
    try {
      if (V) V.drawing++;
      dp.call(this, c, ...a);
    } catch (x) {
    } finally {
      if (V) V.drawing--;
      c.restore();
      S = s0;
      G.pl = p0;
      G.dead = d0;
    }
  }
  // 生命條
  const w = 16,
    x = Math.round(e.x - w / 2),
    y = Math.round(e.y - 27);
  c.fillStyle = "#1a1408cc";
  c.fillRect(x - 1, y - 1, w + 2, 4);
  c.fillStyle = V1220.col;
  c.fillRect(x, y, Math.max(0, Math.round((w * e.hp) / e.max)), 2);
}

// ---------------------------------------------------------------------------
// 3. 安裝
function v1220Install() {
  // 英靈的每格更新（ro-v1213-base.js 的最內層；組隊副本中不召喚）
  if (typeof V1213B !== "undefined" && Array.isArray(V1213B.post)) V1213B.post.push((dt) => v1220Tick(dt || 0));
  // 被英靈嘲諷的敵人改打英靈（自己的嘲諷優先）
  const fo = foeOf;
  foeOf = function (m, ...x) {
    const e = v1220Sp();
    if (e && m && m.v1220tn > 0 && !(m.tnt > 0) && e.hp > 0 && !(typeof V1213 !== "undefined" && V1213.run)) return e;
    return fo.call(this, m, ...x);
  };
  const gh = gspHurt;
  gspHurt = function (t, ...x) {
    if (t && t.v1220) return v1220Hurt(t, ...x);
    return gh.call(this, t, ...x);
  };
  // 畫面：英靈畫在角色前或後（依上下位置）
  const dp = drawPlayer;
  drawPlayer = function (c, ...a) {
    const e = v1220Sp();
    if (!e || (typeof V1213 !== "undefined" && (V1213.run || V1213.drawing))) return dp.call(this, c, ...a);
    const back = e.y < G.pl.y;
    if (back) v1220Draw.call(this, c, dp, a);
    const r = dp.call(this, c, ...a);
    if (!back) v1220Draw.call(this, c, dp, a);
    return r;
  };
  // 隊伍排行：隊員的構築快照加上「返回隊伍」
  if (typeof ui !== "undefined" && ui.snapOpen) {
    const so = ui.snapOpen;
    ui.snapOpen = function (t, ...x) {
      const r = so.call(this, t, ...x);
      try {
        if (t && t.v1213) {
          const sh = $("#sheet"),
            cl = sh && sh.querySelector('[data-act="close"]');
          if (cl && !sh.querySelector(".v1220back")) cl.insertAdjacentHTML("beforebegin", `<button class="btn v1220back" data-v1213="rkv" data-id="${esc(t.v1213)}">返回隊伍</button>`);
        }
      } catch (e) {}
      return r;
    };
  }
}

if (typeof roV4Install === "function") {
  const r4v1220 = roV4Install;
  roV4Install = function () {
    r4v1220.apply(this, arguments);
    try {
      v1220Install();
    } catch (e) {
      console.error("v1220", e);
    }
  };
}
