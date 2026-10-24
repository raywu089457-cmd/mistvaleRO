/* 流浪仙境 v6.5：煉金坊篩選、活動深淵、武鬥場自動入場、移除無限印記 */

// ---------------------------------------------------------------------------
// 煉金坊篩選（設定存在 S.set.v65f，下次打開維持）
const V65_F = {
  ref: { slot: "", rar: "", loc: "", sort: "ref" },
  sock: { slot: "", rar: "", loc: "", st: "", sort: "ref", ct: 0 },
  salv: { slot: "", lv: 0, keepSock: 0, keepRef: 0 },
  fuse: { part: "", t: 0, sort: "tier" },
};
function v65Opt(tab) {
  const all = ((S.set ||= {}).v65f ||= {}),
    o = (all[tab] ||= {});
  for (const [k, v] of Object.entries(V65_F[tab] || {})) o[k] ??= v;
  return o;
}
const V65_SLOT = [["", "全部部位"], ["weapon", "武器"], ["shield", "盾牌"], ["helm", "頭飾"], ["chest", "鎧甲"], ["gloves", "披肩"], ["boots", "鞋子"], ["acc", "飾品"]];
const V65_RAR = [["", "全部稀有度"], ["0", "普通"], ["1", "魔法"], ["2", "稀有"], ["3", "傳奇"], ["4", "神話"], ["uq", "獨特"], ["my", "主宰"]];
const v65SlotOk = (t, s) => !s || (s === "acc" ? t.slot === "ring" || t.slot === "amulet" : t.slot === s);
const v65RarOk = (t, r) => (r === "" || r == null ? true : r === "my" ? !!t.my : r === "uq" ? !!t.uq && !t.my : !t.uq && !t.my && t.rar === +r);
const v65Sel = (tab, k, opts, lab) => {
  const o = v65Opt(tab);
  return `<select class="sel" data-v65f="${tab}.${k}" aria-label="${lab}">${opts.map(([v, n]) => `<option value="${v}"${String(v) === String(o[k]) ? " selected" : ""}>${n}</option>`).join("")}</select>`;
};
const v65Chk = (tab, k, txt) => `<label class="chk"><input type="checkbox" data-v65f="${tab}.${k}" ${v65Opt(tab)[k] ? "checked" : ""}><span>${txt}</span></label>`;
let v65GearTab = null;
function v65GearFilt(tab, shown, total) {
  return `<div class="row filt v65filt">${v65Sel(tab, "slot", V65_SLOT, "部位")}${v65Sel(tab, "rar", V65_RAR, "稀有度")}${v65Sel(tab, "loc", [["", "全部位置"], ["worn", "穿戴中"], ["bag", "背包"]], "位置")}${
    tab === "sock" ? v65Sel(tab, "st", [["", "全部插槽"], ["empty", "有空插槽"], ["carded", "已鑲卡片"]], "插槽狀態") : ""
  }${v65Sel(tab, "sort", [["ref", "依精煉值"], ["lv", "依物品等級"], ["q", "依品質"], ["slot", "依插槽數"]], "排序")}<span class="note v65cnt">${shown}／${total} 件</span></div>`;
}
function v65PickFilt() {
  return `<div class="row filt v65filt">${v65Sel("sock", "ct", [[0, "全部階級"], ...V5_TIER.slice(1).map((x, i) => [i + 1, x.n])], "卡片階級")}</div>`;
}
function v65FuseFilt() {
  return `<div class="row filt v65filt">${v65Sel("fuse", "part", [["", "全部部位"], ...Object.entries(V5_PART)], "部位")}${v65Sel("fuse", "t", [[0, "全部階級"], ...V5_TIER.slice(1).map((x, i) => [i + 1, x.n])], "階級")}${v65Sel("fuse", "sort", [["tier", "預設排序"], ["n", "依數量"], ["name", "依名稱"]], "排序")}</div>`;
}
function v65SalvList(r) {
  const o = v65Opt("salv");
  return S.bag.filter(
    (t) =>
      t.v5 && !t.lk && !keepMatch(t) && !t.my &&
      (r === "uq" ? t.uq : !t.uq && t.rar === r) &&
      v65SlotOk(t, o.slot) &&
      (!+o.lv || (t.ilvl || 0) <= +o.lv) &&
      !(o.keepSock && t.cs > 0) &&
      !(o.keepRef && (t.ref || 0) > 0),
  );
}
function v65FilterInstall() {
  // 精煉、鑲嵌：裝備清單先篩選、排序，再取前 80 件
  const v65GearList = {},
    gl = v5GearList;
  v5GearList = function (filter, sel) {
    const tab = v65GearTab;
    if (!tab) return gl.call(this, filter, sel);
    const o = v65Opt(tab),
      base = (t) => t && t.v5 && filter(t),
      ok = (t) =>
        base(t) && v65SlotOk(t, o.slot) && v65RarOk(t, o.rar) &&
        (tab !== "sock" || !o.st || (o.st === "empty" ? t.cards?.some((x) => !x) : t.cards?.some(Boolean)));
    const wornAll = SLOTS.map((s) => S.equip[s]).filter(base),
      bagAll = S.bag.filter(base),
      worn = o.loc === "bag" ? [] : wornAll.filter(ok),
      bag = o.loc === "worn" ? [] : bagAll.filter(ok),
      key = { ref: (t) => t.ref || 0, lv: (t) => t.ilvl || 0, q: (t) => t.q || 0, slot: (t) => t.cs || 0 }[o.sort] || ((t) => t.ref || 0);
    bag.sort((a, b) => key(b) - key(a) || (b.ref || 0) - (a.ref || 0) || rarTier(b) - rarTier(a) || b.ilvl - a.ilvl);
    const out = [...worn, ...bag.slice(0, 80)];
    v65GearTab = null;
    v65GearList.cnt = [worn.length + bag.length, wornAll.length + bagAll.length];
    return out;
  };
  const wrapTab = (tab, fn) =>
    function (...a) {
      v65GearTab = tab;
      v65GearList.cnt = null;
      let h;
      try {
        h = fn.apply(this, a);
      } finally {
        v65GearTab = null;
      }
      const [n, all] = v65GearList.cnt || [0, 0];
      return h.replace("<h3>選擇裝備</h3>", `<h3>選擇裝備</h3>${v65GearFilt(tab, n, all)}`);
    };
  v5RefTab = wrapTab("ref", v5RefTab);
  v5SockTab = wrapTab("sock", v5SockTab);
  // 分解：批次分解加條件
  v5SalvTab = function () {
    const rows = [0, 1, 2, 3, "uq"].map((r) => {
      const list = v65SalvList(r),
        name = r === "uq" ? "獨特" : RAR_NAME[r],
        cf = ui.v65cf === "salv" + r;
      return `<div class="li"><div class="grow"><div class="t"><span class="${r === "uq" ? "ru" : "r" + r}">${name}</span> <span class="px">${list.length}</span> 件</div><div class="s">未鎖定、不符合保留規則與下方條件的裝備</div></div><button class="btn sm${cf ? " primary" : ""}" data-v65salv="${r}" ${list.length ? "" : "disabled"}>${cf ? `確定分解 ${list.length} 件？` : "全部分解"}</button></div>`;
    });
    const filt = `<div class="row filt v65filt">${v65Sel("salv", "slot", V65_SLOT, "部位")}${v65Sel("salv", "lv", [[0, "全部等級"], [60, "Lv60 以下"], [80, "Lv80 以下"], [100, "Lv100 以下"], [110, "Lv110 以下"], [120, "Lv120 以下"]], "物品等級上限")}${v65Chk("salv", "keepSock", "保留有插槽")}${v65Chk("salv", "keepRef", "保留已精煉")}</div>`;
    return `${v5MatBoard()}<h3>分解產出</h3><div class="box stack"><p class="note" style="margin:0">武器 → 神之金屬原石；防具與飾品 → 鋁原石。稀有度越高產出越多；Lv60 以上的裝備有 25% 機率直接得到神之金屬／鋁；精煉 +5 以上的裝備額外退還精煉素材。鑲嵌在裝備上的卡片會全部取回。</p><p class="note" style="margin:0">背包中點選裝備也可以單件分解；拾取篩選自動分解的裝備同樣會得到素材。</p></div><h3>批次分解</h3>${filt}<div class="list">${rows.join("")}</div>`;
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("[data-v65salv]");
    if (!b || !S) return;
    const v = b.dataset.v65salv,
      r = v === "uq" ? "uq" : +v,
      key = "salv" + v;
    if (ui.v65cf !== key) {
      ui.v65cf = key;
      return void ui.render();
    }
    ui.v65cf = null;
    for (const t of v65SalvList(r)) salvage(t.u);
    markDirty();
    ui.render();
  });
  document.addEventListener("change", (e) => {
    const el = e.target.closest && e.target.closest("[data-v65f]");
    if (!el || !S) return;
    const [tab, k] = el.dataset.v65f.split("."),
      o = v65Opt(tab),
      d = V65_F[tab]?.[k];
    o[k] = el.type === "checkbox" ? (el.checked ? 1 : 0) : typeof d === "number" ? +el.value || 0 : el.value;
    if (tab === "sock" && k !== "ct") ui.v5pick = null;
    ui.v65cf = null;
    markDirty();
    ui.render();
  });
}

