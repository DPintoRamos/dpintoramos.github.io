// Published Fig. 2 data, linked to the fixed-lattice VisualPDE experiment.
const NS = 'http://www.w3.org/2000/svg';
const DATA_URL = new URL('./assets/prl-phase-diagram.json', import.meta.url);
let mapCount = 0;

function svgNode(name, attributes = {}, text) {
  const node = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  if (text !== undefined) node.textContent = text;
  return node;
}

/** A point selection restarts the experiment only through the caller's onSelect. */
export async function createPhaseMap(container, { onSelect = () => {} } = {}) {
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error(`Phase diagram could not load (${response.status}).`);
  const data = await response.json();
  const id = `prl-map-${++mapCount}`;
  const abort = new AbortController();
  const extent = data.extent;
  const box = { left: 47, top: 16, width: 486, height: 267 };
  const x = value => box.left + (value - extent.alpha[0]) / (extent.alpha[1] - extent.alpha[0]) * box.width;
  const y = value => box.top + box.height - (value - extent.D[0]) / (extent.D[1] - extent.D[0]) * box.height;
  const clamp = (value, range) => Math.max(range[0], Math.min(range[1], value));
  const format = value => Number(value).toFixed(3).replace(/0$/, '');
  const path = points => points.map(([a, d], index) => `${index ? 'L' : 'M'}${x(a).toFixed(3)},${y(d).toFixed(3)}`).join(' ');
  const colours = Object.fromEntries(data.series.map(series => [series.id, series.colour]));
  let current = { alpha: .5, D: .4 };
  let candidate = null;

  const section = document.createElement('section');
  section.className = 'prl-phase-map';
  section.setAttribute('aria-labelledby', `${id}-title`);
  section.innerHTML = `<div class="phase-map-heading"><h3 id="${id}-title">Explore the phase diagram</h3><output class="phase-map-readout"></output></div><p id="${id}-hint" class="phase-map-hint">Choose a point to restart and run. The sliders follow your selection.</p><p id="${id}-keyboard" class="phase-map-sr">Arrow keys move the marker by 0.01; hold Shift for 0.1. Press Enter or Space to run the selected parameters.</p>`;
  const readout = section.querySelector('output');
  readout.setAttribute('aria-live', 'polite');
  const svg = svgNode('svg', {
    viewBox: '0 0 550 326', tabindex: '0', role: 'application',
    'aria-label': 'Interactive phase diagram: nonreciprocity alpha horizontally, coupling D vertically',
    'aria-describedby': `${id}-hint ${id}-keyboard`,
    class: 'phase-map-plot',
  });
  const defs = svgNode('defs');
  const clip = svgNode('clipPath', { id: `${id}-clip` });
  clip.append(svgNode('rect', { x: box.left, y: box.top, width: box.width, height: box.height }));
  defs.append(clip);
  svg.append(defs);
  svg.append(svgNode('rect', { x: box.left, y: box.top, width: box.width, height: box.height, class: 'phase-map-background' }));

  for (const a of [0, .25, .5, .75, 1, 1.25, 1.5, 1.75]) {
    svg.append(svgNode('line', { x1: x(a), x2: x(a), y1: box.top, y2: box.top + box.height, class: 'phase-map-grid' }));
    svg.append(svgNode('text', { x: x(a), y: box.top + box.height + 19, 'text-anchor': 'middle', class: 'phase-map-tick' }, String(a)));
  }
  for (const d of [.5, 1, 1.5, 2]) {
    svg.append(svgNode('line', { x1: box.left, x2: box.left + box.width, y1: y(d), y2: y(d), class: 'phase-map-grid' }));
    svg.append(svgNode('text', { x: box.left - 9, y: y(d) + 4, 'text-anchor': 'end', class: 'phase-map-tick' }, String(d)));
  }
  svg.append(svgNode('path', { d: `M${box.left},${box.top}V${box.top + box.height}H${box.left + box.width}`, class: 'phase-map-axis' }));
  svg.append(svgNode('text', { x: box.left + box.width / 2, y: 323, 'text-anchor': 'middle', class: 'phase-map-axis-label' }, 'Nonreciprocity α'));
  svg.append(svgNode('text', { x: 14, y: box.top + box.height / 2, transform: `rotate(-90 14 ${box.top + box.height / 2})`, 'text-anchor': 'middle', class: 'phase-map-axis-label' }, 'Coupling D'));

  const chart = svgNode('g', { 'clip-path': `url(#${id}-clip)` });
  for (const curve of data.curves) {
    const line = svgNode('path', { d: path(curve.points), stroke: colours[curve.series], class: 'phase-map-curve' });
    line.append(svgNode('title', {}, curve.formula));
    chart.append(line);
  }
  for (const series of data.series) {
    for (const [alpha, D] of series.points) {
      const point = svgNode('circle', { cx: x(alpha), cy: y(D), r: 3.3, fill: series.colour, class: 'phase-map-data' });
      point.append(svgNode('title', {}, `${series.label}: α = ${format(alpha)}, D = ${format(D)}`));
      chart.append(point);
    }
  }
  for (const region of data.regions) {
    const label = svgNode('text', { x: x(region.alpha), y: y(region.D), 'text-anchor': 'middle', class: `phase-map-region${region.id === 'IV' ? ' phase-map-small-region' : ''}` }, region.id);
    label.append(svgNode('title', {}, `${region.id}: ${region.description}`));
    chart.append(label);
  }
  const critical = data.criticalPoint;
  const starPoints = Array.from({ length: 10 }, (_, i) => {
    const angle = -Math.PI / 2 + i * Math.PI / 5;
    const r = i % 2 ? 3.3 : 7.3;
    return `${x(critical.alpha) + r * Math.cos(angle)},${y(critical.D) + r * Math.sin(angle)}`;
  }).join(' ');
  const star = svgNode('polygon', { points: starPoints, class: 'phase-map-critical' });
  star.append(svgNode('title', {}, 'Critical point: α = D = 0.5'));
  chart.append(star);
  const marker = svgNode('g', { class: 'phase-map-marker', 'pointer-events': 'none' });
  marker.append(svgNode('circle', { r: 8 }), svgNode('path', { d: 'M-13,0H-5M5,0H13M0,-13V-5M0,5V13' }), svgNode('circle', { r: 2, class: 'phase-map-marker-centre' }));
  chart.append(marker);
  svg.append(chart);
  section.append(svg);

  const footer = document.createElement('div');
  footer.className = 'phase-map-footer';
  footer.innerHTML = '<span><i class="phase-map-dot-key"></i> Computed points <i class="phase-map-line-key"></i> Theory</span><a target="_blank" rel="noopener">PRL · Fig. 2 ↗</a>';
  footer.querySelector('a').href = data.source.doi;
  section.append(footer);
  const details = document.createElement('details');
  details.className = 'phase-map-details';
  const summary = document.createElement('summary');
  summary.textContent = 'Read the phase diagram';
  details.append(summary);
  const list = document.createElement('dl');
  for (const region of data.regions) {
    const term = document.createElement('dt');
    term.textContent = region.id;
    const description = document.createElement('dd');
    description.textContent = region.description;
    list.append(term, description);
  }
  details.append(list);
  const note = document.createElement('p');
  note.textContent = 'ω = 1. Green points locate the divergence of the self-assembly wavelength. The star marks α = D = ½.';
  details.append(note);
  section.append(details);
  container.replaceChildren(section);

  function paint() {
    const value = candidate || current;
    marker.setAttribute('transform', `translate(${x(value.alpha)} ${y(value.D)})`);
    marker.classList.toggle('phase-map-candidate', Boolean(candidate));
    readout.textContent = `α = ${format(value.alpha)} · D = ${format(value.D)}${candidate ? ' · Enter to run' : ''}`;
  }
  function select(value) {
    current = { alpha: clamp(value.alpha, extent.alpha), D: clamp(value.D, extent.D) };
    candidate = null;
    paint();
    onSelect({ ...current });
  }
  svg.addEventListener('click', event => {
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const local = point.matrixTransform(matrix.inverse());
    if (local.x < box.left || local.x > box.left + box.width || local.y < box.top || local.y > box.top + box.height) return;
    const alpha = extent.alpha[0] + (local.x - box.left) / box.width * (extent.alpha[1] - extent.alpha[0]);
    const D = extent.D[1] - (local.y - box.top) / box.height * (extent.D[1] - extent.D[0]);
    select({ alpha: Math.round(alpha * 200) / 200, D: Math.round(D * 200) / 200 });
  }, { signal: abort.signal });
  svg.addEventListener('keydown', event => {
    const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowDown: [0, -1], ArrowUp: [0, 1] };
    if (moves[event.key]) {
      event.preventDefault();
      const step = event.shiftKey ? .1 : .01;
      const start = candidate || current;
      candidate = {
        alpha: clamp(Math.round((start.alpha + moves[event.key][0] * step) * 1000) / 1000, extent.alpha),
        D: clamp(Math.round((start.D + moves[event.key][1] * step) * 1000) / 1000, extent.D),
      };
      paint();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      select(candidate || current);
    } else if (event.key === 'Escape') {
      candidate = null;
      paint();
    }
  }, { signal: abort.signal });
  paint();
  return {
    extent,
    setParameters({ alpha, D }) {
      if (!Number.isFinite(Number(alpha)) || !Number.isFinite(Number(D))) return;
      current = { alpha: clamp(Number(alpha), extent.alpha), D: clamp(Number(D), extent.D) };
      candidate = null;
      paint();
    },
    destroy() { abort.abort(); section.remove(); },
  };
}
