/* v1.4.8 — retire the old mechanical-branch FAW transformations. */
'use strict';
const v148CastBefore=v138Cast;
v138Cast=function(s,g,...args){
  // Undefined delegates to the native cast, retaining this gem's supports.
  if(s.key==='ro_merchant_2'&&g.id==='mc_faw')return undefined;
  return v148CastBefore.call(this,s,g,...args);
};
const v148TickBefore=v138Tick;
v138Tick=function(s,dt){
  if(s.key!=='ro_merchant_2')return v148TickBefore.apply(this,arguments);
  const player=G.pl,ids=new Set(activeGems().filter(g=>g.id==='mc_faw').map(g=>g.u));
  const native=(G.turs||[]).filter(p=>ids.has(p.g)).map(p=>({p,x:p.x,y:p.y}));
  // Native expiry/death/unequip are handled by tickTurs. Only undo the obsolete
  // v138 talent cleanup and following movement inside this talent-only tick.
  const result=v148TickBefore.apply(this,arguments);
  if(G.pl===player&&G.pl.v138===s&&!G.dead){
    const equipped=new Set(activeGems().filter(g=>g.id==='mc_faw').map(g=>g.u));
    for(const {p,x,y} of native)if(equipped.has(p.g)&&p.t<TUR.t){
      if(!G.turs.includes(p))G.turs.push(p);
      p.x=x;p.y=y;
    }
    s.pets=s.pets.filter(p=>p.key!=='doubleCannon');
  }
  return result;
};
const v148ModifyBefore=v138Modify;
v138Modify=function(s,m,o){
  const result=v148ModifyBefore.apply(this,arguments);
  if(s.key!=='ro_merchant_2'||!o.min)return result;
  // The replaced row-4 options no longer grant hidden turret multipliers.
  if(s.a===1)return result/(1+Math.min(.48,(v138Mark(s,m).turretHits||0)*.08));
  if(s.a===2)return result/1.25;
  return result;
};
const v148StrikeBefore=v138Strike;
v138Strike=function(s,m,k,o={}){
  // Mecha's extra basic hit now belongs to Earth Shaker, not a removed FAW gem.
  if(s.key==='ro_merchant_2'&&o.id==='mc_faw'&&!o.min)
    o={...o,id:'mc_hfall',g:v138Gem('mc_hfall')};
  return v148StrikeBefore.call(this,s,m,k,o);
};
const v148Mechanical=ASC.merchant.find(b=>b.k==='ro_merchant_2');
v148Mechanical.d='機械：大地之擊武裝、機甲加農砲與斧頭龍捲。FAW 仍可正常設置；砲台專屬強化請選「砲陣」分支。';
for(const t of v148Mechanical.t[7])t.v134Full+=' FAW 砲台設置維持原技能，不會被此奧義替換或取消。';
