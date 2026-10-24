/* Mutated skill gems: every monster can drop a mutated gem of the current class.
   Each mutation rolls independently:
   - occupied cells +1 / −1
   - damage ±50% and cooldown ±50% (active skills)
   - support strength ±70% (support gems); 25% of mutated supports with a tag
     requirement become 泛用 (work on any active skill; projectile counts become
     extra casts on non-projectile skills)
   - element: add or remove one elemental effect; multi-element (2 extra
     elements) appears at 1/10 of the mutated-gem drop rate. */
"use strict";
const RO_MUT = {
  base: 0.00001, // 0.001% per normal kill; elites ×5, bosses ×50 (MUT.e / MUT.b)
  free: 0.25,
  shape: 0.6,
  element: 0.45,
  multi: 0.1,
  els: ["brn", "chl", "shk"],
};
const RO_EL_NAME = { brn: "燃燒", chl: "冰緩", shk: "感電", bld: "流血" };
const roMutPct = (r = 50) => Math.round((RAND() * 2 - 1) * r) / 100; // ±r%
function roNormShape(cells) {
  const [x0, y0] = cells.slice().sort((a, b) => a[1] - b[1] || a[0] - b[0])[0];
  return cells.map(([x, y]) => [x - x0, y - y0]);
}
// Exactly one cell more or one cell less, keeping the piece connected.
function roMutShapeStep(shape) {
  const grow = () => {
      const have = new Set(shape.map((c) => c + "")),
        free = [];
      for (const [x, y] of shape)
        for (const c of [
          [x + 1, y],
          [x - 1, y],
          [x, y + 1],
          [x, y - 1],
        ])
          if (!have.has(c + "") && !free.some((f) => f + "" === c + "")) free.push(c);
      return [...shape, free[ri(0, free.length - 1)]];
    },
    shrink = () => {
      const opts = shape
        .map((_, i) => shape.filter((__, j) => j !== i))
        .filter((s) => polyConn(s));
      return opts.length ? opts[ri(0, opts.length - 1)] : null;
    };
  const canGrow = shape.length < MUT.max,
    canShrink = shape.length > 1;
  let next = null;
  if (canGrow && (!canShrink || RAND() < 0.5)) next = grow();
  else if (canShrink) next = shrink() || (canGrow ? grow() : null);
  return next ? roNormShape(next) : null;
}
function roRollMutation(id, multi = false) {
  const sk = SKILLS[id],
    mu = {};
  if (sk.act) {
    mu.dmg = roMutPct();
    if (sk.cd) mu.cd = roMutPct();
    if (multi) {
      const pool = RO_MUT.els.filter((e) => e !== sk.ail),
        add = [];
      while (add.length < 2 && pool.length) add.push(pool.splice(ri(0, pool.length - 1), 1)[0]);
      mu.el = [...(sk.ail ? [sk.ail] : []), ...add];
      mu.multi = 1;
    } else if (RAND() < RO_MUT.element) {
      if (sk.ail && RAND() < 0.35) mu.el = [];
      else {
        const pool = RO_MUT.els.filter((e) => e !== sk.ail);
        mu.el = [...(sk.ail ? [sk.ail] : []), pool[ri(0, pool.length - 1)]];
      }
    }
  } else {
    mu.pow = roMutPct(70);
    if (sk.req && RAND() < RO_MUT.free) mu.free = 1;
  }
  return mu;
}
makeMutGem = function () {
  // Multi-element mutations are 1/10 of all mutated drops (active skills only).
  const multi = RAND() < RO_MUT.multi,
    all = CLASS[S.cls].gems,
    pool = multi ? all.filter((g) => SKILLS[g].act) : all,
    id = pool[ri(0, pool.length - 1)],
    gem = { u: uid(), id, x: -1, y: -1, rot: 0, mu: roRollMutation(id, multi) };
  if (RAND() < RO_MUT.shape) {
    const sh = roMutShapeStep(SKILLS[id].shape);
    if (sh) gem.sh = sh;
  }
  return gem;
};
// All monsters can drop mutated gems; mutation slates still add on top.
rollMut = function (elite, boss) {
  const slate = slateSum("sl_mut"),
    mult = boss ? MUT.b : elite ? MUT.e : 1,
    p = RO_MUT.base * mult + (slate ? (slate * mult) / 1e4 : 0);
  return RAND() < p ? makeMutGem() : null;
};
const roSign = (v) => (v > 0 ? "+" : "−") + Math.abs(Math.round(v * 100)) + "%";
function roMutText(t) {
  const mu = t.mu;
  if (!mu) return "";
  const sk = SKILLS[t.id],
    out = [];
  if (t.sh) {
    const d = t.sh.length - sk.shape.length;
    if (d) out.push(`格數${d > 0 ? "+" : "−"}${Math.abs(d)}`);
  }
  if (mu.dmg) out.push("傷害" + roSign(mu.dmg));
  if (mu.cd) out.push("冷卻時間" + roSign(mu.cd));
  if (mu.pow) out.push("效果" + roSign(mu.pow));
  if (mu.free) out.push("泛用：不限標籤");
  if (mu.el) {
    const base = sk.ail ? [sk.ail] : [];
    if (!mu.el.length && base.length) out.push("失去" + RO_EL_NAME[base[0]]);
    for (const e of mu.el) if (!base.includes(e)) out.push("+" + RO_EL_NAME[e]);
  }
  return out.join(" ");
}
function roGemName(t) {
  const base = SKILLS[t.id].n + (t.sx ? "（穿梭）" : "");
  if (t.mu) {
    const txt = roMutText(t);
    return base + (t.mu.multi ? "（多重變異" : "（變異") + (txt ? "：" + txt : "") + "）";
  }
  return base + (t.sh ? "（變異）" : "");
}
// Per-skill bonuses from talents, uniques and affixes arrive as mod keys:
//   "sk:<skill>:<stat>"  stat = dmg, more, cd, area, extra, crit, critm, ail,
//                        minion, chn, proj   (fractions; crit/critm in points)
//   "sk:<skill>:el:<brn|chl|shk>"  the skill also applies that element
//   "sp:<support>:pow"   that support gem's effects are stronger
let ROSK = {};
const roSk = (id, k) => ROSK["sk:" + id + ":" + k] || 0;
function roSkScan(mods) {
  ROSK = {};
  for (const m of mods)
    if (typeof m.s === "string" && /^(sk|sp|tg):/.test(m.s))
      ROSK[m.s] = (ROSK[m.s] || 0) + m.v;
  return mods;
}
// Installed last (after every other collectMods wrapper) from roV4Install.
function roSkInstall() {
  const inner = collectMods;
  collectMods = function () {
    return roSkScan(inner());
  };
}
const RO_COUNT_KEYS = ["extra", "proj", "minion", "chn", "trig"];
// Mechanic tags a skill counts as, for "tg:<tag>:<stat>" bonuses from uniques:
// its own tags plus ail_<element>, nonproj / nonminion, cdlong (≥4 s), cdshort (≤3 s).
function roSkillTags(id) {
  const sk = SKILLS[id] || {},
    tg = [...(sk.tg || [])];
  if (sk.ail) tg.push("ail_" + sk.ail);
  if (!tg.includes("proj")) tg.push("nonproj");
  if (!tg.includes("minion")) tg.push("nonminion");
  if (sk.cd >= 4) tg.push("cdlong");
  else if (sk.cd > 0 && sk.cd <= 3) tg.push("cdshort");
  return tg;
}
linkedSupports = function (t) {
  return adjSupports(t).filter((a) => supFits(a.id, t.id) || a.mu?.free);
};
// Per-gem modifiers: support strength mutations scale that support's effects;
// active-gem damage adds to increased damage, cooldown multiplies the timer.
gemMods = function (t) {
  const a = {
    dmg: 0, cd: 0, area: 0, crit: 0, critm: 0, extra: 0, proj: 0, pstk: 0,
    ail: 0, minion: 0, ovk: 0, chn: 0, life: 0, trig: 0, mlife: 0,
  };
  const sk = SKILLS[t.id],
    proj = (sk.tg || []).includes("proj");
  let s = 1;
  for (const e of linkedSupports(t)) {
    const mod = SKILLS[e.id].mod,
      k = 1 + (e.mu?.pow || 0) + (ROSK["sp:" + e.id + ":pow"] || 0);
    for (const key in mod) {
      let v = mod[key] * (RO_COUNT_KEYS.includes(key) ? 1 : k);
      if (key === "proj" && !proj && e.mu?.free) {
        a.extra += Math.ceil(v / 2);
        continue;
      }
      key === "area" && v < 0 ? (s *= 1 + v) : (a[key] += v);
    }
  }
  a.area = (1 + a.area) * s - 1;
  a.cd = Math.min(0.7, a.cd);
  if (t.mu) {
    a.dmg += t.mu.dmg || 0;
    if (t.mu.cd) a.cd = 1 - (1 - a.cd) * (1 + t.mu.cd);
  }
  // Talent / unique / affix bonuses for this specific skill.
  a.dmg = (1 + a.dmg + roSk(t.id, "dmg")) * (1 + roSk(t.id, "more")) - 1;
  if (roSk(t.id, "cd")) a.cd = 1 - (1 - a.cd) * (1 - Math.min(0.8, roSk(t.id, "cd")));
  for (const k of ["area", "extra", "crit", "critm", "ail", "minion", "chn", "proj"])
    a[k] += roSk(t.id, k);
  // Mechanic-tag bonuses (uniques): apply once per matching tag.
  for (const tag of roSkillTags(t.id)) {
    const g = (k) => ROSK["tg:" + tag + ":" + k] || 0;
    if (g("dmg")) a.dmg = (1 + a.dmg) * (1 + g("dmg")) - 1;
    if (g("cd")) a.cd = 1 - (1 - a.cd) * (1 - Math.min(0.8, g("cd")));
    for (const k of ["area", "extra", "crit", "critm", "minion", "chn", "proj"]) a[k] += g(k);
  }
  return a;
};
// Element mutations: swap the skill's ailment for this cast only, then fan the
// marker out to each element when the hit lands.
const roMutCastRaw = castSkillRaw;
function roSkillEls(t) {
  const sk = SKILLS[t.id];
  let el = t.mu?.el ? [...t.mu.el] : null;
  for (const e of RO_MUT.els)
    if (roSk(t.id, "el:" + e) > 0) {
      el ||= sk.ail ? [sk.ail] : [];
      if (!el.includes(e)) el.push(e);
    }
  return el;
}
castSkillRaw = function (t, a) {
  const sk = SKILLS[t.id],
    el = roSkillEls(t);
  if (!el) return roMutCastRaw(t, a);
  const keep = sk.ail;
  sk.ail = el.length ? "mu|" + el.join("|") : undefined;
  try {
    return roMutCastRaw(t, a);
  } finally {
    sk.ail = keep;
  }
};
const roMutAilment = ailment;
ailment = function (t, a, s, e) {
  if (typeof a === "string" && a.startsWith("mu|")) {
    for (const el of a.slice(3).split("|")) if (AIL[el]) roMutAilment(t, el, s, e);
    return;
  }
  return roMutAilment(t, a, s, e);
};
