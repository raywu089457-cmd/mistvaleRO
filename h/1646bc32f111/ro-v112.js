/* 流浪仙境（內部 v11.2，不列入更新日誌）：闇答萊屍的冥王之冠
   1. 裝備詳情不再顯示「（腐化 ×…）」：那是原本引擎的標籤名稱，本遊戲沒有腐化功能，冥王之冠的獨特素質倍率被沿用舊名稱顯示
   2. 獨特素質倍率 50%～150% → 100%～150%；已持有的冥王之冠低於 100% 的一律調為 100%（角色身上、背包與共用倉庫） */

const V112 = { lo: 1, hi: 1.5 };
const v112Fix = (it) => {
  if (it && it.uq === "v70_crown" && !(it.cm >= V112.lo)) {
    it.cm = V112.lo;
    return true;
  }
  return false;
};
function v112FixChar() {
  if (!S) return false;
  let ch = false;
  for (const it of Object.values(S.equip || {})) ch = v112Fix(it) || ch;
  for (const it of S.bag || []) ch = v112Fix(it) || ch;
  return ch;
}
function v112Install() {
  // 1. 移除「腐化」標籤
  if (ui && typeof ui.statHtml === "function") {
    const sh = ui.statHtml;
    ui.statHtml = function (...a) {
      const h = sh.apply(this, a);
      return typeof h === "string" ? h.replace(/ ?<small class="rng">（腐化 ×[\d.]+）<\/small>/g, "") : h;
    };
  }
  // 2. 新掉落：100%～150%
  if (typeof v70Crown === "function") {
    const vc = v70Crown;
    v70Crown = function (...a) {
      const it = vc.apply(this, a);
      if (it) it.cm = +(V112.lo + RAND() * (V112.hi - V112.lo)).toFixed(2);
      return it;
    };
  }
  // 已持有的：角色載入時調整；共用倉庫在讀取時調整並寫回
  if (typeof startGame === "function") {
    const sg = startGame;
    startGame = function (...a) {
      const r = sg.apply(this, a);
      try {
        if (v112FixChar()) {
          recalc();
          markDirty();
        }
      } catch (e) {}
      return r;
    };
  }
  if (typeof stLoad === "function") {
    const sl = stLoad;
    stLoad = function (...a) {
      const st = sl.apply(this, a);
      try {
        let ch = false;
        for (const e of st?.it || []) if (e && e.k === "bag") ch = v112Fix(e.o) || ch;
        if (ch && typeof stWrite === "function") stWrite(st);
      } catch (e) {}
      return st;
    };
  }
  // 說明：魔王說明的冥王之冠寫著「素質 50%～150% 浮動」
  for (const hv of Object.values(HELP || {}))
    for (const row of Array.isArray(hv?.[1]) ? hv[1] : [])
      if (Array.isArray(row) && row[0] === "冥王之冠" && typeof row[1] === "string")
        row[1] = row[1].replace("素質 50%～150% 浮動。", "品質 50%～150% 浮動、獨特效果 100%～150% 浮動。").replace("（隨素質浮動）", "（隨獨特效果浮動）");
}
if (typeof roV4Install === "function") {
  const r4v112 = roV4Install;
  roV4Install = function () {
    r4v112();
    v112Install();
  };
}
