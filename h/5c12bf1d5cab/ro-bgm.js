/* 流浪仙境 v6.2 — 授權音樂與音效
   背景音樂：assets/audio/bgm/*.mp3，以 <audio> 串流播放，換場淡入淡出；
   載入失敗時退回 ro-audio.js 的合成配樂。
   音效：ro-sfx-data.js 內嵌的 WAV（base64），解碼後以 WebAudio 播放；
   尚未解碼或失敗時退回原本的合成音效。
   所有素材皆為 CC0 / CC-BY，來源列於選單「音樂與音效來源」。 */
"use strict";

// ---- 曲目表 ----
const RO_BGM_DIR = "assets/audio/bgm/";
const RO_BGM_EXT = ".mp3";
const RO_BGM = {
  title: { f: "title", t: "Soliloquy", a: "Matthew Pablo", l: "CC-BY 3.0", u: "https://opengameart.org/content/soliloquy", v: 0.8 },
  m0: { f: "m00_prontera", t: "Fairy Adventure", a: "MintoDog", l: "CC0", u: "https://opengameart.org/content/fairy-adventure", v: 0.75 },
  m1: { f: "m01_payon", t: "Asianoriental1", a: "Tozan", l: "CC0", u: "https://opengameart.org/content/asianoriental1", v: 0.85 },
  m2: { f: "m02_mjolnir", t: "Treading The Unknown", a: "Jonathan Shaw (www.jshaw.co.uk)", l: "作者 EULA（署名即可使用，等同 CC-BY）", u: "https://opengameart.org/node/96780", v: 0.85 },
  m3: { f: "m03_morroc", t: "Desert Loop", a: "iamoneabe", l: "CC0", u: "https://opengameart.org/content/desert-loop", v: 0.8 },
  m4: { f: "m04_izlude", t: "Underwater Theme", a: "CleytonKauffman", l: "CC0", u: "https://opengameart.org/content/underwater-theme", v: 0.8 },
  m5: { f: "m05_icecave", t: "The Ice Cavern", a: "Peter Eastman", l: "CC-BY 3.0", u: "https://opengameart.org/content/the-ice-cavern", v: 0.9 },
  m6: { f: "m06_volcano", t: "Another Volcano", a: "Marty Opsahl (Mega Pixel Music Lab)", l: "CC-BY 3.0", u: "https://opengameart.org/content/another-volcano", v: 0.8 },
  m7: { f: "m07_monastery", t: "Cathedral", a: "Umplix", l: "CC0", u: "https://opengameart.org/content/cathedral-0", v: 0.85 },
  m8: { f: "m08_knights", t: "In Darkness", a: "Of Far Different Nature", l: "CC-BY 4.0", u: "https://opengameart.org/node/107840", v: 0.8 },
  m9: { f: "m09_turtle", t: "Jungle Jumpin'", a: "Scott Elliott", l: "CC-BY 4.0", u: "https://opengameart.org/node/165025", v: 0.8 },
  m10: { f: "m10_thanatos", t: "Mystical Theme", a: "Alexandr Zhelanov", l: "CC-BY 3.0", u: "https://opengameart.org/content/mystical-theme", v: 0.85 },
  m11: { f: "m11_niflheim", t: "Spooky Waltz（4 Music Box Tracks）", a: "Aureolus_Omicron", l: "CC0", u: "https://opengameart.org/node/136996", v: 0.85, c: "取用 musicbox1_spooky_waltz，轉檔為 MP3" },
  m12: { f: "m12_juno", t: "City in the Clouds", a: "Peter Eastman", l: "CC-BY 3.0", u: "https://opengameart.org/content/city-in-the-clouds", v: 0.85 },
  m13: { f: "m13_abyss", t: "Darkness March", a: "Alexandr Zhelanov", l: "CC-BY 4.0", u: "https://opengameart.org/node/83150", v: 0.8 },
  m14: { f: "m14_biolab", t: "Dark Sci-Fi Audio Pack — pulse", a: "SRG774", l: "CC0", u: "https://opengameart.org/content/dark-sci-fi-audio-pack", v: 0.85, c: "取用 pulse，轉檔為 MP3" },
  m15: { f: "m15_ragnarok", t: "Colossal Boss Battle Theme", a: "Matthew Pablo", l: "CC-BY 3.0", u: "https://opengameart.org/content/colossal-boss-battle-theme", v: 0.75, c: "使用 Blackmoor Colossus Loop 版本，轉檔為 MP3" },
  m16: { f: "m16_thor", t: "Final Confrontation", a: "tcarisland", l: "CC-BY 4.0", u: "https://opengameart.org/content/final-confrontation", v: 0.8 },
  m17: { f: "m17_poseidon", t: "Underwater Boss' Temple Song", a: "Señor Moreno", l: "CC-BY 4.0", u: "https://opengameart.org/content/underwater-boss-temple-song", v: 0.8 },
  m18: { f: "m18_darklord", t: "Against Evil", a: "Alexandr Zhelanov", l: "CC-BY 4.0", u: "https://opengameart.org/node/145591", v: 0.8 },
  boss: { f: "boss", t: "Battle Theme A", a: "cynicmusic", l: "CC0", u: "https://opengameart.org/content/battle-theme-a", v: 0.8 },
  boss2: { f: "boss2", t: "Boss Battle #2 [Symphonic Metal]", a: "nene", l: "CC0", u: "https://opengameart.org/node/84428", v: 0.75, ls: 39.724, c: "合併前奏與循環段，轉檔為 MP3" },
  tower: { f: "tower", t: "Heavy Dungeon", a: "MintoDog", l: "CC0", u: "https://opengameart.org/node/181405", v: 0.75 },
};
const RO_BGM_MAPNAME = [
  "普隆德拉南門", "斐揚森林", "妙勒尼礦坑", "夢羅克沙漠", "依斯魯得海底洞穴", "拉赫冰洞",
  "諾可羅德火山", "葛城修道院", "古城騎士團", "龜島深處", "達納托斯之塔", "尼芙菲姆",
  "朱諾・魔大陸", "深淵之湖", "生體研究所", "諸神黃昏",
];
// 音效來源（ro-sfx-data.js 的 key → 出處）
const RO_SFX_SRC = [
  { w: "普通打擊", t: "Thwack Sounds", a: "AntumDeluge", l: "CC0", u: "https://opengameart.org/content/thwack-sounds", c: "取用 4 個，裁切靜音、轉 WAV" },
  { w: "暴擊", t: "20 Sword Sound Effects（sword clash）", a: "StarNinjas", l: "CC0", u: "https://opengameart.org/content/20-sword-sound-effects-attacks-and-clashes", c: "取用 3 個，裁切靜音、轉 WAV" },
  { w: "怪物消失", t: "Poof Noises", a: "dklon", l: "CC-BY 3.0", u: "https://opengameart.org/node/121039", c: "裁切靜音、音量標準化、轉 WAV" },
  { w: "升級", t: "Victory Fanfare Short", a: "cynicmusic", l: "CC0", u: "https://opengameart.org/content/victory-fanfare-short", c: "截取前 4.2 秒並淡出" },
  { w: "任務完成、介面點擊", t: "Interface Sounds", a: "Kenney (www.kenney.nl)", l: "CC0", u: "https://opengameart.org/content/interface-sounds", c: "取用 confirmation_002、click_001" },
  { w: "拾取、掉落、藥水", t: "RPG Sound Pack", a: "artisticdude", l: "CC0", u: "https://opengameart.org/content/rpg-sound-pack", c: "取用 coin、metal-small1、bubble" },
  { w: "裝備掉落", t: "50 RPG sound effects", a: "Kenney (www.kenney.nl)", l: "CC0", u: "https://opengameart.org/content/50-rpg-sound-effects", c: "取用 dropLeather" },
  { w: "稀有掉落閃光", t: "Shimmer glitter magic", a: "The Berklee College of Music", l: "CC-BY 3.0", u: "https://opengameart.org/node/2286", c: "轉 WAV、音量標準化" },
];

