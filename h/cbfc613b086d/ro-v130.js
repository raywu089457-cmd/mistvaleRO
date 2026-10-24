/* 流浪仙境 v1.3.0：排行榜快照的人物圖放大
   ・無限武鬥場排行的快照、隊伍排行的隊長：人物圖放大約 2 倍（原始圖 ×1.24，原本 ×0.62），畫布 220×170（隊伍排行 200×155），
     仍用像素方式繪製；寵物同比例放大，站在人物右側
   ・手機等窄畫面：畫布依寬度縮小，不超出視窗（之後加入造型時辨識度較高） */

const V1233 = { k: 1.24, W: 220, H: 170, sW: 200, sH: 155 };

function v1233Install() {
  if (typeof v1216Html !== "function" || typeof v1216Paint !== "function") return;
  // 畫布尺寸
  const vh = v1216Html;
  v1216Html = function (look, opt = {}, ...a) {
    const h = vh.call(this, look, opt, ...a);
    if (!h) return h;
    return h.replace(/<canvas class="v1216cv" width="\d+" height="\d+"/, `<canvas class="v1216cv v1233cv" width="${opt.sm ? V1233.sW : V1233.W}" height="${opt.sm ? V1233.sH : V1233.H}"`);
  };
  // 繪製：人物 ×1.24、寵物同比例放大
  v1216Paint = function (cv) {
    if (!cv || !cv.isConnected) return;
    let look = null;
    try {
      look = JSON.parse(cv.dataset.look || "null");
    } catch (e) {}
    if (!look) return;
    const c = cv.getContext("2d"),
      W = cv.width,
      H = cv.height,
      gy = H - 14,
      redraw = () => v1216Paint(cv);
    c.clearRect(0, 0, W, H);
    c.imageSmoothingEnabled = false;
    c.fillStyle = "rgba(0,0,0,.18)";
    c.beginPath();
    c.ellipse(W * 0.38, gy, 34, 9, 0, 0, Math.PI * 2);
    c.fill();
    const def = v1216CharDef(look);
    if (def && v1216Img(def.file, redraw)) {
      const im = RO.images[RO.root + def.file],
        k = V1233.k;
      c.drawImage(im, def.ox || 0, def.oy || 0, def.frameWidth, def.frameHeight, Math.round(W * 0.38 - def.anchor[0] * k), Math.round(gy - def.anchor[1] * k), Math.round(def.frameWidth * k), Math.round(def.frameHeight * k));
    }
    const pk = look.pet && look.pet.k;
    const d = pk && typeof V1215_SPR !== "undefined" && V1215_SPR[pk];
    if (d && v1216Img(d.file, redraw)) {
      const im = RO.images[RO.root + d.file],
        f = d.states.idle,
        k = Math.min(1.8, (typeof v1215Scale === "function" ? v1215Scale(pk) : 0.3) * 4.4);
      c.fillStyle = "rgba(0,0,0,.18)";
      c.beginPath();
      c.ellipse(W * 0.79, gy, 18, 5, 0, 0, Math.PI * 2);
      c.fill();
      c.drawImage(im, f.ox || 0, f.oy || 0, f.frameWidth, f.frameHeight, Math.round(W * 0.79 - f.anchor[0] * k), Math.round(gy - f.anchor[1] * k), Math.round(f.frameWidth * k), Math.round(f.frameHeight * k));
    }
  };
  if (typeof document !== "undefined" && !document.getElementById("v1233css")) {
    const st = document.createElement("style");
    st.id = "v1233css";
    st.textContent = `.v1216look canvas.v1233cv{max-width:min(100%,62vw);height:auto;flex:0 1 auto}.v1216look{flex-wrap:wrap}`;
    document.head.appendChild(st);
  }
}

if (typeof roV4Install === "function") {
  const r4v1233 = roV4Install;
  roV4Install = function () {
    r4v1233.apply(this, arguments);
    try {
      v1233Install();
    } catch (e) {
      console.error("v1233", e);
    }
  };
}
