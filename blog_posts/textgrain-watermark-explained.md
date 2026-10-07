---
title: "textGrain Explained: How OpenAI Watermarks ChatGPT Text"
description: "textGrain is OpenAI's text watermark: a secret key and optimal transport tilt token choices within an entropy budget β, and a key-only test detects it."
date: 2026-10-07
last_modified_at: 2026-10-07
keywords: [textGrain, OpenAI text watermark, ChatGPT watermark, LLM watermarking, AI text detection, optimal transport watermark, Gumbel watermark]
categories: machine-learning llm watermarking
math: true
related: ["/blog_posts/bloom_filters.html", "/blog_posts/elasticsearchNotes.html"]
faq:
  - q: "Does ChatGPT watermark its text?"
    a: "As of October 2026, OpenAI says it is adding textGrain watermarks to eligible ChatGPT and Codex text output in the European Union, rolled out in phases over the following weeks. API customers worldwide can opt in; it is off by default for them. Outside the EU, ChatGPT text is not covered by this first rollout."
  - q: "Can I check whether a text has a textGrain watermark?"
    a: "Not yourself, as of October 2026. Detection needs OpenAI's secret key, and OpenAI is giving detector access first to approved researchers and expert organizations, case by case. OpenAI has said it plans to release textGrain as open source, which would let others watermark their own models with their own keys, but not detect ChatGPT text without OpenAI's key."
  - q: "Can paraphrasing remove a textGrain watermark?"
    a: "It weakens it a lot. In OpenAI's reported tests on 400-token passages, replacing 10% of words with synonyms dropped detection from about 92% to 66%, and replacing 25% dropped it to 17%. Every edited token loses its evidence, so a thorough rewrite by a person or another model can push the score back to what unwatermarked text produces."
  - q: "Does textGrain make ChatGPT's answers worse?"
    a: "It is designed not to. Averaged over keys, the token distribution is exactly the model's own, so the watermark is unbiased. The cost is randomness: the entropy budget β caps the average share of sampling entropy removed, so β = 0.2 keeps about 80% of it on average. Regenerating an answer still gives different text, unlike Gumbel-max watermarks."
  - q: "How is textGrain different from Google's SynthID Text?"
    a: "Both are keyed, unbiased statistical watermarks that a detector checks with the key. SynthID Text, published in Nature in 2024, uses tournament sampling. textGrain instead solves a small entropy-regularized optimal transport problem over blocks of the vocabulary, which gives one knob, β, with an exact meaning: the average fraction of sampling entropy given up for the signal."
---

# textGrain Explained: How OpenAI's Text Watermark Works

> **In short:** textGrain is the watermark OpenAI announced on 5 October 2026 for ChatGPT and Codex text in the EU. A secret key splits the vocabulary into hidden blocks and nudges which block the next token comes from, using optimal transport within an entropy budget β. A detector with only the text and the key then runs a Gamma test on the scores.

I read OpenAI's [technical report](https://cdn.openai.com/pdf/e9508624-d767-41b6-a26d-e34ca798ada6/textgrain-entropy-calibrated-watermarking-for-language-model-text.pdf) and built a simulator so I could see each step move. This post explains the idea with as little maths as it needs, then gives the formulas for anyone who wants them. Everything in the "how it works" sections comes from the report; numbers on real-world detection are OpenAI's, as reported at launch.

**Try it first:** the [textGrain watermark simulator](/blog_posts/experiments/textgrain-watermark/) lets you change the key and β for one word, then watch a detector separate a watermarked passage from a plain one.

## What is textGrain?

textGrain is a **statistical text watermark**: it leaves no visible mark and no hidden characters. Instead, it slightly changes *which* tokens the model samples, in a pattern only someone with a secret key can check. A token is a word or part of a word.

