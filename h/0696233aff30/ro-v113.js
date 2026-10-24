/* 流浪仙境 v1.1.0（內部 v11.3）：城鎮與 NPC
   1. 新增 4 座城鎮（普隆德拉、斐揚、吉芬、朱諾）：背景由 RO 原版地圖（GND 地表、貼圖、RSM 建築模型）烘焙；不出怪、沒有頭目。
      地圖頁最上方可前往；右下角「離開」或選擇地圖即可回到一般地圖。城鎮裡的時間不影響離線收益與每分鐘擊殺。
   2. 每座城鎮都有 4 位 NPC（原版 NPC 圖），點畫面上的 NPC 或地圖頁的 NPC 按鈕即可對話：
      卡普拉 → 倉庫、任務；鐵匠 → 煉金（素材、精煉、鑲嵌、卡片合成）；道具商人 → 技能商店；哈米德 → 轉職試煉、選擇職業與流派。
   3. 舊入口移除：下方「煉金」分頁、選單的「商人」「倉庫」「任務」、地圖頁「試煉」的轉職試煉、職業天賦頁的「選擇分支」「選擇流派」。
      背包的「精煉」「鑲嵌卡片」捷徑只在城鎮裡可用。
   4. 轉職：等級達到試煉等級時提示「前往城鎮尋找哈米德」；試煉結束後自動回到出發的城鎮，通過後找哈米德選擇職業（二轉）與流派。 */

const V113 = {
  sc: 0.28, // NPC 圖縮放（與角色相同）
  root: "assets/ro-v3/",
  img: {},
  ground: {},
  ret: null, // 從哪座城鎮出發去試煉
  agT: 0, // 進城前的自動挑戰魔王計時
  ht: 0,
  from: null,
};
// 城鎮：背景 1600×1200（RO 原版地圖烘焙），npc 位置為場地比例 [x, y]（y 由場地上緣起算）
const V113_TOWNS = {
  prontera: { n: "普隆德拉", map: "prontera", d: "王國首都・中央噴水池廣場", c: [0.5, 0.5], npc: { kafra: [0.14, 0.3], hamid: [0.86, 0.3], smith: [0.25, 0.7], shop: [0.75, 0.7] } },
  payon: { n: "斐揚", map: "payon", d: "森林山城・王宮城門前", c: [0.5, 0.5], npc: { kafra: [0.27, 0.27], hamid: [0.73, 0.27], smith: [0.25, 0.7], shop: [0.75, 0.7] } },
  geffen: { n: "吉芬", map: "geffen", d: "魔法之都・吉芬塔前廣場", c: [0.5, 0.5], npc: { kafra: [0.27, 0.27], hamid: [0.73, 0.27], smith: [0.25, 0.7], shop: [0.75, 0.7] } },
  yuno: { n: "朱諾", map: "yuno", d: "浮空都市・中央廣場", c: [0.5, 0.5], npc: { kafra: [0.27, 0.27], hamid: [0.73, 0.27], smith: [0.25, 0.7], shop: [0.75, 0.7] } },
};
const V113_ORDER = ["prontera", "payon", "geffen", "yuno"];
// NPC：spr 為 RO 原版 NPC 圖（assets.latam-tools.com.br /image?job=…&frame=0），cut 為原版立繪（沒有就放大 NPC 圖）
const V113_NPC = {
  kafra: { n: "卡普拉", t: "卡普拉職員", sub: "倉庫・任務", job: 117, spr: "npc/npc_117.png", ani: "npc/npc_117_idle.png", cut: "" },
  smith: { n: "鐵匠", t: "鐵匠", sub: "精煉・鑲嵌・合成", job: 63, spr: "npc/npc_63.png", cut: "" },
  shop: { n: "道具商人", t: "道具商人", sub: "技能商店", job: 58, spr: "npc/npc_58.png", cut: "" },
  hamid: { n: "哈米德", t: "轉職導師 哈米德", sub: "轉職", job: 55, spr: "npc/npc_55.png", cut: "" },
};
const V113_NPCS = ["kafra", "smith", "shop", "hamid"];
const V113_ARENA = {
  n: "城鎮",
  v113: 1,
  v: { k: "tiles", p: ["#3a4a2c", "#4c5c38", "#5e6e44", "#728450"], q: ["#3a4a2c", "#4c5c38", "#5e6e44"], pool: null, d: "runes", pr: "pillar", amb: [0, 0, 0, 0], sl: 0, ring: "#9ad8ff" },
};
const V113_ALCH = [
  ["mat", "素材", "合成與購買精煉素材"],
  ["ref", "精煉", "提升裝備精煉值"],
  ["sock", "鑲嵌", "把卡片插入裝備插槽"],
  ["fuse", "卡片合成", "用卡片合成更高階的卡片"],
];

