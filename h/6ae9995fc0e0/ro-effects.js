/* RO STR animation playback and lightweight original effects for adapted skills.
   Visuals observe the original combat clock; they never apply damage or use RAND. */
"use strict";
let roFxContext = null;
function roWithFx(context, callback) {
  const previous = roFxContext;
  roFxContext = context;
  try {
    return callback();
  } finally {
    roFxContext = previous;
  }
}
const roFxProfiles = {
  heavy: { custom: "slash", target: 1, delay: 0.12 },
  whirl: { str: ["bowling"], self: 1 },
  thrust: { str: ["pierce", "earthhit"], target: 1, delay: 0.06 },
  fire: { str: ["firehit1"], projectile: 1 },
  fireL: { str: ["hell_in"], projectile: 1 },
  pierce: { str: ["arrowshot"], projectile: 1 },
  pierceL: { str: ["arrowstorm"], projectile: 1 },
  varrow: { custom: "poison", projectile: 1 },
  exarrow: { str: ["arrowshot", "firehit1"], projectile: 1 },
  farrow: { str: ["firehit1"], projectile: 1 },
  iarrow: { str: ["freeze"], projectile: 1 },
  larrow: { str: ["lightning", "windhit1"], projectile: 1 },
  holy: { str: ["holyhit"], projectile: 1 },
  acid: { custom: "acid", projectile: 1 },
  rain: { custom: "rain", engine: "rain" },
  meteor: { str: ["meteor1", "firehit1"], engine: "mtr" },
  bliz: { str: ["stormgust"], engine: "bliz", ground: 1 },
  trap: { str: ["skidtrap"], engine: "trap", ground: 1 },
  fissure: { str: ["crashearth"], target: 1, delay: 0.14, ground: 1 },
  nova: { str: ["freeze"], self: 1 },
  frostsl: { str: ["freeze"], self: 1 },
  chain: { str: ["chainlight"], target: 1 },
  sonic: { str: ["sonicblow"], target: 1, delay: 0.1 },
  envenom: { custom: "poison", target: 1 },
  venom: { custom: "poison", target: 1 },
  backstab: { custom: "shadow", target: 1, delay: 0.12 },
  blink: { custom: "shadow", target: 1 },
  blinkL: { custom: "shadow", target: 1 },
  heal: { custom: "heal", self: 1 },
  sanctuary: { str: ["sanctuary"], self: 1, ground: 1 },
  asura: { custom: "asura", target: 1, delay: 0.12 },
  mammonite: { str: ["maemor"], target: 1, delay: 0.12 },
  cart: { str: ["cartrevolution"], self: 1 },
  taunt: { str: ["provoke"], self: 1 },
  cwk: { str: ["lexaeterna"], target: 1 },
  cslw: { str: ["quagmire"], target: 1, ground: 1 },
  cvul: { str: ["weakness"], target: 1 },
  summon: { custom: "summon", self: 1, ground: 1 },
  guard: { custom: "summon", self: 1, ground: 1 },
  homun: { custom: "summon", self: 1, ground: 1 },
  turret: { custom: "forge", self: 1 },
  faw: { custom: "forge", self: 1 },
  leap: { custom: "impact", target: 1, delay: 0.3 },
  swave: { custom: "crescent", projectile: 1 },
  miasma: { str: ["poison_mist"], self: 1, ground: 1 },
  bpool: { custom: "blood", self: 1, ground: 1 },
  whirlL: { str: ["bowling"], self: 1 },
  frenzy: { custom: "aura", self: 1 },
  dance: { custom: "aura", self: 1 },
};
function roFxProfile(id) {
  return roFxProfiles[id] || { custom: "aura", self: 1 };
}
function roFxNative(name) {
  return (
    RO.assets.effects?.str?.[name] || RO.assets.effects?.str?.[name + ".str"]
  );
}
function roFxAdd(id, x, y, options = {}) {
  if (!G.pl || G.dead) return;
  const profile = roFxProfile(id),
    list = G.roEffects || (G.roEffects = []),
    now = G.t;
  // Dense repeated hits keep an intelligible effect silhouette, without altering hit counts.
  if (
    list.some(
      (e) =>
        e.id === id &&
        now - e.created < 0.07 &&
        Math.hypot(e.x - x, e.y - y) < 7,
    )
  )
    return;
  const mapped = RO.assets.effects?.skillMap?.[id],
    names = profile.str || mapped?.str || [],
    str = names.filter((name) => roFxNative(name)),
    sprite =
      ["envenom", "venom", "varrow", "acid"].includes(id) &&
      RO.assets.effects?.sprites?.poisonhit
        ? "poisonhit"
        : null;
  let duration = Math.max(
    0.48,
    ...str.map((name) => {
      const d = roFxNative(name).data;
      return (d.maxKey + 1) / (d.fps || 60);
    }),
  );
  if (options.duration)
    duration = Math.max(duration, Math.min(options.duration, 12));
  if (sprite)
    duration =
      RO.assets.effects.sprites[sprite].frames.reduce(
        (s, f) => s + f.delay,
        0,
      ) / 1000;
  list.push({
    ...options,
    id,
    x,
    y,
    str,
    sprite,
    custom: profile.custom || (str.length ? "" : "aura"),
    start: now + (options.delay ?? profile.delay ?? 0),
    created: now,
    duration,
    ground: !!profile.ground,
    angle: options.angle ?? G.pl.face,
    area: Math.min(1.55, options.area || 1),
    follow: options.follow || null,
  });
  if (list.length > 36) list.splice(0, list.length - 36);
}
function roPushFx(array, ...items) {
  for (const effect of items) {
    if (!effect || !roFxContext) continue;
    effect.roSkill = roFxContext.id;
    if (array === G.fx) {
      effect.roVisual = true;
      const profile = roFxProfile(effect.roSkill);
      if (profile.engine === effect.k) {
        const impactDelay = Math.max(0, -(effect.t || 0));
        roFxAdd(effect.roSkill, effect.x, effect.y, {
          delay: effect.k === "mtr" ? 0 : impactDelay,
          duration: effect.k === "mtr" ? impactDelay * 2.16 : effect.life,
          impactAt: effect.k === "mtr" ? impactDelay : null,
          area: roFxContext.area,
        });
      }
    }
  }
  return array.push(...items);
}

