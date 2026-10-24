/* 流浪仙境 v1.0.6（內部 v9.6）：天賦樹的拖曳與縮放（手機網頁版）
   1. 修正手指拖曳中斷：觸控時瀏覽器先把手指綁在點到的節點上，原本改綁到地圖時，舊綁定解除被當成放開，拖曳只動約 10 點就停
   2. 雙指縮放（以兩指中間為中心，可同時拖動）
   3. 縮放範圍 50%～300% → 50%～1000%；＋／－ 每次 ×1.4，以畫面中心縮放（原本 +25%，且放大後看的位置會跑掉）
   4. 手機版（寬度 760 以下）：天賦樹全螢幕、地圖區加高、圖例改為可收合、底部按鈕不再重疊；打開時放大到 250% 並置中選取節點 */

const V96 = { zmin: 0.5, zmax: 10, step: 1.4, mobZ: 2.5, mob: "(max-width: 760px)" };
const v96Mob = () => typeof matchMedia === "function" && matchMedia(V96.mob).matches;
const v96Clamp = (z) => Math.min(V96.zmax, Math.max(V96.zmin, Math.round(z * 1000) / 1000));
let v96Legend = false;

// 套用縮放：z 為新倍率，(px,py) 為相對地圖中心的焦點（畫面上的這一點縮放後保持不動）
function v96Zoom(map, z, px = 0, py = 0, cam0, z0) {
  const k = z / (z0 ?? roTreeZoom),
    c = cam0 || roTreeCamera;
  roTreeCamera.x = px - (px - c.x) * k;
  roTreeCamera.y = py - (py - c.y) * k;
  roTreeZoom = z;
  const svg = map?.querySelector("svg");
  if (svg) svg.style.height = roTreeSvgH();
  const lab = document.querySelector("#sheet .tree-zoom-val");
  if (lab) lab.textContent = Math.round(z * 100) + "%";
  roTreePaintCamera();
}

