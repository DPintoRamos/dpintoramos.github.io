// This worker owns every IBM event. Rendering never advances the random process.
const imports = {env: {
  js_exp: Math.exp, js_log: Math.log, js_cos: Math.cos, js_sqrt: Math.sqrt,
  js_acos: Math.acos, js_floor: Math.floor, js_pow: Math.pow
}};
let core, initialized = false, running = false, seed = 20261102;
let requestedSpeed = 8, lastTick = 0, timer = null, lastFrame = 0;
let rateTime = 0, rateClock = 0, measuredRate = 0;
const engineReady = (async () => {
  const response = await fetch(new URL('./core.wasm?v=5', import.meta.url));
  if (!response.ok) throw new Error(`The simulation engine could not load (${response.status}).`);
  const bytes = await response.arrayBuffer();
  const {instance} = await WebAssembly.instantiate(bytes, imports);
  core = instance.exports;
})();
function halt() {
  running = false;
  if (timer !== null) clearTimeout(timer);
  timer = null;
}
function explainStatus(code) {
  if (code === 2) return 'The population reached the resource guard. The run has paused; no births were silently discarded. Clear or reset to start again.';
  if (code === 1) return 'A simulation parameter was outside its supported range.';
  return 'The simulation stopped after a numerical consistency check failed.';
}
function fail(error) {
  halt();
  if (core && initialized) emitState();
  postMessage({type: 'error', message: error instanceof Error ? error.message : String(error)});
}
function ensureHealthy() {
  const code = core.get_status();
  if (code) throw new Error(explainStatus(code));
}
function emitState() {
  if (!core || !initialized) return;
  const n = core.get_count();
  const source = new Float64Array(core.memory.buffer, core.data_ptr(), n * 2);
  const positions = new Float32Array(source);
  // Float32 can round a coordinate just below L to L: render its periodic twin.
  for (let i = 0; i < positions.length; i++) if (positions[i] >= 20) positions[i] = 0;
  const state = {
    type: 'state', positions, n, t: core.get_time(), p: core.get_p(),
    dispersal: core.get_dispersal(), z: core.get_z(), peak: core.get_norm(),
    births: core.get_births(), deaths: core.get_deaths(), intrinsicDeaths: core.get_intrinsic_deaths(),
    candidates: core.get_candidates(), nullEvents: core.get_null_events(), proposals: core.get_proposals(),
    running, seed, stepsPerSecond: measuredRate, requestedSpeed, status: core.get_status(),
    capacity: core.get_capacity(), birthRate: core.get_birth_rate(), deathRate: core.get_death_rate(),
    hoiStrength: core.get_hoi_strength(), hoiRadius: core.get_hoi_radius(),
    competitionStrength: 1, domain: 20, competitionRadius: core.get_competition_radius()
  };
  postMessage(state, [positions.buffer]);
  lastFrame = performance.now();
}
function refreshRate(now) {
  if (now - rateTime >= 500) {
    measuredRate = (core.get_time() - rateClock) * 1000 / (now - rateTime);
    rateTime = now;
    rateClock = core.get_time();
  }
}
function tick() {
  timer = null;
  if (!running) return;
  const now = performance.now();
  // No wall-clock backlog is accumulated if this device cannot keep up.
  const elapsed = Math.min(.05, Math.max(0, (now - lastTick) / 1000));
  lastTick = now;
  const target = core.get_time() + requestedSpeed * elapsed;
  const deadline = now + 9;
  try {
    do {
      const result = core.advance_to(target, 768);
      ensureHealthy();
      if (result === 1) break;
    } while (performance.now() < deadline);
    refreshRate(performance.now());
    if (performance.now() - lastFrame >= 50) emitState();
    if (!core.get_count()) { halt(); emitState(); return; }
    timer = setTimeout(tick, 8);
  } catch (error) { fail(error); }
}
function play() {
  ensureHealthy();
  if (running) return;
  running = true;
  lastTick = performance.now();
  rateTime = lastTick;
  rateClock = core.get_time();
  measuredRate = 0;
  emitState();
  timer = setTimeout(tick, 0);
}
function applyParameters(message) {
  if (message.p !== undefined || message.competitionRadius !== undefined) {
    const exponent = Number(message.p ?? core.get_p());
    const radius = Number(message.competitionRadius ?? core.get_competition_radius());
    core.set_pair_kernel(exponent, radius);
  }
  if (message.dispersal !== undefined) core.set_dispersal(Number(message.dispersal));
  if (message.birthRate !== undefined) core.set_birth_rate(Number(message.birthRate));
  if (message.hoiRadius !== undefined) core.set_hoi_radius(Number(message.hoiRadius));
  if (message.hoiStrength !== undefined) core.set_hoi_strength(Number(message.hoiStrength));
  ensureHealthy();
}
async function handle(message) {
  await engineReady;
  const type = message?.type;
  if (type === 'init') {
    halt();
    seed = Number(message.seed ?? 20261102) >>> 0;
    core.init(seed);
    initialized = true;
    applyParameters(message);
    emitState();
    postMessage({type: 'ready'});
    if (message.autoplay) play();
    return;
  }
  if (!initialized) throw new Error('Initialize the simulation first.');
  if (type === 'play') play();
  else if (type === 'pause') { halt(); measuredRate = 0; emitState(); }
  else if (type === 'parameters') { applyParameters(message); emitState(); }
  else if (type === 'speed') {
    const value = Number(message.value);
    if (!Number.isFinite(value) || value < .1 || value > 100) throw new Error('Simulation speed must lie between 0.1 and 100.');
    requestedSpeed = value;
    lastTick = performance.now();
    emitState();
  } else if (type === 'reset') {
    halt();
    if (message.seed !== undefined) seed = Number(message.seed) >>> 0;
    core.init(seed);
    applyParameters(message);
    measuredRate = 0;
    emitState();
    if (message.autoplay) play();
  } else if (type === 'clear') {
    halt(); core.clear(); measuredRate = 0; emitState();
  } else if (type === 'add') {
    core.add_patch(Number(message.x), Number(message.y), Math.trunc(Number(message.count ?? 8)), Number(message.radius ?? .2));
    ensureHealthy(); emitState();
  } else if (type === 'step') {
    halt();
    const dt = Number(message.dt ?? .5);
    if (!Number.isFinite(dt) || dt <= 0 || dt > 10) throw new Error('A step must advance between 0 and 10 model time units.');
    const target = core.get_time() + dt;
    // Cooperative yielding keeps parameter/pause messages responsive during a long step.
    await advanceStep(target);
  } else if (type === 'snapshot') emitState();
}
let stepGeneration = 0;
async function advanceStep(target) {
  const generation = ++stepGeneration;
  while (generation === stepGeneration && core.get_time() < target) {
    const deadline = performance.now() + 9;
    do {
      const result = core.advance_to(target, 768);
      ensureHealthy();
      if (result === 1) break;
    } while (performance.now() < deadline);
    emitState();
    if (core.get_time() < target) await new Promise(resolve => setTimeout(resolve, 0));
  }
}
self.onmessage = event => {
  // Any new command cancels an unfinished single-step operation at its current time.
  if (event.data?.type !== 'snapshot') ++stepGeneration;
  handle(event.data).catch(fail);
};
engineReady.catch(fail);
