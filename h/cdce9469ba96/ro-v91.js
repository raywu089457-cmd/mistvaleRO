/* 流浪仙境 正式版 v1.0（內部 v9.1）：
   1. 技能盤：每顆寶石只描外圍一圈加粗的深色外框（主動深藍、輔助深紫、變異橘金、穿梭青綠），並在沒有圖示的格子寫上技能名字
   2. 新版本強制更新：發現新版立即倒數 30 秒；倒數結束時若正在挑戰（頭目、武鬥場整輪、MVP、試煉、守護者），
      停止所有自動挑戰，等這一輪結束後立即存檔並重新整理
   3. 獨特、主宰裝備的格子更顯眼；闇答萊屍的冥王之冠加上流光動態效果
   4. MVP 武道場勝利必得的高純度魔力礦石 2 → 3 顆 */

const V91 = {
  C: 16, // 格子（SVG 單位）
  P: 17, // 格子間距
  hair: 0.55, // 最外圈的深色細線
  edge: 1.5, // 彩色外框寬度
  col: {
    act: { fill: "#263c58", edge: "#2a78d6", hair: "#08121f" },
    sup: { fill: "#40364f", edge: "#9a48d8", hair: "#140a20" },
    mu: { edge: "#e8961c" }, // 變異：橘金
    sx: { edge: "#14b394" }, // 穿梭：青綠
    sel: "#ffd23a", // 選取中
  },
  upd: 30, // 發現新版後的倒數秒數
};

if (typeof V64_ORE !== "undefined") V64_ORE.mvp = 3;

// ---------------------------------------------------------------------------
// 1. 技能盤
(function v91Css() {
  if (typeof document === "undefined") return;
  const st = document.createElement("style");
  st.textContent = `
.ro-skills .sgrid{container-type:inline-size}
.ro-skills .sgrid .v91nm{display:flex;position:absolute;z-index:2;pointer-events:none;align-items:center;justify-content:center;text-align:center;box-sizing:border-box;padding:0 1px;
 color:#fff;font-family:Tahoma,"Microsoft JhengHei",sans-serif;font-weight:700;line-height:1.08;white-space:nowrap;letter-spacing:0;font-size:11px;
 text-shadow:1px 0 #0b1420,-1px 0 #0b1420,0 1px #0b1420,0 -1px #0b1420,1px 1px #0b1420,-1px 1px #0b1420,1px -1px #0b1420,-1px -1px #0b1420,0 0 3px #0b1420}
.ro-skills .sgrid .v91nm span{display:block;writing-mode:horizontal-tb;letter-spacing:0}
.ro-skills .sgrid .v91nm.sup{color:#fff3cf}
.ro-skills .sgrid .v91nm.dragsrc{display:none}
.ro-skills .gov{filter:drop-shadow(1px 1px 0 rgba(0,0,0,.35))}
.ro-skills .gov.sel{filter:drop-shadow(0 0 3px #ffd23a)}
.cell.ro-item-slot.ru{--ro-rarity:#7a3cc2;border-width:3px;box-shadow:inset 0 0 0 1px #fff9,0 0 6px 1px #7a3cc280;
 background:radial-gradient(circle at 50% 55%,#a46fe066,transparent 74%),linear-gradient(#f2eafb,#dac9f0)}
.cell.ro-item-slot.rm{--ro-rarity:#b02c5e;border-width:3px;box-shadow:inset 0 0 0 1px #fff9,0 0 0 2px #e3b43c,0 0 8px 2px #b02c5e88;
 background:radial-gradient(circle at 50% 55%,#e0608f70,transparent 74%),linear-gradient(#fbe4ed,#ecc3d4)}
.cell.ro-item-slot.v91mon{--ro-rarity:#8a4fff;border-width:3px;background:radial-gradient(circle at 50% 55%,#b07aff80,transparent 74%),linear-gradient(#efe6ff,#d2bff5);animation:v91mon 2.4s ease-in-out infinite}
.cell.ro-item-slot .v91shine{position:absolute;inset:0;pointer-events:none;overflow:hidden;border-radius:inherit;z-index:1}
.cell.ro-item-slot .v91shine::before{content:"";position:absolute;top:-20%;bottom:-20%;width:45%;left:-60%;transform:skewX(-20deg);
 background:linear-gradient(90deg,transparent,#ffffffb0 45%,#ffe9a0c0 55%,transparent);animation:v91shine 2.4s ease-in-out infinite}
@keyframes v91mon{0%,100%{box-shadow:inset 0 0 0 1px #fff9,0 0 0 2px #e3b43c,0 0 5px 1px #8a4fff99}50%{box-shadow:inset 0 0 0 1px #fff9,0 0 0 2px #ffd970,0 0 12px 4px #a070ffcc}}
@keyframes v91shine{0%{left:-60%}55%,100%{left:130%}}
@media (prefers-reduced-motion:reduce){.cell.ro-item-slot.v91mon,.cell.ro-item-slot .v91shine::before{animation:none}}`;
  (document.head || document.documentElement).appendChild(st);
})();

