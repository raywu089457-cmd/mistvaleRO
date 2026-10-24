/* 流浪仙境 v1.0.15（內部 v10.5）：
   1. 煉金「素材」頁：一鍵合成改為「批量合成」——選目標階級與材料（神之金屬／鋁／兩種），數量自訂（輸入框、－／＋、最大），
      合成規則不變（先用低一階，不夠才從更低階合上來）
   2. 共用天賦樹新增「模擬器」：另外存檔、不影響數值；側邊顯示模擬配置的加成總和；清空、從目前配置複製、一鍵套用到目前天賦
      （點數與目前等級相同；配置無效或戰鬥中不能套用）
   3. 無限武鬥場換層：走回中央時一定躲出爆炸預警圈、也不會走進去，等爆完再走（原本只有 20～60% 機率閃避） */

// ---------------------------------------------------------------------------
// 1. 批量合成
const V105_FAM = [
  ["x", "神之金屬"],
  ["i", "鋁"],
  ["b", "兩種"],
];
const v105Fam = () => (["x", "i", "b"].includes(S.set?.v105f) ? S.set.v105f : "b");
const v105N = () => Math.max(1, Math.min(99999, Math.floor(+S.set?.v105n || 10)));
// 每種材料最多合成 n 個目標階；apply=false 只試算
function v105Batch(tg, fams, n, apply) {
  const before = { ...S.mat },
    m = { ...S.mat },
    made = {};
  let z = S.ash,
    cost = 0;
  for (const f of fams) {
    made[f] = 0;
    const take = (st, t, need) => {
      const have = st.m[f + t] || 0;
      if (have >= need) return true;
      if (t <= 1) return false;
      const d = need - have,
        c = d * mergeAsh(f + t);
      if (!take(st, t - 1, MERGE_N * d) || st.z < c) return false;
      st.m[f + (t - 1)] -= MERGE_N * d;
      st.m[f + t] = have + d;
      st.z -= c;
      st.cost += c;
      return true;
    };
    for (let k = 0; k < n; k++) {
      const st = { m: { ...m }, z, cost },
        c = mergeAsh(f + tg);
      if (!take(st, tg - 1, MERGE_N) || st.z < c) break;
      st.m[f + (tg - 1)] -= MERGE_N;
      st.m[f + tg] = (st.m[f + tg] || 0) + 1;
      st.z -= c;
      st.cost += c;
      Object.assign(m, st.m);
      z = st.z;
      cost = st.cost;
      made[f]++;
    }
  }
  if (apply) {
    for (const f of ["x", "i"]) for (let l = 1; l <= 4; l++) S.mat[f + l] = m[f + l] || 0;
    S.ash = z;
  }
  const diff = {};
  for (const f of ["x", "i"]) for (let l = 1; l <= 4; l++) diff[f + l] = (m[f + l] || 0) - (before[f + l] || 0);
  return { diff, cost, made };
}
const v105Fams = (fm) => (fm === "b" ? ["x", "i"] : [fm]);
function v105BatchHtml() {
  const tg = v89Tg(),
    fm = v105Fam(),
    n = v105N(),
    fams = v105Fams(fm),
    mx = Object.fromEntries(fams.map((f) => [f, v105Batch(tg, [f], 1e5, false).made[f]])),
    pl = v105Batch(tg, fams, n, false),
    dt = v89DiffTxt(pl.diff, 1),
    tn = (f) => MATS[f + tg].n,
    segT = V89_TIER.map(([t, nm]) => `<button data-v89="tg" data-v="${t}" aria-pressed="${tg === t}">${nm}</button>`).join(""),
    segF = V105_FAM.map(([f, nm]) => `<button data-v105="fam" data-v="${f}" aria-pressed="${fm === f}">${nm}</button>`).join(""),
    maxTxt = fams.map((f) => `${tn(f)} <span class="px">${fmt(mx[f])}</span>`).join("、"),
    lab = (t) => `<span class="note" style="margin:0;white-space:nowrap;min-width:3em">${t}</span>`,
    any = dt.pos.length > 0,
    short = fams.some((f) => pl.made[f] < n);
  return `<h3 class="hrow">批量合成${helpBtn("v5mat")}</h3><div class="box stack">
    <p class="note" style="margin:0">選擇要合成的階級、材料與數量。先用現有的低一階素材，不夠時才把更低階的合成上來補足；用不到的低階素材保留不動。精煉缺少該階素材時，會自動改用更高階的素材（1 個抵 1 個）。</p>
    <div class="row" style="flex-wrap:nowrap;gap:6px">${lab("合成到")}<div class="seg" style="flex:1">${segT}</div></div>
    <div class="row" style="flex-wrap:nowrap;gap:6px">${lab("材料")}<div class="seg" style="flex:1">${segF}</div></div>
    <div class="row" style="gap:6px;align-items:center">${lab("數量")}<button class="btn sm" data-v105="minus" aria-label="減少">－</button><input type="number" inputmode="numeric" min="1" max="99999" value="${n}" data-v105="n" aria-label="合成數量" style="width:5.5em;text-align:center"><button class="btn sm" data-v105="plus" aria-label="增加">＋</button><button class="btn sm" data-v105="max">最大</button><span class="note" style="margin:0">${fm === "b" ? "每種各合成這個數量；" : ""}最多可合成：${maxTxt}</span></div>
    <p class="note" style="margin:0">${any ? `預計：${dt.txt}・花費 Zeny <span class="px">${fmt(pl.cost)}</span>${short ? "（素材或 Zeny 不足，只會合成可以合成的數量）" : ""}` : "目前沒有可以合成的素材"}</p>
    <button class="btn primary" data-v105="go" ${any ? "" : "disabled"}>${fm === "b" ? `批量合成（各 ${fmt(n)} 個）` : `批量合成 ${fmt(Math.min(n, mx[fm]))} 個${MATS[fm + tg].n}`}</button></div>`;
}
function v105BatchInstall() {
  if (typeof v89OneHtml !== "function" || typeof v89OneClick !== "function") return;
  v89OneHtml = v105BatchHtml;
  const setN = (v) => {
    S.set.v105n = Math.max(1, Math.min(99999, Math.floor(+v || 1)));
    markDirty();
    ui.refreshIf("alch");
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("[data-v105]");
    if (!b || b.disabled || !S || b.tagName === "INPUT") return;
    const a = b.dataset.v105;
    if (a === "fam") {
      S.set.v105f = b.dataset.v;
      markDirty();
      ui.refreshIf("alch");
    } else if (a === "minus") setN(v105N() - 1);
    else if (a === "plus") setN(v105N() + 1);
    else if (a === "max") {
      const fams = v105Fams(v105Fam()),
        tg = v89Tg();
      setN(Math.max(1, ...fams.map((f) => v105Batch(tg, [f], 1e5, false).made[f])));
    } else if (a === "go") {
      const fams = v105Fams(v105Fam()),
        n = v105N(),
        r = v105Batch(v89Tg(), fams, n, true),
        dt = v89DiffTxt(r.diff),
        got = dt.pos,
        short = fams.some((f) => r.made[f] < n);
      ui.v5res = {
        t: performance.now(),
        ok: got.length > 0,
        txt: got.length ? `批量合成：${dt.txt}（Zeny −${fmt(r.cost)}）${short ? "；素材或 Zeny 不足，只合成了可以合成的數量" : ""}` : "沒有可以合成的素材",
      };
      if (got.length) sfx("mat");
      markDirty();
      ui.refreshIf("alch");
    }
  });
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t && t.matches && t.matches('input[data-v105="n"]') && S) setN(t.value);
  });
  document.addEventListener("keydown", (e) => {
    const t = e.target;
    if (e.key === "Enter" && t && t.matches && t.matches('input[data-v105="n"]')) t.blur();
  });
  // 說明
  const alch = HELP.alch?.[1]?.find((x) => x[0] === "素材");
  if (alch) alch[1] = "購買原石、把 4 個素材升級合成為高一級，或用批量合成一次合成指定數量的某一階。裝備在背包單件分解或由拾取篩選自動分解。";
  const mh = HELP.v5mat?.[1];
  if (mh) {
    const i = mh.findIndex((x) => x[0] === "一鍵合成");
    const row = ["批量合成", "選擇要合成的階級（神之金屬／鋁、濃縮、高純度）、材料（神之金屬、鋁或兩種）與數量（可輸入，或按－／＋、最大）。優先合成出該階：先用現有的低一階素材 4 個合成 1 個，低一階不夠時才把更低階的合成上來補足（一路往下）；用不到的低階素材保留不動，更高階的素材也不動。選「兩種」時兩種各合成輸入的數量。素材或 Zeny 不足時，只合成可以合成的數量。"];
    if (i >= 0) mh[i] = row;
    else mh.push(row);
  }
}

