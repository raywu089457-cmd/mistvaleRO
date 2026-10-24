/* 流浪仙境 v8.2：背包按「精煉」「鑲嵌卡片」會選中那件裝備、深淵卡頓優化（黑霧改拼貼與離屏繪製、菁英詞綴預先繪製）、設定新增「低畫質」、精煉保護優先使用鐵匠的祝福 */

// ---------------------------------------------------------------------------
// 1. 背包／角色頁按「精煉」「鑲嵌卡片」：精煉頁、鑲嵌頁的裝備清單只列「穿戴中＋背包前 80 件」再套用篩選，
//    點的裝備不在清單內（例如背包很滿時的 +0 新裝備，或被篩選條件排除）就會被換回清單第一件。
//    改為從按鈕跳轉過來的那件一定排在清單最上方並被選取（不受前 80 件與篩選條件限制）；在清單中改選其他裝備後恢復原本的清單。
const V82_PIN = { u: null };
function v82PinInstall() {
  if (typeof v5GearList !== "function") return;
  document.addEventListener(
    "click",
    (e) => {
      const b = e.target.closest && e.target.closest('[data-v5="go"]');
      if (b && !b.disabled && b.dataset.u != null) V82_PIN.u = +b.dataset.u;
    },
    true,
  );
  const gl = v5GearList;
  v5GearList = function (filter, ...a) {
    const out = gl.call(this, filter, ...a);
    const u = V82_PIN.u;
    if (u == null || !Array.isArray(out)) return out;
    // 已在清單中改選其他裝備：不再固定
    if (ui.v5sel != null && +ui.v5sel !== u) {
      V82_PIN.u = null;
      return out;
    }
    const it = typeof v5Find === "function" ? v5Find(u) : null;
    if (!it || !it.v5 || (typeof filter === "function" && !filter(it))) return out;
    const i = out.indexOf(it);
    if (i === 0) return out;
    if (i > 0) out.splice(i, 1);
    out.unshift(it);
    return out;
  };
}

// ---------------------------------------------------------------------------
// 2. 深淵黑霧：原本每幀用「重複圖樣填色」把放大的霧貼圖鋪兩層到整個畫面（實際繪製範圍是畫面的 3～8 倍，並以高品質縮放），
//    再畫一層全畫面暗角，是深淵每幀最耗時的繪圖（以顯示卡繪圖模式實測，圖樣填色每幀約 200 毫秒）。
//    改為霧貼圖預先縮放成方塊、以拼貼方式畫在小張的離屏畫布（畫面邏輯解析度的 2 倍），每幀只貼 1 次到畫面；
//    暗角只在畫面大小或階數改變時重畫。
//    兩層反向飄移的霧、暗角、餘燼的外觀維持原樣。
const V82_FOG = { res: 2, cv: null, x: null, tiles: null, vig: null, vigKey: "" };
const v82Low = () => !!S?.set?.v82low;
function v82Vignette(w, h, n) {
  const key = `${w}x${h}|${n}`;
  if (V82_FOG.vig && V82_FOG.vigKey === key) return V82_FOG.vig;
  const cv = V82_FOG.vig || (V82_FOG.vig = document.createElement("canvas"));
  cv.width = w;
  cv.height = h;
  const x = cv.getContext("2d"),
    R = Math.hypot(w, h) / 2,
    gr = x.createRadialGradient(w / 2, h / 2, R * 0.45, w / 2, h / 2, R);
  gr.addColorStop(0, "rgba(20,0,24,0)");
  gr.addColorStop(1, `rgba(20,0,24,${Math.min(0.7, 0.42 + 0.025 * n)})`);
  x.fillStyle = gr;
  x.fillRect(0, 0, w, h);
  V82_FOG.vigKey = key;
  return cv;
}
function v82FogTile(fog, ts) {
  const C = (V82_FOG.tiles ||= {});
  if (C[ts]) return C[ts];
  const cv = document.createElement("canvas");
  cv.width = cv.height = ts;
  const x = cv.getContext("2d");
  x.imageSmoothingEnabled = true;
  x.imageSmoothingQuality = "high";
  x.drawImage(fog, 0, 0, ts, ts);
  return (C[ts] = cv);
}
function v82AbyTop(t) {
  if (v82Low()) return;
  const n = Math.max(1, v66AbyTier()),
    vh = G.VH || G.H,
    y0 = Math.round(G.cy || 0),
    now = G.t,
    RS = V82_FOG.res,
    w = Math.max(1, Math.ceil(G.W * RS)),
    h = Math.max(1, Math.ceil(vh * RS));
  // 黑霧（兩層反向飄移）＋暗角：畫在離屏畫布
  const cv = V82_FOG.cv || (V82_FOG.cv = document.createElement("canvas"));
  if (cv.width !== w || cv.height !== h) {
    cv.width = w;
    cv.height = h;
  }
  const x = V82_FOG.x || (V82_FOG.x = cv.getContext("2d"));
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalAlpha = 1;
  x.clearRect(0, 0, w, h);
  const fog = V66_IMG[V66_ART.fog] || v66Img(V66_ART.fog);
  if (fog && (fog.width || fog.naturalWidth)) {
    // 霧貼圖預先縮放成方塊，再以 drawImage 鋪滿（不用重複圖樣填色：部分顯示卡的圖樣填色非常慢）
    for (const [sp, a, sc] of [[7, 0.16 + 0.012 * n, 0.5], [-4, 0.1 + 0.008 * n, 0.8]]) {
      const tile = v82FogTile(fog, Math.max(8, Math.round(256 * sc * RS)));
      if (!tile) continue;
      const ts = tile.width,
        ox = Math.round(RS * ((now * sp) % (256 * sc) - 256 * sc)),
        oy = -ts;
      x.globalAlpha = a;
      for (let ty = oy; ty < h; ty += ts) for (let tx = ox; tx < w; tx += ts) x.drawImage(tile, tx, ty);
    }
    x.globalAlpha = 1;
  }
  x.drawImage(v82Vignette(w, h, n), 0, 0);
  t.save();
  t.imageSmoothingEnabled = true;
  t.imageSmoothingQuality = "low";
  t.drawImage(cv, 0, y0, G.W, vh);
  // 飄散的深淵餘燼（原樣，每顆 1 個點）
  const want = 18 + 3 * n,
    dt = Math.min(0.1, Math.max(0, now - (v82AbyTop.t || now)));
  v82AbyTop.t = now;
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
  t.restore();
}
function v82FogInstall() {
  if (typeof v66AbyTop !== "function" || typeof V66_ART === "undefined") return;
  v66AbyTop = v82AbyTop;
}

