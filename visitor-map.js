(() => {
  'use strict';

  // Use the site's own MapMyVisitors token.
  // Local previews never send visits, even when collection is enabled here.
  const config = {
    enabled: true,
    token: 'V6cMOHHL6GHWILNKMp043PzoK5pPkRtjHgPnjreoKMQ',
    statisticsUrl: 'https://mapmyvisitors.com/web/1c8wo',
    showMap: false,
  };

  const section = document.getElementById('visitors');
  const mount = document.getElementById('visitor-map-mount');
  if (!section || !mount) return;

  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) || location.protocol === 'file:';
  const preview = local && new URLSearchParams(location.search).get('visitor-map') === 'preview';

  if (preview) {
    const image = document.createElement('img');
    image.src = 'assets/visitors/map-preview.svg';
    image.width = 720;
    image.height = 310;
    image.alt = 'World map with illustrative locations. These are example points, not recorded visits.';
    mount.append(image);

    const label = document.createElement('p');
    label.className = 'visitor-map-example-label';
    label.textContent = 'Design preview · example locations';
    mount.append(label);

    const controls = document.createElement('aside');
    controls.className = 'container visitor-map-review';
    controls.lang = 'es';
    controls.setAttribute('aria-label', 'Controles de la vista previa local');
    controls.innerHTML = '<div><strong>Vista local del mapa</strong><p>Puntos de ejemplo. Esta vista local no registra visitas.</p></div><div class="visitor-map-review-actions"><button type="button" data-show="true" aria-controls="visitors">Mostrar mapa</button><button type="button" data-show="false" aria-controls="visitors">Ocultar mapa</button></div>';
    document.querySelector('.site-footer').before(controls);

    const setVisible = (visible) => {
      section.hidden = !visible;
      for (const button of controls.querySelectorAll('button')) {
        button.setAttribute('aria-pressed', String((button.dataset.show === 'true') === visible));
      }
    };
    for (const button of controls.querySelectorAll('button')) {
      button.addEventListener('click', () => setVisible(button.dataset.show === 'true'));
    }
    setVisible(true);
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

  // Future visible mode uses the same token and existing visitor history.
  // This branch replaces the pixel branch; the two are never loaded together.
  section.hidden = false;
  if (config.statisticsUrl.startsWith('https://mapmyvisitors.com/web/')) {
    section.querySelector('.visitor-map-source').href = config.statisticsUrl;
  }
  params.set('w', 'a');
  params.set('co', 'e7eee5');
  params.set('ct', '5b685f');
  params.set('t', 'n');
  const script = document.createElement('script');
  script.id = 'mapmyvisitors';
  script.async = true;
  script.src = `https://mapmyvisitors.com/map.js?${params}`;
  script.addEventListener('error', () => { section.hidden = true; });
  mount.append(script);
})();