// ---------------------------------------------------------------------------
// 活動深淵：全部主線地圖擊敗深淵第 1 階頭目後開放；10 階，強度與等級比照一般深淵；
// 怪物數量第 1 階 +12、每階 +1，生成速度第 1 階 +80%、每階 +10%；不另加掉率
const V65_ABY = { dens: 12, densUp: 1, spawn: 80, spawnUp: 10 };
const v65AbyProg = () => (S?.aby ? Array.from({ length: MAP_N }, (_, i) => i).filter((i) => (S.aby[i]?.m || 0) >= 2).length : 0);
const v65AbyOpen = () => !!S && v65AbyProg() >= MAP_N;
const v65AbyMax = () => (v65AbyOpen() ? Math.max(1, S.aby?.[SS_MAP]?.m || 0) : 0);
const v65AbyTier = () => (S?.aby?.[SS_MAP] ? Math.min(S.aby[SS_MAP].on || 0, v65AbyMax()) : 0);
const v65AbyActive = () => !!(S && G && ssMap() && !G.arena && !G.tw && G.trial == null && G.guard == null && v65AbyTier());
const v65AbyDens = (n) => V65_ABY.dens + V65_ABY.densUp * (n - 1);
const v65AbySpawn = (n) => V65_ABY.spawn + V65_ABY.spawnUp * (n - 1);
function v65AbyInstall() {
  // 怪物等級（mapLv 會讀 v56AbyLv）
  const al = v56AbyLv;
  v56AbyLv = function (t) {
    if (t === SS_MAP) {
      const n = v65AbyTier();
      return n ? v56AbyLvN(n) : 0;
    }
    return al.call(this, t);
  };
  // 生命、傷害（含召喚的神祇頭目）
  const am = addMob;
  addMob = function (...a) {
    const n0 = G.mobs.length;
    const r = am.apply(this, a);
    if (v65AbyActive() && G.mobs.length > n0) {
      const n = v65AbyTier(),
        m = G.mobs[G.mobs.length - 1];
      m.hp = m.max = m.max * Math.pow(V56_ABY.hp, n);
      if (m.sh) m.sh = m.shm = m.shm * Math.pow(V56_ABY.hp, n);
      m.dmg *= Math.pow(V56_ABY.dmg, n);
      m.aby = n;
    }
    return r;
  };
  // 怪物數量、生成速度
  const ss = slateSum;
  slateSum = function (t, a = S.map, s) {
    const v = ss.call(this, t, a, s);
    if ((t !== "dens" && t !== "spawn") || a !== SS_MAP || !v65AbyActive()) return v;
    const n = v65AbyTier();
    return v + (t === "dens" ? v65AbyDens(n) : v65AbySpawn(n));
  };
  // 在最高階擊敗神祇頭目：開放下一階
  const bw = bossWin;
  bossWin = function (...a) {
    const on = !G.v64mvp && v65AbyActive() && G.boss && G.boss.god != null,
      n = v65AbyTier();
    const r = bw.apply(this, a);
    if (on) {
      const row = v56AbyRow(SS_MAP);
      if (n >= (row.m || 0) && (row.m || 0) < V56_ABY.max) {
        row.m = n + 1;
        markDirty();
        later(1.5, () => toast(`「${MAPS[SS_MAP].n}」開放活動深淵第 ${row.m} 階`, "lvl", 1));
      }
    }
    return r;
  };
  // 活動地圖卡片：深淵選單
  const sb = ui.seasonBoard;
  ui.seasonBoard = function (...a) {
    let h = sb.apply(this, a);
    if (!S || typeof v56AllClear !== "function" || !v56AllClear()) return h;
    const mx = v65AbyMax(),
      n = v65AbyTier();
    let row;
    if (!mx) row = `<div class="row v56aby"><span class="note" style="margin:0">活動深淵${helpBtn("v65aby")}：全部主線地圖擊敗深淵第 1 階頭目後開放（<span class="px">${v65AbyProg()}/${MAP_N}</span>）</span></div>`;
    else {
      const opts = [`<option value="0"${n ? "" : " selected"}>一般</option>`]
        .concat(Array.from({ length: mx }, (_, i) => `<option value="${i + 1}"${n === i + 1 ? " selected" : ""}>深淵 ${i + 1} 階・LV${v56AbyLvN(i + 1)}</option>`))
        .join("");
      row = `<div class="row v56aby"><span class="note" style="margin:0">活動深淵${helpBtn("v65aby")}</span><select class="sel" data-v65aby aria-label="活動深淵階級">${opts}</select>${n ? `<span class="note" style="margin:0">怪物 +${v65AbyDens(n)}・生成 +${v65AbySpawn(n)}%</span>` : ""}</div>`;
      if (n) h = h.replace(`<span class="mpl mlv px">LV${SEASON.lv}</span>`, `<span class="mpl mlv px">深淵 ${n}・LV${v56AbyLvN(n)}</span>`);
    }
    const i = h.indexOf('<span class="mfoot sub">');
    return i > 0 ? h.slice(0, i) + row + h.slice(i) : h + row;
  };
  document.addEventListener("change", (e) => {
    const el = e.target?.closest?.("[data-v65aby]");
    if (!el || !S) return;
    v56AbyRow(SS_MAP).on = Math.max(0, Math.min(+el.value || 0, v65AbyMax()));
    if (ssMap() && !G.boss && !G.arena && G.trial == null && G.guard == null) setMap(SS_MAP);
    markDirty();
    ui.refreshIf("map");
  });
}

