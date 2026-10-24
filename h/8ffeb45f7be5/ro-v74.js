/* 流浪仙境 v7.4：魔王震地可閃避並加大範圍、環狀彈幕同一波最多中 1 發、主宰裝新掉落的品質與插槽保底、設定新增「關閉打擊特效」、武鬥場負面效果改深紅色、武鬥場 MVP 門票（小怪、菁英）減半 */

// ---------------------------------------------------------------------------
// 1. 震地（伊夫利特全程、巴風特第 2 階段、闇答萊屍第 4 階段）
//    原本不在自動閃避的判斷裡：近戰每次必中、遠程從不中。
//    現在跟其他紅色預警一樣，依移動速度有 20～60% 機率嘗試閃避；範圍 36 → 48，
//    蓄力 1.2 秒內移動速度不夠快時，即使閃避也可能來不及跑出紅圈。
const V74_SLAM = { r: 48 };
function v74SlamInstall() {
  const r0 = GUARD_SLAM.r;
  GUARD_SLAM.r = V74_SLAM.r;
  const gt = guardTick;
  guardTick = function (t, a, ...x) {
    const r = gt.call(this, t, a, ...x);
    const s = t && t.gm;
    if (s && s.slam > 0) {
      if (!s.v74on) {
        s.v74on = 1;
        s.v74dg = RAND() < clamp((DODGE.base * PS.move) / 32, DODGE.lo, DODGE.hi);
      }
      G.v74sl = s.v74dg ? { s, b: t } : null;
    } else if (s) {
      s.v74on = 0;
      if (G.v74sl && G.v74sl.s === s) G.v74sl = null;
    }
    return r;
  };
  const dd = dodgeDir;
  dodgeDir = function (...a) {
    const r = dd.apply(this, a);
    if (r) return r;
    const o = G.v74sl;
    if (!o || G.guard == null || !(o.s.slam > 0) || !alive(o.b)) return null;
    const p = G.pl;
    let dx = p.x - o.s.x,
      dy = p.y - o.s.y;
    if (Math.hypot(dx, 1.4 * dy) > GUARD_SLAM.r + 3) return null;
    const d = Math.hypot(dx, dy);
    if (d < 0.5) (dx = 1), (dy = 0);
    else (dx /= d), (dy /= d);
    if ((p.x < 14 && dx < 0) || (p.x > G.W - 14 && dx > 0)) dx = 0;
    if ((p.y < G.top + 12 && dy < 0) || (p.y > G.H - 10 && dy > 0)) dy = 0;
    if (!dx && !dy) dy = p.y < (G.top + G.H) / 2 ? 1 : -1;
    return [dx, dy];
  };
  for (const hv of Object.values(HELP))
    for (const row of Array.isArray(hv?.[1]) ? hv[1] : [])
      if (Array.isArray(row) && typeof row[1] === "string" && /蓄力重擊.*紅圈內受到/.test(row[1]) && !row[1].includes("可閃避"))
        row[1] += `紅圈範圍 ${r0} → ${V74_SLAM.r}；可閃避（與其他紅色預警相同，依移動速度有 20～60% 機率嘗試），移動太慢時可能來不及跑出紅圈。`;
}

