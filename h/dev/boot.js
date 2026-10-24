/* 載入中提示（本機鏡像用）
 * 目的：首次開啟要下載 ~16 MB / 870 個檔案，手機上很容易看起來像「卡住沒反應」。
 * 這支會在最早的時機插入一個進度浮層，遊戲真正可以操作（出現選角畫面或畫布開始跑）就淡出。
 * 純前端、不改任何遊戲邏輯；載不到遊戲也照樣會自己收掉。
 */
(function () {
  'use strict';
  if (document.getElementById('bootSplash')) return;

  var TOTAL = 131;              // index.html 裡的遊戲腳本數（會自動用實測值校正）
  var t0 = Date.now();
  var gone = false;

  var style = document.createElement('style');
  style.textContent = [
    '#bootSplash{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;',
    'background:radial-gradient(circle at 50% 40%,#141d31,#080b13 70%);color:#dfe7ff;',
    'font-family:"Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif;transition:opacity .45s}',
    '#bootSplash.hide{opacity:0;pointer-events:none}',
    '#bootSplash .box{text-align:center;max-width:340px;padding:0 20px}',
    '#bootSplash .t{font-size:22px;letter-spacing:.16em;color:#5ee0c8;margin-bottom:6px}',
    '#bootSplash .sub{font-size:12px;color:#7f8db3;letter-spacing:.06em;margin-bottom:18px}',
    '#bootSplash .bar{height:4px;background:#1b2333;border-radius:3px;overflow:hidden;margin-bottom:12px}',
    '#bootSplash .fill{height:100%;width:4%;background:linear-gradient(90deg,#5ee0c8,#7fd7ff);transition:width .25s}',
    '#bootSplash .st{font-size:12px;color:#9fb0d6;font-variant-numeric:tabular-nums}',
    '#bootSplash .hint{font-size:11px;color:#67759b;margin-top:14px;line-height:1.75}'
  ].join('');
  document.head.appendChild(style);

  var el = document.createElement('div');
  el.id = 'bootSplash';
  el.innerHTML =
    '<div class="box">' +
      '<div class="t">流 浪 仙 境</div>' +
      '<div class="sub">本機鏡像 · 載入中</div>' +
      '<div class="bar"><div class="fill" id="bootFill"></div></div>' +
      '<div class="st" id="bootStat">正在載入…</div>' +
      '<div class="hint" id="bootHint">首次要下載約 16 MB（約 870 個檔案）<br>第二次有快取會快很多</div>' +
    '</div>';

  function mount() {
    if (document.body) document.body.appendChild(el);
    else document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(el); });
  }
  mount();

  function jsLoaded() {
    try {
      return performance.getEntriesByType('resource').filter(function (e) {
        return /\/h\/[^/]+\/[^/]+\.js(\?|$)/.test(e.name);
      }).length;
    } catch (e) { return 0; }
  }
  function gameReady() {
    if (jsLoaded() < TOTAL * 0.9) return false;         // 腳本還沒抓完就不要收
    if (window.S) return true;                          // 已經進遊戲
    var pick = document.querySelector('#pkName');       // 選角畫面真的看得到
    return !!(pick && pick.offsetParent !== null && pick.getBoundingClientRect().width > 4);
  }
  function finish() {
    if (gone) return;
    gone = true;
    el.className = 'hide';
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 700);
  }

  var iv = setInterval(function () {
    var n = Math.min(jsLoaded(), TOTAL);
    var sec = Math.round((Date.now() - t0) / 1000);
    var fill = document.getElementById('bootFill');
    var stat = document.getElementById('bootStat');
    var hint = document.getElementById('bootHint');
    if (fill) fill.style.width = Math.max(4, Math.round((n / TOTAL) * 100)) + '%';
    if (stat) stat.textContent = '腳本 ' + n + ' / ' + TOTAL + '　·　' + sec + ' 秒';
    if (sec >= 45 && hint) {
      hint.innerHTML = '網路偏慢，還在載入中…<br>超過 90 秒沒動就重新整理一次（第二次有快取）';
    }
    if (gameReady() || sec > 150) { clearInterval(iv); finish(); }
  }, 250);
})();
