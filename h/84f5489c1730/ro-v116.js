/* 流浪仙境 v1.1.3（內部 v11.6）：完全移除神器
   神器系統在 v7.9 已停用（不再掉落、沒有效果、說明已刪），但還留有：
   1. 地圖頁「活動」卡片的掉落標籤「神器」→ 移除
   2. 舊存檔的神器資料（已取得的神器、等級、經驗、裝備中、構築 1～3 記錄的神器）→ 清除
   3. 裝著神器的舊存檔擊殺時仍會累積神器經驗、跳出升級提示 → 停止
   4. 說明（?）與更新日誌：之後出現「神器」的項目一律刪除 */

const V116_GONE = /神器/;
function v116Clean(st) {
  if (!st || typeof st !== "object") return false;
  let ch = false;
  if (st.art && (st.art.on || Object.keys(st.art.has || {}).length)) ch = true;
  st.art = { on: "", has: {} }; // 保留空的欄位，舊程式讀取時不會出錯
  for (const b of Array.isArray(st.bld) ? st.bld : [])
    if (b && typeof b === "object" && "art" in b) {
      delete b.art;
      ch = true;
    }
  return ch;
}
function v116Text() {
  if (typeof HELP !== "undefined")
    for (const [k, hv] of Object.entries(HELP)) {
      if (!Array.isArray(hv?.[1])) continue;
      if (V116_GONE.test(String(hv[0] || ""))) {
        delete HELP[k];
        continue;
      }
      hv[1] = hv[1].filter((r) => !Array.isArray(r) || !V116_GONE.test(String(r[0]) + "｜" + String(r[1])));
      if (!hv[1].length) delete HELP[k];
    }
  if (typeof CHANGELOG !== "undefined") for (const c of CHANGELOG) if (Array.isArray(c?.l)) c.l = c.l.filter((x) => !V116_GONE.test(String(x)));
}
function v116Install() {
  // 1. 活動卡片的掉落標籤
  const pm = ui.p_map;
  ui.p_map = function (...a) {
    const h = pm.apply(this, a);
    return typeof h === "string" ? h.replace(/<span class="dchip">神器<\/span>/g, "") : h;
  };
  // 2. 存檔資料：角色載入時清除
  if (typeof startGame === "function") {
    const sg = startGame;
    startGame = function (...a) {
      const r = sg.apply(this, a);
      try {
        if (v116Clean(S)) {
          recalc();
          markDirty();
        }
      } catch (e) {}
      return r;
    };
  }
  // 3. 不再累積神器經驗、不再獲得神器
  if (typeof artXp === "function") artXp = () => {};
  if (typeof artGain === "function") artGain = () => {};
  if (typeof SS !== "undefined") SS.art = 0;
  // 4. 說明與更新日誌（安裝時、遊戲載入後各清一次，開啟更新日誌時再清一次）
  v116Text();
  if (typeof setTimeout === "function") setTimeout(v116Text, 3000);
  if (typeof ui.m_log === "function") {
    const ml = ui.m_log;
    ui.m_log = function (...a) {
      v116Text();
      return ml.apply(this, a);
    };
  }
}
if (typeof roV4Install === "function") {
  const r4v116 = roV4Install;
  roV4Install = function () {
    r4v116();
    v116Install();
  };
}
