/* 流浪仙境 v1.2.18：冒險手冊加入詛咒說明、寵物扭蛋機移到朱諾（v1.2.22 起改到吉芬，V1218.town）、保留規則新增「指定詞綴」
   1. 冒險手冊（選單 → 冒險手冊）新增「詛咒」：7 種詛咒的時間與效果、頭目減半、強控抗性、會施加詛咒的技能、反噬時自己中的效果
   2. 寵物整個移到朱諾：朱諾廣場新增 NPC「寵物飼育員」（RO 原版 NPC 圖），扭蛋、圖鑑、換出戰寵物都在這裡；選單不再有「寵物」
   3. 保留規則新增條件「指定詞綴」：選一種裝備能力值，可填最低數值（含精煉加成，例如「敏捷 ≥ 15」）；
      背包的規則篩選（自訂條件）、拾取篩選、批次分解都會套用 */

const V1218 = { pos: [0.5, 0.74], force: 0, town: "geffen" }; // v1.2.22：寵物飼育員所在的城鎮（原本 yuno）
const v1218Tn = () => (typeof V113_TOWNS !== "undefined" && V113_TOWNS[V1218.town]?.n) || "吉芬";

// ---------------------------------------------------------------------------
// 1. 冒險手冊：詛咒
function v1218CurseHtml() {
  const C = typeof CRS !== "undefined" ? CRS : {},
    N = V1211.nw,
    F = V1211.self,
    col = V1211.C,
    pct = (v) => Math.round(v * 100);
  const by = {};
  for (const [id, sk] of Object.entries(SKILLS)) if (sk && sk.act && sk.crs && sk.n) (by[sk.crs] ||= []).push(sk.n);
  const src = (k) => (by[k] && by[k].length ? `<small class="note">（技能：${esc([...new Set(by[k])].join("、"))}）</small>` : "");
  const rows = [
    ["wk", `${C.wk?.t ?? 6} 秒：造成的傷害 −${pct(C.wk?.v ?? 0.25)}%`],
    ["sl", `${C.sl?.t ?? 6} 秒：移動與攻擊速度 −${pct(C.sl?.v ?? 0.3)}%`],
    ["vu", `${C.vu?.t ?? 6} 秒：受到的傷害 +${pct(C.vu?.v ?? 0.25)}%`],
    ["pt", `${N.pt.t} 秒：無法移動與攻擊`],
    ["sp", `${N.sp.t} 秒：無法移動與攻擊；被打就醒，叫醒的那一下必定暴擊`],
    ["bl", `${N.bl.t} 秒：攻擊 ${pct(N.bl.miss)}% 落空`],
    ["cf", `${N.cf.t} 秒：亂走，攻擊 ${pct(N.cf.hit)}% 打到旁邊的怪`],
  ];
  const list = rows.map(([k, d]) => `<p><b class="v54ea" style="--ec:${col[k]}">${V1211.N[k]}</b>　${esc(d)}${src(k)}</p>`).join("");
  const more = [
    ["頭目", "石化、睡眠、致盲、混亂的時間減半。"],
    ["強控抗性", `石化、睡眠、混亂每次被同一個來源（同一顆寶石）施加，該詛咒的抗性 +${pct(V1211.res.up)}%，持續時間 ×（1 − 抗性）；抗性滿 100% 時免疫，直到抗性回落到 0 才會再中；抗性每秒 −${pct(V1211.res.down)}%。怪物頭上的狀態圖示旁會顯示抗性。`],
    ["來源", "詛咒類技能；沒有傷害的主動技能的變異寶石（元素變異改為附加詛咒，多重變異附加兩種，變成被動或光環時持續施加）。"],
    ["反噬", `失敗變異的反噬：施放時自己也中那種詛咒 ${F.t} 秒——衰弱：你的傷害 ×${F.wk}；緩慢：攻擊與移動速度 ×${F.sl}；脆弱：受到的傷害 ×${F.vu}；致盲：暴擊率 −${F.crit}%；混亂：攻擊 ${pct(F.miss)}% 落空；石化、睡眠：定身 ${F.root} 秒。`],
  ]
    .map(([n, d]) => `<p><b>${n}</b>　${esc(d)}</p>`)
    .join("");
  return `<h3>詛咒</h3><div class="box stack">${list}${more}</div>`;
}