// ---------------------------------------------------------------------------
// 3. 菁英詞綴文字：原本是蓋在畫面上的網頁文字（描邊＋模糊陰影），每幀依怪物位置重新排版、重畫，
//    怪物順序改變時還會整批重建文字。改為依詞綴組合預先畫成圖片，直接畫在戰鬥畫面上（位置、大小、顏色與原本相同）。
const V82_TAG = { cache: new Map(), cap: 96, font: null };
function v82TagFont() {
  if (V82_TAG.font) return V82_TAG.font;
  let f = "";
  try {
    f = getComputedStyle(document.documentElement).getPropertyValue("--f-body").trim();
  } catch (e) {}
  return (V82_TAG.font = f || "'Cubic11','PingFang TC','Microsoft JhengHei',system-ui,sans-serif");
}
function v82TagSprite(ea, px) {
  const key = ea.join() + "|" + px.toFixed(2),
    C = V82_TAG.cache;
  let sp = C.get(key);
  if (sp) return sp;
  const k = px / 12,
    font = `bold ${12 * k}px ${v82TagFont()}`,
    sep = "・",
    parts = [];
  ea.forEach((a, i) => {
    if (i) parts.push([sep, "#e8dcc4"]);
    parts.push([ELITE_AF[a]?.n || a, ELITE_AF[a]?.c || "#e8dcc4"]);
  });
  const m = document.createElement("canvas").getContext("2d");
  m.font = font;
  const tw = parts.reduce((s, [txt]) => s + m.measureText(txt).width, 0),
    pad = Math.ceil(3 * k + 4 * k),
    lh = Math.ceil(14 * k),
    cv = document.createElement("canvas");
  cv.width = Math.ceil(tw + pad * 2);
  cv.height = lh + Math.ceil(8 * k);
  const x = cv.getContext("2d"),
    by = Math.ceil(4 * k) + lh / 2;
  x.font = font;
  x.textBaseline = "middle";
  x.lineJoin = "round";
  // 陰影（原本 0 0 3px rgba(0,0,0,.6)）＋四向 1px 描邊（#13202e）
  const pass = (fn) => {
    let cx = pad;
    for (const [txt, col] of parts) {
      fn(txt, cx, col);
      cx += x.measureText(txt).width;
    }
  };
  x.save();
  x.shadowColor = "rgba(0,0,0,.6)";
  x.shadowBlur = 3 * k;
  x.fillStyle = "#13202e";
  pass((txt, cx) => x.fillText(txt, cx, by));
  x.restore();
  x.strokeStyle = "#13202e";
  x.lineWidth = 2 * k;
  pass((txt, cx) => x.strokeText(txt, cx, by));
  pass((txt, cx, col) => {
    x.fillStyle = col;
    x.fillText(txt, cx, by);
  });
  // 錨點：文字下緣置中（對應原本 translate(-50%,-100%)）
  sp = { cv, ax: cv.width / 2, ay: Math.ceil(4 * k) + lh };
  C.set(key, sp);
  if (C.size > V82_TAG.cap) C.delete(C.keys().next().value);
  return sp;
}
function v82DrawTags(t) {
  if (!S || !G?.mobs || G.dead || document.body.classList.contains("zen")) return;
  const m = t.getTransform(),
    dev = m.a || 1,
    dpr = Math.min(2, window.devicePixelRatio || 1),
    uz = typeof UZ === "number" ? UZ : 1,
    px = 12 * uz * dpr,
    cy = Math.round(G.cy || 0);
  t.save();
  t.globalAlpha = 1;
  t.globalCompositeOperation = "source-over";
  t.imageSmoothingEnabled = true;
  t.imageSmoothingQuality = "low";
  for (const r of G.mobs) {
    if (!r.ea || !r.ea.length || r.spawnT > 0) continue;
    const by = r.y - r.h - 9;
    if (by - cy < 40) continue;
    const sp = v82TagSprite(r.ea, px);
    t.drawImage(sp.cv, r.x - sp.ax / dev, by - sp.ay / dev, sp.cv.width / dev, sp.cv.height / dev);
  }
  t.restore();
}
function v82TagInstall() {
  if (typeof eliteTags !== "function" || typeof drawGlow !== "function") return;
  eliteTags = function () {
    const el = typeof $ === "function" ? $("#tags") : null;
    if (el && el.children.length) el.textContent = "";
  };
  const dg = drawGlow;
  drawGlow = function (c, ...a) {
    const r = dg.call(this, c, ...a);
    try {
      v82DrawTags(c);
    } catch (e) {}
    return r;
  };
}

