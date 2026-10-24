/* 流浪仙境 v1.2.14：職業更動——詩人、舞孃的團隊持續回血與團隊增益；神官更多回血手段
   「隊友」：組隊副本中是所有存活的隊員（含自己），組隊副本以外只有自己（回血類另外補生命體、召喚物）。
   詩人線、舞孃線共用 3 個新主動技能（RO 原版合奏技能圖示）：
     ・伊登的蘋果（二轉起）：8 秒，你與隊友每秒回復 2% 最大生命
     ・戰鼓響徹（三轉後）：8 秒，你與隊友傷害 +15%、受到的傷害 −10%（冷卻 25 秒，v1.2.20 起）
     ・尼貝隆根之戒（四轉後）：8 秒，你與隊友攻擊速度 +15%、技能冷卻速度 +15%（冷卻 25 秒，v1.2.20 起）
   祭司線新增 4 個主動技能：
     ・光明治癒（二轉起）：立刻回復你與所有隊友 20% 最大生命（任一隊友生命低於 70% 時施放）
     ・復甦之光（三轉後）：12 秒內你與隊友每秒回復 1.5% 最大生命
     ・霸邪之陣（三轉後）：你與隊友獲得 12% 最大生命的護盾（最多累積到 25%）
     ・復活術（四轉後）：組隊副本中復活 1 名倒下的隊友（生命 30%，不消耗復活卷軸）；副本以外 10 秒內受到致命傷害時以 30% 生命存活
   既有技能在組隊副本中：治癒術另外回復生命比例最低的隊友 25%；光耀之堂範圍內的隊友也會回血。
   變異寶石：這些技能沒有傷害，比照 v1.2.11（效果 ±、附加詛咒、被動）；復活術不會變被動。 */

const V1214 = {
  idun: { t: 8, r: 0.02 },
  drum: { t: 8, dmg: 0.15, dr: 0.1 },
  nibel: { t: 8, as: 0.15, cd: 0.15 },
  cheal: { r: 0.2, low: 0.7 },
  renov: { t: 12, r: 0.015 },
  kyrie: { r: 0.12, cap: 0.25 },
  resu: { hp: 0.3, t: 10, icd: 60, wait: 4 },
  heal2: 0.25, // 治癒術：另外回復生命比例最低的隊友
  sanct: { iv: 0.5, r: 0.015 },
};

// ---------------------------------------------------------------------------
// 0. 圖示（RO 原版：伊登的蘋果 322、戰鼓響徹 309、尼貝隆根之戒 310、光明治癒 2043、復甦之光 2050、霸邪之陣 73、復活術 54）
(() => {
  const A = typeof window !== "undefined" && window.RO_ASSETS;
  if (!A) return;
  A.skills ||= {};
  for (const id of [322, 309, 310, 2043, 2050, 73, 54]) A.skills[id] ||= { file: `skills/${id}.png`, width: 24, height: 24 };
})();

