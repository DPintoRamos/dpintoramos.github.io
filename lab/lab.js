import {encodeOptions} from './visualpde/sim/scripts/RD/url_codec.js';
import {getResolvedPreset} from './visualpde/sim/scripts/RD/presets.js';

const $=id=>document.getElementById(id);
const embedded=new URLSearchParams(location.search).get('embedded')==='1'&&window.parent!==window;
function notifyParent(type,extra={}){if(embedded)window.parent.postMessage({type:'research-lab:'+type,...extra},location.origin);}
if(embedded){
  document.querySelector('details.equations').open=false;
  const reportSize=()=>notifyParent('resize',{height:Math.ceil(document.querySelector('main').getBoundingClientRect().height)+2});
  new ResizeObserver(reportSize).observe(document.querySelector('main'));
  document.fonts.ready.then(reportSize);
}
const definitions={
  grl:{title:'When spots form clusters',kicker:'Geophysical Research Letters · 2025',doi:'https://doi.org/10.1029/2025GL118462',width:800,height:800,
    description:'Scattered vegetation spots divide and spread. Explore how environmental heterogeneity shapes their growth into clusters, or watch self-replication across a homogeneous landscape.',
    regimes:[['grl-clusters','Clusters in a heterogeneous environment'],['grl-homogeneous','Homogeneous self-replication']],
    controls:[{name:'eta',label:'Aridity · η',min:.1,max:.19,step:.001,note:'Larger values make conditions less favourable.'},{name:'Gamma',label:'Heterogeneity · Γ',min:0,max:.12,step:.005,note:'The spatial landscape stays fixed as its strength changes.'}],
    equation:'∂<sub>t</sub><em>b</em> = −(η + Γξ)<em>b</em> + κ<em>b</em><sup>2</sup> − <em>b</em><sup>3</sup> + (<em>d</em> − γ<em>b</em>)∇<sup>2</sup><em>b</em> − α<em>b</em>∇<sup>4</sup><em>b</em>',
    note:'Equation (1), with spatially heterogeneous aridity. ξ(x,y) is a fixed Gaussian field with zero ensemble mean and unit variance.',
    parameters:[['b','normalised biomass'],['η','mean aridity'],['Γ','heterogeneity strength'],['κ = 0.6','cooperativity'],['d = 0.02','dispersal'],['γ = 0.65; α = 0.125','spatial interaction terms']],
    methods:'<p>Both experiments begin with 20 Gaussian spots placed at random. Clustering uses η = 0.15 and Γ = 0.08; homogeneous self-replication uses η = 0.12 and Γ = 0.</p><p>The 214 × 214 grid uses Δx = Δy ≈ 0.49839 and periodic boundaries. The spatial stencils follow the deposited research code. VisualPDE advances the field with explicit Euler, Δt = 0.001.</p>',
    provenance:'grl-live-states-provenance.json',suggestion:'Try homogeneous self-replication',suggestionRegime:'grl-homogeneous',tryNote:'Let the spots grow and divide. Choose an experiment to compare the two environments.'},
  science:{title:'Where bands break and reconnect',kicker:'Science Advances · 2023',doi:'https://doi.org/10.1126/sciadv.adf6620',width:1024,height:512,
    description:'Follow migrating vegetation bands and their dislocations. Compare regular bands, a state with defects near the boundary, and a strongly disordered state.',
    regimes:[['science-emission','Defects near the boundary'],['science-turbulent','Disordered bands'],['science-perfect','Regular bands']],
    controls:[{name:'eta',label:'Aridity · η',min:-.16,max:-.01,step:.000001,note:'Controls the local balance between growth and loss.'},{name:'alpha',label:'Asymmetry · α',min:.4,max:2,step:.05,note:'Controls the nonlinear drift term −α b ∂ₓb.'}],
    equation:'∂<sub>t</sub><em>b</em> = (−η + κ<em>b</em> − <em>b</em><sup>2</sup>/2)<em>b</em> + <em>p</em>∇<sup>2</sup><em>b</em> − <em>b</em>(α∂<sub>x</sub> + γ∂<sub>x</sub><sup>2</sup> + ∂<sub>x</sub><sup>4</sup>)<em>b</em>',
    note:'The reduced vegetation equation (2). The fourth derivative acts along x; colour shows the biomass field.',
    parameters:[['b','normalised biomass'],['η','aridity'],['α','interaction asymmetry'],['κ = 0.3','cooperativity'],['p = 0.05','dispersal'],['γ = 2','interaction-length parameter']],
    methods:'<p>The three experiments explore the published model on a larger rectangular domain: 384 × 192 points at Δx = Δy = 0.6, spanning 230.4 × 115.2. Fields are pre-evolved from random biomass, or from sinusoidal bands with small random perturbations for the regular regime.</p><p>The η values are −0.0297872340 (boundary defects), −0.16 (disordered bands, α = 1.35) and −0.0723404255 (regular bands). The boundaries follow the research code: zero biomass on the left, reflection on the right and periodicity in y. VisualPDE uses explicit Euler, Δt = 0.001.</p>',
    provenance:'science-large-provenance.json',suggestion:'Try stronger asymmetry → α = 1.5',suggestionValues:{alpha:1.5},tryNote:'Watch the bands migrate. Choose an experiment to compare the distribution of defects.'}
};