// ---- 背景音樂播放器 ----
const roBgm = {
  key: "",
  cur: null, // { k, el, fade }
  old: [],
  bad: {}, // 載入失敗的曲目 → 改用合成
  pos: {}, // 各曲目播放位置，離開 Boss 後接回地圖曲
  synthKey: "",
};
// 神域 Boss（諸神黃昏）與魔王各有專屬曲；其餘守護者／試煉／季節 Boss 用 boss2
const RO_BGM_BOSS = { zeus: "m16", posei: "m17", hades: "m18", mon: "m18" };
function roBgmWant() {
  if (!S || !G) return "title";
  if (G.tw) return "tower";
  const m = curMap();
  if (G.boss) {
    const k = RO_BGM_BOSS[G.boss.type];
    if (k) return k;
    return G.arena || (m && m.ss) ? "boss2" : "boss";
  }
  let i = m ? RO_BGM_MAPNAME.indexOf(m.n) : -1;
  if (i < 0) i = Math.max(0, Math.min(15, S.map | 0));
  return "m" + i;
}
function roBgmVol() {
  const v = auVol("mus");
  return v * v * 0.9;
}
function roBgmMake(k) {
  const d = RO_BGM[k],
    el = new Audio();
  el.preload = "auto";
  el.loop = true;
  el.volume = 0;
  el.src = RO_BGM_DIR + d.f + RO_BGM_EXT;
  if (d.ls) {
    // 有前奏的曲子：播完後跳回循環段開頭
    el.loop = false;
    el.addEventListener("ended", () => {
      try {
        el.currentTime = d.ls;
        el.play().catch(() => {});
      } catch (e) {}
    });
  }
  el.addEventListener("error", () => {
    roBgm.bad[k] = 1;
    if (roBgm.cur && roBgm.cur.k === k) roBgm.cur = null;
  });
  return el;
}
function roBgmSwitch(k) {
  if (roBgm.cur) {
    const c = roBgm.cur;
    if (!c.el.paused) roBgm.pos[c.k] = c.el.currentTime;
    roBgm.old.push(c);
    roBgm.cur = null;
  }
  if (roBgm.bad[k] || !RO_BGM[k]) return;
  const el = roBgmMake(k);
  const p = roBgm.pos[k];
  // 地圖曲接續上次位置；Boss／塔每次從頭開始
  if (p && k[0] === "m" && +k.slice(1) < RO_BGM_MAPNAME.length)
    el.addEventListener("loadedmetadata", () => {
      try {
        el.currentTime = p % (el.duration || 1e9);
      } catch (e) {}
    }, { once: true });
  roBgm.cur = { k, el, fade: 0 };
}
function roBgmTick(dt) {
  const vol = roBgmVol();
  // 淡出舊曲
  roBgm.old = roBgm.old.filter((o) => {
    o.fade -= dt / 1.4;
    if (o.fade <= 0) {
      try {
        o.el.pause();
        o.el.removeAttribute("src");
        o.el.load();
      } catch (e) {}
      return false;
    }
    o.el.volume = Math.max(0, Math.min(1, vol * RO_BGM[o.k].v * o.fade));
    return true;
  });
  const c = roBgm.cur;
  if (!c) return false;
  if (vol <= 0) {
    if (!c.el.paused) c.el.pause();
    return true;
  }
  if (c.el.paused && !c.wait) {
    c.wait = 1;
    const pr = c.el.play();
    if (pr && pr.then)
      pr.then(() => (c.wait = 0)).catch(() => {
        c.wait = 0; // 尚未取得使用者互動，下次再試
      });
    else c.wait = 0;
  }
  if (!c.el.paused) c.fade = Math.min(1, c.fade + dt / 1.8);
  c.el.volume = Math.max(0, Math.min(1, vol * RO_BGM[c.k].v * c.fade));
  return true;
}
// 取代引擎的 musTick：有檔案就播檔案，沒有就跑合成配樂
const roSynthTick = musTick;
let roBgmLast = 0;
musTick = function () {
  const a = AU.ctx;
  if (!a || "running" !== a.state) return;
  const now = performance.now(),
    dt = roBgmLast ? Math.min(0.5, (now - roBgmLast) / 1000) : 0.06;
  roBgmLast = now;
  let k = "";
  try {
    k = roBgmWant();
  } catch (e) {
    k = "m0";
  }
  if (k !== roBgm.key) {
    roBgm.key = k;
    roBgmSwitch(k);
  }
  const playing = roBgmTick(dt);
  if (playing) {
    AU.key = "file:" + k; // 讓合成器在退回時重新起曲
    return;
  }
  if (k === "title") return; // 標題沒有合成曲
  if (String(AU.key).startsWith("file:")) AU.key = "";
  roSynthTick();
};
// 引擎在音訊初始化（使用者第一次互動）時才 setInterval(musTick, 60)，屆時取用的已是上面的新函式。
// 分頁切到背景時暫停，回來再播
document.addEventListener("visibilitychange", () => {
  const c = roBgm.cur;
  if (!c) return;
  if (document.hidden) c.el.pause();
});

