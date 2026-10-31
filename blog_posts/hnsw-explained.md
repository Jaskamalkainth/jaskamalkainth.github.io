---
title: "HNSW Explained: How Vector Search Finds Nearest Neighbors Fast"
description: "HNSW is a layered graph index for vector search: sparse top layers for long jumps, a dense bottom layer for precision. How it works, M and ef, with benchmarks."
date: 2026-10-31
last_modified_at: 2026-10-31
keywords: [HNSW, HNSW algorithm, hierarchical navigable small world, approximate nearest neighbor search, vector search, vector database index, HNSW parameters M ef_construction ef_search, hnswlib]
categories: search algorithms vector-search
math: true
related: ["/blog_posts/elasticsearchNotes.html", "/blog_posts/bloom_filters.html", "/blog_posts/monte-carlo-simulation-explained.html", "/blog_posts/taalas-hc1-chatjimmy-explained.html"]
faq:
  - q: "Is HNSW exact or approximate?"
    a: "Approximate. HNSW returns the true nearest neighbors most of the time, but it can miss some, because the search only explores part of the graph. How often it finds them is measured as recall. With sensible settings, recall@10 of 0.95 to 0.99 is normal. Raising ef at query time raises recall at the cost of speed. If you need guaranteed exact results, use a brute-force (flat) index."
  - q: "What is the difference between HNSW and IVF?"
    a: "HNSW is a graph: each vector links to nearby vectors, and a search walks those links. IVF (inverted file) clusters vectors with k-means and, at query time, scans only the few clusters nearest to the query. HNSW is usually faster at high recall and needs no training step, but uses more memory for its links. IVF builds faster, uses less memory and combines well with compression such as product quantization."
  - q: "Does Elasticsearch use HNSW?"
    a: "Yes. Elasticsearch's approximate kNN search on dense_vector fields uses Lucene's HNSW graphs, with m defaulting to 16 and ef_construction to 100. Recent versions compress the vectors by default (int8_hnsw or bbq_hnsw, depending on version and dimensions). From 9.4 the default can be bbq_disk, a cluster-based (IVF-style) index, but HNSW types remain available. At query time, num_candidates plays the role of ef."
  - q: "How much memory does an HNSW index need?"
    a: "Roughly the raw vectors plus the graph links. The vectors cost dimensions times 4 bytes each as float32; the links cost about M times 8 to 10 bytes per vector. For 1 million 768-dimension vectors with M = 16, that is about 3.1 GB of vectors plus about 0.14 GB of links. The vectors dominate, which is why vector databases compress them with int8 or binary quantization."
  - q: "Can you delete vectors from an HNSW index?"
    a: "Not cleanly. Removing a node would break the paths that run through it, so most libraries mark it as deleted instead: it stays in the graph for routing but is filtered out of results. hnswlib can later reuse the slot for a new vector. Lucene-based engines drop deleted vectors when segments merge and rebuild the graph. Heavy deletes slowly hurt recall, so indexes are periodically rebuilt."
---

# HNSW Explained: How Vector Search Finds Nearest Neighbors Fast

> **In short:** HNSW (Hierarchical Navigable Small World) is a graph index for finding the vectors closest to a query without comparing it to every vector. It stacks graph layers: sparse upper layers make long jumps, the bottom layer holds every vector. On 1 million SIFT vectors, it found 97.5% of the true top 10 in 0.23 ms, versus 9 ms for brute force.

<link rel="stylesheet" href="/blog_posts/experiments/hnsw-simul/hnsw-post.css">

