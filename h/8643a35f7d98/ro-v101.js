/* 流浪仙境 v1.0.10（內部 v10.1）：神工匠的祝福掉落提示
   原本提示前面會加頭目名稱（例如「賽依連・溫德：獲得「神工匠的祝福」」），
   魔王戰（三魔王、巴風特、闇答萊屍）抓不到名稱，顯示成「頭目：獲得「神工匠的祝福」」。
   改為一律只顯示「獲得「神工匠的祝福」」（地圖頭目、魔王、MVP 武道場、活動頭目、無限武鬥場頭目關都一樣）。 */

function v101Install() {
  if (typeof MATS === "undefined" || !MATS.p2) return;
  const t0 = toast;
  toast = function (m, ...r) {
    if (typeof m === "string") {
      const got = `獲得「${MATS.p2.n}」`;
      if (m.endsWith(got) && m.includes("：")) m = got;
    }
    return t0.call(this, m, ...r);
  };
}
if (typeof roV4Install === "function") {
  const r4v101 = roV4Install;
  roV4Install = function () {
    r4v101();
    v101Install();
  };
}
