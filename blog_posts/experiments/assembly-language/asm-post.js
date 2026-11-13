// Figures and the tiny-CPU simulator for /blog_posts/assembly-language-explained-simply.html.
// Each <figure class="hv" data-hv="name"> holds a text fallback; the matching builder below
// replaces it with a drawing or widget. The simulator really executes its toy instruction set
// (fetch, decode, execute) on the registers and memory you see; nothing is pre-recorded.
// Real x86-64 bytes and compiler output were produced with GNU as/ld 2.42, GCC 13.3 and Clang 18.
(function () {
  'use strict';

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const builders = {};

  // ── 1. The ladder: C -> assembly -> machine code -> bits ───────────────
  builders.ladder = (el) => {
    const rung = (who, sub, what, hot) =>
      `<div class="asm-rung${hot ? ' hot' : ''}"><div class="who"><b>${who}</b>${sub}</div><div class="what">${what}</div></div>`;
    const step = (s) => `<div class="asm-step">${s}</div>`;
    el.innerHTML = '<div class="asm-ladder">' +
      rung('C', 'what a person writes', 'a = a + b;') +
      step('a compiler translates it') +
      rung('Assembly (x86-64)', 'one tiny step, in words', 'add eax, ebx', true) +
      step('an assembler turns words into numbers') +
      rung('Machine code', 'the same step as bytes (hex)', '01 D8') +
      step('which is really just on/off switches') +
      rung('Bits', 'what the chip actually sees', '00000001 11011000') +
      '</div>';
  };

  // ── 2. The kitchen: hands = registers, shelf = memory, recipe = program ─
  builders.kitchen = (el) => {
    const arrow = (x1, y1, x2, y2, c) => {
      const a = Math.atan2(y2 - y1, x2 - x1), s = 9;
      const hx = x2 - s * Math.cos(a - 0.45), hy = y2 - s * Math.sin(a - 0.45);
      const kx = x2 - s * Math.cos(a + 0.45), ky = y2 - s * Math.sin(a + 0.45);
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="arrow${c}"/><path d="M${x2} ${y2}L${hx.toFixed(1)} ${hy.toFixed(1)}L${kx.toFixed(1)} ${ky.toFixed(1)}Z" class="head${c}"/>`;
    };
    let g = '';
    // recipe card (program) with a finger (program counter)
    g += '<rect x="10" y="40" width="170" height="200" rx="10" class="box"/>';
    g += '<text x="95" y="28" text-anchor="middle" class="lbl">Recipe card</text>';
    g += '<text x="95" y="258" text-anchor="middle" class="mut">= the program</text>';
    const lines = ['LOAD A, [0]', 'LOAD B, [1]', 'ADD A, B', 'STORE A, [2]', 'HALT'];
    lines.forEach((l, i) => {
      g += `<text x="44" y="${76 + i * 34}" class="mono" style="font-size:13px">${l}</text>`;
    });
    g += '<path d="M18 ${y} l16 0 l-6 -6 M34 ${y} l-6 6" class="arrow-a"/>'.replace(/\$\{y\}/g, 76 + 2 * 34 - 5);
    g += `<text x="16" y="${76 + 2 * 34 + 14}" class="mut" style="font-size:10px">finger</text>`;

    // the CPU: three hands (registers) and a calculator (ALU)
    g += '<rect x="230" y="40" width="190" height="200" rx="14" class="box" style="stroke:var(--accent);stroke-width:2"/>';
    g += '<text x="325" y="28" text-anchor="middle" class="lbl">The CPU (the cook)</text>';
    ['A', 'B', 'C'].forEach((r, i) => {
      const x = 245 + i * 60;
      g += `<rect x="${x}" y="62" width="50" height="58" rx="10" class="box-a"/>`;
      g += `<text x="${x + 25}" y="84" text-anchor="middle" class="mut">hand</text>`;
      g += `<text x="${x + 25}" y="108" text-anchor="middle" class="lbl t-a" style="font-size:20px">${r}</text>`;
    });
    g += '<text x="325" y="140" text-anchor="middle" class="mut">= registers</text>';
    g += '<rect x="265" y="160" width="120" height="50" rx="8" class="box"/>';
    g += '<text x="325" y="183" text-anchor="middle" class="lbl">+ − calculator</text>';
    g += '<text x="325" y="201" text-anchor="middle" class="mut">= the ALU</text>';

    // the shelf of numbered boxes (memory)
    g += '<text x="560" y="28" text-anchor="middle" class="lbl">Shelf of boxes</text>';
    for (let i = 0; i < 8; i++) {
      const x = 480 + (i % 4) * 41, y = 50 + Math.floor(i / 4) * 92;
      const v = [2, 3, 5, 0, 0, 0, 0, 0][i];
      g += `<rect x="${x}" y="${y}" width="36" height="52" rx="6" class="box-m"/>`;
      g += `<text x="${x + 18}" y="${y + 33}" text-anchor="middle" class="mono" style="font-size:18px">${v}</text>`;
      g += `<text x="${x + 18}" y="${y + 68}" text-anchor="middle" class="mut" style="font-size:11px">box ${i}</text>`;
    }
    g += '<text x="560" y="258" text-anchor="middle" class="mut">= memory (RAM)</text>';

    // data paths
    g += arrow(475, 95, 425, 95, '-m');
    g += '<text x="450" y="84" text-anchor="middle" class="mut t-m" style="font-size:11px">LOAD</text>';
    g += arrow(425, 190, 475, 190, '-m');
    g += '<text x="450" y="208" text-anchor="middle" class="mut t-m" style="font-size:11px">STORE</text>';
    g += arrow(183, 140, 226, 140, '');
    g += '<text x="204" y="130" text-anchor="middle" class="mut" style="font-size:11px">read</text>';

    el.innerHTML =
      `<div class="hv-scroll"><div style="min-width:560px"><svg viewBox="0 0 650 270" role="img" aria-label="A kitchen picture of a computer: a recipe card with five assembly lines and a finger on line 3, a cook with three hands named A, B and C plus a calculator, and a shelf of eight numbered boxes holding 2, 3 and 5. Arrows show LOAD moving a number from a box to a hand and STORE moving it back.">${g}</svg></div></div>` +
      '<div class="asm-gloss">' +
      '<div><b>Hands → registers.</b> A few tiny, super-fast slots inside the CPU.</div>' +
      '<div><b>Boxes → memory.</b> Lots of numbered slots, but a walk away.</div>' +
      '<div><b>Recipe → program.</b> One small step per line.</div>' +
      '<div><b>Finger → program counter.</b> Remembers which line is next.</div>' +
      '</div>';
  };

  // ── 3. The tiny CPU simulator ───────────────────────────────────────────
  // Toy instruction set (made up for teaching, shaped like real ones):
  //   MOV r, n   LOAD r, [a]   STORE r, [a]   ADD r, r   DEC r   JNZ line   HALT
  // ADD and DEC set the zero light (like the zero flag on x86 and ARM); JNZ reads it.
  const PROGRAMS = {
    add: {
      name: 'Add two numbers',
      build: (x, y) => ({
        mem: [x, y, 0, 0, 0, 0, 0, 0],
        code: [['LOAD', 'A', 0], ['LOAD', 'B', 1], ['ADD', 'A', 'B'], ['STORE', 'A', 2], ['HALT']],
      }),
    },
    mul: {
      name: 'Multiply by adding (loop)',
      build: (x, y) => ({
        mem: [0, 0, 0, 0, 0, 0, 0, 0],
        code: [['MOV', 'A', 0], ['MOV', 'B', x], ['MOV', 'C', y], ['ADD', 'A', 'B'], ['DEC', 'C'], ['JNZ', 3], ['STORE', 'A', 0], ['HALT']],
      }),
    },
  };
  const asmText = (ins) => {
    const [op, a, b] = ins;
    switch (op) {
      case 'MOV': return `MOV ${a}, ${b}`;
      case 'LOAD': return `LOAD ${a}, [${b}]`;
      case 'STORE': return `STORE ${a}, [${b}]`;
      case 'ADD': return `ADD ${a}, ${b}`;
      case 'DEC': return `DEC ${a}`;
      case 'JNZ': return `JNZ ${a}`;
      default: return op;
    }
  };
  const kidText = (ins) => {
    const [op, a, b] = ins;
    switch (op) {
      case 'MOV': return `Put the number ${b} in hand ${a}.`;
      case 'LOAD': return `Walk to box ${b}, look at its number, and hold a copy in hand ${a}.`;
      case 'STORE': return `Put a copy of hand ${a}'s number into box ${b}.`;
      case 'ADD': return `Add hand ${b} to hand ${a}. Hand ${a} keeps the answer.`;
      case 'DEC': return `Take 1 away from hand ${a}. If that makes 0, switch on the zero light.`;
      case 'JNZ': return `Is the zero light off? Then move the finger back to line ${a}. If it's on, just go to the next line.`;
      default: return 'Stop. All done!';
    }
  };

  builders.sim = (el) => {
    el.innerHTML =
      '<div class="cpu-controls">' +
      '<label>Program <select data-k="prog">' + Object.entries(PROGRAMS).map(([k, p]) => `<option value="${k}">${p.name}</option>`).join('') + '</select></label>' +
      '<label>x <input type="number" data-k="x" min="1" max="9" value="2"></label>' +
      '<label>y <input type="number" data-k="y" min="1" max="9" value="3"></label>' +
      '<button type="button" class="hv-btn primary" data-k="step">Step ▸</button>' +
      '<button type="button" class="hv-btn" data-k="run">Run ▶</button>' +
      '<button type="button" class="hv-btn" data-k="reset">Reset ↺</button>' +
      '</div>' +
      '<div class="cpu-grid">' +
      '<div class="cpu-panel"><h4>Program <span>(the recipe)</span></h4><ol class="cpu-prog" data-k="code"></ol></div>' +
      '<div class="cpu-panel"><h4>CPU <span>(the cook)</span></h4>' +
      '<div class="cpu-regs" data-k="regs"></div>' +
      '<div class="cpu-row"><div class="cpu-pill" data-k="pc"></div><div class="cpu-pill" data-k="zf"></div></div>' +
      '<div class="cpu-row"><div class="cpu-pill" data-k="ir"></div></div>' +
      '<div class="cpu-alu" data-k="alu"></div></div>' +
      '<div class="cpu-panel"><h4>Memory <span>(the boxes)</span></h4><div class="cpu-mem" data-k="mem"></div></div>' +
      '</div>' +
      '<div class="cpu-phases" data-k="phases"><span class="cpu-phase">1 · Fetch</span><span class="cpu-phase">2 · Decode</span><span class="cpu-phase">3 · Execute</span></div>' +
      '<p class="cpu-say" data-k="say" aria-live="polite"></p>' +
      '<div class="cpu-stats" data-k="stats"></div>';

    const q = (k) => el.querySelector(`[data-k="${k}"]`);
    let S, timer = null;

    function clamp(inp) {
      const v = Math.max(1, Math.min(9, Math.round(+inp.value || 1)));
      inp.value = v;
      return v;
    }
    function reset() {
      stop();
      const p = PROGRAMS[q('prog').value].build(clamp(q('x')), clamp(q('y')));
      S = { code: p.code, mem: p.mem.slice(), reg: { A: 0, B: 0, C: 0 }, pc: 0, zf: false, ir: null,
        phase: -1, halted: false, alu: '', ticks: 0, done: 0, changed: new Set(),
        say: 'Press <b>Step</b> to watch the CPU work, one tiny move at a time. (Or <b>Run</b> to let it go.)' };
      render();
    }

    // one phase per click: 0 fetch, 1 decode, 2 execute
    function step() {
      if (S.halted) return;
      S.changed = new Set();
      S.phase = (S.phase + 1) % 3;
      S.ticks++;
      if (S.phase === 0) {
        S.ir = S.code[S.pc];
        S.alu = '';
        S.changed.add('ir');
        S.say = `<b>Fetch:</b> the finger points at line ${S.pc}, so the CPU copies <code>${esc(asmText(S.ir))}</code> into its instruction slot.`;
      } else if (S.phase === 1) {
        S.say = `<b>Decode:</b> “${esc(kidText(S.ir))}”`;
      } else {
        execute(S.ir);
        S.done++;
      }
      render();
      if (S.halted) stop();
    }

    function execute(ins) {
      const [op, a, b] = ins;
      let next = S.pc + 1;
      switch (op) {
        case 'MOV':
          S.reg[a] = b; S.changed.add(a);
          S.say = `<b>Execute:</b> hand ${a} now holds ${b}.`;
          break;
        case 'LOAD':
          S.reg[a] = S.mem[b]; S.changed.add(a); S.changed.add('m' + b);
          S.say = `<b>Execute:</b> box ${b} has ${S.mem[b]}, so hand ${a} now holds ${S.mem[b]}. (The box keeps its number too.)`;
          break;
        case 'STORE':
          S.mem[b] = S.reg[a]; S.changed.add('m' + b);
          S.say = `<b>Execute:</b> box ${b} now holds ${S.reg[a]}.`;
          break;
        case 'ADD': {
          const r = S.reg[a] + S.reg[b];
          S.alu = `calculator: <b>${S.reg[a]} + ${S.reg[b]} = ${r}</b>`;
          S.reg[a] = r; S.zf = r === 0; S.changed.add(a); S.changed.add('zf');
          S.say = `<b>Execute:</b> the calculator adds them, and hand ${a} now holds ${r}.`;
          break;
        }
        case 'DEC': {
          const r = S.reg[a] - 1;
          S.alu = `calculator: <b>${S.reg[a]} − 1 = ${r}</b>`;
          S.reg[a] = r; S.zf = r === 0; S.changed.add(a); S.changed.add('zf');
          S.say = `<b>Execute:</b> hand ${a} now holds ${r}. ${S.zf ? 'That is zero, so the zero light turns <b>on</b>.' : 'Not zero, so the zero light stays <b>off</b>.'}`;
          break;
        }
        case 'JNZ':
          if (!S.zf) { next = a; S.say = `<b>Execute:</b> zero light is off → jump! The finger moves back to line ${a}.`; }
          else S.say = '<b>Execute:</b> zero light is on → no jump. The finger moves to the next line.';
          break;
        default:
          S.halted = true; next = S.pc;
          S.say = `<b>Execute:</b> HALT. Finished in ${S.done + 1} instructions and ${S.ticks} steps. ` + resultText();
      }
      S.pc = next; S.changed.add('pc');
    }

    function resultText() {
      const prog = q('prog').value, x = +q('x').value, y = +q('y').value;
      return prog === 'add'
        ? `Box 2 holds <b>${S.mem[2]}</b>, which is ${x} + ${y}.`
        : `Box 0 holds <b>${S.mem[0]}</b>, which is ${x} × ${y}: the CPU only knows how to add, so it added ${x} into hand A, ${y} times over.`;
    }

    function render() {
      const flash = (k) => (S.changed.has(k) && !reduced() ? ' flash' : '');
      q('code').innerHTML = S.code.map((ins, i) =>
        `<li class="${i === S.pc ? 'cur' : ''}"><span class="n">${i}</span><span class="ptr">☞</span><span>${esc(asmText(ins))}</span></li>`).join('');
      q('regs').innerHTML = ['A', 'B', 'C'].map((r) =>
        `<div class="cpu-reg${flash(r)}"><small>hand ${r}</small><b>${S.reg[r]}</b></div>`).join('');
      q('pc').className = 'cpu-pill' + flash('pc');
      q('pc').innerHTML = `finger (PC) <b>${S.pc}</b>`;
      q('zf').className = 'cpu-pill' + flash('zf');
      q('zf').innerHTML = `<span class="cpu-light${S.zf ? ' on' : ''}"></span>zero light <b>${S.zf ? 'on' : 'off'}</b>`;
      q('ir').className = 'cpu-pill' + flash('ir');
      q('ir').innerHTML = `instruction slot <b>${S.ir ? esc(asmText(S.ir)) : '—'}</b>`;
      q('alu').innerHTML = S.alu || 'calculator (ALU): idle';
      q('mem').innerHTML = S.mem.map((v, i) =>
        `<div class="cpu-cell${flash('m' + i)}"><small>box ${i}</small><b>${v}</b></div>`).join('');
      q('phases').querySelectorAll('.cpu-phase').forEach((p, i) => p.classList.toggle('on', i === S.phase && !S.halted));
      q('say').innerHTML = S.say;
      q('stats').textContent = `Instructions finished: ${S.done} · steps (clock ticks in this toy): ${S.ticks}`;
      q('step').disabled = S.halted;
      q('run').disabled = S.halted;
    }

    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
      q('run').textContent = 'Run ▶';
    }
    q('step').addEventListener('click', () => { stop(); step(); });
    q('run').addEventListener('click', () => {
      if (timer) return stop();
      q('run').textContent = 'Pause ❚❚';
      timer = setInterval(step, 650);
    });
    q('reset').addEventListener('click', reset);
    ['prog', 'x', 'y'].forEach((k) => q(k).addEventListener('change', reset));
    reset();
  };

  // ── 4. Fetch -> decode -> execute loop ─────────────────────────────────
  builders.cycle = (el) => {
    const N = [
      { t: 'Fetch', s: 'read the next line', x: 160, y: 55 },
      { t: 'Decode', s: 'work out what it means', x: 270, y: 200 },
      { t: 'Execute', s: 'do it, move the finger', x: 50, y: 200 },
    ];
    const arc = (a, b) => {
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const cx = 160 + (mx - 160) * 1.5, cy = 140 + (my - 140) * 1.5;
      return `<path d="M${a.x} ${a.y} Q${cx.toFixed(0)} ${cy.toFixed(0)} ${b.x} ${b.y}" class="arrow" marker-end="url(#cyc-h)"/>`;
    };
    let g = '<defs><marker id="cyc-h" viewBox="0 0 10 10" refX="34" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" class="head"/></marker></defs>';
    g += arc(N[0], N[1]) + arc(N[1], N[2]) + arc(N[2], N[0]);
    N.forEach((n, i) => {
      g += `<circle cx="${n.x}" cy="${n.y}" r="40" class="cyc" data-i="${i}"/>`;
      g += `<text x="${n.x}" y="${n.y + 5}" text-anchor="middle" class="cyc-t" data-i="${i}">${n.t}</text>`;
      g += `<text x="${n.x}" y="${n.y + (i === 0 ? -50 : 60)}" text-anchor="middle" class="mut">${n.s}</text>`;
    });
    g += '<text x="160" y="146" text-anchor="middle" class="mut">repeat,</text><text x="160" y="162" text-anchor="middle" class="mut">forever</text>';
    el.innerHTML =
      `<svg viewBox="-20 -10 360 290" style="max-width:420px;margin:0 auto" role="img" aria-label="A loop of three circles: Fetch (read the next line), Decode (work out what it means), Execute (do it, move the finger), with arrows going round and round.">${g}</svg>` +
      '<div style="text-align:center"><button type="button" class="hv-btn" data-k="go">Spin the loop ▶</button></div>' +
      '<div class="hv-tiles">' +
      '<div class="hv-tile"><b>3 billion</b><span>clock ticks per second at 3 GHz</span></div>' +
      '<div class="hv-tile"><b>0.33 ns</b><span>one tick at 3 GHz (light travels about 10 cm)</span></div>' +
      '<div class="hv-tile"><b>Several at once</b><span>real cores overlap the three phases of many instructions (pipelining)</span></div>' +
      '</div>';
    const btn = el.querySelector('[data-k="go"]');
    let t = null;
    btn.addEventListener('click', () => {
      if (t) return;
      let k = 0;
      const total = reduced() ? 3 : 9;
      const tick = () => {
        el.querySelectorAll('[data-i]').forEach((n) => n.classList.toggle('on', +n.dataset.i === k % 3));
        k++;
        if (k > total) { clearInterval(t); t = null; el.querySelectorAll('[data-i]').forEach((n) => n.classList.remove('on')); }
      };
      tick();
      t = setInterval(tick, reduced() ? 900 : 450);
    });
  };

  // ── 5. A real x86-64 program, byte by byte (objdump output) ────────────
  builders.listing = (el) => {
    const rows = [
      ['401000', 'b8 02 00 00 00', 'mov eax, 2', 'Put 2 in register eax (a hand).'],
      ['401005', 'bb 03 00 00 00', 'mov ebx, 3', 'Put 3 in register ebx (another hand).'],
      ['40100a', '01 d8', 'add eax, ebx', 'eax = eax + ebx, so eax holds 5.'],
      ['40100c', '89 c7', 'mov edi, eax', 'Copy the 5 into edi: Linux reads the exit code from there.'],
      ['40100e', 'b8 3c 00 00 00', 'mov eax, 60', 'Put 60 in eax: Linux system call 60 means “exit”.'],
      ['401013', '0f 05', 'syscall', 'Ask Linux to run that system call. The program ends with code 5.'],
    ];
    el.innerHTML =
      '<div class="hv-scroll"><table class="asm-list"><thead><tr><th>Address</th><th>Bytes (machine code)</th><th>Assembly</th><th>In plain words</th></tr></thead><tbody>' +
      rows.map((r) => `<tr><td class="mono">${r[0]}</td><td class="mono bytes">${r[1]}</td><td class="mono">${esc(r[2])}</td><td class="kid">${esc(r[3])}</td></tr>`).join('') +
      '</tbody></table></div>' +
      '<div class="hv-tiles">' +
      '<div class="hv-tile"><b>6</b><span>instructions</span></div>' +
      '<div class="hv-tile"><b>21 bytes</b><span>of machine code in total</span></div>' +
      '<div class="hv-tile"><b>exit code 5</b><span>what <code>echo $?</code> printed after running it</span></div>' +
      '</div>';
  };

  // ── 6. One addition, two CPU families (real compiler output) ───────────
  builders.isa = (el) => {
    const card = (t, sub, code, regs, note) =>
      `<div class="hv-panel"><h4>${t}</h4><p class="sub">${sub}</p><pre>${esc(code)}</pre><p><strong>${regs}</strong></p><p>${note}</p></div>`;
    el.innerHTML = '<div class="hv-panels">' +
      card('x86-64 (Intel, AMD)', 'GCC 13.3, -O2', 'endbr64\nlea  eax, [rdi+rsi]\nret',
        '16 general-purpose registers', 'Arguments arrive in rdi and rsi; the answer goes back in eax. Instructions are 1 to 15 bytes long.') +
      card('ARM64 (Apple M-series, most phones)', 'Clang 18, -O2', 'add  w0, w1, w0\nret',
        '31 general-purpose registers', 'Arguments arrive in w0 and w1; the answer goes back in w0. Every instruction is exactly 4 bytes.') +
      '</div>';
  };

  // ── 7. Where assembly still shows up ───────────────────────────────────
  builders.uses = (el) => {
    const c = (ico, t, d) => `<div class="hv-panel"><div class="ico" aria-hidden="true">${ico}</div><h4>${t}</h4><p>${d}</p></div>`;
    el.innerHTML = '<div class="hv-panels">' +
      c('🔍', 'Reading what the compiler made', 'Checking why a hot loop is slow, or whether it was vectorized.') +
      c('🐞', 'Debugging crashes', 'A crash in a debugger without source code shows you assembly.') +
      c('⚙️', 'The first code a computer runs', 'Bootloaders, OS kernels and tiny microcontrollers still need a little.') +
      c('🚀', 'The fastest inner loops', 'Video codecs and crypto libraries hand-tune a few critical routines.') +
      '</div>';
  };

  document.querySelectorAll('figure.hv[data-hv]').forEach((fig) => {
    const build = builders[fig.dataset.hv];
    const host = fig.querySelector('.hv-canvas');
    if (!build || !host) return;
    try { build(host); } catch (e) { console.error('asm figure', fig.dataset.hv, e); }
  });
})();
