/* 流浪仙境 v1.0.20（內部 v11.0）：魔王・獨特「闇答萊屍的冥王之冠」換新圖示、邊框改白金色
   1. 圖示：原本錯用一般頭盔（巨角山羊頭盔）的圖，改為本遊戲原創的暗金王冠（紫寶石、紫色光暈），24×24
   2. 邊框：背包、倉庫、裝備欄的格子與裝備詳情、煉金清單的圖示框改為白金色，光暈加強，和其他獨特裝備區分 */

const V110 = {
  col: "#fff1bf", // 白金色邊框
  glow: "#ffe39a",
  icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAJ3RFWHRUaXRsZQBVbmRlcndvcmxkIEtpbmcncyBDcm93biAvIHYxLjAuMjDe7uxLAAAAoXRFWHREZXNjcmlwdGlvbgBPcmlnaW5hbCBhcnR3b3JrOiBvcmlnaW5hbCBJbWFnZUdlbiBjb25jZXB0LCBpbmRlcGVuZGVudGx5IGF1dGhvcmVkIDI0cHggc2lsaG91ZXR0ZXMgYW5kIGNvbG9yIGNsdXN0ZXJzIGluIFBpbGxvdy4gTm8gZG93bmxvYWRlZCBvciB0cmFjZWQgZ2FtZSBpdGVtLpcYvl0AAAJvSURBVHjazVYxaBNhFP5yBImZaogkNwTaRekNpxkcUpKxpYWmOGUQCl2SI6kdDeUmESzB1ZJyl8Whdshi0Vgko1dSIUPNUWJdWrXgRQxtdWhLCdSh+X/+XP5LmkH0LXf/f+99733/e/97B/xPsq5exNfVi/ggNq4BwFPs+v6SS7+KndAvYvap6mFN1cMa79vADGwRWwBEYSiiLT47w1JqWyF7/RgJvSIn0RKgeGqRVRNZHScmAg+YjYyIqoe1rx9eIJf1sI67HNodCbYjEcnRqHpY21gddgKjTucS5yyLDgzqgHMkjrL75XfHeiIW6nLKYgp/++4IPNo8xY3VYZhmoycYz1bgARExzQamYyfUUJaDSMzccgSbjp1crUxZ44wiUcNk2o9k2k+DWHseQNk4oDYPEiNdWG6eg1zWQ9/zWh3RiA8A8PJtAeWn3wHMI5f1UPC5xDkmYiGsFfcBeHszOD46hSwHO/ZkOYhk2o+9MigTVqdptQAAPAYue2uofLqtZRQJjd1X8AQmAQBDN65Df/IYM4k7eF2sQRq5iejsPI6PTnH24x08gUl8O/iFza1DjI1+VtjW4bb3m5LhxfZHP+6JNVStEMJ33yOjSKhay0DxIfZ+GqhaNURngUdqiNHbR8nwYmyUYjkneXyqgqq1TMHzWh2FlSb9XlhpIq/VsZDeoXp+kZtOfpKbVgsL6R0APuS1OjKKBACXLNoSjfiwuXWI8akKAHc7D9d6t2u2D5G6JhXEJtU0G7RlNK0WSsZl5bTbeEfrdjnNAftFsl8iAkqEB+44cOzjkeeQAPYbo65+49JpPjCVR8Df/JM/kT/dTh1bRUq3mAAAAABJRU5ErkJggg==",
};
function v110Install() {
  if (typeof UNIQUE === "undefined" || !UNIQUE.v70_crown) return;
  // 1. 圖示
  if (V110.icon && typeof RO !== "undefined" && RO.assets) {
    RO.assets.items ||= {};
    RO.assets.items.v110_crown = { file: "items/v110_crown.png", dataUrl: V110.icon, width: 24, height: 24 };
    if (typeof roItemFiles !== "undefined") roItemFiles.u_v70_crown = "v110_crown";
    UNIQUE.v70_crown.ico = "v110_crown";
  }
  // 2. 邊框：格子沿用 v91mon（流光），只換顏色；詳情與煉金清單的圖示加上 class
  const isC = (t) => !!(t && t.uq === "v70_crown");
  const ih = ui.itemHead;
  ui.itemHead = function (t, ...a) {
    const h = ih.call(this, t, ...a);
    return isC(t) && typeof h === "string" ? h.replace("<img ", '<img class="v110ic" ') : h;
  };
  if (typeof v5GearRow === "function") {
    const gr = v5GearRow;
    v5GearRow = function (it, ...a) {
      const h = gr.call(this, it, ...a);
      return isC(it) && typeof h === "string" ? h.replace('class="v5ic"', 'class="v5ic v110ic"') : h;
    };
  }
  if (typeof document !== "undefined" && !document.getElementById("v110css")) {
    const st = document.createElement("style");
    st.id = "v110css";
    st.textContent = `
.cell.ro-item-slot.v91mon{--ro-rarity:${V110.col}!important;border-color:${V110.col}!important;animation:v110mon 2.4s ease-in-out infinite!important}
@keyframes v110mon{0%,100%{box-shadow:inset 0 0 0 1px #fff,0 0 0 1px #c9a24a,0 0 6px 2px ${V110.glow}b0}50%{box-shadow:inset 0 0 0 1px #fff,0 0 0 1px #e8c56a,0 0 13px 5px ${V110.glow}f0}}
.v110ic{border-color:${V110.col}!important;box-shadow:0 0 0 1px #c9a24a,0 0 6px 2px ${V110.glow}cc}
@media (prefers-reduced-motion:reduce){.cell.ro-item-slot.v91mon{animation:none!important;box-shadow:inset 0 0 0 1px #fff,0 0 0 1px #c9a24a,0 0 8px 3px ${V110.glow}d0}}`;
    document.head.appendChild(st);
  }
}
if (typeof roV4Install === "function") {
  const r4v110 = roV4Install;
  roV4Install = function () {
    r4v110();
    v110Install();
  };
}
