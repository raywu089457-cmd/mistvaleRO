/* 技能寶石盤操作改良（本機鏡像自己加的，不改原始遊戲腳本）
 *
 * 1. 寶石托盤 → 固定在面板底部的「寶石列」（橫向捲動），格子跟寶石永遠同時看得到
 * 2. 點托盤寶石 = 先看說明卡（名稱／主動輔助／標籤／冷卻／完整說明），按「放入格子」才放
 *    （原本點一下會直接「拿起」浮在格子上，看不到說明）；要拖曳也可以，往上拖到格子即可
 * 3. 點格子裡的寶石 → 說明卡顯示連動狀況，一排大按鈕：← ↑ ↓ → 移一格、↻ 原地旋轉（繞中心）、取下、完成
 *    點空格 = 方塊（以中心）移過去，而且保持選取，可以連續微調
 * 4. 放入前可以先在預覽卡選方向；拖曳時方塊浮在手指上方，不會被手指擋住
 * 5. 放不下（紅色）時，說明卡直接告訴你，並給旋轉／放回
 * 6. 觸控時已放好的方塊要按住約 0.25 秒才能拖（快速滑動＝捲動）；拖曳不會把方塊拉下來（放到外面／放不下 → 回原位）
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

  // ---------- 方塊幾何：以「方塊中心」為準，而不是左上角的錨點 ----------
  const centerOf = (cs) => [cs.reduce((s, c) => s + c[0], 0) / cs.length, cs.reduce((s, c) => s + c[1], 0) / cs.length];
  // 找一個放得下、而且中心最接近 (cx,cy) 的位置；cover = 必須蓋住的格子
  function fitNear(g, rot, cx, cy, cover, radius = 3) {
    const c0 = centerOf(gemCells(g, 0, 0, rot));
    const bx = Math.round(cx - c0[0]), by = Math.round(cy - c0[1]);
    let best = null, bd = Infinity;
    for (let dy = -radius; dy <= radius; dy++)
      for (let dx = -radius; dx <= radius; dx++) {
        const x = bx + dx, y = by + dy;
        if (!canPlace(g, x, y, rot)) continue;
        const cs = gemCells(g, x, y, rot);
        if (cover && !cs.some(([a, b]) => a === cover[0] && b === cover[1])) continue;
        const c = centerOf(cs), d = (c[0] - cx) ** 2 + (c[1] - cy) ** 2;
        if (d < bd) (bd = d), (best = { x, y, rot });
      }
    return best;
  }
  const say = (m, bad) => call(() => toast(m, bad ? 'bad' : ''));
  function put(g, s) { placeGem(g, s.x, s.y, s.rot); ui.selGem = g.u; GX.prev = null; ui.render(); }

  // 旋轉：繞方塊中心轉，原地放不下就找最近的空位
  function rotatePlaced(g) {
    const r = (g.rot + 1) % 4, [cx, cy] = centerOf(gemCells(g));
    const s = fitNear(g, r, cx, cy, null, 2);
    s ? put(g, s) : say('轉過來會撞到別的寶石，先移到空一點的地方再轉', 1);
  }
  // 方向鍵：往那個方向移一格；擋住就跳過去找下一個空位
  function nudge(g, dx, dy) {
    for (let k = 1; k <= 5; k++) if (canPlace(g, g.x + dx * k, g.y + dy * k, g.rot)) return put(g, { x: g.x + dx * k, y: g.y + dy * k, rot: g.rot });
    say('那個方向沒有空位', 1);
  }
  // 放入格子：用預覽選好的方向，找第一個放得下的位置
  function autoPut(g, rot) {
    for (const k of UNLOCK_ORDER) {
      const [x, y] = k.split(',').map(Number);
      if (canPlace(g, x, y, rot)) return put(g, { x, y, rot });
    }
    for (let r = 0; r < 4; r++) if (r !== rot) for (const k of UNLOCK_ORDER) {
      const [x, y] = k.split(',').map(Number);
      if (canPlace(g, x, y, r)) { say('這個方向放不下，已換個方向放入'); return put(g, { x, y, rot: r }); }
    }
    say('沒有放得下這個形狀的空位：先取下或移開其他寶石', 1);
  }
  function shapeSvg(g, rot, cell) {
    const a = call(() => gemArt(g.id, rot, 5, g.sh, g.sx));
    return a ? `<span class="gx-shape" style="width:${a.W * cell / 5}px;height:${a.H * cell / 5}px">${a.svg}</span>` : '';
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
    let acts = '', hint = '', warn = '', side = '';
    if (mode === 'preview') {
      const r = GX.prot || 0;
      side = `<button class="gx-shapebox" data-gx="prot" aria-label="轉向">${shapeSvg(g, r, 13)}<span>↻ 轉向</span></button>`;
      acts = `<button class="btn primary gx-big" data-gx="auto" data-u="${g.u}">放入格子</button><button class="btn gx-big" data-gx="close">返回</button>`;
      hint = '點左邊的形狀＝轉向；按住形狀往上拖＝直接放到想要的格子';
    } else if (mode === 'ghost') {
      warn = '<p class="gx-bad">⚠ 紅色＝放不下：拖到空位、點空格或旋轉</p>';
      acts = '<button class="btn gx-big" data-act="rot">↻ 旋轉</button><button class="btn gx-big" data-act="desel">放回</button>';
    } else {
      acts = `<button class="btn gx-ico" data-gx="mv" data-d="l" aria-label="左移">←</button><button class="btn gx-ico" data-gx="mv" data-d="u" aria-label="上移">↑</button>` +
        `<button class="btn gx-ico" data-gx="mv" data-d="d" aria-label="下移">↓</button><button class="btn gx-ico" data-gx="mv" data-d="r" aria-label="右移">→</button>` +
        `<button class="btn gx-ico" data-gx="rot" aria-label="旋轉">↻</button><button class="btn gx-ico gx-txt" data-act="unplace">取下</button>` +
        `<button class="btn primary gx-ico gx-txt" data-act="desel">完成</button>`;
      hint = '方向鍵移一格・↻ 原地旋轉・點空格直接移過去・也可以按住拖曳';
    }
    return `<div class="gx-card" data-mode="${mode}">
      <div class="gx-head">${side || `<img src="${iconOf(g.id)}" alt="">`}<div class="gx-tt"><b>${esc2(nameOf(g))}</b><small>${esc2(meta)}</small></div></div>
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

  // 選取的方塊如果被底部說明卡蓋住，把面板捲到剛好看得到（只在選取／位置改變時做，不跟玩家的捲動打架）
  function revealSel() {
    const g = gemBy(ui.selGem), gh = ui.ghost && ui.ghost.u === (g && g.u) ? ui.ghost : null;
    if (!g || (g.x < 0 && !gh)) return;
    const key = [g.u, gh ? gh.x : g.x, gh ? gh.y : g.y, gh ? gh.rot : g.rot].join();
    if (GX.revealed === key) return;
    GX.revealed = key;
    const cs = gh ? gemCells(g, gh.x, gh.y, gh.rot) : gemCells(g), btns = document.querySelectorAll('#sgrid button');
    const dock = document.querySelector('.gx-dock'), panel = document.querySelector('#panel');
    if (!dock || !panel || !btns.length) return;
    const bottom = Math.max(...cs.map(([x, y]) => btns[6 * y + x]?.getBoundingClientRect().bottom || 0));
    const top = Math.min(...cs.map(([x, y]) => btns[6 * y + x]?.getBoundingClientRect().top || 1e9));
    const over = bottom + 8 - dock.getBoundingClientRect().top, room = top - panel.getBoundingClientRect().top - 4;
    if (over > 0) panel.scrollTop += Math.min(over, Math.max(0, room));
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
        if (card) setTimeout(revealSel, 0);
        return html.slice(0, a) + `<div class="gx-dock${card ? ' gx-has-card' : ''}">${card}${html.slice(a, z)}</div>` + html.slice(z);
      } catch (e) { return html; }
    };
    ui.p_skill.__gx = true;
    wrapDrag();
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
    if (!c) return;
    const g = gemAtCell(c), touch = e.pointerType !== 'mouse', pn = document.querySelector('#panel');
    const p = GX.press = { id: e.pointerId, x: e.clientX, y: e.clientY, u: g ? g.u : null, tray: false, cell: true,
      st0: pn ? pn.scrollTop : 0, armed: !!g && !touch, mode: null };
    // 觸控：已放好的方塊要「按住約 0.25 秒」才可以拖（亮起＋震動），快速滑動＝捲動面板，不會誤抓
    if (g && touch) p.timer = setTimeout(() => {
      if (GX.press !== p || p.mode) return;
      p.armed = true;
      document.querySelectorAll(`#sgrid .gov[data-u="${g.u}"],#sgrid .gname[data-u="${g.u}"]`).forEach((el) => el.classList.add('gx-armed'));
      gemCells(g).forEach(([x, y]) => document.querySelectorAll('#sgrid button')[6 * y + x]?.classList.add('gx-armed'));
      try { navigator.vibrate && navigator.vibrate(15); } catch (er) {}
    }, 250);
  }, true);
  // 寶石列上「橫向滑」= 捲動寶石列（自己捲，不交給遊戲，否則遊戲會當成拖曳）；
  // 往上／斜上拖 = 交給遊戲原本的拖曳放進格子。
  window.addEventListener('pointermove', (e) => {
    const p = GX.press;
    if (p && p.cell && p.id === e.pointerId) {
      if (p.mode === 'drag') return;
      const dy = e.clientY - p.y;
      if (!p.mode) {
        if (p.armed && p.u != null) {            // 已按住 → 交給遊戲拖曳
          if (Math.hypot(e.clientX - p.x, dy) >= 5) { p.mode = 'drag'; GX.dragU = p.u; }
          return;
        }
        if (Math.hypot(e.clientX - p.x, dy) < 6) { if (p.u != null) e.stopImmediatePropagation(); return; }
        p.mode = 'scroll'; clearTimeout(p.timer); call(() => dragStop(false));
      }
      e.stopImmediatePropagation();
      const pn = document.querySelector('#panel');
      if (pn) pn.scrollTop = p.st0 - dy;
      return;
    }
    if (!p || !p.tray || p.id !== e.pointerId || p.mode === 'drag') return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    if (!p.mode) {
      if (Math.hypot(dx, dy) < 5) return;
      p.mode = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'scroll' : 'drag';
      if (p.mode === 'drag') { GX.dragRot = p.u === GX.prev ? GX.prot || 0 : 0; GX.dragU = p.u; return; }
    }
    e.stopImmediatePropagation();
    const tr = document.querySelector('#tray');
    if (tr) tr.scrollLeft = p.sl - dx;
  }, true);
  window.addEventListener('pointerup', (e) => {
    const p = GX.press;
    GX.press = null;
    if (!p || p.id !== e.pointerId) return;
    clearTimeout(p.timer);
    if (p.cell && p.u == null && p.mode !== 'scroll') return;   // 點空格：交給 click（移動選取的方塊）
    if (p.mode === 'scroll') {
      e.stopImmediatePropagation();
      call(() => dragStop(false));
      GX.eatClick = performance.now();
      return;
    }
    if (p.shape && Math.hypot(e.clientX - p.x, e.clientY - p.y) < 5) { e.stopImmediatePropagation(); call(() => dragStop(false)); return; }
    if (p.mode === 'drag' || Math.hypot(e.clientX - p.x, e.clientY - p.y) >= 5) return;
    e.stopImmediatePropagation();          // 不讓遊戲進入「拿起」模式
    call(() => dragStop(false));            // 清掉 pointerdown 留下的待命拖曳
    if (p.tray) {
      call(() => dropGhost());
      ui.selGem = null;
      if (GX.prev !== p.u) GX.prot = 0;
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
      if (GX.prev !== +tg.dataset.u) GX.prot = 0;
      GX.prev = +tg.dataset.u;
      ui.render();
      return;
    }
    const b = e.target.closest && e.target.closest('[data-gx]');
    if (!b) return;
    e.stopImmediatePropagation(); e.preventDefault();
    const k = b.dataset.gx, sel = gemBy(ui.selGem);
    if (k === 'close') { GX.prev = null; ui.render(); }
    else if (k === 'prot') { GX.prot = ((GX.prot || 0) + 1) % 4; ui.render(); }
    else if (k === 'auto') { const g = gemBy(b.dataset.u); if (g) autoPut(g, GX.prot || 0); }
    else if (k === 'rot' && sel && sel.x >= 0) rotatePlaced(sel);
    else if (k === 'mv' && sel && sel.x >= 0) nudge(sel, ...({ l: [-1, 0], r: [1, 0], u: [0, -1], d: [0, 1] }[b.dataset.d]));
  }, true);

  // ---------- 點空格：把選取的方塊移過去（以方塊中心對準點的格子，並保持選取）----------
  window.addEventListener('click', (e) => {
    const c = e.target.closest && e.target.closest('#sgrid button');
    const g = c && gemBy(ui.selGem);
    if (!g || g.x < 0 || (ui.ghost && ui.ghost.u === g.u) || gemAtCell(c)) return;   // 只處理「已放好的方塊 → 點空格」
    const x = +c.dataset.x, y = +c.dataset.y;
    if (!call(() => openSet().has(x + ',' + y))) return;
    e.stopImmediatePropagation(); e.preventDefault();
    const s = fitNear(g, g.rot, x, y, [x, y]) || [1, 2, 3].map((d) => fitNear(g, (g.rot + d) % 4, x, y, [x, y])).find(Boolean);
    s ? put(g, s) : say('那裡放不下這個形狀', 1);
  }, true);

  // ---------- 拖曳：方塊浮在手指上方，不會被手指擋住 ----------
  // 遊戲把拖曳中的方塊畫在手指正下方，落點也是手指下的格子 → 手機上完全看不到要放哪。
  // 觸控拖曳時把「落點判定」和「方塊圖」一起往上移約 1.3 格（剛開始拖時逐漸拉開，避免方塊一按就跳）。
  const cellPx = () => { const b = document.querySelector('#sgrid button'); return b ? b.getBoundingClientRect().width : 40; };
  const lift = () => (GX.touch ? Math.min(cellPx() * 1.3, (GX.dist || 0) * 0.8) : 0);
  window.addEventListener('pointerdown', (e) => { GX.touch = e.pointerType === 'touch' || e.pointerType === 'pen'; GX.p0 = [e.clientX, e.clientY]; GX.dist = 0; }, true);
  window.addEventListener('pointermove', (e) => { if (GX.p0) GX.dist = Math.max(GX.dist || 0, Math.hypot(e.clientX - GX.p0[0], e.clientY - GX.p0[1])); }, true);
  window.addEventListener('pointerup', () => { GX.p0 = null; }, true);
  function wrapDrag() {
    if (typeof dragCellAt !== 'function' || dragCellAt.__gx) return;
    const cellAt = dragCellAt, paint = dragPaint, start = dragStart;
    window.dragCellAt = function (x, y) { return cellAt.call(this, x, y - lift()); };
    window.dragCellAt.__gx = true;
    window.dragPaint = function (...a) {
      const r = paint.apply(this, a), f = document.getElementById('dragGem'), L = lift();
      if (f && L) f.style.transform = f.style.transform.replace(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/, (m, x, y) => `translate(${x}px,${+y - L}px)`);
      return r;
    };
    // 從預覽卡拖出去時，套用預覽選好的方向
    window.dragStart = function (...a) {
      const g0 = gemBy(GX.dragU);
      GX.dragFrom = g0 && g0.x >= 0 ? { x: g0.x, y: g0.y, rot: g0.rot } : null;
      const r = start.apply(this, a), n = GX.dragRot || 0;
      GX.dragRot = 0;
      for (let i = 0; i < n; i++) call(() => dragRotate());
      return r;
    };
    // 放下之後保持選取那顆，方便馬上用方向鍵／旋轉微調
    const stop = dragStop;
    // 拖曳不會把方塊「拉下來」：放到格子外或放不下的地方 → 回到原位；要取下只能按「取下」
    // 拖到另一顆上 = 互換（被換的那顆直接放到空出來的位置，不會變成浮著要再點一次）
    window.dragStop = function (ok, ...a) {
      const u = GX.dragU, from = GX.dragFrom;
      GX.dragU = null; GX.dragFrom = null;
      const before = (call(() => placed()) || []).map((x) => x.u);
      const r = stop.call(this, ok, ...a), g = u != null && gemBy(u);
      if (!ok || !g) return r;
      const held = document.getElementById('dragGem');
      const displaced = before.map(gemBy).find((x) => x && x.u !== g.u && x.x < 0);
      if (held && displaced) {                    // 遊戲的互換：被換下的那顆變成「拿起」狀態 → 直接幫它找位置
        stop.call(this, false);
        const c = from ? centerOf(gemCells(g, from.x, from.y, from.rot)) : centerOf(gemCells(g));
        const s = fitNear(displaced, displaced.rot, c[0], c[1], null, 3) || [1, 2, 3].map((d) => fitNear(displaced, (displaced.rot + d) % 4, c[0], c[1], null, 3)).find(Boolean);
        if (s) placeGem(displaced, s.x, s.y, s.rot); else say('被換下的寶石放回寶石列');
      }
      const ghost = ui.ghost && ui.ghost.u === g.u;
      if (g.x < 0 && from) {                      // 被拉到格子外，或放在放不下的地方
        ui.ghost = null;
        if (canPlace(g, from.x, from.y, from.rot)) placeGem(g, from.x, from.y, from.rot);
        say(ghost ? '那裡放不下，已放回原位' : '已放回原位（要取下請按「取下」）');
      } else if (g.x < 0 && ghost) {              // 從寶石列拖進來但放不下
        ui.ghost = null;
        say('那裡放不下這個形狀，換個位置試試', 1);
      }
      if (g.x >= 0) { ui.selGem = g.u; GX.prev = null; }
      ui.render();
      return r;
    };
  }

  // 預覽卡左邊的形狀：點一下＝轉向；按住往上拖＝用這個方向拖進格子
  window.addEventListener('pointerdown', (e) => {
    const box = e.target.closest && e.target.closest('.gx-shapebox');
    const g = box && gemBy(GX.prev);
    if (!g || e.button > 0) return;
    const chip = document.querySelector(`#tray [data-act="gem"][data-u="${g.u}"]`);
    if (!chip) return;
    // 讓遊戲以為是從托盤那顆寶石按下去（托盤在卡片模式下只是隱藏），之後的移動照常由遊戲處理
    chip.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: e.pointerId, pointerType: e.pointerType,
      isPrimary: true, button: 0, buttons: 1, clientX: e.clientX, clientY: e.clientY }));
    GX.press = { id: e.pointerId, x: e.clientX, y: e.clientY, u: g.u, tray: true, mode: 'drag', shape: true };
    GX.dragRot = GX.prot || 0;
    GX.dragU = g.u;
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
#sgrid .gx-armed{filter:brightness(1.18) drop-shadow(0 4px 6px rgba(20,40,70,.35));transform:scale(1.04);transition:transform .08s}
.gx-card{font-size:13px;line-height:1.45}
.gx-card .gx-head{display:flex;gap:10px;align-items:center;margin-bottom:2px}
.gx-card .gx-head img{width:34px;height:34px;image-rendering:pixelated;flex:none}
.gx-card .gx-tt{display:flex;flex-direction:column;min-width:0}
.gx-card .gx-tt b{font-size:16px}
.gx-card .gx-tt small{color:var(--muted,#6b7f95);font-size:12px}
.gx-card p{margin:3px 0}
.gx-card .gx-desc{background:rgba(255,255,255,.6);border-radius:8px;padding:4px 8px}
.gx-card .gx-ok{color:#2c8a55;font-size:13px}
.gx-card .gx-bad{color:#b4443c;font-size:13px}
.gx-card .gx-mute,.gx-card .gx-hint{color:var(--muted,#6b7f95);font-size:11.5px}
.gx-card .gx-acts{display:flex;gap:6px;margin-top:6px}
.gx-card .gx-big{flex:1;min-height:44px;font-size:15px}
.gx-card .gx-acts .gx-ico{flex:1 1 0;min-width:0;min-height:46px;padding:0!important;font-size:22px;line-height:1}
.gx-card .gx-acts .gx-ico.gx-txt{flex:1.4 1 0;font-size:14px}
.gx-card .gx-shapebox{touch-action:none;flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-width:64px;min-height:64px;
  padding:4px;border:1px dashed rgba(90,120,150,.5);border-radius:8px;background:rgba(255,255,255,.7);cursor:pointer;font:12px/1.2 inherit;color:#456}
.gx-card .gx-shape{display:block}
.gx-card .gx-shape svg{width:100%;height:100%;display:block}
`;
  document.head.appendChild(st);

  let tries = 0;
  const boot = setInterval(() => { tries++; if (install() || tries > 300) clearInterval(boot); }, 100);
})();
