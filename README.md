# David Pinto Ramos — research website

Personal research website: **https://dpintoramos.github.io/**

This repository is the publication checkout for a static website about physics of ecological systems and nonequilibrium physics. The original working copy, production media, research datasets and development records are preserved separately by the author.

## Contents

- `index.html`: introduction, films, research modules, article/code links and contact details.
- `styles.css` and `editorial.css`: layout, palette and responsive design.
- `youtube-films.js`: muted autoplay, looping and playback controls for the two YouTube films.
- `interactive-models.js`: loads the interactive modules as they come into view and pauses them when hidden.
- `assets/simulations/`: film posters and scientific source notes. Video masters are hosted separately; they are not bundled here.
- `lab/`: all six model demonstrations, their settings and initial fields, and the locally hosted VisualPDE engine.
- `.nojekyll`: serves the static files directly on GitHub Pages.

Keep the entire repository structure together, including every `lab/` subfolder. The simulations run in the visitor's browser using WebGL; there is no numerical server or build step.

## Preview locally

From this repository's root, start a static HTTP server, for example with Python 3:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open **http://127.0.0.1:8000/** in a browser. Keep the server running while previewing; press Control+C to stop it. Opening `index.html` directly as a file does not load all browser modules and simulation data. Python is needed only for this example preview command, not for the published website.

## Edit

Edit text and links in `index.html`, save, and reload the preview. The permanent email and institutional email appear in both the introduction and contact section; update both if needed. CSS controls appearance. Model definitions are in `lab/models/` and `lab/lab.js`; saved simulation settings are in `lab/presets/`.

Numerical settings and boundary conditions are part of each demonstration's scientific definition. Changes to them should be checked against the source model. See `lab/README.txt` and the source notes linked below each simulation.

## GitHub Pages

The user-site repository is `DPintoRamos/dpintoramos.github.io`. Publish the complete contents of this repository from **Settings → Pages → Deploy from a branch → main → /(root)**. The expected address is **https://dpintoramos.github.io/**. GitHub provides HTTPS and serves the static files; videos are streamed from YouTube and computations run on the visitor's device.

## Sources and credits

The simulations implement the research articles linked on the site. Their initial fields, numerical choices, checks and source hashes are documented in `lab/assets/*-provenance.json`; film source notes are in `assets/simulations/README.md`.

Portable source references use these conventions:

- `research-repositories/<repository>/<path>` identifies a file in the author's research repositories. It is a source identifier, not a dependency of this website or a claim that every repository is public.
- `author-source-library/` identifies an author-held article copy by title; the corresponding DOI and source hash are retained.
- `author-production-archive/` identifies a production or verification record retained separately. These records are not website URLs or runtime dependencies.
- Paths beginning with `lab/` refer to this website's root. Short image and preset filenames in the source notes are relative to `lab/assets/` or `lab/presets/`, respectively.

Interactive simulations use **[VisualPDE](https://visualpde.com/)** by Benjamin Walker, Adam Townsend and Andrew Krause, pinned to revision `54b832c9374c7f97944e52ec40ba801deb801b7e`. Upstream licences and notices remain in `lab/visualpde/LICENSE.md`; the original source inventory and local modifications are recorded in `PROVENANCE.json` and `LOCAL-CHANGES.json` in that folder.
