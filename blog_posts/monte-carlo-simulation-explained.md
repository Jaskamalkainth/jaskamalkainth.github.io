---
title: "Monte Carlo Simulation Explained Simply, With Python Examples"
description: "Monte Carlo simulation answers hard probability questions by running a random experiment thousands of times and counting the results. Simple guide, Python code."
date: 2026-10-25
last_modified_at: 2026-10-25
keywords: [Monte Carlo simulation, Monte Carlo method, estimate pi Monte Carlo, Monte Carlo simulation Python, random sampling, probability simulation, Monte Carlo error]
categories: math probability simulation
math: true
related: ["/blog_posts/bloom_filters.html", "/blog_posts/textgrain-watermark-explained.html"]
faq:
  - q: "Why is it called Monte Carlo simulation?"
    a: "Nicholas Metropolis suggested the name at Los Alamos around 1947, after the Monte Carlo casino in Monaco. In his 1987 account he says it was partly a joke about Stanislaw Ulam's uncle, who borrowed money from relatives because he \"just had to go to Monte Carlo\". The name fits: the method runs on chance, like a casino game."
  - q: "How many simulations are enough for a Monte Carlo estimate?"
    a: "It depends on the accuracy you need. The error shrinks with the square root of the number of runs, so 100 times more runs gives about 10 times more accuracy. For a probability, 10,000 runs typically gets within about one percentage point, and 1,000,000 runs within about 0.1 percentage points. Run it twice with different seeds: if the answers disagree, you need more runs."
  - q: "Is Monte Carlo simulation the same as machine learning?"
    a: "No. Monte Carlo simulation does not learn from data; it runs a model you wrote, with random inputs, many times, and summarises the outcomes. Machine learning fits a model to data. They do meet: some machine learning methods, such as Bayesian inference with Markov chain Monte Carlo (MCMC), use Monte Carlo sampling inside them."
  - q: "Can I do a Monte Carlo simulation in Excel?"
    a: "Yes. Put the random inputs in cells with RAND() or a formula built on it, compute the result in another cell, and copy that row down a few thousand times. Then use AVERAGE, COUNTIF or PERCENTILE on the result column. It works well for small models; for millions of runs, a few lines of Python are much faster."
  - q: "What are the limitations of Monte Carlo simulation?"
    a: "The answer is only as good as the model and its input ranges: wrong assumptions give a confident but wrong result. It is approximate, with an error that falls slowly as runs increase. Very rare events need huge numbers of runs to observe at all. And it does not explain why an outcome happens; it only tells you how often."
---

# Monte Carlo Simulation Explained Simply

> **In short:** Monte Carlo simulation answers a question about chance by playing it out many times with random numbers and counting what happens. If 79,600 of 100,000 simulated projects finish on time, the chance is about 80%. It replaces hard maths with repetition; 100 times more runs makes the answer about 10 times more precise.

<link rel="stylesheet" href="/blog_posts/experiments/monte-carlo/mc.css">

This post is mostly simulations you can run yourself: press the buttons, change the numbers, and watch the answers appear. Each one also has the short Python version, which I ran; the outputs shown are real. All four are also on one page in the [Monte Carlo simulation playground](/blog_posts/experiments/monte-carlo/).

## What is Monte Carlo simulation?

Monte Carlo simulation estimates an answer by **repeating a random experiment many times** and counting the results. Every run follows the same recipe:

1. **Describe what's uncertain** with a range ("this task takes 5 to 10 days").
2. **Pick random values** for those inputs and compute one outcome.
3. **Repeat** thousands of times.
4. **Count**: the share of runs where something happened is its probability.

## How do you estimate π with random darts?

A quarter circle covers π/4 (about 78.5%) of its square, so about 78.5% of random darts land inside it. Count the darts inside, divide by all darts, multiply by 4, and you have π. Throw a few, then let it run to a million.

<div class="mc" data-mc="pi"><p>This interactive simulation needs JavaScript.</p></div>

<details markdown="1">
<summary>Python code for the dart simulation</summary>

```python
import random

def estimate_pi(n):
    inside = 0
    for _ in range(n):
        x, y = random.random(), random.random()
        if x * x + y * y <= 1:
            inside += 1
    return 4 * inside / n

random.seed(42)
for n in [100, 10_000, 1_000_000]:
    print(f"{n:>9,} darts -> pi ~ {estimate_pi(n):.4f}")
```

Output (Python 3.13, seed 42):

```text
      100 darts -> pi ~ 3.1200
   10,000 darts -> pi ~ 3.1252
1,000,000 darts -> pi ~ 3.1408
```

</details>

## How many runs does a Monte Carlo simulation need?

More runs help, but slowly: the typical error shrinks like **1/√N**, so **100 times more runs buys about 10 times more accuracy**. Run the whole dart experiment 500 times at each size and watch the estimates squeeze towards π.

<div class="mc" data-mc="spread"><p>This interactive simulation needs JavaScript.</p></div>

For a probability p estimated from N runs, the typical error (standard error) is:

$$
\text{standard error} = \sqrt{\frac{p\,(1-p)}{N}}
$$

