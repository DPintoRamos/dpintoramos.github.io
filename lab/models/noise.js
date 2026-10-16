export default {
  title: 'When noise keeps structures alive',
  kicker: 'Nonlinear Dynamics · 2025',
  doi: 'https://doi.org/10.1007/s11071-025-10929-3',
  width: 1024,
  height: 512,
  description: 'Directional interactions carry phase walls across a lattice. Explore travelling bands, their breakup into fluctuating domains, and the growth of phase domains during coarsening.',
  regimes: [
    ['noise-sustained', 'Noise-sustained phase walls'],
    ['noise-ordered', 'Travelling ordered bands'],
    ['noise-boundary-coarsening', 'Coarsening from the boundary'],
    ['noise-coarsening', 'Reciprocal coarsening']
  ],
  controls: [
    {name: 'alpha', label: 'Nonreciprocity · α', min: 0, max: 1, step: 0.01, note: 'The two longitudinal couplings are D − α and D + α.'},
    {name: 'sigma', label: 'Noise amplitude · √Γ', min: 0, max: 0.2, step: 0.005, note: 'Independent fluctuations act on each lattice element.'}
  ],
  equation: 'dθ<sub>ij</sub>/dt = sin θ<sub>ij</sub> + (D − α)(θ<sub>i+1,j</sub> − θ<sub>ij</sub>) − (D + α)(θ<sub>ij</sub> − θ<sub>i−1,j</sub>) + D(θ<sub>i,j+1</sub> + θ<sub>i,j−1</sub> − 2θ<sub>ij</sub>) + √Γ ξ<sub>ij</sub>(t)',
  note: 'Equation (2), with ω = 1 and D⊥ = D. Each grid point is one physical lattice element; colour distinguishes the two phases around θ = −π and θ = +π.',
  parameters: [
    ['θᵢⱼ', 'local phase'], ['D = D⊥ = 0.3', 'reciprocal coupling'],
    ['α', 'nonreciprocal coupling'], ['√Γ', 'per-site noise amplitude'],
    ['Δ = π² − ⟨θ²⟩', 'phase-wall measure']
  ],
  methods: '<p>A 256 × 128 lattice has fixed spacing Δx = Δy = 1. The upstream external value is θ = 0, the downstream value copies the last site, and transverse bonds are periodic. Explicit neighbour sampling preserves the discrete equation.</p><p>VisualPDE uses Euler–Maruyama with Δt = 0.02. Independent Gaussian increments have variance ΓΔt at each site. The noise amplitude slider is √Γ.</p><p>The starting fields were pre-evolved with the same equation and noise convention: α = 0.64, √Γ = 0.1 for noise-sustained walls; α = 0.48, √Γ = 0.01 for ordered bands; α = 0.42, √Γ = 0.2 for coarsening from the boundary; α = 0, √Γ = 0.1 for reciprocal coarsening. The boundary-coarsening field starts after a short evolution of t = 8, preserving the small domains that subsequently grow. The original data analysis used a different stochastic time-stepping convention; the implementation details are recorded in the source and method notes.</p>',
  provenance: 'noise-provenance.json',
  suggestion: 'Try reciprocal coarsening',
  suggestionRegime: 'noise-coarsening',
  tryNote: 'Paint a +π patch into the field and watch it move. Compare the experiments, or change the strength of the noise.',
  fieldLabel: 'Local phase θ · blue −π / red +π',
  metricLabel: 'Wall measure Δ',
  blankInitial: ['-pi'],
  blankNote: 'The canvas starts in the −π phase. Draw +π patches, then press Play.',
  brushRadius: '4'
};