// ---------------------------------------------------------------------------
// 無限武鬥場：自動入場（結束並回到地圖、生命回到自動 Boss 門檻後，用選好的起始層再進場）
const V65_AA = { wait: 3 };
function v65AutoArena() {
  if (!S?.set?.v65aa || !G || G.arena || G.boss || G.tw || G.dead || G.trn || G.trial != null || G.guard != null) return;
  if (S.lvl < RO_ARENA.minLv || G.t < (G.v65aaT || 0) || !canStart() || !abReady()) return;
  G.v65aaT = G.t + 5;
  roArenaStart();
}
function v65AutoArenaInstall() {
  const tk = tick;
  tick = function (...a) {
    const r = tk.apply(this, a);
    try {
      v65AutoArena();
    } catch (e) {}
    return r;
  };
  const end = twEnd;
  twEnd = function (...a) {
    const ra = typeof roArenaOn === "function" && roArenaOn();
    const r = end.apply(this, a);
    if (ra && G) G.v65aaT = G.t + TW.out + V65_AA.wait;
    return r;
  };
  const pm = ui.p_map;
  ui.p_map = function (...a) {
    const h = pm.apply(this, a);
    if (!S || !h.includes("data-ro-arena")) return h;
    const box = `<label class="chk v65aa"><input type="checkbox" data-v65aa ${S.set?.v65aa ? "checked" : ""}><span>自動</span></label>`;
    return h.replace(/(<button class="btn sm primary" data-ro-arena[^>]*>[\s\S]*?<\/button>)/, `$1${box}`);
  };
  document.addEventListener("change", (e) => {
    const el = e.target?.closest?.("[data-v65aa]");
    if (!el || !S) return;
    (S.set ||= {}).v65aa = el.checked ? 1 : 0;
    if (el.checked && G) G.v65aaT = Math.min(G.v65aaT || 0, G.t + 1);
    markDirty();
  });
}

