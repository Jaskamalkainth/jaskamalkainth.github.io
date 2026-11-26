---
title: "Chess Openings, Tactics and Endgames: A Playable Guide"
description: "The chess openings, tactics, middlegame plans and endgames worth knowing, with best practices and facts, on live boards you can play, train and revisit daily."
date: 2026-11-26
last_modified_at: 2026-11-26
keywords: [best chess openings, chess openings for beginners, chess tactics patterns, chess middlegame plans, chess endgames to know, Lucena and Philidor position, chess tips and best practices, chess facts]
categories: chess games beyond
related: ["/blog_posts/p-vs-np-explained-simply.html", "/blog_posts/monte-carlo-simulation-explained.html", "/blog_posts/philosophy-notes.html"]
faq:
  - q: "What is the best chess opening for beginners?"
    a: "There is no single best one. As White, the Italian Game (1.e4 e5 2.Nf3 Nc6 3.Bc4) or the London System (1.d4, Bf4, e3, Nf3) teach development and king safety without much theory. As Black, answer 1.e4 with 1...e5 or the Caro-Kann, and 1.d4 with the Queen's Gambit Declined. Understanding the plans matters more than memorising long lines."
  - q: "How many chess openings are there?"
    a: "Thousands of named openings and variations exist. The Encyclopaedia of Chess Openings (ECO) groups them into 500 codes, from A00 to E99: A for flank openings, B for semi-open games other than the French, C for 1.e4 e5 and the French, D for closed games such as the Queen's Gambit, and E for Indian defences such as the King's Indian and Nimzo-Indian."
  - q: "What is the fastest checkmate in chess?"
    a: "Fool's Mate: 1.f3 e5 2.g4 Qh4#, checkmate after two moves by each side, the shortest possible. It only works because White moved the f- and g-pawns and opened the diagonal to the king. The best-known four-move trap is Scholar's Mate (1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6?? 4.Qxf7#), which a single defensive move like 3...g6 or 3...Qe7 stops."
  - q: "How can I get better at chess quickly?"
    a: "Solve tactics puzzles most days, because most games below master level are decided by tactical mistakes. Play longer games (15 minutes or more) and review every loss to find the move where it went wrong. Learn a few openings by their plans rather than by rote, and study the basic endgames: king and pawn, Lucena, Philidor and the basic checkmates."
  - q: "Is chess solved?"
    a: "No. Chess as a whole is not solved, and the game is far too large for current computers: about 4.8 × 10^44 legal positions. Only endgames with up to seven pieces are solved: the Syzygy tablebases, completed in 2018, give perfect play for every such position. Engines such as Stockfish play far better than humans, but they don't prove the result of the starting position."
---

# Chess Openings, Tactics and Endgames: A Playable Guide

> **In short:** Good chess rests on a short list of ideas. In the opening, control the centre, develop your knights and bishops and castle early. In the middlegame, check every forcing move (checks, captures, threats) and give your worst piece a job. In the endgame, activate your king and learn a few positions by heart: king and pawn, Lucena and Philidor.

<link rel="stylesheet" href="/blog_posts/experiments/chess/chess-post.css">

I play chess, and this is the page I wanted to keep coming back to: famous openings, tactics, middlegame plans, endgames, habits and facts, all on boards you can play on. Every board runs on a real rules engine in your browser, every puzzle was checked with Stockfish 16, and every endgame line with the Lichess 7-piece tablebase. The full explanations are folded under **Read more**.

<figure class="hv bleed hero" data-hv="hero">
<div class="hv-canvas"><p class="hv-fallback">Figure: Paul Morphy's Opera Game, Paris 1858, replayed move by move with a lesson for each key move. White (Morphy) against the Duke of Brunswick and Count Isouard: 1.e4 e5 2.Nf3 d6 3.d4 Bg4 4.dxe5 Bxf3 5.Qxf3 dxe5 6.Bc4 Nf6 7.Qb3 Qe7 8.Nc3 c6 9.Bg5 b5 10.Nxb5 cxb5 11.Bxb5+ Nbd7 12.O-O-O Rd8 13.Rxd7 Rxd7 14.Rd1 Qe6 15.Bxd7+ Nxd7 16.Qb8+ Nxb8 17.Rd8#. A meter counts pieces in play (pieces that have left their starting square): at the final position all 8 of White's pieces have moved, against 5 of Black's 8; Black's king, f8 bishop and h8 rook never moved.</p></div>
<figcaption><strong>Morphy mated in 17 moves with every piece in play; Black never moved three of theirs.</strong> The Opera Game, replayed by the page's rules engine. The meter counts pieces (not pawns) that have left their starting square.</figcaption>
</figure>

