---
title: "Weight Space Explained: Programming an LLM's Weights Directly"
description: "Weight space is the space of all possible weights of a model. How LoRA, model merging, evolution strategies and hypernetworks edit small LLMs directly."
date: 2026-11-04
last_modified_at: 2026-11-04
keywords: [weight space, weight space learning, model merging, task arithmetic, LoRA, hypernetwork LoRA generation, evolution strategies LLM fine-tuning, small language model]
categories: llm machine-learning
math: true
related: ["/blog_posts/taalas-hc1-chatjimmy-explained.html", "/blog_posts/monte-carlo-simulation-explained.html", "/blog_posts/textgrain-watermark-explained.html"]
faq:
  - q: "Is weight space learning the same as fine-tuning?"
    a: "No. Fine-tuning is one way to move a model through weight space: it follows gradients computed on training data. Weight space learning is the broader field that treats weights themselves as data. It studies their geometry and symmetries, learns embeddings of whole models, and generates new weights with hypernetworks or diffusion models. Merging, model editing and gradient-free search also act on weights without ordinary fine-tuning."
  - q: "Can I merge two fine-tuned models without any training?"
    a: "Yes, if they were fine-tuned from the same base model. Subtract the base weights from each fine-tuned model to get task vectors, then add a scaled sum back to the base. Methods like TIES-merging trim small changes and resolve sign conflicts first, which usually works better than a plain average. Models trained from different bases or with different architectures can't be merged this way."
  - q: "How small can a fine-tune be?"
    a: "Very small. Aghajanyan et al. tuned RoBERTa to 90% of full fine-tuning performance on the MRPC paraphrase task with only 200 trainable numbers, projected into the full weight space. In practice, a rank-8 LoRA on the query and value projections of Qwen2.5-0.5B trains 540,672 weights, about 0.11% of the model, and saves as a file of roughly 1 MB in 16-bit."
  - q: "What is a hypernetwork in LLMs?"
    a: "A hypernetwork is a neural network whose output is the weights of another network. In LLMs it usually outputs LoRA adapters: Sakana AI's Text-to-LoRA takes a plain-English task description and produces LoRA matrices for every layer of a frozen base model in one forward pass, instead of training an adapter with gradient descent on that task's data."
  - q: "Can you train an LLM without backpropagation?"
    a: "Yes, at least for fine-tuning. Evolution strategies add random noise to the weights, score each noisy copy with a reward, and move toward the copies that scored well. Qiu et al. (ICML 2026) fine-tuned all the parameters of models from 0.5B to 8B this way with 30 copies per step. It needs many forward passes, but no gradients and no backward pass."
---

# Weight Space Explained: Programming an LLM's Weights Directly

> **In short:** A language model is a long list of numbers, its weights. Weight space is the space of every possible list; each point is a different model. "Weight programming" means changing a model by moving that point directly: adding a small LoRA update, adding or subtracting other models' changes (merging), searching with random nudges (evolution strategies), or having one network write another's weights (hypernetworks).

<link rel="stylesheet" href="/blog_posts/experiments/weight-space/ws-post.css">

