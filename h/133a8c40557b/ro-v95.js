/* 流浪仙境 v1.0.5（內部 v9.5）：卡片圖鑑的紅點只在第一次拿到某張卡時亮起
   原本撿到卡片一律亮紅點（重複的卡也亮）；現在撿到、合成、MVP／活動等任何途徑，只有新蒐藏才亮 */

function v95CardDotInstall() {
  if (typeof v5GainCard !== "function" || typeof ui === "undefined") return;
  const md = ui.menuDot;
  const dot = () => md.call(ui, "cards", 1);
  // 任何途徑第一次拿到某張卡 → 亮紅點
  const gc = v5GainCard;
  v5GainCard = function (...a) {
    const first = gc.apply(this, a);
    if (first) dot();
    return first;
  };
  // 撿到卡片時原本一律亮紅點：拿掉這次無條件的紅點（新卡已由上面處理）
  const pk = pickup;
  pickup = function (d, ...x) {
    if (!d || !d.cd) return pk.call(this, d, ...x);
    const cur = ui.menuDot;
    ui.menuDot = function (t, v, ...y) {
      if (t === "cards" && v) return;
      return cur.call(this, t, v, ...y);
    };
    try {
      return pk.call(this, d, ...x);
    } finally {
      ui.menuDot = cur;
    }
  };
}

function v95Install() {
  v95CardDotInstall();
}
if (typeof roV4Install === "function") {
  const r4v95 = roV4Install;
  roV4Install = function () {
    r4v95();
    v95Install();
  };
}
