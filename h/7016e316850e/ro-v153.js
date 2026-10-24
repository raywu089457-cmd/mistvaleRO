/* 流浪仙境 v1.5.3：減少網站流量
   1. 地圖背景用到才載入：原本開遊戲時會先下載全部地圖背景（約 9.6 MB，每位新玩家都要下載一次）。
      改為進入地圖（或場地）時才下載；下載完成前先顯示暫代的地面（簡易地面，或目前地圖的背景），下載好自動換上（ro-content.js、ro-v93.js 拿掉預先下載）
   2. 地圖分頁、挑戰、魔王、活動卡片的橫幅改用縮小版圖片（assets/ro-v3/maps/thumb/，800×160，每張約 30 KB）
   3. 舊存檔清理：讀取角色、共用倉庫、雲端／匯入的備份時，移除 v6.2 已停用的舊詞綴（代碼 dv_ 開頭） */

const V153 = { ld: {}, n: 0 };
// 有縮小版的地圖（相對於 assets/ro-v3/maps/）
const V153_THUMB = new Set([
  "grass.jpg",
  "grass-scene.jpg",
  "desert.jpg",
  "dungeon.jpg",
  "ro55/pay_fild08.jpg",
  "ro55/mjo_dun01.jpg",
  "ro55/iz_dun02.jpg",
  "ro55/ice_dun01.jpg",
  "ro55/mag_dun01.jpg",
  "ro55/gl_church.jpg",
  "ro55/gl_knt01.jpg",
  "ro55/tur_dun02.jpg",
  "ro55/tha_t03.jpg",
  "ro55/odin_tem01.jpg",
  "ro56/niflheim.jpg",
  "ro56/juperos_01.jpg",
  "ro56/abyss_03.jpg",
  "ro56/lhz_dun03.jpg",
  "ro57/prt_maze03.jpg",
  "ro57/gl_chyard.jpg",
]);

// ---------------------------------------------------------------------------
// 1. 地圖背景用到才載入
function v153Load(src) {
  if (typeof Image === "undefined" || RO.images[src] || V153.ld[src] || RO.failed.includes(src)) return;
  V153.ld[src] = 1;
  const im = new Image();
  im.decoding = "async";
  im.onload = () => {
    const done = () => {
      delete V153.ld[src];
      RO.images[src] = im;
      V153.n++;
      // 地面先用簡易地面畫好了：重建一次，換上地圖背景
      try {
        if (typeof G !== "undefined" && G) G.ground = null;
      } catch (e) {}
    };
    // 先在背景解碼，換上時不卡畫面
    if (typeof im.decode === "function") im.decode().then(done, done);
    else done();
  };
  im.onerror = () => {
    delete V153.ld[src];
    RO.failed.push(src);
  };
  im.src = src;
}
if (typeof roImage === "function") {
  const ri153 = roImage;
  roImage = function (file, ...a) {
    const im = ri153.call(this, file, ...a);
    if (!im && typeof file === "string" && file.startsWith("maps/")) v153Load(RO.root + file);
    return im;
  };
}

// 2. 卡片橫幅改用縮小版
if (typeof mapBanner === "function") {
  const mb153 = mapBanner;
  mapBanner = function (...a) {
    const r = mb153.apply(this, a);
    const pre = RO.root + "maps/";
    if (typeof r !== "string" || !r.startsWith(pre)) return r;
    const rest = r.slice(pre.length);
    return V153_THUMB.has(rest) ? pre + "thumb/" + rest : r;
  };
}

// ---------------------------------------------------------------------------
// 3. 舊存檔：移除已停用的舊詞綴（dv_ 開頭）
function v153Dv(o, seen, d) {
  if (!o || typeof o !== "object" || d > 7 || seen.has(o)) return 0;
  seen.add(o);
  let n = 0;
  if (Array.isArray(o.af) && o.af.length) {
    const k = o.af.length;
    o.af = o.af.filter((x) => !(x && typeof x.a === "string" && x.a.startsWith("dv_")));
    n += k - o.af.length;
  }
  for (const k in o) {
    const v = o[k];
    if (v && typeof v === "object") n += v153Dv(v, seen, d + 1);
  }
  return n;
}
function v153DvAll(o) {
  try {
    return o && typeof o === "object" ? v153Dv(o, new Set(), 0) : 0;
  } catch (e) {
    return 0;
  }
}
// 讀取角色（本機、其他角色、組隊副本隊員）
if (typeof lsParse === "function") {
  const lp153 = lsParse;
  lsParse = function (...a) {
    const o = lp153.apply(this, a);
    v153DvAll(o);
    return o;
  };
}
// 共用倉庫
if (typeof stClean === "function") {
  const sc153 = stClean;
  stClean = function (...a) {
    const o = sc153.apply(this, a);
    v153DvAll(o);
    return o;
  };
}
// 雲端下載、匯入備份
if (typeof bkDecode === "function") {
  const bd153 = bkDecode;
  bkDecode = async function (...a) {
    const s = await bd153.apply(this, a);
    v153DvAll(s);
    return s;
  };
}
// 進入角色
if (typeof startGame === "function") {
  const sg153 = startGame;
  startGame = function (t, ...a) {
    v153DvAll(t);
    const r = sg153.call(this, t, ...a);
    try {
      if (typeof S !== "undefined" && S && v153DvAll(S)) markDirty();
    } catch (e) {}
    return r;
  };
}
try {
  if (typeof S !== "undefined" && S) v153DvAll(S);
} catch (e) {}
