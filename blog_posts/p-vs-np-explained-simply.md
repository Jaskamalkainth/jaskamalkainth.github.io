---
title: "P vs NP Explained Simply: What If It's Proved or Disproved?"
description: "P vs NP asks if every problem whose answer is quick to check is also quick to solve. Still open in November 2026; here's what a proof either way would change."
date: 2026-11-24
last_modified_at: 2026-11-24
keywords: [P vs NP explained, what is P vs NP, P vs NP problem in simple terms, what happens if P = NP, NP-complete problems, P vs NP 2026, exponential time hypothesis, millennium prize problems]
categories: computers algorithms complexity
math: true
related: ["/blog_posts/assembly-language-explained-simply.html", "/blog_posts/monte-carlo-simulation-explained.html", "/blog_posts/hnsw-explained.html"]
faq:
  - q: "Has anyone won the $1 million prize for P vs NP?"
    a: "No. As of November 2026 the Clay Mathematics Institute still lists P vs NP as unsolved. Hundreds of claimed proofs have been posted over the years, including a widely covered one by Vinay Deolalikar in 2010, and all have had errors. Clay's rules only consider a solution after it is published in a refereed journal and has been accepted by mathematicians for at least two years."
  - q: "Would P = NP break all encryption?"
    a: "Only if the proof came with a fast, practical algorithm. Breaking RSA, elliptic-curve keys or AES means finding a secret that is quick to check, which is an NP-style search. If P = NP with a usable algorithm, almost all of today's cryptography would fall. A proof that only gave an algorithm taking n^100 steps, or no usable algorithm at all, would change little in practice."
  - q: "Did AI solve P vs NP in 2026?"
    a: "No. In October 2026 OpenAI and Anthropic each posted AI-written papers claiming that 3-SAT can be solved in about 2^(n/√log n) time, which would refute the Exponential Time Hypothesis, and in November Anthropic posted a claimed proof that VP ≠ VNP, an algebraic cousin of the question. Both labs say P vs NP is not settled, and as of 24 November 2026 none of these claims had passed peer review."
  - q: "Is the traveling salesman problem NP-complete?"
    a: "The yes-or-no version is: given cities, distances and a budget L, is there a tour of length at most L? That question is NP-complete. The version most people mean, find the shortest tour, is NP-hard: it is at least as hard, but its answer is not a simple yes or no, so it is not in NP itself. In practice, solvers still find optimal tours for many thousands of cities."
  - q: "Could P vs NP be impossible to prove?"
    a: "Possibly, but nobody has shown that. It could in principle be independent of the standard axioms of mathematics (ZFC), the way the continuum hypothesis is. What researchers have proved are barriers: relativization (1975), natural proofs (1994) and algebrization (2008) show that whole families of proof techniques cannot settle P vs NP. That rules out methods, not answers."
---

# P vs NP Explained Simply: What If It's Proved or Disproved?

> **In short:** P vs NP asks whether every problem whose answer is quick to *check* is also quick to *solve*. "P" is the quick-to-solve problems; "NP" is the quick-to-check ones. Nobody knows whether they are the same. As of November 2026 the question is still open, worth a $1 million prize, and most experts bet that P ≠ NP.

<link rel="stylesheet" href="/blog_posts/experiments/p-vs-np/pnp-post.css">

This post is meant to be played more than read. Meet **Solver**, a robot who has to *find* answers, and **Checker**, an owl who only has to *check* them. Watch them race, take the tour, then do both jobs yourself. The full explanation, with every source, is folded under **Read more**.

<figure class="hv bleed hero" data-hv="hero">
<div class="hv-canvas"><p class="hv-fallback">Figure: a map of 10 towns joined by 19 roads. Each town must get one of three colors, and no road may join two towns of the same color. Solver, a robot, tries colorings one after another in order: it needs 12,183 tries out of 3^10 = 59,049 possible colorings to find the first one that works. Checker, an owl, is handed that coloring and checks it by looking at each of the 19 roads once. Finding took 12,183 tries; checking took 19 looks.</p></div>
<figcaption><strong>Finding the answer took 12,183 tries. Checking it took 19 looks.</strong> P vs NP asks whether that gap is real or whether a clever enough Solver could always close it. Solver runs real brute-force search in your browser.</figcaption>
</figure>