## What can I learn from this page today?

<figure class="hv" data-hv="daily">
<div class="hv-canvas"><p class="hv-fallback">Figure: today's study card, chosen by the date. It shows one tactics puzzle to solve on a live board (the page has 7: fork, pin, skewer, discovered check, back-rank mate, smothered mate and removing the defender), one principle (from 14, such as "Castle early, usually in the first 10 moves"), one fact (from 15, such as "A knight in the corner controls 2 squares; in the centre it controls 8") and one opening to look at (from 13). Buttons move to the previous or next card. Solved puzzles are remembered on your device.</p></div>
<figcaption><strong>A new puzzle, principle, fact and opening every day.</strong> The card changes with the date; use the buttons to browse. Progress is stored only in your browser.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: how to use this page</summary>

This page is meant to be revisited. Each day the card at the top picks one of the 7 tactics puzzles, one of 14 principles, one of 15 facts and one of 13 openings, so a quick visit always has something to practise. The sections below are the full reference, in the order a game unfolds: openings, then middlegame tactics and plans, then endgames, then the habits that tie them together, and finally some facts.

Every board is driven by the same small rules engine, written for this page. It generates all legal moves, including castling, en passant and promotion, and detects check, checkmate and stalemate. It passes perft, the standard move-generator test: from the starting position it counts exactly 20, 400, 8,902, 197,281 and 4,865,609 possible games after 1 to 5 plies. Every opening line, trap, puzzle and endgame below is replayed through it, so an illegal move would break the page rather than show a wrong board.

</details>

## What are the best chess openings to learn?

<figure class="hv bleed" data-hv="openings">
<div class="hv-canvas"><p class="hv-fallback">Figure: an opening explorer and trainer with 13 openings, grouped by first moves. After 1.e4 e5: Italian Game (C50–C54), Ruy Lopez (C60–C99), King's Gambit (C30–C39). After other replies to 1.e4: Sicilian Najdorf (B90–B99), French Advance (C02), Caro-Kann (B10–B19), Scandinavian (B01). After 1.d4 d5: Queen's Gambit Declined (D30–D69), Slav (D10–D19). After 1.d4 Nf6: King's Indian (E60–E99), Nimzo-Indian (E20–E59). Other 1.d4: London System. Flank: English Opening (A10–A39). For each, a board steps through the main line, with the idea, White's plan, Black's plan and who plays it. In Train mode you play one side from memory and the board checks every move against the book line; openings played without a slip get a tick, saved on your device.</p></div>
<figcaption><strong>Learn the plan first, then the moves.</strong> Pick an opening, step through its main line, then switch to <b>Train</b> and play it from memory. Lines are standard main lines, checked for legality by the engine.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: the main openings, their ideas and how to choose</summary>

An **opening** is the first 10 to 15 moves of a game, where both sides develop their pieces and fight for the centre. Named openings are sequences that have been played and analysed for centuries. The Encyclopaedia of Chess Openings (ECO) sorts them into 500 codes from A00 to E99, which is why the explorer shows a code for each.

Choose by the kind of game you like, not by fashion. Open games (1.e4 e5) lead to quick development and tactics; semi-open defences such as the Sicilian or French create unbalanced positions; closed games (1.d4 d5) are slower and more strategic. One opening for White, one answer to 1.e4 and one answer to 1.d4 is enough for years.

