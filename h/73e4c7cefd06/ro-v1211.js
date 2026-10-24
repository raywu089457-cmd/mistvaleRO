/* 流浪仙境 v1.2.11：沒有傷害的主動技能，變異方向修正；新增 4 種詛咒
   範圍：挑釁、詛咒類（泥沼地、弱點詛咒、天使之怒）、自身增益類（布拉奇之詩、哼歌、真實之眼、雙重施法、隱匿、殘影分身、
        練氣、聖母之祈福、熔毀、極限武器強化、藥水投擲）、光環類（狂暴、二刀流）。召喚類有召喚物傷害，維持原本的變異。
   ① 「傷害 ±50%」改為「效果 ±50%」（嘲諷減傷、詛咒強度、增益數值）；冷卻 ±50% 保留
   ② 元素變異改為「附加詛咒」（衰弱、緩慢、脆弱、石化、睡眠、致盲、混亂 抽 1 種）：
      挑釁→被嘲諷的敵人同時中詛咒；詛咒類→多一種詛咒；自身增益→施放時對周圍敵人施加詛咒；光環→周圍敵人持續中詛咒
   ③ 多重變異：附加兩種詛咒；25% 機率「主動變被動」——不用施放，常駐生效（效果 100%）。隱匿、練氣、藥水投擲不會變被動
   ④ 失敗變異（30%）：反噬（施放時自己也中那種詛咒 3 秒；石化、睡眠為定身 0.8 秒）或代價（施放時消耗 5%～15% 最大生命）；
      被動、光環的失敗變異每 10 秒發作一次
   ⑤ 已經拿到的寶石不用重抽：原本的燃燒、冰緩、感電分別對應脆弱、緩慢、衰弱；存檔資料不變
   新詛咒：石化 2 秒（無法移動與攻擊）、睡眠 3 秒（無法移動與攻擊，被打就醒，叫醒的那一下必定暴擊）、
          致盲 6 秒（攻擊 40% 落空）、混亂 4 秒（亂走，攻擊 30% 打到旁邊的怪）；頭目時間減半
   v1.2.12：拿掉「被動、光環施加的新詛咒結束後 4 秒內不再施加」與「石化 6 秒內只會一次」，改為強控抗性：
          石化、睡眠、混亂每次被同一個來源（同一顆寶石）施加，該詛咒的抗性 +34%，持續時間 ×（1 − 抗性）；
          抗性滿 100% 時免疫，直到抗性回落到 0 才會再中；抗性每秒 −10%。主動施放、被動、光環都適用 */

const V1211 = {
  fail: 0.3,
  failHp: [5, 15],
  pas: 0.25,
  noPas: new Set(["th_hide", "ac_call", "mc_potion"]),
  keys: ["wk", "sl", "vu", "pt", "sp", "bl", "cf"],
  legacy: { brn: "vu", chl: "sl", shk: "wk" },
  N: { wk: "衰弱", sl: "緩慢", vu: "脆弱", pt: "石化", sp: "睡眠", bl: "致盲", cf: "混亂" },
  C: { wk: "#b89aff", sl: "#7aaaff", vu: "#ff7ab8", pt: "#a8a8a8", sp: "#9fd0ff", bl: "#5a4a6a", cf: "#ffd84a" },
  nw: { pt: { t: 2 }, sp: { t: 3 }, bl: { t: 6, miss: 0.4 }, cf: { t: 4, hit: 0.3 } },
  hc: new Set(["pt", "sp", "cf"]), // 強控：會累積抗性
  res: { up: 0.34, down: 0.1 },
  bossK: 0.5,
  self: { t: 3, root: 0.8, miss: 0.2, crit: 20, wk: 0.75, sl: 0.7, vu: 1.25 },
  badIv: 10,
  pasR: 1.5, // 被動光環每次刷新的效果時間
  pasDur: { bw_song: 7.8, bw_sight: 7.8, dc_humming: 7.8, mg_dcast: 7.8, th_clone: 5.8, ac_assum: 7.8, mc_melt: 9.8, mc_otmax: 9.8 },
  E: {}, // 各技能目前生效的效果倍率
  me: { wk: 0, sl: 0, vu: 0, root: 0, bl: 0, cf: 0 }, // 反噬：自己身上的到期時間
  pasT: {},
  badT: {},
  pasNow: 0,
  cast: null,
  tick: 0,
};
const v1211On = (m, k) => !!(m && m.v1211c && m.v1211c[k] > G.t);

