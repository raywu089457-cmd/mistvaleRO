/* 流浪仙境 v1.4.6 — 技能魔化視覺。
 * All clocks below observe combat events. No RNG, damage, cooldown, or save changes.
 * RO originals remain untouched; monster sheets are composited at draw time.
 */
const V146 = { audit:false, events:[], images:new Map(), failures:new Set(), palettes:{
  fire:['#ff793e','#ffe9aa','#9a2f36'],ice:['#6ed7ff','#efffff','#3478be'],storm:['#ae9aff','#fff6bd','#4b58ad'],
  holy:['#f4cf78','#fff9db','#b67b45'],steel:['#83b9d5','#effcff','#385976'],blood:['#e65368','#ffd3aa','#672537'],
  poison:['#9dd65a','#edffb7','#407a59'],shadow:['#aa82dc','#e7d0ff','#3c315b'],rose:['#ed91bf','#fff1d0','#91538c'],
  music:['#83e5d2','#fff3b0','#448b9f'],earth:['#dbaa6b','#f9e0b4','#725137']
}};
// Each entry has a distinct silhouette AND motion/composition, not a class recolor.
// format: main motif / secondary motif / palette / native RO effect / geometry variant
const V146_RECIPES={
 ro_sword_0:['dragon/fangs/fire/firehit1/3','lances/reticle/steel/pierce/3','hammer/fissure/earth/bowling/2'],
 ro_sword_1:['cross/blood/holy/holyhit/2','shields/feathers/holy/lexaeterna/3','lance/oath/holy/pierce/1'],
 ro_sword_2:['blood/fangs/blood/provoke/5','drill/rift/steel/pierce/5','crescent/return/steel/bowling/2'],
 ro_sword_3:['shields/bastion/steel/bowling/4','roar/crown/earth/provoke/3','cross/plates/steel/holyhit/4'],
 ro_bow_0:['rail/reticle/steel/arrowshot/1','arrows/feathers/holy/arrowstorm/3','arrows/reticle/fire/arrowshot/2'],
 ro_bow_1:['strings/arrows/music/arrowshot/2','speaker/waves/music//3','staff/notes/holy//4'],
 ro_bow_2:['mine/gears/earth/skidtrap/3','bomb/fissure/fire/firehit1/6','serpent/drops/poison/poison_mist/2'],
 ro_bow_3:['instruments/staff/music//3','noteclock/waves/shadow//3','banner/notes/holy//5'],
 ro_bow_4:['dancers/rose/rose//2','cage/hearts/rose/weakness/6','ribbon/footsteps/rose//2'],
 ro_bow_5:['chakram/return/rose/sonicblow/4','whip/cage/shadow/sonicblow/1','metronome/whip/rose//2'],
 ro_bow_6:['falcons/gust/steel/windhit1/5','falcons/lightning/storm/lightning/3','falcons/return/earth/windhit1/2'],
 ro_mage_0:['volcano/meteor/fire/meteor1/5','icecage/snow/ice/freeze/6','lightning/branches/storm/lightning/6'],
 ro_mage_1:['crown/spirits/holy/lexaeterna/3','planets/orbits/fire//4','comet/commands/fire/firehit1/3'],
 ro_mage_2:['blackhole/debris/shadow/quagmire/6','collapse/elements/storm/hell_in/4','roots/seal/poison/quagmire/4'],
 ro_mage_3:['blades/lightning/storm/lightning/3','iceblade/snow/ice/freeze/2','comets/helix/fire/firehit1/3'],
 ro_mage_4:['portals/march/fire//4','triad/elements/storm//3','grimoire/crown/holy/lexaeterna/3'],
 ro_thief_0:['slashes/afterimage/shadow/sonicblow/4','fangs/venom/poison/poison_mist/2','blades/return/steel/sonicblow/2'],
 ro_thief_1:['decoy/smoke/shadow//1','pincer/daggers/blood/sonicblow/2','claw/soul/shadow/weakness/3'],
 ro_thief_2:['guillotine/rift/blood/sonicblow/2','syringe/venom/poison/poison_mist/5','slashes/steps/steel/sonicblow/3'],
 ro_thief_3:['skull/hourglass/shadow/weakness/3','chains/soul/shadow/weakness/6','mantle/eyes/shadow//4'],
 ro_thief_4:['daggers/web/shadow/sonicblow/4','blades/afterimage/shadow/sonicblow/4','decoy/return/shadow//3'],
 ro_acolyte_0:['angel/heal/holy/holyhit/2','orbs/feathers/holy/holyhit/4','cathedral/water/holy/sanctuary/4'],
 ro_acolyte_1:['fists/afterimage/earth/sonicblow/3','palm/orbs/holy//5','fist/shock/earth/crashearth/1'],
 ro_acolyte_2:['cathedral/steps/holy/sanctuary/6','pillars/cross/holy/holyhit/3','judgment/hourglass/holy/lexaeterna/2'],
 ro_acolyte_3:['fists/fissure/earth/crashearth/3','orb/rail/holy/pierce/5','blink/lightning/storm/sonicblow/3'],
 ro_acolyte_4:['angel/shields/holy/holyhit/3','judgment/staff/holy/lexaeterna/3','orbs/return/holy/holyhit/3'],
 ro_merchant_0:['hammer/gears/earth/crashearth/3','cart/return/fire/cartrevolution/2','coins/blade/holy/maemor/6'],
 ro_merchant_1:['beast/dna/poison//1','vial/dna/poison/poison_mist/3','seed/flame/fire/firehit1/5'],
 ro_merchant_2:['mecha/hammer/steel/crashearth/3','cannon/heat/fire/firehit1/4','saw/sparks/steel/bowling/8'],
 ro_merchant_3:['pod/roots/poison/poison_mist/4','acid/rail/poison/poison_mist/1','cauldron/bubbles/poison/poison_mist/6'],
 ro_merchant_4:['turrets/orbits/steel//4','barrage/gears/fire/firehit1/5','crossfire/reticle/steel/arrowshot/3'],
 ro_merchant_5:['garden/roots/poison//5','bloom/petals/rose//6','fruit/vines/poison//3']
};
const V146_PROFILES={};
for(const [key,rows] of Object.entries(V146_RECIPES))rows.forEach((spec,i)=>{
 const [motif,detail,palette,native,n]=spec.split('/'),b=Object.values(ASC).flat().find(b=>b.k===key);
 V146_PROFILES[key+':'+(i+1)]={key:key+':'+(i+1),id:V138_ULT_IDS[key][i],name:b.t[7][i].n,motif,detail,palette,native,n:+n};
});
// Earlier defining rows that replace a skill before an ultimate is learned.
const V146_ROWS=[
 ['ro_sword_2','sw_spiral','a',2,'drill/helix/steel/pierce/5'],
 ['ro_bow_2','bw_ankle','a',1,'mine/sparks/fire/skidtrap/3'],
 ['ro_bow_2','bw_ankle','a',2,'mine/reticle/steel/skidtrap/4'],
 ['ro_bow_2','bw_ankle','a',3,'mine/hourglass/earth/skidtrap/3'],
 ['ro_mage_1','mg_field','b',3,'planets/march/fire//4'],
 ['ro_mage_2','mg_tetra','a',1,'collapse/seal/storm/hell_in/4'],
 ['ro_mage_2','mg_tetra','a',2,'comets/elements/storm/hell_in/4'],
 ['ro_mage_2','mg_gravity','b',3,'blackhole/hourglass/shadow/quagmire/4'],
 ['ro_acolyte_2','ac_magnus','a',1,'cathedral/oath/holy/sanctuary/4'],
 ['ro_acolyte_2','ac_magnus','a',2,'cathedral/march/holy/sanctuary/4'],
 ['ro_acolyte_2','ac_magnus','a',3,'cathedral/return/holy/sanctuary/4'],
 ['ro_merchant_2','mc_cannon','b',2,'cannon/smoke/fire/firehit1/3'],
 ['ro_merchant_3','mc_miasma','a',2,'pod/vines/poison/poison_mist/4']
].map(([branch,id,row,value,spec])=>{const [motif,detail,palette,native,n]=spec.split('/');return {key:`${branch}:${row}${value}:${id}`,branch,id,row,value,motif,detail,palette,native,n:+n};});
const V146_TAU=Math.PI*2;
function v146Img(file){
 if(!file)return null;
 const src=RO.root+file;
 let im=RO.images[src]||V146.images.get(src);
 if(!im){im=new Image();im.onload=()=>{RO.images[src]=im;};im.onerror=()=>V146.failures.add(file);im.src=src;V146.images.set(src,im);}
 return im.complete&&im.naturalWidth>0?im:null;
}
function v146Preload(){
 for(const id of ['ifrit','strouf','ghost','angeling','willow','imp']){
  const states=RO.assets.monsters[id]?.states;
  for(const k of ['idle','attack'])if(states?.[k])v146Img(states[k].file);
 }
 for(const id of ['thief','archer','mage']){const def=RO.assets.characters[id]?.states?.idle;if(def)v146Img(def.file);}
 for(const id of ['fire_blast.bmp','freeze_ice.bmp','light_bang_a.bmp','sanctuaria_angel_wing_up.bmp','bubble_b.bmp','smoke2.bmp','magic_green','ring_white'])v146Img(RO.assets.effects.textures[id]?.file);
}
// Layered primitives share geometry code, while per-skill recipes choose shape,
// trajectory, timing, quantity and secondary action independently.
function v146Path(c,points,color,width=1,closed=false,fill=false){
 c.beginPath();points.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));if(closed)c.closePath();
 c.strokeStyle=color;c.lineWidth=width;c.lineJoin='round';if(fill){c.fillStyle=fill===true?color:fill;c.fill();}c.stroke();
}
function v146Glow(c,x,y,r,col,a=.55){
 if(r<=0)return;c.save();const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,col+'00');
 c.globalAlpha*=a;c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore();
}
function v146Ring(c,x,y,r,col,ratio=.42,a=1){c.save();c.globalAlpha*=a;c.strokeStyle=col;c.lineWidth=1;c.beginPath();c.ellipse(x,y,Math.max(.1,r),Math.max(.1,r*ratio),0,0,V146_TAU);c.stroke();c.restore();}
function v146Star(c,x,y,r,col,rot=0){c.save();c.translate(x,y);c.rotate(rot);v146Path(c,[[0,-r],[r*.18,-r*.18],[r,0],[r*.18,r*.18],[0,r],[-r*.18,r*.18],[-r,0],[-r*.18,-r*.18]],col,.5,true,true);c.restore();}
function v146Tex(c,id,x,y,w,h,a=1,rot=0){const im=v146Img(RO.assets.effects.textures[id]?.file);if(!im)return;c.save();c.globalCompositeOperation='lighter';c.globalAlpha*=a;c.translate(x,y);c.rotate(rot);c.drawImage(im,-w/2,-h/2,w,h);c.restore();}
function v146Rune(c,r,col,t,n=8){
 v146Ring(c,0,0,r,col,.48,.65);v146Ring(c,0,0,r*.8,col,.48,.35);
 for(let i=0;i<n;i++){const a=i*V146_TAU/n+t*.2,x=Math.cos(a)*r,y=Math.sin(a)*r*.48;v146Path(c,[[x-1,y-2],[x+2,y],[x-1,y+2]],col,.7);}
}
function v146Blade(c,x,y,a,len,col,accent){c.save();c.translate(x,y);c.rotate(a);v146Path(c,[[-len*.5,0],[len*.32,-2],[len*.6,0],[len*.32,2]],col,.8,true,accent);v146Path(c,[[-len*.5,-3],[-len*.5,3]],col,2);c.restore();}
function v146Shield(c,x,y,a,col,accent,size=1){c.save();c.translate(x,y);c.rotate(a);c.scale(size,size);v146Path(c,[[-6,-9],[0,-11],[6,-9],[5,2],[0,8],[-5,2]],col,1,true,'#253c55');v146Path(c,[[-3,-6],[0,-7],[3,-6],[2,1],[0,4],[-2,1]],accent,.7,true);v146Path(c,[[0,-5],[0,2],[-2,-2],[2,-2]],col,1);c.restore();}
function v146Note(c,x,y,a,col){c.save();c.translate(x,y);c.rotate(a);c.fillStyle=col;c.beginPath();c.ellipse(-2,3,2.6,1.8,-.4,0,V146_TAU);c.fill();v146Path(c,[[0,3],[0,-7],[6,-5]],col,1.2);c.restore();}
function v146Feather(c,x,y,a,col){c.save();c.translate(x,y);c.rotate(a);c.fillStyle=col;c.beginPath();c.moveTo(0,-7);c.quadraticCurveTo(7,-2,0,7);c.quadraticCurveTo(-3,0,0,-7);c.fill();v146Path(c,[[0,-5],[0,8]],'#fef5dd',.6);c.restore();}
function v146Bolt(c,x,y,len,col,t){const pts=[];for(let i=0;i<7;i++)pts.push([x+(i===0||i===6?0:Math.sin(i*7+t*23)*4),y-len+i*len/6]);v146Path(c,pts,col,3);v146Path(c,pts,'#fffbe8',.8);}
function v146Gear(c,x,y,r,col,t,n=8){c.save();c.translate(x,y);c.rotate(t);const p=[];for(let i=0;i<n*4;i++){const a=i*V146_TAU/(n*4),rr=i%4<2?r:r*.8;p.push([Math.cos(a)*rr,Math.sin(a)*rr]);}v146Path(c,p,col,1,true,'#304354');v146Ring(c,0,0,r*.4,'#eddfbf',1);c.restore();}
function v146Heart(c,x,y,r,col){c.save();c.translate(x,y);c.scale(r/7,r/7);c.fillStyle=col;c.beginPath();c.moveTo(0,6);c.bezierCurveTo(-13,-2,-5,-11,0,-4);c.bezierCurveTo(5,-11,13,-2,0,6);c.fill();c.restore();}
function v146Bird(c,x,y,t,col,size=1){c.save();c.translate(x,y);c.scale(size,size);const wing=5+Math.sin(t*16)*3;v146Path(c,[[0,-1],[-5,-wing],[-13,-wing-2],[-8,-2],[-3,2],[0,5],[3,2],[8,-2],[13,-wing-2],[5,-wing]],'#273a50',1,true,col);v146Path(c,[[-1,-3],[1,-4],[4,-2],[1,0]],'#ffe8ac',.6,true,true);v146Path(c,[[-7,-4],[-11,-wing],[-4,-2]],'#f2ead2',.5);c.restore();}
function v146Flower(c,x,y,r,t,col){c.save();c.translate(x,y);for(let i=0;i<6;i++){c.save();c.rotate(i*Math.PI/3+t);c.fillStyle=col;c.beginPath();c.ellipse(0,-r*.6,r*.3,r*.65,0,0,V146_TAU);c.fill();c.strokeStyle='#ffe8ba';c.lineWidth=.5;c.stroke();c.restore();}v146Glow(c,0,0,r*.5,'#fff1ae');c.fillStyle='#ffefba';c.beginPath();c.arc(0,0,2,0,V146_TAU);c.fill();c.restore();}
function v146Sprite(c,kind,x,y,time,size=34,attack=false,alpha=1,element=null){
 const states=RO.assets.monsters[kind]?.states||RO.assets.characters[kind]?.states,def=states?.[attack?'attack':'idle']||states?.idle;
 const im=def&&v146Img(def.file);if(!im)return false;
 let ms=(time*1000)%def.durations.reduce((a,b)=>a+b,0),idx=0;while(idx<def.frames-1&&ms>def.durations[idx])ms-=def.durations[idx++];
 const bounds=def.frameBounds?.[idx]||[0,0,def.frameWidth,def.frameHeight],h=bounds[3]-bounds[1],scale=size/Math.max(1,h);
 c.save();c.globalAlpha*=alpha;c.imageSmoothingEnabled=false;
 // Position by the actual visible bounds: some original ACT anchors sit far below the sprite.
 const dx=x-(bounds[0]+bounds[2])*.5*scale,dy=y-bounds[3]*scale;
 if(element==='wind')c.filter='hue-rotate(35deg) saturate(0.8) brightness(1.3)';
 if(element==='water')c.filter='saturate(0.75) brightness(1.12)';
 c.drawImage(im,(def.ox||0)+idx*def.frameWidth,def.oy||0,def.frameWidth,def.frameHeight,dx,dy,def.frameWidth*scale,def.frameHeight*scale);c.restore();return true;
}
function v146Main(c,p,t,age,span,phase){
 const [col,hi,low]=V146.palettes[p.palette],n=p.n,R=17+Math.sin(t*Math.PI)*7,spin=age*3,hit=phase!=='cast';
 const radial=(fn,num=n,r=R)=>{for(let i=0;i<num;i++){const a=i*V146_TAU/num+spin;fn(Math.cos(a)*r,Math.sin(a)*r*.5,a,i);}};
 const beam=(w=2)=>{v146Path(c,[[-span,3],[20,-5]],col,w+3);v146Path(c,[[-span,3],[20,-5]],hi,w);};
 switch(p.motif){
 case 'dragon':{c.save();c.rotate(-.25);for(let i=0;i<7;i++){const x=-35+i*9,y=Math.sin(age*10-i*.65)*5;v146Tex(c,'fire_blast.bmp',x,y,22,28,.6);v146Glow(c,x,y,10,col,.4);}v146Path(c,[[20,-10],[31,-5],[25,0],[33,3],[18,6],[10,0]],hi,1,true,low);v146Path(c,[[17,-9],[15,-18],[23,-10]],col,1);c.restore();break;}
 case 'lances':for(let i=0;i<n;i++){c.save();c.rotate((i-1)*.32);v146Blade(c,-10+40*t,(i-1)*8,0,62,col,hi);c.restore();}break;
 case 'lance':v146Blade(c,-10+25*t,-7,-.25,65,col,hi);v146Rune(c,24,col,age,6);break;
 case 'hammer':c.save();c.rotate(-.75+Math.min(1,t*3)*.9);v146Path(c,[[0,-27],[0,9]],'#b38b64',4);v146Path(c,[[-11,-29],[11,-29],[11,-18],[-11,-18]],hi,1,true,low);c.restore();v146Ring(c,0,6,R*1.3,col);break;
 case 'cross':v146Path(c,[[0,-40],[0,12]],col,8);v146Path(c,[[-20,-20],[20,-20]],col,8);v146Path(c,[[0,-40],[0,12]],hi,2);v146Path(c,[[-20,-20],[20,-20]],hi,2);v146Tex(c,'light_bang_a.bmp',0,-20,40,40,.4);break;
 case 'shields':radial((x,y,a)=>v146Shield(c,x,y-8,a*.12,col,hi),n,25);break;
 case 'blood':for(let i=0;i<5;i++){const x=(i-2)*8;v146Path(c,[[x,8],[x-3,-5-t*14],[x+3,-20-t*16]],col,2);v146Glow(c,x,-8,8,col,.3);}v146Rune(c,22,low,age);break;
 case 'drill':beam(3);for(let i=0;i<5;i++)v146Ring(c,-28+i*10,-i*1.2,6+i*.6,hi,1);v146Blade(c,18,-5,0,38,col,hi);break;
 case 'crescent':case 'chakram':case 'saw':{c.save();c.rotate(spin);if(p.motif==='saw')v146Gear(c,0,0,22,col,spin,n);else{c.strokeStyle=col;c.lineWidth=5;c.beginPath();c.arc(0,0,22,0,Math.PI*1.45);c.stroke();c.strokeStyle=hi;c.lineWidth=1;c.stroke();if(p.motif==='chakram')v146Blade(c,20,0,1.5,17,col,hi);}c.restore();break;}
 case 'roar':for(let i=0;i<3;i++)v146Ring(c,0,-7,(t*27+i*9)%36,col,1,.8-i*.15);v146Path(c,[[-10,-14],[-5,-22],[0,-14],[5,-22],[10,-14]],hi,2);break;
 case 'rail':beam(2);v146Blade(c,10,-4,0,42,col,hi);v146Tex(c,'light_bang_a.bmp',5,-4,24,24,.5);break;
 case 'arrows':for(let i=0;i<n;i++){const y=(i-(n-1)/2)*8;v146Blade(c,-24+50*((t+i*.16)%1),y,-.08,32,col,hi);}break;
 case 'strings':for(let i=0;i<2;i++){c.strokeStyle=col;c.lineWidth=1.5;c.beginPath();c.ellipse(-18,0,8,25,i*.3-.15,-Math.PI/2,Math.PI/2);c.stroke();v146Path(c,[[-18,-25],[-8+t*8,0],[-18,25]],hi,.7);}break;
 case 'speaker':v146Path(c,[[-12,-26],[10,-26],[12,9],[-12,9]],hi,1,true,low);v146Ring(c,0,-15,5,col,1);v146Ring(c,0,0,8,col,1);for(let i=0;i<3;i++)v146Ring(c,15,-5,8+(t*18+i*7)%24,col,1,.5);break;
 case 'staff':case 'instruments':for(let j=0;j<5;j++)v146Path(c,[[-30,j*4-12],[30,j*4-20]],col,.6);for(let i=0;i<n;i++)v146Note(c,-20+i*10,-10+Math.sin(age*5+i)*5,0,hi);if(p.motif==='instruments'){v146Path(c,[[-20,8],[-23,-24],[-7,-20],[-4,9]],hi,2);for(let i=0;i<4;i++)v146Path(c,[[-20+i*4,-20],[-17+i*3,7]],col,.6);}break;
 case 'mine':v146Gear(c,0,0,15,col,0,6);v146Path(c,[[-5,-5],[5,-5],[5,3],[-5,3]],hi,1,true,low);v146Glow(c,0,-3,6,'#ff624e',.7);v146Path(c,[[-12,10],[-4,10],[0,14],[6,10],[13,10]],col,2);break;
 case 'bomb':c.fillStyle=low;c.beginPath();c.arc(0,-6,12,0,V146_TAU);c.fill();v146Ring(c,0,-6,12,col,1);v146Path(c,[[4,-16],[5,-23],[11,-25]],hi,1.4);v146Star(c,11,-25,5,col,spin);break;
 case 'serpent':for(let j=0;j<2;j++){const pts=[];for(let i=0;i<20;i++)pts.push([-28+i*3,Math.sin(i*.5-age*8+j*Math.PI)*7]);v146Path(c,pts,col,3);v146Path(c,pts,hi,.7);}v146Path(c,[[26,-3],[34,0],[26,4]],hi,1,true,low);break;
 case 'noteclock':v146Rune(c,27,col,age,12);v146Note(c,0,-15,0,hi);v146Path(c,[[0,0],[Math.sin(age*5)*18,-Math.cos(age*5)*18]],col,1);break;
 case 'banner':v146Path(c,[[-18,15],[-18,-36]],hi,2);v146Path(c,[[-17,-35],[12,-31],[9,-20],[-18,-25]],hi,.7,true,low);v146Note(c,-4,-28,0,col);break;
 case 'dancers':for(let i=0;i<2;i++){const a=age*3+i*Math.PI;v146Sprite(c,'thief',Math.cos(a)*20,Math.sin(a)*6+10,age+i,30,false,.7);v146Heart(c,Math.cos(a)*20,-30,4,col);}break;
 case 'cage':for(let i=0;i<n;i++){const a=i*V146_TAU/n,x=Math.cos(a)*20,y=Math.sin(a)*8;c.strokeStyle=col;c.lineWidth=1;c.beginPath();c.moveTo(x,y+5);c.quadraticCurveTo(x*.8,-38,0,-43);c.stroke();}v146Ring(c,0,5,23,hi);break;
 case 'ribbon':case 'whip':{const pts=[];for(let i=0;i<40;i++){const a=i*.15+age*5,r=3+i*.65;pts.push([Math.cos(a)*r,Math.sin(a)*r*.48]);}v146Path(c,pts,low,4);v146Path(c,pts,col,2);v146Path(c,pts,hi,.5);if(p.motif==='whip')v146Star(c,pts[39][0],pts[39][1],8,hi);break;}
 case 'metronome':v146Path(c,[[-12,8],[0,-30],[12,8]],hi,1,true,low);v146Path(c,[[0,6],[Math.sin(age*10)*18,-24]],col,2);v146Star(c,Math.sin(age*10)*18,-24,4,hi);break;
 case 'falcons':radial((x,y,a,i)=>v146Bird(c,x,y-12,age+i,col,.75),Math.min(n,5),24);break;
 case 'volcano':v146Path(c,[[-26,9],[-14,0],[-8,-15],[0,-9],[7,-16],[15,0],[26,9]],col,1,true,low);for(let i=0;i<4;i++)v146Tex(c,'fire_blast.bmp',(i-1.5)*8,-15-(age*26+i*11)%34,20,38,.7);break;
 case 'icecage':for(let i=0;i<6;i++){const a=i*Math.PI/3,x=Math.cos(a)*20,y=Math.sin(a)*9;v146Path(c,[[x-5,y+6],[x-4,y-17],[x,y-30],[x+5,y-14],[x+4,y+6]],col,1,true,low);v146Path(c,[[x,y-27],[x+2,y+4]],hi,.8);}v146Tex(c,'freeze_ice.bmp',0,-15,34,44,.28);break;
 case 'lightning':for(let i=0;i<3;i++)v146Bolt(c,(i-1)*10,i*3-3,48-i*8,col,age+i);break;
 case 'crown':v146Path(c,[[-18,-20],[-21,-35],[-9,-29],[0,-41],[9,-29],[21,-35],[18,-20]],hi,1,true,low);v146Star(c,0,-28,5,col);v146Rune(c,26,col,age);break;
 case 'planets':radial((x,y,a,i)=>{v146Glow(c,x,y-10,8,['#ff975b','#85e1ff','#b8adff','#b2dc7b'][i],.9);v146Star(c,x,y-10,4,hi,a);},4,29);v146Rune(c,24,col,age);break;
 case 'comet':case 'comets':for(let i=0;i<(p.motif==='comet'?1:3);i++){const y=(i-1)*13;v146Tex(c,'fire_blast.bmp',3,y,28,22,.8);v146Path(c,[[-42,y+10],[-19,y+2],[4,y]],col,4);v146Glow(c,5,y,11,hi,.8);}break;
 case 'blackhole':c.save();c.rotate(-spin);for(let i=0;i<5;i++){c.strokeStyle=i%2?hi:col;c.lineWidth=1.2;c.beginPath();c.ellipse(0,0,12+i*3,4+i*2, i*.4,0,Math.PI*1.6);c.stroke();}c.fillStyle='#130e26';c.beginPath();c.ellipse(0,0,9,6,0,0,V146_TAU);c.fill();c.restore();break;
 case 'collapse':radial((x,y,a,i)=>{const r=(1-t)*1.7;v146Glow(c,x*r,y*r-8,9,['#ff8855','#8ddfff','#b2a5ff','#a6ce70'][i],.8);v146Path(c,[[x*r,y*r-8],[0,-8]],hi,.6);},4,25);v146Star(c,0,-8,5+t*20,hi,spin);break;
 case 'roots':case 'garden':case 'pod':case 'fruit':for(let i=0;i<5;i++){const a=i*1.3+spin*.1;v146Path(c,[[0,7],[Math.cos(a)*13,Math.sin(a)*6],[Math.cos(a)*27,Math.sin(a)*12]],col,1.5);}if(p.motif==='pod'){v146Path(c,[[-11,1],[-9,-20],[0,-30],[10,-20],[12,1]],hi,1,true,low);v146Ring(c,0,-12,7,col,1);}else if(p.motif==='fruit'){for(let i=0;i<3;i++){v146Glow(c,(i-1)*13,-12-Math.sin(age*4+i)*4,6,'#ffc765',.9);v146Ring(c,(i-1)*13,-12,4,hi,1);}}else if(p.motif==='garden')radial((x,y,a)=>v146Flower(c,x,y-12,7,age,col),5,22);break;
 case 'blades':radial((x,y,a)=>v146Blade(c,x,y-5,a+Math.PI/2,24,col,hi),n,20);break;
 case 'iceblade':v146Blade(c,0,-8,-.6,50,col,hi);for(let i=0;i<4;i++)v146Star(c,(i-1.5)*10,-18+Math.sin(i)*5,4,col,spin);break;
 case 'portals':radial((x,y,a,i)=>{v146Ring(c,x,y,10,col,.45);v146Star(c,x,y-8,4,hi);},4,26);break;
 case 'triad':for(let i=0;i<3;i++){const a=i*V146_TAU/3+spin;v146Path(c,[[0,-9],[Math.cos(a)*27,Math.sin(a)*15-9],[Math.cos(a+2.1)*27,Math.sin(a+2.1)*15-9]],['#ffaf70','#83dbff','#c2a2ff'][i],1);v146Star(c,Math.cos(a)*27,Math.sin(a)*15-9,6,hi,a);}break;
 case 'grimoire':v146Path(c,[[-20,-25],[-3,-22],[0,-18],[3,-22],[20,-25],[20,-3],[3,0],[0,4],[-3,0],[-20,-3]],hi,1,true,low);v146Path(c,[[0,-17],[0,2]],col,1);for(let i=0;i<4;i++){v146Path(c,[[-16,-19+i*4],[-5,-16+i*4]],col,.6);v146Path(c,[[5,-16+i*4],[16,-19+i*4]],col,.6);}v146Rune(c,28,col,age);break;
 case 'slashes':case 'pincer':case 'guillotine':for(let i=0;i<n;i++){c.save();c.rotate(p.motif==='pincer'?i*Math.PI:(i%2?-.65:.65));v146Path(c,[[-25+i*3,-17],[24-i*2,15]],col,4);v146Path(c,[[-24+i*3,-17],[22-i*2,15]],hi,1);c.restore();}if(p.motif==='guillotine')v146Path(c,[[-19,8],[-19,-42],[19,-42],[19,8]],low,2);break;
 case 'fangs':for(const x of [-7,7])v146Path(c,[[x-4,-18],[x+4,-18],[x,9]],hi,.8,true,col);break;
 case 'decoy':v146Sprite(c,'thief',-12,9,age,37,false,.8);v146Sprite(c,'thief',12,6,age+.3,37,false,.4);v146Tex(c,'smoke2.bmp',0,1,48,27,.4);break;
 case 'claw':for(let i=0;i<3;i++)v146Path(c,[[-20+i*9,-28],[-12+i*9,2],[-1+i*9,10]],col,2);break;
 case 'syringe':v146Blade(c,0,-8,.7,44,col,hi);for(let i=0;i<5;i++)v146Glow(c,(i-2)*6,-15+(age*20+i*7)%28,3,col,.8);break;
 case 'skull':v146Path(c,[[-11,-27],[-8,-35],[8,-35],[11,-27],[8,-16],[4,-16],[4,-11],[-4,-11],[-4,-16],[-8,-16]],hi,1,true,low);c.fillStyle=col;c.fillRect(-6,-26,4,4);c.fillRect(3,-26,4,4);break;
 case 'chains':radial((x,y,a)=>{for(let i=0;i<5;i++)v146Ring(c,x*i/4,y*i/4-12,3,col,.6);},n,32);break;
 case 'mantle':v146Path(c,[[-19,8],[-15,-22],[-7,-34],[0,-38],[7,-34],[15,-22],[19,8],[8,3],[0,10],[-8,3]],col,1,true,low);v146Path(c,[[-4,-25],[-1,-24],[1,-24],[4,-25]],hi,2);break;
 case 'daggers':radial((x,y,a)=>v146Blade(c,x,y-10,a+Math.PI,25,col,hi),n,27);break;
 case 'angel':v146Tex(c,'sanctuaria_angel_wing_up.bmp',0,-20,70,48,.8);v146Path(c,[[0,-28],[0,5]],col,4);v146Path(c,[[-7,-17],[7,-17]],hi,2);v146Ring(c,0,-38,8,hi,.4);break;
 case 'orbs':radial((x,y,a)=>{v146Glow(c,x,y-10,9,col,.8);v146Star(c,x,y-10,5,hi,a);},n,24);break;
 case 'cathedral':for(let i=0;i<3;i++){const x=(i-1)*17;v146Path(c,[[x-6,8],[x-6,-22],[x,-33],[x+6,-22],[x+6,8]],col,1);v146Path(c,[[x,-27],[x,-2]],hi,.7);}v146Rune(c,31,col,age,12);break;
 case 'fists':case 'fist':case 'palm':for(let i=0;i<(p.motif==='fists'?n:1);i++){c.save();c.translate((i-(n-1)/2)*(p.motif==='fists'?13:0),-10);c.rotate((i-1)*.2);v146Path(c,[[-7,9],[-8,-3],[-5,-10],[-2,-8],[1,-11],[4,-8],[7,-7],[8,4],[3,10]],hi,1,true,col);for(let j=0;j<3;j++)v146Path(c,[[-4+j*3,-6],[-4+j*3,0]],low,.8);c.restore();}break;
 case 'pillars':for(let i=0;i<3;i++){const x=(i-1)*17;v146Glow(c,x,-20,13,col,.55);v146Path(c,[[x,-48],[x,9]],col,7);v146Path(c,[[x,-48],[x,9]],hi,1.5);v146Ring(c,x,7,8,col);}break;
 case 'judgment':v146Path(c,[[0,-60],[0,8]],col,7);v146Path(c,[[0,-60],[0,8]],hi,1.5);v146Blade(c,0,-22,Math.PI/2,45,col,hi);v146Tex(c,'sanctuaria_angel_wing_up.bmp',0,-43,54,28,.65);break;
 case 'orb':v146Glow(c,0,-12,22,col,.7);v146Ring(c,0,-12,12,hi,1);v146Star(c,0,-12,12,hi,spin);break;
 case 'blink':for(let i=0;i<3;i++){v146Sprite(c,'thief',-28+i*20,9,age,30,false,.25+i*.2);v146Bolt(c,-28+i*20,8,32,col,age+i);}break;
 case 'cart':v146Path(c,[[-20,-20],[17,-20],[22,-3],[-16,-3]],hi,1,true,low);for(const x of [-11,14])v146Gear(c,x,4,7,col,spin);v146Path(c,[[-23,-24],[-13,-24],[-8,-5]],col,2);break;
 case 'coins':radial((x,y,a)=>{v146Ring(c,x,y-10,5,col,.7);v146Path(c,[[x,y-14],[x,y-6]],hi,1);},6,26);break;
 case 'beast':v146Sprite(c,'imp',0,10,age,48,true);v146Rune(c,29,col,age);break;
 case 'vial':v146Path(c,[[-4,-33],[4,-33],[4,-23],[13,-9],[11,2],[-11,2],[-13,-9],[-4,-23]],hi,1,true,low);v146Path(c,[[-9,-10],[9,-10],[8,0],[-8,0]],col,.7,true,true);break;
 case 'seed':v146Flower(c,0,-5,16,age*.5,col);v146Tex(c,'fire_blast.bmp',0,-20,28,35,.6);break;
 case 'mecha':v146Path(c,[[-16,10],[-22,-9],[-14,-25],[-7,-25],[-7,-34],[7,-34],[7,-25],[14,-25],[22,-9],[16,10],[9,10],[7,-3],[-7,-3],[-9,10]],hi,1,true,low);v146Glow(c,0,-18,8,col,.8);v146Gear(c,-18,-5,7,col,spin);v146Gear(c,18,-5,7,col,-spin);break;
 case 'cannon':v146Path(c,[[-23,-10],[16,-10],[20,-3],[16,4],[-23,4]],hi,1,true,low);for(let i=0;i<3;i++)v146Path(c,[[-14+i*9,-10],[-14+i*9,4]],col,1.5);v146Tex(c,'fire_blast.bmp',25,-3,26,28,.8);break;
 case 'acid':beam(1);for(let i=0;i<5;i++)v146Tex(c,'bubble_b.bmp',-20+i*10,Math.sin(age*9+i)*6,10,10,.65);break;
 case 'cauldron':v146Path(c,[[-22,-6],[-17,10],[0,14],[17,10],[22,-6]],col,1,true,low);v146Ring(c,0,-6,22,hi,.4);for(let i=0;i<6;i++)v146Tex(c,'bubble_b.bmp',(i-2.5)*7,-9-(age*20+i*7)%25,8,8,.5);break;
 case 'turrets':radial((x,y,a)=>{c.save();c.translate(x,y-8);c.rotate(a*.1);v146Path(c,[[-8,4],[-8,-5],[7,-5],[8,4]],hi,1,true,low);v146Path(c,[[0,-4],[14,-7]],col,4);v146Glow(c,0,0,4,col,.8);c.restore();},4,26);break;
 case 'barrage':for(let i=0;i<5;i++){const x=(i-2)*11;v146Path(c,[[x-12,-45],[x,-6]],col,3);v146Star(c,x,-6,6,hi);}break;
 case 'crossfire':for(const a of [-.45,.45]){c.save();c.rotate(a);beam(1);c.restore();}break;
 case 'bloom':v146Flower(c,0,-12,23,age*.3,col);break;
 default:throw Error('Missing V146 motif: '+p.motif);
 }
}
function v146Detail(c,p,t,age){
 const [col,hi,low]=V146.palettes[p.palette],d=p.detail,n=Math.min(p.n,6),r=22+t*10;
 switch(d){
 case 'reticle':v146Ring(c,0,-8,18,col,1,.7);for(let i=0;i<4;i++){const a=i*Math.PI/2;v146Path(c,[[Math.cos(a)*14,Math.sin(a)*14-8],[Math.cos(a)*23,Math.sin(a)*23-8]],hi,1);}break;
 case 'return':v146Path(c,[[-28,-10],[-36,0],[-28,10]],hi,1.2);v146Path(c,[[28,10],[36,0],[28,-10]],col,1.2);v146Ring(c,0,0,30,col,.45,.4);break;
 case 'fissure':case 'rift':for(let i=0;i<5;i++){const a=i*V146_TAU/5;v146Path(c,[[0,4],[Math.cos(a)*13,Math.sin(a)*6+4],[Math.cos(a+.2)*30,Math.sin(a+.2)*14+4]],low,3);v146Path(c,[[0,4],[Math.cos(a)*13,Math.sin(a)*6+4],[Math.cos(a+.2)*30,Math.sin(a+.2)*14+4]],col,.7);}break;
 case 'feathers':case 'petals':case 'rose':for(let i=0;i<n;i++){const a=i*V146_TAU/n+age,x=Math.cos(a)*r,y=Math.sin(a)*r*.55-8;if(d==='feathers')v146Feather(c,x,y,a,col);else v146Flower(c,x,y,4,a,col);}break;
 case 'lightning':case 'branches':for(let i=0;i<2;i++)v146Bolt(c,(i?1:-1)*18,3,35,col,age+i);break;
 case 'orbs':case 'elements':case 'spirits':case 'orbits':for(let i=0;i<(d==='elements'?4:n);i++){const a=i*V146_TAU/(d==='elements'?4:n)+age*2;v146Glow(c,Math.cos(a)*r,Math.sin(a)*r*.5-8,5,d==='elements'?['#ff9d57','#82d5ff','#bb95ff','#bcdf82'][i]:col,.7);}v146Ring(c,0,-8,r,col,.5,.3);break;
 case 'gears':case 'plates':case 'bastion':for(const sign of [-1,1])if(d==='gears')v146Gear(c,sign*24,9,7,col,age*sign);else v146Shield(c,sign*24,0,sign*.2,col,hi,.65);break;
 case 'notes':case 'staff':case 'waves':for(let i=0;i<4;i++)if(d==='notes'||d==='staff')v146Note(c,-24+i*16,-22-Math.sin(age*5+i)*5,i*.1,hi);else v146Ring(c,0,-5,12+(age*22+i*8)%26,col,.5,.35);break;
 case 'cage':case 'web':case 'seal':case 'oath':case 'crown':v146Rune(c,31,col,age, d==='web'?6:12);if(d==='web')for(let i=0;i<6;i++){const a=i*Math.PI/3;v146Path(c,[[0,0],[Math.cos(a)*31,Math.sin(a)*15]],col,.5);}if(d==='crown')v146Path(c,[[-9,-36],[-12,-44],[0,-40],[12,-44],[9,-36]],hi,1);break;
 case 'hearts':for(let i=0;i<3;i++)v146Heart(c,(i-1)*20,-20-(age*15+i*9)%23,4,hi);break;
 case 'snow':for(let i=0;i<6;i++){const a=i*V146_TAU/6+age*.3;v146Star(c,Math.cos(a)*27,Math.sin(a)*14-12,4,hi,a);}break;
 case 'soul':case 'smoke':case 'afterimage':for(let i=0;i<3;i++)v146Tex(c,'smoke2.bmp',(i-1)*14,-13-(age*9+i*5)%15,22,27,.18);break;
 case 'hourglass':c.save();c.translate(23,-27);v146Path(c,[[-5,-7],[5,-7],[-4,7],[4,7],[-5,-7]],hi,.9);v146Path(c,[[-5,8],[5,8]],col,1.5);c.restore();break;
 case 'roots':case 'vines':case 'dna':case 'helix':case 'commands':for(let j=0;j<2;j++){const pts=[];for(let i=0;i<16;i++)pts.push([Math.sin(i*.5+age*3+j*Math.PI)*12,(i-8)*3]);v146Path(c,pts,j?hi:col,1);}break;
 case 'rail':v146Path(c,[[-42,8],[22,-8]],col,1.3);break;
 case 'cross':v146Path(c,[[0,-37],[0,-19],[-6,-28],[6,-28]],hi,1.5);break;
 case 'blade':case 'daggers':case 'fangs':for(let i=0;i<2;i++)v146Blade(c,(i?1:-1)*22,-15,i?-.8:.8,19,col,hi);break;
 case 'hammer':v146Gear(c,0,7,28,col,age*.2,8);break;
 case 'shields':for(let i=0;i<2;i++)v146Shield(c,(i?1:-1)*25,3,0,col,hi,.65);break;
 case 'eyes':c.fillStyle=hi;c.fillRect(-6,-19,3,1);c.fillRect(4,-19,3,1);break;
 case 'footsteps':case 'steps':case 'march':for(let i=0;i<5;i++){c.save();c.translate(-25+i*12,14+(i%2)*5);c.rotate(-.4);c.fillStyle=col;c.globalAlpha*=.5;c.fillRect(-2,-3,3,7);c.restore();}break;
 case 'whip':v146Path(c,[[-30,8],[-18,-5],[0,13],[16,-4],[30,8]],hi,1);break;
 case 'arrows':for(let i=0;i<2;i++)v146Blade(c,0,(i?1:-1)*19,0,35,col,hi);break;
 case 'meteor':v146Tex(c,'fire_blast.bmp',15,-40,17,35,.7,-.4);break;
 default:for(let i=0;i<6;i++){const a=i*2.4,rr=10+(age*20+i*4)%25,x=Math.cos(a)*rr,y=Math.sin(a)*rr*.5-8;
  if(['venom','drops','bubbles','water'].includes(d))v146Tex(c,'bubble_b.bmp',x,y,7,7,.55);
  else if(['flame','heat','blood'].includes(d))v146Tex(c,'fire_blast.bmp',x,y,10,15,.35);
  else v146Star(c,x,y,2+(i%2),hi,a);
 }break;
 }
}
function v146Draw(c,p,age,life,phase,span=35){
 if(V146.audit)V146.draws=(V146.draws||0)+1;
 const t=Math.max(0,Math.min(1,age/life)),[col]=V146.palettes[p.palette];
 c.save();c.globalAlpha*=Math.min(1,age*20+.2,Math.max(0,(1-t)*5));c.lineCap='round';
 v146Glow(c,0,-8,21,col,phase==='cast'?.12:.2);
 if(phase==='cast'){c.scale(.72,.72);v146Rune(c,25,col,age,8);}
 v146Main(c,p,t,age,span,phase);v146Detail(c,p,t,age);c.restore();
}
function v146Record(p,phase){if(V146.audit){V146.events.push({key:p.key,id:p.id,phase,t:G.t});if(V146.events.length>24000)V146.events.splice(0,12000);}}
function v146Profile(s,id){const p=V146_PROFILES[s.key+':'+s.u];return p&&(!id||p.id===id)?p:id?V146_ROWS.find(p=>p.branch===s.key&&p.id===id&&s[p.row]===p.value):null;}
function v146Emit(s,p,m,phase='hit'){
 if(!s||!p||!m||G.dead||G.pl.v138!==s)return;
 const visual=s.v146||(s.v146={next:{}}),tag=p.key+':'+phase,now=G.t;
 // Only coalesce overlapping visual particles; never gate game events.
 if((visual.next[tag]??-Infinity)>now)return;visual.next[tag]=now+(phase==='hit'?.065:.12);
 const from={x:G.pl.x,y:G.pl.y},point={x:m.x,y:m.y},span=Math.min(65,Math.hypot(point.x-from.x,point.y-from.y));
 const life=phase==='cast'?.42: .58,serial=(visual.serial=(visual.serial||0)+1);
 s.stats.visuals=(s.stats.visuals||0)+1;
 const active=v6G().ents.filter(e=>e.v146Burst);if(active.length>=28){const old=active[0];old.life=0;}
 v6Ent({v146Burst:true,v146Profile:p.key,life,upd(e){if(G.pl.v138!==s||G.dead)e.t=e.life;},draw(e,c){
  if(G.pl.v138!==s||G.dead)return;c.save();c.translate(point.x,point.y-5);v146Draw(c,p,e.t,life,phase,span);c.restore();
 }});
 v146Record(p,phase);
 // A brief original RO STR accent at the impact, not a second generic class aura.
 if(p.native&&phase==='hit'&&serial%3===1){const id='v146:'+p.key;roFxProfiles[id]={str:[p.native],target:1};roFxAdd(id,point.x,point.y,{area:.65});}
}
// Suppress the old shared class line-art. The hooks below use actual source IDs.
v143Fx=function(){};
const v146CastBefore=v138Cast;
v138Cast=function(s,g,a,native){
 const r=v146CastBefore.apply(this,arguments),p=v146Profile(s,g.id);
 if(p&&r===true)v146Emit(s,p,G.pl,'cast');
 return r;
};
const v146CastSkillBefore=castSkill;
castSkill=function(g,...args){const r=v146CastSkillBefore.call(this,g,...args),s=v138State();if(r&&s)v146Emit(s,v146Profile(s,g.id),G.pl,'cast');return r;};
// Stop old source-skill flashes stacking on top of the transformed animation.
const v146RoAddBefore=roFxAdd;
roFxAdd=function(id,x,y,options={}){const s=G?.pl?.v138;if(s&&!id.startsWith('v146:')&&(v146Profile(s,id)||(id==='v78lord'&&v146Profile(s,'mg_lov'))))return;return v146RoAddBefore.call(this,id,x,y,options);};
const v146StrBefore=roDrawStr;
let v146StrLayer;
roDrawStr=function(c,definition,seconds,e){
 const transformed=e.id?.startsWith('v146:'),bright=['mg_storm','mg_lov','mg_bolt','v78lord','ac_magnus','th_cimpact','mc_flame','mg_comet'].includes(e.id);
 if(!transformed&&!bright)return v146StrBefore.apply(this,arguments);
 if(!v146StrLayer){v146StrLayer=document.createElement('canvas');v146StrLayer.width=160;v146StrLayer.height=160;}
 const l=v146StrLayer.getContext('2d');l.clearRect(0,0,160,160);
 v146StrBefore(l,definition,seconds,{...e,x:80,y:105,area:Math.min(transformed?.55:.7,e.area??1)});
 // Native STR textures use additive black backgrounds; retain that blend when
 // compositing the bounded layer so dimming cannot introduce black rectangles.
 c.save();c.globalCompositeOperation='lighter';c.globalAlpha*=transformed?.38:.48;c.drawImage(v146StrLayer,e.x-80,e.y-105);c.restore();
};
const v146HitBefore=v138Hit;
v138Hit=function(s,m,d,crit,o){
 const r=v146HitBefore.apply(this,arguments),id=v138Id(o),p=id?v146Profile(s,id):null;
 if(d>0&&p)v146Emit(s,p,m,'hit');
 return r;
};
// Scheduled strikes set v138Proc and skip v138Hit; observe them at their real dispatch.
const v146StrikeBefore=v138Strike;
v138Strike=function(s,m,k,o={}){
 const valid=v138Live(m)&&G.pl.v138===s&&!G.dead,id=o.id||o.v6sk||o.g?.id,p=id?v146Profile(s,id):null;
 const fx=v6G().fx,start=fx.length,before=m?.hp,r=v146StrikeBefore.apply(this,arguments);
 if(p)for(let i=fx.length-1;i>=start;i--)if(fx[i].k==='line')fx.splice(i,1);
 if(valid&&p&&m.hp<before)v146Emit(s,p,m,'hit');
 return r;
};
const v146BasicBefore=v138Basic;
v138Basic=function(s,m,o={},damage=0){
 const r=v146BasicBefore.apply(this,arguments);
 // Permanent poison has stored damage rather than a skill strike; show the
 // coating only on a real basic hit. The blood aura is likewise passive.
 if(!o.converted&&damage>0&&((s.key==='ro_thief_0'&&s.u===2)||(s.key==='ro_sword_2'&&s.u===1)))v146Emit(s,v146Profile(s),m,'hit');
 return r;
};
// Per-pet attack animation is a presentation timestamp, never a simulation input.
const v146PetBefore=v140PetHit;
v140PetHit=function(s,p,k,command){
 const valid=G.pl.v138===s&&s.pets.includes(p)&&p.until>G.t&&v138Live(p.m),r=v146PetBefore.apply(this,arguments);
 if(valid){p.v146Attack=G.t;v146Emit(s,v146Profile(s,p.id),p.m,'hit');}
 return r;
};
function v146PetDraw(c,s,p,i){
 const ring=s.pets.length>8?Math.floor(i/8):0,slots=Math.min(8,s.pets.length-ring*8);
 const a=G.t*.45+(s.pets.length>8?(i%8)*Math.PI*2/slots+ring*1.2:i*2.399),base={x:G.pl.x+Math.cos(a)*(30+ring*22),y:G.pl.y+Math.sin(a)*(13+ring*12)},attack=G.t-(p.v146Attack??-99),pulse=attack>=0&&attack<.4;
 let x=base.x,y=base.y;const target=p.m;
 if(pulse&&target){const l=Math.sin(attack/.4*Math.PI)*(s.pets.length>8?.1:.22);x+=(target.x-x)*l;y+=(target.y-y)*l;}
 c.save();c.translate(x,y);v146Ring(c,0,1,8,'#d8debd',.35,.22);
 const key=s.key;
 if(key==='ro_mage_4'||key==='ro_mage_1'){
  const el=p.element||['fire','water','wind'][i%3],kind={fire:'ifrit',water:'strouf',wind:'ghost'}[el]||'ifrit',col={fire:'#ffae62',water:'#86dcff',wind:'#d0b0ff'}[el];
  v146Glow(c,0,-16,19,col,.14);v146Sprite(c,kind,0,0,G.t+i*.3,el==='water'?37:32,pulse,1,el);
  // Custom insignia / orbital pieces distinguish a familiar from the enemy model.
  v146Ring(c,0,2,11,col,.35,.65);
  if(el==='fire'){v146Path(c,[[-5,-33],[-7,-40],[0,-36],[7,-40],[5,-33]],'#ffe3a0',.7);}
  if(el==='water'){for(let j=0;j<3;j++){const q=G.t*1.5+j*2.1;v146Star(c,Math.cos(q)*12,-17+Math.sin(q)*5,3,col,q);}}
  if(el==='wind'){for(let j=0;j<2;j++)v146Feather(c,(j?1:-1)*12,-18,Math.sin(G.t*3)*.3+(j?1:-1),col);}
  if(s.u===3&&p.strong>0){v146Path(c,[[-8,-39],[0,-44],[8,-39]],'#fff2b6',1);v146Star(c,0,-39,3,'#fff8dc');}
 }else if(key==='ro_bow_6'){v146Bird(c,0,-14,G.t+i,'#d6c6a6',1);if(s.u===2)v146Bolt(c,0,-3,21,'#b2b5ff',G.t);}
 else if(key==='ro_thief_4'||p.key==='shadow'){v146Sprite(c,'thief',0,0,G.t,30,pulse,.6);v146Blade(c,9,-9,-.7,15,'#bfa3ee','#fff1d5');}
 else if(key==='ro_acolyte_4'){v146Sprite(c,'angeling',0,-3,G.t,23,pulse,.9);v146Ring(c,0,-31,7,'#ffdf98',.3);}
 else if(key==='ro_merchant_5'||p.key==='sprout'){v146Sprite(c,'willow',0,0,G.t,27,pulse);v146Flower(c,0,-26,s.u===2?10:7,G.t*.3,'#eaa4c3');}
 else if(key==='ro_merchant_4'){v146Main(c,{motif:'cannon',n:1,palette:'steel'},.5,G.t,.5,'hit');v146Gear(c,0,3,8,'#b5c6d5',G.t);}
 else if(['lover','partner','accompanist'].includes(p.key)){v146Sprite(c,'archer',0,0,G.t,30,pulse,.7);if(p.key==='accompanist')v146Note(c,9,-30,0,'#ffde96');else v146Heart(c,10,-30,4,'#f4a3cc');}
 else {v146Sprite(c,'angeling',0,0,G.t,22,pulse,.85);}
 if(pulse){const col=V146.palettes[v146Profile(s)?.palette||'holy'][0];v146Star(c,10,-17,4,col,attack*5);}
 c.restore();
}
function v146FieldDraw(c,s,f){
 const m=f.mode==='fixed'||f.trap?f:f.m;if(!m)return;
 const id=f.o?.id||f.o?.v6sk,p=v146Profile(s,id)||v146FieldProfile(s,f),col=V146.palettes[p.palette][0];
 if(id==='mg_field'){
  if(f.key.startsWith('satellites')){for(let i=0;i<4;i++){const a=G.t*.65+i*Math.PI/2;v146ElementField(c,m.x+Math.cos(a)*22,m.y+Math.sin(a)*10,14,V6_ELS[i],G.t);}}
  else v146ElementField(c,m.x,m.y,30,f.o?.v6el||'fire',G.t);
  return;
 }
 c.save();c.translate(m.x,m.y-3);c.globalAlpha=.58;
 if(f.trap){v146Main(c,{motif:'mine',palette:'earth',n:3},.2,G.t,0,'field');}
 else{v146Rune(c,26,col,G.t,12);c.globalAlpha=.42;v146Main(c,p,.4,G.t,20,'field');}
 c.restore();
}
function v146FieldProfile(s,f){
 const k=f.key||'',id=f.o?.id||f.o?.v6sk;
 let spec=/altar/i.test(k)?'cathedral/cross/holy//4':/parasite|poison|spore|giantPlant/.test(k)?'pod/roots/poison//4':/gravity|blackHole/.test(k)?'blackhole/debris/shadow//6':/field/i.test(k)?'planets/elements/fire//4':'roots/seal/earth//4';
 const [motif,detail,palette,native,n]=spec.split('/');return {key:'field:'+s.key+':'+k,id,motif,detail,palette,native,n:+n};
}
// Replace old plain balls and generic field circles in one place, including the
// layered v142/v143 observers. Lifetime follows this specific character state.
v138Visual=function(s){
 v6Ent({v146Observer:true,life:1e9,upd(e){if(G.pl.v138!==s||G.dead)e.t=e.life;},draw(e,c){
  if(G.pl.v138!==s||G.dead)return;
  for(const f of s.fields)if(!f.done&&f.until>G.t)v146FieldDraw(c,s,f);
  s.pets.filter(p=>p.until>G.t).forEach((p,i)=>v146PetDraw(c,s,p,i));
  const profile=v146Profile(s);
  const stance={holyOath:'lance',doubleStance:'strings',deadlyDance:'ribbon',whipBeat:'metronome',frostBlade:'iceblade',bladeDance:'blades',curseBody:'mantle',gatherPalm:'palm',goldWeapon:'coins',mecha:'mecha'};
  if(profile)for(const [key,motif] of Object.entries(stance))if(v138On(s,key)){
   c.save();c.translate(G.pl.x,G.pl.y);c.globalAlpha=.3;c.scale(.62,.62);v146Main(c,{...profile,motif},.5,G.t,15,'stance');c.restore();
  }
  if(profile&&((s.key==='ro_sword_2'&&s.u===1)||(s.key==='ro_thief_0'&&s.u===2))){c.save();c.translate(G.pl.x,G.pl.y);c.globalAlpha=.35;v146Rune(c,14,V146.palettes[profile.palette][0],G.t,6);c.restore();}
 }});
};
const v146TickBefore=v138Tick;
v138Tick=function(s,dt){const r=v146TickBefore.apply(this,arguments);if(!G.dead&&G.pl.v138===s&&!v6G().ents.some(e=>e.v146Observer))v138Visual(s);return r;};
// The life giant is an actual movable summon, so keep its engine position and
// health bar, replacing only its body with the RO monster prototype.
const v146GspBefore=drawGsp;
drawGsp=function(c,p,...args){
 const s=G.pl?.v138,g=s&&v138Gem('mc_homun');
 if(s?.key==='ro_merchant_1'&&s.u===1&&g&&p.g===g.u&&v146Sprite(c,'imp',p.x,p.y,G.t,45,!!p.tgt)){
  c.save();c.translate(p.x,p.y);v146Rune(c,15,'#a4dc85',G.t,6);c.restore();
  if(p.hp!=null&&p.max){c.fillStyle='#263748';c.fillRect(p.x-11,p.y+3,22,2);c.fillStyle='#aadf87';c.fillRect(p.x-11,p.y+3,22*Math.max(0,Math.min(1,p.hp/p.max)),2);}return;
 }
 return v146GspBefore.call(this,c,p,...args);
};
// Elemental Field already shows its element in combat. Hide only its recurring
// four cast notices; other skill, loot and error notifications still pass through.
const v146ToastBefore=toast;
toast=function(message,...args){
 if(typeof message==='string'&&/^元素領域：(火山|洪水|狂風|地脈)$/.test(message))return;
 return v146ToastBefore.call(this,message,...args);
};
v146Preload();

