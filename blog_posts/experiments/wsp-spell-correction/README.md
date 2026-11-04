# Weight-space programming for e-commerce spell correction: an experiment

**Question.** Can I take a small open-weight model and improve it at correcting misspelled
1-5 word shop search queries (`"nkie runing shoes"` → `"nike running shoes"`) by editing its
weights directly, by reasoning, with **no gradient descent**? That is the idea behind
[weight-space programming](https://jaskamalkainth.github.io/blog_posts/weight-space-programming-explained.html), from Takehi et al.'s
*Sparks of Weight-Space Programming* (MIT CSAIL, November 2026).

**Short answer: barely.** The best weight-space edit took the model from **19.0% to 21.0%** exact match
on held-out test queries. That is within noise: ±4.5 points is roughly the 95% margin at 300 queries.
It worked as designed, cutting dropped words by about a third and over-correction of already-correct
queries from 60% to 44%. But it could not teach the model spelling it didn't have. On the same budget
of compute, a gradient-based LoRA fine-tune reached **53.3%**, and plain edit distance against the
shop's vocabulary reached **99.3%**. This matches the original post's own limit: weight-space
programming *removes obstacles*; it doesn't *add skills*.

Everything here ran on a 4-core CPU with no GPU. The "LLM doing the programming" was Claude (in a
Claude Code session), reading activations and attention patterns and writing the edits below.

## Setup

| | |
|---|---|
| Model | [`Qwen/Qwen2.5-0.5B-Instruct`](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct), 494,032,768 weights, float32, greedy decoding |
| Prompt | System: *"You are a spell checker for an online shop's search box. Fix any misspelled words in the user's search query. Reply with only the corrected query, nothing else."* User: the raw query. |
| Data (`data.py`) | Synthetic shop queries of 1-5 words built from brands, colours, materials, attributes, audiences and product nouns. One or two words per query get one Damerau edit (keyboard-neighbour substitution, deletion, insertion or transposition); ~15% of queries are left clean. |
| Dev / test | 200 dev queries (40 per length, 31 clean) and 300 test queries (60 per length, 50 clean). **Dev and test use disjoint product nouns** (e.g. dev has `shoes`, `laptop`; test has `handbag`, `smartwatch`), so nothing tuned on dev has seen a test product. |
| Metric | Exact match after lower-casing and collapsing whitespace. |
| Weight-space budget | 50 batched forward passes (each ≤ 50 sequences) on **dev only**, no gradients. Test is evaluated once, at the end. 45 were used. |

## Results (test set, 300 held-out queries)

| Method | Weights changed | All | 1 word | 2 | 3 | 4 | 5 | Typo queries | Clean queries |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Base model, plain prompt | 0 | **19.0%** | 13.3% | 25.0% | 28.3% | 11.7% | 16.7% | 14.8% | 40.0% |
| Base model, 5-shot prompt | 0 | **35.0%** | 51.7% | 36.7% | 26.7% | 26.7% | 33.3% | 28.8% | 66.0% |
| Weight-space edit (no gradients) | 688,128 (0.14%) | **21.0%** | 15.0% | 30.0% | 23.3% | 16.7% | 20.0% | 14.0% | 56.0% |
| LoRA fine-tune (gradients) | 540,672 trained (0.11%) | **53.3%** | 40.0% | 53.3% | 61.7% | 51.7% | 60.0% | 49.2% | 74.0% |
| Edit distance + catalogue vocabulary | n/a | **99.3%** | 100% | 100% | 100% | 100% | 96.7% | 99.2% | 100% |

What kind of mistakes (test, counts out of 300):

| Method | Correct | Wrong word | Dropped words | Added words | Left typo unchanged |
|---|---:|---:|---:|---:|---:|
| Base model, plain prompt | 57 | 109 | 74 | 53 | 7 |
| Base model, 5-shot prompt | 105 | 109 | 29 | 43 | 14 |
| Weight-space edit | 63 | 121 | 47 | 51 | 18 |
| LoRA fine-tune | 160 | 127 | 3 | 9 | 1 |
| Edit distance + vocabulary | 298 | 2 | 0 | 0 | 0 |

Dev-set numbers are in `summarize.py`'s output (base 18.0%, 5-shot 32.5%, weight-space edit 23.5%,
LoRA 80.0%, edit distance 99.0%). LoRA's dev score is inflated: its training data used the dev
product nouns, though not the exact dev queries.

## The weight-space programming session, step by step

All attempts are kept, including the ones that broke the model (`wsp_run.py` replays them in order
and writes `results/wsp_log.json`).

**0. Diagnose before editing.** The base model's errors (dev): 80 wrong words, 51 dropped words,
29 chatbot-style replies (`"sohes"` → `"search sohes"`, `"blneder"` → `"Please enter your search
query without spelling errors."`), and "corrections" that swap in other words (`"sneakers"` →
`"shoes"`). `diagnose.py` asks whether the right answer is latent: for the 144 dev typo queries it
got wrong, the model gave the correct query a higher log-probability than its own reply only **19%**
of the time, and than an exact echo of the typo only 40%. So most errors are a missing *skill*
(knowing that `"sohes"` is `"shoes"`), not a hidden ability blocked by one faulty part. That
predicted the ceiling before any edit.

