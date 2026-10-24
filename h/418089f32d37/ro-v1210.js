/* 流浪仙境 v1.2.10：綁定 Google 前確認「本機角色不會帶到雲端」（v1.2.26 起可以在綁定頁把本機角色帶到雲端，文字改為說明這件事）
   v1.2.3 起，登入 Google 後改用這個帳號的雲端角色，本機角色（包含「匯入檔案」匯入的存檔）不會上傳；
   帳號還沒有雲端角色時要建立新角色。原本只在登入畫面以小字說明，容易誤以為綁定失敗、帳號變空。
   這台裝置有本機角色時，按「用 Google 登入」會先跳出確認視窗，列出本機角色，確認後才開啟 Google 登入。 */

const V1210 = { ok: 0 };

function v1210Local() {
  try {
    return (rosterGet().list || []).filter((c) => c && c.id);
  } catch (e) {
    return [];
  }
}

function v1210Install() {
  if ((typeof V126 !== "undefined" && V126.on) || typeof v98Act !== "function" || typeof v98Go !== "function") return;
  const act = v98Act;
  v98Act = function (k, ...x) {
    if (k === "go" && !V1210.ok) {
      const list = v1210Local();
      if (list.length) {
        const nm = (c) => `${esc(c.name || "冒險者")} Lv.${Math.floor(+c.lvl) || 1}`,
          names = list.slice(0, 6).map(nm).join("、") + (list.length > 6 ? ` 等 ${list.length} 個` : "");
        const h = v98Card(
          "登入後改用雲端角色",
          [
            `這台裝置有 ${list.length} 個本機角色：${names}`,
            "登入後改用這個帳號的雲端角色；本機角色（包含「匯入檔案」匯入的存檔）不會自動上傳",
            "登入後可以在「選單 → 綁定」把本機角色帶到雲端（每個帳號每 7 天 1 次）",
            "本機角色仍保留在這台裝置，登出 Google 後可以回來繼續玩",
          ],
          "我了解，繼續登入",
          "goOk",
          "in",
        )
          .replace(/<div class="row">(?![\s\S]*<div class="row">)/, '<p class="note" id="v98Err" style="margin:0;color:var(--bad)" hidden></p><div class="row">')
          .replace('class="btn danger" data-v98="goOk"', 'class="btn primary" data-v98="goOk"')
          .replace('<div class="cfl">', '<div class="cfl v1210">');
        if (!document.getElementById("v1210css")) {
          const st = document.createElement("style");
          st.id = "v1210css";
          st.textContent = ".cfl.v1210>div{white-space:normal;line-height:1.5}";
          document.head.appendChild(st);
        }
        return bkSheet(h);
      }
    }
    if (k === "goOk") {
      V1210.ok = 1;
      return v98Go(); // 在這次點擊中直接開啟 Google 登入視窗（避免被瀏覽器擋下）
    }
    return act.call(this, k, ...x);
  };
}

if (typeof roV4Install === "function") {
  const r4v1210 = roV4Install;
  roV4Install = function () {
    r4v1210.apply(this, arguments);
    try {
      v1210Install();
    } catch (e) {
      console.error("v1210", e);
    }
  };
}