function v96PanInstall() {
  const SEL = ".ro-tree-sheet .tree-map";
  const ptrs = new Map();
  let g = null; // 目前的手勢
  const rel = (map, x, y) => {
    const b = map.getBoundingClientRect();
    return [x - b.left - b.width / 2, y - b.top - b.height / 2];
  };
  const begin = (map) => {
    const ps = [...ptrs.values()];
    if (ps.length >= 2) {
      const [a, b] = ps,
        mid = rel(map, (a.x + b.x) / 2, (a.y + b.y) / 2);
      g = { map, pinch: 1, d0: Math.max(10, Math.hypot(a.x - b.x, a.y - b.y)), mid0: mid, z0: roTreeZoom, cam0: { ...roTreeCamera }, moved: true };
    } else if (ps.length === 1) {
      const a = ps[0];
      g = { map, x: a.x, y: a.y, cam0: { ...roTreeCamera }, moved: g?.moved || false };
    } else g = null;
  };
  const block = (e) => {
    e.stopPropagation();
  };
  // 原本的拖曳程式掛在 document 上；這裡在 window 的捕捉階段先處理並攔下，避免兩套同時動作
  window.addEventListener(
    "pointerdown",
    (e) => {
      const map = e.target.closest?.(SEL);
      if (!map) return;
      block(e);
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault(); // 避免點節點時瀏覽器捲動焦點
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) roTreeSuppressClick = false;
      begin(map);
    },
    true,
  );
  window.addEventListener(
    "pointermove",
    (e) => {
      if (!ptrs.has(e.pointerId)) return;
      block(e);
      const p = ptrs.get(e.pointerId);
      p.x = e.clientX;
      p.y = e.clientY;
      if (!g || !g.map.isConnected) return;
      e.preventDefault();
      if (g.pinch) {
        const [a, b] = [...ptrs.values()],
          d = Math.max(10, Math.hypot(a.x - b.x, a.y - b.y)),
          mid = rel(g.map, (a.x + b.x) / 2, (a.y + b.y) / 2),
          z = v96Clamp((g.z0 * d) / g.d0);
        // 先以起始兩指中心縮放，再跟著兩指中心移動
        v96Zoom(g.map, z, g.mid0[0], g.mid0[1], g.cam0, g.z0);
        roTreeCamera.x += mid[0] - g.mid0[0];
        roTreeCamera.y += mid[1] - g.mid0[1];
        roTreePaintCamera();
        return;
      }
      const dx = p.x - g.x,
        dy = p.y - g.y;
      if (!g.moved && Math.hypot(dx, dy) < 6) return;
      if (!g.moved) {
        g.moved = true;
        g.map.classList.add("dragging");
      }
      roTreeCamera.x = g.cam0.x + dx;
      roTreeCamera.y = g.cam0.y + dy;
      roTreePaintCamera();
    },
    { capture: true, passive: false },
  );
  const end = (e) => {
    if (!ptrs.has(e.pointerId)) return;
    block(e);
    ptrs.delete(e.pointerId);
    const moved = g?.moved;
    if (ptrs.size) {
      // 兩指變一指：從目前位置接著拖，不會跳動
      const map = g?.map;
      if (map) begin(map);
      if (g) g.moved = true;
      return;
    }
    if (moved) roTreeSuppressClick = true; // 拖曳或縮放後放開，不算點選節點
    g?.map?.classList.remove("dragging");
    g = null;
  };
  window.addEventListener("pointerup", end, true);
  window.addEventListener("pointercancel", end, true);
  window.addEventListener(
    "lostpointercapture",
    (e) => {
      if (e.target?.closest?.(SEL)) block(e);
    },
    true,
  );
  // 滾輪（觸控板捏合也是滾輪）：以滑鼠位置為中心，50%～1000%
  window.addEventListener(
    "wheel",
    (e) => {
      const map = e.target.closest?.(SEL);
      if (!map) return;
      block(e);
      e.preventDefault();
      const z = v96Clamp(roTreeZoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12));
      if (z === roTreeZoom) return;
      const [px, py] = rel(map, e.clientX, e.clientY);
      v96Zoom(map, z, px, py);
    },
    { capture: true, passive: false },
  );
}

// ＋／－：每次 ×1.4，以畫面中心為焦點
function v96ButtonsInstall() {
  const ta = roTreeAction;
  roTreeAction = function (action, ...x) {
    if (action === "zoomin" || action === "zoomout") {
      if (!roTreeDraft) return;
      const z = v96Clamp(roTreeZoom * (action === "zoomin" ? V96.step : 1 / V96.step));
      v96Zoom($("#sheet .tree-map"), z, 0, 0);
      return roTreeRender();
    }
    return ta.call(this, action, ...x);
  };
}

// 手機：打開時放大到 250% 並把選取的節點放在畫面中間
function v96CenterOn(id) {
  const map = $("#sheet .tree-map"),
    el = id && map?.querySelector(`[data-ro-node="${CSS.escape(id)}"]`);
  if (!map || !el) return;
  const a = map.getBoundingClientRect(),
    b = el.getBoundingClientRect();
  roTreeCamera.x += a.left + a.width / 2 - (b.left + b.width / 2);
  roTreeCamera.y += a.top + a.height / 2 - (b.top + b.height / 2);
  roTreePaintCamera();
}
function v96OpenInstall() {
  const op = roTreeOpen;
  roTreeOpen = function (...a) {
    const r = op.apply(this, a);
    if (v96Mob()) {
      roTreeZoom = V96.mobZ;
      roTreeRender();
      v96CenterOn(roTreeSelected);
    }
    return r;
  };
}