// Base Elemental Field: attach visuals to the actual gameplay entity, preserving
// its radius, element, duration, tick, target and damage. No visual-only entities
// are inserted into the capped gameplay entity queue.
function v146ElementField(c,x,y,r,el,t){
 const rad=Math.max(12,r),col={fire:'#ff883e',water:'#8de8ff',wind:'#beb5ff',earth:'#e4b176'}[el];
 c.save();c.translate(x,y-3);v146Ring(c,0,0,rad,col,.55,.45);
 for(let i=0;i<7;i++){
  const a=i*V146_TAU/7,rr=rad*(i%2?.75:.42),xx=Math.cos(a)*rr,yy=Math.sin(a)*rr*.55;
  if(el==='fire'){
   const h=12+(Math.sin(t*8+i*2)+1)*7;
   v146Path(c,[[xx-5,yy],[xx-7,yy-h*.45],[xx-2,yy-h*.68],[xx+Math.sin(t*6+i)*3,yy-h],[xx+3,yy-h*.35],[xx+6,yy]],'#ff7240',.7,true,'#c53b27');
   v146Path(c,[[xx-3,yy],[xx,yy-h*.65],[xx+3,yy]],'#ffe29b',.6,true,'#ffb442');
   v146Tex(c,'fire_blast.bmp',xx,yy-8,15,23,.45);
   v146Star(c,xx+Math.sin(t*4+i)*4,yy-15-((t*13+i*7)%22),1.2,'#ffe6a0');
  }else if(el==='water'){
   const h=12+6*Math.sin(t*2+i);
   v146Path(c,[[xx-5,yy+2],[xx-4,yy-h*.6],[xx,yy-h],[xx+5,yy-h*.5],[xx+4,yy+3]],'#b9f5ff',.8,true,'#397fad');
   v146Path(c,[[xx,yy-h],[xx+1,yy+2],[xx+4,yy+3]],'#edffff',1);
   v146Star(c,xx+Math.sin(t+i)*5,yy-22+(t*5+i*3)%12,2,'#d5fbff',t*.4);
   if(i<3)v146Ring(c,0,2,(t*12+i*rad/3)%rad,'#83ddff',.5,.38);
  }else if(el==='earth'){
   const h=8+Math.sin(t*3+i)*2;
   v146Path(c,[[0,1],[xx*.5+3,yy*.3],[xx*.7-3,yy*.7],[xx,yy]],'#ffc073',2);
   v146Path(c,[[xx-7,yy],[xx-5,yy-h],[xx+1,yy-h-5],[xx+7,yy-h+1],[xx+6,yy+4]],'#bda080',.9,true,'#695b48');
   v146Path(c,[[xx-5,yy-h],[xx+1,yy-h-5],[xx+4,yy-h],[xx,yy-h+3]],'#f0c18a',.7,true,'#a48560');
   c.fillStyle='#e9bb84';c.fillRect(xx+8*Math.sin(t+i),yy-((t*8+i*3)%13),1.5,1.5);
  }else{
   const aa=a+t*2.5;v146Feather(c,Math.cos(aa)*rad*.8,Math.sin(aa)*rad*.4-9,aa,'#e1e9fa');
   const pts=[];for(let j=0;j<12;j++){const q=aa+j*.09;pts.push([Math.cos(q)*rad*.8,Math.sin(q)*rad*.4-9-j*.3]);}v146Path(c,pts,col,1.6);
   if(i===0||i===3)v146Bolt(c,xx,yy-3,19,'#d2c5ff',t+i);
  }
 }
 if(V146.audit)V146.fieldDraws=(V146.fieldDraws||0)+1;
 c.restore();
}
const v146BaseFieldBefore=V6_CAST.field;
V6_CAST.field=function(c){
 const prior=new Set(v6G().ents),r=v146BaseFieldBefore.apply(this,arguments);
 if(r)for(const e of v6G().ents)if(!prior.has(e)&&e.zone){const el=V6_ELS[v6G().fieldEl],radius=30*c.n;e.v146Element=el;e.gdraw=(q,cx)=>v146ElementField(cx,q.x,q.y,radius,el,q.t);}
 return r;
};

