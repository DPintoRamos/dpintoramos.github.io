import {encodeOptions} from './visualpde/sim/scripts/RD/url_codec.js';
import {getResolvedPreset} from './visualpde/sim/scripts/RD/presets.js';
const $=id=>document.getElementById(id);
const embedded=new URLSearchParams(location.search).get('embedded')==='1'&&window.parent!==window;
const panels=['patterns','homogeneous'];
const frames=Object.fromEntries(panels.map(id=>[id,$(id)]));
const controls={alpha:{min:0,max:0.6,initial:0.15,digits:2},eta:{min:-0.05,max:0.06,initial:0.035,digits:3}};
const queuedParameters=new Map();
let generation=0, running=false, pending=null, requestId=0, ready=new Set(), configs={}, fieldHeight=420, watchdog;
function notify(type,extra={}){if(embedded)window.parent.postMessage({type:'research-lab:'+type,...extra},location.origin);}
function reportSize(){notify('resize',{height:Math.ceil(document.querySelector('main').getBoundingClientRect().height)+2});}
function fit(){
  document.querySelector('.comparison').style.maxWidth=(matchMedia('(max-width:650px)').matches?2*fieldHeight:4*fieldHeight+28)+'px';
  panels.forEach(id=>{const width=frames[id].parentElement.clientWidth;frames[id].style.width='640px';frames[id].style.height='320px';frames[id].style.transform=`scale(${width/640})`;});
  reportSize();
}
new ResizeObserver(fit).observe(document.querySelector('.comparison'));
new ResizeObserver(reportSize).observe(document.querySelector('main'));
window.addEventListener('resize',fit);document.fonts.ready.then(fit);
function send(id,type,extra={}){frames[id].contentWindow?.postMessage({type,...extra},location.origin);}
function applySharedParameters(){
  if(!queuedParameters.size||pending||ready.size!==2)return;
  const updates=[...queuedParameters];queuedParameters.clear();
  panels.forEach(id=>{
    updates.forEach(([name,value])=>{
      configs[id].kineticParams=configs[id].kineticParams.replace(new RegExp(`(^|;)\\s*${name}\\s*=\\s*[^;]+`),(_,prefix)=>`${prefix} ${name}=${value}`);
    });
    send(id,'updateParam',{name:updates.map(([name])=>name),value:updates.map(([,value])=>value)});
  });
  updates.forEach(([name,value])=>$(name+'-value').textContent=value.toFixed(controls[name].digits));
}
function pause(){running=false;$('play').textContent='Play both';}
function fail(message){pause();$('loading').hidden=false;$('loading').textContent=message;}
function step(){
  if(!running||pending||ready.size!==2)return;
  applySharedParameters();
  pending={id:++requestId,done:new Map()};
  watchdog=setTimeout(()=>fail('One model stopped responding. Reset both to restart the comparison.'),20000);
  panels.forEach(id=>send(id,'researchStep',{steps:200,requestId:pending.id}));
}
function play(){if(ready.size!==2)return;running=true;$('play').textContent='Pause both';step();}
async function load(){
  pause();clearTimeout(watchdog);pending=null;queuedParameters.clear();ready.clear();const token=++generation;
  Object.entries(controls).forEach(([name,control])=>{$(name).disabled=true;$(name).value=String(control.initial);$(name+'-value').textContent=control.initial.toFixed(control.digits);});
  $('play').disabled=true;$('loading').hidden=false;$('loading').textContent='Preparing both models…';$('clock').textContent='t = 0';
  const presets=await Promise.all(panels.map(async id=>{const response=await fetch(`presets/pnas-${id}.json?v=5`);if(!response.ok)throw new Error('Could not load the comparison.');return response.json();}));
  if(token!==generation)return;
  panels.forEach((id,i)=>{
    configs[id]={...getResolvedPreset('default'),...presets[i],runningOnLoad:false,brushEnabled:true};
    $(id+'-mean').textContent='—';
    frames[id].src=`visualpde/sim/index.html?clean&research=7&iframeID=${token}-${id}#options=${encodeOptions(configs[id])}`;
  });
  const nx=Math.floor(Number(configs.patterns.domainScale)/Number(configs.patterns.spatialStep));
  $('numerics').textContent=`Grid: ${nx} × ${nx/2}, Δx = Δy = ${configs.patterns.spatialStep}. Explicit Euler, Δt = ${configs.patterns.dt}. Both panels advance in synchronised batches of 200 steps.`;
  fit();
}
window.addEventListener('message',event=>{
  if(event.origin!==location.origin)return;
  if(embedded&&event.source===window.parent){
    if(event.data?.type==='research-lab:play')play();
    if(event.data?.type==='research-lab:pause')pause();
    if(event.data?.type==='research-lab:viewport'&&Number.isFinite(event.data.fieldHeight)){fieldHeight=Math.max(140,Math.min(520,event.data.fieldHeight));fit();}
    return;
  }
  const id=panels.find(key=>frames[key].contentWindow===event.source);
  if(!id||event.data?.id!==`${generation}-${id}`)return;
  if(event.data.type==='probeData'){
    const last=event.data.data?.at(-1);if(!last)return;
    if(!Number.isFinite(last.y)){fail('The numerical solution became unstable. Reset both models.');return;}
    $(id+'-mean').textContent=last.y.toFixed(5);
  }
  if(event.data.type==='research:ready'){
    const wasReady=ready.size===2;ready.add(id);
    if(!wasReady&&ready.size===2){$('loading').hidden=true;$('play').disabled=false;Object.keys(controls).forEach(name=>$(name).disabled=false);notify('ready');}
  }
  if(event.data.type==='research-step:done'&&pending&&event.data.requestId===pending.id){
    pending.done.set(id,event.data.time);
    if(pending.done.size===2){
      clearTimeout(watchdog);const [a,b]=panels.map(key=>pending.done.get(key));pending=null;
      if(!Number.isFinite(a)||Math.abs(a-b)>1e-8){console.error('PNAS clock mismatch',{patterns:a,homogeneous:b,requestId:event.data.requestId});fail('The model clocks diverged. Reset both models.');return;}
      $('clock').textContent=`t = ${a.toFixed(1)}`;applySharedParameters();requestAnimationFrame(step);
    }
  }
});
$('play').addEventListener('click',()=>running?pause():play());$('reset').addEventListener('click',()=>load().catch(e=>fail(e.message)));
Object.entries(controls).forEach(([name,control])=>$(name).addEventListener('input',()=>{
  const value=Number($(name).value);
  if(!Number.isFinite(value)||value<control.min||value>control.max)return;
  queuedParameters.set(name,value);applySharedParameters();
}));
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
load().catch(e=>fail(e.message));
