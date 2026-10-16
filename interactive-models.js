(() => {
  const labBase=new URL('lab/',document.currentScript.src);
  const names={grl:'Vegetation clustering',science:'Topological defects',pnas:'Patterns and resilience',prl:'Nonreciprocal waves',noise:'Noise-sustained structures',gl:'Ginzburg–Landau vortices'};
  const physics=new Set(['prl','noise','gl']);
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-live-models]').forEach(section=>{
    const panel=section.querySelector('[data-live-panel]'),mount=section.querySelector('[data-live-mount]'),loading=section.querySelector('[data-live-loading]');
    const buttons=[...section.querySelectorAll('[data-open-model]')];
    let frame,active,timeout,visible=false,playWhenReady=false;
    function send(type,extra={}){frame?.contentWindow?.postMessage({type:'research-lab:'+type,...extra},location.origin);}
    function fitModel(){send('viewport',{fieldHeight:Math.min(480,window.innerHeight*.52)});}
    window.addEventListener('resize',fitModel);
    function openModel(name,{userInitiated=false}={}){
      if(location.protocol==='file:'){section.querySelector('[data-live-file-help]').hidden=false;loading.hidden=true;return;}
      if(active===name)return;
      active=name;panel.dataset.model=name;playWhenReady=!reducedMotion.matches;
      loading.hidden=false;loading.textContent='Preparing the simulation…';
      buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.openModel===name)));
      send('pause');frame?.remove();
      frame=document.createElement('iframe');frame.className='live-model-frame';frame.title=names[name]+' — interactive simulation';
      const path=name==='pnas'?'pnas.html?embedded=1&v=9':physics.has(name)?`physics.html?embedded=1&v=4#${name}`:`index.html?embedded=1&v=3#${name}`;
      frame.src=new URL(path,labBase).href;frame.addEventListener('load',fitModel);mount.replaceChildren(frame);
      if(userInitiated)panel.scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth',block:'start'});
      clearTimeout(timeout);timeout=setTimeout(()=>{loading.textContent='Still loading. Reload the page to try again.';},35000);
    }
    window.addEventListener('message',event=>{
      if(!frame||event.origin!==location.origin||event.source!==frame.contentWindow)return;
      if(event.data?.type==='research-lab:resize'&&Number.isFinite(event.data.height))frame.style.height=Math.min(6000,Math.max(320,event.data.height))+'px';
      if(event.data?.type==='research-lab:ready'){
        clearTimeout(timeout);loading.hidden=true;fitModel();
        if(event.data.autoplay!==false&&playWhenReady&&visible&&!document.hidden)send('play');
        playWhenReady=false;
      }
    });
    new IntersectionObserver(entries=>{
      visible=entries[0].isIntersecting;
      if(visible&&!frame)openModel(section.dataset.defaultModel||buttons[0].dataset.openModel);
      if(!visible){playWhenReady=false;send('pause');}
    }).observe(panel);
    buttons.forEach(button=>button.addEventListener('click',()=>openModel(button.dataset.openModel,{userInitiated:true})));
    document.addEventListener('visibilitychange',()=>{if(document.hidden)send('pause');});
  });
})();