// 沒有傷害的主動技能（召喚類除外）
function v1211ND(id) {
  const s = SKILLS[id];
  return !!(s && s.act && !s.hit && !(s.tg || []).includes("minion"));
}
const v1211Eff = (g) => 1 + (g && g.mu && v1211ND(g.id) ? g.mu.dmg || 0 : 0);
const v1211IsTaunt = (id) => /taunt$/.test(SKILLS[id]?.v6 || "") || SKILLS[id]?.roBase === "taunt";
const v1211Pas = (g) => !!(g && g.mu && g.mu.pas && v1211ND(g.id));
// 寶石附加的詛咒（新寶石 mu.crs；舊寶石由元素對應）
function v1211Crs(g) {
  if (!g || !g.mu || !v1211ND(g.id)) return [];
  if (Array.isArray(g.mu.crs)) return g.mu.crs.filter((k) => V1211.N[k]);
  const base = SKILLS[g.id].ail;
  return [...new Set((g.mu.el || []).filter((e) => e !== base).map((e) => V1211.legacy[e]).filter(Boolean))];
}
function v1211Pick(n) {
  const pool = [...V1211.keys],
    out = [];
  while (out.length < n && pool.length) out.push(pool.splice(ri(0, pool.length - 1), 1)[0]);
  return out;
}

// 強控抗性：每隻怪物對「每個來源（寶石）× 每種強控」分開計算
function v1211Res(m, id) {
  const R = (m.v1211r ||= {}),
    r = R[id] || (R[id] = { v: 0, t: G.t, imm: 0 });
  r.v = Math.max(0, r.v - V1211.res.down * Math.max(0, G.t - r.t));
  r.t = G.t;
  if (r.imm && r.v <= 0) r.imm = 0;
  return r;
}
// 這隻怪物對某種強控的最高抗性（顯示用）
function v1211ResOf(m, k) {
  let v = 0,
    imm = false;
  for (const id in m.v1211r || {}) {
    if (!id.endsWith(":" + k)) continue;
    const r = v1211Res(m, id);
    v = Math.max(v, r.v);
    imm ||= !!r.imm;
  }
  return { v, imm };
}
// 對怪物施加詛咒（新詛咒對頭目減半）
// aura：被動、光環的持續刷新——衰弱、緩慢、脆弱只補 1.5 秒；src：來源寶石（強控抗性依來源分開計算）
function v1211Apply(m, k, aura, src = "x") {
  if (!alive(m) || m.dm || !(m.spawnT <= 0)) return;
  if (k === "wk" || k === "sl" || k === "vu") {
    (m.crs ||= {})[k] = Math.max(m.crs[k] || 0, aura ? V1211.pasR : CRS[k].t + tal("crsT"));
    return;
  }
  let d = V1211.nw[k].t * (m.boss ? V1211.bossK : 1);
  const c = (m.v1211c ||= {});
  if (V1211.hc.has(k)) {
    const r = v1211Res(m, src + ":" + k);
    if (r.imm) return; // 抗性滿了：免疫，直到回落到 0
    d *= 1 - r.v;
    const end = G.t + d;
    if (d < 0.05 || end <= (c[k] || 0)) return; // 沒有延長就不算一次
    c[k] = end;
    r.v = Math.min(1, r.v + V1211.res.up);
    if (r.v >= 1) r.imm = 1;
    return;
  }
  c[k] = Math.max(c[k] || 0, G.t + d);
}
const v1211Mark = (m, k, E) => ((m.v1211e ||= {})[k] = E);

