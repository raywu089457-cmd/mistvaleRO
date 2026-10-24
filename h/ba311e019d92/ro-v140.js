/* v1.4.0 — summon inheritance and full-board progression.
 * Keep v138 talent IDs/save choices. Count conversion is linear, never capped.
 * Scheduled pets own their source gem, cadence and trigger provenance.
 */
'use strict';
const V140_SUMMON_IDS=new Set(['bw_blitz','bw_bsong','dc_partner','mg_spirits','ac_orbs','mc_homun','mc_faw','mc_plant']);
function v140Count(id){
  const g=v138Gem(id);if(!g)return 0;
  const base=['ac_orbs','mc_plant'].includes(id)?3:minBase(g);
  return Math.max(1,Math.floor(base+PS.minion+(gemMods(g).minion||0)));
}
function v140Homun(s,o){return !!o.min&&(v138Id(o)==='mc_homun'||o.tg===SKILLS.guard.tg);}
function v140Giant(s){return s?.key==='ro_merchant_1'&&(s.a===1||s.u===1);}
function v140Units(s){
  let n=[...(G.mins||[]),...(G.gsp||[]),...(G.turs||[])].filter(p=>p.hp==null||p.hp>0).length;
  if(!s)return n;
  if(v140Giant(s)&&G.gsp.some(p=>p.g===v138Gem('mc_homun')?.u))n+=Math.max(0,v140Count('mc_homun')-1);
  if(s.key==='ro_mage_1'&&s.b===1&&s.u!==1&&G.mins.some(p=>p.g===v138Gem('mg_spirits')?.u))n+=Math.max(0,v140Count('mg_spirits')-1);
  for(const p of s.pets)if(p.v140&&p.until>G.t&&p.o.min)n+=p.units||1;
  return n;
}
function v140Pet(s,key,id,m,seconds,k,{count=1,units=1,interval=1,weaponRate=false,extra=true,root=true}={}){
  const g=v138Gem(id);if(!g||!v138Live(m))return;
  const old=s.pets.filter(p=>p.key===key);s.pets=s.pets.filter(p=>p.key!==key);
  for(let i=0;i<count;i++)s.pets.push({key,m,until:G.t+seconds,k,units,v140:1,id,interval,weaponRate,extra,
    charge:old[i]?.charge||0,next:Infinity,o:{id,g,min:1,root, v140Pet:1}});
}
function v140PetHit(s,p,k=1){
  const g=v138Gem(p.id);if(!g||!v138Live(p.m))return;
  const mods=gemMods(g),o={...p.o,g,id:g.id,min:1,v140Pet:1,v140Units:p.units};
  const hit=scale=>{
    if(p.id==='mc_faw'){
      // Keep real projectile fan/collision; extra projectiles are not free DPS.
      const opt={...v6Opts(g,mods),...o,v138Proc:0,v6r:0,hcrit:1};
      fan({k:'arrow',x:G.pl.x,y:G.pl.y-5,spd:TUR.pspd,mult:p.k*k*scale*(1+mods.dmg)*(1+tal('minDmg')),kb:0,o:opt},p.m,aimAt(p.m),mods.proj||0);
    }else v138Strike(s,p.m,p.k*k*scale,o);
  };
  hit(1);if(p.extra)for(let i=0;i<(mods.extra||0);i++)v138Later(s,.12*(i+1),()=>{if(p.until>G.t&&s.pets.includes(p))hit(.6);});
  s.lastHit=G.t;
}
function v140Talent(key,row,col,n,d,e,full=''){
  const b=Object.values(ASC).flat().find(b=>b.k===key),t=b.t[row-1][col];
  if(n)t.n=n;t.d=d;t.v134Full=d+(full?' '+full:'');
  if(row===8)t.v134Full+=' 必須將「'+SKILLS[V138_ULT_IDS[key][col]].n+'」放在技能盤上；沿用其寶石連結。';
  t.v134Short={when:'',effect:d,note:''};
  if(e)t.e={...e,['v138r'+row]:col+1};
}
function v140Extra(short,full){
  const clean=t=>String(t||'').replace(/[\s。；，;,.]/g,'');
  if(clean(short)===clean(full))return '';
  return String(full||'').startsWith(short)?String(full).slice(short.length).trim():String(full||'');
}
function v140Install(){
  const T=v140Talent;
  T('ro_merchant_1',4,0,null,'生命體合為一隻巨獸；傷害為原名額總和的 140%，生命合併。',null,'每個名額完整換算，沒有轉傷害上限；與究極生命體的增傷相乘。');
  T('ro_merchant_1',4,1,null,'生命體上限 +2；不降低單隻傷害。',{minion:2});
  T('ro_merchant_1',8,0,null,'生命體合為究極巨獸；傷害為原名額總和的 190%，生命合併。',null,'與巨獸培育同選時為原名額總和的 266%。數量輔助繼續提高傷害、生命與每隻召喚物的防禦收益，沒有轉傷害上限。');
  T('ro_mage_1',5,0,null,'精靈合為一隻；傷害為原名額總和的 135%。',null,'沒有轉傷害上限；靈王已換算全部名額，此選項再使靈王傷害 +35%。每隻精靈觸發的號令與防禦仍按合併前名額計算。');
  T('ro_mage_1',8,0,null,'召喚靈王 8 秒；每個精靈名額使其每次攻擊造成 250% 召喚武器傷害。',null,'基礎每秒攻擊一次，隨召喚攻速加快；承接召喚數量、傷害、暴擊與額外施放輔助。');
  T('ro_mage_1',5,1,'精靈合唱','施法後所有精靈各追擊 90% 召喚武器傷害，冷卻 1 秒。',null,'單靈與靈王按合併前名額追擊；追擊沿用精靈召喚的傷害及暴擊連結。');
  T('ro_bow_3',4,2,'樂靈伴奏','施放樂曲召來一名樂靈，持續 8 秒，每次攻擊造成 100% 召喚武器傷害。',null,'伴奏名額等同樂靈合奏的召喚數量；基礎每秒攻擊一次，承接召喚攻速與樂靈合奏連結。');
  T('ro_bow_3',6,0,null,'樂曲持續時間 +40%；技能傷害 +25%；樂靈傷害 +25%。',{v6song:.4,skill:25,'sk:bw_bsong:more':.25});
  T('ro_bow_3',8,2,null,'樂靈合奏保留全部樂靈，傷害 +50%；有樂靈時每 2 秒延長樂章 0.5 秒。',null,'保留召喚數量、攻速、暴擊、額外施放及原寶石連結，不再把整支樂團換成一次固定傷害。');
  T('ro_bow_4',4,1,'共舞邀約','魅惑技能召來舞伴，持續 8 秒，每次攻擊造成 120% 召喚武器傷害。',null,'每次召來一名，名額等同舞伴技能的召喚數量；攻擊隨召喚攻速加快，承接舞伴技能的輔助。');
  T('ro_bow_4',8,0,null,'原有舞伴全部化為幻影，持續 8 秒，每次攻擊造成 140% 召喚武器傷害。',null,'保留原召喚名額，召喚數量輔助可繼續增加幻影；基礎每秒攻擊一次，承接召喚攻速、傷害、暴擊與額外施放。');
  T('ro_bow_0',8,2,null,'獵鷹化為鷹王，立即啄擊 350%，之後 6 秒持續啄擊。',null,'每次啄擊為350%召喚武器傷害，基礎每秒一次，承接召喚攻速與傷害輔助；每個額外召喚名額多一隻鷹王。');
  T('ro_acolyte_2',5,2,null,'聖壇命中後，每顆聖靈追擊 60% 召喚武器傷害，冷卻 1 秒。',null,'需裝備聖靈環繞，按含輔助與天賦的完整聖靈數量計算。');
  T('ro_acolyte_2',8,1,null,'全部聖靈化為追蹤聖靈，持續 6 秒，每次各造成 135% 召喚武器傷害。',null,'立即攻擊一次；之後基礎每秒一次，承接召喚攻速、數量、傷害、暴擊與額外施放；不固定成3顆。技能傷害與召喚傷害採較高者。');
  T('ro_merchant_2',8,0,null,'保留全部砲台名額，每座改為雙管連射，每發 40% 召喚武器傷害，持續 8 秒。',null,'施放時先射一發，之後每輪兩發；承接原砲台射速、召喚攻速、數量、額外施放與投射物輔助。浮游與攻城特化繼續生效；搭配機甲武裝時也取得武裝姿態。');
  T('ro_merchant_3',4,2,null,'毒雲命中催生追蹤植物，4 秒每次攻擊造成 90% 召喚武器傷害，冷卻 1 秒。',null,'植物名額從3株起，隨召喚數量增加；承接召喚攻速與地獄植物連結。');
  T('ro_merchant_3',8,1,null,'植物合為捕食株；每個植物名額使每次攻擊造成 120% 召喚武器傷害，持續 6 秒。',null,'立即攻擊一次，之後基礎每秒一次，隨召喚攻速加快；每層毒再增傷4%，依實際毒層計算。數量、傷害與額外施放輔助持續有效。');
  T('ro_thief_0',5,2,null,'普攻有 25% 機率召出影刃，4 秒內每秒攻擊一次，造成 85% 普攻傷害；可同時存在 3 隻。');
  T('ro_thief_2',8,2,null,'殘影分身改為 8 秒終結分身：終結技追加 110% 傷害，不消耗連擊點。',null,'繼承殘影分身的持續時間與傷害天賦；傷害以終結技實際命中為基準，不重複套用武器、暴擊與連擊點倍率，也不產生新分身。');
  // A defensive ceiling is retained: 60% minion guard prevents invulnerability.
  const magicRule=V134_RULES.find(r=>r[0]==='技能魔化');
  if(magicRule)magicRule[1]=magicRule[1].replace('數量轉傷害只有明確寫出的單靈與巨獸有效。','數量轉傷害只適用於明確寫出的單靈、巨獸、靈王及捕食株。');
  V134_RULES.push(['召喚繼承','改造召喚物承接來源寶石的數量、傷害、暴擊、額外施放及召喚攻速。單隻化完整合併名額，不封頂；每隻召喚物的回復／守護也按合併前數量計算，守護原有60%減傷上限保留。聖靈與植物的技能傷害／召喚傷害採較高者，保留原配裝。影刃及終結分身沿用普攻／終結技計算，不再重複乘召喚傷害。']);
  V138_PASSIVE.delete('ro_bow_3:3');

  const modify=v138Modify;
  v138Modify=function(s,m,o){
    let k=modify(s,m,o);
    if(s.key==='ro_merchant_1'&&o.min&&(s.a===1||s.u===1)){
      const g=v138Gem('mc_homun');if(g){k/=1+Math.min(s.u===1?5.1:4.2,gspCap(g)*(s.u===1?.85:.7));if(v140Homun(s,o))k*=v140Count('mc_homun')*(s.a===1?1.4:1)*(s.u===1?1.9:1);}
    }
    if(s.key==='ro_mage_1'&&o.min&&s.b===1){
      const g=v138Gem('mg_spirits');if(g){k/=1+Math.min(3.25,minCap(g)*.65);if(v138Id(o)==='mg_spirits'||o.tg===SKILLS.summon.tg)k*=o.v140Units?1.35:v140Count('mg_spirits')*1.35;}
    }
    if(s.key==='ro_bow_3'&&s.u===3&&o.min&&v138Id(o)==='bw_bsong')k*=1.5;
    if(s.key==='ro_merchant_3'&&o.v138plant)k/=1+Math.min(.4,(m.psn?.s?.length||0)*.04);
    if(s.key==='ro_merchant_3'&&o.v140plant)k*=1+(m.psn?.s?.length||0)*.04;
    if(o.min&&(['ac_orbs','mc_plant'].includes(v138Id(o))||(v138Id(o)==='mc_faw'&&!o.v140Pet&&s.a===3)))k*=Math.max(1,PS.skillMul/PS.minMul);
    return k;
  };
  const strike=v138Strike;
  v138Strike=function(s,m,k,o={}){
    let id=o.id||o.v6sk||o.g?.id;
    if(o.min&&!id){id=({ro_mage_1:'mg_spirits',ro_merchant_1:'mc_homun'})[s.key];if(id)o={...o,id};}
    if(V140_SUMMON_IDS.has(id)&&!o.ba){
      o={...o,min:1};k*=1+tal('minDmg');
      // Sources with native guaranteed crit access retain it.
      if(['bw_blitz','ac_orbs','mc_plant','mc_faw'].includes(id))o.hcrit=1;
    }
    return strike(s,m,k,o);
  };
  const hit=hitMob;
  hitMob=function(m,k,o={}){
    if(!o.min&&['ac_orbs','mc_plant'].includes(v138Id(o))){o={...o,min:1,hcrit:1};k*=1+tal('minDmg');}
    if(o.min&&!o.v6sk){
      if(o.tg===SKILLS.guard.tg)o={...o,v6sk:'mc_homun'};
      else if(o.tg===SKILLS.summon.tg){const ids=new Set(G.mins.map(p=>S.gems.find(x=>x.u===p.g)?.id));if(ids.size===1)o={...o,v6sk:[...ids][0]};}
    }
    return hit.call(this,m,k,o);
  };
  const pet=v138Pet;
  v138Pet=function(s,key,m,t,k,o={},max=1){
    if(key==='shadow')return pet(s,key,m,4,k/.7*.85,o,3);
    const ids={accompanist:'bw_bsong',partner:'dc_partner',sprout:'mc_plant'};
    if(ids[key]){
      const id=ids[key],g=v138Gem(id);if(!g)return;
      const slots=v140Count(id),list=s.pets.filter(p=>p.key===key);
      if(list.length>=slots)s.pets.splice(s.pets.indexOf(list[0]),1);
      const base=key==='partner'?1.2:key==='sprout'?.9:1;
      const p={key,m,until:G.t+(key==='sprout'?4:8),k:base,units:1,v140:1,id,interval:1,extra:true,charge:0,next:Infinity,o:{id,g,min:1,root:true,v140Pet:1}};
      s.pets.push(p);return;
    }
    return pet(s,key,m,t,k,o,max);
  };
  const cast=v138Cast;
  v138Cast=function(s,g,a,native){
    const id=g.id,u=s.u,m=v138Target();
    if(s.key==='ro_bow_3'&&u===3&&id==='bw_bsong')return undefined;
    if(!v138Live(m))return cast(s,g,a,native);
    let done=false;
    if(s.key==='ro_mage_1'&&u===1&&id==='mg_spirits'){v140Pet(s,'spiritKing',id,m,8,2.5*v140Count(id)*a,{units:v140Count(id)});done=true;}
    if(s.key==='ro_bow_4'&&u===1&&id==='dc_partner'){v140Pet(s,'lover',id,m,8,1.4*a,{count:v140Count(id)});done=true;}
    if(s.key==='ro_bow_0'&&u===3&&id==='bw_blitz'){v140Pet(s,'falconKing',id,m,6,3.5*a,{count:1+Math.max(0,v140Count(id)-MIN.n),root:true});done=true;}
    if(s.key==='ro_acolyte_2'&&u===2&&id==='ac_orbs'){v140Pet(s,'holyMissile',id,m,6,1.35*a,{count:v140Count(id),root:true});done=true;}
    if(s.key==='ro_merchant_2'&&u===1&&id==='mc_faw'){v140Pet(s,'doubleCannon',id,m,8,.4*a,{count:v140Count(id),interval:1/TUR.as,weaponRate:true,root:true});if(s.a===3)v138Buff(s,'mecha',1,8);done=true;}
    if(s.key==='ro_merchant_3'&&u===2&&id==='mc_plant'){v140Pet(s,'giantPlant',id,m,6,1.2*v140Count(id)*a,{units:v140Count(id),root:true});for(const p of s.pets)if(p.key==='giantPlant')p.o.v140plant=1;done=true;}
    if(done){for(const p of s.pets.filter(p=>p.id===id))v140PetHit(s,p);s.stats.transforms++;v6Ro(id,G.pl.x,G.pl.y);return true;}
    return cast(s,g,a,native);
  };
  const after=v138AfterCast;
  v138AfterCast=function(s,g,frame){
    if(s.key==='ro_thief_2'&&s.u===3&&g.id==='th_clone')v138Buff(s,'finisherClone',1,8*(1+tal('v6clone')));
    if(s.key==='ro_mage_1'&&g.id!=='mg_spirits'&&frame.eligible){
      // Old two-spirit command and new full-count command must not both fire.
      const a=s.a,b=s.b;s.a=0;s.b=0;try{after(s,g,frame);}finally{s.a=a;s.b=b;}
      const n=v140Units(s),m=frame.target||v138Target();
      if(n&&a===1&&v138Ready(s,'command',1))v138Strike(s,m,.8*n,{id:'mg_spirits',min:1,v140Units:n});
      if(n&&b===2&&v138Ready(s,'duet',1))v138Strike(s,m,.9*n,{id:'mg_spirits',min:1,v140Units:n});
      return;
    }
    return after(s,g,frame);
  };
  const onHit=v138Hit;
  v138Hit=function(s,m,d,crit,o){
    if(s.key==='ro_thief_2'&&v138On(s,'finisherClone')&&!o.v138Proc&&!o.v6r&&['th_sonic','th_envenom'].includes(v138Id(o))){
      const until=s.buff.finisherClone.until;s.buff.finisherClone.until=0;
      try{onHit(s,m,d,crit,o);}finally{s.buff.finisherClone.until=until;}
      v138Later(s,.25,()=>v138Stored(s,m,d*1.1*(1+tal('v6clone'))));return;
    }
    if(s.key==='ro_acolyte_2'&&s.b===3&&v138Id(o)==='ac_magnus'&&!o.v138Proc&&!o.v6r){
      const b=s.b;s.b=0;try{onHit(s,m,d,crit,o);}finally{s.b=b;}
      if(v138Gem('ac_orbs')&&v138Ready(s,'altarSpirit',1))v138Strike(s,m,.6*v140Count('ac_orbs'),{id:'ac_orbs',min:1});return;
    }
    return onHit(s,m,d,crit,o);
  };
  // Native orbit/plant attacks also honor summon speed. Recasting still uses
  // the native expiry/placement rules; no synthetic damage is injected.
  for(const kind of ['orbs','plant']){
    const native=V6_CAST[kind];V6_CAST[kind]=function(c){
      const before=new Set(v6G().ents),r=native(c);
      for(const e of v6G().ents)if(!before.has(e)){
        if(kind==='plant'&&e.k==='plant'){const iv=e.iv,update=e.upd;e.upd=function(...args){e.iv=iv/minAtk();return update?.apply(this,args);};}
        if(kind==='orbs'&&e.k==='orb'){const update=e.upd;e.upd=function(...args){const old=new Map(e.cd);const r=update.apply(this,args);for(const [m,t]of e.cd)if(t!==old.get(m))e.cd.set(m,G.t+(t-G.t)/minAtk());return r;};}
      }return r;
    };
  }
  const tick=v138Tick;
  v138Tick=function(s,dt){
    // Keep pets visible while delayed linked strikes and defensive effects run.
    // Infinity disables only the old once-per-second attack scheduler.
    s.pets=s.pets.filter(p=>!p.v140||v138Gem(p.id));
    for(const p of s.pets)if(p.v140)p.next=Infinity;
    const u=s.u;if(s.key==='ro_bow_3'&&u===3)s.u=0;
    try{tick(s,dt);}finally{s.u=u;}
    if(G.dead)return;
    const target=v138Target();
    s.pets=s.pets.filter(p=>p.until>G.t&&(!p.v140||v138Gem(p.id)));
    for(const p of s.pets.filter(p=>p.v140)){
      if(!v138Live(p.m))p.m=target;if(!v138Live(p.m))continue;
      const rate=minAtk()*(p.weaponRate?PS.waps:1);p.charge+=dt*rate;
      while(p.charge>=p.interval){p.charge-=p.interval;v140PetHit(s,p);if(p.key==='doubleCannon')v138Later(s,.08,()=>{if(s.pets.includes(p)&&p.until>G.t)v140PetHit(s,p);});}
    }
    if(s.key==='ro_bow_3'&&u===3&&G.mins.some(p=>p.g===v138Gem('bw_bsong')?.u)&&v138Ready(s,'autoBand',2))for(let i=0;i<3;i++)if(v6Buf('song'+i))v6G().buf['song'+i]+=.5;
  };
  const gsp=tickGsp;
  tickGsp=function(dt,...args){
    for(const p of G.gsp)if(p.v140LifeScale){p.hp/=p.v140LifeScale;p.max/=p.v140LifeScale;delete p.v140LifeScale;}
    const r=gsp.call(this,dt,...args),s=v138State();
    if(v140Giant(s)){const g=v138Gem('mc_homun');if(g)for(const p of G.gsp)if(p.g===g.u){const n=v140Count(g.id);p.hp*=n;p.max*=n;p.v140LifeScale=n;}}
    return r;
  };
  const guard=HURT_MUL.find(x=>x.k==='minGuard');if(guard)guard.f=()=>Math.max(.4,1-v140Units(v138State())*tal('minGuard'));
  TAL_ON.h_minshd.tick=dt=>{const n=v140Units(v138State());if(n&&S.hp<PS.maxhp)S.hp=Math.min(PS.maxhp,S.hp+PS.maxhp*tal('h_minshd')*n*dt);};
  const ready=skillReady;
  skillReady=function(g,...args){
    const s=v138State();if(s?.key==='ro_bow_3'&&s.u===3&&g.id==='bw_bsong')return !G.dead&&G.mins.filter(p=>p.g===g.u).length<minCap(g);
    if(s?.key==='ro_mage_1'&&s.u===1&&g.id==='mg_spirits'&&s.pets.some(p=>p.key==='spiritKing'&&p.until>G.t+1))return false;
    return ready.call(this,g,...args);
  };
  const book=v134BookResults;
  v134BookResults=function(...args){
    let html=book.apply(this,args);
    for(const b of Object.values(ASC).flat())for(const t of b.t.flat()){
      const extra=v140Extra(t.d,t.v134Full);
      html=html.replace('<p>'+esc(t.v134Full)+'</p>','<p>'+esc(t.d)+'</p>'+(extra?'<details class="v140-extra"><summary>補充條件</summary><p>'+esc(extra)+'</p></details>':''));
    }
    return html;
  };
  if(S&&G?.pl){recalc();ui.refreshIf('char','asc','skill','more');}
}
v140Install();