const v113In = () => !!(typeof G !== "undefined" && G && G.arena && G.arena.v113);
const v113Town = () => (v113In() ? V113_TOWNS[G.arena.v113] : null);
const v113Can = () => !!(S && G && !inFight() && !G.dead);
const v113Img = (file) => {
  const src = V113.root + file;
  if (!V113.img[src]) {
    const im = new Image();
    im.decoding = "async";
    im.src = src;
    V113.img[src] = im;
  }
  return V113.img[src];
};
const v113Ok = (im) => !!(im && im.complete && im.naturalWidth);
const v113Bg = (k) => `maps/ro58/${V113_TOWNS[k].map}.jpg`;
const v113Thumb = (k) => V113.root + `maps/ro58/${V113_TOWNS[k].map}_s.jpg`;
const v113Por = (k) => V113.root + (V113_NPC[k].cut || V113_NPC[k].ani || V113_NPC[k].spr);
const v113Pend = () => {
  if (!S?.tal) return null;
  const tr = S.tal.tr || 0;
  if (tr >= 1 && !S.tal.asc) return "line";
  if (S.tal.asc && tr >= 2 && typeof v63Pending === "function" && v63Pending()) return "sty";
  return null;
};
// 轉職提示：等級到了、試煉通過後，提醒前往城鎮尋找哈米德（每種狀態提示一次）
function v113Key() {
  if (!S?.tal) return null;
  const p = v113Pend();
  if (p === "line") return ["l", `已通過「${TRIAL[0]?.n || "轉職試煉"}」：前往城鎮尋找哈米德，選擇你的職業`];
  if (p === "sty") return ["s", `已通過「${TRIAL[1]?.n || "二轉試煉"}」：前往城鎮尋找哈米德，選擇你的流派`];
  const T = TRIAL[S.tal.tr || 0];
  if (T && S.lvl >= T.lv) return ["t" + S.tal.tr, `已達 Lv.${T.lv}：前往城鎮尋找哈米德，接受「${T.n}」`];
  return null;
}
function v113Hint() {
  if (!S || !G || inFight() || G.dead || G.trial != null || G.arena?.ar === ARENA.trial) return;
  const k = v113Key();
  if (!k || S.v113h === k[0]) return;
  S.v113h = k[0];
  markDirty();
  if (v113In()) return;
  toast(k[1], "lvl");
  ui.badge("map", 1);
}

// ---------------------------------------------------------------------------
// 前往、離開城鎮
function v113Enter(k, then) {
  const T = V113_TOWNS[k];
  if (!T || !S || !G) return false;
  if (G.arena?.v113 === k) {
    if (then) then();
    return true;
  }
  if (!v113Can()) {
    toast("戰鬥中不能前往城鎮", "bad");
    return false;
  }
  if (!((G.agT || 0) >= 1e12)) V113.agT = G.agT || 0;
  enterArena(V113_ARENA);
  Object.assign(G.arena, { out: 1e9, v113: k });
  G.agT = 1e12; // 城鎮裡不自動挑戰魔王（離開後恢復）
  const p = G.pl;
  p.x = Math.round(G.W / 2);
  p.y = Math.round((G.top + G.H) / 2 + 6);
  p.vx = p.vy = 0;
  v113Img(v113Bg(k));
  for (const n of V113_NPCS) v113Img(V113_NPC[n].spr);
  S.v113t = k;
  markDirty();
  sfx("click");
  ui.hud(!0);
  ui.refreshIf("map");
  if (then) setTimeout(() => v113In() && then(), 300);
  return true;
}
function v113Go(npc) {
  if (v113In()) return v113Talk(npc);
  if (ui.tab !== "map") ui.setTab("map");
  v113Enter(S.v113t && V113_TOWNS[S.v113t] ? S.v113t : "prontera", () => v113Talk(npc));
}
function v113Npcs() {
  const T = v113Town();
  if (!T || !G) return [];
  const h = G.H - G.top;
  return V113_NPCS.map((k) => ({ k, x: Math.round(T.npc[k][0] * G.W), y: Math.round(G.top + T.npc[k][1] * h) }));
}