// ---------------------------------------------------------------------------
// 無限印記：目前沒有無盡之塔，不再掉落；舊存檔的印記清除（塔的紀錄保留）
function v65MarkInstall() {
  const dl = dropLoot;
  dropLoot = function (t, a, ...x) {
    if (a && a.mk) return;
    return dl.call(this, t, a, ...x);
  };
  const ens = roEnsureStats;
  roEnsureStats = function () {
    if (S && !S.v65mk) {
      if (S.tw && S.tw.mk) S.tw.mk = 0;
      S.v65mk = 1;
    }
    // v6.5.1：闇答萊屍改為 MVP，舊的首殺稱號清除（有擊敗最終守護者的改回其稱號）
    if (S && !S.v651t) {
      if (S.title && S.title === MONARCH.title) S.title = S.gd?.e > 0 ? FINAL.title : "";
      S.v651t = 1;
    }
    return ens.apply(this, arguments);
  };
}

// ---------------------------------------------------------------------------
// 說明
function v65Help() {
  HELP.v65aby = [
    "活動深淵",
    [
      ["開放", `全部 ${MAP_N} 張主線地圖都擊敗過深淵第 1 階頭目後，活動地圖「${MAPS[SS_MAP].n}」可切換深淵第 1 階；在最高階擊敗神祇頭目，開放下一階，最高 ${V56_ABY.max} 階。`],
      ["怪物等級", `第 1 階 Lv${V6_ABY_LV[0]}，逐階提高，第 10 階 Lv${V6_ABY_LV[1]}（一般活動地圖固定 Lv${SEASON.lv}）。`],
      ["難度", `比照一般深淵：每階怪物生命 ×${V56_ABY.hp}、傷害 ×${V56_ABY.dmg}（逐階相乘），神祇頭目同樣適用。`],
      ["數量", `怪物數量上限第 1 階 +${V65_ABY.dens}、每階再 +${V65_ABY.densUp}；生成速度第 1 階 +${V65_ABY.spawn}%、每階再 +${V65_ABY.spawnUp}%。`],
      ["掉落", "不另加掉率；怪物變多、等級變高，掉落自然變多。"],
      ["切換", "在活動地圖卡片下方的選單切換；身在活動地圖時會重新進入。"],
    ],
  ];
  if (HELP.season?.[1] && !HELP.season[1].some((r) => r[0] === "活動深淵"))
    HELP.season[1].push(["活動深淵", `全部主線地圖都擊敗過深淵第 1 階頭目後開放：怪物 Lv${V6_ABY_LV[0]}～${V6_ABY_LV[1]}，數量大增，適合滿級角色刷素材。`]);
  for (const v of Object.values(HELP))
    if (Array.isArray(v) && Array.isArray(v[1]) && v[1].some((r) => r[0] === "無限武鬥場") && !v[1].some((r) => r[0] === "自動入場"))
      v[1].push(["自動入場", "勾選武鬥場的「自動」後，一場結束並回到地圖、生命回到自動 Boss 門檻時，會用選好的起始層自動再次進場。"]);
  const fix = (k, name, txt) => {
    const rows = HELP[k]?.[1];
    if (!rows) return;
    const r = rows.find((x) => x[0] === name);
    if (r) r[1] = txt;
    else rows.push([name, txt]);
  };
  fix("alch", "篩選", "精煉、鑲嵌的裝備清單可依部位、稀有度、位置、插槽狀態篩選並排序；分解可限制部位、物品等級並保留有插槽或已精煉的裝備；卡片合成可依部位、階級篩選。設定會記住。");
  fix("v5salv", "批次分解", "依稀有度一次分解，可再限制部位、物品等級上限，並保留有插槽或已精煉的裝備；鎖定、符合保留規則與主宰裝備不會被分解。按兩次確認。");
}

// ---------------------------------------------------------------------------
function v65Install() {
  v65FilterInstall();
  v65AbyInstall();
  v65AutoArenaInstall();
  v65MarkInstall();
  v65Help();
}
if (typeof roV4Install === "function") {
  const r4v65 = roV4Install;
  roV4Install = function () {
    r4v65();
    v65Install();
  };
}
