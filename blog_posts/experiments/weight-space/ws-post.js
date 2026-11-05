// Figures for /blog_posts/weight-space-programming-explained.html.
// One toy model, the "tiny thinker", drives every figure. It is a real 10-weight ReLU network,
// run here on fixed inputs, so every count shown is what the network actually does.
// The Python block in the post runs the same model and prints the same numbers.
(function () {
  'use strict';

  const relu = (x) => Math.max(0, x);
  const svg = (w, h, label, inner) => `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">${inner}</svg>`;
  const T = (x, y, s, cls = '', anchor = 'start') => `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${s}</text>`;
  const sgn = (v) => (v < 0 ? '−' + Math.abs(v) : '+' + v);
  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function onVisible(el, fn) {
    if (!('IntersectionObserver' in window)) return fn();
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { io.disconnect(); fn(); } }, { threshold: 0.35 });
    io.observe(el);
  }

  // ── The tiny thinker ────────────────────────────────────────────────────
  // Inputs: sure (0..1) and checks so far (0, 1, 2, ...).
  // A = relu(4·sure − 2), B = relu(1·checks − 1), C = relu(1·checks + 1)
  // score = 1.5·A + 1·B − 2·C − 1.5; answer when score > 0, else check again. Limit: 10 checks.
  const KEYS = ['aw', 'ab', 'bw', 'bb', 'cw', 'cb', 'oa', 'ob', 'oc', 'o0'];
  const NAMES = { aw: 'A input', ab: 'A bias', bw: 'B input', bb: 'B bias', cw: 'C input', cb: 'C bias', oa: 'A → out', ob: 'B → out', oc: 'C → out', o0: 'out bias' };
  const ORIG = { aw: 4, ab: -2, bw: 1, bb: -1, cw: 1, cb: 1, oa: 1.5, ob: 1, oc: -2, o0: -1.5 };
  const VERSIONS = {
    orig: { label: 'Original', w: ORIG, change: 'Nothing changed.' },
    del: { label: 'Delete neuron C', w: Object.assign({}, ORIG, { oc: 0 }), change: 'Changed: C → out, −2 → 0 (neuron C switched off).' },
    edit: { label: 'Edit one number', w: Object.assign({}, ORIG, { cw: 0 }), change: 'Changed: C input, 1 → 0 (C no longer grows with each check).' }
  };
  const LIMIT = 10;
  const parts = (w, s, k) => {
    const A = relu(w.aw * s + w.ab), B = relu(w.bw * k + w.bb), C = relu(w.cw * k + w.cb);
    return { A, B, C, pa: w.oa * A, pb: w.ob * B, pc: w.oc * C, score: w.oa * A + w.ob * B + w.oc * C + w.o0 };
  };
  // number of checks before it answers, or null if it hits the limit
  const checksBefore = (w, s) => { for (let k = 0; k < LIMIT; k++) if (parts(w, s, k).score > 0) return k; return null; };
  const r1 = (x) => Math.round(x * 10) / 10;
  const f1 = (x) => (Math.abs(x) < 1e-9 ? '0' : (x < 0 ? '−' : '') + Math.abs(r1(x)).toString());

  // Plain gradient descent on the same network, for the "training" comparison:
  // 110 examples (sure 0, 0.1, ..., 1 × checks 0..9) labeled with the edited model's behavior,
  // logistic loss, learning rate 0.05, 100 full-batch steps, starting from the original weights.
  function train() {
    const want = VERSIONS.edit.w, data = [];
    for (let i = 0; i <= 10; i++) {
      const s = i / 10, need = checksBefore(want, s);
      for (let k = 0; k < LIMIT; k++) data.push([s, k, k >= need ? 1 : 0]);
    }
    const W = Object.assign({}, ORIG), lr = 0.05, steps = 100;
    for (let t = 0; t < steps; t++) {
      const g = {}; KEYS.forEach((k) => { g[k] = 0; });
      data.forEach(([s, k, y]) => {
        const za = W.aw * s + W.ab, zb = W.bw * k + W.bb, zc = W.cw * k + W.cb;
        const A = relu(za), B = relu(zb), C = relu(zc);
        const d = 1 / (1 + Math.exp(-(W.oa * A + W.ob * B + W.oc * C + W.o0))) - y;
        g.oa += d * A; g.ob += d * B; g.oc += d * C; g.o0 += d;
        if (za > 0) { g.aw += d * W.oa * s; g.ab += d * W.oa; }
        if (zb > 0) { g.bw += d * W.ob * k; g.bb += d * W.ob; }
        if (zc > 0) { g.cw += d * W.oc * k; g.cb += d * W.oc; }
      });
      KEYS.forEach((k) => { W[k] -= (lr * g[k]) / data.length; });
    }
    let correct = 0;
    data.forEach(([s, k, y]) => { if ((parts(W, s, k).score > 0 ? 1 : 0) === y) correct++; });
    return { W, n: data.length, correct, steps };
  }

  // run strip: one box per check, then "answer" or "limit"
  function strip(w, s) {
    const n = checksBefore(w, s);
    const boxes = [];
    const count = n === null ? LIMIT : n;
    for (let k = 0; k < count; k++) boxes.push(`<i class="wss-box chk" style="--d:${k * 70}ms">check ${k + 1}</i>`);
    boxes.push(n === null
      ? `<i class="wss-box lim" style="--d:${count * 70}ms">limit: no answer</i>`
      : `<i class="wss-box ans" style="--d:${count * 70}ms">answer</i>`);
    return { html: `<div class="wss-strip">${boxes.join('')}</div>`, n };
  }
  const nText = (n) => (n === null ? 'hits the 10-check limit' : n === 0 ? 'answers with 0 checks' : `answers after ${n} check${n === 1 ? '' : 's'}`);

  const builders = {};

  // ── 1. The model ─────────────────────────────────────────────────────────
  builders.model = (el) => {
    const W = 440, H = 312;
    const inp = [{ y: 66, a: 'How sure', b: 'am I? (0–1)' }, { y: 206, a: 'Checks', b: 'so far' }];
    const neu = [
      { id: 'A', y: 40, name: 'A', bias: -2, from: 0, w: 4, out: 1.5 },
      { id: 'B', y: 136, name: 'B', bias: -1, from: 1, w: 1, out: 1 },
      { id: 'C', y: 232, name: 'C', bias: 1, from: 1, w: 1, out: -2 }
    ];
    const ix = 100, nx = 214, ox = 330, oy = 136;
    let g = '';
    const edge = (x1, y1, x2, y2, v, t) => {
      const cls = v < 0 ? 'wss-neg' : 'wss-pos';
      const lx = x1 + (x2 - x1) * t, ly = y1 + (y2 - y1) * t;
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="wss-edge ${cls}" style="stroke-width:${1.5 + Math.abs(v) * 1.1}"/>` +
        `<rect x="${lx - 22}" y="${ly - 12}" width="44" height="23" rx="6" class="wss-tag"/>` + T(lx, ly + 5, sgn(v), 'wss-w ' + cls, 'middle');
    };
    neu.forEach((n) => { g += edge(ix, inp[n.from].y, nx - 26, n.y, n.w, 0.55); });
    neu.forEach((n) => { g += edge(nx + 26, n.y, ox, oy, n.out, 0.5); });
    inp.forEach((p) => {
      g += `<rect x="6" y="${p.y - 28}" width="${ix - 6}" height="56" rx="10" class="ws-box"/>` + T(53, p.y - 4, p.a, 'lbl', 'middle') + T(53, p.y + 16, p.b, 'mut', 'middle');
    });
    neu.forEach((n) => {
      g += `<circle cx="${nx}" cy="${n.y}" r="26" class="wss-neuron"/>` + T(nx, n.y + 6, n.name, 'big', 'middle') +
        T(nx, n.y + 46, 'bias ' + sgn(n.bias), 'mut', 'middle');
    });
    g += `<rect x="${ox}" y="${oy - 40}" width="${W - ox - 4}" height="80" rx="10" class="ws-box hot"/>` +
      T(ox + (W - ox - 4) / 2, oy - 14, 'Score', 'lbl', 'middle') + T(ox + (W - ox - 4) / 2, oy + 7, 'bias −1.5', 'mut', 'middle') +
      T(ox + (W - ox - 4) / 2, oy + 28, '&gt; 0: answer', 'mut', 'middle');
    const run = strip(ORIG, 0.9);
    el.innerHTML = `<div class="wss-net">${svg(W, H, 'The tiny thinker: inputs how sure and checks so far feed neurons A, B and C, which feed the score. Weights: sure to A +4, checks to B +1, checks to C +1; A to score +1.5, B +1, C −2. Biases: A −2, B −1, C +1, score −1.5.', g)}</div>` +
      '<div class="hv-legend"><span><i class="ln wss-lg-pos"></i>pushes up</span><span><i class="ln wss-lg-neg"></i>pushes down</span><span>Each neuron: ReLU(weight × input + bias). Line thickness = size of the weight.</span></div>' +
      `<p class="wss-runlab">Run it on a problem it is <b>90% sure</b> about:</p>${run.html}` +
      `<p class="ws-note">The original model ${nText(run.n)}, even though it is 90% sure.</p>`;
    const st = el.querySelector('.wss-strip');
    if (reduced()) st.classList.add('show'); else onVisible(el, () => st.classList.add('show'));
  };

  // ── 2. Read the weights ─────────────────────────────────────────────────
  function mini(points, xmax, xlab, ymax, label) {
    const W = 200, H = 96, L = 26, B = 22, R = 6, Tp = 8;
    const X = (x) => L + (x / xmax) * (W - L - R), Y = (y) => H - B - (y / ymax) * (H - B - Tp);
    const d = points.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join('');
    return svg(W, H, label,
      `<line x1="${L}" y1="${H - B}" x2="${W - R}" y2="${H - B}" class="axis"/><line x1="${L}" y1="${Tp}" x2="${L}" y2="${H - B}" class="axis"/>` +
      `<path d="${d}" class="wss-act"/>` + T(L - 4, Tp + 8, ymax, 'mut', 'end') + T(L - 4, H - B, '0', 'mut', 'end') +
      T((L + W - R) / 2, H - 4, xlab, 'mut', 'middle'));
  }
  builders.read = (el) => {
    const w = ORIG;
    const sPts = Array.from({ length: 21 }, (_, i) => [i / 20, relu(w.aw * (i / 20) + w.ab)]);
    const kPts = (a, b) => Array.from({ length: 10 }, (_, k) => [k, relu(a * k + b)]);
    const cards = [
      { n: 'A', f: '4 × sure − 2', out: w.oa, plot: mini(sPts, 1, 'how sure (0 to 1)', 2, 'Neuron A is 0 until sure reaches 0.5, then rises to 2 at sure = 1.'),
        when: 'Silent until “sure” passes 0.5, then grows.', means: '“I’m confident.”' },
      { n: 'B', f: '1 × checks − 1', out: w.ob, plot: mini(kPts(w.bw, w.bb), 9, 'checks so far (0 to 9)', 10, 'Neuron B is 0 for checks 0 and 1, then rises by 1 per check to 8.'),
        when: 'Silent for the first check, then +1 per check.', means: '“I’ve checked enough.”' },
      { n: 'C', f: '1 × checks + 1', out: w.oc, plot: mini(kPts(w.cw, w.cb), 9, 'checks so far (0 to 9)', 10, 'Neuron C is 1 at check 0 and rises by 1 per check to 10.'),
        when: 'Always on, and +1 per check.', means: '“Wait, let me check again.”' }
    ];
    el.innerHTML = '<div class="hv-panels wss-three">' + cards.map((c) =>
      `<div class="hv-panel${c.out < 0 ? ' wss-suspect' : ''}"><h4>Neuron ${c.n}</h4>` +
      `<div class="wss-eq">ReLU(${c.f})<span class="${c.out < 0 ? 'wss-tneg' : 'wss-tpos'}">sends ${sgn(c.out)} to the score</span></div>` +
      c.plot + `<p>${c.when} ${c.out < 0 ? 'Pushes toward <strong>checking again</strong>.' : 'Pushes toward <strong>answering</strong>.'}</p>` +
      `<p class="wss-means">${c.means}</p></div>`).join('') + '</div>';
  };

  // ── 3. Find the bug: contributions vs checks ────────────────────────────
  builders.bug = (el) => {
    const w = ORIG, s = 0.9, ks = Array.from({ length: 10 }, (_, k) => k);
    const P = ks.map((k) => parts(w, s, k));
    const W = 560, H = 320, L = 50, R = 112, Tp = 14, B = 52, ymin = -20, ymax = 10;
    const X = (k) => L + (k / 9) * (W - L - R), Y = (v) => Tp + ((ymax - v) / (ymax - ymin)) * (H - Tp - B);
    let g = '';
    for (let v = ymin; v <= ymax; v += 5) g += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" class="grid"/>` + T(L - 6, Y(v) + 4, f1(v), 'mut', 'end');
    g += `<line x1="${L}" x2="${W - R}" y1="${Y(0)}" y2="${Y(0)}" class="wss-zero"/>` + T(W - R - 4, Y(0) - 5, 'answers above this line', 'mut wss-small', 'end');
    ks.forEach((k) => { g += T(X(k), H - B + 22, k, 'mut', 'middle'); });
    g += T((L + W - R) / 2, H - 6, 'checks so far', 'mut', 'middle');
    const series = [
      { key: 'pa', name: 'A: +' + r1(P[0].pa), cls: 'wss-sa' },
      { key: 'pb', name: 'B', cls: 'wss-sb' },
      { key: 'pc', name: 'C', cls: 'wss-sc' },
      { key: 'score', name: 'total score', cls: 'wss-st' }
    ];
    series.forEach((se) => {
      const d = P.map((p, k) => `${k ? 'L' : 'M'}${X(k).toFixed(1)} ${Y(p[se.key]).toFixed(1)}`).join('');
      g += `<path d="${d}" class="wss-line ${se.cls}"/>`;
      P.forEach((p, k) => { g += `<circle cx="${X(k)}" cy="${Y(p[se.key])}" r="3.2" class="wss-dot ${se.cls}"><title>${se.name.split(':')[0]} after ${k} checks: ${f1(p[se.key])}</title></circle>`; });
      const last = P[9][se.key];
      g += T(W - R + 8, Y(last) + 4, se.key === 'score' ? 'total ' + f1(last) : se.name.split(':')[0] + ' ' + f1(last), 'lbl wss-end ' + se.cls);
    });
    el.innerHTML = `<div class="hv-chart wss-chart">${svg(W, H, 'Line chart over 0 to 9 checks at 90% sure. A adds a steady +2.4. B adds 0, 0, then 1 more per check up to 8. C adds −2 per unit, from −2 to −20. Total score falls from −1.1 to −11.1 and never reaches 0.', g)}</div>` +
      '<div class="hv-legend"><span><i class="ln wss-lg-a"></i>A: I’m confident</span><span><i class="ln wss-lg-b"></i>B: I’ve checked enough</span><span><i class="ln wss-lg-c"></i>C: wait, check again</span><span><i class="ln wss-lg-t"></i>total score (with the −1.5 bias)</span></div>' +
      `<div class="hv-tiles ws-tiles-sm"><div class="hv-tile"><b>+1</b><span>B adds per check</span></div><div class="hv-tile"><b>−2</b><span>C adds per check</span></div><div class="hv-tile"><b>−1</b><span>net change per check</span></div><div class="hv-tile"><b>${f1(P[9].score)}</b><span>score after 9 checks</span></div></div>`;
  };

  // ── 4. Edit and test ─────────────────────────────────────────────────────
  builders.edit = (el) => {
    let ver = 'edit', s = 0.9;
    el.innerHTML = '<div class="hv-controls wss-vers" role="group" aria-label="Model version">' +
      Object.keys(VERSIONS).map((k) => `<button type="button" class="hv-btn" data-v="${k}" aria-pressed="${k === ver}">${VERSIONS[k].label}</button>`).join('') + '</div>' +
      '<div class="hv-controls"><label>How sure the model is <input type="range" min="0" max="1" step="0.1" value="0.9" aria-label="How sure the model is"><output>90%</output></label></div>' +
      '<p class="wss-change"></p><div class="wss-run"></div><p class="wss-verdict"></p><div class="wss-table"></div>';
    const range = el.querySelector('input'), out = el.querySelector('output');
    const tests = [1, 0.9, 0.7, 0.5];
    const draw = (animate) => {
      const V = VERSIONS[ver], run = strip(V.w, s);
      el.querySelector('.wss-change').textContent = V.change;
      el.querySelector('.wss-run').innerHTML = run.html;
      const st = el.querySelector('.wss-strip');
      if (!animate || reduced()) st.classList.add('show'); else requestAnimationFrame(() => st.classList.add('show'));
      el.querySelector('.wss-verdict').innerHTML = `At <b>${Math.round(s * 100)}% sure</b>, this version <b>${nText(run.n)}</b>.`;
      let t = '<div class="wss-grid"><span class="wss-h">How sure</span>' + Object.keys(VERSIONS).map((k) => `<span class="wss-h${k === ver ? ' on' : ''}">${VERSIONS[k].label}</span>`).join('');
      tests.forEach((ts) => {
        t += `<span class="wss-c0">${Math.round(ts * 100)}%</span>` + Object.keys(VERSIONS).map((k) => {
          const n = checksBefore(VERSIONS[k].w, ts);
          return `<span class="wss-c${k === ver ? ' on' : ''}${n === null ? ' bad' : ''}">${n === null ? 'limit' : n + ' check' + (n === 1 ? '' : 's')}</span>`;
        }).join('');
      });
      el.querySelector('.wss-table').innerHTML = t + '</div><p class="ws-note">Checks made before answering. A good fix stops the loop <em>and</em> still checks more when the model is less sure.</p>';
    };
    el.querySelectorAll('[data-v]').forEach((b) => b.addEventListener('click', () => {
      ver = b.dataset.v;
      el.querySelectorAll('[data-v]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      draw(true);
    }));
    range.addEventListener('input', () => { s = Number(range.value); out.textContent = Math.round(s * 100) + '%'; draw(false); });
    draw(false);
  };

  // ── 5. Toy vs Qwen ──────────────────────────────────────────────────────
  builders.qwen = (el) => {
    const e9 = checksBefore(VERSIONS.edit.w, 0.9), e5 = checksBefore(VERSIONS.edit.w, 0.5);
    const rows = [
      ['The model', '10 numbers, 3 neurons', '0.8 billion numbers, 24 layers'],
      ['The bug', 'Re-checks until the 10-check limit', 'Thinks in circles: 85 of its first 96 practice answers ran to the 32,768-token limit'],
      ['1. Read', 'We read 10 numbers by eye', 'An LLM works in a Python session with the weights loaded; no GPU, no gradients'],
      ['2. Find', 'Neuron C’s input weight makes the urge to check grow', 'One “loop direction” written by the MLPs of layers 15 and 19'],
      ['3. Edit', '1 number: 1 → 0', 'Direction removed from 64 columns in each layer: 131,072 numbers (0.016%)'],
      ['4. Test', 'Run problems at different sureness', 'Up to 50 forward passes on GSM8K and MATH practice problems'],
      ['Result', `Answers after ${e9} checks (90% sure) or ${e5} (50% sure)`, 'Answers hitting the limit: 93.0% → 33.1%. MATH-500: 7.9% → 48.1%']
    ];
    el.innerHTML = '<div class="wss-map"><span class="wss-mh"></span><span class="wss-mh">Tiny thinker (this post)</span><span class="wss-mh">Qwen3.5-0.8B (MIT CSAIL)</span>' +
      rows.map((r) => `<span class="wss-ml">${r[0]}</span><span class="wss-mt"><em>Toy:</em> ${r[1]}</span><span class="wss-mq"><em>Qwen:</em> ${r[2]}</span>`).join('') + '</div>' +
      '<div class="hv-tiles"><div class="hv-tile"><b>131,072</b><span>weights changed (0.016%)</span></div><div class="hv-tile"><b>93.0% → 33.1%</b><span>answers hitting the limit</span></div><div class="hv-tile"><b>7.9% → 48.1%</b><span>MATH-500 score</span></div><div class="hv-tile"><b>0</b><span>gradient steps</span></div></div>';
  };

  // ── 6. Reasoned edit vs training ────────────────────────────────────────
  builders.train = (el) => {
    const tr = train(), E = VERSIONS.edit.w;
    const row = (W) => KEYS.map((k) => {
      const d = W[k] - ORIG[k], changed = Math.abs(d) > 1e-6;
      return `<span class="wss-cell${changed ? ' ch' : ''}"><small>${NAMES[k]}</small><b>${f2(W[k])}</b><em>${changed ? (d > 0 ? '+' : '−') + Math.abs(d).toFixed(2) : 'same'}</em></span>`;
    }).join('');
    const cnt = (W) => KEYS.filter((k) => Math.abs(W[k] - ORIG[k]) > 1e-6).length;
    const same = Array.from({ length: 11 }, (_, i) => i / 10).every((s) => checksBefore(tr.W, s) === checksBefore(E, s));
    el.innerHTML =
      `<h4 class="wss-rowh">Edited by reasoning: <b>${cnt(E)} of 10</b> numbers changed</h4><div class="wss-cells">${row(E)}</div>` +
      `<h4 class="wss-rowh">Trained with gradient descent (${tr.n} labeled examples, ${tr.steps} steps): <b>${cnt(tr.W)} of 10</b> changed</h4><div class="wss-cells">${row(tr.W)}</div>` +
      `<p class="ws-note">Training matches ${tr.correct} of ${tr.n} examples, and ${same ? 'both versions answer after the same number of checks at every sureness from 0% to 100%' : 'the two versions differ at some sureness levels'}. Its biggest change is C’s input weight, the same number the reasoned edit changed, but it also moves the other nine.</p>`;
  };

  // ── 0a. Executive summary tiles ─────────────────────────────────────────
  builders.summary = (el) => {
    const changed = KEYS.filter((k) => VERSIONS.edit.w[k] !== ORIG[k]).length;
    const tiles = [
      [`${changed} of 10`, 'weights changed to fix the toy example'],
      ['131,072', 'weights changed in Qwen3.5-0.8B (0.016%)'],
      ['7.9% → 48.1%', 'Qwen’s MATH-500 score after the edit'],
      ['0', 'gradient steps in either fix']
    ];
    el.innerHTML = '<div class="hv-tiles">' + tiles.map((t) => `<div class="hv-tile"><b>${t[0]}</b><span>${t[1]}</span></div>`).join('') + '</div>';
  };

  // ── 0b. The read → find → edit → test loop ─────────────────────────────
  builders.loop = (el) => {
    const steps = [
      ['Read', 'Work out what each part of the network computes.'],
      ['Find', 'Locate the part that causes the problem.'],
      ['Edit', 'Change the fewest numbers that remove it.'],
      ['Test', 'Run it on a few inputs; check nothing else broke.']
    ];
    el.innerHTML =
      '<div class="wss-given"><span class="hv-chip">the weights</span><span class="wss-plus">+</span><span class="hv-chip">a goal in plain English</span><span class="wss-plus">→</span><span class="hv-chip up">an LLM</span></div>' +
      '<ol class="wss-loop">' + steps.map((s, i) => `<li><span class="hv-step-n">${i + 1}</span><b>${s[0]}</b><span>${s[1]}</span></li>`).join('') + '</ol>' +
      '<p class="wss-back">↻ repeat until the test passes · <b>no gradients</b> at any step</p>' +
      '<div class="hv-panels ws-two wss-vs"><div class="hv-panel"><h4>Training (fine-tuning)</h4><p>Needs labeled examples. Nudges <strong>every</strong> weight a little, many times. Works, but can’t say what was wrong.</p></div>' +
      '<div class="hv-panel wss-new"><h4>Weight-space programming</h4><p>Needs the weights and a goal. Changes <strong>a few</strong> chosen weights, and explains why.</p></div></div>';
  };

  // ── 7. Limits ───────────────────────────────────────────────────────────
  builders.limits = (el) => {
    const cards = [
      ['Can’t add what isn’t there', 'On Gemma 3 270M, which had no single broken part, MATH-500 moved only from 6.8% to 7.0–7.7%.'],
      ['Some feedback helps', 'Qwen’s loops barely went away with 10 or 25 forward passes; the big gain came with 50.'],
      ['Real models are big', 'The toy fits on a screen; Qwen’s 0.8 billion weights needed a Python session and test runs.'],
      ['Early and unreviewed', 'A blog post and an unreleased “GPT-6 Astra” model. But the logs are public, and a re-run of the edited Qwen scored 51.0% on MATH-500.']
    ];
    el.innerHTML = '<div class="hv-panels ws-two">' + cards.map((c) => `<div class="hv-panel"><h4>${c[0]}</h4><p>${c[1]}</p></div>`).join('') + '</div>';
  };
  const f2 = (x) => (x < 0 ? '−' : '') + Math.abs(x).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');

  document.querySelectorAll('figure.hv[data-hv]').forEach((fig) => {
    const build = builders[fig.dataset.hv];
    const host = fig.querySelector('.hv-canvas');
    if (!build || !host) return;
    try { build(host); } catch (e) { console.error('weight-space simple figure', fig.dataset.hv, e); }
  });
})();
