/* 開發者測試工具（本機/自架版專用）
 * 用法：開「選單」分頁 → 最下方多一個「開發者測試」→ 點開就是測試面板
 * 這個檔案不改動任何原始遊戲腳本，只在載入後掛上去。
 */
(function () {
  'use strict';

  const DEV = {
    god: false,
    one: false,
    speed: 1,
    overlay: false,
    installed: false,
  };
  window.DEVMODE = DEV;

  // ---------- 工具 ----------
  const warn = (m) => { try { toast(m, 'bad'); } catch (e) { console.warn(m); } };
  const info = (m) => { try { toast(m, 'lvl'); } catch (e) { console.log(m); } };
  const dirty = () => { try { markDirty(); } catch (e) {} };
  const recompute = () => { try { recalc(); } catch (e) {} };

  const need = () => typeof S !== 'undefined' && S && typeof PS !== 'undefined' && PS;

  // ---------- 各項測試功能 ----------
  const CMD = {
    lv10() { if (!need()) return warn('還沒進遊戲'); S.lvl = Math.min(127, (S.lvl | 0) + 10); recompute(); dirty(); info('等級 → ' + S.lvl); },
    lvmax() { if (!need()) return warn('還沒進遊戲'); S.lvl = 127; recompute(); dirty(); info('等級 → 127'); },
    xp() { if (!need()) return warn('還沒進遊戲'); S.xp = (S.xp | 0) + 100000; dirty(); info('經驗 +100000'); },
    tal() { if (!need()) return warn('還沒進遊戲'); try { S.tal.n = (S.tal.n | 0) + 50; } catch (e) { return warn('天賦結構不符'); } dirty(); info('天賦點 +50'); },
    heal() { if (!need()) return warn('還沒進遊戲'); S.hp = PS.maxhp; dirty(); info('HP 已補滿'); },
    pot() { if (!need()) return warn('還沒進遊戲'); S.pot = (S.pot | 0) + 99; dirty(); info('藥水 +99'); },
    res() {
      if (!need()) return warn('還沒進遊戲');
      let n = 0;
      for (const k of ['ash', 'gp']) if (typeof S[k] === 'number') { S[k] += 100000; n++; }
      if (S.gd && typeof S.gd === 'object') for (const k of Object.keys(S.gd)) if (typeof S.gd[k] === 'number') { S.gd[k] += 1000; n++; }
      dirty(); info(n ? `資源 +（${n} 個欄位）` : '找不到資源欄位');
    },
    unlock() {
      if (!need()) return warn('還沒進遊戲');
      S.unlocked = (typeof MAPS !== 'undefined' ? MAPS.length - 1 : 15);
      if (Array.isArray(S.prog)) S.prog = S.prog.map(() => 1);
      if (Array.isArray(S.beat)) S.beat = S.beat.map(() => 1);
      dirty(); info('全地圖已解鎖');
    },
    god() {
      DEV.god = !DEV.god;
      info(DEV.god ? '無敵：開' : '無敵：關');
      ui.reload && ui.reload();
    },
    one() {
      if (!DEV.one && typeof hitMob === 'function' && !hitMob.__wrapped) {
        const orig = hitMob;
        window.hitMob = function (t, a, s) { return orig.call(this, t, (a || 1) * (DEV.one ? 99999 : 1), s); };
        window.hitMob.__wrapped = true;
      }
      DEV.one = !DEV.one;
      info(DEV.one ? '一擊必殺：開' : '一擊必殺：關');
    },
    clear() {
      if (!need() || !G || !Array.isArray(G.mobs)) return warn('沒有場上怪物');
      let n = 0;
      for (const m of G.mobs) { try { m.hp = 0; n++; } catch (e) {} }
      info(`已清空 ${n} 隻`);
    },
    boss() {
      if (!need() || !G) return warn('還沒進遊戲');
      try {
        const map = MAPS[S.map] || MAPS[0];
        addMob(map.bt || 'slime', S.lvl, G.pl.x + 60, G.pl.y, { boss: true });
        info('已召喚 BOSS：' + (map.bt || 'slime'));
      } catch (e) { warn('召喚失敗：' + e.message); }
    },
    swarm() {
      if (!need() || !G) return warn('還沒進遊戲');
      try {
        const map = MAPS[S.map] || MAPS[0];
        const list = map.m || ['slime'];
        for (let i = 0; i < 20; i++) {
          addMob(list[i % list.length], S.lvl, G.pl.x + (Math.random() * 200 - 100), G.pl.y + (Math.random() * 160 - 80), {});
        }
        info('已生成 20 隻');
      } catch (e) { warn('生成失敗：' + e.message); }
    },
    spd() {
      DEV.speed = DEV.speed === 1 ? 2 : DEV.speed === 2 ? 5 : 1;
      if (typeof tick === 'function' && !tick.__wrapped) {
        const orig = tick;
        window.tick = function (dt) { return orig.call(this, dt * DEV.speed); };
        window.tick.__wrapped = true;
      }
      info('遊戲速度 ×' + DEV.speed);
    },
    overlay() { DEV.overlay = !DEV.overlay; info('除錯資訊：' + (DEV.overlay ? '開' : '關')); },
    dump() {
      if (!need()) return warn('還沒進遊戲');
      const out = { lvl: S.lvl, xp: S.xp, hp: S.hp, map: S.map, unlocked: S.unlocked, cls: S.cls, name: S.name, cid: S.cid };
      try { out.ps = { maxhp: PS.maxhp, dmg: PS.dmg, dmgMul: PS.dmgMul, crit: PS.critRaw }; } catch (e) {}
      console.log('[DEV] state', out, S);
      info('已輸出到 console');
    },
    roFail() {
      try {
        const f = (typeof RO !== 'undefined' && RO.failed) || [];
        console.log('[DEV] RO.failed =', f);
        info(f.length ? `素材載入失敗 ${f.length} 筆（詳見 console）` : '素材載入失敗：0 筆');
      } catch (e) { warn('無法讀取 RO.failed'); }
    },
    exportSave() {
      try {
        const raw = localStorage.getItem('ro-wanderer.v3.v1');
        const blob = new Blob([raw || ''], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'xianjingro-save-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '') + '.json';
        a.click();
        info('存檔已匯出');
      } catch (e) { warn('匯出失敗：' + e.message); }
    },
    importSave() {
      const box = document.getElementById('devImportBox');
      if (!box) return warn('找不到匯入框');
      const txt = box.value.trim();
      if (!txt) return warn('請先貼上存檔 JSON');
      try {
        JSON.parse(txt);
        localStorage.setItem('ro-wanderer.v3.v1', txt);
        info('存檔已寫入，2 秒後重新載入…');
        setTimeout(() => location.reload(), 2000);
      } catch (e) { warn('JSON 格式錯誤：' + e.message); }
    },
    reset() {
      if (!confirm('確定要清掉本機存檔？（不可復原）')) return;
      try { localStorage.removeItem('ro-wanderer.v3.v1'); } catch (e) {}
      location.reload();
    },
    assetScan() { scanAssets(); },
  };

  function jumpMap(i) {
    try { setMap(i); info('已切換到 ' + (MAPS[i] ? MAPS[i].n : i)); }
    catch (e) { warn('切換失敗：' + e.message); }
  }

  // ---------- 素材自檢 ----------
  async function scanAssets() {
    const urls = new Set();
    try {
      if (typeof RO !== 'undefined' && RO.images) {
        for (const k of Object.keys(RO.images)) {
          const v = RO.images[k];
          const src = typeof v === 'string' ? v : v && (v.src || v.url || (v.currentSrc));
          if (src) urls.add(src);
        }
      }
    } catch (e) {}
    if (!urls.size) return info('RO.images 目前沒有已載入的圖片');
    let bad = [];
    await Promise.all([...urls].map((u) => new Promise((res) => {
      const img = new Image();
      img.onload = () => { if (!img.naturalWidth) bad.push(u); res(); };
      img.onerror = () => { bad.push(u); res(); };
      img.src = u;
    })));
    console.log('[DEV] 素材自檢：共', urls.size, '失敗', bad.length, bad);
    info(bad.length ? `素材自檢：${urls.size} 張中 ${bad.length} 張失敗（console 有清單）` : `素材自檢：${urls.size} 張全部正常`);
  }

  // ---------- 面板 HTML ----------
  function tile(label, cmd, note) {
    return `<button class="btn sm" data-dev="${cmd}" style="margin:2px 4px 2px 0">${label}</button>${note ? `<span class="note" style="margin-right:8px">${note}</span>` : ''}`;
  }
  function panel() {
    const lvl = need() ? S.lvl : '—';
    const mapName = need() && MAPS[S.map] ? MAPS[S.map].n : '—';
    const mapBtns = (typeof MAPS !== 'undefined' ? MAPS : []).map((m, i) =>
      `<button class="btn sm" data-dev="map:${i}" style="margin:2px 4px 2px 0">${i}. ${m.n}</button>`).join('');
    return `
      <h3>開發者測試 <span class="note">本機自架版專用</span></h3>
      <div class="board">
        <div class="row"><span class="note">目前：Lv ${lvl} ・ 地圖 ${mapName} ・ 速度 ×${DEV.speed}${DEV.god ? ' ・ 無敵' : ''}${DEV.one ? ' ・ 秒殺' : ''}</span></div>

        <h3 style="margin-top:12px">角色</h3>
        <div class="row">${tile('等級 +10', 'lv10')}${tile('等級 127', 'lvmax')}${tile('經驗 +10萬', 'xp')}${tile('天賦點 +50', 'tal')}</div>
        <div class="row">${tile('HP 全滿', 'heal')}${tile('藥水 +99', 'pot')}${tile('資源 +大量', 'res')}</div>

        <h3 style="margin-top:12px">戰鬥</h3>
        <div class="row">${tile(DEV.god ? '無敵：開' : '無敵：關', 'god')}${tile(DEV.one ? '一擊必殺：開' : '一擊必殺：關', 'one')}${tile('清空場上', 'clear')}${tile('召喚 BOSS', 'boss')}${tile('生成 20 隻', 'swarm')}</div>
        <div class="row">${tile('速度 ×1/×2/×5', 'spd')}${tile(DEV.overlay ? '除錯資訊：開' : '除錯資訊：關', 'overlay')}${tile('輸出狀態', 'dump')}</div>

        <h3 style="margin-top:12px">進度</h3>
        <div class="row">${tile('解鎖全部地圖', 'unlock')}</div>
        <div class="row" style="flex-wrap:wrap">${mapBtns}</div>

        <h3 style="margin-top:12px">存檔</h3>
        <div class="row">${tile('匯出存檔', 'exportSave')}${tile('重置存檔', 'reset')}</div>
        <div class="row"><textarea id="devImportBox" placeholder="貼上存檔 JSON 後按右邊按鈕" style="width:100%;height:54px;font-size:11px"></textarea></div>
        <div class="row">${tile('匯入存檔', 'importSave')}</div>

        <h3 style="margin-top:12px">診斷</h3>
        <div class="row">${tile('素材自檢', 'assetScan')}${tile('看素材失敗清單', 'roFail')}</div>
        <p class="note" style="line-height:1.7;margin-top:8px">
          素材自檢會把所有已載入的圖片重新解碼一次，把 naturalWidth=0 或 onerror 的列出來。<br>
          「看素材失敗清單」讀的是遊戲自己的 <code>RO.failed</code>。
        </p>
      </div>`;
  }

  // ---------- 掛進選單 ----------
  function install() {
    if (DEV.installed) return true;
    if (typeof ui === 'undefined' || typeof MENU === 'undefined') return false;
    if (MENU.some((m) => m && m[0] === 'dev')) { DEV.installed = true; return true; }

    ui.m_dev = panel;
    MENU.push(['dev', '開發者測試', 'mnL']);
    DEV.installed = true;

    // 按鈕事件（用事件委派，不依賴遊戲的 data-act 路由）
    document.addEventListener('click', (e) => {
      const b = e.target.closest && e.target.closest('[data-dev]');
      if (!b) return;
      e.preventDefault();
      e.stopPropagation();
      const key = b.getAttribute('data-dev');
      if (key.startsWith('map:')) return jumpMap(Number(key.slice(4)));
      const fn = CMD[key];
      if (!fn) return warn('未實作：' + key);
      try { fn(); } catch (err) { warn('錯誤：' + err.message); }
      // 重新繪製面板（狀態文字會變）
      setTimeout(() => { try { if (ui.moreView === 'dev') ui.go && ui.go('more'); } catch (err) {} }, 60);
    }, true);

    // 讓已快取的選單畫面重畫，否則看不到新選項
    try { ui.needs = true; if (typeof ui.refresh === 'function') ui.refresh(); } catch (e) {}

    console.log('[DEV] 開發者測試已載入（選單 → 開發者測試）');
    return true;
  }

  // ---------- 除錯浮層 ----------
  function overlayTick() {
    let el = document.getElementById('devOverlay');
    if (!DEV.overlay) { if (el) el.remove(); requestAnimationFrame(overlayTick); return; }
    if (!el) {
      el = document.createElement('div');
      el.id = 'devOverlay';
      el.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99999;background:#000a;color:#8affc1;' +
        'font:11px/1.5 ui-monospace,monospace;padding:6px 8px;border-radius:6px;pointer-events:none;white-space:pre';
      document.body.appendChild(el);
    }
    let fps = 0;
    try { fps = (window.__devFps | 0); } catch (e) {}
    const st = need() ? `lv${S.lvl} hp${Math.round(S.hp)}/${Math.round(PS.maxhp)} map${S.map} mob${G && G.mobs ? G.mobs.length : 0} x${G && G.pl ? Math.round(G.pl.x) + ',' + Math.round(G.pl.y) : '-'}` : 'not in game';
    el.textContent = `${st}\nfps~${fps} speed×${DEV.speed}${DEV.god ? ' GOD' : ''}${DEV.one ? ' OHKO' : ''}`;
    requestAnimationFrame(overlayTick);
  }

  // fps 計算
  (function fpsLoop() {
    let last = performance.now(), frames = 0, acc = 0;
    function step(now) {
      frames++;
      acc += now - last;
      last = now;
      if (acc >= 500) { window.__devFps = Math.round(frames * 1000 / acc); frames = 0; acc = 0; }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  })();

  // 無敵：每 200ms 補滿
  setInterval(() => {
    if (!DEV.god || !need()) return;
    try { S.hp = PS.maxhp; } catch (e) {}
  }, 200);

  // 等遊戲就緒
  let tries = 0;
  const boot = setInterval(() => {
    tries++;
    if (install() || tries > 200) clearInterval(boot);
  }, 100);
  requestAnimationFrame(overlayTick);

  // 對外 API（給自動化測試用）
  window.DEVTOOLS = { DEV, CMD, jumpMap, scanAssets };
})();
