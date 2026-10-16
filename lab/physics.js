import {encodeOptions} from './visualpde/sim/scripts/RD/url_codec.js';
import {getResolvedPreset} from './visualpde/sim/scripts/RD/presets.js?gaussian=2';
import prl from './models/prl.js';
import noise from './models/noise.js?copy=1';
import gl from './models/gl.js';
import {createPhaseMap} from './prl-phase-map.js';

const definitions={prl,noise,gl};
const $=id=>document.getElementById(id);
const embedded=new URLSearchParams(location.search).get('embedded')==='1'&&window.parent!==window;
const iframe=$('simulation');
let active='prl',configuration,ready=false,running=false,generation=0,drawing=false,resumeWhenReady=false,watchdog,lastProbe;
let fieldHeight=Math.min(480,window.innerHeight*.52);
let phaseMap,phaseMapPromise;
const model=()=>definitions[active];
function notify(type,extra={}){if(embedded)window.parent.postMessage({type:'research-lab:'+type,...extra},location.origin);}
function send(type,extra={}){iframe.contentWindow?.postMessage({type,...extra},location.origin);}
function reportSize(){notify('resize',{height:Math.ceil(document.querySelector('main').getBoundingClientRect().height)+2});}
function fit(){
  const m=model(),maxWidth=fieldHeight*m.width/m.height;
  document.documentElement.style.setProperty('--field-height',fieldHeight+'px');
  $('simulation-shell').style.maxWidth=maxWidth+'px';
  document.querySelector('.field-footer').style.maxWidth=maxWidth+'px';
  const scale=$('simulation-shell').clientWidth/m.width;
  iframe.style.width=m.width+'px';iframe.style.height=m.height+'px';iframe.style.transform=`scale(${scale})`;
  $('simulation-shell').style.height=m.height*scale+'px';
  reportSize();
}
new ResizeObserver(fit).observe($('simulation-shell'));
new ResizeObserver(reportSize).observe(document.querySelector('main'));
document.fonts.ready.then(fit);
window.addEventListener('resize',()=>{if(!embedded)fieldHeight=Math.min(480,window.innerHeight*.52);fit();});
function showRunning(value){running=value;$('play').textContent=value?'Pause':'Play';}
function valuesFromParams(){return Object.fromEntries(configuration.kineticParams.split(';').map(x=>x.trim()).filter(Boolean).map(x=>{const [name,value]=x.split('=');return [name.trim(),parseFloat(value)];}));}
function format(value,control){const digits=control.digits??Math.min(5,Math.max(2,(String(control.step).split('.')[1]||'').length));return Number(value).toFixed(digits);}
function updateEditorLink(){if(configuration)$('editor-link').href=`editor.html?width=${model().width}&height=${model().height}#options=${encodeOptions({...configuration,runningOnLoad:false})}`;}
function replaceParameter(name,value){
  configuration.kineticParams=configuration.kineticParams.replace(new RegExp('(^|;)\\s*'+name+'\\s*=\\s*([^;]+)'),(_,prefix,previous)=>`${prefix} ${name}=${value}${previous.match(/\s+in\s+\[[^\]]+\]/)?.[0]||''}`);
}
function syncPhaseMap(){if(active==='prl'&&configuration)phaseMap?.setParameters(valuesFromParams());}
async function ensurePhaseMap(){
  phaseMapPromise??=createPhaseMap($('phase-map'),{onSelect:parameters=>{
    if(active!=='prl')return;
    $('regime').value='prl-seed';resumeWhenReady=true;
    loadRegime({parameterValues:parameters}).catch(showError);
  }}).then(map=>{phaseMap=map;syncPhaseMap();reportSize();});
  await phaseMapPromise;
}
function updateParameter(name,value){
  const control=model().controls.find(c=>c.name===name);
  if(!control||!Number.isFinite(value)||value<control.min||value>control.max)return;
  replaceParameter(name,value);
  send('updateParam',{name,value});
  const input=document.querySelector(`input[data-parameter="${name}"]`);
  if(input){input.value=value;$(name+'-value').textContent=format(value,control);}
  updateEditorLink();syncPhaseMap();
}
function markReady(){
  if(ready)return;
  ready=true;clearTimeout(watchdog);$('loading').hidden=true;$('play').disabled=false;
  if(lastProbe){$('clock').textContent=`t = ${lastProbe.x.toFixed(1)}`;$('mean').textContent=`${model().metricLabel} ${lastProbe.y.toFixed(3)}`;}
  document.querySelectorAll('[data-parameter]').forEach(input=>input.disabled=false);
  notify('ready',{autoplay:!drawing});
  if(resumeWhenReady&&!drawing){resumeWhenReady=false;send('playSim');showRunning(true);}
}
function showError(error){clearTimeout(watchdog);send('pauseSim');showRunning(false);$('loading').hidden=false;$('loading').textContent=error.message||String(error);}
async function loadRegime({blank=false,keepParameters=false,parameterValues={}}={}){
  const token=++generation,previousParams=configuration?.kineticParams;
  ready=false;lastProbe=null;drawing=blank;showRunning(false);$('play').disabled=true;
  clearTimeout(watchdog);$('loading').hidden=false;$('loading').textContent='Preparing the model…';
  $('clock').textContent='t = 0';$('mean').textContent=model().metricLabel+' —';
  const selected=$('regime').value,response=await fetch(`presets/${selected}.json`);
  if(!response.ok)throw new Error('Could not load this model.');
  const delta=await response.json();if(token!==generation)return;
  configuration={...getResolvedPreset('default'),...delta,runningOnLoad:false};
  if(keepParameters&&previousParams)configuration.kineticParams=previousParams;
  for(const [name,value] of Object.entries(parameterValues)){
    const control=model().controls.find(c=>c.name===name);
    if(control&&Number.isFinite(value)&&value>=control.min&&value<=control.max)replaceParameter(name,value);
  }
  if(blank){
    for(let i=1;i<=configuration.numSpecies;i++)configuration['initCond_'+i]=model().blankInitial?.[i-1]??'0';
    configuration.resetOnImageLoad=false;
    if(model().brushRadius)configuration.brushRadius=String(model().brushRadius);
  }
  $('blank').textContent=blank?'Clear canvas':'Blank canvas';$('blank').setAttribute('aria-pressed',String(blank));
  $('try-note').textContent=blank?(model().blankNote||'Draw an initial perturbation, then press Play. Reset restores the selected experiment.'):model().tryNote;
  const values=valuesFromParams();
  $('controls').innerHTML=model().controls.map(c=>`<div class="control"><label for="control-${c.name}">${c.label}<output id="${c.name}-value">${format(values[c.name],c)}</output></label><input id="control-${c.name}" type="range" data-parameter="${c.name}" aria-label="${c.label}" min="${c.min}" max="${c.max}" step="${c.step}" value="${values[c.name]}" disabled><small>${c.note}</small></div>`).join('');
  document.querySelectorAll('[data-parameter]').forEach(input=>input.addEventListener('input',()=>updateParameter(input.dataset.parameter,Number(input.value))));
  const views=configuration.views||[];
  $('view-controls').hidden=views.length<2;
  $('view').innerHTML=views.map((view,index)=>`<option value="${index}">${view.name}</option>`).join('');
  $('view').value=String(configuration.activeViewInd||0);
  $('preset-link').href=`presets/${selected}.json`;$('provenance-link').href=`assets/${model().provenance}`;
  iframe.src=`visualpde/sim/index.html?clean&research=10${active==='prl'?'&colourbar=true':''}&iframeID=physics-${token}#options=${encodeOptions(configuration)}`;
  fit();updateEditorLink();syncPhaseMap();
  watchdog=setTimeout(()=>{if(!ready)showError(new Error('The model is taking longer to load. Try Reset to reload it.'));},30000);
}
async function selectModel(name){
  send('pauseSim');resumeWhenReady=false;active=Object.hasOwn(definitions,name)?name:'prl';const m=model();
  $('workspace').dataset.model=active;$('workspace').setAttribute('aria-labelledby',`tab-${active}`);
  document.querySelectorAll('[data-model]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.model===active)));
  $('model-title').textContent=m.title;$('model-kicker').textContent=m.kicker;$('model-description').textContent=m.description;$('paper-link').href=m.doi;
  $('field-label').textContent=m.fieldLabel;$('draw-note').textContent=m.drawNote||'Click or drag on the field to add a local perturbation.';
  $('equation').innerHTML=m.equation;$('equation-note').textContent=m.note;
  $('parameter-notes').innerHTML='<div class="parameters">'+m.parameters.map(([symbol,label])=>`<span><b>${symbol}</b> · ${label}</span>`).join('')+'</div>';
  $('methods').innerHTML=m.methods;$('suggestion').textContent=m.suggestion;
  $('suggestion').hidden=!m.suggestion;$('regime').innerHTML=m.regimes.map(([id,label])=>`<option value="${id}">${label}</option>`).join('');
  $('phase-map').hidden=active!=='prl';
  if(active==='prl')ensurePhaseMap().catch(error=>{$('phase-map').textContent=error.message;reportSize();});
  await loadRegime();
}
window.addEventListener('message',event=>{
  if(event.origin!==location.origin)return;
  if(embedded&&event.source===window.parent){
    if(event.data?.type==='research-lab:pause'){resumeWhenReady=false;send('pauseSim');showRunning(false);}
    if(event.data?.type==='research-lab:play'&&ready&&!drawing){send('playSim');showRunning(true);}
    if(event.data?.type==='research-lab:viewport'&&Number.isFinite(event.data.fieldHeight)){fieldHeight=Math.max(180,Math.min(480,event.data.fieldHeight));fit();}
    return;
  }
  if(event.source!==iframe.contentWindow||String(event.data?.id)!==`physics-${generation}`)return;
  if(event.data.type==='research:ready')markReady();
  if(event.data.type==='probeData'){
    const last=event.data.data?.at(-1);if(!last)return;
    if(!Number.isFinite(last.y)){showError(new Error('The solution became unstable. Reset to restart this experiment.'));return;}
    lastProbe=last;
    // Image-backed initial conditions may emit probes before both images arrive.
    // Wait for the engine's explicit ready signal before enabling those runs.
    if(!configuration.resetOnImageLoad)markReady();
    if(ready){$('clock').textContent=`t = ${last.x.toFixed(1)}`;$('mean').textContent=`${model().metricLabel} ${last.y.toFixed(3)}`;}
  }
});
$('view').addEventListener('change',()=>{
  if(!ready)return;const index=Number($('view').value);configuration.activeViewInd=index;
  Object.assign(configuration,configuration.views[index]);delete configuration.name;
  send('researchView',{index});updateEditorLink();
});
document.querySelectorAll('[data-model]').forEach(b=>b.addEventListener('click',()=>selectModel(b.dataset.model).catch(showError)));
$('regime').addEventListener('change',()=>{resumeWhenReady=running;loadRegime().catch(showError);});
$('play').addEventListener('click',()=>{if(!ready)return;send(running?'pauseSim':'playSim');showRunning(!running);});
$('reset').addEventListener('click',()=>{resumeWhenReady=false;loadRegime({keepParameters:active==='prl'}).catch(showError);});
$('blank').addEventListener('click',()=>{resumeWhenReady=false;send('pauseSim');loadRegime({blank:true,keepParameters:true}).catch(showError);});
$('suggestion').addEventListener('click',()=>{
  if(!ready)return;const m=model();
  if(m.suggestionRegime){$('regime').value=m.suggestionRegime;resumeWhenReady=true;loadRegime().catch(showError);return;}
  Object.entries(m.suggestionValues||{}).forEach(([name,value])=>updateParameter(name,value));send('playSim');showRunning(true);
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){resumeWhenReady=false;send('pauseSim');showRunning(false);}});
selectModel(location.hash.slice(1)).catch(showError);