// Ordinary skills formerly backed only by a generic aura or shared strip.
// Explicit compositions keep healing, buffs, control, melee and music distinct.
// Skills with detailed native RO STR animations retain those animations.
const V146_SKILL_SPECS={
 bw_double:'arrows/feathers/steel/2',bw_shower:'arrowrain/reticle/steel/8',bw_blitz:'falcons/gust/earth/1',bw_fassault:'falcons/reticle/steel/3',bw_ankle:'mine/gears/earth/1',sw_breath:'dragon/heat/fire/3',mc_axe:'axes/sparks/steel/3',th_fstrip:'brokenarmor/plates/steel/4',
 bw_sharp:'rail/reticle/steel/1',th_mark:'skull/eyes/blood/2',mg_gravity:'blackhole/debris/shadow/5',ac_basil:'cathedral/shields/holy/3',
 sw_bash:'blade/sparks/steel/1',sw_charge:'lance/steps/steel/1',sw_provoke:'roar/fangs/fire/3',sw_berserk:'blood/fangs/blood/4',sw_wave:'crescent/return/steel/1',sw_frost:'icecage/fangs/ice/4',
 bw_varrow:'arrows/venom/poison/1',bw_corrode:'acid/drops/poison/3',bw_burst:'arrows/sparks/fire/1',bw_song:'staff/notes/music/3',bw_bsong:'instruments/notes/music/2',bw_disso:'speaker/waves/shadow/3',
 mg_frost:'icecage/snow/ice/6',mg_quake:'hammer/fissure/earth/3',mg_spirits:'triad/elements/storm/3',mg_tetra:'collapse/elements/storm/4',mg_quag:'roots/bubbles/earth/3',mg_napalm:'orbs/helix/shadow/3',mg_fiber:'web/seal/steel/8',
 th_slash:'slashes/steps/steel/3',th_venom:'fangs/drops/poison/2',th_hide:'smoke/eyes/shadow/3',th_backstab:'daggers/afterimage/blood/1',th_clone:'decoy/steps/shadow/2',th_weak:'skull/hourglass/shadow/1',th_dual:'blades/return/steel/2',
 ac_heal:'healing/feathers/holy/3',ac_wrath:'judgment/crown/holy/2',ac_call:'orbs/seal/holy/3',ac_asura:'fist/shock/earth/1',ac_combo:'fists/afterimage/earth/3',ac_finger:'orb/rail/holy/3',ac_knuckle:'blink/lightning/storm/2',ac_rampage:'palm/fissure/earth/4',
 mc_homun:'beast/dna/poison/1',mc_acidbomb:'vial/drops/poison/3',mc_faw:'cannon/gears/steel/1',mc_plant:'garden/roots/poison/3',mc_potion:'potion/bubbles/poison/1',
 bw_avulcan:'arrows/staff/music/5',bw_tarot:'tarot/hourglass/shadow/3',th_masslt:'slashes/meteor/shadow/5',th_sbreak:'claw/soul/shadow/2',ac_tfist:'fist/fangs/earth/2',ac_chain:'fists/helix/holy/4',
 dc_ugly:'ribbon/petals/rose/3',dc_forget:'heartclock/petals/rose/4',dc_partner:'dancers/rose/rose/2',dc_throw:'chakram/feathers/rose/1',dc_scream:'voice/lightning/rose/3',dc_humming:'staff/hearts/rose/4',
 bw_idun:'apple/notes/poison/3',bw_drum:'drum/waves/earth/2',bw_nibel:'goldring/notes/holy/3',ac_cheal:'healing/steps/poison/5',ac_renov:'sapling/feathers/poison/3',ac_resu:'phoenix/feathers/holy/6'
};
const V146_SKILL_ART=Object.fromEntries(Object.entries(V146_SKILL_SPECS).map(([id,spec])=>{const [motif,detail,palette,n]=spec.split('/');return [id,{key:'skill:'+id,id,motif,detail,palette,n:+n}];}));
const V146_SELF_ART=new Set(['sw_provoke','sw_berserk','bw_song','bw_bsong','bw_disso','mg_spirits','mg_frost','th_hide','th_clone','th_dual','ac_heal','ac_call','ac_rampage','ac_basil','mc_homun','mc_faw','mc_potion','dc_ugly','dc_partner','dc_scream','dc_humming','bw_idun','bw_drum','bw_nibel','ac_cheal','ac_renov','ac_resu']);
function v146OrdinaryDraw(c,p,t,life){
 const [col,hi,low]=V146.palettes[p.palette],u=t/life;
 c.save();c.globalAlpha*=Math.min(1,t*15+.2,(1-u)*5);c.scale(.85,.85);
 switch(p.motif){
  case 'arrowrain':for(let i=0;i<8;i++){const a=i*2.4,x=Math.cos(a)*22,y=Math.sin(a)*9-42+((t*70+i*13)%48);v146Blade(c,x,y,1.2,19,col,hi);v146Path(c,[[x-6,y-16],[x-2,y-4]],col,.6);}break;
  case 'axes':for(let i=0;i<3;i++){c.save();c.rotate(t*7+i*V146_TAU/3);c.translate(16,0);v146Path(c,[[0,8],[0,-17]],'#caa77b',2);v146Path(c,[[0,-15],[9,-20],[12,-11],[0,-8]],hi,.8,true,col);c.restore();}break;
  case 'brokenarmor':for(let i=0;i<4;i++){c.save();c.translate((i%2?1:-1)*(5+t*9),-16+(i<2?-1:1)*(4+t*5));c.rotate((i%2?1:-1)*t);v146Path(c,[[-5,-5],[4,-6],[6,4],[-3,6]],hi,1,true,low);c.restore();}v146Path(c,[[0,-30],[-3,-19],[4,-14],[-2,-3]],'#ffe1a1',1.5);break;
  case 'blade':v146Blade(c,5,-12,-.8+t*2,42,col,hi);v146Path(c,[[-18,-31],[8,-17],[22,5]],hi,1.2);break;
  case 'web':for(let i=0;i<8;i++){const a=i*Math.PI/4;v146Path(c,[[0,-7],[Math.cos(a)*28,Math.sin(a)*14-7]],col,.8);}for(let j=1;j<4;j++){const pts=[];for(let i=0;i<=8;i++){const a=i*Math.PI/4;pts.push([Math.cos(a)*j*8,Math.sin(a)*j*4-7]);}v146Path(c,pts,col,.8);}break;
  case 'smoke':for(let i=0;i<6;i++)v146Glow(c,Math.sin(i*2+t)*14,-8-i*3-t*8,10,low,.3);v146Sprite(c,'thief',0,0,t,31,false,.5*(1-u));break;
  case 'healing':for(let i=0;i<p.n;i++){const a=i*V146_TAU/p.n+t;const x=Math.cos(a)*19,y=Math.sin(a)*7-10-t*8;v146Path(c,[[x-3,y],[x+3,y]],col,2);v146Path(c,[[x,y-3],[x,y+3]],hi,2);}v146Tex(c,'sanctuaria_angel_wing_up.bmp',0,-23,38,28,.55);break;
  case 'potion':c.save();c.rotate(-.3+Math.sin(t*5)*.15);v146Path(c,[[-3,-28],[3,-28],[3,-22],[8,-17],[7,-4],[-7,-4],[-8,-17],[-3,-22]],hi,1,true,'#367a65');v146Path(c,[[-6,-13],[6,-13]],'#a5ffcf',2);v146Star(c,0,-8,3,hi);c.restore();break;
  case 'tarot':for(let i=0;i<3;i++){c.save();c.translate((i-1)*16,-16);c.rotate((i-1)*.3+Math.sin(t*4)*.05);v146Path(c,[[-7,-12],[7,-12],[7,12],[-7,12]],hi,1,true,low);v146Star(c,0,0,5,col,i+t);c.restore();}break;
  case 'heartclock':v146Heart(c,0,-16,12,col);v146Ring(c,0,-16,23,hi,1);v146Path(c,[[0,-16],[0,-29],[Math.sin(t*2)*15,-16-Math.cos(t*2)*15]],hi,1);break;
  case 'voice':for(let j=0;j<3;j++){const rr=10+((t*28+j*12)%32);c.strokeStyle=j===1?hi:col;c.lineWidth=1.6;c.beginPath();c.arc(0,-12,rr,-1.1,1.1);c.stroke();}v146Note(c,6,-22,-.3,hi);break;
  case 'apple':for(let i=0;i<3;i++){const x=(i-1)*17,y=-12-Math.sin(t*3+i)*5;v146Heart(c,x,y,7,'#ed8173');v146Path(c,[[x,y-5],[x+1,y-11],[x+7,y-12]],'#b8e295',1.5);}break;
  case 'drum':for(let i=0;i<2;i++){const x=(i?1:-1)*13;v146Path(c,[[x-9,-15],[x+9,-15],[x+8,-1],[x-8,-1]],hi,1,true,low);v146Ring(c,x,-15,9,hi,.45);v146Path(c,[[x-8,-13],[x,-2],[x+8,-13]],col,1);v146Path(c,[[x,-17],[x+(i?7:-7),-32+Math.sin(t*12+i)*4]],hi,2);}break;
  case 'goldring':v146Ring(c,0,-14,17,col,1);v146Ring(c,0,-14,13,hi,1);v146Path(c,[[-5,-30],[0,-36],[5,-30],[0,-25]],'#edfbff',1,true,'#73c5d6');break;
  case 'sapling':v146Path(c,[[0,2],[0,-30]],col,2);for(let i=0;i<4;i++)v146Feather(c,(i%2?1:-1)*6,-8-i*6,i%2?-.8:.8,col);v146Glow(c,0,-18,12,col,.2);break;
  case 'phoenix':v146Bird(c,0,-12-t*18,t,'#fff0bc',1.5);v146Tex(c,'sanctuaria_angel_wing_up.bmp',0,-24,54,33,.5);v146Path(c,[[0,-35],[0,5],[-7,-20],[7,-20]],hi,1.5);break;
  default:v146Main(c,p,u,t,28,'hit');
 }
 v146Detail(c,p,u,t);c.restore();
}
function v146OrdinaryEmit(id,x,y){
 const p=V146_SKILL_ART[id],actor=G?.pl;if(!p||!actor||G.dead)return;
 const s=actor.v138;if(s&&v146Profile(s,id))return;
 const q=actor.v146Ordinary||(actor.v146Ordinary={items:[],last:{}}),time=G.t;
 if(time-(q.last[id]??-1e9)<.09)return;q.last[id]=time;
 q.items=q.items.filter(e=>time<e.start+e.life);if(q.items.length>=24)q.items.shift();
 q.items.push({p,x,y,start:time,life:1.15,self:V146_SELF_ART.has(id)});
 v146Record(p,'ordinary');
}
// Preserve roFxContext's source skill when older implementations call a shared
// profile (e.g. all songs used bw_song), so a war drum cannot become a harp.
const v146OrdinaryRoBefore=roFxAdd;
roFxAdd=function(id,x,y,options){
 if(id.startsWith('v146:'))return v146OrdinaryRoBefore.apply(this,arguments);
 const source=roFxContext?.id,actual=V146_SKILL_ART[source]?source:id;
 if(V146_SKILL_ART[actual]){v146OrdinaryEmit(actual,x,y);return;}
 return v146OrdinaryRoBefore.apply(this,arguments);
};
const v146OrdinaryCastBefore=castSkill;
castSkill=function(g,...args){
 const r=v146OrdinaryCastBefore.call(this,g,...args);
 if(r&&V146_SKILL_ART[g.id]){const p=V146_SELF_ART.has(g.id)?G.pl:(G.pl.tgt||G.pl);v146OrdinaryEmit(g.id,p.x,p.y);}
 return r;
};
const v146OrdinaryTopBefore=drawFxTop;
drawFxTop=function(c,...args){
 const r=v146OrdinaryTopBefore.call(this,c,...args),q=G?.pl?.v146Ordinary;
 if(G.pl&&!G.dead)for(const id of ['sw_berserk','th_dual'])if(G.pl.sus?.[id]){
  c.save();c.translate(G.pl.x,G.pl.y-2);c.scale(.5,.5);v146OrdinaryDraw(c,V146_SKILL_ART[id],.3+(G.t%1)*.4,1.15);c.restore();
 }
 if(q&&!G.dead){q.items=q.items.filter(e=>G.t<e.start+e.life);for(const e of q.items){const p=e.self?G.pl:e;c.save();c.translate(p.x,p.y-3);v146OrdinaryDraw(c,e.p,G.t-e.start,e.life);c.restore();if(V146.audit)V146.ordinaryDraws=(V146.ordinaryDraws||0)+1;}}
 return r;
};
const v146SpiritBefore=drawSpirit;
drawSpirit=function(c,m,...args){
 const id=activeGems().find(g=>g.u===m.g)?.id;
 if(id==='mg_spirits'){
  const el={brn:'fire',chl:'water',shk:'wind'}[m.el]||'fire',kind={fire:'ifrit',water:'strouf',wind:'ghost'}[el];
  if(v146Sprite(c,kind,m.x,m.y,G.t,el==='water'?32:28,!!m.tgt,1,el)){
   const col={fire:'#ffc07a',water:'#b8f5ff',wind:'#cbbaff'}[el];v146Ring(c,m.x,m.y,9,col,.45,.5);
   if(el==='water')v146Star(c,m.x+11,m.y-23,3,col,G.t);else if(el==='wind')v146Feather(c,m.x+11,m.y-23,.4,col);return;
  }
 }else if(id==='bw_bsong'||id==='dc_partner'){
  if(v146Sprite(c,id==='dc_partner'?'thief':'archer',m.x,m.y,G.t,29,!!m.tgt,.8)){if(id==='dc_partner')v146Heart(c,m.x+10,m.y-25,4,'#efb1d0');else v146Note(c,m.x+10,m.y-25,0,'#a9f4dc');return;}
 }
 return v146SpiritBefore.call(this,c,m,...args);
};

