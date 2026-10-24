/* 流浪仙境 v1.2.24：隊伍排行移到選單
   ・選單新增「隊伍排行」（放在「線上排行」旁邊，圖示為 RO 原版華麗金屬），列表比照線上排行：名次、隊長、隊員職業與寵物、層數、用時
   ・點隊伍跳出的視窗改為和無限武鬥場排行相同的大小（寬版，最寬 860px、最高 86% 畫面高，可捲動）；「返回」回到選單的列表
   ・組隊副本卡片上的「隊伍排行」按鈕拿掉；組隊畫面與結算畫面的「隊伍排行」改為前往選單的隊伍排行 */

const v1224Esc = (s) => (typeof esc === "function" ? esc(String(s ?? "")) : String(s ?? ""));
const v1224On = () => typeof ui !== "undefined" && ui.tab === "more" && ui.moreView === "prank";

// 前往選單的隊伍排行
function v1224Go() {
  try {
    sheetOff();
  } catch (e) {}
  ui.setTab("more", "prank");
  ui.render();
}
// 選單頁：隊伍排行列表
function v1224Page() {
  const head = `<h2>隊伍排行・組隊副本${typeof helpBtn === "function" ? helpBtn("v1213") : ""}</h2>`;
  if (!v1213RkOn()) return head + `<div class="box"><p class="note" style="margin:0">隊伍排行只在網址版開放（xianjingro.fun）。直接開啟本機 index.html 時不會上傳也無法查看。</p></div>`;
  v1213RkFetch();
  const L = V1213RK.list,
    mine = S?.cid;
  const row = (r, i) => {
    const mem = r.mem || [],
      cls = mem.map((m) => `${CLASS[m.c]?.n || ""} Lv.${m.l}`).join("・"),
      pets = mem.map((m) => (m.p && typeof V1215_BY !== "undefined" && V1215_BY[m.p.k] ? V1215_BY[m.p.k].n : "")).filter(Boolean);
    return `<button class="li v6rk-row v1224row${r.id === mine ? " me" : ""}" data-v1213="rkv" data-id="${v1224Esc(r.id)}"><span class="v6rk-n px">${i + 1}</span><span class="grow"><b>${v1224Esc(r.name)}</b> <small>${mem.length} 人</small><br><small>${v1224Esc(cls)}${pets.length ? `・寵物：${v1224Esc(pets.join("、"))}` : ""}</small></span><span class="v6rk-f"><b class="px">${r.floor}</b> 層</span><span class="v6rk-s">${typeof v6Sec === "function" ? v6Sec(r.sec) : Math.round(r.sec) + " 秒"}</span></button>`;
  };
  const body = V1213RK.err
    ? `<p class="note">${v1224Esc(V1213RK.err)}</p>`
    : !L
      ? `<p class="note">讀取中…</p>`
      : !L.length
        ? `<p class="note">還沒有紀錄。挑戰組隊副本，結束時會自動上傳。</p>`
        : `<div class="list v6rk-list">${L.map(row).join("")}</div>`;
  return (
    head +
    `<p class="note" style="margin:0 0 6px">比照無限武鬥場：比通關層數，再比用時；每位隊長只保留最佳紀錄。需要綁定 Google，挑戰結束自動上傳整隊快照。點選任一隊可查看隊伍與各隊員的構築快照。</p>` +
    body +
    `<div class="row" style="margin-top:6px"><span class="note">${L ? `共 ${L.length} 隊` : ""}</span><span class="spacer"></span><button class="btn sm" data-v1224="reload">重新整理</button></div>`
  );
}
// 隊伍視窗：和無限武鬥場排行相同的大小
function v1224Wide() {
  try {
    const sh = $("#sheet");
    if (sh && sh.querySelector(".v1213s") && /的隊伍/.test(sh.querySelector(".cfh")?.textContent || "")) sh.className = "wide v6rk-sheet v1224rv";
  } catch (e) {}
}

function v1224Install() {
  if (typeof v1213RankView !== "function" || typeof MENU === "undefined") return;
  // 選單
  if (typeof RO !== "undefined" && RO.assets?.items?.[714] && typeof roItemFiles !== "undefined") roItemFiles.mnParty = 714;
  if (!MENU.some((m) => m[0] === "prank")) {
    const i = MENU.findIndex((m) => m[0] === "orank");
    MENU.splice(i >= 0 ? i + 1 : MENU.length, 0, ["prank", "隊伍排行", roItemFiles?.mnParty ? "mnParty" : "mnR"]);
  }
  ui.m_prank = v1224Page;
  // 原本的排行視窗改為前往選單
  v1213RankSheet = v1224Go;
  v1213RkRefresh = function () {
    if (v1224On()) ui.render();
  };
  const rv = v1213RankView;
  v1213RankView = async function (...a) {
    const p = rv.apply(this, a);
    v1224Wide();
    const r = await p;
    v1224Wide();
    return r;
  };
  if (typeof document !== "undefined")
    document.addEventListener("click", (e) => {
      if (e.target?.closest?.('[data-v1224="reload"]')) {
        V1213RK.at = 0;
        v1213RkFetch(true);
      }
    });
  // 說明
  const rows = HELP.v1213 && HELP.v1213[1];
  if (Array.isArray(rows))
    for (const r of rows) if (r[0] === "隊伍排行") r[1] = "在「選單 → 隊伍排行」查看。比照無限武鬥場：比通關層數，再比用時；需要綁定 Google，挑戰結束自動上傳整隊快照。每層 5% 機率遇到排行榜上其他隊伍的快照（影子隊伍）。";
  if (typeof document !== "undefined" && !document.getElementById("v1224css")) {
    const st = document.createElement("style");
    st.id = "v1224css";
    st.textContent = `.v1224row .grow small{color:var(--muted)}.v1224rv .v1213s{max-width:none}.v1224rv .v1213rv{padding:8px 0}`;
    document.head.appendChild(st);
  }
}

if (typeof roV4Install === "function") {
  const r4v1224 = roV4Install;
  roV4Install = function () {
    r4v1224.apply(this, arguments);
    try {
      v1224Install();
    } catch (e) {
      console.error("v1224", e);
    }
  };
}
