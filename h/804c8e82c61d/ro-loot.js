/* RO-style ground loot: dropped things show their RO client item icon. */
"use strict";
const roDropImages = {};
// Icon for a ground drop, matching what the item becomes in the bag.
function roDropItemId(d) {
  if (d.it) return roItemId(iconKey(d.it));
  if (d.mat) return { x: 984, i: 985, p: 994, s: 715, r: 756, c: 757, m: 7220, h: 995 }[MATS[d.mat]?.f] || 984;
  if (d.gm) return d.col === SX_COL ? 715 : d.tier >= 4 || d.gm.mu?.multi ? 716 : 717;
  if (d.sl) return 618;
  if (d.tk != null) return 714;
  if (d.fr != null) return 603;
  if (d.ssf != null) return 617;
  if (d.mk) return 616;
  return 670;
}
function roDropImage(id) {
  const loaded = RO.images[roItemIcon(id)];
  if (loaded) return loaded;
  const src = RO.root + "items/" + id + ".png";
  if (roDropImages[src] === undefined) {
    const im = new Image();
    roDropImages[src] = null;
    im.onload = () => (roDropImages[src] = im);
    im.onerror = () => (roDropImages[src] = false);
    im.src = src;
  }
  return roDropImages[src] || null;
}
const roDropRank = (d) =>
  (d.it || d.sl)?.my ? 6 : d.it?.uq ? 5 : d.tier || 0;
function roDropSparkle(c, x, y, r, color, phase) {
  const s = (Math.sin(phase) + 1) / 2;
  if (s < 0.25) return;
  c.save();
  c.globalAlpha = s;
  c.fillStyle = color;
  c.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4,
      len = i % 2 ? r * 0.28 : r * s;
    c.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
  }
  c.closePath();
  c.fill();
  c.restore();
}
drawLoot = function (c) {
  for (const d of G.drops) {
    const rank = roDropRank(d),
      big = !!(d.it || d.sl),
      size = big ? 10 : 8,
      bob = d.landed ? Math.sin(G.t * 2.6 + d.x) * 0.5 : 0,
      x = d.x,
      y = d.y - d.z + bob,
      im = roDropImage(roDropItemId(d));
    drawShadow(c, d.x, d.y + 0.6, size * 0.34);
    c.save();
    // Higher rarities get a soft coloured halo on the ground, like a lit spot.
    if (rank >= 2) {
      const g = c.createRadialGradient(d.x, d.y, 0, d.x, d.y, size * 0.9);
      g.addColorStop(0, d.col || "#fff");
      g.addColorStop(1, "rgba(255,255,255,0)");
      c.globalAlpha = 0.18 + 0.1 * Math.min(4, rank - 2) + 0.06 * Math.sin(G.t * 3);
      c.fillStyle = g;
      c.beginPath();
      c.ellipse(d.x, d.y, size * 0.9, size * 0.38, 0, 0, Math.PI * 2);
      c.fill();
    }
    // Mythic and unique drops: a faint light column so they are seen from afar.
    if (rank >= 5) {
      const h = 26,
        g = c.createLinearGradient(0, d.y - h, 0, d.y);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(1, d.col || "#ffd84a");
      c.globalAlpha = 0.28 + 0.1 * Math.sin(G.t * 4);
      c.fillStyle = g;
      c.fillRect(d.x - 2.2, d.y - h, 4.4, h);
    }
    c.restore();
    if (im) c.drawImage(im, x - size / 2, y - size, size, size);
    else {
      c.fillStyle = d.col || "#d8c08a";
      c.beginPath();
      c.arc(x, y - size / 2, size * 0.3, 0, Math.PI * 2);
      c.fill();
    }
    if (rank >= 3)
      roDropSparkle(
        c,
        x + size * 0.32,
        y - size * 0.86,
        rank >= 5 ? 2.6 : 1.9,
        rank >= 5 ? "#fff6c8" : "#ffffff",
        G.t * 3.2 + d.x * 0.7,
      );
  }
  // RO has no experience orbs; experience is granted on the kill itself.
};
// The engine's tall loot beams are an ARPG convention; RO items just sit on the
// ground, so keep the glow pass for particles and map light only.
const roGlowPass = drawGlow;
drawGlow = function (c) {
  const drops = G.drops;
  G.drops = [];
  try {
    roGlowPass(c);
  } finally {
    G.drops = drops;
  }
};
// After salvaging from the bag, select the next item in the order shown on
// screen (current filter and sort), not the next entry of the raw bag array.
const roSalvDo = salvDo;
salvDo = function (u) {
  const shown = bagList(),
    i = shown.findIndex((t) => t.u === +u);
  roSalvDo(u);
  if (i < 0) return;
  const left = (t) => S.bag.includes(t),
    next =
      shown.slice(i + 1).find(left) ||
      shown
        .slice(0, i)
        .reverse()
        .find(left);
  ui.sel = next?.u ?? null;
};
