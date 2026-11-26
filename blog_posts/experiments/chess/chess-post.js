// Playable chess guide for /blog_posts/chess-openings-middlegame-endgame-guide.html.
//
// One engine (chess-engine.js: full legal move generation, SAN, checkmate, perft, an exact KPK table)
// drives every board; all content lives in chess-data.js and every move list is replayed through
// the engine, so an illegal move would throw instead of drawing a wrong board.
//   hero      - the Opera Game (Morphy, 1858) autoplays with a lesson per move and a "pieces in play" meter
//   daily     - today's card: a puzzle, a principle and a fact, chosen by the date
//   openings  - 13 openings: step through the main line, read the plans, then train it from memory
//   traps     - four opening traps, replayed
//   mobility  - pick a piece, see how many squares it controls from every square (computed)
//   tactics   - seven tactics puzzles; you play the move, the engine checks it
//   plans     - six middlegame plans on annotated boards
//   endgames  - Lucena, Philidor, opposition, queen mate and rook mate, replayed
//   kpk       - play king + pawn vs king against a perfect defender (exact retrograde table)
//   routine   - the five-step thinking routine before every move
//   facts     - headline numbers, plus a live count of possible games after 1-5 plies (perft)
// Every <figure class="hv" data-hv="..."> keeps a text fallback for agents and no-JS readers.
(function () {
  'use strict';
  const Chess = window.Chess, D = window.ChessData;
  if (!Chess || !D) return;
  const { Position, sqName, sqIndex } = Chess;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const reduced = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  const store = {
    get(k, d) { try { const v = localStorage.getItem('chessguide:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('chessguide:' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };
  function onVisible(el, fn) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.disconnect(); fn(); } }), { threshold: 0.3 });
    io.observe(el);
  }
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const NAMES = { P: 'pawn', N: 'knight', B: 'bishop', R: 'rook', Q: 'queen', K: 'king' };

  // ── piece artwork (drawn for this page; one <symbol> per piece) ─────────
  const SHAPES = {
    P: '<path class="pf" d="M22.5 9a5 5 0 0 0-3.4 8.7C16.4 19.4 15 22 15 25h3.6L16.5 33h12l-2.1-8H30c0-3-1.4-5.6-4.1-7.3A5 5 0 0 0 22.5 9z"/><path class="pf" d="M12.5 37.5h20v-4.5h-20z"/>',
    R: '<path class="pf" d="M12 37.5h21V33H12z"/><path class="pf" d="M14.5 33h16l-1.6-4H16.1z"/><path class="pf" d="M16.5 29h12V18.5h-12z"/><path class="pf" d="M14 18.5h17V11h-3.6v2.6h-3V11h-3.8v2.6h-3V11H14z"/><path class="pl" d="M16.5 21.5h12"/>',
    N: '<path class="pf" d="M14 37.5h19V33H14z"/><path class="pf" d="M16 33h15c0-6.5-.8-14-4.6-19.4L25.5 8l-3.2 3.3C17.6 12.5 13.7 16.6 11.6 21.4l1.6 3.1 3.2.2 4.2-3.2C19.6 26 16.3 28.6 16 33z"/><circle class="pe" cx="21" cy="15.6" r="1.4"/><path class="pl" d="M27.5 16c1.6 4.2 2.2 9.5 2.1 15"/>',
    B: '<path class="pf" d="M12 37.5h21V33H12z"/><path class="pf" d="M16.5 33h12l-1.2-3.4h-9.6z"/><path class="pf" d="M22.5 10.4c-5.2 4.1-7.6 8.8-7.6 12.6 0 3.6 2.8 6 7.6 6.6 4.8-.6 7.6-3 7.6-6.6 0-3.8-2.4-8.5-7.6-12.6z"/><circle class="pf" cx="22.5" cy="8.4" r="2.3"/><path class="pl" d="M25 15.2l-4.6 5.6"/>',
    Q: '<path class="pf" d="M12 37.5h21V33H12z"/><path class="pf" d="M14 33h17l-1-3.6H15z"/><path class="pf" d="M15 29.4h15L34.2 15.6 28 23.2 25.6 12.6 22.5 22.4 19.4 12.6 17 23.2 10.8 15.6z"/><circle class="pf" cx="10.8" cy="14.6" r="2.1"/><circle class="pf" cx="19.4" cy="11.6" r="2.1"/><circle class="pf" cx="25.6" cy="11.6" r="2.1"/><circle class="pf" cx="34.2" cy="14.6" r="2.1"/>',
    K: '<path class="pf" d="M12 37.5h21V33H12z"/><path class="pf" d="M14 33h17l-.8-3.4H14.8z"/><path class="pf" d="M14.8 29.6h15.4c2.6-4.4 2.6-9.6-1.2-11.2-3.2-1.3-5.8.6-6.5 3.6-.7-3-3.3-4.9-6.5-3.6-3.8 1.6-3.8 6.8-1.2 11.2z"/><path class="pl" d="M22.5 5.5v11.5M18.8 9.2h7.4"/>',
  };
  function ensureDefs() {
    if (document.getElementById('cp-defs')) return;
    let s = '<svg id="cp-defs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>';
    for (const t in SHAPES) {
      s += `<symbol id="cp-w${t}" viewBox="0 0 45 45"><g class="cp-white">${SHAPES[t]}</g></symbol>`;
      s += `<symbol id="cp-b${t}" viewBox="0 0 45 45"><g class="cp-black">${SHAPES[t]}</g></symbol>`;
    }
    document.body.appendChild(h('div', null, s + '</defs></svg>').firstChild);
  }

  // ── the board ──────────────────────────────────────────────────────────
  const S = 45;
  function Board(opt) {
    opt = opt || {};
    ensureDefs();
    const wrap = h('div', 'cb' + (opt.small ? ' small' : ''));
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 360 360');
    svg.setAttribute('role', 'img');
    const layers = {};
    ['sq', 'hl', 'coords', 'arrows', 'pcs', 'dots'].forEach((k) => { const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'cb-' + k); svg.appendChild(g); layers[k] = g; });
    wrap.appendChild(svg);
    let flip = !!opt.flip, pos = null;
    const xy = (s) => { const f = s & 7, r = s >> 3; return [(flip ? 7 - f : f) * S, (flip ? r : 7 - r) * S]; };
    function drawSquares() {
      let q = '', c = '';
      for (let s = 0; s < 64; s++) {
        const [x, y] = xy(s), light = ((s & 7) + (s >> 3)) % 2 === 1;
        q += `<rect x="${x}" y="${y}" width="${S}" height="${S}" class="${light ? 'lt' : 'dk'}"/>`;
      }
      if (!opt.small) for (let i = 0; i < 8; i++) {
        const file = flip ? 7 - i : i, rank = flip ? i + 1 : 8 - i;
        c += `<text x="${i * S + S - 3}" y="357" text-anchor="end" class="${(i + (flip ? 0 : 1)) % 2 ? 'on-lt' : 'on-dk'}">${'abcdefgh'[file]}</text>`;
        c += `<text x="3" y="${i * S + 11}" class="${(i + 1) % 2 ? 'on-dk' : 'on-lt'}">${rank}</text>`;
      }
      layers.sq.innerHTML = q; layers.coords.innerHTML = c;
    }
    function label(p) {
      const list = (col) => p.board.map((x, s) => (x && (col === 'w' ? x === x.toUpperCase() : x === x.toLowerCase()) ? NAMES[x.toUpperCase()] + ' ' + sqName(s) : null)).filter(Boolean).join(', ');
      return `Chess board. White: ${list('w')}. Black: ${list('b')}. ${p.turn === 'w' ? 'White' : 'Black'} to move.`;
    }
    function set(fen, o) {
      o = o || {};
      pos = new Position(fen);
      svg.setAttribute('aria-label', opt.label || label(pos));
      // highlights: last move, check, marks, selection
      let hl = '';
      const sqr = (s, cls) => { const [x, y] = xy(s); return `<rect x="${x}" y="${y}" width="${S}" height="${S}" class="${cls}"/>`; };
      if (o.last) o.last.forEach((s) => { hl += sqr(s, 'last'); });
      (o.marks || []).forEach((m) => { hl += sqr(typeof m === 'string' ? sqIndex(m) : m, 'mark'); });
      if (o.heat) o.heat.forEach((v, s) => { if (v != null) { const [x, y] = xy(s); hl += `<rect x="${x}" y="${y}" width="${S}" height="${S}" class="heat" style="opacity:${0.12 + 0.7 * v.t}"/><text x="${x + S / 2}" y="${y + S / 2 + 6}" text-anchor="middle" class="heat-n">${v.n}</text>`; } });
      const st = pos.status();
      if (st === 'check' || st === 'checkmate') hl += sqr(pos.king(pos.turn), 'check');
      layers.hl.innerHTML = hl;
      // pieces
      let pcs = '';
      pos.board.forEach((p, s) => {
        if (!p) return;
        const [x, y] = xy(s);
        const isMover = o.anim && o.last && s === o.last[1] && !reduced();
        const [fx, fy] = isMover ? xy(o.last[0]) : [x, y];
        pcs += `<use href="#cp-${p === p.toUpperCase() ? 'w' : 'b'}${p.toUpperCase()}" x="0" y="0" width="${S}" height="${S}" data-s="${s}" style="transform:translate(${fx}px,${fy}px)"${isMover ? ` data-to="${x},${y}"` : ''}/>`;
      });
      layers.pcs.innerHTML = pcs;
      const mover = layers.pcs.querySelector('[data-to]');
      if (mover) {
        const [tx, ty] = mover.dataset.to.split(',');
        mover.getBoundingClientRect();
        requestAnimationFrame(() => { mover.classList.add('moving'); mover.style.transform = `translate(${tx}px,${ty}px)`; });
      }
      // arrows
      let ar = '';
      (o.arrows || []).forEach(([a, b]) => {
        const [x1, y1] = xy(sqIndex(a)), [x2, y2] = xy(sqIndex(b));
        const ax = x1 + S / 2, ay = y1 + S / 2, bx = x2 + S / 2, by = y2 + S / 2, L = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / L, uy = (by - ay) / L;
        const ex = bx - ux * 14, ey = by - uy * 14;
        ar += `<line x1="${ax}" y1="${ay}" x2="${ex}" y2="${ey}"/><path d="M${bx - ux * 4} ${by - uy * 4}L${ex - uy * 9} ${ey + ux * 9}L${ex + uy * 9} ${ey - ux * 9}Z"/>`;
      });
      layers.arrows.innerHTML = ar;
      layers.dots.innerHTML = '';
    }
    function dots(list, sel) {
      let d = '';
      if (sel != null) { const [x, y] = xy(sel); d += `<rect x="${x}" y="${y}" width="${S}" height="${S}" class="sel"/>`; }
      list.forEach((s) => { const [x, y] = xy(s); d += pos.board[s] ? `<circle cx="${x + S / 2}" cy="${y + S / 2}" r="19" class="ring"/>` : `<circle cx="${x + S / 2}" cy="${y + S / 2}" r="7"/>`; });
      layers.dots.innerHTML = d;
    }
    function squareAt(ev) {
      const r = svg.getBoundingClientRect();
      const col = Math.floor((ev.clientX - r.left) / r.width * 8), row = Math.floor((ev.clientY - r.top) / r.height * 8);
      if (col < 0 || col > 7 || row < 0 || row > 7) return -1;
      const f = flip ? 7 - col : col, rk = flip ? row : 7 - row;
      return rk * 8 + f;
    }
    function setFlip(v) { flip = !!v; drawSquares(); if (pos) set(pos.fen()); }
    function shake() { wrap.classList.remove('shake'); void wrap.offsetWidth; wrap.classList.add('shake'); }
    drawSquares();
    return { el: wrap, svg, set, dots, squareAt, setFlip, shake, get pos() { return pos; } };
  }

  // Click-to-move plus a "type a move" box. tryMove(move) returns true if the move was accepted.
  function Mover(board, getPos, tryMove, opt) {
    opt = opt || {};
    let sel = null, enabled = true;
    board.el.classList.add('interactive');
    board.svg.addEventListener('click', (ev) => {
      if (!enabled) return;
      const s = board.squareAt(ev); if (s < 0) return;
      const pos = getPos(), legal = pos.moves();
      if (sel != null) {
        const ms = legal.filter((m) => m.from === sel && m.to === s);
        if (ms.length) {
          const m = ms.find((x) => !x.promo || x.promo.toUpperCase() === (opt.promo ? opt.promo(pos, ms) : 'Q')) || ms[0];
          sel = null; board.dots([]); tryMove(m); return;
        }
      }
      const p = pos.board[s];
      if (p && Chess.colorOf(p) === pos.turn && legal.some((m) => m.from === s)) {
        sel = s; board.dots(legal.filter((m) => m.from === s).map((m) => m.to), s);
      } else { sel = null; board.dots([]); }
    });
    const form = h('form', 'cb-type', '<label><span>Type a move</span><input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="e.g. Nf3" enterkeyhint="go"></label><button type="submit" class="cg-btn">Play</button>');
    const input = form.querySelector('input');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!enabled || !input.value.trim()) return;
      let m;
      try { m = getPos().parse(input.value.trim()); } catch (err) { board.shake(); input.setAttribute('aria-invalid', 'true'); return; }
      input.removeAttribute('aria-invalid'); input.value = ''; sel = null; board.dots([]); tryMove(m);
    });
    return { form, enable(v) { enabled = v; input.disabled = !v; if (!v) { sel = null; board.dots([]); } }, reset() { sel = null; board.dots([]); } };
  }

  // A board that replays a move list: controls, a clickable move list and a note per ply.
  function LinePlayer(host, cfg) {
    const root = h('div', 'lp' + (cfg.cls ? ' ' + cfg.cls : ''));
    const board = Board({ flip: cfg.flip });
    const side = h('div', 'lp-side');
    const ctr = h('div', 'lp-ctrl', '<button type="button" class="cg-btn icon" data-a="first" aria-label="Start">⏮</button><button type="button" class="cg-btn icon" data-a="prev" aria-label="Previous move">◀</button><button type="button" class="cg-btn primary" data-a="play">▶ Play</button><button type="button" class="cg-btn icon" data-a="next" aria-label="Next move">▶</button><button type="button" class="cg-btn icon" data-a="last" aria-label="End">⏭</button>');
    const list = h('ol', 'lp-moves');
    const note = h('p', 'lp-note'); note.setAttribute('aria-live', 'polite');
    if (cfg.head) side.appendChild(cfg.head);
    side.append(note, list);
    const left = h('div', 'lp-board'); left.append(board.el, ctr);
    root.append(left, side);
    host.appendChild(root);
    let L, ply = 0, timer = null;
    function load(fen, moves, notes) {
      stop();
      L = Chess.line(fen, moves); ply = 0; cfg.notes = notes || cfg.notes;
      const startN = new Position(fen).full, blackFirst = new Position(fen).turn === 'b';
      let html = '';
      L.slice(1).forEach((x, i) => {
        const isW = blackFirst ? i % 2 === 1 : i % 2 === 0;
        const n = startN + Math.floor((i + (blackFirst ? 1 : 0)) / 2);
        if (isW) html += `<li><span class="n">${n}.</span>`;
        else if (i === 0) html += `<li><span class="n">${n}…</span>`;
        html += `<button type="button" data-p="${i + 1}">${x.san}</button>`;
        if (!isW) html += '</li>';
      });
      list.innerHTML = html;
      show(0);
    }
    function show(p, anim) {
      ply = Math.max(0, Math.min(L.length - 1, p));
      const x = L[ply];
      board.set(x.fen, { last: x.move ? [x.move.from, x.move.to] : null, anim, ...(cfg.extra ? cfg.extra(ply, L) : {}) });
      list.querySelectorAll('button').forEach((b) => { const on = +b.dataset.p === ply; b.classList.toggle('on', on); b.setAttribute('aria-current', on ? 'step' : 'false'); });
      const cur = list.querySelector('button.on');
      if (cur && list.scrollHeight > list.clientHeight) list.scrollTop = cur.offsetTop - list.clientHeight / 2;
      note.innerHTML = cfg.notes ? cfg.notes(ply, L) : '';
      if (cfg.onShow) cfg.onShow(ply, L);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } ctr.querySelector('[data-a="play"]').textContent = '▶ Play'; }
    function play() {
      if (timer) { stop(); return; }
      if (ply >= L.length - 1) show(0);
      ctr.querySelector('[data-a="play"]').textContent = '⏸ Pause';
      timer = setInterval(() => { if (ply >= L.length - 1) { stop(); return; } show(ply + 1, true); }, cfg.speed || 1300);
    }
    ctr.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const a = b.dataset.a;
      if (a === 'play') { play(); return; }
      stop();
      if (a === 'first') show(0); else if (a === 'prev') show(ply - 1); else if (a === 'next') show(ply + 1, true); else show(L.length - 1);
    });
    list.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { stop(); show(+b.dataset.p); } });
    return { load, play, stop, show, board, root, get ply() { return ply; } };
  }

  function tabs(host, items, onPick, label) {
    const bar = h('div', 'cg-tabs'); bar.setAttribute('role', 'tablist'); bar.setAttribute('aria-label', label);
    bar.innerHTML = items.map((it, i) => `<button type="button" role="tab" class="cg-tab" data-i="${i}" aria-selected="${i === 0}">${it}</button>`).join('');
    host.appendChild(bar);
    bar.addEventListener('click', (e) => {
      const b = e.target.closest('.cg-tab'); if (!b) return;
      bar.querySelectorAll('.cg-tab').forEach((t) => t.setAttribute('aria-selected', String(t === b)));
      onPick(+b.dataset.i);
    });
    return bar;
  }

  const builders = {};

  // ── 1. Hero: the Opera Game ────────────────────────────────────────────
  builders.hero = (host) => {
    const g = D.opera;
    const head = h('div', 'hero-head', `<p class="kicker">Paris, 1858 · ${g.moves.length} plies</p><h3>${g.white} <span>vs</span> ${g.black}</h3>`);
    const meter = h('div', 'hero-meter', '<div class="mt-row"><span>White pieces in play</span><b data-w>0/8</b><i><em data-wb></em></i></div><div class="mt-row"><span>Black pieces in play</span><b data-b>0/8</b><i><em data-bb></em></i></div>');
    head.appendChild(meter);
    const homeW = [0, 1, 2, 3, 4, 5, 6, 7], homeB = [56, 57, 58, 59, 60, 61, 62, 63];
    const lp = LinePlayer(host, {
      cls: 'hero-lp', head, speed: 1500,
      notes: (p, L) => {
        if (p === 0) return '<b>Start.</b> Press play, or step through. Watch how fast White develops while Black grabs and defends.';
        const who = p % 2 ? 'White' : 'Black', n = Math.ceil(p / 2);
        const txt = g.notes[p];
        return `<b>${n}${p % 2 ? '.' : '…'} ${esc(L[p].san)}</b> <span class="who">${who}</span>${txt ? ' ' + esc(txt) : ''}`;
      },
      onShow: (p, L) => {
        // a piece is "in play" once it has left its starting square at least once (pawns not counted)
        const moved = new Set();
        for (let i = 1; i <= p; i++) { const m = L[i].move; moved.add(m.from); if (m.flag === 'k') moved.add(m.from + 3); if (m.flag === 'q') moved.add(m.from - 4); }
        const w = homeW.filter((s) => moved.has(s)).length, b = homeB.filter((s) => moved.has(s)).length;
        meter.querySelector('[data-w]').textContent = w + '/8'; meter.querySelector('[data-b]').textContent = b + '/8';
        meter.querySelector('[data-wb]').style.width = (w / 8 * 100) + '%'; meter.querySelector('[data-bb]').style.width = (b / 8 * 100) + '%';
      },
    });
    lp.load(D.START, g.moves);
    if (!reduced()) onVisible(host, () => setTimeout(() => lp.play(), 500));
  };

  // ── 2. Today's card ────────────────────────────────────────────────────
  function Puzzle(host, pz, opt) {
    opt = opt || {};
    const root = h('div', 'pz' + (opt.compact ? ' compact' : ''));
    const board = Board();
    const side = h('div', 'pz-side');
    const head = h('div', 'pz-head', `<span class="pz-motif">${esc(pz.motif)}</span><span class="pz-turn">White to move</span>`);
    const status = h('p', 'pz-status', 'Find the best move. Tap a piece, then a square, or type the move.'); status.setAttribute('aria-live', 'polite');
    const btns = h('div', 'pz-btns', '<button type="button" class="cg-btn" data-a="hint">Hint</button><button type="button" class="cg-btn" data-a="show">Show solution</button><button type="button" class="cg-btn" data-a="reset">Reset</button>');
    root.append(board.el, side);
    host.appendChild(root);
    let pos, step, done;
    const mover = Mover(board, () => pos, (m) => {
      if (done) return false;
      const want = pos.parse(pz.solution[step]);
      const san = pos.san(m);
      if (m.from === want.from && m.to === want.to && (m.promo || '') === (want.promo || '')) {
        advance(m);
        return true;
      }
      const alt = pz.alt && pz.alt[san];
      board.shake();
      status.innerHTML = alt ? `<b>${esc(san)}</b>: ${esc(alt)}` : `<b>${esc(san)}</b> is not it. Look again: ${esc(pz.hint)}`;
      return false;
    });
    side.append(head, status, mover.form, btns);
    function advance(m) {
      const from = m.from, to = m.to;
      pos.play(m); step++;
      board.set(pos.fen(), { last: [from, to], anim: true });
      if (step >= pz.solution.length) { finish(true); return; }
      mover.enable(false);
      status.innerHTML = 'Good. Black replies…';
      setTimeout(() => {
        const r = pos.parse(pz.solution[step]); const rs = pos.san(r);
        pos.play(r); step++;
        board.set(pos.fen(), { last: [r.from, r.to], anim: true });
        status.innerHTML = `Black played <b>${esc(rs)}</b>. Keep going: what now?`;
        mover.enable(true);
      }, 700);
    }
    function finish(solved) {
      done = true; mover.enable(false);
      const line = Chess.line(pz.fen, pz.solution).slice(1).map((x) => x.san).join(' ');
      status.innerHTML = `${solved ? '<b class="ok">Solved!</b> ' : ''}<span class="pz-line">${esc(line)}</span> ${esc(pz.why)}`;
      if (solved && opt.onSolved) opt.onSolved(pz);
    }
    function reset() { pos = new Position(pz.fen); step = 0; done = false; board.set(pz.fen); mover.enable(true); status.textContent = 'Find the best move. Tap a piece, then a square, or type the move.'; }
    btns.addEventListener('click', (e) => {
      const a = e.target.closest('button'); if (!a) return;
      if (a.dataset.a === 'hint') status.innerHTML = `<b>Hint:</b> ${esc(pz.hint)}`;
      if (a.dataset.a === 'reset') reset();
      if (a.dataset.a === 'show') {
        reset(); mover.enable(false);
        const L = Chess.line(pz.fen, pz.solution);
        L.slice(1).forEach((x, i) => setTimeout(() => board.set(x.fen, { last: [x.move.from, x.move.to], anim: true }), 600 * i));
        setTimeout(() => finish(false), 600 * (L.length - 1));
      }
    });
    reset();
    return { reset };
  }

  builders.daily = (host) => {
    const day = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
    let k = day;
    const root = h('div', 'daily');
    host.appendChild(root);
    const top = h('div', 'daily-top');
    const date = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    top.innerHTML = `<p class="kicker">Today’s card · ${esc(date)}</p><div class="daily-btns"><button type="button" class="cg-btn" data-a="prev">◀ Previous card</button><button type="button" class="cg-btn" data-a="next">Next card ▶</button></div>`;
    const grid = h('div', 'daily-grid');
    const pzHost = h('div', 'daily-pz');
    const cards = h('div', 'daily-cards');
    grid.append(pzHost, cards);
    const solved = h('p', 'daily-solved');
    root.append(top, grid, solved);
    function count() { const s = store.get('solved', []); solved.textContent = s.length ? `Puzzles you have solved on this device: ${s.length} of ${D.puzzles.length}.` : ''; }
    function render() {
      const pz = D.puzzles[((k % D.puzzles.length) + D.puzzles.length) % D.puzzles.length];
      const pr = D.principles[((k % D.principles.length) + D.principles.length) % D.principles.length];
      const fc = D.facts[((k * 7 % D.facts.length) + D.facts.length) % D.facts.length];
      pzHost.innerHTML = '';
      Puzzle(pzHost, pz, { compact: true, onSolved: (p) => { const s = store.get('solved', []); if (!s.includes(p.id)) { s.push(p.id); store.set('solved', s); } count(); } });
      cards.innerHTML = `<div class="dc principle"><span class="dc-tag">Principle</span><p>${esc(pr)}</p></div><div class="dc fact"><span class="dc-tag">Fact</span><p>${esc(fc)}</p></div><div class="dc opening"><span class="dc-tag">Opening to look at</span><p><b>${esc(D.openings[((k % D.openings.length) + D.openings.length) % D.openings.length].name)}</b>: ${esc(D.openings[((k % D.openings.length) + D.openings.length) % D.openings.length].idea)}</p></div>`;
      count();
    }
    top.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; k += b.dataset.a === 'next' ? 1 : -1; render(); });
    render();
  };

  // ── 3. Openings: explore and train ─────────────────────────────────────
  builders.openings = (host) => {
    const learned = new Set(store.get('learned', []));
    const groups = [...new Set(D.openings.map((o) => o.group))];
    const root = h('div', 'op');
    const pick = h('div', 'op-pick');
    pick.innerHTML = groups.map((g) => `<div class="op-group"><span class="op-g">${esc(g)}</span>${D.openings.map((o, i) => (o.group === g ? `<button type="button" class="op-chip" data-i="${i}" aria-pressed="false">${esc(o.name)}<span class="tick" aria-label="trained">✓</span></button>` : '')).join('')}</div>`).join('');
    const mode = h('div', 'op-mode', '<button type="button" class="cg-btn primary" data-m="explore" aria-pressed="true">Explore the line</button><button type="button" class="cg-btn" data-m="train" aria-pressed="false">Train it from memory</button>');
    const stage = h('div', 'op-stage');
    root.append(pick, mode, stage);
    host.appendChild(root);
    let cur = 0, m = 'explore';
    function markChips() { pick.querySelectorAll('.op-chip').forEach((b) => { b.setAttribute('aria-pressed', String(+b.dataset.i === cur)); b.classList.toggle('done', learned.has(D.openings[+b.dataset.i].id)); }); }
    function info(o) {
      return `<div class="op-info"><div class="op-title"><h4>${esc(o.name)}</h4><span class="op-eco">ECO ${esc(o.eco)}</span><span class="op-lvl">${esc(o.level)}</span></div>` +
        `<p class="op-idea">${esc(o.idea)}</p><dl><dt>White’s plan</dt><dd>${esc(o.white)}</dd><dt>Black’s plan</dt><dd>${esc(o.black)}</dd><dt>Who plays it</dt><dd>${esc(o.who)}</dd></dl></div>`;
    }
    function explore() {
      stage.innerHTML = '';
      const o = D.openings[cur];
      const head = h('div', null, info(o));
      const lp = LinePlayer(stage, { head, flip: o.side === 'b', speed: 900, notes: (p, L) => (p === 0 ? `Main line: ${L.length - 1} plies. Step through it, then switch to <b>Train</b>.` : `Move ${Math.ceil(p / 2)}${p % 2 ? '.' : '…'} <b>${esc(L[p].san)}</b>`) });
      lp.load(D.START, o.moves);
      lp.show(o.moves.length);
    }
    function train() {
      stage.innerHTML = '';
      const o = D.openings[cur];
      const you = o.side;
      const L = Chess.line(D.START, o.moves);
      const wrap = h('div', 'op-train');
      const board = Board({ flip: you === 'b' });
      const side = h('div', 'op-tside');
      const status = h('p', 'op-status'); status.setAttribute('aria-live', 'polite');
      const prog = h('div', 'op-prog');
      const again = h('button', 'cg-btn', 'Start again'); again.type = 'button';
      wrap.append(board.el, side);
      stage.appendChild(wrap);
      let ply = 0, misses = 0, tries = 0;
      const pos = () => new Position(L[ply].fen);
      const mover = Mover(board, pos, (mv) => {
        const want = L[ply + 1].move;
        if (mv.from === want.from && mv.to === want.to) { tries = 0; step(); return true; }
        misses++; tries++; board.shake();
        const san = pos().san(mv);
        status.innerHTML = tries >= 2 ? `<b>${esc(san)}</b> is playable in general, but the book move here is <b>${esc(L[ply + 1].san)}</b>. Play it to continue.` : `<b>${esc(san)}</b> is not the main line. Try again (think: ${esc(o.idea.split('.')[0].toLowerCase())}).`;
        return false;
      });
      side.append(h('p', 'op-you', `You play <b>${you === 'w' ? 'White' : 'Black'}</b> in the <b>${esc(o.name)}</b>. The other side’s book moves are played for you.`), status, mover.form, prog, again);
      function draw() {
        const x = L[ply];
        board.set(x.fen, { last: x.move ? [x.move.from, x.move.to] : null, anim: true });
        const mine = L.slice(1).filter((_, i) => (you === 'w' ? i % 2 === 0 : i % 2 === 1)).length;
        const doneMine = L.slice(1, ply + 1).filter((_, i) => (you === 'w' ? i % 2 === 0 : i % 2 === 1)).length;
        prog.innerHTML = `<span>${doneMine}/${mine} of your moves</span><i><em style="width:${doneMine / mine * 100}%"></em></i>`;
      }
      function step() {
        ply++; draw();
        if (ply >= L.length - 1) return finish();
        mover.enable(false);
        setTimeout(() => { ply++; draw(); if (ply >= L.length - 1) return finish(); mover.enable(true); status.innerHTML = `Book move <b>${esc(L[ply].san)}</b>. Your move.`; }, 650);
      }
      function finish() {
        mover.enable(false);
        if (!misses) { learned.add(o.id); store.set('learned', [...learned]); markChips(); }
        status.innerHTML = misses ? `<b>Line complete</b> with ${misses} slip${misses > 1 ? 's' : ''}. Go again until it is clean.` : '<b class="ok">Perfect: the whole line from memory.</b> This opening now has a ✓ (saved on this device).';
      }
      function start() {
        ply = 0; misses = 0; tries = 0; draw();
        status.innerHTML = you === 'w' ? 'Your move: play White’s first move.' : 'White starts…';
        if (you === 'b') { mover.enable(false); setTimeout(() => { ply = 1; draw(); mover.enable(true); status.innerHTML = `White played <b>${esc(L[1].san)}</b>. Your move.`; }, 700); } else mover.enable(true);
      }
      again.addEventListener('click', start);
      start();
    }
    function render() { markChips(); if (m === 'explore') explore(); else train(); }
    pick.addEventListener('click', (e) => { const b = e.target.closest('.op-chip'); if (!b) return; cur = +b.dataset.i; render(); });
    mode.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      m = b.dataset.m;
      mode.querySelectorAll('button').forEach((x) => { const on = x === b; x.setAttribute('aria-pressed', String(on)); x.classList.toggle('primary', on); });
      render();
    });
    render();
  };

  // ── 4. Traps ───────────────────────────────────────────────────────────
  builders.traps = (host) => {
    const stage = h('div');
    let lp;
    const head = h('div', 'trap-head');
    tabs(host, D.traps.map((t) => esc(t.name)), (i) => load(i), 'Opening traps');
    host.appendChild(stage);
    lp = LinePlayer(stage, { head, speed: 1100, notes: (p, L) => (p === L.length - 1 ? `<b>${esc(L[p].san)}</b>. ${esc(cur.lesson)}` : p ? `<b>${esc(L[p].san)}</b>` : 'Press play.') });
    let cur;
    function load(i) {
      cur = D.traps[i];
      const L = Chess.line(D.START, cur.moves), end = new Position(L[L.length - 1].fen).status();
      head.innerHTML = `<h4>${esc(cur.name)}</h4><p class="trap-res">${end === 'checkmate' ? `Checkmate in ${Math.ceil(cur.moves.length / 2)} moves` : `${cur.moves.length} plies: White ends a piece down`}</p>`;
      lp.load(D.START, cur.moves);
    }
    load(0);
  };

  // ── 5. Mobility heatmap ────────────────────────────────────────────────
  builders.mobility = (host) => {
    const types = ['N', 'B', 'R', 'Q', 'K'];
    const root = h('div', 'mob');
    const bar = h('div', 'mob-pick'); bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'Choose a piece');
    bar.innerHTML = types.map((t, i) => `<button type="button" class="mob-btn" data-t="${t}" aria-pressed="${i === 0}"><svg viewBox="0 0 45 45" aria-hidden="true"><use href="#cp-w${t}"/></svg><span>${NAMES[t]}</span></button>`).join('');
    const board = Board({ label: 'Heat map of how many squares a piece controls from each square' });
    const tiles = h('div', 'mob-tiles');
    const note = h('p', 'mob-note'); note.setAttribute('aria-live', 'polite');
    const right = h('div', 'mob-side'); right.append(tiles, note);
    const body = h('div', 'mob-body'); body.append(board.el, right);
    root.append(bar, body); host.appendChild(root);
    let t = 'N', placed = null;
    const counts = (type) => { const c = []; for (let s = 0; s < 64; s++) { const p = new Position('8/8/8/8/8/8/8/8 w - - 0 1'); p.board[s] = type; c.push(p.pseudo()); } return c; };
    function render() {
      const c = counts(t), n = c.map((x) => x.length), mn = Math.min(...n), mx = Math.max(...n), avg = n.reduce((a, b) => a + b, 0) / 64;
      const heat = n.map((v) => ({ n: v, t: mx === mn ? 0.5 : (v - mn) / (mx - mn) }));
      const fen = placed == null ? '8/8/8/8/8/8/8/8 w - - 0 1' : (() => { const p = new Position('8/8/8/8/8/8/8/8 w - - 0 1'); p.board[placed] = t; return p.fen(); })();
      board.set(fen, { heat: placed == null ? heat : null });
      if (placed != null) board.dots(c[placed].map((m) => m.to), placed);
      tiles.innerHTML = `<div class="tile"><b>${mn}</b><span>fewest (corner/edge)</span></div><div class="tile"><b>${mx}</b><span>most (centre)</span></div><div class="tile"><b>${avg.toFixed(2).replace(/\.00$/, '')}</b><span>average over 64 squares</span></div>`;
      note.innerHTML = placed == null ? `Each square shows how many squares a <b>${NAMES[t]}</b> standing there controls on an empty board. <b>Tap a square</b> to place it and see its moves.` :
        `A ${NAMES[t]} on <b>${sqName(placed)}</b> controls <b>${n[placed]}</b> squares. <button type="button" class="linkish" data-a="heat">Back to the heat map</button>`;
    }
    board.el.classList.add('interactive');
    board.svg.addEventListener('click', (ev) => { const s = board.squareAt(ev); if (s < 0) return; placed = placed === s ? null : s; render(); });
    note.addEventListener('click', (e) => { if (e.target.closest('[data-a="heat"]')) { placed = null; render(); } });
    bar.addEventListener('click', (e) => { const b = e.target.closest('.mob-btn'); if (!b) return; t = b.dataset.t; bar.querySelectorAll('.mob-btn').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); render(); });
    render();
  };

  // ── 6. Tactics ─────────────────────────────────────────────────────────
  builders.tactics = (host) => {
    const stage = h('div');
    const solved = new Set(store.get('solved', []));
    const bar = tabs(host, D.puzzles.map((p) => `${esc(p.motif)}<span class="tick" aria-label="solved">✓</span>`), (i) => load(i), 'Tactics puzzles');
    host.appendChild(stage);
    function marks() { bar.querySelectorAll('.cg-tab').forEach((b, i) => b.classList.toggle('done', solved.has(D.puzzles[i].id))); }
    function load(i) { stage.innerHTML = ''; Puzzle(stage, D.puzzles[i], { onSolved: (p) => { solved.add(p.id); store.set('solved', [...solved]); marks(); } }); }
    marks(); load(0);
  };

  // ── 7. Middlegame plans ────────────────────────────────────────────────
  builders.plans = (host) => {
    const body = h('div', 'plan');
    const board = Board();
    const txt = h('div', 'plan-txt'); txt.setAttribute('aria-live', 'polite');
    body.append(board.el, txt);
    tabs(host, D.plans.map((p) => esc(p.name)), (i) => show(i), 'Middlegame plans');
    host.appendChild(body);
    function show(i) {
      const p = D.plans[i];
      board.set(p.fen, { marks: p.marks, arrows: p.arrows });
      txt.innerHTML = `<h4>${esc(p.name)}</h4><p>${esc(p.text)}</p><p class="plan-key">Highlighted: ${p.marks.join(', ')} · Arrows: ${p.arrows.map(([a, b]) => a + '→' + b).join(', ')}</p>`;
    }
    show(0);
  };

  // ── 8. Endgame patterns ────────────────────────────────────────────────
  builders.endgames = (host) => {
    const stage = h('div');
    const head = h('div', 'eg-head');
    tabs(host, D.endgames.map((e) => esc(e.name)), (i) => load(i), 'Endgame patterns');
    host.appendChild(stage);
    let cur;
    const lp = LinePlayer(stage, { head, speed: 1000, notes: (p, L) => (p ? `<b>${esc(L[p].san)}</b>${p === L.length - 1 ? ' ' + esc(cur.lesson) : ''}` : esc(cur.lesson)) });
    function load(i) {
      cur = D.endgames[i];
      head.innerHTML = `<h4>${esc(cur.name)}</h4><span class="eg-res ${cur.result === 'Draw' ? 'draw' : 'win'}">${esc(cur.result)} · tablebase-checked</span>`;
      lp.load(cur.fen, cur.moves);
    }
    load(0);
  };

  // ── 9. King and pawn vs king against a perfect defender ────────────────
  builders.kpk = (host) => {
    const root = h('div', 'kpk');
    const bar = tabs(host, D.kpk.map((k) => esc(k.name)), (i) => start(i), 'King and pawn lessons');
    const board = Board();
    const side = h('div', 'kpk-side');
    const goal = h('p', 'kpk-goal');
    const verdict = h('div', 'kpk-verdict');
    const status = h('p', 'kpk-status'); status.setAttribute('aria-live', 'polite');
    const tip = h('p', 'kpk-tip');
    const btns = h('div', 'pz-btns', '<button type="button" class="cg-btn" data-a="undo">Undo</button><button type="button" class="cg-btn" data-a="reset">Restart</button><button type="button" class="cg-btn" data-a="tip">Tip</button>');
    root.append(board.el, side);
    host.appendChild(root);
    let lesson, hist, pos, over, ready = false;
    const mover = Mover(board, () => pos, (m) => {
      if (over || pos.turn !== 'w') return false;
      const before = Chess.kpk.probe(pos);
      play(m);
      const after = over ? null : Chess.kpk.probe(pos);
      if (!over && before === 'win' && after === 'draw') status.innerHTML = '<b class="bad">That move threw away the win.</b> The table now says draw. Press Undo and try another move.';
      if (!over) { mover.enable(false); setTimeout(reply, 550); }
      return true;
    }, { promo: (p, ms) => { const q = ms.find((x) => x.promo === 'Q'); return q && p.clone().play(q).status() === 'stalemate' ? 'R' : 'Q'; } });
    side.append(goal, verdict, status, mover.form, btns, tip);
    function setVerdict() {
      const v = over ? over : Chess.kpk.probe(pos);
      verdict.className = 'kpk-verdict ' + (v === 'win' || v === 'queened' ? 'win' : 'draw');
      verdict.innerHTML = `<span>Perfect-play verdict</span><b>${v === 'queened' ? 'Queened: White wins' : v === 'win' ? 'White wins' : 'Draw'}</b>`;
    }
    function play(m) {
      hist.push(pos.fen());
      const from = m.from, to = m.to;
      pos.play(m);
      board.set(pos.fen(), { last: [from, to], anim: true });
      if (m.promo) { over = 'queened'; status.innerHTML = `<b class="ok">You queened${m.promo.toUpperCase() === 'R' ? ' (with a rook, to avoid stalemate)' : ''}!</b> King and queen against king is a forced mate.`; mover.enable(false); }
      else if (!pos.board.includes('P')) { over = 'draw'; status.innerHTML = '<b class="bad">The pawn fell.</b> Kings alone can’t mate: draw.'; mover.enable(false); }
      else if (pos.status() === 'stalemate') { over = 'draw'; status.innerHTML = '<b class="bad">Stalemate:</b> Black has no legal move and is not in check. Draw.'; mover.enable(false); }
      setVerdict();
    }
    function reply() {
      if (over) return;
      const ms = pos.moves();
      const scored = ms.map((m) => { const q = pos.clone().play(m); return { m, v: Chess.kpk.probe(q) || (q.board.includes('P') ? 'win' : 'draw'), d: q.board.includes('P') ? Chess.kpk.depth(q) || 0 : 0 }; });
      // perfect defence: keep the draw if possible (prefer taking the pawn), else make the win as long as possible
      let best = scored.filter((x) => x.v === 'draw');
      if (best.length) best.sort((a, b) => (b.m.captured ? 1 : 0) - (a.m.captured ? 1 : 0));
      else best = scored.sort((a, b) => b.d - a.d);
      const m = best[0].m, san = pos.san(m);
      play(m);
      if (!over) { mover.enable(true); if (!/threw/.test(status.innerHTML) || Chess.kpk.probe(pos) === 'win') status.innerHTML = `Black played <b>${esc(san)}</b>. Your move.`; }
      else if (over === 'draw' && !pos.board.includes('P')) status.innerHTML = `Black played <b>${esc(san)}</b> and took the pawn: draw. Press Undo or Restart.`;
    }
    function start(i) {
      lesson = D.kpk[i]; pos = new Position(lesson.fen); hist = []; over = null;
      board.set(lesson.fen); goal.innerHTML = `<b>${esc(lesson.name)}.</b> ${esc(lesson.goal)} You are White.`;
      tip.textContent = '';
      if (!ready) { status.textContent = 'Building the perfect-play table (about 330,000 positions)…'; mover.enable(false); return; }
      setVerdict(); mover.enable(true); status.textContent = 'Your move. Black defends perfectly.';
    }
    btns.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b || !ready) return;
      if (b.dataset.a === 'tip') tip.textContent = lesson.tip;
      if (b.dataset.a === 'reset') start(D.kpk.indexOf(lesson));
      if (b.dataset.a === 'undo' && hist.length) {
        // undo back to White's last turn
        let f = hist.pop(); while (new Position(f).turn !== 'w' && hist.length) f = hist.pop();
        pos = new Position(f); over = null; board.set(f); setVerdict(); mover.enable(true); status.textContent = 'Move taken back. Your move.';
      }
    });
    start(0);
    onVisible(host, () => setTimeout(() => {
      Chess.kpk.build(); ready = true;
      const sel = bar.querySelector('[aria-selected="true"]');
      start(sel ? +sel.dataset.i : 0);
    }, 50));
  };

  // ── 10. The thinking routine ───────────────────────────────────────────
  builders.routine = (host) => {
    const steps = [
      ['What does their move want?', 'Before anything else, ask what your opponent’s last move threatens or prepares. Most blunders come from skipping this.'],
      ['Checks, captures, threats', 'List every forcing move for both sides. Forcing moves narrow the game tree, so they are the cheapest to calculate.'],
      ['Pick 2–3 candidates', 'Choose a few moves worth calculating: forcing moves first, then moves that improve your worst piece or follow your plan.'],
      ['Calculate and compare', 'Play each candidate forward a few moves in your head and compare the end positions, not the first move.'],
      ['Blunder check, then move', 'Before you touch a piece: after this move, what is undefended, and what checks or captures do they get?'],
    ];
    const root = h('div', 'rt');
    const R = 120, cx = 160, cy = 150;
    let svg = `<svg viewBox="0 0 320 300" role="img" aria-label="A loop of five steps you repeat before every move">`;
    svg += `<circle cx="${cx}" cy="${cy}" r="${R}" class="rt-ring"/>`;
    steps.forEach((s, i) => {
      const a = -Math.PI / 2 + i * 2 * Math.PI / steps.length, x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
      svg += `<g class="rt-node" data-i="${i}"><circle cx="${x}" cy="${y}" r="26"/><text x="${x}" y="${y + 7}" text-anchor="middle">${i + 1}</text></g>`;
    });
    svg += `<text x="${cx}" y="${cy - 4}" text-anchor="middle" class="rt-c1">every move</text><text x="${cx}" y="${cy + 18}" text-anchor="middle" class="rt-c2">repeat</text></svg>`;
    const pic = h('div', 'rt-pic', svg);
    const list = h('ol', 'rt-list', steps.map((s, i) => `<li><button type="button" data-i="${i}" aria-pressed="${i === 0}"><b>${esc(s[0])}</b><span>${esc(s[1])}</span></button></li>`).join(''));
    root.append(pic, list); host.appendChild(root);
    function sel(i) {
      root.querySelectorAll('.rt-node').forEach((g) => g.classList.toggle('on', +g.dataset.i === i));
      list.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.i === i)));
    }
    root.addEventListener('click', (e) => { const t = e.target.closest('[data-i]'); if (t) sel(+t.dataset.i); });
    sel(0);
  };

  // ── 11. Facts and a live perft count ───────────────────────────────────
  builders.facts = (host) => {
    const tiles = [['4.8 × 10<sup>44</sup>', 'legal positions (Tromp’s estimate)'], ['10<sup>120</sup>', 'possible games (Shannon, 1950)'], ['269', 'moves in the longest tournament game (1989)'], ['2882', 'highest FIDE rating ever (Carlsen, 2014)']];
    const root = h('div', 'fx');
    root.innerHTML = '<div class="fx-tiles">' + tiles.map(([b, s]) => `<div class="tile"><b>${b}</b><span>${s}</span></div>`).join('') + '</div>';
    const pf = h('div', 'pf');
    pf.innerHTML = '<div class="pf-top"><p><b>How fast does chess explode?</b> Count every possible game after 1 to 5 plies (half-moves), live, with this page’s move generator.</p><button type="button" class="cg-btn primary" data-a="run">Count</button></div><div class="pf-bars" role="img" aria-label="Bar chart of possible games after 1 to 5 plies, on a log scale"></div><p class="pf-note" aria-live="polite"></p>';
    root.appendChild(pf); host.appendChild(root);
    const bars = pf.querySelector('.pf-bars'), note = pf.querySelector('.pf-note');
    const known = [20, 400, 8902, 197281, 4865609];
    const maxLog = Math.log10(known[4]);
    function drawBars(got) {
      bars.innerHTML = known.map((k, i) => {
        const v = got[i];
        const w = v == null ? 0 : Math.max(2, Math.log10(v) / maxLog * 100);
        return `<div class="pf-row"><span class="pf-k">${i + 1} ${i ? 'plies' : 'ply'}</span><span class="pf-bar"><em style="width:${w}%"></em></span><span class="pf-v">${v == null ? '…' : fmt(v)}</span></div>`;
      }).join('') + '<p class="pf-axis">Bar length is on a log scale: each extra ply multiplies the count by about 20 to 25.</p>';
    }
    drawBars([]);
    const runBtn = pf.querySelector('[data-a="run"]');
    let started = false;
    function run() {
      if (started && runBtn.disabled) return;
      started = true;
      const btn = runBtn; btn.disabled = true;
      const got = []; const start = new Position();
      const t0 = performance.now();
      let d = 1;
      function nextDepth() {
        if (d > 5) { btn.disabled = false; btn.textContent = 'Count again'; note.innerHTML = `Done in ${((performance.now() - t0) / 1000).toFixed(1)} s on your device. These match the standard reference counts (“perft”), a test every chess engine must pass.`; return; }
        if (d < 5) { got.push(start.perft(d)); drawBars(got); d++; setTimeout(nextDepth, 30); return; }
        // depth 5: split by first move so the page stays responsive
        const roots = start.moves(); let i = 0, sum = 0;
        (function chunk() {
          if (i >= roots.length) { got.push(sum); drawBars(got); d++; nextDepth(); return; }
          sum += start.clone().play(roots[i]).perft(4); i++;
          note.textContent = `Counting 5 plies… ${i}/${roots.length} first moves (${fmt(sum)} games so far)`;
          setTimeout(chunk, 0);
        })();
      }
      nextDepth();
    }
    runBtn.addEventListener('click', run);
    onVisible(pf, () => setTimeout(run, 400));
  };

  document.querySelectorAll('figure.hv[data-hv]').forEach((fig) => {
    const build = builders[fig.dataset.hv];
    const host = fig.querySelector('.hv-canvas');
    if (!build || !host) return;
    try { host.innerHTML = ''; build(host, fig); fig.classList.add('ready'); } catch (e) { console.error('chess figure', fig.dataset.hv, e); }
  });
})();
