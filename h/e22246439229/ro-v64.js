/* 流浪仙境 v6.4：MVP 武道場、傳說的魔力礦石、高純度魔力礦石、獨特武器隨分支調整、自動更新修正 */

// ---------------------------------------------------------------------------
// 數值
const V64_ORE = {
  keep: 0.1, // 一般紅／藍／黃魔力礦石掉率 ×1/10
  hiLv: 70, // 高純度：Lv70 以上的地圖頭目
  hiMap: 0.03, // 每色 3%
  arena: { base: 0.3, step: 0.05, two: 30 }, // 武鬥場頭目關 30%，每 10 層 +5%，30 層起一次 2 顆
  mvp: 2, // MVP 勝利必得
};
const V64_HI = ["e2", "b2", "y2"];
const V64_TK = { mob: [0.001, 0.003], elite: [0.005, 0.003], boss: [0.05, 0.01], need: 5 }; // [基礎, 每 10 層 +]
const V64_MVP_T = 150; // 秒
const V64_MVP_P = { lg: 0.1, uq: 0.03 };
const V64_MVP_FLOOR = 50; // 強度＝無限武鬥場第 50 層頭目
const V64_REM_OK = 50; // 拆卡成功率
const v64OreK = (fam, t) => fam + (t >= 4 ? "2" : "1"); // 普通～稀有用一般礦石，史詩以上用高純度
const v64OreN = (t) => t * t; // 合成、拆卸的礦石數量＝階級平方
const v64St = () => (S.v64 ||= { w: {}, uq: {}, n: 0 });
const v64LgOn = () => !!(ui.v64lg && S && (S.mat.lg1 || 0) > 0);
const V64_ICON = {"e2":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAACIklEQVR42u2UP2gTURzHv3cEh4RCQu+WEgIhqLc0W6EIHYQqOCo49HaHE7zB6SZDMgVczAnJ4OLidRDSRRBLsZqCDbTUQQRDCFdC6HIv5ECSwcHn4N31Jfdyl1bExd/04Pfj8/39fcB/A0ANVaeGqv8teJ2+e0MPr61Rnoj4JxlRQ63jpqpFxYg8OFyp5rRIjRpqPRa+qgA7u4sLAACe6JBLOpwW0XgiU/AYE+d6VhWuCDXUOlzpHF4xAQD20OViEpHyHmT7xZFGDRUA0G52tfUPlYWXIBEXIJd05B+V8fTZRy2bSmLr/p0LbZkY6f3yLXhmU0kMxhPg7u1zv9eeywkwcADIL6cjQYPx5BIV8GxnNyR+8RnMKb3/88dUhe33h7Mhin+gQtUyQwLB9aZJA66kxVbi2UH/DBu5FTgtogHAXscGNVQIVctMsHCnRWo9MvL2+gib1/OQiwoKUgY9MkJOvBIM2c/+1ekpbiylUZAykIvebXRsfovkkg7ZexfKJvY6NjYZfzaV5BbDLsD267fYerDW8Fs0d8hyUUF+OY2XJ1/RIyMUpEzgc8rmVPYc+MPQFglVy8S+1QiivVZs5FZw0D+D3zoA6JER7KH7u2XeN1E5/hyCA4AwO+R2s1tjs/Vhg/EE2VQyaAeb/afvLp4/vhWCh1okVC1z/d7VBpvtrNlDd2F4qAL2x2w3uxoLZS+VvYco+FyBqZuIMX9b/pn9AlFeAOw2sBJbAAAAAElFTkSuQmCC","b2":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAACLElEQVR42u2VP2gTURzHvxfSQQiFozkpCSGQQLQEikNLMxWLSxzTVXCVK5JBMrzFSZBAWyEZEgoKUihIhxan3qK1JcOVnIOBogVzcIQGyR8OpJDB4TmEd3npvbsYRVz8LXfJ78fn+3vf9/txwP8AQHSaJzrN/y14RWtSemfjExWJBP6kI6LTyl0Fql9NQAQfdFAyanaJ6LQyCb4wDxydTyEAAE/uAYWcDKNmqyIRHj4pAl6JhXmxCNFpZdAZwV+8Gz77VlvICfqpM8jeM00lOgUAaLsN9e3m4i8PQXBSQSEng5gR7ORfqSElivVH2ammLOCX/Pxt9B5SorjqXuJ+evQfs+e3BHg4AMzFI76gq+7l9CcQxdG5W3zqO/A6+o/vzbETnmiN6yW32YIWM1LZJcCSN26iOuj4byi/XJZRR3xpGUbNVgHg4vgMRKcoZqRykIcbNbvUM1vOXN9aW0E6JSOciKFntjAzm3QumXX/9f0byMlVhBMxpFMyhgIeFhVyMoBh0dZhDBfHZwBWxiZJFPwAHOxoePA0W2UWeV5yOiVjLh7Bx/0D9MwWwomYk9s6tMe6F8A3XFNUzEjlD11U2W9mRXxpGZZRB7MOAHpmC32rjZnZpGOn/nLTBRdN0Rey3XC6Zd6HlCgso46QEgXZHnpvN0+d7u3mKR6/fu6CuywqZqRy9uFile/2evSt9pg1fnAAkDy/UrsNlYfym8rvgx/cU4DfiUnBpuWfxU9iKwNHngCEqgAAAABJRU5ErkJggg==","y2":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAACI0lEQVR42u2UvWvbYBDGHxmjpY5BXipkRMDtUDqIljh4K2Qz/RcKXQqFt0OGLNHWrcgUUuzBoqFdCqFqhkCX4C00dFGd0lSD0dCKGJMXZ7FAtRcv6mBJkaKvJKV06U2C9/g9d8/dCfgfAFwqr7tUXv9b8K7rfHC/v6m4SSKFP6nIpXIXpfskK6eQBMds0LZNre1SuZsLX1oBznYuLwAAuL0Frt6CbWokSSQCz4lC6svSSqKIS+UuZoNz+I8NAAAdThMxxUx5D9JTt4hLZQCAsb9NpCdfLr0ExbwErt6CYBG8fa6QKs+i+bh5pS0rZL7++hp8VnkWp+M5cPPR+btnz/UEQnAAEJZLmaDT8fwaHSTF2U5M/OozSGn95zjaofHp88WUO/6BMoLSiQkE13vjrorZgOR24kVfn2C1UYFtagQA9AMKl8pgBKVTDMNtU2uPLCfY68aaAE6UINbKGFkObvEIhuxXr32c4ME9FmKtDE6UPBpNtoirt8DVF9/i0Sb0A4rGGiKblBThBei966FJNlTfotQhc6IEYbmEvfcnGFkOxFo5eLOPNiPVJ8CfxbaIEZQOpt/UINuzYrVRQV+fwLcOAEaWAzqcLizz7Hz56iQGT9oi09glQbW+91WeRV+foMqzMHYXsz88ngfVHx7P8eK1HIPHLGIEpSM9fKqGq70YdDiNWJMFBwAm7V9v7G+TMDR8qeF7yIKnCkRuIif8bfln8Rt8bwIZNb9qjQAAAABJRU5ErkJggg==","lg1":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAACrklEQVR42q1UMUgbYRT+LoguBg7ikoLZgpclNCXgIS4HWRXpYrnSoVsuwhGc3OvgmGS4uGUIBougRIduvQ4h/IWA4NKUbJbo0AYP7JBmeR3+u9+7mKQx9d/u/vf+7/ve994DpjzEdIu6dSKmW3juQ0w3qVsn6v8k+vKBiOnmtLmhKeMURNaC38/O3jv7J09SEZqB/ZNUhP7FHsvbBhaWghcNBegnjGlUhGZkP7WKuSez96lwWppBDG1JrZVmU9C5mnh9eX3/nyY3FODmfOSV04qOVz4OgJhuegGSWishc1YG8AjEaUVxeX2PVCw8nGuhnyj6QeYCyC+LRfSaIAYFQBtAG5UB8H5egHiPA4C8Z5W9NYJ+wkA8CVQGQOabAJaG9w1Wjwz8+QX0msCPj1yBlwzA3pgHAGivfwOZszL6CQNqlsdXBkDmrCyptdxIgJEgnSvuxXobiCdhb8wjFQtDTt/yf0OPu8oxqbP45iTiy81bcPsnRN063W01HtZFt060f0KfX30iYrp1t9Xg8XzrmmO7SFJrOXx9y8vTa3KW622gMuD1X29zP3YisE8XebmWtw35eAXoNeHsRIIeTBh5xV9/dK5g76YDAdrFAGLa2SGcggZ5zxI+SMR0E6tHRQAQdfeGrOFuApcx1CycN99FF2kXg0CsfboIzaoGfJiT1FqJmMt29cjAi00OFFkD4lyu7Jm5sAQ5fwjspnlZOhzYU6VZ1bJzkDPkvA2noIHY4zY1RVkaCpxWFHLeBuJJDriwBNyci1ZNxcJCTSoW5rFenlsmaVwXoZ8wvLKIdlWzD3XO24K9f6K9ARQejH3c97BT0HiiK11O33KWxysAOxQg7mQHtqs0YkUXEVkLdIRrmmLn3hk+ExXnIGcIw61qYIInTbI5NBMl/93w96g4//kLVWaq/0frVFMAAAAASUVORK5CYII=","tk1":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAABhklEQVR42u2UsUsCURzHvyctNYibS+SQoiIhtJwNQQ2FB7Y4npvRoIOLs5NTg8tFRkluSTQcKMFBDQ0FdQ6FRFzX2T8gKU1N6Ws47vXIy4SuIfA3PXiPz+d9eb/fAyY1KQAgmpj7S3g57o4Qoollx0UUXlFJ3B0hjopY+P5cijxt7DgnovCOboKb94Qod+a6oxPS0ccWcXZwgW9llLaMwfELXDE3s0mAXh9G+QqBw3UAgOBPAgAUNboH4JEL16RvBRReqsJoNBEorHxudt/pcmC8AQCez29NUf0VQj5NRVy4lrXOTrGtaMEPihJWozHzxgDQ69vGn19bhLF5hovWDY62imYivpAhmkiTUAEXrklEE0MCn84oparJPWnD4/PCFZgZuj1bC9OzAIBUpWAlkH58AwBQ2rIp2n4AAHh83iG4uttAMMGz8OzIR2YmN/RVdL1cRTDB03P6qYqlyzQEf9IWPtYXYbWsNRPsXHTzMm3VX/9FrKibl52Dj0zkJNxGlMOk/kV9AMhkEmS2OE4PAAAAAElFTkSuQmCC"};

// ---------------------------------------------------------------------------
// 素材
const V64_MAT_USE = {
  x1: "4 個合成 1 個神之金屬；分解武器取得",
  x2: "武器精煉 +1～+5；4 個合成 1 個濃縮神之金屬",
  x3: "武器精煉 +6～+8；4 個合成 1 個高純度神之金屬",
  x4: "武器精煉 +9～+10",
  i1: "4 個合成 1 個鋁；分解防具、飾品取得",
  i2: "防具與飾品精煉 +1～+5；4 個合成 1 個濃縮鋁",
  i3: "防具與飾品精煉 +6～+8；4 個合成 1 個高純度鋁",
  i4: "防具與飾品精煉 +9～+10",
  p1: "精煉 +5～+7、鑲嵌稀有以下卡片失敗時的保護；菁英與頭目少量掉落",
  p2: "武器 +6 以上精煉必須消耗；精煉 +8～+10、鑲嵌史詩以上卡片失敗時的保護；只由無限武鬥場頭目關掉落",
  e1: "鑲嵌普通～稀有卡片，每次 1 顆；怪物掉落（頭目較多）",
  b1: "合成普通～稀有卡片，數量＝階級平方（1／4／9 顆）；怪物掉落（頭目較多）",
  y1: "拆卸普通～稀有卡片，數量＝階級平方（1／4／9 顆）；怪物掉落（頭目較多）",
  e2: "鑲嵌史詩～神話卡片，每次 1 顆；Lv70 以上地圖頭目、無限武鬥場頭目關、MVP 武道場掉落",
  b2: "合成史詩～傳說卡片，數量＝階級平方（16／25 顆）；Lv70 以上地圖頭目、無限武鬥場頭目關、MVP 武道場掉落",
  y2: "拆卸史詩～神話卡片，數量＝階級平方（16／25／36 顆）；Lv70 以上地圖頭目、無限武鬥場頭目關、MVP 武道場掉落",
  lg1: "精煉、鑲嵌卡片、拆卸卡片時勾選使用，必定成功（每次 1 顆）；MVP 武道場 10% 掉落",
  tk1: "5 張可挑戰 1 次 MVP 武道場（挑戰頁）；無限武鬥場掉落，層數越高越多",
};
function v64MatInstall() {
  Object.assign(MATS, {
    e2: { n: "高純度紅色魔力礦石", f: "E", l: 3 },
    b2: { n: "高純度藍色魔力礦石", f: "B", l: 3 },
    y2: { n: "高純度黃色魔力礦石", f: "Y", l: 3 },
    lg1: { n: "傳說的魔力礦石", f: "lg", l: 4 },
    tk1: { n: "MVP 門票", f: "tk", l: 3 },
  });
  Object.assign(MAT_COL, { E: "#ff6a7a", B: "#6ab4ff", Y: "#ffe05a", lg: "#ff7ad8", tk: "#ff9ac8" });
  RO.assets.items ||= {};
  const fam = { E: "v64_e2", B: "v64_b2", Y: "v64_y2", lg: "v64_lg1", tk: "v64_tk1" };
  for (const [k, url] of Object.entries(V64_ICON)) RO.assets.items["v64_" + k] = { file: "items/v64_" + k + ".png", dataUrl: url, width: 24, height: 24 };
  const mi = matIcon;
  matIcon = function (k) {
    const f = MATS[k]?.f || k;
    return fam[f] ? roItemIcon(fam[f]) : mi.call(this, k);
  };
  if (typeof roDropItemId === "function") {
    const di = roDropItemId;
    roDropItemId = function (d) {
      const f = d && d.mat && MATS[d.mat]?.f;
      return f && fam[f] ? fam[f] : di.call(this, d);
    };
  }
  // 魔力礦石不再能用 Zeny 購買
  for (const k of ["e", "b", "y"]) delete CRAFT[k];
  V5_MAT_ROWS.push(["高純礦石", V64_HI], ["傳說門票", ["lg1", "tk1"]]);
  // 點選素材：顯示目前的用途（舊說明是 v5 以前的萃取用途；魔力礦石原本沒有說明會出錯）
  const mo = matOpen;
  matOpen = function (t) {
    const txt = V64_MAT_USE[t],
      a = MATS[t];
    if (!txt || !a) return mo.call(this, t);
    $("#sheet").className = "matp";
    $("#sheet").innerHTML = `<div class="row" style="flex-wrap:nowrap">${matCell(t)}<div class="grow"><b>${a.n}</b><div class="note" style="margin:0">持有 <span class="px">${S.mat[t] || 0}</span></div></div></div><div class="cfl">${txt
      .split("；")
      .map((x) => `<div>${x}</div>`)
      .join("")}</div><div class="row"><span class="spacer"></span><button class="btn primary" data-act="close">知道了</button></div>`;
    $("#sheetBg").hidden = false;
  };
  // 掉落：一般魔力礦石 ×1/10；Lv70 以上地圖頭目每色 3% 高純度
  const rm = rollMats;
  rollMats = function (L, boss, elite, ...x) {
    const out = rm.call(this, L, boss, elite, ...x).filter((k) => (k === "e1" || k === "b1" || k === "y1" ? RAND() < V64_ORE.keep : true));
    if (S?.alchOn && boss && L >= V64_ORE.hiLv && G && !G.arena && !G.tw && G.guard == null && G.trial == null)
      for (const k of V64_HI) if (RAND() < V64_ORE.hiMap) out.push(k);
    return out;
  };
  // 無限武鬥場：頭目關掉落高純度魔力礦石，所有怪物有機率掉落 MVP 門票
  const tc = twClear;
  twClear = function (m, ...x) {
    const ra = roArenaOn(),
      f = G.tw?.f || 0,
      boss = !!G.tw?.boss;
    const r = tc.call(this, m, ...x);
    if (ra && boss && f >= 10) {
      const p = Math.min(1, V64_ORE.arena.base + V64_ORE.arena.step * (Math.floor(f / 10) - 1)),
        src = m && m.x != null ? m : { x: G.pl.x, y: G.pl.y };
      if (RAND() < p) for (let i = 0, n = f >= V64_ORE.arena.two ? 2 : 1; i < n; i++) dropMat(src, V64_HI[ri(0, 2)]);
    }
    return r;
  };
  const tk = twKill;
  twKill = function (m, ...x) {
    if (m && !m.add && roArenaOn()) {
      const k = Math.floor(((G.tw.f || 1) - 1) / 10),
        P = m.tw === 2 ? V64_TK.boss : m.elite ? V64_TK.elite : V64_TK.mob;
      if (RAND() < P[0] + P[1] * k) dropMat(m, "tk1");
    }
    return tk.call(this, m, ...x);
  };
}

// ---------------------------------------------------------------------------
// 鑲嵌、拆卸、合成：史詩以上用高純度礦石；合成與拆卸數量＝階級平方；拆卸成功率 50%，失敗卡片消失
function v64CardInstall() {
  v5Insert = function (u, i, id) {
    const it = v5Find(u),
      c = V5_CARD[id],
      st = v5St();
    if (!it || !c || !it.cards || it.cards[i] || !v5CardOk(c, it.slot) || !(st.cards[id] > 0)) return;
    const z = v5InsZeny(c.t),
      ore = v64OreK("e", c.t),
      lg = v64LgOn();
    if (!((S.mat[ore] || 0) > 0) || S.ash < z) return void toast(`需要「${MATS[ore].n}」與 Zeny ${fmt(z)}`, "bad");
    const prot = !lg && ui.v5prot ? (c.t <= 3 && S.mat.p1 > 0 ? "p1" : S.mat.p2 > 0 ? "p2" : null) : null;
    S.mat[ore]--;
    S.ash -= z;
    if (lg) S.mat.lg1--;
    if (prot) S.mat[prot]--;
    const ok = lg || RAND() * 100 < V5_INS_OK[c.t];
    let lost = false;
    st.cards[id]--;
    if (ok) it.cards[i] = id;
    else if (prot || RAND() < 0.5) st.cards[id]++;
    else lost = true;
    if (!st.cards[id]) delete st.cards[id];
    ui.v5res = {
      t: performance.now(),
      ok,
      txt: ok ? `鑲嵌成功：${c.n}${lg ? "（傳說的魔力礦石）" : ""}` : lost ? `鑲嵌失敗，${c.n}損毀了` : `鑲嵌失敗，${c.n}${prot ? `受${MATS[prot].n}保護` : ""}已退回`,
    };
    ui.v5pick = null;
    sfx(ok ? "alch" : "alchF", ok ? Math.min(3, c.t) : 1);
    recalc();
    markDirty();
    ui.refreshIf("alch", "bag", "char");
  };
  v5Remove = function (u, i) {
    const it = v5Find(u),
      id = it?.cards?.[i],
      c = V5_CARD[id];
    if (!c) return;
    const z = v5RemZeny(c.t),
      ore = v64OreK("y", c.t),
      n = v64OreN(c.t),
      lg = v64LgOn();
    if ((S.mat[ore] || 0) < n || S.ash < z) return void toast(`需要「${MATS[ore].n}」×${n} 與 Zeny ${fmt(z)}`, "bad");
    S.mat[ore] -= n;
    S.ash -= z;
    if (lg) S.mat.lg1--;
    it.cards[i] = null;
    const ok = lg || RAND() * 100 < V64_REM_OK;
    if (ok) v5GainCard(id);
    ui.v5res = { t: performance.now(), ok, txt: ok ? `已拆下：${c.n}${lg ? "（傳說的魔力礦石）" : ""}` : `拆卸失敗，${c.n}消失了` };
    sfx(ok ? "alch" : "alchF", 1);
    recalc();
    markDirty();
    ui.refreshIf("alch", "bag", "char");
  };
  v5Fuse = function (ids) {
    const st = v5St();
    if (!ids || ids.length !== 3) return;
    const t = V5_CARD[ids[0]]?.t;
    if (!t || t >= 6 || ids.some((id) => V5_CARD[id]?.t !== t)) return;
    const need = {};
    for (const id of ids) need[id] = (need[id] || 0) + 1;
    if (Object.entries(need).some(([id, n]) => (st.cards[id] || 0) < n)) return;
    const z = v5FuseZeny(t),
      ore = v64OreK("b", t),
      n = v64OreN(t);
    if ((S.mat[ore] || 0) < n || S.ash < z) return void toast(`需要「${MATS[ore].n}」×${n} 與 Zeny ${fmt(z)}`, "bad");
    S.mat[ore] -= n;
    S.ash -= z;
    for (const [id, k] of Object.entries(need)) (st.cards[id] -= k) || delete st.cards[id];
    const got = v63FuseRoll(t);
    const first = v5GainCard(got.id);
    ui.v5res = { t: performance.now(), ok: got.t >= t, txt: `合成獲得：${V5_TIER[got.t].n}「${got.n}」${v63FuseTag(t, got)}${first ? "（新蒐藏！）" : ""}` };
    ui.v5fp = [];
    sfx(got.t < t ? "alchF" : "alch", Math.min(3, got.t));
    markDirty();
    ui.refreshIf("alch");
  };
  // 批次合成：先試算，再依試算次數合成（一般與高純度藍礦分開計算）
  v54FusePlan = function (apply) {
    const o = v54Opt(),
      st = v5St(),
      out = { n: 0, z: 0, b: 0, b2: 0, got: [], up: 0, down: 0 },
      plan = {},
      used = { b1: 0, b2: 0 },
      snap = { ...st.cards };
    let zz = 0;
    const poolOf = (cards, t) => {
      const pool = [];
      for (const c of V5_CARDS) if (c.t === t) for (let i = 0; i < (cards[c.id] || 0) - o.fk; i++) pool.push(c.id);
      return pool;
    };
    for (let t = 1; t <= Math.min(5, o.fmax); t++) {
      plan[t] = 0;
      const ore = v64OreK("b", t),
        need = v64OreN(t),
        z = v5FuseZeny(t);
      for (;;) {
        const pool = poolOf(snap, t);
        if (pool.length < 3 || (S.mat[ore] || 0) - used[ore] < need || S.ash - zz < z) break;
        for (const id of pool.slice(-3)) snap[id]--;
        plan[t]++;
        zz += z;
        used[ore] += need;
      }
    }
    if (!apply) {
      for (const t in plan) out.n += plan[t];
      return Object.assign(out, { z: zz, b: used.b1, b2: used.b2 });
    }
    for (let t = 1; t <= Math.min(5, o.fmax); t++)
      for (let k = 0; k < (plan[t] || 0); k++) {
        const pool = poolOf(st.cards, t),
          ore = v64OreK("b", t),
          need = v64OreN(t),
          z = v5FuseZeny(t);
        if (pool.length < 3 || (S.mat[ore] || 0) < need || S.ash < z) break;
        S.mat[ore] -= need;
        S.ash -= z;
        for (const id of pool.slice(-3)) (st.cards[id] -= 1) || delete st.cards[id];
        const got = v63FuseRoll(t);
        v5GainCard(got.id);
        out.got.push(got);
        out.n++;
        out.z += z;
        out[ore === "b1" ? "b" : "b2"] += need;
        if (got.t > t) out.up++;
        else if (got.t < t) out.down++;
      }
    if (out.n) later(0.3, () => toast(`批次合成 ${out.n} 次：升階 ${out.up}、降階 ${out.down}、同階 ${out.n - out.up - out.down}`, out.up ? "lvl" : "", 1));
    return out;
  };
  // 精煉：勾選傳說的魔力礦石必定成功（武器 +6 以上仍需神工匠的祝福）
  const vr = v5Refine;
  v5Refine = function (u, ...x) {
    const it = v5Find(u);
    if (!it || (it.ref || 0) >= 10 || !v64LgOn()) return vr.call(this, u, ...x);
    const lv = (it.ref || 0) + 1,
      ok0 = V5_REF_OK[lv],
      prot = ui.v5prot,
      z0 = S.ash;
    V5_REF_OK[lv] = 100;
    ui.v5prot = false;
    try {
      vr.call(this, u, ...x);
    } finally {
      V5_REF_OK[lv] = ok0;
      ui.v5prot = prot;
    }
    if (S.ash < z0) {
      S.mat.lg1--;
      if (ui.v5res) ui.v5res.txt += "（傳說的魔力礦石）";
      markDirty();
      ui.refreshIf("alch");
    }
  };
}
const v64LgBox = () =>
  `<label class="chk v64lg"><input type="checkbox" data-v64lg ${ui.v64lg ? "checked" : ""} ${(S.mat.lg1 || 0) > 0 ? "" : "disabled"}><span>使用「傳說的魔力礦石」：必定成功（每次消耗 1 顆）　持有 <span class="px">${S.mat.lg1 || 0}</span></span></label>`;
function v64CardUiInstall() {
  const rt = v5RefTab;
  v5RefTab = function (...x) {
    let h = rt.apply(this, x);
    if (!h.includes('data-v5="refine"')) return h;
    if (v64LgOn()) h = h.replace(/成功率 <b class="px">\d+%<\/b>/, '成功率 <b class="px">100%</b>');
    return h.replace(/(<button class="btn primary" data-v5="refine")/, `${v64LgBox()}$1`);
  };
  v5SockTab = function () {
    const list = v5GearList((t) => t.cs > 0);
    let it = v5Find(ui.v5sel);
    if (!it || !list.includes(it)) it = list[0] || null;
    ui.v5sel = it?.u ?? null;
    const st = v5St(),
      lg = v64LgOn();
    let top = '<p class="empty-note">沒有帶卡片插槽的裝備。<br>插槽數依稀有度決定，高插槽非常稀有：武器最多 7 孔（主宰），其他部位最多 4 孔（主宰）。</p>';
    if (it) {
      const slots = it.cards
        .map((id, i) => {
          const c = V5_CARD[id];
          if (c) {
            const ore = v64OreK("y", c.t),
              n = v64OreN(c.t),
              z = v5RemZeny(c.t),
              can = v5Have(ore, n) && S.ash >= z;
            return `<div class="v5slot on" style="--tc:${V5_TIER[c.t].c}"><img src="${roItemIcon(4001)}" alt=""><div class="grow">${v5CardName(c)} ${v5TierTag(c.t)}<div class="s">${esc(v5CardText(c))}</div><div class="v5cost">${v5MatTag(ore, n)}${v5ZenyTag(z)}<span class="note" style="margin:0">拆卸成功率 ${lg ? 100 : V64_REM_OK}%${lg ? "" : "・失敗時卡片消失"}</span></div></div><button class="btn sm" data-v5="rem" data-u="${it.u}" data-i="${i}" ${can ? "" : "disabled"}>拆卸</button></div>`;
          }
          const open = ui.v5pick === i;
          return `<div class="v5slot${open ? " pick" : ""}"><span class="v5hole"></span><div class="grow"><span>第 ${i + 1} 孔・空</span></div><button class="btn sm${open ? " primary" : ""}" data-v5="pick" data-i="${i}">${open ? "收起" : "選擇卡片"}</button></div>`;
        })
        .join("");
      let pick = "";
      if (ui.v5pick != null && it.cards[ui.v5pick] == null) {
        const ct = typeof v65Opt === "function" ? +v65Opt("sock").ct || 0 : 0,
          pf = typeof v65PickFilt === "function" ? v65PickFilt() : "",
          own = V5_CARDS.filter((c) => st.cards[c.id] > 0 && v5CardOk(c, it.slot) && (!ct || c.t === ct)).sort((a, b) => b.t - a.t);
        pick = own.length
          ? `${pf}<div class="list v5pickl">${own
              .map((c) => {
                const ore = v64OreK("e", c.t),
                  z = v5InsZeny(c.t),
                  can = v5Have(ore) && S.ash >= z;
                return `<div class="li"><img class="v5ic" src="${roItemIcon(4001)}" alt="" style="--rc:${V5_TIER[c.t].c}"><div class="grow"><div class="t">${v5CardName(c)} ${v5TierTag(c.t)} <span class="px">×${st.cards[c.id]}</span></div><div class="s">${esc(v5CardText(c))}</div><div class="s">成功率 <b class="px">${lg ? 100 : V5_INS_OK[c.t]}%</b>${lg ? "" : "・失敗時卡片 50% 機率損毀"}・消耗${MATS[ore].n} ×1</div></div><button class="btn sm primary" data-v5="ins" data-u="${it.u}" data-i="${ui.v5pick}" data-k="${c.id}" ${can ? "" : "disabled"}>鑲嵌 <span class="px">${v5InsZeny(c.t)}</span></button></div>`;
              })
              .join("")}</div>`
          : `${pf}<p class="note">${ct ? "沒有符合篩選的卡片。" : `沒有可鑲嵌在${V5_PART[V5_SLOT_PART[it.slot]]}的卡片。`}</p>`;
      }
      top = `<div class="board v5sel">${ui.itemHead(it)}<div class="v5cost">${v5MatTag("e1")}${v5MatTag("e2")}<span class="note" style="margin:0">鑲嵌每次 1 顆：普通～稀有卡用紅色，史詩以上用高純度紅色</span></div>
      ${v64LgBox()}
      <label class="chk"><input type="checkbox" data-v5="prot" ${ui.v5prot ? "checked" : ""} ${lg ? "disabled" : ""}><span>使用保護：鑲嵌失敗時卡片必定退回（稀有以下用鐵匠的祝福，史詩以上用神工匠的祝福）　持有 <span class="px">${S.mat.p1 || 0}</span>／<span class="px">${S.mat.p2 || 0}</span></span></label>
      <div class="v5slots">${slots}</div>${pick}</div>`;
    }
    return `${top}<h3>選擇裝備</h3><div class="list">${list.map((t) => v5GearRow(t, t === it, `插槽 ${t.cards.filter(Boolean).length}/${t.cs}`)).join("")}</div>`;
  };
  v5FuseTab = function () {
    const st = v5St(),
      fp = (ui.v5fp ||= []),
      t = fp.length ? V5_CARD[fp[0]].t : 0,
      used = (id) => fp.filter((x) => x === id).length;
    const picks = [0, 1, 2]
      .map((i) => {
        const c = V5_CARD[fp[i]];
        return c
          ? `<button class="v5fp on" data-v5="funpick" data-i="${i}" style="--tc:${V5_TIER[c.t].c}"><img src="${roItemIcon(4001)}" alt=""><span>${esc(c.n)}</span></button>`
          : '<div class="v5fp"><span class="v5hole"></span><span>空</span></div>';
      })
      .join("");
    const z = t ? v5FuseZeny(t) : 0,
      ore = v64OreK("b", t || 1),
      n = t ? v64OreN(t) : 0,
      can = fp.length === 3 && v5Have(ore, n) && S.ash >= z;
    const fo = typeof v65Opt === "function" ? v65Opt("fuse") : { part: "", t: 0, sort: "tier" },
      byN = (a, b) => st.cards[b.id] - st.cards[a.id] || a.n.localeCompare(b.n),
      byName = (a, b) => a.n.localeCompare(b.n);
    const groups = [1, 2, 3, 4, 5, 6]
      .filter((tier) => !+fo.t || tier === +fo.t)
      .map((tier) => {
        const own = V5_CARDS.filter((c) => c.t === tier && st.cards[c.id] > 0 && (!fo.part || c.p === fo.part));
        if (fo.sort === "n") own.sort(byN);
        else if (fo.sort === "name") own.sort(byName);
        if (!own.length) return "";
        const total = own.reduce((k, c) => k + st.cards[c.id], 0);
        return `<h3 class="hrow">${v5TierTag(tier)} <span class="px">${total}</span> 張${tier < 6 && total >= 3 ? `<span class="spacer"></span><button class="btn sm" data-v5="fauto" data-v="${tier}">自動選 3 張</button>` : ""}</h3><div class="v5cgrid">${own
          .map((c) => {
            const left = st.cards[c.id] - used(c.id),
              dis = tier >= 6 || left <= 0 || fp.length >= 3 || (t && t !== tier);
            return `<button class="v5mini" data-v5="fpick" data-k="${c.id}" style="--tc:${V5_TIER[c.t].c}" ${dis ? "disabled" : ""}><b>${esc(c.n)}</b><span class="px">×${left}</span><small>${V5_PART[c.p]}</small></button>`;
          })
          .join("")}</div>`;
      })
      .join("");
    return `<div class="board v5sel"><p class="note" style="margin:0 0 6px">放入 3 張同階卡片，合成 1 張隨機卡片：${V63_FUSE_TXT}（普通卡不會降階；神話卡片無法再合成）。藍色魔力礦石＝階級平方：普通 1、精良 4、稀有 9 顆；史詩 16、傳說 25 顆高純度藍色。</p><div class="v5fps">${picks}</div>
    ${t ? `<div class="v5cost">${v5MatTag(ore, n)}${v5ZenyTag(z)}<span class="note" style="margin:0">→ 隨機卡片（多半為同階）</span></div>` : ""}
    <div class="row"><button class="btn" data-v5="fclear" ${fp.length ? "" : "disabled"}>清除</button><span class="spacer"></span><button class="btn primary" data-v5="fuse" ${can ? "" : "disabled"}>合成</button></div></div>
    ${typeof v65FuseFilt === "function" ? v65FuseFilt() : ""}${groups || (fo.part || +fo.t ? '<p class="empty-note">沒有符合篩選的卡片。</p>' : '<p class="empty-note">還沒有卡片。<br>擊殺怪物有機率掉落卡片，菁英與頭目機率更高。</p>')}`;
  };
  const ch = v54CardsHtml;
  v54CardsHtml = function (...a) {
    const h = ch.apply(this, a);
    if (!h.includes('data-v54="fuse"')) return h;
    const p = v54FusePlan(false),
      cost = [`Zeny <span class="px">${fmt(p.z)}</span>`, p.b ? `藍色魔力礦石 <span class="px">${p.b}</span>` : "", p.b2 ? `高純度藍色 <span class="px">${p.b2}</span>` : ""].filter(Boolean).join("・");
    return h.replace(
      /<button class="btn" data-v54="fuse"[\s\S]*?<\/button>\s*<p class="note" style="margin:0">[\s\S]*?<\/p>/,
      `<button class="btn" data-v54="fuse" ${p.n ? "" : "disabled"}>合成 <span class="px">${p.n}</span> 次（${cost}）</button>
      <p class="note" style="margin:0">藍色魔力礦石＝階級平方（普通 1、精良 4、稀有 9；史詩 16、傳說 25 顆改用高純度藍色）；目前藍礦 <span class="px">${S.mat.b1 || 0}</span>、高純度藍礦 <span class="px">${S.mat.b2 || 0}</span>。</p>`,
    );
  };
  document.addEventListener("change", (e) => {
    const b = e.target.closest && e.target.closest("[data-v64lg]");
    if (!b) return;
    ui.v64lg = !!b.checked;
    ui.render();
  });
}

// ---------------------------------------------------------------------------
// MVP 武道場
const V64_MVP = [
  { k: "moonlight", n: "月夜貓", el: "fire", tpl: "wolf", sk: ["charge", "meteor"], ph: "loli", h: 15, uq: "v64_moon", c: "#ff8a3a", col: ["#ffd0a0", "#ff8a3a", "#a03a1a"] },
  { k: "mistress", n: "蜂后", el: "wind", tpl: "bat", sk: ["volley", "mark"], ph: "golden_thief_bug", h: 14, uq: "v64_mistress", c: "#9ae05a", col: ["#f0f8a0", "#9ae05a", "#4a7a2a"] },
  { k: "maya", n: "蟻后", el: "earth", tpl: "golem", sk: ["slam", "roots"], ph: "turtle_general", h: 16, uq: "v64_maya", c: "#d8a85a", col: ["#f0d8a0", "#c08a3a", "#5a3a1a"] },
  { k: "garm", n: "冰狼哈提", el: "water", tpl: "wolf", sk: ["charge", "cross"], ph: "stormy_knight", h: 16, uq: "v64_hati", c: "#7ad4ff", col: ["#e0f8ff", "#7ad4ff", "#2a6a9a"] },
  { k: "dracula", n: "德古拉男爵", el: "shadow", tpl: "imp", sk: ["mark", "volley"], ph: "dark_lord", h: 16, uq: "v64_dracula", c: "#b06aff", col: ["#e8d0ff", "#9a4ae0", "#3a1a5a"] },
  { k: "drake", n: "海盜德瑞克", el: "undead", tpl: "knight", sk: ["charge", "slam"], ph: "abyss_knight", h: 15, uq: "v64_drake", c: "#9ad8b0", col: ["#e0fff0", "#7ac8a0", "#2a4a3a"] },
  { k: "darklord", n: "闇答萊屍", el: "ghost", tpl: "knight", sk: ["meteor", "cross"], ph: "dark_lord", h: 18, uq: "v64_dlord", c: "#8a6aff", col: ["#e0d8ff", "#7a5ae0", "#2a1a4a"] },
];
const V64_UQ = {
  v64_moon: {
    n: "月夜貓的鈴鐺", slot: "ring", hi: 2, v: [25, 12, 60, 25], src: "mvp", ico: 2607,
    mods: (t) => ({ evap: t(0), move: t(1), res_fire: t(3) }),
    on: {
      dodge: () => {
        G.v64moon = 1;
      },
      hit: () => {
        G.v64moon = 0;
      },
    },
    hitMul: (d) => (G.v64moon ? d * (1 + uv("v64_moon", 2) / 100) : d),
    d: "閃避值 +{0}%；移動速度 +{1}%；閃避攻擊後，下一次擊中的傷害 +{2}%；火屬性抗性 +{3}%",
  },
  v64_mistress: {
    n: "蜂后的薄翼", slot: "gloves", hi: 2, v: [15, 20, 40, 25], src: "mvp", ico: 2504,
    mods: (t) => ({ aspd: t(0), ax_shk: t(2) / 100, res_wind: t(3) }),
    on: {
      basicHit: (m) => {
        if (alive(m) && RAND() < uv("v64_mistress", 1) / 100) ailment(m, "shk", 0, 1);
      },
    },
    d: "攻擊速度 +{0}%；普攻擊中時 {1}% 機率使敵人感電；感電效果 +{2}%；風屬性抗性 +{3}%",
  },
  v64_maya: {
    n: "蟻后的甲殼盾", slot: "shield", hi: 2, v: [45, 10, 40, 25], src: "mvp", ico: 2104,
    mods: (t) => ({ armorp: t(0), dmgTaken: t(1) / 100, thorn: t(2) / 100, res_earth: t(3) }),
    d: "護甲 +{0}%；受到的傷害 −{1}%；受到攻擊時，對攻擊者造成護甲值 {2}% 的傷害；地屬性抗性 +{3}%",
  },
  v64_hati: {
    n: "哈提的冰牙頭盔", slot: "helm", hi: 2, v: [20, 15, 15, 25], src: "mvp", ico: 2213,
    mods: (t) => ({ chlVul: t(2) / 100, res_water: t(3) }),
    more: (t) => ({ skill: t(0) }),
    on: {
      hit: (m, dmg) => {
        if (alive(m) && RAND() < uv("v64_hati", 1) / 100) ailment(m, "chl", dmg, 1);
      },
    },
    d: "技能傷害額外 +{0}%；擊中時 {1}% 機率使敵人冰緩；冰緩中的敵人受到的傷害 +{2}%；水屬性抗性 +{3}%",
  },
  v64_dracula: {
    n: "德古拉的禮服", slot: "chest", hi: 2, v: [12, 1.5, 25, 25], src: "mvp", ico: 2316,
    mods: (t) => ({ leech: t(1) / 100, res_shadow: t(3) }),
    more: (t) => ({ life: t(0) }),
    hitMul: (d) => (S.hp < PS.maxhp * 0.5 ? d * (1 + uv("v64_dracula", 2) / 100) : d),
    d: "最大生命額外 +{0}%；擊中吸血 {1}%；自身生命低於 50% 時，造成的傷害 +{2}%；暗屬性抗性 +{3}%",
  },
  v64_drake: {
    n: "德瑞克的船長靴", slot: "boots", hi: 2, v: [18, 3, 20, 25], src: "mvp", ico: 2406,
    mods: (t) => ({ move: t(0), lokp: t(1) / 100, res_undead: t(3) }),
    on: {
      kill: () => {
        G.v64drake = G.t + 4;
      },
    },
    d: "移動速度 +{0}%；擊殺時回復 {1}% 最大生命；擊殺後 4 秒內攻擊速度 +{2}%；不死屬性抗性 +{3}%",
  },
  v64_dlord: {
    n: "闇答萊屍的冥王項鍊", slot: "amulet", hi: 2, v: [10, 20, 8, 150, 25], src: "mvp", ico: 2604,
    mods: (t) => ({ cdr: t(0), boss: t(1) / 100, res_ghost: t(4) }),
    on: {
      hit: (m, dmg) => {
        if (!alive(m) || (G.v64met || 0) > G.t || RAND() >= uv("v64_dlord", 2) / 100) return;
        G.v64met = G.t + 0.5;
        const R = 24 * (PS.area || 1),
          k = uv("v64_dlord", 3) / 100;
        roPushFx(G.fx, { k: "boom", x: m.x, y: m.y - 3, r: 0.6 * R, t: 0, life: 0.35, c: "#9a6aff" });
        sfx("big");
        for (const e of mobsNear(m.x, m.y - 3, R)) dealMob(e, dmg * k, false, "#b08aff", "uq:v64_dlord");
      },
    },
    d: "冷卻縮減 +{0}%；對菁英與 Boss 傷害 +{1}%；擊中時 {2}% 機率降下隕石，對周圍敵人造成該次傷害 {3}% 的傷害（0.5 秒內最多一次）；念屬性抗性 +{4}%",
  },
};
function v64MvpInstall() {
  // 專屬裝備
  for (const [k, u] of Object.entries(V64_UQ)) {
    UNIQUE[k] = u;
    u.ic = "u_" + k;
    ICONS["u_" + k] ||= ICONS.sw0;
    roItemFiles["u_" + k] = u.ico;
  }
  SPD_AS.push({ k: "uq:v64_drake", f: () => (PS.U?.v64_drake && G.v64drake > G.t ? 1 + uv("v64_drake", 2) / 100 : 1) });
  // MVP 怪物：生命與傷害倍率比照第 50 層頭目（第 50 層使用的地圖頭目種類）
  const ref = MON[MAPS[(V64_MVP_FLOOR - 1) % MAP_N]?.bt] || MON.knight,
    spr = window.RO_MVP_ASSETS?.monsters || {},
    DN = ["south", "southwest", "west", "northwest", "north", "northeast", "east", "southeast"];
  RO.assets.monsters ||= {};
  for (const d of V64_MVP) {
    const type = "v64_" + d.k,
      tp = MON[d.tpl] || MON.knight;
    MON[type] = { n: d.n, hp: ref.hp, dmg: ref.dmg, spd: tp.spd, ...(tp.ranged ? { ranged: tp.ranged } : {}) };
    MON_H[type] = d.h;
    MON_COLS[type] = d.col;
    V5_MOB_EL[type] = d.el;
    BOSS_SKS[type] = d.sk;
    const a = spr[d.k];
    if (a) {
      const states = {};
      for (const [st, rows] of Object.entries(a.states)) {
        const dirs = rows.map((r, i) => ({ file: a.file, ox: 0, oy: r[6], frameWidth: r[0], frameHeight: r[1], frames: r[2], durations: r[3], anchor: [r[4], r[5]], ks: a.ks || 1, direction: DN[i] }));
        states[st] = { ...dirs[0], directions: dirs };
      }
      RO.assets.monsters["mvp_" + d.k] = { job: a.job, name: d.n, states, lazy: 1 }; // 進入挑戰頁或開戰時才載入
      roMonsterKeys[type] = "mvp_" + d.k;
    } else roMonsterKeys[type] = d.ph;
  }
  ARENA.v64mvp = {
    n: "MVP 武道場",
    v: { ...ARENA.trial.v, p: ["#22142c", "#382044", "#4a2a58", "#663a76"], q: ["#22142c", "#382044", "#4a2a58"], amb: [0.44, 34, 10, 30], ring: "#ff7ad8" },
  };
  // 屬性：MVP 的攻擊屬性固定
  const me = v5MobEl;
  v5MobEl = function (m) {
    return m && m.v64 ? V5_MOB_EL[m.type] || "neutral" : me.call(this, m);
  };
  // 勝利、失敗
  const bw = bossWin;
  bossWin = function (...a) {
    return G.v64mvp ? v64MvpWin() : bw.apply(this, a);
  };
  const fb = failBoss;
  failBoss = function (...a) {
    const on = !!G.v64mvp;
    const r = fb.apply(this, a);
    if (on) (G.v64mvp = null), (G.bn = null), ui.refreshIf("map");
    return r;
  };
  const sb = stBoss;
  stBoss = function (...a) {
    if (!G.v64mvp) return sb.apply(this, a);
  };
  // 卡片：比照武鬥場第 50 層頭目
  const vo = v5OnKill;
  v5OnKill = function (m) {
    if (!m || !m.v64) return vo.call(this, m);
    const f = V64_MVP_FLOOR;
    if (RAND() < Math.min(V5_DROP.arenaMax, V5_DROP.arena + V5_DROP.arenaUp * (f / 10 - 1)) * V5.dropMul) v5Drop(m, v5RollCard("arena", f));
  };
  // 闇答萊屍改為 MVP 武道場的 MVP：移除終局頁的舊入口（無限印記已移除）
  ui.monBoard = () => "";
  // 挑戰頁
  const pm = ui.p_map;
  ui.p_map = function (...a) {
    const h = pm.apply(this, a);
    return this.mapView === "ch" && S ? h + v64MvpCard() : h;
  };
  document.addEventListener("click", (e) => {
    if (e.target.closest && e.target.closest("[data-v64mvp]")) v64MvpStart();
  });
}
// MVP 動畫圖集：用到時才載入
function v64MvpLoad(k) {
  for (const d of V64_MVP) {
    if (k && d.k !== k) continue;
    const a = RO.assets.monsters?.["mvp_" + d.k];
    if (!a) continue;
    const src = RO.root + a.states.idle.file;
    if (RO.images[src] || v64MvpLoad.p[src] || RO.failed.includes(src)) continue;
    v64MvpLoad.p[src] = 1;
    const im = new Image();
    im.onload = () => (RO.images[src] = im);
    im.onerror = () => RO.failed.push(src);
    im.src = src;
  }
}
v64MvpLoad.p = {};
function v64MvpCard() {
  v64MvpLoad();
  const st = v64St(),
    n = S.mat.tk1 || 0,
    open = S.lvl >= RO_ARENA.minLv,
    can = open && canStart() && n >= V64_TK.need;
  const list = V64_MVP.map(
    (d) =>
      `<div class="v64mvp-i" style="--mc:${d.c}"><b>${d.n}</b><span>${V5_EL[d.el]}屬性</span><small title="${esc(uqText(d.uq))}">${esc(UNIQUE[d.uq].n)}${st.uq[d.k] ? " ✓" : ""}</small><em>擊敗 <span class="px">${st.w[d.k] || 0}</span></em></div>`,
  ).join("");
  return `<section class="ro-arena-card v64mvp"><h3>MVP 武道場${helpBtn("v64mvp")}</h3><p class="note">消耗 ${V64_TK.need} 張 MVP 門票，隨機挑戰 1 隻帶屬性的 MVP：強度相當於無限武鬥場第 ${V64_MVP_FLOOR} 層頭目，限時 ${V64_MVP_T} 秒。勝利必得 ${V64_ORE.mvp} 顆高純度魔力礦石，${V64_MVP_P.lg * 100}% 掉落傳說的魔力礦石、${V64_MVP_P.uq * 100}% 掉落該 MVP 的專屬裝備。</p><div class="v64mvps">${list}</div><div class="row"><span><img class="v64tk" src="${matIcon("tk1")}" alt="">MVP 門票 <b class="px">${n}/${V64_TK.need}</b></span><span class="spacer"></span><button class="btn sm primary" data-v64mvp ${can ? "" : "disabled"}>${G?.v64mvp ? "挑戰中" : open ? "挑戰 MVP" : `Lv.${RO_ARENA.minLv} 開放`}</button></div></section>`;
}
function v64MvpStart(k) {
  if (!S || !G || !canStart() || S.lvl < RO_ARENA.minLv || (S.mat.tk1 || 0) < V64_TK.need) return;
  const d = V64_MVP.find((x) => x.k === k) || V64_MVP[ri(0, V64_MVP.length - 1)];
  v64MvpLoad(d.k);
  S.mat.tk1 -= V64_TK.need;
  const x = enterArena(ARENA.v64mvp),
    lv = Math.min(LV_CAP, S.lvl),
    m = addMob("v64_" + d.k, lv, x, (G.top + G.H) / 2, { boss: 1, sl: 1 });
  const hs = Math.pow(RO_ARENA.hp, V64_MVP_FLOOR - 1) * TW.bhp;
  m.hp = m.max = m.max * hs;
  if (m.sh) m.sh = m.shm = m.shm * hs;
  m.dmg *= Math.pow(RO_ARENA.dmg, V64_MVP_FLOOR - 1);
  Object.assign(m, { spawnT: 1, ag: true, bn: d.n, v64: d.k });
  m.spd *= BOSS_SK.spd / 0.8;
  m.bs = { t: BOSS_SK.first, i: 0, ks: d.sk.slice() };
  inArena(m);
  G.boss = m;
  G.bn = d.n;
  G.bossT = V64_MVP_T;
  G.v64mvp = { k: d.k };
  G.flashes.push({ x, y: m.y - 10, t: 0, ring: 1, c: d.c });
  shake(0.3);
  sfx("boss");
  toast(`MVP 武道場：${d.n}（${V5_EL[d.el]}屬性）出現！限時 ${V64_MVP_T} 秒`, "bad");
  v64St().n++;
  markDirty();
  ui.hud(true);
  ui.refreshIf("map");
}
function v64MvpWin() {
  const m = G.boss,
    k = G.v64mvp.k,
    d = V64_MVP.find((x) => x.k === k),
    st = v64St();
  G.boss = null;
  G.v64mvp = null;
  G.bn = null;
  arenaOut(6);
  ses().boss++;
  st.w[k] = (st.w[k] || 0) + 1;
  const src = { x: m?.x ?? G.pl.x, y: m?.y ?? G.pl.y, lv: Math.max(90, S.lvl) },
    got = [];
  for (let i = 0; i < V64_ORE.mvp; i++) dropMat(src, V64_HI[ri(0, V64_HI.length - 1)]);
  if (RAND() < V64_MVP_P.lg) dropMat(src, "lg1"), got.push("傳說的魔力礦石");
  if (RAND() < V64_MVP_P.uq) dropItem(src, { uniq: 1, uqk: d.uq, extra: 1 }), got.push(UNIQUE[d.uq].n), (st.uq[k] = 1);
  sfx("win");
  shake(0.4);
  toast(`擊敗 MVP「${d.n}」！${got.length ? "掉落：" + got.join("、") : ""}`, got.length ? "r4" : "lvl", got.length ? 1 : 0);
  markDirty();
  ui.hud(true);
  ui.refreshIf("map");
}

// ---------------------------------------------------------------------------
// 獨特武器：武器種類跟著目前角色的轉職分支（未轉職跟一轉職業）
const V64_WNOUN = {
  ro_sword_0: "矛", ro_sword_1: "矛", ro_sword_2: "劍", ro_sword_3: "劍",
  ro_bow_0: "弓", ro_bow_1: "弓", ro_bow_2: "弩", ro_bow_3: "琴",
  ro_mage_0: "杖", ro_mage_1: "書", ro_mage_2: "杖", ro_mage_3: "杖",
  ro_thief_0: "拳刃", ro_thief_1: "短劍", ro_thief_2: "拳刃", ro_thief_3: "匕首",
  ro_acolyte_0: "錘", ro_acolyte_1: "拳套", ro_acolyte_2: "錘", ro_acolyte_3: "拳套",
  ro_merchant_0: "斧", ro_merchant_1: "斧", ro_merchant_2: "斧", ro_merchant_3: "斧",
  "c:sword": "劍", "c:bow": "弓", "c:mage": "杖", "c:thief": "短劍", "c:acolyte": "錘", "c:merchant": "斧",
};
const v64WKey = () => (S?.tal?.asc && RO_WB[S.tal.asc] ? S.tal.asc : "c:" + S.cls);
const v64WDef = (key) => V5_WEX[String(key).replace(/^c:/, "")] || V5_WEX[S.cls] || V5_WEX.sword;
const v64WSpec = (key) => (String(key).startsWith("c:") ? null : Object.values(RO_ASC_SPEC).flat().find((sp) => ASC_KEY_OF(sp) === key)?.[7] || null);
const v64UqW = (it) => !!(it && it.slot === "weapon" && it.uq && it.v5 && !it.my && UNIQUE[it.uq] && !UNIQUE[it.uq].my);
function v64UqFit(it) {
  if (!S || !v64UqW(it)) return false;
  const key = v64WKey();
  if (it.v64w === key) return false;
  const L = it.ilvl || 1,
    w = WEAPON[S.cls] || WEAPON.sword,
    s = w.a + w.k * L,
    [lo, hi] = V5_Q_UQ,
    q0 = (it.q || 100) / 100;
  // 基底傷害的品質（目前職業單位），換算到新的單手／雙手
  let qw = q0;
  if (it.wd) {
    const b = s * V5_WK(L) * (it.h2 ? V5_H2 : 1);
    qw = (it.wd[0] / (0.75 * b) + it.wd[1] / (1.25 * b)) / 2;
  }
  qw = clamp(qw, lo, hi);
  const [h2, def] = v64WDef(key),
    spec = v64WSpec(key),
    m = V5_WK(L) * (h2 ? V5_H2 : 1) * qw;
  it.wd = [
    Math.max(1, Math.round(0.75 * s * m)),
    Math.max(2, Math.round(1.25 * s * m)),
    +(w.aps * V5_WAPS * (spec ? spec[2] : 1)).toFixed(2),
    w.c + (spec ? spec[3] : 0),
  ];
  it.v5aps = 1;
  it.roWbAdj = 1;
  it.h2 = h2 ? 1 : 0;
  // 額外素質：保留原本各項的品質，換成新分支的素質
  const old = v64WDef(it.v64w || it.roWb || "c:" + S.cls)[1] || {},
    lvF = (k) => (V5_FLAT.has(k) ? 1 : v5Lv(L)),
    qs = (it.bx || [])
      .map((b) => {
        const base = (V5_REF[b.k] || 0) * (old[b.k] || 0) * V5_XW * lvF(b.k);
        return base > 0 ? b.v / base : null;
      })
      .filter((x) => x && isFinite(x)),
    avg = qs.length ? qs.reduce((a, b) => a + b, 0) / qs.length : q0;
  it.bx = Object.entries(def).map(([k, wt], i) => {
    const q = clamp(qs[i] ?? avg, lo, hi),
      v = (V5_REF[k] || 0) * wt * V5_XW * lvF(k) * q;
    return { k, v: k === "crit" ? Math.max(0.1, +v.toFixed(1)) : Math.max(1, Math.round(v)) };
  });
  // 種類名稱
  const bi = Math.max(0, it.bi ?? 0);
  if (key.startsWith("c:")) {
    delete it.roWb;
    const names = BASES.weapon[S.cls] || [];
    if (names.length) it.base = names[Math.min(names.length - 1, bi)];
  } else {
    it.roWb = key;
    it.base = RO_WB[key][0][Math.min(3, bi)];
  }
  it.v64w = key;
  v5Name(it);
  return true;
}
function v64UqWeaponInstall() {
  // 其他職業也能從倉庫取用獨特武器（取出後自動換成該職業的武器種類）
  for (const u of Object.values(UNIQUE)) if (u.slot === "weapon" && !u.my && !u.retired) u.any = 1;
  const mk = makeItem;
  makeItem = function (...a) {
    const it = mk.apply(this, a);
    if (v64UqW(it)) v64UqFit(it);
    return it;
  };
  const vn = v5Name;
  v5Name = function (it) {
    vn(it);
    if (!v64UqW(it) || !it.v64w || !it.name) return;
    const n0 = UNIQUE[it.uq].n,
      noun = V64_WNOUN[it.v64w],
      mm = noun && n0.match(/^(.+之)(刃|劍|拳)$/);
    if (mm && mm[2] !== noun) it.name = it.name.replace(n0, mm[1] + noun);
  };
  const ik = iconKey;
  iconKey = function (t) {
    if (v64UqW(t) && t.v64w) {
      if (t.roWb && RO_WB[t.roWb]) return "rowb_" + t.roWb + "_3";
      const set = ICON_SET.weapon[S?.cls];
      if (set) return set[Math.min(set.length - 1, baseIdx(t))];
    }
    return ik(t);
  };
  const rc = recalc;
  recalc = function (...a) {
    if (S && S.equip && S.cls) {
      let ch = 0;
      if (v64UqFit(S.equip.weapon)) ch = 2;
      for (const it of S.bag || []) if (it && it.slot === "weapon" && it.uq && v64UqFit(it)) ch ||= 1;
      if (ch) {
        markDirty();
        if (ch === 2) later(0.5, () => toast(`獨特武器已配合目前職業調整為「${S.equip.weapon?.base || "武器"}」`, "lvl"));
      }
    }
    return rc.apply(this, a);
  };
}

// ---------------------------------------------------------------------------
// 網址版自動更新（修正）：倒數改以真實時間計算並由 Worker 驅動，背景分頁不會被瀏覽器節流卡住；
// 背景分頁且不在戰鬥中時直接存檔重整；第一次檢查失敗不會讓檢查永久失效；請求 10 秒逾時。
const V64_UPD = { every: 120, timeout: 10000 };
const v64Upd = { last: 0, prev: 0, remain: 60000, going: false };
async function v64UpdSig() {
  const sig = {};
  await Promise.all(
    v63UpdFiles().map(async (f) => {
      const ac = typeof AbortController === "function" ? new AbortController() : null,
        tm = ac ? setTimeout(() => ac.abort(), V64_UPD.timeout) : 0;
      try {
        const r = await fetch(f, { method: "HEAD", cache: "no-store", ...(ac ? { signal: ac.signal } : {}) });
        if (r.ok) sig[f] = r.headers.get("etag") || r.headers.get("last-modified") || r.headers.get("content-length") || "";
      } catch (e) {
      } finally {
        if (tm) clearTimeout(tm);
      }
    }),
  );
  return sig;
}
v63UpdCheck = async function () {
  if (v63Upd.found || v63Upd.busy) return;
  v63Upd.busy = true;
  v64Upd.last = Date.now();
  try {
    const sig = await v64UpdSig(),
      keys = Object.keys(sig).filter((f) => sig[f]);
    if (!keys.length) return;
    const base = (v63Upd.base ||= {});
    let changed = false;
    for (const f of keys)
      if (!base[f]) base[f] = sig[f];
      else if (base[f] !== sig[f]) changed = true;
    if (changed) {
      v63Upd.found = true;
      v64Upd.prev = Date.now();
      v64Upd.remain = V63_UPD.count * 1000;
      v64UpdStep();
    }
  } finally {
    v63Upd.busy = false;
  }
};
function v64UpdStep() {
  const now = Date.now();
  if (v64Upd.going) return;
  if (!v63Upd.found) {
    if (now - v64Upd.last >= V64_UPD.every * 1000) v63UpdCheck();
    return;
  }
  const dt = Math.min(5000, Math.max(0, now - (v64Upd.prev || now)));
  v64Upd.prev = now;
  if (v63UpdFight()) return v63UpdBanner("遊戲有新版本，戰鬥結束後將自動存檔並重新整理");
  if (document.hidden) return v63UpdGo();
  v64Upd.remain -= dt;
  if (v64Upd.remain <= 0) return v63UpdGo();
  v63UpdBanner(`遊戲有新版本，${Math.ceil(v64Upd.remain / 1000)} 秒後自動存檔並重新整理`);
}
v63UpdTick = v64UpdStep;
v63UpdGo = async function () {
  if (v64Upd.going) return;
  v64Upd.going = true;
  v63UpdBanner("存檔中，即將重新整理…");
  try {
    if (typeof S !== "undefined" && S && typeof saveNow === "function") await Promise.race([saveNow(1), new Promise((r) => setTimeout(r, 3000))]);
  } catch (e) {}
  location.reload();
};
v63UpdInstall = function () {
  if (!v63UpdOn() || typeof fetch !== "function") return;
  v64Upd.last = Date.now() - V64_UPD.every * 1000 + 8000; // 進遊戲約 8 秒後第一次檢查
  try {
    const w = new Worker(URL.createObjectURL(new Blob(["setInterval(()=>postMessage(0),1000)"], { type: "text/javascript" })));
    w.onmessage = () => v64UpdStep();
    v64Upd.w = w;
  } catch (e) {
    setInterval(v64UpdStep, 1000);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !v63Upd.found) v63UpdCheck();
    else v64UpdStep();
  });
};

