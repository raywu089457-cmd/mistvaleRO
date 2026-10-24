/* 流浪仙境 v7.8：職業技能接上 RO 原版特效、變異寶石掉率 ×3、共用天賦樹節點 RO 美術 */

// ---------------------------------------------------------------------------
// 1. 職業技能特效：沒有專屬特效設定的職業技能，原本只在角色身上閃一圈通用光暈。
//    改為沿用其對應基本技能（roBase）的特效設定；部分技能指定更貼近 RO 原作的動畫。
//    （第 4 節載入 ro-fx-v78.js 後，會再把其中有原版或自製特效的技能換掉）
const V78_FX = {
  mg_tstorm: { str: ["lightning", "windhit1"], target: 1 }, // 雷爆術：落雷（原本沿用暴風雪）
  sw_hcross: { str: ["holyhit"], target: 1, delay: 0.06 }, // 聖十字攻擊
  gcross: { str: ["holyhit"], self: 1 }, // 聖十字審判
  ignite: { str: ["hell_in"], self: 1 }, // 點燃爆破
  mc_revo: { str: ["cartrevolution"], self: 1 }, // 手推車革命
  mg_soul: { str: ["holyhit"], projectile: 1 }, // 靈魂之擊（暫用聖光命中）
  ac_sphere: { str: ["holyhit"], projectile: 1 }, // 氣彈（暫用聖光命中）
};
function v78FxInstall() {
  if (typeof roFxProfile !== "function" || typeof roFxProfiles === "undefined") return;
  for (const [id, p] of Object.entries(V78_FX)) if (SKILLS[id] && !roFxProfiles[id]) roFxProfiles[id] = p;
  const pf = roFxProfile;
  roFxProfile = function (id, ...a) {
    if (!roFxProfiles[id]) {
      const base = SKILLS[id]?.roBase;
      if (base && roFxProfiles[base]) return roFxProfiles[base];
    }
    return pf.call(this, id, ...a);
  };
}

// ---------------------------------------------------------------------------
// 2. 變異寶石掉率 ×3：一般怪 0.001% → 0.003%、菁英 0.005% → 0.015%、頭目 0.05% → 0.15%、
//    巴風特召喚出的闇答萊屍 2.5% → 7.5%（皆以 RO_MUT.base 計算；載入時調整）
RO_MUT.base *= 3;
function v78MutHelp() {
  const pct = (v) => `${+(v * 100).toPrecision(3)}%`;
  const lb = pct(RO_MUT.base * MUT.b * (typeof V70 !== "undefined" ? V70.mutX : 50));
  for (const hv of Object.values(HELP))
    for (const row of Array.isArray(hv?.[1]) ? hv[1] : []) {
      if (!Array.isArray(row) || typeof row[1] !== "string") continue;
      row[1] = row[1].replace(/2\.5% 變異寶石/g, `${lb} 變異寶石`);
      if (row[0] === "變異寶石" && /所有怪物都可能掉落/.test(row[1]) && !row[1].includes("一般怪"))
        row[1] += `掉率：一般怪 ${pct(RO_MUT.base)}、菁英 ${pct(RO_MUT.base * MUT.e)}、頭目 ${pct(RO_MUT.base * MUT.b)}、闇答萊屍 ${lb}。`;
    }
}

