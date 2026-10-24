/* 流浪仙境 v1.0.14（內部 v10.4）：傷害數字縮小、改用 RO 風格字模圖
   1. 數字與暴擊框縮成 v1.0.13 的一半（動畫不變：從大縮小、往右上彈起後落下）
   2. 改用 assets/ro-ui/ 的字模圖（白字＋深色描邊、紅橘暴擊爆炸框、Miss），紅字、綠字與持續傷害顏色以色彩相乘染色
   3. 圖檔還沒載入或載入失敗時，沿用 v1.0.13 的點陣字（同樣縮成一半） */

const V104 = {
  // 開場時字模整格（32 px）對應的高度（世界座標）
  h: { dmg: 8.3, crit: 9.6, heal: 7.2 },
  missH: 6.4, // Miss 圖（24 px 高）
  cw: 24,
  ch: 32,
  chars: "0123456789.KMBT",
  ov: 2, // 相鄰字的描邊重疊（原圖像素）
  src: {
    dig: "assets/ro-ui/v1014_digits.png",
    miss: "assets/ro-ui/v1014_miss.png",
    crit: "assets/ro-ui/v1014_crit.png",
  },
};
// 點陣字備援也縮成一半
V103.p *= 0.5;
V103.pCrit *= 0.5;
V103.pHeal *= 0.5;
V103.pMiss = 0.5;

const V104_IMG = {},
  V104_BX = [],
  V104_TINT = new Map();
function v104Measure(im) {
  const n = V104.chars.length;
  for (let i = 0; i < n; i++) V104_BX[i] = [1, V104.cw - 1];
  try {
    const c = v103Canvas(im.width, im.height),
      x = c.getContext("2d");
    x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, im.width, im.height).data;
    for (let i = 0; i < n; i++) {
      let a = V104.cw,
        b = -1;
      for (let xx = 0; xx < V104.cw; xx++) {
        const X = i * V104.cw + xx;
        for (let y = 0; y < im.height; y++)
          if (d[(y * im.width + X) * 4 + 3] > 8) {
            a = Math.min(a, xx);
            b = Math.max(b, xx);
            break;
          }
      }
      if (b >= a) V104_BX[i] = [a, b + 1];
    }
  } catch (e) {} // 直接開啟檔案（file://）時讀不到像素，改用固定字寬
}
function v104Load() {
  if (typeof Image === "undefined") return;
  for (const [k, src] of Object.entries(V104.src)) {
    const im = new Image();
    im.onload = () => {
      if (k === "dig") {
        if (im.width < V104.cw * V104.chars.length) return;
        v104Measure(im);
      }
      V104_IMG[k] = im;
    };
    im.src = src;
  }
}
// 白字染色：色彩相乘（白→指定色，深色描邊不變），再套回原本的透明度
function v104Tint(k, col) {
  const im = V104_IMG[k];
  if (!im) return null;
  if (!col || String(col).toLowerCase() === "#ffffff") return im;
  const key = k + col;
  let c = V104_TINT.get(key);
  if (c) return c;
  c = v103Canvas(im.width, im.height);
  const x = c.getContext("2d");
  x.drawImage(im, 0, 0);
  x.globalCompositeOperation = "multiply";
  x.fillStyle = col;
  x.fillRect(0, 0, im.width, im.height);
  x.globalCompositeOperation = "destination-in";
  x.drawImage(im, 0, 0);
  V104_TINT.set(key, c);
  return c;
}
// 點陣字（備援）
function v104Pixel(c, a, x0, y0, p, perc) {
  const gs = [...a.txt].map((ch) => v103Glyph(ch, a.col)).filter(Boolean);
  if (!gs.length) return;
  const w = (gs.reduce((s, g) => s + g.w - 1, 0) + 1) * p,
    h = 9 * p;
  let x = clamp(x0 - w / 2, 1, G.W - w - 1);
  const y = Math.max(y0 - h / 2, (G.top || 0) + 1);
  c.globalAlpha = Math.max(0, Math.min(1, 2 * (1 - perc)));
  if (a.crit) {
    const b = v103Burst(),
      rx = w / 2 + 4 * p,
      ry = h / 2 + 4.5 * p;
    c.imageSmoothingEnabled = true;
    c.drawImage(b.c, x + w / 2 - rx * 1.08, y + h / 2 - ry * 1.08, rx * 2.16, ry * 2.16);
  }
  c.imageSmoothingEnabled = p < 1;
  for (const g of gs) {
    c.drawImage(g.c, x, y, g.w * p, h);
    x += (g.w - 1) * p;
  }
}

