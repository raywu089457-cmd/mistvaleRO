/* 流浪仙境 v8.6：職業新技能第 3 批（盜賊：刺客線、流氓線；服事：祭司線、武僧線；商人：鐵匠線、鍊金術師線）
   三轉、四轉新增 RO 原作的主動與輔助技能；另外把重力場、大纏崩捶、機甲加農砲換回 RO 原本的技能圖示（原圖示讓給新技能） */

// ---------------------------------------------------------------------------
// 0. 技能圖示登錄
(() => {
  const A = typeof window !== "undefined" && window.RO_ASSETS;
  if (!A) return;
  A.skills ||= {};
  for (const id of [406, 379, 2036, 2022, 476, 390, 361, 362, 2038, 2040, 371, 372, 2330, 2327, 384, 486, 2278, 2259, 491, 478, 407, 2023, 225, 401, 2338, 477, 2486, 484, 2332, 2477])
    A.skills[id] ||= { file: `skills/${id}.png`, width: 24, height: 24 };
})();

// ---------------------------------------------------------------------------
// 1. 技能表
//    id, 職業, 名稱, 招式, 傷害, 冷卻, 標籤, 屬性, 異常, RO 圖示, 形狀, 說明
const V86_ACT = [
  // 刺客線
  ["th_masslt", "thief", "流星突擊", "masslt", 3.2, 5, ["aoe"], "neutral", null, 406, "T4", "瞬移到目標附近怪物最密集處，對周圍敵人造成 {hit}% 武器傷害，各有 30% 機率暈眩 1 秒、30% 機率致盲 3 秒；每擊中 1 名敵人獲得 1 連擊點（最多 3 點）。"],
  ["th_sbreak", "thief", "靈魂破壞", "sbreak", 4.0, 4, [], "neutral", null, 379, "L3", "終結技：從遠處擲出靈魂之刃，造成 {hit}% 武器傷害；消耗全部連擊點，每點 +40%。對生命低於 30% 的敵人傷害 ×2，擊殺時返還消耗的連擊點。"],
  ["th_rcut", "thief", "迴旋刃", "rcut", 2.0, 3.5, ["proj"], "neutral", null, 2036, "I3", "朝目標擲出旋轉的卡塔爾，去程與回程各對穿過的敵人造成 {hit}% 武器傷害；每擊中 1 名不同的敵人獲得 1 連擊點（最多 3 點）。"],
  ["th_cimpact", "thief", "交叉衝擊", "cimpact", 5.0, 5, [], "neutral", null, 2022, "O4", "終結技：躍向目標施展十字斬，造成一次 {hit}% 武器傷害；消耗全部連擊點，每點 +40%；消耗 3 點以上時必定暴擊，且暴擊傷害 +50%。"],
  // 流氓線
  ["th_fstrip", "thief", "全面卸除", "fstrip", 2.0, 8, [], "neutral", null, 476, "S4", "攻擊目標造成 {hit}% 武器傷害並卸除裝備 8 秒：護盾歸零、菁英詞綴失效（頭目改為受到的暴擊傷害 +40%）；獲得 2 連擊點。"],
  ["th_reject", "thief", "反擊之劍", "reject", 1.8, 10, [], "neutral", null, 390, "L3", "架起反擊之劍 6 秒：受到的傷害 −30%，被攻擊時以 {hit}% 武器傷害反擊攻擊者（每 0.3 秒最多 1 次），每次反擊獲得 1 連擊點。"],
  // 祭司線
  ["ac_assum", "acolyte", "聖母之祈福", "assum", 0, 16, ["spell", "holy"], "holy", null, 361, "I2", "為自己祈福 8 秒：受到的傷害 −35%，所有生命回復量 +50%。"],
  ["ac_basil", "acolyte", "神聖之殿", "basil", 0.4, 12, ["spell", "aoe", "holy"], "holy", null, 362, "O4", "在腳下展開 5 秒的神聖結界：頭目以外的敵人無法進入（會被推出結界），被推出時受到 {hit}% 武器傷害；你站在結界內時技能傷害 +25%。"],
  ["ac_judex", "acolyte", "審判", "judex", 0.8, 4, ["spell", "holy"], "holy", null, 2038, "L3", "降下審判之光，在敵人之間跳躍 5 次（沒有其他敵人時重複打同一個），每次造成 {hit}% 武器傷害，每跳一次傷害 +25%。"],
  ["ac_adora", "acolyte", "讚美詩", "adora", 3.0, 5, ["spell", "aoe", "holy"], "holy", null, 2040, "T4", "以讚美詩在目標處降下聖光，範圍內敵人受到 {hit}% 武器傷害並致盲 3 秒（攻擊有 50% 機率落空）；3 秒內受到的聖屬性傷害 +30%。"],
  // 武僧線
  ["ac_tfist", "acolyte", "伏虎拳", "tfist", 3.0, 4, [], "ghost", null, 371, "I3", "重擊目標造成 {hit}% 武器傷害並定身 2 秒（頭目、菁英較短）；在連打掌之後 2 秒內施放時傷害 +50% 並獲得 1 顆氣彈。"],
  ["ac_chain", "acolyte", "連環全身掌", "chain", 0.85, 5, [], "ghost", null, 372, "L3", "連續掌擊目標 6 次，每次 {hit}% 武器傷害；消耗全部氣彈，每顆打擊 +1 次（最多 +5 次）；在伏虎拳之後 2 秒內施放時傷害 +50%。"],
  ["ac_tcannon", "acolyte", "虎砲", "tcannon", 5.5, 7, ["aoe"], "ghost", null, 2330, "P5", "消耗目前生命 10%（生命低於 15% 時不消耗），對目標造成 {hit}% 武器傷害並波及周圍敵人（一半傷害）；目標生命低於 30% 時傷害 ×1.5。"],
  ["ac_skynet", "acolyte", "天羅地網", "skynet", 0.9, 4, ["aoe"], "ghost", null, 2327, "T4", "躍起後連續 3 次砸向四周，每次對周圍敵人造成 {hit}% 武器傷害；每次砸中敵人獲得 0.5 顆氣彈（每次施放最多 2 顆）。"],
  // 鐵匠線
  ["mc_melt", "merchant", "熔毀", "melt", 0, 14, [], "fire", null, 384, "I2", "10 秒內普通攻擊與技能命中時使敵人「熔解」：每層受到的傷害 +3%（最多 10 層，持續 6 秒）。"],
  ["mc_otmax", "merchant", "極限武器強化", "otmax", 0, 15, [], "neutral", null, 486, "I2", "10 秒內傷害 +40%（支付 20×等級 Zeny；Zeny 不足時改為 +20%）。（Zeny 高於 5×等級² 的保留額時才付款）"],
  ["mc_aboom", "merchant", "斧頭迴旋鏢", "aboom", 2.0, 4, ["proj"], "neutral", null, 2278, "L3", "擲出斧頭飛向目標再飛回，去程與回程各對路徑上的敵人造成 {hit}% 武器傷害（受手推車重量加成）；累積 20 熱量。"],
  ["mc_flame", "merchant", "火焰發射器", "flame", 0.9, 5, ["aoe", "elem"], "fire", "brn", 2259, "S4", "向前方噴射火焰 1 秒，每 0.2 秒對扇形範圍內的敵人造成 {hit}% 武器傷害並燃燒；施放時熱量在一半以上則傷害 +50%；累積 35 熱量。"],
  // 鍊金術師線
  ["mc_cultiv", "merchant", "植物栽培", "cultiv", 4.0, 9, ["minion", "aoe"], "earth", null, 491, "O4", "在目標附近種下一株隨機植物：治療草（8 秒內每秒回復你 2% 最大生命）或爆炸菇（6 秒後爆炸，對周圍敵人造成 {hit}% 武器傷害並中毒）。召喚物輔助可增加數量與效果。"],
  ["mc_potion", "merchant", "藥水投擲", "potion", 0, 12, [], "neutral", null, 478, "I2", "投擲狂暴藥水：10 秒內你的攻擊速度 +25%、生命體與召喚物傷害 +50%；你回復 10% 最大生命、生命體回復 30% 生命（受「學習藥水」等藥水效果加成）。"],
];
//    id, 職業, 名稱, 需求標籤, RO 圖示, 形狀, 說明
const V86_SUP = [
  ["th_cdp", "thief", "製作劇毒", null, 407, "L3", "相鄰技能擊殺中毒的敵人時，牠身上剩餘的毒素擴散給周圍最近的 2 名敵人。"],
  ["th_illus", "thief", "幻影突襲", null, 2023, "I2", "相鄰的主動技能施放時瞬移到目標身後，1.5 秒內該技能的傷害 +40%（每 3 秒最多 1 次）。"],
  ["th_plag", "thief", "抄襲", null, 225, "L3", "相鄰技能每擊中 1 名不同的敵人，該技能傷害 +4%（最多 +40%），每次施放重新計算。"],
  ["ac_scol", "acolyte", "吸氣功", null, 401, "I2", "相鄰技能擊殺敵人時回復 1 顆氣彈；氣彈已滿時，相鄰技能傷害 +20%。"],
  ["ac_rdragon", "acolyte", "潛龍昇天", null, 2338, "L3", "相鄰的主動技能施放時，氣彈上限 +3 並立即補滿，持續 8 秒（每 15 秒最多 1 次）。"],
  ["mc_wref", "merchant", "武器精煉", null, 477, "I2", "相鄰的主動技能傷害依武器精煉值提高：每 +1 增加 3%（最多 +45%）。"],
  ["mc_fexp", "merchant", "火焰擴散", null, 2486, "L3", "相鄰技能產生的持續區域與植物（毒雲、火焰瓶的火海、地獄植物、植物栽培等）結束時爆炸，對周圍敵人造成 200% 武器傷害。"],
];
const V86_TIER = {
  thief: [
    [[], ["th_masslt", "th_sbreak", "th_cdp"], ["th_rcut", "th_cimpact", "th_illus"]],
    [[], ["th_fstrip", "th_reject", "th_plag"], []],
  ],
  acolyte: [
    [[], ["ac_assum", "ac_basil"], ["ac_judex", "ac_adora"]],
    [[], ["ac_tfist", "ac_chain", "ac_scol"], ["ac_tcannon", "ac_skynet", "ac_rdragon"]],
  ],
  merchant: [
    [[], ["mc_melt", "mc_otmax", "mc_wref"], ["mc_aboom", "mc_flame"]],
    [[], ["mc_cultiv", "mc_potion"], ["mc_fexp"]],
  ],
};
if (typeof V6_ACT !== "undefined" && typeof V6_SUP !== "undefined" && typeof V6_CLASS !== "undefined") {
  for (const r of V86_ACT) {
    V6_ACT.push(r);
    V6_CLASS[r[1]].act.push(r[0]);
    if (typeof V6_JOB !== "undefined") V6_JOB[r[0]] = [];
  }
  for (const r of V86_SUP) {
    V6_SUP.push(r);
    V6_CLASS[r[1]].sup.push(r[0]);
    if (typeof V6_JOB !== "undefined") V6_JOB[r[0]] = [];
  }
  // 終結技（連擊點）、消耗氣彈技能
  if (typeof V6_FIN !== "undefined") ["th_sbreak", "th_cimpact"].forEach((id) => V6_FIN.add(id));
  if (typeof V6_SPEND !== "undefined") V6_SPEND.add("ac_chain");
  if (typeof V6_SELF !== "undefined") Object.assign(V6_SELF, { basil: 26, skynet: 30 });
  if (typeof V81_TIER !== "undefined")
    for (const [cls, lines] of Object.entries(V86_TIER)) lines.forEach((L, li) => L.forEach((ids, t) => V81_TIER[cls][li][t].push(...ids)));
}

