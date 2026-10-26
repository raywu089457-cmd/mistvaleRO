/* 上方戰鬥畫面：可以收起 / 展開（本機鏡像自己加的，不改原始遊戲腳本）
 *
 * 按鈕位置：左上角「等級／HP 方框」正下方（XP 列左邊那塊空白，避開 XP 文字與下方籌碼）。
 *   展開時 → #stageWrap 內絕對定位 left:8px top:28px。
 *   收起時 → 同一條 30px 細條的左上角 top:4px，仍然看得到、位置也一致。
 *
 * 其他：
 *   - 收起時 #stageWrap 只剩 30px，其他東西被 overflow:hidden 裁掉；
 *     但 #toasts（掉落／升級通知）要看得見 → 收起時改成 position:fixed 浮在底部。
 *   - 狀態記在 localStorage，重載後維持。
 *   - 關閉這支：localStorage.setItem('sfd.off','1') 後重新整理。
 */
(function () {
  'use strict';
  try { if (localStorage.getItem('sfd.off') === '1') return; } catch (e) {}
  if (window.__stageFold) return;
  window.__stageFold = 1;

  const KEY = 'sfd.folded';
  const H = 30;
  const BTN_ID = 'stageFoldBtn';

  const st = document.createElement('style');
  st.id = 'stageFoldCss';
  st.textContent = `
#${BTN_ID}{position:absolute;left:8px;top:28px;display:flex;align-items:center;justify-content:center;z-index:40;
  min-width:44px;height:23px;padding:0 7px;border-radius:7px;cursor:pointer;
  font:11.5px/1 var(--f-body,system-ui);letter-spacing:.02em;white-space:nowrap;
  color:#e8dcc4;background:rgba(20,14,28,.72);border:1px solid rgba(180,160,120,.5);
  box-shadow:0 2px 6px rgba(0,0,0,.35);-webkit-tap-highlight-color:transparent;user-select:none}
#${BTN_ID}:active{transform:translateY(1px)}
#${BTN_ID} .ico{margin-right:3px;opacity:.85}
#${BTN_ID}::before{content:'';position:absolute;inset:-9px -8px;border-radius:12px}
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

  // 永遠留在 #stageWrap 內，只調位置：
  // 展開 → 等級框下方（top:28）；收起 → 30px 細條內（top:4）
  function place(btn, folded) {
    const wrap = document.getElementById('stageWrap');
    if (!wrap || !btn) return;
    if (btn.parentNode !== wrap) wrap.appendChild(btn);
    btn.style.top = folded ? '4px' : '28px';
    btn.style.left = '8px';
  }

  function apply(fold) {
    document.body.classList.toggle('stagefold', !!fold);
    const b = document.getElementById(BTN_ID);
    if (b) {
      b.innerHTML = fold ? '<span class="ico">▾</span>展開' : '<span class="ico">▴</span>收起';
      b.setAttribute('aria-label', fold ? '展開戰鬥畫面' : '收起戰鬥畫面');
      b.setAttribute('aria-expanded', fold ? 'false' : 'true');
      place(b, fold);
    }
  }

  function toggle() {
    const next = !isFolded();
    try { localStorage.setItem(KEY, next ? '1' : '0'); } catch (e) {}
    apply(next);
    try { if (typeof G !== 'undefined' && G && typeof resize === 'function') resize(); } catch (e) {}
    window.dispatchEvent(new Event('resize'));
  }

  let tries = 0;
  const boot = setInterval(function () {
    tries++;
    const wrap = document.getElementById('stageWrap');
    if (!wrap) { if (tries > 300) clearInterval(boot); return; }
    if (document.getElementById(BTN_ID)) { apply(isFolded()); clearInterval(boot); return; }
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

  window.STAGEFOLD = { toggle: toggle, apply: apply, isFolded: isFolded, place: place };
})();