| Opening | Main line | ECO | Core idea |
|---|---|---|---|
| Italian Game | 1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 | C50–C54 | Bishop on c4 aims at f7; slow centre with c3 and d3, then d4 |
| Ruy Lopez | 1.e4 e5 2.Nf3 Nc6 3.Bb5 | C60–C99 | Long-term pressure on the knight that guards e5 |
| King's Gambit | 1.e4 e5 2.f4 | C30–C39 | Give a pawn to open the f-file and build a big centre |
| Sicilian Najdorf | 1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6 | B90–B99 | Unbalanced: Black trades a wing pawn for a centre pawn |
| French Advance | 1.e4 e6 2.d4 d5 3.e5 c5 | C02 | Black attacks the base of White's pawn chain |
| Caro-Kann | 1.e4 c6 2.d4 d5 | B10–B19 | Solid ...d5 with the light bishop developed first |
| Scandinavian | 1.e4 d5 2.exd5 Qxd5 | B01 | Immediate challenge to e4; simple setup |
| Queen's Gambit Declined | 1.d4 d5 2.c4 e6 | D30–D69 | Hold d5 with ...e6; free the game later with ...c5 |
| Slav | 1.d4 d5 2.c4 c6 | D10–D19 | Support d5 without locking in the c8 bishop |
| King's Indian | 1.d4 Nf6 2.c4 g6 3.Nc3 Bg7 4.e4 d6 | E60–E99 | Let White build a centre, then strike with ...e5 and a kingside attack |
| Nimzo-Indian | 1.d4 Nf6 2.c4 e6 3.Nc3 Bb4 | E20–E59 | Pin the c3 knight to control e4 |
| London System | 1.d4, Bf4, e3, Nf3, c3, Nbd2 | D02 / A46 / A48 | One setup against almost everything |
| English | 1.c4 | A10–A39 | Control d5 from the side; a reversed Sicilian |

**Opening principles** work in every one of them: control the centre, develop knights and bishops before moving a piece twice, castle early, don't bring the queen out early, and connect your rooks. When you forget the book move, these principles usually find a good one.

A few facts behind the names: the Ruy Lopez is named after Ruy López de Segura, a 16th-century Spanish priest; the Caro-Kann after Horatio Caro and Marcus Kann, who analysed it in the 1880s; the English Opening after the English master Howard Staunton, who played 1.c4 in his 1843 match against Pierre Saint-Amant. In the 1927 world championship match between José Raúl Capablanca and Alexander Alekhine, 32 of the 34 games were a Queen's Gambit Declined.

</details>

### Which opening traps should every player know?

<figure class="hv" data-hv="traps">
<div class="hv-canvas"><p class="hv-fallback">Figure: four opening traps replayed on a board. Fool's Mate: 1.f3 e5 2.g4 Qh4#, checkmate in 2 moves. Scholar's Mate: 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6?? 4.Qxf7#, checkmate in 4 moves. Légal's Mate: 1.e4 e5 2.Nf3 d6 3.Bc4 Bg4 4.Nc3 g6 5.Nxe5 Bxd1 6.Bxf7+ Ke7 7.Nd5#, checkmate in 7 moves with three minor pieces after giving up the queen. Elephant Trap: 1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.Bg5 Nbd7 5.cxd5 exd5 6.Nxd5 Nxd5 7.Bxd8 Bb4+ 8.Qd2 Bxd2+ 9.Kxd2 Kxd8, and White ends a piece down.</p></div>
<figcaption><strong>Every trap punishes one greedy or careless move.</strong> Three end in checkmate and one wins a piece; the engine confirms each final position.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: what each trap teaches</summary>

**Fool's Mate** (1.f3 e5 2.g4 Qh4#) is the fastest possible checkmate. Moving the f- and g-pawns opens the e1-h4 diagonal, and nothing can block it.

**Scholar's Mate** (1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6?? 4.Qxf7#) is the trap beginners meet most. The queen and bishop both hit f7, which only the king defends. Defend with 3...g6 or 3...Qe7, and White's early queen just becomes a target.

**Légal's Mate** (1.e4 e5 2.Nf3 d6 3.Bc4 Bg4 4.Nc3 g6 5.Nxe5 Bxd1 6.Bxf7+ Ke7 7.Nd5#) shows that a pinned piece isn't always truly pinned: White gives up the queen and mates with bishop and two knights. Black should play 5...dxe5 instead of taking the queen, and accept the loss of a pawn.