Every section starts with a picture or a small simulation; the full explanation sits under **Read more** if you want it. To play with a real HNSW graph straight away, jump to the [interactive demo](#demo).

## What problem does HNSW solve?

<figure class="hv" data-hv="scale">
<div class="hv-canvas"><p class="hv-fallback">Figure: brute force compares a query with all 1,000,000 vectors and takes 9.00 ms. HNSW at ef = 80 compares it with 1,526 vectors (0.15%), finds 97.5% of the true top 10, and takes 0.23 ms, 39 times faster.</p></div>
<figcaption><strong>Same question, a sliver of the work.</strong> Measured on 1 million SIFT vectors, one CPU thread.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: nearest neighbor search and why brute force is slow</summary>

HNSW solves **nearest neighbor search**: given a query vector, find the stored vectors closest to it. Modern search and AI systems turn text, images and audio into **embeddings**, lists of a few hundred numbers where similar meaning means nearby points. "Find documents like this one" becomes "find the closest points to this one".

The obvious method, **brute force**, measures the distance from the query to every stored vector. That is exact but slow: with 1 million vectors of 768 dimensions, one query is about 768 million multiply-adds. It grows linearly, so 100 million vectors is 100 times slower. That's fine for thousands of vectors and too slow for millions behind a search box.

</details>

## What is approximate nearest neighbor (ANN) search?

<figure class="hv" data-hv="recall">
<div class="hv-canvas"><p class="hv-fallback">Figure: of the true 10 nearest neighbors, the index returned 9 and missed 1, so recall@10 = 0.9.</p></div>
<figcaption><strong>ANN trades a few misses for speed.</strong> Recall@10 counts how many of the true top 10 came back.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: recall, and why "approximate" is usually fine</summary>

**Approximate nearest neighbor (ANN)** search gives up a guarantee to gain speed: it returns the true nearest neighbors *most* of the time, after looking at only a small fraction of the data. Its quality is measured by **recall@k**: of the true k nearest neighbors, the share the index actually returned. Recall@10 = 0.95 means 9.5 of the true top 10, on average.

For search and RAG (retrieval-augmented generation, where an LLM answers using retrieved documents), that trade is usually right. Embeddings are already a fuzzy representation of meaning, so the 11th-best match is rarely worse in practice than the 10th. HNSW is the most widely used ANN index today.

</details>

## How does HNSW work? Layers, like roads

<figure class="hv" data-hv="layers">
<div class="hv-canvas"><p class="hv-fallback">Figure: three stacked graph layers. Layer 2 (motorways) has 2 of 25 points, layer 1 (main roads) 7, layer 0 (local streets) all 25. A search starts at the entry point on layer 2, hops greedily toward the query, drops to layer 1, hops again, drops to layer 0 and finishes at the nearest point.</p></div>
<figcaption><strong>Long jumps on top, precise steps at the bottom.</strong> Every point lives on layer 0; a random few also live higher up. The search drops one layer at a time, starting each layer close to the answer. The graph and path are computed with HNSW's own rules.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: the two ideas HNSW combines</summary>

HNSW combines two older ideas, described in the 2016 paper by [Yury Malkov and Dmitry Yashunin](https://arxiv.org/abs/1603.09320).

**1. A navigable small world graph.** Connect every vector to a few of its nearest neighbors. To search, start anywhere and keep moving to whichever neighbor is closer to the query, until no neighbor is closer. This is **greedy search**. In a "small world" graph (like the "six degrees of separation" friendship network) any two points are a few hops apart, so this is fast. But with only short links, a search starting far away needs many small hops, and it can get stuck in a **local minimum**: a node whose neighbors are all farther from the query, although a closer point exists elsewhere.

**2. A hierarchy, like a skip list.** A [skip list](https://en.wikipedia.org/wiki/Skip_list) speeds up a sorted linked list by adding "express lanes": a higher level that holds only some of the elements, then a higher one with even fewer. HNSW does the same with graphs:

- **Layer 0** holds every vector, each linked to its close neighbors.
- **Layer 1** holds a random ~1/M of them, linked over longer distances.
- **Layer 2** holds ~1/M of layer 1, and so on, up to a top layer with one or a few nodes.

Think of driving across a country: motorways (top layers) get you to the right region in a few long hops, main roads get you to the right town, and local streets (layer 0) find the exact house.

</details>

## How does an HNSW search work, step by step?

<figure class="hv" data-hv="greedy">
<div class="hv-canvas"><p class="hv-fallback">Figure: two copies of the same small graph. With ef = 1 (pure greedy) the search moves to the closest neighbor each step and gets stuck at a local minimum. With ef = 4 (beam search) it keeps four candidates open, explores the other branch and reaches the true nearest point.</p></div>
<figcaption><strong>Why ef matters.</strong> Greedy search can get stuck; keeping ef candidates open lets it route around dead ends. That's the bottom-layer step of every HNSW query.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: the search algorithm in five steps</summary>

1. **Start at the entry point**, a fixed node on the top layer.
2. **Greedy walk on the current layer:** look at the current node's neighbors, move to the one closest to the query, repeat until none is closer.
3. **Drop down a layer**, starting from the node you ended on, and walk again. Each layer begins much closer to the answer than the last.
4. **On layer 0, widen the search:** instead of following one path, keep a list of the best **ef** candidates found so far (a "beam"), and expand the closest unexplored one each step. Stop when the closest unexplored candidate is farther than the worst of the ef results.
5. **Return the best k** of those ef results.

Step 4 is what keeps recall high. With ef = 1 the search is purely greedy and can get stuck; with ef = 100 it keeps 100 promising leads open and explores around the local minimum.

</details>

### Try it yourself: the interactive HNSW demo
{: #demo}

Click **🔍 Search Nearest**, then step through with **Next ▶**. Set **efSearch** to 1 and then 10 on the same query to see the beam at work. It also has its [own full-screen page](/blog_posts/experiments/hnsw-simul/).

<div class="hnsw-embed">
<iframe id="hnsw-demo" src="/blog_posts/experiments/hnsw-simul/?embed=1" title="Interactive HNSW demo: build a layered graph and step through a nearest neighbor search" loading="lazy" height="1150"></iframe>
</div>

## How are vectors inserted into HNSW?

<figure class="hv" data-hv="insert">
<div class="hv-canvas"><p class="hv-fallback">Figure, four steps: 1. roll the new vector's level (with M = 16, 93.75% stay on layer 0 only, 5.86% reach layer 1, 0.39% go higher); 2. search down greedily to that level; 3. on each of its layers, find candidates with a beam of width efConstruction and link to the best M (2M on layer 0); 4. prune neighbors that now have too many links.</p></div>
<figcaption><strong>An insert is a search plus some linking.</strong> No training step: you can keep adding vectors to a live index.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: insertion in detail</summary>

Inserting a vector reuses the search:

1. **Pick its top layer at random.** Most vectors live only on layer 0; a few also reach layer 1, fewer reach layer 2.
2. **Search down from the entry point** to that layer, greedily.
3. **On each layer from there down to 0,** run the beam search with width **efConstruction** to find good candidate neighbors, and link the new vector to up to **M** of them (2M on layer 0, as the paper recommends).
4. **Prune** any neighbor that now has too many links, keeping its best ones.

The graph is built incrementally: there is no training step, and you can keep adding vectors to a live index.

</details>

### How big is each layer?

<figure class="hv" data-hv="levels">
<div class="hv-canvas"><p class="hv-fallback">Figure: expected vectors per layer for 1,000,000 vectors with M = 16: 1,000,000 on layer 0, 62,500 on layer 1, 3,906 on layer 2, 244 on layer 3, 15 on layer 4, about 1 on layer 5. The FAISS index I built had 62,403, 3,903, 210, 16 and 1.</p></div>
<figcaption><strong>Each layer keeps about 1/M of the one below.</strong> Drag M: a bigger M means fewer, wider layers. At M = 16 the bars show what the formula predicts next to what FAISS actually built.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: the level formula</summary>

Each vector's top layer is drawn as

$$
\ell = \left\lfloor -\ln(U) \cdot m_L \right\rfloor, \qquad U \sim \text{Uniform}(0, 1), \quad m_L = \frac{1}{\ln M}
$$

which gives an exponentially shrinking chance of reaching each layer:

$$
P(\ell \ge l) = M^{-l}
$$

So each layer keeps about 1/M of the layer below, and the number of layers grows like log<sub>M</sub> N. For **1 million vectors with M = 16**, the expected layer sizes are:

| Layer | Expected vectors | Share |
|---|---:|---:|
| 0 | 1,000,000 | 100% |
| 1 | 62,500 | 6.25% |
| 2 | 3,906 | 0.39% |
| 3 | 244 | 0.024% |
| 4 | 15 | 0.0015% |
| 5 | ~1 | 0.0001% |

When I built that index with FAISS (for the benchmark below), it had 62,403 vectors on layer 1, 3,903 on layer 2, 210 on layer 3, 16 on layer 4 and 1 on layer 5: close to the formula. Because each layer is a few hops wide, the total number of hops grows roughly with log N: the reason HNSW scales to billions of vectors.

</details>

### Why does HNSW choose diverse neighbors?

<figure class="hv" data-hv="heuristic">
<div class="hv-canvas"><p class="hv-fallback">Figure: a new point at the edge of cluster A. Linking to its 3 closest points keeps every link inside cluster A. HNSW's neighbor-selection heuristic skips candidates hidden behind an already-kept neighbor, so one of its links reaches cluster B.</p></div>
<figcaption><strong>Diverse links keep the graph connected.</strong> Both panels are computed: plain "closest M" on the left, the paper's heuristic (Algorithm 4) on the right.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: how the heuristic works</summary>

HNSW doesn't simply link a new vector to its M closest candidates. Its **neighbor-selection heuristic** (Algorithm 4 in the paper) walks the candidates from nearest to farthest and keeps one only if it is closer to the new vector than to every neighbor already kept. A candidate sitting "behind" an existing neighbor is skipped, since it's reachable through that neighbor anyway.

The effect is links that point in **different directions** rather than all into one dense cluster. That matters most for clustered data: without it, two clusters can end up connected by no edges at all, and a search that starts in the wrong one never leaves. The paper reports the effect is largest for low-dimensional data, for mid-dimensional data at high recall, and for highly clustered data; for uniform, very high-dimensional data it makes little difference.

</details>

## How do M, efConstruction and efSearch affect HNSW?
{: #parameters}

<figure class="hv" data-hv="knobs">
<div class="hv-canvas"><p class="hv-fallback">Figure, three knobs: M (links per node, set at build) raises recall but costs memory and build and query time; efConstruction (beam width while building) raises graph quality and recall and costs build time only; efSearch (beam width per query) raises recall and costs query time, and can be changed without rebuilding.</p></div>
<figcaption><strong>Set M and efConstruction once, tune efSearch.</strong> efSearch is the only knob you can turn without rebuilding the index.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: typical values and each library's defaults</summary>

| Parameter | What it is | Raise it for | Cost of raising it | Typical values |
|---|---|---|---|---|
| **M** | Links per node (2M on layer 0) | Higher recall, especially at high dimensions | More memory, slower build and queries | 5-48 (the paper's range); 16 is the common default |
| **efConstruction** | Beam width while inserting | A better graph, so higher recall later | Slower build only | 40-500 |
| **efSearch** (ef) | Beam width per query, must be ≥ k | Higher recall | Slower queries | 10-500, tuned to a recall target |

The practical recipe: pick M and efConstruction once (the defaults are usually fine), then tune **efSearch** until recall hits your target, since it is the only one you can change without rebuilding. The hnswlib authors give 2-100 as a reasonable range for M, with higher M better for high-dimensional data and high recall ([hnswlib ALGO_PARAMS](https://github.com/nmslib/hnswlib/blob/master/ALGO_PARAMS.md)).

Defaults differ between libraries, so the same "HNSW" can behave differently out of the box. As of October 2026:

| Library | M | efConstruction | efSearch | Source |
|---|---:|---:|---:|---|
| hnswlib | 16 | 200 | set with `set_ef()` | [README](https://github.com/nmslib/hnswlib) |
| FAISS `IndexHNSWFlat` | you pass it | 40 | 16 | [HNSW.h](https://github.com/facebookresearch/faiss/blob/main/faiss/impl/HNSW.h) |
| pgvector 0.8 | 16 | 64 | 40 (`hnsw.ef_search`) | [README](https://github.com/pgvector/pgvector) |
| Elasticsearch | 16 (`m`) | 100 | `num_candidates` per query | [dense_vector docs](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/dense-vector) |

FAISS's efSearch of 16 and pgvector's 40 favor speed. If your recall is lower than expected, ef is the first thing to check.

</details>

## How fast is HNSW? A benchmark on 1 million vectors
{: #benchmark}

<figure class="hv" data-hv="bench">
<div class="hv-canvas"><p class="hv-fallback">Figure: recall@10 against milliseconds per query on SIFT1M for efSearch 10, 20, 40, 80, 160 and 320: recall 0.710, 0.839, 0.927, 0.975, 0.993, 0.998 at 0.048, 0.078, 0.123, 0.230, 0.400 and 0.729 ms per query. Brute force takes 9.00 ms.</p></div>
<figcaption><strong>Pick an efSearch and see what it buys.</strong> Real measurements: hnswlib, M = 16, efConstruction = 200, 1,000,000 SIFT vectors, one CPU thread.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: setup, full results table and what they show</summary>

I ran hnswlib on [SIFT1M](http://corpus-texmex.irisa.fr/), a standard ANN benchmark: 1,000,000 image descriptor vectors of 128 dimensions, 10,000 test queries, and the true nearest neighbors precomputed (I used the [ann-benchmarks](https://github.com/erikbern/ann-benchmarks) copy). The index used M = 16 and efConstruction = 200. Queries ran on **one CPU thread**, on a 4-core cloud VM, in Python 3.13 with hnswlib 0.8.0 and FAISS 1.15.1. Brute force used FAISS's exact `IndexFlatL2`, also on one thread.

| Method | efSearch | Recall@10 | Time per query | Faster than brute force | Vectors compared per query |
|---|---:|---:|---:|---:|---:|
| Brute force | | 0.999\* | 9.00 ms | 1× | 1,000,000 |
| HNSW | 10 | 0.710 | 0.048 ms | 188× | 393 |
| HNSW | 20 | 0.839 | 0.078 ms | 115× | 572 |
| HNSW | 40 | 0.927 | 0.123 ms | 73× | 904 |
| HNSW | 80 | 0.975 | 0.230 ms | 39× | 1,526 |
| HNSW | 160 | 0.993 | 0.400 ms | 23× | 2,655 |
| HNSW | 320 | 0.998 | 0.729 ms | 12× | 4,640 |

Brute force was timed on the first 1,000 queries, HNSW on all 10,000. Recall and time are from hnswlib. hnswlib doesn't report distance computations, so the last column comes from a FAISS HNSW index built with the same M and efConstruction; its recall matched hnswlib's to within 0.01 at every ef. \*Brute force scores 0.999 rather than 1.000 because a few SIFT queries have ties: different vectors at exactly the same distance.

What the numbers show:

- **The search touches very little of the data.** At ef = 80, HNSW compared each query with about 1,500 vectors instead of 1,000,000 (0.15%), found 97.5% of the true neighbors, and was 39 times faster. The time gain is smaller than the work saved (about 650×) because hopping around a graph jumps all over memory, while brute force streams through it with fast SIMD instructions.
- **Recall is a dial, not a constant.** Each doubling of ef cost 1.6 to 1.9 times the time and cut the missed neighbors by 1.8 to 4 times, from 29% at ef = 10 to 0.2% at ef = 320. Most systems settle somewhere in the 0.95-0.99 range.
- **Building is the expensive part.** The 1-million-vector index took 120 seconds to build with hnswlib on 4 threads (127 seconds with FAISS); brute force needs no build at all. The saved index was 661 MB: 512 MB of raw vectors plus about 149 MB of graph links and IDs.

Your numbers will differ with hardware, data and dimensions; the shape of the curve is what carries over. On harder data, such as uniform random vectors with no structure, recall at the same ef is much lower, as the code below shows.

</details>

## How do you use HNSW in Python?

Build an index with [hnswlib](https://github.com/nmslib/hnswlib) (by the paper's first author), then compare it with brute force at three ef values:

```python
import hnswlib
import numpy as np

rng = np.random.default_rng(42)
dim, n = 64, 20_000
vectors = rng.random((n, dim), dtype=np.float32)
queries = rng.random((100, dim), dtype=np.float32)

# Build the index: M = links per node, ef_construction = build-time beam width
index = hnswlib.Index(space="l2", dim=dim)
index.init_index(max_elements=n, M=16, ef_construction=200, random_seed=42)
index.add_items(vectors, np.arange(n), num_threads=1)  # 1 thread: same graph every run

# Exact answer for comparison: brute force over every vector
dists = ((queries[:, None, :] - vectors[None, :, :]) ** 2).sum(axis=2)
exact = np.argsort(dists, axis=1)[:, :10]

for ef in [10, 50, 200]:
    index.set_ef(ef)                      # query-time beam width
    labels, _ = index.knn_query(queries, k=10)
    recall = np.mean([len(set(labels[i]) & set(exact[i])) / 10 for i in range(len(queries))])
    print(f"ef={ef:3d}  recall@10 = {recall:.2f}")
```

Output (Python 3.13, hnswlib 0.8.0, NumPy 2.5):

```text
ef= 10  recall@10 = 0.31
ef= 50  recall@10 = 0.71
ef=200  recall@10 = 0.96
```

<details class="hv-more" markdown="1">
<summary>Read more: why recall is lower here than on SIFT</summary>

Uniform random vectors are close to the worst case for any ANN index: every point is about equally far from every other, so there is no structure to exploit. That's why recall at ef = 10 is only 0.31 here, against 0.71 on the real SIFT data, and why ef = 200 is needed to pass 0.95. Real embeddings are much more forgiving. Use `space="cosine"` or `space="ip"` for cosine similarity or inner product, which is what most text embedding models expect.

</details>

## What are the downsides of HNSW?
{: #downsides}

<figure class="hv" data-hv="memory">
<div class="hv-canvas"><p class="hv-fallback">Figure, memory calculator: for 1 million 768-dimension float32 vectors with M = 16, the raw vectors take about 3.07 GB and the graph links and IDs about 0.14 GB, about 3.22 GB in RAM in total.</p></div>
<figcaption><strong>Memory is mostly the vectors, not the graph.</strong> Change the sizes to estimate your own index (hnswlib's memory layout). That's why engines compress vectors with int8 or 1-bit quantization.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: memory, build time, deletes, filters and exactness</summary>

- **Memory.** The vectors and graph normally live in RAM. Each vector costs its raw size (dimensions × 4 bytes as float32) plus roughly M × 8-10 bytes of links ([hnswlib](https://github.com/nmslib/hnswlib/blob/master/ALGO_PARAMS.md)). For 1 million 768-dimension vectors with M = 16: about 3.1 GB of vectors and 0.14 GB of links. This is why engines pair HNSW with **quantization** (storing int8 or 1-bit versions of the vectors).
- **Slow builds.** Every insert is a search plus link updates. Building is far slower than a k-means-based IVF index.
- **Deletes are awkward.** Removing a node would break the paths through it, so libraries mark it deleted and filter it out of results; recall drifts down until a rebuild.
- **Filtered search is hard.** "Nearest vectors where `category = shoes`" can break the graph walk if most nodes fail the filter. Engines handle this in different ways (filtering during the walk, or falling back to brute force for very selective filters), and it's worth testing on your own data.
- **No exactness guarantee.** Some true neighbors are missed. For legal, deduplication or audit use cases needing exact answers, use brute force or re-check candidates.

</details>

## HNSW vs IVF vs brute force: which should you use?

<figure class="hv" data-hv="compare">
<div class="hv-canvas"><p class="hv-fallback">Figure, three indexes: brute force computes the distance to every vector (best under about 100k vectors or for exact answers; time grows with every vector). IVF scans only the clusters nearest the query (best for huge collections on little memory, with product quantization; needs training and gives lower recall at the same speed). HNSW walks a neighbor graph (best for fast, high-recall search on changing data; costs memory and build time).</p></div>
<figcaption><strong>HNSW is the sensible default</strong> for most vector search, and it's what pgvector, Elasticsearch, OpenSearch, Qdrant, Weaviate, Milvus, Redis and FAISS offer.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: comparison table and where HNSW is used</summary>

| Index | How it works | Best for | Weak spot |
|---|---|---|---|
| Brute force (flat) | Compare the query with every vector | Under ~100k vectors, or when results must be exact | Query time grows linearly |
| **HNSW** | Walk a layered neighbor graph | Low latency at high recall; data that changes over time | Memory; build time |
| IVF (+ PQ) | Scan only the k-means clusters nearest the query; PQ compresses vectors | Very large collections on limited memory | Needs training; lower recall at the same speed |
| DiskANN-style | Graph index designed to live on SSD | Billions of vectors without that much RAM | More complex to run |

If you're starting out with a vector database, HNSW is the sensible default, and it's what most of them use under the hood: [pgvector](https://github.com/pgvector/pgvector), [Elasticsearch and OpenSearch](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/dense-vector) (via Lucene), Qdrant, Weaviate, Milvus, Redis and [FAISS](https://github.com/facebookresearch/faiss) all offer it. In Elasticsearch, the HNSW graphs are built per Lucene segment, so the shard and segment ideas in my [Elasticsearch notes](/blog_posts/elasticsearchNotes.html) apply to vector search too.

HNSW sits in the same family as my post on [Bloom filters](/blog_posts/bloom_filters.html): data structures that accept a small, measurable chance of being wrong in exchange for large savings in time or space. The difference is the error. A Bloom filter can say "yes" when the answer is "no"; HNSW can miss a true neighbor, and you trade that against speed with ef.

</details>

## Sources

- Yu. A. Malkov and D. A. Yashunin, [*Efficient and robust approximate nearest neighbor search using Hierarchical Navigable Small World graphs*](https://arxiv.org/abs/1603.09320), arXiv:1603.09320 (2016); IEEE Transactions on Pattern Analysis and Machine Intelligence 42(4), 824-836 (2020).
- [hnswlib](https://github.com/nmslib/hnswlib) and its [parameter guide](https://github.com/nmslib/hnswlib/blob/master/ALGO_PARAMS.md).
- [FAISS](https://github.com/facebookresearch/faiss), [`HNSW.h`](https://github.com/facebookresearch/faiss/blob/main/faiss/impl/HNSW.h) defaults.
- [pgvector README](https://github.com/pgvector/pgvector), HNSW section (version 0.8.7).
- [Elasticsearch `dense_vector` reference](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/dense-vector), `index_options`.
- [SIFT1M dataset](http://corpus-texmex.irisa.fr/) (Jégou, Douze and Schmid) and [ann-benchmarks](https://github.com/erikbern/ann-benchmarks).
- My [interactive HNSW demo](/blog_posts/experiments/hnsw-simul/), which implements the paper's insertion, neighbor-selection and search algorithms on 2-D points.

<style>
.hnsw-embed { margin: 1.25rem 0 1.75rem; border: 1px solid var(--border, #dde3ec); border-radius: 12px; overflow: hidden; background: #fff; }
.hnsw-embed iframe { display: block; width: 100%; border: 0; }
</style>

<script defer src="/blog_posts/experiments/hnsw-simul/hnsw-post.js"></script>
<script>
// The demo reports its height (see experiments/hnsw-simul/index.html) so the iframe fits without an inner scrollbar.
window.addEventListener('message', function (e) {
  if (e.origin !== location.origin || !e.data || typeof e.data.hnswDemoHeight !== 'number') return;
  document.getElementById('hnsw-demo').height = Math.max(400, e.data.hnswDemoHeight);
});
</script>
