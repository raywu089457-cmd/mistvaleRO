/* 流浪仙境 v8.7：後期頭目卡片掉落——Lv78 以後 4 張新地圖的頭目與所有深淵頭目，額外 3% 掉落「隨機傳說卡片」
   （原本 4 張新地圖頭目固定掉自己的專屬卡，重複刷同一隻時一直拿到同一張）；4 張頭目卡片改為加入一般傳說卡池 */

// ---------------------------------------------------------------------------
// 1. 頭目卡片（死靈之王、維斯伯、迪塔勒泰晗勒斯、賽依連・溫德）加入一般傳說卡池：
//    一般掉落、卡片合成、武鬥場、魔王等的傳說卡都可能出現；不再由固定頭目專屬掉落
const V87 = { p: 0.03, from: 11 };
if (typeof V56_BOSS_CARD !== "undefined" && typeof V5_CARD !== "undefined") {
  for (const id of Object.values(V56_BOSS_CARD)) if (V5_CARD[id]) delete V5_CARD[id].ex;
  for (const k of Object.keys(V56_BOSS_CARD)) delete V56_BOSS_CARD[k];
}
if (typeof V5_TIER_SRC !== "undefined")
  V5_TIER_SRC[5] = "守護者、巴風特、無盡之塔、武鬥場、魔王、活動神；深淵頭目與 Lv78 以後 4 張新地圖的頭目另有 3% 掉落隨機傳說卡片";

// ---------------------------------------------------------------------------
// 2. 掉落：新地圖頭目（尼芙菲姆、朱諾・魔大陸、深淵之湖、生體研究所）與深淵中的每張地圖頭目
//    擊敗時 3% 掉落一張隨機傳說卡片（套用與一般卡片掉落相同的深淵加成：每階 +50%）；原本 1% 的頭目卡片掉落不變
function v87BossCard(m) {
  if (!m || !m.boss || m.dm || m.add || m.v64 || !S || G.trn || G.tw || G.arena || G.trial != null || G.guard != null || m.god != null) return;
  if (typeof ssMap === "function" && ssMap()) return;
  const aby = typeof v56AbyActive === "function" && v56AbyActive();
  if (!aby && !(S.map >= V87.from && S.map < MAP_N)) return;
  const mul = V5.dropMul * (aby ? 1 + V56_ABY.card * v56AbyTier() : 1);
  if (RAND() >= V87.p * mul) return;
  const pool = V5_CARDS.filter((c) => c.t === 5 && !c.ex);
  if (pool.length) v5Drop(m, pool[Math.floor(RAND() * pool.length)].id);
}
function v87Install() {
  if (typeof v5OnKill !== "function" || typeof V5_CARDS === "undefined") return;
  const ok = v5OnKill;
  v5OnKill = function (m, ...a) {
    const r = ok.call(this, m, ...a);
    try {
      v87BossCard(m);
    } catch (e) {}
    return r;
  };
}
if (typeof roV4Install === "function") {
  const r4v87 = roV4Install;
  roV4Install = function () {
    r4v87();
    v87Install();
  };
}