// ---------------------------------------------------------------------------
// 1. 技能表（在 v6 技能登錄前加入）
//    id, 職業, 名稱, 招式, 傷害, 冷卻, 標籤, 屬性, 異常, RO 圖示, 形狀, 說明
const V1214_ACT = [
  ["bw_idun", "bow", "伊登的蘋果", "v1214idun", 0, 12, ["spell"], "neutral", null, 322, "I2", "演奏 8 秒的治癒之歌：你與隊友每秒回復 2% 最大生命（組隊副本以外：你與生命體）。"],
  ["bw_drum", "bow", "戰鼓響徹", "v1214drum", 0, 25, ["spell"], "neutral", null, 309, "I2", "敲響戰鼓 8 秒：你與隊友造成的傷害 +15%、受到的傷害 −10%（組隊副本以外只有自己）。"],
  ["bw_nibel", "bow", "尼貝隆根之戒", "v1214nibel", 0, 25, ["spell"], "neutral", null, 310, "I2", "演奏 8 秒：你與隊友攻擊速度 +15%、技能冷卻速度 +15%（組隊副本以外只有自己）。"],
  ["ac_cheal", "acolyte", "光明治癒", "v1214cheal", 0, 8, ["spell", "holy"], "holy", null, 2043, "I2", "立刻回復你與所有隊友 20% 最大生命（組隊副本以外：你與生命體）；任一隊友生命低於 70% 時施放。"],
  ["ac_renov", "acolyte", "復甦之光", "v1214renov", 0, 15, ["spell", "holy"], "holy", null, 2050, "I2", "12 秒內，你與隊友每秒回復 1.5% 最大生命（組隊副本以外：你與生命體）。"],
  ["ac_kyrie", "acolyte", "霸邪之陣", "v1214kyrie", 0, 12, ["spell", "holy"], "holy", null, 73, "I2", "你與隊友獲得 12% 最大生命的護盾（此方式最多累積到 25%）。"],
  ["ac_resu", "acolyte", "復活術", "v1214resu", 0, 45, ["spell", "holy"], "holy", null, 54, "I2", "組隊副本中：復活 1 名倒下的隊友，生命 30%，不消耗復活卷軸（有倒下的隊友時才施放）。組隊副本以外：施放後 10 秒內受到致命傷害時，以 30% 生命存活（每 60 秒最多 1 次）。"],
];
// 商店：詩人線（V81_TIER.bow[1]）、舞孃線（bow[2]）、祭司線（acolyte[0]）：二轉起／三轉後／四轉後
const V1214_TIER = {
  bow: { 1: [["bw_idun"], ["bw_drum"], ["bw_nibel"]], 2: [["bw_idun"], ["bw_drum"], ["bw_nibel"]] },
  acolyte: { 0: [["ac_cheal"], ["ac_renov", "ac_kyrie"], ["ac_resu"]] },
};
if (typeof V6_ACT !== "undefined" && typeof V6_CLASS !== "undefined") {
  for (const r of V1214_ACT) {
    V6_ACT.push(r);
    V6_CLASS[r[1]].act.push(r[0]);
    if (typeof V6_JOB !== "undefined") V6_JOB[r[0]] = []; // 不屬於任何流派：依職業線與職階開放
  }
  if (typeof V81_TIER !== "undefined")
    for (const [cls, lines] of Object.entries(V1214_TIER))
      for (const [li, tiers] of Object.entries(lines)) tiers.forEach((ids, t) => V81_TIER[cls]?.[+li]?.[t]?.push(...ids));
  if (typeof V6_ALWAYS !== "undefined") for (const k of ["v1214idun", "v1214drum", "v1214nibel", "v1214cheal", "v1214renov", "v1214kyrie", "v1214resu"]) V6_ALWAYS.add(k);
}

