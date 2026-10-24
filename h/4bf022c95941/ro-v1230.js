/* 流浪仙境 v1.2.30：城鎮為安全地圖、可以從城鎮開始組隊副本
   ・城鎮（普隆德拉、斐揚、吉芬、朱諾）明確設為安全地圖：不會出現怪物（萬一其他系統生出怪物、敵方投射物或地面預警會直接清掉）、
     不會受到傷害；自動挑戰（頭目、MVP 門票）本來就不會在城鎮觸發
   ・修正：城鎮是用「場地」做的，組隊副本把「在城鎮裡」當成「挑戰中」，按鈕顯示「請先結束目前的挑戰」。現在可以在城鎮直接開始，
     挑戰結束後回到原本的城鎮 */

const v1230Town = () => typeof v113In === "function" && v113In() && !(typeof V1213 !== "undefined" && V1213.run);

function v1230Install() {
  // 組隊副本：城鎮不算挑戰中（結束後還原成進場前的畫面，也就是原本的城鎮）
  if (typeof v1213CanStart === "function") {
    const cs = v1213CanStart;
    v1213CanStart = function (...a) {
      if (!v1230Town()) return cs.apply(this, a);
      const ar = G.arena;
      G.arena = null;
      try {
        return cs.apply(this, a);
      } finally {
        G.arena = ar;
      }
    };
  }
  // 安全地圖：不會受到傷害
  if (typeof damagePlayer === "function") {
    const dp = damagePlayer;
    damagePlayer = function (...a) {
      if (v1230Town()) return 0;
      return dp.apply(this, a);
    };
  }
  // 安全地圖：清掉怪物、敵方投射物與地面預警（每格檢查）
  if (typeof V1213B !== "undefined" && Array.isArray(V1213B.post))
    V1213B.post.push(() => {
      if (!v1230Town() || !G) return;
      if (G.mobs && G.mobs.length) G.mobs.length = 0;
      if (G.boss) G.boss = null;
      if (G.proj && G.proj.some((p) => p && p.enemy)) G.proj = G.proj.filter((p) => !(p && p.enemy));
      if (G.haz && G.haz.length) G.haz.length = 0;
    });
  // 說明
  const rows = HELP.v113 && HELP.v113[1];
  if (Array.isArray(rows)) {
    const r = rows.find((x) => x[0] === "城鎮");
    if (r && !/安全地圖/.test(r[1])) r[1] = String(r[1]).replace("城鎮不出怪、沒有頭目", "城鎮是安全地圖：不出怪、沒有頭目、不會受到傷害，也不會自動挑戰頭目或 MVP").replace("戰鬥中（頭目、試煉、魔王、塔）不能前往。", "戰鬥中（頭目、試煉、魔王、塔）不能前往；在城鎮裡可以直接開始無限武鬥場、MVP 武道場與組隊副本（組隊副本結束後回到原本的城鎮）。");
  }
}

if (typeof roV4Install === "function") {
  const r4v1230 = roV4Install;
  roV4Install = function () {
    r4v1230.apply(this, arguments);
    try {
      v1230Install();
    } catch (e) {
      console.error("v1230", e);
    }
  };
}
