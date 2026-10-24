/* v1.4.2 — independent summon specializations.
 * Append branch indices; never remap existing talents or player saves.
 * New pets share scheduling/inheritance, but each branch owns its combat rules.
 */
'use strict';
const V142_BRANCHES={
  ro_bow_6:{parent:'ro_bow_0',line:0,style:'馭鷹',id:'bw_blitz',power:1.5,
    d:'獵鷹持續追獵；選擇啄擊連段、俯衝或弓鷹協攻，再搭配毒爪、破甲或狙擊號令。'},
  ro_thief_4:{parent:'ro_thief_2',line:0,style:'幻影',id:'th_clone',power:1.2,
    d:'分身自主出刀；選擇快刀、終結模仿或延遲影殺，再搭配毒刀、暴擊或連擊點。'},
  ro_acolyte_4:{parent:'ro_acolyte_2',line:0,style:'聖靈',id:'ac_orbs',power:2,
    d:'聖靈主動追蹤頭目；選擇往返聖矢、守護反擊或審判印記，聖壇與天使之怒變成號令。'},
  ro_merchant_4:{parent:'ro_merchant_2',line:0,style:'砲陣',id:'mc_faw',power:2.6,
    d:'完整砲台編隊；選擇雙管、穿甲重砲或快速輪射，再搭配追蹤校準、彈幕節奏或主砲協同。'},
  ro_merchant_5:{parent:'ro_merchant_3',line:1,style:'植生',id:'mc_plant',power:2.5,
    d:'植物附著追蹤頭目；選擇毒藤、捕食或結果，再用毒雲施肥、孢子催熟或吸收養分。'}
};
function v142Talent(key,row,col,n,d,e={},extra=''){
  return {k:key+'_v142_'+(row-1)+'_'+col,n,d,e:{...e,...(row>=4?{['v138r'+row]:col+1}:{})},v134Full:d+(extra?' '+extra:''),v134Short:{when:'',effect:d,note:''}};
}
function v142Rows(key){
  const t=(r,c,n,d,e,x)=>v142Talent(key,r,c,n,d,e,x),id=V142_BRANCHES[key].id;
  const ult=(c,n,d)=>t(8,c,n,d,{},'必須將「'+SKILLS[id].n+'」放在技能盤上；三種奧義都改造此技能。召喚名額完整保留，沿用其寶石連結。');
  const rows={
    ro_bow_6:[
      [t(2,0,'馴鷹術','獵鷹傷害 +30%；召喚攻速 +15%。',{'sk:bw_blitz:more':.3,minAs:.15}),t(2,1,'群鷹','獵鷹數量 +1。',{'sk:bw_blitz:minion':1}),t(2,2,'銳爪','暴擊率 +8%；暴擊傷害 +35%。',{crit:8,critm:35})],
      [t(3,0,'快速號令','快速填裝效果 +60%；獵鷹傷害 +15%。',{'sp:bw_quick:pow':.6,'sk:bw_blitz:more':.15}),t(3,1,'鋼鐵之鷹共鳴','鋼鐵之鷹效果 +60%；召喚攻速 +15%。',{'sp:bw_falcon:pow':.6,minAs:.15}),t(3,2,'鷹眼共鳴','心神凝聚效果 +60%；獵鷹暴擊傷害 +35%。',{'sp:prec:pow':.6,critm:35})],
      [t(4,0,'連環啄擊','每隻獵鷹每第 3 輪啄擊，多啄一次。'),t(4,1,'獵空俯衝','獵鷹改為每 1.6 秒俯衝；每次傷害 ×2.1。'),t(4,2,'弓鷹一體','普攻命中時，獵鷹各追擊 60% 傷害，冷卻 0.6 秒。')],
      [t(5,0,'毒爪','獵鷹每次命中附加一層毒；沿用角色與連結寶石的毒層上限。'),t(5,1,'撕裂護甲','獵鷹命中使該目標受到的傷害 +20%，持續 4 秒。'),t(5,2,'狙擊號令','蓄力狙擊命中時，獵鷹各追加 120% 傷害，冷卻 1 秒。')],
      [t(6,0,'追獵節奏','召喚攻速 +30%；獵鷹可持續追擊同一頭目。',{minAs:.3}),t(6,1,'毒翼','獵鷹對中毒目標傷害 +35%；毒素傷害 +25%。',{psn:25}),t(6,2,'鷹眼處決','獵鷹暴擊傷害 +70%；無須敵人低血量。')],
      [t(7,0,'盤旋護主','有獵鷹時受到傷害 −15%。'),t(7,1,'獵手補給','獵鷹命中回復 2% 生命，冷卻 1 秒。'),t(7,2,'輕裝追獵','移動速度 +15%；最大生命 +20%。',{move:15,lifep:20})],
      [ult(0,'暴風獵群','獵鷹數量 +2；每隻維持原本傷害。'),ult(1,'雷霆鷹王','所有名額合為鷹王；傷害為名額總和的 160%。'),ult(2,'回翔雙擊','每次獵鷹攻擊後，0.25 秒後追加 80% 傷害。')]
    ],
    ro_thief_4:[
      [t(2,0,'幻影刃術','分身傷害 +30%；召喚攻速 +20%。',{'sk:th_clone:more':.3,minAs:.2}),t(2,1,'影眾','分身數量 +1。',{'sk:th_clone:minion':1}),t(2,2,'暗影銳刃','暴擊率 +8%；暴擊傷害 +40%。',{crit:8,critm:40})],
      [t(3,0,'疾風影步','疾風步效果 +60%；分身傷害 +15%。',{'sp:th_quick:pow':.6,'sk:th_clone:more':.15}),t(3,1,'幻影延續','殘影分身持續時間與傷害 +30%。',{v6clone:.3}),t(3,2,'致命合擊','終結技每個連擊點傷害再 +6%；分身攻速 +20%。',{v6cpDmg:.06,minAs:.2})],
      [t(4,0,'雙刃影衛','分身每次出刀後，再斬一次 65% 傷害。'),t(4,1,'終結模仿','終結技命中後，每名分身追加該次傷害的 250%。',{},'音速投擲與毒素爆發都適用；以終結技實際命中及其連結為基準，不再乘分身出刀倍率，不重複計算暴擊、不消耗連擊點。'),t(4,2,'延遲影殺','分身每次命中留下刀痕，1 秒後追加 80% 傷害。')],
      [t(5,0,'影毒','分身出刀附加一層毒；沿用角色與連結寶石的毒層上限。'),t(5,1,'鏡中殺意','分身命中同一目標累積暴傷，每次 +15%，3 次達 +45%。'),t(5,2,'影連擊','分身命中獲得 1 個連擊點，冷卻 0.6 秒。')],
      [t(6,0,'影刃疾行','召喚攻速 +30%；分身傷害 +15%。',{minAs:.3,'sk:th_clone:more':.15}),t(6,1,'劇毒鏡面','分身對中毒目標傷害 +40%；毒素傷害 +20%。',{psn:20}),t(6,2,'終結接力','終結技命中使殘影分身冷卻 −1 秒，冷卻 1 秒。')],
      [t(7,0,'幻影掩護','有分身時受到傷害 −15%。'),t(7,1,'吸血影刃','分身出刀回復 2% 生命，冷卻 1 秒。'),t(7,2,'暗影身法','閃避 +25%；最大生命 +15%。',{evap:25,lifep:15})],
      [ult(0,'影縛殺陣','終結技命中時，每名分身追加兩刀，各造成 60% 傷害，冷卻 1 秒。'),ult(1,'四刃幻舞','每輪分身出刀後，再追加三刀，各造成 35% 傷害。'),ult(2,'不滅殘像','分身持續時間 ×2；每第 3 輪出刀追加 150% 傷害。')]
    ],
    ro_acolyte_4:[
      [t(2,0,'聖靈增殖','聖靈數量 +1；聖靈傷害 +15%。',{'sk:ac_orbs:minion':1,'sk:ac_orbs:more':.15}),t(2,1,'靈光','召喚攻速 +25%；聖靈傷害 +15%。',{minAs:.25,'sk:ac_orbs:more':.15}),t(2,2,'神聖瞄準','暴擊率 +8%；暴擊傷害 +35%。',{crit:8,critm:35})],
      [t(3,0,'天使之環共鳴','連結天使之環：召喚數量再 +1。',{'sp:ac_angel:add':1}),t(3,1,'神聖守護共鳴','神聖守護效果 +60%；聖靈傷害 +15%。',{'sp:ac_angel2:pow':.6,'sk:ac_orbs:more':.15}),t(3,2,'加速聖印','加速術效果 +60%；召喚攻速 +20%。',{'sp:haste:pow':.6,minAs:.2})],
      [t(4,0,'往返聖矢','聖靈命中後，返回時再造成 80% 傷害。'),t(4,1,'護衛聖靈','有聖靈時減傷 15%；受擊或閃避時，全體聖靈反擊，冷卻 1 秒。'),t(4,2,'審判刻印','聖靈每第 3 次命中，追加 160% 傷害。')],
      [t(5,0,'聖壇號令','十字驅魔命中時，每顆聖靈追擊 70% 傷害，冷卻 1 秒。'),t(5,1,'神怒齊射','施放天使之怒時，每顆聖靈追加兩發 75% 傷害。'),t(5,2,'聖光充盈','聖靈命中回復 1% 生命；滿血時改得 2% 護盾，冷卻 1 秒。')],
      [t(6,0,'聖矢加速','召喚攻速 +30%；聖靈傷害 +15%。',{minAs:.3,'sk:ac_orbs:more':.15}),t(6,1,'信仰共振','有護盾時，聖靈傷害 +40%。'),t(6,2,'裁決光輝','聖靈對頭目傷害 +35%；暴擊傷害 +25%。',{critm:25})],
      [t(7,0,'靈衛','有聖靈時受到傷害 −15%。'),t(7,1,'淨化祈禱','每 3 秒回復 4% 生命並解除緩速。'),t(7,2,'神官體魄','最大生命 +25%；護甲 +15%。',{lifep:25,armorp:15})],
      [ult(0,'救贖聖列','聖靈傷害 +60%；有聖靈時每 2 秒獲得 5% 生命護盾。'),ult(1,'大天使','所有名額合為大天使；傷害為名額總和的 160%。'),ult(2,'審判迴環','每顆聖靈每第 3 輪攻擊，追加兩發 100% 傷害。')]
    ],
    ro_merchant_4:[
      [t(2,0,'砲台超載','砲台傷害 +25%；召喚攻速 +15%。',{'sk:mc_faw:more':.25,minAs:.15}),t(2,1,'砲陣擴編','砲台數量 +1。',{'sk:mc_faw:minion':1}),t(2,2,'彈道瞄準','暴擊率 +8%；暴擊傷害 +35%。',{crit:8,critm:35})],
      [t(3,0,'快速組裝共鳴','快速組裝效果 +60%；砲台傷害 +15%。',{'sp:mc_quick:pow':.6,'sk:mc_faw:more':.15}),t(3,1,'砲術精通','精準瞄準效果 +60%；召喚攻速 +15%。',{'sp:mc_prec:pow':.6,minAs:.15}),t(3,2,'多管共鳴','連結多管砲：投射物再 +1；暴擊傷害 +30%。',{'sp:mc_proj:add':1,critm:30})],
      [t(4,0,'雙管炮座','每輪射擊再追加一發 65% 傷害。'),t(4,1,'穿甲重砲','射擊間隔 ×1.5；每發傷害 ×2.1。'),t(4,2,'輪射機構','每第 3 輪射擊，立刻再打一輪。')],
      [t(5,0,'追蹤校準','連續命中同一目標，每次傷害 +10%，3 次達 +30%。'),t(5,1,'爆裂彈匣','每第 4 發命中，追加該發 160% 傷害。'),t(5,2,'主砲協同','加農砲命中時，各砲台追加一輪，冷卻 1 秒。')],
      [t(6,0,'高速供彈','召喚攻速 +30%；砲台傷害 +15%。',{minAs:.3,'sk:mc_faw:more':.15}),t(6,1,'反裝甲彈','砲台對頭目傷害 +40%。'),t(6,2,'自動裝填','砲台命中使加農砲冷卻 −0.5 秒，冷卻 0.8 秒。')],
      [t(7,0,'掩護砲火','有砲台時受到傷害 −15%。'),t(7,1,'維修機構','有砲台時，每 2 秒回復 4% 生命。'),t(7,2,'工程防護','最大生命 +20%；護甲 +25%。',{lifep:20,armorp:25})],
      [ult(0,'浮游砲群','砲台隨行追蹤；數量 +2。'),ult(1,'攻城齊射','每座砲台每第 3 輪射擊，追加四發重彈，各造成 75% 傷害。'),ult(2,'交錯火網','每輪射擊後追加兩發，各造成 45% 傷害。')]
    ],
    ro_merchant_5:[
      [t(2,0,'植物培育','植物傷害 +30%；召喚攻速 +15%。',{'sk:mc_plant:more':.3,minAs:.15}),t(2,1,'根系分株','植物數量 +1。',{'sk:mc_plant:minion':1}),t(2,2,'尖刺花蕊','暴擊率 +8%；暴擊傷害 +35%。',{crit:8,critm:35})],
      [t(3,0,'生命體增殖共鳴','連結生命體增殖：召喚數量再 +1。',{'sp:mcount:add':1}),t(3,1,'強化根系','生命體強化效果 +60%；植物傷害 +15%。',{'sp:mdmg:pow':.6,'sk:mc_plant:more':.15}),t(3,2,'快速栽植','快速組裝效果 +60%；召喚攻速 +20%。',{'sp:mc_quick:pow':.6,minAs:.2})],
      [t(4,0,'纏毒藤','植物每次命中附加一層毒；毒素傷害 +30%。',{psn:30}),t(4,1,'捕食根','植物攻擊同一目標，每次傷害 +15%，3 次達 +45%。'),t(4,2,'爆果','每株植物每第 3 輪攻擊，果實爆裂追加 180% 傷害。')],
      [t(5,0,'毒雲施肥','毒雲命中後，植物傷害 +40%，持續 5 秒。'),t(5,1,'孢子催熟','施放孢子爆炸時，每株植物立即攻擊兩次，各造成 80% 傷害。'),t(5,2,'吸收養分','植物攻擊回復 2% 生命並產生 2% 護盾，冷卻 1 秒。')],
      [t(6,0,'速生','召喚攻速 +30%；植物傷害 +15%。',{minAs:.3,'sk:mc_plant:more':.15}),t(6,1,'腐化根瘤','目標每有一層毒，植物傷害 +3%。',{},'依角色實際毒層數計算；不另設轉傷害上限。'),t(6,2,'光合繁殖','每 3 秒，全體植物追加一次 90% 傷害。')],
      [t(7,0,'藤蔓護體','有植物時受到傷害 −15%。'),t(7,1,'再生根','有植物時，每 2 秒回復 4% 生命。'),t(7,2,'根系韌性','最大生命 +25%；護甲 +20%。',{lifep:25,armorp:20})],
      [ult(0,'蔓生花園','植物數量 +2；全部植物持續追蹤目標。'),ult(1,'噬王花','所有名額合為噬王花；傷害為名額總和的 170%。'),ult(2,'永續結果','每次植物攻擊後，0.4 秒後再爆出 85% 傷害。')]
    ]
  };
  return rows[key];
}
function v142Count(s){
  const cfg=V142_BRANCHES[s.key],g=cfg&&v138Gem(cfg.id);if(!g)return 0;
  const base=cfg.id==='bw_blitz'?1:cfg.id==='th_clone'?2:cfg.id==='mc_faw'?TUR.n:3;
  return Math.max(1,Math.floor(base+PS.minion+(gemMods(g).minion||0)+(s.u===1&&['ro_bow_6','ro_merchant_4','ro_merchant_5'].includes(s.key)?2:0)));
}
function v142Own(s){return s.pets.filter(p=>p.v142&&p.until>G.t);}
function v142Poison(s,m,d){const g=v138Gem(V142_BRANCHES[s.key].id);poison(m,d,PS.psnMax+(g?gemMods(g).pstk||0:0));s.stats.poison++;}
function v142Echo(s,m,d,tag){
  if(G.dead||G.pl.v138!==s||!v138Live(m)||!Number.isFinite(d)||d<=0)return;
  // The source hit has already inherited gear, crit and supports exactly once.
  v138Stored(s,m,d);s.stats[tag]=(s.stats[tag]||0)+1;
}
function v142Volley(s,m,scale=1){
  for(const p of v142Own(s)){p.m=m;v140PetHit(s,p,scale,true);}
}
function v142Summon(s,g,a){
  const m=v138Target();if(!v138Live(m))return false;
  const n=v142Count(s),key='v142:'+s.key,merged=s.u===2&&['ro_bow_6','ro_acolyte_4','ro_merchant_5'].includes(s.key);
  let k=({bw_blitz:2.3,th_clone:3.2,ac_orbs:.7,mc_faw:.32,mc_plant:.6})[g.id];
  let interval=g.id==='mc_faw'?1/TUR.as:1;
  if(g.id==='bw_blitz'&&s.a===2){k*=2.1;interval*=1.6;}
  if(g.id==='mc_faw'&&s.a===2){k*=2.1;interval*=1.5;}
  if(merged)k*=n*({bw_blitz:1.6,th_clone:1.7,ac_orbs:1.6,mc_faw:1.65,mc_plant:1.7})[g.id];
  if(g.id==='th_clone')k*=1+tal('v6clone');
  if(g.id==='ac_orbs'&&s.u===1)k*=1.6;
  const old=v142Own(s),oldRounds=old.map(p=>p.round||0);
  const seconds=(g.id==='th_clone'?8*(1+tal('v6clone'))*(s.u===3?2:1):10);
  v140Pet(s,key,g.id,m,seconds,k,{count:merged?1:n,units:merged?n:1,interval,weaponRate:g.id==='mc_faw',root:true});
  const pets=s.pets.filter(p=>p.key===key);
  pets.forEach((p,i)=>{p.v142=1;p.round=oldRounds[i]||0;p.o.v142=1;if(g.id==='th_clone')p.o.hcrit=1;});
  // Extra casts grant an initial volley, never weaken the persistent summon.
  for(const p of pets)v140PetHit(s,p,a,true);
  s.stats.transforms++;v6Ro(g.id,G.pl.x,G.pl.y);return true;
}
function v142Install(){
  for(const [key,cfg] of Object.entries(V142_BRANCHES)){
    const [,cls,idx]=key.split('_'),parent=ASC[cls].find(b=>b.k===cfg.parent),bi=+idx;
    if(ASC[cls].length!==bi)throw Error('v142 branch index collision: '+key);
    const b=JSON.parse(JSON.stringify(parent));b.k=key;b.v63style=cfg.style;b.d=cfg.d;
    b.trait={n:cfg.style+'契約',e:{...parent.trait.e,v138:1,minCrit:1},d:''};
    if(cls==='thief')b.trait.e.asToMin=1;
    // Retain equipment attributes in row one. Existing branches keep all rows.
    b.t=[parent.t[0].map((t,c)=>({...JSON.parse(JSON.stringify(t)),k:key+'_v142_0_'+c})),...v142Rows(key)];
    V63_LINES[cls][cfg.line].ks.push(bi);
    const line=V63_LINES[cls][cfg.line];b.v63base=line.n[0]+'（'+cfg.style+'流）';
    Object.defineProperty(b,'n',{configurable:true,enumerable:true,get:()=>S?.cls===cls&&S?.tal?.asc===key?v63Title(cls,key,v63Stage()):b.v63base,set:()=>{}});
    ASC[cls].push(b);V63_STYLE[key]={style:cfg.style,A:[...b.core.A],S:[...b.core.S],d:cfg.d};
    if(cls==='thief')V56_THIEF.br[bi]=V56_THIEF.br[ASC[cls].indexOf(parent)];
    const spec=JSON.parse(JSON.stringify(RO_ASC_SPEC[cls][ASC[cls].indexOf(parent)]));
    RO_ASC_SPEC[cls].push(spec);RO_SPEC_KEY.set(spec,key);RO_ASC_STATS[key]=[...RO_ASC_STATS[parent.k]];V5_WEX[key]=structuredClone(V5_WEX[parent.k]);V6_BAL[key]=V6_BAL[parent.k]||1;
    V138_DEFS[key]={...V138_DEFS[parent.k]};V138_POWER[key]=cfg.power;V138_ULT_IDS[key]=[cfg.id,cfg.id,cfg.id];V133_BY_KEY[key]={...V133_BY_KEY[parent.k],k:key};
    for(const [id,allow] of Object.entries(V6_JOB))if(Array.isArray(allow)&&SKILLS[id]?.cls===cls&&allow.includes(ASC[cls].indexOf(parent)))allow.push(bi);
    // Some RO definitions use a shared job field, so explicitly unlock the core.
    for(const id of [...b.core.A,...b.core.S,'bw_falcon','th_illus'].filter(id=>CLASS[cls].gems.includes(id)))if(Array.isArray(V6_JOB[id])&&!V6_JOB[id].includes(bi))V6_JOB[id].push(bi);
    const visibleTrait={...b.trait.e};delete visibleTrait.v138;delete visibleTrait.asToMin;
    b.trait.d=v5TalText(visibleTrait)+(cls==='thief'?'；普攻速度也提高分身攻速':'')+'。'+SKILLS[cfg.id].n+'改為持續自主召喚；攻擊承接來源連結，技能／召喚傷害採較高者。滿 8 排命中傷害 ×'+cfg.power+'。';
    b.trait.v134Full=b.trait.d+' 基礎名額：'+(cls==='bow'?1:cls==='thief'||key==='ro_merchant_4'?2:3)+'；每次基礎召喚武器傷害 '+({bw_blitz:230,th_clone:320,ac_orbs:70,mc_faw:32,mc_plant:60})[cfg.id]+'%。分身持續 8 秒，其餘持續 10 秒；再次施放刷新時間並立即攻擊一次。每隻基礎每秒攻擊一次，砲台沿用武器射速 × 0.8。召喚攻速、數量、暴擊及額外施放有效；聖靈與植物的召喚生命輔助另轉為傷害。單體合併完整換算名額，沒有轉傷害上限。';
  }
  // Distinct silhouettes use the game's canvas effects, without new assets.
  const visual=v138Visual;v138Visual=function(s){
    if(!V142_BRANCHES[s.key])return visual(s);
    v6Ent({life:1e9,upd:e=>{if(G.pl.v138!==s||G.dead)e.t=e.life;},draw:(e,c)=>{
      if(G.pl.v138!==s||G.dead)return;
      v142Own(s).forEach((p,i)=>{
        const plant=s.key==='ro_merchant_5',origin=plant&&v138Live(p.m)?p.m:G.pl,a=G.t*.8+i*2.4;
        c.save();c.translate(origin.x+Math.cos(a)*20,origin.y-12+Math.sin(a)*9);if(p.units>1)c.scale(1.35,1.35);
        c.globalAlpha=.85;c.lineWidth=2;c.strokeStyle=c.fillStyle=({ro_bow_6:'#e7c684',ro_thief_4:'#af8de3',ro_acolyte_4:'#fff2ac',ro_merchant_4:'#a7c5d3',ro_merchant_5:'#9ad56a'})[s.key];
        if(s.key==='ro_bow_6'){
          const wing=3+Math.sin(G.t*12+i)*3;c.beginPath();c.moveTo(-9,-wing);c.lineTo(-3,1);c.lineTo(0,-2);c.lineTo(3,1);c.lineTo(9,-wing);c.stroke();c.fillRect(-1,-2,3,6);
        }else if(s.key==='ro_thief_4'){
          c.beginPath();c.arc(0,-5,3,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(0,-2);c.lineTo(-5,7);c.lineTo(5,7);c.closePath();c.fill();c.beginPath();c.moveTo(4,2);c.lineTo(9,-3);c.stroke();
        }else if(s.key==='ro_acolyte_4'){
          c.beginPath();c.moveTo(-9,-4);c.lineTo(-4,3);c.lineTo(0,0);c.lineTo(4,3);c.lineTo(9,-4);c.stroke();c.fillRect(-1,-6,2,12);c.fillRect(-4,-3,8,2);
        }else if(s.key==='ro_merchant_4'){
          c.fillRect(-6,-3,12,8);c.strokeRect(-7,5,14,2);c.fillRect(1,-6,9,3);c.fillStyle='#ffb96c';c.fillRect(-3,-1,3,2);
        }else{
          c.beginPath();c.moveTo(0,7);c.lineTo(0,-4);c.moveTo(-6,0);c.lineTo(0,4);c.lineTo(6,0);c.stroke();c.beginPath();c.arc(0,-5,4,0,Math.PI*2);c.fill();c.fillStyle='#e4b0d7';c.fillRect(-2,-7,4,4);
        }
        c.restore();
      });
    }});
  };
  // Deepen the four established summon styles without replacing chosen IDs.
  for(const [key,id,bonus]of [['ro_mage_1','mg_spirits',.35],['ro_merchant_1','mc_homun',.25],['ro_bow_3','bw_bsong',.6],['ro_bow_4','dc_partner',.25]]){
    const b=Object.values(ASC).flat().find(b=>b.k===key);b.trait.e['sk:'+id+':more']=(b.trait.e['sk:'+id+':more']||0)+bonus;
    const text=' 「'+SKILLS[id].n+'」傷害加成 +'+Math.round(bonus*100)+'%。';b.trait.d+=text;b.trait.v134Full+=text;
  }
  const add=(key,r,c,text)=>{const t=Object.values(ASC).flat().find(b=>b.k===key).t[r-1][c],extra=v140Extra(t.d,t.v134Full);v140Talent(key,r,c,null,t.d+' '+text,null,extra);};
  add('ro_mage_1',4,2,'精靈每第 3 次命中，再釋放一次元素脈衝（該次傷害 80%）。');
  add('ro_mage_1',5,2,'領域命中時，所有精靈追加 60% 召喚武器傷害，冷卻 1 秒。');
  add('ro_merchant_1',5,0,'生命體每第 3 次命中，追加 60% 撕咬傷害。');
  add('ro_merchant_1',5,1,'生命體每次命中，追加相當於你護甲 20% 的傷害。');
  add('ro_merchant_1',5,2,'藥瓶命中時，全體生命體追加 70% 召喚武器傷害，冷卻 1 秒。');
  add('ro_bow_3',5,0,'樂靈每第 4 次命中，追加 100% 重音傷害。');
  add('ro_bow_3',5,1,'施放樂曲時，每名樂靈追加 70% 召喚武器傷害。');
  add('ro_bow_3',5,2,'有護盾時，樂靈每次命中追加 35% 回音傷害。');
  add('ro_bow_4',5,0,'舞伴對魅惑目標命中時，追加 40% 影舞傷害。');
  add('ro_bow_4',5,1,'受擊或閃避時，每名舞伴反擊 90% 召喚武器傷害，冷卻 1 秒。');
  add('ro_bow_4',5,2,'舞伴每第 3 次命中，追加 90% 終舞傷害。');

  const cast=v138Cast;v138Cast=function(s,g,a,native){if(V142_BRANCHES[s.key]?.id===g.id)return v142Summon(s,g,a);return cast(s,g,a,native);};
  const strike=v138Strike;v138Strike=function(s,m,k,o={}){
    if(o.v142){const id=o.id||o.g?.id;if(id==='th_clone')k*=1+tal('minDmg');
      if(['ac_orbs','mc_plant'].includes(id)){const g=o.g||v138Gem(id);if(g)k*=1+(gemMods(g).mlife||0);}}
    return strike(s,m,k,o);
  };
  const ready=skillReady;skillReady=function(g,...args){const s=v138State();if(V142_BRANCHES[s?.key]?.id===g.id&&v142Own(s).some(p=>p.until>G.t+1))return false;return ready.call(this,g,...args);};
  const modify=v138Modify;v138Modify=function(s,m,o){
    let k=modify(s,m,o);const cfg=V142_BRANCHES[s.key];if(!cfg||!o.v142)return k;
    const x=v138Mark(s,m);if(!['ac_orbs','mc_plant'].includes(cfg.id))k*=Math.max(1,PS.skillMul/PS.minMul);
    if(s.key==='ro_bow_6'){if(s.c===2&&m.psn?.s?.length)k*=1.35;if(s.c===3)o.critm=(o.critm||0)+70;}
    if(s.key==='ro_thief_4'){if(s.b===2)o.critm=(o.critm||0)+Math.min(3,x.shadowHits||0)*15;if(s.c===2&&m.psn?.s?.length)k*=1.4;}
    if(s.key==='ro_acolyte_4'){if(s.c===2&&G.pl.shd>0)k*=1.4;if(s.c===3&&m.boss)k*=1.35;}
    if(s.key==='ro_merchant_4'){if(s.b===1)k*=1+Math.min(3,x.shells||0)*.1;if(s.c===2&&m.boss)k*=1.4;}
    if(s.key==='ro_merchant_5'){if(s.a===2)k*=1+Math.min(3,x.roots||0)*.15;if(s.b===1&&v138On(s,'fertile'))k*=1.4;if(s.c===2)k*=1+(m.psn?.s?.length||0)*.03;}
    return k;
  };
  const petHit=v140PetHit;v140PetHit=function(s,p,k=1,command=false){
    if(!p.v142)return petHit(s,p,k);
    const valid=()=>!G.dead&&v138State()===s&&s.pets.includes(p)&&p.until>G.t&&v138Gem(p.id)&&v138Live(p.m);
    if(!valid())return;
    petHit(s,p,k);if(command)return;
    p.round++;const later=(delay,scale)=>v138Later(s,delay,()=>{if(valid())petHit(s,p,k*scale);});
    if(s.key==='ro_bow_6'&&s.a===1&&p.round%3===0)later(.12,1);
    if(s.key==='ro_thief_4'&&s.a===1)later(.12,.65);
    if(s.key==='ro_thief_4'&&s.u===2){later(.1,.35);later(.2,.35);later(.3,.35);}
    if(s.key==='ro_merchant_4'){if(s.a===1)later(.1,.65);if(s.a===3&&p.round%3===0)later(.1,1);}
    if(s.key==='ro_merchant_4'&&s.u===2&&p.round%3===0)for(let i=1;i<=4;i++)later(i*.1,.75);
    if(s.u===3){
      if(s.key==='ro_bow_6')later(.25,.8);
      if(s.key==='ro_thief_4'&&p.round%3===0)later(.2,1.5);
      if(s.key==='ro_acolyte_4'&&p.round%3===0){later(.12,1);later(.24,1);}
      if(s.key==='ro_merchant_4'){later(.1,.45);later(.2,.45);}
    }
    if(s.key==='ro_merchant_5'&&s.a===3&&p.round%3===0)later(.1,1.8);
  };
  const hit=v138Hit;v138Hit=function(s,m,d,crit,o){
    hit(s,m,d,crit,o);if(s.depth||o.v138Proc||o.v6r||o.refl)return;
    const id=v138Id(o),x=v138Mark(s,m),own=v142Own(s),cfg=V142_BRANCHES[s.key];
    if(cfg){
      const pet=!!o.v142,echo=(v,tag)=>v142Echo(s,m,d*v,tag);
      if(pet){
        if(tal('v138r7')===2&&['ro_bow_6','ro_thief_4'].includes(s.key)&&v138Ready(s,'v142heal',1))heal(PS.maxhp*.02);
        if(s.key==='ro_bow_6'){if(s.b===1)v142Poison(s,m,d);if(s.b===2)v138Vul(s,m,.2,4);}
        if(s.key==='ro_thief_4'){
          x.shadowHits=(x.shadowHits||0)+1;if(s.a===3)v138Later(s,1,()=>echo(.8,'shadowWound'));
          if(s.b===1)v142Poison(s,m,d);if(s.b===3&&v138Ready(s,'shadowCP',.6))v6CpAdd(1);
        }
        if(s.key==='ro_acolyte_4'){
          if(s.a===1)v138Later(s,.3,()=>echo(.8,'returnLight'));
          if(s.a===3&&v138Count(s,'judgment',3))echo(1.6,'judgment');
          if(s.b===3&&v138Ready(s,'holyRecovery',1)){if(S.hp<PS.maxhp)heal(PS.maxhp*.01);else v138Shield(.02);}
        }
        if(s.key==='ro_merchant_4'){
          x.shells=(x.shells||0)+1;if(s.b===2&&v138Count(s,'explosiveShell',4))echo(1.6,'explosiveShell');
          if(s.c===3&&v138Ready(s,'autoReload',.8))v138Cool('mc_cannon',.5);
        }
        if(s.key==='ro_merchant_5'){
          x.roots=(x.roots||0)+1;if(s.a===1)v142Poison(s,m,d);
          if(s.b===3&&v138Ready(s,'plantRecovery',1)){heal(PS.maxhp*.02);v138Shield(.02);}
          if(s.u===3)v138Later(s,.4,()=>echo(.85,'everfruit'));
        }
      }else if(!o.min){
        if(s.key==='ro_bow_6'&&((s.a===3&&o.ba&&v138Ready(s,'bowOrder',.6))||(s.b===3&&id==='bw_snipe'&&v138Ready(s,'snipeOrder',1))))v142Volley(s,m,id==='bw_snipe'?1.2:.6);
        if(s.key==='ro_thief_4'&&['th_sonic','th_envenom'].includes(id)){
          if(s.a===2&&own.length)v138Later(s,.2,()=>{if(v142Own(s).length)echo(2.5*own.reduce((n,p)=>n+p.units,0),'finisherMimic');});
          if(s.c===3&&v138Ready(s,'cloneRefresh',1))v138Cool('th_clone',1);
          if(s.u===1&&v138Ready(s,'shadowFormation',1)){v142Volley(s,m,.6);v138Later(s,.15,()=>v142Volley(s,m,.6));}
        }
        if(s.key==='ro_acolyte_4'&&s.b===1&&id==='ac_magnus'&&v138Ready(s,'altarOrder',1))v142Volley(s,m,.7);
        if(s.key==='ro_merchant_4'&&s.b===3&&id==='mc_cannon'&&v138Ready(s,'cannonOrder',1))v142Volley(s,m);
        if(s.key==='ro_merchant_5'&&s.b===1&&id==='mc_miasma')v138Buff(s,'fertile',1,5);
      }
      return;
    }
    // Existing summon identities: elements, predation, musical beats and dance.
    if(s.key==='ro_mage_1'){
      if(o.min&&s.a===3&&v138Count(s,'elementPulse',3))v142Echo(s,m,d*.8,'elementPulse');
      if(id==='mg_field'&&s.b===3&&v138Ready(s,'fieldChoir',1))v138Strike(s,m,.6*v140Units(s),{id:'mg_spirits',min:1,v140Units:v140Units(s)});
    }
    if(s.key==='ro_merchant_1'){
      if(v140Homun(s,o)&&s.b===1&&v138Count(s,'predation',3))v142Echo(s,m,d*.6,'predation');
      if(v140Homun(s,o)&&s.b===2)v142Echo(s,m,PS.armor*.2,'armoredBite');
      if(!o.min&&s.b===3&&['mc_acidbomb','mc_firebomb'].includes(id)&&v138Ready(s,'bottleOrder',1))v138Strike(s,m,.7*v140Units(s),{id:'mc_homun',min:1,v142MergedOrder:1});
    }
    if(s.key==='ro_bow_3'&&o.min&&id==='bw_bsong'){
      if(s.b===1&&v138Count(s,'bandBeat',4))v142Echo(s,m,d,'bandBeat');
      if(s.b===3&&G.pl.shd>0)v142Echo(s,m,d*.35,'bandEcho');
    }
    if(s.key==='ro_bow_4'&&o.min&&id==='dc_partner'){
      if(s.b===1&&x.charm>G.t)v142Echo(s,m,d*.4,'mirrorDance');
      if(s.b===3&&v138Count(s,'danceFinish',3))v142Echo(s,m,d*.9,'danceFinish');
    }
  };
  const after=v138AfterCast;v138AfterCast=function(s,g,f){
    after(s,g,f);if(!f.eligible)return;const m=f.target||v138Target();
    if(s.key==='ro_acolyte_4'&&s.b===2&&g.id==='ac_wrath'){v142Volley(s,m,.75);v138Later(s,.15,()=>v142Volley(s,m,.75));}
    if(s.key==='ro_merchant_5'&&s.b===2&&g.id==='mc_spore'){v142Volley(s,m,.8);v138Later(s,.15,()=>v142Volley(s,m,.8));}
    if(s.key==='ro_bow_3'&&s.b===2&&g.id==='bw_song')v138Strike(s,m,.7*v140Units(s),{id:'bw_bsong',min:1});
  };
  const tick=v138Tick;v138Tick=function(s,dt){
    tick(s,dt);if(G.dead||!V142_BRANCHES[s.key])return;
    const m=v138Target(),pets=v142Own(s);if(!v138Live(m)||!pets.length)return;
    if(s.key==='ro_acolyte_4'&&s.u===1&&v138Ready(s,'redemptionShield',2))v138Shield(.05);
    if(tal('v138r7')===2){
      if(s.key==='ro_acolyte_4'&&v138Ready(s,'purify',3)){heal(PS.maxhp*.04);G.pl.slowT=0;}
      if(s.key.startsWith('ro_merchant_')&&v138Ready(s,'repair',2))heal(PS.maxhp*.04);
    }
    if(s.key==='ro_merchant_5'&&s.c===3&&v138Ready(s,'photosynthesis',3))v142Volley(s,m,.9);
  };
  const hurt=v138Hurt;v138Hurt=function(s,m){let k=hurt(s,m);if(V142_BRANCHES[s.key]&&v142Own(s).length){if(tal('v138r7')===1)k*=.85;if(s.key==='ro_acolyte_4'&&s.a===2)k*=.85;}return k;};
  const defense=v138Defense;v138Defense=function(s,m){
    defense(s,m);if(s.depth)return;m=v138Live(m)?m:v138Target();
    if(s.key==='ro_acolyte_4'&&s.a===2&&v138Ready(s,'guardianOrder',1))v142Volley(s,m);
    if(s.key==='ro_bow_4'&&s.b===2&&v138Ready(s,'danceCounter',1))v138Strike(s,m,.9*v140Units(s),{id:'dc_partner',min:1});
  };
  // A merged homunculus already carries its slot count in v140Modify.
  const merged=v138Modify;v138Modify=function(s,m,o){let k=merged(s,m,o);if(o.v142MergedOrder&&v140Giant(s))k/=Math.max(1,v140Count('mc_homun'));return k;};
  const book=v134BookHtml;v134BookHtml=function(...args){const n=Object.values(ASC).flat().length;return book.apply(this,args).replace('26 分支 · 624 天賦',n+' 分支 · '+n*24+' 天賦');};ui.m_talentbook=v134BookHtml;
  for(const cfg of Object.values(V142_BRANCHES)){
    const sk=SKILLS[cfg.id];let original=sk.d;
    Object.defineProperty(sk,'d',{configurable:true,enumerable:true,get(){
      const active=V142_BRANCHES[S?.tal?.asc];if(active?.id!==cfg.id)return original;
      const b=ascBranch(),u=tal('v138r8'),base=({bw_blitz:'獵鷹追蹤啄擊，基礎每擊 230%。',th_clone:'分身自主出刀，基礎每擊 320%；普攻速度也提高分身攻速。',ac_orbs:'聖靈主動追蹤，基礎每擊 70%；召喚生命輔助轉為傷害。',mc_faw:'砲台隨行射擊，基礎每發 32%。',mc_plant:'植物附著追蹤目標，基礎每擊 60%；召喚生命輔助轉為傷害。'})[cfg.id];
      return active.style+'：'+base+(u?b.t[7][u-1].d:'')+' 數量與輔助連結持續有效；完整規則見天賦圖鑑。';
    },set(value){original=value;}});
  }
  V134_RULES.push(['獨立召喚分支','獵人新增馭鷹、刺客新增幻影、祭司新增聖靈、鐵匠新增砲陣、鍊金新增植生。於轉職流派選單選擇；原配點保留。第4排改變攻擊方式，第5排可自由搭配，奧義改造該分支召喚技能。所有路線都可對單一頭目觸發。合併召喚按全部名額計算，不封頂；額外傷害不再次觸發自身。']);
  V134_RULES.push(['召喚攻擊輪次','寫「每第幾輪」的效果，由每隻召喚物的自主攻擊各自計數；號令與輔助追加不增加輪次。寫「每第幾次命中」的聖靈審判、爆裂彈匣、樂團重音等效果，則由同一角色的同類召喚共享命中計數。俯衝與重砲的基礎間隔仍會受召喚攻速縮短。']);
  const allocation=V134_RULES.find(r=>r[0]==='配點與裝備');if(allocation)allocation[1]+=' v1.4.2 新增的五個召喚分支沿用來源分支第1排屬性，第2、3排改為該召喚技能與連結修練；既有26分支的前三排不變。';
  if(HELP.asc)HELP.asc=['職業天賦',V134_RULES.map(r=>[...r])];
  if(S&&G?.pl){recalc();ui.refreshIf('char','asc','skill','more');}
}
v142Install();