// ---------------------------------------------------------------------------
// NPC 對話
function v113Opt(a, t, o = {}) {
  return `<button class="btn${o.p ? " primary" : ""}" data-v113="${a}" data-k="${o.k || ""}" ${o.dis ? "disabled" : ""}>${t}${o.s ? `<small>${o.s}</small>` : ""}</button>`;
}
function v113Dlg(k) {
  const T = v113Town();
  if (k === "kafra") {
    const q = QUESTS[S.q],
      qp = q ? Math.min(q.n, q.k === "level" ? S.lvl : S.qp) : 0;
    const qt = q ? `目前的新手任務：<b>${esc(q.d)}</b>${q.n > 1 ? `（${qp}/${q.n}）` : ""}` : "新手任務已經全部完成了，辛苦了！";
    return [`歡迎來到${T.n}的卡普拉服務！要寄放物品，還是確認任務呢？<br><span class="note">${qt}</span>`, [v113Opt("open", "倉庫", { k: "stash", s: "共用倉庫・所有角色共用", p: 1 }), v113Opt("open", "任務", { k: "quest", s: "新手引導與獎勵" })]];
  }
  if (k === "smith") {
    if (!S.alchOn) {
      const m = MAPS[typeof ALCH_MAP === "number" ? ALCH_MAP : 2];
      return [`我的工坊還沒準備好。等你擊敗「${esc(m?.n || "妙勒尼礦坑")}」的頭目，再來找我吧！`, V113_ALCH.map(([a, n, s]) => v113Opt("alch", n, { k: a, s, dis: 1 }))];
    }
    return [`叮——噹！精煉、鑲嵌卡片、合成素材，交給我就對了。想做什麼？`, V113_ALCH.map(([a, n, s], i) => v113Opt("alch", n, { k: a, s, p: i === 1 }))];
  }
  if (k === "shop") return [`歡迎光臨！這裡有適合${esc(CLASS[S.cls]?.n || "你")}的技能寶石和補給品，慢慢挑。`, [v113Opt("open", "購買", { k: "shop", s: "技能寶石・補給", p: 1 })]];
  // 哈米德
  const tr = S.tal.tr || 0,
    Tr = TRIAL[tr],
    p = v113Pend(),
    sec = typeof v56Trial === "function" ? v56Trial(tr)?.t || 120 : 120,
    br = ascBranch(),
    job = br ? br.n : CLASS[S.cls]?.n || "",
    pips = TRIAL.map((t, i) => `<i class="${i < tr ? "on" : ""}"></i>`).join("");
  let txt;
  if (p === "line") txt = `你通過了「${esc(TRIAL[0].n)}」。來吧，選擇你要走的職業！`;
  else if (p === "sty") txt = `幹得好，你通過了「${esc(TRIAL[1].n)}」。現在決定你的流派吧。`;
  else if (Tr && S.lvl >= Tr.lv) txt = `準備好接受「${esc(Tr.n)}」了嗎？在 ${sec} 秒內擊敗${esc(Tr.boss || "試煉頭目")}，就算通過。`;
  else if (Tr) txt = `想要轉職？等你到達 Lv.${Tr.lv}，我就讓你接受「${esc(Tr.n)}」。`;
  else txt = "你已經完成全部的轉職試煉了。接下來的路，就靠你自己走下去。";
  const opts = [];
  if (p === "line") opts.push(v113Opt("pick", "選擇職業", { s: "二轉職業線", p: 1 }));
  if (p === "sty") opts.push(v113Opt("pick", "選擇流派", { s: "決定天賦與專屬技能", p: 1 }));
  if (Tr) {
    const ok = S.lvl >= Tr.lv && canStart() && G.trial == null;
    opts.push(v113Opt("trial", G.trial != null ? "挑戰中" : S.lvl < Tr.lv ? `${esc(Tr.n)}・Lv.${Tr.lv} 開放` : `接受「${esc(Tr.n)}」`, { s: S.lvl >= Tr.lv ? `限時 ${sec} 秒` : "", dis: !ok, p: ok && !p }));
  }
  return [`${txt}<div class="v113st"><span>${esc(job)}</span><span class="tpips">${pips}</span><span class="note">試煉 ${tr}/${TRIAL.length}</span></div>`, opts];
}
function v113Talk(k) {
  if (!v113In() || !V113_NPC[k] || !S) return;
  const N = V113_NPC[k],
    T = v113Town(),
    [txt, opts] = v113Dlg(k);
  V113.talk = k;
  $("#sheet").className = "v113d";
  $("#sheetBg").hidden = false;
  $("#sheet").innerHTML = `<div class="v113box"><div class="v113por${N.cut ? " cut" : ""}"><img src="${v113Por(k)}" alt="${N.n}"></div><div class="v113say"><div class="v113nm">[${esc(N.t)}]<small>${esc(T.n)}</small></div><div class="v113tx">${txt}</div></div></div><div class="v113op">${opts.join("")}<button class="btn" data-act="close">離開</button></div>`;
  const im = $("#sheet .v113por img");
  if (im && !N.cut) {
    const fit = () => {
      const s = Math.min(2, 200 / (im.naturalHeight || 100), 136 / (im.naturalWidth || 60));
      im.style.width = Math.round(im.naturalWidth * s) + "px";
    };
    im.complete ? fit() : im.addEventListener("load", fit, { once: true });
  }
  sfx("click");
}
function v113Act(a, k) {
  if (!S || !G) return;
  if (a === "town") return void v113Enter(k);
  if (a === "npc") return void v113Talk(k);
  if (a === "go") return void v113Go(k);
  if (a === "leave") return void (v113In() && leaveArena());
  if (a === "back") {
    V113.from = null;
    return void ui.setTab("map");
  }
  if (!v113In()) return void sheetOff();
  if (a === "open") {
    sheetOff();
    V113.from = k === "shop" ? "shop" : "kafra";
    return void ui.openMenu(k);
  }
  if (a === "alch") {
    if (!S.alchOn) return;
    sheetOff();
    ui.v5at = k;
    ui.v5pick = null;
    ui.v5res = null;
    ui.v5cf = null;
    V113.from = "smith";
    return void ui.setTab("alch");
  }
  if (a === "pick") {
    sheetOff();
    return void ui.ascPick();
  }
  if (a === "trial") {
    const tr = S.tal.tr || 0,
      Tr = TRIAL[tr];
    if (!Tr || S.lvl < Tr.lv) return;
    const from = G.arena.v113;
    sheetOff();
    V113.ret = from;
    startTrial(tr);
    if (G.trial == null) {
      V113.ret = null;
      v113Talk("hamid");
    } else if (ui.tab === "map") ui.render();
  }
}

