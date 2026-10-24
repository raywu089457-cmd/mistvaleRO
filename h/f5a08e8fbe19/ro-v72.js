/* 流浪仙境 v7.2：選單特效簡化（擊殺特效暴風雪改為輕量冰爆、怒雷與冥界之門縮短、擊殺特效限量）、信物掉率恢復 v7.0、手機版天賦樹套用鈕、技能寶石實測修正、巴風特強化、無盡之塔移除、MVP 武道場自動挑戰 */

// ---------------------------------------------------------------------------
// 1. 擊殺特效簡化
//    暴風雪原本播放 RO 暴風雪動畫（41 層、4.25 秒），怪物死得快時會同時疊到二、三十個，畫面張數掉到 1/4。
//    改為輕量冰爆：RO 冰凍動畫（8 層、約 1 秒）＋冰晶碎片與雪花。
//    怒雷：只播雷擊動畫並加速到 0.8 秒（拿掉第二段風擊）；冥界之門：拿掉 5 秒的地獄門底圖，只留 1.3 秒的漩渦與幽魂。
//    同時最多 6 個擊殺特效、每 0.15 秒最多觸發 1 個；頭目與菁英一定會播。
const V72K = { max: 6, gap: 0.15, lspd: 2.7, last: -9 };
const V72_KN = ["風屬性・怒雷", "水屬性・冰爆", "暗屬性・冥界之門"];
const V72_ICE = { n: 7, snow: 3, life: 0.55 };
function v72KillLive() {
  let n = 0;
  for (const e of G.roEffects || []) if (e.v72k && G.t < e.start + e.duration) n++;
  for (const e of G.v69fx || []) if (e.k === "gate" && G.t - e.t0 < 1.3) n++;
  return n;
}
// 冰晶碎片與雪花（一般 drawImage，不用三角形貼圖）
function v72IceBurst(x, y, s) {
  const L = (G.v72p ||= []);
  for (let i = 0; i < V72_ICE.n + V72_ICE.snow; i++) {
    const snow = i >= V72_ICE.n,
      a = (i / V72_ICE.n) * Math.PI * 2 + Math.random() * 0.6,
      sp = (snow ? 10 : 26 + Math.random() * 14) * s;
    L.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.55, z: (snow ? 10 : 4) * s, vz: snow ? -4 : 18 + Math.random() * 10, t0: G.t, life: V72_ICE.life * (snow ? 1.4 : 1), sz: (snow ? 6 : 5) * s, rot: Math.random() * 6, spin: (Math.random() - 0.5) * 10, tex: snow ? (Math.random() < 0.5 ? "snow_a.bmp" : "snow_b.bmp") : "freeze_ice_part.bmp" });
  }
  if (L.length > 90) L.splice(0, L.length - 90);
}
function v72IceDraw(c, p, t, ox = 0, oy = 0, k = 1) {
  const q = t / p.life;
  if (q < 0 || q >= 1) return;
  const im = v69Tex(p.tex) || v69Tex("freeze_ice.bmp");
  if (!im) return;
  const x = ox + (p.x + p.vx * t) * k,
    y = oy + (p.y + p.vy * t - Math.max(0, p.z + p.vz * t - 30 * t * t)) * k,
    w = p.sz * k;
  c.save();
  c.globalCompositeOperation = "lighter";
  c.globalAlpha = Math.min(1, (1 - q) * 1.8);
  c.translate(x, y);
  c.rotate(p.rot + p.spin * t);
  c.drawImage(im, -w / 2, -w / 2, w, w);
  c.restore();
}
function v72FxInstall() {
  if (typeof V6_GFX !== "undefined") {
    V6_GFX.kn = V72_KN.slice();
    V6_GFX.k = [["lightning"], ["freeze"], []];
  }
  if (typeof GODS !== "undefined") GODS.forEach((g, i) => V72_KN[i] && (g.kn = V72_KN[i]));
  if (typeof roFxProfiles !== "undefined") {
    roFxProfiles.v6gk0 = { str: ["lightning"], target: 1 };
    roFxProfiles.v6gk1 = { str: ["freeze"], target: 1 };
  }
  // 播放速度（怒雷加速）
  const ds = roDrawStr;
  roDrawStr = function (c, d, seconds, e, ...x) {
    return ds.call(this, c, d, e && e.spd ? seconds * e.spd : seconds, e, ...x);
  };
  gfKill = function (t, a, m) {
    if (t !== GF || !G || !G.pl || !m) return;
    const imp = m.boss || m.elite;
    if (!imp && (G.t - V72K.last < V72K.gap || v72KillLive() >= V72K.max)) return;
    V72K.last = G.t;
    const area = m.boss ? 1.2 : m.elite ? 0.9 : 0.7,
      y = m.y - (a === 1 ? 4 : (m.h || 10) * 0.4);
    if (a === 2) {
      (G.v69fx ||= []).push({ k: "gate", x: m.x, y: m.y - 2, t0: G.t, s: area / 0.7 });
      if (G.v69fx.length > 24) G.v69fx.shift();
      return;
    }
    const n0 = (G.roEffects || []).length;
    try {
      roFxAdd("v6gk" + a, m.x, y, { area: a === 1 ? area * 1.25 : area });
    } catch (e) {}
    const e = G.roEffects && G.roEffects.length > n0 ? G.roEffects[G.roEffects.length - 1] : null;
    if (e && e.id === "v6gk" + a) {
      e.v72k = 1;
      if (a === 0) {
        e.spd = V72K.lspd;
        e.duration = e.duration / V72K.lspd;
      }
    }
    if (a === 1) v72IceBurst(m.x, m.y - 4, area / 0.7);
  };
  const ft = drawFxTop;
  drawFxTop = function (c, ...x) {
    const r = ft.call(this, c, ...x);
    try {
      if (G.v72p?.length) {
        G.v72p = G.v72p.filter((p) => G.t - p.t0 < p.life);
        for (const p of G.v72p) v72IceDraw(c, p, G.t - p.t0);
      }
    } catch (e) {}
    return r;
  };
  // 選單預覽：怒雷只播加速的雷擊；冰爆取代暴風雪；冥界之門不播地獄門底圖
  if (typeof V69_GSTR !== "undefined") V69_GSTR.k[0] = ["lightning"];
  if (typeof v69PrevStr === "function") {
    const ps = v69PrevStr;
    let iceT = -1,
      ice = [];
    v69PrevStr = function (c, name, t, x, y, area) {
      if (name === "hell_in") return;
      if (name === "lightning" && typeof V69P !== "undefined" && V69P.k === "k") return ps(c, name, t * V72K.lspd, x, y, area);
      if (name === "stormgust") {
        const k = area / 0.42;
        ps(c, "freeze", t, x, y - 4 * k, area * (0.7 / 0.42) * 1.25);
        if (t < iceT || !ice.length) {
          ice = [];
          for (let i = 0; i < V72_ICE.n + V72_ICE.snow; i++) {
            const snow = i >= V72_ICE.n,
              a = (i / V72_ICE.n) * Math.PI * 2 + Math.random() * 0.6,
              sp = snow ? 10 : 26 + Math.random() * 14;
            ice.push({ x: 0, y: 0, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.55, z: snow ? 10 : 4, vz: snow ? -4 : 18 + Math.random() * 10, life: V72_ICE.life * (snow ? 1.4 : 1), sz: snow ? 6 : 5, rot: Math.random() * 6, spin: (Math.random() - 0.5) * 10, tex: snow ? "snow_a.bmp" : "freeze_ice_part.bmp" });
          }
        }
        iceT = t;
        for (const p of ice) v72IceDraw(c, p, t, x, y - 4 * k, k);
        return;
      }
      return ps(c, name, t, x, y, area);
    };
  }
  // 說明與名稱
  for (const hv of Object.values(HELP))
    for (const r of Array.isArray(hv?.[1]) ? hv[1] : [])
      if (Array.isArray(r) && typeof r[1] === "string" && r[1].includes("暴風雪") && /特效/.test(r[1])) r[1] = r[1].replace(/暴風雪/g, "冰爆");
}

