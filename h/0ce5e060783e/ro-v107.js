/* 流浪仙境 v1.0.17（內部 v10.7）：選單新增「LINE群」（Discord 後面），開啟 LINE 社群邀請連結
   圖示為本遊戲自繪的綠色對話泡泡（24×24），不使用 LINE 商標 */

const V107 = {
  line: "https://line.me/ti/g2/XSY7WdF9AXgqKmcIydvSW-ZI6IkBa8Yj3hfstA?utm_source=invitation&utm_medium=link_copy&utm_campaign=default",
  icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAA4UlEQVR4nGNgGOqAEZugUIDGf3IMe7fhBoZ5LNgM9+2JIMd8hs0MK/6jW8JELcMZGBgYfHsiMHwPtw3Z8Hg5X7iChY82k2zR5pIV8OBixGY4OYbisoSJsFLKADyS7755wsDAwMBQ92Y6VS3A64PD5rMZDpvPJppPsgXUABj5ABmI5lswMDAwMGhE6RLFJ9kCdI2E+HgtePPoDUHF5AAmBgZIGfJq2Q2qGfpq2Q14RoNHMrUsQTYcxQJqWIJuOAMDgUhG10wIEFVcE+syYgFeC2CuJtdwvBZQ4mqCgNwqc3gCAGgLbqir3RgrAAAAAElFTkSuQmCC",
};
function v107Install() {
  if (typeof MENU === "undefined") return;
  if (typeof RO !== "undefined" && RO.assets) {
    RO.assets.items ||= {};
    RO.assets.items.v107_line = { file: "items/v107_line.png", dataUrl: V107.icon, width: 24, height: 24 };
  }
  if (typeof roItemFiles !== "undefined") roItemFiles.mnLine = "v107_line";
  if (!MENU.some((m) => m[0] === "line")) {
    const i = MENU.findIndex((m) => m[0] === "dc");
    MENU.splice(i >= 0 ? i + 1 : MENU.length, 0, ["line", "LINE群", "mnLine", V107.line]);
  }
}
if (typeof roV4Install === "function") {
  const r4v107 = roV4Install;
  roV4Install = function () {
    r4v107();
    v107Install();
  };
}
