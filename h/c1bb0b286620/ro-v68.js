/* 流浪仙境 v6.8：護甲與閃避重做（固定扣減＋減傷%、依怪物等級、職業上限）、閃避型防具同時提供護甲、傳說的魔力礦石（鑲嵌）改為失敗不損毀 */

// ---------------------------------------------------------------------------
// 1、2. 護甲與閃避
//   護甲第一段：每次受到的傷害先減去「護甲 × 0.5%」（每 200 護甲減 1 點），單次最多減掉一半
//   護甲第二段：減傷% = 護甲 ÷（護甲 ＋ 18 × 怪物等級），上限依職業
//   閃避率 = 閃避 ÷（閃避 ＋ 8 × 怪物等級），上限依職業
//   怪物等級低於 60 時以 60 計算（前期維持與舊版相近的手感）
const V68 = {
  flat: 0.005,
  flatMax: 0.5,
  ka: 18,
  ke: 8,
  lvMin: 60,
  capA: { sword: 85, thief: 75, acolyte: 75, merchant: 75, bow: 65, mage: 65 },
  capE: { thief: 75, bow: 75, mage: 60, acolyte: 60, merchant: 60, sword: 45 },
  // 閃避型防具：護甲 = 防禦基底 × 0.6、閃避 = 防禦基底 × 0.5（原本只有閃避 = 基底 × 0.45）
  evaArm: 0.6,
  evaEva: 0.5,
  // 職業修正（v6.9 起使用）：amul＝護甲效率（同時影響固定扣減與減傷%）、fmul＝固定扣減倍率、kemul＝閃避難度
  amul: {},
  fmul: {},
  kemul: {},
};
const v68CapA = () => V68.capA[S?.cls] ?? 75;
const v68CapE = () => V68.capE[S?.cls] ?? 60;
const v68K = (k, lv) => k * Math.max(V68.lvMin, lv || 1);
const v68Cm = (o) => (o && S && o[S.cls]) || 1;
const v68AEff = (armor) => armor * v68Cm(V68.amul);
const v68Flat = (armor) => v68AEff(armor) * V68.flat * v68Cm(V68.fmul);
const v68ArmRaw = (armor, lv) => {
  const a = v68AEff(armor);
  return a > 0 ? (100 * a) / (a + v68K(V68.ka, lv)) : 0;
};
const v68EvaRaw = (eva, lv) => (eva > 0 ? (100 * eva) / (eva + v68K(V68.ke, lv) * v68Cm(V68.kemul)) : 0);
const v68ArmPct = (armor, lv) => Math.min(v68CapA(), v68ArmRaw(armor, lv));
const v68Dodge = (eva, lv) => Math.min(v68CapE(), v68EvaRaw(eva, lv));
// 目前所在地圖（或無盡之塔／無限武鬥場）的怪物等級
function v68CtxLv() {
  try {
    if (G && G.tw) return TW.lv;
    const l = mapLv();
    return Array.isArray(l) ? l[1] : l || S.lvl;
  } catch (e) {
    return S?.lvl || 1;
  }
}
function v68Apply(lv = v68CtxLv()) {
  if (!PS) return;
  PS.v68lv = lv;
  PS.armFlat = v68Flat(PS.armor);
  PS.armRed = v68ArmPct(PS.armor, lv);
  PS.armRaw = v68ArmRaw(PS.armor, lv);
  PS.dodge = v68Dodge(PS.eva, lv);
  PS.dodgeV68 = v68EvaRaw(PS.eva, lv);
  // dodgeRaw（閃避值 ÷ 15）保留給「暴擊率由閃避值決定」與陷阱加成使用
}
function v68DefInstall() {
  const rc = recalc;
  recalc = function (...a) {
    const r = rc.apply(this, a);
    v68Apply();
    return r;
  };
  // 每次受到攻擊：依攻擊者等級計算；先扣固定值，再進入原本的減傷流程（護甲減傷%、閃避、天賦卡片減傷、屬性抗性…）
  const dp = damagePlayer;
  damagePlayer = function (d, x, y, src, n) {
    if (!PS || !(d > 0)) return dp.call(this, d, x, y, src, n);
    const lv = src && src.lv ? src.lv : v68CtxLv(),
      a0 = PS.armRed,
      g0 = PS.dodge,
      fl = Math.min(v68Flat(PS.armor), d * V68.flatMax);
    PS.armRed = v68ArmPct(PS.armor, lv);
    PS.dodge = v68Dodge(PS.eva, lv);
    try {
      return dp.call(this, d - fl, x, y, src, n);
    } finally {
      PS.armRed = a0;
      PS.dodge = g0;
    }
  };
  // 守護靈同樣使用新公式（依攻擊者等級，並先扣固定值）
  if (typeof gspHurt === "function") {
    const gh = gspHurt;
    gspHurt = function (t, a, s, ...x) {
      if (!PS || !(a > 0)) return gh.call(this, t, a, s, ...x);
      const lv = s && s.lv ? s.lv : v68CtxLv(),
        a0 = PS.armRed,
        g0 = PS.dodge;
      PS.armRed = v68ArmPct(PS.armor, lv);
      PS.dodge = v68Dodge(PS.eva, lv);
      try {
        return gh.call(this, t, a - Math.min(v68Flat(PS.armor), a * V68.flatMax), s, ...x);
      } finally {
        PS.armRed = a0;
        PS.dodge = g0;
      }
    };
  }
  // 角色面板
  const cs = ui.charStats;
  ui.charStats = function (...a) {
    v68Apply();
    let h = cs.apply(this, a);
    if (!PS) return h;
    const lv = PS.v68lv,
      f1 = (v) => +v.toFixed(1),
      capA = v68CapA(),
      capE = v68CapE(),
      over = (raw, cap) => (raw - cap > 0.05 ? `（未封頂 ${f1(raw)}%）` : "");
    h = h.replace(
      /<dt>護甲 \/ 減傷<\/dt><dd>[^<]*<\/dd>/,
      `<dt>護甲</dt><dd>${PS.armor}${v68Cm(V68.amul) !== 1 ? `（職業加成 +${Math.round((v68Cm(V68.amul) - 1) * 100)}%）` : ""}</dd><dt>固定扣減</dt><dd>每次 −${f1(PS.armFlat)}（最多減半）</dd><dt>護甲減傷</dt><dd>${f1(PS.armRed)}%${over(PS.armRaw, capA)}／上限 ${capA}%</dd>`,
    );
    h = h.replace(
      /<dt>閃避 \/ 閃避率<\/dt><dd>[^<]*(<span id="lvDg"><\/span>)?<\/dd>/,
      (m, sp) => `<dt>閃避 / 閃避率</dt><dd>${PS.eva} / ${f1(PS.dodge)}%${over(PS.dodgeV68, capE)}／上限 ${capE}%${sp || ""}</dd><dt style="grid-column:1/-1;color:var(--muted);font-size:11px">以 Lv${lv} 怪物計算（怪物等級越高越難減傷與閃避；低於 Lv60 以 60 計）</dt>`,
    );
    return h;
  };
  // 說明
  if (HELP.char && Array.isArray(HELP.char[1])) {
    const rows = HELP.char[1],
      set = (name, txt) => {
        const r = rows.find((x) => x[0] === name);
        if (r) r[1] = txt;
        else rows.push([name, txt]);
      },
      cap = (o) =>
        Object.entries(o)
          .sort((a, b) => b[1] - a[1])
          .reduce((m, [k, v]) => ((m[v] ||= []).push(CLASS[k]?.n || k), m), {}),
      capTxt = (o) =>
        Object.entries(cap(o))
          .sort((a, b) => b[0] - a[0])
          .map(([v, ns]) => `${ns.join("、")} ${v}%`)
          .join("；");
    set("護甲", `受到攻擊時分兩段計算：先減去「護甲 × ${V68.flat * 100}%」的固定傷害（單次最多減掉一半），再依護甲減傷％降低：護甲 ÷（護甲 ＋ ${V68.ka} × 怪物等級）。減傷上限依職業：${capTxt(V68.capA)}。之後才計算天賦、卡片的受到傷害降低與屬性抗性。`);
    set("閃避", `閃避率 ＝ 閃避 ÷（閃避 ＋ ${V68.ke} × 怪物等級）。上限依職業：${capTxt(V68.capE)}。怪物等級低於 ${V68.lvMin} 時以 ${V68.lvMin} 計算；角色面板顯示的是對目前地圖怪物的數值。`);
    const nm = (k) => CLASS[k]?.n || k,
      mods = [
        ...Object.entries(V68.amul).map(([k, v]) => `${nm(k)}護甲效率 +${Math.round((v - 1) * 100)}%`),
        ...Object.entries(V68.fmul).map(([k, v]) => `${nm(k)}固定扣減 ×${v}`),
        ...Object.entries(V68.kemul).map(([k, v]) => `${nm(k)}閃避難度 ×${v}`),
      ];
    if (mods.length) set("職業修正", `${mods.join("；")}。護甲效率同時提高固定扣減與減傷%，但不改變護甲值本身（以護甲計算的傷害效果不受影響）。`);
    set("閃避型防具", `圓盾、髮箍、斗篷、披風、涼鞋等閃避型防具同時提供護甲（防禦基底 × ${V68.evaArm}）與閃避（防禦基底 × ${V68.evaEva}）。`);
  }
  // 以閃避值換算的效果改用「閃避值 ÷ 15」描述（與新的閃避率無關）
  if (typeof V5_TAL_TXT !== "undefined") V5_TAL_TXT.critEva = () => "暴擊率 ＝ 閃避值 ÷ 15（不受閃避率上限影響）；裝備與其他來源的暴擊率無效";
  if (typeof RO_TREE_NODES !== "undefined")
    for (const n of Object.values(RO_TREE_NODES))
      if (n && typeof n.desc === "string" && n.desc.includes("暴擊率改由閃避率決定"))
        n.desc = n.desc.replace(/暴擊率改由閃避率決定，包含超過閃避上限的部分/, "暴擊率改由閃避值決定（閃避值 ÷ 15，不受閃避率上限影響）");
}