This is a research explainer: every section opens with a picture or a small simulation you can play with, and the full explanation is under **Read more**. The toy figures run the real algorithms on a model small enough to draw; the numbers for real models come from their configs and the papers in [Sources](#sources).

## Executive summary: weight space in five points

<figure class="hv" data-hv="scale">
<div class="hv-canvas"><p class="hv-fallback">Figure, four tiles. Qwen2.5-0.5B has 494,032,768 weights, so it is one point in a space with that many dimensions. A rank-8 LoRA on its q and v projections trains 540,672 of them (0.11%). Aghajanyan et al. tuned RoBERTa to 90% of full fine-tuning on MRPC with 200 trainable numbers. A hypernetwork writes a new LoRA from a sentence in 1 forward pass.</p></div>
<figcaption><strong>A huge space, but the useful moves are small.</strong> Weight counts computed from Qwen2.5-0.5B's published config; the 200-parameter result is from Aghajanyan et al. (2020).</figcaption>
</figure>

1. **A model is a point.** Its weights are coordinates; training is a path from one point to another.
2. **Useful changes live in a tiny corner.** Fine-tuning moves a model along very few directions, which is why LoRA adapters of a fraction of a percent work.
3. **Changes are reusable objects.** The difference between a fine-tuned model and its base, a *task vector*, can be added to other models, subtracted, or merged.
4. **You don't always need gradients.** Evolution strategies fine-tune billion-parameter models from a reward alone, and merging needs no training at all.
5. **Networks can write networks.** Hypernetworks such as Text-to-LoRA and Program-as-Weights turn a text description into weights in one pass: "compile" a task instead of training for it.

<details class="hv-more" markdown="1">
<summary>Read more: why this matters for small language models</summary>

Small language models (roughly 0.5 to 8 billion weights) are cheap enough to run on a laptop or phone, but out of the box they are generalists and fairly weak ones. The usual fix is to fine-tune them, which needs labeled data, GPUs and an ML engineer. The research I group here under **weight space** asks a different question: if a model is just a point in a very large space, what are the cheapest ways to move it to a better point?

The answers so far: move it only along a few directions (LoRA), reuse moves other people already made (task arithmetic and merging), search for good moves using only a score (evolution strategies), or train a network once that outputs good moves on demand (hypernetworks). Academically, the last group belongs to **weight space learning**, which a March 2026 survey by Han et al. splits into three parts: *understanding* weight space (its geometry and symmetries), *representing* it (embeddings of whole models), and *generating* it (hypernetworks and generative models that output weights).

"Weight programming" is not one standard term. The closest established use is Schmidhuber's **fast weight programmers**, networks that write the weights of other networks while they run, covered [near the end](#fast-weights). I use it loosely for the whole family: changing what a model does by writing its weights rather than its prompt.

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

## What are the ways to program a model's weights?

<figure class="hv" data-hv="moves">
<div class="hv-canvas"><p class="hv-fallback">Figure, six panels. 1. Train: follow the gradient downhill in many small steps (fine-tuning, RL). 2. Adapt in a subspace: move only along a few low-rank directions (LoRA). 3. Combine: add, subtract or average finished models (task arithmetic, TIES, model soups). 4. Search: try random nudges and keep what scores well, with no gradients (evolution strategies). 5. Generate: a network writes the weights from a description (Text-to-LoRA, Drag-and-Drop LLMs). 6. Edit: change a few weights to rewrite one fact or behavior (ROME, MEMIT).</p></div>
<figcaption><strong>Six ways to move a model.</strong> Illustrative diagram; each one gets its own section below.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: the six families compared</summary>

| Family | What moves the weights | Needs | Typical output |
|---|---|---|---|
| Full fine-tuning | gradient descent on all weights | labeled data, backprop | a new full model |
| LoRA | gradient descent on a low-rank update | labeled data, backprop | an adapter of ~0.1-1% of the weights |
| Merging | arithmetic on finished models | fine-tuned models from one base | one model with several skills |
| Evolution strategies | random perturbations weighted by reward | a reward function, many forward passes | a new full model |
| Hypernetworks | a trained network outputs weights | a trained generator, a task description | an adapter, in one forward pass |
| Model editing | a closed-form or targeted update | the fact or behavior to change | the same model with one change |

Model editing gets the least space here. Methods such as ROME (Meng et al., 2022) locate the middle-layer MLP weights where a model stores a fact like "the Eiffel Tower is in Paris" and apply a rank-one update to change it; MEMIT extends this to thousands of facts at once. It is weight programming in the most literal sense, but aimed at single facts rather than skills.

</details>

## How does LoRA change so few weights?

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

## How does task arithmetic add and subtract skills?

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

### Why does plain averaging fail, and how does TIES-merging fix it?

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

## Can you optimize a language model's weights without gradients?

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

## Can a model write another model's weights?

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

### Program-as-Weights: compiling a function into a small model

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

## What is a fast weight programmer?
{: #fast-weights}

<figure class="hv" data-hv="fast">
<div class="hv-canvas"><p class="hv-fallback">Figure: a 4 × 4 fast-weight matrix W starts at zero. Writing a key-value pair adds the outer product v·kᵀ to W. With 4 orthogonal keys, reading W·k returns each stored value exactly. Writing a 5th key that overlaps key 1 and key 2 (cosine 0.71 with each) makes reading key 1 return the stored value plus 0.71 times the 5th value, an error of 2.12: a 4 × 4 matrix holds only 4 clean memories.</p></div>
<figcaption><strong>Attention as weight writing: each token adds an outer product to a weight matrix.</strong> Click to write pairs and read them back; computed live.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: linear transformers as fast weight programmers</summary>

The term **fast weight programmer** comes from Jürgen Schmidhuber's work in the early 1990s: one network (the programmer) produces, at every step, changes to the weights of another network, its **fast weights**, which act as short-term memory. Slow weights are learned by training; fast weights are rewritten on the fly.

Schlag, Irie and Schmidhuber (*Linear Transformers Are Secretly Fast Weight Programmers*, ICML 2021) showed that linearized self-attention is exactly this. For each token, the model computes a key $k_t$, value $v_t$ and query $q_t$, and

$$
W_t = W_{t-1} + v_t k_t^{\top}, \qquad y_t = W_t \, q_t
$$

Each token *writes* an outer product into a matrix, and each query *reads* from it. No gradient, no training loop: the slow weights learned to program the fast ones. The figure does exactly this with 4-dimensional keys.

The matrix has limited capacity. With $d$-dimensional keys, at most $d$ keys can be orthogonal, so storing more pairs makes them interfere, as the 5th key in the figure shows. The paper's fix is the **delta rule**: before writing, subtract what the matrix already returns for that key, $W_t = W_{t-1} + \beta_t (v_t - W_{t-1} k_t) k_t^{\top}$, so the write corrects instead of piling up. Several recent efficient sequence models, such as DeltaNet and test-time-training layers, build on this "weights as memory written at inference time" idea.

</details>

## Which weight-space method should you use?

<figure class="hv" data-hv="choose">
<div class="hv-canvas"><p class="hv-fallback">Figure, six cards. Full fine-tuning: needs labeled data and backprop, high cost, gives a new full model. LoRA: needs labeled data and backprop, low cost, gives a small adapter file. Merging (task arithmetic, TIES): needs fine-tuned models from one base, no backprop, very low cost, gives one model with several skills. Evolution strategies: needs a reward, no backprop, high cost from many forward passes, gives a new full model. Hypernetwork (Text-to-LoRA, DnD): needs a trained generator and a description, no backprop at use time, one forward pass, gives an adapter. Model editing (ROME, MEMIT): needs the fact to change, some backprop, very low cost, gives the same model with one fact changed.</p></div>
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

Open problems the research keeps returning to:

- **Interference.** Every merged skill costs a little of the others; merging many task vectors still degrades each one.
- **Symmetry.** Weight space is full of equivalent copies of the same model, which makes it hard to compare or generate weights across models trained separately.
- **Generalization of generators.** Hypernetworks interpolate well between tasks they've seen and less well beyond them.
- **Safety.** If you can add a skill by adding a vector, you can also remove a safety behavior by subtracting one. Task negation was first shown as a way to *reduce* toxicity; the same arithmetic works in the other direction, which is one reason open-weight releases are hard to lock down. Watermarks that live in the output distribution, like the one in my [textGrain post](/blog_posts/textgrain-watermark-explained.html), face a similar weakness once weights are open.

</details>

## Sources

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
- Qwen team, [Qwen2.5-0.5B-Instruct `config.json`](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct/blob/main/config.json), used for all weight counts.

<script defer src="/blog_posts/experiments/weight-space/ws-post.js"></script>
