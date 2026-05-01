---
layout: post
title: Understanding Bloom Filters
date: 2025-03-15
categories: algorithms data-structures
---

<link rel="stylesheet" href="/css/blog_post.css">

# Bloom Filters: The Art of Probably Knowing

Imagine you're a bouncer at a club. You have a list of people who are banned. For every person who walks up, you need to decide: are they on the ban list?

The naive approach -scanning the entire list every time -is slow and expensive. But you don't necessarily need *certainty*. You just need a fast answer to: **"Is this person definitely NOT banned?"** If the answer is yes, let them in quickly. If there's any doubt, do the full check.

That's the intuition behind a **Bloom filter**.

## The Core Idea

A Bloom filter is a space-efficient data structure with one peculiar property:

- It can tell you with **100% certainty** that something is **not** in a set.
- It can tell you that something is **probably** in the set -but might occasionally be wrong (a false positive).

It **never** produces false negatives. If you added something, the Bloom filter will always recognize it.

This asymmetry -"definitely no" vs. "probably yes" -turns out to be incredibly useful.

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

That's it. No storing the actual elements -just flipping bits.

<div class="demo-link">
  <a href="/blog_posts/experiments/bloom-filter/index.html" class="btn btn-primary">
    <i class="fa fa-play-circle"></i> Try the Interactive Bloom Filter Demo
  </a>
</div>

## Real-World Use Cases

This might sound abstract, so let's look at where this is actually used in production systems you interact with every day.

### 1. Chrome's Safe Browsing

Every time you visit a URL, Chrome checks whether it's a known phishing or malware site. Google maintains a list of hundreds of millions of dangerous URLs.

Downloading that full list to your browser every time would be impractical. Instead, Chrome keeps a **Bloom filter** of dangerous URLs locally (a few MB). When you navigate to a site:

- If the Bloom filter says **"definitely not in the list"** → proceed immediately, no network call needed.
- If it says **"probably dangerous"** → Chrome makes a real network call to verify before loading the page.

The vast majority of URLs are safe, so the Bloom filter eliminates almost all network checks with zero false negatives.

### 2. Databases Avoiding Unnecessary Disk Reads (Cassandra, HBase, LevelDB)

Disk reads are orders of magnitude slower than memory reads. Databases like Cassandra and LevelDB use Bloom filters to answer: "Does this key exist in this file on disk?"

Before reading from disk, they check the Bloom filter:
- **"Definitely not here"** → skip this file entirely, saving a costly I/O operation.
- **"Probably here"** → do the actual disk read.

In write-heavy workloads, this can eliminate **up to 90% of unnecessary disk lookups**.

### 3. Medium's "Already Read" Articles

Medium used Bloom filters to track which articles a user has already seen -so they don't recommend the same article twice. 

Storing every article ID a user has ever viewed in a database per user would be expensive at scale. A Bloom filter per user takes a tiny fraction of that space. A false positive just means occasionally not recommending an article the user hasn't actually read -a minor, acceptable inconvenience.

### 4. Bitcoin Lite Clients (SPV Nodes)

Bitcoin's lightweight clients (that don't download the full blockchain) use Bloom filters to ask full nodes: "Send me only transactions relevant to my wallet addresses."

The client sends a Bloom filter encoding its addresses. The full node filters transactions through it. This avoids revealing which specific addresses the client owns (partial privacy) while dramatically reducing the data sent over the wire.

### 5. Weak Password Detection

Services like HaveIBeenPwned track billions of compromised passwords. Checking "has this password ever been leaked?" against a massive database on every login would be slow. A Bloom filter over the leaked password set lets you do this check in microseconds -a "definitely not compromised" answer means skip the full lookup.

## Implementation in C++

Here's the core class -it's surprisingly simple:

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

    // O(k * |string|) -flip k bits for every insert
    void insert(const string& str) 
    {
        for (auto& func: hashFunctions) 
        {
            buffer[func(str) % buffer.size()] = 1;
        }
    }

    // O(k * |string|) -check k bits; one 0 means definitely absent
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

    cout << bf.isPresent("google.com") << "\n"; // 1 -definitely added
    cout << bf.isPresent("evil.com")   << "\n"; // 0 -definitely NOT added
    cout << bf.isPresent("github.com") << "\n"; // 1 -definitely added

    return 0;
}
```

## Understanding False Positives

The one downside: false positives. As more elements are added, more bits get flipped to 1, and eventually a *new* element's hash positions might all land on bits already set by other elements.

The false positive probability after inserting **n** elements into a filter of **m** bits with **k** hash functions is approximately:

\[
P_{fp} \approx \left(1 - e^{-kn/m}\right)^k
\]

And the optimal number of hash functions (minimizing false positives for given m and n) is:

\[
k_{opt} = \frac{m}{n} \ln 2
\]

**A concrete example:** With 1 million bits and 1,000 inserted elements using 7 hash functions, the false positive rate is roughly **0.8%** -one in 125 lookups will incorrectly say "probably present."

The key levers you control:
- **Larger bit array** (m) → fewer false positives, more memory.
- **More hash functions** (k) → fewer false positives up to a point, then they start increasing again.
- **Fewer inserted elements** (n) → fewer false positives.

## The Fundamental Trade-off

| Property | Bloom Filter | Hash Set |
|---|---|---|
| Memory usage | Very low (bits) | High (stores full values) |
| False negatives | Never | Never |
| False positives | Possible (~1%) | Never |
| Deletion | Not supported* | Supported |
| Lookup speed | O(k) | O(1) amortized |

\* Counting Bloom filters support deletion at the cost of extra space.

Use a Bloom filter when you can tolerate a small false positive rate and need to minimize memory usage. Use a regular hash set when you need exact answers and memory isn't a constraint.

## Conclusion

Bloom filters are a masterclass in practical trade-offs. By accepting a small, tunable probability of false positives, they achieve memory efficiency that traditional data structures simply can't match. The "definitely not present" guarantee is the key insight -it lets you skip expensive operations (disk reads, network calls, database queries) with absolute confidence for the common case.

Next time you browse the web safely, query a distributed database, or get article recommendations -there's a good chance a Bloom filter is quietly doing work behind the scenes.

The full implementation with additional test cases and an interactive query interface is available in my [GitHub repository](https://github.com/Jaskamalkainth/BloomFilter).