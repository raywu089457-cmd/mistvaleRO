// [本機鏡像 fast-boot] 只等角色／道具／技能圖示（約 0.2 MB）就進遊戲；
// 怪物與技能特效（約 10 MB）改成背景佇列載入，畫面要用到的會被插隊（見 roImage）。
// 繪圖端本來就會略過還沒載好的圖，所以只是晚幾秒出現，不會報錯。
const roLateQ = [], roLateSeen = new Set();
let roLateRun = 0, roLateGo = false;
const roLoadOne = (src) =>
  new Promise((resolve) => {
    const im = new Image();
    im.onload = () => {
      RO.images[src] = im;
      resolve();
    };
    im.onerror = () => {
      RO.failed.push(src);
      resolve();
    };
    im.src = src;
  });
const roLatePump = () => {
  while (roLateGo && roLateRun < 12 && roLateQ.length) {
    const src = roLateQ.shift();
    if (RO.images[src]) continue;
    roLateRun++;
    roLoadOne(src).then(() => {
      roLateRun--;
      window.__roLate = { left: roLateQ.length, run: roLateRun };
      roLatePump();
    });
  }
};
const roLateWant = (src) => {
  if (!roLateSeen.has(src) || RO.images[src]) return;
  const i = roLateQ.indexOf(src);
  if (i > 0) (roLateQ.splice(i, 1), roLateQ.unshift(src));
};
const roLoad = async () => {
  const paths = new Set(), late = new Set();
  for (const group of ["characters", "monsters"])
    for (const entry of Object.values(RO.assets[group] || {}))
      if (!entry.lazy)
        for (const def of Object.values(entry.states || {}))
        (group === "characters" ? paths : late).add(RO.root + def.file);
  // v1.5.3：地圖背景不預先下載，用到時才載入（ro-v153.js）
  for (const group of ["items", "skills"])
    for (const def of Object.values(RO.assets[group] || {}))
      paths.add(def.dataUrl || RO.root + (def.decoratedFile || def.file));
  for (const def of Object.values(RO.assets.effects?.str || {}))
    for (const file of Object.values(def.textureFiles || {}))
      late.add(RO.root + file);
  for (const def of Object.values(RO.assets.effects?.textures || {}))
    late.add(RO.root + def.file);
  for (const def of Object.values(RO.assets.effects?.sprites || {}))
    for (const frame of def.frames) late.add(RO.root + frame.file);
  for (const src of late)
    if (!paths.has(src)) (roLateQ.push(src), roLateSeen.add(src));
  await Promise.all([...paths].map(roLoadOne));
  // 等 window load 之後才開始背景下載：new Image() 會延後 load 事件，
  // 太早開始會讓 load（以及 Service Worker 註冊）拖到 10 MB 全部下載完。
  const go = () => setTimeout(() => ((roLateGo = true), roLatePump()), 0);
  if (document.readyState === "complete") go();
  else window.addEventListener("load", go, { once: true });
