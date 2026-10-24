/* 流浪仙境 v6.6：深淵主動性、深淵地圖畫面與音樂、線上排行即時上傳 */

// ---------------------------------------------------------------------------
// 共用：目前是否在深淵（主線深淵或活動深淵）
const v66AbyOn = () =>
  !!((typeof v56AbyActive === "function" && v56AbyActive()) || (typeof v65AbyActive === "function" && v65AbyActive()));
const v66AbyTierRaw = () =>
  typeof ssMap === "function" && ssMap() ? (typeof v65AbyTier === "function" ? v65AbyTier() : 0) : typeof v56AbyTier === "function" ? v56AbyTier() : 0;
// v7.1：深淵改為 3 階，畫面濃度換算回原本 10 階的尺度
const v66AbyTier = () => {
  const n = v66AbyTierRaw();
  return n ? Math.round((n * 10) / ((typeof V56_ABY !== "undefined" && V56_ABY.max) || 10)) : 0;
};

// ---------------------------------------------------------------------------
// 1. 深淵主動性：深淵地圖的怪物一出生就主動攻擊（不再分批拉怪）
function v66HostileInstall() {
  if (typeof roHostileMode !== "function") return;
  const hm = roHostileMode;
  roHostileMode = function (...a) {
    return hm.apply(this, a) || v66AbyOn();
  };
}