// ---------------------------------------------------------------------------
// 2. 共用狀態
const V86 = { rej: { t: 0, cd: 0 }, assum: 0, basil: null, melt: 0, ot: { t: 0, k: 0 }, pot: 0, comboAt: -9, tfistAt: -9, illCd: 0, ill: { id: null, t: 0 }, plag: {}, rdCd: 0, rdT: 0, rdOn: 0, fe: null, mia: [] };
// 卸除裝備
function v86Strip(m, d) {
  if (!alive(m)) return;
  m.v86strip = G.t + d;
  if (m.boss) return;
  m.sh = 0;
  if (m.gm) m.gm.sh = 0;
  if (Array.isArray(m.ea) && m.ea.length) {
    m.v86ea = m.ea;
    m.ea = [];
    later(d, () => {
      if (alive(m) && m.v86ea) {
        m.ea = m.v86ea;
        m.v86ea = null;
      }
    });
  }
  num(m.x, m.y - (m.h || 12) - 10, "卸除", "#e8d8ff");
}
// 迴旋類投擲物（迴旋刃、斧頭迴旋鏢）：去程、回程各打一次穿過的敵人
function v86Boomerang(c, k, opt) {
  const { tgt } = c,
    [hx, hy] = handPos(),
    seen = new Set();
  const e = v6Ent({
    life: 3,
    x: hx,
    y: hy,
    leg: 0,
    hs: new Set(),
    upd: (e, dt) => {
      const back = e.leg === 1,
        tx = back ? G.pl.x : e.tx,
        ty = back ? G.pl.y - 6 : e.ty,
        dx = tx - e.x,
        dy = ty - e.y,
        d = Math.hypot(dx, dy) || 1,
        v = (opt.spd || 260) * dt;
      if (d <= v) {
        if (back) e.t = e.life;
        else (e.leg = 1), (e.hs = new Set());
      } else (e.x += (dx / d) * v), (e.y += (dy / d) * v);
      for (const m of G.mobs)
        if (!e.hs.has(m) && m.spawnT <= 0 && Math.hypot(m.x - e.x, m.y - 4 - e.y) < (opt.r || 9) + (m.boss ? 6 : 0)) {
          e.hs.add(m);
          v6Hit(m, k, c.o, { kb: 40, sx: e.x, sy: e.y });
          if (!seen.has(m)) {
            seen.add(m);
            opt.onNew && opt.onNew(m, seen.size);
          }
          if (seen.size <= 2 && e.hs.size === 1) v6Ro(opt.fx, m.x, m.y);
        }
    },
    draw: opt.draw,
  });
  // 飛到目標後面一點再折返（最遠 110）
  const a = Math.atan2(tgt.y - 4 - hy, tgt.x - hx),
    L = Math.min(110, Math.hypot(tgt.x - hx, tgt.y - hy) + 18);
  e.tx = hx + Math.cos(a) * L;
  e.ty = hy + Math.sin(a) * L;
  return e;
}

