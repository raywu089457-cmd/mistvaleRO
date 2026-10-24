/* 流浪仙境 v8.9：選單新增 Discord、選單重複圖示更換、更新日誌重新開始、武器元素詞條、
   煉金「素材」頁（升級合成、一鍵合成、精煉缺低階金屬時改用高階）、闇答萊屍的冥王之冠不會被批次分解與拾取篩選 */

const V89 = {
  discord: "https://discord.gg/wxnPHdS9Fw",
  // 選單圖示（RO 道具編號）
  icons: { mnM: 602, mnLog: 618, mnB: 1550, mnTree: 520, mnL: 1904, mnD: 12024 },
  newItems: [1550, 1904, 12024], // 原本不在遊戲素材裡的道具圖
  // 武器元素詞條：出現機率（普通、魔法、稀有、傳奇、神話；主宰必定出現；獨特不會出現）
  elP: [0.15, 0.25, 0.35, 0.45, 0.6],
  elDot: ["psn", "brn", "bld"], // 中毒／燃燒／流血傷害 %
  elHit: ["roElHit_brn", "roElHit_chl", "roElHit_shk"], // 擊中時機率燃燒／冰緩／感電
  dotW: 0.4, // 傷害 % 權重（與原本拳刃、斧的中毒傷害相同：Lv100 品質 100% 約 +31%）
  hitV: 0.1, // 擊中機率（Lv100 品質 100% 為 10%，品質 50%～150% → 5%～15%）
  keep: (t) => !!t && t.uq === "v70_crown", // 不會被批次分解、拾取篩選的裝備
};
const V89_TIER = [
  [2, "神之金屬／鋁"],
  [3, "濃縮"],
  [4, "高純度"],
];

// 新的道具圖示要在遊戲讀取素材清單前登記
(function () {
  const A = typeof window !== "undefined" && window.RO_ASSETS;
  if (!A) return;
  A.items ||= {};
  for (const id of V89.newItems) A.items[id] ||= { file: `items/${id}.png`, width: 24, height: 24 };
})();

// ---------------------------------------------------------------------------
// 1～2. 選單：Discord 按鈕、重複圖示
function v89MenuInstall() {
  Object.assign(roItemFiles, V89.icons);
  for (const m of MENU) {
    if (m[0] === "log") m[2] = "mnLog";
    if (m[0] === "rotree") m[2] = "mnTree";
  }
  if (!MENU.some((m) => m[0] === "dc")) MENU.push(["dc", "Discord", "mnD", V89.discord]);
}

// ---------------------------------------------------------------------------
// 4. 武器元素詞條：新取得的武器依稀有度有機率多一條元素詞條（已持有的武器不變）
function v89WeaponEl(it) {
  if (!it || it.slot !== "weapon" || it.uq || !it.v5) return;
  const p = it.my ? 1 : V89.elP[Math.max(0, Math.min(4, it.rar || 0))];
  if (RAND() >= p) return;
  it.bx ||= [];
  if (it.bx.some((b) => b.el)) return;
  const have = new Set(it.bx.map((b) => b.k)),
    pool = [...V89.elDot, ...V89.elHit].filter((k) => !have.has(k));
  if (!pool.length) return;
  const k = pool[ri(0, pool.length - 1)],
    [lo, hi] = v5Range(it),
    q = rf(lo, hi),
    L = it.ilvl || 1;
  const v = V89.elHit.includes(k)
    ? +(V89.hitV * v5Lv(L) * q).toFixed(3)
    : Math.max(1, Math.round(V5_REF[k] * V89.dotW * V5_XW * v5Lv(L) * q));
  it.bx.push({ k, v, el: 1 });
}
function v89WeaponInstall() {
  const cv = v5Convert;
  v5Convert = function (it, ...a) {
    const fresh = it && !it.sl && !it.v5;
    const r = cv.call(this, it, ...a);
    try {
      if (fresh && !(typeof v79Mig !== "undefined" && v79Mig) && it && it.v5) v89WeaponEl(it);
    } catch (e) {}
    return r;
  };
}

