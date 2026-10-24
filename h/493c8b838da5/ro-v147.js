/* v1.4.7 — elemental summons belong to their actual skill-board gem. */
'use strict';
function v147SpiritBranch(s,g){
  return g?.id==='mg_spirits'&&(s?.key===V143_MAGE||s?.key==='ro_mage_1'&&(s.b===1||s.u===1));
}
function v147SpiritSource(p){return activeGems().find(g=>g.u===p.v147Owner&&g.id===p.id);}
function v147SpiritCount(g){return Math.max(1,Math.floor(minBase(g)+PS.minion+(gemMods(g).minion||0)));}
const v147SummonBefore=v143Summon;
v143Summon=function(s,g,a){
  if(!v147SpiritBranch(s,g))return v147SummonBefore.apply(this,arguments);
  const m=v138Target();if(!v138Live(m)||G.dead)return false;
  const mage=s.key===V143_MAGE,key=mage?'v143:'+s.key:'spiritKing';
  const own=p=>p.v147Owner===g.u,old=s.pets.filter(own);
  s.pets=s.pets.filter(p=>!own(p));
  const n=v147SpiritCount(g)+(mage&&s.u===1?2:0),k=mage?.7*(s.u===1?1.2:1):(s.u===1?2.5:MIN.k);
  const pets=[];
  for(let i=0;i<n;i++){
    const p={key,m,until:G.t+(mage?12:8),k,units:1,v140:1,v143:1,v142:false,id:g.id,
      v147Owner:g.u,interval:1,weaponRate:false,extra:true,charge:old[i]?.charge||0,next:Infinity,
      round:old[i]?.round||0,strong:old[i]?.strong||0,element:['fire','water','wind'][i%3],
      o:{id:g.id,g,min:1,root:true,v140Pet:1,v143Pet:1,v142:false,hcrit:1}};
    s.pets.push(p);pets.push(p);
  }
  pets.forEach(p=>v140PetHit(s,p,a,true));s.stats.transforms++;return true;
};
const v147ReadyBefore=skillReady;
skillReady=function(g,...args){
  const s=v138State();if(!v147SpiritBranch(s,g))return v147ReadyBefore.call(this,g,...args);
  return !G.dead&&v138Live(v138Target())&&!s.pets.some(p=>p.v147Owner===g.u&&p.until>G.t+1);
};
const v147PetHitBefore=v140PetHit;
v140PetHit=function(s,p,k=1,command=false){
  if(p.v147Owner==null)return v147PetHitBefore.apply(this,arguments);
  const g=v147SpiritSource(p);
  if(!g||G.dead||G.pl.v138!==s||!s.pets.includes(p)||p.until<=G.t||!v138Live(p.m))return;
  const mods=gemMods(g),mage=s.key===V143_MAGE;
  p.round+=mage&&!command?1:0;
  const el=mage?(s.b===2?['fire','water','wind'][Math.max(0,p.round-1)%3]:(s.contract||'fire')):null;
  if(mage)p.element=el;
  const boost=mage&&!command&&s.u===3&&p.strong>0?2:1;if(boost===2)p.strong--;
  const hit=(scale,element=el,root=true)=>{
    if(G.pl.v138!==s||G.dead||!s.pets.includes(p)||p.until<=G.t||!v147SpiritSource(p)||!v138Live(p.m))return;
    const o={...p.o,g,id:p.id,min:1,root,v140Pet:1};
    if(mage)o.v6el=element;else o.v140Units=p.units;
    return v138Strike(s,p.m,p.k*k*scale*boost,o);
  };
  hit(1);
  for(let i=0;i<(mods.extra||0);i++)v138Later(s,.12*(i+1),()=>hit(.6));
  if(mage&&!command){
    if(s.a===3){v138Later(s,.12,()=>hit(.4,el,false));v138Later(s,.24,()=>hit(.4,el,false));}
    if(s.b===2&&p.round%3===0)v138Later(s,.15,()=>hit(1.8,el,false));
    if(s.u===2&&p.round%3===0)['fire','water','wind'].forEach((e,i)=>v138Later(s,.12*(i+1),()=>hit(.9,e,false)));
  }
  if(!mage)s.lastHit=G.t;
  p.v146Attack=G.t;v146Emit(s,v146Profile(s,p.id),p.m,'hit');
};
const v147TickBefore=v138Tick;
v138Tick=function(s,dt){
  // Removing one gem removes only its own summons, even if copies remain equipped.
  s.pets=s.pets.filter(p=>p.v147Owner==null||v147SpiritSource(p));
  return v147TickBefore.apply(this,arguments);
};
v143Talent('ro_mage_1',8,0,'靈王近衛',
  '召喚元素精靈改為靈王近衛；每隻傷害 250%，持續 8 秒，基礎冷卻 3 秒，戰鬥中自動續召。',null,
  '沒有另外一組天賦冷卻，沿用召喚元素精靈的冷卻；一般施放的實際冷卻受寶石、天賦與裝備修正。冷卻從施放時開始計算，不是靈王消失後才開始。每顆召喚寶石各自召喚與續召，數量、傷害及額外施放使用該顆實際連結的輔助。靈王剩餘超過 1 秒時不重複召喚；剩約 1 秒、冷卻完成且可施放時續召自己的近衛，有存活敵人才會施放。若連結自動念咒，仍須再次暴擊觸發。');
