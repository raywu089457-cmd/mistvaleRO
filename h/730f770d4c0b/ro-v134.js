/* 流浪仙境 v1.3.6 — 精簡天賦卡、選單天賦圖鑑。僅變更文字與介面。 */
"use strict";
const V134_COND = {
  near:"距離≤32",far:"距離≥35",low70:"生命<70%",low50:"生命<50%",shield:"有護盾",
  controlled:"目標被冰緩／暈眩／嘲諷",charmed:"目標被魅惑",cursed:"目標帶暗影標記／詛咒",poisoned:"目標中毒",
  still:"站定2秒（移動≤4）",stillFar:"站定2秒（移動≤4）、距離≥35",moving:"移動中",
  afterCast:"主動施法後5秒內",afterSong:"施放樂曲後6秒內",afterCombo:"施放連拳後4秒內",
  summons:"有存活召喚物",spheres:"持有≥3氣球",heatBand:"熱量30～75",poisonNear:"距離60內有中毒敵人",
  charmNear:"距離60內有魅惑敵人",reserve:"資源≥1格",boss:"目標為Boss",safe:"4秒未受生命傷害",
  crowded:"目標周圍40內有≥3敵人",full2:"滿格維持2秒",far60:"距離≥60",highHeat:"熱量≥75",
  lowHeat:"熱量≤20",fullLife:"生命≥80%",dying:"目標生命≤35%",hidden:"2秒內曾隱匿施法",
  recentCrit:"2秒內曾直接暴擊",recentPay:"4秒內曾施法支付生命",recentCP:"2秒內曾單次消耗≥3連擊點",
  recentSph:"2秒內曾單次消耗≥3氣球",recentHeal:"4秒內曾主動有效治療",recentReaction:"3秒內曾觸發元素反應"
};
function v134Rule(q) {
  const ev={cast:"成功施法",basic:"普攻命中",hit:"直接命中",hurt:"受到生命傷害",absorb:"護盾吸傷",
    payment:"主動技能支付生命",reaction:"觸發元素反應",cpSpend:"終結技消耗連擊點",sphSpend:"消耗氣球",
    overheal:"主動治療溢補",healed:"主動有效治療",dodge:"成功閃避",pulse:"每秒檢查",cycle:"釋放資源",
    heatVent:"機械過熱爆發",killOrBoss:"親自擊殺／直接命中同一Boss 8次"};
  let event=q.ids?.length?`${q.ev==="cast"?"施放":"命中"}${q.ids.map(v133SkillName).join("／")}`:ev[q.ev];
  if(q.dragon) event="交替施放槍技／龍息";
  else if(q.alternate) event="交替"+event;
  if(q.distinct) event=q.ev==="reaction"?`觸發${q.distinct}種元素反應`:`施放${q.distinct}種：${q.ids.map(v133SkillName).join("／")}`;
  if(q.every>1) event+=q.ev==="pulse"?`，累計${q.every}次`:`${q.every}次`;
  if(q.distinctTarget) event+=`${q.distinctTarget}個不同目標`;
  const prefix=[q.cond && V134_COND[q.cond],q.same && "同一目標",q.crit && "暴擊"].filter(Boolean);
  if(q.window) prefix.push(`${q.window}秒內`);
  if(q.min) event+=`≥生命上限${v133Pct(q.min)}`;
  if(q.minCount) event+=`≥${q.minCount}個`;
  return [...prefix,event].join("，");
}
function v134Action(a) {
  if(a.op==="strike")return `${v133Pct(a.v)}武器傷害${a.pulses>1?`×${a.pulses}段（每秒1段）`:""}，${a.n>1?`範圍${a.r}／最多${a.n}敵`:"單體"}`;
  if(a.op==="buff")return `${({damage:"傷害+",basic:"普攻傷害+",skill:"技能傷害+",min:"召喚物傷害+",dr:"受傷−",taken:"受傷+",as:"攻速+",ms:"移速+",regen:"每秒回復生命上限"})[a.stat]}${v133Pct(a.v)}（${a.t}秒）`;
  if(a.op==="heal")return `回復生命上限${v133Pct(a.v)}`;
  if(a.op==="shield")return `獲得生命上限${v133Pct(a.v)}護盾`;
  if(a.op==="cooldown")return `${a.id==="all"?"已裝備主動技能":v133SkillName(a.id)}剩餘冷卻−${a.v}秒`;
  if(a.op==="native")return ({cp:`連擊點+${a.v}`,sph:`氣球+${a.v}`,limit:`極限槽+${a.v}`,cool:`熱量−${a.v}`})[a.kind];
  if(a.op==="repair")return `自己的召喚物回復生命上限${v133Pct(a.v)}`;
  if(a.op==="stun")return `範圍${a.r}內最多${a.n}敵暈眩${a.v}秒`;
  if(a.op==="vuln")return `對目前目標的直接傷害+${v133Pct(a.v)}（${a.t}秒）`;
  throw Error("Unknown talent effect: "+a.op);
}
function v134Short(t,p) {
  const v=t.v133, effects=a=>a.map(v134Action).join("；");
  if(v.kind==="feed")return {when:v134Rule(v.q),effect:`${p.resource}+${v.q.gain}格`,note:`觸發冷卻 ${v.q.cd} 秒`};
  if(v.kind==="rule")return {when:v134Rule(v.q),effect:effects(v.acts),note:`觸發冷卻 ${v.q.cd} 秒`};
  if(v.kind==="release")return [
    {when:"滿格＋收束技能",effect:"消耗全部，釋放效果×1.15",note:`基礎冷卻 ${p.cd} 秒（奧義可改寫）`},
    {when:"半格以上＋收束技能",effect:"消耗全部，釋放效果×0.60",note:"半格向上取整；釋放冷卻−1秒，最低2秒"},
    {when:"滿格後普攻命中3次",effect:"消耗全部，釋放效果×1.05",note:"改由普攻釋放；釋放冷卻+1秒"}
  ][v.mode];
  if(v.kind==="economy")return [
    {when:"選取後",effect:`${p.resource}上限+2格；釋放效果×1.30`,note:""},
    {when:"每次釋放後",effect:"保留1格；釋放效果×0.85",note:"保留格數合計最多為上限−1"},
    {when:"選取後",effect:"釋放冷卻−1.5秒；釋放效果×0.80",note:"釋放冷卻最低2秒"}
  ][v.mode];
  if(v.kind==="risk")return {when:`釋放時，${V134_COND[v.cond]}`,effect:`本次釋放效果×${v.power.toFixed(2)}`,note:v.penalty?`代價：條件成立期間，受傷+${v133Pct(v.penalty)}`:"未達條件時照常釋放"};
  if(v.kind==="ultimate")return {when:"釋放時（取代基礎效果）",effect:effects(v.u.acts),note:[v.u.cd&&`基礎釋放冷卻改為${v.u.cd}秒`,v.u.refund&&`釋放後保留${v.u.refund}格`].filter(Boolean).join("；")};
  throw Error("Unknown talent kind: "+v.kind);
}

