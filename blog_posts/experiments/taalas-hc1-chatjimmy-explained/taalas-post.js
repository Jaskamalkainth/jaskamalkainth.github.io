// Figures and small calculators for /blog_posts/taalas-hc1-chatjimmy-explained.html.
// Each <figure class="hv" data-hv="name"> holds a text fallback; the matching builder below
// replaces it. Every number is computed here from the same inputs the article uses:
// Llama 3.1 8B's architecture, NVIDIA's published bandwidths, Taalas's published chip specs,
// and my own measurements of chatjimmy.ai on 31 Oct 2026 (BENCH below).
(function () {
  'use strict';

  // ---- shared inputs ----------------------------------------------------------------
  const PARAMS = 8.03e9;                 // Llama 3.1 8B parameters
  const LAYERS = 32, KV_HEADS = 8, HEAD_DIM = 128, NATIVE_CTX = 131072;
  const DEMO_CTX = 6144;                 // measured: "max context limit 6144 reached"
  const HC1_TPS = 15600;                 // measured decode rate on long answers
  const HC1_TRANSISTORS = 53e9;          // Taalas products page
  const GPUS = [
    { name: 'NVIDIA H100', bw: 3.35e12 },
    { name: 'NVIDIA H200', bw: 4.8e12 },
    { name: 'NVIDIA B200', bw: 8e12 }
  ];
  // measured: [label, prompt tokens, answer tokens, chip ms, round-trip ms]
  const BENCH = [
    ['Say hello in one sentence', 16, 3, 1.5, 505],
    ['List 10 prime numbers', 16, 57, 4.9, 239],
    ['Haiku about silicon', 17, 26, 2.6, 257],
    ['Explain a hash table', 23, 227, 16.0, 250],
    ['How a transformer works', 24, 432, 29.2, 296],
    ['500-word short story', 23, 762, 50.3, 292],
    ['800-word essay', 24, 1197, 78.5, 397],
    ['Quicksort, explained', 22, 640, 42.2, 269],
    ['Summarize 2,000 tokens', 2018, 85, 81.0, 364],
    ['Count from 1 to 200', 22, 614, 41.2, 270],
    ['1,000-word guide', 21, 1227, 80.3, 324],
    ['17 × 23, briefly', 21, 8, 1.9, 264]
  ];

  const fmt = (n, d = 0) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const svg = (w, h, label, inner) => `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">${inner}</svg>`;
  const text = (x, y, s, cls = '', anchor = 'start') => `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${s}</text>`;
  const tile = (big, small, em) => `<div class="hv-tile${em ? ' em' : ''}"><b>${big}</b><span>${small}</span></div>`;
  const pct = (v, max) => `${Math.max(0.3, (v / max) * 100).toFixed(2)}%`;
  const seg = (name, values, cur, label) =>
    `<span class="hv-seg" role="group" aria-label="${label}">` +
    values.map((v) => `<button type="button" class="hv-btn" data-${name}="${v[0]}" aria-pressed="${v[0] === cur}">${v[1]}</button>`).join('') +
    '</span>';
  function wireSeg(el, name, onPick) {
    el.querySelectorAll(`[data-${name}]`).forEach((b) => b.addEventListener('click', () => {
      el.querySelectorAll(`[data-${name}]`).forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      onPick(b.dataset[name]);
    }));
  }
  const gib = (bytes) => bytes >= 2 ** 30 ? `${fmt(bytes / 2 ** 30, bytes % 2 ** 30 ? 1 : 0)} GiB` : `${fmt(bytes / 2 ** 20)} MiB`;

  const builders = {};

  // ---- 1. Measured headline numbers ---------------------------------------------------
  builders.tiles = (el) => {
    const long = BENCH[10];
    const usPerTok = 1e6 / HC1_TPS;
    el.innerHTML = '<div class="hv-tiles">' +
      tile(`~${fmt(HC1_TPS)}`, 'tokens/s while writing, per user', true) +
      tile('~1.2 ms', 'chip time to the first token (short prompt)') +
      tile(`${fmt(long[3], 0)} ms`, `for a ${fmt(long[2])}-token answer, on the chip`) +
      tile(`${fmt(usPerTok)} µs`, `per token, ≈ ${fmt(usPerTok / LAYERS, 0)} µs per layer (${LAYERS} layers)`) +
      tile(fmt(DEMO_CTX), 'tokens of context, max') +
      '</div>';
  };

  // ---- 2. Memory wall: bandwidth / model size ----------------------------------------
  builders.wall = (el) => {
    el.innerHTML = `<div class="hv-controls"><label>Weight precision</label>${seg('bits', [['16', '16-bit'], ['8', '8-bit'], ['4', '4-bit'], ['3', '3-bit']], '16', 'Weight precision')}</div>` +
      '<div class="hv-bars"></div><div class="hv-tiles" style="margin-top:0.75rem"></div>' +
      '<div class="hv-legend"><span><i style="background:var(--hv-gpu)"></i>GPU ceiling, one user (computed)</span><span><i style="background:var(--hv-chip)"></i>HC1, measured</span></div>';
    const bars = el.querySelector('.hv-bars'), tiles = el.querySelector('.hv-tiles');
    const draw = (bits) => {
      bits = Number(bits);
      const bytes = PARAMS * bits / 8;
      const rows = GPUS.map((g) => ({ name: g.name, sub: `${fmt(g.bw / 1e12, 2).replace(/\.?0+$/, '')} TB/s`, v: g.bw / bytes, cls: '' }));
      rows.push({ name: 'Taalas HC1', sub: 'weights in silicon', v: HC1_TPS, cls: 'chip' });
      const max = Math.max(...rows.map((r) => r.v));
      bars.innerHTML = rows.map((r) =>
        `<div class="hv-row"><div class="name">${r.name}<small>${r.sub}</small></div>` +
        `<div class="hv-track" title="${r.name}: ${fmt(r.v)} tokens/s"><div class="hv-bar ${r.cls}" style="width:${pct(r.v, max * 1.25)}"></div><span class="val">${fmt(r.v)} tok/s</span></div></div>`).join('');
      const need = HC1_TPS * bytes;
      tiles.innerHTML =
        tile(`${fmt(bytes / 1e9, 1)} GB`, `weights read per token at ${bits}-bit`) +
        tile(`${fmt(HC1_TPS / (GPUS[2].bw / bytes), 0)}×`, 'HC1 vs the B200 ceiling at this precision', true) +
        tile(`${fmt(need / 1e12)} TB/s`, `bandwidth needed to read ${bits}-bit weights at ${fmt(HC1_TPS)} tok/s`);
    };
    wireSeg(el, 'bits', draw);
    draw('16');
  };

  // ---- 3. GPU vs HC1 architecture ----------------------------------------------------
  builders.arch = (el) => {
    let g = '';
    // GPU panel
    g += `<rect x="8" y="40" width="74" height="40" rx="5" class="box-gpu"/><rect x="8" y="88" width="74" height="40" rx="5" class="box-gpu"/>`;
    g += text(45, 64, 'HBM', 'lbl', 'middle') + text(45, 112, 'HBM', 'lbl', 'middle');
    g += text(45, 148, 'weights: 16 GB', 'mut', 'middle');
    g += `<rect x="190" y="40" width="102" height="88" rx="6" class="box"/>`;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) g += `<rect x="${200 + c * 18}" y="${50 + r * 18}" width="12" height="12" rx="2" class="fill-gpu" opacity="0.55"/>`;
    g += text(241, 148, 'compute cores', 'mut', 'middle');
    g += `<path d="M86 84 H186" class="wire-gpu" opacity="0.35"/>`;
    for (let i = 0; i < 4; i++) g += `<circle cx="92" cy="84" r="4" class="fill-gpu flow" style="--dx:88px;--delay:${(i * 0.45).toFixed(2)}s"/>`;
    g += text(136, 72, 'all 8B weights', 'mut', 'middle');
    g += text(150, 182, 'every token: weights cross the bus', 'lbl', 'middle');
    const gpu = svg(300, 196, 'GPU: weights sit in HBM memory and all 8 billion cross the bus to the compute cores for every token', g);

    // HC1 panel
    let h = '';
    const cols = 4, rows = 3, x0 = 40, y0 = 34, cw = 52, ch = 34;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = x0 + c * (cw + 10), y = y0 + r * (ch + 8);
        h += `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="5" class="box-chip"/>`;
        h += text(x + cw / 2, y + 22, 'W ×', 'lbl', 'middle');
      }
    }
    // activation path snakes through the rows
    const yMid = (r) => y0 + r * (ch + 8) + ch / 2;
    const xr = x0 + cols * (cw + 10) - 10;
    h += `<path d="M10 ${yMid(0)} H${x0}" class="wire-chip"/>`;
    h += `<path d="M${xr} ${yMid(2)} H${xr + 22}" class="wire-chip"/>`;
    h += text(8, yMid(0) - 10, 'in', 'mut');
    h += text(xr + 4, yMid(2) - 10, 'out', 'mut');
    for (let i = 0; i < 3; i++) h += `<circle cx="14" cy="${yMid(0)}" r="4" class="fill-chip flow" style="--dx:24px;--delay:${(i * 0.6).toFixed(2)}s"/>`;
    h += text(150, 182, 'only activations move (4,096 numbers)', 'lbl', 'middle');
    const hc1 = svg(300, 196, 'Taalas HC1: weights are fixed multiply-add tiles in the circuit; only activations move between layers', h);

    el.innerHTML = '<div class="hv-panels">' +
      `<div class="hv-panel"><h4>GPU</h4>${gpu}<p><strong>Memory and compute are separate.</strong> Speed per user is capped by the bus.</p></div>` +
      `<div class="hv-panel"><h4>Taalas HC1</h4>${hc1}<p><strong>The weights are the circuit.</strong> Nothing big has to be fetched.</p></div>` +
      '</div>';
  };

  // ---- 4. Constant multiplier ---------------------------------------------------------
  builders.constmul = (el) => {
    const X = 13;
    el.innerHTML = `<div class="hv-controls"><label>Fixed weight w</label>${seg('w', [0, 1, 2, 3, 4, 5, 6, 7].map((w) => [String(w), String(w)]), '5', 'Weight value')}</div>` +
      '<div class="hv-mul"></div><div class="hv-tiles" style="margin-top:0.75rem"></div>';
    const box = el.querySelector('.hv-mul'), tiles = el.querySelector('.hv-tiles');
    const draw = (w) => {
      w = Number(w);
      const bits = [2, 1, 0].map((b) => (w >> b) & 1);
      let html = `<div class="r"><span class="note">w = ${w} in binary:</span>${bits.map((b) => `<span class="bit${b ? ' on' : ''}">${b}</span>`).join('')}<span class="note">example input x = ${X}</span></div>`;
      [2, 1, 0].forEach((b, i) => {
        const on = bits[i];
        const shift = b ? `x << ${b}` : 'x';
        html += `<div class="r${on ? '' : ' drop'}"><span class="bit${on ? ' on' : ''}">${on}</span><span class="term">${shift} = ${X << b}</span>` +
          `<span class="note">${on ? 'a plain wire (shifted copy of x)' : 'row removed: no gates'}</span></div>`;
      });
      const ones = bits.reduce((a, b) => a + b, 0);
      const adders = Math.max(0, ones - 1);
      const terms = [2, 1, 0].filter((b, i) => bits[i]).map((b) => (b ? `x·${1 << b}` : 'x'));
      html += `<div class="r"><span class="term"><b>y = ${terms.length ? terms.join(' + ') : '0'} = ${X * w}</b></span></div>`;
      box.innerHTML = html;
      tiles.innerHTML =
        tile('24 AND + 2 adders', 'general 8-bit × 3-bit multiplier, for any w') +
        tile(`0 AND + ${adders} adder${adders === 1 ? '' : 's'}`, `the same multiply with w = ${w} fixed`, true);
    };
    wireSeg(el, 'w', draw);
    draw('5');
  };

  // ---- 5. Chip cross-section: only the top two metal layers change ------------------
  builders.layers = (el) => {
    const lcg = (seed) => () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    const patterns = { A: [], B: [] };
    [['A', 7], ['B', 1234]].forEach(([k, s]) => { const r = lcg(s); for (let i = 0; i < 2 * 18; i++) patterns[k].push(r() < 0.5); });
    el.innerHTML = `<div class="hv-controls"><label>Weights for</label>${seg('model', [['A', 'Model A'], ['B', 'Model B']], 'A', 'Model')}</div><div class="hv-scroll"><div class="pic" style="min-width:480px;max-width:640px"></div></div>`;
    const pic = el.querySelector('.pic');
    const draw = (m) => {
      const W = 590, x0 = 10, w = 330;
      let g = '';
      const layerY = (i) => 188 - i * 18; // i = 0 transistors, 1..6 shared metal, 7..8 custom
      g += `<rect x="${x0}" y="${layerY(0)}" width="${w}" height="16" rx="2" class="fill-net"/>`;
      for (let i = 0; i < 18; i++) g += `<rect x="${x0 + 6 + i * 18}" y="${layerY(0) + 4}" width="8" height="8" rx="1" class="fill-gpu" opacity="0.7"/>`;
      for (let i = 1; i <= 6; i++) g += `<rect x="${x0}" y="${layerY(i) + 6}" width="${w}" height="5" rx="1" class="fill-gpu" opacity="0.35"/>`;
      for (let L = 0; L < 2; L++) {
        const y = layerY(7 + L);
        g += `<rect x="${x0}" y="${y + 6}" width="${w}" height="5" rx="1" class="fill-chip" opacity="0.5"/>`;
        for (let i = 0; i < 18; i++) if (patterns[m][L * 18 + i]) g += `<rect x="${x0 + 6 + i * 18}" y="${y + 1}" width="8" height="15" rx="1" class="fill-chip"/>`;
      }
      const lx = x0 + w + 16;
      g += `<path d="M${lx - 8} ${layerY(8)} V${layerY(7) + 16}" class="wire-chip"/>`;
      g += text(lx, layerY(8) + 12, '2 metal layers, made per model', 'lbl');
      g += text(lx, layerY(8) + 28, 'their vias encode the weights', 'mut');
      g += `<path d="M${lx - 8} ${layerY(6)} V${layerY(1) + 16}" class="wire"/>`;
      g += text(lx, layerY(4) + 4, 'shared metal wiring', 'lbl');
      g += text(lx, layerY(4) + 20, 'same for every model', 'mut');
      g += text(lx, layerY(0) + 12, 'transistors (shared)', 'lbl');
      pic.innerHTML = svg(W, 210, `Chip cross-section showing ${m === 'A' ? 'Model A' : 'Model B'}: only the top two metal layers differ between models`, g);
    };
    wireSeg(el, 'model', draw);
    draw('A');
  };

  // ---- 6. Transistor budget ----------------------------------------------------------
  builders.budget = (el) => {
    const sram = PARAMS * 3 * 6;
    const rows = [
      { name: 'Taalas HC1', sub: 'the whole chip', v: HC1_TRANSISTORS, cls: 'chip' },
      { name: 'SRAM alternative', sub: '3-bit weights, 6 transistors/bit', v: sram, cls: 'warn' }
    ];
    const max = sram * 1.2;
    el.innerHTML = '<div class="hv-bars">' + rows.map((r) =>
      `<div class="hv-row"><div class="name">${r.name}<small>${r.sub}</small></div><div class="hv-track" title="${r.name}: ${fmt(r.v / 1e9, 1)} billion transistors"><div class="hv-bar ${r.cls}" style="width:${pct(r.v, max)}"></div><span class="val">${fmt(r.v / 1e9, 1)} B</span></div></div>`).join('') +
      '</div><div class="hv-tiles" style="margin-top:0.75rem">' +
      tile(fmt(HC1_TRANSISTORS / PARAMS, 1), 'HC1 transistors per weight, everything included', true) +
      tile('18', 'transistors per weight in SRAM at 3 bits') +
      tile(`${fmt(sram / HC1_TRANSISTORS, 1)}×`, 'the whole HC1, just to store the weights in SRAM') +
      '</div>';
  };

  // ---- 7. KV cache calculator --------------------------------------------------------
  builders.kv = (el) => {
    const STEPS = [1024, 2048, 4096, 6144, 8192, 16384, 32768, 65536, 131072];
    const perTokValues = 2 * LAYERS * KV_HEADS * HEAD_DIM;
    let bits = 16, idx = 3;
    el.innerHTML = '<div class="hv-controls">' +
      `<label for="kv-ctx">Context <input id="kv-ctx" type="range" min="0" max="${STEPS.length - 1}" step="1" value="${idx}"><output></output></label>` +
      `${seg('kvb', [['16', '16-bit'], ['8', '8-bit']], '16', 'KV cache precision')}</div>` +
      '<div class="hv-bars"></div><div class="hv-tiles" style="margin-top:0.75rem"></div>';
    const out = el.querySelector('output'), bars = el.querySelector('.hv-bars'), tiles = el.querySelector('.hv-tiles');
    const draw = () => {
      const ctx = STEPS[idx], bpt = perTokValues * bits / 8;
      out.textContent = `${fmt(ctx)} tokens`;
      const rows = [
        { name: 'Your setting', sub: `${fmt(ctx)} tokens`, v: ctx * bpt, cls: 'chip' },
        { name: 'ChatJimmy limit', sub: `${fmt(DEMO_CTX)} tokens`, v: DEMO_CTX * bpt, cls: '' },
        { name: 'Llama 3.1 native', sub: `${fmt(NATIVE_CTX)} tokens`, v: NATIVE_CTX * bpt, cls: 'net' }
      ];
      const max = NATIVE_CTX * perTokValues * 2 * 1.25;
      bars.innerHTML = rows.map((r) =>
        `<div class="hv-row"><div class="name">${r.name}<small>${r.sub}</small></div><div class="hv-track" title="${r.name}: ${gib(r.v)}"><div class="hv-bar ${r.cls}" style="width:${pct(r.v, max)}"></div><span class="val">${gib(r.v)}</span></div></div>`).join('');
      tiles.innerHTML =
        tile(`${fmt(perTokValues)}`, 'numbers cached per token (2 × 32 × 8 × 128)') +
        tile(`${fmt(bpt / 1024)} KiB`, `per token at ${bits}-bit`) +
        tile(gib(ctx * bpt), `KV cache for ${fmt(ctx)} tokens`, true);
    };
    el.querySelector('input').addEventListener('input', (e) => { idx = Number(e.target.value); draw(); });
    wireSeg(el, 'kvb', (b) => { bits = Number(b); draw(); });
    draw();
  };

  // ---- 8. Measured benchmark: chip time vs round trip --------------------------------
  builders.bench = (el) => {
    const max = Math.max(...BENCH.map((b) => b[4])) * 1.02;
    const rows = [...BENCH].sort((a, b) => b[2] - a[2]);
    el.innerHTML = '<div class="hv-bars">' + rows.map(([name, pin, pout, chip, rt]) => {
      const tip = `${name}: ${fmt(pin)} prompt + ${fmt(pout)} answer tokens. Chip ${fmt(chip, 1)} ms, round trip ${fmt(rt)} ms`;
      return `<div class="hv-row"><div class="name">${name}<small>${fmt(pout)} tokens out</small></div>` +
        `<div class="hv-track" title="${tip}"><div class="hv-stack" style="width:${pct(rt, max * 1.3)}"><div class="hv-bar chip" style="width:${((chip / rt) * 100).toFixed(2)}%"></div><div class="hv-bar net" style="width:${(100 - (chip / rt) * 100).toFixed(2)}%"></div></div>` +
        `<span class="val">${fmt(chip, 1)} / ${fmt(rt)} ms</span></div></div>`;
    }).join('') + '</div>' +
      '<div class="hv-legend"><span><i style="background:var(--hv-chip)"></i>time on the chip</span><span><i style="background:var(--hv-net)"></i>network, HTTPS and web stack</span><span>labels: chip / round trip</span></div>';
  };

  // ---- 9. Trade-offs -----------------------------------------------------------------
  builders.tradeoffs = (el) => {
    el.innerHTML = '<div class="hv-panels">' +
      '<div class="hv-panel"><h4>🔒 Fixed when the chip is made</h4><ul><li>The model\'s weights</li><li>Its architecture: Llama 3.1 8B</li><li>Quantization: mixed 3-bit and 6-bit</li></ul><p><strong>New model?</strong> New masks for 2 metal layers, about 2 months to PCIe cards.</p></div>' +
      '<div class="hv-panel"><h4>🎛️ Changeable at run time</h4><ul><li>Context window size</li><li>LoRA fine-tuning adapters (in SRAM)</li><li>Sampling settings such as top-k</li><li>System prompt and the conversation</li></ul><p><strong>Same chip,</strong> different behavior within one model.</p></div>' +
      '</div>';
  };

  // ---- 10. Timeline ------------------------------------------------------------------
  builders.timeline = (el) => {
    const items = [
      ['Aug 2023', 'Taalas founded', 'Toronto; Ljubisa Bajic, Lejla Bajic, Drago Ignjatovic', false],
      ['19 Feb 2026', 'HC1 and ChatJimmy', 'Hard-wired Llama 3.1 8B, 17K tok/s claimed', false],
      ['Spring 2026', 'Mid-size reasoning model', 'Planned on HC1; not on ChatJimmy as of Oct 2026', true],
      ['6 Aug 2026', 'AMD deal', 'Definitive agreement to acquire Taalas', false],
      ['Winter 2026', 'Frontier model on HC2', 'Planned: denser silicon, 4-bit floats, many cards', true]
    ];
    el.innerHTML = '<ol class="hv-tl">' + items.map(([d, t, s, plan]) => `<li class="${plan ? 'plan' : ''}"><span>${d}${plan ? ' · planned' : ''}</span><b>${t}</b>${s}</li>`).join('') + '</ol>' +
      '<div class="hv-legend"><span><i style="background:var(--accent)"></i>happened</span><span><i style="background:var(--muted)"></i>planned (dashed)</span></div>';
  };

  function onVisible(el, fn) {
    if (!('IntersectionObserver' in window)) return fn();
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { io.disconnect(); fn(); } }, { threshold: 0.35 });
    io.observe(el);
  }

  document.querySelectorAll('figure.hv[data-hv]').forEach((fig) => {
    const build = builders[fig.dataset.hv];
    const host = fig.querySelector('.hv-canvas');
    if (!build || !host) return;
    try { build(host); } catch (e) { console.error('taalas figure', fig.dataset.hv, e); }
    if (fig.dataset.hv === 'arch') onVisible(fig, () => fig.classList.add('play'));
  });
})();
