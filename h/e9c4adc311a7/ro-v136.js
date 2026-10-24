/* 流浪仙境 v1.3.7 — 排行人物原尺寸像素繪製與自己的名次標示。 */
"use strict";
function v136OwnRows(html) {
  // Existing rank renderers compare immutable character IDs, never names.
  return html.replace(/<button\b([^>]*\bclass="[^"]*\bv6rk-row\b[^"]*"[^>]*)>([\s\S]*?)<\/button>/g,(whole,attrs,body)=>{
    const classes=/\bclass="([^"]*)"/.exec(attrs)?.[1].split(/\s+/)||[];
    if(!classes.includes('me')||body.includes('v136-self'))return whole;
    return `<button${attrs} aria-current="true">${body.replace('</b>','</b><span class="v136-self">自己</span>')}</button>`;
  });
}
function v136Install() {
  if(v136Install.done)return;v136Install.done=true;
  const character=v1216CharDef;
  v1216CharDef=function(look) {
    if(look&&!RO.assets?.characters?.[look.sp]) {
      const base={sword:'swordsman',bow:'archer',mage:'mage',thief:'thief',acolyte:'acolyte',merchant:'merchant'}[look.cls];
      if(base)look={...look,sp:base+(look.sex==='f'?'_f':'')};
    }
    return character(look);
  };
  const html=v1216Html;
  v1216Html=function(look,opt={}) {
    return html(look,opt).replace(/width="\d+" height="\d+"/,'width="160" height="140" role="img" aria-label="角色與出戰寵物外觀"');
  };
  v1216Paint=function(cv) {
    if(!cv?.isConnected)return;
    let look;try{look=JSON.parse(cv.dataset.look||'null');}catch{return;}
    if(!look)return;
    // Integer backing scale retains source pixels on ordinary and HiDPI screens.
    // Do not first shrink the sprite to 62%, which discarded face/armor details.
    const scale=Math.max(1,Math.min(4,Math.ceil(window.devicePixelRatio||1)));
    const W=160,H=140;
    cv.style.width=W+'px';cv.style.height=H+'px';
    if(cv.width!==W*scale)cv.width=W*scale;
    if(cv.height!==H*scale)cv.height=H*scale;
    const c=cv.getContext('2d');if(!c)return;
    c.setTransform(scale,0,0,scale,0,0);c.clearRect(0,0,W,H);c.imageSmoothingEnabled=false;
    const redraw=()=>v1216Paint(cv),floor=126;
    const shadow=(x,r)=>{c.fillStyle='rgba(0,0,0,.16)';c.beginPath();c.ellipse(x,floor,r,4,0,0,Math.PI*2);c.fill();};
    const def=v1216CharDef(look);
    if(def) {
      const im=v1216Img(def.file,redraw);
      if(im) {
        const anchor=def.anchor||[def.frameWidth/2,def.frameHeight];
        shadow(55,20);
        c.drawImage(im,def.ox||0,def.oy||0,def.frameWidth,def.frameHeight,Math.round(55-anchor[0]),Math.round(floor-anchor[1]),def.frameWidth,def.frameHeight);
      }
    }
    const pk=look.pet?.k,d=pk&&V1215_SPR[pk];
    if(d) {
      const im=v1216Img(d.file,redraw),f=d.states.idle;
      if(im&&f) {
        const anchor=f.anchor||[f.frameWidth/2,f.frameHeight];
        const k=Math.min(.9,v1215Scale(pk)*2.2,65/f.frameWidth,95/f.frameHeight);
        const w=Math.round(f.frameWidth*k*scale)/scale,h=Math.round(f.frameHeight*k*scale)/scale;
        shadow(121,11);
        c.drawImage(im,f.ox||0,f.oy||0,f.frameWidth,f.frameHeight,Math.round((121-anchor[0]*k)*scale)/scale,Math.round((floor-anchor[1]*k)*scale)/scale,w,h);
      }
    }
  };
  for(const key of ['m_orank','m_prank']) {
    const render=ui[key];if(render)ui[key]=function(...a){return v136OwnRows(render.apply(this,a));};
  }
  const css=document.createElement('style');
  css.textContent=`
    .v1216look .v1216cv{width:160px;height:140px;image-rendering:pixelated;max-width:none}
    .v1216look{align-items:center;flex-wrap:wrap}.v1216look .v1216pet{flex:1;min-width:100px}
    .v6rk-list .v6rk-row.me{outline:0!important;box-shadow:inset 0 0 0 2px #a86c21,0 1px 4px #6a451326!important;background:linear-gradient(100deg,#fff1cb,#fff8e7)!important;border-color:#a86c21!important}
    .v6rk-list .v6rk-row.me:hover{background:#ffeabc!important}
    .v6rk-list .v6rk-row.me:focus-visible{outline:2px solid #37665b!important;outline-offset:2px}
    .v136-self{display:inline-block;margin-left:7px;padding:1px 6px;border-radius:3px;background:#875217;color:#fff8e5;font-size:10px;font-weight:700;line-height:1.6;vertical-align:middle;white-space:nowrap}
  `;
  document.head.appendChild(css);
  window.addEventListener('resize',()=>v1216PaintAll(document));
}
v136Install();