// 施放前後比對：被這次施放嘲諷或詛咒的怪物
function v1211Snap() {
  const s = new Map();
  for (const m of G.mobs) s.set(m, { tnt: m.tnt || 0, wk: m.crs?.wk || 0, sl: m.crs?.sl || 0, vu: m.crs?.vu || 0 });
  return s;
}
function v1211Post(g, snap) {
  const id = g.id,
    sk = SKILLS[id],
    E = v1211Eff(g),
    crs = v1211Crs(g);
  v1211Bad(g);
  later(0.12, () => {
    if (!G || G.dead) return;
    let hit = [];
    if (v1211IsTaunt(id) || sk.crs) {
      for (const m of G.mobs) {
        const o = snap.get(m) || { tnt: 0, wk: 0, sl: 0, vu: 0 };
        if (v1211IsTaunt(id) && (m.tnt || 0) > o.tnt + 0.01) (hit.push(m), v1211Mark(m, "tnt", E));
        else if (sk.crs && (m.crs?.[sk.crs] || 0) > o[sk.crs] + 0.01) (hit.push(m), v1211Mark(m, sk.crs, E));
      }
    } else hit = mobsNear(G.pl.x, G.pl.y - 3, 44 * PS.area);
    for (const m of hit) for (const k of crs) v1211Apply(m, k, false, g.u);
    if (crs.length && hit.length) v1211Ring(G.pl.x, G.pl.y, crs[0]);
  });
}
const v1211Ring = (x, y, k) => {
  try {
    roPushFx(G.fx, { k: "ring", x, y: y - 3, r: 26, t: 0, life: 0.4, col: V1211.C[k] || "#c89aff" });
  } catch (e) {}
};

// 失敗變異
function v1211Bad(g) {
  const mu = g && g.mu;
  if (!mu || !mu.bad || !v1211ND(g.id)) return;
  const p = G.pl;
  if (mu.bad === "hp") {
    const d = PS.maxhp * (mu.hp || 0.1);
    S.hp = Math.max(1, S.hp - d);
    num(p.x, p.y - 26, "-" + fmt(d), "#ff6a7a");
    return;
  }
  const k = mu.bk;
  if (!V1211.N[k]) return;
  if (k === "pt" || k === "sp") V1211.me.root = Math.max(V1211.me.root, G.t + V1211.self.root);
  else V1211.me[k] = Math.max(V1211.me[k] || 0, G.t + V1211.self.t);
  num(p.x, p.y - 32, "反噬：" + V1211.N[k], V1211.C[k] || "#d8a0ff");
}

// 被動（多重變異）與光環：每 0.25 秒刷新
function v1211Pass(dt) {
  if (!S || !G || G.dead) return;
  for (const g of placed()) {
    if (!g.mu || !v1211ND(g.id)) continue;
    const sk = SKILLS[g.id],
      aura = !!sk.aura;
    if (!aura && !g.mu.pas) continue;
    const E = v1211Eff(g),
      crs = v1211Crs(g),
      d = V1211.pasR;
    V1211.E[g.id] = E;
    if (g.mu.bad && G.t >= (V1211.badT[g.u] || 0) && mobsNear(G.pl.x, G.pl.y, 2 * PS.range + 60).length) {
      V1211.badT[g.u] = G.t + V1211.badIv;
      v1211Bad(g);
    }
    if (aura) {
      if (crs.length) for (const m of mobsNear(G.pl.x, G.pl.y - 3, 44 * PS.area)) for (const k of crs) v1211Apply(m, k, true, g.u);
      continue;
    }
    if (v1211IsTaunt(g.id)) {
      const R = 44 * PS.area * (1 + gemMods(g).area) * (1 + tal("tntR"));
      for (const m of mobsNear(G.pl.x, G.pl.y - 3, R)) {
        m.ag = true;
        m.tnt = Math.max(m.tnt || 0, d);
        v1211Mark(m, "tnt", E);
        for (const k of crs) v1211Apply(m, k, true, g.u);
      }
    } else if (sk.crs) {
      const R = 28 * PS.area * (1 + gemMods(g).area);
      for (const m of mobsNear(G.pl.x, G.pl.y - 3, R)) {
        v1211Apply(m, sk.crs, true, g.u);
        v1211Mark(m, sk.crs, E);
        for (const k of crs) v1211Apply(m, k, true, g.u);
      }
    } else if (G.t >= (V1211.pasT[g.u] || 0) && mobsNear(G.pl.x, G.pl.y - 3, 2 * PS.range + 60).length) {
      // 自身增益：效果快結束時自動再施放（不顯示提示、不打斷動作）
      V1211.pasT[g.u] = G.t + (V1211.pasDur[g.id] || 7.8);
      const p = G.pl,
        an = p.anim,
        face = p.face;
      V1211.pasNow = 1;
      try {
        castSkill(g, 1);
      } catch (e) {
      } finally {
        V1211.pasNow = 0;
        p.anim = an;
        p.face = face;
      }
      for (const m of mobsNear(p.x, p.y - 3, 44 * PS.area)) for (const k of crs) v1211Apply(m, k, true, g.u);
    }
  }
}

