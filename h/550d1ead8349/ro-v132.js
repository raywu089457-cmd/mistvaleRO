/* 流浪仙境 v1.3.2：組隊副本整隊進場
   原本：開場先有 1.5 秒準備（隊員各自往上飄），頭目出現時全員被拉回陣型位置，接著頭目出場 1 秒，隊員又各自往上走
   現在：
   ・每層開始時，頭目在上方出現，隊伍照陣型站在中間偏下（ro-v1225.js）
   ・接著約 1 秒，整隊維持陣型一起往上走，隊伍中心（最前排與最後排的中間）走到場地正中間；
     最前排不會比頭目下方 40 更近。這段時間隊員不行動，頭目與幽靈隊伍維持出場狀態（不行動、不能被攻擊）
   ・走到定位後才開打；遠程照舊退到自己攻擊距離的最遠處
   ・拿掉第 1 層開場的 1.5 秒空等；層與層之間的 3 秒休息照舊，休息時隊員站著不動 */

const V132 = { T: 1, mid: 0.5, near: 40 };

// 這一層的進場路線
function v132Begin() {
  const R = V1213.run;
  if (!R || R.over) return;
  const from = {};
  let lo = Infinity,
    hi = -Infinity;
  for (const c of R.members) {
    const [x, y] = v1213CellPos(c.cell);
    from[c.id] = [x, y];
    if (c.dead) continue;
    lo = Math.min(lo, y);
    hi = Math.max(hi, y);
  }
  if (!Number.isFinite(lo)) return void (R.v132 = null);
  const target = G.top + (G.H - G.top) * V132.mid;
  let dy = target - (lo + hi) / 2;
  dy = Math.min(0, Math.max(dy, v1213BossY() + V132.near - lo));
  R.v132 = { t: 0, T: V132.T, dy, from };
  // 頭目、幽靈隊伍在進場期間維持出場狀態
  for (const m of [R.boss, ...(R.ghosts || [])]) if (m && alive(m)) m.spawnT = Math.max(m.spawnT || 0, V132.T);
}
// 進場與休息時，隊員不跑自己的更新：進場時照路線走，休息時站著
function v132Hold(dt, M, k) {
  const c = V1213.cur,
    p = G.pl;
  if (!c || !p) return;
  p.tgt = null;
  p.anim = null;
  p.vx = p.vy = 0;
  const f = M && M.from[c.id];
  if (f && k != null) {
    p.x = f[0];
    p.y = f[1] + M.dy * k;
    p.moving = k < 1;
    p.mvx = 0;
    p.mvy = -40;
    p.walkT = p.moving ? (p.walkT || 0) + dt : 0;
  } else {
    p.moving = false;
    p.walkT = 0;
  }
}

function v132Install() {
  if (typeof V1213 === "undefined" || typeof v1213Frame !== "function" || typeof v1213Next !== "function") return;
  // 每層開始：排好陣型後開始進場
  const nx = v1213Next;
  v1213Next = function (...a) {
    const r = nx.apply(this, a);
    try {
      v132Begin();
    } catch (e) {
      console.error("v132", e);
    }
    return r;
  };
  // 第 1 層不再空等 1.5 秒
  if (typeof v1213Start === "function") {
    const st = v1213Start;
    v1213Start = function (...a) {
      const r = st.apply(this, a);
      const R = V1213.run;
      if (R && !R.floor && R.inter > 0) R.inter = 1e-3;
      return r;
    };
  }
  const fr = v1213Frame;
  v1213Frame = function (dt, chain, self, x) {
    const R = V1213.run,
      M = R && R.v132,
      walk = !!(M && M.t < M.T),
      hold = !!(R && !R.over && !R.ending && (R.inter > 0 || walk));
    if (!hold) return fr.call(this, dt, chain, self, x);
    let k = null;
    if (walk) {
      M.t = Math.min(M.T, M.t + dt);
      k = M.t / M.T;
    }
    const ch = function (d, ...y) {
      if (V1213B.mode !== "p") return chain.call(this, d, ...y);
      v132Hold(d, walk ? M : null, k);
    };
    return fr.call(this, dt, ch, self, x);
  };
  // 說明
  const rows = HELP.v1213 && HELP.v1213[1];
  if (Array.isArray(rows))
    for (const r of rows)
      if (r[0] === "陣型")
        r[1] = String(r[1]).replace(
          /每層開始時整隊排在場地中間偏下，頭目在上方。/,
          `每層開始時整隊排在場地中間偏下、頭目在上方，接著整隊維持陣型往上走約 ${V132.T} 秒，隊伍中心走到場地正中間後開打（這段時間隊員與頭目都不行動）；層與層之間休息時隊員站著不動。`,
        );
}

if (typeof roV4Install === "function") {
  const r4v132 = roV4Install;
  roV4Install = function () {
    r4v132.apply(this, arguments);
    try {
      v132Install();
    } catch (e) {
      console.error("v132", e);
    }
  };
}
