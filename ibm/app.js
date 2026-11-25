(() => {
  'use strict';
  const $=id=>document.getElementById(id),canvas=$('population'),ctx=canvas.getContext('2d');
  const embedded=new URLSearchParams(location.search).has('embedded');
  const initialSeed=20261102;
  const worker=new Worker(new URL('worker.js?v=5',document.currentScript.src),{type:'module'});
  const initialParameters={p:.1,competitionRadius:2.2,hoiRadius:.0625,dispersal:.15,birthRate:3.05,hoiStrength:0};
  const presets={
    'physica-d':{...initialParameters,p:128},
    'hoi-browser':{p:128,competitionRadius:1.25,hoiRadius:.0625,dispersal:.05,birthRate:50,hoiStrength:.025},
  };
  let parameters={...initialParameters};
  let state=null,ready=false,dirty=true,cssSize=400,parameterTimer=null,painting=false,lastPaint=0,cursor=null;
  const setStatus=(text,error=false)=>{$('status').textContent=text;$('status').classList.toggle('error',error);};
  const pFormat=p=>p<10?p.toFixed(2):p.toFixed(1);
  function kernelPreview(p,competitionRadius){
    // The horizontal axis is distance in model units, so choosing a new
    // radius changes the curve itself rather than rescaling the axis.
    const maxDistance=8;
    const points=[];
    for(let i=0;i<=200;i++){
      const fraction=i/200;
      const distance=maxDistance*fraction;
      const relativeWeight=Math.exp(-Math.pow(distance/competitionRadius,p));
      points.push(`${i?'L':'M'}${(300*fraction).toFixed(2)},${(55-50*relativeWeight).toFixed(2)}`);
    }
    $('kernel-curve').setAttribute('d',points.join(' '));
    $('exponent-value').value=pFormat(p);$('exponent').setAttribute('aria-valuetext',`p equals ${pFormat(p)}`);
    document.querySelectorAll('[data-exponent]').forEach(b=>b.setAttribute('aria-pressed',String(Math.abs(Number(b.dataset.exponent)-p)<.015)));
  }
  function send(type,extra={}){worker.postMessage({type,...extra});}
  function showParameters(){
    const {p,competitionRadius,hoiRadius,dispersal,birthRate,hoiStrength}=parameters;
    $('exponent').value=Math.log(p);
    $('competition-radius').value=competitionRadius;
    $('competition-radius-value').value=competitionRadius.toFixed(2);
    $('hoi-radius').value=hoiRadius;
    $('hoi-radius-value').value=hoiRadius.toFixed(4);
    $('hoi-strength').value=hoiStrength;
    $('hoi-strength-value').value=hoiStrength.toFixed(3);
    $('hoi-strength').setAttribute('aria-valuetext',hoiStrength===0?'0.000, pairwise competition only':hoiStrength.toFixed(3));
    $('dispersal').value=dispersal;
    $('dispersal-value').value=dispersal.toFixed(2);
    $('birth-rate').value=birthRate;
    const deathRate=.1*birthRate;
    $('birth-rate-value').value=birthRate.toFixed(3);
    $('death-rate-value').value=deathRate.toFixed(4);
    $('birth-rate').setAttribute('aria-valuetext',`Birth rate ${birthRate.toFixed(3)}, background death rate ${deathRate.toFixed(4)}`);
    kernelPreview(p,competitionRadius);
    document.querySelectorAll('[data-preset]').forEach(button=>{
      const preset=presets[button.dataset.preset];
      const matches=Object.keys(preset).every(key=>Math.abs(preset[key]-parameters[key])<1e-9);
      button.setAttribute('aria-pressed',String(matches));
    });
  }
  function applyPendingParameters(){
    if(parameterTimer===null)return;
    clearTimeout(parameterTimer);
    parameterTimer=null;
    send('parameters',parameters);
  }
  function updateParameter(name,value){
    parameters[name]=value;
    showParameters();
    clearTimeout(parameterTimer);
    parameterTimer=setTimeout(applyPendingParameters,100);
  }
  function readSeed(){
    const seed=Number($('seed').value);
    if(!Number.isInteger(seed)||seed<0||seed>4294967295){
      setStatus('Choose a whole-number seed from 0 to 4294967295.',true);
      return null;
    }
    return seed;
  }
  function reset(seed){
    clearTimeout(parameterTimer);
    parameterTimer=null;
    send('reset',{seed,...parameters});
    setStatus('');
  }
  $('exponent').addEventListener('input',()=>updateParameter('p',Math.max(.1,Math.min(128,Math.exp(Number($('exponent').value))))));
  document.querySelectorAll('[data-exponent]').forEach(button=>button.addEventListener('click',()=>updateParameter('p',Number(button.dataset.exponent))));
  document.querySelectorAll('[data-preset]').forEach(button=>button.addEventListener('click',()=>{
    const seed=readSeed();
    if(seed===null)return;
    parameters={...presets[button.dataset.preset]};
    showParameters();
    reset(seed);
  }));
  $('competition-radius').addEventListener('input',()=>updateParameter('competitionRadius',Number($('competition-radius').value)));
  $('hoi-radius').addEventListener('input',()=>updateParameter('hoiRadius',Number($('hoi-radius').value)));
  $('dispersal').addEventListener('input',()=>updateParameter('dispersal',Number($('dispersal').value)));
  $('birth-rate').addEventListener('input',()=>updateParameter('birthRate',Number($('birth-rate').value)));
  $('hoi-strength').addEventListener('input',()=>updateParameter('hoiStrength',Number($('hoi-strength').value)));
  $('speed').addEventListener('input',()=>{$('speed-value').value=`${$('speed').value}×`;send('speed',{value:Number($('speed').value)});});
  $('play').addEventListener('click',()=>{applyPendingParameters();send(state?.running?'pause':'play');setStatus('');});
  $('step').addEventListener('click',()=>{applyPendingParameters();send('step',{dt:1});setStatus('');});
  $('reset').addEventListener('click',()=>{const seed=readSeed();if(seed!==null)reset(seed);});
  $('new-seed').addEventListener('click',()=>{const seed=crypto.getRandomValues(new Uint32Array(1))[0];$('seed').value=seed;reset(seed);});
  $('clear').addEventListener('click',()=>{send('clear');setStatus('Add a patch, then press Play.');});
  $('seed').addEventListener('keydown',e=>{if(e.key==='Enter')$('reset').click();});
  function enableControls(){
    ['play','step','reset','new-seed','clear'].forEach(id=>$(id).disabled=false);
    document.querySelectorAll('[data-preset]').forEach(button=>button.disabled=false);
  }
  worker.onmessage=({data:s})=>{
    if(s.type==='ready'){ready=true;enableControls();send('speed',{value:Number($('speed').value)});setStatus('Choose a preset, or press Play.');return;}
    if(s.type==='error'){if(state)state.running=false;$('play').textContent='Play';setStatus(s.message,true);return;}
    if(s.type!=='state')return;
    state=s;dirty=true;
    $('population-count').textContent=s.n.toLocaleString('en');$('model-time').textContent=s.t.toFixed(1);
    $('pace-label').textContent=s.running?'Model units / second':'Paused';$('measured-pace').textContent=s.running?(s.stepsPerSecond>0?s.stepsPerSecond.toFixed(1):'…'):'—';
    $('play').textContent=s.running?'Pause':'Play';$('play').setAttribute('aria-pressed',String(s.running));$('step').disabled=!ready||s.running;
    if(s.n===0)setStatus('The canvas is empty. Add a patch to start a population.');
  };
  worker.onerror=()=>setStatus('The model could not start. Please reload the page.',true);
  const sprite=document.createElement('canvas');sprite.width=sprite.height=64;const sc=sprite.getContext('2d');
  const gradient=sc.createRadialGradient(32,32,0,32,32,31);gradient.addColorStop(0,'rgba(36,88,75,.56)');gradient.addColorStop(.35,'rgba(36,88,75,.32)');gradient.addColorStop(.75,'rgba(36,88,75,.08)');gradient.addColorStop(1,'rgba(36,88,75,0)');sc.fillStyle=gradient;sc.fillRect(0,0,64,64);
  function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);cssSize=r.width;canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);dirty=true;}
  new ResizeObserver(resize).observe(canvas);resize();
  function draw(){
    if(dirty){
      ctx.clearRect(0,0,cssSize,cssSize);
      if(state){const r=Math.max(3.2,cssSize*.009),size=2*r,xy=state.positions;
        for(let i=0;i<xy.length;i+=2){const x=xy[i]/20*cssSize,y=(1-xy[i+1]/20)*cssSize;ctx.drawImage(sprite,x-r,y-r,size,size);
          // Copies only the visible edge of the same individual across the periodic seam.
          if(x<r)ctx.drawImage(sprite,x+cssSize-r,y-r,size,size);else if(x>cssSize-r)ctx.drawImage(sprite,x-cssSize-r,y-r,size,size);
          if(y<r)ctx.drawImage(sprite,x-r,y+cssSize-r,size,size);else if(y>cssSize-r)ctx.drawImage(sprite,x-r,y-cssSize-r,size,size);
        }
      }
      if(cursor){ctx.strokeStyle='#24584b';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cursor.x/20*cssSize,(1-cursor.y/20)*cssSize,7,0,2*Math.PI);ctx.stroke();}
      dirty=false;
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
  function point(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*20,y:(1-(e.clientY-r.top)/r.height)*20};}
  function addAt(p){if(!ready)return;send('add',{x:p.x,y:p.y,count:12,radius:.22});setStatus('');}
  canvas.addEventListener('pointerdown',e=>{e.preventDefault();canvas.focus();canvas.setPointerCapture(e.pointerId);painting=true;lastPaint=performance.now();cursor=null;addAt(point(e));});
  canvas.addEventListener('pointermove',e=>{if(painting&&performance.now()-lastPaint>80){lastPaint=performance.now();addAt(point(e));}});
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>canvas.addEventListener(type,()=>painting=false));
  canvas.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' '].includes(e.key))return;e.preventDefault();cursor??={x:10,y:10};
    const delta=e.shiftKey?2:.5;if(e.key==='ArrowLeft')cursor.x-=delta;if(e.key==='ArrowRight')cursor.x+=delta;if(e.key==='ArrowUp')cursor.y+=delta;if(e.key==='ArrowDown')cursor.y-=delta;
    cursor.x=(cursor.x+20)%20;cursor.y=(cursor.y+20)%20;if(e.key==='Enter'||e.key===' ')addAt(cursor);dirty=true;
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)send('pause');});
  window.addEventListener('message',event=>{if(event.origin===location.origin&&event.source===parent&&event.data?.type==='ibm-pilot:pause')send('pause');});
  window.addEventListener('pagehide',event=>{if(event.persisted)send('pause');else worker.terminate();});
  window.addEventListener('pageshow',event=>{if(event.persisted)send('pause');});
  if(embedded){const report=()=>parent.postMessage({type:'ibm-pilot:resize',height:Math.ceil(document.body.getBoundingClientRect().height)},location.origin);new ResizeObserver(report).observe(document.body);}
  showParameters();
  send('init',{seed:initialSeed,...parameters,autoplay:false});
})();