## What is the P vs NP problem? Meet Solver and Checker

<figure class="hv bleed story" data-hv="story">
<div class="hv-canvas"><p class="hv-fallback">Figure: a scroll-driven tour. 1, Solver finds answers and Checker checks them. 2, P is the set of problems Solver can finish quickly, such as sorting, shortest routes and testing whether a number is prime. 3, NP is the set of problems whose answers Checker can check quickly, such as coloring a map, Sudoku and packing a knapsack. 4, every P problem is also in NP, so the P circle sits inside the NP circle. 5, NP-complete problems, such as SAT, map 3-coloring and the traveling salesman decision problem, are the hardest in NP: a fast method for one gives a fast method for all. 6, the question: is P the whole of NP? Two pictures alternate, one with P strictly inside NP (P ≠ NP) and one where the circles are the same (P = NP).</p></div>
<ol class="story-steps">
<li><div class="story-card"><h3>Meet Solver and Checker</h3><p>Solver has to <b>find</b> an answer from scratch. Checker is handed an answer and only has to say <b>yes, that works</b> or <b>no, it doesn't</b>.</p><span class="real">Real names: an <b>algorithm</b> that solves, and a <b>verifier</b>. The answer Checker is handed is a <b>certificate</b>.</span></div></li>
<li><div class="story-card"><h3>P: puzzles Solver finishes fast</h3><p>Sorting a list, finding the shortest road between two towns, testing whether a number is prime. Even when the puzzle gets huge, Solver's work only grows gently.</p><span class="real">Real name: <b>P</b>, problems solvable in <b>polynomial time</b> (like n² or n³ steps).</span></div></li>
<li><div class="story-card"><h3>NP: answers Checker can check fast</h3><p>Coloring a map, filling a Sudoku, packing a bag to an exact weight. Finding an answer may take forever, but checking one someone hands you is quick.</p><span class="real">Real name: <b>NP</b>, "nondeterministic polynomial time". It does <b>not</b> mean "not polynomial".</span></div></li>
<li><div class="story-card"><h3>Every P puzzle is an NP puzzle too</h3><p>If Solver can find the answer fast, Checker can check any proposed answer by simply solving the puzzle again and comparing.</p><span class="real">Real name: <b>P ⊆ NP</b>. This part is proved.</span></div></li>
<li><div class="story-card"><h3>NP-complete: the boss puzzles</h3><p>Some NP puzzles are the hardest of all. Crack any one of them fast, and you've cracked every NP puzzle fast, because all the others can be translated into it.</p><span class="real">Real name: <b>NP-complete</b>. Cook proved SAT is one in 1971; Karp added 21 more in 1972. Thousands are known today.</span></div></li>
<li><div class="story-card"><h3>The million-dollar question</h3><p>Is the P circle secretly the whole NP circle? If yes, every puzzle that is easy to check is also easy to solve. Nobody has proved it either way.</p><span class="real">Real name: <b>P = NP?</b> A Clay Millennium Prize Problem since 2000.</span></div></li>
</ol>
<figcaption><strong>Two circles, one question: is the small one secretly the big one?</strong> Scroll to move through the tour. The circles show the two possible worlds; nobody knows which one we live in.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: what P, NP and NP-complete mean</summary>

**P** is the class of yes-or-no problems a computer can solve in **polynomial time**: the number of steps grows like a power of the input size $n$, such as $n^2$ or $n^3$. Sorting a list, finding a shortest path with Dijkstra's algorithm and testing whether a number is prime (proved to be in P in 2002, by the AKS algorithm) are all in P. Computer scientists use "polynomial time" as the formal meaning of "fast" or "efficient".

**NP** is the class of yes-or-no problems where every "yes" answer comes with a short proof, called a **certificate**, that a computer can check in polynomial time. For "can this map be colored with three colors so no neighbors match?", the certificate is the coloring itself; checking it means looking at each border once. The name means *nondeterministic polynomial time*: a machine that could magically guess the right certificate would solve the problem in polynomial time. NP does **not** stand for "not polynomial".

