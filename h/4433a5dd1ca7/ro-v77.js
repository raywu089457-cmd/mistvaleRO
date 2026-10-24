/* 流浪仙境 v7.7：卡片同階級批量合成與「保留」勾選、武鬥場按離開取消自動入場、神工匠的祝福掉率（武鬥場基礎 10%、Lv90 以上頭目 3%） */

// ---------------------------------------------------------------------------
// 1. 卡片「保留」勾選：煉金・卡片合成頁每種卡片下方可勾選保留；保留的卡不會被
//    批量合成、背包的批次合成與批次分解用掉，「自動選 3 張」也會跳過（手動點選合成不受限）
const v77Ck = () => {
  const st = v5St();
  return (st.ck ||= {});
};
const v77Locked = (id) => !!v77Ck()[id];

// ---------------------------------------------------------------------------
// 2. 同階級批量合成：卡片合成頁每個階級標題旁的「全部合成」
//    以按下時持有的該階卡片（不含保留的）3 張一組全部合成，優先用數量最多的卡；
//    合成出來的新卡不會再被拿來合成。次數受卡片數、藍色魔力礦石與 Zeny 限制，按兩次確認。
function v77Plan(t) {
  const st = v5St(),
    rem = {};
  let total = 0;
  for (const c of V5_CARDS)
    if (c.t === t && !v77Locked(c.id) && (st.cards[c.id] || 0) > 0) {
      rem[c.id] = st.cards[c.id];
      total += rem[c.id];
    }
  const ore = v64OreK("b", t),
    need = v64OreN(t),
    z = v5FuseZeny(t),
    byCards = Math.floor(total / 3),
    byOre = need > 0 ? Math.floor((S.mat[ore] || 0) / need) : byCards,
    byZeny = z > 0 ? Math.floor(S.ash / z) : byCards,
    n = t >= 6 ? 0 : Math.max(0, Math.min(byCards, byOre, byZeny));
  return { t, n, rem, ore, need, z, total, byCards, byOre, byZeny };
}
function v77FuseAll(t) {
  const p = v77Plan(t);
  if (!p.n) return;
  const st = v5St(),
    got = [];
  let up = 0,
    down = 0,
    fresh = 0;
  for (let k = 0; k < p.n; k++) {
    if ((S.mat[p.ore] || 0) < p.need || S.ash < p.z) break;
    const take = [];
    for (let j = 0; j < 3; j++) {
      let best = null;
      for (const id in p.rem) if (p.rem[id] > 0 && (!best || p.rem[id] > p.rem[best])) best = id;
      if (!best) break;
      p.rem[best]--;
      take.push(best);
    }
    if (take.length < 3) break;
    S.mat[p.ore] -= p.need;
    S.ash -= p.z;
    for (const id of take) (st.cards[id] -= 1) || delete st.cards[id];
    const g = v63FuseRoll(t);
    if (v5GainCard(g.id)) fresh++;
    got.push(g);
    if (g.t > t) up++;
    else if (g.t < t) down++;
  }
  if (!got.length) return;
  const same = got.length - up - down,
    txt = `批量合成${V5_TIER[t].n}卡片 ${got.length} 次：升階 ${up}、同階 ${same}、降階 ${down}${fresh ? `（新蒐藏 ${fresh} 種）` : ""}`;
  ui.v5fp = [];
  ui.v5res = { t: performance.now(), ok: true, txt };
  toast(txt, up ? "lvl" : "", 1);
  sfx("alch", Math.min(3, t));
  markDirty();
}

// ---------------------------------------------------------------------------
// 3. 神工匠的祝福：武鬥場頭目關第 10 層 2% → 10%、每 10 層 +0.5% → +1%（載入時調整，說明文字安裝時用新數值產生）；
//    另外 Lv90 以上的頭目（地圖頭目含深淵、三魔王與巴風特、MVP 武道場、活動神祇頭目）擊敗時 3% 掉落（武鬥場頭目關、轉職試煉不重複計算）
V63_BLESS.p2Base = 0.1;
V63_BLESS.p2Step = 0.01;
const V77_BLESS = { lv: 90, p: 0.03 };
const v77BlessTxt = () => `無限武鬥場頭目關（第 10 層 ${V63_BLESS.p2Base * 100}%，每 10 層 +${V63_BLESS.p2Step * 100}%）與 Lv${V77_BLESS.lv} 以上的頭目（${V77_BLESS.p * 100}%）掉落`;
const v77FixBless = (s) =>
  typeof s !== "string"
    ? s
    : s
        .replace(/只由無限武鬥場頭目關掉落（第 10 層 [\d.]+%，每 10 層 \+[\d.]+%）/g, () => `由${v77BlessTxt()}`)
        .replace(/只由無限武鬥場頭目關掉落：第 10 層 [\d.]+%，每 10 層 \+[\d.]+%。/g, () => `由${v77BlessTxt()}。`)
        .replace(/（只由無限武鬥場頭目關掉落）|（無限武鬥場頭目關掉落）/g, `（無限武鬥場頭目關、Lv${V77_BLESS.lv} 以上頭目掉落）`)
        .replace(/只由無限武鬥場頭目關掉落/g, `由無限武鬥場頭目關與 Lv${V77_BLESS.lv} 以上頭目掉落`)
        .replace(/無盡之塔結束/g, "無限武鬥場結束");
