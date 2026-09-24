/* Homepage behaviour: themes, keyboard shortcuts, the in-page search engine,
   and the small animations (pipeline packet, epicycles, quotes, waveform, hangul). */
(function () {
  var root = document.documentElement;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ================= themes ================= */
  // Keep in sync with css/site.css. [name, bg, text, accent, accent-2]
  var THEMES = [
    ['midnight', '#0a0f1e', '#e6ebf5', '#5eead4', '#fbbf24'],
    ['terminal', '#030703', '#b9f7b1', '#39ff14', '#ffe14d'],
    ['paper', '#f5efe2', '#221c14', '#9b2c2c', '#1d4e89'],
    ['synthwave', '#12071f', '#f7ecff', '#ff4fd8', '#22d3ee'],
    ['nord', '#2b303b', '#eceff4', '#88c0d0', '#ebcb8b'],
    ['ember', '#140e0a', '#f4e7d9', '#ff8a3d', '#e9c46a']
  ];
  var BGS = ['graph', 'math', 'off'];
  var defaultTheme = root.getAttribute('data-default-theme') || 'midnight';
  var themeNames = THEMES.map(function (t) { return t[0]; });
  if (themeNames.indexOf(root.getAttribute('data-theme')) < 0) root.setAttribute('data-theme', defaultTheme);

  var grid = $('#theme-grid');
  THEMES.forEach(function (t) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'theme-swatch'; b.setAttribute('role', 'radio'); b.dataset.theme = t[0];
    b.style.setProperty('--sw-bg', t[1]); b.style.setProperty('--sw-text', t[2]);
    b.innerHTML = '<span class="dots"><i style="background:' + t[3] + '"></i><i style="background:' + t[4] + '"></i><i style="background:' + t[2] + '"></i></span>' +
      '<span>' + t[0] + '</span>' + (t[0] === defaultTheme ? '<span class="def">default</span>' : '');
    b.addEventListener('click', function () { setTheme(t[0]); });
    grid.appendChild(b);
  });

  function setTheme(name) {
    if (themeNames.indexOf(name) < 0) return false;
    root.setAttribute('data-theme', name);
    store('jk-theme', name);
    syncPanel();
    if (window.JKBackground) window.JKBackground.refresh();
    return true;
  }
  function setBg(mode) {
    if (BGS.indexOf(mode) < 0) return false;
    root.setAttribute('data-bg', mode);
    store('jk-bg', mode);
    syncPanel();
    if (window.JKBackground) window.JKBackground.set(mode);
    return true;
  }
  function syncPanel() {
    var th = root.getAttribute('data-theme'), bg = root.getAttribute('data-bg');
    $$('.theme-swatch').forEach(function (b) { b.setAttribute('aria-checked', b.dataset.theme === th); });
    $$('#bg-seg button').forEach(function (b) { b.setAttribute('aria-checked', b.dataset.bg === bg); });
  }
  $$('#bg-seg button').forEach(function (b) { b.addEventListener('click', function () { setBg(b.dataset.bg); }); });
  syncPanel();

  var panel = $('#theme-panel'), toggle = $('#theme-toggle');
  function openPanel(open) {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', open);
  }
  toggle.addEventListener('click', function (e) { e.stopPropagation(); openPanel(panel.hidden); });
  document.addEventListener('click', function (e) { if (!panel.hidden && !panel.contains(e.target)) openPanel(false); });

  function cycle(list, cur, dir) { return list[(list.indexOf(cur) + dir + list.length) % list.length]; }

  /* ================= keyboard ================= */
  var q = $('#q');
  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    var typing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
    if (e.key === 'Escape') { openPanel(false); if (typing) e.target.blur(); return; }
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === '/') { e.preventDefault(); focusSearch(); }
    else if (e.key === 't') setTheme(cycle(themeNames, root.getAttribute('data-theme'), e.shiftKey ? -1 : 1));
    else if (e.key === 'b') setBg(cycle(BGS, root.getAttribute('data-bg'), 1));
  });
  function focusSearch() {
    $('#top').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    q.focus({ preventScroll: true });
  }
  $('#search-jump').addEventListener('click', focusSearch);

  /* ================= search engine =================
     Tiny BM25F: title ×3, kind ×2, description ×1. Query understanding is a
     synonym map, prefix expansion of the last token (search-as-you-type) and
     Levenshtein spelling correction against the index vocabulary. */
  var docs = [];
  try { docs = JSON.parse($('#search-docs').textContent); } catch (e) {}
  var FIELDS = [['t', 3], ['k', 2], ['d', 1]], K1 = 1.2, B = .75;
  var SYN = {
    ann: ['hnsw', 'nearest'], vector: ['hnsw', 'nearest'], semantic: ['hnsw', 'search'], ml: ['machine', 'learning'],
    ai: ['genai', 'llm'], es: ['elasticsearch'], opensearch: ['elasticsearch', 'search'], korean: ['한국어', 'korean'],
    hangul: ['한국어'], nietzsche: ['philosophy'], camus: ['philosophy'], meaning: ['philosophy', 'why'],
    song: ['music'], songs: ['music'], dft: ['fourier'], fft: ['fourier', 'fft'], dsa: ['algorithms', 'data', 'structures'],
    cp: ['competitive', 'programming'], job: ['experience'], work: ['experience', 'engineer'], resume: ['experience', 'education'],
    college: ['bits'], university: ['bits'], hire: ['contact'], email: ['contact']
  };

  function stem(w) {
    if (w.length > 5 && /ing$/.test(w)) return w.slice(0, -3);
    if (w.length > 4 && /ies$/.test(w)) return w.slice(0, -3) + 'y';
    if (w.length > 3 && /s$/.test(w) && !/ss$/.test(w)) return w.slice(0, -1);
    return w;
  }
  function tokens(s) {
    return (s.toLowerCase().normalize('NFC').match(/[\p{L}\p{N}+#]+/gu) || []).map(stem);
  }

  var index = { df: {}, avg: {}, N: docs.length, vocab: [] };
  FIELDS.forEach(function (f) { index.avg[f[0]] = 0; });
  docs.forEach(function (d) {
    d.tf = {}; d.len = {};
    var uniq = {};
    FIELDS.forEach(function (f) {
      var toks = tokens(d[f[0]] || ''), tf = {};
      toks.forEach(function (t) { tf[t] = (tf[t] || 0) + 1; uniq[t] = 1; });
      d.tf[f[0]] = tf; d.len[f[0]] = toks.length; index.avg[f[0]] += toks.length;
    });
    Object.keys(uniq).forEach(function (t) { index.df[t] = (index.df[t] || 0) + 1; });
  });
  FIELDS.forEach(function (f) { index.avg[f[0]] = index.avg[f[0]] / Math.max(1, docs.length); });
  index.vocab = Object.keys(index.df);

  function idf(t) { var df = index.df[t] || 0; return Math.log(1 + (index.N - df + .5) / (df + .5)); }

  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    var prev = [], cur, i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur = [i];
      for (j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[b.length];
  }
  function correct(t) {
    if (t.length < 4) return null;
    var best = null, bd = 3;
    index.vocab.forEach(function (v) { var d = lev(t, v); if (d < bd || (d === bd && best && index.df[v] > index.df[best])) { bd = d; best = v; } });
    return bd <= (t.length > 6 ? 2 : 1) ? best : null;
  }

  // returns {terms: [[term, weight]], notes: {expanded, corrected}}
  function understand(raw) {
    var toks = tokens(raw), terms = [], notes = { expanded: [], corrected: [] };
    toks.forEach(function (t, i) {
      var last = i === toks.length - 1 && !/\s$/.test(raw);
      var matched = !!index.df[t];
      if (matched) terms.push([t, 1]);
      if (last && t.length >= 2) {
        index.vocab.forEach(function (v) { if (v !== t && v.indexOf(t) === 0) { terms.push([v, .7]); matched = true; } });
      }
      if (SYN[t]) { SYN[t].forEach(function (s) { terms.push([stem(s), .8]); }); notes.expanded.push(t + ' → ' + SYN[t].join(', ')); matched = true; }
      if (!matched) {
        var c = correct(t);
        if (c) { terms.push([c, .9]); notes.corrected.push([t, c]); }
      }
    });
    return { terms: terms, notes: notes };
  }

  function search(raw) {
    var u = understand(raw), scores = [];
    docs.forEach(function (d, i) {
      var s = 0;
      u.terms.forEach(function (tw) {
        var t = tw[0], tfw = 0;
        FIELDS.forEach(function (f) {
          var tf = d.tf[f[0]][t] || 0;
          if (tf) tfw += f[1] * tf / (1 - B + B * d.len[f[0]] / (index.avg[f[0]] || 1));
        });
        if (tfw) s += tw[1] * idf(t) * tfw * (K1 + 1) / (tfw + K1);
      });
      if (s > 0) scores.push([i, s]);
    });
    scores.sort(function (a, b) { return b[1] - a[1]; });
    return { hits: scores.slice(0, 6), total: scores.length, u: u };
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function highlight(text, terms) {
    var set = {}; terms.forEach(function (t) { set[t[0]] = 1; });
    return esc(text).replace(/[\p{L}\p{N}+#]+/gu, function (w) { return set[stem(w.toLowerCase())] ? '<mark>' + w + '</mark>' : w; });
  }
  function prettyUrl(u) {
    if (u.charAt(0) === '#') return location.host + '/' + u;
    return u.replace(/^https?:\/\//, '').replace(/^\//, location.host + '/');
  }

  var results = $('#results'), meta = $('#search-meta'), sel = -1, current = [];

  function render(raw) {
    raw = raw || '';
    sel = -1;
    if (raw.charAt(0) === ':') { command(raw, false); return; }
    if (!raw.trim()) { results.innerHTML = ''; meta.innerHTML = ''; current = []; return; }
    var t0 = performance.now(), r = search(raw), ms = performance.now() - t0;
    current = r.hits.map(function (h) { return docs[h[0]]; });
    var m = 'About <b>' + r.total + '</b> result' + (r.total === 1 ? '' : 's') + ' (' + ms.toFixed(2) + ' ms) · BM25';
    if (r.u.notes.corrected.length) m += ' · <span class="dym">did you mean <a data-fix="' + esc(r.u.notes.corrected.map(function (c) { return c[1]; }).join(' ')) + '">' + esc(r.u.notes.corrected.map(function (c) { return c[1]; }).join(' ')) + '</a>?</span>';
    if (r.u.notes.expanded.length) m += ' · expanded: ' + esc(r.u.notes.expanded.join('; '));
    if (!r.total) m = 'No results for “' + esc(raw) + '”. Try <b>search</b>, <b>music</b>, or <b>:help</b>.';
    meta.innerHTML = m;
    results.innerHTML = r.hits.map(function (h, i) {
      var d = docs[h[0]];
      return '<li class="result" role="option" id="res-' + i + '" data-i="' + i + '">' +
        '<div class="result-url"><span>' + esc(prettyUrl(d.u)) + '</span><span class="score">' + h[1].toFixed(2) + '</span></div>' +
        '<div class="result-title">' + highlight(d.t, r.u.terms) + '</div>' +
        '<p class="result-desc">' + highlight(d.d, r.u.terms) + '</p></li>';
    }).join('');
  }

  function go(d) {
    if (!d) return;
    if (d.u.charAt(0) === '#') { var el = $(d.u); if (el) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); history.replaceState(null, '', d.u); }
    else if (/^https?:/.test(d.u)) window.open(d.u, '_blank', 'noopener');
    else location.href = d.u;
  }

  function command(raw, run) {
    var parts = raw.slice(1).trim().split(/\s+/), cmd = parts[0] || '', arg = parts[1] || '';
    var help = 'commands: <b>:theme</b> ' + themeNames.join('|') + ' · <b>:bg</b> ' + BGS.join('|') + ' · <b>:random</b> · <b>:help</b>';
    results.innerHTML = ''; current = [];
    if (!run) { meta.innerHTML = cmd === 'help' ? help : 'press <kbd>enter</kbd> to run · ' + help; return; }
    var ok = false;
    if (cmd === 'theme') ok = setTheme(arg);
    else if (cmd === 'bg') ok = setBg(arg);
    else if (cmd === 'random') { go(docs[(Math.random() * docs.length) | 0]); ok = true; }
    else if (cmd === 'help') { meta.innerHTML = help; return; }
    meta.innerHTML = ok ? '✓ ' + esc(raw) : 'unknown: ' + esc(raw) + ' · ' + help;
    if (ok) { q.value = ''; updateGhost(); setTimeout(function () { if (!q.value) meta.innerHTML = ''; }, 2500); }
  }

  function move(dir) {
    var items = $$('.result', results);
    if (!items.length) return;
    sel = (sel + dir + items.length) % items.length;
    items.forEach(function (li, i) { li.setAttribute('aria-selected', i === sel); });
    q.setAttribute('aria-activedescendant', 'res-' + sel);
  }

  q.addEventListener('input', function () { render(q.value); updateGhost(); });
  q.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (q.value.charAt(0) === ':') command(q.value, true);
      else go(current[sel < 0 ? 0 : sel]);
    }
  });
  results.addEventListener('click', function (e) { var li = e.target.closest('.result'); if (li) go(current[+li.dataset.i]); });
  meta.addEventListener('click', function (e) { var a = e.target.closest('[data-fix]'); if (a) { q.value = a.dataset.fix; render(q.value); updateGhost(); q.focus(); } });
  $$('.search-try button').forEach(function (b) {
    b.addEventListener('click', function () {
      q.value = b.dataset.q; updateGhost(); q.focus();
      if (b.dataset.q.charAt(0) === ':' && b.dataset.q !== ':help') command(b.dataset.q, true); else render(q.value);
    });
  });

  /* typing placeholder */
  var ghost = $('#q-ghost');
  var PROMPTS = ['how does HNSW find neighbours?', 'why do we do what we do', 'segment tree problems', 'bloom filter false positives', 'fourier epicycles', 'music', 'search the site…'];
  var pi = 0, ci = 0, del = false;
  function updateGhost() { ghost.style.visibility = q.value ? 'hidden' : 'visible'; }
  function typeTick() {
    var s = PROMPTS[pi];
    if (!del) { ci++; if (ci >= s.length) { del = true; setTimeout(typeTick, 1800); ghost.textContent = s; return; } }
    else { ci -= 2; if (ci <= 0) { ci = 0; del = false; pi = (pi + 1) % PROMPTS.length; } }
    ghost.textContent = s.slice(0, ci);
    setTimeout(typeTick, del ? 25 : 55 + Math.random() * 60);
  }
  if (reduced) ghost.textContent = 'search the site…'; else typeTick();
  updateGhost();

  /* ================= work filters ================= */
  $$('.filters button').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('.filters button').forEach(function (x) { x.classList.toggle('is-on', x === b); });
      $$('#work-cards .card').forEach(function (c) { c.hidden = b.dataset.kind !== 'all' && c.dataset.kind !== b.dataset.kind; });
    });
  });

  /* ================= reveal + active nav ================= */
  if ('IntersectionObserver' in window) {
    var revealEls = $$('.section-head, .stage, .commit, .card, .beyond-card, .contact, .about-grid');
    revealEls.forEach(function (el) { el.classList.add('reveal'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });

    var navLinks = $$('.nav a');
    var navIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(function (s) { navIo.observe(s); });
  }

  function whenVisible(el, cb) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver(function (en) { cb(en[0].isIntersecting); }).observe(el);
  }
  function cssVar(n) { return getComputedStyle(root).getPropertyValue(n).trim(); }

  /* ================= pipeline packet ================= */
  (function () {
    var track = $('#pipeline-track'), packet = $('.packet', track), stages = $$('.stage', track);
    if (!track || reduced) return;
    var i = 0, timer = null;
    function step() {
      var s = stages[i];
      stages.forEach(function (x) { x.classList.toggle('is-lit', x === s); });
      packet.style.left = (s.offsetLeft + s.offsetWidth - 5) + 'px';
      packet.style.top = (s.offsetTop + 30) + 'px';
      i = (i + 1) % stages.length;
    }
    whenVisible(track, function (v) {
      clearInterval(timer);
      if (v) { step(); timer = setInterval(step, 1500); }
    });
  }());

  /* ================= epicycles (DFT of a lemniscate) ================= */
  (function () {
    var canvas = $('#epicycle');
    if (!canvas) return;
    var ctx = canvas.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2), N = 128, NEPI = 20;
    var coeffs = [], t = 0, path = [], running = false, size = 0;
    function setup() {
      size = canvas.clientWidth;
      canvas.width = canvas.height = size * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var a = size * .39, pts = [];
      for (var i = 0; i < N; i++) {
        var th = 2 * Math.PI * i / N, d = 1 + Math.sin(th) * Math.sin(th);
        pts.push({ re: a * Math.cos(th) / d, im: a * Math.sin(th) * Math.cos(th) / d });
      }
      coeffs = [];
      for (var k = 0; k < N; k++) {
        var re = 0, im = 0;
        for (var j = 0; j < N; j++) {
          var phi = 2 * Math.PI * k * j / N, c = Math.cos(phi), s = Math.sin(phi);
          re += pts[j].re * c + pts[j].im * s; im += pts[j].im * c - pts[j].re * s;
        }
        coeffs.push({ freq: k <= N / 2 ? k : k - N, amp: Math.hypot(re / N, im / N), phase: Math.atan2(im, re) });
      }
      coeffs.sort(function (a, b) { return b.amp - a.amp; });
      path = []; t = 0;
    }
    function draw() {
      var acc = cssVar('--accent'), hot = cssVar('--accent-2');
      ctx.clearRect(0, 0, size, size);
      var x = size / 2, y = size / 2;
      for (var i = 0; i < NEPI; i++) {
        var c = coeffs[i], px = x, py = y, ang = c.freq * t + c.phase;
        x += c.amp * Math.cos(ang); y += c.amp * Math.sin(ang);
        ctx.globalAlpha = .18; ctx.strokeStyle = acc; ctx.lineWidth = .8;
        ctx.beginPath(); ctx.arc(px, py, c.amp, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = .7; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      path.push({ x: x, y: y });
      if (path.length > N) path.shift();
      ctx.strokeStyle = hot; ctx.lineWidth = 2; ctx.lineJoin = 'round';
      ctx.beginPath();
      path.forEach(function (p, k) { k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); });
      ctx.stroke();
      t += (2 * Math.PI / N) * .75;
      if (t >= 2 * Math.PI) { t = 0; path = []; }
      if (running) requestAnimationFrame(draw);
    }
    setup();
    if (reduced) { for (var r = 0; r < 170; r++) { running = false; draw(); } return; }
    whenVisible(canvas, function (v) { var was = running; running = v; if (v && !was) requestAnimationFrame(draw); });
    window.addEventListener('resize', function () { if (canvas.clientWidth !== size) setup(); });
  }());

  /* ================= philosophy quotes ================= */
  (function () {
    var box = $('#quote');
    if (!box) return;
    var QUOTES = [
      ['He who has a <em>why</em> to live can bear almost any <em>how</em>.', 'Nietzsche'],
      ['One must imagine <em>Sisyphus</em> happy.', 'Camus'],
      ['The unexamined life is not <em>worth living</em>.', 'Socrates'],
      ['All things excellent are as difficult as they are <em>rare</em>.', 'Spinoza'],
      ['What stands in the way <em>becomes the way</em>.', 'Marcus Aurelius'],
      ['The starry heavens above me and the <em>moral law</em> within me.', 'Kant']
    ];
    var i = 0;
    if (reduced) return;
    setInterval(function () {
      box.style.opacity = 0;
      setTimeout(function () {
        i = (i + 1) % QUOTES.length;
        box.innerHTML = '<p>' + QUOTES[i][0] + '</p><cite>' + QUOTES[i][1] + '</cite>';
        box.style.opacity = 1;
      }, 500);
    }, 6500);
  }());

  /* ================= music waveform ================= */
  (function () {
    var canvas = $('#wave');
    if (!canvas) return;
    var ctx = canvas.getContext('2d'), card = canvas.parentNode, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var running = false, amp = 1, target = 1, w = 0, h = 0;
    card.addEventListener('pointerenter', function () { target = 2.2; });
    card.addEventListener('pointerleave', function () { target = 1; });
    function size() { w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function draw(time) {
      var t = (time || 0) / 1000, acc = cssVar('--accent'), hot = cssVar('--accent-2');
      amp += (target - amp) * .06;
      ctx.clearRect(0, 0, w, h);
      [[acc, 1, 0], [hot, .6, 1.7], [acc, .35, 3.1]].forEach(function (L) {
        ctx.strokeStyle = L[0]; ctx.globalAlpha = L[1]; ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (var x = 0; x <= w; x += 3) {
          var u = x / w, env = Math.sin(Math.PI * u);
          var y = h / 2 + env * amp * 9 * (Math.sin(u * 14 + t * 2.1 + L[2]) + .5 * Math.sin(u * 31 - t * 3.3 + L[2]) + .25 * Math.sin(u * 57 + t * 5));
          x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      if (running) requestAnimationFrame(draw);
    }
    size();
    window.addEventListener('resize', size);
    if (reduced) { draw(0); return; }
    whenVisible(canvas, function (v) { var was = running; running = v; if (v && !was) requestAnimationFrame(draw); });
  }());

  /* ================= hangul: jamo compose into blocks ================= */
  (function () {
    var el = $('#hangul');
    if (!el || reduced) return;
    var SEQ = ['ㅎ', '하', '한', 'ㄱ', '구', '국', 'ㅇ', '어'], i = 2;
    setInterval(function () { i = (i + 1) % SEQ.length; el.textContent = SEQ[i]; }, 900);
  }());
}());
