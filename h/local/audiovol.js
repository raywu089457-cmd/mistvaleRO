/* 音量設定修正（本機鏡像專用，不改任何原始遊戲腳本）
 *
 * 症狀：把「選單 → 設定 → 聲音 → 音樂」轉到「關閉」，音樂還是繼續播。
 *
 * 實測到的四個原因：
 *
 * 1) 背景音樂是 <audio> 元素，只靠 musTick() 裡面的 roBgmTick() 去 pause()。
 *    但 musTick 開頭就 `if ("running" !== AU.ctx.state) return;`
 *    → 手機上 AudioContext 被系統暫停時（螢幕鎖定、切到別的 app、iOS 省電、
 *      自動播放政策），整個 tick 不跑，音樂就永遠關不掉。
 *      實測：AudioContext 暫停後把音樂轉到 0，等 5 秒，currentTime 還在增加（8.75 → 12.76）。
 *
 * 2) auApply() 用 setTargetAtTime() 趨近目標值，那是漸近線，永遠不會真的到 0；
 *    而且 AudioContext 一暫停、音訊時鐘凍結，增益就卡在舊值
 *    （實測：設定 0 之後 AU.mus.gain 仍然是 0.15）。
 *
 * 3) 音量來源 auVol() 在還沒有角色存檔時（標題／選角畫面）回退成預設 0.5，
 *    那時候的音樂完全不吃使用者的設定。原站 title.mp3 存在，所以聽得很明顯。
 *
 * 4) 音樂關掉時只 pause()，<audio> 的 volume 留在原值（實測 0.169）；
 *    任何 play() 都會全音量放出來 —— ro-bgm.js 自己的「播完跳回循環段」就是一條。
 *
 * 這裡的作法：不改原始檔案，只在載入後把上面幾點補起來。
 * 音量設定另外存一份到 localStorage，標題／選角畫面也吃得到。
 */
(function () {
  'use strict';
  if (window.__roVolFix) return;
  window.__roVolFix = 1;

  const LS_KEY = 'ro-wanderer.vol';
  const DEF = { mus: 0.5, sfx: 0.7 };

  const load = () => {
    try {
      const o = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
      return o && typeof o === 'object' ? o : {};
    } catch (e) { return {}; }
  };
  const cache = load();

  // 第一次玩、還沒存過音量時，直接從既有角色存檔撈上一次的設定
  function seedFromSave() {
    if (typeof cache.mus === 'number') return;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !/^ro-wanderer\.v3\.(v1$|c\.)/.test(k)) continue;
        const v = JSON.parse(localStorage.getItem(k) || 'null');
        const set = v && v.set;
        if (set && typeof set.mus === 'number') {
          cache.mus = set.mus;
          if (typeof set.sfx === 'number') cache.sfx = set.sfx;
          return;
        }
      }
    } catch (e) {}
  }
  seedFromSave();

  // 現在該用的音量：有角色存檔就聽存檔的，沒有（標題／選角畫面）就用記住的
  function volOf(t) {
    try {
      if (typeof S !== 'undefined' && S && S.set && typeof S.set[t] === 'number') return S.set[t];
    } catch (e) {}
    return typeof cache[t] === 'number' ? cache[t] : DEF[t];
  }
  window.roVolOf = volOf;

  let savedSig = null;
  function remember() {
    try {
      if (typeof S !== 'undefined' && S && S.set) {
        if (typeof S.set.mus === 'number') cache.mus = S.set.mus;
        if (typeof S.set.sfx === 'number') cache.sfx = S.set.sfx;
      }
      const sig = cache.mus + '/' + cache.sfx;
      if (sig === savedSig) return;
      savedSig = sig;
      localStorage.setItem(LS_KEY, JSON.stringify({ mus: cache.mus, sfx: cache.sfx }));
    } catch (e) {}
  }

  const musicOff = () => volOf('mus') <= 0;

  // ---- 立刻把音樂停掉：完全不吃 AU.ctx 的狀態 ----
  function enforce() {
    if (!musicOff()) return;
    try {
      if (typeof roBgm === 'undefined' || !roBgm) return;
      const kill = (o) => {
        if (!o || !o.el) return;
        try { o.el.volume = 0; } catch (e) {}
        try { if (!o.el.paused) o.el.pause(); } catch (e) {}
        o.fade = 0;                       // 之後打開時會重新淡入
      };
      kill(roBgm.cur);
      if (roBgm.old && roBgm.old.length) { roBgm.old.forEach(kill); roBgm.old.length = 0; }
    } catch (e) {}
  }
  window.roVolEnforce = enforce;

  // ---- 1) 音量來源：不再讓「沒有角色」時回退成預設值 ----
  if (typeof window.roBgmVol === 'function') {
    window.roBgmVol = function () {
      const v = volOf('mus');
      return v * v * 0.9;
    };
  }

  // ---- 2) auApply：關掉時直接歸零，並順手把設定記下來 ----
  const baseAuApply = window.auApply;
  if (typeof baseAuApply === 'function') {
    window.auApply = function () {
      remember();
      try {
        if (typeof AU === 'undefined' || !AU.ctx || !AU.sfx || !AU.mus) return;
        const t = AU.ctx.currentTime, a = volOf('sfx'), s = volOf('mus');
        if (a <= 0) { AU.sfx.gain.cancelScheduledValues(t); AU.sfx.gain.setValueAtTime(0, t); }
        else AU.sfx.gain.setTargetAtTime(a * a * 0.9, t, 0.03);
        if (s <= 0) { AU.mus.gain.cancelScheduledValues(t); AU.mus.gain.setValueAtTime(0, t); }
        else AU.mus.gain.setTargetAtTime(s * s * 0.6, t, 0.2);
      } catch (e) {}
    };
  }

  // ---- 3) 每個 tick 先確認：關掉時連合成配樂都不要跑 ----
  const baseTick = window.roBgmTick;
  if (typeof baseTick === 'function') {
    window.roBgmTick = function (dt) {
      if (musicOff()) { enforce(); return true; }
      return baseTick(dt);
    };
  }

  // ---- 4) 音樂關掉時，任何 play() 都不准出聲 ----
  const baseMake = window.roBgmMake;
  if (typeof baseMake === 'function') {
    window.roBgmMake = function (k) {
      const el = baseMake(k);
      try {
        const raw = el.play.bind(el);
        el.play = function () {
          if (musicOff()) { try { el.volume = 0; } catch (e) {} return Promise.resolve(); }
          return raw();
        };
      } catch (e) {}
      return el;
    };
  }

  // ---- 5) 滑桿一動就立刻生效 ----
  document.addEventListener('input', function (e) {
    const t = e.target;
    if (!t || !t.dataset || !t.dataset.vol) return;
    remember();
    try { window.auApply(); } catch (e2) {}
    enforce();
  }, true);

  // ---- 6) 切前景／背景、從 bfcache 回來、視窗重新取得焦點，都再確認一次 ----
  document.addEventListener('visibilitychange', enforce);
  window.addEventListener('pageshow', enforce);
  window.addEventListener('focus', enforce);

  // ---- 7) 保險：手機上 AudioContext 被暫停時 musTick 完全不跑，
  //         這個計時器不吃音訊狀態，所以一定關得掉 ----
  setInterval(function () { remember(); enforce(); }, 400);
})();
