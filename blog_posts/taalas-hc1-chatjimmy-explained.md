---
title: "Taalas HC1: How ChatJimmy Hardwires an LLM Into Silicon"
description: "ChatJimmy runs Llama 3.1 8B on Taalas HC1, a chip with the model's weights built into the silicon. Why that reaches ~15,600 tokens/s, and the trade-offs."
date: 2026-10-31
last_modified_at: 2026-10-31
keywords: [Taalas HC1, ChatJimmy, chatjimmy.ai, LLM weights in silicon, hardwired LLM chip, LLM inference memory bandwidth, mask ROM AI chip, Llama 3.1 8B tokens per second]
categories: hardware llm inference
math: true
related: ["/blog_posts/textgrain-watermark-explained.html", "/blog_posts/hnsw-explained.html"]
faq:
  - q: "What model does ChatJimmy use?"
    a: "ChatJimmy (chatjimmy.ai) runs Meta's Llama 3.1 8B. Its own model list returns a single model, llama3.1-8B, owned by Taalas Inc., and the backend reports hardware named talos003_llama3. Taalas says the weights are quantized to a mix of 3-bit and 6-bit values, so answers are somewhat worse than the same model on a GPU. This was the only model offered as of October 2026."
  - q: "How is Taalas HC1 different from Groq or Cerebras?"
    a: "Groq and Cerebras also avoid slow off-chip memory, but they keep weights in on-chip SRAM that is loaded at run time, so the same hardware can run many models. Taalas HC1 builds one model's weights into the chip's mask layers when it is manufactured. That saves area and power and gives more speed per user, but the chip can only ever run that one model."
  - q: "Can you update the model on a Taalas chip?"
    a: "Not the base weights. They are fixed when the chip is made, so a new model means new chips. Taalas says only two metal mask layers change between models and that turning a new model into PCIe cards takes about two months. What can change at run time is the context window size and small fine-tunes loaded as LoRA adapters, plus normal sampling settings."
  - q: "Why is LLM token generation limited by memory bandwidth?"
    a: "To generate each token for one user, the chip has to read every weight of the model once. Llama 3.1 8B in 16-bit has about 16 GB of weights, so an NVIDIA H200 with 4.8 TB/s of memory bandwidth tops out near 300 tokens per second for a single user, however fast its math units are. GPUs win back total throughput by batching many users together."
  - q: "Can hardwired chips run large models like DeepSeek or GPT-class models?"
    a: "Not on one chip. HC1 holds about 8 billion parameters. Taalas says its second-generation HC2 platform is denser and plans a frontier-class model split across several cards; The Next Platform estimated about 35 cards for a 671-billion-parameter model like DeepSeek R1. That is a journalist's estimate, not a Taalas figure."
---

# Taalas HC1: How ChatJimmy Hardwires an LLM Into Silicon

> **In short:** ChatJimmy (chatjimmy.ai) is the public demo of Taalas HC1, a chip with Llama 3.1 8B's weights built into the silicon instead of loaded from memory. With nothing to fetch, it wrote about 15,600 tokens per second in my tests, 50 times an H200's 16-bit limit. The price: one model per chip, 3-6-bit weights, a 6,144-token context.

<link rel="stylesheet" href="/blog_posts/experiments/taalas-hc1-chatjimmy-explained/taalas-post.css">