// ---------------------------------------------------------------------------
// 畫面：背景（依場地比例裁切，不變形）、NPC、名稱
function v113Ground() {
  const k = G.arena.v113,
    im = v113Img(v113Bg(k));
  if (!v113Ok(im)) {
    if (!im.v113w) {
      im.v113w = 1;
      im.addEventListener("load", () => v113In() && G.arena.v113 === k && (G.ground = null), { once: true });
    }
    return false;
  }
  const T = V113_TOWNS[k],
    q = 4,
    w = Math.max(1, Math.round(G.W * q)),
    h = Math.max(1, Math.round(G.H * q)),
    c = V113.ground[k] && V113.ground[k].width === w && V113.ground[k].height === h ? V113.ground[k] : document.createElement("canvas");
  if (c !== V113.ground[k]) {
    c.width = w;
    c.height = h;
    const x = c.getContext("2d"),
      iw = im.naturalWidth,
      ih = im.naturalHeight,
      s = Math.max(w / iw, h / ih),
      sw = w / s,
      sh = h / s,
      sx = Math.max(0, Math.min(iw - sw, T.c[0] * iw - sw / 2)),
      sy = Math.max(0, Math.min(ih - sh, T.c[1] * ih - sh / 2));
    x.imageSmoothingQuality = "high";
    x.drawImage(im, sx, sy, sw, sh, 0, 0, w, h);
    V113.ground[k] = c;
  }
  G.ground = c;
  G.props = [];
  G.lights = [];
  return true;
}
function v113DrawNpc(c, n) {
  const N = V113_NPC[n.k],
    im = v113Img(N.spr);
  if (!v113Ok(im)) return;
  const s = V113.sc,
    w = im.naturalWidth * s,
    h = im.naturalHeight * s;
  c.drawImage(im, Math.round(n.x - w / 2), Math.round(n.y - h + 2), w, h);
  c.save();
  c.font = "600 4.3px Tahoma, 'Microsoft JhengHei', sans-serif";
  const tw = c.measureText(N.n).width;
  c.restore();
  ptext(c, N.n, n.x - tw / 2, n.y + 2.5, "#eaf6ff", 1, "#16283a");
  // 哈米德：有事可做時頭上顯示「!」
  if (n.k === "hamid") {
    const Tr = TRIAL[S.tal.tr || 0];
    if (v113Pend() || (Tr && S.lvl >= Tr.lv)) {
      const b = Math.round(Math.sin(G.t * 5) * 1.2);
      ptext(c, "!", n.x - 1, n.y - h - 6 + b, "#ffd84a", 2, "#5a3200");
    }
  }
}
function v113Hit(e) {
  if (!v113In()) return null;
  const r = cv.getBoundingClientRect();
  if (!r.width) return null;
  const x = ((e.clientX - r.left) / r.width) * cv.width,
    y = ((e.clientY - r.top) / r.height) * cv.height + Math.round(G.cy || 0);
  let best = null,
    bd = 1e9;
  for (const n of v113Npcs()) {
    const im = v113Img(V113_NPC[n.k].spr),
      w = (im.naturalWidth || 40) * V113.sc,
      h = (im.naturalHeight || 90) * V113.sc;
    if (x < n.x - w / 2 - 4 || x > n.x + w / 2 + 4 || y < n.y - h - 3 || y > n.y + 9) continue;
    const d = Math.abs(x - n.x) + Math.abs(y - (n.y - h / 2)) * 0.5;
    if (d < bd) (bd = d), (best = n);
  }
  return best;
}