// ---- 音效 ----
const roSfxBuf = {};
let roSfxReady = false;
function roB64(s) {
  const b = atob(s),
    u = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
  return u.buffer;
}
function roSfxLoad() {
  if (roSfxReady || !AU.ctx || typeof RO_SFX_DATA === "undefined") return;
  roSfxReady = true;
  for (const [k, list] of Object.entries(RO_SFX_DATA)) {
    roSfxBuf[k] = [];
    list.forEach((s, i) =>
      AU.ctx
        .decodeAudioData(roB64(s))
        .then((b) => (roSfxBuf[k][i] = b))
        .catch(() => {}),
    );
  }
}
// 播放一個取樣；回傳 false 代表尚未可用
function roSmp(k, t, o = {}) {
  const arr = (roSfxBuf[k] || []).filter(Boolean);
  if (!arr.length) return false;
  const a = AU.ctx,
    src = a.createBufferSource(),
    g = a.createGain();
  src.buffer = arr[Math.floor(Math.random() * arr.length)];
  src.playbackRate.value = o.r || 1;
  g.gain.value = o.g == null ? 0.8 : o.g;
  src.connect(g);
  g.connect(AU.sfx);
  src.start(t);
  return true;
}
{
  const old = {};
  for (const k of ["hit", "crit", "kill", "big", "lvl", "pick", "mat", "drop", "pot", "click", "quest"])
    if (SFX[k]) old[k] = SFX[k];
  const wrap = (k, fn) => {
    if (!old[k]) return;
    const cd = old[k][0],
      syn = old[k][1];
    SFX[k] = [cd, (t, a, tier) => (fn(t, a, tier) === false ? syn(t, a, tier) : undefined)];
  };
  // a ≈ 0.94–1.06 的隨機音高，取樣只取一半幅度，避免太滑
  const rr = (a) => 1 + (a - 1) * 0.5;
  wrap("hit", (t, a) => roSmp("hit", t, { r: rr(a), g: 0.55 }));
  wrap("crit", (t, a) => roSmp("crit", t, { r: rr(a), g: 0.75 }));
  wrap("kill", (t, a) => roSmp("kill", t, { r: rr(a), g: 0.6 }));
  wrap("big", (t, a) => roSmp("kill", t, { r: 0.8, g: 0.85 }) && (roSmp("crit", t, { r: 0.75, g: 0.6 }), true));
  wrap("lvl", (t) => roSmp("lvl", t, { g: 0.85 }));
  wrap("quest", (t) => roSmp("quest", t, { g: 0.7 }));
  wrap("pick", (t, a) => roSmp("pick", t, { r: rr(a), g: 0.6 }));
  wrap("mat", (t, a) => roSmp("pick", t, { r: rr(a) * 1.15, g: 0.5 }));
  wrap("drop", (t, a, tier) => {
    if (!roSmp("drop", t, { r: rr(a), g: 0.55 })) return false;
    if (tier >= 3) roSmp("rare", t + 0.05, { g: tier >= 4 ? 0.8 : 0.55 });
  });
  wrap("pot", (t) => roSmp("pot", t, { g: 0.7 }));
  wrap("click", (t) => roSmp("click", t, { g: 0.5 }));
}
{
  const prevSfx = sfx;
  sfx = function (...args) {
    roSfxLoad();
    return prevSfx(...args);
  };
}