// STR type-1 records contain per-frame deltas relative to the preceding type-0.
const roStrTimelines = new WeakMap();
function roStrKey(layer, frame) {
  let timeline = roStrTimelines.get(layer);
  if (!timeline) {
    timeline = [];
    for (const key of layer.animations || []) {
      if (key.type === 0) timeline.push({ base: key, delta: null });
      else if (
        key.type === 1 &&
        timeline.length &&
        timeline.at(-1).base.frame === key.frame
      )
        timeline.at(-1).delta = key;
    }
    roStrTimelines.set(layer, timeline);
  }
  let low = 0,
    high = timeline.length - 1,
    index = -1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (timeline[middle].base.frame <= frame) {
      index = middle;
      low = middle + 1;
    } else high = middle - 1;
  }
  const { base = null, delta = null } = timeline[index] || {};
  if (!base) return null;
  const dt = frame - base.frame,
    value = (key, fallback) => {
      const a = base[key] ?? fallback,
        b = delta?.[key];
      return Array.isArray(a)
        ? a.map((v, i) => v + (b?.[i] || 0) * dt)
        : a + (b || 0) * dt;
    };
  let texture = base.aniframe || 0;
  if (base.anitype === 1) texture += (delta?.aniframe || 0) * dt;
  else if (base.anitype === 2)
    texture = Math.min(
      texture + (base.delay || 0) * dt,
      layer.textures.length - 1,
    );
  else if (base.anitype === 3) texture += (base.delay || 0) * dt;
  else if (base.anitype === 4) texture -= (base.delay || 0) * dt;
  texture =
    ((Math.floor(texture) % layer.textures.length) + layer.textures.length) %
    layer.textures.length;
  return {
    pos: value("pos", [320, 320]),
    xy: value("xy", [0, 0, 0, 0, 0, 0, 0, 0]),
    color: value("color", [255, 255, 255, 255]),
    angle: value("angle", 0),
    texture,
    src: base.srcalpha,
    dst: base.destalpha,
  };
}
const roTintCache = new Map();
function roFxTint(image, color) {
  const rgb = color
    .slice(0, 3)
    .map((v) => Math.round(clamp(v, 0, 255) / 32) * 32)
    .map((v) => Math.min(255, v));
  if (rgb.every((v) => v >= 240)) return image;
  const key = image.src + "|" + rgb.join(",");
  if (roTintCache.has(key)) return roTintCache.get(key);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const c = canvas.getContext("2d");
  c.drawImage(image, 0, 0);
  c.globalCompositeOperation = "multiply";
  c.fillStyle = `rgb(${rgb})`;
  c.fillRect(0, 0, canvas.width, canvas.height);
  c.globalCompositeOperation = "destination-in";
  c.drawImage(image, 0, 0);
  roTintCache.set(key, canvas);
  if (roTintCache.size > 128)
    roTintCache.delete(roTintCache.keys().next().value);
  return canvas;
}
function roFxTriangle(c, image, points, uv) {
  const [a, b, d] = points,
    [u, v, w] = uv,
    det = (v[0] - u[0]) * (w[1] - u[1]) - (w[0] - u[0]) * (v[1] - u[1]);
  if (Math.abs(det) < 0.00001) return;
  const ax =
      ((b[0] - a[0]) * (w[1] - u[1]) - (d[0] - a[0]) * (v[1] - u[1])) / det,
    ay = ((b[1] - a[1]) * (w[1] - u[1]) - (d[1] - a[1]) * (v[1] - u[1])) / det,
    bx = ((d[0] - a[0]) * (v[0] - u[0]) - (b[0] - a[0]) * (w[0] - u[0])) / det,
    by = ((d[1] - a[1]) * (v[0] - u[0]) - (b[1] - a[1]) * (w[0] - u[0])) / det;
  c.save();
  c.beginPath();
  c.moveTo(...a);
  c.lineTo(...b);
  c.lineTo(...d);
  c.closePath();
  c.clip();
  c.transform(
    ax,
    ay,
    bx,
    by,
    a[0] - ax * u[0] - bx * u[1],
    a[1] - ay * u[0] - by * u[1],
  );
  c.drawImage(image, 0, 0);
  c.restore();
}
function roDrawStr(c, definition, seconds, effect) {
  const data = definition.data,
    frame = Math.floor(seconds * (data.fps || 60));
  if (frame < 0 || frame > data.maxKey) return;
  c.save();
  c.translate(effect.x, effect.y);
  c.scale(0.25 * effect.area, 0.25 * effect.area);
  for (const layer of data.layers || []) {
    if (!layer.textures?.length) continue;
    const key = roStrKey(layer, frame);
    if (!key || key.color[3] <= 0) continue;
    const texture = layer.textures[key.texture],
      file =
        definition.textureFiles[texture] ||
        definition.textureFiles[texture?.toLowerCase()],
      im = RO.images[RO.root + file];
    if (!im) continue;
    const image = roFxTint(im, key.color),
      w = image.width,
      h = image.height,
      q = key.xy,
      p = [0, 1, 2, 3].map((i) => [q[i], q[i + 4]]);
    c.save();
    c.globalAlpha = clamp(key.color[3] / 255, 0, 1) * 0.85;
    c.globalCompositeOperation = [2, 7].includes(key.dst)
      ? "lighter"
      : "source-over";
    c.translate(key.pos[0] - 320, key.pos[1] - 320);
    c.rotate((-key.angle * Math.PI * 2) / 1024);
    roFxTriangle(
      c,
      image,
      [p[0], p[1], p[3]],
      [
        [0, 0],
        [w, 0],
        [0, h],
      ],
    );
    roFxTriangle(
      c,
      image,
      [p[1], p[2], p[3]],
      [
        [w, 0],
        [w, h],
        [0, h],
      ],
    );
    c.restore();
  }
  c.restore();
}

