/* 流浪仙境 v1.2.13：組隊副本「地獄級頭目」
   ・隊伍：目前角色為隊長（傷害、最大生命 +15%，受到的傷害 −13%），再帶同一存檔的其他角色 2～4 名（依各角色上次存檔的快照），3～5 人
   ・每位隊員都完整跑自己的技能盤、天賦與裝備效果：每格畫面依序切換到各隊員的戰鬥資料執行「角色」那段，再以世界資料執行「世界」那段
     （ro-v1213-base.js 把引擎的每格更新拆成兩段；一般遊玩不經過這裡）
   ・隊員的飛行物、地面效果、延遲效果都記下施放者，命中時切回施放者的資料計算傷害
   ・九宮格陣型：頭目先打最前排（同排打最近的）；嘲諷可讓頭目的普攻改打嘲諷者
   ・冷卻 2 小時（整個帳號）；每次進場 3 張復活卷軸，沒用掉的累積；可設定自動使用與優先順序
   ・一次入場一路往上打，每層一隻地獄頭目，生命與傷害每層 ×1.15，隨機詞綴，35% 機率附加元素抗性；移動速度加成無效、頭目技能冷卻 −45%（v1.2.23 起；生命與傷害 ×3）
   ・每層獎勵：神話卡 5%、Lv130 主宰裝備 10%、組隊獨特戒指「羈絆之戒」5%、寵物扭蛋券 5%、變異技能寶石 8%（v1.2.20）；隊長第一次通關第 10 層得皮膚美容券（v1.2.20 起）
   ・隊伍排行（比照武鬥場）；每層 5% 機率改為遇到隊伍排行榜上其他隊伍的快照
   ・隊友的存檔快照只在這次挑戰中使用，不會寫回任何角色 */

const V1213 = {
  run: null,
  cur: null,
  ctxs: {},
  mods: [],
  tpl: {},
  drawing: 0,
  fxDraw: 0,
  quiet: 0,
  nid: 0,
  cfg: {
    cdMs: 2 * 3600e3,
    scrolls: 3,
    minN: 3,
    maxN: 5,
    lead: 0.15,
    leadDr: 0.13,
    fK: 1.15,
    hp1: 2.4e8, // 第 1 層頭目生命（v1.2.13 依 3 人滿主宰裝＋傳說卡校準為 5500 萬，約 60 秒；v1.2.20 起 8000 萬；v1.2.23 起 ×3 = 2 億 4000 萬）
    d1: 18000, // 第 1 層頭目普攻傷害（v1.2.13 校準為 6000：同上的隊伍約打到第 4～5 層用完復活卷軸；v1.2.23 起 ×3）
    enrageT: 120,
    enrageK: 3,
    ghostP: 0.05,
    rw: { card: 0.05, myth: 0.1, ring: 0.05, pet: 0.05, gem: 0.08 },
    reviveHp: 0.5,
    reviveDelay: 1.5,
    interT: 3,
    cdK: 0.55, // 頭目技能與普攻冷卻（v1.2.23 起 −45%，原本 −30%）
    resP: 0.35,
    resV: 0.6,
    skinFloor: 10,
    afFrom: 2, // v1.2.20：詞綴與元素攻擊從第 2 層開始
    rows: [0.62, 0.73, 0.84], // v1.2.25：開場陣型三排的位置（場地高度比例，中間偏下）
    nearR: 25, // v1.2.25：頭目普攻打距離這以內的目標時傷害提高
    nearK: 0.25,
    elP: 0.4, // v1.2.20：頭目攻擊帶隨機元素的機率（受到的傷害依玩家該屬性抗性計算）
  },
};
// 世界共用的資料（其餘都是每位隊員各自一份）
const V1213_WORLD = new Set([
  "W", "H", "top", "t", "mobs", "proj", "fx", "nums", "parts", "flashes", "later", "drops", "orbs", "spawn", "arena", "boss", "bossT", "bn",
  "ground", "shake", "freeze", "lastFreeze", "hurtFlash", "rate", "minK", "minT", "roEffects", "tw", "guard", "trial", "v64mvp", "VH", "props",
  "haz", "agT", "abT", "atT", "v1213", "trn", "v103n", "v71hit", "v113",
]);
const V1213_ARENA = {
  n: "地獄迴廊（尼芙菲姆）",
  v: { k: "tiles", p: ["#1a0c10", "#2a1218", "#3a1820", "#4c2028"], q: ["#1a0c10", "#2a1218", "#3a1820"], pool: null, d: "runes", pr: "pillar", amb: [0.46, 46, 10, 16], sl: 0, ring: "#ff4a5a" },
};
const V1213_AF = [
  { k: "hp", n: "強韌", d: "生命 +30%", hp: 1.3 },
  { k: "dmg", n: "兇猛", d: "傷害 +25%", dmg: 1.25 },
  { k: "fast", n: "迅捷", d: "攻擊與技能冷卻 −20%", cd: 0.8 },
  { k: "tough", n: "鋼甲", d: "受到的傷害 −20%", taken: 0.8 },
  { k: "leech", n: "吸血", d: "造成傷害的 30% 回復生命", leech: 0.3 },
  { k: "fury", n: "狂暴", d: "生命低於 50% 時傷害 +40%", fury: 0.4 },
  { k: "quick", n: "急襲", d: "技能預警時間 −30%", warn: 0.7 },
];
const V1213_AF0 = { k: "none", n: "", d: "" }; // 第 1 層：沒有詞綴
const V1213_EL = ["fire", "water", "wind", "earth", "holy", "shadow", "ghost", "poison"];
const V1213_ELC = { fire: "#ff6a3a", water: "#5ab8ff", wind: "#9adf6a", earth: "#c8a060", holy: "#fff0a0", shadow: "#9a6aff", ghost: "#c0a8ff", poison: "#9adf3a", undead: "#a0a0b8", neutral: "#ff4a5a" };
// 頭目招式：cd 為原本的冷卻（實際 ×0.7）
const V1213_SK = [
  { k: "sweep", n: "業火橫掃", cd: 9, k1: 1.8 },
  { k: "pierce", n: "冥雷直擊", cd: 11, k1: 2.0 },
  { k: "rain", n: "地獄火雨", cd: 15, k1: 1.4 },
  { k: "ring", n: "深淵震環", cd: 13, k1: 1.6 },
  { k: "roar", n: "魔王咆哮", cd: 22, k1: 0.7 },
  { k: "summon", n: "召喚眷屬", cd: 26, k1: 0.35 },
];

// ---------------------------------------------------------------------------
// 1. 帳號共用資料（共用倉庫）：冷卻、復活卷軸、寵物扭蛋券、皮膚美容券、設定
function v1213Acct() {
  const st = STH || stLoad();
  const a = (st.v1213 ||= {});
  a.cd = +a.cd || 0;
  a.sc = Math.max(0, Math.floor(+a.sc || 0));
  a.pet = Math.max(0, Math.floor(+a.pet || 0));
  a.skin = Math.max(0, Math.floor(+a.skin || 0));
  a.opt ||= {};
  return a;
}
// a：要存的帳號資料（共用倉庫可能在中途被重新讀取，存的時候放回目前的倉庫物件）
function v1213AcctSave(a) {
  try {
    const st = STH || stLoad();
    if (a && typeof a === "object") st.v1213 = a;
    stWrite(st);
  } catch (e) {}
}
function v1213AcctClean(v) {
  if (!v || typeof v !== "object") return null;
  const o = v.opt && typeof v.opt === "object" ? v.opt : {};
  return {
    cd: Math.max(0, +v.cd || 0),
    sc: Math.max(0, Math.min(999, Math.floor(+v.sc || 0))),
    pet: Math.max(0, Math.min(9999, Math.floor(+v.pet || 0))),
    skin: Math.max(0, Math.min(9999, Math.floor(+v.skin || 0))),
    opt: {
      ids: Array.isArray(o.ids) ? o.ids.filter((x) => typeof x === "string").slice(0, 4) : [],
      cells: o.cells && typeof o.cells === "object" ? Object.fromEntries(Object.entries(o.cells).filter(([k, x]) => typeof k === "string" && Number.isInteger(x) && x >= 0 && x < 9).slice(0, 6)) : {},
      auto: o.auto === 0 ? 0 : 1,
      pri: Array.isArray(o.pri) ? o.pri.filter((x) => typeof x === "string").slice(0, 6) : [],
    },
  };
}

// ---------------------------------------------------------------------------
// 2. 戰鬥資料的切換
function v1213Clone(v) {
  if (v instanceof Map) return new Map([...v].map(([k, x]) => [k, v1213Clone(x)]));
  if (v instanceof Set) return new Set([...v]);
  if (Array.isArray(v)) return v.map(v1213Clone);
  if (v && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype) {
    const o = {};
    for (const k in v) o[k] = v1213Clone(v[k]);
    return o;
  }
  return v;
}
// 各更新檔放在全域物件裡、屬於角色的戰鬥狀態
const V1213_MODS = [
  ["V83", ["dc", "fist", "tg"]],
  ["V85", null],
  ["V86", null],
  ["V123", ["lk", "lkT"]],
  ["V1211", ["E", "me", "pasT", "badT", "tick", "cast", "pasNow"]],
  ["V69T", null],
  ["V129", ["rt"]],
];
function v1213ModsInit() {
  V1213.mods = [];
  for (const [name, keys] of V1213_MODS) {
    let obj = null;
    try {
      obj = (0, eval)(name);
    } catch (e) {}
    if (!obj || typeof obj !== "object") continue;
    const ks = keys || Object.keys(obj);
    const tpl = {};
    for (const k of ks) tpl[k] = v1213Clone(obj[k]);
    V1213.mods.push({ name, obj, ks, tpl });
  }
}
function v1213ModsFresh() {
  const m = {};
  for (const d of V1213.mods) m[d.name] = v1213Clone(d.tpl);
  return m;
}
function v1213ModsGet() {
  const m = {};
  for (const d of V1213.mods) {
    const o = (m[d.name] = {});
    for (const k of d.ks) o[k] = d.obj[k];
  }
  return m;
}
function v1213ModsSet(m) {
  for (const d of V1213.mods) {
    const o = m[d.name] || {};
    for (const k of d.ks) d.obj[k] = k in o ? o[k] : v1213Clone(d.tpl[k]);
  }
}
function v1213PlayerG() {
  const w = newWorld(G.W, G.H),
    g = {};
  for (const k of Object.keys(w)) if (!V1213_WORLD.has(k)) g[k] = w[k];
  return g;
}
function v1213Out(c) {
  c.S = S;
  c.PS = PS;
  c.ROSK = ROSK;
  const g = {};
  for (const k of Object.keys(G)) if (!V1213_WORLD.has(k)) g[k] = G[k];
  c.g = g;
  c.mods = v1213ModsGet();
}
function v1213In(c) {
  for (const k of Object.keys(G)) if (!V1213_WORLD.has(k)) delete G[k];
  Object.assign(G, c.g);
  S = c.S;
  PS = c.PS;
  ROSK = c.ROSK || {};
  v1213ModsSet(c.mods);
}
function v1213Use(c) {
  const p = V1213.cur;
  if (p === c || !c) return;
  if (p) v1213Out(p);
  v1213In(c);
  V1213.cur = c;
}
function v1213Run(c, fn) {
  const p = V1213.cur;
  if (!c || p === c) return fn();
  v1213Use(c);
  try {
    return fn();
  } finally {
    v1213Use(p);
  }
}
// 持續傷害的施放者（中毒取傷害最高的一層）
function v1213AilOwner(t, e) {
  if (!t) return null;
  if (e === "brn" || e === "bld") return (t[e] && t[e].v1213o) || null;
  if (e === "psn" && t.psn) {
    let b = null;
    for (const q of t.psn.s) if (!b || q.dps > b.dps) b = q;
    return (b && b.v1213o) || null;
  }
  return null;
}
const v1213Members = () => (V1213.run ? V1213.run.members : []);
const v1213Alive = () => v1213Members().filter((c) => !c.dead);