Every problem in P is also in NP, because a verifier can ignore the certificate and solve the problem itself. So $\text{P} \subseteq \text{NP}$ is a theorem. The open question is the other direction: is every problem in NP also in P?

$$\text{P} \overset{?}{=} \text{NP}$$

A problem is **NP-complete** if it is in NP and every other NP problem can be translated into it in polynomial time (a *reduction*). In 1971 Stephen Cook proved that SAT, deciding whether a logic formula can be made true, is NP-complete; Leonid Levin found the same result independently in the Soviet Union. In 1972 Richard Karp showed 21 more classic problems are NP-complete, and today thousands are known. Because they all translate into each other, **one fast algorithm for any NP-complete problem would give a fast algorithm for every problem in NP**, and P would equal NP.

A problem that is at least as hard as every NP problem, but not necessarily in NP itself, is **NP-hard**. "Find the shortest traveling salesman tour" is NP-hard; "is there a tour shorter than L?" is NP-complete.

| Problem | Class (as far as anyone knows) | Why |
|---|---|---|
| Sorting, shortest path, primality | P | Fast algorithms are known |
| Map 3-coloring, SAT, Sudoku on n²×n² grids, knapsack, traveling salesman (decision) | NP-complete | Easy to check; no fast algorithm known |
| Factoring large numbers | NP, not known to be in P or NP-complete | Easy to check (multiply), hard to find; RSA relies on it |
| Shortest traveling salesman tour | NP-hard | The answer is a tour, not yes/no |

The question is older than the names. In a 1956 letter to John von Neumann, Kurt Gödel asked how fast a machine could find proofs of mathematical statements, and noted that if it could be done quickly, much of mathematicians' work could be automated ([Fortnow, 2009](https://lance.fortnow.com/papers/files/pnp-cacm.pdf)). In 2000 the Clay Mathematics Institute made P vs NP one of its seven [Millennium Prize Problems](https://www.claymath.org/millennium/p-vs-np/), with $1 million for a correct solution. Clay states it as: "If it is easy to check that a solution to a problem is correct, is it also easy to solve the problem?"

</details>

## Why is checking easier than solving? Play both jobs

<figure class="hv bleed" data-hv="play">
<div class="hv-canvas"><p class="hv-fallback">Figure: a two-round game on the same 10-town, 19-road map. Round 1, be Solver: tap towns to cycle through three colors until no road joins two towns of the same color; a timer measures how long it takes. Round 2, be Checker: you are shown a finished coloring and tap "It works" or "There's a clash"; a timer measures how long checking takes. The game then shows both times side by side and how many times faster checking was.</p></div>
<figcaption><strong>Most people solve in tens of seconds and check in a few.</strong> Your own times are measured as you play; with 10 towns the gap is small, but it grows explosively as maps get bigger.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: why the gap between finding and checking matters</summary>

The game is the whole P vs NP question in miniature. To **solve** the map you have to search: try a color, notice a clash, back up, try again. To **check** a finished map you just walk along the roads once and look for two neighbors with the same color. With 10 towns and 19 roads, checking is 19 looks, every time.

Brute force makes the gap concrete. With 3 colors and $n$ towns there are $3^n$ possible colorings. For the 10-town map above that's 59,049, and trying them in order, Solver needs 12,183 tries before the first valid one (the hero animation runs exactly this search). Checker still needs only 19 looks. Add towns and the gap explodes: 100 towns give $3^{100} \approx 5 \times 10^{47}$ colorings, while checking grows only with the number of roads.

Clever Solvers do far better than brute force: they spot forced moves and prune dead ends, which is probably what you did. But for NP-complete problems, every known method still takes exponential time in the worst case. P vs NP asks whether that is a fact about the problems or just a gap in our knowledge.

One subtle point: checking is easy for **yes** answers. If a map *can't* be 3-colored, there's no obvious short certificate that proves it. Problems whose "no" answers are easy to check form the class co-NP, and whether NP = co-NP is another open question.