// 手機版版面與圖例開關
function v96CssInstall() {
  if (document.getElementById("v96css")) return;
  const st = document.createElement("style");
  st.id = "v96css";
  st.textContent = `@media ${V96.mob}{
#sheetBg:has(> #sheet.ro-tree-sheet){padding:4px}
#sheet.ro-tree-sheet{width:100%;max-width:100%;height:100%;max-height:100%}
#sheet.ro-tree-sheet .tree-header{padding:8px 12px 6px;align-items:center}
#sheet.ro-tree-sheet .tree-header small{display:none}
#sheet.ro-tree-sheet .tree-header h2{font-size:17px;margin:0 0 2px}
#sheet.ro-tree-sheet .tree-header p{font-size:11px}
#sheet.ro-tree-sheet .tree-header p b{font-size:14px}
#sheet.ro-tree-sheet .tree-layout{grid-template-columns:1fr;grid-template-rows:minmax(0,1.6fr) minmax(0,1fr)}
#sheet.ro-tree-sheet .tree-detail{padding:10px 12px;font-size:12px;line-height:1.6}
#sheet.ro-tree-sheet .tree-detail h3{margin:2px 0}
#sheet.ro-tree-sheet .tree-tools{top:6px;left:6px;gap:3px;max-width:calc(100% - 12px)}
#sheet.ro-tree-sheet .tree-tools .btn{padding:4px 6px;font-size:11.5px;min-height:30px}
#sheet.ro-tree-sheet .tree-zoom-val{min-width:38px;text-align:center;font-size:11px}
#sheet.ro-tree-sheet .tree-legend{display:none;bottom:6px;left:6px;font-size:11px}
#sheet.ro-tree-sheet .tree-map-wrap.v96leg .tree-legend{display:flex}
#sheet.ro-tree-sheet .tree-footer{flex-wrap:nowrap;gap:6px;padding:8px 10px}
#sheet.ro-tree-sheet .tree-footer .btn{padding:6px 8px;font-size:12px;white-space:nowrap;min-width:0}
#sheet.ro-tree-sheet .tree-footer .btn.primary{flex:1}
}
.v96legBtn{display:none}
@media ${V96.mob}{.v96legBtn{display:inline-flex}}`;
  document.head.appendChild(st);
}
function v96Decorate() {
  const tools = document.querySelector("#sheet.ro-tree-sheet .tree-tools"),
    wrap = document.querySelector("#sheet.ro-tree-sheet .tree-map-wrap");
  if (!tools || !wrap || !wrap.querySelector(".tree-legend")) return;
  wrap.classList.toggle("v96leg", v96Legend);
  if (!tools.querySelector(".v96legBtn")) {
    const b = document.createElement("button");
    b.className = "btn sm v96legBtn";
    b.type = "button";
    b.textContent = "圖例";
    b.setAttribute("aria-pressed", String(v96Legend));
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      v96Legend = !v96Legend;
      wrap.classList.toggle("v96leg", v96Legend);
      b.setAttribute("aria-pressed", String(v96Legend));
    });
    tools.appendChild(b);
  }
  const hint = tools.querySelector(".tree-pan-hint");
  if (hint) hint.textContent = "按住拖曳移動・滾輪或雙指縮放";
}
function v96RenderInstall() {
  const rr = roTreeRender;
  roTreeRender = function (...a) {
    const r = rr.apply(this, a);
    try {
      v96Decorate();
    } catch (e) {}
    return r;
  };
}

function v96HelpInstall() {
  if (typeof HELP === "undefined") return;
  for (const hv of Object.values(HELP))
    for (const r of Array.isArray(hv?.[1]) ? hv[1] : [])
      if (Array.isArray(r) && typeof r[1] === "string") r[1] = r[1].replace(/50%～300%/g, "50%～1000%");
}

function v96Install() {
  if (typeof roTreeRender !== "function" || typeof document === "undefined") return;
  v96CssInstall();
  v96PanInstall();
  v96ButtonsInstall();
  v96OpenInstall();
  v96RenderInstall();
  v96HelpInstall();
}
if (typeof roV4Install === "function") {
  const r4v96 = roV4Install;
  roV4Install = function () {
    r4v96();
    v96Install();
  };
}