// 混亂：亂走
function v1211Wander(dt, held) {
  for (const [m, k, v] of held) {
    if (k !== "cf" || !alive(m)) continue;
    if (!m.v1211dir || G.t >= m.v1211dir.t) m.v1211dir = { a: RAND() * 6.283, t: G.t + 0.6 };
    m.x += Math.cos(m.v1211dir.a) * v * 0.6 * dt;
    m.y += Math.sin(m.v1211dir.a) * v * 0.45 * dt;
    try {
      inArena(m);
    } catch (e) {}
  }
}

// 效果倍率：包裝既有的倍率項目（只放大或縮小「加成的部分」）
function v1211Hit(arr, key, getE) {
  const e = arr && arr.find((x) => x.k === key);
  if (!e || e.v1211) return;
  const f = e.f;
  e.v1211 = 1;
  e.f = function (t, ...a) {
    const r = f.call(this, t, ...a),
      E = getE(t, ...a);
    if (E === 1 || !t || r === t) return r;
    return t * Math.max(0, 1 + (r / t - 1) * E);
  };
}
function v1211Fac(arr, key, getE, lo = 0.05) {
  const e = arr && arr.find((x) => x.k === key);
  if (!e || e.v1211) return;
  const f = e.f;
  e.v1211 = 1;
  e.f = function (...a) {
    const r = f.apply(this, a),
      E = getE(...a);
    if (E === 1 || r === 1) return r;
    return Math.max(lo, 1 + (r - 1) * E);
  };
}
const v1211E = (id) => () => V1211.E[id] ?? 1;

