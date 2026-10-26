/* 上方戰鬥畫面：可以收起 / 展開（本機鏡像自己加的，不改原始遊戲腳本）
 *
 * 為什麼要：
 *   手機上 #stageWrap 固定吃掉 150～210px，開背包／技能／道具面板時空間不夠。
 *   右上角加一顆小按鈕，按一下把戰鬥畫面收成 30px 的一條，
 *   面板就多出約 130px。再按一次展開。
 *
 * 細節：
 *   - 收起時 #stageWrap 只剩 30px，其他東西被 overflow:hidden 裁掉；
 *     但 #toasts（掉落／升級通知）要看得見 → 收起時改成 position:fixed 浮在底部。
 *   - 按鈕放在 stage 右上角（y<54 那塊沒有其他 HUD），收起後仍在同一位置。
 *   - 狀態記在 localStorage，重載後維持。
 *   - 關閉這支：localStorage.setItem('sfd.off','1') 後重新整理。
 */
(function () {
  'use strict';
  try { if (localStorage.getItem('sfd.off') === '1') return; } catch (e) {}
  if (window.__stageFold) return;
  window.__stageFold = 1;

  const KEY = 'sfd.folded';
  const H = 30;          // 收起後的高度
  const BTN_ID = 'stageFoldBtn';

  const st = document.createElement('style');
  st.id = 'stageFoldCss';
  st.textContent = `
#${BTN_ID}{position:absolute;right:6px;top:4px;z-index:40;display:flex;align-items:center;justify-content:center;
  min-width:46px;height:26px;padding:0 8px;border-radius:8px;cursor:pointer;
  font:12px/1 var(--f-body,system-ui);letter-spacing:.04em;
  color:#e8dcc4;background:rgba(20,14,28,.62);border:1px solid rgba(180,160,120,.45);
  box-shadow:0 2px 6px rgba(0,0,0,.35);-webkit-tap-highlight-color:transparent;user-select:none}
#${BTN_ID}:active{transform:translateY(1px)}
#${BTN_ID} .ico{margin-right:3px;opacity:.85}
body.stagefold #stageWrap{height:${H}px!important;min-height:0!important;max-height:${H}px!important;flex:none!important;
  background:linear-gradient(#18202e,#0f1622)!important;border-bottom:1px solid rgba(120,150,185,.32)!important;
  box-shadow:inset 0 -1px 0 rgba(255,255,255,.05)}
body.stagefold #stageWrap > :not(#${BTN_ID}){visibility:hidden}
/* 通知在收起時要看得見：跳出 #stageWrap 的裁切，浮在畫面下方 */
body.stagefold #toasts{position:fixed!important;visibility:visible!important;left:50%!important;
  top:auto!important;bottom:calc(54px + env(safe-area-inset-bottom,0px))!important;z-index:2147482200!important;
  width:min(92%,420px)!important}
`;
  document.head.appendChild(st);

  function isFolded() {
    try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; }
  }
  function apply(fold) {
    document.body.classList.toggle('stagefold', !!fold);
    const b = document.getElementById(BTN_ID);
    if (b) {
      b.innerHTML = fold ? '<span class="ico">▾</span>展開' : '<span class="ico">▴</span>收起';
      b.setAttribute('aria-label', fold ? '展開戰鬥畫面' : '收起戰鬥畫面');
      b.setAttribute('aria-expanded', fold ? 'false' : 'true');
    }
  }
  function toggle() {
    const next = !isFolded();
    try { localStorage.setItem(KEY, next ? '1' : '0'); } catch (e) {}
    apply(next);
    // 收起／展開後版面高度變了，讓遊戲重算一次大小
    try {
      if (typeof G !== 'undefined' && G && typeof resize === 'function') resize();
    } catch (e) {}
    window.dispatchEvent(new Event('resize'));
  }

  let tries = 0;
  const boot = setInterval(function () {
    tries++;
    const wrap = document.getElementById('stageWrap');
    if (!wrap) { if (tries > 300) clearInterval(boot); return; }
    if (document.getElementById(BTN_ID)) { clearInterval(boot); return; }
    const b = document.createElement('button');
    b.id = BTN_ID;
    b.type = 'button';
    b.setAttribute('aria-label', '收起戰鬥畫面');
    b.addEventListener('pointerdown', function (e) { e.stopPropagation(); }, true);
    b.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      toggle();
    }, true);
    wrap.appendChild(b);
    apply(isFolded());
    clearInterval(boot);
  }, 100);

  // 對外方便測試／手動
  window.STAGEFOLD = { toggle: toggle, apply: apply, isFolded: isFolded };
})();