// ---------------------------------------------------------------------------
// 2. 信物掉率恢復 v7.0（v7.1 曾下修為 ×0.4）
function v72TokenInstall() {
  const k = typeof V71_GD !== "undefined" && V71_GD.tk > 0 ? V71_GD.tk : 1;
  if (k !== 1) for (let i = 0; i < GUARD_TK.length; i++) GUARD_TK[i] /= k;
  for (const hv of Object.values(HELP))
    for (const r of Array.isArray(hv?.[1]) ? hv[1] : [])
      if (Array.isArray(r) && typeof r[1] === "string") r[1] = r[1].replace(/（v7\.1：生命與傷害依等級換算，信物掉率 ×[\d.]+）/, "（v7.1 起生命與傷害依等級換算）");
}

// ---------------------------------------------------------------------------
// 3. 手機版天賦樹：右下角的 Netlify 標誌會蓋住「套用並儲存」。
//    手機寬度時套用鈕獨佔底部第一排、底部多留空間；說明欄的「投入／退回」旁也放一顆套用鈕（各種寬度都有）
function v72TreeInstall() {
  if (typeof document !== "undefined" && !document.getElementById("v72css")) {
    const st = document.createElement("style");
    st.id = "v72css";
    st.textContent = `.tree-detail .row .v72apply{margin-left:auto}
@media (max-width:760px){.tree-footer{padding-bottom:calc(10px + 60px + env(safe-area-inset-bottom,0px))}.tree-footer [data-ro-tree="apply"]{order:-1;flex:1 1 100%}.tree-detail .row .v72apply{margin-left:0}}`;
    document.head.appendChild(st);
  }
  if (typeof roTreeRender !== "function") return;
  const tr = roTreeRender;
  roTreeRender = function (...a) {
    const r = tr.apply(this, a);
    try {
      const row = document.querySelector("#sheet .tree-detail .row"),
        ft = document.querySelector('#sheet .tree-footer [data-ro-tree="apply"]');
      if (row && ft && !row.querySelector('[data-ro-tree="apply"]')) {
        const b = ft.cloneNode(true);
        b.classList.add("v72apply");
        row.appendChild(b);
      }
    } catch (e) {}
    return r;
  };
}

