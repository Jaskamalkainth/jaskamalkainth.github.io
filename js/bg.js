/* Background canvas.
   "graph": a knowledge graph of things I care about. Every few seconds a query
            walks it greedily, HNSW-style: hop to whichever neighbour is closest
            to the target until no neighbour is closer.
   "math":  a slow drift of formulas.
   Colours come from the active theme's CSS variables. */
(function () {
  var canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var root = document.documentElement;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 0, H = 0, dpr = 1, mode = 'off', raf = 0, colors = {};
  var calmL = 0, calmR = 0; // x-range of the main text column; the graph goes quiet behind it
  var mouse = { x: -1e4, y: -1e4 };

  var CLUSTERS = [
    ['search', ['BM25', 'HNSW', 'inverted index', 'tf-idf', 'k-NN', 'reranking', 'query', 'embeddings', 'NDCG', 'recall@k', 'tokenizer', 'Faiss']],
    ['algorithms', ['segment tree', 'DSU', 'trie', 'suffix array', 'Aho-Corasick', 'Dijkstra', 'bloom filter', 'DP', 'Z-function', 'heap']],
    ['math', ['FFT', 'e^{iπ}+1=0', 'eigenvectors', 'Bayes', 'PDE', 'Σ', '∫', 'O(n log n)', 'cosine sim', 'Markov']],
    ['mind', ['Nietzsche', 'Camus', 'Socrates', 'Kant', 'why?', 'meaning', 'Spinoza', 'Jung']],
    ['sound', ['Beethoven', 'raga', 'rhythm', 'harmony', 'Bach', '♪', 'silence']]
  ];

  var FORMULAS = [
    'score = Σ IDF(q)·tf·(k+1) / (tf + k·(1−b+b·|d|/avgdl))',
    'cos θ = a·b / ‖a‖‖b‖', 'e^{iπ} + 1 = 0', 'O(n log n)', 'P(A|B) = P(B|A)P(A) / P(B)',
    '∂u/∂t = ½σ²S²∂²u/∂S² + rS∂u/∂S − ru', 'X_k = Σ x_n e^{−2πikn/N}', 'find(x) = p[x]==x ? x : p[x]=find(p[x])',
    'NDCG@k = DCG@k / IDCG@k', 'Σ 1/n² = π²/6', 'Ax = λx', 'H(X) = −Σ p log p', 'ε-greedy', 'lim_{n→∞} (1+1/n)^n = e',
    'softmax(z)_i = e^{z_i} / Σ e^{z_j}', 'T(n) = 2T(n/2) + O(n)', 'p(fp) ≈ (1 − e^{−kn/m})^k', '∇·E = ρ/ε₀',
    '한', 'why?', '♪ ♫', '∴', 'amor fati', 'P ≠ NP ?', '∀ε>0 ∃δ>0', '2^10 = 1024', 'while(alive) learn();'
  ];

  function readColors() {
    var cs = getComputedStyle(root);
    colors.node = cs.getPropertyValue('--node').trim() || '#5eead4';
    colors.edge = cs.getPropertyValue('--edge').trim() || '94,234,212';
    colors.hot = cs.getPropertyValue('--accent-2').trim() || '#fbbf24';
    colors.text = cs.getPropertyValue('--muted').trim() || '#8f9cbb';
    colors.mono = cs.getPropertyValue('--font-mono').trim() || 'monospace';
    colors.light = cs.getPropertyValue('color-scheme').trim() === 'light';
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var col = document.querySelector('.hero-line');
    if (col) { var r = col.getBoundingClientRect(); calmL = r.left - 20; calmR = r.left + Math.max(r.width, 720) + 20; }
  }
  function calm(x) {
    var d = Math.min(x - calmL, calmR - x);
    return d <= 0 ? 1 : Math.max(.38, 1 - d / 80);
  }

  function rnd(a, b) { return a + Math.random() * (b - a); }

  /* ---------------- knowledge graph ---------------- */
  var nodes = [], edges = [], walk = null, nextWalkAt = 0;

  function buildGraph() {
    nodes = []; edges = [];
    var small = W < 700;
    var centres = [[.18, .28], [.82, .25], [.78, .78], [.2, .78], [.5, .52]];
    CLUSTERS.forEach(function (c, ci) {
      var labels = small ? c[1].slice(0, 5) : c[1];
      var cx = centres[ci][0] * W, cy = centres[ci][1] * H;
      var spread = Math.min(W, H) * (small ? .2 : .17);
      labels.forEach(function (label) {
        var a = rnd(0, Math.PI * 2), r = spread * Math.sqrt(Math.random());
        addNode(cx + Math.cos(a) * r, cy + Math.sin(a) * r * .8, label);
      });
    });
    var extra = small ? 18 : 46;
    for (var i = 0; i < extra; i++) addNode(rnd(0, W), rnd(0, H), '');

    // connect each node to its k nearest neighbours: a navigable small world, good enough for greedy routing
    var k = 3, seen = {};
    nodes.forEach(function (n, i) {
      var d = nodes.map(function (m, j) { return [j, dist2(n, m)]; }).filter(function (p) { return p[0] !== i; });
      d.sort(function (a, b) { return a[1] - b[1]; });
      for (var t = 0; t < k; t++) link(i, d[t][0]);
      // a rare long-range link, so walks cross clusters
      if (Math.random() < .08) link(i, (Math.random() * nodes.length) | 0);
    });
    function link(a, b) {
      if (a === b) return;
      var key = a < b ? a + '-' + b : b + '-' + a;
      if (seen[key]) return;
      seen[key] = 1; edges.push([a, b]);
      nodes[a].nb.push(b); nodes[b].nb.push(a);
    }
  }
  function addNode(x, y, label) {
    x = Math.max(20, Math.min(W - 20, x)); y = Math.max(20, Math.min(H - 20, y));
    nodes.push({ x: x, y: y, hx: x, hy: y, ph: rnd(0, 6.28), sp: rnd(.2, .5), r: label ? 2.6 : 1.6, label: label, nb: [], lit: 0 });
  }
  function dist2(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy; }

  function startWalk() {
    var labelled = nodes.filter(function (n) { return n.label; });
    var from = nodes.indexOf(labelled[(Math.random() * labelled.length) | 0]);
    var to = nodes.indexOf(labelled[(Math.random() * labelled.length) | 0]);
    if (from === to) return;
    var path = [from], cur = from, guard = 0;
    while (cur !== to && guard++ < 40) {
      var best = cur, bd = dist2(nodes[cur], nodes[to]);
      nodes[cur].nb.forEach(function (j) { var d = dist2(nodes[j], nodes[to]); if (d < bd) { bd = d; best = j; } });
      if (best === cur) break; // local minimum, exactly like real greedy search
      path.push(best); cur = best;
    }
    if (path.length < 3) return;
    walk = { path: path, seg: 0, t: 0, target: to, found: cur === to, hold: 0 };
  }

  function drawGraph(time) {
    var t = time / 1000;
    ctx.clearRect(0, 0, W, H);
    nodes.forEach(function (n) {
      n.x = n.hx + Math.cos(t * n.sp + n.ph) * 8;
      n.y = n.hy + Math.sin(t * n.sp * 1.3 + n.ph) * 6;
      var dm = Math.hypot(n.x - mouse.x, n.y - mouse.y);
      n.lit = Math.max(n.lit * .94, dm < 140 ? 1 - dm / 140 : 0);
    });

    var ea = colors.light ? .16 : .12;
    ctx.lineWidth = 1;
    edges.forEach(function (e) {
      var a = nodes[e[0]], b = nodes[e[1]], l = Math.max(a.lit, b.lit);
      ctx.strokeStyle = 'rgba(' + colors.edge + ',' + (ea * calm((a.x + b.x) / 2) + l * .45) + ')';
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    });

    // the greedy walk
    if (walk) {
      var p = walk.path;
      var wa = W < 700 ? .4 : .85; // on phones the whole screen is text, keep the walk subtle
      ctx.strokeStyle = colors.hot; ctx.lineWidth = 2; ctx.globalAlpha = wa;
      ctx.beginPath(); ctx.moveTo(nodes[p[0]].x, nodes[p[0]].y);
      for (var i = 1; i <= walk.seg && i < p.length; i++) ctx.lineTo(nodes[p[i]].x, nodes[p[i]].y);
      var head;
      if (walk.seg < p.length - 1) {
        var a = nodes[p[walk.seg]], b = nodes[p[walk.seg + 1]];
        head = { x: a.x + (b.x - a.x) * walk.t, y: a.y + (b.y - a.y) * walk.t };
        ctx.lineTo(head.x, head.y);
        walk.t += reduced ? 1 : .045;
        if (walk.t >= 1) { walk.t = 0; walk.seg++; nodes[p[walk.seg]].lit = 1; }
      } else {
        head = nodes[p[p.length - 1]];
        walk.hold++;
      }
      ctx.stroke();
      ctx.fillStyle = colors.hot;
      ctx.beginPath(); ctx.arc(head.x, head.y, 4, 0, 6.28); ctx.fill();
      // ring the target
      var tg = nodes[walk.target];
      ctx.strokeStyle = colors.hot; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(tg.x, tg.y, 9 + Math.sin(t * 4) * 2, 0, 6.28); ctx.stroke();
      if (walk.hold > 0 && W >= 700) {
        ctx.font = '11px ' + colors.mono; ctx.fillStyle = colors.hot;
        ctx.fillText((walk.found ? '✓ found in ' : '≈ local min after ') + (p.length - 1) + ' hops', head.x + 12, head.y + 18);
      }
      ctx.globalAlpha = 1;
      if (walk.hold > 110) { walk = null; nextWalkAt = time + 1600; }
    } else if (time > nextWalkAt) {
      startWalk(); nextWalkAt = time + 800;
    }

    var fs = W < 700 ? 10 : 11.5;
    ctx.font = fs + 'px ' + colors.mono;
    nodes.forEach(function (n, idx) {
      var pos = walk ? walk.path.indexOf(idx) : -1, onPath = pos > -1 && pos <= walk.seg, c = onPath ? 1 : calm(n.x);
      ctx.fillStyle = onPath ? colors.hot : colors.node;
      ctx.globalAlpha = ((colors.light ? .45 : .5) + n.lit * .5) * c;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r + n.lit * 1.5, 0, 6.28); ctx.fill();
      if (n.label) {
        ctx.globalAlpha = Math.min(1, ((colors.light ? .5 : .42) + n.lit * .55) * c + (onPath ? .4 : 0));
        ctx.fillStyle = onPath ? colors.hot : colors.text;
        ctx.fillText(n.label, n.x + 6, n.y - 6);
      }
    });
    ctx.globalAlpha = 1;
  }

  /* ---------------- math field ---------------- */
  var glyphs = [];
  function buildMath() {
    glyphs = [];
    var n = W < 700 ? 16 : 34;
    for (var i = 0; i < n; i++) glyphs.push(newGlyph(rnd(0, H)));
  }
  function newGlyph(y) {
    var z = rnd(.35, 1);
    return { text: FORMULAS[(Math.random() * FORMULAS.length) | 0], x: rnd(-60, W - 80), y: y, z: z, size: 10 + z * 10, v: .12 + z * .3 };
  }
  function drawMath() {
    ctx.clearRect(0, 0, W, H);
    glyphs.forEach(function (g, i) {
      g.y -= reduced ? 0 : g.v;
      if (g.y < -30) glyphs[i] = g = newGlyph(H + 30);
      var dm = Math.hypot(g.x + 60 - mouse.x, g.y - mouse.y);
      var hot = dm < 160 ? 1 - dm / 160 : 0;
      ctx.font = g.size + 'px ' + colors.mono;
      ctx.globalAlpha = ((colors.light ? .16 : .13) * (.5 + g.z) + hot * .5) * calm(g.x + 80);
      ctx.fillStyle = hot > .3 ? colors.hot : colors.node;
      ctx.fillText(g.text, g.x, g.y);
    });
    ctx.globalAlpha = 1;
  }

  /* ---------------- loop ---------------- */
  function frame(time) {
    if (mode === 'graph') drawGraph(time);
    else if (mode === 'math') drawMath();
    if (!reduced) raf = requestAnimationFrame(frame);
  }

  function set(m) {
    mode = m;
    cancelAnimationFrame(raf);
    readColors();
    if (m === 'off') { ctx.clearRect(0, 0, W, H); return; }
    if (m === 'graph') { buildGraph(); walk = null; nextWalkAt = 0; }
    if (m === 'math') buildMath();
    if (reduced) { frame(4000); return; }
    raf = requestAnimationFrame(frame);
  }

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { var oldW = W; resize(); if (Math.abs(oldW - W) > 40 || mode === 'math') set(mode); }, 150);
  });
  window.addEventListener('pointermove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  document.addEventListener('pointerleave', function () { mouse.x = mouse.y = -1e4; });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) cancelAnimationFrame(raf);
    else if (mode !== 'off' && !reduced) raf = requestAnimationFrame(frame);
  });

  resize();
  window.JKBackground = {
    set: set,
    refresh: function () { readColors(); if (reduced && mode !== 'off') frame(4000); }
  };
  set(root.getAttribute('data-bg') || 'graph');
}());