// ---------------------------------------------------------------------------
// 地圖頁：城鎮列表、城鎮 NPC
function v113TownsHtml() {
  const dis = !v113Can(),
    cur = v113In() ? G.arena.v113 : null;
  const cards = V113_ORDER.map((k) => {
    const T = V113_TOWNS[k],
      on = cur === k;
    return `<button class="mcard v113t${on ? " cur" : ""}" data-v113="town" data-k="${k}" ${dis && !on ? "disabled" : ""} aria-label="前往${T.n}"><span class="mban"><img src="${v113Thumb(k)}" alt="" loading="lazy"><span class="mpl mname">${T.n}</span></span></button>`;
  }).join("");
  let here = "";
  if (cur) {
    const T = V113_TOWNS[cur];
    here = `<div class="v113here"><div class="row"><b>${T.n}</b><span class="note">${esc(T.d)}</span><span class="spacer"></span><button class="btn sm" data-v113="leave">離開城鎮</button></div><div class="v113npcs">${V113_NPCS.map((k) => {
      const N = V113_NPC[k],
        alert = k === "hamid" && (v113Pend() || (TRIAL[S.tal.tr || 0] && S.lvl >= TRIAL[S.tal.tr || 0].lv));
      return `<button class="v113n" data-v113="npc" data-k="${k}"><span class="v113ni"><img src="${V113.root + N.spr}" alt="">${alert ? '<i class="dot"></i>' : ""}</span><b>${N.n}</b><small>${N.sub}</small></button>`;
    }).join("")}</div></div>`;
  }
  return `<h3>城鎮${helpBtn("v113")}</h3><div class="v113towns">${cards}</div>${here}`;
}
function v113TrialHtml() {
  const dis = !v113Can() ? "disabled" : "";
  return `<h3>轉職試煉${helpBtn("asc")}</h3><div class="box v113ptr"><span>轉職試煉由城鎮的<b>哈米德</b>主持：等級到了就去找他接受試煉，通過後再找他選擇職業與流派。</span><button class="btn sm primary" data-v113="go" data-k="hamid" ${dis}>前往城鎮找哈米德</button></div>`;
}