// ---------------------------------------------------------------------------
// 2. 環狀彈幕（頭目「彈幕」、菁英「遠射」）：同一波對角色最多造成 1 次傷害。
//    原本子彈從頭目身上往外射，近戰貼身時會一次吃好幾發。
const V74_W = [];
function v74VolleyInstall() {
  const r8 = ring8;
  ring8 = function (...a) {
    const n0 = G.proj.length;
    const r = r8.apply(this, a);
    const w = { hit: 0 };
    for (let i = n0; i < G.proj.length; i++) {
      const p = G.proj[i];
      if (p && p.enemy) V74_W.push({ p, w });
    }
    return r;
  };
  const dp = damagePlayer;
  damagePlayer = function (d, x, y, src, n) {
    if (n === undefined && V74_W.length) {
      const e = V74_W.find((o) => o.p.x === x && o.p.y === y && o.p.dmg === d && o.p.src === src);
      if (e) {
        if (e.w.hit) return;
        e.w.hit = 1;
      }
    }
    return dp.call(this, d, x, y, src, n);
  };
  const tk = tick;
  tick = function (...a) {
    const r = tk.apply(this, a);
    if (V74_W.length) {
      const live = new Set(G.proj);
      for (let i = V74_W.length - 1; i >= 0; i--) if (!live.has(V74_W[i].p)) V74_W.splice(i, 1);
    }
    return r;
  };
  const vt = "同一波對角色最多造成 1 次傷害。";
  for (const hv of Object.values(HELP))
    for (const row of Array.isArray(hv?.[1]) ? hv[1] : [])
      if (Array.isArray(row) && typeof row[1] === "string" && /彈幕：向四周射出/.test(row[1]) && !row[1].includes(vt))
        row[1] = row[1].replace(/(彈幕：向四周射出[^。]*)。/, `$1，${vt}`);
}

// ---------------------------------------------------------------------------
// 3. 主宰裝備（巴風特掉落）：新掉落的品質 100%～150%（原本固定 150%）；
//    插槽保底：武器 3～7 孔、其他部位 1～4 孔，超過保底的孔數沿用原本的稀有權重。
//    已取得的主宰裝備不變。
const V74_MY = { q: [1.0, 1.5], minW: 3, minA: 1 };
function v74MythInstall() {
  const vr = v5Range;
  v5Range = function (it) {
    return it && it.my && it.v74my && !it.uq ? V74_MY.q : vr(it);
  };
  v67MythGear = function () {
    const slot = SLOTS[ri(0, SLOTS.length - 1)],
      it = makeItem(V71_MY_L, { slot, rar: 4 });
    if (!it) return null;
    it.my = 1;
    it.v74my = 1;
    delete it.uq;
    delete it.v5;
    v5Convert(it);
    it.v71l = 1;
    const cap = v5SlotCap(it),
      min = Math.min(cap, it.slot === "weapon" ? V74_MY.minW : V74_MY.minA);
    it.cs = min + v5RollSlots(cap - min);
    it.cards = Array(it.cs).fill(null);
    v5Name(it);
    return it;
  };
  const q = `${V74_MY.q[0] * 100}%～${V74_MY.q[1] * 100}%`;
  for (const hv of Object.values(HELP))
    for (const row of Array.isArray(hv?.[1]) ? hv[1] : []) {
      if (!Array.isArray(row) || typeof row[1] !== "string") continue;
      row[1] = row[1]
        .replace("任何部位，品質 150%，插槽武器 0～7 孔、其他部位 0～4 孔（越多孔越稀有）。", `任何部位，品質 ${q}，插槽武器 ${V74_MY.minW}～7 孔、其他部位 ${V74_MY.minA}～4 孔（越多孔越稀有；v7.4 以前取得的維持原本的品質與孔數）。`)
        .replace("主宰 0～7", `主宰 ${V74_MY.minW}～7`)
        .replace("主宰 0～4", `主宰 ${V74_MY.minA}～4`);
    }
}

