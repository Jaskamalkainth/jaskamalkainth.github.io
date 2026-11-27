/* A small, complete chess rules engine for /blog_posts/chess-openings-middlegame-endgame-guide.html.
   Legal move generation (castling, en passant, promotion), check / checkmate / stalemate, FEN in and
   out, SAN (standard algebraic notation) out and in, and perft. Verified with perft against the
   standard reference counts (start position to depth 5, "Kiwipete" to depth 4).
   Squares are 0..63 with a1 = 0, b1 = 1, ..., h8 = 63. Pieces are 'PNBRQK' (White) and 'pnbrqk' (Black).
   Works in the browser (window.Chess) and in Node (module.exports). */
(function (root) {
  'use strict';
  const FILES = 'abcdefgh';
  const sqName = (s) => FILES[s & 7] + ((s >> 3) + 1);
  const sqIndex = (n) => FILES.indexOf(n[0]) + 8 * (parseInt(n[1], 10) - 1);
  const isWhite = (p) => p && p === p.toUpperCase();
  const colorOf = (p) => (p ? (isWhite(p) ? 'w' : 'b') : null);
  const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const KN = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
  const KG = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  const ORTH = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function Position(fen) { this.load(fen || START); }

  Position.prototype.load = function (fen) {
    const [placement, turn, castling, ep, half, full] = fen.trim().split(/\s+/);
    this.board = new Array(64).fill(null);
    const rows = placement.split('/');
    if (rows.length !== 8) throw new Error('bad FEN: ' + fen);
    rows.forEach((row, i) => {
      let f = 0; const r = 7 - i;
      for (const ch of row) {
        if (/\d/.test(ch)) f += +ch;
        else { this.board[r * 8 + f] = ch; f++; }
      }
    });
    this.turn = turn || 'w';
    this.castling = castling && castling !== '-' ? castling : '';
    this.ep = ep && ep !== '-' ? sqIndex(ep) : -1;
    this.half = +(half || 0);
    this.full = +(full || 1);
    return this;
  };

  Position.prototype.fen = function () {
    let s = '';
    for (let r = 7; r >= 0; r--) {
      let empty = 0;
      for (let f = 0; f < 8; f++) {
        const p = this.board[r * 8 + f];
        if (!p) empty++; else { if (empty) { s += empty; empty = 0; } s += p; }
      }
      if (empty) s += empty;
      if (r) s += '/';
    }
    return `${s} ${this.turn} ${this.castling || '-'} ${this.ep >= 0 ? sqName(this.ep) : '-'} ${this.half} ${this.full}`;
  };

  Position.prototype.clone = function () {
    const p = Object.create(Position.prototype);
    p.board = this.board.slice(); p.turn = this.turn; p.castling = this.castling;
    p.ep = this.ep; p.half = this.half; p.full = this.full;
    return p;
  };

  Position.prototype.king = function (c) {
    const k = c === 'w' ? 'K' : 'k';
    return this.board.indexOf(k);
  };

  // Is square s attacked by side `by`?
  Position.prototype.attacked = function (s, by) {
    const b = this.board, f0 = s & 7, r0 = s >> 3, w = by === 'w';
    const at = (f, r) => (f >= 0 && f < 8 && r >= 0 && r < 8 ? b[r * 8 + f] : undefined);
    // pawns
    const pr = w ? r0 - 1 : r0 + 1, P = w ? 'P' : 'p';
    if (at(f0 - 1, pr) === P || at(f0 + 1, pr) === P) return true;
    const N = w ? 'N' : 'n', K = w ? 'K' : 'k';
    for (const [df, dr] of KN) if (at(f0 + df, r0 + dr) === N) return true;
    for (const [df, dr] of KG) if (at(f0 + df, r0 + dr) === K) return true;
    const slide = (dirs, set) => {
      for (const [df, dr] of dirs) {
        let f = f0 + df, r = r0 + dr;
        while (f >= 0 && f < 8 && r >= 0 && r < 8) {
          const p = b[r * 8 + f];
          if (p) { if (set.includes(p)) return true; break; }
          f += df; r += dr;
        }
      }
      return false;
    };
    return slide(DIAG, w ? 'BQ' : 'bq') || slide(ORTH, w ? 'RQ' : 'rq');
  };

  Position.prototype.inCheck = function (c) {
    c = c || this.turn;
    const k = this.king(c);
    return k >= 0 && this.attacked(k, c === 'w' ? 'b' : 'w');
  };

  // Pseudo-legal moves for the side to move. A move: {from, to, piece, captured, promo, flag}
  // flag: 'ep' en passant, 'k'/'q' castling, 'dbl' pawn double step.
  Position.prototype.pseudo = function () {
    const b = this.board, us = this.turn, them = us === 'w' ? 'b' : 'w', out = [];
    const add = (from, to, flag) => out.push({ from, to, piece: b[from], captured: flag === 'ep' ? (us === 'w' ? 'p' : 'P') : b[to], flag });
    for (let s = 0; s < 64; s++) {
      const p = b[s];
      if (!p || colorOf(p) !== us) continue;
      const f0 = s & 7, r0 = s >> 3, t = p.toUpperCase();
      if (t === 'P') {
        const dir = us === 'w' ? 1 : -1, startR = us === 'w' ? 1 : 6, lastR = us === 'w' ? 7 : 0;
        const pushPromo = (to, flag) => {
          if ((to >> 3) === lastR) for (const q of 'QRBN') out.push({ from: s, to, piece: p, captured: b[to], promo: us === 'w' ? q : q.toLowerCase() });
          else add(s, to, flag);
        };
        const one = s + 8 * dir;
        if (one >= 0 && one < 64 && !b[one]) {
          pushPromo(one);
          const two = s + 16 * dir;
          if (r0 === startR && !b[two]) add(s, two, 'dbl');
        }
        for (const df of [-1, 1]) {
          const f = f0 + df, r = r0 + dir;
          if (f < 0 || f > 7 || r < 0 || r > 7) continue;
          const to = r * 8 + f;
          if (b[to] && colorOf(b[to]) === them) pushPromo(to);
          else if (to === this.ep) add(s, to, 'ep');
        }
      } else if (t === 'N' || t === 'K') {
        for (const [df, dr] of (t === 'N' ? KN : KG)) {
          const f = f0 + df, r = r0 + dr;
          if (f < 0 || f > 7 || r < 0 || r > 7) continue;
          const to = r * 8 + f;
          if (!b[to] || colorOf(b[to]) === them) add(s, to);
        }
      } else {
        const dirs = t === 'B' ? DIAG : t === 'R' ? ORTH : DIAG.concat(ORTH);
        for (const [df, dr] of dirs) {
          let f = f0 + df, r = r0 + dr;
          while (f >= 0 && f < 8 && r >= 0 && r < 8) {
            const to = r * 8 + f;
            if (!b[to]) add(s, to);
            else { if (colorOf(b[to]) === them) add(s, to); break; }
            f += df; r += dr;
          }
        }
      }
    }
    // castling
    const home = us === 'w' ? 0 : 56, K = us === 'w' ? 'K' : 'k', R = us === 'w' ? 'R' : 'r';
    if (b[home + 4] === K && !this.attacked(home + 4, them)) {
      const ks = us === 'w' ? 'K' : 'k', qs = us === 'w' ? 'Q' : 'q';
      if (this.castling.includes(ks) && b[home + 7] === R && !b[home + 5] && !b[home + 6] &&
        !this.attacked(home + 5, them) && !this.attacked(home + 6, them)) add(home + 4, home + 6, 'k');
      if (this.castling.includes(qs) && b[home] === R && !b[home + 1] && !b[home + 2] && !b[home + 3] &&
        !this.attacked(home + 3, them) && !this.attacked(home + 2, them)) add(home + 4, home + 2, 'q');
    }
    return out;
  };

  // Play a move in place (no legality check). Returns this.
  Position.prototype.play = function (m) {
    const b = this.board, us = this.turn, them = us === 'w' ? 'b' : 'w';
    const p = b[m.from];
    b[m.to] = m.promo || p; b[m.from] = null;
    if (m.flag === 'ep') b[m.to + (us === 'w' ? -8 : 8)] = null;
    if (m.flag === 'k') { b[m.to - 1] = b[m.to + 1]; b[m.to + 1] = null; }
    if (m.flag === 'q') { b[m.to + 1] = b[m.to - 2]; b[m.to - 2] = null; }
    // castling rights
    const strip = (chars) => { for (const c of chars) this.castling = this.castling.replace(c, ''); };
    if (p === 'K') strip('KQ'); if (p === 'k') strip('kq');
    for (const s of [m.from, m.to]) {
      if (s === 0) strip('Q'); if (s === 7) strip('K'); if (s === 56) strip('q'); if (s === 63) strip('k');
    }
    this.ep = m.flag === 'dbl' ? (m.from + m.to) / 2 : -1;
    this.half = p.toUpperCase() === 'P' || m.captured ? 0 : this.half + 1;
    if (us === 'b') this.full++;
    this.turn = them;
    return this;
  };

  Position.prototype.moves = function () {
    const us = this.turn;
    return this.pseudo().filter((m) => !this.clone().play(m).inCheck(us));
  };

  Position.prototype.status = function () {
    const n = this.moves().length;
    if (n) return this.inCheck() ? 'check' : 'ok';
    return this.inCheck() ? 'checkmate' : 'stalemate';
  };

  Position.prototype.san = function (m, legal) {
    legal = legal || this.moves();
    let s;
    if (m.flag === 'k') s = 'O-O';
    else if (m.flag === 'q') s = 'O-O-O';
    else {
      const t = m.piece.toUpperCase();
      if (t === 'P') {
        s = m.captured ? FILES[m.from & 7] + 'x' + sqName(m.to) : sqName(m.to);
        if (m.promo) s += '=' + m.promo.toUpperCase();
      } else {
        const rivals = legal.filter((o) => o.piece === m.piece && o.to === m.to && o.from !== m.from);
        let dis = '';
        if (rivals.length) {
          const sameFile = rivals.some((o) => (o.from & 7) === (m.from & 7));
          const sameRank = rivals.some((o) => (o.from >> 3) === (m.from >> 3));
          if (!sameFile) dis = FILES[m.from & 7];
          else if (!sameRank) dis = String((m.from >> 3) + 1);
          else dis = sqName(m.from);
        }
        s = t + dis + (m.captured ? 'x' : '') + sqName(m.to);
      }
    }
    const after = this.clone().play(m), st = after.status();
    if (st === 'checkmate') s += '#'; else if (st === 'check') s += '+';
    return s;
  };

  const clean = (s) => s.replace(/[+#!?]/g, '').replace(/0/g, 'O').replace(/=?([QRBN])$/, '=$1');
  // Find the legal move written in SAN (also accepts UCI like "e2e4", "e7e8q"). Throws if not legal.
  Position.prototype.parse = function (text) {
    const legal = this.moves();
    const uci = /^([a-h][1-8])([a-h][1-8])([qrbn])?$/.exec(text);
    if (uci) {
      const from = sqIndex(uci[1]), to = sqIndex(uci[2]);
      const m = legal.find((o) => o.from === from && o.to === to && (!o.promo || o.promo.toLowerCase() === (uci[3] || 'q')));
      if (m) return m;
    }
    const want = clean(text);
    const m = legal.find((o) => clean(this.san(o, legal)) === want);
    if (!m) throw new Error(`illegal move "${text}" in ${this.fen()}`);
    return m;
  };

  Position.prototype.perft = function (d) {
    if (d === 0) return 1;
    const ms = this.moves();
    if (d === 1) return ms.length;
    let n = 0;
    for (const m of ms) n += this.clone().play(m).perft(d - 1);
    return n;
  };

  // Play a list of SAN moves from a FEN; returns [{fen, san, move}] for each ply (index 0 = start).
  function line(fen, sans) {
    const pos = new Position(fen);
    const out = [{ fen: pos.fen(), san: null, move: null }];
    for (const s of sans) {
      const m = pos.parse(s), san = pos.san(m);
      pos.play(m);
      out.push({ fen: pos.fen(), san, move: m });
    }
    return out;
  }

  const api = { Position, START, sqName, sqIndex, colorOf, line, FILES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Chess = api;
})(typeof window !== 'undefined' ? window : this);

/* King and pawn vs king (KPK): an exact win/draw table, built by retrograde analysis in the same
   way as Stockfish's KPK bitbase. White has the pawn. Index = stm*262144 + wk*4096 + bk*64 + psq.
   result(): 0 invalid, 1 draw, 2 white wins. depth(): iteration at which a win was proved
   (smaller = faster win), used to pick the longest defence. Checked against the Lichess tablebase. */
(function (root) {
  'use strict';
  const api = (typeof module !== 'undefined' && module.exports) ? module.exports : root.Chess;
  const dist = (a, b) => Math.max(Math.abs((a & 7) - (b & 7)), Math.abs((a >> 3) - (b >> 3)));
  const kingSteps = [];
  for (let s = 0; s < 64; s++) {
    kingSteps[s] = [];
    for (let t = 0; t < 64; t++) if (t !== s && dist(s, t) === 1) kingSteps[s].push(t);
  }
  const pawnHits = (p, s) => (s >> 3) === (p >> 3) + 1 && Math.abs((s & 7) - (p & 7)) === 1;
  let table = null, depthT = null;
  const idx = (stm, wk, bk, p) => stm * 262144 + wk * 4096 + bk * 64 + p;
  function build() {
    if (table) return;
    table = new Uint8Array(524288); depthT = new Uint16Array(524288);
    const INVALID = 0, UNKNOWN = 3, DRAW = 1, WIN = 2;
    for (let stm = 0; stm < 2; stm++) for (let wk = 0; wk < 64; wk++) for (let bk = 0; bk < 64; bk++) for (let p = 8; p < 56; p++) {
      const i = idx(stm, wk, bk, p);
      let r = UNKNOWN;
      if (dist(wk, bk) <= 1 || wk === p || bk === p || (stm === 0 && pawnHits(p, bk))) r = INVALID;
      else if (stm === 0 && (p >> 3) === 6 && wk !== p + 8 && bk !== p + 8 && (dist(bk, p + 8) > 1 || dist(wk, p + 8) === 1)) r = WIN;
      else if (stm === 1) {
        const free = kingSteps[bk].filter((t) => dist(t, wk) > 1 && !pawnHits(p, t));
        if (!free.length || free.includes(p)) r = DRAW; // stalemate, or the king takes an undefended pawn
      }
      table[i] = r;
    }
    let changed = true, it = 0;
    while (changed) {
      changed = false; it++;
      const snap = table.slice();
      for (let stm = 0; stm < 2; stm++) for (let wk = 0; wk < 64; wk++) for (let bk = 0; bk < 64; bk++) for (let p = 8; p < 56; p++) {
        const i = idx(stm, wk, bk, p);
        if (snap[i] !== UNKNOWN) continue;
        const kids = [];
        if (stm === 0) {
          for (const t of kingSteps[wk]) if (t !== p) kids.push(snap[idx(1, t, bk, p)]);
          if ((p >> 3) < 6 && p + 8 !== wk && p + 8 !== bk) {
            kids.push(snap[idx(1, wk, bk, p + 8)]);
            if ((p >> 3) === 1 && p + 16 !== wk && p + 16 !== bk) kids.push(snap[idx(1, wk, bk, p + 16)]);
          }
          const ok = kids.filter((k) => k !== INVALID);
          if (ok.includes(WIN)) { table[i] = WIN; depthT[i] = it; changed = true; }
          else if (ok.length && ok.every((k) => k === DRAW)) { table[i] = DRAW; changed = true; }
        } else {
          for (const t of kingSteps[bk]) kids.push(snap[idx(0, wk, t, p)]);
          const ok = kids.filter((k) => k !== INVALID);
          if (ok.includes(DRAW)) { table[i] = DRAW; changed = true; }
          else if (ok.length && ok.every((k) => k === WIN)) { table[i] = WIN; depthT[i] = it; changed = true; }
        }
      }
    }
    for (let i = 0; i < table.length; i++) if (table[i] === UNKNOWN) table[i] = DRAW;
  }
  // Probe a Position with exactly K+P vs K (White has the pawn). Returns 'win' | 'draw' | null.
  function probe(pos) {
    build();
    const pcs = []; pos.board.forEach((x, s) => { if (x) pcs.push([x, s]); });
    if (pcs.length !== 3) return null;
    const wk = pos.board.indexOf('K'), bk = pos.board.indexOf('k'), p = pos.board.indexOf('P');
    if (wk < 0 || bk < 0 || p < 0) return null;
    const i = idx(pos.turn === 'w' ? 0 : 1, wk, bk, p);
    return table[i] === 2 ? 'win' : table[i] === 1 ? 'draw' : null;
  }
  function depth(pos) {
    const wk = pos.board.indexOf('K'), bk = pos.board.indexOf('k'), p = pos.board.indexOf('P');
    return depthT[idx(pos.turn === 'w' ? 0 : 1, wk, bk, p)];
  }
  api.kpk = { build, probe, depth };
})(typeof window !== 'undefined' ? window : this);