// ---------------------------------------------------------------------------
// 2. 天賦模擬器
let v105Sim = false,
  v105Real = null,
  v105Ask = 0;
const v105SimData = () => (S.roSim && typeof S.roSim === "object" ? S.roSim : (S.roSim = { ranks: {} }));
const v105SimOk = () => !inFight() && roTreeValid(roTreeDraft || {});
// 模擬配置的效果加總（素質另外在「模擬配置素質」顯示）
function v105SimMods(r) {
  const e = {};
  for (const [id, v] of Object.entries(r || {})) {
    const n = RO_TREE_NODES[id];
    if (!n || !v) continue;
    for (const [k, val] of Object.entries(n.mods || {}))
      if (k === "more") {
        e.more ||= {};
        for (const [mk, mv] of Object.entries(val)) e.more[mk] = (e.more[mk] || 0) + mv * v;
      } else if (typeof val === "number") e[k] = (e[k] || 0) + val * v;
  }
  for (const k of Object.keys(e)) if (e[k] === 0) delete e[k];
  return e;
}
function v105SimSumHtml(r) {
  const e = v105SimMods(r);
  let lines = [];
  try {
    lines = Object.keys(e).length ? String(v5TalText(e)).split("；").filter(Boolean) : [];
  } catch (x) {}
  lines = lines.map((s) => s.replace(/\+-/g, "−").replace(/\+−/g, "−"));
  return `<h4>模擬配置加成</h4>${lines.length ? `<ul class="v105sum">${lines.map((s) => `<li>${s}</li>`).join("")}</ul>` : `<p class="note">尚未點選有效果的天賦（素質節點的加成見上方素質）。</p>`}`;
}
function v105Decorate() {
  const sh = document.querySelector("#sheet.ro-tree-sheet");
  if (!sh) return;
  const tools = sh.querySelector(".tree-tools");
  if (tools && !tools.querySelector("[data-v105t='sim']")) {
    const b = document.createElement("button");
    b.className = "btn sm v105simBtn";
    b.dataset.v105t = "sim";
    b.setAttribute("aria-pressed", v105Sim ? "true" : "false");
    b.textContent = v105Sim ? "模擬器・開" : "模擬器";
    const ref = tools.querySelector("[data-ro-tree='zoomout']");
    tools.insertBefore(b, ref || null);
  }
  sh.classList.toggle("v105sim", v105Sim);
  if (!v105Sim) return;
  const h2 = sh.querySelector(".tree-header h2"),
    sm = sh.querySelector(".tree-header small"),
    p = sh.querySelector(".tree-header p");
  if (h2) h2.textContent = "天賦模擬器";
  if (sm) sm.textContent = "TALENT SIMULATOR";
  if (p && !p.querySelector(".v105tag")) p.insertAdjacentHTML("beforeend", ` · <span class="v105tag">模擬中，不影響數值</span>`);
  sh.querySelector(".v72apply")?.remove();
  const st = sh.querySelector(".tree-detail .tree-status");
  if (st) st.textContent = st.textContent.replace("按套用後才會生效。", "模擬器的天賦不影響數值。");
  for (const h of sh.querySelectorAll(".tree-detail h4")) if (h.textContent === "配置後素質") h.textContent = "模擬配置素質";
  const stats = sh.querySelector(".tree-detail .tree-stats");
  if (stats && !sh.querySelector(".v105sumWrap")) stats.insertAdjacentHTML("afterend", `<div class="v105sumWrap">${v105SimSumHtml(roTreeDraft)}</div>`);
  const ft = sh.querySelector(".tree-footer");
  if (ft) {
    const ok = v105SimOk(),
      ask = v105Ask && performance.now() - v105Ask < 3000,
      why = inFight() ? "戰鬥結束後才能套用" : !roTreeValid(roTreeDraft || {}) ? "天賦點不足或配置無效，不能套用" : "";
    ft.innerHTML = `<button class="btn" data-v105t="clear">清空模擬</button><button class="btn" data-v105t="copy">從目前配置複製</button><span>${why || "模擬器的天賦會自動儲存，不影響數值"}</span><button class="btn primary" data-v105t="apply" ${ok ? "" : "disabled"}>${ask ? "再按一次確定套用" : "一鍵套用到目前天賦"}</button>`;
  }
}
function v105SimInstall() {
  if (typeof roTreeRender !== "function" || typeof roTreeAction !== "function") return;
  const op = roTreeOpen;
  roTreeOpen = function (...a) {
    v105Sim = false;
    v105Real = null;
    v105Ask = 0;
    return op.apply(this, a);
  };
  const ta = roTreeAction;
  roTreeAction = function (action, ...x) {
    if (v105Sim && (action === "apply" || action === "reset" || action === "revert")) return roTreeRender();
    const r = ta.call(this, action, ...x);
    if (v105Sim && roTreeDraft && S) {
      v105SimData().ranks = { ...roTreeDraft };
      markDirty();
    }
    return r;
  };
  const rr = roTreeRender;
  roTreeRender = function (...a) {
    const r = rr.apply(this, a);
    try {
      v105Decorate();
    } catch (e) {}
    return r;
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("[data-v105t]");
    if (!b || b.disabled || !S || !roTreeDraft) return;
    const a = b.dataset.v105t;
    if (a !== "apply") v105Ask = 0;
    if (a === "sim") {
      if (!v105Sim) {
        v105Real = { ...roTreeDraft };
        roTreeDraft = { ...(v105SimData().ranks || {}) };
        v105Sim = true;
      } else {
        v105SimData().ranks = { ...roTreeDraft };
        roTreeDraft = v105Real || { ...S.roTree.ranks };
        v105Real = null;
        v105Sim = false;
      }
      markDirty();
    } else if (!v105Sim) return;
    else if (a === "clear") {
      roTreeDraft = {};
      v105SimData().ranks = {};
      markDirty();
    } else if (a === "copy") {
      roTreeDraft = { ...S.roTree.ranks };
      v105SimData().ranks = { ...roTreeDraft };
      markDirty();
    } else if (a === "apply") {
      if (!v105SimOk()) return toast("目前的模擬配置無法套用", "bad");
      if (!(v105Ask && performance.now() - v105Ask < 3000)) {
        v105Ask = performance.now();
        return roTreeRender();
      }
      v105Ask = 0;
      const sim = { ...roTreeDraft };
      v105SimData().ranks = { ...sim };
      v105Sim = false;
      v105Real = null;
      roTreeDraft = sim;
      roTreeAction("apply"); // 沿用原本的套用流程（重算數值、存檔）
      roTreeDraft = { ...S.roTree.ranks };
      return roTreeRender();
    }
    roTreeRender();
  });
  if (!document.getElementById("v105css")) {
    const st = document.createElement("style");
    st.id = "v105css";
    st.textContent = `
      .ro-tree-sheet.v105sim .tree-header h2{color:#7a4fd0}
      .ro-tree-sheet.v105sim .tree-map{box-shadow:inset 0 0 0 3px rgba(140,90,230,.55)}
      .ro-tree-sheet .v105simBtn[aria-pressed="true"]{background:#7a4fd0;color:#fff;border-color:#5d36b0}
      .ro-tree-sheet .v105tag{color:#7a4fd0;font-weight:700}
      .ro-tree-sheet .v105sum{margin:4px 0 8px;padding-left:1.2em;font-size:.92em;line-height:1.55}
      .ro-tree-sheet .v105sum li{margin:1px 0}`;
    document.head.appendChild(st);
  }
  // 說明
  const h = HELP.tree?.[1] || HELP.char?.[1];
  if (Array.isArray(h) && !h.some((r) => r[0] === "天賦模擬器"))
    h.push(["天賦模擬器", "天賦樹上方按「模擬器」切換。模擬器裡點的天賦另外存檔、不影響數值，可以先試配；側邊顯示模擬配置的素質與加成總和。可「清空模擬」「從目前配置複製」，或「一鍵套用到目前天賦」（按兩次確認；點數與目前等級相同，配置無效或戰鬥中不能套用）。"]);
}

