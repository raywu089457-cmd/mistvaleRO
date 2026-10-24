/* 流浪仙境 v1.2.8
   ① 錯誤提示（index.html）：瀏覽器擴充功能（chrome-extension:// 等）自己的錯誤不再顯示；相同的錯誤只顯示一次；右上角 ✕ 可關閉
   ② 雲端角色的技能寶石合成檢查（伺服器 netlify/functions/cloud.mjs）：
      合成變異寶石要用掉 3 顆同技能的變異寶石，伺服器比對每次上傳，憑空多出的合成寶石會被拒收並排除在線上排行之外。
      這裡讓遊戲在取得新的變異寶石後盡快上傳一次（至少間隔 16 秒），伺服器才看得到「合成前」的寶石，
      避免剛掉落就拿去合成的寶石被算成對不上。 */

const V128 = { gap: 16e3, every: 2e3, sent: null };

// 目前角色身上的變異寶石（有形狀變化、有變異資料）
function v128Fp() {
  const s = new Set();
  for (const g of S && Array.isArray(S.gems) ? S.gems : [])
    if (g && g.mu && Array.isArray(g.sh)) s.add(g.id + JSON.stringify(g.sh) + JSON.stringify(g.mu));
  return s;
}

function v128Install() {
  if (typeof V126 === "undefined" || !V126.on || typeof v126Upload !== "function") return;
  const up = v126Upload;
  v126Upload = async function (...a) {
    const fp = v128Fp(),
      ok = await up.apply(this, a);
    if (ok) V128.sent = fp;
    return ok;
  };
  if (typeof v98Upload === "function" && v98Upload === up) v98Upload = v126Upload;
  setInterval(() => {
    try {
      if (!S || !V126.bootOk || V126.up || V126.paused || TAB.gone) return;
      const fp = v128Fp(),
        sent = V128.sent || new Set();
      let fresh = false;
      for (const k of fp)
        if (!sent.has(k)) {
          fresh = true;
          break;
        }
      if (!fresh || Date.now() - (V98C.up || 0) < V128.gap) return;
      v126Upload();
    } catch (e) {}
  }, V128.every);
}

if (typeof roV4Install === "function") {
  const r4v128 = roV4Install;
  roV4Install = function () {
    r4v128.apply(this, arguments);
    try {
      v128Install();
    } catch (e) {
      console.error("v128", e);
    }
  };
}
