/* 流浪仙境 v1.0.1（內部 v9.2）：「?」說明全面對照目前的遊戲內容修正；魔王的信物／碎片改用魔王名稱
   （一鍵合成改為「優先合成最高階」寫在 ro-v89.js） */

function v92HelpInstall() {
  if (typeof HELP === "undefined") return;
  const rows = (k) => (Array.isArray(HELP[k]?.[1]) ? HELP[k][1] : null);
  const find = (k, n) => rows(k)?.find((r) => Array.isArray(r) && r[0] === n);
  // 改內容
  const set = (k, n, txt) => {
    const r = find(k, n);
    if (r) r[1] = txt;
  };
  // 改標題（可同時改內容）
  const ren = (k, n, n2, txt) => {
    const r = find(k, n);
    if (r) {
      r[0] = n2;
      if (txt != null) r[1] = txt;
    }
  };
  // 插入一列（after 之後；找不到就放最後）
  const add = (k, after, row) => {
    const a = rows(k);
    if (!a || a.some((r) => Array.isArray(r) && r[0] === row[0])) return;
    const i = a.findIndex((r) => Array.isArray(r) && r[0] === after);
    a.splice(i >= 0 ? i + 1 : a.length, 0, row);
  };

  // ---- 角色
  set("chars", "多角色", `最多可建立 ${typeof CHAR_MAX !== "undefined" ? CHAR_MAX : 6} 個角色。`);
  set("chars", "切換", "在「切換角色」選擇要使用的角色。挑戰 Boss、魔王時不能切換。");
  // ---- 共用倉庫
  set("stash", "職業限定", "武器與職業寶石只能由同職業的角色取出；獨特武器例外，任何職業都能取出（取出後自動換成該職業的武器種類）。");
  // ---- 轉職：怒氣值上限
  const mom = find("asc", "怒氣值");
  if (mom && !mom[1].includes("上限"))
    mom[1] = mom[1].replace("每層攻擊速度 +5%", `怒氣值上限 ${STK?.mom?.max ?? 10} 層（二刀流 +3）；每層攻擊速度 +5%`);
  // ---- 背包
  set("bag", "不會被分解", "鎖定、主宰，以及符合保留規則的裝備不會被分解；闇答萊屍的冥王之冠也不會被拾取篩選、批次分解與多選分解處理（仍可單件分解）。");
  // ---- 技能盤
  add("skill", "被動寶石", ["外框顏色", "技能盤上每顆寶石以粗外框區分：主動技能深藍、輔助寶石深紫、變異寶石橘金、穿梭寶石青綠，選取中為金色；沒有圖示的格子會寫上技能名字。"]);
  set("skill", "流血", "流血技能（例如大地之擊）使敵人流血：每秒受到此次傷害的 20%，持續 4 秒。敵人移動時（含擊退）流血傷害 ×2。");
  // ---- 煉金
  set("alch", "篩選", "精煉、鑲嵌的裝備清單可依部位、稀有度、位置、插槽狀態篩選並排序；卡片合成可依部位、階級篩選。設定會記住。");
  ren(
    "craft",
    "全部往上合",
    "一鍵合成",
    "在「煉金・素材」選擇要合成的階級（神之金屬／鋁、濃縮、高純度），優先合成出該階：先用現有的低一階素材，不夠時才把更低階的合成上來補足；用不到的低階素材保留不動。",
  );
  set("v5ref", "素材", "+1～+5 用神之金屬／鋁，+6～+8 用濃縮神之金屬／濃縮鋁，+9～+15 用高純度神之金屬／高純度鋁。武器用神之金屬系，其他部位用鋁系。缺少該階素材時，自動改用更高一階（1 個抵 1 個）。");
  // ---- 地圖
  const ms = find("map", "怪物強度");
  if (ms) ms[1] = ms[1].replace("守護者", "魔王");
  // ---- 魔王
  ren("guard", "§三位守護者", "§三位魔王");
  ren("guard", "古樹招式", "獸人英雄招式");
  ren("guard", "熔核招式", "伊夫利特招式");
  ren("guard", "星穹招式", "冰暴騎士招式");
  set("guard", "獎勵", "擊敗後必定掉落這位魔王的碎片；約 5% 機率掉落隨機獨特裝備、約 0.5% 機率掉落史詩或傳說卡片（魔王戰的裝備與卡片掉落為一般頭目公式的 1/3）。");
  set(
    "guard",
    "終焉獎勵",
    `5% 機率掉落主宰裝備；約 6.7% 機率掉落高階獨特裝備（${(typeof FINAL !== "undefined" && FINAL.uq ? FINAL.uq : []).map((k) => UNIQUE[k]?.n).filter(Boolean).join("、")}之一）；約 0.5% 機率掉落史詩或傳說卡片；10% 機率從虛空召喚闇答萊屍。第一次擊敗獲得稱號「終焉征服者」。可以重複挑戰。`,
  );
  // ---- 卡片圖鑑
  set("cards", "頭目", "地圖頭目 1% 掉落稀有或史詩；Lv78 以後 4 張新地圖的頭目與所有深淵頭目，另有 3% 掉落隨機傳說卡片；魔王、巴風特約 0.5% 掉落史詩或傳說。");
  set("cards", "高強度內容", "魔王闇答萊屍 1% 掉落傳說卡片；活動神化身 1.5% 掉落傳說或神話；無限武鬥場每 10 層頭目關機率隨層數提高，30 層起掉落傳說或神話。");
  // ---- 自動挑戰
  ren("ab", "活動", "巴風特", "三種魔王碎片齊全，並勾選巴風特的「自動」時，也會自動挑戰。");
  set("ab", "順序", "優先順序：巴風特（碎片齊全）→ 魔王（持有信物，依獸人英雄、伊夫利特、冰暴騎士的順序）。皆需勾選「自動」。");
  // ---- 深淵、後期頭目、活動深淵
  const sw = find("v56aby", "切換");
  if (sw) sw[1] = sw[1].replace("守護者", "魔王");
  const who = find("v6boss", "誰會使用");
  if (who) who[1] = who[1].replace("最終守護者", "巴風特").replace("守護者", "魔王");
  set("v65aby", "怪物等級", "第 1 階 Lv112、第 2 階 Lv120、第 3 階 Lv127（一般活動地圖固定 Lv90）。");
  // ---- 排行榜（舊版排行頁）
  const rk = find("rank", "審核");
  if (rk) rk[1] = rk[1].replace("塔內", "武鬥場內");
  // ---- 其他殘留的「守護者」
  for (const v of Object.values(HELP))
    if (Array.isArray(v) && Array.isArray(v[1]))
      for (const r of v[1])
        if (Array.isArray(r))
          for (let i = 0; i < r.length; i++) if (typeof r[i] === "string") r[i] = r[i].replace(/最終守護者/g, "巴風特").replace(/守護者/g, "魔王");
}

// 魔王的信物與碎片：原作的「古樹／熔核／星穹」改為魔王名稱（掉落提示、挑戰確認視窗）；說明中的「守護者」改為「魔王」
function v92GuardInstall() {
  if (typeof GUARD === "undefined") return;
  for (const g of GUARD) {
    if (g.tk) g.tk = g.n + "信物";
    if (g.fr) g.fr = g.n + "碎片";
    if (typeof g.d === "string") g.d = g.d.replace(/守護者/g, g.n);
  }
}

function v92Install() {
  v92GuardInstall();
  v92HelpInstall();
}
if (typeof roV4Install === "function") {
  const r4v92 = roV4Install;
  roV4Install = function () {
    r4v92();
    v92Install();
  };
}
