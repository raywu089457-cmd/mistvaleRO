/* 流浪仙境 v1.0.4（內部 v9.4）：
   1. 魔法師「霜凍之術」冷卻 3.5 → 3.0 秒、觸發距離與命中範圍 ×1.2（原本要怪物貼身才會施放）
   2. 新手任務「穿上一件裝備」加送該職業的輔助寶石（下一個任務就是放輔助寶石）；卡在該任務又沒有輔助寶石的角色補發一顆
   3. 手機版背包：格子縮小（背包約 6 格一排、身上裝備 8 格一排），點裝備時詳情改從下方彈出（按鈕都看得到） */

// ---------------------------------------------------------------------------
// 1. 霜凍之術
const V94_FROST = { id: "mg_frost", cd: 3.0, r: 1.2 };
function v94FrostInstall() {
  const sk = SKILLS[V94_FROST.id];
  if (!sk) return;
  sk.cd = V94_FROST.cd;
  // 觸發距離（skillReady 也是讀 skillRange）
  const sr = skillRange;
  skillRange = function (g, ...x) {
    const r = sr.call(this, g, ...x);
    return g && g.id === V94_FROST.id && r ? r * V94_FROST.r : r;
  };
  // 命中範圍：施放時範圍倍率 ×1.2（只在這一次施放期間）
  const cr = castSkillRaw;
  castSkillRaw = function (g, ...x) {
    if (!g || g.id !== V94_FROST.id) return cr.call(this, g, ...x);
    const pa = PS.area;
    PS.area = pa * V94_FROST.r;
    try {
      return cr.call(this, g, ...x);
    } finally {
      PS.area = pa;
    }
  };
}

// ---------------------------------------------------------------------------
// 2. 新手任務送輔助寶石（每職業一顆能接起始技能的輔助）
const V94_SUP = { sword: "fury", bow: "prec", mage: "amp", thief: "mstrike", acolyte: "haste", merchant: "mc_cart" };
const V94_QI = 2; // 「穿上一件裝備」；下一個（3）是「將輔助寶石放在主動技能旁」
const v94SupIdx = () => {
  const g = CLASS[S?.cls]?.gems;
  return g ? g.indexOf(V94_SUP[S.cls]) : -1;
};
function v94QuestInstall() {
  const q = QUESTS[V94_QI];
  if (!q || q.k !== "equip") return;
  // 任務獎勵依職業給不同寶石：gem 改成依目前角色計算
  Object.defineProperty(q.rw, "gem", {
    get: () => {
      const i = v94SupIdx();
      return i >= 0 ? i : undefined;
    },
    enumerable: true,
    configurable: true,
  });
}
// 已經在「放輔助寶石」任務、但身上與寶石欄都沒有輔助寶石的角色：補發一顆
function v94QuestFix() {
  if (!S || S.q !== V94_QI + 1 || S.v94sup) return;
  S.v94sup = 1;
  const has = (S.gems || []).some((g) => SKILLS[g.id] && !SKILLS[g.id].act);
  const i = v94SupIdx();
  if (has || i < 0) return;
  const id = CLASS[S.cls].gems[i];
  giveGem(id);
  ui.badge("skill", 1);
  markDirty();
  setTimeout(() => toast(`補發輔助寶石「${SKILLS[id].n}」：放在主動技能旁即可完成任務`, "lvl"), 1200);
}

