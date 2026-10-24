/* Original season creatures. Canvas artwork; no borrowed monster sprites.
 * Public renderer: roDrawSeasonBoss(context, mob, scale = 1).
 * mob.god selects 0 mushroom colony, 1 ancient deer, 2 furnace beetle.
 * Reads world position, RO direction, time and lunge only; never mutates state.
 */
const RO_SEASON_BOSS_ART = Object.freeze([
  { name: "菌冠波利母體", height: 35, ecosystem: "潮濕林地・菌絲共生" },
  { name: "古林鹿靈", height: 41, ecosystem: "古木森林・月泉守護" },
  { name: "熔殼機械甲蟲", height: 33, ecosystem: "廢棄礦坑・熔爐寄生" },
]);

const roSeasonArt = (() => {
  const paths = new Map();
  function path(c, d, fill, stroke = "#524e49", width = 0.55) {
    let p = paths.get(d);
    if (!p) {
      p = new Path2D(d);
      paths.set(d, p);
      // Animated limbs create changing paths; bound the cache for long sessions.
      if (paths.size > 256) paths.delete(paths.keys().next().value);
    }
    if (fill) {
      c.fillStyle = fill;
      c.fill(p);
    }
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = width;
      c.stroke(p);
    }
  }
  function oval(c, x, y, rx, ry, fill, stroke = null, width = 0.5) {
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    if (fill) {
      c.fillStyle = fill;
      c.fill();
    }
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = width;
      c.stroke();
    }
  }
  function gradient(c, x, y, h, top, bottom) {
    const g = c.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    return g;
  }
  function line(c, d, color, width = 0.6) {
    path(c, d, null, color, width);
  }
  function leaf(c, x, y, angle, size, light = false) {
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    c.scale(size, size);
    path(
      c,
      "M0 0 Q-4 -3 -1 -7 Q4 -4 0 0Z",
      light ? "#bad6a1" : "#6f9976",
      "#547b65",
      0.45,
    );
    line(c, "M0 0 L-1 -6", "#d0dfab", 0.35);
    c.restore();
  }
  function mushroom(c, x, y, s, color) {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    path(c, "M-1 0 L-1.8 -7 Q0 -9 1.7 -7 L1.2 0Z", "#ede7bc", "#8c8368");
    path(c, "M-6 -6 Q-5 -13 0 -13 Q5 -13 6 -6 Q1 -3 -6 -6Z", color, "#705a67");
    oval(c, -2, -9, 1.15, 0.7, "#fff0d3");
    oval(c, 2.1, -8, 0.8, 0.55, "#fff0d3");
    line(c, "M-5 -6 Q0 -4.8 5 -6", "#f4d4bf", 0.5);
    c.restore();
  }
  function eye(c, x, y, back, iris = "#483448") {
    if (back) return;
    oval(c, x, y, 1.3, 1.7, iris, "#3d3438", 0.35);
    oval(c, x - 0.35, y - 0.6, 0.42, 0.55, "#fff7df");
  }
  function colony(c, a) {
    const bounce = Math.sin(a.t * (a.moving ? 8 : 2.4));
    c.translate(a.attack * 2, -Math.max(0, bounce) * (a.moving ? 1.4 : 0.35));
    c.scale(1 + a.attack * 0.09, 1 - a.attack * 0.04);
    // Roots and small satellite mushrooms give the colony a readable silhouette.
    path(
      c,
      "M-9 -5 Q-13 -2 -17 -1 Q-12 0 -8 -1 M7 -4 Q13 -1 16 -2 Q12 2 6 0",
      "#879772",
      "#64765f",
    );
    mushroom(c, -11, -3, 0.62, "#b38195");
    mushroom(c, 12, -3, 0.48, "#ba9ac4");
    path(
      c,
      "M-13 -9 Q-14 -23 -1 -26 Q11 -26 14 -12 Q17 -2 7 -1 Q0 2 -9 -1 Q-14 -2 -13 -9Z",
      gradient(c, 0, -25, 25, "#d1d7b3", "#87a793"),
      "#617f71",
      0.75,
    );
    path(
      c,
      "M-10 -11 Q-8 -20 -2 -22 Q5 -25 9 -18 Q3 -19 1 -12 Q-4 -8 -10 -11Z",
      "#e2e4c6",
      null,
    );
    oval(c, -7, -4, 3.3, 1.2, "#a8b89a");
    oval(c, 7, -3.8, 3.1, 1.1, "#799987");
    // Wide mottled cap, scalloped cream underside and a living moss crown.
    path(
      c,
      "M-16 -22 Q-14 -31 -5 -33 Q6 -36 14 -27 L17 -22 Q9 -17 0 -19 Q-9 -17 -16 -22Z",
      gradient(c, 0, -34, 15, "#d7afb9", "#996b8e"),
      "#76596d",
      0.75,
    );
    path(
      c,
      "M-16 -22 Q-9 -21 -6 -23 Q-1 -20 3 -22 Q9 -20 17 -22 Q11 -17 0 -19 Q-10 -17 -16 -22Z",
      "#e8d4bd",
      "#9b8b78",
      0.4,
    );
    [
      [-9, -26, 2.4, 1.2],
      [-3, -30, 2.8, 1.3],
      [7, -27, 2.5, 1.4],
      [1, -24, 1.6, 0.9],
      [11, -24, 1.1, 0.8],
    ].forEach((v) => oval(c, ...v, "#f5dfcc"));
    line(
      c,
      "M-13 -23 L-10 -20 M-7 -22 L-6 -19 M0 -22 L0 -19 M8 -22 L7 -19 M13 -22 L11 -20",
      "#bda48d",
      0.35,
    );
    leaf(c, -5, -31, -0.8, 0.7);
    leaf(c, -2, -32, 0.3, 0.65, true);
    leaf(c, 7, -28, 1.0, 0.55);
    const face = a.side * 2;
    eye(c, -3 + face, -12, a.back);
    eye(c, 3.5 + face, -12, a.back);
    if (!a.back) {
      line(
        c,
        `M${face - 1} -8 Q${face + 1} ${-6 - a.attack * 2} ${face + 3} -8`,
        "#647365",
        0.65,
      );
      oval(c, -7 + face, -9, 1.8, 0.65, "#d3b6a4");
      oval(c, 6 + face, -9, 1.6, 0.65, "#d3b6a4");
    } else {
      mushroom(c, 1, -7, 0.5, "#b389ab");
      leaf(c, -5, -12, -1.3, 0.65);
    }
    for (let i = 0; i < 4; i++) {
      const phase = (a.t * 0.5 + i / 4) % 1;
      c.globalAlpha *= 0.8;
      oval(
        c,
        Math.sin(i * 2.1 + a.t) * 13,
        -22 - phase * 15,
        0.55 + phase * 0.2,
        0.55 + phase * 0.2,
        "#e7efb1",
      );
      c.globalAlpha /= 0.8;
    }
  }
  function deer(c, a) {
    const step = a.moving ? Math.sin(a.t * 9) * 1.7 : Math.sin(a.t * 2) * 0.15;
    c.translate(a.attack * 2, -Math.abs(step) * 0.35);
    // Far antler and legs behind the warm ivory body.
    line(
      c,
      "M4 -25 Q5 -32 3 -37 M3 -35 L0 -37 M4 -32 L8 -35 L8 -39",
      "#728e88",
      1.5,
    );
    path(
      c,
      `M-9 -14 L${-9 - step} -3 L${-5 - step} -2 L-4 -14Z M5 -14 L${7 + step} -4 L${10 + step} -3 L9 -15Z`,
      "#9eaca0",
      "#677c74",
    );
    c.save();
    c.translate(-12, -16);
    c.rotate(Math.sin(a.t * 3) * 0.12);
    path(c, "M0 1 Q-7 -1 -7 -6 Q-3 -7 2 -2Z", "#e9e7c8", "#89988b");
    c.restore();
    path(
      c,
      "M-13 -15 Q-13 -24 -4 -23 Q2 -25 7 -20 Q12 -18 11 -11 Q6 -6 -6 -9 Q-13 -9 -13 -15Z",
      gradient(c, 0, -23, 17, "#ebe8cb", "#b3c3ad"),
      "#6f897b",
      0.7,
    );
    path(
      c,
      `M-10 -12 Q-10 -7 ${-11 + step} -2 L${-6 + step} -2 L-4 -12 M3 -11 L${3 - step} -1 L${7 - step} -1 L9 -13`,
      "#d7dec1",
      "#7c8e7b",
      0.65,
    );
    line(
      c,
      `M${-11 + step} -2 L${-6 + step} -2 M${3 - step} -1 L${7 - step} -1`,
      "#5f746a",
      1.5,
    );
    // Pear-shaped neck, long ears and muzzle facing toward its target.
    path(
      c,
      "M2 -16 Q1 -25 5 -30 L11 -28 Q13 -23 11 -15 L8 -11Z",
      gradient(c, 0, -29, 18, "#e9ecd6", "#bac9b5"),
      "#789080",
      0.65,
    );
    c.save();
    c.translate(8, -28);
    c.rotate(a.attack * 0.24);
    path(
      c,
      "M-3 0 Q-7 -4 -6 -8 Q-1 -8 1 -3 M2 -2 Q5 -8 9 -7 Q9 -2 4 1",
      "#cfddbf",
      "#6a8779",
    );
    line(c, "M-4 -5 L-1 -2 M6 -5 L3 -2", "#9eb59e", 0.65);
    path(
      c,
      "M-3 -2 Q0 -6 5 -2 Q7 0 7 4 L10 6 Q7 10 2 7 L-2 4Z",
      gradient(c, 0, -4, 13, "#f0ecd2", "#beccb8"),
      "#6b8776",
      0.65,
    );
    if (!a.back) {
      eye(c, 4, 1, false, "#517e78");
      oval(c, 9, 5.5, 0.65, 0.5, "#617a6b");
    }
    // Branching antler canopy; leaf clusters replace a conventional crown.
    line(
      c,
      "M0 -3 Q-3 -8 -2 -13 M-2 -10 L-7 -12 L-9 -16 M-5 -11 L-5 -16 M-2 -12 L1 -16 M4 -3 Q5 -9 3 -12 M5 -8 L10 -10 L11 -15 M8 -9 L8 -14",
      "#6a877e",
      1.25,
    );
    line(c, "M0 -3 Q-2 -8 -2 -12 M4 -3 Q5 -8 3 -11", "#c1d3b7", 0.45);
    leaf(c, -8, -13, -1.0, 0.6);
    leaf(c, -5, -15, 0.3, 0.7, true);
    leaf(c, 1, -15, 0.7, 0.55);
    leaf(c, 9, -12, 0.9, 0.65, true);
    oval(c, 2, -7, 1.4, 1.9, "#a6e3d5", "#669a8d", 0.5);
    oval(c, 1.7, -7.5, 0.45, 0.7, "#e7fff0");
    c.restore();
    [
      [-8, -17],
      [-3, -19],
      [1, -17],
      [-6, -13],
    ].forEach(([x, y]) => oval(c, x, y, 0.8, 1.1, "#f8f0cf"));
    leaf(c, -7, -22, -1.2, 0.75);
    leaf(c, -3, -22, 0.8, 0.75, true);
    path(c, "M-5 -21 Q-4 -14 1 -13 L-1 -10 Q-8 -14 -8 -21Z", "#769b80", null);
    line(c, "M-5 -20 Q-4 -15 -1 -13", "#b9cf9f", 0.4);
    // Subtle spirit motes keep the silhouette visible without bright flashes.
    for (let i = 0; i < 3; i++)
      oval(
        c,
        -12 + Math.sin(a.t + i * 2) * 4,
        -16 - i * 4 + Math.cos(a.t * 1.2 + i),
        0.55,
        0.55,
        "#c8ead1",
      );
  }
  function beetle(c, a) {
    const step = a.moving ? Math.sin(a.t * 12) : Math.sin(a.t * 2) * 0.12;
    c.translate(a.attack * 1.5, -Math.abs(step) * 0.35);
    // Six articulated limbs with dark pivots and copper-edged plates.
    for (let side = -1; side <= 1; side += 2)
      for (let i = 0; i < 3; i++) {
        const y = -17 + i * 5,
          s = step * (i % 2 ? 1 : -1) * 1.5;
        line(
          c,
          `M${side * 8} ${y} L${side * (15 + (i % 2))} ${y + 2 + s} L${side * (17 - i)} ${y + 7 + s}`,
          "#4c5655",
          2.2,
        );
        line(
          c,
          `M${side * 8} ${y - 0.3} L${side * (15 + (i % 2))} ${y + 1.7 + s} L${side * (17 - i)} ${y + 6.5 + s}`,
          "#a58b6e",
          0.8,
        );
        oval(
          c,
          side * (15 + (i % 2)),
          y + 2 + s,
          1.25,
          1.3,
          "#73817d",
          "#4f5b59",
          0.5,
        );
      }
    path(
      c,
      "M-11 -10 Q-16 -24 -5 -28 Q4 -32 12 -24 Q17 -15 11 -6 Q0 2 -11 -10Z",
      gradient(c, 0, -29, 27, "#a6b4a3", "#566e68"),
      "#455c57",
      0.8,
    );
    // Segmented mineral shell and glowing furnace seam.
    path(
      c,
      "M0 -28 Q-5 -20 -4 -6 Q-12 -6 -13 -15 Q-14 -24 -5 -27Z",
      gradient(c, 0, -29, 23, "#b5bca3", "#778d7c"),
      "#53695e",
      0.7,
    );
    path(
      c,
      "M2 -29 Q14 -27 14 -17 Q14 -8 5 -5 Q2 -15 2 -29Z",
      gradient(c, 0, -29, 24, "#9cae9c", "#637a70"),
      "#4e655b",
      0.7,
    );
    path(
      c,
      "M0 -26 L2 -22 L1 -18 L3 -14 L1 -10 L2 -6 L0 -5 L-1 -11 L0 -15 L-2 -20Z",
      "#efad67",
      "#875d48",
      0.4,
    );
    line(c, "M0 -24 L0 -20 L1 -16 L0 -11", "#ffe0a0", 0.7);
    line(
      c,
      "M-11 -19 Q-8 -21 -4 -20 M-12 -13 L-5 -15 M5 -21 Q10 -22 12 -19 M5 -15 L12 -14",
      "#d2c9a6",
      0.65,
    );
    // Brass service straps and rivets tie the natural insect to the mine.
    path(
      c,
      "M-11 -23 Q0 -27 11 -23 L12 -21 Q0 -25 -12 -21Z",
      "#bda87a",
      "#766b51",
      0.5,
    );
    for (const x of [-9, -5, 5, 9])
      oval(
        c,
        x,
        -23 + Math.abs(x) * 0.12,
        0.65,
        0.65,
        "#eddaa7",
        "#7d765d",
        0.25,
      );
    path(
      c,
      "M-7 -28 L-7 -33 L-3 -33 L-3 -28 M5 -28 L5 -32 L8 -32 L9 -27",
      "#77827b",
      "#4b5e57",
      0.6,
    );
    oval(c, -5, -33, 2.2, 0.7, "#d7b780", "#6f6550", 0.5);
    oval(c, 6.5, -32, 1.8, 0.65, "#bd9d6c", "#6f6550", 0.5);
    // A distinct beetle head with forge-hot eyes and hinged mandibles.
    c.save();
    c.translate(a.back ? 0 : 2, -7);
    c.rotate(a.attack * 0.18);
    path(
      c,
      "M-7 -3 Q-7 -8 0 -9 Q7 -8 7 -3 L4 3 Q0 5 -4 3Z",
      gradient(c, 0, -9, 13, "#9faaa0", "#5f7770"),
      "#425b56",
      0.7,
    );
    path(
      c,
      `M-5 0 Q${-10 - a.attack * 2} 5 -4 8 L-2 4 L-4 5Z M5 0 Q${10 + a.attack * 2} 5 4 8 L2 4 L4 5Z`,
      "#c6b38a",
      "#665f50",
      0.6,
    );
    if (!a.back) {
      path(c, "M-6 -4 L-1 -3 L-2 -1 L-5 -1Z", "#f2b46c", "#8e694b", 0.4);
      path(c, "M1 -3 L6 -4 L5 -1 L2 -1Z", "#f2b46c", "#8e694b", 0.4);
      line(c, "M-5 -3 L-2 -2 M2 -2 L5 -3", "#ffe5b1", 0.5);
    }
    line(c, "M-5 -6 Q-10 -10 -9 -13 M5 -6 Q10 -10 9 -13", "#8c917d", 0.8);
    oval(c, -9, -13, 0.8, 0.8, "#dfbf7c");
    oval(c, 9, -13, 0.8, 0.8, "#dfbf7c");
    c.restore();
    for (let i = 0; i < 3; i++) {
      const phase = (a.t * 0.8 + i / 3) % 1;
      c.save();
      c.globalAlpha *= (1 - phase) * 0.25;
      oval(
        c,
        -5 + Math.sin(phase * 4 + i) * 2,
        -34 - phase * 8,
        1 + phase * 2,
        0.8 + phase * 1.5,
        "#b5bbad",
      );
      c.restore();
    }
  }
  return { oval, draw: [colony, deer, beetle] };
})();

