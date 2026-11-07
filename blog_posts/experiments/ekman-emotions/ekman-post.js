// Figures for /blog_posts/paul-ekman-basic-emotions-override-hunger.html.
// Each builder replaces the .hv-canvas of a <figure class="hv" data-hv="...">; the <p class="hv-fallback">
// it replaces is the text version for agents and no-JS readers. Every number drawn here is computed
// from the same formulas the post states (toy models are labeled as such in the captions).
(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const T = (x, y, s, cls = '', anchor = 'start') => `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${s}</text>`;
  function onVisible(el, fn, threshold = 0.35) {
    if (!('IntersectionObserver' in window)) return fn();
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { io.disconnect(); fn(); } }, { threshold });
    io.observe(el);
  }
  const builders = {};

  // ── 1. Six faces ─────────────────────────────────────────────────────────
  // Features follow Ekman's descriptions in Emotions Revealed (2003).
  const eye = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="#3b2a1e" stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="${Math.max(1.8, r * 0.45)}" class="ek-fill"/>`;
  const FACES = [
    {
      id: 'happiness', name: 'Happiness',
      parts: '<path class="ek-line" d="M28 36 Q36 33 44 36 M56 36 Q64 33 72 36"/>' +
        '<path class="ek-line" d="M31 50 Q37 44 43 50 M57 50 Q63 44 69 50"/>' +
        '<path class="ek-thin" d="M24 46 l-4 -2 M24 50 l-4 1 M76 46 l4 -2 M76 50 l4 1"/>' +
        '<path class="ek-mouth" d="M32 74 Q50 96 68 74 Q50 84 32 74 Z"/>',
      trigger: 'Pleasant experiences: sensory pleasure, amusement, relief, pride and many other kinds of enjoyment.',
      face: 'Lip corners pulled up; cheeks raised, narrowing the eyes.',
      drive: 'The emotion we organize life around: Ekman’s mentor Silvan Tomkins said we try to maximize positive emotions and minimize negative ones.'
    },
    {
      id: 'sadness', name: 'Sadness',
      parts: '<path class="ek-line" d="M28 40 L44 31 M56 31 L72 40"/>' + eye(37, 48, 4) + eye(63, 48, 4) +
        '<path class="ek-line" d="M36 86 Q50 74 64 86"/>',
      trigger: 'Loss of something or someone important.',
      face: 'Inner corners of the eyebrows pulled up and together; lip corners down.',
      drive: 'In its extreme form, despair, it can overwhelm even the will to live (Ekman).'
    },
    {
      id: 'anger', name: 'Anger',
      parts: '<path class="ek-line" d="M27 32 L45 41 M55 41 L73 32"/>' +
        '<path class="ek-thin" d="M31 48 Q37 44 43 48 Q37 52 31 48 Z M57 48 Q63 44 69 48 Q63 52 57 48 Z" fill="#fff"/>' +
        '<circle cx="37" cy="48" r="2.2" class="ek-fill"/><circle cx="63" cy="48" r="2.2" class="ek-fill"/>' +
        '<path class="ek-line" d="M37 82 L63 82" style="stroke-width:4"/>',
      trigger: 'Someone interfering with what we are intent on doing, especially on purpose.',
      face: 'Brows lowered and drawn together; glaring eyes; lips pressed tight.',
      drive: 'Shuts down digestion: Walter Cannon saw rage stop a cat’s stomach movements completely (1915).'
    },
    {
      id: 'fear', name: 'Fear',
      parts: '<path class="ek-line" d="M28 33 L45 25 M55 25 L72 33"/>' + eye(37, 46, 6.5) + eye(63, 46, 6.5) +
        '<path class="ek-mouth" d="M28 80 Q50 74 72 80 Q50 90 28 80 Z"/>',
      trigger: 'The threat of harm, physical or psychological.',
      face: 'Brows raised and drawn together; eyes opened very wide; lips stretched back toward the ears.',
      drive: 'Stops the stomach (Cannon 1915) and can block the sex drive (Ekman 2003).'
    },
    {
      id: 'surprise', name: 'Surprise',
      parts: '<path class="ek-line" d="M27 33 Q36 20 45 31 M55 31 Q64 20 73 33"/>' + eye(37, 46, 6.5) + eye(63, 46, 6.5) +
        '<ellipse cx="50" cy="84" rx="7" ry="10" class="ek-mouth"/>',
      trigger: 'Something sudden and unexpected.',
      face: 'Brows raised and curved; eyes wide; jaw dropped open.',
      drive: 'The briefest emotion, a few seconds at most, before it turns into fear, amusement, relief, anger or disgust (Ekman).'
    },
    {
      id: 'disgust', name: 'Disgust',
      parts: '<path class="ek-line" d="M28 37 L44 39 M56 39 L72 37"/>' +
        '<path class="ek-thin" d="M31 49 Q37 45 43 49 Q37 51 31 49 Z M57 49 Q63 45 69 49 Q63 51 57 49 Z" fill="#fff"/>' +
        '<circle cx="37" cy="48.6" r="2" class="ek-fill"/><circle cx="63" cy="48.6" r="2" class="ek-fill"/>' +
        '<path class="ek-thin" d="M44 56 q3 -2 6 0 q3 2 6 0 M45 60 q2.5 -1.5 5 0 q2.5 1.5 5 0"/>' +
        '<path class="ek-mouth" d="M35 81 Q41 72 50 77 Q59 72 65 81 Q50 85 35 81 Z"/>',
      trigger: 'Something offensive, poisonous or contaminating: rotting food, bodily products, some foods from other cultures.',
      face: 'Nose wrinkled; upper lip raised.',
      drive: 'Overrides hunger: people may refuse the only food available, even if others find it palatable (Ekman 2003).'
    }
  ];
  const faceSvg = (f) => `<svg viewBox="0 0 100 110" role="img" aria-label="Cartoon face showing ${f.name.toLowerCase()}: ${f.face}">` +
    `<ellipse cx="50" cy="56" rx="38" ry="46" class="ek-skin"/>` +
    (f.id === 'disgust' ? '' : '<path class="ek-thin" d="M50 52 L47 64 L52 65"/>') + f.parts + '</svg>';

  builders.faces = (el) => {
    el.innerHTML = `<div class="ek-faces" role="group" aria-label="Six basic emotions">${FACES.map((f, i) =>
      `<button type="button" class="ek-face" data-i="${i}" aria-pressed="${i === 5}">${faceSvg(f)}<span>${f.name}</span></button>`).join('')}</div>` +
      '<div class="ek-info" aria-live="polite"></div>';
    const info = el.querySelector('.ek-info');
    const show = (i) => {
      const f = FACES[i];
      el.querySelectorAll('.ek-face').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.i === i)));
      info.innerHTML = `<h4>${f.name}</h4><p><b>Trigger:</b> ${f.trigger}</p><p><b>Face:</b> ${f.face}</p><p><b>Against the drives:</b> ${f.drive}</p>`;
    };
    el.querySelectorAll('.ek-face').forEach((b) => b.addEventListener('click', () => show(+b.dataset.i)));
    show(5);
  };

  // ── 2. Runaway train: the refractory period ──────────────────────────────
  // Log time axis from 0.1 s to 2 h. Emotion rises within 0.3 s, stays high for the refractory
  // period R, then fades with a 20 s time constant (illustrative). Messages that arrive before R bounce off.
  const MSGS = [
    { t: 5, label: 'They apologize', when: '5 s' },
    { t: 30, label: 'They explain what they meant', when: '30 s' },
    { t: 300, label: 'A friend says it was a joke', when: '5 min' },
    { t: 1800, label: 'You remember they are kind', when: '30 min' }
  ];
  const REFR = [{ s: 2, label: '2 seconds' }, { s: 60, label: '1 minute' }, { s: 600, label: '10 minutes' }, { s: 3600, label: '1 hour' }];
  builders.train = (fig, el) => {
    const W = 640, H = 230, L = 46, R = 14, top = 18, bot = 186;
    const lo = Math.log10(0.1), hi = Math.log10(7200);
    const X = (t) => L + ((Math.log10(t) - lo) / (hi - lo)) * (W - L - R);
    const Y = (v) => bot - (v / 100) * (bot - top);
    const intensity = (t, r) => (t < 0.3 ? 95 * (t - 0.1) / 0.2 : t <= r ? 95 : 95 * Math.exp(-(t - r) / 20));
    el.innerHTML = `<div class="hv-controls"><label>Refractory period <input type="range" min="0" max="3" step="1" value="0" aria-label="Refractory period"> <output>2 seconds</output></label>` +
      '<button type="button" class="hv-btn">Replay</button></div><div class="hv-scroll"><div class="ek-plot"></div></div><div class="ek-msgs" aria-live="polite"></div>' +
      '<div class="hv-legend"><span><i class="ln" style="background:var(--ek-hot)"></i>anger intensity</span><span><i class="sq" style="background:var(--ek-hot);opacity:.3"></i>refractory period</span>' +
      '<span><i style="background:var(--ek-drive)"></i>message gets through</span><span><i style="border:2px solid var(--ek-hot)"></i>message bounces off</span></div>';
    const input = el.querySelector('input'), out = el.querySelector('output'), plot = el.querySelector('.ek-plot'), msgs = el.querySelector('.ek-msgs');
    const draw = (animate) => {
      const r = REFR[+input.value].s;
      out.textContent = REFR[+input.value].label;
      let pts = [];
      for (let i = 0; i <= 240; i++) { const t = Math.pow(10, lo + (hi - lo) * i / 240); pts.push(`${X(t).toFixed(1)},${Y(intensity(t, r)).toFixed(1)}`); }
      const ticks = [[0.1, '0.1 s'], [1, '1 s'], [10, '10 s'], [60, '1 min'], [600, '10 min'], [3600, '1 h']];
      let g = `<rect x="${X(0.1)}" y="${top}" width="${X(r) - X(0.1)}" height="${bot - top}" class="ek-refr"/>`;
      g += ticks.map(([t, s]) => `<line x1="${X(t)}" x2="${X(t)}" y1="${top}" y2="${bot}" class="grid"/>` + T(X(t), bot + 18, s, 'mut', 'middle')).join('');
      g += `<line x1="${L}" x2="${W - R}" y1="${bot}" y2="${bot}" class="axis"/>` + T(L - 6, Y(95) + 4, 'high', 'mut', 'end') + T(L - 6, bot, 'calm', 'mut', 'end');
      g += T(X(0.1) + 4, top + 14, 'insult', 'mut') + T((X(0.1) + X(r)) / 2, top - 4, 'refractory', 'mut', 'middle');
      g += `<polyline points="${pts.join(' ')}" class="ek-curve${animate && !reduced() ? ' anim' : ''}"/>`;
      MSGS.forEach((m) => {
        const ok = m.t > r, y = Y(intensity(m.t, r));
        g += ok ? `<circle cx="${X(m.t)}" cy="${y}" r="7" class="ek-dot-in"/>`
          : `<circle cx="${X(m.t)}" cy="${y}" r="7" class="ek-dot-out"/><path d="M${X(m.t) - 3.5} ${y - 3.5} l7 7 m0 -7 l-7 7" class="ek-hot-s" style="stroke-width:2"/>`;
      });
      g += T(W / 2, H - 4, 'time since the insult (log scale)', 'mut', 'middle');
      const blocked = MSGS.filter((m) => m.t <= r).length;
      plot.innerHTML = `<svg viewBox="0 0 ${W} ${H}" style="min-width:520px" role="img" aria-label="Anger intensity over time with a ${REFR[+input.value].label} refractory period: ${blocked} of 4 messages bounce off.">${g}</svg>`;
      const curve = plot.querySelector('.ek-curve');
      if (curve && curve.classList.contains('anim')) { curve.style.setProperty('--len', Math.ceil(curve.getTotalLength())); fig.classList.remove('play'); void curve.getBBox(); fig.classList.add('play'); }
      msgs.innerHTML = MSGS.map((m) => `<div class="ek-msg ${m.t > r ? 'in' : 'out'}"><b>${m.when}:</b> ${m.label}<br>${m.t > r ? 'gets through' : 'bounces off'}</div>`).join('');
    };
    input.addEventListener('input', () => draw(false));
    el.querySelector('button').addEventListener('click', () => draw(true));
    draw(false);
    onVisible(fig, () => draw(true));
  };

  // ── 3. Hunger vs disgust (toy model) ─────────────────────────────────────
  // hunger(h) = 100·(1 − e^(−h/24)); eat when hunger > disgust; crossing at h = −24·ln(1 − d/100).
  const FOODS = [
    { name: 'Plain bread', d: 0 },
    { name: 'Unfamiliar food from another culture', d: 40 },
    { name: 'Food that touched something rotten', d: 80 },
    { name: 'Food you find truly disgusting', d: 110 }
  ];
  const hunger = (h) => 100 * (1 - Math.exp(-h / 24));
  const cross = (d) => (d <= 0 ? 0 : d >= 100 ? null : -24 * Math.log(1 - d / 100));
  builders.hunger = (fig, el) => {
    const W = 640, H = 300, L = 44, R = 14, top = 14, bot = 260, maxH = 72, maxV = 120;
    const X = (h) => L + (h / maxH) * (W - L - R), Y = (v) => bot - (v / maxV) * (bot - top);
    el.innerHTML = '<div class="hv-controls"><label>Hours without food <input type="range" min="0" max="72" step="1" value="30" aria-label="Hours without food"> <output>30 h</output></label>' +
      '<span class="ek-readout" aria-live="polite"></span></div><div class="hv-chart"><div class="ek-plot"></div><div class="hv-tip"></div></div><div class="ek-foods"></div>' +
      '<div class="hv-legend"><span><i class="ln" style="background:var(--ek-drive)"></i>hunger urge</span><span><i class="ln" style="background:var(--ek-hot)"></i>disgust level of a food</span></div>';
    const input = el.querySelector('input'), out = el.querySelector('output'), plot = el.querySelector('.ek-plot'), foods = el.querySelector('.ek-foods'), readout = el.querySelector('.ek-readout'), tip = el.querySelector('.hv-tip');
    let base = '';
    for (let v = 0; v <= 120; v += 20) base += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" class="grid"/>` + T(L - 6, Y(v) + 4, v, 'mut', 'end');
    for (let h = 0; h <= 72; h += 12) base += T(X(h), bot + 18, h + ' h', 'mut', 'middle');
    base += `<line x1="${L}" x2="${W - R}" y1="${bot}" y2="${bot}" class="axis"/>`;
    base += `<line x1="${L}" x2="${W - R}" y1="${Y(100)}" y2="${Y(100)}" class="axis" stroke-dasharray="2 4"/>` + T(L + 4, Y(100) - 5, 'hunger ceiling (100)', 'mut');
    FOODS.forEach((f) => { if (f.d > 0) base += `<line x1="${L}" x2="${W - R}" y1="${Y(f.d)}" y2="${Y(f.d)}" class="ek-hot-s" stroke-dasharray="6 4" style="stroke-width:2"/>` + T(W - R - 4, f.d > 100 ? Y(f.d) - 6 : Y(f.d) + 16, f.name + ' · ' + f.d, 'mut', 'end'); });
    let pts = [];
    for (let i = 0; i <= 144; i++) { const h = maxH * i / 144; pts.push(`${X(h).toFixed(1)},${Y(hunger(h)).toFixed(1)}`); }
    base += `<polyline points="${pts.join(' ')}" class="ek-drive-s" style="stroke-width:3"/>`;
    FOODS.forEach((f) => { const c = cross(f.d); if (c !== null && c > 0) base += `<circle cx="${X(c)}" cy="${Y(f.d)}" r="5" class="ek-cross" stroke="var(--ek-hot)"/>`; });
    const draw = () => {
      const h = +input.value, hv = hunger(h);
      out.textContent = h + ' h';
      readout.innerHTML = `hunger urge <b>${hv.toFixed(0)}</b>`;
      const g = base + `<line x1="${X(h)}" x2="${X(h)}" y1="${top}" y2="${bot}" class="ek-now"/><circle cx="${X(h)}" cy="${Y(hv)}" r="6" class="ek-drive" stroke="var(--surface)" stroke-width="2"/>`;
      plot.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Toy model: hunger urge ${hv.toFixed(0)} after ${h} hours, against four foods' disgust levels.">${g}</svg>`;
      foods.innerHTML = FOODS.map((f) => {
        const eat = hv > f.d || f.d === 0, c = cross(f.d);
        const when = f.d === 0 ? 'eaten at once' : c === null ? 'never eaten: disgust is above the hunger ceiling' : `eaten after ≈ ${c.toFixed(1)} h`;
        return `<div class="ek-food ${eat ? 'eat' : 'no'}"><b>${f.name}</b><br>disgust ${f.d} · ${when}<br><span class="ek-verdict">${eat ? 'Eats' : 'Refuses'}</span></div>`;
      }).join('');
    };
    input.addEventListener('input', draw);
    plot.addEventListener('pointermove', (e) => {
      const svgEl = plot.querySelector('svg'); if (!svgEl) return;
      const rect = svgEl.getBoundingClientRect(), x = ((e.clientX - rect.left) / rect.width) * W;
      const h = Math.max(0, Math.min(72, Math.round(((x - L) / (W - L - R)) * maxH)));
      tip.textContent = `${h} h: hunger ${hunger(h).toFixed(0)}`;
      tip.style.left = (e.clientX - rect.left) + 'px'; tip.style.top = (e.clientY - rect.top) + 'px'; tip.style.opacity = 1;
    });
    plot.addEventListener('pointerleave', () => { tip.style.opacity = 0; });
    draw();
  };

  // ── 4. Cannon's cat: fear stops the stomach ──────────────────────────────
  builders.stomach = (fig, el) => {
    const guide = 'M110 46 C 70 120 130 180 220 172 S 320 140 350 146';
    el.innerHTML = '<div class="hv-controls"><button type="button" class="hv-btn" data-a="fear">Startle the cat</button><button type="button" class="hv-btn" data-a="calm">Pet the cat</button></div>' +
      `<svg viewBox="0 0 400 220" style="max-width:560px;margin:0 auto" role="img" aria-label="A stomach with peristaltic waves, which stop when the cat is frightened.">` +
      `<defs><mask id="ek-st-mask"><path d="${guide}" stroke="#fff" stroke-width="62" stroke-linecap="round" fill="none"/></mask></defs>` +
      `<path d="M110 8 L110 46" stroke="var(--text)" stroke-width="20" stroke-linecap="round"/><path d="M110 8 L110 46" stroke="var(--surface-2)" stroke-width="15" stroke-linecap="round"/>` +
      `<g class="ek-st"><path d="${guide}" stroke="var(--text)" stroke-width="67" stroke-linecap="round" fill="none"/><path d="${guide}" stroke="var(--surface-2)" stroke-width="62" stroke-linecap="round" fill="none"/>` +
      `<g mask="url(#ek-st-mask)" class="ek-waves"></g></g>` +
      `<path class="ek-guide" d="${guide}" fill="none" stroke="none"/>` +
      T(124, 18, 'from the esophagus', 'mut') + T(386, 104, 'to the intestine', 'mut', 'end') + '</svg>' +
      '<p class="ek-status calm" aria-live="polite"></p>';
    const svgEl = el.querySelector('svg'), wavesG = el.querySelector('.ek-waves'), path = el.querySelector('.ek-guide'), status = el.querySelector('.ek-status'), st = el.querySelector('.ek-st');
    const len = path.getTotalLength();
    const waves = [0, 1, 2].map(() => { const c = document.createElementNS(NS, 'ellipse'); c.setAttribute('rx', 14); c.setAttribute('ry', 40); c.setAttribute('class', 'ek-wave'); wavesG.appendChild(c); return c; });
    let calm = true, phase = 0, last = 0, running = false, visible = false;
    const place = () => {
      waves.forEach((c, i) => {
        const s = ((phase + i / 3) % 1) * len, p = path.getPointAtLength(s), q = path.getPointAtLength(Math.min(len, s + 1));
        const ang = Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI;
        c.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${ang.toFixed(1)})`);
        c.style.opacity = calm ? '' : '0';
      });
    };
    const tick = (now) => {
      if (!calm || !visible) { running = false; return; }
      if (last) phase = (phase + (now - last) / 9000) % 1;
      last = now; place(); requestAnimationFrame(tick);
    };
    const start = () => { if (running || reduced()) return; running = true; last = 0; requestAnimationFrame(tick); };
    const set = (c) => {
      calm = c;
      status.className = 'ek-status ' + (c ? 'calm' : 'fear');
      status.textContent = c ? 'Cat calm and purring: churning waves move food along.' : 'Cat frightened: waves stopped, stomach wall relaxed. No digestion until it calms down.';
      st.setAttribute('transform', c ? '' : 'translate(-8 -6) scale(1.03)');
      place(); if (c) start();
    };
    el.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => set(b.dataset.a === 'calm')));
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible && calm) start(); }).observe(svgEl);
    else visible = true;
    set(true);
  };

  // ── 5. Three overrides ───────────────────────────────────────────────────
  const DRIVES = [
    { drive: 'Hunger', emo: 'Disgust', ex: 'People will not eat if the only food available is disgusting.' },
    { drive: 'Sex', emo: 'Fear or disgust', ex: 'A person may never attempt sexual contact, or never complete it.' },
    { drive: 'Will to live', emo: 'Despair', ex: 'Despair can overwhelm even the will to live.' }
  ];
  builders.drives = (fig, el) => {
    el.innerHTML = '<div class="hv-panels">' + DRIVES.map((d) => `<div class="hv-panel"><h4>${d.emo} &gt; ${d.drive.toLowerCase()}</h4>` +
      `<div class="ek-drive-row"><span>${d.drive}</span><span class="ek-bar"><i class="d" data-w="80"></i></span></div>` +
      `<div class="ek-drive-row"><span>${d.emo}</span><span class="ek-bar"><i class="e" data-w="95"></i></span></div>` +
      `<p><strong>Ekman:</strong> ${d.ex}</p></div>`).join('') + '</div>' +
      '<div class="hv-legend"><span><i class="sq" style="background:var(--ek-drive)"></i>fundamental drive</span><span><i class="sq" style="background:var(--ek-hot)"></i>emotion that can win</span><span>bar lengths are illustrative</span></div>';
    const bars = el.querySelectorAll('.ek-bar i');
    const fill = () => bars.forEach((b) => { b.style.width = b.dataset.w + '%'; });
    if (reduced()) fill(); else onVisible(fig, fill);
  };

  // ── 6. Quote timeline ────────────────────────────────────────────────────
  const QUOTES = [
    { y: 1739, who: 'David Hume', role: 'philosopher', q: 'Reason is, and ought only to be the slave of the passions.', src: 'A Treatise of Human Nature, Book II' },
    { y: 1872, who: 'Charles Darwin', role: 'naturalist', q: 'The term ‘disgust,’ in its simplest sense, means something offensive to the taste.', src: 'The Expression of the Emotions in Man and Animals' },
    { y: 1884, who: 'William James', role: 'psychologist', q: 'We feel sorry because we cry, angry because we strike, afraid because we tremble.', src: '“What is an Emotion?”, Mind' },
    { y: 1915, who: 'Walter B. Cannon', role: 'physiologist', q: 'The motions of the stomach and intestines cease at once … whenever pain, fear, rage, or other strong excitement is present.', src: 'Bodily Changes in Pain, Hunger, Fear and Rage' },
    { y: 2003, who: 'Paul Ekman', role: 'psychologist', q: 'Emotion triumphs over the hunger drive!', src: 'Emotions Revealed' }
  ];
  builders.quotes = (fig, el) => {
    el.innerHTML = '<ol class="ek-quotes">' + QUOTES.map((q) => `<li><span class="yr">${q.y}</span><span class="who">${q.who}</span> <span class="src">(${q.role})</span>` +
      `<blockquote>“${q.q}”</blockquote><span class="src">${q.src}</span></li>`).join('') + '</ol>';
  };

  document.querySelectorAll('figure.hv[data-hv]').forEach((fig) => {
    const b = builders[fig.dataset.hv], canvas = fig.querySelector('.hv-canvas');
    if (!b || !canvas) return;
    try {
      const el = document.createElement('div');
      el.className = 'hv-canvas';
      canvas.replaceWith(el);
      if (b.length >= 2) b(fig, el); else b(el);
    } catch (e) { console.error('ekman figure', fig.dataset.hv, e); }
  });
})();