// ---------------------------------------------------------------------------
// 2. 深淵地圖畫面：地面調色＋深淵裂縫、魔法陣、結晶尖刺（Codex 繪製），上層黑霧、飄散餘燼、暗角
const V66_ART = {
  dir: "assets/ro-v3/abyss/",
  crack: ["abyss_crack_1", "abyss_crack_2", "abyss_crack_3", "abyss_crack_4"],
  rune: ["abyss_rune"],
  spike: ["abyss_spike_1", "abyss_spike_2", "abyss_spike_3"],
  fog: "abyss_fog",
};
const V66_IMG = {};
function v66Img(k) {
  if (V66_IMG[k] !== undefined) return V66_IMG[k];
  V66_IMG[k] = null;
  const im = new Image();
  im.onload = () => {
    V66_IMG[k] = im;
    // 圖片晚到：在深淵中就重建一次地面
    if (typeof G !== "undefined" && G && v66AbyOn() && !G.v66art) G.ground = null;
  };
  im.onerror = () => (V66_IMG[k] = false);
  im.src = V66_ART.dir + k + ".png";
  return null;
}
const v66Rng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
// 縮小成地圖比例的小圖（像素風：最後一步不平滑）
const V66_SCALED = {};
function v66Scaled(k, w) {
  const im = V66_IMG[k];
  if (!im) return null;
  const key = k + ":" + w;
  if (V66_SCALED[key]) return V66_SCALED[key];
  const h = Math.max(1, Math.round((im.height * w) / im.width)),
    c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d");
  x.imageSmoothingEnabled = true;
  x.imageSmoothingQuality = "high";
  x.drawImage(im, 0, 0, w, h);
  return (V66_SCALED[key] = c);
}
function v66AbyGround() {
  let g = G.ground;
  if (!g) return;
  // 地面多半是共用的 RO 地圖圖片：複製成畫布再加工，不改到原圖
  if (!g.getContext) {
    const c = document.createElement("canvas");
    c.width = g.naturalWidth || g.width;
    c.height = g.naturalHeight || g.height;
    if (!c.width || !c.height) return;
    c.getContext("2d").drawImage(g, 0, 0);
    g = G.ground = c;
  }
  const x = g.getContext("2d"),
    n = Math.max(1, v66AbyTier()),
    W = g.width,
    H = g.height,
    sx = W / G.W,
    rnd = v66Rng((S.map + 1) * 7919 + n * 104729);
  x.save();
  // 調色：整體壓暗、偏紫紅
  x.globalCompositeOperation = "multiply";
  x.fillStyle = `rgb(${185 - 5 * n},${160 - 6 * n},${192 - 4 * n})`;
  x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = "soft-light";
  x.fillStyle = `rgba(170,30,90,${0.18 + 0.02 * n})`;
  x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = "source-over";
  // 裂縫與魔法陣（固定種子，同一張地圖同一階位置相同）
  const ok = V66_ART.crack.every((k) => V66_IMG[k] !== null) && V66_IMG[V66_ART.rune[0]] !== null;
  const top = G.top || 0;
  const place = (k, w, alpha) => {
    const c = v66Scaled(k, Math.round(w * sx));
    if (!c) return;
    const px = (12 + rnd() * (G.W - 24)) * sx - c.width / 2,
      py = (top + 14 + rnd() * (G.H - top - 24)) * sx - c.height / 2;
    x.globalAlpha = alpha;
    x.drawImage(c, Math.round(px), Math.round(py));
  };
  for (let i = 0; i < 4 + n; i++) place(V66_ART.crack[Math.floor(rnd() * V66_ART.crack.length)], 34 + rnd() * 22, 0.85);
  for (let i = 0; i < 1 + Math.floor(n / 4); i++) place(V66_ART.rune[0], 40 + rnd() * 12, 0.7);
  x.restore();
  // 結晶尖刺：當作場景物件，跟角色一起依深度排序
  G.props ||= [];
  for (let i = 0; i < 2 + Math.floor(n / 2); i++) {
    const k = V66_ART.spike[Math.floor(rnd() * V66_ART.spike.length)],
      c = v66Scaled(k, Math.round(14 + rnd() * 6));
    if (!c) continue;
    G.props.push({ x: Math.round(14 + rnd() * (G.W - 28)), y: Math.round(top + 20 + rnd() * (G.H - top - 28)), s: c, v66: 1 });
  }
  G.v66art = ok;
}
const v66Emb = [];
function v66AbyTop(t) {
  const n = Math.max(1, v66AbyTier()),
    vh = G.VH || G.H,
    y0 = Math.round(G.cy || 0),
    now = G.t;
  t.save();
  // 黑霧（兩層反向飄移）
  const fog = V66_IMG[V66_ART.fog] || v66Img(V66_ART.fog);
  if (fog) {
    const pat = (v66AbyTop.pat ||= t.createPattern(fog, "repeat"));
    for (const [sp, a, sc] of [[7, 0.16 + 0.012 * n, 0.5], [-4, 0.1 + 0.008 * n, 0.8]]) {
      t.save();
      t.globalAlpha = a;
      t.translate(((now * sp) % (256 * sc)) - 256 * sc, y0 - 256 * sc);
      t.scale(sc, sc);
      t.fillStyle = pat;
      t.fillRect(0, 0, (G.W + 512 * sc) / sc, (vh + 512 * sc) / sc);
      t.restore();
    }
  }
  // 飄散的深淵餘燼
  const want = 18 + 3 * n,
    dt = Math.min(0.1, Math.max(0, now - (v66AbyTop.t || now)));
  v66AbyTop.t = now;
  while (v66Emb.length < want)
    v66Emb.push({ x: Math.random() * G.W, y: y0 + Math.random() * vh, v: 6 + Math.random() * 12, w: Math.random() * 6.28, c: Math.random() < 0.6 ? "#ff5aa0" : "#b070ff" });
  if (v66Emb.length > want) v66Emb.length = want;
  t.globalCompositeOperation = "lighter";
  for (const p of v66Emb) {
    p.y -= p.v * dt;
    p.x += Math.sin(now * 1.3 + p.w) * 4 * dt;
    if (p.y < y0 - 4 || p.y > y0 + vh + 4) (p.y = y0 + vh + 2), (p.x = Math.random() * G.W);
    t.globalAlpha = 0.45 + 0.35 * Math.sin(now * 3 + p.w);
    t.fillStyle = p.c;
    t.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
  }
  // 暗角
  t.globalCompositeOperation = "source-over";
  t.globalAlpha = 1;
  const cx = G.W / 2,
    cy = y0 + vh / 2,
    R = Math.hypot(G.W, vh) / 2,
    gr = t.createRadialGradient(cx, cy, R * 0.45, cx, cy, R);
  gr.addColorStop(0, "rgba(20,0,24,0)");
  gr.addColorStop(1, `rgba(20,0,24,${Math.min(0.7, 0.42 + 0.025 * n)})`);
  t.fillStyle = gr;
  t.fillRect(0, y0, G.W, vh);
  t.restore();
}
function v66ArtInstall() {
  for (const k of [...V66_ART.crack, ...V66_ART.rune, ...V66_ART.spike, V66_ART.fog]) v66Img(k);
  const bg = buildGround;
  buildGround = function (...a) {
    const r = bg.apply(this, a);
    G.v66art = false;
    try {
      if (v66AbyOn()) v66AbyGround();
    } catch (e) {}
    return r;
  };
  const dg = drawGlow;
  drawGlow = function (...a) {
    const r = dg.apply(this, a);
    try {
      if (v66AbyOn()) v66AbyTop(a[0]);
    } catch (e) {}
    return r;
  };
}

