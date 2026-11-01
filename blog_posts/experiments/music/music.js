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
    var spec = null;
    if (analyser && window.mxRadioOn && window.mxRadioOn()) {
      spec = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(spec);
    }
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
      if (spec) { // mirror the low half of the real spectrum around the centre
        var bin = Math.floor(Math.abs(x - 0.5) * 2 * spec.length * 0.55);
        v = Math.max(0.03, spec[bin] / 255 * 0.95);
      }
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

  var actx = null, master = null, analyser = null, reverb = null;
  function audio() {
    if (!actx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      actx = new AC();
      master = actx.createGain(); master.gain.value = 0.35;
      var comp = actx.createDynamicsCompressor();
      analyser = actx.createAnalyser(); analyser.fftSize = 256; analyser.smoothingTimeConstant = 0.8;
      master.connect(comp); comp.connect(analyser); analyser.connect(actx.destination);
      // a small synthetic hall: decaying stereo noise as the impulse response
      reverb = actx.createConvolver();
      var len = Math.round(actx.sampleRate * 2.4), ir = actx.createBuffer(2, len, actx.sampleRate);
      for (var ch = 0; ch < 2; ch++) {
        var d = ir.getChannelData(ch);
        for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
      }
      reverb.buffer = ir;
      reverb.connect(master);
    }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  function tone(midi, when, dur, vel, dest) {
    var a = audio(); if (!a) return;
    vel = vel == null ? 1 : vel;
    var f = 440 * Math.pow(2, (midi - 69) / 12), t = when || a.currentTime;
    var g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.9 * vel, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.25 * vel, t + 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 1.6));
    [[1, 'triangle', 0.6], [2, 'sine', 0.25], [3, 'sine', 0.08]].forEach(function (p) {
      var o = a.createOscillator(), og = a.createGain();
      o.type = p[1]; o.frequency.value = f * p[0]; og.gain.value = p[2];
      o.connect(og); og.connect(g); o.start(t); o.stop(t + (dur || 1.6) + 0.05);
    });
    g.connect(dest || master);
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
    if (window.mxRadioStop) window.mxRadioStop();
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

  /* ================= background radio =================
     Beethoven and Mozart stations play the real opening bars of public-domain pieces;
     jazz and blues stations improvise forever over fixed chord changes. All synthesized. */
  var NOISE = null;
  function noise(a) {
    if (!NOISE) {
      NOISE = a.createBuffer(1, a.sampleRate, a.sampleRate);
      var d = NOISE.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return NOISE;
  }
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function env(g, t, peak, attack, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  var V = {
    piano: function (out, m, t, dur, vel) { tone(m, t, dur, vel, out); },
    epiano: function (out, m, t, dur, vel) {
      var g = actx.createGain(); env(g, t, 0.5 * vel, 0.01, dur);
      [[1, 'sine', 0.8], [2, 'sine', 0.12], [7.1, 'sine', 0.04]].forEach(function (p) {
        var o = actx.createOscillator(), og = actx.createGain();
        o.type = p[1]; o.frequency.value = hz(m) * p[0]; og.gain.value = p[2];
        o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + 0.05);
      });
      g.connect(out);
    },
    vibes: function (out, m, t, dur, vel) {
      var g = actx.createGain(); env(g, t, 0.45 * vel, 0.005, dur);
      var trem = actx.createGain(), lfo = actx.createOscillator(), depth = actx.createGain();
      lfo.frequency.value = 5.2; depth.gain.value = 0.35; lfo.connect(depth); depth.connect(trem.gain);
      var o = actx.createOscillator(); o.type = 'sine'; o.frequency.value = hz(m);
      var o2 = actx.createOscillator(), g2 = actx.createGain(); o2.frequency.value = hz(m) * 4; g2.gain.value = 0.06;
      o.connect(trem); o2.connect(g2); g2.connect(trem); trem.connect(g);
      [o, o2, lfo].forEach(function (x) { x.start(t); x.stop(t + dur + 0.05); });
      g.connect(out);
    },
    bass: function (out, m, t, dur, vel) {
      var g = actx.createGain(), f = actx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = 700;
      env(g, t, 0.9 * vel, 0.008, dur);
      var o = actx.createOscillator(); o.type = 'triangle'; o.frequency.value = hz(m);
      var o2 = actx.createOscillator(), g2 = actx.createGain(); o2.type = 'sine'; o2.frequency.value = hz(m); g2.gain.value = 0.6;
      o.connect(f); o2.connect(g2); g2.connect(f); f.connect(g); g.connect(out);
      o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
    },
    guitar: function (out, m, t, dur, vel, slide) {
      var g = actx.createGain(), f = actx.createBiquadFilter(), sh = actx.createWaveShaper();
      var curve = new Float32Array(256);
      for (var i = 0; i < 256; i++) { var x = i / 128 - 1; curve[i] = Math.tanh(2.2 * x); }
      sh.curve = curve; f.type = 'lowpass'; f.frequency.value = 2300; f.Q.value = 1.2;
      env(g, t, 0.22 * vel, 0.01, dur);
      [-7, 7].forEach(function (cents) {
        var o = actx.createOscillator(); o.type = 'sawtooth'; o.detune.value = cents;
        if (slide) { o.frequency.setValueAtTime(hz(m - 1), t); o.frequency.linearRampToValueAtTime(hz(m), t + 0.07); }
        else o.frequency.value = hz(m);
        o.connect(sh); o.start(t); o.stop(t + dur + 0.05);
      });
      sh.connect(f); f.connect(g); g.connect(out);
    },
    kick: function (out, t, vel) {
      var o = actx.createOscillator(), g = actx.createGain();
      o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      env(g, t, 0.9 * vel, 0.004, 0.3); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.32);
    },
    hit: function (out, t, vel, type, freq, dur) {
      var s = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
      s.buffer = noise(actx); f.type = type; f.frequency.value = freq;
      env(g, t, vel, 0.002, dur); s.connect(f); f.connect(g); g.connect(out);
      s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
    }
  };
  var snare = function (o, t, v) { V.hit(o, t, 0.5 * v, 'bandpass', 1900, 0.16); };
  var hat = function (o, t, v) { V.hit(o, t, 0.16 * v, 'highpass', 8000, 0.05); };
  var ride = function (o, t, v) { V.hit(o, t, 0.09 * v, 'highpass', 6500, 0.4); };
  var rnd = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };

  // a written-out piece: events [startUnit, midi, lengthUnits, velocity], looped
  function score(events, total, unit) {
    events.sort(function (a, b) { return a[0] - b[0]; });
    var i = 0;
    return function (out, t) {
      var e = events[i];
      V.piano(out, e[1], t, Math.max(0.5, e[2] * unit * 1.15), e[3]);
      var next = i + 1 < events.length ? events[i + 1][0] : total;
      var dt = (next - e[0]) * unit;
      i = (i + 1) % events.length;
      return dt;
    };
  }
  function moonlight() {
    // Beethoven, Piano Sonata No. 14 "Moonlight", Op. 27 No. 2, 1st mvt, bars 1-4. Unit = triplet eighth.
    var E = [], bars = [
      [[[37, 49], 12]], [[56, 61, 64], [56, 61, 64], [56, 61, 64], [56, 61, 64]],
      [[[35, 47], 12]], [[56, 61, 64], [56, 61, 64], [56, 61, 64], [56, 61, 64]],
      [[[33, 45], 6], [[30, 42], 6]], [[57, 61, 64], [57, 61, 64], [57, 62, 66], [57, 62, 66]],
      [[[32, 44], 12]], [[56, 60, 66], [56, 61, 64], [56, 61, 63], [54, 60, 63]]
    ];
    for (var b = 0; b < 4; b++) {
      var s = b * 12, at = s;
      bars[b * 2].forEach(function (bs) { bs[0].forEach(function (m) { E.push([at, m, bs[1], 0.42]); }); at += bs[1]; });
      bars[b * 2 + 1].forEach(function (tri, g) { tri.forEach(function (m, k) { E.push([s + g * 3 + k, m, 3, 0.26 + (k === 0 ? 0.04 : 0)]); }); });
    }
    return { unit: 0.36, step: score(E, 48, 0.36), wet: 0.5, gain: 2 };
  }
  function mozart() {
    // Eine kleine Nachtmusik, K. 525, bars 1-4 (in octaves), then Piano Sonata No. 16, K. 545, bars 1-2 twice. Unit = sixteenth.
    var E = [], at = 0;
    [[67, 4], [0, 2], [62, 2], [67, 4], [0, 2], [62, 2], [67, 2], [62, 2], [67, 2], [71, 2], [74, 8],
     [72, 4], [0, 2], [69, 2], [72, 4], [0, 2], [69, 2], [72, 2], [69, 2], [66, 2], [69, 2], [62, 8]].forEach(function (n) {
      if (n[0]) { E.push([at, n[0], n[1], 0.5]); E.push([at, n[0] - 12, n[1], 0.4]); }
      at += n[1];
    });
    for (var r = 0; r < 2; r++) {
      var s = at;
      [[72, 8], [76, 4], [79, 4], [71, 6], [72, 1], [74, 1], [72, 4], [0, 4]].forEach(function (n) {
        if (n[0]) E.push([at, n[0], n[1], 0.45]); at += n[1];
      });
      [48, 55, 52, 55, 48, 55, 52, 55, 50, 55, 53, 55, 48, 55, 52, 55].forEach(function (m, k) { E.push([s + k * 2, m, 2, 0.24]); });
    }
    return { unit: 0.13, step: score(E, at, 0.13), wet: 0.4, gain: 1.3 };
  }
  // melody walker over a pitch set
  function walker(lo, hi) {
    var cur = Math.round((lo + hi) / 2);
    return function (set, preferChord, chord) {
      var pool = [];
      for (var m = lo; m <= hi; m++) if (set.indexOf(m % 12) >= 0 && Math.abs(m - cur) <= 5) pool.push(m);
      if (preferChord) { var c = pool.filter(function (m) { return chord.indexOf(m % 12) >= 0; }); if (c.length) pool = c; }
      if (!pool.length) pool = [cur];
      cur = rnd(pool); return cur;
    };
  }
  function jazz() {
    // ii-V-I-VI in C, swing eighths at ~144 bpm.
    var beat = 0.42, slot = 0, bar = 0, comp = [], mel = walker(67, 84);
    var P = [
      { root: 38, tones: [2, 5, 9, 0], scale: [0, 2, 4, 5, 7, 9, 11], voice: [53, 57, 60, 64] },   // Dm7
      { root: 43, tones: [7, 11, 2, 5], scale: [0, 2, 4, 5, 7, 9, 11], voice: [53, 57, 59, 64] },  // G7
      { root: 36, tones: [0, 4, 7, 11], scale: [0, 2, 4, 5, 7, 9, 11], voice: [52, 55, 59, 62] },  // Cmaj7
      { root: 45, tones: [9, 1, 4, 7], scale: [9, 10, 1, 2, 4, 5, 7], voice: [55, 58, 61, 65] }    // A7(b9)
    ];
    return { wet: 0.18, step: function (out, t) {
      var c = P[bar % 4], n = P[(bar + 1) % 4], q = slot >> 1, on = slot % 2 === 0;
      if (slot === 0) comp = rnd([[0, 3], [3, 7], [2, 5], [1, 4], [3]]);
      if (on) {
        var m = q === 0 ? c.root : q === 3 ? n.root + rnd([-1, 1]) : c.root + rnd(q === 1 ? [3, 4, 7].filter(function (iv) { return c.tones.indexOf((c.root + iv) % 12) >= 0; }).concat([7]) : [7, 5, 9]);
        V.bass(out, m, t, beat * 0.95, 0.9);
        ride(out, t, q % 2 ? 1 : 0.8);
        if (q % 2) hat(out, t, 0.7);
      } else if (q === 1 || q === 3) ride(out, t, 0.55);
      if (comp.indexOf(slot) >= 0) c.voice.forEach(function (m) { V.epiano(out, m, t, beat * 0.9, 0.35); });
      var phrase = Math.floor(bar / 2) % 2 === 0;
      if (phrase && Math.random() < (on ? 0.7 : 0.45)) V.vibes(out, mel(c.scale, on, c.tones), t, beat * (Math.random() < 0.2 ? 1.6 : 0.7), 0.5);
      var dt = beat * (on ? 2 / 3 : 1 / 3);
      if (++slot === 8) { slot = 0; bar++; }
      return dt;
    } };
  }
  function blues() {
    // 12-bar shuffle in A at ~96 bpm: boogie bass, backbeat, chord stabs, blues-scale lead.
    var beat = 0.62, slot = 0, bar = 0, lead = walker(64, 81), boogie = [0, 4, 7, 9, 10, 9, 7, 4];
    var R = { A: 45, D: 50, E: 40 }, form = 'AAAADDAAEDAE';
    var stab = { A: [61, 67, 71], D: [60, 66, 69], E: [62, 68, 71] };
    var SCALE = [9, 0, 2, 3, 4, 7]; // A C D D# E G
    return { wet: 0.12, step: function (out, t) {
      var ch = form[bar % 12], on = slot % 2 === 0;
      V.bass(out, R[ch] + boogie[slot], t, beat * (on ? 0.6 : 0.3), 0.85);
      if (slot === 0 || slot === 4) V.kick(out, t, 0.9);
      if (slot === 2 || slot === 6) snare(out, t, 0.9);
      hat(out, t, on ? 0.8 : 0.5);
      if (slot === 3 || slot === 7) stab[ch].forEach(function (m) { V.epiano(out, m, t, beat * 0.3, 0.3); });
      var b12 = bar % 12, phrase = b12 % 4 < 2 || b12 >= 10;
      if (phrase && Math.random() < 0.55) {
        var long = Math.random() < 0.15;
        V.guitar(out, lead(SCALE, on, [9, 4, 7].concat(ch === 'D' ? [2, 6] : ch === 'E' ? [4, 8, 11] : [1])), t, beat * (long ? 1.4 : 0.5), 0.9, Math.random() < 0.25);
      }
      var dt = beat * (on ? 2 / 3 : 1 / 3);
      if (++slot === 8) { slot = 0; bar++; }
      return dt;
    } };
  }

  var STATIONS = {
    beethoven: { make: moonlight, name: 'Beethoven', piece: 'Moonlight Sonata, Op. 27 No. 2' },
    mozart: { make: mozart, name: 'Mozart', piece: 'Eine kleine Nachtmusik · Sonata K. 545' },
    jazz: { make: jazz, name: 'Jazz', piece: 'late-night ii–V–I, improvised live' },
    blues: { make: blues, name: 'Blues', piece: '12-bar shuffle in A, improvised live' }
  };
  var radioEl = $('mx-radio');
  if (radioEl) {
    var fab = $('mx-radio-fab'), panel = $('mx-radio-panel'), vol = $('mx-radio-vol'), playBtn = $('mx-radio-play');
    var stBtns = Array.prototype.slice.call(radioEl.querySelectorAll('[data-station]'));
    var R = { on: false, key: 'beethoven', st: null, bus: null, next: 0, timer: null, volume: 0.8 };
    var openPanel = function (open) {
      panel.hidden = !open; fab.setAttribute('aria-expanded', open ? 'true' : 'false');
      radioEl.classList.toggle('is-open', open);
    };
    var tick = function () {
      if (!R.on) return;
      if (R.next < actx.currentTime) R.next = actx.currentTime + 0.05; // tab was throttled: skip, don't burst
      while (R.next < actx.currentTime + 0.25) R.next += R.st.step(R.bus, R.next);
    };
    var fadeOut = function (bus) {
      if (!bus) return;
      var t = actx.currentTime;
      bus.gain.cancelScheduledValues(t); bus.gain.setValueAtTime(bus.gain.value, t); bus.gain.linearRampToValueAtTime(0, t + 0.6);
      setTimeout(function () { try { bus.disconnect(); } catch (e) {} }, 1500);
    };
    var tune = function (key) {
      if (!audio()) return;
      fadeOut(R.bus);
      R.key = key; R.st = STATIONS[key].make();
      var bus = actx.createGain(), dry = actx.createGain(), wet = actx.createGain();
      bus.gain.setValueAtTime(0, actx.currentTime); bus.gain.linearRampToValueAtTime(R.volume * (R.st.gain || 1), actx.currentTime + 0.8);
      dry.gain.value = 1; wet.gain.value = R.st.wet;
      bus.connect(dry); dry.connect(master); bus.connect(wet); wet.connect(reverb);
      R.bus = bus; R.next = actx.currentTime + 0.12; R.on = true;
      if (!R.timer) R.timer = setInterval(tick, 30);
      tick(); sync();
    };
    var stop = function () {
      if (!R.on) return;
      R.on = false; fadeOut(R.bus); R.bus = null; sync();
    };
    var sync = function () {
      radioEl.classList.toggle('is-on', R.on);
      radioEl.style.setProperty('--dial', stBtns.map(function (b) { return b.dataset.station; }).indexOf(R.key));
      stBtns.forEach(function (b) { b.setAttribute('aria-pressed', R.on && b.dataset.station === R.key ? 'true' : 'false'); });
      $('mx-radio-now').textContent = R.on ? STATIONS[R.key].piece : 'off · pick a station';
      playBtn.innerHTML = '<i class="fa fa-' + (R.on ? 'stop' : 'play') + '" aria-hidden="true"></i>';
      playBtn.setAttribute('aria-label', R.on ? 'Stop the radio' : 'Play the radio');
      fab.querySelector('.mx-fab-t').textContent = R.on ? STATIONS[R.key].name : 'background music';
    };
    window.mxRadioStop = stop;
    window.mxRadioOn = function () { return R.on; };
    fab.addEventListener('click', function () { openPanel(panel.hidden); });
    stBtns.forEach(function (b) { b.addEventListener('click', function () { tune(b.dataset.station); }); });
    playBtn.addEventListener('click', function () { if (R.on) stop(); else tune(R.key); });
    vol.addEventListener('input', function () {
      R.volume = +vol.value;
      if (R.bus) { R.bus.gain.cancelScheduledValues(actx.currentTime); R.bus.gain.setTargetAtTime(R.volume * (R.st.gain || 1), actx.currentTime, 0.05); }
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-radio-open]'), function (b) {
      b.addEventListener('click', function () { openPanel(true); if (!R.on) tune(R.key); });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) openPanel(false); });
    sync();
  }
})();