// ---------------------------------------------------------------------------
// 2. 隊友
const v1214Party = () => (typeof V1213 !== "undefined" && V1213.run && V1213.cur && V1213.cur !== V1213.run.world ? V1213.run : null);
// 在每位存活隊友（含自己）的戰鬥資料下執行；組隊副本以外只有自己
function v1214Each(fn) {
  const R = v1214Party();
  if (!R) return void fn(true);
  const me = V1213.cur;
  for (const c of R.members) if (!c.dead) v1213Run(c, () => fn(c === me));
}
// 生命比例最低的隊友（不含自己）
function v1214Lowest() {
  const R = v1214Party();
  if (!R) return null;
  let best = null,
    bf = 2;
  for (const c of R.members) {
    if (c.dead || c === V1213.cur) continue;
    const mx = c.PS ? c.PS.maxhp : 1,
      f = Math.max(0, c.S.hp) / Math.max(1, mx);
    if (f < bf) (bf = f), (best = c);
  }
  return best;
}
// 任一隊友（含自己）生命比例低於 th
function v1214Low(th) {
  const R = v1214Party();
  if (!R) return !!(S && PS && S.hp < PS.maxhp * th);
  return R.members.some((c) => {
    if (c.dead) return false;
    const st = c === V1213.cur ? S : c.S,
      ps = c === V1213.cur ? PS : c.PS;
    return ps && st.hp < ps.maxhp * th;
  });
}
// 組隊副本以外：生命體（守護者）回血
function v1214Pets(frac) {
  if (v1214Party() || !G) return;
  for (const e of G.gsp || []) if (e && e.max > 0 && e.hp > 0) e.hp = Math.min(e.max, e.hp + e.max * frac);
}
const v1214E = (id) => (typeof V1211 !== "undefined" && V1211.E && V1211.E[id] != null ? V1211.E[id] : 1);
const v1214Buf = () => (v6G().v1214 ||= {});
function v1214Heal(frac, show) {
  if (G.dead || !PS) return 0;
  const h0 = S.hp;
  heal(PS.maxhp * frac);
  const d = Math.max(0, S.hp - h0);
  if (show && d > 0) num(G.pl.x, G.pl.y - 26, "+" + Math.round(d), "#7dffc8");
  return d;
}
function v1214Glow(col, n = 10) {
  const p = G.pl;
  try {
    burst(p.x, p.y - 6, n, [col, "#ffffff"], 50, { z: 6, glow: 1 });
  } catch (e) {}
}
// 組隊副本中倒下的隊友（倒下超過 0.5 秒，依倒下時間）
function v1214Dead() {
  const R = v1214Party();
  if (!R) return null;
  const d = R.members.filter((c) => c.dead && R.t - (c.downT || 0) >= 0.5);
  d.sort((a, b) => (a.downT || 0) - (b.downT || 0));
  return d[0] || null;
}
function v1214Revive(c, frac) {
  if (!c || !c.dead) return false;
  c.dead = false;
  c.rev = (c.rev || 0) + 1;
  v1213Run(c, () => {
    S.hp = Math.max(1, Math.round(PS.maxhp * frac));
    G.pl.hurt = 0;
    G.pl.atk = 0.4;
    G.flashes.push({ x: G.pl.x, y: G.pl.y - 6, t: 0, ring: 1, c: "#fff1ae" });
    num(G.pl.x, G.pl.y - 26, "復活術", "#fff1ae");
  });
  return true;
}

// ---------------------------------------------------------------------------
// 3. 招式
function v1214Moves() {
  Object.assign(V6_CAST, {
    v1214idun(c) {
      const E = v1214E(c.g.id);
      v1214Each(() => {
        v6SetBuf("v1214idun", V1214.idun.t);
        v1214Buf().idun = V1214.idun.r * E;
        v1214Glow("#7dffc8", 6);
      });
      v6Ro("bw_song", c.p.x, c.p.y);
      v6Fx({ k: "notes", x: c.p.x, y: c.p.y - 10, life: 1.2, col: "#7dffc8" });
      return true;
    },
    v1214drum(c) {
      const E = v1214E(c.g.id);
      v1214Each(() => {
        v6SetBuf("v1214drum", V1214.drum.t);
        v1214Buf().drum = E;
        v1214Glow("#ff9a5a", 6);
      });
      v6Ro("bw_song", c.p.x, c.p.y);
      v6Fx({ k: "notes", x: c.p.x, y: c.p.y - 10, life: 1.2, col: "#ff9a5a" });
      try {
        shake(0.06);
      } catch (e) {}
      return true;
    },
    v1214nibel(c) {
      const E = v1214E(c.g.id);
      v1214Each(() => {
        v6SetBuf("v1214nibel", V1214.nibel.t);
        v1214Buf().nibel = E;
        v1214Glow("#ffe08a", 6);
      });
      v6Ro("bw_song", c.p.x, c.p.y);
      v6Fx({ k: "notes", x: c.p.x, y: c.p.y - 10, life: 1.2, col: "#ffe08a" });
      return true;
    },
    v1214cheal(c) {
      const f = V1214.cheal.r * v1214E(c.g.id);
      v1214Each(() => {
        v1214Heal(f, true);
        v1214Glow("#9affb0", 12);
      });
      v1214Pets(f);
      c.p.anim = { k: "cast", t: 0, dur: 0.35, a: c.p.face };
      return true;
    },
    v1214renov(c) {
      const E = v1214E(c.g.id);
      v1214Each(() => {
        v6SetBuf("v1214renov", V1214.renov.t);
        v1214Buf().renov = V1214.renov.r * E;
        v1214Glow("#b8ffd0", 8);
      });
      c.p.anim = { k: "cast", t: 0, dur: 0.35, a: c.p.face };
      return true;
    },
    v1214kyrie(c) {
      const f = V1214.kyrie.r * v1214E(c.g.id);
      v1214Each(() => {
        if (!PS) return;
        addShd(PS.maxhp * f, PS.maxhp * Math.max(V1214.kyrie.cap, f));
        G.flashes.push({ x: G.pl.x, y: G.pl.y - 8, t: 0, ring: 1, c: "#9ad8ff" });
      });
      c.p.anim = { k: "cast", t: 0, dur: 0.35, a: c.p.face };
      return true;
    },
    v1214resu(c) {
      const R = v1214Party();
      if (R) {
        const d = v1214Dead();
        if (!d) return false;
        v1214Revive(d, V1214.resu.hp * Math.min(2, v1214E(c.g.id)));
      } else {
        v6SetBuf("v1214resu", V1214.resu.t);
        v1214Glow("#fff1ae", 10);
      }
      c.p.anim = { k: "cast", t: 0, dur: 0.4, a: c.p.face };
      return true;
    },
  });
  // 施放時機
  const rd = v6Ready;
  v6Ready = function (g, ...a) {
    const k = SKILLS[g?.id]?.v6;
    if (k && k.startsWith("v1214")) {
      if (G.dead || !PS) return false;
      const near = (r) => mobsNear(G.pl.x, G.pl.y - 3, r).length > 0,
        far = 2 * PS.range + 40;
      switch (k) {
        case "v1214idun":
        case "v1214drum":
        case "v1214nibel":
        case "v1214renov":
          return !v6Buf(k) && near(far);
        case "v1214cheal":
          return v1214Low(V1214.cheal.low);
        case "v1214kyrie": {
          const R = v1214Party();
          const low = R ? R.members.some((c) => !c.dead && ((c === V1213.cur ? G.pl : c.pl)?.shd || 0) < (c === V1213.cur ? PS : c.PS).maxhp * V1214.kyrie.r) : (G.pl.shd || 0) < PS.maxhp * V1214.kyrie.r;
          return low && near(far);
        }
        case "v1214resu":
          if (v1214Party()) return !!v1214Dead();
          return !v6Buf("v1214resu") && G.t >= (v1214Buf().rcd || 0) && S.hp < PS.maxhp * 0.5 && near(far);
      }
    }
    return rd.call(this, g, ...a);
  };
}

