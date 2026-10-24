/* 流浪仙境 v1.1.2（內部 v11.5）：無限武鬥場負面效果改為完全隨機、可疊加，層數越低越弱
   1. 每通過 10 層從 11 種效果隨機抽 1 個（新增「霜凍」：移動速度降低），同一種可以重複抽到並疊加；同名效果合併顯示（例：狂暴 ×2）
   2. 強度 = 全額 ×（0.2 + 層數 × 0.8%），第 10 層約 3 成、第 50 層 6 成、第 100 層以後全額；全額數值比原本低
   3. 每種效果有疊加上限；到上限後不再抽到它，全部到上限後不再新增
   4. 「詛咒」原本只降低藥水效果，現在生命回復也照說明降低 */

const V115 = {
  s0: 0.2, // 第 0 層的強度
  sk: 0.008, // 每層增加的強度（第 100 層全額）
  C: [
    { n: "狂暴", base: 12, cap: 60, d: (v) => `怪物傷害 +${v}%`, m: (v) => ({ mdmg: v / 100 }) },
    { n: "鋼鐵之膚", base: 15, cap: 75, d: (v) => `怪物生命 +${v}%`, m: (v) => ({ mhp: v / 100 }) },
    { n: "疾風", base: 10, cap: 40, d: (v) => `怪物移動速度 +${v}%`, m: (v) => ({ mspd: v / 100 }) },
    { n: "沉默", base: 8, cap: 40, d: (v) => `技能冷卻縮減 −${v}%`, m: (v) => ({ pmods: { cdr: -v } }) },
    { n: "詛咒", base: 15, cap: 60, d: (v) => `生命回復與藥水效果 −${v}%`, m: (v) => ({ pmods: { pot: -v }, regenCut: v / 100 }) },
    { n: "石化之觸", base: 8, cap: 40, d: (v) => `攻擊速度 −${v}%`, m: (v) => ({ pmods: { aspd: -v } }) },
    { n: "黑暗", base: 8, cap: 30, d: (v) => `暴擊率 −${v}%`, m: (v) => ({ pmods: { crit: -v } }) },
    { n: "毒霧", base: 0.4, cap: 2, step: 0.1, d: (v) => `每秒損失 ${v}% 最大生命`, m: (v) => ({ dot: v / 100 }) },
    { n: "庇護", base: 8, cap: 40, d: (v) => `怪物受到的傷害 −${v}%`, m: (v) => ({ mdr: v / 100 }) },
    { n: "脆弱", base: 8, cap: 40, d: (v) => `受到的傷害 +${v}%`, m: (v) => ({ pmods: { dmgTaken: -v / 100 } }) },
    { n: "霜凍", base: 10, cap: 40, d: (v) => `移動速度 −${v}%`, m: (v) => ({ pmods: { move: -v } }) },
  ],
};
const v115Def = (n) => V115.C.find((c) => c.n === n);
const v115Str = (floor) => Math.min(1, V115.s0 + V115.sk * floor);
const v115Rnd = (v, step = 1) => Math.round(Math.round(v / step) * step * 10) / 10;
// 目前各效果的累計值與次數
function v115Tot() {
  const t = {};
  for (const c of G?.tw?.ra?.curses || []) {
    const v = c[3]?.v;
    if (v == null) continue;
    const o = (t[c[0]] ||= { v: 0, k: 0 });
    o.v = v115Rnd(o.v + v, v115Def(c[0])?.step || 1);
    o.k++;
  }
  return t;
}
function v115Line(name, o) {
  const D = v115Def(name);
  return `${name}${o.k > 1 ? ` ×${o.k}` : ""}：${D ? D.d(o.v) : ""}${D && o.v >= D.cap ? "（上限）" : ""}`;
}
function v115Curse(n) {
  const a = G.tw,
    floor = n * 10,
    tot = v115Tot(),
    pool = V115.C.filter((D) => (tot[D.n]?.v || 0) < D.cap);
  if (!pool.length) {
    toast(`無限武鬥場：第 ${floor} 層通過，所有負面效果都已達上限`, "bad");
    return;
  }
  const D = pool[ri(0, pool.length - 1)],
    step = D.step || 1,
    have = tot[D.n]?.v || 0;
  let v = Math.max(step, v115Rnd(D.base * v115Str(floor), step));
  v = v115Rnd(Math.min(v, D.cap - have), step);
  a.ra.curses.push([D.n, D.d(v), D.m(v), { v, f: floor }]);
  const o = v115Tot()[D.n];
  toast(`無限武鬥場：第 ${floor} 層通過，新增負面效果「${D.n}」— ${D.d(v)}${o.k > 1 ? `（累計 ×${o.k}：${D.d(o.v).replace(/^.*?([+−]?[\d.]+%)/, "$1")}）` : ""}`, "bad");
  recalc();
}