// ---------------------------------------------------------------------------
const V113_CSS = `
#tabs{grid-template-columns:repeat(5,1fr)!important}
#tabs [data-tab="alch"]{display:none!important}
.v113towns{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-bottom:8px}
.v113t .mban>img{height:50px!important;object-position:center 50%!important}
.v113t .mname{font-size:12px;white-space:nowrap}
.v113t.cur{box-shadow:0 0 0 2px #ffb347,0 2px 0 #3a221433}
.v113t[disabled]{cursor:default;opacity:.6}
.v113here{margin:0 0 10px;padding:8px;background:#fbfdff;border:1px solid #b9c8d8;border-radius:4px;box-shadow:inset 0 0 0 1px #fff}
.v113here .row{gap:8px;flex-wrap:nowrap;align-items:center}
.v113here .note{margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.v113npcs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-top:6px}
.v113n{display:flex;flex-direction:column;align-items:center;gap:1px;padding:4px 2px 5px;border:1px solid #b9c8d8;border-radius:4px;background:linear-gradient(#ffffff,#e9f0f7);cursor:pointer;font:inherit;color:#2b3a4a;min-width:0}
.v113n:hover{border-color:#6f94b8;background:linear-gradient(#ffffff,#dfeaf5)}
.v113ni{position:relative;height:52px;display:flex;align-items:flex-end;justify-content:center}
.v113ni img{max-height:52px;image-rendering:pixelated}
.v113ni .dot{position:absolute;top:0;right:-6px;width:7px;height:7px;background:#e0445a;box-shadow:1px 1px 0 #5a2a14}
.v113n b{font-size:13px;white-space:nowrap}
.v113n small{font-size:11px;color:#5d7186;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.v113ptr{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px}
.v113ptr span{flex:1 1 200px}
#sheet.v113d{display:flex;flex-direction:column;gap:10px;width:min(520px,94vw)}
.v113box{display:flex;gap:10px;align-items:stretch}
.v113por{flex:none;width:140px;min-height:214px;display:flex;align-items:flex-end;justify-content:center;padding:8px 4px 6px;background:radial-gradient(ellipse at 50% 90%,#ffffff 0,#eef4fa 45%,#cbd9e7 100%);border:1px solid #9fb3c8;border-radius:4px;overflow:hidden}
.v113por img{display:block;image-rendering:pixelated;max-width:100%}
.v113por.cut{width:150px;padding:0;align-items:flex-end}
.v113por.cut img{image-rendering:auto;width:100%;height:auto}
.v113say{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;padding:8px 10px;background:#ffffff;border:1px solid #9fb3c8;border-radius:4px;box-shadow:inset 0 0 0 1px #f4f8fc}
.v113nm{font-weight:700;color:#2a5f96;display:flex;align-items:baseline;gap:8px}
.v113nm small{font-weight:400;color:#6a7f94;font-size:12px}
.v113tx{line-height:1.65;color:#2b3440}
.v113tx .note{display:block;margin:6px 0 0}
.v113st{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px;padding-top:6px;border-top:1px dashed #b9c8d8}
.v113st .tpips{position:static;display:inline-flex;gap:3px}
.v113st .tpips i{width:9px;height:9px;background:#d5dee8;box-shadow:inset 0 0 0 1px #8aa0b6}
.v113st .tpips i.on{background:#ffd84a;box-shadow:inset 0 0 0 1px #9a6a00}
.v113st .note{margin:0}
.v113op{display:flex;flex-direction:column;gap:6px}
.v113op .btn{justify-content:flex-start;text-align:left;display:flex;align-items:baseline;gap:10px}
.v113op .btn small{font-size:12px;opacity:.75}
.v113back{margin-bottom:8px}
@media (max-width:420px){.v113towns{grid-template-columns:repeat(2,minmax(0,1fr))}.v113por{width:100px;min-height:150px}.v113por img{height:auto}}`;

