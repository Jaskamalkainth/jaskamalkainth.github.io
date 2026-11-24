// Playable explainer for /blog_posts/p-vs-np-explained-simply.html.
//
// Two characters: Solver (a robot who must FIND answers) and Checker (an owl who only CHECKS them).
// The shared puzzle is map 3-coloring on a fixed 10-town, 19-road map (a patch of a triangular
// lattice, so it has exactly 6 valid colorings: one pattern, with the colors permuted).
// Every figure runs the real algorithm on fixed inputs:
//   hero   - Solver brute-forces colorings in order (12,183 tries of 3^10 = 59,049), Checker then checks 19 roads
//   story  - scroll-driven tour of P, NP, NP-complete and the two possible worlds (sticky Euler diagram)
//   play   - the reader is Solver (colors the map, timed), then Checker (judges 3 maps, timed)
//   scale  - steps vs n for 3-SAT: check ~13n, n^3, 1.308^n, 2^(n/sqrt(ln n)), 2^n (illustrative constants = 1)
//   sat    - a real random 3-SAT formula; brute-force #SAT timed on the reader's device, plus the checker
//   worlds - tabs: P != NP, P = NP with a fast algorithm, P = NP with a useless one
//   news   - status tiles and a tappable timeline up to November 2026
//   walls  - the three proof barriers
// Every <figure class="hv" data-hv="..."> keeps a text fallback for agents and no-JS readers.
(function () {
  'use strict';

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const reduced = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  let uidN = 0;
  const uid = () => 'pn' + (++uidN);

  // Run `fn` when `el` first scrolls into view (or immediately without IntersectionObserver).
  function onVisible(el, fn, leave) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) fn(); else if (leave) leave(); }), { threshold: 0.35 });
    io.observe(el);
  }

  // ── the map: 10 towns, 19 roads ────────────────────────────────────────
  const TOWNS = [
    [112, 58], [202, 52], [290, 60],
    [64, 142], [158, 138], [246, 144], [338, 140],
    [108, 222], [204, 228], [292, 220],
  ];
  const ROADS = [[0, 1], [1, 2], [3, 4], [4, 5], [5, 6], [7, 8], [8, 9],
    [0, 3], [0, 4], [1, 4], [1, 5], [2, 5], [2, 6],
    [3, 7], [4, 7], [4, 8], [5, 8], [5, 9], [6, 9]];
  const N = TOWNS.length;
  const NAMES = ['Ash', 'Bay', 'Cove', 'Dell', 'Elm', 'Fen', 'Glen', 'Hill', 'Isle', 'Jade'];
  const COLOR_NAMES = ['blue circle', 'amber triangle', 'pink square'];
  const decode = (k) => { const c = []; for (let i = N - 1; i >= 0; i--) { c[i] = k % 3; k = Math.floor(k / 3); } return c; };
  const clashes = (c) => ROADS.map(([a, b]) => c[a] != null && c[a] === c[b]);
  const valid = (c) => c.every((x) => x != null) && !clashes(c).some(Boolean);
  // Brute force in order (town 0 is the most significant digit): first valid coloring.
  const BRUTE = (() => { for (let k = 0; k < 3 ** N; k++) { const c = decode(k); if (valid(c)) return { tries: k + 1, coloring: c }; } return null; })();

  function marker(cls, x, y, r) {
    if (cls === 0) return `<circle class="mk" cx="${x}" cy="${y}" r="${r * 0.38}"/>`;
    if (cls === 1) { const h = r * 0.5; return `<path class="mk" d="M${x} ${y - h}L${x + h * 1.05} ${y + h * 0.75}L${x - h * 1.05} ${y + h * 0.75}Z"/>`; }
    const h = r * 0.36; return `<rect class="mk" x="${x - h}" y="${y - h}" width="${2 * h}" height="${2 * h}" rx="1.5"/>`;
  }

  // A map component: returns {el, set(coloring), roads(stateArray), onTap}
  function MapView(opt) {
    opt = opt || {};
    const wrap = document.createElement('div');
    wrap.className = 'pn-map' + (opt.interactive ? ' interactive' : '');
    let s = `<svg viewBox="0 0 400 280" role="img" aria-label="${esc(opt.label || 'Map of 10 towns joined by 19 roads')}">`;
    ROADS.forEach(([a, b], i) => {
      s += `<line class="road" data-r="${i}" x1="${TOWNS[a][0]}" y1="${TOWNS[a][1]}" x2="${TOWNS[b][0]}" y2="${TOWNS[b][1]}"/>`;
    });
    TOWNS.forEach(([x, y], i) => {
      s += `<g class="town" data-t="${i}"${opt.interactive ? ` role="button" tabindex="0" aria-label="${NAMES[i]}: no color"` : ''}>` +
        `<circle class="tc" cx="${x}" cy="${y}" r="22"/><g class="tm"></g>` +
        `<text class="tn" x="${x}" y="${y + 37}" text-anchor="middle">${NAMES[i]}</text></g>`;
    });
    s += '</svg>';
    wrap.innerHTML = s;
    const towns = [...wrap.querySelectorAll('.town')];
    const roads = [...wrap.querySelectorAll('.road')];
    let col = Array(N).fill(null);
    function set(c, showClash) {
      col = c.slice();
      towns.forEach((g, i) => {
        g.setAttribute('class', 'town' + (col[i] == null ? ' empty' : ' c' + col[i]));
        g.querySelector('.tm').innerHTML = col[i] == null ? '' : marker(col[i], TOWNS[i][0], TOWNS[i][1], 22);
        if (opt.interactive) g.setAttribute('aria-label', `${NAMES[i]}: ${col[i] == null ? 'no color' : COLOR_NAMES[col[i]]}`);
      });
      const cl = clashes(col);
      roads.forEach((r, i) => r.classList.toggle('clash', !!showClash && cl[i]));
      return cl;
    }
    function road(i, cls, on) { roads[i].classList.toggle(cls, on); }
    function clearRoads() { roads.forEach((r) => r.classList.remove('ok', 'look', 'clash')); }
    if (opt.onTap) {
      const fire = (e) => { const g = e.target.closest('.town'); if (g) { e.preventDefault(); opt.onTap(+g.dataset.t); } };
      wrap.addEventListener('click', fire);
      wrap.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') fire(e); });
    }
    set(col);
    return { el: wrap, set, road, clearRoads, get: () => col.slice() };
  }

  // ── mascots ────────────────────────────────────────────────────────────
  function robot(mood) {
    const eye = mood === 'happy' ? '<path class="m-eye-s" d="M27 31q4-5 8 0M45 31q4-5 8 0"/>' :
      mood === 'busy' ? '<rect class="m-eye" x="27" y="27" width="8" height="5" rx="2"/><rect class="m-eye" x="45" y="27" width="8" height="5" rx="2"/>' :
        '<circle class="m-eye" cx="31" cy="30" r="4.5"/><circle class="m-eye" cx="49" cy="30" r="4.5"/>';
    const mouth = mood === 'happy' ? '<path class="m-line" d="M30 43q10 8 20 0"/>' : mood === 'busy' ? '<path class="m-line" d="M32 44h4l3-3 3 3 3-3 3 3h2"/>' : '<path class="m-line" d="M32 44h16"/>';
    return `<svg class="mascot robot ${mood || ''}" viewBox="0 0 80 80" role="img" aria-label="Solver, a robot"><line class="m-line" x1="40" y1="6" x2="40" y2="15"/><circle class="m-ant" cx="40" cy="6" r="4"/>` +
      `<rect class="m-body" x="14" y="15" width="52" height="40" rx="12"/>${eye}${mouth}` +
      '<rect class="m-body2" x="22" y="58" width="36" height="16" rx="6"/><circle class="m-ant" cx="40" cy="66" r="3"/></svg>';
  }
  function owl(mood) {
    const look = mood === 'look';
    return `<svg class="mascot owl ${mood || ''}" viewBox="0 0 80 80" role="img" aria-label="Checker, an owl">` +
      '<path class="m-body" d="M16 30q0-22 24-22t24 22v26q0 18-24 18t-24-18z"/><path class="m-body2" d="M16 14l8 9M64 14l-8 9"/>' +
      '<circle class="m-face" cx="30" cy="32" r="10"/><circle class="m-face" cx="50" cy="32" r="10"/>' +
      `<circle class="m-pupil" cx="${look ? 33 : 30}" cy="33" r="4"/><circle class="m-pupil" cx="${look ? 53 : 50}" cy="33" r="4"/>` +
      '<path class="m-beak" d="M37 42l3 6 3-6z"/><path class="m-body2" d="M28 58q12 6 24 0"/>' +
      (mood === 'happy' ? '<path class="m-ok" d="M58 62l5 5 10-12"/>' : '<circle class="m-glass" cx="64" cy="60" r="9"/><line class="m-line" x1="58" y1="66" x2="52" y2="74"/>') + '</svg>';
  }

  const builders = {};

  // ── 1. Hero: Solver brute-forces, Checker checks ───────────────────────
  builders.hero = (host) => {
    host.innerHTML =
      '<div class="hero-wrap">' +
      '<div class="pn-card solver"><div class="pn-who"><span class="pn-face"></span><div><b>Solver</b><small>has to find a coloring</small></div></div>' +
      '<div class="pn-big"><span data-k="tries">0</span><small>tries</small></div><div class="pn-bar"><i data-k="bar1"></i></div><p class="pn-say" data-k="say1">Ready…</p></div>' +
      '<div class="hero-map"></div>' +
      '<div class="pn-card checker"><div class="pn-who"><span class="pn-face"></span><div><b>Checker</b><small>only checks the answer</small></div></div>' +
      '<div class="pn-big"><span data-k="looks">0</span><small>looks</small></div><div class="pn-bar"><i data-k="bar2"></i></div><p class="pn-say" data-k="say2">Waiting for an answer…</p></div>' +
      '</div><p class="pn-rule">Rule: give every town one of three colors so that <b>no road joins two towns of the same color</b>.</p>' +
      '<div class="pn-ctl"><button type="button" class="pn-btn" data-k="replay">↻ Replay</button></div>';
    const q = (k) => host.querySelector(`[data-k="${k}"]`);
    const map = MapView({ label: 'Map of 10 towns and 19 roads being colored by Solver' });
    host.querySelector('.hero-map').appendChild(map.el);
    const faceS = host.querySelector('.solver .pn-face'), faceC = host.querySelector('.checker .pn-face');
    const total = 3 ** N, T = BRUTE.tries;
    let run = 0, playing = false;
    function finalState() {
      faceS.innerHTML = robot('happy'); faceC.innerHTML = owl('happy');
      map.set(BRUTE.coloring); map.clearRoads(); for (let i = 0; i < ROADS.length; i++) map.road(i, 'ok', true);
      q('tries').textContent = fmt(T); q('looks').textContent = ROADS.length;
      q('bar1').style.width = (100 * T / total).toFixed(1) + '%'; q('bar2').style.width = '100%';
      q('say1').innerHTML = `Found one after <b>${fmt(T)}</b> of ${fmt(total)} possible colorings.`;
      q('say2').innerHTML = `All <b>${ROADS.length}</b> roads checked. It works! ✓`;
    }
    async function play() {
      if (playing) return;
      if (reduced()) { finalState(); return; }
      playing = true;
      const id = ++run;
      faceS.innerHTML = robot('busy'); faceC.innerHTML = owl('wait');
      map.clearRoads(); q('looks').textContent = '0'; q('bar2').style.width = '0%';
      q('say2').textContent = 'Waiting for an answer…';
      q('say1').textContent = 'Trying colorings in order: 1, 2, 3, …';
      const dur = 4200, t0 = performance.now();
      await new Promise((done) => {
        function frame(now) {
          if (id !== run) return done();
          const u = Math.min(1, (now - t0) / dur);
          const k = Math.max(1, Math.round(T * (u * u * 0.7 + u * 0.3)));
          map.set(decode(k - 1), true);
          q('tries').textContent = fmt(k);
          q('bar1').style.width = (100 * k / total).toFixed(1) + '%';
          if (u < 1) requestAnimationFrame(frame); else done();
        }
        requestAnimationFrame(frame);
      });
      if (id !== run) { playing = false; return; }
      map.set(BRUTE.coloring, true);
      faceS.innerHTML = robot('happy');
      q('say1').innerHTML = `Found one after <b>${fmt(T)}</b> of ${fmt(total)} possible colorings.`;
      await sleep(700);
      faceC.innerHTML = owl('look');
      q('say2').textContent = 'Checking each road once…';
      for (let i = 0; i < ROADS.length && id === run; i++) {
        map.road(i, 'look', true); await sleep(80); map.road(i, 'look', false); map.road(i, 'ok', true);
        q('looks').textContent = i + 1; q('bar2').style.width = (100 * (i + 1) / ROADS.length) + '%';
      }
      if (id === run) { faceC.innerHTML = owl('happy'); q('say2').innerHTML = `All <b>${ROADS.length}</b> roads checked. It works! ✓`; }
      playing = false;
    }
    faceS.innerHTML = robot(); faceC.innerHTML = owl();
    map.set(Array(N).fill(null));
    q('replay').addEventListener('click', () => { run++; playing = false; setTimeout(play, 30); });
    let started = false;
    onVisible(host, () => { if (!started) { started = true; play(); } });
  };

  // ── 2. Story: P, NP, NP-complete, two worlds ───────────────────────────
  builders.story = (host, fig) => {
    const id = uid();
    host.innerHTML =
      `<div class="pn-euler" data-step="0"><svg viewBox="0 0 560 360" role="img" aria-label="Diagram: the P circle inside the NP circle, with NP-complete problems at the far edge of NP">` +
      `<defs><clipPath id="${id}np"><ellipse cx="300" cy="200" rx="250" ry="145"/></clipPath></defs>` +
      '<ellipse class="e-np" cx="300" cy="200" rx="250" ry="145"/>' +
      `<g clip-path="url(#${id}np)"><ellipse class="e-npc" cx="560" cy="200" rx="150" ry="190"/></g>` +
      '<ellipse class="e-p" cx="200" cy="210" rx="115" ry="85"/>' +
      '<text class="e-lbl l-np" x="300" y="80" text-anchor="middle">NP</text><text class="e-sub l-np" x="300" y="100" text-anchor="middle">quick to check</text>' +
      '<text class="e-lbl l-p" x="200" y="168" text-anchor="middle">P</text><text class="e-sub l-p" x="200" y="188" text-anchor="middle">quick to solve</text>' +
      '<text class="e-lbl small l-npc" x="462" y="140" text-anchor="middle">NP-complete</text>' +
      '<g class="ex ex-p"><text x="200" y="224" text-anchor="middle">sorting</text><text x="200" y="248" text-anchor="middle">shortest route</text><text x="200" y="272" text-anchor="middle">prime test</text></g>' +
      '<g class="ex ex-np"><text x="352" y="300" text-anchor="middle">factoring</text></g>' +
      '<g class="ex ex-npc"><text x="482" y="190" text-anchor="middle">SAT</text><text x="482" y="214" text-anchor="middle">map coloring</text><text x="482" y="238" text-anchor="middle">Sudoku</text><text x="482" y="262" text-anchor="middle">salesman</text></g>' +
      '<g class="red"><path class="arr" d="M310 196 C 350 176, 400 176, 432 196"/><path class="arr" d="M392 296 C 425 296, 440 288, 452 274"/><text class="e-sub" x="356" y="166" text-anchor="middle">translates into</text></g>' +
      '<g class="sub"><text class="e-sub" x="302" y="250">← P ⊆ NP (proved)</text></g>' +
      '</svg><div class="e-mascots"><span class="e-solver"></span><span class="e-checker"></span></div>' +
      '<p class="e-world" aria-live="polite"></p></div>';
    host.querySelector('.e-solver').innerHTML = robot();
    host.querySelector('.e-checker').innerHTML = owl();
    const stage = host.querySelector('.pn-euler'), world = host.querySelector('.e-world');
    const steps = [...fig.querySelectorAll('.story-steps > li')];
    let timer = null, cur = -1;
    function go(k) {
      if (k === cur) return;
      cur = k;
      steps.forEach((s, i) => s.classList.toggle('on', i === k));
      stage.dataset.step = k;
      clearInterval(timer); stage.classList.remove('merged'); world.textContent = '';
      if (k === 5) {
        let m = false;
        const show = () => { stage.classList.toggle('merged', m); world.innerHTML = m ? '<b>World 2: P = NP.</b> Every puzzle that is quick to check is quick to solve.' : '<b>World 1: P ≠ NP.</b> Some puzzles are quick to check but stay slow to solve.'; };
        show();
        if (!reduced()) timer = setInterval(() => { m = !m; show(); }, 2600);
      }
    }
    go(0);
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) go(steps.indexOf(e.target)); }), { rootMargin: '-55% 0px -30% 0px' });
    steps.forEach((s) => io.observe(s));
  };

  // ── 3. Game: be Solver, then be Checker ────────────────────────────────
  builders.play = (host) => {
    host.innerHTML =
      '<div class="game"><div class="game-side"><div class="pn-who big"><span class="pn-face"></span><div><b data-k="role">Round 1: you are Solver</b><small data-k="task">Find a coloring from scratch.</small></div></div>' +
      '<p class="game-msg" data-k="msg" aria-live="polite"></p><div class="game-btns" data-k="btns"></div>' +
      '<div class="game-score"><div><span>Solving</span><b data-k="ts">–</b></div><div><span>Checking</span><b data-k="tc">–</b></div><div><span>Gap</span><b data-k="tg">–</b></div></div></div>' +
      '<div class="game-map"></div></div>';
    const q = (k) => host.querySelector(`[data-k="${k}"]`);
    const face = host.querySelector('.pn-face');
    let phase = 'intro', t0 = 0, taps = 0, solveT = 0, checks = [], cur = null, checkT0 = 0;
    const map = MapView({ interactive: true, label: 'Game map: tap a town to change its color', onTap });
    host.querySelector('.game-map').appendChild(map.el);
    const btns = (html) => { q('btns').innerHTML = html; };
    const secs = (ms) => (ms / 1000).toFixed(1) + ' s';
    function onTap(i) {
      if (phase !== 'solve') return;
      const c = map.get();
      c[i] = c[i] == null ? 0 : (c[i] + 1) % 3;
      taps++;
      const cl = map.set(c, true);
      const n = cl.filter(Boolean).length, empty = c.filter((x) => x == null).length;
      if (valid(c)) {
        solveT = performance.now() - t0;
        phase = 'solved';
        face.innerHTML = robot('happy');
        q('ts').textContent = secs(solveT);
        q('msg').innerHTML = `🎉 Solved in <b>${secs(solveT)}</b> with ${taps} taps. Now swap jobs: someone hands you finished maps and you only check them.`;
        btns('<button type="button" class="pn-btn primary" data-a="r2">Round 2: be Checker →</button>');
      } else {
        q('msg').innerHTML = empty ? `${empty} town${empty > 1 ? 's' : ''} still blank.` + (n ? ` <span class="bad">${n} red road${n > 1 ? 's' : ''}</span> join matching colors.` : '') :
          `<span class="bad">${n} red road${n > 1 ? 's' : ''}</span> join matching colors. Keep going!`;
      }
    }
    function intro() {
      phase = 'intro'; taps = 0; checks = [];
      face.innerHTML = robot();
      q('role').textContent = 'Round 1: you are Solver'; q('task').textContent = 'Find a coloring from scratch.';
      q('ts').textContent = q('tc').textContent = q('tg').textContent = '–';
      map.set(Array(N).fill(null)); map.clearRoads();
      q('msg').innerHTML = 'Tap a town to cycle its color (blue ● → amber ▲ → pink ■). Give all 10 towns a color so that <b>no road joins two matching towns</b>. The clock starts when you press Start.';
      btns('<button type="button" class="pn-btn primary" data-a="go">▶ Start round 1</button>');
    }
    function startSolve() {
      phase = 'solve'; t0 = performance.now(); face.innerHTML = robot('busy');
      q('msg').textContent = 'Go! Red roads mean a clash.';
      btns('<button type="button" class="pn-btn" data-a="give">Give up (show an answer)</button>');
    }
    function nextCheck() {
      phase = 'check';
      face.innerHTML = owl('look');
      q('role').textContent = 'Round 2: you are Checker'; q('task').textContent = 'Is this coloring correct?';
      const perm = [[0, 1, 2], [1, 2, 0], [2, 0, 1], [0, 2, 1], [2, 1, 0], [1, 0, 2]][Math.floor(Math.random() * 6)];
      const c = BRUTE.coloring.map((x) => perm[x]);
      const bad = checks.length === 2 ? !checks.some((x) => x.bad) || Math.random() < 0.5 : Math.random() < 0.5;
      if (bad) { const t = Math.floor(Math.random() * N); c[t] = (c[t] + 1 + Math.floor(Math.random() * 2)) % 3; }
      cur = { c, bad };
      map.set(c, false); map.clearRoads();
      q('msg').innerHTML = `Map ${checks.length + 1} of 3. Look along the roads: is any road joining two matching towns?`;
      btns('<button type="button" class="pn-btn primary" data-a="yes">✓ It works</button><button type="button" class="pn-btn" data-a="no">✗ There\'s a clash</button>');
      checkT0 = performance.now();
    }
    async function answer(saysOk) {
      if (phase !== 'check') return;
      phase = 'judging';
      const dt = performance.now() - checkT0, right = saysOk !== cur.bad;
      checks.push({ dt, right, bad: cur.bad });
      map.set(cur.c, true);
      if (!cur.bad) for (let i = 0; i < ROADS.length; i++) map.road(i, 'ok', true);
      q('msg').innerHTML = (right ? '✅ Right! ' : '❌ Not quite. ') + (cur.bad ? 'The red road joins two matching towns.' : 'Every road joins two different colors.') + ` (${secs(dt)})`;
      btns('');
      await sleep(1500);
      if (checks.length < 3) return nextCheck();
      const avg = checks.reduce((a, x) => a + x.dt, 0) / checks.length, ok = checks.filter((x) => x.right).length;
      face.innerHTML = owl('happy');
      q('tc').textContent = secs(avg);
      const ratio = solveT / avg;
      q('tg').textContent = !solveT ? '–' : ratio >= 1 ? ratio.toFixed(1) + '× faster' : 'checking slower';
      q('msg').innerHTML = (solveT ? `Solving took you <b>${secs(solveT)}</b>; checking took <b>${secs(avg)}</b> per map (${ok} of 3 right). ` : `Checking took <b>${secs(avg)}</b> per map (${ok} of 3 right). `) +
        `A computer checks a map in ${ROADS.length} looks, but brute-force solving took ${fmt(BRUTE.tries)} tries. With 100 towns, checking is still easy, while brute force faces 3<sup>100</sup> colorings.`;
      btns('<button type="button" class="pn-btn" data-a="again">↻ Play again</button>');
    }
    host.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]');
      if (!b) return;
      const a = b.dataset.a;
      if (a === 'go') startSolve();
      else if (a === 'give') { phase = 'solved'; solveT = 0; map.set(BRUTE.coloring, true); q('ts').textContent = 'gave up'; q('msg').textContent = 'Here is one answer. Now be Checker.'; btns('<button type="button" class="pn-btn primary" data-a="r2">Round 2: be Checker →</button>'); }
      else if (a === 'r2') nextCheck();
      else if (a === 'yes') answer(true);
      else if (a === 'no') answer(false);
      else if (a === 'again') intro();
    });
    intro();
  };

  // ── time formatting (seconds → words) ──────────────────────────────────
  const AGE_UNIVERSE_S = 13.8e9 * 3.15576e7;
  function human(log10s) {
    // log10 of seconds
    const s = Math.pow(10, log10s);
    if (log10s < -6) return (s * 1e9).toPrecision(2) + ' ns';
    if (log10s < -3) return (s * 1e6).toPrecision(2) + ' µs';
    if (log10s < 0) return (s * 1e3).toPrecision(2) + ' ms';
    if (s < 60) return s.toPrecision(2) + ' s';
    if (s < 3600) return (s / 60).toPrecision(2) + ' minutes';
    if (s < 86400) return (s / 3600).toPrecision(2) + ' hours';
    if (s < 3.15576e7) return (s / 86400).toPrecision(2) + ' days';
    const ly = log10s - Math.log10(3.15576e7);
    const words = [[12, 'trillion'], [9, 'billion'], [6, 'million'], [3, 'thousand']];
    if (ly < 3) return Math.pow(10, ly).toPrecision(2) + ' years';
    for (const [e, w] of words) if (ly >= e && ly < e + 3) return Math.pow(10, ly - e).toPrecision(2) + ' ' + w + ' years';
    return '10^' + Math.floor(ly) + ' years';
  }
  const sup = (s) => s.replace(/10\^(\d+)/g, '10<sup>$1</sup>');

  // ── 4. Scale: polynomial vs exponential ────────────────────────────────
  builders.scale = (host) => {
    const L10_2 = Math.log10(2);
    const SERIES = [
      { k: 'brute', name: 'Brute force, 2ⁿ', f: (n) => n * L10_2 },
      { k: 'claim', name: 'Claimed in 2026, 2^(n/√ln n)', f: (n) => (n / Math.sqrt(Math.log(n))) * L10_2 },
      { k: 'best', name: 'Best known before 2026, 1.308ⁿ', f: (n) => n * Math.log10(1.308) },
      { k: 'cube', name: 'If P = NP: n³ (hypothetical)', f: (n) => 3 * Math.log10(n) },
      { k: 'check', name: 'Checking one answer, ≈13n', f: (n) => Math.log10(3 * Math.round(4.26 * n)) },
    ];
    const X0 = 10, X1 = 1000, YMAX = 125, UNI = Math.log10(AGE_UNIVERSE_S * 1e9);
    const W = 640, H = 330, P = { l: 52, r: 16, t: 14, b: 40 };
    const xs = (n) => P.l + ((n - X0) / (X1 - X0)) * (W - P.l - P.r);
    const ys = (v) => H - P.b - (Math.min(v, YMAX) / YMAX) * (H - P.t - P.b);
    let g = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Chart: steps to solve 3-SAT versus number of variables n, log scale, for five methods">`;
    for (let v = 0; v <= YMAX; v += 25) g += `<line class="grid" x1="${P.l}" x2="${W - P.r}" y1="${ys(v)}" y2="${ys(v)}"/><text class="tick" x="${P.l - 8}" y="${ys(v) + 4}" text-anchor="end">${v ? `10<tspan class="sup" dy="-6">${v}</tspan>` : '1'}</text>`;
    for (let n = 0; n <= 1000; n += 200) { const x = xs(Math.max(n, X0)); g += `<text class="tick" x="${x}" y="${H - P.b + 18}" text-anchor="middle">${n || 10}</text>`; }
    g += `<text class="tick" x="${(P.l + W - P.r) / 2}" y="${H - 4}" text-anchor="middle">n (number of variables)</text>`;
    g += `<line class="uni" x1="${P.l}" x2="${W - P.r}" y1="${ys(UNI)}" y2="${ys(UNI)}"/><text class="uni-t" x="${W - P.r - 4}" y="${ys(UNI) - 6}" text-anchor="end">age of the universe at 10⁹ steps/s</text>`;
    SERIES.forEach((s) => {
      let d = '';
      for (let n = X0; n <= X1; n += 2) { const v = s.f(n); if (v > YMAX + 2) break; d += (d ? 'L' : 'M') + xs(n).toFixed(1) + ' ' + ys(v).toFixed(1); }
      g += `<path class="ln ${s.k}" d="${d}"/>`;
    });
    g += `<text class="lbl brute" x="${xs(330)}" y="${ys(110)}">2ⁿ</text><text class="lbl best" x="${xs(880)}" y="${ys(108)}" text-anchor="end">1.308ⁿ</text><text class="lbl claim" x="${xs(990)}" y="${ys(96)}" text-anchor="end">2^(n/√ln n)</text>` +
      `<text class="lbl cube" x="${xs(990)}" y="${ys(9) - 6}" text-anchor="end">n³ and ≈13n</text>`;
    g += `<line class="cur" y1="${P.t}" y2="${H - P.b}"/><g class="dots"></g><rect class="hit" x="${P.l}" y="${P.t}" width="${W - P.l - P.r}" height="${H - P.t - P.b}"/></svg>`;
    host.innerHTML = `<div class="sc-ctl"><label for="sc-n">Variables <b>n = <span data-k="n">100</span></b></label><input id="sc-n" type="range" min="10" max="1000" step="10" value="100"></div>` +
      `<div class="sc-chart">${g}</div><div class="sc-tiles"></div><p class="sc-note">At 1 billion steps per second. Illustrative: constants and polynomial factors set to 1.</p>`;
    const svg = host.querySelector('svg'), inp = host.querySelector('input'), tiles = host.querySelector('.sc-tiles');
    function draw(n) {
      host.querySelector('[data-k="n"]').textContent = n;
      const x = xs(n);
      svg.querySelector('.cur').setAttribute('x1', x); svg.querySelector('.cur').setAttribute('x2', x);
      svg.querySelector('.dots').innerHTML = SERIES.map((s) => { const v = s.f(n); return v <= YMAX ? `<circle class="dot ${s.k}" cx="${x}" cy="${ys(v)}" r="4.5"/>` : ''; }).join('');
      tiles.innerHTML = SERIES.slice().reverse().map((s) => {
        const v = s.f(n), sec = v - 9;
        const uni = sec - Math.log10(AGE_UNIVERSE_S);
        const extra = uni > 0.5 ? `<em>${uni < 6 ? fmt(Math.pow(10, uni)) + '×' : sup('10^' + Math.floor(uni)) + '×'} the age of the universe</em>` : '';
        return `<div class="sc-tile ${s.k}"><span class="sw"></span><span class="nm">${s.name}</span><b>${sup(human(sec))}</b>${extra}</div>`;
      }).join('');
    }
    inp.addEventListener('input', () => draw(+inp.value));
    svg.querySelector('.hit').addEventListener('pointermove', (e) => {
      const r = svg.getBoundingClientRect(), px = ((e.clientX - r.left) / r.width) * W;
      const n = Math.round((X0 + ((px - P.l) / (W - P.l - P.r)) * (X1 - X0)) / 10) * 10;
      const nn = Math.max(10, Math.min(1000, n)); inp.value = nn; draw(nn);
    });
    draw(100);
  };

  // ── 5. A real 3-SAT formula, brute-forced on your device ───────────────
  function mulberry(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function formula(n) {
    const r = mulberry(1000 + n), m = Math.round(4.26 * n), cl = [];
    for (let i = 0; i < m; i++) {
      const vs = [];
      while (vs.length < 3) { const v = Math.floor(r() * n); if (!vs.includes(v)) vs.push(v); }
      cl.push(vs.map((v) => [v, r() < 0.5 ? 1 : 0]));
    }
    return cl;
  }
  function compile(cl) {
    const m = cl.length, V = new Int32Array(m * 3), S = new Int32Array(m * 3);
    cl.forEach((c, i) => c.forEach(([v, neg], j) => { V[i * 3 + j] = v; S[i * 3 + j] = neg; }));
    return { m, V, S };
  }
  function checkOne(F, a) {
    const { m, V, S } = F;
    for (let i = 0; i < m; i++) {
      const k = i * 3;
      if (((a >> V[k]) & 1) === S[k] && ((a >> V[k + 1]) & 1) === S[k + 1] && ((a >> V[k + 2]) & 1) === S[k + 2]) return false;
    }
    return true;
  }
  function bruteSync(F, n) { let c = 0; const total = 2 ** n; for (let a = 0; a < total; a++) if (checkOne(F, a)) c++; return c; }
  async function countAll(F, n, onProgress, isCancelled) {
    const total = 2 ** n, CH = 1 << 15;
    let count = 0, first = -1, ms = 0;
    for (let s = 0; s < total; s += CH) {
      const t0 = performance.now(), e = Math.min(total, s + CH);
      for (let a = s; a < e; a++) if (checkOne(F, a)) { count++; if (first < 0) first = a; }
      ms += performance.now() - t0;
      if (onProgress) onProgress(e, total);
      if (isCancelled && isCancelled()) return null;
      if (e < total && (s / CH) % 8 === 7) await sleep(0);
    }
    return { count, first, ms };
  }
  builders.sat = (host) => {
    host.innerHTML =
      '<div class="sat-ctl"><label for="sat-n">Variables <b>n = <span data-k="n">18</span></b></label><input id="sat-n" type="range" min="10" max="24" step="1" value="18">' +
      '<button type="button" class="pn-btn primary" data-a="run">▶ Count every solution</button><button type="button" class="pn-btn" data-a="sweep">⏱ Run n = 10 → 24</button></div>' +
      '<pre class="sat-f" data-k="f"></pre>' +
      '<div class="sat-two"><div class="pn-card solver"><div class="pn-who"><span class="pn-face"></span><div><b>Solver</b><small>tries all 2<sup>n</sup> assignments</small></div></div><div class="pn-bar"><i data-k="bar"></i></div><p data-k="s"></p></div>' +
      '<div class="pn-card checker"><div class="pn-who"><span class="pn-face"></span><div><b>Checker</b><small>reads each clause once</small></div></div><p data-k="c"></p></div></div>' +
      '<div class="sat-chart" data-k="chart" hidden></div>';
    const q = (k) => host.querySelector(`[data-k="${k}"]`);
    host.querySelector('.solver .pn-face').innerHTML = robot();
    host.querySelector('.checker .pn-face').innerHTML = owl();
    const inp = host.querySelector('input');
    let job = 0;
    const lit = ([v, neg]) => (neg ? '¬' : '') + 'x' + (v + 1);
    function show(n) {
      q('n').textContent = n;
      const cl = formula(n);
      q('f').textContent = `${cl.length} clauses, ${n} variables:\n` + cl.slice(0, 4).map((c) => '(' + c.map(lit).join(' ∨ ') + ')').join(' ∧ ') + ` ∧ … ∧ (${cl[cl.length - 1].map(lit).join(' ∨ ')})`;
      q('s').innerHTML = `Press <b>Count every solution</b>: ${fmt(2 ** n)} assignments to try.`;
      q('c').textContent = 'Waiting for a solution to check.';
      q('bar').style.width = '0%';
      return cl;
    }
    async function runOne(n, quiet) {
      const id = ++job, cl = formula(n), F = compile(cl);
      host.querySelector('.solver .pn-face').innerHTML = robot('busy');
      const res = await countAll(F, n, (d, t) => { if (!quiet) { q('bar').style.width = (100 * d / t).toFixed(1) + '%'; q('s').innerHTML = `Tried ${fmt(d)} of ${fmt(t)}…`; } }, () => id !== job);
      if (!res) return null;
      host.querySelector('.solver .pn-face').innerHTML = robot('happy');
      q('bar').style.width = '100%';
      q('s').innerHTML = `Tried all <b>${fmt(2 ** n)}</b> assignments in <b>${res.ms < 10 ? res.ms.toFixed(1) : fmt(res.ms)} ms</b>. ${res.count ? `<b>${fmt(res.count)}</b> make the formula true.` : 'None make it true.'}`;
      if (res.first >= 0) {
        const reps = 20000, t0 = performance.now(); let ok = true;
        for (let i = 0; i < reps; i++) ok = checkOne(F, res.first) && ok;
        const per = (performance.now() - t0) / reps;
        host.querySelector('.checker .pn-face').innerHTML = owl('happy');
        q('c').innerHTML = `Checked one solution by reading all <b>${cl.length}</b> clauses: ${ok ? 'correct ✓' : 'wrong ✗'} in about <b>${per < 0.001 ? '<0.001' : per.toFixed(4)} ms</b>.`;
      } else {
        host.querySelector('.checker .pn-face').innerHTML = owl();
        q('c').innerHTML = 'No solution exists, so there is nothing short to hand Checker. Proving a "no" is a different, harder question (co-NP).';
      }
      return res;
    }
    inp.addEventListener('input', () => { job++; show(+inp.value); });
    host.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-a]');
      if (!b) return;
      if (b.dataset.a === 'run') { await runOne(+inp.value); return; }
      // sweep 10..24, chart measured times
      const chart = q('chart'); chart.hidden = false;
      const pts = [];
      for (let n = 10; n <= 24; n++) {
        inp.value = n; show(n);
        const r = await runOne(n);
        if (!r) return;
        // small n finish in microseconds, below the browser's timer resolution: time k back-to-back runs together
        let per = r.ms;
        if (n <= 20) {
          const F = compile(formula(n));
          for (let k = 1; k <= 1 << 16; k *= 2) {
            const t0 = performance.now();
            for (let j = 0; j < k; j++) bruteSync(F, n);
            const dt = performance.now() - t0;
            if (dt >= 25) { per = dt / k; break; }
          }
          await sleep(0);
        }
        pts.push([n, Math.max(per, 0.0001)]);
        drawChart(chart, pts);
      }
    });
    function drawChart(el, pts) {
      const W = 600, H = 220, P = { l: 78, r: 12, t: 12, b: 34 };
      const lo = Math.min(-2, Math.floor(Math.log10(Math.min(...pts.map((p) => p[1]))))), hi = Math.max(1, Math.ceil(Math.log10(Math.max(...pts.map((p) => p[1])))));
      const xs = (n) => P.l + ((n - 10) / 14) * (W - P.l - P.r), ys = (ms) => H - P.b - ((Math.log10(ms) - lo) / (hi - lo)) * (H - P.t - P.b);
      let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Measured chart: brute-force time on this device versus n, log scale">`;
      for (let e = lo; e <= hi; e++) s += `<line class="grid" x1="${P.l}" x2="${W - P.r}" y1="${ys(10 ** e)}" y2="${ys(10 ** e)}"/><text class="tick" x="${P.l - 6}" y="${ys(10 ** e) + 4}" text-anchor="end">${10 ** e >= 1 ? fmt(10 ** e) : 10 ** e} ms</text>`;
      for (let n = 10; n <= 24; n += 2) s += `<text class="tick" x="${xs(n)}" y="${H - P.b + 18}" text-anchor="middle">${n}</text>`;
      s += `<text class="tick" x="${(P.l + W - P.r) / 2}" y="${H - 3}" text-anchor="middle">n (variables)</text>`;
      s += `<path class="ln brute" d="${pts.map((p, i) => (i ? 'L' : 'M') + xs(p[0]).toFixed(1) + ' ' + ys(p[1]).toFixed(1)).join('')}"/>`;
      s += pts.map((p) => `<circle class="dot brute" cx="${xs(p[0])}" cy="${ys(p[1])}" r="4"><title>n = ${p[0]}: ${p[1].toFixed(1)} ms</title></circle>`).join('') + '</svg>';
      let note = '';
      if (pts.length >= 6) {
        const a = pts[pts.length - 1], b = pts[pts.length - 4];
        const perVar = Math.pow(a[1] / b[1], 1 / (a[0] - b[0]));
        const log100 = Math.log10(a[1] / 1000) + (100 - a[0]) * Math.log10(2);
        note = `<p class="sat-note">On this device each extra variable multiplied the time by about <b>${perVar.toFixed(2)}×</b>; the work itself exactly doubles. Doubling from your n = ${a[0]} time, n = 100 would take about <b>${sup(human(log100))}</b>.</p>`;
      }
      el.innerHTML = s + note;
    }
    show(18);
  };

  // ── 6. Worlds: what each answer would change ───────────────────────────
  builders.worlds = (host) => {
    const W = [
      { k: 'neq', tab: 'P ≠ NP', sub: 'What about 88% of polled researchers expect', cards: [
        ['🏠', 'Daily life: no change', 'Engineers already assume NP-complete problems are hard.', 0],
        ['🔐', 'Encryption: a foundation, not a guarantee', 'Necessary for secure crypto, but codes still need their own proofs of average-case hardness.', 0],
        ['🧩', 'Hard stays hard, in the worst case', 'Some inputs will always need super-polynomial time, whatever the algorithm.', 1],
        ['🛠️', 'Heuristics keep working', 'SAT solvers and approximations still crack most real-world cases.', 0],
      ] },
      { k: 'fast', tab: 'P = NP, fast', sub: 'With a practical algorithm, say n³', cards: [
        ['🔓', 'Most cryptography breaks', 'RSA, elliptic curves, AES key search and the signatures behind Bitcoin all fall.', 2],
        ['🚚', 'Perfect schedules and routes', 'Airlines, delivery fleets, factories and chip layouts get exact best answers.', 2],
        ['📜', 'Proofs on demand', 'Finding a proof becomes as easy as checking one: Gödel’s 1956 dream.', 2],
        ['🤖', 'Learning gets easy', 'Finding the simplest model that fits the data becomes efficient.', 2],
      ] },
      { k: 'slow', tab: 'P = NP, useless', sub: 'An n¹⁰⁰ algorithm, or one nobody can write down', cards: [
        ['🌋', 'A mathematical earthquake', 'Textbooks change; decades of beliefs turn out wrong.', 1],
        ['🐌', 'n¹⁰⁰ is hopeless', 'Polynomial on paper, but slower than brute force for any real input.', 0],
        ['🔐', 'Encryption survives in practice', 'If nobody can run the algorithm, keys stay safe for now.', 0],
        ['🏃', 'A race begins', 'Everyone hunts for a faster version of the algorithm.', 1],
      ] },
    ];
    const tag = ['Little change', 'Some change', 'Huge change'];
    host.innerHTML = '<div class="wd-tabs" role="tablist" aria-label="Possible worlds">' +
      W.map((w, i) => `<button type="button" role="tab" class="wd-tab ${w.k}" data-i="${i}" aria-selected="${i === 0}">${w.tab}</button>`).join('') +
      '</div><div class="wd-panel" role="tabpanel" aria-live="polite"></div>';
    const panel = host.querySelector('.wd-panel');
    function show(i) {
      host.querySelectorAll('.wd-tab').forEach((t, j) => t.setAttribute('aria-selected', String(i === j)));
      const w = W[i];
      panel.innerHTML = `<p class="wd-sub">${w.sub}</p><div class="wd-grid">` + w.cards.map(([ico, t, d, lvl]) =>
        `<div class="wd-card l${lvl}"><div class="ico" aria-hidden="true">${ico}</div><span class="wd-tag">${tag[lvl]}</span><h4>${t}</h4><p>${d}</p></div>`).join('') + '</div>';
    }
    host.querySelector('.wd-tabs').addEventListener('click', (e) => { const t = e.target.closest('.wd-tab'); if (t) show(+t.dataset.i); });
    show(0);
  };

  // ── 7. News: tiles + timeline ──────────────────────────────────────────
  builders.news = (host) => {
    const tiles = [['Unsolved', 'as of 24 Nov 2026'], ['$1,000,000', 'Clay Millennium Prize'], ['55 years', 'since Cook’s 1971 paper'], ['88%', 'of 124 researchers polled in 2019 bet P ≠ NP']];
    const ev = [
      ['1956', 'result', 'Gödel’s letter', 'Kurt Gödel asks John von Neumann how fast a machine could find proofs, the P vs NP question in all but name.'],
      ['1971', 'result', 'SAT is NP-complete', 'Stephen Cook proves it; Leonid Levin finds the same result independently. The question gets its modern form.'],
      ['1972', 'result', 'Karp’s 21 problems', 'Richard Karp shows 21 classic problems, including graph coloring and the traveling salesman decision problem, are NP-complete.'],
      ['1975', 'barrier', 'Relativization', 'Baker, Gill and Solovay: oracle worlds exist where P = NP and where P ≠ NP, ruling out a whole family of proofs.'],
      ['1994', 'barrier', 'Natural proofs', 'Razborov and Rudich: most known circuit lower-bound techniques can’t prove P ≠ NP if strong pseudorandom functions exist.'],
      ['2000', 'result', 'Millennium Prize', 'The Clay Mathematics Institute offers $1 million for a solution.'],
      ['2001', 'result', 'Exponential Time Hypothesis', 'Impagliazzo and Paturi propose that 3-SAT needs 2^Ω(n) time, a stronger guess than P ≠ NP.'],
      ['2008', 'barrier', 'Algebrization', 'Aaronson and Wigderson show oracle-plus-algebra techniques can’t settle it either.'],
      ['2010', 'claim', 'Deolalikar’s claimed proof', 'A claimed proof of P ≠ NP goes viral; experts find serious gaps within weeks.'],
      ['2019', 'result', '88% bet on P ≠ NP', 'William Gasarch’s third poll: 88% of 124 respondents, up from 61% in 2002.'],
      ['2025', 'result', 'Time in √t space', 'Ryan Williams shows any time-t computation fits in about √(t log t) memory (STOC 2025). Peer reviewed.'],
      ['Oct 2026', 'claim', 'AI claims: ETH is false', 'OpenAI and Anthropic post AI-written papers claiming 3-SAT in about 2^(n/√log n) time. If correct, ETH falls; P vs NP does not. Not peer reviewed.'],
      ['Nov 2026', 'claim', 'AI claim: VP ≠ VNP', 'Anthropic posts a claimed AI-written proof of the algebraic cousin of P ≠ NP, with Lean code. No human has checked it; it does not settle P vs NP.'],
    ];
    const tagName = { result: 'result', barrier: 'barrier', claim: 'claim' };
    host.innerHTML = '<div class="nw-tiles">' + tiles.map(([b, s]) => `<div class="nw-tile"><b>${b}</b><span>${s}</span></div>`).join('') + '</div>' +
      '<ol class="nw-line">' + ev.map(([y, t, h, d], i) => `<li class="${t}${y.includes('2026') ? ' new' : ''}"><button type="button" aria-expanded="${i === ev.length - 2}" data-i="${i}"><span class="yr">${y}</span><span class="hd">${h}</span><span class="tg">${y.includes('2026') ? 'claim · unverified' : tagName[t]}</span></button><p ${i === ev.length - 2 ? '' : 'hidden'}>${esc(d)}</p></li>`).join('') + '</ol>';
    host.querySelector('.nw-line').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const p = b.nextElementSibling, open = b.getAttribute('aria-expanded') === 'true';
      b.setAttribute('aria-expanded', String(!open)); p.hidden = open;
    });
  };

  // ── 8. Walls: the proof barriers ───────────────────────────────────────
  builders.walls = (host) => {
    const W = [
      ['1975', 'Relativization', 'Baker, Gill, Solovay', 'Give computers a magic “oracle” and you can build one world where P = NP and another where P ≠ NP. Any argument that works the same in every such world, like the diagonalization behind the halting problem, can’t decide the question.'],
      ['1994', 'Natural proofs', 'Razborov, Rudich', 'If strong pseudorandom functions exist (cryptographers believe they do), then “natural” arguments that a function needs big circuits can’t prove P ≠ NP. Most circuit lower bounds known in 1994 were natural.'],
      ['2008', 'Algebrization', 'Aaronson, Wigderson', 'Techniques that mix oracles with algebra got around relativization elsewhere, but they hit a similar wall for P vs NP.'],
    ];
    host.innerHTML = '<div class="wl-row"><div class="wl-start">' + robot('busy') + '<span>a proof idea</span></div>' +
      W.map(([y, t], i) => `<button type="button" class="wl-wall" data-i="${i}" aria-pressed="${i === 0}"><span class="yr">${y}</span><b>${t}</b></button>`).join('') +
      '<div class="wl-end">P ≠ NP<br><small>(or P = NP)</small></div></div><div class="wl-detail" aria-live="polite"></div>';
    const det = host.querySelector('.wl-detail');
    function show(i) {
      host.querySelectorAll('.wl-wall').forEach((b, j) => b.setAttribute('aria-pressed', String(i === j)));
      det.innerHTML = `<h4>${W[i][1]} <small>${W[i][0]} · ${W[i][2]}</small></h4><p>${W[i][3]}</p>`;
    }
    host.querySelector('.wl-row').addEventListener('click', (e) => { const b = e.target.closest('.wl-wall'); if (b) show(+b.dataset.i); });
    show(0);
  };

  document.querySelectorAll('figure.hv[data-hv]').forEach((fig) => {
    const build = builders[fig.dataset.hv];
    const host = fig.querySelector('.hv-canvas');
    if (!build || !host) return;
    try { build(host, fig); fig.classList.add('ready'); } catch (e) { console.error('pnp figure', fig.dataset.hv, e); }
  });
})();