// 世界陣列：新增的飛行物、地面效果、延遲效果記下施放者
function v1213Tag(arr, kind) {
  if (!arr || arr.v1213) return;
  const push = Array.prototype.push;
  Object.defineProperty(arr, "v1213", { value: 1, enumerable: false });
  arr.push = function (...items) {
    const c = V1213.cur,
      R = V1213.run;
    if (R && c && c !== R.world)
      for (const it of items) {
        if (!it || typeof it !== "object" || it.v1213o) continue;
        it.v1213o = c.id;
        if (kind === "later") {
          const f = it.fn,
            own = c;
          if (typeof f === "function") it.fn = () => (own.gone ? undefined : v1213Run(own, f));
        } else {
          if (it.o && typeof it.o === "object") it.o.v1213o ||= c.id;
          else if (kind === "proj" && !it.enemy) it.o = { v1213o: c.id };
          it.v1213p = G.pl;
        }
      }
    return push.apply(this, items);
  };
}
function v1213Arrays() {
  if (!G) return;
  v1213Tag(G.proj, "proj");
  v1213Tag(G.fx, "fx");
  v1213Tag(G.later, "later");
}

// ---------------------------------------------------------------------------
// 3. 開始與結束
// 頭目在場地上方約 1/4 處；陣型在頭目下方（前排距離頭目約 40 px，每排間隔 20 px）
function v1213CellPos(i) {
  const r = Math.floor(i / 3),
    col = i % 3,
    by = v1213BossY();
  // v1.2.25：整隊排在場地中間偏下（頭目在上方），不會比頭目下方 40 更近
  const y = Math.max(by + 40 + r * 20, G.top + (G.H - G.top) * V1213.cfg.rows[r]);
  return [Math.round(G.W / 2 + (col - 1) * 34), Math.round(Math.min(G.H - 12, y))];
}
const v1213BossY = () => Math.round(G.top + Math.max(26, (G.H - G.top) * 0.22));
function v1213Melee(cls, br) {
  if (cls === "sword" || cls === "thief") return true;
  if (cls === "acolyte") return br === "ro_acolyte_1" || br === "ro_acolyte_3";
  if (cls === "merchant") return br !== "ro_merchant_2";
  return false;
}
// 預設陣型：近戰排前排、其餘排後面
function v1213AutoCells(list) {
  const cells = {},
    front = [0, 1, 2],
    mid = [3, 4, 5],
    back = [6, 7, 8];
  const melee = list.filter((x) => v1213Melee(x.cls, x.br)),
    rng = list.filter((x) => !v1213Melee(x.cls, x.br));
  for (const x of melee) cells[x.id] = (front.length ? front : mid.length ? mid : back).shift();
  for (const x of rng) cells[x.id] = (back.length ? back : mid.length ? mid : front).shift();
  return cells;
}
function v1213Quiet(fn) {
  const t = toast;
  V1213.quiet++;
  toast = () => {};
  try {
    return fn();
  } finally {
    toast = t;
    V1213.quiet--;
  }
}
// 隊友：讀取存檔快照（只讀，不會寫回）
function v1213Snap(id) {
  try {
    const t = charLoad(id);
    if (!t || !CLASS[t.cls]) return null;
    const st = v1213Quiet(() => migrate(JSON.parse(JSON.stringify(t))));
    st.cid = id;
    st.v1213ally = 1;
    return st;
  } catch (e) {
    return null;
  }
}
function v1213CanStart() {
  if (!S || !G) return "沒有角色";
  if (V1213.run) return "組隊副本進行中";
  if (G.boss || G.tw || G.arena || G.dead || G.trial != null || G.guard != null) return "請先結束目前的挑戰";
  if (typeof v113In === "function" && v113In()) return "請先離開城鎮";
  const a = v1213Acct();
  if (a.cd > Date.now()) return "冷卻中：" + v1213Dur(a.cd - Date.now());
  return "";
}
const v1213Dur = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000)),
    h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    x = s % 60;
  return h ? `${h} 小時 ${m} 分` : m ? `${m} 分 ${x} 秒` : `${x} 秒`;
};
// opt: { ids: [其他角色 cid], cells: {cid: 0~8}, auto, pri: [cid], states?: [測試用：直接給存檔] }
function v1213Start(opt = {}) {
  const why = v1213CanStart();
  if (why) return void toast(why, "bad");
  const allies = [];
  for (const id of opt.ids || []) {
    if (id === S.cid) continue;
    const st = v1213Snap(id);
    if (st) allies.push(st);
  }
  for (const st of opt.states || []) allies.push(st);
  const n = allies.length + 1;
  if (n < V1213.cfg.minN) return void toast(`組隊副本至少需要 ${V1213.cfg.minN} 人（目前 ${n} 人）`, "bad");
  if (n > V1213.cfg.maxN) allies.length = V1213.cfg.maxN - 1;
  try {
    saveNow();
  } catch (e) {}
  const home = { G, S, PS, ROSK, mods: v1213ModsGet(), hp: S.hp };
  // 世界
  const [W, H] = [G.W, G.H];
  const world = newWorld(W, H);
  Object.assign(world, { VH: G.VH, props: [], ground: null, arena: { ar: V1213_ARENA, out: 1e9, ask: 0 }, v1213: 1 });
  V1213.ctxs = {};
  V1213.cur = null;
  G = world;
  // 世界的資料：不參與戰鬥的替身（放在場外）
  const ws = v1213Quiet(() => newState(home.S.cls));
  Object.assign(ws, { cid: "v1213w", name: "世界", lvl: home.S.lvl, map: home.S.map, unlocked: home.S.unlocked, gems: [], equip: {}, bag: [] });
  ws.set = { ...(ws.set || {}), ab: 0, at: 0, ags: null, agb: null, nob: 1, psv: 0 };
  const wc = v1213NewCtx("w", "world", ws, -1);
  wc.g.pl.x = -9999;
  wc.g.pl.y = -9999;
  v1213In(wc);
  V1213.cur = wc;
  v1213Quiet(() => {
    try {
      recalc();
    } catch (e) {}
  });
  ws.hp = 1e12;
  // 隊員
  const list = [{ id: home.S.cid, st: home.S, role: "lead" }, ...allies.map((st) => ({ id: st.cid, st, role: "ally" }))];
  const auto = v1213AutoCells(list.map((x) => ({ id: x.id, cls: x.st.cls, br: x.st.tal?.asc })));
  const used = new Set(),
    cells = {};
  for (const x of list) {
    let c = opt.cells && Number.isInteger(opt.cells[x.id]) ? opt.cells[x.id] : auto[x.id];
    if (used.has(c)) c = [...Array(9).keys()].find((i) => !used.has(i));
    used.add(c);
    cells[x.id] = c;
  }
  const members = [];
  for (const x of list) {
    const c = v1213NewCtx(x.id, x.role, x.st, cells[x.id]);
    const [px, py] = v1213CellPos(c.cell);
    c.g.pl.x = px;
    c.g.pl.y = py;
    c.pl = c.g.pl;
    c.pl.v1213c = c.id;
    c.name = x.st.name || CLASS[x.st.cls].n;
    c.cls = x.st.cls;
    v1213Run(c, () =>
      v1213Quiet(() => {
        try {
          if (typeof roTreeEnsure === "function") roTreeEnsure();
        } catch (e) {}
        recalc();
        S.hp = PS.maxhp;
      }),
    );
    members.push(c);
  }
  const lead = members[0];
  const acct = v1213Acct();
  acct.cd = Date.now() + V1213.cfg.cdMs;
  const scrolls = V1213.cfg.scrolls + acct.sc;
  acct.sc = 0;
  acct.opt = { ids: allies.map((s) => s.cid).filter((x) => !String(x).startsWith("test")), cells, auto: opt.auto === 0 ? 0 : 1, pri: Array.isArray(opt.pri) ? opt.pri : [] };
  v1213AcctSave(acct);
  V1213.run = {
    home,
    world: wc,
    lead,
    members,
    floor: 0,
    best: 0,
    t: 0,
    ft: 0,
    scrolls,
    used: 0,
    auto: opt.auto === 0 ? 0 : 1,
    pri: Array.isArray(opt.pri) && opt.pri.length ? opt.pri : members.map((m) => m.id),
    inter: 1.5,
    boss: null,
    ghosts: [],
    rew: [],
    log: [],
    revT: 0,
    wipeT: 0,
    over: null,
    ghostTeam: null,
  };
  // 隊長加成與副本限制在挑戰中才生效：重新計算一次
  for (const c of members)
    v1213Run(c, () =>
      v1213Quiet(() => {
        recalc();
        S.hp = PS.maxhp;
      }),
    );
  v1213Use(lead);
  v1213Arrays();
  try {
    v1213HudOn();
  } catch (e) {}
  toast(`組隊副本開始：${members.map((m) => m.name).join("、")}（復活卷軸 ${scrolls} 張）`, "lvl", 1);
  try {
    v1213RkPrefetch();
  } catch (e) {}
  return V1213.run;
}
function v1213NewCtx(id, role, st, cell) {
  const c = { id, role, S: st, PS: null, ROSK: {}, g: v1213PlayerG(), mods: v1213ModsFresh(), dead: false, cell, dmg: 0, hurt: 0, deaths: 0, rev: 0 };
  V1213.ctxs[id] = c;
  return c;
}
// 結束：回到原本的地圖
function v1213End(why = "") {
  const R = V1213.run;
  if (!R || R.ending) return;
  R.ending = 1;
  const res = {
    floor: R.best,
    t: R.t,
    why,
    members: R.members.map((m) => ({ id: m.id, name: m.name, cls: m.cls, br: m.S?.tal?.asc || "", lv: m.S?.lvl || 1, dmg: m.dmg, hurt: m.hurt, deaths: m.deaths })),
    rew: R.rew.slice(),
    scrolls: R.scrolls,
  };
  // 排行榜快照（在各隊員的資料下建立）
  let snap = null;
  if (R.best >= 1)
    try {
      snap = R.members.map((m) => v1213Run(m, () => ({ id: m.id, name: m.name, cls: S.cls, br: S.tal?.asc || "", lv: S.lvl, s: typeof v6RkSnap === "function" ? v6RkSnap(null) : null })));
    } catch (e) {
      snap = null;
    }
  v1213Use(R.lead);
  const acct = v1213Acct();
  acct.sc += Math.max(0, R.scrolls);
  v1213AcctSave(acct);
  for (const c of R.members) c.gone = true;
  R.world.gone = true;
  const home = R.home;
  V1213.run = null;
  V1213.cur = null;
  V1213B.mode = null;
  G = home.G;
  S = home.S;
  ROSK = home.ROSK;
  v1213ModsSet(home.mods);
  try {
    recalc();
  } catch (e) {}
  S.hp = PS.maxhp;
  try {
    saveNow();
  } catch (e) {}
  v1213HudOff();
  V1213.last = res;
  try {
    if (snap && R.best >= 1) v1213RkSend(res, snap);
  } catch (e) {}
  try {
    v1213Result(res);
  } catch (e) {}
  try {
    ui.render();
    ui.hud(true);
  } catch (e) {}
  return res;
}