</details>

## How slow is "hard"? Polynomial vs exponential time

<figure class="hv" data-hv="scale">
<div class="hv-canvas"><p class="hv-fallback">Figure: a chart of steps needed to solve 3-SAT with n variables, on a log scale, with a slider for n from 10 to 1,000, at 1 billion steps per second. At n = 100: checking an answer takes about 1,280 steps (about 1.3 microseconds); a hypothetical n³ algorithm, if P = NP, takes 1,000,000 steps (1 millisecond); the best known method before 2026, about 1.308^n, takes about 4.6 × 10^11 steps (about 7.6 minutes); the 2026 claimed bound 2^(n/√ln n) takes about 1.1 × 10^14 steps (about 1.2 days); brute force 2^n takes about 1.3 × 10^30 steps (about 40 trillion years, roughly 3,000 times the age of the universe). With every hidden constant set to 1, the 2026 bound only beats 1.308^n beyond about n = 785.</p></div>
<figcaption><strong>Polynomial lines lie flat; exponential ones shoot past the age of the universe.</strong> Illustrative: every hidden constant and polynomial factor is set to 1, so read the shapes, not exact times.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: polynomial vs exponential time, with the numbers</summary>

"Fast" in P vs NP means **polynomial time**: the steps grow like $n^k$ for some fixed $k$. "Slow" means something like **exponential time**, $2^n$, where adding one more variable doubles the work. The difference is not about today's hardware. At a billion steps per second, $n^3$ steps for $n = 100$ is a millisecond, while $2^{100} \approx 1.27 \times 10^{30}$ steps is about 40 trillion years, roughly 3,000 times the age of the universe (13.8 billion years).

The chart uses **3-SAT**, the most studied NP-complete problem: a formula of $n$ true/false variables and clauses of three literals each, such as $(x_1 \lor \lnot x_5 \lor x_9)$. With about $4.26n$ clauses (where random formulas are hardest), checking a proposed assignment means reading about $3 \times 4.26n \approx 13n$ literals.

| Method | Steps for n = 100 | Time at 10⁹ steps/s |
|---|---|---|
| Check one answer (≈ 13n) | ≈ 1,280 | ≈ 1.3 µs |
| Hypothetical n³ algorithm (if P = NP) | 1,000,000 | 1 ms |
| Best known before 2026, ≈ 1.308ⁿ (randomized PPSZ) | ≈ 4.6 × 10¹¹ | ≈ 7.6 minutes |
| Claimed in 2026, 2^(n/√ln n) | ≈ 1.1 × 10¹⁴ | ≈ 1.2 days |
| Brute force, 2ⁿ | ≈ 1.3 × 10³⁰ | ≈ 40 trillion years |

