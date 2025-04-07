---
layout: post
title: Understanding Bloom Filters
date: 2025-03-15
categories: algorithms data-structures
---

# Bloom Filters: A Probabilistic Data Structure

Bloom filters are space-efficient probabilistic data structures that are used to test whether an element is a member of a set. They can have false positives but never false negatives, making them perfect for certain applications where space efficiency is crucial.

## How Bloom Filters Work

A Bloom filter consists of a bit array of m bits, initially all set to 0, and k different hash functions. When inserting an element, it is hashed by all k hash functions, and the bits at the resulting k positions are set to 1.

To check if an element is in the set, we hash it with the same k hash functions and check if all the corresponding bits are set to 1. If any bit is 0, the element is definitely not in the set. If all bits are 1, the element is probably in the set.

## Implementation in C++

Below is my implementation of a Bloom filter in C++. Let's first look at the core class definition:

```cpp
#include <iostream>
#include <functional>
#include <vector>
#include <string>

using namespace std;

const int MAX_BUFF_SIZE = 1e6; // ~1MB

using HashFunction = function<int(const string&)>;

class BloomFilters
{
private:
    vector<char> buffer;
    vector<HashFunction> hashFunctions; // K hash functions

public:
    BloomFilters(int bufferSize, vector<HashFunction>& functions)
    {
        buffer.resize(bufferSize);
        hashFunctions = functions;
    }

    /*
     Inserts the input string
     TC: O(K* HFC) where HFC is hash function complexity
     HFC for below hash functions is O(|S|) where |S| is string length
    */
    void insert(const string& str) 
    {
        for (auto& func: hashFunctions) 
        {
            buffer[func(str) % buffer.size()] = 1;
        }
    }

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

The implementation consists of:
1. A bit vector (`buffer`) to store our Bloom filter
2. A vector of hash functions 
3. Methods to insert elements and check for membership

## Hash Functions

For a Bloom filter to work effectively, we need good hash functions. Here are the two hash functions I've implemented:

```cpp
unsigned int hashFunction1(const string& str)
{
    const int b = 31;
    unsigned int res = 0;
    for (const char& ch: str)
    {
        res = res*b + ch;
    }
    return res;
}

unsigned int hashFunction2(const string& str)
{
    const int b = 3727;
    unsigned int res = 0;
    for (const char& ch: str)
    {
        res = res*b + ch - '0';
    }
    return res;
}
```

These hash functions use different base values (31 and 3727) to generate distinct hash values for the same input string, reducing the likelihood of collisions.

## Usage Example

Here's how you can use the Bloom filter in practice:

```cpp
int main()
{
    vector<HashFunction> functions;
    functions.push_back(hashFunction1);
    functions.push_back(hashFunction2);
    BloomFilters *bf1 = new BloomFilters(MAX_BUFF_SIZE, functions);

    // Example of adding elements and checking membership
    bf1->insert("foo");
    
    if (bf1->isPresent("foo"))
        cout << "foo is present" << endl;
    
    if (!bf1->isPresent("bar"))
        cout << "bar is not present" << endl;
        
    // Later in your code:
    delete bf1;
    return 0;
}
```

## False Positive Rate

One of the most interesting aspects of Bloom filters is understanding their false positive rate. What is the probability that given a string S, `isPresent(S)` returns True when it was not actually inserted?

Here's the mathematical breakdown:

- When inserting a string:
  - P(bit is 1) = 1/m
  - P(bit is 0) = 1-1/m
  - P(the bit is 0 after k hash functions) = (1-1/m)^k
  - P(the bit is 0 after N insertions) = (1-1/m)^{kn}
  - P(the bit is 1 after N insertions) = 1 - (1-1/m)^{kn}
  - P(all k bits are 1 after N insertions) = (1-(1-1/m)^{kn})^k
  - This can be approximated as (1-e^{-kn/m})^k

The probability of false positives is minimized when k = (m/n) * ln(2), where:
- k is the number of hash functions
- m is the size of the bit array
- n is the number of elements inserted

## Use Cases

Bloom filters are particularly useful when:

1. **Memory is limited**: Bloom filters use significantly less space than traditional data structures.
2. **Absolute certainty isn't required**: Applications where occasional false positives are acceptable.
3. **Quick negative lookups matter**: When you want to quickly determine if something is definitely not in a set.

Common applications include:
- Caching systems (to avoid unnecessary cache lookups)
- Web browsers (to check malicious URLs)
- Databases (to avoid disk lookups for non-existent keys)
- Spell checkers
- Network routers (packet classification)

## Conclusion

Bloom filters offer an elegant tradeoff between space efficiency and accuracy. By accepting a small probability of false positives, they can represent sets using much less memory than traditional data structures. The key to using them effectively is understanding this tradeoff and choosing appropriate parameters (buffer size and number of hash functions) for your specific application needs.

The full implementation with additional test cases and an interactive query interface is available in my [GitHub repository](https://github.com/Jaskamalkainth/BloomFilter). 