For π (p = π/4, times 4) that's about 1.64/√N: 0.16 at 100 darts, 0.016 at 10,000 and 0.0016 at a million. The rule doesn't care how complicated the model is, which is why Monte Carlo is the go-to tool when formulas get out of hand.

## What is the birthday problem?

In a room of 23 people, what's the chance that two share a birthday? Most people guess low. Fill some rooms and see (365 equally likely days, no leap years).

<div class="mc" data-mc="birthday"><p>This interactive simulation needs JavaScript.</p></div>

The exact answer for 23 people is 50.7%. When an exact formula exists, use it to check your simulation, as the curve above does; when it doesn't, the simulation is your answer.

<details markdown="1">
<summary>Python code for the birthday simulation</summary>

```python
import random

def shared_birthday(people):
    days = [random.randint(1, 365) for _ in range(people)]
    return len(set(days)) < people

random.seed(7)
trials = 100_000
hits = sum(shared_birthday(23) for _ in range(trials))
print(f"Simulated: {hits / trials:.4f}")

exact = 1.0
for i in range(23):
    exact *= (365 - i) / 365
print(f"Exact:     {1 - exact:.4f}")
```

Output:

```text
Simulated: 0.5091
Exact:     0.5073
```

</details>

## How do you use Monte Carlo for a project deadline?

This is the kind of question Monte Carlo answers at work. Adding the average task lengths (7.5 + 11.5 + 6.5) gives 25.5 days, so a 28-day deadline looks safe. The simulation shows what the average hides: **about one project in five is late**. Move the deadline, or widen a task's range, and watch the odds change.

<div class="mc" data-mc="project"><p>This interactive simulation needs JavaScript.</p></div>

<details markdown="1">
<summary>Python code for the project simulation</summary>

```python
import random

random.seed(1)
trials = 100_000
on_time = 0
totals = []
for _ in range(trials):
    design = random.uniform(5, 10)   # days
    build = random.uniform(8, 15)
    test = random.uniform(4, 9)
    total = design + build + test
    totals.append(total)
    if total <= 28:
        on_time += 1

totals.sort()
print(f"Chance of finishing in 28 days: {on_time / trials:.1%}")
print(f"Average: {sum(totals) / trials:.1f} days")
print(f"90% of runs finish within: {totals[int(0.9 * trials)]:.1f} days")
```

Output:

```text
Chance of finishing in 28 days: 79.6%
Average: 25.5 days
90% of runs finish within: 29.3 days
```

</details>

## Where is Monte Carlo simulation used?

| Field | What gets simulated |
|---|---|
| Finance | Portfolio returns and retirement plans over thousands of possible markets |
| Project management | Schedules and budgets with uncertain task estimates |
| Physics and engineering | Particle transport (neutrons, light), reliability of systems with many parts |
| Computer graphics | Path tracing: averaging random light paths to render realistic images |
| Statistics and machine learning | Markov chain Monte Carlo (MCMC) for Bayesian inference; bootstrapping |
| Games and AI | Monte Carlo tree search, which plays random games to pick good moves |

Randomness as an engineering tool shows up elsewhere on this site too: a [Bloom filter](/blog_posts/bloom_filters.html) trades a small, known chance of error for big memory savings, and the [textGrain text watermark](/blog_posts/textgrain-watermark-explained.html) is detected with a statistical test.

## When should you not use Monte Carlo simulation?

- **An exact formula is easy.** Use it, and keep simulation for checking.
- **The inputs are guesses.** A precise-looking "79.6%" inherits every error in the ranges you typed in.
- **The event is very rare.** Seeing a 1-in-a-million event needs many millions of runs, or tricks like importance sampling.
- **You need to know why.** Simulation says how often, not the cause.

## Where does the name "Monte Carlo" come from?

In 1946, recovering from an illness, Stanislaw Ulam wondered how often a game of Canfield solitaire comes out. The combinatorics were hopeless, so he thought of simply dealing it a hundred times and counting the wins. John von Neumann turned the idea into a plan to simulate neutrons on the ENIAC computer in a letter of 11 March 1947. Nicholas Metropolis suggested the name, after Ulam's uncle who "just had to go to Monte Carlo", and he and Ulam published *The Monte Carlo Method* in 1949.

## Sources

- N. Metropolis, [The Beginning of the Monte Carlo Method](https://mcnpx.lanl.gov/pdf_files/Article_1987_LAS_Metropolis_125--130.pdf), *Los Alamos Science*, Special Issue 1987: the naming story and von Neumann's 1947 letter.
- R. Eckhardt, [Stan Ulam, John von Neumann, and the Monte Carlo Method](https://mcnp-green.lanl.gov/pdf_files/Article_1987_LAS_Eckhardt_131--141.pdf), *Los Alamos Science* 15, 1987: Ulam's solitaire recollection.
- N. Metropolis and S. Ulam, [The Monte Carlo Method](https://doi.org/10.1080/01621459.1949.10483310), *Journal of the American Statistical Association* 44 (247), 335-341, 1949.
- Python documentation, [random: generate pseudo-random numbers](https://docs.python.org/3/library/random.html).

<script defer src="/blog_posts/experiments/monte-carlo/mc.js"></script>
