/* 流浪仙境 v1.3.7 — 天賦改版重新排行，保留角色的已達成層數。 */
"use strict";
const V137_RANK_SEASON='talents-20261023';
function v137Install() {
  if(v137Install.done)return;v137Install.done=true;
  // Only new battle results enter this board. A pending record from an earlier
  // version must not be relabelled when authentication is retried.
  const submit=v118Submit;
  v118Submit=function(rec,...a) {
    if(!rec)return;
    if(rec.season!==V137_RANK_SEASON) {
      V118.pend=null;
      toast('排行榜已更新，請完成新一場挑戰後重新登榜；角色層數保留','',1);
      return;
    }
    return submit.call(this,rec,...a);
  };
  v6RkSubmit=function(rec,...a){return rec?v118Submit({...rec,season:V137_RANK_SEASON},...a):undefined;};
  v1213RkSend=async function(res,snap) {
    if(!v1213RkOn()||typeof V98C==='undefined'||!V98C.tok) {
      V1213RK.last={err:'沒有綁定 Google，這次紀錄不會上傳隊伍排行'};return;
    }
    const body={
      season:V137_RANK_SEASON,id:S.cid,tok:v6RkTok(),name:S.name||'無名',cls:S.cls,
      floor:res.floor,sec:Math.round(res.t*10)/10,
      mem:res.members.map((m,i)=>{
        const o={n:m.name,c:m.cls,b:m.br,l:m.lv},lk=snap?.[i]?.s?.look;
        if(lk) {
          if(lk.sp)o.sp=lk.sp;o.x=lk.sex==='f'?'f':'m';
          if(lk.pet&&V1215_BY[lk.pet.k])o.p={k:lk.pet.k,r:V1215_BY[lk.pet.k].r,s:lk.pet.s};
        }
        return o;
      }),d:{mem:snap}
    };
    try {
      const r=await fetch(V1213RK.api,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+V98C.tok},body:JSON.stringify(body)});
      const j=await r.json();V1213RK.last=j;V1213RK.at=0;
      if(j.ok&&j.best)toast(`隊伍排行：新紀錄！第 ${res.floor} 層，目前第 ${j.rank} 名`,'lvl',1);
      else if(j.ok)toast(`隊伍排行：這次第 ${res.floor} 層，未超過最佳紀錄`,'lvl');
      else toast('隊伍排行上傳失敗：'+(V1213_RKERR[j.error]||j.error||r.status),'bad');
    } catch {
      V1213RK.last={err:'連線問題'};toast('隊伍排行上傳失敗（連線問題）','bad');
    }
  };
  for(const key of ['m_orank','m_prank']) {
    const render=ui[key];ui[key]=function(...a) {
      return render.apply(this,a).replace('</h2>','</h2><div class="box v137-new-board"><b>天賦改版・重新排行</b><p class="note" style="margin:5px 0 0">榜單重新開始，角色已達成的層數保留。更新後完成一場挑戰，即可重新登榜。</p></div>');
    };
  }
  // UI caches only; no character, tower, cloud save or ownership data is changed.
  V6RK.list=null;V6RK.at=0;V1213RK.list=null;V1213RK.at=0;V1213RK.snap={};
}
v137Install();
