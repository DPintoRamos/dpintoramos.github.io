Research notebook — David Pinto Ramos

OPEN LOCALLY
Serve the website root with an HTTP server, for example:
  python3 -m http.server 8000 --bind 127.0.0.1
Then open http://127.0.0.1:8000/lab/ in a browser. The complete website is at
http://127.0.0.1:8000/. Opening the HTML directly as a file does not load all
browser modules and simulation data. See ../README.md for the website link and local preview.

EXPLORE
In index.html, choose the GRL or Science Advances tab. Press Play to evolve the selected state.
Use Pause to inspect it, move the sliders to change parameters, and Reset to
restore the selected experiment's starting field and saved parameters. GRL
offers two experiments; Science Advances offers three. Clicking or dragging on
the field adds biomass. The equation, parameter notes, article link and
numerical methods are available below the simulation.
Blank canvas clears biomass, retains the current kinetic parameters and pauses
the model so you can draw starting patches. Clear canvas removes those patches;
Reset restores the saved experiment. The PNAS comparison has separate shared
Play both and Reset both controls and is available in pnas.html. Its shared
alpha slider spans 0 to 0.6 and eta spans -0.05 to 0.06; changes wait for a common batch boundary before
being sent to both engines. Draw on either panel to perturb it independently.
Right-click erases biomass. Reset both restores the fields, alpha=0.15 and eta=0.035.

The main website also embeds this lab. The local engine loads when its section
enters view, begins playing unless reduced motion is requested, and pauses
when the section leaves view. Three buttons switch the embedded laboratory:
Clustering, Topological defects, and Patterns & resilience (PNAS). The first
two use one engine each; the PNAS comparison runs two coordinated engines.
Play resumes a paused simulation. The visual field scales to the available
viewport while its computational grid stays fixed.

"Open the VisualPDE editor" opens its full equation/settings interface. This
editor uses a fixed canvas to preserve the intended computational grid. Edits
in the browser do not automatically change the JSON files on disk. The preset
links provide the saved configuration; presets/ contains 17 editable JSON
files, and assets/ contains the starting fields and their source notes.

MODELS
GRL 2025 — https://doi.org/10.1029/2025GL118462
  b_t = -(eta + Gamma*xi)*b + kappa*b^2 - b^3
        + (d - gamma*b)*Laplacian(b) - alpha*b*Laplacian^2(b).
  Both experiments begin with the same 20 Gaussian spots at randomly chosen
  periodic positions: seed 20261015, peak amplitude 1, sigma=1.2 and minimum
  centre separation 10. The grid has 214 x 214 samples,
  dx=dy=106.656/214 (approximately 0.49839), retaining the physical domain
  of 106.656 x 106.656 and the same seed positions as the older 160-grid demo.
  - Clusters in a heterogeneous environment: eta=0.15, Gamma=0.08.
  - Homogeneous self-replication: eta=0.12, Gamma=0.
  Gamma is environmental heterogeneity; lowercase gamma remains 0.65 in the
  nonlinear diffusion coefficient. xi is the fixed seed-3008 Gaussian field,
  sampled from the original physical cells without drawing new noise or
  renormalizing its values when refining the biomass grid.
  These new initial spots replace the archived equilibrium in the live demo.
  Current input metadata: assets/grl-live-states-provenance.json.

Science Advances 2023 — https://doi.org/10.1126/sciadv.adf6620
  b_t = -eta*b + kappa*b^2 - b^3/2 + p*Laplacian(b)
        - b*(alpha*b_x + gamma*b_xx + b_xxxx).
  Three newly prepared fields explore the published model:
  - Defects near the boundary: eta=-0.029787234042553207, alpha=1.
  - Disordered bands: eta=-0.16, alpha=1.35.
  - Regular bands: eta=-0.07234042553191491, alpha=1.
  Boundary defects and regular bands retain the Fig. 6 parameter values;
  the revised disordered branch uses stronger asymmetry.
  The physical grid is 384 x 192 at dx=dy=0.6, spanning 230.4 x 115.2.
  The native engine iframe is 1024 x 512, then scaled with CSS. Its 2:1 aspect
  ratio preserves this computational domain, about 4.92 times the old area.
  Boundaries retain the original zero samples at left, reflected samples at
  right and periodicity in y.
  Boundary-defect and disordered states were prepared from full-domain
  smoothed random biomass; regular bands from a sinusoid with small random
  perturbations. Each preparation evolved to t=1500 using CPU RK4, dt=0.01.
  The displayed clock starts at zero when the browser continues the field.
  Current input metadata: assets/science-large-provenance.json.

PNAS 2026 — https://doi.org/10.1073/pnas.2511994123
  b_t = -eta*b + kappa*b^2 - b^3/2 + d*Laplacian(b)
        - b*(alpha*b_x + Gamma*b_xx + b_xxxx).
  The comparison uses eta=.035, alpha=.15, kappa=.3, d=.3 in both panels.
  Only Gamma differs: 2.25 in the pattern-forming case and 1 in the
  homogeneous case. Gamma here is the antidiffusion coefficient (stored as
  gamma in the preset), distinct from the GRL heterogeneity parameter.
  The grid is 384 x 192, dx=dy=.5, with two zero external samples at each
  x edge and periodicity in y. Each native iframe is 640 x 320.
  Both initial fields follow the same seeded one-dimensional preparation:
  eta=-.05 for t=300 then eta=.01 for t=200, with alpha=.15 throughout and
  only Gamma differing. The fields are freshly prepared across 384 x samples, then replicated along y.
  The physical domain spans 192 x 96; it is not a tiled copy of the old fields. The displayed
  evolution starts at the common eta=.035. A downstream boundary band can
  persist after vegetation patterns retreat from the domain interior.
  Current input metadata: assets/pnas-comparison-provenance.json.

