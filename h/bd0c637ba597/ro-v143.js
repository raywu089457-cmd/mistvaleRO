/* v1.4.3 — independent rows, elemental summoner and source-preserving transformations. */
'use strict';
const V143_MAGE='ro_mage_4';
const V143_HEAT='熱量上限 100。機甲加農砲每次 +25、斧頭龍捲每次 +30，另乘熱量累積加成；每秒自然減少 6。達 100 時歸零，在角色周圍 34 距離（受範圍加成）爆發 400% 武器傷害，另乘過熱傷害加成。過熱不會自傷或停止攻擊。恆溫不會過熱；排熱射擊先消耗至多 40 熱量、不再由該次加農砲生熱；超載爆發另外提高過熱傷害並給予 5 秒機械增傷。';
function v143Blocked(){return !!(G.boss||G.tw||G.arena||G.trial!=null||G.guard!=null||V1213.run||V1213B.mode||G.dead);}
function v143Clean(st){
  if(!st?.tal)return;
  const clean=p=>{if(!p||!Array.isArray(p.p))return;const b=Object.values(ASC).flat().find(b=>b.k===p.asc);if(!b)return;
    const limit=Math.min(8,Math.floor((Number(st.tal.n)||0)/2));
    p.p=b.t.map(row=>row.find(t=>p.p.includes(t.k))?.k).filter(Boolean).slice(0,limit);
  };clean(st.tal);if(st.bld)Object.values(st.bld).forEach(clean);st.tal.v138=1;delete st.tal.v133Refund;
}
function v143ChangeRow(row,key=null){
  if(v143Blocked()){toast('挑戰中不能調整職業天賦');return false;}
  const b=ascBranch();if(!b||!Number.isInteger(row)||row<0||row>=8)return false;
  const chosen=b.t[row].find(t=>S.tal.p.includes(t.k));
  if(key&&!b.t[row].some(t=>t.k===key))return false;
  if(key===chosen?.k||(!key&&!chosen))return false;
  // Row access depends on earned points, not whether another row is occupied.
  if(key&&(S.tal.n<(row+1)*2||(!chosen&&S.tal.n-S.tal.p.length*2<2)))return false;
  S.tal.p=S.tal.p.filter(k=>!b.t[row].some(t=>t.k===k));if(key)S.tal.p.push(key);
  delete G.pl.v138;recalc();S.hp=Math.min(S.hp,PS.maxhp);markDirty();ui.render();return true;
}
function v143Talent(key,r,c,n,d,e,full=''){
  v140Talent(key,r,c,n,d,null,full);if(e){const t=Object.values(ASC).flat().find(b=>b.k===key).t[r-1][c];t.e={...e,...(r>=4?{['v138r'+r]:c+1}:{})};}
}
function v143MageInstall(){
  const parent=ASC.mage[0],b=structuredClone({...parent,n:parent.n}),key=V143_MAGE,idx=4;
  b.k=key;b.v63style='元素召喚';b.v63base='巫師（元素召喚流）';
  Object.defineProperty(b,'n',{enumerable:true,configurable:true,get:()=>S?.cls==='mage'&&S.tal.asc===key?v63Title('mage',key,v63Stage()):b.v63base});
  b.d='三元素使魔自主作戰：火靈累積燃燒、冰靈碎晶、雷靈連擊；用施法選擇契約，再搭配元素輪轉與反應。';
  b.core={A:['mg_spirits','mg_fireball','mg_bolt'],S:['mg_spirit2','mg_spirit']};
  b.trait={n:'元素契約',e:{v138:1,minCrit:1,minp:100},d:'召喚傷害 +100%；使魔使用你的暴擊率與暴傷。滿 8 排命中傷害 ×4。'};
  b.trait.v134Full=b.trait.d+' 召喚元素精靈改為使魔群，基礎 2 隻，每隻每秒造成 70% 召喚武器傷害，持續 12 秒；召喚數量與攻速、原技能標籤及連結持續有效。重施刷新時間並立即攻擊，保留攻擊進度。火／冰／雷契約由最近一次親自施放的火／水／風法術決定，初始火契約。';
  const t=(r,c,n,d,e={},full='')=>({...v142Talent(key,r,c,n,d,e,full),k:key+'_v143_'+(r-1)+'_'+c});
  b.t=[parent.t[0].map((x,c)=>({...structuredClone(x),k:key+'_v143_0_'+c})),
    [t(2,0,'元素育成','使魔傷害 +30%；召喚攻速 +15%。',{'sk:mg_spirits:more':.3,minAs:.15}),t(2,1,'三靈同行','使魔數量 +1。',{'sk:mg_spirits:minion':1}),t(2,2,'靈視','暴擊率 +8%；暴擊傷害 +35%。',{crit:8,critm:35})],
    [t(3,0,'契約共鳴','精靈強化效果 +60%；使魔傷害 +15%。',{'sp:mg_spirit2:pow':.6,'sk:mg_spirits:more':.15}),t(3,1,'元素親和共鳴','連結元素親和時，使魔數量再 +1。',{'sp:mg_spirit:add':1}),t(3,2,'急速詠唱','高速詠唱效果 +60%；召喚攻速 +20%。',{'sp:mg_quick:pow':.6,minAs:.2})],
    [t(4,0,'炎靈烙印','使魔命中留下烙印，2 秒後燃燒該擊 70% 傷害。',{},'每擊各自結算；不是中毒，不佔用毒層。'),t(4,1,'冰晶共振','使魔每次命中長出冰晶；第 3 次碎裂，追加該擊 240% 傷害。',{},'同一角色對同一目標共用冰晶計數，頭目免控仍會碎裂。'),t(4,2,'雷靈疾走','使魔每輪追加兩道電弧，各造成 40% 傷害。')],
    [t(5,0,'專一契約','使魔沿用最近施放法術的元素；連續命中同一目標，每次增傷 12%，3 次達 36%。'),t(5,1,'三相輪轉','每隻使魔依火、冰、雷輪替；每完成一輪，追加 180% 該擊傷害。'),t(5,2,'施法協鳴','親自施放非召喚元素法術時，全體使魔各追擊 90% 傷害，冷卻 1 秒。')],
    [t(6,0,'靈力奔流','召喚攻速 +30%；使魔傷害 +15%。',{minAs:.3,'sk:mg_spirits:more':.15}),t(6,1,'元素穿透','使魔對頭目傷害 +40%；暴擊傷害 +20%。',{critm:20}),t(6,2,'契約回授','使魔命中使火球術與雷擊術冷卻 −0.3 秒，冷卻 0.8 秒。')],
    [t(7,0,'元素護衣','有使魔時受到傷害 −15%。'),t(7,1,'靈力回流','使魔命中回復 2% 生命，冷卻 1 秒。'),t(7,2,'契約體魄','最大生命 +25%；全屬性抗性 +10%。',{lifep:25,res_all:10})],
    [t(8,0,'元素遠征','使魔數量 +2；每隻使魔傷害 +20%。'),t(8,1,'三相交響','每隻使魔每第 3 輪攻擊，依次追加火、冰、雷各 90% 傷害。'),t(8,2,'契約降臨','親自施放元素法術後，全體使魔獲得 3 次強擊，每次傷害 +100%。',{},'每次施法刷新至 3 次，不疊加次數；每隻使魔獨立消耗。')]
  ];
  ASC.mage.push(b);V63_LINES.mage[0].ks.push(idx);V63_STYLE[key]={style:'元素召喚',A:[...b.core.A],S:[...b.core.S],d:b.d};
  const sp=structuredClone(RO_ASC_SPEC.mage[1]);sp.splice(1,5,...b.core.A,...b.core.S);RO_ASC_SPEC.mage.push(sp);RO_SPEC_KEY.set(sp,key);
  RO_ASC_STATS[key]=[...RO_ASC_STATS[parent.k]];V5_WEX[key]=structuredClone(V5_WEX['ro_mage_1']);V6_BAL[key]=V6_BAL['ro_mage_1']||1;
  V138_DEFS[key]={d:b.d};V138_POWER[key]=4;V138_ULT_IDS[key]=['mg_spirits','mg_spirits','mg_spirits'];V133_BY_KEY[key]={...V133_BY_KEY[parent.k],k:key};
  for(const id of CLASS.mage.gems)if(Array.isArray(V6_JOB[id])&&(V6_JOB[id].includes(0)||V6_JOB[id].includes(1)))V6_JOB[id].push(idx);
  for(const t of b.t[7])t.v134Full+=' 必須配置召喚元素精靈，沿用來源技能的標籤及輔助連結。';
}
function v143SourceBranches(){
  const T=v143Talent;
  const core=(key,ids,sup,desc)=>{const [,cls,i]=key.split('_'),b=ASC[cls][+i];b.core.A=ids;b.core.S=sup;b.d=desc;V63_STYLE[key].A=ids;V63_STYLE[key].S=sup;V63_STYLE[key].d=desc;
    RO_ASC_SPEC[cls][+i].splice(1,5,...ids,...sup);
    for(const id of [...ids,...sup])if(Array.isArray(V6_JOB[id])&&!V6_JOB[id].includes(+i))V6_JOB[id].push(+i);
    b.trait.v134Full=b.trait.d=v5TalText(Object.fromEntries(Object.entries(b.trait.e).filter(([k])=>k!=='v138')))+'。滿 8 排命中傷害 ×'+V138_POWER[key]+'。'+desc;
  };
  core('ro_bow_0',['bw_sharp','bw_snipe','bw_double'],['prec','bw_range'],'狙殺：蓄力重箭、弱點連射或破甲標定；以狙擊、銳利射擊與二連矢循環。');
  ASC.bow[0].trait.n='狙擊之眼';V138_ULT_IDS.ro_bow_0[2]='bw_double';
  T('ro_bow_0',3,2,'快速填裝共鳴','快速填裝效果 +60%；蓄力狙擊傷害 +10%。',{'sp:bw_quick:pow':.6,'sk:bw_snipe:more':.1});
  T('ro_bow_0',4,2,'破甲標定','銳利射擊命中標記 5 秒；普攻追加 35% 武器傷害，狙擊傷害 +50%。',{});
  T('ro_bow_0',5,2,'連射裝填','普攻命中使狙擊冷卻 −0.25 秒，冷卻 0.5 秒。',{});
  T('ro_bow_0',6,2,'穿甲彈頭','蓄力狙擊與二連矢傷害 +40%；頭目傷害 +10%。',{'sk:bw_snipe:more':.4,'sk:bw_double:more':.4,boss:.1});
  T('ro_bow_0',8,0,'穿心狙擊','蓄力狙擊改為蓄力 0.05 秒的穿心箭，造成 1000% 武器傷害；命中後 4 秒對該目標傷害 +15%。',{},'傷害、暴擊、冷卻、額外施放與投射物輔助有效；增加的箭以原扇形散射，不直接換成單體倍率。');
  T('ro_bow_0',8,2,'破綻連狙','二連矢改為兩發各 450% 武器傷害；命中使蓄力狙擊冷卻 −0.5 秒，冷卻 1 秒。',{});
  core('ro_thief_2',['th_sonic','th_envenom','th_slash'],['mstrike','th_finish'],'技能刺客：近身累積連擊點，以集中終結、短週期終結或刀痕追斬搭配。');V138_ULT_IDS.ro_thief_2[2]='th_slash';
  T('ro_thief_2',2,1,'疾刃再斬','施放技能時 12% 機率以 60% 傷害再施放；攻速 +6%。',{h_echo:.12,aspd:6});
  T('ro_thief_2',3,2,'疾風步共鳴','疾風步效果 +60%；鋒刃斬與音速投擲傷害 +20%。',{'sp:th_quick:pow':.6,'sk:th_slash:more':.2,'sk:th_sonic:more':.2});
  T('ro_thief_2',4,1,'短連擊','終結技最多消耗 2 點、傷害 +60%；每消耗 1 點使該技能冷卻 −0.5 秒。',{});
  T('ro_thief_2',5,0,'親手處決','自身終結技傷害 +40%。',{});
  T('ro_thief_2',5,1,'追加處決','終結技 0.4 秒後追加 45% 傷害，不扣連擊點、不重複觸發。',{});
  T('ro_thief_2',8,2,'斬殺連環','鋒刃斬改為近身三連斬，每斬 250% 武器傷害；親自施放時額外獲得 2 連擊點。',{});
  ASC.acolyte[2].trait.e={v138:1,skill:100};ASC.acolyte[2].trait.n='祈禱聖印';
  core('ro_acolyte_2',['ac_magnus','ac_light','ac_wrath'],['ac_bless','haste'],'祈禱：固定聖壇、隨行聖壇與雙重祭壇；以審判、屏障和禱告維持攻勢。');V138_ULT_IDS.ro_acolyte_2[1]='ac_light';
  T('ro_acolyte_2',2,1,'聖光連禱','神聖之光額外施放 +1；傷害 +15%。',{'sk:ac_light:extra':1,'sk:ac_light:more':.15});
  T('ro_acolyte_2',3,0,'賜福共鳴','天使之賜福效果 +60%；神聖之光傷害 +10%。',{'sp:ac_bless:pow':.6,'sk:ac_light:more':.1});
  T('ro_acolyte_2',3,1,'聖域共鳴','神聖領域效果 +60%；十字驅魔傷害 +15%。',{'sp:ac_area:pow':.6,'sk:ac_magnus:more':.15});
  T('ro_acolyte_2',5,2,'持續禱告','聖壇命中使神聖之光冷卻 −0.5 秒，冷卻 1 秒；神聖之光傷害 +40%。',{'sk:ac_light:more':.4});
  T('ro_acolyte_2',6,0,'聖光增幅','神聖之光額外施放 +1；傷害 +25%。',{'sk:ac_light:extra':1,'sk:ac_light:more':.25});
  T('ro_acolyte_2',8,1,'三重聖裁','神聖之光改為三道聖裁，每道 380% 武器傷害；命中回復 1% 生命，冷卻 0.5 秒。',{});
  core('ro_merchant_2',['mc_hfall','mc_cannon','mc_axe'],['mc_proj','mc_prec'],'機械：自身重砲、旋斧或機甲武裝；恆溫、排熱與過熱決定火力循環。');V138_ULT_IDS.ro_merchant_2[0]='mc_hfall';
  T('ro_merchant_2',1,0,'機匠靈巧','每 1 點靈巧：技能傷害 +0.45%、攻擊速度 +0.2%。',{'rsc:5:skill':.45,'rsc:5:aspd':.2});
  T('ro_merchant_2',2,0,'重砲超載','機甲加農砲傷害 +25%；攻擊速度 +15%。',{'sk:mc_cannon:more':.25,aspd:15});
  T('ro_merchant_2',3,1,'精準瞄準共鳴','精準瞄準效果 +60%；機甲加農砲傷害 +10%。',{'sp:mc_prec:pow':.6,'sk:mc_cannon:more':.1});
  T('ro_merchant_2',4,0,'重砲校準','加農砲命中同一目標，每次傷害 +16%，3 次達 +48%。',{});
  T('ro_merchant_2',4,1,'旋斧推進','斧頭龍捲傷害 +40%；命中使加農砲冷卻 −0.5 秒，冷卻 1 秒。',{'sk:mc_axe:more':.4});
  T('ro_merchant_2',4,2,'機甲武裝','施放大地之擊後武裝 8 秒：普攻追加 200% 武器傷害，冷卻 0.5 秒；減傷 10%。',{});
  T('ro_merchant_2',6,0,'連裝供彈','加農砲與大地之擊傷害 +30%；攻擊速度 +15%。',{'sk:mc_cannon:more':.3,'sk:mc_hfall:more':.3,aspd:15});
  T('ro_merchant_2',8,0,'震地機甲','大地之擊改為三次震地，各 380% 武器傷害；施放後武裝 8 秒，普攻追加 200%，冷卻 0.5 秒；減傷 10%。',{});
  core('ro_merchant_3',['mc_miasma','mc_acidbomb','mc_spore'],['mc_acid','mc_quick'],'毒雲：地面毒域、寄生毒或毒液濺射；養毒、收割與腐蝕引爆各自搭配。');V138_ULT_IDS.ro_merchant_3[1]='mc_acidbomb';
  T('ro_merchant_3',3,1,'腐蝕配方','強酸火煙瓶傷害 +25%；中毒上限 +2。',{'sk:mc_acidbomb:more':.25,psnMax:2});
  T('ro_merchant_3',4,2,'毒液濺射','毒雲命中追加 180% 武器傷害並疊一層毒，冷卻 0.5 秒。',{});
  T('ro_merchant_3',6,1,'腐蝕共生','強酸火煙瓶傷害 +35%；每秒回復 0.6% 生命。',{'sk:mc_acidbomb:more':.35,regenPct:.006});
  T('ro_merchant_3',8,1,'腐蝕穿心','強酸火煙瓶改為集中腐蝕，造成 900% 武器傷害；每層毒額外增傷 4%，保留毒層。',{});
}
function v143Summon(s,g,a){
  const m=v138Target();if(!v138Live(m))return false;
  const mage=s.key===V143_MAGE,legacy=s.key==='ro_mage_1',n=mage?Math.max(1,v140Count(g.id)+(s.u===1?2:0)):legacy?v140Count(g.id):v142Count(s);
  const key=legacy?'spiritKing':'v143:'+s.key,old=s.pets.filter(p=>p.key===key);
  let k=mage?.7*(s.u===1?1.2:1):legacy?(s.u===1?2.5:MIN.k):({ro_bow_6:2.3,ro_acolyte_4:.7,ro_merchant_5:.6})[s.key],interval=1;
  if(s.key==='ro_bow_6'&&s.a===2){k*=2.1;interval=1.6;}
  if(s.key==='ro_acolyte_4'&&s.u===1)k*=1.6;
  v140Pet(s,key,g.id,m,mage?12:legacy?8:10,k,{count:n,interval,root:true});
  const pets=s.pets.filter(p=>p.key===key);
  pets.forEach((p,i)=>{p.v143=1;p.v142=!mage&&!legacy;p.round=old[i]?.round||0;p.o.v142=p.v142;p.o.v143Pet=1;p.o.hcrit=1;p.element=['fire','water','wind'][i%3];p.strong=old[i]?.strong||0;});
  pets.forEach(p=>v140PetHit(s,p,a,true));s.stats.transforms++;return true;
}
// Visuals use the existing RO effect atlas when available, with code-drawn
// rune rings, pixel blades, crosses, petals and elemental familiars as fallback.
function v143Fx(s,id,m,phase='hit',element){
  if(!s||!m||G.pl.v138!==s)return;
  const stamp=id+':'+phase;if(!v138Ready(s,'fx:'+stamp,phase==='hit'?.08:.15))return;
  s.stats.visuals=(s.stats.visuals||0)+1;
  const sk=SKILLS[id]||{},el=element||sk.el||'neutral',col=V6_C[el]?.[0]||'#e9d6ad';
  v6Ro(id,m.x,m.y);const x=m.x,y=m.y-7,cls=s.key.split('_')[1];
  v6Ent({v143Fx:1,life:.42,draw:(e,c)=>{const t=e.t/.42;c.save();c.translate(x,y);c.globalAlpha=(1-t)*.85;c.strokeStyle=col;c.fillStyle=col;c.lineWidth=2;
    if(cls==='thief'||cls==='sword'){for(let i=0;i<3;i++){c.beginPath();c.moveTo(-16+i*6,-12+t*18);c.lineTo(10+i*4,8-t*10);c.stroke();}}
    else if(cls==='acolyte'){v6DrawCross(c,0,-t*8,18+t*12,3,col,1-t);v6Ell(c,0,6,14+t*16,col,.7*(1-t),false,2);}
    else if(id==='mc_plant'||s.key==='ro_merchant_5'){for(let i=0;i<6;i++){const a=i*Math.PI/3+t;c.fillRect(Math.cos(a)*(5+t*18),Math.sin(a)*(3+t*9),4,4);}}
    else if(cls==='mage'){c.rotate(t);for(let i=0;i<4;i++){c.rotate(Math.PI/2);c.strokeRect(-9,-9,18,18);}v6Ell(c,0,0,12+t*18,col,.8*(1-t),false,2);}
    else if(cls==='bow'){c.beginPath();c.moveTo(-20*(1-t),9);c.lineTo(12,-5);c.lineTo(5,-5);c.moveTo(12,-5);c.lineTo(9,2);c.stroke();}
    else{c.strokeRect(-8-t*10,-8-t*10,16+t*20,16+t*20);for(let i=0;i<4;i++){c.rotate(Math.PI/2);c.fillRect(8+t*14,0,7,3);}}
    c.restore();}});
}
const V143_CARDS=new Map();
const v143CardScope=()=>V126.on?'account:'+V126.acc:'local';
function v143CardUnion(...sources){const out={};for(const src of sources)for(const id of Object.keys(src||{}))if(src[id]&&V5_CARD[id])out[id]=1;return out;}
function v143CharCards(st){
  const cards=v143CardUnion(st?.v5?.seen,st?.v5?.cards);
  for(const it of [...Object.values(st?.equip||{}),...(st?.bag||[])])for(const id of it?.cards||[])if(V5_CARD[id])cards[id]=1;
  return cards;
}
function v143BundleCards(data){
  if(!data?.cur)return data;
  const chars=[data.cur,...Object.values(data.chars||{})],seen=v143CardUnion(data.stash?.v143Seen,...chars.map(v143CharCards));
  data.stash||={};data.stash.v143Seen={...seen};
  for(const ch of chars){ch.v5||={cards:{},seen:{}};ch.v5.seen={...seen};}
  return data;
}
function v143SyncCards(){
  if(!S)return;
  // Party simulations temporarily swap S to a teammate's snapshot. Never
  // merge that snapshot's collection into the signed-in account.
  if(V1213.run&&V1213.cur&&V1213.cur!==V1213.run.world){S.v5||={cards:{},seen:{}};return S.v5;}
  const scope=v143CardScope();let seen=V143_CARDS.get(scope);const stash=stLoad();
  if(!seen){seen=v143CardUnion(stash.v143Seen);for(const r of rosterGet().list||[])Object.assign(seen,v143CharCards(r.id===S.cid?S:charLoad(r.id)));V143_CARDS.set(scope,seen);}
  Object.assign(seen,v143CardUnion(stash.v143Seen),v143CharCards(S));
  S.v5||={cards:{},seen:{}};S.v5.cards||={};S.v5.seen=seen;
  if(Object.keys(seen).length!==Object.keys(stash.v143Seen||{}).length){stash.v143Seen={...seen};if(stWrite(stash)){STH=stash;markDirty();}}
  return S.v5;
}
function v143CardsInstall(){
  const clean=stClean;stClean=function(data){const out=clean(data);out.v143Seen=v143CardUnion(data?.v143Seen);return out;};
  const st=v5St;v5St=function(){return S?v143SyncCards():st();};
  const rc=recalc;recalc=function(...args){if(S)v143SyncCards();return rc.apply(this,args);};
  const gain=v5GainCard;v5GainCard=function(...args){const result=gain.apply(this,args);v143SyncCards();return result;};
  const save=saveNow;saveNow=function(...args){v143SyncCards();return save.apply(this,args);};
  const data=bkData;bkData=function(...args){v143SyncCards();return v143BundleCards(data.apply(this,args));};
  const encode=bkEncode;bkEncode=function(data){return encode(data?v143BundleCards(data):bkData());};
  const decode=bkDecode;bkDecode=async function(...args){return v143BundleCards(await decode.apply(this,args));};
  const cache=v1232Cache;v1232Cache=function(...args){return v143BundleCards(cache.apply(this,args));};
  const write=v126WriteCache;v126WriteCache=async function(data,r){V143_CARDS.delete(v143CardScope());return write(v143BundleCards(data),r);};
  const del=charDelete;charDelete=function(...args){v143SyncCards();return del.apply(this,args);};
  const book=v5CodexHtml;v5CodexHtml=function(...args){return '<p class="note">同帳號角色共用已取得卡片與蒐藏加成；持有張數與裝備鑲卡仍屬於目前角色。未登入的本機角色另行共用，不與登入帳號混合。</p>'+book.apply(this,args);};
  if(HELP.cards)HELP.cards[1].unshift(['帳號共用','同帳號所有角色共用卡片圖鑑的已取得紀錄與原蒐藏加成；卡片實物、持有張數和鑲卡不轉移。首次更新合併該帳號既有角色的紀錄，並隨雲端存檔同步；未登入本機與各登入帳號互相獨立。']);
}
function v143RefPity(it){const p=it?.v143Refine;return p?.level===(it.ref||0)+1?Math.max(0,Math.min(34,Math.floor(Number(p.fails)||0))):0;}
function v143RefChance(it){return Math.min(100,(V79_REF.ok[(it.ref||0)+1]||0)+v143RefPity(it)*3);}
function v143RefineInstall(){
  // Legendary ore protects the current refinement level, not the success roll.
  // Socketing and removal still use their existing independent rules.
  const refine=v5Refine;v5Refine=function(u,...args){
    if(!v79Lg()){const it=v5Find(u),ref=it?.ref,result=refine.call(this,u,...args);if(it&&it.ref!==ref&&it.v143Refine){delete it.v143Refine;markDirty();}return result;}
    const it=v5Find(u);if(!it||(it.ref||0)>=V79_REF.max)return;
    const lv=(it.ref||0)+1,base=v5RefMat(it,lv),mat=S.mat[base]>0?base:v89Sub(base),z=v5RefZeny(it,lv),need=v79Need(it);
    if(!mat||!(S.mat[mat]>0)||S.ash<z)return void toast('素材或 Zeny 不足','bad');
    if(need&&!(S.mat.p2>0))return void toast('此次精煉仍需 1 個「'+MATS.p2.n+'」','bad');
    S.mat[mat]--;S.mat.lg1--;S.ash-=z;if(need)S.mat.p2--;
    const chance=v143RefChance(it),fails=v143RefPity(it),ok=RAND()*100<chance;
    if(ok){it.ref=lv;delete it.v143Refine;}else it.v143Refine={level:lv,fails:Math.min(34,fails+1)};
    ui.v5res={t:performance.now(),ok,txt:(ok?'精煉成功！'+it.base+' +'+lv:'精煉失敗，傳說石保護不退階；下次使用傳說石成功率 '+v143RefChance(it)+'%')+'（消耗傳說的魔力礦石 1 顆）'+(need?'（消耗 1 個'+MATS.p2.n+'）':'')+(mat!==base?'（以 1 個'+MATS[mat].n+'代替'+MATS[base].n+'）':'')};
    v5Name(it);sfx(ok?'alch':'alchF',ok?Math.min(3,Math.ceil(lv/4)):1);recalc();markDirty();ui.refreshIf('alch','bag','char');
  };
  const top=v79RefTop;v79RefTop=function(it,...args){
    let html=top.call(this,it,...args);const lv=(it.ref||0)+1;
    html=html.replace('使用「傳說的魔力礦石」：必定成功（每次消耗 1 顆）','使用「傳說的魔力礦石」：失敗時 100% 不退階，每次失敗成功率 +3 個百分點（每次消耗 1 顆）');
    if(lv<=V79_REF.max){const pity=v143RefPity(it)*3,base=V79_REF.ok[lv],chance=v143RefChance(it);
      html=html.replace('</h3>','</h3><p class="note">傳說石精煉：原始 '+base+'% ＋失敗加成 '+Math.min(100-base,pity)+'% ＝ '+chance+'%（上限 100%）。同件裝備、同一目標階級累積；成功升階或普通精煉退階後歸零。未勾選傳說石時不套用加成。</p>');
      if(v79Lg())html=html.replace(/成功率 <b class="px">\d+%<\/b>/,'成功率 <b class="px">'+chance+'%</b>').replace('失敗時精煉值 −1','失敗時精煉值不變（傳說石保護）').replace('不提供保護，失敗時精煉值照常下降','祝福本身不提供保護；已勾選傳說石，失敗不退階');
    }
    return html;
  };
  const text='精煉時：失敗時 100% 不退階，每次失敗使同件裝備下一次傳說石精煉成功率 +3 個百分點，最高 100%。成功升階或普通精煉退階後歸零；累積紀錄隨裝備存檔，未勾選傳說石不套用加成。鑲嵌卡片成功率不變，失敗卡片必定退回；拆卸卡片必定成功。每次使用消耗 1 顆，原本金屬、Zeny 與必要祝福仍需消耗。';
  V64_MAT_USE.lg1=text+' MVP 武道場 10% 掉落。';
  for(const key of ['alch','v5ref','v5mat']){const rows=HELP[key]?.[1];if(!rows)continue;const row=rows.find(r=>r[0]==='傳說的魔力礦石');if(row)row[1]=text;else rows.push(['傳說的魔力礦石',text]);}
}
function v143GearInstall(){
  // calc() returns the engine's old 75% armor/dodge caps; recalc() applies the
  // current class/monster-level formula. A preview must use that same formula.
  const normalize=p=>{const lv=v68CtxLv();
    if(p)Object.assign(p,{v68lv:lv,armFlat:v68Flat(p.armor),armRed:v68ArmPct(p.armor,lv),armRaw:v68ArmRaw(p.armor,lv),dodge:v68Dodge(p.eva,lv),dodgeV68:v68EvaRaw(p.eva,lv)});
    if(p&&V1213.run&&V1213.cur&&V1213.cur!==V1213.run.world){p.move=Math.min(p.move,32*(p.act||1));if(V1213.cur===V1213.run.lead){p.maxhp=Math.round(p.maxhp*(1+V1213.cfg.lead));p.dps*=1+V1213.cfg.lead;}}
    return p;
  };
  const preview=previewEquip;previewEquip=function(...args){return normalize(preview.apply(this,args));};
  // Re-evaluate both sides in the same current buff/talent context. A saved
  // panel DPS can predate a passive aura being initialized.
  const advice=roGearAdvice;let source=null,base=null;
  roGearAdvice=function(item,...args){const previous=PS;if(!previous)return advice.call(this,item,...args);
    if(source!==previous){source=previous;base=normalize(calc());}
    PS=base;try{return advice.call(this,item,...args);}finally{PS=previous;}
  };
  roGearCache={ps:null,items:new WeakMap()};pvClear();
}
function v143Install(){
  v143MageInstall();v143SourceBranches();
  v138Migrate=v143Clean;v133Migrate=v143Clean;
  const asc=ui.ascHtml;ui.ascHtml=function(...args){
    let html=asc.apply(this,args);const b=ascBranch();if(!b)return html;const blocked=v143Blocked();
    html=html.replace(/(<h3>第 (\d+) 排[^<]*)<\/h3>/g,(_,head,r)=>{const selected=b.t[+r-1].some(t=>S.tal.p.includes(t.k));return head+' <button class="btn sm" data-act="v143Refund" data-row="'+(+r-1)+'" '+(!selected||blocked?'disabled':'')+'>退回本排・2 點</button></h3>';});
    html=html.replace(/<button class="btn sm[^"<]*" data-act="talL" data-k="([^"]+)"[^>]*>[\s\S]*?<\/button>/g,(_,key)=>{const r=b.t.findIndex(row=>row.some(t=>t.k===key)),used=b.t[r].some(t=>S.tal.p.includes(t.k)),ok=S.tal.n>=(r+1)*2&&(used||S.tal.n-S.tal.p.length*2>=2);return '<button class="btn sm" data-act="talL" data-k="'+key+'" '+(!ok||blocked?'disabled':'')+'>'+(blocked?'挑戰中禁止':used?'改選本項':ok?'學習・2 點':'天賦點不足')+'</button>';});
    let card=0;html=html.replace(/class="tal([^\w"][^"]*|)"/g,(match,classes)=>{const r=Math.floor(card++/3);return r<8&&S.tal.n>=(r+1)*2?'class="tal'+classes.replace(/\blocked\b/g,'')+'"':match;});
    return '<p class="note">可免費退回單排 2 點，其他排保留；已獲得每 2 點解鎖一排。挑戰中禁止退點、改選與重置。</p>'+html;
  };
  const panel=onPanelClick;onPanelClick=function(e){const a=e.target.closest('[data-act]');if(!a)return panel(e);const act=a.dataset.act;
    if(act==='v143Refund')return v143ChangeRow(+a.dataset.row);
    if(act==='talL'){const r=ascBranch()?.t.findIndex(row=>row.some(t=>t.k===a.dataset.k));return v143ChangeRow(r,a.dataset.k);}
    if(v143Blocked()&&['talReset','talResetYes','ascReset','ascResetYes'].includes(act)){toast('挑戰中不能調整職業天賦');return;}
    return panel(e);
  };
  const range=skillRange;skillRange=function(g,...args){const s=v138State();if(!s)return range.call(this,g,...args);const u=s.u;s.u=0;try{return range.call(this,g,...args);}finally{s.u=u;}};
  const ready=skillReady;skillReady=function(g,...args){const s=v138State();if(s){
    const owned=s.pets.filter(p=>p.v143&&p.id===g.id);if(owned.some(p=>p.until>G.t+1))return false;
    if((s.key===V143_MAGE||s.key==='ro_mage_1'&&(s.b===1||s.u===1))&&g.id==='mg_spirits')return v138Live(v138Target());
    if(s.u&&V138_ULT_IDS[s.key][s.u-1]===g.id&&!SKILLS[g.id].sus){const r=skillRange(g);if(r!=null&&(!v138Live(v138Target())||dist(G.pl,v138Target())>r))return false;}
  }return ready.call(this,g,...args);};
  const ctx=v138Context;v138Context=function(g,a,s){const c=ctx(g,a,s);if(s.u&&V138_ULT_IDS[s.key][s.u-1]===g.id){if(v6Linked(g,'mc_invest')&&v6PayZeny(3))c.r*=1.5;if(v6Linked(g,'mc_heavy'))c.r*=1+(v6CartMul()-1)*2;}return c;};
  const push=roPushFx;roPushFx=function(array,...items){
    const sources=items.map(p=>p?.o?.v140Pet&&p.o.v6sk?{p,id:p.o.v6sk,g:p.o.g||p.o.v6g,el:p.o.v6el,tg:p.o.tg}:null);
    const result=push(array,...items);
    for(const src of sources)if(src){Object.assign(src.p.o,{v6sk:src.id,v6g:src.g,v6el:src.el,tg:src.tg,v138elementMul:0,v138lanceBonus:0,v138spentCP:0,v138spentSph:0});src.p.roSkill=src.id;}
    return result;
  };
  const cast=v138Cast;v138Cast=function(s,g,a,native){
    const id=g.id,m=v138Target();if(!v138Live(m))return cast(s,g,a,native);
    if((s.key===V143_MAGE||s.key==='ro_mage_1'&&(s.b===1||s.u===1))&&id==='mg_spirits')return v143Summon(s,g,a);
    if(['ro_bow_6','ro_acolyte_4','ro_merchant_5'].includes(s.key)&&id===V142_BRANCHES[s.key].id)return v143Summon(s,g,a);
    const ult=s.u&&V138_ULT_IDS[s.key][s.u-1]===id;
    if(s.key==='ro_merchant_2'&&id==='mc_hfall'&&s.a===3&&!ult)v138Buff(s,'mecha',1,8);
    if(ult&&((s.key==='ro_bow_0'&&[1,3].includes(s.u))||(s.key==='ro_thief_2'&&s.u===3)||(s.key==='ro_acolyte_2'&&s.u===2)||(s.key==='ro_merchant_2'&&s.u===1)||(s.key==='ro_merchant_3'&&s.u===2))){
      const c=v138Context(g,a,s),burst=(n,k,iv=.12,delay=0)=>v138Burst(s,c,n,k,iv,delay);
      if(s.key==='ro_bow_0'){if(s.u===1){v138Shield(.12);burst(1,10,1,.05);G.pl.anim={k:'shoot',t:0,dur:.05,a:aimAt(m)};}else burst(2,4.5,.15);}
      if(s.key==='ro_thief_2'){burst(3,2.5,.1);if(!c.o.v138extra)v6CpAdd(2);}
      if(s.key==='ro_acolyte_2')burst(3,3.8,.15);
      if(s.key==='ro_merchant_2'){burst(3,3.8,.2);v138Buff(s,'mecha',1,8);}
      if(s.key==='ro_merchant_3')burst(1,9*(1+(m.psn?.s?.length||0)*.04));
      s.stats.transforms++;v143Fx(s,id,G.pl,'cast');return true;
    }
    const result=cast(s,g,a,native);if(result===true)v143Fx(s,id,G.pl,'cast');return result;
  };
  // Scheduled effects retain original source tags and gem. AoE/projectile
  // support changes geometry, not an invented unconditional single-target bonus.
  const strike=v138Strike;v138Strike=function(s,m,k,o={}){
    const id=o.id||o.v6sk||o.g?.id,g=o.g||v138Gem(id),sk=SKILLS[id],mods=g?gemMods(g):null;
    if(!v138Live(m)||G.dead||G.pl.v138!==s||(id&&!g))return 0;
    v143Fx(s,id||'talent',m,'hit',o.v6el);
    if(o.root&&!o.min&&!o.ba&&sk?.tg.includes('proj')&&!o.v143Geometry){
      const opt={...v6Opts(g,mods),...o,id,v6sk:id,v143Geometry:1,kb:0};
      fan({k:sk.el==='fire'?'fire':'arrow',x:G.pl.x,y:G.pl.y-7,spd:380,mult:k*(o.scaled?1:1+mods.dmg),r:sk.tg.includes('aoe')?18*PS.area*(1+mods.area):0,o:opt},m,aimAt(m),mods.proj||0);return 0;
    }
    const result=strike(s,m,k,o);
    if(o.root&&!o.min&&!o.ba&&sk?.tg.includes('aoe')&&!o.v143Geometry)for(const target of v6Near(m.x,m.y,18*PS.area*(1+mods.area)))if(target!==m)strike(s,target,k,{...o,v143Geometry:1});
    return result;
  };
  const extra=castExtra;castExtra=function(g,mods,a){const s=v138State();if(s&&s.pets.some(p=>(p.v142||p.v143)&&p.id===g.id))return;return extra(g,mods,a);};
  const damage=hitMob;hitMob=function(m,k,o={}){
    // Scheduled summons have no health pool. Preserve the life half of their
    // linked support as damage; v142 already handles its holy/plant sources.
    if(o.v140Pet&&!(o.v142&&['ac_orbs','mc_plant'].includes(v138Id(o)))){
      const g=o.g||o.v6g||v138Gem(v138Id(o));if(g)k*=1+(gemMods(g).mlife||0);
    }
    return damage.call(this,m,k,o);
  };
  const hit=v138Hit;v138Hit=function(s,m,d,crit,o){
    // Disable the superseded summoning hooks before dispatching old layers.
    const a=s.a,b=s.b,c=s.c;
    if(s.key==='ro_bow_0'){if(a===3)s.a=0;if(b===3)s.b=0;}
    if(s.key==='ro_acolyte_2'&&b===3)s.b=0;
    if(s.key==='ro_merchant_3'&&a===3)s.a=0;
    try{hit(s,m,d,crit,o);}finally{s.a=a;s.b=b;s.c=c;}
    if(s.depth||o.v138Proc||o.v6r||o.refl)return;
    const id=v138Id(o),x=v138Mark(s,m);
    if(s.key==='ro_bow_0'){
      if(a===3&&id==='bw_sharp')x.falcon=G.t+5;
      if(b===3&&o.ba&&v138Ready(s,'reload143',.5))v138Cool('bw_snipe',.25);
      if(s.u===1&&id==='bw_snipe')v138Vul(s,m,.15,4);
      if(s.u===3&&id==='bw_double'&&v138Ready(s,'doubleReload',1))v138Cool('bw_snipe',.5);
    }
    if(s.key==='ro_acolyte_2'){if(b===3&&id==='ac_magnus'&&v138Ready(s,'prayer143',1))v138Cool('ac_light',.5);if(s.u===2&&id==='ac_light'&&v138Ready(s,'holy143',.5))heal(PS.maxhp*.01);}
    if(s.key==='ro_merchant_2'){if(a===1&&id==='mc_cannon')x.calibration=Math.min(3,(x.calibration||0)+1);if(a===2&&id==='mc_axe'&&v138Ready(s,'axe143',1))v138Cool('mc_cannon',.5);}
    if(s.key==='ro_merchant_3'&&a===3&&id==='mc_miasma'&&v138Ready(s,'toxic143',.5)){v138Strike(s,m,1.8,{id:'mc_miasma'});v138Poison(s,m,1);}
    if(o.v143Pet){
      if(s.key==='ro_bow_6'&&s.u===2){v142Echo(s,m,d*.6,'stormRelay');v143Fx(s,'mg_bolt',m,'hit','wind');}
      if(s.key==='ro_acolyte_4'&&s.u===2&&v138Count(s,'choir143',3)){v142Echo(s,m,d*3.6,'choirJudgment');v143Fx(s,'ac_wrath',m);}
      if(s.key===V143_MAGE){
        if(a===1)v138Later(s,2,()=>v142Echo(s,m,d*.7,'ember143'));
        if(a===2){x.ice=(x.ice||0)+1;if(x.ice%3===0)v142Echo(s,m,d*2.4,'ice143');}
        if(b===1)x.contractHits=Math.min(3,(x.contractHits||0)+1);
        if(c===3&&v138Ready(s,'return143',.8))v138Cool(['mg_fireball','mg_bolt'],.3);
        if(tal('v138r7')===2&&v138Ready(s,'mageHeal143',1))heal(PS.maxhp*.02);
      }
    }
  };
  const modify=v138Modify;v138Modify=function(s,m,o){let k=modify(s,m,o);const id=v138Id(o),x=v138Mark(s,m);
    if(s.key==='ro_thief_2'&&s.a===2&&V6_FIN.has(id))k*=1.6;
    if(s.key==='ro_merchant_2'&&s.a===1&&id==='mc_cannon')k*=1+(x.calibration||0)*.16;
    if(s.key===V143_MAGE&&o.min){if(s.b===1)k*=1+(x.contractHits||0)*.12;if(s.c===2&&m.boss)k*=1.4;}
    return k;
  };
  const petHit=v140PetHit;v140PetHit=function(s,p,k=1,command=false){
    if(!p.v143)return petHit(s,p,k,command);
    if(G.dead||G.pl.v138!==s||!s.pets.includes(p)||p.until<=G.t||!v138Gem(p.id)||!v138Live(p.m))return;
    if(s.key!==V143_MAGE){
      // Legacy mage keeps all spirits; v140Units=1 prevents multiplying slots twice.
      const result=petHit(s,p,k,command);
      if(!command&&s.key==='ro_merchant_5'&&s.u===2&&p.round%2===0)v138Later(s,.2,()=>{if(s.pets.includes(p)&&p.until>G.t)petHit(s,p,k*4.2,true);});
      return result;
    }
    const g=v138Gem(p.id),mods=gemMods(g);p.round+=command?0:1;
    const el=s.b===2?['fire','water','wind'][Math.max(0,p.round-1)%3]:(s.contract||'fire');p.element=el;
    const boost=!command&&s.u===3&&p.strong>0?2:1;if(boost===2)p.strong--;
    const fire=(scale,element=el,root=false)=>{if(G.pl.v138===s&&s.pets.includes(p)&&p.until>G.t&&v138Live(p.m))return v138Strike(s,p.m,p.k*k*scale*boost,{...p.o,g,id:p.id,min:1,root,v6el:element});};
    fire(1,el,true);
    for(let i=0;i<(mods.extra||0);i++)v138Later(s,.12*(i+1),()=>fire(.6,el,true));
    if(!command){if(s.a===3){v138Later(s,.12,()=>fire(.4));v138Later(s,.24,()=>fire(.4));}
      if(s.b===2&&p.round%3===0)v138Later(s,.15,()=>fire(1.8));
      if(s.u===2&&p.round%3===0)['fire','water','wind'].forEach((e,i)=>v138Later(s,.12*(i+1),()=>fire(.9,e)));
    }
  };
  const after=v138AfterCast;v138AfterCast=function(s,g,f){after(s,g,f);if(!f.eligible||s.key!==V143_MAGE||g.id==='mg_spirits')return;
    const el=SKILLS[g.id].el;if(!['fire','water','wind'].includes(el))return;s.contract=el;const pets=s.pets.filter(p=>p.v143);
    if(s.u===3)pets.forEach(p=>p.strong=3);
    if(s.b===3&&v138Ready(s,'resonance143',1))pets.forEach(p=>v140PetHit(s,p,.9,true));
  };
  const hurt=v138Hurt;v138Hurt=function(s,m){return hurt(s,m)*(s.key===V143_MAGE&&tal('v138r7')===1&&s.pets.some(p=>p.v143&&p.until>G.t)?.85:1);};
  const visual=v138Visual;v138Visual=function(s){visual(s);if(s.key!==V143_MAGE)return;
    v6Ent({life:1e9,upd:e=>{if(G.pl.v138!==s||G.dead)e.t=e.life;},draw:(e,c)=>{if(G.pl.v138!==s)return;s.pets.filter(p=>p.v143).forEach((p,i)=>{const a=G.t+i*2.4,x=G.pl.x+Math.cos(a)*22,y=G.pl.y-15+Math.sin(a)*10,col=V6_C[p.element||'fire'][0];c.save();c.translate(x,y);c.fillStyle=col;c.strokeStyle='#fff4d1';c.lineWidth=1;
      if(p.element==='water'){c.beginPath();c.moveTo(0,-8);c.lineTo(5,0);c.lineTo(0,7);c.lineTo(-5,0);c.closePath();c.fill();c.stroke();}
      else if(p.element==='wind'){c.beginPath();c.moveTo(2,-8);c.lineTo(-5,1);c.lineTo(0,1);c.lineTo(-2,8);c.lineTo(6,-2);c.lineTo(1,-2);c.closePath();c.fill();}
      else{c.beginPath();c.moveTo(0,-9-Math.sin(G.t*9+i)*2);c.quadraticCurveTo(8,0,4,5);c.quadraticCurveTo(-5,9,-5,0);c.closePath();c.fill();}c.fillStyle='#fff9df';c.fillRect(-2,-1,1,2);c.fillRect(2,-1,1,2);c.restore();});}});
  };
  v143Talent('ro_bow_6',8,1,'雷翼接力','保留全部獵鷹；每次啄擊追加該擊 60% 雷電傷害。',{});
  v143Talent('ro_acolyte_4',8,1,'聖歌審判','保留全部聖靈；每第 3 次命中追加該擊 360% 審判傷害。',{},'同一角色的聖靈共用命中計數。');
  v143Talent('ro_merchant_5',8,1,'怒放花潮','保留全部植物；每株每第 2 輪開花，追加 420% 傷害。',{});
  v143Talent('ro_mage_1',5,0,'靈契凝聚','全部精靈傷害 +35%；各自保留攻擊與名額。',{});
  v143Talent('ro_mage_1',8,0,'靈王近衛','全部精靈進階為靈王近衛，持續 8 秒，每隻每次造成 250% 召喚武器傷害。',{},'基礎每秒一次，保留召喚數量、攻速、暴擊與額外施放連結。');
  for(const key of ['ro_bow_6','ro_acolyte_4','ro_merchant_5']){const b=Object.values(ASC).flat().find(b=>b.k===key);b.trait.v134Full=b.trait.v134Full.replace('單體合併完整換算名額，沒有轉傷害上限。','所有奧義保留完整召喚編隊。');}
  for(const r of [5,6])for(const t of ASC.merchant[2].t[r-1])if(/熱/.test(t.d))t.v134Full+=' '+V143_HEAT;
  V134_RULES.push(['過熱與排熱',V143_HEAT],['單排退點','挑戰外可免費退回任一排 2 點或直接改選本排；後續排保留。每累積取得 2 點解鎖一排，最高 8 排。頭目、爬塔、試煉、競技場、守衛及組隊副本中禁止更動。'],['召喚分工','馭鷹是啄擊與雷翼接力；幻影是自主快刀與終結模仿；聖靈是往返聖矢與審判；砲陣是射擊節奏；植生是毒藤與開花；元素召喚是三元素使魔與契約。只有生命體保留多隻合為巨獸。原狙殺、技能刺客、祈禱、機械、毒雲的召喚天賦已換成自身技能玩法。原技能盤不自動更換，請依新奧義指定技能調整。']);
  for(const r of V134_RULES){if(r[0]==='技能魔化')r[1]='魔化保留原技能標籤與來源寶石。傷害、暴擊、屬性、冷卻與額外施放按原連結生效；投射物增加實際散射箭，範圍擴大實際命中區域，不一律換成單體倍率。持續召喚的額外施放作用於攻擊輪次，不重複疊上施法額外次數。';if(r[0]==='獨立召喚分支')r[1]=r[1].replace(/合併召喚.*$/,'所有路線均可對單一頭目觸發。');}
  const inherit=V134_RULES.find(r=>r[0]==='召喚繼承');if(inherit)inherit[1]='召喚攻擊承接來源寶石的傷害、暴擊、數量、攻速與額外施放。沒有生命欄的改造召喚物，召喚生命加成改為傷害；每個名額維持獨立攻擊，只有生命體巨獸保留合併。巨獸完整換算名額，守護仍保留原有60%減傷上限。存儲追擊以來源已結算傷害計算，不重複乘暴擊或武器倍率。';
  const allocation=V134_RULES.find(r=>r[0]==='配點與裝備');if(allocation)allocation[1]='每分支 8 排、每排 3 選 1、每項 2 點，可跨欄搭配。第 1 排保留屬性選裝方向；機械的靈巧改強化自身攻速。獨立召喚分支的第 2、3 排強化召喚與連結；原狙殺、技能刺客、祈禱、機械、毒雲已改成自身技能玩法。每累積取得 2 點解鎖下一排；單排退點不移除後續排。';
  const revision=V134_RULES.find(r=>r[0]==='版本與退點');if(revision)revision[1]='v1.4.3 保留既有配點 ID、總點數、職業分支、裝備、寶石與已達層數。調整後的奧義可能需要更換技能盤上的來源技能，可於挑戰外免費單排改選。圖鑑列基礎實裝值，面板 DPS 不能完整表達延遲、條件與存儲傷害。';
  const independent=V134_RULES.find(r=>r[0]==='獨立召喚分支');if(independent)independent[1]='獵人有馭鷹、刺客有幻影、祭司有聖靈、鐵匠有砲陣、鍊金有植生，巫師新增元素召喚。從轉職流派選單選擇，各有完整 8 排。第 4 排決定攻擊方式、第 5 排自由搭配，第 8 排改造召喚技能；對單一頭目也能觸發。';
  const book=v134BookHtml;v134BookHtml=function(...a){const n=Object.values(ASC).flat().length;return book(...a).replace(/\d+ 分支 · \d+ 天賦/,n+' 分支 · '+n*24+' 天賦');};ui.m_talentbook=v134BookHtml;
  const descriptions=new Set([...Object.values(V138_ULT_IDS).flat(),'mg_spirits']);
  for(const id of descriptions){const sk=SKILLS[id];const prior=Object.getOwnPropertyDescriptor(sk,'d');let original=prior.value;
    Object.defineProperty(sk,'d',{enumerable:true,configurable:true,get(){const base=prior.get?prior.get.call(sk):original,s=v138State(),b=S?ascBranch():null;if(s?.key===V143_MAGE&&id==='mg_spirits')return b.trait.v134Full+(s.u?b.t[7][s.u-1].d:'');if(s?.u&&V138_ULT_IDS[s.key][s.u-1]===id)return b.t[7][s.u-1].v134Full;return base;},set(v){if(prior.set)prior.set.call(sk,v);else original=v;}});
  }
  v143CardsInstall();v143RefineInstall();v143GearInstall();HELP.asc=['職業天賦',V134_RULES.map(r=>[...r])];if(S&&G?.pl)recalc();
}
v143Install();