function v77BlessInstall() {
  const ok = v5OnKill;
  v5OnKill = function (m, ...a) {
    const r = ok.call(this, m, ...a);
    try {
      if (m && m.boss && !m.dm && !m.add && S && !G.trn && !G.tw && G.trial == null && (m.lv || 0) >= V77_BLESS.lv && RAND() < V77_BLESS.p) {
        S.mat.p2 = (S.mat.p2 || 0) + 1;
        toast(`${m.bn || G.bn || (G.guard == null && !G.arena ? curMap()?.boss : "") || "頭目"}：獲得「${MATS.p2.n}」`, "r3");
        markDirty();
      }
    } catch (e) {}
    return r;
  };
  if (typeof V64_MAT_USE !== "undefined") V64_MAT_USE.p2 = v77FixBless(V64_MAT_USE.p2);
  for (const hv of Object.values(HELP))
    for (const row of Array.isArray(hv?.[1]) ? hv[1] : []) if (Array.isArray(row)) row[1] = v77FixBless(row[1]);
  const r = HELP.v5mat?.[1]?.find((x) => x[0] === "祝福");
  if (r) r[1] = `鐵匠的祝福、神工匠的祝福：精煉與鑲嵌失敗時的保護，非常稀有。鐵匠的祝福由頭目（0.5%）與菁英（0.05%）掉落；神工匠的祝福由${v77BlessTxt()}。`;
  const rt = v5RefTab;
  v5RefTab = function (...a) {
    return v77FixBless(rt.apply(this, a));
  };
  const ts = toast;
  toast = function (msg, ...a) {
    return ts.call(this, v77FixBless(msg), ...a);
  };
}

