/* v1.4.9 — cannon formations, fantasy ink and a compact summon silhouette. */
'use strict';
// Reward and its help text both read this probability: one roll per cleared floor.
V1213.cfg.rw.ring=.05;

const v149Turret=ASC.merchant.find(b=>b.k==='ro_merchant_4');
function v149Talent(row,col,short,full,e){
 const t=v149Turret.t[row-1][col];t.d=short;t.v134Full=full||short;
 t.v134Short={when:'',effect:short,note:''};if(e)t.e=e;
}
v149Talent(2,1,'砲台數量 +2。',null,{'sk:mc_faw:minion':2});
v149Talent(4,0,'每輪追加一發 65% 傷害；奧義追加彈也有雙管副彈。','自主射擊及奧義追加彈各追加一發 65% 傷害，延遲 0.10 秒。副彈沿用原技能連結，可觸發命中效果；不再觸發雙管或增加輪次。');
v149Talent(4,1,'射擊間隔 ×1.5；每發傷害 ×2.4。');
v149Talent(4,2,'每第 2 輪，連射一輪 120% 傷害（包含奧義彈）。','每隻砲台第 2 輪自主攻擊後，於 0.12 秒追加一次 120% 傷害的完整齊射，包含本輪奧義追加彈。追加不再增加輪次或觸發輪射。沿用原技能連結與命中效果。');
v149Talent(8,0,'砲台數量 ×2；每座保留完整傷害。','先計算基礎砲台、角色、天賦與此技能連結提供的數量，再將總數翻倍。全部獨立射擊並隨行；不合併、不降低單座傷害。須裝備 FAW 砲台設置，沿用全部有效輔助連結。');
const v149CountBefore=v142Count;
v142Count=function(s){
 if(s.key!=='ro_merchant_4'||s.u!==1)return v149CountBefore.apply(this,arguments);
 const g=v138Gem('mc_faw');return g?2*Math.max(1,Math.floor(TUR.n+PS.minion+(gemMods(g).minion||0))):0;
};
// Command dispatch preserves gem support inheritance and presentation hooks,
// but bypasses v142's additive round procs. Each autonomous round counts once.
const v149PetBefore=v140PetHit;
v140PetHit=function(s,p,k=1,command=false){
 if(s.key!=='ro_merchant_4'||!p.v142)return v149PetBefore.apply(this,arguments);
 const valid=()=>!G.dead&&G.pl.v138===s&&s.pets.includes(p)&&p.until>G.t&&v138Live(p.m)&&v138Gem(p.id);
 if(!valid())return;
 const scale=s.a===2?2.4/2.1:1;
 const shoot=(delay,mult)=>{
  const fire=()=>{if(valid())v149PetBefore.call(this,s,p,k*mult*scale,true);};
  if(delay)v138Later(s,delay,fire);else fire();
 };
 if(command){shoot(0,1);return;}
 p.round++;
 const volley=[[0,1]];
 if(s.u===2&&p.round%3===0)for(let i=1;i<=4;i++)volley.push([i*.1,.75]);
 if(s.u===3)volley.push([.1,.45],[.2,.45]);
 for(const [delay,mult] of volley){
  shoot(delay,mult);
  if(s.a===1)shoot(delay+.1,mult*.65);
  if(s.a===3&&p.round%2===0)shoot(delay+.12,mult*1.2);
 }
};

