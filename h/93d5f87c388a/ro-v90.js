/* 流浪仙境 v9.0：獨特裝備汰換——與原作 Auto Wanderer 太相似的 10 件獨特，新掉落改為新的獨特（效果參考 POE 機制）；
   已持有的舊裝備名稱與效果完全不變，只是不再掉落。MVP 專屬 3 件維持原名、只換效果。 */

// 停止掉落的舊獨特（原本的掉落來源）
const V90_OLD = { ro44_legion: "map", ro44_viper: "map", ro44_crusader: "map", ro44_warlord: "map", ro44_star: "season", ro44_king: "arena", ro44_fist: "arena" };
// MVP 專屬：MVP → 新的獨特
const V90_MVP = { dracula: "v90_dracula", maya: "v90_maya", drake: "v90_drake" };
const V90_ICONS = [2408, 2421, 2519, 2341, 2620]; // 新加入的 RO 道具圖（獨特武器的圖示跟著職業武器種類，不需要）
const V90_K = {
  sacR: 30, // 獻祭爆炸半徑
  sacBuff: 5, // 不潔之力秒數
  endMax: 3,
  endT: 10,
  endIv: 2, // 另外每 2 秒自動獲得 1 個耐力球
  endWin: 1, // 耐力球爆發：施放後這段時間內的技能傷害加成與擊暈
  endStun: 1,
  impMax: 5,
  impT: 8,
  powMax: 3,
  powT: 8,
  elT: 3, // 飄忽持續
  elCd: 3,
  ancN: 2, // 先祖：額外打擊的敵人數
  ancR: 50,
  ancStun: 0.5,
  bldMax: 5, // 德古拉：流血層數
  fortMax: 10,
  fortT: 6,
  vxT: 2, // 漩渦持續
  vxStep: 14, // 每移動這段距離留下一個漩渦
  vxR: 16,
  vxN: 10,
};

(function () {
  const A = typeof window !== "undefined" && window.RO_ASSETS;
  if (!A) return;
  A.items ||= {};
  for (const id of V90_ICONS) A.items[id] ||= { file: `items/${id}.png`, width: 24, height: 24 };
})();

const v90On = (k) => !!(PS && PS.U && PS.U[k]);
const v90Stun = (m, d) => {
  if (alive(m) && !m.boss && G.t >= (m.sti || 0)) (m.stn = Math.max(m.stn || 0, d)), (m.sti = G.t + 2);
};
const v90Live = (o) => !!(o && o.t > G.t && o.n > 0);
// 飄忽的剩餘強度（1 → 0）
const v90ElF = () => (G.v90el != null && G.t < G.v90el + V90_K.elT ? 1 - (G.t - G.v90el) / V90_K.elT : 0);