// ---------------------------------------------------------------------------
// 2. 寵物飼育員（v1.2.22 起在吉芬）
const v1218InJuno = () => typeof v113In === "function" && v113In() && G && G.arena && G.arena.v113 === V1218.town;
function v1218Open() {
  if (!S) return;
  const sh = $("#sheet");
  sh.className = "wide v1218pet";
  $("#sheetBg").hidden = false;
  sh.innerHTML = v1215Page() + '<div class="row" style="margin-top:10px"><span class="spacer"></span><button class="btn" data-act="close">關閉</button></div>';
}
const v1218SheetOn = () => {
  const sh = typeof document !== "undefined" && document.querySelector("#sheet.v1218pet");
  return !!(sh && !$("#sheetBg").hidden);
};
// 前往寵物飼育員所在的城鎮
function v1218Go() {
  if (!S || !G || typeof v113Enter !== "function") return;
  if (v1218InJuno()) return v1218Open();
  if (G.boss || G.tw || G.trial != null || G.guard != null || (typeof V1213 !== "undefined" && V1213.run)) return void toast(`戰鬥中不能前往${v1218Tn()}`, "bad");
  try {
    sheetOff();
  } catch (e) {}
  if (ui.tab !== "map") ui.setTab("map");
  v113Enter(V1218.town, () => v1218Open());
}
function v1218Dlg() {
  const tix = v1215Tix(),
    a = v1215Acct(),
    own = V1215_PETS.filter((p) => a.own[p[0]]).length;
  return [
    `嘿，冒險者！我是寵物飼育員，這台扭蛋機裡住著 ${V1215_PETS.length} 種從各地帶回來的寵物。用寵物扭蛋券就能轉一次，運氣好還會遇到傳說中的寵物喔。你的圖鑑目前 ${own}/${V1215_PETS.length}，出戰的寵物也可以在我這裡換。<span class="note">寵物扭蛋券在組隊副本每層 5% 掉落，整個帳號共用。</span>`,
    [v113Opt("v1218pet", "寵物扭蛋與圖鑑", { s: `扭蛋券 ${tix} 張`, p: 1 })],
  ];
}

// ---------------------------------------------------------------------------
// 3. 保留規則：指定詞綴（裝備能力值）
let V1218_BX = null;
function v1218BxList() {
  if (V1218_BX) return V1218_BX;
  const out = [];
  if (typeof V5_KN !== "undefined") for (const [k, [n, u]] of Object.entries(V5_KN)) out.push([k, n + (u || "")]);
  if (typeof V5_FRAC !== "undefined")
    for (const [k, f] of Object.entries(V5_FRAC))
      try {
        out.push([k, f("□").replace(/\s+/g, " ")]);
      } catch (e) {}
  return (V1218_BX = out);
}
const v1218Frac = (k) => typeof V5_FRAC !== "undefined" && !!V5_FRAC[k];
// 裝備上看到的數值（含精煉加成；比例類換成 %）
function v1218Val(t, e) {
  let x = 1;
  try {
    if (typeof v5RefX === "function") x = v5RefX(t) || 1;
  } catch (er) {}
  const v = (+e.v || 0) * x;
  return v1218Frac(e.k) ? v * 100 : v;
}
function v1218Cond(t, a) {
  const list = (t && t.bx) || [];
  return list.some((e) => e && e.k === a.a && !(+a.v > 0 && v1218Val(t, e) + 1e-9 < +a.v));
}