// Adapted abilities use the same restrained palettes, ground seals and layered
// trails as RO; these are original Canvas geometry, not claimed as client art.
function roFxStar(c, x, y, r, color) {
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(x, y - r);
  c.lineTo(x + r * 0.2, y - r * 0.2);
  c.lineTo(x + r, y);
  c.lineTo(x + r * 0.2, y + r * 0.2);
  c.lineTo(x, y + r);
  c.lineTo(x - r * 0.2, y + r * 0.2);
  c.lineTo(x - r, y);
  c.lineTo(x - r * 0.2, y - r * 0.2);
  c.closePath();
  c.fill();
}
function roFxTexture(c, key, x, y, w, h, alpha = 1) {
  const def = RO.assets.effects?.textures?.[key],
    image = def && RO.images[RO.root + def.file];
  if (!image) return;
  c.save();
  c.globalCompositeOperation = "lighter";
  c.globalAlpha *= alpha;
  c.drawImage(image, x - w / 2, y - h / 2, w, h);
  c.restore();
}
function roFxSeal(c, x, y, r, color, spin = 0) {
  c.save();
  c.translate(x, y);
  c.scale(1, 0.48);
  c.rotate(spin);
  c.strokeStyle = color;
  c.lineWidth = 0.7;
  for (const radius of [r, r * 0.8]) {
    c.beginPath();
    c.arc(0, 0, radius, 0, Math.PI * 2);
    c.stroke();
  }
  c.beginPath();
  for (let i = 0; i <= 6; i++) {
    const a = (i * Math.PI) / 3;
    const px = Math.cos(a) * r * 0.8,
      py = Math.sin(a) * r * 0.8;
    i ? c.lineTo(px, py) : c.moveTo(px, py);
  }
  c.stroke();
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    c.beginPath();
    c.moveTo(Math.cos(a) * r * 0.84, Math.sin(a) * r * 0.84);
    c.lineTo(Math.cos(a) * r * 0.96, Math.sin(a) * r * 0.96);
    c.stroke();
  }
  c.restore();
}
function roDrawCustom(c, e, t) {
  const p = clamp(t / e.duration, 0, 1),
    fade = Math.sin(Math.PI * p),
    kind = e.custom,
    x = e.x,
    y = e.y - 7,
    r = (12 + 18 * p) * e.area;
  c.save();
  c.globalAlpha = 0.85 * fade;
  c.lineCap = "round";
  if (["slash", "shadow", "crescent", "asura", "impact"].includes(kind)) {
    roFxTexture(c, "lens2.tga", x, y, 26 + 16 * p, 26 + 16 * p, 0.45 * (1 - p));
    c.translate(x, y);
    c.rotate(e.angle || 0);
    const count = kind === "shadow" ? 5 : kind === "asura" ? 8 : 3;
    for (let i = 0; i < count; i++) {
      c.save();
      c.rotate((i - (count - 1) / 2) * 0.25);
      c.strokeStyle =
        i % 2 ? "#ffe3aa" : kind === "shadow" ? "#c9b6ee" : "#fff8dd";
      c.lineWidth = kind === "asura" ? 2 : 1.1;
      c.beginPath();
      c.moveTo(-8 + 12 * p, -5 - i);
      c.quadraticCurveTo(5, 8 + i, 16 + 14 * p, -2 + i);
      c.stroke();
      c.restore();
    }
    if (kind === "asura") {
      roFxStar(c, 0, 0, 16 + 8 * p, "#fff0b7");
      c.font = "bold 12px serif";
      c.fillStyle = "#8e423a";
      c.fillText("霸", -6, -11);
    }
  } else if (kind === "heal") {
    roFxTexture(c, "pok3.tga", x, y - 6, 28, 42, 0.65);
    roFxTexture(c, "ring_white", x, y + 6, 38, 16, 0.45);
    roFxSeal(c, x, y + 7, 16, "#9bf1bc", t * 0.5);
    const glow = c.createLinearGradient(x, y + 8, x, y - 30);
    glow.addColorStop(0, "#a6f5b080");
    glow.addColorStop(1, "#a6f5b000");
    c.fillStyle = glow;
    c.fillRect(x - 9, y - 30, 18, 38);
    for (let i = 0; i < 5; i++) {
      const a = i * 2.4,
        yy = y + 8 - ((p + i * 0.17) % 1) * 34,
        xx = x + Math.sin(a) * 12;
      c.fillStyle = "#e2ffe0";
      c.fillRect(xx - 1, yy - 4, 2, 8);
      c.fillRect(xx - 4, yy - 1, 8, 2);
    }
  } else if (["poison", "acid", "blood"].includes(kind)) {
    roFxTexture(c, "pok1.tga", x, y - 4, 30, 36, 0.5);
    const color =
      kind === "blood" ? "#d77e99" : kind === "acid" ? "#b5e577" : "#ba8add";
    roFxSeal(c, x, y + 7, r * 0.7, color, t * 0.6);
    for (let i = 0; i < 9; i++) {
      const a = i * 2.399,
        rr = ((3 + 13 * p) * ((i % 3) + 1)) / 3,
        xx = x + Math.cos(a) * rr,
        yy = y + Math.sin(a) * rr * 0.5 - p * 13;
      c.fillStyle = color;
      c.globalAlpha = fade * 0.35;
      c.beginPath();
      c.ellipse(xx, yy, 3 + p * 3, 4 + p * 3, 0, 0, Math.PI * 2);
      c.fill();
      roFxStar(c, xx, yy, 1.2, "#eeffd3");
    }
  } else if (kind === "rain") {
    c.strokeStyle = "#e6dcc7";
    c.lineWidth = 0.75;
    for (let i = 0; i < 7; i++) {
      const xx = x + Math.sin(i * 5) * 18,
        yy = y + Math.cos(i * 3) * 7 - 30 * (1 - p);
      c.beginPath();
      c.moveTo(xx - 6, yy - 15);
      c.lineTo(xx, yy);
      c.stroke();
      roFxStar(c, xx, yy, 2, "#fff7d8");
    }
  } else if (kind === "fire") {
    for (let i = 0; i < 7; i++) {
      const a = i * 2.4,
        xx = x + Math.cos(a) * r * 0.5,
        yy = y + Math.sin(a) * r * 0.3 - p * 10;
      roFxStar(c, xx, yy, 5 * (1 - p) + 1, i % 2 ? "#ffac56" : "#ffe4a1");
    }
  } else if (kind === "arrowhit") {
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      roFxStar(
        c,
        x + Math.cos(a) * r * 0.5,
        y + Math.sin(a) * r * 0.4,
        2,
        "#f6e9c0",
      );
    }
  } else {
    const col =
      kind === "summon" ? "#b9dcf0" : kind === "forge" ? "#f3c58c" : "#d8bbf3";
    roFxSeal(c, x, y + 7, 15 + 5 * p, col, t * 0.7);
    for (let i = 0; i < 7; i++) {
      const a = (i * Math.PI * 2) / 7 + t;
      roFxStar(c, x + Math.cos(a) * 15, y + Math.sin(a) * 7 - p * 14, 1.8, col);
    }
  }
  c.restore();
}
function roDrawEffects(c, ground) {
  if (!G.roEffects) return;
  G.roEffects = G.roEffects.filter(
    (e) => G.t < e.start + e.duration && G.t >= e.created - 0.01,
  );
  for (const e of G.roEffects) {
    const t = G.t - e.start;
    if (t < 0 || e.ground !== ground) continue;
    if (e.follow) {
      e.x = e.follow.x;
      e.y = e.follow.y;
    }
    if (e.sprite) {
      const frames = RO.assets.effects.sprites[e.sprite].frames;
      let ms = t * 1000,
        frame = frames[0];
      for (const f of frames) {
        frame = f;
        if (ms < f.delay) break;
        ms -= f.delay;
      }
      const image = RO.images[RO.root + frame.file],
        s = 0.3 * e.area;
      if (image) {
        c.save();
        c.globalAlpha = 0.85;
        c.drawImage(
          image,
          e.x + (frame.offset[0] - image.width / 2) * s,
          e.y - 7 + (frame.offset[1] - image.height / 2) * s,
          image.width * s,
          image.height * s,
        );
        c.restore();
      }
    } else if (e.str.length)
      for (const name of e.str) {
        const d = roFxNative(name),
          duration = (d.data.maxKey + 1) / (d.data.fps || 60);
        const time =
          e.id === "bliz"
            ? t % duration
            : e.id === "meteor" && e.impactAt
              ? name === "meteor1"
                ? (t * 0.75) / e.impactAt
                : t - e.impactAt
              : t;
        roDrawStr(c, d, time, e);
      }
    else roDrawCustom(c, e, t);
  }
}
function roDrawProjectile(c, p) {
  const id = p.roSkill,
    a = p.tgt
      ? Math.atan2(p.tgt.y - 6 - p.y, p.tgt.x - p.x)
      : Math.atan2(p.vy || 0, p.vx || 1),
    fire = ["fire", "fireL", "farrow"].includes(id),
    holy = id === "holy",
    poison = ["varrow", "acid"].includes(id),
    wave = id === "swave",
    col = holy
      ? "#fff0b7"
      : fire
        ? "#ffbb6e"
        : poison
          ? "#b4dd88"
          : id === "iarrow"
            ? "#bcecff"
            : id === "larrow"
              ? "#d8d1ff"
              : "#eee0bd";
  c.save();
  c.translate(p.x, p.y);
  c.rotate(a);
  c.strokeStyle = col;
  c.lineWidth = 0.7;
  const nativeProjectile = holy
    ? "cross_old.bmp"
    : id === "iarrow"
      ? "icearrow.tga"
      : id === "larrow"
        ? `thunder_ball_${"abcd"[Math.floor(G.t * 18) % 4]}.bmp`
        : fire
          ? `devil_fire${String(1 + (Math.floor(G.t * 24) % 25)).padStart(2, "0")}.bmp`
          : null;
  if (nativeProjectile) {
    roFxTexture(
      c,
      nativeProjectile,
      0,
      0,
      holy ? 15 : 18,
      holy ? 19 : 13,
      0.85,
    );
    c.globalAlpha = 0.55;
    c.beginPath();
    c.moveTo(-15, 0);
    c.lineTo(-3, 0);
    c.stroke();
    c.restore();
    return;
  }
  if (fire || holy || poison) {
    roFxTexture(
      c,
      holy ? "lens1.tga" : poison ? "pok1.tga" : "lens2.tga",
      0,
      0,
      holy ? 15 : 11,
      holy ? 15 : 9,
      0.5,
    );
    c.globalAlpha = 0.35;
    const glow = c.createRadialGradient(0, 0, 0, 0, 0, 7);
    glow.addColorStop(0, col);
    glow.addColorStop(1, "transparent");
    c.fillStyle = glow;
    c.fillRect(-7, -7, 14, 14);
    c.globalAlpha = 0.8;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(-10 - i * 2, (i - 1) * 2);
      c.quadraticCurveTo(-3, (i - 1) * 3, 2, 0);
      c.stroke();
    }
    if (holy) roFxStar(c, 0, 0, 4, "#fff9dd");
    else {
      c.fillStyle = col;
      c.beginPath();
      c.ellipse(0, 0, 3.2, 2, 0, 0, Math.PI * 2);
      c.fill();
      roFxStar(c, 1, 0, 1.5, "#fff8d9");
    }
  } else if (wave) {
    c.lineWidth = 1.6;
    c.beginPath();
    c.arc(-2, 0, 8, -1.1, 1.1);
    c.stroke();
  } else {
    c.beginPath();
    c.moveTo(-9, 0);
    c.lineTo(3, 0);
    c.moveTo(0, -2);
    c.lineTo(3, 0);
    c.lineTo(0, 2);
    c.moveTo(-7, 0);
    c.lineTo(-10, -2);
    c.moveTo(-7, 0);
    c.lineTo(-10, 2);
    c.stroke();
  }
  c.restore();
}
function roInstallEffects() {
  const cast = castSkillRaw,
    impact = projHit,
    ground = drawFxGround,
    top = drawFxTop;
  castSkillRaw = function (g, ...args) {
    const profile = roFxProfile(g.id),
      p = G.pl,
      target = p.tgt,
      mods = gemMods(g),
      context = { id: g.id, area: PS.area * (1 + mods.area) },
      x = profile.self ? p.x : (target?.x ?? p.x),
      y = profile.self ? p.y : (target?.y ?? p.y);
    const result = roWithFx(context, () => cast(g, ...args));
    if (result !== false && !profile.projectile && !profile.engine)
      roFxAdd(g.id, x, y, { area: context.area, angle: p.face });
    return result;
  };
  projHit = function (p, target) {
    return roWithFx(p.roSkill ? { id: p.roSkill, area: 1 } : null, () => {
      const result = impact(p, target);
      if (p.roSkill)
        roFxAdd(p.roSkill, target.x, target.y, {
          angle: Math.atan2(p.vy || 0, p.vx || 1),
        });
      return result;
    });
  };
  drawFxGround = function (c) {
    const all = G.fx;
    try {
      G.fx = all.filter((e) => !e.roVisual);
      ground(c);
    } finally {
      G.fx = all;
    }
    roDrawEffects(c, true);
  };
  drawFxTop = function (c) {
    const fx = G.fx,
      projectiles = G.proj;
    try {
      G.fx = fx.filter((e) => !e.roVisual);
      G.proj = projectiles.filter((e) => !e.roSkill);
      top(c);
    } finally {
      G.fx = fx;
      G.proj = projectiles;
    }
    for (const p of projectiles) if (p.roSkill) roDrawProjectile(c, p);
    roDrawEffects(c, false);
  };
}
