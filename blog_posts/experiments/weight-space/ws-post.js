// Figures and small simulations for /blog_posts/weight-space-programming-explained.html.
// Each <figure class="hv" data-hv="name"> holds a text fallback; the matching builder below
// replaces it with an SVG or widget. The toy figures run the real algorithms (gradient descent,
// evolution strategies, TIES-merging, fast-weight outer-product writes) on fixed inputs, so what
// you see is what the algorithm does. Numbers for real models are computed from their configs or
// quoted from the papers cited in the article.
(function () {
  'use strict';

  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  const svg = (w, h, label, inner) =>
    `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">${inner}</svg>`;
  const text = (x, y, s, cls = '', anchor = 'start') =>
    `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${s}</text>`;
  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function onVisible(el, fn) {
    if (!('IntersectionObserver' in window)) return fn();
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { io.disconnect(); fn(); } }, { threshold: 0.35 });
    io.observe(el);
  }

  // ── The toy model used by the landscape, gradient descent and ES figures ──
  // f(x) = w2 * tanh(w1 * x), fit to 21 points of y = 1.5 tanh(x) on [-2, 2] with mean squared error.
  // Two weights, so the whole weight space is a plane we can draw. Minima: (1, 1.5) and (-1, -1.5).
  const XS = Array.from({ length: 21 }, (_, i) => -2 + i * 0.2);
  const YS = XS.map((x) => 1.5 * Math.tanh(x));
  const loss = (a, b) => XS.reduce((s, x, i) => s + (b * Math.tanh(a * x) - YS[i]) ** 2, 0) / XS.length;
  const grad = (a, b) => {
    let ga = 0, gb = 0;
    XS.forEach((x, i) => { const t = Math.tanh(a * x), r = b * t - YS[i]; ga += 2 * r * b * (1 - t * t) * x; gb += 2 * r * t; });
    return [ga / XS.length, gb / XS.length];
  };
  const START = [2.6, -2.2];
  const R = 3; // plot range [-R, R] for both weights
  function gdPath(steps, lr) {
    let p = START.slice(); const out = [p.slice()];
    for (let k = 0; k < steps; k++) { const g = grad(p[0], p[1]); p = [p[0] - lr * g[0], p[1] - lr * g[1]]; out.push(p.slice()); }
    return out;
  }
  // seeded RNG so every reader sees the same run
  function mulberry32(s) {
    return () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  // Evolution strategies as in Qiu et al. (2025), Algorithm 2: perturb, score, z-score, step.
  function esRun(gens, N, sigma, alpha, seed) {
    const rnd = mulberry32(seed);
    const gauss = () => { let u = 0; while (!u) u = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd()); };
    let q = START.slice(); const out = [];
    for (let g = 0; g < gens; g++) {
      const E = [], Rw = [];
      for (let n = 0; n < N; n++) { const e = [gauss(), gauss()]; E.push(e); Rw.push(-loss(q[0] + sigma * e[0], q[1] + sigma * e[1])); }
      const m = Rw.reduce((a, b) => a + b) / N;
      const sd = Math.sqrt(Rw.reduce((a, b) => a + (b - m) ** 2, 0) / N) || 1;
      const Z = Rw.map((r) => (r - m) / sd);
      const pop = E.map((e) => [q[0] + sigma * e[0], q[1] + sigma * e[1]]);
      const next = [q[0] + (alpha / N) * Z.reduce((a, z, n) => a + z * E[n][0], 0), q[1] + (alpha / N) * Z.reduce((a, z, n) => a + z * E[n][1], 0)];
      out.push({ center: q, pop, Z, next });
      q = next;
    }
    return out;
  }

  // loss heatmap: darker accent = lower loss (log scale), drawn once per figure
  function heat(S, n) {
    const c = S / n; let g = '';
    const lo = Math.log(0.002), hi = Math.log(12);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const a = -R + (i + 0.5) * (2 * R / n), b = R - (j + 0.5) * (2 * R / n);
      const t = 1 - Math.min(1, Math.max(0, (Math.log(loss(a, b) + 0.002) - lo) / (hi - lo)));
      g += `<rect x="${(i * c).toFixed(1)}" y="${(j * c).toFixed(1)}" width="${(c + 0.4).toFixed(1)}" height="${(c + 0.4).toFixed(1)}" class="ws-heat" opacity="${(0.06 + 0.8 * t * t).toFixed(2)}"/>`;
    }
    return g;
  }
  const toPx = (S) => (p) => [((p[0] + R) / (2 * R)) * S, ((R - p[1]) / (2 * R)) * S];
  const axes = (S) =>
    `<line x1="${S / 2}" y1="0" x2="${S / 2}" y2="${S}" class="axis" opacity="0.5"/><line x1="0" y1="${S / 2}" x2="${S}" y2="${S / 2}" class="axis" opacity="0.5"/>` +
    text(S - 4, S / 2 - 6, 'w₁', 'mut', 'end') + text(S / 2 + 6, 14, 'w₂', 'mut');
  const poly = (pts, cls, extra = '') => `<polyline points="${pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ')}" class="${cls}" ${extra}/>`;

  // small plot of the model's curve against the data, for a given (w1, w2)
  function curve(a, b, W, H) {
    const sx = (x) => ((x + 2) / 4) * (W - 20) + 10, sy = (y) => H / 2 - (y / 3.2) * (H / 2 - 8);
    let g = `<line x1="10" y1="${H / 2}" x2="${W - 10}" y2="${H / 2}" class="axis" opacity="0.4"/>`;
    XS.forEach((x, i) => { g += `<circle cx="${sx(x).toFixed(1)}" cy="${sy(YS[i]).toFixed(1)}" r="3" class="ws-data"/>`; });
    const pts = []; for (let k = 0; k <= 60; k++) { const x = -2 + k / 15; pts.push([sx(x), sy(b * Math.tanh(a * x))]); }
    return g + poly(pts, 'ws-model');
  }

  const builders = {};

  // ── 1. Weight space: every point is a model ─────────────────────────────
  builders.landscape = (el) => {
    const S = 300, P = toPx(S);
    const base = heat(S, 48) + axes(S);
    const minima = [[1, 1.5], [-1, -1.5]].map((m) => { const p = P(m); return `<path d="M${p[0] - 6} ${p[1]}h12M${p[0]} ${p[1] - 6}v12" class="ws-star"/>`; }).join('');
    let pick = [-0.4, 2.2];
    const gd = gdPath(150, 0.3);
    el.innerHTML =
      '<div class="hv-controls"><button type="button" class="hv-btn" data-a="gd">▶ Run gradient descent</button><span class="mut-s">or tap anywhere on the map to pick a model</span></div>' +
      '<div class="hv-panels ws-two">' +
      `<div class="hv-panel"><h4>Weight space (2 weights)</h4><div class="ws-map">${svg(S, S, 'Loss landscape over two weights w1 and w2; darker means lower loss. Two minima at (1, 1.5) and (-1, -1.5).', `<g>${base}${minima}</g><g class="ws-layer"></g>`)}</div></div>` +
      '<div class="hv-panel"><h4>The model at that point</h4><div class="ws-curve"></div><div class="hv-tiles ws-tiles-sm"><div class="hv-tile"><b class="ws-w"></b><span>(w₁, w₂)</span></div><div class="hv-tile"><b class="ws-l"></b><span>loss (lower is better)</span></div></div></div>' +
      '</div>' +
      '<div class="hv-legend"><span><i class="sq" style="background:var(--accent)"></i>darker = lower loss</span><span><i class="ln" style="background:var(--ws-move)"></i>gradient descent path</span><span><i style="background:var(--ws-pick)"></i>selected model</span><span>+ the two perfect models</span><span><i style="background:var(--muted)"></i>data</span><span><i class="ln" style="background:var(--ws-pick)"></i>model\'s curve</span></div>';
    const layer = el.querySelector('.ws-layer'), svgEl = el.querySelector('.ws-map svg');
    const show = (p, path) => {
      const q = P(p);
      layer.innerHTML = (path ? poly(path.map(P), 'ws-path') : '') + `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="7" class="ws-pickdot"/>`;
      el.querySelector('.ws-curve').innerHTML = svg(260, 150, `The model's curve for w1 = ${p[0].toFixed(2)}, w2 = ${p[1].toFixed(2)} against the 21 data points`, curve(p[0], p[1], 260, 150));
      el.querySelector('.ws-w').textContent = `(${p[0].toFixed(2)}, ${p[1].toFixed(2)})`;
      el.querySelector('.ws-l').textContent = (l => l < 0.01 ? l.toFixed(4) : l.toFixed(3))(loss(p[0], p[1]));
    };
    svgEl.addEventListener('click', (ev) => {
      const r = svgEl.getBoundingClientRect();
      pick = [((ev.clientX - r.left) / r.width) * 2 * R - R, R - ((ev.clientY - r.top) / r.height) * 2 * R];
      show(pick);
    });
    let timer = null;
    el.querySelector('[data-a="gd"]').addEventListener('click', () => {
      clearInterval(timer);
      if (reduced()) return show(gd[gd.length - 1], gd);
      let k = 1;
      timer = setInterval(() => { show(gd[k], gd.slice(0, k + 1)); k += 2; if (k >= gd.length) { clearInterval(timer); show(gd[gd.length - 1], gd); } }, 30);
    });
    show(pick);
  };

  // ── 2. How big is a small LLM's weight space? (Qwen2.5-0.5B, from its config.json) ──
  const QWEN = { d: 896, kv: 128, ff: 4864, L: 24, vocab: 151936 };
  const qwenTotal = (() => {
    const { d, kv, ff, L, vocab } = QWEN;
    const layer = (d * d + d) + 2 * (d * kv + kv) + d * d + 3 * d * ff + 2 * d;
    return vocab * d + L * layer + d; // tied embeddings
  })();
  const loraParams = (r) => QWEN.L * (r * (QWEN.d + QWEN.d) + r * (QWEN.d + QWEN.kv)); // q_proj and v_proj
  // Sparks of Weight-Space Programming (Takehi, Teoh, Zhang, Khattab; MIT CSAIL, Nov 2026)
  const SPARKS = {
    qwen: { // Qwen3.5-0.8B, thinking on, up to 32,768 tokens
      metrics: ['MATH-500', 'GSM8K', 'IFEval', 'Hit token limit'],
      base: [7.9, 13.8, 21.0, 93.0],
      edited: { 10: [12.3, 25.7, 49.0, 87.2], 25: [14.1, 25.1, 39.9, 86.4], 50: [48.1, 67.1, 62.3, 33.1] }
    },
    games: [ // MinAtar, 1,000 episodes; network 600→32→32→6 written from zero weights
      ['Breakout', 15.8, 25.3, 517.4], ['Seaquest', 5.6, 88.9, 53.1], ['Asterix', 25.8, 55.2, 53.2]
    ]
  };
  const QWEN35 = { d: 1024, ff: 3584, L: 24, cols: 64, layers: [15, 19], total: 0.8e9 };
  builders.summary = (el) => {
    const edited = QWEN35.cols * QWEN35.d * QWEN35.layers.length;
    el.innerHTML = '<div class="hv-tiles">' +
      `<div class="hv-tile"><b>${fmt(edited)}</b><span>weights an LLM changed in Qwen3.5-0.8B (${(100 * edited / QWEN35.total).toFixed(3)}%), with no training</span></div>` +
      '<div class="hv-tile"><b>7.9% → 48.1%</b><span>Qwen3.5-0.8B on MATH-500 after that edit</span></div>' +
      '<div class="hv-tile"><b>0 → 1,024</b><span>successful episodes of a stuck physics policy after a one-shot edit to 3.5% of its weights</span></div>' +
      '<div class="hv-tile"><b>517 vs 25</b><span>Breakout score: network written by the LLM from zero vs PPO after 500M steps</span></div>' +
      '</div>';
  };

  // ── Who writes weights: optimizer, compiler, or a reasoning LLM ─────────
  builders.writers = (el) => {
    const card = (t, inp, how, out, cls) => `<div class="hv-panel ws-writer ${cls}"><h4>${t}</h4><div class="ws-flow"><span class="hv-chip">${inp}</span><span class="ws-down">↓</span><span class="hv-chip ${cls === 'new' ? 'up' : ''}">${how}</span><span class="ws-down">↓</span><span class="hv-chip">${out}</span></div></div>`;
    el.innerHTML = '<div class="hv-panels">' +
      card('Optimizer', 'data + loss', 'millions of small gradient steps', 'weights nobody designed', '') +
      card('Compiler', 'a formal program', 'fixed translation rules (e.g. Tracr)', 'weights that run that program', '') +
      card('Weight-space programming', 'weights + a goal in English', 'an LLM reads, explains and edits them', 'a targeted edit, or a new network', 'new') +
      '</div>';
  };

  // ── What an LLM read from raw weights (Experiments 1, 2, 3, 7) ──────────
  builders.read = (el) => {
    const marks = (ok, n) => Array.from({ length: n }, (_, i) => i < ok ? '<i class="ok">✓</i>' : '<i class="miss">✗</i>').join('');
    const card = (t, given, res) => `<div class="hv-panel"><h4>${t}</h4><p class="ws-given">${given}</p>${res}</div>`;
    const row = (label, ok, n) => `<div class="ws-marks"><span>${label}</span><span class="ws-dots">${marks(ok, n)}</span><b>${ok}/${n}</b></div>`;
    el.innerHTML = '<div class="hv-panels">' +
      card('Which game was it trained on?', 'Weights of 4 PPO game agents (17,253 weights each), plus an unnamed grid description', row('game named', 4, 4)) +
      card('What does this diffusion model draw?', '3 tiny DDPMs (23,824 weights each), no forward passes', row('shape named', 3, 3)) +
      card('Which language, which heads copy?', 'Middle 4 blocks of 3 character-level transformers (7.2M weights)', row('language named', 3, 3) + row('copying heads found', 5, 5)) +
      card('Which model is the sycophant?', '3 pairs of Gemma 3 270M fine-tunes', row('weights only', 0, 4) + row('+ attention patterns', 3, 3)) +
      '</div><div class="hv-legend"><span>✓ correct</span><span>✗ failed attempt</span><span>Results as reported by the authors</span></div>';
  };

  // ── Removing one direction from MLP output columns (Experiment 8 idea) ──
  builders.ablate = (el) => {
    // illustrative 2-D version: u = the "loop" direction; columns = what each MLP neuron writes
    const U = [Math.cos(0.5), Math.sin(0.5)];
    const COLS = [[0.9, 0.7], [0.5, 0.95], [-0.3, 0.8], [1.0, 0.2], [0.75, -0.35], [-0.6, 0.45], [0.2, -0.9], [0.95, 0.85]];
    const dot2 = (a, b) => a[0] * b[0] + a[1] * b[1];
    el.innerHTML = '<div class="hv-controls"><label>remove the direction <input type="range" min="0" max="100" value="0" aria-label="How much of the loop direction to remove"><output>0%</output></label></div><div class="ws-abl"></div>';
    const inp = el.querySelector('input');
    const draw = () => {
      const t = inp.value / 100, S = 120, C = [150, 140];
      const P = (v) => [C[0] + v[0] * S, C[1] - v[1] * S];
      const cols = COLS.map((w) => { const k = dot2(w, U); return [w[0] - t * k * U[0], w[1] - t * k * U[1]]; });
      let g = `<rect x="0" y="0" width="300" height="280" rx="8" class="ws-plane"/>`;
      const a = P([-1.25 * U[0], -1.25 * U[1]]), b = P([1.25 * U[0], 1.25 * U[1]]);
      g += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" class="ws-udir"/>` + text(a[0] + 2, a[1] + 22, 'loop direction u', 'lbl');
      cols.forEach((w) => { const q = P(w); g += `<line x1="${C[0]}" y1="${C[1]}" x2="${q[0].toFixed(1)}" y2="${q[1].toFixed(1)}" class="ws-col" marker-end="url(#ws-ah)"/>`; });
      g += `<circle cx="${C[0]}" cy="${C[1]}" r="4" class="ws-pt"/>`;
      const along = cols.reduce((sum, w) => sum + Math.abs(dot2(w, U)), 0), before = COLS.reduce((sum, w) => sum + Math.abs(dot2(w, U)), 0);
      el.querySelector('.ws-abl').innerHTML = `<div class="hv-panels ws-two"><div class="hv-panel"><div class="ws-fit" style="max-width:340px">${svg(300, 280, 'Eight MLP output columns drawn as arrows; sliding removes their component along the loop direction', g)}</div></div>` +
        `<div class="hv-panel"><div class="hv-tiles ws-tiles-sm"><div class="hv-tile"><b>${(100 * along / before).toFixed(0)}%</b><span>of the original push along u left in these 8 columns</span></div><div class="hv-tile"><b>${fmt(QWEN35.cols * QWEN35.d * 2)}</b><span>weights changed in the real edit</span></div><div class="hv-tile"><b>64 of ${fmt(QWEN35.ff)}</b><span>down_proj columns per layer, in layers 15 and 19</span></div><div class="hv-tile"><b>${fmt(QWEN35.d)}</b><span>numbers per column (the hidden size)</span></div></div>` +
        '<p class="ws-note">Each column is what one MLP neuron adds to the model\'s running state. Removing the loop direction leaves everything else the neuron writes intact.</p></div></div>';
      el.querySelector('output').textContent = `${Math.round(t * 100)}%`;
    };
    inp.addEventListener('input', draw); draw();
  };

  // ── Qwen3.5-0.8B results by forward-pass budget ─────────────────────────
  builders.qwen = (el) => {
    el.innerHTML = '<div class="hv-controls" role="group" aria-label="Forward passes Astra could use"><span class="mut-s">forward passes allowed:</span>' +
      [10, 25, 50].map((n) => `<button type="button" class="hv-btn" data-n="${n}" aria-pressed="${n === 50}">${n}</button>`).join('') + '</div><div class="ws-qwen"></div>' +
      '<div class="hv-legend"><span><i class="sq" style="background:var(--muted)"></i>base Qwen3.5-0.8B</span><span><i class="sq" style="background:var(--accent)"></i>after the edit</span><span>Hit token limit: lower is better</span></div>';
    const draw = (n) => {
      const Q = SPARKS.qwen, E = Q.edited[n];
      let h = '';
      Q.metrics.forEach((m, i) => {
        const bar = (v, cls) => `<div class="ws-hbar"><i class="${cls}" style="width:${v}%"></i><span>${v.toFixed(1)}%</span></div>`;
        h += `<div class="ws-qrow"><div class="ws-qlab">${m}${i === 3 ? ' <small>(lower is better)</small>' : ''}</div><div>${bar(Q.base[i], 'b')}${bar(E[i], 'e')}</div></div>`;
      });
      el.querySelector('.ws-qwen').innerHTML = h;
      el.querySelectorAll('[data-n]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.n === n)));
    };
    el.querySelectorAll('[data-n]').forEach((b) => b.addEventListener('click', () => draw(+b.dataset.n)));
    draw(50);
  };

  // ── Networks written from scratch vs PPO ────────────────────────────────
  builders.scratch = (el) => {
    let h = '<div class="hv-panels">';
    SPARKS.games.forEach(([g, p1, p5, a]) => {
      const mx = Math.max(p1, p5, a);
      const bar = (lab, v, cls) => `<div class="ws-srow"><span>${lab}</span><div class="ws-hbar"><i class="${cls}" style="width:${(100 * v / mx).toFixed(1)}%"></i><span>${v.toFixed(1)}</span></div></div>`;
      h += `<div class="hv-panel"><h4>${g}</h4>${bar('PPO, 100M steps', p1, 'b')}${bar('PPO, 500M steps', p5, 'b2')}${bar('LLM, one shot', a, 'e')}</div>`;
    });
    h += '</div><div class="hv-legend"><span><i class="sq" style="background:var(--accent)"></i>written by the LLM from zero weights, no data or gradients</span><span>Mean score over 1,000 episodes; each panel has its own scale</span></div>';
    el.innerHTML = h;
  };

  // ── Limits ──────────────────────────────────────────────────────────────
  builders.limits = (el) => {
    const card = (t, p) => `<div class="hv-panel"><h4>${t}</h4><p>${p}</p></div>`;
    el.innerHTML = '<div class="hv-panels ws-six">' +
      card('Can\'t add what isn\'t there', 'On Gemma 3 270M, which had no single faulty part, MATH-500 moved only from 6.8% to 7.0-7.7%.') +
      card('Feedback matters', 'Qwen gained little with 10 or 25 forward passes; the big jump came at 50.') +
      card('Weights alone weren\'t enough', 'Spotting the sycophantic model failed 4 of 4 times from weights; it worked once attention patterns were allowed.') +
      card('Small networks, big context', 'Many experiments needed the whole network in the LLM\'s context; the authors call context length a bottleneck.') +
      card('Early and unreviewed', 'A blog post, not a paper; the model is an unreleased "GPT-6 Astra"; baselines used best-of-3 to 10 seeds.') +
      card('But checkable', 'Full logs are public, and an independent re-run of the edited Qwen scored 51.0% on MATH-500.') +
      '</div>';
  };

  // ── 3. Six ways to move a model in weight space ─────────────────────────
  builders.moves = (el) => {
    const W = 220, H = 120;
    const base = '<ellipse cx="110" cy="62" rx="98" ry="48" class="ws-blob"/>';
    const dotp = (x, y, cls = 'ws-pt') => `<circle cx="${x}" cy="${y}" r="5" class="${cls}"/>`;
    const arrow = (x1, y1, x2, y2, cls = 'ws-arrow') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}" marker-end="url(#ws-ah)"/>`;
    const pics = {
      train: base + poly([[30, 90], [55, 78], [72, 60], [95, 52], [120, 50], [150, 58]], 'ws-path') + dotp(30, 90) + dotp(150, 58, 'ws-pt hit'),
      lora: base + `<line x1="20" y1="96" x2="200" y2="28" class="ws-sub"/>` + dotp(50, 85) + arrow(50, 85, 140, 51) + dotp(146, 49, 'ws-pt hit'),
      merge: base + dotp(110, 95) + dotp(45, 40) + dotp(175, 40) + arrow(110, 95, 50, 44, 'ws-arrow thin') + arrow(110, 95, 170, 44, 'ws-arrow thin') + arrow(110, 95, 110, 28) + dotp(110, 24, 'ws-pt hit'),
      search: base + [[-22, -10], [18, -16], [25, 12], [-14, 20], [2, -26], [-28, 10], [10, 24]].map((o) => `<circle cx="${80 + o[0]}" cy="${70 + o[1]}" r="3.5" class="ws-pop"/>`).join('') + dotp(80, 70) + arrow(80, 70, 140, 48) + dotp(146, 46, 'ws-pt hit'),
      generate: base + `<rect x="10" y="12" width="64" height="26" rx="6" class="ws-box"/>` + text(42, 30, '“text”', 'mut', 'middle') + arrow(74, 30, 140, 66) + dotp(146, 70, 'ws-pt hit'),
      edit: base + dotp(110, 62) + `<circle cx="110" cy="62" r="18" class="ws-ring"/>` + arrow(110, 62, 126, 50) + dotp(129, 48, 'ws-pt hit'),
      reason: base + `<rect x="8" y="10" width="56" height="26" rx="6" class="ws-box hot"/>` + text(36, 28, 'LLM', 'lbl', 'middle') + dotp(70, 80) + `<path d="M64 30 Q 70 55 70 72" class="ws-arrow thin"/>` + arrow(70, 80, 150, 52) + dotp(156, 50, 'ws-pt hit')
    };
    const card = (k, t, how, ex) => `<div class="hv-panel"><h4>${t}</h4>${svg(W, H, t, pics[k])}<p><strong>How:</strong> ${how}</p><p><strong>Example:</strong> ${ex}</p></div>`;
    el.innerHTML = '<div class="hv-panels ws-six">' +
      card('train', '1. Train', 'follow the gradient downhill, many small steps', 'fine-tuning, RL') +
      card('lora', '2. Adapt in a subspace', 'move only along a few low-rank directions', 'LoRA') +
      card('merge', '3. Combine', 'add, subtract or average finished models', 'task arithmetic, TIES, model soups') +
      card('search', '4. Search', 'try random nudges, keep what scores well; no gradients', 'evolution strategies') +
      card('generate', '5. Generate', 'a network writes the weights from a description', 'Text-to-LoRA, Drag-and-Drop LLMs') +
      card('edit', '6. Edit', 'change a few weights to rewrite one fact or behavior', 'ROME, MEMIT') +
      card('reason', '7. Reason', 'an LLM reads the weights, explains them, and edits them by hand', 'weight-space programming') +
      '</div><div class="hv-legend"><span><i style="background:var(--ws-move)"></i>start model</span><span><i style="background:var(--accent)"></i>result</span><span><i class="sq" style="background:var(--surface-2);border:1px solid var(--border)"></i>region of good models</span></div>';
  };

  // ── 4. LoRA: a big matrix update as two thin matrices ───────────────────
  builders.lora = (el) => {
    el.innerHTML = '<div class="hv-controls"><label>rank r <input type="range" min="1" max="64" value="8" aria-label="LoRA rank"><output>8</output></label></div><div class="ws-lora"></div><div class="hv-tiles ws-lora-t"></div>';
    const inp = el.querySelector('input'), out = el.querySelector('output');
    const draw = () => {
      const r = +inp.value, d = QWEN.d, S = 130, w = Math.max(2, (r / d) * S), T = 24;
      const full = d * d, low = r * (d + d), bx = 170, ax = bx + w + 22;
      const g =
        `<rect x="4" y="${T}" width="${S}" height="${S}" rx="3" class="ws-mat"/>` + text(4 + S / 2, T - 8, 'ΔW: 896 × 896', 'lbl', 'middle') +
        text(4 + S / 2, T + S / 2 + 5, fmt(full), 'mut', 'middle') +
        text(152, T + S / 2 + 6, '≈', 'big', 'middle') +
        `<rect x="${bx}" y="${T}" width="${w.toFixed(1)}" height="${S}" rx="2" class="ws-lowr"/>` + text(bx, T + S + 18, `B: 896 × ${r}`, 'lbl') +
        text(bx + w + 11, T + S / 2 + 6, '×', 'big', 'middle') +
        `<rect x="${ax.toFixed(1)}" y="${T}" width="${S}" height="${w.toFixed(1)}" rx="2" class="ws-lowr"/>` + text(ax, T - 8, `A: ${r} × 896`, 'lbl') +
        text(ax, T + w + 22, `${fmt(low)}`, 'lbl') + text(ax, T + w + 40, 'numbers to train', 'mut');
      el.querySelector('.ws-lora').innerHTML = `<div class="ws-fit" style="max-width:520px">${svg(340, 178, `A 896 by 896 update matrix approximated by B (896 by ${r}) times A (${r} by 896)`, g)}</div>`;
      out.textContent = r;
      const all = loraParams(r);
      el.querySelector('.ws-lora-t').innerHTML =
        `<div class="hv-tile"><b>${(full / low).toFixed(0)}×</b><span>fewer numbers for this one matrix</span></div>` +
        `<div class="hv-tile"><b>${fmt(all)}</b><span>LoRA weights on q_proj + v_proj, all 24 layers</span></div>` +
        `<div class="hv-tile"><b>${(100 * all / qwenTotal).toFixed(2)}%</b><span>of Qwen2.5-0.5B's ${fmt(qwenTotal)} weights</span></div>` +
        `<div class="hv-tile"><b>${(all * 2 / 1e6).toFixed(2)} MB</b><span>adapter file in 16-bit</span></div>`;
    };
    inp.addEventListener('input', draw); draw();
  };

  // ── 5. Task arithmetic: skills as arrows ────────────────────────────────
  builders.arith = (el) => {
    // illustrative 2-D picture of a very high-dimensional idea
    const O = [100, 180], TA = [100, -20], TB = [35, -85];
    el.innerHTML = '<div class="hv-controls"><label>λ (scale) <input type="range" min="0" max="15" value="10" aria-label="Scaling coefficient lambda"><output>1.0</output></label>' +
      '<label><select aria-label="Operation"><option value="add">add math + code</option><option value="math">math only</option><option value="neg">subtract code</option></select></label></div><div class="ws-arith"></div>' +
      '<div class="hv-legend"><span><i style="background:var(--ws-move)"></i>pre-trained base θ₀</span><span><i class="ln" style="background:var(--ws-a)"></i>τ_math</span><span><i class="ln" style="background:var(--ws-b)"></i>τ_code</span><span><i style="background:var(--accent)"></i>edited model</span></div>';
    const inp = el.querySelector('input'), sel = el.querySelector('select');
    const draw = () => {
      const l = inp.value / 10, op = sel.value;
      const v = op === 'add' ? [TA[0] + TB[0], TA[1] + TB[1]] : op === 'math' ? TA : [-TB[0], -TB[1]];
      const R2 = [O[0] + l * v[0], O[1] + l * v[1]];
      const ar = (a, b, cls) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" class="${cls}" marker-end="url(#ws-ah)"/>`;
      const A = [O[0] + TA[0], O[1] + TA[1]], B = [O[0] + TB[0], O[1] + TB[1]];
      let g = '<rect x="0" y="0" width="340" height="320" rx="8" class="ws-plane"/>' +
        ar(O, A, 'ws-va') + ar(O, B, 'ws-vb') +
        `<circle cx="${A[0]}" cy="${A[1]}" r="5" class="ws-dot-a"/>` + text(A[0] + 8, A[1] + 16, 'θ_math', 'mut') +
        `<circle cx="${B[0]}" cy="${B[1]}" r="5" class="ws-dot-b"/>` + text(B[0] + 8, B[1] - 4, 'θ_code', 'mut');
      if (op === 'add') g += `<line x1="${A[0]}" y1="${A[1]}" x2="${A[0] + TB[0]}" y2="${A[1] + TB[1]}" class="ws-vb" stroke-dasharray="4 4" opacity="0.6"/>`;
      g += ar(O, R2, 'ws-vr') + `<circle cx="${O[0]}" cy="${O[1]}" r="6" class="ws-pt"/>` + text(O[0] - 4, O[1] + 22, 'θ₀ (base)', 'lbl', 'middle') +
        `<circle cx="${R2[0].toFixed(1)}" cy="${R2[1].toFixed(1)}" r="7" class="ws-pt hit"/>`;
      const lab = op === 'add' ? `θ₀ + ${l.toFixed(1)}·(τ_math + τ_code)` : op === 'math' ? `θ₀ + ${l.toFixed(1)}·τ_math` : `θ₀ − ${l.toFixed(1)}·τ_code`;
      el.querySelector('.ws-arith').innerHTML = `<div class="ws-fit" style="max-width:440px">${svg(340, 320, 'Task vectors drawn as arrows from the base model; the edited model is the base plus a scaled sum of arrows', g)}</div><p class="ws-formula">edited model = <strong>${lab}</strong></p>`;
      el.querySelector('output').textContent = l.toFixed(1);
    };
    inp.addEventListener('input', draw); sel.addEventListener('change', draw); draw();
  };

  // ── 6. TIES-merging on three 8-weight task vectors ──────────────────────
  const TV = [[0.9, -0.1, 0.5, 0.05, -0.7, 0.2, 0.0, 0.6], [0.8, 0.6, -0.4, 0.1, -0.05, -0.8, 0.3, 0.02], [-0.3, 0.7, -0.5, 0.0, -0.6, 0.1, 0.05, 0.7]];
  function ties(T, keep) {
    const trim = T.map((t) => { const th = [...t].map(Math.abs).sort((a, b) => b - a)[keep - 1]; return t.map((v) => (Math.abs(v) >= th ? v : 0)); });
    const sign = T[0].map((_, j) => Math.sign(trim.reduce((s, t) => s + t[j], 0)));
    const merged = T[0].map((_, j) => { const ag = trim.map((t) => t[j]).filter((v) => v !== 0 && Math.sign(v) === sign[j]); return ag.length ? ag.reduce((a, b) => a + b) / ag.length : 0; });
    const avg = T[0].map((_, j) => T.reduce((s, t) => s + t[j], 0) / T.length);
    return { trim, sign, merged, avg };
  }
  builders.ties = (el) => {
    const res = ties(TV, 4);
    const steps = ['1. Task vectors', '2. Trim (keep top 4 of 8)', '3. Elect sign', '4. Merge agreeing values'];
    let step = 0;
    el.innerHTML = '<div class="hv-controls"><button type="button" class="hv-btn" data-s="-1">◀ Back</button><button type="button" class="hv-btn" data-s="1">Next step ▶</button><strong class="ws-step"></strong></div><div class="ws-ties"></div>' +
      '<div class="hv-legend"><span><i class="sq" style="background:var(--ws-a)"></i>positive</span><span><i class="sq" style="background:var(--ws-b)"></i>negative</span><span><i class="sq" style="background:var(--accent)"></i>merged</span><span><i class="sq" style="background:var(--muted)"></i>plain average</span></div>';
    const cell = (v, x, y, w, faded) => {
      const h = Math.abs(v) * 30, cls = v >= 0 ? 'ws-pos' : 'ws-neg';
      return `<rect x="${x}" y="${(v >= 0 ? y - h : y).toFixed(1)}" width="${w}" height="${Math.max(h, 0.8).toFixed(1)}" class="${cls}" opacity="${faded ? 0.18 : 1}"/>`;
    };
    const draw = () => {
      const cw = 34, X0 = 62, rowH = 70; let g = '';
      for (let j = 0; j < 8; j++) g += text(X0 + j * cw + 16, 14, `w${j + 1}`, 'mut', 'middle');
      TV.forEach((t, i) => {
        const y = 52 + i * rowH; g += text(4, y + 4, `task ${i + 1}`, 'lbl') + `<line x1="${X0 - 6}" y1="${y}" x2="${X0 + 8 * cw}" y2="${y}" class="axis" opacity="0.4"/>`;
        t.forEach((v, j) => { const kept = res.trim[i][j] !== 0; const agrees = Math.sign(v) === res.sign[j]; g += cell(v, X0 + j * cw + 7, y, 18, (step >= 1 && !kept) || (step >= 3 && kept && !agrees)); });
      });
      const y = 52 + 3 * rowH + 6;
      g += `<line x1="0" y1="${y - 34}" x2="${X0 + 8 * cw}" y2="${y - 34}" class="grid"/>`;
      if (step >= 2) for (let j = 0; j < 8; j++) g += text(X0 + j * cw + 16, y - 16, res.sign[j] > 0 ? '+' : res.sign[j] < 0 ? '−' : '0', 'lbl', 'middle');
      g += text(4, y - 12, step >= 2 ? 'sign' : '', 'mut');
      const yy = y + 40; g += text(4, yy + 4, step >= 3 ? 'merged' : '', 'lbl') + `<line x1="${X0 - 6}" y1="${yy}" x2="${X0 + 8 * cw}" y2="${yy}" class="axis" opacity="0.4"/>`;
      if (step >= 3) for (let j = 0; j < 8; j++) {
        const a = res.avg[j], m = res.merged[j];
        g += `<rect x="${X0 + j * cw + 5}" y="${(a >= 0 ? yy - Math.abs(a) * 30 : yy).toFixed(1)}" width="10" height="${Math.max(Math.abs(a) * 30, 0.8).toFixed(1)}" class="ws-avg"/>`;
        g += `<rect x="${X0 + j * cw + 16}" y="${(m >= 0 ? yy - Math.abs(m) * 30 : yy).toFixed(1)}" width="11" height="${Math.max(Math.abs(m) * 30, 0.8).toFixed(1)}" class="ws-merged"/>`;
      }
      el.querySelector('.ws-ties').innerHTML = `<div class="ws-fit" style="max-width:560px">${svg(340, yy + 36, 'Three task vectors over eight weights going through the TIES-merging steps: trim, elect sign, merge', g)}</div>`;
      el.querySelector('.ws-step').textContent = steps[step];
    };
    el.querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => { step = Math.max(0, Math.min(3, step + +b.dataset.s)); draw(); }));
    draw();
  };

  // ── 7. Evolution strategies on the same landscape ───────────────────────
  builders.es = (el) => {
    const S = 300, P = toPx(S);
    const run = esRun(60, 30, 0.3, 0.15, 7), gd = gdPath(150, 0.3);
    const base = heat(S, 48) + axes(S);
    el.innerHTML = '<div class="hv-controls"><button type="button" class="hv-btn" data-a="step">Next generation ▶</button><button type="button" class="hv-btn" data-a="run">▶ Run 60</button><button type="button" class="hv-btn" data-a="reset">Reset</button><label><input type="checkbox" class="ws-gd"> show gradient descent</label></div>' +
      '<div class="hv-panels ws-two">' +
      `<div class="hv-panel"><div class="ws-map">${svg(S, S, 'Evolution strategies on the two-weight landscape: 30 perturbed copies around the current model, colored by score, and the path of the mean', `<g>${base}</g><g class="ws-layer"></g>`)}</div></div>` +
      '<div class="hv-panel"><div class="hv-tiles ws-tiles-sm"><div class="hv-tile"><b class="ws-g">0</b><span>generation</span></div><div class="hv-tile"><b class="ws-l"></b><span>loss of the current model</span></div><div class="hv-tile"><b>30</b><span>perturbed copies per generation (as in the paper)</span></div><div class="hv-tile"><b>0</b><span>gradients computed</span></div></div>' +
      '<p class="ws-note">Each generation: add random noise to the weights 30 times, score each copy, then move toward the copies that scored above average.</p></div>' +
      '</div><div class="hv-legend"><span><i style="background:var(--ws-a)"></i>copy scored above average</span><span><i style="background:var(--ws-b)"></i>below average</span><span><i class="ln" style="background:var(--ws-move)"></i>ES path</span><span><i class="ln" style="background:var(--muted)"></i>gradient descent (150 steps)</span></div>';
    let g = 0, timer = null;
    const layer = el.querySelector('.ws-layer');
    const draw = () => {
      const path = [START].concat(run.slice(0, g).map((r) => r.next));
      const cur = path[path.length - 1];
      let s = el.querySelector('.ws-gd').checked ? poly(gd.map(P), 'ws-gdline') : '';
      run[Math.min(g, run.length - 1)].pop.forEach((p, n) => { const q = P(p); s += `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="3.2" class="${run[Math.min(g, run.length - 1)].Z[n] > 0 ? 'ws-good' : 'ws-bad'}"/>`; });
      s += poly(path.map(P), 'ws-path');
      const c = P(cur); s += `<circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="6" class="ws-pickdot"/>`;
      layer.innerHTML = s;
      el.querySelector('.ws-g').textContent = g;
      el.querySelector('.ws-l').textContent = loss(cur[0], cur[1]).toFixed(3);
    };
    el.querySelector('[data-a="step"]').addEventListener('click', () => { clearInterval(timer); if (g < run.length) g++; draw(); });
    el.querySelector('[data-a="reset"]').addEventListener('click', () => { clearInterval(timer); g = 0; draw(); });
    el.querySelector('[data-a="run"]').addEventListener('click', () => {
      clearInterval(timer); if (g >= run.length) g = 0;
      if (reduced()) { g = run.length; return draw(); }
      timer = setInterval(() => { g++; draw(); if (g >= run.length) clearInterval(timer); }, 120);
    });
    el.querySelector('.ws-gd').addEventListener('change', draw);
    draw();
  };

  // ── 8. Hypernetwork: text in, LoRA weights out ──────────────────────────
  builders.hyper = (el) => {
    const L = 32;
    let g = '';
    const box = (x, y, w, h, t, s, cls = 'ws-box') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" class="${cls}"/>` + text(x + w / 2, y + h / 2 - (s ? 3 : -5), t, 'lbl', 'middle') + (s ? text(x + w / 2, y + h / 2 + 14, s, 'mut', 'middle') : '');
    // left column: description → hypernetwork; right column: 32 layer adapters → frozen base model
    g += box(4, 22, 164, 56, 'Task description', '“solve math problems”');
    g += box(4, 122, 164, 56, 'Hypernetwork', '5M to 55M weights', 'ws-box hot');
    g += text(86, 198, '+ layer id, module id', 'mut', 'middle');
    g += text(196, 14, 'LoRA A, B per layer', 'lbl');
    for (let i = 0; i < L; i++) g += `<rect x="${196 + (i % 8) * 19.5}" y="${26 + Math.floor(i / 8) * 28}" width="15" height="22" rx="2" class="ws-slot"/>`;
    g += box(196, 156, 156, 50, 'Frozen base LLM', 'Mistral-7B-Instruct');
    g += `<line x1="86" y1="80" x2="86" y2="118" class="ws-arrow" marker-end="url(#ws-ah)"/><line x1="170" y1="138" x2="192" y2="104" class="ws-arrow" marker-end="url(#ws-ah)"/><line x1="274" y1="138" x2="274" y2="152" class="ws-arrow" marker-end="url(#ws-ah)"/>`;
    el.innerHTML = '<div class="hv-controls"><button type="button" class="hv-btn">▶ Generate an adapter</button></div>' +
      `<div class="ws-fit" style="max-width:520px">${svg(356, 212, 'A task description goes into a hypernetwork, which outputs LoRA matrices for every layer of a frozen base model in one forward pass', g)}</div>` +
      '<div class="hv-tiles"><div class="hv-tile"><b>479</b><span>training tasks (Super-NaturalInstructions)</span></div><div class="hv-tile"><b>67.7</b><span>avg score on 10 unseen benchmarks, Text-to-LoRA (L)</span></div><div class="hv-tile"><b>66.3</b><span>multi-task LoRA trained on the same data</span></div><div class="hv-tile"><b>55.8</b><span>base Mistral-7B-Instruct, no adapter</span></div></div>';
    const slots = el.querySelectorAll('.ws-slot');
    const fill = () => {
      slots.forEach((s) => s.classList.remove('on'));
      if (reduced()) return slots.forEach((s) => s.classList.add('on'));
      slots.forEach((s, i) => setTimeout(() => s.classList.add('on'), 40 * i));
    };
    el.querySelector('button').addEventListener('click', fill);
    onVisible(el, fill);
  };

  // ── 9. Program-as-Weights: compile once, run small ──────────────────────
  builders.paw = (el) => {
    const box = (x, y, w, h, t, s, cls = 'ws-box') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" class="${cls}"/>` + text(x + w / 2, y + 24, t, 'lbl', 'middle') + text(x + w / 2, y + 42, s, 'mut', 'middle');
    let g = box(4, 8, 160, 60, 'Spec in English', '“flag log lines that…”') +
      box(192, 8, 160, 60, 'Compiler (4B)', 'runs once per function', 'ws-box hot') +
      box(4, 112, 160, 60, 'Adapter', '“the program”') +
      box(192, 112, 160, 60, 'Interpreter', 'Qwen3 0.6B, frozen') +
      `<line x1="166" y1="38" x2="188" y2="38" class="ws-arrow" marker-end="url(#ws-ah)"/><line x1="230" y1="70" x2="130" y2="108" class="ws-arrow" marker-end="url(#ws-ah)"/><line x1="166" y1="142" x2="188" y2="142" class="ws-arrow" marker-end="url(#ws-ah)"/>` +
      text(272, 192, 'runs locally, every call', 'mut', 'middle');
    el.innerHTML = `<div class="ws-fit" style="max-width:520px">${svg(356, 200, 'Program-as-Weights: an English spec is compiled once by a 4B model into an adapter, which a frozen 0.6B interpreter runs locally', g)}</div>` +
      '<div class="hv-tiles"><div class="hv-tile"><b>0.6B</b><span>interpreter matches prompting Qwen3-32B (paper\'s claim)</span></div><div class="hv-tile"><b>≈1/50</b><span>of the 32B baseline\'s inference memory</span></div><div class="hv-tile"><b>~30 tok/s</b><span>on a MacBook M3</span></div><div class="hv-tile"><b>10M</b><span>examples in FuzzyBench, its training set</span></div></div>';
  };

  // ── 10. Fast weights: write key→value pairs into a matrix, read them back ─
  const H2 = 0.5;
  const KEYS = [[H2, H2, H2, H2], [H2, -H2, H2, -H2], [H2, H2, -H2, -H2], [H2, -H2, -H2, H2]];
  const VALS = [[2, 0, 1, 0], [0, 3, 0, 1], [1, 1, 0, 2], [0, 0, 2, 1]];
  const K5 = [Math.SQRT1_2, Math.SQRT1_2, 0, 0], V5 = [3, 0, 0, 0];
  builders.fast = (el) => {
    let written = 0, extra = false, query = 0;
    el.innerHTML = '<div class="hv-controls"><button type="button" class="hv-btn" data-a="w">Write next pair</button><button type="button" class="hv-btn" data-a="x">Write a 5th, overlapping key</button><button type="button" class="hv-btn" data-a="r">Reset</button>' +
      '<label>read with <select aria-label="Query key"><option value="0">key 1</option><option value="1">key 2</option><option value="2">key 3</option><option value="3">key 4</option></select></label></div><div class="ws-fast"></div>';
    const draw = () => {
      const W = [0, 1, 2, 3].map(() => [0, 0, 0, 0]);
      const add = (k, v) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) W[i][j] += v[i] * k[j]; };
      for (let n = 0; n < written; n++) add(KEYS[n], VALS[n]);
      if (extra) add(K5, V5);
      const k = KEYS[query];
      const out = W.map((row) => row.reduce((s, w, j) => s + w * k[j], 0));
      const want = query < written ? VALS[query] : [0, 0, 0, 0];
      const C = 40; let g = text(4, 14, 'matrix W (4 × 4)', 'lbl');
      W.forEach((row, i) => row.forEach((w, j) => {
        const op = Math.min(1, Math.abs(w) / 3);
        g += `<rect x="${4 + j * C}" y="${24 + i * C}" width="${C - 4}" height="${C - 4}" rx="5" class="${w >= 0 ? 'ws-pos' : 'ws-neg'}" opacity="${(0.08 + 0.75 * op).toFixed(2)}"/>`;
        g += text(4 + j * C + (C - 4) / 2, 24 + i * C + C / 2 + 2, w.toFixed(2).replace('-0.00', '0.00'), '', 'middle');
      }));
      const vec = (x, title, v, cls) => text(x, 14, title, 'lbl') + v.map((t, i) => `<rect x="${x}" y="${24 + i * C}" width="64" height="${C - 4}" rx="5" class="${cls}"/>` + text(x + 32, 24 + i * C + C / 2 + 2, t.toFixed(2).replace('-0.00', '0.00'), '', 'middle')).join('');
      g += vec(184, `W·key ${query + 1}`, out, 'ws-box') + vec(262, 'stored', want, 'ws-box');
      const err = Math.hypot(...out.map((o, i) => o - want[i]));
      g += text(184, 24 + 4 * C + 16, err < 1e-9 ? '✓ exact recall' : `error ${err.toFixed(2)}`, err < 1e-9 ? 'lbl ok' : 'lbl bad');
      el.querySelector('.ws-fast').innerHTML = `<div class="ws-fit" style="max-width:480px">${svg(330, 24 + 4 * C + 24, 'A 4 by 4 fast-weight matrix built from outer products of values and keys, and the vector read back with a key', g)}</div>` +
        `<p class="ws-note">Pairs written: <strong>${written}</strong> of 4 orthogonal keys${extra ? ' + 1 overlapping key' : ''}. Each write is W ← W + v·kᵀ: no gradient, no training loop.</p>`;
    };
    el.querySelector('[data-a="w"]').addEventListener('click', () => { if (written < 4) written++; query = written - 1; el.querySelector('select').value = String(query); draw(); });
    el.querySelector('[data-a="x"]').addEventListener('click', () => { extra = true; draw(); });
    el.querySelector('[data-a="r"]').addEventListener('click', () => { written = 0; extra = false; query = 0; el.querySelector('select').value = '0'; draw(); });
    el.querySelector('select').addEventListener('change', (e) => { query = +e.target.value; draw(); });
    written = 2; draw();
  };

  // ── 11. Which method fits? ──────────────────────────────────────────────
  builders.choose = (el) => {
    const rows = [
      ['Full fine-tuning', 'labeled data', 'yes', 'high', 'a new full model'],
      ['LoRA', 'labeled data', 'yes', 'low', 'a small adapter file'],
      ['Merging (task arithmetic, TIES)', 'fine-tuned models', 'no', 'very low', 'one model with several skills'],
      ['Evolution strategies', 'a score (reward)', 'no', 'high, many forward passes', 'a new full model'],
      ['Hypernetwork (Text-to-LoRA, DnD)', 'a trained generator + a description', 'no, at use time', 'one forward pass', 'a small adapter file'],
      ['Model editing (ROME, MEMIT)', 'the fact to change', 'some', 'very low', 'the same model, one fact changed'],
      ['Weight-space programming', 'a frontier LLM + the weights + a goal', 'no', 'LLM tokens + a few forward passes', 'a targeted, explained edit, or a small new network']
    ];
    el.innerHTML = '<div class="hv-panels ws-six">' + rows.map((r) =>
      `<div class="hv-panel"><h4>${r[0]}</h4><div class="hv-chips"><span class="hv-chip">needs: ${r[1]}</span><span class="hv-chip">backprop: ${r[2]}</span><span class="hv-chip cost">cost: ${r[3]}</span></div><p><strong>You get:</strong> ${r[4]}</p></div>`).join('') + '</div>';
  };

  // one shared arrowhead marker for every figure
  const defs = document.createElement('div');
  defs.innerHTML = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs><marker id="ws-ah" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="ws-ahead"/></marker></defs></svg>';
  document.body.appendChild(defs.firstChild);

  document.querySelectorAll('figure.hv[data-hv]').forEach((fig) => {
    const build = builders[fig.dataset.hv];
    const host = fig.querySelector('.hv-canvas');
    if (!build || !host) return;
    try { build(host); } catch (e) { console.error('weight-space figure', fig.dataset.hv, e); }
  });
})();
