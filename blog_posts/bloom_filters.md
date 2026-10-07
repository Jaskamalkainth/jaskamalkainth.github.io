---
title: "Bloom Filters Explained: How They Work, False Positives and C++ Code"
description: "How a Bloom filter answers set membership with no false negatives and a tunable false-positive rate: the bit array, hash functions, formulas, real uses and C++ code."
date: 2025-03-15
last_modified_at: 2026-10-02
keywords: [Bloom filter, probabilistic data structures, false positive rate, hash functions, C++, algorithms]
categories: algorithms data-structures
math: true
related: ["/blog_posts/elasticsearchNotes.html", "/blog_posts/segment_tree_problems.html", "/blog_posts/CppNotesDb/10.html", "/blog_posts/textgrain-watermark-explained.html"]
faq:
  - q: "Can a Bloom filter have false negatives?"
    a: "No. Every inserted element sets all of its k bits, and bits are never cleared, so a lookup for an inserted element always finds all k bits set. A standard Bloom filter can only be wrong in one direction: it may report \"probably present\" for an element that was never added."
  - q: "How many hash functions should a Bloom filter use?"
    a: "The false-positive rate is lowest when k = (m/n) · ln 2, where m is the number of bits and n the number of elements. At 10 bits per element that is about 7 hash functions, giving a false-positive rate of roughly 0.8%."
  - q: "How much memory does a Bloom filter need?"
    a: "For a target false-positive rate p, the optimal size is m = −n · ln p / (ln 2)² bits, about 9.6 bits per element for 1% and 14.4 bits per element for 0.1%, no matter how large the elements themselves are."
  - q: "Can you delete elements from a Bloom filter?"
    a: "Not from a standard one: clearing a bit could also remove other elements that share it and create false negatives. A counting Bloom filter replaces each bit with a small counter so deletions are possible, at the cost of several times more memory. Cuckoo filters are another option that supports deletion."
  - q: "When should I use a Bloom filter instead of a hash set?"
    a: "Use a Bloom filter when memory is tight, a small false-positive rate is acceptable, and a negative answer lets you skip expensive work such as a disk read or network call. Use a hash set when you need exact answers, deletion, or the stored values themselves."
---

# Bloom Filters: The Art of Probably Knowing

> **In short:** a Bloom filter is a bit array plus *k* hash functions that tells you whether an element is **definitely not** in a set or **probably** in it. It never gives false negatives, its false-positive rate is tunable (about 1% at ~10 bits per element), and it uses a few bits per element regardless of element size. Databases, browsers and caches use it to skip expensive lookups for things that aren't there.

Imagine you're a bouncer at a club. You have a list of people who are banned. For every person who walks up, you need to decide: are they on the ban list?

The naive approach (scanning the entire list every time) is slow and expensive. But you don't necessarily need *certainty*. You just need a fast answer to: **"Is this person definitely NOT banned?"** If the answer is yes, let them in quickly. If there's any doubt, do the full check.

That's the intuition behind a **Bloom filter**.

## The Core Idea

A Bloom filter is a space-efficient data structure with one peculiar property:

- It can tell you with **100% certainty** that something is **not** in a set.
- It can tell you that something is **probably** in the set, but might occasionally be wrong (a false positive).

It **never** produces false negatives. If you added something, the Bloom filter will always recognize it.

This asymmetry ("definitely no" vs. "probably yes") turns out to be incredibly useful.

## How It Works (Simply)

Picture a row of light switches, all starting in the **OFF** position.

**Adding an element:**
1. Run the element through several different hash functions. Each one gives you a number.
2. Flip the switches at those numbered positions to **ON**.

**Checking if an element exists:**
1. Run the same element through the same hash functions.
2. Look at those switch positions.
3. If **any** switch is **OFF** → the element was definitely never added.
4. If **all** switches are **ON** → the element was *probably* added (but another combination of elements could have flipped those same switches).

That's it. No storing the actual elements, just flipping bits.

<div class="demo-link">
  <a href="/blog_posts/experiments/bloom-filter/index.html" class="btn btn-primary">
    <i class="fa fa-play-circle"></i> Try the Interactive Bloom Filter Demo
  </a>
</div>

## Real-World Use Cases

This might sound abstract, so let's look at where this is actually used in production systems you interact with every day.

### 1. Chrome's Safe Browsing

Every time you visit a URL, Chrome checks whether it's a known phishing or malware site. Google maintains a list of hundreds of millions of dangerous URLs.

Downloading that full list to your browser every time would be impractical. Early versions of Chrome instead kept a **Bloom filter** of dangerous URL prefixes locally (a few MB); it was later replaced by a more compact "prefix set", but the idea is the same. When you navigate to a site:

- If the Bloom filter says **"definitely not in the list"** → proceed immediately, no network call needed.
- If it says **"probably dangerous"** → Chrome makes a real network call to verify before loading the page.

The vast majority of URLs are safe, so the Bloom filter eliminates almost all network checks with zero false negatives.

### 2. Databases Avoiding Unnecessary Disk Reads (Cassandra, HBase, LevelDB)

Disk reads are orders of magnitude slower than memory reads. Databases like Cassandra and LevelDB use Bloom filters to answer: "Does this key exist in this file on disk?"

Before reading from disk, they check the Bloom filter:
- **"Definitely not here"** → skip this file entirely, saving a costly I/O operation.
- **"Probably here"** → do the actual disk read.

In LSM-tree databases a single key can live in any of many on-disk files, so this lets a read skip almost every file that doesn't contain the key. Cassandra exposes the trade-off directly as a per-table `bloom_filter_fp_chance` setting.

### 3. Medium's "Already Read" Articles