// ---------------------------------------------------------------------------
// 3. 招式
function v86Moves() {
  const dash = (p, tgt, gap = 8) => {
    const a = Math.atan2(tgt.y - p.y, tgt.x - p.x),
      from = { x: p.x, y: p.y - 6 };
    [p.x, p.y] = v6Clamp(tgt.x - gap * Math.cos(a), tgt.y - gap * 0.6 * Math.sin(a));
    p.vx = p.vy = 0;
    streak(from, { x: p.x, y: p.y - 6 }, "#e8d8ff");
    setFace(a);
    return a;
  };
  Object.assign(V6_CAST, {
    // ---------------- 盜賊 ----------------
    masslt(c) {
      if (!v6Need(c)) return false;
      const { p, tgt } = c,
        R = 26 * c.n,
        [x, y] = typeof v83Dense === "function" ? v83Dense(tgt.x, tgt.y, R) : [tgt.x, tgt.y],
        from = { x: p.x, y: p.y - 6 };
      [p.x, p.y] = v6Clamp(x, y + 2);
      p.vx = p.vy = 0;
      streak(from, { x: p.x, y: p.y - 6 }, "#c8b0ff");
      p.anim = { k: "slam", t: 0, dur: 0.3, a: p.face };
      v6Ro("th_masslt", x, y);
      later(0.1, () => {
        let n = 0;
        for (const m of v6Near(x, y, R)) {
          v6Hit(m, c.hit * c.r, c.o, { kb: 90, sx: x, sy: y });
          if (RAND() < 0.3) v6Stun(m, 1);
          if (RAND() < 0.3 && typeof v85Blind === "function") v85Blind(m, 3);
          n++;
        }
        if (n) v6CpAdd(Math.min(3, n));
        v6Fx({ k: "ring", x, y: y - 3, r: R, life: 0.35, col: "#c8b0ff", grow: 1 });
        burst(x, y - 4, 22, V6_C.shadow, 140, { z: 4, glow: 1 });
        shake(0.14);
      });
      return true;
    },
    sbreak(c) {
      if (!v6Need(c)) return false;
      const { p, tgt } = c,
        n0 = Math.floor(v6G().cp || 0),
        cp = v6FinCp(c);
      setFace(c.ang);
      p.anim = { k: "cast", t: 0, dur: 0.32, a: c.ang };
      const [hx, hy] = handPos();
      streak({ x: hx, y: hy }, { x: tgt.x, y: tgt.y - 6 }, "#b08aff");
      later(0.15, () => {
        if (!alive(tgt)) return;
        const low = tgt.hp < tgt.max * 0.3;
        v6Hit(tgt, c.hit * c.r * cp * (low ? 2 : 1), c.o, { kb: 60, stop: 1 });
        v6Ro("th_sbreak", tgt.x, tgt.y);
        if (!(tgt.hp > 0) && n0 > 0) {
          v6CpAdd(n0);
          num(G.pl.x, G.pl.y - 34, `返還 ${n0} 連擊點`, "#ffd27a");
        }
      });
      return true;
    },
    rcut(c) {
      if (!v6Need(c)) return false;
      const { p } = c;
      setFace(c.ang);
      p.anim = { k: "swing", t: 0, dur: 0.24, a: c.ang, combo: 1 };
      let got = 0;
      v86Boomerang(c, c.hit * c.r, {
        fx: "th_rcut",
        onNew: () => got < 3 && (got++, v6CpAdd(1)),
        draw: (e, cx) => {
          cx.save();
          cx.translate(e.x, e.y);
          cx.rotate(G.t * 22);
          cx.strokeStyle = "#e8e8f4";
          cx.lineWidth = 1.6;
          for (let i = 0; i < 2; i++) {
            cx.beginPath();
            cx.arc(0, 0, 5, i * Math.PI, i * Math.PI + 1.9);
            cx.stroke();
          }
          cx.fillStyle = "#b08aff";
          cx.fillRect(-1, -1, 2, 2);
          cx.restore();
        },
      });
      return true;
    },
    cimpact(c) {
      if (!v6Need(c)) return false;
      const { p, tgt } = c,
        n0 = Math.floor(v6G().cp || 0),
        cp = v6FinCp(c),
        a = dash(p, tgt, 9);
      p.anim = { k: "swing", t: 0, dur: 0.3, a, combo: 2 };
      later(0.15, () => {
        if (!alive(tgt)) return;
        const o = n0 >= 3 ? Object.assign({}, c.o, { crit: (c.o.crit || 0) + 1000, critm: (c.o.critm || 0) + 50 }) : c.o;
        v6Hit(tgt, c.hit * c.r * cp, o, { kb: 120, stop: 1 });
        v6Ro("th_cimpact", tgt.x, tgt.y);
        v6Fx({ k: "cross", x: tgt.x, y: tgt.y - 3, L: 20, w: 3, life: 0.4, col: "#e8d8ff" });
        burst(tgt.x, tgt.y - 6, 18, ["#ffffff", "#e8d8ff", "#8a6ad8"], 130, { z: 6, glow: 1 });
        shake(0.16);
      });
      return true;
    },
    fstrip(c) {
      if (!v6Need(c)) return false;
      const { p, tgt } = c;
      setFace(c.ang);
      p.anim = { k: "swing", t: 0, dur: 0.22, a: c.ang, combo: 1 };
      later(0.1, () => {
        if (!alive(tgt)) return;
        v6Hit(tgt, c.hit * c.r, c.o, { kb: 30 });
        v86Strip(tgt, 8);
        v6Ro("th_fstrip", tgt.x, tgt.y);
      });
      v6CpAdd(2);
      return true;
    },
    reject(c) {
      const { p } = c;
      V86.rej = { t: G.t + 6, cd: 0, mult: c.hit * c.r, o: Object.assign({}, c.o, { v86k: "reject" }) };
      p.anim = { k: "cast", t: 0, dur: 0.3, a: p.face };
      v6Ro("th_reject", p.x, p.y);
      num(p.x, p.y - 30, "反擊之劍", "#e8d8ff");
      return true;
    },
    // ---------------- 服事：祭司 ----------------
    assum(c) {
      const { p } = c;
      V86.assum = G.t + 8;
      p.anim = { k: "cast", t: 0, dur: 0.4, a: -Math.PI / 2, big: 1 };
      v6Ro("ac_assum", p.x, p.y);
      num(p.x, p.y - 30, "聖母之祈福", "#fff1ae");
      return true;
    },
    basil(c) {
      const { p } = c,
        R = 26 * c.n,
        x = p.x,
        y = p.y;
      p.anim = { k: "cast", t: 0, dur: 0.4, a: -Math.PI / 2, big: 1 };
      v6Ro("ac_basil", x, y);
      const e = v6Ent({
        zone: 1,
        life: 5,
        x,
        y,
        upd: () => {
          for (const m of v6Near(x, y, R)) {
            if (m.boss) continue;
            const dx = m.x - x,
              dy = (m.y - y) / 0.7,
              d = Math.hypot(dx, dy) || 1;
            m.x = x + (dx / d) * (R + 3);
            m.y = y + (dy / d) * (R + 3) * 0.7;
            m.vx = m.vy = 0;
            if (!(m.v86basCd > G.t)) {
              m.v86basCd = G.t + 0.5;
              v6Hit(m, c.hit * c.r, c.o, { kb: 40, sx: x, sy: y });
            }
          }
        },
        gdraw: (e, cx) => {
          const al = Math.min(1, e.t * 4, (e.life - e.t) * 2);
          cx.save();
          cx.globalAlpha = 0.14 * al;
          cx.fillStyle = "#fff1ae";
          cx.beginPath();
          cx.ellipse(x, y - 3, R, R * 0.7, 0, 0, Math.PI * 2);
          cx.fill();
          cx.globalAlpha = 0.7 * al;
          cx.strokeStyle = "#ffe08a";
          cx.lineWidth = 1.5;
          cx.stroke();
          cx.restore();
        },
      });
      V86.basil = { x, y, R, t: G.t + e.life };
      return true;
    },
    judex(c) {
      if (!v6Need(c)) return false;
      const { p } = c;
      let cur = c.tgt,
        px = p.x,
        py = p.y - 20;
      p.anim = { k: "cast", t: 0, dur: 0.4, a: c.ang };
      for (let i = 0; i < 5; i++)
        later(0.12 * i, () => {
          if (!alive(cur)) cur = v6Near(px, py, 60)[0];
          if (!cur) return;
          v6Hit(cur, c.hit * c.r * (1 + 0.25 * i), c.o, { kb: 20 });
          v6Fx({ k: "line", x: px, y: py, x2: cur.x, y2: cur.y - 6, w: 2, life: 0.18, col: "#fff6c8" });
          v6Fx({ k: "pillar", x: cur.x, y: cur.y, life: 0.25, col: "#fff1ae" });
          if (i === 0 || i === 4) v6Ro("ac_judex", cur.x, cur.y);
          px = cur.x;
          py = cur.y - 6;
          const nx = v6Near(cur.x, cur.y, 50 * c.n)
            .filter((m) => m !== cur && alive(m))
            .sort((a, b) => Math.hypot(a.x - cur.x, a.y - cur.y) - Math.hypot(b.x - cur.x, b.y - cur.y))[0];
          if (nx) cur = nx;
        });
      return true;
    },
    adora(c) {
      if (!v6Need(c)) return false;
      const { p, tgt } = c,
        R = 22 * c.n,
        x = tgt.x,
        y = tgt.y;
      p.anim = { k: "cast", t: 0, dur: 0.4, a: c.ang, big: 1 };
      v6Ro("ac_adora", x, y);
      later(0.2, () => {
        for (const m of v6Near(x, y, R)) {
          v6Hit(m, c.hit * c.r, c.o, { kb: 30 });
          if (typeof v85Blind === "function") v85Blind(m, 3);
          m.v86adora = G.t + 3;
        }
        v6Fx({ k: "ring", x, y: y - 3, r: R, life: 0.35, col: "#fff1ae", grow: 1 });
        burst(x, y - 6, 18, V6_C.holy, 110, { z: 8, glow: 1 });
      });
      return true;
    },
    // ---------------- 服事：武僧 ----------------
    tfist(c) {
      if (!v6Need(c)) return false;
      const { p, tgt } = c,
        combo = G.t - V86.comboAt <= 2;
      setFace(c.ang);
      p.anim = { k: "punch", t: 0, dur: 0.28, a: c.ang };
      V86.tfistAt = G.t;
      later(0.12, () => {
        if (!alive(tgt)) return;
        v6Hit(tgt, c.hit * c.r * (combo ? 1.5 : 1), c.o, { kb: 30, stop: 1 });
        const k = tgt.boss ? 0.25 : tgt.elite ? 0.6 : 1;
        tgt.root = Math.max(tgt.root || 0, 2 * k);
        v6Ro("ac_tfist", tgt.x, tgt.y);
        if (combo) {
          v6SphAdd(1);
          num(p.x, p.y - 30, "連段！", "#ffd27a");
        }
        shake(0.1);
      });
      return true;
    },
    chain(c) {
      if (!v6Need(c)) return false;
      const { p, tgt } = c,
        after = G.t - V86.tfistAt <= 2,
        n = v6SphSpend(c),
        hits = 6 + Math.min(5, Math.floor(n)) + (c.m.extra || 0),
        k = c.hit * c.r * (after ? 1.5 : 1);
      setFace(c.ang);
      if (after) num(p.x, p.y - 30, "連段！", "#ffd27a");
      for (let i = 0; i < hits; i++)
        later(0.05 + 0.06 * i, () => {
          if (!alive(tgt)) return;
          p.anim = { k: "punch", t: 0, dur: 0.06, a: c.ang };
          v6Hit(tgt, k, c.o, { kb: 4, stop: i === hits - 1 ? 1 : 0 });
          if (i % 3 === 0) v6Ro("ac_chain", tgt.x + rf(-4, 4), tgt.y + rf(-3, 3));
        });
      return true;
    },
    tcannon(c) {
      if (!v6Need(c)) return false;
      const { p, tgt } = c;
      if (S.hp > PS.maxhp * 0.15) S.hp -= S.hp * 0.1;
      setFace(c.ang);
      p.anim = { k: "punch", t: 0, dur: 0.4, a: c.ang, big: 1 };
      burst(p.x, p.y - 8, 14, ["#ffd27a", "#ff8a3a", "#ffffff"], 60, { z: 6, glow: 1 });
      later(0.25, () => {
        if (!alive(tgt)) return;
        const low = tgt.hp < tgt.max * 0.3,
          k = c.hit * c.r * (low ? 1.5 : 1);
        v6Hit(tgt, k, c.o, { kb: 160, stop: 1 });
        for (const m of v6Near(tgt.x, tgt.y, 26 * c.n)) if (m !== tgt) v6Hit(m, k * 0.5, c.o, { kb: 100, sx: tgt.x, sy: tgt.y });
        v6Ro("ac_tcannon", tgt.x, tgt.y);
        burst(tgt.x, tgt.y - 6, 30, ["#ffffff", "#ffd27a", "#ff8a3a"], 170, { z: 6, glow: 1 });
        shake(0.25);
      });
      return true;
    },
    skynet(c) {
      const { p } = c,
        R = 30 * c.n;
      let got = 0;
      p.anim = { k: "slam", t: 0, dur: 0.6, a: p.face };
      v6Ro("ac_skynet", p.x, p.y);
      for (let i = 0; i < 3; i++)
        later(0.15 + 0.2 * i, () => {
          if (G.dead) return;
          const pl = G.pl;
          let hit = 0;
          for (const m of v6Near(pl.x, pl.y - 3, R)) v6Hit(m, c.hit * c.r, c.o, { kb: 50 }), hit++;
          if (hit && got < 2) (got += 0.5), v6SphAdd(0.5);
          v6Fx({ k: "ring", x: pl.x, y: pl.y - 3, r: R, life: 0.25, col: "#ffd27a", grow: 1 });
          shake(0.08);
        });
      return true;
    },
    // ---------------- 商人：鐵匠 ----------------
    melt(c) {
      V86.melt = G.t + 10;
      c.p.anim = { k: "cast", t: 0, dur: 0.35, a: c.p.face };
      v6Ro("mc_melt", c.p.x, c.p.y);
      num(c.p.x, c.p.y - 30, "熔毀", "#ff9a5a");
      return true;
    },
    otmax(c) {
      const paid = v6PayZeny(20);
      V86.ot = { t: G.t + 10, k: paid ? 0.4 : 0.2 };
      c.p.anim = { k: "cast", t: 0, dur: 0.35, a: c.p.face };
      v6Ro("mc_otmax", c.p.x, c.p.y);
      num(c.p.x, c.p.y - 30, `極限武器強化 +${paid ? 40 : 20}%`, "#ffe08a");
      if (paid) num(c.p.x, c.p.y - 40, "-" + paid + "z", "#ffe08a");
      return true;
    },
    aboom(c) {
      if (!v6Need(c)) return false;
      const { p } = c;
      setFace(c.ang);
      p.anim = { k: "swing", t: 0, dur: 0.28, a: c.ang, combo: 2 };
      v6HeatAdd(20);
      v86Boomerang(c, c.hit * c.r * v6CartMul(), {
        fx: "mc_aboom",
        spd: 240,
        r: 10,
        draw: (e, cx) => {
          cx.save();
          cx.translate(e.x, e.y);
          cx.rotate(G.t * 16);
          cx.fillStyle = "#8a6a4a";
          cx.fillRect(-0.8, -6, 1.6, 12);
          cx.fillStyle = "#d8dce4";
          cx.beginPath();
          cx.moveTo(0, -6);
          cx.lineTo(5, -4);
          cx.lineTo(5, 1);
          cx.lineTo(0, -1);
          cx.closePath();
          cx.fill();
          cx.restore();
        },
      });
      return true;
    },
    flame(c) {
      const { p } = c,
        a0 = c.ang,
        R = 48 * c.n,
        H = 0.6,
        hot = (v6G().heat || 0) >= V6_HEAT.max * 0.5;
      setFace(a0);
      p.anim = { k: "shoot", t: 0, dur: 1.0, a: a0, big: 1 };
      v6HeatAdd(35);
      v6Fx({ k: "cone", x: p.x, y: p.y - 4, a: a0, h: H, R, life: 1.0, col: "#ff7a2a" });
      for (let i = 0; i < 5; i++)
        later(0.2 * i, () => {
          if (G.dead) return;
          const pl = G.pl;
          for (const m of v6Cone(pl.x, pl.y - 4, a0, H, R)) v6Hit(m, c.hit * c.r * (hot ? 1.5 : 1), c.o, { kb: 15 });
          for (let k = 0; k < 5; k++) {
            const aa = a0 + rf(-H, H),
              d = rf(8, R);
            burst(pl.x + Math.cos(aa) * d, pl.y - 4 + Math.sin(aa) * d * 0.7, 2, V6_C.fire, 40, { z: 4, glow: 1, life: 0.5 });
          }
          if (i % 2 === 0) v6Ro("mc_flame", pl.x + Math.cos(a0) * R * 0.55, pl.y + Math.sin(a0) * R * 0.4);
        });
      if (hot) num(p.x, p.y - 30, "高溫 +50%", "#ff9a5a");
      return true;
    },
    // ---------------- 商人：鍊金術師 ----------------
    cultiv(c) {
      if (!v6Need(c)) return false;
      const { tgt } = c,
        n = 1 + (c.m.minion || 0),
        mk = 1 + (c.m.mlife || 0);
      for (let i = 0; i < n; i++) {
        const [x, y] = v6Clamp(tgt.x + rf(-14, 14), tgt.y + rf(-8, 8)),
          herb = RAND() < 0.5;
        v6Ro("mc_cultiv", x, y);
        if (herb)
          v6Ent({
            k: "plant",
            life: 8,
            iv: 1,
            x,
            y,
            tick: () => {
              heal(PS.maxhp * 0.02 * mk);
              burst(x, y - 6, 3, ["#7ad46a", "#e0ffb0"], 30, { z: 6, life: 0.5 });
            },
            draw: (e, cx) => {
              cx.save();
              cx.fillStyle = "#3a8a2a";
              for (let j = -1; j <= 1; j++) {
                cx.beginPath();
                cx.ellipse(x + j * 2.5, y - 4, 1.6, 4, j * 0.5, 0, Math.PI * 2);
                cx.fill();
              }
              cx.fillStyle = "#e0ffb0";
              cx.fillRect(x - 0.5, y - 9, 1, 1);
              cx.restore();
            },
          });
        else
          v6Ent({
            k: "plant",
            life: 6,
            x,
            y,
            end: () => {
              const R = 24 * c.n;
              for (const m of v6Near(x, y, R)) v6Hit(m, c.hit * c.r * mk, Object.assign({}, c.o, { psn: c.o.pcap }), { kb: 80, sx: x, sy: y });
              v6Fx({ k: "ring", x, y: y - 3, r: R, life: 0.35, col: "#c8a85a", grow: 1 });
              burst(x, y - 4, 20, V6_C.poison, 120, { z: 3, glow: 1 });
            },
            draw: (e, cx) => {
              const s = 1 + (e.t > e.life - 1 ? 0.25 * Math.sin(G.t * 30) : 0);
              cx.save();
              cx.fillStyle = "#e8dcc8";
              cx.fillRect(x - 1, y - 5, 2, 5);
              cx.fillStyle = "#c83a3a";
              cx.beginPath();
              cx.ellipse(x, y - 6, 4 * s, 2.6 * s, 0, Math.PI, 0);
              cx.fill();
              cx.fillStyle = "#ffffff";
              cx.fillRect(x - 2, y - 7, 1, 1);
              cx.fillRect(x + 1, y - 8, 1, 1);
              cx.restore();
            },
          });
      }
      return true;
    },
    potion(c) {
      const { p } = c,
        k = 1 + (PS.pot || 0) / 100;
      V86.pot = G.t + 10;
      heal(PS.maxhp * 0.1 * k);
      for (const h of G.gsp || []) if (h.hp > 0 && h.max) h.hp = Math.min(h.max, h.hp + h.max * 0.3 * k);
      p.anim = { k: "shoot", t: 0, dur: 0.3, a: p.face };
      v6Ro("mc_potion", p.x, p.y);
      burst(p.x, p.y - 10, 14, ["#ff6a6a", "#ffd0d0", "#ffffff"], 70, { z: 10, glow: 1 });
      num(p.x, p.y - 30, "狂暴藥水", "#ff8a8a");
      return true;
    },
  });
  // 增益技能：沒有效果時才施放
  for (const k of ["reject", "assum", "melt", "otmax", "potion"]) V6_ALWAYS.add(k);
  const rd = v6Ready,
    rg = v6Range;
  v6Range = function (g, ...a) {
    const k = SKILLS[g.id]?.v6;
    if (k === "sbreak") return Math.max(1.6 * PS.range, 80);
    if (k === "rcut" || k === "aboom") return 95;
    if (k === "cimpact" || k === "tfist" || k === "chain") return PS.range + 6;
    if (k === "tcannon") return Math.max(PS.range + 6, 40);
    if (k === "flame") return 44 * PS.area * (1 + gemMods(g).area);
    return rg.call(this, g, ...a);
  };
  v6Ready = function (g, ...a) {
    const k = SKILLS[g.id]?.v6,
      near = (r) => !G.dead && mobsNear(G.pl.x, G.pl.y - 3, r).length > 0;
    if (k === "reject") return !(V86.rej.t > G.t) && near(45);
    if (k === "assum") return !(V86.assum > G.t) && near(60);
    if (k === "melt") return !(V86.melt > G.t) && near(2 * PS.range + 30);
    if (k === "otmax") return !(V86.ot.t > G.t) && near(2 * PS.range + 30);
    if (k === "potion") return !(V86.pot > G.t) && near(2 * PS.range + 30);
    return rd.call(this, g, ...a);
  };
}

