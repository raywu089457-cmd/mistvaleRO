/* 流浪仙境 v1.2.2：朱諾占卜師與天氣占卜（v1.2.6：天氣畫面效果改為半透明；v1.2.7：粒子減半、畫面中央淡出、雷電較少）
   1. 朱諾新增 NPC「占卜師」（RO 原版 NPC 圖 4_F_MADAME）：占卜接下來 4 小時的天氣，冷卻 4 小時（現實時間，關閉遊戲也會倒數；各角色分開）。
   2. 7 種天氣：天氣種類取自 RO 原版的地圖天氣效果；加成參考《RO 新啟航》的天氣增益與 RO 賢者的屬性場地技能（火山爆發、大洪水、暴風）。
      屬性傷害加成只計算有屬性的技能（普攻、無屬性技能不計），與其他增傷獨立乘算。
   3. 戰鬥畫面的天氣效果（雨、雪、沙、雷、霧、陽光、櫻花；手機版減量，可在天氣詳情關閉），畫面左上角顯示天氣與剩餘時間。 */

const V125 = {
  dur: 4 * 3600e3, // 天氣持續＝占卜冷卻
  el: 0.15, // 屬性傷害加成
  fxA: 0.45, // v1.2.6：天氣畫面效果整體不透明度（原本 1，太搶戰鬥畫面）
  pos: [0.5, 0.25], // 朱諾的位置（場地比例）
  cur: null, // 目前生效的天氣（collectMods 時更新）
  S: null,
  fresh: false,
  icon: {},
};
// w：占卜機率權重；el：屬性傷害 +15%；mods：素質；more：獨立乘算；regen：生命回復倍率；card：卡片掉落率
const V125_WX = {
  sun: { n: "晴天", w: 25, c: "#ffb347", d: "陽光普照，火焰的力量變得旺盛。", el: ["fire"], mods: { aspd: 5 } },
  rain: { n: "小雨", w: 20, c: "#5a9ae0", d: "細雨綿綿，水的力量滋潤著大地。", el: ["water"], regen: 0.3 },
  sand: { n: "沙暴", w: 15, c: "#c9a060", d: "黃沙漫天，大地的力量躁動不安。", el: ["earth"], mods: { evap: 10 } },
  storm: { n: "雷雨", w: 15, c: "#8a7ae8", d: "雷聲轟隆，風暴的力量充斥天空。", el: ["wind"], mods: { crit: 5 } },
  snow: { n: "下雪", w: 12, c: "#7ab8e8", d: "白雪紛飛，寒氣凍住敵人的腳步。", mods: { roElHit_chl: 0.1, chlVul: 0.1 } },
  fog: { n: "起霧", w: 10, c: "#8a94a6", d: "濃霧瀰漫，黑暗與幽魂在霧中低語。", el: ["shadow", "ghost"], mods: { dmgTaken: 0.05 } },
  sakura: { n: "櫻花", w: 3, c: "#ff8ab8", d: "櫻花飛舞，難得一見的好兆頭。", more: { dmg: 10 }, mods: { move: 10 }, card: 0.2 },
};
const V125_ORDER = ["sun", "rain", "sand", "storm", "snow", "fog", "sakura"];

