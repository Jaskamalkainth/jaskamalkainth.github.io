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

Some questions are easy to ask and painful to calculate. What's the chance that two people in a room of 23 share a birthday? How likely is a project to finish by its deadline when every task might take longer than planned? You can attack these with formulas, or you can do what a curious child would do: try it many times and count.

That second approach is Monte Carlo simulation. This post explains the idea with no prerequisites, then walks through three small Python programs. I ran every one of them, and the outputs shown are the real ones.

## What is Monte Carlo simulation?

Monte Carlo simulation is a way to estimate an answer by **repeating a random experiment many times** and looking at the results. Each repetition (a "run" or "trial") picks random values for the uncertain parts of a problem and computes the outcome. After thousands of runs, the share of runs where something happened is your estimate of its probability.

Think of a coin you suspect is unfair. You could study its weight and shape, or you could flip it 1,000 times. If it lands heads 620 times, your best estimate of the chance of heads is about 62%. Monte Carlo simulation is that coin-flipping, done by a computer, for problems where flipping a real coin isn't possible.

## How does a Monte Carlo simulation work?

Every Monte Carlo simulation follows the same four steps:

1. **Describe the uncertain inputs.** For each thing you don't know exactly, give a range or distribution ("this task takes 5 to 10 days").
2. **Run one random scenario.** Pick a random value for each input and compute the outcome ("this time the project took 26.3 days").
3. **Repeat it thousands of times.** Store each outcome.
4. **Summarise the outcomes.** Count, average, or sort them: "79.6% of runs finished on time", "90% finished within 29.3 days".

The computer does the boring part, step 3. Your job is step 1, which is where the real thinking (and the real risk of mistakes) is.

## Example 1: estimating π by throwing random darts

The classic first example estimates π without any geometry beyond the area of a circle. Picture a square board, 1 unit on each side, with a quarter circle of radius 1 drawn from one corner. Throw darts that land at random points on the board.

The quarter circle covers π/4 of the square (about 78.5%), so about 78.5% of random darts land inside it. Count the darts inside, divide by the total, and multiply by 4: that's an estimate of π. A dart at point (x, y) is inside when x² + y² ≤ 1.

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

The true value is 3.14159... With a million darts the estimate is off by less than 0.001. Notice that more darts doesn't guarantee a better answer every single time (10,000 darts happened to be only slightly better than 100 here), but on average the error keeps shrinking, as the next section shows.

## How accurate is a Monte Carlo simulation?

The error of a Monte Carlo estimate shrinks in proportion to **1 / √N**, where N is the number of runs. For a probability p estimated from N runs, the typical error (the standard error) is:

$$
\text{standard error} = \sqrt{\frac{p\,(1-p)}{N}}
$$

For the π example, p = π/4 and the estimate is multiplied by 4, so the typical error is 4·√(p(1−p)/N) ≈ 1.64/√N:

| Darts (N) | Typical error in π | Actual error in my run |
|---:|---:|---:|
| 100 | 0.164 | 0.022 |
| 10,000 | 0.016 | 0.016 |
| 1,000,000 | 0.0016 | 0.0008 |

This is the one rule worth memorising: **100 times more runs buys about 10 times more accuracy.** That slow improvement is Monte Carlo's main weakness. Its strength is that the rule doesn't depend on how complicated the problem is: a model with 50 uncertain inputs converges at the same 1/√N rate as one with two, which is why it's the go-to tool when formulas get out of hand.

## Example 2: the birthday problem

In a room of 23 people, what's the chance that at least two share a birthday? Most people guess something small. Let the computer try it 100,000 times (ignoring leap years and assuming every day is equally likely):

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

Both say just over 50%. The simulation took four lines of logic and needed no insight; the exact formula needs you to see that it's easier to compute the chance that *nobody* shares a birthday and subtract it from 1. The gap of 0.0018 is within the expected error: √(0.5 × 0.5 / 100,000) ≈ 0.0016.

This is the pattern for using Monte Carlo well: when an exact answer exists, use it to check your simulation; when it doesn't, the simulation is your answer.

## Example 3: will my project finish on time?