// ---------------------------------------------------------------------------
// 3. 深淵背景音樂：同一首地圖曲降調放慢約 12%，網址版再加低通濾波與回音
const V66_BGM = { rate: 0.88, lp: 1500, wet: 0.32, fb: 0.38, delay: 0.27 };
function v66BgmFx() {
  if (typeof roBgm === "undefined" || !roBgm.cur || !roBgm.cur.el) return;
  const c = roBgm.cur,
    el = c.el,
    on = v66AbyOn() && /^m\d+$/.test(c.k || "");
  // 降調放慢
  const rate = on ? V66_BGM.rate : 1;
  if (el.playbackRate !== rate) {
    try {
      el.preservesPitch = false;
      el.mozPreservesPitch = false;
      el.webkitPreservesPitch = false;
      el.playbackRate = rate;
    } catch (e) {}
  }
  // 濾波與回音（直接開啟本機檔案時不接，避免瀏覽器把聲音靜音）
  const ac = typeof AU !== "undefined" && AU.ctx;
  if (!ac || !/^https?:$/.test(location.protocol)) return;
  if (!el.v66 && on) {
    try {
      const src = ac.createMediaElementSource(el),
        lp = ac.createBiquadFilter(),
        dry = ac.createGain(),
        dl = ac.createDelay(1),
        fb = ac.createGain(),
        wet = ac.createGain();
      lp.type = "lowpass";
      lp.frequency.value = 22000;
      dl.delayTime.value = V66_BGM.delay;
      fb.gain.value = V66_BGM.fb;
      wet.gain.value = 0;
      src.connect(lp);
      lp.connect(dry);
      dry.connect(ac.destination);
      lp.connect(dl);
      dl.connect(fb);
      fb.connect(dl);
      dl.connect(wet);
      wet.connect(ac.destination);
      el.v66 = { lp, wet };
    } catch (e) {
      el.v66 = { bad: 1 };
    }
  }
  const fx = el.v66;
  if (!fx || fx.bad) return;
  const tt = ac.currentTime;
  fx.lp.frequency.setTargetAtTime(on ? V66_BGM.lp : 22000, tt, 0.6);
  fx.wet.gain.setTargetAtTime(on ? V66_BGM.wet : 0, tt, 0.6);
}
function v66BgmInstall() {
  setInterval(() => {
    try {
      v66BgmFx();
    } catch (e) {}
  }, 300);
}

