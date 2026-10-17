(() => {
  'use strict';

  // Use the site's own MapMyVisitors token.
  // Local previews never send visits, even when collection is enabled here.
  const config = {
    enabled: true,
    token: 'V6cMOHHL6GHWILNKMp043PzoK5pPkRtjHgPnjreoKMQ',
    statisticsUrl: 'https://mapmyvisitors.com/web/1c8wo',
    showMap: true,
  };

  const section = document.getElementById('visitors');
  const mount = document.getElementById('visitor-map-mount');
  if (!section || !mount) return;

  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) || location.protocol === 'file:';
  const preview = local && new URLSearchParams(location.search).get('visitor-map') === 'preview';

  if (preview) {
    // A frozen, aggregate-only local snapshot avoids registering review visits.
    const image = document.createElement('img');
    image.src = 'assets/visitors/map-snapshot-20261017.svg';
    image.width = 720;
    image.height = 310;
    image.alt = 'Visitor locations in the United States and Singapore, as reported by MapMyVisitors on 17 October 2026. Locations are approximate.';
    const link = document.createElement('a');
    link.href = config.statisticsUrl;
    link.target = '_blank';
    link.rel = 'noopener';
    link.setAttribute('aria-label', 'View visitor statistics on MapMyVisitors');
    link.append(image);
    mount.append(link);
    section.hidden = false;
    return;
  }

  // Collection is restricted to the approved public hostname. A local review,
  // copied checkout, or missing site token cannot count as a genuine visit.
  if (local || location.hostname !== 'dpintoramos.github.io' || !config.enabled || !config.token.trim()) return;

  const params = new URLSearchParams({ d: config.token.trim(), cl: 'cad8c8' });

  if (!config.showMap) {
    // The provider also supports an image counter. Load it once without a
    // visible map; no map.js, jQuery, or duplicate tracking request is needed.
    const pixel = document.createElement('img');
    pixel.className = 'visitor-map-pixel';
    pixel.width = 1;
    pixel.height = 1;
    pixel.alt = '';
    pixel.setAttribute('aria-hidden', 'true');
    pixel.src = `https://mapmyvisitors.com/map.png?${params}`;
    document.body.append(pixel);
    return;
  }

  // Visible mode uses the same token and provider-managed visitor history.
  // This branch replaces the pixel branch; the two are never loaded together.
  section.hidden = false;
  if (config.statisticsUrl.startsWith('https://mapmyvisitors.com/web/')) {
    section.querySelector('.visitor-map-source').href = config.statisticsUrl;
  }
  params.set('w', 'a');
  params.set('co', 'e7eee5');
  params.set('cmo', '24584b');
  params.set('cmn', '548574');
  params.set('ct', '5b685f');
  params.set('t', 'n');

  // The provider fixes its pixel width when first loaded. Scale the complete
  // widget together so its background, markers and controls stay aligned.
  let observedWidget;
  const fitMap = () => {
    const widget = mount.querySelector('#mapmyvisitors-widget');
    if (!widget) return;
    if (widget !== observedWidget) {
      observedWidget = widget;
      widget.href = config.statisticsUrl;
      widget.target = '_blank';
      widget.rel = 'noopener';
      widget.setAttribute('aria-label', 'View visitor statistics on MapMyVisitors');
      sizes.observe(widget);
    }
    if (!widget.offsetWidth || !widget.offsetHeight) return;
    const scale = Math.min(1, mount.clientWidth / widget.offsetWidth);
    widget.style.transformOrigin = 'top left';
    widget.style.transform = scale < 1 ? `scale(${scale})` : '';
    mount.style.height = `${widget.offsetHeight * scale}px`;
  };
  const sizes = new ResizeObserver(fitMap);
  sizes.observe(mount);
  new MutationObserver(fitMap).observe(mount, { childList: true });

  const script = document.createElement('script');
  script.id = 'mapmyvisitors';
  script.async = true;
  script.src = `https://mapmyvisitors.com/map.js?${params}`;
  script.addEventListener('error', () => { section.hidden = true; });
  mount.append(script);
})();
