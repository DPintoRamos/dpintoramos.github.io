(() => {
  const mount=document.getElementById('ibm-pilot-entry');if(!mount)return;
  const frame=document.createElement('iframe');frame.title='Physica D — interactive individual-based model';frame.src='ibm/index.html?embedded=1&layout=2';frame.loading='lazy';frame.className='ibm-pilot-frame';frame.style.cssText='width:100%;height:1020px;display:block;border:0;background:transparent';mount.append(frame);
  const pause=()=>frame.contentWindow?.postMessage({type:'ibm-pilot:pause'},location.origin);
  new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)pause();}).observe(frame);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  window.addEventListener('message',event=>{if(event.origin===location.origin&&event.source===frame.contentWindow&&event.data?.type==='ibm-pilot:resize'&&Number.isFinite(event.data.height))frame.style.height=Math.min(3000,Math.max(480,event.data.height+2))+'px';});
})();
