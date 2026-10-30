(() => {
  // Preserve links shared before research moved to its own page.
  const researchAnchors = new Set(["code", "code-title", "ecological-physics", "hoi-caption", "hoi-video", "hoi-video-status", "ibm-caption", "ibm-video", "ibm-video-status", "interactive-simulations", "interactive-title", "live-file-help", "live-loading", "live-model-mount", "live-model-panel", "nonequilibrium-physics", "physics-model-panel", "physics-title", "research", "research-title", "simulations", "simulations-title"]);
  const forward = () => {
    if (researchAnchors.has(location.hash.slice(1))) {
      location.replace(new URL('research.html' + location.hash, location.href));
    }
  };
  forward();
  window.addEventListener('hashchange', forward);
})();