These are **illustrative**: real running times carry constants and polynomial factors that the formulas hide, and I set all of them to 1. The best known general 3-SAT algorithm before 2026 is the randomized PPSZ algorithm of Paturi, Pudlák, Saks and Zane, whose $O(1.308^n)$ bound Timon Hertli extended to all 3-SAT formulas in 2011 ([Hertli, 2011](https://arxiv.org/abs/1103.2165)). Even with constants set to 1, the 2026 claimed bound $2^{n/\sqrt{\ln n}}$ only beats $1.308^n$ beyond about $n = 785$; it grows more slowly than any $c^n$, but it is still far from polynomial. That is why it can refute the Exponential Time Hypothesis without saying anything about P vs NP.

</details>

## What does a hard problem look like up close? A real 3-SAT solver

<figure class="hv" data-hv="sat">
<div class="hv-canvas"><p class="hv-fallback">Figure: a real random 3-SAT formula generated in the browser with n variables (slider from 10 to 24) and round(4.26 × n) clauses. Solver counts every satisfying assignment by brute force, trying all 2^n assignments: 1,024 for n = 10, 1,048,576 for n = 20 and 16,777,216 for n = 24. Checker verifies one satisfying assignment by reading every clause once (85 clauses for n = 20). A "run 10 → 24" button times brute force for each n on the reader's own device and draws a chart in which the time roughly doubles with every extra variable, then extrapolates how long n = 100 would take.</p></div>
<figcaption><strong>Each extra variable doubles Solver's time; Checker barely notices.</strong> Measured live on your device, with a real brute-force counter. Random formulas use a fixed seed per n.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: what the solver does, and why real SAT solvers are faster</summary>

The figure builds a random 3-SAT formula: $n$ variables and $\text{round}(4.26n)$ clauses, each with three different variables, randomly negated. Near that ratio of clauses to variables, random formulas switch from almost always satisfiable to almost never, and they are hardest to solve.

Solver then **counts** every satisfying assignment by brute force. Counting forces it to try all $2^n$ assignments, so its work doubles with every extra variable: 1,024 assignments for $n = 10$, 1,048,576 for $n = 20$, 16,777,216 for $n = 24$. Checker, handed one satisfying assignment, reads each clause once: 85 clauses for $n = 20$. Counting is also what the October 2026 papers do: OpenAI's algorithm counts the satisfying assignments of a formula rather than only deciding whether one exists.

Here is the core of both jobs, simplified from the figure's script (assignments are bit masks, and each clause is three variable indexes plus three sign bits):

```js
// Checker: is this assignment a solution? One pass over the clauses.
function check(clauses, assignment) {
  return clauses.every(c =>
    c.some(([v, negated]) => ((assignment >> v) & 1) !== negated));
}

// Solver (brute force): try all 2^n assignments and count the solutions.
function countSolutions(clauses, n) {
  let count = 0;
  for (let a = 0; a < 2 ** n; a++) if (check(clauses, a)) count++;
  return count;
}
```

Real SAT solvers are much smarter than this. Modern CDCL (conflict-driven clause learning) solvers routinely handle formulas from chip verification and planning with huge numbers of variables, because real-world formulas have structure they can exploit. P vs NP is about the **worst case**: whether some formulas will always force exponential work, whatever the algorithm.

</details>

## What happens if P vs NP is solved?

<figure class="hv" data-hv="worlds">
<div class="hv-canvas"><p class="hv-fallback">Figure: three possible worlds, chosen with tabs. World 1, P ≠ NP (what about 88% of surveyed researchers expect): little changes in daily life; encryption keeps its foundation but still needs separate proofs; hard problems stay hard in the worst case; heuristics and SAT solvers keep working on real cases. World 2, P = NP with a fast algorithm: most cryptography (RSA, elliptic curves, AES key search, Bitcoin signatures) breaks; scheduling, routing and chip design become exactly solvable; computers can find mathematical proofs as easily as check them; finding the simplest model that fits data becomes easy. World 3, P = NP but the algorithm takes something like n^100 steps or nobody can write it down: a mathematical earthquake but little practical change, and encryption survives in practice.</p></div>
<figcaption><strong>The answer matters less than the algorithm that comes with it.</strong> A fast P = NP algorithm would change the world; a proof of P ≠ NP would mostly confirm what engineers already assume.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: if P = NP, if P ≠ NP, and if nobody can ever prove it</summary>

### If P = NP is proved, with a fast algorithm

This is the dramatic world, and the one most experts think we don't live in.

- **Most cryptography breaks.** Public-key encryption (RSA, elliptic curves), digital signatures, and even symmetric ciphers like AES rely on secrets that are easy to check once you have them. Finding them is an NP search problem. Formally, if P = NP then **one-way functions** cannot exist, and almost all of modern cryptography assumes they do.
- **Optimization becomes exact.** Airline crew scheduling, delivery routes, factory planning and chip layout contain NP-complete problems. Today we settle for good-enough answers; we could find the best ones.
- **Mathematics gets automated.** Checking a proof is easy, so with P = NP, *finding* a proof of reasonable length would be easy too. That was exactly Gödel's 1956 observation.
- **Learning gets easier.** Finding the smallest program or model that explains a set of data is an NP-style search, so with P = NP it would be efficient.

### If P = NP is proved, but the algorithm is useless

"Polynomial" includes $n^{100}$, which is hopeless even for $n = 10$. A proof might also show an algorithm exists without describing a practical one. Leonid Levin's *universal search* would in fact give an explicit algorithm that runs in polynomial time if P = NP, but with constants so large it could never be run. Donald Knuth has said he believes P = NP, but that the equality won't be helpful even if proved, because the proof will almost surely be nonconstructive: an algorithm would exist, but nobody would know it ([Twenty Questions for Donald Knuth, 2014](https://www.informit.com/articles/article.aspx?p=2213858&seqNum=17)). In this world mathematics changes overnight and daily life barely does.

### If P ≠ NP is proved

This is what 88% of respondents expected in William Gasarch's 2019 poll, and about 99% of those he judged to have thought hard about the problem ([poll results](https://www.cs.umd.edu/users/gasarch/papers/poll3.pdf), [summary](https://blog.computationalcomplexity.org/2019/03/third-poll-on-p-vs-np-and-related.html)).

- **Daily life doesn't change**, because engineers already assume NP-complete problems are hard.
- **Cryptography gets a foundation, not a guarantee.** P ≠ NP is necessary for secure cryptography but not enough: encryption needs problems that are hard *on average* for random keys, not just in the worst case.
- **Hard problems stay hard only in the worst case.** SAT solvers, approximation algorithms and heuristics keep working on real-world instances.
- **The proof itself would be the prize.** It would almost certainly need new mathematics powerful enough to get past the known barriers (see below).

Russell Impagliazzo's 1995 essay on "five worlds" (Algorithmica, Heuristica, Pessiland, Minicrypt and Cryptomania) shows how much depends on details beyond P vs NP itself, such as whether hard problems are hard on average and whether one-way functions exist ([Impagliazzo, 1995](https://doi.org/10.1109/SCT.1995.514853)).

### If it can never be proved

It is possible that P vs NP is independent of the standard axioms of mathematics (ZFC), as the continuum hypothesis is. There's no evidence for that, and most researchers expect a proof eventually; Scott Aaronson's survey covers what independence would and wouldn't mean ([Aaronson, 2003](https://www.scottaaronson.com/papers/pnp.pdf)).

</details>

## Is P vs NP solved? The latest news (November 2026)

<figure class="hv" data-hv="news">
<div class="hv-canvas"><p class="hv-fallback">Figure: status tiles and a timeline. Tiles: unsolved as of 24 November 2026; $1,000,000 Clay prize; 55 years since Cook's 1971 paper; 88% of researchers polled in 2019 expect P ≠ NP. Timeline: 1956, Gödel's letter to von Neumann. 1971, Cook proves SAT is NP-complete (Levin independently). 1972, Karp's 21 NP-complete problems. 1975, relativization barrier (Baker, Gill, Solovay). 1994, natural proofs barrier (Razborov, Rudich). 2000, Clay Millennium Prize. 2001, Exponential Time Hypothesis (Impagliazzo, Paturi). 2008, algebrization barrier (Aaronson, Wigderson). 2010, Deolalikar's claimed proof of P ≠ NP, found flawed within weeks. 2019, Gasarch poll: 88% expect P ≠ NP. 2025, Ryan Williams shows time t can be simulated in about √t space. October 2026, OpenAI and Anthropic post AI-written papers claiming 3-SAT in about 2^(n/√log n) time, refuting the Exponential Time Hypothesis if correct; not peer reviewed; P vs NP unaffected. November 2026, Anthropic posts a claimed AI-written proof that VP ≠ VNP, an algebraic analogue; no human has checked it; P vs NP unaffected.</p></div>
<figcaption><strong>Still unsolved, but 2026 shook the neighborhood.</strong> Tap an event for details. The 2026 entries are claims that had not passed peer review as of 24 November 2026.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: what happened in 2026, and what it does and doesn't mean</summary>

**Short answer: no.** As of 24 November 2026, P vs NP is unsolved, the Clay Mathematics Institute lists it as [unsolved](https://www.claymath.org/millennium/p-vs-np/), and no lab or researcher has claimed a proof. But autumn 2026 brought the biggest news near the question in decades, almost all of it from AI systems.

**The Exponential Time Hypothesis claims (October 2026).** The Exponential Time Hypothesis (ETH), proposed by Russell Impagliazzo and Ramamohan Paturi in 2001, says 3-SAT needs $2^{\Omega(n)}$ time: no algorithm can beat exponential time by more than a constant in the exponent. It is a *stronger* assumption than P ≠ NP, and many "this can't be done faster" results rest on it.

- OpenAI posted a paper titled [*The Exponential Time Hypothesis is False*](https://github.com/openai/math/blob/main/preprints/The-Exponential-Time-Hypothesis-is-False-October-25-2026/paper.pdf), dated 17 October 2026 and revised 25 October 2026, produced by an unnamed internal model. It describes a deterministic algorithm that counts the satisfying assignments of a k-CNF formula; for formulas with a linear number of clauses it runs in time $2^{O(n/\sqrt{\log n})}$, times a polynomial. OpenAI's [repository](https://github.com/openai/math) notes that not all its results have Lean formalizations and that some unformalized results could have issues.
- Anthropic posted [*A 2^{o(n)} Time Algorithm for 3-SAT*](https://github.com/anthropics/formal-math/tree/main/eth), credited to Claude, with a Lean 4 formalization written by AI models. Its README notes that Lean checks the proofs, but no machine checks that the formal statement says what the paper says, and that the result "says nothing about solving formulas in practice."
- Scott Aaronson reported the OpenAI result on 26 October 2026 as an algorithm for 3SAT running in time "roughly like exp(n/√log(n))" ([Shtetl-Optimized](https://scottaaronson.blog/?p=10239)). In the comments he wrote that "refuting the ETH is still a long way from P=NP, which would require finding exploitable structure not just in k-SAT but in _every_ NP-complete problem."

Why this doesn't settle P vs NP: $2^{n/\sqrt{\log n}}$ is slower than every polynomial, so 3-SAT would still not be in P. And a $2^{o(n)}$ bound for 3-SAT doesn't automatically carry over to all NP problems, because reductions can blow up the number of variables. If the claims hold up, they mean exponential-time lower bounds were weaker than assumed, which some researchers see as a small nudge toward P = NP, not a proof.

**The VP ≠ VNP claim (November 2026).** In 1979 Leslie Valiant defined VP and VNP, algebraic versions of P and NP about polynomials computed by arithmetic circuits. Around 23 November 2026, Anthropic posted a 70-page paper with a Lean formalization, both written by AI, claiming [VP ≠ VNP over every field](https://github.com/anthropics/formal-math/tree/main/vp-vnp). The README states that "no human mathematician has checked the proof" and that "This does not settle P vs NP."

**Real, peer-reviewed progress.** In 2025 Ryan Williams showed that any computation taking time $t$ can be simulated using only about $\sqrt{t \log t}$ memory, the first big improvement on a 50-year-old bound ([Williams, STOC 2025](https://arxiv.org/abs/2502.17779)). It is about time versus memory, not P vs NP, but it shows long-stuck questions in complexity do move.

**What experts think.** In William Gasarch's third poll (2019), 109 of 124 respondents (88%) believed P ≠ NP, up from 83% in 2012 and 61% in 2002; the other 12% said P = NP ([Gasarch, 2019](https://www.cs.umd.edu/users/gasarch/papers/poll3.pdf)).

**Claimed proofs.** People post claimed proofs of P = NP or P ≠ NP every year. The most famous recent one, by Vinay Deolalikar in August 2010, drew intense online review and was found to have serious gaps within weeks. A real proof would need to be published in a refereed journal and survive two years of scrutiny before Clay would consider it.

</details>

## Why is P vs NP so hard to prove?

<figure class="hv" data-hv="walls">
<div class="hv-canvas"><p class="hv-fallback">Figure: three walls that block whole families of proof techniques. Wall 1, relativization (Baker, Gill and Solovay, 1975): there are imaginary worlds with an "oracle" where P = NP and others where P ≠ NP, so any proof that works the same in all of them cannot settle the question. Wall 2, natural proofs (Razborov and Rudich, 1994): if strong pseudorandom functions exist, a large class of circuit lower-bound arguments cannot prove P ≠ NP. Wall 3, algebrization (Aaronson and Wigderson, 2008): techniques that combine oracles with algebra hit a similar wall. A proof must get past all three.</p></div>
<figcaption><strong>Three walls, each ruling out a whole kind of proof.</strong> Tap a wall to see what it blocks. A real proof has to get around all three.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: relativization, natural proofs and algebrization</summary>

Proving P ≠ NP means showing that **no** algorithm, among infinitely many possible ones, solves an NP-complete problem in polynomial time. Proving a negative about all algorithms is very hard, and researchers have proved that several natural strategies cannot work.

1. **Relativization (1975).** Theodore Baker, John Gill and Robert Solovay built two imaginary worlds where computers get a free "oracle" for some problem: in one, P = NP; in the other, P ≠ NP. Most classic techniques, such as the diagonalization used to prove the halting problem undecidable, work the same in every such world, so they can't settle P vs NP.
2. **Natural proofs (1994).** Alexander Razborov and Steven Rudich showed that if strong pseudorandom functions exist (which cryptographers believe), then a broad class of "natural" arguments for circuit lower bounds cannot prove P ≠ NP. Most circuit lower bounds known at the time were natural in their sense.
3. **Algebrization (2008).** Scott Aaronson and Avi Wigderson showed that techniques mixing oracles with algebra, which had gotten past relativization in other results, also can't settle P vs NP.

Any proof has to avoid all three. Programs such as Ketan Mulmuley's geometric complexity theory try, using algebraic geometry and representation theory, but none has produced a proof.

</details>

## Sources

- [Clay Mathematics Institute: P vs NP](https://www.claymath.org/millennium/p-vs-np/), problem statement and status (unsolved as of November 2026).
- Stephen Cook, [*The Complexity of Theorem-Proving Procedures*](https://doi.org/10.1145/800157.805047), STOC 1971.
- Richard Karp, [*Reducibility Among Combinatorial Problems*](https://doi.org/10.1007/978-1-4684-2001-2_9), 1972.
- Lance Fortnow, [*The Status of the P versus NP Problem*](https://lance.fortnow.com/papers/files/pnp-cacm.pdf), Communications of the ACM, 2009.
- William Gasarch, [*The Third P =? NP Poll*](https://www.cs.umd.edu/users/gasarch/papers/poll3.pdf), SIGACT News, 2019, and the [blog summary](https://blog.computationalcomplexity.org/2019/03/third-poll-on-p-vs-np-and-related.html).
- Timon Hertli, [*3-SAT Faster and Simpler: Unique-SAT Bounds for PPSZ Hold in General*](https://arxiv.org/abs/1103.2165), FOCS 2011.
- Ryan Williams, [*Simulating Time With Square-Root Space*](https://arxiv.org/abs/2502.17779), STOC 2025.
- OpenAI, [*The Exponential Time Hypothesis is False*](https://github.com/openai/math/blob/main/preprints/The-Exponential-Time-Hypothesis-is-False-October-25-2026/paper.pdf), October 2026 (not peer reviewed).
- Anthropic, [ETH](https://github.com/anthropics/formal-math/tree/main/eth) and [VP ≠ VNP](https://github.com/anthropics/formal-math/tree/main/vp-vnp) research artifacts, October and November 2026 (not human-verified).
- Scott Aaronson, [*Podcasts about the Topic: Part II*](https://scottaaronson.blog/?p=10239), Shtetl-Optimized, 26 October 2026, and [*Is P Versus NP Formally Independent?*](https://www.scottaaronson.com/papers/pnp.pdf), 2003.
- Russell Impagliazzo, [*A Personal View of Average-Case Complexity*](https://doi.org/10.1109/SCT.1995.514853), 1995 (the "five worlds").

<script defer src="/blog_posts/experiments/p-vs-np/pnp-post.js"></script>
