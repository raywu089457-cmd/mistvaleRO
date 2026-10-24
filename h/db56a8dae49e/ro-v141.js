/* v1.4.1 — party ranged AI: evade to a safe firing position, then stay there.
 * No attack cooldown, boss telegraph, damage or solo movement changes.
 */
'use strict';
const V141={margin:5,rangePad:3,nearPad:3};
const v141Near=()=>Math.min(PS.range+V141.rangePad-6,Math.max(V1213.cfg.nearR+V141.nearPad,PS.range*.75));
function v141Boss(){
  if(!V1213.run||!V1213.cur||V1213.cur===V1213.run.world||!PS||PS.range<25||G.dead)return null;
  const m=V1213.run.boss;
  return m&&alive(m)&&m.spawnT<=0&&m.v1213?.kind==='boss'&&G.pl?.tgt===m?m:null;
}
function v141Hazards(){
  // Dungeon static warnings previously rolled a random dodge flag. Track all
  // avoidable warnings; chasing the unavoidable, tracking basic is pointless.
  return G.haz.filter(h=>(h.dg||(h.v1213d!=null&&!h.tk))&&h.k!=='frost'&&(h.t==null||h.t>0)&&(!h.src||alive(h.src)));
}
function v141Safe(point,hazards,margin=V141.margin){return !hazards.some(h=>inHaz(h,point.x,point.y,margin));}
function v141Inside(x,y){return x>=6&&x<=G.W-6&&y>=(G.top||0)+4&&y<=G.H-4;}
function v141Path(a,b,hazards,escaping=false){
  // When already inside a telegraph, only cross the hazard being escaped.
  const blocked=escaping?hazards.filter(h=>!inHaz(h,a.x,a.y,V141.margin)):hazards;
  for(let i=1;i<=6;i++)if(!v141Safe({x:a.x+(b.x-a.x)*i/6,y:a.y+(b.y-a.y)*i/6},blocked))return false;
  return true;
}
function v141Goal(boss,hazards,escaping){
  const p=G.pl,range=PS.range+V141.rangePad,near=v141Near(),candidates=[];
  for(const r of [8,14,22,32,46,64,90])for(let i=0;i<24;i++){
    const angle=i*Math.PI/12;candidates.push({x:p.x+Math.cos(angle)*r,y:p.y+Math.sin(angle)*r});
  }
  // Candidate firing positions around the boss also work after a long dodge.
  for(const r of [Math.max(near,range-6),range-2])for(let i=0;i<32;i++){
    const angle=i*Math.PI/16;candidates.push({x:boss.x+Math.cos(angle)*r,y:boss.y+Math.sin(angle)*r});
  }
  let best=null,score=Infinity;
  for(const q of candidates){
    if(!v141Inside(q.x,q.y)||!v141Safe(q,hazards)||!v141Path(p,q,hazards,escaping))continue;
    const d=dist(p,q),toBoss=dist(q,boss),outside=Math.max(0,toBoss-range),tooClose=Math.max(0,near-toBoss);
    // A short safe move wins; remaining in firing range has substantial value.
    const cost=d+outside*4+tooClose*3;
    if(cost<score){score=cost;best=q;}
  }
  return best;
}
function v141Steer(goal){
  if(!goal)return [0,0];
  const dx=goal.x-G.pl.x,dy=goal.y-G.pl.y,d=Math.hypot(dx,dy);
  if(d<1.5)return [0,0];return [dx/d,dy/d];
}
function v141Plan(boss){
  const p=G.pl,hazards=v141Hazards();
  let nav=p.v141;if(!nav||nav.boss!==boss)nav=p.v141={boss,goal:null,evading:false};
  const danger=!v141Safe(p,hazards,3);
  if(danger){
    if(!nav.evading||!nav.goal||!v141Safe(nav.goal,hazards)||!v141Path(p,nav.goal,hazards,true))nav.goal=v141Goal(boss,hazards,true);
    nav.evading=true;
    return {evade:true,dir:nav.goal?v141Steer(nav.goal):null};
  }
  // Leave a small margin so approaching the boss cannot put us straight back
  // inside the same still-live warning circle on the next frame.
  if(nav.evading&&!v141Safe(p,hazards)&&nav.goal&&v141Safe(nav.goal,hazards))return {evade:true,dir:v141Steer(nav.goal)};
  nav.evading=false;nav.goal=null;
  const d=dist(p,boss),range=PS.range+V141.rangePad,near=v141Near();
  if(d<=range&&d>=near)return {evade:false,dir:[0,0]};
  // The boss hitbox extends 8 units beyond normal range. If we can already
  // shoot and the preferred radius is behind a live warning, hold the safe
  // edge instead of pacing along it (especially outside a ring telegraph).
  if(d<=PS.range+8&&hazards.length&&d>0){
    const want=clamp(d,near,range),q={x:boss.x+(p.x-boss.x)*want/d,y:boss.y+(p.y-boss.y)*want/d};
    if(!v141Path(p,q,hazards))return {evade:false,dir:[0,0]};
  }
  nav.goal=v141Goal(boss,hazards,false);
  return {evade:false,dir:v141Steer(nav.goal)};
}
function v141Install(){
  const ranged=v1225Ranged;
  // The old post-tick retreat pulled characters back through the telegraph.
  v1225Ranged=function(){return v141Boss()?false:ranged();};
  const kite=kiteDir,dodge=dodgeDir;
  kiteDir=function(target,passive){
    const boss=v141Boss();if(!boss||target!==boss||passive)return kite.call(this,target,passive);
    const plan=v141Plan(boss);G.pl.kth=[];
    if(plan.evade)return [0,0];
    // Keep normal avoidance for additional melee monsters near this member.
    const old=kite.call(this,target,passive);
    if(old&&G.pl.kth.some(m=>m!==boss))return old;
    return plan.dir;
  };
  dodgeDir=function(){
    const boss=v141Boss();if(!boss)return dodge.call(this);
    const plan=v141Plan(boss);
    if(!plan.evade)return null;
    return plan.dir||dodge.call(this); // crowded arena: retain native escape fallback
  };
  for(const r of HELP.v1213?.[1]||[])if(r[0]==='陣型')r[1]=r[1].replace(/遠程隊員（攻擊距離 .*?最遠處。/,'遠程隊員（攻擊距離 25 以上）優先移到射程內的安全位置，避開預警後就地輸出，不再強制退回最外圈或走回尚未結束的預警。');
}
v141Install();
