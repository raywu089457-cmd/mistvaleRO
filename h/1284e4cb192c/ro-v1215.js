/* 流浪仙境 v1.2.15：寵物扭蛋機
   ・寵物扭蛋券：組隊副本每層 5% 掉落（整個帳號共用）。選單 →「寵物」用券扭蛋，一次 1 張；10 連抽保底至少 1 隻稀有以上
   ・20 隻 RO 原版寵物，分 5 個階級：普通 48%、精良 28%、稀有 15%、史詩 6%、傳說 3%（同階級內平均；v1.2.20 起）
   ・重複抽到同一隻：星等 +1（最多 ★3，每星能力 +20%；v1.2.20 起）；★3 之後再抽到換成寵物碎片，5 個碎片自動換 1 張扭蛋券
   ・寵物圖鑑整個帳號共用，每個角色各自選 1 隻出戰：跟在角色身邊，提供能力（依階級與星等）
   ・組隊副本的隊友也會帶著自己出戰的寵物；隊伍排行的快照會記錄寵物（v1.2.16 顯示）
   ・外觀：RO 原版魔物動畫（ragassets 圖片服務，待機與走路），存於 assets/ro-v3/monsters/pets/ */

const V1215 = {
  egg: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAABE0lEQVR4nLWUvQ3CMBSEmSItK6RmhkzACBTU7ECREejoqBgAejq2YIqgi3TWyXKeL4QQnUiIfd/7M5ths+61sv0MwP36Hs6n23Dc96P+CoCxfvDc7Q4WpLrg0j+S8ev5SUJGDsSOnKb4jXIgYeQwLQHYB6hWLrvuhBAAU4j3swAw0ehrgCgLG0Bzyi1TETAuzqam3XZJNEVPoKhMYXM1aj7DjCAFTGVRBTRNmwA0yzOBsM8CaP1xDwA20gjGjFZ7sBjAqAn6GYANbKxGrQB8A6yAqVNdBDALHUsYqpgFM7EBmoUC8tl3zMNzoFmUjHXNbADHlQY6jlp35297EsBMIMB4PlR8H3mEgByUy9lrAZZcqwO+Kb8j4D0NdDUAAAAASUVORK5CYII=",
  shardN: 5,
  star: 0.2,
  maxStar: 3, // v1.2.20：5 → 3
  pity10: 2, // 10 連抽保底：至少稀有（階級 2）
  last: [],
  ld: {},
};
const V1215_TIER = [
  { n: "普通", c: "#b8b8c0", w: 48 },
  { n: "精良", c: "#5fd38a", w: 28 },
  { n: "稀有", c: "#5ab8ff", w: 15 },
  { n: "史詩", c: "#c08aff", w: 6 },
  { n: "傳說", c: "#ffb347", w: 3 },
];
// [key, 名稱, 階級, ★1 的能力]
const V1215_PETS = [
  ["poring", "波利", 0, { lifep: 4 }],
  ["poporing", "波波利", 0, { cdr: 2 }],
  ["lunatic", "瘋兔", 0, { crit: 1.5 }],
  ["picky", "小雞", 0, { dmgp: 3 }],
  ["spore", "蘑菇孢子", 0, { skill: 3 }],
  ["chonchon", "蒼蠅", 1, { aspd: 4 }],
  ["savage", "野豬寶寶", 1, { armorp: 8, lifep: 2 }],
  ["dwolf", "沙漠之狼幼犬", 1, { dmgp: 5 }],
  ["rocker", "蝗蟲", 1, { aspd: 3, move: 4 }],
  ["pspore", "毒孢子", 1, { psn: 12, skill: 2 }],
  ["smokie", "狸貓", 2, { skill: 6, crit: 1.5 }],
  ["yoyo", "猴子", 2, { crit: 3, aspd: 3 }],
  ["orcwar", "獸人戰士", 2, { dmgp: 7, lifep: 3 }],
  ["bongun", "妖道", 2, { lifep: 8, armorp: 8 }],
  ["sohee", "蘇西", 3, { lifep: 10, res_all: 4 }],
  ["deviruchi", "小惡魔", 3, { dmgp: 10, crit: 2 }],
  ["isis", "伊希斯", 3, { skill: 10, cdr: 3 }],
  ["ninetail", "九尾狐", 3, { crit: 4, critm: 12 }],
  ["bapho", "小巴風特", 4, { dmgp: 12, skill: 8, crit: 2 }],
  ["alice", "愛麗絲", 4, { lifep: 14, res_all: 6, cdr: 3 }],
];
const V1215_BY = Object.fromEntries(V1215_PETS.map((p) => [p[0], { k: p[0], n: p[1], r: p[2], m: p[3] }]));
const V1215_SPR = {"poring":{"job":1002,"file":"monsters/pets/poring.webp","h":37,"states":{"idle":{"frames":4,"frameWidth":41,"frameHeight":39,"durations":[100,100,100,100],"anchor":[21,31],"ox":0,"oy":0},"walk":{"frames":10,"frameWidth":41,"frameHeight":44,"durations":[25,25,25,25,25,25,25,25,25,25],"anchor":[21,41],"ox":0,"oy":39}}},"poporing":{"job":1031,"file":"monsters/pets/poporing.webp","h":37,"states":{"idle":{"frames":4,"frameWidth":41,"frameHeight":39,"durations":[100,100,100,100],"anchor":[21,31],"ox":0,"oy":0},"walk":{"frames":10,"frameWidth":41,"frameHeight":44,"durations":[25,25,25,25,25,25,25,25,25,25],"anchor":[21,41],"ox":0,"oy":39}}},"lunatic":{"job":1063,"file":"monsters/pets/lunatic.webp","h":25,"states":{"idle":{"frames":12,"frameWidth":33,"frameHeight":26,"durations":[50,50,50,50,50,50,50,50,50,50,50,50],"anchor":[16,17],"ox":0,"oy":0},"walk":{"frames":15,"frameWidth":31,"frameHeight":43,"durations":[25,25,25,25,25,25,25,25,25,25,25,25,25,25,25],"anchor":[15,33],"ox":0,"oy":26}}},"picky":{"job":1049,"file":"monsters/pets/picky.webp","h":25,"states":{"idle":{"frames":18,"frameWidth":15,"frameHeight":36,"durations":[25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25],"anchor":[7,33],"ox":0,"oy":0},"walk":{"frames":12,"frameWidth":15,"frameHeight":35,"durations":[25,25,25,25,25,25,25,25,25,25,25,25],"anchor":[7,33],"ox":0,"oy":36}}},"spore":{"job":1014,"file":"monsters/pets/spore.webp","h":53,"states":{"idle":{"frames":8,"frameWidth":53,"frameHeight":54,"durations":[100,100,100,100,100,100,100,100],"anchor":[21,47],"ox":0,"oy":0},"walk":{"frames":16,"frameWidth":50,"frameHeight":83,"durations":[25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25],"anchor":[20,75],"ox":0,"oy":54}}},"chonchon":{"job":1011,"file":"monsters/pets/chonchon.webp","h":29,"states":{"idle":{"frames":12,"frameWidth":37,"frameHeight":33,"durations":[50,50,50,50,50,50,50,50,50,50,50,50],"anchor":[13,70],"ox":0,"oy":0},"walk":{"frames":12,"frameWidth":37,"frameHeight":33,"durations":[50,50,50,50,50,50,50,50,50,50,50,50],"anchor":[13,70],"ox":0,"oy":33}}},"savage":{"job":1167,"file":"monsters/pets/savage.webp","h":16,"states":{"idle":{"frames":4,"frameWidth":21,"frameHeight":16,"durations":[75,75,75,75],"anchor":[10,8],"ox":0,"oy":0},"walk":{"frames":5,"frameWidth":22,"frameHeight":21,"durations":[50,50,50,50,50],"anchor":[12,13],"ox":0,"oy":16}}},"dwolf":{"job":1107,"file":"monsters/pets/dwolf.webp","h":33,"states":{"idle":{"frames":9,"frameWidth":38,"frameHeight":34,"durations":[37,37,37,37,37,37,37,37,37],"anchor":[21,25],"ox":0,"oy":0},"walk":{"frames":4,"frameWidth":45,"frameHeight":39,"durations":[25,25,25,25],"anchor":[23,30],"ox":0,"oy":34}}},"rocker":{"job":1052,"file":"monsters/pets/rocker.webp","h":98,"states":{"idle":{"frames":22,"frameWidth":62,"frameHeight":117,"durations":[25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25],"anchor":[32,102],"ox":0,"oy":0},"walk":{"frames":18,"frameWidth":77,"frameHeight":148,"durations":[25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25],"anchor":[31,133],"ox":0,"oy":117}}},"pspore":{"job":1077,"file":"monsters/pets/pspore.webp","h":53,"states":{"idle":{"frames":8,"frameWidth":53,"frameHeight":54,"durations":[100,100,100,100,100,100,100,100],"anchor":[21,47],"ox":0,"oy":0},"walk":{"frames":16,"frameWidth":50,"frameHeight":83,"durations":[25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25],"anchor":[20,75],"ox":0,"oy":54}}},"smokie":{"job":1056,"file":"monsters/pets/smokie.webp","h":48,"states":{"idle":{"frames":17,"frameWidth":43,"frameHeight":48,"durations":[112,112,112,112,112,112,112,112,112,112,112,112,112,112,112,112,112],"anchor":[18,36],"ox":0,"oy":0},"walk":{"frames":7,"frameWidth":46,"frameHeight":52,"durations":[50,50,50,50,50,50,50],"anchor":[21,42],"ox":0,"oy":48}}},"yoyo":{"job":1057,"file":"monsters/pets/yoyo.webp","h":36,"states":{"idle":{"frames":9,"frameWidth":33,"frameHeight":36,"durations":[100,100,100,100,100,100,100,100,100],"anchor":[12,26],"ox":0,"oy":0},"walk":{"frames":18,"frameWidth":34,"frameHeight":66,"durations":[25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25],"anchor":[17,55],"ox":0,"oy":36}}},"orcwar":{"job":1023,"file":"monsters/pets/orcwar.webp","h":98,"states":{"idle":{"frames":17,"frameWidth":67,"frameHeight":98,"durations":[75,75,75,75,75,75,75,75,75,75,75,75,75,75,75,75,75],"anchor":[33,85],"ox":0,"oy":0},"walk":{"frames":10,"frameWidth":88,"frameHeight":106,"durations":[50,50,50,50,50,50,50,50,50,50],"anchor":[48,89],"ox":0,"oy":98}}},"bongun":{"job":1188,"file":"monsters/pets/bongun.webp","h":89,"states":{"idle":{"frames":8,"frameWidth":34,"frameHeight":107,"durations":[100,100,100,100,100,100,100,100],"anchor":[18,98],"ox":0,"oy":0},"walk":{"frames":8,"frameWidth":34,"frameHeight":107,"durations":[100,100,100,100,100,100,100,100],"anchor":[18,98],"ox":0,"oy":107}}},"sohee":{"job":1170,"file":"monsters/pets/sohee.webp","h":102,"states":{"idle":{"frames":10,"frameWidth":108,"frameHeight":109,"durations":[62,62,62,62,62,62,62,62,62,62],"anchor":[48,121],"ox":0,"oy":0},"walk":{"frames":12,"frameWidth":53,"frameHeight":92,"durations":[25,25,25,25,25,25,25,25,25,25,25,25],"anchor":[27,101],"ox":0,"oy":109}}},"deviruchi":{"job":1109,"file":"monsters/pets/deviruchi.webp","h":58,"states":{"idle":{"frames":20,"frameWidth":32,"frameHeight":59,"durations":[37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37,37],"anchor":[14,51],"ox":0,"oy":0},"walk":{"frames":6,"frameWidth":64,"frameHeight":67,"durations":[50,50,50,50,50,50],"anchor":[46,58],"ox":0,"oy":59}}},"isis":{"job":1029,"file":"monsters/pets/isis.webp","h":107,"states":{"idle":{"frames":7,"frameWidth":92,"frameHeight":108,"durations":[100,100,100,100,100,100,100],"anchor":[47,100],"ox":0,"oy":0},"walk":{"frames":6,"frameWidth":122,"frameHeight":111,"durations":[100,100,100,100,100,100],"anchor":[52,101],"ox":0,"oy":108}}},"ninetail":{"job":1180,"file":"monsters/pets/ninetail.webp","h":58,"states":{"idle":{"frames":11,"frameWidth":70,"frameHeight":58,"durations":[50,50,50,50,50,50,50,50,50,50,50],"anchor":[40,45],"ox":0,"oy":0},"walk":{"frames":9,"frameWidth":69,"frameHeight":67,"durations":[50,50,50,50,50,50,50,50,50],"anchor":[38,60],"ox":0,"oy":58}}},"bapho":{"job":1101,"file":"monsters/pets/bapho.webp","h":56,"states":{"idle":{"frames":6,"frameWidth":38,"frameHeight":57,"durations":[50,50,50,50,50,50],"anchor":[23,47],"ox":0,"oy":0},"walk":{"frames":4,"frameWidth":40,"frameHeight":57,"durations":[25,25,25,25],"anchor":[25,47],"ox":0,"oy":57}}},"alice":{"job":1275,"file":"monsters/pets/alice.webp","h":92,"states":{"idle":{"frames":16,"frameWidth":74,"frameHeight":92,"durations":[100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100],"anchor":[13,82],"ox":0,"oy":0},"walk":{"frames":16,"frameWidth":64,"frameHeight":100,"durations":[100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100],"anchor":[22,85],"ox":0,"oy":92}}}};
const V1215_STAT = { lifep: "最大生命", cdr: "冷卻縮減", crit: "暴擊率", dmgp: "傷害", skill: "技能傷害", aspd: "攻擊速度", armorp: "護甲", move: "移動速度", psn: "中毒傷害", res_all: "全屬性抗性", critm: "暴擊傷害" };

