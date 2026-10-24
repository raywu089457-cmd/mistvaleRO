/* 流浪仙境 v1.3.1
   1. 組隊副本卡片拿掉「寵物扭蛋券」「皮膚美容券」的張數，連同「到吉芬扭蛋」按鈕（扭蛋券張數在吉芬的寵物飼育員看）
   2. 挑戰中的自動更新：原本發現新版後，挑戰中會暫停倒數，只在兩場之間的空檔倒數（ro-v64.js；ro-v91.js 的改法沒有生效），
      連續挑戰的空檔只有 3 秒，要打很多場才會更新。改成：
      ・發現新版就開始倒數 30 秒，挑戰中也照算；上方提示「N 秒後結束挑戰並更新」
      ・秒數到：結束目前的挑戰再存檔、更新。頭目／守護者／試煉算挑戰中止；
        無限武鬥場、MVP 武道場等場地和按「離開」一樣（最高層照記）
      ・組隊副本不中斷：等這次挑戰打完（全滅或放棄）後 5 秒自動存檔並更新
      ・提示上的「立即更新」走同一套流程（組隊副本中則等挑戰打完）
      ・分頁在背景：不在挑戰中直接更新（和原本一樣）；在挑戰中照樣倒數 */

const V131 = { sec: 30, after: 5 };
const v131 = { endT: 0, party: false };

// 1. 組隊副本卡片（裝在最外層，ro-v1218.js 的「到吉芬扭蛋」之後）
function v131CardInstall() {
  if (typeof v1213Card !== "function") return;
  const cd131 = v1213Card;
  v1213Card = function (...a) {
    const h = cd131.apply(this, a);
    return typeof h === "string"
      ? h
          .replace(/<span>寵物扭蛋券 <b class="px">\d+<\/b><\/span>(<button class="btn sm" data-v1218="go">[^<]*<\/button>)?/, "")
          .replace(/<span>皮膚美容券 <b class="px">\d+<\/b><\/span>/, "")
      : h;
  };
}
if (typeof roV4Install === "function") {
  const r4v131 = roV4Install;
  roV4Install = function () {
    r4v131.apply(this, arguments);
    try {
      v131CardInstall();
    } catch (e) {
      console.error("v131", e);
    }
  };
}

// 2. 挑戰中的自動更新
const v131Party = () => typeof V1213 !== "undefined" && !!V1213.run;
// 正在挑戰（組隊副本另外處理）
function v131Busy() {
  if (typeof G === "undefined" || !G || typeof S === "undefined" || !S) return false;
  return !!(G.boss || G.tw || (G.arena && typeof inFight === "function" && inFight()));
}
const v131Dead = () => typeof G !== "undefined" && !!G && G.dead > 0;
// 結束目前的挑戰
function v131EndFight() {
  try {
    if (G.arena && typeof leaveArena === "function") leaveArena();
    else if (G.boss && typeof failBoss === "function") failBoss("遊戲更新：挑戰中止");
  } catch (e) {
    console.error("v131", e);
  }
}
function v131Step() {
  if (typeof v64Upd === "undefined" || v64Upd.going) return;
  const now = Date.now();
  if (!v63Upd.found) {
    if (now - v64Upd.last >= V64_UPD.every * 1000) v63UpdCheck();
    return;
  }
  if (!v131.endT) v131.endT = now + V131.sec * 1000;
  const party = v131Party();
  if (party) {
    v131.party = true;
    return v63UpdBanner("遊戲有新版本，這次組隊副本打完後自動存檔並更新");
  }
  // 組隊副本剛打完：留幾秒看結果
  if (v131.party) {
    v131.party = false;
    v131.endT = Math.max(v131.endT, now + V131.after * 1000);
  }
  const busy = v131Busy(),
    left = Math.max(0, Math.ceil((v131.endT - now) / 1000));
  if (left > 0) {
    if (document.hidden && !busy && !v131Dead()) return v63UpdGo();
    return v63UpdBanner(`遊戲有新版本，${left} 秒後${busy ? "結束挑戰並更新" : "自動存檔並更新"}`);
  }
  if (busy) v131EndFight();
  if (v131Dead()) return v63UpdBanner("遊戲有新版本，復活後立即自動存檔並更新");
  return v63UpdGo();
}

if (typeof v64UpdStep === "function" && typeof v63UpdGo === "function") {
  v64UpdStep = v131Step;
  v63UpdTick = v131Step;
  const go131 = v63UpdGo;
  v63UpdGo = async function (...a) {
    if (typeof v64Upd !== "undefined" && v64Upd.going) return;
    if (v131Party()) {
      v63UpdBanner("遊戲有新版本，這次組隊副本打完後自動存檔並更新");
      if (typeof toast === "function") toast("組隊副本進行中：這次挑戰打完後自動存檔並更新", "bad");
      return;
    }
    if (v131Busy()) v131EndFight();
    try {
      v91Hold = true; // 存檔期間不再開始新的挑戰
    } catch (e) {}
    return go131.apply(this, a);
  };
}