// ---------------------------------------------------------------------------
// 3. 閃避型防具同時提供護甲：新掉落直接套用，既有裝備（身上、背包、倉庫）自動換算
function v68EvaGear(it) {
  if (!it || !it.v5 || it.dt !== "e" || it.arm || !(it.eva > 0)) return false;
  const b = it.eva / V5_EVA;
  it.eva = Math.max(1, Math.round(V68.evaEva * b));
  it.arm = Math.max(1, Math.round(V68.evaArm * b));
  return true;
}
function v68GearInstall() {
  const vc = v5Convert;
  v5Convert = function (it, ...x) {
    const r = vc.call(this, it, ...x);
    v68EvaGear(r && r.slot ? r : it);
    return r;
  };
  const ens = roEnsureStats;
  roEnsureStats = function (...a) {
    const r = ens.apply(this, a);
    try {
      if (S && S.v68g !== 1) {
        S.v68g = 1;
        let n = 0;
        for (const s of SLOTS) if (v68EvaGear(S.equip[s])) n++;
        for (const it of S.bag || []) if (v68EvaGear(it)) n++;
        try {
          const st = STH || stLoad();
          let k = 0;
          for (const x of st.it || []) if (x && v68EvaGear(x.o)) k++;
          if (k) stWrite(st);
          n += k;
        } catch (e) {}
        if (n) later(1.2, () => toast(`護甲與閃避改版：${n} 件閃避型防具已加上護甲`, "lvl", 1));
      }
    } catch (e) {}
    return r;
  };
}

