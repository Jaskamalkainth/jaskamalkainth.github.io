---
title: "Weight-Space Programming: LLMs That Read and Write Weights"
description: "Weight-space programming: an LLM reads a network's raw weights and edits them by reasoning, not gradient descent. How it works, the Qwen3.5-0.8B fix, limits."
date: 2026-11-04
last_modified_at: 2026-11-04
keywords: [weight-space programming, LLM editing neural network weights, Sparks of Weight-Space Programming, Qwen3.5-0.8B weight edit, weight space learning, model merging task arithmetic, LoRA, hypernetwork LoRA generation]
categories: llm machine-learning interpretability
math: true
related: ["/blog_posts/weight-space-programming-simple-example.html", "/blog_posts/taalas-hc1-chatjimmy-explained.html", "/blog_posts/monte-carlo-simulation-explained.html"]
faq:
  - q: "What is weight-space programming?"
    a: "Weight-space programming is a general-purpose LLM reading a neural network's raw weights and writing new values by reasoning about what each part computes, instead of running an optimizer such as gradient descent. The term comes from a November 2026 MIT CSAIL blog post, Sparks of Weight-Space Programming, which used it to diagnose networks, fix failures with small targeted edits, and write small networks from scratch."
  - q: "Is weight-space programming the same as fine-tuning?"
    a: "No. Fine-tuning changes weights with gradient descent on training data, millions of small steps that nobody designs by hand. In weight-space programming, an LLM decides which weights to change and why, then writes the change directly. In the Qwen3.5-0.8B experiment it changed 131,072 weights in two layers, about 0.016% of the model, using at most 50 forward passes on practice problems and no gradients."
  - q: "Can I download the Qwen3.5-0.8B model edited by weight-space programming?"
    a: "Yes. The authors published it on Hugging Face as RikiyaT/Qwen3.5-0.8B-weight-space-programming, along with the full logs on GitHub. Only the down_proj matrices of layers 15 and 19 differ from the base model. An independent re-run listed on the model card scored 51.0% on MATH-500, close to the 48.1% the authors report, with 31.6% of answers still hitting the token limit."
  - q: "Can weight-space programming teach a model new skills?"
    a: "Not in the reported results. The edits worked by removing an obstacle that hid an ability the model already had, such as Qwen3.5-0.8B's thinking loops. On Gemma 3 270M, whose mistakes were ordinary reasoning errors with no single faulty part, the LLM could not meaningfully improve it: MATH-500 moved from 6.8% to between 7.0% and 7.7%, which the authors did not treat as a real gain."
  - q: "How is weight-space programming different from a hypernetwork?"
    a: "A hypernetwork is a network trained specifically to output weights for one family of models, such as Text-to-LoRA generating LoRA adapters from a task description. Weight-space programming uses a general-purpose LLM with no weight-specific training: it inspects the weights, reasons about them in text and code, and writes edits. Hypernetworks are fast and narrow; weight-space programming is slow, explainable and general."
---

# Weight-Space Programming: LLMs That Read and Write Weights

> **In short:** Weight-space programming means a general-purpose LLM reads a neural network's raw weights and edits them by reasoning, with no gradient descent. In MIT CSAIL's November 2026 "Sparks" post, an LLM fixed Qwen3.5-0.8B's thinking loops by changing 131,072 weights (0.016%), lifting MATH-500 from 7.9% to 48.1%. The results are early and not peer-reviewed.

<link rel="stylesheet" href="/blog_posts/experiments/weight-space/ws-post.css">

**New to the idea?** Start with [weight-space programming in one simple example](/blog_posts/weight-space-programming-simple-example.html): one 10-weight network, one bug, one edited number.