// ---------------------------------------------------------------------------
// 4. 設定 → 畫面「低畫質」：不畫深淵黑霧、暗角與餘燼；黑暗地圖的光照每個光源只畫 1 圈，並以一般品質縮放
function v82LowInstall() {
  if (typeof drawLighting === "function" && typeof stepCircle === "function") {
    const dl = drawLighting;
    drawLighting = function (c, ...a) {
      if (!v82Low()) return dl.call(this, c, ...a);
      const sc = stepCircle;
      let k = 0;
      stepCircle = function (cx, x, y, r) {
        if (k++ % 3 !== 1) return;
        cx.fillStyle = "rgba(0,0,0,.75)";
        return sc.call(this, cx, x, y, r);
      };
      const se = c.imageSmoothingEnabled,
        sq = c.imageSmoothingQuality;
      c.imageSmoothingEnabled = true;
      c.imageSmoothingQuality = "low";
      try {
        return dl.call(this, c, ...a);
      } finally {
        stepCircle = sc;
        c.imageSmoothingEnabled = se;
        c.imageSmoothingQuality = sq;
      }
    };
  }
  if (ui.m_set) {
    const ms = ui.m_set;
    ui.m_set = function (...a) {
      const h = ms.apply(this, a);
      if (typeof h !== "string" || h.includes('data-v82="low"')) return h;
      const box = `<label class="chk"><input type="checkbox" data-v82="low" ${S?.set?.v82low ? "checked" : ""}><span>低畫質（較舊的電腦適用：不顯示深淵黑霧、暗角與餘燼，光照改用簡化畫法）</span></label>`;
      const at = h.indexOf('<input type="checkbox" data-act="noshk"');
      if (at < 0) return h;
      const end = h.indexOf("</label>", at) + "</label>".length;
      return h.slice(0, end) + box + h.slice(end);
    };
  }
  document.addEventListener("change", (e) => {
    const a = e.target;
    if (!a || a.dataset?.v82 !== "low" || !S) return;
    S.set.v82low = a.checked ? 1 : 0;
    if (typeof markDirty === "function") markDirty();
  });
}