// ---------------------------------------------------------------------------
// 4. 技能寶石實測修正（6 職業 159 顆寶石、642 組輔助連結逐一施放比對）
// 4-1 狂暴（劍士）、二刀流（盜賊）：引擎以舊技能代號（狂怒之槍 frenzy、雙劍格擋 dance）判斷光環，
//     新寶石開啟後完全沒有效果（傷害 ×1.35、每秒扣血、氣勢層數都不會發生）。開啟時一併標記舊代號
function v72AuraInstall() {
  const st = susTick;
  susTick = function (t, ...x) {
    const r = st.call(this, t, ...x);
    const b = SKILLS[t?.id]?.roBase;
    if (b && G?.pl?.sus?.[t.id] && SKILLS[b]?.sus) G.pl.sus[b] = 1;
    return r;
  };
  // 角色面板 DPS 估算也算進狂暴
  const cc = calc;
  calc = function (...a) {
    const R = cc.apply(this, a);
    try {
      const ag = activeGems();
      if (R && !ag.some((g) => g.id === "frenzy") && ag.some((g) => SKILLS[g.id]?.roBase === "frenzy") && !tal("fixedHit")) R.dps *= 1.35 + tal("frz");
    } catch (e) {}
    return R;
  };
}
// 4-2 隱匿：原本施放後不進冷卻（隱匿結束就能再放，約每 3 秒一次），改為照說明 9 秒冷卻
function v72HideInstall() {
  const hd = V6_CAST.hide;
  if (hd)
    V6_CAST.hide = function (c) {
      const r = hd.call(this, c);
      return r === "free" ? true : r;
    };
}
// 4-3 金錢投入、重型手推車：原本只作用在新版技能，對「毒雲」（沿用舊引擎）沒有效果。
//     召喚技能（生命體召喚、FAW 砲台設置）不受影響也不付款，說明加註
const V72_ZNOTE = "（生命體召喚、FAW 砲台設置無效）";
function v72MerchantInstall() {
  const csr = castSkillRaw;
  castSkillRaw = function (t, a = 1, ...x) {
    const sk = SKILLS[t?.id];
    if (sk && sk.roBase && S?.cls === "merchant" && !(sk.tg || []).includes("minion")) {
      if (v6Linked(t, "mc_invest") && v6PayZeny(3)) a *= 1.5;
      if (v6Linked(t, "mc_heavy")) a *= 1 + (v6CartMul() - 1) * 2;
    }
    return csr.call(this, t, a, ...x);
  };
  for (const id of ["mc_invest", "mc_heavy"]) {
    const k = SKILLS[id];
    if (k && typeof k.d === "string" && !k.d.includes(V72_ZNOTE)) k.d += V72_ZNOTE;
  }
}
// 4-4 蓄力狙擊：原本只射 1 支，連結多重箭矢等「額外投射物」沒有效果；額外的狙擊箭射向附近其他敵人
function v72SnipeInstall() {
  const sn = V6_CAST.snipe;
  if (!sn) return;
  V6_CAST.snipe = function (c) {
    const r = sn.call(this, c);
    const n = Math.max(0, Math.round(c.m?.proj || 0));
    if (r && n && alive(c.tgt)) {
      const tgt = c.tgt;
      later(0.6, () => {
        const near = G.mobs
          .filter((m) => m !== tgt && alive(m) && m.spawnT <= 0 && Math.hypot(m.x - G.pl.x, m.y - G.pl.y) < 110)
          .sort((a, b) => Math.hypot(a.x - (tgt.x || 0), a.y - (tgt.y || 0)) - Math.hypot(b.x - (tgt.x || 0), b.y - (tgt.y || 0)))
          .slice(0, n);
        for (const m of near) {
          const d = Math.hypot(m.x - G.pl.x, m.y - G.pl.y);
          v6Hit(m, c.hit * c.r * (d > 60 ? 1.5 : 1), c.o, { kb: 90 });
          streak({ x: G.pl.x, y: G.pl.y - 7 }, { x: m.x, y: m.y - 6 }, "#fff2c0");
        }
      });
    }
    return r;
  };
}
// 4-5 移除 4 顆傳說寶石（致命迴旋、箭矢風暴、迴旋十字斬、地獄火焰）：不再掉落；已持有的自動分解退還 Zeny
const V72_LEG = ["whirlL", "pierceL", "blinkL", "fireL"];
function v72LegInstall() {
  rollLeg = function () {
    return null;
  };
  const mm = makeMutGem;
  makeMutGem = function (...a) {
    for (let i = 0; i < 30; i++) {
      const g = mm.apply(this, a);
      if (!g || !SKILLS[g.id]?.leg) return g;
    }
    return null;
  };
  const ns = newState;
  newState = function (...a) {
    const st = ns(...a);
    st.v72leg = 1;
    return st;
  };
  const ens = roEnsureStats;
  roEnsureStats = function (...a) {
    const r = ens.apply(this, a);
    try {
      if (S && S.v72leg !== 1) {
        S.v72leg = 1;
        const rm = (S.gems || []).filter((g) => g && SKILLS[g.id]?.leg);
        if (rm.length) {
          const ids = new Set(rm.map((g) => g.u));
          S.gems = S.gems.filter((g) => !ids.has(g.u));
          const z = rm.length * (MUT?.ash || 0);
          S.ash += z;
          const names = [...new Set(rm.map((g) => SKILLS[g.id].n))].join("、");
          later(2, () => toast(`傳說寶石已移除：${names}（${rm.length} 顆）自動分解，獲得 ${z} Zeny`, "lvl", 1));
          try {
            recalc();
          } catch (e) {}
        }
      }
    } catch (e) {}
    return r;
  };
}
// 4-6 說明修正
function v72DescInstall() {
  const add = (id, txt, mark) => {
    const k = SKILLS[id];
    if (k && typeof k.d === "string" && !k.d.includes(mark || txt)) k.d += txt;
  };
  for (const id of ["ac_angel2", "mdmg", "bw_ens2", "mg_spirit2"]) add(id, "（聖靈環繞、地獄植物沒有生命，生命加成改為傷害）", "沒有生命");
  for (const id of ["ac_orbs", "mc_plant"]) {
    const k = SKILLS[id];
    if (k && typeof k.d === "string") k.d = k.d.replace("召喚物輔助可增加數量與傷害。", "召喚物輔助可增加數量與傷害（生命加成也轉為傷害）。");
  }
  add("ac_heal", "回復量同樣受輔助寶石的傷害加成影響。", "回復量同樣");
  add("ac_sanct", "回復量受輔助寶石傷害加成的一半影響。", "回復量受輔助");
  const q = SKILLS.mg_quake;
  if (q && typeof q.d === "string" && !q.d.includes("流血")) q.d = q.d.replace("裂縫持續 3 秒。", "裂縫持續 3 秒，踏入裂縫的敵人流血。");
  for (const id of ["mc_cartrev", "mc_term"]) {
    const k = SKILLS[id];
    if (k && typeof k.d === "string" && !k.d.includes("100 件"))
      k.d = k.d.includes("（受手推車重量加成）") ? k.d.replace("（受手推車重量加成）", "（受手推車重量加成：背包每件裝備 +0.6%，100 件滿載時 +60%）") : k.d.replace(/受手推車重量加成/, "受手推車重量加成（背包每件裝備 +0.6%，100 件滿載時 +60%）");
  }
}

