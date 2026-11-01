/* Music page: turntable, crate, visualizer, playable piano, video facades. */
(function () {
  'use strict';
  var root = document.getElementById('mx');
  if (!root) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };

  /* ---------------- turntable + crate ---------------- */
  var deck = root.querySelector('.mx-deck');
  var sleeves = Array.prototype.slice.call(root.querySelectorAll('.mx-sleeve'));
  var current = 3, playing = true, swapTimer = null;
  sleeves.forEach(function (s) { s.style.setProperty('--c', s.dataset.c); });

  function setToggle() {
    deck.classList.toggle('is-stopped', !playing);
    var b = $('mx-toggle');
    b.innerHTML = '<i class="fa fa-' + (playing ? 'pause' : 'play') + '" aria-hidden="true"></i>';
    b.setAttribute('aria-label', playing ? 'Stop the record' : 'Play the record');
  }
  function load(i) {
    current = (i + sleeves.length) % sleeves.length;
    var s = sleeves[current];
    sleeves.forEach(function (x) { x.classList.toggle('is-on', x === s); x.setAttribute('aria-pressed', x === s ? 'true' : 'false'); });
    deck.classList.add('is-swapping');
    clearTimeout(swapTimer);
    swapTimer = setTimeout(function () {
      var parts = s.dataset.a.split(' · ');
      $('mx-label').setAttribute('fill', s.dataset.c);
      var t = s.dataset.t;
      $('mx-label-t').textContent = t;
      $('mx-label-t').style.fontSize = Math.max(12, Math.min(22, 190 / t.length)) + 'px';
      $('mx-label-s').textContent = (parts[0] + ' · ' + parts[parts.length - 1]).toUpperCase().slice(0, 26);
      $('mx-now-t').textContent = t;
      $('mx-now-a').textContent = s.dataset.a;
      $('mx-yt').href = 'https://www.youtube.com/results?search_query=' + s.dataset.q;
      deck.classList.remove('is-swapping');
      playing = true; setToggle();
    }, reduce ? 0 : 650);
  }
  sleeves.forEach(function (s, i) { s.addEventListener('click', function () { load(i); }); });
  $('mx-prev').addEventListener('click', function () { load(current - 1); });
  $('mx-next').addEventListener('click', function () { load(current + 1); });
  $('mx-toggle').addEventListener('click', function () { playing = !playing; setToggle(); });
  $('mx-record').addEventListener('click', function () { playing = !playing; setToggle(); });
  $('mx-record').style.cursor = 'pointer';
  if (reduce) { playing = false; setToggle(); }

  /* ---------------- visualizer ---------------- */
  var cv = $('mx-viz'), ctx = cv.getContext && cv.getContext('2d');
  var visible = true, energy = 1, pianoKick = 0, t0 = performance.now();
  function size() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr;
  }
  function frame(now) {
    if (!ctx) return;
    var w = cv.width, h = cv.height, t = (now - t0) / 1000;
    energy += ((playing ? 1 : 0.15) - energy) * 0.05;
    pianoKick *= 0.94;
    ctx.clearRect(0, 0, w, h);
    var n = Math.max(24, Math.round(w / (14 * (window.devicePixelRatio || 1)))), bw = w / n;
    var g = ctx.createLinearGradient(0, h, 0, 0);
    g.addColorStop(0, 'rgba(255,79,163,0.9)'); g.addColorStop(0.6, 'rgba(124,77,255,0.6)'); g.addColorStop(1, 'rgba(62,230,255,0.2)');
    ctx.fillStyle = g;
    for (var i = 0; i < n; i++) {
      var x = i / n;
      var v = 0.35 + 0.25 * Math.sin(t * 2.1 + x * 9) + 0.2 * Math.sin(t * 3.7 - x * 23) + 0.15 * Math.sin(t * 7.3 + x * 41);
      v *= 1 - Math.abs(x - 0.5) * 0.9;
      v = Math.max(0.03, v * energy + pianoKick * (1 - Math.abs(x - 0.5)));
      var bh = v * h;
      ctx.fillRect(i * bw + bw * 0.18, h - bh, bw * 0.64, bh);
    }
    if (visible) requestAnimationFrame(frame);
  }
  if (ctx && !reduce) {
    size(); window.addEventListener('resize', size);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        var was = visible; visible = es[0].isIntersecting;
        if (visible && !was) requestAnimationFrame(frame);
      }).observe(cv);
    }
    requestAnimationFrame(frame);
  }

  /* ---------------- playable piano (Web Audio) ---------------- */
  var NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  var KB = { C4: 'a', D4: 's', E4: 'd', F4: 'f', G4: 'g', A4: 'h', B4: 'j', C5: 'k', D5: 'l', E5: ';',
    'C#4': 'w', 'D#4': 'e', 'F#4': 't', 'G#4': 'y', 'A#4': 'u', 'C#5': 'o', 'D#5': 'p' };
  var keysEl = $('mx-keys'), notesEl = $('mx-notes'), keyByNote = {}, keyByKb = {};
  var whites = [];
  for (var oct = 4; oct <= 5; oct++) {
    for (var k = 0; k < 12; k++) {
      var name = NAMES[k] + oct, black = NAMES[k].length > 1;
      var midi = 12 * (oct + 1) + k;
      var el = document.createElement('button');
      el.type = 'button';
      el.className = 'mx-key ' + (black ? 'b' : 'w');
      el.dataset.note = name;
      el.dataset.midi = midi;
      el.setAttribute('aria-label', name);
      el.style.setProperty('--c', 'hsl(' + Math.round(300 + (midi - 60) * 6) % 360 + ' 95% 65%)');
      if (KB[name]) { el.innerHTML = '<span class="kb" aria-hidden="true">' + KB[name].toUpperCase() + '</span>'; keyByKb[KB[name]] = el; }
      if (!black) whites.push(el); else el.dataset.after = whites.length;
      keyByNote[name] = el;
      keysEl.appendChild(el);
    }
  }
  function placeBlacks() {
    var ww = 100 / whites.length;
    Array.prototype.forEach.call(keysEl.querySelectorAll('.mx-key.b'), function (b) {
      var a = +b.dataset.after;
      b.style.width = 'calc(' + ww * 0.62 + '% - 6px)';
      b.style.left = 'calc(14px + (100% - 28px) * ' + (a / whites.length) + ' - (100% - 28px) * ' + (ww * 0.31 / 100) + ')';
    });
  }
  placeBlacks();

  var actx = null, master = null;
  function audio() {
    if (!actx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      actx = new AC();
      master = actx.createGain(); master.gain.value = 0.35;
      var comp = actx.createDynamicsCompressor();
      master.connect(comp); comp.connect(actx.destination);
    }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  function tone(midi, when, dur) {
    var a = audio(); if (!a) return;
    var f = 440 * Math.pow(2, (midi - 69) / 12), t = when || a.currentTime;
    var g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.9, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 1.6));
    [[1, 'triangle', 0.6], [2, 'sine', 0.25], [3, 'sine', 0.08]].forEach(function (p) {
      var o = a.createOscillator(), og = a.createGain();
      o.type = p[1]; o.frequency.value = f * p[0]; og.gain.value = p[2];
      o.connect(og); og.connect(g); o.start(t); o.stop(t + (dur || 1.6) + 0.05);
    });
    g.connect(master);
  }
  function flash(el) {
    el.classList.add('on');
    setTimeout(function () { el.classList.remove('on'); }, 180);
    pianoKick = Math.min(1, pianoKick + 0.5);
    if (reduce) return;
    var n = document.createElement('span');
    n.className = 'mx-note';
    n.textContent = ['♪', '♫', '♩', '♬'][Math.floor(Math.random() * 4)];
    var kr = el.getBoundingClientRect(), sr = notesEl.getBoundingClientRect();
    n.style.left = (kr.left + kr.width / 2 - sr.left) + 'px';
    n.style.setProperty('--c', getComputedStyle(el).getPropertyValue('--c'));
    n.style.setProperty('--dx', (Math.random() * 60 - 30) + 'px');
    n.style.setProperty('--rot', (Math.random() * 60 - 30) + 'deg');
    notesEl.appendChild(n);
    setTimeout(function () { n.remove(); }, 1700);
  }
  function play(el) { tone(+el.dataset.midi); flash(el); }

  var dragging = false;
  keysEl.addEventListener('pointerdown', function (e) {
    var el = e.target.closest('.mx-key'); if (!el) return;
    dragging = true; play(el); e.preventDefault();
  });
  keysEl.addEventListener('pointerover', function (e) {
    if (!dragging) return;
    var el = e.target.closest('.mx-key'); if (el) play(el);
  });
  window.addEventListener('pointerup', function () { dragging = false; });
  keysEl.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('mx-key')) { play(e.target); e.preventDefault(); }
  });
  keysEl.addEventListener('click', function (e) { if (e.detail === 0 && e.target.classList.contains('mx-key')) e.preventDefault(); });

  var keysVisible = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { keysVisible = es[0].isIntersecting; }).observe(keysEl);
  }
  document.addEventListener('keydown', function (e) {
    if (!keysVisible || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    var el = keyByKb[e.key.toLowerCase()];
    if (el) { play(el); e.preventDefault(); }
  });

  /* Für Elise, opening melody (Beethoven, public domain). [note, eighths] */
  var ELISE = [['E5', 1], ['D#5', 1], ['E5', 1], ['D#5', 1], ['E5', 1], ['B4', 1], ['D5', 1], ['C5', 1], ['A4', 3],
    ['C4', 1], ['E4', 1], ['A4', 1], ['B4', 3], ['E4', 1], ['G#4', 1], ['B4', 1], ['C5', 3],
    ['E4', 1], ['E5', 1], ['D#5', 1], ['E5', 1], ['D#5', 1], ['E5', 1], ['B4', 1], ['D5', 1], ['C5', 1], ['A4', 3],
    ['C4', 1], ['E4', 1], ['A4', 1], ['B4', 3], ['E4', 1], ['C5', 1], ['B4', 1], ['A4', 4]];
  var eliseBtn = $('mx-elise'), eliseTimers = [];
  function stopElise() {
    eliseTimers.forEach(clearTimeout); eliseTimers = [];
    eliseBtn.classList.remove('is-playing');
    eliseBtn.innerHTML = '<i class="fa fa-play" aria-hidden="true"></i> Für Elise';
  }
  eliseBtn.addEventListener('click', function () {
    if (eliseTimers.length) { stopElise(); return; }
    var a = audio(); if (!a) return;
    var beat = 0.21, start = a.currentTime + 0.1, acc = 0;
    eliseBtn.classList.add('is-playing');
    eliseBtn.innerHTML = '<i class="fa fa-stop" aria-hidden="true"></i> stop';
    ELISE.forEach(function (p) {
      var el = keyByNote[p[0]], at = acc;
      tone(+el.dataset.midi, start + at * beat, Math.max(0.9, p[1] * beat * 2.2));
      eliseTimers.push(setTimeout(function () { flash(el); }, (0.1 + at * beat) * 1000));
      acc += p[1];
    });
    eliseTimers.push(setTimeout(stopElise, (0.1 + acc * beat) * 1000 + 300));
  });

  /* ---------------- video facades: load YouTube only on click ---------------- */
  Array.prototype.forEach.call(root.querySelectorAll('.mx-tape'), function (a) {
    a.addEventListener('click', function (e) {
      var th = a.querySelector('.mx-thumb');
      if (th.querySelector('iframe')) { e.preventDefault(); return; }
      e.preventDefault();
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + a.dataset.yt + '?autoplay=1';
      f.title = a.dataset.title;
      f.loading = 'lazy';
      f.allow = 'autoplay; encrypted-media; picture-in-picture';
      f.allowFullscreen = true;
      th.innerHTML = ''; th.appendChild(f);
    });
  });
})();