// 1. 獻祭之靴：定時獻祭最近的召喚物
function v90SacTick(dt) {
  if (!S || G.dead) return;
  const iv = uv("v90_sac", 0);
  G.v90sacT = (G.v90sacT || 0) + dt;
  if (G.v90sacT < iv) return;
  const p = G.pl,
    mins = (G.mins || []).filter((m) => m && m.x != null);
  if (!mins.length) return void (G.v90sacT = iv);
  const m = mins.reduce((a, b) => (Math.hypot(b.x - p.x, b.y - p.y) < Math.hypot(a.x - p.x, a.y - p.y) ? b : a));
  G.mins.splice(G.mins.indexOf(m), 1);
  G.v90sacT = 0;
  G.v90sacB = G.t + V90_K.sacBuff;
  const R = V90_K.sacR * (PS.area || 1),
    x = m.x,
    y = m.y - 3;
  roPushFx(G.fx, { k: "boom", x, y, r: 0.6 * R, t: 0, life: 0.35, c: "#9a5aff" });
  G.flashes.push({ x, y, t: 0, ring: 1, c: "#c08aff" });
  sfx("big");
  const k = uv("v90_sac", 1) / 100;
  for (const e of mobsNear(x, y, R)) hitMob(e, k, { min: 1, sx: x, sy: y, kb: 30, nomom: 1, v88oh: 1, v90: 1 });
}
// 3. 聖騎士鎧甲：耐力球
function v90EndGain() {
  const o = G.v90end;
  G.v90end = { n: Math.min(V90_K.endMax, (v90Live(o) ? o.n : 0) + 1), t: G.t + V90_K.endT };
}
function v90EndCast() {
  const o = G.v90end;
  if (!v90Live(o) || o.n < V90_K.endMax) return;
  G.v90end = null;
  G.v90endB = G.t + V90_K.endWin;
  G.flashes.push({ x: G.pl.x, y: G.pl.y - 10, t: 0, ring: 1, c: "#ffe08a" });
}
// 4. 貫穿者：穿刺
function v90ImpHit(m, dmg, s) {
  if (!alive(m) || !s || s.min || s.v90) return;
  const r = m.v90imp;
  if (v90Live(r)) {
    r.n--;
    dealMob(m, dmg * (uv("v90_impale", 1) / 100), false, "#e8eef8", "uq:v90_impale");
  }
  if (alive(m) && RAND() < uv("v90_impale", 0) / 100) m.v90imp = { n: Math.min(V90_K.impMax, (v90Live(r) ? r.n : 0) + 1), t: G.t + V90_K.impT };
}
// 5. 榮耀之戒：暴擊球
function v90PowGain(n) {
  const o = G.v90pow;
  G.v90pow = { n: Math.min(V90_K.powMax, (v90Live(o) ? o.n : 0) + n), t: G.t + V90_K.powT };
}
// 6. 幻影之靴：飄忽的閃避
function v90ElDodge() {
  const f = v90ElF();
  if (f <= 0 || RAND() * 100 >= uv("v90_phantom", 1) * f) return false;
  num(G.pl.x, G.pl.y - 22, "MISS", "#c8d0e0");
  sfx("miss");
  fire("dodge");
  return true;
}
// 7. 先祖戰魂
function v90AncHit(m, dmg, s) {
  if (!s || !s.ba || s.v90 || s.v88oh || s.min || !m) return;
  G.v90anc = (G.v90anc || 0) + 1;
  const near = mobsNear(m.x, m.y, V90_K.ancR * (PS.area || 1))
    .filter((e) => e !== m && alive(e))
    .sort((a, b) => Math.hypot(a.x - m.x, a.y - m.y) - Math.hypot(b.x - m.x, b.y - m.y))
    .slice(0, V90_K.ancN);
  const k = uv("v90_ancestor", 0) / 100;
  for (const e of near) hitMob(e, k, { ba: 1, v90: 1, v88oh: 1, nomom: 1, kb: 12 });
  if (G.v90anc % 3 === 0 && alive(m)) {
    dealMob(m, dmg * (uv("v90_ancestor", 1) / 100), false, "#ffb04a", "uq:v90_ancestor");
    v90Stun(m, V90_K.ancStun);
    G.flashes.push({ x: m.x, y: m.y - 6, t: 0, ring: 1, c: "#ffb04a" });
  }
}
// 10. 德瑞克的船長靴：鹹水漩渦
function v90DrakeTick(dt) {
  if (!S || G.dead) return;
  const p = G.pl,
    st = (G.v90dk ||= { x: p.x, y: p.y, acc: 0 }),
    vx = (G.v90vx ||= []);
  if (Math.hypot(p.x - st.x, p.y - st.y) >= V90_K.vxStep) {
    vx.push({ x: st.x, y: st.y, t: G.t + V90_K.vxT });
    if (vx.length > V90_K.vxN) vx.shift();
    G.flashes.push({ x: st.x, y: st.y, t: 0, ring: 1, c: "#5ab4ff" });
    st.x = p.x;
    st.y = p.y;
  }
  st.acc += dt;
  if (st.acc < 0.25) return;
  st.acc = 0;
  const slow = uv("v90_drake", 1) / 100,
    R = V90_K.vxR * (PS.area || 1);
  G.v90vx = vx.filter((v) => v.t > G.t);
  for (const v of G.v90vx) {
    G.parts.push({ x: v.x + rf(-6, 6), y: v.y + rf(-3, 3), z: 1, vx: 0, vy: 0, vz: 18, g: 0, life: 0.45, c: RAND() < 0.5 ? "#7ad0ff" : "#c8f0ff", s: 1, glow: 1 });
    for (const e of mobsNear(v.x, v.y, R)) {
      e.chlv = Math.max((e.slow > 0 && e.chlv) || 0, slow);
      e.slow = Math.max(e.slow || 0, 0.5);
      e.v90vt = G.t + 0.5;
    }
  }
}