**The Elephant Trap** in the Queen's Gambit Declined (after 4...Nbd7 5.cxd5 exd5 6.Nxd5?? Nxd5! 7.Bxd8 Bb4+ 8.Qd2 Bxd2+ 9.Kxd2 Kxd8) punishes White for assuming the f6 knight is pinned. Black ends up a knight ahead.

</details>

## Why do opening principles work? Control the centre

<figure class="hv" data-hv="mobility">
<div class="hv-canvas"><p class="hv-fallback">Figure: a heat map of how many squares a piece controls from each square of an empty board, computed by the move generator. Knight: 2 in a corner, 8 in the centre, average 5.25. Bishop: 7 on the edge, 13 in the centre, average 8.75. Rook: 14 from every square. Queen: 21 on the edge, 27 in the centre, average 22.75. King: 3 in a corner, 8 in the middle, average 6.56. Tap a square to place the piece and see its moves.</p></div>
<figcaption><strong>A knight on the rim controls 2 squares; in the centre it controls 8.</strong> Computed live by the page's move generator on an empty board; pick a piece and tap a square.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: why centralised pieces are stronger</summary>

Pieces in the centre reach more squares, so they attack more, defend more and can switch to either wing in one move. The numbers below count the squares each piece controls from every square of an empty board.

| Piece | Fewest squares | Most squares | Average over 64 squares |
|---|---|---|---|
| Knight | 2 (corner) | 8 (centre) | 5.25 |
| Bishop | 7 (edge) | 13 (centre) | 8.75 |
| Rook | 14 | 14 | 14 |
| Queen | 21 (edge) | 27 (centre) | 22.75 |
| King | 3 (corner) | 8 (middle) | 6.56 |

The knight gains the most from the centre: four times as many squares on d4 as on a1, which is where the saying "a knight on the rim is dim" comes from. The rook is the exception: on an empty board it always controls 14 squares, so rooks care about **open files** rather than central squares. That is why the opening advice is to develop knights and bishops towards the centre first, and to bring rooks to open files later.

</details>

## What are the most common chess tactics?

<figure class="hv bleed" data-hv="tactics">
<div class="hv-canvas"><p class="hv-fallback">Figure: seven tactics puzzles, White to move, each solved on a live board. Fork: knight d5 to c7 checks the king on e8 and attacks the rook on a8 (1.Nc7+ Ke7 2.Nxa8). Pin: 1.Bc4 pins Black's queen on d5 to the king on g8. Skewer: 1.Ra6+ and after the king moves, 2.Rxh6 takes the queen. Discovered check: 1.Nxc6+, the knight takes the queen while the e1 rook gives check. Back-rank mate: 1.Rd8#. Smothered mate: 1.Qg8+ Rxg8 2.Nf7#. Removing the defender: 1.Bxf6, taking the only defender of h7, after which Qxh7 is mate. Stockfish 16 confirmed that each solution is the only winning move, or the fastest mate.</p></div>
<figcaption><strong>Seven patterns decide most club games.</strong> Play the move on the board or type it. Each solution was checked with Stockfish 16: it is the only winning move, or the fastest mate.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: forks, pins, skewers and the other patterns</summary>

A **tactic** is a short, forcing sequence that wins material or gives checkmate. Most games below master level are decided by one, so tactical patterns are the best return on study time. They are easier to spot once you know their names.

| Pattern | What happens | Puzzle solution |
|---|---|---|
| **Fork** | One piece attacks two targets at once; the opponent can save only one | 1.Nc7+ Ke7 2.Nxa8 |
| **Pin** | A piece can't move without exposing a more valuable piece behind it | 1.Bc4, pinning the queen to the king |
| **Skewer** | A reverse pin: the valuable piece is in front and must move, losing the one behind | 1.Ra6+ Ke7 2.Rxh6 |
| **Discovered attack / check** | Moving one piece unmasks an attack by another | 1.Nxc6+ (the rook gives check) |
| **Back-rank mate** | A rook or queen mates a king trapped behind its own pawns | 1.Rd8# |
| **Smothered mate** | A knight mates a king boxed in by its own pieces | 1.Qg8+ Rxg8 2.Nf7# |
| **Removing the defender** | Capture or deflect the piece that guards a key square | 1.Bxf6, then Qxh7# |

