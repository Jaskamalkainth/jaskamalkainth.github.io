---
title: "Weight-Space Programming Explained With One Simple Example"
description: "Weight-space programming: an LLM reads a network's weights and fixes it by editing them, not training. One simple example, then the Qwen3.5-0.8B fix."
date: 2026-11-04
last_modified_at: 2026-11-05
keywords: [weight-space programming, weight-space programming explained, Sparks of Weight-Space Programming, LLM editing neural network weights, editing weights by hand, Qwen3.5-0.8B thinking loop fix, weight editing vs fine-tuning]
categories: llm machine-learning interpretability
related: ["/blog_posts/taalas-hc1-chatjimmy-explained.html", "/blog_posts/monte-carlo-simulation-explained.html", "/blog_posts/textgrain-watermark-explained.html"]
faq:
  - q: "What is weight-space programming in simple terms?"
    a: "It is fixing or building a neural network by editing its numbers directly, the way a programmer edits code, instead of training it. A strong LLM looks at the weights, works out what each part does, finds the part causing a problem, and writes a small, explained change. The term comes from MIT CSAIL's November 2026 post Sparks of Weight-Space Programming."
  - q: "Is weight-space programming the same as fine-tuning?"
    a: "No. Fine-tuning changes weights with gradient descent on labeled examples, many small nudges to every weight that nobody designs by hand. In weight-space programming, an LLM decides which weights to change and why, then writes the change directly. In the Qwen3.5-0.8B experiment it changed 131,072 weights in two layers, about 0.016% of the model, with no gradients."
  - q: "Can an LLM really read the billions of weights in a model?"
    a: "Not by reading every number like text. In the Qwen3.5-0.8B experiment the LLM worked in a Python session with the weights loaded, so it could compute on them, and it could run the model on up to 50 batches of practice problems. In some other experiments, small networks of about 17,000 to 24,000 weights were given to it as plain numbers."
  - q: "Can weight-space programming teach a model new skills?"
    a: "Not in the reported results. The edits worked by removing an obstacle that hid an ability the model already had, such as Qwen3.5-0.8B's thinking loops. On Gemma 3 270M, whose mistakes were ordinary reasoning errors with no single faulty part, the LLM could not meaningfully improve it: MATH-500 moved from 6.8% to between 7.0% and 7.7%, which the authors did not treat as a real gain."
  - q: "Can I download the Qwen3.5-0.8B model edited by weight-space programming?"
    a: "Yes. The authors published it on Hugging Face as RikiyaT/Qwen3.5-0.8B-weight-space-programming, along with the full logs on GitHub. Only the down_proj matrices of layers 15 and 19 differ from the base model. An independent re-run listed on the model card scored 51.0% on MATH-500, close to the 48.1% the authors report."
---

# Weight-Space Programming Explained With One Simple Example

> **In short:** Weight-space programming means an LLM reads a neural network's raw weights and fixes it by editing them directly, with no training. In MIT CSAIL's November 2026 "Sparks" post, an LLM stopped Qwen3.5-0.8B's thinking loops by changing 131,072 weights (0.016%), lifting MATH-500 from 7.9% to 48.1%. Below, one 10-weight example shows how.

<link rel="stylesheet" href="/blog_posts/experiments/weight-space/ws-post.css">
<link rel="stylesheet" href="/blog_posts/experiments/weight-space/ws-simple.css">

