/* Live thumbnails for the homepage "Work & writing" list.
   Each row has <canvas data-anim="name">. One shared requestAnimationFrame loop draws only the
   thumbnails that are on screen, at ~30 fps, in the current theme's colors. Hovering a row
   speeds its thumbnail up. With prefers-reduced-motion, each draws one still frame.
   Add a new animation by adding a key to ANIMS and setting `anim:` in _data/work_beyond.yml. */
(function () {
  'use strict';
  var canvases = [].slice.call(document.querySelectorAll('canvas[data-anim]'));
  if (!canvases.length) return;
  var root = document.documentElement;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 128, H = 80, TAU = Math.PI * 2;

  /* ---------- helpers ---------- */
  var C = {};
  function readColors() {
    var cs = getComputedStyle(root);
    C.acc = cs.getPropertyValue('--accent').trim();
    C.hot = cs.getPropertyValue('--accent-2').trim();
    C.text = cs.getPropertyValue('--text').trim();
    C.muted = cs.getPropertyValue('--muted').trim();
    C.border = cs.getPropertyValue('--border').trim();
    C.mono = cs.getPropertyValue('--font-mono').trim() || 'monospace';
  }
  function rng(seed) { var s = seed >>> 0 || 1; return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; }
  function dot(c, x, y, r, col, a) { c.globalAlpha = a == null ? 1 : a; c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.globalAlpha = 1; }
  function line(c, x1, y1, x2, y2, col, w, a) { c.globalAlpha = a == null ? 1 : a; c.strokeStyle = col; c.lineWidth = w || 1; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.globalAlpha = 1; }
  function box(c, x, y, w, h, col, fill, a) { c.globalAlpha = a == null ? 1 : a; if (fill) { c.fillStyle = col; c.fillRect(x, y, w, h); } else { c.strokeStyle = col; c.lineWidth = 1; c.strokeRect(x + .5, y + .5, w - 1, h - 1); } c.globalAlpha = 1; }
  function text(c, s, x, y, col, size, align, a) { c.globalAlpha = a == null ? 1 : a; c.fillStyle = col; c.font = (size || 9) + 'px ' + C.mono; c.textAlign = align || 'left'; c.textBaseline = 'middle'; c.fillText(s, x, y); c.globalAlpha = 1; }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }
  function points(n, seed, pad) {
    var r = rng(seed), p = [];
    for (var i = 0; i < n; i++) p.push({ x: pad + r() * (W - 2 * pad), y: pad + r() * (H - 2 * pad) });
    return p;
  }
  function knn(p, idx, k) {
    var out = [];
    idx.forEach(function (i) {
      out[i] = idx.filter(function (j) { return j !== i; })
        .sort(function (a, b) { return Math.hypot(p[a].x - p[i].x, p[a].y - p[i].y) - Math.hypot(p[b].x - p[i].x, p[b].y - p[i].y); })
        .slice(0, k);
    });
    // make the graph undirected
    idx.forEach(function (i) { out[i].forEach(function (j) { if (out[j].indexOf(i) < 0) out[j].push(i); }); });
    return out;
  }

  /* ---------- animations: each is { init?(s), draw(c, t, s) }, t in seconds ---------- */
  var ANIMS = {
    /* Assembly: a 4-instruction program moves values between memory and registers. */
    asm: {
      draw: function (c, t) {
        var prog = [['LOAD A,[1]', 'm1', 'A'], ['LOAD B,[2]', 'm2', 'B'], ['ADD A,B', 'B', 'A'], ['STORE [4],A', 'A', 'm4']];
        var step = Math.floor(t / 1.2) % 4, u = ease((t % 1.2) / .7);
        var mem = [9, 3, 4, 1, 0, 5], reg = { A: 0, B: 0 };
        for (var i = 0; i < step; i++) { if (i === 0) reg.A = 3; if (i === 1) reg.B = 4; if (i === 2) reg.A = 7; if (i === 3) mem[4] = 7; }
        var done = u >= 1;
        if (done) { if (step === 0) reg.A = 3; if (step === 1) reg.B = 4; if (step === 2) reg.A = 7; if (step === 3) mem[4] = 7; }
        var pos = { A: [30, 36], B: [84, 36] };
        for (var m = 0; m < 6; m++) pos['m' + m] = [14 + m * 20, 66];
        text(c, prog[step][0], 6, 10, C.text, 9);
        ['A', 'B'].forEach(function (r) {
          box(c, pos[r][0] - 15, pos[r][1] - 9, 30, 18, C.acc, false, .9);
          text(c, r, pos[r][0] - 22, pos[r][1], C.muted, 8, 'center');
          text(c, String(reg[r]), pos[r][0], pos[r][1] + .5, C.text, 10, 'center');
        });
        for (m = 0; m < 6; m++) {
          box(c, pos['m' + m][0] - 9, 58, 18, 16, C.muted, false, .55);
          text(c, String(mem[m]), pos['m' + m][0], 66.5, m === 4 && mem[4] ? C.hot : C.muted, 9, 'center');
        }
        if (!done) {
          var a = pos[prog[step][1]], b = pos[prog[step][2]];
          dot(c, lerp(a[0], b[0], u), lerp(a[1], b[1], u) - Math.sin(u * Math.PI) * 10, 3.2, C.hot);
        }
        text(c, 'CPU', W - 6, 10, C.muted, 8, 'right', .7);
      }
    },

    /* A rotating wireframe room with a desk and a lit window. */
    room3d: {
      draw: function (c, t) {
        var a = t * .6, ca = Math.cos(a), sa = Math.sin(a), tilt = .5;
        function P(x, y, z) {
          var X = x * ca - z * sa, Z = x * sa + z * ca;
          var Y = y * Math.cos(tilt) - Z * Math.sin(tilt);
          return [W / 2 + X * 26, H / 2 + 4 + Y * 26];
        }
        function edges(v, e, col, w, al) { e.forEach(function (p) { var A = P.apply(null, v[p[0]]), B = P.apply(null, v[p[1]]); line(c, A[0], A[1], B[0], B[1], col, w, al); }); }
        var cube = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
        var ce = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
        edges(cube, ce, C.muted, 1, .55);
        var desk = [[-.6, .2, -.9], [.4, .2, -.9], [.4, .2, -.35], [-.6, .2, -.35], [-.6, 1, -.9], [.4, 1, -.9], [.4, 1, -.35], [-.6, 1, -.35]];
        edges(desk, [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [1, 5], [2, 6], [3, 7]], C.acc, 1.4, .95);
        var win = [[.3, -.6, -1], [.8, -.6, -1], [.8, -.1, -1], [.3, -.1, -1]];
        var wp = win.map(function (v) { return P.apply(null, v); });
        c.globalAlpha = .45 + .25 * Math.sin(t * 1.3); c.fillStyle = C.hot; c.beginPath();
        wp.forEach(function (p, i) { i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }); c.closePath(); c.fill(); c.globalAlpha = 1;
        var m = P(-.1, .05, -.75); box(c, m[0] - 5, m[1] - 4, 10, 7, C.acc, true, .8);
      }
    },

    /* Weight-space editing: a weight matrix; an editor scans it and rewrites a few weights. */
    weights: {
      init: function (s) { var r = rng(7); s.w = []; for (var i = 0; i < 14 * 8; i++) s.w.push(r() * 2 - 1); s.r = r; s.last = -1; },
      draw: function (c, t, s) {
        var cols = 14, rows = 8, cw = 8, ch = 8, x0 = 8, y0 = 6;
        var k = Math.floor(t * 6) % (cols * rows);
        if (k !== s.last) { s.last = k; if (s.r() < .18) s.w[k] = -s.w[k]; }
        for (var i = 0; i < cols * rows; i++) {
          var x = x0 + (i % cols) * cw, y = y0 + Math.floor(i / cols) * ch, v = s.w[i];
          box(c, x, y, cw - 1, ch - 1, v > 0 ? C.acc : C.hot, true, .15 + .7 * Math.abs(v));
        }
        var cx = x0 + (k % cols) * cw, cy = y0 + Math.floor(k / cols) * ch;
        c.strokeStyle = C.text; c.lineWidth = 1.2; c.strokeRect(cx - 1, cy - 1, cw + 1, ch + 1);
        text(c, 'w' + (k % cols) + ',' + Math.floor(k / cols) + ' = ' + s.w[k].toFixed(2), 8, 75, C.muted, 8);
      }
    },

    /* A chip die with the model wired in; tokens stream out fast. */
    chip: {
      draw: function (c, t) {
        var x0 = 10, y0 = 12, sz = 56;
        box(c, x0, y0, sz, sz, C.acc, false);
        for (var i = 0; i < 6; i++) for (var j = 0; j < 6; j++) {
          var on = (Math.sin(i * 1.7 + j * 2.3 + t * 9) > .3);
          box(c, x0 + 5 + i * 8, y0 + 5 + j * 8, 6, 6, on ? C.acc : C.border, true, on ? .85 : .6);
        }
        for (i = 0; i < 7; i++) { line(c, x0 + 6 + i * 8, y0 - 4, x0 + 6 + i * 8, y0, C.muted, 1, .6); line(c, x0 + 6 + i * 8, y0 + sz, x0 + 6 + i * 8, y0 + sz + 4, C.muted, 1, .6); }
        for (i = 0; i < 14; i++) {
          var u = ((t * 2.2 + i / 14) % 1), x = x0 + sz + 4 + u * (W - x0 - sz - 8);
          var y = y0 + 8 + (i * 7) % (sz - 14);
          box(c, x, y, 6, 3, C.hot, true, 1 - u * .7);
        }
      }
    },

    /* HNSW: greedy search on the top layer, then drop down a layer and keep going. */
    hnsw: {
      init: function (s) {
        var p = points(36, 11, 8), all = [], i;
        for (i = 0; i < p.length; i++) all.push(i);
        s.p = p; s.layers = [all.slice(0, 5), all.slice(0, 14), all];
        s.g = s.layers.map(function (L) { return knn(p, L, 3); });
        s.q = 0;
      },
      draw: function (c, t, s) {
        var p = s.p, cyc = 6, k = Math.floor(t / cyc), lt = t % cyc;
        if (k !== s.q || !s.path) {
          s.q = k;
          var r = rng(101 + k * 7), q = { x: 10 + r() * (W - 20), y: 8 + r() * (H - 16) };
          var cur = 0, path = [];
          s.layers.forEach(function (L, li) {
            var improved = true; path.push([li, cur]);
            while (improved) {
              improved = false;
              var d0 = Math.hypot(p[cur].x - q.x, p[cur].y - q.y);
              s.g[li][cur].forEach(function (nb) { var d = Math.hypot(p[nb].x - q.x, p[nb].y - q.y); if (d < d0 - 1e-9) { d0 = d; cur = nb; improved = true; } });
              if (improved) path.push([li, cur]);
            }
          });
          s.qp = q; s.path = path;
        }
        // three stacked layers, each squashed into a band
        var bands = [[2, 22], [28, 50], [56, 78]];
        function Y(li, y) { return bands[li][0] + (y / H) * (bands[li][1] - bands[li][0]); }
        s.layers.forEach(function (L, li) {
          box(c, 2, bands[li][0] - 1, W - 4, bands[li][1] - bands[li][0] + 2, C.border, false, .7);
          L.forEach(function (i) { s.g[li][i].forEach(function (j) { if (j > i) line(c, p[i].x, Y(li, p[i].y), p[j].x, Y(li, p[j].y), C.muted, .6, .35); }); });
          L.forEach(function (i) { dot(c, p[i].x, Y(li, p[i].y), 1.6, C.muted, .9); });
          dot(c, s.qp.x, Y(li, s.qp.y), 2.4, C.hot, .9);
        });
        var shown = Math.min(s.path.length, Math.floor(lt / .38) + 1);
        for (var i = 1; i < shown; i++) {
          var a = s.path[i - 1], b = s.path[i];
          line(c, p[a[1]].x, Y(a[0], p[a[1]].y), p[b[1]].x, Y(b[0], p[b[1]].y), C.acc, 1.6, a[0] === b[0] ? 1 : .5);
        }
        var h = s.path[shown - 1];
        dot(c, p[h[1]].x, Y(h[0], p[h[1]].y), 3, C.acc);
      }
    },

    /* Monte Carlo: random darts in a unit square; the share inside the quarter circle estimates pi. */
    montecarlo: {
      init: function (s) { s.d = []; s.r = rng(3); s.n = 0; s.inside = 0; },
      draw: function (c, t, s, dt) {
        var x0 = 6, y0 = 6, sz = 68;
        var add = Math.max(1, Math.round(dt * 90));
        for (var i = 0; i < add; i++) {
          if (s.n >= 900) { s.d = []; s.n = 0; s.inside = 0; }
          var x = s.r(), y = s.r(), inn = x * x + y * y <= 1;
          s.d.push([x, y, inn]); s.n++; if (inn) s.inside++;
        }
        box(c, x0, y0, sz, sz, C.border, false);
        c.strokeStyle = C.acc; c.lineWidth = 1; c.beginPath(); c.arc(x0, y0 + sz, sz, -Math.PI / 2, 0); c.stroke();
        s.d.forEach(function (d) { box(c, x0 + d[0] * sz - .8, y0 + sz - d[1] * sz - .8, 1.6, 1.6, d[2] ? C.acc : C.hot, true, d[2] ? .9 : .7); });
        text(c, 'π ≈', 84, 30, C.muted, 9);
        text(c, (4 * s.inside / s.n).toFixed(3), 84, 44, C.text, 11);
        text(c, 'n=' + s.n, 84, 60, C.muted, 8);
      }
    },

    /* Text watermark: word tokens get scored as a detector scans; the score bar fills. */
    watermark: {
      init: function (s) { var r = rng(5); s.w = []; for (var i = 0; i < 24; i++) s.w.push({ len: 10 + Math.floor(r() * 16), g: r() < .7 }); },
      draw: function (c, t, s) {
        var cyc = 5, u = (t % cyc) / (cyc - 1), x = 6, y = 8, n = 0, hit = 0, idx = 0;
        s.w.forEach(function (w, i) {
          if (x + w.len > W - 6) { x = 6; y += 11; }
          var seen = i / s.w.length < u;
          if (seen) { n++; if (w.g) hit++; }
          box(c, x, y, w.len, 7, seen && w.g ? C.acc : C.muted, true, seen ? (w.g ? .85 : .35) : .22);
          x += w.len + 3; idx = i;
        });
        var score = n ? hit / n : 0;
        text(c, 'watermark score', 6, 69, C.muted, 8);
        box(c, 6, 74, W - 12, 3, C.border, true);
        box(c, 6, 74, (W - 12) * score * Math.min(1, u * 1.2), 3, C.acc, true);
      }
    },

    /* Bloom filter: each item hashes to 3 bits of a 16-bit array. */
    bloom: {
      init: function (s) { s.bits = []; for (var i = 0; i < 16; i++) s.bits.push(0); s.k = -1; },
      draw: function (c, t, s) {
        var per = 1.1, k = Math.floor(t / per), u = (t % per) / per;
        function hashes(n) { var h = (n * 2654435761) >>> 0; return [h % 16, (h >>> 5) % 16, (h >>> 11) % 16]; }
        if (k !== s.k) {
          if (s.k >= 0) hashes(s.k).forEach(function (b) { s.bits[b] = 1; });
          s.k = k;
          if (s.bits.reduce(function (a, b) { return a + b; }, 0) > 12) s.bits = s.bits.map(function () { return 0; });
        }
        var cw = 7.25, x0 = 6, by = 56, ix = W / 2, iy = 12, hs = hashes(k);
        dot(c, ix, iy, 4, C.hot);
        text(c, 'x' + (k % 100), ix + 8, iy, C.muted, 8);
        hs.forEach(function (b) {
          var bx = x0 + b * cw + cw / 2, v = ease(u * 1.6);
          line(c, ix, iy + 4, lerp(ix, bx, v), lerp(iy + 4, by - 2, v), C.acc, 1, .7);
        });
        for (var i = 0; i < 16; i++) {
          var lit = s.bits[i] || (u > .6 && hs.indexOf(i) >= 0);
          box(c, x0 + i * cw, by, cw - 1, 10, lit ? C.acc : C.border, true, lit ? .9 : .7);
        }
        text(c, 'm=16 bits · k=3', 6, 78, C.muted, 7.5);
      }
    },

    /* FFT: a signal (top) is the sum of three sines; its spectrum (bottom) shows the three peaks. */
    fft: {
      draw: function (c, t) {
        var comps = [[2, 1], [5, .5], [9, .3]];
        c.strokeStyle = C.acc; c.lineWidth = 1.4; c.beginPath();
        for (var x = 0; x <= W - 8; x += 2) {
          var u = x / (W - 8) * TAU, y = 0;
          comps.forEach(function (p) { y += p[1] * Math.sin(p[0] * u + t * p[0] * .6); });
          var Y = 24 - y * 11;
          x ? c.lineTo(x + 4, Y) : c.moveTo(x + 4, Y);
        }
        c.stroke();
        line(c, 4, 47, W - 4, 47, C.border, 1);
        for (var k = 0; k < 12; k++) {
          var a = 0; comps.forEach(function (p) { if (p[0] === k) a = p[1]; });
          var h = a * 26 * (.92 + .08 * Math.sin(t * 3 + k)) + 1;
          box(c, 8 + k * 10, 76 - h, 6, h, a ? C.hot : C.muted, true, a ? .95 : .35);
        }
      }
    },

    /* Triplets A[i] < B[j] < C[k]: for each B[j], count A below and C above. */
    triplets: {
      draw: function (c, t) {
        var A = [1, 3, 4, 7, 9], B = [2, 5, 6, 8, 10], Cc = [3, 4, 7, 9, 11];
        var j = Math.floor(t / 1.1) % B.length, rowY = [14, 40, 66], names = ['A', 'B', 'C'];
        [A, B, Cc].forEach(function (arr, r) {
          text(c, names[r], 8, rowY[r], C.muted, 9);
          arr.forEach(function (v, i) {
            var x = 18 + i * 18, good = r === 0 ? v < B[j] : r === 2 ? v > B[j] : i === j;
            box(c, x, rowY[r] - 8, 16, 16, good ? (r === 1 ? C.hot : C.acc) : C.border, r === 1 && i === j ? true : false, good ? 1 : .8);
            text(c, String(v), x + 8, rowY[r] + .5, r === 1 && i === j ? C.text : (good ? C.text : C.muted), 9, 'center');
          });
        });
        var a = A.filter(function (v) { return v < B[j]; }).length, cc = Cc.filter(function (v) { return v > B[j]; }).length;
        text(c, a + '×' + cc, 124, 40, C.hot, 9, 'right');
      }
    },

    /* C++ notes: code being typed, with a blinking cursor. */
    cpp: {
      draw: function (c, t) {
        var L = ['template<class T>', 'T&& fwd(T& x) {', '  return std::move(x);', '}', 'constexpr int N = 1<<20;', 'auto [k, v] = *it;'];
        var total = L.join('').length, cps = 14, cyc = total / cps + 2.5, n = Math.floor((t % cyc) * cps), y = 9, last = [6, 9];
        for (var i = 0; i < L.length && n > 0; i++) {
          var s = L[i].slice(0, n); n -= L[i].length;
          text(c, s, 6, y, i === 0 || i === 4 ? C.acc : C.text, 8.5);
          last = [6 + c.measureText(s).width, y]; y += 12;
        }
        if (Math.floor(t * 2) % 2 === 0) box(c, last[0] + 1, last[1] - 5, 5, 10, C.hot, true, .9);
      }
    },

    /* Segment tree: a range query lights the O(log n) nodes that exactly cover [l, r]. */
    segtree: {
      draw: function (c, t) {
        var n = 8, k = Math.floor(t / 1.6), r = rng(17 + k * 3), l = Math.floor(r() * 7), rr = l + 1 + Math.floor(r() * (7 - l));
        var cover = [];
        (function q(node, lo, hi) {
          if (rr < lo || hi < l) return;
          if (l <= lo && hi <= rr) { cover.push(node); return; }
          var mid = (lo + hi) >> 1; q(node * 2, lo, mid); q(node * 2 + 1, mid + 1, hi);
        }(1, 0, n - 1));
        function pos(node) { var d = Math.floor(Math.log2(node)), i = node - (1 << d), cnt = 1 << d; return [(i + .5) * (W - 8) / cnt + 4, 8 + d * 18]; }
        for (var nd = 2; nd < 16; nd++) { var a = pos(nd), b = pos(nd >> 1); line(c, a[0], a[1], b[0], b[1], C.muted, .8, .5); }
        for (nd = 1; nd < 16; nd++) {
          var p = pos(nd), on = cover.indexOf(nd) >= 0;
          dot(c, p[0], p[1], on ? 4 : 2.6, on ? C.acc : C.muted, on ? 1 : .8);
        }
        var lx = pos(8 + l)[0] - 6, rx = pos(8 + rr)[0] + 6;
        box(c, lx, 66, rx - lx, 3, C.hot, true);
        text(c, '[' + l + ', ' + rr + ']', W / 2, 75, C.muted, 8, 'center');
      }
    },

    /* DSU: random unions merge sets; every node points to its set's root. */
    dsu: {
      init: function (s) { s.k = -1; },
      draw: function (c, t, s) {
        var n = 10, per = .9, k = Math.floor(t / per) % 12;
        if (k !== s.k || !s.par) {
          s.k = k;
          if (k === 0 || !s.par) { s.par = []; for (var i = 0; i < n; i++) s.par.push(i); s.r = rng(23 + Math.floor(t / per / 12)); }
          else { var a = Math.floor(s.r() * n), b = Math.floor(s.r() * n); var fa = find(a), fb = find(b); if (fa !== fb) s.par[fb] = fa; s.lastU = [a, b]; }
        }
        function find(x) { while (s.par[x] !== x) x = s.par[x]; return x; }
        var P = []; for (var i2 = 0; i2 < n; i2++) { var ang = i2 / n * TAU - Math.PI / 2; P.push([W / 2 + Math.cos(ang) * 46, H / 2 + Math.sin(ang) * 30]); }
        var roots = {}, palette = [C.acc, C.hot, C.text, C.muted];
        for (i2 = 0; i2 < n; i2++) { var r0 = find(i2); if (!(r0 in roots)) roots[r0] = Object.keys(roots).length; }
        for (i2 = 0; i2 < n; i2++) if (s.par[i2] !== i2) line(c, P[i2][0], P[i2][1], P[s.par[i2]][0], P[s.par[i2]][1], C.acc, 1.2, .7);
        for (i2 = 0; i2 < n; i2++) {
          var big = 0; for (var j = 0; j < n; j++) if (find(j) === find(i2)) big++;
          dot(c, P[i2][0], P[i2][1], 3.4, big > 1 ? (find(i2) === i2 ? C.hot : C.acc) : C.muted);
        }
        text(c, Object.keys(roots).length + ' sets', W / 2, H / 2, C.muted, 8, 'center');
      }
    },

    /* String matching: slide a pattern over the text; matches light up. */
    strings: {
      draw: function (c, t) {
        var T = 'abracadabraabra', P = 'abra', cw = 7.8, x0 = 6;
        var cyc = T.length - P.length + 1, sh = Math.floor(t / .55) % (cyc + 2);
        var found = [];
        for (var i = 0; i <= T.length - P.length && i <= Math.min(sh, cyc - 1); i++) if (T.substr(i, P.length) === P) found.push(i);
        found.forEach(function (f) { box(c, x0 + f * cw - 1, 18, P.length * cw, 14, C.acc, true, .22); });
        for (i = 0; i < T.length; i++) text(c, T[i], x0 + i * cw + cw / 2 - 1, 25, C.text, 10, 'center');
        if (sh < cyc) {
          var ok = T.substr(sh, P.length) === P;
          for (var j = 0; j < P.length; j++) {
            var match = T[sh + j] === P[j];
            text(c, P[j], x0 + (sh + j) * cw + cw / 2 - 1, 46, match ? (ok ? C.acc : C.text) : C.hot, 10, 'center');
          }
          box(c, x0 + sh * cw - 1, 38, P.length * cw, 16, ok ? C.acc : C.border, false);
        }
        text(c, 'matches: ' + found.length, 6, 70, C.muted, 8);
      }
    },

    /* BFS: a wave spreads from a source, layer by layer, over a small graph. */
    graph: {
      init: function (s) {
        s.p = points(16, 41, 9); var all = []; for (var i = 0; i < 16; i++) all.push(i);
        s.g = knn(s.p, all, 2);
      },
      draw: function (c, t, s) {
        var cyc = 5, k = Math.floor(t / cyc), lt = t % cyc, src = (k * 5) % 16;
        var dist = [], par = [], q = [src]; dist[src] = 0;
        while (q.length) { var u = q.shift(); s.g[u].forEach(function (v) { if (dist[v] == null) { dist[v] = dist[u] + 1; par[v] = u; q.push(v); } }); }
        var front = lt / .55;
        s.p.forEach(function (a, i) { s.g[i].forEach(function (j) { if (j > i) line(c, a.x, a.y, s.p[j].x, s.p[j].y, C.muted, .7, .4); }); });
        s.p.forEach(function (a, i) {
          if (par[i] != null && dist[i] <= front) line(c, a.x, a.y, s.p[par[i]].x, s.p[par[i]].y, C.acc, 1.5, .9);
        });
        s.p.forEach(function (a, i) {
          var reached = dist[i] != null && dist[i] <= front;
          dot(c, a.x, a.y, i === src ? 4 : 3, i === src ? C.hot : reached ? C.acc : C.muted, reached || i === src ? 1 : .7);
        });
      }
    },

    /* Inverted index: a two-term query intersects the two posting lists. */
    elastic: {
      draw: function (c, t) {
        var terms = [['laptop', [1, 2, 4, 6, 7]], ['samsung', [0, 2, 3, 6]], ['ssd', [2, 5, 6, 8]]];
        var pairs = [[0, 1], [1, 2], [0, 2]], k = Math.floor(t / 2) % 3, pr = pairs[k], u = (t % 2) / 2;
        var both = terms[pr[0]][1].filter(function (d) { return terms[pr[1]][1].indexOf(d) >= 0; });
        terms.forEach(function (tm, r) {
          var y = 12 + r * 20, on = pr.indexOf(r) >= 0;
          text(c, tm[0], 4, y, on ? C.text : C.muted, 8.5);
          for (var d = 0; d < 9; d++) {
            var has = tm[1].indexOf(d) >= 0, hit = on && both.indexOf(d) >= 0 && u > .35;
            if (has) box(c, 48 + d * 8.4, y - 5, 7, 10, hit ? C.hot : on ? C.acc : C.muted, true, hit ? 1 : on ? .75 : .35);
          }
        });
        text(c, terms[pr[0]][0] + ' AND ' + terms[pr[1]][0], 4, 70, C.muted, 8);
        if (u > .35) text(c, '→ ' + both.length + ' docs', 124, 70, C.hot, 8, 'right');
      }
    },

    /* Multi-agent: an orchestrator hands tasks to workers and collects results. */
    agents: {
      draw: function (c, t) {
        var o = [W / 2, H / 2], ws = [[18, 16], [110, 16], [18, 64], [110, 64]];
        ws.forEach(function (w, i) {
          line(c, o[0], o[1], w[0], w[1], C.border, 1);
          var ph = (t * .7 + i * .25) % 1, out = ph < .5, u = ease(out ? ph * 2 : (ph - .5) * 2);
          var a = out ? o : w, b = out ? w : o;
          dot(c, lerp(a[0], b[0], u), lerp(a[1], b[1], u), 2.4, out ? C.acc : C.hot);
          box(c, w[0] - 8, w[1] - 6, 16, 12, C.muted, false);
          text(c, String.fromCharCode(65 + i), w[0], w[1] + .5, C.text, 8, 'center');
        });
        dot(c, o[0], o[1], 9, C.acc, .2);
        dot(c, o[0], o[1], 5, C.acc);
      }
    },

    /* Fourier epicycles: a chain of rotating circles (a DFT of a heart curve) draws the shape. */
    epicycles: {
      init: function (s) {
        var N = 64, pts = [], i, k;
        for (i = 0; i < N; i++) { var th = i / N * TAU; pts.push([16 * Math.pow(Math.sin(th), 3), -(13 * Math.cos(th) - 5 * Math.cos(2 * th) - 2 * Math.cos(3 * th) - Math.cos(4 * th))]); }
        s.co = [];
        for (k = 0; k < N; k++) {
          var re = 0, im = 0;
          for (i = 0; i < N; i++) { var ph = TAU * k * i / N; re += pts[i][0] * Math.cos(ph) + pts[i][1] * Math.sin(ph); im += pts[i][1] * Math.cos(ph) - pts[i][0] * Math.sin(ph); }
          s.co.push({ f: k <= N / 2 ? k : k - N, a: Math.hypot(re, im) / N * 1.7, p: Math.atan2(im, re) });
        }
        s.co.sort(function (a, b) { return b.a - a.a; }); s.co = s.co.slice(0, 12);
      },
      draw: function (c, t, s) {
        var T = 6, u = (t % T) / T, steps = Math.floor(u * 120);
        function tip(th, ring) {
          var x = W / 2, y = H / 2 - 4;
          s.co.forEach(function (q) {
            var px = x, py = y; x += q.a * Math.cos(q.f * th + q.p); y += q.a * Math.sin(q.f * th + q.p);
            if (ring) { c.globalAlpha = .3; c.strokeStyle = C.acc; c.lineWidth = .6; c.beginPath(); c.arc(px, py, q.a, 0, TAU); c.stroke(); line(c, px, py, x, y, C.acc, .9, .7); }
          });
          return [x, y];
        }
        c.strokeStyle = C.hot; c.lineWidth = 1.6; c.beginPath();
        for (var i = 0; i <= steps; i++) { var p = tip(i / 120 * TAU); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }
        c.stroke();
        tip(u * TAU, true);
      }
    },

    /* Pixelate: the same little scene, re-sampled at a block size that grows and shrinks. */
    pixelate: {
      draw: function (c, t) {
        function scene(x, y) {
          if (Math.hypot(x - 92, y - 24) < 13) return [C.hot, 1];
          var hill = 52 + 10 * Math.sin(x / 18) + 4 * Math.sin(x / 7);
          if (y > hill) return [C.acc, .55 + .3 * Math.sin(x / 11)];
          return [C.muted, .12 + y / H * .2];
        }
        var sizes = [2, 4, 8, 16, 8, 4], bs = sizes[Math.floor(t / .8) % sizes.length];
        for (var y = 0; y < H; y += bs) for (var x = 0; x < W; x += bs) {
          var s = scene(x + bs / 2, y + bs / 2);
          box(c, x, y, bs, bs, s[0], true, s[1]);
        }
        text(c, bs + 'px', W - 6, H - 8, C.text, 8, 'right');
      }
    },

    /* Bouncing dots with short trails. */
    dots: {
      init: function (s) { var r = rng(9); s.b = []; for (var i = 0; i < 9; i++) s.b.push({ x: r() * W, y: r() * H, vx: (r() - .5) * 60, vy: (r() - .5) * 60, tr: [] }); },
      draw: function (c, t, s, dt) {
        s.b.forEach(function (b, i) {
          b.x += b.vx * dt; b.y += b.vy * dt;
          if (b.x < 3 || b.x > W - 3) { b.vx = -b.vx; b.x = Math.max(3, Math.min(W - 3, b.x)); }
          if (b.y < 3 || b.y > H - 3) { b.vy = -b.vy; b.y = Math.max(3, Math.min(H - 3, b.y)); }
          b.tr.push([b.x, b.y]); if (b.tr.length > 14) b.tr.shift();
          b.tr.forEach(function (p, k) { dot(c, p[0], p[1], 1.2, i % 3 ? C.acc : C.hot, k / b.tr.length * .4); });
          dot(c, b.x, b.y, 2.8, i % 3 ? C.acc : C.hot);
        });
      }
    }
  };
  var FALLBACK = { search: 'elastic', algorithms: 'graph', math: 'fft', experiments: 'dots', notes: 'cpp' };

  /* ---------- engine ---------- */
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  readColors();
  var items = canvases.map(function (cv) {
    var name = cv.getAttribute('data-anim');
    var anim = ANIMS[name] || ANIMS[FALLBACK[cv.getAttribute('data-kind')]] || ANIMS.dots;
    cv.width = W * dpr; cv.height = H * dpr;
    var ctx = cv.getContext('2d'), state = {};
    if (anim.init) anim.init(state);
    var row = cv.closest('.row') || cv;
    var it = { cv: cv, ctx: ctx, anim: anim, s: state, t: 0, visible: false, speed: 1 };
    row.addEventListener('pointerenter', function () { it.speed = 2.2; });
    row.addEventListener('pointerleave', function () { it.speed = 1; });
    row.addEventListener('focusin', function () { it.speed = 2.2; });
    row.addEventListener('focusout', function () { it.speed = 1; });
    return it;
  });
  function paint(it, dt) {
    var c = it.ctx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);
    it.anim.draw(c, it.t, it.s, dt);
  }
  // keep colors in sync with the theme / light-dark toggle
  new MutationObserver(function () { readColors(); if (reduced || !running) items.forEach(function (it) { paint(it, 0); }); })
    .observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-mode'] });

  if (reduced) {
    // one representative still frame each
    items.forEach(function (it) { it.t = 2.6; paint(it, 1 / 30); });
    return;
  }

  var running = false, last = 0, acc = 0;
  function frame(now) {
    if (!running) return;
    var dt = Math.min(.1, (now - (last || now)) / 1000); last = now; acc += dt;
    if (acc >= 1 / 30) {
      var step = acc; acc = 0;
      items.forEach(function (it) {
        if (!it.visible) return;
        var d = step * it.speed; it.t += d; paint(it, d);
      });
    }
    requestAnimationFrame(frame);
  }
  function update() {
    var any = !document.hidden && items.some(function (it) { return it.visible; });
    if (any && !running) { running = true; last = 0; requestAnimationFrame(frame); }
    else if (!any) running = false;
  }
  items.forEach(function (it) { it.t = 0.4; paint(it, 0); });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { items.forEach(function (it) { if (it.cv === e.target) it.visible = e.isIntersecting; }); });
      update();
    }, { rootMargin: '60px 0px' });
    items.forEach(function (it) { io.observe(it.cv); });
  } else { items.forEach(function (it) { it.visible = true; }); update(); }
  document.addEventListener('visibilitychange', update);
  // filtered-out rows have display:none and report not-intersecting, so they stop drawing on their own
}());