How these were checked: each position was analysed by Stockfish 16 with three candidate moves at depth 24. The solution was the top move every time, and every other White move scored at least 3 pawns worse (or was not a mate). For the smothered mate, 1.Nf7+ also wins (it is mate in 4, a pattern called Philidor's Legacy), but 1.Qg8+ mates in 2; the puzzle accepts the knight check and tells you a faster mate exists.

</details>

## How do you make a plan in the middlegame?

<figure class="hv" data-hv="plans">
<div class="hv-canvas"><p class="hv-fallback">Figure: six annotated boards of middlegame plans. Knight outpost: a white knight on d5, supported by pawns on c4 and e4, that no black pawn can attack. Rooks on open files: White's rook owns the d-file and invades d7. Isolated queen's pawn: a white pawn on d4 with no neighbouring pawns, with the d4-d5 break. Minority attack: White pushes b4-b5 to attack Black's c6 pawn and leave a weakness. The bishop pair: bishops on b2 and f3 sweeping both long diagonals. Improve your worst piece: White's idle a1 rook goes to b1, on the half-open b-file aiming at b7.</p></div>
<figcaption><strong>No tactic? Find a plan: a square to own, a file to open, a piece to improve.</strong> Illustrative positions; Stockfish rates each roughly balanced, so the plan, not a hidden tactic, is the point.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: the six middlegame plans</summary>

When there are no tactics, a **plan** tells you what to do: a target to attack, a square to occupy or a piece to improve. Plans come from the pawn structure, because pawns move slowly and decide where the pieces belong.

1. **Knight outpost.** An outpost is a square no enemy pawn can attack. A knight there, supported by a pawn, can't be chased away. A strong knight on d5 or e5 often outplays a bishop.
2. **Rooks on open files.** A file with no pawns is a highway for rooks. Take it first, then invade the seventh rank, where a rook attacks pawns from the side and confines the enemy king.
3. **Isolated queen's pawn (IQP).** A pawn on d4 with no pawns on the c- or e-files. With many pieces on the board it gives space and attacking chances and the d4-d5 break; in an endgame it is a weakness. The side with the IQP keeps pieces on; the defender trades them and blockades the square in front of the pawn.
4. **Minority attack.** Two pawns attack three: in Queen's Gambit structures White pushes b4-b5 to trade on c6 and leave Black with a weak c-pawn.
5. **The bishop pair.** Two bishops cover both colours of square. Open the position with pawn breaks, and they usually beat bishop and knight.
6. **Improve your worst piece.** When nothing is happening, find the piece doing the least and give it a job, often by moving a rook to an open or half-open file.

Each diagram was checked with Stockfish 16 so that it holds no hidden tactic: every one evaluates between −0.4 and +0.9 pawns, so the plan, not a trick, is what matters.

</details>

## Which endgames should every chess player know?

<figure class="hv bleed" data-hv="endgames">
<div class="hv-canvas"><p class="hv-fallback">Figure: five endgame patterns replayed on a board, each line checked move by move with the Lichess 7-piece tablebase. Lucena position (White wins): 1.Rd1+ Ke7 2.Rd4 Ra1 3.Kc7 Rc1+ 4.Kb6 Rb1+ 5.Kc6 Rc1+ 6.Kb5 Rb1+ 7.Rb4, building a bridge to shelter the king from checks. Philidor position (draw): with Black to move, 1...Ra6 2.Rh7 Rb6 3.d6 Rb1 4.Ke6 Re1+ 5.Kd5 Rd1+, keeping the rook on the sixth rank, then checking from behind. Opposition (White wins): Black to move must give way, 1...Kd8 2.Kf7 Kd7 3.e6+ Kd8 4.e7+ Kd7 5.e8=Q+. Queen mate: K+Q vs K mated in 12 moves, ending 12.Qg7#. Rook mate: K+R vs K mated in 16 moves, ending 16.Rh8#.</p></div>
<figcaption><strong>Five positions you can learn once and use for life.</strong> Every move in every line keeps the stated result in the Lichess 7-piece tablebase.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: Lucena, Philidor, opposition and the basic mates</summary>

Endgames are where small advantages turn into wins, and a handful of positions come up again and again. Learn them once and you will recognise them for the rest of your life.

**The Lucena position** is the most important winning position in rook endgames: your king stands in front of your pawn on the seventh rank, and the enemy king is cut off by at least one file. The winning method is "building a bridge": check the enemy king one more file away, put your rook on the fourth rank, walk your king out, and when the checks run out, block with the rook.

**The Philidor position** is the most important drawing method. The defending king stands in front of the pawn and the defending rook holds the sixth rank, counted from the attacker's side (the defender's own third rank), so the attacking king can't advance. When the pawn steps forward, the rook drops to the back rank and checks from behind; the attacking king has nowhere to hide.

