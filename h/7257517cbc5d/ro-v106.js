/* 流浪仙境 v1.0.16（內部 v10.6）：頁面重新整理時保留清單的捲動位置
   撿到卡片、或撿到的裝備被自動分解時，煉金頁會重新整理來更新數量；整頁的捲動位置原本就有保留，
   但頁面裡可以捲動的清單（鑲嵌的「選擇卡片」、卡片合成、圖鑑等）會被重建而跳回最上面。
   現在重新整理前記下每個清單的位置，同一個頁面整理完再捲回去。 */

// 目前畫面代表的頁面（分頁、煉金子分頁、選取的裝備與插槽）；不同頁面不還原
const v106View = () => [ui.tab, ui.v5at, ui.v5sel, ui.v5pick].join("|");
let v106Last = null;
const V106_SKIP = ["detail", "runeScroll", "bagScroll"]; // 原本就會自己還原的區塊
function v106Sel(el) {
  const cls = String(el.className || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!cls.length || cls.some((c) => V106_SKIP.includes(c))) return null;
  return cls.map((c) => "." + CSS.escape(c)).join("");
}
function v106Install() {
  if (!ui || typeof ui.render !== "function" || typeof CSS === "undefined") return;
  const r0 = ui.render;
  ui.render = function (...a) {
    const pn = document.querySelector("#panel"),
      same = v106Last === v106View(),
      saved = [];
    if (pn && same)
      for (const el of pn.querySelectorAll("*")) {
        if (!(el.scrollTop > 0 || el.scrollLeft > 0)) continue;
        const sel = v106Sel(el);
        if (!sel) continue;
        const idx = [...pn.querySelectorAll(sel)].indexOf(el);
        if (idx >= 0) saved.push([sel, idx, el.scrollTop, el.scrollLeft]);
      }
    const r = r0.apply(this, a);
    try {
      v106Last = v106View();
      const pn2 = document.querySelector("#panel");
      if (pn2)
        for (const [sel, idx, top, left] of saved) {
          const el = pn2.querySelectorAll(sel)[idx];
          if (!el) continue;
          el.scrollTop = top;
          el.scrollLeft = left;
        }
    } catch (e) {}
    return r;
  };
}
if (typeof roV4Install === "function") {
  const r4v106 = roV4Install;
  roV4Install = function () {
    r4v106();
    v106Install();
  };
}