function v1211Install() {
  if (typeof roRollMutation !== "function" || typeof roMutText !== "function") return;
  // ①～④ 變異的擲骰
  const rr = roRollMutation;
  roRollMutation = function (id, multi = false) {
    if (!v1211ND(id)) return rr.call(this, id, multi);
    const sk = SKILLS[id],
      mu = { dmg: roMutPct() };
    if (sk.cd) mu.cd = roMutPct();
    if (multi) {
      mu.crs = v1211Pick(2);
      mu.multi = 1;
      if (!sk.aura && !V1211.noPas.has(id) && RAND() < V1211.pas) mu.pas = 1;
    } else if (RAND() < RO_MUT.element) mu.crs = v1211Pick(1);
    if (RAND() < V1211.fail) {
      if (RAND() < 0.5) (mu.bad = "bk"), (mu.bk = v1211Pick(1)[0]);
      else (mu.bad = "hp"), (mu.hp = ri(V1211.failHp[0], V1211.failHp[1]) / 100);
    }
    return mu;
  };
  // 寶石說明
  const mt = roMutText;
  roMutText = function (t) {
    if (!t || !t.mu || !v1211ND(t.id)) return mt.call(this, t);
    const mu = t.mu,
      sk = SKILLS[t.id],
      out = [];
    if (t.sh) {
      const d = t.sh.length - sk.shape.length;
      if (d) out.push(`格數${d > 0 ? "+" : "−"}${Math.abs(d)}`);
    }
    if (mu.dmg) out.push("效果" + roSign(mu.dmg));
    if (mu.cd) out.push("冷卻時間" + roSign(mu.cd));
    const c = v1211Crs(t);
    if (c.length) out.push("詛咒：" + c.map((k) => V1211.N[k]).join("、"));
    if (mu.pas) out.push("被動：常駐生效");
    const per = mu.pas || sk.aura ? `每 ${V1211.badIv} 秒` : "每次施放";
    if (mu.bad === "bk" && V1211.N[mu.bk]) out.push(`失敗：${per}反噬（${V1211.N[mu.bk]}）`);
    if (mu.bad === "hp") out.push(`失敗：${per}消耗 ${Math.round((mu.hp || 0) * 100)}% 生命`);
    return out.join(" ");
  };

  // 施放：記錄效果倍率；被動寶石不施放；定身時不能施放
  const tc = tryCast;
  tryCast = function (t, a) {
    if (v1211Pas(t)) return;
    if (V1211.me.root > G.t) return;
    const nd = t && v1211ND(t.id) && t.mu;
    let snap = null;
    if (nd) snap = v1211Snap();
    V1211.cast = null;
    const r = tc.call(this, t, a);
    if (nd && V1211.cast === t) v1211Post(t, snap);
    return r;
  };
  const sr = skillReady;
  skillReady = function (g, ...x) {
    if (v1211Pas(g) && !V1211.pasNow) return false;
    return sr.call(this, g, ...x);
  };
  const cs = castSkill;
  castSkill = function (g, a = 1, ...x) {
    if (g && v1211ND(g.id)) V1211.E[g.id] = v1211Eff(g);
    const r = cs.call(this, g, a, ...x);
    if (r && g) V1211.cast = g;
    return r;
  };
  // 殘影分身：殘影重複施放的傷害倍率
  const csr = castSkillRaw;
  castSkillRaw = function (g, a = 1, ...x) {
    try {
      if (typeof v6G === "function" && v6G().inExtra && typeof v6Buf === "function" && v6Buf("clone")) a *= V1211.E.th_clone ?? 1;
    } catch (e) {}
    return csr.call(this, g, a, ...x);
  };
  // 雙重施法：再施放一次的傷害倍率
  if (typeof v83Echo === "function") {
    const ec = v83Echo;
    v83Echo = function (g, mult, delay, ...x) {
      if (delay === 0.15 && typeof V83 !== "undefined" && V83.dc > G.t) mult *= V1211.E.mg_dcast ?? 1;
      return ec.call(this, g, mult, delay, ...x);
    };
  }
  // 提示：被動自動施放時不顯示
  const ts = toast;
  toast = function (...a) {
    if (V1211.pasNow) return;
    return ts.apply(this, a);
  };
  const nm = num;
  num = function (...a) {
    if (V1211.pasNow) return;
    return nm.apply(this, a);
  };

  // ① 效果倍率
  v1211Hit(HIT_MUL, "v6:song", v1211E("bw_song"));
  v1211Hit(HIT_MUL, "v6:sneak", v1211E("th_hide"));
  v1211Hit(HIT_MUL, "v123:hum", v1211E("dc_humming"));
  v1211Hit(HIT_MUL, "v86:ot", v1211E("mc_otmax"));
  v1211Hit(HIT_MUL, "v86:pot", v1211E("mc_potion"));
  v1211Hit(HIT_MUL, "v88:berserk", v1211E("sw_berserk"));
  v1211Hit(TAKE_MUL, "v86:melt", v1211E("mc_melt"));
  v1211Hit(TAKE_MUL, "crs:vu", (t, m) => m?.v1211e?.vu ?? 1);
  v1211Fac(HURT_MUL, "taunt", (m) => m?.v1211e?.tnt ?? 1);
  v1211Fac(HURT_MUL, "weak", (m) => m?.v1211e?.wk ?? 1);
  v1211Fac(HURT_MUL, "v6:hide", v1211E("th_hide"));
  v1211Fac(HURT_MUL, "v86:assum", v1211E("ac_assum"));
  v1211Fac(HURT_MUL, "v88:berserk", v1211E("sw_berserk"));
  v1211Fac(SPD_AS, "v6:song", v1211E("bw_song"), 0.1);
  v1211Fac(SPD_AS, "v6:call", v1211E("ac_call"), 0.1);
  v1211Fac(SPD_AS, "v123:hum", v1211E("dc_humming"), 0.1);
  v1211Fac(SPD_AS, "v86:pot", v1211E("mc_potion"), 0.1);
  v1211Fac(SPD_AS, "v88:berserk", v1211E("sw_berserk"), 0.1);
  v1211Fac(SPD_AS, "mom", () => (placed().some((g) => g.id === "th_dual") ? V1211.E.th_dual ?? 1 : 1), 0.1);
  // 聖母之祈福的回復量 +50%
  const hl = heal;
  heal = function (v, ...x) {
    const E = V1211.E.ac_assum ?? 1;
    if (E !== 1 && v > 0 && typeof V86 !== "undefined" && V86.assum > G.t) v *= (1 + 0.5 * E) / 1.5;
    return hl.call(this, v, ...x);
  };
  // 反噬：自己身上的弱化
  // 組隊副本（v1.2.13）會依隊員切換 V1211.me，這裡每次都讀目前的那一份
  const sf = V1211.self;
  HIT_MUL.push({ k: "v1211:wk", lab: () => V1211.me.wk > G.t && `反噬・衰弱 ×${sf.wk}`, f: (t) => (V1211.me.wk > G.t ? t * sf.wk : t) });
  HURT_MUL.push({ k: "v1211:vu", f: () => (V1211.me.vu > G.t ? sf.vu : 1) });
  SPD_AS.push({ k: "v1211:sl", f: () => (V1211.me.sl > G.t ? sf.sl : 1) });
  SPD_MS.push({ k: "v1211:sl", f: () => (V1211.me.root > G.t ? 0.001 : V1211.me.sl > G.t ? sf.sl : 1) });

  // 擊中：真實之眼的暴擊、睡眠必定暴擊、反噬（致盲、混亂）
  const hm = hitMob;
  hitMob = function (m, mult, o, ...x) {
    if (!m || !alive(m)) return hm.call(this, m, mult, o, ...x);
    if (V1211.me.cf > G.t && !(o && o.min) && RAND() < sf.miss) {
      num(m.x, m.y - (m.h || 16) - 4, "MISS", "#c8d0e0");
      return 0;
    }
    let add = 0;
    const se = V1211.E.bw_sight ?? 1;
    if (se !== 1 && typeof V85 !== "undefined" && V85.sight > G.t) add += 15 * (se - 1);
    if (V1211.me.bl > G.t) add -= sf.crit;
    const sl = v1211On(m, "sp");
    if (sl) add += 1e4;
    const r = hm.call(this, m, mult, add ? Object.assign({}, o, { crit: ((o && o.crit) || 0) + add }) : o, ...x);
    if (sl && m.v1211c) m.v1211c.sp = 0;
    return r;
  };
  // 怪物攻擊：致盲落空、混亂打到旁邊的怪
  const dp = damagePlayer;
  damagePlayer = function (d, x, y, src, ...r) {
    const c = src && src.v1211c;
    if (c && G.mobs.includes(src)) {
      if (c.bl > G.t && RAND() < V1211.nw.bl.miss) return void num(G.pl.x, G.pl.y - 22, "MISS", "#c8d0e0");
      if (c.cf > G.t && RAND() < V1211.nw.cf.hit) {
        let o = null,
          od = 40;
        for (const m of G.mobs)
          if (m !== src && m.spawnT <= 0 && !m.dm) {
            const e = Math.hypot(m.x - src.x, m.y - src.y);
            if (e < od) (od = e), (o = m);
          }
        if (o) return void dealMob(o, d, false, "#ffd84a", "v1211:cf");
      }
    }
    return dp.call(this, d, x, y, src, ...r);
  };
  // 每格：石化、睡眠無法行動；混亂亂走；緩慢的效果倍率；被動與光環；布拉奇之詩（專注之歌）的冷卻縮減倍率
  const tk = tick;
  tick = function (dt, ...x) {
    const held = [];
    if (G && Array.isArray(G.mobs))
      for (const m of G.mobs) {
        const c = m.v1211c;
        if (c && (c.pt > G.t || c.sp > G.t)) {
          held.push([m, "stn", m.stn || 0]);
          m.stn = 99;
          continue;
        }
        if (c && c.cf > G.t) {
          held.push([m, "cf", m.spd]);
          m.spd = 0;
          continue;
        }
        const e = m.v1211e && m.v1211e.sl;
        if (e && e !== 1 && cursed(m, "sl")) {
          const v = CRS.sl.v * (PS?.crs || 1);
          held.push([m, "spd", m.spd]);
          m.spd *= Math.max(0.05, 1 - v * e) / Math.max(0.05, 1 - v);
        }
      }
    let r;
    try {
      r = tk.call(this, dt, ...x);
    } finally {
      for (const [m, k, v] of held) if (k === "stn") m.stn = Math.max(0, v - (dt || 0));
      else m.spd = v;
    }
    try {
      // 組隊副本（v1.2.13）：混亂亂走只在「世界」段；角色身上的效果只在「角色」段
      const md = typeof V1213B !== "undefined" ? V1213B.mode : null;
      if (md !== "p") v1211Wander(dt || 0, held);
      if (md === "w") return r;
      if (V1211.me.root > G.t && G.pl) G.pl.atk = Math.max(G.pl.atk || 0, 0.05);
      const se = V1211.E.bw_song ?? 1;
      if (se !== 1 && typeof v6Buf === "function" && v6Buf("song1"))
        for (const g of activeGems()) if (G.pl.cds[g.u] > 0) G.pl.cds[g.u] = Math.max(0, G.pl.cds[g.u] - (dt || 0) * 0.25 * (se - 1));
      if ((V1211.tick -= dt || 0) <= 0) {
        V1211.tick = 0.25;
        v1211Pass(0.25);
      }
    } catch (e) {}
    return r;
  };
  // 新詛咒的圖示
  const dm = drawMob;
  drawMob = function (c, m, ...x) {
    const r = dm.call(this, c, m, ...x);
    try {
      const k = m && m.v1211c;
      if ((k && (k.pt > G.t || k.sp > G.t || k.bl > G.t || k.cf > G.t)) || (m && m.v1211r && Object.values(m.v1211r).some((r) => r.imm))) v1211Icon(c, m, k || {});
    } catch (e) {}
    return r;
  };
  // 說明
  const rows = HELP.skill?.[1];
  if (Array.isArray(rows)) {
    const mr = rows.find((x) => x[0] === "變異寶石");
    const add =
      "沒有傷害的主動技能（挑釁、詛咒、增益、光環）：「傷害」改為「效果 ±」，元素變異改為附加詛咒（衰弱、緩慢、脆弱、石化、睡眠、致盲、混亂抽 1 種）；多重變異附加兩種詛咒，25% 機率變成被動（不用施放、常駐生效）；30% 機率是失敗變異——反噬（施放時自己也中那種詛咒）或代價（施放時消耗生命）。";
    if (mr && !String(mr[1]).includes("沒有傷害的主動技能")) mr[1] += add;
    if (!rows.some((x) => x[0] === "詛咒")) {
      const i = rows.findIndex((x) => x[0] === "變異寶石");
      rows.splice(i < 0 ? rows.length : i + 1, 0, [
        "詛咒",
        "衰弱：造成的傷害降低；緩慢：移動與攻擊速度降低；脆弱：受到的傷害提高；石化 2 秒：無法移動與攻擊；睡眠 3 秒：無法移動與攻擊，被打就醒，叫醒的那一下必定暴擊；致盲 6 秒：攻擊 40% 落空；混亂 4 秒：亂走，攻擊 30% 打到旁邊的怪。頭目的石化、睡眠、致盲、混亂時間減半。強控抗性：石化、睡眠、混亂每次被同一顆寶石施加，該詛咒的抗性 +34%（持續時間 ×（1 − 抗性）），滿 100% 時免疫，直到抗性回落到 0；抗性每秒 −10%，怪物頭上會顯示抗性。",
      ]);
    }
  }
}