// 同一顆寶石的格子合成一塊；inset 越大越往內縮（用三層疊出：深色細線 → 彩色外框 → 底色）
function v91Rects(cells, ins, color) {
  const { C, P } = V91,
    has = new Set(cells.map((p) => p + "")),
    G = P - C,
    r = (x, y, w, h) => `<rect x="${+x.toFixed(2)}" y="${+y.toFixed(2)}" width="${+w.toFixed(2)}" height="${+h.toFixed(2)}" fill="${color}"/>`;
  let out = "";
  for (const [x, y] of cells) {
    const ox = x * P,
      oy = y * P,
      R = has.has([x + 1, y] + ""),
      D = has.has([x, y + 1] + "");
    out += r(ox + ins, oy + ins, C - 2 * ins, C - 2 * ins);
    if (R) out += r(ox + C - ins, oy + ins, G + 2 * ins, C - 2 * ins);
    if (D) out += r(ox + ins, oy + C - ins, C - 2 * ins, G + 2 * ins);
    if (R && D && has.has([x + 1, y + 1] + "")) out += r(ox + C - ins, oy + C - ins, G + 2 * ins, G + 2 * ins);
  }
  return out;
}
// 名字放在哪：避開圖示格，取最長的一排（橫或直）
function v91Label(local, icon) {
  const has = new Set(local.map((p) => p + "")),
    ik = icon + "",
    ok = (x, y) => has.has([x, y] + "") && [x, y] + "" !== ik,
    cx = local.reduce((a, p) => a + p[0], 0) / local.length,
    cy = local.reduce((a, p) => a + p[1], 0) / local.length;
  let best = null;
  const consider = (x, y, n, vert) => {
    const mx = vert ? x : x + (n - 1) / 2,
      my = vert ? y + (n - 1) / 2 : y,
      sc = n * 10 - Math.abs(mx - cx) - Math.abs(my - cy) - (vert ? 0.5 : 0);
    if (!best || sc > best.sc) best = { x, y, n, vert, sc };
  };
  for (const [x, y] of local) {
    if (!ok(x, y)) continue;
    if (!ok(x - 1, y)) {
      let n = 1;
      while (ok(x + n, y)) n++;
      consider(x, y, n, false);
    }
    if (!ok(x, y - 1)) {
      let n = 1;
      while (ok(x, y + n)) n++;
      if (n > 1) consider(x, y, n, true);
    }
  }
  return best || { x: icon[0], y: icon[1], n: 1, vert: false, onIcon: 1 };
}
const v91Pos = (x, y, w, h) =>
  `left:calc(6px + ${x} * ((100% - 27px) / 6 + 3px));top:calc(6px + ${y} * ((100% - 27px) / 6 + 3px));width:calc(${w} * ((100% - 27px) / 6 + 3px) - 3px);height:calc(${h} * ((100% - 27px) / 6 + 3px) - 3px)`;
