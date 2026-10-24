/* 流浪仙境 v1.2.27：介面修正
   ・天氣提示一律放在上方狀態列下方（戰鬥畫面右上角），不再壓到狀態列裡的技能、增益圖示（原本桌機大小時放在狀態列右下角）
   ・無限武鬥場「起始層」選單固定寬度，不再被旁邊的按鈕擠到切字；放不下一行時自動換行 */

function v1227Install() {
  if (typeof v125Place === "function") {
    v125Place = function (el) {
      const cvs = document.getElementById("stage"),
        wrap = document.getElementById("stageWrap");
      if (!cvs || !wrap || !cvs.getBoundingClientRect) return;
      const r = cvs.getBoundingClientRect(),
        w = wrap.getBoundingClientRect();
      if (!r.height) return;
      const band = (G.top || 30) * (r.height / (G.VH || G.H)),
        top = Math.round(r.top - w.top + band + 4) + "px",
        right = Math.round(w.right - r.right + 8) + "px";
      if (el.style.top !== top) el.style.top = top;
      if (el.style.right !== right) el.style.right = right;
    };
  }
  if (typeof document !== "undefined" && !document.getElementById("v1227css")) {
    const st = document.createElement("style");
    st.id = "v1227css";
    st.textContent = `select.sel[data-v63af]{flex:0 0 auto!important;width:auto!important;min-width:6.4em!important;padding-right:14px!important}
.ro-arena-card .row:has(select[data-v63af]){flex-wrap:wrap;row-gap:4px}`;
    document.head.appendChild(st);
  }
}

if (typeof roV4Install === "function") {
  const r4v1227 = roV4Install;
  roV4Install = function () {
    r4v1227.apply(this, arguments);
    try {
      v1227Install();
    } catch (e) {
      console.error("v1227", e);
    }
  };
}