// ---------------------------------------------------------------------------
// 5. 煉金工坊：「分解」分頁改為「素材」（原本最後一頁的購買與升級合成搬過來），移除批次分解；
//    新增一鍵合成（合成到選擇的階級）；精煉缺少該階金屬時，自動改用更高階的金屬（1 個抵 1 個）
const v89Sub = (mat) => {
  const f = mat[0],
    l = +mat.slice(1);
  if (!(f === "x" || f === "i") || !l) return null;
  for (let k = l + 1; k <= 4; k++) if ((S.mat[f + k] || 0) > 0) return f + k;
  return null;
};
const v89Tg = () => {
  const t = +(S.set?.v89tg || 4);
  return t >= 2 && t <= 4 ? t : 4;
};
// 模擬（apply=false）或執行一鍵合成；回傳最終增減與花費
// 優先合成選擇的最高階：每次合成 1 個目標階，先用現有的低一階（4 個）；低一階不夠時才從再低一階補合成，一路往下；
// 用不到的低階素材保留不動
function v89OneClick(tg, apply) {
  const before = { ...S.mat },
    m = { ...S.mat };
  let z = S.ash,
    cost = 0;
  for (const f of ["x", "i"]) {
    const take = (st, t, n) => {
      const have = st.m[f + t] || 0;
      if (have >= n) return true;
      if (t <= 1) return false;
      const d = n - have,
        c = d * mergeAsh(f + t);
      if (!take(st, t - 1, MERGE_N * d) || st.z < c) return false;
      st.m[f + (t - 1)] -= MERGE_N * d;
      st.m[f + t] = have + d;
      st.z -= c;
      st.cost += c;
      return true;
    };
    for (let guard = 0; guard < 1e6; guard++) {
      const st = { m: { ...m }, z, cost },
        c = mergeAsh(f + tg);
      if (!take(st, tg - 1, MERGE_N) || st.z < c) break;
      st.m[f + (tg - 1)] -= MERGE_N;
      st.m[f + tg] = (st.m[f + tg] || 0) + 1;
      st.z -= c;
      st.cost += c;
      Object.assign(m, st.m);
      z = st.z;
      cost = st.cost;
    }
  }
  if (apply) {
    for (const f of ["x", "i"]) for (let l = 1; l <= 4; l++) S.mat[f + l] = m[f + l] || 0;
    S.ash = z;
  }
  const diff = {};
  for (const f of ["x", "i"]) for (let l = 1; l <= 4; l++) diff[f + l] = (m[f + l] || 0) - (before[f + l] || 0);
  return { diff, cost };
}
const v89DiffTxt = (diff, px) => {
  const tag = (k, v) => `${MATS[k].n} ${px ? `<span class="px">${v > 0 ? "+" : "−"}${fmt(Math.abs(v))}</span>` : `${v > 0 ? "+" : "−"}${fmt(Math.abs(v))}`}`,
    pos = Object.entries(diff).filter(([, v]) => v > 0),
    neg = Object.entries(diff).filter(([, v]) => v < 0);
  return { pos, txt: `獲得 ${pos.map(([k, v]) => tag(k, v)).join("、")}${neg.length ? `；用掉 ${neg.map(([k, v]) => tag(k, v)).join("、")}` : ""}` };
};
function v89OneHtml() {
  const tg = v89Tg(),
    pl = v89OneClick(tg, false),
    dt = v89DiffTxt(pl.diff, 1),
    seg = V89_TIER.map(([t, n]) => `<button data-v89="tg" data-v="${t}" aria-pressed="${tg === t}">${n}</button>`).join("");
  return `<h3 class="hrow">一鍵合成${helpBtn("v5mat")}</h3><div class="box stack">
    <p class="note" style="margin:0">優先合成出選擇的階級：先用現有的低一階素材，不夠時才把更低階的合成上來補足；用不到的低階素材保留不動。精煉缺少該階素材時，會自動改用更高階的素材（1 個抵 1 個）。</p>
    <div class="row" style="flex-wrap:nowrap;gap:6px"><span class="note" style="margin:0;white-space:nowrap">合成到</span><div class="seg" style="flex:1">${seg}</div></div>
    <p class="note" style="margin:0">${dt.pos.length ? `預計：${dt.txt}・花費 Zeny <span class="px">${fmt(pl.cost)}</span>` : "目前沒有可以合成的素材"}</p>
    <button class="btn primary" data-v89="one" ${dt.pos.length ? "" : "disabled"}>一鍵合成</button></div>`;
}
function v89MatTab() {
  return `${v5MatBoard()}<p class="note" style="margin:4px 0 0">素材來源：背包單件分解、拾取篩選自動分解、怪物掉落，或在下方用 Zeny 購買原石。</p>${v89OneHtml()}<h3>升級合成${helpBtn("craft", 2)}</h3>${ui.mergeHtml().replace(/<button class="btn" data-act="merge" data-i="-1"[^>]*>全部升級<\/button>/, "")}<h3 class="hrow">購買素材${helpBtn("craft")}${aWallet()}</h3>${ui.craftHtml()}`;
}
function v89AlchInstall() {
  V5_TABS.splice(0, V5_TABS.length, ["mat", "素材"], ["ref", "精煉"], ["sock", "鑲嵌"], ["fuse", "卡片合成"]);
  if (ui.v5at === "salv") ui.v5at = "mat";
  v5MatTab = v89MatTab;
  v5SalvTab = v89MatTab;
  // 精煉：缺少該階金屬時改用高階
  const rf0 = v5Refine;
  v5Refine = function (u, ...x) {
    const it = v5Find(u);
    if (!it || !S) return rf0.call(this, u, ...x);
    const lv = (it.ref || 0) + 1,
      mat = v5RefMat(it, lv),
      sub = !((S.mat[mat] || 0) > 0) && v89Sub(mat);
    if (!sub) return rf0.call(this, u, ...x);
    S.mat[sub]--;
    S.mat[mat] = (S.mat[mat] || 0) + 1;
    const r = rf0.call(this, u, ...x);
    if ((S.mat[mat] || 0) > 0) {
      // 沒有精煉（Zeny 或祝福不足）：退回
      S.mat[mat]--;
      S.mat[sub]++;
    } else if (ui.v5res && ui.v5res.txt) ui.v5res.txt += `（以 1 個${MATS[sub].n}代替${MATS[mat].n}）`;
    return r;
  };
  if (typeof v79RefTop === "function") {
    const rt = v79RefTop;
    v79RefTop = function (it, ...a) {
      const lv = (it?.ref || 0) + 1;
      if (!it || !S || lv > V79_REF.max) return rt.call(this, it, ...a);
      const mat = v5RefMat(it, lv),
        sub = !((S.mat[mat] || 0) > 0) && v89Sub(mat);
      if (!sub) return rt.call(this, it, ...a);
      let h, fake;
      S.mat[mat] = (S.mat[mat] || 0) + 1;
      try {
        h = rt.call(this, it, ...a);
        fake = v5MatTag(mat);
      } finally {
        S.mat[mat]--;
      }
      return typeof h === "string" ? h.replace(fake, `${v5MatTag(sub)}<span class="note" style="margin:0">${MATS[mat].n}不足，改用${MATS[sub].n}</span>`) : h;
    };
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("[data-v89]");
    if (!b || b.disabled || !S) return;
    const a = b.dataset.v89;
    if (a === "tg") {
      S.set.v89tg = +b.dataset.v;
      markDirty();
    } else if (a === "one") {
      const r = v89OneClick(v89Tg(), true),
        dt = v89DiffTxt(r.diff),
        got = dt.pos;
      ui.v5res = {
        t: performance.now(),
        ok: got.length > 0,
        txt: got.length ? `一鍵合成：${dt.txt}（Zeny −${fmt(r.cost)}）` : "沒有可以合成的素材",
      };
      if (got.length) sfx("mat");
      markDirty();
    } else return;
    ui.refreshIf("alch");
  });
  // 說明
  if (HELP.alch?.[1]) {
    HELP.alch[1] = HELP.alch[1].filter((r) => r[0] !== "分解");
    const r = HELP.alch[1].find((x) => x[0] === "素材");
    if (r) r[1] = "購買原石、把 4 個素材升級合成為高一級，或用一鍵合成一次合成到指定階級。裝備在背包單件分解或由拾取篩選自動分解。";
  }
  const mh = HELP.v5mat?.[1];
  if (mh) {
    mh.push(["一鍵合成", "選擇要合成的階級（神之金屬／鋁、濃縮、高純度），優先合成出該階：先用現有的低一階素材 4 個合成 1 個，低一階不夠時才把更低階的合成上來補足（一路往下）；用不到的低階素材保留不動，更高階的素材也不動。每次合成同樣消耗 4 個素材與 Zeny。"]);
    mh.push(["高階代替", "精煉缺少該階的神之金屬或鋁時，自動改用更高一階的素材（從最低的一階開始扣，1 個抵 1 個）。"]);
    const g = mh.find((x) => x[0] === "取得");
    if (g) g[1] = "背包單件分解、拾取篩選自動分解、怪物掉落（菁英與頭目較多），或在此用 Zeny 購買原石。";
  }
}