The idea and the term come from [*Sparks of Weight-Space Programming*](https://rikiyat.github.io/blog/weight-space-programming/) by Rikiya Takehi, Jayden Teoh, Alex Zhang and Omar Khattab (MIT CSAIL, 2 November 2026). This post explains it with **one simple example**: a tiny model I built for this page, which every figure runs live. Then it maps each step onto the real Qwen3.5-0.8B fix from the paper.

## Executive summary: weight-space programming in five points

<figure class="hv" data-hv="summary">
<div class="hv-canvas"><p class="hv-fallback">Figure, four tiles. In this post's toy example, 1 of 10 weights is changed to fix a loop. In the real experiment, an LLM changed 131,072 weights in Qwen3.5-0.8B, 0.016% of the model. Qwen's MATH-500 score went from 7.9% to 48.1% after that edit. Both fixes used 0 gradient steps.</p></div>
<figcaption><strong>Small, reasoned edits; large effects.</strong> Toy computed live; Qwen numbers reported by Takehi et al. (2026), with the 131,072 count checked against Qwen3.5-0.8B's config.</figcaption>
</figure>

1. **What it is.** An LLM reads a neural network's weights, works out what each part does, and edits the numbers directly, like a programmer editing code. No gradient descent, no training run.
2. **How it works.** Four steps: **read** what each part computes, **find** the part that causes the problem, **edit** the fewest numbers that remove it, and **test** that nothing else broke.
3. **The simple example.** A 10-weight "tiny thinker" re-checks its answer forever. Reading its weights shows one neuron whose urge to check grows with every check; changing one number from 1 to 0 fixes it.
4. **The real result.** The same steps fixed Qwen3.5-0.8B's thinking loops: answers running to the token limit fell from 93.0% to 33.1%, and MATH-500 rose from 7.9% to 48.1%.
5. **The catch.** It removes obstacles; it doesn't add missing skills. It's early work from one group, in a blog post rather than a peer-reviewed paper, using an LLM that isn't public.

## What is weight-space programming?

<figure class="hv" data-hv="loop">
<div class="hv-canvas"><p class="hv-fallback">Figure: the weight-space programming loop. Given the weights and a goal in plain English, the LLM repeats four steps: 1. Read: work out what each part of the network computes. 2. Find: locate the part that causes the problem. 3. Edit: change the fewest numbers that remove it. 4. Test: run the network on a few inputs and check that nothing else broke. No gradients are computed at any step. Training, by contrast, needs labeled examples and nudges every weight a little.</p></div>
<figcaption><strong>Read, find, edit, test: the way a programmer fixes a bug.</strong> Illustrative diagram of the framing in Takehi et al. (2026).</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: weights, training, and a third way to write them</summary>

A neural network's behavior lives in its **weights**, the numbers it multiplies its inputs by. Change the numbers and you change what the network does. They are so central that the [Taalas HC1 chip](/blog_posts/taalas-hc1-chatjimmy-explained.html) builds one model's weights directly into silicon.

Until now, weights have been written in two main ways. **Training** (gradient descent with optimizers such as SGD or Adam) fits them to labeled examples through many small nudges to every weight; the result works, but nobody designed it, and understanding it afterwards is the whole field of interpretability. **Compilers** such as Tracr translate a formal program into weights, which only works for programs someone has already written precisely.

**Weight-space programming** is a third way. The authors define it as a general-purpose LLM reading and writing a network's weights directly, not through an optimizer and in particular not with gradient descent, guided by a goal written in natural language. The LLM reasons about what each part of the network computes, or should compute, and changes the weights to match. Depending on the experiment it got the weights as text, a Python session with the weights loaded, or a small budget of **forward passes** (running the network on inputs and seeing the outputs). It never ran a training loop.

The authors link this to Andrej Karpathy's "Software 2.0" essay, which described neural network weights as code written by optimization rather than by people. Their claim is that weights can now also be read and written by reasoning. The rest of this post shows what that means with one example small enough to follow by hand.

</details>

## The example: a tiny model that never stops checking its answer

<figure class="hv" data-hv="model">
<div class="hv-canvas"><p class="hv-fallback">Figure: the tiny thinker, a network with 2 inputs, 3 neurons and 1 output, 10 numbers in all. Inputs: "how sure am I" (0 to 1) and "checks so far" (0, 1, 2 and so on). Neuron A = ReLU(4 × sure − 2), sends +1.5 to the output. Neuron B = ReLU(1 × checks − 1), sends +1. Neuron C = ReLU(1 × checks + 1), sends −2. Output score = 1.5·A + 1·B − 2·C − 1.5; if the score is above 0 it answers, otherwise it checks again. Run on a problem it is 90% sure about, it checks 10 times and hits the 10-check limit without ever answering.</p></div>
<figcaption><strong>Ten numbers, and it still gets stuck.</strong> Even at 90% sure it re-checks until the limit. A toy built for this post, computed live.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: what the tiny thinker does</summary>

The tiny thinker is a made-up model with one job. After it has worked out an answer, it decides, again and again, whether to **answer now** or **check its work one more time**. It looks at two inputs: how sure it is of its answer (a number from 0 to 1) and how many times it has already checked (0, 1, 2 and so on).

Inside are three **neurons**. Each one multiplies an input by a weight, adds a bias, and passes the result through ReLU, which turns negative values into 0, so a neuron is either silent or active. The output adds up the three neurons, each multiplied by its own weight, plus one more bias. If that score is above 0, the model answers; otherwise it checks again. That is the whole model: 6 numbers inside the neurons and 4 at the output, 10 in all.

The bug: whatever the problem, the score never rises above 0, so the model keeps checking until it hits a limit of 10 checks and gives no answer. This is a small copy of a real failure. Reasoning models like Qwen3.5-0.8B sometimes "think in circles", repeating themselves until they run out of tokens.

</details>

## Step 1: How do you read a network's weights?

<figure class="hv" data-hv="read">
<div class="hv-canvas"><p class="hv-fallback">Figure, three cards, one per neuron, each with its numbers, a small plot of when it fires, and what it means. Neuron A: 4 × sure − 2, output +1.5. Silent until "sure" passes 0.5, then grows; it pushes toward answering. Reading: "I'm confident." Neuron B: 1 × checks − 1, output +1. Silent for the first check, then +1 per check; it pushes toward answering. Reading: "I've checked enough." Neuron C: 1 × checks + 1, output −2. Always on, and +1 per check; it pushes toward checking again, 2 points per unit. Reading: "Wait, let me check again."</p></div>
<figcaption><strong>Each neuron has a job you can name.</strong> Two neurons push toward answering, one pushes toward checking again. Plots computed from the 10 weights.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: reading each neuron in plain words</summary>

Reading weights means asking, for each part of the network, *when does it fire, and what does it push the output toward?* With 10 numbers you can answer that by eye:

| Neuron | Its numbers | When it fires | Output weight | What it means |
|---|---|---|---:|---|
| A | 4 × sure − 2 | only when sure is above 0.5 | +1.5 | "I'm confident": pushes toward answering |
| B | 1 × checks − 1 | from the 2nd check on, growing by 1 each check | +1 | "I've checked enough": pushes toward answering |
| C | 1 × checks + 1 | always, growing by 1 each check | −2 | "Wait, let me check again": pushes toward checking |

The output bias, −1.5, means the model leans toward checking unless something pushes it to answer. None of the neuron names are stored in the model; they are explanations a reader writes after looking at the numbers. Writing those explanations is the "reading" half of weight-space programming.

</details>

## Step 2: Which weight causes the loop?

<figure class="hv" data-hv="bug">
<div class="hv-canvas"><p class="hv-fallback">Chart: what each neuron adds to the score after 0 to 9 checks, for a problem the model is 90% sure about. A adds a steady +2.4. B adds 0, 0, then +1 more each check, up to +8 after 9 checks. C adds −2, −4, −6 and so on, 2 more each check, down to −20 after 9 checks. With the −1.5 bias the total score is −1.1, −3.1, −4.1, −5.1 and so on down to −11.1. It falls by 1 with every check and never crosses 0, so the model never answers.</p></div>
<figcaption><strong>Every check makes the next check more likely.</strong> B adds +1 per check but C subtracts 2, so the score sinks by 1 each time. Computed from the 10 weights at 90% sure.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: why the score can never climb back</summary>

The chart follows the score as the checks pile up. Neuron A gives a fixed boost, because how sure the model is doesn't change while it re-checks. Neuron B is a built-in budget: after the first check it adds 1 per check, which should eventually make the model answer. Neuron C works against it, and its weight on "checks so far" is the problem. That 1 makes C grow with every check, and C's output weight of −2 turns each step of growth into −2 on the score.

So each check adds +1 through B and −2 through C: a net −1. The score can only sink, and the model loops. Neuron C itself isn't the bug. A model that checks its answer once or twice is a good thing. The bug is one number, **C's input weight of 1**, which makes the urge to check *grow* with each check.

</details>

## Step 3: Edit one number, then test it

<figure class="hv" data-hv="edit">
<div class="hv-canvas"><p class="hv-fallback">Figure: try three versions of the model and a "how sure" slider. Checks made before answering, for problems the model is 90% sure about and 50% sure about. Original model: hits the 10-check limit both times. Delete neuron C (set its output weight −2 to 0): answers after 0 checks at 90% sure, so it no longer double-checks, and after 3 checks at 50%. Edit one number (set C's input weight from 1 to 0): answers after 3 checks at 90% sure and after 5 checks at 50%, so it still checks, and checks longer when unsure.</p></div>
<figcaption><strong>Change one number and the loop is gone, but the good habit stays.</strong> Try each version. Computed live from the 10 weights; the limit is 10 checks.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: the edit, the test, and the code</summary>

Once you know what each part does, the fix is a small, deliberate change. Setting C's input weight from 1 to 0 makes C a steady "check a couple of times" push of −2 instead of one that grows. Now B's budget wins: the score rises by 1 per check from the 2nd check on, and the model answers.

Then you test, because an edit can break other things. The cruder fix, deleting neuron C (setting its output weight to 0), also stops the loop, but it removes the good habit too: at 80% sure or more, the model now answers with no check at all. The one-number edit keeps everything else:

| How sure | Original | Delete neuron C | Edit one number (C's input 1 → 0) |
|---:|---|---:|---:|
| 100% | hits the limit | 0 checks | 2 checks |
| 90% | hits the limit | 0 checks | 3 checks |
| 70% | hits the limit | 2 checks | 4 checks |
| 50% | hits the limit | 3 checks | 5 checks |

This is the core of weight-space programming: **read** what the parts do, **find** the part that causes the problem, **edit** the fewest numbers that remove it, and **test** that nothing else broke. The whole example in Python:

```python
relu = lambda x: max(0.0, x)

# The whole "model": 10 numbers.
w = {"sure_in": 4, "sure_bias": -2,      # neuron A
     "enough_in": 1, "enough_bias": -1,  # neuron B
     "wait_in": 1, "wait_bias": 1,       # neuron C
     "out_A": 1.5, "out_B": 1, "out_C": -2, "out_bias": -1.5}

def checks_before_answering(w, sure, limit=10):
    for checks in range(limit):
        A = relu(w["sure_in"] * sure + w["sure_bias"])
        B = relu(w["enough_in"] * checks + w["enough_bias"])
        C = relu(w["wait_in"] * checks + w["wait_bias"])
        score = w["out_A"] * A + w["out_B"] * B + w["out_C"] * C + w["out_bias"]
        if score > 0:
            return checks          # answers now
    return "hit the limit"         # never answered

print("before:", checks_before_answering(w, 0.9), "|", checks_before_answering(w, 0.5))
w["wait_in"] = 0                   # the edit: one number, 1 -> 0
print("after: ", checks_before_answering(w, 0.9), "|", checks_before_answering(w, 0.5))
```

Output (Python 3):

```text
before: hit the limit | hit the limit
after:  3 | 5
```

</details>

## How did the same four steps fix Qwen3.5-0.8B?

<figure class="hv" data-hv="qwen">
<div class="hv-canvas"><p class="hv-fallback">Figure: the tiny thinker next to the real experiment. The model: 10 numbers versus Qwen3.5-0.8B's 0.8 billion. The bug: re-checks until the 10-check limit, versus thinking in circles, where 85 of its first 96 practice answers ran to the 32,768-token limit. Read: we read 10 numbers by eye, versus an LLM working in a Python session with the weights loaded, no GPU and no gradients. Find: neuron C's input weight, versus one "loop direction" written by the MLPs of layers 15 and 19. Edit: 1 number, versus that direction removed from 64 output columns in each of the two layers, 131,072 numbers or 0.016% of the model. Test: two problems, versus up to 50 forward passes on practice problems. Result: answers after 3 or 5 checks, versus answers hitting the limit falling from 93.0% to 33.1% and MATH-500 rising from 7.9% to 48.1%.</p></div>
<figcaption><strong>Same steps, bigger model.</strong> Qwen numbers reported by Takehi et al. (MIT CSAIL, November 2026); the 131,072 count matches Qwen3.5-0.8B's config.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: what the LLM actually did to Qwen3.5-0.8B</summary>

**Qwen3.5-0.8B** is a small reasoning model with 0.8 billion weights. With thinking on, it often loops: on 85 of its first 96 practice problems it ran to the 32,768-token limit without answering. In *Sparks of Weight-Space Programming* (Takehi, Teoh, Zhang and Khattab, MIT CSAIL, 2 November 2026), a frontier LLM the authors call "GPT-6 Astra" was asked to fix this with no training and no gradients. It worked in a Python session with the model's weights loaded, and it could run the model on practice problems from the GSM8K and MATH training sets a limited number of times (10, 25 or 50 forward passes).

The LLM traced the looping to one **direction** in the model's internal state, a pattern across its 1,024 hidden numbers rather than a single neuron, written by the MLPs of layers 15 and 19. Each MLP neuron writes a column of 1,024 numbers into that state. The LLM subtracted the loop direction from 64 of those columns in each of the two layers: 64 × 1,024 × 2 = **131,072 weights**, about 0.016% of the model. It is the same idea as the toy's edit: remove the part that feeds the loop and leave everything else those neurons do.

| Qwen3.5-0.8B (thinking on) | Base | Edited, 50 forward passes |
|---|---:|---:|
| Answers hitting the 32,768-token limit | 93.0% | 33.1% |
| MATH-500 | 7.9% | 48.1% |
| GSM8K | 13.8% | 67.1% |
| IFEval (following instructions) | 21.0% | 62.3% |

The post doesn't describe how the LLM found the direction step by step, so I won't guess. Two caveats: with only 10 or 25 forward passes the loops barely went away, and much of the gain comes from the model finishing answers it used to abandon, not from it becoming smarter. The edited model is public on Hugging Face, and an independent re-run listed on its model card scored 51.0% on MATH-500. The source post reports other experiments too, such as naming which game a network was trained to play from its weights alone and writing game-playing networks from scratch. This post sticks to the one example; the [original post](https://rikiyat.github.io/blog/weight-space-programming/) has the rest.

</details>

## How is this different from training the model?

<figure class="hv" data-hv="train">
<div class="hv-canvas"><p class="hv-fallback">Figure: the tiny thinker's 10 numbers after two kinds of fix. Edited by reasoning: 1 of 10 numbers changed (C's input weight, 1 to 0). Trained with gradient descent from the same start, on 110 examples labeled with the behavior we want, for 100 steps: all 10 numbers changed. C's input weight moved the most, from 1 to 0.35; the others moved by 0.03 to 0.44. Both versions answer after the same number of checks at every level of sureness.</p></div>
<figcaption><strong>Training finds the same culprit but changes everything, and can't tell you why.</strong> Both are computed live: the edit from Step 3, and plain gradient descent on the same model.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: why a reasoned edit beats a smeared one here, and when it doesn't</summary>

The usual way to fix a model is **training** (fine-tuning): show it examples of the right behavior and let gradient descent nudge every weight a little, over and over. For the comparison I trained the tiny thinker from its broken starting point on 110 examples (11 levels of sureness × 10 check counts), each labeled "answer" or "check again" using the behavior we want, with learning rate 0.05 for 100 steps. It ends up matching all 110 labels.

Training also found the culprit: C's input weight moved the most, from 1 to about 0.35. But it moved all 10 numbers, it needed the labeled examples, and it can't tell you that a growing "check again" neuron was the problem. The reasoned edit changed one number and comes with its own explanation.

In a real model the difference is larger. Fine-tuning Qwen3.5-0.8B would adjust its 0.8 billion weights by small amounts, while the reasoned edit changed 0.016% of them and could explain why. The limit cuts the other way, though: editing works when one part is *broken*. When a model simply lacks a skill, there is no single number to fix. On Gemma 3 270M, whose math mistakes had no single cause, the same LLM couldn't meaningfully improve it, and training remains the tool for teaching new skills.

</details>

## What are the limits of weight-space programming?

<figure class="hv" data-hv="limits">
<div class="hv-canvas"><p class="hv-fallback">Figure, four cards. Can't add what isn't there: on Gemma 3 270M, MATH-500 moved only from 6.8% to 7.0-7.7%. Some feedback helps: Qwen's loops barely went away with 10 or 25 forward passes; the big gain came with 50. Real models are big: the toy fits on a screen, but Qwen's 0.8 billion weights needed a Python session and test runs. Early and unreviewed: a blog post, an unreleased "GPT-6 Astra" model; but the logs are public and an independent re-run of the edited Qwen scored 51.0% on MATH-500.</p></div>
<figcaption><strong>Promising, early, and narrower than the headlines.</strong> Summarized from the source post's own caveats.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: what the results don't show yet</summary>

- **It removes obstacles; it doesn't add abilities.** The toy and the Qwen edit both worked because one part (a growing urge to re-check, a looping direction) hid behavior the model could already do. Gemma 3 270M made ordinary reasoning mistakes with no single part to switch off, and the LLM couldn't improve it: MATH-500 went from 6.8% to between 7.0% and 7.7%, which the authors didn't count as an established gain.
- **Some feedback is usually needed.** Qwen's large gain needed 50 forward passes; with 10 or 25 the loops barely went away. Much of the gain also comes from the model finishing answers it used to abandon, not from it becoming smarter.
- **Scale.** Ten weights can be read by eye. Real models can't be read number by number, so the LLM works through code and test runs, and the authors name context length and harness inefficiencies as the main bottlenecks. Editing an 8B model end to end isn't shown.
- **Evidence quality.** It's a blog post, not a peer-reviewed paper. The LLM, "GPT-6 Astra", isn't publicly described, and the authors call the results "very early". On the plus side, the full logs are on [GitHub](https://github.com/RikiyaT/lm_understand-logs), the edited Qwen is on [Hugging Face](https://huggingface.co/RikiyaT/Qwen3.5-0.8B-weight-space-programming), and an independent re-run matched the main Qwen result.
- **Safety cuts both ways.** If an LLM can find and switch off a looping direction, it can presumably find and switch off a refusal behavior too. The same reading ability is also a tool for auditing what a model does.

</details>

## Sources

- R. Takehi, J. Teoh, A. Zhang, O. Khattab, [*Sparks of Weight-Space Programming: LLMs can natively read & write neural network weights*](https://rikiyat.github.io/blog/weight-space-programming/), MIT CSAIL blog post (2 November 2026). The original source for the term, the Qwen3.5-0.8B fix and every Qwen number in this post.
- The authors' [experiment logs on GitHub](https://github.com/RikiyaT/lm_understand-logs) and the [edited Qwen3.5-0.8B on Hugging Face](https://huggingface.co/RikiyaT/Qwen3.5-0.8B-weight-space-programming), with the independent re-run on its model card.
- Qwen team, [Qwen3.5-0.8B `config.json`](https://huggingface.co/Qwen/Qwen3.5-0.8B/blob/main/config.json), for the hidden size (1,024) behind the 131,072-weight count.
- D. Lindner et al., [*Tracr: Compiled Transformers as a Laboratory for Interpretability*](https://arxiv.org/abs/2301.05062), arXiv:2301.05062 (2023), the compiler example above.
- The tiny thinker is my own toy for this post; its figures and the Python code above run the same 10-weight model.

<script defer src="/blog_posts/experiments/weight-space/ws-post.js"></script>
