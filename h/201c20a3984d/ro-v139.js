/* 流浪仙境 v1.3.9 — 自身名次置頂，包含前 100 名以外的成績。 */
"use strict";
function v139RankKey() { return JSON.stringify([S?.cid || '', V6RK.cls]); }
function v139SelfRank() {
  if (!v6RkOn()) return '';
  const title = '<h3>我的名次</h3>';
  const message = text => `<section class="box v139-self" aria-label="我的名次">${title}<p class="note">${esc(text)}</p></section>`;
  if (V6RK.v139Key !== v139RankKey() || (!V6RK.list && !V6RK.err)) return message('讀取自己的名次中…');
  if (V6RK.err) return message(V6RK.err);
  const r = V6RK.me;
  if (!r || r.id !== S?.cid) return message('尚無本季紀錄。完成一場無限武鬥場並成功上傳後，即可顯示名次。');
  const cls = V6_CLS_N[r.cls] || r.cls;
  const rank = r.rank || r.overallRank;
  const scope = V6RK.cls === 'all' || !r.rank ? '總榜' : cls + '榜';
  const note = !r.rank ? `目前查看${V6_CLS_N[V6RK.cls] || V6RK.cls}榜；你的角色屬於${cls}。` : rank > 100 ? '未進前 100 名，仍顯示你的實際名次。' : '已進入前 100 名。';
  return `<section class="box v139-self" aria-label="我的名次">${title}
    <div class="v139-ranks"><span>總榜 <strong>第 ${r.overallRank} 名</strong></span><span>${esc(cls)}榜 <strong>第 ${r.classRank} 名</strong></span></div>
    <div class="v6rk-list"><button class="li v6rk-row me" data-v6rk-id="${esc(r.id)}" data-v6rk-r="${rank}" aria-label="查看自己的${esc(scope)}第 ${rank} 名快照">
      <span class="grow"><b>${esc(r.name)}</b> <small>${esc(cls)}・${esc(r.br || '未轉職')}・Lv.${r.lv}</small></span>
      <span class="v6rk-f"><b class="px">${r.floor}</b> 層</span><span class="v6rk-s">${v6Sec(r.sec)}</span>
    </button></div><p class="note">${esc(note)}點選自己的紀錄可查看快照。</p></section>`;
}
function v139Install() {
  if (v139Install.done) return;
  v139Install.done = true;
  V6RK.me = null;
  V6RK.v139Key = null;
  V6RK.v139Request = null;
  v6RkFetch = async function(force) {
    if (!v6RkOn()) return;
    const key = v139RankKey(), cid = S?.cid || '', cls = V6RK.cls;
    if (V6RK.v139Request?.key === key) return;
    if (V6RK.v139Key !== key) {
      V6RK.list = null; V6RK.me = null; V6RK.err = ''; V6RK.at = 0; V6RK.v139Key = key;
    }
    if (!force && (V6RK.list || V6RK.err) && Date.now() - V6RK.at < 30000) return;
    const request = {key};
    V6RK.v139Request = request; V6RK.loading = true; V6RK.err = '';
    try {
      const response = await fetch(`${V6RK.api}?cls=${encodeURIComponent(cls)}&me=${encodeURIComponent(cid)}`, {cache:'no-store'});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || response.status);
      if (V6RK.v139Request !== request || v139RankKey() !== key) return;
      V6RK.list = data.list || []; V6RK.total = data.total || 0;
      V6RK.me = data.me?.id === cid ? data.me : null;
      V6RK.at = Date.now();
    } catch (e) {
      if (V6RK.v139Request !== request || v139RankKey() !== key) return;
      V6RK.me = null; V6RK.err = '無法讀取排行榜：' + (e.message || e); V6RK.at = Date.now();
    } finally {
      if (V6RK.v139Request === request) {
        V6RK.v139Request = null; V6RK.loading = false;
        if (ui.tab === 'more' && ui.moreView === 'orank') ui.render();
      }
    }
  };
  const render = ui.m_orank;
  ui.m_orank = function(...args) {
    const html = render.apply(this, args);
    return html.replace('</h2>', '</h2>' + v136OwnRows(v139SelfRank()));
  };
  const css = document.createElement('style');
  css.textContent = `.v139-self{border-color:#ad7d35;background:#fffaf0;margin:0 0 10px}.v139-self h3{margin:0 0 7px;color:#704617}.v139-ranks{display:flex;flex-wrap:wrap;gap:5px 18px;margin-bottom:8px;color:#704617}.v139-ranks strong{font-size:16px}.v139-self .note{margin:6px 0 0}.v139-self .v6rk-row{flex-wrap:wrap}.v139-self .grow{min-width:140px;overflow-wrap:anywhere}.v139-self .v6rk-s{min-width:0}.v139-self small{display:block}`;
  document.head.appendChild(css);
}
v139Install();