// ---------------------------------------------------------------------------
// 5. 精煉保護：防具與飾品 +5～+10 原本 +8～+10 只能用神工匠的祝福；改為一律優先使用鐵匠的祝福，沒有時才用神工匠的祝福
//    （武器 +7 以上、防具與飾品 +11 以上必須消耗神工匠的祝福的規則不變）
function v82Refine(u) {
  const it = v5Find(u);
  if (!it || (it.ref || 0) >= V79_REF.max) return;
  const lv = (it.ref || 0) + 1,
    mat = v5RefMat(it, lv),
    z = v5RefZeny(it, lv),
    need = v79Need(it),
    lg = v79Lg();
  if (!(S.mat[mat] > 0) || S.ash < z) return void toast("素材或 Zeny 不足", "bad");
  if (need && !(S.mat.p2 > 0))
    return void toast(`${it.slot === "weapon" ? `武器 +${V63_BLESS.wpnLv}` : `防具與飾品 +${V79_REF.armLv}`} 以上精煉需要 1 個「${MATS.p2.n}」（${v79BlessSrc()}）`, "bad");
  const prot = !need && !lg && ui.v5prot && lv >= 5 ? (S.mat.p1 > 0 ? "p1" : S.mat.p2 > 0 ? "p2" : null) : null;
  S.mat[mat]--;
  S.ash -= z;
  if (need) S.mat.p2--;
  if (prot) S.mat[prot]--;
  if (lg) S.mat.lg1--;
  const ok = lg || RAND() * 100 < V79_REF.ok[lv];
  if (ok) it.ref = lv;
  else if (!prot && lv > 5) it.ref = lv - 2;
  ui.v5res = {
    t: performance.now(),
    ok,
    txt:
      (ok ? `精煉成功！${it.base} +${lv}` : prot ? `精煉失敗（${MATS[prot].n}保護，精煉值不變）` : lv > 5 ? `精煉失敗，精煉值降為 +${it.ref}` : "精煉失敗") +
      (lg ? "（傳說的魔力礦石）" : "") +
      (need ? `（消耗 1 個${MATS.p2.n}）` : ""),
  };
  v5Name(it);
  sfx(ok ? "alch" : "alchF", ok ? Math.min(3, Math.ceil(lv / 4)) : 1);
  recalc();
  markDirty();
  ui.refreshIf("alch", "bag", "char");
}
const V82_PROT_TXT = "使用保護（鐵匠的祝福，沒有時用神工匠的祝福）";
function v82ProtInstall() {
  if (typeof v79Refine !== "function" || typeof v79RefTop !== "function") return;
  v5Refine = v82Refine;
  const rt = v79RefTop;
  v79RefTop = function (...a) {
    const h = rt.apply(this, a);
    return typeof h === "string" ? h.replace(/使用保護（(?:鐵匠的祝福或神工匠的祝福|神工匠的祝福)）/, V82_PROT_TXT) : h;
  };
  const r = HELP.v5ref?.[1]?.find((x) => x[0] === "保護");
  if (r) r[1] = `勾選保護後，失敗時精煉值不變：精煉 +5～+10 使用鐵匠的祝福，沒有時改用神工匠的祝福。必須消耗神工匠的祝福的精煉（武器 +${V63_BLESS.wpnLv + 1} 以上、防具與飾品 +${V79_REF.armLv + 1} 以上）不提供保護。`;
  if (typeof V64_MAT_USE !== "undefined") {
    if (V64_MAT_USE.p1) V64_MAT_USE.p1 = V64_MAT_USE.p1.replace("精煉 +5～+7", "精煉 +5～+10");
    if (V64_MAT_USE.p2) V64_MAT_USE.p2 = V64_MAT_USE.p2.replace("精煉 +8～+10、", "精煉 +5～+10 沒有鐵匠的祝福時的保護、");
  }
}

// ---------------------------------------------------------------------------
function v82Install() {
  v82PinInstall();
  v82FogInstall();
  v82TagInstall();
  v82LowInstall();
  v82ProtInstall();
}
if (typeof roV4Install === "function") {
  const r4v82 = roV4Install;
  roV4Install = function () {
    r4v82();
    v82Install();
  };
}
