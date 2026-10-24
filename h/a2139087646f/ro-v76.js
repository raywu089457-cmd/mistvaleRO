/* 流浪仙境 v7.6：服事（武僧／修羅）腳下顯示氣球格子條；「關閉打擊特效」勾選後技能特效也一起關閉 */

// 原本氣球只用 2×2 的淡黃小方塊繞著角色轉，沒有「剩幾顆／上限幾顆」的格子，戰鬥中很難數。
// 改為跟盜賊的連擊點一樣，在角色腳下顯示上限數量的格子：有氣球的亮金色、沒有的暗色（加深色底，在黃色地面上也看得清楚）。
// 繞身的氣球照常顯示。
function v76SphPips(cx) {
  if (!S || S.cls !== "acolyte" || !G?.pl || G.dead) return;
  const g = v6G(),
    p = G.pl,
    max = Math.max(1, v6SphMax()),
    n = Math.min(max, Math.floor(g.sph || 0)),
    x0 = Math.round(p.x - (4 * max - 1) / 2),
    y = Math.round(p.y + 4);
  cx.save();
  cx.globalAlpha = 0.9;
  cx.fillStyle = "#1b1424";
  cx.fillRect(x0 - 1, y - 1, 4 * max + 1, 4);
  for (let i = 0; i < max; i++) {
    cx.fillStyle = i < n ? "#ffd84a" : "#4a4458";
    cx.fillRect(x0 + 4 * i, y, 3, 2);
  }
  cx.restore();
}
// ---------------------------------------------------------------------------
// 2. 設定 → 畫面「關閉打擊特效」（v7.4）勾選後，技能特效也一起關閉：
//    ・技能施放的 RO 動畫與光效（斬擊、爆炸、法陣、治癒光等）
//    ・職業技能的光圈、十字、扇形等短暫光效
//    ・技能造成的火花粒子（怪物死亡的碎片照常）
//    技能傷害照常；彈道、召喚物、持續區域（聖域、毒雲等）、頭目的紅色預警圈、擊殺特效不受影響
let v76Deal = 0;
const v76Off = () => !!S?.set?.v74nohit;
const v76SkillCtx = () => typeof roFxContext !== "undefined" && roFxContext && roFxContext.id && SKILLS[roFxContext.id];
function v76SkillFxInstall() {
  const fa = roFxAdd;
  roFxAdd = function (id, ...a) {
    if (v76Off() && SKILLS[id]) return;
    return fa.call(this, id, ...a);
  };
  const dm = dealMob;
  dealMob = function (...a) {
    v76Deal++;
    try {
      return dm.apply(this, a);
    } finally {
      v76Deal--;
    }
  };
  const bu = burst;
  burst = function (...a) {
    if (v76Off() && !v76Deal && v76SkillCtx()) return;
    return bu.apply(this, a);
  };
  const df = v6DrawFx;
  v6DrawFx = function (cx, ground, ...a) {
    const g = G?.v6;
    if (!v76Off() || !g || !g.fx?.length) return df.call(this, cx, ground, ...a);
    const keep = g.fx;
    g.fx = [];
    try {
      return df.call(this, cx, ground, ...a);
    } finally {
      g.fx = keep;
    }
  };
  const lab = "關閉打擊與技能特效（命中火花、命中停頓、技能動畫與光效、擊中特效）";
  const ms = ui.m_set;
  ui.m_set = function (...a) {
    const h = ms.apply(this, a);
    return typeof h === "string" ? h.replace(/<span>關閉打擊特效（[^<]*）<\/span>/, `<span>${lab}</span>`) : h;
  };
  const r = HELP.fx?.[1]?.find((x) => x[0] === "關閉打擊特效");
  if (r) {
    r[0] = "關閉打擊與技能特效";
    r[1] = "選單 → 設定 → 畫面可勾選「關閉打擊與技能特效」：關閉命中火花、命中停頓、技能施放的動畫與光效，以及這裡選的擊中特效。技能傷害照常；彈道、召喚物、持續區域、頭目的紅色預警圈與擊殺特效不受影響。";
  }
}

function v76Install() {
  if (typeof v6DrawHud !== "function") return;
  v76SkillFxInstall();
  const dh = v6DrawHud;
  v6DrawHud = function (cx, ...a) {
    const r = dh.call(this, cx, ...a);
    try {
      v76SphPips(cx);
    } catch (e) {}
    return r;
  };
}
if (typeof roV4Install === "function") {
  const r4v76 = roV4Install;
  roV4Install = function () {
    r4v76();
    v76Install();
  };
}