// ---------------------------------------------------------------------------
// 狀態
function v125Left() {
  const w = typeof S !== "undefined" && S ? S.v125wx : null;
  if (!w || !V125_WX[w.k]) return 0;
  const now = Date.now();
  if (now < w.t) w.t = now; // 系統時間往回調：從現在重新計時
  return Math.max(0, V125.dur - (now - w.t));
}
const v125Live = () => (v125Left() > 0 ? S.v125wx.k : null);
const v125Wx = () => V125.cur;
function v125Fmt(ms) {
  const s = Math.ceil(ms / 1000),
    h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60);
  return `${h}:${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
const v125Pct = (v) => `${Math.round(v * 100)}%`;
// 加成說明
function v125Lines(k) {
  const W = V125_WX[k],
    out = [];
  if (!W) return out;
  if (W.el) out.push(`${W.el.map((e) => V5_EL[e]).join("、")}屬性傷害 +${v125Pct(V125.el)}`);
  for (const [s, v] of Object.entries(W.mods || {})) out.push(v5Line(s, v));
  if (W.regen) out.push(`每秒生命回復 +${v125Pct(W.regen)}`);
  for (const [s, v] of Object.entries(W.more || {})) out.push(`${s === "dmg" ? "總傷害" : V5_MORE[s] || s} +${v}%`);
  if (W.card) out.push(`卡片掉落率 +${v125Pct(W.card)}`);
  return out;
}
function v125Divine() {
  if (!S || v125Live()) return;
  const tot = V125_ORDER.reduce((s, k) => s + V125_WX[k].w, 0);
  let r = Math.random() * tot,
    k = V125_ORDER[0];
  for (const x of V125_ORDER) if ((r -= V125_WX[x].w) < 0) {
    k = x;
    break;
  }
  S.v125wx = { k, t: Date.now() };
  S.v125n = (S.v125n || 0) + 1;
  recalc();
  markDirty();
  sfx(k === "sakura" ? "big" : "lvl");
  toast(`占卜結果：${V125_WX[k].n}（持續 4 小時）`, k === "sakura" ? "r3" : "lvl");
  V125.fresh = true;
  if (typeof v113In === "function" && v113In()) v113Talk("fortune");
  V125.fresh = false;
  v125Chip();
  ui.refreshIf("char");
  ui.refreshIf("map");
}
// 每秒：天氣到期、剩餘時間
function v125Sec() {
  if (typeof S === "undefined" || !S || typeof PS === "undefined" || !PS || typeof G === "undefined" || !G) return v125Chip();
  const live = v125Live(),
    same = V125.S === S,
    old = V125.cur;
  if (live !== old) {
    recalc();
    V125.cur = live;
    if (same && old && !live) toast(`天氣「${V125_WX[old].n}」結束了，可以再到朱諾找占卜師占卜`, "lvl");
    ui.refreshIf("char");
  }
  V125.S = S;
  v125Chip();
  const t = v125Fmt(v125Left());
  for (const el of document.querySelectorAll("[data-v125left]")) if (el.textContent !== t) el.textContent = t;
}

// ---------------------------------------------------------------------------
// 圖示（16×16 像素，程式繪製）
function v125Icon(k) {
  if (V125.icon[k] != null) return V125.icon[k];
  let url = "";
  try {
    const cv2 = document.createElement("canvas");
    cv2.width = cv2.height = 16;
    const c = cv2.getContext("2d");
    const R = (col, x, y, w, h) => ((c.fillStyle = col), c.fillRect(x, y, w, h));
    const cloud = (col, y) => {
      R(col, 3, y + 2, 10, 3);
      R(col, 5, y, 4, 2);
      R(col, 9, y + 1, 3, 1);
      R(col, 2, y + 3, 12, 2);
    };
    if (k === "sun") {
      R("#ffb32a", 5, 5, 6, 6);
      R("#ffd84a", 6, 6, 3, 3);
      for (const [x, y, w, h] of [[7, 1, 2, 3], [7, 12, 2, 3], [1, 7, 3, 2], [12, 7, 3, 2], [3, 3, 2, 2], [11, 3, 2, 2], [3, 11, 2, 2], [11, 11, 2, 2]]) R("#ff9a2a", x, y, w, h);
    } else if (k === "rain") {
      cloud("#8aa4c0", 2);
      for (const [x, y] of [[4, 10], [8, 11], [12, 10], [6, 13], [10, 14]]) R("#3a8ae0", x, y, 1, 2);
    } else if (k === "sand") {
      for (const [y, x] of [[3, 2], [7, 4], [11, 1]]) {
        R("#c9a060", x, y, 10, 2);
        R("#8a6a3a", x + 9, y - 1, 2, 2);
      }
      for (const [x, y] of [[13, 5], [2, 9], [12, 13]]) R("#a07a40", x, y, 1, 1);
    } else if (k === "storm") {
      cloud("#5a6078", 1);
      R("#ffd84a", 8, 7, 2, 3);
      R("#ffd84a", 6, 9, 3, 2);
      R("#ffd84a", 7, 11, 2, 3);
      R("#ffd84a", 6, 14, 1, 1);
    } else if (k === "snow") {
      R("#4a8ad0", 7, 1, 2, 14);
      R("#4a8ad0", 1, 7, 14, 2);
      for (let i = 0; i < 5; i++) {
        R("#4a8ad0", 3 + i * 2, 3 + i * 2, 2, 2);
        R("#4a8ad0", 11 - i * 2, 3 + i * 2, 2, 2);
      }
      R("#ffffff", 7, 7, 2, 2);
    } else if (k === "fog") {
      R("#9aa4b4", 2, 3, 10, 2);
      R("#7a8496", 4, 7, 11, 2);
      R("#9aa4b4", 1, 11, 9, 2);
    } else if (k === "sakura") {
      for (const [x, y] of [[6, 1], [11, 5], [9, 11], [3, 11], [1, 5]]) R("#ff9ac0", x, y, 4, 4);
      R("#ffc0d8", 5, 5, 6, 6);
      R("#ffd84a", 7, 7, 2, 2);
    } else {
      // 水晶球
      R("#b07ae8", 4, 2, 8, 8);
      R("#d8b8ff", 3, 4, 10, 4);
      R("#ffffff", 5, 4, 2, 2);
      R("#8a5a3a", 3, 11, 10, 2);
      R("#5a3a24", 2, 13, 12, 2);
    }
    url = cv2.toDataURL ? cv2.toDataURL() : "";
  } catch (e) {}
  return (V125.icon[k] = url || "");
}

// ---------------------------------------------------------------------------
// 畫面左上角的天氣小卡、天氣詳情
function v125Chip() {
  if (typeof document === "undefined") return;
  let el = document.getElementById("v125wx");
  if (!el) {
    const wrap = document.getElementById("stageWrap");
    if (!wrap || !wrap.appendChild) return;
    el = document.createElement("button");
    el.className = "chip";
    el.id = "v125wx";
    el.type = "button";
    el.hidden = true;
    wrap.appendChild(el);
  }
  const on = typeof S !== "undefined" && !!S && typeof G !== "undefined" && !!G;
  if (el.hidden === on) el.hidden = !on;
  if (!on) return;
  v125Place(el);
  const k = V125.cur,
    html = k
      ? `<img src="${v125Icon(k)}" alt="">${V125_WX[k].n}<b class="px">${v125Fmt(v125Left())}</b>`
      : `<img src="${v125Icon("ball")}" alt="">可占卜天氣`;
  if (el.innerHTML !== html) el.innerHTML = html;
  el.classList.toggle("ready", !k);
  el.title = k ? "天氣加成（點擊查看）" : "到朱諾找占卜師占卜天氣";
}
// 位置：畫面上方 HUD 區的右下角（DPS 下方）
function v125Place(el) {
  const cvs = document.getElementById("stage"),
    wrap = document.getElementById("stageWrap");
  if (!cvs || !wrap || !cvs.getBoundingClientRect) return;
  const r = cvs.getBoundingClientRect(),
    w = wrap.getBoundingClientRect();
  if (!r.height) return;
  // HUD 區夠高時放在 DPS 下方，太矮（手機）就放在 HUD 區正下方
  const band = (G.top || 30) * (r.height / (G.VH || G.H)),
    ch = el.offsetHeight || 24,
    y = band >= 100 ? band - ch - Math.max(4, band * 0.05) : band + 4,
    top = Math.round(r.top - w.top + y) + "px",
    right = Math.round(w.right - r.right + 8) + "px";
  if (el.style.top !== top) el.style.top = top;
  if (el.style.right !== right) el.style.right = right;
}
function v125Sheet() {
  const k = V125.cur,
    W = V125_WX[k];
  if (!W) return v125Go();
  const fx = S.set?.v125fx !== 0;
  $("#sheet").className = "v125s";
  $("#sheetBg").hidden = false;
  $("#sheet").innerHTML =
    `<h2>天氣${typeof helpBtn === "function" ? helpBtn("v125wx") : ""}</h2>` +
    `<div class="v125hd" style="--wc:${W.c}"><img src="${v125Icon(k)}" alt=""><div><b>${W.n}</b><small>${W.d}</small></div></div>` +
    `<ul class="v125ls">${v125Lines(k).map((l) => `<li>${l}</li>`).join("")}</ul>` +
    `<p class="note">剩餘 <b class="px" data-v125left>${v125Fmt(v125Left())}</b>，結束後可以再到朱諾找占卜師占卜。</p>` +
    `<label class="v125fx"><input type="checkbox" data-v125fx ${fx ? "checked" : ""}>顯示天氣畫面效果</label>` +
    `<div class="row"><span class="spacer"></span><button class="btn" data-act="close">關閉</button></div>`;
}
// 前往朱諾找占卜師
function v125Go() {
  if (!S || !G || typeof v113Enter !== "function") return;
  if (v113In() && G.arena.v113 === "yuno") return v113Talk("fortune");
  if (ui.tab !== "map") ui.setTab("map");
  v113Enter("yuno", () => v113Talk("fortune"));
}

// ---------------------------------------------------------------------------
// 占卜師對話
function v125Dlg() {
  const k = V125.cur,
    list = V125_ORDER.map((x) => V125_WX[x].n + (x === "sakura" ? "（稀有）" : "")).join("、");
  if (!k)
    return [
      `水晶球裡藏著天空的秘密……要我為你占卜接下來 4 小時的天氣嗎？不同的天氣會帶來不同的祝福。<span class="note">可能出現：${list}。占卜後 4 小時內不能再占卜。</span>`,
      [v113Opt("v125div", "占卜天氣", { s: "持續 4 小時・冷卻 4 小時", p: 1 })],
    ];
  const W = V125_WX[k],
    head = V125.fresh ? `水晶球亮了起來……浮現的是「<b>${W.n}</b>」！` : `水晶球裡仍映著「<b>${W.n}</b>」。`;
  return [
    `${head}${W.d}<div class="v125dl">${v125Lines(k).join("<br>")}</div><span class="note">剩餘 <b class="px" data-v125left>${v125Fmt(v125Left())}</b>，之後再來找我吧。</span>`,
    [v113Opt("v125div", "占卜天氣", { s: "冷卻中", dis: 1 })],
  ];
}
function v125NpcInstall() {
  if (typeof V113_NPC === "undefined" || typeof V113_TOWNS === "undefined") return;
  V113_NPC.fortune = { n: "占卜師", t: "占卜師", sub: "天氣占卜", job: 915, spr: "npc/npc_915.png", cut: "" };
  V113_TOWNS.yuno.npc.fortune = V125.pos;
  const vn = v113Npcs;
  v113Npcs = function (...a) {
    const r = vn.apply(this, a),
      T = v113Town();
    if (T && T.npc.fortune && G) r.push({ k: "fortune", x: Math.round(T.npc.fortune[0] * G.W), y: Math.round(G.top + T.npc.fortune[1] * (G.H - G.top)) });
    return r;
  };
  const dl = v113Dlg;
  v113Dlg = function (k, ...a) {
    return k === "fortune" ? v125Dlg() : dl.call(this, k, ...a);
  };
  const act = v113Act;
  v113Act = function (a, k, ...x) {
    if (a === "v125div") return void v125Divine();
    return act.call(this, a, k, ...x);
  };
  // 可以占卜時頭上顯示「!」
  const dn = v113DrawNpc;
  v113DrawNpc = function (c, n, ...a) {
    const r = dn.call(this, c, n, ...a);
    if (n && n.k === "fortune" && !V125.cur) {
      const im = v113Img(V113_NPC.fortune.spr);
      if (v113Ok(im)) {
        const h = im.naturalHeight * V113.sc,
          b = Math.round(Math.sin(G.t * 5) * 1.2);
        ptext(c, "!", n.x - 1, n.y - h - 6 + b, "#ffd84a", 2, "#5a3200");
      }
    }
    return r;
  };
  // 地圖頁：朱諾的 NPC 按鈕
  const th = v113TownsHtml;
  v113TownsHtml = function (...a) {
    const h = th.apply(this, a),
      T = v113Town();
    if (!T || !T.npc.fortune || !h.includes('<div class="v113npcs">')) return h;
    const N = V113_NPC.fortune,
      b = `<button class="v113n" data-v113="npc" data-k="fortune"><span class="v113ni"><img src="${V113.root + N.spr}" alt="">${V125.cur ? "" : '<i class="dot"></i>'}</span><b>${N.n}</b><small>${N.sub}</small></button>`;
    return h.replace('<div class="v113npcs">', '<div class="v113npcs v125n5">').replace(/<\/div><\/div>$/, b + "</div></div>");
  };
  if (Array.isArray(HELP.v113?.[1])) {
    const rows = HELP.v113[1],
      r = rows.find((x) => x[0] === "NPC");
    if (r) r[1] = "點畫面上的 NPC，或地圖頁的 NPC 按鈕即可對話。每座城鎮都有相同的 4 位 NPC，朱諾另有占卜師。";
    if (!rows.some((x) => x[0] === "占卜師")) {
      const i = rows.findIndex((x) => x[0] === "哈米德");
      rows.splice(i < 0 ? rows.length : i + 1, 0, ["占卜師", "只在朱諾：占卜接下來 4 小時的天氣並獲得天氣加成，冷卻 4 小時（詳見「天氣占卜」說明）。"]);
    }
  }
}

// ---------------------------------------------------------------------------
// 加成
function v125HitEl(o) {
  if (!o) return null;
  if (o.v6el) return o.v6el;
  if (o.skill) {
    const g = o.v6g || (typeof v6CtxGem === "function" ? v6CtxGem() : null),
      el = g && SKILLS[g.id]?.el;
    if (el) return el;
  }
  return (o.ail && typeof V6_AIL_EL !== "undefined" && V6_AIL_EL[o.ail]) || null;
}
function v125BuffInstall() {
  const cm = collectMods;
  collectMods = function (...a) {
    const out = cm.apply(this, a),
      k = (V125.cur = v125Live()),
      W = V125_WX[k];
    if (!W) return out;
    const src = "天氣・" + W.n;
    for (const [s, v] of Object.entries(W.mods || {})) out.push({ s, v, src });
    for (const [s, v] of Object.entries(W.more || {})) out.push({ s, v, src, x: "more" });
    return out;
  };
  // 小雨：生命回復（每次重算後套用一次）
  const rc = recalc;
  recalc = function (...a) {
    const r = rc.apply(this, a),
      W = V125_WX[V125.cur];
    if (W && W.regen && PS && !PS.v125r) {
      PS.regen *= 1 + W.regen;
      PS.v125r = 1;
    }
    return r;
  };
  // 屬性傷害
  const els = () => V125_WX[V125.cur]?.el || null;
  HIT_MUL.push({
    k: "v125:wx",
    lab: (t) => {
      const e = els();
      return !!(e && t && e.includes(t.el)) && `天氣・${V125_WX[V125.cur].n}：${V5_EL[t.el]}屬性 ×${1 + V125.el}`;
    },
    f: (t, m, o) => {
      const e = els();
      if (!e) return t;
      const el = v125HitEl(o);
      return el && e.includes(el) ? t * (1 + V125.el) : t;
    },
    estSk: (R, l, a) => {
      const e = els();
      return e && a && e.includes(a.el) ? 1 + V125.el : 1;
    },
  });
  // 櫻花：卡片掉落率
  const card = (f) =>
    function (...a) {
      const c = V125_WX[V125.cur]?.card;
      if (!c || typeof V5 === "undefined") return f.apply(this, a);
      const d = V5.dropMul;
      V5.dropMul = d * (1 + c);
      try {
        return f.apply(this, a);
      } finally {
        V5.dropMul = d;
      }
    };
  if (typeof v5OnKill === "function") v5OnKill = card(v5OnKill);
  if (typeof v5TowerBoss === "function") v5TowerBoss = card(v5TowerBoss);
}

// ---------------------------------------------------------------------------
// 畫面效果（畫在場景最上層、HUD 之下；只用 Math.random，不影響戰鬥亂數）
const V125FX = { k: null, ps: [], t: null, W: 0, H: 0, fl: 0, bolt: null, nb: 6 };
// v1.2.7：粒子數量約減半；畫面中央（角色與戰鬥的位置）再淡出
const V125FX_N = { sun: 12, rain: 75, storm: 85, sand: 55, snow: 45, fog: 6, sakura: 26 };
const V125_MID = { x: 0.5, y: 0.55, r0: 0.25, r1: 0.55, min: 0.12 };
function v125P(k, W, H, any) {
  const r = Math.random,
    p = { x: r() * (W + 40) - 20, y: any ? r() * H : -6, k: r() };
  if (k === "rain" || k === "storm") Object.assign(p, { l: 5 + r() * 5, v: 150 + r() * 90 });
  else if (k === "snow") Object.assign(p, { r: 0.6 + r() * 0.8, v: 9 + r() * 12, ph: r() * 6.28 });
  else if (k === "sand") Object.assign(p, { x: any ? r() * W : -8, y: r() * H, l: 1.5 + r() * 3, v: 90 + r() * 100 });
  else if (k === "fog") Object.assign(p, { x: r() * W, y: r() * H, r: 22 + r() * 24, v: 3 + r() * 5 });
  else if (k === "sakura") Object.assign(p, { v: 7 + r() * 9, a: r() * 6.28, s: (r() - 0.5) * 4, ph: r() * 6.28, c: r() < 0.5 ? "#ffb7d2" : "#ffd3e3" });
  else Object.assign(p, { y: any ? r() * H : H + 4, r: 0.5 + r() * 0.6, v: 3 + r() * 4, ph: r() * 6.28 });
  return p;
}
// 粒子在畫面中央附近逐漸淡出：越靠中央，越少粒子保留（每顆粒子各自的門檻 p.k，淡入淡出不會突然消失）
function v125A(p, W, H) {
  const M = V125_MID,
    dx = (p.x - W * M.x) / (W * 0.5),
    dy = (p.y - H * M.y) / (H * 0.5),
    d = Math.sqrt(dx * dx + dy * dy),
    keep = M.min + (1 - M.min) * clamp((d - M.r0) / M.r1, 0, 1);
  return clamp((keep - p.k) / 0.15, 0, 1);
}
// 外圍較濃、中央透明的整片色調
function v125Vig(c, W, H, rgb, a) {
  const M = V125_MID,
    g = c.createRadialGradient(W * M.x, H * M.y, Math.min(W, H) * 0.22, W * M.x, H * M.y, Math.max(W, H) * 0.75);
  g.addColorStop(0, `rgba(${rgb},0)`);
  g.addColorStop(1, `rgba(${rgb},${a})`);
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
}
function v125FxDraw(c) {
  const k = V125.cur;
  if (!k || !G || (S && S.set && S.set.v125fx === 0)) return;
  const W = G.W,
    H = G.VH || G.H,
    F = V125FX,
    dt = F.t == null ? 0 : clamp(G.t - F.t, 0, 0.1),
    A = V125.fxA;
  F.t = G.t;
  if (F.k !== k || F.W !== W || F.H !== H) {
    const n = Math.round(V125FX_N[k] * (typeof v122Mob === "function" && v122Mob() ? 0.5 : 1));
    Object.assign(F, { k, W, H, ps: Array.from({ length: n }, () => v125P(k, W, H, true)), fl: 0, bolt: null, nb: 6 });
  }
  c.save();
  c.translate(0, Math.round(G.cy || 0));
  c.globalAlpha = A;
  const ps = F.ps,
    each = (fn) => {
      for (const p of ps) {
        const a = v125A(p, W, H);
        if (a <= 0) continue;
        c.globalAlpha = A * a;
        fn(p);
      }
      c.globalAlpha = A;
    };
  if (k === "rain" || k === "storm") {
    if (k === "storm") v125Vig(c, W, H, "18,22,44", 0.3);
    for (const p of ps) {
      p.y += p.v * dt;
      p.x -= p.v * 0.3 * dt;
      if (p.y > H + 4 || p.x < -10) Object.assign(p, v125P(k, W, H, false));
    }
    c.strokeStyle = k === "storm" ? "rgba(200,212,240,.7)" : "rgba(215,228,250,.68)";
    c.lineWidth = 0.5;
    each((p) => {
      c.beginPath();
      c.moveTo(p.x, p.y);
      c.lineTo(p.x - p.l * 0.3, p.y + p.l);
      c.stroke();
    });
    if (k === "storm") {
      // 雷電：每 9～18 秒一次，只落在畫面兩側
      if ((F.nb -= dt) <= 0) {
        F.nb = 9 + Math.random() * 9;
        F.fl = 1;
        const side = Math.random() < 0.5 ? 0.08 + Math.random() * 0.2 : 0.72 + Math.random() * 0.2,
          pts = [[W * side, -2]],
          end = H * (0.35 + Math.random() * 0.3);
        while (pts[pts.length - 1][1] < end) {
          const [x, y] = pts[pts.length - 1];
          pts.push([x + (Math.random() - 0.5) * 14, y + 6 + Math.random() * 8]);
        }
        F.bolt = pts;
      }
      if (F.fl > 0) {
        F.fl = Math.max(0, F.fl - dt * 4);
        v125Vig(c, W, H, "255,255,255", 0.3 * F.fl);
        if (F.bolt && F.fl > 0.35) {
          c.strokeStyle = `rgba(255,250,210,${F.fl})`;
          c.lineWidth = 1.1;
          c.beginPath();
          F.bolt.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
          c.stroke();
        }
      }
    }
  } else if (k === "snow") {
    for (const p of ps) {
      p.y += p.v * dt;
      p.x += Math.sin(G.t * 1.6 + p.ph) * 7 * dt;
      if (p.y > H + 3) Object.assign(p, v125P(k, W, H, false));
    }
    c.fillStyle = "rgba(255,255,255,.92)";
    c.strokeStyle = "rgba(110,140,185,.35)";
    c.lineWidth = 0.3;
    each((p) => {
      c.beginPath();
      c.arc(p.x, p.y, p.r, 0, 6.283);
      c.fill();
      c.stroke();
    });
  } else if (k === "sand") {
    v125Vig(c, W, H, "205,165,95", 0.24);
    for (const p of ps) {
      p.x += p.v * dt;
      p.y += p.v * 0.08 * dt;
      if (p.x > W + 10 || p.y > H + 4) Object.assign(p, v125P(k, W, H, false));
    }
    c.strokeStyle = "rgba(200,158,88,.75)";
    c.lineWidth = 0.7;
    each((p) => {
      c.beginPath();
      c.moveTo(p.x, p.y);
      c.lineTo(p.x + p.l * 3, p.y + p.l * 0.25);
      c.stroke();
    });
  } else if (k === "fog") {
    v125Vig(c, W, H, "226,230,238", 0.22);
    for (const p of ps) {
      p.x += p.v * dt;
      if (p.x - p.r > W) Object.assign(p, v125P(k, W, H, false), { x: -p.r });
    }
    each((p) => {
      const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, "rgba(236,240,246,.38)");
      g.addColorStop(1, "rgba(236,240,246,0)");
      c.fillStyle = g;
      c.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    });
  } else if (k === "sakura") {
    for (const p of ps) {
      p.y += p.v * dt;
      p.x += (Math.sin(G.t * 1.2 + p.ph) * 9 + 5) * dt;
      p.a += p.s * dt;
      if (p.y > H + 4 || p.x > W + 8) Object.assign(p, v125P(k, W, H, false));
    }
    each((p) => {
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.a);
      c.fillStyle = p.c;
      c.beginPath();
      c.ellipse(0, 0, 1.8, 1, 0, 0, 6.283);
      c.fill();
      c.restore();
    });
  } else {
    // 晴天：左上角的暖光、兩側的光束與飄浮的光點
    const g = c.createRadialGradient(0, 0, 0, 0, 0, W * 0.8);
    g.addColorStop(0, "rgba(255,226,150,.3)");
    g.addColorStop(1, "rgba(255,226,150,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    for (const [i, x0] of [[0, 0.02], [1, 0.8]]) {
      const a = 0.06 + 0.035 * Math.sin(G.t * 0.5 + i * 2.1),
        x = W * x0;
      c.fillStyle = `rgba(255,236,170,${a})`;
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x + W * 0.07, 0);
      c.lineTo(x + W * 0.2, H);
      c.lineTo(x + W * 0.1, H);
      c.closePath();
      c.fill();
    }
    for (const p of ps) {
      p.y -= p.v * dt;
      if (p.y < -3) Object.assign(p, v125P(k, W, H, false));
    }
    each((p) => {
      c.fillStyle = `rgba(255,232,140,${0.45 + 0.4 * Math.sin(G.t * 3 + p.ph)})`;
      c.fillRect(p.x, p.y, p.r * 2, p.r * 2);
    });
  }
  c.restore();
}
function v125FxInstall() {
  if (typeof drawGlow !== "function") return;
  const dg = drawGlow;
  drawGlow = function (c, ...a) {
    const r = dg.call(this, c, ...a);
    try {
      v125FxDraw(c);
    } catch (e) {}
    return r;
  };
}

// ---------------------------------------------------------------------------
const V125_CSS = `
#v125wx{position:absolute;z-index:6;display:inline-flex;align-items:center;gap:5px;cursor:pointer;white-space:nowrap;font-size:13px!important}
#v125wx img{width:16px;height:16px;image-rendering:pixelated}
#v125wx b{font-weight:400;opacity:.75;margin-left:2px}
#v125wx.ready{color:#7a4ab0!important}
#sheet.v125s{width:min(420px,94vw)}
.v125hd{display:flex;gap:10px;align-items:center;padding:8px;border:1px solid #b9c8d8;border-left:4px solid var(--wc);border-radius:4px;background:#fbfdff}
.v125hd img{width:32px;height:32px;image-rendering:pixelated;flex:none}
.v125hd b{display:block;font-size:16px}
.v125hd small{color:#5d7186}
.v125ls{margin:8px 0;padding-left:20px;line-height:1.7}
.v125dl{margin:6px 0 0;padding:6px 8px;background:#f4f8fc;border:1px dashed #b9c8d8;border-radius:4px;line-height:1.6}
.v125fx{display:flex;gap:6px;align-items:center;margin:6px 0 8px;font-size:13px;cursor:pointer}
.v113npcs.v125n5{grid-template-columns:repeat(5,minmax(0,1fr))}`;

function v125Install() {
  if (typeof document !== "undefined" && !document.getElementById("v125css")) {
    const st = document.createElement("style");
    st.id = "v125css";
    st.textContent = V125_CSS;
    document.head.appendChild(st);
  }
  v125BuffInstall();
  v125NpcInstall();
  v125FxInstall();
  if (typeof document !== "undefined") {
    document.addEventListener(
      "click",
      (e) => {
        const t = e.target;
        if (!(t.closest && t.closest("#v125wx")) || !S) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        V125.cur ? v125Sheet() : v125Go();
      },
      true,
    );
    if (typeof window !== "undefined" && window.addEventListener) window.addEventListener("resize", () => setTimeout(v125Chip, 60));
    document.addEventListener("change", (e) => {
      const t = e.target;
      if (!t || !t.matches || !t.matches("[data-v125fx]") || !S) return;
      S.set ||= {};
      S.set.v125fx = t.checked ? 1 : 0;
      markDirty();
    });
  }
  if (typeof setInterval === "function") setInterval(() => {
    try {
      v125Sec();
    } catch (e) {}
  }, 1000);
  HELP.v125wx = [
    "天氣占卜",
    [
      ["占卜師", "朱諾的占卜師可以占卜接下來 4 小時的天氣，天氣持續期間獲得加成。占卜冷卻 4 小時（天氣結束時就能再占卜），以現實時間計算，關閉遊戲也會倒數；各角色分開計算。"],
      ...V125_ORDER.map((k) => [`${V125_WX[k].n}（${V125_WX[k].w}%）`, v125Lines(k).join("、")]),
      ["屬性傷害", "只計算有屬性的技能（技能說明前的〔火屬性〕等）；普攻與無屬性技能不計。與其他增傷獨立乘算。"],
      ["範圍", "所有地圖、頭目、魔王、試煉、無限武鬥場與城鎮都生效。"],
      ["畫面", "戰鬥畫面會顯示天氣效果（手機版減量）；左上角顯示目前天氣與剩餘時間，點擊可查看加成，並可關閉畫面效果。"],
    ],
  ];
  v125Chip();
}
if (typeof roV4Install === "function") {
  const r4v125 = roV4Install;
  roV4Install = function () {
    r4v125.apply(this, arguments);
    try {
      v125Install();
    } catch (e) {
      console.error("v125", e);
    }
  };
}