// ---------------------------------------------------------------------------
// 4. 鑲嵌卡片時勾選「傳說的魔力礦石」：不再必定成功，成功率照常；失敗時卡片 100% 退回（精煉、拆卸仍必定成功）
function v68LgInstall() {
  const ins = v5Insert;
  v5Insert = function (u, i, id) {
    if (!v64LgOn()) return ins.call(this, u, i, id);
    const it = v5Find(u),
      c = V5_CARD[id],
      st = v5St();
    if (!it || !c || !it.cards || it.cards[i] || !v5CardOk(c, it.slot) || !(st.cards[id] > 0)) return;
    const z = v5InsZeny(c.t),
      ore = v64OreK("e", c.t);
    if (!((S.mat[ore] || 0) > 0) || S.ash < z) return void toast(`需要「${MATS[ore].n}」與 Zeny ${fmt(z)}`, "bad");
    S.mat[ore]--;
    S.ash -= z;
    S.mat.lg1--;
    const ok = RAND() * 100 < V5_INS_OK[c.t];
    if (ok) {
      st.cards[id]--;
      if (!st.cards[id]) delete st.cards[id];
      it.cards[i] = id;
    }
    ui.v5res = { t: performance.now(), ok, txt: ok ? `鑲嵌成功：${c.n}（傳說的魔力礦石）` : `鑲嵌失敗，${c.n}受傳說的魔力礦石保護已退回` };
    ui.v5pick = null;
    sfx(ok ? "alch" : "alchF", ok ? Math.min(3, c.t) : 1);
    recalc();
    markDirty();
    ui.refreshIf("alch", "bag", "char");
  };
  const LG_OLD = "使用「傳說的魔力礦石」：必定成功（每次消耗 1 顆）",
    LG_NEW = "使用「傳說的魔力礦石」：鑲嵌失敗時卡片必定退回、拆卸必定成功（每次消耗 1 顆）";
  const sk = v5SockTab;
  v5SockTab = function (...a) {
    let h = sk.apply(this, a);
    h = h.replace(LG_OLD, LG_NEW);
    if (v64LgOn())
      h = h.replace(/成功率 <b class="px">100%<\/b>([\s\S]*?)data-k="([^"]+)"/g, (m, mid, id) => {
        const c = V5_CARD[id];
        return c ? `成功率 <b class="px">${V5_INS_OK[c.t]}%</b>・失敗時卡片必定退回${mid}data-k="${id}"` : m;
      });
    return h;
  };
  const T_ALCH = "精煉、拆卸卡片時勾選使用必定成功；鑲嵌卡片時成功率照常，但失敗時卡片必定退回（每次 1 顆）";
  if (typeof V64_MAT_USE !== "undefined") V64_MAT_USE.lg1 = `${T_ALCH}；MVP 武道場 10% 掉落`;
  const row = (k, name, txt) => {
    const r = HELP[k]?.[1]?.find((x) => x[0] === name);
    if (r) r[1] = txt;
  };
  row("alch", "傳說的魔力礦石", `${T_ALCH}。只由 MVP 武道場掉落。`);
  row("v5sock", "傳說的魔力礦石", "勾選後鑲嵌的成功率照常，但失敗時卡片必定退回；拆卸必定成功。每次消耗 1 顆；此時不會使用保護祝福。");
  row("v5mat", "傳說的魔力礦石", "精煉、拆卸卡片必定成功；鑲嵌卡片失敗時卡片必定退回。MVP 武道場 10% 掉落。");
}

// ---------------------------------------------------------------------------
function v68Install() {
  v68DefInstall();
  v68GearInstall();
  v68LgInstall();
}
if (typeof roV4Install === "function") {
  const r4v68 = roV4Install;
  roV4Install = function () {
    r4v68();
    v68Install();
  };
}
