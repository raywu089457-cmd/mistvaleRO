/* 流浪仙境 v1.2.16：排行榜快照顯示人物圖與寵物
   ・無限武鬥場排行：點進快照時，上方顯示角色外觀（依職業線、轉職階段與性別）與出戰的寵物（名稱、階級、星等）
   ・隊伍排行：每位隊員都顯示人物圖與寵物；排行榜列表也列出各隊員帶的寵物（v1.2.20 起只有隊長顯示人物圖，隊員改為點開構築快照）
   ・組隊副本遇到的影子隊伍（排行榜上的隊伍快照）改用快照的外觀與性別，並帶著快照裡的寵物
   ・之後上傳的紀錄才有外觀資料；舊紀錄只顯示職業的基本外觀 */

const V1216 = { ld: {} };

// 目前角色的外觀資料：外觀鍵（已含職業線、轉職階段、性別）、性別、出戰寵物
function v1216Look() {
  if (!S) return null;
  let sp = "";
  try {
    sp = roClass[S.cls].sprite || "";
  } catch (e) {}
  const k = typeof v1215Cur === "function" ? v1215Cur() : null;
  return { sp, sex: S.sex === "f" ? "f" : "m", cls: S.cls, pet: k ? { k, s: v1215Star(k) } : null };
}
const v1216SpOk = (s) => typeof s === "string" && /^[a-z0-9_]{1,24}$/.test(s);