function v104Install() {
  v104Load();
  // 取代 v1.0.13 的繪製（數字的種類判斷、生命週期不變）
  v103Draw = function (c) {
    const L = G?.v103n;
    if (!L || !L.length) return;
    const now = G.t;
    for (let i = L.length - 1; i >= 0; i--) if (now - L[i].t0 > V103.dur[L[i].k] || now < L[i].t0) L.splice(i, 1);
    if (!L.length) return;
    const dig = V104_IMG.dig;
    c.save();
    for (const a of L) {
      if (S.set.nonum && a.num) continue;
      const perc = Math.min(1, (now - a.t0) / V103.dur[a.k]);
      let f, dx = 0, dz;
      if (a.k === "dmg") {
        f = 1 - perc;
        dx = perc * V103.drift;
        dz = (2 + Math.sin(Math.PI * 1.5 * perc) * 5) * V103.u;
      } else if (a.k === "heal") {
        f = Math.max(1 - perc * 2, 0.27);
        dz = (2 + (perc < 0.4 ? 0 : (perc - 0.4) * 5)) * V103.u;
      } else {
        f = 1;
        dz = (1.2 + perc * 7) * V103.u;
      }
      const cx = a.x + dx,
        cy = a.y - dz;
      // Miss
      if (a.k === "miss") {
        const im = V104_IMG.miss;
        if (!im) {
          v104Pixel(c, a, cx, cy, V103.pMiss, perc);
          continue;
        }
        const H = V104.missH,
          W = (H * im.width) / im.height;
        c.globalAlpha = Math.max(0, 1 - perc);
        c.imageSmoothingEnabled = true;
        c.drawImage(v104Tint("miss", a.col === "#c8d0e0" ? null : a.col) || im, clamp(cx - W / 2, 1, G.W - W - 1), Math.max(cy - H / 2, (G.top || 0) + 5), W, H);
        continue;
      }
      if (!dig) {
        const p = (a.k === "heal" ? V103.pHeal : a.crit ? V103.pCrit : V103.p) * f;
        if (p >= 0.05) v104Pixel(c, a, cx, cy, p, perc);
        continue;
      }
      const H = (a.k === "heal" ? V104.h.heal : a.crit ? V104.h.crit : V104.h.dmg) * f;
      if (H < 0.6) continue;
      const s = H / V104.ch,
        idx = [...a.txt].map((ch) => V104.chars.indexOf(ch)).filter((i) => i >= 0);
      if (!idx.length) continue;
      // 小數點兩側不重疊，避免被數字蓋住
      const dot = V104.chars.indexOf("."),
        ovs = idx.map((i, k) => (k === idx.length - 1 || i === dot || idx[k + 1] === dot ? 0 : V104.ov));
      const w = idx.reduce((t, i, k) => t + (V104_BX[i][1] - V104_BX[i][0]) - ovs[k], 0) * s;
      let x = clamp(cx - w / 2, 1, G.W - w - 1);
      const y = Math.max(cy - H / 2, (G.top || 0) + 5 + (a.crit ? H * 0.3 : 0)); // 不被上方狀態列擋住
      c.globalAlpha = Math.max(0, Math.min(1, 2 * (1 - perc)));
      c.imageSmoothingEnabled = true;
      if (a.crit) {
        const b = V104_IMG.crit;
        if (b) {
          const bh = H * 1.6,
            bw = Math.max(w / 0.62, bh * 1.45);
          c.drawImage(b, x + w / 2 - bw / 2, y + H * 0.55 - bh / 2, bw, bh);
        } else {
          const bb = v103Burst(),
            rx = w / 2 + H * 0.35,
            ry = H * 0.75;
          c.drawImage(bb.c, x + w / 2 - rx, y + H * 0.55 - ry, rx * 2, ry * 2);
        }
      }
      const img = v104Tint("dig", a.col) || dig;
      idx.forEach((i, k) => {
        const [b0, b1] = V104_BX[i],
          bw = b1 - b0;
        c.drawImage(img, i * V104.cw + b0, 0, bw, V104.ch, x, y, bw * s, H);
        x += (bw - ovs[k]) * s;
      });
    }
    c.restore();
  };
}
if (typeof roV4Install === "function") {
  const r4v104 = roV4Install;
  roV4Install = function () {
    r4v104();
    v104Install();
  };
}
