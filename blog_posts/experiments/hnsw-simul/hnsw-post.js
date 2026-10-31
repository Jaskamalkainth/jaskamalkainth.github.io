// Figures and small simulations for /blog_posts/hnsw-explained.html.
// Each <figure class="hv" data-hv="name"> holds a text fallback; the matching builder below
// replaces it with an SVG or widget. Graph figures run the real HNSW rules (greedy descent,
// beam search, neighbor-selection heuristic) on fixed points, so what you see is what the
// algorithm does. Benchmark numbers are the SIFT1M results quoted in the article.
(function () {
  'use strict';

  const fmt = (n) => n.toLocaleString('en-US');
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const svg = (w, h, label, inner) =>
    `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">${inner}</svg>`;
  // wide diagrams keep a readable size on phones and scroll sideways inside their box
  const wide = (inner, minW) => `<div class="hv-scroll"><div class="hv-wide" style="min-width:${minW}px">${inner}</div></div>`;
  const line = (a, b, cls, extra = '') =>
    `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" class="${cls}" ${extra}/>`;
  const dot = (p, r, cls, extra = '') =>
    `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${r}" class="${cls}" ${extra}/>`;
  const diamond = (p, s, cls) =>
    `<path d="M${p[0]} ${p[1] - s}L${p[0] + s} ${p[1]}L${p[0]} ${p[1] + s}L${p[0] - s} ${p[1]}Z" class="${cls}"/>`;
  const text = (p, s, cls = '', anchor = 'start') =>
    `<text x="${p[0]}" y="${p[1]}" class="${cls}" text-anchor="${anchor}">${s}</text>`;

  // k nearest neighbours of point i among ids (by index into pts)
  function knn(pts, i, ids, k) {
    return ids.filter((j) => j !== i).sort((a, b) => dist(pts[i], pts[a]) - dist(pts[i], pts[b])).slice(0, k);
  }
  // undirected kNN graph on a subset
  function knnGraph(pts, ids, k) {
    const adj = new Map(ids.map((i) => [i, new Set()]));
    ids.forEach((i) => knn(pts, i, ids, k).forEach((j) => { adj.get(i).add(j); adj.get(j).add(i); }));
    return adj;
  }
  function greedy(pts, adj, start, q) {
    const path = [start];
    let cur = start;
    for (;;) {
      let best = cur;
      adj.get(cur).forEach((n) => { if (dist(pts[n], q) < dist(pts[best], q)) best = n; });
      if (best === cur) return path;
      path.push(best);
      cur = best;
    }
  }
  // SEARCH-LAYER with a result list of size ef; returns visited (distance computed) and results
  function beam(pts, adj, start, q, ef) {
    const d = (i) => dist(pts[i], q);
    const visited = new Set([start]);
    let C = [start], W = [start];
    const parent = new Map();
    while (C.length) {
      C.sort((a, b) => d(a) - d(b));
      const c = C.shift();
      W.sort((a, b) => d(a) - d(b));
      if (d(c) > d(W[W.length - 1])) break;
      adj.get(c).forEach((e) => {
        if (visited.has(e)) return;
        visited.add(e);
        W.sort((a, b) => d(a) - d(b));
        if (W.length < ef || d(e) < d(W[W.length - 1])) {
          parent.set(e, c);
          C.push(e); W.push(e);
          W.sort((a, b) => d(a) - d(b));
          if (W.length > ef) W.pop();
        }
      });
    }
    W.sort((a, b) => d(a) - d(b));
    const route = [W[0]];
    while (parent.has(route[0])) route.unshift(parent.get(route[0]));
    return { visited, best: W[0], route };
  }

  const builders = {};

  // ── 1. Brute force vs HNSW: how much of the data is touched ─────────────
  builders.scale = (el) => {
    const S = 230, small = S * Math.sqrt(1526 / 1e6);
    const a =
      `<rect x="10" y="10" width="${S}" height="${S}" rx="4" class="fill-node" opacity="0.85"/>` +
      text([10, 266], 'compares all <tspan font-weight="700">1,000,000</tspan> vectors', 'mut') +
      `<rect x="10" y="280" width="${S}" height="12" rx="3" class="fill-node"/>` +
      text([10, 312], '9.00 ms per query', 'lbl');
    const b =
      `<rect x="10" y="10" width="${S}" height="${S}" rx="4" class="fill-plane" stroke-dasharray="4 4"/>` +
      `<rect x="10" y="10" width="${small.toFixed(1)}" height="${small.toFixed(1)}" rx="1.5" class="fill-path"/>` +
      `<path d="M${10 + small + 4} ${10 + small + 4} Q 60 90 92 112" class="edge" stroke-width="1.5"/>` +
      text([98, 118], 'this tiny square', 'lbl') +
      text([98, 136], '= 1,526 vectors (0.15%)', 'mut') +
      text([10, 266], 'finds 97.5% of the true top 10', 'mut') +
      `<rect x="10" y="280" width="${(S * 0.23 / 9).toFixed(1)}" height="12" rx="2" class="fill-path"/>` +
      text([10, 312], '0.23 ms per query: 39× faster', 'lbl');
    el.innerHTML = '<div class="hv-panels">' +
      `<div class="hv-panel"><h4>Brute force</h4>${svg(250, 320, 'Brute force compares all 1,000,000 vectors in 9 ms', a)}</div>` +
      `<div class="hv-panel"><h4>HNSW (ef = 80)</h4>${svg(250, 320, 'HNSW compares 1,526 vectors in 0.23 ms and finds 97.5% of the true top 10', b)}</div>` +
      '</div>';
  };

  // ── 2. Recall@10 in pictures ─────────────────────────────────────────────
  builders.recall = (el) => {
    let h = '<div class="hv-recall" aria-label="9 of the true 10 nearest neighbors found">';
    for (let i = 1; i <= 10; i++) h += i === 7 ? '<i class="miss" title="missed">✗</i>' : `<i class="ok" title="found">${i}</i>`;
    h += '<span class="eq">9 of the true 10 found → recall@10 = 0.9</span></div>';
    el.innerHTML = h;
  };

  // ── 3. The layered graph and one search descending it ───────────────────
  // fixed points in a unit square; level = top layer of each point
  const LP = [
    [0.08, 0.30, 2], [0.15, 0.75, 1], [0.22, 0.45, 0], [0.28, 0.15, 0], [0.30, 0.85, 0],
    [0.36, 0.55, 0], [0.42, 0.28, 0], [0.47, 0.78, 0], [0.52, 0.10, 1], [0.55, 0.50, 2],
    [0.60, 0.92, 1], [0.64, 0.33, 0], [0.70, 0.66, 0], [0.74, 0.18, 0], [0.78, 0.45, 1],
    [0.83, 0.85, 0], [0.88, 0.28, 0], [0.92, 0.60, 0], [0.12, 0.05, 0], [0.96, 0.95, 0],
    [0.05, 0.95, 0], [0.40, 0.98, 0], [0.68, 0.02, 0], [0.86, 0.70, 1], [0.80, 0.58, 0]
  ];
  const LQ = [0.84, 0.62];
  builders.layers = (el) => {
    const W = 440, D = 92, SK = 80, X0 = 30, tops = [22, 168, 314];
    const map = (p, layer) => [X0 + p[0] * W + (1 - p[1]) * SK, tops[2 - layer] + p[1] * D];
    const pts = LP.map((p) => [p[0], p[1]]);
    const ids = [0, 1, 2].map((l) => LP.map((p, i) => (p[2] >= l ? i : -1)).filter((i) => i >= 0));
    const adj = [knnGraph(pts, ids[0], 3), knnGraph(pts, ids[1], 2), knnGraph(pts, ids[2], 1)];
    // search: greedy on layers 2 and 1, beam (ef = 3) on layer 0, entry = first top-layer node
    const hops = [];
    let cur = ids[2][0];
    for (let l = 2; l >= 1; l--) {
      const p = greedy(pts, adj[l], cur, LQ);
      hops.push({ l, path: p });
      cur = p[p.length - 1];
    }
    const b = beam(pts, adj[0], cur, LQ, 3);
    hops.push({ l: 0, path: b.route });
    const names = ['Layer 0 · local streets', 'Layer 1 · main roads', 'Layer 2 · motorways'];
    const counts = ids.map((s) => s.length);
    let g = '';
    for (let l = 2; l >= 0; l--) {
      const c = [[0, 0], [1, 0], [1, 1], [0, 1]].map((p) => map(p, l));
      g += `<path d="M${c.map((p) => p.join(' ')).join('L')}Z" class="plane"/>`;
      g += text([X0 + W + SK + 14, tops[2 - l] + 40], names[l], 'lbl');
      g += text([X0 + W + SK + 14, tops[2 - l] + 58], `${counts[l]} of ${LP.length} points`, 'mut');
    }
    // dashed drop lines: a point on layer l also exists on every layer below
    LP.forEach((p, i) => { for (let l = p[2]; l >= 1; l--) g += line(map(pts[i], l), map(pts[i], l - 1), 'drop'); });
    for (let l = 2; l >= 0; l--) {
      adj[l].forEach((ns, i) => ns.forEach((j) => { if (i < j) g += line(map(pts[i], l), map(pts[j], l), 'edge'); }));
      ids[l].forEach((i) => { g += dot(map(pts[i], l), l === 0 ? 4.5 : 5.5, l === 0 && b.visited.has(i) ? 'node seen' : 'node'); });
      g += diamond(map(LQ, l), 7, 'query');
    }
    // the animated path, layer by layer, including the drops between layers
    let delay = 0.3, seq = '';
    hops.forEach((h, k) => {
      for (let s = 1; s < h.path.length; s++) {
        const a = map(pts[h.path[s - 1]], h.l), z = map(pts[h.path[s]], h.l), len = dist(a, z) + 1;
        seq += line(a, z, 'path anim', `style="--len:${len.toFixed(0)};--delay:${delay.toFixed(2)}s"`);
        delay += 0.55;
      }
      const end = h.path[h.path.length - 1];
      if (k < hops.length - 1) {
        const a = map(pts[end], h.l), z = map(pts[end], h.l - 1), len = dist(a, z) + 1;
        seq += line(a, z, 'path anim', `stroke-dasharray="6 5" style="--len:${len.toFixed(0)};--delay:${delay.toFixed(2)}s" opacity="0.7"`);
        delay += 0.55;
      }
    });
    const start = map(pts[ids[2][0]], 2), fin = map(pts[b.best], 0);
    const exact = ids[0].reduce((m, i) => (dist(pts[i], LQ) < dist(pts[m], LQ) ? i : m), ids[0][0]);
    seq += dot(start, 9, 'node hit pop', `style="--delay:0s" fill-opacity="0.35"`) +
      `<text x="${start[0] - 12}" y="${start[1] - 10}" class="lbl pop" style="--delay:0s" text-anchor="end">start</text>`;
    seq += dot(fin, 9, 'node hit pop', `style="--delay:${delay.toFixed(2)}s" fill-opacity="0.35"`) +
      `<text x="${fin[0] + 14}" y="${fin[1] + 30}" class="lbl pop" style="--delay:${delay.toFixed(2)}s">${b.best === exact ? 'true nearest found ✓' : 'closest found'}</text>`;
    el.innerHTML =
      '<div class="hv-controls"><button type="button" class="hv-btn" data-replay>↻ Replay the search</button></div>' +
      wide(svg(720, 420, 'Three stacked graph layers. A search starts on the sparse top layer, hops toward the query, drops down, and finishes on the bottom layer at the nearest point.', g + seq), 600) +
      '<div class="hv-legend"><span><i class="fill-node" style="background:var(--hv-node)"></i>point</span><span><i style="background:var(--hv-query);border-radius:2px;transform:rotate(45deg)"></i>query</span><span><i class="ln" style="background:var(--hv-path)"></i>search path</span><span><i style="background:var(--medium)"></i>checked on layer 0</span></div>';
    const fig = el.closest('.hv');
    const play = () => { fig.classList.remove('play'); void fig.offsetWidth; fig.classList.add('play'); };
    el.querySelector('[data-replay]').addEventListener('click', play);
    onVisible(fig, play);
  };

  // ── 4. Greedy gets stuck; a beam (ef) gets around it ────────────────────
  builders.greedy = (el) => {
    const P = { S: [40, 120], A: [120, 78], L: [190, 52], D: [205, 14], B: [110, 172], C: [182, 192], T: [236, 150] };
    const Q = [252, 124];
    const E = [['S', 'A'], ['S', 'B'], ['A', 'L'], ['A', 'B'], ['L', 'D'], ['B', 'C'], ['C', 'T']];
    const keys = Object.keys(P), pts = keys.map((k) => P[k]);
    const adj = new Map(keys.map((_, i) => [i, new Set()]));
    E.forEach(([a, b]) => { const i = keys.indexOf(a), j = keys.indexOf(b); adj.get(i).add(j); adj.get(j).add(i); });
    const s = keys.indexOf('S');
    const g1 = greedy(pts, adj, s, Q);
    const b4 = beam(pts, adj, s, Q, 4);
    const panel = (title, route, visited, ok, note) => {
      let g = '';
      E.forEach(([a, b]) => { g += line(P[a], P[b], 'edge'); });
      for (let i = 1; i < route.length; i++) g += line(pts[route[i - 1]], pts[route[i]], ok ? 'path' : 'path bad');
      keys.forEach((k, i) => { g += dot(P[k], 6, visited.has(i) ? 'node seen' : 'node dim'); });
      g += diamond(Q, 8, 'query') + text([Q[0], Q[1] - 14], 'query', 'mut', 'middle');
      g += text([P.S[0] - 4, P.S[1] + 22], 'start', 'mut', 'middle');
      const end = pts[route[route.length - 1]];
      g += ok ? text([end[0] - 8, end[1] + 26], '✓ nearest', 'lbl')
              : text([end[0], end[1] - 14], '✗ stuck', 'lbl', 'middle');
      return `<div class="hv-panel"><h4>${title}</h4>${svg(300, 215, title, g)}<p>${note}</p></div>`;
    };
    el.innerHTML = '<div class="hv-panels">' +
      panel('ef = 1: pure greedy', g1, new Set(g1), false,
        `Moves to the closest neighbor each step, then stops at a <strong>local minimum</strong>: every neighbor is farther from the query, but the true nearest point is elsewhere. Checked ${g1.length} points.`) +
      panel('ef = 4: beam search', b4.route, b4.visited, true,
        `Keeps the best 4 candidates open, so it also explores the lower branch and reaches the <strong>true nearest</strong>. Checked ${b4.visited.size} points.`) +
      '</div><div class="hv-legend"><span><i style="background:var(--medium)"></i>distance computed</span><span><i style="background:var(--hv-edge)"></i>never looked at</span></div>';
  };

  // ── 5. Insertion in four steps ──────────────────────────────────────────
  builders.insert = (el) => {
    const card = (n, t, body) => `<div class="hv-card"><h4><span class="hv-step-n">${n}</span>${t}</h4><p class="sub">${body}</p></div>`;
    el.innerHTML = '<div class="hv-cards">' +
      card(1, 'Roll its level', 'With M = 16: <strong>93.75%</strong> stay on layer 0 only, 5.86% reach layer 1, 0.39% go higher.') +
      card(2, 'Search down', 'Greedy hops from the top entry point down to the new vector\'s level.') +
      card(3, 'Link to M neighbors', 'On each of its layers, a beam search (efConstruction) finds candidates; the best M become links (2M on layer 0).') +
      card(4, 'Prune', 'Neighbors that now have too many links drop their weakest ones.') +
      '</div>';
  };

  // ── 6. Layer sizes for N = 1M, with an M slider ─────────────────────────
  builders.levels = (el) => {
    const N = 1e6, Ms = [4, 8, 16, 32, 64];
    const built = [1e6, 62403, 3903, 210, 16, 1];
    el.innerHTML =
      '<div class="hv-controls"><label>M <input type="range" min="0" max="4" step="1" value="2" aria-label="M"> <output>16</output></label><span class="mut" style="color:var(--muted)">1,000,000 vectors · bar length on a log scale</span></div><div class="hv-chart" data-chart></div>';
    const chart = el.querySelector('[data-chart]'), input = el.querySelector('input'), out = el.querySelector('output');
    const draw = () => {
      const M = Ms[+input.value];
      out.textContent = M;
      const rows = [];
      for (let l = 0; ; l++) { const c = N * Math.pow(M, -l); if (c < 0.5) break; rows.push(c); }
      const X0 = 92, Wd = 420, rowH = 30, H = rows.length * rowH + 34;
      const xs = (c) => X0 + (Math.log10(Math.max(c, 1)) / 6) * Wd;
      let g = '';
      [1, 10, 100, 1e3, 1e4, 1e5, 1e6].forEach((t) => {
        g += line([xs(t), 4], [xs(t), H - 26], 'grid') + text([xs(t), H - 10], t >= 1e3 ? (t >= 1e6 ? '1M' : fmt(t / 1e3) + 'k') : String(t), 'mut', 'middle');
      });
      rows.forEach((c, l) => {
        const y = 10 + l * rowH;
        g += text([X0 - 12, y + 14], `Layer ${l}`, 'lbl', 'end');
        g += `<rect x="${X0}" y="${y + 3}" width="${Math.max(xs(c) - X0, 0).toFixed(1)}" height="16" rx="4" class="fill-path"><title>Layer ${l}: about ${fmt(Math.round(c))} vectors</title></rect>`;
        g += dot([xs(c), y + 11], 5, 'node hit');
        const lab = M === 16 && built[l] !== undefined ? `${fmt(Math.round(c))} expected · ${fmt(built[l])} built` : `${fmt(Math.round(c))}`;
        g += xs(c) > X0 + Wd * 0.6
          ? `<text x="${(xs(c) - 12).toFixed(1)}" y="${y + 15}" text-anchor="end" style="fill:var(--accent-ink);font-size:12px">${lab}</text>`
          : text([xs(c) + 10, y + 15], lab, 'mut');
      });
      chart.innerHTML = wide(svg(640, H, `Expected vectors per layer for M = ${M}`, g), 560);
    };
    input.addEventListener('input', draw);
    draw();
  };

  // ── 7. Neighbor selection: closest M vs the diversity heuristic ─────────
  builders.heuristic = (el) => {
    const A = [[40, 80], [58, 140], [78, 58], [90, 112], [100, 160], [112, 82]];
    const B = [[214, 98], [236, 146], [250, 70], [272, 116], [286, 160]];
    const X = [146, 112], pts = A.concat(B), M = 3;
    const byD = pts.map((p, i) => i).sort((a, b) => dist(X, pts[a]) - dist(X, pts[b]));
    const closest = byD.slice(0, M);
    const diverse = [];
    for (const c of byD) {
      if (diverse.length >= M) break;
      if (diverse.every((r) => dist(X, pts[c]) < dist(pts[c], pts[r]))) diverse.push(c);
    }
    const panel = (title, links, note) => {
      let g = `<ellipse cx="78" cy="110" rx="62" ry="72" class="plane" opacity="0.7"/><ellipse cx="250" cy="115" rx="56" ry="66" class="plane" opacity="0.7"/>`;
      g += text([78, 205], 'cluster A', 'mut', 'middle') + text([250, 205], 'cluster B', 'mut', 'middle');
      links.forEach((i) => { g += line(X, pts[i], 'path'); });
      pts.forEach((p) => { g += dot(p, 6, 'node'); });
      g += dot(X, 8, 'query') + text([X[0], X[1] - 14], 'new', 'lbl', 'middle');
      return `<div class="hv-panel"><h4>${title}</h4>${svg(310, 215, title, g)}<p>${note}</p></div>`;
    };
    const crosses = diverse.some((i) => i >= A.length);
    el.innerHTML = '<div class="hv-panels">' +
      panel(`Just the ${M} closest`, closest, 'Every link stays inside cluster A. Nothing leads to cluster B, so a search that lands in A can\'t get across.') +
      panel('HNSW\'s heuristic', diverse, crosses
        ? 'Skips candidates that sit "behind" a neighbor it already kept, so a link <strong>bridges to cluster B</strong>.'
        : 'Skips candidates that sit "behind" a neighbor it already kept, so links point in different directions.') +
      '</div>';
  };

  // ── 8. The three knobs ──────────────────────────────────────────────────
  builders.knobs = (el) => {
    const spokes = (n, r) => {
      let g = '';
      for (let i = 0; i < n; i++) { const a = (i / n) * 2 * Math.PI; g += line([50, 45], [50 + r * Math.cos(a), 45 + r * Math.sin(a)], 'edge') + dot([50 + r * Math.cos(a), 45 + r * Math.sin(a)], 4, 'node'); }
      return g + dot([50, 45], 7, 'node hit');
    };
    const beamPic = (n) => {
      let g = diamond([18, 45], 7, 'query');
      for (let i = 0; i < n; i++) { const y = 45 + (i - (n - 1) / 2) * (70 / Math.max(n - 1, 1)); g += line([28, 45], [180, y], 'edge') + dot([180, y], 4, 'node seen'); }
      return g;
    };
    const card = (t, sub, pic, chips) => `<div class="hv-card"><h4>${t}</h4><p class="sub">${sub}</p>${pic}<div class="hv-chips">${chips}</div></div>`;
    const up = (s) => `<span class="hv-chip up">▲ ${s}</span>`, cost = (s) => `<span class="hv-chip cost">▼ ${s}</span>`;
    el.innerHTML = '<div class="hv-cards">' +
      card('M', 'links per node · set at build', svg(200, 90, 'A node with 4 links next to a node with 10 links', `<g>${spokes(4, 32)}</g><g transform="translate(100 0)">${spokes(10, 32)}</g>`),
        up('recall') + cost('memory') + cost('build & query time')) +
      card('efConstruction', 'beam while building · set at build', svg(200, 90, 'A wide beam of candidates while building', beamPic(9)),
        up('graph quality → recall') + cost('build time only')) +
      card('efSearch (ef)', 'beam per query · change any time', svg(200, 90, 'A narrower beam of candidates at query time', beamPic(6)),
        up('recall') + cost('query time') + '<span class="hv-chip">no rebuild needed</span>') +
      '</div>';
  };

  // ── 9. Benchmark: pick ef, see recall vs time (SIFT1M, hnswlib, 1 thread) ─
  const BENCH = [
    { ef: 10, r: 0.710, ms: 0.048, n: 393 }, { ef: 20, r: 0.839, ms: 0.078, n: 572 },
    { ef: 40, r: 0.927, ms: 0.123, n: 904 }, { ef: 80, r: 0.975, ms: 0.230, n: 1526 },
    { ef: 160, r: 0.993, ms: 0.400, n: 2655 }, { ef: 320, r: 0.998, ms: 0.729, n: 4640 }
  ];
  builders.bench = (el) => {
    el.innerHTML =
      '<div class="hv-controls"><label>efSearch <input type="range" min="0" max="5" step="1" value="3" aria-label="efSearch"> <output>80</output></label></div>' +
      '<div class="hv-chart" data-chart></div><div class="hv-tiles" data-tiles></div>';
    const chart = el.querySelector('[data-chart]'), input = el.querySelector('input'), out = el.querySelector('output'), tiles = el.querySelector('[data-tiles]');
    const X0 = 56, X1 = 600, Y0 = 262, Y1 = 34;
    const xs = (ms) => X0 + (ms / 0.8) * (X1 - X0), ys = (r) => Y0 - ((r - 0.65) / 0.35) * (Y0 - Y1);
    const draw = () => {
      const k = +input.value, s = BENCH[k];
      out.textContent = s.ef;
      let g = '';
      [0.7, 0.8, 0.9, 1.0].forEach((r) => { g += line([X0, ys(r)], [X1, ys(r)], 'grid') + text([X0 - 8, ys(r) + 4], r.toFixed(1), 'mut', 'end'); });
      [0, 0.2, 0.4, 0.6, 0.8].forEach((m) => { g += text([xs(m), Y0 + 18], m.toFixed(1), 'mut', 'middle'); });
      g += line([X0, Y0], [X1, Y0], 'axis');
      g += text([X1, Y0 + 36], 'milliseconds per query →', 'mut', 'end') + text([X0 - 44, 12], 'recall@10 ↑', 'mut');
      g += `<polyline points="${BENCH.map((b) => `${xs(b.ms).toFixed(1)},${ys(b.r).toFixed(1)}`).join(' ')}" class="path" stroke-width="2"/>`;
      BENCH.forEach((b, i) => {
        const p = [xs(b.ms), ys(b.r)];
        g += `<g data-i="${i}" style="cursor:pointer">${dot(p, 14, '', 'fill="transparent"')}${dot(p, i === k ? 8 : 5, i === k ? 'query' : 'node hit')}</g>`;
        if (i === k || i === 0 || i === BENCH.length - 1) g += text([p[0] + (i === BENCH.length - 1 ? -10 : 10), p[1] + (i === k ? 22 : 18)], `ef ${b.ef}`, i === k ? 'lbl' : 'mut', i === BENCH.length - 1 ? 'end' : 'start');
      });
      chart.innerHTML = wide(svg(620, 302, 'Recall versus query time for six efSearch values on SIFT1M', g) + '<div class="hv-tip"></div>', 520);
      const tip = chart.querySelector('.hv-tip');
      chart.querySelectorAll('[data-i]').forEach((node) => {
        const b = BENCH[+node.dataset.i];
        node.addEventListener('click', () => { input.value = node.dataset.i; draw(); });
        node.addEventListener('mouseenter', () => {
          const r = chart.querySelector('.hv-wide').getBoundingClientRect(), c = node.lastElementChild.getBoundingClientRect();
          tip.textContent = `ef ${b.ef}: recall ${b.r.toFixed(3)}, ${b.ms} ms`;
          tip.style.left = (c.left - r.left + c.width / 2) + 'px'; tip.style.top = (c.top - r.top) + 'px'; tip.style.opacity = 1;
        });
        node.addEventListener('mouseleave', () => { tip.style.opacity = 0; });
      });
      tiles.innerHTML =
        `<div class="hv-tile"><b>${(s.r * 100).toFixed(1)}%</b><span>of the true top 10 found</span></div>` +
        `<div class="hv-tile"><b>${s.ms} ms</b><span>per query (brute force: 9.00 ms)</span></div>` +
        `<div class="hv-tile"><b>${Math.round(9 / s.ms)}×</b><span>faster than brute force</span></div>` +
        `<div class="hv-tile"><b>${fmt(s.n)}</b><span>vectors compared, of 1,000,000</span></div>`;
    };
    input.addEventListener('input', draw);
    draw();
  };

  // ── 10. Memory calculator (hnswlib's layout) ────────────────────────────
  builders.memory = (el) => {
    el.innerHTML =
      '<div class="hv-controls">' +
      '<label>Vectors <select data-n><option value="1e5">100k</option><option value="1e6" selected>1M</option><option value="1e7">10M</option><option value="1e8">100M</option></select></label>' +
      '<label>Dimensions <select data-d><option>128</option><option>384</option><option selected>768</option><option>1536</option></select></label>' +
      '<label>M <select data-m><option>8</option><option selected>16</option><option>32</option><option>64</option></select></label>' +
      '</div><div data-chart></div><div class="hv-legend"><span><i class="sq" style="background:var(--hv-node)"></i>raw vectors (float32)</span><span><i class="sq" style="background:var(--hv-query)"></i>graph links + IDs</span></div>';
    const q = (s) => el.querySelector(s), chart = q('[data-chart]');
    const gb = (b) => (b / 1e9 >= 100 ? (b / 1e9).toFixed(0) : (b / 1e9).toFixed(2)) + ' GB';
    const draw = () => {
      const N = +q('[data-n]').value, d = +q('[data-d]').value, M = +q('[data-m]').value;
      const vec = N * d * 4;
      // layer-0 links (2M × 4 B + count) + 8 B label + upper layers (expected 1/(M−1) levels of M links)
      const links = N * (2 * M * 4 + 4 + 8 + (M * 4 + 4) / (M - 1));
      const tot = vec + links, W = 560, wv = (vec / tot) * W;
      let g = `<rect x="0" y="8" width="${(wv - 1).toFixed(1)}" height="34" rx="4" class="fill-node"><title>Raw vectors: ${gb(vec)}</title></rect>` +
        `<rect x="${(wv + 1).toFixed(1)}" y="8" width="${Math.max(W - wv - 1, 3).toFixed(1)}" height="34" rx="4" class="fill-query"><title>Graph: ${gb(links)}</title></rect>`;
      chart.innerHTML = svg(W, 50, `Memory: ${gb(vec)} of vectors plus ${gb(links)} of graph`, g) +
        '<div class="hv-tiles">' +
        `<div class="hv-tile"><b>${gb(tot)}</b><span>total in RAM</span></div>` +
        `<div class="hv-tile"><b>${gb(vec)}</b><span>raw vectors (${((vec / tot) * 100).toFixed(0)}%)</span></div>` +
        `<div class="hv-tile"><b>${gb(links)}</b><span>graph links + IDs (${((links / tot) * 100).toFixed(0)}%)</span></div></div>`;
    };
    el.querySelectorAll('select').forEach((s) => s.addEventListener('change', draw));
    draw();
  };

  // ── 11. Brute force vs IVF vs HNSW at a glance ──────────────────────────
  builders.compare = (el) => {
    const P = [[30, 30], [55, 70], [40, 110], [80, 40], [95, 95], [70, 130], [130, 30], [150, 75], [125, 120], [170, 115], [185, 40], [200, 135], [215, 85], [230, 30]];
    const Q = [160, 95];
    const flat = () => P.map((p) => line(Q, p, 'qline')).join('') + P.map((p) => dot(p, 5, 'node seen')).join('') + diamond(Q, 7, 'query');
    const ivf = () => {
      // its own clustered points: k-means cells, scan the 2 cells whose centroids are nearest the query
      const C = [[52, 85], [132, 52], [205, 112]];
      const off = [[-18, -10], [12, -16], [16, 12], [-10, 16], [2, 0]];
      const P2 = C.flatMap((c) => off.map((o) => [c[0] + o[0], c[1] + o[1]]));
      const Q2 = [172, 86];
      const scan = C.map((c, k) => k).sort((a, b) => dist(Q2, C[a]) - dist(Q2, C[b])).slice(0, 2);
      let g = '';
      C.forEach((c, k) => { g += `<circle cx="${c[0]}" cy="${c[1]}" r="32" class="plane" ${scan.includes(k) ? '' : 'opacity="0.45"'}/>`; });
      P2.forEach((p, i) => { g += dot(p, 5, scan.includes(Math.floor(i / off.length)) ? 'node seen' : 'node dim'); });
      return g + diamond(Q2, 7, 'query');
    };
    const graph = () => {
      const adjL = [[0, 1], [1, 4], [4, 7], [7, 9], [0, 3], [3, 6], [6, 10], [2, 5], [5, 8], [8, 9], [10, 13], [12, 11], [7, 12], [1, 2]];
      let g = adjL.map(([a, b]) => line(P[a], P[b], 'edge')).join('');
      [[0, 1], [1, 4], [4, 7], [7, 9]].forEach(([a, b]) => { g += line(P[a], P[b], 'path'); });
      P.forEach((p, i) => { g += dot(p, 5, [0, 1, 4, 7, 9, 3, 2, 8, 12].includes(i) ? 'node seen' : 'node dim'); });
      return g + diamond(Q, 7, 'query');
    };
    const card = (t, pic, best, weak) => `<div class="hv-panel"><h4>${t}</h4>${svg(260, 160, t, pic)}<p><strong>Best for:</strong> ${best}</p><p><strong>Weak spot:</strong> ${weak}</p></div>`;
    el.innerHTML = '<div class="hv-panels">' +
      card('Brute force', flat(), 'under ~100k vectors, or exact answers', 'time grows with every vector') +
      card('IVF', ivf(), 'huge collections on little memory (with PQ)', 'needs training; lower recall at the same speed') +
      card('HNSW', graph(), 'fast, high-recall search on changing data', 'memory and build time') +
      '</div><div class="hv-legend"><span><i style="background:var(--medium)"></i>distance computed</span><span><i style="background:var(--hv-edge)"></i>skipped</span></div>';
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
    try { build(host); } catch (e) { console.error('hnsw figure', fig.dataset.hv, e); }
  });
})();