let active='grl', configuration, ready=false, running=false, loadToken=0;
let resumeWhenReady=false, drawing=false;
let fieldHeight=embedded ? 480 : Math.min(520,window.innerHeight*.52);
const iframe=$('simulation');
function send(type,extra={}){iframe.contentWindow?.postMessage({type,...extra},location.origin);}
function fit(){
  const m=definitions[active];
  document.documentElement.style.setProperty('--field-height',fieldHeight+'px');
  const maxWidth=fieldHeight*m.width/m.height;
  $('simulation-shell').style.maxWidth=maxWidth+'px';
  document.querySelector('.field-footer').style.maxWidth=maxWidth+'px';
  const scale=$('simulation-shell').clientWidth/m.width;
  iframe.style.width=m.width+'px'; iframe.style.height=m.height+'px';
  iframe.style.transform=`scale(${scale})`;
  $('simulation-shell').style.height=m.height*scale+'px';
}
new ResizeObserver(fit).observe($('simulation-shell'));
window.addEventListener('resize',()=>{if(!embedded)fieldHeight=Math.min(520,window.innerHeight*.52);fit();});
function showRunning(value){running=value;$('play').textContent=value?'Pause':'Play';}
function updateParameter(name,value){
  configuration.kineticParams=configuration.kineticParams.replace(new RegExp('(^|;)\\s*'+name+'\\s*=\\s*[^;]+'),(_,prefix)=>`${prefix} ${name}=${value}`);
  send('updateParam',{name,value});
  const input=document.querySelector(`input[data-parameter="${name}"]`);
  if(input){input.value=value;$(name+'-value').textContent=Number(value).toFixed(active==='science'&&name==='eta'?6:3);}
  updateEditorLink();
}
function updateEditorLink(){
  if(!configuration)return;
  $('editor-link').href=`editor.html?width=${definitions[active].width}&height=${definitions[active].height}#options=${encodeOptions({...configuration,runningOnLoad:false})}`;
}
function valuesFromParams(){return Object.fromEntries(configuration.kineticParams.split(';').map(x=>x.trim()).filter(Boolean).map(x=>{const [name,value]=x.split('=');return [name.trim(),parseFloat(value)];}));}
async function loadRegime({blank=false,keepParameters=false}={}){
  const token=++loadToken, previousParams=configuration?.kineticParams;
  ready=false; drawing=blank; showRunning(false);
  $('loading').hidden=false;$('loading').textContent='Preparing the model…';
  $('clock').textContent='t = 0';$('mean').textContent='Mean biomass —';
  const selected=$('regime').value;
  const response=await fetch(`presets/${selected}.json`);
  if(!response.ok)throw new Error('Could not load this model.');
  const delta=await response.json();if(token!==loadToken)return;
  configuration={...getResolvedPreset('default'),...delta};
  if(keepParameters&&previousParams)configuration.kineticParams=previousParams;
  if(blank){configuration.initCond_1='0';configuration.brushRadius='2.2';}
  $('blank').textContent=blank?'Clear canvas':'Blank canvas';
  $('blank').setAttribute('aria-pressed',String(blank));
  $('try-note').textContent=blank?'Draw your starting patches on the field, then press Play. Reset restores the selected experiment.':definitions[active].tryNote;
  const values=valuesFromParams();
  $('controls').innerHTML=definitions[active].controls.map(c=>`<div class="control"><label for="control-${c.name}">${c.label}<output id="${c.name}-value">${values[c.name].toFixed(active==='science'&&c.name==='eta'?6:3)}</output></label><input id="control-${c.name}" type="range" data-parameter="${c.name}" aria-label="${c.label}" min="${c.min}" max="${c.max}" step="${c.step}" value="${values[c.name]}"><small>${c.note}</small></div>`).join('');
  document.querySelectorAll('[data-parameter]').forEach(input=>input.addEventListener('input',()=>updateParameter(input.dataset.parameter,Number(input.value))));
  $('preset-link').href=`presets/${selected}.json`;
  $('provenance-link').href=`assets/${definitions[active].provenance}`;
  iframe.src=`visualpde/sim/index.html?clean&iframeID=${token}#options=${encodeOptions(configuration)}`;
  fit();updateEditorLink();
}
async function selectModel(name){
  send('pauseSim');resumeWhenReady=false;active=name;
  $('workspace').classList.toggle('science-wide',name==='science');
  const m=definitions[name];
  document.querySelectorAll('[data-model]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.model===name)));
  $('workspace').setAttribute('aria-labelledby',`tab-${name}`);
  $('model-title').textContent=m.title;$('model-kicker').textContent=m.kicker;
  $('model-description').textContent=m.description;$('paper-link').href=m.doi;
  $('equation').innerHTML=m.equation;$('equation-note').textContent=m.note;
  $('parameter-notes').innerHTML='<div class="parameters">'+m.parameters.map(([symbol,label])=>`<span><b>${symbol}</b> · ${label}</span>`).join('')+'</div>';
  $('methods').innerHTML=m.methods;$('suggestion').textContent=m.suggestion;
  $('regime').innerHTML=m.regimes.map(([id,label])=>`<option value="${id}">${label}</option>`).join('');
  await loadRegime();
}
window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==iframe.contentWindow||event.data?.type!=='probeData'||String(event.data.id)!==String(loadToken))return;
  const last=event.data.data?.at(-1);if(!last)return;
  if(!Number.isFinite(last.y)){send('pauseSim');showRunning(false);$('loading').hidden=false;$('loading').textContent='The numerical solution became unstable. Reset to the reference state.';return;}
  const firstReady=!ready;ready=true;
  if(firstReady){notifyParent('ready',{autoplay:!drawing});if(resumeWhenReady&&!drawing){resumeWhenReady=false;send('playSim');showRunning(true);}}
  $('loading').hidden=true;$('clock').textContent=`t = ${last.x.toFixed(1)}`;$('mean').textContent=`Mean biomass ${last.y.toFixed(5)}`;
});
window.addEventListener('message',event=>{
  if(!embedded||event.origin!==location.origin||event.source!==window.parent)return;
  if(event.data?.type==='research-lab:pause'){resumeWhenReady=false;send('pauseSim');showRunning(false);}
  if(event.data?.type==='research-lab:play'&&ready&&!drawing){send('playSim');showRunning(true);}
  if(event.data?.type==='research-lab:viewport'&&Number.isFinite(event.data.fieldHeight)){fieldHeight=Math.max(180,Math.min(520,event.data.fieldHeight));fit();}
});
document.querySelectorAll('[data-model]').forEach(b=>b.addEventListener('click',()=>selectModel(b.dataset.model).catch(showError)));
$('regime').addEventListener('change',()=>{resumeWhenReady=running;loadRegime().catch(showError);});
$('play').addEventListener('click',()=>{if(!ready)return;send(running?'pauseSim':'playSim');showRunning(!running);});
$('reset').addEventListener('click',()=>{resumeWhenReady=false;loadRegime().catch(showError);});
$('blank').addEventListener('click',()=>{resumeWhenReady=false;send('pauseSim');loadRegime({blank:true,keepParameters:true}).catch(showError);});
$('suggestion').addEventListener('click',()=>{
  if(!ready)return;const m=definitions[active];
  if(m.suggestionRegime){$('regime').value=m.suggestionRegime;resumeWhenReady=true;loadRegime().catch(showError);return;}
  Object.entries(m.suggestionValues).forEach(([name,value])=>updateParameter(name,value));send('playSim');showRunning(true);
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){resumeWhenReady=false;send('pauseSim');showRunning(false);}});
function showError(error){$('loading').hidden=false;$('loading').textContent=error.message;}
selectModel(location.hash==='#science'?'science':'grl').catch(showError);