What OpenAI announced on 5 October 2026 (as reported by [FoneArena](https://www.fonearena.com/blog/494156/openai-textgrain-watermarking-chatgpt-codex-eu.html) and [Unite.AI](https://www.unite.ai/openai-begins-phased-text-watermarking-under-eu-ai-act-rules/), citing OpenAI's post):

- **Where:** eligible ChatGPT and Codex text output in the **European Union**, rolled out in phases over the following weeks.
- **API:** opt-in for API customers worldwide, off by default.
- **Detection:** not public at launch; access first goes to approved researchers and expert organizations.
- **Open source:** OpenAI says it plans to release textGrain as open source.

The report is by Xiang Li and Qi Long (University of Pennsylvania), Garrett Wen and Xiaohong Chen (Yale), and Arzav Jain, Florent Joly, Mike Lam, Qingquan Song and Weijie Su (OpenAI).

## How does an LLM text watermark work?

A language model writes one token at a time by **sampling** from a next-token probability distribution $$P$$. A watermark replaces plain sampling with sampling that also depends on a pseudorandom value derived from a **secret key** and the last few tokens (the **context window**). The detector recomputes those values from the text and the key, and tests whether the tokens line up with them more often than chance.

Two older designs show the trade-off textGrain is trying to fix:

| Watermark | How it biases sampling | Weak spot |
|---|---|---|
| Red/green list ([Kirchenbauer et al., 2023](https://arxiv.org/abs/2301.10226)) | Adds a bonus to the logits of a keyed "green" half of the vocabulary | Biased: changes the model's distribution on every key |
| Gumbel-max ([Aaronson, 2023](https://simons.berkeley.edu/talks/scott-aaronson-ut-austin-openai-2023-08-17)) | Picks the token with the largest log-probability plus a keyed Gumbel value | Unbiased, but deterministic: same key + same context → same token every time |
| **textGrain** (OpenAI, 2026) | Optimal transport tilts keyed *blocks* of tokens, within entropy budget β | Signal is spread thin: needs a few hundred tokens, and edits erase it |

A watermark is **unbiased** if, averaged over random keys, it gives back exactly the model's distribution $$P$$. Gumbel-max is unbiased, but because one key is reused across many answers, asking the same prompt twice can return the same answer word for word. textGrain keeps the unbiasedness and spends only a chosen fraction of the randomness.

## How textGrain watermarks the next token

The report's running example is the prompt *"The morning was ___"* with six candidate words. My simulator uses the same numbers.

| Token | warm | cold | mild | calm | sunny | bright |
|---|---|---|---|---|---|---|
| Model probability $$P$$ | 0.30 | 0.25 | 0.15 | 0.10 | 0.10 | 0.10 |

One generation step has five parts:

1. **Split the vocabulary into secret blocks.** The key and context window assign every token to one of $$B$$ blocks (3 in the example). Without the key the split looks random. Each block gets the summed probability of its tokens, $$\rho_b$$.
2. **Draw a keyed score table.** For each block $$b$$ and each of $$m$$ equally likely **columns** (4 in the example), the key and context generate a standard Gumbel value $$Z_{bj}$$. High scores mark "favoured" block–column pairs.
3. **Solve a small optimal transport problem.** Find a joint table $$\pi(b, j)$$, a **coupling**, whose rows sum to $$\rho_b$$ and whose columns each sum to $$1/m$$, that puts as much mass on high-score cells as the entropy budget allows.
4. **Let the key pick one column $$J$$.** That column, rescaled, becomes the new block probabilities: favoured blocks get more weight.
5. **Sample a block, then a token inside it** using the model's original relative odds within that block.

Because each column is picked with probability $$1/m$$ and the coupling's rows still sum to $$\rho_b$$, averaging over keys gives back exactly $$P$$. Under one fixed key, though, sampling now leans toward the favoured block, and that lean is the watermark.

Working on $$B$$ blocks × $$m$$ columns instead of the whole vocabulary is what keeps it cheap: each Sinkhorn update costs $$O(Bm)$$ operations, independent of a vocabulary that can have 100,000+ tokens.

## What does the entropy budget β control?

β is the fraction of the model's sampling randomness that textGrain may remove, on average. **β = 0** means no watermark; **β = 0.2** keeps about 80% of the entropy on average; larger β gives a stronger signal and less varied text.

The reason β has such a clean meaning is an identity from information theory. Writing the coupling as $$\pi$$ and the independent (unwatermarked) coupling as $$\rho \otimes u_m$$:

$$
D_{\mathrm{KL}}\left(\pi \,\|\, \rho \otimes u_m\right) = I(W; J) = H(P) - \frac{1}{m}\sum_{j=1}^{m} H\big(Q(\cdot \mid j)\big)
$$

The KL penalty in the transport problem equals the mutual information between the token $$W$$ and the keyed column $$J$$, which equals the average entropy lost. So the optimisation is:

$$
\min_{\pi \in \Pi(\rho,\, u_m)} \sum_{b=1}^{B}\sum_{j=1}^{m} \pi(b,j)\, c(b,j) \quad \text{subject to} \quad D_{\mathrm{KL}}\left(\pi \,\|\, \rho \otimes u_m\right) \le \beta\, H(P)
$$

with cost $$c(b,j) = -G_{bj}$$, the negated standardised Gumbel score. OpenAI's solver runs Sinkhorn iterations on the KL-regularised version and adjusts the regularisation strength λ until the achieved loss is close to $$\beta H(P)$$.

For the example, $$H(P) \approx 1.683$$ nats, so β = 0.4 asks to remove about 0.673 nats. Two limits apply. First, the loss can never exceed $$\min\{H(\rho), \log m\}$$: in my simulator with its default key, the blocks are uneven enough that $$H(\rho) \approx 0.52$$ nats, so the achieved loss stops at about 0.51 nats (30% of $$H(P)$$) no matter how high β goes. The same cap is why a low-entropy step, where the model is nearly sure of the next word, carries almost no watermark. Second, the guarantee is an average over columns, not a promise for every single key.

## How is a textGrain watermark detected?

The detector needs the text, the key and the same settings (tokenizer, $$B$$, $$m$$, context-window rule). It does **not** need the model, the prompt or β. For each position it rebuilds the block split, score table and chosen column, looks up the Gumbel value $$Z_t$$ of the block the actual token is in, and transforms it:

$$
Y_t = -\log\left(1 - F_G(Z_t)\right), \qquad F_G(z) = \exp\left(-e^{-z}\right), \qquad S_n = \sum_{t=1}^{n} Y_t
$$

On text that has nothing to do with the key, each $$Y_t$$ is Exponential(1) with mean 1, so $$S_n$$ follows a Gamma(n, 1) distribution. The detector flags a watermark when $$S_n$$ is above that distribution's $$1-\alpha$$ quantile, which sets the false-positive rate to α under the report's independence assumptions. Watermarked text keeps landing on favoured cells, so its $$Y_t$$ average above 1 and $$S_n$$ climbs past the threshold.

One detail matters in practice: a repeated context window would reuse the same score table, so the detector **scores only the first occurrence** of each distinct context window. The report also notes that a fixed deployed key needs empirical calibration checks; the clean Gamma(n, 1) null is the idealised case.

## How accurate is textGrain detection?

These are OpenAI's launch figures as reported in October 2026, at a 1% false-positive rate; I couldn't access OpenAI's original post directly, and the technical report itself has no experiments.

| Test (as reported, Oct 2026) | Detection rate |
|---|---|
| 200-token passages (psychology text) | about 80% |
| 400-token passages (psychology text) | about 95% |
| 400 tokens, baseline in the editing test | about 92% |
| 400 tokens, 10% of words replaced with synonyms | about 66% |
| 400 tokens, 25% of words replaced with synonyms | about 17% |

Mathematics text was reported to be detected at substantially lower rates, which matches the theory: when the model is nearly certain of each token there is little entropy to spend, so each token carries little evidence. Short replies, code and heavily edited text are the hard cases for any statistical watermark.

## What my simulator simplifies

The [simulator](/blog_posts/experiments/textgrain-watermark/) follows the report's maths but shrinks everything so it runs instantly in a browser:

- a 40-word toy vocabulary and a random toy "model" instead of an LLM;
- $$B = 3$$, $$m = 4$$ for the single-word view (like the report's figure) and $$B = 4$$, $$m = 8$$ for whole passages;
- a 2-token context window and a hash-based pseudorandom function;
- a bisection search for λ instead of the report's multiplicative update;
- a 0.1% false-positive threshold from an approximate Gamma quantile (OpenAI's reported numbers use 1%).

I ran the simulator's own code headless to check it behaves like the theory says. These are toy-model numbers, not predictions for ChatGPT:

| Toy setting (200 runs each) | Watermarked passages detected |
|---|---|
| β = 0, 150 tokens | 0% |
| β = 0.1, 50 tokens / 150 tokens | 9.5% / 43.5% |
| β = 0.3, 50 tokens / 150 tokens | 39% / 94% |
| Unwatermarked, 150 tokens (1,000 runs) | 0.1% flagged (the target false-positive rate) |

Things worth trying: set β to 0 and watch the watermarked passage become indistinguishable; shorten the passage to 30 tokens; or type one wrong character into the detector's key and see the evidence vanish. If you like this kind of "probably, with a known error rate" reasoning, my post on [Bloom filters and their false-positive rate](/blog_posts/bloom_filters.html) uses the same mindset for set membership.

## Sources

- Li, Wen, Chen, Long, Jain, Joly, Lam, Song, Su: [*textGrain: Entropy-Calibrated Watermarking for Language Model Text*](https://cdn.openai.com/pdf/e9508624-d767-41b6-a26d-e34ca798ada6/textgrain-entropy-calibrated-watermarking-for-language-model-text.pdf), OpenAI technical report, 5 October 2026.
- [FoneArena: OpenAI textGrain watermarking for ChatGPT and Codex to roll out in EU](https://www.fonearena.com/blog/494156/openai-textgrain-watermarking-chatgpt-codex-eu.html) (rollout scope, detection figures).
- [Unite.AI: OpenAI begins phased text watermarking under EU AI Act rules](https://www.unite.ai/openai-begins-phased-text-watermarking-under-eu-ai-act-rules/) (rollout scope, detection figures).
- Kirchenbauer et al., [*A Watermark for Large Language Models*](https://arxiv.org/abs/2301.10226), ICML 2023.
- Dathathri et al., [*Scalable watermarking for identifying large language model outputs*](https://www.nature.com/articles/s41586-024-08025-4), Nature 2024 (SynthID Text).
- Cuturi, [*Sinkhorn Distances: Lightspeed Computation of Optimal Transport*](https://arxiv.org/abs/1306.0895), NeurIPS 2013.
