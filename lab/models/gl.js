export default {
  title: 'Vortices emerge, meet and disappear',
  kicker: 'Nematic liquid crystals · 2022',
  doi: 'https://doi.org/10.1007/978-3-031-04458-8_15',
  width: 768,
  height: 768,
  fieldLabel: 'Complex order parameter',
  metricLabel: 'Mean |A|²',
  description: 'Switch on an ordering field and watch vortices emerge from fluctuations. Opposite charges attract and annihilate as larger regions share a common orientation.',
  regimes: [
    ['gl-vortices', 'Vortex coarsening'],
    ['gl-quench', 'Switch on the field'],
    ['gl-pair', 'An opposite-charge pair']
  ],
  controls: [
    {name: 'mu', label: 'Ordering field · μ', min: -0.5, max: 2, step: 0.05, note: 'The disordered state becomes unstable above μ = 0.'},
    {name: 'T', label: 'Fluctuation strength · T', min: 0, max: 0.05, step: 0.001, note: 'Independent fluctuations seed the two components of the order parameter.'}
  ],
  views: [
    {index: 0, label: 'Phase'},
    {index: 1, label: 'Amplitude'},
    {index: 2, label: 'Crossed polarizers'}
  ],
  equation: '∂<sub>t</sub><em>A</em> = μ<em>A</em> − |<em>A</em>|<sup>2</sup><em>A</em> + ∇<sup>2</sup><em>A</em> + √<em>T</em> ζ',
  note: 'The isotropic case (δ = 0) of equation (1), also used in Figure 2. A = u + iv describes the critical director mode; phase winds around a vortex and amplitude vanishes at its centre.',
  parameters: [
    ['A = u + iv', 'complex order parameter'],
    ['μ', 'distance from the orientational instability'],
    ['T', 'noise intensity'],
    ['δ = 0', 'isotropic elastic response'],
    ['ζ', 'complex Gaussian white noise']
  ],
  methods: '<p>The two real components obey coupled reaction–diffusion equations on a 96 × 96 domain, with 192 × 192 points, Δx = Δy = 0.5 and zero normal derivatives at the boundaries. Explicit Euler–Maruyama uses Δt = 0.01.</p><p>For the chapter’s covariance ⟨ζ(r,t)ζ̄(r′,t′)⟩ = δ(r−r′)δ(t−t′), each real component receives an independent noise increment with variance TΔt/(2ΔxΔy). VisualPDE supplies separate Gaussian random channels. The interactive mesh and integrator differ from those used for the published figures.</p><p>Vortex coarsening begins after a short quench at μ = 1, T = 0.01. Switch on the field begins at A = 0. The isolated pair has opposite winding charges, an initial separation of 12 and T = 0. Phase uses a cyclic colour map; amplitude reveals the vortex cores. Crossed polarizers shows the qualitative proxy (2uv)².</p>',
  provenance: 'gl-provenance.json',
  suggestion: 'Switch on the field from A = 0',
  suggestionRegime: 'gl-quench',
  tryNote: 'Follow a colour cycle around a core to see its winding. Change the view to reveal the amplitude, or try the isolated pair.',
  blankInitial: ['0', '0'],
  brushRadius: '2.5'
};