// ---------------------------------------------------------------------------
// 3. 手機版背包
const V94_MOB = "(max-width: 720px)";
const v94Mob = () => typeof matchMedia === "function" && matchMedia(V94_MOB).matches;
function v94MobCss() {
  if (document.getElementById("v94css")) return;
  const st = document.createElement("style");
  st.id = "v94css";
  st.textContent = `@media ${V94_MOB}{
.ro-inventory .bagScroll .grid{grid-template-columns:repeat(auto-fill,minmax(52px,1fr));gap:4px;padding:4px}
.ro-inventory .doll{grid-template-columns:repeat(8,minmax(0,1fr));gap:3px;padding:0}
.ro-inventory .doll .cell.ro-item-slot .lv,.ro-inventory .bagScroll .cell.ro-item-slot .lv{font-size:9px}
.ro-inventory .doll .cell.ro-item-slot .ro-up,.ro-inventory .bagScroll .cell.ro-item-slot .ro-up{font-size:10px}
.ro-inventory .detail.v94hide{display:none}
.ro-inventory .detail.v94sheet{position:fixed!important;left:0;right:0;bottom:0;top:auto!important;margin:0!important;z-index:15;max-height:72vh!important;max-height:72dvh!important;overflow-y:auto;overscroll-behavior:contain;border-radius:12px 12px 0 0;border:1px solid #b9c8d3;border-bottom:0;box-shadow:0 -6px 24px rgba(20,30,45,.35);padding:10px 14px calc(14px + env(safe-area-inset-bottom));background:#f7fafb;animation:v94up .16s ease-out both}
.ro-inventory .detail.v94sheet.v94multi{max-height:34vh!important;max-height:34dvh!important}
.v94bar{position:sticky;top:-10px;z-index:2;display:flex;align-items:center;justify-content:space-between;margin:-10px -14px 8px;padding:6px 10px 6px 14px;background:#f7fafb;border-bottom:1px solid #d6e0e7}
.v94bar i{width:38px;height:4px;border-radius:2px;background:#c3d0da;margin:0 auto}
.v94bar button{flex:none;min-width:44px;min-height:34px;border:1px solid #c9d6df;border-radius:8px;background:#fff;font:600 14px/1 sans-serif;color:#45647e}
#v94dim{position:fixed;inset:0;z-index:14;background:rgba(15,22,32,.38)}
}
@keyframes v94up{from{transform:translateY(24px);opacity:.4}to{transform:none;opacity:1}}`;
  document.head.appendChild(st);
}
// 暗色背景放在詳情旁邊（同一個圖層），才不會蓋住詳情本身
function v94Dim(on, dt) {
  const d = document.getElementById("v94dim");
  if (!on) return void d?.remove();
  if (d && d.nextElementSibling === dt) return;
  d?.remove();
  const n = document.createElement("div");
  n.id = "v94dim";
  n.addEventListener("click", v94Close);
  dt.before(n);
}
function v94Close(e) {
  e?.preventDefault?.();
  e?.stopPropagation?.();
  ui.v94open = false;
  v94Dim(false);
  ui.render();
}
function v94Sheet() {
  const dt = document.querySelector("#panel .ro-inventory .detail");
  if (!dt || ui.tab !== "bag" || !v94Mob()) return void v94Dim(false);
  dt.classList.remove("v94sheet", "v94multi", "v94hide");
  const multi = ui.bagTool === "multi" && ui.msel;
  if (multi) {
    dt.classList.add("v94sheet", "v94multi");
    v94Dim(false);
    return;
  }
  // 背包畫面會自動選第一件裝備（桌面版右側固定顯示詳情），手機上只有點了裝備才彈出
  if (!ui.v94open || !findItem(ui.sel)) {
    dt.classList.add("v94hide");
    v94Dim(false);
    return;
  }
  dt.classList.add("v94sheet");
  if (!dt.querySelector(".v94bar")) {
    const bar = document.createElement("div");
    bar.className = "v94bar";
    bar.innerHTML = '<span style="width:44px"></span><i></i><button type="button" aria-label="關閉">✕</button>';
    bar.querySelector("button").addEventListener("click", v94Close);
    dt.prepend(bar);
  }
  v94Dim(true, dt);
}
function v94MobInstall() {
  if (typeof document === "undefined" || typeof ui === "undefined") return;
  v94MobCss();
  const rd = ui.render;
  ui.render = function (...a) {
    const r = rd.apply(this, a);
    try {
      v94Sheet();
    } catch (e) {}
    return r;
  };
  // 點了裝備（或從別處「查看裝備」）才打開詳情
  document.addEventListener(
    "click",
    (e) => {
      if (e.target?.closest?.('[data-act="pick"],[data-act="goItem"]')) ui.v94open = true;
    },
    true,
  );
  // 離開背包分頁時收起詳情
  const st = ui.setTab;
  ui.setTab = function (t, ...a) {
    if (t !== "bag") {
      this.v94open = false;
      v94Dim(false);
    }
    return st.call(this, t, ...a);
  };
  try {
    matchMedia(V94_MOB).addEventListener("change", () => ui.render());
  } catch (e) {}
}

// ---------------------------------------------------------------------------
function v94HelpInstall() {
  if (typeof HELP === "undefined") return;
  const b = HELP.bag?.[1];
  if (Array.isArray(b) && !b.some((r) => r[0] === "手機"))
    b.push(["手機", "手機（寬度 720 以下）上，點選裝備後詳細資訊會從畫面下方彈出，按 ✕ 或點旁邊的暗處關閉。"]);
}

function v94Install() {
  v94FrostInstall();
  v94QuestInstall();
  v94MobInstall();
  v94HelpInstall();
}
if (typeof roV4Install === "function") {
  const r4v94 = roV4Install;
  roV4Install = function () {
    r4v94();
    v94Install();
  };
}
// 讀取角色後檢查任務（startGame 之後）
if (typeof startGame === "function") {
  const sg94 = startGame;
  startGame = function (...a) {
    const r = sg94.apply(this, a);
    try {
      v94QuestFix();
    } catch (e) {}
    return r;
  };
}