const V90_UQ = {
  // ---- 地圖掉落 ----
  v90_sac: {
    n: "獻祭之靴", slot: "boots", hi: 2, v: [6, 250, 30, 30], lo: [0], src: "map", ico: 2408,
    mods: (t) => ({ minp: t(3) }),
    on: { tick: (dt) => v90SacTick(dt) },
    hitMul: (d) => (G.v90sacB > G.t ? d * (1 + uv("v90_sac", 2) / 100) : d),
    d: `每 {0} 秒獻祭離你最近的 1 隻召喚物（之後照常重新召喚），在原地爆炸，造成 {1}% 武器傷害（套用召喚物傷害）；之後 ${V90_K.sacBuff} 秒內獲得「不潔之力」：傷害 +{2}%；召喚物傷害 +{3}%`,
  },
  v90_toxic: {
    n: "瘴毒披風", slot: "gloves", hi: 0, v: [2, 30, 4], vi: [0], src: "map", ico: 2519,
    mods: (t) => ({ psnMax: t(0), psn: t(1) }),
    hitMul: (d, m) => (m && m.psn && m.psn.s && m.psn.s.length ? d * (1 + (m.psn.s.length * uv("v90_toxic", 2)) / 100) : d),
    d: "你造成的燃燒與流血全部改為中毒（以原本的傷害計算，套用中毒傷害加成）；中毒上限 +{0} 層；中毒傷害 +{1}%；敵人身上每有 1 層中毒，受到你的擊中傷害 +{2}%",
  },
  v90_paladin: {
    n: "聖騎士鎧甲", slot: "chest", hi: 0, v: [25, 5, 60], src: "map", ico: 2341,
    mods: (t) => ({ armorp: t(0) }),
    on: {
      hurt: () => v90EndGain(),
      tick: (dt) => {
        if ((G.v90endI = (G.v90endI || 0) + dt) >= V90_K.endIv) (G.v90endI = 0), v90EndGain();
      },
      cast: () => v90EndCast(),
      hit: (m, dmg, crit, s) => {
        if (G.v90endB > G.t && s && s.skill) v90Stun(m, V90_K.endStun);
      },
    },
    hitMul: (d, m, s) => (G.v90endB > G.t && s && s.skill ? d * (1 + uv("v90_paladin", 2) / 100) : d),
    d: `護甲 +{0}%；被擊中時與每 ${V90_K.endIv} 秒獲得 1 個耐力球（最多 ${V90_K.endMax} 個，${V90_K.endT} 秒）；每個耐力球使受到的傷害 −{1}%；耐力球滿 ${V90_K.endMax} 個時，下一個主動技能消耗全部耐力球：${V90_K.endWin} 秒內技能傷害 +{2}%，並擊暈一般敵人 ${V90_K.endStun} 秒`,
  },
  v90_impale: {
    n: "貫穿者", slot: "weapon", hi: 0, v: [40, 60], src: "map", ico: 1414,
    on: { hit: (m, dmg, crit, s) => v90ImpHit(m, dmg, s) },
    d: `擊中時 {0}% 機率穿刺敵人（最多 ${V90_K.impMax} 層，${V90_K.impT} 秒）；之後每次擊中被穿刺的敵人，消耗 1 層並額外造成該次傷害的 {1}%`,
  },
  // ---- 活動地圖 ----
  v90_glory: {
    n: "榮耀之戒", slot: "ring", hi: 2, ss: 1, v: [5, 3, 15], src: "season", ico: 2620,
    mods: (t) => ({ crit: t(0) }),
    on: {
      hit: (m, dmg, crit, s) => {
        if (crit && s && !s.min) v90PowGain(1);
      },
      kill: (m) => {
        if (m && (m.elite || m.boss)) v90PowGain(V90_K.powMax);
      },
    },
    d: `暴擊率 +{0}%；暴擊時獲得 1 個暴擊球（最多 ${V90_K.powMax} 個，${V90_K.powT} 秒）；每個暴擊球使暴擊率 +{1}%、暴擊傷害 +{2}%；擊殺菁英或頭目時暴擊球補滿`,
  },
  // ---- 無限武鬥場頭目關 ----
  v90_phantom: {
    n: "幻影之靴", slot: "boots", hi: 2, v: [15, 30, 30, 80], src: "arena", ico: 2421,
    mods: (t) => ({ move: t(0), aspd: t(0) }),
    hitMul: (d) => d * (1 + (uv("v90_phantom", 3) / 100) * v90ElF()),
    on: {
      cast: () => {
        if (G.t < (G.v90elCd || 0)) return;
        G.v90el = G.t;
        G.v90elCd = G.t + V90_K.elCd;
      },
      hurtPre: () => v90ElDodge(),
    },
    d: `移動速度與攻擊速度 +{0}%；施放主動技能後獲得「飄忽」${V90_K.elT} 秒（每 ${V90_K.elCd} 秒最多一次）：額外 {1}% 機率閃避攻擊、移動速度 +{2}%、造成的傷害 +{3}%，效果在持續時間內逐漸減弱`,
  },
  v90_ancestor: {
    n: "先祖戰魂", slot: "weapon", hi: 2, v: [50, 100], src: "arena", ico: 1813,
    on: { hit: (m, dmg, crit, s) => v90AncHit(m, dmg, s) },
    d: `普攻同時打擊附近 ${V90_K.ancN} 個敵人，造成 {0}% 傷害；每第 3 次普攻額外造成該次傷害的 {1}%，並擊暈一般敵人 ${V90_K.ancStun} 秒`,
  },
  // ---- MVP 專屬（名稱不變）----
  v90_dracula: {
    n: "德古拉的禮服", slot: "chest", hi: 2, v: [15, 20, 1, 25], src: "mvp", ico: 2316,
    mods: (t) => ({ res_shadow: t(3) }),
    on: {
      hit: (m, dmg, crit, s) => {
        if (!s || s.min || !alive(m)) return;
        if (m.bld && m.bld.t > 0) heal(dmg * (uv("v90_dracula", 2) / 100));
        if (RAND() < uv("v90_dracula", 0) / 100) ailment(m, "bld", dmg, 1);
      },
    },
    d: `擊中時 {0}% 機率使敵人流血；你的流血可疊加至 ${V90_K.bldMax} 層，每層流血傷害 +{1}%，且不再因敵人移動而加倍；擊中流血中的敵人時吸血 {2}%；暗屬性抗性 +{3}%`,
  },
  v90_maya: {
    n: "蟻后的甲殼盾", slot: "shield", hi: 2, v: [40, 2, 2, 25], src: "mvp", ico: 2104,
    mods: (t) => ({ armorp: t(0), res_earth: t(3) }),
    on: {
      hit: (m, dmg, crit, s) => {
        if (!s || !s.ba || s.v90 || s.v88oh || s.min) return;
        const f = G.v90fort;
        G.v90fort = { n: Math.min(V90_K.fortMax, (v90Live(f) ? f.n : 0) + 1), t: G.t + V90_K.fortT };
      },
    },
    hitMul: (d) => (v90Live(G.v90fort) ? d * (1 + (G.v90fort.n * uv("v90_maya", 2)) / 100) : d),
    d: `護甲 +{0}%；普攻擊中時獲得 1 層「堅守」（最多 ${V90_K.fortMax} 層，${V90_K.fortT} 秒，擊中時刷新）；每層使受到的傷害 −{1}%、傷害 +{2}%；地屬性抗性 +{3}%`,
  },
  v90_drake: {
    n: "德瑞克的船長靴", slot: "boots", hi: 2, v: [15, 30, 10, 25], src: "mvp", ico: 2406,
    mods: (t) => ({ move: t(0), res_undead: t(3) }),
    on: { tick: (dt) => v90DrakeTick(dt) },
    d: `移動速度 +{0}%；移動時在身後留下鹹水漩渦（${V90_K.vxT} 秒）：漩渦中的敵人冰緩（減速 {1}%）、受到的傷害 +{2}%；不死屬性抗性 +{3}%`,
  },
};