// ---------------------------------------------------------------------------
// 5. 巴風特強度：以三魔王中最強的伊夫利特為基準，生命 ×2.5、傷害 ×1.8（原本約 ×1.46／×1.40），限時 210 → 240 秒。
//    闇答萊屍仍是巴風特的 4 倍生命、2 倍傷害（跟著變強）
const V72_FIN = { hp: 2.5, dmg: 1.8, t: 240 };
function v72FinalInstall() {
  if (typeof V71_GD === "undefined") return;
  // v7.1 校正後實測（Lv127 角色）：伊夫利特 生命 371 萬、傷害 1,111；巴風特 生命 541 萬（×1.46）、傷害 1,550（×1.40）。
  // 依實測比例調整巴風特的倍率，使其成為伊夫利特的 2.5 倍生命、1.8 倍傷害
  const cur = { hp: 1.458, dmg: 1.395 };
  V71_GD.f.hp = +((V71_GD.f.hp * V72_FIN.hp) / cur.hp).toFixed(3);
  V71_GD.f.dmg = +((V71_GD.f.dmg * V72_FIN.dmg) / cur.dmg).toFixed(3);
  const sg = startGuard;
  startGuard = function (t, ...x) {
    const r = sg.call(this, t, ...x);
    if (t === GUARD.length && G.guard === t && G.boss && !G.boss.v72t) {
      G.boss.v72t = 1;
      G.bossT = V72_FIN.t;
    }
    return r;
  };
  for (const hv of Object.values(HELP))
    for (const r of Array.isArray(hv?.[1]) ? hv[1] : [])
      if (Array.isArray(r) && typeof r[1] === "string") r[1] = r[1].replace(/(碎片各 1 個開啟挑戰，\d+ 級，)限時 210 秒/, `$1限時 ${V72_FIN.t} 秒`);
}