// ---------------------------------------------------------------------------
// 說明
function v64Help() {
  const row = (k, name, txt) => {
    const rows = HELP[k]?.[1];
    if (!rows) return;
    const r = rows.find((x) => x[0] === name);
    if (r) r[1] = txt;
    else rows.push([name, txt]);
  };
  const ORE = "普通～稀有卡用紅／藍／黃色魔力礦石，史詩以上用高純度魔力礦石";
  row("alch", "鑲嵌", `把卡片插進裝備的插槽，有失敗率；也可以花費黃色魔力礦石與 Zeny 拆下卡片（成功率 ${V64_REM_OK}%，失敗時卡片消失）。${ORE}。`);
  row("alch", "素材", "用 Zeny 購買神之金屬原石與鋁原石，或把 4 個素材升級合成為高一級。魔力礦石只能靠掉落取得。");
  row("alch", "傳說的魔力礦石", "精煉、鑲嵌卡片、拆卸卡片時勾選使用，必定成功（每次 1 顆）。只由 MVP 武道場掉落。");
  row("v5sock", "消耗", `每次鑲嵌消耗 1 顆紅色魔力礦石（史詩以上改用高純度紅色）與 Zeny。`);
  row("v5sock", "拆卸", `花費黃色魔力礦石（數量＝階級平方：普通 1、精良 4、稀有 9；史詩 16、傳說 25、神話 36 顆高純度黃色）與 Zeny 拆下卡片。成功率 ${V64_REM_OK}%，失敗時卡片消失；勾選傳說的魔力礦石必定成功。`);
  row("v5sock", "傳說的魔力礦石", "勾選後鑲嵌必定成功，消耗 1 顆；此時不會使用保護祝福。");
  row("v5fuse", "消耗", "藍色魔力礦石（數量＝階級平方：普通 1、精良 4、稀有 9；史詩 16、傳說 25 顆高純度藍色）與 Zeny。");
  row("v5ref", "傳說的魔力礦石", "勾選後精煉必定成功，消耗 1 顆；武器 +6 以上仍需同時消耗神工匠的祝福。");
  row("v5mat", "魔力礦石", `紅色：鑲嵌；藍色：合成；黃色：拆卸。${ORE}。一般礦石由怪物少量掉落（頭目較多）；高純度由 Lv${V64_ORE.hiLv} 以上地圖頭目、無限武鬥場頭目關與 MVP 武道場掉落。不能用 Zeny 購買。`);
  row("v5mat", "傳說的魔力礦石", "精煉、鑲嵌、拆卸卡片必定成功。MVP 武道場 10% 掉落。");
  row("craft", "購買", "消耗 Zeny 購買神之金屬原石與鋁原石。魔力礦石只能靠掉落取得。");
  row("shop", "素材", "精煉素材在「煉金・素材」購買；魔力礦石只能靠掉落取得。");
  row("v54cards", "批次合成", `由低階到高階，把超過「每種保留」張數的卡片 3 張合成 1 張隨機卡片（${V63_FUSE_TXT}）。按下時依試算次數合成。每次消耗藍色魔力礦石（數量＝階級平方，史詩以上用高純度藍色）與 Zeny。`);
  HELP.v64mvp = [
    "MVP 武道場",
    [
      ["門票", `無限武鬥場所有怪物都有機率掉落 MVP 門票：小怪 ${V64_TK.mob[0] * 100}%、菁英 ${V64_TK.elite[0] * 100}%、頭目 ${V64_TK.boss[0] * 100}%，第 11 層起每 10 層小怪與菁英 +${V64_TK.mob[1] * 100}%、頭目 +${V64_TK.boss[1] * 100}%。`],
      ["挑戰", `在「地圖 → 挑戰」消耗 ${V64_TK.need} 張門票，隨機出現 1 隻帶屬性的 MVP，強度相當於無限武鬥場第 ${V64_MVP_FLOOR} 層頭目（沒有負面效果），限時 ${V64_MVP_T} 秒。MVP 的攻擊屬性固定，可用對應的屬性抗性減傷。`],
      ["獎勵", `必得 ${V64_ORE.mvp} 顆高純度魔力礦石；${V64_MVP_P.lg * 100}% 掉落傳說的魔力礦石；${V64_MVP_P.uq * 100}% 掉落該 MVP 的專屬裝備。另有一般頭目的裝備與卡片掉落。`],
      ...V64_MVP.map((d) => [`${d.n}（${V5_EL[d.el]}）`, `${UNIQUE[d.uq].n}（${SLOT_NAME[UNIQUE[d.uq].slot]}）：${uqText(d.uq)}`]),
    ],
  ];
  for (const v of Object.values(HELP))
    if (Array.isArray(v) && Array.isArray(v[1]) && v[1].some((r) => r[0] === "無限武鬥場") && !v[1].some((r) => r[0] === "MVP 門票"))
      v[1].push(["MVP 門票", `武鬥場怪物有機率掉落 MVP 門票，${V64_TK.need} 張可挑戰 1 次 MVP 武道場；頭目關另有 ${V64_ORE.arena.base * 100}% 機率掉落高純度魔力礦石（每 10 層 +${V64_ORE.arena.step * 100}%，第 ${V64_ORE.arena.two} 層起一次 2 顆）。`]);
  if (HELP.bag?.[1] && !HELP.bag[1].some((r) => r[0] === "獨特武器"))
    HELP.bag[1].push(["獨特武器", "獨特武器的種類會跟著目前的轉職分支（未轉職為一轉職業）：名稱、圖示、單手／雙手、攻速與暴擊、額外素質都會換算，獨特效果、品質、精煉與卡片不變。其他職業也能從倉庫取用。"]);
}

// ---------------------------------------------------------------------------
function v64Install() {
  v64MatInstall();
  v64CardInstall();
  v64CardUiInstall();
  v64MvpInstall();
  v64UqWeaponInstall();
  v64Help();
}
if (typeof roV4Install === "function") {
  const r4v64 = roV4Install;
  roV4Install = function () {
    r4v64();
    v64Install();
  };
}
