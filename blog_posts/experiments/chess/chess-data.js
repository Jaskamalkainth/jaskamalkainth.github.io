/* Content for /blog_posts/chess-openings-middlegame-endgame-guide.html: openings, traps, tactics
   puzzles, middlegame plans, endgame lines and facts. Every move list is replayed by chess-engine.js
   in the browser (an illegal move would throw), and was checked with Stockfish 16 and the Lichess
   7-piece tablebase before publishing (puzzles: the solution is the only winning move; endgames:
   every move keeps the stated result). Works in the browser (window.ChessData) and in Node. */
(function (root) {
  'use strict';
  const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  // The hero: Paul Morphy vs the Duke of Brunswick and Count Isouard, Paris Opera, 1858.
  const opera = {
    title: 'The Opera Game', white: 'Paul Morphy', black: 'Duke of Brunswick & Count Isouard', year: 1858,
    moves: ['e4', 'e5', 'Nf3', 'd6', 'd4', 'Bg4', 'dxe5', 'Bxf3', 'Qxf3', 'dxe5', 'Bc4', 'Nf6', 'Qb3', 'Qe7',
      'Nc3', 'c6', 'Bg5', 'b5', 'Nxb5', 'cxb5', 'Bxb5+', 'Nbd7', 'O-O-O', 'Rd8', 'Rxd7', 'Rxd7', 'Rd1', 'Qe6',
      'Bxd7+', 'Nxd7', 'Qb8+', 'Nxb8', 'Rd8#'],
    // a lesson for the move just played (by ply index, 1-based)
    notes: {
      1: 'Take the centre with a pawn.', 2: 'Black does the same.', 3: 'Develop a knight and attack e5.',
      4: 'Philidor Defence: solid but passive.', 6: 'The bishop pins the knight to the queen.',
      7: 'Hit the centre right away.', 8: 'Black gives up the bishop pair to keep material.',
      9: 'The queen recaptures and eyes f7 and b7.', 11: 'Develop with a threat: Bc4 and Qf3 aim at f7.',
      13: 'Double attack: b7 and f7 at once.', 14: 'Black defends f7 but blocks the bishop on f8.',
      15: 'Morphy keeps developing instead of grabbing b7.', 17: 'Pin: the knight on f6 cannot move freely.',
      19: 'A piece sacrifice to rip open lines toward the king.', 21: 'Check, and the knight on d7 is pinned.',
      23: 'Castle with tempo: the rook joins the attack on d7.', 25: 'Give up the rook to keep the pin going.',
      27: 'The last piece joins: every white piece is attacking.', 29: 'Remove the defender of b8 and d8.',
      31: 'A queen sacrifice! It deflects the knight from d7.', 33: 'Checkmate with the last two pieces. Black never got the h8 rook or f8 bishop into the game.'
    }
  };

  // Famous openings. eco = Encyclopaedia of Chess Openings range. moves = a main line.
  const openings = [
    { id: 'italian', name: 'Italian Game', group: '1.e4 e5', eco: 'C50–C54', side: 'w',
      moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd3', 'd6', 'O-O', 'O-O'],
      idea: 'The bishop on c4 aims at f7, the weakest square next to Black’s king. White builds a slow centre with c3 and d3, then prepares d4.',
      white: 'Castle, play Re1, Nbd2-f1-g3, and push d4 or a4-b4 when ready.',
      black: 'Mirror the setup, keep the bishop on the a7-g1 diagonal and hit back with ...d5 when it is safe.',
      who: 'Revived at the top level in the 2010s; Magnus Carlsen plays it often.', level: 'Beginner' },
    { id: 'ruy', name: 'Ruy Lopez (Spanish)', group: '1.e4 e5', eco: 'C60–C99', side: 'w',
      moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'd6', 'c3', 'O-O'],
      idea: 'Bb5 pressures the knight that defends e5. It is not an immediate threat (after 3...a6 4.Bxc6 dxc6, 5.Nxe5 is met by 5...Qd4, winning the pawn back), but the pressure lasts all game.',
      white: 'Build the ideal centre with c3 and d4, then manoeuvre the queen’s knight to g3 and attack on the kingside.',
      black: 'Gain space with ...a6 and ...b5, keep e5 solid and look for queenside play with ...c5 or ...Na5.',
      who: 'Named after the 16th-century Spanish priest Ruy López de Segura; a lifelong weapon of Bobby Fischer.', level: 'Intermediate' },
    { id: 'kings-gambit', name: 'King’s Gambit', group: '1.e4 e5', eco: 'C30–C39', side: 'w',
      moves: ['e4', 'e5', 'f4', 'exf4', 'Nf3', 'g5', 'h4', 'g4', 'Ne5'],
      idea: 'White offers the f-pawn to open the f-file and build a big centre with d4. Romantic, sharp and risky for both sides.',
      white: 'Develop fast, play d4 and Bc4, and aim everything at f7.',
      black: 'Either hold the extra pawn with ...g5, or return it with ...d5 for easy development.',
      who: 'The weapon of the 19th-century Romantic era (Anderssen’s 1851 Immortal Game began with it).', level: 'Adventurous' },
    { id: 'sicilian', name: 'Sicilian Defence: Najdorf', group: '1.e4 others', eco: 'B90–B99', side: 'b',
      moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'],
      idea: 'Black trades a wing pawn for White’s centre pawn and gets an unbalanced game. ...a6 stops Nb5 and Bb5 and prepares ...e5 or ...b5.',
      white: 'Develop quickly and attack the king, often with f3, Be3, Qd2, castling long and pushing g4-g5.',
      black: 'Counterattack on the queenside along the half-open c-file with ...b5, ...Bb7 and ...Rc8.',
      who: 'Named after Miguel Najdorf; Bobby Fischer’s and Garry Kasparov’s main defence.', level: 'Advanced' },
    { id: 'french', name: 'French Defence: Advance', group: '1.e4 others', eco: 'C02', side: 'b',
      moves: ['e4', 'e6', 'd4', 'd5', 'e5', 'c5', 'c3', 'Nc6', 'Nf3', 'Qb6'],
      idea: 'Black lets White grab space and then attacks the base of White’s pawn chain (d4) with ...c5, ...Nc6 and ...Qb6.',
      white: 'Hold d4, use the space on the kingside, keep the e5 pawn as a wedge.',
      black: 'Pile up on d4, and later break with ...f6 to hit the head of the chain. The light-squared bishop is Black’s problem piece.',
      who: 'A long-time choice of Mikhail Botvinnik and Viktor Korchnoi.', level: 'Intermediate' },
    { id: 'caro', name: 'Caro-Kann Defence', group: '1.e4 others', eco: 'B10–B19', side: 'b',
      moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5', 'Ng3', 'Bg6'],
      idea: 'Like the French, Black challenges e4 with ...d5, but prepares it with ...c6 so the light-squared bishop can come out first.',
      white: 'Use the extra space and lead in development; push h4-h5 to harass the bishop.',
      black: 'Solid structure, few weaknesses; aim for a good endgame and the ...c5 or ...e5 break.',
      who: 'Named after Horatio Caro and Marcus Kann (1880s); a staple of Anatoly Karpov.', level: 'Beginner' },
    { id: 'scandi', name: 'Scandinavian Defence', group: '1.e4 others', eco: 'B01', side: 'b',
      moves: ['e4', 'd5', 'exd5', 'Qxd5', 'Nc3', 'Qa5', 'd4', 'Nf6', 'Nf3', 'c6'],
      idea: 'Black challenges e4 on move one. The queen comes out early and loses a tempo, but Black gets a clear, simple position.',
      white: 'Gain time by hitting the queen, develop, and use the lead in development.',
      black: 'Put the queen on a5 or d6, develop the light bishop to f5 or g4, set up ...c6 and ...e6.',
      who: 'Easy to learn: Black’s setup is nearly the same in every game.', level: 'Beginner' },
    { id: 'qgd', name: 'Queen’s Gambit Declined', group: '1.d4 d5', eco: 'D30–D69', side: 'w',
      moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e3', 'O-O', 'Nf3', 'h6', 'Bh4', 'b6'],
      idea: 'White offers the c-pawn to pull Black’s d-pawn away from the centre. Black declines and holds d5 with ...e6.',
      white: 'Pressure d5, then use the minority attack (b4-b5) against Black’s queenside pawns.',
      black: 'Rock-solid centre; free the position with ...c5 or ...dxc4 and ...c5 at the right moment.',
      who: 'The backbone of classical chess: 32 of the 34 games of the 1927 Capablanca–Alekhine world-title match were Queen’s Gambit Declined.', level: 'Beginner' },
    { id: 'slav', name: 'Slav Defence', group: '1.d4 d5', eco: 'D10–D19', side: 'b',
      moves: ['d4', 'd5', 'c4', 'c6', 'Nf3', 'Nf6', 'Nc3', 'dxc4', 'a4', 'Bf5'],
      idea: 'Black supports d5 with the c-pawn instead of the e-pawn, so the light-squared bishop is not locked in.',
      white: 'Win back the c4 pawn and use the centre with e4 when possible.',
      black: 'Develop the bishop to f5 or g4 before playing ...e6; very solid.', who: 'Played by Vladimir Kramnik and Vishy Anand in world-title matches.', level: 'Intermediate' },
    { id: 'kid', name: 'King’s Indian Defence', group: '1.d4 Nf6', eco: 'E60–E99', side: 'b',
      moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O', 'Be2', 'e5'],
      idea: 'Black lets White build a big centre, then strikes at it with ...e5 or ...c5. The fianchettoed bishop on g7 is the soul of the opening.',
      white: 'Grab queenside space with d5, c5 and b4.', black: 'Close the centre and attack White’s king with ...f5-f4 and ...g5.',
      who: 'Garry Kasparov’s and Bobby Fischer’s fighting defence to 1.d4.', level: 'Advanced' },
    { id: 'nimzo', name: 'Nimzo-Indian Defence', group: '1.d4 Nf6', eco: 'E20–E59', side: 'b',
      moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4', 'e3', 'O-O', 'Bd3', 'd5', 'Nf3', 'c5'],
      idea: 'Black pins the knight that wants to support e4, and is often happy to give the bishop for it to double White’s c-pawns.',
      white: 'Use the bishop pair and the centre; avoid weak doubled pawns.', black: 'Control e4, hit the centre with ...c5 and ...d5, play against White’s pawn weaknesses.',
      who: 'Aron Nimzowitsch’s hypermodern idea: control the centre with pieces, not pawns.', level: 'Intermediate' },
    { id: 'london', name: 'London System', group: '1.d4 others', eco: 'D02 / A46 / A48', side: 'w',
      moves: ['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6', 'Nf3', 'c5', 'c3', 'Nc6', 'Nbd2', 'Bd6', 'Bg3'],
      idea: 'A system, not a line: White plays the same setup (d4, Bf4, e3, Nf3, c3, Nbd2, Bd3) against almost anything.',
      white: 'Build the pyramid, castle, and aim for a kingside attack with Ne5 and Qf3 or h4.',
      black: 'Challenge the f4 bishop with ...Bd6, hit the centre with ...c5, and keep pieces active.', who: 'Popular at every level; Magnus Carlsen and Gata Kamsky have used it.', level: 'Beginner' },
    { id: 'english', name: 'English Opening', group: 'Flank', eco: 'A10–A39', side: 'w',
      moves: ['c4', 'e5', 'Nc3', 'Nf6', 'g3', 'd5', 'cxd5', 'Nxd5', 'Bg2', 'Nb6'],
      idea: 'White controls d5 from the side. Against 1...e5 it is a Sicilian with colours reversed and an extra tempo.',
      white: 'Fianchetto, pressure the long diagonal, expand on the queenside with a3 and b4.', black: 'Take the centre with pawns and stay flexible.',
      who: 'Named after the English master Howard Staunton’s 1843 match games.', level: 'Intermediate' }
  ];

  // Opening traps: a short line that ends in a lost position for the side that falls for it.
  const traps = [
    { id: 'fool', name: 'Fool’s Mate', moves: ['f3', 'e5', 'g4', 'Qh4#'], lesson: 'The fastest possible checkmate, in 2 moves. Moving the f- and g-pawns early opens the diagonal to your king.' },
    { id: 'scholar', name: 'Scholar’s Mate', moves: ['e4', 'e5', 'Bc4', 'Nc6', 'Qh5', 'Nf6', 'Qxf7#'], lesson: 'Queen and bishop gang up on f7. Defend with ...Qe7 or ...g6, not ...Nf6, and you are better: the early queen just gets chased.' },
    { id: 'legal', name: 'Légal’s Mate', moves: ['e4', 'e5', 'Nf3', 'd6', 'Bc4', 'Bg4', 'Nc3', 'g6', 'Nxe5', 'Bxd1', 'Bxf7+', 'Ke7', 'Nd5#'], lesson: 'A pinned knight is not always really pinned. White gives up the queen; Black’s greed allows mate with three minor pieces.' },
    { id: 'elephant', name: 'Elephant Trap (QGD)', moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Nbd7', 'cxd5', 'exd5', 'Nxd5', 'Nxd5', 'Bxd8', 'Bb4+', 'Qd2', 'Bxd2+', 'Kxd2', 'Kxd8'], lesson: 'The knight on f6 looks pinned, so White grabs d5. But ...Nxd5! and the check on b4 win a piece: White ends up a knight down.' }
  ];

  // Tactics puzzles: White to move. `solution` is the main line (White, Black, White...).
  const puzzles = [
    { id: 'fork', motif: 'Fork', fen: 'r3kb1r/pp3ppp/8/3N4/8/8/PPP2PPP/2KR4 w kq - 0 1', solution: ['Nc7+', 'Ke7', 'Nxa8'],
      hint: 'A knight move that checks the king and hits something else.', why: 'The knight attacks the king and the a8 rook at once. The king must move (the d-file is covered by the d1 rook), and White wins a whole rook, turning a worse position into a winning one.' },
    { id: 'pin', motif: 'Pin', fen: '6k1/6pp/8/3q4/8/1P6/P5PP/5BK1 w - - 0 1', solution: ['Bc4'],
      hint: 'The queen and king stand on the same diagonal.', why: 'Bc4 pins the queen to the king on the a2-g8 diagonal. It cannot step off the line, and ...Qxc4 bxc4 gives the queen for a bishop.' },
    { id: 'skewer', motif: 'Skewer', fen: '8/8/3k3q/8/8/8/5PPP/R5K1 w - - 0 1', solution: ['Ra6+', 'Ke7', 'Rxh6'],
      hint: 'Check the king along the rank it shares with the queen.', why: 'A skewer is a reverse pin: the more valuable piece is in front. The king must step away, and the rook takes the queen behind it.' },
    { id: 'discovered', motif: 'Discovered check', fen: '4k3/5ppp/2q5/4N3/8/8/5PPP/4R1K1 w - - 0 1', solution: ['Nxc6+'],
      hint: 'Move the knight off the e-file, and take something on the way.', why: 'When the knight leaves e5, the rook gives check. Black has to deal with the check, so the knight simply takes the queen.' },
    { id: 'backrank', motif: 'Back-rank mate', fen: '6k1/5ppp/8/8/8/8/r4PPP/3R2K1 w - - 0 1', solution: ['Rd8#'],
      hint: 'Black’s king is boxed in by its own pawns.', why: 'The pawns on f7, g7 and h7 take away every escape square. One rook check on the eighth rank is mate. Cure: make luft with ...h6 in time.' },
    { id: 'smothered', motif: 'Smothered mate', fen: 'r6k/6pp/7N/8/2Q5/8/6PP/6K1 w - - 0 1', solution: ['Qg8+', 'Rxg8', 'Nf7#'],
      hint: 'Sacrifice the queen so Black’s own rook blocks the king.', alt: { 'Nf7+': 'That wins too (Nf7+ Kg8 Nh6+ Kh8 Qg8+ Rxg8 Nf7# is mate in 4), but there is a mate in 2.' }, why: 'The queen check forces ...Rxg8 (the king cannot take, the knight guards g8). Now the king is smothered by its own pieces and Nf7 is mate.' },
    { id: 'defender', motif: 'Removing the defender', fen: '5rk1/ppp1qppp/5n2/6B1/8/2PQ3P/PP3PP1/1B4K1 w - - 0 1', solution: ['Bxf6'],
      hint: 'Which black piece stops Qxh7 mate?', why: 'The knight on f6 is the only defender of h7. Take it, and Qxh7 is mate next: after ...Qxf6 or ...gxf6 comes Qxh7#. Black’s best is ...Qe1+ Kh2 g6, and White is a piece up. (The h3 pawn gives White’s king an escape square.)' }
  ];

  // Middlegame plans: illustrative diagrams. marks: squares to highlight; arrows: [from, to].
  const plans = [
    { id: 'outpost', name: 'Knight outpost', fen: '5bk1/pp3ppp/3p4/3N4/2P1P3/8/PP4PP/6K1 w - - 0 1', marks: ['d5'], arrows: [['d5', 'b6'], ['d5', 'f6'], ['d5', 'e7'], ['d5', 'c7']],
      text: 'An outpost is a square that no enemy pawn can ever attack. A knight on d5, supported by the c4 and e4 pawns, cannot be chased away, and Black’s dark-squared bishop can never challenge it.' },
    { id: 'openfile', name: 'Rooks on open files', fen: 'r5k1/pp3pp1/2p4p/8/8/8/PP3PPP/3R2K1 w - - 0 1', marks: ['d7'], arrows: [['d1', 'd7']],
      text: 'Put rooks on files with no pawns. White owns the open d-file; Rd7 invades the seventh rank, where a rook attacks pawns from the side, while Black’s a8 rook still has no open file.' },
    { id: 'iqp', name: 'Isolated queen’s pawn', fen: 'r2q1rk1/pp2bppp/2n1pn2/8/3P4/2N2N2/PP2BPPP/R2Q1RK1 w - - 0 1', marks: ['d4', 'd5'], arrows: [['d4', 'd5']],
      text: 'The d4 pawn has no neighbours. With pieces on, it gives White space and attacking chances (and the d5 break). In an endgame it becomes a weakness, so the defender trades pieces and blockades d5.' },
    { id: 'minority', name: 'Minority attack', fen: '2r2rk1/pp3ppp/2p5/3p4/3P4/4P3/PP3PPP/2R2RK1 w - - 0 1', marks: ['c6'], arrows: [['b2', 'b4'], ['b4', 'b5'], ['b5', 'c6']],
      text: 'Two pawns attack three: White pushes b4-b5 to trade on c6 and leave Black with a weak, backward c-pawn to attack.' },
    { id: 'pair', name: 'The bishop pair', fen: '6k1/p2nnppp/1p2p3/8/8/1P2PB2/PB3PPP/6K1 w - - 0 1', marks: ['b2', 'f3'], arrows: [['b2', 'g7'], ['f3', 'a8']],
      text: 'Two bishops sweep both colours of square. Open the position with pawn breaks and they usually beat bishop and knight or two knights.' },
    { id: 'worst', name: 'Improve your worst piece', fen: 'r4rk1/pp2qppp/2pbpn2/8/3P4/2PBPN2/P4PPP/R2Q1RK1 w - - 0 1', marks: ['a1'], arrows: [['a1', 'b1'], ['b1', 'b7']],
      text: 'When there is nothing tactical, find the piece doing the least and give it a job. Here White’s a1 rook is idle; Rb1 puts it on the half-open b-file, aiming at b7.' }
  ];

  // Endgame lines. result = what the side to move achieves with best play (tablebase-checked).
  const endgames = [
    { id: 'lucena', name: 'Lucena position', result: 'White wins', fen: '1K6/1P1k4/8/8/8/8/r7/2R5 w - - 0 1',
      moves: ['Rd1+', 'Ke7', 'Rd4', 'Ra1', 'Kc7', 'Rc1+', 'Kb6', 'Rb1+', 'Kc6', 'Rc1+', 'Kb5', 'Rb1+', 'Rb4'],
      lesson: 'Build a bridge: push the black king away with a check, put the rook on the 4th rank, walk the king out, and block the checks with the rook.' },
    { id: 'philidor', name: 'Philidor position', result: 'Draw', fen: '3k4/8/8/3PK3/8/r7/8/7R b - - 0 1',
      moves: ['Ra6', 'Rh7', 'Rb6', 'd6', 'Rb1', 'Ke6', 'Re1+', 'Kd5', 'Rd1+'],
      lesson: 'Keep the rook on the 6th rank to stop the white king. The moment the pawn steps to the 6th, drop the rook to the back and check from behind.' },
    { id: 'opposition', name: 'Opposition', result: 'White wins', fen: '4k3/8/4K3/4P3/8/8/8/8 b - - 0 1',
      moves: ['Kd8', 'Kf7', 'Kd7', 'e6+', 'Kd8', 'e7+', 'Kd7', 'e8=Q+'],
      lesson: 'Kings facing each other with one square between: the side NOT to move holds the opposition. Here Black must give way, and the white king escorts the pawn.' },
    { id: 'kqk', name: 'Queen mate (K+Q vs K)', result: 'White wins', fen: '8/8/8/3k4/8/8/8/KQ6 w - - 0 1',
      moves: ['Qb4', 'Ke5', 'Kb2', 'Kd5', 'Kc3', 'Ke5', 'Qc5+', 'Ke4', 'Qd6', 'Kf5', 'Kd4', 'Kg5', 'Qe6', 'Kf4', 'Qe4+', 'Kg5', 'Ke5', 'Kh6', 'Qg4', 'Kh7', 'Kf6', 'Kh8', 'Qg7#'],
      lesson: 'Shrink the box with knight-move distance between queen and king, bring your own king up, then mate on the edge. Watch out for stalemate.' },
    { id: 'krk', name: 'Rook mate (K+R vs K)', result: 'White wins', fen: '8/8/8/4k3/8/8/8/R3K3 w - - 0 1',
      moves: ['Ra4', 'Kd5', 'Kd2', 'Kc5', 'Kc3', 'Kb5', 'Rh4', 'Kc5', 'Rh5+', 'Kd6', 'Kd4', 'Ke6', 'Rg5', 'Kd6', 'Rg6+', 'Ke7', 'Ke5', 'Kf7', 'Ra6', 'Ke7', 'Ra7+', 'Kd8', 'Kd6', 'Kc8', 'Kc6', 'Kb8', 'Rh7', 'Ka8', 'Kb6', 'Kb8', 'Rh8#'],
      lesson: 'The rook cuts off the king along a rank or file, your king comes up to take the opposition, and a rook check drives the king back one line at a time.' }
  ];

  // KPK lessons for the play-it-yourself endgame (White to move, you are White).
  const kpk = [
    { id: 'opp', name: 'Take the opposition', fen: '4k3/8/8/4K3/4P3/8/8/8 w - - 0 1', goal: 'Win: queen the pawn.', tip: 'Don’t push the pawn yet. Step in front of it so the kings face each other with Black to move.' },
    { id: 'key', name: 'King in front', fen: '8/3k4/8/8/8/4K3/4P3/8 w - - 0 1', goal: 'Win: queen the pawn.', tip: 'Get your king to the key squares two ranks in front of the pawn (d4, e4, f4 first, then d5-f5) before the pawn moves.' },
    { id: 'square', name: 'Outrun the king', fen: '8/8/8/7k/8/8/1P6/6K1 w - - 0 1', goal: 'Win: queen the pawn.', tip: 'Rule of the square: if Black’s king cannot step into the square from the pawn to its queening square, the pawn runs alone.' },
    { id: 'rook', name: 'Rook pawn (try it)', fen: '8/5k2/8/8/5K1P/8/8/8 w - - 0 1', goal: 'Can White win at all?', tip: 'With a g-pawn this exact position is a win. With an h-pawn the defending king runs to h8, and there is no room to get around it: draw.' }
  ];

  // Short facts for the daily card and the facts section.
  const facts = [
    'There are about 4.8 × 10^44 legal chess positions (John Tromp’s estimate from random sampling).',
    'Claude Shannon estimated about 10^120 possible games in 1950, the “Shannon number”.',
    'After one move by each side there are 400 possible games; after two each, 197,281.',
    'The fastest possible checkmate is Fool’s Mate: 1.f3 e5 2.g4 Qh4#.',
    'The longest tournament game, Nikolić vs Arsović (Belgrade 1989), was a 269-move draw that took 20 hours 15 minutes.',
    'Chess began as chaturanga in India around the 6th century CE, then travelled to Persia as shatranj.',
    'The queen became the strongest piece only in the late 15th century; the poem Scachs d’amor (Valencia) is the earliest known text with the modern queen.',
    'Viswanathan Anand became India’s first grandmaster in 1988 and later won five world championship titles.',
    'In December 2024, 18-year-old D. Gukesh beat Ding Liren 7.5–6.5 to become the youngest undisputed world champion.',
    'Magnus Carlsen’s 2882 rating (May 2014) is the highest in FIDE’s history.',
    'IBM’s Deep Blue beat world champion Garry Kasparov 3.5–2.5 in a six-game match in May 1997.',
    'Every position with seven or fewer pieces is solved: the Syzygy tablebases, completed in 2018, give perfect play for all of them.',
    'The Encyclopaedia of Chess Openings sorts all openings into 500 codes, A00 to E99.',
    'A knight in the corner controls 2 squares; in the centre it controls 8.',
    'The word “checkmate” comes, via Arabic and Old French, from the Persian shāh māt; shāh means king.'
  ];

  const principles = [
    'Control the centre (e4, d4, e5, d5) with pawns and pieces.',
    'Develop knights and bishops before moving the same piece twice.',
    'Castle early, usually in the first 10 moves.',
    'Don’t bring the queen out early: it gets chased and you lose time.',
    'Connect your rooks, then put them on open files.',
    'Before every move: checks, captures and threats, for both sides.',
    'Ask what your opponent’s last move wants to do.',
    'When ahead in material, trade pieces, not pawns.',
    'In the endgame, the king is a fighting piece: bring it to the centre.',
    'Rooks belong behind passed pawns, yours or your opponent’s.',
    'Improve your worst piece when nothing is happening.',
    'A knight on the rim is dim: knights want central outposts.',
    'Don’t open the position when you are behind in development.',
    'Look at your opponent’s threats before you look at your own ideas.'
  ];

  const api = { START, opera, openings, traps, puzzles, plans, endgames, kpk, facts, principles };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ChessData = api;
})(typeof window !== 'undefined' ? window : this);