// ---------------------------------------------------------------------------
// 6. 無盡之塔完全移除（無限武鬥場沿用塔的引擎，保留）：挑戰頁的塔卡片、自動挑戰無盡之塔、說明頁與各處文字
function v72TowerInstall() {
  twStart = function () {};
  ui.towerBoard = () => "";
  const ens = roEnsureStats;
  roEnsureStats = function (...a) {
    const r = ens.apply(this, a);
    try {
      if (S?.set) S.set.at = 0;
    } catch (e) {}
    return r;
  };
  delete HELP.tower;
  const fix = (t) =>
    t
      .replace(/(、|或|與|和)無盡之塔/g, "")
      .replace(/無盡之塔(、|或|與|和)/g, "")
      .replace(/無盡之塔／/g, "")
      .replace(/；?無盡之塔[^；。]*[；。]?/g, (m) => (m.startsWith("；") ? "；" : ""));
  for (const hv of Object.values(HELP)) for (const r of Array.isArray(hv?.[1]) ? hv[1] : []) if (Array.isArray(r) && typeof r[1] === "string") r[1] = r[1].replace(/、塔、/g, "、");
  for (const [k, hv] of Object.entries(HELP)) {
    const rows = Array.isArray(hv?.[1]) ? hv[1] : null;
    if (!rows) continue;
    for (let i = rows.length - 1; i >= 0; i--) {
      const r = rows[i];
      if (!Array.isArray(r) || typeof r[1] !== "string" || !r[1].includes("無盡之塔")) continue;
      if (/^無盡之塔/.test(r[1]) || r[0] === "上榜") rows.splice(i, 1);
      else r[1] = fix(r[1]);
    }
  }
  if (ui.m_audiocr) {
    const ac = ui.m_audiocr;
    ui.m_audiocr = function (...a) {
      const h = ac.apply(this, a);
      return typeof h === "string" ? h.replace(/無盡之塔／/g, "") : h;
    };
  }
}

