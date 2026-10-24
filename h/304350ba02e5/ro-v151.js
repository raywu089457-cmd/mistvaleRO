/* v1.5.1 — bounded chat fallback; Sanctuary keeps its area modifiers. */
'use strict';
const V151_CHAT={mode:'off',generation:0,timer:0,watch:0,controller:null,pending:false,next:0,streamRetry:0,failures:0};
function v151ChatUrl(){return `${V114.db}/chat/m.json?orderBy=${encodeURIComponent('"ts"')}&limitToLast=${V114.keep}`;}
function v151ChatStop(){
 V151_CHAT.generation++;clearTimeout(V151_CHAT.timer);clearTimeout(V151_CHAT.watch);
 V151_CHAT.timer=V151_CHAT.watch=0;V151_CHAT.controller?.abort();V151_CHAT.controller=null;V151_CHAT.pending=false;
 const es=V114C.es;V114C.es=null;if(es){try{es.close();}catch{}}
}
v114Close=function(state='off'){
 v151ChatStop();V151_CHAT.mode='off';V114C.st=state;
 V114C.retryAt=state==='err'?Date.now()+15000:0;v114Paint();
};
function v151ChatSchedule(delay){
 clearTimeout(V151_CHAT.timer);V151_CHAT.next=Date.now()+delay;
 V151_CHAT.timer=setTimeout(()=>{V151_CHAT.timer=0;v114Connect();},delay);
}
async function v151ChatPoll(){
 if(V151_CHAT.pending||document.hidden||!S||!v114On()||navigator.onLine===false)return;
 const generation=V151_CHAT.generation,controller=new AbortController();
 V151_CHAT.controller=controller;V151_CHAT.pending=true;
 const timeout=setTimeout(()=>controller.abort(),12000);
 try{
  const response=await fetch(v151ChatUrl(),{signal:controller.signal,cache:'no-store',credentials:'omit'});
  if(!response.ok)throw Error('chat-read-'+response.status);
  const data=await response.json();
  if(generation!==V151_CHAT.generation||document.hidden)return;
  if(data!==null&&(typeof data!=='object'||Array.isArray(data)||data.error))throw Error('chat-data');
  // A complete bounded snapshot also removes moderated/deleted messages.
  // Existing unread and blocked-user logic is shared with the stream path.
  V151_CHAT.failures=0;v114Apply('put',{path:'/',data});
 }catch{
  if(generation!==V151_CHAT.generation)return;
  V151_CHAT.failures++;V114C.st='err';v114Paint();
 }finally{
  clearTimeout(timeout);
  if(generation===V151_CHAT.generation){
   V151_CHAT.pending=false;V151_CHAT.controller=null;
   if(!document.hidden){
    const delay=V151_CHAT.failures?Math.min(60000,15000*2**Math.min(V151_CHAT.failures-1,2)):ui.tab==='chat'?15000:30000;
    v151ChatSchedule(delay);
   }
  }
 }
}
function v151ChatFallback(){
 v151ChatStop();V151_CHAT.mode='poll';V151_CHAT.streamRetry=Date.now()+300000;
 V151_CHAT.next=0;V114C.retryAt=0;V114C.st='conn';v114Paint();return v151ChatPoll();
}
v114Connect=function(){
 if(!S||!v114On()||document.hidden||navigator.onLine===false||V114C.es||Date.now()<V114C.retryAt)return;
 if(V151_CHAT.mode==='poll'){
  if(V151_CHAT.pending||Date.now()<V151_CHAT.next)return;
  if(Date.now()<V151_CHAT.streamRetry||typeof EventSource==='undefined')return v151ChatPoll();
 }
 if(typeof EventSource==='undefined')return v151ChatFallback();
 v151ChatStop();V151_CHAT.mode='stream';V114C.st='conn';
 const generation=V151_CHAT.generation;let es;
 try{es=new EventSource(v151ChatUrl());}catch{return v151ChatFallback();}
 V114C.es=es;
 const current=()=>generation===V151_CHAT.generation&&V114C.es===es;
 const fail=()=>{if(current())v151ChatFallback();};
 const apply=ev=>{
  if(!current())return;
  try{
   const data=JSON.parse(ev.data);if(!data||typeof data.path!=='string')throw Error('chat-event');
   clearTimeout(V151_CHAT.watch);V151_CHAT.watch=0;V151_CHAT.failures=0;v114Apply(ev.type,data);
  }catch{fail();}
 };
 es.addEventListener('put',apply);es.addEventListener('patch',apply);
 es.addEventListener('cancel',fail);es.addEventListener('auth_revoked',fail);
 es.onopen=()=>{if(current()){V114C.st='conn';v114Paint();}};
 // Browsers hide the 402 status. Any stream failure gets an ordinary REST
 // read, which still enforces Firebase rules and releases the stuck stream.
 es.onerror=fail;V151_CHAT.watch=setTimeout(fail,12000);v114Paint();
};
const v151StatusBefore=v114Status;
v114Status=function(){
 if(V151_CHAT.mode==='poll'&&V114C.st==='on')return '<span class="v114st on" title="即時連線暫不可用；聊天頁每 15 秒更新，其他遊戲頁每 30 秒更新">已連線・定時更新</span>';
 return v151StatusBefore();
};
document.addEventListener('visibilitychange',()=>{
 if(document.hidden)v114Close('off');
 else{V114C.retryAt=0;V151_CHAT.next=0;v114Connect();}
});
window.addEventListener('pagehide',()=>v114Close('off'));
window.addEventListener('pageshow',()=>v114Connect());
window.addEventListener('offline',()=>v114Close('off'));
window.addEventListener('online',()=>{V114C.retryAt=0;V151_CHAT.next=0;v114Connect();});
const v151InstallBefore=v114Install;
v114Install=function(){
 v151InstallBefore();const row=HELP.v114?.[1]?.find(row=>row[0]==='連線');
 if(row)row[1]='切到背景會釋放聊天連線，回來自動重連。即時連線失敗時改為定時讀取：聊天頁每 15 秒、其他遊戲頁每 30 秒更新；失敗會放慢重試。只在網址版啟用。';
};