This is a research explainer. Every section opens with a picture or a small simulation, and the full explanation is under **Read more**. The main source is [*Sparks of Weight-Space Programming*](https://rikiyat.github.io/blog/weight-space-programming/) by Rikiya Takehi, Jayden Teoh, Alex Zhang and Omar Khattab (MIT CSAIL, 2 November 2026). The second half covers the older ways of "programming" weights it builds on. Toy figures run the real algorithms; numbers for real models come from the papers and configs in [Sources](#sources).

## Executive summary: weight-space programming in five points

<figure class="hv" data-hv="summary">
<div class="hv-canvas"><p class="hv-fallback">Figure, four tiles. An LLM changed 131,072 weights in Qwen3.5-0.8B (0.016%) with no training. MATH-500 went from 7.9% to 48.1% after that edit. A stuck physics policy went from 0 to 1,024 successful episodes after a one-shot edit to 3.5% of its weights. In Breakout, a network the LLM wrote from zero weights scored 517.4 versus 25.3 for PPO after 500 million steps.</p></div>
<figcaption><strong>Small, reasoned edits; large effects.</strong> All four results are reported by Takehi et al. (2026); the 131,072 count is checked against Qwen3.5-0.8B's config.</figcaption>
</figure>

1. **It's a new way to write weights.** Weights used to come from optimizers (gradient descent) or compilers. Here an LLM reads them, explains what they do, and edits them by hand, like a programmer editing code.
2. **LLMs can read raw weights.** From the numbers alone, the LLM named which game an agent was trained on, which shape a diffusion model draws and which language a transformer learned, and found every copying head.
3. **Tiny edits can fix real failures.** Removing one direction from 64 columns in two layers stopped most of Qwen3.5-0.8B's thinking loops and raised its math score about sixfold.
4. **It can write small networks from scratch.** With no data or gradients, it wrote game-playing networks that beat a PPO baseline trained for 100M steps in all three MinAtar games it tried.
5. **It removes obstacles; it doesn't add skills.** Where a model simply lacked an ability (Gemma 3 270M at math), editing didn't help. It's early work from one group with an unreleased model.

<details class="hv-more" markdown="1">
<summary>Read more: why this matters, and where the term comes from</summary>

Small language models (roughly 0.5 to 8 billion weights) are cheap enough to run on a laptop or phone, but out of the box they are weak generalists. The usual fix is fine-tuning, which needs labeled data, GPUs and many small gradient steps. **Weight-space programming** offers a different route: let a strong LLM look inside the small model, find what's wrong, and fix it directly, the way an engineer fixes a bug.

The term comes from *Sparks of Weight-Space Programming: LLMs can natively read & write neural network weights*, a blog post by Rikiya Takehi and Jayden Teoh (equal contribution), Alex Zhang and Omar Khattab of MIT CSAIL, published 2 November 2026. They define it as a general-purpose LLM reading and writing a network's weights directly, without an optimizer and sometimes with no feedback from the environment at all. The LLM in their experiments is called "GPT-6 Astra", described only as a general-purpose frontier model; the post doesn't say more about it.

It sits on top of a longer line of research on **weight space**, the space of all possible weights of a model. Researchers have long changed models by moving through that space: LoRA, model merging, evolution strategies and hypernetworks, all covered [later in this post](#other-ways). What's new is *who* does the moving: not a training algorithm, but a model that reasons about the weights and can explain its edit.

</details>

## What is weight-space programming?

<figure class="hv" data-hv="writers">
<div class="hv-canvas"><p class="hv-fallback">Figure, three panels. Optimizer: data and a loss go through millions of small gradient steps and produce weights nobody designed. Compiler: a formal program goes through fixed translation rules (such as Tracr) and produces weights that run that program. Weight-space programming: weights plus a goal in English go to an LLM that reads, explains and edits them, producing a targeted edit or a new network.</p></div>
<figcaption><strong>A third way to write weights: reasoning.</strong> Illustrative diagram of the framing in Takehi et al. (2026).</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: optimizers, compilers and reasoning</summary>

A neural network's behavior lives in its **weights**, the numbers it multiplies its inputs by. Until now, those numbers have been written in one of three ways:

- **Optimizers** such as SGD, Adam or Muon fit weights to data with gradient descent. The result works, but nobody designed it, and understanding it afterwards is the whole field of interpretability.
- **Compilers** translate a formal program into weights. Tracr (Lindner et al., 2023), for example, compiles programs written in the RASP language into transformer weights.
- **Specialized networks** trained to output weights, such as hypernetworks and fast weight programmers, covered below.

Weight-space programming adds a fourth: a **general-purpose LLM** that was never trained for this task reads the weights, reasons about what each part computes or should compute, and writes new values. Depending on the experiment it got no tools, a Python sandbox, a small budget of **forward passes** (running the network on inputs and seeing outputs), or a tool to inspect attention patterns. It never ran a training loop.

The authors link this to Andrej Karpathy's "Software 2.0" essay, which described neural network weights as code written by optimization rather than by people. Their claim is that weights can now also be written, and read, by reasoning.

</details>

## What is weight space?

<figure class="hv" data-hv="landscape">
<div class="hv-canvas"><p class="hv-fallback">Figure: a model with only two weights, f(x) = w2 · tanh(w1 · x), fit to 21 points of 1.5 · tanh(x). The map shows its loss at every (w1, w2) from -3 to 3; darker is lower. There are two perfect models, at (1, 1.5) and (-1, -1.5), mirror images of each other. The selected model at (-0.40, 2.20) has loss 4.149 and its curve slopes the wrong way. Gradient descent from (2.6, -2.2), loss 9.453, reaches (1.17, 1.41) with loss 0.0015 after 150 steps.</p></div>
<figcaption><strong>Every point on the map is a whole model; training is a walk downhill.</strong> Tap the map to see the model at that point. Computed live from the toy model; a real LLM has the same picture in hundreds of millions of dimensions.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: weights, loss landscapes and symmetries</summary>

A neural network computes its output from its input and a fixed list of numbers called **weights** (or parameters). Change the weights and you get a different function. **Weight space** is the set of all possible weight lists: a model with *n* weights is one point in an *n*-dimensional space, and every point is a valid model, though almost all are useless.

The figure uses a model with just two weights, $f(x) = w_2 \tanh(w_1 x)$, so its whole weight space is a flat map. Color shows the **loss** at each point, the mean squared error against the 21 training points. Training by **gradient descent** starts somewhere, measures which way is downhill (the gradient), and takes a small step; repeat. From (2.6, -2.2) with step size 0.3 it reaches (1.17, 1.41) with loss 0.0015 in 150 steps.

The map shows two features that carry over to real networks:

- **Symmetry.** $(w_1, w_2)$ and $(-w_1, -w_2)$ compute the same function, because $\tanh$ is odd. So there are two perfect models, mirror images. Real networks have far more such symmetries: swapping two neurons in a layer, along with their connections, gives an identical model at a different point. This is why you can't merge two models trained from scratch by averaging them, and why weight space learning methods are built to respect these symmetries.
- **Flat valleys.** Along $w_1 = 0$ the loss is the same, 1.210, whatever $w_2$ is, and around the minima the loss changes slowly in some directions and fast in others. In large models most directions barely matter, which is the reason the small updates in the next sections work.

For a real small model the space is enormous. Qwen2.5-0.5B (hidden size 896, 24 layers, a 151,936-token vocabulary with tied input and output embeddings) has 494,032,768 weights, all counted from its published `config.json`.

</details>

## What can an LLM read from a network's raw weights?

<figure class="hv" data-hv="read">
<div class="hv-canvas"><p class="hv-fallback">Figure, four panels. Which game was it trained on: from the weights of 4 PPO game agents (17,253 weights each) and an unnamed grid description, the LLM named all 4 games. What does this diffusion model draw: from 3 tiny DDPMs (23,824 weights each), with no forward passes, it named all 3 shapes. Which language, which heads copy: from the middle 4 blocks of 3 character-level transformers (7.2 million weights), it named all 3 languages and found all 5 copying heads with no false positives. Which model is the sycophant: from weights alone it failed 4 of 4 attempts; allowed to inspect attention patterns, it identified the sycophant in 3 of 3 pairs.</p></div>
<figcaption><strong>From raw numbers to "this is Pong".</strong> Reported by Takehi et al. (2026); the logs are public.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: the four "reading" experiments</summary>

The first experiments test whether an LLM can understand a network it has never seen run.

- **Which game? (Experiment 1.)** Four agents trained with PPO on grid games (Breakout, Pong, Pac-Man, Freeway) share one architecture: an MLP of 500 → 32 → 32 → 5 with tanh, 17,253 weights. Given only the weights and a description of the grid that didn't name the game, the LLM named all four, and was 99% confident on Breakout.
- **Which shape? (Experiment 2.)** Three tiny diffusion models (DDPMs, MLP 160 → 64 → 64 → 144, 23,824 weights) each generate 12 × 12 circles, triangles or squares. With no forward passes, the LLM named each shape. It drew every shape as an outline rather than filled in, which the authors read as a sign that it reasoned from the weight structure rather than simulating the network.
- **Which language, and which heads copy? (Experiment 3.)** Three 7.2-million-weight character-level transformers (4 layers × 6 heads, width 384) were trained on Python, romanized Japanese and English. Given only the four middle transformer blocks, with no input or output layers, the LLM named the language in both attempts for all three. It also found every **copying (induction) head**, the attention heads that look back for an earlier copy of the current text and predict what came next (Elhage et al., 2021), and named no others. Ground truth: Python heads 2.1, 3.1 and 3.5; romaji 3.3; English 3.1. Measured on repeated random strings, copying heads scored 0.22 to 0.55 and every other head at most 0.02.
- **Which model is sycophantic? (Experiment 7.)** Two copies of Gemma 3 270M were fine-tuned the same way, one toward honest answers and one toward agreeing with the user. From weights alone, the LLM failed all four attempts. Allowed to look at attention patterns on texts it wrote itself (but not at outputs), it picked the sycophant in all three pairs. In one head, 10.2, the honest model attends 94.3% to the numbers in the question; the sycophant attends 85.7% to the user's suggested answer.

</details>

## How did an LLM fix Qwen3.5-0.8B's reasoning loops?

<figure class="hv" data-hv="ablate">
<div class="hv-canvas"><p class="hv-fallback">Figure: eight arrows stand for MLP output columns, the vectors each MLP neuron adds to the model's running state. A dashed line is the "loop direction" u. Sliding to 100% removes each column's component along u, so the 8 columns no longer push along it at all, while everything else they write is unchanged. In the real edit, 64 of the 3,584 down_proj columns in layers 15 and 19 were changed, each 1,024 numbers long: 131,072 weights.</p></div>
<figcaption><strong>Delete one direction, keep everything else.</strong> An illustrative 2-D version of the edit, computed live; the real columns have 1,024 dimensions. The post doesn't publish the exact formula, so this shows the standard way to remove a direction.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: what the edit changed</summary>

**Qwen3.5-0.8B** is a small reasoning model: 24 layers, hidden size 1,024, MLP width 3,584 (from its `config.json`). With thinking turned on it tends to **loop**, repeating the same reasoning until it hits the token limit. On the first 96 practice problems, the base model ran into the 32,768-token limit 85 times.

The LLM traced the looping to **one direction** in the model's hidden state that the MLPs of layers 15 and 19 write into it. Every MLP ends with a `down_proj` matrix of shape 1,024 × 3,584: each of its 3,584 columns is the vector that one MLP neuron adds to the hidden state when it fires. The LLM subtracted the loop direction from 64 of those columns in each of the two layers. The published checkpoint confirms that only `layers.15.mlp.down_proj` and `layers.19.mlp.down_proj` changed.

That is 64 × 1,024 × 2 = **131,072 weights**, about 0.016% of the model's 0.8 billion. The post doesn't give the exact formula; the standard way to remove a unit direction $u$ from a column $w$ is to subtract its projection:

$$
w \leftarrow w - (u^{\top} w)\, u
$$

After this, those neurons can still write everything they wrote before, except along $u$. Compare this with fine-tuning, which would nudge all 0.8 billion weights slightly with no explanation of what changed.

</details>

### How much did the edit help?

<figure class="hv" data-hv="qwen">
<div class="hv-canvas"><p class="hv-fallback">Chart: Qwen3.5-0.8B before and after the edit, by how many forward passes the LLM could use. Base: MATH-500 7.9%, GSM8K 13.8%, IFEval 21.0%, hit token limit 93.0%. With 10 forward passes: 12.3%, 25.7%, 49.0%, 87.2%. With 25: 14.1%, 25.1%, 39.9%, 86.4%. With 50: 48.1%, 67.1%, 62.3%, 33.1%.</p></div>
<figcaption><strong>The big jump needed 50 forward passes.</strong> Pick a budget. Numbers reported by Takehi et al. (2026), thinking on, up to 32,768 tokens.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: the full results table</summary>

The LLM could run the model a limited number of times on practice problems from the GSM8K and MATH training sets. Each **forward pass** was a batch of about 64 sequences of up to 512 tokens.

| Qwen3.5-0.8B | MATH-500 | GSM8K | IFEval | Hit token limit (lower is better) |
|---|---:|---:|---:|---:|
| Base | 7.9% | 13.8% | 21.0% | 93.0% |
| Edited, 10 forward passes | 12.3% | 25.7% | 49.0% | 87.2% |
| Edited, 25 forward passes | 14.1% | 25.1% | 39.9% | 86.4% |
| Edited, 50 forward passes | 48.1% | 67.1% | 62.3% | 33.1% |

Sampling used temperature 0.6, top-p 0.95, top-k 20 and presence penalty 1.5, with 4 samples per MATH-500 problem. The gains reach beyond math (IFEval measures instruction following) because the loops weren't specific to math.

Two cautions. With 10 or 25 forward passes the model still looped on most answers; the large gain appeared only with 50. And a model that stops looping finishes more answers, so much of the improvement is the model being *allowed* to answer, not becoming smarter. An independent re-run of the published checkpoint, listed on its Hugging Face model card, scored **51.0%** on MATH-500 over 2,000 generations, with 31.6% still hitting the limit: close to the authors' numbers.

</details>

## Can an LLM write a neural network from scratch?

<figure class="hv" data-hv="scratch">
<div class="hv-canvas"><p class="hv-fallback">Chart, mean score over 1,000 episodes for networks of shape 600 → 32 → 32 → 6. Breakout: PPO 100M steps 15.8, PPO 500M steps 25.3, written by the LLM in one shot 517.4. Seaquest: 5.6, 88.9, 53.1. Asterix: 25.8, 55.2, 53.2. The LLM started from zero weights with the game rules and code, but no data, gradients or rollouts.</p></div>
<figcaption><strong>Hand-written networks beat 100M steps of PPO in all three games.</strong> Each panel has its own scale. Reported by Takehi et al. (2026).</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: writing networks for games, Go and a stuck policy</summary>

**Games (Experiment 5).** For three MinAtar games, the LLM wrote all the weights of a 600 → 32 → 32 → 6 tanh network, starting from zeros, with the game's rules and code but no data, gradients or practice rollouts. It decided what program each network should run and converted it into neural form; in Breakout, for example, it set the first layer to compute where the ball will land.

| MinAtar game | PPO, 100M steps | PPO, 500M steps | LLM, one shot |
|---|---:|---:|---:|
| Breakout | 15.8 | 25.3 | 517.4 |
| Seaquest | 5.6 | 88.9 | 53.1 |
| Asterix | 25.8 | 55.2 | 53.2 |

Scores are means over 1,000 episodes with sticky actions at 0.1 and a 10,000-step cap. The LLM beat PPO at 100M steps everywhere and PPO at 500M steps in Breakout only.

**Go on a 9 × 9 board (Experiment 6).** The LLM wrote a 1.48-million-weight network (243 → 512 × 6 → 82, ReLU) as a layered Go program in Python, early layers marking stones and liberties, with no search and no fitting to games. With zero forward passes it won more than half its games against two smaller PPO networks; with 50 forward passes (each up to 128 practice games), it beat a same-sized PPO network trained on about 20 million games.

**Fixing a stuck policy (Experiment 4).** A PPO-trained car in the Kinetix physics environment (171,664 weights) never got up a ramp: 0 successes in 256 episodes. With no tools and one try, the LLM explained the local minimum and added a small separate path through a few units per layer that reads the car's position and speed, changing 3.5% of the weights. Once the car is past the hard part, the path switches off and the original network drives. It then succeeded in all 1,024 test episodes.

</details>

## What are the limits of weight-space programming?

<figure class="hv" data-hv="limits">
<div class="hv-canvas"><p class="hv-fallback">Figure, six cards. Can't add what isn't there: on Gemma 3 270M MATH-500 moved only from 6.8% to 7.0-7.7%. Feedback matters: Qwen gained little with 10 or 25 forward passes; the big jump came at 50. Weights alone weren't enough: sycophancy detection failed 4 of 4 times from weights and worked with attention patterns. Small networks, big context: many experiments needed the whole network in context. Early and unreviewed: a blog post, an unreleased "GPT-6 Astra" model, baselines with best-of-3 to 10 seeds. But checkable: logs are public and an independent re-run of the edited Qwen scored 51.0% on MATH-500.</p></div>
<figcaption><strong>Promising, early, and narrower than the headlines.</strong> Summarized from the post's own caveats.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: what the results don't show yet</summary>

- **It removes obstacles; it doesn't add abilities.** The Qwen edit worked because one component (a looping direction) hid an ability the model already had. Gemma 3 270M made ordinary reasoning mistakes with no single part to switch off, and the LLM couldn't improve it: MATH-500 went from 6.8% to between 7.0% and 7.7%, which the authors didn't count as an established gain.
- **Some feedback is usually needed.** The zero-feedback results are striking, but Qwen's large gain needed 50 forward passes and Go improved a lot with them. Reading weights cold has limits: sycophancy detection failed from weights alone.
- **Scale.** Many experiments put the whole network in the LLM's context, which only works for small networks; the authors name context length and harness inefficiencies as the main bottlenecks. Editing an 8B model end to end isn't shown.
- **Evidence quality.** It's a blog post, not a peer-reviewed paper. The LLM, "GPT-6 Astra", isn't publicly described. Sample sizes are small, and PPO baselines were best-of-3 to 10 seeds. The authors call the results "very early" and say they are building a benchmark and harness. On the plus side, full logs are on [GitHub](https://github.com/RikiyaT/lm_understand-logs), the edited Qwen is on [Hugging Face](https://huggingface.co/RikiyaT/Qwen3.5-0.8B-weight-space-programming), and an independent re-run matched the main Qwen result.
- **Safety cuts both ways.** If an LLM can find and switch off a looping direction, it can presumably find and switch off a refusal behavior too. The same reading ability is also an interpretability tool for auditing models, as the sycophancy experiment shows.

</details>

## How else can you program a model's weights?
{: #other-ways}

<figure class="hv" data-hv="moves">
<div class="hv-canvas"><p class="hv-fallback">Figure, seven panels. 1. Train: follow the gradient downhill in many small steps (fine-tuning, RL). 2. Adapt in a subspace: move only along a few low-rank directions (LoRA). 3. Combine: add, subtract or average finished models (task arithmetic, TIES, model soups). 4. Search: try random nudges and keep what scores well, with no gradients (evolution strategies). 5. Generate: a network writes the weights from a description (Text-to-LoRA, Drag-and-Drop LLMs). 6. Edit: change a few weights to rewrite one fact or behavior (ROME, MEMIT). 7. Reason: an LLM reads the weights, explains them and edits them by hand (weight-space programming).</p></div>
<figcaption><strong>Seven ways to move a model.</strong> Illustrative diagram. Weight-space programming (7) is the newest; the others get their own sections below.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: the seven families compared</summary>

| Family | What moves the weights | Needs | Typical output |
|---|---|---|---|
| Full fine-tuning | gradient descent on all weights | labeled data, backprop | a new full model |
| LoRA | gradient descent on a low-rank update | labeled data, backprop | an adapter of ~0.1-1% of the weights |
| Merging | arithmetic on finished models | fine-tuned models from one base | one model with several skills |
| Evolution strategies | random perturbations weighted by reward | a reward function, many forward passes | a new full model |
| Hypernetworks | a trained network outputs weights | a trained generator, a task description | an adapter, in one forward pass |
| Model editing | a closed-form or targeted update | the fact or behavior to change | the same model with one change |
| Weight-space programming | an LLM's reasoning, sometimes a few forward passes | a frontier LLM, the weights, a goal | an explained edit or a new small network |

Model editing is the closest older relative of weight-space programming. Methods such as ROME (Meng et al., 2022) locate the middle-layer MLP weights where a model stores a fact like "the Eiffel Tower is in Paris" and apply a rank-one update to change it; MEMIT extends this to thousands of facts at once. The difference: ROME's procedure is a fixed algorithm designed by people for one kind of edit, while weight-space programming lets an LLM decide what to change, for any kind of network.

</details>

### How does LoRA change so few weights?

<figure class="hv" data-hv="lora">
<div class="hv-canvas"><p class="hv-fallback">Figure: a full update to one 896 × 896 attention matrix has 802,816 numbers. LoRA writes it as B (896 × r) times A (r × 896). At rank r = 8 that is 14,336 numbers, 56 times fewer. Across the q and v projections of all 24 layers of Qwen2.5-0.5B, a rank-8 LoRA has 540,672 weights, 0.11% of the model's 494,032,768, about 1.08 MB in 16-bit. A slider changes r from 1 (67,584 weights) to 64 (4,325,376).</p></div>
<figcaption><strong>Two thin matrices stand in for one big one.</strong> Drag the rank. Counts computed from Qwen2.5-0.5B's config (q_proj 896 → 896, v_proj 896 → 128).</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: low-rank adaptation and intrinsic dimension</summary>

**LoRA** (low-rank adaptation, Hu et al., 2021) freezes the original weights $W_0$ and learns an update made of two thin matrices:

$$
W = W_0 + \Delta W = W_0 + \frac{\alpha}{r} B A, \qquad B \in \mathbb{R}^{d \times r},\; A \in \mathbb{R}^{r \times k},\; r \ll \min(d, k)
$$

Only $A$ and $B$ are trained. For a $d \times k$ matrix that is $r(d + k)$ numbers instead of $dk$. In weight space, LoRA restricts the walk to a small flat slice through the starting point, and the slice turns out to contain good models. The LoRA paper reports that, compared with fully fine-tuning GPT-3 175B, it cut trainable parameters by 10,000 times and GPU memory by 3 times.

Worked example for **Qwen2.5-0.5B**, rank 8, on the query and value projections (a common default):

| Matrix | Shape | Full update | LoRA (r = 8) |
|---|---|---:|---:|
| q_proj | 896 × 896 | 802,816 | 14,336 |
| v_proj | 896 × 128 | 114,688 | 8,192 |
| Per layer | | 917,504 | 22,528 |
| All 24 layers | | 22,020,096 | **540,672** |

540,672 weights is 0.11% of the model, about 1.08 MB stored in 16-bit. (v_proj is narrow because the model uses grouped-query attention with 2 key/value heads of size 64.)

Why does such a small slice work? **Intrinsic dimension.** Aghajanyan, Zettlemoyer and Gupta (2020) fine-tuned pre-trained models inside a random low-dimensional subspace and found that 200 trainable numbers, projected into RoBERTa's full weight space, reached 90% of full fine-tuning performance on the MRPC paraphrase task. Larger and better pre-trained models needed *fewer* dimensions. Pre-training does the hard work; adapting the result is a short move.

LoRA adapters are also why weight programming is practical on fixed hardware: the [Taalas HC1 chip](/blog_posts/taalas-hc1-chatjimmy-explained.html) hardwires Llama 3.1 8B's base weights into silicon, and fine-tunes can only arrive as LoRA adapters on top.

</details>

### How does task arithmetic add and subtract skills?

<figure class="hv" data-hv="arith">
<div class="hv-canvas"><p class="hv-fallback">Figure: from a pre-trained base θ0, fine-tuning on math reaches θ_math and fine-tuning on code reaches θ_code. The arrows between them are task vectors, τ_math = θ_math − θ0 and τ_code = θ_code − θ0. Adding both arrows to the base, scaled by λ, gives one model aimed at both skills; subtracting τ_code moves away from code. A slider sets λ from 0 to 1.5.</p></div>
<figcaption><strong>A fine-tune is an arrow you can reuse.</strong> Add arrows to combine skills, subtract one to remove a behavior. An illustrative 2-D picture of a very high-dimensional idea.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: task vectors, negation and model soups</summary>

Ilharco et al. (ICLR 2023) define a **task vector** as the element-wise difference between a fine-tuned model's weights and the pre-trained weights it started from:

$$
\tau_t = \theta_t - \theta_0, \qquad \theta_{\text{new}} = \theta_0 + \lambda \sum_t \tau_t
$$

The paper reports three operations:

- **Addition:** adding several task vectors gives one model that does better on all those tasks at once.
- **Negation:** subtracting a task vector lowers performance on that task while leaving control tasks mostly unchanged, for example making a model less toxic by subtracting a "toxic" task vector.
- **Analogies:** when tasks are related like "A is to B as C is to D", combining three task vectors improves the fourth task without its data.

The scaling factor λ is picked on a small validation set. All of this works only for models fine-tuned **from the same base**: they start at the same point, so their arrows live in the same coordinates. Two models trained from scratch sit in different symmetric copies of the landscape (the neuron-swapping symmetry above), and averaging them breaks both.

A related, older result is **model soups** (Wortsman et al., ICML 2022): averaging the weights of several models fine-tuned from one base with different hyperparameters often beats the best single one, at no extra inference cost. Their best ViT-G soup reached 90.94% top-1 on ImageNet. Merging is now routine for open small models: Sakana AI's evolutionary model merge (Akiba et al., *Nature Machine Intelligence*, 2025) even uses an evolutionary search to find *how* to merge, both in weight space and in how layers are wired together.

</details>

#### Why does plain averaging fail, and how does TIES-merging fix it?

<figure class="hv" data-hv="ties">
<div class="hv-canvas"><p class="hv-fallback">Figure, four steps on three task vectors over eight weights. Task 1: 0.9, -0.1, 0.5, 0.05, -0.7, 0.2, 0, 0.6. Task 2: 0.8, 0.6, -0.4, 0.1, -0.05, -0.8, 0.3, 0.02. Task 3: -0.3, 0.7, -0.5, 0, -0.6, 0.1, 0.05, 0.7. Step 2, trim: keep each vector's 4 largest values. Step 3, elect the sign of each weight from the sum of the kept values: +, +, −, 0, −, −, 0, +. Step 4, average only kept values that agree with that sign: 0.85, 0.65, -0.45, 0, -0.65, -0.80, 0, 0.65. The plain average is 0.47, 0.40, -0.13, 0.05, -0.45, -0.17, 0.12, 0.44.</p></div>
<figcaption><strong>Averaging lets conflicts cancel; TIES keeps the strong, agreeing changes.</strong> Step through it. Computed live with the TIES algorithm (keeping 4 of 8 values per vector instead of the paper's top 20%, so the toy shows something).</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: the three TIES steps</summary>

When you add or average task vectors, two kinds of **interference** hurt the result (Yadav et al., NeurIPS 2023):

1. **Noise from small changes.** Fine-tuning nudges almost every weight a little; most nudges don't matter, but summed across models they blur the important ones.
2. **Sign conflicts.** One task pushes a weight up and another pushes it down. Averaging cancels both and gives a value neither task wanted.

**TIES-merging** (TrIm, Elect Sign and merge) fixes this in three steps:

1. **Trim:** in each task vector, reset all but the largest-magnitude changes to zero (the paper keeps the top 20%).
2. **Elect sign:** for each weight, pick the sign with more total magnitude across the trimmed vectors.
3. **Disjoint merge:** average only the values that agree with the elected sign.

In the toy example, weight 6 shows the problem clearly: task 2 changed it by -0.8, while tasks 1 and 3 nudged it by +0.2 and +0.1. The plain average is -0.17, so the merged model loses most of what task 2 learned. TIES trims the two small nudges and keeps -0.80. Weights 4 and 7 only received small nudges, so TIES leaves them at 0.

</details>

### Can you optimize a language model's weights without gradients?

<figure class="hv" data-hv="es">
<div class="hv-canvas"><p class="hv-fallback">Figure: evolution strategies on the same two-weight map. Each generation, 30 noisy copies of the current model (noise scale 0.3) are scored; the model moves toward the copies that scored above average (step size 0.15). Starting from (2.6, -2.2) with loss 9.453, the loss is 3.153 after 10 generations, 0.246 after 20 and 0.029 after 30, reaching the same valley as gradient descent with zero gradients computed, then hovering around loss 0.02 to 0.03 because of the noise.</p></div>
<figcaption><strong>Jiggle, score, step toward the winners.</strong> No gradients, only a score per copy. Computed live with the update rule from Qiu et al. (2025) and a fixed random seed.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: evolution strategies at billion-parameter scale</summary>

**Evolution strategies (ES)** treat the model as a black box. Each step:

1. Make *N* copies of the weights, each with its own random Gaussian noise $\varepsilon_n$ added, scaled by $\sigma$.
2. Score each copy with a reward $R_n$ (in the toy: minus the loss; for an LLM: did it solve the puzzle?).
3. Normalize the rewards to z-scores $Z_n$ and move the weights toward the noise directions that scored well:

$$
\theta \leftarrow \theta + \alpha \cdot \frac{1}{N} \sum_{n=1}^{N} Z_n \, \varepsilon_n
$$

That sum is a [Monte Carlo estimate](/blog_posts/monte-carlo-simulation-explained.html) of the gradient of the smoothed reward, built only from forward passes. ES was long assumed not to scale to models with billions of weights, because the noise has as many dimensions as the model.

Qiu et al. (*Evolution Strategies at Scale: LLM Fine-Tuning Beyond Reinforcement Learning*, ICML 2026) report the first full-parameter ES fine-tuning of LLMs at billion-parameter scale, with no dimensionality reduction, on Qwen2.5 (0.5B to 7B) and Llama 3 (1B to 8B) models. Their setup is surprisingly small: **N = 30** copies per step, $\sigma = 0.001$, and each copy's noise regenerated from a random seed, so it never needs to be stored. They report ES was more stable than RL methods such as PPO and GRPO across base models, tolerated long-horizon rewards better, and was less prone to reward hacking.

A caveat from their own tables: on the Countdown puzzle with the smallest model, Qwen2.5-0.5B-Instruct, ES scored 0.3% accuracy, the same as PPO and below GRPO variants (about 13 to 14%). The gains show up on the larger models. The toy uses $\sigma = 0.3$ instead of 0.001 because it has only two weights: the noise has to be big enough to tell the copies apart.

</details>

### Can a model write another model's weights?

<figure class="hv" data-hv="hyper">
<div class="hv-canvas"><p class="hv-fallback">Figure: a task description such as "solve math word problems" goes into a hypernetwork of about 5 to 55 million weights, along with a layer id and module id, which outputs LoRA matrices A and B for the q and v projections of every layer of a frozen Mistral-7B-Instruct, in one forward pass. Text-to-LoRA was trained on 479 tasks. On 10 unseen benchmarks it averaged 67.7, versus 66.3 for a multi-task LoRA trained on the same data and 55.8 for the base model.</p></div>
<figcaption><strong>Describe the task, get the adapter.</strong> Text-to-LoRA: one forward pass instead of a training run. Numbers from Charakorn et al. (ICML 2025), Table 2.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: hypernetworks, Text-to-LoRA and Drag-and-Drop LLMs</summary>

A **hypernetwork** is a network whose output is the weights of another network. The idea dates back to Ha, Dai and Le's *HyperNetworks* (2016); for LLMs it has become practical because LoRA adapters are small enough to generate.

**Text-to-LoRA (T2L)**, from Sakana AI (Charakorn, Cetin, Tang and Lange, ICML 2025), takes an embedding of a natural-language task description plus a learned embedding for the layer index and module type (query or value projection), and outputs that module's LoRA matrices. Running it once per layer and module gives a full rank-8 adapter, about 3.4 million weights, for Mistral-7B-Instruct. It can be trained in two ways: to reconstruct a set of existing task-specific LoRAs, or with supervised fine-tuning straight through the generated adapters. The version that generalizes to new tasks is the second, trained on 479 tasks from Super-NaturalInstructions.

On 10 benchmarks it never saw, the largest version (about 55 million weights) averaged **67.7**, against 55.8 for the base model and 66.3 for a single multi-task LoRA trained on the same tasks. That margin over the multi-task LoRA is small, about 1.4 points; the point is that the adapter is specific to the description and costs one forward pass.

**Drag-and-Drop LLMs (DnD)** (Liang et al., 2025) skips the description: it maps a handful of unlabeled example prompts from a task to LoRA weights. The authors report up to 12,000 times lower overhead than full fine-tuning and average gains of up to 30% over the strongest training LoRAs on unseen common-sense, math, coding and multimodal benchmarks. More generators keep appearing, for example LoRAGen at ICLR 2026, which generates LoRAs with a latent diffusion model.

The limitation they share: the generator only knows the kinds of tasks it was trained on. A description far outside that distribution produces an adapter that helps little, and building the generator still needs many trained LoRAs or a large multi-task dataset.

</details>

#### Program-as-Weights: compiling a function into a small model

<figure class="hv" data-hv="paw">
<div class="hv-canvas"><p class="hv-fallback">Figure: an English specification is compiled once by a 4B compiler model into an adapter, "the program", which a frozen Qwen3 0.6B interpreter then runs locally on every call. The authors report the 0.6B interpreter matches prompting Qwen3-32B, with about one fiftieth of its inference memory, at about 30 tokens per second on a MacBook M3. The compiler was trained on FuzzyBench, 10 million examples.</p></div>
<figcaption><strong>A big model writes the program once; a tiny one runs it forever.</strong> Numbers are the authors' claims from the July 2026 preprint, not independently checked.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: "fuzzy functions" as weights</summary>

**Program-as-Weights (PAW)** (Zhang, Hotsko, Kim, Nie, Shieber and Deng, arXiv, July 2026) is the clearest example of weight programming as a *programming paradigm*. Many everyday functions resist clean rules: deciding which log lines deserve an alert, repairing broken JSON, ranking search results by intent. Today you'd call a large LLM with a prompt for each input.

PAW instead **compiles** the English specification into a parameter-efficient adapter for a small, frozen interpreter model. A 4B compiler, trained on FuzzyBench (10 million examples, released with the paper), runs once per function; the resulting adapter plus a 0.6B Qwen3 interpreter then handles every call locally and offline. The authors report that the 0.6B interpreter running PAW programs matches direct prompting of Qwen3-32B, with roughly one fiftieth of the inference memory and about 30 tokens per second on a MacBook M3.

This is the same shape as Text-to-LoRA, pushed toward software engineering: the weights are the compiled artifact, and the spec is the source code. As of November 2026 it is a preprint; I haven't reproduced its results.

</details>

### What is a fast weight programmer?
{: #fast-weights}

<figure class="hv" data-hv="fast">
<div class="hv-canvas"><p class="hv-fallback">Figure: a 4 × 4 fast-weight matrix W starts at zero. Writing a key-value pair adds the outer product v·kᵀ to W. With 4 orthogonal keys, reading W·k returns each stored value exactly. Writing a 5th key that overlaps key 1 and key 2 (cosine 0.71 with each) makes reading key 1 return the stored value plus 0.71 times the 5th value, an error of 2.12: a 4 × 4 matrix holds only 4 clean memories.</p></div>
<figcaption><strong>Attention as weight writing: each token adds an outer product to a weight matrix.</strong> Click to write pairs and read them back; computed live.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: linear transformers as fast weight programmers</summary>

Fast weight programmers are the oldest idea behind weight-space programming, and the Sparks post links to this work. The term **fast weight programmer** comes from Jürgen Schmidhuber's work in the early 1990s: one network (the programmer) produces, at every step, changes to the weights of another network, its **fast weights**, which act as short-term memory. Slow weights are learned by training; fast weights are rewritten on the fly.

Schlag, Irie and Schmidhuber (*Linear Transformers Are Secretly Fast Weight Programmers*, ICML 2021) showed that linearized self-attention is exactly this. For each token, the model computes a key $k_t$, value $v_t$ and query $q_t$, and

$$
W_t = W_{t-1} + v_t k_t^{\top}, \qquad y_t = W_t \, q_t
$$

Each token *writes* an outer product into a matrix, and each query *reads* from it. No gradient, no training loop: the slow weights learned to program the fast ones. The figure does exactly this with 4-dimensional keys.

The matrix has limited capacity. With $d$-dimensional keys, at most $d$ keys can be orthogonal, so storing more pairs makes them interfere, as the 5th key in the figure shows. The paper's fix is the **delta rule**: before writing, subtract what the matrix already returns for that key, $W_t = W_{t-1} + \beta_t (v_t - W_{t-1} k_t) k_t^{\top}$, so the write corrects instead of piling up. Several recent efficient sequence models, such as DeltaNet and test-time-training layers, build on this "weights as memory written at inference time" idea.

</details>

## Which weight-space method should you use?

<figure class="hv" data-hv="choose">
<div class="hv-canvas"><p class="hv-fallback">Figure, six cards. Full fine-tuning: needs labeled data and backprop, high cost, gives a new full model. LoRA: needs labeled data and backprop, low cost, gives a small adapter file. Merging (task arithmetic, TIES): needs fine-tuned models from one base, no backprop, very low cost, gives one model with several skills. Evolution strategies: needs a reward, no backprop, high cost from many forward passes, gives a new full model. Hypernetwork (Text-to-LoRA, DnD): needs a trained generator and a description, no backprop at use time, one forward pass, gives an adapter. Model editing (ROME, MEMIT): needs the fact to change, some backprop, very low cost, gives the same model with one fact changed. Weight-space programming: needs a frontier LLM, the weights and a goal, no backprop, costs LLM tokens plus a few forward passes, gives a targeted, explained edit or a small new network.</p></div>
<figcaption><strong>Pick by what you already have: data, models, a score, or just a description.</strong> A summary of the sections above, not a benchmark.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: a practical order, and the open problems</summary>

For a small model and a specific job, this is the order I'd try things in:

1. **Prompting first.** If a good prompt solves it, no weights need to change.
2. **Merge existing fine-tunes** of your base model if someone has already trained the skills you need. It costs minutes on a CPU. Tools such as [mergekit](https://github.com/arcee-ai/mergekit) implement task arithmetic and TIES.
3. **Train a LoRA** if you have a few hundred to a few thousand good examples. It is the default for a reason: cheap, small, and swappable at run time.
4. **Evolution strategies** if you have a reliable score but no labels and RL is unstable for you, and you can afford many forward passes.
5. **Hypernetworks** are worth watching rather than deploying for most people today: you need a pre-trained generator for your base model, and they work best on tasks similar to their training set.
6. **Weight-space programming** is a research result as of November 2026, not a tool you can run: the LLM used isn't public. Its first practical use is likely diagnosis, an LLM explaining *why* a small model fails (loops, a stuck policy, a sycophantic head) before you decide how to fix it.

Open problems the research keeps returning to:

- **Interference.** Every merged skill costs a little of the others; merging many task vectors still degrades each one.
- **Symmetry.** Weight space is full of equivalent copies of the same model, which makes it hard to compare or generate weights across models trained separately.
- **Generalization of generators.** Hypernetworks interpolate well between tasks they've seen and less well beyond them.
- **Safety.** If you can add a skill by adding a vector, you can also remove a safety behavior by subtracting one. Task negation was first shown as a way to *reduce* toxicity; the same arithmetic works in the other direction, which is one reason open-weight releases are hard to lock down. Watermarks that live in the output distribution, like the one in my [textGrain post](/blog_posts/textgrain-watermark-explained.html), face a similar weakness once weights are open.

</details>

## Sources

- R. Takehi, J. Teoh, A. Zhang, O. Khattab, [*Sparks of Weight-Space Programming: LLMs can natively read & write neural network weights*](https://rikiyat.github.io/blog/weight-space-programming/), MIT CSAIL blog post (2 November 2026); [logs](https://github.com/RikiyaT/lm_understand-logs) and [edited Qwen3.5-0.8B](https://huggingface.co/RikiyaT/Qwen3.5-0.8B-weight-space-programming).
- Qwen team, [Qwen3.5-0.8B `config.json`](https://huggingface.co/Qwen/Qwen3.5-0.8B/blob/main/config.json), for the hidden size and MLP width.
- D. Lindner et al., [*Tracr: Compiled Transformers as a Laboratory for Interpretability*](https://arxiv.org/abs/2301.05062), arXiv:2301.05062 (2023).
- N. Elhage et al., [*A Mathematical Framework for Transformer Circuits*](https://transformer-circuits.pub/2021/framework/index.html), Anthropic (2021).
- X. Han et al., [*A Survey of Weight Space Learning: Understanding, Representation, and Generation*](https://arxiv.org/abs/2603.10090), arXiv:2603.10090 (March 2026).
- E. J. Hu et al., [*LoRA: Low-Rank Adaptation of Large Language Models*](https://arxiv.org/abs/2106.09685), arXiv:2106.09685 (2021).
- A. Aghajanyan, L. Zettlemoyer, S. Gupta, [*Intrinsic Dimensionality Explains the Effectiveness of Language Model Fine-Tuning*](https://arxiv.org/abs/2012.13255), arXiv:2012.13255 (2020).
- G. Ilharco et al., [*Editing Models with Task Arithmetic*](https://arxiv.org/abs/2212.04089), ICLR 2023.
- P. Yadav et al., [*TIES-Merging: Resolving Interference When Merging Models*](https://arxiv.org/abs/2306.01708), NeurIPS 2023.
- M. Wortsman et al., [*Model soups*](https://arxiv.org/abs/2203.05482), ICML 2022.
- T. Akiba et al., [*Evolutionary Optimization of Model Merging Recipes*](https://arxiv.org/abs/2403.13187), Nature Machine Intelligence (2025).
- X. Qiu et al., [*Evolution Strategies at Scale: LLM Fine-Tuning Beyond Reinforcement Learning*](https://arxiv.org/abs/2509.24372), ICML 2026.
- R. Charakorn, E. Cetin, Y. Tang, R. T. Lange, [*Text-to-LoRA: Instant Transformer Adaption*](https://arxiv.org/abs/2506.06105), ICML 2025.
- Z. Liang et al., [*Drag-and-Drop LLMs: Zero-Shot Prompt-to-Weights*](https://arxiv.org/abs/2506.16406), arXiv:2506.16406 (2025).
- W. Zhang et al., [*Program-as-Weights: A Programming Paradigm for Fuzzy Functions*](https://arxiv.org/abs/2607.02512), arXiv:2607.02512 (July 2026).
- I. Schlag, K. Irie, J. Schmidhuber, [*Linear Transformers Are Secretly Fast Weight Programmers*](https://arxiv.org/abs/2102.11174), ICML 2021.
- K. Meng et al., [*Locating and Editing Factual Associations in GPT*](https://arxiv.org/abs/2202.05262) (ROME), NeurIPS 2022.
- Qwen team, [Qwen2.5-0.5B-Instruct `config.json`](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct/blob/main/config.json), used for the LoRA weight counts.

<script defer src="/blog_posts/experiments/weight-space/ws-post.js"></script>