// ---------------------------------------------------------------------------
// 4. 設定 → 畫面：「關閉打擊特效」
//    關閉命中火花、命中停頓、技能彈道的命中動畫、特效選單的擊中特效；
//    擊殺特效、技能施放動畫、傷害數字、畫面晃動不受影響。
let v74Hit = 0, v74Ph = null;
const v74NoHit = () => !!S?.set?.v74nohit;
function v74HitFxInstall() {
  // 只關 hitMob 裡「造成傷害之前」的火花與停頓；之後的擊殺特效、死亡碎片、觸發技能照常
  const hm = hitMob;
  hitMob = function (...a) {
    if (!v74NoHit()) return hm.apply(this, a);
    const prev = v74Hit;
    v74Hit = 1;
    try {
      return hm.apply(this, a);
    } finally {
      v74Hit = prev;
    }
  };
  const dm = dealMob;
  dealMob = function (...a) {
    v74Hit = 0;
    return dm.apply(this, a);
  };
  const bu = burst;
  burst = function (...a) {
    if (v74Hit) return;
    return bu.apply(this, a);
  };
  const hs = hitStop;
  hitStop = function (...a) {
    if (v74Hit) return;
    return hs.apply(this, a);
  };
  const ph = projHit;
  projHit = function (p, target, ...a) {
    if (!v74NoHit() || !p || !p.roSkill || !target) return ph.call(this, p, target, ...a);
    const prev = v74Ph;
    v74Ph = { id: p.roSkill, t: target };
    try {
      return ph.call(this, p, target, ...a);
    } finally {
      v74Ph = prev;
    }
  };
  const fa = roFxAdd;
  roFxAdd = function (id, x, y, ...a) {
    if (v74Ph && id === v74Ph.id && x === v74Ph.t.x && y === v74Ph.t.y) return;
    return fa.call(this, id, x, y, ...a);
  };
  const gh = gfHit;
  gfHit = function (...a) {
    if (v74NoHit()) return;
    return gh.apply(this, a);
  };
  const ms = ui.m_set;
  ui.m_set = function (...a) {
    const h = ms.apply(this, a);
    if (typeof h !== "string" || h.includes("data-v74nohit")) return h;
    return h.replace(
      "<span>關閉畫面晃動</span></label>",
      `<span>關閉畫面晃動</span></label><label class="chk"><input type="checkbox" data-v74nohit ${v74NoHit() ? "checked" : ""}><span>關閉打擊特效（命中火花、命中停頓、技能命中動畫、擊中特效）</span></label>`,
    );
  };
  if (typeof document !== "undefined")
    document.addEventListener("change", (e) => {
      const el = e.target;
      if (!el || !el.matches || !el.matches("[data-v74nohit]") || !S) return;
      S.set.v74nohit = el.checked ? 1 : 0;
      markDirty();
    });
  if (HELP.fx?.[1] && !HELP.fx[1].some((r) => r[0] === "關閉打擊特效"))
    HELP.fx[1].push(["關閉打擊特效", "選單 → 設定 → 畫面可勾選「關閉打擊特效」：關閉命中火花、命中停頓、技能彈道的命中動畫與這裡選的擊中特效（擊殺特效不受影響）。"]);
}

// ---------------------------------------------------------------------------
// 5. 武鬥場側欄的負面效果（與一般地圖的石板負面詞綴）：淺橘紅色在淺色底上看不清楚，改為深紅粗體
function v74CurseCssInstall() {
  if (typeof document === "undefined" || document.getElementById("v74css")) return;
  const st = document.createElement("style");
  st.id = "v74css";
  st.textContent = `#slChip .dg{color:#b3261e;font-weight:700}
#slChip .hd{color:#6b5634;font-weight:700}`;
  document.head.appendChild(st);
}

// ---------------------------------------------------------------------------
// 6. 武鬥場 MVP 門票：小怪、菁英的基礎掉率與每 10 層提升幅度減半，頭目不變
//    （小怪 0.05%→0.025%、菁英 0.25%→0.125%，每 10 層 +0.15%→+0.075%；門票約 9 成來自小怪）
//    在載入時調整，說明文字安裝時會用新數值產生
for (const k of ["mob", "elite"]) V64_TK[k] = V64_TK[k].map((v) => +(v * 0.5).toPrecision(6));

// ---------------------------------------------------------------------------
function v74Install() {
  v74SlamInstall();
  v74VolleyInstall();
  v74MythInstall();
  v74HitFxInstall();
  v74CurseCssInstall();
}
if (typeof roV4Install === "function") {
  const r4v74 = roV4Install;
  roV4Install = function () {
    r4v74();
    v74Install();
  };
}