// ---------------------------------------------------------------------------
// 1. 帳號資料（共用倉庫 STH.v1215）：圖鑑 own{key: 數量}、碎片、抽數
function v1215Acct() {
  const st = STH || stLoad();
  const a = (st.v1215 ||= {});
  a.own ||= {};
  a.shard = Math.max(0, Math.floor(+a.shard || 0));
  a.n = Math.max(0, Math.floor(+a.n || 0));
  if (!a.m3) v1215M3(a);
  return a;
}
// v1.2.20：最高星等 ★5 → ★3。原本 ★4、★5 多出的份數（每隻最多 2 份）換成碎片，碎片滿 5 個換扭蛋券
function v1215M3(a) {
  let back = 0;
  for (const n of Object.values(a.own)) back += Math.max(0, Math.min(5, Math.floor(+n) || 0) - 3);
  a.m3 = 1;
  a.shard += back;
  let tix = 0;
  while (a.shard >= V1215.shardN) {
    a.shard -= V1215.shardN;
    tix++;
  }
  v1215Save(a);
  if (tix) v1215TixAdd(tix);
  if (back)
    try {
      setTimeout(() => toast(`寵物最高星等改為 ★3：多出的 ${back} 份換成碎片${tix ? `（換到扭蛋券 ${tix} 張）` : ""}`, "lvl", 1), 1500);
    } catch (e) {}
}
function v1215Save(a) {
  try {
    const st = STH || stLoad();
    if (a) st.v1215 = a;
    stWrite(st);
  } catch (e) {}
}
function v1215Clean(v) {
  if (!v || typeof v !== "object") return null;
  const own = {};
  for (const [k, n] of Object.entries(v.own || {})) if (V1215_BY[k] && +n > 0) own[k] = Math.min(999, Math.floor(+n));
  const r = { own, shard: Math.max(0, Math.min(99, Math.floor(+v.shard || 0))), n: Math.max(0, Math.floor(+v.n || 0)) };
  if (v.m3) r.m3 = 1;
  return r;
}
// 扭蛋券（組隊副本的帳號資料）
const v1215Tix = () => (typeof v1213Acct === "function" ? v1213Acct().pet : 0);
function v1215TixAdd(d) {
  if (typeof v1213Acct !== "function") return;
  const a = v1213Acct();
  a.pet = Math.max(0, a.pet + d);
  v1213AcctSave(a);
}
const v1215Star = (k) => Math.min(V1215.maxStar, v1215Acct().own[k] || 0);
// 寵物能力：★1 的數值 ×（1 + 0.2 ×（星等 − 1））
function v1215Mods(k, star) {
  const p = V1215_BY[k];
  if (!p || !(star > 0)) return {};
  const f = 1 + V1215.star * (Math.min(V1215.maxStar, star) - 1);
  return Object.fromEntries(Object.entries(p.m).map(([s, v]) => [s, +(v * f).toFixed(2)]));
}
const v1215ModTxt = (m) =>
  Object.entries(m)
    .map(([s, v]) => `${V1215_STAT[s] || s} +${v}%`)
    .join("、");
