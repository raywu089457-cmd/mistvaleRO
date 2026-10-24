/* 流浪仙境 v1.0.7（內部 v9.7）：藍色魔力礦石（合成卡片用量最大）取得量提高
   1. 一般礦石中藍礦的比重提高：藍礦掉率 ×2.5（頭目 4% → 10%、菁英 0.3% → 0.75%、一般怪 0.025% → 0.0625%）
   2. 全圖怪物另外掉落藍礦：一般怪 0.15%、菁英 1.5%、頭目 15%（解鎖煉金後）
   3. 魔王（獸人英雄、伊夫利特、冰暴騎士、巴風特、闇答萊屍）擊敗時 50% 機率掉落 1 顆高純度藍色魔力礦石 */

const V97 = {
  // 1. 原本（v6.4 起 ×1/10 後）頭目 4%、菁英 0.3%、一般怪 0.025%；再加一次 1.5 倍的機率 → 合計 ×2.5
  more: { boss: 0.06, elite: 0.0045, mob: 0.000375 },
  // 2. 全圖怪物另外掉落
  all: { boss: 0.15, elite: 0.015, mob: 0.0015 },
  // 3. 魔王：高純度藍色魔力礦石
  gd: { p: 0.5, n: 1 },
};

function v97OreInstall() {
  if (typeof rollMats !== "function") return;
  const rm = rollMats;
  rollMats = function (L, boss, elite, ...x) {
    const out = rm.call(this, L, boss, elite, ...x);
    if (!S?.alchOn) return out;
    const k = boss ? "boss" : elite ? "elite" : "mob";
    if (RAND() < V97.more[k]) out.push("b1");
    if (RAND() < V97.all[k]) out.push("b1");
    return out;
  };
}

// 魔王的高純度藍礦（魔王戰的掉落原本會被 v6.7 減為 1/3，這裡標記為不受影響）
function v97GuardInstall() {
  if (typeof guardWin !== "function" || !MATS.b2) return;
  const gw = guardWin;
  guardWin = function (m, ...x) {
    const g = G?.guard,
      src = m && m.x != null ? m : G?.pl;
    const r = gw.call(this, m, ...x);
    if (g != null && src && RAND() < V97.gd.p)
      for (let i = 0; i < V97.gd.n; i++) dropLoot(src, { mat: "b2", col: MAT_COL[MATS.b2.f], tier: Math.min(3, MATS.b2.l), v67keep: 1 });
    return r;
  };
}

function v97TextInstall() {
  const pct = (v) => +(v * 100).toFixed(4) + "%";
  const a = V97.all,
    allTxt = `全圖怪物另外掉落（一般怪 ${pct(a.mob)}、菁英 ${pct(a.elite)}、頭目 ${pct(a.boss)}）`;
  if (typeof V64_MAT_USE !== "undefined") {
    V64_MAT_USE.b1 = `合成普通～稀有卡片，數量＝階級平方（1／4／9 顆）；怪物掉落，三色中最多；${allTxt}`;
    V64_MAT_USE.b2 = "合成史詩～傳說卡片，數量＝階級平方（16／25 顆）；魔王（三魔王、巴風特、闇答萊屍）50% 掉落 1 顆；Lv70 以上地圖頭目、無限武鬥場頭目關、MVP 武道場掉落";
  }
  if (typeof HELP === "undefined") return;
  const rows = (k) => (Array.isArray(HELP[k]?.[1]) ? HELP[k][1] : []);
  const add = (k, n, s) => {
    const r = rows(k).find((r) => Array.isArray(r) && r[0] === n);
    if (r && typeof r[1] === "string" && !r[1].includes("高純度藍色魔力礦石")) r[1] += (/[。）]$/.test(r[1]) ? "" : "；") + s;
  };
  const m = rows("v5mat").find((r) => Array.isArray(r) && r[0] === "魔力礦石");
  if (m && !m[1].includes("全圖怪物"))
    m[1] = m[1].replace("一般礦石由怪物少量掉落（頭目較多）", `一般礦石由怪物少量掉落（頭目較多），藍色最多，另有${allTxt}`).replace("高純度由", "高純度由魔王（藍色，50% 掉落 1 顆）、");
  const gdTxt = "另外 50% 機率掉落 1 顆高純度藍色魔力礦石";
  add("guard", "獎勵", gdTxt + "（不受 1/3 影響）。");
  add("guard", "終焉獎勵", gdTxt + "。");
  add("guard", "闇答萊屍", gdTxt + "。");
  add("monarch", "召喚", gdTxt + "。");
}

function v97Install() {
  v97OreInstall();
  v97GuardInstall();
  v97TextInstall();
}
if (typeof roV4Install === "function") {
  const r4v97 = roV4Install;
  roV4Install = function () {
    r4v97();
    v97Install();
  };
}