NUMERICAL IMPLEMENTATION
The ecological models use explicit spatial stencils and Euler time stepping. GRL and
Science use dt=.001 and 240 steps per frame. PNAS uses dt=.003 with matching
batches of 200 steps in both panels; the next batch waits for both clocks.
The local researchStep message in the engine supports this comparison.
An explicit research:ready message waits for both image loads to complete
before the wrapper can advance either model; old image generations are ignored.
Batch length and steps per frame control playback speed. Keep the saved grid, boundary
conditions and time step unless you intend to verify a new numerical setup.
At the pinned VisualPDE revision, arbitrary field samples do not receive RK4's
intermediate states; selecting RK4 or midpoint in the editor would therefore
require additional numerical work.

The translated spatial operators were checked against the original research
functions. For the current 214-grid GRL states, finite positive CPU pilots
reached t=1000 with 55 local maxima in the heterogeneous case and 113 in the
homogeneous case. One-unit dt/2 checks gave maximum differences 1.47e-7 and
4.79e-7. The previous 160-grid counts are retained in the author's production archive.
The revised Science disordered state remains finite and positive to t=10;
its one-unit Euler dt/2 maximum difference is 2.52e-4. The other two Science
fields retain their earlier checks. PNAS preparation, common integration
protocol and separate state references are in its input provenance.

Current short float32 CPU reference means at t=0, .24, .48 are:
  GRL clustering:       .01590749, .01584290, .01578530.
  GRL homogeneous:      .01590749, .01595146, .01599671.
  Science disordered:   .83740884, .83738736, .83735518.
Detailed checks and historical revisions are retained in the author's
production archive; portable source identifiers appear in the JSON notes.

Earlier browser checks of the archived states are retained separately in the
author's production archive. Those historical checks do not by themselves
validate every value of these new fields. A single live trajectory illustrates
the model; the published defect statistics require the original analysis and
sampling protocol.

FILES AND HOSTING
This publication checkout contains every asset needed by the current website.
Original research repositories, source media and previous website versions
remain separate; they are not required on a visitor's computer. Superseded
research-field assets not referenced by the current modules or source notes
are omitted. Current metadata retains relevant historical comparisons and
source hashes, including the replaced Science disordered branch.

The folder is compatible with static GitHub Pages hosting. Keep lab/ and all
its subfolders together within the website. No remote numerical backend is
required: calculations run on the visitor's device. Films are hosted on YouTube.
Source-reference conventions are listed under SOURCE REFERENCES below.

ENGINE CREDIT
VisualPDE.com by Benjamin Walker, Adam Townsend, and Andrew Krause.
https://visualpde.com/
Pinned source revision: 54b832c9374c7f97944e52ec40ba801deb801b7e.
Upstream license notices: visualpde/LICENSE.md.
Source and packaging provenance: visualpde/PROVENANCE.json.
Software: MIT, with dat.gui under Apache 2.0; upstream HTML/CSS: CC BY 4.0.

NONEQUILIBRIUM PHYSICS — added 16 October 2026
physics.html contains three examples, also embedded in the main website:
- PRL 2021: a fixed 192-site chain, centred coupling, RK4 dt=.05.
- Nonlinear Dynamics 2025: a fixed 256 x 128 noisy lattice, Euler–Maruyama dt=.02.
- Nematic vortices 2022: the published isotropic GL case (delta=0), two real
  fields on 192 x 192 points at dx=.5, Euler–Maruyama dt=.01.
PRL and GL each have three initial experiments; the noisy lattice has four,
including boundary coarsening at alpha=.42 and sqrt(Gamma)=.2. All offer live
sliders, pause/reset and a blank canvas for drawing. The GL View selector changes phase/amplitude/polarizer
visualisation without resetting the evolving fields.

Model definitions are in models/; editable presets and source details are
in presets/ and assets/*-provenance.json. These browser experiments implement
the published equations with the numerical choices documented in each module.
They are not presented as exact reruns of archived paper figures.
The local engine now accepts a same-origin researchView message from its parent
to select an existing native view. No additional rendering engine is used.
The main website entry is ../index.html.

GL phase display uses a guarded native shader option, complexPhase. It
interpolates the real/imaginary components before evaluating the argument,
avoiding an artificial seam across +/-pi. Other models and view modes use
the default VisualPDE display. This is a display-only change.

PUBLICATION PACKAGING — 16 October 2026
The publication copy keeps all 17 presets, numerical data and source hashes.
Machine-specific source paths use portable source identifiers. Native editor
help links point to visualpde.com, favicon manifests use relative paths, and
the two optional tutorial movies use their existing WebM encodings. Research
films load from YouTube; local video masters and unpublished topography images
are not included in this repository. These packaging changes do not alter any
model equation, initial field, integrator or parameter setting.

SOURCE REFERENCES
The source notes retain article identifiers, numerical choices and file hashes.
research-repositories/<repository>/<path> identifies a file in the author's
research repositories; it does not imply that the repository is public.
author-source-library/ identifies an author-held article copy by title.
author-production-archive/ identifies a separately retained production or
verification record. These identifiers are source references, not website URLs.
Paths beginning with lab/ are relative to the website root; short image and
preset filenames refer to lab/assets/ and lab/presets/, respectively.
