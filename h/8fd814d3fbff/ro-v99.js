/* 流浪仙境 v1.0.8（內部 v9.9）：
   1. 詩人「布拉奇之詩」切換樂章時不再跳提示（原本每次施放都跳一則、停留 5 秒，把掉落提示洗掉）；改在增益圖示列顯示目前樂章與剩餘秒數
   2. 消極模式：生命體（及其他守護型召喚物）改為自動尋怪，不再只打角色身邊的怪
   3. 多隻生命體不再重疊：附近有多隻怪時優先各打不同的怪，並互相保持距離
   4. 擊敗魔王、頭目的提示不再合併成「X3」，每次各跳一則 */

const V99 = {
  songs: [
    { n: "急速之歌", d: "攻擊速度 +25%", bg: "#8a6a1a", fg: "#fff6dc", tc: "#ffd27a" },
    { n: "專注之歌", d: "冷卻縮減 20%", bg: "#1f5a7a", fg: "#e6f6ff", tc: "#7ad4ff" },
    { n: "激昂之歌", d: "傷害 +25%", bg: "#7a2a3c", fg: "#ffe6ec", tc: "#ff8aa0" },
  ],
  gap: 11, // 生命體之間的最小距離
};
const v99Psv = () => !!(S?.set?.psv && G && !G.trn); // v1.0.11：與角色的消極模式一致（所有戰鬥，練功木樁除外）

// 1. 布拉奇之詩
function v99SongInstall() {
  if (typeof V6_CAST === "undefined" || typeof V6_CAST.song !== "function") return;
  const sg = V6_CAST.song;
  V6_CAST.song = function (...a) {
    const t0 = toast;
    toast = function (m, ...r) {
      if (typeof m === "string" && m.startsWith("樂章：")) return;
      return t0.call(this, m, ...r);
    };
    try {
      return sg.apply(this, a);
    } finally {
      toast = t0;
    }
  };
  if (typeof HUD_BUFF === "undefined") return;
  const cur = () => {
    const g = G?.v6;
    if (!g || g.song < 0 || !V99.songs[g.song]) return null;
    const left = (g.buf["song" + g.song] || 0) - G.t;
    return left > 0 ? { i: g.song, left } : null;
  };
  // 每首歌一個圖示（顏色不同），同時只會亮一個
  V99.songs.forEach((s, i) =>
    HUD_BUFF.push({
      k: "v99song" + i,
      n: () => (cur()?.i === i ? 1 : 0),
      left: () => (cur()?.i === i ? cur().left : 0),
      bg: s.bg,
      fg: s.fg,
      tc: s.tc,
      tip: (n, l) => ["布拉奇之詩・" + s.n, [s.d, `剩餘 ${l.toFixed(1)} 秒`, "每次施放換下一首"]],
      art: ["...XX..", "...X.X.", "...X..X", "...X...", ".XXX...", "XXXX...", ".XX...."],
    }),
  );
}

// 2～3. 生命體：消極模式自動尋怪；分散目標與站位
function v99GspInstall() {
  if (typeof tickGsp !== "function" || typeof GSP === "undefined") return;
  const tg = tickGsp;
  tickGsp = function (t, ...x) {
    const pl = G?.pl,
      list = G?.gsp || [];
    const psv = v99Psv();
    const range = psv ? 1e5 : GSP.follow;
    // 先分配目標：已經有人打的怪，附近還有別的怪時，換一隻沒人打的
    if (pl && list.length > 1 && G.mobs.length > 1) {
      const used = new Set();
      for (const e of list) {
        const ok = alive(e.tgt) && e.tgt.spawnT <= 0 && dist(e.tgt, pl) <= range + 20;
        if (ok && (e.tgt.boss || !used.has(e.tgt))) { // v1.0.12：頭目可以多隻一起打
          used.add(e.tgt);
          continue;
        }
        let best = null,
          bd = 1e9;
        for (const m of G.mobs) {
          if (m.spawnT > 0 || used.has(m) || dist(m, pl) > range) continue;
          const d = dist(m, e);
          if (d < bd) (bd = d), (best = m);
        }
        if (best) {
          e.tgt = best;
          used.add(best);
        }
      }
    }
    // 消極模式：搜尋範圍不限（原本只找角色周圍的怪）
    let r;
    if (psv) {
      const f = GSP.follow;
      GSP.follow = 1e5;
      try {
        r = tg.call(this, t, ...x);
      } finally {
        GSP.follow = f;
      }
    } else r = tg.call(this, t, ...x);
    // 互相保持距離（避免疊在一起）；v1.0.12：多隻同時圍著頭目時推 3 輪才分得開
    for (let it = 0; it < 3; it++)
    for (let i = 0; i < list.length; i++)
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i],
          b = list[j];
        let dx = b.x - a.x,
          dy = b.y - a.y,
          d = Math.hypot(dx, dy);
        if (d >= V99.gap) continue;
        if (d < 0.01) {
          const ang = ((i * 7 + j * 3) % 12) * 0.5236;
          (dx = Math.cos(ang)), (dy = Math.sin(ang)), (d = 1);
        }
        const push = (V99.gap - d) / 2;
        a.x -= (dx / d) * push;
        a.y -= (dy / d) * push;
        b.x += (dx / d) * push;
        b.y += (dy / d) * push;
        inArena(a);
        inArena(b);
      }
    return r;
  };
}

// 4. 擊敗提示不合併（同樣的文字會被合併成「X3」，這裡讓每則略有不同；加的是看不見的字元）
function v99ToastInstall() {
  const t0 = toast;
  let n = 0;
  toast = function (m, ...r) {
    if (typeof m === "string" && m.startsWith("擊敗")) m += "⁠".repeat((n++ % 9) + 1);
    return t0.call(this, m, ...r);
  };
}

function v99Install() {
  v99SongInstall();
  v99GspInstall();
  v99ToastInstall();
}
if (typeof roV4Install === "function") {
  const r4v99 = roV4Install;
  roV4Install = function () {
    r4v99();
    v99Install();
  };
}
