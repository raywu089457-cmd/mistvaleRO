/* 流浪仙境 v7.9：精煉上限 +15 與成功率、能力值效果加強、防具飾品隨機能力值、頭目招式依速度判斷閃躲、移除神器欄位與石板相關說明、活動地圖小怪換成 RO 原版怪物 */

// ---------------------------------------------------------------------------
// 1. 精煉：武器、防具、飾品上限 +10 → +15；成功率調整；防具與飾品 +11 起每次精煉必須消耗神工匠的祝福
//    ・成功率：+5 85%、+6 72%、+7 60%、+8 48%、+9 38%、+10 30%、+11 22%、+12 18%、+13 14%、+14 10%、+15 7%
//    ・+11～+15 延續原本的成長：基底倍率 +10 ×1.76 → +15 ×2.42；額外素質每級 +3%（+15 為 +45%）
//    ・+9 以上使用高純度神之金屬／高純度鋁，Zeny 依原本公式（目標精煉值平方 × 裝備等級）
//    ・神工匠的祝福必須消耗：武器目前精煉值 +6 以上（原規則）；防具與飾品目前 +10 以上（精煉到 +11～+15）
//      必須消耗時不提供保護，失敗照常 −1；其餘 +5～+10 仍可勾選保護（+5～+7 鐵匠的祝福或神工匠的祝福、+8～+10 神工匠的祝福）
//    ・傳說的魔力礦石：必定成功；需要神工匠的祝福的精煉仍要同時消耗
const V79_REF = {
  max: 15,
  ok: [0, 100, 100, 100, 100, 85, 72, 60, 48, 38, 30, 22, 18, 14, 10, 7],
  mul: [1, 1.06, 1.12, 1.18, 1.24, 1.31, 1.38, 1.46, 1.55, 1.65, 1.76, 1.88, 2.0, 2.13, 2.27, 2.42],
  armLv: 10, // 防具與飾品目前精煉值達此值起，精煉必須消耗神工匠的祝福
};
const v79RefLv = (it) => Math.min(V79_REF.max, it?.ref || 0);
const v79Need = (it) => !!it && (it.ref || 0) < V79_REF.max && (it.ref || 0) >= (it.slot === "weapon" ? V63_BLESS.wpnLv : V79_REF.armLv);
const v79Lg = () => typeof v64LgOn === "function" && v64LgOn();
const v79BlessSrc = () => `無限武鬥場頭目關、Lv${typeof V77_BLESS !== "undefined" ? V77_BLESS.lv : 90} 以上頭目掉落`;
// +10 以上的額外倍率（原本的計算封頂在 +10）
const v79Over = (it) => {
  const r = v79RefLv(it);
  return r > 10 ? V79_REF.mul[r] / V79_REF.mul[10] : 1;
};
function v79Refine(u) {
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
  const prot = !need && !lg && ui.v5prot && lv >= 5 ? (lv <= 7 && S.mat.p1 > 0 ? "p1" : S.mat.p2 > 0 ? "p2" : null) : null;
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
function v79RefTop(it) {
  const lv = (it.ref || 0) + 1,
    L = Math.min(V79_REF.max, lv);
  let body;
  if (lv > V79_REF.max) body = `<p class="note">已達精煉上限 +${V79_REF.max}。</p>`;
  else {
    const mat = v5RefMat(it, lv),
      z = v5RefZeny(it, lv),
      need = v79Need(it),
      lg = v79Lg(),
      prot = !need && lv >= 5 ? (lv <= 7 ? "p1" : "p2") : null,
      can = v5Have(mat) && S.ash >= z && (!need || (S.mat.p2 || 0) > 0);
    const needTxt = need
      ? `<p class="note" style="margin:2px 0">${it.slot === "weapon" ? `武器 +${V63_BLESS.wpnLv}` : `防具與飾品 +${V79_REF.armLv}`} 以上：每次精煉消耗 1 個「${MATS.p2.n}」（${v79BlessSrc()}），不提供保護，失敗時精煉值照常下降。持有 <span class="px">${S.mat.p2 || 0}</span></p>`
      : "";
    body = `<div class="v5cost">${need ? v5MatTag("p2") : ""}${v5MatTag(mat)}${v5ZenyTag(z)}</div>
        <div class="row"><span>成功率 <b class="px">${lg ? 100 : V79_REF.ok[lv]}%</b></span><span class="spacer"></span><span class="note" style="margin:0">${lv <= 4 ? "安全精煉" : lv <= 5 ? "失敗時精煉值不變" : "失敗時精煉值 −1"}</span></div>
        ${needTxt}
        ${prot ? `<label class="chk"><input type="checkbox" data-v5="prot" ${ui.v5prot ? "checked" : ""} ${lg ? "disabled" : ""}><span>使用保護（${lv <= 7 ? "鐵匠的祝福或神工匠的祝福" : "神工匠的祝福"}）：失敗時精煉值不變　持有 <span class="px">${S.mat.p1 || 0}</span>／<span class="px">${S.mat.p2 || 0}</span></span></label>` : ""}
        ${typeof v64LgBox === "function" ? v64LgBox() : ""}
        <button class="btn primary" data-v5="refine" data-u="${it.u}" ${can ? "" : "disabled"}>精煉 +${it.ref || 0} → +${lv}</button>`;
  }
  return `<div class="board v5sel">${ui.itemHead(it)}${v5StatHtml(it)}<h3 style="margin:8px 0 4px">精煉 +${L}・基底 ×${V79_REF.mul[L]}、額外素質 +${3 * L}%</h3>${body}</div>`;
}
function v79RefineInstall() {
  // 成功率表（原陣列就地更新，其他地方讀到的也是新數值）
  for (let i = 0; i < V79_REF.ok.length; i++) V5_REF_OK[i] = V79_REF.ok[i];
  v5Refine = v79Refine;
  // +11～+15 的基底加成
  const wl = weaponLocal;
  weaponLocal = function (t, ...a) {
    const r = wl.call(this, t, ...a),
      k = v79Over(t);
    if (k !== 1 && r) (r.mn = Math.round(r.mn * k)), (r.mx = Math.round(r.mx * k));
    return r;
  };
  const sh = v5StatHtml;
  v5StatHtml = function (t, ...a) {
    const k = v79Over(t);
    if (k === 1 || t.slot === "weapon") return sh.call(this, t, ...a);
    const c = Object.assign(Object.create(Object.getPrototypeOf(t)), t);
    if (c.arm) c.arm *= k;
    if (c.eva) c.eva *= k;
    if (c.hp) c.hp *= k;
    return sh.call(this, c, ...a);
  };
  const cm = collectMods;
  collectMods = function (...a) {
    const out = cm.apply(this, a);
    if (!S) return out;
    const h2 = S.equip.weapon?.h2 && canWear(S.equip.weapon);
    for (const sl of SLOTS) {
      const it = S.equip[sl];
      if (!it || !it.v5 || sl === "weapon" || !canWear(it) || (sl === "shield" && h2)) continue;
      const k = v79Over(it);
      if (k === 1) continue;
      const add = V79_REF.mul[10] * (k - 1); // 原本已算到 ×1.76
      if (it.arm) out.push({ s: "armor", v: it.arm * add, src: sl });
      if (it.eva) out.push({ s: "eva", v: it.eva * add, src: sl });
      if (it.hp) out.push({ s: "life", v: it.hp * add, src: sl });
    }
    return out;
  };
  // 精煉頁：上方的精煉區塊改用新規則重畫（下方裝備清單與篩選不變）
  const rt = v5RefTab;
  v5RefTab = function (...a) {
    const h = rt.apply(this, a),
      it = v5Find(ui.v5sel);
    if (!it || typeof h !== "string") return h;
    return h.replace(/<div class="board v5sel">[\s\S]*?<\/div>(?=<h3>選擇裝備<\/h3>)/, () => v79RefTop(it));
  };
  // 說明文字
  if (typeof V64_MAT_USE !== "undefined") {
    V64_MAT_USE.x4 = "武器精煉 +9～+15";
    V64_MAT_USE.i4 = "防具與飾品精煉 +9～+15";
    V64_MAT_USE.p2 = `武器 +${V63_BLESS.wpnLv} 以上、防具與飾品 +${V79_REF.armLv} 以上精煉必須消耗；精煉 +8～+10、鑲嵌史詩與傳說卡片失敗時的保護（神話卡片不能用）；由${v77BlessTxt()}`;
  }
  const okTxt = V79_REF.ok.map((v, i) => (i >= 5 ? `+${i} ${v}%` : "")).filter(Boolean).join("、");
  const ref = HELP.v5ref?.[1];
  if (ref) {
    const set = (k, v) => {
      const r = ref.find((x) => x[0] === k);
      if (r) r[1] = v;
      else ref.push([k, v]);
    };
    set("效果", `每 +1 精煉提升基底（武器攻擊、護甲、閃避、生命）約 6%～11%，+10 時為 ×1.76、+15 時為 ×2.42；額外素質每級 +3%（+15 為 +45%）。`);
    set("成功率", `+1～+4 必定成功；${okTxt}。`);
    set("失敗", "+5 失敗時精煉值不變；+6 以上失敗時精煉值 −1。裝備不會損毀。");
    set("保護", "勾選保護後，失敗時精煉值不變：+5～+7 使用鐵匠的祝福（沒有時改用神工匠的祝福），+8～+10 只能使用神工匠的祝福。必須消耗神工匠的祝福的精煉不提供保護。");
    set("神工匠的祝福", `必須消耗（每次 1 個，不提供保護，失敗照常降級）：武器 +${V63_BLESS.wpnLv} 以上、防具與飾品 +${V79_REF.armLv} 以上（精煉到 +11～+15）。由${v77BlessTxt()}。`);
    set("傳說的魔力礦石", "勾選後精煉必定成功，消耗 1 顆；必須消耗神工匠的祝福的精煉仍要同時消耗。");
  }
  const al = HELP.alch?.[1]?.find((x) => x[0] === "精煉");
  if (al) al[1] = `消耗神之金屬（武器）或鋁（防具、飾品）提升精煉值 +1～+${V79_REF.max}，強化基底與額外素質。`;
}

// ---------------------------------------------------------------------------
// 2. 能力值效果加強：原本拿掉全部能力值只少 7～9% DPS、0.3～4% 生命，每點效果太小又會被其他加成稀釋。
//    改為加入不會被稀釋的「額外」加成，搭配裝備與卡片能力值提高（第 3 節）；天賦樹、裝備、卡片的能力值都用同一套換算。
//    [效果鍵, 每點數值, "more" = 額外（乘算）]
const V79_STAT = [
  [["adddmg", 0.2], ["dmg", 0.08, "more"]], // 力量：攻擊 +0.15 → +0.2，新增總傷害額外 +0.08%
  [["life", 8], ["life", 0.25, "more"]], // 體質：生命 +2.5 → +8，新增最大生命額外 +0.25%
  [["aspd", 0.35], ["eva", 2]], // 敏捷：攻速 +0.35%，閃避 +1 → +2
  [["crit", 0.13], ["critm", 0.32]], // 幸運：暴擊率 +0.12% → +0.13%，新增暴擊傷害 +0.32%
  [["skill", 0.33], ["skill", 0.08, "more"]], // 智力：技能傷害 +0.5% → +0.33%，新增技能傷害額外 +0.08%
  [["adddmg", 0.16], ["cdr", 0.09]], // 靈巧：攻擊 +0.1 → +0.16，冷卻縮減 +0.08% → +0.09%
];
// 實測（Lv127 測試角色、傳奇防具飾品含隨機能力值）：拿掉全部能力值 DPS 約 −24%（原本 7～9%）；舊裝備約 −15%
const V79_STAT_K = ["rstr", "rvit", "ragi", "rluk", "rint", "rdex"];
const v79StatTxt = (i) =>
  "每點 " +
  V79_STAT[i]
    .map(([k, v, x]) => {
      const n = { adddmg: "攻擊", life: x ? "最大生命額外" : "生命", dmg: "總傷害額外", aspd: "攻速", eva: "閃避", crit: "暴擊率", critm: "暴擊傷害", skill: x ? "技能傷害額外" : "技能傷害", cdr: "冷卻縮減" }[k] || k;
      const pct = !["adddmg", "eva"].includes(k) && !(k === "life" && !x);
      return `+${v}${pct ? "%" : ""} ${n}`;
    })
    .join("、");
const v79StatTotals = () => [0, 1, 2, 3, 4, 5].map((i) => Math.round(((S?.roStats?.[i] || 0) + (roStatGear?.[i] || 0)) * 10) / 10);
function v79StatInstall() {
  // 裝備與卡片的能力值不再走舊的換算（改在下面統一計算）
  for (const r of RO_STAT_RATE) r.length = 0;
  const cm = collectMods;
  collectMods = function (...a) {
    const out = cm.apply(this, a).filter((m) => m.src !== "RO 素質");
    if (!S) return out;
    roEnsureStats();
    const tot = v79StatTotals();
    tot.forEach((v, i) => {
      if (!v) return;
      for (const [s, r, x] of V79_STAT[i]) out.push(x ? { s, v: v * r, src: "RO 素質", x: "more" } : { s, v: v * r, src: "RO 素質" });
    });
    return out;
  };
  roStats.forEach((r, i) => (r[2] = v79StatTxt(i)));
  // 角色頁：顯示總能力值（天賦樹＋裝備與卡片）
  roStatsHTML = () => {
    roTreeEnsure();
    const tot = v79StatTotals();
    return `<section class="ro-stats"><div class="ro-section"><b>基本素質 · 共用天賦</b><span>剩餘 ${roPoints()} 點</span></div><div class="ro-stat-grid">${roStats
      .map(([k, n, tip], i) => {
        const g = Math.round(tot[i] - S.roStats[i]);
        return `<div title="${tip}（天賦樹 ${S.roStats[i]}${g ? `＋裝備與卡片 ${g}` : ""}）"><span><b>${k}</b> ${n}</span><strong>${Math.round(tot[i])}${g ? `<small class="v79g">（+${g}）</small>` : ""}</strong></div>`;
      })
      .join("")}</div><button class="btn primary ro-tree-open" data-ro-tree-open>開啟共用天賦樹 <small>終極天賦 ${roTreeUltimates(S.roTree.ranks)} / 2</small></button></section>`;
  };
  if (typeof document !== "undefined" && !document.getElementById("v79css")) {
    const st = document.createElement("style");
    st.id = "v79css";
    st.textContent = ".ro-stat-grid small.v79g{font-size:10px;color:#3d8a4e;margin-left:2px;font-weight:600}";
    document.head.appendChild(st);
  }
  const h = HELP.char?.[1];
  if (h && !h.some((x) => x[0] === "能力值"))
    h.push(["能力值", `力量、體質、敏捷、幸運、智力、靈巧來自共用天賦樹、裝備與卡片，三者合計後換算：${roStats.map((r, i) => `${r[1]}${v79StatTxt(i).replace("每點 ", "每點")}`).join("；")}。角色頁括號內是裝備與卡片提供的部分。`]);
}

// ---------------------------------------------------------------------------
// 3. 裝備與卡片的能力值（裝備只影響新掉落）
//    ・防具（盾牌、頭飾、鎧甲、披肩、鞋子）與飾品新增隨機能力值詞條，六種素質隨機（不與原本的能力值重複）
//      條數：稀有 1、傳奇 1、神話 2、主宰 3；數值（Lv100、品質 100%）：稀有 +8、傳奇 +12、神話 +16、主宰 +20，隨物品等級縮放，±15% 浮動
//    ・裝備原本固定的能力值（例：戒指的力量、武器的主屬性）×2
//    ・卡片上的能力值 ×2（已持有、已鑲嵌的卡片一起套用）
const V79_RS = { n: [0, 0, 1, 1, 2], v: [0, 0, 8, 12, 16], myN: 3, myV: 20, spread: 0.15 };
let v79Mig = 0;
function v79GearInstall() {
  for (const k of V79_STAT_K) V5_REF[k] *= 2;
  for (const c of Object.values(V5_CARD)) for (const k of V79_STAT_K) if (c.m && c.m[k]) c.m[k] *= 2;
  const mg = v5Migrate;
  v5Migrate = function (...a) {
    v79Mig++;
    try {
      return mg.apply(this, a);
    } finally {
      v79Mig--;
    }
  };
  const cv = v5Convert;
  v5Convert = function (it, ...a) {
    const fresh = it && !it.sl && !it.v5;
    const r = cv.call(this, it, ...a);
    if (fresh && !v79Mig && it.v5 && it.slot !== "weapon" && !it.uq) v79AddStats(it);
    return r;
  };
}
function v79AddStats(it) {
  const n = it.my ? V79_RS.myN : V79_RS.n[Math.max(0, Math.min(4, it.rar || 0))] || 0,
    base = it.my ? V79_RS.myV : V79_RS.v[Math.max(0, Math.min(4, it.rar || 0))] || 0;
  if (!n || !base) return;
  const have = new Set((it.bx || []).map((b) => b.k)),
    pool = V79_STAT_K.filter((k) => !have.has(k));
  it.bx ||= [];
  for (let i = 0; i < n && pool.length; i++) {
    const k = pool.splice(ri(0, pool.length - 1), 1)[0],
      v = Math.max(1, Math.round(base * v5Lv(it.ilvl || 1) * rf(1 - V79_RS.spread, 1 + V79_RS.spread)));
    it.bx.push({ k, v, rs: 1 });
  }
}

// ---------------------------------------------------------------------------
// 4. 頭目招式的閃躲（所有角色）：原本每個紅色預警丟骰子，只有 20～60%（依移動速度）會嘗試閃躲，
//    實測頭目招式造成的傷害全部來自「沒骰到閃躲」。改為依實際情況判斷：
//    角色在紅圈內時，計算往安全方向跑出紅圈的距離與爆炸前剩餘時間，移動速度（含行動速度）來得及就一定閃躲；
//    來不及就不移動，繼續攻擊。頭目的震地（紅圈）同樣處理。菁英與一般怪的預警維持原本的機率。
const V79_DG = { react: 0.08, step: 2, maxD: 160, dirs: 16, buf: 4 };
const v79BossHaz = (h) => h && h.k !== "frost" && ((h.src && h.src.boss) || (!h.src && G.boss && alive(G.boss)) || G.guard != null);
const v79DgSpd = () => {
  const p = G.pl;
  return Math.max(1, fold(SPD_MS, PS.move, null, (t) => t.dodge) * (p.slowT > 0 ? 1 - ELITE_AF.frost.slow : 1));
};
// 找最快離開 inside(x, y) 區域的方向：試 16 個方向，貼著場地邊緣時沿邊移動；回傳 {dir, d}（d＝需要移動的距離）
function v79Plan(inside) {
  const p = G.pl;
  let best = null;
  for (let k = 0; k < V79_DG.dirs; k++) {
    const a = (k * Math.PI * 2) / V79_DG.dirs,
      ux = Math.cos(a),
      uy = Math.sin(a);
    let x = p.x,
      y = p.y;
    for (let d = 0; d <= V79_DG.maxD && (!best || d < best.d); d += V79_DG.step) {
      if (!inside(x, y)) {
        best = { dir: [ux, uy], d };
        break;
      }
      const nx = clamp(x + ux * V79_DG.step, 6, G.W - 6),
        ny = clamp(y + uy * V79_DG.step, G.top + 4, G.H - 4);
      if (Math.abs(nx - x) + Math.abs(ny - y) < 0.2) break;
      (x = nx), (y = ny);
    }
  }
  return best;
}
const v79CanEsc = (plan, left) => !!plan && plan.d / v79DgSpd() <= left - V79_DG.react;
const V79_DGS = { tries: 0, ok: 0 };
function v79DodgeInstall() {
  const dd = dodgeDir;
  dodgeDir = function (...a) {
    const p = G.pl,
      all = G.haz;
    if (!p || !PS) return dd.apply(this, a);
    const bossAll = (all || []).filter(v79BossHaz);
    // 頭目預警：已決定閃躲的多留緩衝，避免在邊緣進進出出、最後一刻被打到
    const cur = bossAll.filter((h) => inHaz(h, p.x, p.y, h.v79t === 2 ? V79_DG.buf + 1 : 3));
    if (cur.length) {
      for (const h of cur) if (!h.v79t) (h.v79t = 1), V79_DGS.tries++;
      const left = Math.min(...cur.map((h) => h.t)),
        decided = cur.some((h) => h.v79t === 2);
      // 優先找能一次離開所有頭目預警的方向；找不到就只離開最快爆炸的那個
      let plan = v79Plan((x, y) => bossAll.some((h) => inHaz(h, x, y, V79_DG.buf)));
      if (!v79CanEsc(plan, left)) {
        const first = cur.reduce((m, h) => (h.t < m.t ? h : m), cur[0]);
        const p2 = v79Plan((x, y) => inHaz(first, x, y, V79_DG.buf));
        if (p2 && (!plan || p2.d < plan.d)) plan = p2;
      }
      if (plan && (decided || v79CanEsc(plan, left))) {
        for (const h of cur) if (h.v79t !== 2) (h.v79t = 2), V79_DGS.ok++;
        return plan.dir;
      }
    }
    // 震地：第一次在紅圈內時判斷來不來得及，決定閃躲後持續到落下（紅圈外再留緩衝）
    const sl = G.v79sl;
    if (sl && G.guard != null && sl.s.slam > 0 && alive(sl.b)) {
      const s = sl.s,
        inside = (m) => (x, y) => Math.hypot(x - s.x, 1.4 * (y - s.y)) <= GUARD_SLAM.r + m;
      if (!s.v79d && inside(3)(p.x, p.y)) s.v79d = v79CanEsc(v79Plan(inside(V79_DG.buf)), s.slam) ? 1 : 2;
      if (s.v79d === 1 && inside(V79_DG.buf + 1)(p.x, p.y)) {
        const plan = v79Plan(inside(V79_DG.buf));
        if (plan) return plan.dir;
      }
    }
    // 其餘（菁英、一般怪的預警）走原本的邏輯；頭目預警與震地已在上面處理
    const saved = bossAll.map((h) => [h, h.dg]);
    for (const h of bossAll) h.dg = false;
    const v74 = G.v74sl;
    G.v74sl = null;
    try {
      return dd.apply(this, a);
    } finally {
      for (const [h, v] of saved) h.dg = v;
      G.v74sl = v74;
    }
  };
  // 震地的狀態（原本開始蓄力時丟一次骰子；改由上面依速度判斷）
  const gt = guardTick;
  guardTick = function (t, a, ...x) {
    const r = gt.call(this, t, a, ...x);
    const s = t && t.gm;
    if (s && s.slam > 0) G.v79sl = { s, b: t };
    else if (s) {
      s.v79d = 0;
      if (G.v79sl && G.v79sl.s === s) G.v79sl = null;
    }
    return r;
  };
  const txt = "頭目招式的紅色預警（含震地）：角色在紅圈內時，會找最快跑出紅圈的方向並計算爆炸前剩餘時間，移動速度（含行動速度）來得及就一定閃躲，來不及就繼續攻擊。菁英與一般怪的預警依移動速度有 20～60% 機率嘗試閃躲。";
  const hb = HELP.v6boss?.[1];
  if (hb && !hb.some((x) => x[0] === "自動閃躲")) hb.push(["自動閃躲", txt]);
  for (const hv of Object.values(HELP))
    for (const row of Array.isArray(hv?.[1]) ? hv[1] : [])
      if (Array.isArray(row) && typeof row[1] === "string")
        row[1] = row[1].replace(/可閃避（與其他紅色預警相同，依移動速度有 20～60% 機率嘗試）/g, "可閃避（移動速度來得及跑出紅圈時一定閃躲）");
}

// ---------------------------------------------------------------------------
// 5. 移除神器：角色頁的神器欄位、神器掉落與效果（存檔資料保留，不再生效）、相關說明
function v79ToastInstall() {
  // 舊存檔仍有已停用道具時照舊換成 Zeny，但提示不再出現「石板」
  const ts = toast;
  toast = function (msg, ...a) {
    if (typeof msg === "string" && msg.startsWith("v6.2 移除石板系統")) {
      const z = /已換成 (\S+) Zeny/.exec(msg);
      msg = z ? `舊版存檔中已停用的道具已自動換成 ${z[1]} Zeny` : "舊版存檔中已停用的道具已移除";
    }
    return ts.call(this, msg, ...a);
  };
}
function v79ArtInstall() {
  ui.artBoard = () => "";
  if (typeof SS !== "undefined") SS.art = 0;
  const cm = collectMods;
  collectMods = function (...a) {
    return cm.apply(this, a).filter((m) => m.src !== "art");
  };
}

// ---------------------------------------------------------------------------
// 6. 說明文字清理：刪除神器、石板（含已停用的符文石、封印石、磨礪石、腐化石、洗鍊石、奇蹟石）的說明與更新日誌條目
const V79_GONE = /石板|神器|符文石|封印石|磨礪石|腐化石|洗鍊石|奇蹟石|奇蹟狀態/;
const V79_HELP_DEL = ["art", "slate", "alchx", "runes", "reroll", "holy", "mir", "corrupt", "seal"];
function v79TextClean(s) {
  if (typeof s !== "string") return s;
  return s
    .replace(/裝備、卡片與神器皆會保留/g, "裝備與卡片皆會保留")
    .replace(/、天賦與神器/g, "、天賦")
    .replace(/，裝備與神器皆會保留/g, "")
    .replace(/、神器|與神器|和神器/g, "")
    .replace(/、符文石、石板/g, "")
    .replace(/、石板/g, "")
    .replace(/石板與/g, "");
}
function v79CleanInstall() {
  for (const k of V79_HELP_DEL) if (HELP[k] && V79_GONE.test(JSON.stringify(HELP[k][0] || ""))) delete HELP[k];
  for (const k of V79_HELP_DEL) if (HELP[k] && Array.isArray(HELP[k][1]) && HELP[k][1].every((r) => V79_GONE.test(JSON.stringify(r)))) delete HELP[k];
  for (const [k, hv] of Object.entries(HELP)) {
    if (!Array.isArray(hv?.[1])) continue;
    for (const r of hv[1]) if (Array.isArray(r)) r[1] = v79TextClean(r[1]);
    hv[1] = hv[1].filter((r) => !Array.isArray(r) || !V79_GONE.test(r[0] + "｜" + r[1]));
    if (!hv[1].length) delete HELP[k];
  }
  // 設定 → 畫面：移除「石板詞綴不因角色靠近而淡出」
  const ms = ui.m_set;
  ui.m_set = function (...a) {
    const h = ms.apply(this, a);
    return typeof h === "string" ? h.replace(/<label class="chk"><input type="checkbox" data-act="slnd"[^>]*><span>[^<]*<\/span><\/label>/, "") : h;
  };
  for (const c of CHANGELOG || []) if (Array.isArray(c.l) && !/v7\.9/.test(c.v || "")) c.l = c.l.filter((x) => !V79_GONE.test(x));
}

// ---------------------------------------------------------------------------
// 7. 活動地圖（荒野回響）的小怪換成一般地圖沒有的 RO 原版怪物（ro-evmon.js：由「下載活動怪物外觀.bat」下載的原版動畫）
//    原本借用一般地圖的小惡魔、幽靈圖。數值、屬性、掉落、擊殺紀錄不變；三隻活動頭目維持自製美術。
//    游離孢子 → 海葵（遠程）、月芽精靈 → 水波利、熔礦幼蟲 → 蛇髮女妖；對應的卡片一併改名
const V79_EV = { thun: ["hydra", "海葵", "游離孢子"], siren: ["marin", "水波利", "月芽精靈"], soul: ["medusa", "蛇髮女妖", "熔礦幼蟲"] };
const V79_EV_CARD = { spore: "海葵", moonsprite: "水波利", larva: "蛇髮女妖" };
function v79EvLoad(k) {
  const a = RO.assets.monsters?.["ev_" + k];
  if (!a) return;
  const src = RO.root + a.states.idle.file;
  if (RO.images[src] || v79EvLoad.p[src] || RO.failed.includes(src)) return;
  v79EvLoad.p[src] = 1;
  const im = new Image();
  im.onload = () => (RO.images[src] = im);
  im.onerror = () => RO.failed.push(src);
  im.src = src;
}
v79EvLoad.p = {};
function v79EvInstall() {
  const spr = (typeof window !== "undefined" && window.RO_EVMON_ASSETS?.monsters) || {},
    DN = ["south", "southwest", "west", "northwest", "north", "northeast", "east", "southeast"],
    ren = [];
  RO.assets.monsters ||= {};
  for (const [type, [k, n, old]] of Object.entries(V79_EV)) {
    const a = spr[k];
    if (!a || !MON[type]) continue;
    const states = {};
    for (const [st, rows] of Object.entries(a.states)) {
      const dirs = rows.map((r, i) => ({ file: a.file, ox: 0, oy: r[6], frameWidth: r[0], frameHeight: r[1], frames: r[2], durations: r[3], anchor: [r[4], r[5]], ks: a.ks || 1, direction: DN[i] }));
      states[st] = { ...dirs[0], directions: dirs };
    }
    RO.assets.monsters["ev_" + k] = { job: a.job, name: n, states, lazy: 1 }; // 進入活動地圖時才載入
    roMonsterKeys[type] = "ev_" + k;
    MON[type].n = n;
    ren.push([old, n]);
  }
  if (!ren.length) return;
  for (const [id, n] of Object.entries(V79_EV_CARD)) if (V5_CARD[id]) V5_CARD[id].n = n + "卡片";
  const dm = drawMob;
  drawMob = function (c, m, ...a) {
    if (m && V79_EV[m.type] && !(m.boss && m.god != null)) v79EvLoad(V79_EV[m.type][0]);
    return dm.call(this, c, m, ...a);
  };
  const fix = (s) => (typeof s === "string" ? ren.reduce((t, [o, n]) => t.split(o).join(n), s) : s);
  for (const hv of Object.values(HELP)) for (const row of Array.isArray(hv?.[1]) ? hv[1] : []) if (Array.isArray(row)) row[1] = fix(row[1]);
}

// ---------------------------------------------------------------------------
function v79Install() {
  v79RefineInstall();
  v79StatInstall();
  v79GearInstall();
  v79DodgeInstall();
  v79ArtInstall();
  v79ToastInstall();
  v79CleanInstall();
  v79EvInstall();
}
if (typeof roV4Install === "function") {
  const r4v79 = roV4Install;
  roV4Install = function () {
    r4v79();
    v79Install();
  };
}