// ---------------------------------------------------------------------------
// 4. 每格畫面
function v1213Frame(dt, chain, self, x) {
  const R = V1213.run;
  R.t += dt;
  v1213Arrays();
  if (G.drops.length) G.drops.length = 0;
  for (const c of R.members) {
    if (c.dead || R.ending) continue;
    v1213Use(c);
    V1213B.mode = "p";
    try {
      chain.call(self, dt, ...x);
    } catch (e) {
      console.error("v1213 member", c.id, e);
    }
  }
  if (V1213.run !== R) return;
  v1213Use(R.world);
  for (const c of R.members) {
    c.pl = c.pl || (c === V1213.cur ? G.pl : c.g.pl);
    c.pl.hp = c.dead ? 0 : Math.max(1, c.S.hp);
  }
  V1213B.mode = "w";
  try {
    chain.call(self, dt, ...x);
  } catch (e) {
    console.error("v1213 world", e);
  }
  V1213B.mode = null;
  if (V1213.run !== R) return;
  try {
    v1213Floor(dt);
    v1213BossTick(dt);
    v1213GhostTick(dt);
    v1213Revive(dt);
  } catch (e) {
    console.error("v1213 ai", e);
  }
  if (V1213.run === R) v1213Use(R.lead);
  if ((R.hudT = (R.hudT || 0) - dt) <= 0) {
    R.hudT = 0.2;
    try {
      v1213Hud();
    } catch (e) {}
  }
  if (R.quitAsk && R.t - R.quitT >= 3) R.quitAsk = 0;
  if (R.over && (R.overT -= dt) <= 0) v1213End(R.over);
}

// ---------------------------------------------------------------------------
// 5. 頭目
function v1213Target(m, basic) {
  const al = v1213Alive();
  if (!al.length) return null;
  if (basic && m && m.tnt > 0 && m.v1213tn) {
    const c = V1213.ctxs[m.v1213tn];
    if (c && !c.dead && al.includes(c)) return c;
  }
  if (m && v1211On?.(m, "cf")) return al[ri(0, al.length - 1)];
  const bx = m ? m.x : G.W / 2,
    by = m ? m.y : v1213BossY();
  let best = null,
    bk = 1e9;
  for (const c of al) {
    const p = c.pl,
      row = Math.floor(c.cell / 3),
      k = row * 1e4 + Math.hypot(p.x - bx, p.y - by);
    if (k < bk) (bk = k), (best = c);
  }
  return best;
}
// 嘲諷：記下最後嘲諷這隻怪物的隊員
function v1213TntProp(m) {
  let v = m.tnt || 0;
  Object.defineProperty(m, "tnt", {
    configurable: true,
    enumerable: true,
    get: () => v,
    set: (x) => {
      if (x > v && V1213.cur && V1213.run && V1213.cur !== V1213.run.world) m.v1213tn = V1213.cur.id;
      v = x;
    },
  });
}
function v1213Spawn(f) {
  const R = V1213.run,
    cfg = V1213.cfg;
  const i = (f - 1) % MAP_N,
    type = MAPS[i].bt,
    lv = Math.min(LV_CAP, 127);
  const late = f >= cfg.afFrom,
    af = late ? V1213_AF[ri(0, V1213_AF.length - 1)] : V1213_AF0,
    res = RAND() < cfg.resP ? V1213_EL[ri(0, V1213_EL.length - 1)] : null,
    atk = late && RAND() < cfg.elP ? V1213_EL[ri(0, V1213_EL.length - 1)] : null,
    el = atk || V5_MOB_EL?.[type] || "neutral";
  const k = Math.pow(cfg.fK, f - 1);
  const m = addMob(type, lv, G.W / 2, v1213BossY(), { boss: 1, elite: false, noAf: 1 });
  m.hp = m.max = cfg.hp1 * k * (af.hp || 1);
  m.sh = m.shm = 0;
  m.dmg = cfg.d1 * k * (af.dmg || 1);
  m.v124 = roBossKeys[i] || "";
  m.spawnT = 1;
  m.ag = true;
  m.bn = "地獄・" + MAPS[i].boss;
  const cdk = cfg.cdK * (af.cd || 1);
  m.v1213 = { kind: "boss", f, af, res, atk, el, ax: G.W / 2, ay: v1213BossY(), cdk, warn: af.warn || 1, cdB: 2, gcd: 2.5, cd: Object.fromEntries(V1213_SK.map((s) => [s.k, s.cd * cdk * (0.4 + RAND() * 0.5)])), t: 0, enr: 0 };
  v1213TntProp(m);
  R.boss = m;
  R.ft = 0;
  G.flashes.push({ x: m.x, y: m.y - 10, t: 0, ring: 1, c: V1213_ELC[el] || "#ff4a5a" });
  try {
    shake(0.3);
    sfx("boss");
  } catch (e) {}
  const tags = [af.n && `${af.n}：${af.d}`, atk && `攻擊帶${V5_EL[atk]}屬性`, res && `${V5_EL[res]}屬性抗性 ${Math.round(cfg.resV * 100)}%`].filter(Boolean);
  toast(`第 ${f} 層：${m.bn}${tags.length ? `（${tags.join("；")}）` : ""}`, "bad");
  return m;
}
function v1213Haz(m, o) {
  const B = m.v1213,
    t = (o.t || 1.2) * (B?.warn || 1);
  const h = { ...o, t, T: t, dmg: 0, nk: 1, src: m, c: o.c || V1213_ELC[B?.el] || "#ff4a5a", dg: o.dg ?? RAND() < 0.5, v1213d: o.d, go: (e) => v1213HazHit(e) };
  G.haz.push(h);
  return h;
}
function v1213HazHit(e) {
  const m = e.src;
  if (!m || !alive(m)) return;
  for (const c of v1213Alive()) if (inHaz(e, c.pl.x, c.pl.y)) v1213Hurt(c, e.v1213d, m, 0);
}
function v1213BossDmg(m, k) {
  const B = m.v1213;
  let d = m.dmg * k;
  if (B.af.fury && m.hp < m.max * 0.5) d *= 1 + B.af.fury;
  if (B.enr) d *= V1213.cfg.enrageK;
  return d;
}
function v1213Hurt(c, d, src, kind = 0) {
  if (!c || c.dead || !(d > 0)) return 0;
  const dd = v1213Run(c, () => {
    const h0 = S.hp;
    damagePlayer(d, src ? src.x : null, src ? src.y : null, src || null, kind);
    return Math.max(0, h0 - Math.max(0, S.hp));
  });
  c.hurt += dd;
  if (src && src.v1213 && src.v1213.af?.leech && alive(src)) src.hp = Math.min(src.max, src.hp + dd * src.v1213.af.leech);
  return dd;
}
function v1213Busy(m) {
  return m.stn > 0 || m.frz > 0 || (typeof v1211On === "function" && (v1211On(m, "pt") || v1211On(m, "sp")));
}
function v1213BossTick(dt) {
  const R = V1213.run;
  for (const m of G.mobs) {
    if (!m.v1213) continue;
    m.spd = 0;
    m.atk = 99;
    if (m.v1213.kind === "boss") {
      m.x = m.v1213.ax;
      m.y = m.v1213.ay;
      m.vx = m.vy = 0;
    }
  }
  const m = R.boss;
  if (!m || !alive(m) || m.spawnT > 0) return;
  const B = m.v1213;
  B.t += dt;
  if (!B.enr && B.t >= V1213.cfg.enrageT) {
    B.enr = 1;
    toast(`${m.bn} 狂怒了！（傷害 ×${V1213.cfg.enrageK}）`, "bad");
  }
  if (v1213Busy(m)) return;
  const fast = (m.hp < m.max * 0.3 ? 0.8 : 1) * B.cdk;
  B.cdB -= dt;
  B.gcd -= dt;
  for (const s of V1213_SK) B.cd[s.k] -= dt;
  // 普攻：地獄之爪
  if (B.cdB <= 0) {
    const c = v1213Target(m, true);
    if (c) {
      B.cdB = 1.5 * fast;
      // 普攻鎖定目標：預警跟著目標移動
      // v1.2.25：近身（距離 25 以內）的目標普攻傷害 +25%
      const near = Math.hypot(c.pl.x - m.x, c.pl.y - m.y) <= V1213.cfg.nearR;
      v1213Haz(m, { x: c.pl.x, y: c.pl.y, r: 12, t: 0.35, dg: false, d: v1213BossDmg(m, near ? 1 + V1213.cfg.nearK : 1), tk: (e) => (c.dead ? 0 : ((e.x = c.pl.x), (e.y = c.pl.y))) });
    }
  }
  if (B.gcd > 0) return;
  for (const s of V1213_SK) {
    if (B.cd[s.k] > 0) continue;
    if (s.k === "summon" && G.mobs.filter((x) => x.v1213add).length >= 4) continue;
    v1213Cast(m, s);
    B.cd[s.k] = s.cd * fast;
    B.gcd = 2.2 * fast;
    break;
  }
}
function v1213Cast(m, s) {
  const al = v1213Alive();
  if (!al.length) return;
  const d = v1213BossDmg(m, s.k1),
    col = V1213_ELC[m.v1213.el];
  num(m.x, m.y - m.h - 10, s.n, col);
  if (s.k === "sweep") {
    const c = v1213Target(m);
    v1213Haz(m, { k: "line", x: 6, y: c.pl.y, x2: G.W - 6, y2: c.pl.y, w: 10, t: 1.3, d });
  } else if (s.k === "pierce") {
    const c = al[ri(0, al.length - 1)];
    v1213Haz(m, { k: "line", x: c.pl.x, y: G.top + 4, x2: c.pl.x, y2: G.H - 4, w: 9, t: 1.3, d });
  } else if (s.k === "rain") {
    al.forEach((c, i) => v1213Haz(m, { x: c.pl.x, y: c.pl.y, r: 20, t: 1.6 + 0.15 * i, d }));
  } else if (s.k === "ring") {
    v1213Haz(m, { x: m.x, y: m.y, r: 110, ri: 46, t: 1.5, d });
  } else if (s.k === "roar") {
    G.flashes.push({ x: m.x, y: m.y - 10, t: 0, ring: 1, c: col });
    try {
      shake(0.25);
    } catch (e) {}
    for (const c of al) v1213Hurt(c, d, m, 0);
  } else if (s.k === "summon") {
    const i = (m.v1213.f - 1) % MAP_N;
    for (const dx of [-30, 30]) {
      const a = addMob(MAPS[i].bt, Math.min(LV_CAP, 127), m.x + dx, m.y + 14, { elite: false, noAf: 1 });
      a.hp = a.max = m.max * 0.025;
      a.dmg = m.dmg * s.k1;
      a.sh = a.shm = 0;
      a.ag = true;
      a.v1213add = 1;
      v1213TntProp(a);
    }
  }
}