Type a question into [chatjimmy.ai](https://chatjimmy.ai/) and the whole answer appears at once, as if it was pasted. Every section below starts with a picture or a small calculator; the full explanation is under **Read more**. The numbers marked *measured* are from my own requests to the demo on 31 October 2026.

## What is ChatJimmy, and how fast is it?

<figure class="hv" data-hv="tiles">
<div class="hv-canvas"><p class="hv-fallback">Figure, measured on chatjimmy.ai: about 15,600 tokens per second while generating; first token after about 1.2 ms of chip time; a 1,227-token answer took 80 ms on the chip; 64 microseconds per token, about 2 microseconds for each of the model's 32 layers; prompts are capped at 6,144 tokens of context.</p></div>
<figcaption><strong>A 1,200-token answer in 80 milliseconds.</strong> Measured from the timing stats the demo returns with every reply (12 requests, 31 Oct 2026).</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: what the demo is and how I measured it</summary>

ChatJimmy is a free chat interface run by **Taalas**, a Toronto chip startup. Taalas unveiled it on [19 February 2026](https://taalas.com/the-path-to-ubiquitous-ai/) together with its first chip, **HC1**, which Taalas describes as "a hard-wired Llama 3.1 8B". The demo's own `/api/models` endpoint lists exactly one model, `llama3.1-8B`, "owned by Taalas Inc.", and its health endpoint names the backend hardware `talos003_llama3`.

Taalas claims **17,000 tokens per second per user** ([product page](https://taalas.com/products/)), measured by its own lab with 1k-token inputs and outputs. Each ChatJimmy reply ends with a stats block (prefill and decode token counts and rates, time to first token, chip compute time), so I sent it 12 prompts of different lengths and read those stats:

- **Decode (writing):** 15,200-16,300 tokens/s on every answer longer than 20 tokens; about **15,600 tokens/s** on long answers.
- **Prefill (reading the prompt):** 16,400-20,700 tokens/s on short prompts, about 26,000 tokens/s on 2,000-5,800-token prompts.
- **Time to first token:** 0.8-1.3 ms of chip time for short prompts, 75 ms for a 2,018-token prompt.
- **Context limit:** a 6,015-token prompt stopped with the message `max context limit 6144 reached`; longer prompts returned an empty reply.

At 15,600 tokens/s each token takes 1 / 15,600 s ≈ **64 µs**. Llama 3.1 8B has 32 transformer layers, so that is about **2 µs per layer** per token.

Two caveats. These are the chip's own reported timings, not independent hardware measurements. And they're per user: I didn't load-test the demo, and the queue was empty when I checked.

</details>

## Why are LLMs slow on GPUs? The memory wall

<figure class="hv" data-hv="wall">
<div class="hv-canvas"><p class="hv-fallback">Figure, speed limit for one user on Llama 3.1 8B (8.03 billion weights) from memory bandwidth alone. At 16-bit weights: H100 (3.35 TB/s) at most 209 tokens/s, H200 (4.8 TB/s) 299 tokens/s, B200 (8 TB/s) 498 tokens/s. HC1 measured 15,600 tokens/s. A slider changes the weight precision: at 4-bit, B200's limit is 1,993 tokens/s.</p></div>
<figcaption><strong>Each new token reads every weight once, so memory bandwidth sets the speed limit.</strong> Upper bounds for one user (bandwidth ÷ model size), ignoring the KV cache and compute; the HC1 bar is measured.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: why token generation is memory-bound</summary>

An LLM writes text one token at a time. To produce each token, it multiplies the current activations by **every weight matrix in the model**, in order. For one user, each weight is used for exactly one multiply-add per token, so the work is limited by how fast the weights can be read, not by how fast the chip can multiply. This is the **memory wall**.

The arithmetic is simple. Llama 3.1 8B has 8.03 billion parameters ([model card](https://huggingface.co/meta-llama/Llama-3.1-8B)). At 16 bits (2 bytes) each, that is 16.06 GB to read per token:

$$
\text{max tokens/s per user} \approx \frac{\text{memory bandwidth}}{\text{parameters} \times \text{bytes per parameter}}
$$

| GPU | Memory bandwidth | Limit at 16-bit | Limit at 4-bit |
|---|---|---|---|
| NVIDIA H100 SXM | 3.35 TB/s | 209 tokens/s | 834 tokens/s |
| NVIDIA [H200](https://www.nvidia.com/en-us/data-center/h200/) | 4.8 TB/s | 299 tokens/s | 1,196 tokens/s |
| NVIDIA [B200](https://www.nvidia.com/en-us/data-center/dgx-b200/) | 8 TB/s | 498 tokens/s | 1,993 tokens/s |
| Taalas HC1 (measured) | weights are not read from memory | 15,600 tokens/s | |

These are ceilings. Real systems also read the KV cache and lose time to kernel launches, so they land below them.

Turned around: to reach 15,600 tokens/s by *reading* 3-bit weights, a chip would need about **47 TB/s** of bandwidth (8.03 billion × 3/8 byte × 15,600), six times a B200. HC1 doesn't read its weights at all.

GPUs aren't badly designed for this. They get their efficiency back by **batching**: one read of the weights serves dozens or hundreds of users at once, so total tokens per second across all users is far higher than these numbers. What batching can't fix is the speed for *one* user, which is what you feel in a chat window and what matters for agents that wait on each step.

</details>

## How do you put LLM weights into hardware?

<figure class="hv" data-hv="arch">
<div class="hv-canvas"><p class="hv-fallback">Figure, two panels. GPU: the 16 GB of weights sit in HBM memory stacks beside the compute die, and for every token all 8 billion weights cross the memory bus to the compute cores. Taalas HC1: the weights are part of the circuit, laid out as tiles of fixed multiply-add units, layer after layer; only the activations (4,096 numbers between layers) move through the chip.</p></div>
<figcaption><strong>A GPU moves the model to the math; HC1 is the model.</strong> Simplified diagram; Taalas hasn't published its floor plan.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: storage and compute on the same chip</summary>

In a GPU, weights live in **HBM** (high-bandwidth memory), DRAM stacks packaged beside the compute die. DRAM is dense and cheap per bit but needs its own manufacturing process, so it can't share a die with logic. For every token, all the weights travel from DRAM to the compute cores again. Taalas's founder Ljubisa Bajic calls this split "an artificial divide" between memory and compute, and says it's why inference hardware needs HBM stacks, advanced packaging, huge I/O bandwidth and liquid cooling ([Taalas, Feb 2026](https://taalas.com/the-path-to-ubiquitous-ai/)).

HC1 removes the split by making the weights part of the circuit. According to Taalas's VP of products, quoted by [The Next Platform](https://www.nextplatform.com/compute/2026/02/19/taalas-etches-ai-models-onto-transistors-to-rocket-boost-inference/4092140), the weights are stored in a **mask ROM** "recall fabric" next to the multiply logic, and a separate **SRAM** holds the KV cache (the attention memory of the conversation so far) and the fine-tuning adapters. Taalas calls the result a **Hardcore Model**.

Once the weights don't move, what does move is small. Between two layers of Llama 3.1 8B, one token is a vector of 4,096 numbers, about 8 KB at 16-bit, against 16 GB of weights. So the chip doesn't need HBM, a wide memory bus or high-speed I/O, and Taalas says HC1 needs none of them. Bajic told The Next Platform that a card draws about **200 W**; Taalas's server holds ten cards in about **2.5 kW**.

Taalas has not published how the tiles are arranged. The diagram above shows the idea, not the floor plan.

</details>

### What does "hardwired" mean at the transistor level?

<figure class="hv" data-hv="constmul">
<div class="hv-canvas"><p class="hv-fallback">Figure, illustrative: multiplying an 8-bit input x by a 3-bit weight w. A general multiplier needs 24 AND gates and 2 adders whatever w is. If w is fixed, say w = 5 (binary 101), the circuit is just x plus x shifted left by two: one adder and no AND gates. w = 4 is pure wiring, x shifted by two, with zero gates. Buttons pick w from 0 to 7.</p></div>
<figcaption><strong>When a weight is a constant, most of the multiplier disappears.</strong> A textbook constant multiplier, to show the principle; Taalas's actual cell is not public.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: constant multipliers and mask ROM</summary>

A general binary multiplier computes x × w for *any* w: one row of AND gates per bit of w (does this bit add a shifted copy of x?), then adders to sum the rows. For an 8-bit x and a 3-bit w that's 24 AND gates and 2 adders, sitting there for every weight.

If w is known when the chip is designed, the AND gates go away: a 0 bit drops its row, a 1 bit becomes a plain wire carrying x shifted left. w = 4 is just wiring, w = 5 is one adder (x·4 + x), and w = 7 is two adders. This is the classic **constant-coefficient multiplier** trick from digital signal processing, and it shows why fixing the weights saves so much: the "memory" and the "multiply" collapse into one small piece of circuit.

Taalas hasn't published its circuit, and it is more clever than this textbook version. Bajic told The Next Platform the chip can "store four bits away and do the multiply related to it" with **a single transistor**. The weights are written into the chip's **mask ROM**, read-only memory whose contents are set by the patterns on the photomasks used to manufacture it. That's the same idea as the ROM in old game cartridges: the data is part of the physical wiring.

</details>

## How can one chip design run a different model?

<figure class="hv" data-hv="layers">
<div class="hv-canvas"><p class="hv-fallback">Figure, illustrative chip cross-section: a transistor layer and a stack of metal wiring layers are the same for every model; only the top two metal layers, whose via pattern encodes the weights, are made per model. Buttons switch between Model A and Model B; only the top two layers change. Turning a new model into PCIe cards takes about two months, according to Taalas.</p></div>
<figcaption><strong>Change two masks, get a new model.</strong> Illustrative cross-section; the two-layer respin and two-month turnaround are Taalas's figures.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: the two-month respin</summary>

A chip is built bottom-up: transistors first, then many layers of metal wiring connected by vias, each patterned through its own photomask. Masks are a large part of the cost and time of a new chip.

Taalas keeps almost all of those layers the same for every model. According to The Next Platform, switching HC1 to a different model means changing **two metal layers**, and with TSMC's workflow the weights become deployable PCIe cards in **about two months**. Taalas's own launch post gives the same figure: a model it has never seen "can be realized in hardware in only two months".

The rest of the chip, the multiply-add structure, the SRAM for the KV cache and the control logic, stays the same, which is why Taalas talks about a *platform* (HC1, then HC2) carrying different models rather than a new chip design per model.

</details>

## How do 8 billion weights fit on one chip?

<figure class="hv" data-hv="budget">
<div class="hv-canvas"><p class="hv-fallback">Figure: HC1 has 53 billion transistors for 8.03 billion weights, about 6.6 transistors per weight including everything else on the chip. Storing the same weights in ordinary SRAM at 3 bits each, at 6 transistors per bit, would need about 144.5 billion transistors, 2.7 times the whole chip.</p></div>
<figcaption><strong>Ordinary on-chip memory could not hold the model.</strong> Arithmetic from Taalas's published specs (TSMC 6 nm, 815 mm², 53 billion transistors).</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: the transistor budget and quantization</summary>

HC1 is made on TSMC's 6 nm process, measures **815 mm²** (close to the largest die a lithography machine can expose) and has **53 billion transistors** ([Taalas](https://taalas.com/products/)). For 8.03 billion weights, that is about **6.6 transistors per weight**, and that budget also has to cover the SRAM, the multiply-add logic and everything else.

The usual on-chip memory, SRAM, needs six transistors per *bit*. Even at 3 bits per weight, that's 18 transistors per weight and about 144.5 billion transistors in total, 2.7 times the entire HC1. That's why mask ROM plus fused multiply logic is the trick that makes the whole idea work.

It also explains the aggressive **quantization**. Taalas says HC1 uses a custom 3-bit base data type, and its Llama mixes **3-bit and 6-bit parameters**, which "introduces some quality degradations relative to GPU benchmarks". Its second-generation platform, HC2, moves to standard 4-bit floating-point formats to fix that ([Taalas, Feb 2026](https://taalas.com/the-path-to-ubiquitous-ai/)).

</details>

## Why is ChatJimmy's context only 6,144 tokens?

<figure class="hv" data-hv="kv">
<div class="hv-canvas"><p class="hv-fallback">Figure, KV cache calculator for Llama 3.1 8B: 128 KiB per token at 16-bit (32 layers × 8 KV heads × 128 dimensions × keys and values). ChatJimmy's 6,144-token limit needs 768 MiB at 16-bit or 384 MiB at 8-bit; the model's native 131,072-token context would need 16 GiB at 16-bit. A slider changes the context length.</p></div>
<figcaption><strong>The weights are frozen, but the conversation's memory still has to fit on the chip.</strong> Computed from Llama 3.1 8B's architecture; Taalas hasn't said what precision its KV cache uses.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: the KV cache and its formula</summary>

While generating, a transformer keeps the **keys and values** of every earlier token for every layer, the **KV cache**, so that attention doesn't recompute them. Unlike the weights, the KV cache changes with every conversation, so it can't be in ROM. On HC1 it lives in on-chip SRAM.

Llama 3.1 8B uses grouped-query attention with 32 layers, 8 key-value heads and 128 dimensions per head ([Llama 3 paper](https://arxiv.org/abs/2407.21783), Table 3). Per token:

$$
2 \times 32 \times 8 \times 128 = 65{,}536 \text{ values} = 128 \text{ KiB at 16-bit}
$$

| Context | KV cache at 16-bit | at 8-bit |
|---|---|---|
| 6,144 tokens (ChatJimmy's limit) | 768 MiB | 384 MiB |
| 32,768 tokens | 4 GiB | 2 GiB |
| 131,072 tokens (Llama 3.1's native limit) | 16 GiB | 8 GiB |

A GPU keeps this in its 80-141 GB of HBM. A chip whose memory is on-die SRAM has far less room, which fits ChatJimmy's measured 6,144-token cap. Taalas calls the context window size "configurable", so other deployments may set it differently. I don't know what precision HC1 uses for the cache, so the table shows both.

</details>

## How fast is it in practice? My measurements

<figure class="hv" data-hv="bench">
<div class="hv-canvas"><p class="hv-fallback">Figure, measured: 12 requests to chatjimmy.ai. Time on the chip versus total round trip from my client. Examples: a 1,227-token guide took 80.3 ms on the chip and 324 ms round trip; a 1,197-token essay 78.5 ms versus 397 ms; a 3-token greeting 1.5 ms versus 505 ms. The chip time is a small slice of the wait; the network and web stack are the rest.</p></div>
<figcaption><strong>The chip is no longer the slow part; the network is.</strong> Measured on 31 Oct 2026 from a cloud machine, one new HTTPS connection per request; hover a bar for the numbers.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: the full measurements</summary>

I sent 12 prompts one after another to ChatJimmy's chat endpoint with default settings (top-k 8) and recorded the stats each reply returns, plus the wall-clock time my client waited.

| Prompt | Prompt tokens | Answer tokens | Decode rate | Chip time | Round trip |
|---|---|---|---|---|---|
| Say hello in one sentence | 16 | 3 | 23,345/s | 1.5 ms | 505 ms |
| List 10 prime numbers | 16 | 57 | 15,967/s | 4.9 ms | 239 ms |
| Haiku about silicon | 17 | 26 | 16,267/s | 2.6 ms | 257 ms |
| Explain a hash table (150 words) | 23 | 227 | 15,704/s | 16.0 ms | 250 ms |
| How a transformer generates text (300 words) | 24 | 432 | 15,670/s | 29.2 ms | 296 ms |
| 500-word short story | 23 | 762 | 15,646/s | 50.3 ms | 292 ms |
| 800-word essay on the transistor | 24 | 1,197 | 15,564/s | 78.5 ms | 397 ms |
| Quicksort in Python, explained | 22 | 640 | 15,650/s | 42.2 ms | 269 ms |
| Summarize a 2,000-token text | 2,018 | 85 | 15,203/s | 81.0 ms | 364 ms |
| Count from 1 to 200 | 22 | 614 | 15,468/s | 41.2 ms | 270 ms |
| 1,000-word guide to learning Korean | 21 | 1,227 | 15,559/s | 80.3 ms | 324 ms |
| 17 × 23, briefly | 21 | 8 | 18,725/s | 1.9 ms | 264 ms |

"Chip time" is the demo's `total_time` (prefill plus decode); "round trip" is what my client saw, including a fresh HTTPS connection each time. Very short answers show inflated decode rates because a few tokens are too few to average over.

Speed doesn't make an 8B model smarter. In one answer about how transformers generate text, it described Llama-style models as "encoder-decoder", which is wrong: Llama is a decoder-only transformer. Taalas itself calls the debut model "clearly not on the leading edge"; the demo is about what *instant* inference makes possible, like agents that take hundreds of model steps per second.

</details>

## What are the trade-offs of a hardwired LLM?

<figure class="hv" data-hv="tradeoffs">
<div class="hv-canvas"><p class="hv-fallback">Figure, two panels. Fixed when the chip is made: the model's weights, its architecture (Llama 3.1 8B), and the quantization (3-bit and 6-bit). Changeable at run time: context window size, LoRA fine-tuning adapters, sampling settings such as top-k, and the system prompt. A new model takes about two months to turn into cards.</p></div>
<figcaption><strong>Speed bought with flexibility.</strong> What Taalas says is fixed and what is configurable on HC1.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: pros and cons compared with GPUs</summary>

| | GPU (H200, B200) | Taalas HC1 |
|---|---|---|
| Models it can run | Any model that fits in memory | One, chosen at manufacture |
| Speed per user (Llama 3.1 8B) | Hundreds to low thousands of tokens/s | ~15,600 tokens/s measured, 17,000 claimed |
| Weight precision | 16, 8 or 4 bits, your choice | Mixed 3-bit and 6-bit, fixed |
| Context length | Up to the model's 128K | 6,144 tokens on the demo |
| Fine-tuning | Anything | LoRA adapters only |
| New model | Download and load in minutes | New chips, about two months |
| Exotic parts | HBM, advanced packaging, often liquid cooling | None, per Taalas; ~200 W per card |

Taalas claims HC1 is "nearly 10X faster than the current state of the art, while costing 20X less to build, and consuming 10X less power". The speed part matches what I measured; the cost and power ratios are Taalas's own and I couldn't check them.

The big risk is obsolescence. Models improve every few months, and a hardwired chip can't follow. Taalas's bet is that the two-month turnaround is short enough, and that for many jobs, such as a coding assistant, a voice agent or a classifier inside a product, a good-enough model that runs instantly and cheaply beats a better one that's slow. For a visual intuition on a different speed-for-precision trade, my [HNSW post](/blog_posts/hnsw-explained.html) shows how vector search gives up exactness to answer in a fraction of a millisecond.

</details>

## What comes next for Taalas?

<figure class="hv" data-hv="timeline">
<div class="hv-canvas"><p class="hv-fallback">Figure, timeline: August 2023, Taalas founded in Toronto. 19 February 2026, HC1 and the ChatJimmy demo unveiled. Spring 2026, a mid-sized reasoning model on HC1 planned. 6 August 2026, AMD agrees to acquire Taalas. Winter 2026, a frontier-class model on second-generation HC2 silicon planned. As of October 2026, ChatJimmy still serves only Llama 3.1 8B.</p></div>
<figcaption><strong>From one 8B model to frontier models on many cards.</strong> Dates from Taalas and AMD announcements; planned items are Taalas's plans, not shipped products.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: HC2, bigger models and the AMD deal</summary>

In its launch post, Taalas said a second model, a mid-sized reasoning LLM, would run on HC1 from spring 2026, and that a **frontier LLM** would follow on its second-generation **HC2** platform, with "considerably higher density and even faster execution", planned for winter. When I checked on 31 October 2026, ChatJimmy's model list still had only `llama3.1-8B`.

Big models need many chips. HC1 holds about 8 billion parameters; The Next Platform reported a planned next step of about 20 billion per chip, and estimated (its own guess, not Taalas's) that a 671-billion-parameter model like DeepSeek R1 would take around 35 cards. Because each token passes through the chips in a pipeline without batching, cards can be linked over ordinary PCIe.

On **6 August 2026**, [AMD announced](https://ir.amd.com/news-events/press-releases/detail/1296/amd-acquires-taalas-to-advance-compute-solutions-for-rapidly) a definitive agreement to acquire Taalas, subject to regulatory approval; terms weren't disclosed. Bajic described Taalas's approach in the announcement as "building the hardware around the model".

If you're interested in how LLM outputs can be traced after they're generated, rather than how they're computed, see my post on [OpenAI's textGrain watermark](/blog_posts/textgrain-watermark-explained.html).

</details>

## Sources

- Ljubisa Bajic, [*The path to ubiquitous AI*](https://taalas.com/the-path-to-ubiquitous-ai/), Taalas, 19 February 2026 (HC1 launch: 17K tokens/s claim, 3-bit/6-bit quantization, LoRA and context, HC2 plans).
- [Taalas products page](https://taalas.com/products/): HC1 specs (TSMC 6 nm, 815 mm², 53B transistors, 2.5 kW server).
- Timothy Prickett Morgan, [*Taalas Etches AI Models Onto Transistors To Rocket Boost Inference*](https://www.nextplatform.com/compute/2026/02/19/taalas-etches-ai-models-onto-transistors-to-rocket-boost-inference/4092140), The Next Platform, 19 February 2026 (mask ROM and SRAM, two-layer respin, 200 W per card, roadmap).
- AMD, [*AMD Acquires Taalas to Advance Compute Solutions for Rapidly Growing AI Inference Market*](https://ir.amd.com/news-events/press-releases/detail/1296/amd-acquires-taalas-to-advance-compute-solutions-for-rapidly), 6 August 2026.
- Meta, [Llama 3.1 8B model card](https://huggingface.co/meta-llama/Llama-3.1-8B) and [*The Llama 3 Herd of Models*](https://arxiv.org/abs/2407.21783) (8.03B parameters, 32 layers, 8 KV heads, 131,072-token context).
- NVIDIA, [H200](https://www.nvidia.com/en-us/data-center/h200/) (4.8 TB/s) and [DGX B200](https://www.nvidia.com/en-us/data-center/dgx-b200/) (8 TB/s per GPU) specifications.
- My own measurements of [chatjimmy.ai](https://chatjimmy.ai/), 31 October 2026 (12 requests, timing stats returned by the demo).

<script defer src="/blog_posts/experiments/taalas-hc1-chatjimmy-explained/taalas-post.js"></script>
