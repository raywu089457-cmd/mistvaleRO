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
    noOffCap: false,   // 離線經驗不受「地圖等級上限」限制
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
    async cacheInfo() {
      try {
        const names = await caches.keys();
        let n = 0;
        for (const k of names) n += (await (await caches.open(k)).keys()).length;
        info(`SW 快取：${names.length} 個空間 / ${n} 個檔案`);
        console.log('[DEV] caches', names, 'entries', n);
      } catch (e) { warn('沒有 Cache Storage'); }
    },
    async clearCache() {
      try {
        const names = await caches.keys();
        await Promise.all(names.map(k => caches.delete(k)));
        const regs = await navigator.serviceWorker?.getRegistrations?.() || [];
        await Promise.all(regs.map(r => r.unregister()));
        info('已清除快取，2 秒後重新載入（會重新下載約 15MB）');
        setTimeout(() => location.reload(), 1800);
      } catch (e) { warn('清除失敗：' + e.message); }
    },
    offcap() {
      if (typeof offlineGains === 'function' && !offlineGains.__wrappedCap) {
        const orig = offlineGains;
        window.offlineGains = function (t, a, s) {
          if (!DEV.noOffCap || typeof S === 'undefined' || !S) return orig.call(this, t, a, s);
          const keep = S.map;
          try { S.map = (typeof MAPS !== 'undefined' ? MAPS.length - 1 : keep); } catch (e) {}
          const r = orig.call(this, t, a, s);
          S.map = keep;
          return r;
        };
        window.offlineGains.__wrappedCap = true;
      }
      DEV.noOffCap = !DEV.noOffCap;
      info('離線經驗上限：' + (DEV.noOffCap ? '已解除（按最後一張地圖計算）' : '恢復原廠（地圖上限）'));
    },
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

  // ==================== 道具添加 ====================
  /* 任意加道具。介面分六類，每一列點一下就把「目前數量」加進去。
   * 全部讀遊戲自己的資料表（MATS / AFFIX / UNIQUE / SLATE / CLASS / SLOTS），
   * 所以作者新增道具時這裡會自動出現，不必改程式。 */
  const IST = { tab: 'equip', qty: 1, q: '', slot: '', rar: '' };
  const QTY_OPTS = [1, 10, 50, 99];
  const TAB_QTY = { equip: 1, mat: 99, gem: 1, card: 1, res: 99 };
  const ITABS = [
    ['equip', '裝備'], ['mat', '材料'], ['gem', '寶石'],
    ['card', '卡片'], ['res', '資源'],
  ];
  // v6.2 停用石板／符文系統：這五種素材遊戲會自動換成 Zeny，不加進選單
  const GONE_MATS = (() => {
    try { return typeof V62_GONE !== 'undefined' ? V62_GONE : new Set(['s1', 'r1', 'c1', 'm1', 'h1']); } catch (e) { return new Set(['s1', 'r1', 'c1', 'm1', 'h1']); }
  })();
  // 部位中文名：優先用遊戲自己的 SLOT_NAME（作者改版時會自動跟上），沒有才用下面的備援
  const SLOT_N = { weapon: '武器', shield: '副手', helm: '頭飾', chest: '鎧甲', gloves: '披肩', boots: '鞋子', ring: '飾品・左', amulet: '飾品・右' };
  const slotName = (v) => {
    try { if (typeof SLOT_NAME !== 'undefined' && SLOT_NAME[v]) return SLOT_NAME[v]; } catch (e) {}
    return SLOT_N[v] || v;
  };  const RAR_OPT = [['', '隨機'], ['0', '普通'], ['1', '魔法'], ['2', '稀有'], ['3', '傳奇'], ['4', '神話']];
  const CTLFONT = "font-family:system-ui,-apple-system,'PingFang TC','Noto Sans TC',sans-serif;";
  const E = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // 遊戲的全域表（都是 script 最上層的 const，用 typeof 保護，缺了也不會爆）
  const T = {
    mats: () => (typeof MATS !== 'undefined' ? MATS : {}),
    matCol: () => (typeof MAT_COL !== 'undefined' ? MAT_COL : {}),
    slots: () => (typeof SLOTS !== 'undefined' ? SLOTS : []),
    uniq: () => (typeof UNIQUE !== 'undefined' ? UNIQUE : {}),
    affix: () => (typeof AFFIX !== 'undefined' ? AFFIX : {}),
    arts: () => (typeof V5_CARD !== 'undefined' ? V5_CARD : {}),
    skills: () => (typeof SKILLS !== 'undefined' ? SKILLS : {}),
    classOf: () => (typeof CLASS !== 'undefined' ? CLASS : {}),
    guard: () => (typeof GUARD !== 'undefined' ? GUARD : []),
  };

  const dotOf = (col) => (col ? `<i style="flex:none;width:8px;height:8px;background:${E(col)};box-shadow:1px 1px 0 #000"></i>` : '');

  // 一列＝一顆大按鈕
  function irow(id, name, sub, col) {
    return `<button class="li" data-di-add="${E(id)}" style="appearance:none;font:inherit;text-align:left;padding:6px 8px;margin:0 0 4px">` +
      dotOf(col) +
      `<span class="grow"><span class="t" style="font-size:13px">${E(name)}</span>` +
      (sub ? `<span class="s" style="font-size:11px;line-height:15px">${sub}</span>` : '') +
      `</span></button>`;
  }

  function itemCtrl() {
    if (IED.on) {
      let e = `<div class="row" style="margin:0 0 6px;flex-wrap:nowrap">` +
        `<button data-di-back="1" class="btn" style="flex:none;padding:7px 12px;font-size:13px;${CTLFONT}">← 返回清單</button>` +
        `<span class="note" style="flex:1;margin:0;font-size:11.5px;text-align:right">設定好後按最下面「放入背包」</span></div>`;
      e += `<div class="row" style="margin:0;flex-wrap:nowrap"><span class="note" style="flex:none">數量</span>` +
        `<div class="seg" style="flex:1">` +
        QTY_OPTS.map((n) => `<button data-di-qty="${n}" aria-pressed="${IST.qty === n}" style="font-size:13px;padding:7px 4px;${CTLFONT}">×${n}</button>`).join('') +
        `</div></div>`;
      return e;
    }
    let h = `<div class="seg" style="margin:0 0 6px;flex-wrap:wrap">` +
      ITABS.map(([k, n]) => `<button data-di-tab="${k}" aria-pressed="${IST.tab === k}" style="flex:1 0 auto;min-width:44px;font-size:13px;padding:7px 4px;font-family:system-ui,-apple-system,'PingFang TC','Noto Sans TC',sans-serif;">${n}</button>`).join('') +
      `</div>`;
    h += `<div class="row" style="margin:0 0 6px;flex-wrap:nowrap"><span class="note" style="flex:none">每次</span>` +
      `<div class="seg" style="flex:1">` +
      QTY_OPTS.map((n) => `<button data-di-qty="${n}" aria-pressed="${IST.qty === n}" style="font-size:13px;padding:7px 4px;font-family:system-ui,-apple-system,'PingFang TC','Noto Sans TC',sans-serif;">×${n}</button>`).join('') +
      `</div></div>`;
    if (IST.tab === 'gem' || IST.tab === 'card') {
      h += `<p class="note" style="margin:0 0 6px">每次點一下加入 1 個。</p>`;
    }
    h += `<input class="txt" id="devItemQ" placeholder="搜尋名稱…" value="${E(IST.q)}" style="width:100%;margin:0 0 6px;font-size:14px;padding:8px 10px;font-family:system-ui,-apple-system,'PingFang TC','Noto Sans TC',sans-serif;">`;
    return h;
  }

  function itemBody() {
    if (!need()) return `<p class="empty-note">先進遊戲（建立角色）才能使用。</p>`;
    const q = IST.q.trim().toLowerCase();
    const hit = (s) => !q || String(s || '').toLowerCase().indexOf(q) >= 0;
    const rows = [];
    const busy = [];
    try {
      if (IST.tab === 'equip') {
        if (IED.on) return editBody(hit);
        const bagUq = new Set();
        for (const it of S.bag || []) if (it && it.uq) bagUq.add(it.uq);
        const uqRows = [];
        for (const [k, d] of Object.entries(T.uniq())) {
          if (!d) continue;
          const nm = d.n || k;
          if (!hit(nm) && !hit(k)) continue;
          uqRows.push(irow('edit:uq:' + k, nm, `${d.my ? '主宰' : '獨特'} ・ ${slotName(d.slot)}${bagUq.has(k) ? ' ・ 背包已有' : ''}`, d.my ? '#ff3030' : '#ff5a82'));
        }
        rows.push(`<div class="note" style="margin:2px 0 6px">點一件裝備 → 可改<b>稀有度／品質／精煉／卡片槽／屬性</b>，部位固定不變。</div>`);
        rows.push(`<div class="note" style="margin:10px 0 4px;font-weight:400;color:#8a3e14">✦ 獨特裝備（${uqRows.length}）</div>`);
        rows.push.apply(rows, uqRows);
        rows.push(`<div class="note" style="margin:14px 0 0;font-weight:400;color:#8a3e14">✦ 一般裝備（全部具名底座）</div>`);
        for (const sl of T.slots()) {
          if (sl === 'weapon') {
            for (const g of weaponGroups()) {
              const inGrp = g.names.map((nm, bi) => ({ nm, bi })).filter((x) => hit(x.nm));
              if (!inGrp.length) continue;
              rows.push(`<div class="note" style="margin:8px 0 4px;font-weight:400;color:#5a6b7c">・${g.label}${g.cls === S.cls ? ' ← 本職' : ''}</div>`);
              for (const x of inGrp)
                rows.push(irow('edit:base:weapon:' + g.key + ':' + x.bi, x.nm, `${g.label} ・ 等級 ${S.lvl}`, g.cls === S.cls ? '#6fb6ff' : '#9aa8b6'));
            }
            // 未轉職（還沒有轉職分支時遊戲用的是這一組，數值表不同）
            for (const g of plainWeaponGroups()) {
              const inG = g.names.map((nm, bi) => ({ nm, bi })).filter((x) => hit(x.nm));
              if (!inG.length) continue;
              rows.push(`<div class="note" style="margin:8px 0 4px;font-weight:400;color:#7a6a5c">・武器・${g.label}（未轉職）${g.cls === S.cls ? ' ← 本職' : ''}</div>`);
              for (const x of inG)
                rows.push(irow('edit:base:weapon:plain:' + g.cls + ':' + x.bi, x.nm, `${g.label} ・ 未轉職${g.dup(x.nm) ? ' ・ 同名但數值表不同' : ''}`, '#c9b48a'));
            }
            continue;
          }
          const list = baseNames(sl);
          const inGrp = list.map((nm, bi) => ({ nm, bi })).filter((x) => hit(x.nm));
          if (inGrp.length) {
            rows.push(`<div class="note" style="margin:8px 0 4px;font-weight:400;color:#5a6b7c">・${slotName(sl)}</div>`);
            for (const x of inGrp) rows.push(irow('edit:base:' + sl + ':' + x.bi, x.nm, `${slotName(sl)} ・ 等級 ${S.lvl}`, '#6fb6ff'));
          }
          if (sl === 'shield') {
            for (const g of ohGroups()) {
              const inG = g.tiers.map((t, ti) => ({ nm: t[0], ti })).filter((x) => hit(x.nm));
              if (!inG.length) continue;
              rows.push(`<div class="note" style="margin:8px 0 4px;font-weight:400;color:#5a6b7c">・副手・${g.label}（${g.kind}）${g.cls === S.cls ? ' ← 本職' : ''}</div>`);
              for (const x of inG)
                rows.push(irow('edit:base:shield:oh:' + g.cls + ':' + x.ti, x.nm, `${g.kind} ・ ${g.label} ・ 等級需求 ${g.tiers[x.ti][1]}`, g.cls === S.cls ? '#7dffc8' : '#9aa8b6'));
            }
          }
        }
      } else if (IST.tab === 'mat') {
        const cols = T.matCol();
        for (const [k, d] of Object.entries(T.mats())) {
          if (GONE_MATS.has(k)) continue;
          if (!hit(d.n)) continue;
          rows.push(irow('mat:' + k, d.n, `目前 ${S.mat[k] | 0}`, cols[d.f]));
        }
      } else if (IST.tab === 'gem') {
        const CLS = T.classOf();
        const SK = T.skills();
        const ownGems = (CLS[S.cls] && CLS[S.cls].gems) || [];
        const ownSet = new Set(ownGems);
        const cnt = {};
        for (const g of S.gems || []) if (g && g.id) cnt[g.id] = (cnt[g.id] || 0) + 1;
        rows.push(`<div class="note" style="margin:2px 0 6px">全部技能寶石共 <b>${Object.keys(SK).length}</b> 種（本職優先）</div>`);
        rows.push(irow('gem:__mut', '變異寶石（隨機形狀）', '每次生成 1 顆', '#c9a0ff'));
        const ids = Object.keys(SK).filter((id) => {
          const k = SK[id];
          return k && k.n && (hit(k.n) || hit(id));
        });
        ids.sort((a, b) => (ownSet.has(b) ? 1 : 0) - (ownSet.has(a) ? 1 : 0) || String(SK[a].n).localeCompare(String(SK[b].n)));
        for (const id of ids) {
          const k = SK[id];
          const cn = (CLS[k.cls] && CLS[k.cls].n) || k.cls || '';
          rows.push(irow('gem:' + id, k.n,
            `${k.act ? '主動' : '輔助'} ・ ${cn}${ownSet.has(id) ? '（本職）' : ''} ・ 身上 ${cnt[id] || 0}`, k.col));
        }
      } else if (IST.tab === 'card') {
        const st = (S.v5 && S.v5.cards) || {};
        for (const c of Object.values(T.arts())) {
          if (!c || !c.n) continue;
          if (!hit(c.n) && !hit(c.id)) continue;
          rows.push(irow('card:' + c.id, c.n,
            `T${c.t}${c.ex ? ' ・ 頭目' : ''} ・ 已有 ${st[c.id] || 0}`, ['#e8e8e8', '#6fb6ff', '#ffd84a', '#ff9a3c', '#c9a0ff', '#ff5a82', '#ff3030'][c.t] || '#e8e8e8'));
        }
      } else if (IST.tab === 'res') {
        const gd = S.gd || (S.gd = { t: [0, 0, 0], f: [0, 0, 0], w: [0, 0, 0], e: 0, m: 0 });
        const g = T.guard();
        const put = (id, nm, sub, col) => { if (hit(nm)) rows.push(irow(id, nm, sub, col)); };
        put('res:ash', '鍊金灰', `目前 ${S.ash | 0}`, '#ffb347');
        put('res:pot', '藥水', `目前 ${S.pot | 0}`, '#7dffc8');
        for (let i = 0; i < 3; i++)
          put('res:gdt' + i, (g[i] && g[i].tk ? g[i].tk : '神域') + ' 印記', `目前 ${gd.t[i] | 0}`, '#c9a0ff');
        for (let i = 0; i < 3; i++)
          put('res:gdf' + i, (g[i] && g[i].fr ? g[i].fr : '神域') + ' 碎片', `目前 ${gd.f[i] | 0}`, '#6fb6ff');
      }
    } catch (e) { busy.push(e.message); }
    if (!rows.length) return `<p class="empty-note">${IST.q ? '沒有符合「' + E(IST.q) + '」的項目。' : '這個分類目前沒有東西。'}</p>`;
    return rows.join('');
  }

  // 清單高度：直接算 px（不要用 bagScroll 這個 class —
  // 遊戲的 fitDetail() 會把 #panel .bagScroll 的 max-height 強改成 140px，
  // 而且 bagScroll 的 scroll 事件會觸發背包自動載入，會亂掉）
  function listH() {
    const h = (window.visualViewport && window.visualViewport.height) || window.innerHeight || 800;
    return Math.max(180, Math.min(380, Math.round(h * 0.4)));
  }
  const SCROLL_CSS = 'overflow-y:auto;overscroll-behavior:contain;padding:4px;border-radius:4px;' +
    'background:#3a22141a;box-shadow:inset 0 0 0 2px #3a221455';

  // 面板上只放一顆入口按鈕，真正的操作介面開獨立彈窗（手機上原本塞在面板裡太小）
  function itemBlock() {
    return `<h3 style="margin-top:12px">道具添加</h3>` +
      `<div class="board"><div class="row">` +
      `<button class="btn primary" data-dev="itemOpen" style="padding:9px 16px;font-size:13px">🎁 開啟道具添加</button>` +
      `</div><p class="note" style="margin:4px 0 0">會開一個獨立的全螢幕視窗：裝備／材料／寶石／卡片／資源，分頁＋搜尋，右上角 ✕ 關閉。</p></div>`;
  }

  // ---------- 獨立彈窗 ----------
  let modalEl = null;
  function onItemKey(e) {
    if (e.key === 'Escape' || e.key === 'Esc') { e.stopPropagation(); closeItemModal(); }
  }
  function closeItemModal() {
    document.removeEventListener('keydown', onItemKey, true);
    if (modalEl) { try { modalEl.remove(); } catch (e) {} modalEl = null; }
  }
  function openItemModal() {
    if (!need()) return warn('先進遊戲（建立角色）才能用');
    closeItemModal();
    const el = document.createElement('div');
    el.id = 'devItemModal';
    el.style.cssText = 'position:fixed;inset:0;z-index:2147482400;background:rgba(8,12,20,.72);display:flex;align-items:flex-end;justify-content:center';
    el.innerHTML =
      '<div style="width:min(100%,620px);height:100%;max-height:100%;display:flex;flex-direction:column;background:#f4f6f8;border-radius:14px 14px 0 0;box-shadow:0 -8px 30px #0009;overflow:hidden">' +
      '<div style="flex:none;display:flex;align-items:center;gap:8px;padding:9px 10px 9px 14px;background:#fff;border-bottom:2px solid #ccd8e2;padding-top:calc(9px + env(safe-area-inset-top))">' +
      '<b style="font-size:15px;color:#355978;letter-spacing:.04em">道具添加</b>' +
      '<span class="note" style="flex:1;margin:0;font-size:11.5px">點一下列＝加入</span>' +
      '<button id="devItemClose" aria-label="關閉" style="flex:none;width:42px;height:42px;border-radius:11px;border:1px solid #b7c8d8;background:#eef4fa;color:#355978;font-size:19px;line-height:1;cursor:pointer">✕</button>' +
      '</div>' +
      '<div style="flex:none;padding:10px 12px 0;overflow:hidden"><div id="devItemCtl">' + itemCtrl() + '</div></div>' +
      '<div id="devItemBody" style="flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:2px 12px calc(16px + env(safe-area-inset-bottom));background:#3a221408"></div>' +
      '</div>';
    document.body.appendChild(el);
    modalEl = el;
    paintBody();
    const x = el.querySelector('#devItemClose');
    if (x) x.addEventListener('click', closeItemModal);
    el.addEventListener('click', (e) => { if (e.target === el) closeItemModal(); });
    document.addEventListener('keydown', onItemKey, true);
  }


  // ============ 裝備編輯器（選一件 → 改稀有度／品質／精煉／卡片槽／屬性 → 建立）============
  // 這版（v6.x）裝備的屬性存在 bx=[{k,v}]、品質 q(%)、精煉 ref、卡片槽 cs/cards。
  const IED = { on: false, kind: '', slot: '', bi: -1, uq: '', wcls: '', name: '', rar: 2, cs: -1, cap: 4, q: 100, ref: 0, bx: [], adding: false, pick: '' };
  const RAR_LABEL = ['普通', '魔法', '稀有', '傳奇', '神話'];
  const RAR_COLOR = ['#e8e8e8', '#6fb6ff', '#ffd84a', '#ff9a3c', '#3ce0ff'];

  // 真正的基底表：防具／飾品＝V5_BASES，武器＝RO_WB（ro_<職業>_<階>，每組 4 把）
  function baseNames(slot) {
    try {
      const VB = typeof V5_BASES !== 'undefined' ? V5_BASES : null;
      if (VB && Array.isArray(VB[slot])) return VB[slot].map((t) => t[0]);
      const B = typeof BASES !== 'undefined' ? BASES : null;   // 舊版備援
      if (!B) return [];
      const l = B[slot];
      return Array.isArray(l) ? l : [];
    } catch (e) { return []; }
  }
  // 武器分組：ro_sword_0 … ro_merchant_3，另有 ro_bow_4/5（舞孃線／流浪者線）
  // 未轉職武器：BASES.weapon[職業] 各 4 把（還沒有轉職分支時遊戲就是用這一組）
  function plainWeaponGroups() {
    const out = [];
    try {
      const B = typeof BASES !== 'undefined' ? BASES : null;
      const CL = T.classOf();
      if (!B || !B.weapon) return out;
      const RWn = new Set();
      try { for (const v of Object.values(RO_WB)) (v[0] || []).forEach((n) => RWn.add(n)); } catch (e) {}
      for (const cls of Object.keys(B.weapon)) {
        const names = B.weapon[cls] || [];
        if (!names.length) continue;
        out.push({ cls, names, label: (CL[cls] && CL[cls].n) || cls, dup: (n) => RWn.has(n) });
      }
    } catch (e) {}
    return out;
  }
  // 未轉職武器：沒有 roWb，數值用 V5_WEX[職業]（轉職前那一組）
  function applyPlainWeapon(it, cls, bi, L2) {
    try {
      const names = ((typeof BASES !== 'undefined' && BASES.weapon) || {})[cls] || [];
      const nm = names[bi | 0];
      if (!it || !nm) return it;
      it.bi = bi | 0; it.base = nm;
      try { delete it.roWb; } catch (e) { it.roWb = undefined; }
      const W = (typeof WEAPON !== 'undefined' && (WEAPON[cls] || WEAPON[S.cls])) || null;
      if (!W) return it;
      const wex = (typeof V5_WEX !== 'undefined' && V5_WEX[cls]) || null;
      const h2 = wex ? wex[0] : 0;
      const q = (it.q || 100) / 100;
      const lv = L2 || it.ilvl || 1;
      const base = W.a + W.k * lv;
      const m = (typeof V5_WK === 'function' ? V5_WK(lv) : 1)
        * (h2 ? (typeof V5_H2 === 'number' ? V5_H2 : 1.25) : 1) * q;
      it.h2 = h2 ? 1 : 0;
      it.wd = [
        Math.max(1, Math.round(0.75 * base * m)),
        Math.max(2, Math.round(1.25 * base * m)),
        +((W.aps) * (typeof V5_WAPS === 'number' ? V5_WAPS : 1.1)).toFixed(2),
        W.c,
      ];
      it.v5aps = 1;
      if (it.name) it.name = nm;
    } catch (e) {}
    return it;
  }

  // 職業專屬副手（V1219_OH）：弓箭手＝箭筒、盜賊＝左手短劍、劍士＝騎士徽章、商人＝工匠護手
  function ohGroups() {
    const out = [];
    try {
      const OH = typeof V1219_OH !== 'undefined' ? V1219_OH : null;
      const CL = T.classOf();
      if (!OH) return out;
      for (const cls of Object.keys(OH)) {
        const D = OH[cls];
        if (!D || !D.tiers) continue;
        out.push({ cls, kind: D.n, tiers: D.tiers, label: (CL[cls] && CL[cls].n) || cls });
      }
    } catch (e) {}
    return out;
  }
  // 依指定階級做一個副手樣板（跟 v1219Tpl 一樣的形狀，但階級由使用者選）
  function ohTpl(cls, ti) {
    try {
      const OH = typeof V1219_OH !== 'undefined' ? V1219_OH : null;
      const D = OH && OH[cls];
      if (!D) return null;
      const i = Math.max(0, Math.min(D.tiers.length - 1, ti | 0));
      const t = D.tiers[i];
      const order = Object.keys(OH);
      return [[t[0], D.ico, t[1], 0, '', D.ex], 900 + order.indexOf(cls) * 10 + i];
    } catch (e) { return null; }
  }

  function weaponGroups() {
    const out = [];
    try {
      const RW = typeof RO_WB !== 'undefined' ? RO_WB : {};
      const CL = T.classOf();
      for (const key of Object.keys(RW)) {
        const m = /^ro_(.+)_(\d+)$/.exec(key);
        if (!m) continue;
        const cls = m[1], tier = +m[2];
        const names = (RW[key] && RW[key][0]) || [];
        let label = (CL[cls] && CL[cls].n) || cls;
        if (cls === 'bow' && tier === 4) label = '弓箭手（舞孃線）';
        else if (cls === 'bow' && tier === 5) label = '弓箭手（流浪者線）';
        else label += ' 武器 ' + (tier + 1) + '階';
        out.push({ key, cls, tier, names, label });
      }
    } catch (e) {}
    return out;
  }
  const slotCapOf = (it) => { try { return Math.max(0, Math.min(7, v5SlotCap(it) | 0)); } catch (e) { return 4; } };
  const bxName = (k, v) => { try { return String(v5Line(k, v)); } catch (e) { return k + ' ' + v; } };
  const bxKeys = () => { try { return Object.keys(V5_REF || {}); } catch (e) { return []; } };
  const bxLabel = (k) => {
    try {
      const t = String(v5Line(k, 10));
      return t.replace(/\s*[+\-]?[\d.]+%?\s*$/, '').trim() || k;
    } catch (e) { return k; }
  };

  // 把一件武器換成指定基底（RO_WB 的 ro_<職業>_<階>，bi 0..3）
  // 傷害要照那個職業的 WEAPON 表＋v5 的倍率重算，不然會拿到本職的數字
  function applyWeaponGroup(it, group, bi, L2) {
    try {
      const RW = typeof RO_WB !== 'undefined' ? RO_WB[group] : null;
      if (!it || !RW) return it;
      const i = Math.min(3, Math.max(0, bi | 0));
      const nm = RW[0][i];
      it.roWb = group; it.bi = i; it.base = nm;
      const cls = (String(group).split('_')[1]) || S.cls;
      const W = (typeof WEAPON !== 'undefined' && (WEAPON[cls] || WEAPON[S.cls])) || null;
      if (!W) return it;
      const wex = (typeof V5_WEX !== 'undefined' && V5_WEX[group]) || null;
      const h2 = wex ? wex[0] : 0;
      const q = (it.q || 100) / 100;
      const base = W.a + W.k * (L2 || it.ilvl || 1);
      const m = (typeof V5_WK === 'function' ? V5_WK(L2 || it.ilvl || 1) : 1)
        * (h2 ? (typeof V5_H2 === 'number' ? V5_H2 : 1.25) : 1) * q;
      it.h2 = h2 ? 1 : 0;
      it.wd = [
        Math.max(1, Math.round(0.75 * base * m)),
        Math.max(2, Math.round(1.25 * base * m)),
        +((W.aps) * (typeof V5_WAPS === 'number' ? V5_WAPS : 1.1)).toFixed(2),
        W.c,
      ];
      it.v5aps = 1;
      if (it.name) it.name = nm;
    } catch (e) {}
    return it;
  }

  // 依指定樣板做一件裝備。
  // 注意：不能靠 makeItem 的 opt.tpl —— v5 的 makeItem 呼叫 v5Convert(it) 時把參數丟掉了，
  // 所以 tpl 永遠傳不到，盾牌還會被 v6.4 的「雙手流派自動換副手」蓋掉。
  // 直接對一個舊格式物件呼叫 v5Convert(raw, {tpl}) 才會真的照我們要的樣板做。
  function makeTplItem(slot, tpl, ilvl2, rar) {
    try {
      const raw = { u: uid(), slot, ilvl: Math.max(1, ilvl2 | 0), rar: (rar == null ? 2 : rar), af: [], nw: 1 };
      if (typeof v5Convert === 'function') return v5Convert(raw, { tpl });
      return makeItem(ilvl2, { slot, rar: (rar == null ? 2 : rar) });
    } catch (e) { return null; }
  }

  function buildEquip() {
    const ilvl = Math.max(1, S.lvl | 0);
    let it;
    if (IED.kind === 'uq') it = makeItem(120, { uqk: IED.uq });
    else {
      const o = { slot: IED.slot };
      if (IED.rar >= 0) o.rar = IED.rar;
      const rr = (IED.rar >= 0 ? IED.rar : 2);
      if (IED.wgroup && IED.wgroup.indexOf('oh:') === 0) {
        const ocls = IED.wgroup.slice(3);
        const tp = ohTpl(ocls, IED.bi);
        it = tp ? makeTplItem('shield', tp, ilvl, rr) : null;
        if (it) { it.oh = ocls; if (it.base) it.name = it.base; }
      } else if (IED.slot === 'weapon' && IED.wgroup && IED.wgroup.indexOf('plain:') === 0) {
        it = makeItem(ilvl, o);
        applyPlainWeapon(it, IED.wgroup.slice(6), IED.bi, ilvl);
      } else if (IED.slot === 'weapon' && IED.wgroup) {
        it = makeItem(ilvl, o);
        applyWeaponGroup(it, IED.wgroup, IED.bi, ilvl);
      } else if (IED.bi >= 0) {
        const VB = (typeof V5_BASES !== 'undefined' && V5_BASES[IED.slot]) || null;
        it = (VB && VB[IED.bi]) ? makeTplItem(IED.slot, [VB[IED.bi], IED.bi], ilvl, rr) : makeItem(ilvl, o);
      } else {
        it = makeItem(ilvl, o);
      }
    }
    if (!it) return null;
    if (IED.q > 0) it.q = Math.round(IED.q);
    if (IED.slot === 'weapon' && IED.wgroup && IED.wgroup.indexOf('oh:') !== 0) {   // 品質會影響傷害，所以重算一次
      if (IED.wgroup.indexOf('plain:') === 0) applyPlainWeapon(it, IED.wgroup.slice(6), IED.bi, ilvl);
      else applyWeaponGroup(it, IED.wgroup, IED.bi, ilvl);
    }
    it.ref = Math.max(0, IED.ref | 0);
    if (IED.cs >= 0) {
      const n = Math.max(0, Math.min(IED.cap, IED.cs));
      it.cs = n;
      it.cards = Array(n).fill(null);
    }
    it.bx = IED.bx.map((x) => ({ k: x.k, v: Math.round(x.v) }));
    try { if (typeof v5Name === 'function') v5Name(it); } catch (e) {}
    if (!it.name) it.name = it.base;
    return it;
  }

  function groupLabel() {
    const g = IED.wgroup || '';
    if (!g) return '';
    if (g.indexOf('oh:') === 0) {
      const cls = g.slice(3);
      const o = ohGroups().find((x) => x.cls === cls);
      return o ? '（' + o.label + ' ・ ' + o.kind + '）' : '';
    }
    if (g.indexOf('plain:') === 0) {
      const cls = g.slice(6);
      const o = plainWeaponGroups().find((x) => x.cls === cls);
      return o ? '（' + o.label + ' ・ 未轉職）' : '';
    }
    const w = weaponGroups().find((x) => x.key === g);
    return w ? '（' + w.label + '）' : '';
  }

  function numRow(label, attr, val, suffix, hint) {
    return `<div class="row" style="margin:0 0 8px;flex-wrap:nowrap;align-items:center">` +
      `<span class="note" style="flex:none;width:52px;margin:0">${label}</span>` +
      `<input class="num" type="number" ${attr} value="${val}" style="width:84px;flex:none;font-size:14px;padding:6px 8px;${CTLFONT}">` +
      `<span class="note" style="flex:none;margin:0 6px 0 4px">${suffix}</span>` +
      `<span class="note" style="flex:1;margin:0;font-size:11px;text-align:right">${hint || ''}</span></div>`;
  }

  function editBody(hit) {
    const rows = [];
    const slot = IED.slot;
    rows.push(`<div class="note" style="margin:0 0 10px"><b style="font-size:15px;color:#355978">${E(IED.name)}</b>　` +
      `<span style="color:#7b8a98">${slotName(slot)}${groupLabel()} ・ 部位固定不可改</span></div>`);

    if (IED.kind === 'uq') {
      rows.push(`<div class="note" style="margin:0 0 8px;color:#ff5a82">獨特裝備（稀有度由裝備本身決定）</div>`);
    } else {
      rows.push(`<div class="note" style="margin:0 0 4px">稀有度</div><div class="seg" style="margin:0 0 10px;flex-wrap:wrap">`);
      rows.push(`<button data-di-rar="-1" aria-pressed="${IED.rar < 0}" style="flex:1 0 auto;min-width:44px;font-size:13px;padding:7px 4px;${CTLFONT}">隨機</button>`);
      for (let i = 0; i < RAR_LABEL.length; i++)
        rows.push(`<button data-di-rar="${i}" aria-pressed="${IED.rar === i}" style="flex:1 0 auto;min-width:44px;font-size:13px;padding:7px 4px;${CTLFONT}color:${RAR_COLOR[i]}">${RAR_LABEL[i]}</button>`);
      rows.push(`</div>`);
    }

    rows.push(numRow('品質', 'data-di-q="1"', Math.round(IED.q), '%', '50〜150'));
    rows.push(numRow('精煉', 'data-di-ref="1"', IED.ref | 0, '+', '0〜20'));

    rows.push(`<div class="note" style="margin:0 0 4px">卡片槽數 <span style="color:#9aa8b6">（這件最多 ${IED.cap}）</span></div><div class="seg" style="margin:0 0 10px;flex-wrap:wrap">`);
    rows.push(`<button data-di-cs="-1" aria-pressed="${IED.cs < 0}" style="flex:1 0 auto;min-width:40px;font-size:13px;padding:7px 4px;${CTLFONT}">不指定</button>`);
    for (let i = 0; i <= IED.cap; i++)
      rows.push(`<button data-di-cs="${i}" aria-pressed="${IED.cs === i}" style="flex:1 0 auto;min-width:36px;font-size:13px;padding:7px 3px;${CTLFONT}">${i}</button>`);
    rows.push(`</div>`);

    if (IED.adding) {
      rows.push(`<div class="note" style="margin:0 0 4px">選一個屬性加入</div>`);
      rows.push(`<input class="txt" id="devAfQ" placeholder="搜尋屬性…" value="${E(IED.pick)}" style="width:100%;margin:0 0 6px;font-size:14px;padding:8px 10px;${CTLFONT}">`);
      let n = 0;
      for (const k of bxKeys()) {
        if (IED.bx.some((x) => x.k === k)) continue;
        const nm = bxLabel(k);
        if (!hit(nm) && !hit(k)) continue;
        n++;
        rows.push(irow('afpick:' + k, nm, E(bxName(k, 10)), '#6fb6ff'));
      }
      if (!n) rows.push(`<p class="empty-note">沒有符合的屬性。</p>`);
      return rows.join('');
    }

    rows.push(`<div class="note" style="margin:0 0 4px">屬性（可改數值、可刪）</div>`);
    if (!IED.bx.length) rows.push(`<p class="empty-note" style="padding:8px 4px">還沒有屬性，按下面「＋ 新增屬性」。</p>`);
    IED.bx.forEach((x, i) => {
      rows.push(`<div style="display:flex;gap:6px;align-items:center;padding:5px 8px;margin:0 0 4px;background:#fff;border:1px solid #ccd8e2;border-radius:8px">` +
        `<span style="flex:1;min-width:0;font-size:13px;${CTLFONT}">${E(bxLabel(x.k))}</span>` +
        `<input class="num" type="number" data-di-bx="${i}" value="${Math.round(x.v)}" style="width:78px;flex:none;font-size:14px;padding:5px 6px;${CTLFONT}">` +
        `<button data-di-bxdel="${i}" aria-label="刪除" style="flex:none;width:34px;height:34px;border-radius:8px;border:1px solid #d8b0b8;background:#fbeef0;color:#a03050;font-size:15px;cursor:pointer">✕</button>` +
        `</div>`);
    });
    rows.push(`<div class="row" style="margin:6px 0 12px"><button data-di-afadd="1" class="btn" style="padding:9px 14px;font-size:13px;${CTLFONT}">＋ 新增屬性</button></div>`);
    rows.push(`<div class="row" style="margin:0"><button data-di-build="1" class="btn primary" style="flex:1;padding:13px;font-size:15px;${CTLFONT}">放入背包（×${IST.qty}）</button></div>`);
    return rows.join('');
  }

  function openEditor(key) {
    let k = String(key);
    if (k.indexOf('edit:') === 0) k = k.slice(5);
    const p1 = k.indexOf(':');
    const p2 = k.indexOf(':', p1 + 1);
    const kind = k.slice(0, p1);
    IED.adding = false; IED.pick = ''; IED.bx = []; IED.cs = -1; IED.rar = 2; IED.cap = 4; IED.q = 100; IED.ref = 0; IED.wcls = ''; IED.wgroup = '';
    try {
      if (kind === 'base') {
        const rest = k.slice(p1 + 1).split(':');
        const slot = rest[0];
        let bi = 0, nm = '';
        if (slot === 'weapon') {
          const group = rest[1] || '';
          if (group === 'plain') {
            const pcls = rest[2] || S.cls;
            bi = +(rest[3] || 0);
            nm = (((typeof BASES !== 'undefined' && BASES.weapon) || {})[pcls] || [])[bi] || '';
            IED.wgroup = 'plain:' + pcls;
          } else {
            bi = +(rest[2] || 0);
            const RW = (typeof RO_WB !== 'undefined' && RO_WB[group]) || null;
            nm = RW ? RW[0][Math.min(3, bi)] : '';
            IED.wgroup = group;
          }
        } else if (rest[1] === 'oh') {
          const ocls = rest[2] || '';
          bi = +(rest[3] || 0);
          const OH = (typeof V1219_OH !== 'undefined' && V1219_OH[ocls]) || null;
          nm = OH ? (OH.tiers[Math.max(0, Math.min(OH.tiers.length - 1, bi))] || [])[0] : '';
          IED.wgroup = 'oh:' + ocls;
        } else {
          bi = +(rest[1] || 0);
          nm = baseNames(slot)[bi] || '';
          IED.wgroup = '';
        }
        if (!nm) return warn('找不到這件裝備');
        IED.kind = 'base'; IED.slot = slot; IED.bi = bi; IED.name = nm; IED.rar = 2; IED.wcls = '';
        const LV0 = Math.max(1, S.lvl | 0);
        let probe = null;
        if (IED.wgroup && IED.wgroup.indexOf('oh:') === 0) {
          const tp = ohTpl(IED.wgroup.slice(3), bi);
          probe = tp ? makeTplItem('shield', tp, LV0, 2) : null;
          if (probe) probe.oh = IED.wgroup.slice(3);
        } else if (slot === 'weapon' && IED.wgroup && IED.wgroup.indexOf('plain:') === 0) {
          probe = makeItem(LV0, { slot, rar: 2 });
          applyPlainWeapon(probe, IED.wgroup.slice(6), bi, LV0);
        } else if (slot === 'weapon' && IED.wgroup) {
          probe = makeItem(LV0, { slot, rar: 2 });
          applyWeaponGroup(probe, IED.wgroup, bi, LV0);
        } else {
          const VB = (typeof V5_BASES !== 'undefined' && V5_BASES[slot]) || null;
          probe = (VB && VB[bi]) ? makeTplItem(slot, [VB[bi], bi], LV0, 2) : makeItem(LV0, { slot, rar: 2 });
        }
        if (!probe) probe = makeItem(LV0, { slot, rar: 2 });
        IED.cap = slotCapOf(probe);
        IED.q = probe.q || 100; IED.ref = probe.ref || 0;
        IED.bx = (probe.bx || []).map((x) => ({ k: x.k, v: x.v }));
      } else if (kind === 'uq') {
        const uq = k.slice(p1 + 1);
        const d = T.uniq()[uq];
        if (!d) return warn('找不到這件獨特裝備');
        IED.kind = 'uq'; IED.uq = uq; IED.slot = d.slot; IED.name = d.n || uq; IED.rar = 3;
        const probe = makeItem(120, { uqk: uq });
        IED.cap = slotCapOf(probe);
        IED.q = probe.q || 100; IED.ref = probe.ref || 0;
        IED.bx = (probe.bx || []).map((x) => ({ k: x.k, v: x.v }));
      } else return warn('未知的裝備類型');
      IED.on = true;
      paintCtl(); paintBody();
      const box = document.getElementById('devItemBody');
      if (box) box.scrollTop = 0;
    } catch (e) { warn('開啟編輯失敗：' + e.message); }
  }

  // 只重畫清單（保留搜尋框焦點與捲動位置）
  function paintBody() {
    const box = document.getElementById('devItemBody');
    if (!box) return;
    const top = box.scrollTop;
    box.innerHTML = itemBody();
    box.scrollTop = top;
  }

  // 重畫分類／選項／清單
  function paintCtl() {
    const c = document.getElementById('devItemCtl');
    const box = document.getElementById('devItemBody');
    const top = box ? box.scrollTop : 0;
    if (c) c.innerHTML = itemCtrl();
    const b2 = document.getElementById('devItemBody');
    if (b2) { b2.innerHTML = itemBody(); b2.scrollTop = top; }
  }

  // ---- 實際添加 ----
  function addItem(id, n) {
    if (!need()) return warn('還沒進遊戲');
    const i = String(id).indexOf(':');
    const kind = i < 0 ? String(id) : String(id).slice(0, i);
    const arg = i < 0 ? '' : String(id).slice(i + 1);
    n = Math.max(1, n | 0);
    let got = 0;
    try {
      if (kind === 'mat') {
        S.mat[arg] = (S.mat[arg] | 0) + n; got = n;
      } else if (kind === 'res') {
        if (arg === 'ash') { S.ash = (S.ash | 0) + n; got = n; }
        else if (arg === 'pot') { S.pot = (S.pot | 0) + n; got = n; }
        else if (/^gdt\d$/.test(arg)) { const k = +arg.slice(3); S.gd.t[k] = (S.gd.t[k] | 0) + n; got = n; }
        else if (/^gdf\d$/.test(arg)) { const k = +arg.slice(3); S.gd.f[k] = (S.gd.f[k] | 0) + n; got = n; }
      } else if (kind === 'gem') {
        for (let k = 0; k < n; k++) {
          if (S.gems.length >= 5000) { warn('寶石已滿 5000'); break; }
          if (arg === '__mut') S.gems.push(makeMutGem());
          else giveGem(arg);
          got++;
        }
      } else if (kind === 'equip') {
        const ilvl = Math.max(1, S.lvl | 0);
        for (let k = 0; k < n; k++) {
          if (S.bag.length >= BAG_MAX) { warn('背包已滿（' + BAG_MAX + '）'); break; }
          const o = {};
          if (IST.slot) o.slot = IST.slot;
          if (arg === 'sock') o.sock = 1;
          else if (arg === 'uniq') { o.uniq = 1; }
          else if (IST.rar !== '') o.rar = +IST.rar;
          S.bag.push(makeItem(arg === 'uniq' ? 120 : ilvl, o));
          got++;
        }
      } else if (kind === 'uniq') {
        for (let k = 0; k < n; k++) {
          if (S.bag.length >= BAG_MAX) { warn('背包已滿（' + BAG_MAX + '）'); break; }
          S.bag.push(makeItem(120, { uqk: arg }));
          got++;
        }
      } else if (kind === 'card') {
        S.v5 = S.v5 || { cards: {}, seen: {} };
        S.v5.cards = S.v5.cards || {};
        S.v5.seen = S.v5.seen || {};
        S.v5.cards[arg] = (S.v5.cards[arg] | 0) + n;
        S.v5.seen[arg] = 1;             // 圖鑑一併標記已取得
        got = n;
      } else return warn('未知的道具類型：' + kind);
    } catch (e) { return warn('添加失敗：' + e.message); }
    if (got) { try { markDirty(); } catch (e) {} }
    return got;
  }

  function itemClick(b) {
    const edit = b.getAttribute('data-di-edit');
    if (edit) return openEditor(edit);
    const back = b.getAttribute('data-di-back');
    if (back) { IED.on = false; IED.adding = false; IED.bx = []; paintCtl(); paintBody(); return; }
    const rar = b.getAttribute('data-di-rar');
    if (rar !== null) { IED.rar = +rar; paintBody(); return; }
    const cs = b.getAttribute('data-di-cs');
    if (cs !== null) { IED.cs = +cs; paintBody(); return; }
    const afadd = b.getAttribute('data-di-afadd');
    if (afadd) { IED.adding = true; IED.pick = ''; paintBody(); return; }
    const bxdel = b.getAttribute('data-di-bxdel');
    if (bxdel !== null) { IED.bx.splice(+bxdel, 1); paintBody(); return; }
    const pick0 = b.getAttribute('data-di-add');
    if (pick0 && pick0.indexOf('edit:') === 0) return openEditor(pick0);
    if (pick0 && pick0.indexOf('afpick:') === 0) {
      const k = pick0.slice(7);
      IED.bx.push({ k, v: 10 });
      IED.adding = false; IED.pick = '';
      paintBody();
      return;
    }
    const build = b.getAttribute('data-di-build');
    if (build) {
      let got = 0;
      for (let i = 0; i < Math.max(1, IST.qty | 0); i++) {
        if (S.bag.length >= BAG_MAX) { warn('背包已滿（' + BAG_MAX + '）'); break; }
        const it = buildEquip();
        if (!it) { warn('建立失敗'); break; }
        S.bag.push(it); got++;
      }
      if (got) {
        try { markDirty(); } catch (e) {}
        try { toast('已放入背包：' + IED.name + ' ×' + got, 'lvl'); } catch (e) {}
      }
      return;
    }
    const add = b.getAttribute('data-di-add');
    if (add) {
      const n = addItem(add, IST.qty);
      if (n) { try { toast('已加入：' + add.replace(':', ' · ') + ' ×' + n, 'lvl'); } catch (e) {} }
      paintBody();
      return;
    }
    const tab = b.getAttribute('data-di-tab');
    if (tab) { IST.tab = tab; IST.qty = TAB_QTY[tab] || 1; paintCtl(); return; }
    const qty = b.getAttribute('data-di-qty');
    if (qty) { IST.qty = +qty; paintCtl(); return; }
    const set = b.getAttribute('data-di-set');
    if (set) { IST[set] = b.getAttribute('data-di-val') || ''; paintCtl(); return; }
    const sub = b.getAttribute('data-di-sub');
    if (sub) { IST.sub = sub; paintCtl(); return; }
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

        ${itemBlock()}

        <h3 style="margin-top:12px">戰鬥</h3>
        <div class="row">${tile(DEV.god ? '無敵：開' : '無敵：關', 'god')}${tile(DEV.one ? '一擊必殺：開' : '一擊必殺：關', 'one')}${tile('清空場上', 'clear')}${tile('召喚 BOSS', 'boss')}${tile('生成 20 隻', 'swarm')}</div>
        <div class="row">${tile('速度 ×1/×2/×5', 'spd')}${tile(DEV.overlay ? '除錯資訊：開' : '除錯資訊：關', 'overlay')}${tile('輸出狀態', 'dump')}</div>
        <div class="row">${tile(DEV.noOffCap ? '離線經驗上限：已解除' : '離線經驗上限：原廠', 'offcap')}</div>

        <h3 style="margin-top:12px">進度</h3>
        <div class="row">${tile('解鎖全部地圖', 'unlock')}</div>
        <div class="row" style="flex-wrap:wrap">${mapBtns}</div>

        <h3 style="margin-top:12px">存檔</h3>
        <div class="row">${tile('匯出存檔', 'exportSave')}${tile('重置存檔', 'reset')}</div>
        <div class="row"><textarea id="devImportBox" placeholder="貼上存檔 JSON 後按右邊按鈕" style="width:100%;height:54px;font-size:11px"></textarea></div>
        <div class="row">${tile('匯入存檔', 'importSave')}</div>

        <h3 style="margin-top:12px">診斷</h3>
        <div class="row">${tile('素材自檢', 'assetScan')}${tile('看素材失敗清單', 'roFail')}</div>
        <div class="row">${tile('看快取狀態', 'cacheInfo')}${tile('清除快取並重載', 'clearCache')}</div>
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

    // 道具清單的搜尋框（只重畫清單，不動面板其他部分）
    document.addEventListener('input', (e) => {
      if (e.target && e.target.id === 'devItemQ') { IST.q = e.target.value; paintBody(); return; }
      if (e.target && e.target.id === 'devAfQ') { IED.pick = e.target.value; paintBody(); return; }
      const tg = e.target;
      if (!tg || !tg.getAttribute) return;
      const bxi = tg.getAttribute('data-di-bx');
      if (bxi !== null && bxi !== undefined) {
        const i = +bxi, v = Number(tg.value);
        if (IED.bx[i] && Number.isFinite(v)) IED.bx[i].v = v;
        return;
      }
      if (tg.getAttribute('data-di-q')) { const v = Number(tg.value); if (Number.isFinite(v)) IED.q = Math.max(1, Math.min(999, v)); return; }
      if (tg.getAttribute('data-di-ref')) { const v = Number(tg.value); if (Number.isFinite(v)) IED.ref = Math.max(0, Math.min(99, v)); return; }
    }, true);

    // 按鈕事件（用事件委派，不依賴遊戲的 data-act 路由）
    document.addEventListener('click', (e) => {
      const di = e.target.closest && e.target.closest('[data-di-add],[data-di-tab],[data-di-qty],[data-di-set],[data-di-sub],[data-di-edit],[data-di-rar],[data-di-cs],[data-di-afadd],[data-di-bxdel],[data-di-build],[data-di-back]');
      if (di) { e.preventDefault(); e.stopPropagation(); itemClick(di); return; }
      const b = e.target.closest && e.target.closest('[data-dev]');
      if (!b) return;
      e.preventDefault();
      e.stopPropagation();
      const key = b.getAttribute('data-dev');
      if (key.startsWith('map:')) return jumpMap(Number(key.slice(4)));
      if (key === 'itemOpen') return openItemModal();
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



  // ---------- 手機保險：彈窗（離線收益／說明）滑不動、點不掉 ----------
  (function mobileSheetFix() {
    try {
      const st = document.createElement('style');
      st.id = 'devSheetFix';
      st.textContent = [
        // iOS 上彈窗常常不能捲動，導致「收下」按鈕在下面按不到
        '#sheet{max-height:calc(100dvh - 32px);overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y}',
        // 背板不要攔截滑動手勢
        '#sheetBg{touch-action:auto}',
        '#sheet > .row:last-child{position:sticky;bottom:-1px;background:var(--paper,#f7e9cf);padding:8px 0 4px;z-index:2}'
      ].join('');
      document.head.appendChild(st);
    } catch (e) {}

    // 點背板（彈窗外面的空白）＝關閉，避免卡在沒有關閉鈕的彈窗
    document.addEventListener('pointerdown', (e) => {
      const bg = document.getElementById('sheetBg');
      if (!bg || bg.hidden) return;
      if (e.target !== bg) return;                 // 只認「真的點在背板」
      const sheet = document.getElementById('sheet');
      if (!sheet) return;
      const close = sheet.querySelector('[data-act="close"]') ||
                    sheet.querySelector('[data-act="sheetClose"]') ||
                    [...sheet.querySelectorAll('button')].find(b => /收下|關閉|知道了|確定/.test(b.textContent || ''));
      if (close) { close.click(); }
      else { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); }
      console.log('[DEV] 點背板關閉彈窗');
    }, true);
  })();

  // ---------- 保險：空的教學/說明背板會擋住所有點擊 ----------
  (function sheetGuard() {
    let stuckSince = 0;
    setInterval(() => {
      try {
        const bg = document.querySelector('#sheetBg');
        const sh = document.querySelector('#sheet');
        if (!bg || !sh) return;
        const bgVisible = getComputedStyle(bg).display !== 'none';
        const txt = (sh.innerText || '').trim();
        const empty = sh.getBoundingClientRect().height < 8 || txt.length < 2;
        if (bgVisible && empty) {
          if (!stuckSince) stuckSince = Date.now();
          else if (Date.now() - stuckSince > 2500) {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));
            console.log('[DEV] 偵測到空白說明背板，已自動關閉（避免畫面無法點擊）');
            stuckSince = 0;
          }
        } else stuckSince = 0;
      } catch (e) {}
    }, 1000);
  })();

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