// ---------------------------------------------------------------------------
// 6. 闇答萊屍的冥王之冠：拾取篩選不會分解（背包滿也會放進背包）、背包批次分解與多選分解會略過（單件分解仍可）
let v89Batch = 0,
  v89Skip = 0;
function v89KeepInstall() {
  const ti = takeItem;
  takeItem = function (t, ...a) {
    if (V89.keep(t) && S) {
      const se = ses();
      se.dr[4] = (se.dr[4] || 0) + 1;
      S.bag.push(t);
      return "bag";
    }
    return ti.call(this, t, ...a);
  };
  const sv = salvage;
  salvage = function (u, ...a) {
    if (v89Batch && S) {
      const it = S.bag.find((x) => x.u === +u);
      if (V89.keep(it)) {
        v89Skip++;
        return -1;
      }
    }
    return sv.call(this, u, ...a);
  };
  document.addEventListener(
    "click",
    (e) => {
      const b = e.target.closest && e.target.closest("[data-act]");
      if (!b || !["bulkYes", "msalv", "msalvYes"].includes(b.dataset.act)) return;
      v89Batch = 1;
      v89Skip = 0;
      setTimeout(() => {
        v89Batch = 0;
        if (v89Skip) toast(`${UNIQUE.v70_crown?.n || "冥王之冠"}不會被批次分解（需要時請單件分解）`, "r3");
        v89Skip = 0;
      }, 0);
    },
    true,
  );
  const fix = (k, name, txt) => {
    const r = HELP[k]?.[1]?.find((x) => x[0] === name);
    if (r) r[1] = txt;
  };
  fix("bag", "拾取篩選", "勾選的稀有度在拾取時自動分解為 Zeny 與素材。也可勾選插槽、神話裝備。主宰與闇答萊屍的冥王之冠不會分解。");
  fix("bag", "批次分解", "依勾選的稀有度和上方的部位、規則篩選，一次分解。主宰與闇答萊屍的冥王之冠不會被分解。");
}

function v89Install() {
  const run = (f) => {
    try {
      f();
    } catch (e) {
      console.error("v8.9", f.name, e);
    }
  };
  run(v89MenuInstall);
  run(v89WeaponInstall);
  run(v89AlchInstall);
  run(v89KeepInstall);
}
if (typeof roV4Install === "function") {
  const r4v89 = roV4Install;
  roV4Install = function () {
    r4v89();
    v89Install();
  };
}