// Draw persistent shapes on their own real zone/summon entities. Wrapping a
// lob's existing end callback changes only the resulting zone's renderer.
for(const kind of ['gravity','basil','plant','cultiv','firebomb']){
 const previous=V6_CAST[kind];
 V6_CAST[kind]=function(c){
  const before=new Set(v6G().ents),target=kind==='basil'?c.p:(c.tgt||c.p),x0=target.x,y0=target.y;
  const result=previous.apply(this,arguments),fresh=v6G().ents.filter(e=>!before.has(e));
  fresh.forEach((e,i)=>{
   if(kind==='firebomb'&&e.end){const end=e.end;e.end=function(){const old=new Set(v6G().ents),r=end.apply(this,arguments);for(const zone of v6G().ents)if(!old.has(zone)&&zone.zone){zone.v146Detail='firebomb';zone.gdraw=(z,cx)=>v146ElementField(cx,x0,y0,20*c.n,'fire',z.t);}return r;};return;}
   if(kind==='gravity'||kind==='basil'){
    if(!e.zone)return;const id=kind==='gravity'?'mg_gravity':'ac_basil',profile=V146_SKILL_ART[id],x=e.x??x0,y=e.y??y0;
    e.v146Detail=kind;e.gdraw=(z,cx)=>{cx.save();cx.translate(x,y-3);cx.globalAlpha=.8;v146Main(cx,profile,.4,z.t,25,'field');v146Detail(cx,profile,.4,z.t);cx.restore();};
   }else if(e.k==='plant'){
    const n=3+(c.m.minion||0),a=6.283*i/n,[x,y]=kind==='plant'?v6Clamp(x0+Math.cos(a)*14,y0+Math.sin(a)*9):[e.x,e.y];
    const herb=kind==='cultiv'&&!!e.tick;e.v146Detail=herb?'herb':kind==='cultiv'?'mushroom':'carnivorousPlant';
    e.draw=(z,cx)=>{
     cx.save();cx.translate(x,y);const pulse=Math.sin(z.t*7+i);
     if(kind==='plant'){
      v146Sprite(cx,'willow',0,0,z.t,23,true);v146Flower(cx,0,-20,6+Math.max(0,pulse),z.t*.2,'#df8699');
      v146Path(cx,[[-4,-20],[-2,-17],[0,-20],[2,-17],[4,-20]],'#fff0c3',1);
     }else if(herb){v146Path(cx,[[0,0],[0,-20]],'#81ba68',2);for(let j=0;j<4;j++)v146Feather(cx,(j%2?1:-1)*5,-5-j*4,j%2?-.8:.8,'#a7d97b');v146Flower(cx,0,-21,4,z.t*.2,'#fff0ba');}
     else{v146Path(cx,[[-3,0],[-3,-11],[3,-11],[3,0]],'#edd9b4',1,true,'#b5a17e');cx.fillStyle='#b85b75';cx.beginPath();cx.ellipse(0,-11,10+Math.max(0,pulse),7,0,Math.PI,0);cx.fill();for(let j=0;j<3;j++)v146Star(cx,(j-1)*5,-13-(j%2)*3,1.5,'#ffe5cd');}
     cx.restore();
    };
   }
  });return result;
 };
}

// Explain the existing renewal rule in both the talent atlas and the skill
// tooltip. This is documentation only: summon timing and strength are unchanged.
v143Talent('ro_mage_1',8,0,'靈王近衛',
 '「召喚元素精靈」改為靈王近衛；每隻傷害 250%，持續 8 秒，戰鬥中可自動續召。',null,
 '將「召喚元素精靈」放在技能盤上，不需要另一顆召喚技能。一般自動施放時，剩餘約 1 秒便允許續召；仍須冷卻完成、有存活敵人且能施放。再次施放會刷新全部近衛的時間。基礎每秒攻擊一次，保留召喚數量、攻速、暴擊與額外施放連結。若連結「自動念咒」等觸發輔助，需再次滿足該輔助的觸發條件；脫戰無目標時不會自動補召。');