// Reuse ro-content's existing display-resolution canvas. No extra canvas or
// change to logical coordinates, hitboxes, layout, or pointer input is needed.
// Cel-shaded metal/crystal facets and fine ink replace flat polygon fills.
// Geometry remains per-skill; no extra entities, random rolls or combat work.
v146Path=function(c,points,color,width=1,closed=false,fill=false){
 c.save();c.beginPath();points.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));if(closed)c.closePath();
 c.lineJoin='round';c.lineCap='round';c.strokeStyle=color;c.lineWidth=Math.max(.35,width*.75);
 if(fill){const ys=points.map(p=>p[1]),top=Math.min(...ys),bottom=Math.max(...ys),g=c.createLinearGradient(0,top,0,Math.max(top+.1,bottom));
  g.addColorStop(0,'#fff6e7');g.addColorStop(.18,fill===true?color:fill);g.addColorStop(1,fill===true?color:fill);c.fillStyle=g;c.fill();}
 c.stroke();c.restore();
};
// A curved, tapered sword trail and a bevelled blade retain each skill's own
// trajectory, count, palette and timing rather than sharing a class flash.
v146Blade=function(c,x,y,a,len,col,accent){
 c.save();c.translate(x,y);c.rotate(a);
 const g=c.createLinearGradient(-len*.6,-5,len*.6,3);g.addColorStop(0,col+'00');g.addColorStop(.65,col+'99');g.addColorStop(1,'#fff7eb');
 c.fillStyle=g;c.beginPath();c.moveTo(-len*.65,5);c.quadraticCurveTo(-len*.2,-len*.32,len*.61,0);c.quadraticCurveTo(0,-len*.12,-len*.65,5);c.fill();
 v146Path(c,[[-len*.45,0],[len*.34,-1.6],[len*.6,0],[len*.34,1.6]],col,.65,true,accent);
 v146Path(c,[[-len*.43,0],[len*.53,0]],'#fffdf1',.45);v146Path(c,[[-len*.45,-3],[-len*.45,3]],col,1.5);c.restore();
};
v146Tex=function(c,id,x,y,w,h,a=1,rot=0){const im=v146Img(RO.assets.effects.textures[id]?.file);if(!im)return;c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.globalCompositeOperation='lighter';c.globalAlpha*=a*.8;c.translate(x,y);c.rotate(rot);c.drawImage(im,-w/2,-h/2,w,h);c.restore();};

// Keep the character readable even when a large spell overlaps them. These
// clips affect only the new burst artwork, never the world or boss telegraphs.
const v149EmitBefore=v146Emit;
v146Emit=function(...args){
 const previous=new Set(v6G().ents),result=v149EmitBefore.apply(this,args);
 for(const e of v6G().ents)if(e.v146Burst&&!previous.has(e)&&e.draw){
  const render=e.draw;e.draw=function(z,c){
   const player=G.pl;if(!player)return render(z,c);
   const hole=()=>{c.moveTo(player.x+9,player.y-10);c.ellipse(player.x,player.y-10,9,14,0,0,Math.PI*2);};
   c.save();c.beginPath();c.rect(-10000,-10000,20000,20000);hole();c.clip('evenodd');render(z,c);c.restore();
   c.save();c.beginPath();hole();c.clip();c.globalAlpha*=.15;render(z,c);c.restore();
  };
 }return result;
};