// ---------------------------------------------------------------------------
// 3. 共用天賦樹節點美術（assets/ro-tree/，Codex 繪製）：素質節點換成 6 色寶石座，專精、交會、終極加上
//    RO 風格的徽章框／魔法陣環／金框。圖檔載入成功才套用，缺圖時維持原本的樣子。
const V78_TREE = {
  dir: "assets/ro-tree/",
  files: ["attr_0", "attr_1", "attr_2", "attr_3", "attr_4", "attr_5", "notable", "junction", "ultimate"],
  ok: {},
  // SVG 單位：素質節點寬度＝半徑 × 2.7；框的尺寸讓中央透明處約等於節點圓形
  size: { notable: 52, junction: 58, ultimate: 74 },
};
function v78TreeInstall() {
  if (typeof document === "undefined" || typeof roTreeSvg !== "function") return;
  for (const f of V78_TREE.files) {
    const im = new Image();
    im.onload = () => (V78_TREE.ok[f] = 1);
    im.src = V78_TREE.dir + f + ".png";
  }
  if (!document.getElementById("v78css")) {
    const st = document.createElement("style");
    st.id = "v78css";
    st.textContent = `.tree-node image.v78a{pointer-events:none;transition:filter .15s,opacity .15s}
.tree-node.v78i.attribute circle{fill:transparent!important;stroke:transparent!important}
.tree-node.v78i.attribute.selected circle,.tree-node.v78i.attribute:focus circle{stroke:#2a3a48!important;stroke-width:1.5px}
.tree-node.v78i.attribute:not(.on):not(.available) image.v78a{filter:grayscale(.3) brightness(.97);opacity:.62}
.tree-node.v78i.attribute.available:not(.on) image.v78a{opacity:.92}
.tree-node.v78i.attribute.on image.v78a{filter:drop-shadow(0 0 2.5px var(--route)) saturate(1.2) brightness(1.06)}
.tree-node.v78i .tree-ult-ring{display:none}
.tree-node.v78i:not(.attribute):not(.on) image.v78a{filter:grayscale(.35);opacity:.85}
.tree-node.v78i.junction image.v78a{filter:drop-shadow(0 0 .8px #7a5a12) saturate(1.8) brightness(.8)}
.tree-node.v78i:not(.attribute).on image.v78a{filter:drop-shadow(0 0 3px #ffd877) drop-shadow(0 0 1px var(--route))}
.tree-node.v78i.junction.on image.v78a{filter:drop-shadow(0 0 .8px #7a5a12) drop-shadow(0 0 3px #ffd877) saturate(1.8) brightness(.85)}`;
    document.head.appendChild(st);
  }
  const svg = roTreeSvg;
  roTreeSvg = function (...a) {
    const h = svg.apply(this, a);
    if (typeof h !== "string") return h;
    return h.replace(/(<g role="button"[^>]*data-ro-node="([^"]+)"[^>]*class=")([^"]*)("[^>]*>)([\s\S]*?)(<\/g>)/g, (m, g0, id, cls, g1, inner, end) => {
      const n = RO_TREE_NODES[id];
      if (!n) return m;
      const key = n.kind === "attribute" ? `attr_${n.stat}` : n.kind;
      if (!V78_TREE.ok[key]) return m;
      let done = false;
      const inner2 = inner.replace(/<circle cx="([-\d.]+)" cy="([-\d.]+)" r="([\d.]+)"\/>/, (c, x, y, r) => {
        done = true;
        const w = n.kind === "attribute" ? +r * 2.7 : V78_TREE.size[n.kind] || +r * 3;
        return `${c}<image class="v78a" href="${V78_TREE.dir}${key}.png" x="${(+x - w / 2).toFixed(1)}" y="${(+y - w / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${w.toFixed(1)}"/>`;
      });
      return done ? `${g0}${cls} v78i${g1}${inner2}${end}` : m;
    });
  };
}
// ---------------------------------------------------------------------------
// 4. 新增的 RO 原版特效（ro-fx-v78.js：Codex 從 ragassets 下載的 STR／特效精靈）與自製特效（assets/ro-fx-custom/）
//    資料檔存在時，把對應技能的特效換成原版動畫；找不到原版的技能用自製的 8 格精靈條
//    規則：・找到原版 STR／特效精靈的技能 → 換成原版（位置、延遲、觸發方式沿用原本的設定）
//          ・找不到原版的技能 → 只有原本用程式畫的通用光效（光暈、斬擊、衝擊…）才換成自製精靈條；
//            原本已經是 RO 原版動畫的維持不變（原版優先）
//          ・陷阱、箭雨等由遊戲引擎觸發的特效，以及毒系的原版毒霧精靈維持原樣
const V78_STRIP = { img: {} };
const V78_FXR = {
  force: ["mg_soul", "ac_sphere", "mg_tetra", "dissonance"], // 原本暫用或不搭的特效，改用自製
  keep: ["mg_quake", "ac_wrath", "cwk", "sw_breath"], // 已有更合適的原版特效（崩裂、天使之怒；龍之吐息的原版精靈是紫色，不像火焰）
  poison: ["envenom", "venom", "varrow", "acid"], // 沿用原版毒霧精靈
  applied: { str: [], sprite: [], strip: [] },
};
function v78FxDataInstall() {
  const D = typeof V78_FX_DATA !== "undefined" ? V78_FX_DATA : null;
  if (!D || typeof roFxProfiles === "undefined") return;
  const E = RO.assets.effects || (RO.assets.effects = {}),
    olds = {}; // 先記下全部技能原本的設定（沿用基本技能設定的職業技能，不受基本技能先被換掉影響）
  for (const id of Object.keys(D.skills || {})) olds[id] = roFxProfile(id) || {};
  for (const [id, sk] of Object.entries(D.skills || {})) {
    if (!SKILLS[id] || V78_FXR.keep.includes(id) || V78_FXR.poison.includes(id)) continue;
    const old = olds[id],
      oldStr = old.str || [],
      str = (sk.str || []).filter((n) => roFxNative(n)),
      spr = (sk.sprites || []).find((n) => E.sprites?.[n]),
      cus = D.custom?.[id];
    const p = old.projectile ? { projectile: 1 } : old.self ? { self: 1 } : { target: 1 };
    if (old.delay != null) p.delay = old.delay;
    if (old.engine) p.engine = old.engine;
    if (old.ground || sk.kind === "ground") p.ground = 1;
    if (str.length && str.some((n) => !oldStr.includes(n))) {
      p.str = str;
      V78_FXR.applied.str.push(id);
    } else if (!str.length && spr) {
      p.sprite = spr;
      V78_FXR.applied.sprite.push(id);
    } else if (
      cus &&
      !str.length &&
      !old.engine &&
      !V78_FXR.poison.includes(id) &&
      (!oldStr.length || V78_FXR.force.includes(id))
    ) {
      p.strip = id;
      if (cus.anchor === "ground") p.ground = 1;
      V78_FXR.applied.strip.push(id);
    } else continue;
    roFxProfiles[id] = p;
  }
  // 怒雷強擊：原版 lord 動畫原尺寸會蓋住大半個畫面、長達 4 秒，而這個技能每次施放會觸發 5 次特效。
  // 改為每次施放只在目標處播一次（縮成雷擊範圍大小的雷柱），每道落雷用雷擊＋風屬性命中動畫
  const lov = roFxProfiles.mg_lov;
  if (lov?.str?.includes("lord") && typeof castSkillRaw === "function") {
    roFxProfiles.v78lord = { str: ["lord"], target: 1 };
    lov.str = ["lightning", ...lov.str.filter((n) => n !== "lord")];
    const cs = castSkillRaw;
    castSkillRaw = function (g, ...a) {
      const tgt = G.pl?.tgt,
        r = cs.call(this, g, ...a);
      if (r !== false && g?.id === "mg_lov" && tgt && !(typeof v76Off === "function" && v76Off()))
        roFxAdd("v78lord", tgt.x, tgt.y, { area: 0.35, delay: 0.45 });
      return r;
    };
  }
  if (typeof Image !== "undefined")
    for (const id of V78_FXR.applied.strip) {
      const im = new Image();
      im.onload = () => (V78_STRIP.img[id] = im);
      im.src = D.custom[id].file;
    }
  const fa = roFxAdd;
  roFxAdd = function (id, ...a) {
    const list = G.roEffects || [],
      n0 = list.length,
      r = fa.call(this, id, ...a);
    const p = roFxProfiles[id],
      e = G.roEffects && G.roEffects.length > n0 ? G.roEffects[G.roEffects.length - 1] : null;
    if (p && e && e.id === id && !e.str.length) {
      if (p.sprite && E.sprites?.[p.sprite]) {
        e.sprite = p.sprite;
        e.custom = "";
        e.duration = E.sprites[p.sprite].frames.reduce((t, f) => t + f.delay, 0) / 1000;
      } else if (p.strip && D.custom?.[p.strip]) {
        const c = D.custom[p.strip];
        e.v78strip = p.strip;
        e.custom = "";
        e.duration = (c.frames || 8) / Math.min(c.fps || 12, 12);
      }
    }
    return r;
  };
  const de = roDrawEffects;
  roDrawEffects = function (c, ground, ...a) {
    const all = G.roEffects;
    if (!all || !all.some((e) => e.v78strip)) return de.call(this, c, ground, ...a);
    const strips = all.filter((e) => e.v78strip && G.t < e.start + e.duration),
      rest = all.filter((e) => !e.v78strip);
    G.roEffects = rest;
    try {
      de.call(this, c, ground, ...a);
    } finally {
      G.roEffects = (G.roEffects || []).concat(strips);
    }
    for (const e of strips) {
      const t = G.t - e.start,
        cdef = D.custom[e.v78strip],
        im = V78_STRIP.img[e.v78strip];
      if (t < 0 || !im || !!e.ground !== !!ground) continue;
      if (e.follow) (e.x = e.follow.x), (e.y = e.follow.y);
      // 每秒最多 12 格（約 0.67 秒）；128px 一格縮成約 51px（隨技能範圍放大）。
      // 先正常疊上（在亮色地圖上也看得清楚），再用加亮疊一層淡光暈
      const n = cdef.frames || 8,
        sz = cdef.size || 128,
        k = Math.min(n - 1, Math.floor(t * Math.min(cdef.fps || 12, 12))),
        w = sz * 0.4 * (e.area || 1),
        x = e.x - w / 2,
        y = e.y - (ground ? w / 2 : w / 2 + 8);
      c.save();
      c.globalAlpha = 0.92;
      c.drawImage(im, k * sz, 0, sz, sz, x, y, w, w);
      if (cdef.blend === "lighter") {
        c.globalCompositeOperation = "lighter";
        c.globalAlpha = 0.3;
        c.drawImage(im, k * sz, 0, sz, sz, x, y, w, w);
      }
      c.restore();
    }
  };
}
// ---------------------------------------------------------------------------
function v78Install() {
  v78FxInstall();
  v78MutHelp();
  v78TreeInstall();
  v78FxDataInstall();
}
if (typeof roV4Install === "function") {
  const r4v78 = roV4Install;
  roV4Install = function () {
    r4v78();
    v78Install();
  };
}