// ---------------------------------------------------------------------------
// 4. 輔助與狀態效果
function v86Effects() {
  const cs = castSkill;
  castSkill = function (g, a = 1, ...x) {
    const sk = g && SKILLS[g.id],
      echo = typeof roEcho !== "undefined" && roEcho,
      p = G.pl;
    let fe = null,
      pre = null;
    if (sk && sk.act && !sk.sus && !echo) {
      try {
        if (g.id === "ac_combo") V86.comboAt = G.t;
        if (v6Linked(g, "th_plag")) V86.plag[g.id] = new Set();
        // 幻影突襲：施放前瞬移到目標身後
        if (v6Linked(g, "th_illus") && G.t >= V86.illCd && alive(p.tgt)) {
          const t = p.tgt,
            a0 = Math.atan2(p.y - t.y, p.x - t.x),
            from = { x: p.x, y: p.y - 6 };
          [p.x, p.y] = v6Clamp(t.x - Math.cos(a0) * 10, t.y - Math.sin(a0) * 6);
          p.vx = p.vy = 0;
          streak(from, { x: p.x, y: p.y - 6 }, "#8a6ad8");
          burst(from.x, from.y, 8, V6_C.shadow, 50, { z: 4 });
          V86.illCd = G.t + 3;
          V86.ill = { id: g.id, t: G.t + 1.5 };
        }
        if (v6Linked(g, "mc_fexp")) {
          const m = gemMods(g),
            t = alive(p.tgt) ? p.tgt : p;
          fe = V86.fe = { until: G.t + 1, mult: 2 * (1 + m.dmg), o: v6Opts(g, m), x: t.x, y: t.y };
          pre = new Set(G.fx || []);
        }
      } catch (e) {}
    }
    const r = cs.call(this, g, a, ...x);
    if (r === false || !sk || !sk.act || sk.sus || echo) return r;
    try {
      // 潛龍昇天
      if (v6Linked(g, "ac_rdragon") && G.t >= V86.rdCd && S.cls === "acolyte") {
        V86.rdCd = G.t + 15;
        if (!V86.rdOn) {
          V6_SPH.max += 3;
          V86.rdOn = 1;
        }
        V86.rdT = G.t + 8;
        v6G().sph = v6SphMax();
        num(p.x, p.y - 34, "潛龍昇天", "#ffd27a");
      }
      // 火焰擴散：引擎的毒雲在施放當下建立
      if (fe && pre)
        for (const f of G.fx || []) if (f.k === "mia" && !pre.has(f)) V86.mia.push({ ref: f, mult: fe.mult, o: fe.o });
    } catch (e) {}
    return r;
  };
  // 武器精煉：傷害隨武器精煉值（即時計算）
  if (SKILLS.mc_wref)
    SKILLS.mc_wref.mod = Object.defineProperty({}, "dmg", { enumerable: true, get: () => (typeof S !== "undefined" && S ? Math.min(0.45, 0.03 * (S.equip?.weapon?.ref || 0)) : 0) });
  // 擊中與受傷
  const fi = fire;
  fire = function (t, a, s, e, n) {
    if (t === "hit") {
      try {
        v86OnHit(a, s, e, n);
      } catch (er) {}
    } else if (t === "hurtPre") {
      try {
        const R = V86.rej;
        if (R.t > G.t && s && alive(s) && G.t >= R.cd) {
          R.cd = G.t + 0.3;
          later(0.05, () => {
            if (!alive(s) || G.dead) return;
            hitMob(s, R.mult, R.o);
            v6CpAdd(1);
            streak({ x: G.pl.x, y: G.pl.y - 6 }, { x: s.x, y: s.y - 6 }, "#e8d8ff");
            v6Ro("th_reject", s.x, s.y);
          });
        }
      } catch (er) {}
    }
    return fi.call(this, t, a, s, e, n);
  };
  // 卸除：頭目受到的暴擊傷害 +40%
  const hm = hitMob;
  hitMob = function (m, mult, o = {}, ...x) {
    if (m && m.boss && m.v86strip > G.t) o = Object.assign({}, o, { critm: (o.critm || 0) + 40 });
    return hm.call(this, m, mult, o, ...x);
  };
  // 聖母之祈福：回復量 +50%
  const hl = heal;
  heal = function (v, ...x) {
    return hl.call(this, V86.assum > G.t && v > 0 ? v * 1.5 : v, ...x);
  };
  const inBasil = () => {
    const b = V86.basil;
    return !!b && b.t > G.t && Math.hypot(G.pl.x - b.x, (G.pl.y - b.y) / 0.7) <= b.R;
  };
  HIT_MUL.push(
    { k: "v86:basil", lab: () => inBasil() && "神聖之殿：技能 ×1.25", f: (t, m, s) => (s && s.skill && inBasil() ? t * 1.25 : t) },
    { k: "v86:ot", lab: () => V86.ot.t > G.t && `極限武器強化 ×${1 + V86.ot.k}`, f: (t) => (V86.ot.t > G.t ? t * (1 + V86.ot.k) : t) },
    { k: "v86:pot", f: (t, m, s) => (V86.pot > G.t && s && s.min ? t * 1.5 : t) },
    { k: "v86:adora", f: (t, m, s) => (m && m.v86adora > G.t && s && (s.v6el === "holy" || (s.tg && s.tg.includes("holy"))) ? t * 1.3 : t) },
    { k: "v86:illus", f: (t, m, s) => (s && s.skill && V86.ill.t > G.t && typeof v83SkillOf === "function" && v83SkillOf(s) === V86.ill.id ? t * 1.4 : t) },
    {
      k: "v86:plag",
      f: (t, m, s) => {
        if (!m || !s || !s.skill || typeof v85Lk !== "function" || !v85Lk(s, "th_plag")) return t;
        const id = v83SkillOf(s),
          set = (V86.plag[id] ||= new Set());
        set.add(m);
        return t * (1 + 0.04 * Math.min(10, set.size));
      },
    },
    { k: "v86:scol", f: (t, m, s) => (s && s.skill && S.cls === "acolyte" && (v6G().sph || 0) >= v6SphMax() && typeof v85Lk === "function" && v85Lk(s, "ac_scol") ? t * 1.2 : t) },
  );
  TAKE_MUL.push({ k: "v86:melt", f: (t, m) => (m && m.v86melt && m.v86melt.t > G.t ? t * (1 + 0.03 * m.v86melt.n) : t) });
  HURT_MUL.push(
    { k: "v86:rej", f: () => (V86.rej.t > G.t ? 0.7 : 1) },
    { k: "v86:assum", f: () => (V86.assum > G.t ? 0.65 : 1) },
  );
  SPD_AS.push({ k: "v86:pot", f: () => (V86.pot > G.t ? 1.25 : 1) });
  // 每格：潛龍昇天到期、火焰擴散（地面區域結束時爆炸）
  const tk = tick;
  tick = function (dt, ...x) {
    const r = tk.call(this, dt, ...x);
    try {
      if (S && G?.pl) v86Tick();
    } catch (e) {}
    return r;
  };
}
function v86Boom(x, y, mult, o) {
  if (G.dead || !G.pl) return;
  const R = 26 * PS.area;
  for (const m of v6Near(x, y, R)) hitMob(m, mult, Object.assign({}, o, { kb: 70, sx: x, sy: y }));
  v6Fx({ k: "ring", x, y: y - 3, r: R, life: 0.35, col: "#ff8a3a", grow: 1 });
  burst(x, y - 4, 18, V6_C.fire, 130, { z: 4, glow: 1 });
}
function v86Tick() {
  if (V86.rdOn && G.t >= V86.rdT) {
    V6_SPH.max -= 3;
    V86.rdOn = 0;
    const g = v6G();
    g.sph = Math.min(g.sph || 0, v6SphMax());
  }
  // 火焰擴散：替相鄰技能剛建立的持續區域、植物加上結束時的爆炸
  const g = G.v6;
  if (g && g.ents && !g.ents.v86p) {
    g.ents.v86p = 1;
    const push = g.ents.push;
    g.ents.push = function (e, ...rest) {
      try {
        const fe = V86.fe;
        if (fe && G.t <= fe.until && e && (e.zone || e.k === "plant") && !e.v86fe) {
          e.v86fe = 1;
          const end = e.end,
            x = e.x ?? fe.x,
            y = e.y ?? fe.y,
            mult = fe.mult,
            o = fe.o;
          e.end = function (...a) {
            const r = end ? end.apply(this, a) : undefined;
            v86Boom(x, y, mult, o);
            return r;
          };
        }
      } catch (er) {}
      return push.call(this, e, ...rest);
    };
  }
  for (let i = V86.mia.length - 1; i >= 0; i--) {
    const it = V86.mia[i],
      f = it.ref;
    if (f.t >= f.life - 0.04 || !(G.fx || []).includes(f)) {
      V86.mia.splice(i, 1);
      v86Boom(f.x, f.y, it.mult, it.o);
    }
  }
}
function v86OnHit(mob, dmg, crit, o) {
  if (!mob || !G?.pl || !o) return;
  // 熔毀：命中時疊熔解
  if (V86.melt > G.t && alive(mob) && !(mob.v86meltCd > G.t)) {
    mob.v86meltCd = G.t + 0.1;
    const st = mob.v86melt && mob.v86melt.t > G.t ? mob.v86melt.n : 0;
    mob.v86melt = { n: Math.min(10, st + 1), t: G.t + 6 };
  }
  if (!o.skill || mob.hp > 0 || typeof v85Lk !== "function") return;
  // 以下為相鄰技能擊殺
  if (!mob.v86cdp && mob.psn && mob.psn.s && mob.psn.s.length && v85Lk(o, "th_cdp")) {
    mob.v86cdp = 1;
    const cap = Math.max(mob.psn.s.length, PS.psnMax || 1),
      near = v6Near(mob.x, mob.y, 60)
        .filter((m) => m !== mob && alive(m))
        .sort((a, b) => Math.hypot(a.x - mob.x, a.y - mob.y) - Math.hypot(b.x - mob.x, b.y - mob.y))
        .slice(0, 2);
    for (const t of near) {
      for (const s of mob.psn.s) if (s && s.t > 0) psnAdd(t, s.dps, cap);
      v6Fx({ k: "line", x: mob.x, y: mob.y - 5, x2: t.x, y2: t.y - 5, w: 1.5, life: 0.25, col: V6_C.poison[0] });
    }
  }
  if (!mob.v86scol && S.cls === "acolyte" && v85Lk(o, "ac_scol")) {
    mob.v86scol = 1;
    v6SphAdd(1);
  }
}