// ---------------------------------------------------------------------------
// 4. 效果
function v1214Install() {
  if (typeof V6_CAST === "undefined" || !SKILLS.bw_idun) return;
  v1214Moves();
  // 傷害、受到的傷害、攻擊速度
  HIT_MUL.push({
    k: "v1214:drum",
    lab: () => v6Buf("v1214drum") && `戰鼓響徹 ×${+(1 + V1214.drum.dmg * (v1214Buf().drum ?? 1)).toFixed(3)}`,
    f: (t) => (v6Buf("v1214drum") ? t * (1 + V1214.drum.dmg * (v1214Buf().drum ?? 1)) : t),
  });
  HURT_MUL.push({ k: "v1214:drum", f: () => (v6Buf("v1214drum") ? Math.max(0.3, 1 - V1214.drum.dr * (v1214Buf().drum ?? 1)) : 1) });
  SPD_AS.push({ k: "v1214:nibel", f: () => (v6Buf("v1214nibel") ? 1 + V1214.nibel.as * (v1214Buf().nibel ?? 1) : 1) });
  // 每格：持續回血、冷卻加速（掛在 ro-v1213-base.js 的最內層：組隊副本中依隊員各跑一次，世界那段不跑）
  if (typeof V1213B !== "undefined" && V1213B.post) V1213B.post.push((dt) => v1214Tick(dt || 0));
  else {
    const tk = tick;
    tick = function (dt, ...x) {
      const r = tk.call(this, dt, ...x);
      try {
        v1214Tick(dt || 0);
      } catch (e) {}
      return r;
    };
  }
  // 復活術（組隊副本以外）：致命傷害時以 30% 生命存活
  const di = die;
  die = function (...a) {
    if (S && PS && G && !G.dead && v6Buf("v1214resu") && !(typeof V1213 !== "undefined" && V1213.run && V1213.cur === V1213.run.world)) {
      v6G().buf.v1214resu = 0;
      v1214Buf().rcd = G.t + V1214.resu.icd;
      S.hp = Math.max(1, Math.round(PS.maxhp * V1214.resu.hp));
      G.flashes.push({ x: G.pl.x, y: G.pl.y - 6, t: 0, ring: 1, c: "#fff1ae" });
      num(G.pl.x, G.pl.y - 28, "復活術", "#fff1ae");
      return;
    }
    return di.apply(this, a);
  };
  // 組隊副本：有復活術準備好的隊員時，復活卷軸晚一點用（倒下 4 秒內先等復活術）
  if (typeof v1213Revive === "function") {
    const rv = v1213Revive;
    v1213Revive = function (dt, ...x) {
      const R = V1213.run;
      if (R && R.members.some((c) => c.dead && R.t - (c.downT || 0) < V1214.resu.wait) && v1214ResuReady(R)) return;
      return rv.call(this, dt, ...x);
    };
  }
  // 治癒術：組隊副本中另外回復生命比例最低的隊友
  if (V6_CAST.heal) {
    const hl = V6_CAST.heal;
    V6_CAST.heal = function (c, ...x) {
      const r = hl.call(this, c, ...x);
      if (r && v1214Party()) {
        const t = v1214Lowest();
        if (t) v1213Run(t, () => v1214Heal(V1214.heal2 * v1214E(c.g.id), true));
      }
      return r;
    };
  }
  // 光耀之堂：範圍內的隊友也回血
  if (V6_CAST.sanct) {
    const sc = V6_CAST.sanct;
    V6_CAST.sanct = function (c, ...x) {
      const r = sc.call(this, c, ...x);
      const R = v1214Party();
      if (r && R) {
        const me = V1213.cur,
          x0 = c.p.x,
          y0 = c.p.y,
          rad = (V6_SELF.sanct || 26) * c.n;
        let next = V1214.sanct.iv;
        v6Ent({
          life: 6,
          upd: (e) => {
            if (e.t < next || !V1213.run) return;
            next += V1214.sanct.iv;
            for (const m of V1213.run.members)
              if (m !== me && !m.dead && m.pl && Math.hypot(m.pl.x - x0, m.pl.y - y0) <= rad + 4) v1213Run(m, () => v1214Heal(V1214.sanct.r, false));
          },
          draw: () => {},
        });
      }
      return r;
    };
  }
  // 變異寶石：被動的再施放間隔；復活術不會變被動
  if (typeof V1211 !== "undefined") {
    Object.assign(V1211.pasDur, { bw_idun: 7.8, bw_drum: 7.8, bw_nibel: 7.8, ac_renov: 11.8 });
    V1211.noPas.add("ac_resu");
  }
  // 特效
  if (typeof roFxProfiles !== "undefined") {
    const cp = (a, b) => roFxProfiles[b] && (roFxProfiles[a] ||= { ...roFxProfiles[b] });
    for (const id of ["bw_idun", "bw_drum", "bw_nibel"]) cp(id, "bw_song");
    for (const id of ["ac_cheal", "ac_renov", "ac_resu"]) cp(id, "ac_heal");
    cp("ac_kyrie", "ac_assum");
  }
  // 增益圖示
  if (typeof HUD_BUFF !== "undefined") {
    const B = (k, n, bg, fg, tc, lines, art) => ({ k, n: () => (v6Buf(k) ? 1 : 0), left: () => Math.max(0, (G.v6?.buf?.[k] || 0) - G.t), bg, fg, tc, tip: (x, l) => [n, [`剩餘 ${l.toFixed(1)} 秒`, ...lines()]], art });
    const pc = (k, base) => +(base * 100 * (v1214Buf()[k] ?? 1)).toFixed(1);
    HUD_BUFF.push(
      B("v1214idun", "伊登的蘋果", "#1a5a3a", "#e6fff0", "#7dffc8", () => [`每秒回復 ${+((v1214Buf().idun ?? V1214.idun.r) * 100).toFixed(1)}% 最大生命`], ["...X...", "..X....", ".XXXXX.", "XXXXXXX", "XXXXXXX", ".XXXXX.", "..XXX.."]),
      B("v1214drum", "戰鼓響徹", "#6a3a1a", "#fff0e0", "#ff9a5a", () => [`傷害 +${pc("drum", V1214.drum.dmg)}%`, `受到的傷害 −${pc("drum", V1214.drum.dr)}%`], ["X.....X", ".X...X.", "..XXX..", ".XXXXX.", ".X...X.", ".X...X.", "..XXX.."]),
      B("v1214nibel", "尼貝隆根之戒", "#6a5a1a", "#fff8e0", "#ffe08a", () => [`攻擊速度 +${pc("nibel", V1214.nibel.as)}%`, `技能冷卻速度 +${pc("nibel", V1214.nibel.cd)}%`], ["..XXX..", ".X...X.", "X.....X", "X.....X", "X.....X", ".X...X.", "..XXX.."]),
      B("v1214renov", "復甦之光", "#2a5a3a", "#eafff0", "#b8ffd0", () => [`每秒回復 ${+((v1214Buf().renov ?? V1214.renov.r) * 100).toFixed(1)}% 最大生命`], ["...X...", "...X...", ".XXXXX.", "...X...", "...X...", "...X...", "......."]),
      B("v1214resu", "復活術", "#6a5a2a", "#fffbe6", "#fff1ae", () => ["受到致命傷害時以 30% 生命存活"], ["..XXX..", ".X...X.", "..XXX..", "...X...", "XXXXXXX", "...X...", "..X.X.."]),
    );
  }
  // 說明
  const rows = [
    ["隊伍輔助技能", "詩人線、舞孃線：伊登的蘋果（8 秒每秒回復 2%）、戰鼓響徹（傷害 +15%、受到的傷害 −10%）、尼貝隆根之戒（攻擊速度、技能冷卻速度 +15%）。祭司線：光明治癒（立刻 20%）、復甦之光（12 秒每秒 1.5%）、霸邪之陣（12% 護盾）、復活術（復活倒下的隊友，不消耗復活卷軸）。治癒術另外回復生命比例最低的隊友 25%，光耀之堂範圍內的隊友也會回血。有復活術準備好的隊員時，倒下 4 秒內先等復活術再用卷軸。"],
  ];
  if (HELP.v1213?.[1]) for (const r of rows) if (!HELP.v1213[1].some((x) => x[0] === r[0])) HELP.v1213[1].splice(Math.max(0, HELP.v1213[1].findIndex((x) => x[0] === "獎勵")), 0, r);
}
function v1214ResuReady(R) {
  for (const c of R.members) {
    if (c.dead) continue;
    let ok = false;
    v1213Run(c, () => {
      for (const g of activeGems()) if (g.id === "ac_resu" && !(G.pl.cds[g.u] > 0) && !(typeof v1211Pas === "function" && v1211Pas(g))) ok = true;
    });
    if (ok) return true;
  }
  return false;
}
function v1214Tick(dt) {
  if (!S || !G || !PS || G.dead || !G.v6) return;
  const B = v1214Buf();
  let rate = 0;
  if (v6Buf("v1214idun")) rate += B.idun ?? V1214.idun.r;
  if (v6Buf("v1214renov")) rate += B.renov ?? V1214.renov.r;
  if (rate > 0) {
    heal(PS.maxhp * rate * dt);
    v1214Pets(rate * dt);
    if (RAND() < dt * 3) G.parts.push({ x: G.pl.x + rf(-4, 4), y: G.pl.y, z: rf(4, 14), vx: 0, vy: 0, vz: 14, g: -6, life: 0.6, c: "#7dffc8", s: 1, glow: 1 });
  }
  if (v6Buf("v1214nibel")) {
    const k = dt * V1214.nibel.cd * (B.nibel ?? 1);
    for (const g of activeGems()) if (G.pl.cds[g.u] > 0) G.pl.cds[g.u] -= k;
  }
}

if (typeof roV4Install === "function") {
  const r4v1214 = roV4Install;
  roV4Install = function () {
    r4v1214.apply(this, arguments);
    try {
      v1214Install();
    } catch (e) {
      console.error("v1214", e);
    }
  };
}
