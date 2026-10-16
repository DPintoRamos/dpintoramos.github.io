// rand_shaders.js

export function randShader() {
  // Compute pseudorandom noise that is approximately a uniform distribution on [0,1]. It has slightly more mass at 0 and 1.
  return `float RAND = fract(3.0*fract(sin(seed + dot(vec2(textureCoords.x,textureCoords.y),vec2(12.9898,78.233)))*43758.5453123));
  float RANDVAL = fract(3.0*fract(sin(seed)));`;
}

export function randNShader(generator = "legacy") {
  if (generator === "integer-hash") return integerGaussianShader();
  // Compute pseudorandom noise that is approximately a normal distribution.
  return `
  float intermediateRAND = fract(3.0*fract(sin(seed + dot(vec2(textureCoords.x,textureCoords.y),vec2(12.9898,78.233)))*43758.5453123));
	float intermediateRANDTWO = fract(3.0*fract(sin(seed*100.0+1.0 + dot(vec2(textureCoords.x,textureCoords.y),vec2(12.9898,78.233)))*43758.5453123));
	float intermediateRANDTHREE = fract(3.0*fract(sin(seed*200.0+1.0 + dot(vec2(textureCoords.x,textureCoords.y),vec2(12.9898,78.233)))*43758.5453123));
	float intermediateRANDFOUR = fract(3.0*fract(sin(seed*300.0+1.0 + dot(vec2(textureCoords.x,textureCoords.y),vec2(12.9898,78.233)))*43758.5453123));
  float RANDN = sqrt(2.0) * erfinv(2.0 * intermediateRAND - 1.0);
	float RANDNTWO = sqrt(2.0) * erfinv(2.0 * intermediateRANDTWO - 1.0);
  float RANDNTHREE = sqrt(2.0) * erfinv(2.0 * intermediateRANDTHREE - 1.0);
  float RANDNFOUR = sqrt(2.0) * erfinv(2.0 * intermediateRANDFOUR - 1.0);`;
}

// Opt-in research generator. Preserve the legacy path above for upstream presets.
// lowbias32 integer permutation: https://github.com/skeeto/hash-prospector
// Hash the time seed and channel first, then the physical render-target cell.
// Open midpoint uniforms are exactly symmetric in float32: neither endpoint is
// possible, so the inverse-erf -1 special case cannot favor the negative phase.
export function integerGaussianShader() {
  return `
  highp uvec4 gaussianBits = uvec4(floatBitsToUint(seed)) +
    uvec4(0u, 0x9e3779b9u, 0x3c6ef372u, 0xdaa66d2bu);
  gaussianBits ^= gaussianBits >> 16u;
  gaussianBits *= 0x7feb352du;
  gaussianBits ^= gaussianBits >> 15u;
  gaussianBits *= 0x846ca68bu;
  gaussianBits ^= gaussianBits >> 16u;
  highp uint gaussianCell = (uint(gl_FragCoord.y) << 16u) | uint(gl_FragCoord.x);
  gaussianBits ^= uvec4(gaussianCell);
  gaussianBits ^= gaussianBits >> 16u;
  gaussianBits *= 0x7feb352du;
  gaussianBits ^= gaussianBits >> 15u;
  gaussianBits *= 0x846ca68bu;
  gaussianBits ^= gaussianBits >> 16u;
  highp vec4 gaussianUniforms = (vec4(gaussianBits >> 9u) + 0.5) / 8388608.0;
  float intermediateRAND = gaussianUniforms.x;
  float intermediateRANDTWO = gaussianUniforms.y;
  float intermediateRANDTHREE = gaussianUniforms.z;
  float intermediateRANDFOUR = gaussianUniforms.w;
  float RANDN = sqrt(2.0) * erfinv(2.0 * intermediateRAND - 1.0);
  float RANDNTWO = sqrt(2.0) * erfinv(2.0 * intermediateRANDTWO - 1.0);
  float RANDNTHREE = sqrt(2.0) * erfinv(2.0 * intermediateRANDTHREE - 1.0);
  float RANDNFOUR = sqrt(2.0) * erfinv(2.0 * intermediateRANDFOUR - 1.0);`;
}