Here's the kind of question Monte Carlo is actually used for at work. A project has three tasks done one after another, and each has an uncertain duration:

| Task | Shortest | Longest |
|---|---:|---:|
| Design | 5 days | 10 days |
| Build | 8 days | 15 days |
| Test | 4 days | 9 days |

Adding the averages gives 7.5 + 11.5 + 6.5 = 25.5 days, so a 28-day deadline looks safe. But how safe? Assume each duration is equally likely anywhere in its range, and simulate:

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

The average confirms the 25.5-day plan, but the simulation adds what the average hides: **about one project in five misses the deadline**, and to be 90% sure you need about 29.3 days. That's the real value of Monte Carlo: it turns "we expect 25.5 days" into a range with probabilities you can make decisions with.

## Where is Monte Carlo simulation used?

| Field | What gets simulated |
|---|---|
| Finance | Portfolio returns and retirement plans over thousands of possible markets |
| Project management | Schedules and budgets with uncertain task estimates |
| Physics and engineering | Particle transport (neutrons, light), reliability of systems with many parts |
| Computer graphics | Path tracing: averaging random light paths to render realistic images |
| Statistics and machine learning | Markov chain Monte Carlo (MCMC) for Bayesian inference; bootstrapping |
| Games and AI | Monte Carlo tree search, which plays random games to pick good moves |

The common thread: many uncertain inputs, a model that's easy to run once, and a question about the whole range of outcomes. Randomness as an engineering tool shows up elsewhere too: a [Bloom filter](/blog_posts/bloom_filters.html) accepts a small, known chance of error in exchange for huge memory savings, and OpenAI's [textGrain text watermark](/blog_posts/textgrain-watermark-explained.html) is detected with a statistical test over random-looking scores.

## Where does the name "Monte Carlo" come from?

The method was developed at Los Alamos in the 1940s. According to Roger Eckhardt's account, built on Stanislaw Ulam's own recollections, the idea came to Ulam in 1946 while he was recovering from an illness and playing Canfield solitaire. He wondered what fraction of games could be won, found the combinatorics hopeless, and realised it would be easier to deal out a hundred games and count the wins. He took the idea to John von Neumann, and on 11 March 1947 von Neumann sent a letter outlining a statistical way to simulate neutrons in fissionable material, to be run on the new ENIAC computer.

Nicholas Metropolis suggested the name. In his 1987 article he wrote that it was "not unrelated to the fact that Stan had an uncle who would borrow money from relatives because he 'just had to go to Monte Carlo.'" Metropolis and Ulam published the first paper on the method, *The Monte Carlo Method*, in the Journal of the American Statistical Association in 1949.

## When should you not use Monte Carlo simulation?

- **When an exact formula is easy.** If you can compute the answer directly, do; use simulation only to check it.
- **When your inputs are guesses you can't defend.** The output inherits every error in the input ranges, and a precise-looking "79.6%" can hide a wild guess. Test how much the answer changes when you widen the ranges.
- **When you care about very rare events.** To see a 1-in-a-million event even a few times, you need many millions of runs, unless you use special techniques such as importance sampling.
- **When you need to explain *why*.** Simulation tells you how often something happens, not the cause. Pair it with sensitivity analysis to see which input matters most.

## Sources

- N. Metropolis, [The Beginning of the Monte Carlo Method](https://mcnpx.lanl.gov/pdf_files/Article_1987_LAS_Metropolis_125--130.pdf), *Los Alamos Science*, Special Issue 1987: the naming story and von Neumann's 1947 letter.
- R. Eckhardt, [Stan Ulam, John von Neumann, and the Monte Carlo Method](https://mcnp-green.lanl.gov/pdf_files/Article_1987_LAS_Eckhardt_131--141.pdf), *Los Alamos Science* 15, 1987: Ulam's solitaire recollection.
- N. Metropolis and S. Ulam, [The Monte Carlo Method](https://doi.org/10.1080/01621459.1949.10483310), *Journal of the American Statistical Association* 44 (247), 335-341, 1949.
- Python documentation, [random: generate pseudo-random numbers](https://docs.python.org/3/library/random.html).