function v115Install() {
  if (typeof roArenaCurse !== "function" || typeof RO_ARENA_CURSES === "undefined") return;
  roArenaCurse = v115Curse;
  // 舊的效果表同步（其他程式只讀名稱）
  RO_ARENA_CURSES.splice(0, RO_ARENA_CURSES.length, ...V115.C.map((D) => [D.n, D.d(D.base), D.m(D.base)]));
  // 側欄：同名效果合併顯示
  if (typeof twLines === "function") {
    const tl = twLines;
    twLines = function (...a) {
      const l = tl.apply(this, a);
      if (!roArenaOn()) return l;
      const names = new Set(G.tw.ra.curses.map((c) => c[0] + "："));
      const out = l.filter((x) => !(Array.isArray(x) && x[1] === "dg" && [...names].some((p) => String(x[0]).startsWith(p))));
      const tot = v115Tot();
      for (const [name, o] of Object.entries(tot)) out.push([v115Line(name, o), "dg"]);
      return out;
    };
  }
  // 詛咒：生命回復也降低（原本只有藥水）
  if (typeof twTick === "function") {
    const tt = twTick;
    twTick = function (t, ...x) {
      if (roArenaOn() && !G.dead && S && typeof PS !== "undefined") {
        const cut = Math.min(0.9, G.tw.ra.curses.reduce((s, c) => s + (c[2]?.regenCut || 0), 0));
        if (cut > 0 && S.hp < hpCap()) S.hp = Math.max(1, S.hp - PS.regen * (typeof slHealMul === "function" ? slHealMul() : 1) * cut * t);
      }
      return tt.call(this, t, ...x);
    };
  }
  // 說明文字
  const oldTxt = "每通過 10 層隨機增加一個負面效果（本次挑戰內持續）",
    newTxt = "每通過 10 層隨機增加一個負面效果（可能重複疊加，層數越高效果越強，各有上限；本次挑戰內持續）";
  const pm = ui.p_map;
  ui.p_map = function (...a) {
    return pm.apply(this, a).split(oldTxt).join(newTxt);
  };
  for (const hv of Object.values(HELP))
    for (const row of Array.isArray(hv?.[1]) ? hv[1] : []) if (Array.isArray(row) && typeof row[1] === "string" && row[1].includes(oldTxt)) row[1] = row[1].split(oldTxt).join(newTxt);
  if (HELP.tower && Array.isArray(HELP.tower[1]))
    HELP.tower[1].push([
      "負面效果",
      `無限武鬥場每通過 10 層，從 ${V115.C.length} 種效果隨機抽 1 個，可能重複抽到並疊加。強度 = 全額 ×（20% + 層數 × 0.8%），第 100 層以後為全額；到上限的效果不會再抽到。全額／上限：${V115.C.map((D) => `${D.n} ${D.d(D.base).replace(/^.*?([+−]?[\d.]+%).*$/, "$1")}／${D.d(D.cap).replace(/^.*?([+−]?[\d.]+%).*$/, "$1")}`).join("、")}（毒霧為每秒損失最大生命）。`,
    ]);
}
if (typeof roV4Install === "function") {
  const r4v115 = roV4Install;
  roV4Install = function () {
    r4v115();
    v115Install();
  };
}
