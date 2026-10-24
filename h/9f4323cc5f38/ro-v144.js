/* 流浪仙境 v1.4.4
   1. 城鎮中可以退點、改選天賦、重置職業：v1.4.3 判斷「挑戰中」時把所有特殊場地都算進去，城鎮也被擋下。
      頭目戰、武鬥場、試煉、守護者、組隊副本、陣亡時照舊禁止。
   2. 自動更新不再沒收離線收益：雲端角色在重新整理前，先把最新進度上傳到雲端
      （伺服器同一帳號 15 秒內只收一次，不到 15 秒就等到滿再傳）。開啟時的同步遇到「上傳太頻繁」改為等待後重試（ro-v1232.js）。
   3. 雲端檢查：成長速度、技能寶石不通過時照常保存（伺服器回 {t, flag}），提示玩家這個帳號已排除在線上排行之外；
      管理員的封鎖名單顯示雲端檢查的原因與數值。 */

const V144 = { gap: 16e3, wait: 25e3, busy: 0, told: 0 };
const v144Sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 1. 城鎮不算挑戰
if (typeof v143Blocked === "function") {
  v143Blocked = function () {
    const town = typeof v113In === "function" && v113In();
    return !!(G.boss || G.tw || (G.arena && !town) || G.trial != null || G.guard != null || V1213.run || V1213B.mode || G.dead);
  };
}

// 2. 自動更新前先上傳雲端存檔
const v144CloudOn = () =>
  typeof V126 !== "undefined" && V126.on && V126.bootOk && !V126.paused && typeof v126Upload === "function" && typeof S !== "undefined" && S && !(typeof TAB !== "undefined" && TAB.gone);
async function v144Flush() {
  if (!v144CloudOn()) return false;
  try {
    await saveNow(true);
  } catch (e) {}
  const end = Date.now() + V144.wait;
  while (Date.now() < end && v144CloudOn()) {
    if (V126.up) {
      await v144Sleep(300);
      continue;
    }
    const left = V144.gap - (Date.now() - (V98C.up || 0));
    if (left > 0) {
      v63UpdBanner(`正在上傳雲端存檔，${Math.ceil(left / 1000)} 秒後重新整理…`);
      await v144Sleep(Math.min(left, 1000));
      continue;
    }
    v63UpdBanner("正在上傳雲端存檔…");
    try {
      return await v126Upload();
    } catch (e) {
      return false;
    }
  }
  return false;
}
if (typeof v63UpdGo === "function") {
  const go144 = v63UpdGo;
  v63UpdGo = async function (...a) {
    if (V144.busy || (typeof v64Upd !== "undefined" && v64Upd.going)) return;
    // 組隊副本中：照 v1.3.1 等這次挑戰打完
    if (typeof v131Party === "function" && v131Party()) return go144.apply(this, a);
    if (v144CloudOn()) {
      V144.busy = 1;
      try {
        if (typeof v131Busy === "function" && v131Busy()) v131EndFight();
        await v144Flush();
      } catch (e) {}
      V144.busy = 0;
    }
    return go144.apply(this, a);
  };
}

// 3. 雲端檢查：照常保存時的提示
if (typeof v126Ok === "function") {
  const ok144 = v126Ok;
  v126Ok = function (r, ...a) {
    const out = ok144.call(this, r, ...a);
    if (r && r.t && r.flag && !V144.told) {
      V144.told = 1;
      const msg = `雲端檢查：${r.flag}。進度已照常保存，這個帳號已排除在線上排行之外`;
      setTimeout(() => {
        try {
          toast(msg, "bad", 1);
        } catch (e) {}
      }, 3000);
    }
    return out;
  };
}
// 管理員的封鎖名單：顯示雲端檢查的原因與數值
if (typeof v118BansOpen === "function") {
  const bo144 = v118BansOpen;
  v118BansOpen = async function (...a) {
    const r = await bo144.apply(this, a);
    try {
      const sh = $("#sheet");
      if (!sh || !Array.isArray(V118.bans)) return r;
      let h = sh.innerHTML;
      for (const b of V118.bans) {
        const by = String(b.by || "");
        if (!by.startsWith("auto:")) continue;
        const key = `<small class="note">角色 ${v118Esc(b.id)}・`;
        if (!h.includes(key)) continue;
        h = h.replace(key, `<small class="note v144why">雲端檢查：${v118Esc(by.slice(5))}${b.det ? `・${v118Esc(b.det)}` : ""}</small><br>${key}`);
      }
      if (h !== sh.innerHTML) sh.innerHTML = h;
    } catch (e) {}
    return r;
  };
}

// 說明（v1.3.3 起的補丁在載入時直接安裝）
function v144Help() {
  const rows = HELP.bind && HELP.bind[1];
  if (Array.isArray(rows))
    for (const r of rows) {
      if (r[0] === "檢查")
        r[1] =
          "伺服器會檢查等級不能倒退、等級與 Zeny 的增加速度，以及技能寶石合成（合成變異寶石必須用掉 3 顆同技能的變異寶石）。等級超出範圍或倒退時拒收這次上傳；增加速度或寶石合成對不上時照常保存進度，但這個帳號會排除在線上排行之外（管理員可解除）。";
      if (r[0] === "自動上傳") r[1] = "每 3 分鐘自動上傳一次，切走或關閉頁面時也會上傳；遊戲自動更新前會先上傳最新進度；也可以按「立即上傳」。";
    }
  // 職業天賦頁的說明：城鎮可調整
  if (ui && typeof ui.ascHtml === "function") {
    const ah = ui.ascHtml;
    ui.ascHtml = function (...a) {
      const h = ah.apply(this, a);
      return typeof h === "string" ? h.replace("挑戰中禁止退點、改選與重置。", "城鎮中可以調整；挑戰中禁止退點、改選與重置。") : h;
    };
  }
}
try {
  v144Help();
} catch (e) {
  console.error("v144", e);
}
