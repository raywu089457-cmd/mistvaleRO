/* 流浪仙境 v1.0.13（內部 v10.3）：傷害數字改為 RO 風格
   參考 RO 原版的傷害數字（數字點陣為本遊戲自繪，不使用原版圖檔）：
   ・打怪傷害：白色粗體點陣數字＋深色外框；從大縮小、往右上斜飛、先彈起再落下，1.5 秒淡出
   ・受到傷害：紅色，動畫同上
   ・暴擊：數字後面加紅色鋸齒爆炸框
   ・補血：綠色，先大後小、停一下再往上飄
   ・MISS：小字往上飄 0.8 秒
   ・中毒、燃燒等持續傷害與護盾吸收沿用原本顏色，只換字型與動畫；技能名等文字提示維持原樣 */

const V103 = {
  max: 48, // 同時顯示的數字上限
  cell: 10, // 字模快取：每個點陣格的像素
  out: "#1b1020", // 外框
  white: "#ffffff",
  red: "#ff2a2a", // 受到傷害
  green: "#3cff5a", // 補血
  p: 1.55, // 一般傷害：開場時每個點陣格的大小（世界座標）
  pCrit: 1.8,
  pHeal: 1.35,
  pMiss: 0.62,
  dur: { dmg: 1.5, heal: 1.5, miss: 0.8 },
  u: 3, // RO 的 1 格 ≈ 3 世界座標
  drift: 16, // 往右飛的距離
};
// 5×7 點陣（每列一個字串，X＝填色）；寬度依字串長度
const V103_GLYPH = {
  0: [".XXX.", "XX.XX", "XX.XX", "XX.XX", "XX.XX", "XX.XX", ".XXX."],
  1: ["..XX.", ".XXX.", "..XX.", "..XX.", "..XX.", "..XX.", ".XXXX"],
  2: [".XXX.", "XX.XX", "...XX", "..XX.", ".XX..", "XX...", "XXXXX"],
  3: ["XXXX.", "...XX", "...XX", ".XXX.", "...XX", "...XX", "XXXX."],
  4: ["...XX", "..XXX", ".X.XX", "X..XX", "XXXXX", "...XX", "...XX"],
  5: ["XXXXX", "XX...", "XXXX.", "...XX", "...XX", "XX.XX", ".XXX."],
  6: [".XXX.", "XX...", "XX...", "XXXX.", "XX.XX", "XX.XX", ".XXX."],
  7: ["XXXXX", "...XX", "..XX.", "..XX.", ".XX..", ".XX..", ".XX.."],
  8: [".XXX.", "XX.XX", "XX.XX", ".XXX.", "XX.XX", "XX.XX", ".XXX."],
  9: [".XXX.", "XX.XX", "XX.XX", ".XXXX", "...XX", "...XX", ".XXX."],
  ".": ["..", "..", "..", "..", "..", "XX", "XX"],
  K: ["XX.XX", "XX.XX", "XXXX.", "XXX..", "XXXX.", "XX.XX", "XX.XX"],
  M: ["X...X", "XX.XX", "XXXXX", "XXXXX", "XX.XX", "XX.XX", "XX.XX"],
  B: ["XXXX.", "XX.XX", "XX.XX", "XXXX.", "XX.XX", "XX.XX", "XXXX."],
  T: ["XXXXXX", "..XX..", "..XX..", "..XX..", "..XX..", "..XX..", "..XX.."],
  I: ["XXXX", ".XX.", ".XX.", ".XX.", ".XX.", ".XX.", "XXXX"],
  S: [".XXXX", "XX...", "XX...", ".XXX.", "...XX", "...XX", "XXXX."],
};
const V103_CACHE = new Map();
const v103Canvas = (w, h) => {
  if (typeof cnv === "function") return cnv(w, h);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
};
// 單一字元的快取圖（含 1 格外框）
function v103Glyph(ch, col) {
  const k = ch + col;
  let g = V103_CACHE.get(k);
  if (g) return g;
  const rows = V103_GLYPH[ch];
  if (!rows) return null;
  const C = V103.cell,
    w = rows[0].length,
    c = v103Canvas((w + 2) * C, 9 * C),
    x = c.getContext("2d");
  x.fillStyle = V103.out;
  rows.forEach((r, j) => [...r].forEach((v, i) => v === "X" && x.fillRect(i * C, j * C, 3 * C, 3 * C)));
  x.fillStyle = col;
  rows.forEach((r, j) => [...r].forEach((v, i) => v === "X" && x.fillRect((i + 1) * C, (j + 1) * C, C, C)));
  g = { c, w: w + 2 };
  V103_CACHE.set(k, g);
  return g;
}
// 暴擊的紅色鋸齒爆炸框
let V103_BURST = null;
function v103Burst() {
  if (V103_BURST) return V103_BURST;
  const R = 48,
    c = v103Canvas(2 * R + 8, 2 * R + 8),
    x = c.getContext("2d"),
    n = 14;
  x.translate(R + 4, R + 4);
  x.beginPath();
  for (let i = 0; i < 2 * n; i++) {
    const a = (i / (2 * n)) * Math.PI * 2 - Math.PI / 2,
      r = i % 2 ? R * (0.6 + 0.06 * ((i * 7) % 3)) : R * (0.92 + 0.08 * ((i * 5) % 2));
    i ? x.lineTo(Math.cos(a) * r, Math.sin(a) * r) : x.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  x.closePath();
  const gr = x.createRadialGradient(0, 0, R * 0.1, 0, 0, R);
  gr.addColorStop(0, "#ff9a4a");
  gr.addColorStop(0.45, "#f0302a");
  gr.addColorStop(1, "#b80c1c");
  x.fillStyle = gr;
  x.fill();
  x.lineWidth = 4;
  x.strokeStyle = "#4a0612";
  x.stroke();
  V103_BURST = { c, R: R + 4 };
  return V103_BURST;
}

const V103_NUM = /^[\d.]+[KMBT]?$/;
// 判斷 num() 的種類；回傳 null 表示維持原本的文字顯示
function v103Kind(s, col, big) {
  if (typeof s === "number") {
    if (!isFinite(s)) return null;
    if (col === "#ff5a6a") return { k: "dmg", col: V103.red, crit: !!big };
    if (col === "#ffffff" || col === "#ffd84a") return { k: "dmg", col: V103.white, crit: !!big };
    return { k: "dmg", col: col || V103.white, crit: !!big };
  }
  if (typeof s !== "string") return null;
  if (s === "MISS") return { k: "miss", col: col || V103.white };
  if (s[0] === "+" && V103_NUM.test(s.slice(1))) return { k: "heal", col: col === "#7dffc8" ? V103.green : col || V103.green, txt: s.slice(1) };
  if (V103_NUM.test(s)) return { k: "dmg", col: col || V103.white };
  return null;
}

function v103Draw(c) {
  const L = G?.v103n;
  if (!L || !L.length) return;
  const now = G.t;
  for (let i = L.length - 1; i >= 0; i--) if (now - L[i].t0 > V103.dur[L[i].k] || now < L[i].t0) L.splice(i, 1);
  if (!L.length) return;
  c.save();
  for (const a of L) {
    if (S.set.nonum && a.num) continue;
    const perc = Math.min(1, (now - a.t0) / V103.dur[a.k]);
    let p, dx = 0, dz;
    if (a.k === "dmg") {
      p = (a.crit ? V103.pCrit : V103.p) * (1 - perc);
      dx = perc * V103.drift;
      dz = (2 + Math.sin(Math.PI * 1.5 * perc) * 5) * V103.u;
    } else if (a.k === "heal") {
      p = V103.pHeal * Math.max(1 - perc * 2, 0.27);
      dz = (2 + (perc < 0.4 ? 0 : (perc - 0.4) * 5)) * V103.u;
    } else {
      p = V103.pMiss;
      dz = (1.2 + perc * 7) * V103.u;
    }
    if (p < 0.05) continue;
    const gs = [...a.txt].map((ch) => v103Glyph(ch, a.col)).filter(Boolean);
    if (!gs.length) continue;
    // 字距：外框重疊 1 格
    const w = (gs.reduce((s, g) => s + g.w - 1, 0) + 1) * p,
      h = 9 * p;
    let x = clamp(a.x + dx - w / 2, 1, G.W - w - 1),
      y = Math.max(a.y - dz - h / 2, (G.top || 0) + 1); // 不飄進上方狀態列
    // 前半段不透明，後半段淡出
    c.globalAlpha = Math.max(0, Math.min(1, 2 * (1 - perc)));
    if (a.crit) {
      c.imageSmoothingEnabled = true;
      const b = v103Burst(),
        rx = w / 2 + 4 * p,
        ry = h / 2 + 4.5 * p;
      c.drawImage(b.c, x + w / 2 - rx * 1.08, y + h / 2 - ry * 1.08, rx * 2.16, ry * 2.16);
    }
    c.imageSmoothingEnabled = p < 1; // 點陣數字保持銳利；縮得很小時改平滑，避免缺筆
    for (const g of gs) {
      c.drawImage(g.c, x, y, g.w * p, h);
      x += (g.w - 1) * p;
    }
  }
  c.restore();
}

function v103Install() {
  if (typeof num !== "function") return;
  const n0 = num;
  num = function (x, y, s, col, big) {
    const k = v103Kind(s, col, big);
    if (!k || !G) return n0.apply(this, arguments);
    if (typeof s !== "string" && S.set.nonum) return;
    const L = (G.v103n ||= []);
    L.push({ x: x + rf(-3, 3), y, txt: k.txt ?? (typeof s === "string" ? s : fmt(s)), col: k.col, k: k.k, crit: k.crit, num: typeof s !== "string", t0: G.t });
    if (L.length > V103.max) L.shift();
  };
  // 在原本畫數字的位置之前畫（技能名等文字提示仍在最上層）
  if (typeof drawGlow === "function") {
    const dg = drawGlow;
    drawGlow = function (c, ...r) {
      const out = dg.call(this, c, ...r);
      try {
        v103Draw(c);
      } catch (e) {}
      return out;
    };
  }
}
if (typeof roV4Install === "function") {
  const r4v103 = roV4Install;
  roV4Install = function () {
    r4v103();
    v103Install();
  };
}