// The transformed Sanctuary formerly discarded c.n and hit only its target.
// Preserve the native radius calculation, source gem and once-per-pulse heal.
const v151CastFieldBefore=v138CastField;
v138CastField=function(s,c,key,...args){
 const result=v151CastFieldBefore.call(this,s,c,key,...args);
 if(s.key!=='ro_acolyte_0'||s.u!==3||c.g.id!=='ac_sanct'||key!=='sanctuary')return result;
 const field=s.fields.find(f=>f.key===key+(c.o.v138extra?':echo':''));if(!field)return result;
 field.v151Radius=26*c.n;
 field.fn=target=>{
  for(const enemy of v6Near(target.x,target.y,field.v151Radius))v138Strike(s,enemy,field.k,field.o);
  if(field.o.v138heal)heal(PS.maxhp*field.o.v138heal);
 };
 return result;
};
const v151FieldDrawBefore=v146FieldDraw;
v146FieldDraw=function(c,s,f){
 if(!f.v151Radius)return v151FieldDrawBefore.apply(this,arguments);
 const center=f.m;if(!center)return;
 c.save();c.translate(center.x,center.y-3);
 v6Ell(c,0,0,f.v151Radius,'#fff1ae',.12,true);
 v6Ell(c,0,0,f.v151Radius,'#fff1ae',.55,false,1);
 // Scale the floor decoration with the same radius as the actual hit area;
 // retain a compact cathedral silhouette so large AoE does not hide players.
 c.save();c.scale(f.v151Radius/26,f.v151Radius/26);v146Rune(c,26,'#e4c986',G.t,12);c.restore();
 c.globalAlpha*=.42;v146Main(c,v146Profile(s,'ac_sanct'),.4,G.t,20,'field');c.restore();
};
const v151Sanct=ASC.acolyte.find(b=>b.k==='ro_acolyte_0').t[7][2];
v151Sanct.d='光耀之堂改為跟隨目標的聖所，6 秒每秒對範圍內敵人造成 220% 武器傷害並回復你 2% 生命。';
v151Sanct.v134Full=v151Sanct.d+'範圍沿用原技能，受角色、裝備、天賦與此技能相連輔助的範圍加成影響。每輪治療一次，不因命中敵人數量增加；保留原技能標籤與輔助連結。';
v151Sanct.v134Short={when:'',effect:v151Sanct.d,note:''};