// Full wording is retained separately so the book and exported catalogue never lose rules.
const V134_RULES = [
  ["怎麼閱讀天賦", "天賦卡顯示條件 → 效果，另列觸發冷卻。收束技能列在各分支特性中，必須實際配置且成功施放。天賦圖鑑保留完整原文與數值。每項消耗2點，每排三選一，先選上一排；滿配16點。原有轉職、流派確定與等級解鎖規則不變。"],
  ["資源與釋放", "180距離內有存活敵人才計數，滿格溢出的資源不保存。遠離敵人8秒、死亡、重建戰場或更換配點後重置。隊員各自計數。第一排取代免費來源；A選項每次多1格。未選奧義時，釋放追加單體180%武器傷害；第二排可改為普攻釋放。"],
  ["釋放效果倍率", "「釋放效果×」影響釋放的追加傷害、治療、護盾等正面數值。第二、四、七排倍率相乘，不放大負面代價、持續時間或保留格數。奧義先決定基礎冷卻，再套第二排與第四排調整，最低2秒。保留格數相加，最多為上限−1。未達第七排條件仍照常釋放，只是不獲得該倍率。"],
  ["計數與冷卻", "每項天賦獨立計數、獨立冷卻。同一目標條件換目標就重算；交替施法連用同招就重算（槍技與龍息按類別）；限時條件逾時重算。每秒檢查類的「累計」只計符合條件的次數，並非連續秒數。觸發冷卻是該天賦成功發動後的間隔，不是技能本身冷卻。"],
  ["治療、支付與護盾", "治療來源只計主動技能施放當下的同步治療，不計藥水、自然回復、持續回復或本版天賦回復。支付生命只計成功主動施法當下的生命淨支出。護盾只計實際吸收；閃避和未命中不產生盾壓。本版新增護盾最多達生命上限25%，不削低已有的較大護盾；原有技能護盾照原規則。"],
  ["追加傷害與回響", "追加傷害以武器傷害套用原有技能增傷與敵方減傷，不再產生本版資源、連鎖天賦或觸發施法。分段回響每秒1段，原目標死亡就取消餘段；範圍效果沿原目標周圍選取存活敵人。距離沿用遊戲內單位。"],
  ["數值上限", "同一來源的增益只刷新、不疊層；不同來源相加。本版各傷害類型暫時加成最高60%、減傷30%、攻速／移速40%、持續回復每秒生命上限4%。單次回復最多25%、召喚物維修40%、目標易傷合計25%、單次減冷卻3秒、暈眩1.5秒（再套Boss抗性）。與原有系統的增益另依原規則計算。"],
  ["作用對象", "治療、護盾、冷卻與增益只作用於自己，並非全隊光環。維修只作用於自己的存活召喚物，無生命欄位者無法維修。治療仍受原有治療倍率影響。氣球與連擊點增量向下取整、最低1，並遵守原有上限；極限槽亦遵守原上限。排熱最低0，不觸發排熱來源；技能剩餘冷卻最低0。"],
  ["自動施法與站位", "選用消耗氣球／連擊點來源時，終結技會等到足夠實際扣除量（包含輔助返還的一顆）。選用持有3氣球普攻來源時，氣球消耗技等待分支資源滿格。站定來源在射程內且生命高於35%時停止一般繞行，仍會躲避危險；遠距站位來源先退到約38距離再架設，受場地邊界與追擊影響。技能未配置、禁止普攻或條件未達時，不補發效果。"],
  ["版本與數值", "圖鑑列出基礎實裝數值，並非套用目前裝備後的最終傷害。條件循環不完整計入靜態DPS面板。v1.3.4已退還舊職業與配裝頁的舊配點，保留總點數、分支、裝備及寶石；本次文字更新不重置配點。"]
];
const V134_BOOK = {branch:null,query:"",tab:"talents",focus:null};
function v134Branches() {return Object.entries(ASC).flatMap(([cls,bs])=>bs.filter(b=>V133_BY_KEY[b.k]).map(b=>({cls,b})));}
function v134BookResults() {
  const query=V134_BOOK.query.trim().toLocaleLowerCase();
  let count=0;
  const cards=v134Branches().filter(({b})=>!V134_BOOK.branch || b.k===V134_BOOK.branch).map(({cls,b})=>{
    const branchMatch=query && `${CLASS[cls].n} ${b.n} ${b.d}`.toLocaleLowerCase().includes(query);
    const rows=b.t.map((row,i)=>{
      const matches=row.map((t,j)=>({t,j})).filter(({t})=>!query || branchMatch || `${V133_ROW[i]} ${t.n} ${t.v134Full}`.toLocaleLowerCase().includes(query));
      if(!matches.length)return "";
      count+=matches.length;
      return `<section class="v134-book-row"><h3>第 ${i+1} 排 · ${esc(V133_ROW[i])}<small>三選一</small></h3><div class="v134-book-grid">${matches.map(({t,j})=>`<article class="v134-entry${t.k===V134_BOOK.focus?" v134-highlight":""}" id="book-${t.k}" tabindex="-1"><b><span class="v134-letter">${"ABC"[j]}</span>${esc(t.n)}</b><p>${esc(t.v134Full)}</p></article>`).join("")}</div></section>`;
    }).join("");
    if(!rows)return "";
    return `<section class="v134-branch"><header><span class="tag">${esc(CLASS[cls].n)}</span><h2>${esc(b.n)}</h2><p>${esc(b.d)}</p></header><details class="v134-rules"><summary>完整分支特性 · ${esc(b.trait.n)}</summary><p>${esc(b.trait.v134Full)}</p></details>${rows}</section>`;
  }).join("");
  return `<p class="v134-count" role="status">${count} 項天賦${query?` · 搜尋「${esc(V134_BOOK.query.trim())}」`:""}</p>${cards || '<div class="board"><p>沒有符合的天賦，試試其他關鍵字或切換「全部分支」。</p></div>'}`;
}
function v134BookHtml() {
  const branches=v134Branches();
  if(V134_BOOK.branch===null)V134_BOOK.branch=branches.some(({b})=>b.k===S?.tal?.asc)?S.tal.asc:branches[0].b.k;
  const rules=V134_BOOK.tab==="rules";
  return `<div class="v134-book"><header class="v134-book-title"><img src="talent-book.svg" alt="" width="48" height="48"><div><h2>天賦圖鑑</h2><p>26 分支 · 624 天賦 · 完整條件與數值</p></div></header>
    <div class="seg v134-book-tabs"><button data-v134="tab" data-v="talents" aria-pressed="${!rules}">天賦一覽</button><button data-v134="tab" data-v="rules" aria-pressed="${rules}">共通規則</button></div>
    ${rules?`<div class="v134-rule-list">${V134_RULES.map(([n,d])=>`<section><h3>${esc(n)}</h3><p>${esc(d)}</p></section>`).join("")}</div>`:`<div class="v134-filters"><label>職業／分支<select id="v134-branch" aria-label="選擇職業分支"><option value=""${!V134_BOOK.branch?" selected":""}>全部分支</option>${Object.entries(ASC).map(([cls,bs])=>`<optgroup label="${esc(CLASS[cls].n)}">${bs.filter(b=>V133_BY_KEY[b.k]).map(b=>`<option value="${b.k}"${b.k===V134_BOOK.branch?" selected":""}>${esc(b.n)}</option>`).join("")}</optgroup>`).join("")}</select></label><label>搜尋天賦<input id="v134-search" type="search" placeholder="名稱、條件或效果" aria-label="搜尋天賦" value="${esc(V134_BOOK.query)}"></label></div><div class="row v134-tools"><button class="btn sm" data-v134="clear">清除搜尋</button><button class="btn sm" data-v134="mine" ${V133_BY_KEY[S?.tal?.asc]?"":"disabled"}>目前分支</button><span class="note">此處供查閱；配點請至角色 → 職業天賦。</span></div><div id="v134-results">${v134BookResults()}</div>`}</div>`;
}
function v134Install() {
  if(v134Install.done)return;
  v134Install.done=true;
  for(const {b} of v134Branches()) {
    const p=V133_BY_KEY[b.k];
    b.trait.v134Full=b.trait.d;
    b.trait.d=`${v134Rule(p.feeds[0])} → ${p.resource}+${p.feeds[0].gain}格（上限${p.cap}格，觸發冷卻${p.feeds[0].cd}秒）。滿格後施放「${p.finish.map(v133SkillName).join("／")}」→ 消耗全部，追加單體180%武器傷害（釋放冷卻${p.cd}秒）。${p.k==="ro_sword_3"?"挑釁另給10%生命上限護盾，冷卻8秒。":""}`;
    for(const t of b.t.flat()) {
      t.v134Full=t.d;
      t.v134Short=v134Short(t,p);
      const s=t.v134Short;
      t.d=`${s.when} → ${s.effect}。${s.note}`;
    }
  }
  const icon=iconURL;
  iconURL=function(k,...args){return k==="mnTalentBook"?"talent-book.svg":icon.call(this,k,...args);};
  if(!MENU.some(m=>m[0]==="talentbook")) {
    const at=MENU.findIndex(m=>m[0]==="roguide");
    MENU.splice(at<0?MENU.length:at,0,["talentbook","天賦圖鑑","mnTalentBook"]);
  }
  ui.m_talentbook=v134BookHtml;
  const asc=ui.ascHtml;
  ui.ascHtml=function(...args) {
    let html=asc.apply(this,args);
    const b=ascBranch();
    if(!b?.trait?.v134Full)return html;
    // Remove the duplicate v133 introduction; keep the migration notice if needed.
    html=html.replace(/^<div class="board"><b>分支循環・[\s\S]*?<\/div>/,"");
    html=html.replace(/<div class="board v121mech">([\s\S]*?)<\/ul><\/div>/,`<details class="v134-mechanic"><summary>職業機制</summary><div class="board v121mech">$1</ul></div></details>`);
    for(const t of b.t.flat()) {
      const s=t.v134Short;
      html=html.replace(`<div>${esc(t.d)}</div>`,`<div class="v134-short"><p class="v134-when">${esc(s.when)}</p><p class="v134-effect">→ ${esc(s.effect)}</p>${s.note?`<p class="v134-note">${esc(s.note)}</p>`:""}</div><button class="v134-detail-link" data-v134="detail" data-k="${t.k}">詳解</button>`);
    }
    return `<div class="board v134-book-link"><img src="talent-book.svg" alt="" width="36" height="36"><div><b>先看條件，再選效果</b><p>釋放效果×：傷害、治療與護盾等正面效果倍率。</p></div><button class="btn sm" data-v134="open">完整天賦圖鑑</button></div>${S.tal.v133Refund?'<p class="note">舊職業配點已退還，請重新選擇天賦。</p>':""}<div class="v134-talents">${html}</div>`;
  };
  const style=document.createElement("style");
  style.textContent=`
    .v134-book-title,.v134-book-link{display:flex;align-items:center;gap:12px}.v134-book-title{margin:16px 0}.v134-book-title img,.v134-book-link img{image-rendering:pixelated;flex:none}.v134-book-title h2{margin:0}.v134-book-title p,.v134-book-link p{margin:4px 0 0;color:var(--muted);font-size:12px;line-height:1.6}.v134-book-link{flex-wrap:wrap}.v134-book-link>div{flex:1;min-width:140px}.v134-book-link .btn{flex:none}.v134-talents .tal{position:relative}.v134-short p{margin:6px 0;line-height:1.6}.v134-when{color:var(--muted);font-size:12px}.v134-effect{color:var(--ink,#382715);font-size:13px}.v134-note{font-size:11px;color:var(--muted)}.v134-detail-link{display:block;background:none;border:0;padding:4px 0;margin:0 0 7px;color:#37665b;font:inherit;font-size:12px;cursor:pointer;text-decoration:underline;text-underline-offset:3px}.v134-mechanic{margin:12px 0;font-size:12px}.v134-mechanic>summary,.v134-rules>summary{cursor:pointer;padding:8px 0;color:#37665b}.v134-mechanic .board{margin-top:6px}
    .v134-book{font-size:13px;line-height:1.75}.v134-book-tabs{margin-bottom:16px}.v134-filters{display:flex;flex-wrap:wrap;gap:12px}.v134-filters label{flex:1;min-width:140px;display:flex;flex-direction:column;gap:4px;color:var(--muted);font-size:12px}.v134-filters input,.v134-filters select{width:100%;min-width:0;box-sizing:border-box;padding:9px;background:var(--paper-hi,#fff6dc);color:var(--ink,#382715);border:1px solid var(--paper-dk,#ba9866);font:inherit;font-size:13px;border-radius:3px}.v134-tools{flex-wrap:wrap;margin:10px 0}.v134-tools .note{font-size:11px;margin:0}.v134-count{color:var(--muted);font-size:12px;border-bottom:1px solid var(--paper-dk,#ba9866);padding-bottom:8px}.v134-branch{margin:18px 0 30px}.v134-branch>header h2{margin:5px 0}.v134-branch>header p{margin:5px 0}.v134-rules{border-left:3px solid #578474;padding-left:12px;margin:12px 0}.v134-rules p{margin:6px 0;font-size:12px}.v134-book-row h3{display:flex;align-items:center;gap:10px;margin:20px 0 8px;font-size:14px}.v134-book-row h3 small{font-size:10px;color:var(--muted);font-weight:normal}.v134-book-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:8px}.v134-entry{padding:12px;background:var(--paper-hi,#fff6dc);border:1px solid var(--paper-dk,#ba9866);border-radius:4px;overflow-wrap:anywhere}.v134-entry>b{font-size:12px;line-height:1.6;display:block;color:#375f51}.v134-letter{display:inline-block;margin-right:6px;padding:0 5px;background:#426c5c;color:#fff6dc;font-size:10px}.v134-entry p{font-size:12px;line-height:1.8;margin:10px 0 0}.v134-rule-list section{border-bottom:1px solid var(--paper-dk,#ba9866);padding:8px 0}.v134-rule-list h3{font-size:14px;color:#375f51}.v134-rule-list p{font-size:12px;line-height:1.9}.v134-entry:target{outline:2px solid #578474}
    .v134-highlight{outline:2px solid #578474;outline-offset:2px}
    @media(max-width:620px){.v134-book-grid{grid-template-columns:1fr}.v134-entry{padding:12px}.v134-book-link .btn{width:100%}.v134-book-title h2{font-size:20px}}
  `;
  document.head.appendChild(style);
  const update=()=>{const box=document.getElementById("v134-results");if(box)box.innerHTML=v134BookResults();};
  document.addEventListener("input",e=>{if(e.target.id==="v134-search"){V134_BOOK.query=e.target.value;update();}});
  document.addEventListener("change",e=>{if(e.target.id==="v134-branch"){const value=e.target.value;if(!value || V133_BY_KEY[value]){V134_BOOK.branch=value;update();}}});
  document.addEventListener("click",e=>{
    const el=e.target.closest?.("[data-v134]");if(!el)return;
    const action=el.dataset.v134;
    if(action==="open" || action==="detail") {
      V134_BOOK.branch=S?.tal?.asc || null;V134_BOOK.query="";V134_BOOK.tab="talents";
      V134_BOOK.focus=action==="detail"?el.dataset.k:null;
      ui.setTab("more","talentbook");
      if(action==="detail") {
        const target=document.getElementById("book-"+el.dataset.k);
        target?.focus({preventScroll:true});target?.scrollIntoView({block:"center"});
      }
    } else if(action==="tab") {
      V134_BOOK.tab=el.dataset.v==="rules"?"rules":"talents";ui.render();
    } else if(action==="clear") {
      V134_BOOK.query="";const input=document.getElementById("v134-search");if(input){input.value="";input.focus();}update();
    } else if(action==="mine" && V133_BY_KEY[S?.tal?.asc]) {
      V134_BOOK.branch=S.tal.asc;V134_BOOK.query="";ui.render();
    }
  });
  if(typeof ui.refreshIf==="function")ui.refreshIf("char","asc","more");
}
v134Install();