// ---------------------------------------------------------------------------
// 4. 安裝
function v1218Install() {
  // 冒險手冊
  if (ui.m_roguide) {
    const rg = ui.m_roguide;
    ui.m_roguide = function (...a) {
      const h = rg.apply(this, a);
      if (typeof V1211 === "undefined" || h.includes("<h3>詛咒</h3>")) return h;
      let sec = "";
      try {
        sec = v1218CurseHtml();
      } catch (e) {
        return h;
      }
      return h.includes("<h3>技能</h3>") ? h.replace("<h3>技能</h3>", sec + "<h3>技能</h3>") : h + sec;
    };
  }

  // 寵物：選單拿掉，改到寵物飼育員
  if (typeof MENU !== "undefined") {
    const i = MENU.findIndex((m) => m[0] === "v1215");
    if (i >= 0) MENU.splice(i, 1);
  }
  if (typeof v1215Pull === "function") {
    const pl = v1215Pull;
    v1215Pull = function (...a) {
      if (!V1218.force && !v1218InJuno()) return void toast(`請到${v1218Tn()}找寵物飼育員扭蛋`, "bad");
      return pl.apply(this, a);
    };
    const eq = v1215Equip;
    v1215Equip = function (...a) {
      if (!V1218.force && !v1218InJuno()) return void toast(`請到${v1218Tn()}找寵物飼育員更換寵物`, "bad");
      return eq.apply(this, a);
    };
    const rf = v1215Refresh;
    v1215Refresh = function (...a) {
      if (v1218SheetOn()) {
        try {
          v1218Open();
        } catch (e) {}
      }
      return rf.apply(this, a);
    };
  }
  if (typeof V113_NPC !== "undefined" && typeof V113_TOWNS !== "undefined" && V113_TOWNS[V1218.town]) {
    V113_NPC.pet = { n: "寵物飼育員", t: "寵物飼育員", sub: "寵物扭蛋・圖鑑", job: 87, spr: "npc/npc_87.png", cut: "" };
    V113_TOWNS[V1218.town].npc.pet = V1218.pos;
    const vn = v113Npcs;
    v113Npcs = function (...a) {
      const r = vn.apply(this, a),
        T = v113Town();
      if (T && T.npc.pet && G) r.push({ k: "pet", x: Math.round(T.npc.pet[0] * G.W), y: Math.round(G.top + T.npc.pet[1] * (G.H - G.top)) });
      return r;
    };
    const dl = v113Dlg;
    v113Dlg = function (k, ...a) {
      return k === "pet" ? v1218Dlg() : dl.call(this, k, ...a);
    };
    const act = v113Act;
    v113Act = function (a, k, ...x) {
      if (a === "v1218pet") return void v1218Open();
      return act.call(this, a, k, ...x);
    };
    // 有扭蛋券時頭上顯示「!」
    const dn = v113DrawNpc;
    v113DrawNpc = function (c, n, ...a) {
      const r = dn.call(this, c, n, ...a);
      if (n && n.k === "pet" && v1215Tix() > 0) {
        const im = v113Img(V113_NPC.pet.spr);
        if (v113Ok(im)) {
          const h = im.naturalHeight * V113.sc,
            b = Math.round(Math.sin(G.t * 5) * 1.2);
          ptext(c, "!", n.x - 1, n.y - h - 6 + b, "#ffd84a", 2, "#5a3200");
        }
      }
      return r;
    };
    // 地圖頁：城鎮的 NPC 按鈕
    const th = v113TownsHtml;
    v113TownsHtml = function (...a) {
      const h = th.apply(this, a),
        T = v113Town();
      if (!T || !T.npc.pet || !h.includes("v113npcs")) return h;
      const N = V113_NPC.pet,
        b = `<button class="v113n" data-v113="npc" data-k="pet"><span class="v113ni"><img src="${V113.root + N.spr}" alt="">${v1215Tix() > 0 ? '<i class="dot"></i>' : ""}</span><b>${N.n}</b><small>${N.sub}</small></button>`;
      return h.replace(/<div class="v113npcs[^"]*">/, `<div class="v113npcs ${T.npc.fortune ? "v1218n6" : "v125n5"}">`).replace(/<\/div><\/div>$/, b + "</div></div>");
    };
    if (Array.isArray(HELP.v113?.[1])) {
      const rows = HELP.v113[1],
        r = rows.find((x) => x[0] === "NPC");
      if (r) r[1] = `點畫面上的 NPC，或地圖頁的 NPC 按鈕即可對話。每座城鎮都有相同的 4 位 NPC，朱諾另有占卜師，${v1218Tn()}另有寵物飼育員。`;
      if (!rows.some((x) => x[0] === "寵物飼育員")) {
        const i = rows.findIndex((x) => x[0] === "占卜師");
        rows.splice(i < 0 ? rows.length : i + 1, 0, ["寵物飼育員", `只在${v1218Tn()}：用寵物扭蛋券扭蛋、查看寵物圖鑑、更換出戰的寵物（詳見「寵物」說明）。`]);
      }
    }
  }
  // 說明文字
  if (Array.isArray(HELP.v1215?.[1])) {
    for (const r of HELP.v1215[1]) {
      if (r[0] === "扭蛋券") r[1] = `組隊副本每通關一層 5% 機率掉落寵物扭蛋券，整個帳號共用；到${v1218Tn()}找寵物飼育員扭蛋。`;
      if (r[0] === "出戰") r[1] = `圖鑑整個帳號共用，每個角色各自選 1 隻出戰，到${v1218Tn()}找寵物飼育員更換；寵物跟在角色身邊並提供能力。組隊副本的隊友也會帶著自己出戰的寵物。`;
    }
  }
  if (Array.isArray(HELP.v1213?.[1])) for (const r of HELP.v1213[1]) if (r[0] === "獎勵") r[1] = String(r[1]).replace("（在「選單 → 寵物」使用）", `（到${v1218Tn()}找寵物飼育員使用）`);
  // 組隊副本卡片：扭蛋券旁邊放「到吉芬扭蛋」
  if (typeof v1213Card === "function") {
    const cd = v1213Card;
    v1213Card = function (...a) {
      const h = cd.apply(this, a);
      return h.replace(/(<span>寵物扭蛋券 <b class="px">\d+<\/b><\/span>)/, `$1<button class="btn sm" data-v1218="go">到${v1218Tn()}扭蛋</button>`);
    };
  }

  // 保留規則：指定詞綴
  if (typeof KEEP_K !== "undefined" && typeof keepCond === "function") {
    const old = { ...KEEP_K };
    for (const k of Object.keys(KEEP_K)) delete KEEP_K[k];
    Object.assign(KEEP_K, { bx: "指定詞綴", ...old });
    KEEP_DEF.bx = { a: "rstr", v: 0 };
    const kc = keepCond;
    keepCond = function (t, a, ...x) {
      if (a && a.k === "bx") return v1218Cond(t, a);
      return kc.call(this, t, a, ...x);
    };
    const kr = keepRow;
    keepRow = function (t, g, c, e, ...x) {
      if (e || !t || t.k !== "bx") return kr.call(this, t, g, c, e, ...x);
      const sel = keepSel("a", g, c, v1218BxList(), t.a, "詞綴", "v1218bx");
      const inp = `<span class="ge">≥</span><input type="number" class="num" inputmode="decimal" min="0" max="9999" step="0.1" data-kf="v" data-g="${g}" data-c="${c}" value="${+t.v > 0 ? +t.v : ""}" placeholder="不限" aria-label="最低數值">`;
      return `<div class="kc"><button class="btn sm knot" data-act="knot" data-g="${g}" data-c="${c}" aria-pressed="${!!t.not}" aria-label="非：反轉這個條件">非</button>${keepSel("k", g, c, Object.entries(KEEP_K), t.k, "條件種類", "kk")}<div class="kpar">${sel}${inp}</div><button class="btn sm kx" data-act="kcdel" data-g="${g}" data-c="${c}" aria-label="刪除條件">✕</button></div>`;
    };
    const kch = keepChange;
    keepChange = function (el, ...x) {
      try {
        const f = el.dataset.kf,
          grp = keepR(el)[+el.dataset.g],
          n = grp && grp.c[+el.dataset.c];
        if (n && n.k === "bx" && (f === "a" || f === "v")) {
          if (f === "a") n.a = el.value;
          else n.v = Math.max(0, Math.min(9999, Math.round((+el.value || 0) * 10) / 10));
          if (el.dataset.kr) (ui.bagN = 0), (ui.bagTop = 0);
          markDirty();
          return;
        }
      } catch (e) {}
      return kch.call(this, el, ...x);
    };
    if (Array.isArray(HELP.keep?.[1]) && !HELP.keep[1].some((x) => x[0] === "指定詞綴"))
      HELP.keep[1].splice(1, 0, ["指定詞綴", "裝備上有選定的能力值（例如敏捷、暴擊傷害、閃避%）才符合；填了最低數值時，數值（含精煉加成）要達到才符合，例如「敏捷 ≥ 15」。同一條規則放兩個就是「兩種都要有」。"]);
  }

  // 點擊
  if (typeof document !== "undefined") {
    document.addEventListener("click", (e) => {
      const b = e.target && e.target.closest && e.target.closest("[data-v1218]");
      if (!b) return;
      e.preventDefault();
      if (b.dataset.v1218 === "go") v1218Go();
    });
    if (!document.getElementById("v1218css")) {
      const st = document.createElement("style");
      st.id = "v1218css";
      st.textContent = `.v113npcs.v1218n6{grid-template-columns:repeat(3,minmax(0,1fr))}
.v1218pet .v1215grid{grid-template-columns:repeat(auto-fill,minmax(80px,1fr))}
.kpar .v1218bx{max-width:170px}`;
      document.head.appendChild(st);
    }
  }
}

if (typeof roV4Install === "function") {
  const r4v1218 = roV4Install;
  roV4Install = function () {
    r4v1218.apply(this, arguments);
    try {
      v1218Install();
    } catch (e) {
      console.error("v1218", e);
    }
  };
}
