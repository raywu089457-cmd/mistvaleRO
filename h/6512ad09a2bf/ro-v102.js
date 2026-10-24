/* 流浪仙境 v1.0.12（內部 v10.2）：召喚物優先攻擊頭目
   1. 守護型（生命體召喚、英靈召喚）：搜尋範圍內有頭目時全部改打頭目（多隻仍互相保持距離；消極模式下搜尋範圍是全地圖）
   2. 跟隨型（召喚元素精靈、樂靈合奏、天使降臨）：頭目在場時改打頭目（侵略、守護模式皆同）
   3. 砲台（獵鷹召喚、FAW 砲台設置）：射程內有頭目時優先打頭目
   頭目＝地圖頭目、魔王、MVP、活動頭目、無限武鬥場頭目關等標記為頭目的怪物 */

// 離 from 最近、在 range 內、可攻擊的頭目
function v102Boss(from, range = Infinity) {
  let best = null,
    bd = range;
  for (const m of G?.mobs || []) {
    if (!m.boss || m.spawnT > 0 || !alive(m)) continue;
    const d = from ? dist(m, from) : 0;
    if (d <= bd) (bd = d), (best = m);
  }
  return best;
}

function v102Install() {
  // 1. 守護型：先把目標設成頭目（v1.0.8 的分散目標會保留頭目目標）
  if (typeof tickGsp === "function" && typeof GSP !== "undefined") {
    const tg = tickGsp;
    tickGsp = function (t, ...x) {
      const pl = G?.pl,
        list = G?.gsp || [];
      if (pl && list.length) {
        const psv = typeof v99Psv === "function" && v99Psv();
        const b = v102Boss(pl, psv ? Infinity : GSP.follow);
        if (b) for (const e of list) e.tgt = b;
      }
      return tg.call(this, t, ...x);
    };
  }
  // 2. 跟隨型：頭目在場就打頭目（守護模式原本每幀重選角色身邊的怪，這時暫時改用一般選目標）
  if (typeof tickMins === "function") {
    const tm = tickMins;
    tickMins = function (t, ...x) {
      const b = G?.mins?.length ? v102Boss(G.pl) : null;
      if (!b) return tm.call(this, t, ...x);
      for (const e of G.mins) e.tgt = b;
      const g = S.set.minG;
      S.set.minG = 0;
      try {
        return tm.call(this, t, ...x);
      } finally {
        S.set.minG = g;
      }
    };
  }
  // 3. 砲台：逐座處理；射程內有頭目的砲台只看頭目
  if (typeof tickTurs === "function" && typeof TUR !== "undefined") {
    const tt = tickTurs;
    tickTurs = function (t, ...x) {
      const b = G?.turs?.length ? v102Boss() : null;
      if (!b) return tt.call(this, t, ...x);
      const all = G.turs,
        mobs = G.mobs,
        keep = [];
      try {
        for (const s of all) {
          G.turs = [s];
          G.mobs = alive(b) && dist(b, s) < TUR.r ? [b] : mobs;
          tt.call(this, t, ...x);
          keep.push(...G.turs);
        }
      } finally {
        G.mobs = mobs;
        G.turs = keep;
      }
    };
  }
}
if (typeof roV4Install === "function") {
  const r4v102 = roV4Install;
  roV4Install = function () {
    r4v102();
    v102Install();
  };
}