// ---------------------------------------------------------------------------
// 6. 樓層：生成、過關、獎勵、全滅
function v1213Floor(dt) {
  const R = V1213.run;
  if (R.over) return;
  if (R.inter > 0) {
    if ((R.inter -= dt) <= 0) v1213Next();
    return;
  }
  R.ft += dt;
  const bossDead = R.boss && !alive(R.boss),
    ghostsDead = R.ghosts.length && R.ghosts.every((g) => !alive(g));
  if ((R.boss && bossDead) || (!R.boss && ghostsDead)) v1213Clear();
  if (!v1213Alive().length) {
    const canAuto = R.auto && R.scrolls > 0;
    R.wipeT += dt;
    if (!canAuto && R.wipeT > (R.scrolls > 0 ? 10 : 2.5)) {
      R.over = `隊伍全滅（最高通關第 ${R.best} 層）`;
      R.overT = 1.5;
    }
  } else R.wipeT = 0;
}
function v1213Next() {
  const R = V1213.run;
  R.floor++;
  R.boss = null;
  R.ghosts = [];
  G.haz.length = 0;
  for (const m of G.mobs.slice()) if (m.v1213 || m.v1213add) G.mobs.splice(G.mobs.indexOf(m), 1);
  // 隊員回到陣型位置
  for (const c of R.members) {
    const [x, y] = v1213CellPos(c.cell);
    c.pl.x = x;
    c.pl.y = y;
    c.pl.vx = c.pl.vy = 0;
    c.pl.tgt = null;
  }
  if (R.floor > 1 && RAND() < V1213.cfg.ghostP && v1213GhostReady()) v1213GhostSpawn(R.floor);
  else v1213Spawn(R.floor);
}
function v1213Clear() {
  const R = V1213.run;
  const f = R.floor;
  R.best = Math.max(R.best, f);
  for (const m of G.mobs.slice()) if (m.v1213add) G.mobs.splice(G.mobs.indexOf(m), 1);
  G.haz.length = 0;
  R.boss = null;
  R.ghosts = [];
  const got = v1213Reward(f);
  toast(`通關第 ${f} 層！${got.length ? "獲得：" + got.join("、") : ""}（用時 ${Math.round(R.ft)} 秒）`, got.length ? "r4" : "lvl", 1);
  // 隊員回復 25% 生命
  for (const c of R.members)
    if (!c.dead)
      v1213Run(c, () => {
        S.hp = Math.min(PS.maxhp, S.hp + PS.maxhp * 0.25);
      });
  R.inter = V1213.cfg.interT;
}
function v1213Reward(f) {
  const R = V1213.run,
    rw = V1213.cfg.rw,
    got = [];
  v1213Run(R.lead, () => {
    if (RAND() < rw.card) {
      const pool = V5_CARDS.filter((c) => c.t === 6 && !c.ex);
      const c = pool[ri(0, pool.length - 1)];
      if (c) {
        v5GainCard(c.id);
        got.push(c.n);
      }
    }
    if (RAND() < rw.myth) {
      const it = v1213Myth();
      if (it) {
        S.bag.push(it);
        got.push(v6Txt(itemName(it)));
      }
    }
    if (RAND() < rw.ring) {
      const it = v1213Ring();
      if (it) {
        S.bag.push(it);
        got.push(UNIQUE.v1213_bond.n);
      }
    }
    const a = v1213Acct();
    if (RAND() < rw.pet) {
      a.pet++;
      got.push("寵物扭蛋券");
    }
    // v1.2.20：變異技能寶石（隊長職業）
    if (RAND() < (rw.gem || 0) && typeof makeMutGem === "function") {
      let g = null;
      try {
        g = makeMutGem();
      } catch (e) {}
      if (g && SKILLS[g.id]) {
        g.nw = 1;
        S.gems.push(g);
        got.push(`變異技能寶石「${SKILLS[g.id].n}」`);
        try {
          ui.badge("skill", 1);
        } catch (e) {}
      }
    }
    if (f >= V1213.cfg.skinFloor && !S.v1213skin) {
      S.v1213skin = 1;
      a.skin++;
      got.push(`皮膚美容券（隊長第一次通關第 ${V1213.cfg.skinFloor} 層）`);
    }
    v1213AcctSave(a);
    markDirty();
  });
  R.rew.push(...got.map((n) => ({ f, n })));
  return got;
}
function v1213Myth() {
  const slot = SLOTS[ri(0, SLOTS.length - 1)],
    it = makeItem(130, { slot, rar: 4 });
  if (!it) return null;
  it.my = 1;
  it.v74my = 1;
  delete it.uq;
  delete it.v5;
  v5Convert(it);
  it.v71l = 1;
  const cap = v5SlotCap(it),
    min = Math.min(cap, slot === "weapon" ? 3 : 1);
  it.cs = min + v5RollSlots(cap - min);
  it.cards = Array(it.cs).fill(null);
  v5Name(it);
  it.nw = 1;
  return it;
}
function v1213Ring() {
  try {
    const it = rollItem(127, { uniq: 1, uqk: "v1213_bond", extra: 1 }).find((x) => x && x.uq === "v1213_bond");
    if (it) it.nw = 1;
    return it || null;
  } catch (e) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 7. 隊員倒下與復活卷軸
function v1213Down(c) {
  const R = V1213.run;
  S.hp = 0;
  c.dead = true;
  c.deaths++;
  c.downT = R.t;
  const p = G.pl;
  p.sus = {};
  p.stk = {};
  p.anim = null;
  p.tgt = null;
  G.mins = [];
  G.gsp = [];
  G.turs = [];
  try {
    burst(p.x, p.y, 24, ["#ffffff", "#ff8a9a", "#3a2f52"], 90, { z: 8 });
  } catch (e) {}
  if (!V1213.quiet) toast(`${c.name} 倒下了${R.auto && R.scrolls > 0 ? "（自動使用復活卷軸）" : R.scrolls > 0 ? "（可在隊伍列表使用復活卷軸）" : ""}`, "bad");
}
function v1213ReviveOne(c) {
  const R = V1213.run;
  if (!R || !c || !c.dead || R.scrolls <= 0) return false;
  R.scrolls--;
  R.used++;
  c.rev++;
  c.dead = false;
  v1213Run(c, () => {
    S.hp = Math.max(1, Math.round(PS.maxhp * V1213.cfg.reviveHp));
    G.pl.hurt = 0;
    G.pl.atk = 0.4;
    G.flashes.push({ x: G.pl.x, y: G.pl.y - 6, t: 0, ring: 1, c: "#7dffc8" });
    num(G.pl.x, G.pl.y - 26, "復活", "#7dffc8");
  });
  return true;
}
function v1213Revive(dt) {
  const R = V1213.run;
  if (!R.auto || R.scrolls <= 0 || R.over) return;
  if ((R.revT -= dt) > 0) return;
  const dead = R.members.filter((c) => c.dead && R.t - c.downT >= V1213.cfg.reviveDelay);
  if (!dead.length) return;
  const order = (c) => {
    const i = R.pri.indexOf(c.id);
    return i < 0 ? 99 : i;
  };
  dead.sort((a, b) => order(a) - order(b));
  if (v1213ReviveOne(dead[0])) R.revT = V1213.cfg.reviveDelay;
}

// ---------------------------------------------------------------------------
// 8. 組隊獨特戒指「羈絆之戒」
const V1213_UQ = {
  v1213_bond: {
    n: "羈絆之戒",
    slot: "ring",
    hi: 2,
    v: [5, 3],
    src: "party",
    ico: 2607,
    hitMul: (d) => d * (1 + (v1213BondN() * uv("v1213_bond", 0)) / 100),
    d: "組隊副本中，每名存活的隊友使你造成的傷害 +{0}%、受到的傷害 −{1}%（最多 4 名）；組隊副本以外，召喚英靈（生命為你最大生命的 70%），每 5 秒嘲諷附近的敵人、不會攻擊，倒下後 30 秒再次召喚。只在組隊副本掉落",
  },
};
function v1213BondN() {
  const R = V1213.run;
  if (R) return Math.min(4, R.members.filter((c) => !c.dead && c !== V1213.cur).length);
  return 0; // v1.2.20：組隊副本以外改為召喚英靈（ro-v1220.js）
}

// ---------------------------------------------------------------------------
// 9. 排行榜上的其他隊伍（快照）
function v1213GhostReady() {
  const L = V1213RK.list;
  return !!(L && L.some((r) => r.id !== S?.cid));
}
function v1213GhostSpawn(f) {
  const R = V1213.run,
    cfg = V1213.cfg;
  const pool = (V1213RK.list || []).filter((r) => r.id !== R.lead.id && Array.isArray(r.mem) && r.mem.length);
  if (!pool.length) return v1213Spawn(f);
  const team = pool[ri(0, pool.length - 1)];
  const k = Math.pow(cfg.fK, f - 1),
    n = team.mem.length;
  R.ghostTeam = team;
  team.mem.forEach((mm, i) => {
    const x = G.W / 2 + (i - (n - 1) / 2) * 30,
      y = v1213BossY() + 8 + (i % 2) * 10;
    const m = addMob("knight", Math.min(LV_CAP, mm.l || 127), x, y, { elite: false, noAf: 1 });
    m.hp = m.max = (cfg.hp1 * k) / n;
    m.dmg = (cfg.d1 * k * 0.9) / Math.sqrt(n);
    m.sh = m.shm = 0;
    m.spawnT = 1;
    m.ag = true;
    m.boss = 1;
    m.h = 20;
    m.bn = mm.n || "影子";
    m.v1213 = { kind: "ghost", f, af: { k: "none" }, el: "neutral", cls: CLASS[mm.c] ? mm.c : "sword", br: mm.b || "", lv: mm.l || 127, melee: v1213Melee(mm.c, mm.b), cdB: 1 + RAND(), warn: 1, cdk: cfg.cdK, ax: x, ay: y, t: 0 };
    v1213TntProp(m);
    R.ghosts.push(m);
  });
  try {
    sfx("boss");
    shake(0.3);
  } catch (e) {}
  toast(`第 ${f} 層：遇到隊伍排行榜上「${team.name}」的隊伍快照！`, "bad", 1);
}
function v1213GhostTick(dt) {
  const R = V1213.run;
  for (const m of R.ghosts) {
    if (!alive(m) || m.spawnT > 0) continue;
    const B = m.v1213;
    B.t += dt;
    if (v1213Busy(m)) continue;
    const c = v1213Target(m, true);
    if (!c) continue;
    const reach = B.melee ? 16 : 80,
      d = Math.hypot(c.pl.x - m.x, c.pl.y - m.y);
    if (d > reach) {
      const sp = 30 * dt,
        a = Math.atan2(c.pl.y - m.y, c.pl.x - m.x);
      m.x += Math.cos(a) * sp;
      m.y += Math.sin(a) * sp;
      m.face = c.pl.x < m.x ? -1 : 1;
      m.v1213mv = 1;
    } else m.v1213mv = 0;
    if ((B.cdB -= dt) <= 0 && d <= reach + 4) {
      B.cdB = 1.2 * B.cdk * 1.4;
      m.v1213at = G.t;
      v1213Haz(m, { x: c.pl.x, y: c.pl.y, r: 11, t: B.melee ? 0.3 : 0.5, dg: false, d: m.dmg, tk: (e) => (c.dead ? 0 : ((e.x = c.pl.x), (e.y = c.pl.y))) });
    }
    try {
      inArena(m);
    } catch (e) {}
  }
}
// 影子隊員畫成角色
function v1213DrawGhost(c, m) {
  const B = m.v1213;
  let st = B.fake;
  if (!st) {
    st = B.fake = v1213Quiet(() => newState(B.cls));
    st.tal = { ...(st.tal || {}), asc: B.br };
    st.lvl = B.lv;
  }
  const p = (B.pl ||= { x: m.x, y: m.y, vx: 0, vy: 0, face: Math.PI / 2, dir: "down", anim: null, moving: 0, walkT: 0, hurt: 0, sus: {}, stk: {} });
  p.x = m.x;
  p.y = m.y;
  p.moving = m.v1213mv ? 1 : 0;
  p.walkT = (p.walkT || 0) + 0.016;
  p.face = m.face < 0 ? Math.PI : 0;
  p.anim = G.t - (m.v1213at || -9) < 0.25 ? { k: "swing", t: G.t - m.v1213at, dur: 0.25, a: p.face } : null;
  p.hurt = m.flash || 0;
  const s0 = S,
    p0 = G.pl,
    d0 = G.dead;
  S = st;
  G.pl = p;
  G.dead = 0;
  c.save();
  c.globalAlpha = 0.85;
  try {
    V1213.drawing++;
    drawPlayer(c);
  } catch (e) {
  } finally {
    V1213.drawing--;
    c.restore();
    S = s0;
    G.pl = p0;
    G.dead = d0;
  }
}

// ---------------------------------------------------------------------------
// 10. 隊伍排行榜
const V1213RK = { api: "/api/party", list: null, at: 0, loading: false, err: "", last: null, snap: {} };
const v1213RkOn = () => (typeof v6RkOn === "function" ? v6RkOn() : false);
async function v1213RkFetch(force) {
  if (!v1213RkOn() || V1213RK.loading) return;
  if (!force && V1213RK.list && Date.now() - V1213RK.at < 30000) return;
  V1213RK.loading = true;
  V1213RK.err = "";
  try {
    const r = await fetch(V1213RK.api, { cache: "no-store" });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || r.status);
    V1213RK.list = j.list || [];
    V1213RK.at = Date.now();
  } catch (e) {
    V1213RK.err = "無法讀取隊伍排行：" + (e.message || e);
  }
  V1213RK.loading = false;
  v1213RkRefresh();
}
function v1213RkPrefetch() {
  if (!V1213RK.list) v1213RkFetch();
}
const V1213_RKERR = { cooldown: "這個帳號 100 分鐘內已經上傳過", banned: "這個帳號已被封鎖", bind: "Google 登入已過期，請重新登入", "owner mismatch": "隊長角色的憑證不符", "bad data": "紀錄資料異常", "too large": "快照太大" };
async function v1213RkSend(res, snap) {
  if (!v1213RkOn() || typeof V98C === "undefined" || !V98C.tok) {
    V1213RK.last = { err: "沒有綁定 Google，這次紀錄不會上傳隊伍排行" };
    return;
  }
  const tok = typeof v6RkTok === "function" ? v6RkTok() : "";
  const body = {
    id: S.cid,
    tok,
    name: S.name || "無名",
    cls: S.cls,
    floor: res.floor,
    sec: Math.round(res.t * 10) / 10,
    mem: res.members.map((m, i) => {
      const o = { n: m.name, c: m.cls, b: m.br, l: m.lv },
        lk = snap && snap[i] && snap[i].s && snap[i].s.look; // v1.2.16：外觀與寵物
      if (lk) {
        if (lk.sp) o.sp = lk.sp;
        o.x = lk.sex === "f" ? "f" : "m";
        if (lk.pet && typeof V1215_BY !== "undefined" && V1215_BY[lk.pet.k]) o.p = { k: lk.pet.k, r: V1215_BY[lk.pet.k].r, s: lk.pet.s };
      }
      return o;
    }),
    d: { mem: snap },
  };
  try {
    const r = await fetch(V1213RK.api, { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + V98C.tok }, body: JSON.stringify(body) });
    const j = await r.json();
    V1213RK.last = j;
    V1213RK.at = 0;
    if (j.ok && j.best) toast(`隊伍排行：新紀錄！第 ${res.floor} 層，目前第 ${j.rank} 名`, "lvl", 1);
    else if (j.ok) toast(`隊伍排行：這次第 ${res.floor} 層，未超過最佳紀錄`, "lvl");
    else toast("隊伍排行上傳失敗：" + (V1213_RKERR[j.error] || j.error || r.status), "bad");
  } catch (e) {
    V1213RK.last = { err: "連線問題" };
    toast("隊伍排行上傳失敗（連線問題）", "bad");
  }
}
async function v1213RkSnap(id) {
  if (V1213RK.snap[id]) return V1213RK.snap[id];
  try {
    const r = await fetch(V1213RK.api + "?id=" + encodeURIComponent(id), { cache: "no-store" });
    const j = await r.json();
    if (r.ok) V1213RK.snap[id] = j;
    return r.ok ? j : null;
  } catch (e) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 11. 介面：挑戰頁卡片、組隊設定、戰鬥中的隊伍列表、結算、隊伍排行
const V1213U = { ids: null, cells: null, sel: null, auto: 1, pri: null, view: "set" };
const v1213Esc = (s) => (typeof esc === "function" ? esc(String(s ?? "")) : String(s ?? ""));
const v1213Br = (cls, br) => {
  try {
    return brName(cls, br);
  } catch (e) {
    return CLASS[cls]?.n || "";
  }
};
function v1213Card() {
  const a = v1213Acct(),
    why = v1213CanStart(),
    best = S.v1213best || 0;
  return `<section class="ro-arena-card v1213card"><h3>組隊副本・地獄級頭目${typeof helpBtn === "function" ? helpBtn("v1213") : ""}</h3><p class="note">帶同一存檔的其他角色組成 3～5 人隊伍（隊友使用各自上次存檔的快照，完整施放自己的技能盤），一路往上挑戰地獄頭目，每層生命與傷害 ×1.15。入場後整個帳號冷卻 2 小時。</p><div class="row v1213info"><span>最高 第 <b class="px">${best}</b> 層</span><span>復活卷軸 <b class="px">${a.sc}</b></span><span>寵物扭蛋券 <b class="px">${a.pet}</b></span><span>皮膚美容券 <b class="px">${a.skin}</b></span></div><div class="row"><button class="btn sm primary" data-v1213="open" ${why ? "disabled" : ""}>${why ? v1213Esc(why) : "組隊"}</button></div></section>`;
}
function v1213Roster() {
  try {
    return (rosterGet().list || []).filter((c) => c && c.id && c.id !== S.cid && CLASS[c.cls]);
  } catch (e) {
    return [];
  }
}
function v1213Open() {
  const a = v1213Acct(),
    ro = v1213Roster(),
    o = a.opt || {};
  if (!V1213U.ids) {
    V1213U.ids = (o.ids || []).filter((id) => ro.some((c) => c.id === id)).slice(0, 4);
    if (!V1213U.ids.length) V1213U.ids = ro.slice(0, 4).map((c) => c.id);
    V1213U.auto = o.auto === 0 ? 0 : 1;
    V1213U.pri = (o.pri || []).slice();
    V1213U.cells = { ...(o.cells || {}) };
  }
  v1213Sheet();
}
function v1213Team() {
  const ro = v1213Roster();
  const lead = { id: S.cid, name: S.name || CLASS[S.cls].n, cls: S.cls, br: S.tal?.asc || "", lvl: S.lvl, lead: 1 };
  const mem = V1213U.ids.map((id) => ro.find((c) => c.id === id)).filter(Boolean);
  return [lead, ...mem.map((c) => ({ id: c.id, name: c.name || CLASS[c.cls].n, cls: c.cls, br: "", lvl: c.lvl }))];
}
function v1213FixCells(team) {
  const cells = V1213U.cells || (V1213U.cells = {});
  for (const k of Object.keys(cells)) if (!team.some((m) => m.id === k)) delete cells[k];
  const auto = v1213AutoCells(team),
    used = new Set(Object.values(cells));
  for (const m of team)
    if (!Number.isInteger(cells[m.id])) {
      let c = auto[m.id];
      if (used.has(c)) c = [...Array(9).keys()].find((i) => !used.has(i));
      cells[m.id] = c;
      used.add(c);
    }
  const pri = (V1213U.pri || []).filter((id) => team.some((m) => m.id === id));
  for (const m of team) if (!pri.includes(m.id)) pri.push(m.id);
  V1213U.pri = pri;
  return cells;
}
function v1213Sheet() {
  const a = v1213Acct(),
    ro = v1213Roster(),
    team = v1213Team(),
    cells = v1213FixCells(team),
    why = v1213CanStart(),
    n = team.length;
  const chip = (m) => `${v1213Esc(m.name)} <small>${CLASS[m.cls].n} Lv.${m.lvl}</small>`;
  const mem =
    `<button class="btn sm v1213mc on lead" disabled>${chip(team[0])}<em>隊長</em></button>` +
    ro.map((c) => `<button class="btn sm v1213mc ${V1213U.ids.includes(c.id) ? "on" : ""}" data-v1213="mem" data-id="${v1213Esc(c.id)}">${chip({ name: c.name || CLASS[c.cls].n, cls: c.cls, lvl: c.lvl })}</button>`).join("");
  const at = (i) => team.find((m) => cells[m.id] === i);
  const grid = [...Array(9).keys()]
    .map((i) => {
      const m = at(i);
      return `<button class="v1213cell ${m ? "has" : ""} ${V1213U.sel && m && V1213U.sel === m.id ? "sel" : ""}" data-v1213="cell" data-i="${i}">${m ? `<b>${v1213Esc(m.name)}</b><small>${CLASS[m.cls].n}</small>` : `<small>${["前排", "中排", "後排"][Math.floor(i / 3)]}</small>`}</button>`;
    })
    .join("");
  const pri = V1213U.pri
    .map((id, i) => {
      const m = team.find((x) => x.id === id);
      return m ? `<span class="v1213pri">${i + 1}. ${v1213Esc(m.name)}${i ? `<button class="btn sm" data-v1213="pri" data-id="${v1213Esc(id)}" title="提前">↑</button>` : ""}</span>` : "";
    })
    .join("");
  const sel = V1213U.sel ? team.find((m) => m.id === V1213U.sel) : null;
  bkSheet(
    `<h2 class="cfh">組隊副本・地獄級頭目</h2><div class="v1213s">` +
      `<p class="note">隊長（目前角色）傷害、最大生命 +15%，受到的傷害 −13%。隊友使用各角色上次存檔的快照，完整施放自己的技能盤；挑戰中不會改動隊友的存檔。${V1213.cfg.minN}～${V1213.cfg.maxN} 人才能入場，入場後整個帳號冷卻 2 小時。這個副本裡移動速度加成無效、頭目技能冷卻 −${Math.round((1 - V1213.cfg.cdK) * 100)}%。</p>` +
      `<h4>隊員 <small>已選 ${n}/${V1213.cfg.maxN} 人</small></h4><div class="v1213mem">${mem || ""}${ro.length ? "" : '<p class="note">這個存檔沒有其他角色，請先建立角色。</p>'}</div>` +
      `<h4>陣型 <small>${sel ? `已選「${v1213Esc(sel.name)}」，點一個格子放下` : "點格子裡的隊員，再點要放的格子（可交換）"}；頭目在上方，先攻擊最前排</small></h4><div class="v1213boss">頭目</div><div class="v1213grid">${grid}</div>` +
      `<h4>復活卷軸 <small>本次可用 ${V1213.cfg.scrolls} 張＋累積 ${a.sc} 張；沒用掉的會累積到下次</small></h4>` +
      `<label class="chk"><input type="checkbox" data-v1213="auto" ${V1213U.auto ? "checked" : ""}><span>隊員倒下時自動使用（復活後生命 50%）</span></label><div class="v1213pris">優先順序：${pri}</div>` +
      `<div class="row"><button class="btn" data-act="close">取消</button><span class="spacer"></span><button class="btn" data-v1213="rank">隊伍排行</button><button class="btn primary" data-v1213="go" ${why || n < V1213.cfg.minN ? "disabled" : ""}>${why ? v1213Esc(why) : n < V1213.cfg.minN ? `至少 ${V1213.cfg.minN} 人` : "開始挑戰"}</button></div></div>`,
  );
}
function v1213Click(b) {
  const k = b.dataset.v1213;
  if (k === "open") return v1213Open();
  if (k === "rank") return v1213RankSheet();
  if (k === "rkback") return v1213RankSheet();
  if (k === "rkv") return v1213RankView(b.dataset.id);
  if (k === "rksnap") return v1213RkMemSnap(b.dataset.id, b.dataset.i);
  if (k === "mem") {
    const id = b.dataset.id,
      i = V1213U.ids.indexOf(id);
    if (i >= 0) V1213U.ids.splice(i, 1);
    else if (V1213U.ids.length < V1213.cfg.maxN - 1) V1213U.ids.push(id);
    else toast(`最多 ${V1213.cfg.maxN} 人`, "bad");
    return v1213Sheet();
  }
  if (k === "cell") {
    const i = +b.dataset.i,
      team = v1213Team(),
      cells = v1213FixCells(team),
      m = team.find((x) => cells[x.id] === i);
    if (!V1213U.sel) V1213U.sel = m ? m.id : null;
    else {
      const old = cells[V1213U.sel];
      if (m && m.id !== V1213U.sel) cells[m.id] = old;
      cells[V1213U.sel] = i;
      V1213U.sel = null;
    }
    return v1213Sheet();
  }
  if (k === "pri") {
    const i = V1213U.pri.indexOf(b.dataset.id);
    if (i > 0) [V1213U.pri[i - 1], V1213U.pri[i]] = [V1213U.pri[i], V1213U.pri[i - 1]];
    return v1213Sheet();
  }
  if (k === "go") {
    const team = v1213Team(),
      cells = v1213FixCells(team);
    try {
      sheetOff();
    } catch (e) {
      $("#sheetBg").hidden = true;
    }
    v1213Start({ ids: V1213U.ids.slice(), cells: { ...cells }, auto: V1213U.auto, pri: V1213U.pri.slice() });
    return;
  }
  if (k === "quit") {
    const R = V1213.run;
    if (!R) return;
    if (R.quitAsk && R.t - R.quitT < 3) return v1213End(`放棄挑戰（最高通關第 ${R.best} 層）`);
    R.quitAsk = 1;
    R.quitT = R.t;
    toast("3 秒內再按一次「放棄」結束組隊副本", "bad");
    try {
      ui.hud();
    } catch (e) {}
    return;
  }
  if (k === "rev") {
    const c = V1213.ctxs[b.dataset.id];
    if (!v1213ReviveOne(c)) toast("沒有復活卷軸", "bad");
    return v1213Hud();
  }
  if (k === "hautop") {
    if (V1213.run) V1213.run.auto = V1213.run.auto ? 0 : 1;
    return v1213Hud();
  }
}
// 戰鬥中的隊伍列表
function v1213HudOn() {
  let el = document.getElementById("v1213hud");
  if (!el) {
    el = document.createElement("div");
    el.id = "v1213hud";
    (document.getElementById("stageWrap") || document.body).appendChild(el);
  }
  el.hidden = false;
  v1213Hud();
}
function v1213HudOff() {
  const el = typeof document !== "undefined" && document.getElementById("v1213hud");
  if (el) el.hidden = true;
}
function v1213Hud() {
  const R = V1213.run,
    el = typeof document !== "undefined" && document.getElementById("v1213hud");
  if (!R || !el) return;
  try {
    const cv = document.getElementById("stage");
    if (cv && G.H) {
      const r = cv.getBoundingClientRect(),
        w = el.parentElement.getBoundingClientRect();
      el.style.top = Math.round(r.top - w.top + (G.top / G.H) * r.height + 4) + "px";
    } else el.style.top = "";
  } catch (e) {}
  const m = R.boss,
    gh = R.ghosts.filter((g) => alive(g));
  const bhp = m && alive(m) ? m.hp / m.max : gh.length ? gh.reduce((s, g) => s + g.hp, 0) / gh.reduce((s, g) => s + g.max, 0) : 0;
  const bn = m ? m.bn : R.ghostTeam ? `「${R.ghostTeam.name}」的隊伍` : R.inter > 0 ? "準備下一層…" : "";
  const B = m && m.v1213;
  const tags = B ? [B.af.n, B.atk ? `${V5_EL[B.atk]}攻` : "", B.res ? `${V5_EL[B.res]}抗` : "", B.enr ? "狂怒" : ""].filter(Boolean).join("・") : "";
  const rows = R.members
    .map((c) => {
      const hp = c.dead ? 0 : Math.max(0, c.S.hp) / Math.max(1, c.PS?.maxhp || (c === V1213.cur ? PS.maxhp : 1));
      return `<div class="v1213r ${c.dead ? "dead" : ""}"><span class="n">${c.role === "lead" ? "★" : ""}${v1213Esc(c.name)}</span><span class="bar"><i style="width:${Math.round(hp * 100)}%"></i></span>${c.dead ? (R.scrolls > 0 ? `<button class="btn sm" data-v1213="rev" data-id="${v1213Esc(c.id)}">復活</button>` : "<em>倒下</em>") : `<em>${Math.round(hp * 100)}%</em>`}</div>`;
    })
    .join("");
  el.innerHTML = `<div class="v1213h"><b>第 ${Math.max(1, R.floor)} 層</b><span class="bn">${v1213Esc(bn)}${tags ? ` <small>${v1213Esc(tags)}</small>` : ""}</span></div><div class="v1213bb"><i style="width:${Math.round(bhp * 100)}%"></i></div><div class="v1213h2"><span>${Math.floor(R.t / 60)}:${String(Math.floor(R.t % 60)).padStart(2, "0")}</span><span>卷軸 ${R.scrolls}</span><label><input type="checkbox" data-v1213="hautop" ${R.auto ? "checked" : ""}>自動</label><button class="btn sm" data-v1213="quit">放棄</button></div>${rows}`;
}
function v1213Result(res) {
  const rows = res.members.map((m) => `<tr><td>${v1213Esc(m.name)}</td><td>${CLASS[m.cls]?.n || ""}</td><td class="px">${fmt(m.dmg)}</td><td class="px">${fmt(m.hurt)}</td><td class="px">${m.deaths}</td></tr>`).join("");
  const rew = res.rew.length ? res.rew.map((r) => `<li>第 ${r.f} 層：${v1213Esc(r.n)}</li>`).join("") : "<li>沒有獲得獎勵</li>";
  bkSheet(
    `<h2 class="cfh">組隊副本結算</h2><div class="v1213s"><p><b>最高通關：第 ${res.floor} 層</b>・用時 ${Math.floor(res.t / 60)} 分 ${Math.round(res.t % 60)} 秒</p><p class="note">${v1213Esc(res.why)}。剩下的復活卷軸 ${res.scrolls} 張已累積到下次。</p><table class="v1213t"><tr><th>隊員</th><th>職業</th><th>造成傷害</th><th>受到傷害</th><th>倒下</th></tr>${rows}</table><h4>獎勵</h4><ul>${rew}</ul><div class="row"><span class="spacer"></span><button class="btn" data-v1213="rank">隊伍排行</button><button class="btn primary" data-act="close">確定</button></div></div>`,
  );
  if (res.floor > (S.v1213best || 0)) {
    S.v1213best = res.floor;
    markDirty();
  }
}
function v1213RankSheet() {
  v1213RkFetch();
  const L = V1213RK.list;
  const body = !v1213RkOn()
    ? '<p class="note">隊伍排行只在網頁版開放。</p>'
    : V1213RK.err
      ? `<p class="note">${v1213Esc(V1213RK.err)}</p>`
      : !L
        ? '<p class="note">讀取中…</p>'
        : L.length
          ? `<div class="v1213rk">${L.map((r, i) => `<button class="v1213rki" data-v1213="rkv" data-id="${v1213Esc(r.id)}"><span class="px">${i + 1}</span><b>${v1213Esc(r.name)}</b><span>第 <b class="px">${r.floor}</b> 層</span><small>${(r.mem || []).map((m) => CLASS[m.c]?.n || "").join("・")}</small></button>`).join("")}</div>`
          : '<p class="note">還沒有紀錄。</p>';
  bkSheet(`<h2 class="cfh">隊伍排行</h2><div class="v1213s"><p class="note">比照無限武鬥場：比通關層數，再比用時。需要綁定 Google 才能上傳；每次挑戰結束自動上傳。</p>${body}<div class="row"><span class="spacer"></span><button class="btn" data-act="close">關閉</button></div></div>`);
}
async function v1213RankView(id) {
  const r = (V1213RK.list || []).find((x) => x.id === id);
  if (!r) return;
  bkSheet(`<h2 class="cfh">${v1213Esc(r.name)} 的隊伍</h2><div class="v1213s"><p class="note">讀取中…</p></div>`);
  const j = await v1213RkSnap(id);
  const mem = (j && j.d && j.d.mem) || [];
  // v1.2.20：隊長顯示人物圖與寵物（ro-v1216.js），每位隊員可點開構築快照（裝備、技能盤，同無限武鬥場）
  const li = v1213RkLead(id);
  const list = (r.mem || [])
    .map((m, i) => {
      const s = mem[i] && mem[i].s,
        ps = s && s.snap && s.snap.ps;
      const btn = s && s.snap ? `<button class="btn sm" data-v1213="rksnap" data-id="${v1213Esc(id)}" data-i="${i}">構築快照</button>` : `<span class="note">這筆紀錄沒有構築快照</span>`;
      return `<div class="v1213rv${i === li ? " lead" : ""}"><div class="v1213rvh"><b>${v1213Esc(m.n)}</b> <small>${v1213Esc(v1213Br(m.c, m.b))} Lv.${m.l}${i === li ? "・隊長" : ""}</small>${ps ? `<div class="note">預估 DPS ${fmt(ps.dps)}・生命 ${fmt(ps.hp)}</div>` : ""}</div>${btn}</div>`;
    })
    .join("");
  bkSheet(`<h2 class="cfh">${v1213Esc(r.name)} 的隊伍</h2><div class="v1213s"><p>第 <b>${r.floor}</b> 層・${Math.floor(r.sec / 60)} 分 ${Math.round(r.sec % 60)} 秒</p>${list}<div class="row"><button class="btn" data-v1213="rkback">返回</button><span class="spacer"></span><button class="btn" data-act="close">關閉</button></div></div>`);
}
// 隊長在隊員快照裡的位置（快照的 id 是角色 ID）
function v1213RkLead(id) {
  const j = V1213RK.snap[id],
    mem = (j && j.d && j.d.mem) || [];
  const i = mem.findIndex((x) => x && x.id === id);
  return i >= 0 ? i : 0;
}
// 隊員的構築快照：沿用無限武鬥場的快照畫面
function v1213RkMemSnap(id, i) {
  const L = V1213RK.list || [],
    r = L.find((x) => x.id === id),
    j = V1213RK.snap[id],
    e = j && j.d && Array.isArray(j.d.mem) ? j.d.mem[+i] : null,
    snap = e && e.s && e.s.snap;
  let sc = null;
  try {
    sc = snap && typeof snapClean === "function" ? snapClean(snap) : null;
  } catch (x) {}
  if (!r || !sc || !ui.snapOpen) return void toast("這位隊員沒有構築快照", "bad");
  const m = (r.mem && r.mem[+i]) || {},
    key = `v1213:${id}:${+i}`;
  sc.lv = m.l || e.lv || sc.lv;
  LB.snap[key] = { s: sc, ts: r.t || Date.now() };
  ui.snapPg = 0;
  ui.snapOpen({ v6: 1, v1213: id, p: key, name: m.n || e.name || "隊員", cls: sc.cls || m.c, br: sc.br, lv: sc.lv, floor: r.floor, r: L.indexOf(r) + 1 }, undefined);
}
function v1213RkRefresh() {
  try {
    const sh = document.querySelector("#sheet .v1213rk, #sheet .v1213s");
    if (sh && /隊伍排行/.test(document.querySelector("#sheet .cfh")?.textContent || "")) v1213RankSheet();
  } catch (e) {}
}
const V1213_CSS = `
.v1213card .v1213info{flex-wrap:wrap;gap:4px 12px;font-size:12px}
.v1213s h4{margin:10px 0 4px;font-size:13px}.v1213s h4 small{font-weight:400;color:var(--muted)}
.v1213mem{display:flex;flex-wrap:wrap;gap:4px}.v1213mc{display:inline-flex;gap:4px;align-items:baseline}.v1213mc.on{outline:2px solid var(--ember,#e07a2e)}.v1213mc em{font-style:normal;font-size:11px;color:var(--ember,#e07a2e)}
.v1213boss{text-align:center;font-size:11px;color:#c0303c;margin:2px 0}
.v1213grid{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;max-width:300px;margin:0 auto}
.v1213cell{min-height:42px;border:1px dashed #9fb3c8;border-radius:6px;background:rgba(255,255,255,.5);display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:12px;cursor:pointer}
.v1213cell.has{border-style:solid;background:#fff}.v1213cell.sel{outline:2px solid #e07a2e}.v1213cell small{color:var(--muted);font-size:10px}
.v1213pris{display:flex;flex-wrap:wrap;gap:6px;font-size:12px;margin-top:4px}.v1213pri .btn{padding:0 6px;margin-left:2px}
#v1213hud{position:absolute;left:6px;top:58px;z-index:6;width:178px;background:rgba(14,8,20,.72);color:#f3ead8;border:1px solid rgba(255,90,100,.5);border-radius:6px;padding:5px 6px;font-size:11px;line-height:1.35}
#v1213hud[hidden]{display:none}#v1213hud .v1213h{display:flex;gap:6px;align-items:baseline}#v1213hud .bn{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#v1213hud small{color:#ffb0b8}
#v1213hud .v1213bb{height:5px;background:#3a1820;border-radius:3px;margin:3px 0}#v1213hud .v1213bb i{display:block;height:100%;background:#ff4a5a;border-radius:3px}
#v1213hud .v1213h2{display:flex;gap:6px;align-items:center;margin-bottom:3px}#v1213hud .v1213h2 .btn{margin-left:auto;padding:0 6px;font-size:11px}#v1213hud label{display:flex;align-items:center;gap:2px}
#v1213hud .v1213r{display:flex;gap:4px;align-items:center;margin-top:2px}#v1213hud .v1213r .n{width:64px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#v1213hud .v1213r .bar{flex:1;height:5px;background:#2a2a36;border-radius:3px}#v1213hud .v1213r .bar i{display:block;height:100%;background:#5fd38a;border-radius:3px}
#v1213hud .v1213r.dead{opacity:.7}#v1213hud .v1213r em{font-style:normal;width:30px;text-align:right}#v1213hud .v1213r .btn{padding:0 5px;font-size:11px}
.v1213t{width:100%;border-collapse:collapse;font-size:12px}.v1213t th,.v1213t td{border-bottom:1px solid #d6dee8;padding:3px 4px;text-align:left}
.v1213rk{display:flex;flex-direction:column;gap:3px}.v1213rki{display:grid;grid-template-columns:28px 1fr auto;gap:2px 6px;align-items:baseline;text-align:left;padding:4px 6px;border:1px solid #d6dee8;border-radius:6px;background:#fff;cursor:pointer}.v1213rki small{grid-column:2/4;color:var(--muted)}
.v1213rv{border-top:1px solid #d6dee8;padding:6px 0;display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px}.v1213rv .v1213rvh{flex:1;min-width:150px}.v1213rv.lead{flex-direction:column;align-items:stretch}.v1213rv.lead>.btn{align-self:flex-start}.v1213eq{font-size:11px;color:var(--muted);margin-top:3px}
#v1213hud .v1213h2{white-space:nowrap}
@media (max-width:760px){#v1213hud{width:150px;padding:3px 4px;font-size:10px;line-height:1.25}#v1213hud .v1213r .n{width:52px}#v1213hud .v1213h2{gap:4px}}`;

// ---------------------------------------------------------------------------
// 12. 安裝
function v1213HitEl(o) {
  if (!o) return "neutral";
  if (o.v6el) return o.v6el;
  const a = { brn: "fire", chl: "water", shk: "wind", psn: "poison" }[o.ail];
  if (a) return a;
  try {
    if (typeof v83SkillOf === "function") return SKILLS[v83SkillOf(o)]?.el || "neutral";
  } catch (e) {}
  return "neutral";
}
function v1213Block(name) {
  let f = null;
  try {
    f = (0, eval)(name);
  } catch (e) {}
  if (typeof f !== "function") return;
  const w = function (...a) {
    if (V1213.run) return void toast("組隊副本進行中，請先結束挑戰（隊伍列表的「放棄」）", "bad");
    return f.apply(this, a);
  };
  try {
    globalThis.__v1213w = w;
    (0, eval)(`${name} = globalThis.__v1213w`);
  } catch (e) {}
}
function v1213Install() {
  if (typeof newWorld !== "function" || typeof V1213B === "undefined") return;
  // 帳號資料：共用倉庫保留組隊副本的欄位
  const sc = stClean;
  stClean = function (t, ...x) {
    const a = sc.call(this, t, ...x);
    const v = t && v1213AcctClean(t.v1213);
    if (v) a.v1213 = v;
    return a;
  };
  try {
    if (STH && !STH.v1213) {
      const raw = JSON.parse(localStorage.getItem(STASH_KEY) || "null");
      const v = raw && v1213AcctClean(raw.v1213);
      if (v) STH.v1213 = v;
    }
  } catch (e) {}
  // 組隊獨特戒指
  for (const [k, u] of Object.entries(V1213_UQ)) {
    UNIQUE[k] = u;
    if (typeof RO_UQ !== "undefined") RO_UQ[k] = u;
    u.ic = "u_" + k;
    if (typeof ICONS !== "undefined") ICONS["u_" + k] ||= ICONS.sw0;
    if (typeof roItemFiles !== "undefined") roItemFiles["u_" + k] = u.ico;
  }
  v1213ModsInit();
  // 每格畫面
  const chain = tick;
  tick = function (dt, ...x) {
    if (!V1213.run) return chain.call(this, dt, ...x);
    return v1213Frame(dt, chain, this, x);
  };
  // 擊中：切回施放者的資料計算
  const hm = hitMob;
  hitMob = function (m, mult, o, ...x) {
    const R = V1213.run;
    if (R && o && o.v1213o && V1213.cur && o.v1213o !== V1213.cur.id) {
      const c = V1213.ctxs[o.v1213o];
      if (c && !c.gone) return v1213Run(c, () => hm.call(this, m, mult, o, ...x));
    }
    return hm.call(this, m, mult, o, ...x);
  };
  const dm = dealMob;
  dealMob = function (t, a, ...x) {
    const R = V1213.run;
    if (R && t && (t.v1213 || t.v1213add) && a > 0 && V1213.cur && V1213.cur !== R.world) V1213.cur.dmg += Math.min(a, Math.max(0, t.hp));
    return dm.call(this, t, a, ...x);
  };
  // 持續傷害（燃燒、流血、中毒）：記下施放者；跳傷害時切回施放者的資料（暴擊、天賦）
  const ownId = () => {
    const R = V1213.run,
      c = V1213.cur;
    return R && c && c !== R.world ? c.id : null;
  };
  const ai = ailment;
  ailment = function (t, a, ...x) {
    const id = ownId(),
      o0 = t && t[a],
      d0 = o0 ? o0.dps : 0;
    const r = ai.call(this, t, a, ...x);
    const o1 = id && t && (a === "brn" || a === "bld") ? t[a] : null;
    if (o1 && typeof o1 === "object" && (o1 !== o0 || !o1.v1213o || o1.dps > d0)) o1.v1213o = id;
    return r;
  };
  const pa = psnAdd;
  psnAdd = function (t, ...x) {
    const id = ownId();
    const r = pa.call(this, t, ...x);
    if (id && t && t.psn) for (const e of t.psn.s) if (!e.v1213o || e.t === PSN_T) e.v1213o = id;
    return r;
  };
  const dh = dotHit;
  dotHit = function (t, a, s, e, ...x) {
    const R = V1213.run;
    if (R && t && V1213.cur === R.world) {
      const c = V1213.ctxs[v1213AilOwner(t, e)];
      if (c && !c.gone) return v1213Run(c, () => dh.call(this, t, a, s, e, ...x));
    }
    return dh.call(this, t, a, s, e, ...x);
  };
  // 中毒的跳傷害間隔看施放者的天賦：依施放者分組各跑一次
  const tp = tickPoison;
  tickPoison = function (dt, ...x) {
    const R = V1213.run;
    if (!R || V1213.cur !== R.world) return tp.call(this, dt, ...x);
    const groups = new Map();
    for (const m of G.mobs) {
      if (!m.psn) continue;
      const c = V1213.ctxs[v1213AilOwner(m, "psn")],
        k = c && !c.gone ? c : R.world;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(m);
    }
    const all = G.mobs;
    for (const [c, list] of groups) {
      const tmp = list.slice();
      G.mobs = tmp;
      try {
        v1213Run(c, () => tp.call(this, dt, ...x));
      } finally {
        G.mobs = all;
      }
      for (const m of list)
        if (!tmp.includes(m)) {
          const i = all.indexOf(m);
          if (i >= 0) all.splice(i, 1);
        }
    }
  };
  // 擊殺：副本中的怪物死亡不算地圖進度（不觸發一般頭目勝利、任務、經驗、掉落），擊殺回復等「擊殺時」效果照常
  const km = killMob;
  killMob = function (t, ...x) {
    if (!V1213.run || !t) return km.call(this, t, ...x);
    const i = G.mobs.indexOf(t);
    if (i >= 0) G.mobs.splice(i, 1);
    if (G.pl && G.pl.tgt === t) G.pl.tgt = null;
    try {
      fire("kill", t);
    } catch (e) {}
    try {
      const col = MON_COLS[t.type] || ["#ffffff"];
      burst(t.x, t.y, t.boss ? 60 : 18, col, t.boss ? 140 : 90, { z: 0.5 * t.h });
      G.flashes.push({ x: t.x, y: t.y - 0.5 * t.h, t: 0, c: "#ffffff", r: t.boss ? 22 : 7 });
      if (t.boss) shake(0.3);
      sfx(t.boss ? "big" : "kill");
      if (PS && PS.lok) heal(PS.lok * (tal("rage") ? 2 : 1));
      if (PS && tal("lokp")) heal(PS.maxhp * tal("lokp") * (tal("rage") ? 2 : 1));
    } catch (e) {}
  };
  // 地面效果（熔岩、裂地）：用施放者的資料計算
  V1213B.own = function (s, f) {
    const R = V1213.run,
      c = R && s && s.v1213o ? V1213.ctxs[s.v1213o] : null;
    if (!c || c.gone || V1213.cur === c) return f();
    return v1213Run(c, () => {
      const r = f();
      for (const m of G.mobs) for (const k of ["bld", "brn"]) if (m[k] && typeof m[k] === "object" && !m[k].v1213o) m[k].v1213o = c.id;
      return r;
    });
  };
  // 隊長加成、頭目的抗性與詞綴、羈絆之戒
  const isLead = () => V1213.run && V1213.cur === V1213.run.lead;
  HIT_MUL.push({
    k: "v1213:lead",
    lab: () => isLead() && `組隊副本隊長 ×${1 + V1213.cfg.lead}`,
    f: (t, m, o) => {
      if (!V1213.run) return t;
      let d = isLead() ? t * (1 + V1213.cfg.lead) : t;
      const B = m && m.v1213;
      if (B) {
        if (B.res && v1213HitEl(o) === B.res) d *= 1 - V1213.cfg.resV;
        if (B.af && B.af.taken) d *= B.af.taken;
      }
      return d;
    },
  });
  HURT_MUL.push({ k: "v1213:lead", f: () => (isLead() ? 1 - V1213.cfg.leadDr : 1) });
  HURT_MUL.push({ k: "v1213:bond", f: () => (PS && PS.U && PS.U.v1213_bond ? Math.max(0.5, 1 - (v1213BondN() * uv("v1213_bond", 1)) / 100) : 1) });
  // v1.2.20：頭目的攻擊屬性（帶元素時依該屬性抗性，沒有時為無屬性）
  const v5r = HURT_MUL.find((x) => x.k === "v5:res");
  if (v5r) {
    const f0 = v5r.f;
    v5r.f = function (m, ...x) {
      const B = m && m.v1213;
      if (V1213.run && B && B.kind === "boss") return 1 - clamp(tal("res_" + (B.atk || "neutral")) + tal("res_all"), -100, 75) / 100;
      return f0.call(this, m, ...x);
    };
  }
  // 移動速度加成無效
  for (const e of SPD_MS) {
    const f = e.f;
    e.f = function (...a) {
      const r = f.apply(this, a);
      return V1213.run && r > 1 ? 1 : r;
    };
  }
  const rc = recalc;
  recalc = function (...a) {
    const r = rc.apply(this, a);
    const R = V1213.run;
    if (R && PS && V1213.cur && V1213.cur !== R.world) {
      PS.move = Math.min(PS.move, 32 * (PS.act || 1));
      if (V1213.cur === R.lead) {
        PS.maxhp = Math.round(PS.maxhp * (1 + V1213.cfg.lead));
        if (PS.dps) PS.dps *= 1 + V1213.cfg.lead;
      }
    }
    return r;
  };
  // 怪物的攻擊目標與傷害：依陣型轉給隊員
  const fo = foeOf;
  foeOf = function (s, ...x) {
    const R = V1213.run;
    if (!R || !s) return fo.call(this, s, ...x);
    const c = v1213Target(s, true);
    if (!c) return fo.call(this, s, ...x);
    s.v1213tgt = c;
    return c.pl;
  };
  const gh = gspHurt;
  gspHurt = function (t, a, s, ...x) {
    if (V1213.run && t && t.v1213c) {
      const c = V1213.ctxs[t.v1213c];
      if (c && !c.dead) v1213Hurt(c, a, s, 1);
      return;
    }
    return gh.call(this, t, a, s, ...x);
  };
  const dp = damagePlayer;
  damagePlayer = function (d, x, y, src, ...r) {
    const R = V1213.run;
    if (R && V1213.cur === R.world) {
      const c = (src && src.v1213tgt && !src.v1213tgt.dead && src.v1213tgt) || v1213Target(src);
      if (c) v1213Hurt(c, d, src, r[0]);
      return;
    }
    return dp.call(this, d, x, y, src, ...r);
  };
  const di = die;
  die = function (...a) {
    const R = V1213.run,
      c = V1213.cur;
    if (R && c) {
      if (c === R.world) return void (S.hp = 1e12);
      return v1213Down(c);
    }
    return di.apply(this, a);
  };
  // 組隊副本中：隊友的快照不存檔、不給經驗與掉落、不計離線收益
  const sn = saveNow;
  saveNow = function (...a) {
    if (V1213.run && V1213.cur && V1213.cur !== V1213.run.lead) return;
    return sn.apply(this, a);
  };
  const og = offlineGains;
  offlineGains = function (...a) {
    if (V1213.run) return;
    return og.apply(this, a);
  };
  const gx = gainXp;
  gainXp = function (...a) {
    if (V1213.run) return;
    return gx.apply(this, a);
  };
  const dl = dropLoot;
  dropLoot = function (...a) {
    if (V1213.run) return;
    return dl.apply(this, a);
  };
  if (typeof v5OnKill === "function") {
    const vk = v5OnKill;
    v5OnKill = function (m, ...a) {
      if (V1213.run) return;
      return vk.call(this, m, ...a);
    };
  }
  const la = leaveArena;
  leaveArena = function (...a) {
    if (V1213.run) {
      // 右下角「離開副本」：按兩次結束
      if (!V1213.run.ending) v1213Click({ dataset: { v1213: "quit" } });
      return;
    }
    return la.apply(this, a);
  };
  for (const n of ["setMap", "startBoss", "startGuard", "startTrial", "twStart", "enterArena", "v64MvpStart", "roArenaStart", "v113Enter"]) v1213Block(n);
  // 畫面：所有隊員、隊員的召喚物與技能效果、影子隊伍
  const dpl = drawPlayer;
  drawPlayer = function (c, ...a) {
    const R = V1213.run;
    if (!R || V1213.drawing) return dpl.call(this, c, ...a);
    V1213.drawing++;
    try {
      for (const m of R.members)
        v1213Run(m, () => {
          const p = G.pl;
          if (m.dead) v1213Grave(c, p);
          else {
            dpl.call(this, c, ...a);
            if (m !== R.lead) {
              for (const s of G.mins) drawSpirit(c, s);
              for (const s of G.gsp) drawGsp(c, s);
              for (const s of G.turs) drawTurret(c, s);
              for (const s of G.saps) drawSap(c, s);
            }
          }
          v1213Tagn(c, m, p);
        });
    } catch (e) {
    } finally {
      V1213.drawing--;
    }
  };
  const dmb = drawMob;
  drawMob = function (c, m, ...a) {
    if (V1213.run && m && m.v1213 && m.v1213.kind === "ghost") {
      v1213DrawGhost(c, m);
      v1213Bar(c, m.x, m.y - 30, m.hp / m.max, "#ff5a6a", m.bn);
      return;
    }
    return dmb.call(this, c, m, ...a);
  };
  if (typeof v6DrawFx === "function") {
    const vf = v6DrawFx;
    v6DrawFx = function (cx, ground, ...a) {
      const R = V1213.run;
      if (!R || V1213.fxDraw) return vf.call(this, cx, ground, ...a);
      V1213.fxDraw++;
      try {
        for (const m of R.members) if (!m.dead) v1213Run(m, () => vf.call(this, cx, ground, ...a));
      } finally {
        V1213.fxDraw--;
      }
    };
  }
  // 右下角按鈕：副本中顯示「離開副本」（場地不會倒數離開）
  const hu = ui.hud;
  ui.hud = function (...a) {
    const r = hu.apply(this, a);
    const R = V1213.run;
    if (R && typeof document !== "undefined") {
      const b = document.getElementById("bossBtn"),
        want = R.quitAsk ? "放棄挑戰？" : "離開副本";
      if (b && !b.textContent.includes(want)) b.innerHTML = b.innerHTML.replace(/離開副本|放棄挑戰？|離開(<b>\d+<\/b>)?/, want);
    }
    return r;
  };
  // 場地背景：尼芙菲姆（死者之國）
  const bg = buildGround;
  buildGround = function (...a) {
    if (G && G.arena && G.arena.ar === V1213_ARENA) {
      const d = RO?.assets?.maps?.niflheim,
        im = d && roImage(d.decoratedFile || d.file);
      if (im) {
        G.ground = im;
        G.props = [];
        G.lights = [];
        return;
      }
    }
    return bg.apply(this, a);
  };
  // 挑戰頁卡片與說明
  const pm = ui.p_map;
  ui.p_map = function (...a) {
    const h = pm.apply(this, a);
    return this.mapView === "ch" && S && !V1213.run ? h + v1213Card() : h;
  };
  if (typeof document !== "undefined") {
    document.addEventListener("click", (e) => {
      const b = e.target && e.target.closest && e.target.closest("[data-v1213]");
      if (!b || b.tagName === "INPUT") return;
      e.preventDefault();
      try {
        v1213Click(b);
      } catch (er) {
        console.error(er);
      }
    });
    document.addEventListener("change", (e) => {
      const b = e.target && e.target.closest && e.target.closest("[data-v1213]");
      if (!b) return;
      if (b.dataset.v1213 === "auto") {
        V1213U.auto = b.checked ? 1 : 0;
        v1213Sheet();
      } else if (b.dataset.v1213 === "hautop" && V1213.run) V1213.run.auto = b.checked ? 1 : 0;
    });
    if (!document.getElementById("v1213css")) {
      const st = document.createElement("style");
      st.id = "v1213css";
      st.textContent = V1213_CSS;
      document.head.appendChild(st);
    }
  }
  HELP.v1213 = [
    "組隊副本・地獄級頭目",
    [
      ["隊伍", "目前角色為隊長，再帶同一存檔的其他角色 2～4 名，共 3～5 人才能入場。隊友使用各角色上次存檔的快照（裝備、天賦、技能盤），完整施放自己的技能盤；挑戰中不會改動隊友的存檔。"],
      ["隊長", `傷害、最大生命 +${V1213.cfg.lead * 100}%，受到的傷害 −${V1213.cfg.leadDr * 100}%。`],
      ["冷卻", "每次入場後整個帳號冷卻 2 小時（切換角色也一樣）。"],
      ["陣型", "入場前在九宮格排好位置。頭目在上方，普攻與大部分招式先找最前排（同一排找最近的）；被嘲諷時普攻改打嘲諷的隊員。開打後隊員依自己的戰鬥方式移動。"],
      ["樓層", `一次入場一路往上打，每層一隻地獄頭目（15 位地圖頭目輪替），生命與傷害每層 ×${V1213.cfg.fK}。第 ${V1213.cfg.afFrom} 層起每層隨機一個詞綴（強韌、兇猛、迅捷、鋼甲、吸血、狂暴、急襲），並有 ${V1213.cfg.elP * 100}% 機率攻擊帶一種隨機元素（受到的傷害依你該屬性的抗性計算；沒有元素時為無屬性）；每層 ${V1213.cfg.resP * 100}% 機率附加一種元素抗性（該屬性傷害 −${V1213.cfg.resV * 100}%）。同一層超過 ${V1213.cfg.enrageT} 秒頭目狂怒（傷害 ×${V1213.cfg.enrageK}）。過關後隊員回復 25% 生命。`],
      ["頭目招式", "地獄之爪（普攻）、業火橫掃（整排）、冥雷直擊（整列）、地獄火雨（每位隊員腳下）、深淵震環（環狀）、魔王咆哮（全體）、召喚眷屬。地上會先出現預警，有機會被隊員閃開。"],
      ["限制", `這個副本裡移動速度加成無效，頭目技能與普攻冷卻 −${Math.round((1 - V1213.cfg.cdK) * 100)}%。`],
      ["復活卷軸", `每次進場 ${V1213.cfg.scrolls} 張，加上之前累積的；隊員倒下時自動使用（可關閉，可設定優先順序；也可在隊伍列表手動使用），復活後生命 ${V1213.cfg.reviveHp * 100}%。沒用掉的會累積到下次。全員倒下且沒有卷軸時挑戰結束。`],
      ["獎勵", `每通關一層各自擲骰：神話卡 ${V1213.cfg.rw.card * 100}%、Lv130 主宰裝備 ${V1213.cfg.rw.myth * 100}%、組隊獨特戒指「羈絆之戒」${V1213.cfg.rw.ring * 100}%、寵物扭蛋券 ${V1213.cfg.rw.pet * 100}%（在「選單 → 寵物」使用）、隊長職業的變異技能寶石 ${V1213.cfg.rw.gem * 100}%。每個角色第一次以隊長身分通關第 ${V1213.cfg.skinFloor} 層，得到皮膚美容券 1 張（之後開放兌換）。獎勵放進隊長的背包。`],
      ["羈絆之戒", "飾品。組隊副本中：每名存活的隊友使你造成的傷害 +5%、受到的傷害 −3%（最多 4 名）。組隊副本以外：召喚英靈（生命為你最大生命的 70%），每 5 秒嘲諷附近的敵人，不會攻擊；英靈倒下後 30 秒再次召喚。"],
      ["隊伍排行", "比照無限武鬥場：比通關層數，再比用時；需要綁定 Google，挑戰結束自動上傳整隊快照。每層 5% 機率遇到排行榜上其他隊伍的快照（影子隊伍）。"],
    ],
  ];
}
function v1213Grave(c, p) {
  c.save();
  c.globalAlpha = 0.85;
  c.fillStyle = "#6a6a7a";
  c.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 9, 3, 9);
  c.fillRect(Math.round(p.x) - 4, Math.round(p.y) - 7, 9, 2);
  c.restore();
}
function v1213Bar(c, x, y, f, col, name) {
  c.save();
  c.fillStyle = "rgba(20,14,28,.75)";
  c.fillRect(Math.round(x) - 11, Math.round(y), 22, 3);
  c.fillStyle = col;
  c.fillRect(Math.round(x) - 11, Math.round(y), Math.round(22 * Math.max(0, Math.min(1, f))), 3);
  if (name) {
    c.font = "5px sans-serif";
    c.textAlign = "center";
    c.fillStyle = "#f3ead8";
    c.strokeStyle = "rgba(14,8,20,.85)";
    c.lineWidth = 2;
    c.strokeText(name, Math.round(x), Math.round(y) - 2);
    c.fillText(name, Math.round(x), Math.round(y) - 2);
  }
  c.restore();
}
function v1213Tagn(c, m, p) {
  if (!p) return;
  const hp = m.dead ? 0 : Math.max(0, S.hp) / Math.max(1, PS.maxhp);
  v1213Bar(c, p.x, p.y - 27, hp, m.role === "lead" ? "#ffd84a" : "#5fd38a", (m.role === "lead" ? "★" : "") + m.name);
}

if (typeof roV4Install === "function") {
  const r4v1213 = roV4Install;
  roV4Install = function () {
    r4v1213.apply(this, arguments);
    try {
      v1213Install();
    } catch (e) {
      console.error("v1213", e);
    }
  };
}
