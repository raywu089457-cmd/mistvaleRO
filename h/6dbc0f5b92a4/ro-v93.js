/* 流浪仙境 v1.0.3（內部 v9.3）：巴風特、闇答萊屍改用 RO 原版的專屬地圖
   巴風特　→ 巴風特巢穴（迷宮森林 prt_maze03）
   闇答萊屍 → 闇答萊屍的墓園（葛城墓園 gl_chyard）
   背景由原版 GND 地表、原版貼圖與 RSM 模型（樹木、墓碑、斷牆）烘焙；場地的暗色濾鏡調淡；限時提示改為實際秒數 */

// 地圖背景（1536×960）
const V93_MAPS = {
  maze: ["prt_maze03", "maps/ro57/prt_maze03.jpg", "普隆德拉迷宮森林"],
  chyard: ["gl_chyard", "maps/ro57/gl_chyard.jpg", "葛城墓園"],
};
// 場地暗色濾鏡的濃度（原本 巴風特 0.62、闇答萊屍 0.64，地圖幾乎看不清楚）
const V93_AMB = { fin: 0.3, mon: 0.3 };

// v7.3 的專屬場地表在 roV4Install() 時才套用，這裡先改好（名稱顯示為「場地名（地圖名）」）
if (typeof V73_ARENA !== "undefined") {
  V73_ARENA.fin = ["maze", "巴風特巢穴", "迷宮森林"];
  V73_ARENA.mon = ["chyard", "闇答萊屍的墓園", "葛城墓園"];
}

function v93MapsInstall() {
  if (!RO?.assets?.maps) return;
  for (const [k, [name, file, n]] of Object.entries(V93_MAPS)) {
    RO.assets.maps[k] = { name, n, file, width: 1536, height: 960, source: `https://assets.latam-tools.com.br/maps/${name}/manifest.json` };
    // v1.5.3：不再預先下載，進場時才載入（ro-v153.js）
  }
  for (const [k, a] of Object.entries(V93_AMB)) if (ARENA[k]?.v?.amb) ARENA[k].v.amb[0] = a;
  // 魔王頁卡片的橫幅
  const mb = mapBanner;
  mapBanner = function (key, ...a) {
    const th = { fin: "maze", mon: "chyard" }[String(key)],
      d = th && RO.assets.maps[th];
    return d ? RO.root + d.file : mb.call(this, key, ...a);
  };
}

// 巴風特、闇答萊屍的限時：出場提示與挑戰確認視窗原本寫 210／270 秒，實際為 240／330 秒
function v93Time(t) {
  if (t === 4) return typeof V71_GD !== "undefined" ? V71_GD.m.t : 330;
  if (t === GUARD.length) return typeof V72_FIN !== "undefined" ? V72_FIN.t : 240;
  return null;
}
function v93TimeInstall() {
  const sg = startGuard;
  startGuard = function (t, ...x) {
    const sec = v93Time(t);
    if (sec == null) return sg.call(this, t, ...x);
    const t0 = toast;
    toast = function (msg, ...r) {
      if (typeof msg === "string") msg = msg.replace(/（限時 \d+ 秒）$/, `（限時 ${sec} 秒）`);
      return t0.call(this, msg, ...r);
    };
    try {
      return sg.call(this, t, ...x);
    } finally {
      toast = t0;
    }
  };
  const cf = ui.cfFor;
  ui.cfFor = function (k, ...x) {
    const r = cf.call(this, k, ...x),
      m = /^gd(\d+)$/.exec(k || ""),
      sec = m && v93Time(+m[1]);
    return sec != null && typeof r === "string" ? r.replace(/限時 (<span class="px">)?\d+(<\/span>)? 秒/, (s, a = "", b = "") => `限時 ${a}${sec}${b} 秒`) : r;
  };
}

function v93HelpInstall() {
  for (const hv of Object.values(HELP))
    for (const r of Array.isArray(hv?.[1]) ? hv[1] : [])
      if (Array.isArray(r) && typeof r[1] === "string") r[1] = r[1].replace("巴風特與闇答萊屍 奧丁神殿", "巴風特 迷宮森林、闇答萊屍 葛城墓園");
}

function v93Install() {
  v93MapsInstall();
  v93TimeInstall();
  v93HelpInstall();
}
if (typeof roV4Install === "function") {
  const r4v93 = roV4Install;
  roV4Install = function () {
    r4v93();
    v93Install();
  };
}
