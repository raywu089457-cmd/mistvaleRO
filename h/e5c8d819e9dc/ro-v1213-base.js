/* 流浪仙境 v1.2.13（組隊副本）基礎：把引擎的每格更新拆成「角色」與「世界」兩段，只在組隊副本使用。
   必須在 engine.js 之後、其他更新檔之前載入（其他更新檔包裝 tick 時，包到的是這裡的分派函式）。
   一般遊玩（mode 為空）照舊呼叫引擎原本的 tick，完全不經過下面兩段。
   下面兩段的內容由 engine.js 的 tick 原樣拆出（第 13688～14344 行），只改了「迴旋飛行物回到施放者」的目標。 */
const V1213B = { mode: null, base: tick, own: (s, f) => f() }; // own：組隊副本中以地面效果的施放者計算
// 角色：移動、索敵、普攻、施放技能、回血與藥水、召喚物／砲台／守護者、角色身上的效果
function v1213TickP(t) {
  const a = G.pl;
  for (; G.wolf.length && G.wolf[0] < G.t; ) G.wolf.shift();
  fire("tick", t);
  ((a.hurt = Math.max(0, a.hurt - t)), a.anim && ((a.anim.t += t), a.anim.t >= a.anim.dur && (a.anim = null)));
  if (G.dead)
    ((G.dead -= t),
      G.dead <= 0 &&
        ((G.dead = 0),
        (S.hp = hpCap()),
        G.flashes.push({ x: a.x, y: a.y - 6, t: 0, ring: 1, c: "#7dffc8" }),
        toast("復活")));
  else {
    if (
      (S.hp < hpCap() &&
        (S.hp = Math.min(hpCap(), S.hp + PS.regen * slHealMul() * t)),
      a.sus.frenzy &&
        susHot() &&
        (S.hp > 1 && (S.hp = Math.max(1, S.hp - 0.04 * PS.maxhp * t)),
        RAND() < 10 * t &&
          G.parts.push({
            x: a.x + rf(-4, 4),
            y: a.y,
            z: rf(2, 10),
            vx: 0,
            vy: 0,
            vz: rf(14, 26),
            g: -6,
            life: 0.5,
            c: RAND() < 0.6 ? "#ff4a5a" : "#ffd0a0",
            s: 1,
            glow: 1,
          })),
      susHot())
    )
      for (const s in a.sus) SKILLS[s].stick && SKILLS[s].stick(t);
    if (
      (S.pot <= 0 &&
        S.set.apb &&
        S.ash >= 30 &&
        ((S.ash -= 30), (S.pot += 5), toast("自動購買藥水 ×5"), markDirty()),
      S.pot > 0 && (S.hp / PS.maxhp) * 100 < S.potPct && (a.potCd || 0) <= 0)
    ) {
      (S.pot--, heal(0.35 * PS.maxhp * PS.pot), (a.potCd = 4), sfx("pot"));
      for (let t = 0; t < 10; t++)
        G.parts.push({
          x: a.x + rf(-5, 5),
          y: a.y,
          z: rf(2, 12),
          vx: 0,
          vy: 0,
          vz: rf(20, 40),
          g: -10,
          life: 0.7,
          c: t % 2 ? "#ff8a9a" : "#ffffff",
          s: 1,
          glow: 1,
        });
      num(a.x, a.y - 22, "+" + fmt(0.35 * PS.maxhp * PS.pot), "#7dffc8");
    }
    ((a.potCd = (a.potCd || 0) - t),
      (a.retgt -= t),
      alive(a.tgt)
        ? a.retgt <= 0 &&
          ((a.retgt = 0.5),
          !a.tgt.ag && G.mobs.some(attacking) && (a.tgt = pickTarget()))
        : ((a.tgt = pickTarget()), (a.retgt = 0.5)));
    const s = S.set.psv && !G.trn; // v1.0.11：消極模式套用到所有戰鬥（練功木樁除外）
    if (s) {
      let t = null;
      for (const s of G.mobs)
        s.spawnT <= 0 && (!t || dist(s, a) < dist(t, a)) && (t = s);
      a.tgt = t && dist(t, a) <= PS.range + (t.boss ? 8 : 2) ? t : null;
    }
    let e = a.tgt;
    const n = s ? kiteDir(e, 1) : e ? kiteDir(e) : null;
    if (n && !s && dist(e, a) > PS.range + (e.boss ? 8 : 2)) {
      const t = a.kth.reduce(
        (t, s) => (!t || dist(s, a) < dist(t, a) ? s : t),
        null,
      );
      t && (e = a.tgt = t);
    }
    a.slowT = Math.max(0, (a.slowT || 0) - t);
    const l = dodgeDir(),
      o =
        (a.slowT > 0 ? 1 - ELITE_AF.frost.slow : 1) *
        (l
          ? fold(SPD_MS, PS.move, null, (t) => t.dodge)
          : fold(SPD_MS, PS.move) *
            (a.anim && "whirl" !== a.anim.k ? (n ? 0.6 : 0.35) : 1));
    let r = 0,
      i = 0;
    if (e) {
      const l = dist(e, a),
        o = skillReach(),
        c = o ? 0.9 * o : PS.range < 20 ? PS.range + 1 : 0.9 * PS.range;
      if (n) ((r = n[0]), (i = n[1]));
      else if (l > c && !s) {
        const t = Math.atan2(e.y - a.y, e.x - a.x);
        ((r = Math.cos(t)), (i = Math.sin(t)));
      }
      a.anim || setFace(Math.atan2(e.y - a.y, e.x - a.x));
      const d = fold(SPD_TICK, 1);
      ((a.atk -= t * d),
        a.atk <= 0 &&
          !a.leap &&
          !S.set.nob &&
          l <= PS.range + (e.boss ? 8 : 2) &&
          (basicAttack(e),
          (a.atk = 1 / fold(SPD_AS, PS.aps) + Math.max(a.atk, -t * d)),
          a.anim && (a.anim.gap = a.atk / Math.max(d, 0.01)),
          fire("basic", e)));
    } else if (!s || (G.tw && G.tw.rest > 0)) {
      const t = G.W / 2 - a.x,
        s = (G.top + G.H) / 2 - a.y,
        e = Math.hypot(t, s);
      e > 4 &&
        ((r = (t / e) * 0.5),
        (i = (s / e) * 0.5),
        a.anim || setFace(Math.atan2(s, t)));
    } else n && ((r = n[0]), (i = n[1]));
    if (
      (l && ((r = l[0]), (i = l[1])),
      (a.moving = !(!r && !i)),
      a.moving ? (a.walkT += t) : (a.walkT = 0),
      (a.x += (r * o + a.vx) * t),
      (a.y += (i * o + a.vy) * t),
      (a.mvx = r * o),
      (a.mvy = i * o),
      a.leap)
    ) {
      const s = a.leap,
        e = Math.min(1, (s.t += t) / s.T);
      ((a.x = s.x0 + (s.x1 - s.x0) * e),
        (a.y = s.y0 + (s.y1 - s.y0) * e),
        (a.z = Math.sin(e * Math.PI) * LEAP.z),
        (a.mvx = a.mvy = 0),
        e >= 1 && ((a.leap = null), (a.z = 0)));
    }
    const c = Math.pow(8e-4, t);
    ((a.vx *= c), (a.vy *= c), inArena(a));
    const d = activeGems();
    for (const t in a.sus) d.some((a) => a.id === t) || delete a.sus[t];
    if (d.some((t) => SKILLS[t.id].sus)) {
      const s = a.tgt;
      a.susI =
        (alive(s) && dist(s, a) <= 1.4 * PS.range + 10) ||
        G.mobs.some(attacking)
          ? 0
          : (a.susI ?? 2) + t;
    }
    const f = [],
      p = () =>
        !(
          a.anim &&
          a.anim.t < Math.min(0.6 * a.anim.dur, 0.5 * (a.anim.gap ?? 9))
        );
    for (const s of d)
      SKILLS[s.id].sus
        ? susTick(s)
        : ((a.cds[s.u] = (a.cds[s.u] ?? 0.6) - t),
          a.cds[s.u] <= 0 && !gemMods(s).trig && f.push(s));
    if (!tal("endb"))
      for (const t of f.sort((t, s) => a.cds[t.u] - a.cds[s.u]))
        p() && tryCast(t);
  }
  (tickStk(t), tickMins(t), tickGsp(t), tickTurs(t), tickCrsAura(t), tickUq(t));
}
// 世界：時間、延遲效果、怪物、飛行物、地面效果、粒子
function v1213TickW(t) {
  G.t += t;
  const a = G.pl;
  const s = G.rate;
  for (s.t += t; s.t >= 1;)
    ((s.t -= 1),
      (s.i = (s.i + 1) % 60),
      (s.k[s.i] = 0),
      (s.x[s.i] = 0),
      (s.n = Math.min(60, s.n + 1)),
      ui.refreshIf("map"));
  if (
    (G.trn ||
      ((ses().t += t), (S.mt[S.map] = (S.mt[S.map] || 0) + t), (G.minT += t)),
    G.minT >= 60 &&
      ((S.kpm = S.kpm ? 0.7 * S.kpm + 0.3 * G.minK : G.minK),
      (G.minK = 0),
      (G.minT = 0)),
    G.boss &&
      ((G.bossT -= t),
      G.bossT <= 0
        ? failBoss("挑戰失敗：時間到")
        : null != G.guard && alive(G.boss) && guardTick(G.boss, t)),
    G.tw && twTick(t),
    G.arena && canStart() && (G.arena.out -= t) <= 0 && leaveArena(),
    S.set.ab &&
      !ssMap() &&
      canStartA() &&
      G.t >= (G.abT || 0) &&
      bossReady() &&
      abReady() &&
      startBoss(),
    ssMap() && S.set.ags && canStartA() && G.t >= (G.abT || 0) && abReady())
  ) {
    let t = -1;
    (S.set.ags.forEach((a, s) => {
      a && S.ssf[s] >= SS.fragN && (t < 0 || S.ssf[s] > S.ssf[t]) && (t = s);
    }),
      t >= 0 && startBoss(t));
  }
  if (agAny() && canStart() && G.t >= (G.agT || 0) && abReady()) {
    const t = agPick();
    t >= 0 && startGuard(t);
  }
  S.set.at &&
    twOpen() &&
    canStartA() &&
    G.t >= (G.atT || 0) &&
    abReady() &&
    twStart(twFrom());
  for (let t = G.later.length - 1; t >= 0; t--)
    if (G.later[t].at <= G.t) {
      const a = G.later.splice(t, 1)[0];
      G.dead || a.fn();
    }
  const e = G.arena
    ? 0
    : G.boss
      ? 3
      : Math.round(
          (Math.min(10, 5 + Math.floor(S.map / 2)) +
            slateSum("dens") +
            slateSum("horde") * HORDE.dens) *
            clamp((G.W * G.H) / 34e3, 1, 1.5),
        );
  ((G.spawn -= t),
    G.spawn <= 0 &&
      G.mobs.length < e &&
      (spawnPack(), (G.spawn = 0.8 / (1 + slateSum("horde") * HORDE.spawn + slateSum("spawn") / 100))));
  (tickPoison(t), tickAil(t), tickHaz(t));
  const n = AGGRO_R(slatesOn().length || ssMap() ? MAP_N - 1 : S.map);
  for (const s of G.mobs) {
    if (((s.t += t), s.spawnT > 0)) {
      s.spawnT -= t;
      continue;
    }
    if (
      ((s.flash = Math.max(0, s.flash - t)),
      (s.slow = Math.max(0, s.slow - t)),
      s.tnt > 0 && (s.tnt -= t),
      s.crs)
    )
      for (const a in s.crs) s.crs[a] -= t;
    s.lunge = Math.max(0, s.lunge - t);
    const e = foeOf(s),
      l =
        (s.root > 0 ? 0 : 1) *
        (s.fst ? 1 - s.fst.n * FRZ.slow : 1) *
        (s.slow > 0 ? 1 - (s.chlv ?? AIL.chl.v) : 1) *
        (cursed(s, "sl") ? 1 - CRS.sl.v * PS.crs : 1),
      o = dist(s, e),
      r = s.ranged || (s.boss ? 15 : 9);
    ((s.x += s.vx * t), (s.y += s.vy * t));
    const i = Math.pow(0.004, t);
    if (((s.vx *= i), (s.vy *= i), s.dm))
      (S.trn.m || (s.hp = s.max),
        S.trn.p ? inArena(s) : ((s.x = s.hx), (s.y = s.hy), (s.vx = s.vy = 0)),
        !S.trn.a || G.dead || s.frz > 0 || s.stn > 0 || trnShoot(s, e, t * l));
    else if (G.dead) ((s.x += 6 * Math.sin(G.t + 10 * s.id) * t), inArena(s));
    else {
      if (s.dash) {
        const a = Math.min(1, t / s.dash.t);
        ((s.x += (s.dash.x - s.x) * a),
          (s.y += (s.dash.y - s.y) * a),
          (s.dash.t -= t),
          G.parts.push({
            x: s.x + rf(-4, 4),
            y: s.y,
            z: rf(1, 8),
            vx: 0,
            vy: 0,
            vz: 0,
            g: 0,
            life: 0.3,
            c: "#ff8a6a",
            s: 1,
          }),
          s.dash.t <= 0 && (s.dash = null),
          inArena(s));
        continue;
      }
      if (s.frz > 0 || s.stn > 0) inArena(s);
      else if (
        (s.bs && bossSkill(s, t),
        s.ea &&
          s.ag &&
          eliteTick(s, t * (s.slow > 0 ? 1 - (s.chlv ?? AIL.chl.v) : 1)),
        s.hold > 0)
      )
        ((s.hold -= t), (s.face = a.x < s.x ? -1 : 1), inArena(s));
      else {
        if ((!s.ag && (o < n || e !== a) && (s.ag = !0), s.ag)) {
          if (((s.face = e.x < s.x ? -1 : 1), o > r)) {
            const a = Math.atan2(e.y - s.y, e.x - s.x);
            ((s.x += Math.cos(a) * s.spd * l * t),
              (s.y += Math.sin(a) * s.spd * l * t));
          }
        } else {
          ((s.wt -= t),
            s.wt <= 0 &&
              ((s.wx = clamp(s.x + rf(-30, 30), 10, G.W - 10)),
              (s.wy = clamp(s.y + rf(-20, 20), G.top + 8, G.H - 6)),
              (s.wt = rf(2, 4.5))));
          const a = s.wx - s.x,
            e = s.wy - s.y,
            n = Math.hypot(a, e);
          if (n > 1.5 && s.wt > 1) {
            const o = 0.4 * s.spd * l;
            ((s.x += (a / n) * o * t),
              (s.y += (e / n) * o * t),
              Math.abs(a) > 0.5 && (s.face = a < 0 ? -1 : 1));
          }
        }
        for (const t of G.mobs)
          if (t !== s) {
            const a = s.x - t.x,
              e = s.y - t.y,
              n = a * a + e * e,
              l = s.boss || t.boss ? 14 : 7;
            if (n < l * l && n > 0.01) {
              const t = Math.sqrt(n),
                o = 0.5 * (l - t);
              ((s.x += (a / t) * o), (s.y += (e / t) * o));
            }
          }
        if ((inArena(s), (s.atk -= t * l), s.ag && o <= r + 1 && s.atk <= 0))
          if (
            ((s.atk = (s.boss ? 1.6 : 1.3) * (s.am || 1)),
            (s.lunge = 0.2),
            s.ranged)
          ) {
            const t =
              MON[s.type].pc ||
              ("imp" === s.type ? "#ff8a3a" : s.boss ? "#ff60ff" : "#7ad4ff");
            later(0.1, () => {
              alive(s) &&
                roPushFx(G.proj,{
                  k: "ebolt",
                  enemy: 1,
                  x: s.x,
                  y: s.y - 0.6 * s.h,
                  tgt: e,
                  spd: 75,
                  dmg: s.dmg,
                  col: t,
                  src: s,
                });
            });
          } else
            later(0.1, () => {
              alive(s) &&
                dist(s, e) <= r + 6 &&
                (e !== a
                  ? gspHurt(e, s.dmg, s)
                  : damagePlayer(s.dmg, s.x, s.y, s, 1),
                roPushFx(G.fx,{
                  k: "claw",
                  x: e.x,
                  y: e.y - 7,
                  t: 0,
                  life: 0.16,
                  face: s.face,
                }));
            });
      }
    }
  }
  for (let s = G.proj.length - 1; s >= 0; s--) {
    const e = G.proj[s];
    if (e)
      if (((e.age = (e.age || 0) + t), e.tgt)) {
        const n = e.tgt;
        if (e.enemy ? n !== a && !(n.hp > 0) : !alive(n)) {
          G.proj.splice(s, 1);
          continue;
        }
        const l = e.enemy ? n.y - 7 : n.y - 0.45 * n.h,
          o = Math.atan2(l - e.y, n.x - e.x);
        ((e.vx = Math.cos(o) * e.spd),
          (e.vy = Math.sin(o) * e.spd),
          (e.x += e.vx * t),
          (e.y += e.vy * t),
          projTrail(e),
          Math.hypot(n.x - e.x, l - e.y) < 4 + (n.boss ? 7 : 0) &&
            (G.proj.splice(s, 1),
            e.enemy
              ? (n !== a
                  ? gspHurt(n, e.dmg, e.src)
                  : G.dead || damagePlayer(e.dmg, e.x, e.y, e.src),
                burst(e.x, e.y + 6, 6, [e.col, "#ffffff"], 60, {
                  z: 6,
                  g: 30,
                  life: 0.3,
                  glow: 1,
                }))
              : projHit(e, n)));
      } else {
        if (((e.x += e.vx * t), (e.y += e.vy * t), (e.life -= t), e.enemy)) {
          !G.dead && Math.abs(e.x - a.x) < 4 && Math.abs(e.y - (a.y - 7)) < 6
            ? (G.proj.splice(s, 1),
              damagePlayer(e.dmg, e.x, e.y, e.src),
              burst(e.x, e.y + 6, 6, [e.col, "#ffffff"], 60, {
                z: 6,
                g: 30,
                life: 0.3,
                glow: 1,
              }))
            : (e.life <= 0 ||
                e.x < -10 ||
                e.x > G.W + 10 ||
                e.y < -10 ||
                e.y > G.H + 10) &&
              G.proj.splice(s, 1);
          continue;
        }
        if (e.one) {
          projTrail(e);
          const t = G.mobs.find(
            (t) =>
              alive(t) &&
              t !== e.skip &&
              t.spawnT <= 0 &&
              Math.abs(t.x - e.x) < 5 + (t.boss ? 6 : 0) &&
              Math.abs(t.y - 0.45 * t.h - e.y) < 0.6 * t.h,
          );
          if (t) {
            (G.proj.splice(s, 1), projHit(e, t));
            continue;
          }
          (e.life <= 0 ||
            e.x < -10 ||
            e.x > G.W + 10 ||
            e.y < -10 ||
            e.y > G.H + 10) &&
            (G.proj.splice(s, 1),
            "fire" === e.k &&
              burst(e.x, e.y + 6, 5, ["#ffb347", "#ff6a3a"], 40, {
                z: 6,
                glow: 1,
              }));
          continue;
        }
        if (
          (RAND() < 0.9 &&
            G.parts.push({
              x: e.x,
              y: e.y + 6,
              z: 6,
              vx: 0,
              vy: 0,
              vz: 0,
              g: 0,
              life: 0.22,
              c: RAND() < 0.5 ? "#d4ff8a" : "#ffffff",
              s: 1,
              glow: 1,
            }),
          e.ret && e.life <= e.ret)
        ) {
          const t = Math.hypot(e.vx, e.vy),
            s = Math.atan2((e.v1213p || a).y - 6 - e.y, (e.v1213p || a).x - e.x);
          ((e.vx = Math.cos(s) * t),
            (e.vy = Math.sin(s) * t),
            (e.hit = new Set()),
            (e.ret = 0));
        }
        for (const t of G.mobs)
          !e.hit.has(t) &&
            t.spawnT <= 0 &&
            Math.abs(t.x - e.x) < 6 + (t.boss ? 6 : 0) &&
            Math.abs(t.y - 0.45 * t.h - e.y) < 0.6 * t.h &&
            (e.hit.add(t),
            hitMob(
              t,
              e.mult,
              Object.assign(
                { kb: 70, sx: e.x - e.vx, sy: e.y - e.vy + 6 },
                e.o,
              ),
            ));
        (e.life <= 0 ||
          e.x < -10 ||
          e.x > G.W + 10 ||
          e.y < -10 ||
          e.y > G.H + 10) &&
          G.proj.splice(s, 1);
      }
  }
  for (let a = G.fx.length - 1; a >= 0; a--) {
    const s = G.fx[a];
    if (((s.t += t), "rain" === s.k && s.t >= 0 && !s.done)) {
      s.done = 1;
      for (const t of mobsNear(s.x, s.y, s.r))
        hitMob(t, s.mult, Object.assign({ kb: 25, sx: t.x, sy: t.y - 1 }, s.o));
      burst(s.x, s.y, 8, ["#d4ff8a", "#ffffff", "#cfc2a0"], 60, {
        z: 0,
        vz: 50,
        life: 0.4,
      });
    }
    if ("trap" === s.k && s.t >= TRAP.arm && !s.done) {
      const t = G.mobs.find(
        (t) =>
          alive(t) &&
          t.spawnT <= 0 &&
          Math.hypot(t.x - s.x, 1.3 * (t.y - s.y)) <=
            TRAP.reach + (t.boss ? 6 : 0),
      );
      t && trapBoom(s, t);
    }
    if ("mtr" === s.k && s.t >= 0 && !s.done) {
      s.done = 1;
      for (const t of mobsNear(s.x, s.y - 2, s.r))
        hitMob(t, s.mult, Object.assign({ kb: 120, sx: s.x, sy: s.y }, s.o));
      (roPushFx(G.fx,
        { k: "boom", x: s.x, y: s.y - 3, r: 0.7 * s.r, t: 0, life: 0.4 },
        { k: "ring", x: s.x, y: s.y, r: s.r, t: 0, life: 0.4, col: "#ff8a3a" },
      ),
        burst(
          s.x,
          s.y,
          34,
          ["#fff0a0", "#ffb347", "#ff6a3a", "#d8443a", "#4a3030"],
          150,
          { z: 4, vz: 90, glow: 1 },
        ),
        shake(0.3),
        hitStop(0.07),
        sfx("big"));
    }
    if ("lava" === s.k && (s.acc += t) >= 0.5) {
      s.acc -= 0.5;
      V1213B.own(s, () => {
        for (const t of mobsNear(s.x, s.y - 2, s.r)) ailment(t, "brn", s.d, s.ax);
      });
    }
    if ("mia" === s.k && (s.acc += t) >= MIA.iv) {
      s.acc -= MIA.iv;
      for (const t of mobsNear(s.x, s.y - 2, s.r))
        hitMob(t, s.mult, Object.assign({ kb: 0, sx: s.x, sy: s.y }, s.o));
    }
    if ("bliz" === s.k && (s.acc += t) >= BLZ.iv) {
      s.acc -= BLZ.iv;
      for (const t of mobsNear(s.x, s.y - 2, s.r))
        hitMob(t, s.mult, Object.assign({ kb: 8, sx: s.x, sy: s.y }, s.o));
    }
    if ("fiss" === s.k && (s.acc += t) >= 0.5) {
      s.acc -= 0.5;
      V1213B.own(s, () => {
      for (const t of G.mobs)
        if (
          alive(t) &&
          t.spawnT <= 0 &&
          segDist(t.x, t.y - 2, s.x, s.y, s.x2, s.y2) <= s.w
        ) {
          const a = t.bld;
          !a || a.t <= 0
            ? (t.bld = { dps: s.dps, t: AIL.bld.t * s.ax, acc: 0 })
            : ((a.t = Math.max(a.t, AIL.bld.t * s.ax)),
              (a.dps = Math.max(a.dps, s.dps)));
        }
      });
    }
    s.t >= s.life && G.fx.splice(a, 1);
  }
  for (let a = G.flashes.length - 1; a >= 0; a--)
    ((G.flashes[a].t += t),
      G.flashes[a].t > (G.flashes[a].ring ? 0.6 : 0.22) &&
        G.flashes.splice(a, 1));
  for (let a = G.nums.length - 1; a >= 0; a--)
    ((G.nums[a].t += t),
      G.nums[a].t > (G.nums[a].big ? 1 : 0.75) && G.nums.splice(a, 1));
  for (let a = G.parts.length - 1; a >= 0; a--) {
    const s = G.parts[a];
    ((s.life -= t),
      s.life <= 0
        ? G.parts.splice(a, 1)
        : ((s.x += s.vx * t),
          (s.y += s.vy * t),
          (s.z += s.vz * t),
          (s.vz -= s.g * t),
          s.z < 0 &&
            ((s.z = 0), (s.vz *= -0.3), (s.vx *= 0.5), (s.vy *= 0.5))));
  }
  for (let s = G.orbs.length - 1; s >= 0; s--) {
    const e = G.orbs[s];
    if (((e.t += t), e.t < 0.4))
      ((e.x += e.vx * t),
        (e.y += e.vy * t),
        (e.z = Math.max(0, e.z + e.vz * t)),
        (e.vz -= 220 * t));
    else {
      const n = a.x,
        l = a.y - 6,
        o = Math.atan2(l - (e.y - e.z), n - e.x),
        r = 60 + 260 * (e.t - 0.4);
      ((e.x += Math.cos(o) * r * t),
        (e.y += Math.sin(o) * r * t),
        (e.z = Math.max(0, e.z - 30 * t)),
        (Math.hypot(n - e.x, l - (e.y - e.z)) < 4 || e.t > 2.5) &&
          G.orbs.splice(s, 1));
    }
  }
  for (let s = G.drops.length - 1; s >= 0; s--) {
    const e = G.drops[s];
    if (((e.t += t), e.landed)) {
      if (e.t > 1.2 && !G.dead) {
        const n = Math.atan2(a.y - 4 - e.y, a.x - e.x),
          l = Math.hypot(a.x - e.x, a.y - 4 - e.y),
          o = Math.min(l, (40 + 300 * (e.t - 1.2)) * t);
        ((e.x += Math.cos(n) * o),
          (e.y += Math.sin(n) * o),
          l - o < 5 &&
            (pickup(e),
            G.drops.splice(s, 1),
            sfx("pick"),
            G.flashes.push({
              x: a.x,
              y: a.y - 7,
              t: 0,
              c: e.col,
              r: 5 + 2 * e.tier,
            })));
      }
    } else
      ((e.x += e.vx * t),
        (e.y += e.vy * t),
        (e.z += e.vz * t),
        (e.vz -= 260 * t),
        e.z <= 0 &&
          ((e.z = 0),
          e.vz < -40 && (e.bn = (e.bn || 0) + 1) < 3
            ? ((e.vz *= -0.35), (e.vx *= 0.5), (e.vy *= 0.5))
            : ((e.landed = 1),
              (e.t = 0),
              (e.mat || e.tier >= 2) &&
                sfx(e.mat ? "mat" : "drop", e.it && e.it.uq ? 4 : e.tier),
              (e.y = clamp(e.y, G.top + 2, G.H - 4)),
              (e.x = clamp(e.x, 4, G.W - 4)))));
  }
  ((G.shake = Math.max(0, G.shake - t)),
    (G.hurtFlash = Math.max(0, G.hurtFlash - t)));
}
// post：之後的更新檔（v1.2.14 起）每格要在角色資料下執行的項目；放在最內層，組隊副本中會依隊員各跑一次（世界那段不跑）
V1213B.post = [];
V1213B.runPost = function (t) {
  for (const f of V1213B.post)
    try {
      f(t);
    } catch (e) {}
};
tick = function (t) {
  if (V1213B.mode === "p") {
    const r = v1213TickP(t);
    V1213B.runPost(t);
    return r;
  }
  if (V1213B.mode === "w") return v1213TickW(t);
  const r = V1213B.base(t);
  V1213B.runPost(t);
  return r;
};