// ---------------------------------------------------------------------------
// 3. 無限武鬥場換層：一定躲出爆炸預警圈、不走進去
function v105Away(h, p) {
  let s, e;
  if (h.k === "line") {
    const n = h.x2 - h.x,
      l = h.y2 - h.y,
      o = Math.hypot(n, l) || 1;
    s = -l / o;
    e = n / o;
    if ((p.x - h.x) * s + (p.y - h.y) * e < 0) (s = -s), (e = -e);
  } else {
    s = p.x - h.x;
    e = p.y - h.y;
    const d = Math.hypot(s, e);
    if (d < 0.5) (s = 1), (e = 0);
    else (s /= d), (e /= d);
  }
  if ((p.x < 14 && s < 0) || (p.x > G.W - 14 && s > 0)) s = 0;
  if ((p.y < G.top + 12 && e < 0) || (p.y > G.H - 10 && e > 0)) e = 0;
  if (!s && !e) e = p.y < (G.top + G.H) / 2 ? 1 : -1;
  return [s, e];
}
function v105RestInstall() {
  if (typeof dodgeDir !== "function") return;
  const dd = dodgeDir;
  dodgeDir = function (...a) {
    const tw = G?.tw,
      p = G?.pl;
    if (!tw || !(tw.rest > 0) || !p || G.dead) return dd.apply(this, a);
    const hz = (G.haz || []).filter((h) => h.k !== "frost");
    if (!hz.length) return dd.apply(this, a);
    const inside = hz.find((h) => inHaz(h, p.x, p.y, 3));
    if (inside) return v105Away(inside, p);
    const cx = G.W / 2,
      cy = (G.top + G.H) / 2,
      dx = cx - p.x,
      dy = cy - p.y,
      d = Math.hypot(dx, dy);
    if (d > 4)
      for (const s of [3, 7, 11, 15]) {
        if (s > d + 3) break;
        const x = p.x + (dx / d) * s,
          y = p.y + (dy / d) * s;
        if (hz.some((h) => inHaz(h, x, y, 3))) return [0, 0]; // 在圈外等爆完
      }
    return dd.apply(this, a);
  };
}

function v105Install() {
  v105BatchInstall();
  v105SimInstall();
  v105RestInstall();
}
if (typeof roV4Install === "function") {
  const r4v105 = roV4Install;
  roV4Install = function () {
    r4v105();
    v105Install();
  };
}
