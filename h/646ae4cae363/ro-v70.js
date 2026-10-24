/* 流浪仙境 v7.0：魔王闇答萊屍改由擊敗巴風特時 10% 從虛空召喚（掉落全面改版、新增魔王・獨特「闇答萊屍的冥王之冠」）；修正鐵拳、獸人酋長之戒仍會掉落 */

const V70 = {
  p: 0.1, // 擊敗巴風特後召喚機率
  delay: 2.5, // 秒
  hp: (3.7 * 4) / 9.25, // 生命：巴風特的 4 倍（原魔王為巴風特的 2.5 倍）
  dmg: (1.6 * 2) / 2.56, // 傷害：巴風特的 2 倍
  mats: ["x4", "i4", "e2", "b2", "y2", "p2"], // 高階素材（不含傳說的魔力礦石、MVP 門票）
  matN: 3,
  card: 0.01, // 傳說卡片
  mutX: 50, // 變異寶石：頭目機率 ×50
  crown: 0.005, // 冥王之冠
  col: "#b07aff",
};

// ---------------------------------------------------------------------------
// 修正：鐵拳、獸人酋長之戒權重為 0 時，加權抽選會退回清單第一個（鐵拳），
// 使巴風特 30% 的插槽石板（v6.2 起轉成主宰獨特）仍掉落鐵拳。沒有可掉落的主宰獨特時改為不產生。
function v70MythFixInstall() {
  v62MythItem = function (lv) {
    const ks = mythKeys().filter((k) => k !== "slate" && mythWt(k) > 0);
    if (!ks.length) return null;
    return makeItem(Math.max(lv, MYTH_LV), { uniq: 1, uqk: mythPick(ks) });
  };
}