// Compact anime familiars: elemental silhouettes echo Ifrit / Strouf / Ghost,
// while the smooth face, layered locks and crystal ornaments are new artwork.
function v149Familiar(c,el,time,pulse=false){
 const [col,hi,dark]=({fire:['#ff895e','#ffe8a1','#a5354f'],water:['#82dcff','#edffff','#386aa1'],wind:['#c8b7ff','#f5edff','#7058a3']})[el]||['#e9c888','#fff6d5','#8b6652'];
 c.save();c.translate(0,Math.sin(time*3)*1.2);v146Glow(c,0,-10,12,col,.16);
 // Flame tails, mermaid fins, and airy ghost ribbons give different outlines.
 c.fillStyle=dark;c.strokeStyle=col;c.lineWidth=.6;c.beginPath();c.moveTo(-6,-9);
 if(el==='fire'){c.bezierCurveTo(-12,-14,-9,-19,-8,-21);c.quadraticCurveTo(-5,-14,-2,-19);c.quadraticCurveTo(1,-25,4,-22);c.quadraticCurveTo(4,-15,8,-18);c.quadraticCurveTo(13,-8,6,-4);}
 else if(el==='water'){c.quadraticCurveTo(-15,-16,-12,-6);c.quadraticCurveTo(-8,-8,-6,-3);c.quadraticCurveTo(0,1,4,-4);c.quadraticCurveTo(14,-1,13,-12);c.quadraticCurveTo(8,-8,6,-14);}
 else{c.quadraticCurveTo(-17,-2,-9,2);c.quadraticCurveTo(-3,-4,0,0);c.quadraticCurveTo(9,6,14,-4);c.quadraticCurveTo(8,0,6,-10);}
 c.closePath();c.fill();c.stroke();
 const g=c.createLinearGradient(0,-18,0,-3);g.addColorStop(0,hi);g.addColorStop(.5,col);g.addColorStop(1,dark);c.fillStyle=g;
 c.beginPath();c.moveTo(0,-19);c.bezierCurveTo(10,-19,11,-5,2,-4);c.quadraticCurveTo(0,-1,-2,-4);c.bezierCurveTo(-11,-5,-10,-19,0,-19);c.fill();
 c.fillStyle='#fff0e1';c.beginPath();c.ellipse(0,-10.5,5,4.3,0,0,Math.PI*2);c.fill();
 // Swept fringe and two tiny highlighted eyes.
 v146Path(c,[[-6,-13],[-4,-18],[1,-19],[6,-15],[2,-11],[1,-14],[-2,-11],[-2,-14]],hi,.45,true,col);
 for(const side of [-1,1]){c.fillStyle=dark;c.beginPath();c.ellipse(side*2.4,-10.5,1,1.5,0,0,Math.PI*2);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(side*2.4-.25,-11,.38,0,Math.PI*2);c.fill();}
 if(el==='water'){v146Star(c,0,-20,2.4,hi,time*.5);v146Feather(c,9,-10,.5,col);}
 else if(el==='wind'){v146Ring(c,0,-20,5,hi,.32,.8);v146Feather(c,-9,-11,-.6,hi);}
 else{v146Path(c,[[-4,-18],[-5,-23],[-1,-20],[2,-24],[5,-18]],hi,.65);}
 if(pulse)v146Star(c,9,-13,2.6,hi,time*3);c.restore();
}
function v149Cannon(c,time,pulse,mode){
 c.save();c.translate(0,Math.sin(time*3)*.7);
 const dark='#253c5e',col='#90c9df',hi='#e7f6ff';
 v146Path(c,[[-8,-4],[-6,-12],[5,-12],[9,-6],[6,-2],[-5,-2]],col,.8,true,dark);
 v146Path(c,[[-6,-12],[-3,-16],[3,-16],[6,-12]],hi,.6,true,col);
 for(const y of mode===1?[-11,-7]:[-9]){v146Path(c,[[1,y-1.8],[11,y-1.8],[12,y],[11,y+1.8],[1,y+1.8]],hi,.6,true,'#567ba4');v146Path(c,[[3,y-1],[10,y-1]],'#fff',.45);}
 v146Star(c,-3,-8,2.6,'#8ceaff',time*.4);v146Path(c,[[-7,-1],[-3,1],[5,1],[9,-2]],'#ddbf7e',.8);
 if(pulse){v146Glow(c,13,-9,8,'#ffcf82',.45);v146Star(c,13,-9,4,'#ffedbd',time*2);}c.restore();
}
const v149PetDrawBefore=v146PetDraw;
v146PetDraw=function(c,s,p,i){
 const count=s.pets.length,ring=Math.floor(i/10),slots=Math.min(10,count-ring*10),a=G.t*.35+(i%10)*Math.PI*2/Math.max(1,slots)+ring*.7;
 const x=G.pl.x+Math.cos(a)*(34+ring*18),y=G.pl.y+Math.sin(a)*(19+ring*12)+4;
 const pulse=G.t-(p.v146Attack??-99)<.3;
 if(['ro_mage_1','ro_mage_4','ro_merchant_4'].includes(s.key)){
  c.save();c.translate(x,y);v146Ring(c,0,1,6,'#c4dbed',.35,.35);
  if(s.key==='ro_merchant_4'){c.scale(.7,.7);v149Cannon(c,G.t+i,pulse,s.a);}else{c.scale(.75,.75);v149Familiar(c,p.element||['fire','water','wind'][i%3],G.t+i,pulse);}
  c.restore();return;
 }
 // Re-anchor older unique summon art at the new formation, then shrink the
 // complete silhouette (body, weapon, crown, wings) together by 40 percent.
 const oldRing=count>8?Math.floor(i/8):0,oldSlots=Math.min(8,count-oldRing*8),oldA=G.t*.45+(count>8?(i%8)*Math.PI*2/oldSlots+oldRing*1.2:i*2.399);
 let ox=G.pl.x+Math.cos(oldA)*(30+oldRing*22),oy=G.pl.y+Math.sin(oldA)*(13+oldRing*12),attack=G.t-(p.v146Attack??-99);
 if(attack>=0&&attack<.4&&p.m){const l=Math.sin(attack/.4*Math.PI)*(count>8?.1:.22);ox+=(p.m.x-ox)*l;oy+=(p.m.y-oy)*l;}
 c.save();c.translate(x,y);c.scale(.6,.6);c.translate(-ox,-oy);v149PetDrawBefore.call(this,c,s,p,i);c.restore();
};
const v149SpiritBefore=drawSpirit;
drawSpirit=function(c,p,...args){
 if(activeGems().find(g=>g.u===p.g)?.id==='mg_spirits'){
  c.save();c.translate(p.x,p.y);c.scale(.75,.75);v149Familiar(c,{brn:'fire',chl:'water',shk:'wind'}[p.el]||'fire',G.t,!!p.tgt);c.restore();return;
 }
 c.save();c.translate(p.x,p.y);c.scale(.6,.6);c.translate(-p.x,-p.y);v149SpiritBefore.call(this,c,p,...args);c.restore();
};
for(const name of ['drawGsp','drawTurret','drawSap','drawUnd']){
 const previous=({drawGsp,drawTurret,drawSap,drawUnd})[name];
 const compact=function(c,p,...args){c.save();c.translate(p.x,p.y);c.scale(.6,.6);c.translate(-p.x,-p.y);try{return previous.call(this,c,p,...args);}finally{c.restore();}};
 if(name==='drawGsp')drawGsp=compact;if(name==='drawTurret')drawTurret=compact;if(name==='drawSap')drawSap=compact;if(name==='drawUnd')drawUnd=compact;
}
const v149CloneBefore=drawClone;
drawClone=function(c,...args){c.save();c.translate(G.pl.x,G.pl.y);c.scale(.6,.6);c.translate(-G.pl.x,-G.pl.y);try{return v149CloneBefore.call(this,c,...args);}finally{c.restore();}};
for(const kind of ['plant','cultiv']){
 const previous=V6_CAST[kind];
 V6_CAST[kind]=function(c){
  const before=new Set(v6G().ents),target=c.tgt||c.p,x0=target.x,y0=target.y,result=previous.apply(this,arguments);
  v6G().ents.filter(e=>!before.has(e)).forEach((e,i)=>{
   if(e.k!=='plant'||!e.draw)return;
   const n=3+(c.m.minion||0),a=6.283*i/n,[x,y]=kind==='plant'?v6Clamp(x0+Math.cos(a)*14,y0+Math.sin(a)*9):[e.x,e.y],render=e.draw;
   e.draw=(z,cx)=>{cx.save();cx.translate(x,y);cx.scale(.6,.6);cx.translate(-x,-y);try{return render(z,cx);}finally{cx.restore();}};
  });return result;
 };
}
V134_RULES.push(['砲陣編隊與連射','砲陣擴編 +2；浮游砲群將包含輔助的總數翻倍。雙管副彈與兩輪一次的輪射均套用奧義彈組；輔助追加與協同號令不增加自主輪次，追加不遞迴。']);
if(HELP.asc)HELP.asc=['職業天賦',V134_RULES.map(r=>[...r])];
