/* 流浪仙境 v7.5：網址版自動更新檢查改為每 10 分鐘只查 2 個檔案、背景分頁不檢查（節省 Netlify 的請求點數） */

// 原本每個開著遊戲的分頁每 2 分鐘向網站送出約 40 個請求（逐一比對每個 JS／CSS 的 ETag），一小時約 1,200 次，
// 佔網站請求量的一半以上。改為：
//   ・只比對 index.html（新增或移除腳本時會變）與 ro-content.js（每次改版都會更新更新日誌）
//   ・每 10 分鐘一次；分頁在背景時不檢查，切回分頁時才檢查（兩次檢查至少間隔 1 分鐘）
// 每個分頁每小時約 12 個請求。偵測到新版後的倒數、戰鬥中延後、存檔重整都維持原本的做法。
const V75_UPD = { every: 600, gap: 60, files: ["index.html", "ro-content.js"] };
const v75Upd = { last: 0 };
function v75UpdInstall() {
  if (typeof V64_UPD !== "undefined") V64_UPD.every = V75_UPD.every;
  if (typeof v63UpdFiles === "function")
    v63UpdFiles = function () {
      const dir = location.pathname.replace(/[^/]*$/, "");
      return V75_UPD.files.map((f) => dir + f);
    };
  if (typeof v63UpdCheck === "function") {
    const ck = v63UpdCheck;
    v63UpdCheck = function (...a) {
      if (typeof document !== "undefined" && document.hidden) return;
      const now = Date.now();
      if (now - v75Upd.last < V75_UPD.gap * 1000) return;
      v75Upd.last = now;
      return ck.apply(this, a);
    };
  }
}
v75UpdInstall();