// ---------------------------------------------------------------------------
// 1. 畫人物與寵物（畫在 canvas 上；圖片還沒載入時載入後重畫）
function v1216Img(file, redraw) {
  if (!file || typeof Image === "undefined") return null;
  const src = RO.root + file;
  if (RO.images[src]) return RO.images[src];
  const L = (V1216.ld[src] ||= { cb: [] });
  if (redraw) L.cb.push(redraw);
  if (!L.im) {
    L.im = new Image();
    L.im.onload = () => {
      RO.images[src] = L.im;
      const cb = L.cb.splice(0);
      for (const f of cb)
        try {
          f();
        } catch (e) {}
    };
    L.im.onerror = () => (L.cb.length = 0);
    L.im.src = src;
  }
  return null;
}
function v1216CharDef(look) {
  const A = RO.assets?.characters || {};
  let key = look && v1216SpOk(look.sp) && A[look.sp] ? look.sp : null;
  if (!key && look && roClass?.[look.cls]) key = Object.getOwnPropertyDescriptor(roClass[look.cls], "sprite")?.value || null;
  if (!key && look && roClass?.[look.cls]) {
    // 沒有外觀資料的舊紀錄：職業的基本外觀
    const base = { sword: "swordman", bow: "archer", mage: "mage", thief: "thief", acolyte: "acolyte", merchant: "merchant" }[look.cls];
    key = Object.keys(A).find((k) => k === base) || null;
  }
  const c = key && A[key];
  if (!c || !c.states || !c.states.idle) return null;
  const st = c.states.idle;
  return st.directions?.[0] ? { ...st.directions[0] } : { ...st };
}
function v1216Paint(cv) {
  if (!cv || !cv.isConnected) return;
  let look = null;
  try {
    look = JSON.parse(cv.dataset.look || "null");
  } catch (e) {}
  if (!look) return;
  const c = cv.getContext("2d"),
    W = cv.width,
    H = cv.height,
    redraw = () => v1216Paint(cv);
  c.clearRect(0, 0, W, H);
  c.imageSmoothingEnabled = false;
  // 腳下的光圈
  c.fillStyle = "rgba(0,0,0,.18)";
  c.beginPath();
  c.ellipse(W * 0.38, H - 8, 18, 5, 0, 0, Math.PI * 2);
  c.fill();
  const def = v1216CharDef(look);
  if (def && v1216Img(def.file, redraw)) {
    const im = RO.images[RO.root + def.file],
      k = 0.62;
    c.drawImage(im, (def.ox || 0), def.oy || 0, def.frameWidth, def.frameHeight, W * 0.38 - def.anchor[0] * k, H - 8 - def.anchor[1] * k, def.frameWidth * k, def.frameHeight * k);
  }
  const pk = look.pet && look.pet.k;
  const d = pk && typeof V1215_SPR !== "undefined" && V1215_SPR[pk];
  if (d && v1216Img(d.file, redraw)) {
    const im = RO.images[RO.root + d.file],
      f = d.states.idle,
      k = Math.min(0.9, (typeof v1215Scale === "function" ? v1215Scale(pk) : 0.3) * 2.2);
    c.fillStyle = "rgba(0,0,0,.18)";
    c.beginPath();
    c.ellipse(W * 0.76, H - 8, 10, 3, 0, 0, Math.PI * 2);
    c.fill();
    c.drawImage(im, f.ox || 0, f.oy || 0, f.frameWidth, f.frameHeight, W * 0.76 - f.anchor[0] * k, H - 8 - f.anchor[1] * k, f.frameWidth * k, f.frameHeight * k);
  }
}
function v1216Html(look, opt = {}) {
  if (!look) return "";
  const pk = look.pet && look.pet.k,
    P = pk && typeof V1215_BY !== "undefined" && V1215_BY[pk],
    T = P && V1215_TIER[P.r],
    st = Math.max(1, Math.min(5, +look.pet?.s || 1));
  const js = JSON.stringify({ sp: look.sp, sex: look.sex, cls: look.cls, pet: pk ? { k: pk, s: st } : null }).replace(/&/g, "&amp;").replace(/'/g, "&#39;").replace(/</g, "&lt;");
  const petTxt = P ? `<span style="color:${T.c}">${esc(P.n)}</span> <small>${T.n}・${"★".repeat(st)}</small>` : `<small class="note">沒有帶寵物</small>`;
  return `<div class="v1216look${opt.sm ? " sm" : ""}"><canvas class="v1216cv" width="${opt.sm ? 96 : 120}" height="${opt.sm ? 68 : 84}" data-look='${js}'></canvas><div class="v1216pet">${opt.name ? `<b>${esc(opt.name)}</b><br>` : ""}寵物：${petTxt}</div></div>`;
}
function v1216PaintAll(root) {
  const R = root || document;
  for (const cv of R.querySelectorAll("canvas.v1216cv")) v1216Paint(cv);
}
const V1216_CSS = `
.v1216look{display:flex;align-items:flex-end;gap:10px;margin:6px 0;padding:4px 8px;border:1px solid rgba(120,140,170,.35);border-radius:8px;background:linear-gradient(180deg,rgba(255,255,255,.55),rgba(220,230,245,.5))}
.v1216look canvas{image-rendering:pixelated;flex:none}
.v1216look .v1216pet{font-size:12px;padding-bottom:6px}
.v1216look.sm{margin:0 0 4px;padding:2px 6px}
.v1213rki .v1216pets{grid-column:2/4;font-size:11px;color:var(--muted)}`;

// ---------------------------------------------------------------------------
// 2. 安裝
function v1216Install() {
  // 排行快照加上外觀資料（無限武鬥場、隊伍排行的每位隊員）
  if (typeof v6RkSnap === "function") {
    const rs = v6RkSnap;
    v6RkSnap = function (...a) {
      const r = rs.apply(this, a);
      try {
        if (r && typeof r === "object") r.look = v1216Look();
      } catch (e) {}
      return r;
    };
  }
  // 無限武鬥場排行的快照畫面
  if (ui.snapOpen) {
    const so = ui.snapOpen;
    ui.snapOpen = function (t, ...a) {
      const r = so.call(this, t, ...a);
      try {
        const rec = t && t.v6 && typeof V6RK_REC !== "undefined" ? V6RK_REC[t.p] : null;
        if (rec) {
          const sh = $("#sheet");
          const look = rec.d && rec.d.look ? rec.d.look : { cls: rec.cls };
          if (sh && !sh.querySelector(".v1216look")) {
            const h = sh.querySelector("h2");
            if (h) h.insertAdjacentHTML("afterend", v1216Html(look));
            v1216PaintAll(sh);
          }
        }
      } catch (e) {}
      return r;
    };
  }
  // 隊伍排行：列表列出寵物；隊伍畫面每位隊員顯示人物圖與寵物
  if (typeof v1213RankSheet === "function") {
    const rk = v1213RankSheet;
    v1213RankSheet = function (...a) {
      const r = rk.apply(this, a);
      try {
        const L = V1213RK.list || [];
        const sh = document.querySelector("#sheet .v1213rk");
        if (sh)
          sh.querySelectorAll(".v1213rki").forEach((b, i) => {
            const m = (L[i] && L[i].mem) || [];
            const pets = m.map((x) => (x.p && V1215_BY?.[x.p.k] ? V1215_BY[x.p.k].n : "")).filter(Boolean);
            if (pets.length && !b.querySelector(".v1216pets")) b.insertAdjacentHTML("beforeend", `<span class="v1216pets">寵物：${esc(pets.join("、"))}</span>`);
          });
      } catch (e) {}
      return r;
    };
  }
  if (typeof v1213RankView === "function") {
    const rv = v1213RankView;
    v1213RankView = async function (id, ...a) {
      const r = await rv.call(this, id, ...a);
      try {
        const row = (V1213RK.list || []).find((x) => x.id === id);
        const j = V1213RK.snap[id];
        const mem = (j && j.d && j.d.mem) || [];
        const li = typeof v1213RkLead === "function" ? v1213RkLead(id) : 0; // v1.2.20：只有隊長顯示人物圖
        document.querySelectorAll("#sheet .v1213rv").forEach((el, i) => {
          if (i !== li || el.querySelector(".v1216look")) return;
          const m = (row && row.mem && row.mem[i]) || {};
          const look = (mem[i] && mem[i].s && mem[i].s.look) || { sp: m.sp, sex: m.x, cls: m.c, pet: m.p ? { k: m.p.k, s: m.p.s } : null };
          el.insertAdjacentHTML("afterbegin", v1216Html(look, { sm: 1 }));
        });
        v1216PaintAll(document.getElementById("sheet"));
      } catch (e) {}
      return r;
    };
  }
  // 影子隊伍：快照的性別與寵物
  if (typeof v1213GhostSpawn === "function") {
    const gs = v1213GhostSpawn;
    v1213GhostSpawn = function (f, ...a) {
      const r = gs.call(this, f, ...a);
      try {
        const R = V1213.run,
          team = R && R.ghostTeam;
        if (team && Array.isArray(team.mem))
          R.ghosts.forEach((m, i) => {
            const mm = team.mem[i] || {};
            if (m.v1213) {
              m.v1213.sex = mm.x === "f" ? "f" : "m";
              m.v1213.pet = mm.p && V1215_BY?.[mm.p.k] ? mm.p.k : null;
            }
          });
      } catch (e) {}
      return r;
    };
  }
  if (typeof v1213DrawGhost === "function") {
    const dg = v1213DrawGhost;
    v1213DrawGhost = function (c, m, ...a) {
      const B = m && m.v1213;
      if (B && !B.fake && B.sex) {
        try {
          const st = v1213Quiet(() => newState(B.cls));
          st.tal = { ...(st.tal || {}), asc: B.br };
          st.lvl = B.lv;
          st.sex = B.sex;
          B.fake = st;
        } catch (e) {}
      }
      const r = dg.call(this, c, m, ...a);
      try {
        const pk = B && B.pet,
          d = pk && V1215_SPR[pk];
        if (d && v1215Load(pk)) {
          c.save();
          c.globalAlpha = 0.85;
          roFrame(c, { ...d.states.idle, file: d.file }, m.x - 11, m.y + 3, v1215Scale(pk), G.t, false);
          c.restore();
        }
      } catch (e) {}
      return r;
    };
  }
  if (typeof document !== "undefined" && !document.getElementById("v1216css")) {
    const st = document.createElement("style");
    st.id = "v1216css";
    st.textContent = V1216_CSS;
    document.head.appendChild(st);
  }
}

if (typeof roV4Install === "function") {
  const r4v1216 = roV4Install;
  roV4Install = function () {
    r4v1216.apply(this, arguments);
    try {
      v1216Install();
    } catch (e) {
      console.error("v1216", e);
    }
  };
}
