/* 流浪仙境 v1.1.6（內部 v11.9）：變異寶石漸層外框修正
   1. 「合成變異寶石」（3 顆同名寶石＋1000 Zeny）做出的寶石只有形狀變異、沒有數值變異，
      名字一樣是「（變異）」，但外框原本只看數值變異而顯示原色 → 也套用變異漸層（金→橘→紅）
   2. 排行榜快照裡的寶石沒有編號，漸層全部共用第一顆的設定（多重變異可能變成金紅色、大小不對）
      → 每顆寶石每次重畫都用新的漸層名稱 */

const V119 = {
  n: 0,
  mu: ["#ffc23a", "#f0801e", "#d8262c"], // 變異（含形狀變異）：金→橘→紅
  multi: ["#ff3b3b", "#ff9f1a", "#ffe03a", "#3ccf5a", "#2f8fff", "#9a4dff"], // 多重變異：彩虹
};
function v119Overlay(base, gem, sel, ...x) {
  const h = base.call(this, gem, sel, ...x);
  if (!gem || sel || gem.sx || !(gem.mu || gem.sh) || typeof h !== "string") return h;
  const act = !!SKILLS[gem.id]?.act,
    // v91 的彩色外框：數值變異是橘金；只有形狀變異時是原本的主動藍／輔助紫
    edge = `fill="${gem.mu ? V91.col.mu.edge : (act ? V91.col.act : V91.col.sup).edge}"`;
  if (!h.includes(edge)) return h;
  const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(h);
  if (!m) return h;
  const multi = !!gem.mu?.multi,
    C = multi ? V119.multi : V119.mu,
    id = `v119g${++V119.n}`, // 每次畫都用新的名字：重畫時不會指到已移除的舊漸層
    stops = C.map((c, i) => `<stop offset="${(i / (C.length - 1)).toFixed(3)}" stop-color="${c}"/>`).join(""),
    defs = `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${m[1]}" y2="${m[2]}">${stops}</linearGradient></defs>`;
  return h.replace(/(<svg[^>]*>)/, "$1" + defs).split(edge).join(`fill="url(#${id})"`);
}
function v119Install() {
  if (typeof v91Overlay !== "function" || typeof V91 === "undefined" || typeof gemOverlay !== "function") return;
  // 取代 v1.1.5 的漸層（直接包 v1.0 的技能盤外框）
  gemOverlay = function (gem, sel, ...x) {
    return v119Overlay.call(this, v91Overlay, gem, sel, ...x);
  };
}
if (typeof roV4Install === "function") {
  const r4v119 = roV4Install;
  roV4Install = function () {
    r4v119();
    v119Install();
  };
}