function roDrawSeasonBoss(c, mob, scale = 1) {
  if (mob.god == null) return false;
  const kind = Number(mob.god);
  if (!Number.isInteger(kind) || !roSeasonArt.draw[kind]) return false;
  const direction = Number.isFinite(mob.roDirection) ? mob.roDirection : 0;
  const angle = (direction * Math.PI) / 4 + Math.PI / 2;
  const dx = Math.cos(angle),
    dy = Math.sin(angle);
  const t = Number.isFinite(mob.t) ? mob.t : typeof G !== "undefined" ? G.t : 0;
  const moving = mob.roMoving ?? Math.hypot(mob.vx || 0, mob.vy || 0) > 0.5;
  const attack = mob.lunge > 0 ? Math.min(1, mob.lunge * 5) : 0;
  c.save();
  c.translate(mob.x, mob.y);
  c.scale(scale, scale);
  roSeasonArt.oval(c, 0, 0.3, kind === 1 ? 15 : 17, 4, "#344e3a30");
  roSeasonArt.oval(c, 0, 0.2, kind === 1 ? 10 : 11, 2.5, "#34473d20");
  c.scale(dx < -0.25 ? -1 : 1, 1);
  c.lineJoin = "round";
  c.lineCap = "round";
  roSeasonArt.draw[kind](c, {
    t,
    moving,
    attack,
    side: Math.abs(dx),
    back: dy < -0.35,
  });
  c.restore();
  return true;
}
