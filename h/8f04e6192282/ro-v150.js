/* v1.5.0 — RO sprite bodies, restrained spell lighting. Presentation only. */
'use strict';
const v150PreloadBefore=v146Preload;
v146Preload=function(){
 v150PreloadBefore();
 for(const state of ['idle','attack'])v146Img(RO.assets.monsters.dimik?.states?.[state]?.file);
};
v146Preload();

// Keep the original ACT animation, palette and silhouette. Scale from a fixed
// idle height, so flame/attack frames do not stretch the body every frame.
const V150_METRICS=new WeakMap();
function v150Sprite(c,kind,time,height,attack=false){
 const states=RO.assets.monsters[kind]?.states,idle=states?.idle,def=states?.[attack?'attack':'idle']||idle;
 if(!idle||!def)return false;
 const im=v146Img(def.file);if(!im)return false;
 let metrics=V150_METRICS.get(idle);
 if(!metrics){
  const bounds=idle.frameBounds||[[0,0,idle.frameWidth,idle.frameHeight]];
  const top=Math.min(...bounds.map(b=>b[1])),bottom=Math.max(...bounds.map(b=>b[3]));
  metrics={height:Math.max(1,bottom-top),footOffset:(idle.anchor?.[1]??bottom)-bottom};V150_METRICS.set(idle,metrics);
 }
 let ms=((time*1000)%def.durations.reduce((a,b)=>a+b,0)+def.durations.reduce((a,b)=>a+b,0))%def.durations.reduce((a,b)=>a+b,0),frame=0;
 while(frame<def.frames-1&&ms>=def.durations[frame])ms-=def.durations[frame++];
 const scale=height/metrics.height,anchor=def.anchor||[def.frameWidth/2,def.frameHeight];
 c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
 c.drawImage(im,(def.ox||0)+frame*def.frameWidth,def.oy||0,def.frameWidth,def.frameHeight,-anchor[0]*scale,-(anchor[1]-metrics.footOffset)*scale,def.frameWidth*scale,def.frameHeight*scale);
 c.restore();return true;
}

// v149's formation, compact scale and player-occlusion clipping stay in place.
// Replace its new cartoon faces with the project's actual RO monster sprites.
v149Familiar=function(c,element,time,pulse=false){
 const el=({fire:{kind:'ifrit',color:'#d99a58',texture:'fire_blast.bmp'},water:{kind:'strouf',color:'#8cb9cb',texture:'freeze_ice.bmp'},wind:{kind:'ghost',color:'#c6bcdf',texture:'light_bang_a.bmp'}})[element]||{kind:'ghost',color:'#c6bcdf',texture:'light_bang_a.bmp'};
 c.save();
 // Accent stays behind the body and never replaces its face or outline.
 if(pulse)v146Tex(c,el.texture,0,-10,15,20,.28);
 v146Glow(c,0,-7,8,el.color,.09);
 if(!v150Sprite(c,el.kind,time,26,pulse)){
  // Cold-cache frame: reuse the original element texture, not another avatar.
  v146Tex(c,el.texture,0,-10,12,18,.4);
 }
 if(element==='wind'&&pulse)v146Path(c,[[-7,-3],[-2,-5],[5,-4],[8,-7]],el.color,.6);
 c.restore();
};
// Dimik is the existing RO mechanical monster, used as a prototype, not claimed
// to be an original FAW model. Small gun fittings distinguish the firing modes.
v149Cannon=function(c,time,pulse,mode){
 c.save();v150Sprite(c,'dimik',time,25,pulse);
 const recoil=pulse?1.2:0;
 for(const y of mode===1?[-12,-8]:[-10]){
  const end=(mode===2?15:12)-recoil;
  v146Path(c,[[3-recoil,y-1.2],[end,y-1.2],[end,y+1.2],[3-recoil,y+1.2]],'#554d43',.65,true,'#817a6c');
  v146Path(c,[[4-recoil,y-.6],[end-1,y-.6]],'#c7b99b',.45);
  if(pulse)v146Tex(c,'fire_blast.bmp',end+2,y,8,7,.5);
 }
 c.restore();
};

// The original palette replaces the white candy-like facet on every
// polygon. Per-skill geometry, trajectories and original effect textures remain.
v146Path=function(c,points,color,width=1,closed=false,fill=false){
 c.save();c.beginPath();points.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));if(closed)c.closePath();
 c.lineJoin='round';c.lineCap='round';c.strokeStyle=color;c.lineWidth=Math.max(.4,width*.85);
 if(fill){c.fillStyle=fill===true?color:fill;c.fill();}
 c.stroke();c.restore();
};
// Keep a fine luminous edge, with a short translucent trail instead of a broad
// white crescent. Skill recipes still choose their own blades and trajectories.
v146Blade=function(c,x,y,angle,len,color,accent){
 c.save();c.translate(x,y);c.rotate(angle);
 c.save();c.globalAlpha*=.2;c.fillStyle=color;c.beginPath();c.moveTo(-len*.5,2);c.quadraticCurveTo(0,-len*.12,len*.6,0);c.quadraticCurveTo(0,-len*.04,-len*.5,2);c.fill();c.restore();
 v146Path(c,[[-len*.45,0],[len*.34,-1.2],[len*.6,0],[len*.34,1.2]],color,.65,true,accent);
 v146Path(c,[[-len*.4,0],[len*.5,0]],'#eee2c7',.4);v146Path(c,[[-len*.45,-2.5],[-len*.45,2.5]],color,1.3);c.restore();
};

// The formation burst must match the new RO bodies too: the former floating
// blue boxes otherwise appeared on top of the actual Dimik summons.
const v150MainBefore=v146Main;
v146Main=function(c,p,t,age,span,phase){
 if(p.motif!=='turrets'&&p.motif!=='cannon')return v150MainBefore.apply(this,arguments);
 c.save();
 if(p.motif==='turrets'){
  for(let i=0;i<4;i++){
   const angle=i*Math.PI/2+age*.35,x=Math.cos(angle)*24,y=Math.sin(angle)*11;
   c.save();c.translate(x,y);c.globalAlpha*=.65;
   v146Gear(c,0,0,6,'#b7a17d',age+i);v146Tex(c,'smoke2.bmp',0,-5,15,16,.28);
   if(phase!=='cast')v146Tex(c,'fire_blast.bmp',4,-6,10,13,.45);
   c.restore();
  }
 }else{
  c.translate(-4,4);c.scale(.85,.85);v149Cannon(c,age,phase!=='cast',2);
  if(phase!=='cast')v146Tex(c,'smoke2.bmp',18,-9,17,14,.35);
 }
 c.restore();
};