function v113Install() {
  if (typeof enterArena !== "function" || typeof ARENA === "undefined") return;
  ARENA.v113 = V113_ARENA;
  if (typeof document !== "undefined" && !document.getElementById("v113css")) {
    const st = document.createElement("style");
    st.id = "v113css";
    st.textContent = V113_CSS;
    document.head.appendChild(st);
  }

  // 背景
  const bg = buildGround;
  buildGround = function (...a) {
    if (v113In() && v113Ground()) return;
    return bg.apply(this, a);
  };
  // NPC：與角色依高度前後排序（城鎮沒有怪物）
  const dp = drawPlayer;
  drawPlayer = function (c, ...a) {
    if (!v113In()) return dp.call(this, c, ...a);
    const ns = v113Npcs(),
      py = G.pl.y;
    for (const n of ns) if (n.y <= py) v113DrawNpc(c, n);
    const r = dp.call(this, c, ...a);
    for (const n of ns) if (n.y > py) v113DrawNpc(c, n);
    return r;
  };
  // 城鎮裡：不計入每分鐘擊殺（離線收益）與地圖掛機時間；轉職提示
  const tk = tick;
  tick = function (dt, ...a) {
    const town = v113In(),
      kpm = S?.kpm,
      mt = S?.mt?.[S.map];
    const r = tk.call(this, dt, ...a);
    if (town && S && G) {
      if (G.arena) G.arena.out = 1e9;
      G.minT = 0;
      G.minK = 0;
      if (kpm != null) S.kpm = kpm;
      if (mt != null && S.mt) S.mt[S.map] = mt;
    }
    // 離開城鎮（任何方式）後恢復自動挑戰魔王
    if (G && !v113In() && (G.agT || 0) >= 1e12) G.agT = Math.max(V113.agT || 0, G.t + 3);
    if (G && G.t - V113.ht >= 1) {
      V113.ht = G.t;
      try {
        v113Hint();
      } catch (e) {}
    }
    return r;
  };
  // 離開：恢復自動挑戰；試煉結束回到出發的城鎮
  const la = leaveArena;
  leaveArena = function (...a) {
    const A = G?.arena,
      town = A?.v113,
      trial = A && A.ar === ARENA.trial;
    const r = la.apply(this, a);
    if (town) V113.from = null;
    if (trial && V113.ret) {
      const k = V113.ret;
      V113.ret = null;
      v113Enter(k, () => v113Pend() && v113Talk("hamid"));
    }
    return r;
  };
  const sm = setMap;
  setMap = function (...a) {
    V113.ret = null;
    V113.from = null;
    return sm.apply(this, a);
  };
  // 右下角按鈕、左下角地名
  const hd = ui.hud;
  ui.hud = function (...a) {
    const r = hd.apply(this, a);
    const T = v113Town();
    if (T) {
      const mc = $("#mapChip"),
        h1 = `${T.n}<b>城鎮</b>`;
      if (mc && mc.innerHTML !== h1) mc.innerHTML = h1;
      const sp = $("#bossBtn span");
      if (sp && sp.innerHTML !== "離開城鎮") sp.innerHTML = "離開城鎮";
    }
    return r;
  };

  // 地圖頁：最上方城鎮列表；試煉頁的轉職試煉改為指引
  const pm = ui.p_map;
  ui.p_map = function (...a) {
    const h = pm.apply(this, a);
    return S && G ? v113TownsHtml() + h : h;
  };
  if (typeof ui.trialBoard === "function") ui.trialBoard = v113TrialHtml;
  // 職業天賦頁：選擇分支／流派改由哈米德
  const ah = ui.ascHtml;
  ui.ascHtml = function (...a) {
    const go = `<button class="btn sm primary" data-v113="go" data-k="hamid" ${v113Can() ? "" : "disabled"}>前往城鎮找哈米德</button>`;
    return ah
      .apply(this, a)
      .replace('<button class="btn primary" data-act="ascPick">選擇分支</button>', go)
      .replace("已完成試煉，尚未選擇分支。", "已完成試煉，尚未選擇職業：到城鎮找哈米德選擇。")
      .replace('<button class="btn sm primary" data-v63="pickSty">選擇流派</button>', go)
      .replace("已完成二轉試煉，請選擇流派。", "已完成二轉試煉：到城鎮找哈米德選擇流派。")
      .replace(/(<p class="note">達到 \d+ 級後，)可於地圖分頁上方挑戰(「[^」]+」。)<\/p>/, `$1到城鎮找哈米德接受$2</p><div class="row">${go}</div>`);
  };
  // 選擇職業／流派只能在城鎮（跟哈米德對話）
  const ap = ui.ascPick;
  ui.ascPick = function (...a) {
    if (v113In()) return ap.apply(this, a);
    const k = v113Key();
    if (k && (k[0] === "l" || k[0] === "s")) {
      S.v113h = k[0];
      markDirty();
      const back = G?.arena?.ar === ARENA.trial && V113.ret;
      toast(back ? "試煉結束後會回到城鎮，再找哈米德選擇" + (k[0] === "l" ? "職業" : "流派") : k[1], "lvl");
    }
  };
  // 選單：移除商人、倉庫、任務（改由 NPC）；從 NPC 打開時，返回鍵回到城鎮
  for (const key of ["quest", "shop", "stash"]) {
    const i = MENU.findIndex((m) => m[0] === key);
    if (i >= 0) MENU.splice(i, 1);
  }
  const back = '<button class="btn sm mback v113back" data-v113="back">&lt; 返回城鎮</button>';
  const pmo = ui.p_more;
  ui.p_more = function (...a) {
    const h = pmo.apply(this, a);
    return V113.from && ["quest", "shop", "stash"].includes(this.moreView) ? h.replace('<button class="btn sm mback" data-act="menuBack">&lt; 選單</button>', back) : h;
  };
  const pa = ui.p_alch;
  ui.p_alch = function (...a) {
    const h = pa.apply(this, a);
    return (V113.from === "smith" ? back : "") + h;
  };
  const st = ui.setTab;
  ui.setTab = function (t, v, ...x) {
    if (!(t === "alch" || (t === "more" && ["quest", "shop", "stash"].includes(v)))) V113.from = null;
    return st.call(this, t, v, ...x);
  };
  if (typeof ui.m_shop === "function") {
    const ms = ui.m_shop;
    ui.m_shop = function (...a) {
      return ms.apply(this, a).replace(/(<h2[^>]*>)商人/, "$1道具商人");
    };
  }

  // 點選：自己的按鈕、畫面上的 NPC、背包的煉金捷徑、任務小卡
  document.addEventListener(
    "click",
    (e) => {
      const t = e.target;
      const b = t.closest && t.closest("[data-v113]");
      if (b) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!b.disabled) v113Act(b.dataset.v113, b.dataset.k);
        return;
      }
      const g = t.closest && t.closest('[data-v5="go"],[data-v54="go"]');
      if (g && !g.disabled && S && !v113In()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        toast("精煉、鑲嵌卡片請到城鎮找鐵匠", "bad");
        return;
      }
      if (g && v113In()) V113.from = "smith";
      if (t.closest && t.closest("#questChip") && S) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (v113In()) {
          V113.from = "kafra";
          ui.openMenu("quest");
        } else toast("任務內容可到城鎮找卡普拉查看", "lvl");
      }
    },
    true,
  );
  cv.addEventListener("click", (e) => {
    const n = v113Hit(e);
    if (n) v113Talk(n.k);
  });
  cv.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const on = !!v113Hit(e);
    if (cv.style.cursor !== (on ? "pointer" : "")) cv.style.cursor = on ? "pointer" : "";
  });

  // 說明與任務提示
  HELP.v113 = [
    "城鎮與 NPC",
    [
      ["城鎮", "地圖頁最上方可前往普隆德拉、斐揚、吉芬、朱諾。城鎮不出怪、沒有頭目，背景為 RO 原版地圖。戰鬥中（頭目、試煉、魔王、塔）不能前往。"],
      ["離開", "點右下角「離開城鎮」，或在地圖頁選擇一般地圖。"],
      ["NPC", "點畫面上的 NPC，或地圖頁的 NPC 按鈕即可對話。每座城鎮都有相同的 4 位 NPC。"],
      ["卡普拉", "倉庫（所有角色共用）與新手任務。"],
      ["鐵匠", "煉金：素材、精煉、鑲嵌、卡片合成。背包的「精煉」「鑲嵌卡片」捷徑只在城鎮裡可用。"],
      ["道具商人", "技能商店：技能寶石與補給。"],
      ["哈米德", "轉職試煉：等級到了就找他接受試煉；通過一轉試煉後找他選擇職業，通過二轉試煉後選擇流派。試煉結束後會回到出發的城鎮。"],
      ["掛機", "待在城鎮的時間不影響離線收益（每分鐘擊殺）與地圖掛機時間，也不會自動挑戰魔王。"],
    ],
  ];
  const fix = (s) =>
    s
      .replace(/「煉金・([^」]+)」/g, "鐵匠的「$1」")
      .replace("選單「倉庫」", "城鎮卡普拉的「倉庫」")
      .replace("地圖分頁「試煉」的轉職試煉", "城鎮哈米德主持的轉職試煉")
      .replace("地圖分頁上方的轉職試煉", "城鎮哈米德主持的轉職試煉")
      .replace("通過第一場試煉後，選擇一個分支。", "通過第一場試煉後，到城鎮找哈米德選擇職業；通過第二場試煉後再找他選擇流派。")
      .replace("並重新選擇分支。", "並到城鎮找哈米德重新選擇。")
      .replace(/^商人只販售/, "道具商人只販售");
  for (const hv of Object.values(HELP)) for (const row of Array.isArray(hv?.[1]) ? hv[1] : []) if (Array.isArray(row) && typeof row[1] === "string") row[1] = fix(row[1]);
  for (const q of QUESTS) {
    if (typeof q.hint !== "string") continue;
    if (q.k === "trial") q.hint = "等級到了就到城鎮找哈米德接受轉職試煉（地圖頁最上方前往城鎮）";
    else if (q.hint === "擊敗後開放「煉金」") q.hint = "擊敗後開放城鎮鐵匠的「煉金」";
    else q.hint = q.hint.replace("用於向商人購買物品", "用於向城鎮的道具商人購買物品");
  }
  // 煉金開放的提示
  const t0 = toast;
  toast = function (m, ...x) {
    if (m === "「煉金」已開放：萃取符文石、合成煉金材料") m = "城鎮鐵匠的「煉金」已開放：精煉、鑲嵌、合成素材";
    return t0.call(this, m, ...x);
  };
}
if (typeof roV4Install === "function") {
  const r4v113 = roV4Install;
  roV4Install = function () {
    r4v113();
    v113Install();
  };
}
