# Simulation media provenance

The HOI animation re-renders existing research data. The Physica D movie is a new illustrative individual-based simulation prepared on 15 October 2026. Original research sources remain unchanged. Palette: ivory (#f8f8f4) and forest green (#24584b).

## Higher-order competition

Film: https://www.youtube.com/watch?v=W0gRZAx5kJw
Bundled poster: hoi-fullbleed-poster.png. Local video exports and masters are retained separately.
Source: ibm_smooth_b1920_l5.npz, with metadata ibm_smooth_b1920_l5.json.
Source SHA-256: 4134245a309948b8591eade50c57656413ea112b820d23bfdcb27d696a8e9b7d.

This is the same b = 1920 trajectory and playback timing as IBM_continuous_gamma_b1920_translucent_particles_20fps.mp4. It replaces the earlier b = 1280 density view. All 1,564 recorded frames appear exactly once and in order, at 20 fps: 78.2 seconds. No temporal interpolation or new model integration.

The trajectory contains 62,959,959 saved positions on a periodic square of side 5. Each position contributes a translucent Gaussian particle sprite to a 720 × 720 panel. Opacity parameter: 0.25. Nominal diameter: 6.5 output pixels, 30% larger than the previous 5 px equivalent diameter. Sprites combine through accumulated optical depth, following the original renderer's translucent-particle method. There is no separate density underlay or framewise contrast adjustment.

The frame is 720 × 784. The field fills the full width, with no border or inset, below a compact 64-pixel legend. The upper indicator uses the saved dimensionless_gamma (bγ) for each corresponding frame. Its horizontal marker position is linear in bγ/0.15. The horn silhouette follows h(s) = 2 + 19*expm1(3s)/expm1(3). This exponential shape is a graphic design choice; the actual parameter schedule has not been changed into an exponential ramp. The displayed range is 0 to 0.15. The poster is the saved frame nearest bt = 1440.

Original local web export: H.264 yuv420p, CRF 25, slow preset, faststart, no audio; 67,817,462 bytes. The earlier layout and media are preserved outside the website folder. This revision preserves the recorded frame order and timing.

A separate higher-quality master for YouTube is retained under **author-production-archive/video-redesign/hoi-youtube-master/**: `hoi-youtube-master.mp4`, **2160 × 2352**, with a 2160 × 2160 field and a 192-pixel legend. The aspect ratio, relative particle diameter, opacity, palette, source trajectory, 1,564 frames, 20 fps and 78.2-second duration match the web movie. Particle positions and text are rendered natively at the higher resolution. Encoding: H.264, CRF 18, yuv420p, explicit BT.709 conversion and color metadata, faststart, no audio. Size: **427,153,957 bytes**; SHA-256: 2d7b242adebffcb9503a457a9ef03e2c521eb5c91c998a47bd46bc02ef969ecb. This master is hosted on YouTube; its original file is not bundled with the website. Its renderer, source hash, README and verification report remain alongside it.

Scientific scope: the source metadata marks pilot_not_production: true. This is an illustrative communication run, not the manuscript production parameter sweep. The recorded progression covers spots, stripes, gaps and a near-uniform regime.

Reproducibility caveat: the stored metadata matches the earlier smooth_gamma_schedule.py, whereas the current simulate_smooth_ramp.py imports a later v3 schedule. These media only re-render the stored data.

## Individual-based competition — Physica D

Film: https://www.youtube.com/watch?v=TXAbj-0A9jM
Bundled poster: physica-d-kernel-poster.webp, revision 3 (15 October 2026). Local video exports and masters are retained separately.
Article: Surendran, Pinto-Ramos, Menezes & Martinez-Garcia (2025), Physica D 477, 134703. DOI: https://doi.org/10.1016/j.physd.2025.134703.

This newly simulated sequence uses a new C++ implementation of the article's individual birth, Gaussian offspring dispersal, and competitive-death rules. The requested generalized-exponential kernel sweep is an illustrative extension; the family is super-Gaussian for p > 2. The original research code and archived paper simulations are preserved separately.

Individuals occupy a periodic 20 × 20 domain. Birth rate b = 27.45 and background death rate d = 2.745 are three times their revision 2 values, with competition strength g = 1 and offspring dispersal standard deviation s = .15 unchanged. The homogeneous population scale is 9,882. The saved trajectory contains **9,450–13,709 individuals**, averaging 11,007.60 (about 3.02 times revision 2), and ends at 13,287.

The competition kernel is K_p(r) = exp[-(r/R)^p] / Z_p, with R = 2.2. Z_p is its integral over the periodic displacement square [-10,10]², using minimum-image distances. This keeps the integral equal to one on the finite torus for every exponent. The broad kernels at p < 2 are finite-domain experiments; their normalization differs from an infinite-plane integral.

The exact continuous-time event sampler uses Poisson thinning of ordered competition pairs. Each ordered pair proposes at rate g K_p(0); a proposal kills the focal individual with probability K_p(r)/K_p(0). Rejected proposals consume time. This gives the same individual competition death rates as direct Gillespie sampling. The kernel retains the small interpolation, quadrature, and tail-truncation approximations documented in the production README.

Seed: mt19937_64(20261015). Initial population: 9,882 uniformly random positions. Burn-in: 10 model time units at p = .1. The simulator records 1,440 states at intervals of 1/30, spanning 0–47.9666667 after burn-in. Dividing model times by three while multiplying intrinsic rates by three preserves the demographic pace of the previous video. The stochastic trajectory changes, and relative demographic fluctuations decrease at higher population.

The movie holds p = .1 for its first 7.2 seconds, rises smoothly in logarithmic p to 2 at 32.4 seconds and to 16 at 57.6 seconds, then holds 16 for 14.4 seconds. Thus 45% of the movie shows p ≤ 2. The parameter is fixed within each recording interval.

Every saved individual contributes one translucent green Gaussian sprite, nominal diameter 8 pixels and alpha .4 at the 720-pixel canvas width. Overlap uses optical-depth compositing. The compact legend shows the actual exponent and a peak-normalized radial kernel silhouette. Individual positions are not interpolated or duplicated. The sequence illustrates irregular aggregation followed by local cluster ordering with defects.

Original local web output: H.264 yuv420p, CRF 24, slow preset, faststart, no audio; **720 × 784, 1,440 frames, 20 fps, 72 seconds**; **37,846,230 bytes**.
Video SHA-256: bd0d42df45acded3b00dbdcba4f56076251d82e62e5eff27bdc5df4d2fd5e310.
Poster: 59,528 bytes; SHA-256: e7000400bd8c1c9a18908b59b6dcf690af739a0d8095e9d2f02cc2f5f3cfc942.

The web movie decoded successfully. Saved coordinates are finite and lie in [0,20); a float32 coordinate that rounds to 20 is stored at its equivalent periodic position 0. The portable NPZ matches the saved binary trajectory. Kernel checks, full output verification, source code, raw trajectories, and reproduction commands are retained under **author-production-archive/physica-d-video-v3/**. The intermediate 1080 × 1176 master stays in that production folder and is not a website dependency. The film embedded on the website is streamed from YouTube.

The previous revision 2 video and poster, along with the previous page and documentation, are preserved under author-production-archive/physica-d-video-v3/previous/. Revision 2 code and data remain under author-production-archive/physica-d-video-v2/. Revision 1 remains under author-production-archive/physica-d-video/ and its media under author-production-archive/physica-d-video-v2/previous/.

## Playback and production records

Both films are embedded from YouTube. They start muted and loop independently, with a separate play/pause button for each film. Posters and direct “Watch on YouTube” links remain available if an embedded player cannot start. Video masters are not downloaded from this repository.

The source trajectories, renderer settings, original exports, full verification reports and earlier revisions are retained in the author's production archive. Identifiers beginning with `author-production-archive/` refer to those separate records, not to website URLs. Their numerical details and hashes above document the origin and scientific scope of these communication sequences.