function v90Install() {
  if (typeof RO_UQ === "undefined" || typeof roUqPool !== "function") return;
  // 舊獨特停止掉落（不設 retired，避免被舊物品清理刪除；已持有的照常生效）
  for (const [k, src] of Object.entries(V90_OLD)) if (RO_UQ[k]) RO_UQ[k].src = src + "_old";
  for (const [k, u] of Object.entries(V90_UQ)) {
    UNIQUE[k] = u;
    if (u.src !== "mvp") RO_UQ[k] = u;
    if (u.slot === "weapon") u.any = 1;
    u.ic = "u_" + k;
    ICONS["u_" + k] ||= ICONS.sw0;
    roItemFiles["u_" + k] = u.ico;
  }
  FINAL.uq = roUqPool("map", 99).filter((k) => RO_UQ[k].hi === 2);
  // MVP 專屬掉落改為新的獨特
  if (typeof V64_MVP !== "undefined") {
    for (const d of V64_MVP) if (V90_MVP[d.k]) d.uq = V90_MVP[d.k];
    const rows = HELP.v64mvp?.[1];
    if (rows)
      for (const d of V64_MVP) {
        const r = rows.find((x) => typeof x[0] === "string" && x[0].startsWith(d.n + "（"));
        if (r) r[1] = `${UNIQUE[d.uq].n}（${SLOT_NAME[UNIQUE[d.uq].slot]}）：${uqText(d.uq)}`;
      }
  }

  // ---- 全域掛勾 ----
  // 燃燒／流血轉中毒（瘴毒披風）、流血疊層（德古拉的禮服）
  const ai = ailment;
  ailment = function (t, a, s, e, ...x) {
    if ((a === "brn" || a === "bld") && alive(t) && PS) {
      if (v90On("v90_toxic")) {
        const ee = (e ?? 1) * (1 + tal("ax_" + a));
        psnAdd(t, s * AIL[a].v * ee * (PS.psn || 1), PS.psnMax || 1);
        return;
      }
      if (a === "bld" && v90On("v90_dracula")) {
        const prev = t.bld && t.bld.t > 0 ? t.v90bs || 1 : 0;
        const r = ai.call(this, t, a, s, e, ...x);
        const ee = (e ?? 1) * (1 + tal("ax_bld")),
          o = s * AIL.bld.v * ee * PS.bld;
        t.v90bb = prev ? Math.max(t.v90bb || 0, o) : o;
        t.v90bs = Math.min(V90_K.bldMax, prev + 1);
        if (t.bld) t.bld.dps = t.v90bb * (1 + ((t.v90bs - 1) * uv("v90_dracula", 1)) / 100);
        return r;
      }
    }
    return ai.call(this, t, a, s, e, ...x);
  };
  const ta = tickAil;
  tickAil = function (dt, ...x) {
    if (v90On("v90_dracula")) for (const m of G.mobs) if (m.bld && m.bld.t > 0 && m.v90bs) (m.bpx = m.x), (m.bpy = m.y);
    return ta.call(this, dt, ...x);
  };
  // 暴擊球：擊中時加上暴擊率與暴擊傷害（召喚物不受影響）
  const hm = hitMob;
  hitMob = function (m, mult, o = {}, ...x) {
    const p = G.v90pow;
    if (!o.min && v90On("v90_glory") && v90Live(p)) o = { ...o, crit: (o.crit || 0) + p.n * uv("v90_glory", 1), critm: (o.critm || 0) + p.n * uv("v90_glory", 2) };
    return hm.call(this, m, mult, o, ...x);
  };
  HURT_MUL.push(
    { k: "uq:v90_paladin", f: () => (v90On("v90_paladin") && v90Live(G.v90end) ? 1 - (G.v90end.n * uv("v90_paladin", 1)) / 100 : 1) },
    { k: "uq:v90_maya", f: () => (v90On("v90_maya") && v90Live(G.v90fort) ? 1 - (G.v90fort.n * uv("v90_maya", 1)) / 100 : 1) },
  );
  TAKE_MUL.push({ k: "uq:v90_drake", f: (t, m) => (v90On("v90_drake") && m && m.v90vt > G.t ? t * (1 + uv("v90_drake", 2) / 100) : t) });
  SPD_MS.push({ k: "uq:v90_phantom", f: () => (v90On("v90_phantom") ? 1 + (uv("v90_phantom", 2) / 100) * v90ElF() : 1) });

  // ---- 狀態列 ----
  if (typeof HUD_BUFF !== "undefined")
    HUD_BUFF.push(
      {
        k: "v90sac",
        n: () => (v90On("v90_sac") && G.v90sacB > G.t ? 1 : 0),
        left: () => (G.v90sacB || 0) - G.t,
        bg: "#3a1a5a", fg: "#efe0ff", tc: "#c08aff",
        tip: () => ["不潔之力", [`傷害 +${Math.round(uv("v90_sac", 2))}%`]],
        art: ["...X...", "..XXX..", ".XX.XX.", "XX.X.XX", ".XX.XX.", "..XXX..", "...X..."],
      },
      {
        k: "v90end",
        n: () => (v90On("v90_paladin") && v90Live(G.v90end) ? G.v90end.n : 0),
        left: () => (G.v90end ? G.v90end.t - G.t : 0),
        bg: "#5a4a1a", fg: "#fff4d0", tc: "#ffd86a",
        tip: () => ["耐力球", [`受到的傷害 −${+(G.v90end.n * uv("v90_paladin", 1)).toFixed(1)}%`, G.v90end.n >= V90_K.endMax ? "已滿：下一個主動技能爆發" : `滿 ${V90_K.endMax} 個時下一個主動技能爆發`]],
        art: [".XXXXX.", "XX...XX", "X..X..X", "X.XXX.X", "X..X..X", "XX...XX", ".XXXXX."],
      },
      {
        k: "v90pow",
        n: () => (v90On("v90_glory") && v90Live(G.v90pow) ? G.v90pow.n : 0),
        left: () => (G.v90pow ? G.v90pow.t - G.t : 0),
        bg: "#1a3a6a", fg: "#e0f0ff", tc: "#7ab8ff",
        tip: () => ["暴擊球", [`暴擊率 +${+(G.v90pow.n * uv("v90_glory", 1)).toFixed(1)}%`, `暴擊傷害 +${Math.round(G.v90pow.n * uv("v90_glory", 2))}%`]],
        art: ["...X...", "..X.X..", ".X...X.", "X..X..X", ".X...X.", "..X.X..", "...X..."],
      },
      {
        k: "v90el",
        n: () => (v90On("v90_phantom") && v90ElF() > 0 ? 1 : 0),
        left: () => (G.v90el != null ? G.v90el + V90_K.elT - G.t : 0),
        bg: "#2a4a4a", fg: "#e0ffff", tc: "#8af0e0",
        tip: () => ["飄忽", [`閃避攻擊 +${Math.round(uv("v90_phantom", 1) * v90ElF())}%`, `移動速度 +${Math.round(uv("v90_phantom", 2) * v90ElF())}%`, `傷害 +${Math.round(uv("v90_phantom", 3) * v90ElF())}%`]],
        art: ["X......", ".X..X..", "..X..X.", "...X..X", "..X..X.", ".X..X..", "X......"],
      },
      {
        k: "v90fort",
        n: () => (v90On("v90_maya") && v90Live(G.v90fort) ? G.v90fort.n : 0),
        left: () => (G.v90fort ? G.v90fort.t - G.t : 0),
        bg: "#4a3a1a", fg: "#fff0d8", tc: "#e0b070",
        tip: () => ["堅守", [`受到的傷害 −${+(G.v90fort.n * uv("v90_maya", 1)).toFixed(1)}%`, `傷害 +${+(G.v90fort.n * uv("v90_maya", 2)).toFixed(1)}%`]],
        art: ["XXXXXXX", "X.....X", "X.XXX.X", "X.XXX.X", ".X.X.X.", "..X.X..", "...X..."],
      },
    );
}
if (typeof roV4Install === "function") {
  const r4v90 = roV4Install;
  roV4Install = function () {
    r4v90();
    v90Install();
  };
}