// 目前角色出戰的寵物（要在圖鑑裡）
function v1215Cur() {
  const k = S && S.v1215pet;
  return k && V1215_BY[k] && v1215Star(k) > 0 ? k : null;
}

// ---------------------------------------------------------------------------
// 2. 扭蛋
function v1215Roll(minTier = 0) {
  const T = V1215_TIER.map((t, i) => (i >= minTier ? t.w : 0)),
    sum = T.reduce((a, b) => a + b, 0);
  let x = RAND() * sum,
    r = 0;
  for (; r < T.length - 1; r++) if ((x -= T[r]) < 0) break;
  const pool = V1215_PETS.filter((p) => p[2] === r);
  return pool[Math.floor(RAND() * pool.length)][0];
}
function v1215Pull(n) {
  n = n === 10 ? 10 : 1;
  if (v1215Tix() < n) return void toast("寵物扭蛋券不足（組隊副本每層 5% 掉落）", "bad");
  const a = v1215Acct(),
    got = [];
  for (let i = 0; i < n; i++) {
    let k = v1215Roll();
    // 10 連抽：最後一抽保底稀有以上
    if (n === 10 && i === 9 && !got.some((g) => V1215_BY[g.k].r >= V1215.pity10)) k = v1215Roll(V1215.pity10);
    const had = a.own[k] || 0;
    a.own[k] = had + 1;
    let res = { k, new: !had, star: Math.min(V1215.maxStar, had + 1), shard: 0 };
    if (had >= V1215.maxStar) {
      a.shard++;
      res.shard = 1;
    }
    got.push(res);
  }
  a.n += n;
  let back = 0;
  while (a.shard >= V1215.shardN) {
    a.shard -= V1215.shardN;
    back++;
  }
  v1215Save(a);
  v1215TixAdd(back - n);
  V1215.last = got;
  const best = got.reduce((b, g) => (V1215_BY[g.k].r > V1215_BY[b.k].r ? g : b), got[0]);
  const T = V1215_TIER[V1215_BY[best.k].r];
  toast(`寵物扭蛋：${got.map((g) => V1215_BY[g.k].n).join("、")}${back ? `（碎片換回 ${back} 張扭蛋券）` : ""}`, V1215_BY[best.k].r >= 3 ? "r4" : "lvl", 1);
  if (V1215_BY[best.k].r >= 3)
    try {
      sfx("lvl");
    } catch (e) {}
  // 還沒有出戰寵物時，自動帶第一次抽到最高階的
  if (S && !v1215Cur()) v1215Equip(best.k, true);
  try {
    markDirty();
  } catch (e) {}
  v1215Refresh();
  return got;
}
function v1215Equip(k, quiet) {
  if (!S) return;
  if (k && !(v1215Star(k) > 0)) return;
  S.v1215pet = k || null;
  if (k) v1215Load(k);
  recalc();
  markDirty();
  if (!quiet) toast(k ? `出戰寵物：${V1215_BY[k].n}` : "已收回寵物", "lvl");
  v1215Refresh();
}
function v1215Refresh() {
  try {
    if (ui.moreView === "v1215") ui.needs = !0;
    ui.refreshIf && ui.refreshIf("more");
  } catch (e) {}
}

