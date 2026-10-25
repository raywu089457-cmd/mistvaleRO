/* 載入卡住時的自救按鈕（本機鏡像專用）
 *
 * 為什麼需要：
 *   手機上「卡讀取」幾乎都是本機快取壞掉或新舊版本混在一起（Service Worker 的
 *   Cache Storage 裡還是舊檔案，但 index.html 已經是新的），遊戲就會一直停在
 *   載入畫面。這種狀態重新整理幾次都沒用，只能把快取整個清掉。
 *
 * 做法：
 *   這個檔在 <body> 一開始就載入（很小），只做一件事 —— 盯著 #bootSplash。
 *   載入畫面超過 25 秒還沒收起，就在上面多一顆「重新下載」按鈕；
 *   按下去＝解除 Service Worker＋清掉所有快取＋帶時間戳重載。
 *
 * 不會影響正常載入：正常情況 2～10 秒就進遊戲，這個檔什麼都不做。
 */
(function () {
  'use strict';
  if (window.__roBootRescue) return;
  window.__roBootRescue = 1;

  const SHOW_AT = 25000;   // 超過這個時間還沒好 → 顯示按鈕
  const START = Date.now();

  function splash() {
    const el = document.getElementById('bootSplash');
    if (!el || el.classList.contains('gone')) return null;
    return el;
  }

  async function hardReset() {
    const btn = document.getElementById('bootRescueBtn');
    if (btn) { btn.disabled = true; btn.textContent = '清除中…'; }
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } catch (e) {}
    try {
      if (window.caches) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch (e) {}
    // 帶時間戳重載，順便繞過瀏覽器自己的 HTTP 快取
    const u = new URL(location.href);
    u.searchParams.set('r', Date.now().toString(36));
    location.replace(u.toString());
  }

  function addButton() {
    const el = splash();
    if (!el || document.getElementById('bootRescueBtn')) return !!el;
    const box = el.querySelector('.bx') || el;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'margin-top:14px;pointer-events:auto';
    const btn = document.createElement('button');
    btn.id = 'bootRescueBtn';
    btn.type = 'button';
    btn.textContent = '等很久嗎？點這裡重新下載';
    btn.style.cssText =
      'pointer-events:auto;font:12px/1 system-ui,sans-serif;padding:9px 16px;border-radius:6px;' +
      'border:1px solid #3d5a7a;background:#1b2a3d;color:#cfe3ff;cursor:pointer';
    btn.addEventListener('click', hardReset);
    wrap.appendChild(btn);
    const tip = document.createElement('div');
    tip.style.cssText = 'margin-top:8px;font-size:11px;line-height:1.7;color:#7f8db3';
    tip.innerHTML = '會清掉這台裝置的遊戲快取並重新下載（約 6 MB）。<br>存檔不受影響，進度都在。';
    wrap.appendChild(tip);
    box.appendChild(wrap);
    return true;
  }

  const iv = setInterval(() => {
    if (!splash()) { clearInterval(iv); return; }
    if (Date.now() - START >= SHOW_AT) {
      if (addButton()) clearInterval(iv);
    }
  }, 1000);

  // 給 console 一個手動入口
  window.roBootRescue = hardReset;
})();
