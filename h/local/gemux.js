/* 技能寶石盤操作改良（本機鏡像自己加的，不改原始遊戲腳本）
 *
 * 1. 寶石托盤 → 固定在面板底部的「寶石列」（橫向捲動），格子跟寶石永遠同時看得到
 * 2. 點托盤寶石 = 先看說明卡（名稱／主動輔助／標籤／冷卻／完整說明），按「放入格子」才放
 *    （原本點一下會直接「拿起」浮在格子上，看不到說明）；要拖曳也可以，往上拖到格子即可
 * 3. 點格子裡的寶石 → 說明卡顯示連動狀況，大按鈕：旋轉／取下／完成
 * 4. 放不下（紅色）時，說明卡直接告訴你，並給旋轉／放回
 *
 * 所有動作都走遊戲原本的 onPanelClick（data-act="gem/rot/unplace/desel"），不自己改存檔資料。
 * 關閉：localStorage.setItem('gx.off','1') 後重新整理。
 */
(function () {
  'use strict';
  try { if (localStorage.getItem('gx.off') === '1') return; } catch (e) {}

  const GX = { prev: null, press: null, eatClick: 0 };
  window.GEMUX = GX;

  const esc2 = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const call = (fn, ...a) => { try { return fn(...a); } catch (e) { return undefined; } };
  const gemBy = (u) => (typeof S !== 'undefined' && S && S.gems ? S.gems.find((g) => g.u === +u) : null);
  const nameOf = (g) => call(() => gemNm(g)) || (SKILLS[g.id] && SKILLS[g.id].n) || g.id;
  const iconOf = (id) => call(() => roSkillIcon(id)) || '';
  const tagsOf = (sk) => call(() => tagText(sk)) || '';
  const names = (list) => list.map((g) => esc2(nameOf(g))).join('、');

  // 讓遊戲原本的點擊路由處理（跟玩家點到原生按鈕完全一樣）
  function engineAct(act, u) {
    const b = document.createElement('button');
    b.dataset.act = act;
    if (u != null) b.dataset.u = u;
    document.querySelector('#panel').appendChild(b);
    try { onPanelClick({ target: b, preventDefault() {}, stopPropagation() {} }); }
    finally { b.remove(); }
  }

  // ---------- 說明卡 ----------
  function linkInfo(g) {
    const sk = SKILLS[g.id];
    if (g.x < 0) return '';
    if (sk.act) {
      const ok = call(() => linkedSupports(g)) || [];
      const bad = (call(() => adjSupports(g)) || []).filter((s) => !ok.some((o) => o.u === s.u));
      return (ok.length ? `<p class="gx-ok">✔ 連動輔助：${names(ok)}</p>` : '<p class="gx-mute">旁邊還沒有連動的輔助寶石</p>') +
        (bad.length ? `<p class="gx-bad">✖ 相鄰但標籤不合：${names(bad)}</p>` : '');
    }
    const acts = (call(() => activeGems()) || []).filter((a) => (call(() => linkedSupports(a)) || []).some((s) => s.u === g.u));
    return acts.length ? `<p class="gx-ok">✔ 正在強化：${names(acts)}</p>` : '<p class="gx-bad">✖ 還沒強化任何技能：要貼著標籤相符的主動寶石</p>';
  }

  function cardHtml(g, mode) {
    const sk = SKILLS[g.id];
    const meta = [sk.act ? '主動' : '輔助', tagsOf(sk), sk.act && sk.cd && !sk.sus ? `冷卻 ${sk.cd} 秒` : ''].filter(Boolean).join('・');
    let acts = '', hint = '', warn = '';
    if (mode === 'preview') {
      acts = `<button class="btn primary gx-big" data-gx="auto" data-u="${g.u}">放入格子</button><button class="btn gx-big" data-gx="close">返回</button>`;
      hint = '也可以按住寶石往上拖到格子裡';
    } else if (mode === 'ghost') {
      warn = '<p class="gx-bad">⚠ 紅色＝放不下：拖到空位、點空格或旋轉</p>';
      acts = '<button class="btn gx-big" data-act="rot">↻ 旋轉</button><button class="btn gx-big" data-act="desel">放回</button>';
    } else {
      acts = '<button class="btn gx-big" data-act="rot">↻ 旋轉</button><button class="btn gx-big" data-act="unplace">取下</button><button class="btn primary gx-big" data-act="desel">完成</button>';
      hint = '點空格＝移到那裡；按住拖曳也可以；點別顆寶石切換';
    }
    return `<div class="gx-card" data-mode="${mode}">
      <div class="gx-head"><img src="${iconOf(g.id)}" alt=""><div class="gx-tt"><b>${esc2(nameOf(g))}</b><small>${esc2(meta)}</small></div></div>
      <p class="gx-desc">${esc2(sk.d)}</p>${warn}${mode === 'placed' ? linkInfo(g) : ''}
      <div class="gx-acts">${acts}</div>${hint ? `<p class="gx-hint">${hint}</p>` : ''}
    </div>`;
  }

  function currentCard() {
    const sel = gemBy(ui.selGem);
    if (sel) return cardHtml(sel, ui.ghost && ui.ghost.u === sel.u ? 'ghost' : sel.x >= 0 ? 'placed' : 'preview');
    const pv = gemBy(GX.prev);
    if (pv && pv.x < 0) return cardHtml(pv, 'preview');
    GX.prev = null;
    return '';
  }

  // ---------- 重組技能面板 HTML ----------
  function install() {
    if (typeof ui === 'undefined' || typeof ui.p_skill !== 'function' || ui.p_skill.__gx) return !!(ui && ui.p_skill && ui.p_skill.__gx);
    const base = ui.p_skill;
    ui.p_skill = function (...args) {
      const html = base.apply(this, args);
      try {
        const a = html.indexOf('<button class="trayHd"');
        if (a < 0) return html;
        let z = html.indexOf('<h3 class="ro-link-heading"', a);
        if (z < 0) z = html.lastIndexOf('</section>');
        if (z < 0) return html;
        const card = currentCard();
        return html.slice(0, a) + `<div class="gx-dock${card ? ' gx-has-card' : ''}">${card}${html.slice(a, z)}</div>` + html.slice(z);
      } catch (e) { return html; }
    };
    ui.p_skill.__gx = true;
    try { if (ui.tab === 'skill') ui.render(); } catch (e) {}
    return true;
  }

  // ---------- 手勢：「點一下」= 看說明／選取，不要進入遊戲原本的「拿起」模式 ----------
  // 原本：點托盤寶石或格子裡的寶石，都會把寶石「拿起」浮著，要再點格子才放下，而且看不到說明。
  // 現在：短按（移動 < 5px）改成選取並顯示說明卡；按住拖曳仍交給遊戲原本的拖放。
  const trayGem = (t) => t && t.closest && t.closest('#tray [data-act="gem"]');
  function gemAtCell(btn) {
    const x = +btn.dataset.x, y = +btn.dataset.y, hit = (cs) => cs.some(([a, b]) => a === x && b === y);
    const gh = ui.ghost, gg = gh && gemBy(gh.u);
    if (gg && hit(call(() => gemCells(gg, gh.x, gh.y, gh.rot)) || [])) return gg;
    return (call(() => placed()) || []).find((g) => hit(call(() => gemCells(g)) || [])) || null;
  }
  window.addEventListener('pointerdown', (e) => {
    GX.press = null;
    if (e.button > 0) return;
    const t = trayGem(e.target);
    if (t) {
      const tr = document.querySelector('#tray');
      return void (GX.press = { id: e.pointerId, x: e.clientX, y: e.clientY, u: +t.dataset.u, tray: true, sl: tr ? tr.scrollLeft : 0, mode: null });
    }
    const c = e.target.closest && e.target.closest('#sgrid button');
    const g = c && gemAtCell(c);
    if (g) GX.press = { id: e.pointerId, x: e.clientX, y: e.clientY, u: g.u, tray: false };
  }, true);
  // 寶石列上「橫向滑」= 捲動寶石列（自己捲，不交給遊戲，否則遊戲會當成拖曳）；
  // 往上／斜上拖 = 交給遊戲原本的拖曳放進格子。
  window.addEventListener('pointermove', (e) => {
    const p = GX.press;
    if (!p || !p.tray || p.id !== e.pointerId || p.mode === 'drag') return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    if (!p.mode) {
      if (Math.hypot(dx, dy) < 5) return;
      p.mode = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'scroll' : 'drag';
      if (p.mode === 'drag') return;
    }
    e.stopImmediatePropagation();
    const tr = document.querySelector('#tray');
    if (tr) tr.scrollLeft = p.sl - dx;
  }, true);
  window.addEventListener('pointerup', (e) => {
    const p = GX.press;
    GX.press = null;
    if (!p || p.id !== e.pointerId) return;
    if (p.mode === 'scroll') {
      e.stopImmediatePropagation();
      call(() => dragStop(false));
      GX.eatClick = performance.now();
      return;
    }
    if (p.mode === 'drag' || Math.hypot(e.clientX - p.x, e.clientY - p.y) >= 5) return;
    e.stopImmediatePropagation();          // 不讓遊戲進入「拿起」模式
    call(() => dragStop(false));            // 清掉 pointerdown 留下的待命拖曳
    if (p.tray) {
      call(() => dropGhost());
      ui.selGem = null;
      GX.prev = p.u;
    } else {
      if (ui.ghost && ui.ghost.u !== p.u) call(() => dropGhost());
      ui.selGem = p.u;
      GX.prev = null;
    }
    GX.eatClick = performance.now();
    ui.render();
  }, true);
  window.addEventListener('pointercancel', () => { GX.press = null; }, true);
  window.addEventListener('click', (e) => {
    if (performance.now() - GX.eatClick < 600 && e.target.closest && e.target.closest('#tray [data-act="gem"], #sgrid button')) { e.stopImmediatePropagation(); e.preventDefault(); GX.eatClick = 0; return; }
    // 沒經過 pointer 事件的點擊（鍵盤 Enter／部分瀏覽器只送 click）：托盤寶石一樣是「看說明」，不要直接放進去
    const tg = trayGem(e.target);
    if (tg) {
      e.stopImmediatePropagation(); e.preventDefault();
      call(() => dropGhost());
      ui.selGem = null;
      GX.prev = +tg.dataset.u;
      ui.render();
      return;
    }
    const b = e.target.closest && e.target.closest('[data-gx]');
    if (!b) return;
    e.stopImmediatePropagation(); e.preventDefault();
    const k = b.dataset.gx;
    if (k === 'close') { GX.prev = null; ui.render(); }
    else if (k === 'auto') { GX.prev = null; engineAct('gem', b.dataset.u); }
  }, true);

  // ---------- 樣式 ----------
  const st = document.createElement('style');
  st.id = 'gemuxCss';
  st.textContent = `
#panel .gx-dock{position:sticky;bottom:0;z-index:6;margin:10px -12px 0;padding:8px 12px calc(8px + env(safe-area-inset-bottom,0px));
  background:var(--paper,#f4f7fb);border-top:1px solid rgba(90,120,150,.35);box-shadow:0 -8px 18px rgba(30,50,80,.14)}
#panel .gx-dock .trayHd{position:static!important;margin:0 0 4px!important;padding:3px 8px!important;min-height:0!important;font-size:12px!important;line-height:18px!important;border-radius:6px}
#panel .gx-dock > .seg{margin:0 0 6px!important}
#panel .gx-dock > .seg button{min-height:30px!important;padding:2px 8px!important}
#panel .gx-dock #tray{display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;overflow-x:auto!important;overflow-y:hidden!important;
  gap:6px;padding:2px 2px 6px;margin:0!important;touch-action:none;overscroll-behavior-x:contain;scrollbar-width:thin;max-height:none!important}
#panel .gx-dock #tray .gem{touch-action:none!important}
#panel .gx-dock #tray > .gem,#panel .gx-dock #tray .gvar > .gem{flex:0 0 auto!important;width:76px!important;min-width:0!important;max-width:none!important;
  flex-direction:column!important;align-items:center!important;justify-content:flex-start!important;text-align:center;padding:5px 4px 4px!important;gap:1px!important;
  min-height:0!important;font-size:12px!important;line-height:1.3!important}
#panel .gx-dock #tray .gem > span:last-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
#panel .gx-dock #tray .gem small{display:none!important}
#panel .gx-dock #tray .gem .ro-gem-icon{width:28px!important;height:28px!important;margin:0!important}
#panel .gx-dock #tray .gem .shape{transform:scale(.75);transform-origin:center;margin:-2px 0!important}
#panel .gx-dock #tray .gvar{display:flex!important;flex:0 0 auto!important;flex-direction:row!important;gap:6px;align-items:stretch;margin:0!important}
#panel .gx-dock #tray .gem[aria-pressed="true"]{outline:2px solid #5aa0e0}
#panel .gx-dock.gx-has-card > :not(.gx-card),#panel .gx-dock.gx-has-card > #tray{display:none!important}
#panel .ro-gem-tools [data-act="rot"],#panel .ro-gem-tools [data-act="unplace"],#panel .ro-gem-tools [data-act="desel"]{display:none!important}
.gx-card{font-size:14px;line-height:1.55}
.gx-card .gx-head{display:flex;gap:10px;align-items:center;margin-bottom:4px}
.gx-card .gx-head img{width:40px;height:40px;image-rendering:pixelated;flex:none}
.gx-card .gx-tt{display:flex;flex-direction:column;min-width:0}
.gx-card .gx-tt b{font-size:16px}
.gx-card .gx-tt small{color:var(--muted,#6b7f95);font-size:12px}
.gx-card p{margin:4px 0}
.gx-card .gx-desc{background:rgba(255,255,255,.6);border-radius:8px;padding:6px 8px}
.gx-card .gx-ok{color:#2c8a55;font-size:13px}
.gx-card .gx-bad{color:#b4443c;font-size:13px}
.gx-card .gx-mute,.gx-card .gx-hint{color:var(--muted,#6b7f95);font-size:12px}
.gx-card .gx-acts{display:flex;gap:8px;margin-top:8px}
.gx-card .gx-big{flex:1;min-height:44px;font-size:15px}
`;
  document.head.appendChild(st);

  let tries = 0;
  const boot = setInterval(() => { tries++; if (install() || tries > 300) clearInterval(boot); }, 100);
})();