**Opposition** decides king-and-pawn endings. When the kings face each other with one square between them, the side that is *not* to move has the opposition, and the other king must give way. A king in front of its pawn with the opposition wins; the same position with the wrong side to move can be a draw.

**The basic mates.** King and queen against king is mated by shrinking the box (keep the queen a knight's move from the enemy king), bringing your own king up, and mating on the edge, without allowing stalemate. King and rook against king works the same way: the rook cuts off a rank or file, your king takes the opposition, and a rook check pushes the king back one line at a time.

| Endgame | Result with best play | Key technique |
|---|---|---|
| Lucena | Win | Build a bridge on the 4th rank |
| Philidor | Draw | Rook on the 6th rank, then check from behind |
| King and pawn vs king | Depends on the opposition and key squares | King in front of the pawn |
| King and queen vs king | Win | Shrink the box; avoid stalemate |
| King and rook vs king | Win | Cut off, take the opposition, check |

How these were checked: every position in every line was looked up in the [Lichess tablebase](https://tablebase.lichess.ovh/), which has perfect results for all positions with up to seven pieces, and each kept the stated result.

</details>

### Can you win with king and pawn against king? Play a perfect defender

<figure class="hv" data-hv="kpk">
<div class="hv-canvas"><p class="hv-fallback">Figure: a game of king and pawn against king, where you play White and the computer defends perfectly. The page builds an exact win/draw table for all 331,352 legal king-and-pawn-versus-king positions by retrograde analysis, in the same way as Stockfish's bitbase; it agreed with the Lichess tablebase on 200 random positions out of 200. Four lessons: take the opposition (White king e5, pawn e4, Black king e8: Ke6, Kd6 or Kf6 wins, Kd5 or Kf5 draws), king in front (king e3, pawn e2 against king d7), outrun the king (the rule of the square: 1.b4 wins), and a rook pawn (king f4 and pawn h4 against king f7: a draw, although the same position with a g-pawn wins). A badge shows the perfect-play verdict after every move.</p></div>
<figcaption><strong>The table never lies: one wrong king step turns a win into a draw.</strong> An exact table of all 331,352 positions, built in your browser and checked against the Lichess tablebase.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: key squares, the rule of the square and rook pawns</summary>

King and pawn against king is the endgame every other endgame turns into, so it is worth knowing exactly. The page computes the answer for every legal position (331,352 of them, counting who is to move) by **retrograde analysis**: it marks the positions where the pawn can promote safely as wins, the positions where Black can take the pawn or is stalemated as draws, and then works backwards until nothing changes. This is the same method as the KPK "bitbase" in the Stockfish engine. I compared it with the Lichess tablebase on 200 random positions, and all 200 agreed.

Three rules cover most of it:

- **Key squares.** If your king reaches one of the key squares (for a pawn on its 2nd to 4th rank, the three squares two ranks in front of it), you win whoever is to move. So bring the king first and push the pawn later.
- **Opposition.** If the defending king blocks you, take the opposition: face it with one square between and make the defender move.
- **Rule of the square.** If your king is far away, draw a square from the pawn to its promotion rank. If the defending king can step into that square, it catches the pawn; if not, the pawn promotes alone. A pawn on its starting rank counts from one rank higher, because it can move two squares.

Rook pawns are the big exception. With an a- or h-pawn, a defending king that reaches the corner in front of the pawn draws, because there is no room to go around it. In the last lesson, king f4 and pawn h4 against king f7 is a draw, while the same position with a g-pawn is a win.

</details>

## How should you think during a chess game?

<figure class="hv" data-hv="routine">
<div class="hv-canvas"><p class="hv-fallback">Figure: a loop of five steps to repeat before every move. 1, What does their move want? Ask what the opponent's last move threatens or prepares. 2, Checks, captures, threats: list every forcing move for both sides. 3, Pick 2–3 candidate moves. 4, Calculate and compare the end positions. 5, Blunder check, then move: after this move, what is undefended, and what checks or captures does the opponent get?</p></div>
<figcaption><strong>Five questions, every move, until they become habit.</strong> Tap a step to read it. A routine, not a rule: in time trouble, keep at least steps 1 and 5.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: best practices during a game and between games</summary>

Most lost games are not lost to deep strategy but to a missed threat or a loose piece. A fixed thinking routine catches most of those. The five steps in the loop take seconds once they are habit:

1. **What does their move want?** Every move has a purpose: a threat, a plan, a new weakness. Find it before you think about your own ideas.
2. **Checks, captures, threats.** List every forcing move for both sides. Forcing moves limit the replies, so they are the easiest to calculate and the most dangerous to miss.
3. **Candidate moves.** Pick two or three moves worth calculating, forcing moves first.
4. **Calculate and compare.** Look a few moves ahead and judge the resulting positions, not just the first move.
5. **Blunder check.** Before you let go of the piece, look at what your move leaves undefended and which checks and captures it allows.

Between games, a few habits matter more than anything else:

- **Solve tactics puzzles regularly.** Pattern recognition is what makes the forcing moves jump out.
- **Play slower games** (15 minutes or longer per side), so you have time to use the routine, and **review every loss**, ideally before using an engine, to find the move where it went wrong.
- **Learn openings by their plans**, a few moves deep, and add theory only where your own games leave the book.
- **Study the basic endgames** above. They come up constantly, and they teach how pieces cooperate.
- **Manage the clock.** Spend time on critical moments (the end of the opening, captures, pawn breaks) and play obvious moves quickly.

</details>

## What are some surprising facts about chess?

<figure class="hv" data-hv="facts">
<div class="hv-canvas"><p class="hv-fallback">Figure: four headline numbers and a live counter. About 4.8 × 10^44 legal positions (John Tromp's estimate); about 10^120 possible games (Claude Shannon, 1950); 269 moves in the longest tournament game (Nikolić vs Arsović, Belgrade 1989); 2882, the highest FIDE rating ever (Magnus Carlsen, May 2014). The page counts every possible game after 1 to 5 plies with the page's move generator: 20; 400; 8,902; 197,281; 4,865,609, drawn as bars on a log scale.</p></div>
<figcaption><strong>From 20 first moves to almost 5 million games in five plies.</strong> Counted live in your browser when the chart scrolls into view (a few seconds); the counts match the standard perft reference numbers.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: chess facts, numbers and history</summary>

**The numbers.** There are about 4.8 × 10^44 legal chess positions, according to [John Tromp's estimate from random sampling](https://tromp.github.io/chess/chess.html). The number of possible *games* is far larger: in his 1950 paper on chess programs, Claude Shannon estimated about 10^120, now called the Shannon number. The growth starts immediately: White has 20 first moves, there are 400 possible games after one move each, and 4,865,609 after five plies. That explosion is the same kind of search-space problem I wrote about in [P vs NP, explained simply](/blog_posts/p-vs-np-explained-simply.html).

**Is chess solved?** No. Only endgames with up to seven pieces are: the [Syzygy tablebases](https://lichess.org/blog/W3WeMyQAACQAdfAL/7-piece-syzygy-tablebases-are-complete), completed in 2018, give perfect play for every such position, after the Lomonosov tablebases reached seven pieces in 2012. Engines play far better than any human without solving the game. DeepMind's AlphaZero (2017) learned chess purely from self-play, guided by Monte Carlo tree search, a cousin of the random sampling in my post on [Monte Carlo simulation](/blog_posts/monte-carlo-simulation-explained.html).

**History.** Chess began in India as *chaturanga*, around the 6th century CE, and reached Persia as *shatranj*. The word "checkmate" comes, via Arabic and Old French, from the Persian *shāh māt*; *shāh* means king. The queen was a weak piece for centuries and gained its modern move only in the late 15th century: the Valencian poem *Scachs d'amor*, often dated around 1475, is the earliest known text that describes it.

**Records.**

| Fact | Detail |
|---|---|
| Fastest checkmate | Fool's Mate, 1.f3 e5 2.g4 Qh4#, two moves each |
| Longest tournament game | Nikolić vs Arsović, Belgrade 1989: 269 moves, a draw, 20 hours 15 minutes |
| Highest rating | Magnus Carlsen, 2882 on the May 2014 FIDE list |
| Man vs machine | IBM's Deep Blue beat world champion Garry Kasparov 3.5–2.5 in May 1997 |
| India's first grandmaster | Viswanathan Anand, 1988; later a five-time world champion |
| Youngest undisputed world champion | D. Gukesh, aged 18, beat Ding Liren 7.5–6.5 in Singapore on 12 December 2024 |

As of 26 November 2026, Gukesh is defending his title against Javokhir Sindarov, winner of the 2026 Candidates tournament, in a 14-game match in Geneva that runs from 24 November to 12 December 2026.

</details>

## Sources

- [Opera Game](https://en.wikipedia.org/wiki/Opera_Game), Wikipedia, for the game score and setting (Morphy vs the Duke of Brunswick and Count Isouard, Paris, 1858).
- [Stockfish](https://stockfishchess.org/) 16, used to check every puzzle and diagram; the [Lichess tablebase](https://tablebase.lichess.ovh/) (Syzygy, up to 7 pieces), used to check every endgame line and the KPK table.
- Stockfish's KPK bitbase method, [bitbase.cpp](https://github.com/official-stockfish/Stockfish/blob/sf_16/src/bitbase.cpp), which the in-page king-and-pawn table follows.
- [Perft results](https://www.chessprogramming.org/Perft_Results), Chess Programming Wiki, the reference counts the page's move generator matches.
- John Tromp, [John's Chess Playground](https://tromp.github.io/chess/chess.html), for the ~4.8 × 10^44 legal positions estimate; [Shannon number](https://en.wikipedia.org/wiki/Shannon_number), Wikipedia.
- Lichess, [7-piece Syzygy tablebases are complete](https://lichess.org/blog/W3WeMyQAACQAdfAL/7-piece-syzygy-tablebases-are-complete) (2018); [Lomonosov tablebases](https://www.chessprogramming.org/Lomonosov_Tablebases), Chess Programming Wiki.
- [List of world records in chess](https://en.wikipedia.org/wiki/List_of_world_records_in_chess), Wikipedia (Nikolić vs Arsović, 1989).
- Guinness World Records, [Highest chess rating (men)](https://www.guinnessworldrecords.com/world-records/68289-highest-chess-rating-men) (Carlsen, 2882, May 2014).
- Chess.com, [18-year-old Gukesh becomes youngest-ever undisputed world champion](https://www.chess.com/news/view/fide-world-chess-championship-2024-game-14) (December 2024), and [Sindarov, Vaishali triumph: FIDE Candidates 2026 conclusions](https://www.chess.com/news/view/sindarov-vaishali-win-7-fide-candidates-2026-conclusions).
- ChessBase, [Scachs d'amor: the poem that first portrayed the modern rules of chess](https://en.chessbase.com/post/scachs-damor-poem-part-1).

<script defer src="/blog_posts/experiments/chess/chess-engine.js"></script>
<script defer src="/blog_posts/experiments/chess/chess-data.js"></script>
<script defer src="/blog_posts/experiments/chess/chess-post.js"></script>
