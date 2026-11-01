/* Figures and interactions for /blog_posts/philosophy-notes.html.
   Single source of truth: the <article class="ph-card"> elements in the page. Every figure reads
   names, dates, eras and answers from their data-* attributes, so the text and graphics can't drift. */
(function () {
  'use strict';
  var SVGNS = 'http://www.w3.org/2000/svg';
  var NOW = new Date().getFullYear();
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var ERAS = [
    { id: 'ancient', label: 'Ancient' },
    { id: 'medieval', label: 'Medieval' },
    { id: 'early-modern', label: 'Early modern' },
    { id: '19th-century', label: '19th century' },
    { id: '20th-century', label: '20th century' },
    { id: 'contemporary', label: 'Contemporary' }
  ];
  var DRIVERS = [
    { id: 'reason', icon: '🧠', title: 'Reason & knowledge', desc: 'We do what we believe is right; wrongdoing comes from ignorance or muddled thinking.' },
    { id: 'emotion', icon: '❤️', title: 'Desire & emotion', desc: 'Feeling comes first: desire, love and passion move us more than logic.' },
    { id: 'habit', icon: '🌱', title: 'Virtue, habit & upbringing', desc: 'Character is built by practice, ritual and the environment we grow up in.' },
    { id: 'drives', icon: '🌊', title: 'Inner drives', desc: 'Forces inside us we don’t fully see: a divided soul, will to power, the unconscious.' },
    { id: 'society', icon: '🏛️', title: 'Society, history & power', desc: 'We are shaped by our era, economy, language and the power we absorb.' },
    { id: 'freedom', icon: '🕊️', title: 'Freedom & anxiety', desc: 'We are free, that freedom frightens us, and much of life is a flight from it.' }
  ];

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }
  function svg(tag, attrs) {
    var e = document.createElementNS(SVGNS, tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function yearText(y) { return y < 0 ? (-y) + ' BCE' : (y < 1000 ? y + ' CE' : String(y)); }
  function shortName(n) {
    n = n.replace(/\s*\(.*\)/, '');
    if (/^Buddha/.test(n)) return 'Buddha';
    if (/ of /.test(n)) return n.split(' ')[0];
    var p = n.split(' ');
    if (p.length > 2 && p[p.length - 2] === 'de') return 'de ' + p[p.length - 1];
    if (p[0] === 'Ibn') return n;
    return p[p.length - 1];
  }

  var cards = Array.prototype.slice.call(document.querySelectorAll('.ph-card'));
  if (!cards.length) return;
  var people = cards.map(function (c) {
    var died = c.getAttribute('data-died');
    return {
      el: c,
      id: c.id,
      name: c.getAttribute('data-name'),
      short: shortName(c.getAttribute('data-name')),
      born: +c.getAttribute('data-born'),
      died: died === '' ? null : +died,
      era: c.getAttribute('data-era'),
      driver: c.getAttribute('data-driver'),
      school: c.getAttribute('data-school'),
      dates: c.querySelector('.ph-dates').textContent,
      img: c.querySelector('.ph-portrait').getAttribute('src'),
      insight: c.querySelector('.ph-insight span').textContent,
      text: c.textContent.toLowerCase()
    };
  });
  var byBirth = people.slice().sort(function (a, b) { return a.born - b.born; });

  /* ---------- jump to a card (clears filters that hide it) ---------- */
  var filters = { era: 'all', driver: null, q: '' };
  function goTo(p, e) {
    if (e) e.preventDefault();
    if (p.el.hidden) { filters = { era: 'all', driver: null, q: '' }; syncTools(); applyFilters(); }
    p.el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    p.el.classList.remove('flash'); void p.el.offsetWidth; p.el.classList.add('flash');
    if (history.replaceState) history.replaceState(null, '', '#' + p.id);
  }
  function faceLink(p, withName) {
    var a = el('a', { href: '#' + p.id, 'data-era': p.era, title: p.name + ' (' + p.dates + ')' });
    a.appendChild(el('img', { src: p.img, alt: withName ? '' : p.name, width: 46, height: 46, loading: 'lazy', decoding: 'async' }));
    if (withName) a.appendChild(el('span', null, p.short));
    a.addEventListener('click', function (e) { goTo(p, e); });
    return a;
  }

  /* ---------- hero faces ---------- */
  var faces = document.querySelector('.ph-faces');
  if (faces) {
    faces.removeAttribute('aria-hidden');
    faces.setAttribute('role', 'list');
    faces.setAttribute('aria-label', 'Jump to a philosopher');
    byBirth.forEach(function (p) { var a = faceLink(p, false); a.setAttribute('role', 'listitem'); faces.appendChild(a); });
  }

  /* ---------- figure: lifespans + "who was alive in year X?" ---------- */
  function drawLifespans(fig) {
    var canvas = fig.querySelector('.hv-canvas');
    canvas.innerHTML = '';
    canvas.style.position = 'relative';
    var legend = el('ul', { class: 'ph-legend' });
    ERAS.forEach(function (e) { legend.appendChild(el('li', { 'data-era': e.id }, '<i></i>' + e.label)); });
    canvas.appendChild(legend);
    var box = el('div', { style: 'position:relative' });
    canvas.appendChild(box);
    var tip = el('div', { class: 'ph-tip', hidden: '' });
    box.appendChild(tip);
    var ctl = el('div', { class: 'ph-year' });
    ctl.innerHTML = '<label for="ph-year">Who was alive in</label><input type="range" id="ph-year" min="0" max="1000" step="1"><output for="ph-year"></output>';
    canvas.appendChild(ctl);
    var alive = el('p', { class: 'ph-alive', 'aria-live': 'polite' });
    canvas.appendChild(alive);
    var range = ctl.querySelector('input'), out = ctl.querySelector('output');

    // broken axis: two segments with a gap the list doesn't cover
    var SEG = [[-600, 450], [1100, NOW + 4]];
    var span0 = SEG[0][1] - SEG[0][0], span1 = SEG[1][1] - SEG[1][0];
    var state = { year: 1850, sel: null };
    var geom;

    function render() {
      var W = Math.max(300, box.clientWidth);
      var phone = W < 560;
      var labelW = phone ? 78 : 120, gap = 22, padR = 8, top = 26, rowH = phone ? 19 : 21, barH = phone ? 9 : 11;
      var plotW = W - labelW - gap - padR;
      var u = plotW / (span0 + span1);
      var x0 = labelW, x1 = labelW + span0 * u + gap;
      function x(y) { return y <= SEG[0][1] ? x0 + (y - SEG[0][0]) * u : x1 + (Math.max(y, SEG[1][0]) - SEG[1][0]) * u; }
      function inv(px) {
        if (px <= x0 + span0 * u + gap / 2) return Math.round(SEG[0][0] + (px - x0) / u);
        return Math.round(SEG[1][0] + (px - x1) / u);
      }
      var H = top + byBirth.length * rowH + 8;
      geom = { x: x, inv: inv, x0: x0, x1: x1, u: u, W: W, H: H, top: top, rowH: rowH };

      var s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'ph-life', role: 'img',
        'aria-label': 'Lifespans of 25 philosophers from 600 BCE to today, with a break between 450 and 1100 CE. ' +
          byBirth.map(function (p) { return p.name + ' ' + p.dates; }).join('; ') });
      var defs = svg('defs');
      var grad = svg('linearGradient', { id: 'ph-alive', x1: 0, x2: 1 });
      grad.appendChild(svg('stop', { offset: '0', 'stop-color': 'var(--era-contemporary)' }));
      grad.appendChild(svg('stop', { offset: '0.75', 'stop-color': 'var(--era-contemporary)' }));
      grad.appendChild(svg('stop', { offset: '1', 'stop-color': 'var(--era-contemporary)', 'stop-opacity': '0.15' }));
      defs.appendChild(grad); s.appendChild(defs);

      var ticks = phone ? [-500, 1, 1100, 1500, 1900] : [-600, -400, -200, 1, 200, 400, 1100, 1300, 1500, 1700, 1900];
      ticks.forEach(function (t) {
        var tx = x(t);
        s.appendChild(svg('line', { x1: tx, x2: tx, y1: top - 6, y2: H - 4, class: 'grid' }));
        var lbl = svg('text', { x: tx, y: top - 11, 'text-anchor': 'middle', class: 'mut' });
        lbl.textContent = t === 1 ? '1 CE' : (t < 0 ? (-t) + ' BCE' : t);
        s.appendChild(lbl);
      });
      // axis break: a shaded band over the gap with short zigzag marks top and bottom
      var gx = x0 + span0 * u;
      s.appendChild(svg('rect', { x: gx + 3, y: top - 4, width: gap - 6, height: H - top, class: 'gapband' }));
      [top - 4, H - 4].forEach(function (yy) {
        s.appendChild(svg('path', { d: 'M' + (gx + 2) + ' ' + (yy + 4) + 'l4 -8 M' + (gx + gap - 6) + ' ' + (yy + 4) + 'l4 -8', class: 'brk' }));
      });

      var rows = [];
      byBirth.forEach(function (p, i) {
        var y = top + i * rowH;
        var g = svg('g', { class: 'row', 'data-era': p.era });
        g.appendChild(svg('rect', { class: 'hit', x: 0, y: y, width: W, height: rowH, rx: 4 }));
        var t = svg('text', { x: labelW - 8, y: y + rowH / 2 + 4, 'text-anchor': 'end' });
        t.textContent = p.short;
        g.appendChild(t);
        var end = p.died == null ? NOW : p.died;
        var bx0 = x(p.born), bw = Math.max(4, x(end) - bx0);
        g.appendChild(svg('rect', { class: 'bar' + (p.died == null ? ' alive' : ''), x: bx0, y: y + (rowH - barH) / 2, width: bw, height: barH, rx: barH / 2 }));
        g.addEventListener('mouseenter', function () { showTip(p, bx0 + bw / 2, y); });
        g.addEventListener('mouseleave', function () { tip.hidden = true; });
        g.addEventListener('click', function () { goTo(p); });
        s.appendChild(g);
        rows.push({ p: p, g: g });
      });

      var yl = svg('line', { class: 'yearline', y1: top - 4, y2: H - 4 });
      s.appendChild(yl);
      geom.rows = rows; geom.yl = yl;
      s.addEventListener('mousemove', function (e) {
        var r = s.getBoundingClientRect();
        var px = (e.clientX - r.left) * (W / r.width);
        if (px < x0) return;
        setYear(inv(px));
      });
      box.querySelectorAll('svg').forEach(function (n) { n.remove(); });
      box.appendChild(s);
      setYear(state.year);
    }
    function showTip(p, cx, y) {
      var age = (p.died == null ? NOW : p.died) - p.born;
      tip.innerHTML = '<strong>' + p.name + '</strong><br>' + p.dates + ' · ' + (p.died == null ? 'aged about ' + age : 'about ' + age + ' years');
      tip.style.left = Math.min(Math.max(cx, 90), geom.W - 90) + 'px';
      tip.style.top = y + 'px';
      tip.hidden = false;
    }
    function posToYear(v) {
      // slider position 0..1000 maps onto the two segments proportionally
      var f = v / 1000, tot = span0 + span1, d = f * tot;
      return d <= span0 ? Math.round(SEG[0][0] + d) : Math.round(SEG[1][0] + d - span0);
    }
    function yearToPos(y) {
      var tot = span0 + span1;
      var d = y <= SEG[0][1] ? y - SEG[0][0] : span0 + Math.max(0, y - SEG[1][0]);
      return Math.round(d / tot * 1000);
    }
    function setYear(y) {
      if (y > SEG[0][1] && y < SEG[1][0]) y = y - SEG[0][1] < SEG[1][0] - y ? SEG[0][1] : SEG[1][0];
      y = Math.min(Math.max(y, SEG[0][0]), NOW);
      if (y === 0) y = 1;
      state.year = y;
      range.value = yearToPos(y);
      out.textContent = yearText(y);
      var lx = geom.x(y);
      geom.yl.setAttribute('x1', lx); geom.yl.setAttribute('x2', lx);
      var living = [];
      geom.rows.forEach(function (r) {
        var p = r.p, end = p.died == null ? NOW : p.died;
        var on = p.born <= y && y <= end;
        r.g.classList.toggle('on', on);
        r.g.classList.toggle('dim', !on);
        if (on) living.push(p);
      });
      if (!living.length) {
        alive.innerHTML = 'In ' + yearText(y) + ', none of these 25 thinkers was alive. Drag the slider or move across the chart.';
        geom.rows.forEach(function (r) { r.g.classList.remove('dim'); });
      } else {
        alive.innerHTML = 'In <b>' + yearText(y) + '</b>, ' + (living.length === 1 ? 'one of them was alive: ' : '<b>' + living.length + '</b> of them were alive: ') +
          living.map(function (p) { var a = y - p.born; return '<b>' + p.short + '</b> (' + (a < 1 ? 'just born' : 'age ' + a) + ')'; }).join(', ') + '.';
      }
    }
    range.addEventListener('input', function () { setYear(posToYear(+range.value)); });
    render();
    var lastW = box.clientWidth;
    window.addEventListener('resize', function () { if (Math.abs(box.clientWidth - lastW) > 20) { lastW = box.clientWidth; render(); } });
  }

  /* ---------- figure: six answers ---------- */
  function drawDrivers(fig) {
    var canvas = fig.querySelector('.hv-canvas');
    canvas.innerHTML = '';
    var grid = el('div', { class: 'ph-drivers' });
    DRIVERS.forEach(function (d) {
      var who = byBirth.filter(function (p) { return p.driver === d.id; });
      var tile = el('div', { class: 'ph-driver' });
      tile.appendChild(el('h4', null, '<span class="icon" aria-hidden="true">' + d.icon + '</span> ' + d.title));
      tile.appendChild(el('p', null, d.desc));
      var row = el('div', { class: 'who' });
      who.forEach(function (p) { row.appendChild(faceLink(p, true)); });
      tile.appendChild(row);
      var b = el('button', { type: 'button', class: 'hv-btn' }, 'Show these ' + who.length + ' below →');
      b.addEventListener('click', function () {
        filters = { era: 'all', driver: d.id, q: '' };
        syncTools(); applyFilters();
        document.getElementById('ph-timeline').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      });
      tile.appendChild(b);
      grid.appendChild(tile);
    });
    canvas.appendChild(grid);
  }

  /* ---------- search + era / answer filters ---------- */
  var tools = document.querySelector('.ph-tools');
  var q = document.getElementById('ph-q');
  var chipsBox = document.getElementById('ph-era-chips');
  var count = document.getElementById('ph-count');
  function syncTools() {
    if (!tools) return;
    q.value = filters.q;
    chipsBox.querySelectorAll('.ph-chip').forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-f') === filters.era ? 'true' : 'false'); });
  }
  function applyFilters() {
    var term = filters.q.trim().toLowerCase(), shown = 0;
    people.forEach(function (p) {
      var ok = (filters.era === 'all' || p.era === filters.era) && (!filters.driver || p.driver === filters.driver) && (!term || p.text.indexOf(term) >= 0);
      p.el.hidden = !ok;
      if (ok) shown++;
    });
    document.querySelectorAll('.ph-era').forEach(function (s) { s.hidden = !s.querySelector('.ph-card:not([hidden])'); });
    if (!count) return;
    var d = filters.driver && DRIVERS.filter(function (x) { return x.id === filters.driver; })[0];
    count.innerHTML = 'Showing ' + shown + ' of ' + people.length + ' thinkers' + (d ? ' who answer “' + d.title + '”' : '') +
      (shown < people.length ? ' · <button type="button" id="ph-reset">show all</button>' : '');
    var r = document.getElementById('ph-reset');
    if (r) r.addEventListener('click', function () { filters = { era: 'all', driver: null, q: '' }; syncTools(); applyFilters(); });
  }
  if (tools) {
    tools.hidden = false;
    [{ id: 'all', label: 'All eras' }].concat(ERAS).forEach(function (e) {
      var n = e.id === 'all' ? people.length : people.filter(function (p) { return p.era === e.id; }).length;
      var c = el('button', { type: 'button', class: 'ph-chip', 'data-f': e.id, 'aria-pressed': 'false' });
      if (e.id !== 'all') c.setAttribute('data-era', e.id);
      c.innerHTML = (e.id !== 'all' ? '<i></i>' : '') + e.label + ' <small>' + n + '</small>';
      c.addEventListener('click', function () { filters.era = e.id; syncTools(); applyFilters(); });
      chipsBox.appendChild(c);
    });
    q.addEventListener('input', function () { filters.q = q.value; applyFilters(); });
    syncTools(); applyFilters();
  }

  /* ---------- figure: quiz ---------- */
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function drawQuiz(fig) {
    var canvas = fig.querySelector('.hv-canvas');
    var ROUNDS = 10, order, round, score, results;
    function start() { order = shuffle(people).slice(0, ROUNDS); round = 0; score = 0; results = []; ask(); }
    function dots() {
      var d = el('div', { class: 'ph-dots', 'aria-hidden': 'true' });
      for (var i = 0; i < ROUNDS; i++) d.appendChild(el('i', { class: results[i] === true ? 'ok' : results[i] === false ? 'no' : (i === round ? 'now' : '') }));
      return d;
    }
    function ask() {
      var p = order[round];
      var others = shuffle(people.filter(function (o) { return o !== p; })).slice(0, 3);
      var opts = shuffle(others.concat([p]));
      canvas.innerHTML = '';
      var topRow = el('div', { class: 'ph-quiz-top' });
      topRow.appendChild(el('span', null, 'Round ' + (round + 1) + ' of ' + ROUNDS + ' · score ' + score));
      topRow.appendChild(dots());
      canvas.appendChild(topRow);
      canvas.appendChild(el('p', { class: 'ph-prompt' }, p.insight));
      var grid = el('div', { class: 'ph-opts', role: 'group', 'aria-label': 'Who thought this?' });
      var fb = el('div', { class: 'ph-feedback', 'aria-live': 'polite' });
      opts.forEach(function (o) {
        var b = el('button', { type: 'button', class: 'ph-opt' });
        b.appendChild(el('img', { src: o.img, alt: '', width: 64, height: 64, decoding: 'async' }));
        b.appendChild(el('span', null, o.name.replace(/\s*\(.*\)/, '')));
        b.addEventListener('click', function () {
          var right = o === p;
          if (right) score++;
          results[round] = right;
          grid.querySelectorAll('.ph-opt').forEach(function (x, i) {
            x.disabled = true;
            if (opts[i] === p) x.classList.add('ok');
            else if (x === b) x.classList.add('no');
            else x.classList.add('faded');
          });
          fb.innerHTML = '<span class="verdict ' + (right ? 'ok' : 'no') + '">' + (right ? 'Correct!' : 'Not quite.') + '</span> <span>That’s ' + p.name + ' (' + p.dates + ', ' + p.school + ').</span>';
          var read = el('a', { href: '#' + p.id }, 'Read the card');
          read.addEventListener('click', function (e) { goTo(p, e); });
          fb.appendChild(read);
          var next = el('button', { type: 'button', class: 'hv-btn primary' }, round + 1 < ROUNDS ? 'Next →' : 'See score');
          next.addEventListener('click', function () { round++; if (round < ROUNDS) ask(); else finish(); });
          fb.appendChild(next);
          next.focus({ preventScroll: true });
        });
        grid.appendChild(b);
      });
      canvas.appendChild(grid);
      canvas.appendChild(fb);
    }
    function finish() {
      canvas.innerHTML = '';
      round = ROUNDS;
      var verdict = score >= 9 ? 'Philosopher-king territory.' : score >= 7 ? 'You clearly read the cards.' : score >= 4 ? 'A solid start: Socrates would say you now know what you don’t know.' : 'Socrates would approve: wisdom begins with knowing what you don’t know.';
      var f = el('div', { class: 'ph-final' });
      f.appendChild(dots());
      f.firstChild.style.justifyContent = 'center';
      f.appendChild(el('p', { class: 'score' }, score + ' / ' + ROUNDS));
      f.appendChild(el('p', null, verdict));
      var again = el('button', { type: 'button', class: 'hv-btn primary' }, 'Play again');
      again.addEventListener('click', start);
      f.appendChild(again);
      canvas.appendChild(f);
      again.focus({ preventScroll: true });
    }
    start();
  }

  var DRAW = { lifespans: drawLifespans, drivers: drawDrivers, quiz: drawQuiz };
  document.querySelectorAll('figure.hv[data-hv]').forEach(function (fig) {
    var f = DRAW[fig.getAttribute('data-hv')];
    if (!f) return;
    try { f(fig); } catch (err) { if (window.console) console.error('figure ' + fig.getAttribute('data-hv'), err); }
  });

  // honor a #card hash on load (e.g. shared links)
  if (location.hash) {
    var t = people.filter(function (p) { return '#' + p.id === location.hash; })[0];
    if (t) setTimeout(function () { goTo(t); }, 50);
  }
})();
