/* Monte Carlo simulation widgets.
   Mount points: <div class="mc" data-mc="pi|spread|birthday|project"></div>
   Used by /blog_posts/monte-carlo-simulation-explained.html and ./index.html. */
(function () {
  'use strict';

  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var FONT = '12px Inter, system-ui, sans-serif';

  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  function pct(p, d) { return (100 * p).toFixed(d == null ? 1 : d) + '%'; }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function tok(node, name) { return getComputedStyle(node).getPropertyValue(name).trim(); }
  function colors(node) {
    return {
      a: tok(node, '--mc-a'), b: tok(node, '--mc-b'), band: tok(node, '--mc-band'),
      text: tok(node, '--text'), muted: tok(node, '--muted'), border: tok(node, '--border'),
      s2: tok(node, '--surface-2'), surface: tok(node, '--surface')
    };
  }

  // A canvas that matches its container's width; draw() is called with (ctx, w, h).
  function makeCanvas(parent, aspect, minH, maxH, label) {
    var wrap = el('div', 'mc-chart');
    var c = el('canvas');
    c.setAttribute('role', 'img');
    c.setAttribute('aria-label', label);
    var tip = el('div', 'mc-tip');
    wrap.appendChild(c); wrap.appendChild(tip); parent.appendChild(wrap);
    var obj = { canvas: c, tip: tip, w: 0, h: 0, draw: null };
    obj.resize = function () {
      var w = wrap.clientWidth || 300;
      var h = Math.max(minH, Math.min(maxH, Math.round(w * aspect)));
      obj.w = w; obj.h = h;
      c.width = Math.round(w * DPR); c.height = Math.round(h * DPR);
      c.style.height = h + 'px';
      obj.render();
    };
    obj.render = function () {
      if (!obj.draw || !obj.w) return;
      var ctx = c.getContext('2d');
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, obj.w, obj.h);
      ctx.font = FONT;
      obj.draw(ctx, obj.w, obj.h);
    };
    obj.showTip = function (x, y, html) {
      tip.innerHTML = html;
      tip.classList.add('on');
      var tw = tip.offsetWidth, th = tip.offsetHeight;
      var left = Math.min(Math.max(0, x + 12), obj.w - tw);
      var top = y - th - 10 < 0 ? y + 14 : y - th - 10;
      tip.style.left = left + 'px'; tip.style.top = top + 'px';
    };
    obj.hideTip = function () { tip.classList.remove('on'); };
    obj.onHover = function (fn) {
      function move(ev) {
        var r = c.getBoundingClientRect();
        var p = ev.touches ? ev.touches[0] : ev;
        fn(p.clientX - r.left, p.clientY - r.top);
      }
      c.addEventListener('mousemove', move);
      c.addEventListener('touchstart', move, { passive: true });
      c.addEventListener('mouseleave', obj.hideTip);
    };
    return obj;
  }

  function roundTop(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h);
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();
  }

  function button(parent, text, cls) {
    var b = el('button', cls || '', text);
    b.type = 'button';
    parent.appendChild(b);
    return b;
  }
  function stat(parent, label) {
    var s = el('div', 'mc-stat', '<b>–</b><span>' + label + '</span>');
    parent.appendChild(s);
    return s.querySelector('b');
  }
  function header(root, title, sub) {
    root.appendChild(el('p', 'mc-title', title));
    if (sub) root.appendChild(el('p', 'mc-sub', sub));
  }

  // ---------------------------------------------------------------- 1. pi
  function piWidget(root) {
    header(root, 'Estimate π by throwing random darts',
      'Each dart lands at a random point in the square. The share that lands inside the quarter circle, times 4, estimates π.');
    var row = el('div', 'mc-row'); root.appendChild(row);
    var left = el('div', 'mc-col'), right = el('div', 'mc-col');
    row.appendChild(left); row.appendChild(right);
    var board = makeCanvas(left, 1, 220, 380, 'Square board with a quarter circle and the darts thrown so far');
    left.appendChild(el('div', 'mc-legend',
      '<span class="mc-key"><i class="a"></i>inside the circle</span><span class="mc-key"><i class="b"></i>outside</span>'));
    var chart = makeCanvas(right, 0.72, 220, 300, 'Line chart of the π estimate as more darts are thrown, approaching 3.14159');
    right.appendChild(el('div', 'mc-legend',
      '<span class="mc-key"><i class="a"></i>your estimate</span><span class="mc-key"><i class="line"></i>true π</span>' +
      '<span class="mc-key"><i class="band"></i>typical error (±1.64/√N)</span>'));

    var stats = el('div', 'mc-stats'); root.appendChild(stats);
    var sN = stat(stats, 'darts thrown'), sIn = stat(stats, 'inside'), sEst = stat(stats, 'π estimate'), sErr = stat(stats, 'error vs 3.14159');
    var ctr = el('div', 'mc-controls'); root.appendChild(ctr);
    var b1 = button(ctr, 'Throw 1'), b100 = button(ctr, 'Throw 100'), b1k = button(ctr, 'Throw 1,000');
    var bAuto = button(ctr, '▶ Run to 1 million', 'mc-primary'), bReset = button(ctr, 'Reset');

    var MAXDOTS = 20000, MAXN = 1000000;
    var xs = new Float32Array(MAXDOTS), ys = new Float32Array(MAXDOTS), stored = 0;
    var n = 0, inside = 0, hist = [], nextRec = 1, running = false;

    function record(force) {
      if (n >= nextRec || force) {
        hist.push([n, 4 * inside / n]);
        nextRec = Math.max(n + 1, Math.ceil(n * 1.06));
      }
    }
    function throwK(k) {
      k = Math.min(k, MAXN - n);
      for (var i = 0; i < k; i++) {
        var x = Math.random(), y = Math.random();
        if (x * x + y * y <= 1) inside++;
        if (stored < MAXDOTS) { xs[stored] = x; ys[stored] = y; stored++; }
        n++;
        if (n < 200) record();
      }
      record(true);
      update();
    }
    function update() {
      sN.textContent = fmt(n);
      sIn.textContent = fmt(inside);
      if (n) {
        var est = 4 * inside / n;
        sEst.textContent = est.toFixed(4);
        sErr.textContent = Math.abs(est - Math.PI).toFixed(4);
      } else { sEst.textContent = sErr.textContent = '–'; }
      board.render(); chart.render();
    }

    board.draw = function (ctx, w, h) {
      var C = colors(root), s = Math.min(w, h), ox = (w - s) / 2;
      ctx.fillStyle = C.s2; ctx.fillRect(ox, 0, s, s);
      ctx.strokeStyle = C.text; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(ox, s, s, -Math.PI / 2, 0); ctx.stroke();
      for (var i = 0; i < stored; i++) {
        var r = i < 300 ? 3.2 : i < 3000 ? 2 : 1.2;
        ctx.fillStyle = xs[i] * xs[i] + ys[i] * ys[i] <= 1 ? C.a : C.b;
        ctx.beginPath(); ctx.arc(ox + xs[i] * s, s - ys[i] * s, r, 0, 6.2832); ctx.fill();
      }
      if (n > stored) {
        var msg = 'showing the first ' + fmt(MAXDOTS) + ' darts', tw = ctx.measureText(msg).width;
        ctx.fillStyle = C.surface; ctx.fillRect(ox + s - tw - 16, 6, tw + 12, 20);
        ctx.fillStyle = C.text; ctx.fillText(msg, ox + s - tw - 10, 20);
      }
    };

    var P = { l: 40, r: 10, t: 10, b: 26 };
    function cx(v, w) { return P.l + (Math.log10(Math.max(v, 1)) / 6) * (w - P.l - P.r); }
    function cy(v, h) { v = Math.max(2, Math.min(4, v)); return P.t + (4 - v) / 2 * (h - P.t - P.b); }
    chart.draw = function (ctx, w, h) {
      var C = colors(root), i, x;
      // band
      ctx.fillStyle = C.band; ctx.beginPath();
      for (i = 0; i <= 60; i++) { x = Math.pow(10, i / 10); ctx.lineTo(cx(x, w), cy(Math.PI + 1.642 / Math.sqrt(x), h)); }
      for (i = 60; i >= 0; i--) { x = Math.pow(10, i / 10); ctx.lineTo(cx(x, w), cy(Math.PI - 1.642 / Math.sqrt(x), h)); }
      ctx.fill();
      // grid and axes
      ctx.fillStyle = C.muted; ctx.strokeStyle = C.border; ctx.lineWidth = 1;
      [2, 2.5, 3, 3.5, 4].forEach(function (v) {
        var y = cy(v, h);
        ctx.beginPath(); ctx.moveTo(P.l, y); ctx.lineTo(w - P.r, y); ctx.stroke();
        ctx.textAlign = 'right'; ctx.fillText(v.toFixed(1), P.l - 6, y + 4);
      });
      ['1', '10', '100', '1k', '10k', '100k', '1M'].forEach(function (t, k) {
        ctx.textAlign = k === 0 ? 'left' : k === 6 ? 'right' : 'center';
        ctx.fillText(t, cx(Math.pow(10, k), w), h - 8);
      });
      ctx.textAlign = 'left';
      // true pi
      ctx.strokeStyle = C.text; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(P.l, cy(Math.PI, h)); ctx.lineTo(w - P.r, cy(Math.PI, h)); ctx.stroke();
      ctx.setLineDash([]);
      // estimate
      if (hist.length) {
        ctx.strokeStyle = C.a; ctx.lineWidth = 2; ctx.lineJoin = 'round';
        ctx.beginPath();
        hist.forEach(function (p, k) { var X = cx(p[0], w), Y = cy(p[1], h); if (k) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
        ctx.stroke();
        var last = hist[hist.length - 1];
        ctx.fillStyle = C.a; ctx.strokeStyle = C.surface; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx(last[0], w), cy(last[1], h), 4.5, 0, 6.2832); ctx.fill(); ctx.stroke();
      } else {
        ctx.fillStyle = C.muted; ctx.textAlign = 'center';
        ctx.fillText('Throw some darts to start', (w + P.l) / 2, cy(3.6, h)); ctx.textAlign = 'left';
      }
      ctx.fillStyle = C.muted; ctx.fillText('darts thrown (log scale) →', P.l + 4, cy(2.08, h));
    };
    chart.onHover(function (x, y) {
      if (!hist.length) return;
      var best = null, bd = 1e9;
      hist.forEach(function (p) { var d = Math.abs(cx(p[0], chart.w) - x); if (d < bd) { bd = d; best = p; } });
      if (bd > 30) return chart.hideTip();
      chart.showTip(cx(best[0], chart.w), cy(best[1], chart.h),
        fmt(best[0]) + ' darts<br>π ≈ ' + best[1].toFixed(4) + ' (error ' + Math.abs(best[1] - Math.PI).toFixed(4) + ')');
    });

    function stop() { running = false; bAuto.textContent = n >= MAXN ? 'Done: 1 million darts' : '▶ Run to 1 million'; }
    function tick() {
      if (!running) return;
      throwK(Math.max(5, Math.floor(n * 0.035)));
      if (n >= MAXN) return stop();
      requestAnimationFrame(tick);
    }
    b1.onclick = function () { throwK(1); };
    b100.onclick = function () { throwK(100); };
    b1k.onclick = function () { throwK(1000); };
    bAuto.onclick = function () {
      if (running) return stop();
      if (n >= MAXN) return;
      running = true; bAuto.textContent = '❚❚ Pause'; tick();
    };
    bReset.onclick = function () {
      running = false; n = inside = stored = 0; hist = []; nextRec = 1; stop(); update();
    };
    return [board, chart];
  }

  // ---------------------------------------------------------------- 2. spread
  function spreadWidget(root) {
    header(root, 'Why more darts give a better answer (slowly)',
      'Repeat the whole π experiment 500 times at three sizes and look at where the 500 estimates land.');
    var chart = makeCanvas(root, 0.5, 260, 340, 'Three histograms of 500 π estimates each, using 100, 1,000 and 10,000 darts');
    root.appendChild(el('div', 'mc-legend',
      '<span class="mc-key"><i class="a"></i>500 estimates of π</span><span class="mc-key"><i class="line"></i>true π</span>'));
    var ctr = el('div', 'mc-controls'); root.appendChild(ctr);
    var bRun = button(ctr, '▶ Run 3 × 500 experiments', 'mc-primary');
    var note = el('p', 'mc-note'); root.appendChild(note);

    var SIZES = [100, 1000, 10000], LO = 2.7, HI = 3.6, BIN = 0.02, NB = Math.round((HI - LO) / BIN);
    var rows = SIZES.map(function (s) { return { n: s, bins: null, sd: 0, mean: 0 }; });

    function runRow(r) {
      var bins = new Array(NB).fill(0), sum = 0, sq = 0;
      for (var e = 0; e < 500; e++) {
        var inside = 0;
        for (var i = 0; i < r.n; i++) { var x = Math.random(), y = Math.random(); if (x * x + y * y <= 1) inside++; }
        var est = 4 * inside / r.n;
        sum += est; sq += est * est;
        bins[Math.max(0, Math.min(NB - 1, Math.floor((est - LO) / BIN)))]++;
      }
      r.mean = sum / 500; r.sd = Math.sqrt(sq / 500 - r.mean * r.mean); r.bins = bins;
    }

    var P = { l: 92, r: 12, t: 6, b: 24 };
    function bx(v, w) { return P.l + (v - LO) / (HI - LO) * (w - P.l - P.r); }
    chart.draw = function (ctx, w, h) {
      var C = colors(root), rh = (h - P.t - P.b) / 3;
      rows.forEach(function (r, k) {
        var y0 = P.t + k * rh, base = y0 + rh - 6;
        ctx.strokeStyle = C.border; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(P.l, base + 0.5); ctx.lineTo(w - P.r, base + 0.5); ctx.stroke();
        ctx.fillStyle = C.text; ctx.textAlign = 'left';
        ctx.fillText(fmt(r.n) + ' darts', 4, y0 + rh / 2);
        ctx.fillStyle = C.muted;
        ctx.fillText(r.bins ? 'spread ±' + r.sd.toFixed(3) : 'not run yet', 4, y0 + rh / 2 + 15);
        if (!r.bins) return;
        var max = Math.max.apply(null, r.bins), bw = (w - P.l - P.r) / NB;
        ctx.fillStyle = C.a;
        r.bins.forEach(function (c, i) {
          if (!c) return;
          var bh = c / max * (rh - 14);
          roundTop(ctx, P.l + i * bw + 1, base - bh, Math.max(1, bw - 2), bh, 3);
        });
      });
      ctx.strokeStyle = C.text; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(bx(Math.PI, w), P.t); ctx.lineTo(bx(Math.PI, w), h - P.b); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = C.muted;
      [2.8, 3.0, 3.2, 3.4, 3.6].forEach(function (v, k) {
        ctx.textAlign = k === 4 ? 'right' : 'center';
        ctx.fillText(v.toFixed(1), bx(v, w), h - 6);
      });
      ctx.textAlign = 'left';
    };
    chart.onHover(function (x, y) {
      var rh = (chart.h - P.t - P.b) / 3, k = Math.floor((y - P.t) / rh), r = rows[k];
      if (!r || !r.bins || x < P.l || x > chart.w - P.r) return chart.hideTip();
      var i = Math.floor((x - P.l) / ((chart.w - P.l - P.r) / NB));
      if (i < 0 || i >= NB) return chart.hideTip();
      var lo = LO + i * BIN;
      chart.showTip(x, y, fmt(r.n) + ' darts<br>' + r.bins[i] + ' of 500 estimates in ' + lo.toFixed(2) + '–' + (lo + BIN).toFixed(2));
    });

    bRun.onclick = function () {
      bRun.disabled = true;
      rows.forEach(function (r) { r.bins = null; });
      chart.render(); note.textContent = '';
      var k = 0;
      (function next() {
        if (k >= rows.length) {
          bRun.disabled = false; bRun.textContent = '↻ Run again';
          note.innerHTML = '100× more darts made the spread about <strong>' + (rows[0].sd / rows[2].sd).toFixed(1) +
            '× narrower</strong> (theory says 10×: the error falls like 1/√N).';
          return;
        }
        runRow(rows[k++]); chart.render(); setTimeout(next, 250);
      })();
    };
    return [chart];
  }

  // ---------------------------------------------------------------- 3. birthday
  function birthdayWidget(root) {
    header(root, 'The birthday problem: fill a room with random birthdays',
      'Pick a group size, then fill rooms with people whose birthdays are random days of the year.');
    var field = el('div', 'mc-field',
      '<label for="mc-bday-n">People</label><input id="mc-bday-n" type="range" min="2" max="70" value="23"><output>23</output>');
    root.appendChild(field);
    var slider = field.querySelector('input'), out = field.querySelector('output');
    var grid = makeCanvas(root, 0.27, 120, 200, 'Calendar grid of 365 days with each person placed on their birthday');
    root.appendChild(el('div', 'mc-legend',
      '<span class="mc-key"><i class="a"></i>one person</span><span class="mc-key"><i class="b"></i>shared birthday</span>'));
    var note = el('p', 'mc-note'); root.appendChild(note);
    var ctr = el('div', 'mc-controls'); root.appendChild(ctr);
    var bOne = button(ctr, 'Fill one room'), bMany = button(ctr, '▶ Run 10,000 rooms', 'mc-primary'), bSweep = button(ctr, 'Run every size 2–70');
    var curve = makeCanvas(root, 0.45, 220, 300, 'Chart of the chance of a shared birthday against group size: exact curve and simulated points');
    root.appendChild(el('div', 'mc-legend',
      '<span class="mc-key"><i class="line"></i>exact formula</span><span class="mc-key"><i class="a"></i>simulated</span><span>across: people in the room</span>'));

    var exact = [0, 0];
    (function () { var q = 1; for (var k = 1; k <= 70; k++) { q *= (365 - (k - 1)) / 365; exact[k] = 1 - q; } })();
    var counts = new Array(365).fill(0), sim = {}, people = 23;

    function room(k, into) {
      var seen = into || new Uint8Array(365), hit = false;
      for (var i = 0; i < k; i++) { var d = Math.floor(Math.random() * 365); if (seen[d]) hit = true; seen[d]++; }
      return hit;
    }
    function dayName(d) { return new Date(2025, 0, d + 1).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }); }
    function fillOne() {
      counts.fill(0);
      room(people, counts);
      var shared = [];
      counts.forEach(function (c, d) { if (c > 1) shared.push(c + ' on ' + dayName(d)); });
      note.innerHTML = shared.length
        ? '<strong>Match!</strong> ' + shared.join(', ') + '.'
        : '<strong>No shared birthday</strong> in this room of ' + people + '. Try again.';
      grid.render();
    }
    function runMany(k, rooms) {
      var hits = 0;
      for (var r = 0; r < rooms; r++) if (room(k)) hits++;
      sim[k] = hits / rooms;
      return sim[k];
    }

    var COLS = 37;
    grid.draw = function (ctx, w, h) {
      var C = colors(root), cw = w / COLS, ch = h / 10, r = Math.min(cw, ch);
      for (var d = 0; d < 365; d++) {
        var x = (d % COLS) * cw, y = Math.floor(d / COLS) * ch, c = counts[d];
        ctx.fillStyle = c > 1 ? C.b : c ? C.a : C.s2;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x + 1, y + 1, cw - 2, ch - 2, Math.min(3, r / 4)); else ctx.rect(x + 1, y + 1, cw - 2, ch - 2);
        ctx.fill();
        if (c > 1 && r >= 13) { ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(c, x + cw / 2, y + ch / 2 + 4); ctx.textAlign = 'left'; }
      }
    };
    grid.onHover(function (x, y) {
      var cw = grid.w / COLS, ch = grid.h / 10, d = Math.floor(y / ch) * COLS + Math.floor(x / cw);
      if (d < 0 || d >= 365) return grid.hideTip();
      grid.showTip(x, y, dayName(d) + ': ' + (counts[d] === 1 ? '1 person' : counts[d] + ' people'));
    });

    var P = { l: 40, r: 12, t: 10, b: 26 };
    function px(k, w) { return P.l + (k - 2) / 68 * (w - P.l - P.r); }
    function py(p, h) { return P.t + (1 - p) * (h - P.t - P.b); }
    curve.draw = function (ctx, w, h) {
      var C = colors(root), k;
      ctx.fillStyle = C.muted; ctx.strokeStyle = C.border; ctx.lineWidth = 1;
      [0, 0.25, 0.5, 0.75, 1].forEach(function (p) {
        var y = py(p, h); ctx.beginPath(); ctx.moveTo(P.l, y); ctx.lineTo(w - P.r, y); ctx.stroke();
        ctx.textAlign = 'right'; ctx.fillText(Math.round(p * 100) + '%', P.l - 6, y + 4);
      });
      [2, 10, 20, 30, 40, 50, 60, 70].forEach(function (v, i) {
        ctx.textAlign = i === 0 ? 'left' : i === 7 ? 'right' : 'center'; ctx.fillText(v, px(v, w), h - 8);
      });
      ctx.textAlign = 'left';
      // current size marker
      ctx.strokeStyle = C.muted; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(px(people, w), P.t); ctx.lineTo(px(people, w), h - P.b); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = C.text; ctx.lineWidth = 2; ctx.beginPath();
      for (k = 2; k <= 70; k++) { if (k === 2) ctx.moveTo(px(k, w), py(exact[k], h)); else ctx.lineTo(px(k, w), py(exact[k], h)); }
      ctx.stroke();
      ctx.fillStyle = C.a; ctx.strokeStyle = C.surface; ctx.lineWidth = 2;
      Object.keys(sim).forEach(function (key) {
        ctx.beginPath(); ctx.arc(px(+key, w), py(sim[key], h), 4.5, 0, 6.2832); ctx.fill(); ctx.stroke();
      });
      ctx.fillStyle = C.muted; ctx.fillText('chance of a shared birthday', P.l + 6, py(0.96, h) + 4);
    };
    curve.onHover(function (x) {
      var k = Math.round(2 + (x - P.l) / (curve.w - P.l - P.r) * 68);
      if (k < 2 || k > 70) return curve.hideTip();
      curve.showTip(px(k, curve.w), py(exact[k], curve.h), k + ' people<br>exact ' + pct(exact[k]) +
        (sim[k] != null ? '<br>simulated ' + pct(sim[k]) : ''));
    });

    slider.oninput = function () { people = +slider.value; out.textContent = people; fillOne(); curve.render(); };
    bOne.onclick = fillOne;
    bMany.onclick = function () {
      var p = runMany(people, 10000);
      note.innerHTML = '10,000 rooms of ' + people + ': a shared birthday in <strong>' + pct(p) +
        '</strong> of them. The exact answer is ' + pct(exact[people]) + '.';
      curve.render();
    };
    bSweep.onclick = function () {
      bSweep.disabled = true;
      var k = 2;
      (function next() {
        for (var j = 0; j < 4 && k <= 70; j++, k++) runMany(k, 2000);
        curve.render();
        if (k <= 70) requestAnimationFrame(next);
        else { bSweep.disabled = false; note.innerHTML = 'Every size, 2,000 rooms each: the dots hug the exact curve. From 57 people on, a match is over 99% likely.'; }
      })();
    };
    fillOne();
    return [grid, curve];
  }

  // ---------------------------------------------------------------- 4. project
  function projectWidget(root) {
    header(root, 'Will the project finish on time?',
      'Three tasks run one after another. Each takes a random time between its shortest and longest estimate. Change anything and 20,000 projects are re-simulated.');
    var tasks = [['Design', 5, 10], ['Build', 8, 15], ['Test', 4, 9]];
    var tbl = el('div', 'mc-tasks', '<span></span><span class="h">shortest (days)</span><span class="h">longest (days)</span>');
    var inputs = tasks.map(function (t, i) {
      tbl.appendChild(el('span', '', t[0]));
      var a = el('input'), b = el('input');
      [a, b].forEach(function (inp, j) {
        inp.type = 'number'; inp.min = 0; inp.max = 60; inp.step = 0.5; inp.value = t[1 + j];
        inp.setAttribute('aria-label', t[0] + (j ? ' longest' : ' shortest') + ' days');
        tbl.appendChild(inp);
      });
      return [a, b];
    });
    root.appendChild(tbl);
    var field = el('div', 'mc-field',
      '<label for="mc-deadline">Deadline</label><input id="mc-deadline" type="range" min="10" max="60" step="0.5" value="28"><output>28 days</output>');
    root.appendChild(field);
    var dl = field.querySelector('input'), dlOut = field.querySelector('output');
    var stats = el('div', 'mc-stats'); root.appendChild(stats);
    var sOn = stat(stats, 'chance of finishing on time'), sAvg = stat(stats, 'average length'), sP90 = stat(stats, '90% finish within');
    var chart = makeCanvas(root, 0.45, 220, 300, 'Histogram of total project length over 20,000 simulated projects, split at the deadline');
    root.appendChild(el('div', 'mc-legend',
      '<span class="mc-key"><i class="a"></i>on time</span><span class="mc-key"><i class="b"></i>late</span><span class="mc-key"><i class="line"></i>deadline</span>'));
    var ctr = el('div', 'mc-controls'); root.appendChild(ctr);
    var bRun = button(ctr, '↻ Simulate 20,000 more projects', 'mc-primary');

    var RUNS = 20000, totals = new Float64Array(RUNS), lo = 0, hi = 1, bins = [], BW = 0.5;
    function ranges() {
      return inputs.map(function (p) {
        var a = Math.max(0, +p[0].value || 0), b = Math.max(0, +p[1].value || 0);
        return a <= b ? [a, b] : [b, a];
      });
    }
    function simulate() {
      var R = ranges();
      lo = 0; hi = 0;
      R.forEach(function (r) { lo += r[0]; hi += r[1]; });
      for (var i = 0; i < RUNS; i++) {
        var t = 0;
        for (var j = 0; j < 3; j++) t += R[j][0] + Math.random() * (R[j][1] - R[j][0]);
        totals[i] = t;
      }
      totals.sort();
      BW = Math.max(0.25, Math.ceil((hi - lo) / 40 * 4) / 4);
      var start = Math.floor(lo / BW) * BW, nb = Math.max(1, Math.ceil((hi - start) / BW + 1e-9));
      bins = []; for (var k = 0; k < nb; k++) bins.push({ x0: start + k * BW, c: 0 });
      for (i = 0; i < RUNS; i++) bins[Math.min(nb - 1, Math.floor((totals[i] - start) / BW))].c++;
      update();
    }
    function update() {
      var d = +dl.value, on = 0, sum = 0;
      dlOut.textContent = d + ' days';
      for (var i = 0; i < RUNS; i++) { sum += totals[i]; if (totals[i] <= d) on++; }
      sOn.textContent = pct(on / RUNS);
      sAvg.textContent = (sum / RUNS).toFixed(1) + ' days';
      sP90.textContent = totals[Math.floor(0.9 * RUNS)].toFixed(1) + ' days';
      chart.render();
    }

    var P = { l: 44, r: 12, t: 22, b: 26 };
    function dom() { var a = bins[0].x0, b = bins[bins.length - 1].x0 + BW, dd = +dl.value; return [Math.min(a, dd - BW), Math.max(b, dd + BW)]; }
    function hx(v, w, D) { return P.l + (v - D[0]) / (D[1] - D[0]) * (w - P.l - P.r); }
    chart.draw = function (ctx, w, h) {
      if (!bins.length) return;
      var C = colors(root), D = dom(), d = +dl.value, max = 0;
      bins.forEach(function (b) { max = Math.max(max, b.c); });
      var base = h - P.b, top = P.t, bwpx = hx(BW, w, [0, D[1] - D[0]]) - P.l;
      ctx.strokeStyle = C.border; ctx.lineWidth = 1; ctx.fillStyle = C.muted;
      [0, 0.5, 1].forEach(function (f) {
        var y = base - f * (base - top);
        ctx.beginPath(); ctx.moveTo(P.l, y + 0.5); ctx.lineTo(w - P.r, y + 0.5); ctx.stroke();
        ctx.textAlign = 'right'; ctx.fillText(pct(f * max / RUNS), P.l - 6, y + 4);
      });
      bins.forEach(function (b) {
        if (!b.c) return;
        var x = hx(b.x0, w, D), bh = b.c / max * (base - top);
        ctx.fillStyle = b.x0 + BW / 2 <= d ? C.a : C.b;
        roundTop(ctx, x + 1, base - bh, Math.max(1, bwpx - 2), bh, 4);
      });
      var step = D[1] - D[0] > 30 ? 10 : D[1] - D[0] > 12 ? 5 : 2;
      ctx.fillStyle = C.muted; ctx.textAlign = 'center';
      for (var t = Math.ceil(D[0] / step) * step; t <= D[1]; t += step) ctx.fillText(t, hx(t, w, D), h - 8);
      var X = hx(d, w, D);
      ctx.strokeStyle = C.text; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(X, top - 6); ctx.lineTo(X, base); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = C.text; ctx.textAlign = X > w - 110 ? 'right' : 'left';
      ctx.fillText('deadline ' + d + ' d', X + (X > w - 110 ? -6 : 6), top + 2);
      ctx.textAlign = 'left';
    };
    chart.onHover(function (x, y) {
      if (!bins.length) return;
      var D = dom(), v = D[0] + (x - P.l) / (chart.w - P.l - P.r) * (D[1] - D[0]);
      var b = bins.find(function (b) { return v >= b.x0 && v < b.x0 + BW; });
      if (!b) return chart.hideTip();
      chart.showTip(x, y, b.x0.toFixed(2) + '–' + (b.x0 + BW).toFixed(2) + ' days<br>' + fmt(b.c) + ' projects (' + pct(b.c / RUNS) + ')');
    });

    inputs.forEach(function (p) { p[0].oninput = p[1].oninput = simulate; });
    dl.oninput = update;
    bRun.onclick = simulate;
    simulate();
    return [chart];
  }

  // ---------------------------------------------------------------- mount
  var WIDGETS = { pi: piWidget, spread: spreadWidget, birthday: birthdayWidget, project: projectWidget };
  function init() {
    var all = [];
    document.querySelectorAll('.mc[data-mc]').forEach(function (root) {
      var fn = WIDGETS[root.getAttribute('data-mc')];
      if (!fn || root.getAttribute('data-ready')) return;
      root.setAttribute('data-ready', '1');
      root.innerHTML = '';
      all = all.concat(fn(root));
    });
    all.forEach(function (c) { c.resize(); });
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () { all.forEach(function (c) { if (c.canvas.parentNode.clientWidth !== c.w) c.resize(); }); });
      document.querySelectorAll('.mc[data-mc]').forEach(function (r) { ro.observe(r); });
    } else {
      window.addEventListener('resize', function () { all.forEach(function (c) { c.resize(); }); });
    }
    new MutationObserver(function () { all.forEach(function (c) { c.render(); }); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-post-theme'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