function v91Name(gem, lab) {
  const name = SKILLS[gem.id]?.n || "",
    L = [...name].length,
    cell = "((100cqw - 15px) / 6)";
  let lines, per;
  if (lab.vert) {
    // 直排：一字一行（太長時兩字一行），不用直書排版，避免字擠在一起
    per = L <= Math.floor(lab.n * 2.4) ? 1 : 2;
    lines = Math.ceil(L / per);
  } else {
    lines = L <= lab.n * 3 ? 1 : 2;
    per = Math.ceil(L / lines);
  }
  const room = `(${cell} * ${lab.n} - 4px)`,
    cap = lab.onIcon ? 0.26 : lines > 1 ? 0.33 : 0.36,
    fs = lab.vert
      ? `max(9px, min(calc(${cell} * ${cap}), calc(${room} / ${lines} / 1.12), calc((${cell} - 4px) / ${per} * 0.94)))`
      : `max(9px, min(calc(${cell} * ${cap}), calc(${room} / ${per} * 0.94)))`;
  const chars = [...name],
    rows = [];
  for (let i = 0; i < chars.length; i += per) rows.push(esc(chars.slice(i, i + per).join("")));
  const txt = rows.join("<br>");
  const w = lab.vert ? 1 : lab.n,
    h = lab.vert ? lab.n : 1,
    extra = lab.onIcon ? ";align-items:flex-end;padding-bottom:1px" : "";
  return `<div class="gname v91nm${lab.vert ? " v91v" : ""}${SKILLS[gem.id]?.act ? "" : " sup"}" data-u="${gem.u}" style="${v91Pos(lab.x, lab.y, w, h)};font-size:${fs}${extra}"><span>${txt}</span></div>`;
}
function v91Overlay(gem, sel) {
  const cells = gemCells(gem),
    minX = Math.min(...cells.map((p) => p[0])),
    minY = Math.min(...cells.map((p) => p[1])),
    w = Math.max(...cells.map((p) => p[0])) - minX + 1,
    h = Math.max(...cells.map((p) => p[1])) - minY + 1,
    local = cells.map(([x, y]) => [x - minX, y - minY]).sort((a, b) => a[1] - b[1] || a[0] - b[0]),
    act = !!SKILLS[gem.id]?.act,
    base = act ? V91.col.act : V91.col.sup,
    edge = sel ? V91.col.sel : gem.sx ? V91.col.sx.edge : gem.mu ? V91.col.mu.edge : base.edge,
    { C, P } = V91,
    W = w * P - (P - C),
    H = h * P - (P - C),
    icon = local[0],
    dim = C * 0.72;
  const svg =
    `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">` +
    v91Rects(local, 0, base.hair) +
    v91Rects(local, V91.hair, edge) +
    v91Rects(local, V91.hair + V91.edge, base.fill) +
    `<image href="${roSkillIcon(gem.id)}" x="${icon[0] * P + (C - dim) / 2}" y="${icon[1] * P + (C - dim) / 2}" width="${dim}" height="${dim}" shape-rendering="auto"/></svg>`;
  const lab = v91Label(local, icon);
  lab.x += minX;
  lab.y += minY;
  return `<div class="gov${sel ? " sel" : ""}" data-u="${gem.u}" style="${v91Pos(minX, minY, w, h)}">${svg}</div>` + v91Name(gem, lab);
}

// ---------------------------------------------------------------------------
// 2. 新版本強制更新
let v91Hold = false; // 倒數結束：不再開始新的挑戰
const v91Busy = () => !!(typeof G !== "undefined" && G && S && !G.dead && (G.boss || G.tw));
function v91UpdInstall() {
  if (typeof v63Upd === "undefined" || typeof v63UpdTick !== "function") return;
  V63_UPD.count = V91.upd;
  v63Upd.left = V91.upd;
  v63UpdTick = function () {
    clearTimeout(v63Upd.timer);
    if (v63Upd.left > 0) {
      v63UpdBanner(`遊戲有新版本，${v63Upd.left} 秒後${v91Busy() ? "（本輪挑戰結束後）" : ""}自動存檔並更新`);
      v63Upd.left--;
      v63Upd.timer = setTimeout(v63UpdTick, 1000);
      return;
    }
    v91Hold = true;
    if (v91Busy()) {
      v63UpdBanner("遊戲有新版本：已停止自動挑戰，本輪挑戰結束後立即自動更新");
      v63Upd.timer = setTimeout(v63UpdTick, 500);
      return;
    }
    v63UpdGo();
  };
  // 倒數結束後不再開始新的挑戰（自動挑戰頭目、武鬥場自動入場、MVP 自動挑戰，以及手動開始）
  const block = (name) => {
    const f = globalThis[name];
    if (typeof f !== "function") return;
    globalThis[name] = function (...a) {
      if (v91Hold) {
        if (typeof toast === "function") toast("遊戲即將更新，暫停開始新的挑戰", "bad");
        return false;
      }
      return f.apply(this, a);
    };
  };
  for (const n of ["startBoss", "roArenaStart", "v64MvpStart", "startTrial", "startGuard"]) block(n);
}

// 3. 闇答萊屍的冥王之冠：流光
function v91CellInstall() {
  const ch = cellHtml;
  cellHtml = function (item, ...a) {
    const h = ch.call(this, item, ...a);
    if (!item || item.uq !== "v70_crown" || typeof h !== "string") return h;
    const h2 = h.replace('class="cell ', 'class="cell v91mon '),
      i = h2.lastIndexOf("</button>");
    return i < 0 ? h2 : h2.slice(0, i) + '<span class="v91shine"></span>' + h2.slice(i);
  };
}

function v91Install() {
  if (typeof gemOverlay === "function") gemOverlay = v91Overlay;
  v91CellInstall();
  v91UpdInstall();
}
if (typeof roV4Install === "function") {
  const r4v91 = roV4Install;
  roV4Install = function () {
    r4v91();
    v91Install();
  };
}