function v1211Icon(c, m, k) {
  const x = Math.round(m.x),
    top = Math.round(m.y - (m.h || 16) * (m.boss ? 2 : 1) - 8);
  c.save();
  c.globalAlpha = 1;
  if (k.pt > G.t) {
    c.globalAlpha = 0.45;
    c.fillStyle = "#9a9a9a";
    c.beginPath();
    c.ellipse(x, m.y - (m.h || 16) * 0.45, (m.h || 16) * 0.42, (m.h || 16) * 0.55, 0, 0, 6.283);
    c.fill();
    c.globalAlpha = 1;
  }
  c.font = "bold 8px sans-serif";
  c.textAlign = "center";
  c.lineWidth = 2;
  c.strokeStyle = "rgba(20,16,30,.85)";
  const tags = [],
    G2 = { pt: "石", sp: "Zz", cf: "?" },
    col = { pt: V1211.C.pt, sp: V1211.C.sp, cf: V1211.C.cf };
  for (const key of ["pt", "sp", "cf"]) {
    const on = k[key] > G.t,
      r = v1211ResOf(m, key);
    if (on) tags.push([G2[key] + (r.v > 0.005 ? " " + Math.round(r.v * 100) + "%" : ""), col[key]]);
    else if (r.imm) tags.push([G2[key] + " 免疫", "#9aa0a8"]);
  }
  if (k.bl > G.t) tags.push(["盲", "#d8c8ff"]);
  const w = tags.some((t) => t[0].length > 2) ? 26 : 11,
    x0 = x - ((tags.length - 1) * w) / 2;
  tags.forEach(([t, col], i) => {
    const bob = Math.sin(G.t * 4 + i) * 1;
    c.strokeText(t, x0 + i * w, top + bob);
    c.fillStyle = col;
    c.fillText(t, x0 + i * w, top + bob);
  });
  c.restore();
}

if (typeof roV4Install === "function") {
  const r4v1211 = roV4Install;
  roV4Install = function () {
    r4v1211.apply(this, arguments);
    try {
      v1211Install();
    } catch (e) {
      console.error("v1211", e);
    }
  };
}