// ---- 選單：音樂與音效來源 ----
if (!MENU.some((m) => m[0] === "audiocr")) {
  const i = MENU.findIndex((m) => m[0] === "log");
  MENU.splice(i >= 0 ? i : MENU.length, 0, ["audiocr", "音樂與音效來源", "mnL"]);
}
function roLicUrl(l) {
  if (l === "CC0") return "https://creativecommons.org/publicdomain/zero/1.0/";
  const m = /CC-BY(-SA)? (\d\.\d)/.exec(l);
  return m ? `https://creativecommons.org/licenses/by${m[1] ? "-sa" : ""}/${m[2]}/` : "";
}
ui.m_audiocr = function () {
  const where = (k) =>
    ({ title: "標題／選單", boss: "一般地圖 Boss", boss2: "守護者／試煉／巴風特等 Boss", tower: "無盡之塔／無限武鬥場", m16: "神域 Boss：雷神索爾", m17: "神域 Boss：海神", m18: "神域 Boss：闇答萊屍、魔王闇答萊屍" })[k] || RO_BGM_MAPNAME[+k.slice(1)];
  const row = (w, d) =>
    `<div class="box" style="margin-bottom:6px"><b>${esc(w)}</b><br>「${esc(d.t)}」 by ${esc(d.a)}<br>` +
    `<a href="${d.u}" target="_blank" rel="noopener">${esc(d.u)}</a><br>` +
    `授權：${roLicUrl(d.l) ? `<a href="${roLicUrl(d.l)}" target="_blank" rel="noopener">${esc(d.l)}</a>` : esc(d.l)}　變更：${esc(d.c || "音量標準化，轉檔為 MP3")}</div>`;
  const now = roBgm.cur ? RO_BGM[roBgm.cur.k] : null;
  return (
    `<h2>音樂與音效來源</h2>` +
    `<div class="box"><p class="note" style="margin:0">本遊戲的背景音樂與音效皆為 OpenGameArt 上以 CC0 或 CC-BY 釋出的素材，非 Ragnarok Online 原版音訊。` +
    `CC-BY 素材依授權標示作者、出處與授權條款。${now ? `<br>現在播放：「${esc(now.t)}」 by ${esc(now.a)}` : ""}</p></div>` +
    `<h3>背景音樂</h3>` +
    Object.entries(RO_BGM).map(([k, d]) => row(where(k), d)).join("") +
    `<h3>音效</h3>` +
    RO_SFX_SRC.map((d) => row(d.w, d)).join("")
  );
};

// 音樂與音效的更新說明已移到 ro-content.js 的 v6.2 條目
