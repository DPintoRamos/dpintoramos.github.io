(() => {
  let apiReady;
  // Both films start muted on page load and loop independently.
  function loadAPI() {
    if (window.YT?.Player) return Promise.resolve(window.YT);
    if (apiReady) return apiReady;
    apiReady = new Promise((resolve, reject) => {
      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousReady?.();
        resolve(window.YT);
      };
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.addEventListener('error', reject, {once: true});
      document.head.append(script);
    });
    return apiReady;
  }

  document.querySelectorAll('[data-youtube-id]').forEach(stage => {
    const preview = stage.querySelector('.youtube-preview');
    const status = document.getElementById(stage.dataset.videoStatus);
    const toggle = stage.closest('.simulation-film').querySelector('[data-film-toggle]');
    // YouTube needs an HTTP origin; retain the direct link for file:// previews.
    if (location.protocol === 'file:') return;

    const id = stage.dataset.youtubeId;
    const params = new URLSearchParams({
      autoplay: '1', mute: '1', controls: '0', playsinline: '1', rel: '0',
      loop: '1', playlist: id, enablejsapi: '1', origin: location.origin
    });
    const frame = document.createElement('iframe');
    frame.id = 'youtube-' + id;
    frame.title = stage.dataset.videoTitle;
    frame.src = 'https://www.youtube.com/embed/' + id + '?' + params;
    frame.width = '720';
    frame.height = '784';
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.setAttribute('aria-describedby', preview.getAttribute('aria-describedby'));
    stage.replaceChildren(frame);

    loadAPI().then(YT => {
      function updateToggle(state) {
        const playing = state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING;
        toggle.textContent = playing ? 'Pause film' : 'Play film';
        toggle.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'}: ${stage.dataset.videoTitle}`);
      }
      new YT.Player(frame.id, {
        events: {
          onReady(event) {
            toggle.hidden = false;
            toggle.disabled = false;
            updateToggle(event.target.getPlayerState());
            toggle.addEventListener('click', () => {
              const state = event.target.getPlayerState();
              if (state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING) {
                event.target.pauseVideo();
              } else {
                event.target.playVideo();
              }
            });
            event.target.mute();
            event.target.playVideo();
          },
          onStateChange(event) {
            updateToggle(event.data);
            if (event.data === YT.PlayerState.PLAYING) {
              status.hidden = true;
            }
          },
          onError() {
            toggle.disabled = true;
            toggle.hidden = true;
            status.textContent = 'The embedded player could not start. Use “Watch on YouTube” to open the film.';
            status.hidden = false;
          }
        }
      });
    }).catch(() => {
      // The iframe retains muted autoplay and looping if the API is unavailable.
    });
  });
})();