// ---------------------------------------------------------------------------
// 4. 無限武鬥場：挑戰中按「離開」時一併取消「自動」入場（避免離開後幾秒又自動進場）；
//    一場打完、陣亡、時間到等正常結束仍照常自動進場
function v77ArenaLeaveInstall() {
  if (typeof document === "undefined") return;
  document.addEventListener(
    "click",
    (e) => {
      if (!e.target?.closest?.("#bossBtn") || !S || !G?.arena || !G.tw) return;
      if (typeof roArenaOn === "function" && !roArenaOn()) return;
      const leaving = !inFight() || (G.arena.ask || 0) > G.t;
      if (leaving && S.set?.v65aa) {
        S.set.v65aa = 0;
        markDirty();
        toast("已取消武鬥場的自動入場（重新勾選「自動」即可恢復）", "");
        ui.needs = true;
      }
    },
    true,
  );
  const h = Object.values(HELP).find((v) => Array.isArray(v?.[1]) && v[1].some((r) => r[0] === "自動入場"));
  const row = h && h[1].find((r) => r[0] === "自動入場");
  if (row && !row[1].includes("離開")) row[1] += "挑戰中按「離開」會一併取消「自動」。";
}
// ---------------------------------------------------------------------------
function v77Install() {
  v77BlessInstall();
  v77ArenaLeaveInstall();
  if (typeof document !== "undefined" && !document.getElementById("v77css")) {
    const st = document.createElement("style");
    st.id = "v77css";
    st.textContent = `.v77cw{display:flex;flex-direction:column;gap:2px;min-width:0}
.v77cw .v5mini{width:100%}
.v77cw.lk .v5mini{box-shadow:inset 0 0 0 1px #c9a24a;background:#fffaf0}
.v77lk{display:flex;align-items:center;gap:3px;font-size:11px;color:var(--muted);padding:0 2px;cursor:pointer}
.v77lk input{margin:0}
.v77cw.lk .v77lk{color:#8a6a1e;font-weight:700}
.hrow .v77all{margin-left:4px;white-space:nowrap}
#panel .hrow .v77all.primary{background:#2f6fa8;border:1px solid #1f5385;border-image:none;color:#fff;font-weight:700}
.v77cost{margin:-2px 0 6px;color:#8a5a12}`;
    document.head.appendChild(st);
  }
  // 卡片合成頁：每種卡加保留勾選、每階標題加「全部合成」
  const ft = v5FuseTab;
  v5FuseTab = function (...a) {
    let h = ft.apply(this, a);
    if (typeof h !== "string") return h;
    h = h.replace(/<button class="v5mini" data-v5="fpick" data-k="([^"]+)"[\s\S]*?<\/button>/g, (m, id) => {
      const lk = v77Locked(id);
      return `<div class="v77cw${lk ? " lk" : ""}">${m}<label class="v77lk"><input type="checkbox" data-v77ck="${id}" ${lk ? "checked" : ""}><span>保留</span></label></div>`;
    });
    h = h.replace(/(<button class="btn sm" data-v5="fauto" data-v="(\d+)">[^<]*<\/button>)<\/h3>/g, (m, b, tier) => {
      const t = +tier,
        p = v77Plan(t),
        cf = ui.v77cf === t && p.n > 0,
        why = p.n ? "" : p.byCards < 1 ? "（未保留的不足 3 張）" : p.byOre < 1 ? `（${MATS[p.ore]?.n || "礦石"}不足）` : "（Zeny 不足）",
        cost = p.n ? `${MATS[p.ore]?.n || p.ore} ×${fmt(p.need * p.n)}・Zeny ${fmt(p.z * p.n)}` : "";
      return `${b}<button class="btn sm v77all${cf ? " primary" : ""}" data-v77="fall" data-v="${t}" ${p.n ? "" : "disabled"} title="${cost}">${
        cf ? `再按一次確認` : `全部合成 <span class="px">${p.n}</span> 次${why}`
      }</button></h3>${cf ? `<p class="note v77cost">全部合成 <span class="px">${p.n}</span> 次，消耗 ${cost}（保留的卡不會用到）</p>` : ""}`;
    });
    return h;
  };
  // 背包・卡片：批次合成、批次分解跳過保留的卡
  const fp = v54FusePlan;
  v54FusePlan = function (...a) {
    const st = v5St(),
      ck = v77Ck(),
      stash = {};
    for (const id of Object.keys(ck))
      if (ck[id] && st.cards[id] > 0) {
        stash[id] = st.cards[id];
        delete st.cards[id];
      }
    try {
      return fp.apply(this, a);
    } finally {
      for (const [id, n] of Object.entries(stash)) st.cards[id] = (st.cards[id] || 0) + n;
    }
  };
  const sl = v54SalvList;
  v54SalvList = function (...a) {
    return sl.apply(this, a).filter(([c]) => !v77Locked(c.id));
  };
  if (typeof document !== "undefined") {
    document.addEventListener(
      "click",
      (e) => {
        const el = e.target?.closest?.("[data-v77],[data-v5='fauto']");
        if (!el || !S) return;
        if (el.matches("[data-v5='fauto']")) {
          // 自動選 3 張：跳過保留的卡（未保留的不足 3 張時照原本的方式）
          const t = +el.getAttribute("data-v"),
            st = v5St(),
            bag = [];
          for (const c of V5_CARDS.filter((c) => c.t === t && !v77Locked(c.id)).sort((x, y) => (st.cards[y.id] || 0) - (st.cards[x.id] || 0)))
            for (let n = 0; n < (st.cards[c.id] || 0); n++) bag.push(c.id);
          if (bag.length < 3) return;
          e.stopPropagation();
          e.preventDefault();
          ui.v5fp = bag.slice(0, 3);
          ui.render();
          return;
        }
        if (el.getAttribute("data-v77") !== "fall") return;
        e.stopPropagation();
        e.preventDefault();
        const t = +el.getAttribute("data-v");
        if (ui.v77cf !== t) ui.v77cf = t;
        else {
          ui.v77cf = null;
          v77FuseAll(t);
        }
        ui.render();
      },
      true,
    );
    document.addEventListener("change", (e) => {
      const el = e.target;
      if (!el?.matches?.("[data-v77ck]") || !S) return;
      const id = el.getAttribute("data-v77ck"),
        ck = v77Ck();
      if (el.checked) ck[id] = 1;
      else delete ck[id];
      ui.v77cf = null;
      markDirty();
      ui.render();
    });
  }
  const h = HELP.v5fuse?.[1];
  if (Array.isArray(h) && !h.some((r) => r[0] === "全部合成"))
    h.push(
      ["全部合成", "每個階級標題旁的「全部合成」：把該階持有的卡片（不含保留的）3 張一組全部合成，優先用數量最多的卡；合成出來的新卡不會再被拿來合成。次數受卡片數、藍色魔力礦石與 Zeny 限制，按兩次確認。"],
      ["保留", "每種卡片下方可勾選「保留」：保留的卡不會被全部合成、背包的批次合成與批次分解用掉，「自動選 3 張」也會跳過；手動點選仍可合成。"],
    );
}
if (typeof roV4Install === "function") {
  const r4v77 = roV4Install;
  roV4Install = function () {
    r4v77();
    v77Install();
  };
}
