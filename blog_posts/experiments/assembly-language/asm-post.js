// Playable explainer for /blog_posts/assembly-language-explained-simply.html.
//
// One engine, "Chip": a cartoon CPU with three hands (registers A, B, C), a belly calculator
// (the ALU), an antenna (the zero flag), a recipe card (the program) with a finger (the program
// counter) and a shelf of numbered boxes (memory). Numbers are tokens that physically fly
// between them. The engine really executes its toy instruction set (fetch, decode, execute);
// nothing is pre-recorded. It is reused by:
//   hero   - autoplays the add program with fresh numbers each round
//   story  - scroll-driven tour: each step card below the stage changes what Chip shows
//   play   - a game: the reader is the CPU and taps boxes/hands; their time is compared with a 3 GHz chip
//   turbo  - the multiply-by-adding loop at snail, rabbit or lightning speed
//   bits   - 16 switches that decode live into a real x86-64 instruction (6 opcodes, register form)
// Every <figure class="hv" data-hv="..."> keeps a text fallback for agents and no-JS readers.
(function () {
  'use strict';

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const reduced = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const sleep = (ms) => (ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const fmt = (n) => n.toLocaleString('en-US');

  // ── the toy instruction set ────────────────────────────────────────────
  //   MOV r, n   LOAD r, [a]   STORE r, [a]   ADD r, r   DEC r   JNZ line   HALT
  // ADD and DEC set the zero flag (Chip's antenna), like x86 and ARM do; JNZ reads it.
  const asmText = ([op, a, b]) => ({
    MOV: `MOV ${a}, ${b}`, LOAD: `LOAD ${a}, [${b}]`, STORE: `STORE ${a}, [${b}]`,
    ADD: `ADD ${a}, ${b}`, DEC: `DEC ${a}`, JNZ: `JNZ ${a}`,
  }[op] || op);
  const kidText = ([op, a, b]) => ({
    MOV: `Put the number ${b} in hand ${a}.`,
    LOAD: `Walk to box ${b}, peek inside, and hold a copy of its number in hand ${a}.`,
    STORE: `Put a copy of hand ${a}'s number into box ${b}.`,
    ADD: `Add hand ${b} to hand ${a}. Hand ${a} keeps the answer.`,
    DEC: `Take 1 away from hand ${a}. If that makes 0, my antenna lights up!`,
    JNZ: `Is my antenna dark? Then jump the finger back to line ${a}. If it's lit, carry on.`,
  }[op] || 'Stop. All done!');
  const ADD_PROG = (x, y) => ({ mem: [x, y, 0, 0, 0, 0, 0, 0], code: [['LOAD', 'A', 0], ['LOAD', 'B', 1], ['ADD', 'A', 'B'], ['STORE', 'A', 2], ['HALT']] });
  const MUL_PROG = (x, y) => ({ mem: [0, 0, 0, 0, 0, 0, 0, 0], code: [['MOV', 'A', 0], ['MOV', 'B', x], ['MOV', 'C', y], ['ADD', 'A', 'B'], ['DEC', 'C'], ['JNZ', 3], ['STORE', 'A', 0], ['HALT']] });

  // ── layouts: a wide scene for desktops, a tall one for phones ──────────
  function layout(wide, n) {
    if (wide) {
      const lh = Math.min(50, 400 / n);
      const L = {
        W: 960, H: 500, wide: true,
        prog: { x: 14, y: 44, w: 262, h: 440 }, lh, fs: 18, tokR: 23, tokFs: 22, cardW: 150, cardH: 34, cardFs: 15,
        shelf: { x: 684, y: 44, w: 262, h: 440 },
        box: { w: 92, h: 64 },
        chip: { x: 330, y: 74, w: 300, h: 410 },
        ant: [480, 74, 34, 13],
        face: { x: 360, y: 98, w: 240, h: 112 }, eyes: [[435, 148], [525, 148]], eyeR: 14, mouth: [480, 186],
        slot: { w: 74, h: 72 }, regs: { A: [395, 288], B: [480, 288], C: [565, 288] },
        alu: { cx: 480, cy: 410, w: 250, h: 96 },
      };
      L.lineY = (i) => L.prog.y + 26 + lh * (i + 0.5);
      L.lineX = { finger: L.prog.x + 10, num: L.prog.x + 54, text: L.prog.x + 66, end: L.prog.x + L.prog.w - 20 };
      L.mem = Array.from({ length: 8 }, (_, i) => [755 + (i % 2) * 120, 106 + Math.floor(i / 2) * 104]);
      return L;
    }
    const lh = Math.min(30, 222 / n);
    const L = {
      W: 400, H: 600, wide: false,
      prog: { x: 4, y: 30, w: 194, h: 252 }, lh, fs: 14, tokR: 18, tokFs: 17, cardW: 116, cardH: 28, cardFs: 12,
      shelf: { x: 202, y: 30, w: 194, h: 252 },
      box: { w: 82, h: 44 },
      chip: { x: 24, y: 312, w: 352, h: 280 },
      ant: [200, 312, 294, 9],
      face: { x: 110, y: 326, w: 180, h: 72 }, eyes: [[165, 358], [235, 358]], eyeR: 10, mouth: [200, 386],
      slot: { w: 70, h: 58 }, regs: { A: [110, 452], B: [200, 452], C: [290, 452] },
      alu: { cx: 200, cy: 541, w: 284, h: 70 },
    };
    L.lineY = (i) => L.prog.y + 16 + lh * (i + 0.5);
    L.lineX = { finger: L.prog.x + 5, num: L.prog.x + 38, text: L.prog.x + 46, end: L.prog.x + L.prog.w - 12 };
    L.mem = Array.from({ length: 8 }, (_, i) => [252 + (i % 2) * 94, 70 + Math.floor(i / 2) * 60]);
    return L;
  }

  const MOUTH = {
    smile: (x, y, s) => `M${x - 22 * s} ${y - 4 * s} Q${x} ${y + 14 * s} ${x + 22 * s} ${y - 4 * s}`,
    o: (x, y, s) => `M${x - 8 * s} ${y} a${8 * s} ${7 * s} 0 1 0 ${16 * s} 0 a${8 * s} ${7 * s} 0 1 0 ${-16 * s} 0`,
    grin: (x, y, s) => `M${x - 30 * s} ${y - 8 * s} Q${x} ${y + 26 * s} ${x + 30 * s} ${y - 8 * s} Z`,
    flat: (x, y, s) => `M${x - 16 * s} ${y + 2 * s} L${x + 16 * s} ${y + 2 * s}`,
  };
  function gearPath(cx, cy, r) {
    let d = '';
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2, rr = i % 2 ? r * 0.72 : r;
      d += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1);
    }
    return d + 'Z';
  }

  // ── the stage ──────────────────────────────────────────────────────────
  function Stage(host, opt) {
    opt = opt || {};
    const S = { code: [], mem: [], reg: { A: 0, B: 0, C: 0 }, pc: 0, zf: false, halted: false, done: 0, jumps: 0, speed: 1, read: opt.read || 1200 };
    const root = document.createElement('div');
    root.className = 'chip-stage' + (opt.interactive ? ' interactive' : '');
    root.innerHTML = '<div class="chip-svg"></div>' + (opt.bubble === false ? '' :
      `<div class="chip-bubble"${opt.live ? ' aria-live="polite"' : ''}><div class="chip-phases"><span>1 · Fetch</span><span>2 · Decode</span><span>3 · Execute</span></div><p class="chip-say"></p></div>`);
    host.innerHTML = '';
    host.appendChild(root);
    const svgHost = root.querySelector('.chip-svg');
    let L = null, gen = 0, ro = null;
    const $ = (sel) => svgHost.querySelector(sel);
    const D = (ms) => (S.speed === Infinity ? 0 : ms / S.speed);

    function build() {
      const wide = !opt.forceTall && host.clientWidth >= 600;
      if (L && L.wide === wide && L.n === S.code.length) return;
      L = layout(wide, Math.max(5, S.code.length));
      L.n = S.code.length;
      const s = wide ? 1 : 0.7;
      const P = L.prog, H = L.shelf, C = L.chip, A = L.alu, F = L.face;
      let g = `<defs><filter id="glow-${uid}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${wide ? 6 : 4}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
      // recipe card
      g += `<g data-part="prog"><rect x="${P.x}" y="${P.y}" width="${P.w}" height="${P.h}" rx="14" class="c-paper"/>` +
        `<text x="${P.x + P.w / 2}" y="${P.y - 10}" text-anchor="middle" class="c-title">📜 Recipe <tspan class="c-sub">(program)</tspan></text>` +
        `<rect class="c-linehi" x="${P.x + 6}" y="0" width="${P.w - 12}" height="${L.lh - 6}" rx="8"/>`;
      S.code.forEach((ins, i) => {
        const y = L.lineY(i) + L.fs * 0.35;
        g += `<g class="c-line" data-line="${i}"><text x="${L.lineX.num}" y="${y}" text-anchor="end" class="c-num" style="font-size:${L.fs * 0.75}px">${i}</text>` +
          `<text x="${L.lineX.text}" y="${y}" class="c-code" style="font-size:${L.fs}px">${esc(asmText(ins))}</text></g>`;
      });
      g += `<path class="c-jump" d=""/></g>`;
      g += `<g data-part="finger"><g class="c-finger"><text x="${L.lineX.finger}" y="${L.fs * 0.4}" style="font-size:${L.fs * 1.25}px">👉</text></g></g>`;
      // shelf
      g += `<g data-part="mem"><rect x="${H.x}" y="${H.y}" width="${H.w}" height="${H.h}" rx="14" class="c-shelf"/>` +
        `<text x="${H.x + H.w / 2}" y="${H.y - 10}" text-anchor="middle" class="c-title">📦 Shelf <tspan class="c-sub">(memory)</tspan></text>`;
      L.mem.forEach(([x, y], i) => {
        g += `<g class="c-box" data-hit="m${i}" style="transform-origin:${x}px ${y}px"><rect x="${x - L.box.w / 2}" y="${y - L.box.h / 2}" width="${L.box.w}" height="${L.box.h}" rx="9" class="c-boxr"/>` +
          `<text x="${x - L.box.w / 2 + 7}" y="${y - L.box.h / 2 + (wide ? 15 : 12)}" class="c-boxlbl" style="font-size:${wide ? 12 : 10}px">box ${i}</text>` +
          `<text x="${x}" y="${y + (wide ? 13 : 11)}" text-anchor="middle" class="c-val" data-mem="${i}" style="font-size:${wide ? 28 : 21}px">0</text></g>`;
        if (i % 2) g += `<line x1="${H.x + 10}" x2="${H.x + H.w - 10}" y1="${y + L.box.h / 2 + 5}" y2="${y + L.box.h / 2 + 5}" class="c-plank"/>`;
      });
      g += '</g>';
      // Chip
      const [ax, ay, aty, ar] = L.ant;
      g += `<g data-part="chip"><rect x="${C.x}" y="${C.y}" width="${C.w}" height="${C.h}" rx="${wide ? 40 : 30}" class="c-body"/>` +
        `<g class="c-pins">${Array.from({ length: 6 }, (_, i) => { const yy = C.y + 40 + i * (C.h - 80) / 5; return `<rect x="${C.x - 10}" y="${yy - 4}" width="10" height="8" rx="2"/><rect x="${C.x + C.w}" y="${yy - 4}" width="10" height="8" rx="2"/>`; }).join('')}</g>` +
        `<g data-hit="chip"><rect x="${F.x}" y="${F.y}" width="${F.w}" height="${F.h}" rx="${wide ? 22 : 16}" class="c-face"/>` +
        `<g class="c-eyes" style="transform-origin:${C.x + C.w / 2}px ${L.eyes[0][1]}px">${L.eyes.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${L.eyeR}" class="c-eye"/><circle cx="${x}" cy="${y}" r="${L.eyeR * 0.45}" class="c-pupil"/>`).join('')}</g>` +
        `<path class="c-mouth" d="${MOUTH.smile(L.mouth[0], L.mouth[1], s)}"/></g></g>`;
      g += `<g data-part="antenna"><line x1="${ax}" y1="${ay}" x2="${ax}" y2="${aty}" class="c-antl"/><circle cx="${ax}" cy="${aty}" r="${ar}" class="c-bulb"/>` +
        `<text x="${ax + ar + 6}" y="${aty + 4}" class="c-tiny" style="font-size:${wide ? 12 : 10}px">zero light</text></g>`;
      g += '<g data-part="regs">';
      ['A', 'B', 'C'].forEach((r) => {
        const [x, y] = L.regs[r];
        g += `<g class="c-reg" data-hit="r${r}" style="transform-origin:${x}px ${y}px"><text x="${x}" y="${y - L.slot.h / 2 - 7}" text-anchor="middle" class="c-tiny" style="font-size:${wide ? 13 : 11}px">✋ hand ${r}</text>` +
          `<rect x="${x - L.slot.w / 2}" y="${y - L.slot.h / 2}" width="${L.slot.w}" height="${L.slot.h}" rx="14" class="c-slot"/>` +
          `<text x="${x}" y="${y + (wide ? 12 : 9)}" text-anchor="middle" class="c-val" data-reg="${r}" style="font-size:${wide ? 32 : 24}px">0</text></g>`;
      });
      g += '</g>';
      g += `<g data-part="alu" data-hit="alu"><rect x="${A.cx - A.w / 2}" y="${A.cy - A.h / 2}" width="${A.w}" height="${A.h}" rx="16" class="c-alu"/>` +
        `<path class="c-gear" d="${gearPath(A.cx - A.w / 2 + (wide ? 30 : 24), A.cy, wide ? 15 : 11)}" style="transform-origin:${A.cx - A.w / 2 + (wide ? 30 : 24)}px ${A.cy}px"/>` +
        `<text x="${A.cx + 12}" y="${A.cy - A.h / 2 + (wide ? 22 : 17)}" text-anchor="middle" class="c-tiny" style="font-size:${wide ? 13 : 11}px">🧮 belly calculator (ALU)</text>` +
        `<text x="${A.cx + 12}" y="${A.cy + (wide ? 24 : 20)}" text-anchor="middle" class="c-expr" style="font-size:${wide ? 26 : 20}px">ready</text></g>`;
      g += '<g class="c-fx"></g>';
      svgHost.innerHTML = `<svg viewBox="0 0 ${L.W} ${L.H}" role="img" aria-label="${esc(opt.label || 'Chip, a cartoon CPU: a recipe card of assembly instructions with a pointing finger, three hands holding numbers (registers), a belly calculator (ALU), an antenna that lights when an answer is zero, and a shelf of eight numbered boxes (memory).')}">${g}</svg>`;
      render();
    }
    const uid = Math.random().toString(36).slice(2, 8);

    function render() {
      if (!L) return;
      ['A', 'B', 'C'].forEach((r) => { $(`[data-reg="${r}"]`).textContent = S.reg[r]; });
      S.mem.forEach((v, i) => { $(`[data-mem="${i}"]`).textContent = v; });
      $('.c-bulb').classList.toggle('on', S.zf);
      placeFinger(S.pc);
    }
    function placeFinger(line) {
      if (!L) return;
      const y = L.lineY(Math.min(line, S.code.length - 1));
      $('.c-finger').setAttribute('transform', `translate(0 ${y.toFixed(1)})`);
      const hi = $('.c-linehi');
      hi.setAttribute('y', (y - (L.lh - 6) / 2).toFixed(1));
      svgHost.querySelectorAll('.c-line').forEach((l) => l.classList.toggle('cur', +l.dataset.line === line));
    }

    // animation primitives (all resolve early if the stage was reset meanwhile)
    function anim(ms, fn) {
      const my = gen;
      if (ms <= 0 || reduced()) { fn(1); return Promise.resolve(); }
      return new Promise((res) => {
        const t0 = performance.now();
        const tick = (now) => {
          if (my !== gen) return res();
          const t = Math.min(1, (now - t0) / ms);
          fn(ease(t));
          if (t < 1) requestAnimationFrame(tick); else res();
        };
        requestAnimationFrame(tick);
      });
    }
    const pt = {
      reg: (r) => L.regs[r], mem: (i) => L.mem[i], alu: (dx = 0) => [L.alu.cx + 12 + dx, L.alu.cy + 4],
      line: (i) => [L.lineX.end - (L.wide ? 10 : 6), L.lineY(i)], face: () => [L.chip.x + L.chip.w / 2, L.eyes[0][1] + 6],
    };
    function token(label, kind) {
      const fx = $('.c-fx');
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      if (kind === 'card') {
        el.innerHTML = `<rect x="${-L.cardW / 2}" y="${-L.cardH / 2}" width="${L.cardW}" height="${L.cardH}" rx="8" class="c-card"/><text y="${L.cardFs * 0.35}" text-anchor="middle" class="c-cardt" style="font-size:${L.cardFs}px">${esc(label)}</text>`;
      } else {
        el.innerHTML = `<circle r="${L.tokR}" class="c-tok" filter="url(#glow-${uid})"/><text y="${L.tokFs * 0.36}" text-anchor="middle" class="c-tokt" style="font-size:${L.tokFs}px">${esc(label)}</text>`;
      }
      fx.appendChild(el);
      return el;
    }
    async function fly(from, to, label, ms, kind, arc) {
      if (!L || reduced() || ms <= 0) return;
      const el = token(label, kind);
      const lift = arc == null ? (L.wide ? -70 : -45) : arc;
      const cx = (from[0] + to[0]) / 2, cy = Math.min(from[1], to[1]) + lift;
      await anim(ms, (t) => {
        const x = (1 - t) * (1 - t) * from[0] + 2 * (1 - t) * t * cx + t * t * to[0];
        const y = (1 - t) * (1 - t) * from[1] + 2 * (1 - t) * t * cy + t * t * to[1];
        const sc = kind === 'card' ? 1 - 0.45 * t : 0.6 + 0.4 * Math.min(1, t * 3);
        el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${sc.toFixed(3)})`);
      });
      el.remove();
    }
    function flash(sel) {
      const el = $(sel);
      if (!el || reduced()) return;
      el.classList.remove('flash'); void el.getBBox(); el.classList.add('flash');
      setTimeout(() => el.classList.remove('flash'), 700);
    }
    function mouth(kind) { if (L) $('.c-mouth').setAttribute('d', MOUTH[kind](L.mouth[0], L.mouth[1], L.wide ? 1 : 0.7)); }
    function look(dir) {
      if (!L) return;
      const dx = { left: -0.4, right: 0.4, down: 0, center: 0 }[dir] * L.eyeR, dy = dir === 'down' ? 0.35 * L.eyeR : 0;
      svgHost.querySelectorAll('.c-pupil').forEach((p, i) => { p.setAttribute('cx', L.eyes[i][0] + dx); p.setAttribute('cy', L.eyes[i][1] + dy); });
    }
    function phase(k) {
      root.querySelectorAll('.chip-phases span').forEach((s, i) => s.classList.toggle('on', i === k));
    }
    function say(html) { const p = root.querySelector('.chip-say'); if (p) p.innerHTML = html; }
    function aluText(t) { if (L) $('.c-expr').textContent = t; }
    function spin(on) { if (L) $('.c-gear').classList.toggle('spin', on && !reduced()); }
    async function moveFinger(to) {
      const from = S.pc;
      const y0 = L.lineY(from), y1 = L.lineY(Math.min(to, S.code.length - 1));
      await anim(D(320), (t) => { $('.c-finger').setAttribute('transform', `translate(0 ${(y0 + (y1 - y0) * t).toFixed(1)})`); });
      S.pc = to;
      placeFinger(to);
    }
    function confetti() {
      if (reduced() || !L) return;
      const fx = $('.c-fx'), [cx, cy] = pt.face(), cols = ['c-k1', 'c-k2', 'c-k3', 'c-k4'];
      const bits = Array.from({ length: 22 }, (_, i) => {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        el.setAttribute('width', L.wide ? 9 : 6); el.setAttribute('height', L.wide ? 5 : 4);
        el.setAttribute('class', cols[i % 4]);
        fx.appendChild(el);
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, v = (L.wide ? 260 : 170) * (0.6 + Math.random() * 0.6);
        return { el, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * 360 };
      });
      anim(1100, (t) => {
        const tt = t * 1.1;
        bits.forEach((b) => b.el.setAttribute('transform', `translate(${(cx + b.vx * tt).toFixed(1)} ${(cy + b.vy * tt + 300 * tt * tt).toFixed(1)}) rotate(${b.r + 500 * tt})`));
      }).then(() => bits.forEach((b) => b.el.remove()));
    }

    // execute one instruction with its animation (no fetch/decode)
    async function exec(ins) {
      const my = gen;
      const [op, a, b] = ins;
      let next = S.pc + 1;
      if (op === 'MOV') {
        look('left'); await fly(pt.line(S.pc), pt.reg(a), b, D(650));
        S.reg[a] = b; flash(`[data-hit="r${a}"]`);
        say(`Hand ${a} now holds <b>${b}</b>.`);
      } else if (op === 'LOAD') {
        look('right'); flash(`[data-hit="m${b}"]`);
        await fly(pt.mem(b), pt.reg(a), S.mem[b], D(800));
        S.reg[a] = S.mem[b]; flash(`[data-hit="r${a}"]`);
        say(`Box ${b} had <b>${S.mem[b]}</b>, so now hand ${a} holds ${S.mem[b]}. (The box keeps its number too.)`);
      } else if (op === 'STORE') {
        look('right');
        await fly(pt.reg(a), pt.mem(b), S.reg[a], D(800));
        S.mem[b] = S.reg[a]; flash(`[data-hit="m${b}"]`);
        say(`Box ${b} now holds <b>${S.reg[a]}</b>.`);
      } else if (op === 'ADD' || op === 'DEC') {
        look('down');
        const x = S.reg[a], y = op === 'ADD' ? S.reg[b] : 1, r = op === 'ADD' ? x + y : x - 1;
        const off = L.wide ? 40 : 30;
        if (op === 'ADD') await Promise.all([fly(pt.reg(b), pt.alu(off), y, D(650), 'num', 20), fly(pt.reg(a), pt.alu(-off), x, D(650), 'num', 20)]);
        else await fly(pt.reg(a), pt.alu(), x, D(650), 'num', 20);
        if (my !== gen) return;
        aluText(op === 'ADD' ? `${x} + ${y}` : `${x} − 1`); spin(true); mouth('o');
        await sleep(D(650));
        if (my !== gen) return;
        aluText(op === 'ADD' ? `${x} + ${y} = ${r}` : `${x} − 1 = ${r}`); spin(false);
        await fly(pt.alu(), pt.reg(a), r, D(600), 'num', 20);
        S.reg[a] = r; S.zf = r === 0; flash(`[data-hit="r${a}"]`); mouth('smile');
        say(op === 'ADD' ? `The calculator says ${x} + ${y} = <b>${r}</b>, and hand ${a} keeps it.`
          : `${x} − 1 = <b>${r}</b>. ${S.zf ? 'That\'s zero, so my antenna lights up! 💡' : 'Not zero, so my antenna stays dark.'}`);
      } else if (op === 'JNZ') {
        if (!S.zf) {
          next = a; S.jumps++;
          say(`Antenna is dark → <b>jump!</b> The finger goes back to line ${a}. That's a loop. 🔁`);
          await drawJump(S.pc, a);
        } else say('Antenna is lit → <b>no jump</b>. The finger just moves to the next line.');
      } else if (op === 'HALT') {
        S.halted = true; next = S.pc; mouth('grin'); look('center'); confetti();
        say(opt.onHaltSay ? opt.onHaltSay(S) : 'HALT: all done! 🎉');
      }
      if (my !== gen) return;
      render();
      if (next !== S.pc) await moveFinger(next);
    }
    async function drawJump(from, to) {
      const p = $('.c-jump');
      const x = L.prog.x + (L.wide ? 6 : 3), y0 = L.lineY(from), y1 = L.lineY(to), bend = L.wide ? 34 : 22;
      p.setAttribute('d', `M${x + 20} ${y0} C${x - bend} ${y0} ${x - bend} ${y1} ${x + 20} ${y1}`);
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      await anim(D(450), (t) => { p.style.strokeDashoffset = len * (1 - t); });
      setTimeout(() => { p.style.strokeDashoffset = len; }, D(900) + 200);
    }

    // one full instruction cycle: fetch, decode, execute
    async function step() {
      if (S.halted || !L) return false;
      const my = gen;
      const ins = S.code[S.pc];
      phase(0); look('left'); mouth('smile');
      say(`<b>Fetch:</b> my finger is on line ${S.pc}, so I grab <code>${esc(asmText(ins))}</code>.`);
      placeFinger(S.pc);
      await fly(pt.line(S.pc), pt.face(), asmText(ins), D(700), 'card', L.wide ? -40 : -30);
      if (my !== gen) return false;
      phase(1); look('center'); mouth('o');
      say(`<b>Decode:</b> “${esc(kidText(ins))}”`);
      await sleep(D(S.read));
      if (my !== gen) return false;
      phase(2); mouth('smile');
      await exec(ins);
      if (my !== gen) return false;
      S.done++;
      if (opt.onStep) opt.onStep(S);
      return !S.halted;
    }

    function load(prog) {
      gen++;
      S.code = prog.code; S.mem = prog.mem.slice(); S.reg = { A: 0, B: 0, C: 0 };
      S.pc = 0; S.zf = false; S.halted = false; S.done = 0; S.jumps = 0;
      L = null; build();
      phase(-1); aluText('ready'); spin(false); mouth('smile'); look('center');
      const j = $('.c-jump'); if (j) j.setAttribute('d', '');
    }
    if ('ResizeObserver' in window) { ro = new ResizeObserver(() => { const keep = gen; build(); gen = keep; }); ro.observe(host); }

    return {
      S, root, load, step, exec, render, say, phase, mouth, look, flash, aluText, moveFinger, placeFinger, confetti, fly, pt,
      cancel: () => { gen++; const fx = $('.c-fx'); if (fx) fx.innerHTML = ''; spin(false); },
      gen: () => gen,
      el: (sel) => $(sel), all: (sel) => svgHost.querySelectorAll(sel),
      focus(parts) {
        root.classList.toggle('focus', !!(parts && parts.length));
        svgHost.querySelectorAll('[data-part]').forEach((p) => p.classList.toggle('on', !!parts && parts.includes(p.dataset.part)));
      },
      setSpeed(v) { S.speed = v; },
    };
  }

  function onVisible(el, fn, offFn) {
    if (!('IntersectionObserver' in window)) return fn();
    new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? fn() : offFn && offFn())), { threshold: 0.25 }).observe(el);
  }

  const builders = {};

  // ── 1. Hero: Chip adds two fresh numbers, over and over ────────────────
  builders.hero = (host, fig) => {
    const st = Stage(host, { read: 1300, onHaltSay: (S) => `Done! Box 2 now holds <b>${S.mem[2]}</b> = ${S.mem[0]} + ${S.mem[1]}. 🎉 Again, with new numbers…` });
    const bar = document.createElement('div');
    bar.className = 'chip-bar';
    bar.innerHTML = '<button type="button" class="chip-btn primary" data-k="play">▶ Play</button><span class="chip-hint">Chip is adding two numbers, the way every computer does: one tiny step at a time.</span>';
    host.appendChild(bar);
    const btn = bar.querySelector('[data-k="play"]');
    let playing = false, visible = false, loopId = 0;
    const fresh = () => st.load(ADD_PROG(rnd(1, 9), rnd(1, 9)));
    fresh();
    st.say('Hi, I\'m <b>Chip</b>, the CPU. Watch me add two numbers using nothing but tiny steps.');
    async function loop(id) {
      while (playing && id === loopId) {
        if (!visible) { await sleep(400); continue; }
        const more = await st.step();
        if (!more && st.S.halted) { await sleep(2600); if (id === loopId && playing) fresh(); }
      }
    }
    function setPlaying(p) {
      playing = p; btn.textContent = p ? '❚❚ Pause' : '▶ Play';
      if (p) { loopId++; if (st.S.halted) fresh(); loop(loopId); } else { loopId++; st.cancel(); st.render(); }
    }
    btn.addEventListener('click', () => setPlaying(!playing));
    onVisible(fig, () => { visible = true; if (!playing && !reduced() && !fig.dataset.started) { fig.dataset.started = 1; setPlaying(true); } }, () => { visible = false; });
  };

  // ── 2. Story: scroll-driven tour of the machine ────────────────────────
  builders.story = (host, fig) => {
    const st = Stage(host, { bubble: false });
    const steps = [...fig.querySelectorAll('.story-steps > li')];
    const base = () => st.load(ADD_PROG(2, 3));
    base();
    const acts = [
      async () => { st.focus(['chip', 'antenna', 'regs', 'alu']); st.mouth('grin'); await sleep(900); st.mouth('smile'); },
      async () => {
        st.focus(['regs']);
        const vals = { A: 7, B: 1, C: 4 };
        for (const r of ['A', 'B', 'C']) { const [x, y] = st.pt.reg(r); await st.fly([x, y - 140], [x, y], vals[r], 550, 'num', 0); st.S.reg[r] = vals[r]; st.render(); st.flash(`[data-hit="r${r}"]`); }
      },
      async () => { st.focus(['mem']); for (let i = 0; i < 8; i++) { st.flash(`[data-hit="m${i}"]`); await sleep(90); } },
      async () => { st.focus(['prog']); st.all('.c-line').forEach((l, i) => { l.style.animationDelay = i * 0.12 + 's'; l.classList.remove('appear'); void l.getBBox(); l.classList.add('appear'); }); },
      async () => { st.focus(['prog', 'finger']); st.setSpeed(0.6); for (let i = 1; i <= 3; i++) { await sleep(450); await st.moveFinger(i); } st.setSpeed(1); },
      async () => {
        st.focus(['alu', 'antenna', 'regs']);
        st.S.reg.C = 1; st.render(); await sleep(400);
        st.setSpeed(0.8); await st.exec(['DEC', 'C']); st.setSpeed(1);
      },
      async () => { st.focus(null); st.setSpeed(1.6); while (await st.step()); st.setSpeed(1); },
    ];
    let current = -1;
    function go(k) {
      if (k === current) return;
      current = k;
      steps.forEach((s, i) => s.classList.toggle('on', i === k));
      st.cancel(); base();
      if (k >= 0 && acts[k]) acts[k]();
    }
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) go(steps.indexOf(e.target)); });
    }, { rootMargin: '-55% 0px -30% 0px' });
    steps.forEach((s) => io.observe(s));
    st.focus(['chip', 'antenna', 'regs', 'alu']);
  };

  // ── 3. Game: you are the CPU ───────────────────────────────────────────
  builders.play = (host) => {
    const panel = document.createElement('div');
    panel.className = 'game-top';
    const stageHost = document.createElement('div');
    host.innerHTML = '';
    host.appendChild(panel);
    host.appendChild(stageHost);
    const st = Stage(stageHost, { interactive: true, live: true, label: 'Game board: tap the boxes, hands and calculator to carry out each assembly instruction.' });
    let x, y, t0, mistakes, k, busy, hintTimer;
    const need = (ins) => {
      const [op, a, b] = ins;
      return { LOAD: [`m${b}`, `r${a}`], STORE: [`r${a}`, `m${b}`], ADD: ['alu'], HALT: ['chip'] }[op];
    };
    const tell = (ins) => {
      const [op, a, b] = ins;
      return {
        LOAD: `Copy <b>box ${b}</b> into <b>hand ${a}</b>.<br><span>Tap box ${b}, then tap hand ${a}.</span>`,
        STORE: `Put hand ${a}'s number into box ${b}.<br><span>Tap hand ${a}, then tap box ${b}.</span>`,
        ADD: `Add hand ${b} to hand ${a}.<br><span>Tap the belly calculator.</span>`,
        HALT: 'Stop, you\'re done!<br><span>Tap Chip\'s face.</span>',
      }[op];
    };
    const nameOf = (id) => (id[0] === 'm' ? `box ${id.slice(1)}` : id[0] === 'r' ? `hand ${id.slice(1)}` : id === 'alu' ? 'the calculator' : 'Chip\'s face');
    function start() {
      x = rnd(2, 9); y = rnd(2, 9); t0 = 0; mistakes = 0; k = 0; busy = false;
      st.load(ADD_PROG(x, y));
      st.say(`Your turn to be the CPU! Boxes 0 and 1 hold <b>${x}</b> and <b>${y}</b>. Follow the recipe to add them.`);
      task();
    }
    function task() {
      const ins = st.S.code[st.S.pc];
      clearTimeout(hintTimer);
      st.all('[data-hit]').forEach((h) => h.classList.remove('hint', 'picked'));
      st.placeFinger(st.S.pc);
      panel.innerHTML = `<div class="game-line"><span class="game-n">Line ${st.S.pc} of ${st.S.code.length - 1}</span><code>${esc(asmText(ins))}</code></div>` +
        `<p class="game-do">${tell(ins)}</p><div class="game-dots">${st.S.code.map((_, i) => `<i class="${i < st.S.pc ? 'done' : i === st.S.pc ? 'cur' : ''}"></i>`).join('')}</div>`;
      hintTimer = setTimeout(hint, 6000);
    }
    function hint() { const id = need(st.S.code[st.S.pc])[k]; const el = st.el(`[data-hit="${id}"]`); if (el) el.classList.add('hint'); }
    st.root.addEventListener('click', async (e) => {
      const hit = e.target.closest && e.target.closest('[data-hit]');
      if (!hit || busy || st.S.halted) return;
      if (!t0) t0 = performance.now();
      const ins = st.S.code[st.S.pc], want = need(ins), id = hit.dataset.hit;
      if (id !== want[k]) {
        mistakes++;
        hit.classList.remove('nope'); void hit.getBBox(); hit.classList.add('nope');
        st.say(`Oops, that's ${nameOf(id)}. The recipe wants <b>${nameOf(want[k])}</b> now. (It's glowing.)`);
        hint();
        return;
      }
      hit.classList.add('picked'); hit.classList.remove('hint');
      k++;
      if (k < want.length) { clearTimeout(hintTimer); hintTimer = setTimeout(hint, 6000); return; }
      busy = true; k = 0; clearTimeout(hintTimer);
      st.setSpeed(1.5);
      if (ins[0] === 'HALT') {
        const secs = (performance.now() - t0) / 1000;
        st.S.halted = true; st.mouth('grin'); st.confetti();
        finish(secs);
      } else {
        await st.exec(ins);
        busy = false;
        task();
      }
    });
    function finish(secs) {
      const n = st.S.code.length; // 5 instructions, one per clock tick in this simplification
      const chipNs = (n / 3e9) * 1e9;
      const ratio = secs / (n / 3e9);
      const words = ratio >= 1e9 ? `${(ratio / 1e9).toFixed(1)} billion` : `${fmt(Math.round(ratio / 1e6))} million`;
      st.say(`You did it! Box 2 holds <b>${st.S.mem[2]}</b> = ${x} + ${y}. ${mistakes ? `(${mistakes} wrong tap${mistakes > 1 ? 's' : ''}, no problem.)` : 'Not a single wrong tap!'}`);
      panel.innerHTML = '<div class="game-done"><h4>🏁 You just ran assembly by hand!</h4><div class="game-tiles">' +
        `<div><b>${secs.toFixed(1)} s</b><span>your time for ${n} instructions</span></div>` +
        `<div><b>${chipNs.toFixed(1)} ns</b><span>a 3 GHz chip, at one instruction per tick</span></div>` +
        `<div><b>${words}×</b><span>how much faster the chip is</span></div></div>` +
        '<button type="button" class="chip-btn primary" data-k="again">↺ Play again (new numbers)</button></div>';
      panel.querySelector('[data-k="again"]').addEventListener('click', start);
    }
    start();
  };

  // ── 4. Turbo: the multiply loop at three speeds ────────────────────────
  builders.turbo = (host) => {
    const top = document.createElement('div');
    top.className = 'turbo-top';
    top.innerHTML =
      '<div class="turbo-nums"><span>Multiply</span>' +
      '<span class="stepper"><button type="button" data-k="x-" aria-label="smaller x">−</button><b data-k="x">3</b><button type="button" data-k="x+" aria-label="bigger x">+</button></span><span>×</span>' +
      '<span class="stepper"><button type="button" data-k="y-" aria-label="smaller y">−</button><b data-k="y">4</b><button type="button" data-k="y+" aria-label="bigger y">+</button></span></div>' +
      '<div class="turbo-speed" role="group" aria-label="Speed"><button type="button" data-s="0.7" class="on">🐢 Snail</button><button type="button" data-s="3">🐇 Rabbit</button><button type="button" data-s="inf">⚡ Lightning</button></div>' +
      '<div class="turbo-go"><button type="button" class="chip-btn primary" data-k="run">▶ Run</button><button type="button" class="chip-btn" data-k="reset">↺ Reset</button></div>';
    const stageHost = document.createElement('div');
    const meters = document.createElement('div');
    meters.className = 'turbo-meters';
    host.innerHTML = '';
    host.append(top, stageHost, meters);
    let x = 3, y = 4, speed = 0.7, running = false, runId = 0;
    const st = Stage(stageHost, {
      read: 900,
      onStep: () => meter(),
      onHaltSay: (S) => `HALT! Box 0 holds <b>${S.mem[0]}</b> = ${x} × ${y}. I can't multiply, so I added ${x} into hand A, ${y} times over. 🎉`,
    });
    const q = (k) => top.querySelector(`[data-k="${k}"]`);
    function meter() {
      const S = st.S;
      meters.innerHTML = `<div><b>${S.done}</b><span>instructions run</span></div><div><b>${S.jumps}</b><span>jumps back (loop rounds − 1)</span></div>` +
        `<div><b>${S.reg.A}</b><span>hand A so far (goal ${x * y})</span></div><div><b>${3 + 3 * y + 2}</b><span>instructions this program needs</span></div>`;
    }
    function reset() {
      runId++; running = false; q('run').textContent = '▶ Run';
      st.load(MUL_PROG(x, y)); meter();
      q('x').textContent = x; q('y').textContent = y;
      st.say(`I only know how to <b>add</b>. To do ${x} × ${y}, I'll add ${x} again and again, counting down hand C from ${y}. Press Run.`);
    }
    async function run(id) {
      while (running && id === runId) {
        st.setSpeed(speed);
        const more = await st.step();
        if (speed === Infinity) await sleep(70);
        if (!more) { running = false; q('run').textContent = '▶ Run'; break; }
      }
    }
    q('run').addEventListener('click', () => {
      if (st.S.halted) reset();
      running = !running; runId++;
      q('run').textContent = running ? '❚❚ Pause' : '▶ Run';
      if (running) run(runId); else { st.cancel(); st.render(); }
    });
    q('reset').addEventListener('click', reset);
    ['x', 'y'].forEach((v) => ['-', '+'].forEach((s) => q(v + s).addEventListener('click', () => {
      const d = s === '+' ? 1 : -1;
      if (v === 'x') x = Math.max(1, Math.min(9, x + d)); else y = Math.max(1, Math.min(9, y + d));
      reset();
    })));
    top.querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => {
      top.querySelectorAll('[data-s]').forEach((o) => o.classList.toggle('on', o === b));
      speed = b.dataset.s === 'inf' ? Infinity : +b.dataset.s;
      st.setSpeed(speed);
    }));
    reset();
  };

  // ── 5. Bits: flip switches, read a real x86-64 instruction ─────────────
  // Decodes "op r/m32, r32" in register form (ModRM byte 0b11 reg rm), checked against GNU objdump.
  const OPS = { 0x01: ['add', '+'], 0x29: ['sub', '−'], 0x89: ['mov', null], 0x31: ['xor', '^'], 0x21: ['and', '&'], 0x09: ['or', '|'] };
  const REG = ['eax', 'ecx', 'edx', 'ebx', 'esp', 'ebp', 'esi', 'edi'];
  function decode(b0, b1) {
    const op = OPS[b0];
    if (!op) return null;
    if ((b1 >> 6) !== 3) return { partial: true, name: op[0] };
    const src = REG[(b1 >> 3) & 7], dst = REG[b1 & 7];
    const asm = `${op[0]} ${dst}, ${src}`;
    let c;
    if (op[0] === 'mov') c = `${dst} = ${src}`;
    else if (op[0] === 'xor' && src === dst) c = `${dst} = 0  (a classic trick: anything XOR itself is 0)`;
    else if (op[0] === 'sub' && src === dst) c = `${dst} = 0`;
    else c = `${dst} = ${dst} ${op[1]} ${src}`;
    return { asm, c };
  }
  builders.bits = (host) => {
    let bits = [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0]; // 01 D8 = add eax, ebx
    const presets = [['add eax, ebx', 0x01, 0xd8], ['sub eax, ebx', 0x29, 0xd8], ['mov eax, ebx', 0x89, 0xd8], ['xor eax, eax', 0x31, 0xc0], ['add ebx, eax', 0x01, 0xc3]];
    host.innerHTML =
      '<div class="bits-presets"><span>Try:</span>' + presets.map((p, i) => `<button type="button" class="chip-btn" data-p="${i}">${p[0]}</button>`).join('') + '<button type="button" class="chip-btn" data-p="r">🎲 random</button></div>' +
      '<div class="bits-bytes">' + [0, 1].map((B) => `<div class="bits-byte"><div class="bits-cap">byte ${B + 1}</div><div class="bits-row">` +
        Array.from({ length: 8 }, (_, i) => `<button type="button" class="bit" data-i="${B * 8 + i}" aria-label="byte ${B + 1}, bit worth ${128 >> i}"><span class="bit-v"></span><span class="bit-sw"><span></span></span><span class="bit-w">${128 >> i}</span></button>`).join('') +
        `</div><div class="bits-hex" data-h="${B}"></div></div>`).join('') + '</div>' +
      '<div class="bits-out"><div class="bits-ladder">' +
      '<div><span>Machine code</span><b data-o="hex"></b></div><div class="arr">→</div>' +
      '<div><span>Assembly</span><b data-o="asm"></b></div><div class="arr">→</div>' +
      '<div><span>What it does</span><b data-o="c"></b></div></div><p class="bits-note" data-o="note"></p></div>';
    const byte = (B) => bits.slice(B * 8, B * 8 + 8).reduce((a, v) => a * 2 + v, 0);
    const hx = (v) => v.toString(16).toUpperCase().padStart(2, '0');
    function set(b0, b1) { bits = [...Array.from({ length: 8 }, (_, i) => (b0 >> (7 - i)) & 1), ...Array.from({ length: 8 }, (_, i) => (b1 >> (7 - i)) & 1)]; draw(); }
    function draw() {
      host.querySelectorAll('.bit').forEach((b) => { const v = bits[+b.dataset.i]; b.classList.toggle('on', !!v); b.setAttribute('aria-pressed', v ? 'true' : 'false'); b.querySelector('.bit-v').textContent = v; });
      const b0 = byte(0), b1 = byte(1);
      [b0, b1].forEach((v, B) => { host.querySelector(`[data-h="${B}"]`).innerHTML = `= ${v} <span>(hex ${hx(v)})</span>`; });
      host.querySelector('[data-o="hex"]').textContent = `${hx(b0)} ${hx(b1)}`;
      const d = decode(b0, b1), out = (k, v) => { host.querySelector(`[data-o="${k}"]`).innerHTML = v; };
      host.querySelector('.bits-out').classList.toggle('ok', !!(d && !d.partial));
      if (d && !d.partial) {
        out('asm', esc(d.asm)); out('c', esc(d.c));
        out('note', `✅ Real x86-64 machine code. Your Intel or AMD laptop would run these two bytes as <code>${esc(d.asm)}</code>.`);
      } else if (d) {
        out('asm', `${d.name} …`); out('c', '?');
        out('note', `Byte 1 means <b>${d.name}</b>, but byte 2 doesn't name two registers. Turn on its first two switches (128 and 64).`);
      } else {
        out('asm', '?'); out('c', '?');
        out('note', 'Real x86-64 has hundreds of opcodes; this little decoder knows six (add, sub, mov, xor, and, or). Set byte 1 to 1, 9, 33, 41, 49 or 137, or pick a preset.');
      }
    }
    host.addEventListener('click', (e) => {
      const b = e.target.closest('.bit');
      if (b) { bits[+b.dataset.i] ^= 1; return draw(); }
      const p = e.target.closest('[data-p]');
      if (!p) return;
      if (p.dataset.p === 'r') { const ks = Object.keys(OPS); set(+ks[rnd(0, ks.length - 1)], 0xc0 | rnd(0, 63)); } else { const pr = presets[+p.dataset.p]; set(pr[1], pr[2]); }
    });
    draw();
  };

  // ── 6. One addition, two CPU families (real compiler output) ───────────
  builders.isa = (host) => {
    const card = (cls, t, sub, code, regs, note) =>
      `<div class="isa-card ${cls}"><h4>${t}</h4><p class="sub">${sub}</p><pre>${esc(code)}</pre><div class="isa-regs">${regs}</div><p>${note}</p></div>`;
    host.innerHTML = '<div class="isa-wrap">' +
      card('x86', '💻 x86-64 <small>Intel, AMD</small>', 'GCC 13.3, -O2', 'endbr64\nlea  eax, [rdi+rsi]\nret',
        '<b>16</b> hands (general-purpose registers)', 'Inputs arrive in rdi and rsi; the answer goes back in eax. Instructions are 1 to 15 bytes long.') +
      '<div class="isa-vs">same<br>idea</div>' +
      card('arm', '📱 ARM64 <small>phones, Apple M-series</small>', 'Clang 18, -O2', 'add  w0, w1, w0\nret',
        '<b>31</b> hands (general-purpose registers)', 'Inputs arrive in w0 and w1; the answer goes back in w0. Every instruction is exactly 4 bytes.') +
      '</div>';
  };

  // ── 7. Where assembly still shows up ───────────────────────────────────
  builders.uses = (host) => {
    const c = (ico, t, d) => `<div class="use-card"><div class="ico" aria-hidden="true">${ico}</div><h4>${t}</h4><p>${d}</p></div>`;
    host.innerHTML = '<div class="use-grid">' +
      c('🔍', 'Peeking at the compiler', 'Checking why a hot loop is slow, or whether it was vectorized.') +
      c('🐞', 'Debugging crashes', 'A crash in a debugger without source code shows you assembly.') +
      c('🔌', 'The very first code', 'Bootloaders, OS kernels and tiny microcontrollers still need a little.') +
      c('🚀', 'The fastest loops', 'Video codecs and crypto libraries hand-tune a few critical routines.') +
      '</div>';
  };

  document.querySelectorAll('figure.hv[data-hv]').forEach((fig) => {
    const build = builders[fig.dataset.hv];
    const host = fig.querySelector('.hv-canvas');
    if (!build || !host) return;
    try { build(host, fig); fig.classList.add('ready'); } catch (e) { console.error('asm figure', fig.dataset.hv, e); }
  });
})();