// ---------------------------------------------------------------------------
// 3. 跟隨與繪圖
function v1215Load(k) {
  const d = V1215_SPR[k];
  if (!d || typeof Image === "undefined") return null;
  const src = RO.root + d.file;
  if (RO.images[src]) return RO.images[src];
  if (!V1215.ld[k]) {
    V1215.ld[k] = 1;
    const im = new Image();
    im.onload = () => (RO.images[src] = im);
    im.src = src;
  }
  return null;
}
const v1215Scale = (k) => {
  const h = V1215_SPR[k]?.h || 40;
  return Math.max(9, Math.min(20, h * 0.3)) / h;
};
function v1215Tick(dt) {
  if (!S || !G || !G.pl) return;
  const k = v1215Cur();
  if (!k) return;
  const p = G.pl,
    q = (G.v1215 ||= { x: p.x - 10, y: p.y + 3, face: 1, mv: 0 });
  const side = Math.cos(p.face || 0) >= 0 ? -1 : 1,
    tx = p.x + side * 11,
    ty = p.y + 3,
    dx = tx - q.x,
    dy = ty - q.y,
    d = Math.hypot(dx, dy);
  if (d > 60) {
    q.x = tx;
    q.y = ty;
    q.mv = 0;
  } else if (d > 3) {
    const sp = Math.min(d, Math.max(30, (PS?.move || 40) * 1.1) * dt);
    q.x += (dx / d) * sp;
    q.y += (dy / d) * sp;
    q.mv = 1;
    if (Math.abs(dx) > 0.5) q.face = dx > 0 ? 1 : -1;
  } else q.mv = 0;
}
function v1215Draw(c) {
  const k = v1215Cur(),
    q = G && G.v1215;
  if (!k || !q || G.dead) return;
  const d = V1215_SPR[k];
  if (!d || !v1215Load(k)) return;
  const def = { ...(q.mv ? d.states.walk : d.states.idle), file: d.file };
  c.save();
  c.globalAlpha = 0.35;
  c.fillStyle = "#000";
  c.beginPath();
  c.ellipse(q.x, q.y, 4, 1.6, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
  try {
    roFrame(c, def, q.x, q.y, v1215Scale(k), G.t, q.face > 0);
  } catch (e) {}
}

// ---------------------------------------------------------------------------
// 4. 介面：選單 →「寵物」
const v1215Esc = (s) => (typeof esc === "function" ? esc(String(s ?? "")) : String(s ?? ""));
function v1215Pic(k, box = 44, dim = false) {
  const d = V1215_SPR[k];
  if (!d) return `<span class="v1215pic" style="width:${box}px;height:${box}px"></span>`;
  const f = d.states.idle,
    sc = Math.min(1, (box - 4) / Math.max(f.frameWidth, f.frameHeight));
  return `<span class="v1215pic${dim ? " dim" : ""}" style="width:${box}px;height:${box}px"><i style="width:${f.frameWidth}px;height:${f.frameHeight}px;background:url(${RO.root}${d.file}) 0 0 no-repeat;transform:scale(${sc.toFixed(3)})"></i></span>`;
}
function v1215Page() {
  const a = v1215Acct(),
    tix = v1215Tix(),
    cur = v1215Cur();
  for (const p of V1215_PETS) if (a.own[p[0]]) v1215Load(p[0]);
  const last = V1215.last.length
    ? `<div class="v1215last">${V1215.last
        .map((g) => {
          const p = V1215_BY[g.k],
            T = V1215_TIER[p.r];
          return `<div class="v1215card" style="border-color:${T.c}">${v1215Pic(g.k, 40)}<b style="color:${T.c}">${v1215Esc(p.n)}</b><small>${g.new ? "NEW" : g.shard ? "碎片 +1" : "★" + g.star}</small></div>`;
        })
        .join("")}</div>`
    : "";
  const curTxt = cur
    ? (() => {
        const p = V1215_BY[cur],
          T = V1215_TIER[p.r],
          st = v1215Star(cur);
        return `<div class="row v1215cur">${v1215Pic(cur, 48)}<div><b style="color:${T.c}">${v1215Esc(p.n)}</b> <span class="v1215st">${"★".repeat(st)}</span><br><small>${T.n}・${v1215ModTxt(v1215Mods(cur, st))}</small></div><span class="spacer"></span><button class="btn sm" data-v1215="off">收回</button></div>`;
      })()
    : `<p class="note">還沒有出戰的寵物：在下面的圖鑑點已擁有的寵物即可出戰。</p>`;
  const grid = V1215_PETS.map(([k, n, r]) => {
    const T = V1215_TIER[r],
      st = v1215Star(k),
      own = st > 0;
    return `<button class="v1215cell${cur === k ? " on" : ""}${own ? "" : " lock"}" data-v1215="eq" data-k="${k}" style="border-color:${T.c}" ${own ? "" : "disabled"}>${v1215Pic(k, 40, !own)}<b style="color:${own ? T.c : "var(--muted)"}">${own ? v1215Esc(n) : "？？？"}</b><small>${own ? "★".repeat(st) : T.n}</small></button>`;
  }).join("");
  const prob = V1215_TIER.map((t, i) => `<span style="color:${t.c}">${t.n} ${t.w}%</span>`).join("・");
  const owned = V1215_PETS.filter((p) => a.own[p[0]]).length;
  return `<h2>寵物${typeof helpBtn === "function" ? helpBtn("v1215") : ""}</h2>
<div class="box stack v1215box"><div class="row"><img src="${V1215.egg}" alt="" class="v1215egg"><span>寵物扭蛋券 <b class="px">${tix}</b> 張</span><span class="note">碎片 ${a.shard}/${V1215.shardN}</span><span class="spacer"></span><button class="btn primary" data-v1215="pull1" ${tix < 1 ? "disabled" : ""}>扭蛋 1 次</button><button class="btn" data-v1215="pull10" ${tix < 10 ? "disabled" : ""}>扭蛋 10 次</button></div>
<p class="note" style="margin:0">機率：${prob}（同階級內平均）；10 連抽保底至少 1 隻稀有以上。扭蛋券在組隊副本每層 5% 掉落，整個帳號共用。</p>${last}</div>
<h3>出戰寵物</h3>${curTxt}
<h3>圖鑑 ${owned}/${V1215_PETS.length}</h3><p class="note" style="margin:0 0 6px">圖鑑整個帳號共用；每個角色各自選 1 隻出戰。重複抽到星等 +1（最多 ★${V1215.maxStar}，每星能力 +${V1215.star * 100}%），★${V1215.maxStar} 之後換成碎片，${V1215.shardN} 個碎片換 1 張扭蛋券。</p><div class="v1215grid">${grid}</div>`;
}
const V1215_CSS = `
.v1215egg{width:24px;height:24px;image-rendering:pixelated}
.v1215pic{display:inline-flex;align-items:center;justify-content:center;overflow:hidden;flex:none;vertical-align:middle}
.v1215pic i{display:block;flex:none;image-rendering:pixelated}
.v1215pic.dim i{filter:brightness(0) opacity(.35)}
.v1215grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:6px}
.v1215cell{display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 4px;border:1px solid;border-radius:6px;background:var(--panel,rgba(255,255,255,.6));font:inherit;font-size:12px;color:inherit;cursor:pointer;min-width:0}
.v1215cell b{font-size:12px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.v1215cell small{color:#d8a020;font-size:11px;min-height:14px}
.v1215cell.lock{cursor:default;opacity:.75}.v1215cell.on{box-shadow:0 0 0 2px #ffd84a inset}
.v1215last{display:flex;flex-wrap:wrap;gap:6px}
.v1215card{display:flex;flex-direction:column;align-items:center;width:72px;padding:4px;border:1px solid;border-radius:6px;font-size:11px}
.v1215card small{color:#d8a020}
.v1215cur{gap:8px}.v1215st{color:#d8a020}`;

// ---------------------------------------------------------------------------
// 5. 安裝
function v1215Install() {
  if (typeof MENU === "undefined" || typeof ui === "undefined") return;
  // 共用倉庫：保留寵物圖鑑
  const sc = stClean;
  stClean = function (t, ...x) {
    const a = sc.call(this, t, ...x);
    const v = t && v1215Clean(t.v1215);
    if (v) a.v1215 = v;
    return a;
  };
  try {
    if (STH && !STH.v1215) {
      const raw = JSON.parse(localStorage.getItem(STASH_KEY) || "null");
      const v = raw && v1215Clean(raw.v1215);
      if (v) STH.v1215 = v;
    }
  } catch (e) {}
  // 選單
  if (typeof RO !== "undefined") {
    RO.assets.items ||= {};
    RO.assets.items.v1215_egg = { file: "items/9001.png", dataUrl: V1215.egg, width: 24, height: 24 };
  }
  if (typeof roItemFiles !== "undefined") roItemFiles.mnPet = "v1215_egg";
  if (!MENU.some((m) => m[0] === "v1215")) {
    const i = MENU.findIndex((m) => m[0] === "roguide");
    MENU.splice(i >= 0 ? i : MENU.length, 0, ["v1215", "寵物", "mnPet"]);
  }
  ui.m_v1215 = v1215Page;
  // 能力
  const cm = collectMods;
  collectMods = function (...a) {
    const out = cm.apply(this, a);
    const k = v1215Cur();
    if (k) {
      const src = "寵物・" + V1215_BY[k].n;
      for (const [s, v] of Object.entries(v1215Mods(k, v1215Star(k)))) out.push({ s, v, src });
    }
    return out;
  };
  // 跟隨（掛在 ro-v1213-base.js 的最內層：組隊副本中依隊員各跑一次）
  if (typeof V1213B !== "undefined" && V1213B.post) V1213B.post.push((dt) => v1215Tick(dt || 0));
  else {
    const tk = tick;
    tick = function (dt, ...x) {
      const r = tk.call(this, dt, ...x);
      try {
        v1215Tick(dt || 0);
      } catch (e) {}
      return r;
    };
  }
  // 繪圖：畫在角色之後（組隊副本中每位隊員各畫自己的寵物）
  const dp = drawPlayer;
  drawPlayer = function (c, ...a) {
    const r = dp.call(this, c, ...a);
    if (typeof V1213 !== "undefined" && V1213.drawing) return r;
    const R = typeof V1213 !== "undefined" && V1213.run;
    try {
      if (R) {
        for (const m of R.members) if (!m.dead) v1213Run(m, () => v1215Draw(c));
      } else v1215Draw(c);
    } catch (e) {}
    return r;
  };
  // 點擊
  if (typeof document !== "undefined") {
    document.addEventListener("click", (e) => {
      const b = e.target && e.target.closest && e.target.closest("[data-v1215]");
      if (!b || b.disabled) return;
      e.preventDefault();
      const k = b.dataset.v1215;
      try {
        if (k === "pull1") v1215Pull(1);
        else if (k === "pull10") v1215Pull(10);
        else if (k === "eq") v1215Equip(b.dataset.k === v1215Cur() ? null : b.dataset.k);
        else if (k === "off") v1215Equip(null);
      } catch (er) {
        console.error(er);
      }
    });
    if (!document.getElementById("v1215css")) {
      const st = document.createElement("style");
      st.id = "v1215css";
      st.textContent = V1215_CSS;
      document.head.appendChild(st);
    }
  }
  // 預先載入出戰寵物的圖
  const ens = roEnsureStats;
  roEnsureStats = function (...a) {
    const r = ens.apply(this, a);
    try {
      const k = v1215Cur();
      if (k) v1215Load(k);
    } catch (e) {}
    return r;
  };
  // 說明
  HELP.v1215 = [
    "寵物",
    [
      ["扭蛋券", "組隊副本每通關一層 5% 機率掉落寵物扭蛋券，整個帳號共用；在「選單 → 寵物」用券扭蛋。"],
      ["機率", `${V1215_TIER.map((t) => `${t.n} ${t.w}%`).join("、")}，同階級內每隻機率相同；10 連抽保底至少 1 隻稀有以上。`],
      ["星等", `重複抽到同一隻寵物星等 +1，最多 ★${V1215.maxStar}，每星能力 +${V1215.star * 100}%；★${V1215.maxStar} 之後再抽到換成碎片，${V1215.shardN} 個碎片自動換 1 張扭蛋券。`],
      ["出戰", "圖鑑整個帳號共用，每個角色各自選 1 隻出戰；寵物跟在角色身邊並提供能力。組隊副本的隊友也會帶著自己出戰的寵物。"],
      ["寵物一覽", V1215_TIER.map((t, r) => `${t.n}：${V1215_PETS.filter((p) => p[2] === r).map((p) => `${p[1]}（${v1215ModTxt(p[3])}）`).join("、")}`).join("；") + "（★1 的數值）"],
    ],
  ];
}

if (typeof roV4Install === "function") {
  const r4v1215 = roV4Install;
  roV4Install = function () {
    r4v1215.apply(this, arguments);
    try {
      v1215Install();
    } catch (e) {
      console.error("v1215", e);
    }
  };
}