// ---------------------------------------------------------------------------
// 7. MVP 武道場自動挑戰：勾選後門票滿 5 張就自動挑戰（使用設定的自動挑戰生命 %；其他戰鬥中不觸發）
function v72MvpAutoInstall() {
  if (typeof v64MvpCard !== "function" || typeof v64MvpStart !== "function") return;
  const mc = v64MvpCard;
  v64MvpCard = function (...a) {
    const h = mc.apply(this, a);
    const chk = `<label class="chk" style="margin-top:6px"><input type="checkbox" data-v72mvpauto ${S?.set?.v72mvp ? "checked" : ""}><span>自動挑戰：門票滿 ${V64_TK.need} 張時自動挑戰 MVP</span></label>`;
    return h.replace(/<\/section>\s*$/, chk + "</section>");
  };
  if (typeof document !== "undefined")
    document.addEventListener("change", (e) => {
      const el = e.target;
      if (!el || !el.matches || !el.matches("[data-v72mvpauto]") || !S) return;
      S.set.v72mvp = el.checked ? 1 : 0;
      G && (G.v72mvpT = 0);
      markDirty();
    });
  const tk = tick;
  tick = function (dt, ...x) {
    const r = tk.call(this, dt, ...x);
    try {
      if (S?.set?.v72mvp && G && !G.dead && !G.v64mvp && G.guard == null && G.trial == null && canStartA() && abReady() && (S.mat.tk1 || 0) >= V64_TK.need && S.lvl >= RO_ARENA.minLv && G.t >= (G.v72mvpT || 0)) {
        G.v72mvpT = G.t + 3;
        v64MvpStart();
      }
    } catch (e) {}
    return r;
  };
  const h = HELP.v64mvp?.[1];
  if (Array.isArray(h) && !h.some((r) => r[0] === "自動挑戰")) h.push(["自動挑戰", `在 MVP 武道場卡片勾選「自動挑戰」後，門票滿 ${V64_TK.need} 張就會自動挑戰（生命需高於設定的自動挑戰生命 %，魔王、武鬥場、試煉等戰鬥中不會觸發）。`]);
}

// ---------------------------------------------------------------------------
function v72Install() {
  v72FinalInstall();
  v72TowerInstall();
  v72MvpAutoInstall();
  v72AuraInstall();
  v72HideInstall();
  v72MerchantInstall();
  v72SnipeInstall();
  v72LegInstall();
  v72DescInstall();
  v72FxInstall();
  v72TokenInstall();
  v72TreeInstall();
}
if (typeof roV4Install === "function") {
  const r4v72 = roV4Install;
  roV4Install = function () {
    r4v72();
    v72Install();
  };
}