Medium used Bloom filters to track which articles a user has already seen, so they don't recommend the same article twice.

Storing every article ID a user has ever viewed in a database per user would be expensive at scale. A Bloom filter per user takes a tiny fraction of that space. A false positive just means occasionally not recommending an article the user hasn't actually read, a minor, acceptable inconvenience.

### 4. Bitcoin Lite Clients (SPV Nodes)

Bitcoin's lightweight clients (that don't download the full blockchain) use Bloom filters to ask full nodes: "Send me only transactions relevant to my wallet addresses."

The client sends a Bloom filter encoding its addresses. The full node filters transactions through it. This avoids revealing which specific addresses the client owns (partial privacy) while dramatically reducing the data sent over the wire.

### 5. Weak Password Detection

Datasets like Have I Been Pwned's list hundreds of millions of compromised passwords. Checking "has this password ever been leaked?" against a database that size on every sign-up would be slow. A Bloom filter built over the leaked-password set answers in microseconds and fits in memory: a "definitely not compromised" answer means you can skip the full lookup.

## Implementation in C++

Here's the core class, surprisingly simple:

```cpp
#include <iostream>
#include <functional>
#include <vector>
#include <string>

using namespace std;

const int MAX_BUFF_SIZE = 1e6; // ~1MB of bits

using HashFunction = function<int(const string&)>;

class BloomFilters
{
private:
    vector<char> buffer;          // our "row of switches"
    vector<HashFunction> hashFunctions; // k hash functions

public:
    BloomFilters(int bufferSize, vector<HashFunction>& functions)
    {
        buffer.resize(bufferSize);
        hashFunctions = functions;
    }

    // O(k * |string|) — flip k bits for every insert
    void insert(const string& str) 
    {
        for (auto& func: hashFunctions) 
        {
            buffer[func(str) % buffer.size()] = 1;
        }
    }

    // O(k * |string|) — check k bits; one 0 means definitely absent
    const bool isPresent(const string& str) const
    {
        for (auto& func: hashFunctions)
        {
            if (buffer[func(str) % buffer.size()] != 1)
                return false;
        }
        return true;
    }
};
```

### Hash Functions

We need multiple hash functions that spread independently. Using different polynomial bases achieves this cheaply:

```cpp
unsigned int hashFunction1(const string& str)
{
    const int b = 31;
    unsigned int res = 0;
    for (const char& ch: str)
        res = res * b + ch;
    return res;
}

unsigned int hashFunction2(const string& str)
{
    const int b = 3727;
    unsigned int res = 0;
    for (const char& ch: str)
        res = res * b + ch - '0';
    return res;
}
```

Two hash functions with different bases (31 and 3727) produce values that are largely independent, minimizing the chance that unrelated strings collide on the same set of bits.

### Putting It Together

```cpp
int main()
{
    vector<HashFunction> functions = { hashFunction1, hashFunction2 };
    BloomFilters bf(MAX_BUFF_SIZE, functions);

    bf.insert("google.com");
    bf.insert("github.com");

    cout << bf.isPresent("google.com") << "\n"; // 1 — definitely added
    cout << bf.isPresent("evil.com")   << "\n"; // 0 — definitely NOT added
    cout << bf.isPresent("github.com") << "\n"; // 1 — definitely added

    return 0;
}
```

## Understanding False Positives

The one downside: false positives. As more elements are added, more bits get flipped to 1, and eventually a *new* element's hash positions might all land on bits already set by other elements.

The false positive probability after inserting **n** elements into a filter of **m** bits with **k** hash functions is approximately:

$$
P_{fp} \approx \left(1 - e^{-kn/m}\right)^k
$$

And the optimal number of hash functions (minimizing false positives for given m and n) is:

$$
k_{opt} = \frac{m}{n} \ln 2
$$

**A concrete example:** With 1 million bits, 100,000 inserted elements (10 bits per element) and 7 hash functions (the optimum, since 10 · ln 2 ≈ 6.9), the false positive rate is roughly **0.8%**: about one in 120 lookups for absent elements will incorrectly say "probably present."

Turning that around, the bits needed for a target false-positive rate *p* are:

$$
m = -\frac{n \ln p}{(\ln 2)^2}
$$

That is about **9.6 bits per element for 1%** and **14.4 bits per element for 0.1%**, whatever the size of the elements themselves.

The key levers you control:
- **Larger bit array** (m) → fewer false positives, more memory.
- **More hash functions** (k) → fewer false positives up to a point, then they start increasing again.
- **Fewer inserted elements** (n) → fewer false positives.

## The Fundamental Trade-off

| Property | Bloom Filter | Hash Set |
|---|---|---|
| Memory usage | Very low (bits) | High (stores full values) |
| False negatives | Never | Never |
| False positives | Possible (tunable, e.g. ~1%) | Never |
| Deletion | Not supported* | Supported |
| Lookup speed | O(k) | O(1) amortized |

\* Counting Bloom filters (and cuckoo filters) support deletion at the cost of extra space.

Use a Bloom filter when you can tolerate a small false positive rate and need to minimize memory usage. Use a regular hash set when you need exact answers and memory isn't a constraint.

## Conclusion

Bloom filters are a masterclass in practical trade-offs. By accepting a small, tunable probability of false positives, they achieve memory efficiency that traditional data structures simply can't match. The "definitely not present" guarantee is the key insight: it lets you skip expensive operations (disk reads, network calls, database queries) with absolute confidence for the common case.

Next time you browse the web safely, query a distributed database, or get article recommendations, there's a good chance a Bloom filter is quietly doing work behind the scenes.

The full implementation with additional test cases and an interactive query interface is available in my [GitHub repository](https://github.com/Jaskamalkainth/BloomFilter).