// ---------------------------------------------------------------------------
// 魔王・獨特：闇答萊屍的冥王之冠
const V70_UQ = {
  n: "闇答萊屍的冥王之冠",
  slot: "helm",
  v: [12, 10, 12],
  src: "monarch",
  ico: 2256,
  mods: (t) => ({ lifep: t(0), cdr: t(1), res_all: t(2) }),
  more: () => ({ skill: -30 }),
  d: "最大生命 +{0}%；冷卻縮減 +{1}%；全屬性抗性 +{2}%；輔助寶石不需要連結主動技能：技能盤上的輔助寶石套用到每個主動技能（標籤不符照常不生效）；技能傷害 −30%",
};
const v70CrownOn = () => {
  const h = S?.equip?.helm;
  return !!(h && h.uq === "v70_crown" && canWear(h));
};
const V70_SLOT_W = [3, 4, 5, 6]; // 保底 3 孔，越多越稀有（依插槽權重：約 63／24／9／4%）
function v70Crown(lv) {
  const it = makeItem(Math.max(90, lv || 90), { uqk: "v70_crown" });
  if (!it) return null;
  const list = V5_BASES.helm,
    idx = list.findIndex((t) => t[0] === "巨角山羊頭盔");
  delete it.v5;
  delete it.arm;
  delete it.eva;
  v5Convert(it, idx >= 0 ? { tpl: [list[idx], idx] } : {});
  if (idx >= 0) it.base = list[idx][0];
  it.cm = +(0.5 + RAND()).toFixed(2); // 獨特素質 50%～150%
  it.cs = pickW(V70_SLOT_W, (n) => V5_HOLE_W[n]);
  it.cards = Array(it.cs).fill(null);
  it.v70 = 1;
  v5Name(it);
  return it;
}
function v70CrownInstall() {
  UNIQUE.v70_crown = V70_UQ;
  V70_UQ.ic = "u_v70_crown";
  ICONS.u_v70_crown ||= ICONS.sw0;
  roItemFiles.u_v70_crown = V70_UQ.ico;
  // 品質（底座與額外素質）50%～150%；插槽上限 6
  const vr = v5Range;
  v5Range = function (it) {
    return it && it.uq === "v70_crown" ? [0.5, 1.5] : vr(it);
  };
  const sc = v5SlotCap;
  v5SlotCap = function (it) {
    return it && it.uq === "v70_crown" ? 6 : sc(it);
  };
  // 輔助寶石不需要連結：技能盤上的每個輔助寶石都算與主動技能相鄰
  const adj = adjSupports;
  adjSupports = function (t) {
    if (v70CrownOn()) return placed().filter((g) => !SKILLS[g.id].act);
    return adj(t);
  };
  // 稀有度標示「魔王・獨特」
  const ih = ui.itemHead;
  ui.itemHead = function (t, ...a) {
    let h = ih.call(this, t, ...a);
    if (t && t.uq === "v70_crown") h = h.replace(/<br>獨特[^<・]*/, '<br><span class="v70mon">魔王・獨特</span>').replace(/class="iname ([^"]*)"/, 'class="iname $1 v70mon"');
    return h;
  };
  const ch = cellHtml;
  cellHtml = function (item, ...a) {
    const h = ch.call(this, item, ...a);
    return item && item.uq === "v70_crown" ? h.replace(/獨特(・[^"<]*)?/, "魔王・獨特") : h;
  };
  if (typeof document !== "undefined" && !document.getElementById("v70css")) {
    const st = document.createElement("style");
    st.id = "v70css";
    st.textContent = `.v70mon{color:${V70.col}!important;font-weight:bold;text-shadow:0 0 4px #4a2a8a88}`;
    document.head.appendChild(st);
  }
}

// ---------------------------------------------------------------------------
// 虛空召喚：擊敗巴風特後 10% 機率，2.5 秒後於同一場地降臨
function v70Summon() {
  if (!S || !G || G.dead || !canStart()) return;
  const mk0 = S.tw.mk || 0;
  S.tw.mk = MONARCH.mk;
  try {
    startGuard(4);
  } finally {
    S.tw.mk = mk0;
  }
  if (G.guard !== 4 || !G.boss) return;
  G.boss.max *= V70.hp;
  G.boss.hp = G.boss.max;
  G.boss.dmg *= V70.dmg;
  G.boss.v70mon = 1;
  G.flashes.push({ x: G.boss.x, y: G.boss.y - 10, t: 0, ring: 1, c: V70.col });
  toast("虛空裂開——魔王闇答萊屍降臨！", "bad", 1);
}
// 新掉落（原本的掉落全部移除）
function v70MonWin(t) {
  stBoss(1);
  G.guard = null;
  G.boss = null;
  ses().boss++;
  arenaOut(5);
  G.agT = G.t + AG_GAP;
  for (const m of G.mobs) m.add = 0;
  S.gd.m = (S.gd.m || 0) + 1;
  const src = t && t.x != null ? t : { x: G.pl.x, y: G.pl.y },
    drop = (a) => dropLoot(src, { ...a, v70: 1, v67keep: 1 });
  for (let i = 0; i < V70.matN; i++) {
    const k = V70.mats[Math.floor(RAND() * V70.mats.length)],
      m = MATS[k];
    if (m) drop({ mat: k, col: MAT_COL[m.f], tier: Math.min(3, m.l) });
  }
  if (RAND() < V70.card) {
    const pool = V5_CARDS.filter((c) => c.t === 5 && !c.ex),
      c = pool[Math.floor(RAND() * pool.length)];
    if (c) drop({ cd: c.id, col: V5_TIER[c.t].c, tier: 4 });
  }
  if (RAND() < RO_MUT.base * MUT.b * V70.mutX) {
    const gm = makeMutGem();
    if (gm) drop({ gm, col: SKILLS[gm.id].col, tier: 3 });
  }
  if (RAND() < V70.crown) {
    const it = v70Crown(S.lvl);
    if (it) {
      drop({ it, col: V70.col, tier: 4 });
      toast("闇答萊屍掉落了魔王・獨特「闇答萊屍的冥王之冠」！", "lvl", 1);
    }
  }
  sfx("win");
  shake(0.4);
  toast(`擊敗魔王${MONARCH.n}！`, "lvl");
  markDirty();
  ui.hud(!0);
  ui.refreshIf("map", "char");
}
function v70VoidInstall() {
  const fw = finalWin;
  finalWin = function (m, ...x) {
    const r = fw.call(this, m, ...x);
    if (RAND() < V70.p) {
      G.v70void = G.t + V70.delay;
      toast("巴風特倒下的地方，虛空開始震動……", "bad", 1);
      shake(0.3);
    }
    return r;
  };
  const tk = tick;
  tick = function (dt, ...x) {
    const r = tk.call(this, dt, ...x);
    if (G && G.v70void && G.t >= G.v70void) {
      G.v70void = 0;
      v70Summon();
    }
    return r;
  };
  monarchWin = v70MonWin;
  // 虛空召喚的闇答萊屍只掉落新掉落表的東西
  const dl = dropLoot;
  dropLoot = function (t, a, ...x) {
    if (t && t.v70mon && !(a && a.v70)) return;
    return dl.call(this, t, a, ...x);
  };
  // 說明
  const txt = `擊敗巴風特時 ${V70.p * 100}% 機率從虛空召喚魔王闇答萊屍（生命約巴風特的 4 倍、傷害 ×2，限時 270 秒，4 個階段）。掉落：高階素材隨機 ${V70.matN} 個（高純度神之金屬、高純度鋁、高純度紅／藍／黃魔力礦石、神工匠的祝福）、${V70.card * 100}% 傳說卡片、${+(RO_MUT.base * MUT.b * V70.mutX * 100).toFixed(2)}% 變異寶石、${V70.crown * 100}% 魔王・獨特「闇答萊屍的冥王之冠」。`;
  if (HELP.guard?.[1] && !HELP.guard[1].some((r) => r[0] === "闇答萊屍")) HELP.guard[1].push(["闇答萊屍", txt]);
  if (HELP.monarch?.[1]) {
    HELP.monarch[1] = [
      ["召喚", txt],
      ["冥王之冠", "頭盔，插槽保底 3 孔、最多 6 孔（越多越稀有），素質 50%～150% 浮動。最大生命 +12%、冷卻縮減 +10%、全屬性抗性 +12%（隨素質浮動）；輔助寶石不需要連結主動技能，技能盤上的輔助寶石套用到每個主動技能（標籤不符照常不生效）；技能傷害 −30%。"],
      ["MVP 武道場", "MVP 武道場的闇答萊屍不受影響，掉落照舊。"],
    ];
  }
  const gb = ui.guardBoard;
  if (gb)
    ui.guardBoard = function (...a) {
      const h = gb.apply(this, a);
      return h + `<p class="note" style="margin:6px 0 0">擊敗巴風特時有 ${V70.p * 100}% 機率從虛空召喚<b class="v70mon">魔王闇答萊屍</b>。</p>`;
    };
}

// ---------------------------------------------------------------------------
function v70Install() {
  v70MythFixInstall();
  v70CrownInstall();
  v70VoidInstall();
}
if (typeof roV4Install === "function") {
  const r4v70 = roV4Install;
  roV4Install = function () {
    r4v70();
    v70Install();
  };
}