**1. Compile the few-shot prompt into weights (failed).** The 5-shot prompt lifts dev accuracy to
32.5%, so I tried to "transmute" it into weights: take the mean difference in the residual stream at
the last prompt token between 5-shot and plain prompts, and write it in as a constant. Qwen2 has no
output biases, but it does have `v_proj` biases. Attention weights sum to 1, so a constant added to
every value vector comes out of attention unchanged, as a fixed vector added to the residual stream
at every position. Solving a least-squares problem over the `v_proj` biases of 6-7 layers wrote the
vector exactly with only 768-896 weights. **Result: 0-14% on dev.** Adding a last-token difference at
*every* position, system prompt included, scrambled the model (`"- 1000m is 2567384975-"`). 8+8+2
passes.

**2. Look for a "chat mode" direction (no edit).** I contrasted last-token states for queries that
got length-changing replies (80) and those that didn't (120). Separation was weak (Cohen's d ≈ 0.5),
and in layers 1-14 the sign flipped on held-out halves. No single direction, so nothing to ablate.
4 passes.

**3. Turn up the copy heads (kept).** A spell checker mostly *copies*. Teacher-forcing the correct
answers, I measured how much attention each of the 336 heads puts on the user's query tokens while
writing the answer. The top 12 (L18.H13, L17.H8, L20.H6, L16.H7, L15.H9, L9.H13, L16.H11, L13.H13,
L11.H2, L18.H4, L7.H7, L15.H13) put 57-70% of their attention there. Each head writes into the
residual stream through its own 896 × 64 block of `o_proj`, so multiplying that block by a gain
scales that head's contribution and nothing else. Sweep on dev: top-6 ×2.0 → 21.0%, **top-12 ×1.5 →
23.5%**, top-12 ×2.0 → 22.0%. 4 + 3 + 12 passes.

**4. Erase chat-opening tokens (failed).** On top of step 3, I projected the read-out directions of
`search`, `check`, `Please`, `listen`, `type`, `What` (the first words of the chatbot replies) out of
the `o_proj` and `down_proj` outputs of layers 18-23. **Dev fell to 19.0%**: the projection is
rank-10 but touches 31.7M weights, and it hurt more than it helped. 4 passes.

**Final edit:** step 3, top-12 copy heads ×1.5: 688,128 weights, 0.14% of the model.
Dev 18.0% → 23.5%; test 19.0% → 21.0%.

### What the edit actually changed
- **Dropped words fell from 74 to 47** on test, and clean queries left untouched rose from 40% to
  56%. Turning up copying did exactly what it was meant to do.
- **But typo queries didn't improve** (14.8% → 14.0%). Copying harder mostly turned "dropped a word"
  into "kept the typo" (7 → 18) or "wrong word" (109 → 121). The model still doesn't know what most
  misspellings should be, and no amount of copying supplies that.

## Why LoRA did much better, and what it still gets wrong
LoRA rank 8 on `q_proj`/`v_proj` (`lora.py`): 1,983 synthetic training queries built from the dev
nouns, 123 steps of batch 16, lr 1e-3, 631 s on 4 CPU threads. Gradients *can* add a skill, and the
format problem disappears completely (dropped + added words: 127 → 12).
Its remaining errors show what it learned: the shop's *training* vocabulary, not spelling in general.
Held-out nouns snap to familiar ones: `"smatrwatch"` → `"mattress"`, `"lipstkick"` → `"laptop"`,
`"hpodie"` → `"phone"`, `"earphones"` → `"headphones"`. That is the 80% (dev nouns) vs 53% (unseen
nouns) gap.

## Takeaways for a real shop search box
1. **For spelling, a 0.5B model's weights don't hold the missing skill**, so weight-space
   programming has little to unlock. It is the wrong tool here. It fits failures caused by one faulty
   component, like the thinking loops in the original Qwen3.5-0.8B result.
2. **If you use a small LLM, fine-tune it on your own catalogue's words.** LoRA generalises to new
   queries over known words, not to unseen words.
3. **The vocabulary is the real asset.** Edit distance against a 105-word catalogue vocabulary got
   99.3%. Production systems (SymSpell, Elasticsearch's suggesters) work this way, and an LLM earns
   its place mainly for phonetic misspellings, word splits/joins and intent rewrites, which this
   benchmark doesn't test.

## Caveats
- Synthetic queries, one model, one prompt, greedy decoding, single run. With 300 test queries,
  differences under ~5 points aren't meaningful.
- The edit-distance baseline is given the full catalogue vocabulary, including test nouns; the
  models are not. It is a reference point, not a fair fight.
- Some "wrong" answers are arguably right (`"tqshirt"` → `"t-shirt"`, where the target is `"tshirt"`).
- The 45-pass budget mirrors the original post's forward-pass budgets, but the editing LLM and
  harness differ, so this is not a replication of their results.

## Reproduce
```sh
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install transformers safetensors accelerate peft
python data.py            # dev.jsonl, test.jsonl (already committed)
python baselines.py       # plain and 5-shot prompts         (~4 min on 4 CPU cores)
python wsp_run.py         # the whole weight-space session    (~8 min)
python lora.py            # gradient baseline                 (~12 min)
python edit_distance.py   # classical baseline                (seconds)
python summarize.py       # tables above
python diagnose.py base   # latent-ability check              (~2 min)
```
Tested with torch 2.15.0 (CPU), transformers 5.22.1 and peft 0.21.2. `results/` holds every prediction.