// ---------------------------------------------------------------------------
// 4. 線上排行即時更新：武鬥場打出新高層就上傳（同角色 20 秒最多一次）；
//    打開排行一律讀最新；按「重新整理」先上傳目前進度再讀取
const V66_RK = { gap: 20000, last: 0, busy: false };
function v66RkRec() {
  const a = G?.tw,
    ra = a?.ra,
    b = a?.v6best;
  if (!ra || !b || !(b.floor >= 1) || !S) return null;
  return {
    id: S.cid,
    tok: v6RkTok(),
    name: S.name || "無名",
    cls: S.cls,
    br: ASC[S.cls]?.find((x) => x.k === S.tal?.asc)?.n || "",
    lv: S.lvl,
    floor: b.floor,
    sec: Math.max(0.1, Math.round(b.sec * 10) / 10),
    dps: Math.round(b.dd / Math.max(1, b.ct)),
    d: v6RkSnap(ra),
  };
}
async function v66RkPush(force) {
  if (typeof v6RkOn !== "function" || !v6RkOn() || V66_RK.busy) return;
  const a = G?.tw;
  if (!a?.ra || !a.v6best) return;
  const f = a.v6best.floor;
  if (f <= (a.v66up || 0)) return;
  if (!force && Date.now() - V66_RK.last < V66_RK.gap) return;
  let rec;
  try {
    rec = v66RkRec();
  } catch (e) {
    rec = null;
  }
  if (!rec) return;
  V66_RK.busy = true;
  V66_RK.last = Date.now();
  try {
    const r = await fetch(V6RK.api, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(rec) });
    const j = await r.json();
    if (j.ok) {
      a.v66up = f;
      V6RK.at = 0;
      if (ui.tab === "more" && ui.moreView === "orank") v6RkFetch(true);
    }
  } catch (e) {
  } finally {
    V66_RK.busy = false;
  }
}
function v66RankInstall() {
  if (typeof v6RkFetch !== "function") return;
  // 武鬥場通過一層：有新高層就上傳
  const tc = twClear;
  twClear = function (...x) {
    const r = tc.apply(this, x);
    try {
      if (typeof roArenaOn === "function" && roArenaOn()) v66RkPush(false);
    } catch (e) {}
    return r;
  };
  // 打開排行：重新讀取（停留在頁面上時才沿用快取）
  const mo = ui.m_orank;
  ui.m_orank = function (...a) {
    if (Date.now() - (V66_RK.seen || 0) > 3000) V6RK.at = 0;
    V66_RK.seen = Date.now();
    return mo.apply(this, a);
  };
  // 重新整理：先上傳目前這場的進度
  document.addEventListener(
    "click",
    (e) => {
      if (!e.target?.closest?.("[data-v6rk-reload]")) return;
      e.stopPropagation();
      V6RK.at = 0;
      Promise.resolve(v66RkPush(true)).finally(() => v6RkFetch(true));
    },
    true,
  );
  for (const v of Object.values(HELP))
    if (Array.isArray(v) && Array.isArray(v[1])) {
      const r = v[1].find((x) => x[0] === "線上排行");
      if (r) r[1] = "網址版中，無限武鬥場打出個人新高層時會即時上傳（同一角色 20 秒最多一次），結束時再上傳一次；選單「線上排行」可查看所有玩家的排名與配置，按「重新整理」會先上傳目前進度。";
    }
}

// ---------------------------------------------------------------------------
function v66Help() {
  const add = (k, name, txt) => {
    const rows = HELP[k]?.[1];
    if (!rows) return;
    const r = rows.find((x) => x[0] === name);
    if (r) r[1] = txt;
    else rows.push([name, txt]);
  };
  add("v56aby", "深淵氣息", "深淵中的怪物一出生就主動攻擊；地圖會出現深淵裂縫、魔法陣與結晶，背景音樂變為低沉的深淵版本。");
  add("v65aby", "深淵氣息", "怪物一出生就主動攻擊；地圖會出現深淵裂縫、魔法陣與結晶，背景音樂變為低沉的深淵版本。");
}
function v66Install() {
  v66HostileInstall();
  v66ArtInstall();
  v66BgmInstall();
  v66RankInstall();
  v66Help();
}
if (typeof roV4Install === "function") {
  const r4v66 = roV4Install;
  roV4Install = function () {
    r4v66();
    v66Install();
  };
}