// ---------------------------------------------------------------------------
// 5. 預估傷害、特效、圖示、增益圖示
const V86_EST = { th_masslt: 1, th_sbreak: 1.6, th_rcut: 2, th_cimpact: 1.8, th_fstrip: 1, th_reject: 3, ac_basil: 2, ac_judex: 7.5, ac_adora: 1.2, ac_tfist: 1.2, ac_chain: 9, ac_tcannon: 1.1, ac_skynet: 3, mc_aboom: 2, mc_flame: 5, mc_cultiv: 0.5 };
const V86_FX = {
  th_masslt: [{ strip: "th_meteor", target: 1 }, { str: ["sonicblow"], target: 1 }],
  th_sbreak: [{ strip: "th_soulbrk", target: 1 }, { str: ["holyhit"], target: 1 }],
  th_rcut: [{ str: ["dancingblade"], target: 1 }],
  th_cimpact: [{ str: ["cross"], target: 1 }],
  th_fstrip: [{ str: ["strip_weapon", "strip_armor"], target: 1 }, { str: ["strip_armor"], target: 1 }],
  th_reject: [{ str: ["autocounter"], self: 1 }, { custom: "shadow", self: 1 }],
  ac_assum: [{ str: ["asum"], self: 1 }, { custom: "heal", self: 1 }],
  ac_basil: [{ str: ["safetywall"], self: 1, ground: 1 }, { custom: "aura", self: 1 }],
  ac_judex: [{ str: ["lexdivina"], target: 1 }, { str: ["holyhit"], target: 1 }],
  ac_adora: [{ str: ["ado"], target: 1 }, { str: ["holyhit"], target: 1 }],
  ac_tfist: [{ strip: "tiger", target: 1 }, { custom: "impact", target: 1 }],
  ac_chain: [{ strip: "palm", target: 1 }, { custom: "impact", target: 1 }],
  ac_tcannon: [{ str: ["sui_explosion"], target: 1 }, { custom: "impact", target: 1 }],
  ac_skynet: [{ str: ["sr_flashcombo"], self: 1 }, { custom: "impact", self: 1 }],
  mc_melt: [{ str: ["melt"], self: 1 }, { custom: "aura", self: 1 }],
  mc_otmax: [{ str: ["maximizepower"], self: 1 }, { custom: "aura", self: 1 }],
  mc_aboom: [{ str: ["spearboomerang"], target: 1 }, { str: ["bowling"], target: 1 }],
  mc_flame: [{ str: ["fire dragon"], target: 1 }, { str: ["firehit1"], target: 1 }],
  mc_cultiv: [{ str: ["flower_leaf"], target: 1 }, { custom: "summon", target: 1 }],
  mc_potion: [{ custom: "heal", self: 1 }],
};
function v86Finish() {
  for (const [id, k] of Object.entries(V86_EST))
    if (SKILLS[id]) {
      const sk = SKILLS[id];
      sk.est = () => sk.hit * k;
    }
  if (typeof roFxProfiles !== "undefined") {
    const D = typeof V78_FX_DATA !== "undefined" ? V78_FX_DATA : null;
    for (const [id, list] of Object.entries(V86_FX)) {
      const p = list.find((q) => (q.strip ? !!D?.custom?.[q.strip] : !q.str || (typeof roFxNative === "function" && q.str.every((n) => roFxNative(n)))));
      if (!p) continue;
      roFxProfiles[id] = p;
      if (p.strip && typeof V78_STRIP !== "undefined" && !V78_STRIP.img[p.strip] && typeof Image !== "undefined") {
        const im = new Image();
        im.onload = () => (V78_STRIP.img[p.strip] = im);
        im.src = D.custom[p.strip].file;
      }
    }
  }
  // RO 原本的圖示：重力場（HW_GRAVITATION）、大纏崩捶（SR_RAMPAGEBLASTER）、機甲加農砲（GN_CARTCANNON）
  if (typeof roSkillIcons !== "undefined") {
    if (roSkillIcons.mg_gravity === 361) roSkillIcons.mg_gravity = 484;
    if (roSkillIcons.ac_rampage === 2327) roSkillIcons.ac_rampage = 2332;
    if (roSkillIcons.mc_cannon === 2259) roSkillIcons.mc_cannon = 2477;
  }
  if (typeof HUD_BUFF !== "undefined") {
    const B = (k, n, end, bg, fg, tc, lines, art) => ({ k, n: () => (end() > G.t ? 1 : 0), left: () => Math.max(0, end() - G.t), bg, fg, tc, tip: (x, l) => [n, [`剩餘 ${l.toFixed(1)} 秒`, ...lines()]], art });
    HUD_BUFF.push(
      B("v86rej", "反擊之劍", () => V86.rej.t, "#4a3a6a", "#f0e8ff", "#c8b0ff", () => ["受到的傷害 −30%，被攻擊時反擊"], ["X.....X", ".X...X.", "..X.X..", "...X...", "..X.X..", ".X...X.", "X.....X"]),
      B("v86assum", "聖母之祈福", () => V86.assum, "#8a7a2a", "#fffbe6", "#fff1ae", () => ["受到的傷害 −35%", "生命回復量 +50%"], ["..XXX..", ".X...X.", "..XXX..", "...X...", ".XXXXX.", "...X...", "..X.X.."]),
      B("v86melt", "熔毀", () => V86.melt, "#8a3a1a", "#fff0e6", "#ff9a5a", () => ["命中時使敵人熔解（每層受到的傷害 +3%）"], ["...X...", "..XXX..", ".XXXXX.", "XXX.XXX", "XX...XX", ".X...X.", "..XXX.."]),
      B("v86ot", "極限武器強化", () => V86.ot.t, "#8a6a1a", "#fff6e0", "#ffe08a", () => [`傷害 +${Math.round(V86.ot.k * 100)}%`], ["......X", ".....X.", "....X..", "X..X...", ".XX....", ".XX....", "X..X..."]),
      B("v86pot", "狂暴藥水", () => V86.pot, "#8a2a3a", "#ffe6ea", "#ff8a8a", () => ["攻擊速度 +25%", "生命體與召喚物傷害 +50%"], ["..XXX..", "...X...", "..XXX..", ".XXXXX.", ".XXXXX.", ".XXXXX.", "..XXX.."]),
    );
  }
  if (typeof startGame === "function") {
    const sg = startGame;
    startGame = function (...a) {
      if (V86.rdOn) V6_SPH.max -= 3;
      Object.assign(V86, { rej: { t: 0, cd: 0 }, assum: 0, basil: null, melt: 0, ot: { t: 0, k: 0 }, pot: 0, comboAt: -9, tfistAt: -9, illCd: 0, ill: { id: null, t: 0 }, plag: {}, rdCd: 0, rdT: 0, rdOn: 0, fe: null, mia: [] });
      return sg.apply(this, a);
    };
  }
}
function v86Install() {
  if (typeof V6_CAST === "undefined" || !SKILLS.th_masslt) return;
  v86Moves();
  v86Effects();
  v86Finish();
}
if (typeof roV4Install === "function") {
  const r4v86 = roV4Install;
  roV4Install = function () {
    r4v86();
    v86Install();
  };
}
