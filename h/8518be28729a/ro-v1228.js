/* 流浪仙境 v1.2.28：羈絆之戒外觀與插槽
   ・圖示改為 RO 原版「結婚戒指」（2634，銀戒鑲藍鑽）；原本錯用髮夾（2607）的圖
   ・稀有度標示「獨特」改為「獨特・組隊」，名稱與標示的樣式和魔王・獨特相同
   ・邊框和魔王・獨特（闇答萊屍的冥王之冠）相同：白金色流光邊框（背包、倉庫、裝備欄、裝備詳情、煉金清單）
   ・插槽 3～6 孔（越多孔越稀有：3 孔約 58%、4 孔 29%、5 孔 10%、6 孔 4%，比照其他裝備的加孔機率），插槽上限 6；
     已經拿到但不到 3 孔的羈絆之戒補到 3～6 孔，原本插好的卡片保留 */

const V1228 = { uq: "v1213_bond", ico: 2634, min: 3, max: 6 };
// RO 原版圖示：登錄後才會在開場預先載入
(() => {
  const A = typeof window !== "undefined" && window.RO_ASSETS;
  if (!A) return;
  A.items ||= {};
  A.items[V1228.ico] ||= { file: `items/${V1228.ico}.png`, width: 24, height: 24 };
})();
const v1228Is = (t) => !!(t && t.uq === V1228.uq);
// 插槽：3～6（3 ＋ 0～3，機率比照其他裝備的加孔）
function v1228Slots(it) {
  if (!v1228Is(it) || !it.v5) return false;
  const have = Array.isArray(it.cards) ? it.cards : [],
    used = have.filter(Boolean).length;
  if ((it.cs || 0) >= V1228.min && have.length >= (it.cs || 0)) return false;
  let cs = V1228.min + (typeof v5RollSlots === "function" ? v5RollSlots(V1228.max - V1228.min) : 0);
  cs = Math.max(cs, used, it.cs || 0);
  cs = Math.min(V1228.max, Math.max(V1228.min, cs));
  it.cs = cs;
  it.cards = have.filter(Boolean).concat(Array(Math.max(0, cs - used)).fill(null)).slice(0, cs);
  try {
    v5Name(it);
  } catch (e) {}
  return true;
}
function v1228FixAll() {
  if (typeof S === "undefined" || !S) return 0;
  let n = 0;
  for (const s of SLOTS) if (v1228Slots(S.equip?.[s])) n++;
  for (const it of S.bag || []) if (v1228Slots(it)) n++;
  try {
    const st = STH || stLoad();
    let k = 0;
    for (const x of st.it || []) if (x && x.o && v1228Slots(x.o)) k++;
    if (k) stWrite(st);
    n += k;
  } catch (e) {}
  if (n) {
    try {
      markDirty();
    } catch (e) {}
  }
  return n;
}

function v1228Install() {
  if (typeof UNIQUE === "undefined" || !UNIQUE[V1228.uq]) return;
  // 1. 圖示
  UNIQUE[V1228.uq].ico = V1228.ico;
  if (typeof roItemFiles !== "undefined") roItemFiles["u_" + V1228.uq] = V1228.ico;
  // 2. 插槽上限 6；新掉落 3～6 孔
  const cap = v5SlotCap;
  v5SlotCap = function (it, ...a) {
    return v1228Is(it) ? V1228.max : cap.call(this, it, ...a);
  };
  if (typeof v1213Ring === "function") {
    const rg = v1213Ring;
    v1213Ring = function (...a) {
      const it = rg.apply(this, a);
      if (it && it.v5) {
        it.cs = 0;
        it.cards = [];
        v1228Slots(it);
      }
      return it;
    };
  }
  // 已經拿到的戒指：進入角色時補到 3～6 孔
  if (typeof startGame === "function") {
    const sg = startGame;
    startGame = function (...a) {
      const r = sg.apply(this, a);
      try {
        const n = v1228FixAll();
        if (n) later(1.6, () => toast(`羈絆之戒插槽改版：${n} 枚羈絆之戒的插槽補到 3～6 孔（原本的卡片保留）`, "lvl", 1));
      } catch (e) {}
      return r;
    };
  }
  // 3. 稀有度標示「獨特・組隊」、名稱樣式與邊框比照魔王・獨特
  const ih = ui.itemHead;
  ui.itemHead = function (t, ...a) {
    let h = ih.call(this, t, ...a);
    if (v1228Is(t) && typeof h === "string")
      h = h
        .replace(/<br>獨特[^<・]*(・[^<]*)?/, '<br><span class="v70mon">獨特・組隊</span>')
        .replace(/class="iname ([^"]*)"/, 'class="iname $1 v70mon"')
        .replace(/<img (?![^>]*v110ic)/, '<img class="v110ic" ');
    return h;
  };
  const ch = cellHtml;
  cellHtml = function (item, ...a) {
    const h = ch.call(this, item, ...a);
    if (!v1228Is(item) || typeof h !== "string") return h;
    const h2 = h.replace(/獨特(・[^"<]*)?/, "獨特・組隊").replace('class="cell ', 'class="cell v91mon '),
      i = h2.lastIndexOf("</button>");
    return i < 0 || h2.includes("v91shine") ? h2 : h2.slice(0, i) + '<span class="v91shine"></span>' + h2.slice(i);
  };
  if (typeof v5GearRow === "function") {
    const gr = v5GearRow;
    v5GearRow = function (it, ...a) {
      const h = gr.call(this, it, ...a);
      return v1228Is(it) && typeof h === "string" ? h.replace('class="v5ic"', 'class="v5ic v110ic"') : h;
    };
  }
  // 說明
  const rows = HELP.v1213 && HELP.v1213[1];
  if (Array.isArray(rows))
    for (const r of rows) if (r[0] === "羈絆之戒" && !/插槽/.test(r[1])) r[1] = String(r[1]).replace(/^飾品。/, "獨特・組隊的戒指，插槽 3～6 孔。");
}

if (typeof roV4Install === "function") {
  const r4v1228 = roV4Install;
  roV4Install = function () {
    r4v1228.apply(this, arguments);
    try {
      v1228Install();
    } catch (e) {
      console.error("v1228", e);
    }
  };
}
